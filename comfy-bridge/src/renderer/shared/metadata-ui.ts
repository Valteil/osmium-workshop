// The Metadata tab's UI, shared by the desktop and Android shells: the LoRAs
// section of a generation's details (file info, CivitAI / CivArchive lookup,
// add to the LoRA stack) and the tab itself (open an image, look up a LoRA).
// Every value from a file, an image or a website is rendered with
// textContent; links open only through the shell's openLink (the two sites).
import {
  matchLocalLora, normalizeLookup, loraMetaRows, loraStem,
  type LoraRef, type LoraFileInfo, type LookupSite, type LookupKind, type LookupHit
} from './lora-lookup';
import { openDownloadModal, buildDownloadKeysSection, type LoraOp } from './lora-download';

export interface LoraTools {
  // ComfyUI's LoRA list as the app knows it (the LoRA stack's options).
  localNames(): string[];
  // A LoRA file's metadata (the runner's lora_info), by its list name.
  fileInfo(name: string): Promise<{ ok: boolean; info?: unknown; error?: string }>;
  // One allowlisted API request (lora-lookup.ts' lookupUrl).
  onlineLookup(site: LookupSite, kind: LookupKind, q: string): Promise<{ ok: boolean; status?: number; json?: unknown; error?: string }>;
  openLink(url: string): void;
  // A hit's preview image (lora-lookup.ts' previewImageUrl) as a data: URL,
  // fetched natively (main process / CapacitorHttp), or null.
  previewImage?(url: string): Promise<string | null>;
  addToStack?(name: string, strength: number): void;
  // The PC's runner LoRA commands (lora_op): the Download to PC modal's
  // folder browser + download. Absent = no download button.
  loraOp?: LoraOp;
  // After a download lands (refresh the LoRA lists).
  onLoraDownloaded?(): void;
  // The desktop app only: show the Download keys section.
  canSetKeys?: boolean;
}

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};
const button = (label: string, title: string, onClick: (b: HTMLButtonElement) => void): HTMLButtonElement => {
  const b = el('button', 'lora-btn', label);
  b.type = 'button';
  b.title = title;
  b.addEventListener('click', () => onClick(b));
  return b;
};

// File info per list name, shared across sections (the hash feeds lookups).
const fileInfoCache = new Map<string, LoraFileInfo>();
async function getFileInfo(tools: LoraTools, local: string): Promise<LoraFileInfo> {
  const hit = fileInfoCache.get(local);
  if (hit) return hit;
  const r = await tools.fileInfo(local);
  if (!r.ok || !r.info) throw new Error(r.error || 'Could not read the file.');
  const info = r.info as LoraFileInfo;
  fileInfoCache.set(local, info);
  return info;
}

function renderFileInfo(out: HTMLElement, info: LoraFileInfo): void {
  out.replaceChildren();
  const rows = loraMetaRows(info);
  if (!rows.length) out.appendChild(el('div', 'lora-note', 'This file has no training metadata.'));
  for (const [k, v] of rows) {
    const r = el('div', 'gen-info-row');
    r.append(el('span', 'gen-info-k', k), el('span', 'gen-info-v', v));
    out.appendChild(r);
  }
  if (info.top_tags && info.top_tags.length) {
    out.appendChild(el('div', 'lora-sub', 'Top training tags'));
    const chips = el('div', 'lora-chips');
    for (const [tag, count] of info.top_tags.slice(0, 30)) chips.appendChild(el('span', 'lora-chip', `${tag} (${count})`));
    out.appendChild(chips);
  }
  if (info.sha256) {
    const r = el('div', 'gen-info-row');
    r.append(el('span', 'gen-info-k', 'SHA-256'), el('span', 'gen-info-v lora-mono', `${info.sha256} (AutoV2 ${info.sha256.slice(0, 10).toUpperCase()})`));
    out.appendChild(r);
  }
}

// A hit's preview: a placeholder at once, the image when it arrives (cached
// per URL for the session; a failed fetch just drops the box).
const previewCache = new Map<string, Promise<string | null>>();
function previewThumb(url: string, link: string, tools: LoraTools): HTMLElement {
  const box = el('div', 'lora-hit-thumb');
  box.title = 'Open the page';
  box.addEventListener('click', () => tools.openLink(link));
  let p = previewCache.get(url);
  if (!p) {
    p = tools.previewImage!(url).catch(() => null);
    previewCache.set(url, p);
  }
  void p.then((data) => {
    if (!data || !/^data:image\/(jpeg|png|webp|gif|avif);base64,/.test(data)) { previewCache.delete(url); box.remove(); return; }
    const img = document.createElement('img');
    img.alt = '';
    img.decoding = 'async';
    img.src = data;
    img.addEventListener('error', () => box.remove());
    box.appendChild(img);
  });
  return box;
}

function renderHits(out: HTMLElement, hits: LookupHit[], tools: LoraTools, note?: string): void {
  out.replaceChildren();
  if (note) out.appendChild(el('div', 'lora-note', note));
  if (!hits.length) { out.appendChild(el('div', 'lora-note', 'Nothing found.')); return; }
  for (const h of hits) {
    const card = el('div', 'lora-hit');
    if (h.preview && tools.previewImage) card.appendChild(previewThumb(h.preview, h.url, tools));
    const body = el('div', 'lora-hit-body');
    card.appendChild(body);
    const head = el('div', 'lora-hit-head');
    head.appendChild(el('span', 'lora-hit-title', h.title + (h.version ? ` — ${h.version}` : '')));
    const tags = [h.exact ? 'exact match' : '', h.baseModel, h.platform && h.platform !== 'civitai' ? h.platform : '', h.nsfw ? 'NSFW' : '', h.deleted ? 'deleted' : ''].filter(Boolean);
    if (tags.length) head.appendChild(el('span', 'lora-hit-meta', tags.join(' · ')));
    body.appendChild(head);
    if (h.trainedWords.length) {
      const chips = el('div', 'lora-chips');
      for (const w of h.trainedWords) chips.appendChild(el('span', 'lora-chip', w));
      body.appendChild(chips);
    }
    const btns = el('div', 'lora-btns');
    btns.appendChild(button(`Open on ${h.site}`, h.url, () => tools.openLink(h.url)));
    if (h.downloads.length && tools.loraOp) {
      const op = tools.loraOp;
      btns.appendChild(button('Download to PC', h.downloads.length > 1 ? `Pick one of ${h.downloads.length} mirrors` : `From ${h.downloads[0].label}`,
        () => openDownloadModal(h, op, tools.onLoraDownloaded)));
    }
    body.appendChild(btns);
    out.appendChild(card);
  }
}

// Looks a LoRA up on one site: by the file's SHA-256 when we have the file
// (exact), by the hash the image recorded (CivitAI takes short hashes), else
// by name. An exact lookup that finds nothing falls back to a name search.
async function lookup(site: LookupSite, ref: LoraRef, local: string | null, tools: LoraTools, out: HTMLElement): Promise<void> {
  out.replaceChildren(el('div', 'lora-note', 'Looking up…'));
  let hash = '';
  if (local) { try { hash = (await getFileInfo(tools, local)).sha256 || ''; } catch { hash = ''; } }
  if (!hash && ref.hash && (site === 'civitai' || ref.hash.length === 64)) hash = ref.hash;
  // A bare pasted hash has no name to fall back on.
  const name = ref.hash && ref.name.toLowerCase() === ref.hash ? '' : loraStem(ref.name).replace(/_/g, ' ');
  const run = async (kind: LookupKind, q: string) => {
    const r = await tools.onlineLookup(site, kind, q);
    if (!r.ok) throw new Error(r.error || 'Lookup failed.');
    return normalizeLookup(site, kind, r.json);
  };
  try {
    if (hash) {
      const exact = await run('hash', hash);
      if (exact.length) { renderHits(out, exact, tools); return; }
      renderHits(out, name ? await run('name', name) : [], tools, `No exact match for this file on ${site === 'civitai' ? 'CivitAI' : 'CivArchive'}; name search:`);
      return;
    }
    renderHits(out, name ? await run('name', name) : [], tools, 'Name search (no file hash to match exactly):');
  } catch (err) {
    out.replaceChildren(el('div', 'lora-note', err instanceof Error ? err.message : String(err)));
  }
}

// The LoRAs section: one row per LoRA with its lookups.
export function buildLoraSection(loras: LoraRef[], tools: LoraTools): HTMLElement {
  const wrap = el('div', 'lora-list');
  const locals = tools.localNames();
  for (const ref of loras) {
    const local = matchLocalLora(ref.name, locals);
    const item = el('div', 'lora-item');
    const head = el('div', 'lora-head');
    head.appendChild(el('span', 'lora-name', ref.name));
    if (ref.strength !== undefined) head.appendChild(el('span', 'lora-strength', `@ ${ref.strength}`));
    head.appendChild(el('span', 'lora-badge ' + (local ? 'in' : 'out'), local ? 'In your folder' : 'Not in your folder'));
    item.appendChild(head);
    if (local && local !== ref.name) item.appendChild(el('div', 'lora-note', `Matches your ${local}`));
    const out = el('div', 'lora-out');
    const actions = el('div', 'lora-actions');
    if (local) {
      actions.appendChild(button('File info', 'Read this LoRA file\'s training metadata, top tags and hash from your loras folder', async () => {
        out.replaceChildren(el('div', 'lora-note', 'Reading the file…'));
        try { renderFileInfo(out, await getFileInfo(tools, local)); }
        catch (err) { out.replaceChildren(el('div', 'lora-note', err instanceof Error ? err.message : String(err))); }
      }));
    }
    actions.appendChild(button('CivitAI', 'Look this LoRA up on civitai.com (exact by file hash when possible, else by name)', () => void lookup('civitai', ref, local, tools, out)));
    actions.appendChild(button('CivArchive', 'Look this LoRA up on civarchive.com (exact by file hash when possible, else by name)', () => void lookup('civarchive', ref, local, tools, out)));
    if (local && tools.addToStack) {
      actions.appendChild(button('Add to stack', 'Add this LoRA (and its strength from the image) to your LoRA stack', (b) => {
        tools.addToStack!(local, ref.strength ?? 1);
        b.textContent = 'Added';
        b.disabled = true;
      }));
    }
    item.append(actions, out);
    wrap.appendChild(item);
  }
  return wrap;
}

// ---- the tab ------------------------------------------------------------------

export interface MetadataTabDeps {
  tools: LoraTools;
  // The image to inspect: its data URL (shown) — or null when cancelled.
  pickImage(): Promise<string | null>;
  // The generation details for an image (gen-info's panel with the LoRA tools
  // and the shell's apply buttons), or null when it has none.
  details(src: string): HTMLElement | null;
}

export function mountMetadataTab(root: HTMLElement, deps: MetadataTabDeps): void {
  root.replaceChildren();
  // Image
  const imgSec = el('section', 'sec meta-sec');
  const imgHead = el('div', 'sec-head');
  imgHead.appendChild(el('span', 'd', 'Image metadata'));
  imgSec.appendChild(imgHead);
  imgSec.appendChild(el('div', 'muted small', 'Any image: one from this app, another ComfyUI workflow, A1111/Forge, NovelAI, InvokeAI or SwarmUI. Its prompt, settings and the LoRAs it used, with lookups.'));
  const openBtn = el('button', '', 'Open image…');
  openBtn.type = 'button';
  const body = el('div', 'meta-image-body');
  openBtn.addEventListener('click', async () => {
    const src = await deps.pickImage();
    if (!src) return;
    body.replaceChildren();
    const img = el('img', 'meta-image');
    img.src = src;
    img.alt = 'Opened image';
    const details = deps.details(src);
    body.append(img, details || el('div', 'gen-info-empty', 'No generation settings in this image.'));
  });
  imgSec.append(openBtn, body);
  // LoRA lookup
  const loraSec = el('section', 'sec meta-sec');
  const loraHead = el('div', 'sec-head');
  loraHead.appendChild(el('span', 'd', 'LoRA lookup'));
  loraSec.appendChild(loraHead);
  loraSec.appendChild(el('div', 'muted small', 'One of your LoRAs (file info, exact online match by its hash), or any name searched on CivitAI / CivArchive.'));
  const row = el('div', 'meta-lookup-row');
  const input = el('input');
  input.type = 'text';
  input.placeholder = 'Your LoRA, or a name to search…';
  const listId = 'metaLoraNames';
  const dl = el('datalist');
  dl.id = listId;
  input.setAttribute('list', listId);
  // Suggestions = your LoRA list, refreshed whenever the box is used (the
  // list can change after a Connect / Refresh model lists).
  const fillList = () => dl.replaceChildren(...deps.tools.localNames().map((n) => { const o = el('option'); o.value = n; return o; }));
  for (const ev of ['focus', 'pointerdown', 'input']) input.addEventListener(ev, fillList);
  fillList();
  const result = el('div', 'meta-lookup-result');
  const go = el('button', '', 'Look up');
  go.type = 'button';
  go.addEventListener('click', () => {
    const q = input.value.trim();
    if (!q) return;
    // A pasted SHA-256 (or CivitAI's 10-hex AutoV2) looks up by hash.
    const isHash = /^([0-9a-f]{64}|[0-9a-f]{10})$/i.test(q);
    result.replaceChildren(buildLoraSection([isHash ? { name: q, hash: q.toLowerCase() } : { name: q }], deps.tools));
  });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') go.click(); });
  row.append(input, go, dl);
  loraSec.append(row, result);
  root.append(imgSec, loraSec);
  if (deps.tools.canSetKeys && deps.tools.loraOp) root.appendChild(buildDownloadKeysSection(deps.tools.loraOp));
}
