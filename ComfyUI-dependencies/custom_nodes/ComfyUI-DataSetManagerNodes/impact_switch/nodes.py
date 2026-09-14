# Extracted from https://github.com/ltdrdata/ComfyUI-Impact-Pack (GPLv3, LICENSE in this folder)
# — Impact-Pack is a large general-purpose node pack (100+ nodes across detection/segmentation/
# upscaling); this file keeps only the "ImpactSwitch" node (upstream class `GeneralSwitch`,
# modules/impact/util_nodes.py) that SynthDat Overseer's workflow uses to pick between its base
# and ControlNet generation paths. Logic is unmodified from upstream; two small helpers it relied
# on from sibling modules (impact.utils.any_typ, impact.core.is_execution_model_version_supported)
# are inlined below instead of importing Impact-Pack's own module tree, which this trimmed copy
# doesn't include.
#
# GPLv3 note: this file is a derivative of GPLv3-licensed code and is itself distributed under
# GPLv3 — see this pack's top-level LICENSE.
import inspect
import logging


class _AnyType(str):
    """A type that always compares equal to any other type — lets a switch's dynamic 'inputN'
    slots accept any ComfyUI data type. Equivalent to Impact-Pack's impact.utils.AnyType."""
    def __ne__(self, __value: object) -> bool:
        return False


any_typ = _AnyType("*")


def _is_execution_model_version_supported():
    try:
        import comfy_execution  # noqa: F401
        return True
    except Exception:
        return False


class GeneralSwitch:
    @classmethod
    def INPUT_TYPES(s):
        dyn_inputs = {
            "input1": (any_typ, {
                "lazy": True,
                "tooltip": "Any input. When connected, one more input slot is added.",
            }),
        }
        if _is_execution_model_version_supported():
            stack = inspect.stack()
            if stack[2].function == 'get_input_info':
                class AllContainer:
                    def __contains__(self, item):
                        return True

                    def __getitem__(self, key):
                        return any_typ, {"lazy": True}

                dyn_inputs = AllContainer()

        return {
            "required": {
                "select": ("INT", {
                    "default": 1, "min": 1, "max": 999999, "step": 1,
                    "tooltip": "The input number you want to output among the inputs",
                }),
                "sel_mode": ("BOOLEAN", {
                    "default": False, "label_on": "select_on_prompt",
                    "label_off": "select_on_execution", "forceInput": False,
                    "tooltip": (
                        "In the case of 'select_on_execution', the selection is dynamically "
                        "determined at the time of workflow execution. 'select_on_prompt' is an "
                        "option that exists for older versions of ComfyUI, and it makes the "
                        "decision before the workflow execution."
                    ),
                }),
            },
            "optional": dyn_inputs,
            "hidden": {"unique_id": "UNIQUE_ID", "extra_pnginfo": "EXTRA_PNGINFO"},
        }

    RETURN_TYPES = (any_typ, "STRING", "INT")
    RETURN_NAMES = ("selected_value", "selected_label", "selected_index")
    OUTPUT_TOOLTIPS = (
        "Output is generated only from the input chosen by the 'select' value.",
        "Slot label of the selected input slot",
        "Outputs the select value as is",
    )
    FUNCTION = "doit"
    CATEGORY = "DataSetManagerNodes"

    def check_lazy_status(self, *args, **kwargs):
        selected_index = int(kwargs['select'])
        input_name = f"input{selected_index}"
        logging.info(f"SELECTED: {input_name}")
        if input_name in kwargs:
            return [input_name]
        return []

    @staticmethod
    def doit(*args, **kwargs):
        selected_index = int(kwargs['select'])
        input_name = f"input{selected_index}"

        selected_label = input_name
        node_id = kwargs['unique_id']

        if 'extra_pnginfo' in kwargs and kwargs['extra_pnginfo'] is not None:
            nodelist = kwargs['extra_pnginfo']['workflow']['nodes']
            for node in nodelist:
                if str(node['id']) == node_id:
                    inputs = node['inputs']
                    for slot in inputs:
                        if slot['name'] == input_name and 'label' in slot:
                            selected_label = slot['label']
                    break
        else:
            logging.info("[DataSetManagerNodes] ImpactSwitch does not guarantee proper "
                          "functioning in API mode.")

        if input_name in kwargs:
            return kwargs[input_name], selected_label, selected_index
        logging.info("ImpactSwitch: invalid select index (ignored)")
        return None, "", selected_index


NODE_CLASS_MAPPINGS = {
    "ImpactSwitch": GeneralSwitch,
}
NODE_DISPLAY_NAME_MAPPINGS = {
    "ImpactSwitch": "Switch (Any)",
}
