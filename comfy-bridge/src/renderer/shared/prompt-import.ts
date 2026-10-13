// Importing a generation's prompt from ANY image, and splitting one prompt
// into the prompt boxes (shared by the desktop and Android shells).
//
// 1. imageMetadataTexts(bytes): every embedded text a generator writes —
//    PNG tEXt/iTXt chunks, and for JPEG/WebP the EXIF UserComment (A1111),
//    ImageDescription, and ComfyUI's "prompt:"/"workflow:" EXIF tags.
// 2. normalizeGeneration(texts): the generation as a prompt shaped like the
//    Bridge's own workflow (node ids from comfy-core's template), so every
//    import path keeps working unchanged:
//    - the Bridge workflow itself: returned as-is;
//    - any other ComfyUI workflow: traced from every sampler-like node's
//      positive/negative input upstream, collecting each text input on the
//      way (the user's design: list all text inputs of the nodes hooked into
//      the positive and negative prompts);
//    - A1111/Forge/SD.Next "parameters", NovelAI, InvokeAI and SwarmUI.
//    Foreign results carry `__source` (a label); their prompt sits in
//    Character's node 11 (like a single-box image), the negative in 16.
// 3. splitPromptToFields(text): Osmium's Tag Sorting classifier
//    (tag-categories-data.ts, synced from the root app) plus the Bridge's own
//    Rating/Global/Chest/Extra boxes and Danbooru's tag categories.
import { extractPngTextChunks } from '../../comfy-core';
import { TAG_CATEGORY_SEEDS, TAG_CATEGORY_RULES, type TagCategoryId } from './tag-categories-data';
import { allTags } from './tag-wiki';
import { comfyGraphLoras, a1111Loras, invokeLoras, swarmLoras, type LoraRef } from './lora-lookup';

type Prompt = Record<string, any>;

// ---- 1. Embedded texts ------------------------------------------------------

const latin1 = (u8: Uint8Array): string => new TextDecoder('latin1').decode(u8);

// TIFF/EXIF block (starting at its byte-order mark): the text tags generators
// use. UserComment (0x9286) is A1111's "parameters"; ComfyUI's WebP saver
// writes "prompt:{…}" / "workflow:{…}" into Model/Make (0x0110/0x010F) and
// the tags just below them.
function exifTexts(tiff: Uint8Array): Record<string, string> {
  const out: Record<string, string> = {};
  if (tiff.length < 8) return out;
  const le = tiff[0] === 0x49 && tiff[1] === 0x49;
  if (!le && !(tiff[0] === 0x4d && tiff[1] === 0x4d)) return out;
  const view = new DataView(tiff.buffer, tiff.byteOffset, tiff.byteLength);
  const u16 = (o: number) => view.getUint16(o, le);
  const u32 = (o: number) => view.getUint32(o, le);
  const TYPE_SIZE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };
  const readIfd = (off: number, depth: number): void => {
    if (depth > 2 || off <= 0 || off + 2 > tiff.length) return;
    const n = u16(off);
    for (let i = 0; i < n; i++) {
      const e = off + 2 + i * 12;
      if (e + 12 > tiff.length) return;
      const tag = u16(e), type = u16(e + 2), count = u32(e + 4);
      const size = (TYPE_SIZE[type] || 1) * count;
      const dataOff = size <= 4 ? e + 8 : u32(e + 8);
      if (dataOff + size > tiff.length) continue;
      const data = tiff.subarray(dataOff, dataOff + size);
      if (tag === 0x8769) { readIfd(u32(e + 8), depth + 1); continue; } // Exif sub-IFD
      if (tag === 0x9286 && size > 8) {
        const head = latin1(data.subarray(0, 8)).replace(/\0+$/, '');
        const body = data.subarray(8);
        let text = '';
        if (head === 'UNICODE') {
          // UTF-16; piexif (A1111) writes big-endian. Sniff the first unit.
          const be = body.length >= 2 ? (body[0] === 0 && body[1] !== 0) || !(body[0] !== 0 && body[1] === 0) : true;
          text = new TextDecoder(be ? 'utf-16be' : 'utf-16le').decode(body);
        } else {
          text = new TextDecoder().decode(body);
        }
        text = text.replace(/\0+$/, '').trim();
        if (text) out.parameters = text;
      } else if (type === 2 && size > 0) {
        const s = new TextDecoder().decode(data).replace(/\0+$/, '').trim();
        const m = /^(prompt|workflow):\s*([\s\S]+)$/i.exec(s);
        if (m) out[m[1].toLowerCase()] = m[2];
        else if (tag === 0x010e && s) out.ImageDescription = s;
      }
    }
  };
  readIfd(u32(4), 0);
  return out;
}

// Every embedded text of a PNG, JPEG or WebP, keyed like PNG chunk keywords.
// `inflate` (optional) decodes compressed PNG iTXt (zlib), as in comfy-core.
export function imageMetadataTexts(bytes: Uint8Array, inflate?: (d: Uint8Array) => Uint8Array): Record<string, string> {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50) return extractPngTextChunks(bytes, inflate);
  // JPEG: APP1 "Exif\0\0" segment, plus any COM comment.
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    const out: Record<string, string> = {};
    let off = 2;
    while (off + 4 <= bytes.length && bytes[off] === 0xff) {
      const marker = bytes[off + 1];
      if (marker === 0xda || marker === 0xd9) break; // image data / end
      const len = (bytes[off + 2] << 8) | bytes[off + 3];
      const seg = bytes.subarray(off + 4, off + 2 + len);
      if (marker === 0xe1 && latin1(seg.subarray(0, 6)) === 'Exif\0\0') Object.assign(out, exifTexts(seg.subarray(6)));
      else if (marker === 0xfe) { const c = new TextDecoder().decode(seg).trim(); if (c) out.comment = c; }
      off += 2 + len;
    }
    return out;
  }
  // WebP: RIFF container with an "EXIF" chunk (with or without "Exif\0\0").
  if (latin1(bytes.subarray(0, 4)) === 'RIFF' && latin1(bytes.subarray(8, 12)) === 'WEBP') {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let off = 12;
    while (off + 8 <= bytes.length) {
      const id = latin1(bytes.subarray(off, off + 4));
      const len = view.getUint32(off + 4, true);
      if (id === 'EXIF') {
        let d = bytes.subarray(off + 8, off + 8 + len);
        if (latin1(d.subarray(0, 6)) === 'Exif\0\0') d = d.subarray(6);
        return exifTexts(d);
      }
      off += 8 + len + (len & 1);
    }
  }
  return {};
}

// ---- 2. Normalizing any generation -------------------------------------------

export interface ForeignParams {
  positive: string; negative: string;
  seed?: number; steps?: number; cfg?: number; width?: number; height?: number;
  sampler?: string; scheduler?: string;
  loras?: LoraRef[];
}

// Whether a prompt object is the Bridge's own workflow (its fixed node ids).
function isBridgeWorkflow(p: Prompt): boolean {
  return ['21', '11', '16', '41', '158:53', '165'].every((id) => p[id] && p[id].inputs);
}

// Whether a prompt came from somewhere other than the Bridge workflow
// (normalizeGeneration's synthetic prompt): import applies only what it has.
export function foreignSource(p: Prompt): string | null {
  return p && typeof p.__source === 'string' ? p.__source : null;
}

// A foreign generation as a Bridge-shaped prompt: the prompt in node 11 (as a
// single-box image keeps it), the negative in 16, and only the parameters the
// source actually recorded.
function bridgeShaped(source: string, f: ForeignParams): Prompt {
  const p: Prompt = { __source: source };
  p['11'] = { inputs: { value: f.positive.trim() } };
  p['16'] = { inputs: { text: f.negative.trim() } };
  // The LoRAs it used (lora-lookup.ts' promptLoras reads them back).
  p.__loras = f.loras || [];
  if (Number.isFinite(f.seed)) p['165'] = { inputs: { noise_seed: f.seed } };
  const ks: Record<string, unknown> = {};
  if (Number.isFinite(f.steps)) ks.steps = f.steps;
  if (f.scheduler) ks.scheduler = f.scheduler;
  if (Object.keys(ks).length) p['158:53'] = { inputs: ks };
  if (Number.isFinite(f.cfg)) p['158:54'] = { inputs: { cfg: f.cfg } };
  if (f.sampler) p['168:167'] = { inputs: { sampler_name: f.sampler } };
  if (Number.isFinite(f.width)) p['174:171'] = { inputs: { value: f.width } };
  if (Number.isFinite(f.height)) p['174:172'] = { inputs: { value: f.height } };
  return p;
}

const isLink = (v: unknown): v is [string, number] =>
  Array.isArray(v) && v.length === 2 && typeof v[0] === 'string' && typeof v[1] === 'number';

const POS_KEYS = new Set(['positive', 'positive_prompt', 'pos', 'cond_pos', 'conditioning_positive', 'positive_cond']);
const NEG_KEYS = new Set(['negative', 'negative_prompt', 'neg', 'cond_neg', 'conditioning_negative', 'negative_cond']);
// Text inputs worth collecting (by name). Model/file/option inputs never are.
const TEXT_KEY = /^(text|text_?[a-z0-9]+|string|string_?[a-z0-9]+|prompt|prompt_?[a-z0-9]+|positive|negative|positive_prompt|negative_prompt|value|wildcard_text|populated_text|t5xxl|clip_[lg]|tags|caption|input_text|text_input)$/i;
const NOT_TEXT_VALUE = /\.(safetensors|ckpt|pt|pth|bin|gguf|sft|onnx|png|jpe?g|webp)$/i;
// Link inputs that never lead to prompt text: following them only reaches
// models, images and latents.
const SKIP_LINKS = new Set(['model', 'clip', 'vae', 'image', 'images', 'pixels', 'latent', 'latent_image', 'samples', 'mask',
  'control_net', 'controlnet', 'clip_vision', 'clip_vision_output', 'upscale_model', 'noise', 'sigmas', 'sampler', 'guider',
  'ipadapter', 'insightface', 'style_model', 'unet', 'ckpt']);

// The user's design for complex ComfyUI workflows: from every node that takes
// a positive/negative input (samplers, guiders, ControlNet-apply nodes…),
// walk upstream and list every text input of the nodes on the way, in graph
// order. A node carrying BOTH (e.g. ControlNetApplyAdvanced) is entered on
// one side only, so the negative never leaks into the positive.
function traceComfy(p: Prompt): ForeignParams | null {
  const nodes = p as Record<string, { class_type?: string; inputs?: Record<string, unknown> }>;
  const collect = (polarity: 'pos' | 'neg'): string[] => {
    const own = polarity === 'pos' ? POS_KEYS : NEG_KEYS;
    const other = polarity === 'pos' ? NEG_KEYS : POS_KEYS;
    const texts: string[] = [];
    const seen = new Set<string>();
    const addText = (s: string) => {
      const t = s.trim().replace(/^[,\s]+|[,\s]+$/g, '');
      if (t && !texts.includes(t)) texts.push(t);
    };
    const walk = (id: string, depth: number): void => {
      if (seen.has(id) || depth > 60) return;
      seen.add(id);
      const node = nodes[id];
      if (!node || !node.inputs) return;
      for (const [k, v] of Object.entries(node.inputs)) {
        const key = k.toLowerCase();
        if (other.has(key)) continue;
        if (typeof v === 'string') {
          if (TEXT_KEY.test(key) && !NOT_TEXT_VALUE.test(v.trim()) && !/^-?\d+(\.\d+)?$/.test(v.trim())) addText(v);
        } else if (isLink(v) && !SKIP_LINKS.has(key)) {
          walk(v[0], depth + 1);
        }
      }
    };
    for (const [, node] of Object.entries(nodes)) {
      if (!node || !node.inputs) continue;
      for (const [k, v] of Object.entries(node.inputs)) {
        if (!own.has(k.toLowerCase())) continue;
        if (typeof v === 'string') addText(v);
        else if (isLink(v)) walk(v[0], 0);
      }
    }
    // Flux-style graphs: a BasicGuider's single "conditioning" is positive.
    if (polarity === 'pos' && !texts.length) {
      for (const [, node] of Object.entries(nodes)) {
        const c = node && node.inputs && node.inputs.conditioning;
        if (node && /BasicGuider/i.test(node.class_type || '') && isLink(c)) walk(c[0], 0);
      }
    }
    return texts;
  };
  const positive = collect('pos');
  const negative = collect('neg');
  if (!positive.length && !negative.length) return null;
  // Parameters from the first sampler that has them (links to primitives
  // resolved one hop).
  const num = (v: unknown): number | undefined => {
    if (typeof v === 'number') return v;
    if (isLink(v)) {
      const src = nodes[v[0]];
      for (const x of Object.values((src && src.inputs) || {})) if (typeof x === 'number') return x;
    }
    return undefined;
  };
  const str = (v: unknown): string | undefined => {
    if (typeof v === 'string') return v;
    if (isLink(v)) {
      const src = nodes[v[0]];
      for (const x of Object.values((src && src.inputs) || {})) if (typeof x === 'string') return x;
    }
    return undefined;
  };
  const f: ForeignParams = { positive: positive.join(', '), negative: negative.join(', ') };
  for (const node of Object.values(nodes)) {
    const i = (node && node.inputs) || {};
    if (!/sampler/i.test((node && node.class_type) || '') || !('steps' in i || 'seed' in i || 'noise_seed' in i)) continue;
    f.seed ??= num(i.seed ?? i.noise_seed);
    f.steps ??= num(i.steps);
    f.cfg ??= num(i.cfg);
    f.sampler ??= str(i.sampler_name);
    f.scheduler ??= str(i.scheduler);
  }
  for (const node of Object.values(nodes)) {
    const i = (node && node.inputs) || {};
    if (/latent/i.test((node && node.class_type) || '') && typeof i.width === 'number' && typeof i.height === 'number') {
      f.width ??= i.width as number;
      f.height ??= i.height as number;
    }
  }
  return f;
}

// A1111 sampler names → ComfyUI's (sampler, scheduler). Only exact mappings;
// anything else leaves the user's sampler alone.
const A1111_SAMPLERS: Record<string, string> = {
  'euler a': 'euler_ancestral', 'euler': 'euler', 'lms': 'lms', 'heun': 'heun', 'dpm2': 'dpm_2', 'dpm2 a': 'dpm_2_ancestral',
  'dpm++ 2s a': 'dpmpp_2s_ancestral', 'dpm++ 2m': 'dpmpp_2m', 'dpm++ sde': 'dpmpp_sde', 'dpm++ 2m sde': 'dpmpp_2m_sde',
  'dpm++ 3m sde': 'dpmpp_3m_sde', 'dpm fast': 'dpm_fast', 'dpm adaptive': 'dpm_adaptive', 'lcm': 'lcm', 'ddim': 'ddim',
  'unipc': 'uni_pc', 'dpm++ 2m sde heun': 'dpmpp_2m_sde', 'euler cfg++': 'euler_cfg_pp', 'euler a cfg++': 'euler_ancestral_cfg_pp'
};
const A1111_SCHEDULERS: Record<string, string> = {
  'karras': 'karras', 'exponential': 'exponential', 'sgm uniform': 'sgm_uniform', 'simple': 'simple', 'normal': 'normal',
  'beta': 'beta', 'ddim': 'ddim_uniform', 'kl optimal': 'kl_optimal', 'linear quadratic': 'linear_quadratic'
};

// A1111/Forge/SD.Next "parameters": prompt lines, an optional "Negative
// prompt:" block, then one "Steps: …, Sampler: …" line.
function parseA1111(text: string): ForeignParams {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  let paramIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) if (/^\s*Steps:\s*\d+/.test(lines[i])) { paramIdx = i; break; }
  const body = paramIdx >= 0 ? lines.slice(0, paramIdx) : lines;
  const negAt = body.findIndex((l) => /^\s*Negative prompt:/.test(l));
  const positive = (negAt >= 0 ? body.slice(0, negAt) : body).join('\n').trim();
  const negative = negAt >= 0 ? body.slice(negAt).join('\n').replace(/^\s*Negative prompt:\s*/, '').trim() : '';
  const f: ForeignParams = { positive, negative, loras: a1111Loras(positive) };
  if (paramIdx < 0) return f;
  const params: Record<string, string> = {};
  const re = /\s*(\w[\w \-/]+):\s*("(?:\\.|[^\\"])+"|[^,]*)(?:,|$)/g; // A1111's own parameter regex
  let m: RegExpExecArray | null;
  while ((m = re.exec(lines.slice(paramIdx).join(', '))) && m[0]) params[m[1].trim().toLowerCase()] = m[2].trim().replace(/^"|"$/g, '');
  f.loras = a1111Loras(positive, params['lora hashes']);
  const n = (k: string) => (params[k] !== undefined && params[k] !== '' && Number.isFinite(Number(params[k])) ? Number(params[k]) : undefined);
  f.steps = n('steps'); f.cfg = n('cfg scale'); f.seed = n('seed');
  const size = /^(\d+)\s*x\s*(\d+)$/i.exec(params.size || '');
  if (size) { f.width = Number(size[1]); f.height = Number(size[2]); }
  let sampler = (params.sampler || '').toLowerCase();
  // Old style puts the schedule in the sampler name ("DPM++ 2M Karras").
  const suffix = / (karras|exponential)$/.exec(sampler);
  if (suffix) { sampler = sampler.slice(0, -suffix[0].length); f.scheduler = suffix[1]; }
  if (A1111_SAMPLERS[sampler]) f.sampler = A1111_SAMPLERS[sampler];
  const sched = (params['schedule type'] || '').toLowerCase();
  if (A1111_SCHEDULERS[sched]) f.scheduler = A1111_SCHEDULERS[sched];
  return f;
}

const NAI_SAMPLERS: Record<string, string> = {
  k_euler: 'euler', k_euler_ancestral: 'euler_ancestral', k_dpmpp_2m: 'dpmpp_2m', k_dpmpp_2s_ancestral: 'dpmpp_2s_ancestral',
  k_dpmpp_sde: 'dpmpp_sde', k_dpmpp_2m_sde: 'dpmpp_2m_sde', ddim: 'ddim', ddim_v3: 'ddim'
};
const INVOKE_SCHEDULERS: Record<string, [string, string?]> = {
  euler: ['euler'], euler_a: ['euler_ancestral'], euler_k: ['euler', 'karras'], heun: ['heun'], heun_k: ['heun', 'karras'],
  lms: ['lms'], lms_k: ['lms', 'karras'], ddim: ['ddim'], dpmpp_2m: ['dpmpp_2m'], dpmpp_2m_k: ['dpmpp_2m', 'karras'],
  dpmpp_2m_sde: ['dpmpp_2m_sde'], dpmpp_2m_sde_k: ['dpmpp_2m_sde', 'karras'], dpmpp_sde: ['dpmpp_sde'], dpmpp_sde_k: ['dpmpp_sde', 'karras'],
  dpmpp_2s: ['dpmpp_2s_ancestral'], dpmpp_2s_k: ['dpmpp_2s_ancestral', 'karras'], kdpm_2: ['dpm_2'], kdpm_2_a: ['dpm_2_ancestral'],
  unipc: ['uni_pc'], lcm: ['lcm']
};

function jsonOf(s: string | undefined): any {
  if (!s) return null;
  try { const v = JSON.parse(s); return v && typeof v === 'object' ? v : null; } catch { return null; }
}
const toNum = (v: unknown): number | undefined => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? undefined : Number(v));

// Any image's generation as a Bridge-shaped prompt, or null when it has none.
export function normalizeGeneration(texts: Record<string, string>): Prompt | null {
  const comfy = jsonOf(texts.prompt);
  if (comfy && !Array.isArray(comfy)) {
    if (isBridgeWorkflow(comfy)) return comfy;
    const f = traceComfy(comfy);
    if (f) return bridgeShaped('ComfyUI (another workflow)', { ...f, loras: comfyGraphLoras(comfy) });
  }
  // SwarmUI: sui_image_params (its own chunk, or inside "parameters").
  const swarm = jsonOf(texts.sui_image_params) || (jsonOf(texts.parameters) || {}).sui_image_params;
  const sp = swarm && (swarm.sui_image_params || swarm);
  if (sp && typeof sp.prompt === 'string') {
    return bridgeShaped('SwarmUI', {
      positive: sp.prompt, negative: sp.negativeprompt || '', seed: toNum(sp.seed), steps: toNum(sp.steps),
      cfg: toNum(sp.cfgscale), width: toNum(sp.width), height: toNum(sp.height),
      sampler: typeof sp.sampler === 'string' ? sp.sampler : undefined, scheduler: typeof sp.scheduler === 'string' ? sp.scheduler : undefined,
      loras: swarmLoras(sp)
    });
  }
  // InvokeAI.
  const inv = jsonOf(texts.invokeai_metadata);
  if (inv && (typeof inv.positive_prompt === 'string')) {
    const sch = INVOKE_SCHEDULERS[String(inv.scheduler || '')] || [];
    return bridgeShaped('InvokeAI', {
      positive: inv.positive_prompt, negative: inv.negative_prompt || '', seed: toNum(inv.seed), steps: toNum(inv.steps),
      cfg: toNum(inv.cfg_scale), width: toNum(inv.width), height: toNum(inv.height), sampler: sch[0], scheduler: sch[1],
      loras: invokeLoras(inv)
    });
  }
  // NovelAI: Comment JSON (prompt, uc, steps, scale, seed, sampler).
  const nai = jsonOf(texts.Comment);
  if (nai && typeof nai.prompt === 'string') {
    const sch = String(nai.noise_schedule || '');
    return bridgeShaped('NovelAI', {
      positive: nai.prompt, negative: nai.uc || '', seed: toNum(nai.seed), steps: toNum(nai.steps), cfg: toNum(nai.scale),
      width: toNum(nai.width), height: toNum(nai.height), sampler: NAI_SAMPLERS[String(nai.sampler || '')],
      scheduler: sch === 'karras' || sch === 'exponential' ? sch : undefined
    });
  }
  // A1111 / Forge / SD.Next (also Fooocus' JSON "parameters").
  if (texts.parameters) {
    const fo = jsonOf(texts.parameters);
    if (fo && typeof fo.prompt === 'string') {
      return bridgeShaped('Fooocus', { positive: fo.prompt, negative: fo.negative_prompt || '', seed: toNum(fo.seed), steps: toNum(fo.steps), cfg: toNum(fo.guidance_scale) });
    }
    const f = parseA1111(texts.parameters);
    if (f.positive || f.negative) return bridgeShaped('A1111 / Forge', f);
  }
  return null;
}

// ---- 3. Splitting one prompt into the boxes ----------------------------------

// The Bridge's prompt boxes (element ids), in the workflow's order.
export type PromptFieldId = 'global' | 'rating' | 'character' | 'hair' | 'face' | 'chest' | 'body' | 'clothes' | 'limbs'
  | 'sexual' | 'pose' | 'extra' | 'effects' | 'scene';

// Osmium's classifier (tag-categories.ts), minus its user overrides: exact
// Danbooru-group seed, then precedence-ordered keyword rules, then other.
const RULE_MATCHERS: { id: TagCategoryId; res: RegExp[] }[] = TAG_CATEGORY_RULES.map((rule) => ({
  id: rule.id,
  res: rule.keywords.map((k) => new RegExp(`(?:^|[^a-z0-9])${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:$|[^a-z0-9])`))
}));
const CLOTHES_RULE = (RULE_MATCHERS.find((r) => r.id === 'clothes') || { res: [] as RegExp[] }).res;
function osmiumCategory(t: string): TagCategoryId {
  const seeded = TAG_CATEGORY_SEEDS[t];
  if (seeded) return seeded;
  for (const rule of RULE_MATCHERS) if (rule.res.some((re) => re.test(t))) return rule.id;
  return 'other';
}
const FROM_OSMIUM: Record<TagCategoryId, PromptFieldId> = {
  character: 'character', hair: 'hair', body: 'body', face: 'face', clothes: 'clothes', limbs: 'limbs',
  sexual: 'sexual', pose: 'pose', scene: 'scene', effects: 'effects', other: 'extra'
};

// The Bridge's corrections on top of Osmium's classifier, from a review of the
// 500 most-used Danbooru tags (2026-10-13). Osmium's seed data inherits
// Danbooru's "Sexual" group, which lists fanservice tags (bare shoulders,
// tail, midriff…), and a few odd group memberships (ribbon → pose, weapon →
// body). Osmium's own Tag Sorting keeps its behaviour; only the prompt boxes
// use these. Keys are tag cores (lowercase, spaces).
const BRIDGE_TAG_FIELDS: Record<string, PromptFieldId> = {};
const fieldList = (field: PromptFieldId, tags: string) => { for (const t of tags.split('|')) BRIDGE_TAG_FIELDS[t] = field; };
fieldList('body', 'tail|cat tail|fox tail|horse tail|wolf tail|dragon tail|demon tail|multiple tails|horns|demon horns|wings|halo|' +
  'bare shoulders|bare arms|bare legs|bare back|midriff|navel|stomach|armpits|barefoot|feet|toes|soles|collarbone|muscular|' +
  'muscular male|muscular female|abs|scar|piercing|tattoo|mole|plump|curvy|wide hips|thick thighs|skindentation|wet|sweat|' +
  'shiny skin|dark skin|pale skin|blood');
fieldList('chest', 'breasts|large breasts|medium breasts|small breasts|huge breasts|gigantic breasts|flat chest|cleavage|' +
  'sideboob|underboob|pectorals|covered nipples|nipples|areolae|breasts apart|sagging breasts');
fieldList('sexual', 'penis|pussy|testicles|anus|erection|cameltoe|pubic hair|female pubic hair|male pubic hair|pussy juice|' +
  'hetero|yuri|yaoi|nude|completely nude|bottomless|topless|sex|vaginal|anal|oral|fellatio|cum|cum in pussy|cum on body|groping');
fieldList('clothes', 'ribbon|alternate costume|official alternate costume|cosplay|no shoes|no bra|no panties|highleg|' +
  'zettai ryouiki|collar|chain|hood down|hood up|sleeveless|strapless|off shoulder|open clothes|open jacket|open shirt|' +
  'open coat|see-through clothes|cleavage cutout|clothing cutout|black hairband|hairband');
fieldList('face', ':d|:o|:3|:p|:q|;d|>_<|sweatdrop|flying sweatdrops|lips|eyelashes|makeup|lipstick|eyeshadow|tongue|' +
  'tongue out|facial mark|whisker markings|blush stickers|light blush|facial hair|beard|mustache');
fieldList('limbs', 'nail polish|fingernails|black nails|red nails|long fingernails');
fieldList('hair', 'two side up|one side up|alternate hairstyle|hair down|hair up');
fieldList('pose', 'on side|on stomach|all fours|glowing eyes');
fieldList('effects', 'glowing|depth of field|blurry|motion lines|motion blur|sparkle|lens flare|chromatic aberration|' +
  'light particles|light rays|sunbeam|bokeh|film grain|heart|star (symbol)|musical note|spoken heart|sketch|chibi|monochrome|greyscale|spot color|border|white border');
fieldList('scene', 'day|night|sunset|sunrise|evening|morning|dusk|dawn|twilight|bed|bed sheet|chair|pillow|stuffed toy|' +
  'couch|table|window|curtains|beach|portrait|close-up|from front|straight-on');
fieldList('character', 'loli|shota|virtual youtuber|cat girl|fox girl|dog girl|wolf girl|horse girl|demon girl|furry|' +
  'monster girl|siblings|sisters|twins|pokemon (creature)');
fieldList('extra', 'weapon|sword|gun|book|phone|cellphone|smartphone|bag|umbrella|censored|uncensored|mosaic censoring|bar censor|' +
  'comic|speech bubble|english text|artist name|signature|watermark|twitter username|dated|character name|copyright name');
// Bridge-only, after Osmium's call: these never belong where Osmium's
// sexual seed puts them.
const ACTION = /(grab|grabbing|suck|press|squeez|fondl|lick|bit(e|ing)|hold|touch|rest|between|another's|paizuri|job|fuck)/;

const RATINGS = new Set(['general', 'sensitive', 'questionable', 'explicit', 'safe', 'nsfw', 'sfw', 'suggestive']);
// Quality / aesthetic / meta words: the Global box ("your quality words",
// per the Bridge's Help). Danbooru drops meta tags from its list, so these
// can't come from the tag categories.
const QUALITY = new Set(['masterpiece', 'best quality', 'high quality', 'good quality', 'normal quality', 'low quality', 'worst quality',
  'bad quality', 'amazing quality', 'great quality', 'very aesthetic', 'aesthetic', 'displeasing', 'very displeasing', 'absurdres',
  'highres', 'lowres', 'incredibly absurdres', 'ultra detailed', 'extremely detailed', 'highly detailed', 'very detailed', 'detailed',
  'hd', '4k', '8k', 'uhd', 'newest', 'recent', 'mid', 'early', 'old', 'oldest', 'official art', 'very awa', 'high score', 'great score',
  'good score', 'normal score', 'bad score', 'worst score', 'best aesthetic', 'anime screencap', 'jpeg artifacts', 'non-web source']);
const CHEST = /(?:^|[^a-z])(breasts?|cleavage|chest|pectorals?|pecs|bust|underboob|sideboob|nipples?|areolae?)(?:$|[^a-z])/;

// A tag's bare form for lookups: weights, emphasis brackets and escapes off,
// lowercase, underscores as spaces.
function tagCore(tag: string): string {
  let t = tag.trim();
  // Emphasis brackets: "(tag)", "((tag))", "[tag]", "{tag}"; an escaped
  // "\(" is part of the tag ("star \(symbol\)"), not a bracket.
  let wrapped = false;
  for (let i = 0; i < 4 && /^[([{].*[)\]}]$/.test(t) && !/\\[)\]}]$/.test(t); i++) { t = t.slice(1, -1).trim(); wrapped = true; }
  // A weight only exists inside brackets ("(tag:1.2)"); a bare ":3" is an emoticon.
  if (wrapped) t = t.replace(/^(.+?):\s*-?\d+(\.\d+)?\s*$/, '$1');
  // A grouped "(a, b:1.2)" is classified by its first tag.
  t = t.split(',')[0];
  return t.replace(/\\([()[\]{}])/g, '$1').toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}

// A1111-only syntax ComfyUI can't use: extra networks and BREAK.
export function stripA1111Syntax(text: string): { text: string; loras: string[] } {
  const loras: string[] = [];
  const out = text
    .replace(/<(lora|lyco|hypernet):([^:>]+)(?::[^>]*)?>/gi, (_m, _k, name) => { loras.push(String(name).trim()); return ''; })
    .replace(/\bBREAK\b/g, ',');
  return { text: out.replace(/\s*,(\s*,)+/g, ',').replace(/^[\s,]+|[\s,]+$/g, ''), loras };
}

// Commas and newlines separate tags, except inside ( ) [ ] { } groups.
function splitTags(text: string): string[] {
  const out: string[] = [];
  let depth = 0, cur = '';
  for (const ch of text) {
    if ('([{'.includes(ch)) depth++;
    else if (')]}'.includes(ch)) depth = Math.max(0, depth - 1);
    if ((ch === ',' || ch === '\n') && depth === 0) { if (cur.trim()) out.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

function classifyTagSync(tag: string, meta?: Map<string, { category: number }>): PromptFieldId {
  const t = tagCore(tag);
  if (!t) return 'extra';
  if (RATINGS.has(t) || /^rating[: ]/.test(t)) return 'rating';
  // (underscores are spaces by now: score_8_up → "score 8 up")
  if (QUALITY.has(t) || /^(score \d+( up)?|source [a-z]+|year \d{4}|\d{4}s? \(style\)|artist:.+|by .+|@.+)$/.test(t)) return 'global';
  const fixed = BRIDGE_TAG_FIELDS[t];
  if (fixed) return fixed;
  const dan = meta && meta.get(t.replace(/ /g, '_'));
  if (dan) {
    if (dan.category === 1 || dan.category === 5) return 'global'; // artist, meta
    if (dan.category === 3 || dan.category === 4) return 'character'; // copyright, character
  }
  // A sentence (natural-language prompt), not a tag: no box fits it.
  if (!dan && !TAG_CATEGORY_SEEDS[t] && t.split(' ').length >= 5) return 'extra';
  const cat = osmiumCategory(t);
  if ((cat === 'body' || cat === 'sexual') && CHEST.test(t) && !ACTION.test(t)) return 'chest';
  // Osmium's sexual/pose seeds sweep in clothing ("open shirt", "sleeveless dress").
  if ((cat === 'sexual' || cat === 'pose') && CLOTHES_RULE && CLOTHES_RULE.some((re) => re.test(t))) return 'clothes';
  if (/^bare [a-z]+$/.test(t)) return 'body';
  if (cat === 'other' && /^[a-z]+ (girl|boy)$/.test(t)) return 'character'; // species: cat girl, dragon boy
  return FROM_OSMIUM[cat];
}

// One prompt sorted into the boxes: each tag (as written, weights kept) goes
// to its box, in its original order; anything unrecognised goes to Extra.
export async function splitPromptToFields(text: string): Promise<Record<PromptFieldId, string>> {
  let meta: Map<string, { category: number }> | undefined;
  try { meta = await allTags(); } catch { meta = undefined; }
  const fields = {} as Record<PromptFieldId, string[]>;
  for (const tag of splitTags(stripA1111Syntax(text).text)) {
    const id = classifyTagSync(tag, meta);
    (fields[id] ||= []).push(tag);
  }
  const out = {} as Record<PromptFieldId, string>;
  for (const id of Object.keys(fields) as PromptFieldId[]) out[id] = fields[id].join(', ');
  return out;
}
