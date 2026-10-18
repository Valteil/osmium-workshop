// Curate tab — dataset onboarding. Open any folder of images (not the dataset
// itself), look through it as a grid or one image at a time (← / → keys, the
// arrow buttons, click to zoom), then:
//   - Add selected to the open dataset, or make a new dataset folder from them
//     (index.ts' File ▸ Add images import, so the same unique naming / reload);
//   - sort images into Artstyle folders: a subfolder of the opened folder per
//     style, so an artist's distinct styles never get mixed in one dataset.
//     "junk" is a special artstyle (labelled red) for images to throw out.
// Assigning MOVES the image (and its .txt caption, when there is one) into
// that subfolder; "Unsorted" moves it back to the folder's root. Artstyle
// names are kept in <root>/_osmium_curate.json so a style with no images yet
// survives a reopen; existing subfolders listed there are picked up again.
import type { DirHandle, FileHandle } from './types';
import { isImageFile } from './file-types';
import { writeBytes } from './fs-access';
import { pickDatasetFolder } from './folder-picker';
import { toast, toastError, showConfirmModal, showPromptModal, showImageLightbox } from './shared-ui';
import { curateTab, tabCurate } from './dom';

export interface CurateDeps {
  // The open dataset (Curate refuses to open that same folder: moving files
  // out from under a loaded dataset would desync it).
  getDirHandle(): DirHandle | null;
  // Copies files (+ their captions) into the open dataset, or a new dataset
  // folder the user names and places ('new' — also when none is open).
  addToDataset(files: File[], captions: Map<File, string>, target: 'open' | 'new'): Promise<boolean>;
}

const JUNK = 'junk';
const STATE_FILE = '_osmium_curate.json';
const UNSORTED = '';

interface CurateItem {
  name: string;            // file name
  style: string;           // '' = folder root, else the artstyle subfolder
  handle: FileHandle;
  url: string | null;      // object URL once loaded (revoked on close)
  selected: boolean;
}

let deps: CurateDeps;
let root: DirHandle | null = null;
let styles: string[] = [];          // artstyle names (junk included when made)
let items: CurateItem[] = [];
let view: 'grid' | 'single' = 'grid';
let index = 0;                      // single view position within visibleItems()
let filter = '*';                   // '*' all, '' unsorted, else a style
let lastClicked = -1;               // shift-click range anchor (visible index)
let busy = false;
let observer: IntersectionObserver | null = null;

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};
const btn = (label: string, title: string, onClick: () => void, cls = ''): HTMLButtonElement => {
  const b = el('button', cls, label);
  b.type = 'button';
  b.title = title;
  b.addEventListener('click', onClick);
  return b;
};
const styleLabel = (s: string): string => (s === UNSORTED ? 'Unsorted' : s === JUNK ? 'Junk' : s);
const cleanName = (raw: string): string => raw.replace(/[\\/:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
const visibleItems = (): CurateItem[] => (filter === '*' ? items : items.filter((it) => it.style === filter));
const isActive = (): boolean => tabCurate.classList.contains('active');

async function dirOf(style: string): Promise<DirHandle> {
  if (!root) throw new Error('No folder open.');
  return style === UNSORTED ? root : root.getDirectoryHandle(style, { create: true });
}

async function captionOf(it: CurateItem): Promise<string | null> {
  try {
    const dir = await dirOf(it.style);
    const txt = await dir.getFileHandle(it.name.replace(/\.[^.]+$/, '') + '.txt');
    return await (await txt.getFile()).text();
  } catch {
    return null;
  }
}

async function saveState(): Promise<void> {
  if (!root) return;
  try {
    const h = await root.getFileHandle(STATE_FILE, { create: true });
    await writeBytes(h, JSON.stringify({ styles }, null, 2));
  } catch { /* a read-only folder still curates in memory */ }
}

async function loadFolder(dir: DirHandle): Promise<void> {
  closeFolder();
  root = dir;
  styles = [];
  try {
    const st = JSON.parse(await (await (await dir.getFileHandle(STATE_FILE)).getFile()).text());
    if (st && Array.isArray(st.styles)) styles = st.styles.map((s: unknown) => cleanName(String(s))).filter(Boolean);
  } catch { /* no state yet */ }
  const found: CurateItem[] = [];
  const subdirs = new Map<string, DirHandle>();
  for await (const h of dir.values()) {
    if (h.kind === 'file' && isImageFile(h.name)) found.push({ name: h.name, style: UNSORTED, handle: h, url: null, selected: false });
    else if (h.kind === 'directory') subdirs.set(h.name, h);
  }
  // A junk folder made earlier counts even if the state file was lost.
  if (subdirs.has(JUNK) && !styles.includes(JUNK)) styles.push(JUNK);
  for (const s of styles) {
    const sub = subdirs.get(s);
    if (!sub) continue;
    for await (const h of sub.values()) {
      if (h.kind === 'file' && isImageFile(h.name)) found.push({ name: h.name, style: s, handle: h, url: null, selected: false });
    }
  }
  found.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  items = found;
  index = 0;
  filter = '*';
  lastClicked = -1;
  render();
}

function closeFolder(): void {
  for (const it of items) if (it.url) URL.revokeObjectURL(it.url);
  items = [];
  root = null;
  observer?.disconnect();
  observer = null;
}

async function urlOf(it: CurateItem): Promise<string> {
  if (!it.url) it.url = URL.createObjectURL(await it.handle.getFile());
  return it.url;
}

// Moves an item's image (+ caption) into another artstyle folder (or the
// root), never overwriting: a clash gets " (2)", " (3)"…
async function moveItem(it: CurateItem, to: string): Promise<void> {
  if (it.style === to) return;
  const from = await dirOf(it.style);
  const dest = await dirOf(to);
  const dot = it.name.lastIndexOf('.');
  const stem = dot < 0 ? it.name : it.name.slice(0, dot);
  const ext = dot < 0 ? '' : it.name.slice(dot);
  let name = it.name;
  for (let n = 2; n < 10000; n++) {
    try { await dest.getFileHandle(name); } catch { break; }
    name = `${stem} (${n})${ext}`;
  }
  const file = await it.handle.getFile();
  const newHandle = await dest.getFileHandle(name, { create: true });
  await writeBytes(newHandle, file);
  // The caption follows the image (best effort; the image move is what counts).
  try {
    const txt = await from.getFileHandle(stem + '.txt');
    const text = await (await txt.getFile()).text();
    const newTxt = await dest.getFileHandle(name.replace(/\.[^.]+$/, '') + '.txt', { create: true });
    await writeBytes(newTxt, text);
    await from.removeEntry(stem + '.txt');
  } catch { /* no caption */ }
  await from.removeEntry(it.name);
  // The cached preview reads the old (now deleted) file: drop it.
  if (it.url) { URL.revokeObjectURL(it.url); it.url = null; }
  it.name = name;
  it.style = to;
  it.handle = newHandle;
}

// `advance` (Single view's assign stack): go on to the next image, for rapid
// sorting. When the filter hides the image just moved, the next one has
// already slid into its place, so the index stays.
async function assign(targets: CurateItem[], to: string, advance = false): Promise<void> {
  if (busy || !targets.length) return;
  busy = true;
  let moved = 0;
  try {
    for (const it of targets) {
      if (it.style === to) continue;
      await moveItem(it, to);
      moved++;
    }
  } catch (err) {
    toastError('Could not move the image', err);
  } finally {
    busy = false;
  }
  if (moved) toast(`Moved ${moved} image${moved === 1 ? '' : 's'} to ${styleLabel(to)}.`, 1600);
  const vis = visibleItems();
  if (advance && vis.includes(targets[0])) index++;
  if (index >= vis.length) index = Math.max(0, vis.length - 1);
  render();
}

async function createStyle(junk: boolean): Promise<string | null> {
  if (!root) return null;
  let name = JUNK;
  if (!junk) {
    const raw = await showPromptModal(
      'Name the artstyle. Artstyles split a folder into clear definitions, so one style never mixes with another in a dataset (e.g. an artist\'s early, painterly and chibi styles). It becomes a folder of that name in the opened folder.',
      { okLabel: 'Create artstyle', placeholder: 'e.g. painterly' });
    name = cleanName(raw || '');
    if (!name) return null;
    if (name.toLowerCase() === JUNK) { toast('Use "Create junk folder" for junk.', 2600); return null; }
  }
  if (styles.some((s) => s.toLowerCase() === name.toLowerCase())) { toast(`"${styleLabel(name)}" already exists.`, 2200); return name; }
  try {
    await root.getDirectoryHandle(name, { create: true });
  } catch (err) {
    toastError('Could not create the folder', err);
    return null;
  }
  styles.push(name);
  await saveState();
  toast(junk ? 'Created the junk folder.' : `Created artstyle "${name}".`, 2200);
  render();
  return name;
}

// Grid: the selected images; Single: the image on screen.
async function addSelected(target: 'open' | 'new', only?: CurateItem): Promise<void> {
  const sel = only ? [only] : items.filter((it) => it.selected);
  if (!sel.length) { toast('Select some images first.', 2200); return; }
  if (busy) return;
  busy = true;
  try {
    const files: File[] = [];
    const captions = new Map<File, string>();
    for (const it of sel) {
      const f = await it.handle.getFile();
      files.push(f);
      const c = await captionOf(it);
      if (c !== null) captions.set(f, c);
    }
    if (await deps.addToDataset(files, captions, target)) for (const it of sel) it.selected = false;
  } catch (err) {
    toastError('Could not add the images', err);
  } finally {
    busy = false;
  }
  render();
}

// ---------------- rendering ----------------

function styleSelect(value: string, onPick: (v: string) => void, opts: { all?: boolean; placeholder?: string } = {}): HTMLSelectElement {
  const s = el('select', 'curate-select');
  if (opts.placeholder) { const o = el('option', '', opts.placeholder); o.value = '\u0000'; s.appendChild(o); }
  if (opts.all) { const o = el('option', '', `All (${items.length})`); o.value = '*'; s.appendChild(o); }
  const count = (st: string) => items.filter((it) => it.style === st).length;
  for (const st of [UNSORTED, ...styles]) {
    const o = el('option', '', `${styleLabel(st)}${opts.all ? ` (${count(st)})` : ''}`);
    o.value = st;
    s.appendChild(o);
  }
  s.value = value;
  s.addEventListener('change', () => { if (s.value !== '\u0000') onPick(s.value); });
  return s;
}

function badge(style: string): HTMLElement {
  const b = el('span', 'curate-badge' + (style === JUNK ? ' junk' : style === UNSORTED ? ' none' : ''), styleLabel(style));
  return b;
}

function render(): void {
  observer?.disconnect();
  observer = null;
  const body = curateTab.querySelector<HTMLElement>('.curate-body')!;
  body.replaceChildren();
  if (!root) {
    curateTab.classList.remove('curate-single-mode');
    const empty = el('div', 'curate-empty');
    empty.append(
      el('p', '', 'Open a folder of images to look through before they go into a dataset: pick the ones to keep, add them to your dataset or start a new one, and sort an artist\'s different styles into their own folders.'),
      btn('Open folder…', 'Pick a folder of images to curate', () => void openFolder(), 'primary'));
    body.appendChild(empty);
    return;
  }
  // Single fills the tab's height (image | assign column) instead of scrolling.
  curateTab.classList.toggle('curate-single-mode', view === 'single' && items.length > 0);
  body.appendChild(toolbar());
  if (!items.length) { body.appendChild(el('div', 'curate-empty', 'No images in this folder.')); return; }
  const vis = visibleItems();
  if (!vis.length) { body.appendChild(el('div', 'curate-empty', `No images in ${styleLabel(filter)}.`)); return; }
  body.appendChild(view === 'grid' ? renderGrid(vis) : renderSingle(vis));
}

// One wrapping row: the controls fill the width before a second line starts.
// The selection controls are Grid-only (in Single, the image on screen is
// what every action applies to — they live in the side column there).
function toolbar(): HTMLElement {
  const bar = el('div', 'curate-toolbar curate-row');
  bar.append(el('span', 'curate-folder', root!.name),
    btn('Open folder…', 'Curate a different folder', () => void openFolder()),
    btn('Rescan', 'Re-read the folder from disk', () => { if (root) void loadFolder(root); }));
  const views = el('div', 'curate-seg');
  views.append(
    btn('Grid', 'All images as a grid', () => { view = 'grid'; render(); }, view === 'grid' ? 'active' : ''),
    btn('Single', 'One image at a time (← / → to move, 0–9 to assign)', () => { view = 'single'; render(); }, view === 'single' ? 'active' : ''));
  bar.appendChild(views);
  const show = el('label', 'curate-label', 'Show');
  show.appendChild(styleSelect(filter, (v) => { filter = v; index = 0; lastClicked = -1; render(); }, { all: true }));
  bar.appendChild(show);
  if (view === 'single') return bar;

  const sel = items.filter((it) => it.selected);
  bar.append(el('span', 'curate-sep'), el('span', 'curate-count', `${sel.length} selected`),
    btn('Select all', 'Select every image shown', () => { for (const it of visibleItems()) it.selected = true; render(); }),
    btn('Select none', 'Clear the selection', () => { for (const it of items) it.selected = false; render(); }));
  const assignTo = el('label', 'curate-label', 'Assign to');
  assignTo.appendChild(styleSelect('\u0000', (v) => void assign(sel, v), { placeholder: 'Choose…' }));
  bar.append(assignTo,
    btn('Create artstyle…', 'Make a folder for one of the artist\'s styles, so styles don\'t mix in a dataset', () => void createStyle(false)));
  if (!styles.includes(JUNK)) bar.appendChild(btn('Create junk folder', 'A folder for images that aren\'t worth training on', () => void createStyle(true), 'curate-junk-btn'));
  bar.append(el('span', 'curate-sep'),
    btn('Add selected to dataset', 'Copy the selected images (and their captions) into the open dataset', () => void addSelected('open'), 'primary'),
    btn('New dataset from selected…', 'Make a new dataset folder and copy the selected images into it', () => void addSelected('new')));
  return bar;
}

// Single view's assign keys: 0 = Unsorted, 1–9 = the artstyles in order.
const stackStyles = (): string[] => [UNSORTED, ...styles];

function renderGrid(vis: CurateItem[]): HTMLElement {
  const grid = el('div', 'curate-grid');
  observer = new IntersectionObserver((ents) => {
    for (const e of ents) {
      if (!e.isIntersecting) continue;
      const img = e.target as HTMLImageElement;
      observer?.unobserve(img);
      const it = vis[Number(img.dataset.i)];
      if (it) void urlOf(it).then((u) => { img.src = u; }).catch(() => undefined);
    }
  }, { root: curateTab.querySelector('.curate-scroll'), rootMargin: '400px' });
  vis.forEach((it, i) => {
    const card = el('div', 'curate-card' + (it.selected ? ' selected' : ''));
    card.title = `${it.name}\nClick to select (Shift-click for a range), double-click to open`;
    const img = el('img');
    img.alt = it.name;
    img.draggable = false;
    img.dataset.i = String(i);
    if (it.url) img.src = it.url; else observer!.observe(img);
    const check = el('span', 'curate-check', '✓');
    const foot = el('div', 'curate-card-foot');
    foot.append(el('span', 'curate-name', it.name), badge(it.style));
    card.append(img, check, foot);
    card.addEventListener('click', (ev) => {
      if (ev.shiftKey && lastClicked >= 0) {
        const [a, b] = [Math.min(lastClicked, i), Math.max(lastClicked, i)];
        for (let k = a; k <= b; k++) vis[k].selected = true;
      } else {
        it.selected = !it.selected;
      }
      lastClicked = i;
      render();
    });
    card.addEventListener('dblclick', () => { index = i; view = 'single'; render(); });
    grid.appendChild(card);
  });
  return grid;
}

// Two columns: the image as large as the tab allows, and a side column with
// navigation, one button per artstyle (rapid assigning: a click or its
// number key moves the image there and goes on to the next), and the
// dataset actions for this image.
function renderSingle(vis: CurateItem[]): HTMLElement {
  index = Math.max(0, Math.min(index, vis.length - 1));
  const it = vis[index];
  const wrap = el('div', 'curate-single');
  const side = el('div', 'curate-side');
  const nav = el('div', 'curate-nav');
  const prev = btn('‹', 'Previous image (←)', () => step(-1));
  const next = btn('›', 'Next image (→)', () => step(1));
  prev.disabled = index === 0;
  next.disabled = index >= vis.length - 1;
  nav.append(prev, el('span', 'curate-pos', `${index + 1} / ${vis.length}`), next);
  const name = el('div', 'curate-single-name');
  name.append(el('span', 'curate-name', it.name), badge(it.style));
  name.title = it.name;
  side.append(nav, name, el('div', 'curate-side-title', 'Assign to'));
  const stack = el('div', 'curate-stack');
  stackStyles().forEach((st, k) => {
    const b = btn('', st === it.style ? `Already in ${styleLabel(st)}` : `Move to ${styleLabel(st)} and show the next image (${k})`,
      () => void assign([it], st, true),
      'curate-stack-btn' + (st === it.style ? ' current' : '') + (st === JUNK ? ' junk' : st === UNSORTED ? ' none' : ''));
    if (k <= 9) b.appendChild(el('kbd', '', String(k)));
    b.append(styleLabel(st));
    stack.appendChild(b);
  });
  stack.appendChild(btn('+ Create Artstyle…', 'Make a folder for one of the artist\'s styles and put this image in it. Artstyles keep an artist\'s styles apart, so a dataset never mixes one with another.', async () => {
    const n = await createStyle(false);
    if (n) await assign([it], n, true);
  }, 'curate-stack-btn create'));
  if (!styles.includes(JUNK)) stack.appendChild(btn('+ Create junk folder', 'A red folder for images that aren\'t worth training on (this image goes there)', async () => {
    const n = await createStyle(true);
    if (n) await assign([it], n, true);
  }, 'curate-stack-btn create junk'));
  side.appendChild(stack);
  const add = el('div', 'curate-side-add');
  add.append(
    btn('Add to dataset', 'Copy this image (and its caption) into the open dataset', () => void addSelected('open', it), 'primary'),
    btn('New dataset with it…', 'Make a new dataset folder and copy this image into it', () => void addSelected('new', it)));
  side.appendChild(add);
  const stage = el('div', 'curate-stage');
  const img = el('img');
  img.alt = it.name;
  img.draggable = false;
  img.title = 'Click to zoom';
  void urlOf(it).then((u) => {
    img.src = u;
    img.addEventListener('click', () => showImageLightbox(u));
    // Preload the neighbours so paging is instant.
    for (const n of [vis[index + 1], vis[index - 1]]) if (n) void urlOf(n).then((nu) => { const p = new Image(); p.src = nu; }).catch(() => undefined);
  }).catch(() => undefined);
  stage.appendChild(img);
  wrap.append(stage, side);
  return wrap;
}

function step(d: number): void {
  const vis = visibleItems();
  const n = index + d;
  if (n < 0 || n >= vis.length) return;
  index = n;
  render();
}

async function openFolder(): Promise<void> {
  const dir = await pickDatasetFolder();
  if (!dir) return;
  const open = deps.getDirHandle();
  if (open && open.isSameEntry && await open.isSameEntry(dir).catch(() => false)) {
    await showConfirmModal('That folder is the dataset you have open. Curate is for a folder of new images: pick the folder they come from instead.', { okLabel: 'OK', cancelLabel: '' });
    return;
  }
  try {
    await loadFolder(dir);
  } catch (err) {
    toastError('Could not read the folder', err);
  }
}

export function initCurate(d: CurateDeps): void {
  deps = d;
  render();
  // Capture phase on window: runs before view.ts' document-level arrow keys
  // (which would page the Gallery's Single view behind this tab).
  window.addEventListener('keydown', (ev) => {
    if (!isActive() || !root || view !== 'single') return;
    if (document.querySelector('.confirm-backdrop, .lightbox-backdrop, .picker-backdrop')) return;
    const t = ev.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' && (t as HTMLInputElement).type !== 'checkbox' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
      ev.preventDefault();
      ev.stopPropagation();
      step(ev.key === 'ArrowLeft' ? -1 : 1);
    } else if (/^[0-9]$/.test(ev.key) && !ev.ctrlKey && !ev.altKey && !ev.metaKey) {
      const st = stackStyles()[Number(ev.key)];
      const it = visibleItems()[index];
      if (st === undefined || !it) return;
      ev.preventDefault();
      ev.stopPropagation();
      void assign([it], st, true);
    }
  }, true);
}
