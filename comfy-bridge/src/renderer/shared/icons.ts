// Line icons for Comfy Bridge, copied from Osmium Workshop's SVG sprite
// (renderer/index.html's <symbol id="i-…">) so both apps draw the same
// icons: same 24-unit grid, stroke in the text colour, Osmium's default
// 1.75 stroke with round caps and joins (.bridge-ic in shared.css). Inline
// SVG rather than <use>, since the Bridge has no sprite of its own.
const DRAWINGS: Record<string, string> = {
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="9.5" r="1.7"/><path d="M20.5 15.5l-4.8-4.8L6 19.5"/>',
  settings: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6.3"/><path d="M12 2.8v2.9M12 18.3v2.9M2.8 12h2.9M18.3 12h2.9M5.5 5.5l2 2M16.5 16.5l2 2M5.5 18.5l2-2M16.5 7.5l2-2"/>',
  folder: '<path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4.2l2 2h8.8A1.5 1.5 0 0 1 21 9.5v8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/>',
};

export function bridgeIcon(name: keyof typeof DRAWINGS | string): string {
  return `<svg class="bridge-ic" viewBox="0 0 24 24" aria-hidden="true">${DRAWINGS[name] || ''}</svg>`;
}
