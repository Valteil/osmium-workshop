// "Download to PC" (the LoRA lookup's hits; desktop + Android): a modal that
// commands the PC's Osmium Comfy runner (lora_op) to fetch the LoRA into its
// loras folder. Pick a mirror when the site lists several (CivArchive), pick
// or create a subfolder by browsing the loras folder, and rename the file.
// The runner builds the URL itself from the source's ids, keeps only a
// .safetensors (SHA-256 checked when known) and never overwrites. Also the
// desktop's Download keys section (CivitAI API key, Hugging Face token: some
// files need an account), set only from the PC.
import type { DownloadSource, LookupHit } from './lora-lookup';

export type LoraOp = (payload: Record<string, unknown>) => Promise<Record<string, any> & { ok: boolean; error?: string }>;

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};
const btn = (label: string, cls = 'lora-btn'): HTMLButtonElement => { const b = el('button', cls, label); b.type = 'button'; return b; };

// Same rule as the runner's SAFE_SEGMENT (Windows file/folder names).
const SAFE_NAME = /^[^<>:"/\\|?*\x00-\x1f]{1,120}$/;
export function cleanLoraFileName(raw: string): string {
  let n = String(raw || '').trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/^\.+/, '');
  if (!n) return '';
  if (!/\.safetensors$/i.test(n)) n = n.replace(/\.(ckpt|pt|pth|bin)$/i, '') + '.safetensors';
  return n.slice(0, 120);
}
const defaultName = (hit: LookupHit, src: DownloadSource): string =>
  cleanLoraFileName(src.filename || [hit.title, hit.version].filter(Boolean).join(' - ') || 'lora');
const mb = (n: number) => (n / 1048576).toFixed(n < 10485760 ? 1 : 0) + ' MB';

export function openDownloadModal(hit: LookupHit, op: LoraOp, onDone?: () => void): void {
  const backdrop = el('div', 'picker-backdrop');
  const box = el('div', 'picker-box lora-dl-box');
  const head = el('div', 'picker-head');
  head.appendChild(el('span', 'd', 'Download to PC'));
  const closeBtn = btn('×', 'picker-close');
  head.appendChild(closeBtn);
  const scroll = el('div', 'lora-dl-scroll');
  box.append(head, scroll);
  backdrop.appendChild(box);
  const close = () => {
    backdrop.classList.remove('modal-visible');
    setTimeout(() => backdrop.remove(), 160);
    document.removeEventListener('keydown', onKey);
    polling = false;
  };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  document.addEventListener('keydown', onKey);

  scroll.appendChild(el('div', 'lora-dl-title', hit.title + (hit.version ? ` — ${hit.version}` : '')));

  // Mirror (source) picker.
  let src = hit.downloads[0];
  let nameEdited = false;
  const nameInput = el('input');
  nameInput.type = 'text';
  nameInput.spellcheck = false;
  nameInput.value = defaultName(hit, src);
  nameInput.addEventListener('input', () => { nameEdited = true; });
  scroll.appendChild(el('div', 'lora-sub', hit.downloads.length > 1 ? `Mirror (${hit.downloads.length})` : 'From'));
  const mirrors = el('div', 'lora-dl-mirrors');
  hit.downloads.forEach((d, i) => {
    const row = el('label', 'lora-dl-mirror');
    const radio = el('input');
    radio.type = 'radio';
    radio.name = 'lora-dl-mirror';
    radio.checked = i === 0;
    radio.addEventListener('change', () => {
      src = d;
      if (!nameEdited) nameInput.value = defaultName(hit, d);
    });
    const text = el('span', 'lora-dl-mirror-text');
    text.appendChild(el('span', 'lora-dl-mirror-label', d.label));
    const flags = [d.filename, d.sha256 ? 'SHA-256 checked' : '', d.gated ? 'needs an account' : '', d.deleted ? 'marked deleted' : ''].filter(Boolean);
    if (flags.length) text.appendChild(el('span', 'lora-hit-meta', flags.join(' · ')));
    row.append(radio, text);
    mirrors.appendChild(row);
  });
  scroll.appendChild(mirrors);

  // Folder browser: the loras folder and its subfolders, plus a new one.
  scroll.appendChild(el('div', 'lora-sub', 'Folder'));
  const crumbs = el('div', 'lora-dl-crumbs');
  const dirList = el('div', 'lora-dl-dirs');
  const newRow = el('div', 'lora-dl-new');
  const newInput = el('input');
  newInput.type = 'text';
  newInput.placeholder = 'New subfolder (optional)';
  newRow.appendChild(newInput);
  scroll.append(crumbs, dirList, newRow);
  let cwd = '';
  const browse = async (path: string) => {
    dirList.replaceChildren(el('div', 'lora-note', 'Loading…'));
    let r: Awaited<ReturnType<LoraOp>>;
    try { r = await op({ op: 'dirs', path }); } catch (err) { r = { ok: false, error: err instanceof Error ? err.message : String(err) }; }
    if (!r.ok) { dirList.replaceChildren(el('div', 'lora-note lora-err', r.error || 'Could not list the loras folder.')); return; }
    cwd = String(r.path || '');
    crumbs.replaceChildren();
    const parts = cwd ? cwd.split('/') : [];
    const root = btn('loras', 'lora-dl-crumb');
    root.addEventListener('click', () => { void browse(''); });
    crumbs.appendChild(root);
    parts.forEach((p, i) => {
      crumbs.appendChild(el('span', 'lora-dl-sep', '/'));
      const c = btn(p, 'lora-dl-crumb');
      c.addEventListener('click', () => { void browse(parts.slice(0, i + 1).join('/')); });
      crumbs.appendChild(c);
    });
    dirList.replaceChildren();
    const dirs: string[] = Array.isArray(r.dirs) ? r.dirs : [];
    for (const d of dirs) {
      const b = btn('📁 ' + d, 'lora-dl-dir');
      b.addEventListener('click', () => { void browse(cwd ? `${cwd}/${d}` : d); });
      dirList.appendChild(b);
    }
    dirList.appendChild(el('div', 'lora-note', `${dirs.length ? '' : 'No subfolders. '}${r.files || 0} LoRA file${r.files === 1 ? '' : 's'} here.`));
  };

  // File name.
  scroll.appendChild(el('div', 'lora-sub', 'File name'));
  scroll.appendChild(nameInput);
  const dest = el('div', 'lora-note');
  scroll.appendChild(dest);
  const target = () => {
    const sub = newInput.value.trim().replace(/\\/g, '/').split('/').map((s) => s.trim()).filter(Boolean);
    return { folder: [cwd, ...sub].filter(Boolean).join('/'), name: cleanLoraFileName(nameInput.value), badSub: sub.some((s) => !SAFE_NAME.test(s) || s === '..' || s === '.') };
  };
  const showDest = () => { const t = target(); dest.textContent = t.name ? `Saves as loras/${t.folder ? t.folder + '/' : ''}${t.name}` : ''; };
  for (const i of [nameInput, newInput]) i.addEventListener('input', showDest);
  crumbs.addEventListener('click', () => setTimeout(showDest, 400));
  dirList.addEventListener('click', () => setTimeout(showDest, 400));

  const go = btn('Download', 'lora-btn lora-dl-go');
  const status = el('div', 'lora-dl-status');
  scroll.append(go, status);
  let polling = true;
  go.addEventListener('click', async () => {
    const t = target();
    if (!t.name) { status.textContent = 'Give the file a name.'; return; }
    if (t.badSub) { status.textContent = "That subfolder name has characters Windows can't use."; return; }
    go.disabled = true;
    status.textContent = 'Starting…';
    const payload: Record<string, unknown> = {
      op: 'download', folder: t.folder, filename: t.name,
      src: { source: src.source, version_id: src.versionId, repo: src.repo, rev: src.rev, path: src.path, sha256: src.sha256 }
    };
    let r: Awaited<ReturnType<LoraOp>>;
    try { r = await op(payload); } catch (err) { r = { ok: false, error: err instanceof Error ? err.message : String(err) }; }
    if (!r.ok || !r.job) { status.textContent = r.error || 'The PC could not start the download.'; go.disabled = false; return; }
    const id = String(r.job.id);
    while (polling) {
      await new Promise((res) => setTimeout(res, 1000));
      let s: Awaited<ReturnType<LoraOp>>;
      try { s = await op({ op: 'status' }); } catch { continue; }
      const job = s.ok && Array.isArray(s.jobs) ? s.jobs.find((j: any) => j.id === id) : null;
      if (!job) continue;
      if (job.state === 'running') {
        status.textContent = `Downloading ${job.name}: ${mb(job.bytes)}${job.total ? ` of ${mb(job.total)} (${Math.floor((job.bytes / job.total) * 100)}%)` : ''}`;
        continue;
      }
      if (job.state === 'done') {
        status.textContent = `Saved as loras/${job.name} (${mb(job.bytes)}${job.verified ? ', SHA-256 matches' : ''}).`;
        go.textContent = 'Done';
        if (onDone) onDone();
      } else {
        status.textContent = job.error || 'The download failed.';
        go.disabled = false;
      }
      return;
    }
  });

  document.body.appendChild(backdrop);
  requestAnimationFrame(() => backdrop.classList.add('modal-visible'));
  void browse('').then(showDest);
}

// The desktop's Download keys (written into the PC's ComfyUI user folder by
// the runner; only whether each is set ever comes back).
export function buildDownloadKeysSection(op: LoraOp): HTMLElement {
  const sec = el('section', 'sec meta-sec');
  const head = el('div', 'sec-head');
  head.appendChild(el('span', 'd', 'Download keys'));
  sec.appendChild(head);
  sec.appendChild(el('div', 'muted small', 'Some LoRAs need an account to download: a CivitAI API key (civitai.com → Account settings → API keys) or a Hugging Face access token (read access) for gated repos. Optional; kept on this PC only, sent only to that site, never to the phone.'));
  const state = el('div', 'lora-note');
  const fields: [string, string, HTMLInputElement][] = [['civitai', 'CivitAI API key', el('input')], ['huggingface', 'Hugging Face token', el('input')]];
  for (const [, label, input] of fields) {
    input.type = 'password';
    input.autocomplete = 'off';
    input.placeholder = label + ' (leave empty to keep)';
    const row = el('div', 'meta-lookup-row');
    row.appendChild(input);
    sec.appendChild(row);
  }
  const save = btn('Save keys');
  const clear = btn('Remove keys');
  const btnRow = el('div', 'lora-btns');
  btnRow.append(save, clear);
  sec.append(btnRow, state);
  const refresh = async () => {
    try {
      const r = await op({ op: 'status' });
      if (!r.ok) { state.textContent = r.error || ''; return; }
      const k = r.keys || {};
      state.textContent = `CivitAI: ${k.civitai ? 'set' : 'not set'} · Hugging Face: ${k.huggingface ? 'set' : 'not set'}`;
    } catch { state.textContent = ''; }
  };
  const send = async (keys: Record<string, string>) => {
    const r = await op({ op: 'set_keys', keys }).catch((err) => ({ ok: false, error: String(err) }));
    if (!r.ok) { state.textContent = r.error || 'Could not save.'; return; }
    for (const [, , input] of fields) input.value = '';
    await refresh();
  };
  save.addEventListener('click', () => {
    const keys: Record<string, string> = {};
    for (const [site, , input] of fields) if (input.value.trim()) keys[site] = input.value.trim();
    if (Object.keys(keys).length) void send(keys);
  });
  clear.addEventListener('click', () => { void send({ civitai: '', huggingface: '' }); });
  // Status needs Osmium Comfy running (Connect may come later): re-read it
  // whenever the section comes into view.
  new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) void refresh(); }).observe(sec);
  return sec;
}
