# Dataset Tag Studio

# WARNING: SWITCHING FROM DATASETS CURRENTLY DOES NOT WARN NOR SAVE YOUR EDITS. ALWAYS SAVE BEFORE SWAPPING DATASETS.
# Export to Github button currently spits out a broken smorgasboard of file blobs. Just don't use it okay.

A local, offline-first desktop app for tagging and cleaning up AI image-training datasets
(image + `.txt` caption pairs, the format LoRA/Stable-Diffusion-style training expects).
Everything reads and writes directly to your dataset folder on disk — no uploads, no cloud,
no accounts, no telemetry.

Built with Electron + TypeScript. Portable — unzip, run, done; nothing is installed elsewhere
on your system.

---

## Contents

- [Quick start (using the app)](#quick-start-using-the-app)
- [Features](#features)
- [Themes & the shop economy](#themes--the-shop-economy)
- [Updating](#updating)
- [Development](#development)
- [Project structure](#project-structure)
- [Architecture notes](#architecture-notes)
- [Troubleshooting](#troubleshooting)

---

## Quick start (using the app)

1. Grab a build (see [Development](#development) if you're building from source instead of a
   release zip).
2. Run `Dataset Tag Studio.exe` (or the equivalent for your OS). It's portable — no installer.
3. Click **File → Open dataset folder** and select the folder containing your images and their
   matching `.txt` caption files.
4. Tags are shown and edited as clean space-separated text (e.g. `red hair`, not `red_hair`) —
   underscores are normalized on load and restored on save automatically.

Your settings, themes, and achievements live in a `data/` folder next to the executable — delete
it to reset the app to defaults, or copy it to another machine to carry your setup over.

---

## Features

### Views
- **Grid** — the default view: image, editable tag chips, dirty/untagged indicators, a 3-dot menu
  per image. A **Dynamic card heights** toggle switches to a masonry layout.
- **Compact** — dense thumbnails with hover tag previews. Shift-click two thumbnails for **sticky
  comparison**: their tags line up side-by-side in an aligned table.
- **Single** — one image at a time, zoom up to 400%, click-drag panning, scroll-wheel zoom,
  arrow-key navigation.
- **Disabled** — its own tab for images you've moved out of the active set (drag a card onto it,
  or use the 3-dot menu). Tags on disabled images are preserved and still editable.

Clicking any image opens a floating **image card modal** (zoomable/pannable) without losing your
place in the grid.

### Tagging
- Click a chip for its context menu: select for merge, filter by presence/absence, open Tag
  Details, flag for review, explore its keyword family.
- Type into a card's "+ add tag" field and press Enter to add.
- **Filter sidebar**: multi-tag search combined with AND/OR/XOR/NOT, quick filters
  (All/Untagged/Unsaved), **Flag isolated tags** (highlights tags appearing in ≤2 images — good
  for catching typos), a draggable keyword-family sort order.
- **Tag Pruner** (right sidebar, supports multiple instances) — search/browse all tags, hand-pick
  any combination to feed into **Unify/Void**: merge selected tags into one name, or permanently
  delete them (confirmed, fully undoable/logged). An "Also apply to Disabled images" checkbox
  covers already-disabled images in the same action.
- **Retroactive merge/void catch-up** (Log panel) — replay a specific past merge/void, or every
  past one, against currently-disabled images that missed it (e.g. because they were disabled
  before that merge ran). Per-entry "Apply to disabled images" button, or a toolbar "Apply ALL."
- **Master Tag Control** (its own tab) — checkbox-select images in the gallery, then apply/remove
  a tag, conditionally apply one tag based on another being present, mass apply/remove across the
  whole dataset, or rename/find-and-replace. Select 2+ images and switch to Single view for an
  editable tag-comparison table across the selection.
- **Text & panel tagging** (3-dot menu) — every control applies to the image's real tags the
  instant you toggle it, no separate confirm step:
  - **Has text** → **Japanese** (the assumed default, plain `text` tag) and/or any number of
    **foreign languages** (each gets its own `{language} text` tag) — independently selectable,
    not mutually exclusive, since a page can genuinely have Japanese *and* English *and* Russian
    text on it. Common-language chips are click-to-toggle; a Settings toggle controls whether
    typing a new language auto-selects it or just adds it to the list.
  - **Comic**, **koma** (1–4koma), **speech bubble** toggles.
- **Review flags** (fixed color palette, per-image or per-tag) and **notes** (optionally
  always-visible on the card).
- **Undo/redo** for every tag-mutating action, plus a full **📜 Edit Log** per dataset folder
  (`_tag_edit_log.json`) — every entry has its own undo/redo, independent of the linear stack.
  **Reset image edits** reverts one image to its earliest known tag state.

### Wiki lookup, stats, favorites
- **Tag Details** — Danbooru wiki definition, category, and post count for any tag (bundled data,
  lazy-loaded); write and save your own note for tags without an official entry.
- **Editing Stats tab** — animated pie/bar charts of logged actions by type, plus summary cards.
- **★ Favorites** — save frequently-used dataset folders, reopen with one click.

### Quality of life
- Themed confirm dialogs everywhere (no native OS popups).
- Hover tooltips (toggleable, adjustable delay) on most controls.
- Dockable right-sidebar panels — drag-reorder, collapse, resize; resettable to defaults.
- Three overall layouts (standard / gallery-left / gallery-right).
- Discrete mode (blur all images, or just one) — instantly reversible.
- Native-zoom font scaling (not CSS zoom, so it never breaks layout math).
- Closing the app with unsaved changes prompts you properly — it will not hang.

---

## Themes & the shop economy

25 themes total: 4 free (Studio, Neon Cyberpunk, Oriental, Subway Fresh) and 21 purchasable in the
**💰 Shop**, sorted cheapest-first, spanning common → legendary rarity (40–750 Edibits). Every
theme has its own accent set and at least one real visual flourish beyond just its color palette
(a texture, an animation, a distinct button/card shape) — the epic and legendary tiers
additionally get a hover/click "fill" effect on buttons as a purchase-worthy touch.

- **🏆 Achievements** (45+, comedic, unlocked per-folder — opening a different dataset starts
  fresh) pay out **Edibits**, a small currency with rarity tiers. A "beg for free Edibits" button
  exists if you're short.
- **🎨 Colors** — customize any theme's palette live via color pickers, save as your own "Custom"
  theme.
- **🌙 Night mode** — a genuine HSL lightness-inversion per theme, not a screen filter.

---

## Updating

This app has no auto-updater. To update: download a fresh build, then move your `data/` folder
(settings, themes, achievements — everything that isn't the app code itself) from your old copy
into the new one. Delete the old copy once you've confirmed the new one works.

---

## Development

### Requirements
- [Node.js](https://nodejs.org) LTS (18+).
- Internet access the first time you `npm install` (downloads Electron itself, ~150–200MB).

### Setup

```bash
npm install
npm start          # builds, then launches the app pointing at renderer/ in this folder
```

### The dev loop

```bash
npm run build        # tsc (main) + type-check + esbuild bundle (renderer) — fast compile check
npm run refresh-app   # build, then regenerate the portable test build at THIS directory's root
                       # (Dataset Tag Studio.exe, resources/, data/, etc. — see Project structure)
```

`npm run refresh-app` is the routine verification loop: edit `src/`, run it, relaunch the exe.
Never hand-edit `main.js`, `preload.js`, or `renderer/app.js` directly — they're build output.

Main-process changes (`src/main.ts`) require a full quit + relaunch of the exe to take effect
(no hot-reload). Renderer changes are picked up the same way.

### Release build

```bash
npm run dist:zip     # → Shippable/ — slow (maximum compression), only run when you actually want a release
```

### Verifying a change actually works

A clean `npm run build` only proves imports resolve — it does not prove every runtime reference
is defined (the renderer is one big IIFE; a single unresolved reference silently breaks
everything wired after it, with zero build error). After `refresh-app`, launch with logging and
check for runtime errors:

```bash
ELECTRON_ENABLE_LOGGING=1 "./Dataset Tag Studio.exe" --enable-logging=stderr
```

then grep the output for `error|uncaught|exception`. Electron does not forward renderer console
output to the terminal by default, so this flag is the fast way to catch a silent failure without
opening DevTools by hand.

---

## Project structure

```
<project root>/
  src/
    main.ts              — Electron main process (window, IPC: restart/zoom/GitHub-package export)
    preload.ts            — minimal security bridge exposed to the renderer
    renderer/
      index.ts             — composition root (core state, folder loading, wires every module)
      dom.ts                — every DOM element lookup, single source of truth
      shared-ui.ts          — toast/panels/confirm-modal/dropdown/pinch-zoom — dependency-free
      themes.ts, achievements.ts, tags-edit.ts, view.ts, ...   — one file per feature domain
      global.d.ts           — ambient types for the preload bridge
  tsconfig.main.json, tsconfig.renderer.json
  package.json

  # Build output (generated — do not hand-edit):
  main.js, preload.js, renderer/app.js

  # Static, hand-authored (not generated):
  renderer/index.html, renderer/styles.css, renderer/data/ (wiki.json, all_tags.json — Danbooru
    tag reference data, powers Tag Details; ~50MB combined, required for that feature)

  # The portable test build — regenerated by `npm run refresh-app`, gitignored, coexists with
  # source at this same directory root by design (not a stray leftover):
  Dataset Tag Studio.exe, resources/, locales/, data/, chrome_*.pak, *.dll, ...

  Shippable/            — release zip output of `npm run dist:zip` (gitignored)
```

---

## Architecture notes

The renderer was ported from a single ~5,500-line untyped script into TypeScript and split into
~17 feature modules. `src/renderer/index.ts` is one top-level IIFE (it can't `export` from inside
itself) acting as the composition root: it owns core cross-cutting state (`entries`, `dirHandle`,
`selectedTags`, ...) and wires every extracted module together via a small injected-`deps` object
passed to that module's own `init*(deps)` call — never a circular import. Every extracted module
still carries `// @ts-nocheck`; real type annotations are a possible future increment, one module
at a time.

This repo is set up for **Serena** (MCP) — semantic code navigation plus a persistent
project-memory graph (`mem:core` and onward, project name `dataset-tag-studio-electron`, rooted
at this directory) — rather than a written architecture doc that goes stale, capturing the
non-obvious conventions, gotchas, and doc-maintenance expectations that used to live in a
hand-maintained changelog. (jCodeMunch was used earlier in this project's history but is
deprecated here — Serena is the sole code-navigation tool now.)

If you're picking this project up in a fresh session, activate the Serena project (this
directory) and read its memories first — they're kept terse and current on purpose, and are the
intended replacement for a growing prose changelog.

---

## Troubleshooting

- **`npm start`/`npm install` fails with a permissions or download error** — almost always the
  Electron binary download; check your network/proxy and retry.
- **Tag Details shows "no definition found" for everything** — `renderer/data/wiki.json` and
  `all_tags.json` are missing; they're required for that feature and not optional.
- **The app hides Electron's default menu bar.** Tap `Alt` (Windows/Linux) to reveal it
  temporarily — e.g. to open DevTools after uncommenting `openDevTools()` in `src/main.ts`.
- **Changing the app icon** — add an `.icns`/`.ico`/`.png` and reference it via
  `build.mac.icon`/`build.win.icon`/`build.linux.icon` in `package.json`.
