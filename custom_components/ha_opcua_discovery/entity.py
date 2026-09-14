"""Common identity, availability and write/read-back behavior."""

from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from . import AsyncuaCoordinator, entity_unique_id


class OpcuaEntity(CoordinatorEntity[AsyncuaCoordinator]):
    """An entity for one selected OPC UA node."""

    def __init__(self, coordinator, name, node_id, entry_id):
        super().__init__(coordinator)
        self._attr_name = name
        self._attr_unique_id = entity_unique_id(entry_id, node_id)
        self._node_id = node_id
        self._settings = coordinator.node_settings.get(node_id, {})
        node = coordinator.nodes[node_id]
        self._attr_extra_state_attributes = {
            "node_id": node_id,
            "opcua_type": node["variant_type"],
            "writable": node["writable"],
        }

    @property
    def available(self):
        return super().available and self._node_id in (self.coordinator.data or {})

    @property
    def node_value(self):
        return (self.coordinator.data or {}).get(self._node_id)

    async def _async_write_value(self, value):
        try:
            await self.coordinator.hub.set_value(self._node_id, value)
        except Exception as err:
            raise HomeAssistantError(f"OPC UA write failed: {err}") from err
        await self.coordinator.async_request_refresh()
