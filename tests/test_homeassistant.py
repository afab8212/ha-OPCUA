"""Check actual coordinator, registry and entity behavior."""

import asyncio
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch

import pytest
from homeassistant.exceptions import ConfigEntryNotReady, HomeAssistantError
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.update_coordinator import UpdateFailed

from custom_components.ha_opcua_discovery import (
    AsyncuaCoordinator,
    _migrate_entity_ids,
    async_setup_entry,
    async_unload_entry,
    entity_unique_id,
)
from custom_components.ha_opcua_discovery.const import DOMAIN, SERVICE_SET_VALUE
from custom_components.ha_opcua_discovery.sensor import AsyncuaSensor
from custom_components.ha_opcua_discovery.switch import AsyncuaSwitch

pytestmark = pytest.mark.asyncio


def coordinator(hass):
    hub = Mock(get_values=AsyncMock(), set_value=AsyncMock(), disconnect=AsyncMock())
    result = AsyncuaCoordinator(hass, "PLC", hub)
    result.set_nodes(
        [
            {"name": "Status", "node_id": "ns=2;i=1", "writable_boolean": False},
            {"name": "Status", "node_id": "ns=2;i=2", "writable_boolean": False},
            {"name": "Run", "node_id": "ns=2;i=3", "writable_boolean": True},
        ]
    )
    return result


async def test_entities_use_node_ids_and_initial_switch_value(hass, entry):
    c = coordinator(hass)
    assert len(c.nodes) == 3
    c.async_set_updated_data(
        {"ns=2;i=1": "First", "ns=2;i=2": "Second", "ns=2;i=3": True}
    )
    first = AsyncuaSensor(c, "Status", "ns=2;i=1", entry.entry_id)
    second = AsyncuaSensor(c, "Status", "ns=2;i=2", entry.entry_id)
    switch = AsyncuaSwitch(c, "Run", "ns=2;i=3", entry.entry_id)
    assert first.unique_id != second.unique_id
    assert first.native_value == "First" and second.native_value == "Second"
    assert switch.is_on is True and switch.available
    c.async_set_updated_data({"ns=2;i=1": "First"})
    assert first.available and not second.available and not switch.available
    assert switch.is_on is None


async def test_coordinator_marks_failure_and_recovers(hass):
    c = coordinator(hass)
    c.hub.get_values.side_effect = ConnectionError("offline")
    await c.async_refresh()
    assert not c.last_update_success
    c.hub.get_values.side_effect = None
    c.hub.get_values.return_value = {"ns=2;i=3": True}
    await c.async_refresh()
    assert c.last_update_success and c.data == {"ns=2;i=3": True}
    c.hub.get_values.return_value = {}
    with pytest.raises(UpdateFailed, match="No configured"):
        await c._async_update_data()
    c.hub.get_values.side_effect = asyncio.CancelledError()
    with pytest.raises(asyncio.CancelledError):
        await c._async_update_data()
    c.hub.disconnect.assert_not_awaited()


async def test_switch_reads_back_after_write_and_reports_failure(hass, entry):
    c = coordinator(hass)
    c.async_set_updated_data({"ns=2;i=3": True})
    c.hub.get_values.return_value = {"ns=2;i=3": False}
    switch = AsyncuaSwitch(c, "Run", "ns=2;i=3", entry.entry_id)
    await switch.async_turn_off()
    c.hub.set_value.assert_awaited_once_with("ns=2;i=3", False)
    assert switch.is_on is False
    c.hub.set_value.side_effect = TimeoutError("unknown write outcome")
    with pytest.raises(HomeAssistantError):
        await switch.async_turn_on()
    assert switch.is_on is False


async def test_registry_migrates_unambiguous_entities_only(hass, entry):
    # Register the real entry so the registry can validate ownership.
    hass.config_entries._entries[entry.entry_id] = entry
    await er.async_load(hass)
    registry = er.async_get(hass)
    run = registry.async_get_or_create(
        "switch", DOMAIN, "opcua_PLC_Run", config_entry=entry
    )
    duplicate = registry.async_get_or_create(
        "sensor", DOMAIN, "opcua_PLC_Status", config_entry=entry
    )
    registry.async_update_entity(run.entity_id, name="My pump")
    c = coordinator(hass)
    c.hub.discovery_complete = False
    with pytest.raises(ConfigEntryNotReady, match="discovery"):
        _migrate_entity_ids(hass, entry, c)
    assert registry.async_get(run.entity_id).unique_id == "opcua_PLC_Run"
    c.hub.discovery_complete = True
    _migrate_entity_ids(hass, entry, c)
    migrated = registry.async_get(run.entity_id)
    assert migrated.unique_id == entity_unique_id(entry.entry_id, "ns=2;i=3")
    assert migrated.name == "My pump"
    assert registry.async_get(duplicate.entity_id).unique_id == "opcua_PLC_Status"
    # A repeated setup must not create or remap entries again.
    _migrate_entity_ids(hass, entry, c)
    assert registry.async_get(run.entity_id).unique_id == migrated.unique_id


async def test_setup_failure_cleans_resources_and_requests_retry(hass, entry):
    hub = Mock(
        connect=AsyncMock(return_value=True),
        discover_nodes=AsyncMock(side_effect=ConnectionError()),
        disconnect=AsyncMock(),
    )
    with patch("custom_components.ha_opcua_discovery.OpcuaHub", return_value=hub):
        with pytest.raises(ConfigEntryNotReady):
            await async_setup_entry(hass, entry)
    hub.disconnect.assert_awaited_once()
    assert hass.data[DOMAIN] == {}
    assert not hass.services.has_service(DOMAIN, SERVICE_SET_VALUE)


async def test_service_uses_selected_hub_and_lives_until_last_unload(hass, entry):
    await er.async_load(hass)
    hub = Mock(
        connect=AsyncMock(return_value=True),
        discover_nodes=AsyncMock(return_value=[]),
        get_values=AsyncMock(return_value={}),
        set_value=AsyncMock(),
        disconnect=AsyncMock(),
    )
    with (
        patch("custom_components.ha_opcua_discovery.OpcuaHub", return_value=hub),
        patch.object(
            hass.config_entries, "async_forward_entry_setups", new=AsyncMock()
        ),
    ):
        assert await async_setup_entry(hass, entry)
    c = hass.data[DOMAIN]["PLC"]
    c.async_request_refresh = AsyncMock()
    other = SimpleNamespace(
        hub=Mock(set_value=AsyncMock(), disconnect=AsyncMock()),
        async_request_refresh=AsyncMock(),
    )
    hass.data[DOMAIN]["Other"] = other
    await hass.services.async_call(
        DOMAIN,
        SERVICE_SET_VALUE,
        {"hub": "Other", "node_id": "ns=2;i=1", "value": " [A,B] "},
        blocking=True,
    )
    other.hub.set_value.assert_awaited_once_with("ns=2;i=1", " [A,B] ")
    other.async_request_refresh.assert_awaited_once()
    hub.set_value.assert_not_awaited()
    with patch.object(
        hass.config_entries, "async_unload_platforms", new=AsyncMock(return_value=True)
    ):
        assert await async_unload_entry(hass, entry)
        assert hass.services.has_service(DOMAIN, SERVICE_SET_VALUE)
        assert await async_unload_entry(hass, SimpleNamespace(data={"hub_id": "Other"}))
        assert not hass.services.has_service(DOMAIN, SERVICE_SET_VALUE)
    # Execute config entry cleanup hooks as HA does after unloading.
    await entry._async_process_on_unload(hass)
