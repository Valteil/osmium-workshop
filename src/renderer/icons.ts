// Icon system: every UI icon is an SVG <symbol> in the inline sprite at the
// top of renderer/index.html's <body> (the single source of the drawings —
// inline, not an external icons.svg, because <use href="file.svg#id"> is
// blocked across file:// origins in Electron). Glyphs stay readable in
// source as the emoji/unicode they replaced; this module maps them to
// sprite ids at render time. Stroke weight, caps and joins come from each
// theme's --icon-stroke/--icon-cap/--icon-join (styles.css), so one drawing
// set carries every theme's grammar.
//
// Any label that may contain a glyph goes through setIconLabel() (instead of
// textContent) or iconHTML() (inside an innerHTML template). A glyph with no
// entry here renders as plain text — add it to EMOJI_ICON rather than
// drawing a one-off.

export const EMOJI_ICON: Record<string, string> = {
  '📁': 'folder', '📂': 'folder', '⚙️': 'settings', '⚙': 'settings', '🔧': 'wrench', '🔭': 'telescope',
  '📜': 'log', '🎨': 'palette', '🔒': 'lock', '🔓': 'unlock', '🏆': 'trophy', '💰': 'coins',
  '🌙': 'moon', '❓': 'help', '🖼️': 'image', '🖼': 'image', '📊': 'chart', '🧪': 'flask', '🚩': 'flag',
  '🔍': 'search', '🎲': 'dice', '🙈': 'eye-off', '👁️': 'eye', '👁': 'eye', '🔢': 'hash', '❌': 'x-circle',
  '✕': 'x', '✖': 'x', '🔗': 'link', '✂️': 'scissors', '✂': 'scissors', '📋': 'list', '⬇': 'download',
  '🧺': 'bucket', '🪣': 'bucket', '↩️': 'undo', '↩': 'undo', '↪': 'redo', '🏷️': 'tag', '🏷': 'tag',
  '🗑️': 'trash', '🗑': 'trash', '🚫': 'shield-off', '🟢': 'shield-plus', '✋': 'hand', '🐍': 'wand',
  '🔄': 'refresh', '↺': 'rotate', '▶': 'play', '⏹': 'stop', '✅': 'check-circle', '☑': 'check-square',
  '🔌': 'plug', '📝': 'note', '🛍️': 'bag', '🛍': 'bag', '🎁': 'gift', '🔨': 'hammer', '🎯': 'target',
  '🩺': 'pulse', '📖': 'book', '💾': 'save', '⚠️': 'alert', '⚠': 'alert', '⏮': 'skip-back',
  '🗨️': 'message', '🗨': 'message', '🧭': 'compass', '★': 'star', '⭐': 'star', '☰': 'menu',
  '▦': 'grid', '▾': 'caret-down', '▼': 'caret-down', '▲': 'caret-up', '▸': 'chevron-right',
  '◀': 'chevron-left', '‹': 'chevron-left', '›': 'chevron-right',
  '⟲': 'rotate', '⟳': 'rotate-cw', '✓': 'check', '⇄': 'swap'
};

// Achievement rarity marks: one gem drawing, tinted per tier in styles.css
// (.rarity-<tier>), instead of five unrelated colored emoji.
export function rarityIcon(rarity: string): string {
  return iconSvg(rarity === 'legendary' ? 'star' : 'gem', 'rarity-' + rarity);
}

// Label text with its glyphs removed — for aria-label, where a screen
// reader would otherwise announce the glyph's Unicode name.
export function plainLabel(text: string): string {
  return text.replace(GLYPH_RE, '').replace(/\s+/g, ' ').trim();
}

const GLYPH_RE = new RegExp(
  '(' + Object.keys(EMOJI_ICON).sort((a, b) => b.length - a.length)
    .map(g => g.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\uFE0F?', 'gu');

export function iconSvg(id: string, extraClass = ''): string {
  return `<svg class="ic${extraClass ? ' ' + extraClass : ''}" aria-hidden="true"><use href="#i-${id}"></use></svg>`;
}

function escapeText(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

// Text → HTML with every mapped glyph swapped for its icon. The single space
// that used to separate a glyph from its words is folded into an .ic-lead /
// .ic-trail margin instead: in a flex button a leading space in the text
// run collapses away, which would glue the icon to the label.
export function iconHTML(text: string): string {
  const parts = text.split(GLYPH_RE);
  let out = '';
  for (let i = 0; i < parts.length; i++){
    const part = parts[i];
    if (i % 2 === 0){ out += escapeText(part); continue; }
    const before = parts[i - 1] ?? '', after = parts[i + 1] ?? '';
    const cls: string[] = [];
    if (/^\s+\S/.test(after)){ cls.push('ic-lead'); parts[i + 1] = after.replace(/^\s/, ''); }
    if (/\S\s$/.test(before) || (/\S$/.test(before) && before.length)){
      cls.push('ic-trail');
      out = out.replace(/\s$/, '');
    }
    out += iconSvg(EMOJI_ICON[part], cls.join(' '));
  }
  return out;
}

export function hasIconGlyph(text: string): boolean {
  GLYPH_RE.lastIndex = 0;
  const hit = GLYPH_RE.test(text);
  GLYPH_RE.lastIndex = 0;
  return hit;
}

// Drop-in replacement for `el.textContent = text` on any label that may carry
// a glyph. Plain text (no glyph) stays a plain text node.
//
// A glyph INSIDE a sentence ("Use a tag chip's 🚩 menu…") gets the whole label
// wrapped in one <span>: dropped into a flex container, text | icon | text
// would otherwise become three flex items laid out as columns. A leading or
// trailing icon stays a direct child, so buttons keep aligning icon and text
// as separate flex items.
export function setIconLabel(el: Element, text: string): void {
  if (!hasIconGlyph(text)){ el.textContent = text; return; }
  const parts = text.split(GLYPH_RE);
  const midSentence = parts.length > 2 && parts[0].trim() !== '' && parts[parts.length - 1].trim() !== '';
  el.innerHTML = midSentence ? `<span>${iconHTML(text)}</span>` : iconHTML(text);
}

// In-place pass over an already-built subtree (help pages, templates
// rendered from strings elsewhere). Skips form controls — an <option> or
// <textarea> can't hold an <svg>.
export function iconize(root: Element): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: n => {
      const p = n.parentElement;
      if (!p || p.closest('option, select, textarea, script, style, svg, code, pre')) return NodeFilter.FILTER_REJECT;
      return hasIconGlyph(n.nodeValue || '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const hits: Text[] = [];
  while (walker.nextNode()) hits.push(walker.currentNode as Text);
  for (const t of hits){
    const span = document.createElement('span');
    span.innerHTML = iconHTML(t.nodeValue || '');
    t.replaceWith(...Array.from(span.childNodes));
  }
}
