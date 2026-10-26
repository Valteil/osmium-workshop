// The Regional tab's own step-by-step guide (both shells; the phone has no
// general Help). Written for someone who has never heard of regional
// prompting: every control is named exactly as it reads on screen, every
// step says what you should see, and every common problem has a fix. Keep it
// in sync with shared/regional.ts whenever a control is added or renamed.

const SECTIONS: { id: string; title: string; html: string }[] = [
  {
    id: 'what',
    title: 'What this tab does',
    html: `
      <p>Normally you write one prompt and the model decides <b>where</b> everything goes. Here you decide.
      You draw <b>boxes</b> on a blank canvas (the canvas is your picture, same shape and size), and you
      write a short prompt for each box. The model then puts each box's thing <b>in that box</b>.</p>
      <p>Example: a box on the left that says <i>1girl, red hair</i> and a box on the right that says
      <i>1boy, black suit</i> gives you the girl on the left and the boy on the right, and the red hair
      stays on the girl instead of leaking onto the boy.</p>
      <p class="rgg-note">It works with <b>Anima</b> models (the ones this app is built for).</p>`
  },
  {
    id: 'quick',
    title: 'Quick start: your first picture in 6 steps',
    html: `
      <ol class="rgg-steps">
        <li><b>Set the picture size.</b> At the top of this tab, type the width and height (for example
          <code>1216</code> × <code>832</code> for a wide picture). These are the same numbers as on the
          Generate tab: changing one changes the other. The canvas changes shape to match.</li>
        <li><b>Draw a box.</b> Press and drag on the canvas, like selecting files on a desktop. Let go.
          A coloured box appears with a number in its corner, and a text field for it opens on the right
          (under <b>Boxes</b>). Tip: no idea where to start? Open the <b>Layout…</b> menu at the top and
          pick <b>Two side by side</b>: it draws two boxes for you.</li>
        <li><b>Say what goes in the box.</b> Type into that box's text field, for example
          <code>1girl, long red hair, white dress, smiling</code>. Put the <b>count</b> (<code>1girl</code>,
          <code>1boy</code>, <code>1cat</code>) at the start of every box that holds a character.</li>
        <li><b>Draw the next box and fill it in</b> the same way, for example on the right:
          <code>1boy, black hair, black suit</code>.</li>
        <li><b>Fill in Style and Whole image</b> on the right (see the next section for what goes where).
          For a quick test, Whole image can be just <code>safe, simple background</code>.</li>
        <li><b>Press Generate</b> (top right of this tab). You can stay here: the progress shows under the
          buttons. The finished picture appears on the Generate tab as usual. Tick <b>Show the last
          result behind the boxes</b> (under the canvas) to see it behind your boxes.</li>
      </ol>
      <p>That's it. Everything below is for when you want more control or something looks wrong.</p>`
  },
  {
    id: 'text',
    title: 'Which text goes where (the most important part)',
    html: `
      <p>There are three kinds of text. Putting a word in the wrong one is the most common mistake.</p>
      <table class="rgg-table">
        <tr><th>Field</th><th>Put here</th><th>Example</th><th>Never put here</th></tr>
        <tr><td><b>Style</b><br><span class="rgg-small">(Global + Character trigger)</span></td>
          <td>The artist tags and your <b>LoRA's trigger words</b>: anything about <i>how</i> it's drawn.
          These are your Generate tab's own Global and Character trigger fields, shown here.</td>
          <td><code>by some_artist, watercolor</code><br><code>mylora_trigger</code></td>
          <td>People, clothes, objects</td></tr>
        <tr><td><b>Whole image</b></td>
          <td>What's true for the <b>entire picture</b>: quality, rating, the place, the light, the weather.</td>
          <td><code>masterpiece, safe, city street at night, rain</code></td>
          <td><b>Counts</b> (<code>2girls</code>) and any one character's details</td></tr>
        <tr><td><b>A box</b></td>
          <td>Only what is <b>inside that box</b>: who or what it is, and how it looks.</td>
          <td><code>1girl, red hair, white dress, waving</code></td>
          <td>The place, the art style (they're added for you)</td></tr>
      </table>
      <p><b>Why counts don't go in Whole image:</b> Whole image is copied into every box. If it says
      <code>2girls</code>, each box tries to draw two girls.</p>
      <p><b>Why the LoRA trigger goes in Style:</b> Style is copied into every box too. If the trigger
      is only in one box, the LoRA's look only shows up in that box.</p>
      <p><b>Your normal prompt is safe.</b> While a layout is in use, the Generate tab's prompt boxes are
      hidden, not cleared. Style edits the same Global and Character trigger fields you already have.</p>`
  },
  {
    id: 'boxes',
    title: 'Drawing and changing boxes',
    html: `
      <table class="rgg-table rgg-actions">
        <tr><th>To…</th><th>Do this</th></tr>
        <tr><td>Make a box</td><td>Drag on an empty part of the canvas. A tiny drag (a click) makes nothing.</td></tr>
        <tr><td>Select a box</td><td>Click it. It gets a white glow and small white squares on its edges.</td></tr>
        <tr><td>Move a box</td><td>Drag the middle of it.</td></tr>
        <tr><td>Resize a box</td><td>Select it, then drag one of the small white squares (corners or edge middles).</td></tr>
        <tr><td>Nudge a box</td><td>Select it, then use the arrow keys (hold Shift for bigger steps).</td></tr>
        <tr><td>Copy a box</td><td>⧉ in its row, or select it and press Ctrl+D. The copy keeps the prompt.</td></tr>
        <tr><td>Delete a box</td><td>✕ in its row, or select it and press Delete.</td></tr>
        <tr><td>Undo / redo</td><td>↶ and ↷ at the top, or Ctrl+Z / Ctrl+Y (click the canvas first). Typing in
          a text field has its own undo (Ctrl+Z while typing).</td></tr>
        <tr><td>Start over</td><td><b>Clear</b> at the top (↶ brings everything back).</td></tr>
        <tr><td>Turn the picture sideways</td><td><b>⇄</b> next to the size: width and height swap and the boxes turn with them.</td></tr>
        <tr><td>Use a ready-made arrangement</td><td><b>Layout…</b> menu. Your boxes' prompts move into the new
          boxes in order (box 1's prompt into the new box 1, and so on).</td></tr>
      </table>
      <p>Box numbers and colours follow the list order on the right.</p>`
  },
  {
    id: 'sliders',
    title: 'Each box\'s two sliders: Strength and Spread',
    html: `
      <p><b>Strength</b> (start at 1): how strictly the inside of the box sticks to its own prompt.
      Lower it (to about 0.6) if the thing in the box looks <i>pasted on</i>, like a sticker. The box's
      colour gets paler as you lower it.</p>
      <p><b>Spread</b> (start at 0%): whether the box is a <b>hard edge</b> or just <b>"about here"</b>.</p>
      <ul>
        <li><b>0%</b>: the thing stays inside the box. A small box = a small thing.</li>
        <li><b>Higher</b> (try 20–30%): the box marks roughly <i>where</i> the thing goes, and it can grow past the
          box into the empty space around it. A dashed rounded outline on the canvas shows how far it can reach.
          It never reaches into another box.</li>
      </ul>
      <p>Use Spread when you want "a cat somewhere around here" rather than "a cat exactly this big".</p>`
  },
  {
    id: 'overlap',
    title: 'When boxes overlap',
    html: `
      <p>Boxes may overlap. What happens in the overlap is set by <b>Overlaps</b> (open <b>Blending</b> on the right):</p>
      <ul>
        <li><b>Mix both prompts</b> (the default): the overlapping area hears both boxes. Good for a box
          <i>inside</i> another box, like a <code>hat</code> box on a person's head.</li>
        <li><b>Top box wins</b>: the overlap belongs only to the box that is lower in the list (it's drawn
          on top on the canvas too). Good for something <i>in front of</i> something else, like a cat
          sitting in front of a bookshelf.</li>
      </ul>
      <p>To change which box is on top, use <b>▲</b> and <b>▼</b> in the box's row: lower in the list = in front.</p>`
  },
  {
    id: 'generate',
    title: 'Generating, and going back to your normal prompt',
    html: `
      <ul>
        <li><b>Generate</b> (this tab): makes a picture with the layout right away.</li>
        <li><b>Use in Generate</b>: switches the Generate tab over to the layout without generating. The
          Generate tab then shows a <b>Regional prompt</b> card instead of its prompt boxes, with the same
          text fields, so you can change prompts there too.</li>
        <li><b>Back to normal prompt</b> (on that card): your old prompt boxes come back exactly as you left
          them. The layout stays saved here for next time.</li>
      </ul>
      <p>Everything else on the Generate tab (model, LoRAs, sampler, steps, seed, Negative, upscale, saving) works
      exactly as normal.</p>
      <p><b>Import Generation</b> with a picture made here brings its whole layout back. Importing any
      other picture, or using WD14 tags as the prompt, switches back to the normal prompt boxes.</p>`
  },
  {
    id: 'blending',
    title: 'Blending (you can leave all of this alone)',
    html: `
      <p>These are already set to values that were tested. Only change one if a problem below tells you to.
      <b>Reset blending</b> puts them all back.</p>
      <p>How it works in one sentence: the boxes only steer the <b>first part</b> of the generation (when the
      layout is decided), then the whole picture is finished together so it looks like one image, not a collage.</p>
      <table class="rgg-table">
        <tr><td><b>Layout ends</b> (35%)</td><td>How long the boxes steer. Higher = boxes followed more strictly.</td></tr>
        <tr><td><b>Layout starts</b> (0%)</td><td>Leave at 0. Even 10% made two boxes melt into one person in testing.</td></tr>
        <tr><td><b>Box focus</b> (1)</td><td>How strictly each box hears only its own prompt.</td></tr>
        <tr><td><b>Separation</b> (0.2)</td><td>Keeps boxes apart. At 0, two people melt into one. Too high = visible seams.</td></tr>
        <tr><td><b>Blend</b> (0.1)</td><td>Mixes in a bit of the normal picture so style and lighting match everywhere.</td></tr>
        <tr><td><b>Background</b> (0.3)</td><td>How firmly the empty area follows Whole image. Higher = junk in the gaps between boxes.</td></tr>
        <tr><td><b>Focus every / Separate every</b> (all)</td><td>A lighter touch: only every 2nd, 3rd… layer. Rarely needed.</td></tr>
        <tr><td><b>Whole prompt</b></td><td>Leave on "Only where no box is". "Everywhere" turns Separation off.</td></tr>
        <tr><td><b>Overlaps</b></td><td>See "When boxes overlap" above.</td></tr>
        <tr><td>The three tick boxes</td><td>Leave them all ticked. They copy Style and Whole image into every box,
          and every box's prompt into the whole picture.</td></tr>
      </table>`
  },
  {
    id: 'fix',
    title: 'Something looks wrong? Find it here',
    html: `
      <table class="rgg-table rgg-fix">
        <tr><th>You see…</th><th>Do this</th></tr>
        <tr><td>Two characters melted into one person</td><td>Separation at least 0.2, Layout starts at 0, Whole prompt on
          "Only where no box is". Still melting? Raise <b>Layout ends</b> to 0.45. Make sure each box starts with its own count (<code>1girl</code> / <code>1boy</code>).</td></tr>
        <tr><td>A character appears twice, or in the wrong box</td><td>Take counts (<code>2girls</code>) and character details out of <b>Whole image</b>; put them in the boxes.</td></tr>
        <tr><td>A box's thing didn't show up at all</td><td>Raise <b>Layout ends</b> (0.45–0.5) and check the box has text (an empty box has a dashed outline and is skipped).</td></tr>
        <tr><td>The LoRA's style only shows in some boxes</td><td>Put the LoRA trigger in <b>Style → Character trigger</b> (not in a box). Then raise <b>Blend</b> to 0.2.</td></tr>
        <tr><td>Things look pasted on / hard straight edges</td><td>Lower that box's <b>Strength</b> to 0.6, or give it some <b>Spread</b>. Lower Separation a little (0.15).</td></tr>
        <tr><td>Coloured squares or junk in the gaps between boxes</td><td>Lower <b>Background</b> (0.3 or less), or make the boxes touch.</td></tr>
        <tr><td>Something is too small because its box is small</td><td>Give that box <b>Spread</b> 20–30%, or make the box bigger.</td></tr>
        <tr><td>An overlap looks like a mix of two things</td><td>Set <b>Overlaps</b> to <b>Top box wins</b>, and use ▲ ▼ so the front thing is lower in the list.</td></tr>
        <tr><td>Generate says "draw at least one box" or "give at least one box a prompt"</td><td>Exactly that: a box needs text in its field before it counts.</td></tr>
        <tr><td>An error mentions <code>DSMAnimaRegionalPrompt</code></td><td>With your own ComfyUI server: install the ComfyUI-DataSetManagerNodes pack from this release and restart ComfyUI. With Osmium Comfy and Persist Comfy on: close the Osmium Comfy console window once so it restarts with the new version.</td></tr>
        <tr><td>An error says it "supports only Anima models"</td><td>Pick an Anima model as the Diffusion model on the Generate tab.</td></tr>
        <tr><td>My normal prompt is gone!</td><td>It's only hidden. Press <b>Back to normal prompt</b> on the Generate tab's Regional prompt card.</td></tr>
      </table>`
  },
  {
    id: 'saved',
    title: 'Good to know',
    html: `
      <ul>
        <li>Your layout saves by itself, on this device only. It's still there after you close the app.</li>
        <li>Boxes are stored as positions on the picture, so changing the size keeps them in the same places.</li>
        <li>The phone app has the same tab. On a phone, drag with one finger; the handles are bigger.</li>
        <li>This guide is always behind <b>? How to use</b> at the top of this tab.</li>
      </ul>`
  }
];

let openGuide: HTMLElement | null = null;

// Opens the guide (at a section, optional). One at a time; Esc, ✕, or a
// click on the dark backdrop closes it.
export function showRegionalGuide(sectionId?: string): void {
  if (openGuide) return;
  const overlay = document.createElement('div');
  overlay.className = 'rgg-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Regional prompt: how to use');
  const panel = document.createElement('div');
  panel.className = 'rgg-panel';
  const head = document.createElement('div');
  head.className = 'rgg-head';
  const title = document.createElement('div');
  title.className = 'rgg-title';
  title.textContent = 'Regional prompt: how to use';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'rgg-close';
  close.textContent = '✕';
  close.title = 'Close the guide';
  head.append(title, close);
  const toc = document.createElement('nav');
  toc.className = 'rgg-toc';
  const body = document.createElement('div');
  body.className = 'rgg-body';
  SECTIONS.forEach((s, i) => {
    const link = document.createElement('button');
    link.type = 'button';
    link.textContent = `${i + 1}. ${s.title}`;
    link.addEventListener('click', () => body.querySelector(`#rgg-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    toc.append(link);
    const sec = document.createElement('section');
    sec.id = 'rgg-' + s.id;
    sec.innerHTML = `<h3>${i + 1}. ${s.title}</h3>${s.html}`;
    body.append(sec);
  });
  const foot = document.createElement('div');
  foot.className = 'rgg-foot';
  const done = document.createElement('button');
  done.type = 'button';
  done.className = 'rg-primary';
  done.textContent = 'Got it';
  foot.append(done);
  panel.append(head, toc, body, foot);
  overlay.append(panel);
  document.body.append(overlay);
  openGuide = overlay;

  const shut = (): void => {
    overlay.remove();
    document.removeEventListener('keydown', onKey, true);
    openGuide = null;
  };
  // Capture + stop: no other open dialog also answers this Escape
  // (notes/Pitfalls/Stacked-Modals-All-Answer-Escape.md).
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); shut(); }
  };
  document.addEventListener('keydown', onKey, true);
  close.addEventListener('click', shut);
  done.addEventListener('click', shut);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) shut(); });
  if (sectionId) requestAnimationFrame(() => body.querySelector(`#rgg-${sectionId}`)?.scrollIntoView({ block: 'start' }));
  close.focus();
}
