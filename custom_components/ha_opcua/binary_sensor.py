"""Boolean OPC UA nodes selected as binary sensors."""

from homeassistant.components.binary_sensor import (
    BinarySensorDeviceClass,
    BinarySensorEntity,
)
from homeassistant.const import EntityCategory

from .connection import OpcuaConnectionEntity, connection_attributes
from .const import DOMAIN
from .entity import OpcuaEntity, async_setup_node_entities


async def async_setup_entry(hass, entry, async_add_entities):
    coordinator = hass.data[DOMAIN][entry.data["hub_id"]]
    async_add_entities([OpcuaConnectionSensor(coordinator, entry)])
    async_setup_node_entities(
        coordinator, entry, async_add_entities, "binary_sensor", AsyncuaBinarySensor
    )


class AsyncuaBinarySensor(OpcuaEntity, BinarySensorEntity):
    """Represent the actual Boolean value without numeric or string coercion."""

    @property
    def device_class(self):
        return self._settings.get("device_class")

    @property
    def is_on(self):
        value = self.node_value
        return value if isinstance(value, bool) else None


class OpcuaConnectionSensor(OpcuaConnectionEntity, BinarySensorEntity):
    """Report actual session connectivity, even when node polling fails."""

    _attr_translation_key = "connection_status"
    _attr_device_class = BinarySensorDeviceClass.CONNECTIVITY
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(self, coordinator, entry):
        super().__init__(coordinator, entry, "connection_status")

    @property
    def is_on(self):
        return self.coordinator.enabled and self.coordinator.hub.is_connected

    @property
    def extra_state_attributes(self):
        return connection_attributes(self.coordinator)
