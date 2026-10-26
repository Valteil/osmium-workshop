# Regional prompting for Anima: nodes.py is https://github.com/Sen-sou/Comfyui-Anima-Regional-Conditioning
# (MIT, LICENSE in this folder) at commit 099cf1f, unmodified — it routes each region's prompt
# through Anima's cross-/self-attention during the early (layout) steps. dsm_regional_prompt.py is
# this project's own one-node front end that Comfy Bridge's Regional tab drives with box JSON.
# Osmium Comfy's runner loads this folder even when the installed pack predates it (a copy ships
# next to the runner, synced by scripts/sync-comfy-core.js).
from .nodes import NODE_CLASS_MAPPINGS as _upstream_classes
from .dsm_regional_prompt import (
    NODE_CLASS_MAPPINGS as _dsm_classes,
    NODE_DISPLAY_NAME_MAPPINGS as _dsm_names,
)

_RENAME = {
    "AnimaConditioningRegion": ("DSM Anima Conditioning Region", "DSM Anima Conditioning Region"),
    "ApplyAnimaRegionalConditioningPatch": ("DSM Apply Anima Regional Conditioning Patch",
                                            "DSM Apply Anima Regional Conditioning Patch"),
}

NODE_CLASS_MAPPINGS = {new: _upstream_classes[old] for old, (new, _) in _RENAME.items()}
NODE_DISPLAY_NAME_MAPPINGS = {new: label for _, (new, label) in _RENAME.items()}
NODE_CLASS_MAPPINGS.update(_dsm_classes)
NODE_DISPLAY_NAME_MAPPINGS.update(_dsm_names)

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS"]
