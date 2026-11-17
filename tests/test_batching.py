"""Batched OPC UA requests: same discovery result, far fewer round trips."""

import asyncio
from unittest.mock import AsyncMock, Mock

import pytest
from asyncua import Server, ua

from custom_components.ha_opcua import _OPERATION_LIMIT_IDS, OpcuaHub
from custom_components.ha_opcua.arrays import relative_paths

pytestmark = pytest.mark.asyncio


async def _server(port):
    server = Server()
    await server.init()
    server.set_endpoint(f"opc.tcp://127.0.0.1:{port}/")
    server.set_security_policy([ua.SecurityPolicyType.NoSecurity])
    namespace = await server.register_namespace("urn:opcua-discovery:batching")
    return server, namespace


async def _build_plant(server, namespace, lines=4, stations=5, signals=6):
    """A few hundred variables in nested objects, with shared and cyclic references."""
    root = await server.nodes.objects.add_object(namespace, "Plant")
    variables = []
    for line_index in range(lines):
        line = await root.add_object(namespace, f"Line{line_index}")
        for station_index in range(stations):
            station = await line.add_object(namespace, f"Station{station_index}")
            for signal in range(signals):
                variables.append(
                    await station.add_variable(
                        namespace,
                        f"Signal{signal}",
                        ua.Variant(signal, ua.VariantType.Int32),
                    )
                )
            # Arrays are skipped, but their metadata is still read.
            await station.add_variable(namespace, "Trend", [1.0, 2.0])
    # The address space is a graph: a variable reachable twice and a cycle.
    first_line = (await root.get_children())[0]
    await root.add_reference(variables[-1], ua.ObjectIds.Organizes, False)
    await first_line.add_reference(root, ua.ObjectIds.Organizes, False)
    # A variable with a custom subtype of a built-in DataType.
    custom_type = await server.nodes.base_data_type.get_child(
        ["0:Number", "0:Integer", "0:Int32"]
    )
    subtype = await custom_type.add_data_type(namespace, "Counter")
    await root.add_variable(
        namespace,
        "Counter",
        ua.Variant(0, ua.VariantType.Int32),
        datatype=subtype.nodeid,
    )
    await variables[0].set_writable()
    return root


async def _reference_walk(client, root_node_id):
    """The previous node-by-node discovery, kept here as the expected result."""
    discovered, paths, visited = [], {}, set()

    async def visit(node, parent_path):
        node_id = node.nodeid.to_string()
        if node_id in visited:
            return
        visited.add(node_id)
        node_class = await node.read_node_class()
        name = (await node.read_browse_name()).Name
        path = [] if parent_path is None else [*parent_path, name]
        if node_class == ua.NodeClass.Variable:
            try:
                metadata = await OpcuaHub._read_node_metadata(node, name)
            except ValueError:
                pass
            else:
                discovered.append(metadata)
                paths[node_id] = path
        if node_class in (
            ua.NodeClass.Object,
            ua.NodeClass.ObjectType,
            ua.NodeClass.VariableType,
            ua.NodeClass.Variable,
        ):
            for child in await node.get_children():
                await visit(child, path)

    await visit(client.get_node(root_node_id), None)
    return discovered, relative_paths(paths)


def _count_requests(hub):
    counts = {"read": 0, "browse": 0, "browse_next": 0}
    uaclient = hub.client.uaclient
    for name in counts:
        original = getattr(uaclient, name)

        async def counted(params, _name=name, _original=original):
            counts[_name] += 1
            return await _original(params)

        setattr(uaclient, name, counted)
    return counts


async def test_batched_discovery_matches_node_by_node_walk(unused_tcp_port):
    server, namespace = await _server(unused_tcp_port)
    root = await _build_plant(server, namespace)
    hub = OpcuaHub("test", server.endpoint.geturl(), root.nodeid.to_string())
    async with server:
        try:
            assert await hub.connect()
            expected, expected_paths = await _reference_walk(
                hub.client, root.nodeid.to_string()
            )
            counts = _count_requests(hub)
            discovered = await hub.discover_nodes()
            assert discovered == expected
            assert hub.node_paths == expected_paths
            assert hub.discovery_complete
            assert len(discovered) == 4 * 5 * 6 + 1
            # Root + 4 levels of Browse; operation limits, root attributes and
            # 5 attributes x 141 variables in blocks of 500 for Read.
            assert counts["browse"] <= 5
            assert counts["browse_next"] == 0
            assert counts["read"] <= 1 + 1 + 2
        finally:
            await hub.disconnect(permanent=True)


async def test_get_values_reads_all_nodes_in_one_request(unused_tcp_port):
    server, namespace = await _server(unused_tcp_port)
    root = await _build_plant(server, namespace)
    hub = OpcuaHub("test", server.endpoint.geturl(), root.nodeid.to_string())
    async with server:
        try:
            nodes = await hub.discover_nodes()
            counts = _count_requests(hub)
            values = await hub.get_values([node["node_id"] for node in nodes])
            assert len(values) == len(nodes)
            assert counts["read"] == 1
        finally:
            await hub.disconnect(permanent=True)


async def test_server_operation_limits_split_reads_and_browses(unused_tcp_port):
    server, namespace = await _server(unused_tcp_port)
    root = await _build_plant(server, namespace)
    for kind, limit in (("read", 7), ("browse", 2)):
        await server.get_node(_OPERATION_LIMIT_IDS[kind]).write_value(
            ua.Variant(limit, ua.VariantType.UInt32)
        )
    hub = OpcuaHub("test", server.endpoint.geturl(), root.nodeid.to_string())
    async with server:
        try:
            assert await hub.connect()
            expected, expected_paths = await _reference_walk(
                hub.client, root.nodeid.to_string()
            )
            counts = _count_requests(hub)
            assert await hub.discover_nodes() == expected
            assert hub.node_paths == expected_paths
            assert hub._block_sizes["read"] == 7
            assert hub._block_sizes["browse"] == 2
            # Levels of 1, 6 (4 lines, Counter, the shared variable), 20 and
            # 140 nodes browsed two at a time; variables are browsed as well.
            assert counts["browse"] == 1 + 3 + 10 + 70
            counts["read"] = 0
            values = await hub.get_values([node["node_id"] for node in expected])
            assert len(values) == len(expected)
            assert counts["read"] == -(-len(expected) // 7)
        finally:
            await hub.disconnect(permanent=True)


def _mock_hub(read):
    client = Mock(connect=AsyncMock(), disconnect=AsyncMock())
    client.uaclient.read = AsyncMock(side_effect=read)
    hub = OpcuaHub("test", "opc.tcp://localhost:4840", "ns=2;i=1")
    hub.client = client
    hub._connected = True
    return hub, client


async def test_block_is_halved_when_the_server_rejects_its_size():
    sizes = []

    async def read(params):
        count = len(params.NodesToRead)
        sizes.append(count)
        if params.NodesToRead[0].NodeId.NamespaceIndex == 0:
            return []  # operation limits unavailable
        if count > 3:
            raise ua.UaStatusCodeError(ua.StatusCodes.BadTooManyOperations)
        return [
            Mock(StatusCode=ua.StatusCode(), Value=ua.Variant(item.NodeId.Identifier))
            for item in params.NodesToRead
        ]

    hub, client = _mock_hub(read)
    node_ids = [f"ns=2;i={index}" for index in range(10)]
    assert await hub.get_values(node_ids) == {
        node_id: index for index, node_id in enumerate(node_ids)
    }
    # 10 rejected, 5 rejected, then blocks of 2 kept for the session.
    assert sizes[1:] == [10, 5, 2, 2, 1, 2, 2, 1]
    assert hub._block_sizes["read"] == 2
    client.disconnect.assert_not_awaited()


async def test_other_service_errors_are_not_retried():
    calls = []

    async def read(params):
        calls.append(len(params.NodesToRead))
        if params.NodesToRead[0].NodeId.NamespaceIndex == 0:
            return []
        raise ua.UaStatusCodeError(ua.StatusCodes.BadSessionIdInvalid)

    hub, client = _mock_hub(read)
    with pytest.raises(ua.UaStatusCodeError):
        await hub.get_values(["ns=2;i=1", "ns=2;i=2"])
    assert calls[1:] == [2]
    client.disconnect.assert_awaited_once()


async def test_subscription_creates_monitored_items_in_one_request(unused_tcp_port):
    server, namespace = await _server(unused_tcp_port)
    root = await _build_plant(server, namespace)
    hub = OpcuaHub("test", server.endpoint.geturl(), root.nodeid.to_string())
    hub.on_data_change = Mock()
    async with server:
        try:
            nodes = await hub.discover_nodes()
            node_ids = [node["node_id"] for node in nodes]
            calls = []
            session = hub.client.uaclient.session
            original = session.create_monitored_items

            async def counted(params):
                calls.append(len(params.ItemsToCreate))
                return await original(params)

            session.create_monitored_items = counted
            deadbands = {node_id: 1.0 for node_id in node_ids[:50]}
            deadbands[node_ids[50]] = 0.5
            await hub.ensure_subscription(node_ids, deadbands)
            assert hub.subscription_active
            assert hub._subscribed_node_ids == set(node_ids)
            # One request per deadband value, one for the unfiltered rest.
            assert sorted(calls) == [1, 50, len(node_ids) - 51]
        finally:
            await hub.disconnect(permanent=True)


async def test_rejected_monitored_item_falls_back_to_polling():
    hub, client = _mock_hub(AsyncMock(return_value=[]))
    hub.on_data_change = Mock()
    subscription = Mock(delete=AsyncMock())
    subscription.subscribe_data_change = AsyncMock(
        return_value=[7, ua.StatusCode(ua.StatusCodes.BadNodeIdUnknown)]
    )
    client.create_subscription = AsyncMock(return_value=subscription)
    await hub.ensure_subscription(["ns=2;i=1", "ns=2;i=2"])
    subscription.delete.assert_awaited_once()
    assert not hub.subscription_active
    assert hub._subscribed_node_ids == set()


async def test_rejected_deadband_filter_only_drops_that_nodes_filter():
    hub, client = _mock_hub(AsyncMock(return_value=[]))
    hub.on_data_change = Mock()
    subscription = Mock(delete=AsyncMock())
    subscription.deadband_monitor = AsyncMock(
        return_value=[11, ua.StatusCode(ua.StatusCodes.BadFilterNotAllowed), 13]
    )
    subscription.subscribe_data_change = AsyncMock(return_value=[22])
    client.create_subscription = AsyncMock(return_value=subscription)
    node_ids = ["ns=2;i=1", "ns=2;i=2", "ns=2;i=3"]
    await hub.ensure_subscription(node_ids, dict.fromkeys(node_ids, 0.5))
    subscription.deadband_monitor.assert_awaited_once()
    assert subscription.subscribe_data_change.await_args.args[0] == [
        client.get_node.return_value
    ]
    assert hub._sub_handles == {"ns=2;i=1": 11, "ns=2;i=2": 22, "ns=2;i=3": 13}
    assert hub.subscription_active


async def test_read_blocks_are_sent_in_parallel():
    in_flight = {"now": 0, "max": 0, "requests": 0}

    async def read(params):
        if params.NodesToRead[0].NodeId.NamespaceIndex == 0:
            return []
        in_flight["now"] += 1
        in_flight["requests"] += 1
        in_flight["max"] = max(in_flight["max"], in_flight["now"])
        await asyncio.sleep(0.01)
        in_flight["now"] -= 1
        return [
            Mock(StatusCode=ua.StatusCode(), Value=ua.Variant(item.NodeId.Identifier))
            for item in params.NodesToRead
        ]

    hub, _ = _mock_hub(read)
    hub._block_sizes = {"read": 10, "browse": 10, "monitor": 10}
    node_ids = [f"ns=2;i={index}" for index in range(95)]
    values = await hub.get_values(node_ids)
    # Results stay in request order across parallel blocks.
    assert list(values) == node_ids
    assert values == {node_id: index for index, node_id in enumerate(node_ids)}
    assert in_flight["requests"] == 10
    assert in_flight["max"] == 4
