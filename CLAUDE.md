# Dataset Tag Studio — Development Context & Architecture

Local Electron desktop app for managing AI training dataset tags. No network calls, no uploads — everything stays on disk.

## What This Project Is

A tag editor for managing thousands of images and their captions (stored as `.txt` files in the same folder), for preparing LoRA/Stable Diffusion datasets. Browse images, edit/add/remove tags per image or bulk, compare tags across images, find/merge duplicates, undo any edit with full history. Also: themes, achievements, shop (cosmetic), zoom/font-size scaling.

## Architecture

**Source is TypeScript** (`src/`). `main.js`, `preload.js`, and `renderer/app.js` are **generated files** — never hand-edit them; edit `src/` and run `npm run build` (or `npm run refresh-app` for the dev loop, see below).

**Backend:** Electron (`src/main.ts` → `main.js`, `src/preload.ts` → `preload.js`)
- `main.ts`: window management, file I/O, IPC handlers for restart/page-zoom/GitHub-package-export
- `preload.ts`: minimal security bridge — only exposes `restartApp()`, `setZoomFactor()`, `generateGithubPackage()`
- No Node.js APIs exposed to the renderer

**Frontend:** `src/renderer/index.ts` is the composition root (~1,090 lines: core app state, folder loading, module wiring) plus its extracted modules, bundled by esbuild into `renderer/app.js`.
- `renderer/index.html`: structure only, hand-authored
- `renderer/app.js`: BUILD OUTPUT — do not hand-edit
- `renderer/styles.css`: all styling (25 themes + night/day mode), hand-authored
- `renderer/data/`: Danbooru wiki.json.gz (definitions) + all_tags.json.gz (tag vocabulary)

**Key file locations:** working source is `src/main.ts`, `src/preload.ts`, `src/renderer/*.ts` + `package.json`.

**Layout you'll see at the project root:** the built portable app (`Dataset Tag Studio.exe`, `resources/`, `locales/`, Chromium runtime files, `data/`) sits loose at the project root alongside `src/`, `node_modules/`, etc. — this is deliberate, not clutter. `npm run refresh-app` regenerates it from `dist/win-unpacked`; `run-portable-dev.bat` launches it. All gitignored, not source.
- `Shippable/` — release artifacts only, from `npm run dist:zip` (slow, `compression: "maximum"`). Only run this when an actual release is wanted; `refresh-app`/`npm start` cover routine verification.
- App data is portable, next to the built app's own folder (`data/`). The AppData-based path (`%APPDATA%\Dataset Tag Studio\tool\`) only applies to `npm start` dev-mode runs, not packaged builds.
- Don't reintroduce `DROP_UPDATES_HERE`, `applyUpdateBundle`, or `relaunchApp` — deliberately removed; updates are now a fresh zip download + moving `data/` over.

## TypeScript Build

- `npm run build` = `build:main` (tsc → `main.js`/`preload.js`) + `build:renderer` (tsc type-check, then esbuild bundles `src/renderer/index.ts` → `renderer/app.js`). Wired as a `pre*` step on `start`/`dist`/`dist:zip`/`dist:dir`/`refresh-app` — runs automatically.
- Every renderer module carries `// @ts-nocheck` — real type annotations are a possible later increment, module-by-module, never all at once.
- `src/renderer/global.d.ts` declares `window.electronAPI`'s shape.
- Renderer modules, one ES module each, imported into `index.ts`: `dom.ts` (DOM lookups — the single source of `$('id')` calls), `shared-ui.ts` (toast/panel show-hide/confirm modal/persistent dropdown/positionMenu/escapeHtml/pinch-zoom+long-press), `themes.ts`, `docks.ts`, `settings.ts`, `power-tools.ts`, `quick-merge.ts`, `tag-pruner.ts`, `tags-autocomplete.ts`, `achievements.ts` (stats/wallet/shop), `favorites.ts`, `edit-log.ts` (edit log panel + Stats tab charts), `tags-edit.ts` (add/remove tag, undo/redo, disable/restore, save-to-disk), `master-tag-control.ts`, `tag-details.ts` (wiki lookups), `tag-index.ts` (tag frequency list + gallery filtering), `view.ts` (gallery/compact/single rendering, chips, image modal, context menus), `random-facts.ts` (empty-state fact button, self-contained).
- **Module convention:** `index.ts` owns core cross-cutting state (`entries`, `dirHandle`, `selectedTags`, `galleryFilter`) and wires every module together via small `init*(deps)` calls — never a circular `import`. State a module owns that another file needs to *reassign* (not just mutate) must be exposed via an exported reset function (e.g. `resetUndoRedo()`), never a raw mutable export reassigned from outside. State `index.ts` owns that a module needs to *read* must be passed as a getter (`() => entries`), not a captured snapshot, since it may be reassigned wholesale elsewhere (e.g. `entries = []` on folder load).

## Critical Constraints

- **Floating panels** (Favorites, Log, Achievements, Shop, Settings, Tag Details, Theme Custom) live OUTSIDE `#app`, as `<body>` siblings — CSS `zoom` on `#app` scales the element's box independently of its container, so any new floating overlay must follow this pattern too. `#app` uses `100%/100%`, not `100vw/100vh`, for the same reason.
- **Font-size zoom is native Electron zoom**, not CSS zoom: `applyAppZoom(factor)` (`settings.ts`) → `window.electronAPI.setZoomFactor()` → main process. Clamped 0.86–3x server-side. Never add a CSS-zoom-based scaling path.
- **Night/day mode is an HSL lightness inversion** (`100 - L`, keep hue/saturation) in `themes.ts`, not a fixed palette swap. Custom theme is excluded (already user-controlled). Theme (and night-mode) application happens TWICE at startup, deliberately: `index.html`'s inline pre-paint `<script>` applies the saved theme before first paint (sets `window.__dtsPreThemed`), then `index.ts`'s `initTheme()`/`initNightMode()` check that flag and skip redoing the work (calling `syncNightModeFromPrePaint()` instead of re-inverting) — re-inverting an already-inverted display returns the wrong colors. Any change to the inversion formula in `themes.ts` must be mirrored in `index.html`'s inline script (a necessary duplicate, since it runs before any ES module loads).
- **No network font dependency** — system-font stacks only (no `fonts.googleapis.com`). Custom-font field in Settings covers user-installed fonts.
- **Text/language tagging:** Japanese and each foreign language are independent, non-exclusive selections (a page can have Japanese AND English AND Russian text at once). `syncTextPanelTags()` (`view.ts`) reconciles `draft.foreignLangs` (a `Set`) against the entry's "* text" tags independently of `draft.isJapanese`'s bare "text" tag — neither selection clears the other. No "Apply" button; every text-panel control writes tags immediately via its own change/click handler calling `syncTextPanelTags()`. Don't reintroduce single-select exclusivity or a staged "configure then Apply" step here.
- **Unsaved-changes close guard goes through main-process IPC, not `beforeunload`** — Electron doesn't implement the browser's "Leave site?" prompt; `preventDefault()` on `beforeunload` just silently blocks the close with no feedback. Pattern in place: `main.ts`'s `win.on('close', ...)` always `preventDefault()`s and sends `request-close` over IPC; the renderer checks dirty entries, shows `showConfirmModal()` if needed, then calls `electronAPI.confirmClose()` which sets `win.__closeConfirmed` and re-closes. Any future "warn before X" guard needs this same shape, not a bare DOM event.
- **Adding a new theme:** every theme needs its own `--accent-flair` var (a `THEME_VARS` entry in `themes.ts` — omitting it silently freezes that var under night mode) that's a genuinely distinct hue from `--accent-manual`, plus at least one non-color flourish (texture, animation, card-corner shape, button shape) distinct from other themes in the same visual cluster. `PREMIUM_THEMES`' `swatches` array must equal exactly `[--bg-base, --accent-manual, --accent-flair]`. Before adding a theme, convert its planned bg-base/accent-manual/accent-auto to HSL and compare hue against every existing theme in the same light/dark bucket to avoid near-duplicate palettes. The hover-fill button effect (`--accent-flair` sliding in from the left on hover) is reserved for epic/legendary shop tier — its selector must exclude `.img-menu-btn`, `.compare-img-cell button`, and every `all: unset`-based button class (`.ctx-item`, `.pdrop-item`, `.dock-collapse-btn`, `.chip button`, `.exclude-badge button`, `.lang-common-chip button`); grep the file for `all: unset` and `position: absolute` before adding any new broad theme-wide `button:not(...)` selector. A NEW epic/legendary theme still gets its own `html[data-theme="..."]` line added to those same selector groups — don't rely on `html.theme-refined` for that, it only covers themes individually upgraded via Refine Theme (see below), not the theme's own native tier.
- **Refine Theme (shop):** any non-epic/legendary theme can individually buy the same hover-fill effect via the Shop's 🔨 Refine Theme button, for `epicThemePrice() - themeOriginalPrice(themeId)` Edibits (`themes.ts`). Refined theme ids persist in `themes.ts`'s `refinedThemes` (localStorage `dts-refined-themes`), and `applyTheme()` toggles a generic `html.theme-refined` class based on membership — that class is OR'd into the same three hover-fill selector groups as the five hardcoded epic/legendary theme names in `styles.css`, so it needs no per-theme CSS of its own. Gated by the Settings "Suppress Theme Upgrade" checkbox (`suppressThemeUpgradeToggle`), which just hides the shop button entirely (`localStorage['dts-suppress-theme-upgrade']`).

## Data Flow

**Tag loading & normalization:** on folder open, each `image.jpg`/`.png` pairs with `image.txt` (UTF-8, one tag per line). On load: underscores → spaces, collapse whitespace, trim; stored as `entries[i].tags`. On save: spaces → underscores, written back to `.txt`. (One-way: a tag that ends up with underscores in-app is treated as containing a literal space, by design.)

**Edit history:** every tag add/remove logs to `folderStats.edit_log`; undo/redo stack is global, not per-image; logs persist to `_tag_edit_log.json` in the dataset folder.

**Favorites/Achievements/Wallet:** persisted to `localStorage`, scoped by folder hash (`_dts_meta.json` stores folder UUID). Achievements unlocked → Edibits earned (stored per-folder in `.json` files).

## Key Code Locations

- **Theme application:** `applyTheme()` in `src/renderer/themes.ts`
- **Theme picker dropdown (custom, not a native `<select>`):** `initThemeDropdown()` in `src/renderer/themes.ts` — `#themeSelect` stays hidden in the DOM as the value/option store; the visible control is a `.pdrop`-style div immune to native-select scroll-dismissal (see Known Pitfalls)
- **Day/Night toggle:** `toggleDayNightMode()` in `themes.ts`; `index.ts`'s `toggleDayNightModeAndTrack()` wraps it for achievement tracking
- **Font-size zoom:** `applyAppZoom()` in `src/renderer/settings.ts`
- **Dock drag-reorder:** `reorderDock()`/`setupDockSection()` in `src/renderer/docks.ts`
- **Tag mutation (add/remove/undo-redo/disable-restore/save):** `src/renderer/tags-edit.ts`
- **Retroactive merge/void catch-up for disabled images:** `retroApplyToDisabled()` / `retroApplyAllToDisabled()` in `tags-edit.ts`, triggered from `edit-log.ts`'s Log panel buttons
- **Quick Merge / bulk operations:** `src/renderer/quick-merge.ts`, `src/renderer/master-tag-control.ts`
- **Edit log:** `pushLogEntry()` in `edit-log.ts`; every significant action calls `recordChange()` (`tags-edit.ts`), which calls `pushLogEntry`
- **Achievements check:** `checkAchievements()` in `achievements.ts` (evaluates `ACHIEVEMENTS`)
- **Gallery/compact/single rendering, chips, image modal, context menus:** `src/renderer/view.ts`
- **Folder loading, core app state, module wiring:** `src/renderer/index.ts`
- **Dataset tab (folder manager — grid/list of previously-opened dataset folders):** `src/renderer/dataset-manager.ts` — IndexedDB-backed (own DB, separate from `favorites.ts`'s), themed two-layer SVG folder icon, drag-reorder, sort, and the per-folder context menu (remove/pin/view achievements/change icon)

## Feature Overview

**Core editing:** add/remove tags, full undo/redo with per-entry revert, Danbooru wiki definitions, tag autocomplete against `all_tags.json`, filter (AND/OR/XOR/NOT), sort by family/frequency/alpha, 3-dot image menu (text/language, comic/koma, review flags, blur, notes).

**Views:** Grid (modal, zoom/pan), Compact (shift+click sticky comparison), Single (multi-image tag-alignment table).

**Power tools:** Master Tags (checkbox-driven conditional apply/remove/find-replace), Tag Pruner (merge/void picker), Unify/Void (merge/delete, optionally including disabled images), Retroactive merge/void catch-up for disabled images.

**Dock system:** drag-reorder, collapse/expand, resize; docks are Tag Pruner, Unify/Void, Quick Merge; Settings has a reset-layout option.

**Distribution:** portable build, no AppData dependency; updates are a fresh zip download + moving `data/` over (no in-app updater); GitHub package generator for source-only export.

**Other:** 25 themes (4 free + 21 shop, common→legendary, 40–750 Edibits) each with `--accent-flair` + a distinct flourish, epic/legendary get the hover-fill button effect — any other theme can individually buy that same effect via the Shop's 🔨 Refine Theme button (cost = epic price minus that theme's own price), toggleable off via Settings' "Suppress Theme Upgrade"; 45+ achievements with rarity tiers; night/day mode; font-size zoom (1.4x–3x); custom fonts; power-tool card highlighting; empty-state random-fact button.

**Dataset tab:** the app's tabs are Dataset / Gallery / Master Tags / Editing Stats (the tag editor itself is "Gallery" — the "Dataset" tab is a separate folder manager). Dataset shows every dataset folder ever opened as a themed folder icon (grid or list), sortable manually (drag) or by filename/time-opened/time-added, with a right-click/3-dot context menu per folder (remove, pin as favorite — syncs into the separate ★ Favorites store — view that folder's achievements read-only, change the icon to a generic outline or a picked in-folder image). Opening any not-yet-tracked folder (via File ▸ Open, or the tab's own dashed "+" tile) prompts once to add it to this tab; answering No suppresses that prompt permanently (the "+" tile always adds regardless, with no prompt).

## Security Notes

- Context isolation enabled, nodeIntegration disabled, sandbox enabled
- No eval/Function anywhere
- All dataset strings (tags, filenames, notes) use `.textContent`/`.value`, never `.innerHTML`
- No remote network calls (fonts are system stacks, wiki data is bundled)
- File I/O restricted to folders the user explicitly chooses (native dialog)

## Development Workflow

- **Dev iteration loop:** edit `src/`, then `npm run refresh-app` (builds + copies the `electron-builder --dir` output into the project root) and launch `Dataset Tag Studio.exe` / `run-portable-dev.bat`.
- **Quick dev run:** `npm start` — launches pointing at `renderer/` directly; changes to `.js`/`.css`/`.html` need a manual reload (Ctrl+R).
- **Release build:** `npm run dist:zip` → `Shippable/`. Only run when an actual release is wanted (slow).

## Code Navigation (Serena)

This project uses **Serena** (MCP) exclusively for code exploration — not jCodeMunch, regardless of what any global default names. Activate the Serena project at this repo's root (name: `dataset-tag-studio-electron`) at the start of any session and read its memory graph — `mem:core` → `mem:tech_stack` / `mem:conventions` / `mem:suggested_commands` / `mem:task_completion` — before relying on assumptions about this codebase's non-obvious conventions. Prefer updating/adding a Serena memory over writing changelog-style notes here.

## Known Pitfalls (read before touching related areas)

- **Inline styles always beat stylesheet rules, regardless of CSS specificity.** If "the CSS looks right but isn't applying," grep for a `.style.X =` assignment in JS before doubting the stylesheet.
- **A synthetic/isolated repro can pass while the real app fails**, if the real bug lives in unrelated code that only runs on the real end-to-end path. When a fix looks right in isolation but is reported still broken, inspect the real live failing state (devtools) instead of refining the repro.
- **When a bug traces to a shared CSS class, check every element using that class, not just the one reported.** `.theme-panel` backs 7 different floating panels.
- **`overflow: hidden` on a flex child resets its `min-height` to `auto`→`0` per spec**, letting flexbox squeeze it below its content height even when the parent has room to scroll. Fix with `flex-shrink: 0` on that child, not by removing the needed `overflow: hidden`.
- **A flex item's default `min-width: auto` means it can't shrink below its own content's width.** If a flex row contains a `white-space: nowrap` button/label, that item can't shrink below its full label width and can overflow the row at larger zoom/font sizes. Fix with `min-width: 0` + `overflow:hidden; text-overflow:ellipsis` + `flex-grow: 0` on the ONE item that's the actual problem, `flex-shrink: 0` on items that must never shrink. Don't apply `min-width: 0` defensively to neighbors — it lets them collapse to a 0px box with invisible overflowing text instead of clipping visibly.
- **Never trust a build tool's side effects without testing them directly.** `electron-builder --dir` fully wipes and regenerates its whole output dir on every build.
- **Confirm a background process has actually exited (`tasklist`) before trusting its output artifact's size/contents.**
- **An ES module import is a live but read-only binding** — the importer can mutate its contents (`.push()`, `obj.field = x`) but `importedName = newValue` throws. Any module-owned state another file needs to *reassign* must go through an exported reset function, never a raw mutable export reassigned from outside.
- **A clean `npm run build` does not prove every reference resolves** — esbuild validates named ES-module imports have a matching export, but a bare undeclared-global reference (a symbol that moved to another module and was never re-imported) is invisible to it and only throws at runtime when that code path executes. After any module-boundary change, grep for the moved symbol's old call sites and re-check each `init(deps)` object against what that module actually uses.
- **`index.ts` is one big top-level IIFE — a single uncaught `ReferenceError` anywhere in it silently disables every statement after it**, with no error dialog and no visible symptom beyond "these buttons just don't do anything." Electron doesn't forward renderer console output to the terminal by default — to catch a silent renderer exception fast, launch the packaged exe as `ELECTRON_ENABLE_LOGGING=1 "./Dataset Tag Studio.exe" --enable-logging=stderr` and grep captured stderr for "Uncaught". Do this after any module-boundary change, not just a full click-through.
- **A native `<select>`'s own dropdown popup is OS-rendered and outside JS's control** — Chromium/Electron dismisses it the instant the mouse wheel scrolls anywhere outside it, with no click/blur/scroll event JS ever sees to intercept. If a future bug report says a dropdown/list "closes on scroll," check whether it's backed by a native `<select>` first; if so, no amount of outside-click-listener tuning will fix it — only replacing the visible control with a fully custom one will (see `initThemeDropdown()` in `themes.ts` for the pattern: keep the native `<select>` hidden as the value store, drive it from a custom `.pdrop`-style `<div>` with no scroll listener at all).
- **Never render another folder's achievements through the live `folderStats`/`folderUnlocked` globals in `achievements.ts`.** Those represent whichever folder is actually open right now; mutating or reassigning them to peek at a different folder's stats (e.g. from the Dataset tab's "View achievements" on a folder that isn't currently open) would corrupt the real session's in-memory state. Instead read that folder's `_dts_achievements.json` directly off its own stored `FileSystemDirectoryHandle` and pass the parsed `unlocked` array into `renderAchievementsPanel(unlockedOverride)` — it accepts an optional override for exactly this, defaulting to the live global when called with no args (see `dataset-manager.ts`'s `openReadOnlyAchievements()`).
- **The "Generate GitHub package" feature (`main.ts`'s `copyGithubPackageSource()`) used to copy `main.js`/`preload.js` verbatim from disk into the exported package, alongside the real `src/` it also ships** — contradicting its own stated intent ("ships source, not a compiled copy") and risking a genuinely stale compiled copy if the exporter had edited `src/` without rebuilding first. Harmless in practice (any real workflow from the export runs `npm run build` as a `pre*` step before it matters) but confusing, and neither the exported `GITHUB_GITIGNORE` nor this project's own `.gitignore` excluded those generated files — so they could get committed as tracked build output into what's supposed to be a clean-source GitHub repo. Fixed by dropping them from the copy list (matching `renderer/app.js`'s existing exclusion) and adding all three generated files to `GITHUB_GITIGNORE`. If this project's own `.gitignore` ever starts tracking a real git repo, it should get the same three entries.

## Known Quirks & Gotchas

1. **Underscore normalization is one-way** — see Data Flow above.
2. **Night mode doesn't apply to Custom theme** — it's already fully user-controlled; inverting it would be surprising.
3. **Drag-to-disable is discoverable via tooltip only** — hover an image card to see the shift+drag hint. Intentional, not a bug.
4. **Master Tags mini-grid and main gallery stay in sync bidirectionally** — `renderMasterMiniGrid()`.
5. **Achievement popups auto-dismiss after 5 seconds, no close button** — Settings toggle `achPopupsToggle` disables them entirely.
6. **Dock panels initialize from stored JSON** — if the layout breaks (corrupted JSON), Settings' "Reset panel layout" wipes it back to defaults.

## Maintenance Policy

Whenever a major feature ships or a major bug is fixed (user-requested feature, a bug that took real investigation, or anything changing what's true above), update this file in the same session: add a condensed rule to Known Pitfalls if it's a mistake worth not repeating, update Key Code Locations if a function moved, and update the relevant Serena memory if it's a durable convention worth keeping there too. Skip this for trivial edits.
