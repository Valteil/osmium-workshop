// Phase B module: WD14 Autotagger bridge to a local ComfyUI instance.
// On desktop, all the actual HTTP work (upload/image, /prompt, /history
// polling) happens in main.ts over IPC — see its "WD14 Autotagger (ComfyUI
// bridge)" section for why that can't be a plain renderer-side fetch()
// there (Electron's browser-style CORS/Origin enforcement). Mobile has no
// main/renderer split to relay through, so it uses comfy-client.ts's direct
// fetch() implementation instead — same protocol, ported 1:1, just running
// in the renderer since there's nowhere else for it to run. This module
// only owns: persisted settings (Tag Overseer's "WD14 Autotagger" section is the
// single home for all of them, per project convention — no duplicate
// settings live in the per-image 3-dot menu, which just triggers tagging
// using whatever's configured here), the bulk trigger wired to
// master-tag-control.ts's existing multi-select set, a single-image
// entry point view.ts's 3-dot menu calls directly, and the optional
// review-before-apply step.
import type { Entry } from './types';
import { getJSON, setJSON } from './storage';
import {
  btnWd14TagSelected, wd14Status, wd14AutoApply, wd14Host, wd14ModelSelect,
  btnWd14RefreshModels, wd14Threshold, wd14CharThreshold,
  wd14TrailingComma, wd14ExcludeTags,
  wd14ModeRow, wd14ModeSelect, wd14ComfyuiFields, wd14LocalFields, wd14LocalModelSelect,
  wd14LocalModelList, wd14LocalCatalog, wd14LocalAddRepo,
  btnWd14LocalDownload, wd14LocalDownloadStatus, btnWd14LocalImport
} from './dom';
import { toast, showConfirmModal, createModalShell } from './shared-ui';
import { trackStat, checkAchievements, folderStats, saveFolderStats } from './achievements';
import { markDirty, recordChange } from './tags-edit';
import { masterSelectedImages, renderMasterSelectionSummary } from './master-tag-control';
import { comfyGetModels, comfyTagImage } from './comfy-client';
import { setIconLabel } from './icons';
// Side-effect only: sets window.Wd14Local on desktop (onnxruntime-node via
// main-process IPC) before hasLocalWd14 below reads it — same "import
// before the const that depends on its side effect" ordering comfy-
// client.ts's own import above relies on for window.electronAPI.synthdat*.
import './wd14-local-bridge';

// Whether desktop's real IPC-backed ComfyUI bridge exists — mobile falls
// through to comfy-client.ts's direct fetch() below wherever this is false.
const hasElectronComfy = !!(window.electronAPI && window.electronAPI.wd14GetModels);

interface Wd14Settings {
  host: string;
  model: string;
  threshold: number;
  characterThreshold: number;
  trailingComma: boolean;
  excludeTags: string;
  autoApply: boolean;
  mode: string;
  localModel: string;
  gpu: boolean;
}

interface Wd14ReviewRow {
  entry: Entry;
  mergedTags: string[];
}

interface Wd14AcceptedRow {
  entry: Entry;
  tags: string[];
}

interface ResolvedRepo {
  name: string;
  modelUrl: string;
  tagsUrl: string;
}

const SETTINGS_KEY = 'dts-wd14-settings';
// mode/localModel only matter where window.Wd14Local exists (mobile, with
// the local-WD14 native plugin) — 'local' is the default THERE specifically
// because ComfyUI-over-network isn't built for mobile at all yet (see
// notes/Mobile-Port.md), so it's the only mode that can actually work out
// of the box. Desktop never sees the mode toggle at all (hidden — see
// applySettingsToUI()) and always behaves exactly as before.
const DEFAULT_SETTINGS = {
  host: 'http://127.0.0.1:8188',
  model: '',
  threshold: 0.35,
  characterThreshold: 0.85,
  trailingComma: false,
  excludeTags: '',
  autoApply: false,
  mode: 'comfyui',
  localModel: '',
  gpu: true
};

let settings: Wd14Settings = { ...DEFAULT_SETTINGS };
let getEntries: () => Entry[] = () => [];
let refreshAllUIRef: () => void = () => {};
let cancelRequested = false;
let running = false;
let lastProvider: string | null = null;

// The GPU checkbox lives in the desktop settings markup only (mobile's
// forked panel has no equivalent — its native plugin already manages its own
// NNAPI/CPU path, and the extra payload field is simply ignored there).
function gpuCheckbox(): HTMLInputElement | null {
  return document.getElementById('wd14Gpu') as HTMLInputElement | null;
}

function loadSettings(){
  // Base defaults depend on whether local WD14 is even possible on this
  // platform — mobile (hasLocalWd14) defaults straight to 'local' since
  // ComfyUI-over-network isn't built for mobile at all (see
  // notes/Mobile-Port.md), so 'comfyui' would otherwise be a dead default
  // nothing on mobile can use. Only applies the FIRST time (no saved
  // settings yet) — an explicit saved `mode` always wins over this.
  const base = { ...DEFAULT_SETTINGS, mode: hasLocalWd14 ? 'local' : 'comfyui' };
  settings = { ...base };
  const saved = getJSON<Partial<Wd14Settings> | null>(SETTINGS_KEY, null);
  if (saved && typeof saved === 'object') settings = { ...base, ...saved };
}

function saveSettings(){
  setJSON(SETTINGS_KEY, settings);
}

// Whether local mode is even offered — true on mobile (DtsWd14Plugin.kt)
// and on desktop (wd14-local-bridge.ts, imported above, wraps onnxruntime-
// node running in the main process). False only if neither backend set
// window.Wd14Local at all, in which case the whole mode row/local-fields
// block just stays hidden.
const hasLocalWd14 = !!window.Wd14Local;

function applySettingsToUI(){
  wd14Host.value = settings.host;
  wd14Threshold.value = String(settings.threshold);
  wd14CharThreshold.value = String(settings.characterThreshold);
  wd14TrailingComma.checked = !!settings.trailingComma;
  wd14ExcludeTags.value = settings.excludeTags;
  wd14AutoApply.checked = !!settings.autoApply;
  const gpuEl = gpuCheckbox();
  if (gpuEl) gpuEl.checked = settings.gpu !== false;
  if (settings.model){
    if (![...wd14ModelSelect.options].some(o => o.value === settings.model)){
      const opt = document.createElement('option');
      opt.value = settings.model;
      opt.textContent = settings.model;
      wd14ModelSelect.appendChild(opt);
    }
    wd14ModelSelect.value = settings.model;
  }

  wd14ModeRow.style.display = hasLocalWd14 ? '' : 'none';
  if (hasLocalWd14){
    wd14ModeSelect.value = settings.mode;
    wd14ComfyuiFields.style.display = settings.mode === 'local' ? 'none' : '';
    wd14LocalFields.style.display = settings.mode === 'local' ? '' : 'none';
  }
}

async function refreshModels(silent: boolean): Promise<void> {
  const host = wd14Host.value.trim() || DEFAULT_SETTINGS.host;
  const res = hasElectronComfy
    ? await window.electronAPI.wd14GetModels(host)
    : await comfyGetModels(host);
  if (!res.ok){
    if (!silent) toast(res.error || 'Could not fetch the model list from ComfyUI.', 4200);
    return;
  }
  const current = wd14ModelSelect.value || settings.model;
  wd14ModelSelect.innerHTML = '';
  const models = res.models || [];
  for (const m of models){
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    wd14ModelSelect.appendChild(opt);
  }
  if (current && models.includes(current)) wd14ModelSelect.value = current;
  if (!silent) toast(`Loaded ${models.length} model(s) from ComfyUI.`, 2400);
}

function readSettingsFromUI(){
  settings = {
    host: wd14Host.value.trim() || DEFAULT_SETTINGS.host,
    model: wd14ModelSelect.value,
    threshold: parseFloat(wd14Threshold.value) || 0,
    characterThreshold: parseFloat(wd14CharThreshold.value) || 0,
    trailingComma: wd14TrailingComma.checked,
    excludeTags: wd14ExcludeTags.value,
    autoApply: wd14AutoApply.checked,
    mode: hasLocalWd14 ? wd14ModeSelect.value : 'comfyui',
    localModel: hasLocalWd14 ? wd14LocalModelSelect.value : '',
    gpu: gpuCheckbox() ? gpuCheckbox()!.checked : settings.gpu !== false
  };
  saveSettings();
  if (hasLocalWd14){
    wd14ComfyuiFields.style.display = settings.mode === 'local' ? 'none' : '';
    wd14LocalFields.style.display = settings.mode === 'local' ? '' : 'none';
  }
}

// WD14's raw output is a comma-separated string with `(`/`)` escaped as
// `\(`/`\)` (its own convention, meant for prompt syntax) and underscores
// in place of spaces. This app's tag storage is always space-separated,
// one-way (see CLAUDE.md Data Flow) — so normalize here unconditionally.
export function parseWd14Tags(tagsCsv: string): string[] {
  if (!tagsCsv) return [];
  return tagsCsv
    .split(',')
    .map(t => t.replace(/\\\(/g, '(').replace(/\\\)/g, ')').replace(/_/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

// `progressFraction` (0-1, or omitted) drives a small visual bar alongside
// the existing "Tagging 3/8 — filename…" status text — local on-device
// inference is slow enough per-image (unlike the async ComfyUI round-trip,
// this blocks on real on-phone compute) that a plain text counter wasn't
// enough of a "this is actually moving" signal.
function setStatus(text: string, progressFraction?: number): void {
  if (!text){ wd14Status.style.display = 'none'; return; }
  wd14Status.style.display = 'block';
  wd14Status.querySelector('span')!.textContent = text;
  const fill = wd14Status.querySelector('.wd14-progress-fill') as HTMLElement | null;
  if (fill) fill.style.width = (progressFraction == null ? 0 : Math.round(progressFraction * 100)) + '%';
}

async function tagOneWithRetry(entry: Entry): Promise<string | null> {
  while (true){
    if (cancelRequested) return null;
    let bytes;
    try {
      const file = await entry.imgHandle.getFile();
      bytes = new Uint8Array(await file.arrayBuffer());
    } catch(err){
      toast(`Could not read ${entry.imgName} off disk — skipping.`, 3600);
      return null;
    }
    const res = (hasLocalWd14 && settings.mode === 'local')
      ? await window.Wd14Local!.tagImage({
          name: settings.localModel,
          imageBytes: bytes,
          threshold: settings.threshold,
          characterThreshold: settings.characterThreshold,
          preferGpu: settings.gpu !== false
        })
      : hasElectronComfy
        ? await window.electronAPI.wd14TagImage({
            host: settings.host,
            filename: entry.imgName || entry.base,
            imageBytes: bytes,
            settings
          })
        : await comfyTagImage({ host: settings.host, filename: entry.imgName || entry.base, imageBytes: bytes, settings });
    if (res.ok) {
      const provider = (res as { provider?: string }).provider;
      if (provider) lastProvider = provider;
      return res.tagsCsv || null;
    }
    const retry = await showConfirmModal(
      `${res.error || 'WD14 tagging failed.'}\n\nImage: ${entry.imgName}`,
      { okLabel: 'Retry', cancelLabel: 'Skip this image', danger: true }
    );
    if (!retry) return null;
  }
}

// Builds the review UI: one row per successfully-tagged image, thumbnail +
// an editable comma-list of the merged (existing + new) tags, so "manually
// approve" means "review and tweak the exact tag list", not just a yes/no
// per image. Resolves with the accepted {entry, tags}[] list, or null if
// the whole batch was cancelled.
function showWd14ReviewModal(rows: Wd14ReviewRow[]): Promise<Wd14AcceptedRow[] | null> {
  return new Promise<Wd14AcceptedRow[] | null>((resolve) => {
    const { box, close: teardown } = createModalShell({ boxClassName: 'wd14-review-box', onDismiss: () => close(null) });

    const msg = document.createElement('div');
    msg.className = 'confirm-message';
    msg.textContent = `Review WD14 tags for ${rows.length} image(s) before applying. Edit any row, or uncheck to skip it.`;
    box.appendChild(msg);

    const list = document.createElement('div');
    list.className = 'wd14-review-list';
    const rowState = rows.map(r => ({ ...r, include: true, textEl: null as HTMLTextAreaElement | null, tagChips: [] as { tag: string; checked: boolean }[] }));

    const isTouchDevice = document.documentElement.classList.contains('touch-device');

    for (const rs of rowState){
      const rowEl = document.createElement('div');
      rowEl.className = 'wd14-review-row';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = true;
      cb.addEventListener('change', () => { rs.include = cb.checked; rowEl.classList.toggle('excluded', !cb.checked); });
      rowEl.appendChild(cb);
      const img = document.createElement('img');
      img.src = rs.entry.objectUrl;
      img.loading = 'lazy';
      rowEl.appendChild(img);
      const colWrap = document.createElement('div');
      colWrap.className = 'wd14-review-col';
      const label = document.createElement('div');
      label.className = 'wd14-review-name';
      label.textContent = rs.entry.imgName || rs.entry.base;
      colWrap.appendChild(label);
      if (isTouchDevice){
        // A raw comma-list textarea is fine to hand-edit with a mouse, but
        // fiddly on a phone keyboard for what's usually a 20-40 tag list —
        // per-tag chips instead: a checkbox toggles a tag in/out (reversible
        // while still reviewing, same as before), × drops it from the row
        // entirely (not just unchecked — gone, same distinction the SynthDat
        // pending-tag card already uses). rs.tagChips backs getTags() below
        // instead of reading a single textarea's value.
        rs.tagChips = rs.mergedTags.map(tag => ({ tag, checked: true }));
        const chipList = document.createElement('div');
        chipList.className = 'wd14-review-chips';
        function renderChips(){
          chipList.innerHTML = '';
          for (const chip of rs.tagChips){
            const chipEl = document.createElement('label');
            chipEl.className = 'wd14-review-chip' + (chip.checked ? '' : ' unchecked');
            const chipCb = document.createElement('input');
            chipCb.type = 'checkbox';
            chipCb.checked = chip.checked;
            chipCb.addEventListener('change', () => { chip.checked = chipCb.checked; chipEl.classList.toggle('unchecked', !chip.checked); });
            chipEl.appendChild(chipCb);
            const chipText = document.createElement('span');
            chipText.textContent = chip.tag;
            chipEl.appendChild(chipText);
            const dropBtn = document.createElement('button');
            dropBtn.type = 'button';
            dropBtn.className = 'wd14-review-chip-drop';
            dropBtn.textContent = '×';
            dropBtn.title = `Drop "${chip.tag}" from this image's tags`;
            dropBtn.addEventListener('click', (ev) => {
              ev.preventDefault();
              rs.tagChips = rs.tagChips.filter(c => c !== chip);
              renderChips();
            });
            chipEl.appendChild(dropBtn);
            chipList.appendChild(chipEl);
          }
        }
        renderChips();
        colWrap.appendChild(chipList);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = rs.mergedTags.join(', ');
        colWrap.appendChild(textarea);
        rs.textEl = textarea;
      }
      rowEl.appendChild(colWrap);
      list.appendChild(rowEl);
    }
    box.appendChild(list);

    const btnRow = document.createElement('div');
    btnRow.className = 'confirm-btn-row';
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    const okBtn = document.createElement('button');
    okBtn.className = 'primary';
    okBtn.textContent = 'Apply checked rows';
    function close(result: Wd14AcceptedRow[] | null): void {
      teardown();
      resolve(result);
    }
    cancelBtn.addEventListener('click', () => close(null));
    okBtn.addEventListener('click', () => {
      const accepted = rowState.filter(rs => rs.include).map(rs => ({
        entry: rs.entry,
        tags: isTouchDevice
          ? rs.tagChips.filter(c => c.checked).map(c => c.tag)
          : rs.textEl!.value.split(',').map(t => t.replace(/_/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean)
      }));
      close(accepted);
    });
    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(okBtn);
    box.appendChild(btnRow);
  });
}

function commitTags(accepted: Wd14AcceptedRow[]): void {
  const affected: { base: string; prevTags: string[]; newTags: string[] }[] = [];
  for (const { entry, tags } of accepted){
    const prevTags = entry.tags.slice();
    const newTags = Array.from(new Set(tags));
    if (newTags.length === prevTags.length && newTags.every((t, i) => t === prevTags[i])) continue;
    entry.tags = newTags;
    markDirty(entry);
    affected.push({ base: entry.base, prevTags, newTags: newTags.slice() });
  }
  if (affected.length === 0){ toast('No tag changes to apply.'); return; }
  const summary = `WD14-tagged ${affected.length} image(s).`;
  toast(summary);
  recordChange('add-tag', summary, affected);
  folderStats.master_ops = (folderStats.master_ops || 0) + 1;
  trackStat('wd14_images_tagged', affected.length);
  saveFolderStats();
  refreshAllUIRef();
  checkAchievements();
}

async function runBatch(entries: Entry[]): Promise<void> {
  if (running){
    cancelRequested = true;
    return;
  }
  if (entries.length === 0){
    toast('Select at least one image first (or right-click a single image and choose "Tag with WD14").');
    return;
  }
  const usingLocal = hasLocalWd14 && settings.mode === 'local';
  if (usingLocal && !settings.localModel){
    toast('Pick (or download) a local WD14 model first in WD14 settings.');
    return;
  }
  if (!usingLocal && !settings.model){
    toast('Pick a WD14 model first — use the 🔄 button in WD14 settings to load the list from ComfyUI.');
    return;
  }
  running = true;
  cancelRequested = false;
  lastProvider = null;
  setIconLabel(btnWd14TagSelected, '⏹ Cancel tagging');
  const results: Wd14ReviewRow[] = [];
  let failCount = 0;
  for (let i = 0; i < entries.length; i++){
    if (cancelRequested) break;
    const entry = entries[i];
    setStatus(`Tagging ${i + 1}/${entries.length} — ${entry.imgName}…`, i / entries.length);
    const tagsCsv = await tagOneWithRetry(entry);
    if (tagsCsv == null){ failCount++; continue; }
    const fresh = parseWd14Tags(tagsCsv);
    const mergedTags = entry.tags.concat(fresh.filter(t => !entry.tags.includes(t)));
    results.push({ entry, mergedTags });
  }
  const failNote = failCount > 0 ? ` (${failCount} skipped)` : '';
  const engineNote = lastProvider ? ` — on ${lastProvider === 'dml' ? 'GPU' : 'CPU'}` : '';
  setStatus('');
  running = false;
  setIconLabel(btnWd14TagSelected, '🐍 Tag selected images with WD14');

  if (cancelRequested && results.length === 0){
    toast('WD14 tagging cancelled.');
    return;
  }
  if (results.length === 0){
    toast(`Could not tag any of the ${entries.length} image(s).`);
    return;
  }
  if (settings.autoApply){
    commitTags(results.map(r => ({ entry: r.entry, tags: r.mergedTags })));
    toast(`Applied WD14 tags to ${results.length} image(s)${failNote}${engineNote}.`);
  } else {
    const accepted = await showWd14ReviewModal(results);
    if (!accepted || accepted.length === 0){ toast('WD14 tagging discarded — nothing was applied.'); return; }
    commitTags(accepted);
    if (engineNote) toast(`Applied WD14 tags to ${accepted.length} image(s)${engineNote}.`);
  }
}

export function tagSingleImageWithWd14(entry: Entry): void {
  if (running){ toast('A WD14 batch is already running.'); return; }
  runBatch([entry]);
}

// A small built-in catalog of well-known WD14 tagger repos (SmilingWolf's
// actively-maintained v3 taggers — the de facto standard everyone exports
// WD14 ONNX models from) so most people never need to go find/paste a repo
// URL themselves. Manual input (resolveHfRepo() below) stays available for
// anything not on this short list.
const KNOWN_MODELS = [
  { repo: 'SmilingWolf/wd-vit-tagger-v3', label: 'ViT v3', desc: 'Smallest/fastest of this set.' },
  { repo: 'SmilingWolf/wd-convnext-tagger-v3', label: 'ConvNext v3', desc: 'Good size/accuracy balance.' },
  { repo: 'SmilingWolf/wd-swinv2-tagger-v3', label: 'SwinV2 v3', desc: 'Strong accuracy, moderate size.' },
  { repo: 'SmilingWolf/wd-vit-large-tagger-v3', label: 'ViT Large v3', desc: 'Higher accuracy, larger download.' },
  { repo: 'SmilingWolf/wd-eva02-large-tagger-v3', label: 'EVA02 Large v3', desc: 'Highest accuracy of this set, largest/slowest.' }
];

// Accepts either the bare "owner/repo" shorthand or a full HuggingFace URL
// (any of huggingface.co/owner/repo, .../tree/main, .../blob/main/x —
// anything with owner/repo as its first two path segments) and resolves it
// to that repo's raw-file download URLs for the two files SmilingWolf's
// WD14 tagger repos always publish at their root: model.onnx and
// selected_tags.csv. Only handles the standard repo layout — a repo that
// nests these files in a subfolder isn't supported here.
function resolveHfRepo(input: string): ResolvedRepo | null {
  let path = input.trim().replace(/^https?:\/\/(huggingface\.co|hf\.co)\//i, '');
  path = path.replace(/^\/+|\/+$/g, '');
  const segments = path.split('/').filter(Boolean);
  if (segments.length < 2) return null;
  const repo = `${segments[0]}/${segments[1]}`;
  return {
    name: segments[1],
    modelUrl: `https://huggingface.co/${repo}/resolve/main/model.onnx`,
    tagsUrl: `https://huggingface.co/${repo}/resolve/main/selected_tags.csv`
  };
}

async function refreshLocalModels(): Promise<void> {
  if (!hasLocalWd14) return;
  const models = await window.Wd14Local!.listModels();
  const current = wd14LocalModelSelect.value || settings.localModel;
  wd14LocalModelSelect.innerHTML = '';
  if (models.length === 0){
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = '(no models downloaded yet)';
    wd14LocalModelSelect.appendChild(opt);
  } else {
    for (const m of models){
      const opt = document.createElement('option');
      opt.value = m.name;
      opt.textContent = `${m.name} (${m.tagCount || 0} tags, ${Math.round((m.sizeBytes || 0)/1e6)}MB)`;
      wd14LocalModelSelect.appendChild(opt);
    }
    if (current && models.some(m => m.name === current)) wd14LocalModelSelect.value = current;
  }
  wd14LocalModelList.innerHTML = '';
  for (const m of models){
    const row = document.createElement('div');
    row.className = 'wd14-local-model-row';
    const label = document.createElement('span');
    label.textContent = `${m.name} — ${m.tagCount || 0} tags, ${Math.round((m.sizeBytes || 0)/1e6)}MB`;
    row.appendChild(label);
    const delBtn = document.createElement('button');
    delBtn.className = 'danger-ghost';
    setIconLabel(delBtn, '✕');
    delBtn.title = 'Delete this downloaded model';
    delBtn.addEventListener('click', async () => {
      await window.Wd14Local!.deleteModel(m.name);
      if (settings.localModel === m.name){ settings.localModel = ''; saveSettings(); }
      refreshLocalModels();
    });
    row.appendChild(delBtn);
    wd14LocalModelList.appendChild(row);
  }
}

// Shared by both the catalog's one-tap buttons and the manual-repo Download
// button below — same download call, same progress/status wiring either
// way, just a different source for {name, modelUrl, tagsUrl} and which
// button gets disabled while it runs.
async function downloadRepo(resolved: ResolvedRepo, triggerBtn: HTMLButtonElement): Promise<void> {
  const { name, modelUrl, tagsUrl } = resolved;
  const existing = await window.Wd14Local!.listModels();
  if (existing.some(m => m.name === name)){
    const ok = await showConfirmModal(
      `"${name}" is already downloaded. Download it again? This overwrites the existing copy.`,
      { okLabel: 'Redownload' }
    );
    if (!ok) return;
  }
  triggerBtn.disabled = true;
  wd14LocalDownloadStatus.style.display = 'block';
  wd14LocalDownloadStatus.textContent = `Starting download of "${name}"…`;
  try {
    await window.Wd14Local!.downloadModel({ name, modelUrl, tagsUrl }, (ev) => {
      wd14LocalDownloadStatus.textContent = `Downloading "${name}" — ${ev.part}… ${ev.percent}%`;
    });
    toast(`Downloaded "${name}".`);
    settings.localModel = name;
    saveSettings();
    await refreshLocalModels();
    wd14LocalModelSelect.value = name;
  } catch(e){
    toast(`Download failed: ${(e as Error)?.message || e}`, 4200);
  } finally {
    triggerBtn.disabled = false;
    wd14LocalDownloadStatus.style.display = 'none';
  }
}

// Desktop-only (window.Wd14Local.pickImportFiles doesn't exist on mobile) —
// for a user who already has a WD14 .onnx/.csv pair somewhere on disk (their
// own ComfyUI-WD14-Tagger install's models/ folder, most commonly) so they
// don't have to re-download the same model a second time just to tag
// on-device. Shares downloadRepo()'s own collision-confirm UX rather than
// duplicating it, since importModel() overwrites unconditionally same as
// downloadModel() does.
async function importFromDisk(triggerBtn: HTMLButtonElement): Promise<void> {
  let picked: Awaited<ReturnType<NonNullable<NonNullable<typeof window.Wd14Local>['pickImportFiles']>>>;
  try { picked = await window.Wd14Local!.pickImportFiles!(); }
  catch(e){ toast(`Could not import: ${(e as Error)?.message || e}`, 4200); return; }
  if ('canceled' in picked && picked.canceled) return;
  const { name, modelPath, tagsPath } = picked as { name: string; modelPath: string; tagsPath: string };
  const existing = await window.Wd14Local!.listModels();
  if (existing.some(m => m.name === name)){
    const ok = await showConfirmModal(
      `"${name}" is already downloaded. Import this copy over it? This overwrites the existing copy.`,
      { okLabel: 'Overwrite' }
    );
    if (!ok) return;
  }
  triggerBtn.disabled = true;
  try {
    await window.Wd14Local!.importModel!({ name, modelPath, tagsPath });
    toast(`Imported "${name}".`);
    settings.localModel = name;
    saveSettings();
    await refreshLocalModels();
    wd14LocalModelSelect.value = name;
  } catch(e){
    toast(`Import failed: ${(e as Error)?.message || e}`, 4200);
  } finally {
    triggerBtn.disabled = false;
  }
}

function renderLocalCatalog(){
  wd14LocalCatalog.innerHTML = '';
  for (const entry of KNOWN_MODELS){
    const row = document.createElement('div');
    row.className = 'wd14-local-model-row';
    const label = document.createElement('span');
    label.textContent = `${entry.label} — ${entry.desc}`;
    row.appendChild(label);
    const dlBtn = document.createElement('button');
    dlBtn.className = 'primary';
    setIconLabel(dlBtn, '⬇');
    dlBtn.title = `Download ${entry.repo}`;
    dlBtn.addEventListener('click', () => downloadRepo(resolveHfRepo(entry.repo)!, dlBtn));
    row.appendChild(dlBtn);
    wd14LocalCatalog.appendChild(row);
  }
}

interface Wd14TaggerDeps {
  getEntries: () => Entry[];
  refreshAllUI: () => void;
}

export function initWd14Tagger(deps: Wd14TaggerDeps): void {
  getEntries = deps.getEntries;
  refreshAllUIRef = deps.refreshAllUI;

  loadSettings();
  applySettingsToUI();
  refreshModels(true);

  [wd14Host, wd14Threshold, wd14CharThreshold, wd14TrailingComma, wd14ExcludeTags, wd14AutoApply, wd14ModelSelect]
    .forEach(el => el.addEventListener('change', readSettingsFromUI));

  btnWd14RefreshModels.addEventListener('click', () => refreshModels(false));

  if (hasLocalWd14){
    wd14ModeSelect.addEventListener('change', readSettingsFromUI);
    wd14LocalModelSelect.addEventListener('change', readSettingsFromUI);
    refreshLocalModels();
    renderLocalCatalog();

    btnWd14LocalDownload.addEventListener('click', async () => {
      const resolved = resolveHfRepo(wd14LocalAddRepo.value);
      if (!resolved){ toast('Enter a HuggingFace repo, e.g. SmilingWolf/wd-swinv2-tagger-v3.'); return; }
      await downloadRepo(resolved, btnWd14LocalDownload);
      wd14LocalAddRepo.value = '';
    });

    // Desktop only — see importFromDisk()'s own comment.
    if (window.Wd14Local!.pickImportFiles){
      btnWd14LocalImport.style.display = '';
      btnWd14LocalImport.addEventListener('click', () => importFromDisk(btnWd14LocalImport));
    }
  }

  btnWd14TagSelected.addEventListener('click', () => {
    if (running) { cancelRequested = true; return; }
    const entries = getEntries().filter(e => masterSelectedImages.has(e.base) && !e.disabled && !e.meta?.locked);
    runBatch(entries);
  });
}
