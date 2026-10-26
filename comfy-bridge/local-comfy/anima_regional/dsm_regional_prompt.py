# A bespoke front end for nodes.py (Sen-sou/Comfyui-Anima-Regional-Conditioning, MIT, unmodified):
# Comfy Bridge's Regional tab sends its boxes as one JSON string, so the whole regional setup is a
# single node in the graph (no mask nodes, no uploaded mask images). Each box becomes a rectangle
# mask + its own text encode, chained into nodes.py's region chain and applied with its patch.
#
# Two additions on top of nodes.py, both here so nodes.py stays byte-identical to upstream:
# - overlap_mode "top": a later box (drawn on top) takes the overlap for itself, so the overlap
#   hears only its prompt (nodes.py's own behaviour, "blend", gives the overlap both prompts).
# - per-box "spread" (0-0.5 of the image's long side): the box's prompt also reaches the area no box
#   covers around it, fading with distance, and the box's tokens can see that area. A box then marks
#   where an element goes, not how big it is. nodes.py builds hard (boolean) attention biases; the
#   two bias builders are wrapped below and relax them only while one of OUR patches is running
#   (a thread-local set by _dsm_wrapper), so nodes.py's own two nodes behave exactly as upstream.
import json
import math
import threading

import torch

import comfy.patcher_extension

from . import nodes as _up
from .nodes import AnimaConditioningRegionChain, ApplyAnimaRegionalConditioningPatch


def _encode(clip, text):
    # What core CLIPTextEncode.encode does, without depending on its class shape.
    return clip.encode_from_tokens_scheduled(clip.tokenize(text))


def _frac(box, key):
    try:
        return min(max(float(box.get(key, 0)), 0.0), 1.0)
    except (TypeError, ValueError):
        return 0.0


def _box_mask(box, mask_w, mask_h):
    """A [1, H, W] mask, 1 inside the box. Box values are fractions of the image (0-1)."""
    x0 = math.floor(_frac(box, "x") * mask_w)
    y0 = math.floor(_frac(box, "y") * mask_h)
    x1 = math.ceil((_frac(box, "x") + _frac(box, "w")) * mask_w)
    y1 = math.ceil((_frac(box, "y") + _frac(box, "h")) * mask_h)
    x1 = min(max(x1, x0 + 1), mask_w)
    y1 = min(max(y1, y0 + 1), mask_h)
    x0 = min(x0, mask_w - 1)
    y0 = min(y0, mask_h - 1)
    mask = torch.zeros((1, mask_h, mask_w), dtype=torch.float32)
    mask[:, y0:y1, x0:x1] = 1.0
    return mask


# ---------------------------------------------------------------------------
# Spread: soft halos around boxes
# ---------------------------------------------------------------------------

_CTX = threading.local()  # .info = (temporal, h_tokens, w_tokens, rects) while our patch runs
_orig_cross_bias = _up._build_flux_cross_attention_bias
_orig_self_bias = _up._build_flux_self_attention_bias
FLOOR = -12.0  # nodes.py's penalty scale for a fully blocked pair


def _halo(rect, t, h, w, device):
    """[t*h*w] in 0-1: 1 at the box's edge, 0 inside it and from `spread` away (long-side units)."""
    x0, y0, x1, y1, spread = rect
    long_side = float(max(h, w))
    ys = (torch.arange(h, device=device, dtype=torch.float32) + 0.5) / h
    xs = (torch.arange(w, device=device, dtype=torch.float32) + 0.5) / w
    dy = torch.clamp(torch.maximum(y0 - ys, ys - y1), min=0.0) * (h / long_side)
    dx = torch.clamp(torch.maximum(x0 - xs, xs - x1), min=0.0) * (w / long_side)
    d = torch.sqrt(dy[:, None] ** 2 + dx[None, :] ** 2)
    halo = torch.clamp(1.0 - d / spread, min=0.0)
    halo[d <= 0] = 0.0  # inside: the box's own mask covers it
    return halo.reshape(-1).repeat(t)


def _relax(block, scale):
    """Penalties in `block` scaled toward 0 by `scale` (1 = unchanged); -inf counts as FLOOR."""
    finite = torch.where(torch.isinf(block), torch.full_like(block, FLOOR), block)
    return torch.maximum(block, finite * scale)


def _spreads(masks):
    info = getattr(_CTX, "info", None)
    if info is None:
        return None
    t, h, w, rects = info
    if masks.shape[1] != t * h * w or masks.shape[0] != len(rects) + 1:
        return None
    covered = masks[1:].any(dim=0)
    out = []
    for i, rect in enumerate(rects):
        if rect[4] <= 0:
            continue
        halo = _halo(rect, t, h, w, masks.device)
        rows = (halo > 0) & ~covered  # only free area; other boxes stay theirs
        if rows.any():
            out.append((i + 1, halo, rows))
    return out


def _cross_bias(masks, text_lengths, base_mode, device, dtype, mask_strength=1.0, slot_strengths=None):
    bias = _orig_cross_bias(masks, text_lengths, base_mode, device, dtype,
                            mask_strength=mask_strength, slot_strengths=slot_strengths)
    spreads = _spreads(masks.to(device)) if mask_strength > 0 else None
    if not spreads:
        return bias
    b = bias[0, 0]
    offsets = [0]
    for n in text_lengths[:-1]:
        offsets.append(offsets[-1] + n)
    base = torch.arange(0, text_lengths[0], device=b.device)
    for slot, halo, rows in spreads:
        r = rows.nonzero(as_tuple=True)[0]
        c = torch.arange(offsets[slot], offsets[slot] + text_lengths[slot], device=b.device)
        hr = halo[r].to(b.dtype)[:, None]
        b[r[:, None], c[None, :]] = _relax(b[r[:, None], c[None, :]], 1.0 - hr)
        # ...and the empty-area prompt gives way near the box, so the box's prompt
        # leads at its edge and fades out with distance.
        if base.numel():
            b[r[:, None], base[None, :]] = torch.minimum(b[r[:, None], base[None, :]], FLOOR * 0.5 * hr)
    return bias


def _self_bias(masks, base_mode, mask_strength, device, dtype, slot_strengths=None):
    bias = _orig_self_bias(masks, base_mode, mask_strength, device, dtype, slot_strengths=slot_strengths)
    spreads = _spreads(masks.to(device)) if mask_strength > 0 else None
    if not spreads:
        return bias
    b = bias[0, 0]
    m = masks.to(b.device)
    for slot, halo, rows in spreads:
        hi = rows.nonzero(as_tuple=True)[0]
        ci = m[slot].nonzero(as_tuple=True)[0]
        if ci.numel() == 0:
            continue
        s = (1.0 - halo[hi]).to(b.dtype)
        # The box sees its halo, and the halo sees the box: the element can grow out coherently.
        b[ci[:, None], hi[None, :]] = _relax(b[ci[:, None], hi[None, :]], s[None, :])
        b[hi[:, None], ci[None, :]] = _relax(b[hi[:, None], ci[None, :]], s[:, None])
    return bias


# nodes.py looks these up by name at call time; without our thread-local they are the originals.
_up._build_flux_cross_attention_bias = _cross_bias
_up._build_flux_self_attention_bias = _self_bias


def _dsm_wrapper(executor, *args, **kwargs):
    opts = kwargs.get("transformer_options", None)
    patch = opts.get(_up.WRAPPER_KEY, None) if isinstance(opts, dict) else None
    rects = getattr(patch, "dsm_rects", None)
    x = args[0] if args else kwargs.get("x", None)
    if not rects or x is None or x.ndim < 5:
        return _up._diffusion_model_wrapper(executor, *args, **kwargs)
    dm = executor.class_obj
    ps = int(getattr(dm, "patch_spatial", 2))
    pt = int(getattr(dm, "patch_temporal", 1))
    grid = (math.ceil(x.shape[2] / pt), math.ceil(x.shape[-2] / ps), math.ceil(x.shape[-1] / ps))
    _CTX.info = grid + (rects,)
    try:
        return _up._diffusion_model_wrapper(executor, *args, **kwargs)
    finally:
        _CTX.info = None


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
                                       "tooltip": 'JSON list of {"x","y","w","h" (0-1 of the image), "text", "weight", "spread"}; later boxes are on top.'}),
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
                "overlap_mode": (["blend", "top"], {"default": "blend",
                                 "tooltip": "Where boxes overlap: both prompts (blend), or only the later box's (top)."}),
            },
        }

    RETURN_TYPES = ("MODEL",)
    RETURN_NAMES = ("model",)
    FUNCTION = "apply"
    CATEGORY = "DataSetManager"

    def apply(self, model, clip, width, height, regions, background_text, layout_end, region_focus, separation, blend,
              background_mode="uncovered_only", background_strength=1.0, layout_start=0.0,
              cross_every_n_blocks=1, self_every_n_blocks=1, overlap_mode="blend"):
        try:
            boxes = json.loads(regions or "[]")
        except json.JSONDecodeError as e:
            raise RuntimeError(f"DSM Anima Regional Prompt: regions is not valid JSON ({e}).")
        if not isinstance(boxes, list):
            raise RuntimeError("DSM Anima Regional Prompt: regions must be a JSON list.")
        # One mask cell per latent pixel; nodes.py resizes to the DiT's token grid itself.
        mask_w = max(1, int(width) // 8)
        mask_h = max(1, int(height) // 8)
        kept = []  # (box, text, weight, mask) in drawing order: later = on top
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
            kept.append((box, text, weight, _box_mask(box, mask_w, mask_h)))
        if not kept:
            return (model,)
        if overlap_mode == "top":
            # Each box gives up what any later box covers.
            for i in range(len(kept)):
                mask = kept[i][3]
                for j in range(i + 1, len(kept)):
                    mask = torch.clamp(mask - kept[j][3], min=0.0)
                kept[i] = kept[i][:3] + (mask,)
        chain = None
        rects = []
        for box, text, weight, mask in kept:
            chain = AnimaConditioningRegionChain(chain, mask, _encode(clip, text), weight)
            try:
                spread = min(max(float(box.get("spread", 0) or 0), 0.0), 1.0)
            except (TypeError, ValueError):
                spread = 0.0
            x, y = _frac(box, "x"), _frac(box, "y")
            rects.append((x, y, min(1.0, x + _frac(box, "w")), min(1.0, y + _frac(box, "h")), spread))
        background = _encode(clip, background_text) if str(background_text).strip() else None
        if background_mode not in ("uncovered_only", "global", "disabled"):
            background_mode = "uncovered_only"
        (patched,) = ApplyAnimaRegionalConditioningPatch().apply(
            model, chain, background_mode, background_strength, max(layout_end, layout_start),
            region_focus, separation, blend, cross_every_n_blocks, self_every_n_blocks,
            start_percent=layout_start, background_conditioning=background,
        )
        if any(r[4] > 0 for r in rects):
            patch = patched.model_options["transformer_options"][_up.WRAPPER_KEY]
            patch.dsm_rects = rects
            patched.remove_wrappers_with_key(comfy.patcher_extension.WrappersMP.DIFFUSION_MODEL, _up.WRAPPER_KEY)
            patched.add_wrapper_with_key(comfy.patcher_extension.WrappersMP.DIFFUSION_MODEL, _up.WRAPPER_KEY, _dsm_wrapper)
        return (patched,)


NODE_CLASS_MAPPINGS = {"DSMAnimaRegionalPrompt": DSMAnimaRegionalPrompt}
NODE_DISPLAY_NAME_MAPPINGS = {"DSMAnimaRegionalPrompt": "DSM Anima Regional Prompt (boxes)"}
