"""Integer OPC UA nodes chosen from a user-defined value table."""

from asyncua import ua
from homeassistant.components.select import SelectEntity
from homeassistant.exceptions import HomeAssistantError

from .const import DOMAIN
from .entity import OpcuaEntity, async_setup_node_entities
from .node_settings import label_for_value
from .values import scalar_variant


async def async_setup_entry(hass, entry, async_add_entities):
    coordinator = hass.data[DOMAIN][entry.data["hub_id"]]
    async_setup_node_entities(
        coordinator, entry, async_add_entities, "select", AsyncuaSelect
    )


class AsyncuaSelect(OpcuaEntity, SelectEntity):
    """Read and write an integer node through the texts of its value table."""

    @property
    def options(self):
        return [item["label"] for item in self._settings.get("value_labels") or ()]

    @property
    def current_option(self):
        # A raw value missing from the table shows as unknown; the raw value
        # itself stays visible in the attributes.
        return label_for_value(self._settings, self.node_value)

    @property
    def extra_state_attributes(self):
        return {**super().extra_state_attributes, "raw_value": self.node_value}

    async def async_select_option(self, option):
        for item in self._settings.get("value_labels") or ():
            if item["label"] == option:
                value = item["value"]
                break
        else:
            raise HomeAssistantError(f"Unknown option: {option}")
        try:
            scalar_variant(value, ua.VariantType[self._variant_type])
        except ValueError as err:
            raise HomeAssistantError(str(err)) from err
        await self._async_write_value(value)
