"""Real OPC UA round trips and deterministic connection failure cases."""

import asyncio
from unittest.mock import AsyncMock, Mock

import pytest
from asyncua import Server, ua

from custom_components.ha_opcua_discovery import OpcuaHub

pytestmark = pytest.mark.asyncio


def connected_hub():
    node = Mock()
    node.read_value_rank = AsyncMock(return_value=ua.ValueRank.Scalar)
    node.read_data_type_as_variant_type = AsyncMock(return_value=ua.VariantType.String)
    node.write_value = AsyncMock()
    client = Mock()
    client.get_node.return_value = node
    client.connect = AsyncMock()
    client.disconnect = AsyncMock()
    hub = OpcuaHub("test", "opc.tcp://localhost:4840", "ns=2;i=1")
    hub.client = client
    hub._connected = True
    return hub, client, node


async def test_server_roundtrip_and_duplicate_names(unused_tcp_port):
    server = Server()
    await server.init()
    server.set_endpoint(f"opc.tcp://127.0.0.1:{unused_tcp_port}/")
    server.set_security_policy([ua.SecurityPolicyType.NoSecurity])
    namespace = await server.register_namespace("urn:opcua-discovery:test")
    root = await server.nodes.objects.add_object(namespace, "PLC")
    first = await root.add_object(namespace, "First")
    second = await root.add_object(namespace, "Second")
    a = await first.add_variable(namespace, "Status", "initial")
    b = await second.add_variable(namespace, "Status", "other")
    run = await root.add_variable(namespace, "Run", True)
    readonly = await root.add_variable(namespace, "ReadOnly", True)
    integer = await root.add_variable(
        namespace, "Integer", ua.Variant(0, ua.VariantType.Int16)
    )
    real = await root.add_variable(
        namespace, "Real", ua.Variant(0.0, ua.VariantType.Float)
    )
    for node in (a, b, run, integer, real):
        await node.set_writable()
    # The address space is a graph: visit a shared/cyclic reference only once.
    await second.add_reference(a, ua.ObjectIds.HasComponent, bidirectional=False)
    await first.add_reference(root, ua.ObjectIds.Organizes, bidirectional=False)
    hub = OpcuaHub("test", server.endpoint.geturl(), root.nodeid.to_string())
    async with server:
        try:
            assert await hub.connect()
            nodes = await hub.discover_nodes()
            ids = {node["node_id"] for node in nodes}
            assert a.nodeid.to_string() in ids and b.nodeid.to_string() in ids
            assert len(ids) == len(nodes) == 6
            flags = {node["node_id"]: node["writable_boolean"] for node in nodes}
            assert flags[run.nodeid.to_string()]
            assert not flags[readonly.nodeid.to_string()]
            for text in ("  Recipe A  ", "[A,B]", "[]", "", "caffè ☕"):
                await hub.set_value(a.nodeid.to_string(), text)
                assert await a.read_value() == text
            await hub.set_value(integer.nodeid.to_string(), "32767")
            await hub.set_value(real.nodeid.to_string(), "1.25")
            await hub.set_value(run.nodeid.to_string(), "false")
            values = await hub.get_values(ids)
            assert values[b.nodeid.to_string()] == "other"
            assert values[integer.nodeid.to_string()] == 32767
            assert values[real.nodeid.to_string()] == 1.25
            assert values[run.nodeid.to_string()] is False
            with pytest.raises(ValueError):
                await hub.set_value(integer.nodeid.to_string(), 32768)
            assert await integer.read_value() == 32767
            await hub.disconnect()
            # The following poll creates a fresh real session after disconnect.
            assert await hub.get_values([b.nodeid.to_string()]) == {
                b.nodeid.to_string(): "other"
            }
            hub.root_node_id = "ns=2;s=missing-root"
            with pytest.raises(ua.UaStatusCodeError):
                await hub.discover_nodes()
        finally:
            await hub.disconnect()


async def test_timeout_never_replays_write_and_next_operation_reconnects(monkeypatch):
    hub, client, node = connected_hub()
    node.write_value.side_effect = asyncio.TimeoutError("ack lost")
    replacement = Mock(connect=AsyncMock(), disconnect=AsyncMock())
    replacement.get_node.return_value = Mock(
        read_value=AsyncMock(return_value="applied")
    )
    factory = Mock(return_value=replacement)
    monkeypatch.setattr("custom_components.ha_opcua_discovery.Client", factory)
    with pytest.raises(asyncio.TimeoutError):
        await hub.set_value("ns=2;i=10", "command")
    node.write_value.assert_awaited_once()
    client.disconnect.assert_awaited_once()
    factory.assert_not_called()
    assert hub.client is None and not hub.is_connected
    assert await hub.get_values(["ns=2;i=10"]) == {"ns=2;i=10": "applied"}
    replacement.connect.assert_awaited_once()
    await hub.disconnect()


async def test_disconnect_closes_stale_client():
    hub, client, _ = connected_hub()
    hub._connected = False
    await hub.disconnect()
    client.disconnect.assert_awaited_once()
    assert hub.client is None


async def test_failed_connect_cleans_client_and_does_not_write(monkeypatch):
    hub, client, node = connected_hub()
    hub._connected = False
    failed = Mock(
        connect=AsyncMock(side_effect=ConnectionError()), disconnect=AsyncMock()
    )
    monkeypatch.setattr(
        "custom_components.ha_opcua_discovery.Client", Mock(return_value=failed)
    )
    with pytest.raises(ConnectionError):
        await hub.set_value("ns=2;i=10", "command")
    client.disconnect.assert_awaited_once()
    failed.disconnect.assert_awaited_once()
    failed.get_node.assert_not_called()
    node.write_value.assert_not_awaited()


async def test_node_error_does_not_close_healthy_session():
    hub, client, node = connected_hub()
    node.read_value = AsyncMock(
        side_effect=[ua.UaStatusCodeError(ua.StatusCodes.BadNodeIdUnknown), 42]
    )
    assert await hub.get_values(["ns=2;i=1", "ns=2;i=2"]) == {"ns=2;i=2": 42}
    assert hub.is_connected
    client.disconnect.assert_not_awaited()


async def test_session_status_error_closes_client():
    hub, client, node = connected_hub()
    node.read_value = AsyncMock(
        side_effect=ua.UaStatusCodeError(ua.StatusCodes.BadSessionIdInvalid)
    )
    with pytest.raises(ua.UaStatusCodeError):
        await hub.get_values(["ns=2;i=1"])
    client.disconnect.assert_awaited_once()
    assert not hub.is_connected


async def test_cancellation_propagates_without_reconnecting():
    hub, client, node = connected_hub()
    node.read_value = AsyncMock(side_effect=asyncio.CancelledError())
    with pytest.raises(asyncio.CancelledError):
        await hub.get_values(["ns=2;i=1"])
    client.disconnect.assert_awaited_once()
    client.connect.assert_not_awaited()


async def test_disconnect_waits_for_inflight_write():
    hub, client, node = connected_hub()
    started, release = asyncio.Event(), asyncio.Event()

    async def write(_value):
        started.set()
        await release.wait()

    node.write_value.side_effect = write
    task = asyncio.create_task(hub.set_value("ns=2;i=1", "value"))
    await asyncio.wait_for(started.wait(), 1)
    closing = asyncio.create_task(hub.disconnect())
    await asyncio.sleep(0)
    client.disconnect.assert_not_awaited()
    release.set()
    await asyncio.wait_for(asyncio.gather(task, closing), 1)
    client.disconnect.assert_awaited_once()


async def test_array_and_invalid_values_never_reach_write():
    hub, client, node = connected_hub()
    node.read_value_rank.return_value = ua.ValueRank.OneDimension
    with pytest.raises(ValueError, match="scalar"):
        await hub.set_value("ns=2;i=1", "[text]")
    node.read_value_rank.return_value = ua.ValueRank.Scalar
    node.read_data_type_as_variant_type.return_value = ua.VariantType.Boolean
    with pytest.raises(ValueError, match="boolean"):
        await hub.set_value("ns=2;i=1", "typo")
    node.write_value.assert_not_awaited()
    client.disconnect.assert_not_awaited()


async def test_permanent_close_rejects_queued_writes():
    hub, client, node = connected_hub()
    started, release = asyncio.Event(), asyncio.Event()

    async def write(_value):
        started.set()
        await release.wait()

    node.write_value.side_effect = write
    first = asyncio.create_task(hub.set_value("ns=2;i=1", "first"))
    await asyncio.wait_for(started.wait(), 1)
    queued = asyncio.create_task(hub.set_value("ns=2;i=1", "queued"))
    closing = asyncio.create_task(hub.disconnect(permanent=True))
    await asyncio.sleep(0)
    release.set()
    assert await asyncio.wait_for(first, 1)
    with pytest.raises(ConnectionError):
        await asyncio.wait_for(queued, 1)
    await asyncio.wait_for(closing, 1)
    node.write_value.assert_awaited_once()
    client.disconnect.assert_awaited_once()
    assert not await hub.connect()
