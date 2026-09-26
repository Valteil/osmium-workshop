# Osmium Workshop — User Guide

A practical walkthrough of everything in the app, organized by tab. If you just want a feature
list, see [README.md](README.md#features) instead — this document is the "how do I actually do X"
companion to that.

The app also has its own **❓ Help** button in the topbar — a condensed, in-app copy of most of
this guide (including the beginner-friendly glossary entries) for when you don't want to leave the
app to look something up.

---

## Contents

- [Opening a dataset](#opening-a-dataset)
- [The Gallery tab](#the-gallery-tab)
- [The 3-dot image menu](#the-3-dot-image-menu)
- [Power tools (right sidebar)](#power-tools-right-sidebar)
- [Bucket Images](#bucket-images)
- [Tag Overseer tab](#tag-overseer-tab)
- [Sequential tagging](#sequential-tagging)
- [Datasets tab](#datasets-tab)
- [Editing Stats tab](#editing-stats-tab)
- [SynthDat Overseer tab](#synthdat-overseer-tab)
- [Settings](#settings)
- [Themes, Shop & Achievements](#themes-shop--achievements)
- [Favorites](#favorites)
- [The Edit Log](#the-edit-log)
- [Saving your work](#saving-your-work)
- [The mobile app & Comfy Bridge](#the-mobile-app--comfy-bridge)
- [Tips & troubleshooting](#tips--troubleshooting)

---

## Opening a dataset

**File ▸ Open dataset folder** and pick the folder containing your images and their matching
`.txt` caption files (same base filename — `image.png` + `image.txt`). Underscores in tags are
shown as spaces in the app and converted back to underscores when saved, so you never need to
think about the distinction while editing.

The app also creates a few of its own files/folders inside your dataset folder as you use it —
none of them touch your images or captions unless you tell them to:

| Folder/file | What it's for |
|---|---|
| `Disabled/` | Images you've moved out of the active set (still editable, just hidden from the normal views) |
| `_tag_edit_log.json` | The full undo-able edit history for this dataset |
| `_dts_canonical_tags.json` | Your Retroactive Merge/Void rules |
| `_dts_meta.json` | Per-image notes, review flags, locks, and other metadata |
| `_dts_synthdat_settings.json` | SynthDat Overseer's prompt/generation settings for this dataset (only appears once you've used that tab) |

---

## The Gallery tab

This is the tag editor itself — everything else in the app supports what happens here.

**Views** (toolbar buttons):
- **Grid** — the default. Each card shows the image, its tags as editable chips, a dirty/untagged
  indicator, and a 3-dot menu. Toggle "Dynamic card heights" for a masonry layout.
- **Compact** — dense thumbnails with tags on hover. Shift-click two images to pin them side by
  side in an aligned comparison table. Use it to triage large folders quickly.
- **Single** — one image at a time: a compact preview beside a roomy tag panel, with arrow-key
  navigation. Click the preview for the full-size lightbox (scroll to zoom, drag to pan) to
  inspect fine details (text, hands, artifacts) before training. The toolbar's "N / total" box is
  editable — type an image number and press Enter to jump there. Select 2+ images in Tag Overseer
  first and switch here for a multi-image tag-alignment table.
- **❌ Disabled** — images you've moved out of the active set. Use it for maybes you don't want
  to delete.
- **🖼 Originals** — the pre-bucketing originals kept by [Bucket Images](#bucket-images).
  Read-only here; the dock's Revert is what moves them back.
- **🔢 Rename all** — renames every loaded image (+ its `.txt`) to a simple zero-padded `1`-`N`
  sequence (active dataset first, then `Disabled/`, continuing the same count), confirmed first.
  Logged and undoable from the Log panel like any other bulk action. Use it to normalize a folder
  to `1`–`N` before training.

The gallery's own column count normally shrinks as font-size zoom or an open side panel eats into
the available width — Settings ▸ Appearance ▸ "Gallery columns" forces a fixed count instead, if
you'd rather bump the font size for readability without losing columns.

Clicking any image opens a floating zoomable/pannable card modal; on desktop its 3-dot row
additionally offers **⟲/⟳ Rotate** (90° steps) and **✂ Crop**, both of which rewrite the image
file in place — confirmed first, logged as their own undoable Edit Log rows, PNG/JPG/WebP only.
Crop's **Isolate** button instead saves the selected region as a brand-new image
(`<original>_isolateN`) in the dataset with a copy of the source's tags; the original is
untouched.

**Editing tags:** click a tag chip to open its context menu (filter by it, open its wiki
definition, flag it for review, explore its keyword family). Type into a card's "+ add tag" field
and press Enter to add a new one. Click the × on a chip to remove it.

**🏷 Tag sorting:** in Single view and the image modal, this pill above the tags groups them into
labelled categories — Character, Body, Face, Clothes, Limbs and Hands, Sexual, Pose, Scene,
Effects, Other — instead of one flat wall (grid cards stay flat). The grouping is a best guess
from Danbooru tag groups, so the odd tag lands in a neighbouring category. The setting is
remembered. With it on, **＋ Add subject** (next to the pill) splits an image's tags into named
subjects for multi-character images: rename a subject by typing in its name, add category
subheaders with **＋ Subheader**, and move tags between subjects by dragging a chip onto a
subject, or shift-clicking chips then **Move tags to:**. Every tag starts under the first subject
and keeps its category when moved. Subjects are saved per image; removing them all returns to the
plain category list.

**Filtering:** the sidebar filter box supports multi-tag search combined with AND / OR / XOR /
NOT, plus quick filters for All / Untagged / Unsaved. Typing 2+ characters shows a suggestions
dropdown — direct matches first, then other tags sharing a word with them (e.g. searching "dr"
suggests "dress" directly, and "black dress"/"dress shoes" under "Same keyword family"). "Exact
tag match" (checkbox under the search box) makes a search match only a tag that equals your term
exactly, instead of the default "contains" behavior — so "dress" won't also pull in "black dress".
The **Boolean** dropdown under the box picks how terms combine (default **OR**: any term matches); tick **Lock** to keep
your choice when **Clear filter** or opening a dataset would otherwise reset it to OR.
"Flag isolated tags" highlights tags that appear on 2 or fewer images — a fast way to spot typos.
**🚩 Review flagged tags** swaps the left panel's TAGS list for every tag flagged for review (from a
chip's menu) anywhere in the dataset; each row's **Reviewed** clears that flag on every image at
once (undoable), and the row stays struck through for the rest of the session.

**Locking an image** (🔒 in the 3-dot menu) excludes it from every mass/automatic tool (Unify/Void,
Master Tags, bulk WD14) while leaving it fully editable by hand — use it to protect an image you
don't want an unattended batch operation to touch.

---

## The 3-dot image menu

Every image card has a "⋯" button (or right-click the card) opening a menu of per-image actions.
Each item's label is short on purpose — hover any of them for the full explanation.

- **❌ Disable / ↩ Restore** — move the image to/from `Disabled/`.
- **❌ Delete permanently** — removes the image and its `.txt` from disk outright, with no way
  back. Fully confirmed first. Also available as a
  mass action for your whole selection in Master Tag Control (see below). Only removes the copy
  inside your dataset folder — a SynthDat-generated image's separate original in ComfyUI's own
  `output/` folder is untouched.
- **🔒 Lock / 🔓 Unlock** — see above. Use it to protect finished images from batch tools.
- **🚫 Merge Immunize**, **🟢 Antivoid**, **✋ Antimmunize** — permanently exempt this one image
  from the Retroactive Merge/Void dock's rules (see below) — merge rules, void rules, or both.
  This is a stronger, always-on version of Lock: Lock only skips mass *tools*, these specifically
  block the standing rule system even when you deliberately re-trigger it. Use it for images that
  must keep an exception permanently.
- **⏮ Reset edits** — revert this image to its earliest known tag state. Use it to undo a bad
  autotag run on one image.
- **🗑️ Remove all tags** — clears every tag on this image in one click (confirmed first) instead
  of clicking each chip's own ×. Undoable from the main Undo button like any other tag edit.
  Use it to start an image's tags from scratch.
- **🐍 WD14 Tag** — run the WD14 Autotagger on just this one image (settings live in Tag
  Overseer — see below). Use it to tag a single new image.
- **Text/language, comic/koma, review flags, blur, notes** — additional per-image metadata, all
  written immediately as you toggle them (no separate "Apply" step).

---

## Power tools (right sidebar)

Docked panels in the Gallery's right sidebar. Drag a dock's header to reorder it, click to
collapse/expand; most docks can also be resized by dragging their bottom edge (Retroactive
Merge/Void auto-sizes to its own content instead, so it skips this). The whole right sidebar can
also be dragged wider/narrower from its own left edge, and collapsed entirely via the arrow at its
top. Settings has a "Reset panel layout" button if things ever get into a bad state.

### Tag Pruner
Search/browse every tag in the dataset, hand-pick any combination, then feed them into Unify/Void
below. Use it to collapse spelling variants and junk tags dataset-wide. **+ Add another Tag
Pruner** opens as many independent boxes as you want — each has its own
selection, so a tag picked in one box is hidden from every other box's results (it can't be
double-picked), letting you browse and select several unrelated keyword families side by side
without them interfering.

Each box's own header row also has:
- **🔍 Mirror to gallery search** — checking it makes THIS box's selection drive the gallery
  filter on the left, so you can see exactly which images a merge/void is about to touch. It
  keeps whatever the **Boolean** dropdown says (OR shows every image with any selected tag). Only one
  box can do this at a time — checking one unchecks any other.
- **Clear** — deselects everything in just this box; other boxes are unaffected.

### Unify/Void
Every Tag Pruner box with a non-empty selection gets its own row here — its own tag summary, its
own "unified tag name" field, its own Apply and Void:
- **Apply** merges that box's selected tags into the name you type in.
- **Void** permanently deletes that box's selected tags (confirmed, fully undoable).
- An "Also apply to Disabled images right now" checkbox (shared, above every row) covers
  already-disabled images in the action — see the next section for what happens to Disabled
  images otherwise.

Every Unify/Void action automatically creates or extends a standing rule in the dock below, so the
same correction keeps applying going forward without you having to repeat it.

### Retroactive Merge/Void
Standing rules of the shape **"these tags → this one canonical tag"** (a merge), or **"these tags
→ nothing"** (a void — deletes outright, no replacement). Whenever any of a rule's tags show up on
a Gallery image afterward — by WD14, Master Tags, an accepted SynthDat image, or anything else —
they're automatically corrected. If you try to type one of those tags in by hand, the app blocks
it instead of silently rewriting it, with a toast pointing you back here.

**This only affects Gallery images.** Disabled images are frozen exactly as they are — they only
get corrected once they're back in the Gallery.

**Full control, so you're never stuck with a rule doing something you don't want:**
- **Pause a whole rule** (the "Enabled" checkbox) without deleting it — this actively un-merges or
  un-voids every image the rule had affected, using the edit log to restore exactly what each one
  originally had (not just "stop correcting from now on"). Re-enabling resweeps everything forward
  again.
- **Toggle one child tag off** the same way, without forgetting it was ever part of the rule —
  e.g. you merged "black dress"/"frilly dress"/"dress" into "black frilly dress" but decide "dress"
  alone shouldn't auto-merge anymore, since not every dress is black.
- **Per-image Merge Immunize/Antivoid/Antimmunize** (see the 3-dot menu section above) — the
  strongest override, ignoring the dock's settings entirely for one specific image.
- **+ New rule** adds one by hand instead of waiting for a Unify/Void action to create it.

Every rule change, and every resulting correction, shows up as its own entry in the Edit Log with
Undo/Redo — voiding a tag, un-voiding it, then voiding it again shows as three separate,
correctly-ordered log rows.

Void rules and merge rules are shown as two separate groups in this dock — Void is collapsible
(all your voided tags actually live under one shared rule, so there's normally just one to
expand), Merge lists each canonical-tag rule on its own. Use standing rules so a cleanup never
needs repeating.

### Bucket Images
Crops and resizes every Gallery image to its nearest LoRA training bucket, so your trainer
doesn't have to. Set **Min side / Max side / Step** (default 256 / 1024 / 64 — the same bucket set
the trainer builds); each image goes to the bucket closest to its aspect ratio. The crop is
subject-first: a u2net saliency model decides what to keep. It's a one-time ~176 MB download via
the dock's **⬇ Download model** button. **Prefer GPU** (on by default) runs it on your graphics
card with an automatic CPU fallback; the log names which one handled each image.

Originals are never lost: before an image is replaced, it (plus a copy of its `.txt`) moves to an
`original_images/` folder, browsable from the Gallery's **🖼 Originals** view. Images already at a
valid bucket size are left alone, so re-running on a mixed folder only processes the rest.
**↩ Revert bucketing** restores the originals and removes the bucketed copies. Any unsaved tag
edits are saved first, since bucketing reloads the folder.

---

## Tag Overseer tab

Two things live here: **Master Tag Control** and the **WD14 Autotagger**. Clicking the tab again
while it's open returns to the Gallery. If the right sidebar is tucked away, clicking the tab
opens it, and toggling back via the tab tucks it away again.

### Master Tag Control
1. Select images — click thumbnails in the mini-grid here, or select in the main Gallery first
   (selection stays in sync both ways).
2. Apply or remove a tag across the whole selection, conditionally apply one tag based on another
   being present — or the inverse, based on it being ABSENT (its own separate row, right below the
   first) — or run a dataset-wide rename / find-and-replace. Use it for bulk passes (e.g. tag
   everything containing X).
3. Mass **Lock/Unlock**, **Merge Immunize/Antivoid/Antimmunize** buttons apply the same per-image
   flags described above to your entire selection at once.
4. **❌ Delete selected permanently** — removes every selected image and its tags from disk
   outright (not to `Disabled/`). Confirmed first, names the count, and skips locked images —
   there's no undo, so Lock anything you want protected from an accidental mass-select first.

The panel's bottom also has two **▶ Sequential** buttons — see [Sequential tagging](#sequential-tagging)
below.

### 🐍 WD14 Autotagger
Sends selected images (or one image via its 3-dot menu) through WD14 and merges the returned
tags onto each card. Expand "⚙ WD14 settings" here to pick a tagging source: **on-device** runs
the model locally — no ComfyUI needed, it downloads on first use, and **Prefer GPU** (desktop
only) runs inference via DirectML when available, falling back to CPU automatically, with the
completion toast naming which engine ran — or **ComfyUI**, which sends images to a WD14 Tagger
node on your own instance and scrapes its model list live. Either way you also set confidence
thresholds and whether results apply automatically or go through a review step first. Use it to
bootstrap tags onto untagged imports.

### Sequential tagging

Desktop-only, started from the **▶ Sequential from first / from selected** buttons at the bottom
of Master Tag Control. It takes over Single view and walks your current filter image by image;
"from selected" starts at your first selected image instead of the top. Each image shows the
same quick-modify panel:

- **Text** — has-text toggle plus a Japanese toggle and a list of foreign-language checkboxes
  (add your own with the built-in "+ Add language…" field; custom entries persist across images).
- **Censorship** — Unspecified / Censored / Uncensored radios; picking Censored reveals type
  checkboxes (Generic, Mosaic, Bar, Blur, Heart — several can be checked at once).
- **Perspective** — independent checkboxes (Front / Side / Below / Above / Behind); an image can
  carry several at once.
- **Color, Sound, Comic** — Monochrome, Sound effects, Comic, **Multiple views**, and koma-count
  checkboxes, all independent of each other.

Every control prefills from the image's existing tags. Below the image, a **live tag-preview
strip** shows exactly which indicator tags Confirm will apply (tags new to the image glow) —
it's only these panel selections, not the image's other tags. **Confirm** applies them, marks
the image, and advances automatically; your progress is saved per image, and "Exit sequential"
(or leaving Single view) ends the run without losing completed work. The image is the same
compact preview as Single view — click it for the fullscreen lightbox for close inspection.

Use it when a whole filter batch — a character, a rating, everything missing "monochrome" —
needs its indicator tags aligned without opening each card by hand.

---

## Datasets tab

A folder manager separate from the Gallery — shows every dataset folder you've ever opened as a
themed folder icon. Sort manually (drag) or by name/time. Right-click a folder for options:
remove from this list, pin as a favorite, view its achievements read-only, change its icon, or
move it to a different tab. Opening an untracked folder prompts once to add it here. Use it to
switch between characters/projects without reopening folders.

**Tabs** split your tracked folders into separate groups instead of one flat grid — the built-in
**Default** tab always shows everything with no lock option; any tab you create with the **+**
button can optionally be given a password (its own ⋯ button ▸ Set password). A password-protected
tab locks every time the app starts — nothing from it, not even folder names, renders until you
enter the password again. This is meant to stop someone else who briefly picks up your machine
from seeing folders you'd rather they didn't, not to withstand a determined attacker with access
to your files (the password is hashed, but with no deliberately-slow KDF — see the in-app help
panel for the same caveat).

---

## Editing Stats tab

Animated charts (pie or bar) of every logged action by type, plus summary cards — total edits,
undo/redo stack depth, achievements unlocked. Use it to see where cleanup time goes.

---

## SynthDat Overseer tab

Drives your own local ComfyUI instance to generate **more** training images of a character you've
already started a LoRA on — the real use case: your dataset is thin, so you strong-arm that LoRA
into new reference poses via ControlNet instead of hand-posing/hand-drawing more source material.

**Requires ComfyUI with a few extra things installed** — see `ComfyUI-dependencies/README.md` in
this repo for exactly what and why (some of it is bundled there directly).

**The flow:**
1. **Pick a reference pose image** (or skip this entirely via "I don't want to use a reference
   image" for an ordinary prompted generation with no ControlNet).
2. Click to **WD14-interrogate** it — this pulls tags from the reference image so you can
   hand-assign the ones that matter (pose, limbs, etc.) to their prompt fields below.
3. Fill in the rest of the prompt fields — click **"‹ 📝 Prompt fields"** (docked to the right
   edge, always reachable regardless of scroll position) to open them as an overlay panel; click
   its own **›** arrow, or click anywhere outside it, to close it again. Global (Main LoRA trigger
   word), Character Trigger, and Negative always stay visible; the rest — Character, Rating,
   Hair/Face/Chest/Body, Clothes/Limbs/Sexual, Extra/Effects/Scene — can be filled in individually,
   or check **"Use a single unified prompt box"** to paste one ready-made prompt into a single
   field instead (useful if you already have a prompt written and don't want to split it apart).
   A small **⇄** button next to Width/Height instantly swaps the two.
4. Set your generation parameters (sampler, seeds, steps, CFG — all live in the Generation section
   now, alongside Generate/Stop) and click **▶ Generate**.
   - **1-Pass** is the default (fast). Check "Enable 2nd pass" for an optional refinement pass —
     when it's on, BOTH results come back and you pick which to keep before deciding.
   - Watch the live preview while it runs; **⏹ Stop** interrupts a running generation.
5. **Review the result.** A "🐍 Re-interrogate output with WD14" button lets you check what the
   model actually drew (it sometimes adds details nobody prompted for). Prune any tags you don't
   want from the final "pending" tag card — it'll also suggest merges based on your Retroactive
   Merge/Void rules. Right-click a tag in this card for **📖 Definition** or **🚫 Mark as void** —
   voiding drops that tag from this image AND adds a Retroactive Void rule for it once you Accept,
   handy for import tags (artist, rating, trigger words) you don't want without needing to re-run
   WD14 just to strip them. Any tag already covered by an existing void rule shows struck through
   automatically, previewing what Accept will drop even without marking anything new.
6. **✅ Accept** writes the image + tags straight into the dataset root (tags are written to disk
   right away too, so a crash before your next Save doesn't lose them) as a normal unsaved edit.
   Check **"Rename this image to match dataset conventions?"** first if this dataset already uses
   simple numbered filenames — it'll pick up the next number (matching the existing zero-padding
   width) instead of the default `synth_<timestamp>` name.
   **❌ Reject** sends it straight to `Disabled/` instead. Either way, nothing generated is ever
   silently thrown away — even the pass you didn't pick, if you ran 2-Pass, gets saved to
   `Disabled/` rather than discarded.

Every preview image in this tab (reference, resized preview, live progress, pass thumbnails,
final output) opens in a zoomable/pannable lightbox on click — scroll to zoom, drag to pan once
zoomed in.

---

## Settings

Click the ⚙ button to open Settings. Sections (click each to expand):

- **Appearance** — theme picker, night/day mode, font size (drag the slider — the gallery and
  panels reflow live), and "Gallery columns" to lock the gallery's column count independent of
  zoom or panel width.
- **Power Tools** — options for the right-sidebar docks.
- **Tagging** — tag-input behavior (e.g. whether typing a new language auto-selects it).
- **Saving** — **Autosave** toggle (off by default): when on, edits save to disk automatically
  ~1.2 seconds after you stop typing. Every edit stays undoable either way — each one is
  already in the Edit Log with its own undo.
- **Performance** — **Hardware acceleration** toggle: on by default, steering this app's own UI
  rendering onto your integrated GPU instead of competing with ComfyUI's real workload on your
  discrete one. Turn it off for pure CPU rendering, or if you'd rather this app use your discrete
  GPU for max smoothness. Takes effect on your next launch.
- **Layout & Panels** — **UI animation mode**: Fade (default), Swipe, or Off. Swipe treats the
  app as one map: tabs sit left to right in tab-bar order, the Gallery's views sit in button
  order inside the Gallery, and images sit in order inside Single view and the image card, so
  every move slides the way you're actually going (Gallery ↔ Tag Overseer only slides the
  right-hand column, since the rest is shared). The image card grows out of the thumbnail you
  opened and shrinks back into it. Arrow-key paging stays instant, and clicking a tab mid-slide
  switches immediately.
  Also has "Reset panel layout" if a dock's drag-reorder/collapse state ever gets into a bad
  state.
- **Updates & Sharing** — "Restart app" instantly reloads the latest files without a manual
  quit/reopen (see [README.md](README.md#updating) for how to actually pull an update first).
  "🩺 Export app state" is a troubleshooting aid, not something you'd normally need — it writes a
  text file next to the app with your settings/theme/panel layout and whether a dataset's loaded,
  useful if you're reporting a bug and want to show exactly what state the app was in.

---

## Themes, Shop & Achievements

26 themes total — 5 free, 21 in the **💰 Shop** (common → legendary, 40–750 Edibits, a small
in-app currency earned from achievements). Each theme is a whole look, not just a palette: its
own typefaces, button and tag shapes, panel materials and textures, and active-tab marker (Terminal
Green is a phosphor CRT, Vintage Paper a letterpress catalogue with index-card tabs, Subway Fresh
transit signage, and so on); the icons restroke to match. The empty space around an image (card
thumbnails, Single view, the image card) gets a faint pattern from the same world, like Studio's
pegboard, Terminal's scanlines or Celestial Gold's star chart. Locked themes are marked 🔒 in
the theme menu; picking one leaves your current theme on and tells you its Shop price.
Epic/legendary themes get an extra
hover-fill button effect and card lift, drawn in that theme's own style; any cheaper theme can
buy them individually via the Shop's **🔨 Refine Theme** button for the price difference.

**🏆 Achievements** (55+, unlocked per-dataset-folder — a fresh dataset starts with none unlocked)
pay out Edibits. Use them to unlock Shop themes by using the app. **🌙 Night mode** is a genuine
per-theme color inversion: it flips each color's lightness, then darkens or lightens any text or
accent that would come out too faint against the new background, so every theme stays readable.

Settings ▸ Appearance has motion-sensitivity controls for all of this: **Suppress Theme
Flourishes** hides the Refine Theme button and turns off the epic/legendary hover-fill/card-tilt
effect everywhere (whether a theme has it natively or you bought it via Refine Theme), while
**Disable hover-fill** / **Disable card hover-tilt** / **Disable ambient animations** let you turn
off just one specific motion effect app-wide if you'd rather keep the others. None of these touch
a theme's static colors, textures, or glows.

---

## Favorites

**★ Favorites** saves frequently-used dataset folders for one-click reopening — separate from the
Datasets tab's own folder list, though pinning a folder there syncs it into Favorites too. Use it
for daily-driver folders.

---

## The Edit Log

Click **📜 Log** to see every logged action for the current dataset, most recent first. Actions
with real tag data (add/remove, merge/void, rename, find-replace, and the Retroactive Merge/Void
dock's own unmerge/unvoid corrections) get their own **↩ Undo this / ↪ Redo this** buttons,
independent of the main toolbar's linear Undo/Redo stack. Disable/Restore actions get a toggle
button instead. Rule-configuration changes (pausing a rule, toggling a child tag, etc.) show up
too, just without an Undo button of their own, since there's no tag-level change to reverse for a
pure setting flip.

**Export log…** saves the full log as JSON. **Clear log** permanently deletes it for this dataset
(confirmed first). Use the log to audit a session or roll back a single change.

---

## Saving your work

The toolbar's dirty counter shows how many images (and, separately, whether the Retroactive
Merge/Void dock has unsaved rule changes) are waiting to be written to disk — click **Save** to
write them all. Closing the app, switching datasets, or reloading with unsaved changes always
prompts you first; nothing is silently discarded.

---

## The mobile app & Comfy Bridge

This guide covers the desktop app. Two siblings share this repo:

- **Osmium Workshop for Android** (`mobile/`) — the same editor in a touch layout: panels
  become bottom sheets, tag editing happens in the image modal (tap a card), Compact and Single
  views are removed, and the folder picker uses Android's own storage access with a persisted
  grant. WD14 tagging runs either on-device (models download on first use) or through your own
  ComfyUI instance like desktop. The in-app ❓ Help is rewritten for touch — read that instead
  of this guide on mobile.
- **Comfy Bridge** (`comfy-bridge/`) — an alternate web UI for accessing the ComfyUI backend,
  featuring a built-in workflow: no node graph to navigate, every generation saves straight to
  disk (desktop: the folder you pick, remembered between launches; mobile: a picked folder or
  `Documents/`). Both builds share the gallery sidebar (browse subfolders, sort by name/date,
  pin favorites), model picker modals, and the zoomable image lightbox. Mobile details live in
  `comfy-bridge/mobile/README.md`; to reach ComfyUI from a phone, start it with `--listen
  0.0.0.0 --enable-cors-header` (ComfyUI already listens on 8188 by default) and allow inbound
  TCP 8188 through the firewall.

---

## Tips & troubleshooting

- **Drag a card onto the Disabled tab** to disable it quickly (hover a card to see this hint).
- **Underscore normalization is one-way** — a tag that ends up with an underscore while editing
  in-app is treated as containing a literal space, by design.
- **Night mode doesn't apply to the Custom theme**, since that's already fully under your control.
- **If a dock's layout looks broken** (stuck collapsed, wrong order), use Settings ▸ Layout &
  Panels ▸ "Reset panel layout."
- **If Tag Details says "no definition found" for everything**, the bundled Danbooru wiki data
  files are missing from your install — redownload the release zip.
- **The window hides Electron's default menu bar** — tap `Alt` to reveal it temporarily.
