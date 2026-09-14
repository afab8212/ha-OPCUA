"""Sensor platform for OPC UA."""

from homeassistant.components.sensor import SensorEntity, SensorStateClass
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from . import AsyncuaCoordinator, entity_unique_id
from .const import DOMAIN


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    coordinator: AsyncuaCoordinator = hass.data[DOMAIN][entry.data["hub_id"]]
    sensors = []

    for node_id, node in coordinator.nodes.items():
        # Skip nodes that are writable booleans (handled by switches)
        if node["writable_boolean"]:
            continue
        sensors.append(
            AsyncuaSensor(coordinator, node["name"], node_id, entry.entry_id)
        )

    async_add_entities(sensors)


class AsyncuaSensor(CoordinatorEntity[AsyncuaCoordinator], SensorEntity):
    """Representation of an OPC UA sensor."""

    def __init__(self, coordinator, name: str, node_id: str, entry_id: str) -> None:
        super().__init__(coordinator)
        self._attr_name = name
        self._attr_unique_id = entity_unique_id(entry_id, node_id)
        self._node_id = node_id
        self._attr_state_class = None

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
        return (self.coordinator.data or {}).get(self._node_id)

    @property
    def available(self) -> bool:
        """Return whether this node was read in the latest successful update."""
        return super().available and self._node_id in (self.coordinator.data or {})
