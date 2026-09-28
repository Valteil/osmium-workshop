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
import type { IpcMain, OpenDialogOptions } from 'electron';
import { spawn } from 'child_process';
import * as net from 'net';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import type { ComfyResult, ComfyLocalStatus, SynthDatPrompt } from './shared-types';

export const LOCAL_COMFY_HOST = 'local';

// What differs per app: the name on the runner's console window, the
// channels the running generation's progress/preview events go out on, and
// whether "Persist Comfy" is offered (Comfy Bridge only).
const config = {
  appName: 'Osmium', progressChannel: 'synthdat-progress', previewChannel: 'synthdat-preview-frame',
  allowPersist: false
};
export function configureComfyLocal(c: Partial<typeof config>): void {
  Object.assign(config, c);
}

const CONFIG_FILE = () => path.join(app.getPath('userData'), 'comfy-local.json');
const PACK_NAME = 'ComfyUI-DataSetManagerNodes';
// Persist Comfy: the runner listens here (127.0.0.1 only) instead of on a
// pipe, so it outlives the app and the app reconnects on the next Connect.
const PERSIST_PORT = 8190;

interface Install { root: string; comfyDir: string; python: string; }

function readConfig(): { folder: string; persist: boolean } {
  try {
    const c = JSON.parse(fs.readFileSync(CONFIG_FILE(), 'utf8'));
    return { folder: typeof c.folder === 'string' ? c.folder : '', persist: !!c.persist };
  } catch { return { folder: '', persist: false }; }
}
function writeConfig(patch: Partial<{ folder: string; persist: boolean }>): void {
  fs.writeFileSync(CONFIG_FILE(), JSON.stringify({ ...readConfig(), ...patch }));
}
const readFolder = (): string => readConfig().folder;
const persistOn = (): boolean => config.allowPersist && readConfig().persist;

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
// The line-JSON channel to the runner: its stdin/stdout pipe, or (Persist
// Comfy) a socket to a runner that may have been started by an earlier run
// of the app. close() on a pipe ends the runner; on a socket it only
// disconnects.
interface RunnerConn { write(line: string): void; close(): void; }
let conn: RunnerConn | null = null;
let ready: Promise<Reply> | null = null;
// Ids start from the clock, so a reconnected persistent runner's late reply
// to an earlier app session can't match one of this session's requests.
let nextId = Date.now();
const pending = new Map<number, (r: Reply) => void>();
// Where the running generation's progress/preview events go: the renderer's
// WebContents, or anything else with the same send() (Comfy Bridge's network
// relay forwards them to a phone's websocket).
export interface ComfyLocalEventSink { send(channel: string, payload: unknown): void; }
let eventSink: ComfyLocalEventSink | null = null;

// The runner's console output, in ComfyUI's /internal/logs entry shape. It
// pushes new lines as they're written; localLogs() reads the buffer (the
// last 300 entries). Comfy Bridge shows them in its ComfyUI Terminal and
// relays them to the phone.
export type LogEntry = { t: string; m: string };
const logListeners = new Set<(entries: LogEntry[]) => void>();
export function onLocalLogs(cb: (entries: LogEntry[]) => void): () => void {
  logListeners.add(cb);
  return () => { logListeners.delete(cb); };
}

function runnerScript(): string {
  // The runner has to exist on disk for Python: asarUnpack'd in a package.
  return path.join(__dirname, 'local-comfy', 'osmium_comfy_runner.py').replace(/app\.asar([\\/])/, 'app.asar.unpacked$1');
}

function failAll(error: string): void {
  for (const resolve of pending.values()) resolve({ ok: false, error });
  pending.clear();
}

// One protocol line from the runner, whichever channel it came on.
function handleLine(line: string, onReady: (msg: Reply) => void): void {
  let msg: Reply & { id?: number; event?: string };
  try { msg = JSON.parse(line); } catch { return; }
  if (msg.event === 'ready') { onReady(msg); return; }
  if (msg.event === 'progress') { eventSink?.send(config.progressChannel, { value: msg.value, max: msg.max }); return; }
  if (msg.event === 'logs') { for (const cb of logListeners) cb(msg.entries as LogEntry[]); return; }
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
}

function runnerEnv(root: string): NodeJS.ProcessEnv {
  // The same environment run_nvidia_gpu.bat sets up, where the folders exist.
  const env: NodeJS.ProcessEnv = { ...process.env, PYTHONIOENCODING: 'utf-8' };
  const hf = path.join(root, 'HuggingFaceHub'), torchHome = path.join(root, 'TorchHome'), pyc = path.join(root, 'pycache');
  if (fs.existsSync(hf)) env.HF_HUB_CACHE = hf;
  if (fs.existsSync(torchHome)) env.TORCH_HOME = torchHome;
  if (fs.existsSync(pyc)) env.PYTHONPYCACHEPREFIX = pyc;
  return env;
}

function start(): Promise<Reply> {
  if (ready) return ready;
  const resolved = resolveInstall(readFolder());
  if ('error' in resolved) return Promise.resolve({ ok: false, error: resolved.error });
  ready = persistOn() ? startPersistent(resolved.install) : startPipe(resolved.install);
  return ready;
}

function startPipe({ root, comfyDir, python }: Install): Promise<Reply> {
  const proc = spawn(python, ['-s', runnerScript(), '--comfy', comfyDir, '--app', config.appName], {
    cwd: root, env: runnerEnv(root), stdio: ['pipe', 'pipe', 'ignore'], windowsHide: false
  });
  const c: RunnerConn = {
    write: (line) => { proc.stdin!.write(line); },
    close: () => {
      try { proc.stdin?.end(); } catch { /* already closed */ }
      // Closing stdin makes the runner exit on its own; kill that PID if it hangs.
      setTimeout(() => { if (proc.exitCode === null) proc.kill(); }, 5000);
    }
  };
  conn = c;
  return new Promise<Reply>((resolve) => {
    let settled = false;
    const settle = (r: Reply) => { if (!settled) { settled = true; resolve(r); } };
    readline.createInterface({ input: proc.stdout! }).on('line', (line) =>
      handleLine(line, (msg) => settle({ ok: true, comfyVersion: msg.comfy_version })));
    proc.on('error', (err) => settle({ ok: false, error: `Could not start ComfyUI's Python: ${err.message}` }));
    proc.on('exit', (code) => {
      const error = `Local ComfyUI stopped (exit code ${code}). Its console window shows why; Connect starts it again.`;
      settle({ ok: false, error });
      failAll(error);
      if (conn === c) { conn = null; ready = null; }
    });
  });
}

function tryConnect(timeoutMs: number): Promise<net.Socket | null> {
  return new Promise((resolve) => {
    const sock = net.connect({ host: '127.0.0.1', port: PERSIST_PORT });
    const done = (s: net.Socket | null) => { clearTimeout(timer); sock.removeAllListeners('error'); resolve(s); };
    const timer = setTimeout(() => { sock.destroy(); done(null); }, timeoutMs);
    sock.once('connect', () => done(sock));
    sock.once('error', () => { sock.destroy(); done(null); });
  });
}

// Persist Comfy: reconnect to the runner that's already listening, or start
// one detached (it opens its own console window, which is the only way to end
// it) and connect once it's up.
async function startPersistent({ root, comfyDir, python }: Install): Promise<Reply> {
  let sock = await tryConnect(1500);
  if (!sock) {
    try {
      const proc = spawn(python, ['-s', runnerScript(), '--comfy', comfyDir, '--app', config.appName, '--listen-port', String(PERSIST_PORT)], {
        cwd: root, env: runnerEnv(root), stdio: 'ignore', detached: true, windowsHide: false
      });
      proc.on('error', () => { /* reported as "didn't come up" below */ });
      proc.unref();
    } catch (err) {
      ready = null;
      return { ok: false, error: `Could not start ComfyUI's Python: ${(err as Error).message}` };
    }
    // The runner claims the port within a few seconds of starting; the
    // "ready" message comes once its models are set up.
    for (let i = 0; i < 60 && !sock; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      sock = await tryConnect(1000);
    }
  }
  if (!sock) { ready = null; return { ok: false, error: `Local ComfyUI didn't come up on port ${PERSIST_PORT}. Its console window shows why.` }; }
  const s = sock;
  s.setNoDelay(true);
  const c: RunnerConn = { write: (line) => { s.write(line); }, close: () => { s.end(); } };
  conn = c;
  return new Promise<Reply>((resolve) => {
    let settled = false;
    const settle = (r: Reply) => { if (!settled) { settled = true; resolve(r); } };
    readline.createInterface({ input: s }).on('line', (line) => handleLine(line, (msg) => {
      const runningDir = String(msg.comfy_dir || '');
      if (runningDir && path.resolve(runningDir).toLowerCase() !== path.resolve(comfyDir).toLowerCase()) {
        settle({ ok: false, error: `The Local ComfyUI still open from before runs ${runningDir}, not ${comfyDir}. Close its console window, then Connect again.` });
        s.end();
        return;
      }
      settle({ ok: true, comfyVersion: msg.comfy_version });
    }));
    s.on('error', () => { /* 'close' follows */ });
    s.on('close', () => {
      const error = 'Lost the connection to Local ComfyUI (its window was closed?). Connect starts or reconnects it.';
      settle({ ok: false, error });
      failAll(error);
      if (conn === c) { conn = null; ready = null; }
    });
  });
}

// Pipe: ends the runner. Persist Comfy: only disconnects; the runner stays
// open with its models loaded until its window is closed.
function stopRunner(): void {
  const c = conn;
  conn = null;
  ready = null;
  c?.close();
}

// Only Connect (comfy-local-connect) starts the runner: requests while it's
// stopped fail instead of launching it (SynthDat refreshes its model lists on
// app load, which used to start local ComfyUI unasked).
async function request(cmd: string, payload: Record<string, unknown> = {}): Promise<Reply> {
  if (!ready) return { ok: false, error: 'Local ComfyUI isn\'t running. Click Connect to start it.' };
  const started = await ready;
  if (!started.ok || !conn) return started;
  const id = ++nextId;
  const c = conn;
  return new Promise<Reply>((resolve) => {
    pending.set(id, resolve);
    c.write(JSON.stringify({ id, cmd, ...payload }) + '\n');
  });
}

// Starts the runner if it isn't running (Connect's path). Comfy Bridge's
// relay uses it too: a phone's request is an explicit ask, like Connect.
export async function ensureLocalStarted(): Promise<{ ok: boolean; error?: string; comfyVersion?: string }> {
  const r = await start();
  return r.ok ? { ok: true, comfyVersion: r.comfyVersion as string } : { ok: false, error: r.error };
}

// ---- what main.ts's synthdat-* handlers call ------------------------------

export async function localLogs(): Promise<{ ok: boolean; entries?: LogEntry[]; error?: string }> {
  const r = await request('logs');
  return r.ok ? { ok: true, entries: (r.entries || []) as LogEntry[] } : { ok: false, error: r.error };
}

// A node's inputs in /object_info's shape ({ required, optional }), for the
// relay's /object_info/<class>.
export async function localNodeInputs(classType: string): Promise<{ ok: boolean; input?: unknown; error?: string }> {
  const r = await request('node_info', { class_type: classType });
  return r.ok ? { ok: true, input: r.input } : { ok: false, error: r.error };
}

export async function localObjectInfo(classType: string, inputName: string): Promise<ComfyResult> {
  const r = await request('object_info', { class_type: classType, input: inputName });
  return r.ok ? { ok: true, values: r.values as string[] } : { ok: false, error: r.error };
}

// One generation at a time: the runner already works through its jobs in
// order, but events must go to the sink of the job actually running, and
// Comfy Bridge's relay can submit next to the app's own Generate.
let generateChain: Promise<unknown> = Promise.resolve();
export function localGenerate(sender: ComfyLocalEventSink, prompt: SynthDatPrompt, imageBytes: Uint8Array | null): Promise<ComfyResult> {
  const run = generateChain.then(() => runGenerate(sender, prompt, imageBytes));
  generateChain = run.catch(() => undefined);
  return run;
}

async function runGenerate(sender: ComfyLocalEventSink, prompt: SynthDatPrompt, imageBytes: Uint8Array | null): Promise<ComfyResult> {
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
  conn?.write(JSON.stringify({ id: ++nextId, cmd: 'stop' }) + '\n');
}

function status(): ComfyLocalStatus {
  const folder = readFolder();
  const resolved = resolveInstall(folder);
  return {
    folder,
    ok: resolved.ok,
    error: 'error' in resolved ? resolved.error : undefined,
    python: 'install' in resolved ? resolved.install.python : undefined,
    running: !!conn,
    persist: persistOn()
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
    writeConfig({ folder: picked.filePaths[0] });
    return status();
  });
  ipcMain.handle('comfy-local-connect', async () => {
    const r = await start();
    return r.ok ? { ok: true, comfyVersion: r.comfyVersion } : { ok: false, error: r.error };
  });
  ipcMain.handle('comfy-local-shutdown', () => { stopRunner(); return status(); });
  // Persist Comfy (Comfy Bridge): takes effect the next time Local ComfyUI
  // starts. A runner that's already open stays as it is.
  ipcMain.handle('comfy-local-set-persist', (_event, on: boolean) => {
    if (config.allowPersist) writeConfig({ persist: !!on });
    return status();
  });
  app.on('will-quit', stopRunner);
}
