# Conventions

**Renderer module architecture ("Phase B split"):** `src/renderer/index.ts` is a single top-level
IIFE (it can't `export` anything from inside itself) acting as the composition root; ~17 extracted
modules (`dom.ts`, `shared-ui.ts`, `themes.ts`, `tags-edit.ts`, `view.ts`, etc.) each own one
domain. Cross-module wiring goes through a small injected-`deps` object passed to that module's own
`init*(deps)` call from `index.ts` — never a circular `import`. State a module owns that another
file needs to *reset/reassign* (not just read/mutate) must be exposed via an exported reset
function (e.g. `resetUndoRedo()`), never a raw mutable export reassigned from outside — ES module
bindings are read-only from the importer's side. `dom.ts` is the single source of DOM element
lookups (`$('id')`); other modules import refs from there, never call `document.getElementById`
directly.

**A clean build does not prove every reference resolves.** esbuild validates named ES-module
imports resolve; it does NOT catch a bare undeclared-global reference (a symbol that moved to
another module and was never re-imported). Because `index.ts` is one IIFE, a single such
`ReferenceError` anywhere in it silently kills every statement wired *after* that point at
runtime, with no build error and no visible symptom beyond "these buttons just don't do
anything." After any module-boundary change, grep for the moved symbol's old call sites, and to
verify at runtime launch the packaged exe as
`ELECTRON_ENABLE_LOGGING=1 "./Dataset Tag Studio.exe" --enable-logging=stderr` and grep the
captured stderr for "Uncaught" (Electron does not forward renderer console output to the terminal
by default).

**Theme CSS system** (`renderer/styles.css`, 25 `html[data-theme="X"]` blocks — 4 free + 21 shop):
every theme defines the same variable set including `--accent-flair` (a third accent hue beyond
`--accent-auto`/`--accent-manual`, used for baseline chrome like the active-tab underline so
themes stay visually distinct even in undecorated UI). Any new/edited CSS var MUST be added to
`THEME_VARS` in `themes.ts` or it silently freezes at its authored value instead of inverting
under night mode. `PREMIUM_THEMES`' `swatches` array must equal exactly
`[--bg-base, --accent-manual, --accent-flair]` for that theme — it's a promise about what the
theme actually looks like, shown in the shop, sorted by price there. Before adding a broad
theme-wide `button:not(...)` selector (e.g. a new hover/click effect), grep the file for
`all: unset` and `position: absolute` button classes first and exclude them — both patterns have
caused real, hard-to-diagnose bugs (squashed text, broken button positioning) when a theme-wide
selector overrode their properties. Before adding a NEW theme, convert its planned
bg-base/accent-manual/accent-auto to HSL and compare hue against every existing theme in the same
light/dark bucket — near-duplicate palettes (same hues, different flourish) have shipped and had
to be consolidated away later; a script-driven HSL check catches this, eyeballing doesn't.

**Electron-specific gotchas:**
- `beforeunload` + `preventDefault()` does NOT show a "leave site?" dialog in Electron (unlike a
  real browser) — it silently blocks the action with zero feedback. Any "warn before doing X"
  guard must go through main-process event interception (`win.on('close', ...)`) + an IPC
  round-trip to the renderer, not a bare DOM event.
- A native `<select>` can resolve its OS-rendered option-picking interaction with a click whose
  `event.target` is `<html>`/`<body>` itself, outside the page's own element tree. Any
  outside-click-to-close handler using `!wrap.contains(ev.target)` must skip clicks targeting
  `document.documentElement`/`document.body`, or picking an option reads as "clicked off" and
  closes the containing panel unpredictably.

**Native `<select>` dropdowns can't be kept open through a scroll — replace them instead of
patching listeners.** A native `<select>`'s popup is OS-rendered; Chromium/Electron dismisses it
the instant the wheel scrolls outside it, with no click/blur/scroll event JS ever sees to
intercept. The theme picker (`#themeSelect`) hit this — tuning the containing flyout's
outside-click guard (even switching click→mousedown) did nothing, because the real popup closing
wasn't that listener's doing at all. Fix used: `initThemeDropdown()` (`themes.ts`) keeps the
native `<select>` in the DOM but hidden, as the plain value/option store every other module still
reads via `.value`/`querySelector('option[...]')`, and drives it from a fully custom `.pdrop`-style
`<div>` dropdown with no scroll listener at all — structurally immune rather than carefully
guarded. If a future "list closes on scroll" report traces to a native `<select>`, don't waste
time on outside-click-detection tuning; replace the visible control.

**Dataset tab (folder manager, `dataset-manager.ts`) added.** Tabs are now Dataset / Gallery /
Master Tags / Editing Stats — the tag editor itself is "Gallery" (renamed from the old "Dataset"
tab id, which is why `tabGallery`/`galleryTab` exist instead of `tabDataset`/`datasetTab`). The
new Dataset tab lists every previously-opened dataset folder as a themed folder icon (grid/list),
backed by its own IndexedDB store (separate from `favorites.ts`'s), following the exact same
"store `FileSystemDirectoryHandle` objects, `requestPermission()` before reopening" pattern
`favorites.ts` established first. Reading another (non-active) folder's achievements for the
tab's "View achievements" action must never touch `achievements.ts`'s live
`folderStats`/`folderUnlocked` globals — `renderAchievementsPanel()` takes an optional
`unlockedOverride` param for exactly this, read straight off that folder's own
`_dts_achievements.json` via its stored handle, defaulting to the live global for every other
call site.

**Doc maintenance policy** (`CLAUDE.md`'s own "Maintenance Policy" section): after any
feature/bugfix judged "major" (user-requested feature, a bug that took real investigation, or
anything changing what `CLAUDE.md` currently asserts), update `CLAUDE.md` (Critical Decisions,
feature lists, footer "Latest state") in the same session. `DEVELOPMENT_LOG.txt` is retired/frozen
(see `mem:core`) — a Serena memory update is the replacement for what used to be a new changelog
entry, not required in addition to one.
