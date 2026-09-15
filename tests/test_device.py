"""Native device grouping preserves existing registry identities and customizations."""

import json
from unittest.mock import AsyncMock, Mock, patch

import pytest
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er

from custom_components.ha_opcua import (
    AsyncuaCoordinator,
    OpcuaHub,
    async_setup_entry,
    entity_unique_id,
)
from custom_components.ha_opcua.binary_sensor import (
    AsyncuaBinarySensor,
    OpcuaConnectionSensor,
)
from custom_components.ha_opcua.const import CONF_CONNECTION_ENABLED, DOMAIN
from custom_components.ha_opcua.device import (
    async_register_device,
    device_info,
)
from custom_components.ha_opcua.diagnostics import (
    async_get_config_entry_diagnostics,
    async_get_device_diagnostics,
)
from custom_components.ha_opcua.number import AsyncuaNumber
from custom_components.ha_opcua.sensor import AsyncuaSensor
from custom_components.ha_opcua.switch import (
    AsyncuaSwitch,
    OpcuaConnectionSwitch,
)
from custom_components.ha_opcua.text import AsyncuaText

pytestmark = pytest.mark.asyncio


async def test_register_device_preserves_entities_names_and_areas(hass, entry):
    await ar.async_load(hass)
    area = ar.async_get(hass).async_create("Workshop")
    registry = er.async_get(hass)
    existing = registry.async_get_or_create(
        "sensor",
        DOMAIN,
        entity_unique_id(entry.entry_id, "ns=2;i=1"),
        config_entry=entry,
        suggested_object_id="original_entity",
    )
    existing = registry.async_update_entity(
        existing.entity_id, name="My counter", area_id=area.id
    )
    # This entity is excluded or unavailable, so no platform will add it on startup.
    excluded = registry.async_get_or_create(
        "text",
        DOMAIN,
        entity_unique_id(entry.entry_id, "ns=2;i=2"),
        config_entry=entry,
        disabled_by=er.RegistryEntryDisabler.USER,
    )
    unrelated = registry.async_get_or_create(
        "sensor", "other_integration", "other-node"
    )
    device = async_register_device(hass, entry)
    assert device.name == entry.title and device.model == "OPC UA Server"
    assert device.identifiers == {(DOMAIN, entry.entry_id)}
    updated = registry.async_get(existing.entity_id)
    assert updated.device_id == device.id
    assert (
        updated.entity_id == existing.entity_id
        and updated.unique_id == existing.unique_id
    )
    assert updated.name == "My counter" and updated.area_id == area.id
    assert registry.async_get(excluded.entity_id).device_id == device.id
    assert (
        registry.async_get(excluded.entity_id).disabled_by
        == er.RegistryEntryDisabler.USER
    )
    assert registry.async_get(unrelated.entity_id).device_id is None
    dr.async_get(hass).async_update_device(
        device.id, name_by_user="Machine A", area_id=area.id
    )
    hass.config_entries.async_update_entry(
        entry, title="Renamed PLC", options={"url": "opc.tcp://new-host:4840"}
    )
    again = async_register_device(hass, entry)
    assert (
        again.id == device.id
        and again.name_by_user == "Machine A"
        and again.area_id == area.id
    )
    assert len(dr.async_get(hass).devices) == 1
    assert len(registry.entities) == 3
    assert (
        device_info("another_entry", entry.title)["identifiers"] != device.identifiers
    )


async def test_every_platform_and_connection_control_uses_same_device(hass, entry):
    c = AsyncuaCoordinator(hass, "PLC", Mock(), config_entry=entry)
    classes = [
        AsyncuaSensor,
        AsyncuaBinarySensor,
        AsyncuaSwitch,
        AsyncuaNumber,
        AsyncuaText,
    ]
    kinds = ["Double", "Boolean", "Boolean", "Int16", "String"]
    c.node_settings = {
        "ns=2;i=3": {"platform": "number"},
        "ns=2;i=4": {"platform": "text"},
    }
    c.set_nodes(
        [
            {
                "name": f"Node {i}",
                "node_id": f"ns=2;i={i}",
                "variant_type": kind,
                "writable": True,
            }
            for i, kind in enumerate(kinds)
        ]
    )
    entities = [
        cls(c, f"Node {i}", f"ns=2;i={i}", entry.entry_id)
        for i, cls in enumerate(classes)
    ]
    entities += [OpcuaConnectionSwitch(c, entry), OpcuaConnectionSensor(c, entry)]
    expected = device_info(entry.entry_id, entry.title)
    assert all(entity.device_info == expected for entity in entities)
    assert len({entity.unique_id for entity in entities}) == 7
    assert entities[0].unique_id == entity_unique_id(entry.entry_id, "ns=2;i=0")
    assert entities[0].name == "Node 0"
    await c.async_shutdown()


async def test_disabled_setup_registers_device_without_network_and_diagnostics_redact(
    hass, entry
):
    hass.config_entries.async_update_entry(
        entry, options={CONF_CONNECTION_ENABLED: False}
    )
    with (
        patch("custom_components.ha_opcua.Client") as client,
        patch.object(
            hass.config_entries, "async_forward_entry_setups", new=AsyncMock()
        ),
    ):
        assert await async_setup_entry(hass, entry)
        client.assert_not_called()
    device = dr.async_get(hass).async_get_device_by_identifier(
        (DOMAIN, entry.entry_id), entry.entry_id
    )
    assert device is not None
    c = hass.data[DOMAIN]["PLC"]
    c._hub = OpcuaHub(
        "secret_name",
        "opc.tcp://user:secret@private-host:4840/?token=secret",
        "ns=2;s=secret-root",
        username="private-user",
        password="secret",
    )
    c.set_nodes(
        [
            {
                "name": "private-node",
                "node_id": "ns=2;s=private-node",
                "variant_type": "String",
                "writable": False,
            }
        ]
    )
    c.data = {"ns=2;s=private-node": "secret-value"}
    diagnostics = await async_get_device_diagnostics(hass, entry, device)
    assert diagnostics == await async_get_config_entry_diagnostics(hass, entry)
    assert diagnostics["connection_enabled"] is False and not diagnostics["connected"]
    assert diagnostics["node_platform_counts"] == {"sensor": 1}
    serialized = json.dumps(diagnostics)
    for private in ("secret", "private-host", "private-user", "private-node", "token"):
        assert private not in serialized
    hass.data[DOMAIN].clear()
    assert await async_get_config_entry_diagnostics(hass, entry) == {
        "connection_enabled": False,
        "loaded": False,
    }
    await c.async_shutdown()
    await entry._async_process_on_unload(hass)
