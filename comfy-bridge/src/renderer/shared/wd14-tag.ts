// WD14 tagging as its own function (both shells): tag the last generation's
// saved images (optional .txt beside each, in the output folder), or tag an
// imported image (copy the tags, use them as the prompt, or save a .txt —
// next to the original on desktop, or a copy + .txt in the output folder).
//
// Graph: LoadImage '239' → WD14Tagger|pysssss '2'. '239' is the id every
// transport already uploads into (main, the Osmium Comfy runner, the relay,
// the phone); '2' is where extractWd14Tags (comfy-core) reads the tags. The
// tagger is marked `_meta.capture` so the local runner returns its text.
import { attachPickerModal } from './picker-modal';

type Prompt = Record<string, any>;

export interface Wd14TagSettings {
  model: string; threshold: string; charThreshold: string; spaces: boolean; exclude: string;
}

export const WD14_TAG_DEFAULTS: Wd14TagSettings = {
  model: 'wd-eva02-large-tagger-v3', threshold: '0.35', charThreshold: '0.85', spaces: true, exclude: ''
};

export function buildWd14TagPrompt(imageName: string, s: Wd14TagSettings): Prompt {
  const num = (v: string, d: number) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
  return {
    '239': { class_type: 'LoadImage', inputs: { image: imageName, upload: 'image' }, _meta: { title: 'Load Image' } },
    '2': {
      class_type: 'WD14Tagger|pysssss',
      inputs: {
        image: ['239', 0], model: s.model.trim() || WD14_TAG_DEFAULTS.model,
        threshold: num(s.threshold, 0.35), character_threshold: num(s.charThreshold, 0.85),
        replace_underscore: !!s.spaces, trailing_comma: false, exclude_tags: s.exclude || ''
      },
      _meta: { title: 'WD14 Tagger', capture: true }
    }
  };
}

// Literal brackets escaped, as Osmium writes captions and as prompt weights
// need ("ganyu (genshin impact)" would otherwise read as a weight group).
export function escapeTagBrackets(tags: string): string {
  return tags.replace(/(?<!\\)\(/g, '\\(').replace(/(?<!\\)\)/g, '\\)');
}

export function txtPathFor(relPath: string): string {
  return relPath.replace(/\.[^./]+$/, '') + '.txt';
}

export function utf8Base64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

export interface Wd14SavedImage { label: string; bytes: Uint8Array; relPath: string; }
export interface Wd14PickedImage { name: string; bytes: Uint8Array; token?: string; }

export interface Wd14PanelOptions {
  // Runs one tagging job; resolves with the tags (raw, from the tagger).
  tag: (prompt: Prompt, imageName: string, bytes: Uint8Array) => Promise<string>;
  getModels: () => string[];
  refreshModels: () => Promise<void> | void;
  // The last generation's saved files (relative to the output folder).
  lastSaved: () => Wd14SavedImage[];
  // Writes a file under the output folder.
  writeOutput: (relPath: string, base64: string, mime: string) => Promise<void>;
  // Desktop: pick through the main process, so it can later write beside the
  // original (`token` names the file; the renderer never sees the path).
  pickImage?: () => Promise<Wd14PickedImage | null>;
  saveNextToOriginal?: (token: string, text: string, overwrite: boolean) => Promise<{ ok: boolean; exists?: boolean; error?: string; path?: string }>;
  usePrompt: (tags: string) => void;
  log: (msg: string) => void;
}

const TIPS = {
  model: 'The WD14 tagger model (ComfyUI-WD14-Tagger node pack, runs on your ComfyUI). eva02-large is the most accurate of the v3 taggers.',
  threshold: 'Minimum confidence for a general tag (0–1). Lower = more tags, more wrong ones. 0.35 is the usual default.',
  charThreshold: 'Minimum confidence for a character tag (0–1). Kept high so a lookalike isn\'t named.',
  spaces: 'Write tags as "long hair" instead of "long_hair" (Osmium saves captions with spaces).',
  exclude: 'Comma-separated tags the tagger must never output.'
};

export interface Wd14Panel { refresh: () => void; }

export function mountWd14Panel(host: HTMLElement, opts: Wd14PanelOptions): Wd14Panel {
  const touch = typeof matchMedia === 'function' && matchMedia('(hover: none)').matches;
  host.classList.add('wd14-panel');
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const tipped = (row: HTMLElement, label: HTMLElement, tip: string) => {
    row.title = tip;
    if (!touch) return;
    const t = el('div', 'usdu-tip muted small', tip);
    t.hidden = true;
    label.classList.add('usdu-tappable');
    label.addEventListener('click', (e) => { e.preventDefault(); t.hidden = !t.hidden; });
    row.appendChild(t);
  };

  // ---- settings ----
  const grid = el('div', 'settings-grid');
  const field = (id: string, label: string, tip: string, input: HTMLInputElement, wide = false) => {
    const row = el('div', 'usdu-field' + (wide ? ' settings-span2' : ''));
    const l = el('label', '', label);
    input.id = id;
    row.append(l, input);
    tipped(row, l, tip);
    grid.appendChild(row);
    return input;
  };
  const numInput = (v: string) => { const i = el('input'); i.type = 'number'; i.step = '0.01'; i.min = '0'; i.max = '1'; i.value = v; return i; };
  const modelIn = el('input'); modelIn.type = 'text'; modelIn.readOnly = true; modelIn.placeholder = 'Tap to choose…'; modelIn.value = WD14_TAG_DEFAULTS.model;
  attachPickerModal(modelIn, 'WD14 model', () => opts.getModels());
  field('wd14TagModel', 'WD14 model', TIPS.model, modelIn, true);
  const thrIn = field('wd14TagThreshold', 'Tag threshold', TIPS.threshold, numInput(WD14_TAG_DEFAULTS.threshold));
  const charIn = field('wd14TagCharThreshold', 'Character threshold', TIPS.charThreshold, numInput(WD14_TAG_DEFAULTS.charThreshold));
  const exIn = el('input'); exIn.type = 'text';
  field('wd14TagExclude', 'Exclude tags', TIPS.exclude, exIn, true);
  const spacesRow = el('div', 'usdu-field settings-span2');
  const spacesLabel = el('label', 'chk-row');
  const spacesIn = el('input'); spacesIn.type = 'checkbox'; spacesIn.id = 'wd14TagSpaces'; spacesIn.checked = WD14_TAG_DEFAULTS.spaces;
  spacesLabel.append(spacesIn, ' Spaces instead of underscores');
  spacesRow.appendChild(spacesLabel);
  tipped(spacesRow, spacesLabel, TIPS.spaces);
  grid.appendChild(spacesRow);
  const settings = (): Wd14TagSettings => ({ model: modelIn.value, threshold: thrIn.value, charThreshold: charIn.value, spaces: spacesIn.checked, exclude: exIn.value });

  const refreshRow = el('div', 'row');
  const refreshBtn = el('button', '', 'Refresh WD14 models');
  refreshBtn.type = 'button';
  refreshBtn.title = 'Reload the tagger model list from ComfyUI.';
  refreshBtn.addEventListener('click', () => { void opts.refreshModels(); });
  refreshRow.appendChild(refreshBtn);

  const tagOne = async (name: string, bytes: Uint8Array): Promise<string> => {
    const raw = await opts.tag(buildWd14TagPrompt(name, settings()), name, bytes);
    return escapeTagBrackets(raw.trim().replace(/,\s*$/, ''));
  };

  // ---- the last generation ----
  const genHead = el('div', 'usdu-sec-head', 'Tag the last generation');
  const genRow = el('div', 'row');
  const genBtn = el('button', '', 'Tag last generation');
  genBtn.type = 'button';
  genBtn.title = 'Tag every image the last generation saved (pass 1, pass 2, upscaled), each from its own pixels.';
  genRow.appendChild(genBtn);
  const genTxtLabel = el('label', 'chk-row');
  const genTxt = el('input'); genTxt.type = 'checkbox'; genTxt.id = 'wd14TagSaveGenTxt'; genTxt.checked = true;
  genTxtLabel.append(genTxt, ' Save a .txt beside each image');
  genTxtLabel.title = 'Writes the tags as <image name>.txt next to each saved image in your output folder (the caption format Osmium and LoRA trainers read). An existing .txt is replaced.';
  const genOut = el('div', 'wd14-results');

  genBtn.addEventListener('click', async () => {
    const items = opts.lastSaved();
    if (!items.length) { opts.log('WD14: nothing generated (and saved) yet in this session.'); return; }
    genBtn.disabled = true;
    genOut.innerHTML = '';
    try {
      for (const it of items) {
        genBtn.textContent = `Tagging ${it.label}…`;
        let tags: string;
        try { tags = await tagOne(it.relPath.split('/').pop() || 'image.png', it.bytes); }
        catch (e) { opts.log(`WD14: ${it.label} failed: ${e instanceof Error ? e.message : String(e)}`); continue; }
        genOut.appendChild(resultBlock(it.label, tags));
        if (genTxt.checked) {
          const rel = txtPathFor(it.relPath);
          try { await opts.writeOutput(rel, utf8Base64(tags), 'text/plain'); opts.log(`Saved ${rel}`); }
          catch (e) { opts.log(`WD14: couldn't save ${rel}: ${e instanceof Error ? e.message : String(e)}`); }
        }
      }
    } finally {
      genBtn.disabled = false;
      genBtn.textContent = 'Tag last generation';
    }
  });

  // ---- an imported image ----
  const impHead = el('div', 'usdu-sec-head', 'Tag an image');
  const impRow = el('div', 'row');
  const pickBtn = el('button', '', 'Choose image…'); pickBtn.type = 'button';
  pickBtn.title = 'Any PNG, JPG or WebP — e.g. a reference you want a prompt for.';
  const tagBtn = el('button', '', 'Tag it'); tagBtn.type = 'button';
  tagBtn.title = 'Run WD14 on the chosen image.';
  impRow.append(pickBtn, tagBtn);
  const pickedName = el('div', 'muted small usdu-picked', 'No image chosen.');
  const fileInput = el('input'); fileInput.type = 'file'; fileInput.accept = 'image/png,image/jpeg,image/webp'; fileInput.hidden = true;
  const tagsBox = el('textarea', 'wd14-tags');
  tagsBox.rows = 4;
  tagsBox.placeholder = 'Tags appear here. You can edit them before using or saving.';
  tagsBox.title = 'The tags, editable: what you change here is what Copy, Use as prompt and Save use.';
  const actRow = el('div', 'row wd14-actions');
  const copyBtn = el('button', '', 'Copy'); copyBtn.type = 'button'; copyBtn.title = 'Copy the tags to the clipboard.';
  const useBtn = el('button', '', 'Use as prompt'); useBtn.type = 'button';
  useBtn.title = 'Put the tags into the prompt: sorted into the prompt boxes (or the single prompt box), replacing what is there. Your Global field (artist/style), Character trigger, Negative, models and LoRAs are kept.';
  const nextBtn = el('button', '', 'Save .txt next to the image'); nextBtn.type = 'button';
  nextBtn.title = 'Writes <image name>.txt in the image\'s own folder.';
  const copyOutBtn = el('button', '', 'Save copy + .txt to output'); copyOutBtn.type = 'button';
  copyOutBtn.title = 'Copies the image and a same-name .txt into a Tagged folder in your output folder.';
  actRow.append(copyBtn, useBtn);
  if (opts.saveNextToOriginal) actRow.appendChild(nextBtn);
  actRow.appendChild(copyOutBtn);

  let picked: Wd14PickedImage | null = null;
  const setPicked = (p: Wd14PickedImage | null) => { picked = p; pickedName.textContent = p ? p.name : 'No image chosen.'; tagsBox.value = ''; };
  pickBtn.addEventListener('click', async () => {
    if (opts.pickImage) { const p = await opts.pickImage(); if (p) setPicked(p); }
    else fileInput.click();
  });
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files && fileInput.files[0];
    fileInput.value = '';
    if (f) setPicked({ name: f.name, bytes: new Uint8Array(await f.arrayBuffer()) });
  });
  tagBtn.addEventListener('click', async () => {
    if (!picked) { opts.log('WD14: choose an image first.'); return; }
    tagBtn.disabled = true; tagBtn.textContent = 'Tagging…';
    try { tagsBox.value = await tagOne(picked.name, picked.bytes); }
    catch (e) { opts.log(`WD14: ${e instanceof Error ? e.message : String(e)}`); }
    finally { tagBtn.disabled = false; tagBtn.textContent = 'Tag it'; }
  });
  const currentTags = () => tagsBox.value.trim();
  copyBtn.addEventListener('click', async () => {
    if (!currentTags()) return;
    try { await navigator.clipboard.writeText(currentTags()); opts.log('Tags copied.'); }
    catch { tagsBox.select(); document.execCommand('copy'); opts.log('Tags copied.'); }
  });
  useBtn.addEventListener('click', () => { if (currentTags()) opts.usePrompt(currentTags()); });
  nextBtn.addEventListener('click', async () => {
    if (!picked || !currentTags() || !opts.saveNextToOriginal) return;
    if (!picked.token) { opts.log('WD14: this image can\'t be written next to (pick it again).'); return; }
    let r = await opts.saveNextToOriginal(picked.token, currentTags(), false);
    if (!r.ok && r.exists) {
      if (!confirm(`${txtPathFor(picked.name)} already exists next to the image. Replace it?`)) return;
      r = await opts.saveNextToOriginal(picked.token, currentTags(), true);
    }
    opts.log(r.ok ? `Saved ${r.path || txtPathFor(picked.name)}` : `WD14: couldn't save the .txt: ${r.error || 'unknown error'}`);
  });
  copyOutBtn.addEventListener('click', async () => {
    if (!picked || !currentTags()) return;
    const safe = picked.name.replace(/[\\/:*?"<>|]+/g, '_');
    const rel = `Tagged/${safe}`;
    const mime = /\.png$/i.test(safe) ? 'image/png' : /\.webp$/i.test(safe) ? 'image/webp' : 'image/jpeg';
    try {
      let bin = '';
      for (let i = 0; i < picked.bytes.length; i += 0x8000) bin += String.fromCharCode(...picked.bytes.subarray(i, i + 0x8000));
      await opts.writeOutput(rel, btoa(bin), mime);
      await opts.writeOutput(txtPathFor(rel), utf8Base64(currentTags()), 'text/plain');
      opts.log(`Saved ${rel} and ${txtPathFor(rel)}`);
    } catch (e) { opts.log(`WD14: couldn't save to the output folder: ${e instanceof Error ? e.message : String(e)}`); }
  });

  function resultBlock(label: string, tags: string): HTMLElement {
    const b = el('div', 'wd14-result');
    const h = el('div', 'muted small', label);
    const t = el('div', 'wd14-result-tags', tags);
    b.append(h, t);
    return b;
  }

  host.append(grid, refreshRow, genHead, genRow, genTxtLabel, genOut, impHead, impRow, pickedName, fileInput, tagsBox, actRow);
  return { refresh: () => { /* fields are plain; nothing to re-derive */ } };
}
