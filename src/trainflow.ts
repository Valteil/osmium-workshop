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
import { spawn, execFile } from 'child_process';
import * as fs from 'fs';
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
  const todo: BucketItem[] = [];
  for (const it of items.values()) {
    if (it.inOriginals) {
      const o = imageSize(it.src), cur = it.root ? imageSize(it.root) : null;
      if (o && cur) { const [tw, th] = getBestBucket(o.w, o.h, buckets); if (cur.w === tw && cur.h === th) continue; }
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

const tomlStr = (s: string) => JSON.stringify(s);
const posix = (p: string) => path.resolve(p).replace(/\\/g, '/');

function sanitizeProject(trigger: string): string {
  return trigger.trim().replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+|_+$/g, '') || 'untitled';
}

function writeSamplePrompts(s: TrainflowSettings, file: string): void {
  const trigger = s.trigger.trim();
  const user = s.prompt.trim().replace(/\n/g, ' ');
  const pos = trigger && !user.startsWith(trigger) ? (user ? `${trigger}, ${user}` : trigger) : (user || trigger);
  const neg = s.negPrompt.trim().replace(/\n/g, ' ');
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

// ---- the run -------------------------------------------------------------------

interface RunRecord {
  pid: number; project: string; outDir: string; logFile: string; samplesDir: string;
  totalSteps: number; startedAt: number; stopRequested?: boolean;
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

function runIsLive(): RunRecord | null {
  const r = readRun();
  return r && pidAlive(r.pid) ? r : null;
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
  const live = pidAlive(rec.pid);
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
        // Already a valid bucket size: it stays as its own bucketed copy.
        const sz = imageSize(src);
        if (sz && isBucketSize(sz.w, sz.h, buckets)) { done++; continue; }
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
  if (!resolved.ok) return { ok: false, errors: [resolved.error] };
  const inst = resolved.install;

  const errors: string[] = [];
  for (const [label, p] of [['DiT', s.ditPath], ['Qwen3', s.qwenPath], ['VAE', s.vaePath]] as const) {
    if (!p || !fs.existsSync(p) || !fs.statSync(p).isFile()) errors.push(`${label} file not found: ${p || '(not set)'}`);
  }
  const bucketCfg = { min: s.bucketMin, max: s.bucketMax, step: s.bucketStep };
  const pre = checkDataset(s.datasetPath, bucketCfg);
  errors.push(...pre.errors);
  if (errors.length) return { ok: false, errors };

  // Bucketing is part of Start: one button, idempotent (see bucketDataset).
  prep = { message: 'Checking buckets…', done: 0, total: pre.unbucketed };
  const bucketError = await bucketDataset(s.datasetPath, bucketCfg);
  prep = undefined;
  if (bucketError) return { ok: false, errors: [bucketError] };
  const check = checkDataset(s.datasetPath, bucketCfg, true);
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
    writeRun({ pid: child.pid as number, project, outDir, logFile, samplesDir, totalSteps: Math.round(s.steps), startedAt: Date.now() });
    return { ok: true };
  } catch (e) {
    return { ok: false, errors: ['Could not start training: ' + (e as Error).message] };
  } finally {
    fs.closeSync(logFd);
  }
}

function stopTraining(): { ok: boolean; message: string } {
  const rec = runIsLive();
  if (!rec) return { ok: false, message: 'Nothing is running.' };
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
    try { return fs.statSync(dir).isDirectory() && (!file || fs.existsSync(path.join(dir, file))); } catch { return false; }
  });
  ipcMain.handle('trainflow-check-dataset', (_e, dir: string, b: { min: number; max: number; step: number }) => checkDataset(dir, b));
  ipcMain.handle('trainflow-verify-buckets', (_e, dir: string, b: { min: number; max: number; step: number }) => verifyBuckets(dir, b));
  ipcMain.handle('trainflow-start', (_e, s: TrainflowSettings) => startTraining(s));
  ipcMain.handle('trainflow-stop', () => stopTraining());
  ipcMain.handle('trainflow-clear-run', () => {
    if (!runIsLive()) { try { fs.unlinkSync(RUN_FILE()); } catch { /* already gone */ } }
    return status();
  });
  ipcMain.handle('trainflow-get-sample', (_e, name: string) => {
    const rec = readRun();
    if (!rec || path.basename(name) !== name) return null;
    try { return new Uint8Array(fs.readFileSync(path.join(rec.samplesDir, name))); } catch { return null; }
  });
  ipcMain.handle('trainflow-open', async (_e, what: 'output' | 'dataset' | 'log' | 'folder', datasetPath?: string) => {
    const rec = readRun();
    const target = what === 'dataset' ? datasetPath
      : what === 'log' ? rec?.logFile
      : what === 'folder' ? readFolder()
      : rec?.outDir || (resolveInstall(readFolder()) as { install?: Install }).install?.outputBase;
    if (target && fs.existsSync(target)) await shell.openPath(target);
  });
}
