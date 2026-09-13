# ComfyUI dependencies for SynthDat Overseer

SynthDat Overseer (the Dataset Tag Studio tab that drives ComfyUI to
generate synthetic dataset images) needs a few things installed on your
ComfyUI instance that don't ship with ComfyUI core. This folder collects
everything needed and tells you where each piece goes. None of this is
required for the rest of Dataset Tag Studio — only for the SynthDat
Overseer tab (and the WD14 Autotagger node, which the Tag Overseer tab
also uses).

## 1. Custom node: Apply Anima ControlNet-LLLite (bundled here)

`custom_nodes/ComfyUI-Anima-LLLite/` in this folder is a full copy of
[kohya-ss/ComfyUI-Anima-LLLite](https://github.com/kohya-ss/ComfyUI-Anima-LLLite)
(Apache-2.0 license, included), bundled directly since it's small and
built specifically for this workflow. This provides the
`AnimaLLLiteApply_sdscripts` node ("Apply Anima ControlNet-LLLite
(sd-scripts)") that SynthDat's ControlNet path uses to strong-arm your
character LoRA into the reference pose.

**Install:** copy the `ComfyUI-Anima-LLLite` folder into your ComfyUI's
`custom_nodes/` directory, then restart ComfyUI.

## 2. Custom node packs (install these yourself)

These are large, general-purpose node packs that each happen to provide
one node SynthDat's workflow uses — not bundled here since they're common
and you may already have some of them for other workflows, and a copied-in
snapshot would just go stale. Install each via
[ComfyUI Manager](https://github.com/ltdrdata/ComfyUI-Manager) (search by
name) or `git clone` the URL below into `custom_nodes/`:

| Node used by the workflow | Repo |
|---|---|
| `ImpactSwitch` ("1 = Base 2 = CNET") | https://github.com/ltdrdata/ComfyUI-Impact-Pack |
| `Lora Loader Stack (rgthree)` | https://github.com/rgthree/rgthree-comfy |
| `easy loraNames` | https://github.com/yolain/ComfyUI-Easy-Use |
| `WD14Tagger\|pysssss` (also used by Tag Overseer's WD14 Autotagger) | https://github.com/pythongosssss/ComfyUI-WD14-Tagger |

Everything else in SynthDat's workflow (CLIPLoader, VAELoader, UNETLoader,
KSamplerSelect, BasicScheduler, CFGGuider, SamplerCustomAdvanced,
CLIPTextEncode, LoadImage, VAEDecode, SaveImage, etc.) is built into
ComfyUI core — no extra install needed.

## 3. The ControlNet-LLLite weights file (you need to supply this)

**Important: "Anima ControlNet-LLLite" (LLLite) is its own lightweight
variant of ControlNet that kohya-ss built specifically for the Anima
(DiT-based) model — it is a fork/derivative of the ControlNet concept, not
a standard ControlNet checkpoint, and the two are not interchangeable.** A
regular SD1.5/SDXL ControlNet model will not work with the
`AnimaLLLiteApply_sdscripts` node.

The workflow's `lllite_name` field points at a `.safetensors` file in
ComfyUI's `models/controlnet/` folder — this is NOT bundled in this
project's repo (its own size and licensing terms aren't this project's to
redistribute), but official pretrained weights ARE publicly available:

**https://huggingface.co/kohya-ss/Anima-LLLite**

Download a `.safetensors` file from there (or train your own with
[kohya-ss/sd-scripts](https://github.com/kohya-ss/sd-scripts)) and drop it
into `ComfyUI/models/controlnet/`. Once it's there, it'll show up in
SynthDat Overseer's "ControlNet (Anima-LLLite)" section — the app scrapes
the list of available weights live from your ComfyUI instance rather than
hardcoding a filename, so any correctly-placed file will appear regardless
of what you name it.

If you don't have (or don't want to bother with) LLLite weights at all,
SynthDat Overseer's "I don't want to use a reference image (skip
ControlNet)" checkbox generates without any of this — no weights file, no
reference image, no ControlNet node needed.
