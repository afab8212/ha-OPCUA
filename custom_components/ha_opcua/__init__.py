"""The OPC UA discovery integration."""

from __future__ import annotations

import asyncio
import logging
from collections import Counter
from contextlib import asynccontextmanager
from datetime import timedelta
from typing import Any

import voluptuous as vol
from asyncua import Client, ua
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EVENT_HOMEASSISTANT_STOP
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.exceptions import ConfigEntryNotReady, HomeAssistantError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from homeassistant.util import dt as dt_util

from .const import (
    CONF_CONNECTION_ENABLED,
    CONF_HUB_ID,
    CONF_HUB_PASSWORD,
    CONF_HUB_ROOT_NODE,
    CONF_HUB_SCAN_INTERVAL,
    CONF_HUB_URL,
    CONF_HUB_USERNAME,
    CONF_MANUAL_NODES,
    CONF_NODE_SETTINGS,
    CONF_OFFLINE_NODES,
    DOMAIN,
    FIELD_NODE_HUB,
    FIELD_NODE_ID,
    FIELD_VALUE,
    SERVICE_SET_VALUE,
)
from .device import async_register_device
from .node_settings import SCALAR_TYPES, effective_platform, validate_settings
from .orphans import (
    async_clear_orphan_repairs,
    async_setup_orphan_repairs,
    async_sync_orphan_repairs,
)
from .values import scalar_variant

_LOGGER = logging.getLogger(__name__)
PLATFORMS = ["sensor", "binary_sensor", "switch", "number", "text", "datetime"]
_CONNECTION_STATUS_CODES = {
    ua.StatusCodes.BadSessionIdInvalid,
    ua.StatusCodes.BadSessionClosed,
    ua.StatusCodes.BadSecureChannelIdInvalid,
    ua.StatusCodes.BadSecureChannelClosed,
    ua.StatusCodes.BadConnectionClosed,
    ua.StatusCodes.BadServerNotConnected,
    ua.StatusCodes.BadCommunicationError,
    ua.StatusCodes.BadTimeout,
}

SERVICE_SET_VALUE_SCHEMA = vol.Schema(
    {
        vol.Required(FIELD_NODE_HUB): cv.string,
        vol.Required(FIELD_NODE_ID): cv.string,
        vol.Required(FIELD_VALUE): vol.Any(bool, int, float, str),
    }
)


def _connection_error(error: Exception) -> bool:
    """Distinguish a broken session from an individual node's status error."""
    return isinstance(error, (OSError, EOFError)) or (
        isinstance(error, ua.UaStatusCodeError)
        and error.code in _CONNECTION_STATUS_CODES
    )


async def async_setup(hass: HomeAssistant, config) -> bool:
    """Register the administrator configuration panel once per HA process."""
    from .panel import async_setup_panel

    await async_setup_panel(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Connect, discover and set up one server."""
    hass.data.setdefault(DOMAIN, {})
    hub_id = entry.data[CONF_HUB_ID]
    settings = {**entry.data, **entry.options}
    hub = OpcuaHub(
        hub_name=hub_id,
        hub_url=settings[CONF_HUB_URL],
        root_node_id=settings[CONF_HUB_ROOT_NODE],
        username=settings.get(CONF_HUB_USERNAME),
        password=settings.get(CONF_HUB_PASSWORD),
    )
    coordinator = AsyncuaCoordinator(
        hass,
        hub_id,
        hub,
        timedelta(seconds=settings.get(CONF_HUB_SCAN_INTERVAL, 10)),
        config_entry=entry,
    )
    try:
        async_register_device(hass, entry)
        # Keep the connection controls available even when the PLC is off at startup.
        # Discovery is retried by the coordinator; platforms add nodes on recovery.
        await coordinator.async_refresh()
        hass.data[DOMAIN][hub_id] = coordinator
        await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    except BaseException as err:
        hass.data[DOMAIN].pop(hub_id, None)
        await coordinator.async_shutdown()
        await hub.disconnect(permanent=True)
        if isinstance(err, Exception) and _connection_error(err):
            raise ConfigEntryNotReady("OPC UA connection lost during setup") from err
        raise

    entry.async_on_unload(entry.add_update_listener(async_options_updated))
    async_setup_orphan_repairs(hass, entry, coordinator)

    async def stop_client(_event):
        await hub.disconnect(permanent=True)

    entry.async_on_unload(
        hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STOP, stop_client)
    )

    if not hass.services.has_service(DOMAIN, SERVICE_SET_VALUE):

        async def handle_set_value(service: ServiceCall) -> None:
            hub_name = service.data[FIELD_NODE_HUB]
            target = hass.data[DOMAIN].get(hub_name)
            if target is None:
                raise HomeAssistantError(f"Hub '{hub_name}' not found")
            node_id = service.data[FIELD_NODE_ID]
            try:
                await target.hub.set_value(node_id, service.data[FIELD_VALUE])
            except Exception as err:
                raise HomeAssistantError(
                    f"Write to node '{node_id}' failed: {err}"
                ) from err
            await target.async_request_refresh()

        hass.services.async_register(
            DOMAIN,
            SERVICE_SET_VALUE,
            handle_set_value,
            schema=SERVICE_SET_VALUE_SCHEMA,
        )
    return True


async def async_options_updated(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Reload only after Home Assistant has saved the updated options."""
    async_sync_orphan_repairs(hass, entry)
    coordinator = hass.data[DOMAIN][entry.data[CONF_HUB_ID]]
    options = {
        key: value
        for key, value in entry.options.items()
        if key != CONF_CONNECTION_ENABLED
    }
    if options != coordinator.reload_options:
        await hass.config_entries.async_reload(entry.entry_id)
    else:
        await coordinator.async_set_connection_enabled(
            entry.options.get(CONF_CONNECTION_ENABLED, True), persist=False
        )


def entity_unique_id(entry_id: str, node_id: str) -> str:
    """Keep display names out of entity identity."""
    return f"{entry_id}:{node_id}"


def _migrate_entity_ids(hass, entry, coordinator) -> None:
    """Preserve existing entity IDs only when the old name is unambiguous."""
    registry = er.async_get(hass)
    if not coordinator.hub.discovery_complete:
        if any(
            entity.unique_id.startswith(f"opcua_{coordinator.name}_")
            for entity in er.async_entries_for_config_entry(registry, entry.entry_id)
        ):
            raise ConfigEntryNotReady(
                "Complete OPC UA discovery is required to migrate legacy entities"
            )
        return
    counts = Counter(node["name"] for node in coordinator.nodes.values())
    for node_id, node in coordinator.nodes.items():
        name = node["name"]
        if counts[name] != 1:
            _LOGGER.warning(
                "Duplicate OPC UA name '%s': creating NodeId-based entities; "
                "any legacy entity with this name must be reviewed manually",
                name,
            )
            continue
        for platform in PLATFORMS:
            old_id = registry.async_get_entity_id(
                platform, DOMAIN, f"opcua_{coordinator.name}_{name}"
            )
            new_unique_id = entity_unique_id(entry.entry_id, node_id)
            if old_id and not registry.async_get_entity_id(
                platform, DOMAIN, new_unique_id
            ):
                old_entry = registry.async_get(old_id)
                if old_entry.config_entry_id == entry.entry_id:
                    registry.async_update_entity(old_id, new_unique_id=new_unique_id)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload entities, then close the client and remove the last service."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        coordinator = hass.data[DOMAIN].pop(entry.data[CONF_HUB_ID], None)
        if coordinator is not None:
            await coordinator.async_shutdown()
            await coordinator.hub.disconnect(permanent=True)
        if not hass.data[DOMAIN]:
            hass.services.async_remove(DOMAIN, SERVICE_SET_VALUE)
    return unload_ok


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Discard endpoint-specific repairs when the endpoint is removed."""
    async_clear_orphan_repairs(hass, entry)


class OpcuaHub:
    """Serialize session changes and operations; never replay writes."""

    def __init__(self, hub_name, hub_url, root_node_id, username=None, password=None):
        self._hub_name = hub_name
        self._hub_url = hub_url
        self._username = username
        self._password = password
        self.root_node_id = root_node_id
        self.discovery_complete = False
        self.client = None
        self._connected = False
        self._closed = False
        self.enabled = True
        self.on_connection_state_change = None
        self.last_connected = None
        self.last_disconnected = None
        self.last_successful_read = None
        self.last_error_type = None
        self.session_timeout_ms = None
        self._lock = asyncio.Lock()

    def _set_connected(self, connected):
        if self._connected == connected:
            return
        self._connected = connected
        if connected:
            self.last_connected = dt_util.utcnow()
        else:
            self.last_disconnected = dt_util.utcnow()
        if self.on_connection_state_change is not None:
            self.on_connection_state_change()

    async def pause(self):
        """Reject queued operations before waiting for an in-flight operation to end."""
        self.enabled = False
        await self.disconnect()

    async def _disconnect_locked(self) -> None:
        client, self.client = self.client, None
        self._set_connected(False)
        if client is not None:
            try:
                await client.disconnect()
            except Exception as err:
                _LOGGER.debug("Error closing OPC UA client: %s", err)

    async def _connect_locked(self) -> bool:
        if self._closed or not self.enabled:
            return False
        if self._connected and self.client is not None:
            return True
        await self._disconnect_locked()
        try:
            self.client = Client(url=self._hub_url, timeout=5, auto_reconnect=False)
            client = self.client

            async def connection_lost(error):
                # Ignore notifications from a session that has already been replaced.
                # Never disconnect here: this callback runs inside asyncua's supervisor.
                if self.client is client and self.enabled:
                    self.last_error_type = type(error).__name__
                    self._set_connected(False)

            client.connection_lost_callback = connection_lost
            if self._username:
                self.client.set_user(self._username)
            if self._password:
                self.client.set_password(self._password)
            await self.client.connect()
        except asyncio.CancelledError:
            await self._disconnect_locked()
            raise
        except Exception as err:
            self.last_error_type = type(err).__name__
            await self._disconnect_locked()
            _LOGGER.warning(
                "Failed to connect OPC UA hub '%s': %s", self._hub_name, err
            )
            return False
        self.last_error_type = None
        self.session_timeout_ms = self.client.session_timeout
        self._set_connected(True)
        return True

    async def connect(self) -> bool:
        async with self._lock:
            return await self._connect_locked()

    async def disconnect(self, *, permanent: bool = False) -> None:
        # Reject queued operations before waiting for an in-flight request to finish.
        if permanent:
            self._closed = True
        async with self._lock:
            await self._disconnect_locked()

    @property
    def is_connected(self) -> bool:
        return self._connected

    @asynccontextmanager
    async def _session(self):
        async with self._lock:
            if not self.enabled:
                raise HomeAssistantError("OPC UA connection is disabled")
            if not await self._connect_locked():
                raise ConnectionError("Could not connect to OPC UA server")
            try:
                yield self.client
            except asyncio.CancelledError:
                await self._disconnect_locked()
                raise
            except Exception as err:
                if _connection_error(err):
                    self.last_error_type = type(err).__name__
                    await self._disconnect_locked()
                raise

    @staticmethod
    async def _read_node_metadata(node, name=None):
        """Validate a readable scalar using its declared type and user permissions."""
        if await node.read_node_class() != ua.NodeClass.Variable:
            raise ValueError("unsupported_node")
        variant_type = await node.read_data_type_as_variant_type()
        rank = await node.read_value_rank()
        if variant_type.name not in SCALAR_TYPES or rank != ua.ValueRank.Scalar:
            raise ValueError("unsupported_node")
        await node.read_value()
        access = await node.get_access_level()
        user_access = await node.get_user_access_level()
        return {
            "name": name or (await node.read_browse_name()).Name,
            "node_id": node.nodeid.to_string(),
            "variant_type": variant_type.name,
            "writable": (
                ua.AccessLevel.CurrentWrite in access
                and ua.AccessLevel.CurrentWrite in user_access
            ),
        }

    async def inspect_node(self, node_id):
        """Read a single explicit NodeId without browsing children or writing."""
        try:
            parsed = ua.NodeId.from_string(node_id)
            if parsed.is_null():
                raise ValueError("null NodeId")
        except (ValueError, TypeError, ua.UaError) as err:
            raise ValueError("invalid_node_id") from err
        async with self._session() as client:
            return await self._read_node_metadata(client.get_node(parsed))

    async def discover_nodes(self) -> list[dict[str, Any]]:
        """Discover each NodeId once and cache its entity classification."""
        discovered = []
        visited = set()
        self.discovery_complete = True

        async def visit(node):
            node_id = node.nodeid.to_string()
            if node_id in visited:
                return
            visited.add(node_id)
            node_class = await node.read_node_class()
            name = (await node.read_browse_name()).Name
            if node_class == ua.NodeClass.Variable:
                try:
                    discovered.append(await self._read_node_metadata(node, name))
                except ValueError:
                    _LOGGER.debug("Skipping unsupported value on node %s", node_id)
                except ua.UaStatusCodeError as err:
                    if _connection_error(err):
                        raise
                    self.discovery_complete = False
                    _LOGGER.warning("Skipping unreadable node %s: %s", node_id, err)

            if node_class in (
                ua.NodeClass.Object,
                ua.NodeClass.ObjectType,
                ua.NodeClass.VariableType,
                ua.NodeClass.Variable,
            ):
                for child in await node.get_children():
                    try:
                        await visit(child)
                    except ua.UaStatusCodeError as err:
                        if _connection_error(err):
                            raise
                        self.discovery_complete = False
                        _LOGGER.warning(
                            "Skipping inaccessible child %s: %s", child, err
                        )

        async with self._session() as client:
            await visit(client.get_node(self.root_node_id))
        return discovered

    async def get_values(self, node_ids) -> dict[str, Any]:
        """Read values by NodeId; a single invalid node need not break the session."""
        result = {}
        async with self._session() as client:
            for node_id in node_ids:
                try:
                    result[node_id] = await client.get_node(node_id).read_value()
                except ua.UaStatusCodeError as err:
                    if _connection_error(err):
                        raise
                    _LOGGER.warning("Cannot read node %s: %s", node_id, err)
            # With no active nodes, still verify the session while enabled.
            if not node_ids:
                await client.nodes.server_state.read_value()
            if result or not node_ids:
                self.last_successful_read = dt_util.utcnow()
        return result

    async def set_value(self, nodeid: str, value: Any) -> bool:
        """Write exactly once; a missing acknowledgement has an unknown outcome."""
        async with self._session() as client:
            node = client.get_node(nodeid)
            rank = await node.read_value_rank()
            if rank != ua.ValueRank.Scalar:
                raise ValueError("Only scalar OPC UA nodes are supported")
            variant_type = await node.read_data_type_as_variant_type()
            variant = scalar_variant(value, variant_type)
            await node.write_value(ua.DataValue(variant))
        return True


class AsyncuaCoordinator(DataUpdateCoordinator):
    """Expose polling failures and keep values indexed by NodeId."""

    def __init__(
        self,
        hass,
        name,
        hub,
        update_interval_in_second=timedelta(seconds=10),
        *,
        config_entry=None,
    ):
        self._hub = hub
        self.enabled = (
            config_entry.options.get(CONF_CONNECTION_ENABLED, True)
            if config_entry
            else True
        )
        self._hub.enabled = self.enabled
        self.poll_interval = update_interval_in_second
        self.reload_options = {
            key: value
            for key, value in (config_entry.options if config_entry else {}).items()
            if key != CONF_CONNECTION_ENABLED
        }
        self._control_lock = asyncio.Lock()
        self._discovery_pending = config_entry is not None
        self.nodes = {}
        self.discovered_nodes = {}
        self.node_settings = (
            dict(config_entry.options.get(CONF_NODE_SETTINGS, {}))
            if config_entry
            else {}
        )
        self.manual_nodes = (
            dict(config_entry.options.get(CONF_MANUAL_NODES, {}))
            if config_entry
            else {}
        )
        self.offline_nodes = {
            key: node
            for key, node in (
                config_entry.options.get(CONF_OFFLINE_NODES, {}) if config_entry else {}
            ).items()
            if self.node_settings.get(key, {}).get("always_available", False)
        }
        self._manual_pending = set(self.manual_nodes)
        self._platforms = {}
        super().__init__(
            hass,
            _LOGGER,
            name=name,
            update_interval=update_interval_in_second if self.enabled else None,
            config_entry=config_entry,
        )
        self._hub.on_connection_state_change = self._connection_state_changed
        if self.offline_nodes:
            self.set_nodes([])
            # Cached metadata must not suppress normal discovery on reconnection.
            self._discovery_pending = config_entry is not None

    def _connection_state_changed(self):
        # Do not re-expose stale node values when a replacement session connects.
        if not self._hub.is_connected:
            self.data = {}
        self.async_update_listeners()

    @property
    def hub(self) -> OpcuaHub:
        return self._hub

    async def async_set_connection_enabled(self, enabled, *, persist=True):
        """Persist the requested state and stop or resume this hub without reloading."""
        async with self._control_lock:
            if self.enabled == enabled:
                return
            self.enabled = enabled
            self._hub.enabled = enabled
            self.update_interval = self.poll_interval if enabled else None
            if persist and self.config_entry:
                self.hass.config_entries.async_update_entry(
                    self.config_entry,
                    options={
                        **self.config_entry.options,
                        CONF_CONNECTION_ENABLED: enabled,
                    },
                )
            # Clear stale values, cancel timers/debounced refreshes, and publish intent.
            self.async_set_updated_data({})
            if enabled:
                await self.async_request_refresh()
            else:
                await self._hub.pause()
                self.async_set_updated_data({})

    def set_nodes(self, nodes):
        self._discovery_pending = False
        self.discovered_nodes = {node["node_id"]: node for node in nodes}
        # Keep saved manual entities visible even if temporarily unreadable.
        candidates = {
            **self.offline_nodes,
            **self.manual_nodes,
            **self.discovered_nodes,
        }
        # Remapped entities retain their identity even if their original node is gone.
        for entity_key, settings in self.node_settings.items():
            target = self.discovered_nodes.get(settings.get("node_id"))
            if entity_key not in candidates and target is not None:
                candidates[entity_key] = {**target, "node_id": entity_key}
        self.nodes = {}
        self._platforms = {}
        for node_id, original in candidates.items():
            saved = self.node_settings.get(node_id, {})
            target_id = saved.get("node_id", node_id)
            target = self.discovered_nodes.get(target_id)
            cached = self.offline_nodes.get(node_id)
            if (
                target is None
                and saved.get("always_available", False)
                and cached is not None
                and cached["node_id"] == target_id
            ):
                target = cached
            node = {
                **(target or original),
                "name": original["name"],
                "node_id": node_id,
                "target_node_id": target_id,
            }
            self.nodes[node_id] = node
            try:
                if target is None:
                    raise ValueError("node_not_found")
                settings = validate_settings(node, saved)
            except ValueError as err:
                log = (
                    _LOGGER.debug
                    if node_id in self.manual_nodes and target is None
                    else _LOGGER.warning
                )
                log(
                    "Skipping incompatible entity configuration for %s: %s",
                    node_id,
                    err,
                )
                self._platforms[node_id] = "disabled"
            else:
                self._platforms[node_id] = effective_platform(node, settings)
                if node_id in self.node_settings:
                    self.node_settings[node_id] = settings

    def nodes_for_platform(self, platform):
        return (
            (node_id, node)
            for node_id, node in self.nodes.items()
            if self._platforms[node_id] == platform
        )

    async def _async_update_data(self) -> dict[str, Any]:
        if not self.enabled:
            return {}
        try:
            discovering = self._discovery_pending
            if discovering:
                self._manual_pending.update(self.manual_nodes)
                try:
                    nodes = await self._hub.discover_nodes()
                except ua.UaStatusCodeError as err:
                    if not self.manual_nodes or _connection_error(err):
                        raise
                    self._hub.discovery_complete = False
                    _LOGGER.warning("Discovery failed; reading manual nodes: %s", err)
                    nodes = []
            else:
                nodes = list(self.discovered_nodes.values())
            pending = bool(self._manual_pending)
            for node_id in tuple(self._manual_pending):
                try:
                    metadata = await self._hub.inspect_node(node_id)
                except (ValueError, ua.UaStatusCodeError) as err:
                    if _connection_error(err):
                        raise
                    _LOGGER.debug("Manual OPC UA node %s unavailable: %s", node_id, err)
                else:
                    nodes = [node for node in nodes if node["node_id"] != node_id]
                    nodes.append(metadata)
                    self._manual_pending.discard(node_id)
            if discovering or pending:
                self.set_nodes(nodes)
            if discovering:
                try:
                    if self.config_entry and nodes:
                        _migrate_entity_ids(self.hass, self.config_entry, self)
                except Exception:
                    self._discovery_pending = True
                    raise
            active_nodes = [
                node_id
                for node_id in self.nodes
                if self._platforms[node_id] != "disabled"
            ]
            target_ids = list(
                dict.fromkeys(self.nodes[key]["target_node_id"] for key in active_nodes)
            )
            raw_values = await self._hub.get_values(target_ids)
            values = {
                key: raw_values[self.nodes[key]["target_node_id"]]
                for key in active_nodes
                if self.nodes[key]["target_node_id"] in raw_values
            }
        except Exception as err:
            # A pause can overtake an already scheduled read. It is not a failure.
            if not self.enabled:
                return {}
            raise UpdateFailed(f"OPC UA read failed: {err}") from err
        if not self.enabled:
            return {}
        if active_nodes and not values:
            raise UpdateFailed("No configured OPC UA nodes could be read")
        return values
