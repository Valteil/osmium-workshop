# rgthree subset

Two nodes extracted from [rgthree/rgthree-comfy](https://github.com/rgthree/rgthree-comfy)
(MIT, `LICENSE` in this folder), which is a ~50+ node general-purpose pack — only the two
SynthDat Overseer's workflow actually uses are kept here, logic unmodified from upstream:

- **`DSM Image Resize`** (upstream: `Image Resize (rgthree)`) — resize with crop/pad/contain fit
  modes (`nodes.py`'s `RgthreeImageResize`, from upstream's `py/image_resize.py`).
- **`DSM Lora Loader Stack`** (upstream: `Lora Loader Stack (rgthree)`) — up to 4 LoRAs applied in
  sequence in one node (`nodes.py`'s `RgthreeLoraLoaderStack`, from upstream's `py/lora_stack.py`).

Two changes from upstream: the `from .constants import get_name, get_category` indirection was
inlined as a local `_dsm_name()` helper (since this trimmed copy doesn't include rgthree-comfy's
`constants.py` or the rest of its module tree), and repurposed to generate a `"DSM "` prefix
instead of rgthree-comfy's own `"(rgthree)"` suffix — so these can never collide with (or be
shadowed by) rgthree-comfy itself if also installed.
