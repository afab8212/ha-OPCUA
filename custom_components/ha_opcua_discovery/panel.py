"""Administrator panel backed by config entries and HA entity/area registries."""

import asyncio
import hashlib
import json
from copy import deepcopy
from pathlib import Path

import voluptuous as vol
from homeassistant.components import panel_custom, websocket_api
from homeassistant.components.binary_sensor import BinarySensorDeviceClass
from homeassistant.components.http import StaticPathConfig
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import entity_registry as er
from homeassistant.loader import async_get_integration

from .connection import connection_attributes
from .const import CONF_HUB_ID, CONF_NODE_SETTINGS, DOMAIN
from .node_settings import effective_platform, validate_settings

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
    hass.data[PANEL_DATA] = {"locks": {}}


def _coordinator(hass, entry):
    return hass.data.get(DOMAIN, {}).get(entry.data[CONF_HUB_ID])


def endpoint_snapshot(hass, entry):
    registry = er.async_get(hass)
    c = _coordinator(hass, entry)
    rows = []
    if c is not None:
        for key, node in c.nodes.items():
            settings = c.node_settings.get(key, {})
            platform = effective_platform(node, settings)
            entity_id = registry.async_get_entity_id(
                platform, DOMAIN, f"{entry.entry_id}:{key}"
            )
            registered = registry.async_get(entity_id) if entity_id else None
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
                    "node_id": node.get("target_node_id", key),
                    "variant_type": node["variant_type"],
                    "device_class": (
                        (registered.device_class or settings.get("device_class"))
                        if registered
                        else settings.get("device_class")
                    ),
                    "invert_state": settings.get("invert_state", False),
                    "editable": registered is not None,
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
        "nodes": list(c.discovered_nodes.values()) if c else [],
        "status_entity": registry.async_get_entity_id(
            "binary_sensor", DOMAIN, f"{entry.entry_id}:connection_status"
        ),
    }


def panel_snapshot(hass):
    return {
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
        target = c.discovered_nodes.get(msg["node_id"])
        if target is None:
            raise ValueError("node_not_found")
        saved = entry.options.get(CONF_NODE_SETTINGS, {}).get(msg["key"], {})
        # A reassignment must preserve the entity's current domain, including Auto.
        if effective_platform(target, saved) != row["platform"]:
            raise ValueError("incompatible_platform")
        settings = validate_settings(
            target,
            {
                **saved,
                "node_id": msg["node_id"],
                "invert_state": msg["invert_state"],
                "device_class": msg["device_class"],
            },
        )
        area_id = msg["area_id"]
        if area_id is not None and ar.async_get(hass).async_get_area(area_id) is None:
            raise ValueError("area_not_found")
        name = msg["name"].strip() or None
        if name is not None and len(name) > 255:
            raise ValueError("invalid_name")
        registry = er.async_get(hass)
        registry_changes = {"name": name, "area_id": area_id}
        if row["platform"] == "binary_sensor":
            registry_changes["device_class"] = None
        registry.async_update_entity(row["entity_id"], **registry_changes)
        options = deepcopy(dict(entry.options))
        options.setdefault(CONF_NODE_SETTINGS, {})[msg["key"]] = settings
        reload_needed = options != dict(entry.options)
        if reload_needed:
            hass.config_entries.async_update_entry(entry, options=options)
        return {"saved": True, "reload": reload_needed}


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
