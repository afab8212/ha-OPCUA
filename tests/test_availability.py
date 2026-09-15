"""Offline availability keeps last raw values and never implies writable connectivity."""

import logging
from copy import deepcopy
from datetime import UTC, datetime
from unittest.mock import AsyncMock, Mock, patch

import pytest
from asyncua import Server, ua
from homeassistant.core import State
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import restore_state
from homeassistant.helpers.entity_component import EntityComponent
from homeassistant.helpers.restore_state import RestoredExtraData, StoredState
from test_panel import prepare

from custom_components.ha_opcua import AsyncuaCoordinator, OpcuaHub
from custom_components.ha_opcua.binary_sensor import (
    AsyncuaBinarySensor,
    OpcuaConnectionSensor,
)
from custom_components.ha_opcua.const import (
    CONF_CONNECTION_ENABLED,
    CONF_NODE_SETTINGS,
    CONF_OFFLINE_NODES,
    DOMAIN,
)
from custom_components.ha_opcua.datetime import AsyncuaDateTime
from custom_components.ha_opcua.entity import (
    OpcuaStoredValue,
    async_setup_node_entities,
)
from custom_components.ha_opcua.node_settings import validate_settings
from custom_components.ha_opcua.number import AsyncuaNumber
from custom_components.ha_opcua.panel import (
    async_save_entity,
    endpoint_snapshot,
)
from custom_components.ha_opcua.sensor import AsyncuaSensor
from custom_components.ha_opcua.switch import AsyncuaSwitch
from custom_components.ha_opcua.text import AsyncuaText

pytestmark = pytest.mark.asyncio


async def test_real_connection_pause_loss_recovery_and_native_restore(
    hass, entry, unused_tcp_port
):
    server = Server()
    await server.init()
    server.set_endpoint(f"opc.tcp://127.0.0.1:{unused_tcp_port}/")
    server.set_security_policy([ua.SecurityPolicyType.NoSecurity])
    ns = await server.register_namespace("urn:availability-test")
    root = await server.nodes.objects.add_object(ns, "Root")
    real = await root.add_variable(ns, "Real", ua.Variant(12.345, ua.VariantType.Float))
    await real.set_writable()
    key = real.nodeid.to_string()
    metadata = {
        "node_id": key,
        "name": "Real",
        "variant_type": "Float",
        "writable": True,
    }
    hass.config_entries.async_update_entry(
        entry,
        options={
            CONF_NODE_SETTINGS: {
                key: {"platform": "number", "always_available": True, "precision": 2}
            },
            CONF_OFFLINE_NODES: {key: metadata},
        },
    )
    hub = OpcuaHub("PLC", server.endpoint.geturl(), root.nodeid.to_string())
    c = AsyncuaCoordinator(hass, "PLC", hub, config_entry=entry)
    component = EntityComponent(logging.getLogger(__name__), "number", hass)
    platform = component._async_init_entity_platform(DOMAIN, None)
    platform.config_entry = entry
    retained = AsyncuaNumber(c, "Real", key, entry.entry_id)
    retained.entity_id = "number.real"
    await server.start()
    try:
        await c.async_refresh()
        await platform.async_add_entities([retained])
        ordinary = AsyncuaSensor(c, "Normal", key, entry.entry_id)
        ordinary._settings = {}
        status = OpcuaConnectionSensor(c, entry)
        assert hass.states.get("number.real").state == "12.35"
        assert ordinary.available and status.is_on
        await c.async_set_connection_enabled(False)
        assert not ordinary.available and not status.is_on
        assert retained.available and retained.native_value == 12.35
        assert hass.states.get("number.real").attributes["value_stale"] is True
        assert c.update_interval is None and hub.client is None
        with patch.object(hub, "set_value", new=AsyncMock()) as write:
            with pytest.raises(HomeAssistantError, match="fresh node value"):
                await retained.async_set_native_value(20)
            write.assert_not_awaited()
        await real.write_value(ua.Variant(24.567, ua.VariantType.Float))
        await c.async_set_connection_enabled(True)
        assert retained.native_value == 24.57
        assert retained.extra_state_attributes["value_stale"] is False
        assert status.is_on
        await server.stop()
        await c.async_refresh()
        assert retained.native_value == 24.57 and retained.available
        assert not ordinary.available and not status.is_on
        # Removal invokes HA's actual RestoreEntity lifecycle and preserves raw data.
        await platform.async_reset()
        stored = restore_state.async_get(hass).last_states["number.real"]
        assert stored.extra_data.as_dict()["value"] != 24.57
        await restore_state.async_get(hass).async_dump_states()
        cold_restore = restore_state.RestoreStateData(hass)
        await cold_restore.async_load()
        hass.data[restore_state.DATA_RESTORE_STATE] = cold_restore
        assert "number.real" in cold_restore.last_states
        await c.async_shutdown()
        hass.config_entries.async_update_entry(
            entry, options={**entry.options, CONF_CONNECTION_ENABLED: False}
        )
        restarted = AsyncuaCoordinator(hass, "PLC", hub, config_entry=entry)
        new_entities = []
        async_setup_node_entities(
            restarted, entry, new_entities.extend, "number", AsyncuaNumber
        )
        assert len(new_entities) == 1 and restarted._discovery_pending
        restored = new_entities[0]
        restored.entity_id = "number.real"
        with patch("custom_components.ha_opcua.Client") as client:
            await restarted.async_refresh()
            await platform.async_add_entities([restored])
            client.assert_not_called()
        assert restored.available and hass.states.get("number.real").state == "24.57"
        assert restored.extra_state_attributes["value_stale"] is True
        await platform.async_reset()
        await restarted.async_shutdown()
        await entry._async_process_on_unload(hass)
    finally:
        await platform.async_reset()
        await c.async_shutdown()
        await hub.disconnect(permanent=True)
        if server.bserver is not None:
            await server.stop()


async def test_all_entity_types_restore_raw_values_and_unknown_is_not_zero(hass, entry):
    timestamp = datetime(2026, 9, 15, 10, 30, tzinfo=UTC)
    cases = [
        ("sensor", AsyncuaSensor, "Float", 1.2345, 1.23, {"precision": 2}),
        (
            "binary_sensor",
            AsyncuaBinarySensor,
            "Boolean",
            False,
            True,
            {"invert_state": True},
        ),
        ("switch", AsyncuaSwitch, "Boolean", True, False, {"invert_state": True}),
        ("number", AsyncuaNumber, "Int16", 0, 0, {}),
        ("text", AsyncuaText, "String", "", "", {}),
        ("datetime", AsyncuaDateTime, "DateTime", timestamp, timestamp, {}),
    ]
    for platform, cls, kind, raw, expected, settings in cases:
        key = "ns=2;i=1"
        node = {"node_id": key, "name": "Value", "variant_type": kind, "writable": True}
        c = AsyncuaCoordinator(
            hass, "PLC", Mock(is_connected=False), config_entry=entry
        )
        c.node_settings = {
            key: {"platform": platform, "always_available": True, **settings}
        }
        c.set_nodes([node])
        entity = cls(c, "Value", key, entry.entry_id)
        entity.hass = hass
        entity.entity_id = f"{platform}.test"
        assert entity.available and entity.node_value is None
        # Use the actual HA restore-state registry; DateTime is serialized as JSON text.
        restore_state.async_get(hass).last_states[entity.entity_id] = StoredState(
            State(entity.entity_id, "unknown"),
            RestoredExtraData(OpcuaStoredValue(key, kind, raw).as_dict()),
            timestamp,
        )
        await entity.async_added_to_hass()
        value = (
            entity.is_on
            if platform in {"switch", "binary_sensor"}
            else entity.native_value
        )
        assert value == expected
        assert entity.extra_state_attributes["value_stale"] is True
        # Restoring the same raw value twice must not invert/round an already transformed state.
        assert entity.extra_restore_state_data.as_dict()["value"] == (
            timestamp.isoformat() if kind == "DateTime" else raw
        )
        if platform == "switch":
            with pytest.raises(HomeAssistantError):
                await entity.async_turn_on()
            c.hub.set_value.assert_not_called()
        c._platforms[key] = "disabled"
        assert not entity.available
        await c.async_shutdown()


async def test_restore_rejects_another_target_and_does_not_replace_fresh_data(
    hass, entry
):
    c = AsyncuaCoordinator(hass, "PLC", Mock(is_connected=False), config_entry=entry)
    key = "ns=2;i=1"
    c.node_settings = {key: {"platform": "sensor", "always_available": True}}
    c.set_nodes(
        [{"node_id": key, "name": "Value", "variant_type": "Float", "writable": False}]
    )
    entity = AsyncuaSensor(c, "Value", key, entry.entry_id)
    entity.hass = hass
    entity.entity_id = "sensor.target"
    for target, kind in (("ns=2;i=2", "Float"), (key, "Double")):
        restore_state.async_get(hass).last_states[entity.entity_id] = StoredState(
            State(entity.entity_id, "99"),
            OpcuaStoredValue(target, kind, 99),
            datetime.now(UTC),
        )
        await entity.async_added_to_hass()
        assert entity.node_value is None
    c.hub.is_connected = True
    c.data = {key: 12.345}
    await entity.async_added_to_hass()
    assert entity.native_value == 12.345
    await c.async_shutdown()


async def test_panel_availability_validates_and_caches_metadata_for_offline_editing(
    hass, entry
):
    c, _, msg = await prepare(hass, entry)
    before = deepcopy(dict(entry.options))
    with pytest.raises(ValueError, match="invalid_availability"):
        await async_save_entity(hass, {**msg, "always_available": "yes"})
    assert dict(entry.options) == before
    await async_save_entity(hass, {**msg, "always_available": True})
    assert entry.options[CONF_NODE_SETTINGS][msg["key"]]["always_available"] is True
    assert entry.options[CONF_OFFLINE_NODES][msg["key"]]["node_id"] == msg["node_id"]
    restarted = AsyncuaCoordinator(hass, "PLC", c.hub, config_entry=entry)
    hass.data[DOMAIN]["PLC"] = restarted
    assert not restarted.discovered_nodes
    msg["revision"] = endpoint_snapshot(hass, entry)["revision"]
    await async_save_entity(hass, {**msg, "always_available": False})
    assert entry.options[CONF_NODE_SETTINGS][msg["key"]]["always_available"] is False
    assert CONF_OFFLINE_NODES not in entry.options
    c.hub.set_value.assert_not_awaited()
    assert validate_settings({"variant_type": "String", "writable": False}, {}) == {
        "platform": "auto"
    }
    await c.async_shutdown()
    await restarted.async_shutdown()
