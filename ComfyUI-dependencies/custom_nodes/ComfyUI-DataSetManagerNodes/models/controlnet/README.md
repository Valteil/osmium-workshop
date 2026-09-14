# Bundled ControlNet-LLLite weights

`anima-lllite-any-test-like-v2.safetensors` — pretrained Anima ControlNet-LLLite weights, trained
and published by **kohya-ss**: https://huggingface.co/kohya-ss/Anima-LLLite (check that page for
the license terms attached to the weights themselves; this pack's own GPLv3 `LICENSE` covers the
bundled *code*, not this file).

This pack's `__init__.py` registers this folder as an extra search path for ComfyUI's
`controlnet` model type (`folder_paths.add_model_folder_path`), so this file shows up in SynthDat
Overseer's "ControlNet (Anima-LLLite)" dropdown automatically — nothing to copy into your own
`ComfyUI/models/controlnet/` by hand.

**"Anima ControlNet-LLLite" (LLLite) is its own lightweight ControlNet variant kohya-ss built
specifically for the Anima (DiT-based) model — it is not a standard SD1.5/SDXL ControlNet
checkpoint, and the two are not interchangeable.** The `AnimaLLLiteApply_sdscripts` node
(`anima_lllite/`, this pack) only works with files in this format.

Only the one "any test-like" variant is bundled — it's the one SynthDat Overseer's own default
workflow is tuned against. If you want one of kohya-ss's other published variants (pose-specific,
lineart, etc.) instead, download it from the link above and drop it in here (or in your own
`ComfyUI/models/controlnet/`) — any correctly-formatted file placed in either location shows up in
the dropdown, since the app scrapes the list live rather than hardcoding a filename.
