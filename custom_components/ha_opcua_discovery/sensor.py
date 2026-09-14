"""Sensor platform for OPC UA."""

from homeassistant.components.sensor import SensorEntity, SensorStateClass
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import AsyncuaCoordinator
from .const import DOMAIN
from .entity import OpcuaEntity


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    coordinator: AsyncuaCoordinator = hass.data[DOMAIN][entry.data["hub_id"]]
    sensors = []

    for node_id, node in coordinator.nodes_for_platform("sensor"):
        sensors.append(
            AsyncuaSensor(coordinator, node["name"], node_id, entry.entry_id)
        )

    async_add_entities(sensors)


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
