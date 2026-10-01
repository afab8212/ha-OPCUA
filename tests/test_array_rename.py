"""Explicit, opt-in disambiguation of existing PLC array-of-struct field names."""

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

PREFIX = "ns=2;s=|var|PLC.PlantRelay.astMeldungen"
FIELD_1 = {
    "name": "xAktiv",
    "node_id": f"{PREFIX}[1].xAktiv",
    "variant_type": "Boolean",
    "writable": False,
}
FIELD_2 = {
    "name": "xAktiv",
    "node_id": f"{PREFIX}[2].xAktiv",
    "variant_type": "Boolean",
    "writable": False,
}
PLAIN_NODE = {
    "name": "Speed",
    "node_id": "ns=2;i=4",
    "variant_type": "Int16",
    "writable": False,
}


async def prepare(hass, entry):
    hub = OpcuaHub("PLC", "opc.tcp://localhost:4840", FIELD_1["node_id"])
    hub.get_values = AsyncMock(
        return_value={
            FIELD_1["node_id"]: True,
            FIELD_2["node_id"]: False,
            PLAIN_NODE["node_id"]: 3,
        }
    )
    hub.set_value = AsyncMock()
    c = AsyncuaCoordinator(hass, "PLC", hub, config_entry=entry)
    # These fields were already known before array-aware naming existed -
    # the "never retroactive" guard in set_nodes() must leave them raw,
    # so the rename tool is what an existing installation actually needs.
    c.known_node_ids = {
        FIELD_1["node_id"],
        FIELD_2["node_id"],
        PLAIN_NODE["node_id"],
    }
    c._known_node_ids_initialized = True
    c.set_nodes([FIELD_1, FIELD_2, PLAIN_NODE])
    hass.data[DOMAIN] = {"PLC": c}
    registry = er.async_get(hass)
    entity_1 = registry.async_get_or_create(
        "sensor",
        DOMAIN,
        entity_unique_id(entry.entry_id, FIELD_1["node_id"]),
        config_entry=entry,
        original_name="xAktiv",
    )
    entity_2 = registry.async_get_or_create(
        "sensor",
        DOMAIN,
        entity_unique_id(entry.entry_id, FIELD_2["node_id"]),
        config_entry=entry,
        original_name="xAktiv",
    )
    return c, entity_1, entity_2


async def test_only_unrenamed_array_fields_are_candidates(hass, entry):
    c, entity_1, _ = await prepare(hass, entry)
    snapshot = endpoint_snapshot(hass, entry)

    assert snapshot["renamable_array_fields"] == 2
    by_key = {row["key"]: row for row in snapshot["rows"]}
    assert by_key[FIELD_1["node_id"]]["renamable"] is True
    assert by_key[FIELD_1["node_id"]]["array_group"] == f"{PREFIX}[1]"
    assert by_key[PLAIN_NODE["node_id"]]["renamable"] is False
    assert by_key[PLAIN_NODE["node_id"]]["array_group"] is None

    await c.async_shutdown()


async def test_rename_sets_custom_name_and_leaves_others_untouched(hass, entry):
    c, entity_1, entity_2 = await prepare(hass, entry)
    registry = er.async_get(hass)
    snapshot = endpoint_snapshot(hass, entry)

    # Even if the caller's selection includes every candidate key, only
    # the one actually selected here is renamed.
    result = await async_rename_array_fields(
        hass,
        {
            "entry_id": entry.entry_id,
            "revision": snapshot["revision"],
            "keys": [FIELD_1["node_id"]],
        },
    )

    assert result["renamed"] == [FIELD_1["node_id"]]
    assert registry.async_get(entity_1.entity_id).name == "astMeldungen 1 · xAktiv"
    # The unselected, equally-eligible field is untouched.
    assert registry.async_get(entity_2.entity_id).name is None

    await c.async_shutdown()


async def test_rename_persists_display_name_so_the_raw_duplicate_check_clears(
    hass, entry
):
    """A renamed field must not just look right in the registry.

    The unrelated legacy duplicate-name warning in _migrate_entity_ids()
    counts each node's raw, undisambiguated name - it has no idea the
    registry got a custom name. Only a persisted node_settings
    display_name changes that raw name at the next discovery, so the
    rename action must write both, not just the registry override.
    """
    c, entity_1, entity_2 = await prepare(hass, entry)
    snapshot = endpoint_snapshot(hass, entry)

    await async_rename_array_fields(
        hass,
        {
            "entry_id": entry.entry_id,
            "revision": snapshot["revision"],
            "keys": [FIELD_1["node_id"]],
        },
    )

    assert (
        entry.options[CONF_NODE_SETTINGS][FIELD_1["node_id"]]["display_name"]
        == "astMeldungen 1 · xAktiv"
    )
    # The unselected field's settings are untouched.
    assert FIELD_2["node_id"] not in entry.options.get(CONF_NODE_SETTINGS, {})

    await c.async_shutdown()


async def test_legacy_rename_without_display_name_is_reconciled_on_rediscovery(
    hass, entry
):
    """An installation that renamed this field before the persistence fix existed.

    Back then the rename action only updated the registry; node_settings
    never learned the name. A later rediscovery (e.g. after upgrading to
    this fix) must notice the registry already carries exactly the
    generated name and backfill display_name itself - otherwise the raw
    name _migrate_entity_ids counts stays undisambiguated and the
    duplicate-name warning keeps firing for an installation that already
    did everything right.
    """
    c, entity_1, entity_2 = await prepare(hass, entry)
    registry = er.async_get(hass)
    # Simulate the pre-fix rename: the registry already has the generated
    # name, but node_settings has nothing - exactly what the old action
    # left behind.
    registry.async_update_entity(entity_1.entity_id, name="astMeldungen 1 · xAktiv")
    assert FIELD_1["node_id"] not in entry.options.get(CONF_NODE_SETTINGS, {})

    # A rediscovery - e.g. the restart that applies the upgrade - must
    # pick this up on its own, with no further user action.
    c.entities_ready = True
    c.set_nodes([FIELD_1, FIELD_2, PLAIN_NODE])

    assert (
        entry.options[CONF_NODE_SETTINGS][FIELD_1["node_id"]]["display_name"]
        == "astMeldungen 1 · xAktiv"
    )
    # The unrelated legacy duplicate-name check reads coordinator.nodes'
    # raw "name" directly - confirm it is actually disambiguated now, not
    # just the persisted setting.
    c.hub.discovery_complete = True
    names = [node["name"] for node in c.nodes.values()]
    assert names.count("astMeldungen 1 · xAktiv") == 1
    # FIELD_2 was never renamed, so it still legitimately carries the raw
    # name - but now only once, so it no longer collides with anything.
    assert names.count("xAktiv") == 1
    # The never-renamed field is untouched - still raw and still eligible
    # for the manual rename action.
    assert FIELD_2["node_id"] not in entry.options.get(CONF_NODE_SETTINGS, {})

    await c.async_shutdown()


async def test_legacy_reconcile_actually_clears_the_duplicate_warning(
    hass, entry, caplog
):
    """The point of the backfill: _migrate_entity_ids must stop warning.

    Persisting display_name is only a means to an end - what the
    installation actually experiences is the duplicate-name warning in
    the log. Verify that end-to-end rather than just the setting it
    depends on.
    """
    c, entity_1, _ = await prepare(hass, entry)
    registry = er.async_get(hass)
    registry.async_update_entity(entity_1.entity_id, name="astMeldungen 1 · xAktiv")
    c.hub.discovery_complete = True

    caplog.clear()
    _migrate_entity_ids(hass, entry, c)
    assert "Duplicate OPC UA name 'xAktiv'" in caplog.text

    c.entities_ready = True
    c.set_nodes([FIELD_1, FIELD_2, PLAIN_NODE])

    caplog.clear()
    _migrate_entity_ids(hass, entry, c)
    assert "Duplicate OPC UA name" not in caplog.text

    await c.async_shutdown()


async def test_explicit_custom_name_is_never_overridden(hass, entry):
    c, entity_1, entity_2 = await prepare(hass, entry)
    registry = er.async_get(hass)
    registry.async_update_entity(entity_2.entity_id, name="Frontdoor sensor")
    snapshot = endpoint_snapshot(hass, entry)
    by_key = {row["key"]: row for row in snapshot["rows"]}
    assert by_key[FIELD_2["node_id"]]["renamable"] is False

    result = await async_rename_array_fields(
        hass,
        {
            "entry_id": entry.entry_id,
            "revision": snapshot["revision"],
            "keys": [FIELD_1["node_id"], FIELD_2["node_id"]],
        },
    )

    assert result["renamed"] == [FIELD_1["node_id"]]
    assert registry.async_get(entity_2.entity_id).name == "Frontdoor sensor"

    await c.async_shutdown()


async def test_stale_revision_is_rejected(hass, entry):
    c, entity_1, _ = await prepare(hass, entry)
    registry = er.async_get(hass)

    with pytest.raises(ValueError, match="stale_configuration"):
        await async_rename_array_fields(
            hass,
            {
                "entry_id": entry.entry_id,
                "revision": "not-the-real-revision",
                "keys": [FIELD_1["node_id"]],
            },
        )

    assert registry.async_get(entity_1.entity_id).name is None

    await c.async_shutdown()


async def test_no_candidates_returns_empty(hass, entry):
    c, _, _ = await prepare(hass, entry)
    snapshot = endpoint_snapshot(hass, entry)

    result = await async_rename_array_fields(
        hass, {"entry_id": entry.entry_id, "revision": snapshot["revision"], "keys": []}
    )

    assert result == {"renamed": []}

    await c.async_shutdown()
