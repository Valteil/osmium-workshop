import { app, BrowserWindow, Menu, ipcMain, dialog, shell } from 'electron';
import { execFileSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import WS from 'ws';
import { registerWd14LocalHandlers } from './wd14-local';
import { registerBucketLocalHandlers } from './bucket-local';
import { parseComboValues, buildWd14Prompt, extractWd14Tags, uploadImage, queuePrompt, pollHistory } from './comfy-core';
import type { ComfyTransport } from './comfy-core';
import type {
  Wd14TagImagePayload, SynthdatObjectInfoPayload, SynthdatQueuePayload,
  ExportAppStateResult
} from './ipc-types';
import type { ComfyResult } from './shared-types';

// `__closeConfirmed` is a flag this file sets on the window itself (see the
// close/confirm-close pair below) — not part of Electron's own BrowserWindow.
type AppWindow = BrowserWindow & { __closeConfirmed?: boolean };

interface ComfyRequestOptions {
  method?: string;
  headers?: Record<string, string | number>;
  body?: Buffer | Uint8Array | null;
  timeoutMs?: number;
}

// ---- Portable mode ----
// A packaged build stores everything (the renderer's live "tool" copy, plus
// Chromium's own profile data — which is where localStorage physically
// lives, so this covers themes/achievements/settings too) in a `data/`
// folder next to the actual executable, instead of %APPDATA%. That's what
// makes the built app a true carry-around folder: unzip it anywhere, run
// it from a USB stick, delete it when done, and nothing is left behind
// on the machine.
//
// In dev (`npm start`, unpackaged) this intentionally does nothing — the
// existing %APPDATA%\osmium-workshop\tool workflow (sync-tool-folder.js,
// the Restart app button) keeps working exactly as before.
function getPortableRoot(): string {
  // Dev (`npm start`, unpackaged): app.getPath('exe') points at the electron
  // binary buried in node_modules/electron/dist, not this project — anything
  // "portable-root-relative" should resolve to the project root instead.
  if (!app.isPackaged) return __dirname;
  // electron-builder's NSIS "portable" target self-extracts to a temp
  // folder on every launch and can't be written back to — it sets this env
  // var specifically so apps know where the actual portable .exe lives.
  if (process.env.PORTABLE_EXECUTABLE_DIR) return process.env.PORTABLE_EXECUTABLE_DIR;
  // AppImage's equivalent: $APPIMAGE is the path to the .AppImage file itself.
  if (process.env.APPIMAGE) return path.dirname(process.env.APPIMAGE);
  // Any other packaged target (e.g. an unpacked "dir" build): the exe's own folder.
  return path.dirname(app.getPath('exe'));
}

function configurePortableUserData() {
  if (!app.isPackaged) return;
  // macOS apps aren't expected to carry their own data next to the binary
  // (writing inside a signed .app bundle is asking for trouble) — portable
  // mode here targets Windows/Linux, where end users actually want a
  // carry-around folder. Mac keeps Electron's normal per-user data dir.
  if (process.platform === 'darwin') return;
  const portableDataDir = path.join(getPortableRoot(), 'data');
  fs.mkdirSync(portableDataDir, { recursive: true });
  app.setPath('userData', portableDataDir);
}
configurePortableUserData();

// ---- Hardware acceleration preference (Settings toggle) ----
// Measured: this app's own UI compositing was costing ~30% GPU load on a
// laptop's DISCRETE GPU — the same GPU ComfyUI needs for actual inference —
// even though nothing here does anything GPU-heavy. Default behavior steers
// rendering onto the INTEGRATED GPU instead (still hardware-accelerated,
// just on the weaker/power-saving adapter); a Settings toggle lets anyone
// with a GPU they don't mind this app using turn that off, or disable GPU
// acceleration entirely.
//
// This can only be decided at Electron startup, before `app.whenReady()`/
// any window creation — there is no way to change it live without a
// relaunch, which is why the preference lives in its own tiny file the MAIN
// process reads directly, not in the renderer's localStorage (which the
// main process can't reach before a window/webview even exists yet). The
// renderer's Settings toggle just writes this file and prompts a restart —
// see `restartApp()`'s existing flow.
const HW_ACCEL_PREF_FILE = () => path.join(app.getPath('userData'), 'hw-accel-pref.json');

function readHardwareAccelPref(): boolean {
  try {
    const raw = fs.readFileSync(HW_ACCEL_PREF_FILE(), 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.enabled === 'boolean' ? parsed.enabled : true;
  } catch (err) {
    return true; // default: on (integrated-GPU-steered, see below)
  }
}

function writeHardwareAccelPref(enabled: boolean) {
  try {
    fs.mkdirSync(path.dirname(HW_ACCEL_PREF_FILE()), { recursive: true });
    fs.writeFileSync(HW_ACCEL_PREF_FILE(), JSON.stringify({ enabled: !!enabled }));
  } catch (err) {
    // Non-fatal — worst case the toggle doesn't persist across a restart.
  }
}

const hardwareAccelEnabled = readHardwareAccelPref();

if (!hardwareAccelEnabled) {
  // The literal "off" case some users want when they'd rather have zero GPU
  // usage than a reduced amount — pure software (CPU) rendering.
  app.disableHardwareAcceleration();
} else {
  // Prefer the integrated GPU on hybrid-graphics (Optimus/PowerXpress)
  // laptops — the default, and what actually fixes the reported GPU-
  // contention-with-ComfyUI problem while keeping acceleration on. Two
  // independent mechanisms, applied together for defense in depth:
  // 1. The Chromium switch tells its OWN GPU process to pick the low-power
  //    adapter, but only takes effect for Chromium's internal adapter choice.
  // 2. The per-exe registry key is the actual OS-level mechanism Windows'
  //    own Settings > Display > Graphics panel writes when a user manually
  //    sets an app to "Power saving" — it steers DXGI's adapter enumeration
  //    before Chromium (or any D3D app) even starts, so it's the more
  //    reliable of the two and works regardless of Chromium-version quirks.
  // Windows-only (hybrid graphics + this registry key are a Windows
  // concept); the registry write is gated to packaged builds only, same
  // reasoning as configurePortableUserData — app.getPath('exe') in dev
  // points at the shared node_modules/electron binary, and writing a GPU
  // preference for THAT would leak into every other Electron app's dev
  // environment on the same machine, not just this one.
  app.commandLine.appendSwitch('force_low_power_gpu');

  if (process.platform === 'win32' && app.isPackaged) {
    try {
      const exePath = app.getPath('exe');
      const keyPath = 'HKCU\\Software\\Microsoft\\DirectX\\UserGpuPreferences';
      let current = '';
      try {
        current = execFileSync('reg', ['query', keyPath, '/v', exePath], { encoding: 'utf8' });
      } catch (err) {
        // Non-zero exit just means the value doesn't exist yet — fall through to set it.
      }
      if (!current.includes('GpuPreference=1;')) {
        execFileSync('reg', ['add', keyPath, '/v', exePath, '/t', 'REG_SZ', '/d', 'GpuPreference=1;', '/f']);
      }
    } catch (err) {
      // Non-fatal — worst case the app keeps using whatever GPU Windows already picked.
    }
  }
}

function getToolDir(): string {
  return path.join(app.getPath('userData'), 'tool');
}

function copyDirSync(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirSync(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

async function copyRecursiveAsync(src: string, dest: string): Promise<void> {
  const stat = await fs.promises.stat(src);
  if (stat.isDirectory()) {
    await fs.promises.mkdir(dest, { recursive: true });
    const entries = await fs.promises.readdir(src);
    for (const entry of entries) {
      await copyRecursiveAsync(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    await fs.promises.mkdir(path.dirname(dest), { recursive: true });
    await fs.promises.copyFile(src, dest);
  }
}

// The renderer (index.html/app.js/styles.css/data/) lives in userData/tool so
// future updates can be applied by replacing files there — no rebuild needed.
// If it's not there yet (first run), seed it from the bundled copy.
function ensureRendererFiles(): string {
  const toolDir = getToolDir();
  const toolIndex = path.join(toolDir, 'index.html');
  if (!fs.existsSync(toolIndex)) {
    copyDirSync(path.join(__dirname, 'renderer'), toolDir);
  }
  return toolIndex;
}

function createWindow(): void {
  // electron-builder's own `build.win/mac/linux.icon` (package.json) bakes the icon into a
  // PACKAGED exe automatically — this is what makes it show up in dev (`npm start`, unpackaged)
  // and on Linux, where there's no single exe resource to bake it into. .ico on Windows (multi-
  // resolution, what the taskbar/titlebar actually want), .png everywhere else.
  const windowIcon = path.join(__dirname, 'build', process.platform === 'win32' ? 'icon.ico' : 'icon.png');
  const win: AppWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1040,
    minHeight: 640,
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

  // Start maximized instead of at the fixed 1440x900 default — show only
  // once maximized so there's no visible resize flash on launch.
  win.once('ready-to-show', () => {
    win.maximize();
    win.show();
  });

  win.loadFile(ensureRendererFiles());

  // Ask the renderer before actually closing, so it can warn about unsaved
  // caption changes. A renderer-side `beforeunload` handler alone does NOT
  // work for this in Electron — calling preventDefault() on it silently
  // blocks the close with no dialog at all (Electron doesn't implement
  // Chromium's native "leave site?" prompt), which is exactly what made the
  // window hang and need a Task Manager kill whenever there were unsaved
  // changes. `close-confirmed` on this window is the one-time signal that
  // lets a later `.close()` through without looping back into this handler.
  win.on('close', (event) => {
    if (win.__closeConfirmed) return;
    event.preventDefault();
    win.webContents.send('request-close');
  });

  // Uncomment while debugging:
  // win.webContents.openDevTools();
}

// The renderer calls this once it's decided the window is actually OK to
// close (no unsaved changes, or the user confirmed anyway) in response to
// the 'request-close' message above. Marking __closeConfirmed lets the
// re-triggered .close() below fall through the 'close' handler instead of
// looping back into another 'request-close' round-trip.
// Single source of truth for the version shown in the renderer's own top-left
// corner and baked into Export App State — app.getVersion() reads package.json
// itself, so this can never drift from the real version the way a hand-typed
// renderer-side constant did (it sat at '2.0.0' while package.json had long
// since moved to '1.1.0', with nothing keeping the two in sync).
ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('confirm-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender) as AppWindow | null;
  if (win) {
    win.__closeConfirmed = true;
    win.close();
  }
});

// Settings → "Export app state": a debugging snapshot (localStorage prefs,
// theme, whether a dataset is loaded, view mode, etc. — gathered entirely
// on the renderer side, this handler just writes the already-formatted text
// it's handed) dropped next to the exe/project root — the same "root
// folder" getPortableRoot() already resolves for the portable-mode data
// folder, so it's wherever the user would actually look for app-adjacent
// files, not buried in userData.
ipcMain.handle('export-app-state', (_event, text: string): ExportAppStateResult => {
  try {
    const stamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '').replace('T', '_');
    const filePath = path.join(getPortableRoot(), `dts-app-state_${stamp}.txt`);
    fs.writeFileSync(filePath, text);
    shell.showItemInFolder(filePath);
    return { ok: true, path: filePath };
  } catch (err) {
    return { ok: false, message: 'Failed to write app state file: ' + (err as Error).message };
  }
});

// Restarts the app from inside itself, re-copying the bundled renderer/
// over userData/tool first. In a dev checkout, __dirname/renderer IS the
// source you're editing, so this is an instant "reload my latest changes"
// button with no separate sync step.
ipcMain.handle('restart-app', async () => {
  // Only re-sync from the bundled renderer/ in dev — packaged builds just
  // relaunch with whatever is already in userData/tool (refresh-app is what
  // reseeds that for a packaged/portable build, not this handler).
  if (!app.isPackaged) {
    try {
      await copyRecursiveAsync(path.join(__dirname, 'renderer'), getToolDir());
    } catch (err) {
      // Non-fatal — relaunch anyway with whatever is already in tool/.
    }
  }
  app.relaunch();
  app.exit(0);
});

// Native page zoom — the same mechanism Chromium uses for Ctrl+/Ctrl-/Ctrl+0.
// Operates at the compositor level, so it correctly rescales the whole
// viewport atomically (vw/vh/% all stay consistent) instead of the
// CSS `zoom` property, which scales an element's own box independently
// of its container and reliably causes overflow.
ipcMain.handle('set-zoom-factor', (event, factor: number) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && typeof factor === 'number' && factor > 0 && factor <= 3) {
    win.webContents.setZoomFactor(factor);
  }
});

// Hardware acceleration is decided once, at process startup, before any
// window exists (see the "Hardware acceleration preference" block above) —
// these just let Settings read/persist the choice; the renderer is
// responsible for prompting a restart afterward, same as any other
// startup-only preference here.
ipcMain.handle('get-hardware-acceleration', () => hardwareAccelEnabled);
ipcMain.handle('set-hardware-acceleration', (_event, enabled: boolean) => {
  writeHardwareAccelPref(!!enabled);
});

// ---------------- WD14 Autotagger (ComfyUI bridge) ----------------
// The renderer can't do this itself: ComfyUI's server.py rejects
// cross-origin POSTs whose Origin doesn't match Host (origin_only_middleware)
// and, separately, Chromium's own CORS would block reading a response that
// lacks an Access-Control-Allow-Origin header from this app's non-http
// origin. Neither restriction applies to a plain Node HTTP client, so these
// calls are made from the main process — which has no browser-style
// CORS/Origin enforcement — and relayed to the renderer over IPC, the same
// "small explicit bridge" shape as every other main-process capability here.
// This is a deliberate, user-configured exception to "no network calls":
// it only ever talks to the host the user typed into Tag Overseer's WD14
// section, expected to be a loopback ComfyUI instance (127.0.0.1/localhost).
function comfyRequest(host: string, urlPath: string, { method = 'GET', headers = {}, body = null, timeoutMs = 8000 }: ComfyRequestOptions = {}): Promise<{ status: number; body: Buffer }> {
  return new Promise((resolve, reject) => {
    let target: URL;
    try { target = new URL(urlPath, host); } catch (err) { reject(new Error('Invalid ComfyUI host URL.')); return; }
    const lib = (target.protocol === 'https:' ? https : http) as typeof http;
    const req = lib.request(target, { method, headers }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks) }));
    });
    req.on('error', (err) => reject(err));
    req.setTimeout(timeoutMs, () => req.destroy(new Error('Request to ComfyUI timed out.')));
    if (body) req.write(body);
    req.end();
  });
}

// Node transport for the shared ComfyUI client (comfy-core.ts) — wraps the raw
// http/https helper above in the transport interface both apps implement.
const nodeComfyTransport: ComfyTransport = {
  request: async (host, path, init = {}) => {
    const res = await comfyRequest(host, path, init);
    return { status: res.status, body: res.body };
  }
};

// Lists the models WD14Tagger|pysssss's own INPUT_TYPES currently reports —
// scraped live from ComfyUI's /object_info, never hardcoded here, so the
// dropdown always matches whatever that node (and its config) actually
// offers on the user's machine.
// On-device WD14 tagging — no ComfyUI instance needed at all. See
// wd14-local.ts's own top comment; this mirrors mobile's DtsWd14Plugin.kt.
  registerWd14LocalHandlers(ipcMain);
  registerBucketLocalHandlers(ipcMain);

ipcMain.handle('wd14-get-models', async (_event, host: string) => {
  try {
    const res = await comfyRequest(host, '/object_info/WD14Tagger%7Cpysssss', { timeoutMs: 6000 });
    if (res.status !== 200) return { ok: false, error: `ComfyUI returned HTTP ${res.status} — is the WD14 Tagger (pysssss) custom node installed?` };
    const parsed = JSON.parse(res.body.toString('utf8'));
    const models = parseComboValues(parsed['WD14Tagger|pysssss'], 'model');
    if (!Array.isArray(models)) return { ok: false, error: 'Could not find the WD14 Tagger node on that ComfyUI instance.' };
    return { ok: true, models };
  } catch (err) {
    return { ok: false, error: `Could not reach ComfyUI at ${host} — is it running? (${(err as Error).message})` };
  }
});

// Full round trip for one image: upload it into ComfyUI's own input/ folder
// (overwriting by name — this app doesn't need ComfyUI to remember it after),
// queue a minimal LoadImage -> WD14Tagger|pysssss graph, then poll /history
// until that node's output appears. imageBytes is a Uint8Array handed over
// from the renderer (read via the image's own FileSystemFileHandle) — the
// app never stores or forwards this anywhere except to the host the user
// configured.
ipcMain.handle('wd14-tag-image', async (_event, { host, filename, imageBytes, settings }: Wd14TagImagePayload) => {
  try {
    const upload = await uploadImage(nodeComfyTransport, host, filename, imageBytes, 'Image');
    if (!upload.ok) return upload;

    const clientId = `dts-${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
    const prompt = buildWd14Prompt(upload.ref, settings);
    const queue = await queuePrompt(nodeComfyTransport, host, prompt, clientId, { noun: 'tag' });
    if (!queue.ok) return queue;

    const poll = await pollHistory<string>(nodeComfyTransport, host, queue.promptId, {
      deadlineMs: 120000,
      extract: (record) => extractWd14Tags(record),
      errorStatusMessage: 'ComfyUI reported an error while tagging this image — check its console for details.',
      timeoutMessage: 'Timed out waiting for ComfyUI to finish tagging this image.'
    });
    if (!poll.ok) return poll;
    return { ok: true, tagsCsv: poll.value };
  } catch (err) {
    return { ok: false, error: `Could not reach ComfyUI at ${host} — is it running? (${(err as Error).message})` };
  }
});

// ---- SynthDat Overseer (ComfyUI-driven synthetic dataset generation) ----
// Same shape as the WD14 handlers above: the renderer never talks to ComfyUI
// directly (CORS/origin — see CLAUDE.md), it hands this process a fully-built
// API-format prompt dict (cloned from the bundled workflow template) plus the
// reference image's raw bytes, and this process does the upload -> queue ->
// poll -> fetch round trip and hands back the finished PNG's bytes.

// Scrapes a node class's own INPUT_TYPES combo list from ComfyUI's live
// /object_info — same "never hardcode a model/LoRA list" principle as
// wd14-get-models, reused here for the diffusion model, Main LoRA, and LoRA
// stack dropdowns (all different node classes, hence this being generic
// rather than three near-duplicate handlers).
ipcMain.handle('synthdat-get-object-info', async (_event, { host, classType, inputName }: SynthdatObjectInfoPayload) => {
  try {
    const res = await comfyRequest(host, `/object_info/${encodeURIComponent(classType)}`, { timeoutMs: 6000 });
    if (res.status !== 200) return { ok: false, error: `ComfyUI returned HTTP ${res.status} looking up ${classType}.` };
    const parsed = JSON.parse(res.body.toString('utf8'));
    const values = parseComboValues(parsed[classType], inputName);
    if (!Array.isArray(values)) return { ok: false, error: `Could not find "${inputName}" on ${classType} — is the right custom node installed?` };
    return { ok: true, values };
  } catch (err) {
    return { ok: false, error: `Could not reach ComfyUI at ${host} — is it running? (${(err as Error).message})` };
  }
});

// Tracks the one SynthDat generation in flight (this app only ever runs one
// at a time) so synthdat-stop-generation can both hit ComfyUI's own
// /interrupt endpoint AND short-circuit the polling loop below immediately,
// rather than waiting for /history to eventually reflect the interruption.
let activeSynthdatGen: { cancelled: boolean; ws: WS | null } | null = null;

ipcMain.handle('synthdat-stop-generation', async (_event, host: string) => {
  if (activeSynthdatGen) activeSynthdatGen.cancelled = true;
  try { await comfyRequest(host, '/interrupt', { method: 'POST', timeoutMs: 5000 }); } catch (err) { /* best effort */ }
  return { ok: true };
});

// Uploads the reference image, injects its ComfyUI-assigned name into the
// prompt's LoadImage node (id 239 in the bundled template), queues it, polls
// /history exactly like wd14-tag-image, then reads the SaveImage node's
// (id 192, "No Upscale" — always present regardless of 1-Pass/2-Pass, see
// CLAUDE.md) output image entry and fetches its bytes via /view.
//
// Also opens a plain WebSocket to ComfyUI's own /ws endpoint (using the same
// client_id as the queued prompt) purely to relay TAESD preview frames and
// step-progress back to the renderer as they arrive — those only ever show
// up over the websocket, /history never carries them. Preview frames arrive
// as ComfyUI's documented binary format: a 4-byte big-endian event type
// (1 = PREVIEW_IMAGE), a 4-byte big-endian image type (1 = JPEG, 2 = PNG),
// then the raw image bytes — forwarded to the renderer as-is via a plain
// `send()` (not part of this handler's own return value) so the renderer
// can update a live preview while the invoke() call is still pending.
ipcMain.handle('synthdat-queue-and-fetch', async (event, { host, imageFilename, imageBytes, prompt }: SynthdatQueuePayload) => {
  let ws: WS | null = null;
  try {
    // "Skip reference image" (renderer's buildPromptFromFields) deletes node
    // 239 (LoadImage) from the prompt entirely, and imageBytes/imageFilename
    // come through as null/undefined in that case — nothing to upload, and
    // no node left to point at an uploaded file even if there were.
    if (imageBytes && prompt['239']) {
      const upload = await uploadImage(nodeComfyTransport, host, imageFilename ?? 'reference', imageBytes, 'Reference image');
      if (!upload.ok) return upload;
      prompt['239'].inputs.image = upload.ref;
    }

    const clientId = `dts-synthdat-${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;

    activeSynthdatGen = { cancelled: false, ws: null };
    try {
      const wsUrl = `${host.replace(/^http/i, 'ws')}/ws?clientId=${encodeURIComponent(clientId)}`;
      const socket = new WS(wsUrl);
      ws = socket;
      activeSynthdatGen.ws = socket;
      // ComfyUI's newer per-step preview path (comfy_execution/progress.py's
      // WebUIProgressHandler.update_handler) only ever sends the image via
      // BinaryEventTypes.PREVIEW_IMAGE_WITH_METADATA (wire event type 4), and
      // only to a client whose FIRST websocket message declared
      // {"type":"feature_flags","data":{"supports_preview_metadata":true}} —
      // confirmed by reading this ComfyUI install's own server.py (the
      // `first_message`/`sockets_metadata[sid]["feature_flags"]` gate) and
      // feature_flags.py. Without this handshake, ComfyUI silently never
      // sends us a preview frame at all, no matter what preview_method the
      // queued prompt requests. Must be sent before anything else on the
      // socket, so do it on 'open' rather than immediately after construction
      // (the underlying TCP/TLS handshake isn't done yet at construction time).
      socket.on('open', () => {
        try { socket.send(JSON.stringify({ type: 'feature_flags', data: { supports_preview_metadata: true } })); }
        catch (err) { /* best effort */ }
      });
      socket.on('message', (data: Buffer, isBinary: boolean) => {
        if (isBinary) {
          if (data.length < 8) return;
          const eventType = data.readUInt32BE(0);
          if (eventType === 1) {
            // Legacy PREVIEW_IMAGE: 4-byte image-type flag (1=JPEG,2=PNG), then raw bytes.
            const imageType = data.readUInt32BE(4);
            event.sender.send('synthdat-preview-frame', {
              mime: imageType === 1 ? 'image/jpeg' : 'image/png',
              bytes: new Uint8Array(data.subarray(8))
            });
          } else if (eventType === 4) {
            // PREVIEW_IMAGE_WITH_METADATA: 4-byte metadata length, then that
            // many bytes of JSON (carries "image_type" as a full mime string),
            // then the raw image bytes.
            try {
              const metaLen = data.readUInt32BE(4);
              const meta = JSON.parse(data.subarray(8, 8 + metaLen).toString('utf8'));
              event.sender.send('synthdat-preview-frame', {
                mime: meta.image_type || 'image/jpeg',
                bytes: new Uint8Array(data.subarray(8 + metaLen))
              });
            } catch (err) { /* malformed metadata frame — skip */ }
          }
        } else {
          try {
            const msg = JSON.parse(data.toString('utf8'));
            if (msg.type === 'progress' && msg.data) {
              event.sender.send('synthdat-progress', msg.data);
            } else if (msg.type === 'progress_state' && msg.data && msg.data.nodes) {
              // Newer per-node granular progress replacing the old single
              // "progress" message — pick whichever node is currently the
              // furthest along (there's normally only one running node in
              // this app's linear 1-Pass/2-Pass workflow).
              const running = Object.values(msg.data.nodes).filter((n: any) => n.state === 'running');
              if (running.length) {
                const n: any = running[running.length - 1];
                event.sender.send('synthdat-progress', { value: n.value, max: n.max });
              }
            }
          } catch (err) { /* ignore malformed frames */ }
        }
      });
      // Preview is best-effort — the polling loop below still fetches the
      // final image without it — but a swallowed handshake failure here is
      // exactly the kind of thing that looks like "preview never appears"
      // with zero symptoms, so log every failure mode to stderr instead of
      // eating it silently (visible via `--enable-logging=stderr`, see
      // CLAUDE.md's Known Pitfalls).
      socket.on('error', (err) => console.error('[synthdat] preview websocket error:', err && err.message));
      socket.on('unexpected-response', (req, res) => console.error('[synthdat] preview websocket handshake rejected:', res.statusCode));
      socket.on('close', (code, reason) => { if (code !== 1000) console.error('[synthdat] preview websocket closed:', code, reason && reason.toString()); });
      // Wait (briefly) for the handshake so the feature_flags message above
      // is sent (and so we don't miss the earliest preview frames of a short
      // generation) before queuing — best-effort, so a slow/failed connection
      // just proceeds without live preview rather than blocking generation.
      await new Promise<void>((resolve) => {
        const done = () => { socket.removeListener('open', done); socket.removeListener('error', done); socket.removeListener('unexpected-response', done); resolve(); };
        socket.once('open', done);
        socket.once('error', done);
        socket.once('unexpected-response', done);
        setTimeout(done, 3000);
      });
    } catch (err) { console.error('[synthdat] preview websocket setup failed:', (err as Error)?.message); }

    // ComfyUI's server-wide preview method defaults to "none" unless it was
    // launched with --preview-method — a per-request override in extra_data
    // is required to get preview frames at all regardless of anything on our
    // websocket side (confirmed by reading this ComfyUI install's own
    // execution.py: `set_preview_method(extra_data.get("preview_method"))`,
    // latent_preview.py: `default_preview_method = args.preview_method`,
    // cli_args.py: `default=LatentPreviewMethod.NoPreviews`). Without this,
    // our queued prompt silently generates zero preview frames even when the
    // server's own web UI — which does send this override — shows a live
    // preview for the exact same workflow.
    const queue = await queuePrompt(nodeComfyTransport, host, prompt, clientId, { extraData: { preview_method: 'taesd' }, noun: 'generation' });
    if (!queue.ok) return queue;
    const promptId = queue.promptId;

    // Generation is much slower than a WD14 tag pass — allow up to 5 minutes.
    const poll = await pollHistory<ComfyResult>(nodeComfyTransport, host, promptId, {
      deadlineMs: 300000,
      isCancelled: () => !!(activeSynthdatGen && activeSynthdatGen.cancelled),
      onCancelled: () => ({ ok: false, error: 'Generation stopped.', interrupted: true }),
      errorStatusMessage: 'ComfyUI reported an error while generating this image — check its console for details.',
      timeoutMessage: 'Timed out waiting for ComfyUI to finish generating this image.',
      extract: async (record) => {
        const saveOutput = record.outputs?.['192'];
        const image = saveOutput && Array.isArray(saveOutput.images) && saveOutput.images[0];
        if (!image) return null;
        const qs = new URLSearchParams({ filename: image.filename, subfolder: image.subfolder || '', type: image.type || 'output' });
        const viewRes = await comfyRequest(host, `/view?${qs.toString()}`, { timeoutMs: 20000 });
        if (viewRes.status !== 200) return null;
        const result: ComfyResult = { ok: true, imageBytes: new Uint8Array(viewRes.body) };
        // Only present when 2-Pass ran (buildSynthDatPrompt clones a 2nd
        // SaveImage, "192_pass1", pointed at pass 1's own decode) — lets the
        // renderer offer a choice between the two instead of only ever
        // keeping the refined pass-2 result.
        const pass1Output = record.outputs?.['192_pass1'];
        const pass1Image = pass1Output && Array.isArray(pass1Output.images) && pass1Output.images[0];
        if (pass1Image) {
          const qs1 = new URLSearchParams({ filename: pass1Image.filename, subfolder: pass1Image.subfolder || '', type: pass1Image.type || 'output' });
          const viewRes1 = await comfyRequest(host, `/view?${qs1.toString()}`, { timeoutMs: 20000 });
          if (viewRes1.status === 200) result.pass1ImageBytes = new Uint8Array(viewRes1.body);
        }
        return result;
      }
    });
    return poll.ok ? poll.value : poll;
  } catch (err) {
    return { ok: false, error: `Could not reach ComfyUI at ${host} — is it running? (${(err as Error).message})` };
  } finally {
    try { if (ws) ws.close(); } catch (err) { /* already closed */ }
    activeSynthdatGen = null;
  }
});

app.whenReady().then(() => {
  // Hide the default File/Edit/View/Window/Help menu bar for a cleaner, app-like feel.
  // Press Alt on Windows/Linux to reveal it temporarily if you ever need DevTools etc.
  Menu.setApplicationMenu(null);

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
