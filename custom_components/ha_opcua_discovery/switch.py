"""Switch platform for OPC UA."""

from homeassistant.components.switch import SwitchEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from . import AsyncuaCoordinator, entity_unique_id
from .const import DOMAIN


async def async_setup_entry(
    hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback
) -> None:
    coordinator: AsyncuaCoordinator = hass.data[DOMAIN][entry.data["hub_id"]]
    switches = []

    for node_id, node in coordinator.nodes.items():
        # Skip nodes that are non-writable booleans
        if not node["writable_boolean"]:
            continue
        switches.append(
            AsyncuaSwitch(coordinator, node["name"], node_id, entry.entry_id)
        )

    async_add_entities(switches)


class AsyncuaSwitch(CoordinatorEntity[AsyncuaCoordinator], SwitchEntity):
    """Representation of an OPC UA writable boolean switch."""

    def __init__(self, coordinator, name: str, node_id: str, entry_id: str) -> None:
        super().__init__(coordinator)
        self._attr_name = name
        self._attr_unique_id = entity_unique_id(entry_id, node_id)
        self._node_id = node_id

    @property
    def is_on(self) -> bool | None:
        """Return true if switch is on."""
        value = (self.coordinator.data or {}).get(self._node_id)
        return value if isinstance(value, bool) else None

    async def async_turn_on(self, **kwargs) -> None:
        """Turn the switch on."""
        await self._async_write_value(True)

    async def async_turn_off(self, **kwargs) -> None:
        """Turn the switch off."""
        await self._async_write_value(False)

    async def _async_write_value(self, value: bool) -> None:
        try:
            await self.coordinator.hub.set_value(self._node_id, value)
        except Exception as err:
            raise HomeAssistantError(f"OPC UA switch write failed: {err}") from err
        await self.coordinator.async_request_refresh()

    @property
    def available(self) -> bool:
        """Return if the switch is available."""
        return super().available and self._node_id in (self.coordinator.data or {})
