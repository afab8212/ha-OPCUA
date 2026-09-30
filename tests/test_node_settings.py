"""validate_settings() must not reject values only stale from a type change."""

import pytest

from custom_components.ha_opcua.node_settings import validate_settings

INTEGER_NODE = {
    "node_id": "ns=2;i=9",
    "name": "iWert",
    "variant_type": "Int16",
    "writable": True,
}


def test_deadband_falls_back_when_inherited_from_a_float_node():
    # 0.01 is the Float default; carried over after a NodeId reassignment
    # from a REAL node, it is not a valid deadband for an integer node.
    settings = {"platform": "number", "deadband": 0.01, "min": 0, "max": 100, "step": 1}

    result = validate_settings(INTEGER_NODE, settings)

    assert result["deadband"] == 1


def test_number_limits_still_rejected_when_inherited_from_a_float_node():
    # Unlike deadband, min/max/step are not silently corrected: they define
    # what a "number" entity is allowed to write to the PLC, so an
    # incompatible inherited value (step=0.1 is not valid for an integer
    # node) must still surface as an error the user has to resolve.
    settings = {"platform": "number", "deadband": 1, "min": 0, "max": 100, "step": 0.1}

    with pytest.raises(ValueError, match="integer_limits_required"):
        validate_settings(INTEGER_NODE, settings)


def test_negative_deadband_still_rejected():
    settings = {"platform": "number", "deadband": -1, "min": 0, "max": 100, "step": 1}

    with pytest.raises(ValueError, match="invalid_deadband"):
        validate_settings(INTEGER_NODE, settings)


def test_min_not_less_than_max_still_rejected():
    settings = {"platform": "number", "deadband": 1, "min": 100, "max": 100, "step": 1}

    with pytest.raises(ValueError, match="invalid_number_limits"):
        validate_settings(INTEGER_NODE, settings)


@pytest.mark.parametrize(
    ("node", "settings", "device_class"),
    [
        (
            {**INTEGER_NODE, "variant_type": "Boolean"},
            {"platform": "binary_sensor", "device_class": "door"},
            "door",
        ),
        (
            {**INTEGER_NODE, "variant_type": "Double"},
            {
                "platform": "number",
                "device_class": "power",
                "min": 0,
                "max": 100,
                "step": 1,
            },
            "power",
        ),
        (
            {**INTEGER_NODE, "variant_type": "Double"},
            {"platform": "sensor", "device_class": "temperature"},
            "temperature",
        ),
        (
            {**INTEGER_NODE, "variant_type": "Boolean"},
            {"platform": "switch", "device_class": "outlet"},
            "outlet",
        ),
    ],
)
def test_device_class_is_validated_for_each_entity_domain(node, settings, device_class):
    assert validate_settings(node, settings)["device_class"] == device_class


def test_datetime_sensor_only_accepts_timestamp_device_class():
    node = {**INTEGER_NODE, "variant_type": "DateTime", "writable": False}

    assert validate_settings(
        node, {"platform": "sensor", "device_class": "timestamp"}
    )["device_class"] == "timestamp"
    with pytest.raises(ValueError, match="invalid_device_class"):
        validate_settings(node, {"platform": "sensor", "device_class": "power"})


def test_device_class_from_another_domain_is_rejected():
    node = {**INTEGER_NODE, "variant_type": "Double", "writable": False}

    with pytest.raises(ValueError, match="invalid_device_class"):
        validate_settings(node, {"platform": "sensor", "device_class": "door"})
