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
import { showImageLightbox, isLightboxOpen, closeLightbox, type LightboxInfo } from './lightbox';
import { bridgeIcon } from './icons';

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

// The generation-parameters panel beside an opened image (desktop only);
// `relPath` is the image's path inside the output folder.
export type GalleryImageInfo = (src: string, close: () => void, relPath: string) => HTMLElement | null;
export interface GalleryOptions {
  navigable?: boolean;
  imageInfo?: GalleryImageInfo;
  // More than one backend -> a switch row in the panel head (the phone: its
  // own save location vs the PC's picked folder over the relay). Switching
  // resets the folder and re-renders.
  sources?: { label: string; backend(): StorageBackend; thumbSrc?: (rel: string) => Promise<string | null>; fullSrc?: (rel: string) => Promise<string | null> }[];
  // Data saver: the grid loads `thumbSrc` (a small version) instead of the
  // full image; an opened image fetches `fullSrc` (the whole file) once.
  // Without these the grid uses request-readImage for both.
  thumbSrc?: (rel: string) => Promise<string | null>;
  fullSrc?: (rel: string) => Promise<string | null>;
  // An "Info" button in the lightbox instead of an always-on panel (the
  // phone's narrow screen); the desktop keeps its on-at-once panel.
  lazyInfo?: boolean;
}
let imageInfo: GalleryImageInfo | undefined;

// One step back out of the gallery (v2.0.0): close the open image, else go up
// a folder, else close the gallery. Returns false when the gallery isn't
// open, so a caller (Android's Back button) can fall through to its own
// handling. Esc and the mouse's Back side button use it too (wired in
// mountGallerySidebar).
let galleryBackStep: (() => boolean) | null = null;
export function galleryBack(): boolean {
  return galleryBackStep ? galleryBackStep() : false;
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
// The listing the browser grid last rendered (names + mtimes), so a reopened
// gallery can tell whether its folder changed while it was closed.
let lastListingSig = '';
function listingSig(entries: { name: string; kind: string; mtime?: number }[]): string {
  return entries.map((e) => e.kind[0] + e.name + ':' + (e.mtime || 0)).sort().join('|');
}

// Images render one page at a time behind a "Show more" button: a folder
// with thousands of images must never queue thousands of reads/decodes at
// once (that layout+decode storm was the gallery "jiggle"). Placeholders
// for a page append synchronously in one batch, then fill progressively.
const PAGE_SIZE = 60;
// The whole mount's options, set at mount time so every render page (and
// every slice) can see shared decisions like the lightbox Info mode even
// when the caller passes nothing per level.
let mountedOpts: GalleryOptions | undefined = undefined;

// `thumbSrc` (a source's small versions) only loads the grid; `fullSrc` fires
// on open, fetching the whole file on demand — the browser waits for it, the
// lightbox then shows the full-size bytes.
async function renderThumbSlice(
  backend: StorageBackend,
  h: GalleryHandles,
  token: number,
  rels: string[],
  srcs?: { thumbSrc?: (rel: string) => Promise<string | null>; fullSrc?: (rel: string) => Promise<string | null> },
  opts?: GalleryOptions
): Promise<boolean> {
  const imgs: HTMLImageElement[] = [];
  const relByImg = new Map<HTMLImageElement, string>();
  for (const rel of rels) {
    if (token !== galleryRenderToken) return false;
    const img = document.createElement('img');
    img.className = 'gallery-thumb';
    img.alt = rel;
    img.loading = 'lazy';
    img.decoding = 'async';
    h.grid.appendChild(img);
    imgs.push(img);
    relByImg.set(img, rel);
  }
  // A few at a time (each fills its own slot, so the grid order holds): one
  // slow or lost thumbnail no longer holds up every one after it — over a
  // flaky phone link a lost request costs a retry timeout (mobile pcRequest).
  const THUMB_PARALLEL = 4;
  let nextIdx = 0;
  let stale = false;
  const worker = async (): Promise<void> => {
    while (!stale && nextIdx < rels.length) {
      const i = nextIdx++;
      if (token !== galleryRenderToken) { stale = true; return; }
      await loadThumb(i);
    }
  };
  const loadThumb = async (i: number): Promise<void> => {
    const rel = relByImg.get(imgs[i]) || rels[i];
    const url = srcs?.thumbSrc ? await srcs.thumbSrc(rel) : await backend.readImage(rel);
    if (token !== galleryRenderToken) { stale = true; return; }
    const img = imgs[i];
    if (!url) {
      img.remove();
      return;
    }
    img.src = url;
    // The info panel also gets the image's path in the output folder (the
    // thumbnail's alt), looked up by URL so it follows ← / → steps.
    const info: LightboxInfo | undefined = imageInfo
      ? (src, close) => imageInfo!(src, close, galleryThumbRel(h, src))
      : undefined;
    img.addEventListener('click', async () => {
      let openSrc = url;
      if (srcs?.fullSrc && rel) {
        try {
          const full = await srcs.fullSrc(rel);
          if (full) openSrc = full;
        } catch {
          /* the lightbox still opens on the small version */
        }
      }
      showImageLightbox(openSrc, () => galleryThumbUrls(h), info, mountedOpts?.lazyInfo);
    });
  };
  await Promise.all(Array.from({ length: Math.min(THUMB_PARALLEL, rels.length) }, worker));
  return !stale && token === galleryRenderToken;
}

// The lightbox's ← / → sequence: every loaded thumbnail in the grid, in order
// (read live, so a "Show more" page opened meanwhile is included).
function galleryThumbUrls(h: GalleryHandles): string[] {
  return Array.from(h.grid.querySelectorAll<HTMLImageElement>('img.gallery-thumb'))
    .map((t) => t.src)
    .filter(Boolean);
}

function galleryThumbRel(h: GalleryHandles, src: string): string {
  for (const t of Array.from(h.grid.querySelectorAll<HTMLImageElement>('img.gallery-thumb'))) {
    if (t.src === src) return t.alt;
  }
  return '';
}

function appendMoreButton(h: GalleryHandles, remaining: number, onMore: () => void): void {
  const btn = document.createElement('button');
  btn.className = 'gallery-more-btn';
  btn.textContent = `Show more (${remaining} remaining)`;
  btn.addEventListener('click', onMore);
  h.grid.appendChild(btn);
}

// More than one shell mounts this at most once; the refresher hangs here so
// a relocation (the lightbox Save details' move) can ask the live grid to
// re-list after a file lands elsewhere.
let activeRefresh: (() => void) | null = null;
export function refreshGallery(): void { activeRefresh?.(); }

export function mountGallerySidebar(
  getBackend: () => StorageBackend,
  getLocationLabel: () => string,
  opts?: GalleryOptions
): GalleryHandles {
  mountedOpts = opts;
  const navigable = !!opts?.navigable;
  imageInfo = opts?.imageInfo;
  const fab = document.createElement('button');
  fab.id = 'galleryFab';
  fab.title = 'Open gallery';
  // Osmium's image icon (./icons.ts), the same line drawing Osmium uses, on
  // both desktop and mobile. It used to be the app's brand icon (desktop) or
  // the 🖼 emoji (mobile, where that asset path doesn't exist).
  fab.setAttribute('aria-label', 'Open gallery');
  fab.innerHTML = bridgeIcon('image');
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
  const sources = opts?.sources && opts.sources.length > 1 ? opts.sources : null;
  let srcIdx = 0;
  let relDir = '';
  let sortMode: GallerySortMode = loadSortMode();
  const browserState = (): BrowserState => ({ getDir: () => relDir, setDir: (d: string) => { relDir = d; }, getSort: () => sortMode, setSort: (s: GallerySortMode) => { sortMode = s; } });
  function renderSourceSwitch(): void {
    if (!sources) return;
    let row = sidebar.querySelector<HTMLElement>('.gallery-source-row');
    if (!row) {
      row = document.createElement('div');
      row.className = 'gallery-source-row';
      sidebar.querySelector('.gallery-side-head')?.after(row);
    }
    row.innerHTML = '';
    for (let i = 0; i < sources.length; i++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'gallery-source-btn' + (i === srcIdx ? ' active' : '');
      b.textContent = sources[i].label;
      b.addEventListener('click', () => {
        if (i === srcIdx) return;
        srcIdx = i;
        relDir = '';           // a different save root: go to its top
        galleryRenderToken++; // stop any in-flight render of the old source
        renderSourceSwitch();
        void render();
      });
      row.appendChild(b);
    }
  }
  // The active backend owner: with `sources` the source owns it; otherwise
  // it is the mount's own backend (the desktop's default single-source).
  function activeBackend(): StorageBackend {
    return sources ? sources[srcIdx].backend() : getBackend();
  }
  function activeThumbSrc(): ((rel: string) => Promise<string | null>) | undefined {
    if (sources) return sources[srcIdx].thumbSrc;
    return opts?.thumbSrc;
  }
  function activeFullSrc(): ((rel: string) => Promise<string | null>) | undefined {
    if (sources) return sources[srcIdx].fullSrc;
    return opts?.fullSrc;
  }
  // With sources the source's own label is the gallery's root label (the
  // phone's "Documents/SAF name" vs the PC's folder name), not the mount's.
  function getLocationText(): string {
    return sources ? sources[srcIdx].label : getLocationLabel();
  }
  function render(): Promise<void> {
    return navigable
      ? renderBrowserLevel(activeBackend(), h, getLocationText(), browserState(), { thumbSrc: activeThumbSrc(), fullSrc: activeFullSrc() })
      : renderGallery(activeBackend(), h, getLocationText(), { thumbSrc: activeThumbSrc(), fullSrc: activeFullSrc() });
  }
  // Closing keeps the place (v2.0.x, the user's call): the folder, the pages
  // shown and the scroll survive a close. Reopening re-lists the folder and
  // only re-renders when its listing changed, then puts the scroll back.
  let rendered = false;
  async function open(): Promise<void> {
    sidebar.classList.add('open');
    backdrop.classList.add('show');
    fab.classList.add('gallery-open');
    renderSourceSwitch();
    if (!rendered || !navigable) {
      rendered = true;
      void render();
      return;
    }
    const keep = { scrollTop: h.grid.scrollTop, shown: h.grid.querySelectorAll('img.gallery-thumb').length };
    let sig: string | null = null;
    try { sig = listingSig(await activeBackend().listDir(relDir)); } catch { /* re-render below shows the error */ }
    if (sig !== null && sig === lastListingSig) return;
    await renderBrowserLevel(activeBackend(), h, getLocationText(), browserState(), { thumbSrc: activeThumbSrc(), fullSrc: activeFullSrc() }, keep.shown);
    h.grid.scrollTop = keep.scrollTop;
  }
  function close(): void {
    sidebar.classList.remove('open');
    backdrop.classList.remove('show');
    fab.classList.remove('gallery-open');
  }
  // The button toggles: the gallery opens from the left, so the button stays
  // uncovered (and above the backdrop) while it's open.
  fab.addEventListener('click', () => { if (sidebar.classList.contains('open')) close(); else void open(); });
  h.closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);

  galleryBackStep = (): boolean => {
    if (!sidebar.classList.contains('open')) return false;
    if (closeLightbox()) return true;
    if (navigable && relDir) {
      relDir = relDir.includes('/') ? relDir.slice(0, relDir.lastIndexOf('/')) : '';
      void render();
      return true;
    }
    close();
    return true;
  };
  // Esc: the open image handles its own Esc, so only act when none is open.
  // Registered at mount, i.e. before any lightbox's own listener.
  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'Escape' || isLightboxOpen() || !sidebar.classList.contains('open')) return;
    ev.preventDefault();
    galleryBack();
  });
  // The mouse's Back side button (button 3), also while an image is open.
  window.addEventListener('mouseup', (ev) => {
    if (ev.button !== 3) return;
    if (galleryBack()) ev.preventDefault();
  });
  activeRefresh = (): void => {
    if (!sidebar.classList.contains('open')) return;
    void render();
  };
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
  state: BrowserState,
  srcs?: { thumbSrc?: (rel: string) => Promise<string | null>; fullSrc?: (rel: string) => Promise<string | null> },
  minShown = 0
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
    void renderBrowserLevel(backend, h, locationLabel, state, srcs);
  };
  const rerender = (): void => {
    void renderBrowserLevel(backend, h, locationLabel, state, srcs);
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
  // An error the backend marks `userFacing` (the PC source over the network:
  // unreachable, or the PC's server refusing) shows its reason. Any other
  // failure (no folder chosen, a phone folder that doesn't exist yet) keeps
  // the "pick a folder" hint.
  let listError = '';
  try {
    entries = await backend.listDir(relDir);
  } catch (err) {
    entries = null;
    if (err instanceof Error && (err as Error & { userFacing?: boolean }).userFacing) listError = err.message;
  }
  if (token !== galleryRenderToken) return;
  lastListingSig = entries ? listingSig(entries) : '';
  if (!entries) {
    h.empty.style.display = '';
    h.empty.textContent = listError
      ? 'Couldn\'t list ' + locationLabel + ': ' + listError
      : 'Nothing yet in ' + locationLabel + ' — pick an output folder to browse it here.';
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
    const ok = await renderThumbSlice(backend, h, token, slice, srcs);
    if (!ok || token !== galleryRenderToken) return;
    // A reopened gallery whose folder changed brings back as many pages as
    // were showing, so the restored scroll lands where it was.
    if (shown < minShown && shown < images.length) return showMore();
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
  locationLabel: string,
  srcs?: { thumbSrc?: (rel: string) => Promise<string | null>; fullSrc?: (rel: string) => Promise<string | null> }
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
    const ok = await renderThumbSlice(backend, h, token, slice, srcs);
    if (!ok || token !== galleryRenderToken) return;
    if (shownImages < totalImages) {
      appendMoreButton(h, totalImages - shownImages, () => {
        void showMore();
      });
    }
  }
  await showMore();
}
