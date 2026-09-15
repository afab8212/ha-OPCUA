"""Connection controls remain usable offline and prevent hidden reconnects."""

import asyncio
import importlib
from unittest.mock import AsyncMock, Mock, patch

import pytest
from asyncua import Server
from homeassistant.exceptions import HomeAssistantError

from custom_components.ha_opcua import (
    AsyncuaCoordinator,
    OpcuaHub,
    async_setup_entry,
)
from custom_components.ha_opcua.binary_sensor import OpcuaConnectionSensor
from custom_components.ha_opcua.connection import connection_attributes
from custom_components.ha_opcua.const import (
    CONF_CONNECTION_ENABLED,
    CONF_NODE_SETTINGS,
    DOMAIN,
    SERVICE_SET_VALUE,
)
from custom_components.ha_opcua.switch import OpcuaConnectionSwitch

pytestmark = pytest.mark.asyncio


async def test_offline_startup_recovery_pause_and_native_controls(
    hass, entry, unused_tcp_port
):
    server = Server()
    await server.init()
    server.set_endpoint(f"opc.tcp://127.0.0.1:{unused_tcp_port}/")
    ns = await server.register_namespace("urn:connection-test")
    root = await server.nodes.objects.add_object(ns, "PLC")
    recipe = await root.add_variable(ns, "Recipe", "initial")
    await recipe.set_writable()
    node_id = recipe.nodeid.to_string()
    hass.config_entries.async_update_entry(
        entry,
        options={CONF_NODE_SETTINGS: {node_id: {"platform": "text", "max_length": 80}}},
    )
    hub = OpcuaHub("PLC", server.endpoint.geturl(), root.nodeid.to_string())
    entities = []

    async def forward(config_entry, platforms):
        for platform in platforms:
            module = importlib.import_module(f"custom_components.ha_opcua.{platform}")
            await module.async_setup_entry(hass, config_entry, entities.extend)

    with (
        patch("custom_components.ha_opcua.OpcuaHub", return_value=hub),
        patch.object(hass.config_entries, "async_forward_entry_setups", new=forward),
    ):
        # The endpoint is not listening yet. Setup must still expose both controls.
        assert await async_setup_entry(hass, entry)
    c = hass.data[DOMAIN]["PLC"]
    switch = next(e for e in entities if isinstance(e, OpcuaConnectionSwitch))
    sensor = next(e for e in entities if isinstance(e, OpcuaConnectionSensor))
    assert len(entities) == 2
    assert switch.available and switch.is_on
    assert sensor.available and not sensor.is_on
    assert not c.last_update_success
    await server.start()
    try:
        await c.async_refresh()
        assert sensor.is_on and c.last_update_success
        assert len(entities) == 3
        text = next(e for e in entities if e not in (switch, sensor))
        assert text.native_value == "initial" and text.available
        await c.async_refresh()
        assert len(entities) == 3  # Deferred discovery never duplicates entities.
        await text.async_set_value(" [A,B] ")
        assert await recipe.read_value() == " [A,B] "
        info = sensor.extra_state_attributes
        assert info["session_timeout_ms"] > 0
        assert info["last_connected"] and info["last_successful_read"]
        assert info["discovered_nodes"] == info["polled_nodes"] == 1
        with patch.object(
            hass.config_entries, "async_reload", new=AsyncMock()
        ) as reload:
            await switch.async_turn_off()
            await hass.async_block_till_done()
            reload.assert_not_awaited()
            assert switch.available and not switch.is_on
            assert sensor.available and not sensor.is_on
            assert not text.available and hub.client is None
            assert c.update_interval is None and c._unsub_refresh is None
            assert entry.options[CONF_CONNECTION_ENABLED] is False
            assert entry.options[CONF_NODE_SETTINGS][node_id]["platform"] == "text"
            with patch("custom_components.ha_opcua.Client") as factory:
                await c.async_refresh()
                await c.async_request_refresh()
                with pytest.raises(HomeAssistantError, match="disabled"):
                    await text.async_set_value("blocked")
                with pytest.raises(HomeAssistantError, match="disabled"):
                    await hass.services.async_call(
                        DOMAIN,
                        SERVICE_SET_VALUE,
                        {"hub": "PLC", "node_id": node_id, "value": "blocked"},
                        blocking=True,
                    )
                assert not await hub.connect()
                factory.assert_not_called()
            assert await recipe.read_value() == " [A,B] "
            await switch.async_turn_on()
            await hass.async_block_till_done()
            assert switch.is_on and sensor.is_on and text.available
            assert entry.options[CONF_CONNECTION_ENABLED] is True
            assert c.update_interval == c.poll_interval
            reload.assert_not_awaited()
        # A real server shutdown is reported as disconnected, while intent stays on.
        await server.stop()
        await c.async_refresh()
        assert switch.is_on and sensor.available and not sensor.is_on
        assert not text.available
    finally:
        await c.async_shutdown()
        await hub.disconnect(permanent=True)
        await entry._async_process_on_unload(hass)
        # stop() is safe after an earlier stop in the success path.
        if server.bserver is not None:
            await server.stop()


async def test_disabled_restart_never_opens_a_client(hass, entry):
    hass.config_entries.async_update_entry(
        entry, options={CONF_CONNECTION_ENABLED: False}
    )
    with (
        patch("custom_components.ha_opcua.Client") as factory,
        patch.object(
            hass.config_entries, "async_forward_entry_setups", new=AsyncMock()
        ) as forward,
    ):
        assert await async_setup_entry(hass, entry)
        c = hass.data[DOMAIN]["PLC"]
        await c.async_refresh()
        factory.assert_not_called()
        assert "switch" in forward.call_args.args[1]
        assert "binary_sensor" in forward.call_args.args[1]
        assert not c.enabled and c.update_interval is None
        assert not c.hub.is_connected and c.hub.client is None
    await c.async_shutdown()
    await entry._async_process_on_unload(hass)


async def test_pause_rejects_queued_write_before_lock_is_acquired():
    hub = OpcuaHub("PLC", "opc.tcp://localhost:4840", "ns=2;i=1")
    client = Mock(disconnect=AsyncMock())
    hub.client = client
    hub._connected = True
    await hub._lock.acquire()
    write = asyncio.create_task(hub.set_value("ns=2;i=10", "queued"))
    await asyncio.sleep(0)
    pause = asyncio.create_task(hub.pause())
    await asyncio.sleep(0)
    assert not hub.enabled
    hub._lock.release()
    with pytest.raises(HomeAssistantError, match="disabled"):
        await write
    await pause
    client.get_node.assert_not_called()
    client.disconnect.assert_awaited_once()
    assert hub.client is None and not hub.is_connected


async def test_background_loss_updates_status_and_ignores_stale_client(hass, entry):
    hub = OpcuaHub("PLC", "opc.tcp://localhost:4840", "ns=2;i=1")
    c = AsyncuaCoordinator(hass, "PLC", hub)
    sensor = OpcuaConnectionSensor(c, entry)
    changed = Mock()
    unsubscribe = c.async_add_listener(changed)
    first = Mock(connect=AsyncMock(), disconnect=AsyncMock(), session_timeout=30000)
    second = Mock(connect=AsyncMock(), disconnect=AsyncMock(), session_timeout=30000)
    with patch("custom_components.ha_opcua.Client", side_effect=[first, second]):
        assert await hub.connect()
        assert sensor.is_on
        c.async_set_updated_data({"ns=2;i=1": "old"})
        changed.reset_mock()
        await first.connection_lost_callback(ConnectionError("lost"))
        assert not sensor.is_on and sensor.available
        assert c.data == {}
        changed.assert_called_once()
        assert hub.last_error_type == "ConnectionError"
        assert await hub.connect()
        await first.connection_lost_callback(ConnectionError("stale"))
        assert sensor.is_on and hub.last_error_type is None
        assert (
            c.data == {}
        )  # The new session needs a fresh read before node availability.
    unsubscribe()
    await c.async_shutdown()
    await hub.disconnect()


async def test_connection_attributes_redact_url_credentials(hass):
    hub = OpcuaHub(
        "PLC",
        "opc.tcp://alice:secret@[::1]:4840/plc?token=secret#secret",
        "ns=2;i=1",
        username="alice",
        password="secret",
    )
    c = AsyncuaCoordinator(hass, "PLC", hub)
    attrs = connection_attributes(c)
    assert attrs["endpoint"] == "opc.tcp://[::1]:4840/plc"
    assert attrs["host"] == "::1" and attrs["port"] == 4840
    assert attrs["authentication"] == "username"
    assert "alice" not in str(attrs) and "secret" not in str(attrs)
    assert attrs["session_timeout_ms"] is None
    await c.async_shutdown()
