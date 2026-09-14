# WD14 Tagger

Bundled in full from
[pythongosssss/ComfyUI-WD14-Tagger](https://github.com/pythongosssss/ComfyUI-WD14-Tagger) (MIT,
`LICENSE` in this folder) — it's already a small, focused pack (~450 lines across
`wd14tagger.py`/`pysssss.py`), so nothing needed trimming. Provides the `WD14Tagger|pysssss` node
Tag Overseer's WD14 Autotagger tab drives directly over ComfyUI's API.

**Model weights (`.onnx`/`.csv`) are NOT bundled** — same as upstream, the node downloads whichever
tagger model you pick from ComfyUI's own Settings the first time it's used, into this folder's own
`models/` subfolder (created automatically). Only `onnxruntime` (see this pack's top-level
`requirements.txt`) needs to be installed ahead of time.
