# Osmium Workshop

![Osmium Workshop](build/banner.jpg)

A local, offline-first desktop app for tagging and cleaning up AI image-training datasets
(image + `.txt` caption pairs, the format LoRA/Stable-Diffusion-style training expects).
Everything reads and writes directly to your dataset folder on disk — no uploads, no cloud,
no accounts, no telemetry.

Built with Electron + TypeScript. Portable — unzip, run, done; nothing is installed elsewhere
on your system.

> **Note:** a Tauri-based port was attempted as a path toward Mac/Linux support, but has been
> discontinued. Hand-translating every new Electron feature into an equivalent Rust backend
> turned out to be too much ongoing maintenance overhead for this project — it was slowing down
> real feature work without a payoff that justified it. This app is Electron-only going forward.

---

## Contents

- [Quick start (using the app)](#quick-start-using-the-app)
- [Apps in this repo](#apps-in-this-repo)
- [Full user guide](USER_GUIDE.md) — a walkthrough of every tab and feature
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
2. Run `Osmium Workshop.exe` (or the equivalent for your OS). It's portable — no installer.
3. Click **File → Open dataset folder** and select the folder containing your images and their
   matching `.txt` caption files.
4. Tags are shown and edited as clean space-separated text (e.g. `red hair`, not `red_hair`) —
   underscores are normalized on load and restored on save automatically.

See [USER_GUIDE.md](USER_GUIDE.md) for a full walkthrough of every tab, power tool, and setting.

Your settings, themes, and achievements live in a `data/` folder next to the executable — delete
it to reset the app to defaults, or copy it to another machine to carry your setup over.

---

## Apps in this repo

Three related apps share this repository (and much of their renderer code):

1. **Osmium Workshop (desktop)** — this app: the full dataset tag editor described below.
   Portable Electron app — unzip, run, done.
2. **Osmium Workshop (mobile)** — an Android app for tagging training datasets on the go:
   touch layout with bottom-sheet panels, tag editing via the image modal, storage through
   Android's Storage Access Framework (a picked folder stays accessible across restarts),
   on-device WD14 tagging (models download on first use) as well as tagging and generation
   through your own ComfyUI instance over the network. Distributed as a sideloadable APK via
   GitHub Releases, not the Play Store.
3. **Comfy Bridge** (`comfy-bridge/`) — an alternate web UI for accessing the ComfyUI backend,
   featuring a built-in workflow. In exchange for customizability, it removes the issue of
   navigating a complex node graph for generation — preferable for users who just want their
   image without seeing a mess of nodes. Ships as both a portable desktop app (extract anywhere
   and launch) and an Android app (`comfy-bridge/mobile/`). Requires the custom node bundle
   (see the release assets). The mobile build drives ComfyUI over LAN/Tailscale/hotspot —
   start ComfyUI with `--listen 0.0.0.0 --enable-cors-header --port 8188` and allow inbound
   TCP 8188 through the firewall.

The rest of this document describes the desktop dataset manager. On mobile, read the in-app ❓
Help instead — it's rewritten for touch. Comfy Bridge mobile is documented in
`comfy-bridge/mobile/README.md`.

---

## Features

### Views (Gallery tab toolbar)
- **Grid** — the default editing view: image, editable tag chips, dirty/untagged markers, 3-dot
  menu per image. Use it for everyday tagging; **Dynamic card heights** switches to masonry on
  mixed-size sets.
- **Compact** — dense thumbnails for scanning large folders fast. Hover previews tags;
  Shift-click two cards for a side-by-side tag comparison.
- **Single** — one image at a time up to 400% zoom with drag-pan and arrow keys. Use it to
  inspect fine details (text, hands, artifacts) before training.
- **Disabled** — quarantine tab for images out of the active set (drag a card onto it). Tags are
  preserved and editable; restore anytime. Use it for maybes you don't want to delete.

Clicking any image opens a floating zoomable/pannable card modal
(keep your grid position); on desktop that modal also has **⟲/⟳ Rotate** and **✂ Crop** — file-
rewriting pixel edits (PNG/JPG/WebP), each confirmed, logged, and undoable — with Isolate saving
a cropped region as a *new* image (source untouched).

### Tagging
- **Chips** (on every card) — click for filter-by-presence, Tag Details wiki lookup, review flag,
  keyword family. Type in "+ add tag", Enter to add; × removes.
- **Filter sidebar** (left) — multi-tag AND/OR/XOR/NOT search plus All/Untagged/Unsaved quick
  filters, **Flag isolated tags** (tags on ≤2 images), draggable family sort. Use it to find
  images and hunt typos.
- **Tag Pruner** (right sidebar) — hand-pick tag sets, then **Unify** (merge into one name) or
  **Void** (delete). Confirmed, undoable, logged. Run several independent instances for
  unrelated families; 🔍 Mirror previews the affected images in the gallery. Use it to collapse
  spelling variants and junk tags dataset-wide.
- **Retroactive Merge/Void** (right sidebar) — standing "these tags → this tag (or nothing)"
  rules that auto-correct matching tags from any future source; hand-typing a ruled tag is
  blocked with a pointer back. Pause rules or single tags to actively restore originals;
  per-image Immunize/Antivoid exemptions. Use it so a cleanup never needs repeating.
- **Master Tag Control** (tab) — checkbox-select images, then apply/remove/conditionally-apply
  tags, dataset-wide rename/find-replace, or delete the selection. Use it for bulk passes (e.g.
  tag everything containing X).
- **Delete permanently** (3-dot menu for one image, Master Tag Control for a batch) — removes
  the files from disk outright. No undo; confirm-modal gated. Only removes the copy inside
  your dataset folder — a SynthDat-generated image's separate original in ComfyUI's own `output/`
  folder is untouched. Use it for rejects you never want back.
- **Sequential tagging** (Tag Overseer tab) — walk the filtered gallery image by image in Single
  view with a quick-respond panel: text/language, censorship (state + type checkboxes),
  multiple perspective checkboxes, monochrome, sound effects, comic, multiple views, koma count.
  A live chip strip under the image previews exactly which tags Confirm will write before it
  happens. Use it to blast through indicator tagging on a whole filtered batch.
- **Text & panel tagging** (3-dot menu) — instant toggles writing straight to tags:
  Japanese/foreign-language text tags, Comic, koma count, speech bubble. Use it on manga/page
  datasets where panel metadata matters.
- **Review flags + notes** — color flags per image or tag, sticky notes on cards. Use them to
  mark fix-later images.
- **Undo/redo + 📜 Edit Log** — every mutation is undoable globally and per log entry
  (`_tag_edit_log.json` per folder). **Reset image edits** restores one image. Use the log to
  audit a session or roll back a single change.

### WD14 Autotagger (Tag Overseer tab)
Sends selected images (or one via its 3-dot menu) to a WD14 node on your ComfyUI and merges the
returned tags. Host/model/thresholds in one settings section; review-before-apply optional; the
whole batch is one undoable action. ComfyUI does the inference. Use it to bootstrap tags onto
untagged imports.

### SynthDat Overseer (tab)
Grows a thin dataset by generating MORE images of a character you're training a LoRA on —
ControlNet-posed from a reference image, or plain prompted generation without one. WD14-interrogate
the reference to steal pose tags, Generate (1-Pass or 2nd refinement pass, live preview, Stop),
then review the pending tag card: prune tags, void-mark junk (e.g. artist/rating tags — voiding
also adds a Retroactive Void rule on Accept). **Accept** writes image + tags into the dataset
(crash-safe: written to disk immediately); **Reject** parks it in `Disabled/`. Nothing generated
is silently discarded. Use it when 5 good images need to become 50. (Needs the ComfyUI node
pack — see `ComfyUI-dependencies/`.)

### Wiki lookup, stats, favorites
- **Tag Details** (chip menu) — Danbooru wiki definition, category, post count per tag (bundled,
  lazy-loaded), plus your own notes. Use it to disambiguate similar tags.
- **Editing Stats tab** — charts of your logged actions by type, plus summary cards. Use it to
  see where cleanup time goes.
- **★ Favorites** — one-click reopen for frequent dataset folders.

### Quality of life
- **❓ Help** (topbar) — in-app guide + glossary for when you don't want to leave the app.
- **🩺 Export app state** (Settings ▸ Updates & Sharing) — one file with your setup, for bug
  reports.
- Hover tooltips (toggleable, adjustable delay).
- Dockable right-sidebar panels — drag-reorder, collapse, resize, resettable.
- Discrete mode — blur all images (or one) instantly; reversible.
- Native-zoom font scaling (never breaks layouts).
- Closing the app with unsaved changes prompts you to save first.
- **Hardware acceleration toggle** (Settings ▸ Performance) — render on the integrated GPU by
  default to keep your discrete GPU free for generation; or turn acceleration off. Applies on
  next launch.

---

## Themes & the shop economy

25 themes total: 4 free and 21 in the **💰 Shop** (common → legendary, 40–750 Edibits).
Every theme pairs a palette with a real flourish (texture, animation, button shape); epic and
legendary add a hover/click button-fill effect.

- **🏆 Achievements** (55+, per-folder) pay out **Edibits** to spend in the Shop — a "beg for
  free Edibits" button covers shortfalls. Use them to unlock themes by using the app.
- **Motion-sensitivity controls** (Settings ▸ Appearance) — kill all motion or just hover-fill,
  card tilt, or ambient animation. Use them if effects distract or discomfort you.
- **🎨 Colors** — recolor any theme live, save as your own "Custom" theme.
- **🌙 Night mode** — inverts each theme's colors directly.

---

## Updating

This app has no auto-updater. To update: download a fresh build, then move your `data/` folder
(settings, themes, achievements — everything that isn't the app code itself) from your old copy
into the new one. Delete the old copy once you've confirmed the new one works. Same for Comfy
Bridge desktop (its `data/` holds presets and the remembered output folder); Android builds
update by sideloading the new APK over the old one (`adb install -r`), which preserves app data.

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
                        # (Osmium Workshop.exe, resources/, data/, etc. — see Project structure)
```

`npm run refresh-app` is the routine verification loop: edit `src/`, run it, relaunch the exe.
Never hand-edit `main.js`, `preload.js`, or `renderer/app.js` directly — they're build output.

Main-process changes (`src/main.ts`) require a full quit + relaunch of the exe to take effect
(no hot-reload). Renderer changes are picked up the same way.

### The other two apps

- **Comfy Bridge desktop** — `cd comfy-bridge`, `npm install`, then the same loop (`npm start`
  to run, `npm run refresh-app` for its portable test build at its own root).
- **Shared Bridge UI** (gallery sidebar, model picker modals, image lightbox) lives once in
  `comfy-bridge/src/renderer/shared/` — `npm run build:shared` (from `comfy-bridge/`) bundles it
  for mobile (`mobile/www/shared.js`) and copies the stylesheet to both shells
  (`renderer/shared.css`, `mobile/www/shared.css`). Never hand-edit those three copies.
- **Dataset-manager mobile** — `cd mobile`, `node sync-web.js`, `npx cap sync android`, then
  `./gradlew assembleDebug` in `android/` (needs the Android SDK and JDK 21).
- **Comfy Bridge mobile** — same Android steps from `comfy-bridge/mobile/`, running
  `npm run build:shared` (from `comfy-bridge/`) first so `www/shared.js` is current.

### Release build

```bash
npm run dist:zip     # → Shippable/ — normal compression by default, only run when you actually want a release
npm run dist:zip -- --config.compression=store   # skip compression entirely for a quick throwaway build
```

A GitHub release also gets a second, separate zip of just
`ComfyUI-dependencies/custom_nodes/ComfyUI-DataSetManagerNodes/` — so a user who only needs the
ComfyUI node pack (e.g. re-installing it after a ComfyUI update) doesn't have to download the whole
app to get it.

### Verifying a change actually works

A clean `npm run build` only proves imports resolve — it does not prove every runtime reference
is defined (the renderer is one big IIFE; a single unresolved reference silently breaks
everything wired after it, with zero build error). After `refresh-app`, launch with logging and
check for runtime errors:

```bash
ELECTRON_ENABLE_LOGGING=1 "./Osmium Workshop.exe" --enable-logging=stderr
```

then grep the output for `error|uncaught|exception`. Electron does not forward renderer console
output to the terminal by default, so this flag is the fast way to catch a silent failure without
opening DevTools by hand.

---

## Project structure

```
<project root>/
  src/
    main.ts              — Electron main process (window, IPC: app version, restart, zoom,
                             hardware acceleration, export app state, WD14/SynthDat's ComfyUI calls)
    preload.ts            — minimal security bridge exposed to the renderer
    renderer/
      index.ts             — composition root (core state, folder loading, wires every module)
      dom.ts                — every DOM element lookup, single source of truth
      shared-ui.ts          — toast/panels/confirm-modal/dropdown/pinch-zoom — dependency-free
      themes.ts, achievements.ts, tags-edit.ts, view.ts, ...   — one file per feature domain
      global-types.ts        — ambient types for the preload bridge
  tsconfig.main.json, tsconfig.renderer.json
  package.json

  # Build output (generated — do not hand-edit):
  main.js, preload.js, renderer/app.js

  # Static, hand-authored (not generated):
  renderer/index.html, renderer/styles.css, renderer/data/ (wiki.json, all_tags.json — Danbooru
    tag reference data, powers Tag Details; ~50MB combined, required for that feature)

  # The portable test build — regenerated by `npm run refresh-app`, gitignored, coexists with
  # source at this same directory root by design (not a stray leftover):
  Osmium Workshop.exe, resources/, locales/, data/, chrome_*.pak, *.dll, ...

  mobile/             — Android port of the dataset manager (Capacitor wrapper around the same
                        renderer; own package.json/node_modules, android/ native project)
  comfy-bridge/       — standalone ComfyUI generation UI: Electron desktop (src/, same
                        build/refresh loop as above) + Android port (mobile/, sharing
                        src/renderer/shared/ with desktop)

  Shippable/            — release zip output of `npm run dist:zip` (gitignored)
```

---

## Architecture notes

The renderer was ported from a single ~5,500-line untyped script into TypeScript and split into
~17 feature modules. `src/renderer/index.ts` is one top-level IIFE (it can't `export` from inside
itself) acting as the composition root: it owns core cross-cutting state (`entries`, `dirHandle`,
`entryByBase`, ...) and wires every extracted module together via a small injected-`deps` object
passed to that module's own `init*(deps)` call — never a circular import. Every extracted module
still carries `// @ts-nocheck`; real type annotations are a possible future increment, one module
at a time.

This repo is set up for **Serena** (MCP) — semantic code navigation plus a persistent
project-memory graph (`mem:core` and onward, project name `osmium-workshop-electron`, rooted
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
- **Changing the app icon** — the app icon lives at `build/icon.ico`/`.png`/`.icns` (referenced via
  `build.win.icon`/`build.linux.icon`/`build.mac.icon` in `package.json`, and separately via
  `BrowserWindow`'s own `icon` option in `main.ts` for the dev/unpackaged window). To swap it,
  regenerate all three formats from a new source PNG (electron-builder's Windows `.ico` needs
  multiple embedded resolutions, not just a renamed `.png`) and drop them in `build/` under the
  same names. `build/icon.ico`/`build/icon.png` must also stay listed in `build.files` — like any
  new runtime-needed file, electron-builder's packaged build won't include them otherwise (its
  `files` list is an explicit whitelist, not `**/*`).
