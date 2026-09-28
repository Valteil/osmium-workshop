// Where and under what name the Bridge saves each generation (desktop only;
// Android keeps ComfyUI's names for now).
//
// Folder: <rating>/<character>/ (+ "Upscaled/" for the upscaled output).
//  - Rating: "explicit" when any prompt field contains "explicit", else
//    "safe" — the same rule as the workflow's Rating Checker.
//  - Character: the user's override when set ("OC" is just a folder name),
//    otherwise recognized from the Character field only. Recognition is a
//    whole-tag, exact match against the Danbooru character tags (category 4)
//    in the bundled tag list, the one Osmium's wiki build ships. The old
//    in-workflow detector (DSM Danbooru Character Detect) matched substrings
//    across the whole prompt with "_" as a separator, so e.g. score_7 turned
//    into a 7-tan folder.
// Filename: a pattern of free text and {tokens}, then ComfyUI's counter
// style "_00001_" (counted per folder and base name, so nothing is ever
// overwritten).
import { allTags } from './shared/tag-wiki';
import type { StorageBackend } from './shared/storage';

export const NAME_TOKENS: [string, string][] = [
  ['old', 'The Main LoRA\'s name (the old naming)'],
  ['character', 'Character folder name'],
  ['rating', 'safe / explicit'],
  ['model', 'Diffusion model'],
  ['sampler', 'Sampler'],
  ['scheduler', 'Scheduler'],
  ['seed', 'Seed'],
  ['steps', 'Steps'],
  ['cfg', 'CFG'],
  ['size', 'Width x height'],
  ['date', 'Date (YYYY-MM-DD)'],
  ['time', 'Time (HH-MM-SS)'],
];

// ---- Character index ----

// Same normalization the old detector used, so "Hatsune Miku",
// "hatsune_miku" and "\(escaped\)" forms all line up.
function normTag(s: string): string {
  return s.toLowerCase().replace(/[:\\]/g, '').trim().replace(/\s+/g, '_');
}

// "lumine_(genshin_impact)" -> "Lumine (Genshin Impact)", the old folders'
// "Name (Series)" style.
export function characterDisplay(tag: string): string {
  return tag.replace(/:/g, '').split('_').filter(Boolean)
    .map((w) => w.replace(/^(\(?)(\p{L})/u, (_m, p: string, c: string) => p + c.toUpperCase()))
    .join(' ');
}

export interface CharacterIndex { byTag: Map<string, string>; names: string[]; }
let indexP: Promise<CharacterIndex> | null = null;
export function characterIndex(): Promise<CharacterIndex> {
  return indexP ??= allTags().then((tags) => {
    const byTag = new Map<string, string>();
    const ranked: [string, number][] = [];
    for (const [tag, meta] of tags) {
      if (meta.category !== 4) continue;
      const display = characterDisplay(tag);
      byTag.set(normTag(tag), display);
      ranked.push([display, meta.count]);
    }
    ranked.sort((a, b) => b[1] - a[1]);
    return { byTag, names: ranked.map((r) => r[0]) };
  });
}

// First comma-separated entry of the Character field that is exactly a known
// character tag. Prompt weighting like "(lumine_(genshin_impact):1.2)" is
// unwrapped first. No substrings, no other fields.
export function recognizeCharacter(field: string, index: CharacterIndex): string {
  for (const raw of field.split(',')) {
    let t = raw.trim();
    const weighted = /^\((.+):\s*[\d.]+\)$/.exec(t);
    if (weighted) t = weighted[1].trim();
    if (!t) continue;
    const hit = index.byTag.get(normTag(t));
    if (hit) return hit;
  }
  return '';
}

export function ratingFolder(allPromptText: string): string {
  return /explicit/i.test(allPromptText) ? 'explicit' : 'safe';
}

// ---- Names ----

// One path segment / filename stem: no characters Windows forbids, no
// trailing dots or spaces.
export function safeSegment(s: string): string {
  return s.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim().replace(/[. ]+$/, '');
}

function baseName(path: string): string {
  return (path.split(/[\\/]/).pop() || '').replace(/\.(safetensors|ckpt|pt|pth|bin|gguf)$/i, '');
}

export interface NameContext {
  mainLora: string; character: string; rating: string; model: string;
  sampler: string; scheduler: string; seed: string; steps: string; cfg: string;
  width: string; height: string; when: Date;
}

export function expandPattern(pattern: string, ctx: NameContext): string {
  const pad = (n: number): string => String(n).padStart(2, '0');
  const d = ctx.when;
  const lora = ctx.mainLora && ctx.mainLora !== 'None' && ctx.mainLora !== 'Anima-n' ? baseName(ctx.mainLora) : '';
  const values: Record<string, string> = {
    old: lora, character: ctx.character, rating: ctx.rating, model: baseName(ctx.model),
    sampler: ctx.sampler, scheduler: ctx.scheduler, seed: ctx.seed, steps: ctx.steps, cfg: ctx.cfg,
    size: ctx.width && ctx.height ? `${ctx.width}x${ctx.height}` : '',
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`,
  };
  const out = pattern.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? values[k] : m));
  // A token that came out empty leaves its separator behind: tidy those up.
  return safeSegment(out.replace(/([_\- ])\1+/g, '$1').replace(/^[_\- ]+|[_\- ]+$/g, '')) || 'image';
}

// "<dir>/<base>_00012_.png": one past the highest counter already used by
// this base name in that folder. `taken` holds paths already handed out in
// the same job (pass 1 then pass 2 save back to back), so two outputs never
// share a counter even if the folder listing hasn't caught up yet.
export async function nextSavePath(backend: StorageBackend, relDir: string, base: string, taken?: Set<string>): Promise<string> {
  let max = 0;
  try {
    const esc = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`^${esc}_(\\d{5,})_\\.png$`, 'i');
    for (const e of await backend.listDir(relDir)) {
      const m = e.kind === 'file' ? re.exec(e.name) : null;
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
  } catch { /* folder doesn't exist yet */ }
  const at = (n: number): string => `${relDir ? relDir + '/' : ''}${base}_${String(n).padStart(5, '0')}_.png`;
  let n = max + 1;
  while (taken && taken.has(at(n).toLowerCase())) n++;
  taken?.add(at(n).toLowerCase());
  return at(n);
}
