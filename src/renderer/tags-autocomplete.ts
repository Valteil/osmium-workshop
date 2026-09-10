// Phase B module: tag autocomplete dropdown (settings-gated) attached to
// "+ add tag" inputs, plus its inline wiki-definition flash card. Several
// things it needs (the wiki/all-tags loaders, per-tag custom notes,
// addTagToEntry, refreshRightPanels) are core index.ts internals shared with
// the separate Tag Details panel and tag-mutation system — those aren't part
// of this extraction, so they're injected once via initTagAutocomplete()
// instead of imported, avoiding a circular import with index.ts.
// @ts-nocheck
import { toast } from './shared-ui';

export let tagAutocompleteEnabled = false;
export function setTagAutocompleteEnabled(on){
  tagAutocompleteEnabled = on;
  if (!tagAutocompleteEnabled) closeAutocomplete();
}

let autocompleteEl = null;

let ensureWikiDataLoadedRef = null;
let getCustomTagNoteRef = null;
let setCustomTagNoteRef = null;
let ensureAllTagsLoadedRef = null;
let addTagToEntryRef = null;
let refreshRightPanelsRef = null;

export function initTagAutocomplete(deps){
  ensureWikiDataLoadedRef = deps.ensureWikiDataLoaded;
  getCustomTagNoteRef = deps.getCustomTagNote;
  setCustomTagNoteRef = deps.setCustomTagNote;
  ensureAllTagsLoadedRef = deps.ensureAllTagsLoaded;
  addTagToEntryRef = deps.addTagToEntry;
  refreshRightPanelsRef = deps.refreshRightPanels;
}

export function closeAutocomplete(){
  hideInlineDefinition();
  if (autocompleteEl){ autocompleteEl.remove(); autocompleteEl = null; }
  document.removeEventListener('click', onDocClickCloseAutocomplete, true);
}

function onDocClickCloseAutocomplete(ev){
  if (!autocompleteEl) return;
  const path = typeof ev.composedPath === 'function' ? ev.composedPath() : [];
  if (path.includes(autocompleteEl)) return;
  closeAutocomplete();
}

function positionAutocomplete(rect){
  if (!autocompleteEl) return;
  autocompleteEl.style.width = Math.max(220, rect.width) + 'px';
  autocompleteEl.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - autocompleteEl.offsetWidth - 8)) + 'px';
  let top = rect.bottom + 4;
  if (top + autocompleteEl.offsetHeight + 8 > window.innerHeight) top = rect.top - autocompleteEl.offsetHeight - 4;
  autocompleteEl.style.top = Math.max(8, top) + 'px';
}

// Shows a small definition card nested under a hovered suggestion row —
// falls back to a "write your own" prompt (reusing the same per-tag notes
// store as the full Tag Details panel) when the bundled wiki has nothing.
let acDefinitionHost = null; // the nested card currently shown, if any
let acDefinitionTag = null;
let acHideTimer = null;

function hideInlineDefinition(){
  clearTimeout(acHideTimer);
  if (acDefinitionHost){ acDefinitionHost.remove(); acDefinitionHost = null; acDefinitionTag = null; }
}

function scheduleHideInlineDefinition(tag){
  clearTimeout(acHideTimer);
  acHideTimer = setTimeout(() => {
    if (acDefinitionTag === tag) hideInlineDefinition();
  }, 150);
}

function showInlineDefinition(afterRow, tag){
  clearTimeout(acHideTimer);
  if (acDefinitionTag === tag) return; // already showing this one
  hideInlineDefinition();
  const card = document.createElement('div');
  card.className = 'ac-flash-card';
  card.addEventListener('mouseenter', () => clearTimeout(acHideTimer));
  card.addEventListener('mouseleave', () => scheduleHideInlineDefinition(tag));
  afterRow.insertAdjacentElement('afterend', card);
  acDefinitionHost = card;
  acDefinitionTag = tag;

  const body = document.createElement('div');
  body.className = 'ac-flash-body';
  body.textContent = 'Loading…';
  card.appendChild(body);

  requestAnimationFrame(() => card.classList.add('show'));

  ensureWikiDataLoadedRef().then(wiki => {
    if (acDefinitionHost !== card) return; // hovered away (or dropdown closed) before this resolved
    const wikiKey = tag.replace(/ /g, '_');
    const def = wiki[wikiKey];
    const custom = !def ? getCustomTagNoteRef(tag) : '';
    body.innerHTML = '';
    if (def || custom){
      const defEl = document.createElement('div');
      defEl.className = 'ac-flash-def';
      defEl.textContent = def || custom;
      body.appendChild(defEl);
    } else {
      const msg = document.createElement('div');
      msg.className = 'ac-flash-empty';
      msg.textContent = 'No definition yet — want to write one?';
      body.appendChild(msg);
      const ta = document.createElement('textarea');
      ta.placeholder = 'Describe this tag…';
      ta.rows = 2;
      ta.addEventListener('click', ev => ev.stopPropagation());
      body.appendChild(ta);
      const saveBtn = document.createElement('button');
      saveBtn.className = 'primary';
      saveBtn.textContent = 'Save definition';
      saveBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        setCustomTagNoteRef(tag, ta.value);
        toast(`Saved your description for "${tag}".`);
        acDefinitionTag = null; // force showInlineDefinition to redraw with the saved note
        showInlineDefinition(afterRow, tag);
      });
      body.appendChild(saveBtn);
    }
  });
}

// Wires a "+ add tag" input to the autocomplete panel. Typing filters the
// bundled 1M+ tag vocabulary (all_tags.json is pre-sorted by post count,
// so an early-exit scan surfaces the most relevant matches first without
// needing to index the whole file). Hovering a suggestion for a second
// previews its definition; clicking one adds it to the entry and closes
// the panel, same as pressing Enter on typed text.
export function attachTagAutocomplete(inputEl, getEntry, rerender){
  let debounceTimer = null;
  inputEl.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    if (!tagAutocompleteEnabled){ closeAutocomplete(); return; }
    const raw = inputEl.value.trim();
    if (!raw){ closeAutocomplete(); return; }
    debounceTimer = setTimeout(() => runAutocompleteSearch(inputEl, getEntry, rerender, raw), 150);
  });
  inputEl.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') closeAutocomplete();
  });
}

function runAutocompleteSearch(inputEl, getEntry, rerender, query){
  if (inputEl.value.trim() !== query) return; // stale by the time we're called
  ensureAllTagsLoadedRef().then(allTags => {
    if (inputEl.value.trim() !== query) return; // stale after the async load
    const qNorm = query.toLowerCase().replace(/_/g, ' ');
    const starts = [];
    const contains = [];
    let scanned = 0;
    for (const [key, meta] of allTags){
      const spaced = key.replace(/_/g, ' ');
      if (spaced.startsWith(qNorm)) starts.push([spaced, meta]);
      else if (spaced.includes(qNorm)) contains.push([spaced, meta]);
      scanned++;
      if (starts.length >= 30 || scanned >= 250000) break;
    }
    const results = starts.concat(contains).slice(0, 25);
    renderAutocompleteResults(inputEl, getEntry, rerender, results);
  });
}

function renderAutocompleteResults(inputEl, getEntry, rerender, results){
  if (!autocompleteEl){
    autocompleteEl = document.createElement('div');
    autocompleteEl.className = 'ac-panel';
    document.body.appendChild(autocompleteEl);
    document.addEventListener('click', onDocClickCloseAutocomplete, true);
  }
  autocompleteEl.innerHTML = '';
  if (results.length === 0){
    const empty = document.createElement('div');
    empty.className = 'ac-empty';
    empty.textContent = 'No matching tags in the vocabulary.';
    autocompleteEl.appendChild(empty);
  } else {
    const list = document.createElement('div');
    list.className = 'ac-list';
    for (const [tag, meta] of results){
      const row = document.createElement('div');
      row.className = 'ac-row';
      const name = document.createElement('span');
      name.className = 'ac-row-name';
      name.textContent = tag;
      row.appendChild(name);
      if (meta && typeof meta.count === 'number'){
        const cnt = document.createElement('span');
        cnt.className = 'ac-row-count';
        cnt.textContent = meta.count >= 1000 ? Math.round(meta.count/1000) + 'k' : String(meta.count);
        row.appendChild(cnt);
      }
      let hoverTimer = null;
      row.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => showInlineDefinition(row, tag), 1000);
      });
      row.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimer);
        scheduleHideInlineDefinition(tag);
      });
      row.addEventListener('click', () => {
        const entry = getEntry();
        closeAutocomplete();
        if (!entry) return;
        addTagToEntryRef(entry, tag);
        inputEl.value = '';
        rerender();
        refreshRightPanelsRef();
      });
      list.appendChild(row);
    }
    autocompleteEl.appendChild(list);
  }
  positionAutocomplete(inputEl.getBoundingClientRect());
}
