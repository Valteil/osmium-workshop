# Source: https://github.com/kohya-ss/ComfyUI-Anima-LLLite (Apache-2.0, LICENSE in this folder).
#
# Registered under a "DSM " (DataSetManagerNodes)-prefixed name instead of upstream's own
# "AnimaLLLiteApply_sdscripts" — this pack is meant to install cleanly alongside (or instead of)
# any other ComfyUI packs a user already has, including the original standalone
# ComfyUI-Anima-LLLite, without either one's node silently winning a name collision. nodes.py
# itself is untouched from upstream; the rename happens only here, at registration.
from .nodes import NODE_CLASS_MAPPINGS as _UPSTREAM_CLASSES

_RENAME = {
    "AnimaLLLiteApply_sdscripts": "DSM Anima LLLite Apply",
}

NODE_CLASS_MAPPINGS = {new: _UPSTREAM_CLASSES[old] for old, new in _RENAME.items()}
NODE_DISPLAY_NAME_MAPPINGS = {new: new for new in _RENAME.values()}

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]
