// The LoRA picker (both shells): a preview thumbnail per LoRA, a big preview
// on hover, version chips for LoRAs that are versions of one another, and the
// trigger words — under each LoRA field too, a click adds one to the prompt.
// Cards come from the runner's lora_op `cards` (ComfyUI-Lora-Manager's
// .preview.* / .metadata.json beside the file, plus Bridge's own
// <stem>.osmium.json); without the runner (a plain ComfyUI server) the same
// name rules run here, so triggers and versions still show, minus previews
// and editing. Every value is rendered with textContent.
import type { LoraOp } from './lora-download';

export interface LoraCard {
  name: string;
  title: string;
  triggers: string[];
  triggerSource: 'set' | 'lora-manager' | 'name';
  version: string;
  versionSet: boolean;
  group: string;
  groupSet: boolean;
  preview: boolean;
  stamp: number;
}

export interface LoraCardHost {
  op: LoraOp | null;
  // Whether `op` can reach the runner right now (desktop: Run on = Osmium Comfy).
  live?(): boolean;
  // Adds a trigger to the prompt (the Global field).
  insertTrigger?(text: string): void;
  // The prompt text, to mark triggers already in it.
  promptText?(): string;
}

let host: LoraCardHost = { op: null };
let cards = new Map<string, LoraCard>();
let loading: Promise<void> | null = null;
let loadedAt = 0;
const thumbs = new Map<string, Promise<string | null>>();
const chipHosts = new Set<() => void>();

export function setLoraCardHost(h: LoraCardHost): void { host = h; }

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};
const canAsk = (): boolean => !!host.op && (!host.live || host.live());

const VERSION_RE = /(?:^|[\s_\-(\[])(v\d+(?:\.\d+)*)(?=$|[\s_\-)\]])/i;
const stemOf = (name: string): string => (name.split(/[\\/]/).pop() || name).replace(/\.[^.]+$/, '');
const dirOf = (name: string): string => { const i = Math.max(name.lastIndexOf('/'), name.lastIndexOf('\\')); return i < 0 ? '' : name.slice(0, i); };

// The runner's rules (osmium_comfy_runner.py lora_card), for when there's no runner.
function guessCard(name: string): LoraCard {
  const stem = stemOf(name);
  const parts = stem.split(' - ').map((s) => s.trim()).filter(Boolean);
  const triggers = parts.length >= 2 ? parts[parts.length - 1].split(',').map((s) => s.trim()).filter(Boolean) : [];
  const m = VERSION_RE.exec(stem);
  const named = parts.length >= 3 ? parts.slice(0, -1).join(' - ') : stem; // triggers can differ per version
  const base = named.replace(new RegExp(VERSION_RE.source, 'gi'), ' ').toLowerCase().replace(/[\s_\-]+/g, ' ').trim();
  return {
    name, title: '', triggers, triggerSource: 'name', version: m ? m[1].toUpperCase() : '', versionSet: false,
    group: dirOf(name).toLowerCase().replace(/\\/g, '/') + '/' + base, groupSet: false, preview: false, stamp: 0
  };
}

export function loraCard(name: string): LoraCard {
  return cards.get(name) || guessCard(name);
}

export function loadLoraCards(force = false): Promise<void> {
  if (!canAsk()) return Promise.resolve();
  if (loading && !force) return loading;
  if (!force && Date.now() - loadedAt < 15000) return Promise.resolve();
  loading = (async () => {
    try {
      const r = await host.op!({ op: 'cards' });
      if (r.ok && Array.isArray(r.cards)) {
        const next = new Map<string, LoraCard>();
        for (const c of r.cards as LoraCard[]) if (c && typeof c.name === 'string') next.set(c.name, c);
        cards = next;
        loadedAt = Date.now();
        chipHosts.forEach((f) => f());
      }
    } catch { /* keep what we had */ }
    finally { loading = null; }
  })();
  return loading;
}

function putCard(c: LoraCard): void {
  cards.set(c.name, c);
  for (const k of [...thumbs.keys()]) if (k.startsWith(c.name + '|')) thumbs.delete(k);
  chipHosts.forEach((f) => f());
}

export function loraThumb(name: string, side = 160): Promise<string | null> {
  const c = cards.get(name);
  if (!c || !c.preview || !canAsk()) return Promise.resolve(null);
  const key = `${name}|${side}|${c.stamp}`;
  let p = thumbs.get(key);
  if (!p) {
    p = host.op!({ op: 'thumb', name, side }).then((r) => {
      const mime = String(r.mime || '');
      return r.ok && typeof r.b64 === 'string' && /^image\/(jpeg|png|webp)$/.test(mime) ? `data:${mime};base64,${r.b64}` : null;
    }).catch(() => null);
    thumbs.set(key, p);
  }
  return p;
}

function fillThumb(box: HTMLElement, name: string, side: number): void {
  void loraThumb(name, side).then((src) => {
    if (!src) { box.classList.add('none'); return; }
    const img = el('img');
    img.alt = '';
    img.decoding = 'async';
    img.src = src;
    box.replaceChildren(img);
  });
}

// ---- hover preview ------------------------------------------------------------

let hoverEl: HTMLElement | null = null;
let hoverName = '';
function showHover(name: string, anchor: HTMLElement): void {
  if (!loraCard(name).preview) { hideHover(); return; }
  if (!hoverEl) { hoverEl = el('div', 'lora-hover'); document.body.appendChild(hoverEl); }
  hoverName = name;
  const r = anchor.getBoundingClientRect();
  const w = 300;
  const left = r.right + 12 + w < window.innerWidth ? r.right + 12 : Math.max(8, r.left - 12 - w);
  hoverEl.style.left = `${left}px`;
  hoverEl.style.top = `${Math.max(8, Math.min(r.top - 40, window.innerHeight - 420))}px`;
  hoverEl.replaceChildren(el('div', 'lora-note', 'Loading…'));
  hoverEl.hidden = false;
  void loraThumb(name, 512).then((src) => {
    if (!hoverEl || hoverName !== name) return;
    if (!src) { hideHover(); return; }
    const img = el('img');
    img.alt = '';
    img.src = src;
    hoverEl.replaceChildren(img);
  });
}
function hideHover(): void { hoverName = ''; if (hoverEl) hoverEl.hidden = true; }

// ---- the picker ---------------------------------------------------------------

interface Group { key: string; members: string[] }

function groupNames(names: string[]): Group[] {
  const byKey = new Map<string, Group>();
  const out: Group[] = [];
  for (const n of names) {
    const k = loraCard(n).group || n;
    let g = byKey.get(k);
    if (!g) { g = { key: k, members: [] }; byKey.set(k, g); out.push(g); }
    g.members.push(n);
  }
  const vkey = (n: string) => loraCard(n).version.toLowerCase();
  for (const g of out) g.members.sort((a, b) => vkey(a).localeCompare(vkey(b), undefined, { numeric: true }) || a.localeCompare(b));
  return out;
}

export function openLoraPicker(title: string, names: string[], current: string, onPick: (val: string) => void): void {
  const backdrop = el('div', 'picker-backdrop');
  const box = el('div', 'picker-box lora-picker');
  const head = el('div', 'picker-head');
  head.appendChild(el('span', 'd', title));
  const closeBtn = el('button', 'picker-close', '×');
  closeBtn.type = 'button';
  head.appendChild(closeBtn);
  const search = el('input', 'picker-search');
  search.type = 'text';
  search.placeholder = 'Search names and trigger words…';
  const list = el('div', 'picker-list');
  box.append(head, search, list);
  backdrop.appendChild(box);

  const pick = (v: string) => { onPick(v); close(); };
  function close(): void {
    hideHover();
    backdrop.classList.remove('modal-visible');
    setTimeout(() => backdrop.remove(), 160);
    document.removeEventListener('keydown', onKey);
  }
  function onKey(ev: KeyboardEvent): void { if (ev.key === 'Escape' && !document.querySelector('.lora-edit-backdrop.modal-visible')) close(); }

  function row(g: Group): HTMLElement {
    const shown = g.members.includes(current) ? current : g.members[g.members.length - 1];
    const card = loraCard(shown);
    const r = el('div', 'picker-row lora-pick-row' + (g.members.includes(current) ? ' picked' : ''));
    const thumb = el('div', 'lora-pick-thumb');
    if (card.preview) fillThumb(thumb, shown, 160); else thumb.classList.add('none');
    const body = el('div', 'lora-pick-body');
    const nameLine = el('div', 'lora-pick-name', card.title && g.members.length > 1 ? card.title : stemOf(shown));
    body.appendChild(nameLine);
    const dir = dirOf(shown);
    if (dir || (card.title && g.members.length > 1)) body.appendChild(el('div', 'lora-pick-dir', [dir, g.members.length > 1 && card.title ? stemOf(shown) : ''].filter(Boolean).join(' · ')));
    if (g.members.length > 1) {
      const vers = el('div', 'lora-pick-versions');
      for (const m of g.members) {
        const c = loraCard(m);
        const chip = el('button', 'lora-ver' + (m === current ? ' on' : '') + (m === shown ? ' shown' : ''), c.version || stemOf(m));
        chip.type = 'button';
        chip.title = `Pick ${m}`;
        chip.addEventListener('click', (e) => { e.stopPropagation(); pick(m); });
        chip.addEventListener('mouseenter', () => showHover(m, r));
        vers.appendChild(chip);
      }
      body.appendChild(vers);
    }
    if (card.triggers.length) body.appendChild(el('div', 'lora-pick-trig', card.triggers.join(', ')));
    r.append(thumb, body);
    if (canAsk()) {
      const edit = el('button', 'lora-pick-edit', '✎');
      edit.type = 'button';
      edit.title = 'Set its preview, trigger words and version';
      edit.addEventListener('click', (e) => { e.stopPropagation(); hideHover(); openLoraCardEditor(shown, () => render()); });
      r.appendChild(edit);
    }
    r.addEventListener('click', () => pick(shown));
    r.addEventListener('mouseenter', () => showHover(shown, r));
    r.addEventListener('mouseleave', hideHover);
    // Touch: tap the thumbnail for the big preview instead of picking.
    thumb.addEventListener('click', (e) => {
      if (!card.preview || window.matchMedia('(hover: hover)').matches) return;
      e.stopPropagation();
      if (hoverName === shown) hideHover(); else showHover(shown, r);
    });
    return r;
  }

  function render(): void {
    const q = search.value.trim().toLowerCase();
    const hit = (n: string) => {
      if (!q) return 0;
      const c = loraCard(n);
      const stem = stemOf(n).toLowerCase();
      if (stem.startsWith(q)) return 1;
      if (n.toLowerCase().includes(q) || c.title.toLowerCase().includes(q)) return 2;
      if (c.triggers.some((t) => t.toLowerCase().includes(q))) return 3;
      return -1;
    };
    const groups = groupNames(names).map((g) => ({ g, rank: Math.min(...g.members.map((m) => { const h = hit(m); return h < 0 ? 99 : h; })) }))
      .filter((x) => x.rank < 99)
      .sort((a, b) => a.rank - b.rank);
    const scroll = list.scrollTop;
    list.replaceChildren();
    const clearRow = el('div', 'picker-row picker-clear', '— Clear —');
    clearRow.addEventListener('click', () => pick(''));
    list.appendChild(clearRow);
    if (!groups.length) list.appendChild(el('div', 'picker-empty', q ? 'No matches.' : 'No options yet — hit "Refresh model lists".'));
    for (const x of groups) list.appendChild(row(x.g));
    list.scrollTop = scroll;
  }
  search.addEventListener('input', () => { list.scrollTop = 0; render(); });
  list.addEventListener('scroll', hideHover, { passive: true });
  backdrop.addEventListener('click', (ev) => { if (ev.target === backdrop) close(); });
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', onKey);
  render();
  document.body.appendChild(backdrop);
  void loadLoraCards().then(() => { if (backdrop.isConnected) render(); });
  requestAnimationFrame(() => requestAnimationFrame(() => {
    backdrop.classList.add('modal-visible');
    search.focus();
  }));
}

// A LoRA field: readonly, tap to open the picker (the model fields' pattern).
export function attachLoraPicker(input: HTMLInputElement, title: string, getOptions: () => string[], onPicked?: (v: string) => void): void {
  input.readOnly = true;
  input.addEventListener('click', () => openLoraPicker(title, getOptions() || [], input.value, (v) => {
    input.value = v;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    if (onPicked) onPicked(v);
  }));
}

// ---- trigger chips under a LoRA field --------------------------------------------

const VALUE = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!;

// Renders the field's trigger words into `box` and keeps them current: the
// value setter is wrapped, so imports / resets that set .value update it too.
export function mountLoraTriggers(input: HTMLInputElement, box: HTMLElement): void {
  box.classList.add('lora-trig-chips');
  // Rows are built before they're attached: drop the host only once a field
  // that was on the page has left it (a removed LoRA row).
  let attached = false;
  const render = () => {
    if (input.isConnected) attached = true;
    else if (attached) { chipHosts.delete(render); return; }
    const name = VALUE.get!.call(input) as string;
    box.replaceChildren();
    if (!name || name === 'None') { box.hidden = true; return; }
    const c = loraCard(name);
    box.hidden = !c.triggers.length;
    if (!c.triggers.length) return;
    const prompt = (host.promptText ? host.promptText() : '').toLowerCase();
    for (const t of c.triggers) {
      const inPrompt = prompt.includes(t.toLowerCase());
      const chip = el('button', 'lora-trig' + (inPrompt ? ' in' : ''), t);
      chip.type = 'button';
      chip.title = inPrompt ? 'Already in the prompt' : 'Add to the Global prompt';
      chip.disabled = !host.insertTrigger;
      chip.addEventListener('click', () => { host.insertTrigger && host.insertTrigger(t); render(); });
      box.appendChild(chip);
    }
    if (c.triggers.length > 1 && host.insertTrigger) {
      const all = el('button', 'lora-trig all', '+ all');
      all.type = 'button';
      all.title = 'Add every trigger word that isn\'t in the prompt yet';
      all.addEventListener('click', () => {
        const p = (host.promptText ? host.promptText() : '').toLowerCase();
        const missing = c.triggers.filter((t) => !p.includes(t.toLowerCase()));
        if (missing.length) host.insertTrigger!(missing.join(', '));
        render();
      });
      box.appendChild(all);
    }
  };
  Object.defineProperty(input, 'value', {
    configurable: true,
    get() { return VALUE.get!.call(this); },
    set(v) { VALUE.set!.call(this, v); queueMicrotask(render); }
  });
  chipHosts.add(render);
  render();
  void loadLoraCards();
}

export function refreshLoraTriggers(): void { chipHosts.forEach((f) => f()); }

// ---- the card editor ------------------------------------------------------------

function readFileB64(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result || '').replace(/^data:[^,]*,/, ''));
    r.onerror = () => rej(r.error || new Error('Could not read the file.'));
    r.readAsDataURL(f);
  });
}

export function openLoraCardEditor(name: string, onSaved?: () => void): void {
  const backdrop = el('div', 'picker-backdrop lora-edit-backdrop');
  const box = el('div', 'picker-box lora-edit');
  const head = el('div', 'picker-head');
  head.appendChild(el('span', 'd', stemOf(name)));
  const closeBtn = el('button', 'picker-close', '×');
  closeBtn.type = 'button';
  head.appendChild(closeBtn);
  const scroll = el('div', 'lora-edit-body');
  box.append(head, scroll);
  backdrop.appendChild(box);
  const status = el('div', 'lora-note');

  const prev = el('div', 'lora-edit-preview');
  const fileIn = el('input');
  fileIn.type = 'file';
  fileIn.accept = 'image/png,image/jpeg,image/webp';
  fileIn.hidden = true;
  const setPrev = el('button', 'lora-btn', 'Set preview…');
  setPrev.type = 'button';
  setPrev.title = 'Pick an image (PNG, JPEG, WebP). It\'s saved beside the LoRA as <name>.preview.<ext>, the file ComfyUI-Lora-Manager uses too; an older one is kept as .preview_old.';
  setPrev.addEventListener('click', () => fileIn.click());

  const field = (label: string, hint: string) => {
    const wrap = el('label', 'lora-edit-field');
    wrap.appendChild(el('span', 'lora-edit-label', label));
    const inp = el('input');
    inp.type = 'text';
    wrap.appendChild(inp);
    const auto = el('button', 'lora-btn', 'Auto');
    auto.type = 'button';
    auto.title = hint;
    const row = el('div', 'lora-edit-row');
    row.append(inp, auto);
    wrap.appendChild(row);
    const note = el('span', 'lora-edit-hint');
    wrap.appendChild(note);
    return { wrap, inp, auto, note };
  };
  const trig = field('Trigger words', 'Go back to Lora Manager\'s / the file name\'s trigger words');
  const ver = field('Version', 'Go back to the version read from the name (v2, V1.5…) or Lora Manager');
  const grp = field('Versions of', 'Go back to the automatic grouping');
  trig.inp.placeholder = 'comma, separated';
  ver.inp.placeholder = 'e.g. V2';
  grp.inp.placeholder = 'LoRAs with the same text here are versions of one LoRA';

  const save = el('button', '', 'Save');
  save.type = 'button';
  const btns = el('div', 'lora-btns');
  btns.append(save);

  let card = loraCard(name);
  const fill = () => {
    card = loraCard(name);
    trig.inp.value = card.triggers.join(', ');
    trig.note.textContent = card.triggerSource === 'set' ? 'Set here.' : card.triggerSource === 'lora-manager' ? 'From Lora Manager (CivitAI).' : 'From the file name\'s last " - " part.';    ver.inp.value = card.version;
    ver.note.textContent = card.versionSet ? 'Set here.' : 'Automatic.';
    grp.inp.value = card.group;
    grp.note.textContent = card.groupSet ? 'Set here.' : 'Automatic: ' + (card.group.startsWith('civitai:') ? 'the same CivitAI model.' : 'the name without its version.');
    prev.replaceChildren();
    if (card.preview) {
      const t = el('div', 'lora-edit-img');
      prev.appendChild(t);
      void loraThumb(name, 512).then((src) => { if (src) { const img = el('img'); img.alt = ''; img.src = src; t.replaceChildren(img); } });
    } else prev.appendChild(el('div', 'lora-note', 'No preview yet.'));
    prev.append(setPrev, fileIn);
  };
  const send = async (payload: Record<string, unknown>, busy: string) => {
    status.textContent = busy;
    try {
      const r = await host.op!({ ...payload, name });
      if (!r.ok || !r.card) throw new Error(r.error || 'Could not save.');
      putCard(r.card as LoraCard);
      status.textContent = 'Saved.';
      fill();
      if (onSaved) onSaved();
    } catch (err) { status.textContent = err instanceof Error ? err.message : String(err); }
  };
  fileIn.addEventListener('change', async () => {
    const f = fileIn.files && fileIn.files[0];
    fileIn.value = '';
    if (!f) return;
    if (f.size > 12 * 1024 * 1024) { status.textContent = 'That image is over 12 MB.'; return; }
    void send({ op: 'set_preview', b64: await readFileB64(f) }, 'Saving the preview…');
  });
  trig.auto.addEventListener('click', () => void send({ op: 'set_card', triggers: null }, 'Saving…'));
  ver.auto.addEventListener('click', () => void send({ op: 'set_card', version: null }, 'Saving…'));
  grp.auto.addEventListener('click', () => void send({ op: 'set_card', group: null }, 'Saving…'));
  save.addEventListener('click', () => {
    const p: Record<string, unknown> = { op: 'set_card' };
    if (trig.inp.value.trim() !== card.triggers.join(', ')) p.triggers = trig.inp.value;
    if (ver.inp.value.trim() !== card.version) p.version = ver.inp.value.trim() || null;
    if (grp.inp.value.trim() !== card.group) p.group = grp.inp.value.trim() || null;
    if (Object.keys(p).length === 1) { status.textContent = 'Nothing changed.'; return; }
    void send(p, 'Saving…');
  });

  scroll.append(prev, trig.wrap, ver.wrap, grp.wrap, btns, status);
  fill();

  function close(): void {
    backdrop.classList.remove('modal-visible');
    setTimeout(() => backdrop.remove(), 160);
    window.removeEventListener('keydown', onKey, true);
  }
  // Capture + stop: the picker under this one also listens for Escape.
  function onKey(ev: KeyboardEvent): void { if (ev.key === 'Escape') { ev.stopPropagation(); close(); } }
  backdrop.addEventListener('click', (ev) => { if (ev.target === backdrop) close(); });
  closeBtn.addEventListener('click', close);
  window.addEventListener('keydown', onKey, true);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('modal-visible')));
}
