"""One Home Assistant device per configured OPC UA server."""

from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.entity import DeviceInfo

from .const import DOMAIN


def device_info(entry_id, name):
    """Keep device identity independent of server address and display name."""
    return DeviceInfo(
        identifiers={(DOMAIN, entry_id)},
        name=name,
        model="OPC UA Server",
    )


def async_register_device(hass, entry):
    """Group existing entities too, including unavailable and excluded nodes."""
    device = dr.async_get(hass).async_get_or_create(
        config_entry_id=entry.entry_id,
        **device_info(entry.entry_id, entry.title),
    )
    registry = er.async_get(hass)
    for entity in er.async_entries_for_config_entry(registry, entry.entry_id):
        # Preserve explicit assignments to any pre-existing device.
        if entity.device_id is None:
            registry.async_update_entity(entity.entity_id, device_id=device.id)
    return device
