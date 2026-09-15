"""Downloadable diagnostics without PLC values, credentials or node identifiers."""

from collections import Counter
from datetime import datetime

from .connection import connection_attributes
from .const import CONF_CONNECTION_ENABLED, CONF_HUB_ID, DOMAIN


async def async_get_config_entry_diagnostics(hass, entry):
    """Describe communication and entity routing using an explicit safe subset."""
    coordinator = hass.data.get(DOMAIN, {}).get(entry.data[CONF_HUB_ID])
    result = {
        "connection_enabled": entry.options.get(CONF_CONNECTION_ENABLED, True),
        "loaded": coordinator is not None,
    }
    if coordinator is None:
        return result
    connection = connection_attributes(coordinator)
    for key in ("endpoint", "host", "root_node_id"):
        connection[key] = "**REDACTED**"
    result["connection"] = {
        key: value.isoformat() if isinstance(value, datetime) else value
        for key, value in connection.items()
    }
    result["connected"] = coordinator.enabled and coordinator.hub.is_connected
    result["last_poll_success"] = coordinator.last_update_success
    result["node_platform_counts"] = dict(Counter(coordinator._platforms.values()))
    return result


async def async_get_device_diagnostics(hass, entry, device):
    """The device and its config entry describe the same OPC UA server."""
    return await async_get_config_entry_diagnostics(hass, entry)
