"""Small fixtures using Home Assistant's real coordinator and entity registry."""

import inspect
from types import MappingProxyType

import pytest
import pytest_asyncio
from homeassistant.config_entries import ConfigEntries, ConfigEntry, ConfigEntryState
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import frame

from custom_components.ha_opcua.const import DOMAIN


@pytest_asyncio.fixture
async def hass(tmp_path):
    instance = HomeAssistant(str(tmp_path))
    instance.config_entries = ConfigEntries(instance, {})
    frame.async_setup(instance)
    dr.async_setup(instance)
    await dr.async_load(instance)
    await er.async_load(instance)
    yield instance
    await instance.async_stop()


@pytest.fixture
def entry(hass):
    kwargs = dict(
        domain=DOMAIN,
        title="PLC",
        unique_id="plc",
        version=1,
        minor_version=1,
        data={
            "hub_id": "PLC",
            "url": "opc.tcp://localhost:4840",
            "hub_root": "ns=2;i=1",
        },
        options={},
        source="user",
        state=ConfigEntryState.SETUP_IN_PROGRESS,
    )
    parameters = inspect.signature(ConfigEntry).parameters
    if "discovery_keys" in parameters:
        kwargs["discovery_keys"] = MappingProxyType({})
    if "subentries_data" in parameters:
        kwargs["subentries_data"] = []
    result = ConfigEntry(**kwargs)
    hass.config_entries._entries[result.entry_id] = result
    return result
