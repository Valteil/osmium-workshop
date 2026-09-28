// Generation parameters beside a gallery image (desktop only).
//
// ComfyUI's SaveImage embeds the queued prompt graph in every PNG ("prompt"
// tEXt chunk), so the lightbox can show how any generation was made without
// side files. What the graph can't say is WHICH save node wrote a given file:
// pass 1 and pass 2 share one filename prefix. So the Bridge stamps each file
// it saves with its own `comfybridge_output` chunk (stampOutputKind) —
// generations saved before that show "not recorded" for 2-Pass images.
import { extractPngTextChunks } from '../comfy-core';

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

// `relPath`: the image's path inside the output folder, shown under the title
// (the file name, with its folders greyed before it).
export function buildGenInfoPanel(src: string, onUse: (prompt: Record<string, any>) => void, relPath = ''): HTMLElement | null {
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
  use.addEventListener('click', () => onUse(p));
  panel.appendChild(use);

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
  return panel;
}
