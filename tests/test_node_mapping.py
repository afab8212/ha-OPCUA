"""Per-node options, platform routing and native writes against a real server."""

from copy import deepcopy
from unittest.mock import AsyncMock, Mock, patch

import pytest
from asyncua import Server, ua
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import entity_registry as er
from probatio import to_field_list

from custom_components.ha_opcua_discovery import (
    AsyncuaCoordinator,
    OpcuaHub,
    async_setup_entry,
)
from custom_components.ha_opcua_discovery.binary_sensor import AsyncuaBinarySensor
from custom_components.ha_opcua_discovery.config_flow import AsyncUAOptionsFlow
from custom_components.ha_opcua_discovery.const import CONF_NODE_SETTINGS, DOMAIN
from custom_components.ha_opcua_discovery.node_settings import (
    allowed_platforms,
    validate_settings,
)
from custom_components.ha_opcua_discovery.number import AsyncuaNumber
from custom_components.ha_opcua_discovery.text import AsyncuaText


def node(kind="String", writable=True, node_id="ns=2;i=1"):
    return {
        "name": "Value",
        "node_id": node_id,
        "variant_type": kind,
        "writable": writable,
    }


@pytest.mark.parametrize(
    ("kind", "writable", "choices"),
    [
        ("String", True, ["auto", "sensor", "text", "disabled"]),
        ("Boolean", True, ["auto", "sensor", "binary_sensor", "switch", "disabled"]),
        ("Boolean", False, ["auto", "sensor", "binary_sensor", "disabled"]),
        ("Int16", True, ["auto", "sensor", "number", "disabled"]),
        ("Float", False, ["auto", "sensor", "disabled"]),
    ],
)
def test_choices_respect_type_and_permissions(kind, writable, choices):
    assert allowed_platforms(node(kind, writable)) == choices


@pytest.mark.parametrize(
    ("kind", "settings", "error"),
    [
        ("String", {"platform": "number"}, "incompatible_platform"),
        ("Int16", {"platform": "number", "min": -32769}, "limits_outside_type"),
        ("UInt16", {"platform": "number", "min": -1}, "limits_outside_type"),
        ("Int16", {"platform": "number", "step": 0.5}, "integer_limits_required"),
        ("Int64", {"platform": "number", "max": 2**53}, "unsafe_integer_limits"),
        ("Float", {"platform": "number", "max": float("nan")}, "invalid_number_limits"),
        ("Float", {"platform": "number", "max": 1e40}, "limits_outside_type"),
        ("Double", {"platform": "number", "step": 0}, "invalid_number_limits"),
        ("Double", {"platform": "number", "min": 100}, "invalid_number_limits"),
        ("String", {"platform": "text", "max_length": 256}, "invalid_text_limits"),
        ("String", {"platform": "text", "min_length": -1}, "invalid_text_limits"),
    ],
)
def test_invalid_settings_rejected(kind, settings, error):
    with pytest.raises(ValueError, match=error):
        validate_settings(node(kind), settings)


def prepare_flow(hass, entry):
    hass.config_entries._entries[entry.entry_id] = entry
    c = AsyncuaCoordinator(
        hass, "PLC", Mock(get_values=AsyncMock(return_value={})), config_entry=entry
    )
    c.set_nodes(
        [node(), node("Int16", node_id="ns=2;i=2"), node("Boolean", False, "ns=2;i=3")]
    )
    hass.data[DOMAIN] = {"PLC": c}
    flow = AsyncUAOptionsFlow(entry)
    flow.hass = hass
    return flow, c


@pytest.mark.asyncio
async def test_options_keep_other_nodes_and_connection_and_cancel_is_isolated(
    hass, entry
):
    hass.config_entries._entries[entry.entry_id] = entry
    original = {
        "scan_interval": 12,
        CONF_NODE_SETTINGS: {"ns=2;i=99": {"platform": "disabled"}},
    }
    hass.config_entries.async_update_entry(entry, options=deepcopy(original))
    flow, _ = prepare_flow(hass, entry)
    assert (await flow.async_step_init())["menu_options"] == ["connection", "nodes"]
    selection = await flow.async_step_nodes()
    assert to_field_list(
        selection["data_schema"], custom_serializer=cv.custom_serializer
    )
    options = next(iter(selection["data_schema"].schema.values())).config["options"]
    assert len({option["label"] for option in options}) == 3
    assert (await flow.async_step_nodes({"node_id": "ns=2;i=1"}))["step_id"] == "node"
    assert (await flow.async_step_node({"platform": "text"}))["step_id"] == "text"
    text_form = await flow.async_step_text()
    assert to_field_list(
        text_form["data_schema"], custom_serializer=cv.custom_serializer
    )
    invalid = await flow.async_step_text({"min_length": 0, "max_length": 300})
    assert invalid["errors"] == {"base": "invalid_text_limits"}
    # Abandoning the flow at this point must leave all saved settings untouched.
    assert dict(entry.options) == original
    saved = await flow.async_step_text({"min_length": 0, "max_length": 80})
    assert saved["data"][CONF_NODE_SETTINGS] == {
        "ns=2;i=99": {"platform": "disabled"},
        "ns=2;i=1": {"platform": "text", "min_length": 0, "max_length": 80},
    }
    assert saved["data"]["scan_interval"] == 12
    assert dict(entry.options) == original
    hass.config_entries.async_update_entry(entry, options=saved["data"])
    connection = await flow.async_step_connection(
        {"url": "opc.tcp://new:4840", "hub_root": " ns=2;i=5 ", "scan_interval": 5}
    )
    assert connection["data"][CONF_NODE_SETTINGS] == saved["data"][CONF_NODE_SETTINGS]
    assert connection["data"]["hub_root"] == "ns=2;i=5"
    reset = await flow.async_step_node({"platform": "auto"})
    assert reset["data"][CONF_NODE_SETTINGS] == {"ns=2;i=99": {"platform": "disabled"}}


@pytest.mark.asyncio
async def test_options_integer_validation_readonly_and_unloaded(hass, entry):
    flow, _ = prepare_flow(hass, entry)
    await flow.async_step_nodes({"node_id": "ns=2;i=2"})
    assert (await flow.async_step_node({"platform": "number"}))["step_id"] == "number"
    result = await flow.async_step_number({"min": 0, "max": 10, "step": 0.1})
    assert result["errors"]["base"] == "integer_limits_required"
    result = await flow.async_step_number({"min": 0, "max": 10, "step": 1})
    assert result["data"][CONF_NODE_SETTINGS]["ns=2;i=2"]["max"] == 10
    await flow.async_step_nodes({"node_id": "ns=2;i=3"})
    assert (await flow.async_step_node({"platform": "switch"}))["errors"][
        "base"
    ] == "incompatible_platform"
    hass.data[DOMAIN].clear()
    assert (await flow.async_step_nodes())["reason"] == "integration_not_loaded"
    assert (await flow.async_step_connection())["step_id"] == "connection"


@pytest.mark.asyncio
async def test_disabled_and_incompatible_nodes_are_not_polled(hass, entry):
    hass.config_entries._entries[entry.entry_id] = entry
    hass.config_entries.async_update_entry(
        entry,
        options={
            CONF_NODE_SETTINGS: {
                "ns=2;i=1": {"platform": "disabled"},
                "ns=2;i=2": {"platform": "text"},
            }
        },
    )
    _, c = prepare_flow(hass, entry)
    assert list(c.nodes_for_platform("text")) == []
    assert list(c.nodes_for_platform("sensor")) == [("ns=2;i=3", c.nodes["ns=2;i=3"])]
    c.hub.get_values.return_value = {"ns=2;i=3": False}
    await c.async_refresh()
    c.hub.get_values.assert_awaited_once_with(["ns=2;i=3"])
    assert entry.options[CONF_NODE_SETTINGS]["ns=2;i=2"] == {"platform": "text"}


@pytest.mark.asyncio
async def test_reload_runs_after_options_are_persisted(hass, entry):
    hass.config_entries._entries[entry.entry_id] = entry
    await er.async_load(hass)
    hub = Mock(
        connect=AsyncMock(return_value=True),
        discover_nodes=AsyncMock(return_value=[]),
        get_values=AsyncMock(return_value={}),
        disconnect=AsyncMock(),
    )

    async def check_reload(entry_id):
        assert entry_id == entry.entry_id
        assert entry.options[CONF_NODE_SETTINGS]["ns=2;i=1"]["platform"] == "text"

    with (
        patch("custom_components.ha_opcua_discovery.OpcuaHub", return_value=hub),
        patch.object(
            hass.config_entries, "async_forward_entry_setups", new=AsyncMock()
        ),
        patch.object(
            hass.config_entries, "async_reload", new=AsyncMock(side_effect=check_reload)
        ) as reload,
    ):
        await async_setup_entry(hass, entry)
        hass.config_entries.async_update_entry(
            entry, options={CONF_NODE_SETTINGS: {"ns=2;i=1": {"platform": "text"}}}
        )
        await hass.async_block_till_done()
        reload.assert_awaited_once_with(entry.entry_id)
    await entry._async_process_on_unload(hass)


@pytest.mark.asyncio
async def test_native_entities_read_write_and_validate_with_real_server(
    hass, entry, unused_tcp_port
):
    server = Server()
    await server.init()
    server.set_endpoint(f"opc.tcp://127.0.0.1:{unused_tcp_port}/")
    server.set_security_policy([ua.SecurityPolicyType.NoSecurity])
    ns = await server.register_namespace("urn:entity-test")
    root = await server.nodes.objects.add_object(ns, "PLC")
    integer = await root.add_variable(
        ns, "Setpoint", ua.Variant(0, ua.VariantType.Int16)
    )
    string = await root.add_variable(ns, "Recipe", "initial")
    boolean = await root.add_variable(ns, "Ready", True)
    await integer.set_writable()
    await string.set_writable()
    integer_id, string_id, boolean_id = [
        n.nodeid.to_string() for n in (integer, string, boolean)
    ]
    hass.config_entries._entries[entry.entry_id] = entry
    hass.config_entries.async_update_entry(
        entry,
        options={
            CONF_NODE_SETTINGS: {
                integer_id: {"platform": "number", "min": -10, "max": 100, "step": 1},
                string_id: {"platform": "text", "min_length": 0, "max_length": 80},
                boolean_id: {"platform": "binary_sensor"},
            }
        },
    )
    hub = OpcuaHub("PLC", server.endpoint.geturl(), root.nodeid.to_string())
    c = AsyncuaCoordinator(hass, "PLC", hub, config_entry=entry)
    async with server:
        try:
            c.set_nodes(await hub.discover_nodes())
            await c.async_refresh()
            number = AsyncuaNumber(c, "Setpoint", integer_id, entry.entry_id)
            text = AsyncuaText(c, "Recipe", string_id, entry.entry_id)
            binary = AsyncuaBinarySensor(c, "Ready", boolean_id, entry.entry_id)
            assert number.native_value == 0 and binary.is_on is True
            await number.async_set_native_value(42.0)
            assert await integer.read_value() == 42
            assert (
                await integer.read_data_value()
            ).Value.VariantType == ua.VariantType.Int16
            assert number.native_value == 42
            for value in (" [A,B] ", "", "caffè ☕", "x" * 80):
                await text.async_set_value(value)
                # Bypass HA's debounce only to observe each test's immediate readback.
                await c.async_refresh()
                assert await string.read_value() == value and text.native_value == value
            for value in (True, 1.5, 101, float("nan")):
                with pytest.raises(HomeAssistantError):
                    await number.async_set_native_value(value)
            with pytest.raises(HomeAssistantError):
                await text.async_set_value("x" * 81)
            assert await integer.read_value() == 42
            assert await string.read_value() == "x" * 80
            await string.write_value("x" * 256)
            await c.async_refresh()
            assert text.native_value is None
            c.async_set_updated_data({})
            assert not number.available and not text.available and not binary.available
            assert binary.is_on is None
        finally:
            await c.async_shutdown()
            await hub.disconnect()
