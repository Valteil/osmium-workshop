# ComfyUI-DataSetManagerNodes
#
# One self-contained node pack bundling every non-core node (and the ControlNet weights file)
# Osmium Workshop's SynthDat Overseer workflow needs, so installing this one folder covers most
# of it — no hunting down several separate third-party packs by hand. (WD14 Autotagger's own node
# is NOT bundled here — see wd14_tagger note in README.md — install
# pythongosssss/ComfyUI-WD14-Tagger separately for that.) Every node below is either a bespoke node
# built for this project, or a specific node trimmed out of a larger general-purpose pack (the rest
# of that pack, and its other dependencies, are NOT included — see each subfolder's own header
# comment for exactly what was kept and why).
#
# Every node is registered under a "DSM " (DataSetManagerNodes)-prefixed name, not its original
# upstream name — see each subfolder's own __init__.py for the exact rename. This means installing
# this pack can NEVER collide with (or be silently shadowed by) any other ComfyUI pack a user
# already has, including the very packs these nodes were extracted from. None of these subfolders
# import from each other or from anything outside this pack either, so there's no shared state to
# worry about regardless of what else is installed.
#
# Full credits, licenses, and upstream links: see README.md in this folder.
import os
import folder_paths

from .anima_lllite import (
    NODE_CLASS_MAPPINGS as _anima_lllite_classes,
    NODE_DISPLAY_NAME_MAPPINGS as _anima_lllite_names,
)
from .danbooru_character_detect import (
    NODE_CLASS_MAPPINGS as _danbooru_classes,
    NODE_DISPLAY_NAME_MAPPINGS as _danbooru_names,
)
from .was_text_nodes import (
    NODE_CLASS_MAPPINGS as _was_classes,
    NODE_DISPLAY_NAME_MAPPINGS as _was_names,
)
from .rgthree_subset import (
    NODE_CLASS_MAPPINGS as _rgthree_classes,
    NODE_DISPLAY_NAME_MAPPINGS as _rgthree_names,
)
from .impact_switch import (
    NODE_CLASS_MAPPINGS as _impact_classes,
    NODE_DISPLAY_NAME_MAPPINGS as _impact_names,
)
from .easy_lora_names import (
    NODE_CLASS_MAPPINGS as _easy_classes,
    NODE_DISPLAY_NAME_MAPPINGS as _easy_names,
)

NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}
for _classes, _names in (
    (_anima_lllite_classes, _anima_lllite_names),
    (_danbooru_classes, _danbooru_names),
    (_was_classes, _was_names),
    (_rgthree_classes, _rgthree_names),
    (_impact_classes, _impact_names),
    (_easy_classes, _easy_names),
):
    NODE_CLASS_MAPPINGS.update(_classes)
    NODE_DISPLAY_NAME_MAPPINGS.update(_names)

# character_lookup.js (Danbooru Character Detect's frontend widget) lives flattened into this one
# folder rather than nested per-subpackage — ComfyUI serves a pack's whole WEB_DIRECTORY under one
# /extensions/<this-folder-name>/ URL prefix, so there's no reason to nest it.
WEB_DIRECTORY = "./web/js"

# Registers this pack's own bundled models/controlnet/ folder as an ADDITIONAL search path for
# ComfyUI's "controlnet" model type — not a copy into ComfyUI's own models/controlnet/, so the
# Anima ControlNet-LLLite weights bundled here (see models/controlnet/README.md) show up in
# SynthDat Overseer's ControlNet dropdown immediately after install, with nothing to move by hand.
folder_paths.add_model_folder_path(
    "controlnet", os.path.join(os.path.dirname(__file__), "models", "controlnet")
)

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
