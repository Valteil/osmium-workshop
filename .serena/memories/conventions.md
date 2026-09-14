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

**The "Generate GitHub-ready package" Settings button/feature was removed entirely** (right-panel
UX pass) — it packaged the app's own source into a user-picked folder with a README/.gitignore/
HOW_TO_UPLOAD.txt for pushing to GitHub by hand; judged redundant and removed along with
`main.ts`'s `copyGithubPackageSource()`/`GITHUB_*` constants/`generate-github-package` IPC handler,
`preload.ts`'s `generateGithubPackage`, and the renderer wiring (`btnGithubPackage`). One fact from
building it is still relevant if this ever comes back or something similar is attempted:
`electron-builder`'s default file filters drop every `**/*.d.ts` unconditionally, and an explicit
`files` entry for the exact path does NOT override this (tested directly) — `src/renderer/
global.d.ts` got renamed to `global-types.ts` to dodge it, since a `declare global {}` block works
the same regardless of file extension. That rename stays even though the feature that surfaced the
bug is gone.

Its Settings-panel slot was reused for a new **"Export app state" button** — a debugging aid (not a
real feature for most users) that dumps every `localStorage` key this app writes (theme, toggles,
panel layout/width, WD14 settings, achievements/wallet progress — practically everything persisted
lives in localStorage here, per this app's portable-data design) plus a bit of runtime state
localStorage doesn't cover (dataset loaded y/n, image count, view mode), as JSON to a timestamped
`.txt` file next to the app (`main.ts`'s `export-app-state` handler, written via `getPortableRoot()`
— the same "root folder" the portable-data design already resolves).

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

**Tauri port — DISCONTINUED and deleted from the repo (2026-09-13).** A second build target
(`tauri-port/`, a Rust backend reusing the same `renderer/` folder) existed and was actively
maintained for a while, with a standing rule that every Electron change also needed a Rust
equivalent. Retired because that dual-maintenance cost (hand-porting every new `main.ts`/
`preload.ts` handler to `reqwest`/Rust and re-verifying via CDP) outweighed its value at this
project's stage — this app is Electron-only going forward, and that standing rule no longer
applies to anything. Don't resurrect `tauri-port/` from git history as a default move if
cross-platform reach comes up again; that'd be a fresh decision, not a fallback. (Its old approach
— `tauri-shim.js` mapping `window.electronAPI` onto `window.__TAURI__`, a Rust `wd14.rs` mirroring
the ComfyUI bridge, sharing `renderer/` verbatim between both builds — is preserved in git history
if ever worth referencing again.)

**Hardware acceleration / integrated-GPU steering feature.** Measured ~30% discrete-
GPU load from this app's own UI compositing alone — directly competing with ComfyUI's real
inference use of that same GPU on a hybrid-graphics laptop. Fixed with a Settings toggle
(`hwAccelToggle`, "Performance" section) that's ON by default (steers rendering onto the
integrated GPU, still accelerated) and can be turned OFF (disables GPU acceleration entirely,
pure software rendering) for users who'd rather have zero GPU usage or who have a GPU they don't
mind this app using. Two durable technical points from building this:
1. **GPU/acceleration preference can only be decided once, before any window/webview exists** —
   Chromium/WebView2 pick their GPU path at startup, no live-switch API exists. The preference
   has to live in a tiny file the main/Rust process reads directly (main.ts's
   `readHardwareAccelPref()`, lib.rs's `read_hardware_accel_pref()`), never the renderer's
   `localStorage` (unreachable that early) — Settings just persists a choice and prompts a
   restart, same startup-only shape as the close-confirm guard.
2. **The Chromium switch `--force_low_power_gpu` alone is not reliable for steering a
   hybrid-graphics laptop onto its integrated GPU — verified by testing both.** The actual OS-
   level mechanism is a registry key: `HKCU\Software\Microsoft\DirectX\UserGpuPreferences`, value
   name = the app's own full exe path, value data = `GpuPreference=1;` (`REG_SZ`) — literally what
   Windows' own Settings ▸ Display ▸ Graphics panel writes when a user manually sets an app to
   "Power saving." This steers DXGI's adapter enumeration before Chromium/WebView2 even starts.
   Shells out to `reg.exe add`/`query` (no new dependency), gated to release/packaged builds
   only — in dev, `app.getPath('exe')` points at a shared or per-project debug binary, not what a
   real user runs, and would otherwise leak into every OTHER Electron app's dev environment
   sharing the same `node_modules/electron` binary if not gated.

**SynthDat Overseer added (`src/renderer/synthdat-overseer.ts`).** Drives a user's own ComfyUI instance to generate synthetic
dataset images (train a rough character LoRA on a thin dataset, then generate more of that
character strong-armed into reference poses via ControlNet). Built around exactly ONE fixed,
hand-authored ComfyUI workflow, not a generic loader — the workflow-editor `.json` format is NOT
what `/prompt` accepts, so the node-id map was captured by queuing the workflow once from a live
ComfyUI instance and pulling the real submitted graph back out of `GET /history/<id>`, which
resolves packed subgraphs and mute/bypass state exactly like ComfyUI's own compiler would (hand-
converting the UI-format export would have meant reimplementing that compiler). 1-Pass vs 2-Pass
is presence/absence of nodes in the submitted dict, not a mode flag — there's no such concept in
the API format. See `CLAUDE.md`'s own SynthDat Overseer entries (Critical Constraints, Key Code
Locations) for the full node-id map rather than duplicating it here; keep both in sync if the
template ever changes.

Two durable, broadly-reusable techniques from building it:
1. **Reconstructing "tag X was merged into tag Y" from the edit log, with no schema change —
   superseded by `canonical-tags.ts`'s shared `canonicalRules`, see below.** Originally,
   `buildMergeHistoryMap()` diffed `editLog`'s own `merge`/`rename` `{prevTags, newTags}` pairs
   per affected image directly. As of the Retroactive Merge/Void feature (below), it instead reads
   the same `canonicalRules` list that dock maintains, since that dock became the app's one shared
   source of truth for merge/void history — keeping two independent reconstructions of the same
   fact in sync was exactly the "stale duplicate implementation" pattern to avoid. The technique
   (diffing `{prevTags, newTags}` to recover an old→canonical map) is still worth knowing as a
   fallback for a *first-run* bootstrap with no existing rules yet — see
   `canonical-tags.ts`'s `reconstructFromEditLog()`, which does exactly this once per dataset, from
   the log's own direct `{mergedTags, unifiedTag}`/`{voidedTags}` fields (simpler than diffing,
   since `tags-edit.ts`'s `recordChange()` already writes those fields explicitly) — but for any
   ongoing "has this tag been superseded" need, read `canonicalRules` directly rather than adding a
   third reconstruction.
2. **A new runtime `dependencies` entry (added `ws` for a ComfyUI preview-frame WebSocket) is NOT
   automatically bundled into the packaged app.** This project's `package.json` `build.files` is
   an explicit whitelist with no blanket `node_modules/**` entry (see the GitHub-package-export
   bug above — same root cause, different symptom). Works fine in dev, throws `Cannot find
   module` only in a packaged build. Any new main-process npm dependency needs its own
   `node_modules/<pkg>/**/*` line added to `build.files`. Verify with
   `npx asar list resources/app.asar | grep node_modules` after `refresh-app` (paths use
   backslashes on Windows).

**Textarea auto-grow can silently defeat its own `rows` attribute for empty fields.** Setting
`el.style.height` via JS to auto-grow a textarea (SynthDat Overseer's prompt fields) makes
`scrollHeight` collapse to roughly one line for empty content regardless of `rows`, the moment ANY
inline height has been set — so a "grow every field once on load" pass visually shrinks untouched
fields below their own HTML default. Fix is a CSS `min-height` floor, not touching the JS —
`min-height` always wins over a smaller inline `height`.

**Image lock added (`entry.meta.locked`), a general "skip this in automatic tools" flag, not
specific to any one feature.** Toggled via the shared 3-dot image menu
(`view.ts`'s `openImageOptionsMenu`, one toggle covers both Grid and Single view since they share
it), plus mass lock/unlock in Master Tags and a toolbar "Unlock all". Every mass/automatic tag
operation across the app (Quick Merge, Unify/Void, retroactive disabled-image catch-up, every
Master Tags mass/conditional/rename/find-replace action including Apply/Remove-to-Selected, the
bulk WD14 trigger) now checks it alongside its existing `e.disabled` skip — but manual single-
image actions (adding one tag by hand, the per-image WD14 3-dot trigger, disable/restore) are
deliberately exempt, since locking is about protecting an image from being swept up by something
the user didn't specifically aim at it. Any FUTURE feature that loops over
`getEntries()`/`filteredEntries()` and mutates tags without the user hand-picking that exact image
in the moment must add the same `e.meta.locked` check.

**Retroactive Merge/Void dock added (`src/renderer/canonical-tags.ts`), replacing two older,
narrower systems.** A gallery right-sidebar dock holding standing rules
`[child tag, child tag, ...] → canonical tag` (merge) or `→ null` (void: children get deleted
outright, represented as a rule with `canonical: null` rather than a separate mechanism — same
dock, same list, one less concept). Rules persist per-dataset as `_dts_canonical_tags.json`
(same load/save shape as `edit-log.ts`'s `_tag_edit_log.json`); on first load of a dataset with no
such file yet, `reconstructFromEditLog()` seeds rules once from that dataset's own past
merge/void log entries, then the persisted file becomes the sole source of truth from then on (a
user's own edits — narrowing or widening a rule's children, deleting a rule — never get
reconciled back against log history).

Two design points worth keeping if this pattern comes up again:
1. **Hooking into the existing universal mutation funnel beats instrumenting every mutation site.**
   Rather than adding a call to every one of the app's several tag-mutating code paths (manual
   add/remove, Quick Merge, Unify/Void, WD14, undo/redo), `applyCanonicalRules(entry)` was added to
   the START of `tags-edit.ts`'s `markDirty(entry)` — confirmed via grep that every one of those
   paths already calls `markDirty()` immediately after mutating `entry.tags`, even ones that bypass
   `addTagToEntry`/`removeTagFromEntry` by reassigning `e.tags` directly. One hook point, no
   per-site instrumentation, no risk of a future new mutation path forgetting to wire it in.
2. **"Retroactive" means resweeping on every rule change, not gating the mutation-time check.** A
   rule can be added/edited while some matching tag already sits on a Disabled (or just
   already-loaded) entry that no live mutation will ever touch again. `registerMergeRule()` /
   `registerVoidRule()` / any dock edit call `resweepAllEntries()` after persisting — it walks every
   currently loaded entry (Disabled included, locked excluded per the usual mass-tool convention),
   reapplies every current rule, and `markDirty()`s + UI-refreshes whatever actually changed. This
   is strictly additive to (not a replacement for) the `markDirty()` hook — the hook catches new
   tags arriving after the rule exists, the resweep catches tags that were already there when the
   rule was created or changed.

Replaced: `tags-edit.ts`'s checkbox-driven `retroApplyToDisabled()`/`retroApplyAllToDisabled()`
(deleted — required the user to notice and click a manual replay button per merge/void log entry,
with zero standing visibility into what had actually been merged/voided) and
`synthdat-overseer.ts`'s own independent `buildMergeHistoryMap()` reconstruction (now reads shared
`canonicalRules` instead, see above).

**Retroactive Merge/Void got a "full control" pass, including a deliberate scope reversal.**
The dock's rules and its two new per-image exemptions now only affect Gallery-visible entries —
`applyCanonicalRules()` (`canonical-tags.ts`) returns `false` immediately for
`entry.disabled || entry.pendingApproval`, and `resweepAllEntries()` skips them before calling it
at all. This directly REVERSES that module's own original design (which explicitly reswept
Disabled images too, per an earlier "it should autosweep all existing since it is retroactive"
instruction) — a later request in the same overall feature's lifecycle explicitly asked for
Gallery-only scope instead, confirmed via a clarifying question before implementing. If a future
session sees "retroactive" in the dock's name and assumes it should sweep Disabled entries, check
`canonical-tags.ts`'s header comment and CLAUDE.md's own pitfall entry first — this was a
confirmed decision, not an oversight.

Three "full control" additions layered onto the base rule shape (`{id, canonical, children,
enabled, disabledChildren}`):
1. **Per-rule pause** (`rule.enabled`) — stops a rule from applying anywhere without deleting it;
   re-enabling immediately resweeps.
2. **Per-child toggle** (`rule.disabledChildren: string[]`) — excludes one child tag from a rule's
   effect while keeping it on record, distinct from the × button which forgets it entirely. Chip
   UI (`buildChip()`) grew its own checkbox for this, separate from the existing remove button.
3. **Per-image exemption** (`entry.meta.mergeImmune`/`.antivoid`, independent booleans) — a
   PERMANENT exemption from merge and/or void rules specifically, checked in
   `ruleAppliesToEntry()`. Deliberately a different concept from `entry.meta.locked` even though
   both are entry.meta booleans toggled from the same two surfaces (`view.ts`'s 3-dot menu,
   `master-tag-control.ts`'s mass-select buttons) — Lock is "skip unattended batch operations
   entirely," these are "never apply standing rules to this image specifically," and an image can
   be one without the other. Both surfaces also expose "Antimmunize" as a convenience shortcut
   that sets/clears both flags together, not a third independent flag.

**A rule's canonical tag can legitimately also be one of its own children** (e.g. merging "black
dress"/"dress" into canonical "black dress" itself) — handled as a no-op in
`applyCanonicalRules()` (filtered out, then unconditionally re-added) with no special-casing
needed. The one place this DID need special-casing: `findBlockingRule()` (the new typed-tag block,
below) explicitly skips a rule if the typed tag equals that rule's own canonical, regardless of
whether it's also present in `children` — typing the canonical form is always the correct/target
spelling, never something to block as "affected by its own rule."

**Typing a tag by hand that a standing rule would otherwise silently rewrite is now BLOCKED
outright instead of add-then-correct.** `tags-edit.ts`'s `addTagToEntry()` — already established as
the universal manual single-tag-add funnel (chip input, autocomplete, WD14 review modal, the
language/comic/koma checkboxes) — calls `findBlockingRule(tag, entry)` before pushing the tag; a
match refuses the add with a toast instead. Deliberately NOT applied to automatic/bulk paths
(Quick Merge, Master Tags mass-apply, WD14 bulk trigger) which still add-then-`markDirty()`-correct
as before — blocking there would silently drop tags from an unattended batch with no way for the
user to notice, unlike a manual single-tag add where the toast is seen immediately.

**Retroactive Merge/Void: toggling off now actively unmerges/unvoids via the edit log, not just
stops future correction.** A follow-up to the "full control" pass above — the user clarified that
disabling a rule (or one of its children) should restore exactly the tags each affected image
originally had, using `editLog`'s own `{mergedTags/voidedTags, affected:[{base, prevTags,
newTags}]}` records as ground truth (already written by every merge/void action — no schema
change needed). `canonical-tags.ts`'s `unmergeChildren(rule, childrenBeingTurnedOff)` builds a
one-time `tag -> Set<base>` evidence index (`buildMergeEvidenceIndex()`/`buildVoidEvidenceIndex()`)
instead of rescanning the log per entry (would be O(entries × log length) otherwise), then per
Gallery entry: restores any turned-off child the log proves THAT image actually had, and — for
merge rules — drops the canonical tag only once no other still-active child is proven present on
that same image. Confirmed via the worked example: an image with only "dress" (merged into "black
frilly dress" alongside images that also had "black dress") gets exactly "dress" back and loses
the canonical tag; an image that had both keeps the canonical tag (still justified by "black
dress") and gets "dress" back alongside it. Wired into FOUR places uniformly — rule-level Enabled
checkbox off, per-child chip checkbox off, that chip's × (forget entirely), and the rule's own
Delete button — all pass "which children just got turned off" and let the function evaluate
against the rule's already-updated final state, so a whole-rule disable (which turns off every
child in one action) correctly reasons about ALL of them together rather than one-at-a-time with
stale intermediate state. Turning a rule/child back ON needs no mirrored call — the existing
`resweepAllEntries()` already re-folds it forward, so the toggle is naturally symmetric.

**Merge Immunize / Antivoid got card badges, added to a NEW shared `buildMergeVoidBadgesEl()`
(view.ts), not the pre-existing `buildStatusIconsEl()`.** Investigated first: `buildStatusIconsEl()`
is a different, unrelated badge system (language/comic/etc. indicators) that happens to already be
shared between Grid and Single — but Lock's own badge is Grid-only today (a pre-existing, separate
gap, not something this pass fixed). Rather than overload `buildStatusIconsEl()` with an unrelated
concept, added a small dedicated function and called it from both `buildCard()` (Grid) and
`renderSingleView()`, per an explicit user decision that Compact should NOT get these badges
(keeping its cards minimal) even though it could technically call the same shared function.

**Retroactive Merge/Void rule edits became a dirty/saveable action instead of an instant disk
write, mirroring `entry.dirty`.** Previously every rule mutation called `saveCanonicalRules()`
directly, writing `_dts_canonical_tags.json` immediately regardless of the app's own autosave
setting — inconsistent with every other edit in the app, which stays dirty (in-memory only) until a
manual Save or an autosave debounce fires. Fixed by adding `tags-edit.ts`'s `rulesDirty` flag
(`markRulesDirty()`/`resetRulesDirty()`), which folds into the SAME `updateDirtyUI()`/`btnSave`/
`scheduleAutosave()` machinery as `entry.dirty` — `dirtyCountEl` now reads `(N + rules)` or `(rules)`
when applicable, and `saveAllDirty()` is the only thing that actually calls
`canonical-tags.ts`'s `saveCanonicalRules()` now. Since `canonical-tags.ts` already imports FROM
`tags-edit.ts` (no circular import), it couldn't import a `markRulesDirty` function back the normal
way — it's injected via the same `initCanonicalTags(deps)` pattern `markDirty`/`refreshAllUI`
already use. Every rule-mutating call site (`commitRuleChange()`, `registerMergeRule()`/
`registerVoidRule()`, the delete-rule button, naming a freshly-added rule) was switched from
`saveCanonicalRules()` to this injected dep — except `loadCanonicalRulesForFolder()`'s first-run
editLog-reconstruction bootstrap, which deliberately still saves immediately since it's a derived
migration, not a user edit needing a save prompt. All FIVE of the app's unsaved-changes guards
(Quit/Restart/Unload/Reload/dataset-switch) were consolidated to check a new shared
`unsavedChangesDescription()` helper (`index.ts`) instead of each independently computing
`entries.filter(e=>e.dirty).length` — it now also checks `rulesDirty` and returns a combined
plain-English description ("N unsaved caption change(s) and unsaved Retroactive Merge/Void rule
change(s)") or `null`. `resetRulesDirty()` is called right after both `loadCanonicalRulesForFolder()`
call sites (folder load AND unload) so a discarded rule change from the PREVIOUS dataset doesn't
linger and misrepresent the newly loaded one's actual save state — same reasoning as why `entries`
gets wholesale-replaced rather than patched on folder switch.

**Retroactive Merge/Void's unmerge/unvoid restorations and rule-config changes both got proper
log entries — a follow-up gap from the "toggle actually restores tags" pass.** Two new log types:
`'unmerge'`/`'unvoid'` (`canonical-tags.ts`'s `unmergeChildren()`, one entry per call covering
however many images it touched, via an injected `recordChange` dep so it also lands on the global
Undo/Redo stack like `'merge'`/`'void'` do) and `'rule-update'` (pure rule-config changes — pause/
resume, add/remove/toggle a child, create, delete — via plain `pushLogEntry()` since there's no
tag-level `affected` data for Undo/Redo to act on). Confirmed the specific requirement this was
chasing: voiding a tag, unvoiding it, then voiding it again must show as THREE separate,
correctly time-ordered log rows (void / unvoid / void), not one entry mutated in place — satisfied
automatically since each action is its own `pushLogEntry()` call with its own timestamp, same as
every other action in this app. `edit-log.ts`'s `TAG_TYPES` set (gates Undo/Redo buttons in the Log
panel) got `'unmerge'`/`'unvoid'` added but deliberately NOT `'rule-update'`; `STAT_CHART_COLORS`/
`STAT_TYPE_LABEL` got all three names added for Stats-tab completeness. A new gotcha worth
repeating: `canonical-tags.ts` still can't import `tags-edit.ts` back (circular), so `recordChange`
reaches it the same injected-dependency way `markDirty`/`markRulesDirty` already do — but
`pushLogEntry` itself has NO such restriction (`edit-log.ts` doesn't import either module), so the
rule-config-only log calls just import it directly, no injection needed.

**3-dot menu label bloat fixed: every button's visible text is now just the action name, full
explanation moved to `title`.** `view.ts`'s `openImageOptionsMenu()` had grown full-sentence
button labels ("🔒 Lock this image (skip mass tools)") that read as a wall of text once Merge
Immunize/Antivoid/Antimmunize joined Disable/Lock/Reset/WD14. Fixed uniformly across the whole
menu: short `textContent` (icon + 1-3 words), the sentence goes in `title` instead. Any new item
added to this menu should follow the same shape.

**Merge Immunize/Antivoid/Antimmunize icons were reassigned for thematic reasons, not swapped
arbitrarily — keep the reasoning if this comes up again.** Original icons (🛡 for Merge Immunize,
🚫 for Antivoid, 🛡🚫 combined) were replaced with 🚫 (Merge Immunize — blocking a merge reads like
a "no entry" sign), 🟢 (Antivoid — a safe/protected green, deliberately distinct from void's own
danger-red styling elsewhere in the app), and ✋ (Antimmunized — an open hand, "stop," both
directions). Updated in three places that all needed to independently agree: `view.ts`'s 3-dot
menu buttons, `view.ts`'s `buildMergeVoidBadgesEl()` (card badges), and the Master Tags mass-select
button labels in `index.html`.

**The "Unsaved Approved" staging folder / `pendingApproval` concept was removed entirely
(right-panel UX pass).** SynthDat Accept used to write into a separate `Unsaved Approved/` folder
and stay there (as an `entry.pendingApproval` entry, hidden from the normal Grid view, with its own
dedicated toolbar filter button) until `promotePendingApproval()` (tags-edit.ts) moved it into the
dataset root on the next Save. All of that — the folder, the flag, the toolbar button/view mode,
`promotePendingApproval()`/`ensureUnsavedApprovedDir()`, and every `!e.disabled && !e.pendingApproval`-
style check across `canonical-tags.ts`/`tag-index.ts`/`view.ts` — is gone. `writeImageEntry()`
(Accept branch, `synthdat-overseer.ts`) now writes the image + a `.txt` straight into the dataset
root immediately (tags are still written to disk right away, not left purely in-memory, so a crash
before the next Save doesn't lose them), then calls `markDirty(entry)` — Accept is just a normal
new dirty entry now, same lifecycle as anything else. `loadFolder()` (index.ts) still does a
one-time backward-compat scan of a leftover `Unsaved Approved/` folder from an older app version
(if present) and folds its contents into the active set as ordinary entries, so nobody upgrading
loses images that were stuck there — but nothing writes into that folder anymore going forward.

**Doc maintenance policy** (`CLAUDE.md`'s own "Maintenance Policy" section): after any
feature/bugfix judged "major" (user-requested feature, a bug that took real investigation, or
anything changing what `CLAUDE.md` currently asserts), update `CLAUDE.md` (Critical Decisions,
feature lists, footer "Latest state") in the same session. `DEVELOPMENT_LOG.txt` is retired/frozen
(see `mem:core`) — a Serena memory update is the replacement for what used to be a new changelog
entry, not required in addition to one.
