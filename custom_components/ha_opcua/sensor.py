"""Sensor platform for OPC UA."""

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
)

from .const import DOMAIN
from .entity import OpcuaEntity, async_setup_node_entities
from .values import datetime_value


async def async_setup_entry(hass, entry, async_add_entities):
    coordinator = hass.data[DOMAIN][entry.data["hub_id"]]
    async_setup_node_entities(
        coordinator, entry, async_add_entities, "sensor", AsyncuaSensor
    )


class AsyncuaSensor(OpcuaEntity, SensorEntity):
    """Representation of an OPC UA sensor."""

    @property
    def device_class(self):
        if self.coordinator.nodes[self._node_id]["variant_type"] == "DateTime":
            return SensorDeviceClass.TIMESTAMP
        return None

    @property
    def state_class(self):
        """Return the state class based on the type of native_value."""
        value = self.native_value
        if isinstance(value, (int, float)) and not isinstance(value, bool):
            return SensorStateClass.MEASUREMENT
        # You can add more conditions if needed for other state classes
        return None

    @property
    def native_value(self):
        if self.device_class == SensorDeviceClass.TIMESTAMP:
            return datetime_value(self.node_value)
        return self.node_value
