"""Repeated field names across struct instances are told apart by their parent."""

from unittest.mock import AsyncMock

import pytest
from homeassistant.helpers import entity_registry as er

from custom_components.ha_opcua import (
    AsyncuaCoordinator,
    OpcuaHub,
    _migrate_entity_ids,
    entity_unique_id,
)
from custom_components.ha_opcua.const import CONF_NODE_SETTINGS, DOMAIN
from custom_components.ha_opcua.panel import (
    async_rename_array_fields,
    endpoint_snapshot,
)

pytestmark = pytest.mark.asyncio

PARAM = "ns=4;s=|var|PLC.Application.PARAM"
NORTH = {
    "name": "xEnable",
    "node_id": f"{PARAM}.Pump_North.xEnable",
    "variant_type": "Int16",
    "writable": False,
}
SOUTH = {
    "name": "xEnable",
    "node_id": f"{PARAM}.Pump_South.xEnable",
    "variant_type": "Int16",
    "writable": False,
}
UNIQUE = {
    "name": "rOnlyHere",
    "node_id": f"{PARAM}.Pump_South.rOnlyHere",
    "variant_type": "Int16",
    "writable": False,
}
NORTH_NAME = "Pump_North · xEnable"
SOUTH_NAME = "Pump_South · xEnable"
ALL = [NORTH, SOUTH, UNIQUE]


def coordinator(hass, entry, *, known):
    hub = OpcuaHub("PLC", "opc.tcp://localhost:4840", PARAM)
    hub.get_values = AsyncMock(return_value={node["node_id"]: 1 for node in ALL})
    hub.set_value = AsyncMock()
    c = AsyncuaCoordinator(hass, "PLC", hub, config_entry=entry)
    c.known_node_ids = {node["node_id"] for node in ALL} if known else set()
    c._known_node_ids_initialized = True
    c.set_nodes(ALL)
    hass.data[DOMAIN] = {"PLC": c}
    return c


def register(hass, entry):
    registry = er.async_get(hass)
    return [
        registry.async_get_or_create(
            "sensor",
            DOMAIN,
            entity_unique_id(entry.entry_id, node["node_id"]),
            config_entry=entry,
            original_name=node["name"],
        )
        for node in ALL
    ]


async def test_new_colliding_fields_are_named_by_their_parent_from_the_start(
    hass, entry
):
    c = coordinator(hass, entry, known=False)

    assert c.nodes[NORTH["node_id"]]["name"] == NORTH_NAME
    assert c.nodes[SOUTH["node_id"]]["name"] == SOUTH_NAME
    assert c.node_settings[NORTH["node_id"]]["display_name"] == NORTH_NAME
    # A name that is unique keeps its field name - nothing to tell apart.
    assert c.nodes[UNIQUE["node_id"]]["name"] == "rOnlyHere"
    assert "display_name" not in c.node_settings.get(UNIQUE["node_id"], {})

    await c.async_shutdown()


async def test_known_nodes_are_never_renamed_by_discovery(hass, entry):
    c = coordinator(hass, entry, known=True)

    assert c.nodes[NORTH["node_id"]]["name"] == "xEnable"
    assert c.nodes[SOUTH["node_id"]]["name"] == "xEnable"
    assert NORTH["node_id"] not in c.node_settings

    await c.async_shutdown()


async def test_existing_colliding_fields_are_offered_with_their_parent_name(
    hass, entry
):
    c = coordinator(hass, entry, known=True)
    register(hass, entry)

    snapshot = endpoint_snapshot(hass, entry)
    by_key = {row["key"]: row for row in snapshot["rows"]}

    assert snapshot["renamable_fields"] == 2
    assert by_key[NORTH["node_id"]]["renamable"] is True
    assert by_key[NORTH["node_id"]]["proposed_name"] == NORTH_NAME
    assert by_key[SOUTH["node_id"]]["proposed_name"] == SOUTH_NAME
    assert by_key[UNIQUE["node_id"]]["renamable"] is False
    assert by_key[UNIQUE["node_id"]]["proposed_name"] is None

    await c.async_shutdown()


async def test_rename_applies_only_the_selected_and_keeps_custom_names(hass, entry):
    c = coordinator(hass, entry, known=True)
    north, south, _ = register(hass, entry)
    registry = er.async_get(hass)
    snapshot = endpoint_snapshot(hass, entry)

    result = await async_rename_array_fields(
        hass,
        {
            "entry_id": entry.entry_id,
            "revision": snapshot["revision"],
            "keys": [NORTH["node_id"]],
        },
    )

    assert result["renamed"] == [NORTH["node_id"]]
    assert registry.async_get(north.entity_id).name == NORTH_NAME
    assert registry.async_get(south.entity_id).name is None
    assert (
        entry.options[CONF_NODE_SETTINGS][NORTH["node_id"]]["display_name"]
        == NORTH_NAME
    )
    assert SOUTH["node_id"] not in entry.options.get(CONF_NODE_SETTINGS, {})

    # A name the user chose by hand is not offered and never overridden.
    registry.async_update_entity(south.entity_id, name="South custom")
    again = endpoint_snapshot(hass, entry)
    by_key = {row["key"]: row for row in again["rows"]}
    assert by_key[SOUTH["node_id"]]["renamable"] is False

    await c.async_shutdown()


async def test_rename_clears_the_duplicate_name_warning(hass, entry, caplog):
    c = coordinator(hass, entry, known=True)
    register(hass, entry)
    c.hub.discovery_complete = True

    caplog.clear()
    _migrate_entity_ids(hass, entry, c)
    assert "Duplicate OPC UA name 'xEnable'" in caplog.text

    snapshot = endpoint_snapshot(hass, entry)
    await async_rename_array_fields(
        hass,
        {
            "entry_id": entry.entry_id,
            "revision": snapshot["revision"],
            "keys": [NORTH["node_id"], SOUTH["node_id"]],
        },
    )
    # Saving the options reloads the endpoint; a fresh coordinator is what
    # then reads the persisted display names at its next discovery.
    await c.async_shutdown()
    c = coordinator(hass, entry, known=True)
    c.hub.discovery_complete = True

    assert c.nodes[NORTH["node_id"]]["name"] == NORTH_NAME
    assert c.nodes[SOUTH["node_id"]]["name"] == SOUTH_NAME
    caplog.clear()
    _migrate_entity_ids(hass, entry, c)
    assert "Duplicate OPC UA name" not in caplog.text

    await c.async_shutdown()
