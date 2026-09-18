// Shared image lightbox for Comfy Bridge (desktop + mobile).
// Screen-dimming backdrop; pinch/wheel zoom from 1× to 6×; drag pans only
// while zoomed, clamped so an image edge can never be dragged past the
// viewport edge. Ported from the parent Dataset Tag Studio app's
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

export function showImageLightbox(src: string): void {
  if (!src) return;
  const backdrop = document.createElement('div');
  backdrop.className = 'lightbox-backdrop';
  const img = document.createElement('img');
  img.src = src;
  img.draggable = false;
  img.style.transformOrigin = 'center center';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'lightbox-close';
  closeBtn.textContent = '×';
  backdrop.appendChild(img);
  backdrop.appendChild(closeBtn);

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

  function close(): void {
    backdrop.classList.remove('modal-visible');
    setTimeout(() => backdrop.remove(), 160);
    document.removeEventListener('keydown', onKey);
  }
  function onKey(ev: KeyboardEvent): void {
    if (ev.key === 'Escape') close();
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
  document.addEventListener('keydown', onKey);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('modal-visible')));
}
