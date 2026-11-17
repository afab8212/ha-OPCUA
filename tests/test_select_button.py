"""Select (value table), integer sensor texts and pulse buttons."""

import asyncio
from unittest.mock import AsyncMock, Mock

import pytest
from homeassistant.components.sensor import SensorDeviceClass
from homeassistant.exceptions import HomeAssistantError

from custom_components.ha_opcua import AsyncuaCoordinator
from custom_components.ha_opcua.button import AsyncuaButton
from custom_components.ha_opcua.node_settings import (
    allowed_platforms,
    validate_settings,
)
from custom_components.ha_opcua.pulse import PulseQueue, pulse
from custom_components.ha_opcua.select import AsyncuaSelect
from custom_components.ha_opcua.sensor import AsyncuaSensor

MODE = {
    "node_id": "ns=2;i=1",
    "name": "Mode",
    "variant_type": "Int16",
    "writable": True,
}
MODE_RO = {**MODE, "writable": False}
BIT = {
    "node_id": "ns=2;i=2",
    "name": "Start",
    "variant_type": "Boolean",
    "writable": True,
}
TABLE = [
    {"value": 0, "label": "Off"},
    {"value": 1, "label": "Auto"},
    {"value": 2, "label": "Manual"},
]


def test_platform_choices():
    assert "select" in allowed_platforms(MODE)
    assert "select" not in allowed_platforms(MODE_RO)
    assert "select" not in allowed_platforms({**MODE, "variant_type": "Float"})
    assert "button" in allowed_platforms(BIT)
    assert "button" not in allowed_platforms({**BIT, "writable": False})


def test_select_requires_valid_table():
    result = validate_settings(MODE, {"platform": "select", "value_labels": TABLE})
    assert result["value_labels"] == TABLE
    with pytest.raises(ValueError, match="value_labels_required"):
        validate_settings(MODE, {"platform": "select"})
    with pytest.raises(ValueError, match="value_labels_required"):
        validate_settings(MODE, {"platform": "select", "value_labels": []})
    with pytest.raises(ValueError, match="duplicate_value_labels"):
        validate_settings(
            MODE,
            {
                "platform": "select",
                "value_labels": [*TABLE, {"value": 0, "label": "X"}],
            },
        )
    with pytest.raises(ValueError, match="duplicate_value_labels"):
        validate_settings(
            MODE,
            {
                "platform": "select",
                "value_labels": [*TABLE, {"value": 5, "label": "Auto"}],
            },
        )
    with pytest.raises(ValueError, match="value_labels_outside_type"):
        validate_settings(
            MODE,
            {"platform": "select", "value_labels": [{"value": 40000, "label": "Big"}]},
        )
    for bad in (
        [{"value": 1.5, "label": "Half"}],
        [{"value": True, "label": "Bool"}],
        [{"value": 1, "label": "  "}],
        [{"value": 1, "label": "x" * 65}],
        [{"value": 1}],
        "0=Off",
    ):
        with pytest.raises(ValueError, match="invalid_value_labels"):
            validate_settings(MODE, {"platform": "select", "value_labels": bad})
    # Texts are trimmed.
    result = validate_settings(
        MODE, {"platform": "select", "value_labels": [{"value": 3, "label": " On "}]}
    )
    assert result["value_labels"] == [{"value": 3, "label": "On"}]


def test_table_conflicts_and_stale_tables():
    conversion = {"type": "multiplier", "factor": 2}
    with pytest.raises(ValueError, match="value_labels_conversion"):
        validate_settings(
            MODE,
            {"platform": "select", "value_labels": TABLE, "conversion": conversion},
        )
    with pytest.raises(ValueError, match="invalid_unit"):
        validate_settings(
            MODE_RO,
            {"platform": "sensor", "value_labels": TABLE, "unit_of_measurement": "°C"},
        )
    with pytest.raises(ValueError, match="invalid_device_class"):
        validate_settings(
            MODE_RO,
            {"platform": "sensor", "value_labels": TABLE, "device_class": "power"},
        )
    # A table left over after switching to number or disabled is dropped.
    result = validate_settings(
        MODE,
        {"platform": "number", "value_labels": TABLE, "min": 0, "max": 2, "step": 1},
    )
    assert "value_labels" not in result
    assert "value_labels" not in validate_settings(
        MODE, {"platform": "disabled", "value_labels": TABLE}
    )
    # Empty table on a sensor: plain number.
    assert "value_labels" not in validate_settings(
        MODE_RO, {"platform": "sensor", "value_labels": []}
    )


def test_button_pulse_settings():
    assert validate_settings(BIT, {"platform": "button"})["pulse_ms"] == 500
    assert (
        validate_settings(BIT, {"platform": "button", "pulse_ms": 1200})["pulse_ms"]
        == 1200
    )
    for bad in (49, 10001, 500.0, True, "500"):
        with pytest.raises(ValueError, match="invalid_pulse"):
            validate_settings(BIT, {"platform": "button", "pulse_ms": bad})


def coordinator(hass, settings):
    hub = Mock(
        get_values=AsyncMock(return_value={}),
        set_value=AsyncMock(),
        disconnect=AsyncMock(),
        ensure_subscription=AsyncMock(),
        disable_subscription=AsyncMock(),
    )
    result = AsyncuaCoordinator(hass, "PLC", hub)
    result.node_settings.update(settings)
    result.set_nodes([MODE, BIT])
    return result


@pytest.mark.asyncio
async def test_select_reads_and_writes_texts(hass, entry):
    c = coordinator(
        hass, {MODE["node_id"]: {"platform": "select", "value_labels": TABLE}}
    )
    c.async_set_updated_data({MODE["node_id"]: 1})
    entity = AsyncuaSelect(c, "Mode", MODE["node_id"], entry.entry_id)
    assert entity.options == ["Off", "Auto", "Manual"]
    assert entity.current_option == "Auto"
    c.async_set_updated_data({MODE["node_id"]: 7})
    assert entity.current_option is None
    assert entity.extra_state_attributes["raw_value"] == 7
    c.hub.get_values.return_value = {MODE["node_id"]: 2}
    await entity.async_select_option("Manual")
    c.hub.set_value.assert_awaited_once_with(MODE["node_id"], 2)
    with pytest.raises(HomeAssistantError):
        await entity.async_select_option("Unknown")


@pytest.mark.asyncio
async def test_integer_sensor_shows_texts(hass, entry):
    c = coordinator(
        hass, {MODE["node_id"]: {"platform": "sensor", "value_labels": TABLE}}
    )
    c.async_set_updated_data({MODE["node_id"]: 0})
    entity = AsyncuaSensor(c, "Mode", MODE["node_id"], entry.entry_id)
    assert entity.device_class == SensorDeviceClass.ENUM
    assert entity.options == ["Off", "Auto", "Manual"]
    assert entity.native_value == "Off"
    assert entity.state_class is None
    c.async_set_updated_data({MODE["node_id"]: 9})
    assert entity.native_value is None
    assert entity.extra_state_attributes["raw_value"] == 9


@pytest.mark.asyncio
async def test_button_pulses_and_resets(hass, entry):
    c = coordinator(hass, {BIT["node_id"]: {"platform": "button", "pulse_ms": 50}})
    c.async_set_updated_data({BIT["node_id"]: False})
    entity = AsyncuaButton(c, "Start", BIT["node_id"], entry.entry_id)
    assert entity.extra_state_attributes["pulse_ms"] == 50
    assert entity.extra_state_attributes["bit_state"] is False
    await entity.async_press()
    assert [call.args for call in c.hub.set_value.await_args_list] == [
        (BIT["node_id"], True),
        (BIT["node_id"], False),
    ]


@pytest.mark.asyncio
async def test_pulse_resets_after_set_failure_and_retries():
    writes = []
    sleep = AsyncMock()

    async def write(on):
        writes.append(on)
        if on:
            raise TimeoutError("set failed")

    with pytest.raises(TimeoutError):
        await pulse(write, 100, sleep=sleep)
    assert writes == [True, False]

    attempts = []

    async def flaky(on):
        attempts.append(on)
        if not on and attempts.count(False) < 3:
            raise ConnectionError("reset failed")

    await pulse(flaky, 100, sleep=sleep, retry_delay=0)
    assert attempts == [True, False, False, False]


@pytest.mark.asyncio
async def test_pulse_queue_keeps_one_waiting_press():
    release = asyncio.Event()
    writes = []

    async def write(on):
        writes.append(on)

    async def sleep(_seconds):
        await release.wait()

    queue = PulseQueue()
    first = asyncio.create_task(queue.press(write, 100, sleep=sleep))
    await asyncio.sleep(0)
    second = asyncio.create_task(queue.press(write, 100, sleep=sleep))
    await asyncio.sleep(0)
    third = await queue.press(write, 100, sleep=sleep)
    assert third is False
    release.set()
    assert await first is True and await second is True
    assert writes == [True, False, True, False]
