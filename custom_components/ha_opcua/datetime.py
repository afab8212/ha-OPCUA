"""Editable OPC UA DateTime nodes using Home Assistant's native date/time control."""

from datetime import datetime

from asyncua import ua
from homeassistant.components.datetime import DateTimeEntity
from homeassistant.exceptions import HomeAssistantError

from .const import DOMAIN
from .entity import OpcuaEntity, async_setup_node_entities
from .values import datetime_value, scalar_variant


async def async_setup_entry(hass, entry, async_add_entities):
    coordinator = hass.data[DOMAIN][entry.data["hub_id"]]
    async_setup_node_entities(
        coordinator, entry, async_add_entities, "datetime", AsyncuaDateTime
    )


class AsyncuaDateTime(OpcuaEntity, DateTimeEntity):
    """A writable timestamp; Home Assistant handles the user's local timezone."""

    @property
    def native_value(self):
        return datetime_value(self.node_value)

    async def async_set_value(self, value: datetime):
        try:
            if not isinstance(value, datetime):
                raise ValueError("Expected a datetime value")
            normalized = scalar_variant(value, ua.VariantType.DateTime).Value
        except ValueError as err:
            raise HomeAssistantError(str(err)) from err
        await self._async_write_value(normalized)
