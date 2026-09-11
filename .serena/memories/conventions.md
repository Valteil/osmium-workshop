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

**Unsaved-changes guard on dataset switching.** `confirmDatasetSwitch()` (`index.ts`) is called from
`btnOpen`'s click handler and from `openFolderHandle()` (shared by `favorites.ts` and
`dataset-manager.ts` for reopening a saved handle) — same `entries.filter(.dirty)` +
`showConfirmModal()` pattern Quit/Restart/Unload already used, just phrased for "switching". Before
this fix, only Quit/Restart/Unload had the guard; opening a different folder by any other route
silently discarded edits.

**WD14 Autotagger (`wd14-tagger.ts`) added.** Sends selected image(s) to a WD14 Tagger node on a
user-run ComfyUI instance and merges returned tags onto each card; the app holds no model itself.
Two hard constraints learned building this:
1. **The HTTP calls MUST happen in `main.ts`, not a renderer `fetch()`.** Verified live against a
   real ComfyUI instance: its `server.py` runs `origin_only_middleware` by default, which 403s a
   cross-origin POST when `Origin` doesn't match `Host`; separately, Chromium's own CORS blocks
   reading the response regardless of that middleware. Neither restriction exists for a plain Node
   HTTP client. `main.ts`'s `wd14-get-models`/`wd14-tag-image` IPC handlers do the actual work
   (`/object_info`, `/upload/image` multipart, `/prompt`, poll `/history/{id}`) using Node's
   built-in `http`/`https` (no new npm dependency — multipart body is hand-built). This is the
   pattern for any future "talk to a local HTTP server" feature.
2. **All settings live in one place: Tag Overseer's expandable "⚙ WD14 settings" section**,
   persisted to `localStorage['dts-wd14-settings']`. The per-image 3-dot menu (`view.ts`) only
   calls `tagSingleImageWithWd14()` (a direct one-directional import, same as its existing
   `masterSelectedImages` import from `master-tag-control.ts` — no injected dep needed) to run a
   single-image batch with whatever's already configured; it never duplicates settings UI. The
   model list is scraped live from ComfyUI's `/object_info/WD14Tagger|pysssss` rather than
   hardcoded.

Batches (bulk or single) always commit as one `recordChange('add-tag', ...)` — same
`affected: [{base, prevTags, newTags}]` shape as every other bulk tag op, so Undo/Redo and the edit
log work for free. "Apply tags automatically" (vs. a review modal with an editable per-image tag
list + skip checkbox) is a user-facing toggle, not a fixed behavior.

**"Generate GitHub package" export was fundamentally broken for every real (packaged) build, not
just the stale-compiled-file issue fixed earlier.** Diagnosed by extracting a real built
`app.asar` (`asar list`/`asar extract`) and actually running the export's IPC handler against it,
then `npm install && npm run build && npm run dist:zip` on the result — the only way this class of
bug reliably surfaces, since a dev (`npm start`, unpackaged) run never hits it. Two independent
causes, both now fixed in `main.ts`'s `copyGithubPackageSource()`:
1. `electron-builder`'s `build.files` whitelist only listed `main.js`/`preload.js`/`renderer/**/*`
   — so a real packaged app's `app.asar` never contained `src/`, `scripts/`, or the two
   `tsconfig*.json` files at all. The export function's own `fs.existsSync()` guards silently
   skipped them, producing a "package" with no TypeScript source whatsoever. Fix: added
   `src/**/*`, `scripts/**/*`, `tsconfig.main.json`, `tsconfig.renderer.json` to `build.files`.
2. Even after that, `package.json` itself was still wrong: `electron-builder` unconditionally
   REWRITES `package.json` for every packaged build, stripping `scripts`, `devDependencies`, and
   `build` (verified by diff) — so the packaged copy on disk at runtime never has real build
   scripts or devDependencies, in any packaged build, ever. Fix: `copyGithubPackageSource()` no
   longer copies `package.json` from disk; it merges the live-but-stripped on-disk fields with
   three source-embedded constants (`GITHUB_PACKAGE_SCRIPTS`/`_DEV_DEPENDENCIES`/`_BUILD_CONFIG`)
   that must be kept in sync by hand if scripts/devDependencies/build config ever change.
3. A side discovery while fixing #1: `electron-builder`'s default file filters drop every
   `**/*.d.ts` unconditionally, and an explicit `files` entry for the exact path does NOT override
   this (tested directly). `src/renderer/global.d.ts` got renamed to `global-types.ts` to dodge it
   — a `declare global {}` block works the same regardless of file extension.

**UI animation mode (Fade/Swipe/Off).** One mechanism, `html.motion-off`/`html.motion-swipe`
classes toggled by a Settings dropdown (`index.ts`'s `applyUiAnimationMode()`), read everywhere via
shared CSS vars (`--pop-dur`/`--panel-dur`/`--tab-dur`, `styles.css` top) that Off zeroes and Swipe
leaves alone but that trigger different `transform` rules than Fade's default opacity ones. Every
call site follows the same sequential shape: add an "outgoing" class -> `setTimeout` matching the
duration -> swap actual state (display/mode) -> add an "incoming" starting-state class -> double-rAF
remove it to trigger the transition to rest. This shape lives in four places doing conceptually the
same thing: `shared-ui.ts`'s `positionMenu()`/`showPanel()`/`hidePanel()` (menus/panels, single
element, no direction), `index.ts`'s `switchTab()` (fixed per-pane direction — Datasets is the
leftmost tab so always slides left, Tag Overseer/Stats always right), `view.ts`'s `switchView()`
(direction computed per-transition from a `VIEW_TRANSITION_ORDER` array), and `view.ts`'s
`pageSingle()` (direction from prev/next). A new animated transition should reuse this shape and
the existing vars rather than inventing its own timing or toggle.

**Drag-reorder direction bug (fixed in `tag-index.ts` family reorder and `docks.ts`'s
`reorderDock()`).** "Always insert before the drop target" only works when dragging UP a list;
dragging DOWN silently lands one slot short (or does nothing, if dropped on the very next item)
because removing the dragged item shifts every later index left by one before the insert happens.
Fix: insert AFTER the target whenever the dragged item's original index was before the target's.
Same fix shape applies to `docks.ts`'s drop handler no longer using cursor Y position at all — it
now derives before/after purely from the two docks' current relative order, so dropping anywhere on
a dock (not just the correct half of it) swaps them.

**Real bug caught while adding the animation-mode dropdown: a bare, never-imported identifier
(`uiAnimationsToggle`) had been silently working for an entire prior session** because any element
with an `id` attribute is auto-exposed as a same-named global on `window` (HTML's "named access on
the Window object") — not a `ReferenceError`, just an accidental global read, invisible in testing
since it behaves identically to a correct import until the element's id changes. Always import
element refs from `dom.ts` explicitly; don't trust "no console error" as proof a reference is wired
correctly.

**Dock collapse animation left `max-height` permanently pinned on every row after expanding** —
`applyDockCollapse()` set `max-height`/`opacity` inline to drive the transition but only ever reset
`transition`/`overflow` in its completion `setTimeout`, never `max-height`/`opacity` themselves.
Confirmed live via Chrome DevTools Protocol (launched the packaged exe with
`--remote-debugging-port`, drove it from a raw Node `WebSocket` + `Runtime.evaluate`, clicked the
real collapse button, read `el.style.maxHeight` after the transition finished — stuck at a stale
`scrollHeight`-measured px value, every time, confirmed across repeated cycles and both Fade/Swipe
modes). Fixed by resetting every property the transition touched, not just the ones the "final
state" logic already cared about. This CDP-attach-and-drive-the-real-app technique is the right
tool for "some element's layout looks subtly wrong and I can't tell why from source" — worth
reaching for again before guessing.

Also fixed in the same pass: single-mode's arrow-key Left/Right navigation was calling
`singleIndex--/++` + `renderSingleView()` directly, bypassing `pageSingle()` entirely — so Swipe
mode's slide animation only ever played for the prev/next BUTTONS, never for keyboard navigation,
even though both are meant to do the same thing.

**Tauri port (`tauri-port/`) maintenance — standing rule, not optional.** Every session-ending
change to the Electron app now needs the equivalent applied to this port too. What that actually
means in practice:
- `src/renderer/*.ts` changes: usually nothing extra — `tauri-port`'s `tauri.conf.json` points
  `frontendDist` straight at this project's own `../renderer` folder (no copy), so both builds
  serve the identical compiled output. Verify the change isn't one of the exceptions below before
  assuming "free."
- A new/changed `preload.ts` method: add the matching case to `renderer/tauri-shim.js` (which maps
  `window.electronAPI.*` onto `window.__TAURI__.core.invoke(...)`) AND a new
  `#[tauri::command]` in `tauri-port/src-tauri/src/lib.rs` or `wd14.rs` doing the same work in
  Rust. The shim is the ONE shared file that needs a matching entry per Electron API surface
  change — it's not automatically covered by the "same renderer folder" fact above.
- A new/changed `main.ts` IPC handler that does real work (file I/O, HTTP, window control): needs
  a genuine Rust implementation, not a stub — this project's actual experience is that skipping
  this and assuming it'll "just work" is the most common way this rule gets silently violated.
- Always verify the Tauri-side change actually works rather than trusting that Rust compiling
  means it's correct — this session's own bugs (Quit doing nothing, drag-and-drop doing nothing,
  data ending up in the wrong directory) all compiled fine and were still wrong. Attach Chrome
  DevTools Protocol to a running `npx tauri dev` instance
  (`WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS=--remote-debugging-port=9222` before launching, then a
  raw Node `WebSocket` + `Runtime.evaluate` — no browser extension needed) and check the real
  behavior, the same way every bug in this port was actually found and confirmed fixed, not just
  argued into plausibility from reading the code.

Hard-won differences from the Electron version that are correct on purpose — don't "fix" these
back to match Electron while porting some unrelated future change:
- Data directory is `%APPDATA%\<identifier>\` (`app_data_dir()` in `lib.rs`), not portable-next-
  to-the-exe — an installer defaults to `Program Files`, which non-admin users can't write to.
- The window is built manually in Rust (`WebviewWindowBuilder` inside `.setup()`), not declared
  in `tauri.conf.json`'s `windows` array — needed for the custom data directory, and also carries
  `.disable_drag_drop_handler()`, without which Tauri's own default OS-level drag-drop handling
  silently breaks every native HTML5 drag-and-drop in the app on Windows (family reorder, dock
  reorder, Dataset tab tiles) — confirmed via Tauri's own doc comment on that method.
- `confirm_close` uses `std::process::exit(0)`, not `AppHandle::exit()` — the latter was observed
  live to close the window but leave the process running in the background. `window.close()` is
  overridden in the shim rather than left as Tauri's native window-close command, because the
  permission Tauri requires for that command to work at all ALSO lets it bypass the close-confirm
  guard entirely when called directly (confirmed live: granting the permission alone made Quit
  close the webview immediately with no dirty-check).
- No "Generate GitHub package" port exists or is planned — decided against it; the shim stub for
  it is permanent, not a placeholder.
- `npx tauri dev`'s Restart button shows a `Failed to unregister class Chrome_WidgetWin_0` error
  plus a "127.0.0.1 refused to connect" page — confirmed (by testing Restart against both
  `tauri dev` and a real compiled `tauri build --debug` binary side by side) to be a `tauri dev`
  CLI-only artifact, not reproducible in an actual installed build. Don't spend time chasing this.
- `src-tauri/target/` regrows to several GB after every full rebuild — normal Rust build-cache
  behavior, not a leak; `cargo clean` reclaims it instantly and it's already gitignored.

**Doc maintenance policy** (`CLAUDE.md`'s own "Maintenance Policy" section): after any
feature/bugfix judged "major" (user-requested feature, a bug that took real investigation, or
anything changing what `CLAUDE.md` currently asserts), update `CLAUDE.md` (Critical Decisions,
feature lists, footer "Latest state") in the same session. `DEVELOPMENT_LOG.txt` is retired/frozen
(see `mem:core`) — a Serena memory update is the replacement for what used to be a new changelog
entry, not required in addition to one.
