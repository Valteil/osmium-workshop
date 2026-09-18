// Shared generations gallery for Comfy Bridge (desktop + mobile).
// Off-canvas sidebar sliding in horizontally from the right: the FAB opens
// it, × or the backdrop closes it. Two views over the same injected
// StorageBackend (Electron IPC on desktop, SAF/Documents on mobile):
//   - flat (mobile default): one live recursive scan, images grouped under
//     per-subfolder headers, no entry cap;
//   - browser (desktop): folder navigation — one level at a time, breadcrumb
//     + tap-to-open subfolders to any depth, images sorted by filename with
//     an asc/desc toggle (persisted).
// Either way the folder is the source of truth (no history list); tap a
// thumbnail for the zoomable lightbox.
import type { StorageBackend } from './storage';
import { scanImages, groupByFolder, fileNumber, isGalleryImage } from './storage';
import { showImageLightbox } from './lightbox';

export interface GalleryHandles {
  fab: HTMLButtonElement;
  backdrop: HTMLDivElement;
  sidebar: HTMLElement;
  closeBtn: HTMLButtonElement;
  count: HTMLSpanElement;
  grid: HTMLDivElement;
  empty: HTMLDivElement;
  navRow: HTMLDivElement;
  crumb: HTMLDivElement;
  sortBtn: HTMLButtonElement;
}

export interface GalleryOptions {
  navigable?: boolean;
}

export type GallerySortMode = 'name-asc' | 'name-desc' | 'date-desc' | 'date-asc';
const SORT_KEY = 'bridge-shared-gallery-sort';
const SORT_ORDER: GallerySortMode[] = ['name-asc', 'name-desc', 'date-desc', 'date-asc'];
const SORT_LABELS: Record<GallerySortMode, string> = {
  'name-asc': 'Name ↓',
  'name-desc': 'Name ↑',
  'date-desc': 'Date ↓',
  'date-asc': 'Date ↑',
};

function loadSortMode(): GallerySortMode {
  try {
    const v = localStorage.getItem(SORT_KEY);
    if (v === 'name-desc' || v === 'date-desc' || v === 'date-asc') return v;
  } catch {
    /* best effort */
  }
  return 'name-asc';
}

// Pinned favorite folders, keyed by location label so pins never leak
// across different save roots.
const PINS_KEY = 'bridge-shared-gallery-pins';

function readPinMap(): Record<string, string[]> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(PINS_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}

function loadPins(locationLabel: string): string[] {
  const arr = readPinMap()[locationLabel];
  return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : [];
}

function savePins(locationLabel: string, pins: string[]): void {
  try {
    const all = readPinMap();
    all[locationLabel] = pins;
    localStorage.setItem(PINS_KEY, JSON.stringify(all));
  } catch {
    /* best effort */
  }
}

let galleryRenderToken = 0;

// Images render one page at a time behind a "Show more" button: a folder
// with thousands of images must never queue thousands of reads/decodes at
// once (that layout+decode storm was the gallery "jiggle"). Placeholders
// for a page append synchronously in one batch, then fill progressively.
const PAGE_SIZE = 60;

async function renderThumbSlice(
  backend: StorageBackend,
  h: GalleryHandles,
  token: number,
  rels: string[]
): Promise<boolean> {
  const imgs: HTMLImageElement[] = [];
  for (const rel of rels) {
    if (token !== galleryRenderToken) return false;
    const img = document.createElement('img');
    img.className = 'gallery-thumb';
    img.alt = rel;
    img.loading = 'lazy';
    img.decoding = 'async';
    h.grid.appendChild(img);
    imgs.push(img);
  }
  for (let i = 0; i < rels.length; i++) {
    if (token !== galleryRenderToken) return false;
    const url = await backend.readImage(rels[i]);
    if (token !== galleryRenderToken) return false;
    const img = imgs[i];
    if (!url) {
      img.remove();
      continue;
    }
    img.src = url;
    img.addEventListener('click', () => showImageLightbox(url));
  }
  return true;
}

function appendMoreButton(h: GalleryHandles, remaining: number, onMore: () => void): void {
  const btn = document.createElement('button');
  btn.className = 'gallery-more-btn';
  btn.textContent = `Show more (${remaining} remaining)`;
  btn.addEventListener('click', onMore);
  h.grid.appendChild(btn);
}

export function mountGallerySidebar(
  getBackend: () => StorageBackend,
  getLocationLabel: () => string,
  opts?: GalleryOptions
): GalleryHandles {
  const navigable = !!opts?.navigable;
  const fab = document.createElement('button');
  fab.id = 'galleryFab';
  fab.title = 'Open gallery';
  fab.textContent = '🖼';
  const backdrop = document.createElement('div');
  backdrop.id = 'galleryBackdrop';
  const sidebar = document.createElement('aside');
  sidebar.id = 'gallerySidebar';
  sidebar.innerHTML =
    '<div class="gallery-side-head"><span class="d">Gallery</span>' +
    '<span id="galleryCount" class="muted small"></span>' +
    '<button id="galleryCloseBtn" title="Close gallery">×</button></div>' +
    '<div id="galleryNavRow" class="gallery-nav-row" style="display:none">' +
    '<div id="galleryCrumb" class="gallery-crumb"></div>' +
    '<button id="gallerySortBtn" class="gallery-sort-btn" title="Sort by filename"></button></div>' +
    '<div id="galleryGrid" class="gallery-grid"></div>' +
    '<div id="galleryEmpty" class="muted small"></div>';
  document.body.appendChild(fab);
  document.body.appendChild(backdrop);
  document.body.appendChild(sidebar);
  const h: GalleryHandles = {
    fab,
    backdrop: backdrop as HTMLDivElement,
    sidebar,
    closeBtn: sidebar.querySelector('#galleryCloseBtn') as HTMLButtonElement,
    count: sidebar.querySelector('#galleryCount') as HTMLSpanElement,
    grid: sidebar.querySelector('#galleryGrid') as HTMLDivElement,
    empty: sidebar.querySelector('#galleryEmpty') as HTMLDivElement,
    navRow: sidebar.querySelector('#galleryNavRow') as HTMLDivElement,
    crumb: sidebar.querySelector('#galleryCrumb') as HTMLDivElement,
    sortBtn: sidebar.querySelector('#gallerySortBtn') as HTMLButtonElement,
  };
  // Per-mount browser state (desktop only uses it).
  let relDir = '';
  let sortMode: GallerySortMode = loadSortMode();
  function open(): void {
    sidebar.classList.add('open');
    backdrop.classList.add('show');
    if (navigable) {
      relDir = '';
      void renderBrowserLevel(getBackend(), h, getLocationLabel(), { getDir: () => relDir, setDir: (d: string) => { relDir = d; }, getSort: () => sortMode, setSort: (s: GallerySortMode) => { sortMode = s; } });
    } else {
      void renderGallery(getBackend(), h, getLocationLabel());
    }
  }
  function close(): void {
    sidebar.classList.remove('open');
    backdrop.classList.remove('show');
    galleryRenderToken++;
  }
  fab.addEventListener('click', open);
  h.closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  return h;
}

interface BrowserState {
  getDir: () => string;
  setDir: (d: string) => void;
  getSort: () => GallerySortMode;
  setSort: (s: GallerySortMode) => void;
}

// Name compare is numeric-aware (N.png orders by N); date compare falls
// back to name on ties or missing mtimes.
function compareNames(a: string, b: string, mode: GallerySortMode, mtimeA: number, mtimeB: number): number {
  if (mode === 'date-desc' || mode === 'date-asc') {
    if (mtimeA !== mtimeB) return mode === 'date-desc' ? mtimeB - mtimeA : mtimeA - mtimeB;
  }
  const baseA = a.slice(a.lastIndexOf('/') + 1);
  const baseB = b.slice(b.lastIndexOf('/') + 1);
  const numA = fileNumber(baseA);
  const numB = fileNumber(baseB);
  let cmp: number;
  if (numA >= 0 && numB >= 0) cmp = numA - numB;
  else if (numA >= 0) cmp = -1;
  else if (numB >= 0) cmp = 1;
  else cmp = baseA.toLowerCase() < baseB.toLowerCase() ? -1 : 1;
  return mode === 'name-desc' ? -cmp : cmp;
}

function renderCrumb(
  h: GalleryHandles,
  locationLabel: string,
  relDir: string,
  onNav: (dir: string) => void
): void {
  h.crumb.innerHTML = '';
  const rootBtn = document.createElement('button');
  rootBtn.className = 'gallery-crumb-btn';
  rootBtn.textContent = locationLabel;
  rootBtn.addEventListener('click', () => onNav(''));
  h.crumb.appendChild(rootBtn);
  if (!relDir) return;
  const segs = relDir.split('/');
  let acc = '';
  for (const seg of segs) {
    const sep = document.createElement('span');
    sep.className = 'gallery-crumb-sep';
    sep.textContent = '›';
    h.crumb.appendChild(sep);
    acc = acc ? acc + '/' + seg : seg;
    const target = acc;
    const btn = document.createElement('button');
    btn.className = 'gallery-crumb-btn';
    btn.textContent = seg;
    btn.addEventListener('click', () => onNav(target));
    h.crumb.appendChild(btn);
  }
}

export async function renderBrowserLevel(
  backend: StorageBackend,
  h: GalleryHandles,
  locationLabel: string,
  state: BrowserState
): Promise<void> {
  const token = ++galleryRenderToken;
  const relDir = state.getDir();
  const sortMode = state.getSort();
  h.navRow.style.display = '';
  h.grid.innerHTML = '';
  h.count.textContent = '';
  h.empty.style.display = 'none';
  h.sortBtn.textContent = SORT_LABELS[sortMode];
  const navTo = (dir: string): void => {
    state.setDir(dir);
    void renderBrowserLevel(backend, h, locationLabel, state);
  };
  const rerender = (): void => {
    void renderBrowserLevel(backend, h, locationLabel, state);
  };
  renderCrumb(h, locationLabel, relDir, navTo);
  h.sortBtn.onclick = () => {
    const next = SORT_ORDER[(SORT_ORDER.indexOf(state.getSort()) + 1) % SORT_ORDER.length];
    state.setSort(next);
    try {
      localStorage.setItem(SORT_KEY, next);
    } catch {
      /* best effort */
    }
    rerender();
  };
  let entries;
  try {
    entries = await backend.listDir(relDir);
  } catch {
    entries = null;
  }
  if (token !== galleryRenderToken) return;
  if (!entries) {
    h.empty.style.display = '';
    h.empty.textContent = 'Nothing yet in ' + locationLabel + ' — pick an output folder to browse it here.';
    return;
  }
  const subdirs = entries
    .filter((e) => e && e.kind === 'directory')
    .map((e) => e.name)
    .sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1));
  const mtimeByName = new Map<string, number>();
  for (const e of entries) {
    if (e && typeof e.name === 'string') mtimeByName.set(e.name, typeof e.mtime === 'number' ? e.mtime : 0);
  }
  const images = entries
    .filter((e) => e && e.kind === 'file' && isGalleryImage(e.name))
    .map((e) => (relDir ? relDir + '/' + e.name : e.name))
    .sort((a, b) =>
      compareNames(
        a,
        b,
        sortMode,
        mtimeByName.get(a.slice(a.lastIndexOf('/') + 1)) || 0,
        mtimeByName.get(b.slice(b.lastIndexOf('/') + 1)) || 0
      )
    );
  // Pinned favorites live at the root level only, above everything else.
  let pins: string[] = [];
  if (!relDir) {
    pins = loadPins(locationLabel).filter((p) => subdirs.includes(p));
  }
  const togglePin = (name: string): void => {
    const cur = loadPins(locationLabel);
    const next = cur.includes(name) ? cur.filter((p) => p !== name) : [...cur, name];
    savePins(locationLabel, next);
    rerender();
  };
  const folderRow = (name: string, target: string, pinned: boolean): HTMLDivElement => {
    const row = document.createElement('div');
    row.className = 'gallery-folder-row';
    const openBtn = document.createElement('button');
    openBtn.className = 'gallery-folder-open';
    openBtn.textContent = '📁 ' + name;
    openBtn.addEventListener('click', () => navTo(target));
    const pinBtn = document.createElement('button');
    pinBtn.className = 'gallery-pin-btn' + (pinned ? ' pinned' : '');
    pinBtn.title = pinned ? 'Unpin favorite' : 'Pin as favorite';
    pinBtn.textContent = pinned ? '★' : '☆';
    pinBtn.addEventListener('click', () => togglePin(name));
    row.appendChild(openBtn);
    row.appendChild(pinBtn);
    return row;
  };
  if (!subdirs.length && !images.length) {
    h.empty.style.display = '';
    h.empty.textContent = 'This folder is empty.';
    return;
  }
  h.count.textContent = String(subdirs.length + images.length);
  if (pins.length) {
    const head = document.createElement('div');
    head.className = 'gallery-group-head';
    head.textContent = '📌 Pinned';
    h.grid.appendChild(head);
    for (const name of [...pins].sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1))) {
      h.grid.appendChild(folderRow(name, name, true));
    }
  }
  for (const sub of subdirs) {
    if (pins.includes(sub)) continue;
    h.grid.appendChild(folderRow(sub, relDir ? relDir + '/' + sub : sub, false));
  }
  let shown = 0;
  async function showMore(): Promise<void> {
    h.grid.querySelector('.gallery-more-btn')?.remove();
    const slice = images.slice(shown, shown + PAGE_SIZE);
    shown += slice.length;
    const ok = await renderThumbSlice(backend, h, token, slice);
    if (!ok || token !== galleryRenderToken) return;
    if (shown < images.length) {
      appendMoreButton(h, images.length - shown, () => {
        void showMore();
      });
    }
  }
  await showMore();
}

export async function renderGallery(
  backend: StorageBackend,
  h: GalleryHandles,
  locationLabel: string
): Promise<void> {
  const token = ++galleryRenderToken;
  h.navRow.style.display = 'none';
  h.grid.innerHTML = '';
  h.count.textContent = '';
  h.empty.style.display = 'none';
  const found = await scanImages(backend);
  if (token !== galleryRenderToken) return;
  if (!found.length) {
    h.empty.style.display = '';
    h.empty.textContent =
      'Nothing yet in ' + locationLabel + ' — finished generations appear here. Tap one to view it.';
    return;
  }
  h.count.textContent = String(found.length);
  type FlatNode = { t: 'head'; key: string } | { t: 'img'; rel: string };
  const nodes: FlatNode[] = [];
  for (const group of groupByFolder(found)) {
    nodes.push({ t: 'head', key: group.key });
    for (const rel of group.items) nodes.push({ t: 'img', rel });
  }
  const totalImages = nodes.filter((n) => n.t === 'img').length;
  let cursor = 0;
  let shownImages = 0;
  async function showMore(): Promise<void> {
    h.grid.querySelector('.gallery-more-btn')?.remove();
    const slice: string[] = [];
    while (cursor < nodes.length && slice.length < PAGE_SIZE) {
      const n = nodes[cursor++];
      if (n.t === 'head') {
        const head = document.createElement('div');
        head.className = 'gallery-group-head';
        head.textContent = n.key || 'This folder';
        h.grid.appendChild(head);
      } else {
        slice.push(n.rel);
      }
    }
    shownImages += slice.length;
    const ok = await renderThumbSlice(backend, h, token, slice);
    if (!ok || token !== galleryRenderToken) return;
    if (shownImages < totalImages) {
      appendMoreButton(h, totalImages - shownImages, () => {
        void showMore();
      });
    }
  }
  await showMore();
}
