# WAS Node Suite (modded — safe numba import)

Bundled here in full because the fix that makes it load on a newer PyTorch/NumPy is a
one-line change to how the file imports `numba` at the very top — before any of its ~200 node
classes are even defined. If that import throws (which it does on some newer NumPy builds numba
hasn't caught up to), the ENTIRE file fails to load and every WAS node disappears from ComfyUI at
once — not just the ones that actually use numba. That's the "not the nodes, the whole way it's
loaded" distinction: this isn't a per-node bugfix, it's a load-time guard that decides whether the
file loads AT ALL.

## The actual mod

Based on [ltdrdata/was-node-suite-comfyui](https://github.com/ltdrdata/was-node-suite-comfyui) (a
maintained fork of the original, now-retired WASasquatch pack — MIT licensed, `LICENSE` included).
The only change from that upstream:

```diff
-from numba import jit
+try:
+    from numba import jit
+except ImportError:
+    # numba failed to import (e.g. incompatible with the installed NumPy
+    # version). Fall back to a no-op decorator so the rest of WAS Node
+    # Suite still loads; only the JIT-accelerated Perlin noise / ambient
+    # occlusion helpers run at plain Python speed instead of compiled
+    # speed. Everything else — including the nodes SynthDat actually
+    # uses (Text Concatenate/Contains/Input Switch/String, Lora Loader)
+    # — is unaffected either way, since none of them touch numba at all.
+    def jit(*_jit_args, **_jit_kwargs):
+        def _decorator(func):
+            return func
+        return _decorator
```

If your own ComfyUI environment's numba already imports fine against upstream WAS, you don't
strictly need this modded copy — but installing it instead never hurts, since the fallback only
ever activates when the plain import would have failed anyway.

## What's NOT included (present in the real ~50MB pack, not needed here)

- `modules/` (BLIP image-captioning support — only used by WAS's own BLIP interrogation node,
  which nothing in this project's workflow calls)
- `repos/`, `res/` (support data for other WAS nodes this project doesn't use)
- `.git/` (20MB of history, not source)
- Runtime state files (`was_history.json`, `was_suite_config.json`, `was_suite_settings.json`) —
  WAS regenerates these itself on first run

`requirements.txt` is included as-is (upstream's full list for all ~200 nodes) for reference, but
SynthDat's own workflow only actually needs the five text-utility nodes below to load — none of
which touch numba, OpenCV, transformers, or any of the other heavier entries in that file. In
practice, if `numpy`/`Pillow`/`requests`/`tqdm` are already present (they usually are, via
ComfyUI/PyTorch itself), this modded copy should load cleanly even with nothing else from
`requirements.txt` installed.

## Nodes SynthDat's workflow actually uses from this pack

`Text Concatenate`, `Text Contains`, `Text Input Switch`, `Text String`, and `Lora Loader` (the
one with a `name_string` 3rd output core ComfyUI's own `LoraLoader` lacks) — all five only build
the generated image's OUTPUT FILENAME, not the image itself. See the node-id map in this
project's `CLAUDE.md`.

## Install

Copy this whole folder into `ComfyUI/custom_nodes/` (rename it to whatever you like, e.g. back to
`was-node-suite-comfyui` — the folder name doesn't matter, `__init__.py` is what ComfyUI reads),
then restart ComfyUI. If you already have stock/upstream WAS Node Suite installed, remove or
disable it first — running two copies of the same node classes side by side will make ComfyUI
pick one arbitrarily and can cause confusing "duplicate node" warnings.
