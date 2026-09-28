// GENERATED FILE — do not edit. Synced from ../../src/comfy-local.ts by
// scripts/sync-comfy-core.js. Edit the root file and re-run the sync.

// Local ComfyUI: SynthDat without a running ComfyUI server. The user points
// Osmium at their ComfyUI folder once (Settings live in
// userData/comfy-local.json); Osmium then launches
// local-comfy/osmium_comfy_runner.py with that install's own Python. The
// runner loads only the nodes the SynthDat workflow needs and opens its own
// console window, like ComfyUI's terminal. See the runner's header for the
// line-JSON protocol.
//
// main.ts routes the existing synthdat-* IPC here when the renderer passes
// LOCAL_COMFY_HOST as the host, so the renderer's generate flow is the same
// for both backends. This replaces running ComfyUI, not a second instance
// next to it.
//
// Comfy Bridge uses this same file: scripts/sync-comfy-core.js copies it (and
// the runner) into comfy-bridge/, and the Bridge's main.ts calls
// configureComfyLocal() for its own name and event channels.

import { app, dialog, BrowserWindow } from 'electron';
import type { IpcMain, OpenDialogOptions, WebContents } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import type { ComfyResult, ComfyLocalStatus, SynthDatPrompt } from './shared-types';

export const LOCAL_COMFY_HOST = 'local';

// What differs per app: the name on the runner's console window, and the
// channels the running generation's progress/preview events go out on.
const config = { appName: 'Osmium', progressChannel: 'synthdat-progress', previewChannel: 'synthdat-preview-frame' };
export function configureComfyLocal(c: Partial<typeof config>): void {
  Object.assign(config, c);
}

const CONFIG_FILE = () => path.join(app.getPath('userData'), 'comfy-local.json');
const PACK_NAME = 'ComfyUI-DataSetManagerNodes';

interface Install { root: string; comfyDir: string; python: string; }

function readFolder(): string {
  try {
    const folder = JSON.parse(fs.readFileSync(CONFIG_FILE(), 'utf8')).folder;
    return typeof folder === 'string' ? folder : '';
  } catch { return ''; }
}

// Accepts the portable root (…/ComfyUI_windows_portable) or the ComfyUI
// folder inside it. Python: the portable's python_standalone / python_embeded,
// or a .venv in either folder.
function resolveInstall(folder: string): { ok: true; install: Install } | { ok: false; error: string } {
  if (!folder) return { ok: false, error: 'No ComfyUI folder chosen yet.' };
  const hasMain = (d: string) => fs.existsSync(path.join(d, 'main.py')) && fs.existsSync(path.join(d, 'execution.py'));
  let comfyDir = '';
  if (hasMain(path.join(folder, 'ComfyUI'))) comfyDir = path.join(folder, 'ComfyUI');
  else if (hasMain(folder)) comfyDir = folder;
  if (!comfyDir) return { ok: false, error: `No ComfyUI found in ${folder} (expected ComfyUI\\main.py).` };
  const root = comfyDir === folder ? path.dirname(folder) : folder;
  const candidates = [
    path.join(root, 'python_standalone', 'python.exe'),
    path.join(root, 'python_embeded', 'python.exe'),
    path.join(comfyDir, '.venv', 'Scripts', 'python.exe'),
    path.join(root, '.venv', 'Scripts', 'python.exe'),
    path.join(comfyDir, 'venv', 'Scripts', 'python.exe')
  ];
  const python = candidates.find((p) => fs.existsSync(p));
  if (!python) return { ok: false, error: `Found ComfyUI but not its Python (looked for python_standalone, python_embeded and .venv next to ${comfyDir}).` };
  if (!fs.existsSync(path.join(comfyDir, 'custom_nodes', PACK_NAME))) {
    return { ok: false, error: `${PACK_NAME} isn't installed in ${path.join(comfyDir, 'custom_nodes')} — install it there first (same as for server mode).` };
  }
  return { ok: true, install: { root, comfyDir, python } };
}

// ---- the runner process ----------------------------------------------------

type Reply = { ok: boolean; error?: string; trace?: string; [k: string]: unknown };
let child: ChildProcess | null = null;
let ready: Promise<Reply> | null = null;
let nextId = 0;
const pending = new Map<number, (r: Reply) => void>();
// Where the running generation's progress/preview events go.
let eventSink: WebContents | null = null;

function runnerScript(): string {
  // The runner has to exist on disk for Python: asarUnpack'd in a package.
  return path.join(__dirname, 'local-comfy', 'osmium_comfy_runner.py').replace(/app\.asar([\\/])/, 'app.asar.unpacked$1');
}

function failAll(error: string): void {
  for (const resolve of pending.values()) resolve({ ok: false, error });
  pending.clear();
}

function start(): Promise<Reply> {
  if (ready) return ready;
  const resolved = resolveInstall(readFolder());
  if ('error' in resolved) return Promise.resolve({ ok: false, error: resolved.error });
  const { root, comfyDir, python } = resolved.install;
  // The same environment run_nvidia_gpu.bat sets up, where the folders exist.
  const env: NodeJS.ProcessEnv = { ...process.env, PYTHONIOENCODING: 'utf-8' };
  const hf = path.join(root, 'HuggingFaceHub'), torchHome = path.join(root, 'TorchHome'), pyc = path.join(root, 'pycache');
  if (fs.existsSync(hf)) env.HF_HUB_CACHE = hf;
  if (fs.existsSync(torchHome)) env.TORCH_HOME = torchHome;
  if (fs.existsSync(pyc)) env.PYTHONPYCACHEPREFIX = pyc;
  const proc = spawn(python, ['-s', runnerScript(), '--comfy', comfyDir, '--app', config.appName], {
    cwd: root, env, stdio: ['pipe', 'pipe', 'ignore'], windowsHide: false
  });
  child = proc;
  ready = new Promise<Reply>((resolve) => {
    let settled = false;
    const settle = (r: Reply) => { if (!settled) { settled = true; resolve(r); } };
    readline.createInterface({ input: proc.stdout! }).on('line', (line) => {
      let msg: Reply & { id?: number; event?: string };
      try { msg = JSON.parse(line); } catch { return; }
      if (msg.event === 'ready') { settle({ ok: true, comfyVersion: msg.comfy_version }); return; }
      if (msg.event === 'progress') { eventSink?.send(config.progressChannel, { value: msg.value, max: msg.max }); return; }
      if (msg.event === 'preview') {
        eventSink?.send(config.previewChannel, { mime: msg.mime, bytes: new Uint8Array(Buffer.from(String(msg.b64), 'base64')) });
        return;
      }
      if (typeof msg.id === 'number') {
        const resolveReq = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.trace) console.error('[comfy-local]', msg.trace);
        resolveReq?.(msg);
      }
    });
    proc.on('error', (err) => settle({ ok: false, error: `Could not start ComfyUI's Python: ${err.message}` }));
    proc.on('exit', (code) => {
      const error = `Local ComfyUI stopped (exit code ${code}). Its console window shows why; Connect starts it again.`;
      settle({ ok: false, error });
      failAll(error);
      if (child === proc) { child = null; ready = null; }
    });
  });
  return ready;
}

function stopRunner(): void {
  const proc = child;
  child = null;
  ready = null;
  if (!proc) return;
  try { proc.stdin?.end(); } catch { /* already closed */ }
  // Closing stdin makes the runner exit on its own; kill that PID if it hangs.
  setTimeout(() => { if (proc.exitCode === null) proc.kill(); }, 5000);
}

// Only Connect (comfy-local-connect) starts the runner: requests while it's
// stopped fail instead of launching it (SynthDat refreshes its model lists on
// app load, which used to start local ComfyUI unasked).
async function request(cmd: string, payload: Record<string, unknown> = {}): Promise<Reply> {
  if (!ready) return { ok: false, error: 'Local ComfyUI isn\'t running. Click Connect to start it.' };
  const started = await ready;
  if (!started.ok || !child) return started;
  const id = ++nextId;
  return new Promise<Reply>((resolve) => {
    pending.set(id, resolve);
    child!.stdin!.write(JSON.stringify({ id, cmd, ...payload }) + '\n');
  });
}

// ---- what main.ts's synthdat-* handlers call ------------------------------

export async function localObjectInfo(classType: string, inputName: string): Promise<ComfyResult> {
  const r = await request('object_info', { class_type: classType, input: inputName });
  return r.ok ? { ok: true, values: r.values as string[] } : { ok: false, error: r.error };
}

export async function localGenerate(sender: WebContents, prompt: SynthDatPrompt, imageBytes: Uint8Array | null): Promise<ComfyResult> {
  eventSink = sender;
  try {
    const r = await request('generate', {
      prompt,
      image_b64: imageBytes && prompt['239'] ? Buffer.from(imageBytes).toString('base64') : null
    });
    if (!r.ok) return { ok: false, error: r.error, interrupted: !!r.interrupted };
    // The SaveImage nodes: 192 (final), and Comfy Bridge's 192_pass1 and
    // 192_upscaled when the prompt has them. paths are each file's place
    // under ComfyUI's output folder, like a server's /history subfolder.
    const images = r.images as Record<string, string>;
    const paths = (r.paths || {}) as Record<string, string>;
    const bytesOf = (id: string) => images[id] ? new Uint8Array(Buffer.from(images[id], 'base64')) : undefined;
    const result: ComfyResult = { ok: true, imageBytes: bytesOf('192'), saveRel: paths['192'] || null };
    if (images['192_pass1']) { result.pass1ImageBytes = bytesOf('192_pass1'); result.pass1SaveRel = paths['192_pass1'] || null; }
    if (images['192_upscaled']) { result.upscaledImageBytes = bytesOf('192_upscaled'); result.upscaledSaveRel = paths['192_upscaled'] || null; }
    return result;
  } finally {
    eventSink = null;
  }
}

export function localStop(): void {
  // Sent straight to the runner (not via request()): it must not wait behind
  // the running generation, and it must not start a runner that isn't there.
  if (child) child.stdin!.write(JSON.stringify({ id: ++nextId, cmd: 'stop' }) + '\n');
}

function status(): ComfyLocalStatus {
  const folder = readFolder();
  const resolved = resolveInstall(folder);
  return {
    folder,
    ok: resolved.ok,
    error: 'error' in resolved ? resolved.error : undefined,
    python: 'install' in resolved ? resolved.install.python : undefined,
    running: !!child
  };
}

export function registerComfyLocalHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('comfy-local-status', () => status());
  ipcMain.handle('comfy-local-pick-folder', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const opts: OpenDialogOptions = { title: 'Choose your ComfyUI folder', properties: ['openDirectory'] };
    const picked = win ? await dialog.showOpenDialog(win, opts) : await dialog.showOpenDialog(opts);
    if (picked.canceled || !picked.filePaths[0]) return status();
    stopRunner(); // a different install: the next request starts the new one
    fs.writeFileSync(CONFIG_FILE(), JSON.stringify({ folder: picked.filePaths[0] }));
    return status();
  });
  ipcMain.handle('comfy-local-connect', async () => {
    const r = await start();
    return r.ok ? { ok: true, comfyVersion: r.comfyVersion } : { ok: false, error: r.error };
  });
  ipcMain.handle('comfy-local-shutdown', () => { stopRunner(); return status(); });
  app.on('will-quit', stopRunner);
}
