"""Converted states, safe inverse writes and persisted per-node settings."""

from copy import deepcopy
from unittest.mock import AsyncMock, Mock

import pytest
from homeassistant.exceptions import HomeAssistantError
from test_panel import NODES, prepare

from custom_components.ha_opcua import AsyncuaCoordinator
from custom_components.ha_opcua.const import CONF_NODE_SETTINGS
from custom_components.ha_opcua.conversion import convert, validate_conversion
from custom_components.ha_opcua.node_settings import validate_settings
from custom_components.ha_opcua.number import AsyncuaNumber
from custom_components.ha_opcua.panel import async_save_entity, endpoint_snapshot
from custom_components.ha_opcua.sensor import AsyncuaSensor

NODE = {
    "name": "Temperature",
    "node_id": "ns=2;i=90",
    "variant_type": "Int16",
    "writable": True,
}
FACTOR = {"type": "multiplier", "factor": 0.1}
SCALE = {
    "type": "linear_scale",
    "plc_min": 0,
    "plc_max": 27648,
    "ha_min": -50,
    "ha_max": 150,
}


@pytest.mark.parametrize(
    "config",
    [
        FACTOR,
        {**FACTOR, "factor": -0.1},
        SCALE,
        {**SCALE, "ha_min": 150, "ha_max": -50},
    ],
)
def test_inverse_and_no_clamp(config):
    config = validate_conversion(config)
    for raw in (-100, 0, 253, 30000):
        assert convert(convert(raw, config), config, inverse=True, integer=True) == raw


@pytest.mark.parametrize(
    "config",
    [
        {},
        [],
        {"type": "expression"},
        {**FACTOR, "factor": 0},
        {**FACTOR, "factor": True},
        {**FACTOR, "factor": float("inf")},
        {**FACTOR, "extra": 1},
        {**SCALE, "plc_max": 0},
        {**SCALE, "ha_max": -50},
    ],
)
def test_reject_bad_configuration(config):
    with pytest.raises(ValueError, match="invalid_conversion"):
        validate_conversion(config)


def test_limits_in_ha_units_and_inverse_type_bounds():
    settings = {
        "platform": "number",
        "conversion": FACTOR,
        "min": -10,
        "max": 100,
        "step": 0.1,
        "precision": 1,
    }
    assert validate_settings(NODE, settings)["step"] == 0.1
    with pytest.raises(ValueError, match="limits_outside_type"):
        validate_settings(NODE, {**settings, "max": 4000})
    with pytest.raises(ValueError, match="invalid_conversion"):
        validate_settings({**NODE, "variant_type": "Boolean"}, {"conversion": FACTOR})
    assert convert(23.45, FACTOR, inverse=True, integer=True) == 234
    assert convert(23.55, FACTOR, inverse=True, integer=True) == 236
    with pytest.raises(ValueError):
        convert(1e308, {"type": "multiplier", "factor": 1e308})


@pytest.mark.asyncio
async def test_state_write_and_offline_values_are_converted_once(hass, entry):
    hub = Mock(set_value=AsyncMock(), is_connected=True)
    c = AsyncuaCoordinator(hass, "PLC", hub, config_entry=entry)
    key = NODE["node_id"]
    c.node_settings = {
        key: {
            "platform": "number",
            "conversion": FACTOR,
            "min": 0,
            "max": 100,
            "step": 0.1,
            "always_available": True,
        }
    }
    c.set_nodes([NODE])
    c.data = {key: 253}
    c.last_update_success = True
    c.async_request_refresh = AsyncMock()
    number = AsyncuaNumber(c, "Temperature", key, entry.entry_id)
    sensor = AsyncuaSensor(c, "Temperature", key, entry.entry_id)
    assert number.native_value == sensor.native_value == 25.3
    assert number.extra_restore_state_data.as_dict()["value"] == 253
    await number.async_set_native_value(23.5)
    hub.set_value.assert_awaited_once_with(key, 235)
    with pytest.raises(HomeAssistantError):
        await number.async_set_native_value(101)
    assert hub.set_value.await_count == 1
    hub.is_connected = False
    c.data = {}
    assert number.native_value == 25.3
    # Restored raw state also picks up a subsequently changed conversion.
    number._settings["conversion"] = {"type": "multiplier", "factor": 0.01}
    assert number.native_value == 2.53
    with pytest.raises(HomeAssistantError):
        await number.async_set_native_value(10)
    await c.async_shutdown()


@pytest.mark.asyncio
async def test_panel_save_preserve_clear_and_reject_atomically(hass, entry):
    c, _, msg = await prepare(hass, entry)
    c.set_nodes([*NODES, NODE])
    key = NODE["node_id"]
    msg.update(
        key=key,
        node_id=key,
        platform="sensor",
        invert_state=False,
        revision=endpoint_snapshot(hass, entry)["revision"],
    )
    await async_save_entity(hass, {**msg, "conversion": FACTOR})
    snapshot = endpoint_snapshot(hass, entry)
    assert (
        next(row for row in snapshot["rows"] if row["key"] == key)["settings"][
            "conversion"
        ]
        == FACTOR
    )
    for platform in ("disabled", "sensor"):
        msg.update(
            platform=platform, revision=endpoint_snapshot(hass, entry)["revision"]
        )
        await async_save_entity(hass, msg)
        assert entry.options[CONF_NODE_SETTINGS][key]["conversion"] == FACTOR
    msg["revision"] = endpoint_snapshot(hass, entry)["revision"]
    before = deepcopy(dict(entry.options))
    with pytest.raises(ValueError, match="invalid_conversion"):
        await async_save_entity(hass, {**msg, "conversion": {**FACTOR, "factor": 0}})
    assert dict(entry.options) == before
    await async_save_entity(hass, {**msg, "conversion": None})
    assert "conversion" not in entry.options[CONF_NODE_SETTINGS][key]
    c.hub.set_value.assert_not_awaited()
    await c.async_shutdown()


@pytest.mark.asyncio
async def test_integer_and_float_conversion_roundtrip_with_server(
    hass, entry, unused_tcp_port
):
    from asyncua import Server, ua

    from custom_components.ha_opcua import OpcuaHub

    server = Server()
    await server.init()
    server.set_endpoint(f"opc.tcp://127.0.0.1:{unused_tcp_port}/")
    server.set_security_policy([ua.SecurityPolicyType.NoSecurity])
    ns = await server.register_namespace("urn:conversion-test")
    root = await server.nodes.objects.add_object(ns, "PLC")
    integer = await root.add_variable(
        ns, "Temperature", ua.Variant(253, ua.VariantType.Int16)
    )
    real = await root.add_variable(
        ns, "Analog", ua.Variant(13824.0, ua.VariantType.Float)
    )
    for node in (integer, real):
        await node.set_writable()
    ikey, rkey = integer.nodeid.to_string(), real.nodeid.to_string()
    hass.config_entries.async_update_entry(
        entry,
        options={
            CONF_NODE_SETTINGS: {
                ikey: {
                    "platform": "number",
                    "conversion": FACTOR,
                    "min": -50,
                    "max": 150,
                    "step": 0.1,
                },
                rkey: {
                    "platform": "number",
                    "conversion": SCALE,
                    "min": -50,
                    "max": 150,
                    "step": 0.1,
                },
            }
        },
    )
    hub = OpcuaHub("PLC", server.endpoint.geturl(), root.nodeid.to_string())
    c = AsyncuaCoordinator(hass, "PLC", hub, config_entry=entry)
    await server.start()
    try:
        await c.async_refresh()
        temp = AsyncuaNumber(c, "Temperature", ikey, entry.entry_id)
        analog = AsyncuaNumber(c, "Analog", rkey, entry.entry_id)
        assert temp.native_value == 25.3
        assert analog.native_value == 50
        await temp.async_set_native_value(23.5)
        await analog.async_set_native_value(100)
        assert await integer.read_value() == 235
        assert await real.read_value() == 20736
        await c.async_refresh()
        assert temp.native_value == 23.5
        assert analog.native_value == 100
    finally:
        await c.async_shutdown()
        await server.stop()
