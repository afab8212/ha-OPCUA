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

from .const import CONF_NAME_WITH_PATH

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


_INDEXED_SEGMENT_RE = re.compile(r"^(?P<name>.+)\[(?P<index>\d+)\]$")


def name_with_path_enabled(entry):
    """Whether this connection names entities by their full path below the root."""
    if entry is None:
        return False
    return bool({**entry.data, **entry.options}.get(CONF_NAME_WITH_PATH, False))


def _relative_segments(node_id, root_node_id, path=None):
    """Path segments of a node below the discovery root, or None.

    The browse path recorded during discovery is exact for any NodeId
    scheme, including a numeric root. Without one (a manually added or
    offline node), a symbolic NodeId is read relative to a symbolic root.
    """
    if path:
        return list(path) if all(path) else None
    if not isinstance(root_node_id, str) or not _STRING_NODE_ID_RE.match(node_id):
        return None
    prefix = f"{root_node_id.strip()}."
    if not node_id.startswith(prefix):
        return None
    segments = [part.strip('"') for part in node_id[len(prefix) :].split(".")]
    return segments if all(segments) else None


def _segment_label(segment):
    match = _INDEXED_SEGMENT_RE.match(segment)
    return f"{match['name']} {match['index']}" if match else segment


def path_name(node_id, root_node_id, path=None):
    """A node's full path below the root as a display name, or None.

    Only a node nested at least one level below the root has a path to show.
    """
    segments = _relative_segments(node_id, root_node_id, path)
    if segments is None or len(segments) < 2:
        return None
    return " · ".join(_segment_label(segment) for segment in segments)


def path_group(node_id, root_node_id, path=None):
    """The parent path below the root as a group key and label, or None."""
    segments = _relative_segments(node_id, root_node_id, path)
    if segments is None or len(segments) < 2:
        return None
    parent = segments[:-1]
    return {
        "key": ".".join(parent),
        "label": " › ".join(_segment_label(segment) for segment in parent),
    }


def display_name_for(
    node_id, *, collides, root_node_id=None, with_path=False, path=None
):
    """The default display name that tells a node apart, or None when none applies.

    With path naming on, every node nested below the root gets its full
    path. Otherwise only array elements (by index) and fields whose name
    collides (by parent struct) are disambiguated.
    """
    if with_path:
        name = path_name(node_id, root_node_id, path)
        if name is not None:
            return name
    return disambiguated_name(node_id, collides=collides)
