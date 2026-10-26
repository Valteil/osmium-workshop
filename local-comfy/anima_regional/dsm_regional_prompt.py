# A bespoke front end for nodes.py (Sen-sou/Comfyui-Anima-Regional-Conditioning, MIT, unmodified):
# Comfy Bridge's Regional tab sends its boxes as one JSON string, so the whole regional setup is a
# single node in the graph (no mask nodes, no uploaded mask images). Each box becomes a rectangle
# mask + its own text encode, chained into nodes.py's region chain and applied with its patch.
import json
import math

import torch

from .nodes import AnimaConditioningRegionChain, ApplyAnimaRegionalConditioningPatch


def _encode(clip, text):
    # What core CLIPTextEncode.encode does, without depending on its class shape.
    return clip.encode_from_tokens_scheduled(clip.tokenize(text))


def _box_mask(box, mask_w, mask_h):
    """A [1, H, W] mask, 1 inside the box. Box values are fractions of the image (0-1)."""
    def frac(key):
        try:
            return min(max(float(box.get(key, 0)), 0.0), 1.0)
        except (TypeError, ValueError):
            return 0.0
    x0 = math.floor(frac("x") * mask_w)
    y0 = math.floor(frac("y") * mask_h)
    x1 = math.ceil((frac("x") + frac("w")) * mask_w)
    y1 = math.ceil((frac("y") + frac("h")) * mask_h)
    x1 = min(max(x1, x0 + 1), mask_w)
    y1 = min(max(y1, y0 + 1), mask_h)
    x0 = min(x0, mask_w - 1)
    y0 = min(y0, mask_h - 1)
    mask = torch.zeros((1, mask_h, mask_w), dtype=torch.float32)
    mask[:, y0:y1, x0:x1] = 1.0
    return mask


class DSMAnimaRegionalPrompt:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "model": ("MODEL",),
                "clip": ("CLIP",),
                "width": ("INT", {"default": 1024, "min": 16, "max": 16384, "step": 8}),
                "height": ("INT", {"default": 1024, "min": 16, "max": 16384, "step": 8}),
                "regions": ("STRING", {"multiline": True, "default": "[]",
                                       "tooltip": 'JSON list of {"x","y","w","h" (0-1 of the image), "text", "weight"}.'}),
                "background_text": ("STRING", {"multiline": True, "default": "",
                                               "tooltip": "Prompt for the area no box covers. Empty = the sampler's own prompt."}),
                "layout_end": ("FLOAT", {"default": 0.35, "min": 0.0, "max": 1.0, "step": 0.01,
                                         "tooltip": "Share of the steps the regions steer; the rest use the whole-image prompt only."}),
                "region_focus": ("FLOAT", {"default": 1.0, "min": 0.0, "max": 1.0, "step": 0.01,
                                           "tooltip": "Cross-attention masking: 1 = each box only hears its own prompt."}),
                "separation": ("FLOAT", {"default": 0.2, "min": 0.0, "max": 1.0, "step": 0.01,
                                         "tooltip": "Self-attention masking: higher keeps regions apart, too high gives hard seams."}),
                "blend": ("FLOAT", {"default": 0.1, "min": 0.0, "max": 1.0, "step": 0.01,
                                    "tooltip": "Share of the unpatched (whole-prompt) prediction mixed back in, for cohesion."}),
            },
            # The rest of nodes.py's patch options. Optional, so graphs saved
            # before they were exposed still validate (defaults = before).
            "optional": {
                "background_mode": (["uncovered_only", "global", "disabled"], {"default": "uncovered_only",
                                    "tooltip": "Where background_text applies: only where no box is, everywhere (under the boxes too), or nowhere."}),
                "background_strength": ("FLOAT", {"default": 1.0, "min": 0.0, "max": 1.0, "step": 0.01}),
                "layout_start": ("FLOAT", {"default": 0.0, "min": 0.0, "max": 1.0, "step": 0.01,
                                           "tooltip": "Share of the steps before the regions start steering."}),
                "cross_every_n_blocks": ("INT", {"default": 1, "min": 1, "max": 100,
                                                 "tooltip": "Route prompts in every Nth transformer block (1 = all)."}),
                "self_every_n_blocks": ("INT", {"default": 1, "min": 1, "max": 100,
                                                "tooltip": "Separate regions in every Nth transformer block (1 = all)."}),
            },
        }

    RETURN_TYPES = ("MODEL",)
    RETURN_NAMES = ("model",)
    FUNCTION = "apply"
    CATEGORY = "DataSetManager"

    def apply(self, model, clip, width, height, regions, background_text, layout_end, region_focus, separation, blend,
              background_mode="uncovered_only", background_strength=1.0, layout_start=0.0,
              cross_every_n_blocks=1, self_every_n_blocks=1):
        try:
            boxes = json.loads(regions or "[]")
        except json.JSONDecodeError as e:
            raise RuntimeError(f"DSM Anima Regional Prompt: regions is not valid JSON ({e}).")
        if not isinstance(boxes, list):
            raise RuntimeError("DSM Anima Regional Prompt: regions must be a JSON list.")
        # One mask cell per latent pixel; nodes.py resizes to the DiT's token grid itself.
        mask_w = max(1, int(width) // 8)
        mask_h = max(1, int(height) // 8)
        chain = None
        for box in boxes:
            if not isinstance(box, dict):
                continue
            text = str(box.get("text", "")).strip()
            if not text:
                continue
            try:
                weight = float(box.get("weight", 1.0))
            except (TypeError, ValueError):
                weight = 1.0
            chain = AnimaConditioningRegionChain(chain, _box_mask(box, mask_w, mask_h), _encode(clip, text), weight)
        if chain is None:
            return (model,)
        background = _encode(clip, background_text) if str(background_text).strip() else None
        if background_mode not in ("uncovered_only", "global", "disabled"):
            background_mode = "uncovered_only"
        return ApplyAnimaRegionalConditioningPatch().apply(
            model, chain, background_mode, background_strength, max(layout_end, layout_start),
            region_focus, separation, blend, cross_every_n_blocks, self_every_n_blocks,
            start_percent=layout_start, background_conditioning=background,
        )


NODE_CLASS_MAPPINGS = {"DSMAnimaRegionalPrompt": DSMAnimaRegionalPrompt}
NODE_DISPLAY_NAME_MAPPINGS = {"DSMAnimaRegionalPrompt": "DSM Anima Regional Prompt (boxes)"}
