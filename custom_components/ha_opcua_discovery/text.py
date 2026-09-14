"""Editable string OPC UA nodes."""

from homeassistant.components.text import TextEntity, TextMode
from homeassistant.exceptions import HomeAssistantError

from .const import DOMAIN
from .entity import OpcuaEntity


async def async_setup_entry(hass, entry, async_add_entities):
    coordinator = hass.data[DOMAIN][entry.data["hub_id"]]
    async_add_entities(
        [
            AsyncuaText(coordinator, node["name"], node_id, entry.entry_id)
            for node_id, node in coordinator.nodes_for_platform("text")
        ]
    )


class AsyncuaText(OpcuaEntity, TextEntity):
    """A String writer preserving whitespace and punctuation."""

    _attr_mode = TextMode.TEXT

    def __init__(self, coordinator, name, node_id, entry_id):
        super().__init__(coordinator, name, node_id, entry_id)
        self._attr_native_min = self._settings["min_length"]
        self._attr_native_max = self._settings["max_length"]

    @property
    def native_value(self):
        value = self.node_value
        # Entity states cannot contain more than 255 characters in Home Assistant.
        return value if isinstance(value, str) and len(value) <= 255 else None

    async def async_set_value(self, value):
        if (
            not isinstance(value, str)
            or not self.native_min <= len(value) <= self.native_max
        ):
            raise HomeAssistantError("Text length is outside the configured limits")
        await self._async_write_value(value)
