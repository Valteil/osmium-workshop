// The Regional tab's own guide (both shells; the phone has no general Help).
// Written for someone who already generates: only what's specific to this
// tab (where text goes, the controls, the settings, fixes), kept short. Uses
// the tab's own words (Style, Scene, Whole picture only, box, empty area,
// layout steps, whole picture). Keep it in sync with shared/regional.ts
// whenever a control is added or renamed.

const SECTIONS: { id: string; title: string; html: string }[] = [
  {
    id: 'how',
    title: 'How it works',
    html: `
      <p>During the <b>layout steps</b> (the first 35% by default), each box's prompt applies only inside
      that box. Then the <b>whole picture</b> is finished with one prompt, so the result reads as one image.
      Anima models only.</p>
      <p>Draw boxes, fill them in, then <b>Generate</b> here, or <b>Use in Generate</b> to hand the
      layout to the Generate tab (its prompt boxes are swapped for a layout card until <b>Back to normal
      prompt</b>; nothing is cleared). Models, LoRAs, sampler, Negative and saving work as usual.</p>`
  },
  {
    id: 'text',
    title: 'Where text goes',
    html: `
      <p>Every field has one fixed scope, shown next to its name.</p>
      <table class="rgg-table">
        <tr><th>Field</th><th>Goes into</th><th>Put</th></tr>
        <tr><td><b>Style</b><br>(your Global + Character trigger)</td><td>every box · empty area · whole picture</td><td>Artist tags, LoRA trigger</td></tr>
        <tr><td><b>Scene</b></td><td>every box · empty area · whole picture</td><td>Quality, rating, setting, lighting</td></tr>
        <tr><td><b>Whole picture only</b></td><td>whole picture only</td><td>Counts and interactions: <code>2girls</code>, <code>looking at each other</code></td></tr>
        <tr><td><b>A box</b></td><td>that box · whole picture</td><td>That subject, count first: <code>1girl, red hair, waving</code></td></tr>
      </table>
      <p>So: subjects and their counts never go in Style or Scene (every box would draw them), and the
      overall count (<code>2girls</code>) goes in Whole picture only. The <b>empty area</b> is wherever
      no box is.</p>`
  },
  {
    id: 'controls',
    title: 'Controls',
    html: `
      <ul>
        <li><b>Boxes:</b> drag on empty canvas to draw; drag to move; select, then drag a handle to resize.
          Arrows nudge (Shift = more), Delete removes, Ctrl+D or ⧉ duplicates, Ctrl+Z / Ctrl+Y or ↶ ↷
          undo/redo box changes. Empty boxes (dashed) are skipped.</li>
        <li><b>Layout…</b> applies a preset arrangement; prompts carry over in list order.
          <b>⇄</b> swaps width/height and turns the boxes with it.</li>
        <li><b>Strength</b> (per box): how strictly the box keeps to its prompt. Lower if it looks pasted on.</li>
        <li><b>Spread</b> (per box): 0% = hard edge, the subject is sized to the box. Higher = "roughly here":
          the prompt reaches into the empty area around the box (dashed outline), so a small box sets position
          without shrinking the subject.</li>
        <li><b>Overlaps</b> (Blending): <i>Mix both prompts</i> suits a box inside a box (a hat on a head);
          <i>Top box wins</i> gives the overlap to the box lower in the list (▲ ▼), for something in front of something else.</li>
        <li><b>Show the last result behind the boxes</b> to line boxes up with a previous output.</li>
      </ul>`
  },
  {
    id: 'blending',
    title: 'Blending settings',
    html: `
      <p>Defaults are tested; <b>Reset blending</b> restores them.</p>
      <table class="rgg-table">
        <tr><td><b>Layout ends</b> 35%</td><td>How long the layout steps last. Raise if boxes are ignored.</td></tr>
        <tr><td><b>Layout starts</b> 0%</td><td>Keep at 0: a late start lets subjects merge.</td></tr>
        <tr><td><b>Box focus</b> 1</td><td>How strictly a box hears only its own prompt.</td></tr>
        <tr><td><b>Separation</b> 0.2</td><td>Keeps boxes apart. 0 merges subjects; high gives seams.</td></tr>
        <tr><td><b>Blend</b> 0.1</td><td>Mixes in the plain whole-picture result for consistent style and lighting.</td></tr>
        <tr><td><b>Empty-area strength</b> 0.3</td><td>How firmly the empty area follows Style + Scene. High causes junk there.</td></tr>
        <tr><td><b>Empty-area prompt</b></td><td>Keep "Empty area only"; "Everywhere" turns Separation off.</td></tr>
        <tr><td><b>Focus / Separate every</b></td><td>Apply to every Nth block only, for a lighter touch.</td></tr>
      </table>`
  },
  {
    id: 'fix',
    title: 'Fixes',
    html: `
      <table class="rgg-table rgg-fix">
        <tr><td>Subjects merge into one</td><td>Separation ≥ 0.2, Layout starts 0, a count in each box; raise Layout ends to ~0.45.</td></tr>
        <tr><td>Subject duplicated / in the wrong box</td><td>Move counts and subject details out of Style and Scene (overall count → Whole picture only).</td></tr>
        <tr><td>A box is ignored</td><td>Raise Layout ends; check the box has text.</td></tr>
        <tr><td>LoRA look uneven across boxes</td><td>Trigger in Style, not a box; then Blend ~0.2.</td></tr>
        <tr><td>Pasted-on look / hard edges</td><td>Lower the box's Strength (~0.6), add Spread, or Separation ~0.15.</td></tr>
        <tr><td>Junk in the empty area between boxes</td><td>Lower Empty-area strength, or make boxes touch.</td></tr>
        <tr><td>Subject squashed into a small box</td><td>Spread 20–30%, or a bigger box.</td></tr>
        <tr><td>Overlap looks like a mix</td><td>Overlaps → Top box wins; front box lower in the list.</td></tr>
        <tr><td>Error mentions <code>DSMAnimaRegionalPrompt</code></td><td>Server: update ComfyUI-DataSetManagerNodes and restart ComfyUI. Osmium Comfy with Persist on: close its console once.</td></tr>
        <tr><td>"supports only Anima models"</td><td>Use an Anima diffusion model.</td></tr>
      </table>
      <p>Layouts save per device. Importing a regional image restores its layout; importing anything else
      (or WD14 "Use as prompt") switches back to the normal prompt.</p>`
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
  title.textContent = 'Regional prompt';
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
