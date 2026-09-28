"""Routine library logs stay quiet while diagnostics remain controllable."""

import logging
from unittest.mock import AsyncMock, patch

import pytest

from custom_components.ha_opcua import async_setup

pytestmark = pytest.mark.asyncio


async def test_default_suppresses_library_info_but_preserves_warnings_and_debug_control(
    hass, caplog
):
    library = logging.getLogger("asyncua")
    client = logging.getLogger("asyncua.client.ua_session")
    subscription = logging.getLogger("asyncua.common.subscription")
    original = {logger: logger.level for logger in (library, client, subscription)}
    try:
        for logger in original:
            logger.setLevel(logging.NOTSET)
        with (
            caplog.at_level(logging.INFO),
            patch(
                "custom_components.ha_opcua.panel.async_setup_panel", new=AsyncMock()
            ),
        ):
            root_level = logging.getLogger().level
            assert await async_setup(hass, {})
            assert logging.getLogger().level == root_level
            client.info("routine read")
            subscription.info("routine notification")
            client.warning("connection warning")
            subscription.error("subscription error")
            assert "routine read" not in caplog.text
            assert "routine notification" not in caplog.text
            assert "connection warning" in caplog.text
            assert "subscription error" in caplog.text
            # Enabling diagnostic logging later must not be blocked by a filter
            # or reset by another setup call.
            library.setLevel(logging.DEBUG)
            assert await async_setup(hass, {})
            with caplog.at_level(logging.DEBUG):
                client.debug("requested debug detail")
            assert "requested debug detail" in caplog.text
    finally:
        for logger, level in original.items():
            logger.setLevel(level)


@pytest.mark.parametrize("level", [logging.DEBUG, logging.INFO, logging.ERROR])
async def test_explicit_library_logging_level_is_preserved(hass, level):
    library = logging.getLogger("asyncua")
    original = library.level
    try:
        library.setLevel(level)
        with patch(
            "custom_components.ha_opcua.panel.async_setup_panel", new=AsyncMock()
        ):
            assert await async_setup(hass, {})
        assert library.level == level
    finally:
        library.setLevel(original)
