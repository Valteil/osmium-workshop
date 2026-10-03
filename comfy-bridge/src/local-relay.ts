// Network relay for Local ComfyUI: lets the Comfy Bridge Android app (or any
// ComfyUI client) generate on this PC's headless runner. The runner itself
// has no network server (comfy-local.ts talks to it over stdin/stdout), so
// this answers the slice of ComfyUI's HTTP + websocket API the phone app
// uses and forwards it to comfy-local:
//
//   GET  /object_info/<class>     node inputs (runner's node_info)
//   POST /upload/image            reference image, kept in memory for /prompt
//   POST /prompt                  queue a generation (localGenerate)
//   GET  /history/<id>            {} until done, then the SaveImage outputs
//   GET  /view?filename&subfolder a finished image (kept in memory)
//   POST /interrupt               localStop()
//   GET  /internal/logs/raw       the runner's console buffer (localLogs)
//   PATCH /internal/logs/subscribe {clientId, enabled}: new console lines go
//                                 to that client's websocket as "logs" messages
//   WS   /ws?clientId=…           progress + preview frames for that client
//
// Opt-in (Local ComfyUI ▸ "Let other devices use it"), off by default. Binds
// 0.0.0.0 so a Tailscale (or LAN) address reaches it; like ComfyUI's own
// --listen, there is no authentication unless the user sets a shared token
// (below). Every response carries CORS headers because the phone app is a
// WebView page on another origin.

import * as http from 'http';
import * as os from 'os';
import { randomUUID } from 'crypto';
import { ensureLocalStarted, localNodeInputs, localGenerate, localStop, localLogs, onLocalLogs } from './comfy-local';
import type { ComfyLocalEventSink } from './comfy-local';
const WS = require('ws');

const KEEP = 12; // finished prompts (and their images) kept for /history + /view
const MAX_UPLOAD_BYTES = 16 * 1024 * 1024; // one reference image; the phone sends ~1-2 MB
const MAX_CLIENT_ID = 128;
// Optional shared secret. Off unless the user sets one: empty means "no auth",
// so the default LAN/Tailscale flow is unchanged. When set, every request must
// carry it (X-Osmium-Token header or ?token= for the WebSocket handshake).
let sharedToken = '';

let server: http.Server | null = null;
let wss: any = null;
let listeningPort = 0;
let lastError = '';

const uploads = new Map<string, Buffer>();                  // name -> bytes
const history = new Map<string, Record<string, unknown>>(); // prompt id -> /history record
const views = new Map<string, Buffer>();                    // "subfolder/filename" -> bytes
const sockets = new Map<string, any>();                     // clientId -> websocket
const logSubscribers = new Set<string>();                   // clientIds streaming the console
let unsubscribeLogs: (() => void) | null = null;
let promptNumber = 0;

function trim<K, V>(map: Map<K, V>, max: number): void {
  while (map.size > max) map.delete(map.keys().next().value as K);
}

// A clientId comes straight off the wire; bound its length and shape so a
// hostile client can't blow up the maps or sneak a path-ish value in. Returns
// null when empty/invalid, and callers fall back to a fresh UUID.
function cleanClientId(raw: unknown): string | null {
  const id = String(raw == null ? '' : raw);
  return id && id.length <= MAX_CLIENT_ID && /^[A-Za-z0-9_.:-]+$/.test(id) ? id : null;
}

function extractToken(req: http.IncomingMessage, url: URL): string {
  const header = String(req.headers['x-osmium-token'] || '');
  if (header) return header;
  // EventSource/WebSocket handshakes can't set custom headers, so the phone
  // may pass the token as a query param instead.
  return url.searchParams.get('token') || '';
}

function tokenOk(req: http.IncomingMessage, url: URL): boolean {
  return !sharedToken || extractToken(req, url) === sharedToken;
}

// One app-relative image path, split into ComfyUI's subfolder/filename pair.
// The same `..` / drive-letter / empty-segment filtering as the desktop's
// saveImageRelPath, since this string becomes a /view lookup key.
function cleanImageRel(raw: string): string {
  const parts = raw.replace(/\\/g, '/').split('/').filter((p) => p && p !== '.' && p !== '..' && !/^[A-Za-z]:$/.test(p));
  return parts.join('/');
}

function cors(res: http.ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Osmium-Token');
}
function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  cors(res);
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}
function readBody(req: http.IncomingMessage, limit = 64 * 1024 * 1024): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > limit) { reject(new Error('Request too large.')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// The multipart part named `field`: its filename and bytes. Enough for the
// one-file uploads comfy-core's buildMultipart sends.
function multipartFile(body: Buffer, contentType: string, field: string): { filename: string; bytes: Buffer } | null {
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '');
  if (!m) return null;
  const boundary = Buffer.from('--' + (m[1] || m[2]).trim());
  let pos = body.indexOf(boundary);
  while (pos !== -1) {
    const next = body.indexOf(boundary, pos + boundary.length);
    if (next === -1) break;
    const part = body.subarray(pos + boundary.length + 2, next - 2); // skip CRLF after boundary, before next
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd !== -1) {
      const headers = part.subarray(0, headerEnd).toString('utf8');
      if (new RegExp(`name="${field}"`).test(headers)) {
        const fn = /filename="([^"]*)"/.exec(headers);
        return { filename: fn ? fn[1] : 'upload.png', bytes: Buffer.from(part.subarray(headerEnd + 4)) };
      }
    }
    pos = next;
  }
  return null;
}

// Progress/preview for one client's websocket, in ComfyUI's own formats
// (a "progress" JSON message; a binary preview frame: uint32 event 1, uint32
// image type 1 = JPEG, then the bytes).
function sinkFor(clientId: string): ComfyLocalEventSink {
  return {
    send(channel, payload: any) {
      const ws = sockets.get(clientId);
      if (!ws || ws.readyState !== 1) return;
      if (channel === 'gen-progress' || channel === 'synthdat-progress') {
        ws.send(JSON.stringify({ type: 'progress', data: { value: payload.value, max: payload.max } }));
      } else if (payload && payload.bytes) {
        const head = Buffer.alloc(8);
        head.writeUInt32BE(1, 0);
        head.writeUInt32BE(/png/i.test(payload.mime || '') ? 2 : 1, 4);
        ws.send(Buffer.concat([head, Buffer.from(payload.bytes)]));
      }
    }
  };
}

function imageEntry(promptId: string, nodeId: string, bytes: Uint8Array, rel: string | null | undefined) {
  const clean = cleanImageRel(rel || `${promptId}_${nodeId}.png`);
  const cut = clean.lastIndexOf('/');
  const subfolder = cut === -1 ? '' : clean.slice(0, cut);
  const filename = cut === -1 ? clean : clean.slice(cut + 1);
  views.set(`${subfolder}/${filename}`, Buffer.from(bytes));
  trim(views, KEEP * 3);
  return { images: [{ filename, subfolder, type: 'output' }] };
}

async function handlePrompt(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  let payload: any;
  try { payload = JSON.parse((await readBody(req)).toString('utf8')); } catch { sendJson(res, 400, { error: { message: 'Invalid JSON.' } }); return; }
  const prompt = payload && payload.prompt;
  if (!prompt || typeof prompt !== 'object') { sendJson(res, 400, { error: { message: 'No prompt in the request.' } }); return; }
  // Reply fast: the phone gives /prompt 10s, and a cold start takes ~25s.
  // A setup problem (no folder, no pack) fails at once and gets its real
  // message; a start still in progress is waited for by the generation.
  const starting = ensureLocalStarted();
  const early = await Promise.race([starting, new Promise<null>((r) => setTimeout(() => r(null), 2000))]);
  if (early && !early.ok) { sendJson(res, 400, { error: { message: early.error || 'Osmium Comfy could not start.' } }); return; }

  const ref = prompt['239'] && prompt['239'].inputs && prompt['239'].inputs.image;
  const imageBytes = typeof ref === 'string' && uploads.has(ref) ? uploads.get(ref)! : null;
  const promptId = randomUUID();
  history.set(promptId, {}); // placeholder: /history answers {} until it's done
  trim(history, KEEP);
  sendJson(res, 200, { prompt_id: promptId, number: ++promptNumber, node_errors: {} });

  const started = await starting;
  const r = started.ok
    ? await localGenerate(sinkFor(cleanClientId(payload.client_id) || ''), prompt, imageBytes ? new Uint8Array(imageBytes) : null)
    : { ok: false, error: started.error };
  if (!r.ok) {
    history.set(promptId, {
      status: { status_str: 'error', completed: false, messages: [['execution_error', { exception_message: r.error || '' }]] },
      outputs: {}
    });
    return;
  }
  const outputs: Record<string, unknown> = {};
  if (r.imageBytes) outputs['192'] = imageEntry(promptId, '192', r.imageBytes, r.saveRel);
  if (r.pass1ImageBytes) outputs['192_pass1'] = imageEntry(promptId, '192_pass1', r.pass1ImageBytes, r.pass1SaveRel);
  if (r.upscaledImageBytes) outputs['192_upscaled'] = imageEntry(promptId, '192_upscaled', r.upscaledImageBytes, r.upscaledSaveRel);
  history.set(promptId, { status: { status_str: 'success', completed: true, messages: [] }, outputs });
}

async function handle(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  const url = new URL(req.url || '/', 'http://relay');
  const p = url.pathname;
  if (req.method === 'OPTIONS') { cors(res); res.writeHead(204); res.end(); return; }
  if (!tokenOk(req, url)) { sendJson(res, 401, { error: { message: 'Missing or wrong Comfy Bridge token.' } }); return; }

  if (req.method === 'GET' && p.startsWith('/object_info/')) {
    const cls = decodeURIComponent(p.slice('/object_info/'.length));
    const started = await ensureLocalStarted();
    if (!started.ok) { sendJson(res, 503, { error: { message: started.error } }); return; }
    const info = await localNodeInputs(cls);
    if (!info.ok) { sendJson(res, 404, { error: { message: info.error } }); return; }
    sendJson(res, 200, { [cls]: { input: info.input, name: cls } });
    return;
  }
  if (req.method === 'POST' && p === '/upload/image') {
    const file = multipartFile(await readBody(req, MAX_UPLOAD_BYTES), String(req.headers['content-type'] || ''), 'image');
    if (!file) { sendJson(res, 400, { error: { message: 'No image in the upload.' } }); return; }
    const name = file.filename.replace(/[\\/]/g, '_') || 'upload.png';
    uploads.set(name, file.bytes);
    trim(uploads, KEEP);
    sendJson(res, 200, { name, subfolder: '', type: 'input' });
    return;
  }
  if (req.method === 'POST' && p === '/prompt') { await handlePrompt(req, res); return; }
  if (req.method === 'GET' && p.startsWith('/history/')) {
    const id = decodeURIComponent(p.slice('/history/'.length));
    const rec = history.get(id);
    sendJson(res, 200, rec && Object.keys(rec).length ? { [id]: rec } : {});
    return;
  }
  if (req.method === 'GET' && p === '/view') {
    const sub = cleanImageRel(url.searchParams.get('subfolder') || '');
    const file = cleanImageRel(url.searchParams.get('filename') || '');
    const key = `${sub}/${file}`;
    const bytes = views.get(key);
    if (!bytes) { sendJson(res, 404, { error: { message: 'No such image.' } }); return; }
    cors(res);
    res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': bytes.length });
    res.end(bytes);
    return;
  }
  if (req.method === 'POST' && p === '/interrupt') { localStop(); sendJson(res, 200, {}); return; }
  if (p === '/internal/logs/raw') {
    const logs = await localLogs();
    const entries = logs.ok ? logs.entries : [{ t: '', m: (logs.error || 'Osmium Comfy isn\'t running.') + '\n' }];
    sendJson(res, 200, { entries, size: {} });
    return;
  }
  if (p === '/internal/logs/subscribe') {
    let body: any = {};
    try { body = JSON.parse((await readBody(req)).toString('utf8') || '{}'); } catch { /* treat as empty */ }
    const id = cleanClientId(body.clientId);
    if (id) { if (body.enabled === false) logSubscribers.delete(id); else logSubscribers.add(id); }
    sendJson(res, 200, {});
    return;
  }
  if (req.method === 'GET' && (p === '/' || p === '/system_stats')) {
    sendJson(res, 200, { relay: 'Comfy Bridge Osmium Comfy', system: { comfyui_version: 'local' } });
    return;
  }
  sendJson(res, 404, { error: { message: `Not available on the Osmium Comfy relay: ${req.method} ${p}` } });
}

// `host` defaults to 0.0.0.0 (the opt-in LAN/Tailscale bind). The red-team
// harness passes 127.0.0.1 so it can exercise the relay on loopback only.
export function startRelay(port: number, token = '', host = '0.0.0.0'): Promise<{ ok: boolean; error?: string }> {
  sharedToken = token;
  stopRelay();
  sharedToken = token;
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      handle(req, res).catch((err) => { if (!res.headersSent) sendJson(res, 500, { error: { message: String(err && err.message || err) } }); });
    });
    wss = new WS.Server({ noServer: true });
    srv.on('upgrade', (req, socket, head) => {
      const url = new URL(req.url || '/', 'http://relay');
      if (url.pathname !== '/ws' || !tokenOk(req, url)) { socket.destroy(); return; }
      wss.handleUpgrade(req, socket, head, (ws: any) => {
        const clientId = cleanClientId(url.searchParams.get('clientId')) || randomUUID();
        sockets.set(clientId, ws);
        ws.on('close', () => { if (sockets.get(clientId) === ws) { sockets.delete(clientId); logSubscribers.delete(clientId); } });
        ws.on('error', () => { /* the phone went away */ });
        ws.send(JSON.stringify({ type: 'status', data: { status: { exec_info: { queue_remaining: 0 } }, sid: clientId } }));
      });
    });
    srv.once('error', (err: NodeJS.ErrnoException) => {
      lastError = err.code === 'EADDRINUSE' ? `Port ${port} is already in use.` : err.message;
      server = null;
      resolve({ ok: false, error: lastError });
    });
    srv.listen(port, host, () => {
      server = srv;
      unsubscribeLogs = onLocalLogs((entries) => {
        const msg = JSON.stringify({ type: 'logs', data: { entries, size: {} } });
        for (const id of logSubscribers) {
          const ws = sockets.get(id);
          if (ws && ws.readyState === 1) ws.send(msg);
        }
      });
      listeningPort = port;
      lastError = '';
      resolve({ ok: true });
    });
  });
}

export function stopRelay(): void {
  if (wss) { for (const ws of wss.clients) { try { ws.terminate(); } catch { /* gone */ } } wss.close(); wss = null; }
  if (server) { server.close(); server = null; }
  sockets.clear();
  logSubscribers.clear();
  if (unsubscribeLogs) { unsubscribeLogs(); unsubscribeLogs = null; }
  listeningPort = 0;
  sharedToken = '';
}

// This PC's IPv4 addresses a phone could use; Tailscale's (100.64.0.0/10)
// first, since that's the one that works away from home.
export function relayAddresses(): { ip: string; tailscale: boolean }[] {
  const out: { ip: string; tailscale: boolean }[] = [];
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list || []) {
      if (a.family !== 'IPv4' || a.internal) continue;
      const [o1, o2] = a.address.split('.').map(Number);
      if (o1 === 169 && o2 === 254) continue; // link-local from idle/virtual adapters: never reachable
      out.push({ ip: a.address, tailscale: o1 === 100 && o2 >= 64 && o2 <= 127 });
    }
  }
  return out.sort((a, b) => Number(b.tailscale) - Number(a.tailscale));
}

export function relayState(): { running: boolean; port: number; error: string; token: boolean } {
  return { running: !!server, port: listeningPort, error: lastError, token: !!sharedToken };
}
