"""Switch platform for OPC UA."""

from homeassistant.components.switch import SwitchEntity
from homeassistant.const import EntityCategory

from .connection import OpcuaConnectionEntity
from .const import DOMAIN
from .entity import OpcuaEntity, async_setup_node_entities


async def async_setup_entry(hass, entry, async_add_entities):
    coordinator = hass.data[DOMAIN][entry.data["hub_id"]]
    async_add_entities(
        [
            OpcuaConnectionSwitch(coordinator, entry),
            OpcuaSubscriptionSwitch(coordinator, entry),
        ]
    )
    async_setup_node_entities(
        coordinator, entry, async_add_entities, "switch", AsyncuaSwitch
    )


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


class OpcuaConnectionSwitch(OpcuaConnectionEntity, SwitchEntity):
    """Enable communication independently of whether the PLC is reachable."""

    _attr_translation_key = "connection_enabled"
    _attr_entity_category = EntityCategory.CONFIG
    _attr_icon = "mdi:lan-connect"

    def __init__(self, coordinator, entry):
        super().__init__(coordinator, entry, "connection_enabled")

    @property
    def is_on(self):
        return self.coordinator.enabled

    async def async_turn_on(self, **kwargs):
        await self.coordinator.async_set_connection_enabled(True)

    async def async_turn_off(self, **kwargs):
        await self.coordinator.async_set_connection_enabled(False)


class OpcuaSubscriptionSwitch(OpcuaConnectionEntity, SwitchEntity):
    """Toggle the native OPC UA push subscription; polling runs either way."""

    _attr_translation_key = "subscription_enabled"
    _attr_entity_category = EntityCategory.CONFIG
    _attr_icon = "mdi:transit-connection-variant"

    def __init__(self, coordinator, entry):
        super().__init__(coordinator, entry, "subscription_enabled")

    @property
    def is_on(self):
        return self.coordinator.subscription_enabled

    async def async_turn_on(self, **kwargs):
        await self.coordinator.async_set_subscription_enabled(True)

    async def async_turn_off(self, **kwargs):
        await self.coordinator.async_set_subscription_enabled(False)
