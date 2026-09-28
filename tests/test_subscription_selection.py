"""Per-entity subscriptions remain opt-in and independent of polling."""

import asyncio
from copy import deepcopy
from unittest.mock import AsyncMock, Mock

import pytest
from asyncua import Server
from test_manual_nodes import MANUAL, payload
from test_panel import NODES, prepare

from custom_components.ha_opcua import AsyncuaCoordinator, OpcuaHub
from custom_components.ha_opcua.const import CONF_NODE_SETTINGS
from custom_components.ha_opcua.node_settings import validate_settings
from custom_components.ha_opcua.panel import (
    async_create_entity,
    async_save_entity,
    endpoint_snapshot,
)

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize("invalid", [True, None, "auto", "push", 1, []])
async def test_update_mode_rejects_invalid_values(invalid):
    with pytest.raises(ValueError, match="invalid_update_mode"):
        validate_settings(NODES[0], {"update_mode": invalid})


async def test_panel_preserves_selection_and_deadband_when_returning_to_polling(
    hass, entry
):
    c, _, msg = await prepare(hass, entry)
    try:
        msg.update(
            key="ns=2;i=3",
            node_id="ns=2;i=3",
            update_mode="subscription",
            deadband=3,
            invert_state=False,
        )
        await async_save_entity(hass, msg)
        row = next(
            r for r in endpoint_snapshot(hass, entry)["rows"] if r["key"] == msg["key"]
        )
        assert row["settings"]["update_mode"] == "subscription"
        assert row["settings"]["deadband"] == 3
        # Clients omitting update_mode must not erase a saved selection.
        msg.pop("update_mode")
        msg["revision"] = endpoint_snapshot(hass, entry)["revision"]
        await async_save_entity(hass, msg)
        assert (
            entry.options[CONF_NODE_SETTINGS][msg["key"]]["update_mode"]
            == "subscription"
        )
        msg.update(
            update_mode="polling", revision=endpoint_snapshot(hass, entry)["revision"]
        )
        msg.pop("deadband")
        await async_save_entity(hass, msg)
        saved = entry.options[CONF_NODE_SETTINGS][msg["key"]]
        assert saved["update_mode"] == "polling" and saved["deadband"] == 3
    finally:
        await c.async_shutdown()


async def test_manual_node_subscription_survives_coordinator_recreation(hass, entry):
    c, _, _ = await prepare(hass, entry)
    c.hub.inspect_node = AsyncMock(return_value=MANUAL)
    try:
        await async_create_entity(
            hass, payload(hass, entry, update_mode="subscription")
        )
        restored = AsyncuaCoordinator(
            hass, "PLC", c.hub, config_entry=entry, subscription_enabled=True
        )
        try:
            restored.set_nodes([*NODES, MANUAL])
            assert restored._subscription_target_ids() == [MANUAL["node_id"]]
            assert len(restored._active_target_ids()) == 4
        finally:
            await restored.async_shutdown()
    finally:
        await c.async_shutdown()


async def test_shared_target_filters_push_recipients_and_uses_smallest_deadband(hass):
    hub = Mock(ensure_subscription=AsyncMock(), disable_subscription=AsyncMock())
    c = AsyncuaCoordinator(hass, "PLC", hub, subscription_enabled=True)
    nodes = [
        {"name": key, "node_id": key, "variant_type": "Float", "writable": False}
        for key in ("a", "b", "c", "d")
    ]
    c.node_settings = {
        "a": {"update_mode": "subscription", "deadband": 2},
        "b": {"update_mode": "subscription", "node_id": "a", "deadband": 0.5},
        "c": {"node_id": "a", "deadband": 0},
        "d": {"platform": "disabled", "update_mode": "subscription", "deadband": 0},
    }
    try:
        c.set_nodes(nodes)
        c.data = dict.fromkeys(("a", "b", "c"), 1)
        assert c._subscription_target_ids() == ["a"]
        assert c._target_deadbands() == {"a": 0.5}
        c._on_subscription_data("a", 9)
        assert c.data == {"a": 9, "b": 9, "c": 1}
        c.node_settings["b"]["deadband"] = 0
        assert c._target_deadbands() == {"a": 0}
        saved = deepcopy(c.node_settings)
        await c.async_set_subscription_enabled(False)
        c._on_subscription_data("a", 99)  # In-flight notifications after switch-off.
        assert c.data == {"a": 9, "b": 9, "c": 1}
        await c.async_set_subscription_enabled(True)
        hub.ensure_subscription.assert_awaited_once_with(["a"], {"a": 0})
        assert c.node_settings == saved
        c.enabled = False
        await c.async_set_subscription_enabled(False)
        await c.async_set_subscription_enabled(True)
        hub.ensure_subscription.assert_awaited_once()  # Never reconnect while paused.
    finally:
        await c.async_shutdown()


async def test_polling_and_selected_push_against_local_server(hass, unused_tcp_port):
    server = Server()
    await server.init()
    server.set_endpoint(f"opc.tcp://127.0.0.1:{unused_tcp_port}/")
    ns = await server.register_namespace("urn:subscription-selection-test")
    root = await server.nodes.objects.add_object(ns, "PLC")
    pushed = await root.add_variable(ns, "Push", 1)
    polled = await root.add_variable(ns, "Poll", 1)
    push_id, poll_id = pushed.nodeid.to_string(), polled.nodeid.to_string()
    hub = OpcuaHub("PLC", server.endpoint.geturl(), root.nodeid.to_string())
    c = AsyncuaCoordinator(hass, "PLC", hub, subscription_enabled=True)
    c._discovery_pending = True
    received = asyncio.Event()

    def changed(node_id, value):
        c._on_subscription_data(node_id, value)
        if node_id == push_id and value == 42:
            received.set()

    hub.on_data_change = changed
    async with server:
        try:
            await c.async_refresh()
            assert c.last_update_success
            assert not hub.subscription_active  # Master on alone subscribes nothing.
            c.node_settings[push_id] = {"update_mode": "subscription", "deadband": 0}
            await c.async_refresh()
            assert hub._subscribed_node_ids == {push_id}
            await polled.write_value(42)
            await pushed.write_value(42)
            await asyncio.wait_for(received.wait(), timeout=5)
            assert c.data[push_id] == 42 and c.data[poll_id] == 1
            await c.async_refresh()
            assert c.data[poll_id] == 42
            # Removing the final selection deletes the subscription, preserving polling.
            c.node_settings[push_id]["update_mode"] = "polling"
            await c.async_refresh()
            assert c.last_update_success and not hub.subscription_active
        finally:
            await c.async_shutdown()
            await hub.disconnect()
