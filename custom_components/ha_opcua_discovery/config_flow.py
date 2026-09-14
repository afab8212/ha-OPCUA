"""Config flow for Asyncua component."""

from __future__ import annotations

from copy import deepcopy

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.const import (
    CONF_NAME,
    CONF_PASSWORD,
    CONF_SCAN_INTERVAL,
    CONF_URL,
    CONF_USERNAME,
)
from homeassistant.core import callback
from homeassistant.helpers import selector

from .const import (
    CONF_HUB_ID,
    CONF_HUB_PASSWORD,
    CONF_HUB_ROOT_NODE,
    CONF_HUB_SCAN_INTERVAL,
    CONF_HUB_URL,
    CONF_HUB_USERNAME,
    CONF_NODE_SETTINGS,
    DOMAIN,
)
from .node_settings import allowed_platforms, number_defaults, validate_settings

DEFAULT_SCAN_INTERVAL = 10


class AsyncUAConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for AsyncUA integration."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        if user_input is not None:
            unique_id = user_input[CONF_NAME].lower()  # Normalize
            await self.async_set_unique_id(unique_id)
            if self._abort_if_unique_id_configured():
                # This will abort if a config with this unique_id already exists
                return self.async_abort(reason="already_configured")

            # Proceed normally
            return self.async_create_entry(
                title=user_input[CONF_NAME],
                data={
                    CONF_HUB_ID: user_input[CONF_NAME],
                    CONF_HUB_URL: user_input[CONF_URL],
                    CONF_HUB_USERNAME: user_input.get(CONF_USERNAME),
                    CONF_HUB_PASSWORD: user_input.get(CONF_PASSWORD),
                    CONF_HUB_SCAN_INTERVAL: user_input.get(
                        CONF_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL
                    ),
                    CONF_HUB_ROOT_NODE: user_input.get(CONF_HUB_ROOT_NODE, "").strip(),
                },
            )

        data_schema = vol.Schema(
            {
                vol.Required(CONF_NAME): str,
                vol.Required(CONF_URL): str,
                vol.Optional(CONF_USERNAME): str,
                vol.Optional(CONF_PASSWORD): str,
                vol.Optional(CONF_SCAN_INTERVAL, default=DEFAULT_SCAN_INTERVAL): int,
                vol.Required(CONF_HUB_ROOT_NODE, default="ns=2;i=1"): str,
            }
        )

        return self.async_show_form(step_id="user", data_schema=data_schema)

    @staticmethod
    @callback
    def async_get_options_flow(config_entry):
        return AsyncUAOptionsFlow(config_entry)


class AsyncUAOptionsFlow(config_entries.OptionsFlow):
    """Choose the entity platform and editing limits for each discovered NodeId."""

    def __init__(self, config_entry):
        self._entry_id = config_entry.entry_id
        self._node_id = None
        self._node = None

    @property
    def _entry(self):
        return self.hass.config_entries.async_get_entry(self._entry_id)

    async def async_step_init(self, user_input=None):
        return self.async_show_menu(
            step_id="init", menu_options=["connection", "nodes"]
        )

    async def async_step_connection(self, user_input=None):
        if user_input is not None:
            options = deepcopy(dict(self._entry.options))
            options.update(user_input)
            # The frontend omits cleared optional fields. Persist explicit empty
            # overrides so old options and initial entry credentials cannot return.
            for key in (CONF_HUB_USERNAME, CONF_HUB_PASSWORD):
                options[key] = user_input.get(key, "")
            options[CONF_HUB_ROOT_NODE] = options[CONF_HUB_ROOT_NODE].strip()
            return self.async_create_entry(title="", data=options)

        current = {**self._entry.data, **self._entry.options}
        return self.async_show_form(
            step_id="connection",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_HUB_URL, default=current[CONF_HUB_URL]): str,
                    vol.Optional(
                        CONF_HUB_USERNAME,
                        description={
                            "suggested_value": current.get(CONF_HUB_USERNAME) or ""
                        },
                    ): str,
                    vol.Optional(
                        CONF_HUB_PASSWORD,
                        description={
                            "suggested_value": current.get(CONF_HUB_PASSWORD) or ""
                        },
                    ): str,
                    vol.Required(
                        CONF_HUB_SCAN_INTERVAL,
                        default=current.get(
                            CONF_HUB_SCAN_INTERVAL, DEFAULT_SCAN_INTERVAL
                        ),
                    ): vol.All(vol.Coerce(int), vol.Range(min=1)),
                    vol.Required(
                        CONF_HUB_ROOT_NODE,
                        default=current.get(CONF_HUB_ROOT_NODE, "ns=2;i=1"),
                    ): str,
                }
            ),
        )

    async def async_step_nodes(self, user_input=None):
        coordinator = self.hass.data.get(DOMAIN, {}).get(self._entry.data[CONF_HUB_ID])
        if coordinator is None:
            return self.async_abort(reason="integration_not_loaded")
        if not coordinator.nodes:
            return self.async_abort(reason="no_nodes")
        errors = {}
        if user_input is not None:
            node_id = user_input["node_id"]
            if node_id in coordinator.nodes:
                self._node_id = node_id
                self._node = coordinator.nodes[node_id]
                return await self.async_step_node()
            errors["base"] = "node_not_found"
        return self.async_show_form(
            step_id="nodes",
            errors=errors,
            data_schema=vol.Schema(
                {
                    vol.Required("node_id"): selector.SelectSelector(
                        selector.SelectSelectorConfig(
                            options=[
                                {
                                    "value": node_id,
                                    "label": f'{node["name"]} — {node_id} ({node["variant_type"]})',
                                }
                                for node_id, node in sorted(
                                    coordinator.nodes.items(),
                                    key=lambda item: (item[1]["name"], item[0]),
                                )
                            ],
                            mode=selector.SelectSelectorMode.DROPDOWN,
                        )
                    )
                }
            ),
        )

    def _save_node(self, settings):
        options = deepcopy(dict(self._entry.options))
        mappings = options.setdefault(CONF_NODE_SETTINGS, {})
        if settings["platform"] == "auto":
            mappings.pop(self._node_id, None)
        else:
            mappings[self._node_id] = settings
        return self.async_create_entry(title="", data=options)

    def _current_settings(self):
        return self._entry.options.get(CONF_NODE_SETTINGS, {}).get(self._node_id, {})

    def _placeholders(self):
        return {"node": f'{self._node["name"]} ({self._node_id})'}

    async def async_step_node(self, user_input=None):
        errors = {}
        choices = allowed_platforms(self._node)
        if user_input is not None:
            platform = user_input["platform"]
            if platform not in choices:
                errors["base"] = "incompatible_platform"
            elif platform == "number":
                return await self.async_step_number()
            elif platform == "text":
                return await self.async_step_text()
            else:
                return self._save_node({"platform": platform})
        current = self._current_settings().get("platform", "auto")
        return self.async_show_form(
            step_id="node",
            errors=errors,
            description_placeholders=self._placeholders(),
            data_schema=vol.Schema(
                {
                    vol.Required(
                        "platform", default=current if current in choices else "auto"
                    ): selector.SelectSelector(
                        selector.SelectSelectorConfig(
                            options=choices,
                            translation_key="platform",
                            mode=selector.SelectSelectorMode.DROPDOWN,
                        )
                    )
                }
            ),
        )

    async def _async_step_limits(self, platform, defaults, user_input):
        errors = {}
        if user_input is not None:
            try:
                settings = validate_settings(
                    self._node, {**user_input, "platform": platform}
                )
            except ValueError as err:
                errors["base"] = str(err)
            else:
                return self._save_node(settings)
        current = {**defaults, **self._current_settings(), **(user_input or {})}
        return self.async_show_form(
            step_id=platform,
            errors=errors,
            description_placeholders=self._placeholders(),
            data_schema=vol.Schema(
                {
                    vol.Required(key, default=current[key]): (
                        vol.Coerce(float) if platform == "number" else int
                    )
                    for key in defaults
                }
            ),
        )

    async def async_step_number(self, user_input=None):
        return await self._async_step_limits(
            "number", number_defaults(self._node), user_input
        )

    async def async_step_text(self, user_input=None):
        return await self._async_step_limits(
            "text", {"min_length": 0, "max_length": 255}, user_input
        )
