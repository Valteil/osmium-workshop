# Dataset Tag Studio — Features & Functionality

A local, offline-first desktop app for tagging and cleaning up AI image-training datasets. Everything reads and writes directly to your dataset folder — no uploads, no cloud, no accounts. (See `README.md` for install/build instructions.)

---

## Getting started

1. Launch the app.
2. Click **Open dataset folder** and select the folder containing your images and matching `.txt` caption files.
3. Tags are shown and edited as clean space-separated text (e.g. `red hair`, not `red_hair`) — this happens automatically on load, and files are saved the same clean way.

---

## Views

- **Grid** — the default view. Each card shows the image, its tags as editable chips, dirty/untagged indicators, and a 3-dot menu for per-image options.
- **Compact** — thumbnails only, densely packed. Hover a thumbnail to preview its tags. Supports **sticky comparison**: shift-click a thumbnail to pin it into a comparison strip at the bottom of the view; shift-click a second image and its tags line up side-by-side in an aligned table (shared tags share a row; tags unique to one image get their own row).
- **Single** — one image at a time, with a zoom slider (up to 400%), click-and-drag panning (either mouse button), and scroll-wheel zoom. Prev/Next navigation with arrow keys.
- **Disabled** — its own tab, separate from the quick filters, showing only images you've disabled.

Clicking any image in Grid or Compact view opens a **floating image card**: a dimmed-background modal with the full image (zoomable/pannable) and its tags, without leaving your place in the grid. Escape or clicking outside closes it.

A **Dynamic card heights** toggle (Settings) switches the grid from uniform rows to a masonry-style layout where each card is only as tall as its image needs.

---

## Tagging

- Click a tag chip to open its **context menu**: select it for a merge, filter to images that have/don't have it, view its Tag Details, flag it for review on just this image, or explore its "keyword family" (the shared word group it belongs to, e.g. all `*_hair` tags).
- Right-click a tag or an image does the same as left-click/tap — all context menus are reachable either way.
- Add a tag by typing into any card's "+ add tag" field and pressing Enter.
- **Sort tags within a card**: Settings lets you choose default order, alphabetical, or by frequency.

### Filtering (left sidebar)

- Free-text search supports **multiple comma-separated tags** combined with **AND / OR / XOR / NOT** (hover the mode label for what each does).
- Matching tags glow and are pushed to the top of every card's tag list.
- **Flag isolated tags** highlights (in red) tags that appear in 2 or fewer images — useful for catching typos or one-off tags that need review.
- Quick filters: All / Untagged / Unsaved. A **Clear filter** button resets everything at once.
- The left sidebar's tag list can be sorted by **keyword family** (default), frequency, or alphabetically, ascending or descending — and it never truncates or hides tags.
- **Keyword families can be dragged to reorder** (there's a ↺ button to reset the order back to default).

### Bulk tag tools (right sidebar)

- **Tag Pruner** — search or browse all tags, hand-pick any combination (not just ones sharing a keyword) to feed into the merge/void tool below. You can add multiple Tag Pruner instances to search two different things at once.
- **Unify or void selected tags** — merge everything you picked into one new tag name, or permanently delete the selected tags outright (a confirmation dialog, and full Undo/log support afterward). An "Also apply to Disabled images" checkbox lets you retroactively merge/void tags on images you've already disabled.
- **Global tag tools** — Find (search + filter), Replace all (exact rename), Find & replace (substring rename) — dataset-wide.

### Master Tag Control (its own tab)

Switching to the **🏷 Master Tags** tab keeps your gallery exactly as-is but swaps the right sidebar for a dedicated bulk-tagging console. Checkboxes appear on every card so you can build a selection, then:

- Apply or remove a tag on just your selected images.
- **Conditional apply** — e.g. "every image with `1girl` also gets `green eyes`," dataset-wide.
- **Mass apply/remove** — add or strip a tag across the entire active dataset in one move.
- **Replace a tag** — exact rename or substring find & replace, folded in here too.

If you select **more than one image** and switch to **Single view**, it automatically becomes a **comparison table**: column 1 is every unique tag across your selection, column 2 lists which selected images have it. Click an image name to remove or replace that tag on just that image; edit the tag name in column 1 to rename it across every selected image that has it.

### Text & panel tagging (3-dot menu)

Configure, then hit **Apply** — nothing changes until you do:
- **Has text** toggle, with **Japanese** (default) or **Foreign language** sub-choice. Foreign languages come from a manageable **Common languages** list (add/remove your own) and apply both a `text` tag and a `{language} text` tag.
- **Comic**, **Koma** (1–4koma), and **Speech bubble** toggles.

### Reviewing & annotating

- **Review flags**: pick from a small fixed color palette to mark a whole image's card (visible border/tint), or flag an individual tag chip within one specific image (glows orange) — both from the 3-dot or tag context menus.
- **Notes**: write a note on any image via the 3-dot menu or by clicking its 📝 icon directly. Optionally set a note to always show on the card, not just in the menu.
- **Tag count**: shown in the 3-dot menu header always; optionally as a persistent badge on every card (Settings).

### Undo, Redo, and the Edit Log

- Every tag-mutating action (add, remove, merge, void, rename, find & replace, master-tag operations) goes through a shared **undo/redo stack** — toolbar Undo/Redo buttons work like a normal editor's.
- A full **📜 Edit Log**, unique to each dataset folder (saved as `_tag_edit_log.json` right in that folder), records every action with a timestamp. Each entry has its own **↩ Undo this / ↪ Redo this** buttons — so you can re-apply or reverse any specific past action, any number of times, independent of the linear undo stack. Export the log anywhere, or clear it.
- **Reset image edits** (3-dot menu) reverts a single image to the earliest tag state found in its log history — useful for backing out of an experiment gone wrong.
- **Purge ALL tags** (Settings, requires three separate clicks to confirm) wipes every tag in the current folder — still fully undoable.

### Disabling images

- Move an image to a `Disabled/` subfolder (keeping its filename, so restoring slots it right back in) via the 3-dot menu, or by **dragging its card onto the "🗑 Disabled" tab**.
- Disabled images get their own tab; restore individually from there.
- Tags on disabled images are preserved and can still be edited (see the "Also apply to Disabled images" option above).

---

## Tag Details (wiki lookup)

Click any tag → **📖 Tag Details** to see its Danbooru wiki definition, category, and post count (loaded from bundled reference data, fetched lazily on first use). Tags without an official wiki entry show a greyed placeholder and let you write and save your own description instead — stored locally, separate from your dataset.

---

## Editing Stats

A dedicated tab with animated **pie and bar charts** breaking down every logged action by type, both as hard counts and percentages, plus summary cards (total edits, undo/redo stack depth, achievements unlocked). All computed from the current folder's edit log.

---

## Achievements & the Shop

- **34 achievements**, comedic in tone, unlocked per-folder (opening a different dataset starts fresh) — covering everything from bulk tag voids to using every sort mode to enabling night mode. Unlocking one shows a popup (can be turned off in the Achievements panel; stats keep tracking regardless) and pays out **Edibits**, a small currency with rarity tiers (common → legendary) shown as colored icons.
- Edibits are **global**, tracked at the app level, spendable in the **💰 Shop** on premium themes (5 available: Terminal Green, Sakura Dusk, Bioluminescent Deep, Royal Amethyst, Solar Flare). A "beg for free Edibits" button exists if you're short. A debug **Reset Edibits** button is available for testing.

---

## Themes & appearance

- 4 free themes (Studio, Neon Cyberpunk, Oriental, Subway Fresh) plus 5 purchasable premium ones.
- **🎨 Colors**: fully customize any theme's palette live via color pickers, save it as your own "Custom" theme.
- **🌙 Night mode**: a real dark-palette override per theme (not a screen filter) — e.g. Subway Fresh keeps its colorful header gradient but the backgrounds and panels go properly dark.
- **Font size** slider and **panel arrangement** (Standard / Gallery-left / Gallery-right layouts) in Settings.
- **Discrete mode**: blur all images at once (Settings) or blur individual images (3-dot menu) — either is instantly reversible.

---

## Right-sidebar panel management

The Tag Pruner, Unify/Void, and Global Tag Tools panels are **dockable**: drag the ☰ handle to reorder them, click ▼ to collapse, drag a panel's bottom edge to resize it. A "↺ Reset panel layout" button in Settings restores the defaults.

You can also rearrange the overall layout (Settings → Panel arrangement): standard (left sidebar · gallery · right sidebar), gallery on the left with both panels stacked to its right, or the mirror of that.

*(Currently the left sidebar's own sections aren't dockable this way — only the right sidebar's three tool panels are.)*

---

## Favorites & Quick Access

**★ Favorites** lets you save frequently-used dataset folders and reopen them with one click (re-requesting OS permission as needed) instead of navigating the folder picker each time.

---

## Safety & quality-of-life details

- Folder-picker cancellations or failures show a clear message instead of hanging.
- All confirmation prompts (quit with unsaved changes, void tags, mass apply/remove, clear log, reset Edibits) use a themed in-app dialog, not the OS's native popup.
- Hover any control for one second to see a tooltip explaining it (toggle in Settings).
- Scrollbars are always visible and themed, even when there's nothing to scroll yet.
- The whole right sidebar, left sidebar, and gallery toolbar stay usable while scrolling (sticky positioning).

---

## Updating

Settings → **⬆ Apply update bundle…** lets you point the app at an unzipped folder of new files (e.g. something downloaded to your Downloads folder) and it copies them into place and offers to relaunch — no manual navigation to `%appdata%`/`Application Support` needed for ordinary content updates. Updates that change the app's core Electron shell (`main.js`/`preload.js`/`package.json`) still require a full rebuild and reinstall.

---

## Project structure

```
dataset-tag-studio-electron/
  main.js         — Electron main process (window, update-bundle IPC)
  preload.js      — safe IPC bridge exposed to the renderer
  package.json    — build config
  renderer/
    index.html    — page structure only
    styles.css    — all styling
    app.js        — all application logic
    data/
      wiki.json      — Danbooru tag definitions (lazy-loaded)
      all_tags.json  — Danbooru tag list with category/post-count (lazy-loaded)
```

`renderer/*` is copied into `userData/tool/` on first launch and loaded from there — this is what the in-app updater replaces. Everything is plain HTML/CSS/JS with no build step and no external JS dependencies — loaded as ordinary `<script>`/`<link>` tags sharing one global scope (not ES modules, to avoid a `file://`-related CORS quirk in Electron).
