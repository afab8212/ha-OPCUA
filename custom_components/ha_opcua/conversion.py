"""Reversible numeric conversions; coordinator and restore values stay raw."""

import math
from decimal import Decimal, InvalidOperation


def validate_conversion(value):
    """Normalize a finite, invertible conversion or reject malformed settings."""
    if value is None:
        return None
    if not isinstance(value, dict):
        raise ValueError("invalid_conversion")
    kind = value.get("type")
    keys = (
        {"factor"}
        if kind == "multiplier"
        else (
            {"plc_min", "plc_max", "ha_min", "ha_max"}
            if kind == "linear_scale"
            else None
        )
    )
    if keys is None or set(value) != keys | {"type"}:
        raise ValueError("invalid_conversion")
    result = {"type": kind}
    for key in keys:
        raw = value[key]
        if isinstance(raw, bool) or not isinstance(raw, (int, float)):
            raise ValueError("invalid_conversion")
        try:
            result[key] = float(raw)
        except OverflowError as err:
            raise ValueError("invalid_conversion") from err
        if not math.isfinite(result[key]):
            raise ValueError("invalid_conversion")
    if kind == "multiplier":
        valid = result["factor"] != 0
    else:
        valid = (
            result["plc_min"] != result["plc_max"]
            and result["ha_min"] != result["ha_max"]
        )
    if not valid:
        raise ValueError("invalid_conversion")
    return result


def convert(value, config, *, inverse=False, integer=False):
    """Convert with decimal arithmetic; integer writes round ties to even."""
    if not config:
        return value
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError("invalid_conversion_value")
    try:
        result = Decimal(str(value))
        if config["type"] == "multiplier":
            factor = Decimal(str(config["factor"]))
            result = result / factor if inverse else result * factor
        else:
            source, target = ("ha", "plc") if inverse else ("plc", "ha")
            low, high = (
                Decimal(str(config[f"{source}_{bound}"])) for bound in ("min", "max")
            )
            out_low, out_high = (
                Decimal(str(config[f"{target}_{bound}"])) for bound in ("min", "max")
            )
            result = out_low + (result - low) * (out_high - out_low) / (high - low)
        if not result.is_finite():
            raise ValueError("invalid_conversion_value")
        if inverse and integer:
            return int(round(result))
        result = float(result)
        if not math.isfinite(result):
            raise ValueError("invalid_conversion_value")
        return result
    except (ArithmeticError, InvalidOperation) as err:
        raise ValueError("invalid_conversion_value") from err
