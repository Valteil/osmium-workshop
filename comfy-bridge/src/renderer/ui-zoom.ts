// Text size (desktop only): one zoom factor for the whole window, set from
// the slider at the top of the theme menu and remembered. It's Chromium page
// zoom via the preload's webFrame.setZoomFactor (what Ctrl +/- would do), so
// layout, hit-testing and the lightbox's pan math stay consistent. The
// Android app has no slider: phones have their own text-size setting.
const ZOOM_KEY = 'comfybridge-ui-zoom';
const UI_ZOOM_MIN = 0.8;
const UI_ZOOM_MAX = 1.6;

function currentUiZoom(): number {
  try {
    const v = parseFloat(localStorage.getItem(ZOOM_KEY) || '1');
    return v >= UI_ZOOM_MIN && v <= UI_ZOOM_MAX ? v : 1;
  } catch { return 1; }
}

function applyUiZoom(factor: number, persist = true): void {
  const f = Math.min(UI_ZOOM_MAX, Math.max(UI_ZOOM_MIN, factor));
  window.electronAPI.setZoomFactor(f);
  if (persist) { try { localStorage.setItem(ZOOM_KEY, String(f)); } catch { /* best effort */ } }
}

// Restores the saved size at startup.
export function initUiZoom(): void {
  const f = currentUiZoom();
  if (f !== 1) applyUiZoom(f, false);
}

// The "Text size" row: a range slider (80–160 %, steps of 10) with its value
// and a reset, applied live while dragging.
export function buildUiZoomRow(): HTMLElement {
  const row = document.createElement('div');
  row.className = 'ui-zoom-row';
  const label = document.createElement('span');
  label.textContent = 'Text size';
  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = String(UI_ZOOM_MIN * 100);
  slider.max = String(UI_ZOOM_MAX * 100);
  slider.step = '10';
  slider.value = String(Math.round(currentUiZoom() * 100));
  slider.setAttribute('aria-label', 'Text size');
  const val = document.createElement('span');
  val.className = 'ui-zoom-val';
  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'ui-zoom-reset';
  reset.textContent = 'Reset';
  const show = (): void => { val.textContent = slider.value + '%'; reset.disabled = slider.value === '100'; };
  slider.addEventListener('input', () => { applyUiZoom(parseInt(slider.value, 10) / 100); show(); });
  reset.addEventListener('click', () => { slider.value = '100'; applyUiZoom(1); show(); });
  // Arrow keys adjust the slider only (the gallery lightbox also listens for
  // ← / → on document).
  slider.addEventListener('keydown', (ev) => ev.stopPropagation());
  show();
  row.append(label, slider, val, reset);
  return row;
}
