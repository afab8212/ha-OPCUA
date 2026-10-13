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


_STRING_NODE_ID_RE = re.compile(r"^(?:ns=\d+;)?s=(?P<path>.+)$")


def parse_struct_field(node_id):
    """Return the parent struct/instance and field of a dotted symbolic NodeId."""
    match = _STRING_NODE_ID_RE.match(node_id)
    if match is None:
        return None
    parts = match["path"].split(".")
    if len(parts) < 2:
        return None
    parent, field = (part.strip('"') for part in parts[-2:])
    if not parent or not field:
        return None
    return {"parent": parent, "field": field}


def struct_field_name(node_id):
    """A field's display name prefixed with its parent struct instance."""
    parsed = parse_struct_field(node_id)
    if parsed is None:
        return None
    return f"{parsed['parent']} · {parsed['field']}"


def disambiguated_name(node_id, *, collides):
    """A name that tells repeated field names apart, or None when none applies.

    An array element field is always disambiguated by its index. Any other
    symbolic field only is when its name collides with another node's,
    using its parent struct instance instead - a unique name stays as is.
    """
    parsed = parse_array_element(node_id)
    if parsed is not None:
        return array_element_name(node_id, parsed["field"])
    if collides:
        return struct_field_name(node_id)
    return None
