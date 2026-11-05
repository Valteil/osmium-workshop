// Pick an image from the output folder (the in-app gallery's backend, root and
// subfolders) instead of the OS file dialog. Used by the Upscale tab's
// "Choose image…" (both shells). Thumbnails load lazily as they scroll in.
// The footer's "Use native file select" closes this and hands over to the
// caller's own <input type=file> (`onNative`, called inside the click so the
// browser still counts it as a user gesture).
import type { StorageBackend } from './storage';
import { scanImages, groupByFolder, base64ToBytes } from './storage';

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
  const list = document.createElement('div');
  list.className = 'picker-list gpick-list';
  const foot = document.createElement('div');
  foot.className = 'gpick-foot';
  const nativeBtn = document.createElement('button');
  nativeBtn.type = 'button';
  nativeBtn.textContent = 'Use native file select';
  nativeBtn.title = 'Pick any image with the standard file dialog instead';
  foot.appendChild(nativeBtn);
  box.append(head, search, list, foot);
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
  function render(): void {
    io.disconnect();
    thumbs.clear();
    list.innerHTML = '';
    const q = search.value.trim().toLowerCase();
    const rels = q ? all.filter((r) => r.toLowerCase().includes(q)) : all;
    if (!rels.length) {
      const empty = document.createElement('div');
      empty.className = 'picker-empty';
      empty.textContent = q ? 'No matches.' : 'No images in your output folder yet.';
      list.appendChild(empty);
      return;
    }
    for (const g of groupByFolder(rels)) {
      const h = document.createElement('div');
      h.className = 'gpick-folder';
      h.textContent = g.key || 'Output folder';
      const grid = document.createElement('div');
      grid.className = 'gpick-grid';
      for (const rel of g.items) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'gpick-cell';
        const name = rel.slice(rel.lastIndexOf('/') + 1);
        cell.title = rel;
        const img = document.createElement('img');
        img.alt = '';
        img.decoding = 'async';
        const cap = document.createElement('span');
        cap.className = 'gpick-name';
        cap.textContent = name;
        cell.append(img, cap);
        cell.addEventListener('click', () => { void choose(rel); });
        thumbs.set(cell, rel);
        io.observe(cell);
        grid.appendChild(cell);
      }
      list.append(h, grid);
    }
  }

  search.addEventListener('input', render);
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
  void scanImages(backend).then((rels) => {
    if (closed) return;
    all = rels;
    render();
  }).catch((e) => {
    if (closed) return;
    loading.textContent = 'Could not list your output folder: ' + (e instanceof Error ? e.message : String(e));
  });
}
