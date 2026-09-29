"""Generic array-of-struct detection, independent of size or field count."""

from custom_components.ha_opcua.arrays import array_element_name, parse_array_element

WAGO_PREFIX = "ns=4;s=|var|WAGO 750-8212 PFC200 G2 2ETH RS.Application"


def test_parses_array_element_fields_regardless_of_index_or_field_name():
    for index, field in ((1, "xAktiv"), (10, "sText"), (32, "uiCode")):
        node_id = f"{WAGO_PREFIX}.PlantRelay.astMeldungen[{index}].{field}"
        parsed = parse_array_element(node_id)
        assert parsed == {
            "group_key": f"{WAGO_PREFIX}.PlantRelay.astMeldungen[{index}]",
            "array": "astMeldungen",
            "index": index,
            "field": field,
        }


def test_two_different_arrays_get_distinct_group_keys():
    first = parse_array_element(f"{WAGO_PREFIX}.astMeldungen[1].xAktiv")
    second = parse_array_element(f"{WAGO_PREFIX}.otherArray[1].xAktiv")
    assert first["group_key"] != second["group_key"]
    assert first["array"] != second["array"]


def test_a_plain_scalar_node_does_not_match():
    assert parse_array_element(f"{WAGO_PREFIX}.PLC_PRG.rWert") is None
    # No trailing field after the index is not an array *element field*.
    assert parse_array_element(f"{WAGO_PREFIX}.astMeldungen[1]") is None
    # A bracket that isn't a plain integer index is not this convention.
    assert parse_array_element(f"{WAGO_PREFIX}.astMeldungen[x].xAktiv") is None


def test_array_element_name_disambiguates_by_index():
    node_id = f"{WAGO_PREFIX}.PlantRelay.astMeldungen[10].xAktiv"
    assert array_element_name(node_id, "xAktiv") == "astMeldungen 10 · xAktiv"


def test_array_element_name_falls_back_to_the_raw_field_name():
    node_id = f"{WAGO_PREFIX}.PLC_PRG.rWert"
    assert array_element_name(node_id, "rWert") == "rWert"
