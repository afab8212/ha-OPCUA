# 🏠 ha-OPCUA — OPC UA Connect for Home Assistant

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![HACS Custom](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://hacs.xyz)

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="custom_components/ha_opcua/brand/dark_logo.png">
  <img src="custom_components/ha_opcua/brand/logo.png" alt="ha-OPCUA" width="600">
</picture>

## 🔌 Overview

**OPC UA Connect** (project **ha-OPCUA**) is a custom [Home Assistant](https://www.home-assistant.io) integration that enables automatic discovery of OPC UA variable nodes from an OPC UA server (e.g., Siemens, B&R, etc.) and exposes them as configurable `sensor`, `binary_sensor`, `switch`, `number`, `text` or `datetime` entities in Home Assistant.

This integration uses the `asyncua` library for **local polling**, with optional **OPC UA data-change subscriptions selected per entity**. Polling remains enabled in both update modes; subscriptions provide additional updates when the server reports a value change.

---

## ✨ Features

- 📡 Connects to any OPC UA compatible server (e.g., Siemens, B&R, etc.)
- 🔍 Auto-discovers variables (nodes) under a defined root node
- 🧠 Automatic mapping with per-node entity selection and exclusion
- ✏️ Native numeric and text controls with configurable limits
- 🔄 Periodic polling with configurable scan interval
- ⚡ Optional subscriptions per entity, numeric deadband and a master Auto-Subscription switch; polling only by default
- ⏯️ Persistent connection switch and live connectivity diagnostics per hub
- 🧪 Graceful reconnection logic on connection loss
- 📥 Set opc-ua nodes values via Home Assistant services (`ha_opcua.opcua_set_value`)
- 🤝 Supports multiple simultaneous OPC-UA clients

---

## Warning
- This integration is only compatible with nodes of those types (int, float, string, bool, byte), others will get ignored and won't appear in home assistant entities!
- Entity identity uses the config entry ID and the OPC UA NodeId. Variables may share a name; renaming a variable without changing its NodeId preserves its identity. Changing a NodeId creates a new entity. Namespace index changes are not automatically migrated.
- When a node gets removed from the opc-ua server, its associated entity will display "this entity is no longer being provided by the integration" once the hub/integration is reloaded, this is normal, you need to manually delete it from home assistant.
- When a node gets added on the opc-ua server, the entity will automatically get added to home assistant once the hub/integration is reloaded.
- More you have exposed opc-ua nodes, more it will take time to load the integration
---

## 📦 Installation

### Option 1: HACS (Recommended for Users)
[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?repository=ha-OPCUA&owner=xtimmy86x&category=integration)

1. Go to **HACS > Integrations > Custom repositories**
2. Add this repository: [xtimmy86x/ha-OPCUA](https://github.com/xtimmy86x/ha-OPCUA)
3. Select category: **Integration**
4. Click **Add**
5. Install the **OPC UA Connect** integration
6. Restart Home Assistant

### Option 2: Manual

1. Download the source code for the desired version from [Releases](https://github.com/xtimmy86x/ha-OPCUA/releases), or use **Code → Download ZIP** on the [repository page](https://github.com/xtimmy86x/ha-OPCUA).
2. Extract the archive and copy `custom_components/ha_opcua` into `/config/custom_components/`.
3. Restart Home Assistant

---

### Integration directory and domain (2.0.0)

The project is maintained independently at [xtimmy86x/ha-OPCUA](https://github.com/xtimmy86x/ha-OPCUA). Use this URL when adding the custom repository in HACS.

Starting with 2.0.0, the integration directory and Home Assistant domain are **`ha_opcua`**. The repository name remains **ha-OPCUA**, and the integration appears as **OPC UA Connect** in Home Assistant and HACS. Install it at `/config/custom_components/ha_opcua`; do not use a hyphen in the directory name.

This is a fresh-install domain change with no automatic migration from the previous domain. If an older version was installed, remove its integration entries and old custom-component directory before installing this version, then configure the endpoints again. Existing entity references and automations may need updating. Direct service calls now use `ha_opcua.opcua_set_value`.

### Integration icons

On Home Assistant **2026.3 or newer**, ha-OPCUA includes local brand icons in `custom_components/ha_opcua/brand/`, with a new PLC/home/network symbol and matching **ha-OPCUA** wordmark. Both icon and logo have transparent backgrounds and dedicated light/dark variants. High-resolution images are bundled for both standard and `@2x` requests. No separate brands installation is needed. After updating, restart Home Assistant and reload the browser to refresh the images. Older Home Assistant versions do not load these bundled images.

See [Home Assistant's brand image documentation](https://developers.home-assistant.io/docs/core/integration/brand_images/).

## ⚙️ Configuration

### Setup via Home Assistant UI

1. Go to **Settings > Devices & Services > Add Integration**
2. Search for **OPC UA Connect**
3. Enter the required connection info:
- **Server URL** (e.g., `opc.tcp://192.168.0.10:4840`)
- **Username** (optional)
- **Password** (optional)
- **Root Node ID** (e.g., `ns=2;i=85`)
- **Scan Interval** in seconds
- **Auto-Subscription** (optional, disabled by default)

By default, updates use polling only. Subscriptions require both an explicit per-entity selection and the endpoint’s **Auto-Subscription** switch to be on. See [Polling and subscriptions](#polling-and-subscriptions) for setup, filtering and upgrade behavior.

---

## OPC UA side panel

The entity editor groups settings into Identity, OPC UA node, Value and display, and Updates and availability. It uses two columns on desktop and one on mobile, with Save/Cancel always visible. Open the unit selector to search standard Home Assistant units; None and Custom remain available. Keyboard users can use the arrow keys and Enter to select, or Escape to close the selector without discarding the entity draft.

After updating and restarting Home Assistant, administrators will see **OPC UA Connect** in the sidebar. Select an endpoint, search by name/NodeId, and browse entities grouped into sensors, binary sensors, switches, numbers, text and date/time entities. Connection details, endpoint actions and Auto-Subscription are grouped in one control card. Categories can be filtered or collapsed, and the grid/list preference is retained in the browser. Cards highlight the live value inside a softly tinted, bordered block, using colors appropriate to the data type and current state. They use compact layouts with type-specific icons and labels: large numeric values, lighter text/date formatting, and distinct Boolean on/off indicators. Active alarm-class binary sensors use an alert indicator; unknown, unavailable and empty values have separate neutral indicators. Retained offline values are marked **Last known value**. Compact badges summarize saved customizations: inversion, binary device class, decimal places, always-available mode, configured subscription with non-default deadband, custom number/text limits and reassigned NodeIds. Default settings are omitted; subscription badges describe the configured preference, not an active server subscription. Names and areas remain visible in the card heading/footer. Orphan cards omit these badges because their saved settings may belong to a replacement entity. Colors supplement the state text and icons; on desktop, the compact list aligns names, values and actions in separate columns. Long text and NodeIds wrap without horizontal overflow, and narrow screens stack the content. The panel follows the Home Assistant light/dark theme and supports mobile screens; English and Italian labels are included.

Each entity card shows its live Home Assistant state, including localized binary device-class labels, numeric units, text and date/time formatting. Values update as Home Assistant receives state changes without refreshing the panel or interrupting open dialogs. Unknown, unavailable, unregistered and excluded entities are clearly distinguished. This uses Home Assistant's existing state stream and adds no PLC polling. Values update after reads at the endpoint's configured polling interval and, for opted-in entities while Auto-Subscription is enabled, after server data-change notifications. Boolean inversion is already reflected in the displayed entity state.

Click **Edit** on an entity to configure:

- **Update mode** (**Modalità aggiornamento**): **Polling only** (**Solo polling**, default) or **Polling + subscription**, for both discovered and manually added entities. See [Polling and subscriptions](#polling-and-subscriptions).
- **Category**: automatic, sensor, binary sensor, switch, number, text, datetime or excluded, according to node type and write permissions. Excluded discovered nodes can be enabled here even if they have no registry entity yet.
- **Always available**: keep the last known state if the connection is lost or disabled. Applies independently to any node entity; disabled/excluded entities stay excluded. `value_stale: true` indicates a retained or unknown value, and becomes false after a fresh read. Verified node metadata lets opted-in entities start offline; Home Assistant restores their last saved raw value on reload/restart when available. With no saved value the state is unknown, never a fabricated zero/off value. Writes require a connection and a fresh node reading; commands are not queued offline. Inversion and rounding are applied to the retained raw value. Default is off.
- **Decimal places** for REAL/LREAL (OPC UA Float/Double) nodes: choose 0–10, or leave empty to disable rounding. Available for sensors and numbers, including manually added nodes. This rounds the Home Assistant state used by history and automations; the raw coordinator value and PLC writes are unchanged. For example, `12.345678` becomes `12.35` with 2 decimals. This does not force trailing zeros or change the number step. Existing nodes keep their original precision until configured.
- **Unit of measurement** for analog sensors and numbers: pick one of Home Assistant's standard units from the searchable list, **None**, or **Custom…** to type an application-specific one (e.g. `pieces/min`, `cycles`). This only labels the PLC value's native unit for display; it never scales, converts or validates the raw value against the chosen unit.
- **Number limits**: minimum, maximum and step, including decimals for Float/Double.
- **Text limits**: minimum and maximum length (0–255 characters). Set the maximum to the actual PLC string capacity.
- **Name**: stored in Home Assistant's entity registry; leave empty to restore the original name.
- **Area**: choose a Home Assistant area, or inherit the device area. Explicit entity areas remain independent of device areas.
- **Associated NodeId**: choose a compatible node from those discovered on the selected endpoint. The entity's unique ID and entity ID remain unchanged, preserving automation/dashboard references. Other entities using the same target are retained; shared targets are read once per poll. The direct `opcua_set_value` service continues to use physical NodeIds.
- **Device class** for binary sensors, including None.
- **Invert boolean state** for Boolean nodes. For switches this also inverts commands: with inversion enabled, turning the HA switch on writes `false` to the PLC. Nonboolean values are not inverted.

Saving updates the native entity registry and integration options. NodeId, category, update-mode, deadband, limits, inversion and device-class changes reload the endpoint; wait for it to finish and use Refresh if needed. Cancel leaves the saved configuration unchanged. Stale forms are rejected if another editor has changed the endpoint; cancel, refresh and reopen the entity. Panel APIs require administrator access and do not perform PLC writes.

To add a node that discovery did not find, select the endpoint and click **Add entity** (**Aggiungi entità**):

1. Enter its complete NodeId, such as `ns=4;i=2` or `ns=4;s="DB"."Variable"`, and click **Verify node**. The connection must be enabled and the node reachable.
2. Choose the entity category and configure name, area, update mode, binary device class and Boolean inversion as applicable. Keep **Polling only** for the default behavior, or select **Polling + subscription**; numeric nodes then show the deadband setting. Only compatible categories are offered: sensor for supported scalar values, binary sensor for Booleans, and switch/number/text/datetime when the server grants write access.
3. Save. The endpoint reloads and the new entity appears on the same Home Assistant device. Creating or verifying an entity never writes a value to the PLC.

Manual nodes are persisted independently of discovery and verified again on reload. They can be outside the configured discovery root, including when that root is inaccessible. Temporarily unreadable manual nodes are retried during normal polling; disabling the connection stops these attempts too. A node later found by discovery does not create a duplicate. Invalid IDs, objects, arrays, unreadable nodes and duplicate entities are rejected. A manual node remains subject to the PLC's authentication and access permissions.

Category and number/text limits are editable directly in the panel for existing and new manual entities. New number entities default to min 0, max 100 and step 1 for integers or 0.1 for floats; text defaults to 0–255 characters. Connection settings remain in integration options. The older node options flow remains available for compatibility. Discovery still runs at setup/reload. The connection switch, Auto-Subscription switch and connectivity sensor remain standard HA entities. The panel also mirrors Auto-Subscription next to **Rediscover** for the selected endpoint.

### Discovery defaults and selective Boolean conversion

Use **Rediscover** to refresh the endpoint's discovered nodes. For a freshly configured endpoint, the first discovery applies smart defaults: read-only Boolean nodes become `binary_sensor`, writable numeric nodes become `number`, writable String nodes become `text`, and Float/Double nodes start with two decimal places. These defaults also apply to newly discovered nodes with no saved settings after a discovery baseline exists. Existing nodes and saved settings are not retroactively reassigned when upgrading.

For older Boolean sensors, click **Reclassify as binary_sensor** (**Riclassifica come binary_sensor**) to choose which eligible nodes to convert. The dialog lists names, NodeIds and current states, starts with nothing selected, and offers **Select all**. **Convert selected (N)** changes only the selected read-only Boolean nodes still configured as Auto. Explicit category choices, including `sensor`, are excluded. Custom names and areas are preserved; old sensor entries are disabled and remain available for orphan cleanup. The conversion changes entity domains, so review automation and dashboard references. It does not write values to the PLC.

Changing an entity domain (for example sensor → number) creates or restores an entity in that domain, retaining its logical NodeId identity, name and area. Its entity ID may change, so update automation and dashboard references. The previous domain’s registry entry is retained but disabled by the integration; returning to that category restores its previous entity ID. Explicit user-disabled entries remain disabled. Editing limits without changing domains preserves the entity ID. Choosing Excluded disables the entity and periodic reads while retaining number/text limits; select a compatible category to enable it again.

**Remove a manual node:** click **Remove** on its card and confirm. This works even when the PLC is disconnected, the connection is disabled, or the endpoint is not loaded. Removal deletes its manual-node metadata and Home Assistant registry entities, including old domains left by category changes. The PLC node and its value are untouched. Automations referencing removed entities must be updated. If another entity is mapped to this node, reassign it first (including excluded entities); the panel prevents removing a shared target.

A disabled mapping is retained to prevent discovery from recreating the removed entity. If discovery later lists that node, it appears under **Excluded** and is not polled periodically; you can explicitly re-enable it with Edit in the panel. Nodes outside discovery can be added manually again. Automatically discovered nodes use the existing exclusion option instead of this removal action.

**Date and time (`datetime`)** is available for writable scalar OPC UA `DateTime` nodes, including manually entered nodes. Automatic mapping creates a datetime entity for writable DateTime nodes and a timestamp sensor for read-only nodes; you can also explicitly select sensor for read-only display of a writable node. Use Home Assistant's native entity control or `datetime.set_value` to change its value. The configuration panel configures the entity; it does not set the PLC value.

OPC UA values are normalized to UTC, and Home Assistant displays them in the frontend's configured timezone. Home Assistant's `datetime.set_value` service treats a timezone-free input as local HA time; for unambiguous automation commands (especially during daylight-saving transitions), include the UTC offset. The direct `ha_opcua.opcua_set_value` service requires an ISO 8601 timestamp with an explicit offset or `Z`, for example `2026-09-14T18:30:00+02:00`. Bare dates, timezone-free direct writes and dates before 1601-01-01 UTC are rejected. Strings and integer timestamps are not automatically interpreted as OPC UA DateTime nodes.

The panel header displays both the installed integration version (from the backend manifest) and the independent panel version (from the JavaScript actually loaded by the browser). Maintainers should increment `PANEL_VERSION` in `www/panel.js` for each frontend change.

In the entity editor, **Cancel** and **Save** stay at the bottom of the dialog while the fields scroll independently, including on mobile. Save errors appear above these buttons.

Panel JavaScript is bundled with the integration and uses a URL containing the integration version and a hash of the JavaScript content to invalidate the browser cache after panel-only updates; no separate Lovelace resource or frontend build is required.

### Array-of-struct field naming and grouping

Some PLCs (for example WAGO/CODESYS symbolic addressing) expose an array of structs as one discovered node per element field, such as `...Allarmi[1].Attivo`, `...Allarmi[2].Attivo`, and so on. Detection relies entirely on a symbolic NodeId matching this dotted `name[index].field` pattern; a numeric NodeId (e.g. `ns=4;i=123`) carries no such information and is never affected. This organizes fields that are already individually exposed as their own scalar nodes - it does not add support for reading or writing an OPC UA array value as a whole.

On first discovery, a brand-new field inside such an array element gets its display name disambiguated with the array index (e.g. "Allarmi 1 · Attivo") instead of the raw, colliding field name every other element shares. Like the other smart defaults above, this only applies once, at a node's first discovery, and is never retroactively applied to an already-known node.

For nodes discovered before this disambiguation existed, click **Rename array fields (N)** to choose which eligible entities to rename. The dialog lists names, NodeIds and the proposed new name, starts with nothing selected, and offers **Select all**. Only the selected entities' display names change; their entity IDs, NodeId mappings and any name already customized manually are left untouched.

The panel groups these fields by array element only when explicitly selected: use the **By category / By array element** toggle next to the grid/list view switch (shown only when the endpoint has such fields) to switch from the default category grouping to grouping by array element instead. Either way, choosing a specific category tab or typing a search query always shows the matching entities as a flat list.

## Polling and subscriptions

### Enable subscriptions for selected entities

1. Open **OPC UA Connect** in the Home Assistant sidebar and select the endpoint.
2. Click **Edit** (**Modifica**) on an entity. Under **Update mode** (**Modalità aggiornamento**), select **Polling + subscription**. This is also available when adding a manual node.
3. For numeric sensors or numbers, optionally adjust **Deadband**. Save and allow the endpoint to reload. Repeat for the other entities that should receive notifications.
4. Turn on **Endpoint Auto-Subscription** (**Auto-Subscription endpoint**) next to **Rediscover** at the top of the panel. It controls the same switch entity available on the device page and in automations. Connection options remain another way to set it. You can save the choice with the PLC offline or the connection disabled; notifications start when the connection is enabled and the PLC is reachable.

The two update modes apply independently to each entity:

| Entity update mode | Auto-Subscription switch | Updates while connected |
| --- | --- | --- |
| Polling only / Solo polling (default) | Off or on | Reads at the configured scan interval |
| Polling + subscription | Off | Reads at the configured scan interval; the entity’s selection is retained |
| Polling + subscription | On | Periodic reads plus OPC UA data-change notifications |

The panel control follows the switch entity’s live state, including changes from automations or the device page. Switching endpoints shows the selected endpoint’s own setting. While a request is pending, the control is temporarily disabled; failures leave the actual switch state visible and show an error. If the integration or switch entity is disabled, missing or unavailable, the panel control is unavailable too. The toggle does not change any per-entity update-mode selection.

The **Auto-Subscription** switch is a master enable for that endpoint, not a command to subscribe to every node. It takes effect without reloading the endpoint. With no active entity selected for subscriptions, no subscription is opened, even if the switch is on. Excluded entities are neither polled nor subscribed.

Turning Auto-Subscription off stops notifications while polling continues, preserving all entity choices. Turning it back on subscribes the selected nodes again. To stop polling and connection attempts as well, turn off **Connection enabled**. Subscriptions do not bypass this connection control or the entity’s availability policy.

**Polling continues in both modes.** Subscriptions improve update responsiveness; they do not reduce periodic reads. They are notifications supplied by the OPC UA server, so delivery timing depends on the server and connection. If the server rejects subscriptions, the integration logs the failure and continues polling. After reconnection, subscriptions for selected nodes are recreated during the next successful refresh.

### Numeric deadband

The panel shows **Deadband** for numeric sensors and numbers when **Polling + subscription** is selected. It is an absolute change in the raw OPC UA value, not a percentage. The defaults are **0.01** for Float/Double (REAL/LREAL) and **1** for integer types. Use **0** to disable filtering. Values must be finite and nonnegative; integer node types use an integer deadband.

For example, with a deadband of `0.5`, small fluctuations of `0.1` can be suppressed in server notifications. The next poll still reads the current value: **deadband never filters polling reads**. It is separate from **Decimal places**, which rounds the value presented in Home Assistant, and from a number entity’s editable step. Neither deadband nor rounding changes the value stored in the PLC.

Switching an entity back to **Polling only** hides the deadband field and retains its setting for later use. If the server rejects a deadband filter, that node is retried without the filter while polling continues.

When several entities share a NodeId, the integration subscribes to that physical node once. Only entities set to **Polling + subscription** receive its push updates; polling-only entities still update on reads. The shared subscription uses the **smallest deadband among the subscribed entities**. If any of them requests `0`, the shared target is unfiltered. Therefore, an entity sharing a target can receive more notifications than its own larger deadband would otherwise allow.

### Existing configurations and troubleshooting

Saved endpoint Auto-Subscription choices are preserved. An endpoint with no saved choice defaults to **off**. Any entity without an update-mode setting defaults to **Polling only**, including existing configurations and newly discovered or manually added nodes. After upgrading from the earlier global-subscription behavior, select the desired entities explicitly; an already-enabled endpoint switch alone does not opt them in.

If values update only at the scan interval, check that the connection is enabled and connected, the entity is not excluded, its mode is **Polling + subscription**, and the endpoint’s **Auto-Subscription** switch is on. For numeric nodes, check whether deadband is filtering small changes. Check the Home Assistant log for server subscription/filter errors.

The connectivity sensor’s **`subscription_active`** attribute reports whether the integration currently holds a subscription. The Auto-Subscription switch reports the saved request, so it can be on while `subscription_active` is false—for example, when no entity is selected or the PLC is offline. A connected session alone does not prove that subscriptions are active.

## Logging and troubleshooting

The `asyncua` library logs routine reads, browsing and subscription notifications at INFO level. ha-OPCUA defaults that library to **WARNING** to keep normal operation quiet. Warnings and errors remain visible. An explicitly configured library logger level is preserved; no root/Home Assistant logging level is changed.

For troubleshooting, use **Enable debug logging** on the OPC UA Connect integration in Home Assistant. The integration declares `asyncua` as a library logger, so Home Assistant can include its detailed messages as well. Disable debug logging after reproducing the issue.

If you have an existing logging override and still see routine INFO messages, set the library level explicitly in your existing `configuration.yaml` logger section:

```yaml
logger:
  logs:
    asyncua: warning
```

Merge this into any existing `logger:` section and check for more specific `asyncua.*` overrides. The `asyncua` logger is shared by any integrations using that library; its level applies to all of them.

## Home Assistant device page (1.3.0)

Each configured OPC UA server now appears as **one device** under its integration entry, named after the connection. Open the device to see the standard Home Assistant page with node entities, connection controls, diagnostics, activity and related automations. You can assign an area and rename the device using Home Assistant's normal controls. Entities in the entity list are grouped under that device instead of “Ungrouped”. The integration uses the standard entry labels, matching the presentation of Siemens S7.

Upgrading automatically associates existing ungrouped entities with the corresponding device, including unavailable or excluded nodes. Entity IDs, unique IDs, custom names, explicit entity areas and per-node settings are preserved. A device is registered even when the connection is disabled or the PLC is offline. Its identity uses the configuration entry ID, so changing the endpoint does not create a duplicate device.

The **Download diagnostics** action is available from both the integration entry and device. It reports connection state and entity-type counts; credentials, PLC values, node names/identifiers and endpoint/host details are omitted or redacted. Device metadata uses the generic model “OPC UA Server”; manufacturer and CPU model are not inferred from the protocol.

## Connection control and diagnostics (1.2.0)

Each hub provides three connection-related entities:

- **Connection enabled** (`switch`, Configuration): turn it off before shutting down the machine to close the OPC UA session and stop polling, connection attempts and asyncua background session maintenance. The setting survives integration reloads and Home Assistant restarts. Turning it back on immediately attempts a connection; if the PLC is still offline, retries continue at the configured polling interval.
- **Auto-Subscription** (`switch`, Configuration): enables notifications only for entities configured as **Polling + subscription**. Defaults to off when no choice is saved. Turning it off keeps polling active and preserves the per-entity selections. See [Polling and subscriptions](#polling-and-subscriptions).
- **Connection** (`binary_sensor`, Diagnostics, connectivity device class): reports the actual observed session state. It stays available and shows disconnected when communication is disabled or lost. An enabled switch does not imply a successful connection. Transport loss is reported when detected by asyncua or by a failed request; it is not an instantaneous indication of PLC power or CPU RUN/STOP mode.

The binary sensor includes endpoint, host, port, root NodeId, configured polling interval, `subscription_active`, security/authentication mode, negotiated session timeout in milliseconds, discovered/polled node counts, last connection/disconnection and successful read timestamps, and the last connection error **type**. Credentials and URL query/fragment are omitted. Timestamps describe the current integration session and reset on reload/restart.

While the connection is disabled, node entities are unavailable unless **Always available** is enabled for that node. Both entity writes and `opcua_set_value` are rejected without reconnecting. A request already in flight may finish before the session closes; queued requests cannot reopen it. Each switch affects only its own hub. The switch can be controlled by normal Home Assistant automations.

Connection controls are also available when the PLC is offline at startup. Node entities are discovered and added when communication becomes available, without requiring a manual reload. During a disabled/offline restart, previously registered node entities remain unavailable until discovery succeeds, except opted-in **Always available** entities with cached metadata. Existing node mappings and identities are preserved. A connection error clears the current read snapshot; entities following connection availability recover after fresh reads, while **Always available** entities retain their last known value. Individual invalid-node errors do not imply that the server session is disconnected. If there are no active nodes, an enabled hub probes server state to check connectivity; a disabled hub sends no probes.

## Per-node entity configuration (1.1.0)

Open the **OPC UA Connect** sidebar panel, select an endpoint and click **Edit** on a node. Choose its category and update mode and, for `number` or `text`, set its limits in the same form. Numeric entities in subscription mode also offer a deadband setting. Save to reload the endpoint. Both discovered and manual nodes use the same backend validation. Connection settings remain under **Settings → Devices & services → OPC UA Connect → Configure**. English and Italian translations are included.

| Choice | Compatible nodes | Behavior |
| --- | --- | --- |
| Automatic | Supported scalar types | Writable Boolean → switch; writable DateTime → datetime; all others → sensor |
| sensor | Supported scalar types | Read only, even when the node is writable |
| binary_sensor | Boolean | Read only on/off state |
| switch | Writable Boolean | Read and write on/off |
| number | Writable integer, Float or Double | Read and write numbers with minimum, maximum and step |
| text | Writable String | Read and write text with minimum and maximum length |
| datetime | Writable DateTime | Read and write date/time using UTC and the native HA control |
| Excluded | Supported scalar types | No entity or periodic reads after reload |

Choices are keyed by **NodeId**, so nodes with identical names can be configured independently. Write controls are offered only when both AccessLevel and UserAccessLevel permit writes. If a saved choice becomes incompatible after a PLC type or permission change, the entity is skipped and a warning is logged; use the panel to fix the choice. Missing nodes retain their saved choices for when they return. Discovery runs at setup/reload.

Numeric limits must fit the OPC UA type. Integer nodes require integer limits and step; their editable range is restricted to ±9007199254740991 to avoid rounding in the browser. A larger 64-bit value is shown as unknown in a `number` entity. Float values retain the precision of their PLC type. The step controls the interface increment; writes must satisfy the range and PLC type, but need not be a multiple of the step.

Text limits must satisfy `0 ≤ minimum ≤ maximum ≤ 255`. Set the maximum to the capacity configured in your PLC (for example, 80 for STRING[80]); the integration does not discover this capacity. Spaces, brackets and empty strings are preserved. Longer current text values are shown as unknown because Home Assistant entity states are limited to 255 characters. Server restrictions still apply to every write. Successful writes request a fresh read; values are not assumed to have changed before readback.

Changing a node from `sensor` to `number`, for example, creates an entity in the new domain. The previous registry entry is retained and is no longer provided. Update automations/dashboard references before deleting it. Selecting Excluded has the same effect on the previous entity. Selecting Automatic restores the original mapping. Existing mappings are unchanged on upgrade until you choose a different type.

## Orphan entity repairs

Open **Settings → System → Repairs** to review obsolete entities. Changing a node category, for example sensor → number, creates a repair for the old registry entity. The integration also checks on setup and after discovery, including automatic category changes and unconfigured nodes absent after a complete discovery.

Each repair identifies the old entity and its endpoint. Confirming removes only that registry entity, after checking again that it is still obsolete. Update any automation, script or dashboard references first. PLC variables, node settings and the replacement entity are preserved. Cancelling leaves the entity intact. If you restore its previous category or delete it yourself, its repair is cleared.

Disconnection, failed or incomplete discovery, excluded nodes and missing but explicitly configured/manual nodes do not by themselves make an entity orphaned. Name, area, precision and same-category NodeId changes preserve entity identity and do not require cleanup.

## 🛠 Service: `ha_opcua.opcua_set_value`

You can manually set the value of a writable scalar OPC UA node. Supported write types are String, Boolean, signed/unsigned integers, Float, Double and DateTime. Array and other types are rejected. String contents, including whitespace and brackets, are preserved exactly. Invalid booleans, out-of-range integers and non-finite floats are rejected before writing. Server-side permissions and string length limits still apply.

Writes are sent once and are never automatically replayed after a connection error or timeout. A missing acknowledgement does not prove that a write failed: read the PLC value before deciding whether to send a new command. Successful writes request a state refresh. After a connection failure, the next poll or user operation attempts to reconnect.

### Example:

```yaml
action: ha_opcua.opcua_set_value
data:
   hub: "My OPC UA Server"
   node_id: "ns=2;s=Pump1/Enable"
   value: true
```

## Upgrading to 1.0.3

Existing entities with unique names are migrated to NodeId-based identifiers while preserving their Home Assistant entity IDs and customizations. If an old name identifies multiple discovered nodes, the integration cannot determine which node the old entity represented. It leaves that legacy entity untouched, logs a warning and creates separate entities for the discovered nodes. Review dashboard/automation references before removing an obsolete entity. If discovery is incomplete because nodes could not be read, legacy migration is deferred; resolve the read errors and reload before removing or remapping legacy entities.

The `asyncua` dependency is updated to 2.0.1: version 1.0.2 fails during connection on Python 3.14. Version 1.1.0 additionally provides native `number`, `text` and `binary_sensor` platforms.

## Development checks

```sh
python -m pip install -r requirements.txt -r requirements-test.txt
python -m pytest
ruff check custom_components/ tests/
black --check custom_components/ tests/
npm ci
npx playwright install chromium
npm run test:panel
```

Tests cover scalar conversion, a local OPC UA server, duplicate names, connection failures, cancellation, entity migration and Home Assistant service lifecycle. These tests do not replace validation on a physical PLC.

## 🧪 Requirements

- Home Assistant 2025.1 or newer
- Python 3.13+
- asyncua==2.0.1 (automatically installed)

## 🏷 Supported Platforms

- sensor –> for readable numeric/text variables and read-only booleans
- binary_sensor –> optional read-only Boolean state
- switch –> for boolean variables writable by the connected user
- number –> optional editable numeric variables
- text –> optional editable String variables
- datetime –> editable DateTime variables (read-only DateTime nodes use timestamp sensors)

## 📁 File Structure

```
custom_components/
└── ha_opcua/
    ├── __init__.py
    ├── manifest.json
    ├── sensor.py
    ├── switch.py
    ├── config_flow.py
    └── ... (more coming)
```

## 📌 Integration Type & Quality

- Integration Type: hub
- Quality Scale: bronze
- IoT Class: local_polling

## 🧑‍💻 Maintainer and credits

- Maintainer: [@xtimmy86x](https://github.com/xtimmy86x)
- Original project: [Home-Assistant-Opcua-Discovery by @guanaco0403](https://github.com/guanaco0403/Home-Assistant-Opcua-Discovery). The original MIT copyright notice is retained in [LICENSE](LICENSE).

## 🪪 License

This project is licensed under the MIT License.

## 📢 Contribute

Report bugs or request features in [Issues](https://github.com/xtimmy86x/ha-OPCUA/issues), or contribute through [Pull requests](https://github.com/xtimmy86x/ha-OPCUA/pulls). Pull requests are welcome! If you want to improve auto-discovery, error handling, or add support for more OPC UA types — contributions are appreciated.
