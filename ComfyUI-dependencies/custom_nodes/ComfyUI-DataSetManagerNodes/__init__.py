# ComfyUI-DataSetManagerNodes
#
# One self-contained node pack bundling every non-core node (and the ControlNet weights file)
# Dataset Tag Studio's SynthDat Overseer / WD14 Autotagger workflow needs, so installing this one
# folder is enough — no hunting down 4+ separate third-party packs by hand. Every node below is
# either a bespoke node built for this project, or a specific node trimmed out of a larger
# general-purpose pack (the rest of that pack, and its other dependencies, are NOT included —
# see each subfolder's own header comment for exactly what was kept and why). None of these
# subfolders import from each other or from anything outside this pack, so it doesn't matter
# whether you also have the original packs installed separately — there's no shared state, and
# ComfyUI just picks whichever copy of a given node name loads first.
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
from .was_text_nodes import NODE_CLASS_MAPPINGS as _was_classes
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
from .wd14_tagger import (
    NODE_CLASS_MAPPINGS as _wd14_classes,
    NODE_DISPLAY_NAME_MAPPINGS as _wd14_names,
)

NODE_CLASS_MAPPINGS = {}
NODE_DISPLAY_NAME_MAPPINGS = {}
for _classes, _names in (
    (_anima_lllite_classes, _anima_lllite_names),
    (_danbooru_classes, _danbooru_names),
    (_was_classes, {}),
    (_rgthree_classes, _rgthree_names),
    (_impact_classes, _impact_names),
    (_easy_classes, _easy_names),
    (_wd14_classes, _wd14_names),
):
    NODE_CLASS_MAPPINGS.update(_classes)
    NODE_DISPLAY_NAME_MAPPINGS.update(_names)

# All bundled JS frontend extensions (character_lookup.js from Danbooru Character Detect,
# wd14tagger.js from the WD14 Tagger) live flattened into this one folder, regardless of which
# subpackage they came from — ComfyUI serves a pack's whole WEB_DIRECTORY under one
# /extensions/<this-folder-name>/ URL prefix, so there's no reason to nest them per-subpackage.
WEB_DIRECTORY = "./web/js"

# Registers this pack's own bundled models/controlnet/ folder as an ADDITIONAL search path for
# ComfyUI's "controlnet" model type — not a copy into ComfyUI's own models/controlnet/, so the
# Anima ControlNet-LLLite weights bundled here (see models/controlnet/README.md) show up in
# SynthDat Overseer's ControlNet dropdown immediately after install, with nothing to move by hand.
folder_paths.add_model_folder_path(
    "controlnet", os.path.join(os.path.dirname(__file__), "models", "controlnet")
)

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
