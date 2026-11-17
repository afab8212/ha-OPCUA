"""Push buttons on writable Boolean OPC UA nodes.

A press sets the bit, waits pulse_ms and resets it (pulse.py), for PLC logic
that reacts to the edge. Presses of the same button do not overlap: while a
pulse runs, at most one more press waits (pulse.PulseQueue).
"""

from homeassistant.components.button import ButtonEntity

from .const import DOMAIN
from .entity import OpcuaEntity, async_setup_node_entities
from .node_settings import PULSE_DEFAULT_MS
from .pulse import PulseQueue


async def async_setup_entry(hass, entry, async_add_entities):
    coordinator = hass.data[DOMAIN][entry.data["hub_id"]]
    async_setup_node_entities(
        coordinator, entry, async_add_entities, "button", AsyncuaButton
    )


class AsyncuaButton(OpcuaEntity, ButtonEntity):
    """Pulse a Boolean node."""

    _attr_icon = "mdi:gesture-tap-button"

    def __init__(self, coordinator, name, node_id, entry_id):
        super().__init__(coordinator, name, node_id, entry_id)
        self._queue = PulseQueue()

    @property
    def _pulse_ms(self):
        return self._settings.get("pulse_ms", PULSE_DEFAULT_MS)

    @property
    def extra_state_attributes(self):
        """Also show the pulse length and the bit (a bit stuck at on blocks)."""
        value = self.node_value
        return {
            **super().extra_state_attributes,
            "pulse_ms": self._pulse_ms,
            "bit_state": value if isinstance(value, bool) else None,
        }

    async def async_press(self) -> None:
        try:
            await self._queue.press(
                lambda on: self._async_write_value(on, refresh=False),
                self._pulse_ms,
                self.entity_id or self._node_id,
            )
        finally:
            await self.coordinator.async_request_refresh()
