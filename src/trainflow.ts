// Trainflow: LoRA training for Anima, run from Osmium. The user points Osmium
// at their Anima-TrainFlow folder once (userData/trainflow.json); the tab then
// writes the same dataset/training TOML files Anima-TrainFlow's own app.py
// does and runs `anima_train_network.py` directly (not via `accelerate
// launch`) with that install's embedded Python.
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
  TrainflowSettings, TrainflowStatus, TrainflowRun, TrainflowDatasetCheck, TrainflowStartResult, TrainflowBucketReport,
  TrainflowCacheClearResult, TrainflowContinueOption, TfNetworkType
} from './shared-types';
import { resumePatchError, writeResumeBootstrap } from './trainflow-resume';

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
// Osmium's quarantine folder (the Disabled view): images in it are not part of the training set.
const DISABLED_DIR = 'Disabled';

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
  // Disabling an image moves its bucketed copy + caption into Disabled/ but leaves its original here, so an
  // original with no root copy and a Disabled/ copy is a disabled image: rebuilding it would put it back in
  // the training set with no caption ("2 images have no .txt caption" after disabling 2).
  const disabled = new Set(listImages(path.join(dir, DISABLED_DIR)).map(stemOf));
  const items = new Map<string, BucketItem>();
  for (const f of listImages(path.join(dir, ORIGINAL_DIR))) {
    const stem = stemOf(f), root = rootByStem.get(stem);
    if (!root && disabled.has(stem)) continue;
    items.set(stem, { stem, src: f, inOriginals: true, root });
  }
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
  if (oversized && afterBucketing) errors.push(`${oversized} image${oversized === 1 ? ' is' : 's are'} 2048px or larger. Lower the bucket Max side (Trainflow tab or Bucket Images dock).`);
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
// A float key stays a TOML float (1 -> "1.0"), as the fixed values always were.
const tomlFloat = (n: number) => Number.isInteger(n) ? n.toFixed(1) : String(n);
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

// Extra image folders beside the loaded dataset (validated in startTraining).
interface ExtraFolder { path: string; images: number; repeats: number; }

// Shuffled captions or tag dropout change the text every step, so the trainer
// refuses cached text-encoder outputs with them (anima_train_network.py asserts):
// the text encoder then runs each step, which costs VRAM and time.
const captionsVary = (s: TrainflowSettings) => !!s.captionShuffle || (s.captionTagDropout || 0) > 0;

function writeDatasetToml(s: TrainflowSettings, file: string, check: TrainflowDatasetCheck, extras: ExtraFolder[] = []): void {
  const effective = Math.round(s.batchSize) * Math.round(s.gradAcc);
  // Auto repeats spread the step budget over every folder's images; advRepeats
  // (the loaded dataset) and a folder's own repeats override it (0 = auto).
  const totalImages = check.images + extras.reduce((n, e) => n + e.images, 0);
  const auto = Math.max(1, Math.ceil((Math.round(s.steps) * effective) / Math.max(1, totalImages)));
  const repeats = s.advRepeats > 0 ? Math.round(s.advRepeats) : auto;
  const trigger = s.trigger.trim();
  const split = Math.min(0.5, Math.max(0, Number(s.validationSplit) || 0));
  const subset = (dir: string, n: number): string[] => [
    '[[datasets.subsets]]',
    `image_dir = ${tomlStr(posix(dir))}`,
    'caption_extension = ".txt"',
    `num_repeats = ${n}`,
    ...(trigger ? [`caption_prefix = ${tomlStr(trigger + ', ')}`] : []),
    `keep_tokens = ${s.advKeepTokens > 0 ? Math.round(s.advKeepTokens) : 1}`,
    `caption_dropout_rate = ${s.advCaptionDropout > 0 ? s.advCaptionDropout : 0.05}`,
    ...(s.captionShuffle ? ['shuffle_caption = true'] : []),
    ...((s.captionTagDropout || 0) > 0 ? [`caption_tag_dropout_rate = ${Math.min(1, Number(s.captionTagDropout))}`] : []),
    ''
  ];
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
    // Held-out images for a validation loss (sd-scripts splits each dataset).
    ...(split > 0 ? [`validation_split = ${split}`, `validation_seed = ${Math.round(s.trainSeed)}`] : []),
    '',
    ...subset(s.datasetPath, repeats),
    ...extras.flatMap((e) => subset(e.path, e.repeats > 0 ? Math.round(e.repeats) : auto))
  ];
  fs.writeFileSync(file, lines.join('\n'));
}

// Optimizer arguments per optimizer. Prodigy keeps its tuned set; Adafactor is
// run as a plain fixed-LR optimizer (no relative step), so the LR field and the
// scheduler mean what they say.
function optimizerArgs(opt: string): string[] {
  if (opt === 'Prodigy') return ['decouple=True', 'weight_decay=0.01', 'd_coef=1.0', 'use_bias_correction=True', 'safeguard_warmup=True', 'betas=0.9,0.99'];
  if (opt === 'Adafactor') return ['scale_parameter=False', 'relative_step=False', 'warmup_init=False'];
  return ['weight_decay=0.01'];
}
// Prodigy-family optimizers set their own step size: LR 1.0, constant schedule.
export const selfTuningOptimizer = (opt: string) => opt === 'Prodigy' || opt === 'prodigyplus.ProdigyPlusScheduleFree';
const scheduleFree = (opt: string) => /schedulefree$/i.test(opt);

// The network lines: LoRA (the old TOML, unchanged), or sd-scripts' LoKr/LoHa,
// which share lora_anima's module selection (same default excludes, same
// lora_unet_* key names; a LoKr with factor 4 is laid out like the common
// Anima LoKrs). Extra args go in network_args as sd-scripts' key=value strings.
function networkLines(s: TrainflowSettings): string[] {
  const type = s.netType || 'lora';
  const module = type === 'lokr' ? 'networks.lokr' : type === 'loha' ? 'networks.loha' : 'networks.lora_anima';
  const args: string[] = [];
  if (type === 'lokr') args.push(`factor=${Math.round(Number(s.netFactor) || -1)}`);
  if (s.netTrainLlmAdapter) args.push('train_llm_adapter=True');
  // An include pattern wins over the default exclude (network_base / lora_anima).
  if (s.netTrainModulation) args.push(`include_patterns=['.*_modulation.*']`);
  // LoRA+: the B / "up" side gets LR × ratio (lora_anima, lokr and loha all read
  // it: network_base._is_plus_param picks each one's B weights).
  const plus = Number(s.netLoraPlus) || 0;
  if (plus > 0) args.push(`loraplus_lr_ratio=${Math.min(64, plus)}`);
  return [`network_module = ${tomlStr(module)}`, ...(args.length ? [`network_args = [${args.map(tomlStr).join(', ')}]`] : [])];
}

// `extra` = lines a continued run adds (network_weights for a warm start).
// `caps` = what the install's sd-scripts supports (older ones lack per-block compile).
// The dataset's training resolution, also as a training-level arg. The
// dataset TOML's own `resolution` still wins for training (config_util's
// fallback order: dataset > general > argparse), so this only reaches the
// metadata: sd-scripts writes args.resolution into modelspec.resolution and
// ss_resolution, and with it unset it wrote its Anima default "1024x1024"
// whatever the run trained at.
const resolutionLine = (check: TrainflowDatasetCheck): string => `resolution = ${tomlStr(`${check.baseRes},${check.baseRes}`)}`;

function writeTrainingToml(s: TrainflowSettings, file: string, project: string, outDir: string, promptFile: string, extra: string[] = [], caps: { blockCompile: boolean } = { blockCompile: true }): void {
  const prodigy = selfTuningOptimizer(s.optimizer);
  const optArgs = optimizerArgs(s.optimizer);
  // torch.compile: the old checkbox meant whole-model (accelerate dynamo).
  const compile = s.advCompile !== undefined ? s.advCompile : (s.advTorchCompile ? 'model' : '');
  const compileLines = compile === 'block' && caps.blockCompile ? ['compile = true']
    : compile ? ['torch_compile = true'] : [];
  // Offload = unsloth's async variant only: v0.12's cpu_offload_checkpointing for
  // Anima picks each block's device from its first input, which the previous
  // block already moved to the CPU ("Expected all tensors to be on the same
  // device", reproduced 2026-10-17). A saved 'cpu' runs as unsloth.
  const offload = s.advOffloadCkpt ? ['unsloth_offload_checkpointing = true'] : [];
  // Keep only the newest N resume states: sd-scripts counts it in steps.
  const keepStates = s.saveState && (s.keepStates || 0) > 0 ? [`save_last_n_steps_state = ${Math.round(Number(s.keepStates)) * Math.max(1, Math.round(s.saveSteps))}`] : [];
  const validate = (s.validationSplit || 0) > 0 && (s.validateEvery || 0) > 0 ? [`validate_every_n_steps = ${Math.round(Number(s.validateEvery))}`] : [];
  const rank = Math.round(s.rank);
  // Advanced knobs fall back to the app's original defaults when unset, so an
  // untouched form — or an external caller passing a partial settings object
  // (the renderTomlsForTest seam) — writes the exact TOML it always did. Every
  // `undefined` therefore resolves to the old fixed value, never to a new one.
  const alpha = s.advAlpha > 0 ? Math.round(s.advAlpha) : rank;
  const mp = s.advMixedPrecision || 'bf16';
  const savePrec = s.advSavePrecision || 'bf16';
  // Booleans whose OLD default was `true`: undefined must stay true.
  const gradCkpt = s.advGradCheckpointing === undefined ? true : !!s.advGradCheckpointing;
  const vaeDisableCache = s.advVaeDisableCache === undefined ? true : !!s.advVaeDisableCache;
  const vaeChunk = s.advVaeChunkSize > 0 ? Math.round(s.advVaeChunkSize) : 32;
  const lines = [
    `pretrained_model_name_or_path = ${tomlStr(posix(s.ditPath))}`,
    `qwen3 = ${tomlStr(posix(s.qwenPath))}`,
    `vae = ${tomlStr(posix(s.vaePath))}`,
    ...networkLines(s),
    `network_dim = ${rank}`,
    `network_alpha = ${alpha}`,
    // Training the text encoder is opt-in; otherwise U-Net only (the default).
    ...(s.advTrainTextEncoder ? [] : ['network_train_unet_only = true']),
    ...(s.advNetworkDropout > 0 ? [`network_dropout = ${s.advNetworkDropout}`] : []),
    `gradient_checkpointing = ${gradCkpt ? 'true' : 'false'}`,
    `max_grad_norm = ${tomlFloat(s.advMaxGradNorm > 0 ? s.advMaxGradNorm : 1.0)}`,
    `learning_rate = ${Number(s.lr)}`,
    `optimizer_type = ${tomlStr(s.optimizer)}`,
    `optimizer_args = [${optArgs.map(tomlStr).join(', ')}]`,
    // Schedule-free optimizers ignore the scheduler (sd-scripts swaps in a dummy one).
    `lr_scheduler = ${tomlStr(s.advLrScheduler || (prodigy || scheduleFree(s.optimizer) ? 'constant' : 'cosine'))}`,
    ...(s.advLrWarmup > 0 ? [`lr_warmup_steps = ${Math.round(s.advLrWarmup)}`] : []),
    `max_train_steps = ${Math.round(s.steps)}`,
    `train_batch_size = ${Math.round(s.batchSize)}`,
    `gradient_accumulation_steps = ${Math.round(s.gradAcc)}`,
    `seed = ${Math.round(s.trainSeed)}`,
    `mixed_precision = ${tomlStr(mp)}`,
    `output_dir = ${tomlStr(posix(outDir))}`,
    `output_name = ${tomlStr(project)}`,
    `save_every_n_steps = ${Math.round(s.saveSteps)}`,
    `sample_every_n_steps = ${Math.round(s.sampleSteps)}`,
    `sample_prompts = ${tomlStr(posix(promptFile))}`,
    `sample_sampler = ${tomlStr(s.advSampleSampler || 'euler')}`,
    `timestep_sampling = ${tomlStr(s.advTimestepSampling || 'sigmoid')}`,
    `discrete_flow_shift = ${tomlFloat(s.advFlowShift || 1.0)}`,
    `sigmoid_scale = ${tomlFloat(s.advSigmoidScale || 1.3)}`,
    `weighting_scheme = ${tomlStr(s.advWeighting || 'logit_normal')}`,
    'cache_latents = true',
    'cache_latents_to_disk = true',
    // The trainer refuses cached TE outputs when it trains the text encoder, or
    // when captions change per step (shuffle / tag dropout).
    ...(s.advTrainTextEncoder || captionsVary(s) ? [] : ['cache_text_encoder_outputs = true', 'cache_text_encoder_outputs_to_disk = true']),
    `attn_mode = ${tomlStr(s.advAttn || 'sdpa')}`,
    ...(s.advSplitAttn ? ['split_attn = true'] : []),
    ...compileLines,
    ...(s.advBlocksToSwap > 0 ? [`blocks_to_swap = ${Math.round(s.advBlocksToSwap)}`] : []),
    ...offload,
    'save_model_as = "safetensors"',
    `save_precision = ${tomlStr(savePrec)}`,
    `max_data_loader_n_workers = ${s.advDataloaderWorkers > 0 ? Math.round(s.advDataloaderWorkers) : 4}`,
    `vae_chunk_size = ${vaeChunk}`,
    `vae_disable_cache = ${vaeDisableCache ? 'true' : 'false'}`,
    ...(s.advNoHalfVae ? ['no_half_vae = true'] : []),
    // Optimizer/scheduler/RNG state beside each checkpoint (and at the end), so
    // the run can be resumed exactly: <name>-stepNNNNNNNN-state/, <name>-state/.
    ...(s.saveState ? ['save_state = true'] : []),
    ...keepStates,
    ...validate,
    ...extra,
    ''
  ];
  fs.writeFileSync(file, lines.join('\n'));
}

// ---- test seam ----------------------------------------------------------------
// Runs the REAL writer path (writeSamplePrompts + writeDatasetToml +
// writeTrainingToml) against the given settings and returns each file's text,
// so a script can check the generated TOML (e.g. untouched settings vs an older
// writer, or control characters stripped). Not used by the app itself.
export function renderTomlsForTest(
  s: TrainflowSettings,
  check: TrainflowDatasetCheck,
  outDir: string,
  promptFile: string,
  project: string,
  extras: { path: string; images: number; repeats: number }[] = [],
  extraTrainingLines: string[] = []
): { samplePrompts: string; datasetToml: string; trainingToml: string } {
  const dir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'osmium-toml-'));
  try {
    const samplesFile = path.join(dir, 'prompts.txt');
    const datasetFile = path.join(dir, 'dataset.toml');
    const trainingFile = path.join(dir, 'training.toml');
    writeSamplePrompts(s, samplesFile);
    writeDatasetToml(s, datasetFile, check, extras);
    writeTrainingToml(s, trainingFile, project, outDir, promptFile, [resolutionLine(check), ...extraTrainingLines]);
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
  // The run's output name (its final file is <outputName>.safetensors); a
  // continued run's differs from the project. Absent in older records.
  outputName?: string;
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

// ---- trainer caches ----------------------------------------------------------
// The trainer writes latents and text-encoder outputs next to the dataset and
// reuses any it finds, even after the images or captions changed — so a
// retrain after editing tags trains on the old captions. Clearing touches only
// these two folders and only files with the trainer's own suffixes (sd-scripts'
// strategy_anima.py), never follows a link, and refuses while a run is live.
const CACHE_DIRS: [string, string][] = [['latent_cache', '_anima.npz'], ['cache_text_encoder', '_anima_te.npz']];

function cacheFiles(dataset: string): { file: string; bytes: number }[] {
  const out: { file: string; bytes: number }[] = [];
  for (const [name, suffix] of CACHE_DIRS) {
    const dir = path.join(dataset, name);
    try {
      const st = fs.lstatSync(dir);
      if (!st.isDirectory() || st.isSymbolicLink()) continue;
      for (const f of fs.readdirSync(dir)) {
        if (!f.endsWith(suffix)) continue;
        const p = path.join(dir, f);
        const fst = fs.lstatSync(p);
        if (fst.isFile()) out.push({ file: p, bytes: fst.size });
      }
    } catch { /* no cache folder */ }
  }
  return out;
}

function clearCache(dataset: string): TrainflowCacheClearResult {
  if (runIsLive()) return { ok: false, files: 0, bytes: 0, message: 'Training is running. Stop it first, or wait for it to finish.' };
  let files = 0, bytes = 0;
  const failed: string[] = [];
  for (const f of cacheFiles(dataset)) {
    try { fs.unlinkSync(f.file); files++; bytes += f.bytes; } catch { failed.push(path.basename(f.file)); }
  }
  for (const [name] of CACHE_DIRS) { try { fs.rmdirSync(path.join(dataset, name)); } catch { /* not empty or gone */ } }
  return failed.length
    ? { ok: false, files, bytes, message: `${failed.length} cache file${failed.length === 1 ? '' : 's'} couldn't be deleted (in use?).` }
    : { ok: true, files, bytes };
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

// Only the training bar ("steps: 40%|…| 240/600 […]"); validation runs its own
// tqdm bar ("validation steps" / "epoch validation steps"), whose numbers must
// not be read as the training step. Its moving average comes from VAL_LOSS_RE.
const PROGRESS_RE = /(?<!validation )\bsteps:\s*(\d+)\s*%\|[^|]*\|\s*(\d+)\/(\d+)\s*\[([^\]]*)\]/;
const VAL_BAR_RE = /validation steps:\s*\d+\s*%\|/;
// v0.12 writes val_avg_loss (step validation) and val_epoch_avg_loss; older ones val_step_avg_loss.
const VAL_LOSS_RE = /val_(?:step_|epoch_)?avg_loss=([\d.eE+-]+)/;

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

function parseLog(text: string): { lines: string[]; step: number; total: number; speed: string; eta: string; elapsed: string; loss?: number; valLoss?: number } {
  const lines: string[] = [];
  let step = 0, total = 0, speed = '', eta = '', elapsed = '', loss: number | undefined, valLoss: number | undefined;
  let lastWasProgress = false, lastWasVal = false;
  for (const raw of text.split(/[\r\n]+/)) {
    const line = raw.trim();
    if (!line || LOG_BLACKLIST.some((w) => line.includes(w))) continue;
    const v = VAL_LOSS_RE.exec(line);
    if (v) valLoss = Number(v[1]);
    // A validation bar redraws like the training one: keep only its latest line.
    if (VAL_BAR_RE.test(line)) {
      if (lastWasVal) lines[lines.length - 1] = line; else lines.push(line);
      lastWasVal = true; lastWasProgress = false;
      continue;
    }
    lastWasVal = false;
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
  return { lines: lines.slice(-LOG_TAIL_LINES), step, total, speed, eta, elapsed, loss, valLoss };
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
    trainer: 'install' in resolved ? trainerCaps(resolved.install.scriptsDir) : undefined,
    run: null, prep, logTail: [], samples: [], checkpoints: []
  };
  const rec = readRun();
  if (!rec) return out;
  const live = !startedBeforeBoot(rec) && pidAlive(rec.pid);
  const parsed = parseLog(readTail(rec.logFile));
  const finalFile = path.join(rec.outDir, (rec.outputName || rec.project) + '.safetensors');
  let finished = false;
  try { finished = fs.statSync(finalFile).mtimeMs >= rec.startedAt; } catch { /* not written yet */ }
  const total = parsed.total || rec.totalSteps;
  const state: TrainflowRun['state'] = live ? 'running' : finished ? 'finished' : rec.stopRequested ? 'stopped' : 'failed';
  out.run = {
    state, project: rec.outputName || rec.project, outDir: rec.outDir, startedAt: rec.startedAt,
    step: state === 'finished' ? total : parsed.step, total,
    speed: parsed.speed, eta: parsed.eta, elapsed: parsed.elapsed, loss: parsed.loss, valLoss: parsed.valLoss
  };
  out.logTail = parsed.lines;
  out.samples = listFiles(rec.samplesDir, ['.png', '.jpg', '.jpeg', '.webp']).slice(0, 60).map(({ name, mtime }) => ({ name, mtime }));
  out.checkpoints = listFiles(rec.outDir, ['.safetensors']).map(({ name, size }) => ({ name, size }));
  return out;
}

let prep: TrainflowStatus['prep'];

// Bucket the dataset the way the Bucket Images dock does, using its u2net
// model and its original_images/ folder. Idempotent: an image already at a valid
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

// 'notorch': the trainer's Python has no PyTorch yet — Osmium's Anima-TrainFlow
// release ships without its packages, so Install_Requirements.bat hasn't been run.
function checkCuda(python: string, cwd: string): Promise<'ok' | 'nogpu' | 'notorch'> {
  return new Promise((resolve) => {
    execFile(python, ['-c', 'import importlib.util as u, sys\nif u.find_spec("torch") is None: print("NOTORCH"); sys.exit(0)\nimport torch; print(torch.cuda.is_available())'], { cwd, timeout: 90000, windowsHide: true }, (err, stdout) => {
      resolve(/NOTORCH/.test(stdout) ? 'notorch' : !err && /True/.test(stdout) ? 'ok' : 'nogpu');
    });
  });
}

// sd-scripts' library/attention.py imports flash_attn / xformers in a
// try/except and leaves them None, so a backend that isn't installed in the
// trainer's own Python only fails at the first attention call (step 0, after
// the model load). Checked here instead, and only for those two choices.
const ATTN_PACKAGES: Record<string, { module: string; pkg: string }> = {
  flash: { module: 'flash_attn', pkg: 'flash-attn' },
  xformers: { module: 'xformers.ops', pkg: 'xformers' }
};
function checkAttentionBackend(mode: string | undefined, python: string, cwd: string): Promise<string> {
  const need = mode ? ATTN_PACKAGES[mode] : undefined;
  if (!need) return Promise.resolve('');
  return new Promise((resolve) => {
    execFile(python, ['-c', `import ${need.module}`], { cwd, timeout: 60000, windowsHide: true }, (err) => {
      resolve(err ? `Attention is set to ${mode}, but ${need.pkg} isn't installed in Anima-TrainFlow's Python (${python}). Set Attention to sdpa (on RTX 30-series and newer it already uses FlashAttention kernels), or install ${need.pkg} into that Python.` : '');
    });
  });
}

// ---- continuing a run ------------------------------------------------------------
// Two ways to train further from an earlier run of the same project:
//   - weights: a checkpoint's LoRA weights (network_weights + dim_from_weights,
//     so rank/alpha come from the file) start a NEW run of `continueSteps`
//     steps with the form's settings. Works on any checkpoint, but the
//     optimizer's moments (Prodigy's step-size estimate too) and the LR
//     schedule start over. Named <run>-from<step> so nothing is overwritten.
//   - state: a `save_state` folder (<run>-stepNNNNNNNN-state/, <run>-state/)
//     resumes exactly: same configs as that run (its configs/<run>_*.toml),
//     optimizer, LR scheduler and RNG restored, the step counter continuing,
//     checkpoints named on (step 700, 800, …) up to step + continueSteps.
const STEP_FILE_RE = /^(.+?)-step(\d{8})\.safetensors$/i;
const STATE_DIR_RE = /^(.+?)(?:-step(\d{8}))?-state$/;
const FROM_RE = /^(.+)-from(\d+)$/;

// A warm start's output name, counted from the whole chain's start:
// <p>-from600's step 400 is step 1000 of <p>, so it continues as <p>-from1000.
function warmStartName(run: string, step: number): string {
  const from = FROM_RE.exec(run);
  const abs = step ? step + (from ? Number(from[2]) : 0) : 0;
  return abs ? `${from ? from[1] : run}-from${abs}` : `${run}-more`;
}

// A run's own step count, from the training TOML it was started with.
function configSteps(outDir: string, run: string): number {
  try {
    const m = /^max_train_steps\s*=\s*(\d+)/m.exec(fs.readFileSync(path.join(outDir, 'configs', `${run}_training.toml`), 'utf8'));
    return m ? Number(m[1]) : 0;
  } catch { return 0; }
}
function stateStep(dir: string): number {
  try {
    const n = Number(JSON.parse(fs.readFileSync(path.join(dir, 'train_state.json'), 'utf8')).current_step);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  } catch { return 0; }
}

// A trigger's output folders: `<project>` and, from retraining, `<project>_2`, `_3`, …
function isProjectFolder(project: string, folder: string): boolean {
  return folder === project || (folder.startsWith(project + '_') && /^\d+$/.test(folder.slice(project.length + 1)));
}
function projectFolders(base: string, project: string): string[] {
  try {
    return fs.readdirSync(base, { withFileTypes: true }).filter(e => e.isDirectory() && isProjectFolder(project, e.name)).map(e => e.name);
  } catch { return []; }
}
// A fresh run never reuses a folder that already has something in it: retraining the
// same trigger goes to `<project>_2`, `_3`, … (and its LoRA is named after that folder).
function freshProjectFolder(base: string, project: string): string {
  const used = (name: string) => { try { return fs.readdirSync(path.join(base, name)).length > 0; } catch { return false; } };
  if (!used(project)) return project;
  let n = 2;
  while (used(`${project}_${n}`)) n++;
  return `${project}_${n}`;
}

function listContinueOptions(trigger: string): TrainflowContinueOption[] {
  const resolved = resolveInstall(readFolder());
  if (!('install' in resolved)) return [];
  const base = resolved.install.outputBase;
  const out: TrainflowContinueOption[] = [];
  for (const folder of projectFolders(base, sanitizeProject(String(trigger || '')))) {
    const outDir = path.join(base, folder);
    let entries: fs.Dirent[];
    try { entries = fs.readdirSync(outDir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      const full = path.join(outDir, e.name);
      let mtime = 0;
      try { mtime = fs.statSync(full).mtimeMs; } catch { continue; }
      if (e.isFile() && /\.safetensors$/i.test(e.name)) {
        const m = STEP_FILE_RE.exec(e.name);
        const run = m ? m[1] : e.name.replace(/\.safetensors$/i, '');
        const step = m ? Number(m[2]) : configSteps(outDir, run);
        out.push({ id: `weights:${folder}/${e.name}`, kind: 'weights', name: e.name, run, step, mtime, outputName: warmStartName(run, step) });
      } else if (e.isDirectory()) {
        const m = STATE_DIR_RE.exec(e.name);
        const step = m ? stateStep(full) : 0;
        if (m && step) out.push({ id: `state:${folder}/${e.name}`, kind: 'state', name: e.name, run: m[1], step, mtime, outputName: m[1] });
      }
    }
  }
  return out.sort((a, b) => b.mtime - a.mtime || b.step - a.step);
}

interface ContinuePlan {
  kind: 'weights' | 'state';
  path: string;        // the checkpoint file / state folder
  run: string;         // the run it came from
  step: number;        // its step (0 = unknown)
  outputName: string;  // the new run's output name
  total: number;       // max_train_steps of the new run
  outDir: string;      // the folder it lives in; the continued run stays there
}
// Validates `continueFrom` ("<kind>:<folder>/<name>", or the older "<kind>:<name>"
// meaning the project's own folder) against the trigger's output folders. Both
// parts are plain names (no paths from the renderer).
function planContinue(s: TrainflowSettings, base: string, project: string, scriptsDir: string): { plan?: ContinuePlan; error?: string } {
  const raw = String(s.continueFrom || '');
  if (!raw) return {};
  const more = Math.round(Number(s.continueSteps));
  if (!(more >= 1)) return { error: 'Set how many more steps to train.' };
  const kind = raw.startsWith('weights:') ? 'weights' : raw.startsWith('state:') ? 'state' : null;
  const rest = kind ? raw.slice(kind.length + 1) : '';
  const slash = rest.indexOf('/');
  const folder = slash === -1 ? project : plainFileName(rest.slice(0, slash));
  const name = plainFileName(slash === -1 ? rest : rest.slice(slash + 1));
  if (!kind || !name || !folder || !isProjectFolder(project, folder)) return { error: 'Pick what to continue from again.' };
  const outDir = path.join(base, folder);
  const full = path.join(outDir, name);
  if (kind === 'weights') {
    const m = STEP_FILE_RE.exec(name);
    if (!/\.safetensors$/i.test(name) || !fs.existsSync(full) || !fs.statSync(full).isFile()) return { error: `Checkpoint not found: ${name}` };
    const run = m ? m[1] : name.replace(/\.safetensors$/i, '');
    const step = m ? Number(m[2]) : configSteps(outDir, run);
    return { plan: { kind, path: full, run, step, outputName: warmStartName(run, step), total: more, outDir } };
  }
  const m = STATE_DIR_RE.exec(name);
  const step = m ? stateStep(full) : 0;
  if (!m || !step || !fs.statSync(full, { throwIfNoEntry: false })?.isDirectory()) return { error: `Saved state not found: ${name}` };
  const run = m[1];
  for (const k of ['training', 'dataset']) {
    if (!fs.existsSync(path.join(outDir, 'configs', `${run}_${k}.toml`))) return { error: `The settings this state was trained with (configs/${run}_${k}.toml) are gone, so it can't be resumed exactly. Continue from its checkpoint's weights instead.` };
  }
  const patchError = resumePatchError(scriptsDir);
  if (patchError) return { error: patchError };
  return { plan: { kind: 'state', path: full, run, step, outputName: run, total: step + more, outDir } };
}

// What the install's sd-scripts supports, read from its source (users may point
// Trainflow at an older Anima-TrainFlow than the in-tree one).
const capsCache = new Map<string, { mtime: number; caps: { blockCompile: boolean } }>();
function trainerCaps(scriptsDir: string): { blockCompile: boolean } {
  const file = path.join(scriptsDir, 'library', 'anima_train_utils.py');
  let mtime = 0;
  try { mtime = fs.statSync(file).mtimeMs; } catch { /* old layout */ }
  const hit = capsCache.get(file);
  if (hit && hit.mtime === mtime) return hit.caps;
  let utils = '';
  try { utils = fs.readFileSync(file, 'utf8'); } catch { /* old layout */ }
  const caps = { blockCompile: utils.includes('"--compile"') };
  capsCache.set(file, { mtime, caps });
  return caps;
}

// A checkpoint's network type from its tensor names (safetensors header only):
// a warm start must load it with the module that made it. For LoKr also the
// factor: networks.lokr's create_network_from_weights rebuilds the modules with
// the factor from network_args (default -1), not from the file, so a factor-4
// file loaded with -1 would get the wrong shapes. A fixed factor F makes every
// lokr_w1 F×F; anything else came from the automatic split (-1).
export function networkInfoOf(file: string): { type: TfNetworkType; factor?: number } {
  try {
    const fd = fs.openSync(file, 'r');
    try {
      const lenBuf = Buffer.alloc(8);
      fs.readSync(fd, lenBuf, 0, 8, 0);
      const len = Number(lenBuf.readBigUInt64LE(0));
      if (!(len > 0 && len < 64 * 1048576)) return { type: 'lora' };
      const head = Buffer.alloc(len);
      fs.readSync(fd, head, 0, len, 8);
      const header = JSON.parse(head.toString('utf8')) as Record<string, { shape?: number[] }>;
      const keys = Object.keys(header);
      if (keys.some((k) => k.includes('.lokr_w'))) {
        const w1 = keys.filter((k) => k.endsWith('.lokr_w1')).map((k) => header[k].shape || []);
        const f = w1.length ? w1[0][0] : 0;
        const fixed = f > 0 && w1.every((sh) => sh.length === 2 && sh[0] === f && sh[1] === f);
        return { type: 'lokr', factor: fixed ? f : -1 };
      }
      if (keys.some((k) => k.includes('.hada_w'))) return { type: 'loha' };
    } finally { fs.closeSync(fd); }
  } catch { /* unreadable: treat as LoRA */ }
  return { type: 'lora' };
}

// The extra image folders: real local folders with images, each captioned.
function checkExtraFolders(s: TrainflowSettings, datasetDir: string): { extras: ExtraFolder[]; errors: string[] } {
  const extras: ExtraFolder[] = [];
  const errors: string[] = [];
  for (const f of s.extraFolders || []) {
    const dir = safeAbsPath(f && f.path);
    if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) { errors.push(`Extra folder not found: ${(f && f.path) || '(empty)'}`); continue; }
    if (path.resolve(dir).toLowerCase() === path.resolve(datasetDir).toLowerCase()) { errors.push(`An extra folder is the loaded dataset itself: ${dir}`); continue; }
    const imgs = listImages(dir);
    if (!imgs.length) { errors.push(`No images in extra folder ${dir}`); continue; }
    const missing = imgs.filter((img) => !fs.existsSync(img.slice(0, img.length - path.extname(img).length) + '.txt')).length;
    if (missing) errors.push(`${missing} image${missing === 1 ? '' : 's'} in ${dir} ha${missing === 1 ? 's' : 've'} no .txt caption.`);
    if (imgs.some((img) => path.extname(img).toLowerCase() === '.webp')) errors.push(`${dir} has WebP images, which the trainer can't read. Convert them to PNG first.`);
    extras.push({ path: dir, images: imgs.length, repeats: Math.max(0, Math.round(Number(f.repeats) || 0)) });
  }
  return { extras, errors };
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
  const { plan, error: planError } = planContinue(s, inst.outputBase, sanitizeProject(s.trigger), inst.scriptsDir);
  if (planError) return { ok: false, errors: [planError] };
  // A continued run stays in its checkpoint's folder; a fresh one gets an unused folder
  // (and is named after it), so retraining a trigger never mixes into the old run.
  const outDir = plan ? plan.outDir : path.join(inst.outputBase, freshProjectFolder(inst.outputBase, sanitizeProject(s.trigger)));
  const project = path.basename(outDir);
  const bucketCfg = { min: s.bucketMin, max: s.bucketMax, step: s.bucketStep };
  const pre = checkDataset(datasetDir!, bucketCfg);
  errors.push(...pre.errors);
  const { extras, errors: extraErrors } = checkExtraFolders(s, datasetDir!);
  errors.push(...extraErrors);
  // Combinations anima_train_network.py asserts against: say so before loading anything.
  if (s.advOffloadCkpt && s.advBlocksToSwap > 0) errors.push('Checkpoint offloading can\'t be combined with Blocks to swap. Use one of the two (Advanced → Performance & VRAM).');
  if (errors.length) return { ok: false, errors };

  // Bucketing is part of Start: one button, idempotent (see bucketDataset).
  prep = { message: 'Checking buckets…', done: 0, total: pre.unbucketed };
  const bucketError = await bucketDataset(datasetDir!, bucketCfg);
  prep = undefined;
  if (bucketError) return { ok: false, errors: [bucketError] };
  const check = checkDataset(datasetDir!, bucketCfg, true);
  if (!check.ok) return { ok: false, errors: check.errors };

  const cuda = await checkCuda(inst.python, inst.scriptsDir);
  if (cuda === 'notorch') {
    return { ok: false, errors: [`Anima-TrainFlow's Python packages aren't installed yet. Run Install_Requirements.bat in ${inst.root} once (it downloads PyTorch and the trainer's packages, about 5 GB), then press Start again.`] };
  }
  if (cuda === 'nogpu') {
    return { ok: false, errors: ['No NVIDIA GPU / CUDA found by PyTorch. Training on CPU isn\'t supported. Update your NVIDIA drivers and try again.'] };
  }
  const attnError = await checkAttentionBackend(s.advAttn, inst.python, inst.scriptsDir);
  if (attnError) return { ok: false, errors: [attnError] };

  const samplesDir = path.join(outDir, 'sample');
  const configsDir = path.join(outDir, 'configs');
  for (const d of [outDir, samplesDir, configsDir]) fs.mkdirSync(d, { recursive: true });
  // Configs are named by output name, so an exact resume later finds the very
  // settings each run used (a fresh run's output name is the project, as before).
  const outputName = plan ? plan.outputName : project;
  const datasetToml = path.join(configsDir, `${outputName}_dataset.toml`);
  const trainingToml = path.join(configsDir, `${outputName}_training.toml`);
  if (plan?.kind !== 'state') {
    // A fresh run, or a warm start: the form's settings, steps = the extra steps,
    // and the network type (and LoKr factor) the checkpoint was made with.
    const net = plan ? networkInfoOf(plan.path) : null;
    const runSettings: TrainflowSettings = plan && net ? { ...s, steps: plan.total, netType: net.type, ...(net.factor !== undefined ? { netFactor: net.factor } : {}) } : s;
    const promptFile = path.join(configsDir, `${outputName}_prompts.txt`);
    writeSamplePrompts(runSettings, promptFile);
    writeDatasetToml(runSettings, datasetToml, check, extras);
    writeTrainingToml(runSettings, trainingToml, outputName, outDir, promptFile,
      [resolutionLine(check), ...(plan ? [`network_weights = ${tomlStr(posix(plan.path))}`, 'dim_from_weights = true'] : [])], trainerCaps(inst.scriptsDir));
  }

  const logFile = path.join(outDir, 'osmium_train.log');
  const logFd = fs.openSync(logFile, 'w');
  fs.writeSync(logFd, `Preparing ${outputName}: ${check.images} images${extras.length ? ` + ${extras.reduce((n, e) => n + e.images, 0)} in ${extras.length} extra folder${extras.length === 1 ? '' : 's'}` : ''}, base ${check.baseRes}px, max bucket ${check.maxBucket}px\n`);
  if (plan?.kind === 'weights') fs.writeSync(logFd, `Continuing from ${path.basename(plan.path)}'s weights: ${plan.total} more steps as ${outputName} (new optimizer state and LR schedule).\n`);
  if (plan?.kind === 'state') fs.writeSync(logFd, `Resuming ${plan.run} exactly from ${path.basename(plan.path)} (step ${plan.step}) to step ${plan.total}, with that run's settings.\n`);
  // The trainer runs directly, not through `accelerate launch`: that starts it as a child process, and a
  // detached job's grandchild doesn't inherit the log file, so its progress bar went nowhere. One process,
  // one log. (Anima-TrainFlow used a single process via accelerate; mixed precision comes from the toml.)
  // An exact resume goes through the bootstrap (see RESUME_PATCHES) with --resume and the new step total
  // on the command line, which sd-scripts lets override the run's own TOML.
  let args = [posix(inst.trainScript), '--config_file', posix(trainingToml), '--dataset_config', posix(datasetToml)];
  if (plan?.kind === 'state') {
    const boot = path.join(configsDir, 'osmium_resume_boot.py');
    writeResumeBootstrap(boot);
    args = [posix(boot), posix(inst.scriptsDir), ...args, '--resume', posix(plan.path), '--max_train_steps', String(plan.total)];
  }
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PYTHONPATH: inst.scriptsDir + path.delimiter + (process.env.PYTHONPATH || ''),
    PYTHONIOENCODING: 'utf-8', PYTHONUNBUFFERED: '1', PYTHONWARNINGS: 'ignore',
    TORCH_CPP_LOG_LEVEL: 'ERROR', KMP_WARNINGS: '0', CUDA_VISIBLE_DEVICES: '0', ACCELERATE_USE_CPU: 'False',
    ACCELERATE_MIXED_PRECISION: 'bf16', ACCELERATE_DYNAMO_BACKEND: 'no'
  };
  try {
    // The job is detached, so it has no console, and every console program it starts would open its own
    // visible window: data-loader workers, and with torch_compile a rapid stream of them (Triton's tcc
    // launcher builds, Inductor's compile workers). So on Windows a windowless pythonw.exe launcher starts
    // the trainer as python.exe with CREATE_NO_WINDOW: a console that has no window, which every child
    // inherits instead of making its own (verified: a child's GetConsoleWindow() is 0). The launcher waits
    // and exits with the trainer's code; the run record keeps the launcher's PID, and Stop's
    // `taskkill /T` takes the whole tree. Without pythonw.exe (a venv layout), the old direct spawn.
    const pythonw = path.join(path.dirname(inst.python), 'pythonw.exe');
    const useLauncher = process.platform === 'win32' && fs.existsSync(pythonw);
    const trainerExe = useLauncher ? pythonw : inst.python;
    const launcher = "import subprocess,sys; p=subprocess.Popen(sys.argv[1:], stdin=subprocess.DEVNULL, stdout=sys.stdout, stderr=sys.stderr, creationflags=0x08000000); sys.exit(p.wait())";
    const spawnArgs = useLauncher ? ['-c', launcher, inst.python, ...args] : args;
    const child = spawn(trainerExe, spawnArgs, { cwd: inst.scriptsDir, env, detached: true, stdio: ['ignore', logFd, logFd], windowsHide: true });
    await new Promise<void>((resolve, reject) => { child.once('spawn', resolve); child.once('error', reject); });
    child.unref();
    writeRun({ pid: child.pid as number, project, outputName, outDir, logFile, samplesDir, totalSteps: plan ? plan.total : Math.round(s.steps), startedAt: Date.now(), exe: trainerExe });
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
  // The captured PID and its tree (the trainer's dataloader workers are children).
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
  ipcMain.handle('trainflow-cache-info', (_e, dir: string) => {
    const d = safeAbsPath(dir);
    return d ? cacheFiles(d).reduce((a, f) => ({ files: a.files + 1, bytes: a.bytes + f.bytes }), { files: 0, bytes: 0 }) : { files: 0, bytes: 0 };
  });
  ipcMain.handle('trainflow-clear-cache', (_e, dir: string) => {
    const d = safeAbsPath(dir);
    return d ? clearCache(d) : { ok: false, files: 0, bytes: 0, message: 'Invalid dataset folder.' };
  });
  ipcMain.handle('trainflow-start', (_e, s: TrainflowSettings) => startTraining(s));
  ipcMain.handle('trainflow-continue-options', (_e, trigger: string) => listContinueOptions(trigger));
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
  // Send a checkpoint to a folder of the user's (2026-10-18). Destinations are only ever
  // folders picked in main's own dialog: the favorite lives in trainflow.json, the last
  // pick in memory; the renderer just says which one. The file must be a .safetensors in
  // the current run's output folder, and an existing file is never overwritten.
  const readCfg = (): Record<string, unknown> => { try { return JSON.parse(fs.readFileSync(CONFIG_FILE(), 'utf8')); } catch { return {}; } };
  const favoriteSendDir = (): string | null => {
    const f = safeAbsPath(readCfg().sendFolder as string);
    return f && fs.existsSync(f) && fs.statSync(f).isDirectory() ? f : null;
  };
  let pickedSendDir: string | null = null;
  ipcMain.handle('trainflow-send-dest', () => ({ favorite: favoriteSendDir() }));
  ipcMain.handle('trainflow-pick-send-dest', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const opts: OpenDialogOptions = { title: 'Send the checkpoint to…', defaultPath: favoriteSendDir() || undefined, properties: ['openDirectory', 'createDirectory'] };
    const picked = win ? await dialog.showOpenDialog(win, opts) : await dialog.showOpenDialog(opts);
    if (picked.canceled || !picked.filePaths[0]) return null;
    pickedSendDir = picked.filePaths[0];
    return pickedSendDir;
  });
  ipcMain.handle('trainflow-set-send-favorite', () => {
    if (pickedSendDir) fs.writeFileSync(CONFIG_FILE(), JSON.stringify({ ...readCfg(), sendFolder: pickedSendDir }));
    return { favorite: favoriteSendDir() };
  });
  ipcMain.handle('trainflow-send-checkpoint', async (_e, p: { name: string; newName: string; dest: 'favorite' | 'picked' }) => {
    const rec = readRun();
    const src = plainFileName(p?.name);
    if (!rec || !runDirsValid(rec) || !src || !/\.safetensors$/i.test(src)) return { ok: false, error: 'That checkpoint isn\'t in the current run any more.' };
    const stem = String(p?.newName || '').trim().replace(/\.safetensors$/i, '');
    const target = plainFileName(stem + '.safetensors');
    if (!stem || !target || /[<>:"|?*]/.test(stem)) return { ok: false, error: 'Use a plain file name (no \\ / : * ? " < > |).' };
    const dir = p?.dest === 'picked' ? pickedSendDir : favoriteSendDir();
    if (!dir) return { ok: false, error: 'Choose a folder first.' };
    const from = path.join(rec.outDir, src);
    if (!fs.existsSync(from)) return { ok: false, error: 'That checkpoint isn\'t in the current run any more.' };
    const to = path.join(dir, target);
    try {
      await fs.promises.copyFile(from, to, fs.constants.COPYFILE_EXCL);
      return { ok: true, path: to };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'EEXIST') return { ok: false, exists: true, error: `${target} already exists there. Pick another name.` };
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
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
