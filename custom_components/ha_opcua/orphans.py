"""Identify obsolete registry entries without treating offline nodes as removed."""

from copy import deepcopy

from asyncua import ua
from homeassistant.core import callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import issue_registry as ir

from .const import (
    CONF_CONNECTION_ENABLED,
    CONF_HUB_ID,
    CONF_MANUAL_NODES,
    CONF_NODE_SETTINGS,
    CONF_OFFLINE_NODES,
    CONF_SUBSCRIPTION_ENABLED,
    DOMAIN,
)
from .node_settings import effective_platform, validate_settings

ISSUE_PREFIX = "orphan_entity_"
NODE_PLATFORMS = {"sensor", "binary_sensor", "switch", "number", "text", "datetime"}


def _reload_options(options):
    """Mirror the filter used for coordinator.reload_options in __init__.py."""
    return {
        k: v
        for k, v in options.items()
        if k not in (CONF_CONNECTION_ENABLED, CONF_SUBSCRIPTION_ENABLED)
    }


def _ready_coordinator(hass, entry):
    """Return the coordinator only when its last complete discovery is trustworthy.

    Anything less (reloading, disconnected, discovery pending or partial)
    would make a merely unreachable node look removed.
    """
    c = hass.data.get(DOMAIN, {}).get(entry.data[CONF_HUB_ID])
    if (
        c is None
        or c.config_entry is not entry
        or c.reload_options != _reload_options(entry.options)
        or c._discovery_pending
        or not c.enabled
        or not c.hub.is_connected
        or not c.last_update_success
        or not c.hub.discovery_complete
    ):
        return None
    return c


def is_orphan(hass, entry, entity):
    """Flag a leftover of a category change, or a node gone after complete discovery.

    A node is considered gone when a *complete* discovery pass no longer lists
    it - regardless of whether the user (or the auto-assignment) saved settings
    for it. Only manual nodes and "always available" entities are exempt: both
    exist precisely to outlive the live node.
    """
    prefix = f"{entry.entry_id}:"
    if (
        entry.domain != DOMAIN
        or entity.config_entry_id != entry.entry_id
        or entity.platform != DOMAIN
        or entity.domain not in NODE_PLATFORMS
        or not entity.unique_id.startswith(prefix)
    ):
        return False
    key = entity.unique_id[len(prefix) :]
    # Connection controls and legacy identities are not OPC UA variable nodes.
    try:
        ua.NodeId.from_string(key)
    except (ValueError, TypeError, ua.UaError):
        return False
    mappings = entry.options.get(CONF_NODE_SETTINGS, {})
    saved = mappings.get(key, {})
    requested = saved.get("platform", "auto")
    if requested == "disabled":
        return False  # Exclusion is a reversible pause, not node removal.
    # An explicit platform that differs from this entity's domain: the entity
    # is what a category change left behind. Needs no live connection.
    if requested in NODE_PLATFORMS and entity.domain != requested:
        return True

    c = _ready_coordinator(hass, entry)
    if c is None:
        return False
    target_id = saved.get("node_id", key)
    target = c.discovered_nodes.get(target_id)
    if target is not None:
        if requested in NODE_PLATFORMS:
            return False  # Explicit platform matching the domain (checked above).
        try:
            settings = validate_settings(target, saved)
        except ValueError:
            return False
        return entity.domain != effective_platform(target, settings)
    # Node absent after a complete discovery pass.
    manual = entry.options.get(CONF_MANUAL_NODES, {})
    if key in manual or target_id in manual:
        return False
    return not saved.get("always_available", False)


@callback
def async_remove_orphan(hass, entry, entity):
    """Delete an orphaned entity together with every trace of its node config.

    Shared by the Repairs fix flow and the panel's delete button. Node settings
    and cached offline metadata are dropped only when no other entity (an old
    domain left by a category change) still refers to the same node key.
    """
    registry = er.async_get(hass)
    key = entity.unique_id[len(f"{entry.entry_id}:") :]
    unique_id = entity.unique_id
    registry.async_remove(entity.entity_id)
    ir.async_delete_issue(hass, DOMAIN, f"{ISSUE_PREFIX}{entity.id}")
    still_referenced = any(
        other.unique_id == unique_id
        for other in er.async_entries_for_config_entry(registry, entry.entry_id)
    )
    if still_referenced:
        return
    options = deepcopy(dict(entry.options))
    changed = False
    for section in (CONF_NODE_SETTINGS, CONF_OFFLINE_NODES):
        if key in options.get(section, {}):
            del options[section][key]
            changed = True
            if not options[section]:
                options.pop(section)
    if not changed:
        return
    c = hass.data.get(DOMAIN, {}).get(entry.data[CONF_HUB_ID])
    if c is not None and c.config_entry is entry:
        c.node_settings.pop(key, None)
        c.offline_nodes.pop(key, None)
        # The running coordinator no longer lists this node anyway, so a
        # reload would only rebuild the same thing. Syncing reload_options
        # first makes async_options_updated apply live instead - and it must
        # come first because HA starts update listeners eagerly (see
        # _persist_discovery_state in __init__.py).
        c.reload_options = _reload_options(options)
    hass.config_entries.async_update_entry(entry, options=options)


@callback
def async_sync_orphan_repairs(hass, entry):
    """Reconcile issues by immutable registry ID; never delete entities here."""
    registry = er.async_get(hass)
    wanted = set()
    for entity in er.async_entries_for_config_entry(registry, entry.entry_id):
        if not is_orphan(hass, entry, entity):
            continue
        issue_id = f"{ISSUE_PREFIX}{entity.id}"
        wanted.add(issue_id)
        ir.async_create_issue(
            hass,
            DOMAIN,
            issue_id,
            is_fixable=True,
            severity=ir.IssueSeverity.WARNING,
            translation_key="orphan_entity",
            translation_placeholders={
                "entity_id": entity.entity_id,
                "endpoint": entry.title,
            },
            data={"entry_id": entry.entry_id, "registry_id": entity.id},
        )
    for (domain, issue_id), issue in list(ir.async_get(hass).issues.items()):
        if (
            domain == DOMAIN
            and issue_id.startswith(ISSUE_PREFIX)
            and (issue.data or {}).get("entry_id") == entry.entry_id
            and issue_id not in wanted
        ):
            ir.async_delete_issue(hass, DOMAIN, issue_id)


@callback
def async_setup_orphan_repairs(hass, entry, coordinator):
    """Check on setup, discovery updates and registry renames/removals."""

    @callback
    def sync():
        async_sync_orphan_repairs(hass, entry)

    @callback
    def registry_updated(event):
        # Removed entries are no longer in the registry: reconcile this endpoint.
        if event.data["action"] in {"remove", "update", "create"}:
            sync()

    entry.async_on_unload(coordinator.async_add_listener(sync))
    entry.async_on_unload(
        hass.bus.async_listen(er.EVENT_ENTITY_REGISTRY_UPDATED, registry_updated)
    )
    sync()


@callback
def async_clear_orphan_repairs(hass, entry):
    """Remove this endpoint's issues when its config entry is deleted."""
    for (domain, issue_id), issue in list(ir.async_get(hass).issues.items()):
        if (
            domain == DOMAIN
            and issue_id.startswith(ISSUE_PREFIX)
            and (issue.data or {}).get("entry_id") == entry.entry_id
        ):
            ir.async_delete_issue(hass, DOMAIN, issue_id)
