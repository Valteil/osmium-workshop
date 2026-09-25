---
version: 1
slug: "renderer-styles-css"
primary_target: "renderer/styles.css"
related_targets: []
---

Scope: the desktop app's 26 themes (renderer/styles.css theme layer + renderer/fonts). Mode: Operate.

Audience/job: hobbyist and pro dataset curators tagging thousands of image/caption pairs for hours; themes are a personal-expression economy (shop tiers, Refine Theme) on top of a dense power tool.

Constraints (user-pinned): keep every theme's color tokens exactly; full identity per theme (type, surface material, element shapes); bundled OFL fonts; keep the shop tiers, Refine Theme, and every flourish toggle, but redo the premium effects. Layout, DOM, and behavior do not change.

## Direction contract

THESIS: A theme is a material, not a tint. Each one rebuilds the same atoms (topbar, tabs, buttons, chips, cards, dock sections, inputs, checkboxes, scrollbars, selection) in the grammar of the world its name already names. This replaces the category default of one component kit recolored 26 times and decorated with radial blobs and glows.

OWN-WORLD: The shared base defines element tokens (display/UI/mono faces, per-atom radii, heading case/tracking, premium-fx tokens). Each theme sets them from its own world: a subway signage face with route-line tabs, CRT phosphor terminal, letterpress catalogue, lacquer and cinnabar seal, stamped foundry plates, hazard placards, and so on. Textures are derived from the theme vars through color-mix, so night mode inverts them too.

STORY: The user opens the shop or the picker, switches theme, and the whole bench changes character: the lettering, the shape of controls, how a selected tag looks. Nothing moves in the layout, and every control stays where their hands expect it.

FIRST VIEWPORT: The gallery shell. Brand lockup in the theme's display face at the top left. Tab bar with a theme-native active marker. Left filter column and right dock stack as material panels. Chips in the mono face with a theme-native selected state.

FORM: Pinned per-theme worlds (the theme names plus the user's palettes). The concept roll does not apply because the user pinned the worlds. Seed key: none (pinned). Build path: code-led (no image generation available).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
