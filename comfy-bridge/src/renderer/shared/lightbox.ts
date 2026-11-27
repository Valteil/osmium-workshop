// Shared image lightbox for Comfy Bridge (desktop + mobile).
// Screen-dimming backdrop; pinch/wheel zoom from 1× to 6×; drag pans only
// while zoomed, clamped so an image edge can never be dragged past the
// viewport edge. Ported from the parent Osmium Workshop app's
// showImageLightbox() — same math, plain framework-free DOM.
function attachLightboxPinch(img: HTMLImageElement, onZoomDelta: (delta: number) => void): void {
  let startDist: number | null = null;
  const dist = (t: TouchList): number =>
    Math.sqrt(Math.pow(t[0].clientX - t[1].clientX, 2) + Math.pow(t[0].clientY - t[1].clientY, 2));
  img.addEventListener(
    'touchstart',
    (ev: TouchEvent) => {
      if (ev.touches.length === 2) startDist = dist(ev.touches);
    },
    { passive: true }
  );
  img.addEventListener(
    'touchmove',
    (ev: TouchEvent) => {
      if (ev.touches.length === 2 && startDist) {
        ev.preventDefault();
        const d = (dist(ev.touches) - startDist) * 0.5;
        if (Math.abs(d) > 2) {
          onZoomDelta(d);
          startDist = dist(ev.touches);
        }
      }
    },
    { passive: false }
  );
  img.addEventListener(
    'touchend',
    (ev: TouchEvent) => {
      if (ev.touches.length < 2) startDist = null;
    },
    { passive: true }
  );
}

// "Load thumbnails only" for remote sources (the phone's PC gallery): opened
// images stay the small thumbnail (which carries its generation details, see
// the runner's gallery_thumb_exif) instead of fetching the full file. One
// setting shared by every view that shows the toggle.
const THUMBS_ONLY_KEY = 'bridge.remoteThumbsOnly';
export function remoteThumbsOnly(): boolean {
  try { return localStorage.getItem(THUMBS_ONLY_KEY) === '1'; } catch { return false; }
}
export function remoteThumbsToggle(): HTMLLabelElement {
  const label = document.createElement('label');
  label.className = 'thumbs-only-toggle';
  label.title = 'Opened images stay the small preview (with their generation details) instead of downloading the full file';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = remoteThumbsOnly();
  box.addEventListener('change', () => {
    try { localStorage.setItem(THUMBS_ONLY_KEY, box.checked ? '1' : '0'); } catch { /* best effort */ }
    document.dispatchEvent(new CustomEvent('bridge-thumbs-only'));
  });
  // Keeps other views' toggles in step; a rebuilt-away toggle unhooks itself.
  const sync = (): void => {
    if (!label.isConnected) { document.removeEventListener('bridge-thumbs-only', sync); return; }
    box.checked = remoteThumbsOnly();
  };
  document.addEventListener('bridge-thumbs-only', sync);
  label.append(box, document.createTextNode(' Load thumbnails only'));
  return label;
}

// The open lightbox's close(), so Back (mouse side button, Android Back) can
// close it from outside — see the gallery's galleryBack().
let closeOpenLightbox: (() => void) | null = null;
export function isLightboxOpen(): boolean { return !!closeOpenLightbox; }
export function closeLightbox(): boolean {
  if (!closeOpenLightbox) return false;
  closeOpenLightbox();
  return true;
}

// `siblings`, when given, returns the image URLs the lightbox can step
// through with ← / → (the gallery passes its loaded thumbnails, in order).
// `info`, when given (desktop gallery only), builds a side panel for the shown
// image, placed left of it and rebuilt on every step; it gets `close` so a
// button in it can dismiss the lightbox. `infoDeferred` (the phone's narrow
// screen) puts an "Info" button in instead and only builds the panel on tap;
// stepping rebuilds it while it is showing.
// `key` is the shown image's entry in `siblings` (its thumbnail when `full` is
// given), for looking up which file it is.
export type LightboxInfo = (src: string, close: () => void, key?: string) => HTMLElement | null;
// `onStep` hears each image ← / → moves to (the result carousel follows it).
// `full` (the phone's PC gallery): `src` and the siblings are small
// thumbnails; the lightbox opens on the thumbnail at once and swaps in the
// full file when `full` returns it. The info panel reads the thumbnail
// meanwhile (it carries the generation details) and is rebuilt on arrival.
// `signal` aborts a fetch the viewer no longer wants (closed / stepped away),
// so an unwanted download doesn't hog a slow link; `onProgress` drives the
// status line.
export type FullOpts = { signal?: AbortSignal; onProgress?: (loaded: number, total: number) => void };
export type LightboxFull = (key: string, opts?: FullOpts) => Promise<string | null>;
// #rrggbb of the image pixel under a viewport point, or null (outside it /
// unreadable).
export function pixelHexAt(img: HTMLImageElement, clientX: number, clientY: number): string | null {
  const r = img.getBoundingClientRect();
  if (!r.width || !r.height || !img.naturalWidth) return null;
  const x = Math.floor(((clientX - r.left) / r.width) * img.naturalWidth);
  const y = Math.floor(((clientY - r.top) / r.height) * img.naturalHeight);
  if (x < 0 || y < 0 || x >= img.naturalWidth || y >= img.naturalHeight) return null;
  try {
    const c = document.createElement('canvas');
    c.width = 1; c.height = 1;
    const g = c.getContext('2d');
    if (!g) return null;
    g.drawImage(img, x, y, 1, 1, 0, 0, 1, 1);
    const d = g.getImageData(0, 0, 1, 1).data;
    return '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join('');
  } catch { return null; }
}

export function showImageLightbox(src: string, siblings?: () => string[], info?: LightboxInfo, infoDeferred?: boolean, onStep?: (src: string) => void, full?: LightboxFull, onShiftPick?: (hex: string) => void): void {
  if (!src) return;
  closeLightbox();
  const backdrop = document.createElement('div');
  backdrop.className = 'lightbox-backdrop';
  const img = document.createElement('img');
  img.src = src;
  // The shown image's sibling entry.
  let cur = src;
  let closed = false;
  const status = document.createElement('div');
  status.className = 'lightbox-status';
  img.draggable = false;
  img.style.transformOrigin = 'center center';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'lightbox-close';
  closeBtn.textContent = '×';
  backdrop.appendChild(img);
  backdrop.appendChild(closeBtn);
  let fullAbort: AbortController | null = null;
  function loadFull(key: string): void {
    fullAbort?.abort();
    fullAbort = null;
    if (!full) return;
    const ctl = new AbortController();
    fullAbort = ctl;
    status.textContent = 'Loading the full image…';
    backdrop.appendChild(status);
    const mb = (n: number) => (n / 1048576).toFixed(1);
    const onProgress = (loaded: number, total: number) => {
      if (closed || cur !== key) return;
      status.textContent = 'Loading the full image… ' + mb(loaded) + (total > 0 ? ' / ' + mb(total) : '') + ' MB';
    };
    full(key, { signal: ctl.signal, onProgress }).then((u) => u, () => null).then((u) => {
      if (fullAbort === ctl) fullAbort = null;
      if (closed || cur !== key) return;
      if (u) { img.src = u; status.remove(); }
      else status.textContent = 'Couldn\'t fetch the full image — showing the small preview.';
      if (info && (!infoDeferred || infoShown)) renderInfo();
    });
  }

  let scale = 1,
    panX = 0,
    panY = 0;
  let dragging = false,
    didDrag = false,
    dragStartX = 0,
    dragStartY = 0,
    panStartX = 0,
    panStartY = 0;
  const MIN_SCALE = 1,
    MAX_SCALE = 6;
  function clampPan(): void {
    const maxX = Math.max(0, (img.offsetWidth * (scale - 1)) / 2);
    const maxY = Math.max(0, (img.offsetHeight * (scale - 1)) / 2);
    panX = Math.max(-maxX, Math.min(maxX, panX));
    panY = Math.max(-maxY, Math.min(maxY, panY));
  }
  function applyTransform(): void {
    img.style.transform =
      scale === 1 && panX === 0 && panY === 0 ? '' : `translate(${panX}px, ${panY}px) scale(${scale})`;
  }
  function zoomBy(delta: number): void {
    const prevScale = scale;
    scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + scale * delta));
    if (scale === MIN_SCALE) {
      panX = 0;
      panY = 0;
    } else {
      const ratio = scale / prevScale;
      panX *= ratio;
      panY *= ratio;
    }
    clampPan();
    applyTransform();
  }
  img.addEventListener(
    'wheel',
    (ev: WheelEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      zoomBy(-ev.deltaY * 0.0015);
    },
    { passive: false }
  );
  img.addEventListener('pointerdown', (ev: PointerEvent) => {
    if (scale <= 1) return;
    ev.preventDefault();
    ev.stopPropagation();
    dragging = true;
    didDrag = false;
    dragStartX = ev.clientX;
    dragStartY = ev.clientY;
    panStartX = panX;
    panStartY = panY;
    try {
      img.setPointerCapture(ev.pointerId);
    } catch {
      /* best effort */
    }
  });
  img.addEventListener('pointermove', (ev: PointerEvent) => {
    if (!dragging) return;
    const dx = ev.clientX - dragStartX,
      dy = ev.clientY - dragStartY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag = true;
    panX = panStartX + dx;
    panY = panStartY + dy;
    clampPan();
    applyTransform();
  });
  const endDrag = (ev: PointerEvent): void => {
    if (!dragging) return;
    dragging = false;
    try {
      img.releasePointerCapture(ev.pointerId);
    } catch {
      /* best effort */
    }
  };
  img.addEventListener('pointerup', endDrag);
  img.addEventListener('pointercancel', endDrag);
  attachLightboxPinch(img, (delta: number) => zoomBy(delta * 0.02));
  // Shift-click picks the clicked pixel's colour (the reference preview's
  // padding colour). The rect already includes the zoom / pan transform.
  if (onShiftPick) {
    img.addEventListener('click', (ev: MouseEvent) => {
      if (!ev.shiftKey || didDrag) return;
      ev.stopPropagation();
      const hex = pixelHexAt(img, ev.clientX, ev.clientY);
      if (hex) onShiftPick(hex);
    });
  }

  function close(): void {
    closed = true;
    fullAbort?.abort();
    if (closeOpenLightbox === close) closeOpenLightbox = null;
    backdrop.classList.remove('modal-visible');
    setTimeout(() => backdrop.remove(), 160);
    document.removeEventListener('keydown', onKey);
  }
  closeOpenLightbox = close;
  let infoEl: HTMLElement | null = null;
  let infoShown = false;
  let infoBtn: HTMLButtonElement | null = null;
  function toggleInfo(): void {
    infoShown = !infoShown;
    if (infoShown) {
      renderInfo();
    } else if (infoEl) {
      infoEl.remove();
      infoEl = null;
      backdrop.classList.remove('has-info');
    }
    infoBtn?.classList.toggle('active', infoShown);
  }
  function renderInfo(): void {
    if (!info) return;
    // While the full file is due this reads the thumbnail, which carries the
    // generation details itself (runner gallery_thumb_exif); rebuilt on arrival.
    const next = info(img.src, close, cur);
    if (infoEl) infoEl.remove();
    infoEl = next;
    if (infoEl) {
      backdrop.classList.add('has-info');
      backdrop.insertBefore(infoEl, img);
    }
  }
  function step(dir: 1 | -1): void {
    const list = siblings ? siblings() : [];
    const i = list.indexOf(cur);
    const next = list[i + dir];
    if (i === -1 || !next) return;
    img.src = next;
    cur = next;
    status.remove();
    loadFull(next);
    scale = 1;
    panX = 0;
    panY = 0;
    applyTransform();
    if (info && (!infoDeferred || infoShown)) renderInfo();
    onStep?.(next);
  }
  function onKey(ev: KeyboardEvent): void {
    if (ev.key === 'Escape') close();
    else if (siblings && (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft')) {
      ev.preventDefault();
      step(ev.key === 'ArrowRight' ? 1 : -1);
    }
  }
  backdrop.addEventListener('click', (ev: MouseEvent) => {
    if (didDrag) {
      didDrag = false;
      return;
    }
    if (ev.target !== backdrop) return;
    close();
  });
  closeBtn.addEventListener('click', close);
  if (info && infoDeferred) {
    infoBtn = document.createElement('button');
    infoBtn.className = 'lightbox-info-btn';
    infoBtn.textContent = 'Details';
    infoBtn.addEventListener('click', toggleInfo);
    backdrop.appendChild(infoBtn);
  }
  document.addEventListener('keydown', onKey);
  loadFull(src);
  if (info && !infoDeferred) renderInfo();
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('modal-visible')));
}
