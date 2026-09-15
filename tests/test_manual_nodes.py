"""Manual nodes are validated live, persisted, and read outside discovery."""

from copy import deepcopy
from unittest.mock import AsyncMock

import pytest
from asyncua import Server, ua
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import entity_registry as er
from test_panel import prepare

from custom_components.ha_opcua_discovery import AsyncuaCoordinator, OpcuaHub
from custom_components.ha_opcua_discovery.const import (
    CONF_MANUAL_NODES,
    CONF_NODE_SETTINGS,
    DOMAIN,
)
from custom_components.ha_opcua_discovery.entity import async_setup_node_entities
from custom_components.ha_opcua_discovery.panel import (
    async_create_entity,
    async_inspect_node,
    async_remove_manual_node,
    async_save_entity,
    endpoint_snapshot,
)
from custom_components.ha_opcua_discovery.text import AsyncuaText

pytestmark = pytest.mark.asyncio

MANUAL = {
    "name": "Recipe",
    "node_id": "ns=2;s=Recipe",
    "variant_type": "String",
    "writable": True,
}


def payload(hass, entry, **changes):
    return {
        "entry_id": entry.entry_id,
        "revision": endpoint_snapshot(hass, entry)["revision"],
        "node_id": MANUAL["node_id"],
        "platform": "text",
        "name": "Recipe name",
        "area_id": None,
        "device_class": None,
        "invert_state": False,
        **changes,
    }


async def test_manual_node_outside_root_survives_reload_and_writes(
    hass, entry, unused_tcp_port
):
    await ar.async_load(hass)
    area = ar.async_get(hass).async_create("Workshop")
    server = Server()
    await server.init()
    server.set_endpoint(f"opc.tcp://127.0.0.1:{unused_tcp_port}/")
    server.set_security_policy([ua.SecurityPolicyType.NoSecurity])
    ns = await server.register_namespace("urn:manual-test")
    root = await server.nodes.objects.add_object(ns, "Empty discovery root")
    outside = await server.nodes.objects.add_variable(
        ua.NodeId("Recipe", ns), "Recipe", "Initial"
    )
    await outside.set_writable()
    hub = OpcuaHub("PLC", server.endpoint.geturl(), root.nodeid.to_string())
    c = AsyncuaCoordinator(hass, "PLC", hub, config_entry=entry)
    hass.data[DOMAIN] = {"PLC": c}
    restored = None
    async with server:
        try:
            await c.async_refresh()
            assert c.nodes == {}
            msg = payload(
                hass, entry, node_id=outside.nodeid.to_string(), area_id=area.id
            )
            inspected = await async_inspect_node(hass, msg)
            assert inspected["platforms"] == ["sensor", "text"]
            assert entry.options == {}
            result = await async_create_entity(hass, msg)
            assert await outside.read_value() == "Initial"  # Creation never writes.
            registered = er.async_get(hass).async_get(result["entity_id"])
            assert registered.name == "Recipe name" and registered.area_id == area.id
            assert registered.device_id
            node_id = outside.nodeid.to_string()
            assert entry.options[CONF_MANUAL_NODES][node_id]["variant_type"] == "String"
            await c.async_shutdown()
            # Manual nodes work even when the discovery root is no longer accessible.
            hub.root_node_id = "ns=2;s=missing-root"
            restored = AsyncuaCoordinator(hass, "PLC", hub, config_entry=entry)
            hass.data[DOMAIN]["PLC"] = restored
            await restored.async_refresh()
            assert restored.last_update_success
            assert restored.data[node_id] == "Initial"
            entities = []
            async_setup_node_entities(
                restored, entry, entities.extend, "text", AsyncuaText
            )
            assert len(entities) == 1
            text = entities[0]
            assert text.unique_id == registered.unique_id
            await text.async_set_value("  [Recipe A]  ")
            assert await outside.read_value() == "  [Recipe A]  "
            assert restored.data[node_id] == "  [Recipe A]  "
            with pytest.raises(ValueError, match="node_already_configured"):
                await async_create_entity(hass, payload(hass, entry, node_id=node_id))
            # Discovery can later reach the manual node without duplicating it.
            await root.add_reference(
                outside, ua.ObjectIds.HasComponent, bidirectional=False
            )
            hub.root_node_id = root.nodeid.to_string()
            restored._discovery_pending = True
            await restored.async_refresh()
            assert list(restored.nodes) == [node_id]
            assert len(entities) == 1
        finally:
            await c.async_shutdown()
            if restored:
                await restored.async_shutdown()
            await hub.disconnect()


@pytest.mark.parametrize(
    ("changes", "error"),
    [
        ({"platform": "switch"}, "incompatible_platform"),
        ({"platform": "disabled"}, "incompatible_platform"),
        ({"invert_state": True}, "invalid_inversion"),
        ({"device_class": "door"}, "invalid_device_class"),
        ({"area_id": "missing"}, "area_not_found"),
        ({"name": "x" * 256}, "invalid_name"),
        ({"revision": "stale"}, "stale_configuration"),
    ],
)
async def test_invalid_creation_never_persists(hass, entry, changes, error):
    c, _, _ = await prepare(hass, entry)
    c.hub.inspect_node = AsyncMock(return_value=MANUAL)
    before = deepcopy(dict(entry.options))
    registry = er.async_get(hass)
    old_entities = list(registry.entities)
    with pytest.raises(ValueError, match=error):
        await async_create_entity(hass, payload(hass, entry, **changes))
    assert dict(entry.options) == before
    assert list(registry.entities) == old_entities
    c.hub.set_value.assert_not_awaited()
    await c.async_shutdown()


async def test_creation_revalidates_server_permissions_and_detects_concurrent_changes(
    hass, entry
):
    c, _, _ = await prepare(hass, entry)
    c.hub.inspect_node = AsyncMock(return_value=MANUAL)
    await async_inspect_node(hass, payload(hass, entry))
    c.hub.inspect_node.return_value = {**MANUAL, "writable": False}
    with pytest.raises(ValueError, match="incompatible_platform"):
        await async_create_entity(hass, payload(hass, entry))

    async def changed(_):
        hass.config_entries.async_update_entry(entry, options={"scan_interval": 15})
        return MANUAL

    c.hub.inspect_node.side_effect = changed
    with pytest.raises(ValueError, match="stale_configuration"):
        await async_create_entity(hass, payload(hass, entry))
    assert CONF_MANUAL_NODES not in entry.options
    await c.async_shutdown()


async def test_temporarily_unreadable_manual_node_recovers_without_reload(hass, entry):
    hass.config_entries.async_update_entry(
        entry,
        options={
            CONF_MANUAL_NODES: {MANUAL["node_id"]: MANUAL},
            CONF_NODE_SETTINGS: {MANUAL["node_id"]: {"platform": "text"}},
        },
    )
    hub = OpcuaHub("PLC", "opc.tcp://localhost:4840", "ns=2;i=1")
    hub.discover_nodes = AsyncMock(return_value=[])
    hub.inspect_node = AsyncMock(
        side_effect=[ua.UaStatusCodeError(ua.StatusCodes.BadNodeIdUnknown), MANUAL]
    )
    hub.get_values = AsyncMock(return_value={})
    c = AsyncuaCoordinator(hass, "PLC", hub, config_entry=entry)
    await c.async_refresh()
    assert MANUAL["node_id"] in c.nodes
    added = []
    async_setup_node_entities(c, entry, added.extend, "text", AsyncuaText)
    assert added == []
    hub.get_values.return_value = {MANUAL["node_id"]: "Recovered"}
    await c.async_refresh()
    assert len(added) == 1
    assert added[0].native_value == "Recovered"
    hub.discover_nodes.assert_awaited_once()
    await c.async_set_connection_enabled(False)
    await c.async_refresh()
    assert hub.inspect_node.await_count == 2
    await c.async_shutdown()


async def test_disabled_connection_and_unreadable_node_report_errors(hass, entry):
    c, _, _ = await prepare(hass, entry)
    c.hub.inspect_node = AsyncMock(
        side_effect=ua.UaStatusCodeError(ua.StatusCodes.BadUserAccessDenied)
    )
    with pytest.raises(ValueError, match="node_unreadable"):
        await async_inspect_node(hass, payload(hass, entry))
    c.enabled = False
    with pytest.raises(ValueError, match="connection_disabled"):
        await async_create_entity(hass, payload(hass, entry))
    assert c.hub.inspect_node.await_count == 1
    assert not entry.options
    await c.async_shutdown()


async def test_inspection_rejects_invalid_ids_objects_arrays_and_unknown_nodes(
    unused_tcp_port,
):
    server = Server()
    await server.init()
    server.set_endpoint(f"opc.tcp://127.0.0.1:{unused_tcp_port}/")
    ns = await server.register_namespace("urn:manual-invalid-test")
    root = await server.nodes.objects.add_object(ns, "Root")
    array = await root.add_variable(ns, "Array", [1, 2])
    readonly = await root.add_variable(ns, "Read only", False)
    hub = OpcuaHub("PLC", server.endpoint.geturl(), root.nodeid.to_string())
    async with server:
        try:
            for node_id in ("garbage", "ns=x;i=2", "i=0", ""):
                with pytest.raises(ValueError, match="invalid_node_id"):
                    await hub.inspect_node(node_id)
            for node in (root, array):
                with pytest.raises(ValueError, match="unsupported_node"):
                    await hub.inspect_node(node.nodeid.to_string())
            with pytest.raises(ua.UaStatusCodeError):
                await hub.inspect_node("ns=2;s=unknown")
            inspected = await hub.inspect_node(readonly.nodeid.to_string())
            assert inspected["variant_type"] == "Boolean"
            assert not inspected["writable"]
        finally:
            await hub.disconnect()


async def prepare_removal(hass, entry):
    c, other, _ = await prepare(hass, entry)
    c.hub.inspect_node = AsyncMock(return_value=MANUAL)
    created = await async_create_entity(hass, payload(hass, entry))
    await c.async_shutdown()
    restored = AsyncuaCoordinator(hass, "PLC", c.hub, config_entry=entry)
    restored.set_nodes([*c.nodes.values(), MANUAL])
    hass.data[DOMAIN]["PLC"] = restored
    return restored, other, created["entity_id"]


def removal_payload(hass, entry):
    return {
        "entry_id": entry.entry_id,
        "revision": endpoint_snapshot(hass, entry)["revision"],
        "key": MANUAL["node_id"],
    }


async def test_remove_offline_manual_node_cleans_registry_and_stays_excluded(
    hass, entry
):
    c, other, entity_id = await prepare_removal(hass, entry)
    registry = er.async_get(hass)
    old_sensor = registry.async_get_or_create(
        "sensor", DOMAIN, f"{entry.entry_id}:{MANUAL['node_id']}", config_entry=entry
    )
    control = AsyncuaText(c, "Recipe", MANUAL["node_id"], entry.entry_id)
    # Disabled/offline connections must not prevent local deletion or cause I/O.
    c.enabled = False
    c.hub.inspect_node.reset_mock()
    result = await async_remove_manual_node(hass, removal_payload(hass, entry))
    assert set(result["entity_ids"]) == {entity_id, old_sensor.entity_id}
    assert registry.async_get(entity_id) is None
    assert registry.async_get(other.entity_id) is not None
    assert CONF_MANUAL_NODES not in entry.options
    assert entry.options[CONF_NODE_SETTINGS][MANUAL["node_id"]] == {
        "platform": "disabled"
    }
    assert MANUAL["node_id"] not in c._manual_pending
    c.hub.inspect_node.assert_not_awaited()
    with pytest.raises(HomeAssistantError, match="disabled or removed"):
        await control.async_set_value("Should not write")
    c.hub.set_value.assert_not_awaited()
    # A subsequent discovery can list the node, but cannot recreate its entity.
    restored = AsyncuaCoordinator(hass, "PLC", c.hub, config_entry=entry)
    restored.set_nodes([MANUAL])
    added = []
    async_setup_node_entities(restored, entry, added.extend, "text", AsyncuaText)
    assert added == []
    await restored.async_refresh()
    assert MANUAL["node_id"] not in c.hub.get_values.call_args.args[0]
    await c.async_shutdown()
    await restored.async_shutdown()


async def test_remove_without_loaded_coordinator_and_readd(hass, entry):
    c, _, entity_id = await prepare_removal(hass, entry)
    hass.data[DOMAIN].clear()
    row = next(
        r
        for r in endpoint_snapshot(hass, entry)["rows"]
        if r["key"] == MANUAL["node_id"]
    )
    assert row["manual"] and not row["editable"]
    assert row["entity_id"] == entity_id
    await async_remove_manual_node(hass, removal_payload(hass, entry))
    assert not endpoint_snapshot(hass, entry)["rows"]
    restored = AsyncuaCoordinator(hass, "PLC", c.hub, config_entry=entry)
    restored.set_nodes([])
    hass.data[DOMAIN]["PLC"] = restored
    await async_create_entity(hass, payload(hass, entry))
    assert MANUAL["node_id"] in entry.options[CONF_MANUAL_NODES]
    assert entry.options[CONF_NODE_SETTINGS][MANUAL["node_id"]]["platform"] == "text"
    await c.async_shutdown()
    await restored.async_shutdown()


@pytest.mark.parametrize(
    "failure",
    ["stale_configuration", "not_manual_node", "node_in_use", "endpoint_not_found"],
)
async def test_invalid_removal_is_atomic(hass, entry, failure):
    c, _, entity_id = await prepare_removal(hass, entry)
    if failure == "node_in_use":
        options = deepcopy(dict(entry.options))
        options[CONF_NODE_SETTINGS]["ns=2;i=1"] = {
            "node_id": MANUAL["node_id"],
            "platform": "disabled",
        }
        hass.config_entries.async_update_entry(entry, options=options)
    msg = removal_payload(hass, entry)
    if failure == "stale_configuration":
        msg["revision"] = "old"
    elif failure == "not_manual_node":
        msg["key"] = "ns=2;i=1"
    elif failure == "endpoint_not_found":
        msg["entry_id"] = "missing"
    before = deepcopy(dict(entry.options))
    with pytest.raises(ValueError, match=failure):
        await async_remove_manual_node(hass, msg)
    assert dict(entry.options) == before
    assert er.async_get(hass).async_get(entity_id) is not None
    assert MANUAL["node_id"] in c.manual_nodes
    await c.async_shutdown()


async def test_manual_text_limits_create_edit_and_invalid_save(hass, entry):
    c, _, _ = await prepare(hass, entry)
    c.hub.inspect_node = AsyncMock(return_value=MANUAL)
    initial = payload(hass, entry, limits={"min_length": 2, "max_length": 40})
    created = await async_create_entity(hass, initial)
    assert entry.options[CONF_NODE_SETTINGS][MANUAL["node_id"]]["max_length"] == 40
    restored = AsyncuaCoordinator(hass, "PLC", c.hub, config_entry=entry)
    restored.set_nodes([MANUAL])
    hass.data[DOMAIN]["PLC"] = restored
    msg = {
        **payload(hass, entry),
        "key": MANUAL["node_id"],
        "limits": {"min_length": 0, "max_length": 80},
    }
    assert (await async_save_entity(hass, msg))["entity_id"] == created["entity_id"]
    before = deepcopy(dict(entry.options))
    for limits in (
        {"min_length": 3, "max_length": 2},
        {"max_length": 256},
        {"min_length": 0.5},
    ):
        with pytest.raises(ValueError, match="invalid_text_limits"):
            await async_save_entity(
                hass,
                {
                    **msg,
                    "revision": endpoint_snapshot(hass, entry)["revision"],
                    "limits": limits,
                },
            )
    assert dict(entry.options) == before
    await c.async_shutdown()
    await restored.async_shutdown()
