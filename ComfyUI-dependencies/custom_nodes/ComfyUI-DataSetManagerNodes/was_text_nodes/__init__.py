# Source: https://github.com/ltdrdata/was-node-suite-comfyui (MIT, LICENSE in this folder),
# a maintained fork of the original WASasquatch/was-node-suite-comfyui. Modded with a one-line
# safe `numba` import fallback — see README.md in this folder for the exact diff and why.
#
# WAS_Node_Suite.py registers ~229 node classes; only 5 are actually used by SynthDat Overseer's
# workflow (see this pack's SynthDat-Node-Map / README). Rather than exposing the other ~224 under
# their original, very generic names ("Text String", "Lora Loader", etc. — exactly the kind of
# name a user's own real WAS Node Suite install is also likely to register), this only re-exports
# the 5 actually used, under "DSM "-prefixed names, so nothing here can collide with anyone else's
# install. The other ~224 classes still get defined by importing the module (harmless), they're
# just never registered under any name.
from .WAS_Node_Suite import NODE_CLASS_MAPPINGS as _UPSTREAM_CLASSES

_RENAME = {
    "Text Concatenate": "DSM Text Concatenate",
    "Text Contains": "DSM Text Contains",
    "Text Input Switch": "DSM Text Input Switch",
    "Text String": "DSM Text String",
    "Lora Loader": "DSM Lora Loader",
}

NODE_CLASS_MAPPINGS = {new: _UPSTREAM_CLASSES[old] for old, new in _RENAME.items()}
NODE_DISPLAY_NAME_MAPPINGS = {new: new for new in _RENAME.values()}

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]
