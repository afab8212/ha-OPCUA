# OPC UA Connect 2.2.0

This release brings a redesigned configuration panel, optional subscriptions per entity, and selective conversion of existing Boolean sensors.

## New identity and panel

- The integration and sidebar are now named **OPC UA Connect**. The project remains **ha-OPCUA**; the `ha_opcua` domain, installation directory and services are unchanged from 2.1.0.
- Compact grid and list views, clearer state indicators, softly colored value blocks and badges for saved entity customizations.
- Improved mobile layout, with Save and Cancel fixed at the bottom of the entity editor.
- Independent frontend version **1.3.0**, shown alongside integration version **2.2.0**, with cache invalidation for frontend updates.

## Optional subscriptions per entity

- Choose **Polling only** or **Polling + subscription** for each entity.
- Enable the endpoint's **Auto-Subscription** master switch directly from the panel. The switch entity remains available for automations.
- Polling remains the default and continues when subscriptions are enabled. Both the endpoint switch and per-entity opt-in are required for notifications.
- Numeric deadband filters small changes in raw OPC UA values. Default deadband is 0.01 for Float/Double and 1 for integers; use 0 to disable filtering.
- Routine asyncua logging is quieter while warnings, errors and explicitly configured logging levels are preserved.

## Discovery and Boolean sensors

- Rediscover nodes from the panel without recreating the endpoint.
- Smart defaults for new discovered nodes: writable numbers and strings become editable entities, read-only Booleans become binary sensors, and REAL/LREAL values start with two decimal places. Existing configurations and saved choices are preserved.
- Convert selected existing read-only Boolean sensors left on Auto using a dialog with names, NodeIds, current states and checkboxes. Nothing is selected initially; Select all is optional.
- Conversion preserves custom names and areas and disables the previous sensor entries. Explicit category choices are never overridden.
- Panel orphan cleanup complements Home Assistant Repairs. Clarified cleanup descriptions explain when settings are preserved for replacement entities.

## Updating from 2.1.0

Update the integration and restart Home Assistant. Reload the browser if the panel still displays an older version. There is no domain migration or need to recreate endpoints when upgrading from 2.1.0.

Subscriptions remain opt-in: existing endpoint choices are retained, but entities without an update-mode setting use polling only. An enabled master switch alone does not subscribe every entity.

Boolean conversion is optional and changes the entity domain from `sensor` to `binary_sensor`. Review dashboard, script and automation references before removing the old disabled entries. No PLC values are written by discovery or reclassification.

## Credits

Thanks to @afab8212 for the subscription, discovery, orphan-cleanup and Boolean reclassification contributions, and for addressing the review feedback.

**Full changelog:** https://github.com/xtimmy86x/ha-OPCUA/compare/2.1.0...2.2.0
