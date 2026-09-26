"""A node classified before entities_ready must still reach the config entry."""

from unittest.mock import AsyncMock, Mock

import pytest

from custom_components.ha_opcua import AsyncuaCoordinator
from custom_components.ha_opcua.const import CONF_KNOWN_NODE_IDS, CONF_NODE_SETTINGS

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
