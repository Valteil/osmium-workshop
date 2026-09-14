# Source: https://github.com/ltdrdata/was-node-suite-comfyui (MIT, LICENSE in this folder),
# a maintained fork of the original WASasquatch/was-node-suite-comfyui. Modded with a one-line
# safe `numba` import fallback — see README.md in this folder for the exact diff and why.
from .WAS_Node_Suite import NODE_CLASS_MAPPINGS

__all__ = ["NODE_CLASS_MAPPINGS"]
