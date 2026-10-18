// Phase B module: core tag mutation (add/remove/reset), the undo/redo
// history stack, Unify/Void apply, disable/restore, and save-to-disk. This is
// the highest-fan-in domain in the app — nearly everything else calls into
// it — so several index.ts core internals (entries, dirHandle,
// disabledDirHandle, singleIndex, refreshStats/refreshAllUI/renderCurrentView)
// are injected once via initTagsEdit() rather than imported, since index.ts's
// IIFE can't export them.
import type { Entry, EditLogAffected, DirHandle, ChangeRecord } from './types';
import { getBool, setBool } from './storage';
import { writeBytes } from './fs-access';
import { btnUndo, btnRedo, btnSave, dirtyCountEl, includeDisabledToggle, autosaveToggle } from './dom';
import { toast, showConfirmModal } from './shared-ui';
import { trackStat, checkAchievements, checkVoidThemeAchievements, folderStats, saveFolderStats } from './achievements';
import { pushLogEntry, editLog, saveEditLog, PIXEL_TYPES, ISOLATE_TYPES, REVIEW_TYPES } from './edit-log';
import { applyCanonicalRules, registerMergeRule, registerVoidRule, findBlockingRule, saveCanonicalRules, setUndoRuleTags } from './canonical-tags';

export let undoStack: ChangeRecord[] = [];
export let redoStack: ChangeRecord[] = [];
// The undo/redo handlers await async appliers (pixel/isolate); without this a
// second click during the await would pop another record and could push them
// onto the opposite stack out of order.
let undoRedoBusy = false;

// Session-only pixel-edit payloads (crop/rotate), keyed by owning log entry
// id. multi-MB by nature — deliberately NOT part of any persisted shape
// (EditLogAffected carries just the logId pointer). Cleared with the stacks
// on folder load, since log ids restart at 1 per folder.
interface PixelState {
  prev: Uint8Array;
  next: Uint8Array;
  prevW: number;
  prevH: number;
  nextW: number;
  nextH: number;
  mime: string;
}

const pixelStates = new Map<number, PixelState>();

// Session-only isolate payloads (new-file creations), same keying rules as
// pixelStates above: bytes never touch the persisted log.
interface IsolateState {
  bytes: Uint8Array;
  mime: string;
  tags: string[];
  imgName: string;
  width: number;
  height: number;
}

// Keyed by log id + base: one Isolate (Split) entry creates several files.
const isolateStates = new Map<string, IsolateState>();

export function getIsolateState(id: number, base: string): IsolateState | undefined {
  return isolateStates.get(`${id}|${base}`);
}

// One log entry / undo step for every file a single Isolate or Split created.
export function recordIsolateChange(summary: string, items: { base: string; state: IsolateState }[]): void {
  // pushLogEntry owns its own copy of affected now, so point at the log row's
  // copy; the global undo record gets an independent row carrying the same id.
  const logEntry = pushLogEntry({ type: 'isolate-image', summary, affected: items.map((it) => ({ base: it.base })) });
  for (const a of logEntry.affected) a.logId = logEntry.id;
  for (const it of items) isolateStates.set(`${logEntry.id}|${it.base}`, it.state);
  undoStack.push({ type: 'isolate-image', summary, affected: items.map((it) => ({ base: it.base, logId: logEntry.id })) });
  redoStack = [];
  updateUndoRedoButtons();
}

export function recordPixelChange(type: string, summary: string, base: string, state: PixelState): void {
  const logEntry = pushLogEntry({ type, summary, affected: [{ base }] });
  logEntry.affected[0].logId = logEntry.id;
  pixelStates.set(logEntry.id, state);
  undoStack.push({ type, summary, affected: [{ base, logId: logEntry.id }] });
  redoStack = [];
  updateUndoRedoButtons();
}

export async function applyPixelDirection(affected: EditLogAffected[], direction: 'undo' | 'redo'): Promise<number> {
  let count = 0;
  for (const a of affected){
    const e = entryForAffected(a);
    const st = typeof a.logId === 'number' ? pixelStates.get(a.logId) : undefined;
    if (!e || !st) continue;
    const bytes = direction === 'undo' ? st.prev : st.next;
    try {
      await writeBytes(e.imgHandle, bytes);
    } catch {
      continue;
    }
    try { URL.revokeObjectURL(e.objectUrl); } catch { /* best effort */ }
    e.objectUrl = URL.createObjectURL(new Blob([bytes as BlobPart], { type: st.mime }));
    if (direction === 'undo') { e.width = st.prevW; e.height = st.prevH; }
    else { e.width = st.nextW; e.height = st.nextH; }
    count++;
  }
  // Grid refreshes; an open card modal keeps showing its own copy until it
  // re-renders — same staleness tag-undo already has there, not a new gap.
  if (count) renderCurrentViewRef();
  return count;
}

let getEntries: () => Entry[] = () => [];
let getEntryByBase: (base: string) => Entry | undefined = () => undefined;
let getDirHandle: () => DirHandle | null = () => null;
let getDisabledDirHandle: () => DirHandle | null = () => null;
let setDisabledDirHandle: (h: DirHandle) => void = () => {};
let getOriginalDirHandle: () => DirHandle | null = () => null;
let reindexEntry: (oldBase: string, newBase: string) => void = () => {};
let resetSingleIndex: () => void = () => {};
let refreshStatsRef: () => void = () => {};
let refreshAllUIRef: () => void = () => {};
let renderCurrentViewRef: () => void = () => {};
let applyIsolateDirectionRef: (affected: EditLogAffected[], direction: 'undo' | 'redo') => Promise<number> = async () => 0;
let applyFlaggedReviewDirectionRef: (affected: EditLogAffected[], direction: 'undo' | 'redo') => number = () => 0;

// ---------------- Autosave ----------------
// Off by default. When on, every markDirty() schedules a debounced
// saveAllDirty(silent) a moment after the user stops editing, instead of
// waiting for a manual Save click — safe to rely on since every change is
// already in the Edit Log with its own undo regardless of whether the
// underlying .txt has been physically written yet (see Settings' own
// wording for this toggle).
const AUTOSAVE_KEY = 'dts-autosave';
(function initAutosavePref(){
  let on = false;
  on = getBool(AUTOSAVE_KEY);
  autosaveToggle.checked = on;
})();
autosaveToggle.addEventListener('change', () => {
  setBool(AUTOSAVE_KEY, autosaveToggle.checked);
});
let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
const AUTOSAVE_DEBOUNCE_MS = 1200;
function scheduleAutosave(): void {
  if (!autosaveToggle.checked) return;
  if (autosaveTimer !== null) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => { saveAllDirty(true); }, AUTOSAVE_DEBOUNCE_MS);
}

export function markDirty(entry: Entry): void {
  // Every tag-mutating action in the app — add/remove, Quick Merge, Unify/
  // Void, Master Tags, WD14, undo/redo — calls markDirty() right after
  // changing entry.tags, making this THE single funnel point where the
  // Retroactive Merge/Void dock's standing rules (canonical-tags.ts) can
  // catch a child tag showing up "by any means" and rewrite it, without
  // needing a call threaded into every one of those sites individually.
  applyCanonicalRules(entry);
  entry.dirty = true;
  updateDirtyUI();
  scheduleAutosave();
}

// Whether the Retroactive Merge/Void dock's rules file
// (_dts_canonical_tags.json) has changes not yet written to disk. Rule edits
// used to save immediately on every toggle, bypassing the app's own Save/
// autosave system entirely — now they're a dirty action like any tag edit:
// markRulesDirty() (called from canonical-tags.ts via the same deps-injection
// pattern as markDirty above, since that module can't import this one back)
// just flags it and folds into the SAME dirty indicator, Save button, and
// autosave debounce as everything else, actually persisted by saveAllDirty()
// below.
export let rulesDirty = false;
export function markRulesDirty(): void {
  rulesDirty = true;
  updateDirtyUI();
  scheduleAutosave();
}
// Called from index.ts right after loadCanonicalRulesForFolder() (folder
// load/unload) — that call replaces `canonicalRules` wholesale with the new
// dataset's own (already-saved) rules, so any pending rulesDirty from the
// PREVIOUS dataset (e.g. the user chose "switch anyway" and discarded it)
// must not linger and misrepresent the new dataset's actual save state.
export function resetRulesDirty(): void {
  rulesDirty = false;
  updateDirtyUI();
}

export function updateDirtyUI(): void {
  const dirtyCount = getEntries().filter(e=>e.dirty).length;
  let label;
  if (rulesDirty && dirtyCount > 0) label = `(${dirtyCount} + rules)`;
  else if (rulesDirty) label = '(rules)';
  else label = `(${dirtyCount})`;
  dirtyCountEl.textContent = label;
  btnSave.disabled = dirtyCount === 0 && !rulesDirty;
}

export function resetImageEdits(entry: Entry): void {
  // An original_images/ copy shares its Gallery twin's stem: match the flag too.
  const mine = (a: EditLogAffected) => a.base === entry.base && !!a.original === !!entry.original;
  const relevant = editLog.filter(le =>
    le.affected && le.affected.some(a => mine(a) && a.prevTags) &&
    le.type !== 'restore' && le.type !== 'disable' && le.type !== 'undo' && le.type !== 'redo' && le.type !== 'reset-edits'
  );
  if (relevant.length === 0){ toast('No edit history found for this image yet.'); return; }
  const first = relevant[0];
  const affectedItem = first.affected.find(a => mine(a) && a.prevTags);
  const prevTags = entry.tags.slice();
  entry.tags = affectedItem!.prevTags!.slice();
  markDirty(entry);
  recordChange('reset-edits', `Reset ${entry.imgName} to its earliest known tag state.`,
    [{ base: entry.base, prevTags, newTags: entry.tags.slice() }]);
  refreshAllUIRef();
  toast('Reverted this image to its earliest known state.');
}

// Commas separate tags: "1girl, red eyes, plump" adds three. Captions are
// stored comma-separated, so a comma can never be part of a real tag —
// splitting here covers every "+ add tag" field (cards, modal, Single,
// sequential) in one place. All the new tags land as ONE edit (one
// undo step, one log row).
export function addTagToEntry(entry: Entry, raw: string): void {
  const parts = raw.split(',').map(t => t.trim().replace(/_/g, ' ').replace(/\s+/g, ' ')).filter(Boolean);
  if (!parts.length) return;
  // A standing Retroactive Merge/Void rule covering a typed tag (respecting the
  // rule's own enabled/child-toggle state and this entry's Merge Immunize/
  // Antivoid flags) corrects it on the spot: markDirty() below runs the rules,
  // so a merged child becomes its canonical tag and a voided one is dropped.
  // Typing the rule's canonical tag is never affected (findBlockingRule()).
  const corrected: { tag: string; canonical: string | null }[] = [];
  const prevTags = entry.tags.slice();
  for (const tag of parts){
    const rule = findBlockingRule(tag, entry);
    if (rule) corrected.push({ tag, canonical: rule.canonical });
    if (entry.tags.includes(tag)) continue;
    entry.tags.push(tag);
  }
  markDirty(entry);
  const added = entry.tags.filter((t: string) => !prevTags.includes(t));
  if (corrected.length){
    const msg = corrected.map(c => c.canonical ? `"${c.tag}" → "${c.canonical}"` : `"${c.tag}" removed`).join(', ');
    toast(`Rule applied: ${msg} (see the merge/void dock).`, 3600);
  }
  if (!added.length) return;
  refreshStatsRef();
  const what = added.length === 1 ? `tag "${added[0]}"` : `${added.length} tags (${added.join(', ')})`;
  recordChange('add-tag', `Added ${what} to ${entry.imgName}`,
    [{ base: entry.base, prevTags, newTags: entry.tags.slice() }]);
  trackStat('tags_added', added.length);
  checkAchievements();
}

export function removeTagFromEntry(entry: Entry, tag: string): void {
  const i = entry.tags.indexOf(tag);
  if (i !== -1){
    const prevTags = entry.tags.slice();
    entry.tags.splice(i, 1);
    markDirty(entry);
    refreshStatsRef();
    recordChange('remove-tag', `Removed tag "${tag}" from ${entry.imgName}`,
      [{ base: entry.base, prevTags, newTags: entry.tags.slice() }]);
    trackStat('tags_removed');
    checkAchievements();
  }
}

export function removeAllTagsFromEntry(entry: Entry): void {
  if (entry.tags.length === 0){ toast('This image has no tags to remove.'); return; }
  const prevTags = entry.tags.slice();
  const count = prevTags.length;
  entry.tags = [];
  markDirty(entry);
  refreshStatsRef();
  recordChange('remove-tag', `Removed all ${count} tag(s) from ${entry.imgName}`,
    [{ base: entry.base, prevTags, newTags: [] }]);
  trackStat('tags_removed', count);
  checkAchievements();
}

export function recordChange(type: string, summary: string, affected: EditLogAffected[], extra: Record<string, unknown> = {}): ChangeRecord {
  // The undo/redo record and the log entry must not share one mutable array
  // with each other or with the caller — a later mutation to one would
  // silently rewrite the others. Each keeps its own copy.
  const record = { type, summary, affected: affected.map((a) => ({ ...a })), ...extra };
  undoStack.push(record);
  redoStack = [];
  updateUndoRedoButtons();
  pushLogEntry({ type, summary, affected, ...extra });
  return record;
}

// Files that changed stem (Rename all, or a rename undone/redone from the Log) are
// still named by their OLD stem in every other record — the undo/redo stacks, older
// log rows, isolate payload keys — so those would resolve to nothing, or to a
// different image that now has that name. Rewrite them in one pass (one map, so a
// permuted renumbering can't chain). `skip` = the rename's own rows, which keep
// prevBase/base as their own before/after.
export function remapBases(map: Map<string, string>, skip: EditLogAffected[] = []): void {
  if (!map.size) return;
  const skipSet = new Set(skip);
  const restem = (name: string | undefined, oldBase: string, newBase: string): string | undefined => {
    if (!name) return name;
    const i = name.lastIndexOf('.');
    return (i === -1 ? name : name.slice(0, i)) === oldBase ? newBase + (i === -1 ? '' : name.slice(i)) : name;
  };
  const fix = (a: EditLogAffected): void => {
    if (skipSet.has(a)) return;
    const next = map.get(a.base);
    if (next === undefined) return;
    a.newImgName = restem(a.newImgName, a.base, next);
    a.newTxtName = restem(a.newTxtName, a.base, next);
    a.base = next;
  };
  for (const r of [...undoStack, ...redoStack]) r.affected.forEach(fix);
  for (const le of editLog) (le.affected || []).forEach(fix);
  for (const [key, st] of Array.from(isolateStates)){
    const bar = key.indexOf('|');
    const next = map.get(key.slice(bar + 1));
    if (next === undefined) continue;
    isolateStates.delete(key);
    isolateStates.set(`${key.slice(0, bar)}|${next}`, st);
  }
  saveEditLog();
}

// entryByBase maps a stem to the Gallery image, but an original_images/ copy
// shares that stem — a log entry made on the original says so, and resolves
// to it instead.
function entryForAffected(a: EditLogAffected): Entry | undefined {
  if (a.original) return getEntries().find(e => e.original && e.base === a.base);
  return getEntryByBase(a.base);
}

// Resolve an affected row to its loaded image, or undefined when the image is
// gone. The Log panel's per-image stack modal greys out a missing image's own
// undo/redo and shows "Image not found in Dataset". Same resolution the
// appliers use.
export function resolveAffected(a: EditLogAffected): Entry | undefined {
  return entryForAffected(a);
}

// Reverses (or re-applies) only what that edit itself changed: the tags it added
// come off, the ones it removed go back at their old position. Setting the whole
// before/after snapshot instead wiped every later edit to the image when an older
// row was undone from the Log (or the Undo stack ran under a rule sweep / Log
// action). Counts only images that actually changed.
export function applyTagDirection(affected: EditLogAffected[], direction: string): number {
  let count = 0;
  for (const a of affected){
    const e = entryForAffected(a);
    if (!e || !a.prevTags || !a.newTags) continue;
    const from = direction === 'undo' ? a.newTags : a.prevTags;
    const to = direction === 'undo' ? a.prevTags : a.newTags;
    const drop = new Set(from.filter(t => !to.includes(t)));
    const tags = e.tags.filter(t => !drop.has(t));
    to.forEach((t, i) => { if (!from.includes(t) && !tags.includes(t)) tags.splice(Math.min(i, tags.length), 0, t); });
    if (tags.length === e.tags.length && tags.every((t, i) => t === e.tags[i])) continue;
    e.tags = tags;
    markDirty(e);
    count++;
  }
  return count;
}

export function updateUndoRedoButtons(): void {
  btnUndo.disabled = undoStack.length === 0;
  btnRedo.disabled = redoStack.length === 0;
}

export function resetUndoRedo(): void {
  undoStack = [];
  redoStack = [];
  pixelStates.clear();
  isolateStates.clear();
}

async function ensureDisabledDir(): Promise<DirHandle> {
  let disabledDirHandle = getDisabledDirHandle();
  if (!disabledDirHandle){
    disabledDirHandle = await getDirHandle()!.getDirectoryHandle('Disabled', { create: true });
    setDisabledDirHandle(disabledDirHandle);
  }
  return disabledDirHandle;
}

export async function moveEntry(entry: Entry, toDisabled: boolean, opts?: { silent?: boolean }): Promise<void> {
  const dirHandle = getDirHandle();
  if (!dirHandle) return;
  // Originals live in original_images/, not Disabled/, and are a paired copy of
  // a bucketed image — disable/restore is meaningless for them (the Bucket
  // Images dock's Revert is what moves them back).
  if (entry.original){ toast('Originals images are managed by the Bucket Images tool.'); return; }
  const silent = !!opts?.silent;
  try {
    const targetDir = toDisabled ? await ensureDisabledDir() : dirHandle;
    const sourceDir = toDisabled ? dirHandle : getDisabledDirHandle();

    const file = await entry.imgHandle.getFile();
    const newImgHandle = await targetDir.getFileHandle(entry.imgName!, { create: true });
    await writeBytes(newImgHandle, file);

    // A failed delete used to be swallowed, leaving the image in both folders
    // (see index.ts's finishInterruptedDisables, which cleans that up on the
    // next open). Retry once, since a just-read file can be briefly busy.
    let leftBehind = false;
    if (sourceDir){
      try { await sourceDir.removeEntry(entry.imgName!); }
      catch(e){
        await new Promise(r => setTimeout(r, 300));
        try { await sourceDir.removeEntry(entry.imgName!); } catch(e2){ leftBehind = true; }
      }
      try { await sourceDir.removeEntry(entry.txtName!); } catch(e){}
    }
    if (leftBehind) toast(`Couldn't remove the old copy of "${entry.imgName}" (file in use?). It'll be cleaned up the next time this dataset opens.`, 4200);
    entry.imgHandle = newImgHandle;

    if (entry.tags.length > 0){
      const newTxtHandle = await targetDir.getFileHandle(entry.txtName!, { create: true });
      await writeBytes(newTxtHandle, entry.tags.join(', '));
      entry.txtHandle = newTxtHandle;
      entry.txtExisted = true;
    } else {
      entry.txtHandle = null;
      entry.txtExisted = false;
    }

    entry.dirty = false;
    entry.disabled = toDisabled;

    if (!silent){
      toast(toDisabled
        ? `Moved "${entry.imgName}" to Disabled/. Filename kept as-is, so restoring slots it right back in.`
        : `Restored "${entry.imgName}" to the dataset root.`, 3200);
      pushLogEntry({
        type: toDisabled ? 'disable' : 'restore',
        summary: toDisabled ? `Disabled ${entry.imgName}` : `Restored ${entry.imgName}`,
        affected: [{ base: entry.base }]
      });
    }
    trackStat(toDisabled ? 'disables' : 'restores');
    const mc = folderStats.moveCounts || {};
    mc[entry.base] = (mc[entry.base] || 0) + 1;
    folderStats.moveCounts = mc;
    if (mc[entry.base] >= 6) folderStats.flag_indecisive = true;
    saveFolderStats();

    if (!silent){
      resetSingleIndex();
      refreshAllUIRef();
      checkAchievements();
    }
  } catch(err){
    if (silent) throw err;
    toast('Could not move that file — check folder permissions.', 3600);
  }
}

async function fileExists(dir: DirHandle, name: string): Promise<boolean> {
  try { await dir.getFileHandle(name, { create: false }); return true; } catch { return false; }
}

// Copy-then-delete, so two guards matter: renaming a file to its own name must be a no-op (the copy
// would land on the same file and the delete would then remove it), and an existing target is never
// overwritten (it would silently replace another image).
async function renameFileInPlace(dir: DirHandle, oldName: string, newName: string): Promise<import('./types').FileHandle> {
  if (oldName === newName) return dir.getFileHandle(oldName, { create: false });
  const oldHandle = await dir.getFileHandle(oldName, { create: false });
  if (await fileExists(dir, newName)) throw new Error(`${newName} already exists.`);
  const file = await oldHandle.getFile();
  const newHandle = await dir.getFileHandle(newName, { create: true });
  await writeBytes(newHandle, file);
  await dir.removeEntry(oldName);
  return newHandle;
}

// WebP images get converted to PNG by "Rename all": WD14 (ComfyUI's tagger
// node and the on-device path) can't read WebP, and the rename is already a
// pass over every file. PNG is lossless, so nothing is lost beyond WebP's own
// compression; an animated WebP keeps its first frame.
export function isWebpName(name: string): boolean {
  return (name || '').toLowerCase().endsWith('.webp');
}

async function convertToPngInPlace(dir: DirHandle, oldName: string, newName: string): Promise<import('./types').FileHandle> {
  const oldHandle = await dir.getFileHandle(oldName, { create: false });
  const bitmap = await createImageBitmap(await oldHandle.getFile());
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
  bitmap.close();
  const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!png) throw new Error(`Could not convert ${oldName} to PNG.`);
  const newHandle = await dir.getFileHandle(newName, { create: true });
  await writeBytes(newHandle, png);
  await dir.removeEntry(oldName);
  return newHandle;
}

// Renames every currently-loaded image (+ its .txt, if any) to a simple
// zero-padded sequence — one continuous count across the active dataset
// root and Disabled/ (active first, each ordered by current filename,
// numeric-aware, matching the same comparator scanDirInto() (index.ts)
// already sorts a folder scan with) rather than two independently-numbered
// sequences, since "1" meaning two different things depending on which
// folder it's in would be confusing. Two-phase (real name -> a throwaway
// __dts_rename_tmp_N__ name -> final zero-padded name) so a target name
// can never collide with a not-yet-renamed original name or another
// entry's own target — the standard safe technique for a bulk in-place
// rename, and simpler than reasoning case-by-case about which collisions
// are actually possible.
export async function renameAllEntriesSequentially(): Promise<void> {
  const dirHandle = getDirHandle();
  if (!dirHandle){ toast('Open a dataset folder first.'); return; }
  const disabledDirHandle = getDisabledDirHandle();
  const byFilename = (a: Entry, b: Entry) => a.base.localeCompare(b.base, undefined, { numeric: true });
  // Originals are not renumbered on their own, but they ARE renamed to follow
  // their Gallery copy's new stem below — a pair is linked by stem, so leaving
  // the original under the old stem would orphan it (Trainflow then re-buckets
  // the Gallery image into a fresh, tagless copy).
  const originalByBase = new Map(getEntries().filter(e => e.original).map(e => [e.base, e] as const));
  const active = getEntries().filter(e => !e.disabled && !e.original).sort(byFilename);
  const disabled = getEntries().filter(e => e.disabled && !e.original).sort(byFilename);
  const ordered = [...active, ...disabled];
  if (ordered.length === 0){ toast('No images to rename.'); return; }

  const width = String(ordered.length).length;
  const extOf = (name: string): string => {
    const i = name.lastIndexOf('.');
    return i === -1 ? '' : name.slice(i);
  };

  interface RenamePlanItem {
    entry: Entry;
    dir: DirHandle;
    oldBase: string;
    oldImgName: string;
    oldTxtName: string | null;
    newBase: string;
    newImgName: string;
    newTxtName: string | null;
    toPng: boolean;
  }
  const plan: RenamePlanItem[] = ordered.map((entry, i) => {
    const newBase = String(i + 1).padStart(width, '0');
    const oldImgName = entry.imgName || entry.base;
    const toPng = isWebpName(oldImgName);
    return {
      entry,
      dir: entry.disabled ? disabledDirHandle! : dirHandle,
      oldBase: entry.base,
      oldImgName,
      oldTxtName: entry.txtHandle ? (entry.txtName || `${entry.base}.txt`) : null,
      newBase,
      newImgName: newBase + (toPng ? '.png' : extOf(oldImgName)),
      newTxtName: entry.txtHandle ? `${newBase}.txt` : null,
      toPng
    };
  });
  const converted = plan.filter(p => p.toPng).length;

  // Every source file must be on disk before anything moves. A stale entry (the folder changed since
  // it loaded, e.g. a failed earlier run) used to throw partway through and strand files at temp names.
  for (const p of plan){
    const missing = !(await fileExists(p.dir, p.oldImgName)) ? p.oldImgName
      : (p.oldTxtName && !(await fileExists(p.dir, p.oldTxtName))) ? p.oldTxtName : null;
    if (missing){
      toast(`${missing} isn't on disk any more — reload the dataset and try again. Nothing was renamed.`, 5200);
      return;
    }
  }
  // Temp names are unique to this run, so leftovers from an older run can never collide with them.
  const tmpOf = (i: number, ext: string) => `__dts_rename_${Date.now().toString(36)}_${i}__${ext}`;

  // Phase 1: every file to a unique temp name (WebP converted to PNG on the way, so phase 2 is a
  // plain rename for everything). A failure here moves the finished ones back: nothing is renamed.
  const moved: RenamePlanItem[] = [];
  try {
    for (let i = 0; i < plan.length; i++){
      const p = plan[i];
      p.entry.imgHandle = p.toPng
        ? await convertToPngInPlace(p.dir, p.oldImgName, tmpOf(i, '.png'))
        : await renameFileInPlace(p.dir, p.oldImgName, tmpOf(i, extOf(p.oldImgName)));
      moved.push(p);
      if (p.entry.txtHandle && p.oldTxtName){
        p.entry.txtHandle = await renameFileInPlace(p.dir, p.oldTxtName, tmpOf(i, '.txt'));
      }
    }
  } catch(err){
    for (const p of moved){
      try {
        p.entry.imgHandle = await renameFileInPlace(p.dir, p.entry.imgHandle.name, p.toPng ? `${p.oldBase}.png` : p.oldImgName);
        if (p.entry.txtHandle && p.oldTxtName) p.entry.txtHandle = await renameFileInPlace(p.dir, p.entry.txtHandle.name, p.oldTxtName);
      } catch { /* left at its temp name; it still loads as an image */ }
    }
    const why = err instanceof Error ? ` (${err.message})` : '';
    toast(`Rename stopped${why} — the files were put back. Close anything using the folder and try again.`, 5200);
    refreshAllUIRef();
    return;
  }

  // Phase 2: every temp name to its real final name. Each item stands alone: one failure leaves that
  // file at its temp name (it still loads, and the next Rename all fixes it) and the rest carry on.
  const affected: EditLogAffected[] = [];
  const stuck: string[] = [];
  const renamedPairs: { original: Entry; newBase: string }[] = [];
  for (const p of plan){
    try {
      p.entry.imgHandle = await renameFileInPlace(p.dir, p.entry.imgHandle.name, p.newImgName);
      if (p.entry.txtHandle){
        p.entry.txtHandle = await renameFileInPlace(p.dir, p.entry.txtHandle.name, p.newTxtName!);
      }
    } catch {
      stuck.push(p.oldImgName);
      continue;
    }
    const pairedOriginal = originalByBase.get(p.oldBase);
    if (pairedOriginal) renamedPairs.push({ original: pairedOriginal, newBase: p.newBase });
    reindexEntry(p.oldBase, p.newBase);
    p.entry.base = p.newBase;
    p.entry.imgName = p.newImgName;
    p.entry.txtName = `${p.newBase}.txt`;
    affected.push({
      base: p.newBase, prevBase: p.oldBase,
      // A converted WebP undoes to its old name as a .png: the conversion
      // itself is permanent, only the rename is undoable.
      prevImgName: p.toPng ? `${p.oldBase}.png` : p.oldImgName, newImgName: p.newImgName,
      prevTxtName: p.oldTxtName || undefined, newTxtName: p.newTxtName || undefined
    });
  }

  // Original images follow their Gallery copy's new stem, two-phase like above: renumbering can give
  // one original another's current name, and a stem that didn't change is left alone.
  const origDir = getOriginalDirHandle();
  if (origDir){
    const pairs = renamedPairs.filter(r => r.original.base !== r.newBase);
    const staged: { original: Entry; newBase: string; ext: string }[] = [];
    for (let i = 0; i < pairs.length; i++){
      const { original, newBase } = pairs[i];
      const ext = extOf(original.imgName || original.base);
      try {
        original.imgHandle = await renameFileInPlace(origDir, original.imgName || original.base, tmpOf(i, ext));
        if (original.txtHandle && original.txtName){
          original.txtHandle = await renameFileInPlace(origDir, original.txtName, tmpOf(i, '.txt'));
        }
        staged.push({ original, newBase, ext });
      } catch { stuck.push(`original_images/${original.imgName}`); }
    }
    for (const { original, newBase, ext } of staged){
      try {
        original.imgHandle = await renameFileInPlace(origDir, original.imgHandle.name, newBase + ext);
        if (original.txtHandle){
          original.txtHandle = await renameFileInPlace(origDir, original.txtHandle.name, `${newBase}.txt`);
        }
        original.base = newBase;
        original.imgName = newBase + ext;
        original.txtName = `${newBase}.txt`;
      } catch { stuck.push(`original_images/${original.imgName}`); }
    }
  }

  // Before this rename's own row is logged: every earlier record follows the new stems.
  remapBases(new Map(affected.map(a => [a.prevBase!, a.base] as const)));
  const convertedNote = converted ? ` ${converted} WebP image(s) converted to PNG.` : '';
  if (affected.length){
    pushLogEntry({
      type: 'rename-files',
      summary: `Renamed ${affected.length} image(s) to a simple 1-${ordered.length} sequence.${convertedNote}`,
      affected
    });
  }
  if (stuck.length){
    toast(`Renamed ${affected.length} image(s); ${stuck.length} couldn't be renamed and kept a temporary name (${stuck.slice(0, 3).join(', ')}${stuck.length > 3 ? '…' : ''}). Run Rename all again to finish.`, 6000);
  } else {
    toast(`Renamed ${affected.length} image(s).${convertedNote}`, 3600);
  }
  resetSingleIndex();
  refreshAllUIRef();
}

// Batch undo/redo for a 'rename-files' log entry (edit-log.ts, injected the
// same way applyTagDirection/moveEntry already are there — this file can't
// be imported back from edit-log.ts, which this file itself imports
// pushLogEntry/editLog from). Unlike the forward rename, no two-phase temp
// names are needed: every target name on either direction is one that was
// already proven unique at the time renameAllEntriesSequentially() ran (the
// original filenames going into 'undo', the "01".."NN" sequence going into
// 'redo'), so a plain one-at-a-time rename can't collide with another
// affected entry's own target.
export async function applyRenameDirection(affected: EditLogAffected[], direction: 'undo' | 'redo'): Promise<number> {
  const dirHandle = getDirHandle();
  if (!dirHandle) return 0;
  const disabledDirHandle = getDisabledDirHandle();
  const extOf = (name: string): string => {
    const i = name.lastIndexOf('.');
    return i === -1 ? '' : name.slice(i);
  };
  let count = 0;
  const moved = new Map<string, string>();
  for (const a of affected){
    if (!a.prevBase || !a.prevImgName || !a.newImgName) continue;
    const fromBase = direction === 'undo' ? a.base : a.prevBase;
    const toBase = direction === 'undo' ? a.prevBase : a.base;
    const entry = getEntryByBase(fromBase);
    if (!entry) continue;
    const dir = entry.disabled ? disabledDirHandle : dirHandle;
    if (!dir) continue;
    const fromImgName = direction === 'undo' ? a.newImgName : a.prevImgName;
    const toImgName = direction === 'undo' ? a.prevImgName : a.newImgName;
    try {
      entry.imgHandle = await renameFileInPlace(dir, fromImgName, toImgName);
      if (entry.txtHandle && a.prevTxtName && a.newTxtName){
        const fromTxtName = direction === 'undo' ? a.newTxtName : a.prevTxtName;
        const toTxtName = direction === 'undo' ? a.prevTxtName : a.newTxtName;
        entry.txtHandle = await renameFileInPlace(dir, fromTxtName, toTxtName);
        entry.txtName = toTxtName;
      }
      // The paired original followed the Gallery copy's rename; move it back
      // (or forward on redo) so the stem stays in sync.
      const origDir = getOriginalDirHandle();
      const pairedOriginal = getEntries().find(e => e.original && e.base === fromBase);
      if (origDir && pairedOriginal){
        const oldOrigName = pairedOriginal.imgName || pairedOriginal.base;
        const newOrigName = toBase + extOf(oldOrigName);
        try {
          pairedOriginal.imgHandle = await renameFileInPlace(origDir, oldOrigName, newOrigName);
          if (pairedOriginal.txtHandle && pairedOriginal.txtName){
            pairedOriginal.txtHandle = await renameFileInPlace(origDir, pairedOriginal.txtName, `${toBase}.txt`);
          }
          pairedOriginal.base = toBase;
          pairedOriginal.imgName = newOrigName;
          pairedOriginal.txtName = `${toBase}.txt`;
        } catch { /* leave the original; the next load heals by stem */ }
      }
      reindexEntry(fromBase, toBase);
      entry.base = toBase;
      entry.imgName = toImgName;
      moved.set(fromBase, toBase);
      count++;
    } catch(err){ /* skip this one, keep going with the rest of the batch */ }
  }
  // Other records follow the file; the rows applied here keep their own before/after.
  remapBases(moved, affected);
  return count;
}

// Retroactive merge/void catch-up (checkbox-driven, per-log-entry replay)
// was replaced by canonical-tags.ts's standing-rules dock — see its own
// header comment for why (this old system gave no visibility into what it
// was actually doing, and only caught up Disabled images retroactively at
// all if the user remembered to go find and click a replay button).

interface TagsEditDeps {
  getEntries: () => Entry[];
  getEntryByBase: (base: string) => Entry | undefined;
  getDirHandle: () => DirHandle | null;
  getDisabledDirHandle: () => DirHandle | null;
  setDisabledDirHandle: (h: DirHandle) => void;
  getOriginalDirHandle: () => DirHandle | null;
  reindexEntry: (oldBase: string, newBase: string) => void;
  resetSingleIndex: () => void;
  refreshStats: () => void;
  refreshAllUI: () => void;
  renderCurrentView: () => void;
  applyIsolateDirection: (affected: EditLogAffected[], direction: 'undo' | 'redo') => Promise<number>;
  applyFlaggedReviewDirection: (affected: EditLogAffected[], direction: 'undo' | 'redo') => number;
}

export function initTagsEdit(deps: TagsEditDeps): void {
  getEntries = deps.getEntries;
  getEntryByBase = deps.getEntryByBase;
  getDirHandle = deps.getDirHandle;
  getDisabledDirHandle = deps.getDisabledDirHandle;
  setDisabledDirHandle = deps.setDisabledDirHandle;
  getOriginalDirHandle = deps.getOriginalDirHandle;
  reindexEntry = deps.reindexEntry;
  resetSingleIndex = deps.resetSingleIndex;
  refreshStatsRef = deps.refreshStats;
  refreshAllUIRef = deps.refreshAllUI;
  renderCurrentViewRef = deps.renderCurrentView;
  applyIsolateDirectionRef = deps.applyIsolateDirection;
  applyFlaggedReviewDirectionRef = deps.applyFlaggedReviewDirection;

  btnUndo.addEventListener('click', async () => {
    if (undoRedoBusy) return;
    const record = undoStack.pop();
    if (!record) return;
    undoRedoBusy = true;
    try {
      // A Merge/Void's own rule would re-apply it the moment the tags come back.
      setUndoRuleTags(record, false);
      const count = PIXEL_TYPES.has(record.type)
        ? await applyPixelDirection(record.affected, 'undo')
        : ISOLATE_TYPES.has(record.type)
          ? await applyIsolateDirectionRef(record.affected, 'undo')
          : REVIEW_TYPES.has(record.type)
            ? applyFlaggedReviewDirectionRef(record.affected, 'undo')
            : applyTagDirection(record.affected, 'undo');
      if (count === 0){
        // Nothing changed (already undone from the Log, or its images are gone):
        // no phantom "Undid" row or stat — but the step still moves to Redo, so
        // a dead record can't sit on top and block every older undo.
        redoStack.push(record);
        updateUndoRedoButtons();
        toast('Nothing changed (already undone, or its images aren\'t loaded). Undo again for the step before it.', 3600);
        return;
      }
      redoStack.push(record);
      updateUndoRedoButtons();
      const summary = `Undid: ${record.summary}`;
      toast(summary);
      pushLogEntry({ type: 'undo', summary, affected: record.affected });
      trackStat('undos');
      refreshAllUIRef();
      checkAchievements();
    } finally {
      undoRedoBusy = false;
    }
  });

  btnRedo.addEventListener('click', async () => {
    if (undoRedoBusy) return;
    const record = redoStack.pop();
    if (!record) return;
    undoRedoBusy = true;
    try {
      const count = PIXEL_TYPES.has(record.type)
        ? await applyPixelDirection(record.affected, 'redo')
        : ISOLATE_TYPES.has(record.type)
          ? await applyIsolateDirectionRef(record.affected, 'redo')
          : REVIEW_TYPES.has(record.type)
            ? applyFlaggedReviewDirectionRef(record.affected, 'redo')
            : applyTagDirection(record.affected, 'redo');
      // After the tags are re-applied (resuming first would re-merge them itself,
      // leaving the redo nothing to change).
      setUndoRuleTags(record, true);
      if (count === 0){
        undoStack.push(record);
        updateUndoRedoButtons();
        toast('Nothing changed (already redone, or its images aren\'t loaded). Redo again for the next step.', 3600);
        return;
      }
      undoStack.push(record);
      updateUndoRedoButtons();
      const summary = `Redid: ${record.summary}`;
      toast(summary);
      pushLogEntry({ type: 'redo', summary, affected: record.affected });
      trackStat('redos');
      refreshAllUIRef();
      checkAchievements();
    } finally {
      undoRedoBusy = false;
    }
  });

  btnSave.addEventListener('click', () => saveAllDirty());
}

// ---------------- Unify/Void, parameterized per-caller ----------------
// Each Tag Pruner instance owns its own independent selection Set (see
// tag-pruner.ts) and renders its own Apply/Void row — these two functions
// used to be single click handlers closed over ONE shared selectedTagsRef;
// now the caller passes in whichever Set + name apply to its own row, and
// clears/re-renders on success. Logic itself is unchanged from before the
// per-pruner split.
export function applyUnifyToTags(tagsSet: Set<string>, unified: string): boolean {
  unified = (unified || '').trim();
  if (!unified){ toast('Enter a name for the unified tag first.'); return false; }
  if (tagsSet.size === 0){ toast('Select at least one tag to merge.'); return false; }

  const affected = [];
  for (const e of getEntries()){
    if (e.meta?.locked || (e.disabled && !includeDisabledToggle.checked)) continue;
    const hasAny = e.tags.some(t => tagsSet.has(t));
    if (!hasAny) continue;
    const prevTags = e.tags.slice();
    let newTags = e.tags.filter(t => !tagsSet.has(t));
    if (!newTags.includes(unified)) newTags.push(unified);
    e.tags = newTags;
    markDirty(e);
    affected.push({ base: e.base, original: e.original || undefined, prevTags, newTags: newTags.slice() });
  }

  const mergedTagsList = Array.from(tagsSet);
  const mergeSummary = `Merged ${tagsSet.size} tag(s) into "${unified}" across ${affected.length} image(s).`;
  toast(mergeSummary);
  recordChange('merge', mergeSummary, affected, { mergedTags: mergedTagsList, unifiedTag: unified });
  trackStat('merges');
  // Turns this one-off merge into a standing rule — see canonical-tags.ts.
  // Its own resweep also catches any Disabled image the loop above skipped
  // (e.g. "Also apply to Disabled images right now" was left unchecked).
  registerMergeRule(mergedTagsList, unified);
  tagsSet.clear();
  refreshAllUIRef();
  checkAchievements();
  return true;
}

export async function applyVoidToTags(tagsSet: Set<string>): Promise<boolean> {
  if (tagsSet.size === 0){ toast('Select at least one tag to void.'); return false; }
  const tagList = Array.from(tagsSet);
  const preview = tagList.length > 4
    ? `${tagList.slice(0,4).join(', ')}, +${tagList.length - 4} more`
    : tagList.join(', ');
  const ok = await showConfirmModal(
    `Permanently remove ${tagList.length} tag(s) from every image?\n\n${preview}\n\n` +
    `This deletes them outright — nothing is merged into a replacement tag. Use Undo right after if you change your mind.`,
    { okLabel: 'Void tags', danger: true }
  );
  if (!ok) return false;

  const affected = [];
  let voidedTagInstances = 0;
  for (const e of getEntries()){
    if (e.meta?.locked || (e.disabled && !includeDisabledToggle.checked)) continue;
    const hasAny = e.tags.some(t => tagsSet.has(t));
    if (!hasAny) continue;
    const prevTags = e.tags.slice();
    voidedTagInstances += e.tags.filter(t => tagsSet.has(t)).length;
    const newTags = e.tags.filter(t => !tagsSet.has(t));
    e.tags = newTags;
    markDirty(e);
    affected.push({ base: e.base, original: e.original || undefined, prevTags, newTags: newTags.slice() });
  }

  const voidSummary = `Voided ${tagsSet.size} tag(s), removed from ${affected.length} image(s).`;
  toast(voidSummary);
  recordChange('void', voidSummary, affected, { voidedTags: tagList });
  trackStat('voids');
  trackStat('voided_tag_instances', voidedTagInstances);
  checkVoidThemeAchievements(tagList, voidedTagInstances);
  // Turns this one-off void into a standing rule — see canonical-tags.ts.
  registerVoidRule(tagList);
  tagsSet.clear();
  refreshAllUIRef();
  checkAchievements();
  return true;
}

// Extracted from btnSave's own click handler so autosave (settings.ts) can
// call the exact same logic programmatically instead of dispatching a fake
// click. `silent` skips the toast — autosave firing after every keystroke-
// driven edit would otherwise spam one every time, unlike a deliberate
// manual Save click.
export async function saveAllDirty(silent = false){
  const dirHandle = getDirHandle();
  const disabledDirHandle = getDisabledDirHandle();
  const dirty = getEntries().filter(e => e.dirty);
  if (dirty.length === 0 && !rulesDirty) return;
  let ok = 0, fail = 0;
  if (rulesDirty){
    await saveCanonicalRules();
    rulesDirty = false;
  }
  for (const e of dirty){
    try {
      const targetDir = e.original ? getOriginalDirHandle() : (e.disabled ? disabledDirHandle : dirHandle);
      if (!targetDir) { fail++; continue; }
      if (!e.txtHandle){
        e.txtHandle = await targetDir.getFileHandle(e.txtName!, { create: true });
      }
      await writeBytes(e.txtHandle, e.tags.join(', '));
      e.dirty = false;
      e.txtExisted = true;
      ok++;
    } catch(err){
      fail++;
    }
  }
  updateDirtyUI();
  renderCurrentViewRef();
  if (ok > 0){
    trackStat('saves');
    checkAchievements();
  }
  if (!silent){
    const savedParts = [];
    if (ok > 0 || fail > 0) savedParts.push(fail === 0 ? `${ok} caption file(s)` : `${ok} caption file(s), failed ${fail}`);
    toast(savedParts.length ? `Saved ${savedParts.join(' and ')}.` : 'Saved Retroactive Merge/Void rule changes.', 3400);
  }
}

