"""Exercise orphan cleanup with HA's real issue registry and repair flow manager."""

from copy import deepcopy
from unittest.mock import AsyncMock

import pytest
from homeassistant import loader
from homeassistant.components.repairs import issue_handler
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.helpers import area_registry as ar
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.translation import async_get_translations

from custom_components.ha_opcua import (
    AsyncuaCoordinator,
    OpcuaHub,
    async_remove_entry,
)
from custom_components.ha_opcua.const import (
    CONF_MANUAL_NODES,
    CONF_NODE_SETTINGS,
    DOMAIN,
)
from custom_components.ha_opcua.orphans import (
    ISSUE_PREFIX,
    async_setup_orphan_repairs,
    async_sync_orphan_repairs,
    is_orphan,
)
from custom_components.ha_opcua.panel import async_save_entity, endpoint_snapshot

pytestmark = pytest.mark.asyncio
KEY = "ns=4;i=2"
NODE = {"name": "Run", "node_id": KEY, "variant_type": "Boolean", "writable": True}


async def prepare(hass, entry):
    await ar.async_load(hass)
    await ir.async_load(hass)
    loader.async_setup(hass)
    hass.config.components.add(DOMAIN)
    hass.data["repairs"] = {}
    issue_handler.async_setup(hass)
    hub = OpcuaHub("PLC", entry.data["url"], entry.data["hub_root"])
    hub.set_value = AsyncMock()
    hub.get_values = AsyncMock(return_value={KEY: True})
    c = AsyncuaCoordinator(hass, "PLC", hub, config_entry=entry)
    c.set_nodes([NODE])
    hass.data[DOMAIN] = {"PLC": c}
    registry = er.async_get(hass)
    old = registry.async_get_or_create(
        "switch", DOMAIN, f"{entry.entry_id}:{KEY}", config_entry=entry
    )
    async_setup_orphan_repairs(hass, entry, c)
    return c, registry, old


async def save(hass, entry, platform, **changes):
    return await async_save_entity(
        hass,
        {
            "entry_id": entry.entry_id,
            "revision": endpoint_snapshot(hass, entry)["revision"],
            "key": KEY,
            "node_id": KEY,
            "platform": platform,
            "name": "Run",
            "area_id": None,
            "device_class": None,
            "invert_state": False,
            **changes,
        },
    )


def issue(hass, entity):
    return ir.async_get(hass).async_get_issue(DOMAIN, f"{ISSUE_PREFIX}{entity.id}")


async def start_flow(hass, entity):
    manager = hass.data["repairs"]["flow_manager"]
    result = await manager.async_init(
        DOMAIN, data={"issue_id": f"{ISSUE_PREFIX}{entity.id}"}
    )
    assert result["type"] == FlowResultType.FORM
    assert result["step_id"] == "confirm"
    return manager, result["flow_id"]


async def test_panel_change_repair_confirmation_removes_only_old_entity(hass, entry):
    c, registry, old = await prepare(hass, entry)
    new = (await save(hass, entry, "binary_sensor"))["entity_id"]
    assert issue(hass, old).is_fixable
    for language in ("en", "it"):
        translations = await async_get_translations(
            hass, language, "issues", integrations=[DOMAIN]
        )
        description = translations[
            f"component.{DOMAIN}.issues.orphan_entity.fix_flow.step.confirm.description"
        ]
        assert old.entity_id in description.format(
            **issue(hass, old).translation_placeholders
        )
    assert registry.async_get(old.entity_id) is not None
    assert registry.async_get(new) is not None
    options = deepcopy(dict(entry.options))
    manager, flow_id = await start_flow(hass, old)
    # Renaming after opening the dialog cannot defeat immutable identity checks.
    renamed = registry.async_update_entity(
        old.entity_id, new_entity_id="switch.renamed"
    )
    await hass.async_block_till_done()
    assert issue(hass, old).translation_placeholders["entity_id"] == renamed.entity_id
    result = await manager.async_configure(flow_id, {})
    assert result["type"] == FlowResultType.CREATE_ENTRY
    assert registry.async_get(renamed.entity_id) is None
    assert registry.async_get(new) is not None
    assert dict(entry.options) == options
    assert issue(hass, old) is None
    c.hub.set_value.assert_not_awaited()
    await c.async_shutdown()


async def test_cancel_and_revert_while_dialog_open_do_not_delete(hass, entry):
    c, registry, old = await prepare(hass, entry)
    await save(hass, entry, "binary_sensor")
    manager, flow_id = await start_flow(hass, old)
    manager.async_abort(flow_id)
    assert registry.async_get(old.entity_id) and issue(hass, old)
    manager, flow_id = await start_flow(hass, old)
    await save(hass, entry, "switch")
    assert issue(hass, old) is None
    result = await manager.async_configure(flow_id, {})
    assert result["type"] == FlowResultType.ABORT
    assert result["reason"] == "no_longer_orphan"
    assert registry.async_get(old.entity_id).disabled_by is None
    await c.async_shutdown()


async def test_external_deletion_and_reused_entity_id_are_safe(hass, entry):
    c, registry, old = await prepare(hass, entry)
    await save(hass, entry, "binary_sensor")
    manager, flow_id = await start_flow(hass, old)
    registry.async_remove(old.entity_id)
    other = registry.async_get_or_create(
        "switch",
        "other_integration",
        "unrelated",
        suggested_object_id=old.entity_id.split(".", 1)[1],
    )
    assert other.entity_id == old.entity_id
    await hass.async_block_till_done()
    assert issue(hass, old) is None
    result = await manager.async_configure(flow_id, {})
    assert result["type"] == FlowResultType.ABORT
    assert registry.async_get(other.entity_id) == other
    await c.async_shutdown()


async def test_offline_startup_can_repair_explicit_replacement(hass, entry):
    c, registry, old = await prepare(hass, entry)
    hass.config_entries.async_update_entry(
        entry, options={CONF_NODE_SETTINGS: {KEY: {"platform": "binary_sensor"}}}
    )
    # A new coordinator has never connected or discovered anything.
    restored = AsyncuaCoordinator(hass, "PLC", c.hub, config_entry=entry)
    hass.data[DOMAIN]["PLC"] = restored
    async_setup_orphan_repairs(hass, entry, restored)
    assert issue(hass, old)
    manager, flow_id = await start_flow(hass, old)
    assert (await manager.async_configure(flow_id, {}))[
        "type"
    ] == FlowResultType.CREATE_ENTRY
    assert registry.async_get(old.entity_id) is None
    await c.async_shutdown()
    await restored.async_shutdown()


async def test_discovery_requires_complete_current_results_and_protects_configured_nodes(
    hass, entry
):
    c, registry, old = await prepare(hass, entry)
    # A read-only Boolean automatically becomes a sensor instead of a switch.
    c.set_nodes([{**NODE, "writable": False}])
    assert not is_orphan(hass, entry, old)  # Not connected or verified.
    c.hub._connected = True
    c.hub.discovery_complete = True
    assert is_orphan(hass, entry, old)
    c.hub.discovery_complete = False
    assert not is_orphan(hass, entry, old)
    c.hub.discovery_complete = True
    c.set_nodes([])
    assert is_orphan(hass, entry, old)  # Unconfigured node absent after full browse.
    # A discovery-dependent repair must become harmless if connectivity is lost
    # while its confirmation dialog is open.
    async_sync_orphan_repairs(hass, entry)
    manager, flow_id = await start_flow(hass, old)
    c.hub._connected = False
    assert (await manager.async_configure(flow_id, {}))["type"] == FlowResultType.ABORT
    assert registry.async_get(old.entity_id) is not None
    c.hub._connected = True
    # Saved settings alone no longer protect a node that a complete discovery
    # shows as gone - otherwise every auto-assigned platform would keep dead
    # entities forever. Only manual nodes, exclusions and "always available"
    # entities are designed to outlive the live node.
    for options in (
        {CONF_NODE_SETTINGS: {KEY: {"platform": "auto"}}},
        {CONF_NODE_SETTINGS: {KEY: {"platform": "switch"}}},
    ):
        hass.config_entries.async_update_entry(entry, options=options)
        c.reload_options = options
        assert is_orphan(hass, entry, old)
    for options in (
        {CONF_MANUAL_NODES: {KEY: NODE}},
        {CONF_NODE_SETTINGS: {KEY: {"platform": "disabled"}}},
        {CONF_NODE_SETTINGS: {KEY: {"platform": "auto", "always_available": True}}},
    ):
        hass.config_entries.async_update_entry(entry, options=options)
        c.reload_options = options
        assert not is_orphan(hass, entry, old)
    hass.config_entries.async_update_entry(entry, options={})
    c.reload_options = {}
    for flag in ("offline", "failed", "pending", "reloading"):
        c.hub._connected = flag != "offline"
        c.last_update_success = flag != "failed"
        c._discovery_pending = flag == "pending"
        c.reload_options = {"changed": True} if flag == "reloading" else {}
        assert not is_orphan(hass, entry, old)
    await c.async_shutdown()


async def test_metadata_exclusion_connection_controls_and_endpoint_removal(hass, entry):
    c, registry, old = await prepare(hass, entry)
    await save(hass, entry, "switch", name="Renamed", invert_state=True)
    assert issue(hass, old) is None
    await save(hass, entry, "disabled")
    assert issue(hass, old) is None
    for key in ("connection", "connection_enabled", "opcua_PLC_Run"):
        control = registry.async_get_or_create(
            "switch", DOMAIN, f"{entry.entry_id}:{key}", config_entry=entry
        )
        assert not is_orphan(hass, entry, control)
    await save(hass, entry, "binary_sensor")
    assert issue(hass, old)
    await async_remove_entry(hass, entry)
    assert issue(hass, old) is None
    assert registry.async_get(old.entity_id) is not None
    await c.async_shutdown()
