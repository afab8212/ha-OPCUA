"""DateTime discovery, manual creation, native HA controls and timezone semantics."""

from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from zoneinfo import ZoneInfo

import pytest
from asyncua import Server, ua
from homeassistant.components.datetime import _async_set_value
from homeassistant.components.sensor import SensorDeviceClass
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import area_registry as ar

from custom_components.ha_opcua_discovery import AsyncuaCoordinator, OpcuaHub
from custom_components.ha_opcua_discovery.config_flow import AsyncUAOptionsFlow
from custom_components.ha_opcua_discovery.const import CONF_NODE_SETTINGS, DOMAIN
from custom_components.ha_opcua_discovery.datetime import AsyncuaDateTime
from custom_components.ha_opcua_discovery.entity import async_setup_node_entities
from custom_components.ha_opcua_discovery.node_settings import (
    allowed_platforms,
    effective_platform,
    validate_settings,
)
from custom_components.ha_opcua_discovery.panel import (
    async_create_entity,
    async_inspect_node,
    endpoint_snapshot,
)
from custom_components.ha_opcua_discovery.sensor import AsyncuaSensor
from custom_components.ha_opcua_discovery.values import datetime_value, scalar_variant


def test_datetime_normalization_and_validation():
    expected = datetime(2026, 9, 14, 16, 30, 0, 125000, tzinfo=UTC)
    for value in (
        "2026-09-14T18:30:00.125+02:00",
        "2026-09-14T16:30:00.125Z",
        expected,
    ):
        result = scalar_variant(value, ua.VariantType.DateTime)
        assert result.Value == expected and result.Value.tzinfo is UTC
        assert result.VariantType == ua.VariantType.DateTime and not result.is_array
    for value in (
        None,
        True,
        12345,
        [],
        "invalid",
        "2026-09-14",
        "2026-09-14T18:30:00",
        datetime(2026, 9, 14),
        "1600-12-31T23:59:59Z",
        "9999-12-31T23:59:59-02:00",
    ):
        with pytest.raises(ValueError):
            scalar_variant(value, ua.VariantType.DateTime)
    assert datetime_value(expected.replace(tzinfo=None)) == expected
    assert datetime_value("2026-09-14T16:30:00Z") is None
    assert datetime_value(None) is None


def test_datetime_platform_permissions_and_incompatible_types():
    for writable in (True, False):
        node = {"variant_type": "DateTime", "writable": writable}
        assert ("datetime" in allowed_platforms(node)) is writable
        assert effective_platform(node, {}) == ("datetime" if writable else "sensor")
        if not writable:
            with pytest.raises(ValueError, match="incompatible_platform"):
                validate_settings(node, {"platform": "datetime"})
    for kind in ("String", "Int64", "Boolean"):
        with pytest.raises(ValueError, match="incompatible_platform"):
            validate_settings(
                {"variant_type": kind, "writable": True}, {"platform": "datetime"}
            )
    with pytest.raises(ValueError, match="invalid_inversion"):
        validate_settings(
            {"variant_type": "DateTime", "writable": True},
            {"platform": "datetime", "invert_state": True},
        )


@pytest.mark.asyncio
async def test_datetime_roundtrip_native_service_and_manual_persistence(
    hass, entry, unused_tcp_port
):
    await ar.async_load(hass)
    server = Server()
    await server.init()
    server.set_endpoint(f"opc.tcp://127.0.0.1:{unused_tcp_port}/")
    server.set_security_policy([ua.SecurityPolicyType.NoSecurity])
    ns = await server.register_namespace("urn:datetime-test")
    root = await server.nodes.objects.add_object(ns, "PLC")
    initial = datetime(2026, 9, 14, 10, 0, tzinfo=UTC)
    clock = await root.add_variable(ns, "Clock", initial)
    readonly = await root.add_variable(ns, "Last start", initial)
    manual = await server.nodes.objects.add_variable(ns, "Outside root", initial)
    array = await root.add_variable(ns, "Array", [initial, initial])
    await clock.set_writable()
    await manual.set_writable()
    hub = OpcuaHub("PLC", server.endpoint.geturl(), root.nodeid.to_string())
    c = AsyncuaCoordinator(hass, "PLC", hub, config_entry=entry)
    hass.data[DOMAIN] = {"PLC": c}
    restored = None
    async with server:
        try:
            await c.async_refresh()
            clock_id, readonly_id, manual_id = (
                n.nodeid.to_string() for n in (clock, readonly, manual)
            )
            assert array.nodeid.to_string() not in c.nodes
            assert list(c.nodes_for_platform("datetime"))[0][0] == clock_id
            control = AsyncuaDateTime(c, "Clock", clock_id, entry.entry_id)
            sensor = AsyncuaSensor(c, "Last start", readonly_id, entry.entry_id)
            assert (
                control.native_value == initial and control.state == initial.isoformat()
            )
            assert sensor.device_class == SensorDeviceClass.TIMESTAMP
            assert sensor.state_class is None and sensor.native_value == initial
            # HA resolves a user's local, timezone-free service input before calling us.
            with patch(
                "homeassistant.components.datetime.dt_util.get_default_time_zone",
                return_value=ZoneInfo("Europe/Rome"),
            ):
                await _async_set_value(
                    control,
                    SimpleNamespace(data={"datetime": datetime(2026, 9, 14, 18, 30)}),
                )
            assert await clock.read_value() == datetime(2026, 9, 14, 16, 30, tzinfo=UTC)
            # The repeated hour in autumn represents two distinct instants.
            for fold in (0, 1):
                local = datetime(
                    2026, 10, 25, 2, 30, tzinfo=ZoneInfo("Europe/Rome"), fold=fold
                )
                await control.async_set_value(local)
                assert await clock.read_value() == local.astimezone(UTC)
                # Coordinator refresh requests are debounced across rapid writes.
                await c.async_refresh()
                assert control.native_value == local.astimezone(UTC)
            await hub.set_value(clock_id, "2026-09-14T18:30:00+02:00")
            assert await clock.read_value() == datetime(2026, 9, 14, 16, 30, tzinfo=UTC)
            with pytest.raises(HomeAssistantError):
                await control.async_set_value(datetime(2026, 9, 14))
            with pytest.raises(HomeAssistantError):
                await control.async_set_value("2026-09-14T18:30:00Z")
            # Both configuration flows expose the new domain.
            flow = AsyncUAOptionsFlow(entry)
            flow.hass = hass
            await flow.async_step_nodes({"node_id": clock_id})
            assert (await flow.async_step_node({"platform": "datetime"}))["data"][
                CONF_NODE_SETTINGS
            ][clock_id]["platform"] == "datetime"
            msg = {
                "entry_id": entry.entry_id,
                "revision": endpoint_snapshot(hass, entry)["revision"],
                "node_id": manual_id,
                "platform": "datetime",
                "name": "Manual clock",
                "area_id": None,
                "device_class": None,
                "invert_state": False,
            }
            assert (await async_inspect_node(hass, msg))["platforms"] == [
                "sensor",
                "datetime",
            ]
            assert (await async_create_entity(hass, msg))["entity_id"].startswith(
                "datetime."
            )
            await c.async_shutdown()
            restored = AsyncuaCoordinator(hass, "PLC", hub, config_entry=entry)
            await restored.async_refresh()
            entities = []
            async_setup_node_entities(
                restored, entry, entities.extend, "datetime", AsyncuaDateTime
            )
            assert len(entities) == 2
            manual_entity = next(e for e in entities if e._node_id == manual_id)
            await manual_entity.async_set_value(initial)
            assert manual_entity.native_value == initial
            await restored.async_set_connection_enabled(False)
            assert not manual_entity.available
        finally:
            await c.async_shutdown()
            if restored:
                await restored.async_shutdown()
            await hub.disconnect()


@pytest.mark.asyncio
async def test_invalid_datetime_never_calls_hub_write(hass):
    hub = OpcuaHub("PLC", "opc.tcp://localhost:4840", "ns=2;i=1")
    hub.set_value = AsyncMock()
    c = AsyncuaCoordinator(hass, "PLC", hub)
    c.set_nodes(
        [
            {
                "name": "Clock",
                "node_id": "ns=2;i=1",
                "variant_type": "DateTime",
                "writable": True,
            }
        ]
    )
    entity = AsyncuaDateTime(c, "Clock", "ns=2;i=1", "entry")
    for value in (None, datetime(2026, 1, 1), datetime(1500, 1, 1, tzinfo=UTC)):
        with pytest.raises(HomeAssistantError):
            await entity.async_set_value(value)
    hub.set_value.assert_not_awaited()
    await c.async_shutdown()
