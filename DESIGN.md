---
name: Osmium Workshop
description: Local-first dataset tag editor whose 26 themes are materials, not tints.
colors:
  bg-base: "#16151c"
  bg-panel: "#1c1a24"
  bg-elevated: "#252230"
  bg-elevated-2: "#2d2a38"
  border-soft: "#37324277"
  border-strong: "#4a4459"
  text-primary: "#ece8f0"
  text-muted: "#9791a6"
  text-faint: "#6b6578"
  accent-auto: "#e8a33d"
  accent-auto-dim: "#4a3c22"
  accent-manual: "#6fb8d1"
  accent-manual-dim: "#213842"
  accent-danger: "#e2637a"
  accent-success: "#7fbf8f"
  accent-flair: "#b98fd6"
typography:
  display:
    fontFamily: "Schibsted Grotesk, Segoe UI, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Schibsted Grotesk, Segoe UI, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 700
    letterSpacing: "0"
  title:
    fontFamily: "Schibsted Grotesk, Segoe UI, system-ui, sans-serif"
    fontSize: "12.5px"
    fontWeight: 600
    letterSpacing: "0"
  body:
    fontFamily: "Schibsted Grotesk, Segoe UI, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    letterSpacing: "0"
  label:
    fontFamily: "JetBrains Mono, SFMono-Regular, Consolas, monospace"
    fontSize: "11px"
    fontWeight: 400
    letterSpacing: "0"
rounded:
  ctl: "6px"
  chip: "5px"
  card: "8px"
  panel: "10px"
  check: "4px"
  scroll: "6px"
spacing:
  chip: "2px 4px 2px 9px"
  control: "7px 13px"
  tab: "10px 14px"
  panel: "14px"
  stack: "10px"
components:
  button:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.ctl}"
    padding: "{spacing.control}"
  button-hover:
    backgroundColor: "{colors.bg-elevated-2}"
  button-primary:
    backgroundColor: "{colors.accent-manual-dim}"
    textColor: "{colors.accent-manual}"
    rounded: "{rounded.ctl}"
    padding: "{spacing.control}"
  chip:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.text-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    padding: "{spacing.chip}"
  chip-selected:
    backgroundColor: "{colors.accent-manual-dim}"
    textColor: "{colors.accent-manual}"
    rounded: "{rounded.chip}"
  tab:
    textColor: "{colors.text-muted}"
    typography: "{typography.title}"
    padding: "{spacing.tab}"
  tab-active:
    textColor: "{colors.accent-flair}"
  tool-section:
    backgroundColor: "{colors.bg-elevated}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel}"
  card:
    backgroundColor: "{colors.bg-panel}"
    rounded: "{rounded.card}"
  brand-tag:
    backgroundColor: "{colors.accent-auto-dim}"
    textColor: "{colors.accent-auto}"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    padding: "2px 6px"
  checkbox:
    backgroundColor: "{colors.bg-elevated}"
    rounded: "{rounded.check}"
    size: "15px"
  checkbox-checked:
    backgroundColor: "{colors.accent-manual}"
---

# Design System: Osmium Workshop

## Overview

**Creative North Star: "A Theme Is a Material, Not a Tint"**

Osmium Workshop is a dense, keyboard-and-mouse workbench where curators tag thousands of image/caption pairs in long sittings. The layout, DOM and behavior are fixed: every control stays where the hands expect it. What changes between themes is the material the bench is made of. One shared set of components (topbar, brand lockup, tabs, buttons, chips, cards, dock sections, inputs, checkboxes, scrollbars) reads two token layers: 16 color variables and a non-color **element grammar** (faces, type settings, per-atom radii, card shadow, premium-effect tokens). Each of the 26 themes is a pinned world that restates both layers in the vocabulary its name already names: subway signage, a phosphor CRT, a letterpress catalogue, lacquerware with a cinnabar seal, a foundry plate with rivets.

Studio, the default, is the workbench itself: machined panels with a lit top edge, a tight grotesk, and tags set as square-cornered mono drawer labels rather than pills. Studio's values live on `:root, html[data-theme="studio"]` in `renderer/styles.css`, so any theme that omits a grammar token (including user-built Custom themes) inherits Studio's. The frontmatter here records Studio; every other theme's colors are the per-theme blocks in `renderer/styles.css` between the Studio block and `End themes`, and are not restated in this file.

The themes are also an economy (shop tiers, Refine Theme, three flourish toggles). Epic and legendary themes, or any theme bought up through Refine Theme, add a premium button hover-fill and card lift, and each world supplies its own version of both effects through `--fx-*` tokens.

**Key Characteristics:**
- One component set, two token layers: 16 color vars (in `THEME_VARS`, inverted by night mode) and the element grammar (never inverted).
- Every theme brings its own faces, shapes, active-tab marker, panel material, `#gallery` ground texture, and premium-effect version.
- Tags are always mono data labels. Only their shape and selected state change per world.
- Layout never moves between themes. Identity comes from lettering, form and surface.
- Faces are bundled OFL woff2 (`renderer/fonts/fonts.css`, 62 `@font-face`, `font-display: swap`). Nothing loads from the network.

## Colors

Each theme carries 16 role-named colors. The roles are fixed and the values are the theme's own. Studio is a violet-grey night bench with an amber/teal/orchid triad.

### Primary
- **Tide Teal "manual"** (`accent-manual`): manual/user actions. Primary button text and border, selected-chip fill (on `accent-manual-dim`), checked checkboxes, checkbox hover, dock drop-target outline.

### Secondary
- **Workshop Amber "auto"** (`accent-auto`): automatic/machine state. The dirty-card border, auto-dock status dots, the brand tag, flagged-for-review chips.

### Tertiary
- **Orchid Flair** (`accent-flair`): the theme's signature third hue, used for navigational chrome only: active tab, topbar rule, section-title color where the theme uses it, the default premium fill.

### Neutral
- **Bench Floor / Panel / Elevated / Elevated 2** (`bg-base` → `bg-elevated-2`): four stepped surfaces. The page ground, then the column panels, then docks, chips and buttons, then hover and popovers.
- **Soft and Strong Rules** (`border-soft`, `border-strong`): soft rules frame cards, chips and docks. Strong rules frame controls, checkboxes and scrollbar thumbs.
- **Ink, Muted, Faint** (`text-primary`, `text-muted`, `text-faint`): body ink, tabs and secondary labels, captions and hints.
- **Danger / Success** (`accent-danger`, `accent-success`): destructive ghost buttons and confirmations.

### Named Rules
**The Sixteen Roles Rule.** A theme sets exactly the 16 `THEME_VARS` colors. A new theme that omits `--accent-flair` is incomplete, and no rule may hardcode a flair hue.

**The Derived Texture Rule.** Textures, rules and frames mix from theme vars through `color-mix(in srgb, var(--…) N%, transparent)`, never from a literal color, so that night mode's HSL inversion carries them too.

**The Image Mat Rule.** The letterbox behind an image (card thumb, Single preview, image modal) is never a flat void. Each theme sets `--mat`, a background-layer list painted over `bg-base`: a small static motif from its own world, such as Studio's pegboard, Osmium's dot field (the website's screenshot stage), Terminal scanlines, Oriental nashiji gold flakes, a Vintage Paper ledger or a Celestial star chart. Ink stays around 5–15% so the motif reads as material and disappears once the eye lands on the image. It is never animated, and a theme that sets nothing inherits Studio's pegboard.

**The Light-Ground Ink Rule.** On light palettes, `accent-auto` on `accent-auto-dim` falls below 3:1. The brand tag and flagged-review chips on light themes take ink from `text-primary` (or `color-mix(accent-auto 40%, text-primary)`) instead.

## Typography

**Display Font:** per theme through `--display` (Studio: Schibsted Grotesk)
**Body Font:** per theme through `--sans` (Studio: Schibsted Grotesk, with Segoe UI / system-ui fallback)
**Label/Mono Font:** `--mono`, JetBrains Mono in 25 themes and Courier Prime in Vintage Paper
**Head / Tab faces:** `--head-font`, `--tab-font`. Both default to `--sans`, and serif, stencil and wide worlds point them at the display face.

**Character:** Each world casts its own voice for the lockup, tab strip and dock titles (Cinzel capitals, VT323 phosphor, IM Fell small caps, Michroma wide). Body text stays a legible sans or book serif, and tags stay monospaced.

### Hierarchy
- **Display / brand lockup** (Studio 800, 17px, line-height 1.05, -0.015em): the "Osmium Workshop" wordmark, top left, stacked over its mono tag. Themes range from 15px (Michroma) to 26px (VT323), with `--brand-case` for uppercase worlds.
- **Headline / dock title** (Studio 700, 12.5px): `.sec-head .t` in `--head-font`, colored by `--head-color`. Panel titles (`h3.panel-title`) use the same tokens at 0.5px smaller in `text-muted`.
- **Title / tab** (Studio 12.5px, 600 when active): `.tab-btn` in `--tab-font` with `--tab-case` and `--tab-track`.
- **Body / control** (Studio 500, 13px): buttons and inputs in `--sans`, with `--btn-weight`, `--btn-track` and `--btn-case`.
- **Label / tag** (400, 11px mono): chips, the brand tag and filenames.

### Named Rules
**The Mono Tag Rule.** Tags are data. Chips and the brand tag are always set in `--mono` at 11px, and no theme changes that face through the chip rule.

**The Tracked-Caps Pairing Rule.** A theme that sets `--*-case: uppercase` also sets positive tracking (0.02–0.2em) on the same atom. Uppercase is never set solid.

## Layout

Layout is fixed and outside theme control: a topbar with the brand lockup and a single row of actions, a tab bar, a left filter column, the `#gallery` grid (grid, masonry, compact or single view), and a right dock stack of `.tool-section` panels. Dock panels pad at 14px with a 10px internal stack, controls pad at 7px 13px, and tabs pad at 10px 14px. Themes may adjust padding only inside their own signature devices (pill tab strips at 5–6px vertical padding with 6px gaps, Twilight Garden's 18px arched dock tops, Subway's taller route-strip header). No theme adds or removes a pane, moves a control, or changes the grid.

### Named Rules
**The Still Bench Rule.** Switching theme never moves a control. If a theme's device needs space, it takes that space from padding inside its own atom and never from a neighboring atom's position.

## Elevation & Depth

Depth is mostly tonal: four stepped surfaces, with soft rules framing them. Studio adds a machined edge (an inset 1px lit top on docks and a dark 1px floor) and a quiet card shadow. Each theme defines its own `--card-shadow` from its material. That can be an inset gilt or gold-leaf ring (Amethyst, Oriental), no shadow at all (Cyberpunk, Terminal, Osmium, Midnight Ocean, Retro Wave), a lit top facet (Obsidian), or a soft color-mixed drop shadow on light paper and pastel worlds.

### Shadow Vocabulary
- **Studio card** (`box-shadow: 0 1px 2px rgba(0,0,0,0.25)`): resting cards.
- **Studio dock edge** (`box-shadow: inset 0 1px 0 color-mix(in srgb, var(--text-primary) 5%, transparent), 0 1px 0 rgba(0,0,0,0.25)`): tool and settings sections.
- **Premium card lift** (`transform: var(--fx-card-t); box-shadow: var(--fx-card-s)`, Studio `translateY(-3px)` / `0 10px 22px rgba(0,0,0,0.4)`): card hover on premium themes only, over 0.2s `cubic-bezier(.2,.8,.3,1)`.

### Named Rules
**The Native Light Rule.** Glows and lit gradients appear only where the world itself emits light: phosphor text (Terminal), a photophore (Bioluminescent), a corona (Solar Flare), an aurora (Aurora Borealis), a vignette (Blood Moon). A theme without a light source gets no glow.

## Shapes

Shape is tokenized per atom: `--r-ctl` (buttons), `--r-chip` (tags and the brand tag), `--r-card` (gallery cards), `--r-panel` (docks, popovers, modals), `--r-check` (checkboxes), and `--r-scroll` (scrollbar thumbs). Studio uses 6 / 5 / 8 / 10 / 4 / 6px. Themes range from all-zero (Cyberpunk, Terminal, Obsidian) to full pills (Subway, Sakura, Candy Pop, Coral Reef, Rose Gold, Celestial Gold at `999px` on controls and chips), and they use asymmetric radii where the world has a natural silhouette: leaf-cut (Forest Moss `18px 3px 18px 3px`), organic (Coral Reef `24px 4px 24px 4px`), trellis arch (Twilight Garden `30px 30px 6px 6px`), petal-cut selected chips (Sakura `14px 2px 14px 2px`). Chamfered plates (Obsidian, Retro Wave, Copper Forge) are drawn with `clip-path`, and those themes move the focus ring inside with an inset 2px box-shadow, because the clip hides an outside outline.

### Named Rules
**The Per-Atom Radius Rule.** Components read their own `--r-*` token and never the legacy `--radius`. A theme's shape identity is the set of six radii, not one number.

**The Clipped Focus Rule.** Any theme that clips a control's silhouette must restore a visible focus indicator inside the clip.

## Components

### Buttons
- **Shape:** `--r-ctl` (Studio gently rounded, 6px), with a 1px `border-strong` rule.
- **Default:** `bg-elevated` fill, `text-primary`, 13px `--sans` at `--btn-weight`, padding 7px 13px.
- **Hover / Active:** hover moves to `bg-elevated-2` with a `text-faint` border. Active presses down 1px. Disabled drops to 35% opacity.
- **Primary:** `accent-manual` text and border on `accent-manual-dim`, at 600 weight. Themes restate it in their own material: an ink-solid slab (Osmium), an inverted TUI block (Terminal), a placard-solid fill (Toxic Waste), a core-glow radial (Solar Flare), a polished-metal shimmer on hover (Rose Gold).
- **Premium hover-fill:** on epic/legendary or refined themes, the button's `::after` fills with `--fx-fill` at `--fx-o` opacity, placed by `--fx-top` and `--fx-h`, and scaled to `--fx-w` (a scaleX factor) over 0.24s. A click floods it to 1 and fades it out (`flairClickFlash`). Each world supplies its own fill: gilt underline, HUD scanlines, route strip, hazard tape, knapped-glass glint.

### Chips (tags)
- **Style:** `bg-elevated` fill, 1px `border-soft` rule, `--r-chip`, 11px mono, padding 2px 4px 2px 9px (with the remove × on the right).
- **State:** selected tags use `accent-manual` on `accent-manual-dim`. Match, isolated and flagged-review state classes outrank theme styling. Themes restyle the selected state only through `.chip.selected:not(.chip-match,.chip-isolated,.chip-flagged-review)`. Examples: an inset left bar (Cyberpunk), ink inversion (Osmium, Terminal), a petal cut (Sakura), a candy-stripe border (Candy Pop), a solid rule over dashed (Vintage Paper), an inner glow (Bioluminescent).

### Cards / Containers
- **Corner Style:** `--r-card`. The thumbnail wrapper matches the top corners on rounded worlds.
- **Background:** `bg-panel` with a 1px `border-soft` rule. `.dirty` switches the border to `accent-auto`.
- **Shadow Strategy:** `--card-shadow` at rest. The premium lift is described under Elevation.
- **Tool sections (docks):** `bg-elevated`, `--r-panel`, 14px padding, 10px stack. This is where each theme puts its panel material: HUD corner brackets, rivets on brushed metal, a gold-leaf inset ring, deco corner steps, a double neatline, a hazard-tape top edge, an aurora top line, a dashed terminal frame.

### Inputs / Fields
- **Style:** `bg-panel` with a soft rule. Checkboxes are custom-drawn in every theme (15px, 1.5px `border-strong`, `--r-check`, `bg-elevated`).
- **Focus / Checked:** checkbox hover borders in `accent-manual`, and checked fills `accent-manual` with a `bg-base` tick.

### Navigation (tab bar)
- **Style:** transparent `.tab-btn` in `--tab-font`, `text-muted`, with a 2px transparent bottom rule. Hover lifts to `bg-elevated` and `text-primary`.
- **Active:** Studio uses an `accent-flair` underline with 600 weight. Every theme draws its own marker with background, border or box-shadow: a route pill, a photophore dot, a sounding-line tick, a knapped gold notch, an ecliptic double hairline, an aurora curtain, index-card tabs, TUI inversion.

### Brand lockup (signature)
The wordmark sits in `--display` over a stacked mono tag ("local · no upload") that reads `--r-chip`. The tag becomes a world object: a cinnabar seal (Oriental), a rubber stamp at -2° (Vintage Paper), a route pill (Subway), a pulsing photophore (Bioluminescent), and a chromatic split on the wordmark (Cyberpunk).

### Per-theme worlds

Colors for every row are in `renderer/styles.css`. Faces are display / body. Tier is marked where a theme is premium.

| Theme | World | Faces | Signature devices |
|---|---|---|---|
| Studio (default) | Workbench | Schibsted Grotesk | Machined dock edge, flair topbar underline, square mono drawer-label tags |
| Cyberpunk | Street HUD | Oxanium | Zero radius, HUD corner brackets on docks, chromatic-split lockup, scanline fill, inset-bar selected tag |
| Oriental | Lacquerware | Shippori Mincho / Zen Kaku Gothic New | Double gold-leaf topbar rule, cinnabar seal tag, seigaiha wave ground, gold inset docks |
| Subway | Transit signage | Overpass | Four-line route strip header, route-pill tabs, station-ring dots, pill controls |
| Osmium | The app's own brand | Chakra Petch / IBM Plex Sans | Hard RGB strip under topbar, ink-solid primary, ink-inverted selected tags |
| Terminal | Phosphor CRT | VT323 / JetBrains Mono | `>` prompt dock titles, TUI-inverted tabs and tags, scanline ground, dashed frames |
| Sakura Dusk | Washi and petals | Zen Maru Gothic | Paper-fibre ground, pill tabs, petal-cut selected tag |
| Bioluminescent Deep | Abyss lit from below | Sora | Floor-lit docks, photophore active-tab dot, pulsing brand tag |
| Royal Amethyst (epic) | Gilded jewel box | Cinzel / Figtree | Double gilt topbar rule, gold-framed docks, gilt-underline fill |
| Solar Flare (legendary) | Photosphere | Anybody | Heat-gradient header rule, corona ground, flare-burn active tab, core-glow primary |
| Midnight Ocean | Nautical chart | Barlow Semi Condensed | Chart-grid ground, double-neatline docks, sounding-line tab tick |
| Arctic Frost | Pack ice | Albert Sans | Crystalline hatch ground, lit top edge on docks, no glass blur |
| Forest Moss | Field guide | Alegreya / Alegreya Sans | Leaf-cut asymmetric corners, topographic contour ground |
| Vintage Paper | Letterpress catalogue | IM Fell English SC / Libre Caslon Text, Courier Prime tags | Double-ruled head and dock titles, index-card tabs, stamped tag, dashed chips, tilt on hover |
| Obsidian | Knapped volcanic glass | Michroma / Archivo | Chamfered clip-path controls and chips, gold facet on docks, notch tab marker |
| Retro Wave | 1984 horizon | Audiowide / Exo 2 | Sunset bars under header, synth-grid floor, chamfered controls |
| Rose Gold | Art Deco jeweller | Poiret One / Jost | Stepped deco corners, pill controls, shimmer on primary |
| Coral Reef | Tide pool | Nunito | Organic asymmetric corners, pill tabs, bubble ground |
| Toxic Waste | Hazard placards | Saira Stencil One / Barlow Condensed | Hazard tape under header and on dock tops, placard-solid primary |
| Lavender Fields | Herbarium sheet | Gilda Display / Karla | Planted-row stripe ground, ruled specimen titles, short centered tab mark |
| Candy Pop | Sweet shop | Fredoka | Bouncy pill controls (overshoot scale), fat pill tabs, candy-stripe selected tag |
| Copper Forge | Foundry | Big Shoulders Display / Barlow | Brushed-metal riveted docks, single-chamfer plates, stamped caps |
| Blood Moon | Gothic eclipse | Pirata One, Eczar / Alegreya Sans | Edge vignette, blood-red lockup, bead after dock titles |
| Twilight Garden (epic) | Night garden | Gloock / Figtree | Trellis-arched docks and cards, firefly ground, firefly tab dot |
| Aurora Borealis (legendary) | Polar night | Epilogue | Drifting sky ground, sliding aurora header and dock lines, aurora-curtain tab |
| Celestial Gold (legendary) | Star atlas | Marcellus SC / Jost | Starfield ground, ecliptic double-hairline tab, gold-ringed docks |

## Do's and Don'ts

### Do:
- **Do** build a new theme by setting the 16 `THEME_VARS` colors plus the element grammar (faces, `--brand-*`, `--tab-*`, `--head-*`, `--btn-*`, the six `--r-*`, `--card-shadow`, and the `--fx-*` set with `--fx-card-t/s`) from the world its name names.
- **Do** put ground textures on `#gallery` only. Every other pane is opaque, so a texture on `body` never renders.
- **Do** mix every texture, rule and frame from theme vars with `color-mix()` so night mode inverts it.
- **Do** restyle selected tags only through `.chip.selected:not(.chip-match,.chip-isolated,.chip-flagged-review)`.
- **Do** draw active-tab markers with background, border or box-shadow.
- **Do** end every ambient `flair*` animation rule with `animation-play-state: var(--flair-play);` so the "Disable ambient animations" toggle freezes it.
- **Do** add any new absolutely positioned or `all: unset` button class to the exclusion list of every broad theme-wide button rule.
- **Do** bundle any new face as an OFL woff2 in `renderer/fonts/` with `font-display: swap`.

### Don't:
- **Don't** recolor one kit and call it a theme. A theme changes lettering, shape and surface, and never layout.
- **Don't** set `border-color`, `background` or `box-shadow` in a theme's bare `.chip` or `.card` rule. At (0,2,1) it silently hides the dirty, untagged, match, isolated and flagged states.
- **Don't** set colors in a theme's bare `button` rule. It outranks `button.primary`, `.danger-ghost` and every classed button.
- **Don't** use `::after` for tab markers. Premium themes own every button's `::after` for the hover-fill.
- **Don't** use `overflow: hidden` to clip the premium fill. Use `overflow: clip` so flex buttons keep their min-size.
- **Don't** add a glow to a world with no light source.
- **Don't** gate static textures or frames behind the flourish toggles. The toggles govern motion (ambient animation, hover-fill, card tilt), not material.
