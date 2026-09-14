"""Sensor platform for OPC UA."""

from homeassistant.components.sensor import SensorEntity, SensorStateClass

from .const import DOMAIN
from .entity import OpcuaEntity, async_setup_node_entities


async def async_setup_entry(hass, entry, async_add_entities):
    coordinator = hass.data[DOMAIN][entry.data["hub_id"]]
    async_setup_node_entities(
        coordinator, entry, async_add_entities, "sensor", AsyncuaSensor
    )


class AsyncuaSensor(OpcuaEntity, SensorEntity):
    """Representation of an OPC UA sensor."""

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
        return self.node_value
