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
import { openThemeStudio } from './theme-studio';
import { bridgeIcon } from './shared/icons';
import { initUiZoom, buildUiZoomRow } from './ui-zoom';
import { buildGenInfoPanel, stampOutputKind } from './gen-info';
import { characterIndex, recognizeCharacter, ratingFolder, nextSavePath, safeSegment, fileBaseName, joinNameParts, previewFileName } from './file-naming';
import { initTagWiki } from './shared/tag-wiki';
export {};

interface ElectronAPI {
  setZoomFactor(factor: number): void;
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
  // Local ComfyUI (comfy-local.ts); absent on older preloads.
  comfyLocalStatus?(): Promise<ComfyLocalStatus>;
  comfyLocalPickFolder?(): Promise<ComfyLocalStatus>;
  comfyLocalConnect?(): Promise<{ ok: boolean; comfyVersion?: string; error?: string }>;
  comfyLocalSetPersist?(on: boolean): Promise<ComfyLocalStatus>;
  comfyRelayStatus?(): Promise<RelayStatus>;
  comfyRelaySet?(payload: { enabled: boolean; port: number }): Promise<RelayStatus>;
}
interface RelayStatus {
  enabled: boolean; port: number; running: boolean; error: string;
  servedBy?: 'bridge' | 'comfy';
  addresses: { ip: string; tailscale: boolean }[];
}
interface ComfyLocalStatus { folder: string; ok: boolean; error?: string; python?: string; running: boolean; persist?: boolean; }
declare global { interface Window { electronAPI: ElectronAPI; } }
export {};

import {
  mountGallerySidebar, attachPickerModal, optionsFromDatalist,
  showImageLightbox, bytesToBase64, base64ToBytes
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
// A width change re-wraps the text without any 'input' (the Text size
// slider's page zoom, a window resize, dragging the right column), which left
// boxes at their old height with the extra lines cut off. Re-fit on width
// changes only: autoGrow's own height change must not re-trigger it.
const autoGrowWidths = new WeakMap<Element, number>();
const autoGrowObserver = new ResizeObserver((entries) => {
  for (const e of entries) {
    const w = e.contentRect.width;
    if (autoGrowWidths.get(e.target) === w) continue;
    autoGrowWidths.set(e.target, w);
    if (w > 0) autoGrow(e.target as HTMLTextAreaElement);
  }
});
document.querySelectorAll('textarea').forEach((el) => autoGrowObserver.observe(el));
function autoGrowAll(): void {
  document.querySelectorAll<HTMLTextAreaElement>('textarea').forEach((el) => {
    autoGrowObserver.observe(el);
    autoGrow(el);
  });
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
const mainLoraStrength = $<HTMLInputElement>('mainLoraStrength');
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

// ---------------- Backend: ComfyUI server or Local ComfyUI ----------------
// Local = the user's own ComfyUI install, launched by the Bridge (main
// process comfy-local.ts, shared with Osmium) with only the workflow's nodes.
// Every IPC call takes 'local' as the host to use it; nothing else differs.
const LOCAL_HOST = 'local';
const hasLocalComfy = typeof window.electronAPI.comfyLocalStatus === 'function';
const backendRow = $<HTMLDivElement>('backendRow');
const backend = $<HTMLSelectElement>('backend');
const localFields = $<HTMLDivElement>('localFields');
const btnPickComfyFolder = $<HTMLButtonElement>('btnPickComfyFolder');
const comfyFolderLabel = $<HTMLSpanElement>('comfyFolderLabel');
function isLocal(): boolean { return hasLocalComfy && backend.value === 'local'; }

function getHost(): string { return isLocal() ? LOCAL_HOST : ((host.value || '').trim() || 'http://127.0.0.1:8188'); }

// Persist Comfy: the runner stays open (models loaded) after Comfy Bridge
// closes; Connect reconnects to it. The setting lives in the main process
// (comfy-local.json) and applies the next time Local ComfyUI starts.
const persistRow = $<HTMLDivElement>('persistRow');
const persistComfy = $<HTMLInputElement>('persistComfy');
const hasPersist = typeof window.electronAPI.comfyLocalSetPersist === 'function';
if (hasPersist) {
  persistComfy.addEventListener('change', async () => {
    const s = await window.electronAPI.comfyLocalSetPersist!(persistComfy.checked);
    showLocalStatus(s);
    if (s.running) log(persistComfy.checked
      ? 'Persist Comfy is on. It applies the next time Local ComfyUI starts; the one open now still closes with Comfy Bridge.'
      : 'Persist Comfy is off. A Local ComfyUI window that was kept open stays open until you close it.');
  });
}

function showLocalStatus(s: ComfyLocalStatus): void {
  comfyFolderLabel.textContent = s.folder ? (s.ok ? s.folder : `${s.folder} — ${s.error}`) : 'No folder chosen';
  comfyFolderLabel.style.color = s.folder && !s.ok ? 'var(--danger, #e06c6c)' : '';
  persistComfy.checked = !!s.persist;
}
// Network relay (main-process local-relay.ts): the phone app connects to
// http://<this PC's address>:<port> as if it were a ComfyUI server. Its
// on/off + port live in the main process (userData/comfy-relay.json), not
// the UI-state snapshot.
const relayRow = $<HTMLDivElement>('relayRow');
const relayEnabled = $<HTMLInputElement>('relayEnabled');
const relayPort = $<HTMLInputElement>('relayPort');
const relayInfo = $<HTMLDivElement>('relayInfo');
const hasRelay = typeof window.electronAPI.comfyRelayStatus === 'function';
function showRelayStatus(s: RelayStatus): void {
  relayEnabled.checked = s.enabled;
  relayPort.value = String(s.port);
  relayInfo.style.display = s.enabled ? 'block' : 'none';
  relayInfo.style.color = s.error ? 'var(--accent-danger)' : '';
  if (s.error) { relayInfo.textContent = s.error; return; }
  const ts = s.addresses.filter((a) => a.tailscale).map((a) => `http://${a.ip}:${s.port}`);
  const lan = s.addresses.filter((a) => !a.tailscale).map((a) => `http://${a.ip}:${s.port}`);
  const byComfy = s.servedBy === 'comfy';
  relayInfo.textContent = s.running
    ? `Phone: set its host to ${ts.length ? ts.join(' or ') + ' (Tailscale)' : lan[0] || `port ${s.port}`}` +
      (ts.length && lan.length ? `, or ${lan.join(' / ')} on the same Wi-Fi` : '') + '. ' +
      (byComfy
        ? 'Served by Local ComfyUI itself (Persist Comfy), so it keeps working after Comfy Bridge closes, until you close its window. Windows may ask to allow its Python through the firewall.'
        : 'Windows may ask to allow Comfy Bridge through the firewall.')
    : byComfy
      ? 'With Persist Comfy on, Local ComfyUI serves the phone itself, even after Comfy Bridge closes. Click Connect to start it.'
      : 'Not running.';
}
async function applyRelay(): Promise<void> {
  showRelayStatus(await window.electronAPI.comfyRelaySet!({ enabled: relayEnabled.checked, port: Number(relayPort.value) }));
}
if (hasRelay) {
  relayEnabled.addEventListener('change', applyRelay);
  relayPort.addEventListener('change', () => { if (relayEnabled.checked) applyRelay(); });
}

function applyBackendUI(): void {
  const local = isLocal();
  localFields.style.display = local ? '' : 'none';
  relayRow.style.display = local && hasRelay ? '' : 'none';
  persistRow.style.display = local && hasPersist ? '' : 'none';
  if (!local) relayInfo.style.display = 'none';
  host.style.display = local ? 'none' : '';
  btnConnect.textContent = local ? 'Connect' : 'Test';
  btnConnect.title = local ? 'Start your ComfyUI install (opens its own console window)' : 'Check that the ComfyUI server answers';
  if (local) window.electronAPI.comfyLocalStatus!().then(showLocalStatus).catch(() => {});
  if (local && hasRelay) window.electronAPI.comfyRelayStatus!().then(showRelayStatus).catch(() => {});
}
if (hasLocalComfy) {
  backendRow.style.display = '';
  backend.addEventListener('change', applyBackendUI);
  btnPickComfyFolder.addEventListener('click', async () => {
    const s = await window.electronAPI.comfyLocalPickFolder!();
    showLocalStatus(s);
    connStatus.style.display = 'none';
  });
}

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
    extra: extra.value,
    // The character folder choice belongs to the character (v2.0.0).
    charMode: charMode(),
    charTagName: charTagName.value,
    charCustomName: charCustomName.value
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
  const mode = String(fields.charMode || 'tag');
  charModeTag.checked = mode === 'tag';
  charModeOC.checked = mode === 'oc';
  charModeCustom.checked = mode === 'custom';
  charTagName.value = String(fields.charTagName || '');
  charCustomName.value = String(fields.charCustomName || '');
  applyNamingUI();
  applyUnifiedPromptModeUI();
  void refreshSavePreview();
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
  if (isLocal()) {
    // Starts the runner (its console window appears after a few seconds;
    // loading takes 15-60s), then fills the model lists from it.
    connStatus.textContent = 'Starting local ComfyUI… its console window shows progress.';
    const started = await window.electronAPI.comfyLocalConnect!();
    if (!started.ok) { connStatus.textContent = started.error || 'Could not start local ComfyUI.'; return; }
    connStatus.style.color = 'var(--accent-ok)';
    connStatus.textContent = `✓ Local ComfyUI ${started.comfyVersion || ''} is running`;
    btnRefreshModels.click();
    // With Persist Comfy, connecting is what makes Local ComfyUI start serving
    // the phone (main applies it right after the runner comes up).
    if (hasRelay) setTimeout(() => window.electronAPI.comfyRelayStatus!().then(showRelayStatus).catch(() => {}), 1500);
    return;
  }
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
// The relay's settings are the main process's (comfy-relay.json).
const UI_EXCLUDED = new Set<string>(['relayEnabled', 'relayPort', 'persistComfy']);
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
  applyBackendUI();
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

// ---------------- Themes (Osmium palettes + a Theme Studio Custom) ----------------
// The 25 palettes and their CSS-variable mapping live in the shared module
// (shared/themes.ts + shared/theme-data.ts) so desktop and mobile run the
// same set. Palettes are colors only; Custom, built in Theme Studio
// (./theme-studio.ts, desktop only — the menu's last entry), also carries
// faces, shapes, a button fill and surfaces. initTheme() reads/writes
// comfybridge-theme; mountThemePicker() wires the popover (native <select>
// popup refused to expand in this Electron window).
initTheme(THEMES, DEFAULT_THEME);
initUiZoom();
const themePicker = mountThemePicker({
  wrap: 'themeWrap', btn: 'themeBtn', btnLabel: 'themeBtnLabel', menu: 'themeMenu',
  onStudio: () => openThemeStudio({ onSaved: () => themePicker.refresh() }),
  menuTop: buildUiZoomRow,
});

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

// ---------------- File naming ----------------
// Two parts (./file-naming.ts): automatic folders the user can see but not
// change (rating, Upscaled), and the user's own — the character folder (tag
// list / OC / custom) and the filename's fixed-order toggles. The preview
// shows where the next generation will save.
const charModeTag = $<HTMLInputElement>('charModeTag');
const charModeOC = $<HTMLInputElement>('charModeOC');
const charModeCustom = $<HTMLInputElement>('charModeCustom');
const charTagWrap = $<HTMLDivElement>('charTagWrap');
const charTagName = $<HTMLInputElement>('charTagName');
const charCustomName = $<HTMLInputElement>('charCustomName');
const charFolderSuggest = $<HTMLDivElement>('charFolderSuggest');
const charModeNote = $<HTMLDivElement>('charModeNote');
const namingAutoRating = $<HTMLDivElement>('namingAutoRating');
const namingAutoUpscaled = $<HTMLDivElement>('namingAutoUpscaled');
const fnCharacter = $<HTMLInputElement>('fnCharacter');
const fnLora = $<HTMLInputElement>('fnLora');
const fnGen = $<HTMLInputElement>('fnGen');
const fnGenParts = $<HTMLDivElement>('fnGenParts');
const fnModel = $<HTMLInputElement>('fnModel');
const fnSampler = $<HTMLInputElement>('fnSampler');
const fnScheduler = $<HTMLInputElement>('fnScheduler');
const fnSteps = $<HTMLInputElement>('fnSteps');
const fnCfg = $<HTMLInputElement>('fnCfg');
const fnSeed = $<HTMLInputElement>('fnSeed');
const savePathPreview = $<HTMLDivElement>('savePathPreview');
const savePathSummary = $<HTMLDivElement>('savePathSummary');
const outputIsComfyOutput = $<HTMLInputElement>('outputIsComfyOutput');
const keepComfyCopy = $<HTMLInputElement>('keepComfyCopy');
const keepComfyCopyRow = $<HTMLLabelElement>('keepComfyCopyRow');

type CharMode = 'tag' | 'oc' | 'custom';
function charMode(): CharMode { return charModeOC.checked ? 'oc' : charModeCustom.checked ? 'custom' : 'tag'; }

interface SaveNaming { relDir: string; base: string; rating: string; character: string; recognized: string; }

function joinRel(...parts: string[]): string { return parts.filter(Boolean).join('/'); }

// The text the rating folder is read from: the Rating field, or the unified
// prompt in unified mode (it has no separate Rating field).
function ratingText(): string { return unifiedPromptMode.checked ? unifiedPrompt.value : rating.value; }

async function currentNaming(): Promise<SaveNaming> {
  let recognized = '';
  try { recognized = safeSegment(recognizeCharacter(fieldValue(character), await characterIndex())); } catch { /* tag list unavailable */ }
  const mode = charMode();
  const characterName = mode === 'oc' ? 'OC'
    : mode === 'custom' ? safeSegment(charCustomName.value)
    : safeSegment(charTagName.value) || recognized;
  const ratingName = ratingFolder(ratingText());
  const lora = mainLora.value && mainLora.value !== 'None' && mainLora.value !== 'Anima-n' ? fileBaseName(mainLora.value) : '';
  const cfgNum = parseFloat(cfg1.value);
  const gen = fnGen.checked;
  const base = joinNameParts([
    fnCharacter.checked ? characterName : '',
    fnLora.checked ? lora : '',
    gen && fnModel.checked ? fileBaseName(diffModel.value) : '',
    gen && fnSampler.checked ? sampler.value : '',
    gen && fnScheduler.checked ? scheduler.value : '',
    gen && fnSteps.checked && steps1.value ? `steps${steps1.value}` : '',
    gen && fnCfg.checked && !isNaN(cfgNum) ? `cfg${parseFloat(cfgNum.toFixed(2))}` : '',
    gen && fnSeed.checked && seed1.value ? `seed${seed1.value}` : '',
  ]);
  return { relDir: joinRel(ratingName, characterName), base, rating: ratingName, character: characterName, recognized };
}

function applyNamingUI(): void {
  const mode = charMode();
  charTagWrap.style.display = mode === 'tag' ? '' : 'none';
  charCustomName.style.display = mode === 'custom' ? '' : 'none';
  fnGenParts.style.display = fnGen.checked ? '' : 'none';
  keepComfyCopyRow.style.display = outputIsComfyOutput.checked ? 'none' : '';
}

let previewToken = 0;
async function refreshSavePreview(): Promise<void> {
  const token = ++previewToken;
  const n = await currentNaming();
  if (token !== previewToken) return;

  namingAutoRating.textContent = n.rating
    ? `Rating: ${n.rating} (the ${unifiedPromptMode.checked ? 'prompt' : 'Rating field'} says ${n.rating})`
    : `Rating: none, so images go straight into the output folder (the ${unifiedPromptMode.checked ? 'prompt' : 'Rating field'} says neither explicit nor safe)`;
  namingAutoUpscaled.textContent = upscaleEnabled.checked
    ? 'Upscaled: on, upscaled images go in an Upscaled folder inside'
    : 'Upscaled: off';

  const mode = charMode();
  charTagName.placeholder = n.recognized ? `${n.recognized} (recognized)` : 'Type to search Danbooru characters';
  charModeNote.textContent = mode === 'oc' ? 'Original characters all go in one OC folder.'
    : mode === 'custom' ? (n.character ? '' : 'Empty: no character folder.')
    : charTagName.value.trim() ? ''
    : n.recognized ? 'Empty: uses the character recognized in the Character field.'
    : 'No character recognized in the Character field, so no character folder.';

  // The middle column's one-line summary (the full breakdown is in the drawer).
  savePathSummary.textContent = '';
  const sumLabel = document.createElement('span');
  sumLabel.className = 'muted';
  sumLabel.textContent = 'Saves as: ';
  savePathSummary.append(sumLabel, joinRel(n.relDir, previewFileName(n.base)).split('/').join(' / '));

  // The path, one folder per line, automatic parts greyed.
  savePathPreview.innerHTML = '';
  const head = document.createElement('div');
  head.className = 'naming-preview-head';
  head.textContent = 'Saves to';
  savePathPreview.appendChild(head);
  const line = (text: string, cls: string, depth: number): void => {
    const el = document.createElement('div');
    el.className = `naming-preview-line ${cls}`;
    el.style.paddingLeft = `${depth * 14}px`;
    el.textContent = (depth ? '└ ' : '') + text;
    savePathPreview.appendChild(el);
  };
  let depth = 0;
  line(outputFolder || 'Output folder (not chosen yet)', 'root', depth++);
  if (n.rating) line(n.rating, 'auto', depth++);
  if (n.character) line(n.character, 'user', depth++);
  line(previewFileName(n.base), 'file', depth);
  if (upscaleEnabled.checked) {
    const up = document.createElement('div');
    up.className = 'muted small';
    up.textContent = 'Upscaled copies: the same name in an Upscaled folder next to it.';
    savePathPreview.appendChild(up);
  }
}
let previewTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePreview(): void {
  if (previewTimer) clearTimeout(previewTimer);
  previewTimer = setTimeout(() => { applyNamingUI(); void refreshSavePreview(); }, 120);
}
// Any field can change the preview (character, rating text, sampler, seed…).
document.addEventListener('input', schedulePreview, true);
document.addEventListener('change', schedulePreview, true);

// Danbooru character suggestions under the tag-list field.
function hideCharSuggest(): void { charFolderSuggest.hidden = true; charFolderSuggest.innerHTML = ''; }
charTagName.addEventListener('input', async () => {
  const q = charTagName.value.trim().toLowerCase();
  if (q.length < 2) { hideCharSuggest(); return; }
  const { names } = await characterIndex();
  if (charTagName.value.trim().toLowerCase() !== q) return;
  const starts: string[] = [];
  const contains: string[] = [];
  for (const nm of names) {
    const l = nm.toLowerCase();
    if (l.startsWith(q)) starts.push(nm);
    else if (l.includes(q)) contains.push(nm);
    if (starts.length >= 10) break;
  }
  const picks = [...starts, ...contains].slice(0, 10);
  charFolderSuggest.innerHTML = '';
  if (!picks.length || (picks.length === 1 && picks[0] === charTagName.value)) { hideCharSuggest(); return; }
  for (const nm of picks) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'naming-suggest-item';
    b.textContent = nm;
    b.addEventListener('mousedown', (ev) => {
      ev.preventDefault();
      charTagName.value = nm;
      hideCharSuggest();
      charTagName.dispatchEvent(new Event('change', { bubbles: true }));
    });
    charFolderSuggest.appendChild(b);
  }
  charFolderSuggest.hidden = false;
});
charTagName.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') hideCharSuggest();
  else if (ev.key === 'Enter' && !charFolderSuggest.hidden) {
    const first = charFolderSuggest.querySelector<HTMLButtonElement>('.naming-suggest-item');
    if (first) { ev.preventDefault(); first.dispatchEvent(new MouseEvent('mousedown')); }
  }
});
charTagName.addEventListener('blur', hideCharSuggest);

// restoreUiState() already ran (above) without firing 'change'.
applyNamingUI();
void refreshSavePreview();

// ---------------- Right-side slideouts ----------------
// Generation settings (resolution, sampling, 2-Pass, upscale) and file
// saving (folders, filename) moved out of the middle column into drawers, as
// on Android. One open at a time; the backdrop, Escape or ✕ closes it.
const sideDrawerBackdrop = $<HTMLDivElement>('sideDrawerBackdrop');
const sideDrawers: [HTMLButtonElement, HTMLElement][] = [
  [$<HTMLButtonElement>('genSettingsToggle'), $<HTMLElement>('genSettingsDrawer')],
  [$<HTMLButtonElement>('fileDrawerToggle'), $<HTMLElement>('fileDrawer')],
];
$<HTMLButtonElement>('genSettingsToggle').innerHTML = bridgeIcon('settings');
$<HTMLButtonElement>('fileDrawerToggle').innerHTML = bridgeIcon('folder');
function closeSideDrawers(): void {
  for (const [btn, d] of sideDrawers) { d.classList.remove('open'); btn.classList.remove('active'); }
  sideDrawerBackdrop.classList.remove('open');
}
for (const [btn, drawer] of sideDrawers) {
  btn.addEventListener('click', () => {
    const wasOpen = drawer.classList.contains('open');
    closeSideDrawers();
    if (wasOpen) return;
    drawer.classList.add('open');
    btn.classList.add('active');
    sideDrawerBackdrop.classList.add('open');
  });
  drawer.querySelector<HTMLButtonElement>('.side-drawer-close')!.addEventListener('click', closeSideDrawers);
}
sideDrawerBackdrop.addEventListener('click', closeSideDrawers);
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' && sideDrawers.some(([, d]) => d.classList.contains('open'))) closeSideDrawers();
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
  const prompt = buildPromptForComfy();
  // No ComfyUI copy wanted (the chosen folder IS ComfyUI's output folder, or
  // the user turned its own copy off): the save nodes become PreviewImage, so
  // ComfyUI only writes a temp preview (fetched the same way, type "temp")
  // and the Bridge's named file is the only one saved.
  if (outputIsComfyOutput.checked || !keepComfyCopy.checked) {
    for (const id of ['192', '192_pass1', '192_upscaled']) {
      if (prompt[id]) prompt[id] = { class_type: 'PreviewImage', inputs: { images: prompt[id].inputs.images }, _meta: prompt[id]._meta };
    }
  }
  return prompt;
}

function buildPromptForComfy(): any {
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
    mainLoraStrength: mainLoraStrength.value,
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
// Generate never blocks: it snapshots the prompt, host and reference as they
// are at that moment and queues the job; jobs run one at a time, in order.
// Stop ends the running job and drops the queue.

// `naming` is snapshotted at queue time with the prompt, so a queued job
// saves under the folder/name its own settings produced.
interface GenJob { host: string; prompt: any; imageFilename: string | null; imageBytes: Uint8Array | null; naming: SaveNaming; }
const genQueue: GenJob[] = [];
let genRunning = false;
let genStopped = false;

function queueNote(): string { return genQueue.length ? ` · ${genQueue.length} queued` : ''; }

window.electronAPI.onPreviewFrame((_event, data) => {
  const blob = new Blob([data.bytes as BlobPart], { type: data.mime });
  livePreview.src = URL.createObjectURL(blob);
  livePreviewWrap.style.display = 'flex';
});
window.electronAPI.onGenProgress((_event, data) => {
  if (!data || !data.max) return;
  genStatus.textContent = `Generating… step ${data.value}/${data.max}${queueNote()}`;
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
  if (!skipRefImage.checked && !refFile) { log('Pick a reference image first (or check "No reference image").'); return; }
  await loadTemplate();
  genQueue.push({
    host: getHost(),
    prompt: buildPrompt(),
    imageFilename: skipRefImage.checked ? null : refFilename,
    imageBytes: skipRefImage.checked ? null : new Uint8Array(await refFile!.arrayBuffer()),
    naming: await currentNaming()
  });
  if (genRunning) {
    log(`Queued a generation (${genQueue.length} waiting).`);
    genStatus.textContent = (genStatus.textContent || 'Generating…').replace(/ · \d+ queued$/, '') + queueNote();
    return;
  }
  genRunning = true;
  genStopped = false;
  btnStop.disabled = false;
  btnGenerate.title = 'Queue another generation with the current settings';
  try {
    while (genQueue.length && !genStopped) await runGenJob(genQueue.shift()!);
  } finally {
    genRunning = false;
    genQueue.length = 0;
    btnStop.disabled = true;
    btnGenerate.title = '';
  }
}

async function runGenJob(job: GenJob): Promise<void> {
  livePreview.src = '';
  livePreviewWrap.style.display = 'none';
  genStatus.style.display = 'block';
  genStatus.textContent = 'Generating… this can take a while.' + queueNote();

  const res = await window.electronAPI.synthdatQueueAndFetch(job);

  livePreviewWrap.style.display = 'none';

  if (!res.ok) {
    genStatus.textContent = res.interrupted ? '' : (res.error || 'Generation failed.') + queueNote();
    if (res.interrupted) { genStatus.style.display = 'none'; log('Generation stopped.'); }
    else log(res.error || 'Generation failed.');
    return;
  }
  genStatus.style.display = 'none';

  // v2.0.0: the folder and name come from the Bridge's own naming (the job's
  // snapshot, ./file-naming.ts: rating / character / pattern), no longer
  // from ComfyUI's File Namer chain, whose character detection misfired
  // (score_7 -> a "7-tan" folder). Each copy gets the next free counter for
  // its folder + name, so nothing is overwritten.
  const backend = desktopBackend();
  const taken = new Set<string>();
  const savePath = (upscaled: boolean): Promise<string> =>
    nextSavePath(backend, upscaled ? joinRel(job.naming.relDir, 'Upscaled') : job.naming.relDir, job.naming.base, taken);
  let saveFailed = false;
  const slides: { label: string; bytes: Uint8Array }[] = [];
  // 2-Pass: save BOTH passes, per this app's whole reason for existing —
  // SynthDat only ever keeps one (via Accept), this keeps both always.
  // Each saved copy is stamped with which output it is (./gen-info.ts): the
  // gallery's parameters panel can't tell pass 1 from pass 2 otherwise.
  if (res.pass1ImageBytes) {
    if (!(await saveBytes(stampOutputKind(res.pass1ImageBytes, 'pass1'), await savePath(false)))) saveFailed = true;
    slides.push({ label: 'Pass 1', bytes: res.pass1ImageBytes });
  }
  if (res.imageBytes) {
    if (!(await saveBytes(stampOutputKind(res.imageBytes, res.pass1ImageBytes ? 'pass2' : 'single'), await savePath(false)))) saveFailed = true;
    slides.push({ label: res.pass1ImageBytes ? 'Pass 2' : 'Pass 1', bytes: res.imageBytes });
  }
  if (res.upscaledImageBytes) {
    if (!(await saveBytes(stampOutputKind(res.upscaledImageBytes, 'upscaled'), await savePath(true)))) saveFailed = true;
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
  diffModel, clip, vae, mainLora, mainLoraStrength,
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
  if (s('248', 'strength_model')) mainLoraStrength.value = s('248', 'strength_model');
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
  genStopped = true;
  const dropped = genQueue.length;
  genQueue.length = 0;
  if (dropped) log(`Dropped ${dropped} queued generation${dropped === 1 ? '' : 's'}.`);
  await window.electronAPI.synthdatStopGeneration(getHost());
});

// ---------------- Init ----------------

mountGallerySidebar(desktopBackend, () => outputFolder || 'No folder chosen', {
  navigable: true,
  // Generation parameters left of an opened gallery image (./gen-info.ts);
  // "Use these settings" loads them like Import generation and closes it.
  imageInfo: (src, close) => buildGenInfoPanel(src, (prompt) => {
    applyImportedPrompt(prompt);
    log('Loaded generation settings from a gallery image.');
    close();
  }),
});
initTagWiki($<HTMLButtonElement>('btnTagWiki'));
refreshSamplerLists();
window.electronAPI.getAppVersion().then((v) => { $<HTMLSpanElement>('appVersion').textContent = `v${v}`; }).catch(() => {});
log('Comfy Bridge ready. Pick an output folder, set your host, and Generate.');
