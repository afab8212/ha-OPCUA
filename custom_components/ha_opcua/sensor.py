"""Sensor platform for OPC UA."""

from homeassistant.components.sensor import (
    SensorDeviceClass,
    SensorEntity,
    SensorStateClass,
)

from .const import DOMAIN
from .entity import OpcuaEntity, async_setup_node_entities
from .node_settings import label_for_value
from .values import datetime_value


async def async_setup_entry(hass, entry, async_add_entities):
    coordinator = hass.data[DOMAIN][entry.data["hub_id"]]
    async_setup_node_entities(
        coordinator, entry, async_add_entities, "sensor", AsyncuaSensor
    )


class AsyncuaSensor(OpcuaEntity, SensorEntity):
    """Representation of an OPC UA sensor."""

    @property
    def _value_labels(self):
        return self._settings.get("value_labels")

    @property
    def device_class(self):
        if self._value_labels:
            return SensorDeviceClass.ENUM
        configured = self._settings.get("device_class")
        if configured is not None:
            return configured
        if self.coordinator.nodes[self._node_id]["variant_type"] == "DateTime":
            return SensorDeviceClass.TIMESTAMP
        return None

    @property
    def options(self):
        if self._value_labels:
            return [item["label"] for item in self._value_labels]
        return None

    @property
    def extra_state_attributes(self):
        attributes = super().extra_state_attributes
        if self._value_labels:
            attributes = {**attributes, "raw_value": self.node_value}
        return attributes

    @property
    def native_unit_of_measurement(self):
        return self._settings.get("unit_of_measurement")

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
        if self._value_labels:
            # A raw value missing from the table shows as unknown; the raw
            # value itself stays visible in the attributes.
            return label_for_value(self._settings, self.node_value)
        if self.device_class == SensorDeviceClass.TIMESTAMP:
            return datetime_value(self.node_value)
        return self.node_value
