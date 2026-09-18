"""Entity choices and editable limits for discovered scalar nodes."""

import math

from asyncua import ua
from homeassistant.components.binary_sensor import BinarySensorDeviceClass

from .const import CONF_OFFLINE_NODES
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


def allowed_platforms(node):
    """Offer only platforms compatible with the type and effective write access."""
    choices = ["auto", "sensor"]
    kind = node["variant_type"]
    if kind == "Boolean":
        choices.append("binary_sensor")
    if node["writable"]:
        if kind == "Boolean":
            choices.append("switch")
        elif kind in NUMERIC_TYPES:
            choices.append("number")
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


def validate_settings(node, settings):
    """Return normalized settings; shared by the options flow and entity setup."""
    platform = settings.get("platform", "auto")
    if platform not in allowed_platforms(node):
        raise ValueError("incompatible_platform")
    result = {"platform": platform}
    if "always_available" in settings:
        if type(settings["always_available"]) is not bool:
            raise ValueError("invalid_availability")
        result["always_available"] = settings["always_available"]
    precision = settings.get("precision")
    if precision is not None:
        if (
            type(precision) is not int
            or not 0 <= precision <= 10
            or node["variant_type"] not in {"Float", "Double"}
        ):
            raise ValueError("invalid_precision")
        result["precision"] = precision
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
            if not deadband.is_integer():
                raise ValueError("invalid_deadband")
            deadband = int(deadband)
        result["deadband"] = deadband
    if "node_id" in settings:
        if not isinstance(settings["node_id"], str) or not settings["node_id"]:
            raise ValueError("invalid_node_id")
        result["node_id"] = settings["node_id"]
    if "invert_state" in settings:
        if type(settings["invert_state"]) is not bool or (
            settings["invert_state"] and node["variant_type"] != "Boolean"
        ):
            raise ValueError("invalid_inversion")
        result["invert_state"] = settings["invert_state"]
    if settings.get("device_class") is not None:
        if effective_platform(node, settings) != "binary_sensor" or settings[
            "device_class"
        ] not in {item.value for item in BinarySensorDeviceClass}:
            raise ValueError("invalid_device_class")
        result["device_class"] = settings["device_class"]
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
        if kind in INTEGER_TYPES:
            if not all(value.is_integer() for value in limits.values()):
                raise ValueError("integer_limits_required")
            limits = {key: int(value) for key, value in limits.items()}
            if max(abs(limits["min"]), abs(limits["max"])) > MAX_SAFE_INTEGER:
                raise ValueError("unsafe_integer_limits")
        try:
            for key in ("min", "max"):
                scalar_variant(limits[key], ua.VariantType[kind])
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
