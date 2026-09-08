# Dataset Tag Studio — Development Context & Architecture

This is a local Electron desktop app for managing AI training dataset tags. No network calls, no uploads — everything stays on disk.

## What This Project Is

A tag editor for managing thousands of images and their captions (stored as `.txt` files in the same folder). Used for preparing datasets for LoRA/Stable Diffusion training. The app lets you:
- Browse images, edit/add/remove tags per image or bulk
- Compare tags across images
- Find/merge duplicate tags
- Undo any edit with full history
- Themes, achievements, shop (cosmetic)
- Zoom/font-size scaling (fixed via native Chromium zoom)

## Architecture

**Backend:** Electron (main.js + preload.js)
- `main.js`: window management, file I/O, IPC handlers for update bundles and page zoom
- `preload.js`: minimal security bridge — only exposes `applyUpdateBundle()`, `relaunchApp()`, `setZoomFactor()`
- No Node.js APIs exposed to the renderer

**Frontend:** Single-file Renderer (~6,200 lines across three files)
- `renderer/index.html`: ~425 lines, structure only
- `renderer/app.js`: ~4,500 lines, all logic (IIFE, global scope, no ES modules)
- `renderer/styles.css`: ~1,300 lines, all styling (8 themes + night/day mode)
- `renderer/data/`: Danbooru wiki.json (definitions) + all_tags.json (1M+ tag vocabulary)

**Key File Locations:**
- Working source: `/home/claude/dataset-tag-studio-electron/renderer/` + `main.js`, `preload.js`, `package.json`
- App data on user's machine:
  - Mac: `~/Library/Application Support/Dataset Tag Studio/tool/`
  - Windows: `%APPDATA%\Dataset Tag Studio\tool/`
  - Linux: `~/.config/Dataset Tag Studio/tool/`
- `main.js` copies bundled `renderer/` files to `tool/` on first run; user can drop-in-replace any renderer file and relaunch to apply hot updates

## Critical Decisions & Why

### 1. Single-file renderer (app.js, not modules)
- No webpack/bundler overhead — raw JS in the browser
- Dead-simple deploy: copy files, done
- Downside: ~4500 lines of global state; refactoring would be risky given the codebase size
- If expanding: consider this the refactoring debt to pay later

### 2. Canvas-based color normalization (toHex6)
- Ensures all color strings are parsed into consistent `#RRGGBB` form before HSL manipulation
- Required for the night/day mode inversion math to work reliably

### 3. Dock resize operates on `.dock-scroll-body` inner wrapper
- Resize handle is always a plain DOM sibling (not flex-shrinked), so it never ends up mid-panel
- Only the scrollable content inside resizes; header/close-button stay pinned

### 4. Floating panels (Favorites, Log, Achievements, Shop, Settings, Tag Details) moved OUTSIDE `#app`
- CSS `zoom` on `#app` was breaking everything — it scales the element's own box independently of its container
- Solution: moved all fixed-position overlays to `<body>` siblings, zoom only affects main content
- This is why `#app` uses `100%/100%` (percentages) not `100vw/100vh`

### 5. Native Electron page zoom (`webContents.setZoomFactor()`) not CSS zoom
- Operates at compositor level — vw/vh/% all stay consistent automatically
- Font-size slider now calls `applyAppZoom(factor)` → `window.electronAPI.setZoomFactor()` → main process
- Factor is clamped 0.86–3x server-side to prevent nonsense values

### 6. HSL lightness-inversion for day/night mode
- Dark themes now genuinely produce a light "day" mode, not just "darken it more"
- Formula: `100 - L` (keep hue/saturation, flip lightness)
- Custom theme excluded (already user-controlled)
- Round-trip verified: inverting twice returns original (with rounding tolerance)

### 7. No Google Fonts network dependency
- Removed `fonts.googleapis.com` references entirely
- Replaced with system-font stacks (Segoe UI, -apple-system, etc.)
- Added Settings "Custom font" field for user-installed fonts
- Fixes the "local, no upload" accuracy issue

## Data Flow

### Tag Loading & Normalization
1. User opens a folder
2. Each `image.jpg` or `image.png` has a companion `image.txt` (UTF-8, one tag per line)
3. On load: underscores → spaces, collapse whitespace, trim
4. Stored in memory as `entries[i].tags = [tag1, tag2, ...]`
5. On save: spaces → underscores, write back to `.txt`

### Edit History
- Every tag add/remove creates a log entry in `folderStats.edit_log`
- Undo/redo stack is global (not per-image)
- Logs persist to `_tag_edit_log.json` in the dataset folder

### Favorites, Achievements, Wallet
- Persisted to `localStorage` (browser storage, survives relaunch)
- Scoped by folder hash (`_dts_meta.json` stores folder UUID + creation date)
- Achievements unlocked → Edibits earned (stored per-folder in `.json` files)

## Currently Complete Features

**Core Editing:**
- Add/remove tags per image
- Full undo/redo history with per-entry revert
- Wiki tag definitions (Danbooru)
- Tag search, filter (AND/OR/XOR/NOT)
- Sort by keyword family / frequency / alpha

**Views:**
- Grid (click → modal, zoom/pan)
- Compact (click → modal, shift+click → sticky comparison)
- Single (multi-image select, tag-alignment table)

**Power Tools:**
- Master Tags: checkboxes on cards, conditional apply/remove/find-replace
- Tag Pruner: search/browse all tags, hand-pick for merge/void
- Unify/Void: merge or delete selected tags

**Dock System:**
- Drag-reorder panels, collapse/expand, resize (via slider at bottom)
- Two docks: Tag Pruner + Unify/Void on right, plus new Quick Merge (incomplete)
- Settings option to reset all panels to default layout

**Other:**
- Themes (8 built-in, 5 purchasable via shop)
- Achievements (34+) with rarity tiers (common/uncommon/rare/epic/legendary)
- Night/day mode (HSL inversion)
- Font-size zoom (1.4x to 3x via slider)
- Custom fonts (type any font name installed on your system)
- Power-tool highlighting (outline or fill, toggleable per theme)

## Incomplete Features (In Progress)

### 1. Quick Merge Dock (50% done)
**What's there:**
- HTML scaffold: `<div class="tool-section power-tool" data-dock-id="quickMerge">` with buttons and list container
- CSS: `.qm-list`, `.qm-row`, `.qm-canon`, `.qm-variants` styles defined
- DOM refs: `btnQuickMergeScan`, `quickMergeList`, `btnQuickMergeApply` declared

**What's missing:**
- `btnQuickMergeScan.addEventListener('click', ...)` handler (scan logic)
- Case-variant duplicate detection (e.g., "Red Hair" vs "red hair")
- Render function for the merge groups
- `btnQuickMergeApply` action to actually merge the selected groups
- Should go right after `btnVoidSelected` handler (~line 4226 in app.js)

**How to finish:**
1. Implement `function scanCaseVariants()` — iterate all dataset tags, group case-insensitive duplicates
2. Render groups in quickMergeList with checkboxes + canonical tag picker
3. On "Merge selected", call tag merge for each group (reuse existing merge logic)
4. Record the edit in folderStats.edit_log

### 2. Tag Autocomplete with Definitions (not started)
**Requirements:**
- "+ add tag" inputs should autocomplete against the full `all_tags.json` (1M+ entries)
- Currently only suggests tags already in your dataset
- Click a suggestion → flash nested card showing definition (from `wiki.json`)
- If no definition exists, prompt user to write one

### 3. GitHub-Ready Package Generator (not started)
**Requirements:**
- Settings button to generate a folder ready for `git init` + push
- Should output a `.gitignore`, README, structured folder layout
- User runs `git` commands in that folder to upload (you're unsure on specifics — this is the one we'll co-figure-out)

## Key Code Locations

- **Theme application:** `applyTheme()` at line ~662
- **Day/Night toggle:** `toggleDayNightMode()` at line ~853, uses HSL inversion
- **Font-size zoom:** `applyAppZoom()` at line ~147, calls `window.electronAPI.setZoomFactor()`
- **Dock drag-reorder:** `dockDragStart` → `updateDockOrder()` at line ~1320+
- **Tag merge:** `mergeTagsWithHistory()` at line ~4100+
- **Edit log:** every significant action calls `recordChange(type, summary, affected)`
- **Achievements check:** `checkAchievements()` at line ~1600+ (evaluates all ACHIEVEMENTS)

## Security Notes

- ✅ Context isolation enabled, nodeIntegration disabled, sandbox enabled
- ✅ No eval/Function anywhere
- ✅ All dataset strings (tags, filenames, notes) use `.textContent` or `.value`, never `.innerHTML`
- ✅ No remote network calls (fonts moved to system stacks, wiki data is bundled)
- ✅ File I/O restricted to folders the user explicitly chooses (via native dialog)
- ⚠️ Symlink-following in update-bundle copy (copyRecursiveAsync) — low severity but noted

## Development Workflow

### Build & Deploy
```bash
cd /home/claude/dataset-tag-studio-electron
npm run dist
```
This creates installers for your OS. First-time build takes a while (code signing, etc.).

### Hot Updates (No Rebuild)
Drop updated `renderer/` files into the user's `tool/` folder, restart the app. Only touch `main.js`/`preload.js` if you need to — those require a rebuild.

### Testing Locally
```bash
npm start
```
Launches the dev app pointing at `renderer/` in your project folder. Changes to `.js`/`.css`/`.html` require a manual reload (Ctrl+R).

## Known Quirks & Gotchas

1. **Underscore normalization is one-way:** Tags are normalized on load (underscores → spaces), then saved back with spaces → underscores. If a tag somehow ends up in the app with underscores, they're treated as spaces during editing (by design, since Danbooru uses underscores internally but most datasets use spaces).

2. **Tag Pruner clipping on resize:** The description line at the top of Tag Pruner had a `margin-top: -8px` that would get clipped when the panel was resized. Fixed by removing the negative margin (spacing is looser now but never clips).

3. **Night mode doesn't apply to Custom theme:** Custom theme is fully user-controlled (custom-color picker), so inverting it would be surprising. Night mode is disabled for Custom; users can pick their own "day" colors if they want.

4. **Drag-to-disable is discoverable via tooltip only:** There's no "disable this image" button visible — you have to hover over an image card to see the tooltip mentioning shift+drag. This is intentional (to avoid clutter) but worth knowing if users ask.

5. **Master Tags mini-grid and main gallery stay in sync:** Clicking a card in the mini-grid selects/deselects it in the main gallery and vice versa. This is bidirectional and happens in `renderMasterMiniGrid()`.

6. **Achievement popups don't have a close button:** They auto-dismiss after 5 seconds. If this gets annoying with rapid unlocks, there's a Settings toggle `achPopupsToggle` to turn them off entirely.

7. **Dock panels initialize from stored JSON:** If the layout ever breaks (corrupted JSON), the "Reset panel layout" button in Settings wipes the stored config and goes back to defaults.

## Next Steps (If Continuing in Claude Code)

1. **Finish Quick Merge:** ~150 lines of JS, mostly gluing together existing merge logic
2. **Tag autocomplete + definitions:** ~200 lines, needs a fuzzy-match dropdown renderer + wiki lookup
3. **20+ new themes:** CSS-only, copy/paste/tweak existing theme blocks
4. **GitHub package generator:** Depends on clarification of what "github-ready" means to you — could be 100 lines (basic scaffolding) or 500 (full CI/CD setup)

When you open this project in Claude Code, paste this file path into the initial prompt: it will give Claude full context without re-explaining everything.

---

**Last updated:** Session ending Sept 8, 2026  
**Final state:** All validation passing, Fonts de-googled, Dark mode fixed, Power tools highlighted, Quick Merge scaffolded
