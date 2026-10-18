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
// Every folder curated is kept in a folder list like the Datasets tab's (its
// own IndexedDB, newest first), shown whenever no folder is open: click one
// to go back to it, where you left off (view, folder filter, position).
import type { DirHandle, FileHandle } from './types';
import { isImageFile } from './file-types';
import { writeBytes, serializeHandle, reviveHandle, isMobileHandle, requestPermission } from './fs-access';
import { pickDatasetFolder, promptRelinkFolder } from './folder-picker';
import { toast, toastError, showConfirmModal, showPromptModal, showImageLightbox, addContextMenuItem, positionMenu } from './shared-ui';
import { openDB, idbGetAll, idbAdd, idbDelete, idbUpdate } from './idb';
import { folderIconEl } from './dataset-manager';
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

// ---------------- the folder list ----------------

interface CurateFolder {
  id: number;
  name: string;
  handle: DirHandle;
  addedAt: number;
  lastOpenedAt: number;
  icon?: string;            // small JPEG data URL of its first image
}
const DB_NAME = 'osmium-curate-db';
const STORE = 'folders';
const POS_KEY = (id: number) => `osmium-curate-pos-${id}`;
let currentId: number | null = null;   // the list entry of the open folder

const openCurateDB = () => openDB(DB_NAME, 1, STORE);

async function listFolders(): Promise<CurateFolder[]> {
  const recs = await idbGetAll<CurateFolder>(await openCurateDB(), STORE);
  // Only the Android shim's plain-object handles need reviving (same as the
  // Datasets tab); a real desktop handle comes back from IndexedDB as is.
  for (const r of recs) if (r.handle && isMobileHandle(r.handle)) r.handle = reviveHandle(r.handle);
  return recs.sort((a, b) => (b.lastOpenedAt || b.addedAt) - (a.lastOpenedAt || a.addedAt));
}

// The list entry for a folder, added if it's new (matched with isSameEntry
// where the handle has it, else by name).
async function trackFolder(dir: DirHandle): Promise<number> {
  for (const r of await listFolders()) {
    const same = dir.isSameEntry ? await dir.isSameEntry(r.handle).catch(() => false) : r.name === dir.name;
    if (same) return r.id;
  }
  return Number(await idbAdd(await openCurateDB(), STORE, { name: dir.name, handle: serializeHandle(dir), addedAt: Date.now(), lastOpenedAt: Date.now() }));
}

// Where the user was in a folder, restored when they come back to it.
function savePosition(): void {
  if (currentId === null) return;
  try { localStorage.setItem(POS_KEY(currentId), JSON.stringify({ view, filter, index })); } catch { /* storage full/blocked */ }
}
function restorePosition(id: number): void {
  try {
    const p = JSON.parse(localStorage.getItem(POS_KEY(id)) || 'null');
    if (!p) return;
    if (p.view === 'grid' || p.view === 'single') view = p.view;
    if (typeof p.filter === 'string' && (p.filter === '*' || p.filter === UNSORTED || styles.includes(p.filter))) filter = p.filter;
    if (Number.isInteger(p.index) && p.index >= 0) index = p.index;
  } catch { /* ignore a bad entry */ }
}

// The folder's tile picture: its first image, small.
async function makeIcon(id: number): Promise<void> {
  const first = items[0];
  if (!first) return;
  try {
    const bmp = await createImageBitmap(await first.handle.getFile());
    const size = 120;
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const k = Math.max(size / bmp.width, size / bmp.height);
    c.getContext('2d')!.drawImage(bmp, (size - bmp.width * k) / 2, (size - bmp.height * k) / 2, bmp.width * k, bmp.height * k);
    bmp.close();
    await idbUpdate(await openCurateDB(), STORE, id, { icon: c.toDataURL('image/jpeg', 0.7) });
  } catch { /* the plain folder icon is fine */ }
}

async function openTracked(rec: CurateFolder): Promise<void> {
  try {
    if (await requestPermission(rec.handle, 'readwrite') !== 'granted') { toast('Permission was not granted for that folder.'); return; }
    await openDir(rec.handle, rec.id);
  } catch {
    // Moved / renamed / deleted: offer to find it again, once.
    const again = await promptRelinkFolder(rec.name);
    if (!again) return;
    try {
      await idbUpdate(await openCurateDB(), STORE, rec.id, { handle: serializeHandle(again), name: again.name });
      await openDir(again, rec.id);
    } catch (err) {
      toastError('Could not open that folder either', err);
    }
  }
}

async function openDir(dir: DirHandle, id: number): Promise<void> {
  savePosition();
  currentId = null;
  await loadFolder(dir);
  currentId = id;
  restorePosition(id);
  render();
  const db = await openCurateDB();
  await idbUpdate(db, STORE, id, { lastOpenedAt: Date.now() });
  const rec = (await idbGetAll<CurateFolder>(db, STORE)).find((r) => r.id === id);
  if (rec && !rec.icon) void makeIcon(id);
}

function backToFolders(): void {
  savePosition();
  closeFolder();
  currentId = null;
  render();
}

let ctxMenu: HTMLElement | null = null;
function closeCtx(): void {
  ctxMenu?.remove();
  ctxMenu = null;
  document.removeEventListener('click', closeCtx);
}
function folderMenu(rec: CurateFolder, x: number, y: number): void {
  closeCtx();
  const menu = el('div', 'ctx-menu');
  menu.appendChild(el('div', 'ctx-header', rec.name));
  addContextMenuItem(menu, 'Open', () => { closeCtx(); void openTracked(rec); });
  addContextMenuItem(menu, 'Remove from this list', async () => {
    closeCtx();
    const ok = await showConfirmModal(`Remove "${rec.name}" from Curate's folder list?\nThe folder and its files are untouched.`, { okLabel: 'Remove', danger: true });
    if (!ok) return;
    await idbDelete(await openCurateDB(), STORE, rec.id);
    try { localStorage.removeItem(POS_KEY(rec.id)); } catch { /* ignore */ }
    render();
  }, { className: 'danger' });
  document.body.appendChild(menu);
  positionMenu(menu, x, y);
  ctxMenu = menu;
  setTimeout(() => document.addEventListener('click', closeCtx), 0);
}

async function renderHome(body: HTMLElement): Promise<void> {
  const intro = el('div', 'curate-empty');
  intro.append(el('p', '', 'Curate a folder of new images before they go into a dataset: pick the keepers, add them to your dataset or start a new one, and sort an artist\'s different styles into their own folders. Every folder you curate stays here, so you can come back to it anytime and carry on where you left off.'));
  const grid = el('div', 'dm-grid curate-home');
  let recs: CurateFolder[] = [];
  try { recs = await listFolders(); } catch { recs = []; }
  if (root) return; // a folder opened while this was loading
  for (const rec of recs) {
    const tile = el('div', 'dm-tile');
    tile.tabIndex = 0;
    tile.title = `${rec.name}\nLast opened ${new Date(rec.lastOpenedAt || rec.addedAt).toLocaleString()}`;
    tile.appendChild(folderIconEl(rec.icon));
    tile.appendChild(el('div', 'dm-tile-label', rec.name));
    const menuBtn = btn('⋯', 'Folder options', () => undefined, 'dm-menu-btn');
    menuBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const r = menuBtn.getBoundingClientRect();
      folderMenu(rec, r.left, r.bottom + 4);
    });
    tile.appendChild(menuBtn);
    tile.addEventListener('contextmenu', (ev) => { ev.preventDefault(); folderMenu(rec, ev.clientX, ev.clientY); });
    tile.addEventListener('click', (ev) => { if (ev.target !== menuBtn) void openTracked(rec); });
    tile.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') void openTracked(rec); });
    grid.appendChild(tile);
  }
  const add = el('button', 'dm-tile dm-add-tile', '+');
  add.type = 'button';
  add.title = 'Curate a new folder';
  add.addEventListener('click', () => void openFolder());
  grid.appendChild(add);
  body.replaceChildren(intro, grid);
}

interface CurateItem {
  name: string;            // file name
  style: string;           // '' = folder root, else the artstyle subfolder
  handle: FileHandle;
  url: string | null;      // full image object URL, Single view (revoked on close)
  thumb: string | null;    // small JPEG thumbnail for the grid (revoked on close)
  selected: boolean;
  w?: number; h?: number;  // pixel size, known once the image has loaded
  hash?: Uint32Array;      // perceptual hash: [dHash hi, lo, mirrored hi, lo]
  bytes?: number;          // file size (duplicate keeper tie-break)
}

// Grid thumbnails: decoded off the main thread (createImageBitmap), drawn
// down to THUMB_W wide and kept as a small JPEG, a few at a time. Showing the
// full images in the grid made it crawl: hundreds of multi-megapixel images
// decoded and scaled on every render. The full decode also gives the size.
const THUMB_W = 320;
const THUMB_JOBS = 3;
let thumbActive = 0;
const thumbQueue: (() => Promise<void>)[] = [];
function pumpThumbs(): void {
  while (thumbActive < THUMB_JOBS && thumbQueue.length) {
    const job = thumbQueue.shift()!;
    thumbActive++;
    void job().finally(() => { thumbActive--; pumpThumbs(); });
  }
}
function thumbOf(it: CurateItem, stillWanted: () => boolean): Promise<string> {
  if (it.thumb) return Promise.resolve(it.thumb);
  return new Promise((resolve, reject) => {
    thumbQueue.push(async () => {
      if (it.thumb) { resolve(it.thumb); return; }
      try {
        const file = await it.handle.getFile();
        // Scrolled past / re-rendered before its turn: skip (asked again if
        // it comes back). Checked AFTER an await: a job can start the moment
        // it's queued, while the caller is still building the card, and the
        // <img> isn't on the page yet (Duplicates' first images never loaded).
        if (!stillWanted()) { reject(new Error('stale')); return; }
        const bmp = await createImageBitmap(file);
        it.w = bmp.width;
        it.h = bmp.height;
        const k = Math.min(1, THUMB_W / bmp.width);
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(bmp.width * k));
        c.height = Math.max(1, Math.round(bmp.height * k));
        c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
        bmp.close();
        // WebP keeps transparency (a JPEG turned transparent line art black).
        const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/webp', 0.85));
        if (!blob) throw new Error('Could not make a thumbnail.');
        it.thumb = URL.createObjectURL(blob);
        resolve(it.thumb);
      } catch (err) {
        reject(err);
      }
    });
    pumpThumbs();
  });
}

// Images with both sides under this are flagged: at that size they're
// usually previews or WIPs, and a trainer can't add detail that isn't there.
const LOW_RES = 1024;

// "1920×1080", flagged when small. Filled in when the image loads (the grid's
// thumbnails are the images themselves), so it starts empty.
function resLabel(it: CurateItem): HTMLElement {
  const s = el('span', 'curate-res');
  const fill = () => {
    if (!it.w || !it.h) return;
    const low = Math.max(it.w, it.h) < LOW_RES;
    s.textContent = `${it.w}×${it.h}`;
    s.classList.toggle('low', low);
    s.title = low ? `Low resolution: both sides are under ${LOW_RES}px (often a preview or WIP)` : '';
  };
  fill();
  (s as HTMLElement & { fill?: () => void }).fill = fill;
  return s;
}
// Records the loaded size and refreshes the label next to it.
function noteSize(it: CurateItem, img: HTMLImageElement, label: HTMLElement): void {
  img.addEventListener('load', () => {
    it.w = img.naturalWidth;
    it.h = img.naturalHeight;
    (label as HTMLElement & { fill?: () => void }).fill?.();
  }, { once: true });
}

let deps: CurateDeps;
let root: DirHandle | null = null;
let styles: string[] = [];          // artstyle names (junk included when made)
let items: CurateItem[] = [];
let view: 'grid' | 'single' | 'dupes' = 'grid';
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
    if (h.kind === 'file' && isImageFile(h.name)) found.push({ name: h.name, style: UNSORTED, handle: h, url: null, thumb: null, selected: false });
    else if (h.kind === 'directory') subdirs.set(h.name, h);
  }
  // A junk folder made earlier counts even if the state file was lost.
  if (subdirs.has(JUNK) && !styles.includes(JUNK)) styles.push(JUNK);
  for (const s of styles) {
    const sub = subdirs.get(s);
    if (!sub) continue;
    for await (const h of sub.values()) {
      if (h.kind === 'file' && isImageFile(h.name)) found.push({ name: h.name, style: s, handle: h, url: null, thumb: null, selected: false });
    }
  }
  found.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  items = found;
  index = 0;
  filter = '*';
  lastClicked = -1;
  // Duplicate groups belong to the old item list (hashes come back from the cache file).
  if (dupeScan) dupeScan.cancelled = true;
  dupe = null;
  if (view === 'dupes') view = 'grid';
  // No render here: callers restore the saved position first (a render
  // would save this reset position over it).
}

async function rescan(): Promise<void> {
  if (!root) return;
  savePosition();
  await loadFolder(root);
  if (currentId !== null) restorePosition(currentId);
  render();
}

function closeFolder(): void {
  for (const it of items) {
    if (it.url) URL.revokeObjectURL(it.url);
    if (it.thumb) URL.revokeObjectURL(it.thumb);
  }
  items = [];
  thumbQueue.length = 0;
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

function styleSelect(value: string, onPick: (v: string) => void, opts: { placeholder?: string } = {}): HTMLSelectElement {
  const s = el('select', 'curate-select');
  if (opts.placeholder) { const o = el('option', '', opts.placeholder); o.value = '\u0000'; s.appendChild(o); }
  for (const st of [UNSORTED, ...styles]) {
    const o = el('option', '', styleLabel(st));
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
    void renderHome(body);
    return;
  }
  savePosition();
  // Single fills the tab's height (image | assign column) instead of scrolling.
  curateTab.classList.toggle('curate-single-mode', view === 'single' && items.length > 0);
  body.appendChild(toolbar());
  if (!items.length) { body.appendChild(el('div', 'curate-empty', 'No images in this folder.')); return; }
  if (view === 'dupes') { body.appendChild(renderDupes()); return; }
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
    btn('‹ Folders', 'Back to your curation folders (this one stays in the list, where you left off)', backToFolders),
    btn('Rescan', 'Re-read the folder from disk', () => void rescan()));
  const views = el('div', 'curate-seg');
  views.append(
    btn('Grid', 'All images as a grid', () => { view = 'grid'; render(); }, view === 'grid' ? 'active' : ''),
    btn('Single', 'One image at a time (← / → to move, 0–9 to assign)', () => { view = 'single'; render(); }, view === 'single' ? 'active' : ''),
    btn('Duplicates', 'Find images that look the same (resized, re-saved, mirrored or lightly edited copies) and review them in groups', () => void showDupes(), view === 'dupes' ? 'active' : ''));
  bar.appendChild(views);
  // In Duplicates the folder buttons pick where to look (each artstyle on
  // its own, or All = every folder but junk).
  bar.appendChild(folderChips());
  if (view === 'single' || view === 'dupes') return bar;

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

// The folders as one chip each (All, Unsorted, every artstyle, junk red) with
// its image count: a click views just that folder, in Grid or Single.
function folderChips(): HTMLElement {
  const row = el('div', 'curate-folders');
  row.setAttribute('role', 'tablist');
  const chip = (value: string, label: string, n: number, cls: string) => {
    const b = btn('', value === '*' ? 'Every image in the folder and its artstyle folders' : `View the images in ${label}`, () => {
      filter = value; index = 0; lastClicked = -1; render();
    }, `curate-folder-chip ${cls}${filter === value ? ' active' : ''}`);
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', String(filter === value));
    b.append(label, el('span', 'curate-folder-n', String(n)));
    row.appendChild(b);
  };
  chip('*', 'All', items.length, 'all');
  for (const st of [UNSORTED, ...styles]) {
    chip(st, styleLabel(st), items.filter((it) => it.style === st).length, st === JUNK ? 'junk' : st === UNSORTED ? 'none' : '');
  }
  return row;
}

// Single view's assign keys: 0 = Unsorted, 1–9 = the artstyles in order.
const stackStyles = (): string[] => [UNSORTED, ...styles];

function renderGrid(vis: CurateItem[]): HTMLElement {
  const grid = el('div', 'curate-grid');
  const scroller = curateTab.querySelector<HTMLElement>('.curate-scroll')!;
  observer = new IntersectionObserver((ents) => {
    for (const e of ents) {
      if (!e.isIntersecting) continue;
      const img = e.target as HTMLImageElement;
      const it = vis[Number(img.dataset.i)];
      if (!it) continue;
      observer?.unobserve(img);
      // Wanted while still in this grid and near the view; otherwise it's
      // skipped and observed again, so scrolling fast never queues hundreds.
      const near = () => {
        if (!img.isConnected) return false;
        const r = img.getBoundingClientRect(), s = scroller.getBoundingClientRect();
        return r.bottom > s.top - 600 && r.top < s.bottom + 600;
      };
      void thumbOf(it, near).then((u) => {
        img.src = u;
        (img.parentElement?.querySelector('.curate-res') as (HTMLElement & { fill?: () => void }) | null)?.fill?.();
      }).catch(() => { if (img.isConnected && !it.thumb) observer?.observe(img); });
    }
  }, { root: scroller, rootMargin: '400px' });
  const cards: HTMLElement[] = [];
  const countEl = curateTab.querySelector<HTMLElement>('.curate-count');
  // Selecting only touches the cards it changes (not a whole re-render).
  const setSelected = (k: number, on: boolean) => {
    vis[k].selected = on;
    cards[k].classList.toggle('selected', on);
  };
  vis.forEach((it, i) => {
    const card = el('div', 'curate-card' + (it.selected ? ' selected' : ''));
    card.title = `${it.name}\nClick to select (Shift-click for a range), double-click to open`;
    const img = el('img');
    img.alt = it.name;
    img.draggable = false;
    img.decoding = 'async';
    img.dataset.i = String(i);
    const res = resLabel(it);
    if (it.thumb) img.src = it.thumb; else observer!.observe(img);
    const check = el('span', 'curate-check', '✓');
    const foot = el('div', 'curate-card-foot');
    foot.append(el('span', 'curate-name', it.name), badge(it.style));
    // On the image's corner, so the file name keeps the footer's width.
    res.classList.add('curate-res-card');
    card.appendChild(res);
    card.append(img, check, foot);
    card.addEventListener('click', (ev) => {
      if (dragJustEnded) return; // the click that ends a drag-select
      if (ev.shiftKey && lastClicked >= 0) {
        const [a, b] = [Math.min(lastClicked, i), Math.max(lastClicked, i)];
        for (let k = a; k <= b; k++) setSelected(k, true);
      } else {
        setSelected(i, !it.selected);
      }
      lastClicked = i;
      if (countEl) countEl.textContent = `${items.filter((x) => x.selected).length} selected`;
    });
    card.addEventListener('dblclick', () => { index = i; view = 'single'; render(); });
    cards.push(card);
    grid.appendChild(card);
  });

  // ---- Drag selection: press anywhere in the grid (on a card too) and drag
  // a box; every card it touches is selected, on top of what already was.
  // Alt-drag deselects instead. Under 6px of movement it's a plain click.
  // Near the top/bottom edge the grid scrolls, and the box keeps growing.
  let dragJustEnded = false;
  const marquee = el('div', 'curate-marquee');
  let drag: { x0: number; y0: number; x: number; y: number; deselect: boolean; base: boolean[]; boxes: DOMRect[]; on: boolean; id: number } | null = null;
  let autoScroll = 0;
  const point = (cx: number, cy: number) => { const g = grid.getBoundingClientRect(); return { x: cx - g.left, y: cy - g.top }; };
  let lastClient = { x: 0, y: 0 };
  const apply = () => {
    if (!drag) return;
    const p = point(lastClient.x, lastClient.y);
    drag.x = p.x; drag.y = p.y;
    const l = Math.min(drag.x0, drag.x), t = Math.min(drag.y0, drag.y);
    const r = Math.max(drag.x0, drag.x), b = Math.max(drag.y0, drag.y);
    Object.assign(marquee.style, { left: `${l}px`, top: `${t}px`, width: `${r - l}px`, height: `${b - t}px` });
    drag.boxes.forEach((c, k) => {
      const hit = c.left < r && c.right > l && c.top < b && c.bottom > t;
      const want = hit ? !drag!.deselect : drag!.base[k];
      if (vis[k].selected !== want) setSelected(k, want);
    });
    if (countEl) countEl.textContent = `${items.filter((x) => x.selected).length} selected`;
  };
  const tick = () => {
    if (!drag || !drag.on) { autoScroll = 0; return; }
    const s = scroller.getBoundingClientRect(), edge = 48;
    const dy = lastClient.y < s.top + edge ? -(s.top + edge - lastClient.y) : lastClient.y > s.bottom - edge ? lastClient.y - (s.bottom - edge) : 0;
    if (dy) { scroller.scrollTop += Math.max(-30, Math.min(30, dy / 2)); apply(); }
    autoScroll = requestAnimationFrame(tick);
  };
  grid.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0 || ev.pointerType === 'touch') return; // touch scrolls
    const p = point(ev.clientX, ev.clientY);
    const g = grid.getBoundingClientRect();
    drag = {
      x0: p.x, y0: p.y, x: p.x, y: p.y, deselect: ev.altKey, on: false, id: ev.pointerId,
      base: vis.map((it) => it.selected),
      boxes: cards.map((c) => { const r = c.getBoundingClientRect(); return new DOMRect(r.left - g.left, r.top - g.top, r.width, r.height); })
    };
    lastClient = { x: ev.clientX, y: ev.clientY };
  });
  grid.addEventListener('pointermove', (ev) => {
    if (!drag || ev.pointerId !== drag.id) return;
    lastClient = { x: ev.clientX, y: ev.clientY };
    if (!drag.on) {
      const p = point(ev.clientX, ev.clientY);
      if (Math.hypot(p.x - drag.x0, p.y - drag.y0) < 6) return;
      drag.on = true;
      try { grid.setPointerCapture(ev.pointerId); } catch { /* best effort */ }
      grid.classList.add('dragging');
      grid.appendChild(marquee);
      autoScroll = requestAnimationFrame(tick);
    }
    ev.preventDefault();
    apply();
  });
  const end = (ev: PointerEvent) => {
    if (!drag || ev.pointerId !== drag.id) return;
    const was = drag.on;
    drag = null;
    cancelAnimationFrame(autoScroll);
    marquee.remove();
    grid.classList.remove('dragging');
    if (was) {
      // Swallow the click the browser fires after the drag.
      dragJustEnded = true;
      setTimeout(() => { dragJustEnded = false; }, 0);
    }
  };
  grid.addEventListener('pointerup', end);
  grid.addEventListener('pointercancel', end);
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
  const res = resLabel(it);
  name.title = it.name;
  res.classList.add('curate-res-single');
  side.append(nav, name, res, el('div', 'curate-side-title', 'Assign to'));
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
  noteSize(it, img, res);
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

// ---------------- Duplicates ----------------
// Perceptual hashing (dHash): each image shrunk to 9×8 grey, one bit per
// neighbouring-pixel comparison = a 64-bit fingerprint that survives resizing,
// re-saving (PNG/JPG/compression), small colour shifts, watermarks and small
// crops. A second hash of the mirrored image catches flipped copies. Two
// images are duplicates when their fingerprints differ in few bits (the
// Strictness setting). Groups = connected pairs (union-find). Hashes are
// cached in <root>/_osmium_curate_hashes.json by folder/name + size + date,
// so a rescan only hashes new or changed files.
const HASH_FILE = '_osmium_curate_hashes.json';
const STRICTNESS: [string, number][] = [['Strict', 4], ['Normal', 8], ['Loose', 13]];
let dupeBits = 8;
interface DupeGroup { members: CurateItem[]; keep: Set<CurateItem> }
let dupe: { scope: string; groups: DupeGroup[] } | null = null;
let dupeScan: { scope: string; done: number; total: number; stage: string; cancelled: boolean } | null = null;

// "v2": hashes taken over white (v1 read transparent pixels as black, so
// transparent images all looked alike); v1 entries are simply re-hashed.
const hashKey = (it: CurateItem, f: File) => `v2|${it.style}/${it.name}|${f.size}|${f.lastModified}`;
const pop32 = (x: number): number => {
  x -= (x >>> 1) & 0x55555555;
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  return (((x + (x >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
};
function hashDistance(a: Uint32Array, b: Uint32Array): number {
  const same = pop32(a[0] ^ b[0]) + pop32(a[1] ^ b[1]);
  const mirrored = pop32(a[0] ^ b[2]) + pop32(a[1] ^ b[3]);
  return Math.min(same, mirrored);
}

let hashCanvas: CanvasRenderingContext2D | null = null;
async function computeHash(file: File): Promise<Uint32Array> {
  const bmp = await createImageBitmap(file, { resizeWidth: 9, resizeHeight: 8, resizeQuality: 'high' });
  if (!hashCanvas) {
    const c = document.createElement('canvas');
    c.width = 9; c.height = 8;
    hashCanvas = c.getContext('2d', { willReadFrequently: true })!;
  }
  // Over white, like a viewer shows a transparent image.
  hashCanvas.fillStyle = '#fff';
  hashCanvas.fillRect(0, 0, 9, 8);
  hashCanvas.drawImage(bmp, 0, 0);
  bmp.close();
  const px = hashCanvas.getImageData(0, 0, 9, 8).data;
  const g = (x: number, y: number) => { const i = (y * 9 + x) * 4; return px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114; };
  const out = new Uint32Array(4);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const bit = y * 8 + x, word = bit < 32 ? 0 : 1, shift = bit % 32;
      if (g(x, y) > g(x + 1, y)) out[word] |= (1 << shift) >>> 0;
      // The mirrored image's pixel x is this one's 8 - x.
      if (g(8 - x, y) > g(7 - x, y)) out[2 + word] |= (1 << shift) >>> 0;
    }
  }
  return out;
}

const scopeItems = (scope: string): CurateItem[] => (scope === '*' ? items.filter((it) => it.style !== JUNK) : items.filter((it) => it.style === scope));

async function scanDupes(scope: string): Promise<void> {
  if (!root || dupeScan) return;
  const todo = scopeItems(scope);
  const scan = { scope, done: 0, total: todo.length, stage: 'Comparing images', cancelled: false };
  dupeScan = scan;
  render();
  let cache: Record<string, string> = {};
  try { cache = JSON.parse(await (await (await root.getFileHandle(HASH_FILE)).getFile()).text()) || {}; } catch { cache = {}; }
  let changed = false;
  const queue = todo.filter((it) => !it.hash);
  const worker = async () => {
    for (let it = queue.shift(); it && !scan.cancelled; it = queue.shift()) {
      try {
        const f = await it.handle.getFile();
        it.bytes = f.size;
        const key = hashKey(it, f);
        const hit = cache[key];
        if (hit && /^[0-9a-f]{32}$/.test(hit)) {
          it.hash = Uint32Array.from([0, 8, 16, 24].map((o) => parseInt(hit.slice(o, o + 8), 16)));
        } else {
          it.hash = await computeHash(f);
          cache[key] = Array.from(it.hash, (n) => n.toString(16).padStart(8, '0')).join('');
          changed = true;
        }
      } catch { /* unreadable image: left out */ }
      scan.done++;
      updateScanProgress();
    }
  };
  scan.done = todo.length - queue.length;
  await Promise.all([worker(), worker(), worker(), worker()]);
  if (changed && root) {
    try { await writeBytes(await root.getFileHandle(HASH_FILE, { create: true }), JSON.stringify(cache)); } catch { /* read-only folder: hashes stay in memory */ }
  }
  if (scan.cancelled) { dupeScan = null; view = 'grid'; render(); return; }
  scan.stage = 'Checking sizes';
  updateScanProgress();
  const groups = groupDupes(todo);
  // The keeper is the biggest copy, so every member's size is needed.
  for (const it of groups.flatMap((gr) => gr.members)) {
    if (it.w && it.h && it.bytes) continue;
    try {
      const f = await it.handle.getFile();
      it.bytes = f.size;
      const bmp = await createImageBitmap(f);
      it.w = bmp.width; it.h = bmp.height;
      bmp.close();
    } catch { /* keeps unknown size */ }
  }
  for (const gr of groups) gr.keep = new Set([pickKeeper(gr.members)]);
  dupeScan = null;
  dupe = { scope, groups };
  if (view === 'dupes') render();
}

function groupDupes(list: CurateItem[]): DupeGroup[] {
  const hashed = list.filter((it) => it.hash);
  const parent = hashed.map((_, i) => i);
  const find = (i: number): number => { while (parent[i] !== i) { parent[i] = parent[parent[i]]; i = parent[i]; } return i; };
  for (let i = 0; i < hashed.length; i++) {
    for (let j = i + 1; j < hashed.length; j++) {
      if (hashDistance(hashed[i].hash!, hashed[j].hash!) <= dupeBits) parent[find(i)] = find(j);
    }
  }
  const by = new Map<number, CurateItem[]>();
  hashed.forEach((it, i) => { const r = find(i); by.set(r, [...(by.get(r) || []), it]); });
  return [...by.values()].filter((m) => m.length > 1).map((members) => ({ members, keep: new Set<CurateItem>() }));
}

// Most pixels, then the larger file (less compressed), then not low-res.
function pickKeeper(members: CurateItem[]): CurateItem {
  return [...members].sort((a, b) => ((b.w || 0) * (b.h || 0) - (a.w || 0) * (a.h || 0)) || ((b.bytes || 0) - (a.bytes || 0)))[0];
}

function updateScanProgress(): void {
  const bar = curateTab.querySelector<HTMLElement>('.curate-scan');
  if (!bar || !dupeScan) return;
  bar.querySelector('.curate-scan-text')!.textContent = `${dupeScan.stage}… ${dupeScan.done} / ${dupeScan.total}`;
  (bar.querySelector('.curate-scan-fill') as HTMLElement).style.width = `${dupeScan.total ? (100 * dupeScan.done) / dupeScan.total : 0}%`;
}

function showDupes(): void {
  view = 'dupes';
  render();
}

// Moves every unkept copy (in the given groups) to the junk folder.
async function junkExtras(groups: DupeGroup[]): Promise<void> {
  const extras = groups.flatMap((gr) => gr.members.filter((m) => !gr.keep.has(m)));
  if (!extras.length) { toast('Nothing to junk: every image in these groups is marked Keep.', 2600); return; }
  if (!styles.includes(JUNK) && !(await createStyle(true))) return;
  await assign(extras, JUNK);
  pruneDupes();
}

// After moves: drop images that left the scope (junked, or moved out of the
// one folder being checked); a group with one image left isn't a group.
function pruneDupes(): void {
  if (dupe) {
    const inScope = (m: CurateItem) => (dupe!.scope === '*' ? m.style !== JUNK : m.style === dupe!.scope);
    for (const gr of dupe.groups) {
      gr.members = gr.members.filter(inScope);
      for (const k of [...gr.keep]) if (!gr.members.includes(k)) gr.keep.delete(k);
    }
    dupe.groups = dupe.groups.filter((gr) => gr.members.length > 1);
  }
  render();
}

const dupeExtras = (): number => (dupe ? dupe.groups.reduce((s, gr) => s + gr.members.length - gr.keep.size, 0) : 0);
function dupeSummary(): string {
  if (!dupe) return '';
  const where = dupe.scope === '*' ? 'all folders (not junk)' : styleLabel(dupe.scope);
  const n = dupe.groups.length, extra = dupeExtras();
  return n ? `${n} group${n === 1 ? '' : 's'} of look-alikes in ${where} · ${extra} extra cop${extra === 1 ? 'y' : 'ies'}` : `No duplicates in ${where}.`;
}
// After an in-place Keep toggle: the counts in the header follow.
function refreshDupeCounts(): void {
  const sum = curateTab.querySelector('.curate-dupes-sum');
  if (sum) sum.textContent = dupeSummary();
  const all = curateTab.querySelector('.curate-junk-all');
  if (all) all.textContent = `Junk all extras (${dupeExtras()})`;
}

function renderDupes(): HTMLElement {
  const wrap = el('div', 'curate-dupes');
  const scope = filter;
  if (dupeScan) {
    const p = el('div', 'curate-scan');
    const track = el('div', 'curate-scan-track');
    track.appendChild(el('div', 'curate-scan-fill'));
    p.append(el('span', 'curate-scan-text'), track, btn('Cancel', 'Stop looking', () => { if (dupeScan) dupeScan.cancelled = true; }));
    wrap.appendChild(p);
    queueMicrotask(updateScanProgress);
    return wrap;
  }
  if (!dupe || dupe.scope !== scope) { void scanDupes(scope); return wrap; }

  const head = el('div', 'curate-row curate-dupes-head');
  const n = dupe.groups.length, extra = dupeExtras();
  head.append(el('span', 'curate-dupes-sum', dupeSummary()));
  const strict = el('label', 'curate-label', 'Strictness');
  const sel = el('select');
  for (const [label, bits] of STRICTNESS) { const o = el('option', '', label); o.value = String(bits); sel.appendChild(o); }
  sel.value = String(dupeBits);
  sel.title = 'Strict: near-identical copies only. Loose: also catches lightly edited ones (and more false matches).';
  sel.addEventListener('change', () => {
    dupeBits = Number(sel.value);
    // Hashes are kept: regrouping is instant (dupe cleared → rescan uses them).
    dupe = null;
    render();
  });
  strict.appendChild(sel);
  head.appendChild(strict);
  head.appendChild(btn('Rescan', 'Look again (after adding or moving images)', () => { dupe = null; render(); }));
  const canJunk = scope !== JUNK; // already in junk: nothing to move
  if (n && canJunk) head.appendChild(btn(`Junk all extras (${extra})`, 'Move every copy not marked Keep, in every group, to the junk folder', () => void junkExtras(dupe!.groups), 'curate-junk-btn curate-junk-all'));
  wrap.appendChild(head);
  if (n) wrap.appendChild(el('div', 'curate-note', 'The biggest copy in each group is marked Keep. Click an image to switch Keep on or off; double-click it to zoom in. Junk moves the unkept ones into the junk folder (nothing is deleted).'));

  dupe.groups.forEach((gr, gi) => {
    const box = el('div', 'curate-dupe-group');
    const top = el('div', 'curate-row');
    top.appendChild(el('span', 'curate-dupe-title', `Group ${gi + 1} · ${gr.members.length} images`));
    if (canJunk) top.appendChild(btn('Junk the others', 'Move the copies not marked Keep to the junk folder', () => void junkExtras([gr]), 'curate-junk-btn'));
    top.appendChild(btn('Not duplicates', 'Hide this group (it comes back on Rescan)', () => { dupe!.groups.splice(gi, 1); render(); }));
    const row = el('div', 'curate-dupe-row');
    for (const it of gr.members) {
      const kept = gr.keep.has(it);
      const card = el('div', 'curate-card curate-dupe-card' + (kept ? ' keep' : ''));
      card.title = `${it.name}\nClick: mark/unmark Keep · Double-click: zoom in`;
      const img = el('img');
      img.alt = '';
      img.decoding = 'async';
      if (it.thumb) img.src = it.thumb;
      else void thumbOf(it, () => img.isConnected).then((u) => { img.src = u; }).catch(() => undefined);
      const res = resLabel(it);
      res.classList.add('curate-res-card');
      const tag = el('span', 'curate-keep-tag', kept ? 'Keep' : 'Extra');
      const foot = el('div', 'curate-card-foot');
      foot.append(el('span', 'curate-name', it.name), badge(it.style));
      const size = el('div', 'curate-dupe-meta', it.bytes ? `${(it.bytes / 1024 / 1024).toFixed(2)} MB` : '');
      // One copy can be its own variant (flat colours, monochrome…): move
      // just this image to an artstyle, the rest of the group stays.
      const move = styleSelect('\u0000', (st) => {
        if (st !== '\u0001') { void assign([it], st).then(pruneDupes); return; }
        void createStyle(false).then((name) => (name ? assign([it], name).then(pruneDupes) : render()));
      }, { placeholder: 'Move to…' });
      const newOpt = el('option', '', '+ New artstyle…');
      newOpt.value = '\u0001';
      move.appendChild(newOpt);
      move.classList.add('curate-dupe-move');
      move.title = 'Move just this image to an artstyle folder (e.g. a flat-colour or monochrome variant)';
      for (const o of Array.from(move.options)) if (o.value === it.style) o.disabled = true;
      move.addEventListener('click', (ev) => ev.stopPropagation());
      move.addEventListener('pointerdown', (ev) => ev.stopPropagation());
      card.append(img, res, tag, foot, size, move);
      // Click = Keep on/off, double-click = zoom. The click waits a moment so
      // a double-click doesn't also flip Keep twice. Updated in place (no
      // re-render: the thumbnails would reload).
      let clickTimer = 0;
      card.addEventListener('click', () => {
        clearTimeout(clickTimer);
        clickTimer = window.setTimeout(() => {
          const on = !gr.keep.has(it);
          if (on) gr.keep.add(it); else gr.keep.delete(it);
          card.classList.toggle('keep', on);
          tag.textContent = on ? 'Keep' : 'Extra';
          refreshDupeCounts();
        }, 220);
      });
      card.addEventListener('dblclick', () => {
        clearTimeout(clickTimer);
        // ← / → in the lightbox step through this image's duplicate group.
        const fam = gr.members;
        void urlOf(it).then((u) => showImageLightbox(u, undefined, {
          count: fam.length,
          index: fam.indexOf(it),
          load: (i) => urlOf(fam[i]),
          label: (i) => `${fam[i].name}${fam[i].w ? ` · ${fam[i].w}×${fam[i].h}` : ''}${gr.keep.has(fam[i]) ? ' · Keep' : ''}`
        }));
      });
      row.appendChild(card);
    }
    box.append(top, row);
    wrap.appendChild(box);
  });
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
    await openDir(dir, await trackFolder(dir));
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
