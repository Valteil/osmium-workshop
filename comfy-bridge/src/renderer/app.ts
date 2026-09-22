// Comfy Bridge renderer — the generation half of Osmium Workshop's
// SynthDat Overseer, without the dataset: no tag card, no Accept/Reject,
// every finished generation (both passes, if 2-Pass ran) is written
// straight to a user-picked output folder, optionally upscaled by model
// first. Prompt-building logic (node ids, field mapping, LoRA stack
// chaining, ControlNet skip) is copied from
// `../../src/renderer/synthdat-overseer.ts`'s `buildPromptFromFields()` —
// same fixed workflow template, so the node ids must match exactly.

import {
  initTheme, mountThemePicker, THEMES, DEFAULT_THEME
} from './shared';
export {};

interface ElectronAPI {
  getAppVersion(): Promise<string>;
  pickOutputFolder(): Promise<{ ok: boolean; path?: string }>;
  importWorkflow(): Promise<{ ok: boolean; cancelled?: boolean; error?: string; prompt?: Record<string, any> }>;
  saveImage(payload: { folder: string; filename: string; bytes: Uint8Array }): Promise<{ ok: boolean; error?: string }>;
  listPresets(): Promise<{ ok: boolean; promptPresetNames?: string[]; negativePresetNames?: string[]; error?: string }>;
  savePreset(payload: { kind: 'prompt' | 'negative'; name: string; value: unknown }): Promise<{ ok: boolean; error?: string }>;
  loadPreset(payload: { kind: 'prompt' | 'negative'; name: string }): Promise<{ ok: boolean; value?: unknown; error?: string }>;
  deletePreset(payload: { kind: 'prompt' | 'negative'; name: string }): Promise<{ ok: boolean; error?: string }>;
  synthdatGetObjectInfo(payload: { host: string; classType: string; inputName: string }): Promise<{ ok: boolean; values?: string[]; error?: string }>;
  synthdatQueueAndFetch(payload: { host: string; imageFilename: string | null; imageBytes: Uint8Array | null; prompt: any }): Promise<{ ok: boolean; imageBytes?: Uint8Array; pass1ImageBytes?: Uint8Array; upscaledImageBytes?: Uint8Array; error?: string; interrupted?: boolean; saveRel?: string; pass1SaveRel?: string; upscaledSaveRel?: string }>;
  synthdatStopGeneration(host: string): Promise<{ ok: boolean }>;
  galleryListDir(payload: { folder: string; relDir: string }): Promise<{ ok: boolean; entries?: { name: string; kind: 'file' | 'directory'; mtime?: number }[]; error?: string }>;
  galleryRead(payload: { folder: string; relPath: string }): Promise<{ ok: boolean; base64?: string; mime?: string; error?: string }>;
  comfyFetchLogs(payload: { host: string }): Promise<{ ok: boolean; entries?: { t: string; m: string }[]; error?: string }>;
  onPreviewFrame(callback: (event: unknown, data: { mime: string; bytes: Uint8Array }) => void): void;
  onGenProgress(callback: (event: unknown, data: { value: number; max: number }) => void): void;
  onComfyLog(callback: (event: unknown, entries: { t: string; m: string }[]) => void): void;
}
declare global { interface Window { electronAPI: ElectronAPI; } }
export {};

import {
  mountGallerySidebar, attachPickerModal, optionsFromDatalist,
  showImageLightbox, nextFileNumber, bytesToBase64, base64ToBytes
} from './shared/index';
import type { StorageBackend, DirEntry } from './shared/storage';
import { buildSynthDatPrompt } from '../comfy-core';

function $<T extends HTMLElement>(id: string): T { return document.getElementById(id) as T; }

// ---------------- Auto-expanding textareas ----------------
// Prompt fields are never manually resizable — they grow with their content
// instead, so a long prompt is never cramped into a fixed-height box. Typed
// input is caught by the delegated 'input' listener; anywhere a textarea's
// .value is set programmatically (restore, presets, import) must call
// autoGrowAll() itself since that doesn't fire 'input'.
function autoGrow(el: HTMLTextAreaElement): void {
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight}px`;
}
function autoGrowAll(): void {
  document.querySelectorAll<HTMLTextAreaElement>('textarea').forEach(autoGrow);
}
document.addEventListener('input', (ev) => {
  if (ev.target instanceof HTMLTextAreaElement) autoGrow(ev.target);
}, true);

const host = $<HTMLInputElement>('host');
const btnConnect = $<HTMLButtonElement>('btnConnect');
const connStatus = $<HTMLDivElement>('connStatus');

const skipRefImage = $<HTMLInputElement>('skipRefImage');
const refImageSection = $<HTMLDivElement>('refImageSection');
const btnPickImage = $<HTMLButtonElement>('btnPickImage');
const refFileName = $<HTMLSpanElement>('refFileName');
const refPreview = $<HTMLImageElement>('refPreview');

const diffModel = $<HTMLInputElement>('diffModel');
const diffModelList = $<HTMLElement>('diffModelList');
const clip = $<HTMLInputElement>('clip');
const clipList = $<HTMLElement>('clipList');
const vae = $<HTMLInputElement>('vae');
const vaeList = $<HTMLElement>('vaeList');
const mainLora = $<HTMLInputElement>('mainLora');
const mainLoraList = $<HTMLElement>('mainLoraList');
const btnRefreshModels = $<HTMLButtonElement>('btnRefreshModels');

const loraStackRows = $<HTMLDivElement>('loraStackRows');
const loraList = $<HTMLElement>('loraList');
const btnAddLora = $<HTMLButtonElement>('btnAddLora');

const lliteSection = $<HTMLDivElement>('lliteSection');
const lliteStrength = $<HTMLInputElement>('lliteStrength');
const lliteStartPercent = $<HTMLInputElement>('lliteStartPercent');
const lliteEndPercent = $<HTMLInputElement>('lliteEndPercent');
const llitePreserveWrapper = $<HTMLInputElement>('llitePreserveWrapper');
const resizeFit = $<HTMLSelectElement>('resizeFit');
const resizeMethod = $<HTMLSelectElement>('resizeMethod');

const unifiedPromptMode = $<HTMLInputElement>('unifiedPromptMode');
const unifiedPromptRow = $<HTMLDivElement>('unifiedPromptRow');
const unifiedPrompt = $<HTMLTextAreaElement>('unifiedPrompt');
const splitFieldsGroup = $<HTMLDivElement>('splitFieldsGroup');
const global_ = $<HTMLTextAreaElement>('global');
const character = $<HTMLTextAreaElement>('character');
const rating = $<HTMLTextAreaElement>('rating');
const hair = $<HTMLTextAreaElement>('hair');
const face = $<HTMLTextAreaElement>('face');
const chest = $<HTMLTextAreaElement>('chest');
const body_ = $<HTMLTextAreaElement>('body');
const clothes = $<HTMLTextAreaElement>('clothes');
const limbs = $<HTMLTextAreaElement>('limbs');
const sexual = $<HTMLTextAreaElement>('sexual');
const pose = $<HTMLTextAreaElement>('pose');
const scene = $<HTMLTextAreaElement>('scene');
const effects = $<HTMLTextAreaElement>('effects');
const extra = $<HTMLTextAreaElement>('extra');
const characterTrigger = $<HTMLTextAreaElement>('characterTrigger');
const negative = $<HTMLTextAreaElement>('negative');

const width = $<HTMLInputElement>('width');
const height = $<HTMLInputElement>('height');
const btnSwapReso = $<HTMLButtonElement>('btnSwapReso');
const sampler = $<HTMLInputElement>('sampler');
const scheduler = $<HTMLInputElement>('scheduler');
const steps1 = $<HTMLInputElement>('steps1');
const cfg1 = $<HTMLInputElement>('cfg1');
const seed1 = $<HTMLInputElement>('seed1');
const use2Pass = $<HTMLInputElement>('use2Pass');
const pass2Fields = $<HTMLDivElement>('pass2Fields');
const steps2 = $<HTMLInputElement>('steps2');
const denoise2 = $<HTMLInputElement>('denoise2');
const seed2 = $<HTMLInputElement>('seed2');

const upscaleEnabled = $<HTMLInputElement>('upscaleEnabled');
const upscaleModelRow = $<HTMLDivElement>('upscaleModelRow');
const upscaleModel = $<HTMLInputElement>('upscaleModel');
const upscaleModelList = $<HTMLElement>('upscaleModelList');
const btnRefreshUpscaleModels = $<HTMLButtonElement>('btnRefreshUpscaleModels');
const upscaleScaleBy = $<HTMLInputElement>('upscaleScaleBy');

const btnPickOutputFolder = $<HTMLButtonElement>('btnPickOutputFolder');
const outputFolderLabel = $<HTMLSpanElement>('outputFolderLabel');

const btnGenerate = $<HTMLButtonElement>('btnGenerate');
const btnStop = $<HTMLButtonElement>('btnStop');
const btnImportGen = $<HTMLButtonElement>('btnImportGen');
const genStatus = $<HTMLDivElement>('genStatus');
const livePreviewWrap = $<HTMLDivElement>('livePreviewWrap');
const livePreview = $<HTMLImageElement>('livePreview');
const previewCarousel = $<HTMLDivElement>('previewCarousel');
const previewThumbs = $<HTMLDivElement>('previewThumbs');
const previewEmpty = $<HTMLDivElement>('previewEmpty');
const logBox = $<HTMLDivElement>('log');

function log(msg: string): void {
  const line = document.createElement('div');
  line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  logBox.appendChild(line);
  logBox.scrollTop = logBox.scrollHeight;
}

function getHost(): string { return (host.value || '').trim() || 'http://127.0.0.1:8188'; }

// ---------------- ComfyUI terminal (real stdout/stderr) ----------------
// Same internal API ComfyUI's own frontend "Logs" panel uses: a one-shot
// GET for whatever's already buffered server-side, plus a live websocket
// subscription during generation (see main.ts). Not this app's own
// diagnostic messages (that's logBox above) — this is the actual server
// console output.
const comfyTerminal = $<HTMLDivElement>('comfyTerminal');
const btnRefreshComfyLog = $<HTMLButtonElement>('btnRefreshComfyLog');
// eslint-disable-next-line no-control-regex
const ANSI_ESCAPE_RE = /\x1b\[[0-9;]*m/g;
function appendComfyLogEntries(entries: { t: string; m: string }[]): void {
  for (const e of entries) {
    comfyTerminal.appendChild(document.createTextNode(e.m.replace(ANSI_ESCAPE_RE, '')));
  }
  comfyTerminal.scrollTop = comfyTerminal.scrollHeight;
}
btnRefreshComfyLog.addEventListener('click', async () => {
  const res = await window.electronAPI.comfyFetchLogs({ host: getHost() });
  if (!res.ok) { log(res.error || 'Could not fetch ComfyUI logs.'); return; }
  comfyTerminal.textContent = '';
  appendComfyLogEntries(res.entries || []);
});
window.electronAPI.onComfyLog((_event, entries) => appendComfyLogEntries(entries));

function fillDatalist(el: HTMLElement, values: string[]): void {
  el.innerHTML = '';
  for (const v of values) {
    const opt = document.createElement('option');
    opt.value = v;
    el.appendChild(opt);
  }
}

function fieldValue(el: HTMLInputElement | HTMLTextAreaElement): string { return (el.value || '').trim(); }

// ---------------- Reference image ----------------

let refFile: File | null = null;
let refFilename = '';

function applySkipRefImageUI(): void {
  refImageSection.classList.toggle('section-disabled', skipRefImage.checked);
  lliteSection.classList.toggle('section-disabled', skipRefImage.checked);
}
skipRefImage.addEventListener('change', applySkipRefImageUI);
applySkipRefImageUI();

btnPickImage.addEventListener('click', async () => {
  if (!(window as any).showOpenFilePicker) { log('This environment does not support file picking here.'); return; }
  let handles: FileSystemFileHandle[];
  try {
    handles = await (window as any).showOpenFilePicker({
      types: [{ description: 'Images', accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] } }],
      multiple: false
    });
  } catch (e) { return; }
  if (!handles || !handles[0]) return;
  const file = await handles[0].getFile();
  refFile = file;
  refFilename = file.name;
  refFileName.textContent = file.name;
  const url = URL.createObjectURL(file);
  refPreview.src = url;
  refPreview.style.display = 'block';
});

// ---------------- Unified prompt toggle ----------------

function applyUnifiedPromptModeUI(): void {
  const unified = unifiedPromptMode.checked;
  unifiedPromptRow.style.display = unified ? '' : 'none';
  splitFieldsGroup.style.display = unified ? 'none' : '';
  // A textarea measures scrollHeight 0 while display:none, so whichever
  // side just became visible needs a fresh autoGrow — otherwise it can be
  // left undersized from a measurement taken while it was hidden.
  autoGrowAll();
}
unifiedPromptMode.addEventListener('change', applyUnifiedPromptModeUI);
applyUnifiedPromptModeUI();

// ---------------- 2-Pass toggle ----------------

function applyUse2PassUI(): void {
  pass2Fields.style.display = use2Pass.checked ? '' : 'none';
}
use2Pass.addEventListener('change', applyUse2PassUI);
applyUse2PassUI();

// ---------------- Upscale toggle ----------------

function applyUpscaleUI(): void {
  upscaleModelRow.style.display = upscaleEnabled.checked ? '' : 'none';
}
upscaleEnabled.addEventListener('change', applyUpscaleUI);
applyUpscaleUI();

// ---------------- Prompt / Negative presets ----------------
// Prompt presets snapshot every field EXCEPT Negative — a prompt preset is
// "this character's whole setup," a negative preset is "this negative I
// keep reusing across many different characters," kept separate so saving
// one never forces re-saving the other.
const promptPresetSelect = $<HTMLSelectElement>('promptPresetSelect');
const promptPresetName = $<HTMLInputElement>('promptPresetName');
const btnSavePromptPreset = $<HTMLButtonElement>('btnSavePromptPreset');
const btnLoadPromptPreset = $<HTMLButtonElement>('btnLoadPromptPreset');
const btnDeletePromptPreset = $<HTMLButtonElement>('btnDeletePromptPreset');

const negativePresetSelect = $<HTMLSelectElement>('negativePresetSelect');
const negativePresetName = $<HTMLInputElement>('negativePresetName');
const btnSaveNegativePreset = $<HTMLButtonElement>('btnSaveNegativePreset');
const btnLoadNegativePreset = $<HTMLButtonElement>('btnLoadNegativePreset');
const btnDeleteNegativePreset = $<HTMLButtonElement>('btnDeleteNegativePreset');

function snapshotPromptFields(): Record<string, string | boolean> {
  return {
    unifiedPromptMode: unifiedPromptMode.checked,
    unifiedPrompt: unifiedPrompt.value,
    global: global_.value,
    character: character.value,
    characterTrigger: characterTrigger.value,
    rating: rating.value,
    hair: hair.value,
    face: face.value,
    chest: chest.value,
    body: body_.value,
    clothes: clothes.value,
    limbs: limbs.value,
    sexual: sexual.value,
    pose: pose.value,
    scene: scene.value,
    effects: effects.value,
    extra: extra.value
  };
}

function applyPromptFields(fields: Record<string, string | boolean>): void {
  unifiedPromptMode.checked = !!fields.unifiedPromptMode;
  unifiedPrompt.value = String(fields.unifiedPrompt || '');
  global_.value = String(fields.global || '');
  character.value = String(fields.character || '');
  characterTrigger.value = String(fields.characterTrigger || '');
  rating.value = String(fields.rating || '');
  hair.value = String(fields.hair || '');
  face.value = String(fields.face || '');
  chest.value = String(fields.chest || '');
  body_.value = String(fields.body || '');
  clothes.value = String(fields.clothes || '');
  limbs.value = String(fields.limbs || '');
  sexual.value = String(fields.sexual || '');
  pose.value = String(fields.pose || '');
  scene.value = String(fields.scene || '');
  effects.value = String(fields.effects || '');
  extra.value = String(fields.extra || '');
  applyUnifiedPromptModeUI();
  autoGrowAll();
}

async function refreshPresetLists(): Promise<void> {
  const res = await window.electronAPI.listPresets();
  if (!res.ok) { log(res.error || 'Could not load presets.'); return; }
  const fillSelect = (el: HTMLSelectElement, names: string[]) => {
    const current = el.value;
    el.innerHTML = '<option value="">(choose a preset)</option>';
    for (const name of names) {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      el.appendChild(opt);
    }
    if (names.includes(current)) el.value = current;
  };
  fillSelect(promptPresetSelect, res.promptPresetNames || []);
  fillSelect(negativePresetSelect, res.negativePresetNames || []);
}

btnSavePromptPreset.addEventListener('click', async () => {
  const name = promptPresetName.value.trim();
  if (!name) { log('Type a name for this prompt preset first.'); return; }
  const res = await window.electronAPI.savePreset({ kind: 'prompt', name, value: snapshotPromptFields() });
  if (res.ok) { log(`Saved prompt preset "${name}".`); promptPresetName.value = ''; await refreshPresetLists(); promptPresetSelect.value = name; }
  else log(res.error || 'Could not save prompt preset.');
});
btnLoadPromptPreset.addEventListener('click', async () => {
  const name = promptPresetSelect.value;
  if (!name) { log('Pick a prompt preset to load first.'); return; }
  const res = await window.electronAPI.loadPreset({ kind: 'prompt', name });
  if (res.ok) { applyPromptFields(res.value as Record<string, string | boolean>); log(`Loaded prompt preset "${name}".`); }
  else log(res.error || 'Could not load prompt preset.');
});
btnDeletePromptPreset.addEventListener('click', async () => {
  const name = promptPresetSelect.value;
  if (!name) return;
  const res = await window.electronAPI.deletePreset({ kind: 'prompt', name });
  if (res.ok) { log(`Deleted prompt preset "${name}".`); await refreshPresetLists(); }
  else log(res.error || 'Could not delete prompt preset.');
});

btnSaveNegativePreset.addEventListener('click', async () => {
  const name = negativePresetName.value.trim();
  if (!name) { log('Type a name for this negative preset first.'); return; }
  const res = await window.electronAPI.savePreset({ kind: 'negative', name, value: negative.value });
  if (res.ok) { log(`Saved negative preset "${name}".`); negativePresetName.value = ''; await refreshPresetLists(); negativePresetSelect.value = name; }
  else log(res.error || 'Could not save negative preset.');
});
btnLoadNegativePreset.addEventListener('click', async () => {
  const name = negativePresetSelect.value;
  if (!name) { log('Pick a negative preset to load first.'); return; }
  const res = await window.electronAPI.loadPreset({ kind: 'negative', name });
  if (res.ok) { negative.value = String(res.value || ''); autoGrow(negative); log(`Loaded negative preset "${name}".`); }
  else log(res.error || 'Could not load negative preset.');
});
btnDeleteNegativePreset.addEventListener('click', async () => {
  const name = negativePresetSelect.value;
  if (!name) return;
  const res = await window.electronAPI.deletePreset({ kind: 'negative', name });
  if (res.ok) { log(`Deleted negative preset "${name}".`); await refreshPresetLists(); }
  else log(res.error || 'Could not delete negative preset.');
});

function initPresets(): void { refreshPresetLists(); }

// ---------------- Width/Height swap ----------------

btnSwapReso.addEventListener('click', () => {
  const w = width.value;
  width.value = height.value;
  height.value = w;
});

// ---------------- Connection test ----------------

btnConnect.addEventListener('click', async () => {
  connStatus.style.display = 'block';
  connStatus.style.color = '';
  connStatus.textContent = 'Connecting…';
  const res = await window.electronAPI.synthdatGetObjectInfo({ host: getHost(), classType: 'UNETLoader', inputName: 'unet_name' });
  if (res.ok) {
    connStatus.style.color = 'var(--accent-ok)';
    connStatus.textContent = `✓ Connected to ${getHost()}`;
  } else {
    connStatus.style.color = '';
    connStatus.textContent = res.error || 'Could not connect.';
  }
});

// ---------------- Model / LoRA / upscale-model lists ----------------

let loraCombo: string[] | null = null;

async function fetchComboValues(classType: string, inputName: string): Promise<string[] | null> {
  const res = await window.electronAPI.synthdatGetObjectInfo({ host: getHost(), classType, inputName });
  if (!res.ok) { log(res.error || `Could not load ${classType}'s ${inputName} list from ComfyUI.`); return null; }
  return res.values || [];
}

btnRefreshModels.addEventListener('click', async () => {
  const [unetValues, clipValues, vaeValues, mainLoraValues, loraValues, upscaleValues] = await Promise.all([
    fetchComboValues('UNETLoader', 'unet_name'),
    fetchComboValues('CLIPLoader', 'clip_name'),
    fetchComboValues('VAELoader', 'vae_name'),
    fetchComboValues('DSM Lora Name', 'lora_name'),
    fetchComboValues('DSM Lora Loader Stack', 'lora_01'),
    fetchComboValues('UpscaleModelLoader', 'model_name')
  ]);
  if (unetValues) fillDatalist(diffModelList, unetValues);
  if (clipValues) fillDatalist(clipList, clipValues);
  if (vaeValues) fillDatalist(vaeList, vaeValues);
  if (mainLoraValues) fillDatalist(mainLoraList, mainLoraValues);
  if (loraValues) { loraCombo = loraValues; fillDatalist(loraList, loraValues); }
  if (upscaleValues) fillDatalist(upscaleModelList, upscaleValues);
  log('Model lists refreshed.');
  await refreshSamplerLists();
  log('Sampler/scheduler options refreshed.');
});

// Model fields are readonly tap-targets opening the shared picker modal
// (same UI as mobile) — no native datalist popup. The <datalist> elements
// stay purely as option stores.
attachPickerModal(diffModel, 'Diffusion model', () => optionsFromDatalist(diffModelList));
attachPickerModal(clip, 'CLIP', () => optionsFromDatalist(clipList));
attachPickerModal(vae, 'VAE', () => optionsFromDatalist(vaeList));
attachPickerModal(mainLora, 'Main LoRA', () => optionsFromDatalist(mainLoraList));
attachPickerModal(upscaleModel, 'Upscale model', () => optionsFromDatalist(upscaleModelList));
// Sampler/scheduler pickers — same tap-to-pick modal as the model fields,
// option source = the host's KSampler object_info (the canonical ComfyUI
// lists), fetched once at startup and via Refresh model lists. Fields are
// readonly tap-targets now, so a stray keypress can no longer drift the
// value off the list ComfyUI actually supports.
// Desktop note: local disk doesn't hold these lists; they're live node
// schema, hence the object_info fetch rather than a datalist copy.
attachPickerModal(sampler, 'Sampler', () => bridgeSamplerOptions);
attachPickerModal(scheduler, 'Scheduler', () => bridgeSchedulerOptions);
let bridgeSamplerOptions: string[] = [];
let bridgeSchedulerOptions: string[] = [];
async function refreshSamplerLists(): Promise<void> {
  const res = await window.electronAPI.synthdatGetObjectInfo({ host: getHost(), classType: 'KSampler', inputName: 'sampler_name' });
  if (res.ok && res.values) bridgeSamplerOptions = res.values;
  const res2 = await window.electronAPI.synthdatGetObjectInfo({ host: getHost(), classType: 'KSampler', inputName: 'scheduler' });
  if (res2.ok && res2.values) bridgeSchedulerOptions = res2.values;
}
// Dedicated upscale refresh, independent of "Refresh model lists" above —
// same live ComfyUI query (object_info has no on-disk fallback; this app
// has no fixed install path to read from, unlike the parent project's own
// dev machine this used to assume — see fetchComboValues/parseComboValues).
btnRefreshUpscaleModels.addEventListener('click', async () => {
  const values = await fetchComboValues('UpscaleModelLoader', 'model_name');
  if (!values) return;
  fillDatalist(upscaleModelList, values);
  log(`Found ${values.length} upscale model(s) on the host.`);
});
initPresets();

// ---------------- LoRA stack rows ----------------

interface LoraRow { row: HTMLElement; input: HTMLInputElement; strength: HTMLInputElement; }
let loraRows: LoraRow[] = [];

function addLoraRow(defaultLora = '', defaultStrength = 1): void {
  const row = document.createElement('div');
  row.className = 'synthdat-lora-row';
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Tap to choose…';
  input.readOnly = true;
  input.value = defaultLora;
  attachPickerModal(input, 'LoRA', () => optionsFromDatalist(loraList));
  const strength = document.createElement('input');
  strength.type = 'number';
  strength.step = '0.05';
  strength.value = String(defaultStrength);
  const removeBtn = document.createElement('button');
  removeBtn.textContent = '×';
  removeBtn.addEventListener('click', () => { loraRows = loraRows.filter(r => r.row !== row); row.remove(); });
  row.appendChild(input);
  row.appendChild(strength);
  row.appendChild(removeBtn);
  loraStackRows.appendChild(row);
  loraRows.push({ row, input, strength });
}
btnAddLora.addEventListener('click', () => addLoraRow('', 1));
addLoraRow('', 1);
addLoraRow('', 0.8);

// ---------------- UI state persistence ----------------
// Every field survives restarts: type the host, pick a model, tune steps —
// reopening the app returns you exactly where you left off. Snapshot runs
// debounced on any input/change; restore runs once here, AFTER the default
// population above (preset defaults / seeded LoRA rows), so user values
// always win over defaults.
const UI_STATE_KEY = 'comfybridge-ui-state';
const UI_EXCLUDED = new Set<string>();
type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
function captureUiState(): void {
  const state: Record<string, unknown> = {};
  document.querySelectorAll<Field>('input,select,textarea').forEach((el) => {
    if (!el.id || UI_EXCLUDED.has(el.id)) return;
    if (el instanceof HTMLInputElement && el.type === 'checkbox') state[el.id] = el.checked;
    else state[el.id] = el.value;
  });
  state[':loraRows'] = loraRows.map(r => ({ n: r.input.value, s: r.strength.value }));
  try { localStorage.setItem(UI_STATE_KEY, JSON.stringify(state)); } catch { /* best effort */ }
}
function restoreUiState(): void {
  let state: Record<string, unknown>;
  try { state = JSON.parse(localStorage.getItem(UI_STATE_KEY) || '{}'); } catch { return; }
  document.querySelectorAll<Field>('input,select,textarea').forEach((el) => {
    if (!el.id || UI_EXCLUDED.has(el.id) || !(el.id in state)) return;
    const v = state[el.id];
    if (typeof v !== 'string' && typeof v !== 'boolean') return;
    if (el instanceof HTMLInputElement && el.type === 'checkbox') el.checked = Boolean(v);
    else if (typeof v === 'string') el.value = v;
    // Not touching selects that don't have the option yet — they populate
    // async; missing options just fall back to their current selection.
  });
  const loras = state[':loraRows'] as { n: string; s: string }[] | undefined;
  if (Array.isArray(loras) && loras.length){
    for (const r of [...loraRows]) { loraRows = loraRows.filter(x => x !== r); r.row.remove(); }
    for (const l of loras) addLoraRow(String(l.n ?? ''), Number(l.s ?? 1) || 1);
  }
  // Restoring el.checked here is a plain DOM assignment, not a real click —
  // it never fires 'change', so none of the checkbox-driven show/hide
  // functions (bound as 'change' listeners) re-run. Without this, a
  // restored-checked skipRefImage/use2Pass/upscaleEnabled/unifiedPromptMode
  // left its dependent section in whatever visibility the PRE-restore
  // (unchecked-by-default) state left it in — checkbox says on, the actual
  // fields still say off.
  applySkipRefImageUI();
  applyUse2PassUI();
  applyUpscaleUI();
  applyUnifiedPromptModeUI();
  autoGrowAll();
}
let uiSaveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleUiSave(): void {
  if (uiSaveTimer) clearTimeout(uiSaveTimer);
  uiSaveTimer = setTimeout(captureUiState, 250);
}
document.addEventListener('input', scheduleUiSave, true);
document.addEventListener('change', scheduleUiSave, true);
restoreUiState();
captureUiState();

// ---------------- Theme colors (Osmium palettes, colors only) ----------------
// The 25 palettes and their CSS-variable mapping live in the shared module
// (shared/themes.ts + shared/theme-data.ts) so desktop and mobile run the
// same set — COLORS ONLY by design: no textures, no ambient animations, no
// hover-fill flourishes, exactly per user spec. initTheme() reads the/
// writes comfybridge-theme; mountThemePicker() wires the popover (native
// <select> popup refused to expand in this Electron window).
initTheme(THEMES, DEFAULT_THEME);
mountThemePicker({ wrap: 'themeWrap', btn: 'themeBtn', btnLabel: 'themeBtnLabel', menu: 'themeMenu' });

// ---------------- Right column width (drag-resizable) ----------------
// "Enlarge the generation area" means WIDER, squashing #mid — not a taller
// preview box. #right's width drives var(--right-w) on #layout's grid
// (see styles.css); #mid is the 1fr column that gives up the space.
const rightResizeHandle = $<HTMLDivElement>('rightResizeHandle');
const RIGHT_PANEL_MIN_WIDTH = 300;
const RIGHT_PANEL_WIDTH_KEY = 'comfybridge-right-panel-width';
let rightPanelWidth = 380;
function rightPanelMaxWidth(): number {
  // Leaves #left's fixed 320px plus a usable sliver of #mid.
  return Math.max(RIGHT_PANEL_MIN_WIDTH, window.innerWidth - 320 - 260);
}
function applyRightPanelWidth(px: number): number {
  rightPanelWidth = Math.min(rightPanelMaxWidth(), Math.max(RIGHT_PANEL_MIN_WIDTH, px));
  document.documentElement.style.setProperty('--right-w', `${rightPanelWidth}px`);
  return rightPanelWidth;
}
(function initRightPanelWidth(): void {
  let saved = NaN;
  try { saved = parseInt(localStorage.getItem(RIGHT_PANEL_WIDTH_KEY) || '', 10); } catch (e) { /* best effort */ }
  applyRightPanelWidth(isNaN(saved) ? rightPanelWidth : saved);
})();
window.addEventListener('resize', () => applyRightPanelWidth(rightPanelWidth));
rightResizeHandle.addEventListener('mousedown', (ev) => {
  ev.preventDefault();
  const startX = ev.clientX;
  const startWidth = rightPanelWidth;
  rightResizeHandle.classList.add('resizing');
  function onMove(mv: MouseEvent): void {
    // Dragging left (negative dx) widens #right, since it's the rightmost column.
    applyRightPanelWidth(startWidth - (mv.clientX - startX));
  }
  function onUp(): void {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    rightResizeHandle.classList.remove('resizing');
    try { localStorage.setItem(RIGHT_PANEL_WIDTH_KEY, String(rightPanelWidth)); } catch (e) { /* best effort */ }
  }
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
});

// ---------------- Output folder ----------------

let outputFolder = '';
const OUTPUT_FOLDER_KEY = 'comfybridge-output-folder';
try {
  const savedOutputFolder = localStorage.getItem(OUTPUT_FOLDER_KEY);
  if (savedOutputFolder) {
    outputFolder = savedOutputFolder;
    outputFolderLabel.textContent = savedOutputFolder;
  }
} catch {
  /* best effort — private-mode storage */
}
btnPickOutputFolder.addEventListener('click', async () => {
  const res = await window.electronAPI.pickOutputFolder();
  if (!res.ok || !res.path) return;
  outputFolder = res.path;
  outputFolderLabel.textContent = outputFolder;
  try {
    localStorage.setItem(OUTPUT_FOLDER_KEY, outputFolder);
  } catch {
    /* best effort */
  }
});

// IPC-backed storage backend for the shared gallery/numbering — the
// desktop half of the mobile SAF/Documents backend. Mobile-only storage
// (SAF picker, Documents fallback) never appears in this bundle.
function desktopBackend(): StorageBackend {
  return {
    async listDir(relDir: string): Promise<DirEntry[]> {
      if (!outputFolder) throw new Error('No output folder chosen.');
      const res = await window.electronAPI.galleryListDir({ folder: outputFolder, relDir });
      if (!res.ok) throw new Error(res.error || 'Could not list folder.');
      return (res.entries || []).map((e) => ({
        name: e.name,
        kind: e.kind,
        mtime: typeof e.mtime === 'number' ? e.mtime : 0
      }));
    },
    async readImage(relPath: string): Promise<string | null> {
      if (!outputFolder) return null;
      const res = await window.electronAPI.galleryRead({ folder: outputFolder, relPath });
      if (!res.ok || !res.base64) return null;
      return `data:${res.mime || 'image/png'};base64,${res.base64}`;
    },
    async writeImage(relPath: string, base64: string): Promise<void> {
      if (!outputFolder) throw new Error('No output folder chosen.');
      const res = await window.electronAPI.saveImage({
        folder: outputFolder,
        filename: relPath,
        bytes: base64ToBytes(base64)
      });
      if (!res.ok) throw new Error(res.error || 'Could not save.');
    }
  };
}

// ---------------- Prompt building ----------------
// Node ids match ../../renderer/data/synthdat-workflow.json exactly — see
// this file's own top comment. Kept as a faithful copy of
// synthdat-overseer.ts's buildPromptFromFields(), minus dataset-only
// concerns (tag snapshotting, canonical-tag stripping), plus the optional
// upscale-by-model insertion at the end.

let template: any = null;
async function loadTemplate(): Promise<any> {
  if (template) return template;
  const res = await fetch('./data/synthdat-workflow.json');
  template = await res.json();
  return template;
}

function buildPrompt(): any {
  // Thin adapter over the shared builder (comfy-core.ts, synced from the root
  // app) — reads this app's UI into SynthDatPromptConfig. All graph logic lives
  // there so it can't drift from the root app's SynthDat Overseer.
  return buildSynthDatPrompt(template, {
    unified: unifiedPromptMode.checked,
    global: fieldValue(global_),
    rating: fieldValue(rating),
    character: fieldValue(character),
    characterTrigger: fieldValue(characterTrigger),
    unifiedPrompt: fieldValue(unifiedPrompt),
    hair: fieldValue(hair),
    face: fieldValue(face),
    chest: fieldValue(chest),
    body: fieldValue(body_),
    clothes: fieldValue(clothes),
    limbs: fieldValue(limbs),
    sexual: fieldValue(sexual),
    pose: fieldValue(pose),
    extra: fieldValue(extra),
    effects: fieldValue(effects),
    scene: fieldValue(scene),
    negative: fieldValue(negative),
    diffModel: diffModel.value,
    mainLora: mainLora.value,
    clip: clip.value,
    vae: vae.value,
    loraRows: loraRows.map(r => ({ input: r.input.value, strength: r.strength.value })),
    noLoraStandIn: 'Anima-n',
    skipRefImage: skipRefImage.checked,
    lliteStrength: lliteStrength.value,
    lliteStartPercent: lliteStartPercent.value,
    lliteEndPercent: lliteEndPercent.value,
    llitePreserveWrapper: llitePreserveWrapper.checked,
    resizeFit: resizeFit.value,
    resizeMethod: resizeMethod.value,
    sampler: sampler.value,
    scheduler: scheduler.value,
    steps1: steps1.value,
    cfg1: cfg1.value,
    width: width.value,
    height: height.value,
    seed1: seed1.value,
    use2Pass: use2Pass.checked,
    seed2: seed2.value,
    denoise2: denoise2.value,
    steps2: steps2.value,
    upscale: { enabled: upscaleEnabled.checked, model: upscaleModel.value, scaleBy: upscaleScaleBy.value }
  });
}

// ---------------- Generate ----------------

let generating = false;

window.electronAPI.onPreviewFrame((_event, data) => {
  const blob = new Blob([data.bytes as BlobPart], { type: data.mime });
  livePreview.src = URL.createObjectURL(blob);
  livePreviewWrap.style.display = 'flex';
});
window.electronAPI.onGenProgress((_event, data) => {
  if (!data || !data.max) return;
  genStatus.textContent = `Generating… step ${data.value}/${data.max}`;
});

async function saveBytes(bytes: Uint8Array, filename: string): Promise<boolean> {
  if (!outputFolder) { log(`No output folder chosen — "${filename}" was NOT saved.`); return false; }
  try {
    await desktopBackend().writeImage(filename, bytesToBase64(bytes), 'image/png');
    log(`Saved ${filename}`);
    return true;
  } catch (err) {
    log(`Failed to save ${filename}: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}

// ---------------- Result preview carousel ----------------
// Up to 3 images from one generation (pass 1, pass 2/single-pass, upscaled)
// used to just stack on top of each other. Now they're swipeable slides —
// scroll-snap does the swipe/momentum for free on both touch and trackpad,
// no hand-rolled drag math — with a thumbnail strip below to jump directly
// and see which slide is active.
let previewSlideUrls: string[] = [];

function clearPreviewSlides(): void {
  for (const u of previewSlideUrls) URL.revokeObjectURL(u);
  previewSlideUrls = [];
  previewCarousel.innerHTML = '';
  previewThumbs.innerHTML = '';
  previewThumbs.style.display = 'none';
}

function setPreviewSlides(slides: { label: string; bytes: Uint8Array }[]): void {
  clearPreviewSlides();
  if (!slides.length) { previewEmpty.style.display = ''; return; }
  previewEmpty.style.display = 'none';
  previewSlideUrls = slides.map((s) => URL.createObjectURL(new Blob([s.bytes as BlobPart], { type: 'image/png' })));
  slides.forEach((s, i) => {
    const slide = document.createElement('div');
    slide.className = 'preview-slide';
    const label = document.createElement('span');
    label.className = 'preview-slide-label';
    label.textContent = s.label;
    const img = document.createElement('img');
    img.src = previewSlideUrls[i];
    img.addEventListener('click', () => showImageLightbox(img.src));
    slide.appendChild(label);
    slide.appendChild(img);
    previewCarousel.appendChild(slide);
  });
  if (slides.length > 1) {
    previewThumbs.style.display = '';
    slides.forEach((s, i) => {
      const thumb = document.createElement('button');
      thumb.type = 'button';
      thumb.className = 'preview-thumb' + (i === 0 ? ' active' : '');
      thumb.title = s.label;
      const timg = document.createElement('img');
      timg.src = previewSlideUrls[i];
      thumb.appendChild(timg);
      thumb.addEventListener('click', () => {
        previewCarousel.scrollTo({ left: i * previewCarousel.clientWidth, behavior: 'smooth' });
      });
      previewThumbs.appendChild(thumb);
    });
  }
  previewCarousel.scrollLeft = 0;
}

let previewScrollTimer: ReturnType<typeof setTimeout> | null = null;
previewCarousel.addEventListener('scroll', () => {
  if (previewScrollTimer) clearTimeout(previewScrollTimer);
  previewScrollTimer = setTimeout(() => {
    const w = previewCarousel.clientWidth || 1;
    const idx = Math.round(previewCarousel.scrollLeft / w);
    previewThumbs.querySelectorAll('.preview-thumb').forEach((el, i) => el.classList.toggle('active', i === idx));
  }, 80);
});

async function generate(): Promise<void> {
  if (generating) return;
  if (!skipRefImage.checked && !refFile) { log('Pick a reference image first (or check "No reference image").'); return; }
  await loadTemplate();
  generating = true;
  btnGenerate.disabled = true;
  btnStop.disabled = false;
  livePreview.src = '';
  livePreviewWrap.style.display = 'none';
  genStatus.style.display = 'block';
  genStatus.textContent = 'Generating… this can take a while.';

  const prompt = buildPrompt();
  const bytes = skipRefImage.checked ? null : new Uint8Array(await refFile!.arrayBuffer());

  const res = await window.electronAPI.synthdatQueueAndFetch({
    host: getHost(),
    imageFilename: skipRefImage.checked ? null : refFilename,
    imageBytes: bytes,
    prompt
  });

  generating = false;
  btnGenerate.disabled = false;
  btnStop.disabled = true;
  livePreviewWrap.style.display = 'none';

  if (!res.ok) {
    genStatus.textContent = res.interrupted ? '' : (res.error || 'Generation failed.');
    if (res.interrupted) { genStatus.style.display = 'none'; log('Generation stopped.'); }
    else log(res.error || 'Generation failed.');
    return;
  }
  genStatus.style.display = 'none';

  // Save with the SAME name/folder scheme ComfyUI's SaveImage used for its
  // own copy (the File Namer prefix chain: rating folder / character
  // folder / lora tail, e.g. "explicit/Lumine/mylora_00003.png") — Mirrored
  // INSIDE the chosen destination folder, per user spec. The app's own
  // per-folder counter (nextFileNumber) was overwriting that scheme with
  // plain "N.png" at the destination root — the user's "the naming scheme
  // gets overwritten when a folder is chosen" bug. ComfyUI's per-folder
  // counter is the single numbering authority in the scheme, so both
  // copies share it; the flat fallback numbering below only applies when
  // history didn't expose a path (older server shapes).
  const fallbackN = () => nextFileNumber(desktopBackend());
  let saveFailed = false;
  const slides: { label: string; bytes: Uint8Array }[] = [];
  // 2-Pass: save BOTH passes, per this app's whole reason for existing —
  // SynthDat only ever keeps one (via Accept), this keeps both always.
  if (res.pass1ImageBytes) {
    if (!(await saveBytes(res.pass1ImageBytes, res.pass1SaveRel || `${await fallbackN()}_pass1.png`))) saveFailed = true;
    slides.push({ label: 'Pass 1', bytes: res.pass1ImageBytes });
  }
  if (res.imageBytes) {
    if (!(await saveBytes(res.imageBytes, res.saveRel || `${await fallbackN()}.png`))) saveFailed = true;
    slides.push({ label: res.pass1ImageBytes ? 'Pass 2' : 'Pass 1', bytes: res.imageBytes });
  }
  if (res.upscaledImageBytes) {
    if (!(await saveBytes(res.upscaledImageBytes, res.upscaledSaveRel || `${await fallbackN()}_upscaled.png`))) saveFailed = true;
    slides.push({ label: 'Upscaled', bytes: res.upscaledImageBytes });
  }
  if (saveFailed) {
    genStatus.style.display = 'block';
    genStatus.textContent = 'Generated, but saving failed — see Log for details.';
  }
  setPreviewSlides(slides);
}

btnGenerate.addEventListener('click', generate);

// ---------------- Import generation ----------------
// Every field applyImportedPrompt can touch, reset to blank/default first.
// The importer only ever writes a field when the saved prompt actually has
// a value for it (see setVal/s() below) — without this, importing a
// generation that, say, didn't use a 2nd pass or a LoRA stack left
// whatever was already sitting in those fields from before the import,
// silently mixing old and new settings.
const RESET_TEXT_FIELDS: (HTMLInputElement | HTMLTextAreaElement)[] = [
  diffModel, clip, vae, mainLora,
  lliteStrength, lliteStartPercent, lliteEndPercent,
  unifiedPrompt, global_, character, characterTrigger, rating, hair, face, chest, body_,
  clothes, limbs, sexual, pose, scene, effects, extra, negative,
  width, height, sampler, scheduler, steps1, cfg1, seed1, steps2, denoise2, seed2, upscaleModel, upscaleScaleBy
];
const RESET_CHECKBOXES: HTMLInputElement[] = [
  skipRefImage, llitePreserveWrapper, unifiedPromptMode, use2Pass, upscaleEnabled
];
function resetGenerationForm(): void {
  for (const el of RESET_TEXT_FIELDS) el.value = el.defaultValue;
  for (const el of RESET_CHECKBOXES) el.checked = el.defaultChecked;
  for (const sel of [resizeFit, resizeMethod]) {
    for (const opt of Array.from(sel.options)) opt.selected = opt.defaultSelected;
  }
  for (const r of [...loraRows]) { loraRows = loraRows.filter(x => x !== r); r.row.remove(); }
  refFile = null;
  refFilename = '';
  refFileName.textContent = '';
  refPreview.removeAttribute('src');
  refPreview.style.display = 'none';
  applySkipRefImageUI();
  applyUnifiedPromptModeUI();
  applyUse2PassUI();
  applyUpscaleUI();
}

// Reads a PNG saved by the integrated workflow and re-enters its full
// generation config into the app: models, LoRA stack, prompt fields,
// resolution, sampler/scheduler/steps/cfg/seeds, 2-Pass, resize and
// upscale. Node ids mirror buildPrompt()'s fixed template (same file, the
// template IS the format), so a saved prompt maps back 1:1.
function applyImportedPrompt(prompt: Record<string, any>): void {
  resetGenerationForm();
  const inp = (id: string): Record<string, unknown> => (prompt[id] && prompt[id].inputs) || {};
  const s = (id: string, key: string): string => { const v = inp(id)[key]; return v == null ? '' : String(v); };
  function setVal(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, v: string): void {
    if (v !== '') el.value = v;
  }
  if (s('41', 'unet_name')) diffModel.value = s('41', 'unet_name');
  if (s('51', 'lora_name') && s('51', 'lora_name') !== 'None' && s('51', 'lora_name') !== 'Anima-n') mainLora.value = s('51', 'lora_name');
  if (s('249', 'clip_name')) clip.value = s('249', 'clip_name');
  if (s('47:46', 'vae_name')) vae.value = s('47:46', 'vae_name');

  // LoRA stack: the chain root '237' plus any 237_extra_N clones, slots 01-04 each.
  const stackIds: string[] = [];
  if (prompt['237']) stackIds.push('237');
  for (const id of Object.keys(prompt)) {
    if (/^237_extra_\d+$/.test(id)) stackIds.push(id);
  }
  stackIds.sort((a, b) => (a === '237' ? -1 : b === '237' ? 1 : parseInt(a.split('_')[2], 10) - parseInt(b.split('_')[2], 10)));
  const rows: { n: string; s: number }[] = [];
  for (const id of stackIds) {
    const inputs = prompt[id].inputs;
    for (let i = 1; i <= 4; i++) {
      const slot = String(i).padStart(2, '0');
      const name = inputs[`lora_${slot}`];
      const str = inputs[`strength_${slot}`];
      if (name && name !== 'None') rows.push({ n: String(name), s: typeof str === 'number' ? str : (parseFloat(str) || 0) });
    }
  }
  for (const r of rows) addLoraRow(r.n, r.s);

  // Reference-image branch: an intact generation has '240' (LLite) and
  // possibly '238' (resize) unless it was run with the ref image skipped.
  if (prompt['240']) {
    skipRefImage.checked = false;
    lliteStrength.value = String((prompt['240'].inputs.strength as number) ?? 0);
    lliteStartPercent.value = String((prompt['240'].inputs.start_percent as number) ?? 0);
    lliteEndPercent.value = String((prompt['240'].inputs.end_percent as number) ?? 0);
    llitePreserveWrapper.checked = Boolean(prompt['240'].inputs.preserve_wrapper);
  } else {
    skipRefImage.checked = true;
  }
  if (prompt['238']) {
    setVal(resizeFit, s('238', 'fit'));
    setVal(resizeMethod, s('238', 'method'));
  }

  setVal(global_, s('21', 'value'));
  const perField: [HTMLTextAreaElement, string][] = [
    [rating, s('8', 'value')], [hair, s('12', 'value')], [face, s('15', 'value')],
    [chest, s('18', 'value')], [body_, s('9', 'value')], [clothes, s('6', 'value')],
    [limbs, s('20', 'value')], [sexual, s('14', 'value')], [pose, s('7', 'value')],
    [extra, s('10', 'value')], [effects, s('13', 'value')], [scene, s('17', 'value')]
  ];
  const charVal = s('11', 'value');
  const hasPerField = perField.some(([, v]) => v) ;
  if (!hasPerField && s('21', 'value')){
    // Unified mode: the template put everything into '21' and left the
    // per-field nodes ''. '11' held unified + character trigger joined —
    // the trigger part can't be split back out reliably, so it stays in the
    // unified text (it generates identically when re-queued).
    unifiedPromptMode.checked = true;
    unifiedPrompt.value = s('21', 'value');
    character.value = charVal;
  } else {
    unifiedPromptMode.checked = false;
    unifiedPrompt.value = '';
    character.value = charVal;
    for (const [el, v] of perField) setVal(el, v);
  }
  setVal(negative, prompt['16'] && prompt['16'].inputs ? String(prompt['16'].inputs.text ?? '') : '');

  setVal(sampler, s('168:167', 'sampler_name'));
  setVal(scheduler, s('158:53', 'scheduler') || s('195', 'scheduler'));
  if (s('158:53', 'steps')) steps1.value = s('158:53', 'steps');
  setVal(cfg1, s('158:54', 'cfg'));
  if (s('174:171', 'value')) width.value = s('174:171', 'value');
  if (s('174:172', 'value')) height.value = s('174:172', 'value');
  if (s('165', 'noise_seed')) seed1.value = s('165', 'noise_seed');

  if (prompt['195']) {
    use2Pass.checked = true;
    if (s('227', 'noise_seed')) seed2.value = s('227', 'noise_seed');
    if (s('195', 'steps')) steps2.value = s('195', 'steps');
    denoise2.value = String((prompt['195'].inputs.denoise as number) ?? 0.6);
  } else {
    use2Pass.checked = false;
  }
  if (prompt['upscale_model_loader']) {
    upscaleEnabled.checked = true;
    upscaleModel.value = String(prompt['upscale_model_loader'].inputs.model_name ?? '');
    if (prompt['upscale_scale_192']) {
      const sb = prompt['upscale_scale_192'].inputs.scale_by;
      upscaleScaleBy.value = String(typeof sb === 'number' ? sb : (parseFloat(sb) || 1));
    }
  }
  applySkipRefImageUI();
  applyUnifiedPromptModeUI();
  applyUse2PassUI();
  applyUpscaleUI();
  autoGrowAll();
  scheduleUiSave();
}
btnImportGen.addEventListener('click', async () => {
  const res = await window.electronAPI.importWorkflow();
  if (!res.ok){
    if (!res.cancelled){ log(res.error || 'Import failed.'); alert(res.error || 'Import failed.'); }
    return;
  }
  if (res.prompt){
    try {
      applyImportedPrompt(res.prompt);
      log('Imported generation settings from PNG.');
    } catch (err) {
      log(`Import failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
});
btnStop.addEventListener('click', async () => {
  await window.electronAPI.synthdatStopGeneration(getHost());
});

// ---------------- Init ----------------

mountGallerySidebar(desktopBackend, () => outputFolder || 'No folder chosen', { navigable: true });
refreshSamplerLists();
window.electronAPI.getAppVersion().then((v) => { $<HTMLSpanElement>('appVersion').textContent = `v${v}`; }).catch(() => {});
log('Comfy Bridge ready. Pick an output folder, set your host, and Generate.');
