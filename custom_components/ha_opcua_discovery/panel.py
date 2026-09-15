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

from .connection import connection_attributes
from .const import CONF_HUB_ID, CONF_MANUAL_NODES, CONF_NODE_SETTINGS, DOMAIN
from .device import async_register_device
from .node_settings import (
    allowed_platforms,
    effective_platform,
    update_offline_node,
    validate_settings,
)

PANEL_PATH = "opcua-nodes"
PANEL_DATA = f"{DOMAIN}_panel"


async def async_setup_panel(hass):
    if PANEL_DATA in hass.data:
        return
    version = (await async_get_integration(hass, DOMAIN)).manifest["version"]
    await hass.http.async_register_static_paths(
        [
            StaticPathConfig(
                "/opcua-discovery-panel", str(Path(__file__).parent / "www"), True
            )
        ]
    )
    await panel_custom.async_register_panel(
        hass,
        frontend_url_path=PANEL_PATH,
        webcomponent_name="opcua-node-panel",
        sidebar_title="OPC UA",
        sidebar_icon="mdi:lan-connect",
        module_url=f"/opcua-discovery-panel/panel.js?v={version}",
        require_admin=True,
    )
    websocket_api.async_register_command(hass, ws_snapshot)
    websocket_api.async_register_command(hass, ws_save)
    websocket_api.async_register_command(hass, ws_inspect)
    websocket_api.async_register_command(hass, ws_create)
    websocket_api.async_register_command(hass, ws_remove)
    hass.data[PANEL_DATA] = {"locks": {}, "version": version}


def _coordinator(hass, entry):
    return hass.data.get(DOMAIN, {}).get(entry.data[CONF_HUB_ID])


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
    manual = entry.options.get(CONF_MANUAL_NODES, {})
    nodes = {**manual, **(c.nodes if c else {})}
    for key, node in nodes.items():
        settings = entry.options.get(CONF_NODE_SETTINGS, {}).get(key, {})
        platform = effective_platform(node, settings)
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
        rows.append(
            {
                "key": key,
                "entity_id": entity_id,
                "platform": platform,
                "name": (
                    (registered.name or registered.original_name)
                    if registered
                    else node["name"]
                ),
                "custom_name": registered.name if registered else None,
                "area_id": registered.area_id if registered else None,
                "node_id": node.get("target_node_id", settings.get("node_id", key)),
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
                    k: v
                    for k, v in settings.items()
                    if k
                    in (
                        "platform",
                        "min",
                        "max",
                        "step",
                        "min_length",
                        "max_length",
                        "precision",
                        "always_available",
                    )
                },
                "manual": key in manual,
            }
        )
    revision = hashlib.sha256(
        json.dumps(
            {"options": dict(entry.options), "rows": rows}, sort_keys=True
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
        "nodes": list(available_nodes.values()),
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
    }


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
        selected = None
        if platform != "disabled":
            device = async_register_device(hass, entry)
            selected = registry.async_get_or_create(
                platform,
                DOMAIN,
                unique_id,
                config_entry=entry,
                device_id=device.id,
                original_name=c.nodes[msg["key"]]["name"],
                suggested_object_id=(
                    row["entity_id"].split(".", 1)[1]
                    if row["entity_id"]
                    else name or row["name"]
                ),
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
        if platform != row["platform"]:
            # Prevent old controls from writing while the new domain loads.
            c._platforms[msg["key"]] = "disabled"
        options = deepcopy(dict(entry.options))
        options.setdefault(CONF_NODE_SETTINGS, {})[msg["key"]] = settings
        update_offline_node(options, msg["key"], target, settings)
        reload_needed = options != dict(entry.options)
        if reload_needed:
            hass.config_entries.async_update_entry(entry, options=options)
        return {
            "saved": True,
            "reload": reload_needed,
            "entity_id": selected.entity_id if selected else None,
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
    for field in ("precision", "always_available"):
        if field in msg:
            proposed[field] = msg[field]
    limits = msg.get("limits", {})
    platform = effective_platform(node, proposed)
    allowed = (
        {"min", "max", "step"}
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
                if key in ("min", "max", "step", "min_length", "max_length")
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
        return {"removed": True, "reload": c is not None, "entity_ids": removed}


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
        vol.Optional("always_available"): bool,
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
        vol.Optional("always_available"): bool,
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
