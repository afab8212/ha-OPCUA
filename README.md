# 🏠 Home Assistant OPC-UA Discovery Integration

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![HACS Custom](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://hacs.xyz)

<img src="https://github.com/guanaco0403/Home-Assistant-Opcua-Discovery/blob/main/repo_logo.png" width="600" />

## 🔌 Overview

**Home-Assistant-Opcua-Discovery** is a custom [Home Assistant](https://www.home-assistant.io) integration that enables automatic discovery of OPC UA variable nodes from an OPC UA server (e.g., Siemens, B&R, etc.) and exposes them as configurable `sensor`, `binary_sensor`, `switch`, `number` or `text` entities in Home Assistant.

This integration supports **local polling** using the `asyncua` library and is ideal for industrial or automation environments where OPC UA is the communication protocol standard.

---

## ✨ Features

- 📡 Connects to any OPC UA compatible server (e.g., Siemens, B&R, etc.)
- 🔍 Auto-discovers variables (nodes) under a defined root node
- 🧠 Automatic mapping with per-node entity selection and exclusion
- ✏️ Native numeric and text controls with configurable limits
- 🔄 Periodic polling with configurable scan interval
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

## Per-node entity configuration (1.1.0)

Open **Settings → Devices & services → OPC-UA Discovery → Configure → Configure a node**. Search by name or full NodeId, choose the entity type, and save. For `number` and `text`, a second screen lets you configure editing limits. The integration reloads after the options are saved. Repeat for other nodes. Connection settings have a separate menu and preserve all node choices. English and Italian translations are included.

| Choice | Compatible nodes | Behavior |
| --- | --- | --- |
| Automatic | Supported scalar types | Preserves existing behavior: writable Boolean → switch; all others → sensor |
| sensor | Supported scalar types | Read only, even when the node is writable |
| binary_sensor | Boolean | Read only on/off state |
| switch | Writable Boolean | Read and write on/off |
| number | Writable integer, Float or Double | Read and write numbers with minimum, maximum and step |
| text | Writable String | Read and write text with minimum and maximum length |
| Excluded | Supported scalar types | No entity or periodic reads after reload |

Choices are keyed by **NodeId**, so nodes with identical names can be configured independently. Write controls are offered only when both AccessLevel and UserAccessLevel permit writes. If a saved choice becomes incompatible after a PLC type or permission change, the entity is skipped and a warning is logged; use the options to fix the choice. Missing nodes retain their saved choices for when they return. Discovery runs at setup/reload.

Numeric limits must fit the OPC UA type. Integer nodes require integer limits and step; their editable range is restricted to ±9007199254740991 to avoid rounding in the browser. A larger 64-bit value is shown as unknown in a `number` entity. Float values retain the precision of their PLC type. The step controls the interface increment; writes must satisfy the range and PLC type, but need not be a multiple of the step.

Text limits must satisfy `0 ≤ minimum ≤ maximum ≤ 255`. Set the maximum to the capacity configured in your PLC (for example, 80 for STRING[80]); the integration does not discover this capacity. Spaces, brackets and empty strings are preserved. Longer current text values are shown as unknown because Home Assistant entity states are limited to 255 characters. Server restrictions still apply to every write. Successful writes request a fresh read; values are not assumed to have changed before readback.

Changing a node from `sensor` to `number`, for example, creates an entity in the new domain. The previous registry entry is retained and is no longer provided. Update automations/dashboard references before deleting it. Selecting Excluded has the same effect on the previous entity. Selecting Automatic restores the original mapping. Existing mappings are unchanged on upgrade until you choose a different type.

## 🛠 Service: `ha_opcua_discovery.opcua_set_value`

You can manually set the value of a writable scalar OPC UA node. Supported write types are String, Boolean, signed/unsigned integers, Float and Double. Array and other types are rejected. String contents, including whitespace and brackets, are preserved exactly. Invalid booleans, out-of-range integers and non-finite floats are rejected before writing. Server-side permissions and string length limits still apply.

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
