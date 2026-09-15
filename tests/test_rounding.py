"""Per-node REAL rounding affects HA state, without altering raw reads or writes."""

from copy import deepcopy
from unittest.mock import AsyncMock, Mock

import pytest
from test_panel import NODES, prepare

from custom_components.ha_opcua import AsyncuaCoordinator
from custom_components.ha_opcua.config_flow import AsyncUAOptionsFlow
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


def test_precision_validation_and_clear():
    for precision in (0, 2, 10):
        assert (
            validate_settings(REAL, {"precision": precision})["precision"] == precision
        )
    assert "precision" not in validate_settings(REAL, {"precision": None})
    for precision in (-1, 11, 1.5, True, "2", float("nan")):
        with pytest.raises(ValueError, match="invalid_precision"):
            validate_settings(REAL, {"precision": precision})
    for kind in ("Int16", "Boolean", "String", "DateTime"):
        with pytest.raises(ValueError, match="invalid_precision"):
            validate_settings({**REAL, "variant_type": kind}, {"precision": 2})


@pytest.mark.asyncio
async def test_sensor_and_number_round_reads_without_changing_raw_data_or_writes(
    hass, entry
):
    for kind in ("Float", "Double"):
        hub = Mock(set_value=AsyncMock())
        c = AsyncuaCoordinator(hass, "PLC", hub, config_entry=entry)
        c.node_settings = {REAL["node_id"]: {"platform": "number", "precision": 2}}
        c.set_nodes([{**REAL, "variant_type": kind}])
        c.async_request_refresh = AsyncMock()
        sensor = AsyncuaSensor(c, "Real", REAL["node_id"], entry.entry_id)
        number = AsyncuaNumber(c, "Real", REAL["node_id"], entry.entry_id)
        for raw, expected in (
            (12.345678, 12.35),
            (-12.345678, -12.35),
            (-0.00001, 0.0),
        ):
            c.data = {REAL["node_id"]: raw}
            assert sensor.native_value == number.native_value == expected
            assert c.data[REAL["node_id"]] == raw
        await number.async_set_native_value(12.345678)
        hub.set_value.assert_awaited_once_with(REAL["node_id"], 12.345678)
        c.data = {REAL["node_id"]: 12.345678}
        sensor._settings["precision"] = 0
        assert sensor.native_value == 12
        sensor._settings.pop("precision")
        assert sensor.native_value == number.native_value == 12.345678
        c.data = {}
        assert sensor.native_value is None and number.native_value is None
        await c.async_shutdown()


@pytest.mark.asyncio
async def test_panel_precision_persists_reloads_clears_and_rejects_atomically(
    hass, entry
):
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
    with pytest.raises(ValueError, match="invalid_precision"):
        await async_save_entity(hass, {**msg, "precision": True, "name": "Invalid"})
    assert dict(entry.options) == before
    saved = await async_save_entity(hass, {**msg, "precision": 2})
    entity_id = saved["entity_id"]
    snapshot = endpoint_snapshot(hass, entry)
    row = next(row for row in snapshot["rows"] if row["key"] == REAL["node_id"])
    assert row["settings"]["precision"] == 2
    reloaded = AsyncuaCoordinator(hass, "PLC", c.hub, config_entry=entry)
    reloaded.set_nodes([*NODES, REAL])
    assert reloaded.node_settings[REAL["node_id"]]["precision"] == 2
    await reloaded.async_shutdown()
    # An older client omitting the optional field preserves it, including exclusion.
    for platform in ("disabled", "sensor"):
        msg.update(
            platform=platform, revision=endpoint_snapshot(hass, entry)["revision"]
        )
        await async_save_entity(hass, msg)
        assert entry.options[CONF_NODE_SETTINGS][REAL["node_id"]]["precision"] == 2
    msg["revision"] = endpoint_snapshot(hass, entry)["revision"]
    assert (await async_save_entity(hass, {**msg, "precision": None}))[
        "entity_id"
    ] == entity_id
    assert "precision" not in entry.options[CONF_NODE_SETTINGS][REAL["node_id"]]
    # Reassignment to an integer clears an explicitly reset precision.
    msg.update(node_id="ns=2;i=3", revision=endpoint_snapshot(hass, entry)["revision"])
    await async_save_entity(hass, {**msg, "precision": None})
    c.hub.set_value.assert_not_awaited()
    await c.async_shutdown()


@pytest.mark.asyncio
async def test_manual_real_creation_and_legacy_options_preserve_precision(hass, entry):
    c, _, msg = await prepare(hass, entry)
    c.hub.inspect_node = AsyncMock(return_value=REAL)
    msg.update(
        node_id=REAL["node_id"], platform="number", invert_state=False, precision=3
    )
    await async_create_entity(hass, msg)
    assert entry.options[CONF_NODE_SETTINGS][REAL["node_id"]]["precision"] == 3
    c.hub.set_value.assert_not_awaited()
    flow = AsyncUAOptionsFlow(entry)
    flow.hass = hass
    flow._node_id = REAL["node_id"]
    flow._node = REAL
    saved = await flow.async_step_number({"min": 0, "max": 50, "step": 0.1})
    assert saved["data"][CONF_NODE_SETTINGS][REAL["node_id"]]["precision"] == 3
    await c.async_shutdown()
