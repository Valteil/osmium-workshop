// Themed app icon: the window/taskbar icon follows the current theme, drawn
// as that theme's Osmium mark (the one the opening flourish shows) in its
// own ink on a rounded square of its fill colour. Night mode, Custom themes
// and Theme Studio edits carry through because the colours are read from the
// live computed theme vars.
//
// The mark comes from index.html's inline "Theme mark" script
// (window.__dtsMarkSVG). The SVG is standalone here (it's rasterized as an
// image, which can't see the page's CSS), so the "Opening flourish" styles
// are inlined with resolved colours. Desktop only: the web demo and the
// Android shim have no setAppIcon, and Android can't swap its launcher icon
// at runtime anyway.
//
// Re-drawn whenever <html>'s data-theme, class or inline style changes (theme
// switch, night mode, custom vars), debounced, and only sent when the
// resolved colours actually changed.

const SIZE = 256;
let lastKey = '';
let timer: ReturnType<typeof setTimeout> | null = null;

function buildSvg(): { svg: string; key: string } | null {
  const markSvg = window.__dtsMarkSVG, specs = window.__dtsMarkSpec;
  if (!markSvg || !specs) return null;
  const root = document.documentElement;
  const theme = root.getAttribute('data-theme') || 'studio';
  const spec = specs[theme] || specs.studio;
  const cs = getComputedStyle(root);
  const v = (k: string): string => cs.getPropertyValue(k).trim();
  // Same colour roles as the flourish: fill = flair, ink = bg-base
  // (Osmium's mark is solid black, per styles.css).
  const fill = v('--accent-flair'), ink = theme === 'osmium' ? '#000' : v('--bg-base');
  const danger = v('--accent-danger'), manual = v('--accent-manual');
  const key = [theme, fill, ink, danger, manual].join('|');
  const inner = markSvg(spec.L).replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const style = `g{stroke:${ink}}.of-nodes{fill:${ink};stroke:none}.of-thin{opacity:.55}`
    + `.of-hollow{fill:${fill};stroke:${ink}}.of-pin{fill:${fill}}.of-split{opacity:.85}`
    + `.of-split-a{stroke:${manual}}.of-split-b{stroke:${danger}}.of-seal{fill:${danger}}`
    + `.of-moon{fill:color-mix(in srgb, ${danger} 55%, ${fill})}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 256 256">`
    + `<style>${style}</style><rect width="256" height="256" rx="52" fill="${fill}"/>`
    + `<svg x="22" y="22" width="212" height="212" viewBox="-6 -6 262 262">${inner}</svg></svg>`;
  return { svg, key };
}

function draw(): void {
  const built = buildSvg();
  if (!built || built.key === lastKey || !window.electronAPI.setAppIcon) return;
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, SIZE, SIZE);
    lastKey = built.key;
    void window.electronAPI.setAppIcon?.(canvas.toDataURL('image/png'));
  };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(built.svg);
}

export function initAppIcon(): void {
  if (!window.electronAPI || typeof window.electronAPI.setAppIcon !== 'function') return;
  const schedule = (): void => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(draw, 150);
  };
  new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
  schedule();
}
