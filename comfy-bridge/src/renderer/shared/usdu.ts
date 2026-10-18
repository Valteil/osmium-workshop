// USDU (Ultimate SD Upscale) — the alternative to the standard upscale pass.
// One module for both shells: the settings panel (built here so desktop and
// mobile can't drift — notes/Pitfalls/Forked-Copy-Drifts.md), the graph
// builder, and the prompt-source logic. Graph shape follows the user's
// reference workflow: LoadImage/decoded image → UltimateSDUpscale with its own
// CheckpointLoaderSimple + UpscaleModelLoader, positive from the image's
// prompt / WD14Tagger|pysssss / the user's text, own negative → SaveImage.
//
// Two ways in, same nodes:
// - after a generation: appended to the Bridge workflow, fed from the final
//   image (192's input: pass 2 when 2-Pass is on) and saved by '192_upscaled',
//   exactly where the standard upscale's output goes.
// - an imported image: a standalone graph whose LoadImage is '239' and whose
//   save node is '192', so every transport (desktop main, Osmium Comfy runner,
//   the relay, the phone) uploads and fetches it unchanged.
import { attachPickerModal } from './picker-modal';
import { mergedPromptText } from './gen-info';
import { foreignSource, imageMetadataTexts, mergePromptFields, normalizeGeneration, splitPromptToFields } from './prompt-import';

type Prompt = Record<string, any>;

export interface UsduSettings {
  source: 'generated' | 'imported';
  ckpt: string; upscaleModel: string; upscaleBy: string;
  seed: string; steps: string; cfg: string; sampler: string; scheduler: string; denoise: string;
  modeType: string; tileSize: 'source' | 'custom'; tileWidth: string; tileHeight: string; maskBlur: string; tilePadding: string;
  seamFixMode: string; seamFixDenoise: string; seamFixWidth: string; seamFixMaskBlur: string; seamFixPadding: string;
  forceUniformTiles: boolean; tiledDecode: boolean; batchSize: string;
  promptSource: 'image' | 'wd14' | 'own'; excludeGlobal: boolean; ownPrompt: string; negative: string;
  wd14Model: string; wd14Threshold: string; wd14CharThreshold: string; wd14ReplaceUnderscore: boolean; wd14Exclude: string;
}
type Key = keyof UsduSettings;
export type UsduListKind = 'ckpt' | 'upscale' | 'sampler' | 'scheduler' | 'wd14';

// Defaults = the reference workflow (USDU UPSCALE.json).
export const USDU_DEFAULTS: UsduSettings = {
  source: 'generated',
  ckpt: 'Janku 6.9.safetensors', upscaleModel: '4xNomosUni_span_multijpg.pth', upscaleBy: '2',
  seed: '0', steps: '15', cfg: '4', sampler: 'res_multistep', scheduler: 'beta', denoise: '0.25',
  modeType: 'Linear', tileSize: 'source', tileWidth: '1024', tileHeight: '1024', maskBlur: '32', tilePadding: '256',
  seamFixMode: 'None', seamFixDenoise: '1', seamFixWidth: '64', seamFixMaskBlur: '8', seamFixPadding: '16',
  forceUniformTiles: true, tiledDecode: false, batchSize: '1',
  promptSource: 'wd14', excludeGlobal: true, ownPrompt: '',
  negative: 'censored, text, blank censor, extra fingers, six fingers, signature, username, logo, watermark, e621, ambiguous form, anthropomorphic, cropped',
  wd14Model: 'wd-eva02-large-tagger-v3', wd14Threshold: '0.35', wd14CharThreshold: '0.85', wd14ReplaceUnderscore: false, wd14Exclude: ''
};

interface FieldDef {
  key: Key; label: string; tip: string;
  type: 'number' | 'pick' | 'select' | 'check' | 'text' | 'textarea';
  step?: string; min?: string; max?: string;
  options?: [string, string][]; list?: UsduListKind;
  show?: (s: UsduSettings) => boolean; wide?: boolean;
}
interface Section { head: string; tip?: string; fields: FieldDef[]; }

const SECTIONS: Section[] = [
  { head: 'Input', fields: [
    { key: 'source', type: 'select', label: 'Image to upscale', wide: true,
      options: [['generated', 'The image I generate'], ['imported', 'An image I import']],
      tip: 'The image I generate: every generation is upscaled as its last step (the pass-2 image when 2-Pass is on, since that is the final one). An image I import: pick any image below and press Upscale this image; generating is not involved.' }
  ] },
  { head: 'Models', fields: [
    { key: 'ckpt', type: 'pick', list: 'ckpt', label: 'Checkpoint', wide: true,
      tip: 'The checkpoint that redraws each tile (an SDXL / Illustrious-family model from ComfyUI\'s checkpoints folder). It is separate from the generation model: USDU loads its own, which is why an Illustrious model works here. Default: Janku 6.9.' },
    { key: 'upscaleModel', type: 'pick', list: 'upscale', label: 'Upscale model', wide: true,
      tip: 'The upscaler (ESRGAN-style) that enlarges the image before the tiles are redrawn. Its own scale does not matter: the result is resized to "Upscale by". Default: 4xNomosUni_span_multijpg.' },
    { key: 'upscaleBy', type: 'number', step: '0.05', min: '0.05', max: '4', label: 'Upscale by',
      tip: 'How much bigger the final image is than the input (2 = twice the width and height). 0.05 to 4.' }
  ] },
  { head: 'Sampling', fields: [
    { key: 'seed', type: 'number', step: '1', min: '0', label: 'Seed', tip: 'The noise seed for the tile redraw. Same seed + same settings = same result.' },
    { key: 'steps', type: 'number', step: '1', min: '1', label: 'Steps', tip: 'Sampling steps for each tile. At a low denoise only the last part of them actually runs, so more steps mostly means finer control.' },
    { key: 'cfg', type: 'number', step: '0.1', min: '0', label: 'CFG', tip: 'How strongly each tile follows the prompt. Illustrious models usually like 3 to 6.' },
    { key: 'denoise', type: 'number', step: '0.01', min: '0', max: '1', label: 'Denoise',
      tip: 'How much each tile is redrawn. 0.2–0.3 adds detail and keeps the image; higher values change more and can draw new things into a tile (extra faces, hands).' },
    { key: 'sampler', type: 'pick', list: 'sampler', label: 'Sampler', tip: 'The sampler for the tile redraw (the list is your ComfyUI\'s). Default: res_multistep.' },
    { key: 'scheduler', type: 'pick', list: 'scheduler', label: 'Scheduler', tip: 'The noise schedule for the tile redraw. Default: beta.' }
  ] },
  { head: 'Tiles', fields: [
    { key: 'modeType', type: 'select', label: 'Tiling mode', options: [['Linear', 'Linear'], ['Chess', 'Chess'], ['None', 'None']],
      tip: 'The order tiles are redrawn in. Linear: row by row. Chess: a checkerboard, which can hide seams better. None: only the upscale model runs, no redraw (sampling settings then do nothing).' },
    { key: 'tileSize', type: 'select', label: 'Tile size', options: [['source', 'Match the input image'], ['custom', 'Custom']],
      tip: 'Match the input image: each tile is the size of the image before upscaling (the reference workflow wires it this way), so a 1024×1024 image upscaled 2× is redrawn as four 1024×1024 tiles — the size the model was trained at. Custom: set width and height yourself.' },
    { key: 'tileWidth', type: 'number', step: '8', min: '64', label: 'Tile width', show: (s) => s.tileSize === 'custom',
      tip: 'Width of each tile in pixels (multiple of 8). Around the model\'s native size (1024 for SDXL / Illustrious) works best; bigger tiles need more VRAM.' },
    { key: 'tileHeight', type: 'number', step: '8', min: '64', label: 'Tile height', show: (s) => s.tileSize === 'custom',
      tip: 'Height of each tile in pixels (multiple of 8).' },
    { key: 'maskBlur', type: 'number', step: '1', min: '0', max: '64', label: 'Mask blur',
      tip: 'How soft each tile\'s edge is blended into its neighbours, in pixels (0–64). Higher hides seams, too high smears detail at the edges.' },
    { key: 'tilePadding', type: 'number', step: '8', min: '0', label: 'Tile padding',
      tip: 'Extra surrounding image each tile sees while it is redrawn, in pixels. More padding gives the model more context, so tiles agree with each other; it costs time and VRAM.' },
    { key: 'batchSize', type: 'number', step: '1', min: '1', label: 'Batch size',
      tip: 'Tiles redrawn at once. Higher can be faster but uses more VRAM, and gives slightly different results than one at a time. Only the main redraw, not the seam fix.' },
    { key: 'forceUniformTiles', type: 'check', label: 'Force uniform tiles',
      tip: 'Every tile is the full tile size, even at the image\'s edges where a smaller one would do. Keeps the model working at one size. On in the reference workflow.' },
    { key: 'tiledDecode', type: 'check', label: 'Tiled decode',
      tip: 'Decode each tile from latent in pieces. Saves VRAM on very large tiles; usually not needed.' }
  ] },
  { head: 'Seam fix', fields: [
    { key: 'seamFixMode', type: 'select', label: 'Seam fix mode', wide: true,
      options: [['None', 'None'], ['Band Pass', 'Band Pass'], ['Half Tile', 'Half Tile'], ['Half Tile + Intersections', 'Half Tile + Intersections']],
      tip: 'A second pass over the tile borders if seams show. None: off (fine with enough padding and mask blur). Band Pass: redraws a band along each seam. Half Tile: redraws half-tiles straddling the seams. + Intersections also redraws the corners where four tiles meet. Each adds time.' },
    { key: 'seamFixDenoise', type: 'number', step: '0.01', min: '0', max: '1', label: 'Seam fix denoise', show: (s) => s.seamFixMode !== 'None',
      tip: 'How much the seam areas are redrawn (0–1).' },
    { key: 'seamFixWidth', type: 'number', step: '8', min: '0', label: 'Seam fix width', show: (s) => s.seamFixMode === 'Band Pass',
      tip: 'Width of the band redrawn along each seam, in pixels (Band Pass only).' },
    { key: 'seamFixMaskBlur', type: 'number', step: '1', min: '0', max: '64', label: 'Seam fix mask blur', show: (s) => s.seamFixMode !== 'None',
      tip: 'How soft the seam-fix areas blend in, in pixels (0–64).' },
    { key: 'seamFixPadding', type: 'number', step: '8', min: '0', label: 'Seam fix padding', show: (s) => s.seamFixMode !== 'None',
      tip: 'Extra surrounding image each seam-fix area sees, in pixels.' }
  ] },
  { head: 'Prompt', fields: [
    { key: 'promptSource', type: 'select', label: 'Prompt for the tiles', wide: true,
      options: [['image', 'Use my image\'s prompts'], ['wd14', 'Tag with WD14'], ['own', 'Use my own prompt']],
      tip: 'What each tile is told the image shows. Use my image\'s prompts: the generation\'s prompt (or, for an imported image, the prompt saved in it). Tag with WD14: the WD14 tagger describes the image in Danbooru tags, as the reference workflow does. Use my own prompt: type it below.' },
    { key: 'excludeGlobal', type: 'check', label: 'Leave out the Global prompt field', wide: true, show: (s) => s.promptSource === 'image',
      tip: 'Drop the Global field (where the artist / style prompt lives) from the prompt. Artist tags written for the generation model can misbehave on an Illustrious checkpoint. For an imported non-Bridge image the Global part is found by the same splitter Import Generation uses.' },
    { key: 'ownPrompt', type: 'textarea', label: 'Prompt', wide: true, show: (s) => s.promptSource === 'own',
      tip: 'The positive prompt every tile is redrawn with.' },
    { key: 'wd14Model', type: 'pick', list: 'wd14', label: 'WD14 model', wide: true, show: (s) => s.promptSource === 'wd14',
      tip: 'The tagger model (needs the ComfyUI-WD14-Tagger node pack). Default: wd-eva02-large-tagger-v3.' },
    { key: 'wd14Threshold', type: 'number', step: '0.01', min: '0', max: '1', label: 'Tag threshold', show: (s) => s.promptSource === 'wd14',
      tip: 'Minimum confidence for a general tag to be used (0–1). Lower = more tags, more wrong ones.' },
    { key: 'wd14CharThreshold', type: 'number', step: '0.01', min: '0', max: '1', label: 'Character threshold', show: (s) => s.promptSource === 'wd14',
      tip: 'Minimum confidence for a character tag (0–1). Kept high so a lookalike isn\'t named.' },
    { key: 'wd14ReplaceUnderscore', type: 'check', label: 'Spaces instead of underscores', wide: true, show: (s) => s.promptSource === 'wd14',
      tip: 'Write tags as "long hair" instead of "long_hair". Off in the reference workflow.' },
    { key: 'wd14Exclude', type: 'text', label: 'Exclude tags', wide: true, show: (s) => s.promptSource === 'wd14',
      tip: 'Comma-separated tags the tagger must never output (e.g. tags that would fight the upscale).' },
    { key: 'negative', type: 'textarea', label: 'Negative prompt', wide: true,
      tip: 'The negative prompt for the tile redraw, used with every prompt choice. Separate from the generation\'s negative, since the checkpoint is different.' }
  ] }
];

const idOf = (prefix: string, key: Key): string => prefix + key[0].toUpperCase() + key.slice(1);
const num = (v: string, fallback: number): number => { const n = parseFloat(v); return Number.isFinite(n) ? n : fallback; };
const int = (v: string, fallback: number): number => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : fallback; };

// ---- graph ----

export interface ImageSize { width: number; height: number; }

// Pixel size from PNG / JPEG / WebP bytes, or null.
export function imageSizeOf(b: Uint8Array): ImageSize | null {
  const u32 = (i: number) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
  const u16 = (i: number) => (b[i] << 8) | b[i + 1];
  const le16 = (i: number) => b[i] | (b[i + 1] << 8);
  const le24 = (i: number) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);
  if (b.length > 24 && b[0] === 0x89 && b[1] === 0x50) return { width: u32(16), height: u32(20) };
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1];
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { width: u16(i + 7), height: u16(i + 5) };
      if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7) || m === 0xff) { i += m === 0xff ? 1 : 2; continue; }
      i += 2 + u16(i + 2);
    }
    return null;
  }
  if (b.length > 30 && String.fromCharCode(b[0], b[1], b[2], b[3], b[8], b[9], b[10], b[11]) === 'RIFFWEBP') {
    const kind = String.fromCharCode(b[12], b[13], b[14], b[15]);
    if (kind === 'VP8X') return { width: le24(24) + 1, height: le24(27) + 1 };
    if (kind === 'VP8L') { const v = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24); return { width: (v & 0x3fff) + 1, height: ((v >> 14) & 0x3fff) + 1 }; }
    if (kind === 'VP8 ') return { width: le16(26) & 0x3fff, height: le16(28) & 0x3fff };
  }
  return null;
}

// Adds the USDU nodes to `prompt`, upscaling `image`, saved by `saveId`.
// `positive` is ignored with the WD14 prompt source (linked to the tagger).
// `inputSize` = the image's size, for "Match the input image" tiles.
export function appendUsduNodes(prompt: Prompt, image: unknown, s: UsduSettings, positive: string, saveId: string, filenamePrefix: unknown, inputSize: ImageSize | null): void {
  const d = USDU_DEFAULTS;
  prompt['usdu_ckpt'] = { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: s.ckpt.trim() || d.ckpt }, _meta: { title: 'USDU Checkpoint' } };
  prompt['usdu_upmodel'] = { class_type: 'UpscaleModelLoader', inputs: { model_name: s.upscaleModel.trim() || d.upscaleModel }, _meta: { title: 'USDU Upscale Model' } };
  let posText: unknown = positive;
  if (s.promptSource === 'wd14') {
    prompt['usdu_wd14'] = {
      class_type: 'WD14Tagger|pysssss',
      inputs: {
        image, model: s.wd14Model.trim() || d.wd14Model,
        threshold: num(s.wd14Threshold, 0.35), character_threshold: num(s.wd14CharThreshold, 0.85),
        replace_underscore: !!s.wd14ReplaceUnderscore, trailing_comma: false, exclude_tags: s.wd14Exclude || ''
      },
      _meta: { title: 'USDU WD14 Tagger' }
    };
    posText = ['usdu_wd14', 0];
  }
  prompt['usdu_pos'] = { class_type: 'CLIPTextEncode', inputs: { text: posText, clip: ['usdu_ckpt', 1] }, _meta: { title: 'USDU Positive' } };
  prompt['usdu_neg'] = { class_type: 'CLIPTextEncode', inputs: { text: s.negative, clip: ['usdu_ckpt', 1] }, _meta: { title: 'USDU Negative' } };
  // Tile = the input image's size, as the reference workflow wires it
  // (GetImageSize → tile_width/height): native-size tiles for any input.
  // Worked out here instead (a generation's size is known; an import's is
  // read from its bytes), so Osmium Comfy needs no extra node pack for it.
  let tileW = int(s.tileWidth, 1024);
  let tileH = int(s.tileHeight, 1024);
  if (s.tileSize !== 'custom' && inputSize) { tileW = inputSize.width; tileH = inputSize.height; }
  tileW = Math.max(64, tileW);
  tileH = Math.max(64, tileH);
  prompt['usdu'] = {
    class_type: 'UltimateSDUpscale',
    inputs: {
      upscale_by: num(s.upscaleBy, 2), seed: int(s.seed, 0), steps: int(s.steps, 15), cfg: num(s.cfg, 4),
      sampler_name: s.sampler.trim() || d.sampler, scheduler: s.scheduler.trim() || d.scheduler, denoise: num(s.denoise, 0.25),
      mode_type: s.modeType || 'Linear', tile_width: tileW, tile_height: tileH,
      mask_blur: int(s.maskBlur, 32), tile_padding: int(s.tilePadding, 256),
      seam_fix_mode: s.seamFixMode || 'None', seam_fix_denoise: num(s.seamFixDenoise, 1), seam_fix_width: int(s.seamFixWidth, 64),
      seam_fix_mask_blur: int(s.seamFixMaskBlur, 8), seam_fix_padding: int(s.seamFixPadding, 16),
      force_uniform_tiles: !!s.forceUniformTiles, tiled_decode: !!s.tiledDecode, batch_size: Math.max(1, int(s.batchSize, 1)),
      image, model: ['usdu_ckpt', 0], positive: ['usdu_pos', 0], negative: ['usdu_neg', 0], vae: ['usdu_ckpt', 2], upscale_model: ['usdu_upmodel', 0]
    },
    _meta: { title: 'Ultimate SD Upscale', tileSize: s.tileSize }
  };
  prompt[saveId] = { class_type: 'SaveImage', inputs: { filename_prefix: filenamePrefix, images: ['usdu', 0] }, _meta: { title: 'USDU Upscaled' } };
}

// The positive text from a Bridge-shaped prompt (a built generation, or an
// imported image's normalized one). Foreign images keep everything in node
// 11, so their Global part is found by the Import splitter.
export async function usduPromptText(prompt: Prompt | null, excludeGlobal: boolean): Promise<string> {
  if (!prompt) return '';
  if (!excludeGlobal) return mergedPromptText(prompt);
  if (foreignSource(prompt)) {
    const fields = await splitPromptToFields(mergedPromptText(prompt));
    return mergePromptFields({ ...fields, global: '' });
  }
  return mergedPromptText({ ...prompt, '21': undefined });
}

// The settings a saved generation used (its `usdu` node), for Import.
export function usduSettingsFromPrompt(prompt: Prompt): Partial<UsduSettings> | null {
  const n = prompt && prompt['usdu'] && prompt['usdu'].inputs;
  if (!n) return null;
  const out: Partial<UsduSettings> = {};
  const str = (v: unknown): string | undefined => (typeof v === 'number' || typeof v === 'string') ? String(v) : undefined;
  const set = <K extends Key>(k: K, v: UsduSettings[K] | undefined) => { if (v !== undefined) out[k] = v; };
  set('upscaleBy', str(n.upscale_by)); set('seed', str(n.seed)); set('steps', str(n.steps)); set('cfg', str(n.cfg));
  set('sampler', str(n.sampler_name)); set('scheduler', str(n.scheduler)); set('denoise', str(n.denoise)); set('modeType', str(n.mode_type));
  set('maskBlur', str(n.mask_blur)); set('tilePadding', str(n.tile_padding)); set('seamFixMode', str(n.seam_fix_mode));
  set('seamFixDenoise', str(n.seam_fix_denoise)); set('seamFixWidth', str(n.seam_fix_width)); set('seamFixMaskBlur', str(n.seam_fix_mask_blur));
  set('seamFixPadding', str(n.seam_fix_padding)); set('batchSize', str(n.batch_size));
  if (typeof n.force_uniform_tiles === 'boolean') out.forceUniformTiles = n.force_uniform_tiles;
  if (typeof n.tiled_decode === 'boolean') out.tiledDecode = n.tiled_decode;
  // "Match the input" is recorded as plain numbers, so a saved run comes back
  // as Custom with the sizes it used, unless it was marked.
  if (Array.isArray(n.tile_width) || (prompt['usdu']._meta && prompt['usdu']._meta.tileSize === 'source')) out.tileSize = 'source';
  else { out.tileSize = 'custom'; set('tileWidth', str(n.tile_width)); set('tileHeight', str(n.tile_height)); }
  set('ckpt', str(prompt['usdu_ckpt'] && prompt['usdu_ckpt'].inputs.ckpt_name));
  set('upscaleModel', str(prompt['usdu_upmodel'] && prompt['usdu_upmodel'].inputs.model_name));
  const neg = prompt['usdu_neg'] && prompt['usdu_neg'].inputs.text;
  if (typeof neg === 'string') out.negative = neg;
  const w = prompt['usdu_wd14'] && prompt['usdu_wd14'].inputs;
  if (w) {
    out.promptSource = 'wd14';
    set('wd14Model', str(w.model)); set('wd14Threshold', str(w.threshold)); set('wd14CharThreshold', str(w.character_threshold));
    if (typeof w.replace_underscore === 'boolean') out.wd14ReplaceUnderscore = w.replace_underscore;
    if (typeof w.exclude_tags === 'string') out.wd14Exclude = w.exclude_tags;
  } else {
    // Which text it was can't be told from the graph; keep it as the user's own.
    const pos = prompt['usdu_pos'] && prompt['usdu_pos'].inputs.text;
    if (typeof pos === 'string') { out.promptSource = 'own'; out.ownPrompt = pos; }
  }
  return out;
}

// ---- panel ----

export interface UsduImportedJob { prompt: Prompt; imageFilename: string; imageBytes: Uint8Array; base: string; }

export interface UsduPanelOptions {
  // 'generation' (default): the settings drawer's panel — on/off toggle, the
  //   image you generate is upscaled as the last step.
  // 'imported': the Upscale tab — always on, pick any image and run it.
  //   Its fields are ids usduImp<Key> (the drawer's are usdu<Key>), so the
  //   two keep their own settings in the UI-state snapshot.
  mode?: 'generation' | 'imported';
  // The standard upscale checkbox ('generation' only): mutually exclusive.
  standardToggle?: HTMLInputElement;
  getList: (kind: UsduListKind) => string[];
  refreshLists: () => Promise<void> | void;
  // "Upscale this image" (imported source).
  onRunImported: () => void;
  log: (msg: string) => void;
}

export interface UsduPanel {
  enabled: () => boolean;
  read: () => UsduSettings;
  apply: (s: Partial<UsduSettings>) => void;
  setEnabled: (on: boolean) => void;
  // Re-run show/hide after values were set without a change event
  // (UI-state restore).
  refresh: () => void;
  // On (and source = generated): append to a built Bridge generation.
  activeForGeneration: () => boolean;
  appendToGeneration: (prompt: Prompt) => void;
  buildImportedJob: () => Promise<UsduImportedJob | null>;
}

export function mountUsduPanel(host: HTMLElement, opts: UsduPanelOptions): UsduPanel {
  const touch = typeof matchMedia === 'function' && matchMedia('(hover: none)').matches;
  const imported = opts.mode === 'imported';
  const prefix = imported ? 'usduImp' : 'usdu';
  host.classList.add('usdu-panel');
  if (imported) host.classList.add('usdu-tab');
  // The drawer's on/off switch; the Upscale tab is always on.
  const toggle = document.createElement('input');
  toggle.type = 'checkbox';
  if (!imported) {
    const toggleLabel = document.createElement('label');
    toggleLabel.className = 'chk-row';
    toggleLabel.title = 'Upscale every image you generate with Ultimate SD Upscale instead of the standard pass: the image is enlarged by an upscale model, then redrawn tile by tile with a checkpoint at low denoise, which adds real detail. Slower than the standard upscale. Needs the ComfyUI_UltimateSDUpscale node pack.';
    toggle.id = 'usduEnabled';
    toggleLabel.append(toggle, ' Upscale with USDU (Ultimate SD Upscale)');
    host.appendChild(toggleLabel);
    const hint = document.createElement('div');
    hint.className = 'muted small usdu-hint';
    hint.textContent = 'Upscales each image you generate. To upscale an image you already have, use the Upscale tab.';
    host.appendChild(hint);
  }

  const body = document.createElement('div');
  body.className = 'usdu-body';
  host.appendChild(body);

  const els = new Map<Key, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>();
  const rows: { def: FieldDef; row: HTMLElement }[] = [];

  for (const sec of SECTIONS) {
    const head = document.createElement('div');
    head.className = 'usdu-sec-head';
    head.textContent = sec.head;
    body.appendChild(head);
    const grid = document.createElement('div');
    grid.className = 'settings-grid';
    body.appendChild(grid);
    for (const def of sec.fields) {
      // Which image is fixed by where the panel lives (drawer = generated,
      // Upscale tab = imported), so there's no source picker any more.
      if (def.key === 'source') continue;
      const row = document.createElement('div');
      row.className = 'usdu-field' + (def.wide || def.type === 'check' ? ' settings-span2' : '');
      row.title = def.tip;
      const tip = document.createElement('div');
      tip.className = 'usdu-tip muted small';
      tip.textContent = def.tip;
      tip.hidden = true;
      let el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      if (def.type === 'check') {
        const label = document.createElement('label');
        label.className = 'chk-row';
        const input = document.createElement('input');
        input.type = 'checkbox';
        label.append(input, ' ' + def.label);
        row.appendChild(label);
        el = input;
        // Phones have no hover: a tap on the info mark shows the tip.
        if (touch) {
          const info = document.createElement('button');
          info.type = 'button';
          info.className = 'usdu-info';
          info.textContent = 'ⓘ';
          info.setAttribute('aria-label', 'What this does');
          info.addEventListener('click', (e) => { e.preventDefault(); tip.hidden = !tip.hidden; });
          label.appendChild(info);
        }
      } else {
        const label = document.createElement('label');
        label.textContent = def.label;
        if (touch) {
          label.classList.add('usdu-tappable');
          label.addEventListener('click', () => { tip.hidden = !tip.hidden; });
        }
        row.appendChild(label);
        if (def.type === 'select') {
          const sel = document.createElement('select');
          for (const [v, t] of def.options || []) { const o = document.createElement('option'); o.value = v; o.textContent = t; sel.appendChild(o); }
          el = sel;
        } else if (def.type === 'textarea') {
          const ta = document.createElement('textarea');
          ta.rows = 3;
          el = ta;
        } else {
          const input = document.createElement('input');
          input.type = def.type === 'number' ? 'number' : 'text';
          if (def.step) input.step = def.step;
          if (def.min) input.min = def.min;
          if (def.max) input.max = def.max;
          if (def.type === 'pick') {
            input.readOnly = true;
            input.placeholder = 'Tap to choose…';
            attachPickerModal(input, def.label, () => opts.getList(def.list!));
          }
          el = input;
        }
        row.appendChild(el);
      }
      row.appendChild(tip);
      el.id = idOf(prefix, def.key);
      grid.appendChild(row);
      els.set(def.key, el);
      rows.push({ def, row });
    }
  }

  // The Upscale tab's image: picked here (bytes read at pick time —
  // notes/Pitfalls/Android-WebView-Picker-Blob-Preview.md), previewed from
  // those bytes, run by the button. The tab lays it out beside the settings.
  const importBox = document.createElement('div');
  importBox.className = 'usdu-import';
  let picked: { name: string; bytes: Uint8Array } | null = null;
  if (imported) {
    const title = document.createElement('div');
    title.className = 'usdu-sec-head';
    title.textContent = 'Image to upscale';
    const preview = document.createElement('div');
    preview.className = 'usdu-preview';
    const previewImg = document.createElement('img');
    previewImg.alt = '';
    previewImg.hidden = true;
    const empty = document.createElement('div');
    empty.className = 'muted usdu-preview-empty';
    empty.textContent = 'Choose an image (PNG, JPG or WebP).';
    preview.append(previewImg, empty);
    const pickBtn = document.createElement('button');
    pickBtn.type = 'button';
    pickBtn.textContent = 'Choose image…';
    pickBtn.title = 'The image to upscale (PNG, JPG or WebP). A prompt saved in it is used by "Use my image\'s prompts".';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/png,image/jpeg,image/webp';
    fileInput.hidden = true;
    const pickedName = document.createElement('div');
    pickedName.className = 'muted small usdu-picked';
    pickedName.textContent = 'No image chosen.';
    const runBtn = document.createElement('button');
    runBtn.type = 'button';
    runBtn.className = 'usdu-run primary';
    runBtn.textContent = 'Upscale this image';
    runBtn.title = 'Queue the chosen image for USDU with these settings. Saved in the Upscaled folder of your output folder.';
    const btnRow = document.createElement('div');
    btnRow.className = 'row';
    btnRow.append(pickBtn, runBtn);
    importBox.append(title, preview, btnRow, pickedName, fileInput);
    host.insertBefore(importBox, body);
    let url = '';
    pickBtn.addEventListener('click', () => fileInput.click());
    preview.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      const f = fileInput.files && fileInput.files[0];
      fileInput.value = '';
      if (!f) return;
      const bytes = new Uint8Array(await f.arrayBuffer());
      picked = { name: f.name, bytes };
      const size = imageSizeOf(bytes);
      pickedName.textContent = size ? `${f.name} · ${size.width}×${size.height}` : f.name;
      if (url) URL.revokeObjectURL(url);
      url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: f.type || 'image/png' }));
      previewImg.src = url;
      previewImg.hidden = false;
      empty.hidden = true;
    });
    runBtn.addEventListener('click', () => opts.onRunImported());
  }

  const refreshBtn = document.createElement('button');
  refreshBtn.type = 'button';
  refreshBtn.textContent = 'Refresh USDU lists';
  refreshBtn.title = 'Reload the checkpoint, upscale model, sampler, scheduler and WD14 model lists from ComfyUI.';
  refreshBtn.addEventListener('click', () => { void opts.refreshLists(); });
  const refreshRow = document.createElement('div');
  refreshRow.className = 'row';
  refreshRow.appendChild(refreshBtn);
  body.appendChild(refreshRow);

  function read(): UsduSettings {
    const s: any = { ...USDU_DEFAULTS };
    for (const [k, el] of els) s[k] = el instanceof HTMLInputElement && el.type === 'checkbox' ? el.checked : el.value;
    s.source = imported ? 'imported' : 'generated';
    return s as UsduSettings;
  }
  function apply(s: Partial<UsduSettings>): void {
    for (const k of Object.keys(s) as Key[]) {
      const el = els.get(k);
      const v = s[k];
      if (!el || v === undefined) continue;
      if (el instanceof HTMLInputElement && el.type === 'checkbox') el.checked = Boolean(v);
      else el.value = String(v);
    }
    refresh();
  }
  function refresh(): void {
    body.hidden = !imported && !toggle.checked;
    const s = read();
    for (const { def, row } of rows) row.hidden = def.show ? !def.show(s) : false;
  }
  apply(USDU_DEFAULTS);
  host.addEventListener('change', refresh);

  function setEnabled(on: boolean): void {
    if (imported) return;
    toggle.checked = on;
    const std = opts.standardToggle;
    if (on && std && std.checked) {
      std.checked = false;
      std.dispatchEvent(new Event('change', { bubbles: true }));
    }
    refresh();
  }
  if (!imported) {
    toggle.addEventListener('change', () => setEnabled(toggle.checked));
    const std = opts.standardToggle;
    if (std) std.addEventListener('change', () => {
      if (std.checked && toggle.checked) { toggle.checked = false; refresh(); }
    });
  }

  return {
    enabled: () => !imported && toggle.checked,
    read, apply, setEnabled, refresh,
    activeForGeneration: () => !imported && toggle.checked,
    appendToGeneration(prompt: Prompt): void {
      const s = read();
      // The generation's own prompt nodes are plain strings here, so this is
      // synchronous (the foreign-image split never applies).
      const positive = s.promptSource === 'own' ? s.ownPrompt
        : s.promptSource === 'image' ? mergedPromptText(s.excludeGlobal ? { ...prompt, '21': undefined } : prompt) : '';
      // Named like the standard upscale: '222' (File Namer 4 Upscaler) with
      // "Upscaled" in slot c (notes/Features/SynthDat-Node-Map.md).
      let prefix: unknown = 'Upscaled/ComfyBridge';
      if (prompt['222']) { prompt['222'].inputs.text_c = 'Upscaled'; prefix = ['222', 0]; }
      // Pass 2 keeps pass 1's size, so the final image is the set width × height.
      const size = { width: int(String(prompt['174:171'] && prompt['174:171'].inputs.value), 1024), height: int(String(prompt['174:172'] && prompt['174:172'].inputs.value), 1024) };
      appendUsduNodes(prompt, prompt['192'].inputs.images, s, positive, '192_upscaled', prefix, size);
    },
    async buildImportedJob(): Promise<UsduImportedJob | null> {
      if (!picked) { opts.log('USDU: choose an image to upscale first.'); return null; }
      const s = read();
      let positive = '';
      if (s.promptSource === 'own') positive = s.ownPrompt;
      else if (s.promptSource === 'image') {
        let saved: Prompt | null = null;
        try { saved = normalizeGeneration(imageMetadataTexts(picked.bytes)); } catch { saved = null; }
        positive = await usduPromptText(saved, s.excludeGlobal);
        if (!positive) {
          opts.log(`USDU: ${picked.name} has no saved prompt. Pick "Tag with WD14" or "Use my own prompt".`);
          return null;
        }
      }
      const prompt: Prompt = {
        '239': { class_type: 'LoadImage', inputs: { image: picked.name, upload: 'image' }, _meta: { title: 'Load Image' } }
      };
      const size = imageSizeOf(picked.bytes);
      if (!size && s.tileSize !== 'custom') opts.log(`USDU: couldn't read ${picked.name}'s size; using the custom tile size (${s.tileWidth}×${s.tileHeight}).`);
      appendUsduNodes(prompt, ['239', 0], s, positive, '192', 'Upscaled/ComfyBridge_USDU', size);
      const stem = picked.name.replace(/\.[^.]+$/, '');
      return { prompt, imageFilename: picked.name, imageBytes: picked.bytes, base: stem };
    }
  };
}
