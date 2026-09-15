"""Identify obsolete registry entries without treating offline nodes as removed."""

from asyncua import ua
from homeassistant.core import callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import issue_registry as ir

from .const import (
    CONF_CONNECTION_ENABLED,
    CONF_HUB_ID,
    CONF_MANUAL_NODES,
    CONF_NODE_SETTINGS,
    DOMAIN,
)
from .node_settings import effective_platform, validate_settings

ISSUE_PREFIX = "orphan_entity_"
NODE_PLATFORMS = {"sensor", "binary_sensor", "switch", "number", "text", "datetime"}


def is_orphan(hass, entry, entity):
    """Require a replaced domain or a complete discovery of an unconfigured node."""
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
    if requested in NODE_PLATFORMS:
        return entity.domain != requested

    c = hass.data.get(DOMAIN, {}).get(entry.data[CONF_HUB_ID])
    options = {k: v for k, v in entry.options.items() if k != CONF_CONNECTION_ENABLED}
    if (
        c is None
        or c.config_entry is not entry
        or c.reload_options != options
        or c._discovery_pending
        or not c.enabled
        or not c.hub.is_connected
        or not c.last_update_success
        or not c.hub.discovery_complete
    ):
        return False
    target = c.discovered_nodes.get(saved.get("node_id", key))
    if target is not None:
        try:
            settings = validate_settings(target, saved)
        except ValueError:
            return False
        return entity.domain != effective_platform(target, settings)
    # Keep explicitly configured or manual nodes even if currently absent.
    return key not in mappings and key not in entry.options.get(CONF_MANUAL_NODES, {})


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
