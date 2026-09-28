// Tag wiki window (top bar's "Wiki" button, desktop and mobile — shared, so
// the phone gets it via BridgeShared): look up any Danbooru tag's
// definition while writing a prompt. A port of Osmium Workshop's
// src/renderer/tag-wiki.ts, self-contained here because Osmium's version
// leans on its own tag-details/autocomplete modules (dataset stats,
// achievements, its DOM). Same layout and behaviour: a floating, draggable
// window that stays open until its × or the button closes it; the definition
// on top (See also links below it), the lookup field under it, suggestions
// opening beside the window.
//
// Data: the same bundled files as Osmium (renderer/data/*.gzdat, copied in
// at build time by scripts/copy-wiki-data.js), loaded on first use.

const POS_KEY = 'comfybridge-tag-wiki-pos';
const NOTES_KEY = 'comfybridge-custom-tag-notes';
const CATEGORY_NAMES: Record<number, string> = { 0: 'General', 1: 'Artist', 3: 'Copyright', 4: 'Character', 5: 'Meta' };

// ---- data -------------------------------------------------------------------
// gzip JSON with a .gzdat extension (see Osmium's tag-details.ts for why not
// .gz), decompressed with the browser's own DecompressionStream.
async function fetchGzipJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  const text = await new Response(res.body!.pipeThrough(new DecompressionStream('gzip'))).text();
  return JSON.parse(text);
}

let wikiP: Promise<Record<string, string>> | null = null;
function wikiData(): Promise<Record<string, string>> {
  return wikiP ??= fetchGzipJson('./data/wiki.json.gzdat')
    .then((d) => d as Record<string, string>)
    .catch((err) => { console.error('wiki.json.gzdat load failed:', err); return {}; });
}

export type TagMeta = { category: number; count: number };
let tagsP: Promise<Map<string, TagMeta>> | null = null;
// Also used by the desktop's file naming (../file-naming.ts) for its
// character-tag index, so the one bundled list is loaded once.
export function allTags(): Promise<Map<string, TagMeta>> {
  return tagsP ??= fetchGzipJson('./data/all_tags.json.gzdat').then((list) => {
    const map = new Map<string, TagMeta>();
    for (const row of list as unknown[]) {
      if (Array.isArray(row)) map.set(row[0] as string, { category: row[1] as number, count: row[2] as number });
    }
    return map;
  }).catch((err) => { console.error('all_tags.json.gzdat load failed:', err); return new Map<string, TagMeta>(); });
}

function readJSON<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) as T : fallback; } catch { return fallback; }
}
function writeJSON(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* best effort */ }
}
const customNote = (tag: string): string => readJSON<Record<string, string>>(NOTES_KEY, {})[tag] || '';
function setCustomNote(tag: string, text: string): void {
  const notes = readJSON<Record<string, string>>(NOTES_KEY, {});
  if (text.trim()) notes[tag] = text; else delete notes[tag];
  writeJSON(NOTES_KEY, notes);
}

// ---- window -----------------------------------------------------------------
let win: HTMLElement | null = null;
let bodyEl: HTMLElement;
let inputEl: HTMLInputElement;
let acEl: HTMLElement | null = null;

function clampIntoView(): void {
  if (!win) return;
  const r = win.getBoundingClientRect();
  win.style.left = Math.max(8, Math.min(r.left, window.innerWidth - r.width - 8)) + 'px';
  win.style.top = Math.max(8, Math.min(r.top, window.innerHeight - 60)) + 'px';
}

function attachDrag(handle: HTMLElement): void {
  handle.addEventListener('pointerdown', (ev: PointerEvent) => {
    if ((ev.target as HTMLElement).closest('button')) return;
    const r = win!.getBoundingClientRect();
    const dx = ev.clientX - r.left, dy = ev.clientY - r.top;
    handle.setPointerCapture(ev.pointerId);
    closeSuggestions();
    const move = (e: PointerEvent) => {
      win!.style.left = (e.clientX - dx) + 'px';
      win!.style.top = (e.clientY - dy) + 'px';
    };
    const up = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
      clampIntoView();
      const rr = win!.getBoundingClientRect();
      writeJSON(POS_KEY, { left: rr.left, top: rr.top });
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
  });
}

// "See also" heads the related-tag list (one per line) up to the next
// section heading; everything else stays in the main text. Same rule as
// Osmium's splitSeeAlso.
const SECTION_AFTER_SEE_ALSO = /^(external links|trivia|notes?|examples?|history|usage|names?|sources?)$/i;
function splitSeeAlso(text: string): { main: string; seeAlso: string[] } {
  const blocks = text.split(/\n\s*\n/);
  const at = blocks.findIndex((b) => /^see also:?$/i.test(b.trim()));
  if (at === -1) return { main: text.trim(), seeAlso: [] };
  let end = at + 1;
  const items: string[] = [];
  while (end < blocks.length && !SECTION_AFTER_SEE_ALSO.test(blocks[end].trim().split('\n')[0])) {
    for (const line of blocks[end].split('\n')) if (line.trim()) items.push(line.trim());
    end++;
  }
  return { main: [...blocks.slice(0, at), ...blocks.slice(end)].join('\n\n').trim(), seeAlso: items };
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

async function showTag(raw: string): Promise<void> {
  const tag = raw.trim().replace(/_/g, ' ');
  if (!tag) return;
  closeSuggestions();
  bodyEl.innerHTML = '';
  bodyEl.appendChild(el('div', 'tag-wiki-tag', tag));
  const loading = bodyEl.appendChild(el('div', 'tag-wiki-note', 'Loading…'));
  const key = tag.replace(/ /g, '_');
  const [wiki, tags] = await Promise.all([wikiData(), allTags()]);
  loading.remove();

  const meta = tags.get(key);
  if (meta) {
    const row = el('div', 'tag-wiki-meta');
    row.append(el('span', '', CATEGORY_NAMES[meta.category] || 'Unknown'), el('span', '', `${meta.count.toLocaleString()} posts`));
    bodyEl.appendChild(row);
  }
  const def = wiki[key];
  const custom = def ? '' : customNote(tag);
  const { main, seeAlso } = splitSeeAlso(def || custom || '');
  bodyEl.appendChild(el('div', 'tag-wiki-def' + (def || custom ? '' : ' greyed'),
    main || (meta ? 'No official wiki entry for this tag.' : 'Not a known tag, and no wiki entry.')));

  if (seeAlso.length) {
    const rel = el('div', 'tag-wiki-seealso');
    rel.appendChild(el('div', 'tag-wiki-seealso-head', 'See also'));
    const list = el('div', 'tag-wiki-seealso-list');
    for (const item of seeAlso) {
      const k = item.replace(/ /g, '_');
      if (wiki[k] !== undefined || tags.has(k)) {
        const link = el('button', 'tag-wiki-link', item);
        link.type = 'button';
        link.addEventListener('click', () => { inputEl.value = item; void showTag(item); });
        list.appendChild(link);
      } else {
        list.appendChild(el('span', 'tag-wiki-plain', item));
      }
    }
    rel.appendChild(list);
    bodyEl.appendChild(rel);
  }

  if (!def) {
    const ta = el('textarea', 'tag-wiki-notes');
    ta.placeholder = 'Write your own description (saved on this computer)…';
    ta.value = custom;
    ta.rows = 3;
    const save = el('button', 'primary', 'Save description');
    save.type = 'button';
    save.addEventListener('click', () => { setCustomNote(tag, ta.value); void showTag(tag); });
    bodyEl.append(ta, save);
  }
}

// ---- suggestions ------------------------------------------------------------
// Same ranking as Osmium's autocomplete: tags starting with the query first,
// then ones containing it, each in the vocabulary's post-count order.
function closeSuggestions(): void {
  acEl?.remove();
  acEl = null;
}

function positionSuggestions(): void {
  if (!acEl || !win) return;
  const w = win.getBoundingClientRect(), f = inputEl.getBoundingClientRect();
  const width = 260;
  acEl.style.width = width + 'px';
  acEl.style.maxHeight = '';
  acEl.style.bottom = '';
  // Beside the window, level with the field (desktop). A phone has no room
  // either side, so the list goes under the field, or above it when there's
  // less space below (the on-screen keyboard takes the bottom).
  if (w.right + 8 + width <= window.innerWidth - 8) {
    acEl.style.left = (w.right + 8) + 'px';
  } else if (w.left - 8 - width >= 8) {
    acEl.style.left = (w.left - 8 - width) + 'px';
  } else {
    acEl.style.left = f.left + 'px';
    acEl.style.width = f.width + 'px';
    const below = window.innerHeight - f.bottom - 12, above = f.top - 12;
    if (below >= 160 || below >= above) {
      acEl.style.top = (f.bottom + 4) + 'px';
      acEl.style.maxHeight = Math.min(320, below) + 'px';
    } else {
      acEl.style.top = '';
      acEl.style.bottom = (window.innerHeight - f.top + 4) + 'px';
      acEl.style.maxHeight = Math.min(320, above) + 'px';
    }
    return;
  }
  const h = acEl.offsetHeight;
  acEl.style.top = Math.max(8, Math.min(f.top, window.innerHeight - h - 8)) + 'px';
}

let searchTimer: ReturnType<typeof setTimeout> | null = null;
function onLookupInput(): void {
  if (searchTimer) clearTimeout(searchTimer);
  const query = inputEl.value.trim().toLowerCase().replace(/_/g, ' ');
  if (!query) { closeSuggestions(); return; }
  searchTimer = setTimeout(async () => {
    const tags = await allTags();
    if (inputEl.value.trim().toLowerCase().replace(/_/g, ' ') !== query) return;
    const starts: [string, TagMeta][] = [], contains: [string, TagMeta][] = [];
    let scanned = 0;
    for (const [key, meta] of tags) {
      const spaced = key.replace(/_/g, ' ');
      if (spaced.startsWith(query)) starts.push([spaced, meta]);
      else if (spaced.includes(query)) contains.push([spaced, meta]);
      if (starts.length >= 30 || ++scanned >= 250000) break;
    }
    renderSuggestions(starts.concat(contains).slice(0, 25));
  }, 150);
}

function renderSuggestions(results: [string, TagMeta][]): void {
  if (!win) return;
  if (!acEl) { acEl = el('div', 'tag-wiki-ac'); document.body.appendChild(acEl); }
  acEl.innerHTML = '';
  if (!results.length) acEl.appendChild(el('div', 'tag-wiki-ac-empty', 'No matching tags in the vocabulary.'));
  for (const [tag, meta] of results) {
    const row = el('button', 'tag-wiki-ac-row');
    row.type = 'button';
    row.append(el('span', 'tag-wiki-ac-name', tag),
      el('span', 'tag-wiki-ac-count', meta.count >= 1000 ? Math.round(meta.count / 1000) + 'k' : String(meta.count)));
    row.addEventListener('click', () => { inputEl.value = tag; void showTag(tag); });
    acEl.appendChild(row);
  }
  positionSuggestions();
}

function onDocPointerDown(ev: PointerEvent): void {
  const t = ev.target as Node;
  if (acEl && !acEl.contains(t) && t !== inputEl) closeSuggestions();
}

// ---- open / close -----------------------------------------------------------
const BOOK_ICON = '<svg class="tag-wiki-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6.5c-1.8-1.4-4.3-2-7.5-2v14c3.2 0 5.7.6 7.5 2 1.8-1.4 4.3-2 7.5-2v-14c-3.2 0-5.7.6-7.5 2z"/><path d="M12 6.5v14"/></svg>';

function build(): HTMLElement {
  const w = el('div', 'tag-wiki-window');
  w.setAttribute('role', 'dialog');
  w.setAttribute('aria-label', 'Tag wiki');

  const head = el('div', 'tag-wiki-head');
  const title = el('span', 'tag-wiki-title');
  title.innerHTML = BOOK_ICON;
  title.appendChild(document.createTextNode('Tag wiki'));
  const close = el('button', 'tag-wiki-close', '×');
  close.type = 'button';
  close.title = 'Close';
  close.addEventListener('click', closeTagWiki);
  head.append(title, close);

  bodyEl = el('div', 'tag-wiki-body');
  bodyEl.appendChild(el('div', 'tag-wiki-def greyed', 'Type a tag below to read its definition.'));

  inputEl = el('input', 'tag-wiki-input');
  inputEl.type = 'text';
  inputEl.placeholder = 'Look up a tag…';
  inputEl.addEventListener('input', onLookupInput);
  inputEl.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && inputEl.value.trim()) void showTag(inputEl.value);
    else if (ev.key === 'Escape') closeSuggestions();
  });

  w.append(head, bodyEl, inputEl);
  attachDrag(head);
  return w;
}

export function openTagWiki(): void {
  if (win) { inputEl.focus(); return; }
  win = build();
  document.body.appendChild(win);
  const pos = readJSON<{ left: number; top: number } | null>(POS_KEY, null);
  if (pos) { win.style.left = pos.left + 'px'; win.style.top = pos.top + 'px'; }
  else {
    win.style.left = Math.max(8, window.innerWidth - win.offsetWidth - 24) + 'px';
    win.style.top = '72px';
  }
  clampIntoView();
  requestAnimationFrame(() => requestAnimationFrame(() => win?.classList.add('visible')));
  document.addEventListener('pointerdown', onDocPointerDown, true);
  inputEl.focus();
  // Start loading the vocabulary now so the first suggestions are quick.
  void allTags();
}

export function closeTagWiki(): void {
  if (!win) return;
  const w = win;
  win = null;
  closeSuggestions();
  document.removeEventListener('pointerdown', onDocPointerDown, true);
  w.classList.remove('visible');
  setTimeout(() => w.remove(), 160);
}

export function initTagWiki(button: HTMLElement): void {
  button.addEventListener('click', () => (win ? closeTagWiki() : openTagWiki()));
  window.addEventListener('resize', () => { clampIntoView(); positionSuggestions(); });
}
