# Patch notes

Every release of Osmium Workshop (called Dataset Tag Studio up to v1.5.0), newest first. Comfy
Bridge ships in the same releases from v1.5.0 on. Downloads are on the
[releases page](https://github.com/Valteil/osmium-workshop/releases).

- [v1.9.0](#v190) · [v1.8.0](#v180) · [v1.7.0](#v170) · [v1.6.5](#v165) · [v1.6.0](#v160) · [v1.5.5](#v155) ·
  [v1.5.0](#v150) · [v1.4.0](#v140) · [v1.3.0](#v130) · [v1.2.0](#v120) ·
  [v1.1.5](#v115-tauri--discontinued) · [v1.1.0](#v110) · [v1.0.0](#v100)

---

## Next version: v2.0.0 (unreleased)

### Osmium Workshop

- **Change tag category**: right-click a tag ▸ Change tag category to move it to another category
  when the automatic sorting gets it wrong. It applies on every image and in every dataset;
  **Automatic** in the same row undoes it.
- **Originals is now Initial State**, and Bucket Images keeps originals in an `initial_state/`
  folder instead of `original_images/`, which LoRA trainers use for their own samples. Osmium no
  longer reads `original_images/`. If Bucket Images made one in a dataset before, rename that
  folder to `initial_state` to see and revert those images again.
- **Character sections** (Tag sorting): **＋ Add character** adds an empty section under
  Character, named Character 1, 2… until you rename it. Drag a whole category or single tags into
  it (or shift-click tags ▸ Move tags to). **Save** keeps that character in the dataset; **Load
  character** on another image pulls its tags into a section and offers the saved ones the image
  doesn't have yet.
- **SynthDat Overseer's prompt boxes re-fit their text** when the font size or the window width
  changes, instead of cutting the last lines off until you type.
- **Main LoRA weight** (SynthDat Overseer): a field under Main LoRA sets how strongly it's applied
  (1 = full, as before). Saved per dataset like the other settings.

### Comfy Bridge

- **Arrow keys in the gallery**: with an image open from the gallery, ← and → step to the previous
  and next image in the folder.
- **Generation settings beside gallery images** (Windows): opening an image from the gallery shows
  how it was made in a panel to its left: which output it is (Pass 1, Pass 2, Upscaled or single
  pass), the prompt field by field, the negative, models and LoRAs with weights, size, seed, steps,
  CFG, sampler, scheduler, the 2-Pass, upscale and reference-image settings, and every other node
  setting under **All node settings**. **Use these settings** loads them into the generator, like
  Import generation. Images saved before this version can't say whether they're Pass 1 or Pass 2.
- **Text size** (Windows): a slider at the top of the theme menu makes the whole window bigger or
  smaller (80–160%). It's remembered, and **Reset** puts it back to 100%. Prompt boxes re-fit
  their text as the size changes (and when the window or the right column is resized), instead
  of cutting the last lines off until you type.

### Comfy Bridge for Android

In testing: get it from the
[test build](https://github.com/Valteil/osmium-workshop/releases/tag/comfybridge-android-test).

- **Generate queues**, like on Windows: pressing Generate while one is running queues another
  with the settings as they are then. They run one after another; Stop (or the notification's
  Cancel) ends the current one and clears the queue.
- **Tag wiki**: a **Wiki** button in the header opens the tag-definition window.
- **Main LoRA weight**: a field under Main LoRA.
- **No more silent hangs on a wrong address or port**: after 45 seconds without an answer it says
  so, and reminds you which port is which (8188 for a ComfyUI server, 8189 for a PC sharing Local
  ComfyUI).

---

## v1.9.0

### Hotfix (2026-09-28)

Osmium Workshop was rebuilt, and Comfy Bridge for Windows joins this release. If you downloaded
v1.9.0 before this, download it again.

- **Local ComfyUI no longer reloads the models for every generation.** Only the first generation
  loads them; the ones after it start straight away, as they do on a ComfyUI server. (Osmium's
  ComfyUI now uses ComfyUI's own DynamicVRAM memory handling, which it had been skipping.)
- **Generate queues**: pressing Generate while a generation is running queues another one with
  the settings as they are at that moment. Queued generations run one after another; the status
  line shows how many are waiting, and Stop ends the current one and clears the queue. In
  SynthDat Overseer nothing is auto-rejected any more: results that finish while you're still
  deciding on one wait their turn, and each Accept or Reject shows the next. Generation carries
  on in the meantime.
- **Disabled images stay disabled.** If an image's old copy couldn't be removed when you disabled
  it, it showed up in the Gallery again after a restart and couldn't be disabled ("already
  disabled"). Opening the dataset now finishes that move, and a failed removal tells you instead
  of failing silently.
- **Tag Overseer's image grid follows the Gallery's view**: Gallery, Disabled or Originals, and
  updates the moment the Gallery changes (switching views, filtering, sorting, editing).
  Selecting an image no longer also selects its original (they share a file name), and the
  selected-image tools work on whatever you selected there. Undo after editing an original now
  changes the original, not the Gallery image with the same name.

### Comfy Bridge

Comfy Bridge for Windows was rebuilt again later on 2026-09-28 with everything below. If you
downloaded it before then, download it again.

- **Local ComfyUI** (Windows): set Run on to Local ComfyUI and choose your ComfyUI folder, then
  Connect. Comfy Bridge starts that install itself in its own console window, loading only the
  nodes its workflow needs (including the upscale models). Same setup as Osmium's. The
  **ComfyUI Terminal** shows its output, live.
- **Persist Comfy**: keeps Local ComfyUI running, with its models loaded, after you close Comfy
  Bridge. Next time, Connect picks it straight back up instead of loading again. To stop it, close
  its console window ("Comfy Bridge - local ComfyUI (stays open)"). It takes effect the next time
  Local ComfyUI starts.
- **Use your PC's Local ComfyUI from your phone**: tick **Let the phone app use it** (port 8189 by
  default). The Android app then connects to your PC's address, such as its Tailscale IP, exactly
  like a ComfyUI server: generate, stop, live preview, and the ComfyUI Terminal showing the PC's
  ComfyUI output. With Persist Comfy on as well, the kept-open ComfyUI serves the phone itself, so
  it keeps working after you close Comfy Bridge (Connect once to start it). Without it, the
  phone's first request starts Local ComfyUI if it isn't running. There's no password (the same
  as ComfyUI's own `--listen`), so only turn it on for networks you trust, like your tailnet.
  The phone uses 8189; 8190 is Comfy Bridge's private line to ComfyUI and only works on the PC.
- **Generate queues**, as above.
- **Tag wiki**: a **Wiki** button in the top bar opens the same tag-definition window as
  Osmium's, for checking what a tag means while writing a prompt. Suggestions as you type, See
  also links, and your own notes for tags without a definition. The definitions ship with the
  app, so it works offline.
- **Main LoRA weight**: a field under Main LoRA sets how strongly it's applied (1 = full, as
  before). Importing a PNG brings its weight back too.
- Tidier Local ComfyUI controls: labels stay on one line, and the folder path sits under its
  button.

The Comfy Bridge Android app and the ComfyUI node pack are unchanged in this release; get them
from [v1.8.0](https://github.com/Valteil/osmium-workshop/releases/tag/v1.8.0). The v1.8.0 phone app
already works with **Let the phone app use it**. A newer Android build is in testing (see
"Next version" above).

### Osmium Workshop

- **Opening flourish**: when the app opens, a sweep of your theme's colour crosses the dimmed
  window carrying that theme's own Osmium mark, then leaves trailing the theme's particles. On
  phones it runs top to bottom. Any press speeds it up; turn it off with Settings ▸ Appearance ▸
  Disable opening flourish.
- **Theme app icons** (Windows): Settings ▸ Appearance ▸ App icon lets you pick any theme you own
  as the app's taskbar icon. Each one is that theme's Osmium mark on its own colour. The icon
  stays put when you switch themes, and the app launches with it already in place.
- **SynthDat without a ComfyUI server** (desktop): set Run on to Local ComfyUI and choose your
  ComfyUI folder. Osmium starts that install itself in its own console window, loading only the
  nodes the SynthDat workflow needs instead of every custom node you have installed.
- **Single view**: the add-tag field sits right under the image instead of after the whole tag
  list.
- **Image Quicktagging** (Single view): the left panel becomes checkboxes for common attributes
  (hair length, breast size, slim/plump, thick thighs/slim legs, looking at viewer/away/to the
  side), so they're one click instead of typed every time. Add your own quicktags and categories
  with +, each with optional rules (extra tags it adds and keeps, tags unticking removes, tags that
  untick it); they're kept across datasets.
- **Tag Sorting**: a **+** on every category adds tags right there, and a tag added under the wrong
  heading moves to its own with a note. **Hair** is its own category now; Body is below the neck.
- **Wiki window**: a new toolbar button next to Asc/Desc opens a small tag-definition lookup that
  stays open until you close it. The definition sits in a box, with its See also tags as links
  below.
- **Collapsible toolbar**: the ▲ under the gallery toolbar's bottom-right corner folds it away (▼
  brings it back), remembered between sessions.
- **Tag autocomplete opens beside its field** everywhere, including in dialogs and when renaming a
  tag chip inline (which now gets autocomplete too).
- **Single view layout**: the gallery toolbar folds away for more room; Grid sits above the image
  and the image navigator above the tags.
- **Tag definitions refreshed** from Danbooru: about 110,000 more definitions (new tags and ones
  that had none), example-post clutter removed from the text, and meta tags (lowres, commentary,
  artist request…) dropped from suggestions.
- **Conditional remove** (Master Tags): take a tag off every image that has another tag.
- **Gallery toolbar** wraps onto a second row when the window is narrow instead of cutting its
  buttons off.
- **Rename all converts WebP to PNG**: WD14 can't read WebP, so renaming a dataset now also
  turns its WebP images into lossless PNGs, ready to tag.
- **SynthDat interrogation follows WD14's On-device mode**, the same as Tag Overseer, so tagging
  a reference image no longer needs ComfyUI's WD14 node when you've set it to On-device.

---

## v1.8.0

### Osmium Workshop for Android is released

The phone app leaves testing. It now runs the same interface as desktop, generated from the same
sources, so new desktop features reach it automatically.

- Every theme, Theme Studio, merge/void rules and Past Tag Preview, in a touch layout: bottom-sheet
  panels (☰ Left / 🔧 Tools / 🔭 Overseer), tag editing in the image modal, and one scrolling
  strip for the gallery toolbar.
- **Back button** closes the top dialog, menu or sheet first, then steps back through the tabs you
  visited, and asks before exiting (mentioning unsaved changes). It no longer quits from anywhere.
- **Add images** opens Android's app chooser, so Photos, Files, Drive or any file manager can
  supply them. With no dataset open it offers to create one where you choose.
- **Sequential tagging** runs in a full-screen panel.
- ARM64-only APK (about 43 MB, down from 94 MB). Installs over a previous test build and keeps its
  data.
- Fixes from phone testing: datasets failing to load, the Tools/Overseer sheets opening empty or
  only dimming the screen from other tabs, the Stats tab scrolling sideways, and tappable topbar
  scrollbars jump-scrolling the row.
- Bucket Images, Compact view and Single view stay desktop-only.

### Themes: whole looks, not just colors

- Every theme now has its own faces, shapes, materials and icon stroke; 40 bundled open-licence
  font families. Epic/legendary effects are drawn in each theme's own material.
- **Custom icon set** replaces emoji across the app, restroked per theme.
- **Image mats**: the letterbox behind images shows a small motif from each theme's world.
- **Theme Studio** replaces the old Colors panel: a full custom-theme builder with a live
  miniature of the app, contrast readouts and one-click fixes, per-role fonts, shapes, button
  fills, card hover and depth, and more. Start from any owned theme, keep a library of your own
  themes, hold to compare, and import/export `.theme.json` files. Epic/legendary effects preview
  free and cost their tier's price to keep.
- **Night mode** keeps text and accents readable (contrast-guarded inversion) and works on custom
  themes.
- Picking a locked theme now bounces with its Shop price instead of looking selected.

### Motion and speed

- **Swipe mode is a spatial map**: tabs, views and image paging pan like one continuous surface;
  the image modal grows out of its card and shrinks back.
- Tabs switch on press, preload in idle time, and clicks made mid-animation are no longer
  swallowed.

### Tagging

- **Several tags at once**: `1girl, red eyes, plump` in any add-tag field adds all three as one
  undoable edit. Tags a rule blocks are skipped and named.
- **Past Tag Preview**: ghost chips show the tags a merge/void rule took off an image (struck
  through for voids). Delete one per image, or turn the rule off to bring them back. Now also
  covers rules applied by adding a tag to a rule, re-enabling it, or WD14/Master Tags bringing in
  a ruled tag, each logged as a "Rules applied" entry.
- Tags default to category order on cards (By category / Order added / Alphabetical / By
  frequency); searched and isolated tags float to the very top.
- A tag edit that takes an image out of the current filter removes its card right away.
- Filter: the **Boolean** dropdown is the authority and the default mode is **OR**; Tag Pruner's
  mirror no longer forces AND.
- **Status badges** (text, censor, perspective) use icons with colored yes/no/unknown marks, and
  on desktop cards they now sit in their own strip above the image instead of over it.
- Sequential panel fills the width and flows its sections into two columns.

### Datasets and files

- **File ▸ Add images…** on desktop too, right under Open dataset folder. With no dataset open it
  offers to create a new one (name it, pick a location).
- **File ▸ Add current dataset as folder** adds the open dataset to the Datasets tab anytime, even
  after answering No to the "add to Datasets tab?" question.
- The "add to Datasets tab?" question now says what No does and where to add folders later.
- Escape (and Android Back) closes only the top dialog; stacked dialogs no longer close together.
- **Tell me a useless fact** has 172 facts now (nature, pop culture, gacha games, Stable Diffusion),
  and never repeats one until you've seen them all.

### SynthDat Overseer

- The Pose prompt field is now saved with the rest.
- The tab fills the window instead of adding a whole-app scrollbar.

### Comfy Bridge 1.8.0

- **Theme Studio** with the same `.theme.json` format as Osmium Workshop, bundled fonts and a
  Custom palette entry; image mats on the preview frame.
- **Mobile:** fixed runs getting stuck on "Generating…" after picking a reference image. Uploads
  now show progress, time out when stalled, can be retried, and Stop cancels at any stage.

### Docs and website

- User Guide, in-app Help and README brought up to date, including the Android app.
- Website: theme picker that re-skins the site with any app theme, a demo that runs on a sample
  dataset instead of asking for your folders, readable step-by-step screenshots, and an offline
  preview (`Preview Site.cmd`).

---

## v1.7.0

### Bucket Images (new dock)

Crops and resizes every image to its nearest training bucket (same aspect-ratio bucketing as
Anima-TrainFlow), head-first via a u2net saliency model.

- Originals move to `original_images/` and get their own **Originals** view; bucketed copies are
  written back as PNGs under the same name, so captions carry over.
- Already-valid images are skipped; **Revert bucketing** restores the originals.
- Min side / max side / step are configurable (256 / 1024 / 64). **Prefer GPU** with automatic
  CPU fallback. The ~176 MB model downloads on first use.

### Tag Sorting

- A **Tag sorting** toggle in Single view and the image modal groups tags into Character, Body,
  Face, Clothes, Limbs and Hands, Sexual, Pose, Scene, Effects and Other.
- **Add subject** splits multi-character images into named subjects; move tags by dragging or
  shift-click then "Move tags to:". Saved per image.

### Also new

- **Review flagged tags**: a left-panel list of every flagged tag, with an undoable **Reviewed**.
- Single view shows a compact preview (click for the full-size zoomable view); the image-number
  box is editable to jump. Sequential tagging uses the same preview.
- Filter mode dropdown labelled **Boolean**, with a **Lock** so Clear filter keeps your mode.
- Clicking **Tag Overseer** while the right panel is tucked away opens it (and tucks it back).
- Editing tags no longer jumps the scroll to the top; every checkbox uses the theme's style.
- Fixes: squashed buttons on epic/legendary and Refined themes; mass actions hitting a bucketed
  image's hidden original. Smoother Swipe animation with reduced-motion support.

### Comfy Bridge 1.7.0

- **Mobile:** progress-bar notification while generating (foreground service, Cancel action).
- Importing a generation clears every field first.
- **Desktop:** checkboxes restore their saved state.
- Stricter TypeScript and a shared ComfyUI core between desktop and mobile.

---

## v1.6.5

### Osmium Workshop

- **Dataset folder tabs**: split tracked folders across tabs, each optionally password-locked
  (casual privacy, re-locks every launch). Deleting a locked tab or changing its password needs the
  current password; forgetting it still lets you delete the tab without exposing its folders.
- **Master Tag Control** restructured: Disable added, immunize pairs collapsed into toggles; the
  thumbnail grid pops out into a bigger modal with drag-to-select and 1×–4× sizes; narrow buttons
  fall back to icons.
- **Osmium** theme added (5th free theme); fixed hardcoded dark colors in light themes.
- Theme-colored slider and selection accents.
- Landing page and live demo launched (GitHub Pages).

### Comfy Bridge

- Upscale saves as its own file: up to three images per generation (Pass 1, Pass 2, Upscaled) in
  a swipeable preview with a thumbnail strip, saved under an `Upscaled/` subfolder.
- Fixed: an empty main LoRA field got the whole prompt rejected; upscale models not appearing.
- Sampler/scheduler pickers read from ComfyUI; ComfyUI Terminal panel with live server output.
- Wider draggable preview column; auto-growing prompt fields; Osmium theme.
- **Mobile:** desktop feature parity (theme palettes, SynthDat naming, import generation, field
  persistence), generation settings in an off-canvas drawer, a log + terminal slideout, connection
  help in a modal, 2-Pass shows both passes stacked.

---

## v1.6.0

### Osmium Workshop

- The add-tag field keeps focus after Enter, so rapid tagging chains.
- Sequential: checking a censor type flips the state to Censored automatically.
- Topbar buttons no longer clip their outline on hover in expanding themes.
- Cleanup: Tag Pruner no longer re-renders twice, image memory is released properly.

### Comfy Bridge

- Osmium theme palettes (25, colors only) with a topbar picker.
- SynthDat output naming preserved (rating/character/lora.png inside the chosen folder).
- **Import generation**: pick a PNG made with the workflow and its prompt and settings are
  re-entered.
- Model picker focuses its search box; the gallery button uses the app icon; every field persists
  across restarts.

---

## v1.5.5

Renamed from Dataset Tag Studio (briefly Dataset Manager Studio) to **Osmium Workshop**.

### Osmium Workshop

- **Sequential tagging** (new): walk the filtered gallery image by image and set text/language,
  censorship (state + type), multi-select perspectives, monochrome, sound effects, comic, multiple
  views and koma from one panel, with a live preview of the tags Confirm will apply. Started from
  Master Tag Control.
- **Pixel tools** in the image modal: Rotate and Crop rewrite the file in place; Isolate saves a
  region as a new image.
- Picking a Windows special folder (This PC ▸ Documents, etc.) explains and bounces back instead of
  breaking the picker until restart.

### SynthDat Overseer

- WD14 reference-tag transfer picker with Pose / Limbs / Scene / Sexual destinations and
  vocabularies seeded from Danbooru tag groups, plus a grouped transfer-list viewer.
- The Prompt fields edge tab stays pinned while scrolling.

---

## v1.5.0

- **On-device WD14 tagging**: tag images without a ComfyUI instance.
- **SynthDat Overseer**: Prompt fields move to a floating panel behind an edge tab; unified prompt
  box mode; ⇄ Width/Height swap; optional rename-to-dataset-conventions on Accept.
- **Rename all** (gallery toolbar): renames every image and its `.txt` to `1`–`N`, undoable.
- **Remove all tags** in the 3-dot menu, which is also reordered with the most-used actions first.
- Dock header tip buttons on desktop.
- The whole renderer ported to strict TypeScript, which caught a couple of real bugs.
- Fixes: button labels clipping at high zoom, the image modal's info text overlapping Close, the
  SynthDat live preview off-center, prompt fields squashed on a fresh launch.

### Comfy Bridge 1.0.0 (first release)

A simpler web UI for ComfyUI with one built-in workflow, for desktop and Android (LAN, Tailscale
or hotspot). Needs the `ComfyUI-DataSetManagerNodes` pack on the ComfyUI instance.

---

## v1.4.0

- **Delete images permanently**: from the 3-dot menu or as a Tag Overseer mass action. Confirmed,
  no undo, locked images skipped.
- **SynthDat Overseer**: mark tags as void on the pending card; Accept adds a Retroactive Void rule
  for them. Tags already covered by a void rule show struck through.
- **Tag Pruner**: each box has its own selection, mirror-to-gallery toggle and Clear, with a
  Unify/Void row per box.
- SynthDat's ComfyUI dependencies unified into one bundled node pack, shipped as its own zip; every
  node registered under a unique "DSM " prefix.
- Tab icons for Tag Overseer, Gallery and Datasets.

---

## v1.3.0

- Right panel gets a shared header row: collapse arrow plus a Tag Overseer / Gallery tools switch.
- SynthDat Overseer settings are saved per dataset.
- New in-app **Help** panel with the user guide and glossary.
- **Suppress Theme Flourishes** (was Suppress Theme Upgrade) now covers natively epic/legendary
  themes too; the old single toggle is split into hover-fill, card-tilt and ambient animations.
- Achievements and Edibits can't be earned with no dataset loaded.
- Themed checkboxes app-wide.
- "Generate GitHub-ready package" removed; Settings gets **Export app state** for bug reports.
- Fixes: dock drag-reorder, the right-panel resize handle after zoom plus tab switch, info-icon
  wrapping, Retroactive Merge/Void grouping and counts, capitalized placeholders.

---

## v1.2.0

- **SynthDat Overseer** (new tab): drives your ComfyUI to generate more training images of a
  character via a pose reference and ControlNet. WD14 interrogates the pose, you fill the prompt,
  generate (1- or 2-pass, live preview, Stop), then Accept into the dataset or Reject. Nothing is
  silently discarded: unused results land in `Disabled/`.
- **Retroactive Merge/Void** (new dock): standing `[tags] → canonical` or `→ void` rules that
  auto-correct matching tags the moment they appear, block typing them, and can be paused per rule
  or per tag (actively un-merging via the edit log). **Merge Immunize / Antivoid** exempt single
  images. Every change is undoable.
- **Hardware acceleration** setting: render the UI on the integrated GPU by default, or disable GPU
  acceleration.
- **Image locking**: locked images are skipped by every mass/automatic tool but stay editable.
- **Unsaved Approved** view for SynthDat images accepted but not saved yet.
- **Reload dataset**, a zoomable/pannable lightbox for every preview, Quick Merge keyword families,
  and per-theme **Refine** upgrades in the Shop.
- Fixes: SynthDat fed the wrong image into ControlNet; WD14/SynthDat requests moved to the main
  process; the close warning also catches unsaved rule edits; floating panels close their own
  dropdowns.
- The Tauri port (v1.1.5) is discontinued; the app is Electron-only.

---

## v1.1.5 (Tauri) — discontinued

A Tauri build of v1.1.0 (native WebView2, ~29 MB installed instead of ~180 MB), as an NSIS or
MSI installer. Same features except the GitHub package export. Discontinued in v1.2.0; it
receives no updates.

---

## v1.1.0

- **WD14 Autotagger**: tag selected or single images through a local ComfyUI running the WD14
  Tagger node, with auto-apply or a review step.
- **UI animation modes** (Settings): Fade / Swipe / Off for menus, panels, tabs, views, image
  paging and the image modal. Animated dock collapse/expand.
- **Datasets tab**: a folder manager for every dataset you've opened, with drag-reorder, sorting
  and themed folder icons.
- **Refine Theme** shop upgrade, **Unload dataset**, app-wide arrow-key menu navigation, and new
  achievements.
- Shop: owned themes get a **Use** button.
- Fixes: switching datasets by any route now asks to save unsaved edits; the GitHub package export
  is actually buildable; drag-reorder works downward; dock heights no longer stick after expanding;
  arrow-key paging in Single view animates.

---

## v1.0.0

First release, as **Dataset Tag Studio**: a portable, offline Windows app for tagging image +
`.txt` caption datasets. Tags are edited as clean space-separated text.

- **Views**: Grid, Compact (hover previews, shift-click side-by-side comparison), Single (zoom and
  pan, arrow keys) and Disabled; a floating zoomable image card from any view; optional masonry
  card heights.
- **Tagging**: tag context menus (merge selection, filter, Tag Details, per-image flag, keyword
  family), add-tag fields, tag sorting within cards.
- **Filtering**: comma-separated multi-tag search with AND / OR / XOR / NOT, matching tags glow and
  float up, **Flag isolated tags**, All / Untagged / Unsaved quick filters, a tag list sortable by
  keyword family, frequency or name, with draggable families.
- **Bulk tools**: Tag Pruner (multiple instances), Unify or void selected tags (optionally on
  Disabled images too), and dataset-wide Find / Replace all / Find & replace.
- **Master Tags** tab: selection checkboxes, apply/remove on a selection, conditional apply, mass
  apply/remove, rename; a multi-image comparison table in Single view.
- **Text & panel tagging** from the 3-dot menu (has text + language, comic, koma, speech bubble).
- **Review flags** per image or per tag, image **notes**, and a tag-count badge.
- **Undo/redo** plus a per-folder **Edit Log** where any entry can be undone or redone on its own;
  Reset image edits; a triple-confirmed Purge all tags.
- **Disable images** into `Disabled/` (drag a card onto the Disabled tab) and restore them.
- **Tag Details**: bundled Danbooru wiki definitions, categories and post counts, with your own
  descriptions for tags that have none.
- **Editing Stats** tab with charts of every logged action.
- **34 achievements** paying out **Edibits**, spendable in the Shop on 5 premium themes (plus 4
  free), custom colors, a real night mode, font size, panel arrangement, and discrete mode (blur).
- Dockable, collapsible, resizable right-sidebar panels; Favorites for quick folder access; themed
  confirmation dialogs; hover tooltips.
