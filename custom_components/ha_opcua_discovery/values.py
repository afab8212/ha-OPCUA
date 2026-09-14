"""Validate scalar writes without interpreting strings as array expressions."""

import math
import struct
from typing import Any

from asyncua import ua

_INTEGER_BOUNDS = {
    ua.VariantType.SByte: (-(2**7), 2**7 - 1),
    ua.VariantType.Byte: (0, 2**8 - 1),
    ua.VariantType.Int16: (-(2**15), 2**15 - 1),
    ua.VariantType.UInt16: (0, 2**16 - 1),
    ua.VariantType.Int32: (-(2**31), 2**31 - 1),
    ua.VariantType.UInt32: (0, 2**32 - 1),
    ua.VariantType.Int64: (-(2**63), 2**63 - 1),
    ua.VariantType.UInt64: (0, 2**64 - 1),
}


def scalar_variant(value: Any, variant_type: ua.VariantType) -> ua.Variant:
    """Build a scalar Variant of the server's type or reject the input."""
    if variant_type == ua.VariantType.String:
        if not isinstance(value, str):
            raise ValueError("A String node requires a string value")
        converted = value
    elif variant_type == ua.VariantType.Boolean:
        if isinstance(value, bool):
            converted = value
        elif type(value) is int and value in (0, 1):
            converted = bool(value)
        elif isinstance(value, str) and value.strip().lower() in (
            "true",
            "false",
            "on",
            "off",
            "yes",
            "no",
            "1",
            "0",
        ):
            converted = value.strip().lower() in ("true", "on", "yes", "1")
        else:
            raise ValueError("Invalid boolean value")
    elif variant_type in _INTEGER_BOUNDS:
        if isinstance(value, bool) or not isinstance(value, (int, str)):
            raise ValueError("An integer node requires an integer value")
        converted = int(value)
        minimum, maximum = _INTEGER_BOUNDS[variant_type]
        if not minimum <= converted <= maximum:
            raise ValueError(f"Value outside {variant_type.name} range")
    elif variant_type in (ua.VariantType.Float, ua.VariantType.Double):
        if isinstance(value, bool) or not isinstance(value, (int, float, str)):
            raise ValueError("A numeric node requires a numeric value")
        try:
            converted = float(value)
            if not math.isfinite(converted):
                raise ValueError("Value must be finite")
            if variant_type == ua.VariantType.Float:
                struct.pack("<f", converted)
        except (OverflowError, struct.error) as err:
            raise ValueError(f"Value outside {variant_type.name} range") from err
    else:
        raise ValueError(f"Unsupported scalar type: {variant_type.name}")
    return ua.Variant(converted, variant_type)
