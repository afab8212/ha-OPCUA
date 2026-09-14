"""Editable numeric OPC UA nodes."""

import math

from homeassistant.components.number import NumberEntity, NumberMode
from homeassistant.exceptions import HomeAssistantError

from .const import DOMAIN
from .entity import OpcuaEntity
from .node_settings import INTEGER_TYPES, MAX_SAFE_INTEGER


async def async_setup_entry(hass, entry, async_add_entities):
    coordinator = hass.data[DOMAIN][entry.data["hub_id"]]
    async_add_entities(
        [
            AsyncuaNumber(coordinator, node["name"], node_id, entry.entry_id)
            for node_id, node in coordinator.nodes_for_platform("number")
        ]
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
        if self._integer:
            if isinstance(value, float) and not value.is_integer():
                raise HomeAssistantError("This OPC UA node requires an integer")
            value = int(value)
        await self._async_write_value(value)
