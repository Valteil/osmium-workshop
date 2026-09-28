// Where and under what name the Bridge saves each generation (desktop only;
// Android keeps ComfyUI's names for now). Two parts:
//
// 1. Automatic folders (shown greyed, not editable): the rating folder —
//    "explicit" if the Rating field says explicit, else "safe" if it says
//    safe, else none (the output folder's root) — and "Upscaled" for the
//    upscaled output.
// 2. The user's part:
//    - Character folder: a Danbooru character from the tag list (defaulting
//      to the one recognized in the Character field), "OC", or a custom name.
//      Recognition is a whole-tag, exact match of the Character field's
//      entries against the Danbooru character tags (category 4) in the
//      bundled tag list, the one Osmium's wiki build ships. The old
//      in-workflow detector (DSM Danbooru Character Detect) substring-matched
//      the whole prompt with "_" as a separator, so e.g. score_7 turned into
//      a 7-tan folder.
//    - Filename: toggles in a fixed order — character name, LoRA, then model
//      and sampler settings (each its own toggle) — then the counter. A part
//      that's off (or empty) just drops out.
//
// Final path: [rating/][character/][Upscaled/]<name>_00001_.png
import { allTags } from './shared/tag-wiki';
import type { StorageBackend } from './shared/storage';

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

// The automatic rating folder: '' means none (the output folder's root).
export function ratingFolder(ratingText: string): string {
  if (/\bexplicit\b/i.test(ratingText)) return 'explicit';
  if (/\bsafe\b/i.test(ratingText)) return 'safe';
  return '';
}

// ---- Names ----

// One path segment / filename part: no characters Windows forbids, no
// trailing dots or spaces.
export function safeSegment(s: string): string {
  return s.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim().replace(/[. ]+$/, '');
}

export function fileBaseName(path: string): string {
  return (path.split(/[\\/]/).pop() || '').replace(/\.(safetensors|ckpt|pt|pth|bin|gguf)$/i, '');
}

// The filename's parts, already in their fixed order; empty ones drop out.
export function joinNameParts(parts: string[]): string {
  return parts.map(safeSegment).filter(Boolean).join('_');
}

function counterFile(base: string, n: number): string {
  const num = String(n).padStart(5, '0');
  return base ? `${base}_${num}_.png` : `${num}.png`;
}

// "<dir>/<base>_00012_.png": one past the highest counter already used by
// this base name in that folder. `taken` holds paths already handed out in
// the same job (pass 1 then pass 2 save back to back), so two outputs never
// share a counter even if the folder listing hasn't caught up yet.
export async function nextSavePath(backend: StorageBackend, relDir: string, base: string, taken?: Set<string>): Promise<string> {
  let max = 0;
  try {
    const esc = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = base ? new RegExp(`^${esc}_(\\d{5,})_?\\.png$`, 'i') : /^(\d{5,})_?\.png$/i;
    for (const e of await backend.listDir(relDir)) {
      const m = e.kind === 'file' ? re.exec(e.name) : null;
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
  } catch { /* folder doesn't exist yet */ }
  const at = (n: number): string => `${relDir ? relDir + '/' : ''}${counterFile(base, n)}`;
  let n = max + 1;
  while (taken && taken.has(at(n).toLowerCase())) n++;
  taken?.add(at(n).toLowerCase());
  return at(n);
}

export function previewFileName(base: string): string {
  return counterFile(base, 1).replace('00001', '#####');
}
