// Canonical aspect-ratio bucketing math, shared by the main process (which
// crops + resizes) and the renderer (which decides whether an image already
// sits at a valid bucket size, so it can be skipped). Pure functions only —
// no Node or DOM imports — so both runtimes consume the same source.
//
// The bucket set mirrors Anima-TrainFlow's SmartCropper.get_valid_buckets:
// the min×min square plus every (min, s) / (s, min) strip for s stepping by
// `step` from min+step up to max — so one side is always exactly `min`. The
// loop bound is deliberately `s < sideMax + step` (not `<= sideMax`) to match
// the trainer's `range(s_min + 64, s_max + 64, 64)`, which can overshoot by
// one step when (max - min) isn't a multiple of step. With the default
// 256/1024/64 that overshoot can't happen.

export type Bucket = [number, number];

export function getValidBuckets(sideMin: number, sideMax: number, step = 64): Bucket[] {
  const sMin = Math.floor(sideMin), sMax = Math.floor(sideMax), st = Math.max(1, Math.floor(step));
  const seen = new Map<string, Bucket>();
  const add = (w: number, h: number) => { seen.set(`${w}x${h}`, [w, h]); };
  add(sMin, sMin);
  for (let s = sMin + st; s < sMax + st; s += st) {
    add(sMin, s);
    add(s, sMin);
  }
  return Array.from(seen.values()).sort((a, b) => (a[0] * a[1]) - (b[0] * b[1]));
}

// Closest aspect ratio in log space (log so a 2:1 and 1:2 miss are symmetric),
// exactly as the trainer's get_best_bucket does.
export function getBestBucket(w: number, h: number, buckets: Bucket[]): Bucket {
  const logOrig = Math.log(w / h);
  let best = buckets[0];
  let minDiff = Infinity;
  for (const b of buckets) {
    const diff = Math.abs(Math.log(b[0] / b[1]) - logOrig);
    if (diff < minDiff) { minDiff = diff; best = b; }
  }
  return best;
}

export function isBucketSize(w: number, h: number, buckets: Bucket[]): boolean {
  return buckets.some((b) => b[0] === w && b[1] === h);
}
