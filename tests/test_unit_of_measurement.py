"""A per-node unit of measurement for analog sensor and number entities."""

from copy import deepcopy
from unittest.mock import AsyncMock, Mock

import pytest
from test_panel import NODES, prepare

from custom_components.ha_opcua import AsyncuaCoordinator
from custom_components.ha_opcua.const import CONF_NODE_SETTINGS
from custom_components.ha_opcua.node_settings import validate_settings
from custom_components.ha_opcua.number import AsyncuaNumber
from custom_components.ha_opcua.panel import (
    async_create_entity,
    async_save_entity,
    endpoint_snapshot,
)
from custom_components.ha_opcua.sensor import AsyncuaSensor

REAL = {
    "name": "Real",
    "node_id": "ns=2;i=4",
    "variant_type": "Float",
    "writable": True,
}
READONLY_REAL = {**REAL, "writable": False}


def test_unit_validation_and_clear():
    for unit in ("°C", "bar", "l/min", "A"):
        assert (
            validate_settings(REAL, {"unit_of_measurement": unit})[
                "unit_of_measurement"
            ]
            == unit
        )
    # Read-only defaults to "sensor" - a unit is just as meaningful there.
    assert (
        validate_settings(READONLY_REAL, {"unit_of_measurement": "bar"})[
            "unit_of_measurement"
        ]
        == "bar"
    )
    assert (
        validate_settings(REAL, {"unit_of_measurement": " bar "})["unit_of_measurement"]
        == "bar"
    )
    assert "unit_of_measurement" not in validate_settings(
        REAL, {"unit_of_measurement": None}
    )
    for unit in ("", "   ", "x" * 51, 5, True):
        with pytest.raises(ValueError, match="invalid_unit"):
            validate_settings(REAL, {"unit_of_measurement": unit})
    # Non-analog types (a writable Boolean defaults to "switch") never qualify.
    for kind in ("Boolean", "String", "DateTime"):
        with pytest.raises(ValueError, match="invalid_unit"):
            validate_settings(
                {**REAL, "variant_type": kind}, {"unit_of_measurement": "bar"}
            )
    # An explicitly excluded numeric node still cannot carry a unit.
    with pytest.raises(ValueError, match="invalid_unit"):
        validate_settings(REAL, {"platform": "disabled", "unit_of_measurement": "bar"})


@pytest.mark.asyncio
async def test_sensor_and_number_expose_the_configured_unit(hass, entry):
    hub = Mock(set_value=AsyncMock())
    c = AsyncuaCoordinator(hass, "PLC", hub, config_entry=entry)
    c.node_settings = {
        REAL["node_id"]: {"platform": "number", "unit_of_measurement": "bar"}
    }
    c.set_nodes([REAL])
    sensor = AsyncuaSensor(c, "Real", REAL["node_id"], entry.entry_id)
    number = AsyncuaNumber(c, "Real", REAL["node_id"], entry.entry_id)
    assert sensor.native_unit_of_measurement == "bar"
    assert number.native_unit_of_measurement == "bar"
    sensor._settings.pop("unit_of_measurement")
    assert sensor.native_unit_of_measurement is None
    await c.async_shutdown()


@pytest.mark.asyncio
async def test_panel_unit_persists_reloads_clears_and_rejects(hass, entry):
    c, _, msg = await prepare(hass, entry)
    c.set_nodes([*NODES, REAL])
    msg.update(
        key=REAL["node_id"],
        node_id=REAL["node_id"],
        platform="sensor",
        invert_state=False,
    )
    msg["revision"] = endpoint_snapshot(hass, entry)["revision"]
    before = deepcopy(dict(entry.options))
    with pytest.raises(ValueError, match="invalid_unit"):
        await async_save_entity(
            hass, {**msg, "unit_of_measurement": "x" * 51, "name": "Invalid"}
        )
    assert dict(entry.options) == before

    saved = await async_save_entity(hass, {**msg, "unit_of_measurement": " bar "})
    entity_id = saved["entity_id"]
    snapshot = endpoint_snapshot(hass, entry)
    row = next(row for row in snapshot["rows"] if row["key"] == REAL["node_id"])
    assert row["settings"]["unit_of_measurement"] == "bar"

    reloaded = AsyncuaCoordinator(hass, "PLC", c.hub, config_entry=entry)
    reloaded.set_nodes([*NODES, REAL])
    assert reloaded.node_settings[REAL["node_id"]]["unit_of_measurement"] == "bar"
    await reloaded.async_shutdown()

    # An older client omitting the optional field preserves it.
    msg.update(platform="sensor", revision=endpoint_snapshot(hass, entry)["revision"])
    await async_save_entity(hass, msg)
    assert (
        entry.options[CONF_NODE_SETTINGS][REAL["node_id"]]["unit_of_measurement"]
        == "bar"
    )

    # Moving to a platform that cannot show a unit while still supplying one
    # is rejected outright - a stale field the panel should never send.
    msg.update(platform="disabled", revision=endpoint_snapshot(hass, entry)["revision"])
    with pytest.raises(ValueError, match="invalid_unit"):
        await async_save_entity(hass, {**msg, "unit_of_measurement": "bar"})

    # Explicitly clearing it (the panel sends null when the field is hidden).
    msg.update(platform="sensor", revision=endpoint_snapshot(hass, entry)["revision"])
    assert (await async_save_entity(hass, {**msg, "unit_of_measurement": None}))[
        "entity_id"
    ] == entity_id
    assert (
        "unit_of_measurement" not in entry.options[CONF_NODE_SETTINGS][REAL["node_id"]]
    )
    await c.async_shutdown()


@pytest.mark.asyncio
async def test_manual_real_creation_preserves_unit(hass, entry):
    c, _, msg = await prepare(hass, entry)
    c.hub.inspect_node = AsyncMock(return_value=REAL)
    msg.update(
        node_id=REAL["node_id"],
        platform="sensor",
        invert_state=False,
        unit_of_measurement="bar",
    )
    await async_create_entity(hass, msg)
    assert (
        entry.options[CONF_NODE_SETTINGS][REAL["node_id"]]["unit_of_measurement"]
        == "bar"
    )
    c.hub.set_value.assert_not_awaited()
    await c.async_shutdown()
