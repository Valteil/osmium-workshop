// Phase B module: in-app Help & Documentation panel content. Kept as plain
// data (id/title/html per section) so help.ts's rendering logic stays tiny —
// this file is the actual "documentation," help.ts is just the viewer.
// Content is adapted from USER_GUIDE.md (the maintainer-facing full guide) —
// when a feature changes, update BOTH; they cover the same ground but this
// one is trimmed for reading inside a small panel rather than a full doc.
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
    id: 'opening',
    title: 'Opening a dataset',
    html: `
      <p><b>File ▸ Open dataset folder</b> and pick the folder with your images and their matching
      <code>.txt</code> caption files (same name, e.g. <code>image.png</code> + <code>image.txt</code>).
      Tags are shown with spaces in the app and saved back to disk with underscores — you never
      need to think about which one you're looking at.</p>
      <p>The app writes a few of its own files into your dataset folder as you use it. None of
      them touch your images or captions unless you tell them to:</p>
      <ul>
        <li><b>Disabled/</b> — images you've moved out of the active set. Still fully editable,
        just hidden from the normal views.</li>
        <li><b>_tag_edit_log.json</b> — the full undo-able history of every edit you've made.</li>
        <li><b>_dts_canonical_tags.json</b> — your Retroactive Merge/Void rules.</li>
        <li><b>_dts_meta.json</b> — per-image notes, review flags, locks, and similar metadata.</li>
        <li><b>_dts_synthdat_settings.json</b> — SynthDat Overseer's prompt/generation settings for
        this dataset (only appears once you've used that tab).</li>
      </ul>`
  },
  {
    id: 'gallery',
    title: 'The Gallery tab',
    html: `
      <p>This is the tag editor itself — everything else in the app exists to support what happens
      here. The toolbar at the top of the gallery switches between ${isTouchDevice ? 'two views' : 'four views'}:</p>
      <ul>
        <li><b>Grid</b> (the default) — each card shows the image, its tags as editable chips, and
        a 3-dot menu for per-image actions.</li>
        ${isTouchDevice ? '' : `<li><b>Compact</b> — smaller thumbnails, tags appear on hover. Shift-click two images to
        pin them side by side in a comparison table.</li>
        <li><b>Single</b> — one image at a time: a compact preview (click it for the full-size
        view — scroll to zoom, drag to pan) beside a roomy tag panel. Type a number into the
        toolbar's "N / total" box and press Enter to jump straight to that image.</li>`}
        <li><b>❌ Disabled</b> — the images you've moved out of the active set.</li>
        ${isTouchDevice ? '' : `<li><b>🖼 Originals</b> — the pre-bucketing originals kept by Bucket Images (see Power
        tools). Read-only here; Bucket Images' Revert is what moves them back.</li>`}
        <li><b>🔢 Rename all</b> — renames every loaded image (+ its .txt) to a simple zero-padded
        1-N sequence (active dataset first, then Disabled, continuing the same count). Confirmed
        first; logged and undoable from the Log panel.</li>
      </ul>
      ${isTouchDevice ? '<p>Tap an image to open it full-size, zoomable/pannable with pinch and drag, with tag editing right there in the same modal.</p>' : ''}
      <p>To edit tags: ${isTouchDevice ? 'tap' : 'click'} a chip to open its menu (filter by it, look up its wiki definition,
      flag it for review, explore its keyword family), type into a card's "+ add tag" box and
      press Enter to add one, or ${isTouchDevice ? 'tap' : 'click'} a chip's × to remove it.</p>
      <p><b>🏷 Tag sorting</b> — in ${isTouchDevice ? 'the image modal' : 'Single view and the image modal'}, this pill above
      the tags groups them into labelled categories (Character, Body, Face, Clothes, Limbs and
      Hands, Sexual, Pose, Scene, Effects, Other) instead of one flat wall. The grouping is a best
      guess from Danbooru tag groups, so the odd tag lands in a neighbouring category. With it on,
      <b>＋ Add subject</b> (next to the pill) splits an image's tags into named subjects (e.g.
      "Girl 1", "Girl 2") for multi-character images: rename a subject by typing in its name,
      add category subheaders with <b>＋ Subheader</b>, and move tags between subjects by
      dragging a chip onto a subject${isTouchDevice ? '' : ', or shift-clicking chips then "Move tags to:"'}.
      Subjects are saved per image; removing them all returns to the plain category list.</p>
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
      ${isTouchDevice ? '' : '<p>Opening a card image also offers <b>⟲/⟳ Rotate</b> and <b>✂ Crop</b> — pixel edits that rewrite the image file in place (confirmed first, logged and undoable in the Log), with Crop\u2019s Isolate button saving the selected region as a NEW dataset image instead of touching the source.</p>'}`
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
        deliberately re-trigger it (e.g. by editing a rule).</li>
        <li><b>⏮ Reset edits</b> — revert this image back to its earliest known tag state.</li>
        <li><b>🗑️ Remove all tags</b> — clears every tag on this image at once (confirmed first)
        instead of ${isTouchDevice ? 'tapping' : 'clicking'} each chip's own ×. Undoable from the main Undo button.</li>
        <li><b>🐍 WD14 Tag</b> — run the autotagger on just this one image.</li>
        <li>Text/language, comic/koma, review flags, blur, and notes — all write immediately as
        you change them, no separate "Apply" step needed.</li>
      </ul>`
  },
  {
    id: 'power-tools',
    title: isTouchDevice ? 'Power tools (bottom panel)' : 'Power tools (right sidebar)',
    html: (isTouchDevice ? `
      <p>Docked panels in the bottom panel — swipe left/right to switch between them, tap a dock's
      header to collapse/expand it. Drag-to-reorder and drag-to-resize are both mouse-only, so
      those aren't available here.</p>
      <p><b>✂️ Prune tags</b> opens a full-screen browse/select list. Check any tags you want,
      then either Apply/Void them right there, or <b>💾 Save as task</b> to stash that selection
      and start browsing the next unrelated group without losing it — each saved task keeps its
      own selection and its own Apply/Void, so several unrelated groups stay separate.</p>` : `
      <p>These are the docked panels in the Gallery's right sidebar. Drag a dock's header to
      reorder it relative to the others, click the header to collapse/expand it, or drag its
      bottom edge to resize (Retroactive Merge/Void sizes itself to its content and skips this).
      The whole sidebar can also be dragged wider or narrower from its own left edge, or tucked
      away entirely via the arrow at its top.</p>
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
      the same correction keeps applying to future tags without you repeating it by hand.</p>`) + `
      <p><b>Retroactive Merge/Void</b> — standing rules: "these tags → this one canonical tag" (a
      merge) or "these tags → nothing" (a void). Whenever a rule's tags show up on a Gallery image
      afterward — by WD14, Master Tags, an accepted SynthDat image, or typing it in — they're
      corrected automatically (typing a blocked tag by hand is refused with a toast, not silently
      rewritten). This only affects Gallery images; Disabled ones are frozen until restored. A rule
      can be paused, or one of its tags turned off individually, without losing anything — both
      actively restore whatever each affected image originally had. Void rules
      show in their own collapsible group (they all share one rule, since there's no separate
      canonical tag to key them by); merge rules list one row per canonical tag.</p>
      ${isTouchDevice ? '' : `<p><b>🧺 Bucket Images</b> — crops and resizes every Gallery image to its nearest LoRA
      training bucket (Min side / Max side / Step, default 256 / 1024 / 64), so your trainer
      doesn't have to. The crop keeps the subject using a saliency model (a one-time ~176 MB
      download, ⬇ button in the dock). <b>Prefer GPU</b> runs it on your graphics card with an
      automatic CPU fallback. Originals are never lost: they move to an <code>original_images/</code>
      folder (browse them via the 🖼 Originals view), and images already at a bucket size are
      skipped, so re-running only handles the new ones. <b>↩ Revert bucketing</b> puts the
      originals back.</p>`}
      <p>Merge and Void tend to matter a lot more for a
      <span style="white-space:nowrap;"><b>character LoRA</b> <button type="button" class="info-btn" id="infoGlossaryCharacterLora" title="Character LoRA vs. style LoRA">ⓘ</button></span>
      than a style one. A character LoRA needs its identity-defining tags kept tight and
      consistent, so a stray misspelling or an inconsistent variant of the same trait doesn't
      teach the model that trait is optional — that's exactly what these tools clean up. Style
      LoRA training usually wants the opposite (more tag variety, not less), so you'll likely use
      these tools far less there.</p>
      <template id="infoGlossaryCharacterLoraContent">
        <p>A <b>LoRA</b> (Low-Rank Adaptation) is a small add-on file trained on top of a base
        image-generation model to teach it something new, without retraining the whole model from
        scratch.</p>

        <p>A <b>character LoRA</b> teaches the model one specific, recognizable character. Every
        training image shows that same character, so their defining traits are visible in every
        image whether or not a caption mentions them. A common technique splits tags into two
        groups:</p>

        <ul>
          <li><b>Void these</b> — traits that should ALWAYS be true of the character: eye color,
          hair color/style, a mole, whatever makes them recognizable. With no tag ever describing
          the trait, the model can't learn "this is something the prompt controls" — it only ever
          sees the trait already there, so it bakes it in as simply part of the character,
          permanently.</li>
          <li><b>Keep these</b> — traits that genuinely SHOULD change from image to image: pose,
          expression, background. These stay tagged, so they remain normal, promptable choices
          once the LoRA is done.</li>
        </ul>

        <p><b>Watch out for a signature outfit.</b> If the character wears the same distinctive
        outfit in most or all of your training images — say, a unique white frilly bikini — that
        outfit's own concept tends to fuse with the character's, even if you keep tagging it
        consistently. The model has rarely (or never) seen that outfit on anyone else, so the two
        ideas start becoming the same thing to it: prompting the character alone may start pulling
        that outfit in unasked, and prompting "white frilly bikini" on its own may start looking
        like this character even on an unrelated subject. If you want the outfit and the character
        to stay independently promptable, that outfit needs to show up on OTHER subjects somewhere
        in training too — otherwise, treat the fusion as expected for a genuine signature look, not
        a bug.</p>

        <p>This is the concrete reason Merge/Void see so much more use on a character LoRA's
        dataset than elsewhere: cleaning up misspelled variants of a tag AND deliberately
        stripping identity tags out entirely are both about controlling exactly what's locked in
        versus what's still a choice.</p>

        <p>A <b>style LoRA</b>, by contrast, teaches a visual STYLE rather than one character —
        training images are deliberately varied (many different subjects, poses, outfits), so the
        only thing consistent across the whole set is the art style itself. There, you usually
        WANT a wide, varied tag vocabulary kept in, not pruned out, so the model doesn't
        accidentally bake some incidental subject/pose choice into "this is just how the style
        looks" the way it correctly should for a character's actual identity traits.</p>
      </template>`
  },
  {
    id: 'tag-overseer',
    title: 'Tag Overseer tab',
    html: `
      <p>Two tools live here: Master Tag Control and the WD14 Autotagger. Clicking this tab again
      while it's already open takes you back to the Gallery.${isTouchDevice ? '' : ` If the right sidebar
      is tucked away, clicking this tab opens it, and clicking the tab again tucks it back.`}</p>
      <p><b>Master Tag Control</b> — select images by ${isTouchDevice ? 'tapping' : 'clicking'} thumbnails in the mini-grid here, or
      by selecting them in the main Gallery first (selection stays in sync either way). From there
      you can apply or remove a tag across the whole selection, conditionally apply one tag based
      on another already being present (or its own separate row for the inverse — based on it
      being ABSENT), or run a dataset-wide rename or find-and-replace. The
      Lock/Unlock and Merge Immunize/Antivoid/Antimmunize buttons here apply the same per-image
      flags described in the 3-dot menu section, but to your entire selection at once. <b>❌ Delete
      selected permanently</b> removes every selected image and its tags from disk outright
      (confirmed, locked images skipped) — no undo.</p>
      ${isTouchDevice ? '' : `
      <p><b>▶ Sequential from first / from selected</b> — walk your current filter image by
      image in Single view with a quick-modify panel: text/language (custom languages welcome),
      censorship state + type checkboxes, multi-select perspective checkboxes, monochrome, sound
      effects, comic, multiple views, koma count. The image is the same compact preview as
      Single view (click it for the full-size view). A live tag preview under the image shows
      exactly which tags Confirm will apply before you commit; Confirm advances automatically
      and progress is saved per image. Use it to align indicator tags across a filtered batch.</p>`}
      <p><b>🐍 WD14 Autotagger</b> — sends selected images (or a single one, via its 3-dot menu) to
      a WD14 Tagger node on your own ComfyUI instance and merges the tags it returns onto each
      card. Expand "⚙ WD14 settings" to set the ComfyUI host, model, confidence thresholds, and
      whether results apply automatically or go through a review step first.
      ${isTouchDevice
        ? `"Tagging source" picks between that (ComfyUI) and <b>on-device tagging</b> — a model
        runs directly on your phone (hardware-accelerated where the phone supports it, falling
        back to CPU otherwise), no ComfyUI instance needed at all. Models aren't bundled with the
        app; pick one from the built-in catalog for a one-tap download, or paste a HuggingFace repo
        manually. Either mode uses the exact same review step and settings below.`
        : 'This app holds no model itself — your ComfyUI instance does the actual tagging.'}</p>`
  },
  {
    id: 'datasets-tab',
    title: 'Datasets tab',
    html: `
      <p>A folder manager separate from the Gallery — every dataset folder you've opened shows up
      here as a themed folder icon. Sort by name/time,${isTouchDevice ? '' : ' or manually by dragging,'} and
      ${isTouchDevice ? 'tap a folder\'s ⋯ button' : 'right-click a folder (or tap its ⋯ button)'} for more options: remove it from
      this list, pin it as a favorite, view its achievements read-only, change its icon, or move it
      to a different tab. Opening a folder that isn't tracked here yet prompts you once to add it.</p>
      <p><b>Tabs</b> split folders into separate groups — the built-in <b>Default</b> tab always
      shows, and any tab you add with the <b>+</b> button can be given a password (tap its ⋯
      button). A password-protected tab re-locks every time the app starts; nothing about it
      (not even folder names) renders until you enter the password. This protects against someone
      else briefly opening the app on your machine, not a determined attacker with access to your
      files.</p>`
  },
  {
    id: 'stats-tab',
    title: 'Editing Stats tab',
    html: `<p>Animated charts (pick pie or bar) of every logged action by type, plus summary cards
      for total edits, undo/redo stack depth, and achievements unlocked so far.</p>`
  },
  {
    id: 'synthdat',
    title: 'SynthDat Overseer tab',
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

        <p>See the Power tools section for the fuller version of this, including how to avoid that
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
    id: 'settings',
    title: 'Settings',
    html: `
      <p>${isTouchDevice ? 'Tap' : 'Click'} the ⚙ Settings button (next to File in the top bar) to open it. Each section below
      expands on ${isTouchDevice ? 'tap' : 'click'}:</p>
      <ul>
        <li><b>Appearance</b> — theme picker, night/day mode, the font-size slider (the whole
        gallery and panels reflow live as you drag it), and "Gallery columns" to lock the gallery's
        column count independent of zoom or panel width.</li>
        <li><b>Power Tools</b> — options for marking specific fields/buttons as "power tools" (a
        visual highlight) for your own workflow.</li>
        <li><b>Tagging</b> — tag-input behavior, e.g. whether typing a new language auto-selects
        it.</li>
        <li><b>Saving</b> — Autosave (off by default): when on, edits save to disk automatically
        about 1.2 seconds after you stop typing. Every edit stays undoable either way — each one
        is already in the Edit Log with its own undo.</li>
        <li><b>Performance</b> — Hardware acceleration (on by default) steers this app's own UI
        rendering onto your integrated GPU instead of competing with ComfyUI's real workload on
        your discrete one. Turning it off forces pure CPU rendering. Takes effect on your next
        launch.</li>
        <li><b>Layout & Panels</b> — UI animation mode (Fade/Swipe/Off; Swipe treats the app as one
        map, so tabs, views and images slide the way they actually sit), and "Reset panel layout" if
        a dock's ${isTouchDevice ? 'collapse state ever gets stuck' : 'drag-reorder or collapse state ever gets into a bad state'}.</li>
        <li><b>Updates & Sharing</b> — "Restart app" reloads the latest files instantly, no manual
        quit/reopen needed. "🩺 Export app state" isn't something you'd normally need — it's a
        troubleshooting aid that writes a text file next to the app with your current settings,
        theme, panel layout, and whether a dataset's loaded, useful when reporting a bug.</li>
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
      <p>🏆 Achievements (55+, unlocked per dataset folder — a fresh dataset starts with none
      unlocked) pay out Edibits as you use the app's features. 🌙 Night mode is a genuine per-theme
      color inversion that also keeps every text and accent color readable.</p>
      <p>Settings ▸ Appearance has motion-sensitivity controls: <b>Suppress Theme Flourishes</b>
      hides the Refine Theme button and turns off epic/legendary-tier hover-fill/card-tilt
      everywhere — whether a theme has it natively or you bought it via Refine Theme. Three
      independent toggles (<b>Disable hover-fill</b>, <b>Disable card hover-tilt</b>, <b>Disable
      ambient animations</b>) let you turn off just one specific motion effect instead of all of
      them. None of these touch a theme's static colors, textures, or glows.</p>`
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
      toggle button instead. Rule-configuration changes (pausing a rule, toggling a child tag off)
      show up too, just without an Undo button — there's no tag-level change to reverse for a pure
      setting flip.</p>
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
      ${isTouchDevice ? `<p><b>⚠ Except force-closing the app</b> — swiping it away in Android's
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
        ${isTouchDevice ? '' : `<li>Drag a card straight onto the Disabled tab to disable it quickly (hover a card to see
        this hint appear).</li>`}
        <li>Underscore-to-space conversion only goes one way — a tag that ends up with an
        underscore while you're editing in-app is treated as containing a literal space, by
        design.</li>
        <li>Night mode doesn't apply to the Custom theme, since that one's already fully under your
        own control.</li>
        <li>If a dock's layout looks broken (stuck collapsed, wrong order), use Settings ▸ Layout &
        Panels ▸ "Reset panel layout."</li>
        <li>If Tag Details says "no definition found" for everything, the bundled Danbooru wiki
        data files are missing from your install — redownload the release zip.</li>
        ${isTouchDevice ? '' : `<li>The window hides Electron's default menu bar — tap Alt to reveal it temporarily.</li>`}
      </ul>`
  }
];
