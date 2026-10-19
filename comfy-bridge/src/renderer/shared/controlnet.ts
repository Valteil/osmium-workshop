// ControlNet tab (both shells): get a pose, edit it, and generate with an
// SDXL / Illustrious checkpoint + a ControlNet. The result can go straight to
// the Generate tab as the Anima reference image (LLLite), which is the flow
// this tab exists for: Illustrious follows a pose well, Anima then redraws
// the result in its own look.
//
// Three graphs, all shaped so every transport (desktop main, the Osmium Comfy
// runner, the relay, the phone) runs them unchanged:
// - extract: LoadImage '239' → DWPreprocessor '2' (marked `_meta.capture`,
//   its `openpose_json` comes back like WD14's tags) → PreviewImage '3' (a
//   server needs an output node; the runner prunes it).
// - generate: LoadImage '239' (the control image) → ControlNetApplyAdvanced
//   → KSampler → SaveImage '192', a standalone graph like USDU's imported one.
// The pose editor draws in OpenPose's own style (controlnet_aux's
// draw_bodypose / draw_handpose / draw_facepose), so its PNG is what an
// OpenPose ControlNet was trained on.
import { attachPickerModal } from './picker-modal';
import { showImageLightbox } from './lightbox';
import { imageSizeOf } from './usdu';

type Prompt = Record<string, any>;
interface Pt { x: number; y: number; }
type Pts = (Pt | null)[];
// Normalized 0–1 canvas coordinates; null = not detected.
interface Person { body: Pts; lhand: Pts | null; rhand: Pts | null; face: Pts | null; }

export type ControlNetListKind = 'ckpt' | 'controlnet' | 'sampler' | 'scheduler';

export interface ControlNetSettings {
  controlSource: 'pose' | 'image';
  poseWidth: string; poseHeight: string;
  detectHands: boolean; detectFace: boolean; detectResolution: string;
  ckpt: string; controlnet: string; strength: string; startPercent: string; endPercent: string;
  prompt: string; negative: string;
  seed: string; randomSeed: boolean; steps: string; cfg: string; sampler: string; scheduler: string;
}
type Key = keyof ControlNetSettings;

export const CONTROLNET_DEFAULTS: ControlNetSettings = {
  controlSource: 'pose', poseWidth: '832', poseHeight: '1216',
  detectHands: true, detectFace: true, detectResolution: '1024',
  ckpt: 'Janku 6.9.safetensors', controlnet: '', strength: '1', startPercent: '0', endPercent: '1',
  prompt: '', negative: 'lowres, bad anatomy, bad hands, extra fingers, missing fingers, text, signature, watermark, username',
  seed: '0', randomSeed: true, steps: '25', cfg: '5', sampler: 'euler_ancestral', scheduler: 'normal'
};

interface FieldDef {
  key: Key; label: string; tip: string;
  type: 'number' | 'pick' | 'select' | 'check' | 'text' | 'textarea';
  step?: string; min?: string; max?: string;
  options?: [string, string][]; list?: ControlNetListKind; wide?: boolean;
  show?: (s: ControlNetSettings) => boolean;
}

const POSE_FIELDS: FieldDef[] = [
  { key: 'poseWidth', type: 'number', step: '8', min: '64', label: 'Width',
    tip: 'Width of the pose canvas, which is also the generated image\'s width. Choosing an image sets it from that image (about 1 megapixel, a multiple of 8).' },
  { key: 'poseHeight', type: 'number', step: '8', min: '64', label: 'Height',
    tip: 'Height of the pose canvas and of the generated image.' },
  { key: 'detectHands', type: 'check', label: 'Find hands', tip: 'Extract pose also finds the hands (21 points each). Hands help an OpenPose ControlNet draw fingers right.' },
  { key: 'detectFace', type: 'check', label: 'Find face', tip: 'Extract pose also finds the face (70 points): head turn and expression.' },
  { key: 'detectResolution', type: 'number', step: '64', min: '64', label: 'Detection resolution',
    tip: 'The size DWPose looks at the image in (multiple of 64). 1024 finds small hands better than the node\'s 512, and is still fast.' }
];

const GEN_FIELDS: FieldDef[] = [
  { key: 'controlSource', type: 'select', label: 'Control image', wide: true,
    options: [['pose', 'The pose on the left'], ['image', 'The image I chose, as it is']],
    tip: 'The pose on the left: the skeleton you extracted or edited, drawn in OpenPose style. The image I chose, as it is: send the chosen image itself, e.g. a lineart, depth map or pose image you made elsewhere (pick a ControlNet that matches it).' },
  { key: 'ckpt', type: 'pick', list: 'ckpt', label: 'Checkpoint', wide: true,
    tip: 'An SDXL / Illustrious-family checkpoint from ComfyUI\'s checkpoints folder. Not the Anima model: Anima has no OpenPose ControlNet, which is why this tab generates with Illustrious and hands the result to Anima as a reference. Default: Janku 6.9.' },
  { key: 'controlnet', type: 'pick', list: 'controlnet', label: 'ControlNet', wide: true,
    tip: 'An SDXL ControlNet from ComfyUI\'s controlnet folder that matches the control image (OpenPose for a pose). The anima-lllite-* files in that folder are Anima LLLite models for the Generate tab, not for this.' },
  { key: 'strength', type: 'number', step: '0.05', min: '0', max: '2', label: 'Strength',
    tip: 'How strongly the image follows the control image. 1 = fully; 0.6–0.8 leaves the model room for anatomy the skeleton doesn\'t describe.' },
  { key: 'startPercent', type: 'number', step: '0.05', min: '0', max: '1', label: 'Start',
    tip: 'When in the sampling the ControlNet starts (0 = from the first step).' },
  { key: 'endPercent', type: 'number', step: '0.05', min: '0', max: '1', label: 'End',
    tip: 'When it stops. The pose is set in the first steps, so 0.5–0.7 often keeps it and frees the details.' },
  { key: 'prompt', type: 'textarea', label: 'Prompt', wide: true, tip: 'What to draw in the pose (Danbooru tags work best on Illustrious).' },
  { key: 'negative', type: 'textarea', label: 'Negative prompt', wide: true, tip: 'What to keep out of the image.' },
  { key: 'seed', type: 'number', step: '1', min: '0', label: 'Seed', tip: 'The noise seed. With "New seed each time" on, a fresh one is written here on every Generate.' },
  { key: 'randomSeed', type: 'check', label: 'New seed each time', tip: 'Pick a random seed on every Generate (it is written into the Seed box, so a good one can be kept).' },
  { key: 'steps', type: 'number', step: '1', min: '1', label: 'Steps', tip: 'Sampling steps. 20–30 for Illustrious models.' },
  { key: 'cfg', type: 'number', step: '0.1', min: '0', label: 'CFG', tip: 'How strongly the image follows the prompt. Illustrious models usually like 4 to 7.' },
  { key: 'sampler', type: 'pick', list: 'sampler', label: 'Sampler', tip: 'The sampler (your ComfyUI\'s list). Default: euler_ancestral.' },
  { key: 'scheduler', type: 'pick', list: 'scheduler', label: 'Scheduler', tip: 'The noise schedule. Default: normal.' }
];

const idOf = (key: Key): string => 'cn' + key[0].toUpperCase() + key.slice(1);
const num = (v: string, d: number): number => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
const int = (v: string, d: number): number => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; };
const snap8 = (n: number): number => Math.max(64, Math.round(n / 8) * 8);

// ---- OpenPose drawing (controlnet_aux's util.py) ----

// OpenPose's 18 body points: 0 nose, 1 neck, 2–4 right arm, 5–7 left arm,
// 8–10 right leg, 11–13 left leg, 14/15 eyes, 16/17 ears ("right" = the
// person's right, so the image's left).
const LIMBS: [number, number][] = [[1, 2], [1, 5], [2, 3], [3, 4], [5, 6], [6, 7], [1, 8], [8, 9], [9, 10], [1, 11], [11, 12], [12, 13], [1, 0], [0, 14], [14, 16], [0, 15], [15, 17]];
const COLORS: [number, number, number][] = [[255, 0, 0], [255, 85, 0], [255, 170, 0], [255, 255, 0], [170, 255, 0], [85, 255, 0], [0, 255, 0],
  [0, 255, 85], [0, 255, 170], [0, 255, 255], [0, 170, 255], [0, 85, 255], [0, 0, 255], [85, 0, 255], [170, 0, 255], [255, 0, 255], [255, 0, 170], [255, 0, 85]];
const HAND_EDGES: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [0, 9], [9, 10], [10, 11], [11, 12], [0, 13], [13, 14], [14, 15], [15, 16], [0, 17], [17, 18], [18, 19], [19, 20]];
const MIRROR_PAIRS: [number, number][] = [[2, 5], [3, 6], [4, 7], [8, 11], [9, 12], [10, 13], [14, 15], [16, 17]];
const HEAD = [0, 14, 15, 16, 17];

const rgb = (c: number[], k = 1): string => `rgb(${Math.round(c[0] * k)},${Math.round(c[1] * k)},${Math.round(c[2] * k)})`;
function hsv(h: number): number[] {
  const i = Math.floor(h * 6); const f = h * 6 - i; const q = 1 - f;
  return [[1, f, 0], [q, 1, 0], [0, 1, f], [0, q, 1], [f, 0, 1], [1, 0, q]][i % 6].map((v) => v * 255);
}

function drawPose(ctx: CanvasRenderingContext2D, people: Person[], W: number, H: number, hands: boolean, face: boolean): void {
  const dot = (p: Pt, r: number, color: string) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p.x * W, p.y * H, r, 0, Math.PI * 2); ctx.fill(); };
  for (const person of people) {
    LIMBS.forEach(([a, b], i) => {
      const p = person.body[a]; const q = person.body[b];
      if (!p || !q) return;
      const x1 = p.x * W, y1 = p.y * H, x2 = q.x * W, y2 = q.y * H;
      ctx.fillStyle = rgb(COLORS[i], 0.6);
      ctx.beginPath();
      ctx.ellipse((x1 + x2) / 2, (y1 + y2) / 2, Math.hypot(x2 - x1, y2 - y1) / 2, 4, Math.atan2(y2 - y1, x2 - x1), 0, Math.PI * 2);
      ctx.fill();
    });
    person.body.forEach((p, i) => { if (p) dot(p, 4, rgb(COLORS[i])); });
    if (hands) {
      for (const hand of [person.lhand, person.rhand]) {
        if (!hand) continue;
        ctx.lineWidth = 2;
        HAND_EDGES.forEach(([a, b], i) => {
          const p = hand[a]; const q = hand[b];
          if (!p || !q) return;
          ctx.strokeStyle = rgb(hsv(i / HAND_EDGES.length));
          ctx.beginPath(); ctx.moveTo(p.x * W, p.y * H); ctx.lineTo(q.x * W, q.y * H); ctx.stroke();
        });
        for (const p of hand) if (p) dot(p, 4, 'rgb(0,0,255)');
      }
    }
    if (face && person.face) for (const p of person.face) if (p) dot(p, 3, 'rgb(255,255,255)');
  }
}

// A standing figure, in units of the canvas height, centred at `cx` (0–1).
function templatePerson(W: number, H: number, cx: number): Person {
  const u = H / W;
  const P = (dx: number, y: number): Pt => ({ x: cx + dx * u, y });
  return {
    body: [P(0, 0.15), P(0, 0.24), P(-0.08, 0.24), P(-0.11, 0.37), P(-0.12, 0.49), P(0.08, 0.24), P(0.11, 0.37), P(0.12, 0.49),
      P(-0.05, 0.51), P(-0.055, 0.69), P(-0.06, 0.87), P(0.05, 0.51), P(0.055, 0.69), P(0.06, 0.87),
      P(-0.018, 0.135), P(0.018, 0.135), P(-0.04, 0.145), P(0.04, 0.145)],
    lhand: null, rhand: null, face: null
  };
}

// controlnet_aux's openpose_json: [ { people: [...], canvas_width, canvas_height } ]
// with flat [x, y, confidence] lists, in pixels or 0–1 depending on the
// detector. Returns normalized people.
export function parseOpenposeJson(text: string): { people: Person[]; width: number; height: number } {
  const raw = JSON.parse(text);
  const d = Array.isArray(raw) ? raw[0] : raw;
  if (!d || !Array.isArray(d.people)) throw new Error('No pose data in the result.');
  const W = Number(d.canvas_width) || 1; const H = Number(d.canvas_height) || 1;
  const all: number[] = [];
  for (const p of d.people) for (const k of ['pose_keypoints_2d', 'hand_left_keypoints_2d', 'hand_right_keypoints_2d', 'face_keypoints_2d']) {
    const l = p[k]; if (Array.isArray(l)) for (let i = 0; i < l.length; i += 3) if (l[i + 2] > 0) all.push(l[i], l[i + 1]);
  }
  const pixels = all.some((v) => v > 1.5);
  const sx = pixels ? 1 / W : 1, sy = pixels ? 1 / H : 1;
  const pts = (l: unknown, n: number): Pts | null => {
    if (!Array.isArray(l) || !l.length) return null;
    const out: Pts = [];
    for (let i = 0; i < n; i++) {
      const x = l[i * 3], y = l[i * 3 + 1], c = l[i * 3 + 2];
      out.push(typeof x === 'number' && c > 0 && (x > 0 || y > 0) ? { x: x * sx, y: y * sy } : null);
    }
    return out;
  };
  const people = d.people.map((p: any) => ({
    body: pts(p.pose_keypoints_2d, 18) || new Array(18).fill(null),
    lhand: pts(p.hand_left_keypoints_2d, 21), rhand: pts(p.hand_right_keypoints_2d, 21), face: pts(p.face_keypoints_2d, 70)
  }));
  return { people, width: W, height: H };
}

// ---- graphs ----

export function buildPoseExtractPrompt(imageName: string, s: ControlNetSettings): Prompt {
  return {
    '239': { class_type: 'LoadImage', inputs: { image: imageName, upload: 'image' }, _meta: { title: 'Load Image' } },
    '2': {
      class_type: 'DWPreprocessor',
      inputs: {
        image: ['239', 0], detect_hand: s.detectHands ? 'enable' : 'disable', detect_body: 'enable', detect_face: s.detectFace ? 'enable' : 'disable',
        resolution: Math.max(64, Math.round(int(s.detectResolution, 1024) / 64) * 64),
        bbox_detector: 'yolox_l.onnx', pose_estimator: 'dw-ll_ucoco_384_bs5.torchscript.pt', scale_stick_for_xinsr_cn: 'disable'
      },
      _meta: { title: 'DWPose Estimator', capture: true }
    },
    '3': { class_type: 'PreviewImage', inputs: { images: ['2', 0] }, _meta: { title: 'Pose preview' } }
  };
}

export function buildControlNetPrompt(imageName: string, s: ControlNetSettings, width: number, height: number, seed: number): Prompt {
  const d = CONTROLNET_DEFAULTS;
  return {
    '239': { class_type: 'LoadImage', inputs: { image: imageName, upload: 'image' }, _meta: { title: 'Control image' } },
    cn_ckpt: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: s.ckpt.trim() || d.ckpt }, _meta: { title: 'Checkpoint' } },
    cn_model: { class_type: 'ControlNetLoader', inputs: { control_net_name: s.controlnet.trim() }, _meta: { title: 'ControlNet' } },
    cn_pos: { class_type: 'CLIPTextEncode', inputs: { text: s.prompt, clip: ['cn_ckpt', 1] }, _meta: { title: 'Positive' } },
    cn_neg: { class_type: 'CLIPTextEncode', inputs: { text: s.negative, clip: ['cn_ckpt', 1] }, _meta: { title: 'Negative' } },
    cn_apply: {
      class_type: 'ControlNetApplyAdvanced',
      inputs: {
        positive: ['cn_pos', 0], negative: ['cn_neg', 0], control_net: ['cn_model', 0], image: ['239', 0], vae: ['cn_ckpt', 2],
        strength: num(s.strength, 1), start_percent: num(s.startPercent, 0), end_percent: num(s.endPercent, 1)
      },
      _meta: { title: 'Apply ControlNet' }
    },
    cn_latent: { class_type: 'EmptyLatentImage', inputs: { width, height, batch_size: 1 }, _meta: { title: 'Empty Latent' } },
    cn_ksampler: {
      class_type: 'KSampler',
      inputs: {
        model: ['cn_ckpt', 0], positive: ['cn_apply', 0], negative: ['cn_apply', 1], latent_image: ['cn_latent', 0],
        seed, steps: Math.max(1, int(s.steps, 25)), cfg: num(s.cfg, 5),
        sampler_name: s.sampler.trim() || d.sampler, scheduler: s.scheduler.trim() || d.scheduler, denoise: 1
      },
      _meta: { title: 'KSampler' }
    },
    cn_decode: { class_type: 'VAEDecode', inputs: { samples: ['cn_ksampler', 0], vae: ['cn_ckpt', 2] }, _meta: { title: 'VAE Decode' } },
    '192': { class_type: 'SaveImage', inputs: { filename_prefix: 'ControlNet/ComfyBridge', images: ['cn_decode', 0] }, _meta: { title: 'ControlNet result' } }
  };
}

// ---- tab ----

export interface ControlNetJob { prompt: Prompt; imageFilename: string; imageBytes: Uint8Array; }

export interface ControlNetTabOptions {
  getList: (kind: ControlNetListKind) => string[];
  refreshLists: () => Promise<void> | void;
  // Runs the extract graph ('239' → '2'), resolves with DWPose's JSON text
  // (the shells' WD14 tagging transport).
  extractPose: (prompt: Prompt, imageName: string, bytes: Uint8Array) => Promise<string>;
  // Queues the generate graph; the shell calls showResult() when it's saved.
  queueGenerate: (job: ControlNetJob) => void;
  // Saves the rendered pose PNG in the output folder (Poses/).
  savePose: (bytes: Uint8Array) => Promise<void>;
  // Makes these bytes the Generate tab's reference image (Anima LLLite).
  useAsReference: (name: string, bytes: Uint8Array) => void;
  log: (msg: string) => void;
}

export interface ControlNetTab {
  refresh: () => void;
  showResult: (bytes: Uint8Array) => void;
}

const POSE_KEY = 'comfybridge-cn-pose';

export function mountControlNetTab(host: HTMLElement, opts: ControlNetTabOptions): ControlNetTab {
  const touch = typeof matchMedia === 'function' && matchMedia('(hover: none)').matches;
  host.classList.add('cn-tab');
  const els = new Map<Key, HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>();
  const rows: { def: FieldDef; row: HTMLElement }[] = [];
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  };
  const button = (text: string, title: string, cls?: string): HTMLButtonElement => {
    const b = el('button', cls, text); b.type = 'button'; b.title = title; return b;
  };
  const head = (text: string) => el('div', 'usdu-sec-head', text);

  function fieldGrid(defs: FieldDef[]): HTMLElement {
    const grid = el('div', 'settings-grid');
    for (const def of defs) {
      const row = el('div', 'usdu-field' + (def.wide || def.type === 'check' ? ' settings-span2' : ''));
      row.title = def.tip;
      const tip = el('div', 'usdu-tip muted small', def.tip);
      tip.hidden = true;
      let input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      if (def.type === 'check') {
        const label = el('label', 'chk-row');
        const c = el('input'); c.type = 'checkbox';
        label.append(c, ' ' + def.label);
        if (touch) {
          const info = el('button', 'usdu-info', 'ⓘ'); info.type = 'button';
          info.setAttribute('aria-label', 'What this does');
          info.addEventListener('click', (e) => { e.preventDefault(); tip.hidden = !tip.hidden; });
          label.appendChild(info);
        }
        row.appendChild(label);
        input = c;
      } else {
        const label = el('label', undefined, def.label);
        if (touch) { label.classList.add('usdu-tappable'); label.addEventListener('click', () => { tip.hidden = !tip.hidden; }); }
        row.appendChild(label);
        if (def.type === 'select') {
          const sel = el('select');
          for (const [v, t] of def.options || []) { const o = el('option', undefined, t); o.value = v; sel.appendChild(o); }
          input = sel;
        } else if (def.type === 'textarea') {
          const ta = el('textarea'); ta.rows = 3; input = ta;
        } else {
          const i = el('input');
          i.type = def.type === 'number' ? 'number' : 'text';
          if (def.step) i.step = def.step;
          if (def.min) i.min = def.min;
          if (def.max) i.max = def.max;
          if (def.type === 'pick') {
            i.readOnly = true;
            i.placeholder = 'Tap to choose…';
            attachPickerModal(i, def.label, () => opts.getList(def.list!));
          }
          input = i;
        }
        row.appendChild(input);
      }
      row.appendChild(tip);
      input.id = idOf(def.key);
      grid.appendChild(row);
      els.set(def.key, input);
      rows.push({ def, row });
    }
    return grid;
  }

  // ---- layout: pose stage (left) | settings (right) ----
  const stage = el('div', 'cn-stage');
  const side = el('div', 'cn-side');
  host.append(stage, side);

  stage.appendChild(head('Pose'));
  const canvasWrap = el('div', 'cn-canvas-wrap');
  const canvas = el('canvas', 'cn-canvas');
  canvasWrap.appendChild(canvas);
  const sizeNote = el('div', 'muted small cn-size-note');
  const toolRow = el('div', 'row cn-tools');
  const addBtn = button('+ Person', 'Add a standing figure to the pose');
  const delBtn = button('Remove person', 'Remove the figure you last touched');
  const mirrorBtn = button('Mirror person', 'Flip the figure you last touched left to right');
  const clearBtn = button('Clear', 'Remove every figure');
  toolRow.append(addBtn, delBtn, mirrorBtn, clearBtn);
  const viewRow = el('div', 'row cn-tools');
  const mkCheck = (text: string, title: string, checked: boolean): HTMLInputElement => {
    const l = el('label', 'chk-row'); l.title = title;
    const c = el('input'); c.type = 'checkbox'; c.checked = checked;
    l.append(c, ' ' + text);
    viewRow.appendChild(l);
    return c;
  };
  const showUnder = mkCheck('Show image under pose', 'Draw the chosen image faintly behind the pose (only in the editor; it is never sent)', true);
  const drawHands = mkCheck('Hands', 'Include the hands in the pose image', true);
  const drawFace = mkCheck('Face', 'Include the face points in the pose image', true);
  const moveWhole = mkCheck('Move whole person', 'Dragging any point moves the whole figure (Shift-drag does the same)', false);
  // Session-only view toggles: ids so the UI-state snapshot keeps them too.
  showUnder.id = 'cnShowUnder'; drawHands.id = 'cnDrawHands'; drawFace.id = 'cnDrawFace'; moveWhole.id = 'cnMoveWhole';
  const hint = el('div', 'muted small cn-hint',
    'Drag a point to move it. Moving a wrist moves its hand; moving the nose moves the head. Shift-drag (or "Move whole person") moves the whole figure.');
  const poseBtnRow = el('div', 'row cn-tools');
  const savePoseBtn = button('Save pose image', 'Save the pose as a PNG in your output folder (Poses/)');
  const poseRefBtn = button('Use pose as Anima reference', 'Put the pose image in the Generate tab\'s reference image (Anima LLLite). Pick a pose-capable LLLite model there for it to mean anything.');
  poseBtnRow.append(savePoseBtn, poseRefBtn);
  stage.append(canvasWrap, sizeNote, toolRow, viewRow, hint, poseBtnRow);

  // Source image
  side.appendChild(head('Source image'));
  const pickRow = el('div', 'row cn-tools');
  const pickBtn = button('Choose image…', 'An image to take the pose from (PNG, JPG or WebP). It also sets the canvas size.');
  const extractBtn = button('Extract pose', 'Find the people\'s poses in the chosen image with DWPose (needs comfyui_controlnet_aux). Replaces the pose on the left.', 'primary');
  pickRow.append(pickBtn, extractBtn);
  const pickedName = el('div', 'muted small', 'No image chosen.');
  const fileInput = el('input'); fileInput.type = 'file'; fileInput.accept = 'image/png,image/jpeg,image/webp'; fileInput.hidden = true;
  side.append(pickRow, pickedName, fileInput, fieldGrid(POSE_FIELDS));

  // Generate
  side.appendChild(head('Generate (Illustrious + ControlNet)'));
  side.appendChild(fieldGrid(GEN_FIELDS));
  const genRow = el('div', 'row cn-tools');
  const genBtn = button('Generate', 'Queue an image with these settings. Saved in your output folder\'s ControlNet folder.', 'primary usdu-run');
  const refreshBtn = button('Refresh lists', 'Reload the checkpoint, ControlNet, sampler and scheduler lists from ComfyUI');
  genRow.append(genBtn, refreshBtn);
  side.appendChild(genRow);

  // Result
  side.appendChild(head('Result'));
  const result = el('div', 'usdu-preview cn-result');
  const resultImg = el('img'); resultImg.alt = ''; resultImg.hidden = true;
  const resultEmpty = el('div', 'muted usdu-preview-empty', 'The generated image shows here.');
  result.append(resultImg, resultEmpty);
  const useRefBtn = button('Use as Anima reference', 'Put this image in the Generate tab\'s reference image, so Anima (LLLite) follows it', 'primary');
  useRefBtn.disabled = true;
  const resRow = el('div', 'row cn-tools');
  resRow.appendChild(useRefBtn);
  side.append(result, resRow);

  // ---- settings ----
  function read(): ControlNetSettings {
    const s: any = { ...CONTROLNET_DEFAULTS };
    for (const [k, e] of els) s[k] = e instanceof HTMLInputElement && e.type === 'checkbox' ? e.checked : e.value;
    return s as ControlNetSettings;
  }
  function apply(s: Partial<ControlNetSettings>): void {
    for (const k of Object.keys(s) as Key[]) {
      const e = els.get(k); const v = s[k];
      if (!e || v === undefined) continue;
      if (e instanceof HTMLInputElement && e.type === 'checkbox') e.checked = Boolean(v);
      else e.value = String(v);
    }
  }
  apply(CONTROLNET_DEFAULTS);
  const poseW = () => snap8(int(els.get('poseWidth')!.value, 832));
  const poseH = () => snap8(int(els.get('poseHeight')!.value, 1216));

  // ---- pose state ----
  let people: Person[] = [];
  let selected = 0;
  let source: { name: string; bytes: Uint8Array; img: HTMLImageElement | null } | null = null;
  try {
    const saved = JSON.parse(localStorage.getItem(POSE_KEY) || 'null');
    if (saved && Array.isArray(saved.people)) people = saved.people;
  } catch { /* none */ }
  function persist(): void {
    try { localStorage.setItem(POSE_KEY, JSON.stringify({ people })); } catch { /* best effort */ }
  }
  if (!people.length) people = [templatePerson(poseW(), poseH(), 0.5)];

  function render(): void {
    const W = poseW(), H = poseH();
    if (canvas.width !== W) canvas.width = W;
    if (canvas.height !== H) canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    if (source && source.img && showUnder.checked) {
      ctx.globalAlpha = 0.45;
      ctx.drawImage(source.img, 0, 0, W, H);
      ctx.globalAlpha = 1;
    }
    drawPose(ctx, people, W, H, drawHands.checked, drawFace.checked);
    // The selected figure's points get a ring, so it's clear what the
    // person buttons act on.
    const p = people[selected];
    if (p && people.length > 1) {
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5;
      for (const q of p.body) if (q) { ctx.beginPath(); ctx.arc(q.x * W, q.y * H, 7, 0, Math.PI * 2); ctx.stroke(); }
    }
    sizeNote.textContent = `${W} × ${H} · ${people.length} ${people.length === 1 ? 'person' : 'people'}`;
  }

  async function poseBytes(): Promise<Uint8Array> {
    const W = poseW(), H = poseH();
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    drawPose(ctx, people, W, H, drawHands.checked, drawFace.checked);
    const blob = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/png'));
    if (!blob) throw new Error('Could not draw the pose image.');
    return new Uint8Array(await blob.arrayBuffer());
  }

  // ---- dragging ----
  type Hit = { person: number; part: 'body' | 'lhand' | 'rhand' | 'face'; index: number };
  let drag: { hit: Hit; whole: boolean; last: Pt; carry: Pt[] } | null = null;
  const toCanvas = (e: PointerEvent): Pt => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };
  function hitTest(p: Pt): Hit | null {
    const r = canvas.getBoundingClientRect();
    const radius = (touch ? 22 : 12);
    let best: Hit | null = null; let bestD = Infinity;
    const check = (pts: Pts | null, person: number, part: Hit['part']) => {
      if (!pts) return;
      pts.forEach((q, index) => {
        if (!q) return;
        const d = Math.hypot((q.x - p.x) * r.width, (q.y - p.y) * r.height);
        // Body points win ties against the dense hand/face points.
        const bias = part === 'body' ? 0.6 : 1;
        if (d < radius && d * bias < bestD) { bestD = d * bias; best = { person, part, index }; }
      });
    };
    people.forEach((pp, i) => {
      check(pp.body, i, 'body');
      if (drawHands.checked) { check(pp.lhand, i, 'lhand'); check(pp.rhand, i, 'rhand'); }
      if (drawFace.checked) check(pp.face, i, 'face');
    });
    return best;
  }
  // What moves with a body point: a wrist carries the hand nearest it, the
  // nose carries the eyes, ears and face.
  function carried(hit: Hit): Pt[] {
    const pp = people[hit.person];
    if (hit.part !== 'body') return [];
    const all = (l: Pts | null) => (l || []).filter((q): q is Pt => !!q);
    if (hit.index === 4 || hit.index === 7) {
      const w = pp.body[hit.index]!;
      const near = (h: Pts | null) => (h && h[0] ? Math.hypot(h[0].x - w.x, h[0].y - w.y) : Infinity);
      const hand = near(pp.lhand) <= near(pp.rhand) ? pp.lhand : pp.rhand;
      return near(hand) < 0.15 ? all(hand) : [];
    }
    if (hit.index === 0) return [...HEAD.slice(1).map((i) => pp.body[i]).filter((q): q is Pt => !!q), ...all(pp.face)];
    return [];
  }
  function allPoints(pp: Person): Pt[] {
    return [pp.body, pp.lhand, pp.rhand, pp.face].flatMap((l) => (l || []).filter((q): q is Pt => !!q));
  }
  canvas.addEventListener('pointerdown', (e) => {
    const p = toCanvas(e);
    const hit = hitTest(p);
    if (!hit) return;
    e.preventDefault();
    selected = hit.person;
    drag = { hit, whole: e.shiftKey || moveWhole.checked, last: p, carry: carried(hit) };
    canvas.setPointerCapture(e.pointerId);
    render();
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = toCanvas(e);
    if (!drag) {
      canvas.style.cursor = hitTest(p) ? 'pointer' : 'default';
      return;
    }
    const dx = p.x - drag.last.x, dy = p.y - drag.last.y;
    drag.last = p;
    const pp = people[drag.hit.person];
    const moved = drag.whole ? allPoints(pp) : [(pp[drag.hit.part] as Pts)[drag.hit.index]!, ...drag.carry];
    for (const q of moved) { q.x += dx; q.y += dy; }
    render();
  });
  const endDrag = () => { if (drag) { drag = null; persist(); } };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  addBtn.addEventListener('click', () => {
    const cx = Math.min(0.85, 0.5 + 0.18 * (people.length % 3) * (people.length % 2 ? 1 : -1));
    people.push(templatePerson(poseW(), poseH(), cx));
    selected = people.length - 1;
    persist(); render();
  });
  delBtn.addEventListener('click', () => {
    if (!people.length) return;
    people.splice(Math.min(selected, people.length - 1), 1);
    selected = Math.max(0, people.length - 1);
    persist(); render();
  });
  mirrorBtn.addEventListener('click', () => {
    const pp = people[selected];
    if (!pp) return;
    const xs = allPoints(pp).map((q) => q.x);
    const c = (Math.min(...xs) + Math.max(...xs)) / 2;
    for (const q of allPoints(pp)) q.x = 2 * c - q.x;
    for (const [a, b] of MIRROR_PAIRS) [pp.body[a], pp.body[b]] = [pp.body[b], pp.body[a]];
    [pp.lhand, pp.rhand] = [pp.rhand, pp.lhand];
    persist(); render();
  });
  clearBtn.addEventListener('click', () => { people = []; selected = 0; persist(); render(); });
  for (const c of [showUnder, drawHands, drawFace]) c.addEventListener('change', render);
  for (const k of ['poseWidth', 'poseHeight'] as Key[]) els.get(k)!.addEventListener('change', render);

  // ---- source image ----
  pickBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files && fileInput.files[0];
    fileInput.value = '';
    if (!f) return;
    const bytes = new Uint8Array(await f.arrayBuffer());
    const size = imageSizeOf(bytes);
    pickedName.textContent = size ? `${f.name} · ${size.width}×${size.height}` : f.name;
    // Decoded from the bytes (notes/Pitfalls/Android-WebView-Picker-Blob-Preview.md).
    const img = new Image();
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: f.type || 'image/png' }));
    img.onload = () => { URL.revokeObjectURL(url); render(); };
    img.src = url;
    source = { name: f.name, bytes, img };
    if (size) {
      // About a megapixel, the image's shape, multiples of 8 (SDXL's sizes);
      // an image already near that (832×1216, 1024²) keeps its own size.
      const mp = (size.width * size.height) / (1024 * 1024);
      const k = mp > 0.85 && mp < 1.15 ? 1 : Math.sqrt(1 / mp);
      apply({ poseWidth: String(snap8(size.width * k)), poseHeight: String(snap8(size.height * k)) });
      host.dispatchEvent(new Event('change', { bubbles: true })); // UI-state save
    }
    render();
  });

  extractBtn.addEventListener('click', async () => {
    if (!source) { opts.log('ControlNet: choose an image to extract the pose from first.'); return; }
    extractBtn.disabled = true;
    const label = extractBtn.textContent;
    extractBtn.textContent = 'Extracting…';
    try {
      const text = await opts.extractPose(buildPoseExtractPrompt(source.name, read()), source.name, source.bytes);
      const r = parseOpenposeJson(text);
      if (!r.people.length) { opts.log(`ControlNet: no people found in ${source.name}.`); return; }
      people = r.people;
      selected = 0;
      persist(); render();
      opts.log(`ControlNet: found ${r.people.length} ${r.people.length === 1 ? 'person' : 'people'} in ${source.name}.`);
    } catch (err) {
      opts.log('ControlNet: pose extraction failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      extractBtn.disabled = false;
      extractBtn.textContent = label;
    }
  });

  savePoseBtn.addEventListener('click', async () => {
    if (!people.length) { opts.log('ControlNet: the pose is empty.'); return; }
    try { await opts.savePose(await poseBytes()); }
    catch (err) { opts.log('ControlNet: saving the pose failed: ' + (err instanceof Error ? err.message : String(err))); }
  });
  poseRefBtn.addEventListener('click', async () => {
    if (!people.length) { opts.log('ControlNet: the pose is empty.'); return; }
    opts.useAsReference('pose.png', await poseBytes());
  });

  // ---- generate ----
  genBtn.addEventListener('click', async () => {
    const s = read();
    if (!s.controlnet.trim()) { opts.log('ControlNet: choose a ControlNet model first (Refresh lists if the list is empty).'); return; }
    let name = 'pose.png';
    let bytes: Uint8Array;
    if (s.controlSource === 'image') {
      if (!source) { opts.log('ControlNet: choose the control image first (or switch Control image to the pose).'); return; }
      name = source.name; bytes = source.bytes;
    } else {
      if (!people.length) { opts.log('ControlNet: the pose is empty. Extract one or add a person.'); return; }
      bytes = await poseBytes();
    }
    let seed = Math.max(0, int(s.seed, 0));
    if (s.randomSeed) {
      seed = Math.floor(Math.random() * 2 ** 32);
      apply({ seed: String(seed) });
      host.dispatchEvent(new Event('change', { bubbles: true }));
    }
    opts.queueGenerate({ prompt: buildControlNetPrompt(name, s, poseW(), poseH(), seed), imageFilename: name, imageBytes: bytes });
  });
  refreshBtn.addEventListener('click', () => { void opts.refreshLists(); });

  let resultBytes: Uint8Array | null = null;
  let resultUrl = '';
  result.addEventListener('click', () => { if (resultUrl) showImageLightbox(resultUrl); });
  useRefBtn.addEventListener('click', () => { if (resultBytes) opts.useAsReference('controlnet.png', resultBytes); });

  render();
  return {
    // Re-draw after the UI-state restore set the size fields without events.
    refresh: render,
    showResult(bytes: Uint8Array): void {
      resultBytes = bytes;
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      resultUrl = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'image/png' }));
      resultImg.src = resultUrl;
      resultImg.hidden = false;
      resultEmpty.hidden = true;
      result.classList.add('has-image');
      result.title = 'Click to zoom in';
      useRefBtn.disabled = false;
    }
  };
}
