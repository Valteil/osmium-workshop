// Prompt-field tag categories for the "Tag Sorting" view in Single mode and the
// card modal (see notes/Features/Tag-Sorting.md).
//
// Classification is two-stage, sourced from Danbooru tag groups:
//   1. an exact-match seed map (TAG_CATEGORY_SEEDS) compiled from the committed
//      scripts/tag-categories/raw/*.json snapshot by scripts/build-tag-categories.js;
//   2. ordered word-boundary keyword rules (TAG_CATEGORY_RULES) for anything the seed
//      map misses;
//   3. 'other' when nothing matches.
//
// A tag listed under several Danbooru groups resolves to the FIRST category in the
// build script's precedence order (most-specific-content first):
// sexual > limbs > pose > clothes > face > body > character > scene > effects > other.
// That precedence is baked into the generated seed map at build time and re-applied to
// the runtime rules here. (Limbs outranks pose because Danbooru's Posture page
// cross-lists gesture tags, so posture's own list contains "waving"/"salute"/etc. Face
// outranks body so the face groups' tags land in Face rather than Body.)
import {
  TAG_CATEGORY_ORDER, TAG_CATEGORY_SEEDS, TAG_CATEGORY_RULES,
  type TagCategoryId
} from './tag-categories-data';

export type { TagCategoryId };
export { TAG_CATEGORY_ORDER };

export const TAG_CATEGORY_LABELS: Record<TagCategoryId, string> = {
  character: 'Character',
  body: 'Body',
  face: 'Face',
  clothes: 'Clothes',
  limbs: 'Limbs and Hands',
  sexual: 'Sexual',
  pose: 'Pose',
  scene: 'Scene',
  effects: 'Effects',
  other: 'Other'
};

// Same normalization the app applies to tags generally: lowercase, underscores to
// spaces, collapse runs, trim.
function normalize(tag: string): string {
  return String(tag).toLowerCase().replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Compiled once. A keyword only has to match at a non-alphanumeric boundary so e.g.
// "ass" matches the tag "ass" but not "grass" — without \b's failure on tags that
// contain punctuation (parentheses, slashes, emoticons).
const RULE_MATCHERS: { id: TagCategoryId; res: RegExp[] }[] = TAG_CATEGORY_RULES.map((rule) => ({
  id: rule.id,
  res: rule.keywords.map((k) => new RegExp(`(?:^|[^a-z0-9])${escapeRegex(k)}(?:$|[^a-z0-9])`))
}));

export function categorizeTag(tag: string): TagCategoryId {
  const t = normalize(tag);
  if (!t) return 'other';
  const seeded = TAG_CATEGORY_SEEDS[t];
  if (seeded) return seeded;
  for (const rule of RULE_MATCHERS) {
    if (rule.res.some((re) => re.test(t))) return rule.id;
  }
  return 'other';
}

export interface TagCategoryGroup {
  id: TagCategoryId;
  label: string;
  tags: string[];
}

// Groups a list of tags into non-empty categories, in the fixed display order.
// Relative order WITHIN each category follows the input list (so the caller's own
// ordering — e.g. search-match-first — is preserved inside each segment).
export function groupTagsByCategory(tags: string[]): TagCategoryGroup[] {
  const buckets = new Map<TagCategoryId, string[]>();
  for (const tag of tags) {
    const id = categorizeTag(tag);
    const list = buckets.get(id);
    if (list) list.push(tag);
    else buckets.set(id, [tag]);
  }
  const groups: TagCategoryGroup[] = [];
  for (const id of TAG_CATEGORY_ORDER) {
    const list = buckets.get(id);
    if (list && list.length) groups.push({ id, label: TAG_CATEGORY_LABELS[id], tags: list });
  }
  return groups;
}
