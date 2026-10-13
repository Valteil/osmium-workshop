// Generation parameters beside a gallery image (desktop only).
//
// ComfyUI's SaveImage embeds the queued prompt graph in every PNG ("prompt"
// tEXt chunk), so the lightbox can show how any generation was made without
// side files. What the graph can't say is WHICH save node wrote a given file:
// pass 1 and pass 2 share one filename prefix. So the Bridge stamps each file
// it saves with its own `comfybridge_output` chunk (stampOutputKind) —
// generations saved before that show "not recorded" for 2-Pass images.
import { extractPngTextChunks } from '../../comfy-core';
import {
  recognizeCharacter, ratingFolder, characterIndex,
  joinNameParts, fileBaseName, safeSegment
} from './file-naming';

export type OutputKind = 'single' | 'pass1' | 'pass2' | 'upscaled';
const OUTPUT_KEY = 'comfybridge_output';
const OUTPUT_LABEL: Record<OutputKind, string> = {
  single: 'Single pass',
  pass1: 'Pass 1 (before the 2nd pass)',
  pass2: 'Pass 2 (refined)',
  upscaled: 'Upscaled',
};

// ---- PNG tEXt stamping ----

let crcTable: Uint32Array | null = null;
function crc32(bytes: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = crcTable[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// Returns the PNG with a `comfybridge_output` tEXt chunk inserted before IEND
// (or the bytes unchanged if they aren't a PNG with an IEND).
export function stampOutputKind(bytes: Uint8Array, kind: OutputKind): Uint8Array {
  const iend = bytes.length - 12;
  if (iend < 8 || String.fromCharCode(bytes[iend + 4], bytes[iend + 5], bytes[iend + 6], bytes[iend + 7]) !== 'IEND') return bytes;
  const data = new TextEncoder().encode(`${OUTPUT_KEY}\0${kind}`);
  const chunk = new Uint8Array(12 + data.length);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length);
  chunk.set([0x74, 0x45, 0x58, 0x74], 4); // "tEXt"
  chunk.set(data, 8);
  view.setUint32(8 + data.length, crc32(chunk.subarray(4, 8 + data.length)));
  const out = new Uint8Array(bytes.length + chunk.length);
  out.set(bytes.subarray(0, iend));
  out.set(chunk, iend);
  out.set(bytes.subarray(iend), iend + chunk.length);
  return out;
}

// ---- Reading a gallery image ----

function dataUrlBytes(src: string): Uint8Array | null {
  const m = /^data:[^;,]*;base64,(.*)$/.exec(src);
  if (!m) return null;
  const bin = atob(m[1]);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export interface GenInfo { prompt: Record<string, any>; kind: OutputKind | null; }

export function readGenInfo(src: string): GenInfo | null {
  const bytes = dataUrlBytes(src);
  if (!bytes) return null;
  const chunks = extractPngTextChunks(bytes);
  if (!chunks['prompt']) return null;
  try {
    const prompt = JSON.parse(chunks['prompt']);
    const k = chunks[OUTPUT_KEY] as OutputKind | undefined;
    return { prompt, kind: k && k in OUTPUT_LABEL ? k : null };
  } catch { return null; }
}

// ---- The panel ----

// The same node ids applyImportedPrompt (app.ts) reads.
const PROMPT_FIELDS: [string, string][] = [
  ['21', 'Global'], ['11', 'Character'], ['8', 'Rating'], ['12', 'Hair'], ['15', 'Face'],
  ['18', 'Chest'], ['9', 'Body'], ['6', 'Clothes'], ['20', 'Limbs'], ['14', 'Sexual'],
  ['7', 'Pose'], ['17', 'Scene'], ['13', 'Effects'], ['10', 'Extra'],
];

function isLink(v: unknown): boolean {
  return Array.isArray(v) && v.length === 2 && typeof v[0] === 'string' && typeof v[1] === 'number';
}

// ---- Save details / reorganize ----

// The panel's own move-editor. Everything is seeded from the image itself
// (its embedded prompt: the Character and Rating text, LoRA, model, sampler
// settings — "respec the filename using the original lora and such as the
// seed"), and the user re-specs: reclassify as OC, change the character,
// add or drop filename parts like the generation settings. The rating folder
// stays automatic, read from the image's Rating (or unified) text like
// everywhere else. A parse of the CURRENT location only seeds the character
// mode (OC folder -> OC, otherwise tag list) and the upscaled flag. The
// destination is always the next free counter, so a move can never land on
// an existing file (and main.ts's move-image refuses a collision anyway).
export interface GenInfoRelocation {
  move(fromRel: string, relDir: string, base: string): Promise<{ ok: boolean; newRelPath?: string; error?: string }>;
  log(msg: string): void;
  onMoved(): void;
}
type GenInfoMoveMode = 'tag' | 'oc' | 'custom';
export function buildGenInfoPanel(src: string, onUse: (prompt: Record<string, any>, promptsOnly: boolean) => void, relPath = '', relocate?: GenInfoRelocation): HTMLElement | null {
  const info = readGenInfo(src);
  const panel = document.createElement('aside');
  panel.className = 'gen-info';
  const title = document.createElement('div');
  title.className = 'gen-info-title';
  title.textContent = 'Generation';
  panel.appendChild(title);
  if (relPath) {
    const file = document.createElement('div');
    file.className = 'gen-info-file';
    file.title = relPath;
    const cut = relPath.lastIndexOf('/');
    if (cut >= 0) {
      const dir = document.createElement('span');
      dir.className = 'gen-info-file-dir';
      dir.textContent = relPath.slice(0, cut + 1);
      file.appendChild(dir);
    }
    file.appendChild(document.createTextNode(relPath.slice(cut + 1)));
    panel.appendChild(file);
  }
  if (!info) {
    const none = document.createElement('div');
    none.className = 'gen-info-empty';
    none.textContent = 'No generation settings in this image (it wasn\'t made by the integrated workflow, or another tool stripped them).';
    panel.appendChild(none);
    return panel;
  }
  const p = info.prompt;
  const inp = (id: string): Record<string, unknown> => (p[id] && p[id].inputs) || {};
  const val = (id: string, key: string): string => { const v = inp(id)[key]; return v == null || isLink(v) ? '' : String(v); };

  const section = (name: string): HTMLElement => {
    const h = document.createElement('div');
    h.className = 'gen-info-section';
    h.textContent = name;
    panel.appendChild(h);
    return h;
  };
  const row = (label: string, value: string, block = false): void => {
    if (!value) return;
    const r = document.createElement('div');
    r.className = 'gen-info-row' + (block ? ' block' : '');
    const k = document.createElement('span');
    k.className = 'gen-info-k';
    k.textContent = label;
    const v = document.createElement('span');
    v.className = 'gen-info-v';
    v.textContent = value;
    r.append(k, v);
    panel.appendChild(r);
  };

  const use = document.createElement('button');
  use.type = 'button';
  use.className = 'gen-info-use';
  use.textContent = 'Use these settings';
  use.title = 'Fill the generator with this image\'s settings (same as Import generation)';
  use.addEventListener('click', () => onUse(p, false));
  // Prompts only: the image's exact prompt fields replace the current ones
  // (no merging; a field the image left empty is cleared), everything else
  // (models, LoRAs, sampler, seeds, size, passes) stays as it is.
  const usePrompts = document.createElement('button');
  usePrompts.type = 'button';
  usePrompts.className = 'gen-info-use';
  usePrompts.textContent = 'Use these prompts';
  usePrompts.title = 'Replace only the prompt fields (and the negative) with this image\'s, keeping your current models, LoRAs and generation settings';
  usePrompts.addEventListener('click', () => onUse(p, true));
  const useRow = document.createElement('div');
  useRow.className = 'gen-info-use-row';
  useRow.append(use, usePrompts);
  panel.appendChild(useRow);

  const twoPass = !!p['195'];
  const kindLabel = info.kind ? OUTPUT_LABEL[info.kind]
    : twoPass ? 'Pass 1 or 2 (not recorded: saved before v2.0.0)'
    : p['192_upscaled'] ? 'Single pass or upscaled (not recorded: saved before v2.0.0)'
    : OUTPUT_LABEL.single;
  section('This image');
  row('Output', kindLabel);

  section('Prompt');
  for (const [id, label] of PROMPT_FIELDS) row(label, val(id, 'value'), true);
  row('Negative', val('16', 'text'), true);

  section('Models');
  row('Diffusion model', val('41', 'unet_name'));
  row('CLIP', val('249', 'clip_name'));
  row('VAE', val('47:46', 'vae_name'));
  const mainLora = val('51', 'lora_name');
  // 'Anima-n' is the template's placeholder, same exclusion as applyImportedPrompt.
  if (mainLora && mainLora !== 'None' && mainLora !== 'Anima-n') row('Main LoRA', `${mainLora}${val('248', 'strength_model') ? ` @ ${val('248', 'strength_model')}` : ''}`);
  for (const id of Object.keys(p).filter((k) => k === '237' || /^237_extra_\d+$/.test(k))) {
    for (let i = 1; i <= 4; i++) {
      const slot = String(i).padStart(2, '0');
      const name = val(id, `lora_${slot}`);
      if (name && name !== 'None') row('LoRA', `${name} @ ${val(id, `strength_${slot}`) || '0'}`);
    }
  }

  section('Sampling');
  row('Size', val('174:171', 'value') && `${val('174:171', 'value')} × ${val('174:172', 'value')}`);
  row('Seed', val('165', 'noise_seed'));
  row('Steps', val('158:53', 'steps'));
  row('CFG', val('158:54', 'cfg'));
  row('Sampler', val('168:167', 'sampler_name'));
  row('Scheduler', val('158:53', 'scheduler'));

  section('2-Pass');
  if (twoPass) {
    row('Seed', val('227', 'noise_seed'));
    row('Steps', val('195', 'steps'));
    row('Denoise', val('195', 'denoise'));
  } else row('2-Pass', 'Off');

  section('Upscale');
  if (p['upscale_model_loader']) {
    row('Model', val('upscale_model_loader', 'model_name'));
    row('Scale by', val('upscale_scale_192', 'scale_by'));
  } else row('Upscale', 'Off');

  section('Reference image');
  if (p['240']) {
    row('Strength', val('240', 'strength'));
    row('Start / end', `${val('240', 'start_percent')} – ${val('240', 'end_percent')}`);
    row('Preserve wrapper', val('240', 'preserve_wrapper'));
    row('Resize fit', val('238', 'fit'));
    row('Resize method', val('238', 'method'));
  } else row('Reference image', 'None');

  // Every node's own (non-link) settings, for anything not summarised above.
  const all = document.createElement('details');
  all.className = 'gen-info-all';
  const sum = document.createElement('summary');
  sum.textContent = 'All node settings';
  all.appendChild(sum);
  for (const id of Object.keys(p).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))) {
    const node = p[id];
    const entries = Object.entries((node && node.inputs) || {}).filter(([, v]) => !isLink(v) && v !== '');
    if (!entries.length) continue;
    const head = document.createElement('div');
    head.className = 'gen-info-node';
    head.textContent = `${(node._meta && node._meta.title) || node.class_type} (${id})`;
    all.appendChild(head);
    for (const [k, v] of entries) {
      const r = document.createElement('div');
      r.className = 'gen-info-row';
      const kk = document.createElement('span');
      kk.className = 'gen-info-k';
      kk.textContent = k;
      const vv = document.createElement('span');
      vv.className = 'gen-info-v';
      vv.textContent = typeof v === 'object' ? JSON.stringify(v) : String(v);
      r.append(kk, vv);
      all.appendChild(r);
    }
  }
  panel.appendChild(all);

  // ---- Save details / reorganize ----
  if (relocate && relPath) {
    buildRelocationSection(panel, section, relocate, relPath, info);
  }
  return panel;
}

function counterless(base: string): string {
  return (base ? `${base}_` : '') + '#####.png';
}

function buildRelocationSection(
  panel: HTMLElement,
  section: (name: string) => HTMLElement,
  relocate: GenInfoRelocation,
  relPath: string,
  info: GenInfo
): void {
  const upscaled = info.kind === 'upscaled' || /(^|\/)Upscaled(\/|$)/.test(relPath);
  section('Save details');

  // What the image says about itself (embedded prompt; missing values stay
  // empty and the matching filename parts simply drop out).
  const p = info.prompt || {};
  const inp = (id: string): Record<string, unknown> => (p[id] && p[id].inputs) || {};
  const val = (id: string, key: string): string => { const v = inp(id)[key]; return v == null || isLink(v) ? '' : String(v); };
  const characterField = val('11', 'value');
  // Per-field Rating text; unified generations keep their words in node 21.
  const ratingText = val('8', 'value') || val('21', 'value');
  const loraRaw = val('51', 'lora_name');
  const loraSeed = loraRaw && loraRaw !== 'None' && loraRaw !== 'Anima-n' ? fileBaseName(loraRaw) : '';
  const modelSeed = fileBaseName(val('41', 'unet_name'));
  const samplerSeed = val('168:167', 'sampler_name');
  const schedulerSeed = val('158:53', 'scheduler');
  const stepsSeed = val('158:53', 'steps');
  const cfgSeed = val('158:54', 'cfg');
  const seedSeed = val('165', 'noise_seed');
  const hasPrompt = !!info.prompt;

  // The image's current classification (folders before the file name; the
  // first explicit/safe is the rating, Upscaled is the kind, the next folder
  // is the character's).
  const segs = relPath.split('/');
  segs.pop();
  let ratingNow = '';
  let charNow = '';
  for (const s of segs) {
    if (!ratingNow && (s === 'explicit' || s === 'safe')) { ratingNow = s; continue; }
    if (s === 'Upscaled') continue;
    charNow = s;
    break;
  }

  const state = {
    mode: (charNow === 'OC' ? 'oc' : 'tag') as GenInfoMoveMode,
    charTag: '',
    charCustom: '',
    fnCharacter: false, fnLora: !!loraSeed,
    fnModel: true, fnSampler: true, fnScheduler: false, fnSteps: false, fnCfg: false, fnSeed: false
  };

  const cur = document.createElement('div');
  cur.className = 'gen-info-row block';
  const ck = document.createElement('span');
  ck.className = 'gen-info-k';
  ck.textContent = 'Saved under';
  const cv = document.createElement('span');
  cv.className = 'gen-info-v';
  cv.textContent = relPath;
  cur.append(ck, cv);
  panel.appendChild(cur);

  const edit = document.createElement('div');
  edit.className = 'naming-group gen-info-move-editor';

  const g1 = document.createElement('div');
  g1.className = 'naming-title';
  g1.textContent = 'Character folder';
  edit.appendChild(g1);
  const seg = document.createElement('div');
  seg.className = 'naming-seg';
  const modes: [string, string, string][] = [
    ['tag', 'Tag list', 'A Danbooru character name (defaulting to the one in the image\'s Character field)'],
    ['oc', 'OC', 'All original characters go in one OC folder'],
    ['custom', 'Custom', 'A folder name of your own']
  ];
  for (const [m, label, title] of modes) {
    const lb = document.createElement('label');
    lb.title = title;
    const r = document.createElement('input');
    r.type = 'radio';
    r.name = 'geninfo-charMode';
    r.checked = state.mode === (m as GenInfoMoveMode);
    r.addEventListener('change', () => { state.mode = m as GenInfoMoveMode; applyMode(); updatePreview(); });
    lb.append(r, document.createTextNode(label));
    seg.appendChild(lb);
  }
  edit.appendChild(seg);

  const tagWrap = document.createElement('div');
  tagWrap.className = 'naming-char-wrap';
  const tagInput = document.createElement('input');
  tagInput.type = 'text';
  tagInput.autocomplete = 'off';
  tagInput.spellcheck = false;
  tagInput.placeholder = 'Type to search Danbooru characters';
  const suggest = document.createElement('div');
  suggest.className = 'naming-suggest';
  suggest.hidden = true;
  tagWrap.appendChild(tagInput);
  tagWrap.appendChild(suggest);
  edit.appendChild(tagWrap);
  const customInput = document.createElement('input');
  customInput.type = 'text';
  customInput.spellcheck = false;
  customInput.placeholder = 'Folder name';
  customInput.style.display = 'none';
  edit.appendChild(customInput);
  const charNote = document.createElement('div');
  charNote.className = 'muted small';
  edit.appendChild(charNote);

  const g2 = document.createElement('div');
  g2.className = 'naming-title';
  g2.textContent = 'Filename';
  edit.appendChild(g2);
  const fsub = document.createElement('div');
  fsub.className = 'muted small';
  fsub.textContent = hasPrompt ? 'Seeded from this image; unticked parts drop out.' : 'No generation settings in this image — the filename parts start empty.';
  edit.appendChild(fsub);
  const toggles: [string, string, boolean, string | null, string | null][] = [
    // id-label, key, default, seed value when on, title
    ['Name', 'fnCharacter', state.fnCharacter, null, 'The character folder\'s name in the file name too'],
    ['Main LoRA', 'fnLora', state.fnLora, loraSeed || null, loraSeed ? `Main LoRA from the image: ${loraSeed}` : 'No LoRA recorded in this image'],
    ['Model', 'fnModel', state.fnModel, modelSeed || null, modelSeed ? `Model from the image: ${modelSeed}` : 'No model recorded'],
    ['Sampler', 'fnSampler', state.fnSampler, samplerSeed || null, samplerSeed ? `Sampler from the image: ${samplerSeed}` : 'No sampler recorded'],
    ['Scheduler', 'fnScheduler', state.fnScheduler, schedulerSeed || null, schedulerSeed ? `Scheduler from the image: ${schedulerSeed}` : 'No scheduler recorded'],
    ['Steps', 'fnSteps', state.fnSteps, stepsSeed || null, stepsSeed ? `Steps from the image: ${stepsSeed}` : 'No steps recorded'],
    ['CFG', 'fnCfg', state.fnCfg, cfgSeed || null, cfgSeed ? `CFG from the image: ${cfgSeed}` : 'No CFG recorded'],
    ['Seed', 'fnSeed', state.fnSeed, seedSeed || null, seedSeed ? `Seed from the image: ${seedSeed}` : 'No seed recorded']
  ];
  const subRow = document.createElement('div');
  subRow.className = 'naming-subchecks';
  for (const [label, key, checked, seedVal, title] of toggles) {
    const lb = document.createElement('label');
    if (!seedVal && key !== 'fnCharacter') {
      lb.title = title || '';
      lb.style.opacity = '.55';
    } else lb.title = title || '';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = checked;
    cb.addEventListener('change', () => { (state as any)[key] = cb.checked; updatePreview(); });
    lb.appendChild(cb);
    const span = document.createElement('span');
    span.textContent = seedVal && key !== 'fnCharacter' ? ` ${label} (${seedVal})` : ` ${label}`;
    lb.appendChild(span);
    subRow.appendChild(lb);
  }
  edit.appendChild(subRow);
  const afterSub = document.createElement('div');
  afterSub.className = 'muted small';
  afterSub.textContent = 'Then a number, always, so nothing is overwritten.';
  edit.appendChild(afterSub);
  panel.appendChild(edit);

  const pv = document.createElement('div');
  pv.className = 'gen-info-row block';
  const pk = document.createElement('span');
  pk.className = 'gen-info-k';
  pk.textContent = 'Saves as';
  const pvv = document.createElement('span');
  pvv.className = 'gen-info-v gen-info-move-preview';
  pvv.textContent = '…';
  pv.append(pk, pvv);
  panel.appendChild(pv);
  const hint = document.createElement('div');
  hint.className = 'gen-info-hint';
  hint.textContent = `${upscaled ? 'An upscaled copy' : 'This image'} keeps its kind and moves under this scheme (old file removed). The image itself is unchanged, so its recorded settings and stamp survive.`;
  panel.appendChild(hint);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'gen-info-use gen-info-move';
  btn.textContent = upscaled ? 'Move image (Upscaled folder)' : 'Move image here';
  panel.appendChild(btn);

  function applyMode(): void {
    tagWrap.style.display = state.mode === 'tag' ? '' : 'none';
    customInput.style.display = state.mode === 'custom' ? '' : 'none';
    charNote.textContent = state.mode === 'oc' ? 'Original characters all go in one OC folder.'
      : state.mode === 'custom' ? 'A folder name of your own.'
      : '';
  }
  applyMode();

  // Recognized character fills the tag field's placeholder and the preview.
  let recognized = '';
  void (async () => {
    if (!characterField) return;
    try { recognized = safeSegment(recognizeCharacter(characterField, await characterIndex())); } catch { /* tag list unavailable */ }
    charNote.textContent = state.mode === 'tag' && recognized ? `Default: ${recognized} (recognized)` : charNote.textContent;
    tagInput.placeholder = recognized ? `${recognized} (recognized)` : 'Type to search Danbooru characters';
    updatePreview();
  })();

  // The path preview: rating folder, character folder, Upscaled for a stamped
  // upscaled copy, then the seeded filename.
  async function updatePreview(): Promise<void> {
    const ratingName = ratingFolder(ratingText);
    const charName = state.mode === 'oc' ? 'OC'
      : state.mode === 'custom' ? safeSegment(state.charCustom)
      : safeSegment(state.charTag) || recognized;
    const base = joinNameParts([
      state.fnCharacter ? charName : '',
      state.fnLora ? loraSeed : '',
      state.fnModel ? modelSeed : '',
      state.fnSampler ? samplerSeed : '',
      state.fnScheduler ? schedulerSeed : '',
      state.fnSteps ? 'steps' + stepsSeed : '',
      state.fnCfg ? 'cfg' + cfgSeed : '',
      state.fnSeed ? 'seed' + seedSeed : ''
    ]);
    const relDir = [ratingName, charName].filter(Boolean).join('/');
    pvv.textContent = `${relDir || '(save location root)'}/${upscaled ? 'Upscaled/' : ''}${counterless(base)}`;
  }
  updatePreview();
  edit.addEventListener('input', updatePreview, true);
  edit.addEventListener('change', updatePreview, true);

  // Danbooru suggestions under the tag field (desktop bridge's own list).
  function hideSuggest(): void { suggest.hidden = true; suggest.innerHTML = ''; }
  tagInput.addEventListener('input', async () => {
    const q = tagInput.value.trim().toLowerCase();
    if (q.length < 2) { hideSuggest(); return; }
    let names: string[];
    try { names = (await characterIndex()).names; } catch { return; }
    if (tagInput.value.trim().toLowerCase() !== q) return;
    const starts: string[] = [];
    const contains: string[] = [];
    for (const nm of names) {
      const l = nm.toLowerCase();
      if (l.startsWith(q)) starts.push(nm);
      else if (l.includes(q)) contains.push(nm);
      if (starts.length >= 10) break;
    }
    const picks = [...starts, ...contains].slice(0, 10);
    suggest.innerHTML = '';
    if (!picks.length || (picks.length === 1 && picks[0] === tagInput.value)) { hideSuggest(); return; }
    for (const nm of picks) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'naming-suggest-item';
      b.textContent = nm;
      b.addEventListener('mousedown', (ev) => {
        ev.preventDefault();
        tagInput.value = nm;
        hideSuggest();
        updatePreview();
      });
      suggest.appendChild(b);
    }
    suggest.hidden = false;
  });
  tagInput.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') hideSuggest();
    else if (ev.key === 'Enter' && !suggest.hidden) {
      const first = suggest.querySelector<HTMLButtonElement>('.naming-suggest-item');
      if (first) { ev.preventDefault(); first.dispatchEvent(new MouseEvent('mousedown')); }
    }
  });
  tagInput.addEventListener('blur', hideSuggest);

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    pvv.textContent = 'Moving…';
    try {
      const ratingName = ratingFolder(ratingText);
      const charName = state.mode === 'oc' ? 'OC'
        : state.mode === 'custom' ? safeSegment(state.charCustom)
        : safeSegment(state.charTag) || recognized;
      const base = joinNameParts([
        state.fnCharacter ? charName : '',
        state.fnLora ? loraSeed : '',
        state.fnModel ? modelSeed : '',
        state.fnSampler ? samplerSeed : '',
        state.fnScheduler ? schedulerSeed : '',
        state.fnSteps ? 'steps' + stepsSeed : '',
        state.fnCfg ? 'cfg' + cfgSeed : '',
        state.fnSeed ? 'seed' + seedSeed : ''
      ]);
      const relDir = [ratingName, charName, upscaled ? 'Upscaled' : ''].filter(Boolean).join('/');
      const res = await relocate.move(relPath, relDir, base);
      if (!res || !res.ok) {
        pvv.textContent = (res && res.error) || 'Could not move the image.';
        relocate.log((res && res.error) || 'Could not move the image.');
        btn.disabled = false;
        return;
      }
      if (res.newRelPath) relocate.log(`Moved ${relPath} → ${res.newRelPath}`);
      else relocate.log('Already there.');
      relocate.onMoved();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      pvv.textContent = msg;
      relocate.log('Could not move the image: ' + msg);
      btn.disabled = false;
    }
  });
}
