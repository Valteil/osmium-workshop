// The pose editor (both shells): the ControlNet tab's canvas. Every edit is
// rendered to a frame and handed to `onChange`, which makes it the Generate
// tab's reference image (Anima LLLite).
//
// Two styles: the OpenPose skeleton (./pose-extract.ts, for pose models) and
// the mannequin (default). Anima's any-test LLLite reads the reference as a
// picture, not as OpenPose's colour code, so the mannequin draws the keypoints
// as a body: tapered limbs, a torso with optional chest curves, a head with
// eye marks, hands with fingers, feet; grey with an outline on white.
//
// The mannequin is built from parts (head, torso, each forearm, …). Each part
// knows how to draw itself and how far a point is from it, so clicking a part
// selects it and its size (for perspective) can be set with the slider or the
// mouse wheel. Sizes live on the person (`Person.sizes`).
import { drawPose, COLORS, rgb, type Person, type Pt, type Pts, type ExtractedPose } from './pose-extract';

export type PoseStyle = 'mannequin' | 'skeleton';
// Chest curves: `size` 0 (flat, none drawn) – 1; `length` 0 – 1 stretches
// them downward, and the longer they are the more they hang toward the
// image's bottom (gravity), so they read right on a figure leaning forward.
export interface ChestShape { size: number; length: number; }
interface FrameLook { style: PoseStyle; build: number; chest: ChestShape; }

type P2 = { x: number; y: number };
const mid2 = (a: P2, b: P2): P2 => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const dist2 = (a: P2, b: P2): number => Math.hypot(a.x - b.x, a.y - b.y);
const lerp2 = (a: P2, b: P2, t: number): P2 => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const unit2 = (a: P2, b: P2): P2 => { const d = dist2(a, b) || 1; return { x: (b.x - a.x) / d, y: (b.y - a.y) / d }; };

const SKIN = '#cdc8c2';
const EDGE = '#45423f';
const PICK = '#e39a2d'; // the selected part's outline (editor only)

export type PartId = 'head' | 'neck' | 'torso' | 'chestR' | 'chestL'
  | 'upperArmR' | 'foreArmR' | 'handR' | 'upperArmL' | 'foreArmL' | 'handL'
  | 'thighR' | 'calfR' | 'footR' | 'thighL' | 'calfL' | 'footL';
// "Right"/"left" are the person's own (OpenPose's).
const PART_LABELS: Record<PartId, string> = {
  head: 'Head', neck: 'Neck', torso: 'Torso', chestR: 'Right breast', chestL: 'Left breast',
  upperArmR: 'Right upper arm', foreArmR: 'Right forearm', handR: 'Right hand',
  upperArmL: 'Left upper arm', foreArmL: 'Left forearm', handL: 'Left hand',
  thighR: 'Right thigh', calfR: 'Right calf', footR: 'Right foot',
  thighL: 'Left thigh', calfL: 'Left calf', footL: 'Left foot'
};
const SIZE_MIN = 0.3, SIZE_MAX = 3;

// ---- geometry ----

// The torso length in pixels, the unit everything else is sized by.
function bodyScale(b: (P2 | null)[], H: number): number {
  const hip = b[8] && b[11] ? mid2(b[8], b[11]) : (b[8] || b[11]);
  if (b[1] && hip) return dist2(b[1], hip);
  if (b[2] && b[5]) return dist2(b[2], b[5]) * 1.3;
  return H * 0.27;
}

function capsulePath(ctx: CanvasRenderingContext2D, a: P2, b: P2, ra: number, rb: number): void {
  const t = Math.atan2(b.y - a.y, b.x - a.x);
  const h = Math.PI / 2;
  ctx.moveTo(a.x + ra * Math.cos(t + h), a.y + ra * Math.sin(t + h));
  ctx.arc(a.x, a.y, ra, t + h, t + 3 * h);
  ctx.lineTo(b.x + rb * Math.cos(t - h), b.y + rb * Math.sin(t - h));
  ctx.arc(b.x, b.y, rb, t - h, t + h);
  ctx.closePath();
}

// One drawable piece of a part. `hit` = how far (px) a point is outside it
// (≤ 0 inside). `outline` strokes something other than the fill's own edge
// (the chest's lower curve only). `fill`/`noStroke` for the eye marks.
interface Shape {
  path: (ctx: CanvasRenderingContext2D) => void;
  hit: (p: P2) => number;
  outline?: (ctx: CanvasRenderingContext2D) => void;
  fill?: string; noStroke?: boolean;
}
interface Part { id: PartId; shapes: Shape[]; }

function segHit(p: P2, a: P2, b: P2, ra: number, rb: number): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return dist2(p, { x: a.x + dx * t, y: a.y + dy * t }) - (ra + (rb - ra) * t);
}
const capsule = (a: P2, b: P2, ra: number, rb: number): Shape => ({
  path: (ctx) => capsulePath(ctx, a, b, ra, rb), hit: (p) => segHit(p, a, b, ra, rb)
});
function ellipse(c: P2, rx: number, ry: number, rot: number): Shape {
  return {
    path: (ctx) => ctx.ellipse(c.x, c.y, rx, ry, rot, 0, Math.PI * 2),
    hit: (p) => {
      const cs = Math.cos(-rot), sn = Math.sin(-rot);
      const lx = (p.x - c.x) * cs - (p.y - c.y) * sn, ly = (p.x - c.x) * sn + (p.y - c.y) * cs;
      return (Math.hypot(lx / rx, ly / ry) - 1) * Math.min(rx, ry);
    }
  };
}
function polyHit(p: P2, pts: P2[]): number {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++){
    const a = pts[i], b = pts[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y || 1e-9) + a.x) inside = !inside;
  }
  if (inside) return -1;
  let best = Infinity;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) best = Math.min(best, segHit(p, pts[i], pts[j], 0, 0));
  return best;
}

const FINGERS = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]];

// A person's mannequin as parts, in paint order (later = on top).
function mannequinParts(person: Person, W: number, H: number, look: FrameLook): Part[] {
  const px = (p: Pt | null): P2 | null => (p ? { x: p.x * W, y: p.y * H } : null);
  const b = person.body.map(px);
  const k = bodyScale(b, H) * look.build;
  const s = (id: PartId): number => (person.sizes && person.sizes[id]) || 1;
  const parts: Part[] = [];
  const add = (id: PartId, shapes: (Shape | null)[]): void => {
    const real = shapes.filter((x): x is Shape => !!x);
    if (real.length) parts.push({ id, shapes: real });
  };
  const limb = (i: number, j: number, ra: number, rb: number, id: PartId): Shape | null => {
    const p = b[i], q = b[j];
    return p && q ? capsule(p, q, ra * k * s(id), rb * k * s(id)) : null;
  };
  const hips = b[8] && b[11] ? mid2(b[8], b[11]) : (b[8] || b[11]);
  const centre = b[1] && hips ? mid2(b[1], hips) : (b[1] || hips);

  // Feet (under the calves): an oval past the ankle, toes away from the midline.
  for (const [ankle, id] of [[10, 'footR'], [13, 'footL']] as [number, PartId][]){
    const a = b[ankle];
    if (!a) continue;
    const side = centre ? Math.sign(a.x - centre.x) || 1 : 1;
    const f = s(id);
    add(id, [ellipse({ x: a.x + side * 0.06 * k * f, y: a.y + 0.05 * k * f }, 0.1 * k * f, 0.045 * k * f, 0)]);
  }
  add('thighR', [limb(8, 9, 0.12, 0.08, 'thighR')]); add('calfR', [limb(9, 10, 0.08, 0.05, 'calfR')]);
  add('thighL', [limb(11, 12, 0.12, 0.08, 'thighL')]); add('calfL', [limb(12, 13, 0.08, 0.05, 'calfL')]);

  // Torso: shoulders → narrower waist → hips, rounded.
  const rs = b[2], ls = b[5], rh = b[8], lh = b[11];
  if (rs && ls && rh && lh){
    const t = s('torso');
    const sv = unit2(rs, ls), hv = unit2(rh, lh);
    const rsO = { x: rs.x - sv.x * 0.05 * k * t, y: rs.y - sv.y * 0.05 * k * t };
    const lsO = { x: ls.x + sv.x * 0.05 * k * t, y: ls.y + sv.y * 0.05 * k * t };
    const rhO = { x: rh.x - hv.x * 0.09 * k * t, y: rh.y - hv.y * 0.09 * k * t };
    const lhO = { x: lh.x + hv.x * 0.09 * k * t, y: lh.y + hv.y * 0.09 * k * t };
    const c = mid2(mid2(rsO, lsO), mid2(rhO, lhO));
    const waist = (sh: P2, hp: P2): P2 => lerp2(lerp2(sh, hp, 0.6), c, 0.2 / t);
    const rw = waist(rsO, rhO), lw = waist(lsO, lhO);
    const top = mid2(rsO, lsO), bottom = mid2(lhO, rhO);
    add('torso', [{
      path: (ctx) => {
        ctx.moveTo(top.x, top.y);
        ctx.quadraticCurveTo(lsO.x, lsO.y - 0.04 * k, lsO.x, lsO.y + 0.05 * k);
        ctx.quadraticCurveTo(lw.x, lw.y, lhO.x, lhO.y);
        ctx.quadraticCurveTo(bottom.x, bottom.y + 0.1 * k, rhO.x, rhO.y);
        ctx.quadraticCurveTo(rw.x, rw.y, rsO.x, rsO.y + 0.05 * k);
        ctx.quadraticCurveTo(rsO.x, rsO.y - 0.04 * k, top.x, top.y);
        ctx.closePath();
      },
      hit: (p) => polyHit(p, [rsO, lsO, lw, lhO, rhO, rw])
    }]);
    // Chest curves on the chest line; only the lower curve is outlined, so
    // they blend into the torso.
    if (look.chest.size > 0){
      const sm = mid2(rs, ls), hm = mid2(rh, lh);
      const down = unit2(sm, hm);
      const span = dist2(rs, ls);
      const line = lerp2(sm, hm, 0.27);
      const len = Math.min(1, Math.max(0, look.chest.length));
      const g = 0.3 + 0.7 * len;
      const dir = { x: down.x * (1 - g), y: down.y * (1 - g) + g };
      const ang = Math.atan2(dir.y, dir.x) - Math.PI / 2;
      for (const [side, id] of [[-1, 'chestR'], [1, 'chestL']] as [number, PartId][]){
        const r = k * (0.07 + 0.16 * look.chest.size) * s(id);
        const B = r * (0.6 + 1.4 * len);
        const cc = { x: line.x + sv.x * side * span * 0.25, y: line.y + sv.y * side * span * 0.25 };
        const local = (ctx: CanvasRenderingContext2D, body: () => void): void => {
          ctx.save(); ctx.translate(cc.x, cc.y); ctx.rotate(ang); body(); ctx.restore();
        };
        add(id, [{
          path: (ctx) => local(ctx, () => {
            ctx.moveTo(-0.8 * r, -0.4 * r);
            ctx.bezierCurveTo(-1.05 * r, 0.25 * r + 0.3 * B, -0.7 * r, B, 0, B);
            ctx.bezierCurveTo(0.7 * r, B, 1.05 * r, 0.25 * r + 0.3 * B, 0.8 * r, -0.4 * r);
            ctx.quadraticCurveTo(0, -0.75 * r, -0.8 * r, -0.4 * r);
            ctx.closePath();
          }),
          outline: (ctx) => local(ctx, () => {
            ctx.moveTo(-0.95 * r, 0.05 * r);
            ctx.bezierCurveTo(-1.02 * r, 0.25 * r + 0.3 * B, -0.7 * r, B, 0, B);
            ctx.bezierCurveTo(0.7 * r, B, 1.02 * r, 0.25 * r + 0.3 * B, 0.95 * r, 0.05 * r);
          }),
          hit: ellipse({ x: cc.x + Math.cos(ang + Math.PI / 2) * B * 0.3, y: cc.y + Math.sin(ang + Math.PI / 2) * B * 0.3 }, r, (B + 0.6 * r) / 2, ang).hit
        }]);
      }
    }
  } else if (b[1] && hips){
    add('torso', [capsule(b[1], hips, 0.16 * k * s('torso'), 0.14 * k * s('torso'))]);
  }

  // Neck and head: the head from the ears or eyes when there, else above the
  // nose; tilted with the neck. Eye marks show where it faces.
  const nose = b[0], neck = b[1];
  const ears = b[16] && b[17] ? mid2(b[16], b[17]) : null;
  const eyes = b[14] && b[15] ? mid2(b[14], b[15]) : (b[14] || b[15]);
  const head: P2 | null = ears || (eyes && nose ? lerp2(nose, eyes, 1.6) : null)
    || (nose && neck ? lerp2(neck, nose, 1.1) : nose);
  if (head && neck){
    add('neck', [capsule(neck, lerp2(neck, head, 0.55), 0.075 * k * s('neck'), 0.065 * k * s('neck'))]);
  }
  if (head){
    const tilt = neck ? Math.atan2(head.y - neck.y, head.x - neck.x) + Math.PI / 2 : 0;
    const f = s('head');
    const eyeShapes: Shape[] = [b[14], b[15]].filter((e): e is P2 => !!e).map((e) => ({
      ...ellipse(e, 0.028 * k * f, 0.018 * k * f, tilt), hit: () => Infinity, fill: EDGE, noStroke: true
    }));
    add('head', [ellipse(head, 0.19 * k * f, 0.24 * k * f, tilt), ...eyeShapes]);
  }

  // Arms over the torso, then hands: fingers, then the palm over their roots.
  add('upperArmR', [limb(2, 3, 0.075, 0.06, 'upperArmR')]); add('foreArmR', [limb(3, 4, 0.06, 0.045, 'foreArmR')]);
  add('upperArmL', [limb(5, 6, 0.075, 0.06, 'upperArmL')]); add('foreArmL', [limb(6, 7, 0.06, 0.045, 'foreArmL')]);
  for (const [hand, wristI, elbowI, id] of [[person.rhand, 4, 3, 'handR'], [person.lhand, 7, 6, 'handL']] as [Pts | null, number, number, PartId][]){
    const pts = hand ? hand.map(px) : null;
    const f = s(id);
    if (pts && pts[0] && pts.filter(Boolean).length >= 6){
      const shapes: Shape[] = [];
      for (const fg of FINGERS){
        const r = (fg[0] === 1 ? 0.024 : 0.019) * k * f;
        for (let i = 0; i < 3; i++){
          const p = pts[fg[i]], q = pts[fg[i + 1]];
          if (p && q) shapes.push(capsule(p, q, r, r * 0.92));
        }
      }
      const palm = [0, 1, 5, 9, 13, 17].map((i) => pts[i]).filter((p): p is P2 => !!p);
      if (palm.length >= 3) shapes.push({
        path: (ctx) => { ctx.moveTo(palm[0].x, palm[0].y); for (const p of palm.slice(1)) ctx.lineTo(p.x, p.y); ctx.closePath(); },
        hit: (p) => polyHit(p, palm)
      });
      add(id, shapes);
    } else {
      // No hand points: a mitten along the forearm.
      const w = b[wristI], e = b[elbowI];
      if (!w) continue;
      const d = e ? unit2(e, w) : { x: 0, y: 1 };
      add(id, [ellipse({ x: w.x + d.x * 0.09 * k * f, y: w.y + d.y * 0.09 * k * f }, 0.1 * k * f, 0.06 * k * f, Math.atan2(d.y, d.x))]);
    }
  }
  return parts;
}

function paintParts(ctx: CanvasRenderingContext2D, parts: Part[], lw: number): void {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const part of parts) for (const sh of part.shapes){
    ctx.beginPath(); sh.path(ctx);
    ctx.fillStyle = sh.fill || SKIN; ctx.fill();
    if (sh.noStroke) continue;
    ctx.strokeStyle = EDGE; ctx.lineWidth = lw;
    if (sh.outline){ ctx.beginPath(); sh.outline(ctx); }
    ctx.stroke();
  }
}

const lineWidthFor = (person: Person, W: number, H: number): number =>
  Math.max(1.5, bodyScale(person.body.map((p) => (p ? { x: p.x * W, y: p.y * H } : null)), H) * 0.012);

function drawFrame(ctx: CanvasRenderingContext2D, people: Person[], W: number, H: number, look: FrameLook): void {
  if (look.style === 'skeleton'){ drawPose(ctx, people, W, H); return; }
  for (const person of people) paintParts(ctx, mannequinParts(person, W, H, look), lineWidthFor(person, W, H));
}

// The frame as PNG bytes, no underlay: the skeleton on black (as OpenPose
// draws it), the mannequin on white.
async function frameBytes(people: Person[], W: number, H: number, look: FrameLook): Promise<Uint8Array> {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = look.style === 'skeleton' ? '#000' : '#fff';
  ctx.fillRect(0, 0, W, H);
  drawFrame(ctx, people, W, H, look);
  const blob = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/png'));
  if (!blob) throw new Error('Could not draw the pose frame.');
  return new Uint8Array(await blob.arrayBuffer());
}

// ---- new people ----

// A relaxed open hand at the wrist, along the forearm, thumb toward the body's
// midline: 21 OpenPose hand points (normalized), so a figure made from
// scratch has fingers to pose.
function defaultHand(wrist: Pt, elbow: Pt, toward: Pt, W: number, H: number, L: number): Pts {
  const w = { x: wrist.x * W, y: wrist.y * H };
  const e = { x: elbow.x * W, y: elbow.y * H };
  const c = { x: toward.x * W, y: toward.y * H };
  const d = unit2(e, w);
  let p = { x: -d.y, y: d.x };
  if ((c.x - w.x) * p.x + (c.y - w.y) * p.y < 0) p = { x: -p.x, y: -p.y };
  const hl = 0.32 * L;
  const at = (along: number, side: number): Pt => ({ x: (w.x + d.x * along * hl + p.x * side * hl) / W, y: (w.y + d.y * along * hl + p.y * side * hl) / H });
  const out: Pts = [at(0, 0), at(0.12, 0.18), at(0.28, 0.3), at(0.42, 0.38), at(0.55, 0.44)];
  [0.15, 0.05, -0.05, -0.15].forEach((o, j) => {
    const len = j === 3 ? 0.8 : 1;
    let along = 0.45;
    out.push(at(along, o));
    for (const seg of [0.2, 0.14, 0.11]){ along += seg * len; out.push(at(along, o * 1.25)); }
  });
  return out;
}

// A standing figure with hands, centred at `cx` (0–1). Laid out in units of
// the canvas height so it keeps its proportions on any canvas shape.
function templatePerson(W: number, H: number, cx: number): Person {
  const u = H / W;
  const P = (dx: number, y: number): Pt => ({ x: cx + dx * u, y });
  const body = [P(0, 0.15), P(0, 0.24), P(-0.08, 0.24), P(-0.11, 0.37), P(-0.12, 0.49), P(0.08, 0.24), P(0.11, 0.37), P(0.12, 0.49),
    P(-0.05, 0.51), P(-0.055, 0.69), P(-0.06, 0.87), P(0.05, 0.51), P(0.055, 0.69), P(0.06, 0.87),
    P(-0.018, 0.135), P(0.018, 0.135), P(-0.04, 0.145), P(0.04, 0.145)];
  const L = bodyScale(body.map((p) => ({ x: p.x * W, y: p.y * H })), H);
  const midline = P(0, 0.4);
  return { body, rhand: defaultHand(body[4], body[3], midline, W, H, L), lhand: defaultHand(body[7], body[6], midline, W, H, L), face: null };
}

// A pose with one standing person, for posing without a reference image.
export function newPose(width: number, height: number): ExtractedPose {
  const W = Math.max(64, Math.round(width) || 1024);
  const H = Math.max(64, Math.round(height) || 1024);
  return { people: [templatePerson(W, H, 0.5)], width: W, height: H };
}

// ---- editor ----

const MIRROR_PAIRS: [number, number][] = [[2, 5], [3, 6], [4, 7], [8, 11], [9, 12], [10, 13], [14, 15], [16, 17]];
const HEAD_POINTS = [14, 15, 16, 17];
// What a dragged body point carries with it ("Move attached parts"): the
// rest of the limb below it. 'hand' = the hand nearest the limb's wrist.
const BODY_CHILDREN: Record<number, (number | 'hand')[]> = {
  2: [3, 4, 'hand'], 3: [4, 'hand'], 5: [6, 7, 'hand'], 6: [7, 'hand'],
  8: [9, 10], 9: [10], 11: [12, 13], 12: [13], 1: [0, 14, 15, 16, 17]
};
const WRIST_OF: Record<number, number> = { 2: 4, 3: 4, 4: 4, 5: 7, 6: 7, 7: 7 };
const clonePeople = (people: Person[]): Person[] => JSON.parse(JSON.stringify(people));
const ptsOf = (l: Pts | null): Pt[] => (l || []).filter((q): q is Pt => !!q);
const allPoints = (p: Person): Pt[] => [...ptsOf(p.body), ...ptsOf(p.lhand), ...ptsOf(p.rhand), ...ptsOf(p.face)];
const swapRL = (id: string): string => id.endsWith('R') ? id.slice(0, -1) + 'L' : id.endsWith('L') ? id.slice(0, -1) + 'R' : id;

export interface PoseEditor {
  show: (pose: ExtractedPose, original: Uint8Array | null) => void;
  hasPose: () => boolean;
  // Resolves once the last edit's frame has reached onChange.
  flush: () => Promise<void>;
}

const store = {
  get: (k: string): string | null => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string): void => { try { localStorage.setItem(k, v); } catch { /* best effort */ } }
};

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}
function btn(text: string, title: string): HTMLButtonElement {
  const b = el('button', undefined, text); b.type = 'button'; b.title = title; return b;
}

function mountPoseEditor(host: HTMLElement, onChange: (bytes: Uint8Array) => void): PoseEditor {
  const touch = typeof matchMedia === 'function' && matchMedia('(hover: none)').matches;
  host.classList.add('pose-editor');
  const stage = el('div', 'pose-editor-stage');
  const canvas = el('canvas', 'pose-editor-canvas');
  const hint = el('div', 'muted small', 'Drag a point to move it (with what hangs off it). Drag the torso to move the whole person. Click a body part to select it; the mouse wheel over a part resizes it.');
  stage.append(canvas, hint);
  const side = el('div', 'pose-editor-side');
  host.append(stage, side);
  const section = (title: string): HTMLElement => { const s = el('div', 'pose-editor-sec'); s.appendChild(el('div', 'pose-editor-sec-head', title)); side.appendChild(s); return s; };
  const row = (parent: HTMLElement): HTMLElement => { const r = el('div', 'pose-editor-row'); parent.appendChild(r); return r; };
  const check = (parent: HTMLElement, text: string, title: string, id: string, key: string | null, def: boolean): HTMLInputElement => {
    const l = el('label', 'chk-row'); l.title = title;
    const c = el('input'); c.type = 'checkbox'; c.id = id;
    c.checked = key ? (store.get(key) ?? (def ? '1' : '0')) === '1' : def;
    if (key) c.addEventListener('change', () => store.set(key, c.checked ? '1' : '0'));
    l.append(c, ' ' + text); parent.appendChild(l);
    return c;
  };
  const slider = (parent: HTMLElement, text: string, title: string, id: string, min: number, max: number, step: number, key: string | null, def: number): HTMLInputElement => {
    const l = el('label', 'pose-editor-field'); l.title = title;
    const r = el('input'); r.type = 'range'; r.min = String(min); r.max = String(max); r.step = String(step); r.id = id;
    const saved = key ? parseInt(store.get(key) || '', 10) : NaN;
    r.value = String(Number.isFinite(saved) ? Math.min(max, Math.max(min, saved)) : def);
    if (key) r.addEventListener('change', () => store.set(key, r.value));
    l.append(text + ' ', r); parent.appendChild(l);
    return r;
  };

  // People
  const secPeople = section('People');
  const peopleRow = row(secPeople);
  const addBtn = btn('+ Person', 'Add a standing person to the pose');
  const removeBtn = btn('Remove person', 'Remove the person you last touched');
  const mirrorBtn = btn('Mirror', 'Flip the pose left to right');
  const resetBtn = btn('Reset', 'Back to the pose as it started (extracted or new)');
  peopleRow.append(addBtn, removeBtn, mirrorBtn, resetBtn);
  const optRow = row(secPeople);
  const attached = check(optRow, 'Move attached parts', 'Dragging a shoulder, elbow, hip, knee or finger joint moves what hangs off it too', 'poseAttached', 'comfybridge-pose-attached', true);
  const showOriginal = check(optRow, 'Display original reference', 'Show the original reference, dimmed, behind the pose (only here; it is not sent)', 'poseShowOriginal', null, false);
  const showLabel = showOriginal.parentElement as HTMLElement;

  // Look
  const secLook = section('Look');
  const lookRow = row(secLook);
  const styleLabel = el('label', 'pose-editor-field');
  styleLabel.title = 'Mannequin: a solid figure (limbs, hands with fingers, head), which Anima\'s any-test LLLite reads as a picture. OpenPose skeleton: the coloured stick figure pose ControlNets are trained on.';
  const styleSel = el('select'); styleSel.id = 'poseStyle';
  for (const [v, t] of [['mannequin', 'Mannequin'], ['skeleton', 'OpenPose skeleton']]){ const o = el('option', undefined, t); o.value = v; styleSel.appendChild(o); }
  styleSel.value = store.get('comfybridge-pose-style') === 'skeleton' ? 'skeleton' : 'mannequin';
  styleLabel.append('Style ', styleSel); lookRow.appendChild(styleLabel);
  const buildIn = slider(lookRow, 'Body width', 'How thick the whole mannequin is drawn', 'poseBuild', 60, 160, 5, 'comfybridge-pose-build', 100);
  const chestRow = row(secLook);
  const chestIn = slider(chestRow, 'Chest', 'Breast size on the mannequin (0 = flat, none drawn)', 'poseChest', 0, 100, 5, 'comfybridge-pose-chest', 0);
  const lengthIn = slider(chestRow, 'Length', 'How far the breasts hang; longer ones follow gravity, so they hang down on a figure leaning forward', 'poseChestLength', 0, 100, 5, 'comfybridge-pose-chest-length', 30);

  // Selected part
  const secPart = section('Selected part');
  const partName = el('div', 'pose-editor-part-name muted', 'Click a body part to select it.');
  secPart.appendChild(partName);
  const partRow = row(secPart);
  const sizeIn = slider(partRow, 'Size', 'This part\'s size, for perspective (a near hand bigger, a far arm thinner). The mouse wheel over a part does the same.', 'posePartSize', 30, 300, 5, null, 100);
  const sizeVal = el('span', 'muted small', '100%');
  partRow.appendChild(sizeVal);
  const partBtns = row(secPart);
  const resetPartBtn = btn('Reset part', 'Back to 100% for this part');
  const resetSizesBtn = btn('Reset all sizes', 'Back to 100% for every part of this person');
  partBtns.append(resetPartBtn, resetSizesBtn);

  const style = (): PoseStyle => (styleSel.value === 'skeleton' ? 'skeleton' : 'mannequin');
  const look = (): FrameLook => ({
    style: style(), build: (parseInt(buildIn.value, 10) || 100) / 100,
    chest: { size: (parseInt(chestIn.value, 10) || 0) / 100, length: (parseInt(lengthIn.value, 10) || 0) / 100 }
  });

  let extracted: ExtractedPose | null = null;
  let people: Person[] = [];
  let W = 1, H = 1;
  let mirrored = false;
  let selectedPerson = 0;
  let pick: { person: number; part: PartId } | null = null;
  let original: HTMLImageElement | null = null;
  let originalUrl = '';

  function syncControls(): void {
    const sk = style() === 'skeleton';
    secPart.hidden = sk;
    for (const r of [buildIn, chestIn]) (r.parentElement as HTMLElement).hidden = sk;
    (lengthIn.parentElement as HTMLElement).hidden = sk || chestIn.value === '0';
    const p = pick && people[pick.person];
    if (pick && p && !sk){
      const v = Math.round(((p.sizes && p.sizes[pick.part]) || 1) * 100);
      partName.textContent = PART_LABELS[pick.part] + (people.length > 1 ? ` (person ${pick.person + 1})` : '');
      partName.classList.remove('muted');
      sizeIn.disabled = false; resetPartBtn.disabled = false; resetSizesBtn.disabled = false;
      sizeIn.value = String(v); sizeVal.textContent = v + '%';
    } else {
      partName.textContent = 'Click a body part to select it.';
      partName.classList.add('muted');
      sizeIn.disabled = true; resetPartBtn.disabled = true; resetSizesBtn.disabled = !p;
      sizeVal.textContent = '';
    }
  }

  function render(): void {
    const ctx = canvas.getContext('2d')!;
    const st = style();
    ctx.fillStyle = st === 'skeleton' ? '#000' : '#fff';
    ctx.fillRect(0, 0, W, H);
    const under = !!(original && showOriginal.checked && original.complete);
    if (under){
      // Mirrored with the pose, so the two stay lined up.
      ctx.save(); ctx.globalAlpha = 0.4;
      if (mirrored){ ctx.translate(W, 0); ctx.scale(-1, 1); }
      ctx.drawImage(original!, 0, 0, W, H);
      ctx.restore();
    }
    ctx.save();
    if (under && st === 'mannequin') ctx.globalAlpha = 0.75; // let the original show through
    drawFrame(ctx, people, W, H, look());
    ctx.restore();
    if (st !== 'mannequin') return;
    // Editor-only marks: the selected part's outline and the draggable points
    // (the mannequin covers its joints).
    const p = pick && people[pick.person];
    if (p){
      const part = mannequinParts(p, W, H, look()).find((x) => x.id === pick!.part);
      if (part){
        ctx.save(); ctx.strokeStyle = PICK; ctx.lineWidth = lineWidthFor(p, W, H) * 2.4; ctx.lineJoin = 'round';
        for (const sh of part.shapes){ if (sh.noStroke) continue; ctx.beginPath(); sh.path(ctx); ctx.stroke(); }
        ctx.restore();
      }
    }
    const r = Math.max(2.5, W / 260);
    for (const pp of people){
      pp.body.forEach((q, i) => {
        if (!q) return;
        ctx.beginPath(); ctx.arc(q.x * W, q.y * H, r, 0, Math.PI * 2);
        ctx.fillStyle = rgb(COLORS[i]); ctx.fill();
        ctx.lineWidth = Math.max(1, r / 3); ctx.strokeStyle = '#fff'; ctx.stroke();
      });
      for (const hand of [pp.lhand, pp.rhand]) for (const q of hand || []){
        if (!q) continue;
        ctx.beginPath(); ctx.arc(q.x * W, q.y * H, r * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(40,90,220,0.85)'; ctx.fill();
      }
    }
  }

  // Renders run one after another (the latest edit lands last); flush() lets
  // Generate wait for the one in flight.
  let committing: Promise<void> = Promise.resolve();
  function commit(): Promise<void> {
    committing = committing.then(async () => { if (people.length || extracted) onChange(await frameBytes(people, W, H, look())); }).catch(() => undefined);
    return committing;
  }
  let commitTimer: ReturnType<typeof setTimeout> | null = null;
  const commitSoon = (): void => { if (commitTimer) clearTimeout(commitTimer); commitTimer = setTimeout(() => { commitTimer = null; void commit(); }, 250); };

  styleSel.addEventListener('change', () => { store.set('comfybridge-pose-style', style()); syncControls(); render(); void commit(); });
  for (const inp of [buildIn, chestIn, lengthIn]){
    inp.addEventListener('input', () => { syncControls(); render(); });
    inp.addEventListener('change', () => { void commit(); });
  }

  // ---- part sizes ----
  function setPartSize(pi: number, id: PartId, v: number): void {
    const p = people[pi];
    if (!p) return;
    v = Math.min(SIZE_MAX, Math.max(SIZE_MIN, v));
    const old = (p.sizes && p.sizes[id]) || 1;
    // A hand's size also spreads its points around the wrist, so the whole
    // hand (not just its fingers' thickness) grows or shrinks.
    if (id === 'handR' || id === 'handL'){
      const hand = id === 'handR' ? p.rhand : p.lhand;
      const w = hand && hand[0];
      if (hand && w){
        const f = v / old;
        for (const q of hand) if (q && q !== w){ q.x = w.x + (q.x - w.x) * f; q.y = w.y + (q.y - w.y) * f; }
      }
    }
    p.sizes = { ...(p.sizes || {}), [id]: v };
    if (Math.abs(v - 1) < 0.001) delete p.sizes[id];
  }
  sizeIn.addEventListener('input', () => {
    if (!pick) return;
    setPartSize(pick.person, pick.part, (parseInt(sizeIn.value, 10) || 100) / 100);
    sizeVal.textContent = sizeIn.value + '%';
    render();
  });
  sizeIn.addEventListener('change', () => { void commit(); });
  resetPartBtn.addEventListener('click', () => { if (!pick) return; setPartSize(pick.person, pick.part, 1); syncControls(); render(); void commit(); });
  resetSizesBtn.addEventListener('click', () => {
    const p = people[pick ? pick.person : selectedPerson];
    if (!p || !p.sizes) return;
    for (const id of Object.keys(p.sizes) as PartId[]) setPartSize(pick ? pick.person : selectedPerson, id, 1);
    syncControls(); render(); void commit();
  });

  // ---- pointer ----
  type Hit = { person: number; list: Pts; index: number; carry: Pt[] };
  let drag: { hit: Hit | null; person: number; whole: boolean; last: Pt } | null = null;
  const toPose = (e: { clientX: number; clientY: number }): Pt => {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };
  const nearHand = (pp: Person, wrist: Pt | null): Pts | null => {
    if (!wrist) return null;
    const d = (h: Pts | null) => (h && h[0] ? Math.hypot(h[0].x - wrist.x, h[0].y - wrist.y) : Infinity);
    const h = d(pp.lhand) <= d(pp.rhand) ? pp.lhand : pp.rhand;
    return d(h) < 0.15 ? h : null;
  };
  function carriedBy(pp: Person, list: Pts, index: number): Pt[] {
    const out: Pt[] = [];
    if (list === pp.body){
      // The nose always carries the head, the wrist its hand.
      if (index === 0) return [...HEAD_POINTS.map((i) => pp.body[i]).filter((q): q is Pt => !!q), ...ptsOf(pp.face)];
      if (index === 4 || index === 7) return ptsOf(nearHand(pp, pp.body[index]));
      if (!attached.checked) return out;
      for (const c of BODY_CHILDREN[index] || []){
        if (c === 'hand') out.push(...ptsOf(nearHand(pp, pp.body[WRIST_OF[index]])));
        else { const q = pp.body[c]; if (q) out.push(q); }
      }
      if (index === 1) out.push(...ptsOf(pp.face));
      return out;
    }
    if (list === pp.face) return out;
    // A hand: the wrist point carries the hand; a finger joint (attached on)
    // the rest of that finger.
    if (index === 0) return ptsOf(list).filter((q) => q !== list[0]);
    if (!attached.checked) return out;
    const fg = FINGERS.find((f) => f.includes(index));
    if (fg) for (const i of fg.slice(fg.indexOf(index) + 1)){ const q = list[i]; if (q) out.push(q); }
    return out;
  }
  function jointHit(p: Pt): Hit | null {
    const r = canvas.getBoundingClientRect();
    const radius = touch ? 22 : 10;
    const mannequin = style() === 'mannequin';
    let best: Hit | null = null;
    let bestD = Infinity;
    people.forEach((pp, person) => {
      // Face points aren't drawn on the mannequin, so they don't grab clicks there.
      for (const [list, bias] of [[pp.body, 0.6], [pp.lhand, 1], [pp.rhand, 1], [mannequin ? null : pp.face, 1]] as [Pts | null, number][]){
        if (!list) continue;
        list.forEach((q, index) => {
          if (!q) return;
          const d = Math.hypot((q.x - p.x) * r.width, (q.y - p.y) * r.height);
          if (d < radius && d * bias < bestD){ bestD = d * bias; best = { person, list, index, carry: [] }; }
        });
      }
    });
    if (best){ const h = best as Hit; h.carry = carriedBy(people[h.person], h.list, h.index); }
    return best;
  }
  function partHit(p: Pt): { person: number; part: PartId } | null {
    if (style() !== 'mannequin') return null;
    const r = canvas.getBoundingClientRect();
    const tol = 4 * (W / (r.width || W));
    const q = { x: p.x * W, y: p.y * H };
    for (let pi = people.length - 1; pi >= 0; pi--){
      const parts = mannequinParts(people[pi], W, H, look());
      for (let i = parts.length - 1; i >= 0; i--){
        if (parts[i].shapes.some((sh) => sh.hit(q) <= tol)) return { person: pi, part: parts[i].id };
      }
    }
    return null;
  }
  canvas.addEventListener('pointerdown', (e) => {
    const p = toPose(e);
    const hit = jointHit(p);
    if (hit){
      e.preventDefault();
      selectedPerson = hit.person;
      drag = { hit, person: hit.person, whole: e.shiftKey, last: p };
      canvas.setPointerCapture(e.pointerId);
      return;
    }
    const part = partHit(p);
    pick = part;
    if (part) selectedPerson = part.person;
    syncControls();
    render();
    // The torso (or Shift on any part) drags the whole person.
    if (part && (part.part === 'torso' || e.shiftKey)){
      e.preventDefault();
      drag = { hit: null, person: part.person, whole: true, last: p };
      canvas.setPointerCapture(e.pointerId);
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = toPose(e);
    if (!drag){ canvas.style.cursor = jointHit(p) ? 'pointer' : (partHit(p) ? 'pointer' : 'default'); return; }
    const dx = p.x - drag.last.x, dy = p.y - drag.last.y;
    drag.last = p;
    const moved = drag.whole || !drag.hit ? allPoints(people[drag.person]) : [drag.hit.list[drag.hit.index]!, ...drag.hit.carry];
    for (const q of moved){ q.x += dx; q.y += dy; }
    render();
  });
  const endDrag = (): void => { if (drag){ drag = null; void commit(); } };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  // The wheel over a part resizes it (and selects it).
  canvas.addEventListener('wheel', (e) => {
    const part = partHit(toPose(e));
    if (!part) return;
    e.preventDefault();
    pick = part; selectedPerson = part.person;
    const p = people[part.person];
    const cur = (p.sizes && p.sizes[part.part]) || 1;
    setPartSize(part.person, part.part, cur * (e.deltaY < 0 ? 1.05 : 1 / 1.05));
    syncControls(); render(); commitSoon();
  }, { passive: false });

  mirrorBtn.addEventListener('click', () => {
    for (const pp of people){
      for (const q of allPoints(pp)) q.x = 1 - q.x;
      for (const [a, b] of MIRROR_PAIRS) [pp.body[a], pp.body[b]] = [pp.body[b], pp.body[a]];
      [pp.lhand, pp.rhand] = [pp.rhand, pp.lhand];
      if (pp.sizes){ const s: Record<string, number> = {}; for (const [id, v] of Object.entries(pp.sizes)) s[swapRL(id)] = v; pp.sizes = s; }
    }
    if (pick) pick = { person: pick.person, part: swapRL(pick.part) as PartId };
    mirrored = !mirrored;
    syncControls(); render(); void commit();
  });
  resetBtn.addEventListener('click', () => {
    if (!extracted) return;
    people = clonePeople(extracted.people);
    mirrored = false; selectedPerson = 0; pick = null;
    syncControls(); render(); void commit();
  });
  addBtn.addEventListener('click', () => {
    // Centre first, then alternating right and left of it.
    const n = people.length;
    const cx = n === 0 ? 0.5 : Math.min(0.85, Math.max(0.15, 0.5 + 0.2 * Math.ceil(n / 2) * (n % 2 ? 1 : -1)));
    people.push(templatePerson(W, H, cx));
    selectedPerson = people.length - 1;
    render(); void commit();
  });
  removeBtn.addEventListener('click', () => {
    if (!people.length) return;
    people.splice(Math.min(selectedPerson, people.length - 1), 1);
    selectedPerson = Math.max(0, people.length - 1);
    pick = null;
    syncControls(); render(); void commit();
  });
  showOriginal.addEventListener('change', render);
  syncControls();

  return {
    show(pose: ExtractedPose, originalBytes: Uint8Array | null): void {
      extracted = pose;
      people = clonePeople(pose.people);
      W = pose.width; H = pose.height;
      canvas.width = W; canvas.height = H;
      mirrored = false; selectedPerson = 0; pick = null;
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      originalUrl = ''; original = null;
      // No original (a pose made from scratch): nothing to display behind it.
      showLabel.hidden = !originalBytes;
      if (originalBytes){
        originalUrl = URL.createObjectURL(new Blob([originalBytes as BlobPart]));
        original = new Image();
        original.onload = render;
        original.src = originalUrl;
      }
      syncControls(); render(); void commit();
    },
    hasPose: () => !!extracted,
    flush: () => committing
  };
}

// ---- the ControlNet tab ----

export interface PoseTabOptions {
  // Every edit's frame: the shell makes it the Generate tab's reference image.
  onChange: (bytes: Uint8Array) => void;
  // New pose: the generation's width × height.
  newPoseSize: () => { width: number; height: number };
  // Extract from the reference image: the pose + the image (null = nothing to
  // extract from / no pose found; the shell logs why).
  extract: () => Promise<{ pose: ExtractedPose; original: Uint8Array } | null>;
  // Back to the Generate tab.
  back: () => void;
}
export interface PoseTab {
  newPose: () => void;
  extract: () => Promise<boolean>;
  hasPose: () => boolean;
  flush: () => Promise<void>;
}

export function mountPoseTab(host: HTMLElement, opts: PoseTabOptions): PoseTab {
  host.classList.add('pose-tab');
  const bar = el('div', 'pose-tab-bar');
  const title = el('div', 'pose-tab-title', 'ControlNet pose');
  const note = el('div', 'muted small', 'Every edit becomes the Generate tab\'s reference image (Anima LLLite).');
  const titleBox = el('div', 'pose-tab-titlebox');
  titleBox.append(title, note);
  const newBtn = btn('New pose', 'Start from one standing person at the generation\'s size');
  const extractBtn = btn('Extract from reference', 'Find the poses in the Generate tab\'s reference image (DWPose, the comfyui_controlnet_aux node pack)');
  const backBtn = btn('← Generate', 'Back to the Generate tab');
  const actions = el('div', 'pose-editor-row');
  actions.append(newBtn, extractBtn, backBtn);
  bar.append(titleBox, actions);
  const empty = el('div', 'pose-tab-empty muted', 'No pose yet. Start a New pose, or pick a reference image in the Generate tab and Extract from reference.');
  const editorHost = el('div');
  editorHost.hidden = true;
  host.append(bar, empty, editorHost);
  const editor = mountPoseEditor(editorHost, opts.onChange);
  const showEditor = (): void => { empty.hidden = true; editorHost.hidden = false; };

  function newPoseNow(): void {
    const s = opts.newPoseSize();
    editor.show(newPose(s.width, s.height), null);
    showEditor();
  }
  async function extractNow(): Promise<boolean> {
    extractBtn.disabled = true;
    const label = extractBtn.textContent;
    extractBtn.textContent = 'Extracting…';
    try {
      const r = await opts.extract();
      if (!r) return false;
      editor.show(r.pose, r.original);
      showEditor();
      return true;
    } finally {
      extractBtn.disabled = false;
      extractBtn.textContent = label;
    }
  }
  newBtn.addEventListener('click', newPoseNow);
  extractBtn.addEventListener('click', () => { void extractNow(); });
  backBtn.addEventListener('click', opts.back);
  return { newPose: newPoseNow, extract: extractNow, hasPose: editor.hasPose, flush: editor.flush };
}
