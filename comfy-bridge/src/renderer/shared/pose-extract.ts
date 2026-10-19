// Extract pose (both shells, the Generate tab's reference image): DWPose finds
// the people in the picked reference, and the reference becomes an
// OpenPose-style pose frame at the same size, for the Anima LLLite slot.
//
// Graph: LoadImage '239' → DWPreprocessor '2' (marked `_meta.capture`) →
// PreviewImage '3' (a server needs an output node; the runner prunes it). It
// runs through the WD14 tagging transport: the node's `openpose_json` comes
// back like the tagger's tags (comfy-core's extractWd14Tags, the runner's
// saved_texts). The frame is drawn here, in controlnet_aux's own style
// (draw_bodypose / draw_handpose / draw_facepose).

type Prompt = Record<string, any>;
interface Pt { x: number; y: number; }
type Pts = (Pt | null)[];
// Normalized 0–1 coordinates; null = not detected.
interface Person { body: Pts; lhand: Pts | null; rhand: Pts | null; face: Pts | null; }

// `wholeImage`: skip DWPose's YOLOX person detector and treat the whole image
// as one person. YOLOX finds nobody in some art (greyscale or sketchy
// renders), and DWPose then returns no people without an error.
export function buildPoseExtractPrompt(imageName: string, wholeImage = false): Prompt {
  return {
    '239': { class_type: 'LoadImage', inputs: { image: imageName, upload: 'image' }, _meta: { title: 'Load Image' } },
    '2': {
      class_type: 'DWPreprocessor',
      inputs: {
        image: ['239', 0], detect_hand: 'enable', detect_body: 'enable', detect_face: 'enable', resolution: 1024,
        // Both files ship with (or were already fetched by) controlnet_aux;
        // another detector would start a Hugging Face download.
        bbox_detector: wholeImage ? 'None' : 'yolox_l.onnx', pose_estimator: 'dw-ll_ucoco_384_bs5.torchscript.pt',
        scale_stick_for_xinsr_cn: 'disable'
      },
      _meta: { title: 'DWPose Estimator', capture: true }
    },
    '3': { class_type: 'PreviewImage', inputs: { images: ['2', 0] }, _meta: { title: 'Pose preview' } }
  };
}

// controlnet_aux's openpose_json: [ { people: [...], canvas_width, canvas_height } ]
// with flat [x, y, confidence] lists, in pixels (DWPose) or 0–1.
function parseOpenposeJson(text: string): { people: Person[]; width: number; height: number } {
  const raw = JSON.parse(text);
  const d = Array.isArray(raw) ? raw[0] : raw;
  if (!d || !Array.isArray(d.people)) throw new Error('No pose data in the result.');
  const W = Number(d.canvas_width) || 1;
  const H = Number(d.canvas_height) || 1;
  const all: number[] = [];
  for (const p of d.people) for (const k of ['pose_keypoints_2d', 'hand_left_keypoints_2d', 'hand_right_keypoints_2d', 'face_keypoints_2d']) {
    const l = p[k];
    if (Array.isArray(l)) for (let i = 0; i < l.length; i += 3) if (l[i + 2] > 0) all.push(l[i], l[i + 1]);
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
  const people: Person[] = d.people.map((p: any) => ({
    body: pts(p.pose_keypoints_2d, 18) || new Array(18).fill(null),
    lhand: pts(p.hand_left_keypoints_2d, 21), rhand: pts(p.hand_right_keypoints_2d, 21), face: pts(p.face_keypoints_2d, 70)
  }));
  return { people: people.filter((p) => p.body.some(Boolean)), width: W, height: H };
}

// OpenPose's 18 body points and colours (controlnet_aux util.py).
const LIMBS: [number, number][] = [[1, 2], [1, 5], [2, 3], [3, 4], [5, 6], [6, 7], [1, 8], [8, 9], [9, 10], [1, 11], [11, 12], [12, 13], [1, 0], [0, 14], [14, 16], [0, 15], [15, 17]];
const COLORS: number[][] = [[255, 0, 0], [255, 85, 0], [255, 170, 0], [255, 255, 0], [170, 255, 0], [85, 255, 0], [0, 255, 0],
  [0, 255, 85], [0, 255, 170], [0, 255, 255], [0, 170, 255], [0, 85, 255], [0, 0, 255], [85, 0, 255], [170, 0, 255], [255, 0, 255], [255, 0, 170], [255, 0, 85]];
const HAND_EDGES: [number, number][] = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [0, 9], [9, 10], [10, 11], [11, 12], [0, 13], [13, 14], [14, 15], [15, 16], [0, 17], [17, 18], [18, 19], [19, 20]];
const rgb = (c: number[], k = 1): string => `rgb(${Math.round(c[0] * k)},${Math.round(c[1] * k)},${Math.round(c[2] * k)})`;
function hsv(h: number): number[] {
  const i = Math.floor(h * 6); const f = h * 6 - i; const q = 1 - f;
  return [[1, f, 0], [q, 1, 0], [0, 1, f], [0, q, 1], [f, 0, 1], [1, 0, q]][i % 6].map((v) => v * 255);
}

function drawPose(ctx: CanvasRenderingContext2D, people: Person[], W: number, H: number): void {
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
    if (person.face) for (const p of person.face) if (p) dot(p, 3, 'rgb(255,255,255)');
  }
}

// The pose frame as PNG bytes: black background, no underlay.
async function poseFrameBytes(people: Person[], W: number, H: number): Promise<Uint8Array> {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
  drawPose(ctx, people, W, H);
  const blob = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/png'));
  if (!blob) throw new Error('Could not draw the pose frame.');
  return new Uint8Array(await blob.arrayBuffer());
}

export interface ExtractedPose { people: Person[]; width: number; height: number; }

// Runs DWPose on `bytes` (with the whole-image retry). `run` = the shell's
// WD14 tagging transport. null = no pose found.
export async function extractPose(
  run: (prompt: Prompt, imageName: string, bytes: Uint8Array) => Promise<string>,
  imageName: string, bytes: Uint8Array, log: (msg: string) => void
): Promise<ExtractedPose | null> {
  let r = parseOpenposeJson(await run(buildPoseExtractPrompt(imageName), imageName, bytes));
  if (!r.people.length) {
    log(`Extract pose: the person detector found nobody in ${imageName}; trying the whole image as one person.`);
    r = parseOpenposeJson(await run(buildPoseExtractPrompt(imageName, true), imageName, bytes));
  }
  if (!r.people.length) return null;
  return { people: r.people, width: Math.round(r.width), height: Math.round(r.height) };
}

// ---- editor ----

const MIRROR_PAIRS: [number, number][] = [[2, 5], [3, 6], [4, 7], [8, 11], [9, 12], [10, 13], [14, 15], [16, 17]];
const HEAD_POINTS = [14, 15, 16, 17];
const clonePeople = (people: Person[]): Person[] => JSON.parse(JSON.stringify(people));
const ptsOf = (l: Pts | null): Pt[] => (l || []).filter((q): q is Pt => !!q);
const allPoints = (p: Person): Pt[] => [...ptsOf(p.body), ...ptsOf(p.lhand), ...ptsOf(p.rhand), ...ptsOf(p.face)];

export interface PoseEditor {
  // Shows the editor with an extracted pose over its original image.
  show: (pose: ExtractedPose, original: Uint8Array) => void;
  hide: () => void;
  // Resolves once the last edit's frame has reached onChange.
  flush: () => Promise<void>;
}

// The reference image's pose editor: drag points, Mirror, Reset, and
// "Display original reference" (the original, dimmed, behind the pose — only
// in the editor, never in the frame). Each edit re-renders the frame and
// hands it to `onChange`, which makes it the reference.
export function mountPoseEditor(host: HTMLElement, onChange: (bytes: Uint8Array) => void): PoseEditor {
  const touch = typeof matchMedia === 'function' && matchMedia('(hover: none)').matches;
  host.classList.add('pose-editor');
  host.hidden = true;
  const canvas = document.createElement('canvas');
  canvas.className = 'pose-editor-canvas';
  const row = document.createElement('div');
  row.className = 'pose-editor-row';
  const mirrorBtn = document.createElement('button');
  mirrorBtn.type = 'button';
  mirrorBtn.textContent = 'Mirror';
  mirrorBtn.title = 'Flip the pose left to right';
  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.textContent = 'Reset';
  resetBtn.title = 'Back to the pose as it was extracted';
  const showLabel = document.createElement('label');
  showLabel.className = 'chk-row';
  showLabel.title = 'Show the original reference, dimmed, behind the pose (only here; it is not sent)';
  const showOriginal = document.createElement('input');
  showOriginal.type = 'checkbox';
  showOriginal.id = 'poseShowOriginal';
  showLabel.append(showOriginal, ' Display original reference');
  row.append(mirrorBtn, resetBtn, showLabel);
  const hint = document.createElement('div');
  hint.className = 'muted small';
  hint.textContent = 'Drag a point to move it. A wrist moves its hand, the nose moves the head. Shift-drag moves the whole person.';
  host.append(canvas, row, hint);

  let extracted: ExtractedPose | null = null;
  let people: Person[] = [];
  let W = 1, H = 1;
  let mirrored = false;
  let original: HTMLImageElement | null = null;
  let originalUrl = '';

  function render(): void {
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    if (original && showOriginal.checked && original.complete) {
      // Mirrored with the pose, so the two stay lined up.
      ctx.save();
      ctx.globalAlpha = 0.4;
      if (mirrored) { ctx.translate(W, 0); ctx.scale(-1, 1); }
      ctx.drawImage(original, 0, 0, W, H);
      ctx.restore();
    }
    drawPose(ctx, people, W, H);
  }
  // Renders run one after another (the latest edit lands last); flush()
  // lets Generate wait for the one in flight, or it could send the frame
  // from before the last edit.
  let committing: Promise<void> = Promise.resolve();
  function commit(): Promise<void> {
    committing = committing.then(async () => { onChange(await poseFrameBytes(people, W, H)); }).catch(() => undefined);
    return committing;
  }

  // ---- dragging ----
  type Hit = { person: number; list: Pts; index: number; carry: Pt[] };
  let drag: { hit: Hit; whole: boolean; last: Pt } | null = null;
  const toPose = (e: PointerEvent): Pt => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };
  function hitTest(p: Pt): Hit | null {
    const r = canvas.getBoundingClientRect();
    const radius = touch ? 22 : 12;
    let best: Hit | null = null;
    let bestD = Infinity;
    people.forEach((pp, person) => {
      for (const [list, bias] of [[pp.body, 0.6], [pp.lhand, 1], [pp.rhand, 1], [pp.face, 1]] as [Pts | null, number][]) {
        if (!list) continue;
        list.forEach((q, index) => {
          if (!q) return;
          // Body points win against the dense hand/face points around them.
          const d = Math.hypot((q.x - p.x) * r.width, (q.y - p.y) * r.height);
          if (d < radius && d * bias < bestD) { bestD = d * bias; best = { person, list, index, carry: [] }; }
        });
      }
    });
    if (best) {
      const h = best as Hit;
      const pp = people[h.person];
      // A wrist carries the hand nearest it; the nose carries eyes, ears, face.
      if (h.list === pp.body && (h.index === 4 || h.index === 7)) {
        const w = pp.body[h.index]!;
        const near = (hand: Pts | null) => (hand && hand[0] ? Math.hypot(hand[0].x - w.x, hand[0].y - w.y) : Infinity);
        const hand = near(pp.lhand) <= near(pp.rhand) ? pp.lhand : pp.rhand;
        if (near(hand) < 0.15) h.carry = ptsOf(hand);
      } else if (h.list === pp.body && h.index === 0) {
        h.carry = [...HEAD_POINTS.map((i) => pp.body[i]).filter((q): q is Pt => !!q), ...ptsOf(pp.face)];
      }
    }
    return best;
  }
  canvas.addEventListener('pointerdown', (e) => {
    const p = toPose(e);
    const hit = hitTest(p);
    if (!hit) return;
    e.preventDefault();
    drag = { hit, whole: e.shiftKey, last: p };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = toPose(e);
    if (!drag) { canvas.style.cursor = hitTest(p) ? 'pointer' : 'default'; return; }
    const dx = p.x - drag.last.x, dy = p.y - drag.last.y;
    drag.last = p;
    const { hit } = drag;
    const moved = drag.whole ? allPoints(people[hit.person]) : [hit.list[hit.index]!, ...hit.carry];
    for (const q of moved) { q.x += dx; q.y += dy; }
    render();
  });
  const endDrag = () => { if (drag) { drag = null; void commit(); } };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  mirrorBtn.addEventListener('click', () => {
    for (const pp of people) {
      for (const q of allPoints(pp)) q.x = 1 - q.x;
      for (const [a, b] of MIRROR_PAIRS) [pp.body[a], pp.body[b]] = [pp.body[b], pp.body[a]];
      [pp.lhand, pp.rhand] = [pp.rhand, pp.lhand];
    }
    mirrored = !mirrored;
    render();
    void commit();
  });
  resetBtn.addEventListener('click', () => {
    if (!extracted) return;
    people = clonePeople(extracted.people);
    mirrored = false;
    render();
    void commit();
  });
  showOriginal.addEventListener('change', render);

  return {
    show(pose: ExtractedPose, originalBytes: Uint8Array): void {
      extracted = pose;
      people = clonePeople(pose.people);
      W = pose.width; H = pose.height;
      canvas.width = W; canvas.height = H;
      mirrored = false;
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      originalUrl = URL.createObjectURL(new Blob([originalBytes as BlobPart]));
      original = new Image();
      original.onload = render;
      original.src = originalUrl;
      host.hidden = false;
      render();
      void commit();
    },
    hide(): void {
      host.hidden = true;
      extracted = null;
      people = [];
    },
    flush: () => committing
  };
}
