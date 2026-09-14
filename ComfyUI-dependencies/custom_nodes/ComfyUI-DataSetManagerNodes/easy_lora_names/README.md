# Easy LoraNames

One node extracted from
[yolain/ComfyUI-Easy-Use](https://github.com/yolain/ComfyUI-Easy-Use) (**GPLv3**, `LICENSE` in
this folder — see this pack's top-level `LICENSE` for what that means for the pack as a whole), a
100+ node general-purpose pack — only the one SynthDat Overseer's workflow uses to read back a
chosen LoRA's filename for the output filename chain is kept here:

- **`DSM Lora Name`** (upstream: `easy loraNames`, display name "Lora Names") — upstream class
  `setLoraName`, from `py/nodes/util.py`. Logic is unmodified from upstream; the one helper it
  relied on from a sibling module (`libs.utils.AlwaysEqualProxy`, a "compares equal to any type"
  string subclass) is inlined directly in `nodes.py` instead of vendoring Easy-Use's own module
  tree. Registered under the "DSM " prefix instead of upstream's own `easy loraNames` key so this
  can never collide with (or be shadowed by) a real Easy-Use install.
