// Comfy Bridge — a standalone desktop window onto a single user-configured
// ComfyUI instance, built on the exact same generation workflow as Dataset
// Manager Studio's SynthDat Overseer (same bundled `renderer/data/synthdat-
// workflow.json`, same fixed graph). Unlike SynthDat, this app has no
// dataset and no Accept/Reject step — every generation just gets saved to a
// user-picked output folder, both passes when 2-Pass runs, with an optional
// model-based upscale before saving. See the parent project's
// `notes/SynthDat-Overseer.md` for the workflow's own background — this is
// a copy of its ComfyUI-facing bridge, not a shared module, since the two
// apps otherwise have nothing in common (no dataset, no dirHandle writes).
const { app, BrowserWindow, Menu, ipcMain, dialog, session, shell } = require('electron');
const { pathToFileURL } = require('url');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const WS = require('ws');
const { randomUUID } = require('crypto');
import { parseComboValues, uploadImage, queuePrompt, pollHistory, extractWd14Tags, extractPngTextChunks as extractPngChunks } from './comfy-core';
import type { ComfyTransport } from './comfy-core';
import {
  configureComfyLocal, registerComfyLocalHandlers, LOCAL_COMFY_HOST, localObjectInfo, localGenerate, localStop, localLogs, onLocalLogs,
  localPersistEnabled, localIsPersistentConnection, localSetShare, ensureLocalStarted, localGalleryThumb, localLoraInfo, localLoraOp
} from './comfy-local';
import { startRelay, stopRelay, relayState, relayAddresses, initRelayGallery } from './local-relay';

// ---- IPC sender guard --------------------------------------------------------
// Ported from the desktop root app. The guard itself lives in
// ./ipc-guard (dependency-free, requireable without electron). main.ts only wires it: every ipcMain.handle is wrapped once, at
// module load and before registerComfyLocalHandlers() runs below, so no handler
// (this file's or comfy-local.ts's) can run for a frame that isn't the app's
// own renderer page. Defence in depth, not a substitute for per-handler input
// validation.
import { assertTrustedFrame, setTrustedRenderer, normalizePageUrl } from './ipc-guard';
{
  const rawHandle = ipcMain.handle.bind(ipcMain);
  ipcMain.handle = ((channel: string, listener: (event: any, ...args: any[]) => unknown) => {
    return rawHandle(channel, (event: any, ...args: any[]) => {
      assertTrustedFrame(event);
      return listener(event, ...args);
    });
  });
}

// Local ComfyUI (comfy-local.ts, shared with Osmium): the Bridge launches the
// user's own ComfyUI install headless instead of talking to a server. The
// renderer passes LOCAL_COMFY_HOST ('local') as the host to use it.
configureComfyLocal({ appName: 'Comfy Bridge', progressChannel: 'gen-progress', previewChannel: 'preview-frame', allowPersist: true });
registerComfyLocalHandlers(ipcMain);
// The runner's console output streams into the ComfyUI Terminal, like a
// server's log subscription does.
onLocalLogs((entries) => {
  for (const w of BrowserWindow.getAllWindows()) w.webContents.send('comfy-log', entries);
});

// Network relay (local-relay.ts): lets the Android app (over Tailscale or
// the LAN) generate on this PC's Local ComfyUI. Opt-in, remembered in
// userData/comfy-relay.json, started at launch when on.
const RELAY_FILE = () => path.join(app.getPath('userData'), 'comfy-relay.json');
const DEFAULT_RELAY_PORT = 8189;
function readRelayConfig(): { enabled: boolean; port: number; token: string } {
  try {
    const c = JSON.parse(fs.readFileSync(RELAY_FILE(), 'utf8'));
    return { enabled: !!c.enabled, port: Number(c.port) || DEFAULT_RELAY_PORT, token: typeof c.token === 'string' ? c.token : '' };
  } catch { return { enabled: false, port: DEFAULT_RELAY_PORT, token: '' }; }
}
// Who serves the phone depends on Persist Comfy:
// - off: this app's relay (local-relay.ts). It dies with the app.
// - on: the kept-open runner itself (its ShareServer, switched with
//   localSetShare), so the phone keeps working after the app closes. The app's
//   relay stays off then (same port). The runner only shares once it's up:
//   Connect once, then it serves the phone until its window is closed.
let shareState = { running: false, error: '' };
async function applyRelay(): Promise<void> {
  const cfg = readRelayConfig();
  if (localPersistEnabled()) {
    stopRelay();
    if (localIsPersistentConnection()) {
      const r = await localSetShare(cfg.enabled ? cfg.port : 0, getPickedOutputFolder() || undefined);
      shareState = { running: cfg.enabled && r.ok, error: r.ok ? '' : (r.error || 'Could not share Osmium Comfy.') };
    } else {
      // Not connected (yet): a runner kept open from before may still be
      // serving; report it as running if something answers on the port.
      shareState = { running: cfg.enabled && await portAnswers(cfg.port), error: '' };
    }
  } else {
    shareState = { running: false, error: '' };
    if (cfg.enabled) await startRelay(cfg.port, cfg.token); else stopRelay();
  }
}
function portAnswers(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = require('net').connect({ host: '127.0.0.1', port });
    const done = (v: boolean) => { s.destroy(); resolve(v); };
    s.once('connect', () => done(true));
    s.once('error', () => done(false));
    setTimeout(() => done(false), 800);
  });
}
async function relayStatus() {
  const cfg = readRelayConfig();
  const byComfy = localPersistEnabled();
  if (byComfy && !localIsPersistentConnection()) await applyRelay(); // refresh the port probe
  const state = byComfy ? { ...shareState, port: cfg.port } : relayState();
  return { ...cfg, ...state, servedBy: byComfy ? 'comfy' : 'bridge', addresses: relayAddresses() };
}
ipcMain.handle('comfy-relay-status', () => relayStatus());
ipcMain.handle('comfy-relay-set', async (_event, { enabled, port, token }) => {
  const cfg = {
    enabled: !!enabled,
    port: Math.min(65535, Math.max(1024, Number(port) || DEFAULT_RELAY_PORT)),
    token: typeof token === 'string' ? token.trim() : ''
  };
  fs.writeFileSync(RELAY_FILE(), JSON.stringify(cfg));
  await applyRelay();
  return relayStatus();
});
configureComfyLocal({ onStarted: () => { applyRelay(); }, onPersistChange: () => { applyRelay(); } });
// The relay's phone gallery (browse the picked output folder over
// Tailscale/LAN): lists and reads reuse the same confinement the desktop
// renderer's IPC handlers use; a thumbnail proxies to the running runner
// (Pillow). The share server (Persist Comfy) serves its own routes from the
// folder the share command ships.
initRelayGallery({
  async listDir(relDir) {
    const folder = getPickedOutputFolder();
    if (!folder) return { ok: false, error: 'No output folder chosen.' };
    try {
      const abs = galleryAbsPath(folder, relDir);
      const dirents = fs.readdirSync(abs, { withFileTypes: true });
      return {
        ok: true,
        entries: dirents.map((e) => {
          let mtime = 0;
          try { mtime = fs.statSync(path.join(abs, e.name)).mtimeMs || 0; } catch { /* keep 0 */ }
          return { name: e.name, kind: e.isDirectory() ? ('directory' as const) : ('file' as const), mtime };
        })
      };
    } catch (err) { return { ok: false, error: err instanceof Error ? err.message : String(err) }; }
  },
  async readImage(relPath) {
    const folder = getPickedOutputFolder();
    if (!folder) return { ok: false, error: 'No output folder chosen.' };
    try {
      const abs = galleryAbsPath(folder, relPath);
      const ext = path.extname(abs).toLowerCase();
      if (!GALLERY_IMAGE_EXTENSIONS.has(ext)) return { ok: false, error: 'Not an image file.' };
      return { ok: true, base64: fs.readFileSync(abs).toString('base64'), mime: GALLERY_MIME_BY_EXT[ext] };
    } catch (err) { return { ok: false, error: err instanceof Error ? err.message : String(err) }; }
  },
  async thumb(relPath, side) {
    const folder = getPickedOutputFolder();
    if (!folder) return { ok: false, error: 'No output folder chosen.' };
    try {
      const abs = galleryAbsPath(folder, relPath);
      const started = await ensureLocalStarted();
      if (!started.ok) return { ok: false, error: started.error };
      const r = await localGalleryThumb(abs, side);
      if (!r.ok || !r.b64) return { ok: false, error: r.error || 'No thumbnail.' };
      return { ok: true, base64: r.b64, mime: r.mime || 'image/jpeg' };
    } catch (err) { return { ok: false, error: err instanceof Error ? err.message : String(err) }; }
  },
  async loraInfo(name) {
    const started = await ensureLocalStarted();
    if (!started.ok) return { ok: false, error: started.error };
    return localLoraInfo(name);
  },
  async loraOp(payload) {
    const started = await ensureLocalStarted();
    if (!started.ok) return { ok: false, error: started.error };
    return localLoraOp(payload);
  }
});
app.whenReady().then(() => { applyRelay(); });
app.on('will-quit', stopRelay);

// Content-Security-Policy for the app window, applied to the session's
// response headers (covers the document and every subresource). The Bridge
// renderer has no inline <script> (only <script src="app.js">), so script-src
// needs no hashes. style-src needs 'unsafe-inline' (inline style="" attrs);
// img-src needs data: (base64 gallery images) and blob: (object URLs).
function applyRendererCsp(): void {
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
    "frame-ancestors 'none'"
  ].join('; ');
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [policy]
      }
    });
  });
}

function createWindow() {
  const windowIcon = path.join(__dirname, 'build', process.platform === 'win32' ? 'icon.ico' : 'icon.png');
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 980,
    minHeight: 600,
    backgroundColor: '#16151c',
    autoHideMenuBar: true,
    show: false,
    icon: windowIcon,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  // Opens maximized (the user's call); un-maximizing falls back to 1280x860.
  // show() alone doesn't reliably focus on Windows when the app is launched
  // from a terminal (foreground lock): the window appeared unfocused, so the
  // first click was swallowed by the focus change and wheel events did nothing
  // until then. Focus the window and its web contents explicitly.
  win.once('ready-to-show', () => {
    win.maximize();
    win.show();
    win.focus();
    win.webContents.focus();
  });
  const rendererHtml = path.join(__dirname, 'renderer', 'index.html');
  // Fix the trusted page URL the IPC sender guard compares against.
  setTrustedRenderer(rendererHtml);
  win.loadFile(rendererHtml);

  // Electron shell hardening: this window only ever shows the app's own page,
  // so block navigating away from it and deny every window.open/new-window.
  win.webContents.on('will-navigate', (event, url) => {
    if (normalizePageUrl(url) !== normalizePageUrl(pathToFileURL(rendererHtml).href)) event.preventDefault();
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  applyRendererCsp();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('get-app-version', () => app.getVersion());

// ---------------- Output folder + file writes ----------------
// No dataset/dirHandle here — a plain native folder picker plus direct
// fs writes in the main process, same "small explicit bridge" shape as
// everything else in this file.
//
// The picked folder is stored in main (userData file) and is the ONLY folder
// the save/gallery handlers will ever touch. The renderer no longer supplies
// a folder over IPC, so a renderer-side bug or injection can't redirect a
// write outside the user's chosen directory. Persisted so gallery/save still
// work across a restart, when the renderer restores its saved label.
const OUTPUT_FOLDER_FILE = () => path.join(app.getPath('userData'), 'comfy-bridge-output-folder.txt');
let pickedOutputFolder: string | null = null;
function getPickedOutputFolder(): string {
  if (pickedOutputFolder === null) {
    try { pickedOutputFolder = fs.readFileSync(OUTPUT_FOLDER_FILE(), 'utf8').trim(); }
    catch { pickedOutputFolder = ''; }
  }
  return pickedOutputFolder;
}
function setPickedOutputFolder(folder: string): void {
  pickedOutputFolder = folder;
  try {
    fs.mkdirSync(path.dirname(OUTPUT_FOLDER_FILE()), { recursive: true });
    fs.writeFileSync(OUTPUT_FOLDER_FILE(), folder);
  } catch (err) { console.error('[output-folder] could not persist:', err && err.message); }
}
// Reject a resolved path whose real location (following symlinks/junctions,
// via the nearest existing ancestor when the leaf doesn't exist yet) falls
// outside `base`. String containment alone misses a symlink inside the folder.
function assertWithinBase(base: string, abs: string): void {
  const realBase = fs.realpathSync(base);
  let probe = abs;
  while (!fs.existsSync(probe)) {
    const parent = path.dirname(probe);
    if (parent === probe) break;
    probe = parent;
  }
  let realProbe = probe;
  try { realProbe = fs.realpathSync(probe); } catch { /* keep the literal path */ }
  const rel = path.relative(realBase, realProbe);
  if (rel === '') return;
  if (rel.startsWith('..') || path.isAbsolute(rel)) throw new Error('Invalid path.');
}
ipcMain.handle('pick-output-folder', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const res = await dialog.showOpenDialog(win, { properties: ['openDirectory', 'createDirectory'] });
  if (res.canceled || !res.filePaths[0]) return { ok: false };
  setPickedOutputFolder(res.filePaths[0]);
  return { ok: true, path: res.filePaths[0] };
});

// ---------------- Import generation (PNG -> settings) ----------------
// ComfyUI's SaveImage embeds the queued prompt graph as a PNG tEXt/iTXt
// chunk named "prompt" (plus a UI-shaped "workflow" chunk we don't need).
// Filenames like "<rating>/<char>/<lora>_00003.png" (the integrated
// workflow's File Namer scheme) are a hint, but the deciding factor is the
// payload: recognized when it contains the Bridge's fixed node ids. The chunk
// walk itself is shared (comfy-core); Node's zlib supplies the inflate.
function extractPngTextChunks(buffer: Buffer): Record<string, string> {
  return extractPngChunks(new Uint8Array(buffer), (d) => require('zlib').inflateSync(d));
}

// ---------------- LoRA lookup (Metadata tab) ----------------
// Online lookups leave the app ONLY from here, to two fixed HTTPS APIs. The
// renderer names a site, a kind and a query — never a URL — and gets parsed
// JSON back (rendered as text there). No redirects are followed, responses
// are size- and time-capped, and links open in the system browser only for
// those two sites' own https pages.
const LOOKUP_HOSTS = new Set(['civitai.com', 'civarchive.com']);
const LOOKUP_TIMEOUT_MS = 15000;
const LOOKUP_MAX_BYTES = 4 * 1024 * 1024;
function lookupUrl(site: string, kind: string, q: string): string | null {
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
function httpsGetJson(url: string): Promise<{ status: number; json: unknown }> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { Accept: 'application/json', 'User-Agent': 'ComfyBridge/2.0 (LoRA lookup)' }, timeout: LOOKUP_TIMEOUT_MS }, (res) => {
      const chunks: Buffer[] = [];
      let size = 0;
      res.on('data', (c: Buffer) => {
        size += c.length;
        if (size > LOOKUP_MAX_BYTES) { req.destroy(new Error('Lookup reply too large.')); return; }
        chunks.push(c);
      });
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        if ((res.statusCode || 0) >= 300 && (res.statusCode || 0) < 400) { resolve({ status: res.statusCode || 0, json: null }); return; }
        try { resolve({ status: res.statusCode || 0, json: text ? JSON.parse(text) : null }); }
        catch { resolve({ status: res.statusCode || 0, json: null }); }
      });
      res.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error('The lookup timed out.')));
    req.on('error', reject);
  });
}
ipcMain.handle('lora-online-lookup', async (_event, payload) => {
  const { site, kind, q } = payload || {};
  const url = lookupUrl(String(site), String(kind), String(q));
  if (!url) return { ok: false, error: 'Nothing to look up.' };
  try {
    const r = await httpsGetJson(url);
    return { ok: true, status: r.status, json: r.json };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
});
ipcMain.handle('open-lookup-link', async (_event, raw) => {
  try {
    const u = new URL(String(raw));
    if (u.protocol !== 'https:' || !LOOKUP_HOSTS.has(u.hostname)) return { ok: false };
    await shell.openExternal(u.toString());
    return { ok: true };
  } catch { return { ok: false }; }
});
// A lookup hit's preview image, as a data: URL (the window's CSP allows no
// remote images). The previews live on many CDNs, so instead of a host
// allowlist: https only (the renderer's previewImageUrl already refused ports,
// credentials, bare IPs and local names), the RESOLVED address must be public
// (checked inside the socket's own lookup, so DNS can't swap it afterwards),
// up to 3 redirects with every hop checked the same way (CivitAI's image host
// always redirects to its blob store), an image content type, 3 MB at most.
const PREVIEW_MAX_BYTES = 3 * 1024 * 1024;
const PREVIEW_TYPES = /^image\/(jpeg|png|webp|gif|avif)$/;
function isPublicAddress(ip: string, family: number): boolean {
  if (family === 6) {
    const a = ip.toLowerCase();
    if (a.startsWith('::ffff:')) return isPublicAddress(a.slice(7), 4);
    return !(a === '::' || a === '::1' || /^f[cd]/.test(a) || /^fe[89ab]/.test(a));
  }
  const [a, b] = ip.split('.').map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127));
}
// Node's sockets call this with all:true (happy eyeballs) and expect a list.
function publicOnlyLookup(hostname: string, options: any, cb: any): void {
  require('dns').lookup(hostname, { ...options, all: true }, (err: any, list: { address: string; family: number }[]) => {
    if (!err && (!list.length || list.some((a) => !isPublicAddress(a.address, a.family)))) err = new Error('Preview host is not a public address.');
    if (err) { cb(err); return; }
    if (options && options.all) cb(null, list); else cb(null, list[0].address, list[0].family);
  });
}
function fetchPreview(raw: string, hops: number): Promise<{ ok: boolean; dataUrl?: string }> {
  let u: URL;
  try { u = new URL(raw); } catch { return Promise.resolve({ ok: false }); }
  // IP literals skip the lookup hook entirely, so they're refused outright.
  if (u.protocol !== 'https:' || u.port || u.username || u.password || require('net').isIP(u.hostname.replace(/^\[|\]$/g, ''))) return Promise.resolve({ ok: false });
  return new Promise((resolve) => {
    const req = https.get(u, { headers: { Accept: 'image/*', 'User-Agent': 'ComfyBridge/2.0 (LoRA lookup)' }, timeout: LOOKUP_TIMEOUT_MS, lookup: publicOnlyLookup }, (res) => {
      const code = res.statusCode || 0;
      if (code >= 300 && code < 400 && res.headers.location && hops > 0) {
        res.resume();
        let next = '';
        try { next = new URL(String(res.headers.location), u).toString(); } catch { resolve({ ok: false }); return; }
        void fetchPreview(next, hops - 1).then(resolve);
        return;
      }
      const type = String(res.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
      if (code !== 200 || !PREVIEW_TYPES.test(type)) { res.resume(); resolve({ ok: false }); return; }
      const chunks: Buffer[] = [];
      let size = 0;
      res.on('data', (c: Buffer) => {
        size += c.length;
        if (size > PREVIEW_MAX_BYTES) { req.destroy(); resolve({ ok: false }); return; }
        chunks.push(c);
      });
      res.on('end', () => resolve({ ok: true, dataUrl: `data:${type};base64,${Buffer.concat(chunks).toString('base64')}` }));
      res.on('error', () => resolve({ ok: false }));
    });
    req.on('timeout', () => req.destroy());
    req.on('error', () => resolve({ ok: false }));
  });
}
ipcMain.handle('lora-preview-image', (_event, raw) => fetchPreview(String(raw), 3));
// A LoRA's file metadata (Osmium Comfy's runner). Never starts it: like every
// other desktop request, a stopped runner answers "Click Connect to start it".
ipcMain.handle('lora-file-info', async (_event, name) => localLoraInfo(String(name || '')));
// LoRA folder browser + downloads + the download keys (the app window is
// the one place set_keys may come from). Never starts the runner.
ipcMain.handle('lora-op', async (_event, payload) => localLoraOp(payload && typeof payload === 'object' ? payload : {}));

// Since 2026-10-13 any image imports: the renderer's shared prompt-import.ts
// reads the Bridge workflow, other ComfyUI workflows, A1111/Forge, NovelAI,
// InvokeAI and SwarmUI. This side only picks the file and hands over its PNG
// text chunks (compressed ones inflated here with zlib) and, for JPEG/WebP,
// the bytes (their EXIF is parsed in the renderer).
ipcMain.handle('import-workflow-file', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const res = await dialog.showOpenDialog(win, {
    title: 'Import a generation (from this workflow, another ComfyUI workflow, A1111, NovelAI…)',
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
    properties: ['openFile']
  });
  if (res.canceled || !res.filePaths[0]) return { ok: false, cancelled: true };
  const file = res.filePaths[0];
  try {
    const buf = fs.readFileSync(file);
    const isPng = buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50;
    // The bytes always (the import lightbox and Metadata tab show the image);
    // a PNG's text chunks too, compressed ones inflated here.
    return isPng ? { ok: true, texts: extractPngTextChunks(buf), bytes: new Uint8Array(buf) } : { ok: true, bytes: new Uint8Array(buf) };
  } catch (err) {
    return { ok: false, error: `Could not read ${file}: ${err.message}` };
  }
});

// A /history image entry's save path -> app-relative path kept inside the
// chosen output folder. Sanitized defensively: forward-slash only, no `..`
// segments, no drive/absolute anchors — this string comes over the wire from
// a remote server, so a rename cannot sneak a traversal through it.
function saveImageRelPath(image: { filename?: string; subfolder?: string }): string | null {
  const raw = `${(image.subfolder || '').replace(/\\/g, '/').replace(/\/+/g, '/')}/${(image.filename || '').replace(/\\/g, '/')}`;
  const parts = raw.split('/').filter(p => p && p !== '.' && p !== '..' && !/^[A-Za-z]:$/.test(p));
  return parts.length ? parts.join('/') : null;
}

ipcMain.handle('save-image', async (_event, { filename, bytes }) => {
  try {
    const folder = getPickedOutputFolder();
    if (!folder) return { ok: false, error: 'No output folder chosen.' };
    // filename may carry the namer's subfolder (e.g. "safe/char/x_01.png");
    // run it through the same traversal sanitizer the server paths use, then
    // resolve under the stored folder and reject anything outside it.
    const rel = saveImageRelPath({ filename });
    if (!rel) return { ok: false, error: 'Invalid file name.' };
    const base = path.resolve(folder);
    const dest = path.resolve(base, rel);
    if (dest !== base && !dest.startsWith(base + path.sep)) return { ok: false, error: 'Invalid file path.' };
    assertWithinBase(base, dest);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, Buffer.from(bytes));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// Gallery backing — single-level listing + file reads inside the picked
// output folder, so the shared gallery sidebar (src/renderer/shared/) can
// scan it the same way mobile scans SAF/Documents. The folder is main's
// stored pick (never renderer-supplied); relDir/relPath are resolved under it,
// rejected on traversal, and re-checked after following symlinks.
const GALLERY_IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const GALLERY_MIME_BY_EXT = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

function galleryAbsPath(base: string, rel: string): string {
  const root = path.resolve(base);
  const abs = path.resolve(root, rel || '');
  if (abs !== root && !abs.startsWith(root + path.sep)) throw new Error('Invalid path.');
  assertWithinBase(root, abs);
  return abs;
}

ipcMain.handle('gallery-list-dir', async (_event, { relDir }) => {
  try {
    const folder = getPickedOutputFolder();
    if (!folder) return { ok: false, error: 'No output folder chosen.' };
    const abs = galleryAbsPath(folder, relDir);
    const dirents = fs.readdirSync(abs, { withFileTypes: true });
    return {
      ok: true,
      entries: dirents.map((e) => {
        let mtime = 0;
        try {
          mtime = fs.statSync(path.join(abs, e.name)).mtimeMs || 0;
        } catch {
          /* best effort — leaves mtime 0 */
        }
        return {
          name: e.name,
          kind: e.isDirectory() ? 'directory' : 'file',
          mtime
        };
      })
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('gallery-read', async (_event, { relPath }) => {
  try {
    const folder = getPickedOutputFolder();
    if (!folder) return { ok: false, error: 'No output folder chosen.' };
    const abs = galleryAbsPath(folder, relPath);
    const ext = path.extname(abs).toLowerCase();
    if (!GALLERY_IMAGE_EXTENSIONS.has(ext)) return { ok: false, error: 'Not an image file.' };
    const data = fs.readFileSync(abs);
    return { ok: true, base64: data.toString('base64'), mime: GALLERY_MIME_BY_EXT[ext] || 'image/png' };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// Reorganize from the gallery (2026-10-12): move one saved image to a new
// scheme-derived path inside the picked output folder. Same-volume rename.
// Both paths go through the same sanitizer save-image uses; the destination
// must not exist (the renderer picked the next free counter moments ago — a
// collision means the world changed underneath it, not that we overwrite),
// and its parent is created on demand so a move into a fresh rating/character
// folder just works.
ipcMain.handle('move-image', async (_event, { from, to }) => {
  try {
    const folder = getPickedOutputFolder();
    if (!folder) return { ok: false, error: 'No output folder chosen.' };
    const fromRel = saveImageRelPath({ filename: String(from || '') });
    const toRel = saveImageRelPath({ filename: String(to || '') });
    if (!fromRel || !toRel) return { ok: false, error: 'Invalid file path.' };
    const base = path.resolve(folder);
    const srcAbs = path.resolve(base, fromRel);
    const destAbs = path.resolve(base, toRel);
    for (const abs of [srcAbs, destAbs]) {
      if (abs !== base && !abs.startsWith(base + path.sep)) return { ok: false, error: 'Invalid file path.' };
      assertWithinBase(base, abs);
    }
    if (!fs.existsSync(srcAbs) || !fs.statSync(srcAbs).isFile()) return { ok: false, error: 'That image is no longer where it was.' };
    if (srcAbs === destAbs) return { ok: true };
    // A stale counter (the listing that picked this name is gone) or a
    // directory at the destination both refuse — a move is never allowed to
    // replace anything that is already there, related or not.
    let destStat: import('fs').Stats | null = null;
    try { destStat = fs.statSync(destAbs); } catch { /* free */ }
    if (destStat) return { ok: false, error: destStat.isDirectory() ? 'The destination name already exists as a folder.' : 'The destination name is already taken.' };
    fs.mkdirSync(path.dirname(destAbs), { recursive: true });
    fs.renameSync(srcAbs, destAbs);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});


// ---------------- ComfyUI bridge ----------------
// Copied verbatim from Osmium Workshop's src/main.ts (SynthDat Overseer
// section) — the renderer can't talk to ComfyUI directly (its server.py
// rejects cross-origin POSTs whose Origin doesn't match Host, and Chromium's
// own CORS would block reading the response anyway), so a plain Node HTTP
// client in this process does the round trip and relays results over IPC.
function comfyRequest(host, urlPath, { method = 'GET', headers = {}, body = null, timeoutMs = 8000 }: any = {}): Promise<{ status: number; body: Buffer }> {
  return new Promise((resolve, reject) => {
    // `new URL(urlPath, host)` silently ignores `host` if urlPath is absolute
    // (e.g. "http://evil/…") or protocol-relative ("//evil/…"). Callers use
    // fixed relative paths, so reject those shapes outright and only allow
    // http/https hosts.
    if (typeof urlPath !== 'string' || !urlPath.startsWith('/') || urlPath.startsWith('//')) {
      reject(new Error('Invalid ComfyUI request path.')); return;
    }
    let base;
    try { base = new URL(host); } catch (err) { reject(new Error('Invalid ComfyUI host URL.')); return; }
    if (base.protocol !== 'http:' && base.protocol !== 'https:') { reject(new Error('ComfyUI host must be http or https.')); return; }
    let target;
    try { target = new URL(urlPath, base); } catch (err) { reject(new Error('Invalid ComfyUI host URL.')); return; }
    const lib = target.protocol === 'https:' ? https : http;
    const req = lib.request(target, { method, headers }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
    });
    req.on('error', (err) => reject(err));
    req.setTimeout(timeoutMs, () => req.destroy(new Error('Request to ComfyUI timed out.')));
    if (body) req.write(body);
    req.end();
  });
}

// Node transport for the shared ComfyUI client (comfy-core.ts).
const nodeComfyTransport: ComfyTransport = {
  request: async (host, path, init = {}) => {
    const res = await comfyRequest(host, path, init);
    return { status: res.status, body: res.body };
  }
};

ipcMain.handle('synthdat-get-object-info', async (event, { host, classType, inputName }) => {
  if (host === LOCAL_COMFY_HOST) return localObjectInfo(classType, inputName);
  try {
    const res = await comfyRequest(host, `/object_info/${encodeURIComponent(classType)}`, { timeoutMs: 6000 });
    if (res.status !== 200) return { ok: false, error: `ComfyUI returned HTTP ${res.status} looking up ${classType}.` };
    const parsed = JSON.parse(res.body.toString('utf8'));
    const values = parseComboValues(parsed[classType], inputName);
    if (!Array.isArray(values)) return { ok: false, error: `Could not find "${inputName}" on ${classType} — is the right custom node installed?` };
    return { ok: true, values };
  } catch (err) {
    return { ok: false, error: `Could not reach ComfyUI at ${host} — is it running? (${err.message})` };
  }
});

let activeGen: { cancelled: boolean; ws: any } | null = null;

ipcMain.handle('synthdat-stop-generation', async (event, host) => {
  if (host === LOCAL_COMFY_HOST) { localStop(); return { ok: true }; }
  if (activeGen) activeGen.cancelled = true;
  try { await comfyRequest(host, '/interrupt', { method: 'POST', timeoutMs: 5000 }); } catch (err) { /* best effort */ }
  return { ok: true };
});

// One-shot fetch of ComfyUI's buffered terminal output — same internal
// endpoint its own frontend's Logs panel reads (see the websocket
// subscription below for the live-streaming half of this).
ipcMain.handle('comfy-fetch-logs', async (event, { host }) => {
  // Local ComfyUI: the runner's own log buffer (new lines arrive live via
  // onLocalLogs below).
  if (host === LOCAL_COMFY_HOST) return localLogs();
  try {
    const res = await comfyRequest(host, '/internal/logs/raw', { timeoutMs: 8000 });
    if (res.status !== 200) return { ok: false, error: `ComfyUI returned HTTP ${res.status} fetching logs.` };
    let parsed: any = {};
    try { parsed = JSON.parse(res.body.toString('utf8') || '{}'); } catch (err) { return { ok: false, error: 'ComfyUI returned an unreadable logs response.' }; }
    return { ok: true, entries: parsed.entries || [] };
  } catch (err) {
    return { ok: false, error: `Could not reach ComfyUI at ${host} (${err.message})` };
  }
});

// ---------------- WD14 tagging (shared/wd14-tag.ts) ----------------
// One image: upload into '239', run the LoadImage → WD14Tagger '2' graph the
// renderer built, read the tags (server: /history; Osmium Comfy: the runner's
// `texts`, the tagger being marked `_meta.capture`).
ipcMain.handle('wd14-tag', async (event, { host, imageFilename, imageBytes, prompt }) => {
  if (!prompt || !prompt['239'] || !prompt['2']) return { ok: false, error: 'Not a WD14 tagging graph.' };
  if (host === LOCAL_COMFY_HOST) {
    const r = await localGenerate(event.sender, prompt, imageBytes);
    if (!r.ok) return r;
    const tags = r.texts && r.texts['2'];
    return typeof tags === 'string' ? { ok: true, tags } : { ok: false, error: 'The tagger returned no tags.' };
  }
  try {
    const upload = await uploadImage(nodeComfyTransport, host, imageFilename || 'image.png', imageBytes, 'Image');
    if (!upload.ok) return upload;
    prompt['239'].inputs.image = upload.ref;
    const clientId = `comfy-bridge-${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
    const queue = await queuePrompt(nodeComfyTransport, host, prompt, clientId, { noun: 'tag' });
    if (!queue.ok) return queue;
    const poll = await pollHistory<string>(nodeComfyTransport, host, queue.promptId, {
      deadlineMs: 180000,
      extract: (record) => extractWd14Tags(record),
      errorStatusMessage: 'ComfyUI reported an error while tagging — check its console.',
      timeoutMessage: 'Timed out waiting for ComfyUI to tag the image.'
    });
    if (!poll.ok) return poll;
    return { ok: true, tags: poll.value };
  } catch (err) {
    return { ok: false, error: `Could not reach ComfyUI at ${host} (${(err as Error).message})` };
  }
});

// An image picked for tagging, remembered by token so the renderer can later
// ask for "<same folder>/<same name>.txt" without ever handling a path.
const taggingPicks = new Map<string, string>();
ipcMain.handle('wd14-pick-image', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const res = await dialog.showOpenDialog(win, { properties: ['openFile'], filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }] });
  if (res.canceled || !res.filePaths[0]) return { ok: false };
  const file = res.filePaths[0];
  if (!GALLERY_IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase())) return { ok: false, error: 'Not an image file.' };
  const token = randomUUID();
  taggingPicks.set(token, file);
  if (taggingPicks.size > 50) taggingPicks.delete(taggingPicks.keys().next().value as string);
  return { ok: true, token, name: path.basename(file), bytes: new Uint8Array(fs.readFileSync(file)) };
});
ipcMain.handle('wd14-save-txt-beside', async (_event, { token, text, overwrite }) => {
  const file = typeof token === 'string' ? taggingPicks.get(token) : undefined;
  if (!file) return { ok: false, error: 'Pick the image again.' };
  if (typeof text !== 'string' || text.length > 1_000_000) return { ok: false, error: 'Invalid text.' };
  const dest = path.join(path.dirname(file), path.parse(file).name + '.txt');
  try {
    if (fs.existsSync(dest) && !overwrite) return { ok: false, exists: true };
    fs.writeFileSync(dest, text, 'utf8');
    return { ok: true, path: dest };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
});

ipcMain.handle('synthdat-queue-and-fetch', async (event, { host, imageFilename, imageBytes, prompt }) => {
  if (host === LOCAL_COMFY_HOST) return localGenerate(event.sender, prompt, imageBytes);
  let ws: any = null;
  try {
    if (imageBytes && prompt['239']) {
      const upload = await uploadImage(nodeComfyTransport, host, imageFilename, imageBytes, 'Reference image');
      if (!upload.ok) return upload;
      prompt['239'].inputs.image = upload.ref;
    }

    const clientId = `comfy-bridge-${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;

    activeGen = { cancelled: false, ws: null };
    try {
      const wsUrl = `${host.replace(/^http/i, 'ws')}/ws?clientId=${encodeURIComponent(clientId)}`;
      ws = new WS(wsUrl);
      activeGen.ws = ws;
      ws.on('open', () => {
        try { ws.send(JSON.stringify({ type: 'feature_flags', data: { supports_preview_metadata: true } })); }
        catch (err) { /* best effort */ }
        // ComfyUI's own frontend "Logs" panel uses this exact internal API
        // (PATCH /internal/logs/subscribe + a "logs" websocket message type)
        // to stream real stdout/stderr — undocumented/unversioned per its
        // own server code comment, but it's what the actual terminal output
        // runs through, not a proxy for it.
        const subBody = Buffer.from(JSON.stringify({ clientId, enabled: true }), 'utf8');
        comfyRequest(host, '/internal/logs/subscribe', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Content-Length': subBody.length },
          body: subBody,
          timeoutMs: 5000
        }).catch(() => { /* best effort — log streaming just won't start */ });
      });
      ws.on('message', (data, isBinary) => {
        if (isBinary) {
          if (data.length < 8) return;
          const eventType = data.readUInt32BE(0);
          if (eventType === 1) {
            const imageType = data.readUInt32BE(4);
            event.sender.send('preview-frame', {
              mime: imageType === 1 ? 'image/jpeg' : 'image/png',
              bytes: new Uint8Array(data.subarray(8))
            });
          } else if (eventType === 4) {
            try {
              const metaLen = data.readUInt32BE(4);
              const meta = JSON.parse(data.subarray(8, 8 + metaLen).toString('utf8'));
              event.sender.send('preview-frame', {
                mime: meta.image_type || 'image/jpeg',
                bytes: new Uint8Array(data.subarray(8 + metaLen))
              });
            } catch (err) { /* malformed metadata frame — skip */ }
          }
        } else {
          try {
            const msg = JSON.parse(data.toString('utf8'));
            if (msg.type === 'logs' && msg.data && Array.isArray(msg.data.entries)) {
              event.sender.send('comfy-log', msg.data.entries);
            } else if (msg.type === 'progress' && msg.data) {
              event.sender.send('gen-progress', msg.data);
            } else if (msg.type === 'progress_state' && msg.data && msg.data.nodes) {
              const running = Object.values(msg.data.nodes).filter((n: any) => n.state === 'running');
              if (running.length) {
                const n: any = running[running.length - 1];
                event.sender.send('gen-progress', { value: n.value, max: n.max });
              }
            }
          } catch (err) { /* ignore malformed frames */ }
        }
      });
      ws.on('error', (err) => console.error('[comfy-bridge] preview websocket error:', err && err.message));
      ws.on('unexpected-response', (req, res) => console.error('[comfy-bridge] preview websocket handshake rejected:', res.statusCode));
      ws.on('close', (code, reason) => { if (code !== 1000) console.error('[comfy-bridge] preview websocket closed:', code, reason && reason.toString()); });
      await new Promise<void>((resolve) => {
        const done = () => { ws.removeListener('open', done); ws.removeListener('error', done); ws.removeListener('unexpected-response', done); resolve(); };
        ws.once('open', done);
        ws.once('error', done);
        ws.once('unexpected-response', done);
        setTimeout(done, 3000);
      });
    } catch (err) { console.error('[comfy-bridge] preview websocket setup failed:', err && err.message); }

    const queue = await queuePrompt(nodeComfyTransport, host, prompt, clientId, { extraData: { preview_method: 'taesd' }, noun: 'generation' });
    if (!queue.ok) return queue;
    const promptId = queue.promptId;

    const poll = await pollHistory<any>(nodeComfyTransport, host, promptId, {
      deadlineMs: 300000,
      isCancelled: () => !!(activeGen && activeGen.cancelled),
      onCancelled: () => ({ ok: false, error: 'Generation stopped.', interrupted: true }),
      errorStatusMessage: 'ComfyUI reported an error while generating this image — check its console for details.',
      timeoutMessage: 'Timed out waiting for ComfyUI to finish generating this image.',
      extract: async (record) => {
        const saveOutput = record.outputs && record.outputs['192'];
        const image = saveOutput && Array.isArray(saveOutput.images) && saveOutput.images[0];
        // '192_pass1' and '192_upscaled' are sibling branches off the same
        // upstream node as '192', not downstream of it — ComfyUI doesn't
        // guarantee they finish before '192' does. Only treat the job as done
        // once every branch the submitted prompt actually asked for has an
        // output, or a still-running sibling branch's image gets missed.
        const pass1Ready = !prompt['192_pass1'] || (record.outputs && record.outputs['192_pass1']);
        const upscaledReady = !prompt['192_upscaled'] || (record.outputs && record.outputs['192_upscaled']);
        if (!(image && pass1Ready && upscaledReady)) return null;
        const qs = new URLSearchParams({ filename: image.filename, subfolder: image.subfolder || '', type: image.type || 'output' });
        const viewRes = await comfyRequest(host, `/view?${qs.toString()}`, { timeoutMs: 20000 });
        if (viewRes.status !== 200) return null;
        const result: any = { ok: true, imageBytes: new Uint8Array(viewRes.body) };
        // The SaveImage node's own path/subfolder from history — the File
        // Namer's composed scheme, which the app-side disk copy mirrors.
        result.saveRel = saveImageRelPath(image);
        const pass1Output = record.outputs['192_pass1'];
        const pass1Image = pass1Output && Array.isArray(pass1Output.images) && pass1Output.images[0];
        if (pass1Image) {
          const qs1 = new URLSearchParams({ filename: pass1Image.filename, subfolder: pass1Image.subfolder || '', type: pass1Image.type || 'output' });
          const viewRes1 = await comfyRequest(host, `/view?${qs1.toString()}`, { timeoutMs: 20000 });
          if (viewRes1.status === 200) { result.pass1ImageBytes = new Uint8Array(viewRes1.body); result.pass1SaveRel = saveImageRelPath(pass1Image); }
        }
        const upscaledOutput = record.outputs['192_upscaled'];
        const upscaledImage = upscaledOutput && Array.isArray(upscaledOutput.images) && upscaledOutput.images[0];
        if (upscaledImage) {
          const qsU = new URLSearchParams({ filename: upscaledImage.filename, subfolder: upscaledImage.subfolder || '', type: upscaledImage.type || 'output' });
          const viewResU = await comfyRequest(host, `/view?${qsU.toString()}`, { timeoutMs: 20000 });
          if (viewResU.status === 200) { result.upscaledImageBytes = new Uint8Array(viewResU.body); result.upscaledSaveRel = saveImageRelPath(upscaledImage); }
        }
        return result;
      }
    });
    return poll.ok ? poll.value : poll;
  } catch (err) {
    return { ok: false, error: `Could not reach ComfyUI at ${host} — is it running? (${err.message})` };
  } finally {
    try { if (ws) ws.close(); } catch (err) { /* already closed */ }
    activeGen = null;
  }
});

// ---------------- Prompt / Negative presets ----------------
// One JSON file in userData, holding two independent named-preset maps.
// Prompt presets snapshot every prompt-side field (a whole character setup);
// Negative presets are kept separate since a negative prompt is often reused
// across many DIFFERENT characters, while a Prompt preset is tied to one
// specific character — coupling them would force re-saving the negative
// every time a character preset changes, or vice versa. Whole-file
// read/modify/write on every save/delete (same pattern as Dataset Tag
// Studio's SynthDat settings file) — this file is tiny, so nothing more
// granular is warranted.
const PRESETS_FILE = () => path.join(app.getPath('userData'), 'comfy-bridge-presets.json');

interface PresetsFile {
  promptPresets: Record<string, Record<string, string | boolean>>;
  negativePresets: Record<string, string>;
}

function readPresetsFile(): PresetsFile {
  try {
    const raw = fs.readFileSync(PRESETS_FILE(), 'utf8');
    const parsed = JSON.parse(raw);
    return {
      promptPresets: (parsed && parsed.promptPresets) || {},
      negativePresets: (parsed && parsed.negativePresets) || {}
    };
  } catch (err) {
    return { promptPresets: {}, negativePresets: {} }; // no file yet — not an error
  }
}

function writePresetsFile(data: PresetsFile): void {
  fs.mkdirSync(path.dirname(PRESETS_FILE()), { recursive: true });
  fs.writeFileSync(PRESETS_FILE(), JSON.stringify(data, null, 2));
}

// Preset names are keys in one JSON object, so guard the two names that walk
// the prototype chain rather than becoming own properties.
const UNSAFE_PRESET_NAMES = new Set(['__proto__', 'constructor', 'prototype']);
function safePresetName(name: unknown): string | null {
  const n = String(name == null ? '' : name).trim();
  return n && !UNSAFE_PRESET_NAMES.has(n) ? n : null;
}

ipcMain.handle('list-presets', () => {
  const data = readPresetsFile();
  return {
    ok: true,
    promptPresetNames: Object.keys(data.promptPresets).sort(),
    negativePresetNames: Object.keys(data.negativePresets).sort()
  };
});

ipcMain.handle('save-preset', (event, { kind, name: rawName, value }) => {
  const name = safePresetName(rawName);
  if (!name) return { ok: false, error: 'Preset name cannot be blank.' };
  const data = readPresetsFile();
  if (kind === 'prompt') data.promptPresets[name] = value;
  else if (kind === 'negative') data.negativePresets[name] = value;
  else return { ok: false, error: `Unknown preset kind: ${kind}` };
  try {
    writePresetsFile(data);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('load-preset', (event, { kind, name: rawName }) => {
  const name = safePresetName(rawName);
  if (!name) return { ok: false, error: 'Preset name cannot be blank.' };
  const data = readPresetsFile();
  const value = kind === 'prompt' ? data.promptPresets[name] : kind === 'negative' ? data.negativePresets[name] : undefined;
  if (value === undefined) return { ok: false, error: `Preset "${name}" not found.` };
  return { ok: true, value };
});

ipcMain.handle('delete-preset', (event, { kind, name: rawName }) => {
  const name = safePresetName(rawName);
  if (!name) return { ok: false, error: 'Preset name cannot be blank.' };
  const data = readPresetsFile();
  if (kind === 'prompt') delete data.promptPresets[name];
  else if (kind === 'negative') delete data.negativePresets[name];
  else return { ok: false, error: `Unknown preset kind: ${kind}` };
  try {
    writePresetsFile(data);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});
