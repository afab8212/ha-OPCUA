"""A node classified before entities_ready must still reach the config entry."""

from unittest.mock import AsyncMock, Mock, patch

import pytest

from custom_components.ha_opcua import AsyncuaCoordinator, async_options_updated
from custom_components.ha_opcua.const import (
    CONF_KNOWN_NODE_IDS,
    CONF_NODE_SETTINGS,
    CONF_OFFLINE_NODES,
    CONF_SUBSCRIPTION_ENABLED,
    DOMAIN,
)

pytestmark = pytest.mark.asyncio

NEW_NODE = {
    "name": "New",
    "node_id": "ns=2;i=9",
    "variant_type": "Float",
    "writable": True,
}


async def test_auto_assigned_settings_survive_until_entities_ready(hass, entry):
    hub = Mock(
        get_values=AsyncMock(),
        set_value=AsyncMock(),
        disconnect=AsyncMock(),
        ensure_subscription=AsyncMock(),
        disable_subscription=AsyncMock(),
    )
    c = AsyncuaCoordinator(hass, "PLC", hub, config_entry=entry)
    # A baseline already exists (an established installation), so the new
    # node below is recognized as genuinely new rather than pre-existing.
    c.known_node_ids = {"ns=2;i=1"}
    c._known_node_ids_initialized = True

    # Mirrors real startup: the first discovery runs (via async_refresh) before
    # async_setup_entry flips entities_ready, so persisting must be deferred.
    assert c.entities_ready is False
    c.set_nodes([NEW_NODE], full_discovery=True)

    assert c.node_settings["ns=2;i=9"]["platform"] == "number"
    assert c.node_settings["ns=2;i=9"]["precision"] == 2
    assert "ns=2;i=9" not in entry.options.get(CONF_NODE_SETTINGS, {})

    # The next poll: the node already has settings in memory, so it no longer
    # looks "newly assigned" - the pending backlog is what must carry the
    # write through, not a fresh classification.
    c.entities_ready = True
    c.set_nodes([NEW_NODE], full_discovery=True)

    saved = entry.options[CONF_NODE_SETTINGS]["ns=2;i=9"]
    assert saved["platform"] == "number"
    assert saved["precision"] == 2

    await c.async_shutdown()


def _hub_returning(node):
    hub = Mock(
        set_value=AsyncMock(),
        disconnect=AsyncMock(),
        ensure_subscription=AsyncMock(),
        disable_subscription=AsyncMock(),
        discovery_complete=True,
    )
    hub.discover_nodes = AsyncMock(return_value=[node])
    hub.get_values = AsyncMock(return_value={node["node_id"]: 1.5})
    return hub


async def test_initial_baseline_persists_after_first_refresh_without_manual_set_nodes(
    hass, entry
):
    """Matches the real call sequence instead of a second manual set_nodes().

    On a brand-new installation (no known_node_ids yet), async_setup_entry()
    calls async_refresh() (which runs discovery) before entities_ready is
    set, then flushes once it is. A regular poll after that never calls
    set_nodes() again on its own - discovery is no longer pending - so the
    flush at entities_ready time must be what actually saves the baseline.
    """
    c = AsyncuaCoordinator(hass, "PLC", _hub_returning(NEW_NODE), config_entry=entry)

    await c.async_refresh()
    assert c.entities_ready is False
    assert CONF_KNOWN_NODE_IDS not in entry.options

    c.entities_ready = True
    c.flush_pending_discovery_state()
    assert entry.options[CONF_KNOWN_NODE_IDS] == ["ns=2;i=9"]

    # A regular poll: discovery is no longer pending, so set_nodes() is not
    # called again at all. Nothing should change, and nothing should break.
    await c.async_refresh()
    assert entry.options[CONF_KNOWN_NODE_IDS] == ["ns=2;i=9"]

    await c.async_shutdown()


async def test_new_node_settings_persist_with_existing_baseline_without_manual_set_nodes(
    hass, entry
):
    """Same as above, but for an already-established installation.

    A newly discovered REAL node's auto-assigned platform/precision must
    reach the config entry through the entities_ready flush, not through a
    manually forced second set_nodes() call standing in for "the next poll".
    """
    c = AsyncuaCoordinator(hass, "PLC", _hub_returning(NEW_NODE), config_entry=entry)
    c.known_node_ids = {"ns=2;i=1"}
    c._known_node_ids_initialized = True

    await c.async_refresh()
    assert c.entities_ready is False
    assert "ns=2;i=9" not in entry.options.get(CONF_NODE_SETTINGS, {})

    c.entities_ready = True
    c.flush_pending_discovery_state()

    saved = entry.options[CONF_NODE_SETTINGS]["ns=2;i=9"]
    assert saved["platform"] == "number" and saved["precision"] == 2

    # A regular poll: discovery is no longer pending, so set_nodes() is not
    # called again at all. Nothing should change, and nothing should break.
    await c.async_refresh()
    assert entry.options[CONF_NODE_SETTINGS]["ns=2;i=9"]["platform"] == "number"

    await c.async_shutdown()


async def test_cache_only_startup_seed_never_becomes_the_discovery_baseline(
    hass, entry
):
    """The pre-connection cache-only pass in __init__ must not seed the baseline.

    On an upgrading installation with no known_node_ids baseline yet, an
    "always available" node's cached metadata is loaded via
    set_nodes([], persist=False) in __init__, before any real discovery ever
    runs and while the PLC may still be offline. If that pass recorded a
    snapshot, flushing it right after entities_ready would wrongly treat the
    tiny cached-only set as the complete baseline - so once the PLC
    reconnects, a pre-existing PLC node that was never manually configured
    (and isn't in that cache) would look "new" on the very first real
    discovery and get auto-reclassified, overwriting its existing behavior.
    """
    cached_id = "ns=2;i=5"
    existing_id = "ns=2;i=9"
    cached_node = {
        "name": "Cached",
        "node_id": cached_id,
        "variant_type": "Boolean",
        "writable": False,
    }
    existing_node = {
        "name": "Existing",
        "node_id": existing_id,
        "variant_type": "Float",
        "writable": True,
    }
    hass.config_entries.async_update_entry(
        entry,
        options={
            CONF_NODE_SETTINGS: {cached_id: {"always_available": True}},
            CONF_OFFLINE_NODES: {cached_id: cached_node},
        },
    )
    hub = Mock(
        set_value=AsyncMock(),
        disconnect=AsyncMock(),
        ensure_subscription=AsyncMock(),
        disable_subscription=AsyncMock(),
        discovery_complete=True,
    )
    hub.discover_nodes = AsyncMock(return_value=[cached_node, existing_node])
    hub.get_values = AsyncMock(return_value={cached_id: True, existing_id: 1.5})

    # __init__ seeds offline_nodes from the cache before any real discovery.
    c = AsyncuaCoordinator(hass, "PLC", hub, config_entry=entry)
    assert CONF_KNOWN_NODE_IDS not in entry.options

    # entities_ready flips right after the initial async_refresh() in
    # async_setup_entry, regardless of whether the PLC was actually reachable.
    c.entities_ready = True
    c.flush_pending_discovery_state()
    assert CONF_KNOWN_NODE_IDS not in entry.options

    # The PLC reconnects: the first real discovery must not treat the
    # pre-existing, never-configured node as new.
    await c.async_refresh()
    assert existing_id not in entry.options.get(CONF_NODE_SETTINGS, {})
    assert entry.options[CONF_KNOWN_NODE_IDS] == sorted([cached_id, existing_id])

    await c.async_shutdown()


async def test_persisting_discovery_state_does_not_trigger_a_reload_once_subscription_is_saved(
    hass, entry
):
    """_persist_discovery_state's reload_options must exclude subscription_enabled too.

    Once subscription_enabled has ever been saved into entry.options (e.g.
    via the options flow or the subscription switch), it stays there.
    async_options_updated() compares entry.options against
    coordinator.reload_options with both connection_enabled and
    subscription_enabled filtered out (see its own docstring/comment). If
    _persist_discovery_state() only filtered out connection_enabled, saving
    a newly discovered node's settings while subscription_enabled sits in
    options would make that comparison mismatch forever, triggering a full
    config entry reload on every single discovery-driven write - not just
    once, but repeatedly on live SPS changes.
    """
    hass.config_entries.async_update_entry(
        entry, options={CONF_SUBSCRIPTION_ENABLED: True}
    )
    c = AsyncuaCoordinator(hass, "PLC", _hub_returning(NEW_NODE), config_entry=entry)
    c.known_node_ids = {"ns=2;i=1"}
    c._known_node_ids_initialized = True
    hass.data.setdefault(DOMAIN, {})["PLC"] = c

    await c.async_refresh()
    c.entities_ready = True
    c.flush_pending_discovery_state()
    assert "ns=2;i=9" in entry.options.get(CONF_NODE_SETTINGS, {})

    with patch.object(hass.config_entries, "async_reload", new=AsyncMock()) as reload:
        await async_options_updated(hass, entry)
        reload.assert_not_awaited()

    await c.async_shutdown()


async def test_new_read_only_boolean_defaults_to_binary_sensor(hass, entry):
    """A sensor can only show raw True/False; binary_sensor is the proper fit.

    Mirrors the writable-numeric/string smart defaults above, with the same
    "never retroactive" guard: only a genuinely new node (per known_node_ids)
    with no saved settings gets this, so an existing installation's Boolean
    sensors never silently change domain.
    """
    new_boolean = {
        "name": "Alarm",
        "node_id": "ns=2;i=9",
        "variant_type": "Boolean",
        "writable": False,
    }
    hub = Mock(
        get_values=AsyncMock(),
        set_value=AsyncMock(),
        disconnect=AsyncMock(),
        ensure_subscription=AsyncMock(),
        disable_subscription=AsyncMock(),
    )
    c = AsyncuaCoordinator(hass, "PLC", hub, config_entry=entry)
    c.known_node_ids = {"ns=2;i=1"}
    c._known_node_ids_initialized = True

    c.set_nodes([new_boolean], full_discovery=True)

    assert c.node_settings["ns=2;i=9"]["platform"] == "binary_sensor"

    await c.async_shutdown()


async def test_fresh_endpoint_first_discovery_defaults_to_binary_sensor(hass, entry):
    """A brand-new endpoint's very first discovery must not be treated as an upgrade.

    known_node_ids being initialized (config_flow seeds it to []; see
    config_flow.async_step_user) but still empty is what a genuinely fresh
    endpoint looks like before its first real discovery - every discovered
    node is new relative to that empty baseline, unlike the protected
    "never initialized" case an existing installation predating this
    feature is in.
    """
    new_boolean = {
        "name": "Alarm",
        "node_id": "ns=2;i=9",
        "variant_type": "Boolean",
        "writable": False,
    }
    hub = Mock(
        get_values=AsyncMock(),
        set_value=AsyncMock(),
        disconnect=AsyncMock(),
        ensure_subscription=AsyncMock(),
        disable_subscription=AsyncMock(),
    )
    c = AsyncuaCoordinator(hass, "PLC", hub, config_entry=entry)
    # A fresh endpoint per config_flow: initialized, but nothing known yet.
    c.known_node_ids = set()
    c._known_node_ids_initialized = True

    c.set_nodes([new_boolean], full_discovery=True)

    assert c.node_settings["ns=2;i=9"]["platform"] == "binary_sensor"

    await c.async_shutdown()


async def test_existing_read_only_boolean_never_retroactively_becomes_binary_sensor(
    hass, entry
):
    """An installation's pre-existing Boolean sensor must never silently change."""
    existing_boolean = {
        "name": "Alarm",
        "node_id": "ns=2;i=1",
        "variant_type": "Boolean",
        "writable": False,
    }
    hub = Mock(
        get_values=AsyncMock(),
        set_value=AsyncMock(),
        disconnect=AsyncMock(),
        ensure_subscription=AsyncMock(),
        disable_subscription=AsyncMock(),
    )
    c = AsyncuaCoordinator(hass, "PLC", hub, config_entry=entry)
    # This node was already known before this feature existed.
    c.known_node_ids = {"ns=2;i=1"}
    c._known_node_ids_initialized = True

    c.set_nodes([existing_boolean], full_discovery=True)

    assert "ns=2;i=1" not in c.node_settings

    await c.async_shutdown()
