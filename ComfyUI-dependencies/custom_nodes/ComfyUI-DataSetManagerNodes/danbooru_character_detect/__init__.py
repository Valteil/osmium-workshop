# Bespoke node built for this project (see README.md in this folder) — no upstream repo.
#
# Registered under a "DSM " (DataSetManagerNodes)-prefixed name instead of the bare
# "DanbooruCharacterDetect" — this pack is meant to install cleanly alongside (or instead of) any
# other ComfyUI packs a user already has, without a name collision silently deciding which copy
# wins. nodes.py itself is untouched; the rename happens only here, at registration.
# This subpackage's own web/js/character_lookup.js isn't referenced from here — the top-level
# pack's __init__.py flattens every bundled JS file into one shared web/js/ and declares a single
# WEB_DIRECTORY for the whole pack (see its own comment for why).
from .nodes import NODE_CLASS_MAPPINGS as _UPSTREAM_CLASSES

_RENAME = {
    "DanbooruCharacterDetect": "DSM Danbooru Character Detect",
    "DanbooruCharacterLookup": "DSM Danbooru Character Lookup",
}

NODE_CLASS_MAPPINGS = {new: _UPSTREAM_CLASSES[old] for old, new in _RENAME.items()}
NODE_DISPLAY_NAME_MAPPINGS = {new: new for new in _RENAME.values()}

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]
