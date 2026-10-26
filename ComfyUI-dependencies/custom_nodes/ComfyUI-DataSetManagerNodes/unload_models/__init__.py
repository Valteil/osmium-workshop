# A bespoke node for Comfy Bridge's USDU upscale: a pass-through that unloads every model from
# VRAM once its image exists, so the upscale doesn't share the GPU with the models that made the
# image (e.g. Anima). Osmium Comfy's runner defines the same node itself.
import comfy.model_management


class DSMUnloadModels:
    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {"image": ("IMAGE",)}}

    RETURN_TYPES = ("IMAGE",)
    FUNCTION = "run"
    CATEGORY = "DataSetManager"

    def run(self, image):
        comfy.model_management.unload_all_models()
        comfy.model_management.soft_empty_cache()
        return (image,)


NODE_CLASS_MAPPINGS = {"DSMUnloadModels": DSMUnloadModels}
NODE_DISPLAY_NAME_MAPPINGS = {"DSMUnloadModels": "DSM Unload Models (pass-through)"}

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]
