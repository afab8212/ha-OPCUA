"""A node classified before entities_ready must still reach the config entry."""

from unittest.mock import AsyncMock, Mock

import pytest

from custom_components.ha_opcua import AsyncuaCoordinator
from custom_components.ha_opcua.const import CONF_NODE_SETTINGS

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
