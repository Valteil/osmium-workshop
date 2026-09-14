# Impact Switch

One node extracted from
[ltdrdata/ComfyUI-Impact-Pack](https://github.com/ltdrdata/ComfyUI-Impact-Pack) (**GPLv3**,
`LICENSE` in this folder — see this pack's top-level `LICENSE` for what that means for the pack as
a whole), a 100+ node general-purpose pack — only the one SynthDat Overseer's workflow uses to
pick between its base and ControlNet generation paths is kept here:

- **`DSM Switch (Any)`** (upstream: `ImpactSwitch`, display name "Switch (Any)") — upstream class
  `GeneralSwitch`, from `modules/impact/util_nodes.py`. Logic is unmodified from upstream; two
  small helpers it relied on from sibling modules (`impact.utils.any_typ`, a wildcard "accepts any
  type" sentinel, and `impact.core.is_execution_model_version_supported()`, a 4-line
  ComfyUI-version capability check) are inlined directly in `nodes.py` instead of vendoring
  Impact-Pack's own module tree. Registered under the "DSM " prefix instead of upstream's own
  `ImpactSwitch` key so this can never collide with (or be shadowed by) a real Impact-Pack install.
