// Phase B module: Quick Merge (finds tags that are the same thing typed
// differently — case/separator variants — and offers to combine them).
// The actual tag mutation (markDirty/recordChange/trackStat/checkAchievements/
// refreshAllUI) stays orchestrated by index.ts, which owns `entries` and the
// rest of the core tag-edit machinery — this module exposes a pure
// applyQuickMerge() that index.ts's click handler feeds `entries` into and
// reads a summary back from, the same signal-return pattern used by
// themes.ts's toggleDayNightMode().
// @ts-nocheck
import { quickMergeList, btnQuickMergeApply } from './dom';

export let quickMergeGroups = [];
export let quickMergeSelection = new Map();

// Groups tags whose spelling only differs by case or separator style
// (spaces/underscores/hyphens) — underscores are already folded to spaces
// on load, so in practice this mostly surfaces case variants like
// "Red Hair" vs "red hair", but it also catches stray hyphenated forms.
export function scanTagVariants(index){
  const byKey = new Map(); // normalized key -> [tag,...]
  for (const [tag] of index){
    const key = tag.toLowerCase().replace(/[\s_-]+/g, ' ').trim();
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(tag);
  }
  const groups = [];
  for (const [key, tags] of byKey){
    if (tags.length < 2) continue;
    let canon = tags[0];
    let canonCount = index.get(canon).size;
    for (const t of tags){
      const c = index.get(t).size;
      if (c > canonCount || (c === canonCount && t < canon)){ canon = t; canonCount = c; }
    }
    groups.push({ key, canon, variants: tags.slice().sort() });
  }
  groups.sort((a, b) => a.key.localeCompare(b.key));
  return groups;
}

export function renderQuickMergeVariantText(el, group, sel){
  const others = group.variants.filter(v => v !== sel.canon);
  el.textContent = others.length ? `also merges: ${others.join(', ')}` : '';
}

export function renderQuickMergeList(){
  quickMergeList.innerHTML = '';
  if (quickMergeGroups.length === 0){
    const empty = document.createElement('div');
    empty.className = 'stats-empty';
    empty.textContent = 'No duplicate-spelling tags found. Scan again after editing tags.';
    quickMergeList.appendChild(empty);
    btnQuickMergeApply.style.display = 'none';
    return;
  }
  for (const group of quickMergeGroups){
    const sel = quickMergeSelection.get(group.key);
    const row = document.createElement('label');
    row.className = 'qm-row';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = sel.selected;
    cb.addEventListener('change', () => { sel.selected = cb.checked; });
    row.appendChild(cb);

    const body = document.createElement('div');
    body.style.flex = '1';

    const canonRow = document.createElement('div');
    canonRow.appendChild(document.createTextNode('Merge into: '));
    const canonSelect = document.createElement('select');
    canonSelect.className = 'qm-canon';
    for (const variant of group.variants){
      const opt = document.createElement('option');
      opt.value = variant;
      opt.textContent = variant;
      if (variant === sel.canon) opt.selected = true;
      canonSelect.appendChild(opt);
    }
    canonSelect.addEventListener('click', ev => ev.stopPropagation());
    canonSelect.addEventListener('change', () => {
      sel.canon = canonSelect.value;
      renderQuickMergeVariantText(variantsEl, group, sel);
    });
    canonRow.appendChild(canonSelect);
    body.appendChild(canonRow);

    const variantsEl = document.createElement('div');
    variantsEl.className = 'qm-variants';
    renderQuickMergeVariantText(variantsEl, group, sel);
    body.appendChild(variantsEl);

    row.appendChild(body);
    quickMergeList.appendChild(row);
  }
  btnQuickMergeApply.style.display = '';
}

export function runQuickMergeScan(index){
  quickMergeGroups = scanTagVariants(index);
  quickMergeSelection = new Map();
  for (const group of quickMergeGroups) quickMergeSelection.set(group.key, { selected: true, canon: group.canon });
  renderQuickMergeList();
  return quickMergeGroups.length;
}

export function resetQuickMergeState(){
  quickMergeGroups = [];
  quickMergeSelection = new Map();
}

// Mutates `entries` in place (via markDirty, supplied by the caller) and
// returns a summary of what happened — index.ts's click handler uses this to
// drive recordChange/trackStat/checkAchievements/refreshAllUI/toast, none of
// which this module has access to.
export function applyQuickMerge(entries, includeDisabled, markDirty){
  const active = quickMergeGroups.filter(g => quickMergeSelection.get(g.key).selected);
  if (active.length === 0) return { active, affected: [], mergedVariants: 0 };

  const affectedMap = new Map(); // base -> {base, prevTags, newTags}
  let mergedVariants = 0;
  for (const group of active){
    const sel = quickMergeSelection.get(group.key);
    const canon = sel.canon;
    const variantSet = new Set(group.variants.filter(v => v !== canon));
    if (variantSet.size === 0) continue;
    mergedVariants += variantSet.size;
    for (const e of entries){
      if (e.disabled && !includeDisabled) continue;
      const hasAny = e.tags.some(t => variantSet.has(t));
      if (!hasAny) continue;
      if (!affectedMap.has(e.base)) affectedMap.set(e.base, { base: e.base, prevTags: e.tags.slice(), newTags: null });
      let newTags = e.tags.filter(t => !variantSet.has(t));
      if (!newTags.includes(canon)) newTags.push(canon);
      e.tags = newTags;
      markDirty(e);
      affectedMap.get(e.base).newTags = newTags.slice();
    }
  }

  return { active, affected: Array.from(affectedMap.values()), mergedVariants };
}
