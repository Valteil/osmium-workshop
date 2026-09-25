// Phase B module: the "Retroactive Merge/Void" dock — standing rules of the
// shape [child tag, child tag, ...] -> canonical tag (or -> nothing, for a
// void rule), persisted per-dataset and auto-applied to any tag mutation on
// a GALLERY entry (see tags-edit.ts's markDirty(), the actual funnel every
// tag-changing action already calls) plus a full resweep of every currently
// loaded GALLERY entry whenever a rule (or its enabled state, or a child's
// enabled state) changes — this is what makes it "retroactive": an image
// that missed a correction gets caught up the moment the rule exists, not
// via a separate manual "replay" action. Disabled entries are deliberately
// out of scope (applyCanonicalRules() skips them outright) — they keep
// whatever tags they already had and only get swept once restored to the
// Gallery, where the same markDirty()/moveEntry() path picks them up like
// any other entry.
//
// Full control knobs on top of the base rule: a rule can be paused as a
// whole (`enabled`) or have individual children toggled off without being
// forgotten (`disabledChildren`) — see buildRuleRow()/buildChip(). Per-image
// `entry.meta.mergeImmune`/`.antivoid` (set via view.ts's 3-dot menu or
// master-tag-control.ts's mass toggles) permanently exempt one image from
// merge rules and/or void rules respectively, regardless of the dock's own
// settings — see ruleAppliesToEntry(). Manually typing a tag that's an
// active child of an applicable rule is blocked outright (not silently
// rewritten) by findBlockingRule(), used from tags-edit.ts's
// addTagToEntry() — typing the rule's own canonical tag is exempt even if
// it also happens to appear in that rule's children (e.g. a rule merging
// "black dress"/"dress" into "black dress" itself).
//
// Turning a child (or a whole rule) off doesn't just stop future correction
// — it actively UNMERGES/UNVOIDS every Gallery image the editLog proves was
// actually affected, restoring exactly the tag(s) that image had (see
// unmergeChildren()). An image with only "dress" that got folded into
// "black frilly dress" alongside images that had "black dress"/"frilly
// dress" too only gets "dress" back — the canonical tag is dropped for that
// image specifically only once nothing still-active justifies it there.
// Deleting a rule outright runs the exact same restoration (treating every
// child as being turned off) rather than silently abandoning already-merged/
// voided tags with no way back.
//
// Replaces two older, narrower things:
// - tags-edit.ts's old checkbox-driven retroApplyToDisabled()/
//   retroApplyAllToDisabled() (removed) — that only ever caught up Disabled
//   images if the user remembered to go find and click a replay button, and
//   gave no visibility into what rules even existed.
// - synthdat-overseer.ts's own independent buildMergeHistoryMap() (now reads
//   from this module's canonicalRules instead of its own prevTags/newTags
//   diffing reconstruction — one shared source of truth, not two).
import type { CanonicalRule, Entry, EditLogEntry, EditLogAffected, DirHandle } from './types';
import { getBool, setBool } from './storage';
import { writeBytes } from './fs-access';
import { canonicalTagsList, btnAddCanonicalRule } from './dom';
import { editLog, pushLogEntry } from './edit-log';
import { setIconLabel, iconSvg } from './icons';

// [{ id, canonical: string|null, children: string[], enabled: boolean,
//    disabledChildren: string[] }]
// `enabled` pauses the WHOLE rule without deleting it (toggle back on and
// resweepAllEntries() catches everything up again). `disabledChildren` is
// the finer-grained version: individual children can be excluded from the
// merge/void without removing them from the rule's own record — e.g. you
// merged "black dress"/"frilly dress"/"dress" into "black frilly dress" but
// now want to stop folding plain "dress" in (not every dress is black),
// without forgetting it was ever part of this rule.
export let canonicalRules: CanonicalRule[] = [];
let ruleIdCounter = 1;

let getDirHandle: () => DirHandle | null = () => null;
let getEntries: () => Entry[] = () => [];
let markDirtyRef: (e: Entry) => void = () => {};
let refreshAllUIRef: () => void = () => {};
// Rule edits are a dirty/saveable action now, same as a tag edit — this
// module can't import tags-edit.ts's markRulesDirty()/saveAllDirty() back
// (it already imports FROM here), so it's injected the same way markDirty
// is. Every user-initiated rule change calls this instead of writing to
// disk immediately; tags-edit.ts's saveAllDirty() (manual Save or autosave)
// is what actually calls saveCanonicalRules() below.
let markRulesDirtyRef: () => void = () => {};
let recordChangeRef: (type: string, summary: string, affected: EditLogAffected[], extra?: Record<string, unknown>) => void = () => {};

const RULES_FILE_NAME = '_dts_canonical_tags.json';

function nextRuleId(): string {
  return `r${ruleIdCounter++}`;
}

function activeChildren(rule: CanonicalRule): string[] {
  const off = rule.disabledChildren || [];
  return rule.children.filter((t: string) => !off.includes(t));
}

// A rule created any which way (dock "+ New rule", Tag Pruner Unify/Void,
// the editLog bootstrap) always starts fully enabled with nothing toggled
// off — callers just fill in id/canonical/children on top of this.
function newRuleDefaults(): { enabled: boolean; disabledChildren: string[] } {
  return { enabled: true, disabledChildren: [] };
}

export async function saveCanonicalRules(): Promise<void> {
  const dirHandle = getDirHandle();
  if (!dirHandle) return;
  try {
    const handle = await dirHandle.getFileHandle(RULES_FILE_NAME, { create: true });
    await writeBytes(handle, JSON.stringify(canonicalRules, null, 2));
  } catch(err){ /* best-effort autosave, same as editLog's own save */ }
}

// One-time bootstrap for a dataset that predates this feature — merge/void
// log entries already carry {mergedTags, unifiedTag} / {voidedTags} directly
// (see tags-edit.ts's recordChange() calls), so this is a direct read, not a
// diff. All historical voids fold into ONE void rule (there's no canonical
// tag to key separate void rules by) while merges get one rule per distinct
// unifiedTag, gaining children across however many past merge actions
// targeted that same name.
function reconstructFromEditLog(): CanonicalRule[] {
  const rules: CanonicalRule[] = [];
  const byCanonical = new Map<string, CanonicalRule>();
  let voidRule: CanonicalRule | null = null;
  for (const le of editLog){
    if (le.type === 'merge' && le.mergedTags && le.unifiedTag){
      let rule = byCanonical.get(le.unifiedTag);
      if (!rule){
        rule = { id: nextRuleId(), canonical: le.unifiedTag, children: [], ...newRuleDefaults() };
        byCanonical.set(le.unifiedTag, rule);
        rules.push(rule);
      }
      for (const t of le.mergedTags){
        if (t !== rule.canonical && !rule.children.includes(t)) rule.children.push(t);
      }
    } else if (le.type === 'void' && le.voidedTags){
      if (!voidRule){
        voidRule = { id: nextRuleId(), canonical: null, children: [], ...newRuleDefaults() };
        rules.push(voidRule);
      }
      for (const t of le.voidedTags){
        if (!voidRule.children.includes(t)) voidRule.children.push(t);
      }
    }
  }
  return rules;
}

export async function loadCanonicalRulesForFolder(): Promise<void> {
  canonicalRules = [];
  ruleIdCounter = 1;
  const dirHandle = getDirHandle();
  if (!dirHandle){ renderCanonicalTagsList(); return; }
  try {
    const handle = await dirHandle.getFileHandle(RULES_FILE_NAME, { create: false });
    const file = await handle.getFile();
    const parsed = JSON.parse((await file.text()).trim() || '[]');
    // Migration for a rules file saved before per-rule enable/disable and
    // per-child toggles existed: default enabled=true, disabledChildren=[].
    if (Array.isArray(parsed)) canonicalRules = parsed.map(r => ({
      id: r.id, canonical: r.canonical, children: r.children || [],
      enabled: r.enabled !== false, disabledChildren: r.disabledChildren || []
    }));
    ruleIdCounter = canonicalRules.reduce((max, r) => Math.max(max, parseInt(String(r.id || 'r0').slice(1), 10) || 0), 0) + 1;
  } catch(err){
    canonicalRules = reconstructFromEditLog();
    if (canonicalRules.length) await saveCanonicalRules();
  }
  renderCanonicalTagsList();
}

// A rule applies to a given entry only if: the rule itself is enabled, the
// entry isn't immunized against this rule's KIND (Merge Immunize skips every
// merge rule, Antivoid skips every void rule — independent flags, checked
// per-rule so an image can be immune to merges but still get voids applied),
// and — per the "these effects only apply to Gallery" scoping — the entry
// isn't Disabled (a Disabled image is frozen exactly as it was; it only gets
// corrected once it's back in Gallery, via this same function running
// through markDirty()/moveEntry() at that point — see CLAUDE.md's
// Retroactive Merge/Void entry).
function ruleAppliesToEntry(rule: CanonicalRule, entry: Entry): boolean {
  if (!rule.enabled) return false;
  const meta = entry.meta || {};
  if (rule.canonical && meta.mergeImmune) return false;
  if (!rule.canonical && meta.antivoid) return false;
  return true;
}

// Rewrites entry.tags in place per every applicable rule with a match — a
// rule with no ACTIVE children (empty, or every child individually toggled
// off) is a no-op, same as a disabled rule. Returns whether anything
// actually changed, so callers can skip a pointless markDirty() when nothing
// matched.
export function applyCanonicalRules(entry: Entry): boolean {
  if (entry.disabled) return false;
  let changed = false;
  for (const rule of canonicalRules){
    if (!ruleAppliesToEntry(rule, entry)) continue;
    const active = activeChildren(rule);
    if (active.length === 0) continue;
    if (!entry.tags.some((t: string) => active.includes(t))) continue;
    const newTags = entry.tags.filter((t: string) => !active.includes(t));
    if (rule.canonical && !newTags.includes(rule.canonical)) newTags.push(rule.canonical);
    entry.tags = newTags;
    changed = true;
  }
  return changed;
}

// Would typing `tag` onto `entry` right now get silently rewritten/removed
// by a standing rule? Used to PREVENT the add outright instead (tags-edit.ts's
// addTagToEntry) — typing is a deliberate, in-the-moment action, and
// silently swapping what the user just typed for something else is more
// confusing than just saying no and pointing at the dock. Typing the
// rule's own CANONICAL tag is never blocked even if it also happens to
// appear in that rule's children list (a rule can legitimately include its
// own canonical form as a child, e.g. "black dress, dress -> black dress" —
// see canonical-tags.ts's header) — that's the correct/target spelling, not
// a variant needing correction.
export function findBlockingRule(tag: string, entry: Entry): CanonicalRule | null {
  for (const rule of canonicalRules){
    if (rule.canonical && tag === rule.canonical) continue;
    if (!ruleAppliesToEntry(rule, entry)) continue;
    if (activeChildren(rule).includes(tag)) return rule;
  }
  return null;
}

// Every tag currently covered by an ACTIVE void rule (enabled, not
// per-child-disabled) — used by SynthDat Overseer's pending tag card to
// preview which tags would be silently stripped once this image is actually
// added to the Gallery, without needing a real entry (no per-image immunity
// applies yet, since the image isn't an entry until Accept).
export function activeVoidTagSet(): Set<string> {
  const set = new Set<string>();
  for (const rule of canonicalRules){
    if (!rule.enabled || rule.canonical) continue;
    for (const t of activeChildren(rule)) set.add(t);
  }
  return set;
}

// The "retroactive" half — applies every current rule to every currently
// loaded Gallery entry (locked entries excluded, matching every other mass/
// automatic tool in the app; Disabled entries excluded per the Gallery-only
// scoping above — applyCanonicalRules() already skips them, this just avoids
// the pointless iteration). Called whenever a rule (or its
// enabled state, or a child's enabled state) changes, so an image that
// missed a correction gets caught up the moment the rule exists, not on some
// later manual trigger.
export function resweepAllEntries(): number {
  let touched = 0;
  for (const e of getEntries()){
    if (e.meta && e.meta.locked) continue;
    if (e.disabled) continue;
    if (applyCanonicalRules(e)){
      markDirtyRef(e);
      touched++;
    }
  }
  if (touched > 0) refreshAllUIRef();
  return touched;
}

// ---------------- Log-driven unmerge / unvoid ----------------
// Turning a rule (or one of its children) off doesn't just stop future
// correction — every affected Gallery image gets its ORIGINAL tag(s) back,
// reconstructed from editLog's own {mergedTags/voidedTags, affected:
// [{base, prevTags, newTags}]} records (tags-edit.ts's recordChange() writes
// these for every merge/void action). Building an index once per call
// instead of rescanning editLog per entry keeps this from being O(entries ×
// editLog) on a large dataset with a long history.

// tag -> Set of bases that editLog proves genuinely had that exact tag right
// before some merge action folded it into `canonical`. A tag NOT in this
// index for a given base was never actually on that image pre-merge (e.g.
// the rule has "dress" as a child but this particular image only ever had
// "black dress" — restoring "dress" onto it would be inventing a tag it
// never had).
function buildMergeEvidenceIndex(canonical: string, tags: string[]): Map<string, Set<string>> {
  const index = new Map<string, Set<string>>(tags.map(t => [t, new Set<string>()]));
  for (const le of editLog){
    if (le.type !== 'merge' || le.unifiedTag !== canonical) continue;
    const merged = le.mergedTags || [];
    for (const a of (le.affected || [])){
      const prev = a.prevTags || [];
      for (const t of tags){
        if (merged.includes(t) && prev.includes(t)) index.get(t)!.add(a.base);
      }
    }
  }
  return index;
}

// Same idea for void: tag -> Set of bases editLog proves had that exact tag
// before some void action removed it.
function buildVoidEvidenceIndex(tags: string[]): Map<string, Set<string>> {
  const index = new Map<string, Set<string>>(tags.map(t => [t, new Set<string>()]));
  for (const le of editLog){
    if (le.type !== 'void') continue;
    const voided = le.voidedTags || [];
    for (const a of (le.affected || [])){
      const prev = a.prevTags || [];
      for (const t of tags){
        if (voided.includes(t) && prev.includes(t)) index.get(t)!.add(a.base);
      }
    }
  }
  return index;
}

// Restores `childrenBeingTurnedOff` (one tag for a per-child toggle, or
// rule.children.slice() for a whole-rule disable/delete) onto every Gallery
// entry the log proves actually had it, and — for a merge rule — drops the
// canonical tag from an entry once NONE of the rule's children (active or
// being turned off, evaluated against their FINAL state — i.e. call this
// AFTER updating rule.enabled/disabledChildren) still justify it being
// there. Locked entries and Disabled/Unsaved-Approved entries are skipped,
// same convention as resweepAllEntries(). Returns the number of entries
// touched (and refreshes the UI if any were).
export function unmergeChildren(rule: CanonicalRule, childrenBeingTurnedOff: string[]): number {
  let touched = 0;
  const affected: EditLogAffected[] = [];
  if (!rule.canonical){
    // Void rule: reviving a tag is independent per child — no canonical to
    // reconsider.
    const index = buildVoidEvidenceIndex(childrenBeingTurnedOff);
    for (const e of getEntries()){
      if (e.meta && e.meta.locked) continue;
      if (e.disabled) continue;
      const prevTags = e.tags.slice();
      let changed = false;
      for (const child of childrenBeingTurnedOff){
        if (e.tags.includes(child)) continue;
        if (!index.get(child)!.has(e.base)) continue;
        e.tags = [...e.tags, child];
        changed = true;
      }
      if (changed){
        markDirtyRef(e);
        touched++;
        affected.push({ base: e.base, prevTags, newTags: e.tags.slice() });
      }
    }
    if (touched > 0){
      const tagPhrase = childrenBeingTurnedOff.length === 1 ? `tag "${childrenBeingTurnedOff[0]}"` : `${childrenBeingTurnedOff.length} tags`;
      recordChangeRef('unvoid', `Unvoided ${tagPhrase} back onto ${touched} image(s).`, affected, { revivedTags: childrenBeingTurnedOff.slice() });
    }
  } else {
    const index = buildMergeEvidenceIndex(rule.canonical, rule.children);
    const disabledChildren = rule.disabledChildren || [];
    for (const e of getEntries()){
      if (e.meta && e.meta.locked) continue;
      if (e.disabled) continue;
      if (!e.tags.includes(rule.canonical)) continue;
      const prevTags = e.tags.slice();
      let changed = false;
      let stillJustified = false;
      for (const child of rule.children){
        const hadIt = index.get(child)!.has(e.base);
        if (childrenBeingTurnedOff.includes(child)){
          if (hadIt && !e.tags.includes(child)){ e.tags = [...e.tags, child]; changed = true; }
        } else if (rule.enabled && !disabledChildren.includes(child) && hadIt){
          stillJustified = true;
        }
      }
      if (!stillJustified && e.tags.includes(rule.canonical)){
        e.tags = e.tags.filter(t => t !== rule.canonical);
        changed = true;
      }
      if (changed){
        markDirtyRef(e);
        touched++;
        affected.push({ base: e.base, prevTags, newTags: e.tags.slice() });
      }
    }
    if (touched > 0){
      const tagPhrase = childrenBeingTurnedOff.length === 1 ? `tag "${childrenBeingTurnedOff[0]}"` : `${childrenBeingTurnedOff.length} tags`;
      recordChangeRef('unmerge', `Unmerged ${tagPhrase} back out of "${rule.canonical}" for ${touched} image(s).`, affected, { restoredTags: childrenBeingTurnedOff.slice(), canonical: rule.canonical });
    }
  }
  if (touched > 0) refreshAllUIRef();
  return touched;
}

// Rule CONFIG changes (pause/resume, add/remove/toggle a child, create,
// delete) have no tag-level effect of their own to attach undo/redo to —
// separate from unmergeChildren()'s own log entry above (which covers
// whatever tags actually got restored, if any). Logged directly via
// pushLogEntry() rather than recordChangeRef() since there's nothing here
// for the global Undo/Redo stack to act on.
function ruleLabel(rule: CanonicalRule): string {
  return rule.canonical ? `merge rule → "${rule.canonical}"` : 'void rule';
}
function logRuleChange(summary: string): void {
  pushLogEntry({ type: 'rule-update', summary, affected: [] });
}

// Called by Tag Pruner's own Unify action (tags-edit.ts) right after it
// applies a merge — extends the existing rule for this canonical tag, or
// creates one, then resweeps so any entry the immediate action's own loop
// didn't reach (e.g. Disabled images, if "Also apply to Disabled images
// right now" was left unchecked) gets caught up right away regardless.
export function registerMergeRule(children: string[], canonical: string): void {
  let rule = canonicalRules.find(r => r.canonical === canonical);
  if (!rule){
    rule = { id: nextRuleId(), canonical, children: [], ...newRuleDefaults() };
    canonicalRules.push(rule);
  }
  for (const t of children){
    if (!rule.children.includes(t)) rule.children.push(t);
  }
  markRulesDirtyRef();
  renderCanonicalTagsList();
  resweepAllEntries();
}

// Called by Tag Pruner's own Void action — all voids share ONE rule (no
// canonical tag to key separate ones by).
export function registerVoidRule(children: string[]): void {
  let rule = canonicalRules.find(r => r.canonical === null);
  if (!rule){
    rule = { id: nextRuleId(), canonical: null, children: [], ...newRuleDefaults() };
    canonicalRules.push(rule);
  }
  for (const t of children){
    if (!rule.children.includes(t)) rule.children.push(t);
  }
  markRulesDirtyRef();
  renderCanonicalTagsList();
  resweepAllEntries();
}

// ---------------- Dock UI ----------------

function commitRuleChange(): void {
  markRulesDirtyRef();
  resweepAllEntries();
  renderCanonicalTagsList();
}

// `active` (unchecked = temporarily toggled off, kept in the rule but not
// applied) is separate from removing the chip entirely (the × button, which
// forgets the tag was ever part of this rule). Clicking the chip's own label
// toggles active/inactive; the × always deletes outright.
function buildChip(text: string, active: boolean, onToggleActive: (on: boolean) => void, onRemove: () => void): HTMLElement {
  const chip = document.createElement('span');
  chip.className = 'chip' + (active ? '' : ' canonical-chip-disabled');
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = active;
  cb.title = active ? 'Uncheck to pause this tag in the rule without deleting it' : 'This tag is toggled off — check to resume including it in the merge/void';
  cb.addEventListener('change', () => onToggleActive(cb.checked));
  chip.appendChild(cb);
  const label = document.createElement('span');
  label.textContent = text;
  chip.appendChild(label);
  const btn = document.createElement('button');
  btn.textContent = '×';
  btn.title = 'Remove this tag from the rule entirely';
  btn.addEventListener('click', onRemove);
  chip.appendChild(btn);
  return chip;
}

function buildRuleRow(rule: CanonicalRule): HTMLElement {
  const row = document.createElement('div');
  row.className = 'canonical-rule-row';
  row.dataset.ruleId = String(rule.id);

  row.classList.toggle('canonical-rule-disabled', !rule.enabled);

  const head = document.createElement('div');
  head.className = 'canonical-rule-head';

  if (rule.canonical){
    const label = document.createElement('span');
    label.className = 'canonical-rule-label';
    label.textContent = `→ ${rule.canonical}`;
    label.title = 'Every ACTIVE child tag below gets rewritten to this canonical tag.';
    head.appendChild(label);
  } else {
    const label = document.createElement('span');
    label.className = 'canonical-rule-label canonical-rule-void';
    setIconLabel(label, '🗑 Void (remove entirely)');
    label.title = 'Every ACTIVE child tag below gets removed outright — nothing replaces it.';
    head.appendChild(label);
  }

  // Pauses the WHOLE rule without deleting it or forgetting its children —
  // resweepAllEntries() re-corrects everything the instant it's turned back
  // on, same as adding/editing a rule.
  const enableToggle = document.createElement('label');
  enableToggle.className = 'ach-toggle-row canonical-rule-enable-toggle';
  enableToggle.title = rule.enabled ? 'Uncheck to pause this whole rule' : 'This rule is paused — check to resume applying it';
  const enableCb = document.createElement('input');
  enableCb.type = 'checkbox';
  enableCb.checked = rule.enabled;
  enableCb.addEventListener('change', () => {
    const wasEnabled = rule.enabled;
    rule.enabled = enableCb.checked;
    // Pausing the whole rule unmerges/unvoids everything it's responsible
    // for, not just future occurrences — see unmergeChildren()'s own header.
    // Re-enabling needs no special call: commitRuleChange()'s own resweep
    // re-corrects everything.
    if (wasEnabled && !rule.enabled) unmergeChildren(rule, rule.children.slice());
    logRuleChange(`${rule.enabled ? 'Resumed' : 'Paused'} ${ruleLabel(rule)}.`);
    commitRuleChange();
  });
  enableToggle.appendChild(enableCb);
  enableToggle.appendChild(document.createTextNode(rule.enabled ? ' Enabled' : ' Paused'));
  head.appendChild(enableToggle);

  const deleteRuleBtn = document.createElement('button');
  setIconLabel(deleteRuleBtn, '🗑 Delete rule');
  deleteRuleBtn.title = 'Remove this whole rule and unmerge/unvoid whatever it affected, using the edit log to restore exactly the tags each image actually had';
  deleteRuleBtn.addEventListener('click', () => {
    // Same restoration as pausing the rule (unmergeChildren()) — deleting it
    // outright shouldn't leave already-merged/voided tags stranded with no
    // way back just because the rule itself is now gone.
    unmergeChildren(rule, rule.children.slice());
    logRuleChange(`Deleted ${ruleLabel(rule)}.`);
    canonicalRules = canonicalRules.filter(r => r.id !== rule.id);
    markRulesDirtyRef();
    renderCanonicalTagsList();
  });
  head.appendChild(deleteRuleBtn);
  row.appendChild(head);

  const chipRow = document.createElement('div');
  chipRow.className = 'chiprow';
  const disabledChildren = rule.disabledChildren || (rule.disabledChildren = []);
  for (const child of rule.children){
    chipRow.appendChild(buildChip(
      child,
      !disabledChildren.includes(child),
      (nowActive) => {
        rule.disabledChildren = nowActive
          ? disabledChildren.filter(t => t !== child)
          : [...disabledChildren, child];
        // Turning this ONE child off unmerges/unvoids just that tag — see
        // unmergeChildren()'s own header. Turning it back on needs nothing
        // extra: commitRuleChange()'s resweep re-folds it forward again.
        if (!nowActive) unmergeChildren(rule, [child]);
        logRuleChange(`${nowActive ? 'Turned tag back on' : 'Turned tag off'}: "${child}" in ${ruleLabel(rule)}.`);
        commitRuleChange();
      },
      () => {
        // The × (forget this tag entirely) restores it the same way turning
        // it off does — deleting the record shouldn't stop the restoration
        // that pausing it would have done.
        unmergeChildren(rule, [child]);
        rule.children = rule.children.filter(t => t !== child);
        rule.disabledChildren = disabledChildren.filter(t => t !== child);
        logRuleChange(`Removed tag "${child}" from ${ruleLabel(rule)}.`);
        commitRuleChange();
      }
    ));
  }
  row.appendChild(chipRow);

  const addRow = document.createElement('div');
  addRow.className = 'canonical-rule-add-row';
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = rule.canonical ? 'Add another tag to merge in…' : 'Add another tag to void…';
  const addBtn = document.createElement('button');
  addBtn.textContent = '+ Add';
  function commitAdd(){
    const tag = input.value.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
    if (!tag) return;
    // A child tag identical to the rule's own canonical is allowed on purpose
    // (e.g. "black dress, dress -> black dress") — it's harmless (applying
    // the rule is a no-op for that exact tag) and typing the canonical form
    // is never blocked by findBlockingRule() regardless.
    if (!rule.children.includes(tag)) rule.children.push(tag);
    input.value = '';
    logRuleChange(`Added tag "${tag}" to ${ruleLabel(rule)}.`);
    commitRuleChange();
  }
  addBtn.addEventListener('click', commitAdd);
  input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') commitAdd(); });
  addRow.appendChild(input);
  addRow.appendChild(addBtn);
  row.appendChild(addRow);

  return row;
}

let voidSectionExpanded = true;
voidSectionExpanded = getBool('dts-void-section-expanded', true);

// Void and merge rules are visually grouped instead of one undifferentiated
// list — void's own group is collapsible (voidSectionExpanded, persisted)
// since void rules tend to be numerous/set-and-forget once tuned; merge just
// gets a plain header, mainly so it's clear where void's rules end and
// merge's begin instead of the list just continuing with no divider.
export function renderCanonicalTagsList(){
  canonicalTagsList.innerHTML = '';
  if (canonicalRules.length === 0){
    const empty = document.createElement('div');
    empty.className = 'stats-empty';
    empty.textContent = 'No standing merge/void rules yet — use Tag Pruner\'s Unify/Void above, or "+ New rule" below.';
    canonicalTagsList.appendChild(empty);
    return;
  }

  const voidRules = canonicalRules.filter(r => !r.canonical);
  const mergeRules = canonicalRules.filter(r => r.canonical);

  if (voidRules.length){
    // Void rules are a single shared bucket by design (registerVoidRule()
    // funnels every voided tag into one rule, no separate rule per tag) —
    // counting RULES here would almost always just say "(1)" regardless of
    // how many tags are actually being voided, which reads as wrong even
    // though it's technically accurate. Count tags instead, since that's
    // what this section is actually communicating.
    const voidTagCount = voidRules.reduce((sum, r) => sum + r.children.length, 0);
    const section = document.createElement('div');
    section.className = 'settings-section canonical-rule-group';
    section.classList.toggle('expanded', voidSectionExpanded);
    const header = document.createElement('button');
    header.type = 'button';
    header.className = 'settings-section-header';
    header.innerHTML = `<span class="settings-section-arrow">${iconSvg('chevron-right')}</span><span>${iconSvg('trash', 'ic-lead')}Void — ${voidTagCount} tag${voidTagCount === 1 ? '' : 's'}</span>`;
    header.addEventListener('click', () => {
      voidSectionExpanded = !section.classList.contains('expanded');
      section.classList.toggle('expanded', voidSectionExpanded);
      setBool('dts-void-section-expanded', voidSectionExpanded);
    });
    section.appendChild(header);
    const body = document.createElement('div');
    body.className = 'settings-section-body';
    for (const rule of voidRules) body.appendChild(buildRuleRow(rule));
    section.appendChild(body);
    canonicalTagsList.appendChild(section);
  }

  if (mergeRules.length){
    const header = document.createElement('div');
    header.className = 'canonical-rule-group-header';
    header.textContent = `→ Merge rules (${mergeRules.length})`;
    canonicalTagsList.appendChild(header);
    for (const rule of mergeRules) canonicalTagsList.appendChild(buildRuleRow(rule));
  }
}

interface CanonicalTagsDeps {
  getDirHandle: () => DirHandle | null;
  getEntries: () => Entry[];
  markDirty: (e: Entry) => void;
  refreshAllUI: () => void;
  markRulesDirty: () => void;
  recordChange: (type: string, summary: string, affected: EditLogAffected[], extra?: Record<string, unknown>) => void;
}

export function initCanonicalTags(deps: CanonicalTagsDeps): void {
  getDirHandle = deps.getDirHandle;
  getEntries = deps.getEntries;
  markDirtyRef = deps.markDirty;
  refreshAllUIRef = deps.refreshAllUI;
  markRulesDirtyRef = deps.markRulesDirty;
  recordChangeRef = deps.recordChange;

  btnAddCanonicalRule.addEventListener('click', () => {
    const newRule = { id: nextRuleId(), canonical: '', children: [], ...newRuleDefaults() };
    canonicalRules.push(newRule);
    // A blank-canonical new rule renders inside the void group (see
    // renderCanonicalTagsList()) until it's given a name — force that group
    // open so the inline rename input below is actually visible, even if
    // the user had collapsed it.
    voidSectionExpanded = true;
    renderCanonicalTagsList();
    // The freshly-added row's canonical name still needs typing in — turn
    // its label into an editable input this one time, since every other
    // rule already has a name by the point it exists. Looked up by the
    // rule's own id (not "the last .canonical-rule-row in the DOM") since
    // the void/merge grouping above means a blank-canonical (void-shaped)
    // new rule doesn't necessarily render last — it lands in the void
    // group, which renders BEFORE merge rules.
    const newRow = canonicalTagsList.querySelector(`.canonical-rule-row[data-rule-id="${newRule.id}"]`);
    const head = newRow && newRow.querySelector('.canonical-rule-head');
    if (!head) return;
    const label = head.querySelector('.canonical-rule-label');
    if (!label) return;
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Canonical tag name (leave blank for a void rule)';
    nameInput.className = 'canonical-rule-name-input';
    function commitName(){
      const rule = canonicalRules[canonicalRules.length - 1];
      // Enter followed by a blur (or just blur alone) can both fire this —
      // only log the creation once, the first time canonical moves off its
      // '' placeholder.
      const isFirstCommit = rule.canonical === '';
      const name = nameInput.value.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
      rule.canonical = name || null;
      if (isFirstCommit) logRuleChange(`Created ${ruleLabel(rule)}.`);
      markRulesDirtyRef();
      renderCanonicalTagsList();
    }
    nameInput.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') commitName(); });
    nameInput.addEventListener('blur', commitName);
    head.replaceChild(nameInput, label);
    nameInput.focus();
  });
}
