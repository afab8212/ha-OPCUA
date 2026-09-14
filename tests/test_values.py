"""Regression coverage for scalar conversion before any network write."""

import pytest
from asyncua import ua

from custom_components.ha_opcua_discovery.values import scalar_variant


@pytest.mark.parametrize(
    "value", ["", "  Recipe A  ", "[A,B]", "[]", "[unfinished", "caffè ☕\n"]
)
def test_strings_are_preserved(value):
    variant = scalar_variant(value, ua.VariantType.String)
    assert variant.Value == value
    assert variant.VariantType == ua.VariantType.String
    assert not variant.is_array


def test_numeric_types_and_boundaries():
    for kind, lower, upper in [
        (ua.VariantType.SByte, -128, 127),
        (ua.VariantType.Byte, 0, 255),
        (ua.VariantType.Int16, -32768, 32767),
        (ua.VariantType.UInt16, 0, 65535),
        (ua.VariantType.Int32, -(2**31), 2**31 - 1),
        (ua.VariantType.UInt32, 0, 2**32 - 1),
        (ua.VariantType.Int64, -(2**63), 2**63 - 1),
        (ua.VariantType.UInt64, 0, 2**64 - 1),
    ]:
        for value in (lower, upper):
            result = scalar_variant(str(value), kind)
            assert result.Value == value
            assert result.VariantType == kind
        for value in (lower - 1, upper + 1):
            with pytest.raises(ValueError):
                scalar_variant(value, kind)
    for kind in (ua.VariantType.Float, ua.VariantType.Double):
        result = scalar_variant("1.25", kind)
        assert result.Value == 1.25
        assert result.VariantType == kind


@pytest.mark.parametrize(
    "value,kind",
    [
        ("typo", ua.VariantType.Boolean),
        (2, ua.VariantType.Boolean),
        (1.5, ua.VariantType.Int16),
        (True, ua.VariantType.Int16),
        ("", ua.VariantType.Int32),
        ("1.2", ua.VariantType.Int32),
        ("NaN", ua.VariantType.Double),
        ("inf", ua.VariantType.Float),
        (1e40, ua.VariantType.Float),
        ([], ua.VariantType.String),
        ("[1,2]", ua.VariantType.Int16),
        ("text", ua.VariantType.ByteString),
    ],
)
def test_invalid_input_is_rejected(value, kind):
    with pytest.raises(ValueError):
        scalar_variant(value, kind)


def test_boolean_text_is_explicit():
    for value in (True, 1, "true", " On "):
        assert scalar_variant(value, ua.VariantType.Boolean).Value is True
    for value in (False, 0, "false", " Off "):
        assert scalar_variant(value, ua.VariantType.Boolean).Value is False
