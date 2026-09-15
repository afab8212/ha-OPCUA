# 🏠 Home Assistant OPC-UA Discovery Integration

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![HACS Custom](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://hacs.xyz)

<img src="https://github.com/guanaco0403/Home-Assistant-Opcua-Discovery/blob/main/repo_logo.png" width="600" />

## 🔌 Overview

**Home-Assistant-Opcua-Discovery** is a custom [Home Assistant](https://www.home-assistant.io) integration that enables automatic discovery of OPC UA variable nodes from an OPC UA server (e.g., Siemens, B&R, etc.) and exposes them as configurable `sensor`, `binary_sensor`, `switch`, `number`, `text` or `datetime` entities in Home Assistant.

This integration supports **local polling** using the `asyncua` library and is ideal for industrial or automation environments where OPC UA is the communication protocol standard.

---

## ✨ Features

- 📡 Connects to any OPC UA compatible server (e.g., Siemens, B&R, etc.)
- 🔍 Auto-discovers variables (nodes) under a defined root node
- 🧠 Automatic mapping with per-node entity selection and exclusion
- ✏️ Native numeric and text controls with configurable limits
- 🔄 Periodic polling with configurable scan interval
- ⏯️ Persistent connection switch and live connectivity diagnostics per hub
- 🧪 Graceful reconnection logic on connection loss
- 📥 Set opc-ua nodes values via Home Assistant services (`ha_opcua_discovery.opcua_set_value`)
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
[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?repository=Home-Assistant-Opcua-Discovery&owner=guanaco0403&category=integration)

1. Go to **HACS > Integrations > Custom repositories**
2. Add this repo URL: https://github.com/guanaco0403/Home-Assistant-Opcua-Discovery
3. Select category: **Integration**
4. Click **Add**
5. Install the `Home Assistant OPC-UA Discovery` integration
6. Restart Home Assistant

### Option 2: Manual

1. Download the latest release `ha_opcua_discovery.zip`
2. Extract and copy the `ha_opcua_discovery` folder into: /config/custom_components/
3. Restart Home Assistant

---

## ⚙️ Configuration

### Setup via Home Assistant UI

1. Go to **Settings > Devices & Services > Add Integration**
2. Search for **OPC-UA Discovery**
3. Enter the required connection info:
- **Server URL** (e.g., `opc.tcp://192.168.0.10:4840`)
- **Username** (optional)
- **Password** (optional)
- **Root Node ID** (e.g., `ns=2;i=85`)
- **Scan Interval** in seconds

---

## OPC UA side panel (1.5.2)

After updating and restarting Home Assistant, administrators will see **OPC UA** in the sidebar. Select an endpoint, search by name/NodeId, and browse entities grouped into sensors, binary sensors, switches, numbers, text and date/time entities. Categories can be filtered or collapsed. The panel follows the Home Assistant light/dark theme and supports mobile screens; English and Italian labels are included.

Each entity card shows its live Home Assistant state, including localized binary device-class labels, numeric units, text and date/time formatting. Values update as Home Assistant receives state changes without refreshing the panel or interrupting open dialogs. Unknown, unavailable, unregistered and excluded entities are clearly distinguished. This uses Home Assistant's existing state stream and adds no PLC polling: freshness follows the endpoint's configured polling interval. Boolean inversion is already reflected in the displayed entity state.

Click **Edit** on an entity to configure:

- **Category**: automatic, sensor, binary sensor, switch, number, text, datetime or excluded, according to node type and write permissions. Excluded discovered nodes can be enabled here even if they have no registry entity yet.
- **Number limits**: minimum, maximum and step, including decimals for Float/Double.
- **Text limits**: minimum and maximum length (0–255 characters). Set the maximum to the actual PLC string capacity.
- **Name**: stored in Home Assistant's entity registry; leave empty to restore the original name.
- **Area**: choose a Home Assistant area, or inherit the device area. Explicit entity areas remain independent of device areas.
- **Associated NodeId**: choose a compatible node from those discovered on the selected endpoint. The entity's unique ID and entity ID remain unchanged, preserving automation/dashboard references. Other entities using the same target are retained; shared targets are read once per poll. The direct `opcua_set_value` service continues to use physical NodeIds.
- **Device class** for binary sensors, including None.
- **Invert boolean state** for Boolean nodes. For switches this also inverts commands: with inversion enabled, turning the HA switch on writes `false` to the PLC. Nonboolean values are not inverted.

Saving updates the native entity registry and integration options. NodeId, category, limits, inversion and device-class changes reload the endpoint; wait for it to finish and use Refresh if needed. Cancel leaves the saved configuration unchanged. Stale forms are rejected if another editor has changed the endpoint; cancel, refresh and reopen the entity. Panel APIs require administrator access and do not perform PLC writes.

To add a node that discovery did not find, select the endpoint and click **Add entity** (**Aggiungi entità**):

1. Enter its complete NodeId, such as `ns=4;i=2` or `ns=4;s="DB"."Variable"`, and click **Verify node**. The connection must be enabled and the node reachable.
2. Choose the entity category and configure name, area, binary device class and Boolean inversion as applicable. Only compatible categories are offered: sensor for supported scalar values, binary sensor for Booleans, and switch/number/text/datetime when the server grants write access.
3. Save. The endpoint reloads and the new entity appears on the same Home Assistant device. Creating or verifying an entity never writes a value to the PLC.

Manual nodes are persisted independently of discovery and verified again on reload. They can be outside the configured discovery root, including when that root is inaccessible. Temporarily unreadable manual nodes are retried during normal polling; disabling the connection stops these attempts too. A node later found by discovery does not create a duplicate. Invalid IDs, objects, arrays, unreadable nodes and duplicate entities are rejected. A manual node remains subject to the PLC's authentication and access permissions.

Category and number/text limits are editable directly in the panel for existing and new manual entities. New number entities default to min 0, max 100 and step 1 for integers or 0.1 for floats; text defaults to 0–255 characters. Connection settings remain in integration options. The older node options flow remains available for compatibility. Discovery still runs at setup/reload. The connection switch and connectivity sensor remain standard HA entities outside the node editor.

Changing an entity domain (for example sensor → number) creates or restores an entity in that domain, retaining its logical NodeId identity, name and area. Its entity ID may change, so update automation and dashboard references. The previous domain’s registry entry is retained but disabled by the integration; returning to that category restores its previous entity ID. Explicit user-disabled entries remain disabled. Editing limits without changing domains preserves the entity ID. Choosing Excluded disables the entity and periodic reads while retaining number/text limits; select a compatible category to enable it again.

**Remove a manual node:** click **Remove** on its card and confirm. This works even when the PLC is disconnected, the connection is disabled, or the endpoint is not loaded. Removal deletes its manual-node metadata and Home Assistant registry entities, including old domains left by category changes. The PLC node and its value are untouched. Automations referencing removed entities must be updated. If another entity is mapped to this node, reassign it first (including excluded entities); the panel prevents removing a shared target.

A disabled mapping is retained to prevent discovery from recreating the removed entity. If discovery later lists that node, it appears under **Excluded** and is not polled periodically; you can explicitly re-enable it with Edit in the panel. Nodes outside discovery can be added manually again. Automatically discovered nodes use the existing exclusion option instead of this removal action.

**Date and time (`datetime`)** is available for writable scalar OPC UA `DateTime` nodes, including manually entered nodes. Automatic mapping creates a datetime entity for writable DateTime nodes and a timestamp sensor for read-only nodes; you can also explicitly select sensor for read-only display of a writable node. Use Home Assistant's native entity control or `datetime.set_value` to change its value. The configuration panel configures the entity; it does not set the PLC value.

OPC UA values are normalized to UTC, and Home Assistant displays them in the frontend's configured timezone. Home Assistant's `datetime.set_value` service treats a timezone-free input as local HA time; for unambiguous automation commands (especially during daylight-saving transitions), include the UTC offset. The direct `ha_opcua_discovery.opcua_set_value` service requires an ISO 8601 timestamp with an explicit offset or `Z`, for example `2026-09-14T18:30:00+02:00`. Bare dates, timezone-free direct writes and dates before 1601-01-01 UTC are rejected. Strings and integer timestamps are not automatically interpreted as OPC UA DateTime nodes.

The panel header displays the installed integration version, read from the backend manifest.

Panel JavaScript is bundled with the integration and uses a versioned URL; no separate Lovelace resource or frontend build is required.

## Home Assistant device page (1.3.0)

Each configured OPC UA server now appears as **one device** under its integration entry, named after the connection. Open the device to see the standard Home Assistant page with node entities, connection controls, diagnostics, activity and related automations. You can assign an area and rename the device using Home Assistant's normal controls. Entities in the entity list are grouped under that device instead of “Ungrouped”. The integration uses the standard entry labels, matching the presentation of Siemens S7.

Upgrading automatically associates existing ungrouped entities with the corresponding device, including unavailable or excluded nodes. Entity IDs, unique IDs, custom names, explicit entity areas and per-node settings are preserved. A device is registered even when the connection is disabled or the PLC is offline. Its identity uses the configuration entry ID, so changing the endpoint does not create a duplicate device.

The **Download diagnostics** action is available from both the integration entry and device. It reports connection state and entity-type counts; credentials, PLC values, node names/identifiers and endpoint/host details are omitted or redacted. Device metadata uses the generic model “OPC UA Server”; manufacturer and CPU model are not inferred from the protocol.

## Connection control and diagnostics (1.2.0)

Each hub now provides two additional entities:

- **Connection enabled** (`switch`, Configuration): turn it off before shutting down the machine to close the OPC UA session and stop polling, connection attempts and asyncua background session maintenance. The setting survives integration reloads and Home Assistant restarts. Turning it back on immediately attempts a connection; if the PLC is still offline, retries continue at the configured polling interval.
- **Connection** (`binary_sensor`, Diagnostics, connectivity device class): reports the actual observed session state. It stays available and shows disconnected when communication is disabled or lost. An enabled switch does not imply a successful connection. Transport loss is reported when detected by asyncua or by a failed request; it is not an instantaneous indication of PLC power or CPU RUN/STOP mode.

The binary sensor includes endpoint, host, port, root NodeId, configured polling interval, security/authentication mode, negotiated session timeout in milliseconds, discovered/polled node counts, last connection/disconnection and successful read timestamps, and the last connection error **type**. Credentials and URL query/fragment are omitted. Timestamps describe the current integration session and reset on reload/restart.

While disabled, node entities are unavailable and both entity writes and `opcua_set_value` are rejected without reconnecting. A request already in flight may finish before the session closes; queued requests cannot reopen it. Each switch affects only its own hub. The switch can be controlled by normal Home Assistant automations.

Connection controls are also available when the PLC is offline at startup. Node entities are discovered and added when communication becomes available, without requiring a manual reload. During a disabled/offline restart, previously registered node entities remain unavailable until discovery succeeds. Existing node mappings and identities are preserved. A connection error clears stale values; node entities become available again after fresh reads. Individual invalid-node errors do not imply that the server session is disconnected. If there are no active nodes, an enabled hub probes server state to check connectivity; a disabled hub sends no probes.

## Per-node entity configuration (1.1.0)

Open the **OPC UA** sidebar panel, select an endpoint and click **Edit** on a node. Choose its category and, for `number` or `text`, set its limits in the same form. Save to reload the endpoint. Both discovered and manual nodes use the same backend validation. Connection settings remain under **Settings → Devices & services → OPC-UA Discovery → Configure**. English and Italian translations are included.

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

## 🛠 Service: `ha_opcua_discovery.opcua_set_value`

You can manually set the value of a writable scalar OPC UA node. Supported write types are String, Boolean, signed/unsigned integers, Float, Double and DateTime. Array and other types are rejected. String contents, including whitespace and brackets, are preserved exactly. Invalid booleans, out-of-range integers and non-finite floats are rejected before writing. Server-side permissions and string length limits still apply.

Writes are sent once and are never automatically replayed after a connection error or timeout. A missing acknowledgement does not prove that a write failed: read the PLC value before deciding whether to send a new command. Successful writes request a state refresh. After a connection failure, the next poll or user operation attempts to reconnect.

### Example:

```yaml
action: ha_opcua_discovery.opcua_set_value
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
└── ha_opcua_discovery/
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

## 🧑‍💻 Code Owner

- @guanaco0403

## 🪪 License

This project is licensed under the MIT License.

## 📢 Contribute

Pull requests are welcome! If you want to improve auto-discovery, error handling, or add support for more OPC UA types — contributions are appreciated.
