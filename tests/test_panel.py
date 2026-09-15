"""Panel authorization, registry edits, stable node remapping and boolean semantics."""

import json
from copy import deepcopy
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch

import pytest
from homeassistant.exceptions import Unauthorized
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import entity_registry as er

from custom_components.ha_opcua_discovery import (
    AsyncuaCoordinator,
    OpcuaHub,
    entity_unique_id,
)
from custom_components.ha_opcua_discovery.binary_sensor import AsyncuaBinarySensor
from custom_components.ha_opcua_discovery.config_flow import AsyncUAOptionsFlow
from custom_components.ha_opcua_discovery.const import CONF_NODE_SETTINGS, DOMAIN
from custom_components.ha_opcua_discovery.panel import (
    async_save_entity,
    async_setup_panel,
    endpoint_snapshot,
    panel_snapshot,
    ws_create,
    ws_inspect,
    ws_remove,
    ws_save,
    ws_snapshot,
)
from custom_components.ha_opcua_discovery.switch import AsyncuaSwitch

pytestmark = pytest.mark.asyncio

NODES = [
    {"name": "Run", "node_id": "ns=2;i=1", "variant_type": "Boolean", "writable": True},
    {
        "name": "Alternate",
        "node_id": "ns=2;i=2",
        "variant_type": "Boolean",
        "writable": True,
    },
    {"name": "Speed", "node_id": "ns=2;i=3", "variant_type": "Int16", "writable": True},
]


async def prepare(hass, entry):
    await ar.async_load(hass)
    area = ar.async_get(hass).async_create("Workshop")
    hub = OpcuaHub("PLC", "opc.tcp://user:password@localhost:4840/", "ns=2;i=1")
    hub.get_values = AsyncMock(return_value={"ns=2;i=1": False, "ns=2;i=2": True})
    hub.set_value = AsyncMock()
    c = AsyncuaCoordinator(hass, "PLC", hub, config_entry=entry)
    c.set_nodes(NODES)
    hass.data[DOMAIN] = {"PLC": c}
    registry = er.async_get(hass)
    row = registry.async_get_or_create(
        "switch",
        DOMAIN,
        entity_unique_id(entry.entry_id, "ns=2;i=1"),
        config_entry=entry,
        original_name="Run",
    )
    payload = {
        "entry_id": entry.entry_id,
        "revision": endpoint_snapshot(hass, entry)["revision"],
        "key": "ns=2;i=1",
        "name": "Pump",
        "area_id": area.id,
        "node_id": "ns=2;i=2",
        "device_class": None,
        "invert_state": True,
    }
    return c, row, payload


async def test_save_remaps_read_write_without_changing_entity_identity(hass, entry):
    c, registered, msg = await prepare(hass, entry)
    assert (await async_save_entity(hass, msg))["saved"]
    updated = er.async_get(hass).async_get(registered.entity_id)
    assert (
        updated.entity_id == registered.entity_id
        and updated.unique_id == registered.unique_id
    )
    assert updated.name == "Pump" and updated.area_id == msg["area_id"]
    assert entry.options[CONF_NODE_SETTINGS]["ns=2;i=1"]["node_id"] == "ns=2;i=2"
    # Recreate the coordinator as on a real reload, even if the old node is gone.
    restored = AsyncuaCoordinator(hass, "PLC", c.hub, config_entry=entry)
    restored.set_nodes(NODES[1:])
    await restored.async_refresh()
    switch = AsyncuaSwitch(restored, "Run", "ns=2;i=1", entry.entry_id)
    assert switch.unique_id == registered.unique_id
    assert switch.extra_state_attributes["node_id"] == "ns=2;i=2"
    assert switch.is_on is False  # Actual PLC True, inverted in Home Assistant.
    await switch.async_turn_on()
    c.hub.set_value.assert_awaited_once_with("ns=2;i=2", False)
    # Shared targets are read once but can feed multiple independently named entities.
    assert c.hub.get_values.call_args.args[0].count("ns=2;i=2") == 1
    await c.async_shutdown()
    await restored.async_shutdown()


@pytest.mark.parametrize(
    ("changes", "error"),
    [
        ({"revision": "stale"}, "stale_configuration"),
        ({"node_id": "ns=2;i=99"}, "node_not_found"),
        ({"node_id": "ns=2;i=3"}, "incompatible_platform"),
        ({"area_id": "missing"}, "area_not_found"),
        ({"device_class": "door"}, "invalid_device_class"),
    ],
)
async def test_invalid_save_is_atomic(hass, entry, changes, error):
    c, registered, msg = await prepare(hass, entry)
    before = deepcopy(dict(entry.options))
    with pytest.raises(ValueError, match=error):
        await async_save_entity(hass, {**msg, **changes})
    assert dict(entry.options) == before
    assert er.async_get(hass).async_get(registered.entity_id) == registered
    await c.async_shutdown()


async def test_two_editors_cannot_overwrite_and_snapshot_contains_no_credentials(
    hass, entry
):
    c, _, msg = await prepare(hass, entry)
    response = panel_snapshot(hass)
    assert response["endpoints"][0]["endpoint"] == "opc.tcp://localhost:4840/"
    assert "password" not in json.dumps(response)
    await async_save_entity(hass, msg)
    with pytest.raises(ValueError, match="stale_configuration"):
        await async_save_entity(hass, {**msg, "name": "Other editor"})
    await c.async_shutdown()


async def test_binary_device_class_inversion_and_options_flow_preserve_panel_fields(
    hass, entry
):
    c, _, _ = await prepare(hass, entry)
    settings = {
        "platform": "binary_sensor",
        "node_id": "ns=2;i=2",
        "device_class": "door",
        "invert_state": True,
    }
    hass.config_entries.async_update_entry(
        entry, options={CONF_NODE_SETTINGS: {"ns=2;i=1": settings}}
    )
    c.node_settings = deepcopy(entry.options[CONF_NODE_SETTINGS])
    c.set_nodes(NODES)
    c.async_set_updated_data({"ns=2;i=1": False})
    binary = AsyncuaBinarySensor(c, "Door", "ns=2;i=1", entry.entry_id)
    assert binary.device_class == "door" and binary.is_on is True
    flow = AsyncUAOptionsFlow(entry)
    flow.hass = hass
    await flow.async_step_nodes({"node_id": "ns=2;i=1"})
    saved = await flow.async_step_node({"platform": "binary_sensor"})
    assert saved["data"][CONF_NODE_SETTINGS]["ns=2;i=1"] == settings
    saved = await flow.async_step_node({"platform": "switch"})
    assert saved["data"][CONF_NODE_SETTINGS]["ns=2;i=1"]["invert_state"]
    assert "device_class" not in saved["data"][CONF_NODE_SETTINGS]["ns=2;i=1"]
    await c.async_shutdown()


async def test_websocket_endpoints_require_admin(hass):
    connection = Mock(user=SimpleNamespace(is_admin=False))
    for handler in (ws_snapshot, ws_save, ws_create, ws_inspect, ws_remove):
        with pytest.raises(Unauthorized):
            handler(hass, connection, {"id": 1})
    connection.send_result.assert_not_called()


async def test_panel_registration_is_once_and_versioned(hass):
    await ar.async_load(hass)
    hass.http = Mock(async_register_static_paths=AsyncMock())
    with (
        patch(
            "custom_components.ha_opcua_discovery.panel.async_get_integration",
            new=AsyncMock(return_value=SimpleNamespace(manifest={"version": "1.4.0"})),
        ),
        patch(
            "custom_components.ha_opcua_discovery.panel.panel_custom.async_register_panel",
            new=AsyncMock(),
        ) as register,
        patch(
            "custom_components.ha_opcua_discovery.panel.websocket_api.async_register_command"
        ) as commands,
    ):
        await async_setup_panel(hass)
        await async_setup_panel(hass)
    register.assert_awaited_once()
    assert register.call_args.kwargs["require_admin"] is True
    assert register.call_args.kwargs["module_url"].endswith("?v=1.4.0")
    assert commands.call_count == 5
    assert panel_snapshot(hass)["version"] == "1.4.0"


async def test_panel_category_exclusion_and_restore_preserve_registry_metadata(
    hass, entry
):
    c, registered, msg = await prepare(hass, entry)
    await async_save_entity(
        hass, {**msg, "platform": "binary_sensor", "device_class": "door"}
    )
    registry = er.async_get(hass)
    unique_id = registered.unique_id
    new_id = registry.async_get_entity_id("binary_sensor", DOMAIN, unique_id)
    binary = registry.async_get(new_id)
    assert binary.name == "Pump" and binary.area_id == msg["area_id"]
    assert (
        registry.async_get(registered.entity_id).disabled_by
        == er.RegistryEntryDisabler.INTEGRATION
    )
    assert new_id != registered.entity_id
    # Exclude and restore through the same endpoint without discarding identity.
    for platform in ("disabled", "switch"):
        msg["revision"] = endpoint_snapshot(hass, entry)["revision"]
        result = await async_save_entity(hass, {**msg, "platform": platform})
        if platform == "disabled":
            assert result["entity_id"] is None
            assert (
                registry.async_get(new_id).disabled_by
                == er.RegistryEntryDisabler.INTEGRATION
            )
            row = next(
                r
                for r in endpoint_snapshot(hass, entry)["rows"]
                if r["key"] == msg["key"]
            )
            assert row["editable"] and row["name"] == "Pump"
        else:
            assert result["entity_id"] == registered.entity_id
            assert registry.async_get(registered.entity_id).disabled_by is None
    restored = AsyncuaCoordinator(hass, "PLC", c.hub, config_entry=entry)
    restored.set_nodes(NODES)
    assert list(restored.nodes_for_platform("switch"))
    await c.async_shutdown()
    await restored.async_shutdown()


@pytest.mark.parametrize(
    "limits",
    [
        {"min": 10, "max": 5},
        {"step": 0},
        {"step": 0.5},
        {"max": 40000},
        {"min": True},
        {"max_length": 10},
    ],
)
async def test_panel_invalid_limits_are_atomic(hass, entry, limits):
    c, registered, msg = await prepare(hass, entry)
    before = deepcopy(dict(entry.options))
    entities = list(er.async_get(hass).entities)
    with pytest.raises(ValueError):
        await async_save_entity(
            hass,
            {
                **msg,
                "platform": "number",
                "node_id": "ns=2;i=3",
                "invert_state": False,
                "limits": limits,
            },
        )
    assert dict(entry.options) == before
    assert list(er.async_get(hass).entities) == entities
    assert er.async_get(hass).async_get(registered.entity_id).disabled_by is None
    await c.async_shutdown()


async def test_panel_number_limits_and_enabling_unregistered_excluded_node(hass, entry):
    c, _, msg = await prepare(hass, entry)
    hass.config_entries.async_update_entry(
        entry, options={CONF_NODE_SETTINGS: {"ns=2;i=3": {"platform": "disabled"}}}
    )
    row = next(
        r for r in endpoint_snapshot(hass, entry)["rows"] if r["key"] == "ns=2;i=3"
    )
    assert row["editable"] and row["entity_id"] is None
    msg.update(
        key="ns=2;i=3",
        node_id="ns=2;i=3",
        platform="number",
        invert_state=False,
        revision=endpoint_snapshot(hass, entry)["revision"],
        limits={"min": -100, "max": 500, "step": 5},
    )
    result = await async_save_entity(hass, msg)
    assert result["entity_id"].startswith("number.")
    saved = entry.options[CONF_NODE_SETTINGS][msg["key"]]
    assert saved["min"] == -100 and saved["max"] == 500 and saved["step"] == 5
    msg["revision"] = endpoint_snapshot(hass, entry)["revision"]
    msg["limits"] = {"min": 0, "max": 200, "step": 2}
    assert (await async_save_entity(hass, msg))["entity_id"] == result["entity_id"]
    msg.pop("limits")
    for platform in ("disabled", "number"):
        msg.update(
            platform=platform, revision=endpoint_snapshot(hass, entry)["revision"]
        )
        await async_save_entity(hass, msg)
        settings = entry.options[CONF_NODE_SETTINGS][msg["key"]]
        assert (settings["min"], settings["max"], settings["step"]) == (0, 200, 2)
    await c.async_shutdown()
