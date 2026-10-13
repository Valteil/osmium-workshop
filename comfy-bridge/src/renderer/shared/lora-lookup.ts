// LoRAs in a generation, and looking them up (the Metadata tab; shared by the
// desktop and Android shells). DOM-free.
//
// - Detection: the Bridge workflow's own LoRA nodes (51 main, 237 stack); any
//   other ComfyUI graph (LoraLoader-style lora_name inputs, numbered stacks,
//   rgthree Power Lora Loader objects); A1111 <lora:name:w> + "Lora hashes";
//   InvokeAI; SwarmUI. prompt-import.ts attaches foreign ones as `__loras`.
// - Local match: against the LoRA list ComfyUI reports (same relative name,
//   else the same file name stem).
// - Online: CivitAI and CivArchive, by SHA-256 (exact) or by name (search).
//   Only these two sites' fixed HTTPS API URLs are ever built (lookupUrl);
//   result links are rebuilt from validated ids, never taken as given.

type Prompt = Record<string, any>;

export interface LoraRef { name: string; strength?: number; hash?: string; }

const isLink = (v: unknown): v is [string, number] =>
  Array.isArray(v) && v.length === 2 && typeof v[0] === 'string' && typeof v[1] === 'number';
const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : undefined));
const isName = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '' && !/^none$/i.test(v.trim());

function pushUnique(out: LoraRef[], ref: LoraRef): void {
  if (!ref.name) return;
  const key = ref.name.toLowerCase();
  const prev = out.find((r) => r.name.toLowerCase() === key);
  if (prev) { if (prev.strength === undefined) prev.strength = ref.strength; if (!prev.hash) prev.hash = ref.hash; return; }
  out.push(ref);
}

// The Bridge workflow's own LoRAs: Main LoRA (51, strength on 248) and the
// stack (237 + 237_extra_N, slots 01-04). 'Anima-n' is the template's
// placeholder, never a real pick.
export function bridgeWorkflowLoras(p: Prompt): LoraRef[] {
  const out: LoraRef[] = [];
  const v = (id: string, k: string) => (p[id] && p[id].inputs ? p[id].inputs[k] : undefined);
  const main = v('51', 'lora_name');
  if (isName(main) && main !== 'Anima-n') pushUnique(out, { name: main, strength: num(v('248', 'strength_model')) });
  const stack = Object.keys(p).filter((k) => k === '237' || /^237_extra_\d+$/.test(k));
  for (const id of stack) {
    for (let i = 1; i <= 4; i++) {
      const slot = String(i).padStart(2, '0');
      const name = v(id, `lora_${slot}`);
      if (isName(name)) pushUnique(out, { name, strength: num(v(id, `strength_${slot}`)) });
    }
  }
  return out;
}

// Any ComfyUI graph: every LoRA-name input of every node, with the strength
// input that goes with it (same node, matching suffix).
export function comfyGraphLoras(graph: Prompt): LoraRef[] {
  const out: LoraRef[] = [];
  for (const node of Object.values(graph)) {
    const inputs = node && (node as any).inputs;
    if (!inputs || typeof inputs !== 'object') continue;
    for (const [k, v] of Object.entries(inputs as Record<string, unknown>)) {
      // rgthree Power Lora Loader: lora_1: { on, lora, strength }.
      if (v && typeof v === 'object' && !Array.isArray(v) && isName((v as any).lora)) {
        if ((v as any).on === false) continue;
        pushUnique(out, { name: (v as any).lora, strength: num((v as any).strength) });
        continue;
      }
      if (!isName(v) || isLink(v)) continue;
      const m = /^(?:lora_name|lora)(?:_?(\d+))?$/i.exec(k);
      if (!m) continue;
      const idx = m[1];
      // A stack slot switched off (CR LoRA Stack "switch_N": "Off").
      const sw = idx ? (inputs as any)[`switch_${idx}`] ?? (inputs as any)[`switch_${Number(idx)}`] : undefined;
      if (typeof sw === 'string' && /^off$/i.test(sw)) continue;
      const strength = idx
        ? num((inputs as any)[`strength_${idx}`] ?? (inputs as any)[`lora_wt_${Number(idx)}`] ?? (inputs as any)[`model_weight_${Number(idx)}`] ?? (inputs as any)[`strength_model_${Number(idx)}`])
        : num((inputs as any).strength_model ?? (inputs as any).strength ?? (inputs as any).lora_strength);
      pushUnique(out, { name: v, strength });
    }
  }
  return out;
}

// A1111/Forge: <lora:name:weight> in the prompt, plus the "Lora hashes"
// parameter ("name: 0123abcd, other: …") naming each file's hash.
export function a1111Loras(positive: string, loraHashes?: string): LoraRef[] {
  const out: LoraRef[] = [];
  const re = /<(?:lora|lyco):([^:>]+)(?::([^:>]*))?(?::[^>]*)?>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(positive))) pushUnique(out, { name: m[1].trim(), strength: num(m[2]) });
  for (const part of String(loraHashes || '').replace(/^"|"$/g, '').split(',')) {
    const mm = /^\s*(.+?)\s*:\s*([0-9a-f]{8,64})\s*$/i.exec(part);
    if (!mm) continue;
    const ref = out.find((r) => r.name.toLowerCase() === mm[1].toLowerCase());
    if (ref) ref.hash = mm[2].toLowerCase(); else pushUnique(out, { name: mm[1], hash: mm[2].toLowerCase() });
  }
  return out;
}

export function invokeLoras(meta: any): LoraRef[] {
  const out: LoraRef[] = [];
  for (const l of Array.isArray(meta && meta.loras) ? meta.loras : []) {
    const model = (l && (l.model || l.lora)) || {};
    const name = model.name || model.model_name || model.key;
    if (isName(name)) pushUnique(out, { name, strength: num(l.weight), hash: typeof model.hash === 'string' ? model.hash.replace(/^[a-z0-9]+:/i, '') : undefined });
  }
  return out;
}

export function swarmLoras(sp: any): LoraRef[] {
  const out: LoraRef[] = [];
  const names = Array.isArray(sp && sp.loras) ? sp.loras : [];
  const weights = Array.isArray(sp && sp.loraweights) ? sp.loraweights : [];
  names.forEach((n: unknown, i: number) => { if (isName(n)) pushUnique(out, { name: n, strength: num(weights[i]) }); });
  return out;
}

// The LoRAs of any normalized generation (prompt-import's result).
export function promptLoras(p: Prompt): LoraRef[] {
  if (p && Array.isArray(p.__loras)) return p.__loras as LoraRef[];
  return p ? bridgeWorkflowLoras(p) : [];
}

// ---- matching against your LoRA folder ---------------------------------------

export function loraStem(name: string): string {
  const base = String(name || '').replace(/\\/g, '/').split('/').pop() || '';
  return base.replace(/\.(safetensors|ckpt|pt|pth|bin)$/i, '').trim().toLowerCase();
}

// The entry of ComfyUI's LoRA list this LoRA is (same relative name, else
// the same file name), or null.
export function matchLocalLora(name: string, localNames: string[]): string | null {
  const n = String(name || '').replace(/\\/g, '/').toLowerCase();
  const exact = localNames.find((l) => l.replace(/\\/g, '/').toLowerCase() === n);
  if (exact) return exact;
  const stem = loraStem(name);
  return stem ? localNames.find((l) => loraStem(l) === stem) || null : null;
}

// ---- online lookup ------------------------------------------------------------

export type LookupSite = 'civitai' | 'civarchive';
export type LookupKind = 'hash' | 'name';

// The only URLs a lookup ever requests (the desktop's main process keeps its
// own copy of this allowlist; the phone uses this one).
export function lookupUrl(site: LookupSite, kind: LookupKind, q: string): string | null {
  const s = String(q || '').trim();
  if (site === 'civitai') {
    if (kind === 'hash') return /^[0-9a-f]{8,64}$/i.test(s) ? `https://civitai.com/api/v1/model-versions/by-hash/${s}` : null;
    if (kind === 'name') return s && s.length <= 200 ? `https://civitai.com/api/v1/models?types=LORA&limit=8&query=${encodeURIComponent(s)}` : null;
  }
  if (site === 'civarchive') {
    if (kind === 'hash') return /^[0-9a-f]{64}$/i.test(s) ? `https://civarchive.com/api/sha256/${s.toLowerCase()}` : null;
    if (kind === 'name') return s && s.length <= 200 ? `https://civarchive.com/api/search?q=${encodeURIComponent(s)}` : null;
  }
  return null;
}

export interface LookupHit {
  site: 'CivitAI' | 'CivArchive';
  exact: boolean;          // found by the file's hash (vs a name search)
  title: string;
  version: string;
  baseModel: string;
  trainedWords: string[];
  url: string;             // https page on the site itself, rebuilt from ids
  nsfw: boolean;
  deleted: boolean;
  platform: string;        // CivArchive: where the file was published
  preview: string;         // a preview image URL (previewImageUrl-checked), or ''
}

const ID = /^[A-Za-z0-9_-]{1,64}$/;
const str = (v: unknown, max = 300): string => (typeof v === 'string' ? v.slice(0, max) : typeof v === 'number' ? String(v) : '');
const words = (v: unknown): string[] => (Array.isArray(v) ? v.filter((w) => typeof w === 'string' && w.trim()).map((w) => (w as string).trim().slice(0, 200)).slice(0, 30) : []);

// A link we're willing to show/open: https on the two sites only.
export function safeLookupLink(url: string): string | null {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && (u.hostname === 'civitai.com' || u.hostname === 'civarchive.com') ? u.toString() : null;
  } catch { return null; }
}

// A preview image we're willing to fetch. The sites' images live on many
// CDNs (CivitAI's, and for CivArchive whichever site the model came from:
// TensorArt, PixAI, Yodayo…), so this can't be a host allowlist: https on
// the default port, no credentials, and never a local or private address
// (the desktop's main process re-checks the resolved IP; the bytes are only
// ever shown as an image). CivitAI's and PixAI's are asked for at thumbnail size.
const LOCAL_NAME = /^(localhost|.*\.(localhost|local|internal|lan|home|arpa))$/i;
export function previewImageUrl(raw: unknown): string {
  if (typeof raw !== 'string' || raw.length > 1000) return '';
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' || u.port || u.username || u.password || !u.hostname.includes('.') || LOCAL_NAME.test(u.hostname)) return '';
    // Bare IPs (v4 or [v6]): CDNs serve previews by name.
    if (/^\d+(\.\d+){3}$/.test(u.hostname) || u.hostname.startsWith('[')) return '';
    if (u.hostname === 'image.civitai.com') u.pathname = u.pathname.replace(/\/(original=true|width=\d+)(,[^/]*)?\//, '/width=320/');
    // PixAI's full-size "orig" is served without an image type; "thumb" is a small webp.
    if (u.hostname === 'images-ng.pixai.art') u.pathname = u.pathname.replace(/^\/images\/orig\//, '/images/thumb/');
    return u.toString();
  } catch { return ''; }
}
// The first still image of a CivitAI/CivArchive image list.
function firstImage(list: unknown): string {
  for (const i of Array.isArray(list) ? list : []) {
    if (!i || typeof i !== 'object' || (i.type && i.type !== 'image')) continue;
    const url = previewImageUrl(i.url || i.image_url);
    if (url) return url;
  }
  return '';
}

// A site's JSON reply → hits (empty when nothing matched).
export function normalizeLookup(site: LookupSite, kind: LookupKind, json: any): LookupHit[] {
  if (!json || typeof json !== 'object') return [];
  const hits: LookupHit[] = [];
  const add = (h: Omit<LookupHit, 'url'> & { url: string | null }) => { const url = h.url && safeLookupLink(h.url); if (url && h.title) hits.push({ ...h, url }); };
  if (site === 'civitai' && kind === 'hash') {
    const modelId = str(json.modelId), id = str(json.id);
    if (ID.test(modelId) && ID.test(id)) {
      add({ site: 'CivitAI', exact: true, title: str(json.model && json.model.name), version: str(json.name), baseModel: str(json.baseModel),
        trainedWords: words(json.trainedWords), url: `https://civitai.com/models/${modelId}?modelVersionId=${id}`,
        nsfw: !!(json.model && json.model.nsfw), deleted: false, platform: 'civitai', preview: firstImage(json.images) });
    }
  } else if (site === 'civitai') {
    for (const item of Array.isArray(json.items) ? json.items : []) {
      const v = (Array.isArray(item.modelVersions) && item.modelVersions[0]) || {};
      const modelId = str(item.id), vid = str(v.id);
      if (!ID.test(modelId)) continue;
      add({ site: 'CivitAI', exact: false, title: str(item.name), version: str(v.name), baseModel: str(v.baseModel), trainedWords: words(v.trainedWords),
        url: `https://civitai.com/models/${modelId}` + (ID.test(vid) ? `?modelVersionId=${vid}` : ''), nsfw: !!item.nsfw, deleted: false, platform: 'civitai', preview: firstImage(v.images) });
    }
  } else if (site === 'civarchive' && kind === 'hash') {
    // CivArchive nests the matched version inside the model (model.version).
    const m = json.model || {}, v = m.version || json.version || {};
    const modelId = str(m.id), vid = str(v.id);
    if (ID.test(modelId)) {
      add({ site: 'CivArchive', exact: true, title: str(m.name), version: str(v.name), baseModel: str(v.baseModel),
        trainedWords: words(v.trainedWords || m.trainedWords), url: `https://civarchive.com/models/${modelId}` + (ID.test(vid) ? `?modelVersionId=${vid}` : ''),
        nsfw: !!(m.is_nsfw || v.is_nsfw), deleted: !!(m.deletedAt || v.deletedAt), platform: str((json.files && json.files[0] && json.files[0].source) || 'civitai'), preview: firstImage(v.images || m.images) });
    }
  } else if (site === 'civarchive') {
    for (const r of Array.isArray(json.results) ? json.results : []) {
      if (!/lora|locon|lycoris|dora/i.test(str(r.type))) continue;
      const path = str(r.url, 400);
      // A site-relative page path only: "/x…", never "//host" or a scheme.
      if (!/^\/[A-Za-z0-9][A-Za-z0-9/_?=&.-]*$/.test(path) || path.includes('//')) continue;
      add({ site: 'CivArchive', exact: false, title: str(r.name), version: '', baseModel: str(r.base_model), trainedWords: words(r.tags),
        url: `https://civarchive.com${path}`, nsfw: !!r.is_nsfw, deleted: !!r.is_deleted, platform: str(r.platform), preview: r.video_url && !r.image_url ? '' : previewImageUrl(r.image_url) });
    }
  }
  return hits.slice(0, 12);
}

// ---- a LoRA file's own metadata (the runner's lora_info) ---------------------

export interface LoraFileInfo {
  name: string; file: string; size: number; sha256: string;
  meta: Record<string, string>; top_tags: [string, number][];
}

const META_LABELS: [string, string][] = [
  ['ss_output_name', 'Output name'], ['modelspec.title', 'Title'], ['modelspec.architecture', 'Architecture'],
  ['ss_base_model_version', 'Base model'], ['modelspec.trigger_phrase', 'Trigger phrase'], ['ss_network_module', 'Network'],
  ['ss_network_dim', 'Dim'], ['ss_network_alpha', 'Alpha'], ['ss_num_epochs', 'Epochs'], ['ss_steps', 'Steps'],
  ['modelspec.resolution', 'Resolution'], ['ss_resolution', 'Resolution'], ['ss_learning_rate', 'Learning rate'],
  ['ss_optimizer', 'Optimizer'], ['ss_training_comment', 'Comment'], ['modelspec.description', 'Description']
];
// The file's metadata as labelled rows, in a fixed order.
export function loraMetaRows(info: LoraFileInfo): [string, string][] {
  const rows: [string, string][] = [];
  const seen = new Set<string>();
  for (const [k, label] of META_LABELS) {
    const v = info.meta && info.meta[k];
    if (v && !seen.has(label)) { rows.push([label, v]); seen.add(label); }
  }
  return rows;
}
