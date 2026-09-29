# Patch notes

Every release of Osmium Workshop (called Dataset Tag Studio up to v1.5.0), newest first. Comfy
Bridge ships in the same releases from v1.5.0 on. Downloads are on the
[releases page](https://github.com/Valteil/osmium-workshop/releases).

- [v1.9.5](#v195) · [v1.9.0](#v190) · [v1.8.0](#v180) · [v1.7.0](#v170) · [v1.6.5](#v165) · [v1.6.0](#v160) · [v1.5.5](#v155) ·
  [v1.5.0](#v150) · [v1.4.0](#v140) · [v1.3.0](#v130) · [v1.2.0](#v120) ·
  [v1.1.5](#v115-tauri--discontinued) · [v1.1.0](#v110) · [v1.0.0](#v100)

---

## v1.9.5

Osmium Workshop and Comfy Bridge for Windows. The Comfy Bridge Android app is in a separate
[v1.9.5-android pre-release](https://github.com/Valteil/osmium-workshop/releases/tag/v1.9.5-android)
until it's been tested on a phone. The Osmium Android app isn't part of this release. Get it from
[v1.9.0-android](https://github.com/Valteil/osmium-workshop/releases/tag/v1.9.0-android).

### Osmium Workshop

- **Change tag category**: right-click a tag ▸ Change tag category when the automatic sorting puts
  it in the wrong place. The fix applies to that tag on every image in every dataset, and
  **Automatic** in the same row undoes it.
- **Character sections** (Tag sorting): **＋ Add character** adds an empty section under
  Character, named Character 1, 2 and so on until you rename it. Drag a whole category or single
  tags into it, or shift-click tags ▸ Move tags to. **Save** keeps the character in the dataset.
  On another image, **Load character** pulls its tags into a section and offers any saved ones the
  image doesn't have yet.
- **Originals is now Initial State.** Bucket Images keeps the pre-bucketing files in
  `initial_state/` instead of `original_images/`, because LoRA trainers use that name for their own
  samples. Osmium stops reading `original_images/`, so if Bucket Images made one in a dataset
  before, rename it to `initial_state` to see and revert those images again.
- **Main LoRA weight** (SynthDat Overseer): a field under Main LoRA sets how strongly it applies,
  with 1 as full strength like before. It's saved per dataset with the other settings.

### Comfy Bridge

- **File naming** (Windows): a File saving panel decides where each image goes and what it's
  called. Folders are automatic where they can be. An `explicit` or `safe` folder follows the
  Rating field, and upscaled images go in `Upscaled`. The character folder comes from the
  Danbooru tag list (it starts on the character in the Character field), a single `OC` folder, or
  a custom name. Recognition wants an exact Danbooru character tag, so `score_7` no longer files
  an image under 7-tan. The filename is built from toggles in a fixed order: character, Main
  LoRA, then model and sampler settings, always ending in a number so nothing is overwritten.
  **Saves to** previews the next path, and two checkboxes control whether ComfyUI also keeps its
  own copy. Prompt presets remember the choices.
- **Generation settings in the gallery** (Windows): opening an image shows how it was made in a
  panel beside it. That covers the output (Pass 1, Pass 2, Upscaled or single pass), each prompt
  field, models and LoRAs with weights, size, seed, steps, CFG, sampler, and the 2-Pass, upscale
  and reference settings. Everything else sits under **All node settings**. **Use these
  settings** loads them into the generator, same as Import generation. Images saved before this
  version can't say which pass they came from.
- **Slide-out panels** (Windows): the middle column got long, so generation settings (resolution,
  sampler, steps, CFG, seed, 2-Pass, Upscale) moved into a panel opened by the gear button, and
  file saving into a second one. Both slide in from the left.
- **Gallery navigation** (Windows and Android): arrow keys step through a folder's images. Esc,
  the mouse Back button or Android's Back button close an open image, then go up a folder, then
  close the gallery. On Android, Back also closes open panels and menus before it leaves the app.
  The info panel now shows the image's file name.
- **Text size** (Windows): a slider at the top of the theme menu scales the whole window from 80%
  to 160%. It's remembered, and **Reset** returns to 100%.
- **Themes bring their fonts** (Windows and Android), the same ones Osmium uses, bundled so they
  work offline.
- **"Local ComfyUI" is now "Osmium Comfy"** in both apps, and the ComfyUI Terminal panel is gone
  from Windows. Osmium Comfy's console window shows the same output.

### Comfy Bridge for Android

In the [v1.9.5-android pre-release](https://github.com/Valteil/osmium-workshop/releases/tag/v1.9.5-android),
not yet tested on a phone. It also gets the Back button, gallery and font changes above.

- **Generate queues**, like on Windows: press Generate during a run and it queues another with
  the settings as they are then. Stop, or the notification's Cancel, ends the current run and
  clears the queue.
- **Wiki**: a header button opens the tag-definition window.
- **Main LoRA weight**: a field under Main LoRA.

---

## v1.9.0

### Hotfix (2026-09-28)

Osmium Workshop was rebuilt, and Comfy Bridge for Windows joins this release. If you downloaded
v1.9.0 before this, download it again.

- **Local ComfyUI loads its models once.** The first generation loads them and the ones after it
  start straight away, as they do on a ComfyUI server. Osmium's ComfyUI now uses ComfyUI's own
  DynamicVRAM memory handling, which it had been skipping.
- **Generate queues.** Pressing Generate during a run queues another with the settings as they are
  then, and Stop clears the queue. In SynthDat Overseer nothing is auto-rejected anymore. Results
  that finish while you're still deciding wait their turn, and each Accept or Reject shows the
  next one.
- **Disabled images stay disabled.** A failed removal used to bring an image back into the Gallery
  after a restart. Opening the dataset now finishes the move.
- **Tag Overseer's image grid follows the Gallery's view** (Gallery, Disabled or Originals) and
  updates when the Gallery does. Selecting an image no longer selects its original too, and Undo
  after editing an original changes the original.

### Comfy Bridge

Comfy Bridge for Windows was rebuilt again later on 2026-09-28 with everything below. If you
downloaded it before then, download it again.

- **Local ComfyUI** (Windows): set Run on to Local ComfyUI, choose your ComfyUI folder and
  Connect. Comfy Bridge starts that install itself in its own console window, loading only the
  nodes its workflow needs. Same setup as Osmium's.
- **Persist Comfy** keeps Local ComfyUI running with its models loaded after you close Comfy
  Bridge. Connect picks it back up next time. Close its console window to stop it.
- **Use your PC's Local ComfyUI from your phone.** Tick **Let the phone app use it** (port 8189 by
  default) and the Android app connects to your PC's address, such as its Tailscale IP, like any
  ComfyUI server. With Persist Comfy on as well, the phone keeps working after you close Comfy
  Bridge. There's no password, the same as ComfyUI's own `--listen`, so use it on networks you
  trust. Port 8190 is Comfy Bridge's private line to ComfyUI and only works on the PC.
- **Generate queues**, as above.
- **Tag wiki**: a **Wiki** button opens the same tag-definition window as Osmium's, with
  suggestions as you type, See also links and your own notes. The definitions ship with the app,
  so it works offline.
- **Main LoRA weight**: a field under Main LoRA sets its strength, with 1 as full. Importing a PNG
  brings the weight back too.

The Comfy Bridge Android app and the ComfyUI node pack are unchanged in this release. Get them
from [v1.8.0](https://github.com/Valteil/osmium-workshop/releases/tag/v1.8.0). The v1.8.0 phone
app already works with **Let the phone app use it**.

### Osmium Workshop

- **SynthDat without a ComfyUI server** (desktop): set Run on to Local ComfyUI and choose your
  ComfyUI folder. Osmium starts that install itself in its own console window and loads only the
  nodes the SynthDat workflow needs.
- **Image Quicktagging** (Single view): the left panel becomes checkboxes for common attributes
  such as hair length, breast size, build and where the character is looking, so each is one click.
  Add your own quicktags and categories with +, each with optional rules for extra tags it adds,
  tags unticking removes and tags that untick it. They're kept across datasets.
- **Wiki window**: a toolbar button next to Asc/Desc opens a tag-definition lookup that stays open
  until you close it.
- **Tag definitions refreshed** from Danbooru with about 110,000 more entries. Example-post clutter
  is gone from the text and meta tags such as lowres and commentary no longer show as suggestions.
- **Tag Sorting**: a **+** on every category adds tags right there. **Hair** is its own category
  now, and Body is everything below the neck.
- **Conditional remove** (Master Tags): take a tag off every image that has another tag.
- **Rename all converts WebP to PNG**, since WD14 can't read WebP.
- **SynthDat interrogation follows WD14's On-device mode**, so tagging a reference image needs no
  ComfyUI WD14 node when you've chosen On-device.
- **Theme app icons** (Windows): pick any theme you own as the taskbar icon under Settings ▸
  Appearance ▸ App icon.
- **Opening flourish**: a sweep of your theme's colour and its Osmium mark plays when the app
  opens. Turn it off under Settings ▸ Appearance.

---

## v1.8.0

### Osmium Workshop for Android is released

The phone app leaves testing. It runs the same interface as desktop, generated from the same
sources, so new desktop features reach it automatically.

- Every theme, Theme Studio, merge/void rules and Past Tag Preview, in a touch layout with
  bottom-sheet panels and tag editing in the image modal.
- **Back button** closes the top dialog, menu or sheet, then steps back through the tabs you
  visited, and asks before exiting.
- **Add images** opens Android's app chooser, so Photos, Files, Drive or any file manager can
  supply them.
- **Sequential tagging** runs in a full-screen panel.
- ARM64-only APK of about 43 MB, down from 94 MB. It installs over a previous test build and keeps
  its data. Bucket Images, Compact view and Single view stay desktop-only.

### Themes

- Every theme has its own typefaces, shapes, materials and icon stroke, drawn from 40 bundled
  open-licence font families. A custom icon set replaces emoji across the app.
- **Theme Studio** replaces the old Colors panel with a full custom-theme builder: a live
  miniature of the app, contrast readouts with one-click fixes, per-role fonts, shapes and button
  fills. Start from any owned theme, keep a library of your own and import or export
  `.theme.json` files.
- **Image mats**: the letterbox behind images shows a small motif from the theme's world.
- **Night mode** keeps text and accents readable and works on custom themes.

### Tagging

- **Several tags at once**: `1girl, red eyes, plump` in any add-tag field adds all three as one
  undoable edit.
- **Past Tag Preview**: ghost chips show the tags a merge or void rule took off an image. Delete
  one per image, or turn the rule off to bring them back.
- **File ▸ Add images…** on desktop too. With no dataset open it offers to create one.
- **Swipe mode** became a spatial map where tabs, views and image paging pan like one surface.

### Comfy Bridge 1.8.0

- **Theme Studio** with the same `.theme.json` format as Osmium Workshop, plus bundled fonts and
  a Custom palette entry.
- **Mobile:** fixed runs sticking on "Generating…" after picking a reference image. Uploads now
  show progress, time out when stalled and can be retried.

---

## v1.7.0

### Bucket Images (new dock)

Crops and resizes every image to its nearest training bucket, using the same aspect-ratio
bucketing as Anima-TrainFlow and a u2net saliency model that keeps the head in frame.

- Originals move to `original_images/` and get their own **Originals** view. Bucketed copies are
  written back as PNGs under the same name, so captions carry over.
- Already-valid images are skipped, and **Revert bucketing** restores the originals.
- Min side, max side and step are configurable (256 / 1024 / 64). **Prefer GPU** falls back to CPU
  automatically. The 176 MB model downloads on first use.

### Tag Sorting

- A **Tag sorting** toggle in Single view and the image modal groups tags into Character, Body,
  Face, Clothes, Limbs and Hands, Sexual, Pose, Scene, Effects and Other.
- **Add subject** splits multi-character images into named subjects. Move tags by dragging, or
  shift-click and choose "Move tags to". Saved per image.

### Also new

- **Review flagged tags**: a left-panel list of every flagged tag with an undoable **Reviewed**.
- Single view shows a compact preview that opens the full zoomable view on click.

### Comfy Bridge 1.7.0

- **Mobile:** a progress-bar notification while generating, with a Cancel action.
- Desktop and mobile now share one ComfyUI core.

---

## v1.6.5

### Osmium Workshop

- **Dataset folder tabs**: split tracked folders across tabs, each optionally password-locked for
  casual privacy.
- **Master Tag Control** restructured: Disable added, immunize pairs collapsed into toggles, and
  the thumbnail grid pops out into a bigger modal with drag-to-select.
- **Osmium** theme added as the fifth free theme.
- Landing page and live demo launched on GitHub Pages.

### Comfy Bridge

- **Upscale saves as its own file.** Each generation yields up to three images (Pass 1, Pass 2,
  Upscaled) in a swipeable preview, with the upscaled one under an `Upscaled/` subfolder.
- Sampler and scheduler pickers read from ComfyUI, and a ComfyUI Terminal panel shows live server
  output.
- **Mobile:** desktop feature parity, with generation settings in an off-canvas drawer and a log
  and terminal slideout.

---

## v1.6.0

### Comfy Bridge

- **Import generation**: pick a PNG made with the workflow and its prompt and settings are
  re-entered.
- Osmium theme palettes (25, colors only) with a topbar picker.
- SynthDat output naming preserved: rating/character/lora.png inside the chosen folder.

---

## v1.5.5

Renamed from Dataset Tag Studio (briefly Dataset Manager Studio) to **Osmium Workshop**.

### Osmium Workshop

- **Sequential tagging** (new): walk the filtered gallery image by image and set text and
  language, censorship, perspectives, monochrome, sound effects, comic, multiple views and koma
  from one panel, with a live preview of the tags Confirm applies.
- **Pixel tools** in the image modal: Rotate and Crop rewrite the file in place, and Isolate saves
  a region as a new image.

### SynthDat Overseer

- A WD14 reference-tag transfer picker with Pose, Limbs, Scene and Sexual destinations, using
  vocabularies seeded from Danbooru tag groups.

---

## v1.5.0

- **On-device WD14 tagging**: tag images without a ComfyUI instance.
- **SynthDat Overseer**: prompt fields move to a floating panel behind an edge tab, with a unified
  prompt box mode and optional rename-to-dataset-conventions on Accept.
- **Rename all** (gallery toolbar): renames every image and its `.txt` to `1` through `N`,
  undoable.
- **Remove all tags** in the 3-dot menu.
- The whole renderer ported to strict TypeScript, which caught a couple of real bugs.

### Comfy Bridge 1.0.0 (first release)

A simpler web UI for ComfyUI with one built-in workflow, for desktop and Android (LAN, Tailscale
or hotspot). It needs the `ComfyUI-DataSetManagerNodes` pack on the ComfyUI instance.

---

## v1.4.0

- **Delete images permanently**: from the 3-dot menu or as a Tag Overseer mass action. It asks
  first, can't be undone and skips locked images.
- **SynthDat Overseer**: mark tags as void on the pending card, and Accept adds a Retroactive Void
  rule for them.
- **Tag Pruner**: each box has its own selection, mirror-to-gallery toggle and Clear, with a
  Unify/Void row per box.
- SynthDat's ComfyUI dependencies unified into one node pack, shipped as its own zip, with every
  node registered under a "DSM " prefix.

---

## v1.3.0

- **Help** panel with the user guide and glossary.
- SynthDat Overseer settings are saved per dataset.
- **Suppress Theme Flourishes** now covers natively epic and legendary themes, split into
  hover-fill, card-tilt and ambient animations.
- **Export app state** in Settings replaces "Generate GitHub-ready package", for bug reports.
- Right panel gets a shared header with a collapse arrow and a Tag Overseer / Gallery tools switch.

---

## v1.2.0

- **SynthDat Overseer** (new tab): drives your ComfyUI to generate more training images of a
  character from a pose reference and ControlNet. WD14 interrogates the pose, you fill the prompt,
  generate in 1 or 2 passes with a live preview, then Accept into the dataset or Reject. Unused
  results land in `Disabled/`.
- **Retroactive Merge/Void** (new dock): standing `[tags] → canonical` or `→ void` rules that
  correct matching tags the moment they appear and block typing them. Rules pause per rule or per
  tag, and **Merge Immunize / Antivoid** exempt single images. Every change is undoable.
- **Image locking**: mass and automatic tools skip locked images, which stay editable.
- **Hardware acceleration** setting for rendering on the integrated GPU or turning acceleration
  off.
- **Unsaved Approved** view for SynthDat images accepted but not saved yet.
- A zoomable, pannable lightbox for every preview, and per-theme **Refine** upgrades in the Shop.
- The Tauri port (v1.1.5) is discontinued, so the app is Electron-only.

---

## v1.1.5 (Tauri) — discontinued

A Tauri build of v1.1.0 (native WebView2, about 29 MB installed instead of 180 MB), as an NSIS or
MSI installer. It has the same features except the GitHub package export. Discontinued in v1.2.0,
and it receives no updates.

---

## v1.1.0

- **WD14 Autotagger**: tag selected or single images through a local ComfyUI running the WD14
  Tagger node, with auto-apply or a review step.
- **Datasets tab**: a folder manager for every dataset you've opened, with drag-reorder, sorting
  and themed folder icons.
- **UI animation modes**: Fade, Swipe or Off for menus, panels, tabs, views and the image modal.
- **Refine Theme** shop upgrade, **Unload dataset**, and new achievements.

---

## v1.0.0

First release, as **Dataset Tag Studio**: a portable, offline Windows app for tagging image +
`.txt` caption datasets. Tags are edited as clean space-separated text.

- **Views**: Grid, Compact (hover previews and side-by-side comparison), Single (zoom and pan)
  and Disabled, plus a floating zoomable image card from any view.
- **Filtering**: comma-separated multi-tag search with AND, OR, XOR and NOT, **Flag isolated
  tags**, quick filters for All, Untagged and Unsaved, and a tag list sortable by keyword family,
  frequency or name.
- **Bulk tools**: Tag Pruner, Unify or void selected tags, and dataset-wide Find / Replace all.
- **Master Tags** tab: apply, remove, conditionally apply and rename tags across a selection or
  the whole dataset, with a multi-image comparison table in Single view.
- **Text & panel tagging** from the 3-dot menu, plus review flags, image notes and a tag-count
  badge.
- **Undo/redo** and a per-folder **Edit Log** where any entry can be undone or redone on its own.
- **Disable images** into `Disabled/` and restore them.
- **Tag Details**: bundled Danbooru wiki definitions, categories and post counts, with your own
  descriptions for tags that have none.
- **Editing Stats** tab with charts of every logged action.
- **34 achievements** that pay out **Edibits**, spendable in the Shop on 5 premium themes (plus 4
  free), custom colors, a real night mode, font size and discrete mode (blur).
- Dockable, collapsible, resizable right-sidebar panels and Favorites for quick folder access.
