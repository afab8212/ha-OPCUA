"""Detect a field inside one element of a PLC array-of-struct.

Some PLCs (e.g. WAGO/CODESYS symbolic addressing) expose an array of
structs as NodeIds like "...PlantRelay.astMeldungen[10].xAktiv": every
element shares the same field names, so a flat, unindexed field name
collides across the whole array and loses which element it came from.
This only inspects the NodeId string itself - no PLC-side metadata is
needed - so it works for any array size and any number of fields per
struct.
"""

import re

_ARRAY_ELEMENT_RE = re.compile(
    r"^(?P<prefix>.*\.(?P<array>[^.\[\]]+)\[(?P<index>\d+)\])\.(?P<field>[^.\[\]]+)$"
)


def parse_array_element(node_id):
    """Return the array/index/field this NodeId identifies, or None."""
    match = _ARRAY_ELEMENT_RE.match(node_id)
    if match is None:
        return None
    return {
        "group_key": match["prefix"],
        "array": match["array"],
        "index": int(match["index"]),
        "field": match["field"],
    }


def array_element_name(node_id, field_name):
    """A field's default display name, disambiguated by its array index."""
    parsed = parse_array_element(node_id)
    if parsed is None:
        return field_name
    return f"{parsed['array']} {parsed['index']} · {field_name}"
