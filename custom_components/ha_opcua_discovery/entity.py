"""Common identity, availability and write/read-back behavior."""

import math

from homeassistant.core import callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from . import AsyncuaCoordinator, entity_unique_id
from .device import device_info


class OpcuaEntity(CoordinatorEntity[AsyncuaCoordinator]):
    """An entity for one selected OPC UA node."""

    def __init__(self, coordinator, name, node_id, entry_id):
        super().__init__(coordinator)
        self._attr_name = name
        self._attr_unique_id = entity_unique_id(entry_id, node_id)
        self._attr_device_info = device_info(
            entry_id,
            (
                coordinator.config_entry.title
                if coordinator.config_entry
                else coordinator.name
            ),
        )
        self._node_id = node_id
        self._settings = coordinator.node_settings.get(node_id, {})
        node = coordinator.nodes[node_id]
        self._target_node_id = node.get("target_node_id", node_id)
        self._attr_extra_state_attributes = {
            "node_id": self._target_node_id,
            "opcua_type": node["variant_type"],
            "writable": node["writable"],
        }

    @property
    def available(self):
        return (
            super().available
            and self.coordinator.enabled
            and self.coordinator.hub.is_connected
            and self._node_id in (self.coordinator.data or {})
        )

    @property
    def node_value(self):
        value = (self.coordinator.data or {}).get(self._node_id)
        if isinstance(value, bool) and self._settings.get("invert_state", False):
            return not value
        precision = self._settings.get("precision")
        if (
            precision is not None
            and self.coordinator.nodes[self._node_id]["variant_type"]
            in {"Float", "Double"}
            and isinstance(value, (int, float))
            and not isinstance(value, bool)
            and math.isfinite(value)
        ):
            value = round(value, precision)
            # Avoid displaying negative zero for small negative values.
            if value == 0:
                return 0.0
        return value

    async def _async_write_value(self, value):
        if self.coordinator._platforms.get(self._node_id) == "disabled":
            raise HomeAssistantError("This OPC UA entity is disabled or removed")
        try:
            if isinstance(value, bool) and self._settings.get("invert_state", False):
                value = not value
            await self.coordinator.hub.set_value(self._target_node_id, value)
        except Exception as err:
            raise HomeAssistantError(f"OPC UA write failed: {err}") from err
        await self.coordinator.async_request_refresh()


def async_setup_node_entities(
    coordinator, entry, async_add_entities, platform, entity_class
):
    """Add discovered nodes at setup or after an offline startup recovers."""
    added = set()

    @callback
    def add_discovered():
        if coordinator._discovery_pending:
            return
        entities = []
        for node_id, node in coordinator.nodes_for_platform(platform):
            if node_id not in added:
                added.add(node_id)
                entities.append(
                    entity_class(coordinator, node["name"], node_id, entry.entry_id)
                )
        if entities:
            async_add_entities(entities)

    entry.async_on_unload(coordinator.async_add_listener(add_discovered))
    add_discovered()
