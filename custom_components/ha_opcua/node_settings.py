"""Entity choices and editable limits for discovered scalar nodes."""

import math
from enum import Enum

from asyncua import ua
from homeassistant import const as ha_const
from homeassistant.components.binary_sensor import BinarySensorDeviceClass
from homeassistant.components.number import NumberDeviceClass
from homeassistant.components.sensor import SensorDeviceClass
from homeassistant.components.switch import SwitchDeviceClass

from .const import CONF_OFFLINE_NODES
from .conversion import convert, validate_conversion
from .values import scalar_variant

INTEGER_TYPES = {
    "SByte",
    "Byte",
    "Int16",
    "UInt16",
    "Int32",
    "UInt32",
    "Int64",
    "UInt64",
}
NUMERIC_TYPES = INTEGER_TYPES | {"Float", "Double"}
SCALAR_TYPES = NUMERIC_TYPES | {"String", "Boolean", "DateTime"}
MAX_SAFE_INTEGER = 2**53 - 1
MAX_VALUE_LABELS = 256
MAX_LABEL_LENGTH = 64
PULSE_DEFAULT_MS = 500
PULSE_MIN_MS = 50
PULSE_MAX_MS = 10000
DEVICE_CLASS_ENUMS = {
    "binary_sensor": BinarySensorDeviceClass,
    "number": NumberDeviceClass,
    "sensor": SensorDeviceClass,
    "switch": SwitchDeviceClass,
}


def allowed_platforms(node):
    """Offer only platforms compatible with the type and effective write access."""
    choices = ["auto", "sensor"]
    kind = node["variant_type"]
    if kind == "Boolean":
        choices.append("binary_sensor")
    if node["writable"]:
        if kind == "Boolean":
            choices.extend(("switch", "button"))
        elif kind in NUMERIC_TYPES:
            choices.append("number")
            if kind in INTEGER_TYPES:
                choices.append("select")
        elif kind == "String":
            choices.append("text")
        elif kind == "DateTime":
            choices.append("datetime")
    return [*choices, "disabled"]


def number_defaults(node):
    return {
        "min": 0,
        "max": 100,
        "step": 1 if node["variant_type"] in INTEGER_TYPES else 0.1,
    }


def deadband_default(node):
    """Absolute OPC UA subscription deadband applied when none is saved.

    Suppresses push updates for a change smaller than this (e.g. float noise
    below the digit you care about). 0 disables it. Only takes effect while
    Auto-Subscription is on; polling always reads the exact value regardless.
    """
    return 1 if node["variant_type"] in INTEGER_TYPES else 0.01


def supports_deadband(node, platform):
    """Deadband applies to any numeric node exposed as a number or sensor."""
    return platform in ("number", "sensor") and node["variant_type"] in NUMERIC_TYPES


def available_device_classes(node, platform):
    """Return Home Assistant device classes supported by an entity domain."""
    enum = DEVICE_CLASS_ENUMS.get(platform)
    if enum is None:
        return []
    if platform == "sensor" and node["variant_type"] == "DateTime":
        return [SensorDeviceClass.TIMESTAMP.value]
    return sorted(item.value for item in enum)


def supports_unit(node, platform):
    """A unit of measurement only makes sense for an analog sensor or number."""
    return platform in ("number", "sensor") and node["variant_type"] in NUMERIC_TYPES


def supports_value_labels(node, platform):
    """A value table maps raw integers to texts on a select or a sensor."""
    return platform in ("select", "sensor") and node["variant_type"] in INTEGER_TYPES


def normalize_value_labels(node, raw):
    """Validate a value table: unique integers of the node type, unique texts."""
    if not isinstance(raw, list) or len(raw) > MAX_VALUE_LABELS:
        raise ValueError("invalid_value_labels")
    variant_type = ua.VariantType[node["variant_type"]]
    result, values, labels = [], set(), set()
    for item in raw:
        if not isinstance(item, dict) or set(item) != {"value", "label"}:
            raise ValueError("invalid_value_labels")
        value, label = item["value"], item["label"]
        if type(value) is not int or not isinstance(label, str):
            raise ValueError("invalid_value_labels")
        label = label.strip()
        if not label or len(label) > MAX_LABEL_LENGTH:
            raise ValueError("invalid_value_labels")
        if value in values or label in labels:
            raise ValueError("duplicate_value_labels")
        try:
            if abs(value) > MAX_SAFE_INTEGER:
                raise ValueError("unsafe integer")
            scalar_variant(value, variant_type)
        except ValueError as err:
            raise ValueError("value_labels_outside_type") from err
        values.add(value)
        labels.add(label)
        result.append({"value": value, "label": label})
    return result


def label_for_value(settings, value):
    """Text for a raw value, or None when the table does not list it."""
    if isinstance(value, bool) or not isinstance(value, int):
        return None
    for item in settings.get("value_labels") or ():
        if item["value"] == value:
            return item["label"]
    return None


def standard_units():
    """Every unit string HA's own canonical UnitOf* enums define, plus percentage.

    Introspected from homeassistant.const rather than a hand-kept copy, so the
    list offered by the panel always matches whatever unit categories the
    running HA core version defines - this integration has no unit categories
    of its own, it only ever displays a PLC's raw value next to one of these.
    """
    values = {ha_const.PERCENTAGE}
    for name in dir(ha_const):
        if not name.startswith("UnitOf"):
            continue
        candidate = getattr(ha_const, name)
        if isinstance(candidate, type) and issubclass(candidate, Enum):
            values.update(item.value for item in candidate)
    return sorted(values)


def validate_settings(node, settings):
    """Return normalized settings; shared by the options flow and entity setup."""
    platform = settings.get("platform", "auto")
    if platform not in allowed_platforms(node):
        raise ValueError("incompatible_platform")
    result = {"platform": platform}
    if "update_mode" in settings:
        if settings["update_mode"] not in ("polling", "subscription"):
            raise ValueError("invalid_update_mode")
        result["update_mode"] = settings["update_mode"]
    if "always_available" in settings:
        if type(settings["always_available"]) is not bool:
            raise ValueError("invalid_availability")
        result["always_available"] = settings["always_available"]
    conversion = validate_conversion(settings.get("conversion"))
    if conversion is not None:
        if node["variant_type"] not in NUMERIC_TYPES:
            raise ValueError("invalid_conversion")
        result["conversion"] = conversion
    precision = settings.get("precision")
    if precision is not None:
        if (
            type(precision) is not int
            or not 0 <= precision <= 10
            or (node["variant_type"] not in {"Float", "Double"} and not conversion)
        ):
            raise ValueError("invalid_precision")
        result["precision"] = precision
    # A value table (raw integer -> text) drives a select and may turn an
    # integer sensor into a text sensor. Like the deadband, it is silently
    # dropped for platforms it cannot apply to, so switching a node to
    # "number" or "disabled" keeps loading with an old table still stored.
    labels = None
    if supports_value_labels(node, effective_platform(node, settings)):
        raw_labels = settings.get("value_labels")
        if raw_labels is not None:
            labels = normalize_value_labels(node, raw_labels)
        if platform == "select" and not labels:
            raise ValueError("value_labels_required")
        if labels:
            if conversion:
                raise ValueError("value_labels_conversion")
            result["value_labels"] = labels
    # Deadband is independent of the number limits: a read-only float sensor
    # has exactly the same float-noise problem as a writable number. It is
    # silently dropped (not rejected) for platforms/types it cannot apply to,
    # so a node that is switched to "disabled" or "sensor"-on-Boolean keeps
    # loading even if an old deadband value is still stored.
    if supports_deadband(node, effective_platform(node, settings)):
        raw = settings.get("deadband")
        if raw is None:
            raw = deadband_default(node)
        if isinstance(raw, bool):
            raise ValueError("invalid_deadband")
        try:
            deadband = float(raw)
        except (ValueError, TypeError, OverflowError) as err:
            raise ValueError("invalid_deadband") from err
        if not math.isfinite(deadband) or deadband < 0:
            raise ValueError("invalid_deadband")
        if node["variant_type"] in INTEGER_TYPES:
            if deadband.is_integer():
                deadband = int(deadband)
            else:
                # Almost always a value inherited from before this node's
                # type changed (e.g. reassigning the entity from a REAL to
                # an integer NodeId), not a deliberate choice for this node
                # - same reasoning as the platform/type mismatches above.
                # Falls back instead of rejecting the whole configuration
                # over a stale value.
                deadband = deadband_default(node)
        result["deadband"] = deadband
    if "node_id" in settings:
        if not isinstance(settings["node_id"], str) or not settings["node_id"]:
            raise ValueError("invalid_node_id")
        result["node_id"] = settings["node_id"]
    if "display_name" in settings:
        display_name = settings["display_name"]
        if not isinstance(display_name, str) or not display_name.strip():
            raise ValueError("invalid_display_name")
        result["display_name"] = display_name
    if "invert_state" in settings:
        if type(settings["invert_state"]) is not bool or (
            settings["invert_state"] and node["variant_type"] != "Boolean"
        ):
            raise ValueError("invalid_inversion")
        result["invert_state"] = settings["invert_state"]
    if settings.get("device_class") is not None:
        if settings["device_class"] not in available_device_classes(
            node, effective_platform(node, settings)
        ) or (labels and settings["device_class"] != SensorDeviceClass.ENUM.value):
            raise ValueError("invalid_device_class")
        result["device_class"] = settings["device_class"]
    if settings.get("unit_of_measurement") is not None:
        unit = settings["unit_of_measurement"]
        if not isinstance(unit, str):
            raise ValueError("invalid_unit")
        unit = unit.strip()
        if (
            not unit
            or len(unit) > 50
            or not supports_unit(node, effective_platform(node, settings))
            or labels
        ):
            raise ValueError("invalid_unit")
        result["unit_of_measurement"] = unit
    if platform == "number":
        defaults = number_defaults(node)
        if any(isinstance(settings.get(key), bool) for key in defaults):
            raise ValueError("invalid_number_limits")
        try:
            limits = {
                key: float(settings.get(key, default))
                for key, default in defaults.items()
            }
        except (ValueError, TypeError, OverflowError) as err:
            raise ValueError("invalid_number_limits") from err
        if not all(math.isfinite(value) for value in limits.values()):
            raise ValueError("invalid_number_limits")
        if (
            limits["min"] >= limits["max"]
            or not 0 < limits["step"] <= limits["max"] - limits["min"]
        ):
            raise ValueError("invalid_number_limits")
        kind = node["variant_type"]
        if kind in INTEGER_TYPES and not conversion:
            if not all(value.is_integer() for value in limits.values()):
                raise ValueError("integer_limits_required")
            limits = {key: int(value) for key, value in limits.items()}
            if max(abs(limits["min"]), abs(limits["max"])) > MAX_SAFE_INTEGER:
                raise ValueError("unsafe_integer_limits")
        try:
            for key in ("min", "max"):
                raw = convert(
                    limits[key], conversion, inverse=True, integer=kind in INTEGER_TYPES
                )
                if kind in INTEGER_TYPES and abs(raw) > MAX_SAFE_INTEGER:
                    raise ValueError("unsafe_integer_limits")
                scalar_variant(raw, ua.VariantType[kind])
        except ValueError as err:
            raise ValueError("limits_outside_type") from err
        result.update(limits)
    elif platform == "text":
        minimum = settings.get("min_length", 0)
        maximum = settings.get("max_length", 255)
        if (
            type(minimum) is not int
            or type(maximum) is not int
            or not 0 <= minimum <= maximum <= 255
        ):
            raise ValueError("invalid_text_limits")
        result.update(min_length=minimum, max_length=maximum)
    elif platform == "button":
        pulse_ms = settings.get("pulse_ms", PULSE_DEFAULT_MS)
        if type(pulse_ms) is not int or not PULSE_MIN_MS <= pulse_ms <= PULSE_MAX_MS:
            raise ValueError("invalid_pulse")
        result["pulse_ms"] = pulse_ms
    return result


def effective_platform(node, settings):
    """Keep the existing automatic mapping unless the user explicitly changes it."""
    requested = settings.get("platform", "auto")
    if requested != "auto":
        return requested
    if node["writable"]:
        return {"Boolean": "switch", "DateTime": "datetime"}.get(
            node["variant_type"], "sensor"
        )
    return "sensor"


def update_offline_node(options, key, node, settings):
    """Keep verified metadata for opted-in entities to start without discovery."""
    if settings.get("always_available", False):
        options.setdefault(CONF_OFFLINE_NODES, {})[key] = {
            field: node[field]
            for field in ("name", "node_id", "variant_type", "writable")
        }
    elif CONF_OFFLINE_NODES in options:
        options[CONF_OFFLINE_NODES].pop(key, None)
        if not options[CONF_OFFLINE_NODES]:
            options.pop(CONF_OFFLINE_NODES)
