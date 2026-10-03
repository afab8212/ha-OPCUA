"""Entity customization changes preserve the session and registered entities."""

import logging
from unittest.mock import AsyncMock, Mock, patch

import pytest
from homeassistant.helpers.entity_component import EntityComponent
from test_panel import prepare

from custom_components.ha_opcua import AsyncuaCoordinator, async_options_updated
from custom_components.ha_opcua.const import CONF_NODE_SETTINGS, DOMAIN
from custom_components.ha_opcua.number import AsyncuaNumber
from custom_components.ha_opcua.panel import async_save_entity, endpoint_snapshot
from custom_components.ha_opcua.text import AsyncuaText

pytestmark = pytest.mark.asyncio


async def test_panel_availability_applies_offline_without_reload(hass, entry):
    c, registered, msg = await prepare(hass, entry)
    msg.update(node_id=msg["key"], always_available=True)
    c.enabled = False
    c.hub.enabled = False
    # Saving personalization neither connects nor needs a live value.
    c.hub.connect = AsyncMock()
    with patch.object(hass.config_entries, "async_reload", new=AsyncMock()) as reload:
        result = await async_save_entity(hass, msg)
        assert result["reload"] is False
        assert c.node_settings[msg["key"]]["always_available"] is True
        assert c.offline_nodes[msg["key"]]["variant_type"] == "Boolean"
        # Keep the endpoint disabled when its options listener processes the save.
        hass.config_entries.async_update_entry(
            entry, options={**entry.options, "connection_enabled": False}
        )
        await async_options_updated(hass, entry)
        reload.assert_not_awaited()
        c.hub.connect.assert_not_awaited()
    await c.async_shutdown()


async def test_number_and_text_update_existing_ha_entities(hass, entry):
    nodes = [
        {
            "name": "Value",
            "node_id": "ns=2;i=1",
            "variant_type": "Int16",
            "writable": True,
        },
        {
            "name": "Recipe",
            "node_id": "ns=2;i=2",
            "variant_type": "String",
            "writable": True,
        },
    ]
    options = {
        CONF_NODE_SETTINGS: {
            "ns=2;i=1": {"platform": "number", "min": 0, "max": 100, "step": 1},
            "ns=2;i=2": {"platform": "text", "min_length": 0, "max_length": 255},
        }
    }
    hass.config_entries.async_update_entry(entry, options=options)
    hub = Mock(is_connected=True, set_value=AsyncMock())
    c = AsyncuaCoordinator(hass, "PLC", hub, config_entry=entry)
    hass.data[DOMAIN] = {"PLC": c}
    c.set_nodes(nodes)
    c.data = {"ns=2;i=1": 25, "ns=2;i=2": "recipe"}
    c.last_update_success = True
    number = AsyncuaNumber(c, "Value", "ns=2;i=1", entry.entry_id)
    text = AsyncuaText(c, "Recipe", "ns=2;i=2", entry.entry_id)
    for domain, entity in (("number", number), ("text", text)):
        component = EntityComponent(logging.getLogger(__name__), domain, hass)
        platform = component._async_init_entity_platform(DOMAIN, None)
        platform.config_entry = entry
        await platform.async_add_entities([entity])
    updated = {
        CONF_NODE_SETTINGS: {
            "ns=2;i=1": {
                "platform": "number",
                "min": 0,
                "max": 50,
                "step": 0.1,
                "conversion": {"type": "multiplier", "factor": 0.1},
                "unit_of_measurement": "°C",
                "device_class": "temperature",
                "always_available": True,
            },
            "ns=2;i=2": {"platform": "text", "min_length": 2, "max_length": 20},
        }
    }
    with patch.object(hass.config_entries, "async_reload", new=AsyncMock()) as reload:
        hass.config_entries.async_update_entry(entry, options=updated)
        await async_options_updated(hass, entry)
        reload.assert_not_awaited()
    state = hass.states.get(number.entity_id)
    assert state.state == "2.5"
    assert state.attributes["max"] == 50
    assert state.attributes["step"] == 0.1
    assert state.attributes["device_class"] == "temperature"
    assert state.attributes["unit_of_measurement"] == "°C"
    assert hass.states.get(text.entity_id).attributes["max"] == 20
    assert text.native_min == 2
    hub.is_connected = False
    c.async_set_updated_data({})
    assert number.available
    assert hass.states.get(number.entity_id).state == "2.5"
    # Turning retention off while disconnected makes the same entity unavailable.
    without_retention = {
        CONF_NODE_SETTINGS: {
            **updated[CONF_NODE_SETTINGS],
            "ns=2;i=1": {
                **updated[CONF_NODE_SETTINGS]["ns=2;i=1"],
                "always_available": False,
            },
        }
    }
    assert c.apply_entity_options(without_retention)
    assert hass.states.get(number.entity_id).state == "unavailable"
    assert c.apply_entity_options(updated)
    assert hass.states.get(number.entity_id).state == "2.5"
    await c.async_shutdown()


@pytest.mark.parametrize(
    "change",
    [
        {"platform": "sensor"},
        {"node_id": "ns=2;i=2"},
        {"update_mode": "subscription"},
    ],
)
async def test_structural_edits_still_request_reload(hass, entry, change):
    c, _, msg = await prepare(hass, entry)
    msg.update({"node_id": msg["key"], **change})
    msg["revision"] = endpoint_snapshot(hass, entry)["revision"]
    result = await async_save_entity(hass, msg)
    assert result["reload"] is True
    await c.async_shutdown()
