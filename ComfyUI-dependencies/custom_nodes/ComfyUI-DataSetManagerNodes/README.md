# ComfyUI-DataSetManagerNodes

Every non-core node (and the one ControlNet weights file) Dataset Tag Studio's **SynthDat
Overseer** and **WD14 Autotagger** need from your ComfyUI instance, bundled into one self-contained
node pack. Copy this whole folder into `ComfyUI/custom_nodes/` and restart ComfyUI — that's the
entire install. No hunting down 4+ separate third-party packs by hand, no separate ControlNet
weights download.

None of the subfolders below import from each other or from anything outside this pack, so it
doesn't matter whether you also have any of the original packs installed separately — there's no
shared state, and ComfyUI just uses whichever copy of a given node name loads first.

## What's actually here

Most of these are single nodes trimmed out of a much larger general-purpose pack — this bundles
**only** what Dataset Tag Studio's own workflow calls, not the rest of that pack. See each
subfolder's own header comment (top of its `nodes.py`) for exactly what was kept and why.

| Folder | Node(s) it provides | Extracted from | License |
|---|---|---|---|
| `anima_lllite/` | `AnimaLLLiteApply_sdscripts` ("Apply Anima ControlNet-LLLite (sd-scripts)") | [kohya-ss/ComfyUI-Anima-LLLite](https://github.com/kohya-ss/ComfyUI-Anima-LLLite) — bundled in full (small pack, purpose-built for this workflow) | Apache-2.0 |
| `danbooru_character_detect/` | `Danbooru Character Detect` | Bespoke node built for this project — no upstream repo | — (part of this project) |
| `was_text_nodes/` | `Text Concatenate`, `Text Contains`, `Text Input Switch`, `Text String`, `Lora Loader` | [ltdrdata/was-node-suite-comfyui](https://github.com/ltdrdata/was-node-suite-comfyui) — bundled in full (with a 1-line safe-import fix for `numba`, see its own README.md) | MIT |
| `rgthree_subset/` | `Image Resize (rgthree)`, `Lora Loader Stack (rgthree)` | [rgthree/rgthree-comfy](https://github.com/rgthree/rgthree-comfy) — 2 of ~50+ nodes | MIT |
| `impact_switch/` | `ImpactSwitch` ("Switch (Any)") | [ltdrdata/ComfyUI-Impact-Pack](https://github.com/ltdrdata/ComfyUI-Impact-Pack) — 1 of 100+ nodes | **GPLv3** |
| `easy_lora_names/` | `easy loraNames` ("Lora Names") | [yolain/ComfyUI-Easy-Use](https://github.com/yolain/ComfyUI-Easy-Use) — 1 of 100+ nodes | **GPLv3** |
| `wd14_tagger/` | `WD14Tagger\|pysssss` | [pythongosssss/ComfyUI-WD14-Tagger](https://github.com/pythongosssss/ComfyUI-WD14-Tagger) — bundled in full (small pack) | MIT |
| `models/controlnet/` | `anima-lllite-any-test-like-v2.safetensors` (not a node — the ControlNet-LLLite weights file itself) | [kohya-ss/Anima-LLLite](https://huggingface.co/kohya-ss/Anima-LLLite) on Hugging Face | see that page |

**License note:** because this pack redistributes GPLv3-licensed code (`impact_switch/`,
`easy_lora_names/`) as part of one combined work, the pack as a whole is offered under GPLv3 (see
`LICENSE` in this folder) — the MIT/Apache-2.0 files keep their own original license too (each
subfolder has its own `LICENSE`), GPLv3 doesn't relicense them, it just governs the combined
redistribution.

Everything else the workflow uses (`CLIPLoader`, `VAELoader`, `UNETLoader`, `KSamplerSelect`,
`BasicScheduler`, `CFGGuider`, `SamplerCustomAdvanced`, `CLIPTextEncode`, `LoadImage`,
`VAEDecode`, `SaveImage`, `PreviewAny`, `LoraLoaderModelOnly`, the typed Primitive nodes, etc.) is
built into ComfyUI core — no extra install needed for any of that.

## Install

1. Copy this entire `ComfyUI-DataSetManagerNodes/` folder into your ComfyUI's `custom_nodes/`
   directory (keep the folder name, or rename it — either works, `__init__.py` is what ComfyUI
   reads).
2. `pip install -r requirements.txt` inside your ComfyUI's Python environment (or let ComfyUI
   Manager do it) — just `onnxruntime`, for the WD14 tagger.
3. Restart ComfyUI.

If you already have any of the original packs above installed separately, you don't need to
remove them first — this pack doesn't conflict with them, it just means ComfyUI will have two
copies of a couple of node names registered (harmless "duplicate node" log noise at most).

Once installed, SynthDat Overseer's "ControlNet (Anima-LLLite)" dropdown should show
`anima-lllite-any-test-like-v2` immediately — the bundled weights file is picked up automatically,
nothing to move into your own `models/controlnet/` by hand (see `models/controlnet/README.md`).
