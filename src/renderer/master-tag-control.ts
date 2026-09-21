// Phase B module: Master Tag Control (bulk apply/remove/conditional/rename/
// find-replace across the whole dataset, plus the selection mini-grid).
// `filteredEntries` and `renderCurrentView` stay owned by index.ts's core
// filtering/view code and are injected once via initMasterTagControl(),
// since index.ts's IIFE can't export them.
import type { Entry, EntryMeta } from './types';
import {
  masterSelectionSummary, masterMiniGrid, btnMasterSelectAll, btnMasterClearSelection,
  btnMasterLockSelected, btnMasterUnlockSelected, btnMasterDeleteSelected, btnMasterDisableSelected,
  btnMasterMergeImmunizeToggle, btnMasterAntivoidToggle, btnMasterAntimmunizeToggle,
  masterApplyTagInput, btnMasterApplyToSelected, masterRemoveTagInput, btnMasterRemoveFromSelected,
  condSourceTag, condAddTag, btnCondApply,
  condWithoutSourceTag, condWithoutAddTag, btnCondApplyWithout,
  massApplyInput, btnMassApply,
  massRemoveInput, btnMassRemove, masterRenameFrom, masterRenameTo, btnMasterRename,
  masterFRFind, masterFRReplace, btnMasterFR
} from './dom';
import { toast, showConfirmModal } from './shared-ui';
import { trackStat, checkAchievements, folderStats, saveFolderStats } from './achievements';
import { markDirty, recordChange } from './tags-edit';
import { attachFillAutocomplete } from './tags-autocomplete';

export let masterSelectedImages = new Set<string>();

let getEntries: () => Entry[] = () => [];
let getEntryByBase: (base: string) => Entry | undefined = () => undefined;
let filteredEntriesRef: () => Entry[] = () => [];
let renderCurrentViewRef: () => void = () => {};
let refreshAllUIRef: () => void = () => {};
let getEntryMeta: () => Record<string, EntryMeta> = () => ({});
let saveEntryMetaRef: () => void = () => {};
let deleteEntriesPermanentlyRef: (entries: Entry[]) => Promise<number> = async () => 0;
let disableEntriesRef: (entries: Entry[]) => Promise<number> = async () => 0;
// Set inside initMasterTagControl once the immunize toggle buttons exist —
// updateMasterSelectionText runs before that on the very first call in some
// init orders, so this starts as a no-op rather than referencing buttons
// that aren't wired yet.
let refreshImmunizeTogglesRef: () => void = () => {};

export function updateMasterSelectionText(): void {
  if (masterSelectedImages.size === 0){
    masterSelectionSummary.textContent = 'No images selected yet.';
  } else {
    masterSelectionSummary.textContent = `${masterSelectedImages.size} image(s) selected.`;
  }
  refreshImmunizeTogglesRef();
}

export function renderMasterMiniGrid(): void {
  masterMiniGrid.innerHTML = '';
  const list = filteredEntriesRef();
  list.forEach(e => {
    const cell = document.createElement('div');
    cell.className = 'master-mini-cell' + (masterSelectedImages.has(e.base) ? ' selected' : '');
    cell.dataset.base = e.base;
    const img = document.createElement('img');
    img.src = e.objectUrl;
    img.loading = 'lazy';
    cell.appendChild(img);
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'master-mini-cb';
    cb.checked = masterSelectedImages.has(e.base);
    cb.addEventListener('click', (ev) => ev.stopPropagation());
    cb.addEventListener('change', () => {
      if (cb.checked) masterSelectedImages.add(e.base);
      else masterSelectedImages.delete(e.base);
      cell.classList.toggle('selected', cb.checked);
      updateMasterSelectionText();
      renderCurrentViewRef();
    });
    cell.appendChild(cb);
    cell.addEventListener('click', () => {
      cb.checked = !cb.checked;
      cb.dispatchEvent(new Event('change'));
    });
    masterMiniGrid.appendChild(cell);
  });
}

export function syncMasterMiniGrid(): void {
  masterMiniGrid.querySelectorAll<HTMLElement>('.master-mini-cell').forEach(cell => {
    const base = cell.dataset.base!;
    const selected = masterSelectedImages.has(base);
    cell.classList.toggle('selected', selected);
    const cb = cell.querySelector('.master-mini-cb') as HTMLInputElement | null;
    if (cb) cb.checked = selected;
  });
}

export function renderMasterSelectionSummary(): void {
  updateMasterSelectionText();
  syncMasterMiniGrid();
}

interface MasterTagControlDeps {
  getEntries: () => Entry[];
  getEntryByBase: (base: string) => Entry | undefined;
  filteredEntries: () => Entry[];
  renderCurrentView: () => void;
  refreshAllUI: () => void;
  getEntryMeta: () => Record<string, EntryMeta>;
  saveEntryMeta: () => void;
  deleteEntriesPermanently: (entries: Entry[]) => Promise<number>;
  disableEntries: (entries: Entry[]) => Promise<number>;
  onStartSequential: (from: 'first' | 'selected') => void;
}

let onStartSequentialRef: (from: 'first' | 'selected') => void = () => {};

export function initMasterTagControl(deps: MasterTagControlDeps): void {
  getEntries = deps.getEntries;
  getEntryByBase = deps.getEntryByBase;
  filteredEntriesRef = deps.filteredEntries;
  renderCurrentViewRef = deps.renderCurrentView;
  refreshAllUIRef = deps.refreshAllUI;
  getEntryMeta = deps.getEntryMeta;
  saveEntryMetaRef = deps.saveEntryMeta;
  deleteEntriesPermanentlyRef = deps.deleteEntriesPermanently;
  disableEntriesRef = deps.disableEntries;
  onStartSequentialRef = deps.onStartSequential;

  // Sequential detail editing entry points — desktop-only (touch editing
  // lives in the card modal instead). Built in JS so neither shell's markup
  // changes; the shared .mtc-btn-row class keeps the spacing consistent.
  if (!document.documentElement.classList.contains('touch-device')){
    const seqRow = document.createElement('div');
    seqRow.className = 'mtc-btn-row';
    const seqFirstBtn = document.createElement('button');
    seqFirstBtn.textContent = '▶ Sequential from first';
    seqFirstBtn.title = 'Review every gallery image in sort order, confirming detail tags one by one';
    seqFirstBtn.addEventListener('click', () => onStartSequentialRef('first'));
    const seqSelBtn = document.createElement('button');
    seqSelBtn.textContent = '▶ Sequential from selected';
    seqSelBtn.title = 'Review from the first selected image in sort order';
    seqSelBtn.addEventListener('click', () => onStartSequentialRef('selected'));
    seqRow.appendChild(seqFirstBtn);
    seqRow.appendChild(seqSelBtn);
    masterSelectionSummary.after(seqRow);
  }

  // These 9 plain "type a tag name" fields used to rely on a native
  // <datalist> (dataset-scoped only — no global vocabulary, no
  // definitions, and this WebView's own rendering of it was reported
  // covering the field on mobile) — see notes/Mobile-Port.md. Same styled,
  // global-vocabulary autocomplete every other tag input in the app uses.
  for (const inp of [
    masterApplyTagInput, masterRemoveTagInput, condSourceTag, condAddTag,
    condWithoutSourceTag, condWithoutAddTag, massApplyInput, massRemoveInput, masterRenameFrom
  ]) attachFillAutocomplete(inp);

  btnMasterSelectAll.addEventListener('click', () => {
    for (const e of filteredEntriesRef()) masterSelectedImages.add(e.base);
    renderMasterSelectionSummary();
    renderCurrentViewRef();
  });
  btnMasterClearSelection.addEventListener('click', () => {
    masterSelectedImages.clear();
    renderMasterSelectionSummary();
    renderCurrentViewRef();
  });

  // Locking is the one selection-based action that's exempt from the
  // lock/mass-tool relationship it's managing — mass-LOCKING a hand-picked
  // selection is exactly how you'd want to lock a batch in the first place,
  // so this doesn't skip already-locked (or, for unlock, already-unlocked)
  // entries the way every other mass tool skips locked ones.
  function setLockedForSelection(locked: boolean): void {
    if (masterSelectedImages.size === 0){ toast('Select at least one image first.'); return; }
    const meta = getEntryMeta();
    let changed = 0;
    for (const base of masterSelectedImages){
      const e = getEntryByBase(base);
      if (!e) continue;
      if (!e.meta) e.meta = {};
      if (!!e.meta?.locked === locked) continue;
      e.meta.locked = locked;
      meta[e.base] = e.meta;
      changed++;
    }
    if (changed === 0){ toast(`Nothing to ${locked ? 'lock' : 'unlock'} — already ${locked ? 'locked' : 'unlocked'}.`); return; }
    saveEntryMetaRef();
    toast(`${locked ? 'Locked' : 'Unlocked'} ${changed} image(s).`);
    renderCurrentViewRef();
  }
  btnMasterLockSelected.addEventListener('click', () => setLockedForSelection(true));
  btnMasterUnlockSelected.addEventListener('click', () => setLockedForSelection(false));

  // Disable moves selected images to Disabled/ (soft, restorable — same
  // move the single-card 3-dot menu does, view.ts's moveEntry(e, true)).
  // Paired with Delete below since both are "get this out of my active set"
  // actions, just at different permanence levels. Locked images are
  // silently skipped, same convention as every other mass tool.
  btnMasterDisableSelected.addEventListener('click', async () => {
    if (masterSelectedImages.size === 0){ toast('Select at least one image first.'); return; }
    const total = masterSelectedImages.size;
    const entriesList = Array.from(masterSelectedImages).map(base => getEntryByBase(base)).filter((e): e is Entry => !!e);
    const moved = await disableEntriesRef(entriesList);
    if (moved === 0){ toast('Nothing to disable — every selected image is already disabled or locked.'); return; }
    const skipped = total - moved;
    toast(skipped > 0
      ? `Disabled ${moved} image(s) — ${skipped} skipped (locked or already disabled).`
      : `Disabled ${moved} image(s).`, 3600);
    renderMasterSelectionSummary();
    renderCurrentViewRef();
  });

  // Permanently deletes every selected image + its tags from disk — unlike
  // every other mass action here, there's no Undo for this one, so the
  // confirm modal names the exact count and is danger-styled. Locked images
  // are silently skipped (see deleteEntriesPermanently() in index.ts) same
  // as any other mass tool; the toast reports that split if it happened.
  btnMasterDeleteSelected.addEventListener('click', async () => {
    if (masterSelectedImages.size === 0){ toast('Select at least one image first.'); return; }
    const total = masterSelectedImages.size;
    const ok = await showConfirmModal(
      `Permanently delete ${total} selected image(s) and their tags? This cannot be undone — the files are removed from disk, not moved to Disabled/. Locked images will be skipped.`,
      { okLabel: `Delete ${total} permanently`, danger: true }
    );
    if (!ok) return;
    const entriesList = Array.from(masterSelectedImages).map(base => getEntryByBase(base)).filter((e): e is Entry => !!e);
    const deleted = await deleteEntriesPermanentlyRef(entriesList);
    if (deleted === 0){ toast('Nothing deleted — every selected image is locked.'); return; }
    const skipped = total - deleted;
    toast(skipped > 0
      ? `Permanently deleted ${deleted} image(s) — ${skipped} skipped (locked).`
      : `Permanently deleted ${deleted} image(s).`, 3600);
    renderMasterSelectionSummary();
    renderCurrentViewRef();
  });

  // Merge Immunize / Antivoid — a PERMANENT per-image exception to the
  // Retroactive Merge/Void dock's standing rules (canonical-tags.ts), unlike
  // Lock which only skips mass tools in general. "Antimmunize" is a
  // convenience shortcut that sets/clears both flags together, not a third
  // independent flag — see canonical-tags.ts's applyCanonicalRules() for
  // where these are actually checked.
  function setEntryFlagsForSelection(flags: Record<string, boolean>, actionLabel: string): void {
    if (masterSelectedImages.size === 0){ toast('Select at least one image first.'); return; }
    const meta = getEntryMeta();
    let changed = 0;
    for (const base of masterSelectedImages){
      const e = getEntryByBase(base);
      if (!e) continue;
      if (!e.meta) e.meta = {};
      const keys = Object.keys(flags);
      if (keys.every(k => !!(e.meta as Record<string, unknown>)[k] === flags[k])) continue;
      for (const k of keys) (e.meta as Record<string, unknown>)[k] = flags[k];
      meta[e.base] = e.meta;
      changed++;
    }
    if (changed === 0){ toast(`Nothing to change — already ${actionLabel}.`); return; }
    saveEntryMetaRef();
    toast(`${actionLabel[0].toUpperCase()}${actionLabel.slice(1)} ${changed} image(s).`);
    renderCurrentViewRef();
  }

  // Each pair of "Merge Immunize"/"Un-immunize" style buttons collapsed into
  // one toggle: label and title flip based on whether every CURRENTLY
  // selected image already carries the flag(s), same tri-state-checkbox
  // convention as most mass toggles. Mixed selections (some flagged, some
  // not) read as "off" — clicking sets the flag on all of them, which is the
  // useful behavior for a mixed batch (a second click then clears it once
  // they're uniform). refreshImmunizeToggles() re-evaluates the labels on
  // every selection change (called from updateMasterSelectionText below),
  // so they stay accurate as the user clicks through the gallery.
  function computeAllHaveFlags(flags: string[]): boolean {
    if (masterSelectedImages.size === 0) return false;
    for (const base of masterSelectedImages){
      const e = getEntryByBase(base);
      if (!e) return false;
      for (const f of flags){
        if (!(e.meta as Record<string, unknown> | undefined)?.[f]) return false;
      }
    }
    return true;
  }
  interface ImmunizeToggle {
    btn: HTMLButtonElement;
    flags: string[];
    offLabel: string; onLabel: string;
    offTitle: string; onTitle: string;
    onActionLabel: string; offActionLabel: string;
  }
  const immunizeToggles: ImmunizeToggle[] = [
    {
      btn: btnMasterMergeImmunizeToggle, flags: ['mergeImmune'],
      offLabel: '🚫 Merge Immunize', onLabel: '↩ Un-immunize',
      offTitle: 'Merge rules will never rewrite tags on the selected images',
      onTitle: 'Remove Merge Immunize from the selected images',
      onActionLabel: 'merge immunized', offActionLabel: 'un-merge-immunized'
    },
    {
      btn: btnMasterAntivoidToggle, flags: ['antivoid'],
      offLabel: '🟢 Antivoid', onLabel: '↩ Un-antivoid',
      offTitle: 'Void rules will never remove tags from the selected images',
      onTitle: 'Remove Antivoid from the selected images',
      onActionLabel: 'antivoided', offActionLabel: 'un-antivoided'
    },
    {
      btn: btnMasterAntimmunizeToggle, flags: ['mergeImmune', 'antivoid'],
      offLabel: '✋ Antimmunize', onLabel: '↩ Un-antimmunize',
      offTitle: 'Shortcut for both Merge Immunize AND Antivoid at once, on the selected images',
      onTitle: 'Clear both Merge Immunize and Antivoid from the selected images',
      onActionLabel: 'antimmunized', offActionLabel: 'un-antimmunized'
    }
  ];
  function refreshImmunizeToggles(): void {
    for (const t of immunizeToggles){
      const allOn = computeAllHaveFlags(t.flags);
      t.btn.textContent = allOn ? t.onLabel : t.offLabel;
      t.btn.title = allOn ? t.onTitle : t.offTitle;
      t.btn.classList.toggle('ghost-secondary', allOn);
    }
  }
  refreshImmunizeTogglesRef = refreshImmunizeToggles;
  for (const t of immunizeToggles){
    t.btn.addEventListener('click', () => {
      const turnOn = !computeAllHaveFlags(t.flags);
      const flagsObj: Record<string, boolean> = {};
      for (const f of t.flags) flagsObj[f] = turnOn;
      setEntryFlagsForSelection(flagsObj, turnOn ? t.onActionLabel : t.offActionLabel);
      refreshImmunizeToggles();
    });
  }
  refreshImmunizeToggles();

  btnMasterApplyToSelected.addEventListener('click', () => {
    const tag = masterApplyTagInput.value.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
    if (!tag){ toast('Enter a tag to apply.'); return; }
    if (masterSelectedImages.size === 0){ toast('Select at least one image first.'); return; }
    const affected = [];
    for (const base of masterSelectedImages){
      const e = getEntryByBase(base);
      if (!e || e.meta?.locked || e.tags.includes(tag)) continue;
      const prevTags = e.tags.slice();
      e.tags.push(tag);
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: e.tags.slice() });
    }
    if (affected.length === 0){ toast('Nothing to apply — selected images already have that tag.'); return; }
    const summary = `Applied "${tag}" to ${affected.length} selected image(s).`;
    toast(summary);
    recordChange('add-tag', summary, affected);
    folderStats.master_ops = (folderStats.master_ops || 0) + 1;
    saveFolderStats();
    masterApplyTagInput.value = '';
    refreshAllUIRef();
    checkAchievements();
  });

  btnMasterRemoveFromSelected.addEventListener('click', () => {
    const tag = masterRemoveTagInput.value.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
    if (!tag){ toast('Enter a tag to remove.'); return; }
    if (masterSelectedImages.size === 0){ toast('Select at least one image first.'); return; }
    const affected = [];
    for (const base of masterSelectedImages){
      const e = getEntryByBase(base);
      if (!e || e.meta?.locked || !e.tags.includes(tag)) continue;
      const prevTags = e.tags.slice();
      e.tags = e.tags.filter(t => t !== tag);
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: e.tags.slice() });
    }
    if (affected.length === 0){ toast('None of the selected images have that tag.'); return; }
    const summary = `Removed "${tag}" from ${affected.length} selected image(s).`;
    toast(summary);
    recordChange('remove-tag', summary, affected);
    folderStats.master_ops = (folderStats.master_ops || 0) + 1;
    saveFolderStats();
    masterRemoveTagInput.value = '';
    refreshAllUIRef();
    checkAchievements();
  });

  btnCondApply.addEventListener('click', () => {
    const sourceTag = condSourceTag.value.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
    const addTag = condAddTag.value.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
    if (!sourceTag || !addTag){ toast('Fill in both tags.'); return; }
    const affected = [];
    for (const e of getEntries()){
      if (e.disabled || e.meta?.locked) continue;
      if (!e.tags.includes(sourceTag) || e.tags.includes(addTag)) continue;
      const prevTags = e.tags.slice();
      e.tags.push(addTag);
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: e.tags.slice() });
    }
    if (affected.length === 0){ toast(`No images with "${sourceTag}" are missing "${addTag}".`); return; }
    const summary = `Added "${addTag}" to every image with "${sourceTag}" (${affected.length} image(s)).`;
    toast(summary);
    recordChange('add-tag', summary, affected);
    folderStats.master_ops = (folderStats.master_ops || 0) + 1;
    saveFolderStats();
    condSourceTag.value = ''; condAddTag.value = '';
    refreshAllUIRef();
    checkAchievements();
  });

  btnCondApplyWithout.addEventListener('click', () => {
    const sourceTag = condWithoutSourceTag.value.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
    const addTag = condWithoutAddTag.value.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
    if (!sourceTag || !addTag){ toast('Fill in both tags.'); return; }
    const affected = [];
    for (const e of getEntries()){
      if (e.disabled || e.meta?.locked) continue;
      if (e.tags.includes(sourceTag) || e.tags.includes(addTag)) continue;
      const prevTags = e.tags.slice();
      e.tags.push(addTag);
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: e.tags.slice() });
    }
    if (affected.length === 0){ toast(`No images without "${sourceTag}" are missing "${addTag}".`); return; }
    const summary = `Added "${addTag}" to every image WITHOUT "${sourceTag}" (${affected.length} image(s)).`;
    toast(summary);
    recordChange('add-tag', summary, affected);
    folderStats.master_ops = (folderStats.master_ops || 0) + 1;
    saveFolderStats();
    condWithoutSourceTag.value = ''; condWithoutAddTag.value = '';
    refreshAllUIRef();
    checkAchievements();
  });

  btnMassApply.addEventListener('click', async () => {
    const tag = massApplyInput.value.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
    if (!tag){ toast('Enter a tag to apply.'); return; }
    const ok = await showConfirmModal(`Add "${tag}" to EVERY active image in this folder?`, { okLabel: 'Apply to all' });
    if (!ok) return;
    const affected = [];
    for (const e of getEntries()){
      if (e.disabled || e.meta?.locked || e.tags.includes(tag)) continue;
      const prevTags = e.tags.slice();
      e.tags.push(tag);
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: e.tags.slice() });
    }
    if (affected.length === 0){ toast('Every image already has that tag.'); return; }
    const summary = `Added "${tag}" to all ${affected.length} image(s).`;
    toast(summary);
    recordChange('add-tag', summary, affected);
    folderStats.master_ops = (folderStats.master_ops || 0) + 1;
    saveFolderStats();
    massApplyInput.value = '';
    refreshAllUIRef();
    checkAchievements();
  });

  btnMassRemove.addEventListener('click', async () => {
    const tag = massRemoveInput.value.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
    if (!tag){ toast('Enter a tag to remove.'); return; }
    const ok = await showConfirmModal(`Remove "${tag}" from EVERY active image in this folder?`, { okLabel: 'Remove from all', danger: true });
    if (!ok) return;
    const affected = [];
    for (const e of getEntries()){
      if (e.disabled || e.meta?.locked || !e.tags.includes(tag)) continue;
      const prevTags = e.tags.slice();
      e.tags = e.tags.filter(t => t !== tag);
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: e.tags.slice() });
    }
    if (affected.length === 0){ toast('No images have that tag.'); return; }
    const summary = `Removed "${tag}" from all ${affected.length} image(s).`;
    toast(summary);
    recordChange('remove-tag', summary, affected);
    folderStats.master_ops = (folderStats.master_ops || 0) + 1;
    saveFolderStats();
    massRemoveInput.value = '';
    refreshAllUIRef();
    checkAchievements();
  });

  btnMasterRename.addEventListener('click', () => {
    const from = masterRenameFrom.value.trim();
    const to = masterRenameTo.value.trim();
    if (!from || !to){ toast('Enter both a tag to rename and its replacement.'); return; }
    if (from === to){ toast('New name is the same as the old one.'); return; }
    const affected = [];
    for (const e of getEntries()){
      if (e.disabled || e.meta?.locked || !e.tags.includes(from)) continue;
      const prevTags = e.tags.slice();
      let newTags = e.tags.map(t => t === from ? to : t);
      newTags = Array.from(new Set(newTags));
      e.tags = newTags;
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: newTags.slice() });
    }
    if (affected.length === 0){ toast(`No active images currently have the tag "${from}".`); return; }
    const summary = `Renamed "${from}" → "${to}" across ${affected.length} image(s).`;
    toast(summary);
    recordChange('rename', summary, affected);
    folderStats.master_ops = (folderStats.master_ops || 0) + 1;
    saveFolderStats();
    trackStat('renames');
    masterRenameFrom.value = ''; masterRenameTo.value = '';
    refreshAllUIRef();
    checkAchievements();
  });

  btnMasterFR.addEventListener('click', () => {
    const find = masterFRFind.value;
    const repl = masterFRReplace.value;
    if (!find){ toast('Enter a substring to find.'); return; }
    const affected = [];
    for (const e of getEntries()){
      if (e.disabled || e.meta?.locked || !e.tags.some(t => t.includes(find))) continue;
      const prevTags = e.tags.slice();
      let newTags = e.tags.map(t => t.includes(find) ? t.split(find).join(repl) : t);
      newTags = newTags.map(t => t.trim()).filter(Boolean);
      newTags = Array.from(new Set(newTags));
      e.tags = newTags;
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: newTags.slice() });
    }
    if (affected.length === 0){ toast(`No tags contain "${find}".`); return; }
    const summary = `Replaced "${find}" → "${repl}" inside tags across ${affected.length} image(s).`;
    toast(summary);
    recordChange('find-replace', summary, affected);
    folderStats.master_ops = (folderStats.master_ops || 0) + 1;
    saveFolderStats();
    trackStat('find_replaces');
    masterFRFind.value = ''; masterFRReplace.value = '';
    refreshAllUIRef();
    checkAchievements();
  });
}
