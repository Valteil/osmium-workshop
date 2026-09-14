# Extracted from https://github.com/rgthree/rgthree-comfy (MIT, LICENSE in this folder) —
# rgthree-comfy is a large general-purpose node pack; this file keeps only the two node classes
# SynthDat Overseer's workflow actually uses ("Image Resize (rgthree)" and
# "Lora Loader Stack (rgthree)"), trimmed of the rest of the pack (~50 other nodes, a JS frontend
# extension, a settings service, etc.) that nothing here calls. Logic is unmodified from upstream
# (py/image_resize.py, py/lora_stack.py as of the version vendored) — only the `from .constants
# import get_name, get_category` indirection was inlined below, since that module exists solely to
# generate the "(rgthree)" suffix on node display names, which is reproduced verbatim.
import torch
import comfy.utils
import folder_paths
import nodes


def _rgthree_name(name):
    return "{} (rgthree)".format(name)


class RgthreeImageResize:
    """Image Resize (rgthree) — resize with crop/pad/contain fit modes."""

    NAME = _rgthree_name("Image Resize")
    CATEGORY = "rgthree"

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "image": ("IMAGE",),
                "measurement": (["pixels", "percentage"],),
                "width": (
                    "INT", {
                        "default": 0,
                        "min": 0,
                        "max": nodes.MAX_RESOLUTION,
                        "step": 1,
                        "tooltip": (
                            "The width of the desired resize. A pixel value if measurement is "
                            "'pixels' or a 100% scale percentage value if measurement is "
                            "'percentage'. Passing '0' will calculate the dimension based on the "
                            "height."
                        ),
                    },
                ),
                "height": ("INT", {
                    "default": 0,
                    "min": 0,
                    "max": nodes.MAX_RESOLUTION,
                    "step": 1
                }),
                "fit": (["crop", "pad", "contain"], {
                    "tooltip": (
                        "'crop' resizes so the image covers the desired width and height, and "
                        "center-crops the excess, returning exactly the desired width and height."
                        "\n'pad' resizes so the image fits inside the desired width and height, "
                        "and fills the empty space returning exactly the desired width and "
                        "height."
                        "\n'contain' resizes so the image fits inside the desired width and "
                        "height, and returns the image with it's new size, with one side likely "
                        "smaller than the desired."
                        "\n\nNote, if either width or height is '0', the effective fit is "
                        "'contain'."
                    )
                }),
                "method": (nodes.ImageScale.upscale_methods,),
            },
        }

    RETURN_TYPES = ("IMAGE", "INT", "INT",)
    RETURN_NAMES = ("IMAGE", "WIDTH", "HEIGHT",)
    FUNCTION = "main"
    DESCRIPTION = """Resize the image."""

    def main(self, image, measurement, width, height, method, fit):
        """Resizes the image."""
        _, H, W, _ = image.shape

        if measurement == "percentage":
            width = round(width * W / 100)
            height = round(height * H / 100)

        if (width == 0 and height == 0) or (width == W and height == H):
            return (image, W, H)

        # If one dimension is 0, calculate it from the ratio of the set dimension — this also
        # implies a 'contain' fit since width/height end up scaled with a locked aspect ratio.
        if width == 0 or height == 0:
            width = round(height / H * W) if width == 0 else width
            height = round(width / W * H) if height == 0 else height
            fit = "contain"

        resized_width = width
        resized_height = height
        if fit == "crop":
            if (height / H * W) > width:
                resized_width = round(height / H * W)
            elif (width / W * H) > height:
                resized_height = round(width / W * H)
        elif fit == "contain" or fit == "pad":
            if (height / H * W) > width:
                resized_height = round(width / W * H)
            elif (width / W * H) > height:
                resized_width = round(height / H * W)

        out_image = comfy.utils.common_upscale(
            image.clone().movedim(-1, 1), resized_width, resized_height, method, crop="disabled"
        ).movedim(1, -1)
        OB, OH, OW, OC = out_image.shape

        if fit != "contain":
            if OW > width:
                out_image = out_image.narrow(-2, (OW - width) // 2, width)
            if OH > height:
                out_image = out_image.narrow(-3, (OH - height) // 2, height)

            OB, OH, OW, OC = out_image.shape
            if width != OW or height != OH:
                padded_image = torch.zeros(
                    (OB, height, width, OC), dtype=image.dtype, device=image.device
                )
                x = (width - OW) // 2
                y = (height - OH) // 2
                for b in range(OB):
                    padded_image[b, y:y + OH, x:x + OW, :] = out_image[b]
                out_image = padded_image

        return (out_image, out_image.shape[2], out_image.shape[1])


class RgthreeLoraLoaderStack:
    """Lora Loader Stack (rgthree) — up to 4 LoRAs applied in sequence."""

    NAME = _rgthree_name("Lora Loader Stack")
    CATEGORY = "rgthree"

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "model": ("MODEL",),
                "clip": ("CLIP",),

                "lora_01": (["None"] + folder_paths.get_filename_list("loras"),),
                "strength_01": ("FLOAT", {"default": 1.0, "min": -10.0, "max": 10.0, "step": 0.01}),

                "lora_02": (["None"] + folder_paths.get_filename_list("loras"),),
                "strength_02": ("FLOAT", {"default": 1.0, "min": -10.0, "max": 10.0, "step": 0.01}),

                "lora_03": (["None"] + folder_paths.get_filename_list("loras"),),
                "strength_03": ("FLOAT", {"default": 1.0, "min": -10.0, "max": 10.0, "step": 0.01}),

                "lora_04": (["None"] + folder_paths.get_filename_list("loras"),),
                "strength_04": ("FLOAT", {"default": 1.0, "min": -10.0, "max": 10.0, "step": 0.01}),
            }
        }

    RETURN_TYPES = ("MODEL", "CLIP")
    FUNCTION = "load_lora"

    def load_lora(self, model, clip, lora_01, strength_01, lora_02, strength_02,
                  lora_03, strength_03, lora_04, strength_04):
        from nodes import LoraLoader
        if lora_01 != "None" and strength_01 != 0:
            model, clip = LoraLoader().load_lora(model, clip, lora_01, strength_01, strength_01)
        if lora_02 != "None" and strength_02 != 0:
            model, clip = LoraLoader().load_lora(model, clip, lora_02, strength_02, strength_02)
        if lora_03 != "None" and strength_03 != 0:
            model, clip = LoraLoader().load_lora(model, clip, lora_03, strength_03, strength_03)
        if lora_04 != "None" and strength_04 != 0:
            model, clip = LoraLoader().load_lora(model, clip, lora_04, strength_04, strength_04)

        return (model, clip)


NODE_CLASS_MAPPINGS = {
    RgthreeImageResize.NAME: RgthreeImageResize,
    RgthreeLoraLoaderStack.NAME: RgthreeLoraLoaderStack,
}
NODE_DISPLAY_NAME_MAPPINGS = {
    RgthreeImageResize.NAME: "Image Resize (rgthree)",
    RgthreeLoraLoaderStack.NAME: "Lora Loader Stack (rgthree)",
}
