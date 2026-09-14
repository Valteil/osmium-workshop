# rgthree subset

Two nodes extracted from [rgthree/rgthree-comfy](https://github.com/rgthree/rgthree-comfy)
(MIT, `LICENSE` in this folder), which is a ~50+ node general-purpose pack — only the two
SynthDat Overseer's workflow actually uses are kept here, logic unmodified from upstream:

- **`Image Resize (rgthree)`** — resize with crop/pad/contain fit modes (`nodes.py`'s
  `RgthreeImageResize`, from upstream's `py/image_resize.py`).
- **`Lora Loader Stack (rgthree)`** — up to 4 LoRAs applied in sequence in one node (`nodes.py`'s
  `RgthreeLoraLoaderStack`, from upstream's `py/lora_stack.py`).

The only change from upstream: the `from .constants import get_name, get_category` indirection
(which just builds the `"... (rgthree)"` display-name suffix) was inlined as a local helper, since
this trimmed copy doesn't include rgthree-comfy's `constants.py` or the rest of its module tree.
