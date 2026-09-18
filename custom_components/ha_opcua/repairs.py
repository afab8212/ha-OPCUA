"""Native Home Assistant confirmation flow for obsolete node entities."""

import voluptuous as vol
from homeassistant.components.repairs import RepairsFlow
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers import issue_registry as ir

from .const import DOMAIN
from .orphans import ISSUE_PREFIX, async_remove_orphan, is_orphan


class OrphanEntityRepairFlow(RepairsFlow):
    """Revalidate ownership and configuration immediately before removal."""

    async def async_step_init(self, user_input=None):
        return await self.async_step_confirm()

    async def async_step_confirm(self, user_input=None):
        data = self.data or {}
        entry = self.hass.config_entries.async_get_entry(data.get("entry_id", ""))
        registry = er.async_get(self.hass)
        entity = (
            next(
                (
                    item
                    for item in er.async_entries_for_config_entry(
                        registry, entry.entry_id
                    )
                    if item.id == data.get("registry_id")
                ),
                None,
            )
            if entry is not None
            else None
        )
        if (
            entity is None
            or self.issue_id != f"{ISSUE_PREFIX}{entity.id}"
            or not is_orphan(self.hass, entry, entity)
        ):
            ir.async_delete_issue(self.hass, DOMAIN, self.issue_id)
            return self.async_abort(reason="no_longer_orphan")
        if user_input is not None:
            # No await between the final check and deletion: a panel save cannot
            # switch this node back to its previous type in between. Removes
            # the entity, its issue and its saved node settings in one go.
            async_remove_orphan(self.hass, entry, entity)
            return self.async_create_entry(data={})
        return self.async_show_form(
            step_id="confirm",
            data_schema=vol.Schema({}),
            description_placeholders={
                "entity_id": entity.entity_id,
                "endpoint": entry.title,
            },
        )


async def async_create_fix_flow(hass, issue_id, data):
    """Home Assistant supplies issue_id and data on the returned flow."""
    return OrphanEntityRepairFlow()
