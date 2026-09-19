import type { Entry } from './types';
import { toast, attachLongPress } from './shared-ui';

export let tagAutocompleteEnabled = false;
export function setTagAutocompleteEnabled(on: boolean): void {
  tagAutocompleteEnabled = on;
  if (!tagAutocompleteEnabled) closeAutocomplete();
}

let autocompleteEl: HTMLElement | null = null;

interface TagAutocompleteDeps {
  ensureWikiDataLoaded: () => Promise<Record<string, string>>;
  getCustomTagNote: (tag: string) => string;
  setCustomTagNote: (tag: string, note: string) => void;
  ensureAllTagsLoaded: () => Promise<Map<string, { count?: number }>>;
  addTagToEntry: (entry: Entry, tag: string) => void;
  refreshRightPanels: () => void;
}

let ensureWikiDataLoadedRef: TagAutocompleteDeps['ensureWikiDataLoaded'] | null = null;
let getCustomTagNoteRef: TagAutocompleteDeps['getCustomTagNote'] | null = null;
let setCustomTagNoteRef: TagAutocompleteDeps['setCustomTagNote'] | null = null;
let ensureAllTagsLoadedRef: TagAutocompleteDeps['ensureAllTagsLoaded'] | null = null;
let addTagToEntryRef: TagAutocompleteDeps['addTagToEntry'] | null = null;
let refreshRightPanelsRef: TagAutocompleteDeps['refreshRightPanels'] | null = null;

export function initTagAutocomplete(deps: TagAutocompleteDeps): void {
  ensureWikiDataLoadedRef = deps.ensureWikiDataLoaded;
  getCustomTagNoteRef = deps.getCustomTagNote;
  setCustomTagNoteRef = deps.setCustomTagNote;
  ensureAllTagsLoadedRef = deps.ensureAllTagsLoaded;
  addTagToEntryRef = deps.addTagToEntry;
  refreshRightPanelsRef = deps.refreshRightPanels;
}

export function closeAutocomplete(): void {
  hideInlineDefinition();
  if (autocompleteEl) { autocompleteEl.remove(); autocompleteEl = null; }
  document.removeEventListener('click', onDocClickCloseAutocomplete, true);
}

function onDocClickCloseAutocomplete(ev: MouseEvent): void {
  if (!autocompleteEl) return;
  const path = typeof ev.composedPath === 'function' ? ev.composedPath() : [];
  if (path.includes(autocompleteEl)) return;
  closeAutocomplete();
}

function positionAutocomplete(rect: DOMRect): void {
  if (!autocompleteEl) return;
  autocompleteEl.style.width = Math.max(220, rect.width) + 'px';
  autocompleteEl.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - autocompleteEl.offsetWidth - 8)) + 'px';
  const top = rect.top - autocompleteEl.offsetHeight - 4;
  autocompleteEl.style.top = Math.max(8, top) + 'px';
}

let acDefinitionHost: HTMLElement | null = null;
let acDefinitionTag: string | null = null;
let acHideTimer: ReturnType<typeof setTimeout> | null = null;

function hideInlineDefinition(): void {
  if (acHideTimer) clearTimeout(acHideTimer);
  if (acDefinitionHost) { acDefinitionHost.remove(); acDefinitionHost = null; acDefinitionTag = null; }
}

function scheduleHideInlineDefinition(tag: string): void {
  if (acHideTimer) clearTimeout(acHideTimer);
  acHideTimer = setTimeout(() => {
    if (acDefinitionTag === tag) hideInlineDefinition();
  }, 150);
}

function populateAcFlashBody(body: HTMLElement, tag: string, onDone?: () => void): void {
  body.textContent = 'Loading…';
  ensureWikiDataLoadedRef!().then(wiki => {
    if (acDefinitionHost !== body.parentElement) return;
    const wikiKey = tag.replace(/ /g, '_');
    const def = wiki[wikiKey];
    const custom = !def ? getCustomTagNoteRef!(tag) : '';
    body.innerHTML = '';
    if (def || custom) {
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
      ta.addEventListener('click', (ev: Event) => ev.stopPropagation());
      body.appendChild(ta);
      const saveBtn = document.createElement('button');
      saveBtn.className = 'primary';
      saveBtn.textContent = 'Save definition';
      saveBtn.addEventListener('click', (ev: MouseEvent) => {
        ev.stopPropagation();
        setCustomTagNoteRef!(tag, ta.value);
        toast(`Saved your description for "${tag}".`);
        populateAcFlashBody(body, tag);
      });
      body.appendChild(saveBtn);
    }
    if (onDone) onDone();
  });
}

// Floating variant for chips OUTSIDE the autocomplete list (transfer-list
// modal etc.): same card, same body, but positioned near the hovered chip
// instead of inserted after a list row.
let chipHoverTimer: ReturnType<typeof setTimeout> | null = null;
let chipHoverTag: string | null = null;

function hideChipDefinition(): void {
  if (chipHoverTimer) clearTimeout(chipHoverTimer);
  chipHoverTimer = null;
  document.querySelectorAll('.ac-flash-card.ac-flash-floating').forEach(el => el.remove());
  chipHoverTag = null;
}

function scheduleHideChipDefinition(tag: string): void {
  if (chipHoverTimer) clearTimeout(chipHoverTimer);
  chipHoverTimer = setTimeout(() => {
    if (chipHoverTag === tag) hideChipDefinition();
  }, 150);
}

export function attachAcChipHover(container: HTMLElement): void {
  container.addEventListener('mouseover', (ev: MouseEvent) => {
    const chip = (ev.target as HTMLElement).closest<HTMLElement>('.chip[data-tag]');
    if (!chip) { if (chipHoverTag) hideChipDefinition(); return; }
    const tag = chip.dataset.tag!;
    if (chipHoverTag === tag) return;
    hideChipDefinition();
    chipHoverTag = tag;
    chipHoverTimer = setTimeout(() => {
      const card = document.createElement('div');
      card.className = 'ac-flash-card ac-flash-floating show';
      const body = document.createElement('div');
      body.className = 'ac-flash-body';
      card.appendChild(body);
      document.body.appendChild(card);
      acDefinitionHost = card;
      populateAcFlashBody(body, tag, () => {
        // Re-measure after the real definition replaces the "Loading…"
        // placeholder — the content changes height, so the position has to.
        const r = chip.getBoundingClientRect();
        const w = card.offsetWidth, h = card.offsetHeight;
        let left = r.left;
        if (left + w + 8 > window.innerWidth) left = window.innerWidth - w - 8;
        card.style.left = Math.max(8, left) + 'px';
        let top = r.top - h - 8;
        if (top < 8) top = r.bottom + 8;
        card.style.top = top + 'px';
      });
      // Fixed-position like the app's other popovers. The card must keep its
      // 'show' class (this variant starts visible — there's no insert-
      // transition to gate it on; 'show' only drives opacity, which doesn't
      // affect layout), measured after append for its natural size.
      const r0 = chip.getBoundingClientRect();
      card.style.position = 'fixed';
      card.style.left = r0.left + 'px';
      card.style.top = (r0.bottom + 8) + 'px';
      card.addEventListener('mouseenter', () => { if (chipHoverTimer) clearTimeout(chipHoverTimer); });
      card.addEventListener('mouseleave', hideChipDefinition);
    }, 350);
  });
  container.addEventListener('mouseout', (ev: MouseEvent) => {
    const chip = (ev.target as HTMLElement).closest?.('.chip[data-tag]') as HTMLElement | null;
    if (!chip) return;
    const to = ev.relatedTarget as HTMLElement | null;
    if (to && chip.contains(to as Node)) return;
    scheduleHideChipDefinition(chip.dataset.tag!);
  });
  container.addEventListener('click', hideChipDefinition);
}

function showInlineDefinition(afterRow: HTMLElement, tag: string): void {
  if (acHideTimer) clearTimeout(acHideTimer);
  if (acDefinitionTag === tag) return;
  hideInlineDefinition();
  const card = document.createElement('div');
  card.className = 'ac-flash-card';
  card.addEventListener('mouseenter', () => { if (acHideTimer) clearTimeout(acHideTimer); });
  card.addEventListener('mouseleave', () => scheduleHideInlineDefinition(tag));
  afterRow.insertAdjacentElement('afterend', card);
  acDefinitionHost = card;
  acDefinitionTag = tag;

  const body = document.createElement('div');
  body.className = 'ac-flash-body';
  card.appendChild(body);

  requestAnimationFrame(() => card.classList.add('show'));

  populateAcFlashBody(body, tag);
}

export function attachTagAutocomplete(inputEl: HTMLInputElement, getEntry: () => Entry | null, rerender: () => void): void {
  attachAutocompleteCore(inputEl, (tag: string) => {
    const entry = getEntry();
    closeAutocomplete();
    if (!entry) return;
    addTagToEntryRef!(entry, tag);
    inputEl.value = '';
    rerender();
    refreshRightPanelsRef!();
  });
}

export function attachFillAutocomplete(inputEl: HTMLInputElement): void {
  attachAutocompleteCore(inputEl, (tag: string) => {
    closeAutocomplete();
    inputEl.value = tag;
    inputEl.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

export function attachListAutocomplete(inputEl: HTMLInputElement, getOptions: () => string[]): void {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  inputEl.addEventListener('input', () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    const raw = inputEl.value.trim().toLowerCase();
    if (!raw) { closeAutocomplete(); return; }
    debounceTimer = setTimeout(() => {
      if (inputEl.value.trim().toLowerCase() !== raw) return;
      const options = getOptions() || [];
      const results = options.filter(o => o.toLowerCase().includes(raw)).slice(0, 30);
      renderListAutocompleteResults(inputEl, results, (val: string) => {
        closeAutocomplete();
        inputEl.value = val;
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }, 100);
  });
  inputEl.addEventListener('keydown', (ev: KeyboardEvent) => { if (ev.key === 'Escape') closeAutocomplete(); });
}

function renderListAutocompleteResults(inputEl: HTMLInputElement, results: string[], onPick: (val: string) => void): void {
  if (!autocompleteEl) {
    autocompleteEl = document.createElement('div');
    autocompleteEl.className = 'ac-panel';
    document.body.appendChild(autocompleteEl);
    document.addEventListener('click', onDocClickCloseAutocomplete, true);
  }
  autocompleteEl.innerHTML = '';
  if (results.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'ac-empty';
    empty.textContent = 'No matches.';
    autocompleteEl.appendChild(empty);
  } else {
    const list = document.createElement('div');
    list.className = 'ac-list';
    for (const val of results) {
      const row = document.createElement('div');
      row.className = 'ac-row';
      const name = document.createElement('span');
      name.className = 'ac-row-name';
      name.textContent = val;
      row.appendChild(name);
      row.addEventListener('click', () => onPick(val));
      list.appendChild(row);
    }
    autocompleteEl.appendChild(list);
  }
  positionAutocomplete(inputEl.getBoundingClientRect());
}

function attachAutocompleteCore(inputEl: HTMLInputElement, onPick: (tag: string) => void): void {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  inputEl.addEventListener('input', () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    if (!tagAutocompleteEnabled) { closeAutocomplete(); return; }
    const raw = inputEl.value.trim();
    if (!raw) { closeAutocomplete(); return; }
    debounceTimer = setTimeout(() => runAutocompleteSearch(inputEl, onPick, raw), 150);
  });
  inputEl.addEventListener('keydown', (ev: KeyboardEvent) => {
    if (ev.key === 'Escape') closeAutocomplete();
  });
}

function runAutocompleteSearch(inputEl: HTMLInputElement, onPick: (tag: string) => void, query: string): void {
  if (inputEl.value.trim() !== query) return;
  ensureAllTagsLoadedRef!().then(allTags => {
    if (inputEl.value.trim() !== query) return;
    const qNorm = query.toLowerCase().replace(/_/g, ' ');
    const starts: [string, { count?: number }][] = [];
    const contains: [string, { count?: number }][] = [];
    let scanned = 0;
    for (const [key, meta] of allTags) {
      const spaced = key.replace(/_/g, ' ');
      if (spaced.startsWith(qNorm)) starts.push([spaced, meta]);
      else if (spaced.includes(qNorm)) contains.push([spaced, meta]);
      scanned++;
      if (starts.length >= 30 || scanned >= 250000) break;
    }
    const results = starts.concat(contains).slice(0, 25);
    renderAutocompleteResults(inputEl, onPick, results);
  });
}

function renderAutocompleteResults(inputEl: HTMLInputElement, onPick: (tag: string) => void, results: [string, { count?: number }][]): void {
  if (!autocompleteEl) {
    autocompleteEl = document.createElement('div');
    autocompleteEl.className = 'ac-panel';
    document.body.appendChild(autocompleteEl);
    document.addEventListener('click', onDocClickCloseAutocomplete, true);
  }
  autocompleteEl.innerHTML = '';
  if (results.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'ac-empty';
    empty.textContent = 'No matching tags in the vocabulary.';
    autocompleteEl.appendChild(empty);
  } else {
    const list = document.createElement('div');
    list.className = 'ac-list';
    for (const [tag, meta] of results) {
      const row = document.createElement('div');
      row.className = 'ac-row';
      const name = document.createElement('span');
      name.className = 'ac-row-name';
      name.textContent = tag;
      row.appendChild(name);
      if (meta && typeof meta.count === 'number') {
        const cnt = document.createElement('span');
        cnt.className = 'ac-row-count';
        cnt.textContent = meta.count >= 1000 ? Math.round(meta.count / 1000) + 'k' : String(meta.count);
        row.appendChild(cnt);
      }
      let hoverTimer: ReturnType<typeof setTimeout> | null = null;
      row.addEventListener('mouseenter', () => {
        if (hoverTimer) clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => showInlineDefinition(row, tag), 1000);
      });
      row.addEventListener('mouseleave', () => {
        if (hoverTimer) clearTimeout(hoverTimer);
        scheduleHideInlineDefinition(tag);
      });
      let suppressNextClick = false;
      attachLongPress(row, () => { suppressNextClick = true; showInlineDefinition(row, tag); });
      row.addEventListener('click', () => {
        if (suppressNextClick) { suppressNextClick = false; return; }
        onPick(tag);
      });
      list.appendChild(row);
    }
    autocompleteEl.appendChild(list);
  }
  positionAutocomplete(inputEl.getBoundingClientRect());
}
