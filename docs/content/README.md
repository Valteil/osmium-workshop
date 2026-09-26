# Osmium Workshop

![Osmium Workshop](build/banner.jpg)

A feature-heavy, Comfyui-compatible dataset manager with a large amount of Quality of Life features. Has incredibly powerful dataset manipulation tools and automation, with attempts at finetuning UI and UX for an all-in-one image processor for all your slopping needs. Capable of syncing outputs directly to your Comfyui/outputs folder, and is bundled with an integrated workflow for use as both a dataset expander and an alternative Comfy webUI.

Built with Electron + TypeScript. Portable — unzip, run, done. Nothing installs anywhere else
on your system. And also built with a shitload of Claude and Opencode Go.

Disclaimer: As obviously stated, nearly all of this is AI-built. If for whatever reason that
somehow makes you grossed out when the whole point of a dataset curator is to train genAI, then
I don't know go eat a rock or something

> **Note:** the two generation-facing pieces of this repo, **SynthDat Overseer** and **Comfy
> Bridge**, both run on the same bundled workflow, which is built around Anima (a diffusion
> model by Circlestone Labs) and requires a running ComfyUI instance. ControlNet posing
> specifically needs Anima; other model families will probably load, but expect weird results
> since the workflow isn't built with them in mind. This is separate from WD14 tagging, which
> runs on-device by default and doesn't need ComfyUI at all.

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
2. **Osmium Workshop (mobile)** — an Android app for tagging on the go. Touch-friendly layout
   with bottom-sheet panels, tag editing straight from the image modal, and storage through
   Android's Storage Access Framework (a folder you pick stays accessible across restarts). It
   also does on-device WD14 tagging, downloading the model on first use, plus tagging and
   generation against your own ComfyUI instance over the network. **Still in development — no
   public APK yet**; build it from source (see below) if you want to try it.
3. **Comfy Bridge** (`comfy-bridge/`) — an alternate web UI for accessing the ComfyUI backend,
   featuring a built-in workflow: no node graph to navigate, every generation saves straight to
   disk (desktop: the folder you pick, remembered between launches; mobile: a picked folder or
   Documents/). Both builds share the gallery sidebar (browse subfolders, sort by name/date, pin
   favorites), model picker modals, and the zoomable image lightbox. Mobile details live in
   `comfy-bridge/mobile/README.md`; to reach ComfyUI from a phone, start it with `--listen
   0.0.0.0 --enable-cors-header` (ComfyUI already listens on 8188 by default) and allow inbound
   TCP 8188 through the firewall.

The rest of this document describes the desktop dataset manager. On mobile, read the in-app ❓
Help instead — it's rewritten for touch. Comfy Bridge mobile is documented in
`comfy-bridge/mobile/README.md`.

---

## Features

### Views (Gallery tab toolbar)
- **Grid** — the default editing view: image, editable tag chips, dirty/untagged markers, a
  3-dot menu per image. This is where everyday tagging happens. **Dynamic card heights**
  switches to masonry layout on mixed-size sets.
- **Compact** — dense thumbnails for scanning large folders fast. Hover to preview tags, or
  Shift-click two cards to compare them side by side.
- **Single** — one image at a time: a compact preview beside a roomy tag panel, with arrow keys
  and a type-a-number jump box. Click the preview for a full-size zoom/pan view to inspect fine
  details (text, hands, artifacts) before training.
- **Disabled** — a quarantine tab for images pulled out of the active set (drag a card onto it).
  Tags stay editable the whole time, and you can restore anytime. Good for maybes you're not
  ready to delete.
- **Originals** — the pre-bucketing originals kept by Bucket Images (below).

Clicking any image opens a floating, zoomable, pannable card modal without losing your place in
the grid. On desktop that modal also has **⟲/⟳ Rotate** and **✂ Crop** — real pixel edits that
rewrite the file (PNG/JPG/WebP), each one confirmed, logged, and undoable. Isolate saves a
cropped region as a *new* image instead, leaving the source untouched.

### Tagging
- **Chips** (on every card) — click one for filter-by-presence, the Tag Details wiki lookup, a
  review flag, or its keyword family. Type into "+ add tag" and hit Enter to add one. × removes
  it.
- **Tag Sorting** (Single view + image modal) — groups an image's chips into Character, Body,
  Face, Clothes, Limbs and Hands, Sexual, Pose, Scene, Effects and Other. For multi-character
  images, split tags into named subjects with their own category subheaders.
- **Filter sidebar** (left) — multi-tag AND/OR/XOR/NOT search (with a Lock to keep the mode)
  plus All/Untagged/Unsaved quick filters, **Flag isolated tags** (tags on ≤2 images), draggable
  family sort. Handy for finding images fast, and for hunting down typos. **Review flagged tags**
  lists every tag flagged for review across the dataset, with a one-click, undoable "Reviewed".
- **Tag Pruner** (right sidebar) — hand-pick tag sets, then **Unify** (merge into one name) or
  **Void** (delete). Confirmed, undoable, logged. Run several independent instances for unrelated
  tag families. 🔍 Mirror previews the affected images in the gallery before you commit. Use it
  to collapse spelling variants and junk tags across the whole dataset.
- **Retroactive Merge/Void** (right sidebar) — standing "these tags → this tag (or nothing)"
  rules that auto-correct matching tags the moment they come in, from any source. Try to
  hand-type a tag a rule covers, and it gets blocked with a pointer back to the rule. Pause a
  rule, or a single tag within it, to restore originals. Per-image Immunize and Antivoid
  exemptions cover the rest. Use it so a cleanup never has to be repeated.
- **Bucket Images** (right sidebar) — crops and resizes every image to its nearest LoRA training
  bucket, subject-first via a u2net saliency model (GPU with CPU fallback; ~176 MB, downloaded on
  first use). Originals move to `original_images/` and can be restored with one click.
- **Master Tag Control** (tab) — check off a batch of images, then run one tool across all of
  them: add or remove tags, add a tag only where another tag is already present, rename a tag
  dataset-wide, find-and-replace, or delete the selection outright. Use it for bulk passes, like
  tagging everything that contains a given character.
- **Delete permanently** (3-dot menu for one image, Master Tag Control for a batch) — removes
  the files from disk outright. There's no undo. A confirm modal gates it. It only removes the
  copy inside your dataset folder — a SynthDat-generated image's separate original in ComfyUI's
  own `output/` folder is untouched. Use it for rejects you never want back.
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
Sends the selected images (or just one, via its 3-dot menu) through WD14 and merges back the
tags. Tagging source is a per-setting toggle: on-device (no ComfyUI needed, model downloads on
first use, GPU acceleration via DirectML where available) or through a WD14 node on your own
ComfyUI instance. Host, model, and thresholds live in one settings section either way, with an
optional review-before-apply step, and the whole batch still undoes as one action. Use it to
bootstrap tags onto a folder of untagged imports.

### SynthDat Overseer (tab)
Needs a running ComfyUI instance — unlike WD14 tagging above, this one isn't optional-ComfyUI.
Grows a thin dataset by generating more images of the character you're training a LoRA on:
ControlNet-posed from a reference image, or plain prompted generation without one.
WD14-interrogate the reference first to steal its pose tags, hit Generate (1-Pass, or a 2nd
refinement pass, with live preview and a Stop button), then review the pending tag card — prune
tags, void-mark junk like artist or rating tags (voiding also adds a Retroactive Void rule on
Accept). **Accept** writes the image and its tags into the dataset immediately, crash-safe.
**Reject** parks it in `Disabled/` instead. Nothing generated gets silently thrown away. Use it
when five good images need to become fifty. (Also needs the ComfyUI node pack — see
`ComfyUI-dependencies/`.)

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
- Discrete mode — blur all images (or one) instantly, reversible.
- Native-zoom font scaling (never breaks layouts).
- Closing the app with unsaved changes prompts you to save first.
- **Hardware acceleration toggle** (Settings ▸ Performance) — render on the integrated GPU by
  default to keep your discrete GPU free for generation, or turn acceleration off entirely.
  Applies on next launch.

---

## Themes & the shop economy

26 themes total: 5 free and 21 in the **💰 Shop** (common → legendary, 40–750 Edibits).
Each theme is a whole look, not just a palette: its own bundled typefaces, button and tag
shapes, panel materials and textures, active-tab marker, and a matching stroke style for the
app's icon set. Even the empty space around an image (a thumbnail, Single view, the image card)
gets a faint pattern from the theme's world: pegboard, gold flakes, scanlines, a star chart.
Epic and legendary tiers add a hover/click button-fill and a card lift, drawn in that theme's
own style. Picking a theme you don't own yet just bounces back and tells you what it costs in
the Shop.

- **🏆 Achievements** (55+, per-folder) pay out **Edibits** to spend in the Shop — a "beg for
  free Edibits" button covers shortfalls. Use them to unlock themes by using the app.
- **Motion-sensitivity controls** (Settings ▸ Appearance) — kill all motion or just hover-fill,
  card tilt, or ambient animation. Use them if effects distract or discomfort you.
- **🎨 Colors** — recolor any theme live, save as your own "Custom" theme.
- **🌙 Night mode** — inverts each theme's colors directly, then nudges any text or accent
  color that would come out too faint, so every theme stays readable at night.
- **Swipe animation mode** (Settings ▸ Layout & Panels) — treats the app as one map: tabs,
  gallery views, and images slide in the direction they actually sit, and the image card grows
  out of the thumbnail you clicked.

---

## Updating

This app has no auto-updater. To update: download a fresh build, then move your `data/` folder
(settings, themes, achievements — everything that isn't the app code itself) from your old copy
into the new one. Delete the old copy once you've confirmed the new one works. It's the same for
Comfy Bridge desktop, whose `data/` holds presets and the remembered output folder. Android
builds update by sideloading the new APK over the old one (`adb install -r`), which preserves
app data.

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
is defined (the renderer is one big IIFE, so a single unresolved reference silently breaks
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
passed to that module's own `init*(deps)` call — never a circular import. The renderer is fully
type-annotated now (`strict: true`, shared types in `src/renderer/types.ts`) — there is no
`// @ts-nocheck` anywhere. The main process and preload are strict too, against a shared IPC
contract in `src/ipc-types.ts`.

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
  Electron binary download. Check your network/proxy and retry.
- **Tag Details shows "no definition found" for everything** — `renderer/data/wiki.json` and
  `all_tags.json` are missing. They're required for that feature, not optional.
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
