// Phase B module: in-app Help & Documentation panel content. Kept as plain
// data (id/title/html per section) so help.ts's rendering logic stays tiny —
// this file is the actual "documentation," help.ts is just the viewer.
//
// The sections are ordered as the real workflow — gather, WD14, prune, rules,
// single pass, sequential pass, bucket, train — so reading the Help top to
// bottom walks you through training a LoRA. The reference sections at the end
// cover the rest of the app. Content is adapted from USER_GUIDE.md (the
// maintainer-facing full guide) — when a feature changes, update BOTH; they
// cover the same ground but this one is trimmed for reading inside a small
// panel rather than a full doc.
export interface HelpSection {
  id: string;
  title: string;
  html: string;
}

const isTouchDevice: boolean = (() => {
  try { return matchMedia('(hover: none) and (pointer: coarse)').matches; } catch { return false; }
})();

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'training-flow',
    title: 'Start here: training a LoRA',
    html: `
      <p>This Help runs top to bottom in the order you actually work. Follow it and you finish with a
      tagged, pruned, bucketed dataset that's ready to train, even with no prior experience.</p>
      <ol>
        <li><b>Gather your dataset</b> — open a folder, add images and captions.</li>
        <li><b>WD14 tag</b> — autotag everything first, so you have something to clean up.</li>
        <li><b>Prune</b> — merge or void tag variants in bulk.</li>
        <li><b>Set Merge/Void rules</b> — standing rules that keep unwanted tags out for good.</li>
        <li><b>Single mode pass</b> — one image at a time; quicktag the case-by-case stuff.</li>
        <li><b>Sequential mode pass</b> — classify technicalities across a filtered batch.</li>
        ${isTouchDevice ? '' : '<li><b>Bucket images</b> — crop and resize every image to a training bucket.</li>'}
        ${isTouchDevice ? '' : '<li><b>Train</b> — run Trainflow on the finished dataset.</li>'}
      </ol>
      ${isTouchDevice ? `<p>On Android the tagging steps are the same; bucketing and training happen on
      your PC.</p>` : ''}
      <p>Before you start, decide which kind of LoRA you're making — it changes what images you
      collect and how much time you spend on steps 3 and 4:</p>
      <ul>
        <li><b>Character</b> — teaches one specific, recognizable character.</li>
        <li><b>Style</b> — teaches a visual art style, not a subject.</li>
        <li><b>Concept</b> — teaches one subject or idea (an outfit, an object, a pose).</li>
      </ul>
      <p><span style="white-space:nowrap;"><b>The three kinds, and why they differ</b> <button type="button" class="info-btn" id="infoGlossaryCharacterLora" title="Character, style and concept LoRAs">ⓘ</button></span></p>
      <template id="infoGlossaryCharacterLoraContent">
        <p>A <b>LoRA</b> (Low-Rank Adaptation) is a small add-on file trained on top of a base
        image-generation model to teach it something new, without retraining the whole model.</p>

        <p>A <b>character LoRA</b> teaches one specific character. Every image shows that same
        character, so their defining traits are visible whether or not a caption mentions them. A
        common technique splits their tags in two:</p>
        <ul>
          <li><b>Void these</b> — traits that should always be true of the character: eye color,
          hair color/style, a mole. With no tag describing the trait, the model only ever sees it
          already there, so it bakes the trait in as part of the character instead of a prompt
          choice.</li>
          <li><b>Keep these</b> — traits that should change from image to image: pose, expression,
          background. These stay tagged, so they remain normal promptable choices.</li>
        </ul>
        <p><b>Watch for a signature outfit.</b> If the character wears the same distinctive outfit
        in most images, that outfit fuses with the character: prompting the character alone may
        pull the outfit in, and prompting the outfit may look like the character. To keep them
        separate, show that outfit on other subjects somewhere in training, or treat the fusion as
        intended for a genuine signature look.</p>

        <p>A <b>style LoRA</b> teaches a visual style instead of a character. The images are
        deliberately varied (many subjects, poses, outfits), so the only constant is the style
        itself. You usually want a wide, varied tag vocabulary kept in here, not pruned out —
        otherwise an incidental subject or pose gets baked in as "just how the style looks".</p>

        <p>A <b>concept LoRA</b> teaches one subject or idea — an outfit, a prop, a pose, a
        lighting look. Every image shows that concept, but the character, scene and pose vary, so
        the concept stays separate from any one subject. Tag the concept consistently and let
        everything else vary.</p>

        <p>This is why Merge/Void see the most use on a character LoRA: cleaning up spelling
        variants and deliberately stripping identity tags are both about controlling exactly what
        gets locked in versus what stays a choice.</p>
      </template>`
  },
  {
    id: 'step-gather',
    title: '1 · Gather your dataset',
    html: `
      <p>Osmium is made for <b>Anima</b> and the booru-tag models around it. Other models work too,
      though the tag conventions and the generation workflow follow that style.</p>
      <h3>What to collect</h3>
      <p>What makes a good dataset depends on the kind of LoRA you're making. These are starting
      targets, not hard rules — quality and variety beat sheer count:</p>
      <table>
        <thead><tr><th>LoRA kind</th><th>How many</th><th>What should vary</th><th>What must stay the same</th></tr></thead>
        <tbody>
          <tr><td><b>Character</b></td><td>20–60</td><td>Pose, expression, outfit, angle, lighting, background</td><td>The same character in every image</td></tr>
          <tr><td><b>Style</b></td><td>30–100+</td><td>Subjects, scenes, poses — everything</td><td>The art style</td></tr>
          <tr><td><b>Concept</b></td><td>20–60</td><td>Character, background, pose, context</td><td>The concept is visible in every image</td></tr>
        </tbody>
      </table>
      <ul>
        <li><b>Resolution:</b> collect images at least as large as the size you'll train at. A
        trainer can't add detail that isn't there — bucketing a small image later just enlarges it
        into blur.</li>
        <li><b>Variety:</b> the more a trait appears in different situations, the less the model
        ties it to one pose or background. This matters most for character and concept LoRAs.</li>
        <li><b>Captions:</b> each image needs a matching <code>.txt</code> beside it with the same
        name (<code>image.png</code> + <code>image.txt</code>). Imports arrive with an empty one,
        and WD14 fills them in step 2.</li>
      </ul>
      <h3>Open or add images</h3>
      <p><b>File ▸ Open dataset folder</b> picks the folder holding your images and captions. Tags
      show with spaces in the app and are saved back with underscores, so you never think about it.
      <b>File ▸ Add images…</b> copies more in, each arriving untagged with an empty
      <code>.txt</code>${isTouchDevice ? ' (you choose which app to pick them from)' : ''}. With no
      dataset open it first offers to create one: name it, choose where its folder goes, and it
      opens ready for the images.</p>
      <h3>What the app writes into your folder</h3>
      <p>None of these touch your images or captions unless you tell them to:</p>
      <ul>
        <li><b>Disabled/</b> — images moved out of the active set. Still editable, just hidden.</li>
        <li><b>_tag_edit_log.json</b> — the undo-able history of every edit you've made.</li>
        <li><b>_dts_canonical_tags.json</b> — your Retroactive Merge/Void rules.</li>
        <li><b>_dts_meta.json</b> — per-image notes, review flags, locks, and similar metadata.</li>
        <li><b>_dts_synthdat_settings.json</b> — SynthDat Overseer's settings (once used).</li>
        <li><b>_dts_achievements.json</b> — achievements unlocked in this dataset.</li>
        <li><b>_dts_subject_presets.json</b> — saved characters (once you save one).</li>
        ${isTouchDevice ? '' : `<li><b>original_images/</b> — originals kept by Bucket Images, shown in the
        🖼 Originals view (once you bucket).</li>`}
      </ul>
      <h3>The Datasets tab</h3>
      <p>Every folder you open is kept there as a clickable icon. Sort by name or time,${isTouchDevice ? '' : ' drag to reorder,'} and
      ${isTouchDevice ? 'tap a folder\'s ⋯ button' : 'right-click a folder (or its ⋯ button)'} to remove it, pin it, view its
      achievements, change its icon, or move it to another tab. Tabs can be password-locked (⋯
      button) — a locked tab re-locks every launch and shows nothing until unlocked, which guards
      against someone briefly opening the app, not a determined attacker with your files.</p>`
  },
  {
    id: 'step-wd14',
    title: '2 · Tag with WD14',
    html: `
      <p>Now give every image a starting set of tags. Open the <b>Tag Overseer</b> tab and use the
      <b>🐍 WD14 Autotagger</b> — it sends your selected images (or a single one, via its 3-dot
      menu) through WD14 and merges the tags it returns onto each card. Select what you want to
      tag in the gallery first, or pick images in the mini-grid on the right.</p>
      <p>Expand "⚙ WD14 settings" to pick the tagging source, model, confidence thresholds, and
      whether results apply automatically or go through a review step first (one card per image:
      new tags tinted, × to drop, type extra tags, untick a card to skip it, optional category
      sort). "Tagging source" is either <b>on-device</b> — the model runs right here,
      ${isTouchDevice
        ? 'hardware-accelerated where your phone supports it, falling back to CPU otherwise'
        : 'with <b>Prefer GPU</b> using DirectML when available and falling back to CPU (the completion toast names which one ran)'},
      no ComfyUI needed; models aren't bundled, so pick one from the built-in catalog for a one-tap
      download or paste a HuggingFace repo — or <b>ComfyUI</b>, which sends images to a WD14 Tagger
      node on your own instance. Either way uses the same review step and settings. Tagging a fresh
      batch into the Gallery is what the prune and rules steps next are for.</p>`
  },
  {
    id: 'step-prune',
    title: '3 · Prune tags',
    html: (isTouchDevice ? `
      <p>Tag Pruner lives in the docked panels along the bottom — swipe left/right to switch
      panels, tap a dock's header to collapse/expand it. <b>✂️ Prune tags</b> opens a full-screen
      browse/select list. Check any tags you want, then either Apply/Void them right there, or
      <b>💾 Save as task</b> to stash that selection and start browsing the next unrelated group
      without losing it — each saved task keeps its own selection and its own Apply/Void, so
      several unrelated groups stay separate.</p>` : `
      <p>Open the docked panels in the Gallery's right sidebar. Drag a dock's header to reorder it,
      click the header to collapse/expand it, or drag its bottom edge to resize. The whole sidebar
      can be dragged wider or tucked away via the arrow at its top.</p>
      <p><b>Tag Pruner</b> — search or browse every tag in the dataset and hand-pick any
      combination to feed into Unify/Void below it. "+ Add another Tag Pruner" opens as many
      independent boxes as you want — each has its OWN selection (a tag picked in one is hidden
      from the others, so several unrelated keyword families can be browsed side by side without
      colliding). Each box's own header also has <b>🔍 Mirror to gallery search</b> (only one box
      can drive the left-hand gallery filter at a time — checking one unchecks any other; it follows the <b>Boolean</b> dropdown, so OR shows every
      image carrying any selected tag) and its
      own <b>Clear</b>, affecting just that box.</p>
      <p><b>Unify/Void</b> — one row per Tag Pruner box that currently has a selection, each with
      its own tag summary and its own Apply/Void. Apply merges that box's selected tags into the
      name you type in; Void permanently deletes them (confirmed first, fully undoable). Both
      actions automatically create or extend a standing rule in Retroactive Merge/Void below, so
      the same correction keeps applying to future tags without you repeating it by hand.</p>`)
  },
  {
    id: 'step-rules',
    title: '4 · Set Merge/Void rules',
    html: `
      <p><b>Retroactive Merge/Void</b> — standing rules: "these tags → this one canonical tag" (a
      merge) or "these tags → nothing" (a void). Whenever a rule's tags show up on a Gallery image
      afterward — by WD14, Master Tags, an accepted SynthDat image, or typing it in — they're
      corrected automatically (a ruled tag typed by hand is corrected on the spot, with a toast
      naming the rule). This only affects Gallery images; Disabled ones are frozen until restored. A rule
      can be paused, or one of its tags turned off individually, without losing anything — both
      actively restore whatever each affected image originally had. Merge rules list one row per
      canonical tag (+ New rule only makes merge rules); below them, one permanent collapsible
      Void box holds every voided tag.</p>
      <p><b>Past Tag Preview</b> — every image also shows the tags a rule took off it, after its
      real tags, as faded "ghost" tags: struck through for a void, with a four-arrows-inward mark
      for a merge (last in their category with Tag sorting on). They're exactly what the image gets
      back if that rule is turned off. Delete one with its × like any tag (undoable), and it won't
      come back. Turn the preview off in Settings ▸ Show Past Tag Preview.</p>
      <p>These are the rules that clean up the WD14 pass for good. For a character LoRA this is
      where you strip identity tags out and merge spelling variants; for a style LoRA you'll touch
      this far less.</p>`
  },
  {
    id: 'step-single',
    title: '5 · Single mode pass',
    html: `
      <p>Now go image by image. Switch the gallery toolbar to <b>Single</b>: one image at a time —
      a compact preview (click it for the full-size view; scroll to zoom, drag to pan) beside a
      roomy tag panel, with the add-tag field under the image. The toolbar folds away for room:
      Grid (and Wiki) sit above the image, and the Prev / "N / total" / Next navigator sits above
      the tags. Type a number into the "N / total" box and press Enter to jump straight to that
      image. <b>Image Quicktagging:</b> while it shows one image, the left panel becomes checkboxes
      for common attributes (hair length, breast size, slim/plump, thick thighs/slim legs, looking
      at viewer/away/to the side). Tick to add, untick to remove; a breast size also adds
      <code>breasts</code> (Flat doesn't), and unticking a size takes <code>breasts</code> off again
      unless another size is still ticked. With only Flat left ticked, <code>breasts</code> is
      removed too. Each category's <b>+</b> adds your own quicktag (kept for every dataset), with
      optional rules: tags it also adds, which of those stay after unticking, tags unticking also
      removes, and tags that untick it. <b>+ Add category</b> adds a category.</p>
      <p>To edit tags: ${isTouchDevice ? 'tap' : 'click'} a chip to open its menu (filter by it, look up its wiki definition,
      flag it for review, explore its keyword family), type into a card's "+ add tag" box and
      press Enter to add one (separate several with commas, e.g. "1girl, red eyes, plump", to add
      them all at once), or ${isTouchDevice ? 'tap' : 'click'} a chip's × to remove it.</p>
      <p><b>🏷 Tag sorting</b> — in ${isTouchDevice ? 'the image modal' : 'Single view and the image modal'}, this pill above
      the tags groups them into labelled categories (Character, Hair, Body, Face, Clothes, Limbs and
      Hands, Sexual, Pose, Scene, Effects, Other) instead of one flat wall. Each category's
      <b>+</b> adds tags right there; a tag that belongs to another category goes there instead,
      and you're told. With it off, tags still
      follow that category order, just without headings (Settings ▸ "Sort tags within each card"
      offers Order added, Alphabetical or By frequency instead). The grouping is a best
      guess from Danbooru tag groups, so the odd tag lands in a neighbouring category. With it on,
      <b>＋ Add character</b> (next to the pill) adds an empty section under Character, named
      Character 1, 2… until you type a name, for multi-character images. Drag a whole category
      heading or single tags into it${isTouchDevice ? '' : ' (or shift-click tags, then "Move tags to:")'};
      drop them back on the main list to take them out. <b>Save</b> keeps that character in the
      dataset, and <b>Load character</b> on another image pulls its tags into a section, with
      the saved tags the image doesn't have shown as dashed <b>+ tag</b> chips to add.
      Sections are saved per image; ✕ removes one and its tags go back to the main list.</p>`
  },
  {
    id: 'step-sequential',
    title: '6 · Sequential mode pass',
    html: `
      <p>Single mode handles composition; Sequential mode is for the technicalities WD14 is
      inconsistent about (perspective especially). In the <b>Tag Overseer</b> tab, use
      <b>▶ Sequential from first / from selected</b> — walk your current filter image by
      image ${isTouchDevice ? 'in a full-screen panel (Back or Exit sequential leaves it)' : 'in Single view'} with a quick-modify panel: text/language (custom languages welcome),
      censorship state + type checkboxes, multi-select perspective checkboxes, monochrome, sound
      effects, comic, multiple views, koma count. The image is the same compact preview as
      Single view (click it for the full-size view). A live tag preview under the image shows
      exactly which tags Confirm will apply before you commit; Confirm advances automatically
      and progress is saved per image. Use it to align indicator tags across a filtered batch.</p>`
  },
  ...(isTouchDevice ? [] : [{
    id: 'step-bucket',
    title: '7 · Bucket images',
    html: `
      <p><b>🧺 Bucket Images</b> (in the Gallery's right sidebar) crops and resizes every Gallery
      image to its nearest LoRA training bucket (Min side / Max side / Step, default 256 / 1024 /
      64), so your trainer doesn't have to. The crop keeps the subject using a saliency model (a
      one-time ~176 MB download, ⬇ button in the dock). <b>Prefer GPU</b> runs it on your graphics
      card with an automatic CPU fallback. Originals are never lost: they move to an
      <code>original_images/</code> folder (browse them via the 🖼 Originals view), and every image
      gets one, even if it's already a valid size. Bucketing again re-makes the copies from the
      originals (try other Min/Max/Step as often as you like). <b>↩ Revert bucketing</b> puts the
      originals back.</p>
      <p><b>Why bucket?</b> Trainers work in fixed-size batches, so every image has to land on a
      size they share. Without bucketing your options are cropping everything square (losing the
      composition) or padding (wasting pixels). Bucketing groups images by aspect ratio and resizes
      each to the nearest standard size, so more of your original framing survives and the model
      spends its pixels on the picture instead of empty borders.</p>
      <p><b>Caveat at low resolution:</b> the bucket is the size the model actually learns at, and
      detail that isn't there can't be trained. Set Min side low and bucketing shrinks images below
      what they contain; a source smaller than its bucket only gets enlarged into blur. Keep the
      buckets at or below your source resolution — around 512–1024 covers most art.</p>`
  }]),
  ...(isTouchDevice ? [] : [{
    id: 'step-trainflow',
    title: '8 · Train with Trainflow',
    html: `
      <p>Trains a LoRA for <b>Anima</b> on the dataset you have loaded. It uses your own
      Anima-TrainFlow folder (the one with <code>python_embeded</code> and <code>training</code>)
      for Python and the trainer, and your own Anima DiT, Qwen3 and VAE files (choose them once;
      the fields start empty). The first time you open a folder, Osmium caches it so Trainflow can
      resolve its real path on its own — it only asks you to point at the folder if that fails.</p>
      <p><b>Start Trainflow</b> is the only thing that begins work: it saves your tag edits, buckets
      the dataset (originals go to <code>original_images/</code>; nothing is redone if the copies
      are already right), checks for an NVIDIA GPU and starts training. <b>Verify buckets</b> lists
      every valid bucket size for the Bucket Images dock's Min/Max/Step and where your images sit.</p>
      <p>Training runs in the background and <b>keeps going if you close Osmium</b>, which warns
      you first. Reopen Osmium and open this tab to see step, speed, ETA, loss, the log, previews
      and checkpoints again. <b>Stop</b> ends the run for good. Results are in the Anima-TrainFlow
      folder under <code>training/output/&lt;project&gt;/</code>. The trigger word is used exactly as typed.</p>`
  }]),
  {
    id: 'gallery',
    title: 'Gallery: views, filtering & editing',
    html: `
      <p>This is the tag editor itself — everything else in the app exists to support what happens
      here. The toolbar at the top of the gallery switches views and holds a few dataset-wide
      actions${isTouchDevice ? ' (swipe it sideways to reach them all)' : ''}:</p>
      <ul>
        <li><b>Grid</b> (the default) — each card shows the image, its tags as editable chips, and
        a 3-dot menu for per-image actions.</li>
        ${isTouchDevice ? '' : `<li><b>Compact</b> — smaller thumbnails, tags appear on hover. Shift-click two images to
        pin them side by side in a comparison table.</li>`}
        <li><b>Single</b> — the pass-five step above, with Image Quicktagging and Tag sorting.</li>
        <li><b>📖 Wiki</b> (next to Asc/Desc) — a small window for looking up any tag's definition.
        Type a tag, pick a suggestion, and its definition shows boxed above the field, with its
        See also tags below (click one to open it). Drag it by its title; it stays open until you
        close it.</li>
        <li><b>❌ Disabled</b> — the images you've moved out of the active set.</li>
        ${isTouchDevice ? '' : `<li><b>🖼 Originals</b> — the pre-bucketing originals kept by Bucket Images. Their tags can be
        edited, but they can't be disabled or restored; Bucket Images' Revert is what moves them
        back.</li>`}
        <li><b>🔢 Rename all</b> — renames every loaded image (+ its .txt) to a simple zero-padded
        1-N sequence (active dataset first, then Disabled, continuing the same count). Confirmed
        first; logged and undoable from the Log panel. WebP images are converted to PNG on the way,
        since WD14 can't read WebP (lossless; undo restores the names but they stay PNG).</li>
        <li><b>🔓 Unlock all</b> — clears the lock on every locked image at once.</li>
        <li><b>Hide tags</b> — hides the chips and add-tag field on every card, so while you sort
        against a filter what's there and what's missing stays obvious. Tags stay editable through
        the image card.</li>
      </ul>
      <p><b>Filtering</b> — the search box on the left supports multiple tags combined with AND /
      OR / XOR / NOT. Type 2 or more characters and a suggestions list appears below the box:
      direct matches first, then other tags that share a word with them (searching "dr" suggests
      "dress" right away, and groups "black dress"/"dress shoes" under a "Same keyword family"
      heading). If you only want an exact match — so searching "dress" doesn't also pull in "black
      dress" — check "Exact tag match" just under the search box. The <b>Boolean</b> dropdown
      under the box picks how your terms combine (default <b>OR</b>: any term matches); tick
      <b>Lock</b> to keep your choice when <b>Clear filter</b> or opening a dataset would
      otherwise reset it to OR.</p>
      <p><b>🚩 Review flagged tags</b> (left panel) swaps the TAGS list for every tag you've
      flagged for review from a chip's menu, across the whole dataset. <b>Reviewed</b> clears
      that flag everywhere at once (undoable); the row stays struck through for the session.
      <b>Flag isolated tags</b> highlights tags on 2 or fewer images — a fast way to spot typos.</p>
      <p>If your gallery's columns keep changing count as you zoom or open a side panel, that's
      expected — Settings ▸ Appearance has a "Gallery columns" option to lock it to a fixed
      number instead.</p>
      <p><b>Locking</b> an image (🔒, in its 3-dot menu) keeps it out of every mass or automatic
      tool — Unify/Void, Master Tags, bulk WD14 — while leaving it fully editable by hand. Use it
      to protect one image from an unattended batch operation without disabling it.</p>
      ${isTouchDevice ? '<p>Tap an image to open it full-size, zoomable/pannable with pinch and drag, with tag editing right there in the same modal.</p>' : '<p>Opening a card image also offers <b>⟲/⟳ Rotate</b> and <b>✂ Crop</b> — pixel edits that rewrite the image file in place (confirmed first, logged and undoable in the Log), with Crop\u2019s Isolate button saving the selected region as a NEW dataset image instead of touching the source.</p>'}`
  },
  {
    id: 'image-menu',
    title: 'The 3-dot image menu',
    html: `
      <p>Every card has a "⋯" button (${isTouchDevice ? 'or long-press the card' : 'or right-click the card'}) with actions for
      that one image.${isTouchDevice ? '' : ` Labels are kept short on purpose — hover any of them for the full
      explanation.`}</p>
      <ul>
        <li><b>❌ Disable / ↩ Restore</b> — move the image to/from Disabled.</li>
        <li><b>❌ Delete permanently</b> — removes the image and its tags from
        disk outright, with no way back. Confirmed first; no undo. Also available as a mass
        action in Master Tag Control. Only removes the copy inside your DATASET folder — if the
        image came from SynthDat Overseer, ComfyUI's own <code>output/</code> folder keeps its own
        separate copy from when it was generated, untouched by this.</li>
        <li><b>🔒 Lock / 🔓 Unlock</b> — see the Gallery section above.</li>
        <li><b>🚫 Merge Immunize / 🟢 Antivoid / ✋ Antimmunize</b> — permanently exempt this one
        image from the Retroactive Merge/Void dock's rules. This is stronger than Lock: Lock only
        skips mass tools, these specifically block the standing-rule system even when you
        deliberately re-trigger it (e.g. by editing a rule). Turning one on gives the image back
        the tags the rules took; turning it off applies the rules to it again right away.</li>
        <li><b>⏮ Reset edits</b> — revert this image back to its earliest known tag state.</li>
        <li><b>🗑️ Remove all tags</b> — clears every tag on this image at once (confirmed first)
        instead of ${isTouchDevice ? 'tapping' : 'clicking'} each chip's own ×. Undoable from the main Undo button.</li>
        <li><b>🐍 WD14 Tag</b> — run the autotagger on just this one image.</li>
        <li>Text/language, comic/koma, review flags, blur, and notes — all write immediately as
        you change them, no separate "Apply" step needed.</li>
      </ul>`
  },
  {
    id: 'master-tags',
    title: 'Bulk edits (Master Tag Control)',
    html: `
      <p>Master Tag Control lives in the <b>Tag Overseer</b> tab, for dataset-wide actions once you
      have tags in place. Select images by ${isTouchDevice ? 'tapping' : 'clicking'} thumbnails in the mini-grid there, or
      by selecting them in the main Gallery first (selection stays in sync either way). The
      mini-grid always shows what the Gallery shows, so switch the Gallery to Disabled${isTouchDevice ? '' : ' or Originals'}
      to pick those images; it updates as soon as the Gallery changes. The selection tools act on
      whatever you selected, while the dataset-wide ones only touch active images. From there
      you can apply or remove a tag across the whole selection, conditionally apply one tag based
      on another already being present (or its own separate row for the inverse — based on it
      being ABSENT), conditionally remove a tag from every image that has another, or run a
      dataset-wide rename or find-and-replace. The
      Lock/Unlock and Merge Immunize/Antivoid/Antimmunize buttons here apply the same per-image
      flags described in the 3-dot menu section, but to your entire selection at once. <b>❌ Delete
      selected permanently</b> removes every selected image and its tags from disk outright
      (confirmed, locked images skipped) — no undo.</p>`
  },
  {
    id: 'synthdat',
    title: 'Making more images (SynthDat Overseer)',
    html: `
      <p>Drives your own local ComfyUI instance to generate <b>more</b> training images of a
      character you've already started a
      <span style="white-space:nowrap;"><b>character LoRA</b> <button type="button" class="info-btn" id="infoGlossaryCharacterLora2" title="Character LoRA vs. style LoRA">ⓘ</button></span>
      on. The idea: your dataset is thin, so instead of hand-posing or hand-drawing more source
      material, you strong-arm that LoRA into new reference poses via
      <span style="white-space:nowrap;"><b>ControlNet</b> <button type="button" class="info-btn" id="infoGlossaryControlnet" title="What ControlNet is doing here">ⓘ</button></span>.
      Requires ComfyUI with a few extra custom nodes installed —
      ${isTouchDevice
        ? `this ComfyUI instance is the one running on your PC (SynthDat still runs generation
        there; only the tagging half can run on-device), so grab the node bundle from this
        project's own GitHub repository — the <code>ComfyUI-dependencies</code> folder there has a
        README covering exactly what's needed and why.`
        : `see <code>ComfyUI-dependencies/README.md</code> in the app's own folder for exactly what
        and why.`}</p>
      ${isTouchDevice ? '' : `<p><b>You don't have to keep ComfyUI running.</b> In the ComfyUI
      connection section, set <b>Run on</b> to <b>Osmium Comfy</b> and choose your
      ComfyUI folder once. Osmium then starts that install itself when you click Connect, in its
      own console window, and loads only what this workflow needs, not your other custom nodes.
      Use it instead of your usual ComfyUI, not alongside it. Reference interrogation then runs
      on-device, so set Tag Overseer's WD14 Autotagger to On-device.</p>`}
      <template id="infoGlossaryCharacterLora2Content">
        <p>A <b>LoRA</b> (Low-Rank Adaptation) is a small add-on file trained on top of a base
        image-generation model to teach it something new without retraining the whole model.</p>

        <p>A <b>character LoRA</b> teaches it one specific, recognizable character. A common
        technique: Void the tags for traits that should ALWAYS be true of that character (eye
        color, hair color, etc.) out of every caption entirely, instead of tagging them — with no
        tag ever describing the trait, the model can only learn it as permanently part of the
        character, not something the prompt controls. Tags for what SHOULD vary per image — pose,
        outfit, expression — stay in, so those remain normal promptable choices.</p>

        <p>One catch: a distinctive outfit the character wears in most/all training images (a
        signature look) tends to fuse with the character concept regardless — the model rarely
        sees it on anyone else, so the two become hard to separate later.</p>

        <p>See the "Start here" section for the fuller version of this, including how to avoid that
        fusion, and how it compares to style LoRA training.</p>
      </template>
      <template id="infoGlossaryControlnetContent">
        <p><b>ControlNet</b> is a way to make an image generation follow a specific structure —
        here, a pose — instead of leaving pose entirely up to the prompt and chance.</p>

        <p>It looks at your chosen reference image, extracts pose/structure information from it,
        and steers the generation to match that structure while the LoRA still supplies the
        character's actual appearance. In effect: the reference image controls the POSE, the LoRA
        controls WHO's in it.</p>

        <p>"Strength" controls how rigidly the pose is enforced. Start %/End % control which
        portion of the generation process ControlNet stays active for, since enforcing it for the
        whole process can make results look too rigid or copied.</p>
      </template>
      <p><b>The flow:</b></p>
      <ol>
        <li>Pick a reference pose image, or skip this entirely (check "I don't want to use a
        reference image") for an ordinary prompted generation with no ControlNet.</li>
        <li>WD14-interrogate it to pull tags from the reference, then hand-assign the ones that
        matter (pose, limbs, etc.) into their prompt fields — open them via the "‹ 📝 Prompt fields"
        edge tab (docked to the right, reachable regardless of scroll); close it with its own ›
        arrow or by clicking outside it.</li>
        <li>Fill in the rest of the prompt fields — Global (Main LoRA trigger word), Character
        Trigger, and Negative always stay visible; check "Use a single unified prompt box" to paste
        one ready-made prompt instead of splitting it across the rest. A ⇄ button next to
        Width/Height swaps the two instantly. Set your generation parameters in the Generation
        section (sampler, seeds, steps, CFG — "Enable 2nd pass" runs an optional refinement pass
        and lets you pick between both results before deciding), then ${isTouchDevice ? 'tap' : 'click'} ▶ Generate. ⏹ Stop
        interrupts a run in progress.</li>
        <li>Review the result — "🐍 Re-interrogate output with WD14" checks what the model actually
        drew, since it sometimes adds details nobody prompted for. ${isTouchDevice
          ? 'Tap a tag\'s × on the "pending" tag card to drop it from just this image, and tap a merge suggestion to fold it into your dataset\'s existing canonical spelling.'
          : `Prune anything you don't want from the "pending" tag card; it also suggests merges based
        on your existing Retroactive Merge/Void rules. Right-click a tag for <b>📖 Definition</b> or
        <b>🚫 Mark as void</b> — voiding drops it from this image AND adds a Retroactive Void rule
        for it on Accept, so import tags (artist, rating, trigger words) get stripped without
        re-running WD14.`}
        A tag already covered by an existing void rule shows struck through automatically,
        previewing what Accept will drop.</li>
        <li>✅ Accept writes the image and its tags straight into the dataset as a normal unsaved
        edit (tags are written to disk immediately too, so a crash before your next Save can't lose
        them) — check "Rename this image to match dataset conventions?" first if this dataset
        already uses simple numbered filenames, to pick up the next number instead of the default
        synth_&lt;timestamp&gt; name. ❌ Reject sends it straight to Disabled instead. Either way,
        nothing generated is ever silently thrown away — even the pass you didn't pick, if you ran
        2-Pass, is saved to Disabled rather than discarded.</li>
      </ol>
      <p>Every preview image in this tab opens in a zoomable, pannable lightbox on ${isTouchDevice ? 'tap' : 'click'}.</p>`
  },
  {
    id: 'stats-tab',
    title: 'Editing Stats tab',
    html: `<p>Animated charts (pick pie or bar) of every logged action by type, plus summary cards
      for total edits, undo/redo stack depth, and achievements unlocked so far.</p>`
  },
  {
    id: 'settings',
    title: 'Settings',
    html: `
      <p>${isTouchDevice ? 'Tap' : 'Click'} the ⚙ Settings button (next to File in the top bar) to open it. Each section below
      expands on ${isTouchDevice ? 'tap' : 'click'}:</p>
      <ul>
        <li><b>Appearance</b> — ${isTouchDevice ? '' : 'the font-size slider (the whole gallery and panels reflow live as you drag it), '}"Gallery
        columns", the tag-count badge on cards, <b>Show Past Tag Preview</b>, "Sort tags within
        each card", ${isTouchDevice ? '' : '"Dynamic card heights", '}<b>Discrete mode</b> (blur every image for privacy),
        and the motion controls described under Themes. The theme itself is picked from the
        <b>Personalization</b> menu in the top bar, and night mode is the 🌙 button next to it.</li>
        <li><b>Power Tools</b> — highlight the power tools (Master Tags, Tag Pruner, Unify/Void,
        mass-apply, Purge) with an outline or fill, and mark any other field or button as a power
        tool so it gets the same highlight.</li>
        <li><b>Tagging &amp; Autocomplete</b> — tag autocomplete while typing "+ add tag"${isTouchDevice ? '' : ', hover tooltips and their delay'}, and
        whether adding a language in the "Has text" picker also selects it.</li>
        <li><b>Saving</b> — Autosave (off by default): when on, edits save to disk automatically
        about 1.2 seconds after you stop typing. Every edit stays undoable either way — each one
        is already in the Edit Log with its own undo.</li>
        ${isTouchDevice ? '' : `<li><b>Performance</b> — Hardware acceleration (on by default) steers this app's own UI
        rendering onto your integrated GPU instead of competing with ComfyUI's real workload on
        your discrete one. Turning it off forces pure CPU rendering. Takes effect on your next
        launch.</li>`}
        <li><b>Layout & Panels</b> — whether menus and popups close when you ${isTouchDevice ? 'tap' : 'click'} off them, whether a
        dropdown closes after you pick an option, UI animation mode (Fade/Swipe/Off; Swipe treats
        the app as one map, so tabs, views and images slide the way they actually sit), and "Reset
        panel layout" if a dock's ${isTouchDevice ? 'collapse state ever gets stuck' : 'drag-reorder or collapse state ever gets into a bad state'}.</li>
        ${isTouchDevice ? '' : `<li><b>Updates & Sharing</b> — "Restart app" reloads the latest files instantly, no manual
        quit/reopen needed. "🩺 Export app state" isn't something you'd normally need — it's a
        troubleshooting aid that writes a text file next to the app with your current settings,
        theme, panel layout, and whether a dataset's loaded, useful when reporting a bug.</li>`}
        <li><b>Danger Zone</b> — "Purge ALL tags in this folder…" empties every Gallery image's
        caption (Disabled ones are left alone). It takes three ${isTouchDevice ? 'taps' : 'clicks'} in a row to confirm, and Undo
        reverses it.</li>
      </ul>`
  },
  {
    id: 'themes',
    title: 'Themes, Shop & Achievements',
    html: `
      <p>26 themes in total — 5 free, 21 in the 💰 Shop (common through legendary, priced in
      Edibits, a small in-app currency you earn from achievements). Each theme is a whole look,
      not just a palette: its own typefaces, button and tag shapes, panel materials, and active-tab
      marker, with the icons restroked to match. Even the empty space around an image gets a faint
      pattern from the theme's world. Locked themes show 🔒 in the theme menu: picking one keeps your
      current theme and tells you its Shop price. Epic/legendary themes get an extra hover-fill and
      card lift in that theme's own style; any cheaper theme can buy them individually via the
      Shop's "🔨 Refine Theme" button, for the price difference.</p>
      <p>🎨 <b>Theme Studio</b> (Personalization ▸ Theme Studio) builds your own Custom theme:
      colors, fonts per role, shapes, icon stroke, button fill and card hover, dock pads, gallery
      ground, image mat, active-tab marker, top-bar edge and primary buttons, with a live miniature
      of the app on the right (switch its tab with the buttons under it; hover it to try effects).
      "Start from" copies any theme you own; Import/Export share themes as .theme.json files.
      Fills and card hovers are epic/legendary-tier: preview free, and keeping one costs that tier's
      price in Edibits, once. <b>My themes</b> keeps every Custom you save (switch between them from
      the theme menu too); Colors ▸ Palette ▸ Night sets Custom's night colors (automatic or
      hand-edited); a red contrast ratio is clickable to fix it; and <b>Hold to compare</b> under the
      preview shows your current theme for a moment.${isTouchDevice ? ' On a phone it opens as a full-screen sheet with the preview on top.' : ''}</p>
      <p>🏆 Achievements (55+, unlocked per dataset folder — a fresh dataset starts with none
      unlocked) pay out Edibits as you use the app's features. 🌙 Night mode is a genuine per-theme
      color inversion that also keeps every text and accent color readable.</p>
      <p>Settings ▸ Appearance has motion-sensitivity controls: <b>Suppress Theme Flourishes</b>
      hides the Refine Theme button and turns off epic/legendary-tier hover-fill/card-tilt
      everywhere — whether a theme has it natively or you bought it via Refine Theme. Three
      independent toggles (<b>Disable hover-fill</b>, <b>Disable card hover-tilt</b>, <b>Disable
      ambient animations</b>) let you turn off just one specific motion effect instead of all of
      them. None of these touch a theme's static colors, textures, or glows. <b>Scroll the
      gallery background slowly</b> is the one option that adds motion (off by default): the
      theme's background pattern behind the gallery drifts gently. Glows and Solar Flare's rings
      stay still, and Disable ambient animations pauses it.</p>
      <p>When the app opens, a short <b>opening flourish</b> plays in your theme: a sweep of the
      theme's colour carrying its own version of the Osmium mark, trailing the theme's particles as
      it leaves. ${isTouchDevice ? 'Tap' : 'Click or press any key'} to speed it up, or turn it off
      with <b>Disable opening flourish</b> in Settings ▸ Appearance. With your system's "reduce
      motion" setting on, it's a brief fade instead.</p>
      ${isTouchDevice ? '' : `<p><b>App icon</b> (Settings ▸ Appearance): use the default Osmium icon
      or any theme you own as the app's taskbar icon. It stays put when you switch themes.</p>`}`
  },
  {
    id: 'favorites',
    title: 'Favorites',
    html: `<p>★ Favorites saves frequently-used dataset folders for ${isTouchDevice ? 'one-tap' : 'one-click'} reopening — separate
      from the Datasets tab's own folder list, though pinning a folder there syncs it into
      Favorites too.</p>`
  },
  {
    id: 'edit-log',
    title: 'The Edit Log',
    html: `
      <p>${isTouchDevice ? 'Tap' : 'Click'} 📜 Log to see every logged action for the current dataset, most recent first.
      Actions with real tag data (add/remove, merge/void, rename, find-replace, and the Retroactive
      Merge/Void dock's own unmerge/unvoid corrections) get their own ↩ Undo this / ↪ Redo this
      buttons, independent of the toolbar's main linear Undo/Redo. Disable/Restore actions get a
      toggle button instead, and deleting a past (ghost) tag is undoable too. Rule-configuration
      changes (pausing a rule, toggling a child tag off) show up without an Undo button — there's
      no tag-level change to reverse for a pure setting flip. So do <b>Rules applied</b> rows, where
      a standing rule corrected tags by itself; to reverse one, pause that rule.</p>
      <p>"Export log…" saves the full log as JSON. "Clear log" permanently deletes it for this
      dataset (asks first).</p>`
  },
  {
    id: 'saving',
    title: 'Saving your work',
    html: `<p>The toolbar's dirty counter shows how many images (and, separately, whether
      Retroactive Merge/Void has unsaved rule changes) are waiting to be written to disk —
      ${isTouchDevice ? 'tap' : 'click'} Save to write them all. Closing the app, switching datasets, or reloading with unsaved
      changes always asks first; nothing is silently discarded.</p>
      ${isTouchDevice ? `<p>Leaving with the phone's Back button asks first too (and says if anything is unsaved).</p>
      <p><b>⚠ Except force-closing the app</b> — swiping it away in Android's
      recent-apps view kills the app outright, with no chance for that warning (or anything else)
      to run first. Unsaved changes from that session are lost with no way to recover them.
      Save (or turn on Autosave, Settings ▸
      Saving) before switching away if you're not sure you'll come back to this same session.</p>` : ''}`
  },
  {
    id: 'tips',
    title: 'Tips & troubleshooting',
    html: `
      <ul>
        ${isTouchDevice
          ? `<li>The phone's <b>Back</b> closes whatever's on top first — a menu, a dialog, a panel, the
        image card — then steps back through the tabs you visited, and only asks to leave the app
        once you're back on the Gallery with nothing open.</li>`
          : `<li>Drag a card straight onto the ❌ Disabled button in the gallery toolbar to disable it quickly.</li>`}
        <li>Underscore-to-space conversion only goes one way — a tag that ends up with an
        underscore while you're editing in-app is treated as containing a literal space, by
        design.</li>
        <li>If a dock's layout looks broken (stuck collapsed, wrong order), use Settings ▸ Layout &
        Panels ▸ "Reset panel layout."</li>
        <li>If Tag Details says "no definition found" for everything, the bundled Danbooru wiki
        data files are missing from your install — redownload the release zip.</li>
      </ul>`
  }
];
