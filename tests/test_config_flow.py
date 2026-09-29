"""A newly created endpoint must be distinguishable from an upgrading one."""

import pytest
from homeassistant.const import CONF_NAME, CONF_URL

from custom_components.ha_opcua.config_flow import AsyncUAConfigFlow
from custom_components.ha_opcua.const import CONF_KNOWN_NODE_IDS

pytestmark = pytest.mark.asyncio


async def test_new_endpoint_seeds_an_empty_known_node_ids_baseline(hass):
    """A fresh endpoint's own first discovery must see its nodes as new.

    Without a baseline, _known_node_ids_initialized stays False forever for
    this entry (see the coordinator's known_node_ids docstring), and a
    read-only Boolean found on the very first discovery would never get the
    binary_sensor smart default - that protection is meant only for an
    installation upgrading from before this feature existed, not a
    brand-new one. Seeding an empty (not absent) known_node_ids at creation
    makes a fresh endpoint look already-initialized with nothing known yet.
    """
    flow = AsyncUAConfigFlow()
    flow.hass = hass
    flow.context = {"source": "user"}
    await flow.async_step_user()

    result = await flow.async_step_user(
        {CONF_NAME: "New PLC", CONF_URL: "opc.tcp://localhost:4840"}
    )

    assert result["options"] == {CONF_KNOWN_NODE_IDS: []}
