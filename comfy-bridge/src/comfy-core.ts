// GENERATED FILE — do not edit. Synced from ../../src/comfy-core.ts by
// scripts/sync-comfy-core.js. Edit the root file and re-run the sync.

// Canonical, transport-agnostic pieces of the ComfyUI protocol, shared by the
// root app (src/main.ts over Node http/https, and src/renderer/comfy-client.ts
// over browser fetch) and — via a synced copy — Comfy Bridge.
//
// Pure functions only: no Node or DOM imports, so every runtime can consume the
// same source. Keep it that way; anything needing a transport or the DOM stays
// at the call site.

export interface ComfyObjectInfoNode {
  input?: { required?: Record<string, unknown> };
}

// A combo widget's option list sits in one of two shapes depending on which
// ComfyUI schema version the reporting node was last touched under: classic
// `[[...options], {meta}]` (element 0 IS the array — most nodes) or the newer
// typed-widget `["COMBO", {options:[...]}]` (element 0 is the literal string
// "COMBO", the real list nested at element 1's `options`). UpscaleModelLoader
// reports the newer shape even on a build where every other node uses the
// classic one, so a classic-only parser silently returns nothing for it.
// See notes/Pitfalls/Comfyui-Combo-Widget-Shape-Not-Uniform.
export function parseComboValues(nodeInfo: ComfyObjectInfoNode | undefined, inputName: string): string[] | null {
  const raw = nodeInfo?.input?.required?.[inputName];
  if (!Array.isArray(raw)) return null;
  if (Array.isArray(raw[0])) return raw[0] as string[];
  const second = raw[1] as { options?: unknown } | undefined;
  if (raw[0] === 'COMBO' && second && Array.isArray(second.options)) return second.options as string[];
  return null;
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) { out.set(p, offset); offset += p.length; }
  return out;
}

// Hand-built multipart/form-data body (no form-data dependency). Returns raw
// bytes so a Node Buffer (which is a Uint8Array) or a browser Blob can wrap it.
export function buildMultipart(
  fields: Record<string, string>,
  fileField: string,
  fileName: string,
  fileBytes: Uint8Array
): { boundary: string; body: Uint8Array } {
  const boundary = '----DTSBoundary' + Date.now().toString(16) + Math.random().toString(16).slice(2);
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [];
  for (const [key, value] of Object.entries(fields)) {
    parts.push(encoder.encode(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`));
  }
  const safeName = String(fileName).replace(/"/g, '');
  parts.push(encoder.encode(`--${boundary}\r\nContent-Disposition: form-data; name="${fileField}"; filename="${safeName}"\r\nContent-Type: application/octet-stream\r\n\r\n`));
  parts.push(fileBytes);
  parts.push(encoder.encode(`\r\n--${boundary}--\r\n`));
  return { boundary, body: concatBytes(parts) };
}

// ---- SynthDat prompt builder ----
// Clones the fixed workflow template and fills it in from a normalized config.
// Pure: the caller reads its own UI into SynthDatPromptConfig (string fields
// pre-trimmed via its own fieldValue(); numeric/LoRA fields raw — this parses
// them exactly as the original per-app builders did). Root passes
// noLoraStandIn 'None', Comfy Bridge 'Anima-n' (a real no-op entry in that
// combo list); root omits `upscale` (SynthDat has no upscale step).

import type { SynthDatPrompt } from './shared-types';

export interface SynthDatLoraRow {
  input: string;
  strength: string;
}

export interface SynthDatUpscaleConfig {
  enabled: boolean;
  model: string;
  scaleBy: string;
}

export interface SynthDatPromptConfig {
  unified: boolean;
  global: string; rating: string; character: string; characterTrigger: string; unifiedPrompt: string;
  hair: string; face: string; chest: string; body: string; clothes: string;
  limbs: string; sexual: string; pose: string; extra: string; effects: string; scene: string;
  negative: string;
  diffModel: string; mainLora: string; clip: string; vae: string;
  loraRows: SynthDatLoraRow[];
  noLoraStandIn: string;
  skipRefImage: boolean;
  lliteStrength: string; lliteStartPercent: string; lliteEndPercent: string; llitePreserveWrapper: boolean;
  resizeFit: string; resizeMethod: string;
  sampler: string; scheduler: string; steps1: string; cfg1: string;
  width: string; height: string; seed1: string;
  use2Pass: boolean; seed2: string; denoise2: string; steps2: string;
  upscale?: SynthDatUpscaleConfig;
}

export function buildSynthDatPrompt(template: SynthDatPrompt, cfg: SynthDatPromptConfig): SynthDatPrompt {
  const prompt: SynthDatPrompt = JSON.parse(JSON.stringify(template));
  const character = [cfg.unified ? cfg.unifiedPrompt : cfg.character, cfg.characterTrigger].filter(Boolean).join(', ');

  prompt['21'].inputs.value = cfg.global;
  prompt['8'].inputs.value = cfg.unified ? '' : cfg.rating;
  prompt['19'].inputs.value = ''; // Character Count folded into Character (see above)
  prompt['11'].inputs.value = character;
  prompt['12'].inputs.value = cfg.unified ? '' : cfg.hair;
  prompt['15'].inputs.value = cfg.unified ? '' : cfg.face;
  prompt['18'].inputs.value = cfg.unified ? '' : cfg.chest;
  prompt['9'].inputs.value = cfg.unified ? '' : cfg.body;
  prompt['6'].inputs.value = cfg.unified ? '' : cfg.clothes;
  prompt['20'].inputs.value = cfg.unified ? '' : cfg.limbs;
  prompt['14'].inputs.value = cfg.unified ? '' : cfg.sexual;
  prompt['7'].inputs.value = cfg.unified ? '' : cfg.pose;
  prompt['10'].inputs.value = cfg.unified ? '' : cfg.extra;
  prompt['13'].inputs.value = cfg.unified ? '' : cfg.effects;
  prompt['17'].inputs.value = cfg.unified ? '' : cfg.scene;
  prompt['16'].inputs.text = cfg.negative;

  prompt['41'].inputs.unet_name = cfg.diffModel;
  // An empty string isn't a valid value for this combo input, so leaving Main
  // LoRA blank to mean "skip it" sent ComfyUI something it rejected outright.
  prompt['51'].inputs.lora_name = cfg.mainLora.trim() || cfg.noLoraStandIn;
  // The template has two CLIPLoader nodes (249, 47:45) both loading the same
  // file — kept in sync here rather than exposed as two separate fields.
  if (cfg.clip) { prompt['249'].inputs.clip_name = cfg.clip; prompt['47:45'].inputs.clip_name = cfg.clip; }
  if (cfg.vae) prompt['47:46'].inputs.vae_name = cfg.vae;

  // First 4 LoRA rows fill the template's own stack node (237) directly. Any
  // rows beyond that chain additional stack node clones, each one's model
  // input wired to the previous stack's output.
  const chunks: SynthDatLoraRow[][] = [];
  for (let i = 0; i < cfg.loraRows.length; i += 4) chunks.push(cfg.loraRows.slice(i, i + 4));
  function fillStackInputs(inputs: Record<string, unknown>, chunk: SynthDatLoraRow[]): void {
    for (let i = 0; i < 4; i++) {
      const slot = String(i + 1).padStart(2, '0');
      const r = chunk[i];
      inputs[`lora_${slot}`] = r ? (r.input.trim() || 'None') : 'None';
      inputs[`strength_${slot}`] = r ? (parseFloat(r.strength) || 0) : 0;
    }
  }
  // Always filled, even with zero rows — node 237 otherwise keeps whatever
  // LoRAs were baked into the captured template's own JSON.
  let lastStackId = '237';
  fillStackInputs(prompt['237'].inputs, chunks[0] || []);
  for (let c = 1; c < chunks.length; c++) {
    const newId = `237_extra_${c}`;
    const newInputs: Record<string, unknown> = { model: [lastStackId, 0], clip: ['47:45', 0] };
    fillStackInputs(newInputs, chunks[c]);
    prompt[newId] = { class_type: 'DSM Lora Loader Stack', inputs: newInputs, _meta: { title: 'DSM Lora Loader Stack' } };
    lastStackId = newId;
  }
  if (lastStackId !== '237') {
    prompt['243'].inputs.input1 = [lastStackId, 0];
    prompt['240'].inputs.model = [lastStackId, 0];
    prompt['195'].inputs.model = [lastStackId, 0];
  }

  if (cfg.skipRefImage) {
    // No reference image: remove the ControlNet path (LoadImage + AnimaLLLiteApply
    // + the switch) from the graph rather than flipping DSM Switch (Any)'s
    // `select` — ComfyUI resolves what to run from the graph's edges, so a
    // connected-but-unselected branch still executes. Image Resize (238) and
    // its PreviewImage (246) depend on LoadImage's output too, and a
    // PreviewImage is an output node ComfyUI validates independently, so a
    // dangling reference to a deleted 239 would fail prompt validation.
    delete prompt['239'];
    delete prompt['240'];
    delete prompt['243'];
    delete prompt['238'];
    delete prompt['246'];
    prompt['158:53'].inputs.model = [lastStackId, 0];
    prompt['158:54'].inputs.model = [lastStackId, 0];
  } else {
    prompt['240'].inputs.strength = parseFloat(cfg.lliteStrength) || 0;
    prompt['240'].inputs.start_percent = parseFloat(cfg.lliteStartPercent) || 0;
    prompt['240'].inputs.end_percent = parseFloat(cfg.lliteEndPercent) || 0;
    prompt['240'].inputs.preserve_wrapper = cfg.llitePreserveWrapper;
    prompt['243'].inputs.select = 2; // Always CNET-guided when a reference image is in use
    prompt['238'].inputs.fit = cfg.resizeFit;
    prompt['238'].inputs.method = cfg.resizeMethod;
    prompt['240'].inputs.image = ['238', 0];
  }

  // Sampler/scheduler: the template's switch (169) just picks between two
  // hardcoded KSamplerSelect nodes — write the user's choice into the one it's
  // pinned to select (168:167) rather than exposing that switch.
  prompt['168:167'].inputs.sampler_name = cfg.sampler;
  prompt['158:53'].inputs.scheduler = cfg.scheduler;
  prompt['158:53'].inputs.steps = parseInt(cfg.steps1, 10) || 1;
  prompt['158:54'].inputs.cfg = parseFloat(cfg.cfg1) || 1;

  prompt['174:171'].inputs.value = parseInt(cfg.width, 10) || 920;
  prompt['174:172'].inputs.value = parseInt(cfg.height, 10) || 1244;

  prompt['165'].inputs.noise_seed = parseInt(cfg.seed1, 10) || 0;

  if (cfg.use2Pass) {
    prompt['227'].inputs.noise_seed = parseInt(cfg.seed2, 10) || 0;
    prompt['195'].inputs.denoise = parseFloat(cfg.denoise2) || 0;
    prompt['195'].inputs.scheduler = cfg.scheduler;
    prompt['195'].inputs.steps = parseInt(cfg.steps2, 10) || 1;
    // Clone a second SaveImage pointed at pass 1's own decode (176) so both
    // results can be kept/picked between instead of only the refined pass.
    prompt['192_pass1'] = { class_type: 'SaveImage', inputs: { filename_prefix: prompt['192'].inputs.filename_prefix, images: ['176', 0] }, _meta: { title: 'Pass 1 preview' } };
  } else {
    // 1-Pass: omit the 2nd-pass nodes entirely (no bypass flag exists in the
    // API format — presence/absence of the node IS the toggle) and repoint the
    // always-on SaveImage at pass-1's decode.
    delete prompt['190'];
    delete prompt['191'];
    delete prompt['195'];
    delete prompt['227'];
    delete prompt['224'];
    prompt['192'].inputs.images = ['176', 0];
  }

  // Optional model-based upscale — a SEPARATE SaveImage ('192_upscaled'), not a
  // rewire of 192, so 192/192_pass1 stay the raw pre-upscale pass output(s).
  // ImageScaleBy brings a fixed-ratio upscaler back down to the wanted scale.
  if (cfg.upscale && cfg.upscale.enabled && cfg.upscale.model.trim()) {
    prompt['upscale_model_loader'] = { class_type: 'UpscaleModelLoader', inputs: { model_name: cfg.upscale.model.trim() }, _meta: { title: 'Upscale Model Loader' } };
    const scaleBy = parseFloat(cfg.upscale.scaleBy) || 1;
    prompt['upscale_model_192'] = { class_type: 'ImageUpscaleWithModel', inputs: { upscale_model: ['upscale_model_loader', 0], image: prompt['192'].inputs.images }, _meta: { title: 'Upscale' } };
    prompt['upscale_scale_192'] = { class_type: 'ImageScaleBy', inputs: { upscale_method: 'lanczos', scale_by: scaleBy, image: ['upscale_model_192', 0] }, _meta: { title: 'Upscale scale-by' } };
    // '222' (File Namer 4 Upscaler) has its LoRA-tail value in slot d, leaving
    // c free — filling c with "Upscaled" places it between character and the
    // filename tail. (192's filename_prefix is a LINK, not a string — never
    // string-concat it; see notes/Features/SynthDat-Node-Map.md.)
    prompt['222'].inputs.text_c = 'Upscaled';
    prompt['192_upscaled'] = { class_type: 'SaveImage', inputs: { filename_prefix: ['222', 0], images: ['upscale_scale_192', 0] }, _meta: { title: 'Upscaled' } };
  }

  return prompt;
}

// ---- WD14 tagging graph + queue/history parsing ----
// The WD14 LoadImage -> WD14Tagger|pysssss graph, the /prompt response
// interpretation, and the /history tag extraction were each duplicated between
// the Node main process and the renderer's direct-fetch client. Shared here so
// the node graph and the error/response handling can't drift.

export interface Wd14TagSettingsInput {
  model: string;
  threshold: number;
  characterThreshold: number;
  trailingComma?: boolean;
  excludeTags?: string;
}

export function buildWd14Prompt(imageRef: string, settings: Wd14TagSettingsInput): SynthDatPrompt {
  return {
    '1': { class_type: 'LoadImage', inputs: { image: imageRef, upload: 'image' } },
    '2': {
      class_type: 'WD14Tagger|pysssss',
      inputs: {
        image: ['1', 0],
        model: settings.model,
        threshold: settings.threshold,
        character_threshold: settings.characterThreshold,
        // No longer user-configurable — always false so the node still gets a
        // value for this required input.
        replace_underscore: false,
        trailing_comma: !!settings.trailingComma,
        exclude_tags: settings.excludeTags || ''
      }
    }
  };
}

export type ComfyQueueParse = { ok: true; promptId: string } | { ok: false; error: string };

// Interprets a /prompt response. `noun` only affects the fallback error text
// ("queuing the <noun> request.") — 'tag' or 'generation'.
export function parseQueueResponse(parsed: any, status: number, noun: string): ComfyQueueParse {
  if (status !== 200) {
    const errMsg = parsed && parsed.error && parsed.error.message;
    return { ok: false, error: errMsg ? `ComfyUI rejected the request: ${errMsg}` : `ComfyUI returned HTTP ${status} queuing the ${noun} request.` };
  }
  const nodeErrorKeys = parsed && parsed.node_errors ? Object.keys(parsed.node_errors) : [];
  if (nodeErrorKeys.length) return { ok: false, error: `ComfyUI rejected the workflow: ${JSON.stringify(parsed.node_errors)}` };
  const promptId = parsed && parsed.prompt_id;
  if (!promptId) return { ok: false, error: 'ComfyUI did not return a prompt id.' };
  return { ok: true, promptId };
}

// The WD14Tagger node (id '2') reports its result as `outputs['2'].tags` — a
// string or a one-element array depending on the node version. Returns null
// while the result isn't ready yet.
export function extractWd14Tags(record: any): string | null {
  const tags = record && record.outputs && record.outputs['2'] && record.outputs['2'].tags;
  if (!tags) return null;
  return Array.isArray(tags) ? tags[0] : tags;
}

// ComfyUI's SaveImage embeds the queued prompt graph as a PNG tEXt/iTXt chunk
// named "prompt" (plus a UI-shaped "workflow" chunk we don't need). Walks the
// chunk stream and returns every text chunk keyed by its keyword. The
// compressed-iTXt path needs a raw-inflate that differs by runtime (zlib under
// Node, a WebView equivalent in the browser), so it is injected; omit it and a
// compressed chunk simply yields no value instead of throwing.
export function extractPngTextChunks(
  bytes: Uint8Array,
  inflate?: (deflated: Uint8Array) => Uint8Array
): Record<string, string> {
  const out: Record<string, string> = {};
  if (bytes.length < 8) return out;
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let i = 0; i < 8; i++) if (bytes[i] !== signature[i]) return out;
  const latin1 = (u8: Uint8Array) => new TextDecoder('latin1').decode(u8);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let off = 8;
  while (off + 12 <= bytes.length) {
    const len = view.getUint32(off, false);
    const type = String.fromCharCode(bytes[off + 4], bytes[off + 5], bytes[off + 6], bytes[off + 7]);
    const data = bytes.subarray(off + 8, off + 8 + len);
    if (type === 'tEXt') {
      const nul = data.indexOf(0);
      if (nul > 0) out[latin1(data.subarray(0, nul))] = latin1(data.subarray(nul + 1));
    } else if (type === 'iTXt') {
      const nul = data.indexOf(0);
      if (nul > 0) {
        const keyword = latin1(data.subarray(0, nul));
        let p = nul + 1;
        const compressionFlag = data[p]; p += 2; // compression flag + method
        while (p < data.length && data[p] !== 0) p++; p += 1; // language tag
        while (p < data.length && data[p] !== 0) p++; p += 1; // translated keyword
        let text = '';
        if (compressionFlag === 1) {
          if (inflate) { try { text = new TextDecoder().decode(inflate(data.subarray(p))); } catch { text = ''; } }
        } else {
          text = latin1(data.subarray(p));
        }
        if (text) out[keyword] = text;
      }
    }
    off += 12 + len;
    if (type === 'IEND') break;
  }
  return out;
}

// ---- Transport-agnostic request client ----
// The upload -> queue -> poll sequence was duplicated in every caller (root
// main.ts, comfy-client.ts, Comfy Bridge main + mobile). Each host injects a
// ComfyTransport (Node http/https or browser fetch); everything above it —
// multipart body, /prompt interpretation, the poll loop — is shared here.

export interface ComfyTransportResponse { status: number; body: Uint8Array; }
export interface ComfyRequestInit {
  method?: string;
  headers?: Record<string, string | number>;
  body?: Uint8Array | null;
  timeoutMs?: number;
}
export interface ComfyTransport {
  request(host: string, path: string, init?: ComfyRequestInit): Promise<ComfyTransportResponse>;
}

function decodeUtf8(bytes: Uint8Array): string { return new TextDecoder().decode(bytes); }
function safeJson(text: string): any { try { return JSON.parse(text || '{}'); } catch { return {}; } }

export type ComfyUpload = { ok: true; ref: string } | { ok: false; error: string };

export async function uploadImage(t: ComfyTransport, host: string, filename: string, bytes: Uint8Array, label = 'Image'): Promise<ComfyUpload> {
  const { boundary, body } = buildMultipart({ type: 'input', overwrite: 'true' }, 'image', filename, bytes);
  const res = await t.request(host, '/upload/image', {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': body.length },
    body,
    timeoutMs: 20000
  });
  if (res.status !== 200) return { ok: false, error: `${label} upload to ComfyUI failed (HTTP ${res.status}).` };
  const uploaded = safeJson(decodeUtf8(res.body));
  return { ok: true, ref: uploaded.subfolder ? `${uploaded.subfolder}/${uploaded.name}` : uploaded.name };
}

export async function queuePrompt(t: ComfyTransport, host: string, prompt: unknown, clientId: string, opts: { extraData?: Record<string, unknown>; noun?: string } = {}): Promise<ComfyQueueParse> {
  const payload: Record<string, unknown> = { prompt, client_id: clientId };
  if (opts.extraData) payload.extra_data = opts.extraData;
  const body = new TextEncoder().encode(JSON.stringify(payload));
  const res = await t.request(host, '/prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': body.length },
    body,
    timeoutMs: 10000
  });
  return parseQueueResponse(safeJson(decodeUtf8(res.body)), res.status, opts.noun || 'request');
}

export interface ComfyPollOptions<T> {
  deadlineMs: number;
  intervalMs?: number;
  isCancelled?: () => boolean;
  onCancelled?: () => { ok: false; error: string; interrupted?: boolean };
  /** Return the extracted value when the record is ready, else null to keep polling. */
  extract: (record: any) => T | null | Promise<T | null>;
  /** Message returned when ComfyUI reports status_str === 'error'. */
  errorStatusMessage: string;
  timeoutMessage: string;
}

export type ComfyPollResult<T> = { ok: true; value: T } | { ok: false; error: string; interrupted?: boolean };

export async function pollHistory<T>(t: ComfyTransport, host: string, promptId: string, opts: ComfyPollOptions<T>): Promise<ComfyPollResult<T>> {
  const interval = opts.intervalMs ?? 700;
  const deadline = Date.now() + opts.deadlineMs;
  const cancelled = () => (opts.isCancelled ? opts.isCancelled() : false);
  const stopped = () => (opts.onCancelled ? opts.onCancelled() : { ok: false as const, error: 'Cancelled.' });
  while (Date.now() < deadline) {
    if (cancelled()) return stopped();
    await new Promise((r) => setTimeout(r, interval));
    if (cancelled()) return stopped();
    let histRes: ComfyTransportResponse;
    try { histRes = await t.request(host, `/history/${promptId}`, { timeoutMs: 8000 }); } catch { continue; }
    if (histRes.status !== 200) continue;
    const hist = safeJson(decodeUtf8(histRes.body));
    const record = hist[promptId];
    if (!record) continue;
    const value = await opts.extract(record);
    if (value !== null && value !== undefined) return { ok: true, value };
    if (record.status && record.status.status_str === 'error') return { ok: false, error: opts.errorStatusMessage };
  }
  return { ok: false, error: opts.timeoutMessage };
}
