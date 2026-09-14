"""Boolean OPC UA nodes selected as binary sensors."""

from homeassistant.components.binary_sensor import BinarySensorEntity

from .const import DOMAIN
from .entity import OpcuaEntity


async def async_setup_entry(hass, entry, async_add_entities):
    coordinator = hass.data[DOMAIN][entry.data["hub_id"]]
    async_add_entities(
        [
            AsyncuaBinarySensor(coordinator, node["name"], node_id, entry.entry_id)
            for node_id, node in coordinator.nodes_for_platform("binary_sensor")
        ]
    )


class AsyncuaBinarySensor(OpcuaEntity, BinarySensorEntity):
    """Represent the actual Boolean value without numeric or string coercion."""

    @property
    def is_on(self):
        value = self.node_value
        return value if isinstance(value, bool) else None
