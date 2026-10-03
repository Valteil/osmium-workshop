// Trainflow: LoRA training for Anima, run from Osmium. The user points Osmium
// at their Anima-TrainFlow folder once (userData/trainflow.json); the tab then
// writes the same dataset/training TOML files Anima-TrainFlow's own app.py
// does and launches `accelerate launch anima_train_network.py` with that
// install's embedded Python.
//
// The job is DETACHED: stdout/stderr go to a log file in the project's output
// folder and the process is unref()'d, so it keeps training after Osmium
// closes. The run is remembered in userData/trainflow-run.json (pid, folders,
// total steps); the next Osmium session reads that plus the log tail to
// reconnect to live progress. Nothing here spawns Python until the renderer
// calls trainflow-start (the "Start Trainflow" button).

import { app, dialog, shell, BrowserWindow } from 'electron';
import type { IpcMain, OpenDialogOptions } from 'electron';
import { spawn, execFile, execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { bucketImage, modelStatus, downloadModel } from './bucket-local';
import { getValidBuckets, getBestBucket, isBucketSize } from './bucket-core';
import type {
  TrainflowSettings, TrainflowStatus, TrainflowRun, TrainflowDatasetCheck, TrainflowStartResult, TrainflowBucketReport
} from './shared-types';

const CONFIG_FILE = () => path.join(app.getPath('userData'), 'trainflow.json');
const RUN_FILE = () => path.join(app.getPath('userData'), 'trainflow-run.json');

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.bmp']);
const LOG_BLACKLIST = ['triton not found', 'flop counting will not work', 'Lib\\site-packages\\torch\\utils\\flop_counter.py'];
const LOG_TAIL_BYTES = 96 * 1024;
const LOG_TAIL_LINES = 60;

interface Install { root: string; python: string; scriptsDir: string; trainScript: string; outputBase: string; }

function readFolder(): string {
  try { const c = JSON.parse(fs.readFileSync(CONFIG_FILE(), 'utf8')); return typeof c.folder === 'string' ? c.folder : ''; }
  catch { return ''; }
}

function resolveInstall(folder: string): { ok: true; install: Install } | { ok: false; error: string } {
  if (!folder) return { ok: false, error: 'No Trainflow folder chosen yet.' };
  const scriptsDir = path.join(folder, 'training', 'sd-scripts');
  const trainScript = path.join(scriptsDir, 'anima_train_network.py');
  if (!fs.existsSync(trainScript)) {
    return { ok: false, error: `No Anima-TrainFlow found in ${folder} (expected training\\sd-scripts\\anima_train_network.py).` };
  }
  const python = [
    path.join(folder, 'python_embeded', 'python.exe'),
    path.join(folder, '.venv', 'Scripts', 'python.exe'),
    path.join(folder, 'venv', 'Scripts', 'python.exe')
  ].find((p) => fs.existsSync(p));
  if (!python) return { ok: false, error: `Found Anima-TrainFlow but not its Python (looked for python_embeded and .venv in ${folder}).` };
  return { ok: true, install: { root: folder, python, scriptsDir, trainScript, outputBase: path.join(folder, 'training', 'output') } };
}

// ---- renderer-input validation ----------------------------------------------
// Paths/names coming from the renderer are untrusted. These mirror the sender
// guard's spirit at the value level: reject NUL, UNC (\\host\share) and
// drive-relative (C:foo) forms, require an absolute path that normalises to
// itself, and reduce a filename to a plain basename. NOTE: these are NOT
// applied to the path dialog.showOpenDialog returns (a user pick is trusted,
// including network/removable drives).
const MARKER_RE = /^\.osmium-probe-[0-9a-f-]{36}$/;

function safeAbsPath(p: unknown): string | null {
  if (typeof p !== 'string' || !p || p.includes('\0')) return null;
  if (/^[\\/]{2}/.test(p)) return null;        // UNC \\host\share or //host/share
  if (/^[a-zA-Z]:[^\\/]/.test(p)) return null; // drive-relative C:foo
  if (!path.isAbsolute(p)) return null;
  const resolved = path.resolve(p);
  const norm = (s: string) => (process.platform === 'win32' ? s.replace(/^[a-z]:/, (m) => m.toUpperCase()) : s);
  if (norm(resolved) !== norm(p)) return null; // contained .. or redundant segments
  return resolved;
}

function plainFileName(name: unknown): string | null {
  if (typeof name !== 'string' || !name) return null;
  if (name.includes('\0') || /[\\/]/.test(name)) return null;
  if (path.basename(name) !== name || name === '.' || name === '..') return null;
  return name;
}

function plainFolderName(name: unknown): string | null {
  const n = plainFileName(name);
  return n ? n.trim() || null : null;
}

// ---- dataset checks ----------------------------------------------------------

// Width/height from the file header, without decoding: PNG, JPEG, WebP, BMP.
function sizeFromBuffer(b: Buffer): { w: number; h: number } | null | 'more' {
  if (b.length > 24 && b[0] === 0x89 && b[1] === 0x50) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b.length > 30 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const kind = b.toString('ascii', 12, 16);
    if (kind === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    if (kind === 'VP8L') { const v = b.readUInt32LE(21); return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 }; }
    if (kind === 'VP8X') return { w: b.readUIntLE(24, 3) + 1, h: b.readUIntLE(27, 3) + 1 };
    return null;
  }
  if (b.length > 26 && b[0] === 0x42 && b[1] === 0x4d) return { w: Math.abs(b.readInt32LE(18)), h: Math.abs(b.readInt32LE(22)) };
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1];
      if (marker === 0xff) { i++; continue; }
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
      }
      i += 2 + b.readUInt16BE(i + 2);
    }
    return 'more';
  }
  return null;
}

function imageSize(file: string): { w: number; h: number } | null {
  try {
    const fd = fs.openSync(file, 'r');
    try {
      for (const len of [64 * 1024, 2 * 1024 * 1024]) {
        const buf = Buffer.alloc(len);
        const n = fs.readSync(fd, buf, 0, len, 0);
        const r = sizeFromBuffer(buf.subarray(0, n));
        if (r !== 'more') return r;
        if (n < len) return null;
      }
    } finally { fs.closeSync(fd); }
  } catch { /* unreadable */ }
  return null;
}

function listImages(dir: string): string[] {
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && IMAGE_EXTS.has(path.extname(e.name).toLowerCase()))
      .map((e) => path.join(dir, e.name));
  } catch { return []; }
}

// Shared with the Bucket Images dock (and Anima-TrainFlow's own app): the un-bucketed originals live in
// original_images/, the bucketed copies are <stem>.png in the dataset root. Older Osmium versions used
// initial_state/; it is merged into original_images/ the first time it's seen.
const ORIGINAL_DIR = 'original_images';
const LEGACY_ORIGINAL_DIR = 'initial_state';

function mergeLegacyOriginals(dir: string): void {
  const legacy = path.join(dir, LEGACY_ORIGINAL_DIR);
  if (!fs.existsSync(legacy)) return;
  const target = path.join(dir, ORIGINAL_DIR);
  fs.mkdirSync(target, { recursive: true });
  for (const name of fs.readdirSync(legacy)) {
    const to = path.join(target, name);
    if (!fs.existsSync(to)) fs.copyFileSync(path.join(legacy, name), to);
  }
  fs.rmSync(legacy, { recursive: true, force: true });
}

interface BucketItem { stem: string; src: string; inOriginals: boolean; root?: string; }
const stemOf = (f: string) => path.basename(f, path.extname(f));

// What bucketing has to do. Every image gets an original in original_images/ (even one that's already a valid
// size, so it can be re-bucketed at other dimensions later). An original's bucketed copy is re-made from it,
// unless that copy is already the size the current Min/Max/Step would produce, so pressing Start twice does
// nothing and new dimensions rebuild from the originals.
function planBucketing(dir: string, b: { min: number; max: number; step: number }): BucketItem[] {
  const buckets = getValidBuckets(b.min, b.max, b.step);
  const rootByStem = new Map(listImages(dir).map((f) => [stemOf(f), f] as const));
  const items = new Map<string, BucketItem>();
  for (const f of listImages(path.join(dir, ORIGINAL_DIR))) items.set(stemOf(f), { stem: stemOf(f), src: f, inOriginals: true, root: rootByStem.get(stemOf(f)) });
  for (const [stem, f] of rootByStem) if (!items.has(stem)) items.set(stem, { stem, src: f, inOriginals: false, root: f });
  const isWebp = (f: string) => path.extname(f).toLowerCase() === '.webp';
  const todo: BucketItem[] = [];
  for (const it of items.values()) {
    // A WebP bucketed copy is never "done": WD14 and the trainer reject WebP, so
    // it is re-made as a PNG even when its dimensions already match the bucket.
    if (it.inOriginals) {
      const o = imageSize(it.src), cur = it.root ? imageSize(it.root) : null;
      if (o && cur && !isWebp(it.root!)) { const [tw, th] = getBestBucket(o.w, o.h, buckets); if (cur.w === tw && cur.h === th) continue; }
    } else if (isWebp(it.src)) {
      const sz = imageSize(it.src);
      // Already a valid bucket size and WebP: still convert (no crop needed).
      if (sz && isBucketSize(sz.w, sz.h, buckets)) {
        const rootPng = path.join(dir, it.stem + '.png');
        if (fs.existsSync(rootPng)) { const c = imageSize(rootPng); if (c && c.w === sz.w && c.h === sz.h) continue; }
      }
    }
    todo.push(it);
  }
  return todo;
}

function verifyBuckets(dir: string, b: { min: number; max: number; step: number }): TrainflowBucketReport {
  mergeLegacyOriginals(dir);
  const buckets = getValidBuckets(b.min, b.max, b.step);
  const counts = new Map(buckets.map(([w, h]) => [w + 'x' + h, 0]));
  const offBucket: string[] = [];
  const images = listImages(dir);
  for (const f of images) {
    const s = imageSize(f);
    const key = s ? s.w + 'x' + s.h : '';
    if (counts.has(key)) counts.set(key, (counts.get(key) || 0) + 1);
    else offBucket.push(path.basename(f));
  }
  const originals = new Set(listImages(path.join(dir, ORIGINAL_DIR)).map(stemOf));
  return {
    buckets: buckets.map(([w, h]) => ({ w, h, count: counts.get(w + 'x' + h) || 0 })),
    images: images.length,
    offBucket,
    withoutOriginal: images.filter((f) => !originals.has(stemOf(f))).length,
    toRebucket: planBucketing(dir, b).length
  };
}

function checkDataset(dir: string, bucket: { min: number; max: number; step: number }, afterBucketing = false): TrainflowDatasetCheck {
  if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    return { ok: false, images: 0, unbucketed: 0, missingCaptions: 0, oversized: 0, baseRes: 512, maxBucket: 768, errors: [`Dataset folder not found: ${dir || '(not set)'}`] };
  }
  const images = listImages(dir);
  const errors: string[] = [];
  mergeLegacyOriginals(dir);
  const unbucketed = planBucketing(dir, bucket).length;
  let missing = 0, oversized = 0, maxArea = 0, maxSide = 0;
  for (const img of images) {
    if (!fs.existsSync(img.slice(0, img.length - path.extname(img).length) + '.txt')) missing++;
    const s = imageSize(img);
    if (!s) continue;
    maxArea = Math.max(maxArea, s.w * s.h);
    maxSide = Math.max(maxSide, s.w, s.h);
    if (s.w >= 2048 || s.h >= 2048) oversized++;
  }
  if (!images.length) errors.push('No images found in the dataset folder.');
  if (missing) errors.push(`${missing} image${missing === 1 ? ' has' : 's have'} no .txt caption. Tag them first (Tag Overseer's WD14).`);
  // Before Start bucketing runs this is fixed for us; after it, only a huge max side can leave any.
  if (oversized && afterBucketing) errors.push(`${oversized} image${oversized === 1 ? ' is' : 's are'} 2048px or larger. Lower the Bucket Images dock's max side.`);
  const baseRes = maxArea ? Math.ceil(Math.sqrt(maxArea) / 64) * 64 : 512;
  const maxBucket = maxSide ? Math.ceil(maxSide / 64) * 64 : 768;
  return { ok: !errors.length, images: images.length, unbucketed, missingCaptions: missing, oversized, baseRes, maxBucket, errors };
}

// ---- config files --------------------------------------------------------------

// Strip C0/C1 control characters (including \n, \r, \t, NUL). Every value
// written to a config file goes through this first, so a path or prompt
// carrying an embedded newline can't inject extra lines.
const stripControl = (s: string) => s.replace(/[\u0000-\u001f\u007f-\u009f]/g, ' ');
const tomlStr = (s: string) => JSON.stringify(stripControl(s));
const posix = (p: string) => stripControl(path.resolve(p)).replace(/\\/g, '/');

function sanitizeProject(trigger: string): string {
  return trigger.trim().replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+|_+$/g, '') || 'untitled';
}

function writeSamplePrompts(s: TrainflowSettings, file: string): void {
  // The prompt line is written raw (sd-scripts' own sample-prompt format, not
  // TOML), so its values are stripped of control chars explicitly — a newline
  // here would split it into extra --flag lines.
  const trigger = stripControl(s.trigger.trim());
  const user = stripControl(s.prompt.trim());
  const pos = trigger && !user.startsWith(trigger) ? (user ? `${trigger}, ${user}` : trigger) : (user || trigger);
  const neg = stripControl(s.negPrompt.trim());
  fs.writeFileSync(file, `${pos} --n ${neg} --w ${Math.round(s.width)} --h ${Math.round(s.height)} --l ${Number(s.cfg)} --s ${Math.round(s.sampleGenSteps)} --d ${Math.round(s.sampleSeed)}`);
}

function writeDatasetToml(s: TrainflowSettings, file: string, check: TrainflowDatasetCheck): void {
  const effective = Math.round(s.batchSize) * Math.round(s.gradAcc);
  const repeats = Math.max(1, Math.ceil((Math.round(s.steps) * effective) / Math.max(1, check.images)));
  const trigger = s.trigger.trim();
  const lines = [
    '[general]',
    'enable_bucket = true',
    'min_bucket_reso = 256',
    `max_bucket_reso = ${check.maxBucket}`,
    'bucket_reso_steps = 64',
    'bucket_no_upscale = true',
    '',
    '[[datasets]]',
    `resolution = ${check.baseRes}`,
    '',
    '[[datasets.subsets]]',
    `image_dir = ${tomlStr(posix(s.datasetPath))}`,
    'caption_extension = ".txt"',
    `num_repeats = ${repeats}`,
    ...(trigger ? [`caption_prefix = ${tomlStr(trigger + ', ')}`] : []),
    'keep_tokens = 1',
    'caption_dropout_rate = 0.05',
    ''
  ];
  fs.writeFileSync(file, lines.join('\n'));
}

function writeTrainingToml(s: TrainflowSettings, file: string, project: string, outDir: string, promptFile: string): void {
  const prodigy = s.optimizer === 'Prodigy';
  const optArgs = prodigy
    ? ['decouple=True', 'weight_decay=0.01', 'd_coef=1.0', 'use_bias_correction=True', 'safeguard_warmup=True', 'betas=0.9,0.99']
    : ['weight_decay=0.01'];
  const rank = Math.round(s.rank);
  const lines = [
    `pretrained_model_name_or_path = ${tomlStr(posix(s.ditPath))}`,
    `qwen3 = ${tomlStr(posix(s.qwenPath))}`,
    `vae = ${tomlStr(posix(s.vaePath))}`,
    'network_module = "networks.lora_anima"',
    `network_dim = ${rank}`,
    `network_alpha = ${rank}`,
    'network_train_unet_only = true',
    'gradient_checkpointing = true',
    'max_grad_norm = 1.0',
    `learning_rate = ${Number(s.lr)}`,
    `optimizer_type = ${tomlStr(s.optimizer)}`,
    `optimizer_args = [${optArgs.map(tomlStr).join(', ')}]`,
    `lr_scheduler = ${tomlStr(prodigy ? 'constant' : 'cosine')}`,
    `max_train_steps = ${Math.round(s.steps)}`,
    `train_batch_size = ${Math.round(s.batchSize)}`,
    `gradient_accumulation_steps = ${Math.round(s.gradAcc)}`,
    'mixed_precision = "bf16"',
    `output_dir = ${tomlStr(posix(outDir))}`,
    `output_name = ${tomlStr(project)}`,
    `save_every_n_steps = ${Math.round(s.saveSteps)}`,
    `sample_every_n_steps = ${Math.round(s.sampleSteps)}`,
    `sample_prompts = ${tomlStr(posix(promptFile))}`,
    'sample_sampler = "euler"',
    'timestep_sampling = "sigmoid"',
    'discrete_flow_shift = 1.0',
    'sigmoid_scale = 1.3',
    'weighting_scheme = "logit_normal"',
    'cache_latents = true',
    'cache_latents_to_disk = true',
    'cache_text_encoder_outputs = true',
    'cache_text_encoder_outputs_to_disk = true',
    'attn_mode = "sdpa"',
    'save_model_as = "safetensors"',
    'save_precision = "bf16"',
    'max_data_loader_n_workers = 4',
    'vae_chunk_size = 32',
    'vae_disable_cache = true',
    `seed = ${Math.round(s.trainSeed)}`,
    ''
  ];
  fs.writeFileSync(file, lines.join('\n'));
}

// ---- test seam (red-team harness) --------------------------------------------
// Runs the REAL writer path (writeSamplePrompts + writeDatasetToml +
// writeTrainingToml) against the given settings and returns each file's text.
// Exists so the harness can feed newline/control characters through the actual
// writers and read the output, instead of grepping for stripControl. Not used
// by the app itself.
export function renderTomlsForTest(
  s: TrainflowSettings,
  check: TrainflowDatasetCheck,
  outDir: string,
  promptFile: string,
  project: string
): { samplePrompts: string; datasetToml: string; trainingToml: string } {
  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'osmium-toml-'));
  try {
    const samplesFile = path.join(dir, 'prompts.txt');
    const datasetFile = path.join(dir, 'dataset.toml');
    const trainingFile = path.join(dir, 'training.toml');
    writeSamplePrompts(s, samplesFile);
    writeDatasetToml(s, datasetFile, check);
    writeTrainingToml(s, trainingFile, project, outDir, promptFile);
    return {
      samplePrompts: fs.readFileSync(samplesFile, 'utf8'),
      datasetToml: fs.readFileSync(datasetFile, 'utf8'),
      trainingToml: fs.readFileSync(trainingFile, 'utf8'),
    };
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
  }
}

// ---- the run -------------------------------------------------------------------

interface RunRecord {
  pid: number; project: string; outDir: string; logFile: string; samplesDir: string;
  totalSteps: number; startedAt: number; stopRequested?: boolean;
  // Trainer executable we spawned, kept so a reused PID can be sanity-checked.
  exe?: string;
}

function readRun(): RunRecord | null {
  try {
    const r = JSON.parse(fs.readFileSync(RUN_FILE(), 'utf8'));
    return r && typeof r.pid === 'number' && typeof r.outDir === 'string' ? r as RunRecord : null;
  } catch { return null; }
}
const writeRun = (r: RunRecord) => fs.writeFileSync(RUN_FILE(), JSON.stringify(r));

function pidAlive(pid: number): boolean {
  try { process.kill(pid, 0); return true; }
  catch (e) { return (e as NodeJS.ErrnoException).code === 'EPERM'; }
}

// A run recorded before the last boot can't still be running; its PID may now belong to any other
// process (PIDs restart at boot), which made a fresh launch look like training in progress.
const startedBeforeBoot = (r: RunRecord) => r.startedAt < Date.now() - os.uptime() * 1000;

function runIsLive(): RunRecord | null {
  const r = readRun();
  return r && !startedBeforeBoot(r) && pidAlive(r.pid) ? r : null;
}

// trainflow-run.json is reads/writes we trust only if its output paths stay
// inside the chosen install's output dir. A tampered record must not be able to
// redirect reads (log/samples) or an open into an arbitrary location.
function runDirsValid(rec: RunRecord): boolean {
  const resolved = resolveInstall(readFolder());
  if (!('install' in resolved)) return false;
  const base = resolved.install.outputBase;
  const within = (p: string): boolean => {
    const rel = path.relative(path.resolve(base), path.resolve(p));
    return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
  };
  return within(rec.outDir) && within(rec.logFile) && within(rec.samplesDir);
}

const PROGRESS_RE = /(\d+)\s*%\|[^|]*\|\s*(\d+)\/(\d+)\s*\[([^\]]*)\]/;

function readTail(file: string): string {
  try {
    const fd = fs.openSync(file, 'r');
    try {
      const size = fs.fstatSync(fd).size;
      const len = Math.min(size, LOG_TAIL_BYTES);
      const buf = Buffer.alloc(len);
      fs.readSync(fd, buf, 0, len, size - len);
      const text = buf.toString('utf8');
      // The first line may be cut in half when we started mid-file.
      return size > len ? text.slice(text.search(/[\r\n]/) + 1) : text;
    } finally { fs.closeSync(fd); }
  } catch { return ''; }
}

function parseLog(text: string): { lines: string[]; step: number; total: number; speed: string; eta: string; elapsed: string; loss?: number } {
  const lines: string[] = [];
  let step = 0, total = 0, speed = '', eta = '', elapsed = '', loss: number | undefined;
  let lastWasProgress = false;
  for (const raw of text.split(/[\r\n]+/)) {
    const line = raw.trim();
    if (!line || LOG_BLACKLIST.some((w) => line.includes(w))) continue;
    const m = PROGRESS_RE.exec(line);
    if (m) {
      step = Number(m[2]); total = Number(m[3]);
      const parts = /^([\d:]+)<([\d:?]+),\s*([^,]+)(?:,\s*(.*))?$/.exec(m[4]);
      if (parts) {
        elapsed = parts[1]; eta = parts[2]; speed = parts[3].trim();
        const l = /avr_loss=([\d.eE+-]+)/.exec(parts[4] || '');
        if (l) loss = Number(l[1]);
      }
      if (lastWasProgress) lines[lines.length - 1] = line; else lines.push(line);
      lastWasProgress = true;
    } else {
      lines.push(line);
      lastWasProgress = false;
    }
  }
  return { lines: lines.slice(-LOG_TAIL_LINES), step, total, speed, eta, elapsed, loss };
}

function listFiles(dir: string, exts: string[]): { name: string; mtime: number; size: number }[] {
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && exts.includes(path.extname(e.name).toLowerCase()))
      .map((e) => { const st = fs.statSync(path.join(dir, e.name)); return { name: e.name, mtime: st.mtimeMs, size: st.size }; })
      .sort((a, b) => b.mtime - a.mtime);
  } catch { return []; }
}

function status(): TrainflowStatus {
  const folder = readFolder();
  const resolved = resolveInstall(folder);
  const out: TrainflowStatus = {
    folder, ok: resolved.ok, error: 'error' in resolved ? resolved.error : undefined,
    run: null, prep, logTail: [], samples: [], checkpoints: []
  };
  const rec = readRun();
  if (!rec) return out;
  const live = !startedBeforeBoot(rec) && pidAlive(rec.pid);
  const parsed = parseLog(readTail(rec.logFile));
  const finalFile = path.join(rec.outDir, rec.project + '.safetensors');
  let finished = false;
  try { finished = fs.statSync(finalFile).mtimeMs >= rec.startedAt; } catch { /* not written yet */ }
  const total = parsed.total || rec.totalSteps;
  const state: TrainflowRun['state'] = live ? 'running' : finished ? 'finished' : rec.stopRequested ? 'stopped' : 'failed';
  out.run = {
    state, project: rec.project, outDir: rec.outDir, startedAt: rec.startedAt,
    step: state === 'finished' ? total : parsed.step, total,
    speed: parsed.speed, eta: parsed.eta, elapsed: parsed.elapsed, loss: parsed.loss
  };
  out.logTail = parsed.lines;
  out.samples = listFiles(rec.samplesDir, ['.png', '.jpg', '.jpeg', '.webp']).slice(0, 60).map(({ name, mtime }) => ({ name, mtime }));
  out.checkpoints = listFiles(rec.outDir, ['.safetensors']).map(({ name, size }) => ({ name, size }));
  return out;
}

let prep: TrainflowStatus['prep'];

// Bucket the dataset the way the Bucket Images dock does, using its u2net
// model and its initial_state/ folder. Idempotent: an image already at a valid
// bucket size is left alone, so pressing Start again never re-processes or
// duplicates anything. Returns an error string, or '' when done.
async function bucketDataset(dir: string, b: { min: number; max: number; step: number }): Promise<string> {
  mergeLegacyOriginals(dir);
  const todo = planBucketing(dir, b);
  if (!todo.length) return '';
  try {
    if (!modelStatus().present) {
      prep = { message: 'Downloading the u2net model Bucket Images uses (176 MB, once)…', done: 0, total: todo.length };
      await downloadModel((ev) => { prep = { message: `Downloading the u2net model (${Math.round(ev.percent)}%)…`, done: 0, total: todo.length }; });
    }
    const origDir = path.join(dir, ORIGINAL_DIR);
    fs.mkdirSync(origDir, { recursive: true });
    let done = 0;
    const buckets = getValidBuckets(b.min, b.max, b.step);
    for (const { stem, src, inOriginals, root } of todo) {
      if (!inOriginals) {
        // First time for this image: keep the original (and a copy of its caption) in original_images/.
        fs.copyFileSync(src, path.join(origDir, path.basename(src)));
        const txt = path.join(dir, stem + '.txt');
        if (fs.existsSync(txt)) fs.copyFileSync(txt, path.join(origDir, stem + '.txt'));
        // Already a valid bucket size: it stays as its own bucketed copy — unless
        // it's WebP, which the trainer can't read, so it still goes through
        // bucketImage as a format conversion (a plain resize, same dimensions).
        const sz = imageSize(src);
        if (sz && isBucketSize(sz.w, sz.h, buckets) && path.extname(src).toLowerCase() !== '.webp') { done++; continue; }
      }
      const bytes = fs.readFileSync(src);
      prep = { message: `Bucketing images (${done}/${todo.length})…`, done, total: todo.length };
      const r = await bucketImage({ imageBytes: new Uint8Array(bytes), sideMin: b.min, sideMax: b.max, step: b.step, preferGpu: true });
      if (!r.ok || !r.pngBytes) return `Bucketing ${path.basename(src)} failed: ${r.error || 'unknown error'}`;
      const rootPng = path.join(dir, stem + '.png');
      fs.writeFileSync(rootPng, Buffer.from(r.pngBytes));
      // An earlier copy under another extension (a .jpg) would otherwise sit beside the new PNG.
      if (root && path.resolve(root) !== path.resolve(rootPng)) fs.rmSync(root, { force: true });
      done++;
    }
    return '';
  } catch (e) {
    return 'Bucketing failed: ' + (e as Error).message;
  }
}

function checkCuda(python: string, cwd: string): Promise<boolean> {
  return new Promise((resolve) => {
    execFile(python, ['-c', 'import torch; print(torch.cuda.is_available())'], { cwd, timeout: 90000, windowsHide: true }, (err, stdout) => {
      resolve(!err && /True/.test(stdout));
    });
  });
}

async function startTraining(s: TrainflowSettings): Promise<TrainflowStartResult> {
  if (runIsLive()) return { ok: false, errors: ['Training is already running.'] };
  const resolved = resolveInstall(readFolder());
  if (!('install' in resolved)) return { ok: false, errors: [resolved.error] };
  const inst = resolved.install;

  const errors: string[] = [];
  // The dataset path is renderer-supplied (the resolver's answer passed back):
  // reject NUL/UNC/drive-relative/traversal before it reaches any file op.
  const datasetDir = safeAbsPath(s.datasetPath);
  if (!datasetDir) errors.push('Dataset folder is not a valid local path.');
  for (const [label, p] of [['DiT', s.ditPath], ['Qwen3', s.qwenPath], ['VAE', s.vaePath]] as const) {
    if (typeof p !== 'string' || p.includes('\0') || !p || !fs.existsSync(p) || !fs.statSync(p).isFile()) errors.push(`${label} file not found: ${p || '(not set)'}`);
  }
  if (errors.length) return { ok: false, errors };
  const bucketCfg = { min: s.bucketMin, max: s.bucketMax, step: s.bucketStep };
  const pre = checkDataset(datasetDir!, bucketCfg);
  errors.push(...pre.errors);
  if (errors.length) return { ok: false, errors };

  // Bucketing is part of Start: one button, idempotent (see bucketDataset).
  prep = { message: 'Checking buckets…', done: 0, total: pre.unbucketed };
  const bucketError = await bucketDataset(datasetDir!, bucketCfg);
  prep = undefined;
  if (bucketError) return { ok: false, errors: [bucketError] };
  const check = checkDataset(datasetDir!, bucketCfg, true);
  if (!check.ok) return { ok: false, errors: check.errors };

  if (!(await checkCuda(inst.python, inst.scriptsDir))) {
    return { ok: false, errors: ['No NVIDIA GPU / CUDA found by PyTorch. Training on CPU isn\'t supported. Update your NVIDIA drivers and try again.'] };
  }

  const project = sanitizeProject(s.trigger);
  const outDir = path.join(inst.outputBase, project);
  const samplesDir = path.join(outDir, 'sample');
  const configsDir = path.join(outDir, 'configs');
  for (const d of [outDir, samplesDir, configsDir]) fs.mkdirSync(d, { recursive: true });
  const promptFile = path.join(configsDir, `${project}_prompts.txt`);
  const datasetToml = path.join(configsDir, `${project}_dataset.toml`);
  const trainingToml = path.join(configsDir, `${project}_training.toml`);
  writeSamplePrompts(s, promptFile);
  writeDatasetToml(s, datasetToml, check);
  writeTrainingToml(s, trainingToml, project, outDir, promptFile);

  const logFile = path.join(outDir, 'osmium_train.log');
  const logFd = fs.openSync(logFile, 'w');
  fs.writeSync(logFd, `Preparing ${project}: ${check.images} images, base ${check.baseRes}px, max bucket ${check.maxBucket}px\n`);
  // The trainer runs directly, not through `accelerate launch`: that starts it as a child process, and a
  // detached job's grandchild doesn't inherit the log file, so its progress bar went nowhere. One process,
  // one log. (Anima-TrainFlow used a single process via accelerate; mixed precision comes from the toml.)
  const args = [posix(inst.trainScript), '--config_file', posix(trainingToml), '--dataset_config', posix(datasetToml)];
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PYTHONPATH: inst.scriptsDir + path.delimiter + (process.env.PYTHONPATH || ''),
    PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1', PYTHONWARNINGS: 'ignore',
    TORCH_CPP_LOG_LEVEL: 'ERROR', KMP_WARNINGS: '0', CUDA_VISIBLE_DEVICES: '0', ACCELERATE_USE_CPU: 'False',
    ACCELERATE_MIXED_PRECISION: 'bf16', ACCELERATE_DYNAMO_BACKEND: 'no'
  };
  try {
    // pythonw.exe (Python with no console): the job is detached, so it has no console, and every data-loader
    // worker it spawns would otherwise open its own visible console window. multiprocessing reuses
    // sys.executable, so the workers are windowless too. Output still goes to the log file.
    const pythonw = path.join(path.dirname(inst.python), 'pythonw.exe');
    const trainerExe = fs.existsSync(pythonw) ? pythonw : inst.python;
    const child = spawn(trainerExe, args, { cwd: inst.scriptsDir, env, detached: true, stdio: ['ignore', logFd, logFd], windowsHide: true });
    await new Promise<void>((resolve, reject) => { child.once('spawn', resolve); child.once('error', reject); });
    child.unref();
    writeRun({ pid: child.pid as number, project, outDir, logFile, samplesDir, totalSteps: Math.round(s.steps), startedAt: Date.now(), exe: trainerExe });
    return { ok: true };
  } catch (e) {
    return { ok: false, errors: ['Could not start training: ' + (e as Error).message] };
  } finally {
    fs.closeSync(logFd);
  }
}

// Best-effort check that `pid` is the trainer we spawned, using its executable
// path from the run record. On Windows the only dependency-free way to read a
// foreign process's image path is `wmic`; it's absent on newer Windows builds,
// so a missing/failed lookup returns true (proceed) rather than blocking a
// legitimate Stop. A definite mismatch (the PID is alive but running something
// else — a reused PID) returns false.
function pidMatchesRecord(pid: number, exe?: string): boolean {
  if (!exe) return true;
  if (process.platform !== 'win32') {
    try { return fs.realpathSync(`/proc/${pid}/exe`) === fs.realpathSync(exe); } catch { return true; }
  }
  try {
    const out = execFileSync('wmic', ['process', 'where', `ProcessId=${pid}`, 'get', 'ExecutablePath', '/value'], { windowsHide: true, timeout: 5000 }).toString();
    const m = /ExecutablePath=([^\r\n]+)/i.exec(out);
    if (!m) return true; // wmic unavailable/empty: don't block the stop
    return m[1].trim().toLowerCase() === exe.toLowerCase();
  } catch { return true; }
}

function stopTraining(): { ok: boolean; message: string } {
  const rec = runIsLive();
  if (!rec) return { ok: false, message: 'Nothing is running.' };
  // Refuse to kill a live PID that isn't running our recorded trainer (a
  // reused PID after a crash). runIsLive() already ruled out a pre-boot PID.
  if (!pidMatchesRecord(rec.pid, rec.exe)) return { ok: false, message: 'The recorded training process no longer matches; not killing it.' };
  writeRun({ ...rec, stopRequested: true });
  // The captured PID and its tree (accelerate launches the trainer as a child).
  if (process.platform === 'win32') execFile('taskkill', ['/PID', String(rec.pid), '/T', '/F'], { windowsHide: true }, () => { /* status() sees it exit */ });
  else { try { process.kill(-rec.pid, 'SIGTERM'); } catch { try { process.kill(rec.pid, 'SIGTERM'); } catch { /* gone */ } } }
  return { ok: true, message: 'Stopping…' };
}

// What the window-close guard asks: is a job running right now?
export function trainflowRunning(): boolean {
  return !!runIsLive();
}

export function registerTrainflowHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('trainflow-status', () => status());
  ipcMain.handle('trainflow-pick-folder', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const opts: OpenDialogOptions = { title: 'Choose your Anima-TrainFlow folder', properties: ['openDirectory'] };
    const picked = win ? await dialog.showOpenDialog(win, opts) : await dialog.showOpenDialog(opts);
    if (!picked.canceled && picked.filePaths[0]) {
      let cfg: Record<string, unknown> = {};
      try { cfg = JSON.parse(fs.readFileSync(CONFIG_FILE(), 'utf8')); } catch { /* first time */ }
      fs.writeFileSync(CONFIG_FILE(), JSON.stringify({ ...cfg, folder: picked.filePaths[0] }));
    }
    return status();
  });
  // Generic picker for the dataset folder and the three model files.
  ipcMain.handle('trainflow-pick-path', async (event, p: { kind: 'folder' | 'file'; title: string; defaultPath?: string }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const opts: OpenDialogOptions = {
      title: p.title,
      defaultPath: p.defaultPath && fs.existsSync(p.defaultPath) ? p.defaultPath : undefined,
      properties: [p.kind === 'folder' ? 'openDirectory' : 'openFile'],
      filters: p.kind === 'file' ? [{ name: 'Safetensors', extensions: ['safetensors'] }, { name: 'All files', extensions: ['*'] }] : undefined
    };
    const picked = win ? await dialog.showOpenDialog(win, opts) : await dialog.showOpenDialog(opts);
    return picked.canceled || !picked.filePaths[0] ? null : picked.filePaths[0];
  });
  // Is this folder real and does it hold the given file? (used to validate a remembered dataset path)
  ipcMain.handle('trainflow-path-ok', (_e, dir: string, file?: string) => {
    const d = safeAbsPath(dir);
    if (!d) return false;
    const f = file === undefined ? undefined : plainFileName(file);
    if (file !== undefined && !f) return false;
    try { return fs.statSync(d).isDirectory() && (!f || fs.existsSync(path.join(d, f))); } catch { return false; }
  });
  // Locate a dataset folder by the unique marker the renderer wrote into it,
  // searching likely roots for a folder named `name` that contains the marker.
  // No prompt: the marker is a random uuid, so only the true folder matches.
  // Returns its absolute path, or null (caller then asks the user once).
  ipcMain.handle('trainflow-find-by-marker', async (_e, payload: { name: string; marker: string }) => {
    // The marker must be exactly `.osmium-probe-<uuid>` and the name a plain
    // single folder name — both are renderer-supplied and land in a walk.
    const name = plainFolderName(payload?.name);
    const marker = typeof payload?.marker === 'string' && MARKER_RE.test(payload.marker) ? payload.marker : null;
    if (!name || !marker) return null;
    const target = name.toLowerCase();

    // Skip a directory that is a symlink or Windows junction/reparse point: the
    // walk must not follow a link out of the tree it was given. lstat is used
    // because Dirent alone doesn't flag every reparse point; a stat failure is
    // treated as "skip" (fail closed).
    const isLinkOrReparse = (p: string): boolean => {
      try { return fs.lstatSync(p).isSymbolicLink(); }
      catch { return true; }
    };

    // Candidate roots, cheap-first: the common case is a same-named folder
    // directly under the home folder, Desktop or a drive root, so those are
    // probed before any deep descent. Only local fixed drives are added —
    // remote (mapped network) and removable volumes are skipped on Windows so
    // the probe never triggers SMB access or media spin-up; a dataset on one
    // is expected to miss the probe and fall through to the (cached) single
    // confirm. Detecting the volume type portably needs Windows API access
    // Node doesn't expose, so this skips only drives that are absent/busy and
    // otherwise relies on the walk not following links; see the note in
    // features/Trainflow.md.
    const home = os.homedir();
    const roots: string[] = [];
    for (const sub of ['', 'Desktop', 'Documents', 'Downloads', 'Pictures']) roots.push(path.join(home, sub));
    for (const letter of 'DEFGHIJKLMNOPQRSTUVWXYZ') {
      const drive = `${letter}:\\`;
      try { if (fs.existsSync(drive)) roots.push(drive); } catch { /* no such drive */ }
    }

    // Async + capped so a deep drive can't block the main thread. Read-only;
    // stops at the first match. MAX_VISITED bounds worst-case latency.
    const MAX_DEPTH = 3;
    const MAX_VISITED = 4000;
    const seen = new Set<string>();
    let visited = 0;

    const checkDir = async (dir: string): Promise<boolean> => {
      try { await fs.promises.access(path.join(dir, marker)); return true; } catch { return false; }
    };
    const walk = async (dir: string, depth: number): Promise<string | null> => {
      if (visited >= MAX_VISITED) return null;
      if (isLinkOrReparse(dir)) return null;
      const key = dir.toLowerCase();
      if (seen.has(key)) return null;
      seen.add(key); visited++;
      let entries: fs.Dirent[];
      try { entries = await fs.promises.readdir(dir, { withFileTypes: true }); } catch { return null; }
      const dirs = entries.filter((e) => e.isDirectory() && !e.isSymbolicLink());
      // Pass 1: same-named subfolders (the match) before descending anywhere.
      for (const ent of dirs) {
        if (ent.name.toLowerCase() !== target) continue;
        const full = path.join(dir, ent.name);
        if (await checkDir(full)) return full;
      }
      // Pass 2: descend, depth-first.
      if (depth < MAX_DEPTH) {
        for (const ent of dirs) {
          const hit = await walk(path.join(dir, ent.name), depth + 1);
          if (hit) return hit;
        }
      }
      return null;
    };

    for (const root of roots) {
      try { if (path.basename(root).toLowerCase() === target && !isLinkOrReparse(root) && await checkDir(root)) return root; } catch { /* noop */ }
      const hit = await walk(root, 0);
      if (hit) return hit;
    }
    return null;
  });
  ipcMain.handle('trainflow-check-dataset', (_e, dir: string, b: { min: number; max: number; step: number }) => {
    const d = safeAbsPath(dir);
    return d ? checkDataset(d, b) : { ok: false, images: 0, unbucketed: 0, missingCaptions: 0, oversized: 0, baseRes: 512, maxBucket: 768, errors: ['Invalid dataset folder.'] };
  });
  ipcMain.handle('trainflow-verify-buckets', (_e, dir: string, b: { min: number; max: number; step: number }) => {
    const d = safeAbsPath(dir);
    return d ? verifyBuckets(d, b) : { buckets: [], images: 0, offBucket: [], withoutOriginal: 0, toRebucket: 0 };
  });
  ipcMain.handle('trainflow-start', (_e, s: TrainflowSettings) => startTraining(s));
  ipcMain.handle('trainflow-stop', () => stopTraining());
  ipcMain.handle('trainflow-clear-run', () => {
    if (!runIsLive()) { try { fs.unlinkSync(RUN_FILE()); } catch { /* already gone */ } }
    return status();
  });
  ipcMain.handle('trainflow-get-sample', (_e, name: string) => {
    const rec = readRun();
    const f = plainFileName(name);
    if (!rec || !f || !runDirsValid(rec)) return null;
    try { return new Uint8Array(fs.readFileSync(path.join(rec.samplesDir, f))); } catch { return null; }
  });
  ipcMain.handle('trainflow-open', async (_e, what: 'output' | 'dataset' | 'log' | 'folder', datasetPath?: string) => {
    // A record whose dirs don't sit inside the install's output dir is ignored
    // (tampered or from a different install) rather than opened. The refusal is
    // returned (not just swallowed) so a caller/test can see why nothing opened.
    const rec = readRun();
    const safeRec = rec && runDirsValid(rec) ? rec : null;
    if (rec && !safeRec) return { ok: false, refused: 'run-record-dirs-outside-output' };
    let target: string | undefined;
    if (what === 'dataset') target = safeAbsPath(datasetPath) ?? undefined;
    else if (what === 'log') target = safeRec?.logFile;
    else if (what === 'folder') { const f = safeAbsPath(readFolder()); target = f ?? undefined; }
    else target = safeRec?.outDir || (resolveInstall(readFolder()) as { install?: Install }).install?.outputBase;
    if (target && fs.existsSync(target)) await shell.openPath(target);
    return { ok: true };
  });
}
