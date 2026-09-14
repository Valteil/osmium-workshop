# ComfyUI dependencies for SynthDat Overseer

SynthDat Overseer (the Dataset Tag Studio tab that drives ComfyUI to generate synthetic dataset
images) needs a few things installed on your ComfyUI instance that don't ship with ComfyUI core —
same for the WD14 Autotagger node the Tag Overseer tab uses. None of this is required for the rest
of Dataset Tag Studio.

## Install: one folder

**`custom_nodes/ComfyUI-DataSetManagerNodes/`** bundles every node this app needs — nine node
types extracted from six different third-party packs, plus a bespoke node built for this project,
plus the Anima ControlNet-LLLite weights file itself — into one self-contained pack, instead of
needing to track down and install 4+ separate node packs by hand. Copy that whole folder into your
ComfyUI's `custom_nodes/` directory, `pip install -r` its `requirements.txt` (just `onnxruntime`),
and restart ComfyUI. That's the entire install.

See **`custom_nodes/ComfyUI-DataSetManagerNodes/README.md`** for the full per-node credit table
(which node came from which upstream repo, and under what license), and each node's own subfolder
for exactly what was trimmed out of its source pack and why.

## Everything else is ComfyUI core

CLIPLoader, VAELoader, UNETLoader, KSamplerSelect, BasicScheduler, CFGGuider,
SamplerCustomAdvanced, CLIPTextEncode, LoadImage, VAEDecode, SaveImage, PreviewAny,
LoraLoaderModelOnly, the typed Primitive nodes, etc. are all built into ComfyUI itself — no extra
install needed for any of that. (`PreviewAny` looks custom by name but lives in ComfyUI's own
`comfy_extras/nodes_preview_any.py` — confirmed by grepping a real ComfyUI install, not assumed.)

If you don't want to use ControlNet at all, SynthDat Overseer's "I don't want to use a reference
image (skip ControlNet)" checkbox generates without any of that path — no weights file, no
reference image, no ControlNet node needed, and you can skip installing `ComfyUI-DataSetManagerNodes`'s
`anima_lllite/`/`impact_switch/` pieces mentally (they just won't be exercised).
