// Regional prompting — the Regional tab (draw boxes over the generation's
// size, a prompt per box) and the card that stands in for the Generate tab's
// prompt boxes while a layout is in use. One module for both shells
// (notes/Pitfalls/Forked-Copy-Drifts.md).
//
// The graph side is one node, DSMAnimaRegionalPrompt (the DSM pack's
// anima_regional/, built on Sen-sou/Comfyui-Anima-Regional-Conditioning):
// it patches the model the CFG guider samples with so, for the first part of
// the steps (Layout), each box's image tokens attend only to that box's
// prompt. The rest of the steps run on the whole-image prompt alone, which is
// what keeps the result one picture instead of a collage. Cohesion, in order
// of effect:
// - Layout share: regions steer composition only; details finish globally.
// - The style (the Generate tab's Global field + Character trigger, i.e. the
//   artist / LoRA trigger) and the scene prompt are added to every box and to
//   the area no box covers. A box only hears its own text during the layout
//   steps, so a trigger missing from a box means the LoRA's style is missing
//   there.
// - The whole-image prompt mentions every box, so the later global steps keep
//   what the boxes placed.
// - Separation is soft (self-attention masking, 0.2), and Blend mixes some of
//   the unpatched prediction back in.

type Prompt = Record<string, any>;

export const REGIONAL_NODE_ID = 'regional';
export const REGIONAL_NODE_CLASS = 'DSMAnimaRegionalPrompt';

export type BackgroundMode = 'uncovered_only' | 'global' | 'disabled';
export interface RegionBox { id: string; x: number; y: number; w: number; h: number; prompt: string; weight: number; }
export interface RegionalSettings {
  layoutStart: number; layoutEnd: number; focus: number; separation: number; blend: number;
  bgMode: BackgroundMode; bgStrength: number; crossEvery: number; selfEvery: number;
  styleInRegions: boolean; sceneInRegions: boolean; regionsInWhole: boolean;
}
export interface RegionalState extends RegionalSettings {
  scene: string;
  regions: RegionBox[];
  active: boolean; // the Generate tab uses the layout instead of its prompt boxes
  underlay: boolean; // the last result behind the boxes (tab only)
}

export const REGIONAL_DEFAULTS: RegionalSettings = {
  layoutStart: 0, layoutEnd: 0.35, focus: 1, separation: 0.2, blend: 0.1,
  // bgStrength 0.3, not upstream's 1: a hard background mask on the thin gaps
  // between boxes painted coloured-square artefacts there (GPU, 2026-10-26).
  bgMode: 'uncovered_only', bgStrength: 0.3, crossEvery: 1, selfEvery: 1,
  styleInRegions: true, sceneInRegions: true, regionsInWhole: true
};

const STORE_KEY = 'comfybridge-regional';
const COLORS = ['#e8505b', '#3d8bfd', '#f5a623', '#2bb673', '#a259ff', '#14b8c4', '#f06bc4', '#8a9a1f'];
const MIN_BOX = 0.03; // a drag smaller than this (of the image) is a click, not a box
const BG_MODES: BackgroundMode[] = ['uncovered_only', 'global', 'disabled'];

// Ready-made layouts (x, y, w, h); the boxes' prompts carry over in order.
const TEMPLATES: { name: string; boxes: [number, number, number, number][] }[] = [
  { name: 'Two side by side', boxes: [[0.02, 0.04, 0.46, 0.92], [0.52, 0.04, 0.46, 0.92]] },
  { name: 'Three side by side', boxes: [[0.01, 0.04, 0.32, 0.92], [0.34, 0.04, 0.32, 0.92], [0.67, 0.04, 0.32, 0.92]] },
  { name: 'Top and bottom', boxes: [[0.04, 0.02, 0.92, 0.46], [0.04, 0.52, 0.92, 0.46]] },
  { name: 'Big left, small right', boxes: [[0.02, 0.04, 0.6, 0.92], [0.64, 0.25, 0.34, 0.71]] },
  { name: 'Big right, small left', boxes: [[0.02, 0.25, 0.34, 0.71], [0.38, 0.04, 0.6, 0.92]] },
  { name: 'One subject, centred', boxes: [[0.22, 0.06, 0.56, 0.9]] },
  { name: 'Four corners', boxes: [[0.02, 0.02, 0.46, 0.46], [0.52, 0.02, 0.46, 0.46], [0.02, 0.52, 0.46, 0.46], [0.52, 0.52, 0.46, 0.46]] }
];

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const joinParts = (parts: string[]): string => parts.map(p => p.trim().replace(/^,+|,+$/g, '').trim()).filter(Boolean).join(', ');
let idSeq = 0;
const newId = (): string => 'r' + Date.now().toString(36) + (idSeq++).toString(36);

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
function button(text: string, title: string, cls = ''): HTMLButtonElement {
  const b = el('button', cls, text);
  b.type = 'button';
  b.title = title;
  return b;
}

function sanitizeBox(r: any): RegionBox {
  const num = (v: any, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
  const x = clamp(num(r.x, 0), 0, 1 - MIN_BOX), y = clamp(num(r.y, 0), 0, 1 - MIN_BOX);
  return {
    id: typeof r.id === 'string' && r.id ? r.id : newId(),
    x, y, w: clamp(num(r.w, 0.2), MIN_BOX, 1 - x), h: clamp(num(r.h, 0.2), MIN_BOX, 1 - y),
    prompt: typeof r.prompt === 'string' ? r.prompt : '',
    weight: clamp(num(r.weight, 1), 0.05, 1)
  };
}
function sanitizeState(s: any): RegionalState {
  const num = (v: any, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
  const bool = (v: any, d: boolean): boolean => (typeof v === 'boolean' ? v : d);
  const D = REGIONAL_DEFAULTS;
  const layoutStart = clamp(num(s.layoutStart, D.layoutStart), 0, 0.95);
  return {
    scene: typeof s.scene === 'string' ? s.scene : '',
    regions: Array.isArray(s.regions) ? s.regions.filter((r: any) => r && typeof r === 'object').map(sanitizeBox) : [],
    active: !!s.active,
    underlay: bool(s.underlay, false),
    layoutStart,
    layoutEnd: clamp(num(s.layoutEnd, D.layoutEnd), layoutStart + 0.05, 1),
    focus: clamp(num(s.focus, D.focus), 0, 1),
    separation: clamp(num(s.separation, D.separation), 0, 1),
    blend: clamp(num(s.blend, D.blend), 0, 1),
    bgMode: BG_MODES.includes(s.bgMode) ? s.bgMode : D.bgMode,
    bgStrength: clamp(num(s.bgStrength, D.bgStrength), 0, 1),
    crossEvery: Math.round(clamp(num(s.crossEvery, D.crossEvery), 1, 8)),
    selfEvery: Math.round(clamp(num(s.selfEvery, D.selfEvery), 1, 8)),
    styleInRegions: bool(s.styleInRegions, D.styleInRegions),
    sceneInRegions: bool(s.sceneInRegions, D.sceneInRegions),
    regionsInWhole: bool(s.regionsInWhole, D.regionsInWhole)
  };
}
function loadState(): RegionalState {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return sanitizeState(raw ? JSON.parse(raw) : {});
  } catch { return sanitizeState({}); }
}

// ---- prompt text + graph ----

// The layout's part of the whole-image prompt. The shell sends it as the
// unified prompt, so the Global field and Character trigger (the style) still
// go around it the usual way (nodes 21 and 11).
export function regionalWholePrompt(s: RegionalState): string {
  return joinParts([s.scene, ...(s.regionsInWhole ? s.regions.map(r => r.prompt) : [])]);
}
function boxText(s: RegionalState, style: string, r: RegionBox): string {
  return joinParts([s.styleInRegions ? style : '', s.sceneInRegions ? s.scene : '', r.prompt]);
}

// Puts the regional node between the model and the CFG guider ('158:54',
// both passes). Called after buildSynthDatPrompt, so the guider's model is
// whatever that left there (LLLite switch, LoRA stack, …). `style` = the
// Global field + Character trigger.
export function appendRegionalNodes(prompt: Prompt, s: RegionalState, style: string): void {
  const guider = prompt['158:54'];
  const encode = prompt['52'];
  if (!guider || !encode) throw new Error('Regional prompt: the workflow has no CFG guider (158:54) or positive encode (52).');
  const entries: any[] = s.regions.filter(r => r.prompt.trim()).map(r => ({
    x: +r.x.toFixed(4), y: +r.y.toFixed(4), w: +r.w.toFixed(4), h: +r.h.toFixed(4),
    text: boxText(s, style, r),
    weight: r.weight,
    prompt: r.prompt // the box's own words, for Import Generation
  }));
  // The layout's own fields, for Import Generation. No `text`, so the node skips it.
  entries.push({ bridge: { scene: s.scene, styleInRegions: s.styleInRegions, sceneInRegions: s.sceneInRegions, regionsInWhole: s.regionsInWhole } });
  prompt[REGIONAL_NODE_ID] = {
    class_type: REGIONAL_NODE_CLASS,
    inputs: {
      model: guider.inputs.model,
      clip: encode.inputs.clip,
      width: prompt['174:171'] ? ['174:171', 0] : 1024,
      height: prompt['174:172'] ? ['174:172', 0] : 1024,
      regions: JSON.stringify(entries),
      background_text: joinParts([style, s.scene]),
      layout_end: s.layoutEnd,
      region_focus: s.focus,
      separation: s.separation,
      blend: s.blend,
      background_mode: s.bgMode,
      background_strength: s.bgStrength,
      layout_start: s.layoutStart,
      cross_every_n_blocks: s.crossEvery,
      self_every_n_blocks: s.selfEvery
    },
    _meta: { title: 'Regional prompt' }
  };
  guider.inputs.model = [REGIONAL_NODE_ID, 0];
}

// A saved regional generation back into a layout (null = not regional).
export function regionalStateFromPrompt(prompt: Prompt): RegionalState | null {
  const node = prompt && prompt[REGIONAL_NODE_ID];
  if (!node || node.class_type !== REGIONAL_NODE_CLASS || !node.inputs) return null;
  const inp = node.inputs;
  let list: any[] = [];
  try { list = JSON.parse(String(inp.regions || '[]')); } catch { list = []; }
  if (!Array.isArray(list)) list = [];
  const meta = (list.find((e: any) => e && typeof e === 'object' && e.bridge) || {}).bridge || {};
  const boxes = list.filter((e: any) => e && typeof e === 'object' && !e.bridge);
  const regions = boxes.map((b: any) => ({ ...b, prompt: typeof b.prompt === 'string' ? b.prompt : String(b.text || '') }));
  return sanitizeState({
    // Layouts saved before the meta entry: the background was the scene.
    scene: typeof meta.scene === 'string' ? meta.scene : (typeof inp.background_text === 'string' ? inp.background_text : ''),
    regions, active: true,
    styleInRegions: meta.styleInRegions, sceneInRegions: meta.sceneInRegions, regionsInWhole: meta.regionsInWhole,
    layoutStart: inp.layout_start, layoutEnd: inp.layout_end, focus: inp.region_focus, separation: inp.separation,
    blend: inp.blend, bgMode: inp.background_mode, bgStrength: inp.background_strength,
    crossEvery: inp.cross_every_n_blocks, selfEvery: inp.self_every_n_blocks
  });
}

// ---- the UI ----

export interface RegionalOptions {
  // The Generate tab's width × height (the empty latent's size).
  getSize: () => { width: number; height: number };
  // Writes the Generate tab's width/height (the shell fires their events).
  setSize: (width: number, height: number) => void;
  // The Generate tab's style fields (Global, Character trigger): shown in the
  // card and the tab, edited in place, and added to every box.
  styleFields: { label: string; el: HTMLTextAreaElement | HTMLInputElement; tip: string }[];
  // Switch tabs.
  showGenerate: () => void;
  showRegional: () => void;
  // Regional mode turned on/off (the shell swaps its prompt UI, saves, …).
  onActiveChange: (active: boolean) => void;
  // Generate with the layout (the shell's own Generate).
  generate: () => void;
  // The last finished image (a URL), for the tab's underlay; null = none.
  lastImage: () => string | null;
  log: (msg: string) => void;
}

export interface RegionalController {
  active: () => boolean;
  state: () => RegionalState;
  exit: () => void;
  // The Generate tab's width/height changed, or a new image finished.
  refresh: () => void;
  // The generation status line, mirrored into the tab ('' hides it).
  setStatus: (text: string) => void;
  problem: () => string;
  wholePrompt: () => string;
  // Every prompt word in the layout, for naming (rating folder, character).
  namingText: () => string;
  appendToGeneration: (prompt: Prompt) => void;
  // Import Generation: a regional image's layout comes back and is used;
  // anything else turns the layout off. Returns whether it was regional.
  useFromPrompt: (prompt: Prompt) => boolean;
}

interface BoxView { root: HTMLDivElement; label: HTMLSpanElement; }
type NumKey = 'layoutStart' | 'layoutEnd' | 'focus' | 'separation' | 'blend' | 'bgStrength' | 'crossEvery' | 'selfEvery';
type BoolKey = 'styleInRegions' | 'sceneInRegions' | 'regionsInWhole';

export function mountRegional(tabHost: HTMLElement, cardHost: HTMLElement, opts: RegionalOptions): RegionalController {
  let st = loadState();
  let selected: string | null = null;
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  const save = (): void => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { try { localStorage.setItem(STORE_KEY, JSON.stringify(st)); } catch { /* storage off */ } }, 200);
  };
  const indexOf = (id: string): number => st.regions.findIndex(r => r.id === id);
  const styleText = (): string => joinParts(opts.styleFields.map(f => f.el.value));

  // ---- undo/redo: snapshots of the boxes (prompt typing has the textarea's own undo) ----
  const undoStack: string[] = [];
  const redoStack: string[] = [];
  const snap = (): string => JSON.stringify(st.regions);
  function checkpoint(): void {
    undoStack.push(snap());
    if (undoStack.length > 100) undoStack.shift();
    redoStack.length = 0;
    renderUndo();
  }
  function restoreSnap(from: string[], to: string[]): void {
    const s = from.pop();
    if (s == null) return;
    to.push(snap());
    st.regions = (JSON.parse(s) as any[]).map(sanitizeBox);
    if (selected && indexOf(selected) < 0) selected = null;
    save();
    renderAll();
  }
  const undo = (): void => restoreSnap(undoStack, redoStack);
  const redo = (): void => restoreSnap(redoStack, undoStack);

  // ===== Tab =====
  tabHost.classList.add('rg-tab');
  const bar = el('div', 'rg-bar');
  const titleBox = el('div', 'rg-titlebox');
  titleBox.append(el('div', 'rg-title', 'Regional prompt'),
    el('div', 'muted small', 'Drag on the canvas to draw a box, then say what goes in it. The canvas is the generation\'s size.'));
  const sizeRow = el('div', 'rg-row rg-size');
  const wIn = el('input'); wIn.type = 'number'; wIn.min = '256'; wIn.max = '4096'; wIn.step = '64'; wIn.title = 'Width (the Generate tab\'s width)';
  const hIn = el('input'); hIn.type = 'number'; hIn.min = '256'; hIn.max = '4096'; hIn.step = '64'; hIn.title = 'Height (the Generate tab\'s height)';
  const swapBtn = button('⇄', 'Swap width and height (portrait ↔ landscape); the boxes turn with it', 'rg-icon-btn');
  sizeRow.append(wIn, el('span', 'muted', '×'), hIn, swapBtn);
  const actions = el('div', 'rg-row');
  const tplSel = el('select', 'rg-template');
  tplSel.title = 'Start from a ready-made layout; the boxes\' prompts carry over in order';
  tplSel.append(new Option('Layout…', ''));
  TEMPLATES.forEach((t, i) => tplSel.append(new Option(t.name, String(i))));
  const undoBtn = button('↶', 'Undo (Ctrl+Z)', 'rg-icon-btn');
  const redoBtn = button('↷', 'Redo (Ctrl+Y)', 'rg-icon-btn');
  const clearBtn = button('Clear', 'Remove every box');
  const useBtn = button('Use in Generate', 'Switch the Generate tab to this layout (its prompt boxes come back with "Back to normal prompt")');
  const genBtn = button('Generate', 'Generate with this layout now (turns the layout on in the Generate tab too)', 'rg-primary');
  actions.append(tplSel, undoBtn, redoBtn, clearBtn, useBtn, genBtn);
  const statusLine = el('div', 'muted small rg-status');
  statusLine.hidden = true;
  bar.append(titleBox, sizeRow, actions, statusLine);

  const body = el('div', 'rg-body');
  const stageWrap = el('div', 'rg-stage-wrap');
  const stage = el('div', 'rg-stage');
  stage.tabIndex = 0;
  stage.setAttribute('aria-label', 'Region canvas: drag to draw a box');
  const underlayImg = el('img', 'rg-underlay');
  underlayImg.alt = '';
  underlayImg.draggable = false;
  const emptyHint = el('div', 'rg-stage-hint', 'Drag here to draw a box');
  stage.append(underlayImg, emptyHint);
  const stageFoot = el('div', 'rg-row rg-stage-foot');
  const underlayRow = el('label', 'chk-row rg-chk');
  underlayRow.title = 'Shows the last finished image behind the boxes, to line the boxes up with what came out';
  const underlayChk = el('input'); underlayChk.type = 'checkbox';
  underlayRow.append(underlayChk, document.createTextNode(' Show the last result behind the boxes'));
  stageFoot.append(underlayRow);
  stageWrap.append(stage, stageFoot, el('div', 'muted small rg-stage-note',
    'Drag a box to move it, an edge or corner to resize. Click a box to select it: Delete removes it, the arrow keys nudge it (Shift = more), Ctrl+D duplicates it. Boxes may overlap.'));

  const side = el('div', 'rg-side');
  // Style: the Generate tab's own Global + Character trigger fields, edited in place.
  const styleSec = el('div', 'rg-sec');
  styleSec.append(el('div', 'rg-sec-head', 'Style (from the prompt boxes)'));
  const sceneSec = el('div', 'rg-sec');
  const sceneTa = el('textarea', 'rg-scene');
  sceneTa.rows = 3;
  sceneTa.placeholder = 'Quality, rating, setting, lighting… (e.g. masterpiece, safe, sunset beach, warm light). Counts like 1girl go in the boxes.';
  sceneTa.title = 'The whole image: added to every box (setting, lighting) and fills the area no box covers.';
  sceneSec.append(el('label', 'rg-sec-head', 'Whole image'), sceneTa);
  const listSec = el('div', 'rg-sec');
  const listHead = el('div', 'rg-sec-head', 'Boxes');
  const list = el('div', 'rg-list');
  listSec.append(listHead, list);

  const adv = el('details', 'rg-adv');
  adv.append(el('summary', 'rg-sec-head', 'Blending'));
  const advNote = el('div', 'muted small', 'Style uneven between boxes? Put the artist / LoRA trigger in Style, then raise Blend a little. Subjects merging? Raise Separation or Layout ends. Junk in the gaps between boxes? Lower Background.');
  adv.append(advNote);
  const sliders = {} as Record<NumKey, { input: HTMLInputElement; out: HTMLSpanElement; fmt: (v: number) => string }>;
  const pct = (v: number): string => Math.round(v * 100) + '%';
  const sliderDefs: [NumKey, string, string, number, number, number, (v: number) => string][] = [
    ['layoutEnd', 'Layout ends', 'The share of the steps the boxes steer. After that, the whole-image prompt finishes the picture as one image. Higher = boxes followed more strictly, lower = more natural blending.', 0.05, 1, 0.05, pct],
    ['layoutStart', 'Layout starts', 'Steps before the boxes start steering. Keep at 0: the composition is decided in the first steps, and even 10% let two boxes merge into one person in testing.', 0, 0.9, 0.05, pct],
    ['focus', 'Box focus', 'How strictly each box hears only its own prompt during the layout steps. 1 = strictly; lower lets the whole prompt in.', 0, 1, 0.05, (v) => v.toFixed(2)],
    ['separation', 'Separation', 'Keeps regions from mixing into each other. At 0 two subjects merge into one; too high gives seams and uneven style. 0.2 is the tested middle.', 0, 1, 0.05, (v) => v.toFixed(2)],
    ['blend', 'Blend', 'Mixes the plain whole-image result into every layout step, so lighting, style and LoRA look match across boxes.', 0, 1, 0.05, (v) => v.toFixed(2)],
    ['bgStrength', 'Background', 'How strongly the area no box covers is held to the style + whole-image prompt. Keep it low: at 1 the thin gaps between boxes filled with artefacts in testing.', 0, 1, 0.05, (v) => v.toFixed(2)],
    ['crossEvery', 'Focus every', 'Route box prompts in every Nth transformer block (1 = all). Higher = lighter touch.', 1, 8, 1, (v) => v === 1 ? 'all' : '1/' + v],
    ['selfEvery', 'Separate every', 'Keep regions apart in every Nth transformer block (1 = all). Higher = softer edges.', 1, 8, 1, (v) => v === 1 ? 'all' : '1/' + v]
  ];
  for (const [key, label, tip, min, max, step, fmt] of sliderDefs) {
    const row = el('label', 'rg-slider');
    row.title = tip;
    const input = el('input');
    input.type = 'range'; input.min = String(min); input.max = String(max); input.step = String(step);
    const out = el('span', 'rg-slider-val');
    row.append(el('span', '', label), input, out);
    adv.append(row);
    sliders[key] = { input, out, fmt };
    input.addEventListener('input', () => {
      st[key] = clamp(parseFloat(input.value), min, max);
      // Layout start stays before its end.
      if (key === 'layoutStart' && st.layoutEnd < st.layoutStart + 0.05) st.layoutEnd = Math.min(1, st.layoutStart + 0.05);
      if (key === 'layoutEnd' && st.layoutStart > st.layoutEnd - 0.05) st.layoutStart = Math.max(0, st.layoutEnd - 0.05);
      renderSettings();
      save();
    });
  }
  const bgRow = el('label', 'rg-slider');
  bgRow.title = 'Where the style + whole-image prompt applies during the layout steps. Everywhere also turns Separation off, so subjects tend to merge.';
  const bgSel = el('select');
  bgSel.append(new Option('Only where no box is', 'uncovered_only'), new Option('Everywhere (no separation)', 'global'), new Option('Nowhere', 'disabled'));
  bgRow.append(el('span', '', 'Whole prompt'), bgSel, el('span'));
  adv.append(bgRow);
  bgSel.addEventListener('change', () => { st.bgMode = bgSel.value as BackgroundMode; save(); });
  const checks = {} as Record<BoolKey, HTMLInputElement>;
  const chk = (key: BoolKey, text: string, tip: string): void => {
    const row = el('label', 'chk-row rg-chk');
    row.title = tip;
    const c = el('input'); c.type = 'checkbox';
    row.append(c, document.createTextNode(' ' + text));
    adv.append(row);
    checks[key] = c;
    c.addEventListener('change', () => { st[key] = c.checked; save(); renderNote(); });
  };
  chk('styleInRegions', 'Add the style to every box', 'Every box gets the Global field + Character trigger (artist, LoRA trigger), so the LoRA\'s look reaches every region. Leave on.');
  chk('sceneInRegions', 'Add the whole-image prompt to every box', 'Every box also gets the whole-image prompt (setting, lighting), so regions match. Turn off only if a box should look different.');
  chk('regionsInWhole', 'Mention every box in the whole-image prompt', 'The steps after the layout see every box\'s prompt too, so what the boxes placed stays. Turn off if box contents bleed across the image.');
  const resetBtn = button('Reset blending', 'Back to the tested defaults');
  adv.append(resetBtn);
  side.append(styleSec, sceneSec, listSec, adv);
  body.append(stageWrap, side);
  tabHost.append(bar, body);

  // ===== Generate-tab card =====
  cardHost.classList.add('rg-card');
  const cardHead = el('div', 'rg-card-head');
  cardHead.append(el('span', 'rg-card-title', 'Regional prompt'));
  const cardBtns = el('div', 'rg-row');
  const editBtn = button('Edit layout', 'Open the Regional tab');
  const exitBtn = button('Back to normal prompt', 'Stop using the layout; the prompt boxes come back as you left them. The layout is kept in the Regional tab.');
  cardBtns.append(editBtn, exitBtn);
  cardHead.append(cardBtns);
  const cardMini = el('div', 'rg-mini');
  cardMini.title = 'Edit layout';
  const cardStyle = el('div', 'rg-sec');
  const cardScene = el('textarea', 'rg-scene');
  cardScene.rows = 2;
  cardScene.placeholder = sceneTa.placeholder;
  cardScene.title = sceneTa.title;
  const cardList = el('div', 'rg-list rg-card-list');
  const cardNote = el('div', 'muted small rg-card-note');
  cardHost.append(cardHead, cardMini, cardStyle, el('label', '', 'Whole image'), cardScene, cardList, cardNote);

  // Style proxies: the real fields stay the source (presets, import, save all
  // keep working); these write into them and follow them.
  const styleProxies: { proxy: HTMLTextAreaElement; field: HTMLTextAreaElement | HTMLInputElement }[] = [];
  for (const host of [styleSec, cardStyle]) {
    for (const f of opts.styleFields) {
      const proxy = el('textarea', 'rg-scene');
      proxy.rows = 1;
      proxy.title = f.tip;
      proxy.placeholder = f.label;
      const lab = el('label', 'rg-style-label', f.label);
      host.append(lab, proxy);
      styleProxies.push({ proxy, field: f.el });
      proxy.addEventListener('input', () => {
        f.el.value = proxy.value;
        f.el.dispatchEvent(new Event('input', { bubbles: true }));
        syncStyle(proxy);
      });
    }
  }
  function syncStyle(except?: HTMLElement): void {
    for (const p of styleProxies) if (p.proxy !== except && document.activeElement !== p.proxy) p.proxy.value = p.field.value;
  }
  for (const f of opts.styleFields) f.el.addEventListener('input', () => syncStyle());

  // ===== rendering =====
  const views = new Map<string, BoxView>();

  function applySize(): void {
    const { width, height } = opts.getSize();
    const w = width > 0 ? width : 1024, h = height > 0 ? height : 1024;
    if (document.activeElement !== wIn) wIn.value = String(w);
    if (document.activeElement !== hIn) hIn.value = String(h);
    // Fit (CSS): as wide as the column allows, never taller than the view.
    for (const e of [stage, cardMini]) {
      e.style.aspectRatio = `${w} / ${h}`;
      e.style.setProperty('--rg-ar', String(w / h));
    }
  }

  function renderUnderlay(): void {
    const url = st.underlay ? opts.lastImage() : null;
    underlayChk.checked = st.underlay;
    if (url) { if (underlayImg.src !== url) underlayImg.src = url; underlayImg.hidden = false; }
    else { underlayImg.hidden = true; underlayImg.removeAttribute('src'); }
  }

  function placeBox(v: BoxView, r: RegionBox): void {
    v.root.style.left = r.x * 100 + '%';
    v.root.style.top = r.y * 100 + '%';
    v.root.style.width = r.w * 100 + '%';
    v.root.style.height = r.h * 100 + '%';
  }

  function boxCaption(r: RegionBox, i: number): string {
    const p = r.prompt.trim();
    return `${i + 1}${p ? ' · ' + (p.length > 48 ? p.slice(0, 48) + '…' : p) : ''}`;
  }

  function renderStage(): void {
    for (const [id, v] of views) if (indexOf(id) < 0) { v.root.remove(); views.delete(id); }
    st.regions.forEach((r, i) => {
      let v = views.get(r.id);
      if (!v) {
        const root = el('div', 'rg-box');
        root.dataset.id = r.id;
        const label = el('span', 'rg-box-label');
        root.append(label);
        for (const hnd of ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']) {
          const h = el('span', 'rg-handle rg-h-' + hnd);
          h.dataset.handle = hnd;
          root.append(h);
        }
        stage.append(root);
        v = { root, label };
        views.set(r.id, v);
      }
      v.root.style.setProperty('--rg-color', COLORS[i % COLORS.length]);
      v.root.style.setProperty('--rg-alpha', String(Math.round(8 + 18 * r.weight)) + '%');
      v.root.style.zIndex = String(r.id === selected ? 50 : 10 + i);
      v.root.classList.toggle('selected', r.id === selected);
      v.root.classList.toggle('empty', !r.prompt.trim());
      v.label.textContent = boxCaption(r, i);
      placeBox(v, r);
    });
    emptyHint.hidden = st.regions.length > 0;
  }

  function renderMini(): void {
    cardMini.textContent = '';
    st.regions.forEach((r, i) => {
      const b = el('div', 'rg-mini-box');
      b.style.setProperty('--rg-color', COLORS[i % COLORS.length]);
      b.style.left = r.x * 100 + '%'; b.style.top = r.y * 100 + '%';
      b.style.width = r.w * 100 + '%'; b.style.height = r.h * 100 + '%';
      b.textContent = String(i + 1);
      cardMini.append(b);
    });
  }

  // One list row (the tab's and the card's are built the same way).
  function regionRow(r: RegionBox, i: number, inCard: boolean): HTMLDivElement {
    const row = el('div', 'rg-item' + (r.id === selected && !inCard ? ' selected' : ''));
    row.dataset.id = r.id;
    row.style.setProperty('--rg-color', COLORS[i % COLORS.length]);
    const head = el('div', 'rg-item-head');
    const sw = el('span', 'rg-swatch', String(i + 1));
    const size = opts.getSize();
    const px = (f: number, total: number): number => Math.round(f * total);
    const dims = el('span', 'muted small rg-dims', `${px(r.w, size.width)}×${px(r.h, size.height)} at ${px(r.x, size.width)}, ${px(r.y, size.height)}`);
    head.append(sw, dims);
    if (!inCard) {
      const dup = button('⧉', 'Duplicate this box (Ctrl+D)', 'rg-icon-btn');
      dup.addEventListener('click', (e) => { e.stopPropagation(); duplicateBox(r.id); });
      head.append(dup);
    }
    const del = button('✕', 'Remove this box', 'rg-icon-btn');
    del.addEventListener('click', (e) => { e.stopPropagation(); removeBox(r.id); });
    head.append(del);
    const ta = el('textarea', 'rg-prompt');
    ta.rows = 2;
    ta.value = r.prompt;
    ta.dataset.id = r.id;
    ta.placeholder = 'What goes in this box? (e.g. 1girl, red hair, waving)';
    ta.addEventListener('input', () => {
      const box = st.regions.find(b => b.id === r.id);
      if (!box) return;
      box.prompt = ta.value;
      syncPromptEverywhere(box, ta);
      save();
    });
    ta.addEventListener('focus', () => { if (!inCard) select(r.id, false); });
    row.addEventListener('click', (e) => { if (!inCard && (e.target === row || e.target === head)) select(r.id, false); });
    row.append(head, ta);
    if (!inCard) {
      const wRow = el('label', 'rg-slider rg-weight');
      wRow.title = 'How strictly this box is kept to its prompt. 1 = strictly; lower lets the rest of the image in (softer, blends more).';
      const wIn2 = el('input');
      wIn2.type = 'range'; wIn2.min = '0.05'; wIn2.max = '1'; wIn2.step = '0.05'; wIn2.value = String(r.weight);
      const wOut = el('span', 'rg-slider-val', r.weight.toFixed(2));
      wRow.append(el('span', '', 'Strength'), wIn2, wOut);
      wIn2.addEventListener('pointerdown', () => checkpoint());
      wIn2.addEventListener('input', () => {
        const box = st.regions.find(b => b.id === r.id);
        if (!box) return;
        box.weight = clamp(parseFloat(wIn2.value), 0.05, 1);
        wOut.textContent = box.weight.toFixed(2);
        const v = views.get(box.id);
        if (v) v.root.style.setProperty('--rg-alpha', String(Math.round(8 + 18 * box.weight)) + '%');
        save();
      });
      row.append(wRow);
    }
    return row;
  }

  function syncPromptEverywhere(box: RegionBox, from: HTMLTextAreaElement): void {
    for (const ta of [...list.querySelectorAll<HTMLTextAreaElement>('textarea.rg-prompt'), ...cardList.querySelectorAll<HTMLTextAreaElement>('textarea.rg-prompt')]) {
      if (ta !== from && ta.dataset.id === box.id) ta.value = box.prompt;
    }
    const v = views.get(box.id);
    if (v) { v.label.textContent = boxCaption(box, indexOf(box.id)); v.root.classList.toggle('empty', !box.prompt.trim()); }
    renderNote();
  }

  function renderList(): void {
    list.textContent = '';
    if (!st.regions.length) list.append(el('div', 'muted small rg-list-empty', 'No boxes yet. Drag on the canvas to draw one, or pick a Layout.'));
    st.regions.forEach((r, i) => list.append(regionRow(r, i, false)));
    listHead.textContent = st.regions.length ? `Boxes (${st.regions.length})` : 'Boxes';
  }

  function renderNote(): void {
    const p = problemText();
    let note = p;
    if (!p && !styleText()) note = 'Tip: put the artist / LoRA trigger in Global or Character trigger above, so every box gets the same style.';
    cardNote.textContent = note || 'Generate uses this layout. The whole-image prompt finishes the picture after the layout steps.';
    cardNote.classList.toggle('rg-warn', !!p);
  }

  function renderCard(): void {
    if (document.activeElement !== cardScene) cardScene.value = st.scene;
    cardList.textContent = '';
    st.regions.forEach((r, i) => cardList.append(regionRow(r, i, true)));
    renderMini();
    renderNote();
  }

  function renderSettings(): void {
    for (const key of Object.keys(sliders) as NumKey[]) {
      const s = sliders[key];
      s.input.value = String(st[key]);
      s.out.textContent = s.fmt(st[key]);
    }
    bgSel.value = st.bgMode;
    for (const key of Object.keys(checks) as BoolKey[]) checks[key].checked = st[key];
  }

  function renderUndo(): void {
    undoBtn.disabled = !undoStack.length;
    redoBtn.disabled = !redoStack.length;
  }

  function renderAll(): void {
    applySize();
    if (document.activeElement !== sceneTa) sceneTa.value = st.scene;
    syncStyle();
    renderUnderlay();
    renderStage();
    renderList();
    renderCard();
    renderSettings();
    renderUndo();
  }

  function select(id: string | null, focusPrompt: boolean): void {
    selected = id;
    renderStage();
    for (const row of list.querySelectorAll<HTMLElement>('.rg-item')) row.classList.toggle('selected', row.dataset.id === id);
    if (id) {
      const row = list.querySelector<HTMLElement>(`.rg-item[data-id="${id}"]`);
      if (row) {
        row.scrollIntoView({ block: 'nearest' });
        if (focusPrompt) row.querySelector('textarea')?.focus();
      }
    }
  }

  function removeBox(id: string): void {
    const i = indexOf(id);
    if (i < 0) return;
    checkpoint();
    st.regions.splice(i, 1);
    if (selected === id) selected = null;
    save();
    renderStage(); renderList(); renderCard();
  }

  function duplicateBox(id: string): void {
    const src = st.regions.find(b => b.id === id);
    if (!src) return;
    checkpoint();
    // Offset so the copy shows; kept inside the canvas.
    const off = 0.04;
    const x = src.x + src.w + off <= 1 ? src.x + off : Math.max(0, src.x - off);
    const y = src.y + src.h + off <= 1 ? src.y + off : Math.max(0, src.y - off);
    const copy: RegionBox = { ...src, id: newId(), x, y };
    st.regions.splice(indexOf(id) + 1, 0, copy);
    save();
    renderStage(); renderList(); renderCard();
    select(copy.id, true);
  }

  // ===== pointer: draw / move / resize =====
  type Drag = { kind: 'draw' | 'move' | 'resize'; id: string; handle: string; startX: number; startY: number; orig: RegionBox; pointerId: number; before: string };
  let drag: Drag | null = null;

  const toFrac = (e: PointerEvent): { fx: number; fy: number } => {
    const r = stage.getBoundingClientRect();
    return { fx: clamp((e.clientX - r.left) / (r.width || 1), 0, 1), fy: clamp((e.clientY - r.top) / (r.height || 1), 0, 1) };
  };

  stage.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    const boxEl = target.closest<HTMLElement>('.rg-box');
    const { fx, fy } = toFrac(e);
    const before = snap();
    if (boxEl && boxEl.dataset.id) {
      const box = st.regions.find(b => b.id === boxEl.dataset.id);
      if (!box) return;
      const handle = target.dataset.handle || '';
      drag = { kind: handle ? 'resize' : 'move', id: box.id, handle, startX: fx, startY: fy, orig: { ...box }, pointerId: e.pointerId, before };
      select(box.id, false);
    } else {
      const box: RegionBox = { id: newId(), x: fx, y: fy, w: 0, h: 0, prompt: '', weight: 1 };
      st.regions.push(box);
      drag = { kind: 'draw', id: box.id, handle: '', startX: fx, startY: fy, orig: { ...box }, pointerId: e.pointerId, before };
      selected = box.id;
      renderStage();
    }
    try { stage.setPointerCapture(e.pointerId); } catch { /* not an active pointer (synthetic) */ }
    stage.focus({ preventScroll: true });
    e.preventDefault();
  });

  stage.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const box = st.regions.find(b => b.id === drag!.id);
    if (!box) return;
    const { fx, fy } = toFrac(e);
    const o = drag.orig;
    if (drag.kind === 'draw') {
      box.x = Math.min(drag.startX, fx); box.y = Math.min(drag.startY, fy);
      box.w = Math.abs(fx - drag.startX); box.h = Math.abs(fy - drag.startY);
    } else if (drag.kind === 'move') {
      box.x = clamp(o.x + fx - drag.startX, 0, 1 - o.w);
      box.y = clamp(o.y + fy - drag.startY, 0, 1 - o.h);
    } else {
      let x0 = o.x, y0 = o.y, x1 = o.x + o.w, y1 = o.y + o.h;
      const hnd = drag.handle;
      if (hnd.includes('w')) x0 = clamp(fx, 0, x1 - MIN_BOX);
      if (hnd.includes('e')) x1 = clamp(fx, x0 + MIN_BOX, 1);
      if (hnd.includes('n')) y0 = clamp(fy, 0, y1 - MIN_BOX);
      if (hnd.includes('s')) y1 = clamp(fy, y0 + MIN_BOX, 1);
      box.x = x0; box.y = y0; box.w = x1 - x0; box.h = y1 - y0;
    }
    const v = views.get(box.id);
    if (v) placeBox(v, box);
  });

  const pushUndo = (before: string): void => {
    undoStack.push(before);
    if (undoStack.length > 100) undoStack.shift();
    redoStack.length = 0;
    renderUndo();
  };
  const endDrag = (e: PointerEvent): void => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const d = drag;
    drag = null;
    const box = st.regions.find(b => b.id === d.id);
    if (!box) return;
    if (d.kind === 'draw') {
      if (box.w < MIN_BOX || box.h < MIN_BOX) {
        // A click on empty canvas: deselect, no box.
        st.regions.splice(indexOf(box.id), 1);
        select(null, false);
        return;
      }
      pushUndo(d.before);
      save();
      renderStage(); renderList(); renderCard();
      select(box.id, true);
      return;
    }
    if (box.x !== d.orig.x || box.y !== d.orig.y || box.w !== d.orig.w || box.h !== d.orig.h) {
      pushUndo(d.before);
      save();
      renderList(); renderMini();
      select(box.id, false);
    }
  };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  // Undo/redo anywhere in the tab except while typing (text keeps its own undo).
  tabHost.addEventListener('keydown', (e) => {
    const t = e.target as HTMLElement;
    if (t.matches('textarea, input, select')) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) { undo(); e.preventDefault(); return; }
    if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { redo(); e.preventDefault(); return; }
    if (mod && e.key.toLowerCase() === 'd' && selected) { duplicateBox(selected); e.preventDefault(); }
  });

  stage.addEventListener('keydown', (e) => {
    if (!selected || e.ctrlKey || e.metaKey) return;
    if (e.key === 'Delete' || e.key === 'Backspace') { removeBox(selected); e.preventDefault(); return; }
    if (e.key === 'Escape') { select(null, false); return; }
    const step = e.shiftKey ? 0.05 : 0.01;
    const box = st.regions.find(b => b.id === selected);
    if (!box) return;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const m = moves[e.key];
    if (!m) return;
    if (!e.repeat) checkpoint();
    box.x = clamp(box.x + m[0], 0, 1 - box.w);
    box.y = clamp(box.y + m[1], 0, 1 - box.h);
    const v = views.get(box.id);
    if (v) placeBox(v, box);
    save(); renderMini();
    e.preventDefault();
  });

  // ===== controls =====
  const onScene = (from: HTMLTextAreaElement, other: HTMLTextAreaElement) => () => {
    st.scene = from.value;
    if (document.activeElement !== other) other.value = st.scene;
    save();
    renderNote();
  };
  sceneTa.addEventListener('input', onScene(sceneTa, cardScene));
  cardScene.addEventListener('input', onScene(cardScene, sceneTa));

  const sizeChanged = (): void => {
    const w = parseInt(wIn.value, 10), h = parseInt(hIn.value, 10);
    if (!(w >= 64 && h >= 64)) return;
    opts.setSize(w, h);
    applySize(); renderList();
  };
  wIn.addEventListener('change', sizeChanged);
  hIn.addEventListener('change', sizeChanged);
  swapBtn.addEventListener('click', () => {
    const { width, height } = opts.getSize();
    checkpoint();
    // Boxes are fractions of the image; transpose them so the layout turns with it.
    for (const r of st.regions) { [r.x, r.y, r.w, r.h] = [r.y, r.x, r.h, r.w]; }
    opts.setSize(height, width);
    save();
    renderAll();
  });
  tplSel.addEventListener('change', () => {
    const t = TEMPLATES[parseInt(tplSel.value, 10)];
    tplSel.value = '';
    if (!t) return;
    const lost = st.regions.slice(t.boxes.length).filter(r => r.prompt.trim()).length;
    if (lost && !confirm(`This layout has ${t.boxes.length} box${t.boxes.length === 1 ? '' : 'es'}; the prompts of the last ${lost} box${lost === 1 ? '' : 'es'} will be dropped (Undo brings them back). Continue?`)) return;
    checkpoint();
    st.regions = t.boxes.map(([x, y, w, h], i) => {
      const old = st.regions[i];
      return { id: old ? old.id : newId(), x, y, w, h, prompt: old ? old.prompt : '', weight: old ? old.weight : 1 };
    });
    selected = null;
    save();
    renderAll();
  });
  undoBtn.addEventListener('click', undo);
  redoBtn.addEventListener('click', redo);
  clearBtn.addEventListener('click', () => {
    if (!st.regions.length) return;
    checkpoint();
    st.regions = [];
    selected = null;
    save();
    renderAll();
    opts.log('Regional: cleared every box (Undo brings them back).');
  });
  resetBtn.addEventListener('click', () => {
    Object.assign(st, REGIONAL_DEFAULTS);
    save();
    renderSettings(); renderCard();
  });
  underlayChk.addEventListener('change', () => {
    st.underlay = underlayChk.checked;
    save();
    renderUnderlay();
    if (st.underlay && !opts.lastImage()) opts.log('Regional: no finished image yet to show behind the boxes.');
  });
  const turnOn = (): boolean => {
    const p = problemText();
    if (p) { opts.log(p); alert(p); return false; }
    setActive(true);
    return true;
  };
  useBtn.addEventListener('click', () => { if (turnOn()) opts.showGenerate(); });
  genBtn.addEventListener('click', () => { if (turnOn()) opts.generate(); });
  editBtn.addEventListener('click', opts.showRegional);
  cardMini.addEventListener('click', opts.showRegional);
  exitBtn.addEventListener('click', () => setActive(false));

  function setActive(on: boolean): void {
    if (st.active === on) { renderCard(); return; }
    st.active = on;
    save();
    renderCard();
    opts.onActiveChange(on);
  }

  function problemText(): string {
    const filled = st.regions.filter(r => r.prompt.trim());
    if (!st.regions.length) return 'Regional prompt: draw at least one box in the Regional tab.';
    if (!filled.length) return 'Regional prompt: give at least one box a prompt.';
    return '';
  }

  renderAll();
  // The shell restores the Generate tab's size after mounting; follow it.
  requestAnimationFrame(() => { applySize(); syncStyle(); renderNote(); });

  return {
    active: () => st.active,
    state: () => st,
    exit: () => setActive(false),
    refresh: () => { applySize(); syncStyle(); renderUnderlay(); renderList(); renderNote(); },
    setStatus: (text) => { statusLine.textContent = text; statusLine.hidden = !text; },
    problem: problemText,
    wholePrompt: () => regionalWholePrompt(st),
    namingText: () => joinParts([styleText(), st.scene, ...st.regions.map(r => r.prompt)]),
    appendToGeneration: (prompt) => appendRegionalNodes(prompt, st, styleText()),
    useFromPrompt: (prompt) => {
      const s = regionalStateFromPrompt(prompt);
      if (!s) { setActive(false); return false; }
      checkpoint();
      st = { ...s, underlay: st.underlay };
      selected = null;
      save();
      renderAll();
      opts.onActiveChange(true);
      return true;
    }
  };
}
