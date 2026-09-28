"""Subscriptions require opt-in while preserving saved endpoint choices."""

from unittest.mock import AsyncMock, patch

import pytest
from homeassistant.const import CONF_NAME, CONF_URL

from custom_components.ha_opcua import async_options_updated, async_setup_entry
from custom_components.ha_opcua.config_flow import AsyncUAConfigFlow, AsyncUAOptionsFlow
from custom_components.ha_opcua.const import (
    CONF_CONNECTION_ENABLED,
    CONF_SUBSCRIPTION_ENABLED,
    DOMAIN,
)

pytestmark = pytest.mark.asyncio


@pytest.mark.parametrize("choice", [None, False, True])
async def test_new_endpoint_subscription_is_opt_in(hass, choice):
    flow = AsyncUAConfigFlow()
    flow.hass = hass
    flow.context = {"source": "user"}
    form = await flow.async_step_user()
    user_input = {CONF_NAME: "New PLC", CONF_URL: "opc.tcp://localhost:4840"}
    assert form["data_schema"](user_input)[CONF_SUBSCRIPTION_ENABLED] is False
    if choice is not None:
        user_input[CONF_SUBSCRIPTION_ENABLED] = choice
    result = await flow.async_step_user(user_input)
    assert result["data"][CONF_SUBSCRIPTION_ENABLED] is (choice is True)


@pytest.mark.parametrize(
    ("data_choice", "option_choice", "expected"),
    [
        (None, None, False),
        (False, None, False),
        (True, None, True),
        (None, True, True),
        (True, False, False),
        (False, True, True),
    ],
)
async def test_saved_choice_and_legacy_default_across_setup_and_options(
    hass, entry, data_choice, option_choice, expected
):
    data = dict(entry.data)
    options = {CONF_CONNECTION_ENABLED: False}
    if data_choice is not None:
        data[CONF_SUBSCRIPTION_ENABLED] = data_choice
    if option_choice is not None:
        options[CONF_SUBSCRIPTION_ENABLED] = option_choice
    hass.config_entries.async_update_entry(entry, data=data, options=options)
    with patch.object(
        hass.config_entries, "async_forward_entry_setups", new=AsyncMock()
    ):
        assert await async_setup_entry(hass, entry)
    coordinator = hass.data[DOMAIN]["PLC"]
    try:
        assert coordinator.subscription_enabled is expected
        flow = AsyncUAOptionsFlow(entry)
        flow.hass = hass
        form = await flow.async_step_connection()
        assert form["data_schema"]({})[CONF_SUBSCRIPTION_ENABLED] is expected
        await async_options_updated(hass, entry)
        assert coordinator.subscription_enabled is expected
    finally:
        await coordinator.async_shutdown()
        await entry._async_process_on_unload(hass)
