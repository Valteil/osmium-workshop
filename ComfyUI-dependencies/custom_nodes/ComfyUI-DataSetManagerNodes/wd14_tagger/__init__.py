# Source: https://github.com/pythongosssss/ComfyUI-WD14-Tagger (MIT, LICENSE in this folder).
# Model weights (.onnx/.csv) are NOT bundled — this node downloads whichever tagger model you pick
# from Settings on first use, same as upstream. Only the small Python source is vendored here.
from .pysssss import init

if init(check_imports=["onnxruntime"]):
    from .wd14tagger import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS
else:
    NODE_CLASS_MAPPINGS = {}
    NODE_DISPLAY_NAME_MAPPINGS = {}

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]
