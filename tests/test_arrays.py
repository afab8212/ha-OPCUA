"""Generic array-of-struct detection, independent of size or field count."""

from custom_components.ha_opcua.arrays import (
    array_element_name,
    disambiguated_name,
    display_name_for,
    parse_array_element,
    parse_struct_field,
    path_group,
    path_name,
    relative_paths,
    struct_field_name,
)

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


STRUCT_PREFIX = "ns=4;s=|var|PLC.Application.PARAM"
STRUCT_NODE = f"{STRUCT_PREFIX}.Pump_North.xEnable"


def test_parses_the_parent_struct_instance_and_field():
    assert parse_struct_field(STRUCT_NODE) == {
        "parent": "Pump_North",
        "field": "xEnable",
    }
    assert struct_field_name(STRUCT_NODE) == "Pump_North · xEnable"


def test_quoted_segments_and_missing_namespace_are_handled():
    assert parse_struct_field('ns=3;s="DB1"."Pump"."xRun"') == {
        "parent": "Pump",
        "field": "xRun",
    }
    assert parse_struct_field("s=Motor.rSpeed") == {
        "parent": "Motor",
        "field": "rSpeed",
    }


def test_nodes_without_a_symbolic_parent_do_not_match():
    assert parse_struct_field("ns=2;i=4") is None
    assert parse_struct_field("ns=2;s=rTopLevel") is None
    assert parse_struct_field("ns=4;s=.rField") is None
    assert struct_field_name("ns=2;i=4") is None


def test_disambiguated_name_depends_on_collision_for_plain_structs():
    assert disambiguated_name(STRUCT_NODE, collides=False) is None
    assert disambiguated_name(STRUCT_NODE, collides=True) == "Pump_North · xEnable"
    # Numeric NodeIds carry no parent, so there is nothing to add.
    assert disambiguated_name("ns=2;i=4", collides=True) is None


def test_array_elements_are_always_disambiguated_by_their_index():
    node_id = f"{STRUCT_PREFIX}.Alarms[3].xActive"
    expected = "Alarms 3 · xActive"
    assert disambiguated_name(node_id, collides=False) == expected
    assert disambiguated_name(node_id, collides=True) == expected


ROOT = "ns=4;s=|var|PLC.Application"


def test_path_name_joins_every_segment_below_the_root():
    assert path_name(f"{ROOT}.SP.xError", ROOT) == "SP · xError"
    assert (
        path_name(f"{ROOT}.PARAM.Pump_North.xEnable", ROOT)
        == "PARAM · Pump_North · xEnable"
    )
    # An array index stays readable the same way array element names are.
    assert (
        path_name(f"{ROOT}.PlantRelay.astAlarms[3].xActive", ROOT)
        == "PlantRelay · astAlarms 3 · xActive"
    )
    # Quoted segments lose their quotes, and a stray space in the root is fine.
    assert path_name('ns=3;s="DB1"."Pump"."xRun"', 'ns=3;s="DB1"') == "Pump · xRun"
    assert path_name('ns=3;s=Root."DB1"."xRun"', " ns=3;s=Root ") == "DB1 · xRun"


def test_path_name_needs_a_symbolic_path_nested_below_the_root():
    # Directly under the root there is no group to show.
    assert path_name(f"{ROOT}.Speed", ROOT) is None
    # Outside the root, numeric NodeIds and a missing root have no path.
    assert path_name("ns=4;s=|var|OTHER.Application.SP.xError", ROOT) is None
    assert path_name("ns=2;i=4", ROOT) is None
    assert path_name(f"{ROOT}.SP.xError", None) is None
    assert path_name(f"{ROOT}.SP.xError", "ns=2;i=1") is None


def test_path_group_is_the_parent_path_below_the_root():
    assert path_group(f"{ROOT}.SP.xError", ROOT) == {"key": "SP", "label": "SP"}
    assert path_group(f"{ROOT}.PARAM.Pump_North.xEnable", ROOT) == {
        "key": "PARAM.Pump_North",
        "label": "PARAM › Pump_North",
    }
    assert path_group(f"{ROOT}.astAlarms[3].xActive", ROOT) == {
        "key": "astAlarms[3]",
        "label": "astAlarms 3",
    }
    assert path_group(f"{ROOT}.Speed", ROOT) is None
    assert path_group("ns=2;i=4", ROOT) is None


def test_display_name_for_prefers_the_path_only_when_enabled():
    node_id = f"{ROOT}.SP.xError"
    assert display_name_for(node_id, collides=False, root_node_id=ROOT) is None
    assert (
        display_name_for(node_id, collides=False, root_node_id=ROOT, with_path=True)
        == "SP · xError"
    )
    # Without a path to show, the collision-based names still apply.
    assert (
        display_name_for(node_id, collides=True, root_node_id=None, with_path=True)
        == "SP · xError"
    )
    array_id = f"{ROOT}.astAlarms[3].xActive"
    assert display_name_for(array_id, collides=False) == "astAlarms 3 · xActive"


def test_a_recorded_browse_path_works_for_a_numeric_root():
    node_id = "ns=4;i=2001"
    path = ["PARAM", "Pump_North", "xEnable"]
    assert path_name(node_id, "ns=4;i=5000", path) == "PARAM · Pump_North · xEnable"
    assert path_group(node_id, "ns=4;i=5000", path) == {
        "key": "PARAM.Pump_North",
        "label": "PARAM › Pump_North",
    }
    assert (
        display_name_for(
            node_id,
            collides=False,
            root_node_id="ns=4;i=5000",
            with_path=True,
            path=path,
        )
        == "PARAM · Pump_North · xEnable"
    )
    # A variable directly below the root has no group to show.
    assert path_name(node_id, "ns=4;i=5000", ["Speed"]) is None
    assert path_group(node_id, "ns=4;i=5000", ["Speed"]) is None
    # Without a recorded path, a numeric root cannot be resolved.
    assert path_name(node_id, "ns=4;i=5000", None) is None


DEVICE = "ns=4;s=|var|PLC.Application"


def test_relative_paths_drop_the_nodes_every_variable_shares():
    browse = {
        f"{DEVICE}.A_IN.rTemp": ["Application", "Folder", "A_IN", "rTemp"],
        f"{DEVICE}.PARAM.Pump_North.xEnable": [
            "Application",
            "Folder",
            "PARAM",
            "Pump_North",
            "xEnable",
        ],
        f"{DEVICE}.PRG.rLocal": ["Application", "PRG", "rLocal"],
    }
    # The symbol path is what people know: organizing browse folders such as
    # "Folder" are not part of it, and the shared device/application are
    # dropped because they say nothing about where a variable lives.
    assert relative_paths(browse) == {
        f"{DEVICE}.A_IN.rTemp": ["A_IN", "rTemp"],
        f"{DEVICE}.PARAM.Pump_North.xEnable": ["PARAM", "Pump_North", "xEnable"],
        f"{DEVICE}.PRG.rLocal": ["PRG", "rLocal"],
    }


def test_relative_paths_for_numeric_node_ids_use_the_browse_names():
    browse = {
        "ns=4;i=2": ["Root", "Group_A", "xOne"],
        "ns=4;i=3": ["Root", "Group_B", "Sub", "xTwo"],
    }
    assert relative_paths(browse) == {
        "ns=4;i=2": ["Group_A", "xOne"],
        "ns=4;i=3": ["Group_B", "Sub", "xTwo"],
    }


def test_relative_paths_keep_a_single_group_next_to_a_sibling_group():
    browse = {
        f"{DEVICE}.SP.xError": ["SP", "xError"],
        f"{DEVICE}.SP.xWarning": ["SP", "xWarning"],
        f"{DEVICE}.FLAG.xOn": ["FLAG", "xOn"],
    }
    assert relative_paths(browse)[f"{DEVICE}.SP.xError"] == ["SP", "xError"]
    # With only one group at all, that group is the shared node and its
    # variables have nothing left to be grouped by.
    only = {k: v for k, v in browse.items() if ".SP." in k}
    assert relative_paths(only)[f"{DEVICE}.SP.xError"] == ["xError"]
    assert relative_paths({}) == {}


def test_relative_paths_ignore_a_few_stray_variables_in_a_large_installation():
    other = "ns=4;s=|var|OTHER.Application"
    browse = {}
    for index in range(150):
        group = "A" if index % 2 else "B"
        browse[f"{DEVICE}.{group}.x{index}"] = []
    stray = f"{other}.Info.sVersion"
    browse[stray] = []
    result = relative_paths(browse)
    # The shared device/application prefix is still recognized ...
    assert result[f"{DEVICE}.A.x1"] == ["A", "x1"]
    assert result[f"{DEVICE}.B.x0"] == ["B", "x0"]
    # ... and the variable outside it gets no path, so it keeps its name.
    assert stray not in result


def test_relative_paths_are_exact_for_a_small_installation():
    other = "ns=4;s=|var|OTHER.Application"
    browse = {f"{DEVICE}.A.x{index}": [] for index in range(10)}
    browse[f"{other}.Info.sVersion"] = []
    result = relative_paths(browse)
    # With so few variables a deviating one counts: nothing is shared, so the
    # full symbol path is kept for everyone rather than guessing.
    assert result[f"{DEVICE}.A.x1"] == ["PLC", "Application", "A", "x1"]
    assert len(result) == 11


def test_a_property_of_a_variable_shares_the_prefix_of_its_variables():
    variable = "ns=4;s=|var|PLC.Application.PARAM.Pump_North.aValues[0]"
    prop = "ns=4;s=|vprop|PLC.Application.PARAM.Pump_North.aValues.Dimensions"
    other = "ns=4;s=|var|PLC.Application.SP.xError"
    result = relative_paths({variable: [], prop: [], other: []})
    # The kind tag does not make the property a stray: it keeps its group.
    assert result[variable] == ["PARAM", "Pump_North", "aValues[0]"]
    assert result[prop] == ["PARAM", "Pump_North", "aValues", "Dimensions"]
    assert result[other] == ["SP", "xError"]
