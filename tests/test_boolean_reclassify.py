"""Explicit, opt-in reclassification of existing read-only Boolean sensors."""

from unittest.mock import AsyncMock

import pytest
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import entity_registry as er

from custom_components.ha_opcua import AsyncuaCoordinator, OpcuaHub, entity_unique_id
from custom_components.ha_opcua.const import CONF_NODE_SETTINGS, DOMAIN
from custom_components.ha_opcua.orphans import is_orphan
from custom_components.ha_opcua.panel import (
    async_reclassify_boolean_sensors,
    endpoint_snapshot,
)

pytestmark = pytest.mark.asyncio

AUTO_BOOLEAN = {
    "name": "Alarm",
    "node_id": "ns=2;i=1",
    "variant_type": "Boolean",
    "writable": False,
}
EXPLICIT_SENSOR_BOOLEAN = {
    "name": "AlreadyChosen",
    "node_id": "ns=2;i=2",
    "variant_type": "Boolean",
    "writable": False,
}
WRITABLE_BOOLEAN = {
    "name": "Run",
    "node_id": "ns=2;i=3",
    "variant_type": "Boolean",
    "writable": True,
}
NON_BOOLEAN = {
    "name": "Speed",
    "node_id": "ns=2;i=4",
    "variant_type": "Int16",
    "writable": False,
}


async def prepare(hass, entry):
    hub = OpcuaHub("PLC", "opc.tcp://localhost:4840", "ns=2;i=1")
    hub.get_values = AsyncMock(
        return_value={
            "ns=2;i=1": True,
            "ns=2;i=2": False,
            "ns=2;i=3": True,
            "ns=2;i=4": 3,
        }
    )
    hub.set_value = AsyncMock()
    c = AsyncuaCoordinator(hass, "PLC", hub, config_entry=entry)
    hass.config_entries.async_update_entry(
        entry,
        options={
            CONF_NODE_SETTINGS: {"ns=2;i=2": {"platform": "sensor"}},
        },
    )
    c.set_nodes([AUTO_BOOLEAN, EXPLICIT_SENSOR_BOOLEAN, WRITABLE_BOOLEAN, NON_BOOLEAN])
    hass.data[DOMAIN] = {"PLC": c}
    registry = er.async_get(hass)
    old_sensor = registry.async_get_or_create(
        "sensor",
        DOMAIN,
        entity_unique_id(entry.entry_id, "ns=2;i=1"),
        config_entry=entry,
        original_name="Alarm",
    )
    return c, old_sensor


async def test_only_auto_readonly_boolean_nodes_are_reclassified(hass, entry):
    c, old_sensor = await prepare(hass, entry)
    snapshot = endpoint_snapshot(hass, entry)
    assert snapshot["reclassifiable_booleans"] == 1

    result = await async_reclassify_boolean_sensors(
        hass, {"entry_id": entry.entry_id, "revision": snapshot["revision"]}
    )

    assert result["reclassified"] == ["ns=2;i=1"]
    assert c.node_settings["ns=2;i=1"]["platform"] == "binary_sensor"
    assert c._platforms["ns=2;i=1"] == "binary_sensor"
    assert entry.options[CONF_NODE_SETTINGS]["ns=2;i=1"]["platform"] == "binary_sensor"

    # An explicit past choice - even "sensor" itself - is never overridden.
    assert entry.options[CONF_NODE_SETTINGS]["ns=2;i=2"]["platform"] == "sensor"
    # A writable Boolean already resolves to "switch" via effective_platform
    # and was never touched - it has no saved settings at all.
    assert "ns=2;i=3" not in entry.options.get(CONF_NODE_SETTINGS, {})
    # Non-Boolean types are never touched by this action.
    assert "ns=2;i=4" not in entry.options.get(CONF_NODE_SETTINGS, {})

    # The old sensor entity's domain no longer matches the saved platform -
    # it is now a category-change orphan, ready for "Delete all missing".
    assert is_orphan(hass, entry, old_sensor)

    await c.async_shutdown()


async def test_reclassify_preserves_custom_name_and_area_and_disables_old_entity(
    hass, entry
):
    """Mirrors a manual category change: rename/area travel, old entity is disabled.

    A targeted test by the maintainer found the bulk reclassification only
    updated in-memory options/coordinator state, leaving the new
    binary_sensor with the raw node name and no area, and the old sensor
    enabled - unlike a manual category change through the panel, which
    preserves both and disables the replaced entity.
    """
    await ar.async_load(hass)
    area = ar.async_get(hass).async_create("Utility Room")
    c, old_sensor = await prepare(hass, entry)
    registry = er.async_get(hass)
    registry.async_update_entity(
        old_sensor.entity_id, name="Front Door Alarm", area_id=area.id
    )

    snapshot = endpoint_snapshot(hass, entry)
    await async_reclassify_boolean_sensors(
        hass, {"entry_id": entry.entry_id, "revision": snapshot["revision"]}
    )

    new_entity_id = registry.async_get_entity_id(
        "binary_sensor", DOMAIN, entity_unique_id(entry.entry_id, "ns=2;i=1")
    )
    new_entity = registry.async_get(new_entity_id)
    assert new_entity.name == "Front Door Alarm"
    assert new_entity.area_id == area.id

    old_entity = registry.async_get(old_sensor.entity_id)
    assert old_entity.disabled_by == er.RegistryEntryDisabler.INTEGRATION

    await c.async_shutdown()


async def test_stale_revision_is_rejected(hass, entry):
    c, _ = await prepare(hass, entry)

    with pytest.raises(ValueError, match="stale_configuration"):
        await async_reclassify_boolean_sensors(
            hass, {"entry_id": entry.entry_id, "revision": "not-the-real-revision"}
        )

    assert "ns=2;i=1" not in entry.options.get(CONF_NODE_SETTINGS, {})

    await c.async_shutdown()


async def test_no_candidates_leaves_options_untouched(hass, entry):
    c, _ = await prepare(hass, entry)
    snapshot = endpoint_snapshot(hass, entry)
    await async_reclassify_boolean_sensors(
        hass, {"entry_id": entry.entry_id, "revision": snapshot["revision"]}
    )
    options_after_first_run = dict(entry.options)

    # Running it again finds nothing left on Auto to reclassify.
    snapshot = endpoint_snapshot(hass, entry)
    assert snapshot["reclassifiable_booleans"] == 0
    result = await async_reclassify_boolean_sensors(
        hass, {"entry_id": entry.entry_id, "revision": snapshot["revision"]}
    )

    assert result == {"reclassified": []}
    assert dict(entry.options) == options_after_first_run

    await c.async_shutdown()
