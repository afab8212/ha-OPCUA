"""Hub controls and connection diagnostics without exposing credentials."""

from urllib.parse import urlsplit, urlunsplit

from homeassistant.helpers.update_coordinator import CoordinatorEntity


def connection_attributes(coordinator):
    hub = coordinator.hub
    # OPC UA URLs can contain userinfo. Never copy credentials/query/fragment to HA.
    try:
        parsed = urlsplit(hub._hub_url)
        hostname = parsed.hostname
        port = parsed.port
        host = f"[{hostname}]" if hostname and ":" in hostname else hostname or ""
        netloc = f"{host}:{port}" if port is not None else host
        endpoint = urlunsplit((parsed.scheme, netloc, parsed.path, "", ""))
    except ValueError:
        hostname = port = endpoint = None
    return {
        "connection_enabled": coordinator.enabled,
        "endpoint": endpoint,
        "host": hostname,
        "port": port,
        "root_node_id": hub.root_node_id,
        "scan_interval_seconds": coordinator.poll_interval.total_seconds(),
        "security_mode": "None",
        "authentication": (
            "username" if hub._username or "@" in hub._hub_url else "anonymous"
        ),
        "session_timeout_ms": hub.session_timeout_ms if hub.is_connected else None,
        "discovered_nodes": len(coordinator.nodes),
        "polled_nodes": (
            sum(
                1
                for platform in coordinator._platforms.values()
                if platform != "disabled"
            )
            if coordinator.enabled
            else 0
        ),
        "last_connected": hub.last_connected,
        "last_disconnected": hub.last_disconnected,
        "last_successful_read": hub.last_successful_read,
        "last_connection_error_type": hub.last_error_type,
    }


class OpcuaConnectionEntity(CoordinatorEntity):
    """Keep local connection controls usable while communication is unavailable."""

    _attr_has_entity_name = True

    def __init__(self, coordinator, entry, key):
        super().__init__(coordinator)
        self._attr_unique_id = f"{entry.entry_id}:{key}"
        self._attr_translation_placeholders = {"hub": coordinator.name}

    @property
    def available(self):
        return True
