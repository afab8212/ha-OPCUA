"""Switch platform for OPC UA."""

from homeassistant.components.switch import SwitchEntity
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
    switches = []

    for node_id, node in coordinator.nodes_for_platform("switch"):
        switches.append(
            AsyncuaSwitch(coordinator, node["name"], node_id, entry.entry_id)
        )

    async_add_entities(switches)


class AsyncuaSwitch(OpcuaEntity, SwitchEntity):
    """Representation of an OPC UA writable boolean switch."""

    @property
    def is_on(self) -> bool | None:
        """Return true if switch is on."""
        value = self.node_value
        return value if isinstance(value, bool) else None

    async def async_turn_on(self, **kwargs) -> None:
        """Turn the switch on."""
        await self._async_write_value(True)

    async def async_turn_off(self, **kwargs) -> None:
        """Turn the switch off."""
        await self._async_write_value(False)
