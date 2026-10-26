# Patch notes

Every release of Osmium Workshop (called Dataset Tag Studio up to v1.5.0), newest first. Comfy
Bridge ships in the same releases from v1.5.0 on. Downloads are on the
[releases page](https://github.com/Valteil/osmium-workshop/releases).

- [v2.0.0](#v200) · [v1.9.5](#v195) · [v1.9.0](#v190) · [v1.8.0](#v180) · [v1.7.0](#v170) · [v1.6.5](#v165) · [v1.6.0](#v160) · [v1.5.5](#v155) ·
  [v1.5.0](#v150) · [v1.4.0](#v140) · [v1.3.0](#v130) · [v1.2.0](#v120) ·
  [v1.1.5](#v115-tauri--discontinued) · [v1.1.0](#v110) · [v1.0.0](#v100)

---

## v2.0.1 (unreleased)

### Comfy Bridge

- **Regional prompt** (new **Regional** tab, desktop and phone; it replaces the ControlNet tab and
  its pose editor): draw boxes over your image and give each one its own prompt, so you choose what
  goes where (two characters side by side, a prop in a corner). The boxes steer the first part of
  the steps, then the whole picture is finished as one image. Every text field shows where it goes:
  **Style** (your Global field: artist tags and style-LoRA triggers) goes into every box, so a
  style LoRA looks the same everywhere; **Scene** (the setting) surrounds the boxes, whose edges
  blend into it; a character LoRA's trigger goes in that
  character's box; **Whole picture only** takes counts
  like `2girls` without every box drawing two. Ready-made layouts, duplicate, undo/redo, a
  strength and a **spread** per box (a small box can mean "roughly here" instead of "exactly this
  big"), a choice of what wins where boxes overlap, the last result shown behind the boxes, and
  every blending setting. **Generate** right from the tab, or **Use in Generate**: the Generate
  tab's prompt boxes are swapped for the layout until you go back. A short **How to use** guide is
  built into the tab. Regional images bring their layout back with Import Generation. For Anima
  models; with your own ComfyUI server, update the ComfyUI-DataSetManagerNodes pack (Osmium Comfy
  has it built in).
- **USDU upscaling frees VRAM:** the generation models are unloaded before Ultimate SD Upscale
  starts (when generating with USDU on, and in the Upscale tab), and the upscale models are
  unloaded before your next generation, so the two never sit in VRAM together. With your own
  ComfyUI server, update the ComfyUI-DataSetManagerNodes pack for the first half.

---

## v2.0.0

### Osmium Workshop

- **Transfer tags:** right-click an image (or use its 3-dot menu) and pick **Transfer tags** to copy
  some or all of its tags onto other images. Untick the tags you don't want, pick the target
  images from the grid, and it adds them (undoable). Tick **Also swap image names** with one
  target picked to trade the two images' file names as well.
- **Bucketing copies tags onto the originals:** Bucket Images and Trainflow's Start now overwrite
  each original's tags with the tags of its active image, even when every image is already
  bucketed.
- **Quicktags take less room:** in Single view, a category's checkboxes sit side by side when
  they fit the panel, each only as wide as its label, instead of one long list. Right-click
  one of your own quicktags to edit or delete it.
- **Fixed:** deleting an image for good now deletes its original in `original_images/` too. Before,
  the leftover original made a later Rename all fail partway, and the next bucketing brought the
  deleted images back with their old tags while wiping the tags of some you kept. Rename all also
  moves a leftover original out of the way when it sits on a number it needs.
- **Fixed:** after disabling images in a bucketed dataset, Trainflow's Start (and Bucket Images)
  re-made the disabled images from `original_images/` back into the dataset, without captions, so
  Start stopped with "N images have no .txt caption". Disabled images now stay disabled.
- **Single view is now where Sequential lives** (desktop): Quicktags on the left, the image and
  its tags in the middle, and the Sequential controls in the right panel. Every tick applies to
  the image right away (undoable); step through with Prev / Next. The button at the top of the
  right panel switches to the Gallery tools and back. Tag Overseer is only in the gallery views
  (its tab switches Single view back to Grid). "Sequential from first" is gone, and "from
  selected" and the 3-dot "Sequential from here" are now **Single from here**.
- **Quicktags can be reordered:** drag the ⋮⋮ handle on a quicktag (within or between
  categories) or on a category header. Built-in ones too.
- **Sequential mode's Perspective:** "Front" is now **Straight-on** (writes `straight-on`), plus a
  new **Facing viewer** (`facing viewer`) and **Looking at viewer** (`looking at viewer`). "From
  front" is retired as ambiguous; images that already have it keep it. The 🧭 Perspective indicator counts the new tags.
- **Windows 7** theme (legendary, 750 Edibits): the Aero desktop. A glass title bar with its gloss
  line, Explorer's command bar whose tabs light up as blue glass, grey two-tone buttons that take
  the blue hover quickly and let it fade slowly, a default button that gently pulses in dialogs,
  green progress bars with a running glint, glass-framed dialogs, Harmony-blue behind the gallery,
  and the boot screen's four coloured lights in the opening flourish. It uses Segoe UI on Windows
  and Selawik (Microsoft's open look-alike, now bundled) elsewhere.
- **Frutiger Aero** theme (epic, 360 Edibits): glossy aqua jelly buttons, grass-green active
  states, and a sky-over-hillside gallery. In night mode the buttons' gloss turns
  over. **Settings ▸ Frutiger Aero background ▸ Choose image…** sets any picture as its gallery
  wallpaper.
- Both themes' gallery backgrounds are wallpapers, so **Scroll the gallery background** leaves
  them still.
- **Trainflow tab** (Windows): trains a LoRA for Anima on the dataset you have loaded, using an
  Anima-TrainFlow folder and your own Anima files. Get the trainer from this release
  (`Anima-TrainFlow-Osmium-2.0.0.zip`): unzip it and run its `Install_Requirements.bat` once, which
  downloads the Python packages (about 5 GB) at the versions Trainflow is tested with. **Start Trainflow** buckets the dataset and
  starts training in the background. It keeps going if you close Osmium (which warns you first), and
  the tab reconnects to its progress, log, previews and checkpoints when you come back. Trains on
  **Janima** too, not just base Anima. An **Advanced** section opens up the trainer's settings for
  those who want them (network alpha and dropout, training the text encoder, precision, LR schedule,
  timestep sampling, VRAM options and more); left alone, it trains exactly as before. **Clear
  training cache** deletes the latent and text-encoder caches the trainer keeps in the dataset, which
  it would otherwise reuse even after you change images or tags.
- **LoKr and LoHa in Trainflow**, next to LoRA. LoKr packs much richer changes into a quarter of the
  file at the same rank, which is popular for art styles. **LoRA+** (a ratio in Advanced) makes one
  half of each layer learn faster, often reaching the same result in fewer steps. Also new: more optimizers (Prodigy +
  ScheduleFree, AdamW ScheduleFree, Lion8bit, Adafactor), per-block torch.compile, checkpoint offloading
  to save VRAM, split attention, training the modulation layers, tag shuffling and tag
  dropout, a validation split with its own validation loss, and extra image folders trained alongside
  the dataset.
- **Newer trainer:** the bundled Anima-TrainFlow trainer is updated to sd-scripts v0.12.0.
- **Continue training**: if a run stopped short of what you wanted (step 600 isn't quite there),
  pick one of its checkpoints and train on from it instead of starting over. Any checkpoint can be
  trained further from its weights, saved under a new name. Turn on **Resume state** and later runs
  can also be resumed exactly, optimizer and learning-rate schedule included, with the step count
  carrying on.
- **Bucket Images keeps an original of every image** in `original_images/` (Initial State is Originals
  again, and `initial_state/` folders are merged into it), and bucketing again re-makes the copies from
  the originals, so you can try different dimensions as often as you like.
- **Bucket sizes are remembered per dataset** and start at 512 to 1024 (step 64). Set them in the
  Bucket Images dock or right in the Trainflow tab; both show the same values. A **Training size**
  picker sets them for you: ≈512 (fast, less detail), ≈640 (the default) or ≈1024 (more detail,
  slower), with a line saying what a 2:3 and a square image will train at.
- **WD14 review window, rebuilt**: tagging a batch in Tag Overseer with "Apply automatically" off now
  shows one card per image. Each card keeps its picture on the left and its own tag area on the
  right, with the tags WD14 added tinted so they stand out from the ones already on the image. Drop
  any tag to the "Dropped" row and click it to put it back, or type in more. A **Tag sorting**
  button groups each card's tags by category, and you can apply one image, apply all of them, or
  skip all.
- **Edit Log upgrades**: filter by edit type, flip between newest and oldest first, and page through
  the whole log. A bulk edit opens a list of every image it touched, each with its own undo/redo and
  a thumbnail you can open, and right-clicking an image in the gallery shows **every edit made to
  that image**, undoable one by one.
- **Attention setting** for Osmium Comfy (SynthDat Overseer): auto, Flash, Sage, xformers or plain
  PyTorch attention. Auto picks Flash Attention when it's installed.
- **Delete several tags at once**: Tag Overseer has a new **Delete tags** list with every tag in the
  dataset and how many images have it. Tick as many as you want and **Delete from all** takes them
  off every image in one go, and one Undo brings them back. Unlike Void it doesn't set up a standing
  rule.
- **Curate tab**: go through a folder of new images before they go into a dataset. See them all as
  a grid, or one at a time with the arrow keys, and click to zoom in. Select the keepers and add
  them to the open dataset (captions come along) or start a new dataset with them. **Artstyles**
  sort an artist's different styles into their own folders so they never get mixed in one
  dataset: **Create Artstyle**, then **Assign to** it. A red **junk** folder takes the images
  you're throwing out.
- **Isolate (Split)** (Windows, in the image card's Crop): cut a character sheet or a page of
  panels into separate images. Pick how many vertical and horizontal lines you want (mix them for
  a grid), drag each line where it should cut, or **Reset lines** to space them evenly. Every
  piece is saved as a new image with the original's tags, the original stays as it was, and one
  Undo takes all the pieces back out.
- **Trainflow: retraining a trigger word starts a new folder** (`<name>_2`, `_3`, …, with the LoRA
  named the same) instead of mixing into the last run's folder, so there's nothing to delete first.
  Continue training lists checkpoints from all of them.
- **Trainflow: Send a checkpoint** to a folder of yours (ComfyUI's `loras`, say) under a name you
  choose, with a favorite folder that's remembered. Nothing already there is overwritten.
- **Fixed: Undo/Redo and the Log getting out of step.** Undoing an older edit from the Log no longer
  wipes the tag changes you made after it; only that edit is reversed. After **Rename all**, Undo
  and the Log's buttons follow the images to their new names instead of acting on whatever image now
  has the old name. A step that was already undone from the Log no longer blocks Undo for older
  steps. Clearing the log no longer breaks undoing crops, rotates and splits. **Undoing a Merge or
  Void** now actually sticks: the tags it merged or voided are paused in its standing rule (which
  used to re-apply it on the spot), and Redo turns them back on.
- **Fixed: Rename all could delete images.** If a rename stopped partway, the files were left with
  temporary `__dts_rename_tmp_…` names, and running Rename all again could delete some of them.
  Rename all now checks every file first, puts everything back if it stops partway, and never
  overwrites or deletes a file by renaming it onto a name that's already taken. **Revert bucketing**
  no longer deletes the bucketed copy when the original can't be read.

### Comfy Bridge

- The **Windows 7** and **Frutiger Aero** palettes and faces.
- **ControlNet tab: a pose editor for the reference image** (desktop and phone). **Extract pose**
  (DWPose, needs the comfyui_controlnet_aux node pack), **New pose** or **Edit pose** from the
  reference section open it, and every edit becomes the reference image. Pose a **mannequin**
  (limbs, hands with fingers, head, feet; what Anima's any-test LLLite follows, since it reads the
  reference as a picture) or an **OpenPose skeleton**. Drag points (attached parts follow), drag the
  torso to move a person, click a body part to resize it for perspective (or use the mouse wheel),
  and shape the figure with Body width, Chest and Length. Mirror, Reset, more people, and the
  original shown dimmed behind the pose.
- **Open folder** (Windows): an **Open** button next to the output folder, and next to the Upscale
  tab's chosen folder, shows it in File Explorer.
- **RES4LYF samplers**: if the RES4LYF node pack is installed in your ComfyUI, its samplers
  (`res_2m`, `res_2s`, `res_3s` and the rest) appear in the Sampler picker after the usual ones,
  marked `res4lyf:`, along with its `beta57` and `bong_tangent` schedulers.
- **Gallery tab** (Windows and Android): your generations in a big grid; click one to open it
  (zoom, arrow through the rest, see its settings). A folded **Compare** section above it lines
  images up side by side: Shift-click a gallery image (long-press on the phone) to add it to a
  slot, as many as you like. Click a slot to show it on the left, right-click to show it on the
  right. **Side by side**: click an image to zoom it, Shift-click it and its prompt slides up
  beside it while the pair moves over to make room. **Overlay**: the two images stacked; drag
  the slider under them to fade the top one in and out and spot the differences (or turn the live
  preview off and press and hold to see through instead). Animated throughout, with an
  **Animations** switch to turn the motion off.
- **The gallery panel remembers where you were**: closing it keeps the folder and scroll position.
- **Upscale with USDU** (Windows and Android): Ultimate SD Upscale as the other choice next to the
  normal upscale. It upscales the image you generate (the pass 2 image when 2-Pass is on), and any
  image you already have gets its own **Upscale** tab: choose the image, see it large beside the
  settings (click it to zoom in), and press Upscale this image. The result can go to your output
  folder or to any folder you choose. It redraws the image tile by tile with its own
  checkpoint, so you get real added detail. Every setting is there with a tooltip, and the tiles' prompt can be the image's own prompt
  (with or without your Global field), WD14 tags, or text you type. Needs the
  ComfyUI_UltimateSDUpscale node pack.
- **WD14 tags** (Windows and Android): tag the images your last generation saved, with a .txt
  caption next to each one if you want, or tag any image you pick and use its tags as your prompt.
  On Windows the .txt can go right next to the picked image. Needs the ComfyUI-WD14-Tagger node
  pack.

- **Metadata tab** (Windows and Android): open any image to see how it was made and which LoRAs it
  used. Each LoRA can be looked up on **CivitAI** and **CivArchive** (by its file hash when you have
  it, otherwise by name), with preview images, and added to your LoRA stack in one click when it's
  in your folder.
- **LoRA training metadata** (Windows and Android, in the Metadata tab): see what a LoRA was trained
  with, laid out like Xypher7's LoRA Metadata Viewer: base model, network type and dim/alpha,
  optimizer and learning rates, epochs and steps, training time, noise settings, the dataset folders
  with their image and repeat counts, and the training tags per folder with a filter and a "copy top
  20" button, plus every raw key. Pick one of your LoRAs; on the phone your PC reads the file from
  its loras folders. On Windows you can also open any .safetensors file from disk.
- **Download to PC** (Windows, with Osmium Comfy): a looked-up LoRA can be downloaded straight into
  your ComfyUI loras folder, with a choice of mirrors, a folder browser and a new file name. Files
  are checked against the looked-up hash, and API keys for CivitAI and Hugging Face are saved under
  **Download keys** and only ever sent to their own site.
- **Import from any image**: Import Generation now reads images made outside the Bridge too
  (Automatic1111/Forge, NovelAI, InvokeAI, SwarmUI, Fooocus and other ComfyUI workflows), from PNG,
  JPEG or WebP. It shows the image's details first, with **Import Generation** and **Use prompts
  only**. A single prompt is sorted into the prompt boxes by tag type, and switching between one box
  and separate boxes carries the prompt over. Images from other tools bring their prompts and basic
  settings, never their models.
- **Phone access can require a shared token** (Windows): the "Let the phone app use it" row has an
  optional token field next to the port. Leave it empty for the old no-password LAN/Tailscale
  behaviour; set one and the phone must enter the same token (a field above its Test connection
  button) before it can use this PC. The status line says plainly when no token is set.
- **Main LoRA is now optional.** Leave it empty and generation runs normally with no LoRA, even on a
  machine that has none installed. The Main LoRA weight only applies when a LoRA is chosen.
- **Friendlier default settings:** CFG 4, 25 steps, 1024×1024, sampler Euler A, scheduler Simple,
  seed 0; pass 2 starts at seed 1 with 20 steps.
- **Seed behaviour dropdown** next to each seed: **Fixed** (the default) reuses the number you
  typed, **Randomize** rolls a new one each generation, and **Increment** / **Decrement** step it by
  one. The mode applies per queued generation, so a queued batch walks the seed.
- **In-app Help** (Windows): the ❓ Help button left of the Wiki button opens plain-language guidance
  for every setting, one section at a time, in the same layout as Osmium's Help panel.
- A **Clear all prompt fields** button empties every prompt box in one click, in either prompt mode,
  along with the Character trigger. The Negative box is left alone.
- **Attention setting** for Osmium Comfy, the same as in Osmium.
- Windows: you can **reorganize a generated image from the gallery.** Open its details panel in
  the lightbox and under Save details it shows what the image was saved under and includes the
  full File Namer options for the move, seeded from the image itself: reclassify as OC, pick a
  different character, or respec the filename (add the model, sampler, seed and the settings it
  was actually made with). Moves never overwrite anything already in the destination folder.
- **"Use these prompts"** next to "Use these settings" in an image's details loads only its prompt
  fields and leaves everything else as it is.

### Comfy Bridge for Android

- **The File Namer works on the Android app too.** Under Generation settings, File saving
  chooses where phone generations go: an automatic rating folder, a Character folder (Tag list
  with Danbooru search suggestions, all OCs in one folder, or a custom name), and which parts the
  filename carries — the same scheme the Windows app uses, with a live preview of the full path.
- **The phone can browse the PC's output folder** (over Tailscale/LAN): a Phone | PC switch at the
  top of the gallery, with the PC side navigated like the desktop. The PC's grid loads small
  thumbnails and only an opened image is fetched at full size, so browsing stays light on data, and
  each opened PC image shows its generation parameters with "Use these settings" and "Use these
  prompts". With **Persist Comfy** on, it works even while the Bridge itself is closed.
- **Find PC**: a button next to Test connection searches your Wi-Fi network for a PC sharing Osmium
  Comfy and connects to it (it searches the port in the box beside it, 8189 by default).
- **Recent connections**: every address that connects is remembered with its token, so a dropped
  link is one tap to reconnect.
- **Flaky links recover on their own**: lost or silent requests are retried, and thumbnails load
  several at a time, so one lost reply no longer holds up the rest.
- **Reference images pick reliably**: the preview shows the picked image itself, re-picking the same
  image works, and a slow reply after an upload waits up to a minute before giving up. Upload
  failures say how much of the image had been sent.

---

## v1.9.5

Osmium Workshop and Comfy Bridge for Windows, plus the Comfy Bridge Android app.

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

`ComfyBridge-1.9.5-android.apk`. It also gets the Back button, gallery and font changes above.

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
