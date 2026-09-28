"""Native subscription cleanup and push-notification quality filtering."""

from unittest.mock import AsyncMock, Mock

import pytest
from asyncua import ua

from custom_components.ha_opcua import OpcuaHub, _OpcuaDataChangeHandler


def connected_hub_with_client():
    client = Mock()
    client.connect = AsyncMock()
    client.disconnect = AsyncMock()
    hub = OpcuaHub("test", "opc.tcp://localhost:4840", "ns=2;i=1")
    hub.client = client
    hub._connected = True
    hub.on_data_change = Mock()
    return hub, client


@pytest.mark.asyncio
async def test_subscription_deleted_server_side_when_monitored_item_fails():
    hub, client = connected_hub_with_client()
    subscription = Mock()
    subscription.delete = AsyncMock()
    subscription.subscribe_data_change = AsyncMock(
        side_effect=Exception("BadFilterNotAllowed")
    )
    client.create_subscription = AsyncMock(return_value=subscription)
    client.get_node.return_value = Mock()

    await hub.ensure_subscription(["ns=2;i=1"])

    subscription.delete.assert_awaited_once()
    assert hub._subscription is None
    assert hub._subscribed_node_ids == set()
    assert hub._sub_handles == {}


@pytest.mark.asyncio
async def test_next_ensure_call_creates_a_fresh_subscription_after_cleanup():
    hub, client = connected_hub_with_client()
    failing = Mock()
    failing.delete = AsyncMock()
    failing.subscribe_data_change = AsyncMock(side_effect=Exception("rejected"))
    working = Mock()
    working.subscribe_data_change = AsyncMock(return_value="handle")
    client.create_subscription = AsyncMock(side_effect=[failing, working])
    client.get_node.return_value = Mock()

    await hub.ensure_subscription(["ns=2;i=1"])
    failing.delete.assert_awaited_once()

    await hub.ensure_subscription(["ns=2;i=1"])
    assert hub._subscription is working
    assert hub._subscribed_node_ids == {"ns=2;i=1"}


@pytest.mark.asyncio
async def test_cleanup_failure_is_swallowed_and_still_falls_back_to_polling():
    hub, client = connected_hub_with_client()
    subscription = Mock()
    subscription.delete = AsyncMock(side_effect=Exception("connection already gone"))
    subscription.subscribe_data_change = AsyncMock(side_effect=Exception("rejected"))
    client.create_subscription = AsyncMock(return_value=subscription)
    client.get_node.return_value = Mock()

    await hub.ensure_subscription(["ns=2;i=1"])  # must not raise

    assert hub._subscription is None


def _notification(status_code):
    value = Mock(StatusCode=ua.StatusCode(status_code))
    monitored_item = Mock(Value=value)
    return Mock(monitored_item=monitored_item)


def test_good_status_notification_is_forwarded():
    calls = []
    handler = _OpcuaDataChangeHandler(lambda node_id, val: calls.append((node_id, val)))
    node = Mock()
    node.nodeid.to_string.return_value = "ns=2;i=1"

    handler.datachange_notification(node, 42, _notification(ua.StatusCodes.Good))

    assert calls == [("ns=2;i=1", 42)]


def test_bad_status_notification_is_discarded():
    calls = []
    handler = _OpcuaDataChangeHandler(lambda node_id, val: calls.append((node_id, val)))
    node = Mock()
    node.nodeid.to_string.return_value = "ns=2;i=1"

    handler.datachange_notification(
        node, 99, _notification(ua.StatusCodes.BadNoCommunication)
    )

    assert calls == []


def test_missing_status_code_is_treated_as_good():
    calls = []
    handler = _OpcuaDataChangeHandler(lambda node_id, val: calls.append((node_id, val)))
    node = Mock()
    node.nodeid.to_string.return_value = "ns=2;i=1"

    handler.datachange_notification(node, 7, Mock(monitored_item=None))

    assert calls == [("ns=2;i=1", 7)]
