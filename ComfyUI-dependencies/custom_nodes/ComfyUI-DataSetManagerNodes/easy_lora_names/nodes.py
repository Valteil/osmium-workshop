# Extracted from https://github.com/yolain/ComfyUI-Easy-Use (GPLv3, LICENSE in this folder) —
# Easy-Use is a large general-purpose node pack (100+ nodes); this file keeps only the
# "easy loraNames" node (upstream class `setLoraName`, py/nodes/util.py) that SynthDat Overseer's
# workflow uses to read back a chosen LoRA's filename for the output filename chain. Logic is
# unmodified from upstream; the one helper it relied on from a sibling module
# (libs.utils.AlwaysEqualProxy) is inlined below instead of importing Easy-Use's own module tree,
# which this trimmed copy doesn't include.
#
# GPLv3 note: this file is a derivative of GPLv3-licensed code and is itself distributed under
# GPLv3 — see this pack's top-level LICENSE.
import folder_paths


class _AlwaysEqualProxy(str):
    """A string that compares equal to everything — used here so this node's output type accepts
    any downstream input, matching Easy-Use's own libs.utils.AlwaysEqualProxy."""
    def __eq__(self, _):
        return True

    def __ne__(self, _):
        return False


class EasySetLoraName:
    NAME = "easy loraNames"

    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {
            "lora_name": (folder_paths.get_filename_list("loras"),),
        }}

    RETURN_TYPES = (_AlwaysEqualProxy('*'),)
    RETURN_NAMES = ("lora_name",)
    FUNCTION = "set_name"
    CATEGORY = "DataSetManagerNodes"

    def set_name(self, lora_name):
        return (lora_name,)


NODE_CLASS_MAPPINGS = {
    EasySetLoraName.NAME: EasySetLoraName,
}
NODE_DISPLAY_NAME_MAPPINGS = {
    EasySetLoraName.NAME: "Lora Names",
}
