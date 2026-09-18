# ComfyUI-DataSetManagerNodes

Most of the non-core nodes (and the one ControlNet weights file) Osmium Workshop's **SynthDat
Overseer** needs from your ComfyUI instance, bundled into one self-contained node pack. Copy this
whole folder into `ComfyUI/custom_nodes/` and restart ComfyUI — that's the entire install. No
hunting down several separate third-party packs by hand, no separate ControlNet weights download.

**Every node here is registered under a "DSM " (DataSetManagerNodes)-prefixed name — not its
original upstream name.** That means installing this pack can never collide with (or be silently
shadowed by) any other ComfyUI pack you already have, including the very packs some of these nodes
were extracted from. None of the subfolders below import from each other or from anything outside
this pack either, so there's no shared state to worry about regardless of what else is installed.

**WD14 Autotagger's node is NOT bundled here on purpose** — install
[pythongosssss/ComfyUI-WD14-Tagger](https://github.com/pythongosssss/ComfyUI-WD14-Tagger)
separately for that (via ComfyUI Manager or `git clone` into `custom_nodes/`); Tag Overseer's own
WD14 tab expects that pack's own `WD14Tagger|pysssss` node name specifically.

## What's actually here

Most of these are single nodes trimmed out of a much larger general-purpose pack — this bundles
**only** what SynthDat Overseer's own workflow calls, not the rest of that pack. See each
subfolder's own header comment (top of its `nodes.py`) for exactly what was kept and why.

| Folder | Registers as | Extracted from | License |
|---|---|---|---|
| `anima_lllite/` | `DSM Anima LLLite Apply` (upstream: `AnimaLLLiteApply_sdscripts`) | [kohya-ss/ComfyUI-Anima-LLLite](https://github.com/kohya-ss/ComfyUI-Anima-LLLite) — bundled in full (small pack, purpose-built for this workflow) | Apache-2.0 |
| `danbooru_character_detect/` | `DSM Danbooru Character Detect` (upstream: `DanbooruCharacterDetect`) | Bespoke node built for this project — no upstream repo | — (part of this project) |
| `was_text_nodes/` | `DSM Text Concatenate`, `DSM Text Contains`, `DSM Text Input Switch`, `DSM Text String`, `DSM Lora Loader` | [ltdrdata/was-node-suite-comfyui](https://github.com/ltdrdata/was-node-suite-comfyui) — bundled in full (with a 1-line safe-import fix for `numba`, see its own README.md), only these 5 of its ~229 classes are actually registered | MIT |
| `rgthree_subset/` | `DSM Image Resize`, `DSM Lora Loader Stack` (upstream: `Image Resize (rgthree)`, `Lora Loader Stack (rgthree)`) | [rgthree/rgthree-comfy](https://github.com/rgthree/rgthree-comfy) — 2 of ~50+ nodes | MIT |
| `impact_switch/` | `DSM Switch (Any)` (upstream: `ImpactSwitch`) | [ltdrdata/ComfyUI-Impact-Pack](https://github.com/ltdrdata/ComfyUI-Impact-Pack) — 1 of 100+ nodes | **GPLv3** |
| `easy_lora_names/` | `DSM Lora Name` (upstream: `easy loraNames`) | [yolain/ComfyUI-Easy-Use](https://github.com/yolain/ComfyUI-Easy-Use) — 1 of 100+ nodes | **GPLv3** |
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
   Manager do it) — currently empty (kept for future needs); every node here only needs what
   ComfyUI/PyTorch already bring in.
3. Install [pythongosssss/ComfyUI-WD14-Tagger](https://github.com/pythongosssss/ComfyUI-WD14-Tagger)
   separately if you plan to use Tag Overseer's WD14 Autotagger tab (not bundled here — see above).
4. Restart ComfyUI.

Because every node is registered under a unique "DSM "-prefixed name, you never need to remove any
of the original packs first, even if you already have every one of them installed — there is no
name collision to worry about in either direction.

Once installed, SynthDat Overseer's "ControlNet (Anima-LLLite)" dropdown should show
`anima-lllite-any-test-like-v2` immediately — the bundled weights file is picked up automatically,
nothing to move into your own `models/controlnet/` by hand (see `models/controlnet/README.md`).
