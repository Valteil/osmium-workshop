import type { ComfyResult, ComfyImageRef } from './types';
import type { ElectronAPI } from '../ipc-types';
import { parseComboValues, buildWd14Prompt, extractWd14Tags, uploadImage, queuePrompt, pollHistory } from '../comfy-core';
import type { ComfyTransport } from '../comfy-core';
import './global-types';

function isLikelyCorsFailure(err: unknown): boolean {
  return err instanceof TypeError;
}

function corsHintSuffix(): string {
  return ' — either ComfyUI isn\'t reachable at that address, or it needs to be started with --enable-cors-header for a phone/browser to reach it directly.';
}

function normalizeHost(host: string): string {
  const trimmed = String(host || '').trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
}

// Browser transport for the shared ComfyUI client (comfy-core.ts) — the
// renderer-side counterpart of main.ts's Node transport.
const fetchComfyTransport: ComfyTransport = {
  request: async (host, path, init = {}) => {
    const res = await fetch(new URL(path, host), {
      method: init.method || 'GET',
      headers: init.headers as Record<string, string> | undefined,
      body: (init.body ?? undefined) as BodyInit | undefined
    });
    return { status: res.status, body: new Uint8Array(await res.arrayBuffer()) };
  }
};

export async function comfyGetModels(host: string): Promise<ComfyResult> {
  host = normalizeHost(host);
  let res: Response;
  try {
    res = await fetch(new URL('/object_info/WD14Tagger%7Cpysssss', host), { method: 'GET' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Could not reach ComfyUI at ${host}${isLikelyCorsFailure(err) ? corsHintSuffix() : ' (' + msg + ')'}` };
  }
  if (!res.ok) return { ok: false, error: `ComfyUI returned HTTP ${res.status} — is the WD14 Tagger (pysssss) custom node installed?` };
  let parsed: Record<string, { input?: { required?: Record<string, unknown> } }>;
  try { parsed = await res.json(); } catch { return { ok: false, error: 'ComfyUI returned an unexpected response.' }; }
  const models = parseComboValues(parsed['WD14Tagger|pysssss'], 'model');
  if (!Array.isArray(models)) return { ok: false, error: 'Could not find the WD14 Tagger node on that ComfyUI instance.' };
  return { ok: true, models };
}

interface ComfyTagPayload {
  host: string;
  filename: string;
  imageBytes: Uint8Array;
  settings: {
    model: string;
    threshold: number;
    characterThreshold: number;
    trailingComma?: boolean;
    excludeTags?: string;
  };
}

export async function comfyTagImage({ host, filename, imageBytes, settings }: ComfyTagPayload): Promise<ComfyResult> {
  host = normalizeHost(host);
  try {
    const upload = await uploadImage(fetchComfyTransport, host, filename, imageBytes, 'Image');
    if (!upload.ok) return upload;

    const clientId = `dts-mobile-${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
    const prompt = buildWd14Prompt(upload.ref, settings);
    const queue = await queuePrompt(fetchComfyTransport, host, prompt, clientId, { noun: 'tag' });
    if (!queue.ok) return queue;

    const poll = await pollHistory<string>(fetchComfyTransport, host, queue.promptId, {
      deadlineMs: 120000,
      extract: (record) => extractWd14Tags(record),
      errorStatusMessage: 'ComfyUI reported an error while tagging this image — check its console for details.',
      timeoutMessage: 'Timed out waiting for ComfyUI to finish tagging this image.'
    });
    if (!poll.ok) return poll;
    return { ok: true, tagsCsv: poll.value };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Could not reach ComfyUI at ${host}${isLikelyCorsFailure(err) ? corsHintSuffix() : ' (' + msg + ')'}` };
  }
}

// ---------------- SynthDat Overseer generation ----------------

interface ComfyObjectInfoPayload {
  host: string;
  classType: string;
  inputName: string;
}

export async function comfyGetObjectInfo({ host, classType, inputName }: ComfyObjectInfoPayload): Promise<ComfyResult> {
  host = normalizeHost(host);
  try {
    const res = await fetch(new URL(`/object_info/${encodeURIComponent(classType)}`, host));
    if (!res.ok) return { ok: false, error: `ComfyUI returned HTTP ${res.status} looking up ${classType}.` };
    const parsed: Record<string, { input?: { required?: Record<string, unknown> } }> = await res.json();
    const values = parseComboValues(parsed[classType], inputName);
    if (!Array.isArray(values)) return { ok: false, error: `Could not find "${inputName}" on ${classType} — is the right custom node installed?` };
    return { ok: true, values };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Could not reach ComfyUI at ${host}${isLikelyCorsFailure(err) ? corsHintSuffix() : ' (' + msg + ')'}` };
  }
}

type PreviewFrameCallback = (event: null, data: { mime: string; bytes: Uint8Array }) => void;
type ProgressCallback = (event: null, data: { value: number; max: number }) => void;

let previewFrameCallback: PreviewFrameCallback = () => {};
let progressCallback: ProgressCallback = () => {};
let activeGen: { cancelled: boolean } | null = null;

export function comfyOnPreviewFrame(cb: PreviewFrameCallback): void { previewFrameCallback = cb; }
export function comfyOnProgress(cb: ProgressCallback): void { progressCallback = cb; }

export async function comfyStopGeneration(host: string): Promise<ComfyResult> {
  host = normalizeHost(host);
  if (activeGen) activeGen.cancelled = true;
  try { await fetch(new URL('/interrupt', host), { method: 'POST' }); } catch { /* best effort */ }
  return { ok: true };
}

async function fetchViewImage(host: string, image: ComfyImageRef): Promise<Uint8Array> {
  const qs = new URLSearchParams({ filename: image.filename, subfolder: image.subfolder || '', type: image.type || 'output' });
  const res = await fetch(new URL(`/view?${qs.toString()}`, host));
  if (!res.ok) throw new Error(`ComfyUI returned HTTP ${res.status} fetching the generated image.`);
  return new Uint8Array(await res.arrayBuffer());
}

interface SynthDatQueuePayload {
  host: string;
  imageFilename: string;
  imageBytes: Uint8Array;
  prompt: Record<string, { class_type?: string; inputs?: Record<string, unknown> }>;
}

export async function comfyQueueAndFetch({ host, imageFilename, imageBytes, prompt }: SynthDatQueuePayload): Promise<ComfyResult> {
  host = normalizeHost(host);
  let ws: WebSocket | null = null;
  try {
    if (imageBytes && prompt['239']) {
      const upload = await uploadImage(fetchComfyTransport, host, imageFilename, imageBytes, 'Reference image');
      if (!upload.ok) return upload;
      (prompt['239'].inputs as Record<string, unknown>).image = upload.ref;
    }

    const clientId = `dts-mobile-synthdat-${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
    activeGen = { cancelled: false };

    try {
      const wsUrl = `${host.replace(/^http/i, 'ws')}/ws?clientId=${encodeURIComponent(clientId)}`;
      ws = new WebSocket(wsUrl);
      ws.binaryType = 'arraybuffer';
      ws.addEventListener('open', () => {
        try { ws!.send(JSON.stringify({ type: 'feature_flags', data: { supports_preview_metadata: true } })); }
        catch { /* best effort */ }
      });
      ws.addEventListener('message', (ev: MessageEvent) => {
        if (ev.data instanceof ArrayBuffer) {
          const data = new DataView(ev.data);
          if (ev.data.byteLength < 8) return;
          const eventType = data.getUint32(0, false);
          if (eventType === 1) {
            const imageType = data.getUint32(4, false);
            previewFrameCallback(null, { mime: imageType === 1 ? 'image/jpeg' : 'image/png', bytes: new Uint8Array(ev.data.slice(8)) });
          } else if (eventType === 4) {
            try {
              const metaLen = data.getUint32(4, false);
              const metaBytes = new Uint8Array(ev.data.slice(8, 8 + metaLen));
              const meta: { image_type?: string } = JSON.parse(new TextDecoder().decode(metaBytes));
              previewFrameCallback(null, { mime: meta.image_type || 'image/jpeg', bytes: new Uint8Array(ev.data.slice(8 + metaLen)) });
            } catch { /* malformed metadata frame — skip */ }
          }
        } else {
          try {
            const msg: { type: string; data?: Record<string, unknown> } = JSON.parse(ev.data as string);
            if (msg.type === 'progress' && msg.data) {
              progressCallback(null, msg.data as { value: number; max: number });
            } else if (msg.type === 'progress_state' && msg.data) {
              const nodes = (msg.data as { nodes?: Record<string, { state: string; value: number; max: number }> }).nodes;
              if (nodes) {
                const running = Object.values(nodes).filter(n => n.state === 'running');
                if (running.length) {
                  const n = running[running.length - 1];
                  progressCallback(null, { value: n.value, max: n.max });
                }
              }
            }
          } catch { /* ignore malformed frames */ }
        }
      });
      ws.addEventListener('error', (err) => console.error('[synthdat] preview websocket error:', err));
      ws.addEventListener('close', (ev: CloseEvent) => { if (ev.code !== 1000) console.error('[synthdat] preview websocket closed:', ev.code, ev.reason); });
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 3000);
        ws!.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
        ws!.addEventListener('error', () => { clearTimeout(timer); resolve(); }, { once: true });
      });
    } catch (err) { console.error('[synthdat] preview websocket setup failed:', err); }

    const queue = await queuePrompt(fetchComfyTransport, host, prompt, clientId, { extraData: { preview_method: 'taesd' }, noun: 'generation' });
    if (!queue.ok) return queue;
    const promptId = queue.promptId;

    const poll = await pollHistory<ComfyResult>(fetchComfyTransport, host, promptId, {
      deadlineMs: 300000,
      isCancelled: () => !!(activeGen && activeGen.cancelled),
      onCancelled: () => ({ ok: false, error: 'Generation stopped.', interrupted: true }),
      errorStatusMessage: 'ComfyUI reported an error while generating this image — check its console for details.',
      timeoutMessage: 'Timed out waiting for ComfyUI to finish generating this image.',
      extract: async (record) => {
        const outputs = record.outputs as Record<string, { images?: ComfyImageRef[] }> | undefined;
        const saveOutput = outputs?.['192'];
        const image = saveOutput?.images?.[0];
        if (!image) return null;
        const result: ComfyResult = { ok: true, imageBytes: await fetchViewImage(host, image) };
        const pass1Output = outputs?.['192_pass1'];
        const pass1Image = pass1Output?.images?.[0];
        if (pass1Image) {
          try { result.pass1ImageBytes = await fetchViewImage(host, pass1Image); } catch { /* pass1 preview is optional */ }
        }
        return result;
      }
    });
    return poll.ok ? poll.value : poll;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Could not reach ComfyUI at ${host} (${msg})` };
  } finally {
    try { if (ws) ws.close(); } catch { /* already closed */ }
    activeGen = null;
  }
}

if (window.Capacitor) {
  const api: Partial<ElectronAPI> = window.electronAPI || {};
  api.synthdatGetObjectInfo = comfyGetObjectInfo as ElectronAPI['synthdatGetObjectInfo'];
  api.synthdatQueueAndFetch = comfyQueueAndFetch as ElectronAPI['synthdatQueueAndFetch'];
  api.synthdatStopGeneration = comfyStopGeneration as ElectronAPI['synthdatStopGeneration'];
  api.onSynthdatPreviewFrame = comfyOnPreviewFrame as unknown as ElectronAPI['onSynthdatPreviewFrame'];
  api.onSynthdatProgress = comfyOnProgress as unknown as ElectronAPI['onSynthdatProgress'];
  window.electronAPI = api as ElectronAPI;
}
