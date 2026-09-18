// Comfy Bridge renderer — the generation half of Dataset Tag Studio's
// SynthDat Overseer, without the dataset: no tag card, no Accept/Reject,
// every finished generation (both passes, if 2-Pass ran) is written
// straight to a user-picked output folder, optionally upscaled by model
// first. Prompt-building logic (node ids, field mapping, LoRA stack
// chaining, ControlNet skip) is copied from
// `../../src/renderer/synthdat-overseer.ts`'s `buildPromptFromFields()` —
// same fixed workflow template, so the node ids must match exactly.

interface ElectronAPI {
  getAppVersion(): Promise<string>;
  pickOutputFolder(): Promise<{ ok: boolean; path?: string }>;
  saveImage(payload: { folder: string; filename: string; bytes: Uint8Array }): Promise<{ ok: boolean; error?: string }>;
  listUpscaleModels(): Promise<{ ok: boolean; values?: string[]; error?: string }>;
  listPresets(): Promise<{ ok: boolean; promptPresetNames?: string[]; negativePresetNames?: string[]; error?: string }>;
  savePreset(payload: { kind: 'prompt' | 'negative'; name: string; value: unknown }): Promise<{ ok: boolean; error?: string }>;
  loadPreset(payload: { kind: 'prompt' | 'negative'; name: string }): Promise<{ ok: boolean; value?: unknown; error?: string }>;
  deletePreset(payload: { kind: 'prompt' | 'negative'; name: string }): Promise<{ ok: boolean; error?: string }>;
  synthdatGetObjectInfo(payload: { host: string; classType: string; inputName: string }): Promise<{ ok: boolean; values?: string[]; error?: string }>;
  synthdatQueueAndFetch(payload: { host: string; imageFilename: string | null; imageBytes: Uint8Array | null; prompt: any }): Promise<{ ok: boolean; imageBytes?: Uint8Array; pass1ImageBytes?: Uint8Array; error?: string; interrupted?: boolean }>;
  synthdatStopGeneration(host: string): Promise<{ ok: boolean }>;
  galleryListDir(payload: { folder: string; relDir: string }): Promise<{ ok: boolean; entries?: { name: string; kind: 'file' | 'directory'; mtime?: number }[]; error?: string }>;
  galleryRead(payload: { folder: string; relPath: string }): Promise<{ ok: boolean; base64?: string; mime?: string; error?: string }>;
  onPreviewFrame(callback: (event: unknown, data: { mime: string; bytes: Uint8Array }) => void): void;
  onGenProgress(callback: (event: unknown, data: { value: number; max: number }) => void): void;
}
declare global { interface Window { electronAPI: ElectronAPI; } }
export {};

import {
  mountGallerySidebar, attachPickerModal, optionsFromDatalist,
  showImageLightbox, nextFileNumber, bytesToBase64, base64ToBytes
} from './shared/index';
import type { StorageBackend, DirEntry } from './shared/storage';

function $<T extends HTMLElement>(id: string): T { return document.getElementById(id) as T; }

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
const genStatus = $<HTMLDivElement>('genStatus');
const livePreviewWrap = $<HTMLDivElement>('livePreviewWrap');
const livePreview = $<HTMLImageElement>('livePreview');
const preview = $<HTMLImageElement>('preview');
const previewEmpty = $<HTMLDivElement>('previewEmpty');
const logBox = $<HTMLDivElement>('log');

function log(msg: string): void {
  const line = document.createElement('div');
  line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  logBox.appendChild(line);
  logBox.scrollTop = logBox.scrollHeight;
}

function getHost(): string { return (host.value || '').trim() || 'http://127.0.0.1:8188'; }

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
  if (res.ok) { negative.value = String(res.value || ''); log(`Loaded negative preset "${name}".`); }
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
  const [unetValues, clipValues, vaeValues, mainLoraValues, loraValues] = await Promise.all([
    fetchComboValues('UNETLoader', 'unet_name'),
    fetchComboValues('CLIPLoader', 'clip_name'),
    fetchComboValues('VAELoader', 'vae_name'),
    fetchComboValues('DSM Lora Name', 'lora_name'),
    fetchComboValues('DSM Lora Loader Stack', 'lora_01')
  ]);
  if (unetValues) fillDatalist(diffModelList, unetValues);
  if (clipValues) fillDatalist(clipList, clipValues);
  if (vaeValues) fillDatalist(vaeList, vaeValues);
  if (mainLoraValues) fillDatalist(mainLoraList, mainLoraValues);
  if (loraValues) { loraCombo = loraValues; fillDatalist(loraList, loraValues); }
  log('Model lists refreshed.');
});

// Model fields are readonly tap-targets opening the shared picker modal
// (same UI as mobile) — no native datalist popup. The <datalist> elements
// stay purely as option stores.
attachPickerModal(diffModel, 'Diffusion model', () => optionsFromDatalist(diffModelList));
attachPickerModal(clip, 'CLIP', () => optionsFromDatalist(clipList));
attachPickerModal(vae, 'VAE', () => optionsFromDatalist(vaeList));
attachPickerModal(mainLora, 'Main LoRA', () => optionsFromDatalist(mainLoraList));
attachPickerModal(upscaleModel, 'Upscale model', () => optionsFromDatalist(upscaleModelList));

// Upscale models are read straight off disk (the local ComfyUI install's own
// upscale_models folder), not via a live ComfyUI connection — refreshable
// independently of "Refresh model lists" above, and loaded once at startup.
async function refreshUpscaleModels(): Promise<void> {
  const res = await window.electronAPI.listUpscaleModels();
  if (!res.ok) { log(res.error || 'Could not list upscale models.'); return; }
  fillDatalist(upscaleModelList, res.values || []);
  log(`Found ${(res.values || []).length} upscale model(s) on disk.`);
}
btnRefreshUpscaleModels.addEventListener('click', refreshUpscaleModels);
refreshUpscaleModels();
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
  const prompt: any = JSON.parse(JSON.stringify(template));
  const unified = unifiedPromptMode.checked;
  const characterVal = [unified ? fieldValue(unifiedPrompt) : fieldValue(character), fieldValue(characterTrigger)].filter(Boolean).join(', ');

  prompt['21'].inputs.value = fieldValue(global_);
  prompt['8'].inputs.value = unified ? '' : fieldValue(rating);
  prompt['19'].inputs.value = '';
  prompt['11'].inputs.value = characterVal;
  prompt['12'].inputs.value = unified ? '' : fieldValue(hair);
  prompt['15'].inputs.value = unified ? '' : fieldValue(face);
  prompt['18'].inputs.value = unified ? '' : fieldValue(chest);
  prompt['9'].inputs.value = unified ? '' : fieldValue(body_);
  prompt['6'].inputs.value = unified ? '' : fieldValue(clothes);
  prompt['20'].inputs.value = unified ? '' : fieldValue(limbs);
  prompt['14'].inputs.value = unified ? '' : fieldValue(sexual);
  prompt['7'].inputs.value = unified ? '' : fieldValue(pose);
  prompt['10'].inputs.value = unified ? '' : fieldValue(extra);
  prompt['13'].inputs.value = unified ? '' : fieldValue(effects);
  prompt['17'].inputs.value = unified ? '' : fieldValue(scene);
  prompt['16'].inputs.text = fieldValue(negative);

  prompt['41'].inputs.unet_name = diffModel.value;
  prompt['51'].inputs.lora_name = mainLora.value.trim() || 'None';
  if (clip.value) { prompt['249'].inputs.clip_name = clip.value; prompt['47:45'].inputs.clip_name = clip.value; }
  if (vae.value) prompt['47:46'].inputs.vae_name = vae.value;

  const chunks: LoraRow[][] = [];
  for (let i = 0; i < loraRows.length; i += 4) chunks.push(loraRows.slice(i, i + 4));
  function fillStackInputs(inputs: Record<string, unknown>, chunk: LoraRow[]): void {
    for (let i = 0; i < 4; i++) {
      const slot = String(i + 1).padStart(2, '0');
      const r = chunk[i];
      inputs[`lora_${slot}`] = r ? (r.input.value.trim() || 'None') : 'None';
      inputs[`strength_${slot}`] = r ? (parseFloat(r.strength.value) || 0) : 0;
    }
  }
  let lastStackId = '237';
  fillStackInputs(prompt['237'].inputs, chunks[0] || []);
  for (let c = 1; c < chunks.length; c++) {
    const newId = `237_extra_${c}`;
    const newInputs: any = { model: [lastStackId, 0], clip: ['47:45', 0] };
    fillStackInputs(newInputs, chunks[c]);
    prompt[newId] = { class_type: 'DSM Lora Loader Stack', inputs: newInputs, _meta: { title: 'DSM Lora Loader Stack' } };
    lastStackId = newId;
  }
  if (lastStackId !== '237') {
    prompt['243'].inputs.input1 = [lastStackId, 0];
    prompt['240'].inputs.model = [lastStackId, 0];
    prompt['195'].inputs.model = [lastStackId, 0];
  }

  if (skipRefImage.checked) {
    delete prompt['239'];
    delete prompt['240'];
    delete prompt['243'];
    delete prompt['238'];
    delete prompt['246'];
    prompt['158:53'].inputs.model = [lastStackId, 0];
    prompt['158:54'].inputs.model = [lastStackId, 0];
  } else {
    prompt['240'].inputs.strength = parseFloat(lliteStrength.value) || 0;
    prompt['240'].inputs.start_percent = parseFloat(lliteStartPercent.value) || 0;
    prompt['240'].inputs.end_percent = parseFloat(lliteEndPercent.value) || 0;
    prompt['240'].inputs.preserve_wrapper = llitePreserveWrapper.checked;
    prompt['243'].inputs.select = 2;
    prompt['238'].inputs.fit = resizeFit.value;
    prompt['238'].inputs.method = resizeMethod.value;
    prompt['240'].inputs.image = ['238', 0];
  }

  prompt['168:167'].inputs.sampler_name = sampler.value;
  prompt['158:53'].inputs.scheduler = scheduler.value;
  prompt['158:53'].inputs.steps = parseInt(steps1.value, 10) || 1;
  prompt['158:54'].inputs.cfg = parseFloat(cfg1.value) || 1;

  prompt['174:171'].inputs.value = parseInt(width.value, 10) || 920;
  prompt['174:172'].inputs.value = parseInt(height.value, 10) || 1244;

  prompt['165'].inputs.noise_seed = parseInt(seed1.value, 10) || 0;

  if (use2Pass.checked) {
    prompt['227'].inputs.noise_seed = parseInt(seed2.value, 10) || 0;
    prompt['195'].inputs.denoise = parseFloat(denoise2.value) || 0;
    prompt['195'].inputs.scheduler = scheduler.value;
    prompt['195'].inputs.steps = parseInt(steps2.value, 10) || 1;
    prompt['192_pass1'] = { class_type: 'SaveImage', inputs: { filename_prefix: prompt['192'].inputs.filename_prefix, images: ['176', 0] }, _meta: { title: 'Pass 1 preview' } };
  } else {
    delete prompt['190'];
    delete prompt['191'];
    delete prompt['195'];
    delete prompt['227'];
    delete prompt['224'];
    prompt['192'].inputs.images = ['176', 0];
  }

  // ---- Optional model-based upscale, inserted right before each SaveImage ----
  // (192, and 192_pass1 if 2-Pass produced one). Matches the user's own
  // reference workflow's "Upscale Result" branch exactly: UpscaleModelLoader
  // -> ImageUpscaleWithModel -> ImageScaleBy(lanczos, scale_by) -> SaveImage —
  // the ImageScaleBy step matters, not just cosmetic: model upscalers here
  // are fixed-ratio (e.g. a "4x" ESRGAN model always outputs 4x regardless of
  // want), so scale_by brings that back down to whatever the user actually
  // wants (0.5 on a 4x model = a net 2x upscale).
  if (upscaleEnabled.checked && upscaleModel.value.trim()) {
    prompt['upscale_model_loader'] = { class_type: 'UpscaleModelLoader', inputs: { model_name: upscaleModel.value.trim() }, _meta: { title: 'Upscale Model Loader' } };
    const scaleBy = parseFloat(upscaleScaleBy.value) || 1;
    for (const saveId of ['192', '192_pass1']) {
      if (!prompt[saveId]) continue;
      const upscaleId = `upscale_model_${saveId}`;
      const scaleId = `upscale_scale_${saveId}`;
      prompt[upscaleId] = { class_type: 'ImageUpscaleWithModel', inputs: { upscale_model: ['upscale_model_loader', 0], image: prompt[saveId].inputs.images }, _meta: { title: 'Upscale' } };
      prompt[scaleId] = { class_type: 'ImageScaleBy', inputs: { upscale_method: 'lanczos', scale_by: scaleBy, image: [upscaleId, 0] }, _meta: { title: 'Upscale scale-by' } };
      prompt[saveId].inputs.images = [scaleId, 0];
    }
  }

  return prompt;
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

  // Sequential filenames shared with mobile: N.png (N_pass1.png for the
  // first pass of a 2-Pass run), counted from the output folder's own files.
  const n = await nextFileNumber(desktopBackend());
  let saveFailed = false;
  if (res.pass1ImageBytes) {
    // 2-Pass: save BOTH passes, per this app's whole reason for existing —
    // SynthDat only ever keeps one (via Accept), this keeps both always.
    const s1 = await saveBytes(res.pass1ImageBytes, `${n}_pass1.png`);
    const s2 = await saveBytes(res.imageBytes!, `${n}.png`);
    if (!s1 || !s2) saveFailed = true;
    preview.src = URL.createObjectURL(new Blob([res.imageBytes as BlobPart], { type: 'image/png' }));
  } else if (res.imageBytes) {
    if (!(await saveBytes(res.imageBytes, `${n}.png`))) saveFailed = true;
    preview.src = URL.createObjectURL(new Blob([res.imageBytes as BlobPart], { type: 'image/png' }));
  }
  if (saveFailed) {
    genStatus.style.display = 'block';
    genStatus.textContent = 'Generated, but saving failed — see Log for details.';
  }
  preview.style.display = 'block';
  previewEmpty.style.display = 'none';
}

btnGenerate.addEventListener('click', generate);
btnStop.addEventListener('click', async () => {
  await window.electronAPI.synthdatStopGeneration(getHost());
});

// ---------------- Init ----------------

mountGallerySidebar(desktopBackend, () => outputFolder || 'No folder chosen', { navigable: true });
preview.addEventListener('click', () => { if (preview.src) showImageLightbox(preview.src); });
window.electronAPI.getAppVersion().then((v) => { $<HTMLSpanElement>('appVersion').textContent = `v${v}`; }).catch(() => {});
log('Comfy Bridge ready. Pick an output folder, set your host, and Generate.');
