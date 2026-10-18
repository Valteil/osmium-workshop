// A LoRA's training metadata, laid out like Xypher7's lora-metadata-viewer
// (github.com/Xypher7/lora-metadata-viewer): a summary grid of the trainer's
// settings (kohya ss_* / modelspec.*), the dataset folders, the training tags
// per folder with a filter, and every raw key. Read-only (no editing). The
// data is the runner's lora_info (a file in ComfyUI's loras folders — the
// phone asks the PC for it) or, on the desktop, a .safetensors picked from
// disk and parsed here (header only, no hash). Everything is textContent.
import type { LoraFileInfo } from './lora-lookup';

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

// ---- reading -------------------------------------------------------------------

const HEADER_MAX = 100 * 1024 * 1024;
const TAGS_PER_FOLDER = 500;

// Tag counts per folder (+ overall), sorted by count, from ss_tag_frequency's
// JSON {"<folder>": {"<tag>": count}}.
export function tagFrequency(raw: string): { folders: Record<string, [string, number][]>; total: [string, number][] } {
  const folders: Record<string, [string, number][]> = {};
  const totals = new Map<string, number>();
  let freq: unknown;
  try { freq = JSON.parse(raw || '{}'); } catch { freq = {}; }
  if (freq && typeof freq === 'object') {
    for (const [folder, tags] of Object.entries(freq as Record<string, unknown>)) {
      if (!tags || typeof tags !== 'object') continue;
      const counts = new Map<string, number>();
      for (const [tag, c] of Object.entries(tags as Record<string, unknown>)) {
        const t = tag.trim();
        const n = Number(c) || 0;
        if (!t) continue;
        counts.set(t, (counts.get(t) || 0) + n);
        totals.set(t, (totals.get(t) || 0) + n);
      }
      folders[folder] = [...counts].sort((a, b) => b[1] - a[1]).slice(0, TAGS_PER_FOLDER);
    }
  }
  return { folders, total: [...totals].sort((a, b) => b[1] - a[1]).slice(0, TAGS_PER_FOLDER) };
}

// A local .safetensors' header (<u64 LE length><JSON>) → the same shape as
// the runner's lora_info, without the SHA-256 (hashing a multi-GB file in the
// renderer isn't worth it; the runner does it for list LoRAs).
export async function readSafetensorsFile(file: File): Promise<LoraFileInfo> {
  if (!/\.safetensors$/i.test(file.name)) throw new Error('Pick a .safetensors file.');
  const lenBytes = new DataView(await file.slice(0, 8).arrayBuffer());
  if (lenBytes.byteLength < 8) throw new Error('Not a safetensors file (too short).');
  const n = Number(lenBytes.getBigUint64(0, true));
  if (!(n > 0 && n <= HEADER_MAX && 8 + n <= file.size)) throw new Error('Not a safetensors file (bad header length).');
  let header: unknown;
  try { header = JSON.parse(new TextDecoder().decode(await file.slice(8, 8 + n).arrayBuffer())); }
  catch { throw new Error('Not a safetensors file (unreadable header).'); }
  const rawMeta = header && typeof header === 'object' ? (header as Record<string, unknown>).__metadata__ : null;
  const meta: Record<string, string> = {};
  let tags = { folders: {} as Record<string, [string, number][]>, total: [] as [string, number][] };
  if (rawMeta && typeof rawMeta === 'object') {
    for (const [k, v] of Object.entries(rawMeta as Record<string, unknown>)) {
      if (v === null || v === undefined || v === '' || v === 'None') continue;
      if (k === 'ss_tag_frequency') { tags = tagFrequency(String(v)); continue; }
      meta[k] = String(v);
    }
  }
  return { name: file.name, file: file.name, size: file.size, sha256: '', meta, top_tags: tags.total, tag_frequency: tags.folders };
}

// ---- formatting ----------------------------------------------------------------

const json = (s: string | undefined): unknown => {
  if (!s) return undefined;
  try { return JSON.parse(s); } catch { return undefined; }
};
const num = (s: string | undefined): number | undefined => {
  if (s === undefined || s === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
};
const fmtSize = (b: number): string => b >= 1024 ** 3 ? `${(b / 1024 ** 3).toFixed(2)} GB` : `${(b / 1024 ** 2).toFixed(1)} MB`;
const fmtDuration = (sec: number): string => {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.round(sec % 60);
  return h ? `${h}h ${m}m` : m ? `${m}m ${s}s` : `${s}s`;
};
const fmtDate = (sec: number): string => new Date(sec * 1000).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const of = (a?: string, b?: string): string | undefined => a && b ? `${a} of ${b}` : a || (b ? `? of ${b}` : undefined);

// ss_network_args is a JSON object of strings ({"conv_dim": "8", "algo": "lokr", …}).
function networkArgs(meta: Record<string, string>): Record<string, string> {
  const a = json(meta.ss_network_args);
  const out: Record<string, string> = {};
  if (a && typeof a === 'object') for (const [k, v] of Object.entries(a as Record<string, unknown>)) out[k] = String(v);
  return out;
}

interface DatasetDir { name: string; images?: number; repeats?: number }
// The dataset folders: ss_dataset_dirs {dir: {n_repeats, img_count}}, else
// ss_datasets[].subsets[] (image_dir, num_repeats, img_count).
function datasetDirs(meta: Record<string, string>): DatasetDir[] {
  const out: DatasetDir[] = [];
  const dirs = json(meta.ss_dataset_dirs);
  if (dirs && typeof dirs === 'object') {
    for (const [name, v] of Object.entries(dirs as Record<string, Record<string, unknown>>)) {
      out.push({ name, images: num(String(v?.img_count ?? '')), repeats: num(String(v?.n_repeats ?? '')) });
    }
  }
  if (out.length) return out;
  const sets = json(meta.ss_datasets);
  if (Array.isArray(sets)) {
    for (const ds of sets) {
      for (const sub of (ds && Array.isArray(ds.subsets) ? ds.subsets : [])) {
        out.push({ name: String(sub.image_dir || sub.metadata_file || '?'), images: num(String(sub.img_count ?? '')), repeats: num(String(sub.num_repeats ?? '')) });
      }
    }
  }
  return out;
}

type Field = [string, string | undefined];
interface Group { title: string; fields: Field[] }

// The summary, grouped like the reference viewer's custom layout.
export function trainingSummary(info: LoraFileInfo): Group[] {
  const m = info.meta || {};
  const args = networkArgs(m);
  const sets = json(m.ss_datasets);
  const ds0 = Array.isArray(sets) && sets[0] && typeof sets[0] === 'object' ? sets[0] as Record<string, unknown> : {};
  const dirs = datasetDirs(m);
  const images = dirs.reduce((s, d) => s + (d.images || 0), 0);
  const started = num(m.ss_training_started_at), finished = num(m.ss_training_finished_at);
  const optFull = m.ss_optimizer || '';
  const optName = optFull.match(/\b(\w+)\b(?=\s*\()|\b(\w+)\b$/)?.[0] || optFull || undefined;
  const optArgs = optFull.indexOf('(') > 0 ? optFull.slice(optFull.indexOf('(') + 1, -1) : (json(m.ss_optimizer_args) ? undefined : m.ss_optimizer_args);
  const module = m.ss_network_module;
  const algo = args.algo || (module ? module.split('.').pop() : undefined);
  const dim = m.ss_network_dim, alpha = m.ss_network_alpha;
  const res = m['modelspec.resolution'] || m.ss_resolution || (Array.isArray(ds0.resolution) ? (ds0.resolution as unknown[]).join('x') : undefined);
  return [
    { title: 'Model', fields: [
      ['Output name', m.ss_output_name || m['modelspec.title']],
      ['Base model', m.ss_sd_model_name || m['modelspec.architecture'] || m.ss_base_model_version],
      ['Architecture', m['modelspec.architecture'] && m.ss_sd_model_name ? m['modelspec.architecture'] : undefined],
      ['Base model hash', (m.ss_new_sd_model_hash || m.ss_sd_model_hash || '').slice(0, 10) || undefined],
      ['VAE', m.ss_vae_name],
      ['Resolution', res],
      ['Clip skip', m.ss_clip_skip],
      ['Trigger', m['modelspec.trigger_phrase']],
      ['Prediction', m['modelspec.prediction_type']]
    ] },
    { title: 'Training', fields: [
      ['Epoch', of(m.ss_epoch, m.ss_num_epochs)],
      ['Steps', of(m.ss_steps, m.ss_max_train_steps)],
      ['Batch size', m.ss_total_batch_size || (ds0.batch_size_per_device !== undefined ? String(ds0.batch_size_per_device) : undefined)],
      ['Grad. accumulation', m.ss_gradient_accumulation_steps && m.ss_gradient_accumulation_steps !== '1' ? m.ss_gradient_accumulation_steps : undefined],
      ['Grad. checkpointing', m.ss_gradient_checkpointing],
      ['Mixed precision', m.ss_mixed_precision],
      ['Training images', images ? String(images) : (m.ss_num_train_images || undefined)],
      ['Seed', m.ss_seed],
      ['Started', started ? fmtDate(started) : undefined],
      ['Training time', started && finished && finished > started ? fmtDuration(finished - started) : undefined]
    ] },
    { title: 'Network', fields: [
      ['Type', algo],
      ['Module', module],
      ['Dim / Alpha', dim || alpha ? `${dim || '?'} / ${alpha || '?'}` : undefined],
      ['Conv dim / alpha', args.conv_dim ? `${args.conv_dim} / ${args.conv_alpha || '?'}` : undefined],
      ['Factor', args.factor],
      ['DoRA', args.dora_wd && args.dora_wd.toLowerCase() === 'true' ? 'yes' : undefined],
      ['Dropout', m.ss_network_dropout],
      ['Train', m.ss_network_train_unet_only === 'True' ? 'UNet / DiT only' : m.ss_network_train_text_encoder_only === 'True' ? 'Text encoder only' : undefined]
    ] },
    { title: 'Optimizer', fields: [
      ['Optimizer', optName],
      ['Optimizer args', optArgs || undefined],
      ['LR scheduler', m.ss_lr_scheduler],
      ['Warmup steps', m.ss_lr_warmup_steps && m.ss_lr_warmup_steps !== '0' ? m.ss_lr_warmup_steps : undefined],
      ['Learning rate', m.ss_learning_rate],
      ['UNet LR', m.ss_unet_lr],
      ['Text encoder LR', m.ss_text_encoder_lr]
    ] },
    { title: 'Noise', fields: [
      ['Noise offset', m.ss_noise_offset],
      ['Adaptive noise', m.ss_adaptive_noise_scale],
      ['Multires iters', m.ss_multires_noise_iterations],
      ['Multires discount', m.ss_multires_noise_discount],
      ['Min SNR gamma', m.ss_min_snr_gamma],
      ['IP noise gamma', m.ss_ip_noise_gamma],
      ['Timestep sampling', m.ss_timestep_sampling],
      ['Discrete flow shift', m.ss_discrete_flow_shift]
    ] }
  ].map((g) => ({ title: g.title, fields: (g.fields as Field[]).filter(([, v]) => v !== undefined && v !== '' && v !== 'None') }))
    .filter((g) => g.fields.length);
}

// A raw value for the All metadata list: JSON pretty-printed, else as is.
function prettyValue(v: string): string {
  const t = v.trim();
  if (t.startsWith('{') || t.startsWith('[')) {
    try { return JSON.stringify(JSON.parse(t), null, 2); } catch { /* keep as is */ }
  }
  return v;
}

// ---- rendering -----------------------------------------------------------------

export interface TrainingViewOptions {
  copyText?(text: string): void;
}

const copy = (text: string, opts: TrainingViewOptions, b: HTMLButtonElement): void => {
  const done = () => { const t = b.textContent; b.textContent = 'Copied'; setTimeout(() => { b.textContent = t; }, 1200); };
  if (opts.copyText) { opts.copyText(text); done(); return; }
  void navigator.clipboard?.writeText(text).then(done, () => undefined);
};
const smallBtn = (label: string, title: string, onClick: (b: HTMLButtonElement) => void): HTMLButtonElement => {
  const b = el('button', 'lora-btn', label);
  b.type = 'button';
  b.title = title;
  b.addEventListener('click', () => onClick(b));
  return b;
};

function tagsBlock(info: LoraFileInfo, opts: TrainingViewOptions): HTMLElement | null {
  const folders = info.tag_frequency || {};
  const names = Object.keys(folders);
  const total = info.top_tags || [];
  if (!total.length) return null;
  const box = el('div', 'lt-block');
  box.appendChild(el('div', 'lt-block-title', 'Training tags'));
  const bar = el('div', 'lt-tag-bar');
  const sel = el('select');
  const add = (value: string, label: string) => { const o = el('option', undefined, label); o.value = value; sel.appendChild(o); };
  add('', `All folders (${total.length})`);
  if (names.length > 1) for (const n of names) add(n, `${n} (${folders[n].length})`);
  sel.hidden = names.length <= 1;
  const filter = el('input');
  filter.type = 'search';
  filter.placeholder = 'Filter tags…';
  const chips = el('div', 'lora-chips lt-tags');
  const current = () => (sel.value && folders[sel.value]) || total;
  const draw = () => {
    const q = filter.value.trim().toLowerCase();
    const list = current().filter(([t]) => !q || t.toLowerCase().includes(q));
    chips.replaceChildren(...list.slice(0, 300).map(([t, c]) => {
      const chip = el('span', 'lora-chip');
      chip.append(t, el('span', 'lt-count', ` ${c}`));
      return chip;
    }));
    if (!list.length) chips.appendChild(el('span', 'lora-note', 'No tags match.'));
  };
  sel.addEventListener('change', draw);
  filter.addEventListener('input', draw);
  const copyTop = smallBtn('Copy top 20', 'Copy the 20 most used tags (comma separated), a starting prompt', (b) =>
    copy(current().slice(0, 20).map(([t]) => t).join(', '), opts, b));
  bar.append(sel, filter, copyTop);
  box.append(bar, chips);
  draw();
  return box;
}

// The whole view for one LoRA file.
export function renderTrainingInfo(out: HTMLElement, info: LoraFileInfo, opts: TrainingViewOptions = {}): void {
  out.replaceChildren();
  const view = el('div', 'lt-view');
  // File line
  const fileRow = el('div', 'lt-file');
  fileRow.append(el('span', 'lora-name', info.file || info.name), el('span', 'lora-strength', fmtSize(info.size || 0)));
  view.appendChild(fileRow);
  if (info.sha256) {
    const r = el('div', 'gen-info-row');
    r.append(el('span', 'gen-info-k', 'SHA-256'), el('span', 'gen-info-v lora-mono', `${info.sha256} (AutoV2 ${info.sha256.slice(0, 10).toUpperCase()})`));
    view.appendChild(r);
  }
  const keys = Object.keys(info.meta || {});
  if (!keys.length && !(info.top_tags || []).length) {
    view.appendChild(el('div', 'lora-note', 'This file has no training metadata (the trainer didn\'t save any, or it was stripped).'));
    out.appendChild(view);
    return;
  }
  // Summary grid
  const grid = el('div', 'lt-grid');
  for (const g of trainingSummary(info)) {
    const card = el('div', 'lt-card');
    card.appendChild(el('div', 'lt-card-title', g.title));
    for (const [k, v] of g.fields) {
      const r = el('div', 'lt-field');
      r.append(el('span', 'lt-k', k), el('span', 'lt-v', v!));
      card.appendChild(r);
    }
    grid.appendChild(card);
  }
  if (grid.childElementCount) view.appendChild(grid);
  // Comment / description
  const comment = info.meta.ss_training_comment || info.meta['modelspec.description'];
  if (comment) {
    const b = el('div', 'lt-block');
    b.append(el('div', 'lt-block-title', 'Comment'), el('div', 'lt-comment', comment));
    view.appendChild(b);
  }
  // Dataset folders
  const dirs = datasetDirs(info.meta);
  if (dirs.length) {
    const b = el('div', 'lt-block');
    b.appendChild(el('div', 'lt-block-title', 'Dataset folders'));
    for (const d of dirs) {
      const r = el('div', 'lt-dir');
      r.append(el('span', 'lt-dir-name', d.name),
        el('span', 'lora-strength', [d.images !== undefined ? `${d.images} images` : '', d.repeats !== undefined ? `× ${d.repeats} repeats` : ''].filter(Boolean).join(' ')));
      b.appendChild(r);
    }
    view.appendChild(b);
  }
  // Tags
  const tags = tagsBlock(info, opts);
  if (tags) view.appendChild(tags);
  // Every key
  if (keys.length) {
    const det = el('details', 'lt-raw');
    det.appendChild(el('summary', undefined, `All metadata (${keys.length} keys)`));
    const copyAll = smallBtn('Copy as JSON', 'Copy every metadata key (as stored in the file) as JSON', (b) => copy(JSON.stringify(info.meta, null, 2), opts, b));
    det.appendChild(copyAll);
    for (const k of keys.sort()) {
      const r = el('div', 'lt-raw-row');
      r.append(el('div', 'lt-raw-k', k), el('pre', 'lt-raw-v', prettyValue(info.meta[k])));
      det.appendChild(r);
    }
    view.appendChild(det);
  }
  out.appendChild(view);
}
