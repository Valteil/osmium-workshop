// Pick an image from the output folder (the in-app gallery's backend, root and
// subfolders) instead of the OS file dialog. Used by the Upscale tab's
// "Choose image…" (both shells). Thumbnails load lazily as they scroll in.
// The footer's "Use native file select" closes this and hands over to the
// caller's own <input type=file> (`onNative`, called inside the click so the
// browser still counts it as a user gesture). Sort: newest first by default,
// remembered in `comfybridge-gpick-sort` (the gallery's compare). It browses
// one folder at a time: subfolders always sit on top, then that folder's
// images; typing a filter searches every folder instead.
import type { StorageBackend, DirEntry } from './storage';
import { isGalleryImage, groupByFolder, base64ToBytes } from './storage';
import { compareNames, type GallerySortMode } from './gallery';
import { bridgeIcon } from './icons';
import { NavHistory, onSideButtons } from './nav-history';

const SORT_KEY = 'comfybridge-gpick-sort';
const SORTS: [GallerySortMode, string][] = [
  ['date-desc', 'Newest first'], ['date-asc', 'Oldest first'],
  ['name-asc', 'Name ↓'], ['name-desc', 'Name ↑'],
];

// scanImages() with each image's mtime, for date sorting.
async function scanWithDates(backend: StorageBackend): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  async function walk(relDir: string): Promise<void> {
    let entries: DirEntry[];
    try { entries = await backend.listDir(relDir); } catch { return; }
    const subdirs: string[] = [];
    for (const f of entries) {
      if (!f || !f.name) continue;
      const rel = relDir ? relDir + '/' + f.name : f.name;
      if (f.kind === 'directory') subdirs.push(rel);
      else if (f.kind === 'file' && isGalleryImage(f.name)) out.set(rel, Number(f.mtime) || 0);
    }
    for (const sub of subdirs) await walk(sub);
  }
  await walk('');
  return out;
}

export interface GalleryPick { name: string; rel: string; bytes: Uint8Array; mime: string; }

export function openGalleryImagePicker(
  backend: StorageBackend,
  onPick: (p: GalleryPick) => void,
  onNative: () => void
): void {
  const backdrop = document.createElement('div');
  backdrop.className = 'picker-backdrop';
  const box = document.createElement('div');
  box.className = 'picker-box gpick-box';
  const head = document.createElement('div');
  head.className = 'picker-head';
  const titleEl = document.createElement('span');
  titleEl.className = 'd';
  titleEl.textContent = 'Choose an image from your output folder';
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'picker-close';
  closeBtn.textContent = '×';
  head.append(titleEl, closeBtn);
  const search = document.createElement('input');
  search.type = 'text';
  search.placeholder = 'Filter by name or folder…';
  search.className = 'picker-search';
  const sortSel = document.createElement('select');
  sortSel.className = 'gpick-sort';
  sortSel.title = 'Sort the images in each folder';
  for (const [v, t] of SORTS) { const o = document.createElement('option'); o.value = v; o.textContent = t; sortSel.appendChild(o); }
  try { const v = localStorage.getItem(SORT_KEY); if (v && SORTS.some(([k]) => k === v)) sortSel.value = v; } catch { /* best effort */ }
  const tools = document.createElement('div');
  tools.className = 'gpick-tools';
  tools.append(search, sortSel);
  const list = document.createElement('div');
  list.className = 'picker-list gpick-list';
  const foot = document.createElement('div');
  foot.className = 'gpick-foot';
  const nativeBtn = document.createElement('button');
  nativeBtn.type = 'button';
  nativeBtn.textContent = 'Use native file select';
  nativeBtn.title = 'Pick any image with the standard file dialog instead';
  foot.appendChild(nativeBtn);
  box.append(head, tools, list, foot);
  backdrop.appendChild(box);

  let closed = false;
  const thumbs = new Map<HTMLElement, string>();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const cell = e.target as HTMLElement;
      io.unobserve(cell);
      const rel = thumbs.get(cell);
      if (!rel) continue;
      void backend.readImage(rel).then((src) => {
        if (closed || !src) return;
        const img = cell.querySelector('img');
        if (img) img.src = src;
      }).catch(() => undefined);
    }
  }, { root: list, rootMargin: '200px' });

  function close(): void {
    if (closed) return;
    closed = true;
    io.disconnect();
    backdrop.classList.remove('modal-visible');
    setTimeout(() => backdrop.remove(), 160);
    document.removeEventListener('keydown', onKey);
  }
  function onKey(ev: KeyboardEvent): void { if (ev.key === 'Escape') close(); }

  async function choose(rel: string): Promise<void> {
    const src = await backend.readImage(rel).catch(() => null);
    if (closed) return;
    if (!src) { titleEl.textContent = 'Could not read that image.'; return; }
    const m = /^data:([^;,]+);base64,(.*)$/.exec(src);
    if (!m) { titleEl.textContent = 'Could not read that image.'; return; }
    close();
    onPick({ name: rel.slice(rel.lastIndexOf('/') + 1), rel, bytes: base64ToBytes(m[2]), mime: m[1] });
  }

  let all: string[] = [];
  let dates = new Map<string, number>();
  let cwd = ''; // the folder being browsed ('' = the output folder itself)

  function imageCell(rel: string): HTMLButtonElement {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'gpick-cell';
    cell.title = rel;
    const img = document.createElement('img');
    img.alt = '';
    img.decoding = 'async';
    const cap = document.createElement('span');
    cap.className = 'gpick-name';
    cap.textContent = rel.slice(rel.lastIndexOf('/') + 1);
    cell.append(img, cap);
    cell.addEventListener('click', () => { void choose(rel); });
    thumbs.set(cell, rel);
    io.observe(cell);
    return cell;
  }
  // Folders visited, for the mouse's Back / Forward side buttons. Back with
  // nothing left closes the picker (as the gallery sidebar's Back does).
  const nav = new NavHistory<string>((a, b) => a === b);
  nav.visit('');
  function openDir(dir: string, fromHistory = false): void {
    if (!fromHistory) nav.visit(dir);
    cwd = dir;
    if (search.value) search.value = '';
    render();
    list.scrollTop = 0;
  }
  onSideButtons(backdrop, () => {
    const d = nav.goBack();
    if (d === null) close(); else openDir(d, true);
  }, () => { const d = nav.goForward(); if (d !== null) openDir(d, true); });
  function empty(text: string): void {
    const e = document.createElement('div');
    e.className = 'picker-empty';
    e.textContent = text;
    list.appendChild(e);
  }

  function render(): void {
    io.disconnect();
    thumbs.clear();
    list.innerHTML = '';
    const mode = sortSel.value as GallerySortMode;
    const byMode = (a: string, b: string) => compareNames(a, b, mode, dates.get(a) || 0, dates.get(b) || 0);
    const q = search.value.trim().toLowerCase();
    if (q) {
      // Filtering searches every folder, grouped by folder.
      const rels = all.filter((r) => r.toLowerCase().includes(q));
      if (!rels.length) { empty('No matches.'); return; }
      for (const g of groupByFolder(rels)) {
        const h = document.createElement('div');
        h.className = 'gpick-folder';
        h.textContent = g.key || 'Output folder';
        const grid = document.createElement('div');
        grid.className = 'gpick-grid';
        for (const rel of g.items.sort(byMode)) grid.appendChild(imageCell(rel));
        list.append(h, grid);
      }
      return;
    }
    // Browsing: the path, then this folder's subfolders (always first), then its images.
    const crumb = document.createElement('div');
    crumb.className = 'gpick-crumb';
    const parts = cwd ? cwd.split('/') : [];
    const seg = (label: string, dir: string, current: boolean) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'gpick-crumb-seg';
      b.textContent = label;
      b.disabled = current;
      b.addEventListener('click', () => openDir(dir));
      crumb.appendChild(b);
    };
    seg('Output folder', '', !parts.length);
    parts.forEach((p, i) => {
      crumb.append(' › ');
      seg(p, parts.slice(0, i + 1).join('/'), i === parts.length - 1);
    });
    list.appendChild(crumb);
    const prefix = cwd ? cwd + '/' : '';
    const sub = new Map<string, number>();
    const here: string[] = [];
    for (const rel of all) {
      if (!rel.startsWith(prefix)) continue;
      const rest = rel.slice(prefix.length);
      const slash = rest.indexOf('/');
      if (slash < 0) here.push(rel);
      else { const d = rest.slice(0, slash); sub.set(d, (sub.get(d) || 0) + 1); }
    }
    if (!sub.size && !here.length) { empty(cwd ? 'No images in this folder.' : 'No images in your output folder yet.'); return; }
    if (sub.size) {
      const dirs = document.createElement('div');
      dirs.className = 'gpick-dirs';
      const names = [...sub.keys()].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
      if (mode === 'name-desc') names.reverse();
      for (const d of names) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'gpick-dir';
        b.innerHTML = bridgeIcon('folder');
        const label = document.createElement('span');
        label.className = 'gpick-dir-name';
        label.textContent = d;
        const count = document.createElement('span');
        count.className = 'gpick-dir-count';
        count.textContent = String(sub.get(d));
        b.append(label, count);
        b.title = `Open ${prefix + d} (${sub.get(d)} image${sub.get(d) === 1 ? '' : 's'} inside)`;
        b.addEventListener('click', () => openDir(prefix + d));
        dirs.appendChild(b);
      }
      list.appendChild(dirs);
    }
    if (here.length) {
      const grid = document.createElement('div');
      grid.className = 'gpick-grid';
      for (const rel of here.sort(byMode)) grid.appendChild(imageCell(rel));
      list.appendChild(grid);
    }
  }

  search.addEventListener('input', () => { render(); list.scrollTop = 0; });
  sortSel.addEventListener('change', () => {
    try { localStorage.setItem(SORT_KEY, sortSel.value); } catch { /* best effort */ }
    render();
    list.scrollTop = 0;
  });
  backdrop.addEventListener('click', (ev) => { if (ev.target === backdrop) close(); });
  closeBtn.addEventListener('click', close);
  nativeBtn.addEventListener('click', () => { close(); onNative(); });
  document.addEventListener('keydown', onKey);
  const loading = document.createElement('div');
  loading.className = 'picker-empty';
  loading.textContent = 'Loading…';
  list.appendChild(loading);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('modal-visible')));
  void scanWithDates(backend).then((found) => {
    if (closed) return;
    dates = found;
    all = [...found.keys()];
    render();
  }).catch((e) => {
    if (closed) return;
    loading.textContent = 'Could not list your output folder: ' + (e instanceof Error ? e.message : String(e));
  });
}
