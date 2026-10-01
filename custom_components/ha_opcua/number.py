"""Editable numeric OPC UA nodes."""

import math

from asyncua import ua
from homeassistant.components.number import NumberEntity, NumberMode
from homeassistant.exceptions import HomeAssistantError

from .const import DOMAIN
from .conversion import convert
from .entity import OpcuaEntity, async_setup_node_entities
from .node_settings import INTEGER_TYPES, MAX_SAFE_INTEGER
from .values import scalar_variant


async def async_setup_entry(hass, entry, async_add_entities):
    coordinator = hass.data[DOMAIN][entry.data["hub_id"]]
    async_setup_node_entities(
        coordinator, entry, async_add_entities, "number", AsyncuaNumber
    )


class AsyncuaNumber(OpcuaEntity, NumberEntity):
    """A typed numeric writer with user-configured bounds."""

    _attr_mode = NumberMode.BOX

    def __init__(self, coordinator, name, node_id, entry_id):
        super().__init__(coordinator, name, node_id, entry_id)
        self._integer = coordinator.nodes[node_id]["variant_type"] in INTEGER_TYPES
        self._attr_native_min_value = self._settings["min"]
        self._attr_native_max_value = self._settings["max"]
        self._attr_native_step = self._settings["step"]

    @property
    def native_unit_of_measurement(self):
        return self._settings.get("unit_of_measurement")

    @property
    def native_value(self):
        value = self.node_value
        if (
            isinstance(value, bool)
            or not isinstance(value, (int, float))
            or not math.isfinite(value)
        ):
            return None
        # HA's numeric UI uses JavaScript numbers. Do not display a rounded 64-bit value.
        if self._integer and abs(value) > MAX_SAFE_INTEGER:
            return None
        return value

    async def async_set_native_value(self, value):
        if (
            isinstance(value, bool)
            or not isinstance(value, (int, float))
            or not math.isfinite(value)
        ):
            raise HomeAssistantError("A finite numeric value is required")
        if not self.native_min_value <= value <= self.native_max_value:
            raise HomeAssistantError("Value is outside the configured limits")
        try:
            value = convert(
                value,
                self._settings.get("conversion"),
                inverse=True,
                integer=self._integer,
            )
        except ValueError as err:
            raise HomeAssistantError("Invalid converted value") from err
        if self._integer:
            if isinstance(value, float) and not value.is_integer():
                raise HomeAssistantError("This OPC UA node requires an integer")
            value = int(value)
        try:
            if self._integer and abs(value) > MAX_SAFE_INTEGER:
                raise ValueError("Integer exceeds safe precision")
            scalar_variant(value, ua.VariantType[self._variant_type])
        except ValueError as err:
            raise HomeAssistantError(str(err)) from err
        await self._async_write_value(value)
