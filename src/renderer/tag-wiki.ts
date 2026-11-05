// Tag Wiki window (gallery toolbar's "Wiki" button, next to Asc/Desc): look
// up any tag's definition from the bundled wiki without going through a tag
// field. A floating, draggable, theme-styled window that stays open until its
// × is clicked (it is NOT a .theme-panel, so closeAllFloatingPanels() and
// outside clicks leave it alone). Layout: the definition area on top, the
// lookup field under it, suggestions dropping down below the field.
//
// Definitions come from tag-details.ts's bundled data (same source as the
// Tag Details panel and the autocomplete hover card); a tag with no official
// entry offers the same "write your own description" note.
//
// The header's Groups button opens a sidebar of Danbooru's tag groups (Hair
// styles, Posture, …), laid out like Danbooru's own "tag groups" index; a
// group opens in the main area as headings + tag links. Data:
// wiki_groups.json.gzdat (scripts/build-wiki-groups.js).

import { getJSON, setJSON } from './storage';
import { toast } from './shared-ui';
import { setIconLabel } from './icons';
import { attachLookupAutocomplete, closeAutocomplete } from './tags-autocomplete';
import {
  ensureWikiDataLoaded, ensureAllTagsLoaded, ensureWikiGroupsLoaded, getCustomTagNote, setCustomTagNote,
  type WikiGroupLine, type WikiGroups
} from './tag-details';

const POS_KEY = 'dts-tag-wiki-pos';
const SIDE_KEY = 'dts-tag-wiki-side';
const CATEGORY_NAMES: Record<number, string> = { 0: 'General', 1: 'Artist', 3: 'Copyright', 4: 'Character', 5: 'Meta' };

let win: HTMLElement | null = null;
let bodyEl: HTMLElement;
let inputEl: HTMLInputElement;
let sideEl: HTMLElement;
let sideBtn: HTMLButtonElement;
let activeGroup = '';

// "tag group:Hair styles" / "tag_group:hair_styles" -> "hair_styles", else ''.
function groupKeyOf(text: string): string {
  const m = text.trim().match(/^tag[ _]group:\s*(.+)$/i);
  return m ? m[1].trim().toLowerCase().replace(/\s+/g, '_') : '';
}

function clampIntoView(): void {
  if (!win) return;
  const r = win.getBoundingClientRect();
  const left = Math.max(8, Math.min(r.left, window.innerWidth - r.width - 8));
  const top = Math.max(8, Math.min(r.top, window.innerHeight - 60));
  win.style.left = left + 'px';
  win.style.top = top + 'px';
}

function attachDrag(handle: HTMLElement): void {
  handle.addEventListener('pointerdown', (ev: PointerEvent) => {
    if ((ev.target as HTMLElement).closest('button')) return;
    const r = win!.getBoundingClientRect();
    const dx = ev.clientX - r.left, dy = ev.clientY - r.top;
    handle.setPointerCapture(ev.pointerId);
    const move = (e: PointerEvent) => {
      win!.style.left = (e.clientX - dx) + 'px';
      win!.style.top = (e.clientY - dy) + 'px';
    };
    const up = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
      clampIntoView();
      const rr = win!.getBoundingClientRect();
      setJSON(POS_KEY, { left: rr.left, top: rr.top });
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
  });
}

// Definitions are plain text in paragraphs (blank-line separated); the
// "See also" paragraph heads the related-tag list that follows it, one tag
// per line, until the next section heading (External links etc.). Everything
// else stays in the main text, in order.
const SECTION_AFTER_SEE_ALSO = /^(external links|trivia|notes?|examples?|history|usage|names?|sources?)$/i;
function splitSeeAlso(text: string): { main: string; seeAlso: string[] } {
  const blocks = text.split(/\n\s*\n/);
  const at = blocks.findIndex((b) => /^see also:?$/i.test(b.trim()));
  if (at === -1) return { main: text.trim(), seeAlso: [] };
  let end = at + 1;
  const items: string[] = [];
  while (end < blocks.length && !SECTION_AFTER_SEE_ALSO.test(blocks[end].trim().split('\n')[0])){
    for (const line of blocks[end].split('\n')) if (line.trim()) items.push(line.trim());
    end++;
  }
  const main = [...blocks.slice(0, at), ...blocks.slice(end)].join('\n\n').trim();
  return { main, seeAlso: items };
}

async function showTag(raw: string): Promise<void> {
  const tag = raw.trim().replace(/_/g, ' ');
  if (!tag) return;
  const asGroup = groupKeyOf(tag);
  if (asGroup && (await ensureWikiGroupsLoaded()).pages[asGroup]){ void showGroup(asGroup); return; }
  closeAutocomplete();
  markActiveGroup('');
  bodyEl.innerHTML = '';
  const title = document.createElement('div');
  title.className = 'tag-wiki-tag';
  title.textContent = tag;
  bodyEl.appendChild(title);
  const loading = document.createElement('div');
  loading.className = 'stats-empty';
  loading.textContent = 'Loading…';
  bodyEl.appendChild(loading);

  const key = tag.replace(/ /g, '_');
  const [wiki, allTags] = await Promise.all([ensureWikiDataLoaded(), ensureAllTagsLoaded()]);
  loading.remove();
  const meta = allTags.get(key);
  if (meta){
    const metaRow = document.createElement('div');
    metaRow.className = 'tag-details-meta';
    const cat = document.createElement('span');
    cat.textContent = CATEGORY_NAMES[meta.category] || 'Unknown';
    const posts = document.createElement('span');
    posts.textContent = `${meta.count.toLocaleString()} posts`;
    metaRow.append(cat, posts);
    bodyEl.appendChild(metaRow);
  }
  const def = wiki[key];
  const custom = def ? '' : getCustomTagNote(tag);
  const { main, seeAlso } = splitSeeAlso(def || custom || '');
  const defEl = document.createElement('div');
  defEl.className = 'tag-details-def tag-wiki-def' + (def || custom ? '' : ' greyed');
  defEl.textContent = main || (meta ? 'No official wiki entry for this tag.' : 'Not a known tag, and no wiki entry.');
  bodyEl.appendChild(defEl);
  if (seeAlso.length){
    // Related tags sit unboxed under the definition; known ones are links
    // that open their own definition here, and "Tag group:…" items open that
    // group.
    const groups = seeAlso.some((s) => groupKeyOf(s)) ? await ensureWikiGroupsLoaded() : null;
    const rel = document.createElement('div');
    rel.className = 'tag-wiki-seealso';
    const head = document.createElement('div');
    head.className = 'tag-wiki-seealso-head';
    head.textContent = 'See also';
    rel.appendChild(head);
    const list = document.createElement('div');
    list.className = 'tag-wiki-seealso-list';
    for (const item of seeAlso){
      const gk = groupKeyOf(item);
      if (gk && groups && groups.pages[gk]){
        list.appendChild(groupLink(groups.pages[gk].title, gk));
        continue;
      }
      const known = wiki[item.replace(/ /g, '_')] !== undefined || allTags.has(item.replace(/ /g, '_'));
      const el = document.createElement(known ? 'button' : 'span');
      el.className = known ? 'tag-wiki-link' : 'tag-wiki-plain';
      el.textContent = item;
      if (known){ (el as HTMLButtonElement).type = 'button'; el.addEventListener('click', () => { inputEl.value = item; void showTag(item); }); }
      list.appendChild(el);
    }
    rel.appendChild(list);
    bodyEl.appendChild(rel);
  }
  if (!def){
    const ta = document.createElement('textarea');
    ta.placeholder = 'Write your own description (saved on this computer)…';
    ta.value = custom;
    ta.rows = 3;
    const save = document.createElement('button');
    save.className = 'primary';
    save.textContent = 'Save description';
    save.addEventListener('click', () => {
      setCustomTagNote(tag, ta.value);
      toast(`Saved your description for "${tag}".`);
      void showTag(tag);
    });
    bodyEl.append(ta, save);
  }
}

// ---- Tag groups ----------------------------------------------------------

function groupLink(label: string, key: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'tag-wiki-link tag-wiki-grouplink';
  b.textContent = label;
  b.addEventListener('click', () => { void showGroup(key); });
  return b;
}

// A group page's [[link]]: another group opens that group, a known tag opens
// its definition, anything else (list_of_… pages, typos) is plain text.
function partEl(target: string, label: string, groups: WikiGroups, known: (k: string) => boolean): Node {
  const gk = groupKeyOf(target);
  if (gk && groups.pages[gk]) return groupLink(label, gk);
  if (!gk && known(target)){
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tag-wiki-link';
    b.textContent = label;
    b.addEventListener('click', () => { inputEl.value = target.replace(/_/g, ' '); void showTag(target); });
    return b;
  }
  const s = document.createElement('span');
  s.className = 'tag-wiki-plain';
  s.textContent = label;
  return s;
}

function renderGroupLines(into: HTMLElement, lines: WikiGroupLine[], groups: WikiGroups, known: (k: string) => boolean): void {
  for (const [kind, depth, parts] of lines){
    const row = document.createElement('div');
    row.className = kind === 'h' ? `tag-wiki-group-h${depth >= 5 ? ' sub' : ''}` : kind === 'li' ? 'tag-wiki-group-li' : 'tag-wiki-group-p';
    if (kind === 'li') row.style.paddingLeft = `${(depth - 1) * 14}px`;
    for (const p of parts) row.appendChild(typeof p === 'string' ? document.createTextNode(p) : partEl(p[0], p[1], groups, known));
    into.appendChild(row);
  }
}

async function showGroup(key: string): Promise<void> {
  closeAutocomplete();
  markActiveGroup(key);
  // The first open also waits for the whole definitions file (which links are tags).
  const loading = document.createElement('div');
  loading.className = 'stats-empty';
  loading.textContent = 'Loading…';
  bodyEl.replaceChildren(loading);
  const [groups, wiki, allTags] = await Promise.all([ensureWikiGroupsLoaded(), ensureWikiDataLoaded(), ensureAllTagsLoaded()]);
  const page = groups.pages[key];
  if (!page) return;
  const known = (k: string) => wiki[k] !== undefined || allTags.has(k);
  bodyEl.innerHTML = '';
  const title = document.createElement('div');
  title.className = 'tag-wiki-tag';
  title.textContent = page.title;
  const meta = document.createElement('div');
  meta.className = 'tag-details-meta';
  const kind = document.createElement('span');
  kind.textContent = 'Tag group';
  meta.appendChild(kind);
  if (page.updated){ const u = document.createElement('span'); u.textContent = `Danbooru, ${page.updated}`; meta.appendChild(u); }
  const list = document.createElement('div');
  list.className = 'tag-wiki-group';
  renderGroupLines(list, page.lines, groups, known);
  bodyEl.append(title, meta, list);
  bodyEl.scrollTop = 0;
  markActiveGroup(key);
}

function markActiveGroup(key: string): void {
  activeGroup = key;
  if (!sideEl) return;
  for (const b of sideEl.querySelectorAll<HTMLElement>('[data-group]')) b.classList.toggle('active', b.dataset.group === key);
}

// The sidebar: the index page's headings and its group links, nested as on
// Danbooru; groups the index doesn't link come last under "Other groups".
let sideBuilt = false;
async function fillSide(): Promise<void> {
  if (sideBuilt) return;
  sideBuilt = true;
  const groups = await ensureWikiGroupsLoaded();
  sideEl.innerHTML = '';
  const listed = new Set<string>();
  const addItem = (key: string, label: string, depth: number) => {
    const b = groupLink(label, key);
    b.className = 'tag-wiki-side-item';
    b.dataset.group = key;
    b.style.paddingLeft = `${6 + (depth - 1) * 12}px`;
    sideEl.appendChild(b);
    listed.add(key);
  };
  const addHead = (text: string) => {
    const h = document.createElement('div');
    h.className = 'tag-wiki-side-head';
    h.textContent = text;
    sideEl.appendChild(h);
  };
  let pendingHead = '';
  for (const [kind, depth, parts] of groups.index){
    if (kind === 'h'){ pendingHead = parts.map((p) => (typeof p === 'string' ? p : p[1])).join('').trim(); continue; }
    if (kind !== 'li') continue;
    for (const p of parts){
      if (typeof p === 'string') continue;
      const key = groupKeyOf(p[0]);
      if (!key || !groups.pages[key] || listed.has(key)) continue;
      if (pendingHead){ addHead(pendingHead); pendingHead = ''; }
      addItem(key, p[1], depth);
    }
  }
  const rest = Object.keys(groups.pages).filter((k) => !listed.has(k)).sort();
  if (rest.length){ addHead('Other groups'); for (const k of rest) addItem(k, groups.pages[k].title, 1); }
  if (!listed.size){
    const empty = document.createElement('div');
    empty.className = 'tag-wiki-plain';
    empty.textContent = 'No tag groups bundled.';
    sideEl.appendChild(empty);
  }
  markActiveGroup(activeGroup);
}

function setSide(open: boolean): void {
  win?.classList.toggle('with-side', open);
  sideBtn.classList.toggle('active', open);
  sideBtn.setAttribute('aria-pressed', String(open));
  setJSON(SIDE_KEY, open);
  if (open) void fillSide();
  clampIntoView();
}

function build(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'tag-wiki-window';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'Tag wiki');

  const head = document.createElement('div');
  head.className = 'tag-wiki-head';
  const title = document.createElement('span');
  title.className = 'theme-panel-head';
  setIconLabel(title, 'Tag wiki');
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'tag-wiki-close';
  close.title = 'Close';
  close.innerHTML = '<svg class="ic" aria-hidden="true"><use href="#i-x"></use></svg>';
  close.addEventListener('click', closeTagWiki);
  sideBtn = document.createElement('button');
  sideBtn.type = 'button';
  sideBtn.className = 'tag-wiki-side-btn';
  sideBtn.title = 'Tag groups (Hair styles, Posture, …)';
  sideBtn.innerHTML = '<svg class="ic ic-lead" aria-hidden="true"><use href="#i-menu"></use></svg>Groups';
  sideBtn.addEventListener('click', () => setSide(!win?.classList.contains('with-side')));
  const tools = document.createElement('div');
  tools.className = 'tag-wiki-head-tools';
  tools.append(sideBtn, close);
  head.append(title, tools);

  sideEl = document.createElement('nav');
  sideEl.className = 'tag-wiki-side';
  sideEl.setAttribute('aria-label', 'Tag groups');
  sideBuilt = false;

  bodyEl = document.createElement('div');
  bodyEl.className = 'tag-wiki-body tag-details-body';
  const hint = document.createElement('div');
  hint.className = 'tag-details-def greyed';
  hint.textContent = 'Type a tag below to read its definition.';
  bodyEl.appendChild(hint);

  inputEl = document.createElement('input');
  inputEl.type = 'text';
  inputEl.className = 'tag-wiki-input';
  inputEl.placeholder = 'Look up a tag…';
  inputEl.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && inputEl.value.trim()){ void showTag(inputEl.value); }
  });
  attachLookupAutocomplete(inputEl, (tag) => { inputEl.value = tag; void showTag(tag); });

  const main = document.createElement('div');
  main.className = 'tag-wiki-main';
  main.append(bodyEl, inputEl);
  const cols = document.createElement('div');
  cols.className = 'tag-wiki-cols';
  cols.append(sideEl, main);
  el.append(head, cols);
  attachDrag(head);
  return el;
}

export function openTagWiki(): void {
  if (win){ inputEl.focus(); return; }
  win = build();
  document.body.appendChild(win);
  setSide(getJSON<boolean>(SIDE_KEY, false));
  const pos = getJSON<{ left: number; top: number } | null>(POS_KEY, null);
  if (pos){ win.style.left = pos.left + 'px'; win.style.top = pos.top + 'px'; }
  else {
    win.style.left = Math.max(8, window.innerWidth - win.offsetWidth - 24) + 'px';
    win.style.top = '96px';
  }
  clampIntoView();
  requestAnimationFrame(() => requestAnimationFrame(() => win?.classList.add('panel-visible')));
  inputEl.focus();
}

export function closeTagWiki(): void {
  if (!win) return;
  const el = win;
  win = null;
  closeAutocomplete();
  el.classList.remove('panel-visible');
  setTimeout(() => el.remove(), 160);
}

export function initTagWiki(button: HTMLElement): void {
  button.addEventListener('click', () => (win ? closeTagWiki() : openTagWiki()));
  window.addEventListener('resize', clampIntoView);
}
