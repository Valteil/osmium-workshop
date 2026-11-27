# Patch notes

Every release of Osmium Workshop (called Dataset Tag Studio up to v1.5.0), newest first. Comfy
Bridge ships in the same releases from v1.5.0 on. Downloads are on the
[releases page](https://github.com/Valteil/osmium-workshop/releases).

- [v2.1.0](#v210) · [v2.0.0](#v200) · [v1.9.5](#v195) · [v1.9.0](#v190) · [v1.8.0](#v180) · [v1.7.0](#v170) · [v1.6.5](#v165) · [v1.6.0](#v160) · [v1.5.5](#v155) ·
  [v1.5.0](#v150) · [v1.4.0](#v140) · [v1.3.0](#v130) · [v1.2.0](#v120) ·
  [v1.1.5](#v115-tauri--discontinued) · [v1.1.0](#v110) · [v1.0.0](#v100)

---

## v2.1.0

### Osmium Workshop

- **Tag groups in the Wiki window:** a **Groups** sidebar browses Danbooru's tag groups by section.
- **Mouse Back / Forward in the Wiki window** steps through the tags and groups you've opened.
- **Hide the top bar:** ▲ folds it away, ▼ brings it back.
- **Dragging tags scrolls the panel** when held near its top or bottom edge.
- **Delete tag from pool:** removes a tag from a saved character without touching the image.
- **Load a character for all images** from **Load character ▾**.
- **Trigger tags:** mark tags as triggers (green chip). Trainflow's **Send…** adds them to the
  LoRA's name and its metadata; **Concise Lora** keeps the ones not in the name in the metadata
  only.
- **Fixed:** Update saved dropped a character's tags the image didn't have.
- **Fixed:** a character section or other per-image setting could be lost on reload.

### Comfy Bridge

- **LoRA picker:** previews, search by name or trigger word, and versions grouped in one row. The
  ✎ button edits a LoRA's preview, triggers and versions. Triggers also come from the file's own
  metadata.
- **Trigger chips** under each LoRA field add a trigger to its tag category's box, light up while
  it's in the prompt, and take it out on a second click.
- **Regional prompt** (new **Regional** tab, replaces ControlNet's pose editor): draw boxes and
  give each its own prompt, with presets, layouts and a built-in guide. For Anima models; with your
  own ComfyUI, update the ComfyUI-DataSetManagerNodes pack.
- **Image to image:** start Pass 1 from a picture at a chosen **Strength**. In the USDU panel,
  **Upscale by** 1 redraws an image at its own size instead of upscaling.
- **Tag with WD14** next to Pick reference image tags the reference picture.
- **WD14 Extra tags** for the upscale / image-to-image WD14 prompt.
- **Padding colour** for the reference image's Pad fit, picked with a colour field or by
  Shift-clicking the opened preview. With your own ComfyUI, update the ComfyUI-DataSetManagerNodes
  pack.
- **Lock a prompt box** so clearing, presets and imports leave it alone; **Unlock all prompt
  fields** clears every lock.
- **Unload all models** frees ComfyUI's VRAM and logs how much. USDU now unloads the generation
  models before upscaling, and the reverse.
- **Upscale tab picks from your gallery,** with folders, search and sorting.
- **Tag groups in the Wiki window,** as in Osmium.
- **Mouse Back / Forward** in the Wiki window, the Upscale picker and the gallery.
- **Phone, PC gallery over a slow link:** Details show at once, **Load thumbnails only** skips
  full downloads, and full images are cached and cancelled when you leave them.
- **Fixed:** ← / → in the zoom view now switch between passes.
- **Fixed:** the Metadata tab's LoRA lists opened only some of the time; its LoRA fields now use
  the same picker.
- **Fixed:** WD14's **Use as prompt** overwrote locked boxes.
- **Fixed:** ComfyUI's PC copy now saves in the same rating and character folders as the app's.
- **Fixed (phone):** dragging a Regional box scrolled the page.

---

## v2.0.0

### Osmium Workshop

- **Trainflow tab** (Windows): trains an Anima (or Janima) LoRA on the loaded dataset in the
  background, with progress, previews and checkpoints. Get the trainer from this release
  (`Anima-TrainFlow-Osmium-2.0.0.zip`) and run its `Install_Requirements.bat` once.
- **Trainflow options:** LoKr and LoHa, LoRA+, more optimizers and an **Advanced** section for the
  trainer's settings. **Continue training** from any checkpoint, **Send** a checkpoint to a folder
  of yours, and **Clear training cache**. Retraining a trigger word starts a new folder. The
  trainer is updated to sd-scripts v0.12.0.
- **Curate tab:** sort a folder of new images, split an artist's styles into **Artstyles**, and add
  the keepers to a dataset.
- **Transfer tags:** copy some or all of an image's tags onto other images.
- **Isolate (Split)** (Windows): cut a character sheet or page of panels into separate images.
- **Delete tags:** Tag Overseer's list takes ticked tags off every image at once.
- **WD14 review window, rebuilt:** one card per image, WD14's tags tinted, with a Dropped row.
- **Edit Log upgrades:** filters, sort order, paging, per-image undo for bulk edits, and an image's
  own edit history from its right-click menu.
- **Single view now holds Sequential:** Quicktags, the image and the Sequential controls in one
  view.
- **Quicktags:** take less room, can be reordered, and your own can be edited or deleted.
- **Sequential Perspective:** Straight-on, Facing viewer and Looking at viewer replace "Front".
- **Bucket Images** keeps every original in `original_images/` and re-buckets from it. Bucket sizes
  are remembered per dataset, with a **Training size** preset. Bucketing copies tags onto the
  originals.
- **Windows 7** and **Frutiger Aero** themes.
- **Attention setting** for Osmium Comfy (auto, Flash, Sage, xformers or PyTorch).
- **Fixed:** Undo/Redo and the Log getting out of step, including after Rename all and when undoing
  a Merge or Void.
- **Fixed:** Rename all could delete images if it stopped partway.
- **Fixed:** deleted images came back after bucketing, and disabled images came back on Start.

### Comfy Bridge

- **Gallery tab** with a **Compare** section (side by side or overlay).
- **Upscale with USDU:** Ultimate SD Upscale for new generations and an **Upscale** tab for any
  image.
- **WD14 tags:** tag the last generation's images or any image, and use the tags as the prompt.
- **Metadata tab:** see how an image was made and look up its LoRAs on CivitAI and CivArchive.
  **LoRA training metadata** shows what a LoRA was trained with.
- **Download to PC** (Windows): download a looked-up LoRA into your loras folder.
- **ControlNet pose editor:** extract, create or edit a mannequin or OpenPose pose for the
  reference image.
- **Import from any image:** Import Generation reads A1111/Forge, NovelAI, InvokeAI, SwarmUI,
  Fooocus and other ComfyUI images.
- **Seed behaviour:** Fixed, Randomize, Increment or Decrement.
- **Reorganize a generated image** (Windows) from its details panel with the File Namer.
- **Use these prompts** loads only an image's prompts.
- **Clear all prompt fields** button.
- **Phone access token** (Windows): optionally require a shared token from the phone.
- **Main LoRA is optional**, and friendlier default settings.
- **RES4LYF samplers** appear when the node pack is installed.
- **Open folder** buttons, **in-app Help**, the **Attention setting**, and the Windows 7 and
  Frutiger Aero themes.
- **The gallery panel remembers** its folder and scroll position.

### Comfy Bridge for Android

- **File Namer** on the phone.
- **Browse the PC's output folder** from the phone (Phone | PC switch).
- **Find PC** on your Wi-Fi, and **Recent connections** to reconnect in one tap.
- **Flaky links recover on their own,** and reference image picking is more reliable.

---

## v1.9.5

Osmium Workshop and Comfy Bridge for Windows, plus the Comfy Bridge Android app.

### Osmium Workshop

- **Change tag category** for a tag across every dataset.
- **Character sections** (Tag sorting): add, save and load named character sections.
- **Originals is now Initial State** (`initial_state/`).
- **Main LoRA weight** in SynthDat Overseer.

### Comfy Bridge

- **File naming** (Windows): automatic rating, character and upscale folders, and filename
  toggles.
- **Generation settings in the gallery** (Windows), with **Use these settings**.
- **Slide-out panels** (Windows) for generation settings and file saving.
- **Gallery navigation** with the arrow keys and Back.
- **Text size** slider (Windows).
- **Themes bring their fonts.**
- **"Local ComfyUI" is now "Osmium Comfy".**

### Comfy Bridge for Android

`ComfyBridge-1.9.5-android.apk`.

- **Generate queues**, **Wiki** and **Main LoRA weight**, as on Windows.

---

## v1.9.0

### Hotfix (2026-09-28)

Osmium Workshop was rebuilt, and Comfy Bridge for Windows joins this release. If you downloaded
v1.9.0 before this, download it again.

- **Local ComfyUI loads its models once** instead of every generation.
- **Generate queues** in SynthDat Overseer.
- **Fixed:** disabled images could come back after a restart.
- **Tag Overseer's image grid follows the Gallery's view.**

### Comfy Bridge

Comfy Bridge for Windows was rebuilt again later on 2026-09-28. If you downloaded it before then,
download it again.

- **Local ComfyUI** (Windows): Comfy Bridge starts your ComfyUI install itself.
- **Persist Comfy** keeps it running after Comfy Bridge closes.
- **Use your PC's Local ComfyUI from your phone** (**Let the phone app use it**).
- **Generate queues**, a **Tag wiki** and **Main LoRA weight**.

The Comfy Bridge Android app and the ComfyUI node pack are unchanged in this release. Get them
from [v1.8.0](https://github.com/Valteil/osmium-workshop/releases/tag/v1.8.0).

### Osmium Workshop

- **SynthDat without a ComfyUI server:** Osmium starts your ComfyUI install itself.
- **Image Quicktagging** (Single view): one-click checkboxes for common attributes, plus your own.
- **Wiki window** for tag definitions, refreshed with about 110,000 more entries.
- **Tag Sorting:** **+** on every category, and a separate **Hair** category.
- **Conditional remove** (Master Tags).
- **Rename all converts WebP to PNG.**
- **SynthDat interrogation follows WD14's On-device mode.**
- **Theme app icons** (Windows) and an **opening flourish**.

---

## v1.8.0

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
