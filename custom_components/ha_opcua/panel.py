"""Administrator panel backed by config entries and HA entity/area registries."""

import asyncio
import hashlib
import json
from copy import deepcopy
from pathlib import Path

import voluptuous as vol
from asyncua import ua
from homeassistant.components import panel_custom, websocket_api
from homeassistant.components.binary_sensor import BinarySensorDeviceClass
from homeassistant.components.http import StaticPathConfig
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import entity_registry as er
from homeassistant.loader import async_get_integration

from .arrays import array_element_name, parse_array_element
from .connection import connection_attributes
from .const import (
    CONF_HUB_ID,
    CONF_MANUAL_NODES,
    CONF_NODE_SETTINGS,
    CONF_OFFLINE_NODES,
    CONF_SUBSCRIPTION_ENABLED,
    DOMAIN,
)
from .device import async_register_device
from .node_settings import (
    allowed_platforms,
    effective_platform,
    standard_units,
    update_offline_node,
    validate_settings,
)
from .orphans import (
    _reload_options,
    async_remove_orphan,
    async_sync_orphan_repairs,
    is_orphan,
)

SNAPSHOT_SETTINGS = (
    "platform",
    "min",
    "max",
    "step",
    "deadband",
    "min_length",
    "max_length",
    "precision",
    "always_available",
    "update_mode",
    "unit_of_measurement",
)

PANEL_PATH = "opcua-nodes"
PANEL_DATA = f"{DOMAIN}_panel"


async def async_setup_panel(hass):
    if PANEL_DATA in hass.data:
        return
    version = (await async_get_integration(hass, DOMAIN)).manifest["version"]
    # Invalidate cached frontend assets even for panel-only updates.
    panel_source = await hass.async_add_executor_job(
        (Path(__file__).parent / "www" / "panel.js").read_bytes
    )
    panel_hash = hashlib.sha256(panel_source).hexdigest()[:16]
    await hass.http.async_register_static_paths(
        [StaticPathConfig("/ha-opcua-panel", str(Path(__file__).parent / "www"), True)]
    )
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_PATH,
        webcomponent_name="opcua-node-panel",
        sidebar_title="OPC UA Connect",
        sidebar_icon="mdi:lan-connect",
        module_url=f"/ha-opcua-panel/panel.js?v={version}&panel={panel_hash}",
        require_admin=True,
    )
    websocket_api.async_register_command(hass, ws_snapshot)
    websocket_api.async_register_command(hass, ws_save)
    websocket_api.async_register_command(hass, ws_inspect)
    websocket_api.async_register_command(hass, ws_create)
    websocket_api.async_register_command(hass, ws_remove)
    websocket_api.async_register_command(hass, ws_rediscover)
    websocket_api.async_register_command(hass, ws_remove_orphan)
    websocket_api.async_register_command(hass, ws_remove_orphans)
    websocket_api.async_register_command(hass, ws_reclassify_boolean_sensors)
    websocket_api.async_register_command(hass, ws_rename_array_fields)
    hass.data[PANEL_DATA] = {"locks": {}, "version": version}


def _coordinator(hass, entry):
    return hass.data.get(DOMAIN, {}).get(entry.data[CONF_HUB_ID])


def _is_auto_readonly_boolean(node, settings):
    """A read-only Boolean left on Auto - the smart default a new one gets.

    Never matches a node with any explicit platform choice, including an
    explicit "sensor" - reclassifying is opt-in per node, not just per type.
    """
    return (
        node["variant_type"] == "Boolean"
        and not node["writable"]
        and settings.get("platform", "auto") == "auto"
    )


def _is_unrenamed_array_field(node_id, name, custom_name, parsed_array):
    """A field of a PLC array-of-struct element still showing its raw, colliding name.

    Never matches a row with a custom name already set - a past rename,
    even to the same words, is a deliberate choice and is never
    overridden, the same guard the Boolean reclassify action uses for an
    explicit platform choice.
    """
    if custom_name is not None or parsed_array is None:
        return False
    return array_element_name(node_id, parsed_array["field"]) != name


def _panel_nodes(coordinator):
    """Prefer live discovery, retaining verified metadata for offline editors."""
    return {
        **{node["node_id"]: node for node in coordinator.offline_nodes.values()},
        **coordinator.discovered_nodes,
    }


def endpoint_snapshot(hass, entry):
    registry = er.async_get(hass)
    c = _coordinator(hass, entry)
    available_nodes = _panel_nodes(c) if c else {}
    rows = []
    reclassifiable_booleans = 0
    renamable_array_fields = 0
    manual = entry.options.get(CONF_MANUAL_NODES, {})
    nodes = {**manual, **(c.nodes if c else {})}
    for key, node in nodes.items():
        settings = entry.options.get(CONF_NODE_SETTINGS, {}).get(key, {})
        platform = effective_platform(node, settings)
        reclassifiable = _is_auto_readonly_boolean(node, settings)
        if reclassifiable:
            reclassifiable_booleans += 1
        entity_id = registry.async_get_entity_id(
            platform, DOMAIN, f"{entry.entry_id}:{key}"
        )
        registered = registry.async_get(entity_id) if entity_id else None
        if registered is None and platform == "disabled":
            registered = next(
                (
                    e
                    for e in er.async_entries_for_config_entry(registry, entry.entry_id)
                    if e.platform == DOMAIN and e.unique_id == f"{entry.entry_id}:{key}"
                ),
                None,
            )
            entity_id = registered.entity_id if registered else None
        node_id = node.get("target_node_id", settings.get("node_id", key))
        name = (
            (registered.name or registered.original_name)
            if registered
            else node["name"]
        )
        custom_name = registered.name if registered else None
        parsed_array = parse_array_element(node_id)
        renamable = _is_unrenamed_array_field(node_id, name, custom_name, parsed_array)
        if renamable:
            renamable_array_fields += 1
        rows.append(
            {
                "key": key,
                "entity_id": entity_id,
                "platform": platform,
                "name": name,
                "custom_name": custom_name,
                "area_id": registered.area_id if registered else None,
                "node_id": node_id,
                "array_group": parsed_array["group_key"] if parsed_array else None,
                "array_label": (
                    f"{parsed_array['array']} {parsed_array['index']}"
                    if parsed_array
                    else None
                ),
                "array_field": parsed_array["field"] if parsed_array else None,
                "array_index": parsed_array["index"] if parsed_array else None,
                "proposed_name": (
                    array_element_name(node_id, parsed_array["field"])
                    if parsed_array
                    else None
                ),
                "renamable": renamable,
                "variant_type": node["variant_type"],
                "device_class": (
                    (registered.device_class or settings.get("device_class"))
                    if registered
                    else settings.get("device_class")
                ),
                "invert_state": settings.get("invert_state", False),
                "editable": bool(
                    c
                    and key in c.nodes
                    and node.get("target_node_id", settings.get("node_id", key))
                    in available_nodes
                ),
                "settings": {
                    k: v for k, v in settings.items() if k in SNAPSHOT_SETTINGS
                },
                "manual": key in manual,
                "orphan": False,
                "reclassifiable": reclassifiable,
            }
        )
    # Entities whose node vanished from the PLC (or that a category change
    # left behind) are not in c.nodes and would otherwise silently disappear
    # from the panel. List them as read-only "orphan" rows with a delete
    # action, so the user sees the result of a rediscover right here.
    listed_entities = {row["entity_id"] for row in rows}
    prefix = f"{entry.entry_id}:"
    for entity in er.async_entries_for_config_entry(registry, entry.entry_id):
        if entity.entity_id in listed_entities or not is_orphan(hass, entry, entity):
            continue
        key = entity.unique_id[len(prefix) :]
        settings = entry.options.get(CONF_NODE_SETTINGS, {}).get(key, {})
        cached = entry.options.get(CONF_OFFLINE_NODES, {}).get(key, {})
        rows.append(
            {
                "key": key,
                "entity_id": entity.entity_id,
                "platform": entity.domain,
                "name": entity.name or entity.original_name or entity.entity_id,
                "custom_name": entity.name,
                "area_id": entity.area_id,
                "node_id": settings.get("node_id", key),
                "variant_type": cached.get("variant_type"),
                "device_class": entity.device_class or settings.get("device_class"),
                "invert_state": settings.get("invert_state", False),
                "editable": False,
                "settings": {
                    k: v for k, v in settings.items() if k in SNAPSHOT_SETTINGS
                },
                "manual": False,
                "orphan": True,
                "reclassifiable": False,
                "array_group": None,
                "array_label": None,
                "array_field": None,
                "array_index": None,
                "proposed_name": None,
                "renamable": False,
            }
        )
    revision = hashlib.sha256(
        json.dumps(
            {
                # A live master toggle does not change the entity editor's data.
                # Saves merge into current options, preserving its latest value.
                "options": {
                    key: value
                    for key, value in entry.options.items()
                    if key != CONF_SUBSCRIPTION_ENABLED
                },
                "rows": rows,
            },
            sort_keys=True,
        ).encode()
    ).hexdigest()
    endpoint = connection_attributes(c)["endpoint"] if c else None
    return {
        "entry_id": entry.entry_id,
        "title": entry.title,
        "endpoint": endpoint,
        "loaded": c is not None,
        "connected": bool(c and c.enabled and c.hub.is_connected),
        "revision": revision,
        "rows": rows,
        "reclassifiable_booleans": reclassifiable_booleans,
        "renamable_array_fields": renamable_array_fields,
        "nodes": list(available_nodes.values()),
        "subscription_entity": registry.async_get_entity_id(
            "switch", DOMAIN, f"{entry.entry_id}:subscription_enabled"
        ),
        "status_entity": registry.async_get_entity_id(
            "binary_sensor", DOMAIN, f"{entry.entry_id}:connection_status"
        ),
    }


def panel_snapshot(hass):
    return {
        "version": hass.data.get(PANEL_DATA, {}).get("version"),
        "endpoints": [
            endpoint_snapshot(hass, entry)
            for entry in hass.config_entries.async_entries(DOMAIN)
        ],
        "areas": [
            {"id": area.id, "name": area.name}
            for area in ar.async_get(hass).async_list_areas()
        ],
        "device_classes": sorted(item.value for item in BinarySensorDeviceClass),
        "units": standard_units(),
    }


def _migrate_entity_registry(
    hass, entry, node, key, platform, related, *, name, area_id, suggested_object_id
):
    """Move a node's registered entity to `platform`, preserving name/area.

    Any other related entry (same unique_id, different platform) is left
    disabled instead of dangling, matching a manual category change. Shared
    by a panel-driven edit and the bulk Boolean reclassification so both go
    through identical registry handling.
    """
    registry = er.async_get(hass)
    unique_id = f"{entry.entry_id}:{key}"
    selected = None
    if platform != "disabled":
        device = async_register_device(hass, entry)
        selected = registry.async_get_or_create(
            platform,
            DOMAIN,
            unique_id,
            config_entry=entry,
            device_id=device.id,
            original_name=node["name"],
            suggested_object_id=suggested_object_id,
        )
        changes = {"name": name, "area_id": area_id}
        if platform == "binary_sensor":
            changes["device_class"] = None
        if selected.disabled_by == er.RegistryEntryDisabler.INTEGRATION:
            changes["disabled_by"] = None
        registry.async_update_entity(selected.entity_id, **changes)
    for old in related:
        if selected is not None and old.entity_id == selected.entity_id:
            continue
        changes = {"name": name, "area_id": area_id}
        if old.disabled_by is None:
            changes["disabled_by"] = er.RegistryEntryDisabler.INTEGRATION
        registry.async_update_entity(old.entity_id, **changes)
    return selected.entity_id if selected else None


async def async_save_entity(hass, msg):
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if entry is None or entry.domain != DOMAIN:
        raise ValueError("endpoint_not_found")
    lock = hass.data.setdefault(PANEL_DATA, {"locks": {}})["locks"].setdefault(
        entry.entry_id, asyncio.Lock()
    )
    async with lock:
        snapshot = endpoint_snapshot(hass, entry)
        if snapshot["revision"] != msg["revision"]:
            raise ValueError("stale_configuration")
        c = _coordinator(hass, entry)
        if c is None:
            raise ValueError("endpoint_not_loaded")
        row = next(
            (item for item in snapshot["rows"] if item["key"] == msg["key"]), None
        )
        if row is None or not row["editable"]:
            raise ValueError("entity_not_ready")
        target = _panel_nodes(c).get(msg["node_id"])
        if target is None:
            raise ValueError("node_not_found")
        saved = entry.options.get(CONF_NODE_SETTINGS, {}).get(msg["key"], {})
        # A reassignment must preserve the entity's current domain, including Auto.
        if (
            "platform" not in msg
            and effective_platform(target, saved) != row["platform"]
        ):
            raise ValueError("incompatible_platform")
        settings = _entity_settings(target, msg, saved)
        area_id = msg["area_id"]
        if area_id is not None and ar.async_get(hass).async_get_area(area_id) is None:
            raise ValueError("area_not_found")
        name = msg["name"].strip() or None
        if name is not None and len(name) > 255:
            raise ValueError("invalid_name")
        registry = er.async_get(hass)
        platform = effective_platform(target, settings)
        unique_id = f"{entry.entry_id}:{msg['key']}"
        related = [
            e
            for e in er.async_entries_for_config_entry(registry, entry.entry_id)
            if e.platform == DOMAIN and e.unique_id == unique_id
        ]
        selected_entity_id = _migrate_entity_registry(
            hass,
            entry,
            c.nodes[msg["key"]],
            msg["key"],
            platform,
            related,
            name=name,
            area_id=area_id,
            suggested_object_id=(
                row["entity_id"].split(".", 1)[1]
                if row["entity_id"]
                else name or row["name"]
            ),
        )
        if platform != row["platform"]:
            # Prevent old controls from writing while the new domain loads.
            c._platforms[msg["key"]] = "disabled"
        options = deepcopy(dict(entry.options))
        options.setdefault(CONF_NODE_SETTINGS, {})[msg["key"]] = settings
        update_offline_node(options, msg["key"], target, settings)
        reload_needed = options != dict(entry.options)
        if reload_needed:
            hass.config_entries.async_update_entry(entry, options=options)
        async_sync_orphan_repairs(hass, entry)
        return {
            "saved": True,
            "reload": reload_needed,
            "entity_id": selected_entity_id,
        }


def _entity_settings(node, msg, saved=None):
    """Validate panel fields with the same type/range rules as entity setup."""
    proposed = {
        **(saved or {}),
        "node_id": node["node_id"],
        "invert_state": msg["invert_state"],
        "device_class": msg["device_class"],
    }
    if "platform" in msg:
        proposed["platform"] = msg["platform"]
    for field in (
        "precision",
        "deadband",
        "always_available",
        "update_mode",
        "unit_of_measurement",
    ):
        if field in msg:
            proposed[field] = msg[field]
    limits = msg.get("limits", {})
    platform = effective_platform(node, proposed)
    allowed = (
        {"min", "max", "step", "deadband"}
        if platform == "number"
        else {"min_length", "max_length"} if platform == "text" else set()
    )
    if not isinstance(limits, dict) or set(limits) - allowed:
        raise ValueError("invalid_limits")
    result = validate_settings(node, {**proposed, **limits})
    if platform == "disabled":
        # Exclusion pauses a node; keep its editing bounds for reactivation.
        result.update(
            {
                key: value
                for key, value in (saved or {}).items()
                if key in ("min", "max", "step", "deadband", "min_length", "max_length")
            }
        )
    return result


def _loaded_endpoint(hass, entry_id):
    entry = hass.config_entries.async_get_entry(entry_id)
    if entry is None or entry.domain != DOMAIN:
        raise ValueError("endpoint_not_found")
    c = _coordinator(hass, entry)
    if c is None:
        raise ValueError("endpoint_not_loaded")
    if not c.enabled:
        raise ValueError("connection_disabled")
    return entry, c


async def _inspect(c, node_id):
    try:
        return await c.hub.inspect_node(node_id)
    except ua.UaStatusCodeError as err:
        raise ValueError("node_unreadable") from err
    except (ConnectionError, TimeoutError, OSError, HomeAssistantError) as err:
        raise ValueError("connection_failed") from err


async def async_inspect_node(hass, msg):
    entry, c = _loaded_endpoint(hass, msg["entry_id"])
    node = await _inspect(c, msg["node_id"])
    return {
        "node": node,
        "platforms": [
            p for p in allowed_platforms(node) if p not in ("auto", "disabled")
        ],
    }


async def async_create_entity(hass, msg):
    entry, c = _loaded_endpoint(hass, msg["entry_id"])
    lock = hass.data.setdefault(PANEL_DATA, {"locks": {}})["locks"].setdefault(
        entry.entry_id, asyncio.Lock()
    )
    async with lock:
        if endpoint_snapshot(hass, entry)["revision"] != msg["revision"]:
            raise ValueError("stale_configuration")
        # Re-read at save time: the client cannot supply type/write permissions.
        node = await _inspect(c, msg["node_id"])
        if (
            _coordinator(hass, entry) is not c
            or endpoint_snapshot(hass, entry)["revision"] != msg["revision"]
        ):
            raise ValueError("stale_configuration")
        if not c.enabled:
            raise ValueError("connection_disabled")
        node_id = node["node_id"]
        if (
            node_id in c.nodes
            or node_id in entry.options.get(CONF_MANUAL_NODES, {})
            or any(n.get("target_node_id") == node_id for n in c.nodes.values())
        ):
            raise ValueError("node_already_configured")
        if msg["platform"] in ("auto", "disabled"):
            raise ValueError("incompatible_platform")
        settings = _entity_settings(node, msg)
        area_id = msg["area_id"]
        if area_id is not None and ar.async_get(hass).async_get_area(area_id) is None:
            raise ValueError("area_not_found")
        name = msg["name"].strip() or None
        if name is not None and len(name) > 255:
            raise ValueError("invalid_name")
        registry = er.async_get(hass)
        unique_id = f"{entry.entry_id}:{node_id}"
        if any(
            e.unique_id == unique_id
            for e in er.async_entries_for_config_entry(registry, entry.entry_id)
        ):
            raise ValueError("node_already_configured")
        options = deepcopy(dict(entry.options))
        options.setdefault(CONF_MANUAL_NODES, {})[node_id] = node
        options.setdefault(CONF_NODE_SETTINGS, {})[node_id] = settings
        update_offline_node(options, node_id, node, settings)
        device = async_register_device(hass, entry)
        registered = registry.async_get_or_create(
            msg["platform"],
            DOMAIN,
            unique_id,
            config_entry=entry,
            suggested_object_id=name or node["name"],
            original_name=node["name"],
            device_id=device.id,
        )
        registry.async_update_entity(registered.entity_id, name=name, area_id=area_id)
        hass.config_entries.async_update_entry(entry, options=options)
        return {"saved": True, "reload": True, "entity_id": registered.entity_id}


async def async_remove_manual_node(hass, msg):
    """Remove only a persisted manual node, without needing a live PLC connection."""
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if entry is None or entry.domain != DOMAIN:
        raise ValueError("endpoint_not_found")
    lock = hass.data.setdefault(PANEL_DATA, {"locks": {}})["locks"].setdefault(
        entry.entry_id, asyncio.Lock()
    )
    async with lock:
        if endpoint_snapshot(hass, entry)["revision"] != msg["revision"]:
            raise ValueError("stale_configuration")
        key = msg["key"]
        if key not in entry.options.get(CONF_MANUAL_NODES, {}):
            raise ValueError("not_manual_node")
        mappings = entry.options.get(CONF_NODE_SETTINGS, {})
        if any(
            other != key and settings.get("node_id") == key
            for other, settings in mappings.items()
        ):
            raise ValueError("node_in_use")
        options = deepcopy(dict(entry.options))
        del options[CONF_MANUAL_NODES][key]
        if not options[CONF_MANUAL_NODES]:
            options.pop(CONF_MANUAL_NODES)
        # Discovery may find this physical node later. Keep it excluded until the
        # user explicitly re-enables it or adds it manually again.
        options.setdefault(CONF_NODE_SETTINGS, {})[key] = {"platform": "disabled"}
        update_offline_node(options, key, {}, {})
        c = _coordinator(hass, entry)
        if c is not None:
            c.manual_nodes.pop(key, None)
            c.offline_nodes.pop(key, None)
            c._manual_pending.discard(key)
            c.node_settings[key] = {"platform": "disabled"}
            c._platforms[key] = "disabled"
        registry = er.async_get(hass)
        removed = []
        for entity in er.async_entries_for_config_entry(registry, entry.entry_id):
            # Also clean up old domains left by earlier platform changes.
            if (
                entity.platform == DOMAIN
                and entity.unique_id == f"{entry.entry_id}:{key}"
            ):
                removed.append(entity.entity_id)
                registry.async_remove(entity.entity_id)
        hass.config_entries.async_update_entry(entry, options=options)
        async_sync_orphan_repairs(hass, entry)
        return {"removed": True, "reload": c is not None, "entity_ids": removed}


async def async_rediscover(hass, msg):
    """Force a fresh OPC UA discovery pass without a full config entry reload."""
    entry, c = _loaded_endpoint(hass, msg["entry_id"])
    await c.async_request_rediscovery()
    return {"rediscovered": True}


async def async_remove_orphan_entity(hass, msg):
    """Delete one orphaned entity (node gone / stale domain) from the panel.

    Re-validates orphan status under the endpoint lock right before deleting,
    exactly like the Repairs fix flow does.
    """
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if entry is None or entry.domain != DOMAIN:
        raise ValueError("endpoint_not_found")
    lock = hass.data.setdefault(PANEL_DATA, {"locks": {}})["locks"].setdefault(
        entry.entry_id, asyncio.Lock()
    )
    async with lock:
        if endpoint_snapshot(hass, entry)["revision"] != msg["revision"]:
            raise ValueError("stale_configuration")
        registry = er.async_get(hass)
        entity = registry.async_get(msg["entity_id"])
        if (
            entity is None
            or entity.config_entry_id != entry.entry_id
            or not is_orphan(hass, entry, entity)
        ):
            raise ValueError("not_orphan")
        async_remove_orphan(hass, entry, entity)
        async_sync_orphan_repairs(hass, entry)
        return {"removed": True, "entity_id": entity.entity_id}


async def async_remove_all_orphans(hass, msg):
    """Delete every currently orphaned entity of one endpoint in a single step.

    Needed when a root NodeId change or a provider switch on the PLC orphans
    dozens of entities at once - clicking through Repairs one by one is not
    practical. Same revision check and per-entity re-validation as the
    single-entity variant.
    """
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if entry is None or entry.domain != DOMAIN:
        raise ValueError("endpoint_not_found")
    lock = hass.data.setdefault(PANEL_DATA, {"locks": {}})["locks"].setdefault(
        entry.entry_id, asyncio.Lock()
    )
    async with lock:
        if endpoint_snapshot(hass, entry)["revision"] != msg["revision"]:
            raise ValueError("stale_configuration")
        registry = er.async_get(hass)
        removed = []
        for entity in list(er.async_entries_for_config_entry(registry, entry.entry_id)):
            if is_orphan(hass, entry, entity):
                removed.append(entity.entity_id)
                async_remove_orphan(hass, entry, entity)
        async_sync_orphan_repairs(hass, entry)
        return {"removed": removed}


async def async_reclassify_boolean_sensors(hass, msg):
    """Explicitly opt selected read-only Boolean sensors into binary_sensor.

    A newly discovered read-only Boolean node already gets binary_sensor by
    default; this never applies retroactively on its own (see set_nodes()),
    so an installation with Boolean nodes discovered before that default
    existed is stuck with plain sensors showing a raw "True"/"False" state
    unless it opts in here, one endpoint at a time. Only nodes still left on
    Auto are eligible - an explicit past choice (including an explicit
    "sensor") is never overridden.

    `msg["keys"]` is the caller's selection (the panel lets the user pick
    which eligible entities to convert instead of an all-or-nothing action).
    Each key is re-validated against the current live state rather than
    trusted as-is, since it may be stale by the time the user confirms; a
    key that is missing or no longer eligible is silently skipped, matching
    how the rest of this action already tolerates a state that moved on.

    Applies the change to the live coordinator directly (mirroring a normal
    discovery-driven classification) instead of forcing a full reload: the
    new binary_sensor entities appear via the platform's own discovery
    listener, and the old sensor entities are picked up by the orphan
    detection right away, ready for the existing "Delete all missing" flow.

    The old sensor's custom name and area, if any, are carried over to the
    new binary_sensor (same registry handling a manual category change
    uses), and the old entity is left disabled instead of dangling enabled
    - a normal category change leaves it exactly that way too.
    """
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if entry is None or entry.domain != DOMAIN:
        raise ValueError("endpoint_not_found")
    lock = hass.data.setdefault(PANEL_DATA, {"locks": {}})["locks"].setdefault(
        entry.entry_id, asyncio.Lock()
    )
    async with lock:
        if endpoint_snapshot(hass, entry)["revision"] != msg["revision"]:
            raise ValueError("stale_configuration")
        c = _coordinator(hass, entry)
        if c is None:
            raise ValueError("endpoint_not_loaded")
        registry = er.async_get(hass)
        options = deepcopy(dict(entry.options))
        node_settings_opt = options.setdefault(CONF_NODE_SETTINGS, {})
        reclassified = []
        for key in dict.fromkeys(msg["keys"]):
            node = c.nodes.get(key)
            if node is None:
                continue
            saved = entry.options.get(CONF_NODE_SETTINGS, {}).get(key, {})
            if not _is_auto_readonly_boolean(node, saved):
                continue
            settings = validate_settings(node, {**saved, "platform": "binary_sensor"})
            node_settings_opt[key] = settings
            c.node_settings[key] = settings
            c._platforms[key] = "binary_sensor"
            reclassified.append(key)
            unique_id = f"{entry.entry_id}:{key}"
            related = [
                e
                for e in er.async_entries_for_config_entry(registry, entry.entry_id)
                if e.platform == DOMAIN and e.unique_id == unique_id
            ]
            _migrate_entity_registry(
                hass,
                entry,
                node,
                key,
                "binary_sensor",
                related,
                name=next((e.name for e in related if e.name is not None), None),
                area_id=next(
                    (e.area_id for e in related if e.area_id is not None), None
                ),
                suggested_object_id=(
                    related[0].entity_id.split(".", 1)[1] if related else None
                ),
            )
        if not reclassified:
            return {"reclassified": []}
        # Already applied above; sync so async_options_updated takes its
        # "apply live, don't reload" branch instead of racing a reload
        # against the live change just made (same reasoning as
        # _persist_discovery_state in __init__.py).
        c.reload_options = _reload_options(options)
        hass.config_entries.async_update_entry(entry, options=options)
        c.async_update_listeners()
        async_sync_orphan_repairs(hass, entry)
        return {"reclassified": reclassified}


async def async_rename_array_fields(hass, msg):
    """Explicitly disambiguate selected PLC array-of-struct fields by index.

    A field inside one element of a PLC array-of-struct (e.g.
    "astMeldungen[10].xAktiv") shares its raw name with every other
    element; set_nodes() only disambiguates this for a newly discovered
    node (see its own docstring), never retroactively for one an
    installation already has. This lets the user opt in per entity,
    setting the same disambiguated text a new node gets by default as
    the entity's custom name - exactly like a manual rename through the
    entity editor, just for many at once.

    `msg["keys"]` is the caller's selection; each key is re-validated
    against a fresh snapshot rather than trusted as-is, since it may be
    stale by the time the user confirms (a manual rename or a category
    change elsewhere makes a key no longer eligible).
    """
    entry = hass.config_entries.async_get_entry(msg["entry_id"])
    if entry is None or entry.domain != DOMAIN:
        raise ValueError("endpoint_not_found")
    lock = hass.data.setdefault(PANEL_DATA, {"locks": {}})["locks"].setdefault(
        entry.entry_id, asyncio.Lock()
    )
    async with lock:
        snapshot = endpoint_snapshot(hass, entry)
        if snapshot["revision"] != msg["revision"]:
            raise ValueError("stale_configuration")
        if _coordinator(hass, entry) is None:
            raise ValueError("endpoint_not_loaded")
        registry = er.async_get(hass)
        rows_by_key = {row["key"]: row for row in snapshot["rows"]}
        renamed = []
        for key in dict.fromkeys(msg["keys"]):
            row = rows_by_key.get(key)
            if row is None or not row["renamable"] or not row["entity_id"]:
                continue
            registry.async_update_entity(row["entity_id"], name=row["proposed_name"])
            renamed.append(key)
        return {"renamed": renamed}


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/node/remove",
        vol.Required("entry_id"): str,
        vol.Required("revision"): str,
        vol.Required("key"): str,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_remove(hass, connection, msg):
    try:
        result = await async_remove_manual_node(hass, msg)
    except ValueError as err:
        connection.send_error(msg["id"], str(err), str(err))
    else:
        connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/endpoint/rediscover",
        vol.Required("entry_id"): str,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_rediscover(hass, connection, msg):
    try:
        result = await async_rediscover(hass, msg)
    except ValueError as err:
        connection.send_error(msg["id"], str(err), str(err))
    else:
        connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/entity/remove_orphan",
        vol.Required("entry_id"): str,
        vol.Required("revision"): str,
        vol.Required("entity_id"): str,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_remove_orphan(hass, connection, msg):
    try:
        result = await async_remove_orphan_entity(hass, msg)
    except ValueError as err:
        connection.send_error(msg["id"], str(err), str(err))
    else:
        connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/entity/remove_orphans",
        vol.Required("entry_id"): str,
        vol.Required("revision"): str,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_remove_orphans(hass, connection, msg):
    try:
        result = await async_remove_all_orphans(hass, msg)
    except ValueError as err:
        connection.send_error(msg["id"], str(err), str(err))
    else:
        connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/entity/reclassify_boolean_sensors",
        vol.Required("entry_id"): str,
        vol.Required("revision"): str,
        vol.Required("keys"): [str],
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_reclassify_boolean_sensors(hass, connection, msg):
    try:
        result = await async_reclassify_boolean_sensors(hass, msg)
    except ValueError as err:
        connection.send_error(msg["id"], str(err), str(err))
    else:
        connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/entity/rename_array_fields",
        vol.Required("entry_id"): str,
        vol.Required("revision"): str,
        vol.Required("keys"): [str],
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_rename_array_fields(hass, connection, msg):
    try:
        result = await async_rename_array_fields(hass, msg)
    except ValueError as err:
        connection.send_error(msg["id"], str(err), str(err))
    else:
        connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/node/inspect",
        vol.Required("entry_id"): str,
        vol.Required("node_id"): str,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_inspect(hass, connection, msg):
    try:
        result = await async_inspect_node(hass, msg)
    except ValueError as err:
        connection.send_error(msg["id"], str(err), str(err))
    else:
        connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/entity/create",
        vol.Required("entry_id"): str,
        vol.Required("revision"): str,
        vol.Required("node_id"): str,
        vol.Required("platform"): str,
        vol.Optional("limits"): dict,
        vol.Optional("precision"): vol.Any(int, None),
        vol.Optional("deadband"): vol.Any(int, float, None),
        vol.Optional("always_available"): bool,
        vol.Optional("update_mode"): vol.In(("polling", "subscription")),
        vol.Optional("unit_of_measurement"): vol.Any(str, None),
        vol.Required("name"): str,
        vol.Required("area_id"): vol.Any(str, None),
        vol.Required("device_class"): vol.Any(str, None),
        vol.Required("invert_state"): bool,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_create(hass, connection, msg):
    try:
        result = await async_create_entity(hass, msg)
    except ValueError as err:
        connection.send_error(msg["id"], str(err), str(err))
    else:
        connection.send_result(msg["id"], result)


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/panel"})
@websocket_api.require_admin
@websocket_api.async_response
async def ws_snapshot(hass, connection, msg):
    connection.send_result(msg["id"], panel_snapshot(hass))


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/entity/update",
        vol.Required("entry_id"): str,
        vol.Required("revision"): str,
        vol.Required("key"): str,
        vol.Optional("platform"): str,
        vol.Optional("limits"): dict,
        vol.Optional("precision"): vol.Any(int, None),
        vol.Optional("deadband"): vol.Any(int, float, None),
        vol.Optional("always_available"): bool,
        vol.Optional("update_mode"): vol.In(("polling", "subscription")),
        vol.Optional("unit_of_measurement"): vol.Any(str, None),
        vol.Required("name"): str,
        vol.Required("area_id"): vol.Any(str, None),
        vol.Required("node_id"): str,
        vol.Required("device_class"): vol.Any(str, None),
        vol.Required("invert_state"): bool,
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_save(hass, connection, msg):
    try:
        result = await async_save_entity(hass, msg)
    except ValueError as err:
        connection.send_error(msg["id"], str(err), str(err))
    else:
        connection.send_result(msg["id"], result)
