// Phase B module: SynthDat Overseer — generates synthetic dataset images via
// a ComfyUI instance, using one fixed, hand-built workflow
// (`renderer/data/synthdat-workflow.json`, captured verbatim from ComfyUI's
// own `/history` in API format — see CLAUDE.md's SynthDat Overseer section
// for why that capture method was used instead of hand-converting the
// workflow-editor JSON). This is deliberately NOT a generic "load any
// ComfyUI workflow" system — the graph shape and every node id referenced
// below are fixed to that one template.
//
// Network calls to ComfyUI go through main.ts (window.electronAPI.synthdat*)
// for the same CORS/origin reasons as the WD14 Autotagger bridge. Writing
// generated/accepted images into the loaded dataset folder happens directly
// here in the renderer via the File System Access API (dirHandle), exactly
// like every other file write in this app — no IPC needed for that part.
import type { DirHandle, Entry, ComfyResult, SynthDatPrompt } from './types';
import {
  synthDatHost, synthDatRefPreviewWrap, synthDatRefPreview, synthDatRefEmpty, synthDatResizedPreviewWrap,
  synthDatResizedPreview, synthDatResizedPreviewLabel, btnSynthDatPickImage, btnSynthDatInterrogate,
  synthDatWd14Result, synthDatTagAssign, btnSynthDatMigratePose, synthDatDiffModel, synthDatUnetDatalist,
  synthDatClip, synthDatClipDatalist, synthDatVae, synthDatVaeDatalist,
  synthDatMainLora, synthDatMainLoraDatalist, synthDatLoraDatalist,
  synthDatLoraStackRows, btnSynthDatAddLora, btnSynthDatRefreshModels, btnSynthDatConnect, synthDatConnStatus,
  synthDatLLLiteStrength, synthDatLLLiteStartPercent, synthDatLLLiteEndPercent, synthDatLLLitePreserveWrapper,
  synthDatResizeFit, synthDatResizeMethod, synthDatSampler, synthDatScheduler,
  synthDatSteps1, synthDatCfg1, synthDatSteps2,
  synthDatPromptFieldsDock, btnSynthDatPromptPanelToggle, btnSynthDatPromptPanelClose,
  synthDatUnifiedPromptMode, synthDatUnifiedPromptRow, synthDatUnifiedPrompt, synthDatSplitFieldsGroup, synthDatStripHairFaceRow,
  synthDatGlobal, synthDatCharacter, synthDatCharacterTrigger,
  synthDatRating, synthDatHair, synthDatFace, synthDatChest, synthDatBody, synthDatClothes,
  synthDatLimbs, synthDatSexual, synthDatPose, synthDatScene, synthDatEffects, synthDatExtra,
  synthDatNegative, synthDatWidth, btnSynthDatSwapReso, synthDatHeight, synthDatResoWarning, synthDatUse2Pass,
  synthDatSeed1, synthDatSeed2, synthDatDenoise2, btnSynthDatGenerate, btnSynthDatStop, synthDatGenStatus,
  synthDatLivePreviewWrap, synthDatLivePreview,
  synthDatPreviewWrap, synthDatPreview, synthDatPreviewEmpty,
  btnSynthDatReinterrogateOutput, synthDatReinterrogateResult, synthDatReinterrogateOverwrite,
  synthDatPassPickerRow, synthDatPickPass1, synthDatPickPass2, synthDatPass1Thumb, synthDatPass2Thumb,
  synthDatStripHairFace, synthDatTagPreview, synthDatRenameOnAccept, btnSynthDatAccept, btnSynthDatReject,
  synthDatMigrateClearFirst, synthDatSkipRefImage, synthDatRefImageSection, synthDatCol1
} from './dom';
import { toast, showImageLightbox, positionMenu } from './shared-ui';
import { attachListAutocomplete } from './tags-autocomplete';
import { parseWd14Tags } from './wd14-tagger';
import { moveEntry, markDirty } from './tags-edit';
import { canonicalRules, activeVoidTagSet, registerVoidRule } from './canonical-tags';
import { openTagDetails } from './tag-details';
import { initSynthDatSectionDocks } from './docks';

// Same key wd14-tagger.ts persists to (Tag Overseer's WD14 settings) — read
// directly rather than importing that module's private state, so this
// module only depends on the localStorage contract, not wd14-tagger.ts's
// internals.
const WD14_SETTINGS_KEY = 'dts-wd14-settings';
function getWd14Settings(){
  try {
    const saved = JSON.parse(localStorage.getItem(WD14_SETTINGS_KEY) || 'null');
    if (saved && typeof saved === 'object') return saved;
  } catch(e){ /* fall through */ }
  return { host: 'http://127.0.0.1:8188', model: '', threshold: 0.35, characterThreshold: 0.85, trailingComma: false, excludeTags: '' };
}

// SynthDat gets its OWN ComfyUI host, independent of Tag Overseer's WD14
// one — some setups route generation and tagging through different
// addresses/tunnels/ports. Falls back to the WD14 host only as a first-run
// convenience default, then never touches it again once the user has their
// own value saved.
function getHost(){ return (synthDatHost.value || '').trim() || 'http://127.0.0.1:8188'; }

// ---------------- Persistence ----------------
// Everything here describes the CHARACTER/setup being generated — saved as
// its own file INSIDE the dataset folder (like Retroactive Merge/Void's
// _dts_canonical_tags.json), not in localStorage. It used to be one global
// localStorage blob shared across every dataset (and even shown with no
// dataset loaded at all, which is exactly the confusing case that changed
// this): the character you're generating for is tied to a specific dataset,
// so its prompt belongs to that dataset, not to the app as a whole.
const SETTINGS_FILE_NAME = '_dts_synthdat_settings.json';
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSave(): void {
  if (saveTimer !== null) clearTimeout(saveTimer);
  saveTimer = setTimeout(saveSettings, 400);
}
async function saveSettings(): Promise<void> {
  const dirHandle = getDirHandle();
  if (!dirHandle) return; // nothing to save into with no dataset open
  try {
    const handle = await dirHandle.getFileHandle(SETTINGS_FILE_NAME, { create: true });
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify({
      host: synthDatHost.value,
      unifiedPromptMode: synthDatUnifiedPromptMode.checked, unifiedPrompt: synthDatUnifiedPrompt.value,
      global: synthDatGlobal.value, character: synthDatCharacter.value, characterTrigger: synthDatCharacterTrigger.value,
      rating: synthDatRating.value, hair: synthDatHair.value, face: synthDatFace.value, chest: synthDatChest.value,
      body: synthDatBody.value, clothes: synthDatClothes.value, limbs: synthDatLimbs.value, sexual: synthDatSexual.value,
      scene: synthDatScene.value, effects: synthDatEffects.value, extra: synthDatExtra.value, negative: synthDatNegative.value,
      diffModel: synthDatDiffModel.value, clip: synthDatClip.value, vae: synthDatVae.value, mainLora: synthDatMainLora.value,
      loraRows: loraRows.map(r => ({ lora: r.input.value, strength: r.strength.value })),
      lliteStrength: synthDatLLLiteStrength.value, lliteStartPercent: synthDatLLLiteStartPercent.value,
      lliteEndPercent: synthDatLLLiteEndPercent.value, llitePreserveWrapper: synthDatLLLitePreserveWrapper.checked,
      resizeFit: synthDatResizeFit.value, resizeMethod: synthDatResizeMethod.value,
      sampler: synthDatSampler.value, scheduler: synthDatScheduler.value,
      steps1: synthDatSteps1.value, cfg1: synthDatCfg1.value, steps2: synthDatSteps2.value,
      width: synthDatWidth.value, height: synthDatHeight.value, use2Pass: synthDatUse2Pass.checked,
      seed1: synthDatSeed1.value, seed2: synthDatSeed2.value, denoise2: synthDatDenoise2.value,
      stripHairFace: synthDatStripHairFace.checked, skipRefImage: synthDatSkipRefImage.checked
    }, null, 2));
    await writable.close();
  } catch(e){ /* non-fatal, best-effort autosave same as canonical-tags.ts's own */ }
}
// Blanks every field back to its bare static-HTML default — used before
// loading a (possibly nonexistent) dataset's own settings file, so a
// dataset with no saved file yet never shows through whatever the
// PREVIOUSLY loaded dataset had typed, and so has nothing loaded at all
// (app just launched, or a dataset was unloaded) shows a clean slate
// instead of stale data from session state.
function resetSettingsToDefault(){
  synthDatHost.value = '';
  synthDatUnifiedPromptMode.checked = false; synthDatUnifiedPrompt.value = '';
  synthDatGlobal.value = ''; synthDatCharacter.value = ''; synthDatCharacterTrigger.value = '';
  synthDatRating.value = ''; synthDatHair.value = ''; synthDatFace.value = ''; synthDatChest.value = '';
  synthDatBody.value = ''; synthDatClothes.value = ''; synthDatLimbs.value = ''; synthDatSexual.value = '';
  synthDatScene.value = ''; synthDatEffects.value = ''; synthDatExtra.value = ''; synthDatNegative.value = '';
  synthDatDiffModel.value = ''; synthDatClip.value = ''; synthDatVae.value = ''; synthDatMainLora.value = '';
  synthDatLoraStackRows.innerHTML = ''; loraRows = [];
  synthDatLLLiteStrength.value = '1'; synthDatLLLiteStartPercent.value = '0'; synthDatLLLiteEndPercent.value = '0.3';
  synthDatLLLitePreserveWrapper.checked = true;
  synthDatResizeFit.value = 'pad'; synthDatResizeMethod.value = 'lanczos';
  synthDatSampler.value = 'res_multistep'; synthDatScheduler.value = 'beta';
  synthDatSteps1.value = '25'; synthDatCfg1.value = '4.04'; synthDatSteps2.value = '15';
  synthDatWidth.value = '920'; synthDatHeight.value = '1244'; synthDatUse2Pass.checked = false;
  synthDatSeed1.value = '15'; synthDatSeed2.value = '15'; synthDatDenoise2.value = '0.6';
  synthDatStripHairFace.checked = true; synthDatSkipRefImage.checked = false;
  applySkipRefImageUI();
  applyUnifiedPromptModeUI();
}
async function loadSettingsFromFile(){
  const dirHandle = getDirHandle();
  if (!dirHandle) return null;
  let saved = null;
  try {
    const handle = await dirHandle.getFileHandle(SETTINGS_FILE_NAME, { create: false });
    const file = await handle.getFile();
    saved = JSON.parse((await file.text()).trim() || 'null');
  } catch(e){ return null; } // no settings file for this dataset yet — not an error
  if (!saved) return null;
  synthDatHost.value = saved.host || '';
  synthDatUnifiedPromptMode.checked = !!saved.unifiedPromptMode; synthDatUnifiedPrompt.value = saved.unifiedPrompt || '';
  synthDatGlobal.value = saved.global || ''; synthDatCharacter.value = saved.character || '';
  synthDatCharacterTrigger.value = saved.characterTrigger || ''; synthDatRating.value = saved.rating || '';
  synthDatHair.value = saved.hair || ''; synthDatFace.value = saved.face || ''; synthDatChest.value = saved.chest || '';
  synthDatBody.value = saved.body || ''; synthDatClothes.value = saved.clothes || ''; synthDatLimbs.value = saved.limbs || '';
  synthDatSexual.value = saved.sexual || ''; synthDatScene.value = saved.scene || ''; synthDatEffects.value = saved.effects || '';
  synthDatExtra.value = saved.extra || ''; synthDatNegative.value = saved.negative || '';
  synthDatDiffModel.value = saved.diffModel || ''; synthDatClip.value = saved.clip || ''; synthDatVae.value = saved.vae || '';
  synthDatMainLora.value = saved.mainLora || '';
  synthDatLLLiteStrength.value = saved.lliteStrength != null ? saved.lliteStrength : 1;
  synthDatLLLiteStartPercent.value = saved.lliteStartPercent != null ? saved.lliteStartPercent : 0;
  synthDatLLLiteEndPercent.value = saved.lliteEndPercent != null ? saved.lliteEndPercent : 0.3;
  synthDatLLLitePreserveWrapper.checked = saved.llitePreserveWrapper !== false;
  synthDatResizeFit.value = saved.resizeFit || 'pad';
  synthDatResizeMethod.value = saved.resizeMethod || 'lanczos';
  if (saved.sampler) synthDatSampler.value = saved.sampler;
  if (saved.scheduler) synthDatScheduler.value = saved.scheduler;
  synthDatSteps1.value = saved.steps1 || 25; synthDatCfg1.value = saved.cfg1 != null ? saved.cfg1 : 4.04;
  synthDatSteps2.value = saved.steps2 || 15;
  synthDatWidth.value = saved.width || 920; synthDatHeight.value = saved.height || 1244;
  synthDatUse2Pass.checked = !!saved.use2Pass;
  synthDatSeed1.value = saved.seed1 != null ? saved.seed1 : 15; synthDatSeed2.value = saved.seed2 != null ? saved.seed2 : 15;
  synthDatDenoise2.value = saved.denoise2 != null ? saved.denoise2 : 0.6;
  synthDatStripHairFace.checked = saved.stripHairFace !== false;
  synthDatSkipRefImage.checked = !!saved.skipRefImage;
  applySkipRefImageUI();
  applyUnifiedPromptModeUI();
  return saved;
}

// Called from index.ts on dataset open AND on unload (getDirHandle() reads
// as null in the unload case) — always resets to blank first, so a dataset
// with no saved file of its own never shows through whatever the PREVIOUSLY
// loaded dataset had, and "no dataset open" shows a clean slate instead of
// stale session state.
export async function loadSynthDatSettingsForFolder(){
  resetSettingsToDefault();
  const dirHandle = getDirHandle();
  if (!dirHandle){
    document.querySelectorAll('#synthDatTab textarea').forEach(el => growTextarea(el));
    return;
  }
  const saved = await loadSettingsFromFile();
  if (saved){
    const rows = Array.isArray(saved.loraRows) && saved.loraRows.length ? saved.loraRows : [{ lora: '', strength: 1 }, { lora: '', strength: 0.8 }];
    for (const r of rows) addLoraRow(r.lora, r.strength);
  } else {
    // This dataset has no SynthDat settings file yet — seed the ComfyUI
    // host from Tag Overseer's WD14 setting purely as a convenience
    // default (see getHost()'s own comment on why the two stay independent
    // from here on), and two blank LoRA rows to fill in. No particular LoRA
    // is seeded here anymore — each dataset generates a different
    // character, so there's no sensible default LoRA to guess.
    synthDatHost.value = getWd14Settings().host || 'http://127.0.0.1:8188';
    addLoraRow('', 1);
    addLoraRow('', 0.8);
  }
  document.querySelectorAll('#synthDatTab textarea').forEach(el => growTextarea(el));
}

// Three curated sets, not derived ones — Danbooru's real tag categories
// (all_tags.json.gz: 0 General, 1 Artist, 3 Copyright, 4 Character, 5 Meta —
// see tag-details.ts's CATEGORY_NAMES) don't distinguish "pose"/"limb
// action"/"sexual action" as families, and neither does wiki.json's
// free-text defs. Seeded from Danbooru's own tag_group wiki pages (Posture,
// Shoulders, Feet, Gestures, Hands, and the "on" disambiguation page — user-
// supplied), pared down to the actual pose/action tags on those pages
// (skipping pure attire/anatomy/scene entries like "off-shoulder dress" or
// "on bed", which belong in Clothes/Scene instead). These only drive the
// SUGGESTED default in the tag-assignment picker below (migratePoseTags) —
// the user hand-picks/overrides the final destination per tag, since no
// fixed list can perfectly separate "pose" from "limb action" from "sexual
// action" for every image.
const POSE_TAGS = new Set([
  'standing', 'sitting', 'lying', 'kneeling', 'squatting', 'crouching', 'jumping',
  'running', 'walking', 'bent over', 'on back', 'on stomach', 'on side',
  'wariza', 'seiza', 'all fours', 'straddling', 'stretching', 'falling', 'flying',
  'floating', 'dancing', 'fighting stance', 'looking back', 'looking up', 'looking down',
  'looking at viewer', 'looking away', 'from behind', 'from side', 'from above',
  'from below', 'from front', 'head tilt', 'reclining', 'curled up', 'yoga', 'split', 'plank',
  'on one knee', 'fetal position', 'butterfly sitting', 'figure four sitting', 'indian style',
  'lotus position', 'hugging own legs', 'sitting on lap', 'human chair', 'thigh straddling',
  'upright straddle', 'yokozuwari', 'balancing', 'legs apart', 'standing on one leg',
  'crawling', 'midair', 'hopping', 'pouncing', 'walking on wall', 'top-down bottom-up',
  'prostration', 'bear position', 'bowlegged pose', 'chest stand', 'cowering', 'crucifixion',
  'faceplant', 'full scorpion', 'battoujutsu stance', 'spread eagle position',
  'superhero landing', 'upside-down', 'handstand', 'headstand', 'scorpion pose',
  'head down', 'head back', 'arched back', 'bent back', 'slouching', 'sway back',
  'twisted torso', 'crossed ankles', 'leg up', 'legs up', 'knees to chest', 'legs over head',
  'leg lift', 'outstretched leg', 'pigeon pose', 'standing split', 'uneven footing',
  'knees apart feet together', 'knees together feet apart', 'knee up', 'knees up',
  'en pointe', 'foot dangle', 'bowing', 'curtsey'
]);
const LIMB_ACTION_TAGS = new Set([
  'arms up', 'arms behind back', 'arms behind head', 'arms crossed', 'crossed arms',
  'hand up', 'hands up', 'hand on hip', 'hands on hips', 'hand on own chest',
  'hand on own cheek', 'hand on own chin', 'hand on own head', 'hands on own face',
  'reaching', 'reaching out', 'pointing', 'pointing at viewer', 'peace sign', 'thumbs up',
  'clenched hand', 'clenched hands', 'open hand', 'open hands', 'own hands together',
  'hands together', 'hands clasped', 'waving', 'arm support', 'arm up', 'spread legs',
  'crossed legs', 'akimbo', 'fingers together', 'finger to mouth',
  'hand on own knee', 'hands on own knees', 'v',
  'arm behind back', 'victory pose', 'outstretched arm', 'outstretched arms', 'spread arms',
  'arm at side', 'arms at sides', 'airplane arms', 'flexing', 't-pose', 'a-pose', 'w arms',
  'stroking own chin', 'outstretched hand', 'interlocked fingers', 'star hands',
  'folded', 'pin legs', 'watson cross', 'dorsiflexion', 'plantar flexion', 'toe scrunch',
  'tiptoes', 'pigeon-toed', 'hug', 'hugging object', 'hugging tail', 'arm hug',
  'hug from behind', 'waist hug', 'piggyback', 'carrying', 'princess carry', 'shoulder carry',
  'air quotes', 'circle hands', 'cupping hands', 'double thumbs up', 'double thumbs down',
  'double v', 'fist bump', 'hand glasses', 'heart hands', 'high five', 'horns pose',
  'index finger raised', 'index fingers together', 'palm-fist tap', 'pinky swear',
  'shadow puppet', 'steepled fingers', 'triangle hands', 'x arms', 'beckoning', 'twirling hair',
  'middle finger', 'pinky out', 'shushing', 'thumbs down', 'pointing at another',
  'pointing at self', 'pointing down', 'pointing forward', 'pointing up', 'crossed fingers',
  'finger gun', 'finger heart', 'shaka sign', 'v over eye', 'v over mouth',
  'hand of benediction', 'ok sign', 'w', 'facepalm', 'salute', 'spread fingers',
  'stop (gesture)', 'fist pump', 'power fist', 'raised fist', 'arm around neck',
  'arm on another\'s shoulder', 'hand on another\'s shoulder', 'hand on own shoulder',
  'hands on own shoulders', 'hand on own ear', 'hand on own face', 'hands on own face',
  'hand on own forehead', 'hands on own cheeks', 'hands on own chin', 'hand on own neck',
  'hands on own neck', 'hands on own chest', 'hand on own stomach', 'hands on own stomach',
  'hand on own arm', 'hand on own elbow', 'hand on another\'s hip', 'hands on another\'s hips',
  'hand in pocket', 'hands in pockets', 'headpat', 'hand on another\'s head',
  'hands on another\'s head', 'arm around shoulder', 'hand on another\'s arm',
  'hand on another\'s back', 'hand on another\'s chest', 'hand on another\'s shoulder',
  'hands on another\'s shoulder'
]);
const SEXUAL_ACTION_TAGS = new Set([
  'groping motion', 'groping', 'hand in bra', 'nipple tweak', 'arm between breasts',
  'grabbing own breast', 'grabbing another\'s breast', 'flat chest grab', 'guided breast grab',
  'breast lift', 'breasts squeezed together', 'breast suppress', 'hand between own legs',
  'hand on own crotch', 'hand on another\'s crotch', 'hands on own crotch',
  'hand on own ass', 'hand on another\'s ass', 'cunnilingus gesture', 'fellatio gesture',
  'handjob gesture', 'penetration gesture', 'tribadism gesture', 'strangling',
  'foot worship', 'kissing foot', 'licking foot', 'toe sucking', 'footjob',
  'double footjob', 'cooperative footjob', 'implied footjob', 'foot pussy'
]);

function normalizeTag(t: string): string {
  return String(t).toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}

let template: SynthDatPrompt | null = null;
let getDirHandle: () => DirHandle | null = () => null;
let addEntryFromNewFile: (...args: unknown[]) => Promise<Entry | null> = async () => null;
let refreshAllUIRef: () => void = () => {};

let refFile: File | null = null;
let refFilename = '';
let refImageEl: HTMLImageElement | null = null;
let lastWd14TagsCsv = '';
let previewBytes: Uint8Array | null = null;
let loraCombo: string[] | null = null;

// ---------------- Textarea auto-grow (no manual resize handle) ----------------

function growTextarea(el: Element): void {
  const he = el as HTMLElement;
  he.style.height = 'auto';
  he.style.height = `${he.scrollHeight}px`;
}

async function loadTemplate(){
  if (template) return template;
  const res = await fetch('./data/synthdat-workflow.json');
  template = await res.json();
  return template;
}

function setWd14ResultText(text: string): void {
  if (!text){ synthDatWd14Result.style.display = 'none'; synthDatWd14Result.textContent = ''; return; }
  synthDatWd14Result.style.display = 'block';
  synthDatWd14Result.textContent = text;
}

function setGenStatus(text: string): void {
  if (!text){ synthDatGenStatus.style.display = 'none'; synthDatGenStatus.textContent = ''; return; }
  synthDatGenStatus.style.display = 'block';
  synthDatGenStatus.textContent = text;
}

// ---------------- Reference image: pick, resized/padded preview, aspect warning ----------------

async function pickReferenceImage(){
  if (!(window as unknown as Record<string, unknown>).showOpenFilePicker){
    toast('Your browser does not support file picking here.', 4000);
    return;
  }
  let handles: FileSystemFileHandle[];
  try {
    handles = await (window as unknown as { showOpenFilePicker(opts: unknown): Promise<FileSystemFileHandle[]> }).showOpenFilePicker({
      types: [{ description: 'Images', accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] } }],
      multiple: false
    });
  } catch(e){ return; }
  if (!handles || !handles[0]) return;
  const file = await handles[0].getFile();
  refFile = file;
  refFilename = file.name;

  const objectUrl = URL.createObjectURL(file);
  synthDatRefPreview.src = objectUrl;
  synthDatRefPreview.style.display = 'block';
  synthDatRefEmpty.style.display = 'none';
  btnSynthDatInterrogate.disabled = false;

  refImageEl = new Image();
  refImageEl.onload = () => { updateResizedPreview(); updateResoWarning(); };
  refImageEl.src = objectUrl;

  // Picking a new reference image does NOT touch Pose/Limbs/Sexual (or any
  // other field) by itself — those only change when the user edits them
  // directly or runs Migrate (which itself offers a Clear-vs-Compound
  // choice, see applyTagAssignment()). Interrogation is also NOT automatic —
  // the user clicks "Interrogate" themselves, since re-picking the same
  // image mid-session (e.g. while iterating on other settings) shouldn't
  // force a redundant WD14 pass every time.
  setWd14ResultText('');
  lastWd14TagsCsv = '';
  tagAssignments = new Map();
  synthDatTagAssign.innerHTML = '';
  btnSynthDatMigratePose.disabled = true;
}

// A client-side stand-in for the workflow's own "DSM Image Resize"
// node (238) — its output now IS what ControlNet (240) actually conditions
// on (see buildPromptFromFields()), so this preview genuinely shows what
// CNET sees, not just an approximation for its own sake. Reproduces that
// node's three fit modes (see its own INPUT_TYPES tooltip in rgthree-comfy's
// image_resize.py) using canvas's own resampling rather than exactly
// replicating its resample method choice — close enough to judge composition
// before spending a generation on it, not meant to be pixel-identical.
function updateResizedPreview(): void {
  if (!refImageEl || !refImageEl.naturalWidth){ synthDatResizedPreviewWrap.style.display = 'none'; synthDatResizedPreviewLabel.style.display = 'none'; return; }
  const targetW = parseInt(synthDatWidth.value, 10) || 920;
  const targetH = parseInt(synthDatHeight.value, 10) || 1244;
  const fit = synthDatResizeFit.value || 'pad';
  const w = refImageEl.naturalWidth, h = refImageEl.naturalHeight;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  let label: string;
  if (fit === 'crop'){
    // Scale to COVER the target box, then center-crop the overhang — canvas
    // clips anything drawn outside its own bounds, so an over-sized draw at
    // a centered offset naturally crops.
    canvas.width = targetW;
    canvas.height = targetH;
    const scale = Math.max(targetW / w, targetH / h);
    const drawW = w * scale, drawH = h * scale;
    ctx.drawImage(refImageEl, (targetW - drawW) / 2, (targetH - drawH) / 2, drawW, drawH);
    label = `Parent image is ${w}×${h}, cropped here to fill ${targetW}×${targetH} — this is what ControlNet actually sees. Updates live as you change Width/Height/Fit.`;
  } else if (fit === 'contain'){
    // Scale to FIT inside the target box, no padding — output is whatever
    // size that scale actually produces, not necessarily targetW×targetH.
    const scale = Math.min(targetW / w, targetH / h);
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    ctx.drawImage(refImageEl, 0, 0, canvas.width, canvas.height);
    label = `Parent image is ${w}×${h}, contained here to ${canvas.width}×${canvas.height} (fit inside ${targetW}×${targetH} with no padding) — this is what ControlNet actually sees. Updates live as you change Width/Height/Fit.`;
  } else {
    // pad: scale to fit inside the target box, then pad the rest with black.
    canvas.width = targetW;
    canvas.height = targetH;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, targetW, targetH);
    const scale = Math.min(targetW / w, targetH / h);
    const drawW = w * scale, drawH = h * scale;
    ctx.drawImage(refImageEl, (targetW - drawW) / 2, (targetH - drawH) / 2, drawW, drawH);
    label = `Parent image is ${w}×${h}, padded here to ${targetW}×${targetH} — this is what ControlNet actually sees. Updates live as you change Width/Height/Fit.`;
  }
  synthDatResizedPreview.src = canvas.toDataURL('image/png');
  synthDatResizedPreviewWrap.style.display = 'block';
  synthDatResizedPreviewLabel.textContent = label;
  synthDatResizedPreviewLabel.style.display = 'block';
}

function updateResoWarning(): void {
  if (!refImageEl || !refImageEl.naturalWidth){ synthDatResoWarning.style.display = 'none'; return; }
  const targetW = parseInt(synthDatWidth.value, 10) || 0;
  const targetH = parseInt(synthDatHeight.value, 10) || 0;
  const refPortrait = refImageEl.naturalHeight > refImageEl.naturalWidth;
  const targetPortrait = targetH > targetW;
  if (refPortrait !== targetPortrait){
    synthDatResoWarning.textContent = `⚠ Reference image is ${refPortrait ? 'portrait' : 'landscape'} (${refImageEl.naturalWidth}×${refImageEl.naturalHeight}) but your generation resolution is ${targetPortrait ? 'portrait' : 'landscape'} (${targetW}×${targetH}) — consider swapping Width/Height.`;
    synthDatResoWarning.style.display = 'block';
  } else {
    synthDatResoWarning.style.display = 'none';
  }
}

// Purely visual — grays out the reference-image picker/interrogate/migrate
// controls via CSS (opacity + pointer-events:none) rather than touching any
// button's own `disabled` property, so unchecking the box just removes the
// class and every button's actual disabled state (e.g. Interrogate staying
// disabled until a file is picked) is exactly what it already was.
function applySkipRefImageUI(): void {
  synthDatRefImageSection.classList.toggle('synthdat-section-disabled', synthDatSkipRefImage.checked);
}

// Splitting the prompt into a dozen fields is the default because it maps
// 1:1 onto the template's own Merger groups (see buildPromptFromFields()),
// but someone who already has a full prompt written out shouldn't have to
// paste it apart by hand — this just points the whole thing at the Character
// field's own node instead, verbatim, no auto-splitting/analysis of any
// kind. Global (Main LoRA trigger), Character Trigger, and Negative stay
// visible either way — they're fixed technical parameters, not prompt
// content a "already have a prompt" user would be switching out.
function applyUnifiedPromptModeUI(): void {
  const unified = synthDatUnifiedPromptMode.checked;
  synthDatUnifiedPromptRow.style.display = unified ? '' : 'none';
  synthDatSplitFieldsGroup.style.display = unified ? 'none' : '';
  // Strip Hair/Face has nothing to selectively strip once Hair/Face aren't
  // their own fields anymore — hidden rather than left showing an inert
  // checkbox.
  synthDatStripHairFaceRow.style.display = unified ? 'none' : '';
}

// The prompt-fields overlay itself — see styles.css's comment on
// #synthDatPromptFieldsDock for why this is position:fixed rather than a
// real column: it overlaps whatever's underneath instead of resizing the
// tab around itself. Not persisted across sessions/tab switches — always
// starts closed, same as any other transient UI (e.g. a context menu).
function onDocClickOutsidePromptPanel(ev: MouseEvent): void {
  const target = ev.target as Node;
  if (synthDatPromptFieldsDock.contains(target) || btnSynthDatPromptPanelToggle.contains(target)) return;
  closeSynthDatPromptPanel();
}
function openSynthDatPromptPanel(): void {
  synthDatPromptFieldsDock.style.display = 'block';
  btnSynthDatPromptPanelToggle.style.display = 'none';
  // Every growTextarea() call that happened while this panel was
  // display:none (settings loading on folder open, resetSettingsToDefault(),
  // etc.) measured a hidden element's scrollHeight, which reads as 0/default
  // rather than the real content height — leaving fields stuck at that wrong
  // (usually too-short) height until the user typed and re-triggered it.
  // Recomputing every field's height right as the panel actually becomes
  // visible fixes that regardless of what happened while it was hidden.
  synthDatPromptFieldsDock.querySelectorAll('textarea').forEach(el => growTextarea(el));
  // Deferred a tick so the same click that just opened the panel (via
  // btnSynthDatPromptPanelToggle's own 'click' handler) doesn't also count
  // as the first "outside" mousedown once this listener attaches.
  setTimeout(() => document.addEventListener('mousedown', onDocClickOutsidePromptPanel), 0);
}
function closeSynthDatPromptPanel(): void {
  synthDatPromptFieldsDock.style.display = 'none';
  btnSynthDatPromptPanelToggle.style.display = '';
  document.removeEventListener('mousedown', onDocClickOutsidePromptPanel);
}

async function interrogateReference(): Promise<void> {
  if (!refFile) return;
  setWd14ResultText('Interrogating…');
  const settings = getWd14Settings();
  if (!settings.model){
    setWd14ResultText('No WD14 model configured — set one up in Tag Overseer\'s WD14 Autotagger section first.');
    return;
  }
  const bytes = new Uint8Array(await refFile.arrayBuffer());
  const res = await window.electronAPI.wd14TagImage({ host: getHost(), filename: refFilename, imageBytes: bytes, settings });
  if (!res.ok){
    setWd14ResultText(res.error || 'WD14 interrogation failed.');
    return;
  }
  const tagsCsv = res.tagsCsv || '';
  lastWd14TagsCsv = tagsCsv;
  setWd14ResultText(parseWd14Tags(tagsCsv).join(', ') || '(no tags returned)');
  renderTagAssignPicker(parseWd14Tags(tagsCsv));
}

// Interrogates the actual GENERATED image (whichever pass is currently
// selected, see selectPass()) rather than the reference — the model
// sometimes draws details nobody prompted for (e.g. a pond gets lily pads
// added on its own), and WD14 catches those the same way it would for any
// other image. Two modes, via synthDatReinterrogateOverwrite:
// - Compound (default): only ADDS tags the tag card doesn't already have
//   (by normalized comparison — a tag both the user and WD14 agree on, e.g.
//   "dress", just stays "dress" once); existing prune/merge decisions on
//   tags already there are left alone.
// - Overwrite: replaces the tag card entirely with WD14's own output tags,
//   discarding whatever was there before — including prior prune/merge
//   decisions, since there's nothing left for them to apply to.
async function reinterrogateOutput(): Promise<void> {
  if (!previewBytes || !pendingTagSnapshot) return;
  synthDatReinterrogateResult.style.display = 'block';
  synthDatReinterrogateResult.textContent = 'Interrogating output…';
  const settings = getWd14Settings();
  if (!settings.model){
    synthDatReinterrogateResult.textContent = 'No WD14 model configured — set one up in Tag Overseer\'s WD14 Autotagger section first.';
    return;
  }
  const res = await window.electronAPI.wd14TagImage({ host: getHost(), filename: pendingImgName || 'output.png', imageBytes: previewBytes, settings });
  if (!res.ok){
    synthDatReinterrogateResult.textContent = res.error || 'WD14 interrogation failed.';
    return;
  }
  const outputTags = parseWd14Tags(res.tagsCsv || '');
  if (synthDatReinterrogateOverwrite.checked){
    pendingTagSnapshot = outputTags;
    excludedTags = new Set();
    mergedTagOverrides = new Map();
    markedVoidTags = new Set();
    renderTagCard();
    synthDatReinterrogateResult.textContent = `Replaced the list with ${outputTags.length} tag(s) from WD14: ${outputTags.join(', ')}`;
    return;
  }
  const existingNormalized = new Set(pendingTagSnapshot.map(normalizeTag));
  const newTags = [];
  for (const tag of outputTags){
    const norm = normalizeTag(tag);
    if (existingNormalized.has(norm)) continue;
    existingNormalized.add(norm);
    newTags.push(tag);
  }
  if (newTags.length === 0){
    synthDatReinterrogateResult.textContent = 'No new tags — WD14 didn\'t catch anything the list below is missing.';
    return;
  }
  pendingTagSnapshot = pendingTagSnapshot.concat(newTags);
  renderTagCard();
  synthDatReinterrogateResult.textContent = `Added ${newTags.length} tag(s) WD14 caught in the output: ${newTags.join(', ')}`;
}

// Per-tag hand-picking, not a one-click auto-migrate: no fixed list can
// perfectly separate "pose" from "limb/hand action" from "sexual action"
// for every image (per the user, sexual content is a real part of some
// datasets here, so that destination needs to be a first-class option, not
// silently dropped). Each WD14 tag gets a row with a small button group
// (→Pose / →Limbs / →Sexual / skip); POSE_TAGS/LIMB_ACTION_TAGS/
// SEXUAL_ACTION_TAGS (seeded from Danbooru's own tag_group wiki pages) only
// pre-select a SUGGESTED destination — the user can reassign or skip any row
// before hitting Apply.
type TagDestination = 'pose' | 'limbs' | 'sexual';
let tagAssignments = new Map<string, TagDestination | null>();

function suggestDestination(tag: string): TagDestination | null {
  const norm = normalizeTag(tag);
  if (POSE_TAGS.has(norm)) return 'pose';
  if (LIMB_ACTION_TAGS.has(norm)) return 'limbs';
  if (SEXUAL_ACTION_TAGS.has(norm)) return 'sexual';
  return null;
}

// Only tags that actually match one of the three curated sets ever show up
// here — WD14 returns plenty of character-composition/appearance tags
// (1girl, breasts, shirt, brown hair, ...) that have nothing to do with the
// pose/gesture the reference image is being used for, and showing every
// returned tag just buried the ones that matter under ones that don't.
// Since every VISIBLE row is, by construction, one the curated sets already
// classified, each defaults to that suggested destination (never Skip) —
// the user only has to touch a row to override a wrong guess, not to
// affirmatively assign every single one.
function renderTagAssignPicker(tags: string[]): void {
  tagAssignments = new Map();
  synthDatTagAssign.innerHTML = '';
  const relevant = tags.filter(t => suggestDestination(t) !== null);
  if (relevant.length === 0){
    const empty = document.createElement('div');
    empty.className = 'stats-empty';
    empty.textContent = 'No pose/gesture/action tags found in this result.';
    synthDatTagAssign.appendChild(empty);
    btnSynthDatMigratePose.disabled = true;
    return;
  }
  const DESTS: [TagDestination | null, string][] = [['pose', 'Pose'], ['limbs', 'Limbs'], ['sexual', 'Sexual'], [null, 'Skip']];
  for (const tag of relevant){
    tagAssignments.set(tag, suggestDestination(tag));
    const row = document.createElement('div');
    row.className = 'synthdat-tag-assign-row';
    const label = document.createElement('span');
    label.className = 'synthdat-tag-assign-label';
    label.textContent = tag;
    row.appendChild(label);
    const btnGroup = document.createElement('div');
    btnGroup.className = 'synthdat-tag-assign-btns';
    for (const [dest, label2] of DESTS){
      const btn = document.createElement('button');
      btn.textContent = label2;
      btn.className = 'synthdat-tag-assign-btn' + (tagAssignments.get(tag) === dest ? ' active' : '');
      btn.addEventListener('click', () => {
        tagAssignments.set(tag, dest);
        btnGroup.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
      btnGroup.appendChild(btn);
    }
    row.appendChild(btnGroup);
    synthDatTagAssign.appendChild(row);
  }
  btnSynthDatMigratePose.disabled = false;
}

function applyTagAssignment(): void {
  if (tagAssignments.size === 0){ toast('Interrogate a reference image first.'); return; }
  const byDest: Record<TagDestination, string[]> = { pose: [], limbs: [], sexual: [] };
  for (const [tag, dest] of tagAssignments){
    if (dest && byDest[dest]) byDest[dest].push(tag);
  }
  const fieldByDest: Record<TagDestination, HTMLTextAreaElement> = { pose: synthDatPose, limbs: synthDatLimbs, sexual: synthDatSexual };
  const clearFirst = synthDatMigrateClearFirst.checked;
  // "Clear first" wipes all three fields regardless of whether this round
  // actually assigned a new tag to each one — the point is starting this
  // image's Pose/Limbs/Sexual fresh, not just the destinations that got hits.
  if (clearFirst){
    for (const field of Object.values(fieldByDest)){ field.value = ''; growTextarea(field); }
  }
  let total = 0;
  for (const dest of Object.keys(byDest) as TagDestination[]){
    if (byDest[dest].length === 0) continue;
    const field = fieldByDest[dest];
    const existing = clearFirst ? [] : field.value.split(',').map(t => t.trim()).filter(Boolean);
    field.value = Array.from(new Set([...existing, ...byDest[dest]])).join(', ');
    growTextarea(field);
    total += byDest[dest].length;
  }
  if (total === 0){ toast('Nothing assigned — every tag is set to Skip.'); return; }
  toast(`Applied ${total} tag(s): ${byDest.pose.length} to Pose, ${byDest.limbs.length} to Limbs, ${byDest.sexual.length} to Sexual.`);
  scheduleSave();
}

// ---------------- Model / LoRA dropdowns ----------------

async function fetchComboValues(classType: string, inputName: string): Promise<string[] | null> {
  const res = await window.electronAPI.synthdatGetObjectInfo({ host: getHost(), classType, inputName });
  if (!res.ok){
    toast(res.error || `Could not load ${classType}'s ${inputName} list from ComfyUI.`, 3600);
    return null;
  }
  return res.values || [];
}

// Model/LoRA pickers are plain text inputs backed by a <datalist> (native
// type-to-filter, no custom dropdown code needed) rather than a <select> —
// LoRA collections in particular can run into the hundreds, and scrolling a
// native <select> to find one by eye doesn't scale. Refreshing the list just
// repopulates the <datalist>'s options; it never touches the input's own
// typed value, so there's no "preserve the current selection" bookkeeping
// needed the way a <select> would require.
function fillDatalist(datalistEl: HTMLElement, values: string[]): void {
  datalistEl.innerHTML = '';
  for (const v of values){
    const opt = document.createElement('option');
    opt.value = v;
    datalistEl.appendChild(opt);
  }
}

// ---------------- Dynamic LoRA stack rows ----------------
// The template's own "DSM Lora Loader Stack" node (id 237) only has 4
// slots. "+ Add LoRA" doesn't try to give that fixed node a 5th input —
// instead, past 4 rows, buildPromptFromFields() chains additional cloned
// stack nodes (each one's model input wired to the previous stack's output)
// and repoints whichever nodes consumed 237's output at the last one in the
// chain. All rgthree stack slots share the exact same combo list regardless
// of index, so one shared fetch (loraCombo) backs every row's datalist.
interface LoraRow {
  row: HTMLElement;
  input: HTMLInputElement;
  strength: HTMLInputElement;
}

let loraRows: LoraRow[] = [];

function addLoraRow(defaultLora: string, defaultStrength: number): void {
  const row = document.createElement('div');
  row.className = 'synthdat-lora-row';
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Start typing to search…';
  input.value = defaultLora || '';
  attachListAutocomplete(input, () => loraCombo || []);
  const strength = document.createElement('input');
  strength.type = 'number';
  strength.step = '0.05';
  strength.value = String(defaultStrength != null ? defaultStrength : 1);
  const removeBtn = document.createElement('button');
  removeBtn.textContent = '×';
  removeBtn.title = 'Remove this LoRA slot';
  removeBtn.addEventListener('click', () => {
    loraRows = loraRows.filter(r => r.row !== row);
    row.remove();
    scheduleSave();
  });
  input.addEventListener('change', scheduleSave);
  strength.addEventListener('change', scheduleSave);
  row.appendChild(input);
  row.appendChild(strength);
  row.appendChild(removeBtn);
  synthDatLoraStackRows.appendChild(row);
  loraRows.push({ row, input, strength });
}

// Reuses the same synthdatGetObjectInfo bridge refreshModelLists() already
// relies on (real fetch on mobile via comfy-client.ts, real IPC on desktop)
// instead of adding a dedicated ping endpoint — one lightweight combo lookup
// is enough to prove the host is reachable and speaking ComfyUI's API.
async function testSynthdatConnection(): Promise<void> {
  synthDatConnStatus.style.display = 'block';
  synthDatConnStatus.style.color = '';
  synthDatConnStatus.textContent = 'Connecting…';
  const res = await window.electronAPI.synthdatGetObjectInfo({ host: getHost(), classType: 'UNETLoader', inputName: 'unet_name' });
  if (res.ok){
    synthDatConnStatus.style.color = 'var(--accent-ok, #3a9)';
    synthDatConnStatus.textContent = `✓ Connected to ${getHost()}`;
  } else {
    synthDatConnStatus.style.color = '';
    synthDatConnStatus.textContent = res.error || 'Could not connect.';
  }
}

async function refreshModelLists(): Promise<void> {
  const [unetValues, clipValues, vaeValues, mainLoraValues, loraValues] = await Promise.all([
    fetchComboValues('UNETLoader', 'unet_name'),
    fetchComboValues('CLIPLoader', 'clip_name'),
    fetchComboValues('VAELoader', 'vae_name'),
    fetchComboValues('DSM Lora Name', 'lora_name'),
    fetchComboValues('DSM Lora Loader Stack', 'lora_01')
  ]);
  if (unetValues) fillDatalist(synthDatUnetDatalist, unetValues);
  if (clipValues) fillDatalist(synthDatClipDatalist, clipValues);
  if (vaeValues) fillDatalist(synthDatVaeDatalist, vaeValues);
  if (mainLoraValues) fillDatalist(synthDatMainLoraDatalist, mainLoraValues);
  if (loraValues){
    loraCombo = loraValues;
    fillDatalist(synthDatLoraDatalist, loraValues);
  }
}

// ---------------- Prompt building ----------------

// Node id -> UI field, matching the template's Merger groups exactly (see
// CLAUDE.md). Character is special: two UI boxes (composition + trigger)
// concatenate into node 11's single value. Character Count no longer has
// its own box — the user is expected to type counts (e.g. "1girl, solo")
// directly into Character, in order, so node 19 always gets an empty string.
function fieldValue(el: HTMLInputElement | HTMLTextAreaElement): string { return (el.value || '').trim(); }

// This is what actually gets written to the accepted image's .txt — NOT
// necessarily identical to the generation prompt. Hair/Face can optionally
// be left out (synthDatStripHairFace, on by default): a character LoRA's
// own trigger word already implies its fixed appearance, so captions for
// its training images conventionally omit descriptive hair/face tags that
// would otherwise fight the trigger word during training.
function buildPositiveTagList(): string[] {
  const unified = synthDatUnifiedPromptMode.checked;
  const character = [unified ? fieldValue(synthDatUnifiedPrompt) : fieldValue(synthDatCharacter), fieldValue(synthDatCharacterTrigger)].filter(Boolean).join(', ');
  const stripHairFace = !unified && synthDatStripHairFace.checked;
  const parts = unified
    ? [fieldValue(synthDatGlobal), character]
    : [
        fieldValue(synthDatGlobal), fieldValue(synthDatRating), character,
        stripHairFace ? '' : fieldValue(synthDatHair), stripHairFace ? '' : fieldValue(synthDatFace),
        fieldValue(synthDatChest), fieldValue(synthDatBody),
        fieldValue(synthDatClothes), fieldValue(synthDatLimbs), fieldValue(synthDatSexual), fieldValue(synthDatPose),
        fieldValue(synthDatExtra), fieldValue(synthDatEffects), fieldValue(synthDatScene)
      ];
  return parts.filter(Boolean);
}

function baseTagList(): string[] {
  const tags = buildPositiveTagList().flatMap(part => part.split(',').map(t => t.trim())).filter(Boolean);
  return Array.from(new Set(tags.map(t => t.replace(/_/g, ' ').replace(/\s+/g, ' ').trim())));
}

// Scans this dataset's own edit log for past merge/rename operations (Quick
// Merge, Unify, Master Tags' "Rename everywhere" — anything that calls
// recordChange('merge'|'rename', ...)) and derives an "old tag -> current
// canonical tag" map from them. Reads directly from the shared standing-rules
// list (canonical-tags.ts's "Retroactive Merge/Void" dock) instead of its own
// independent editLog-diffing reconstruction — that dock is now the single
// source of truth for merge/void history app-wide (it already seeds itself
// from editLog on first run for datasets that predate it, once, then persists
// its own file). Void rules (canonical === null) are skipped: there's no "X
// was merged into Y" suggestion to make for a tag that was just deleted.
function buildMergeHistoryMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const rule of canonicalRules){
    if (!rule.canonical) continue;
    for (const child of rule.children || []){
      if (normalizeTag(child) !== normalizeTag(rule.canonical)) map.set(normalizeTag(child), rule.canonical);
    }
  }
  return map;
}

// Per-tag pruning/merge decisions the user makes in the tag card below,
// keyed by tag string so they survive re-renders triggered by further chip
// clicks (see renderTagCard()'s own comment for why that's safe).
let excludedTags = new Set<string>();
let mergedTagOverrides = new Map<string, string>();
// Tags the user has explicitly marked "void" in the pending card (its own
// little context menu, see openPendingTagMenu()) — excluded from what gets
// saved on THIS image same as excludedTags, but also registered as a real
// Retroactive Merge/Void rule on Accept (registerVoidRule()), so the same
// tag never needs manually removing again on a future image either.
let markedVoidTags = new Set<string>();

// The tag card shows exactly one thing: what the currently pending
// generation will be saved with. It is NOT a live preview of the prompt
// fields — null means "no finished-but-not-yet-accepted/rejected generation
// right now" (app just opened, or the last one was just Accepted/Rejected),
// and renders as empty. Populated once, as a frozen snapshot taken the
// moment a generation finishes (see generate()) — further prompt-field edits
// while that image is still pending do NOT change what's shown here, since
// this reflects what was actually sent to ComfyUI for that image, not
// whatever the fields currently say.
let pendingTagSnapshot: string[] | null = null;

// The pending card's own right-click menu — deliberately just two actions,
// not the full Gallery chip context menu (view.ts's openTagContextMenu):
// this image isn't a real entry yet, so per-image things like flag-for-
// review/rename don't apply, and merge-pool selection/gallery filters make
// little sense against a card that isn't in the Gallery to filter. Reusing
// tag-details.ts's openTagDetails() directly rather than reimplementing it.
let pendingTagMenuEl: HTMLElement | null = null;
function closePendingTagMenu(): void {
  if (pendingTagMenuEl){ pendingTagMenuEl.remove(); pendingTagMenuEl = null; }
  document.removeEventListener('click', onDocClickClosePendingTagMenu);
}
function onDocClickClosePendingTagMenu(ev: MouseEvent): void {
  if (!pendingTagMenuEl) return;
  const path = typeof ev.composedPath === 'function' ? ev.composedPath() : [];
  if (path.includes(pendingTagMenuEl)) return;
  closePendingTagMenu();
}
function openPendingTagMenu(tag: string, x: number, y: number): void {
  closePendingTagMenu();
  const menu = document.createElement('div');
  menu.className = 'ctx-menu';
  const header = document.createElement('div');
  header.className = 'ctx-header';
  header.textContent = tag;
  menu.appendChild(header);

  const defBtn = document.createElement('button');
  defBtn.className = 'ctx-item';
  defBtn.textContent = '📖 Definition';
  defBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    closePendingTagMenu();
    openTagDetails(tag);
  });
  menu.appendChild(defBtn);

  const isVoid = markedVoidTags.has(tag);
  const voidBtn = document.createElement('button');
  voidBtn.className = 'ctx-item';
  voidBtn.textContent = isVoid ? '↩️ Unmark void' : '🚫 Mark as void';
  voidBtn.title = isVoid
    ? 'Stop treating this tag as a void rule candidate.'
    : 'Drop this tag from what gets saved, and add a Retroactive Void rule for it on Accept — so it\'s auto-stripped from future images too, not just this one.';
  voidBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (isVoid) markedVoidTags.delete(tag); else markedVoidTags.add(tag);
    closePendingTagMenu();
    renderTagCard();
  });
  menu.appendChild(voidBtn);

  document.body.appendChild(menu);
  pendingTagMenuEl = menu;
  positionMenu(menu, x, y);
  setTimeout(() => document.addEventListener('click', onDocClickClosePendingTagMenu), 0);
}

function renderTagCard(){
  closePendingTagMenu();
  synthDatTagPreview.innerHTML = '';
  const tags = pendingTagSnapshot || [];
  if (tags.length === 0){
    const empty = document.createElement('div');
    empty.className = 'stats-empty';
    empty.textContent = '(nothing to save yet)';
    synthDatTagPreview.appendChild(empty);
    return;
  }
  const mergeHistory = buildMergeHistoryMap();
  const voidSet = activeVoidTagSet();
  const row = document.createElement('div');
  row.className = 'chiprow';
  for (const tag of tags){
    const displayTag = mergedTagOverrides.get(tag) || tag;
    const excluded = excludedTags.has(tag);
    // Struck through either because the user explicitly marked it void this
    // round, or because it already matches a standing void rule from a past
    // one — both mean this exact string won't survive being added to the
    // Gallery, see finalTagList()'s own voidSet filter.
    const willVoid = markedVoidTags.has(tag) || voidSet.has(displayTag);

    const chip = document.createElement('span');
    chip.className = 'chip'
      + (excluded ? ' synthdat-chip-excluded' : '')
      + (willVoid ? ' synthdat-chip-void' : '');

    const label = document.createElement('span');
    label.textContent = displayTag;
    label.title = willVoid
      ? (markedVoidTags.has(tag)
          ? 'Marked as void — will be dropped and added as a Void rule on Accept.'
          : 'Already covered by an existing Void rule — will be dropped automatically once added to the Gallery.')
      : 'Right-click for definition / mark as void';
    label.style.cursor = 'pointer';
    label.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      openPendingTagMenu(tag, ev.clientX, ev.clientY);
    });
    chip.appendChild(label);

    // Only offer the merge suggestion while the tag is still in its
    // original (pre-merge) form and hasn't been pruned — accepting it or
    // excluding the tag both make the suggestion moot.
    if (!excluded && displayTag === tag){
      const suggestion = mergeHistory.get(normalizeTag(tag));
      if (suggestion && normalizeTag(suggestion) !== normalizeTag(tag)){
        const mergeBtn = document.createElement('button');
        mergeBtn.className = 'synthdat-merge-suggest';
        mergeBtn.textContent = `→ ${suggestion}`;
        mergeBtn.title = `This dataset previously merged "${tag}" into "${suggestion}" elsewhere — click to do the same here.`;
        mergeBtn.addEventListener('click', () => {
          mergedTagOverrides.set(tag, suggestion);
          renderTagCard();
        });
        chip.appendChild(mergeBtn);
      }
    }

    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = excluded ? '+' : '×';
    toggleBtn.title = excluded ? 'Restore this tag' : 'Drop this tag from what gets saved';
    toggleBtn.addEventListener('click', () => {
      if (excluded) excludedTags.delete(tag); else excludedTags.add(tag);
      renderTagCard();
    });
    chip.appendChild(toggleBtn);

    row.appendChild(chip);
  }
  synthDatTagPreview.appendChild(row);
}

// The list writePendingEntry() actually saves: merge overrides applied,
// excluded/voided tags dropped, deduped again in case a merge collapsed two
// tags into the same canonical spelling. voidSet is re-checked AFTER the
// merge-override map so a tag merged INTO an already-voided spelling is
// still caught, not just tags that were voided in their original form.
function finalTagList(){
  const voidSet = activeVoidTagSet();
  const tags = (pendingTagSnapshot || [])
    .filter(t => !excludedTags.has(t) && !markedVoidTags.has(t))
    .map(t => mergedTagOverrides.get(t) || t)
    .filter(t => !voidSet.has(t));
  return Array.from(new Set(tags));
}

function buildPromptFromFields(): SynthDatPrompt {
  const prompt: SynthDatPrompt = JSON.parse(JSON.stringify(template));
  const unified = synthDatUnifiedPromptMode.checked;
  const character = [unified ? fieldValue(synthDatUnifiedPrompt) : fieldValue(synthDatCharacter), fieldValue(synthDatCharacterTrigger)].filter(Boolean).join(', ');

  prompt['21'].inputs.value = fieldValue(synthDatGlobal);
  prompt['8'].inputs.value = unified ? '' : fieldValue(synthDatRating);
  prompt['19'].inputs.value = ''; // Character Count folded into Character (see above)
  prompt['11'].inputs.value = character;
  prompt['12'].inputs.value = unified ? '' : fieldValue(synthDatHair);
  prompt['15'].inputs.value = unified ? '' : fieldValue(synthDatFace);
  prompt['18'].inputs.value = unified ? '' : fieldValue(synthDatChest);
  prompt['9'].inputs.value = unified ? '' : fieldValue(synthDatBody);
  prompt['6'].inputs.value = unified ? '' : fieldValue(synthDatClothes);
  prompt['20'].inputs.value = unified ? '' : fieldValue(synthDatLimbs);
  prompt['14'].inputs.value = unified ? '' : fieldValue(synthDatSexual);
  prompt['7'].inputs.value = unified ? '' : fieldValue(synthDatPose);
  prompt['10'].inputs.value = unified ? '' : fieldValue(synthDatExtra);
  prompt['13'].inputs.value = unified ? '' : fieldValue(synthDatEffects);
  prompt['17'].inputs.value = unified ? '' : fieldValue(synthDatScene);
  prompt['16'].inputs.text = fieldValue(synthDatNegative);

  prompt['41'].inputs.unet_name = synthDatDiffModel.value;
  // 'None' (not '') is this node pack's convention for "no LoRA here" — see
  // node 237's own lora_03/04 defaults below. An empty string isn't a valid
  // value for this combo input, so leaving Main LoRA blank to mean "skip it"
  // was actually sending ComfyUI something it would reject outright.
  prompt['51'].inputs.lora_name = synthDatMainLora.value.trim() || 'None';
  // The template has two CLIPLoader nodes (249, 47:45) both loading the same
  // file — kept in sync here rather than exposed as two separate fields,
  // since there's no reason for them to ever differ in this workflow.
  if (synthDatClip.value) { prompt['249'].inputs.clip_name = synthDatClip.value; prompt['47:45'].inputs.clip_name = synthDatClip.value; }
  if (synthDatVae.value) prompt['47:46'].inputs.vae_name = synthDatVae.value;

  // First 4 LoRA rows fill the template's own stack node (237) directly.
  // Any rows beyond that chain additional stack node clones, each one's
  // model input wired to the previous stack's output.
  const chunks: LoraRow[][] = [];
  for (let i = 0; i < loraRows.length; i += 4) chunks.push(loraRows.slice(i, i + 4));
  function fillStackInputs(inputs: Record<string, unknown>, chunk: LoraRow[]): void {
    for (let i = 0; i < 4; i++){
      const slot = String(i + 1).padStart(2, '0');
      const r = chunk[i];
      inputs[`lora_${slot}`] = r ? (r.input.value.trim() || 'None') : 'None';
      inputs[`strength_${slot}`] = r ? (parseFloat(r.strength.value) || 0) : 0;
    }
  }
  // Always filled, even with zero rows — node 237 otherwise keeps whatever
  // LoRAs happened to be baked into the captured template's own JSON, since
  // nothing else in the graph ever clears them. That meant deleting every
  // row in the LoRA stack UI didn't actually generate with no LoRA at all;
  // it silently generated with the template's original ones.
  let lastStackId = '237';
  fillStackInputs(prompt['237'].inputs, chunks[0] || []);
  for (let c = 1; c < chunks.length; c++){
    const newId = `237_extra_${c}`;
    const newInputs = { model: [lastStackId, 0], clip: ['47:45', 0] };
    fillStackInputs(newInputs, chunks[c]);
    prompt[newId] = { class_type: 'DSM Lora Loader Stack', inputs: newInputs, _meta: { title: 'DSM Lora Loader Stack' } };
    lastStackId = newId;
  }
  if (lastStackId !== '237'){
    prompt['243'].inputs.input1 = [lastStackId, 0];
    prompt['240'].inputs.model = [lastStackId, 0];
    prompt['195'].inputs.model = [lastStackId, 0];
  }

  if (synthDatSkipRefImage.checked){
    // No reference image: literally remove the ControlNet path (LoadImage +
    // AnimaLLLiteApply + the switch) from the graph rather than just
    // flipping DSM Switch (Any)'s `select` to the base-model branch — ComfyUI's
    // executor resolves what to run from the prompt graph's edges, not from
    // a switch node's runtime value, so a connected-but-unselected branch
    // still executes (LoadImage still loads, AnimaLLLiteApply still runs
    // ControlNet inference) and still costs the user that generation time
    // for nothing. Mirrors the 1-Pass/2-Pass node-deletion pattern already
    // used above (see CLAUDE.md — no "disabled" flag exists in the API
    // format; presence/absence of the node IS the toggle). Image Resize
    // (238) and its PreviewImage (246) both depend on LoadImage's output too
    // — a PreviewImage node is itself an "output node" ComfyUI validates
    // independently of what 192 (the real SaveImage) needs, so a dangling
    // reference to a deleted 239 would fail prompt validation if left in.
    delete prompt['239'];
    delete prompt['240'];
    delete prompt['243'];
    delete prompt['238'];
    delete prompt['246'];
    prompt['158:53'].inputs.model = [lastStackId, 0];
    prompt['158:54'].inputs.model = [lastStackId, 0];
  } else {
    prompt['240'].inputs.strength = parseFloat(synthDatLLLiteStrength.value) || 0;
    prompt['240'].inputs.start_percent = parseFloat(synthDatLLLiteStartPercent.value) || 0;
    prompt['240'].inputs.end_percent = parseFloat(synthDatLLLiteEndPercent.value) || 0;
    prompt['240'].inputs.preserve_wrapper = synthDatLLLitePreserveWrapper.checked;
    // Always CNET-guided when a reference image is in use — the entire point of this feature (see CLAUDE.md).
    prompt['243'].inputs.select = 2;
    // Image Resize (rgthree, node 238) does the actual resize+pad; its
    // output feeds both ComfyUI's own PreviewImage (246, so a ComfyUI-side
    // user can see the result) and AnimaLLLiteApply's `image` input (240) —
    // ControlNet conditions on the padded/resized image, matching what both
    // that preview and our own app's resized-preview box show.
    prompt['238'].inputs.fit = synthDatResizeFit.value;
    prompt['238'].inputs.method = synthDatResizeMethod.value;
    prompt['240'].inputs.image = ['238', 0];
  }

  // Sampler/scheduler: the template's own switch (169, "1 = EA, 2 = ESDE")
  // just picks between two hardcoded KSamplerSelect nodes — rather than
  // exposing that switch mechanic, the user's chosen sampler is written
  // directly into whichever one it's pinned to select (168:167).
  prompt['168:167'].inputs.sampler_name = synthDatSampler.value;
  prompt['158:53'].inputs.scheduler = synthDatScheduler.value;
  prompt['158:53'].inputs.steps = parseInt(synthDatSteps1.value, 10) || 1;
  prompt['158:54'].inputs.cfg = parseFloat(synthDatCfg1.value) || 1;

  prompt['174:171'].inputs.value = parseInt(synthDatWidth.value, 10) || 920;
  prompt['174:172'].inputs.value = parseInt(synthDatHeight.value, 10) || 1244;

  prompt['165'].inputs.noise_seed = parseInt(synthDatSeed1.value, 10) || 0;

  if (synthDatUse2Pass.checked){
    prompt['227'].inputs.noise_seed = parseInt(synthDatSeed2.value, 10) || 0;
    prompt['195'].inputs.denoise = parseFloat(synthDatDenoise2.value) || 0;
    prompt['195'].inputs.scheduler = synthDatScheduler.value;
    prompt['195'].inputs.steps = parseInt(synthDatSteps2.value, 10) || 1;
    // Node 192 (the always-on SaveImage) already saves pass 2's decode (176
    // for pass 1, but 192 defaults to 191 — pass 2 — when this branch runs).
    // Cloning a second SaveImage pointed at pass 1's own decode (176) lets
    // the user choose between the two afterward instead of only ever seeing
    // the refined result — see generate()/main.ts's synthdat-queue-and-fetch,
    // which fetches both node 192's and this node's output when present.
    prompt['192_pass1'] = { class_type: 'SaveImage', inputs: { filename_prefix: prompt['192'].inputs.filename_prefix, images: ['176', 0] }, _meta: { title: 'Pass 1 preview' } };
  } else {
    // 1-Pass: omit the 2nd-pass nodes entirely (no "mode"/bypass flag exists
    // in the API format — presence/absence of the node IS the toggle, see
    // CLAUDE.md) and repoint the always-on SaveImage at pass-1's decode.
    delete prompt['190'];
    delete prompt['191'];
    delete prompt['195'];
    delete prompt['227'];
    delete prompt['224'];
    prompt['192'].inputs.images = ['176', 0];
  }

  return prompt;
}

// ---------------- Generate / Accept / Reject ----------------
// Neither Accept nor Reject writes anywhere until the user actually picks
// one — a generation just sits in memory (previewBytes) until then. Both
// outcomes write the image + a matching .txt into the dataset root first
// (via addEntryFromNewFile, appended straight into the live `entries` array
// so it shows up without any reload) — Accept leaves it there as a normal
// active entry; Reject immediately hands that same fresh entry to
// tags-edit.ts's own moveEntry(entry, true), the exact function every other
// "disable this image" action in the app already uses, so a rejected
// generation ends up exactly like any other disabled image (creates
// Disabled/ if needed, moves the files, flips entry.disabled) instead of a
// second, divergent "move to some other folder" path.

let pendingBase = '';
let pendingImgName = '';
// Only populated when a 2-Pass generation actually returned both images
// (see main.ts's synthdat-queue-and-fetch) — lets the user pick Pass 1 over
// the refined Pass 2 result after the fact, without regenerating.
let pass1Bytes: Uint8Array | null = null;
let pass2Bytes: Uint8Array | null = null;

function selectPass(which: number): void {
  const bytes = which === 1 ? pass1Bytes : pass2Bytes;
  if (!bytes) return;
  previewBytes = bytes;
  synthDatPreview.src = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'image/png' }));
  synthDatPickPass1.classList.toggle('active', which === 1);
  synthDatPickPass2.classList.toggle('active', which === 2);
}

async function generate(): Promise<void> {
  const skipRefImage = synthDatSkipRefImage.checked;
  if (!skipRefImage && !refFile){ toast('Pick a reference image first (or check "I don\'t want to use a reference image").'); return; }
  const dirHandle = getDirHandle();
  if (!dirHandle){ toast('Open a dataset folder first.'); return; }
  await autoRejectPendingIfAny();
  await loadTemplate();
  const host = getHost();
  const prompt = buildPromptFromFields();
  const bytes = skipRefImage ? null : new Uint8Array(await refFile!.arrayBuffer());
  // Snapshot the tag list from the same field values buildPromptFromFields()
  // just read — this becomes the tag card's frozen contents if generation
  // succeeds, independent of any further field edits made while it's running.
  const tagSnapshot = baseTagList();

  btnSynthDatGenerate.disabled = true;
  btnSynthDatStop.disabled = false;
  btnSynthDatAccept.disabled = true;
  btnSynthDatReject.disabled = true;
  btnSynthDatReinterrogateOutput.disabled = true;
  synthDatReinterrogateResult.style.display = 'none';
  synthDatLivePreview.src = '';
  synthDatLivePreviewWrap.style.display = 'none';
  pendingTagSnapshot = null;
  excludedTags = new Set();
  mergedTagOverrides = new Map();
  markedVoidTags = new Set();
  renderTagCard();
  setGenStatus('Generating… this can take a while.');

  const res = await window.electronAPI.synthdatQueueAndFetch({
    host,
    imageFilename: skipRefImage ? null : refFilename,
    imageBytes: bytes,
    prompt
  });

  btnSynthDatGenerate.disabled = false;
  btnSynthDatStop.disabled = true;
  synthDatLivePreviewWrap.style.display = 'none';
  if (!res.ok){
    if (res.interrupted) toast('Generation stopped.');
    setGenStatus(res.interrupted ? '' : (res.error || 'Generation failed.'));
    return;
  }
  setGenStatus('');
  previewBytes = res.imageBytes || null;
  pendingBase = `synth_${Date.now().toString(36)}`;
  pendingImgName = `${pendingBase}.png`;
  pendingTagSnapshot = tagSnapshot;
  renderTagCard();

  pass2Bytes = res.imageBytes || null;
  pass1Bytes = res.pass1ImageBytes || null;
  if (pass1Bytes){
    synthDatPass1Thumb.src = URL.createObjectURL(new Blob([pass1Bytes as BlobPart], { type: 'image/png' }));
    synthDatPass2Thumb.src = URL.createObjectURL(new Blob([pass2Bytes as BlobPart], { type: 'image/png' }));
    synthDatPassPickerRow.style.display = 'flex';
    synthDatPickPass1.classList.remove('active');
    synthDatPickPass2.classList.add('active');
  } else {
    synthDatPassPickerRow.style.display = 'none';
  }

  const blob = new Blob([previewBytes as BlobPart], { type: 'image/png' });
  synthDatPreview.src = URL.createObjectURL(blob);
  synthDatPreview.style.display = 'block';
  synthDatPreviewEmpty.style.display = 'none';
  btnSynthDatAccept.disabled = false;
  btnSynthDatReject.disabled = false;
  btnSynthDatReinterrogateOutput.disabled = false;
}

// Writes one generated image and appends it to `entries`, either disabling
// it immediately (Reject, auto-reject) or adding it as a normal unsaved edit
// (Accept). Returns the new entry, or null if the write failed (toasting its
// own error either way). Shared by every path that commits a generated
// image to disk.
// Scans the dataset root for existing plain-integer filenames (e.g. "07.png")
// and returns the next number in that sequence, zero-padded to match
// whatever width the existing sequence already uses — so accepting one
// synth-generated image into an already-renamed (see tags-edit.ts's
// renameAllEntriesSequentially()) dataset slots in with the same "01".."NN"
// convention instead of a mismatched width. Defaults to {next:1, width:1}
// for a dataset that isn't using this convention at all yet.
async function computeNextSequentialBase(dirHandle: DirHandle): Promise<{ next: number; width: number }> {
  let maxNum = 0;
  let width = 1;
  for await (const h of dirHandle.values()){
    if (h.kind !== 'file') continue;
    const dot = h.name.lastIndexOf('.');
    const base = dot === -1 ? h.name : h.name.slice(0, dot);
    if (!/^\d+$/.test(base)) continue;
    const n = parseInt(base, 10);
    if (n >= maxNum){ maxNum = n; width = Math.max(width, base.length); }
  }
  return { next: maxNum + 1, width: Math.max(width, String(maxNum + 1).length) };
}

async function writeImageEntry(bytes: Uint8Array, base: string, imgName: string, tags: string[], disable: boolean): Promise<Entry | null> {
  const dirHandle = getDirHandle();
  if (!dirHandle) return null;
  try {
    if (disable){
      // Disabled entries (Reject, auto-reject-the-leftover-pass) are written
      // straight into the dataset root and saved immediately — there's no
      // "keep editing before saving" workflow for something that's already
      // being moved out of the active set — then moveEntry() relocates them
      // into Disabled/ the same way any other disable action does.
      const imgHandle = await dirHandle.getFileHandle(imgName, { create: true });
      const imgWritable = await imgHandle.createWritable();
      await imgWritable.write(bytes as BufferSource);
      await imgWritable.close();
      const txtHandle = await dirHandle.getFileHandle(`${base}.txt`, { create: true });
      const txtWritable = await txtHandle.createWritable();
      await txtWritable.write(tags.map(t => t.replace(/ /g, '_')).join(', '));
      await txtWritable.close();
      const entry = await addEntryFromNewFile(base, imgHandle, imgName, txtHandle, true, tags, false) as Entry | null;
      if (entry) await moveEntry(entry, true);
      return entry;
    }
    // Accept: written straight into the dataset root, same as any other
    // entry. The .txt is written alongside the image immediately, not
    // deferred — accepting an image means trusting the tag card's tags as
    // they stand, so there's no reason to risk losing them to a crash
    // between now and the next Save the way a purely in-memory edit would.
    // entry.dirty still starts true regardless (markDirty() below): this
    // immediate write is a safety net, not a substitute for the normal
    // dirty/save lifecycle every other entry goes through.
    const imgHandle = await dirHandle.getFileHandle(imgName, { create: true });
    const imgWritable = await imgHandle.createWritable();
    await imgWritable.write(bytes as BufferSource);
    await imgWritable.close();
    const txtHandle = await dirHandle.getFileHandle(`${base}.txt`, { create: true });
    const txtWritable = await txtHandle.createWritable();
    await txtWritable.write(tags.map(t => t.replace(/ /g, '_')).join(', '));
    await txtWritable.close();
    const entry = await addEntryFromNewFile(base, imgHandle, imgName, txtHandle, true, tags, false) as Entry | null;
    if (entry) markDirty(entry);
    return entry;
  } catch(err){
    toast(`Could not save an image: ${(err as Error)?.message || err}`, 4200);
    return null;
  }
}

// The pass NOT currently selected (see selectPass()) — null for a 1-Pass
// generation, where pass1Bytes never gets populated in the first place.
function otherPassBytes(){
  if (!pass1Bytes) return null;
  return previewBytes === pass1Bytes ? pass2Bytes : pass1Bytes;
}

// Accept keeps the selected pass in the main dataset and, if the OTHER pass
// exists (2-Pass ran), rejects it into Disabled/ instead of silently
// discarding it — every generated image ends up somewhere on disk, never
// thrown away outright.
async function acceptImage(){
  const dirHandle = getDirHandle();
  if (!dirHandle){ toast('Open a dataset folder first.'); return; }
  if (!previewBytes){ toast('Nothing to accept or reject yet.'); return; }
  const tags = finalTagList(); // reflects the tag card's own prune/merge decisions
  // Tags marked void this round become a real standing rule the moment this
  // image is actually committed — not on every render, and not on Reject
  // (a rejected image's tag choices aren't being trusted as dataset intent).
  // registerVoidRule() also resweeps every other loaded Gallery entry, so
  // any past image already carrying one of these tags gets cleaned up too.
  if (markedVoidTags.size > 0) registerVoidRule(Array.from(markedVoidTags));
  let base = pendingBase, imgName = pendingImgName;
  if (synthDatRenameOnAccept.checked){
    const { next, width } = await computeNextSequentialBase(dirHandle);
    base = String(next).padStart(width, '0');
    imgName = `${base}.png`;
  }
  const entry = await writeImageEntry(previewBytes, base, imgName, tags, false);
  if (!entry) return;
  const alt = otherPassBytes();
  if (alt) await writeImageEntry(alt, `${pendingBase}_altpass`, `${pendingBase}_altpass.png`, tags, true);
  toast(alt ? 'Added to the dataset — the other pass was rejected into Disabled/.' : 'Added to the dataset.');
  refreshAllUIRef();
  clearPreview();
}

// Reject sends EVERY generated pass to Disabled/, not just whichever one was
// selected — there's no "keep" decision being made here, so nothing should
// survive as an active entry.
async function rejectImage(){
  const dirHandle = getDirHandle();
  if (!dirHandle){ toast('Open a dataset folder first.'); return; }
  if (!previewBytes){ toast('Nothing to accept or reject yet.'); return; }
  const tags = finalTagList();
  const entry = await writeImageEntry(previewBytes, pendingBase, pendingImgName, tags, true);
  if (!entry) return;
  const alt = otherPassBytes();
  if (alt) await writeImageEntry(alt, `${pendingBase}_altpass`, `${pendingBase}_altpass.png`, tags, true);
  toast('Rejected into Disabled/.');
  refreshAllUIRef();
  clearPreview();
}

// Generate() calls this first — if a previous generation is still sitting
// there un-decided (the user started a new one instead of clicking Accept
// or Reject), every pass it produced gets auto-rejected into Disabled/
// rather than silently vanishing when clearPreview() resets the pending
// state for the new run.
async function autoRejectPendingIfAny(){
  if (!previewBytes) return;
  const dirHandle = getDirHandle();
  if (!dirHandle) return;
  const tags = pendingTagSnapshot || [];
  await writeImageEntry(previewBytes, pendingBase, pendingImgName, tags, true);
  const alt = otherPassBytes();
  if (alt) await writeImageEntry(alt, `${pendingBase}_altpass`, `${pendingBase}_altpass.png`, tags, true);
  toast('Previous generation wasn\'t Accepted/Rejected — auto-rejected into Disabled/.');
  refreshAllUIRef();
  clearPreview();
}

function clearPreview(){
  previewBytes = null;
  pendingBase = '';
  pendingImgName = '';
  synthDatPreview.src = '';
  synthDatPreview.style.display = 'none';
  synthDatPreviewEmpty.style.display = 'block';
  synthDatPassPickerRow.style.display = 'none';
  pass1Bytes = null;
  pass2Bytes = null;
  btnSynthDatAccept.disabled = true;
  btnSynthDatReject.disabled = true;
  btnSynthDatReinterrogateOutput.disabled = true;
  synthDatReinterrogateResult.style.display = 'none';
  // The tag card is a frozen snapshot of the generation that just got
  // accepted/rejected — nothing is pending anymore, so it goes back to empty.
  // Prompt fields (including Pose/Limbs/Sexual) are untouched here: they
  // only change when the user edits them directly or uses Migrate, never as
  // a side effect of Accept/Reject.
  pendingTagSnapshot = null;
  excludedTags = new Set();
  mergedTagOverrides = new Map();
  markedVoidTags = new Set();
  renderTagCard();
}

// ---------------- Init ----------------

const SAMPLERS = [
  'res_multistep', 'sa_solver_pece', 'euler', 'euler_ancestral', 'dpmpp_2m', 'dpmpp_2m_sde',
  'dpmpp_3m_sde', 'dpmpp_sde', 'dpmpp_2s_ancestral', 'ddim', 'uni_pc', 'lcm', 'deis'
];
const SCHEDULERS = ['beta', 'normal', 'karras', 'exponential', 'sgm_uniform', 'simple', 'ddim_uniform', 'linear_quadratic'];

function fillStaticOptions(selectEl: HTMLInputElement, values: string[], def: string): void {
  selectEl.innerHTML = '';
  for (const v of values){
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    selectEl.appendChild(opt);
  }
  if (def) selectEl.value = def;
}

function clickToZoom(wrap: HTMLElement, img: HTMLImageElement): void {
  // naturalWidth is the robust check here (rather than the wrap's or img's
  // own `display` style) — it's 0 whenever there's genuinely no loaded
  // image, regardless of which of the two toggles a given preview box
  // happens to use to show/hide itself.
  wrap.addEventListener('click', () => { if (img.naturalWidth > 0) showImageLightbox(img.src); });
}

interface SynthDatOverseerDeps {
  getDirHandle: () => DirHandle | null;
  addEntryFromNewFile: (...args: unknown[]) => Promise<Entry | null>;
  refreshAllUI: () => void;
}

export function initSynthDatOverseer(deps: SynthDatOverseerDeps): void {
  getDirHandle = deps.getDirHandle;
  addEntryFromNewFile = deps.addEntryFromNewFile;
  refreshAllUIRef = deps.refreshAllUI;

  loadTemplate();

  fillStaticOptions(synthDatSampler, SAMPLERS, 'res_multistep');
  fillStaticOptions(synthDatScheduler, SCHEDULERS, 'beta');

  // No dataset is open yet at app startup, so there's nothing to load —
  // loadSynthDatSettingsForFolder() (called from index.ts on dataset
  // open/unload) does the actual loading, per dataset, from here on.

  // Any field that shapes either the generation prompt or the saved tag
  // list schedules a persistence save; the prompt-field ones also refresh
  // the live "tags this will save" preview immediately.
  const promptFields = [
    synthDatUnifiedPrompt, synthDatGlobal, synthDatCharacter, synthDatCharacterTrigger, synthDatRating, synthDatHair, synthDatFace,
    synthDatChest, synthDatBody, synthDatClothes, synthDatLimbs, synthDatSexual, synthDatPose, synthDatScene,
    synthDatEffects, synthDatExtra
  ];
  promptFields.forEach(el => el.addEventListener('input', () => { growTextarea(el); scheduleSave(); }));
  synthDatNegative.addEventListener('input', () => { growTextarea(synthDatNegative); scheduleSave(); });
  synthDatStripHairFace.addEventListener('change', () => { scheduleSave(); });
  synthDatUnifiedPromptMode.addEventListener('change', () => { applyUnifiedPromptModeUI(); scheduleSave(); });
  applyUnifiedPromptModeUI();

  btnSynthDatPromptPanelToggle.addEventListener('click', openSynthDatPromptPanel);
  btnSynthDatPromptPanelClose.addEventListener('click', closeSynthDatPromptPanel);

  [
    synthDatHost, synthDatDiffModel, synthDatClip, synthDatVae, synthDatMainLora, synthDatLLLiteStrength,
    synthDatLLLiteStartPercent, synthDatLLLiteEndPercent, synthDatLLLitePreserveWrapper,
    synthDatResizeMethod,
    synthDatSampler, synthDatScheduler, synthDatSteps1, synthDatCfg1, synthDatSteps2, synthDatUse2Pass,
    synthDatSeed1, synthDatSeed2, synthDatDenoise2
  ].forEach(el => el.addEventListener('change', scheduleSave));
  synthDatResizeFit.addEventListener('change', () => { updateResizedPreview(); scheduleSave(); });

  synthDatSkipRefImage.addEventListener('change', () => {
    applySkipRefImageUI();
    scheduleSave();
  });
  applySkipRefImageUI();

  synthDatWidth.addEventListener('input', () => { updateResizedPreview(); updateResoWarning(); scheduleSave(); });
  synthDatHeight.addEventListener('input', () => { updateResizedPreview(); updateResoWarning(); scheduleSave(); });
  btnSynthDatSwapReso.addEventListener('click', () => {
    const w = synthDatWidth.value;
    synthDatWidth.value = synthDatHeight.value;
    synthDatHeight.value = w;
    updateResizedPreview();
    updateResoWarning();
    scheduleSave();
  });

  // "Allow zooming in on all images on this page" — reference, its padded
  // preview, the live TAESD preview, and the final output all open the same
  // lightbox on click.
  clickToZoom(synthDatRefPreviewWrap, synthDatRefPreview);
  clickToZoom(synthDatResizedPreviewWrap, synthDatResizedPreview);
  clickToZoom(synthDatLivePreviewWrap, synthDatLivePreview);
  clickToZoom(synthDatPreviewWrap, synthDatPreview);

  // TAESD live-preview frames + step progress arrive as separate main->
  // renderer events while synthdatQueueAndFetch()'s own invoke() is still
  // pending (see main.ts's comment on the handler) — registered once here
  // rather than per-generate(), since only one generation ever runs at a
  // time in this app.
  window.electronAPI.onSynthdatPreviewFrame((_event, { mime, bytes }) => {
    const blob = new Blob([bytes as BlobPart], { type: mime });
    synthDatLivePreview.src = URL.createObjectURL(blob);
    // Not 'block' — this wrap shares .synthdat-ref-preview/its own
    // #synthDatLivePreviewWrap rule, both of which center their image via
    // display:flex; an inline display:block here was overriding that (inline
    // style always beats a stylesheet rule), leaving the live preview
    // flush against the box's left edge instead of centered.
    synthDatLivePreviewWrap.style.display = 'flex';
  });
  window.electronAPI.onSynthdatProgress((_event, { value, max }) => {
    setGenStatus(`Generating… step ${value}/${max}`);
  });

  btnSynthDatPickImage.addEventListener('click', pickReferenceImage);
  btnSynthDatInterrogate.addEventListener('click', interrogateReference);
  btnSynthDatMigratePose.addEventListener('click', applyTagAssignment);
  btnSynthDatAddLora.addEventListener('click', () => { addLoraRow('None', 1); scheduleSave(); });
  btnSynthDatRefreshModels.addEventListener('click', refreshModelLists);
  btnSynthDatConnect.addEventListener('click', testSynthdatConnection);
  // Replaces these fields' old native `<datalist>` dropdown (see
  // attachListAutocomplete's own comment) — the `<datalist>` elements
  // themselves stay in the DOM purely as the options source refreshModelLists()
  // already populates via fillDatalist(), just no longer wired to an input.
  const datalistOptions = (el: HTMLElement) => Array.from((el as unknown as HTMLSelectElement).options).map((o: HTMLOptionElement) => o.value);
  attachListAutocomplete(synthDatDiffModel, () => datalistOptions(synthDatUnetDatalist));
  attachListAutocomplete(synthDatClip, () => datalistOptions(synthDatClipDatalist));
  attachListAutocomplete(synthDatVae, () => datalistOptions(synthDatVaeDatalist));
  attachListAutocomplete(synthDatMainLora, () => datalistOptions(synthDatMainLoraDatalist));
  btnSynthDatGenerate.addEventListener('click', generate);
  btnSynthDatStop.addEventListener('click', () => window.electronAPI.synthdatStopGeneration(getHost()));
  btnSynthDatAccept.addEventListener('click', acceptImage);
  btnSynthDatReject.addEventListener('click', rejectImage);
  synthDatPickPass1.addEventListener('click', () => selectPass(1));
  synthDatPickPass2.addEventListener('click', () => selectPass(2));
  btnSynthDatReinterrogateOutput.addEventListener('click', reinterrogateOutput);

  renderTagCard(); // starts empty — pendingTagSnapshot is null until a generation finishes
  refreshModelLists();
  initSynthDatSectionDocks(synthDatCol1);
}
