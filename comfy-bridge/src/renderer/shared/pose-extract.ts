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

async function drawPoseFrame(people: Person[], W: number, H: number): Promise<Uint8Array> {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);
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
  const blob = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/png'));
  if (!blob) throw new Error('Could not draw the pose frame.');
  return new Uint8Array(await blob.arrayBuffer());
}

// Runs DWPose on `bytes` (with the whole-image retry) and returns the pose
// frame at the image's own size. `run` = the shell's WD14 tagging transport.
export async function extractPoseFrame(
  run: (prompt: Prompt, imageName: string, bytes: Uint8Array) => Promise<string>,
  imageName: string, bytes: Uint8Array, log: (msg: string) => void
): Promise<{ bytes: Uint8Array; people: number } | null> {
  let r = parseOpenposeJson(await run(buildPoseExtractPrompt(imageName), imageName, bytes));
  if (!r.people.length) {
    log(`Extract pose: the person detector found nobody in ${imageName}; trying the whole image as one person.`);
    r = parseOpenposeJson(await run(buildPoseExtractPrompt(imageName, true), imageName, bytes));
  }
  if (!r.people.length) return null;
  return { bytes: await drawPoseFrame(r.people, Math.round(r.width), Math.round(r.height)), people: r.people.length };
}
