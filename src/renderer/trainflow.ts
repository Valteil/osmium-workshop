// Trainflow tab: trains an Anima LoRA from a dataset folder. All the work is
// in the main process (src/trainflow.ts); this module is the form, the
// start/stop buttons, and a 2s poll that shows the running job. The job is
// detached from the app, so this also reconnects to one that was started by
// an earlier session. Nothing is launched until Start Trainflow is pressed.

import { $ } from './dom';
import { getJSON, setJSON } from './storage';
import { showImageLightbox, showConfirmModal, toast } from './shared-ui';
import { writeBytes } from './fs-access';
import { convertAllWebpToPng } from './bucket-images';
import type { TrainflowSettings, TrainflowStatus, TrainflowDatasetCheck } from '../shared-types';
import type { Entry, DirHandle } from './types';

interface TrainflowDeps {
  getDirHandle: () => DirHandle | null;
  getEntries: () => Entry[];
  saveAllDirty: (silent?: boolean) => Promise<void>;
  // Save-or-cancel guard run before Start (Start reloads the dataset, which
  // would otherwise discard in-memory edits). index.ts owns the wording.
  guardUnsavedForReload: (actionLabel: string) => Promise<'proceed' | 'stop' | 'cancel'>;
  reload: () => Promise<void>;
}

const PATHS_KEY = 'dts-trainflow-dataset-paths';

const STORAGE_KEY = 'dts-trainflow-settings';
const POLL_MS = 2000;

const DEFAULTS: TrainflowSettings = {
  trigger: '', datasetPath: '', ditPath: '', qwenPath: '', vaePath: '',
  rank: 32, lr: '1.0', optimizer: 'Prodigy', steps: 2400, saveSteps: 300, sampleSteps: 300,
  batchSize: 1, gradAcc: 1, trainSeed: 42, bucketMin: 256, bucketMax: 1024, bucketStep: 64,
  prompt: '', negPrompt: 'worst quality, low quality, score_1, score_2, score_3, artist name',
  width: 1024, height: 1024, sampleGenSteps: 30, cfg: 4, sampleSeed: 42
};

// Element id <-> setting, for the plain inputs.
const TEXT_FIELDS: [keyof TrainflowSettings, string][] = [
  ['trigger', 'tfTrigger'], ['ditPath', 'tfDit'], ['qwenPath', 'tfQwen'], ['vaePath', 'tfVae'],
  ['lr', 'tfLr'], ['prompt', 'tfPrompt'], ['negPrompt', 'tfNeg']
];
const NUM_FIELDS: [keyof TrainflowSettings, string][] = [
  ['rank', 'tfRank'], ['steps', 'tfSteps'], ['saveSteps', 'tfSaveSteps'], ['sampleSteps', 'tfSampleSteps'],
  ['batchSize', 'tfBatch'], ['gradAcc', 'tfGradAcc'], ['width', 'tfWidth'], ['height', 'tfHeight'],
  ['sampleGenSteps', 'tfGenSteps'], ['cfg', 'tfCfg'], ['sampleSeed', 'tfSeed']
];

export function isTrainflowSupported(): boolean {
  return !!(window.electronAPI && window.electronAPI.trainflowStatus);
}

export function initTrainflow(deps: TrainflowDeps): void {
  const api = window.electronAPI;
  const tab = $('trainflowTab');
  const tabBtn = $('tabTrainflow');
  if (!isTrainflowSupported()) { tabBtn.style.display = 'none'; return; }

  let settings: TrainflowSettings = { ...DEFAULTS, ...getJSON<Partial<TrainflowSettings>>(STORAGE_KEY, {}) };
  let last: TrainflowStatus | null = null;
  let starting = false;
  let sampleSig = '';
  let ckptSig = '';
  const blobUrls = new Map<string, string>();

  const inputEl = (id: string) => $<HTMLInputElement>(id);
  const save = () => setJSON(STORAGE_KEY, settings);
  // One source for bucket sizes: the Bucket Images dock's own fields.
  const dockNum = (id: string, fallback: number) => Math.max(1, parseInt((document.getElementById(id) as HTMLInputElement | null)?.value || '', 10) || fallback);
  const bucketCfg = () => {
    const min = Math.max(64, dockNum('bucketSideMin', 256));
    return { min, max: Math.max(min, dockNum('bucketSideMax', 1024)), step: dockNum('bucketSideStep', 64) };
  };

  function fillForm(): void {
    for (const [k, id] of TEXT_FIELDS) inputEl(id).value = String(settings[k]);
    for (const [k, id] of NUM_FIELDS) inputEl(id).value = String(settings[k]);
    $<HTMLSelectElement>('tfOptimizer').value = settings.optimizer;
  }
  fillForm();

  for (const [k, id] of TEXT_FIELDS) {
    inputEl(id).addEventListener('input', () => {
      (settings as unknown as Record<string, unknown>)[k] = inputEl(id).value;
      save();
    });
  }
  for (const [k, id] of NUM_FIELDS) {
    inputEl(id).addEventListener('input', () => {
      const v = Number(inputEl(id).value);
      if (Number.isFinite(v)) { (settings as unknown as Record<string, unknown>)[k] = v; save(); }
    });
  }
  // Prodigy sets its own rate; AdamW wants a small one. Each keeps its own.
  let adamLr = '0.00005';
  $<HTMLSelectElement>('tfOptimizer').addEventListener('change', (ev) => {
    const opt = (ev.target as HTMLSelectElement).value as TrainflowSettings['optimizer'];
    if (opt === 'Prodigy') { if (settings.lr !== '1.0') adamLr = settings.lr; settings.lr = '1.0'; }
    else if (settings.lr === '1.0') settings.lr = adamLr;
    settings.optimizer = opt;
    inputEl('tfLr').value = settings.lr;
    save();
  });

  // ---- the loaded dataset ---------------------------------------------------
  // Trainflow trains whatever dataset Osmium has loaded. Osmium holds a folder
  // handle, not a path, so the real location is resolved once per open, in
  // this order (resolver, called after loadFolder() via __dtsDatasetOpened):
  //   1. Cache: the remembered path, accepted only if it still holds the
  //      dataset's first image (trainflow-path-ok). Keyed by name AND marker,
  //      so a renamed/replaced dataset never reuses a stale path.
  //   2. Marker probe: write a uniquely named file through the handle, ask the
  //      main process to find a same-named folder under likely roots that
  //      contains it. No prompt; the uuid makes a false match impossible.
  //   3. One confirm: only if 1 and 2 both fail. Uses a real-path folder
  //      dialog (trainflow-pick-path, i.e. dialog.showOpenDialog), NOT
  //      showDirectoryPicker, so Chromium's restricted-folder rule doesn't
  //      apply; the pick is re-checked against the marker.
  // getPathForFile is NOT used: verified on a picker handle it returns '' (T0).
  let datasetPath = '';
  const firstImage = () => deps.getEntries().find((x) => !x.disabled && !x.original);
  // Cache entries are keyed by name; each stores its marker so a different
  // dataset that happens to share the name can't inherit the old path.
  interface PathRec { path: string; marker: string; }
  const savedPaths = () => getJSON<Record<string, PathRec>>(PATHS_KEY, {});
  const askedThisSession = new Set<string>();
  const newMarker = () => `.osmium-probe-${(crypto as Crypto).randomUUID()}`;

  async function savedPathFor(name: string, marker: string): Promise<string> {
    const rec = savedPaths()[name];
    if (!rec || rec.marker !== marker) return '';
    const img = firstImage();
    return (await api.trainflowPathOk!(rec.path, img?.imgName)) ? rec.path : '';
  }
  function remember(name: string, marker: string, p: string): void {
    const map = savedPaths(); map[name] = { path: p, marker }; setJSON(PATHS_KEY, map);
  }
  // Stable per-dataset marker: the cache is keyed by name, and a dataset that
  // reopens keeps the same handle *name*, so the marker must persist too, or a
  // cached path would be rejected on every reopen. Stored alongside the path;
  // minted only the first time this dataset name is seen.
  function persistMarkerFor(name: string): string {
    const rec = savedPaths()[name];
    if (rec && rec.marker) return rec.marker;
    const m = newMarker();
    const map = savedPaths(); map[name] = { path: rec?.path || '', marker: m }; setJSON(PATHS_KEY, map);
    return m;
  }
  // Drop the marker file into the dataset folder and have main find it.
  async function probePath(dir: DirHandle, marker: string): Promise<string> {
    if (!api.trainflowFindByMarker) return '';
    try {
      const fh = await dir.getFileHandle(marker, { create: true });
      await writeBytes(fh as unknown as Parameters<typeof writeBytes>[0], 'osmium trainflow probe');
    } catch { return ''; }
    try {
      return (await api.trainflowFindByMarker(dir.name, marker)) || '';
    } finally {
      try { await (dir as unknown as { removeEntry(n: string): Promise<void> }).removeEntry(marker); } catch { /* gone or not permitted */ }
    }
  }
  async function resolveDataset(): Promise<string> {
    const dir = deps.getDirHandle();
    const nameEl = $('tfDatasetName'), locate = $('btnTfLocate');
    datasetPath = '';
    locate.style.display = 'none';
    if (!dir) { nameEl.textContent = 'No dataset loaded'; nameEl.title = ''; return ''; }
    marker = persistMarkerFor(dir.name);
    datasetPath = await savedPathFor(dir.name, marker);
    if (!datasetPath) { datasetPath = await probePath(dir, marker); if (datasetPath) remember(dir.name, marker, datasetPath); }
    nameEl.textContent = datasetPath ? `${dir.name} (${datasetPath})` : `${dir.name} (location unknown)`;
    nameEl.title = datasetPath;
    locate.style.display = datasetPath ? 'none' : '';
    return datasetPath;
  }
  // Current dataset's probe marker, so a manual locate() caches under the same
  // key the resolver used.
  let marker = '';
  // Pick the folder (real path) and accept it only if it really is this
  // dataset — proven by the same marker test the probe uses.
  async function locateDataset(): Promise<boolean> {
    const dir = deps.getDirHandle();
    if (!dir) return false;
    if (!marker) marker = persistMarkerFor(dir.name);
    const p = await api.trainflowPickPath!({ kind: 'folder', title: `Where is "${dir.name}" on your computer?` });
    if (!p) return false;
    if (!(await api.trainflowPathOk!(p, firstImage()?.imgName))) { toast("That folder doesn't contain this dataset's images."); return false; }
    remember(dir.name, marker, p);
    return true;
  }
  // Called after every dataset open (loadFolder), so Trainflow never has to ask later.
  (window as unknown as { __dtsDatasetOpened?: () => void }).__dtsDatasetOpened = () => {
    void (async () => {
      const dir = deps.getDirHandle();
      if (!dir || !firstImage()) return;
      if (await resolveDataset()) { if (tab.style.display !== 'none') void refreshDataset(); return; }
      if (askedThisSession.has(dir.name)) return;
      askedThisSession.add(dir.name);
      const ok = await showConfirmModal(`To train "${dir.name}" later, Trainflow needs to know where it is on your computer (Osmium can't see folder paths itself). Choose its folder now? You only do this once per dataset.`, { okLabel: 'Choose folder', cancelLabel: 'Later' });
      if (ok) await locateDataset();
      if (tab.style.display !== 'none') void refreshDataset();
    })();
  };
  $('btnTfLocate').addEventListener('click', async () => { if (await locateDataset()) await refreshDataset(); });
  async function runDatasetCheck(): Promise<TrainflowDatasetCheck | null> {
    const box = $('tfDatasetCheck');
    if (!datasetPath) { box.textContent = 'Load a dataset (images with matching .txt captions) to train it.'; return null; }
    const c = await api.trainflowCheckDataset!(datasetPath, bucketCfg());
    box.textContent = c.images
      ? `${c.images} images` + (c.unbucketed ? ` · ${c.unbucketed} will be bucketed when you start (originals go to original_images/)` : ' · all already bucketed') + (c.errors.length ? '\n' + c.errors.join('\n') : '')
      : c.errors.join('\n');
    box.style.whiteSpace = 'pre-wrap';
    return c;
  }
  async function refreshDataset(): Promise<void> { await resolveDataset(); await runDatasetCheck(); }

  async function pick(kind: 'folder' | 'file', title: string, current: string): Promise<string | null> {
    return api.trainflowPickPath!({ kind, title, defaultPath: current || undefined });
  }
  $('btnTfVerifyBuckets').addEventListener('click', async () => {
    const box = $('tfBucketReport');
    await resolveDataset();
    const dir = datasetPath;
    box.style.display = '';
    if (!dir) { box.textContent = 'Load a dataset first.'; return; }
    box.textContent = 'Checking…';
    const cfg = bucketCfg();
    const r = await api.trainflowVerifyBuckets!(dir, cfg);
    const lines = [`Bucket sizes for ${cfg.min}–${cfg.max} (step ${cfg.step}), as set in the Bucket Images dock:`];
    lines.push(r.buckets.map((b) => `${b.w}x${b.h}${b.count ? ' (' + b.count + ')' : ''}`).join('  ·  '));
    lines.push('');
    lines.push(`${r.images - r.offBucket.length}/${r.images} images are at a valid bucket size.`);
    if (r.offBucket.length) lines.push(`Not at a bucket size: ${r.offBucket.slice(0, 8).join(', ')}${r.offBucket.length > 8 ? ` and ${r.offBucket.length - 8} more` : ''}`);
    if (r.withoutOriginal) lines.push(`${r.withoutOriginal} image${r.withoutOriginal === 1 ? ' has' : 's have'} no copy in original_images/ yet.`);
    lines.push(r.toRebucket ? `Start Trainflow would bucket ${r.toRebucket} image${r.toRebucket === 1 ? '' : 's'}.` : 'Nothing to bucket: Start Trainflow would use the dataset as it is.');
    box.textContent = lines.join('\n');
  });
  $('btnTfDatasetOpen').addEventListener('click', () => void api.trainflowOpen!('dataset', datasetPath));
  tab.querySelectorAll<HTMLElement>('.tf-pick-file').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.target!;
      const p = await pick('file', btn.dataset.title || 'Choose a file', inputEl(id).value);
      if (!p) return;
      inputEl(id).value = p;
      inputEl(id).dispatchEvent(new Event('input'));
    });
  });
  $('btnTrainflowFolder').addEventListener('click', async () => { applyStatus(await api.trainflowPickFolder!()); });
  $('btnTrainflowOutput').addEventListener('click', () => void api.trainflowOpen!('output'));
  $('btnTrainflowLog').addEventListener('click', () => void api.trainflowOpen!('log'));

  // ---- start / stop --------------------------------------------------------
  function showErrors(errors: string[]): void {
    const box = $('trainflowErrors');
    box.style.display = errors.length ? '' : 'none';
    box.textContent = errors.join('\n');
  }
  $('btnTrainflowStart').addEventListener('click', async () => {
    if (starting) return;
    starting = true; showErrors([]);
    const btn = $<HTMLButtonElement>('btnTrainflowStart');
    btn.disabled = true;
    $('trainflowRunInfo').style.display = '';
    $('trainflowRunInfo').textContent = 'Checking your dataset, models and GPU…';
    const b = bucketCfg();
    // Start rewrites the dataset on disk (bucketing) and reloads it, so any
    // in-memory tag edits must be saved first — or the user is warned and can
    // cancel / save-and-stop. Only 'proceed' runs the reload afterwards.
    let reloadAfter = false;
    try {
      if (!(await resolveDataset())) { showErrors([deps.getDirHandle() ? 'Osmium couldn\'t find where the loaded dataset is on disk. Use Locate… next to it.' : 'Load a dataset first.']); return; }
      const guard = await deps.guardUnsavedForReload('starting Trainflow');
      if (guard !== 'proceed') return; // cancelled, or saved-but-stopped
      reloadAfter = true;
      // Any WebP is renamed to PNG before main touches the dataset: the trainer
      // (and the main-process bucketing decoder) can't read WebP.
      await convertAllWebpToPng();
      const r = await api.trainflowStart!({ ...settings, datasetPath, bucketMin: b.min, bucketMax: b.max, bucketStep: b.step });
      if (!r.ok) showErrors(r.errors || ['Could not start.']);
    } finally {
      starting = false;
      // Bucketing may have rewritten the dataset's files: show what's on disk now.
      if (reloadAfter) { try { await deps.reload(); } catch { /* no dataset loaded */ } }
      await refresh();
      void refreshDataset();
    }
  });
  $('btnTrainflowStop').addEventListener('click', async () => {
    $<HTMLButtonElement>('btnTrainflowStop').disabled = true;
    await api.trainflowStop!();
    await refresh();
  });

  // ---- status rendering ----------------------------------------------------
  const fmtSize = (n: number) => n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.round(n / 1024) + ' KB';

  function applyStatus(s: TrainflowStatus): void {
    last = s;
    $('trainflowFolder').textContent = s.folder || 'Not set';
    $('trainflowFolder').title = s.folder;
    const fs = $('trainflowFolderStatus');
    fs.style.display = s.ok ? 'none' : (s.folder ? '' : 'none');
    fs.textContent = s.error || '';
    const run = s.run;
    const running = run?.state === 'running';
    $<HTMLButtonElement>('btnTrainflowStart').disabled = running || starting || !s.ok;
    $<HTMLButtonElement>('btnTrainflowStop').disabled = !running;
    const info = $('trainflowRunInfo');
    const track = $('trainflowProgressTrack');
    const stats = $('trainflowStats');
    if (s.prep) {
      info.style.display = '';
      info.textContent = s.prep.message;
      track.style.display = s.prep.total ? '' : 'none';
      $('trainflowProgressFill').style.width = (s.prep.total ? Math.round((s.prep.done / s.prep.total) * 100) : 0) + '%';
    } else if (!run) {
      if (!starting) info.style.display = 'none';
      track.style.display = 'none'; stats.style.display = 'none';
      $('trainflowLog').textContent = 'Not started.';
    } else {
      const pct = run.total ? Math.min(100, Math.round((run.step / run.total) * 100)) : 0;
      const label = { running: run.step ? 'Training' : 'Preparing (caching latents and text encoder outputs)…', finished: 'Finished', stopped: 'Stopped', failed: 'Ended without finishing, see the log' }[run.state];
      info.style.display = '';
      info.textContent = `${run.project}: ${label}`;
      track.style.display = run.step || run.state === 'finished' ? '' : 'none';
      $('trainflowProgressFill').style.width = pct + '%';
      const bits = [`<span>Step <b>${run.step}/${run.total}</b> (${pct}%)</span>`];
      if (run.state === 'running') {
        if (run.speed) bits.push(`<span><b>${run.speed}</b></span>`);
        if (run.eta) bits.push(`<span>ETA <b>${run.eta}</b></span>`);
      }
      if (run.elapsed) bits.push(`<span>Elapsed <b>${run.elapsed}</b></span>`);
      if (run.loss !== undefined) bits.push(`<span>Loss <b>${run.loss.toFixed(4)}</b></span>`);
      stats.innerHTML = bits.join('');
      stats.style.display = run.step || run.state === 'finished' ? '' : 'none';
      const logEl = $('trainflowLog');
      const atBottom = logEl.scrollTop + logEl.clientHeight >= logEl.scrollHeight - 24;
      logEl.textContent = s.logTail.join('\n') || '…';
      if (atBottom) logEl.scrollTop = logEl.scrollHeight;
    }
    renderSamples(s);
    renderCheckpoints(s);
  }

  async function renderSamples(s: TrainflowStatus): Promise<void> {
    const sig = s.samples.map((x) => x.name + x.mtime).join('|');
    if (sig === sampleSig) return;
    sampleSig = sig;
    const box = $('trainflowPreviews');
    if (!s.samples.length) { box.innerHTML = '<div class="stats-empty">Previews appear here as training samples them.</div>'; return; }
    const frag = document.createDocumentFragment();
    for (const smp of s.samples) {
      const key = smp.name + smp.mtime;
      let url = blobUrls.get(key);
      if (!url) {
        const bytes = await api.trainflowGetSample!(smp.name);
        if (!bytes) continue;
        url = URL.createObjectURL(new Blob([bytes as BlobPart]));
        blobUrls.set(key, url);
      }
      const img = document.createElement('img');
      img.src = url; img.title = smp.name; img.loading = 'lazy';
      const u = url;
      img.addEventListener('click', () => showImageLightbox(u));
      frag.appendChild(img);
    }
    if (sig !== sampleSig) return; // a newer listing arrived while images loaded
    box.replaceChildren(frag);
  }

  function renderCheckpoints(s: TrainflowStatus): void {
    const sig = s.checkpoints.map((x) => x.name + x.size).join('|');
    if (sig === ckptSig) return;
    ckptSig = sig;
    const box = $('trainflowCheckpoints');
    if (!s.checkpoints.length) { box.innerHTML = '<div class="stats-empty">None yet.</div>'; return; }
    box.replaceChildren(...s.checkpoints.map((c) => {
      const row = document.createElement('div');
      row.className = 'wd14-local-model-row';
      const name = document.createElement('span'); name.textContent = c.name;
      const size = document.createElement('span'); size.textContent = fmtSize(c.size);
      row.append(name, size);
      return row;
    }));
  }

  async function refresh(): Promise<void> {
    try { applyStatus(await api.trainflowStatus!()); } catch { /* main busy or gone; next tick */ }
  }
  const tabVisible = () => tab.style.display !== 'none';
  setInterval(() => { if (tabVisible() && !document.hidden) void refresh(); }, POLL_MS);

  // index.ts calls this when the tab is switched to, so it never shows stale progress.
  (window as unknown as { __dtsTrainflowShown?: () => void }).__dtsTrainflowShown = () => { void refresh(); void refreshDataset(); };
  void refresh();
  void last;
}
