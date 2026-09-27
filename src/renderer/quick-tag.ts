// Image Quicktagging: while Single view shows one image, the left panel's
// filter/dataset tools are swapped for a panel of common attribute tags as
// checkboxes, so they're one click instead of typed again and again (the same
// idea as Sequential tagging's panel). Every box is independent: ticking adds
// the tag to the current image, unticking removes it, and none is required
// or exclusive within its group unless its own rules say so. Changes go
// through addTagToEntry / removeTagFromEntry, so they're dirty-tracked and
// undoable like any edit.
//
// It isn't collapsible. It slides in from the left when Single view takes
// over the panel (#left.quicktag-on) and gives the panel back on leaving
// Single view, or during multi-compare / a sequential run. Desktop only in
// practice: touch has no Single view.
//
// Custom quicktags: every category's "+" adds one, and "+ Add category"
// adds a category. They're app-wide (localStorage `dts-quicktags`), not per
// dataset. A quicktag is a tag plus optional rules (QuickTagDef below); the
// built-in ones are expressed with the same rules.

import type { Entry } from './types';
import { getJSON, setJSON } from './storage';
import { createModalShell, showConfirmModal, showPromptModal, toast } from './shared-ui';
import { attachFillAutocomplete, attachPickAutocomplete } from './tags-autocomplete';

interface QuickTagDef {
  tag: string;             // what ticking writes
  label?: string;          // checkbox text (defaults to the tag)
  adds?: string[];         // also written when ticked
  keep?: string[];         // of `adds`, the ones that stay after unticking (the rest go)
  untickRemoves?: string[];// also removed when unticked
  untickedBy?: string[];   // ticking any of these tags unticks this quicktag
}
interface QuickTagGroup { id: string; label: string; items: QuickTagDef[]; custom?: boolean }
interface QuickTagStore { groups: QuickTagGroup[]; extra: Record<string, QuickTagDef[]> }

const STORE_KEY = 'dts-quicktags';

// A breast size also writes "breasts" and keeps it on untick; "flat chest"
// doesn't (plus the Flat rule in applyBuiltinRules).
const sized = (label: string, tag: string): QuickTagDef => ({ label, tag, adds: ['breasts'], keep: ['breasts'] });
const BUILTIN_GROUPS: QuickTagGroup[] = [
  { id: 'hair-length', label: 'Hair length', items: [{ label: 'Short', tag: 'short hair' }, { label: 'Medium', tag: 'medium hair' }, { label: 'Long', tag: 'long hair' }] },
  { id: 'breast-size', label: 'Breast size', items: [{ label: 'Flat', tag: 'flat chest' }, sized('Small', 'small breasts'), sized('Medium', 'medium breasts'), sized('Large', 'large breasts'), sized('Gigantic', 'gigantic breasts')] },
  { id: 'build', label: 'Build', items: [{ label: 'Slim', tag: 'slim' }, { label: 'Plump', tag: 'plump' }] },
  { id: 'legs', label: 'Legs', items: [{ label: 'Thick thighs', tag: 'thick thighs' }, { label: 'Slim legs', tag: 'slim legs' }] },
  { id: 'gaze', label: 'Gaze', items: [{ label: 'Looking at viewer', tag: 'looking at viewer' }, { label: 'Looking away', tag: 'looking away' }, { label: 'Looking to the side', tag: 'looking to the side' }] }
];
const BREAST_SIZES = ['small breasts', 'medium breasts', 'large breasts', 'gigantic breasts'];

interface QuickTagDeps {
  leftPanel: HTMLElement;
  addTagToEntry: (entry: Entry, tag: string) => void;
  removeTagFromEntry: (entry: Entry, tag: string) => void;
  onChange: () => void;
}

let deps: QuickTagDeps | null = null;
let panel: HTMLElement | null = null;
let currentEntry: Entry | null = null;

// ---- store -----------------------------------------------------------------
function normTag(t: string): string { return t.trim().replace(/_/g, ' ').replace(/\s+/g, ' '); }
function normList(s: string): string[] { return Array.from(new Set(s.split(',').map(normTag).filter(Boolean))); }

function loadStore(): QuickTagStore {
  const s = getJSON<Partial<QuickTagStore> | null>(STORE_KEY, null);
  return { groups: Array.isArray(s?.groups) ? s!.groups : [], extra: s?.extra && typeof s.extra === 'object' ? s.extra : {} };
}
function saveStore(s: QuickTagStore): void { setJSON(STORE_KEY, s); }

// Built-in categories (with any custom items added to them), then custom categories.
function allGroups(): QuickTagGroup[] {
  const store = loadStore();
  return [
    ...BUILTIN_GROUPS.map((g) => ({ ...g, items: [...g.items, ...(store.extra[g.id] || [])] })),
    ...store.groups.map((g) => ({ ...g, custom: true }))
  ];
}
function isCustomItem(groupId: string, def: QuickTagDef): boolean {
  return !BUILTIN_GROUPS.some((g) => g.id === groupId && g.items.includes(def));
}
function allItems(): QuickTagDef[] { return allGroups().flatMap((g) => g.items); }

// ---- ticking ---------------------------------------------------------------
function tick(entry: Entry, def: QuickTagDef): void {
  deps!.addTagToEntry(entry, [def.tag, ...(def.adds || [])].join(','));
  // Quicktags this one knocks out ("ticking X unticks this").
  for (const other of allItems()){
    if (other !== def && other.untickedBy?.includes(def.tag) && entry.tags.includes(other.tag)) untick(entry, other);
  }
}

function untick(entry: Entry, def: QuickTagDef): void {
  deps!.removeTagFromEntry(entry, def.tag);
  const stillTicked = allItems().filter((o) => o !== def && entry.tags.includes(o.tag));
  for (const t of def.adds || []){
    if (def.keep?.includes(t)) continue;
    // Another ticked quicktag that also writes it keeps it.
    if (stillTicked.some((o) => o.adds?.includes(t))) continue;
    if (entry.tags.includes(t)) deps!.removeTagFromEntry(entry, t);
  }
  for (const t of def.untickRemoves || []) if (entry.tags.includes(t)) deps!.removeTagFromEntry(entry, t);
}

// The built-in Flat rule: with no breast size left and Flat ticked, "breasts"
// goes too (a flat chest isn't "breasts").
function applyBuiltinRules(entry: Entry): void {
  const sizes = BREAST_SIZES.some((t) => entry.tags.includes(t));
  if (!sizes && entry.tags.includes('flat chest') && entry.tags.includes('breasts')) deps!.removeTagFromEntry(entry, 'breasts');
}

// ---- editor ----------------------------------------------------------------
function field(box: HTMLElement, label: string, hint: string, value: string, placeholder: string, list: boolean): HTMLInputElement {
  const wrap = document.createElement('label');
  wrap.className = 'quicktag-edit-field';
  const l = document.createElement('span');
  l.className = 'quicktag-edit-label';
  l.textContent = label;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value;
  input.placeholder = placeholder;
  input.addEventListener('keydown', (e) => e.stopPropagation());
  if (list) attachPickAutocomplete(input, (v) => { input.value = v + ', '; input.focus(); });
  else attachFillAutocomplete(input);
  wrap.append(l, input);
  if (hint){
    const h = document.createElement('span');
    h.className = 'quicktag-edit-hint';
    h.textContent = hint;
    wrap.appendChild(h);
  }
  box.appendChild(wrap);
  return input;
}

function openEditor(groupLabel: string, existing: QuickTagDef | null): Promise<QuickTagDef | null> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v: QuickTagDef | null) => { if (!done){ done = true; resolve(v); } close(); };
    const { box, close } = createModalShell({ boxClassName: 'quicktag-edit-box', onDismiss: () => finish(null) });
    const title = document.createElement('div');
    title.className = 'confirm-message';
    title.textContent = `${existing ? 'Edit' : 'New'} quicktag in ${groupLabel}`;
    box.appendChild(title);
    const tag = field(box, 'Quicktag', 'The tag ticking this box writes.', existing?.tag || '', 'e.g. very long hair', false);
    const label = field(box, 'Checkbox label (optional)', 'What the box says; blank shows the tag.', existing?.label || '', 'e.g. Very long', false);
    const adds = field(box, 'Ticking also adds', 'Extra tags written with it (commas for several).', (existing?.adds || []).join(', '), 'e.g. long hair', true);
    const keep = field(box, 'Keep after unticking', 'Which of those extra tags stay when this is unticked (the rest are removed with it).', (existing?.keep || []).join(', '), 'e.g. long hair', true);
    const untickRemoves = field(box, 'Unticking also removes', 'Other tags taken off when this is unticked.', (existing?.untickRemoves || []).join(', '), '', true);
    const untickedBy = field(box, 'Unticked by', 'Ticking any of these tags unticks this quicktag.', (existing?.untickedBy || []).join(', '), 'e.g. short hair', true);

    const row = document.createElement('div');
    row.className = 'confirm-btn-row';
    const cancel = document.createElement('button');
    cancel.textContent = 'Cancel';
    cancel.addEventListener('click', () => finish(null));
    const save = document.createElement('button');
    save.className = 'primary';
    save.textContent = existing ? 'Save' : 'Add quicktag';
    save.addEventListener('click', () => {
      const t = normTag(tag.value);
      if (!t){ toast('Enter the quicktag (the tag it writes).'); tag.focus(); return; }
      const addList = normList(adds.value).filter((x) => x !== t);
      const keepList = normList(keep.value);
      const notAdded = keepList.filter((x) => !addList.includes(x));
      if (notAdded.length){ toast(`"Keep after unticking" can only list tags from "Ticking also adds" (${notAdded.join(', ')} isn't there).`, 4200); keep.focus(); return; }
      const def: QuickTagDef = { tag: t };
      if (normTag(label.value)) def.label = label.value.trim();
      if (addList.length) def.adds = addList;
      if (keepList.length) def.keep = keepList;
      const ur = normList(untickRemoves.value).filter((x) => x !== t);
      if (ur.length) def.untickRemoves = ur;
      const ub = normList(untickedBy.value).filter((x) => x !== t);
      if (ub.length) def.untickedBy = ub;
      finish(def);
    });
    row.append(cancel, save);
    box.appendChild(row);
    requestAnimationFrame(() => tag.focus());
  });
}

async function addQuickTag(group: QuickTagGroup): Promise<void> {
  const def = await openEditor(group.label, null);
  if (!def) return;
  const store = loadStore();
  const list = group.custom ? store.groups.find((g) => g.id === group.id)!.items : (store.extra[group.id] ||= []);
  if (group.items.some((d) => d.tag === def.tag)){ toast(`"${def.tag}" is already a quicktag in ${group.label}.`); return; }
  list.push(def);
  saveStore(store);
  refresh();
}

async function editQuickTag(group: QuickTagGroup, def: QuickTagDef): Promise<void> {
  const next = await openEditor(group.label, def);
  if (!next) return;
  const store = loadStore();
  const list = group.custom ? store.groups.find((g) => g.id === group.id)!.items : (store.extra[group.id] || []);
  const i = list.findIndex((d) => d.tag === def.tag);
  if (i === -1) return;
  list[i] = next;
  saveStore(store);
  refresh();
}

async function deleteQuickTag(group: QuickTagGroup, def: QuickTagDef): Promise<void> {
  const ok = await showConfirmModal(`Delete the quicktag "${def.label || def.tag}"? Tags already on images stay.`, { okLabel: 'Delete', danger: true });
  if (!ok) return;
  const store = loadStore();
  const list = group.custom ? store.groups.find((g) => g.id === group.id)!.items : (store.extra[group.id] || []);
  const i = list.findIndex((d) => d.tag === def.tag);
  if (i !== -1) list.splice(i, 1);
  saveStore(store);
  refresh();
}

async function addCategory(): Promise<void> {
  const name = (await showPromptModal('Name the new quicktag category:', { placeholder: 'e.g. Eye colour', okLabel: 'Add category' }))?.trim();
  if (!name) return;
  if (allGroups().some((g) => g.label.toLowerCase() === name.toLowerCase())){ toast(`There's already a "${name}" category.`); return; }
  const store = loadStore();
  store.groups.push({ id: 'custom-' + Date.now().toString(36), label: name, items: [] });
  saveStore(store);
  refresh();
}

async function deleteCategory(group: QuickTagGroup): Promise<void> {
  const ok = await showConfirmModal(
    group.items.length
      ? `Delete the category "${group.label}" and its ${group.items.length} quicktag(s)? Tags already on images stay.`
      : `Delete the category "${group.label}"?`,
    { okLabel: 'Delete', danger: true });
  if (!ok) return;
  const store = loadStore();
  store.groups = store.groups.filter((g) => g.id !== group.id);
  saveStore(store);
  refresh();
}

function refresh(): void { if (currentEntry) showQuickTag(currentEntry); }

// ---- panel -----------------------------------------------------------------
function smallButton(text: string, title: string, onClick: () => void, cls = ''): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'quicktag-mini' + (cls ? ' ' + cls : '');
  b.textContent = text;
  b.title = title;
  b.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); onClick(); });
  return b;
}

export function initQuickTag(d: QuickTagDeps): void {
  deps = d;
  panel = document.createElement('div');
  panel.id = 'quickTagPanel';
  panel.className = 'quicktag-panel';
  deps.leftPanel.appendChild(panel);
}

export function showQuickTag(entry: Entry): void {
  if (!deps || !panel) return;
  currentEntry = entry;
  deps.leftPanel.classList.add('quicktag-on');
  panel.innerHTML = '';

  const title = document.createElement('h3');
  title.className = 'panel-title';
  title.textContent = 'IMAGE QUICKTAGGING';
  panel.appendChild(title);
  const note = document.createElement('div');
  note.className = 'quicktag-note';
  note.textContent = 'Tick to add the tag to this image, untick to remove it. + adds your own.';
  panel.appendChild(note);

  const has = new Set(entry.tags);
  for (const group of allGroups()){
    const block = document.createElement('div');
    block.className = 'quicktag-group';
    const head = document.createElement('div');
    head.className = 'quicktag-group-head';
    const name = document.createElement('span');
    name.textContent = group.label;
    head.appendChild(name);
    const actions = document.createElement('span');
    actions.className = 'quicktag-head-actions';
    actions.appendChild(smallButton('+', `Add a quicktag to ${group.label}`, () => void addQuickTag(group)));
    if (group.custom) actions.appendChild(smallButton('×', `Delete the ${group.label} category`, () => void deleteCategory(group), 'quicktag-del'));
    head.appendChild(actions);
    block.appendChild(head);
    const row = document.createElement('div');
    row.className = 'quicktag-options';
    if (!group.items.length){
      const empty = document.createElement('div');
      empty.className = 'quicktag-note';
      empty.textContent = 'No quicktags yet — use +.';
      row.appendChild(empty);
    }
    for (const def of group.items){
      const line = document.createElement('div');
      line.className = 'quicktag-line';
      const opt = document.createElement('label');
      opt.className = 'ach-toggle-row quicktag-option';
      opt.title = describe(def);
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = has.has(def.tag);
      cb.addEventListener('change', () => {
        if (cb.checked) tick(entry, def); else untick(entry, def);
        applyBuiltinRules(entry);
        deps!.onChange(); // re-renders Single view, which redraws this panel from the real tags
      });
      const span = document.createElement('span');
      span.textContent = def.label || def.tag;
      opt.append(cb, span);
      line.appendChild(opt);
      if (isCustomItem(group.id, def)){
        const tools = document.createElement('span');
        tools.className = 'quicktag-item-actions';
        tools.appendChild(smallButton('✎', 'Edit this quicktag', () => void editQuickTag(group, def)));
        tools.appendChild(smallButton('×', 'Delete this quicktag', () => void deleteQuickTag(group, def), 'quicktag-del'));
        line.appendChild(tools);
      }
      row.appendChild(line);
    }
    block.appendChild(row);
    panel.appendChild(block);
  }

  const addCat = document.createElement('button');
  addCat.type = 'button';
  addCat.className = 'quicktag-add-category';
  addCat.textContent = '+ Add category';
  addCat.addEventListener('click', () => void addCategory());
  panel.appendChild(addCat);
}

function describe(def: QuickTagDef): string {
  const parts = [`Writes "${def.tag}"`];
  if (def.adds?.length) parts.push(`also adds ${def.adds.join(', ')}`);
  if (def.keep?.length) parts.push(`keeps ${def.keep.join(', ')} after unticking`);
  if (def.untickRemoves?.length) parts.push(`unticking also removes ${def.untickRemoves.join(', ')}`);
  if (def.untickedBy?.length) parts.push(`unticked by ${def.untickedBy.join(', ')}`);
  return parts.join('; ');
}

export function hideQuickTag(): void {
  if (!deps) return;
  deps.leftPanel.classList.remove('quicktag-on');
}
