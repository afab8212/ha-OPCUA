"""Opt-in naming of entities by their full PLC path below the root NodeId."""

from unittest.mock import AsyncMock

import pytest
from homeassistant.helpers import entity_registry as er

from custom_components.ha_opcua import AsyncuaCoordinator, OpcuaHub, entity_unique_id
from custom_components.ha_opcua.config_flow import AsyncUAOptionsFlow
from custom_components.ha_opcua.const import (
    CONF_NAME_WITH_PATH,
    CONF_NODE_SETTINGS,
    DOMAIN,
)
from custom_components.ha_opcua.panel import (
    async_rename_array_fields,
    async_set_name_with_path,
    endpoint_snapshot,
)

pytestmark = pytest.mark.asyncio

ROOT = "ns=4;s=|var|PLC.Application"


def node(path, name=None, variant="Int16"):
    return {
        "name": name or path.split(".")[-1],
        "node_id": f"{ROOT}.{path}",
        "variant_type": variant,
        "writable": False,
    }


SP = node("SP.xError", variant="Boolean")
PUMP = node("PARAM.Pump_North.xEnable")
ARRAY = node("PlantRelay.astAlarms[3].xActive", variant="Boolean")
TOP = node("Speed")
OUTSIDE = {
    "name": "Foreign",
    "node_id": "ns=4;s=|var|OTHER.Application.SP.Foreign",
    "variant_type": "Int16",
    "writable": False,
}
ALL = [SP, PUMP, ARRAY, TOP, OUTSIDE]


def enable(hass, entry, value=True):
    hass.config_entries.async_update_entry(
        entry, options={**entry.options, CONF_NAME_WITH_PATH: value}
    )


def coordinator(hass, entry, *, known):
    hub = OpcuaHub("PLC", "opc.tcp://localhost:4840", ROOT)
    hub.get_values = AsyncMock(return_value={n["node_id"]: 1 for n in ALL})
    hub.set_value = AsyncMock()
    c = AsyncuaCoordinator(hass, "PLC", hub, config_entry=entry)
    c.known_node_ids = {n["node_id"] for n in ALL} if known else set()
    c._known_node_ids_initialized = True
    c.set_nodes(ALL)
    hass.data[DOMAIN] = {"PLC": c}
    return c


def register(hass, entry):
    registry = er.async_get(hass)
    return {
        n["node_id"]: registry.async_get_or_create(
            "sensor",
            DOMAIN,
            entity_unique_id(entry.entry_id, n["node_id"]),
            config_entry=entry,
            original_name=n["name"],
        )
        for n in ALL
    }


async def test_off_by_default_keeps_unique_names_and_array_indexes(hass, entry):
    c = coordinator(hass, entry, known=False)

    assert c.nodes[SP["node_id"]]["name"] == "xError"
    assert c.nodes[PUMP["node_id"]]["name"] == "xEnable"
    assert c.nodes[ARRAY["node_id"]]["name"] == "astAlarms 3 · xActive"

    await c.async_shutdown()


async def test_on_names_new_nodes_with_their_full_path(hass, entry):
    enable(hass, entry)
    c = coordinator(hass, entry, known=False)

    assert c.nodes[SP["node_id"]]["name"] == "SP · xError"
    assert c.nodes[PUMP["node_id"]]["name"] == "PARAM · Pump_North · xEnable"
    assert c.nodes[ARRAY["node_id"]]["name"] == "PlantRelay · astAlarms 3 · xActive"
    assert c.node_settings[SP["node_id"]]["display_name"] == "SP · xError"
    # Directly under the root there is no group, and a node outside the
    # root has no path below it - both keep their plain name.
    assert c.nodes[TOP["node_id"]]["name"] == "Speed"
    assert c.nodes[OUTSIDE["node_id"]]["name"] == "Foreign"

    await c.async_shutdown()


async def test_on_never_renames_nodes_that_are_already_known(hass, entry):
    enable(hass, entry)
    c = coordinator(hass, entry, known=True)

    assert c.nodes[SP["node_id"]]["name"] == "xError"
    assert c.nodes[PUMP["node_id"]]["name"] == "xEnable"
    assert SP["node_id"] not in c.node_settings

    await c.async_shutdown()


async def test_existing_nodes_are_offered_their_path_only_when_on(hass, entry):
    c = coordinator(hass, entry, known=True)
    register(hass, entry)

    off = {r["key"]: r for r in endpoint_snapshot(hass, entry)["rows"]}
    assert off[SP["node_id"]]["proposed_name"] is None
    assert off[SP["node_id"]]["renamable"] is False
    # Grouping by path does not depend on the naming switch.
    assert off[SP["node_id"]]["path_group"] == "SP"
    assert off[PUMP["node_id"]]["path_label"] == "PARAM › Pump_North"
    assert off[TOP["node_id"]]["path_group"] is None

    enable(hass, entry)
    snapshot = endpoint_snapshot(hass, entry)
    on = {r["key"]: r for r in snapshot["rows"]}
    assert on[SP["node_id"]]["proposed_name"] == "SP · xError"
    assert on[SP["node_id"]]["renamable"] is True
    assert on[TOP["node_id"]]["renamable"] is False
    assert on[OUTSIDE["node_id"]]["renamable"] is False
    assert snapshot["renamable_fields"] == 3

    await c.async_shutdown()


async def test_renaming_applies_the_path_and_survives_a_reload(hass, entry):
    c = coordinator(hass, entry, known=True)
    entities = register(hass, entry)
    enable(hass, entry)
    snapshot = endpoint_snapshot(hass, entry)

    result = await async_rename_array_fields(
        hass,
        {
            "entry_id": entry.entry_id,
            "revision": snapshot["revision"],
            "keys": [SP["node_id"], PUMP["node_id"]],
        },
    )

    assert set(result["renamed"]) == {SP["node_id"], PUMP["node_id"]}
    registry = er.async_get(hass)
    assert registry.async_get(entities[SP["node_id"]].entity_id).name == "SP · xError"
    assert (
        entry.options[CONF_NODE_SETTINGS][PUMP["node_id"]]["display_name"]
        == "PARAM · Pump_North · xEnable"
    )
    await c.async_shutdown()
    c = coordinator(hass, entry, known=True)
    assert c.nodes[PUMP["node_id"]]["name"] == "PARAM · Pump_North · xEnable"

    await c.async_shutdown()


async def test_connection_form_offers_and_saves_the_switch(hass, entry):
    flow = AsyncUAOptionsFlow(entry)
    flow.hass = hass

    form = await flow.async_step_connection()
    keys = {str(key): key for key in form["data_schema"].schema}
    assert keys[CONF_NAME_WITH_PATH].default() is False

    saved = await flow.async_step_connection(
        {
            "url": "opc.tcp://localhost:4840",
            "hub_root": "ns=2;i=1",
            "scan_interval": 10,
            CONF_NAME_WITH_PATH: True,
        }
    )
    assert saved["data"][CONF_NAME_WITH_PATH] is True
    hass.config_entries.async_update_entry(entry, options=saved["data"])
    again = await flow.async_step_connection()
    keys = {str(key): key for key in again["data_schema"].schema}
    assert keys[CONF_NAME_WITH_PATH].default() is True


async def test_a_numeric_root_uses_the_paths_recorded_by_discovery(hass, entry):
    enable(hass, entry)
    hub = OpcuaHub("PLC", "opc.tcp://localhost:4840", "ns=4;i=5000")
    hub.get_values = AsyncMock(return_value={})
    numeric = [
        {**node("SP.xError", variant="Boolean"), "node_id": "ns=4;i=2001"},
        {**node("PARAM.Pump_North.xEnable"), "node_id": "ns=4;i=2002"},
        {**node("Speed"), "node_id": "ns=4;i=2003"},
        {**node("Manual.xFlag"), "node_id": "ns=4;i=2004"},
    ]
    hub.node_paths = {
        "ns=4;i=2001": ["SP", "xError"],
        "ns=4;i=2002": ["PARAM", "Pump_North", "xEnable"],
        "ns=4;i=2003": ["Speed"],
    }
    c = AsyncuaCoordinator(hass, "PLC", hub, config_entry=entry)
    c.known_node_ids = set()
    c._known_node_ids_initialized = True
    c.set_nodes(numeric)
    hass.data[DOMAIN] = {"PLC": c}

    assert c.nodes["ns=4;i=2001"]["name"] == "SP · xError"
    assert c.nodes["ns=4;i=2002"]["name"] == "PARAM · Pump_North · xEnable"
    # No group below the root, and no recorded path at all (e.g. a manually
    # added node) - both keep their plain name.
    assert c.nodes["ns=4;i=2003"]["name"] == "Speed"
    assert c.nodes["ns=4;i=2004"]["name"] == "xFlag"

    rows = {r["key"]: r for r in endpoint_snapshot(hass, entry)["rows"]}
    assert rows["ns=4;i=2001"]["path_group"] == "SP"
    assert rows["ns=4;i=2002"]["path_label"] == "PARAM › Pump_North"
    assert rows["ns=4;i=2003"]["path_group"] is None
    assert rows["ns=4;i=2004"]["path_group"] is None

    await c.async_shutdown()


async def test_panel_switch_saves_the_option_without_reloading_the_endpoint(
    hass, entry
):
    c = coordinator(hass, entry, known=True)
    assert endpoint_snapshot(hass, entry)["name_with_path"] is False

    result = await async_set_name_with_path(
        hass, {"entry_id": entry.entry_id, "enabled": True}
    )

    assert result == {"name_with_path": True}
    assert entry.options[CONF_NAME_WITH_PATH] is True
    assert endpoint_snapshot(hass, entry)["name_with_path"] is True
    # The coordinator already reflects the saved options, so the options
    # listener has nothing to reload for this change.
    assert c.reload_options[CONF_NAME_WITH_PATH] is True

    await async_set_name_with_path(hass, {"entry_id": entry.entry_id, "enabled": False})
    assert endpoint_snapshot(hass, entry)["name_with_path"] is False

    with pytest.raises(ValueError, match="endpoint_not_found"):
        await async_set_name_with_path(hass, {"entry_id": "missing", "enabled": True})

    await c.async_shutdown()
