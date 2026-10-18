// Comfy Bridge for Android — TypeScript source, bundled to www/app.js by
// `npm run build:mobile-app` (from comfy-bridge/). Was hand-written JS with no
// build step; now type-checked under strict via mobile/tsconfig.json. Ports
// comfy-bridge's desktop src/renderer/app.ts to run directly in a Capacitor
// WebView:
//   - ComfyUI calls use fetch()/WebSocket directly (same approach as the
//     parent Osmium Workshop project's src/renderer/comfy-client.ts) —
//     no Electron main-process IPC bridge needed at all on mobile.
//   - Reference image comes from a plain <input type="file"> (no
//     showOpenFilePicker in a WebView).
//   - Generated images save via the Capacitor Filesystem plugin into this
//     device's Pictures/ComfyBridge folder — no output-folder picker; that's
//     a fixed, predictable location instead (see README.md for why a full
//     SAF folder picker, like the main app's DtsStorage plugin, was left
//     for later rather than staged here).
//   - Presets persist to localStorage instead of a userData JSON file.
// ---- Ambient declarations ----
// `BridgeShared` is the IIFE global produced by shared.js (bundled from
// comfy-bridge/src/renderer/shared/index.ts). `window.Capacitor.Plugins.*`
// are the native Capacitor plugins this shell talks to. Loosely typed for now
// — tighten as the shell gets real types.
interface CapacitorPlugins {
  App?: any;
  BridgeStorage?: any;
  Filesystem?: any;
  GenProgress?: any;
  NetInfo?: any;
  LocalNotifications?: any;
}
interface Window {
  Capacitor?: { Plugins?: CapacitorPlugins };
}
declare const BridgeShared: {
  buildSynthDatPrompt: (template: any, cfg: any) => any;
  parseComboValues: (nodeInfo: any, inputName: string) => string[] | null;
  buildGenInfoPanel: (src: string, onUse: (prompt: Record<string, any>, promptsOnly: boolean) => void, relPath?: string, relocate?: unknown,
    opts?: { loraTools?: any; labels?: { full: string; prompts: string }; info?: { prompt: Record<string, any>; kind: null } | null }) => HTMLElement | null;
  // shared/metadata-ui.ts + lora-lookup.ts (the Metadata tab, LoRA lookup).
  mountMetadataTab: (root: HTMLElement, deps: { tools: any; pickImage: () => Promise<string | null>; details: (src: string) => HTMLElement | null }) => void;
  mountCompareTab: (root: HTMLElement, deps: { sources: any[]; pickFile: () => Promise<string | null>; details: (src: string, relPath: string, close?: () => void) => HTMLElement | null; lazyInfo?: boolean }) => { onShow(): void };
  lookupUrl: (site: string, kind: string, q: string) => string | null;
  safeLookupLink: (url: string) => string | null;
  mergedPromptText: (prompt: Record<string, any>) => string;
  hasCategoryPrompts: (prompt: Record<string, any>) => boolean;
  // shared/prompt-import.ts: any image's generation, and the prompt splitter.
  imageMetadataTexts: (bytes: Uint8Array) => Record<string, string>;
  normalizeGeneration: (texts: Record<string, string>) => Record<string, any> | null;
  foreignSource: (prompt: Record<string, any>) => string | null;
  stripA1111Syntax: (text: string) => { text: string; loras: string[] };
  splitPromptToFields: (text: string) => Promise<Record<string, string>>;
  mergePromptFields: (values: Record<string, string>) => string;
  parseQueueResponse: (parsed: any, status: number, noun: string) => { ok: boolean; promptId?: string; error?: string };
  uploadImage: (t: any, host: string, filename: string, bytes: Uint8Array, label?: string) => Promise<{ ok: boolean; ref?: string; error?: string }>;
  queuePrompt: (t: any, host: string, prompt: any, clientId: string, opts?: any) => Promise<{ ok: boolean; promptId?: string; error?: string }>;
  pollHistory: (t: any, host: string, promptId: string, opts: any) => Promise<{ ok: boolean; value?: any; error?: string; interrupted?: boolean }>;
  extractPngTextChunks: (bytes: Uint8Array, inflate?: (d: Uint8Array) => Uint8Array) => Record<string, string>;
  bytesToBase64: (bytes: Uint8Array) => string;
  // Save scheme (shared/file-naming.ts) — the desktop Bridge's File Namer.
  characterIndex: () => Promise<{ byTag: Map<string, string>; names: string[] }>;
  recognizeCharacter: (field: string, index: { byTag: Map<string, string> }) => string;
  ratingFolder: (ratingText: string) => string;
  safeSegment: (s: string) => string;
  fileBaseName: (path: string) => string;
  joinNameParts: (parts: string[]) => string;
  nextSavePath: (backend: any, relDir: string, base: string, taken?: Set<string>) => Promise<string>;
  previewFileName: (base: string) => string;
  nextFileNumber: (backend: any) => Promise<number>;
  optionsFromDatalist: (datalist: any) => string[];
  attachPickerModal: (input: any, title: string, getOptions: () => any) => void;
  // shared/usdu.ts: the USDU panel + graph (same module as the desktop's).
  mountUsduPanel: (host: HTMLElement, opts: any) => {
    enabled: () => boolean; refresh: () => void; setEnabled: (on: boolean) => void; apply: (s: any) => void;
    activeForGeneration: () => boolean; appendToGeneration: (prompt: any) => void;
    buildImportedJob: () => Promise<{ prompt: any; imageFilename: string; imageBytes: Uint8Array; base: string } | null>;
  };
  usduSettingsFromPrompt: (prompt: any) => Record<string, any> | null;
  // shared/wd14-tag.ts: WD14 tagging panel (same module as the desktop's).
  mountWd14Panel: (host: HTMLElement, opts: any) => { refresh: () => void };
  extractWd14Tags: (record: any) => string | null;
  initTheme: (themes: any, def: any) => void;
  mountThemePicker: (opts: any) => void;
  initTagWiki: (button: HTMLElement) => void;
  mountGallerySidebar: (backend: any, label: any, opts?: any) => any;
  galleryBack: () => boolean;
  compareBack: () => boolean;
  showImageLightbox: (src: string, siblings?: () => string[], info?: (src: string, close: () => void) => HTMLElement | null, infoDeferred?: boolean) => void;
  THEMES: any;
  DEFAULT_THEME: any;
};

(function () {
  'use strict';

  function $<T extends HTMLElement = HTMLElement>(id: string): T { return document.getElementById(id) as T; }
  function errMsg(e: unknown): string { return e instanceof Error ? e.message : String(e); }

  interface GenResult {
    ok: boolean;
    error?: string;
    interrupted?: boolean;
    uploadFailed?: boolean; // the reference upload failed — offer a Retry
    imageBytes?: Uint8Array;
    saveRel?: string | null;
    pass1ImageBytes?: Uint8Array;
    pass1SaveRel?: string | null;
    upscaledImageBytes?: Uint8Array;
    upscaledSaveRel?: string | null;
  }
  type ObjectInfoResult = { ok: true; values: string[] } | { ok: false; error: string };

  // ---------------- Auto-expanding textareas ----------------
  // Prompt fields are never manually resizable — they grow with their
  // content instead. Typed input is caught by the delegated 'input'
  // listener; anywhere a textarea's .value is set programmatically
  // (restore, presets, import) must call autoGrowAll() itself since that
  // doesn't fire 'input'. Ported from desktop's src/renderer/app.ts.
  function autoGrow(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }
  function autoGrowAll() {
    document.querySelectorAll('textarea').forEach(autoGrow);
  }
  document.addEventListener('input', (ev) => {
    if (ev.target instanceof HTMLTextAreaElement) autoGrow(ev.target);
  }, true);
  // Re-fit when the text re-wraps without typing (v2.0.0, as on desktop):
  // a width change (rotating the phone) — width only, so the grow's own
  // height change can't loop — and a theme change, which swaps the font at
  // the same width: data-theme / inline theme vars, then again once its
  // fonts have loaded.
  const grownWidths = new WeakMap<Element, number>();
  const widthObserver = new ResizeObserver((entries) => {
    for (const e of entries) {
      const w = e.contentRect.width;
      if (grownWidths.get(e.target) === w) continue;
      grownWidths.set(e.target, w);
      if (w > 0) autoGrow(e.target as HTMLTextAreaElement);
    }
  });
  document.querySelectorAll('textarea').forEach((el) => widthObserver.observe(el));
  let regrowFrame = 0;
  const regrowSoon = () => { cancelAnimationFrame(regrowFrame); regrowFrame = requestAnimationFrame(autoGrowAll); };
  new MutationObserver(regrowSoon).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style'] });
  document.fonts.addEventListener('loadingdone', regrowSoon);

  const host = $<HTMLInputElement>('host');
  const token = $<HTMLInputElement>('relayToken');
  const btnConnect = $<HTMLButtonElement>('btnConnect');
  const connStatus = $('connStatus');
  const saveLocationLabel = $('saveLocationLabel');
  const btnPickFolder = $<HTMLButtonElement>('btnPickFolder');
  const btnDefaultFolder = $<HTMLButtonElement>('btnDefaultFolder');

  const skipRefImage = $<HTMLInputElement>('skipRefImage');
  const refImageSection = $('refImageSection');
  const btnPickImage = $<HTMLButtonElement>('btnPickImage');
  const refFileInput = $<HTMLInputElement>('refFileInput');
  const refFileName = $('refFileName');
  const refPreview = $<HTMLImageElement>('refPreview');

  const diffModel = $<HTMLInputElement>('diffModel'), diffModelList = $<HTMLDataListElement>('diffModelList');
  const clip = $<HTMLInputElement>('clip'), clipList = $<HTMLDataListElement>('clipList');
  const vae = $<HTMLInputElement>('vae'), vaeList = $<HTMLDataListElement>('vaeList');
  const mainLora = $<HTMLInputElement>('mainLora'), mainLoraList = $<HTMLDataListElement>('mainLoraList');
  const mainLoraStrength = $<HTMLInputElement>('mainLoraStrength');
  const btnRefreshModels = $<HTMLButtonElement>('btnRefreshModels');

  const loraStackRows = $('loraStackRows');
  const loraList = $<HTMLDataListElement>('loraList');
  const btnAddLora = $<HTMLButtonElement>('btnAddLora');

  const lliteSection = $('lliteSection');
  const lliteStrength = $<HTMLInputElement>('lliteStrength');
  const lliteStartPercent = $<HTMLInputElement>('lliteStartPercent');
  const lliteEndPercent = $<HTMLInputElement>('lliteEndPercent');
  const llitePreserveWrapper = $<HTMLInputElement>('llitePreserveWrapper');
  const resizeFit = $<HTMLSelectElement>('resizeFit');
  const resizeMethod = $<HTMLSelectElement>('resizeMethod');

  const unifiedPromptMode = $<HTMLInputElement>('unifiedPromptMode');
  const unifiedPromptRow = $('unifiedPromptRow');
  const unifiedPrompt = $<HTMLTextAreaElement>('unifiedPrompt');
  const splitFieldsGroup = $('splitFieldsGroup');
  const global_ = $<HTMLTextAreaElement>('global'), character = $<HTMLTextAreaElement>('character'), rating = $<HTMLTextAreaElement>('rating');
  const hair = $<HTMLTextAreaElement>('hair'), face = $<HTMLTextAreaElement>('face'), chest = $<HTMLTextAreaElement>('chest'), body_ = $<HTMLTextAreaElement>('body');
  const clothes = $<HTMLTextAreaElement>('clothes'), limbs = $<HTMLTextAreaElement>('limbs'), sexual = $<HTMLTextAreaElement>('sexual'), pose = $<HTMLTextAreaElement>('pose');
  const scene = $<HTMLTextAreaElement>('scene'), effects = $<HTMLTextAreaElement>('effects'), extra = $<HTMLTextAreaElement>('extra');
  const characterTrigger = $<HTMLTextAreaElement>('characterTrigger'), negative = $<HTMLTextAreaElement>('negative');

  const width = $<HTMLInputElement>('width'), height = $<HTMLInputElement>('height'), btnSwapReso = $<HTMLButtonElement>('btnSwapReso');
  const sampler = $<HTMLInputElement>('sampler'), scheduler = $<HTMLInputElement>('scheduler');
  const steps1 = $<HTMLInputElement>('steps1'), cfg1 = $<HTMLInputElement>('cfg1'), seed1 = $<HTMLInputElement>('seed1');
  const use2Pass = $<HTMLInputElement>('use2Pass'), pass2Fields = $('pass2Fields');
  const steps2 = $<HTMLInputElement>('steps2'), denoise2 = $<HTMLInputElement>('denoise2'), seed2 = $<HTMLInputElement>('seed2');

  // File saving (settings drawer's "File saving" section, shared/file-naming.ts).
  const namingAutoRating = $('namingAutoRating');
  const charModeTag = $<HTMLInputElement>('charModeTag');
  const charModeOC = $<HTMLInputElement>('charModeOC');
  const charModeCustom = $<HTMLInputElement>('charModeCustom');
  const charTagName = $<HTMLInputElement>('charTagName');
  const charCustomName = $<HTMLInputElement>('charCustomName');
  const charFolderSuggest = $('charFolderSuggest');
  const charModeNote = $('charModeNote');
  const charTagWrap = $('charTagWrap');
  const fnCharacter = $<HTMLInputElement>('fnCharacter');
  const fnLora = $<HTMLInputElement>('fnLora');
  const fnGen = $<HTMLInputElement>('fnGen');
  const fnGenParts = $('fnGenParts');
  const fnModel = $<HTMLInputElement>('fnModel');
  const fnSampler = $<HTMLInputElement>('fnSampler');
  const fnScheduler = $<HTMLInputElement>('fnScheduler');
  const fnSteps = $<HTMLInputElement>('fnSteps');
  const fnCfg = $<HTMLInputElement>('fnCfg');
  const fnSeed = $<HTMLInputElement>('fnSeed');
  const savePathPreview = $('savePathPreview');

  const upscaleEnabled = $<HTMLInputElement>('upscaleEnabled');
  const upscaleModelRow = $('upscaleModelRow');
  const upscaleModel = $<HTMLInputElement>('upscaleModel');
  const upscaleModelList = $<HTMLDataListElement>('upscaleModelList');
  const upscaleScaleBy = $<HTMLInputElement>('upscaleScaleBy');
  const btnRefreshUpscaleModels = $<HTMLButtonElement>('btnRefreshUpscaleModels');

  const btnGenerate = $<HTMLButtonElement>('btnGenerate');
  const btnStop = $<HTMLButtonElement>('btnStop');
  const btnImportGen = $<HTMLButtonElement>('btnImportGen');
  const importFileInput = $<HTMLInputElement>('importFileInput');
  const genStatus = $('genStatus');
  const livePreviewWrap = $('livePreviewWrap');
  const livePreview = $<HTMLImageElement>('livePreview');
  const previewCarousel = $('previewCarousel');
  const previewThumbs = $('previewThumbs');
  const previewEmpty = $('previewEmpty');
  const logBox = $('log');

  const promptPresetSelect = $<HTMLSelectElement>('promptPresetSelect');
  const promptPresetName = $<HTMLInputElement>('promptPresetName');
  const btnSavePromptPreset = $<HTMLButtonElement>('btnSavePromptPreset');
  const btnLoadPromptPreset = $<HTMLButtonElement>('btnLoadPromptPreset');
  const btnDeletePromptPreset = $<HTMLButtonElement>('btnDeletePromptPreset');
  const negativePresetSelect = $<HTMLSelectElement>('negativePresetSelect');
  const negativePresetName = $<HTMLInputElement>('negativePresetName');
  const btnSaveNegativePreset = $<HTMLButtonElement>('btnSaveNegativePreset');
  const btnLoadNegativePreset = $<HTMLButtonElement>('btnLoadNegativePreset');
  const btnDeleteNegativePreset = $<HTMLButtonElement>('btnDeleteNegativePreset');

  function log(msg: unknown) {
    const line = document.createElement('div');
    line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logBox.appendChild(line);
    logBox.scrollTop = logBox.scrollHeight;
  }

  // ---------------- ComfyUI terminal (real stdout/stderr) ----------------
  // Not this app's own diagnostic messages (that's logBox above) — this is
  // the actual server console output, via the same internal API ComfyUI's
  // own frontend "Logs" panel uses.
  const comfyTerminal = $('comfyTerminal');
  const btnRefreshComfyLog = $('btnRefreshComfyLog');
  const ANSI_ESCAPE_RE = /\x1b\[[0-9;]*m/g;
  function appendComfyLogEntries(entries: { m: string }[]) {
    for (const e of entries) comfyTerminal.appendChild(document.createTextNode(e.m.replace(ANSI_ESCAPE_RE, '')));
    comfyTerminal.scrollTop = comfyTerminal.scrollHeight;
  }
  btnRefreshComfyLog.addEventListener('click', async () => {
    try {
      const res = await fetch(new URL('/internal/logs/raw', getHost()));
      if (!res.ok) { log('Could not fetch ComfyUI logs (HTTP ' + res.status + ').'); return; }
      const parsed = await res.json();
      comfyTerminal.textContent = '';
      appendComfyLogEntries(parsed.entries || []);
    } catch (e) {
      log('Could not fetch ComfyUI logs: ' + errMsg(e));
    }
  });

  // Remote URL: any reachable ComfyUI base URL works as-is — LAN IP
  // (http://192.168.x.x:8188), hotspot gateway IP, or Tailscale IP/hostname
  // (http://100.x.y.z:8188 or http://mymachine.tailnet.ts.net:8188). A bare
  // IP/hostname gets http:// prepended; a trailing slash is stripped so
  // `new URL('/prompt', host)` below never produces a double-slash. The host
  // is persisted so the field survives app restarts.
  var HOST_KEY = 'comfybridge-host';
  try {
    var savedHost = localStorage.getItem(HOST_KEY);
    if (savedHost) host.value = savedHost;
    var savedToken = localStorage.getItem('comfybridge-token');
    if (savedToken) token.value = savedToken;
  } catch (e) { /* best effort */ }
  host.addEventListener('change', function () {
    try { localStorage.setItem(HOST_KEY, (host.value || '').trim()); } catch (e) { /* best effort */ }
  });
  token.addEventListener('change', function () {
    try { localStorage.setItem('comfybridge-token', (token.value || '').trim()); } catch (e) { /* best effort */ }
  });

  // Recent connections: every address that passed Test connection, newest
  // first (max 8), each with the token it connected with. Picking one fills
  // both fields and runs Test connection again, so a dropped link is one tap.
  const RECENT_HOSTS_KEY = 'comfybridge-recent-hosts';
  const RECENT_HOSTS_MAX = 8;
  const recentHostsRow = $<HTMLDivElement>('recentHostsRow');
  const recentHosts = $<HTMLSelectElement>('recentHosts');
  interface RecentHost { host: string; token: string; }
  function loadRecentHosts(): RecentHost[] {
    try {
      const list = JSON.parse(localStorage.getItem(RECENT_HOSTS_KEY) || '[]');
      return Array.isArray(list) ? list.filter((e: any) => e && typeof e.host === 'string' && e.host)
        .map((e: any) => ({ host: e.host, token: typeof e.token === 'string' ? e.token : '' })) : [];
    } catch (e) { return []; }
  }
  function saveRecentHosts(list: RecentHost[]) {
    try { localStorage.setItem(RECENT_HOSTS_KEY, JSON.stringify(list)); } catch (e) { /* best effort */ }
  }
  function renderRecentHosts() {
    const list = loadRecentHosts();
    recentHosts.innerHTML = '';
    const head = document.createElement('option');
    head.value = '';
    head.textContent = 'Recent connections…';
    recentHosts.appendChild(head);
    list.forEach((e, i) => {
      const o = document.createElement('option');
      o.value = String(i);
      o.textContent = e.host + (e.token ? '  (token)' : '');
      recentHosts.appendChild(o);
    });
    if (list.length) {
      const clear = document.createElement('option');
      clear.value = 'clear';
      clear.textContent = 'Clear list';
      recentHosts.appendChild(clear);
    }
    recentHosts.value = '';
    recentHostsRow.style.display = list.length ? '' : 'none';
  }
  function rememberHost(h: string, tok: string) {
    const list = loadRecentHosts().filter((e) => e.host.toLowerCase() !== h.toLowerCase());
    list.unshift({ host: h, token: tok });
    saveRecentHosts(list.slice(0, RECENT_HOSTS_MAX));
    renderRecentHosts();
  }
  recentHosts.addEventListener('change', () => {
    const v = recentHosts.value;
    if (v === 'clear') { saveRecentHosts([]); renderRecentHosts(); return; }
    const e = loadRecentHosts()[Number(v)];
    recentHosts.value = '';
    if (!v || !e) return;
    host.value = e.host;
    token.value = e.token;
    try {
      localStorage.setItem(HOST_KEY, e.host);
      localStorage.setItem('comfybridge-token', e.token);
    } catch (err) { /* best effort */ }
    btnConnect.click();
  });
  renderRecentHosts();

  // Find PC: scan the phone's own network for a PC sharing Comfy Bridge (the
  // Bridge relay, or Persist Comfy's runner), e.g. a laptop on this phone's
  // hotspot, whose address changes whenever the hotspot restarts. The phone's
  // addresses come from the NetInfo plugin (NetInfoPlugin.kt); each /24 it's
  // on is probed with GET /system_stats, which both servers answer with a
  // `relay` field (or a 401 naming the Comfy Bridge token). Mobile data and
  // Tailscale (100.64/10) ranges are skipped: there's nothing to find there.
  const btnFindPc = $<HTMLButtonElement>('btnFindPc');
  // PC port: what Find PC searches, the PC's sharing port (Comfy Bridge's
  // "Let the phone app use it", default 8189). Remembered on the phone.
  const findPcPort = $<HTMLInputElement>('findPcPort');
  const FIND_PC_PORT_KEY = 'comfybridge-findpc-port';
  try { const saved = localStorage.getItem(FIND_PC_PORT_KEY); if (saved) findPcPort.value = saved; } catch (e) { /* best effort */ }
  function findPcPortValue(): string {
    const n = Math.round(Number(findPcPort.value));
    return n >= 1 && n <= 65535 ? String(n) : '8189';
  }
  findPcPort.addEventListener('change', () => {
    findPcPort.value = findPcPortValue();
    try { localStorage.setItem(FIND_PC_PORT_KEY, findPcPort.value); } catch (e) { /* best effort */ }
  });
  async function phoneSubnets(): Promise<string[]> {
    const plugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.NetInfo;
    let addrs: { name: string; ip: string; prefix: number }[] = [];
    if (plugin) {
      try { addrs = ((await plugin.localAddresses()) || {}).addresses || []; } catch (e) { addrs = []; }
    }
    const out: string[] = [];
    for (const a of addrs) {
      if (!a || !a.ip || a.prefix >= 31) continue;
      if (/^(rmnet|ccmni|pdp|clat|v4-|dummy|tun)/i.test(a.name || '')) continue;
      const [o1, o2] = a.ip.split('.').map(Number);
      if (o1 === 100 && o2 >= 64 && o2 <= 127) continue;
      const base = a.ip.split('.').slice(0, 3).join('.');
      if (!out.includes(base)) out.push(base);
    }
    return out;
  }
  btnFindPc.addEventListener('click', async () => {
    connStatus.style.display = 'block';
    connStatus.style.color = '';
    // Native sockets only: a WebView fetch scan can't work. Chromium keeps
    // ~32 connects in flight per page and a probe to a silent address holds
    // its slot for the OS's whole retry time, so the queue jams and the right
    // address times out unprobed (seen in testing).
    const plugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.NetInfo;
    if (!plugin || typeof plugin.findBridges !== 'function') {
      connStatus.textContent = 'Find PC needs the Android app (this version can\'t search the network). Type the PC\'s address instead.';
      return;
    }
    const subnets = await phoneSubnets();
    if (!subnets.length) {
      connStatus.textContent = 'This phone isn\'t on a Wi-Fi network or hotspot that Find PC can search. Turn on the hotspot (or join the PC\'s Wi-Fi) and try again.';
      return;
    }
    // The PC port box (not the address box, whose default is ComfyUI's 8188).
    const port = findPcPortValue();
    const where = subnets.map((b) => b + '.x').join(', ');
    btnFindPc.disabled = true;
    connStatus.textContent = 'Searching ' + where + ' (port ' + port + ')…';
    let found: string[] = [];
    try {
      found =((await plugin.findBridges({ subnets, ports: [Number(port)] })) || {}).found || [];
    } catch (err) {
      connStatus.textContent = 'Find PC failed: ' + errMsg(err);
      return;
    } finally {
      btnFindPc.disabled = false;
    }
    if (!found.length) {
      connStatus.textContent = 'No PC found on ' + subnets.map((b) => b + '.x').join(', ') + '. On the PC: Comfy Bridge\'s "Let the phone app use it" must be on, and Windows Firewall must allow it on this network (a phone hotspot usually counts as Public).';
      return;
    }
    // The others go into Recent connections; the first is filled in and tested
    // (which also adds it to the list when it connects).
    const tok = (token.value || '').trim();
    for (const h of found.slice(1).reverse()) rememberHost(h, tok);
    host.value = found[0];
    try { localStorage.setItem(HOST_KEY, found[0]); } catch (e) { /* best effort */ }
    btnConnect.click();
  });

  function getHost(): string {
    let h = (host.value || '').trim() || 'http://127.0.0.1:8188';
    if (!/^https?:\/\//i.test(h)) h = 'http://' + h;
    return h.replace(/\/+$/, '');
  }

  function fillDatalist(el: HTMLDataListElement, values: string[]) {
    el.innerHTML = '';
    for (const v of values) {
      const opt = document.createElement('option');
      opt.value = v;
      el.appendChild(opt);
    }
  }

  function fieldValue(el: HTMLInputElement | HTMLTextAreaElement) { return (el.value || '').trim(); }

  // ---------------- Save location: SAF folder or Documents fallback ----------------
  // "Pick folder…" opens Android's Storage Access Framework picker (any
  // folder on the device) via the BridgeStorage native plugin — same
  // approach as the parent app's DtsStorage plugin. The grant persists
  // across restarts (re-applied at boot via setActiveRoot); "Use default"
  // clears it back to Documents via the Filesystem plugin. Generations save
  // directly into the active root — the app never creates its own subfolder;
  // subfolders are only ever READ (gallery groups by them, numbering counts
  // the root's own files).
  var SAF_KEY = 'comfybridge-saf-folder';
  function safPlugin() {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.BridgeStorage;
  }
  let safRoot: { uri: string; name: string } | null = null; // set once a SAF folder is picked and active
  function saveLocationLabelText(): string {
    return safRoot ? safRoot.name : 'Documents';
  }
  function refreshSaveLocationLabel(): void { saveLocationLabel.textContent = saveLocationLabelText(); }
  async function initSafRoot(): Promise<void> {
    refreshSaveLocationLabel();
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(SAF_KEY) || 'null'); } catch (e) { /* no saved folder */ }
    if (!saved || !saved.uri || !safPlugin()) return;
    try {
      const res = await safPlugin().setActiveRoot({ uri: saved.uri });
      safRoot = { uri: saved.uri, name: (res && res.name) || saved.name || 'folder' };
    } catch (e) {
      try { localStorage.removeItem(SAF_KEY); } catch (e2) { /* best effort */ }
      safRoot = null;
      log('Saved folder permission lost — pick it again or keep the default.');
    }
    refreshSaveLocationLabel();
  }
  btnPickFolder.addEventListener('click', async () => {
    if (!safPlugin()) { log('Folder picker not available in this build.'); return; }
    try {
      const res = await safPlugin().pickFolder();
      safRoot = { uri: res.uri, name: res.name || 'folder' };
      try { localStorage.setItem(SAF_KEY, JSON.stringify(safRoot)); } catch (e) { /* best effort */ }
      refreshSaveLocationLabel();
      log('Save location: ' + saveLocationLabelText());
    } catch (e) {
      if (errMsg(e) !== 'User cancelled') log('Folder pick failed: ' + errMsg(e));
    }
  });
  btnDefaultFolder.addEventListener('click', () => {
    safRoot = null;
    try { localStorage.removeItem(SAF_KEY); } catch (e) { /* best effort */ }
    refreshSaveLocationLabel();
    log('Save location: ' + saveLocationLabelText());
  });

  function fsPlugin() {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem;
  }

  // ---------------- Generation progress notification ----------------
  // Posts/updates a single system notification (same id every time, so
  // Android replaces it in place) showing which pass is running and its
  // step count — so you can back out of the app during a long generation
  // and still see progress from the notification shade.
  //
  // The actual notification is drawn by a small custom native plugin
  // (GenProgressPlugin.kt) via NotificationCompat.Builder, NOT
  // @capacitor/local-notifications' own schedule() — that plugin's schema
  // has no `progress` field at all (no determinate-bar support), and every
  // schedule() call re-alerts (sound/vibration/heads-up) even for an
  // in-place update, which read as a fresh notification firing every pass
  // instead of one continuous bar. @capacitor/local-notifications is still
  // used for the one thing it's actually good for here: the Android 13+
  // POST_NOTIFICATIONS permission prompt.
  function notifPermPlugin() {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications;
  }
  function genProgressPlugin() {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.GenProgress;
  }
  // Step progress can arrive many times a second — posting a native
  // notification update on every single one is wasted work and risks
  // Android's own per-app notification rate limit. Leading+trailing
  // throttle: the first update in a burst posts immediately, later ones
  // in the same window collapse into one trailing post.
  const GEN_NOTIF_THROTTLE_MS = 700;
  let genNotifPermissionAsked = false;
  let genNotifCancelListenerReady = false;
  let genPassCount = 1;
  let genTotalStages = 1;
  let genStageIndex = 1;
  let genLastStepValue = -1;
  let genNotifLastSentAt = 0;
  let genNotifTrailingTimer: ReturnType<typeof setTimeout> | null = null;
  let genNotifPendingArgs: Record<string, unknown> | null = null;

  async function ensureGenNotifReady(): Promise<boolean> {
    const LocalNotifications = notifPermPlugin();
    const GenProgress = genProgressPlugin();
    if (!LocalNotifications || !GenProgress) return false;
    try {
      if (!genNotifPermissionAsked) {
        genNotifPermissionAsked = true;
        let perm = await LocalNotifications.checkPermissions();
        if (perm.display !== 'granted') perm = await LocalNotifications.requestPermissions();
        if (perm.display !== 'granted') return false;
      }
      if (!genNotifCancelListenerReady) {
        genNotifCancelListenerReady = true;
        GenProgress.addListener('cancelRequested', () => stopGeneration());
      }
      return true;
    } catch (e) { return false; }
  }

  function genStageLabel(idx: number) {
    return idx <= genPassCount ? (idx + 'Pass') : 'Upscaling';
  }

  async function postGenNotification(args: Record<string, unknown> | null) {
    const GenProgress = genProgressPlugin();
    if (!GenProgress) return;
    try { await GenProgress.update(args); } catch (e) { /* best effort — notifications are a nice-to-have, never block generation */ }
  }

  function queueGenNotification(args: Record<string, unknown>) {
    genNotifPendingArgs = args;
    const now = Date.now();
    const elapsed = now - genNotifLastSentAt;
    if (elapsed >= GEN_NOTIF_THROTTLE_MS) {
      genNotifLastSentAt = now;
      postGenNotification(args);
    } else if (!genNotifTrailingTimer) {
      genNotifTrailingTimer = setTimeout(() => {
        genNotifTrailingTimer = null;
        genNotifLastSentAt = Date.now();
        postGenNotification(genNotifPendingArgs);
      }, GEN_NOTIF_THROTTLE_MS - elapsed);
    }
  }

  // Bypasses the throttle (and cancels any pending trailing update) — for
  // the completion/error/stopped states, which must land immediately and
  // must not get overwritten by a stale in-flight progress update.
  async function finalizeGenNotification(title: string, body: string) {
    if (genNotifTrailingTimer) { clearTimeout(genNotifTrailingTimer); genNotifTrailingTimer = null; }
    const GenProgress = genProgressPlugin();
    if (!GenProgress) return;
    try { await GenProgress.finish({ title: title, body: body }); } catch (e) { /* best effort */ }
  }

  // Stage counts come from the job's own snapshot (a queued job may have been
  // set up with different 2-Pass/upscale settings than the form shows now).
  function resetGenNotificationState(passCount: number, totalStages: number) {
    genPassCount = passCount;
    genTotalStages = totalStages;
    genStageIndex = 1;
    genLastStepValue = -1;
  }

  // Shared by both websocket progress message shapes ('progress' and the
  // per-node 'progress_state' fallback) — a step COUNT GOING BACKWARDS is
  // how a new pass's sampler is detected starting, without needing to map
  // ComfyUI's internal node ids back to "which pass is this". The upscale
  // stage (if any) never fires step progress at all — ImageUpscaleWithModel
  // runs in one shot, not iteratively — so it's inferred separately, right
  // when the last pass's own progress reaches 100%.
  function onGenStep(value: number, max: number) {
    if (typeof value !== 'number' || typeof max !== 'number' || !max) return;
    if (genLastStepValue >= 0 && value < genLastStepValue && genStageIndex < genPassCount) genStageIndex++;
    genLastStepValue = value;
    genStatus.textContent = 'Generating… step ' + value + '/' + max + queueNote();
    queueGenNotification({
      title: genStageLabel(genStageIndex) + ' (' + genStageIndex + '/' + genTotalStages + ')',
      body: value + '/' + max, progress: value, max: max, indeterminate: false, showCancel: true
    });
    if (genStageIndex === genPassCount && value >= max && genTotalStages > genPassCount) {
      queueGenNotification({
        title: 'Upscaling (' + genTotalStages + '/' + genTotalStages + ')',
        body: 'Finishing…', progress: 0, max: 0, indeterminate: true, showCancel: true
      });
    }
  }

  // Public shared storage root for saves. NOTE: 'DIRECTORY_PICTURES' is not
  // a valid @capacitor/filesystem Directory (valid: DOCUMENTS, DATA,
  // LIBRARY, CACHE, EXTERNAL, EXTERNAL_STORAGE, ...) — passing it made every
  // writeFile/readFile reject, so nothing ever saved. DOCUMENTS is public,
  // survives uninstall, needs no permission for the app's own files on
  // Android 11+, and is visible in file manager apps.
  const FS_DIR = 'DOCUMENTS';

  // ---------------- Shared UI + mobile storage backend ----------------
  // Gallery sidebar, model picker modal, and image lightbox live in the
  // shared modules (src/renderer/shared/*, bundled to shared.js) so desktop
  // and mobile run byte-identical UI. Only the storage backend below is
  // mobile-specific (SAF folder or Documents fallback) — desktop injects its
  // own IPC-backed one instead, and mobile-only features (SAF picker,
  // Documents fallback, direct-fetch ComfyUI) never appear in the desktop
  // bundle.
  function mobileBackend() {
    if (safRoot && safPlugin()) {
      const S = safPlugin();
      return {
        async listDir(relDir: string) {
          const res = await S.listEntries({ path: relDir });
          return ((res && res.files) || []).map((f: { name: string; kind: string; lastModified?: number }) => ({ name: f.name, kind: f.kind, mtime: Number(f.lastModified) || 0 }));
        },
        async readImage(relPath: string) {
          try {
            const r = await S.getFileBytes({ path: relPath });
            return 'data:' + (r.mimeType || 'image/png') + ';base64,' + r.base64;
          } catch (e) { return null; }
        },
        async writeImage(relPath: string, base64: string, mimeType: string) {
          await S.writeFileBytes({ path: relPath, base64, mimeType });
        }
      };
    }
    const Filesystem = fsPlugin();
    return {
      async listDir(relDir: string) {
        if (!Filesystem) throw new Error('Filesystem plugin not available.');
        const res = await Filesystem.readdir({ path: relDir, directory: FS_DIR });
        return ((res && res.files) || []).map((f: { name: string; type: string; mtime?: number }) => ({ name: f.name, kind: f.type, mtime: f.mtime || 0 }));
      },
      async readImage(relPath: string) {
        if (!Filesystem) return null;
        try {
          const r = await Filesystem.readFile({ path: relPath, directory: FS_DIR });
          return 'data:image/png;base64,' + r.data;
        } catch (e) { return null; }
      },
      async writeImage(relPath: string, base64: string) {
        if (!Filesystem) throw new Error('Filesystem plugin not available.');
        await Filesystem.writeFile({ path: relPath, data: base64, directory: FS_DIR, recursive: true });
      }
    };
  }
  // ---------------- PC gallery over the relay / share server ----------------
  // The phone can browse the PC's picked output folder when it is connected
  // to it over Tailscale/LAN: the relay (or, with Persist Comfy, the runner's
  // own ShareServer) serves /internal/gallery/list + /read + /thumb. The
  // grid loads runner-made small thumbnails and only an OPENED image moves
  // at full size (the data saver the user wanted). Not writable — saves on
  // the PC are the PC's business.
  //
  // Retries: the PC answers in milliseconds, so a request that's silent for a
  // few seconds is lost on the link (a hotspot drops replies in bursts — see
  // the Phone-VPN-Swallows-Hotspot-Replies pitfall), and a fresh request
  // usually gets through. Only lost/silent requests retry; an HTTP answer
  // (even an error) is returned as-is. timeoutMs is silence, not total time
  // (comfyTransport re-arms it on download progress).
  async function pcRequest(path: string, timeoutMs: number, tries: number) {
    let lastErr: unknown;
    for (let i = 0; i < tries; i++) {
      try {
        return await comfyTransport().request(getHost(), path, { timeoutMs });
      } catch (err) {
        lastErr = err;
        if (!/^(no response for|network error)/.test(errMsg(err))) throw err;
      }
    }
    throw lastErr;
  }
  async function pcRequestPost(path: string, body: Uint8Array, tries: number) {
    let lastErr: unknown;
    for (let i = 0; i < tries; i++) {
      try {
        return await comfyTransport().request(getHost(), path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, timeoutMs: 15000 });
      } catch (err) {
        lastErr = err;
        if (!/^(no response for|network error)/.test(errMsg(err))) throw err;
      }
    }
    throw lastErr;
  }
  function pcGalleryBackend() {
    return {
      async listDir(relDir: string) {
        try {
          const res = await pcRequest('/internal/gallery/list?dir=' + encodeURIComponent(relDir || ''), 6000, 3);
          const parsed = JSON.parse(new TextDecoder().decode(res.body) || '{}');
          if (res.status !== 200 || !parsed.ok) throw new Error((parsed && parsed.error && parsed.error.message) || ('HTTP ' + res.status));
          return (parsed.entries || []).map((e: any) => ({ name: e.name, kind: e.kind, mtime: Number(e.mtime) || 0 }));
        } catch (err) {
          // userFacing: the shared gallery shows this reason instead of its
          // generic "pick an output folder" hint.
          const e = new Error(isLikelyCorsFailure(err) ? corsHint() : errMsg(err)) as Error & { userFacing?: boolean };
          e.userFacing = true;
          throw e;
        }
      },
      async readImage(relPath: string) {
        const res = await pcRequest('/internal/gallery/read?path=' + encodeURIComponent(relPath || ''), 8000, 3);
        if (res.status !== 200) throw new Error('Fetching the image failed (HTTP ' + res.status + ').');
        // The relay answers with the file's own content type.
        const body = new Uint8Array(res.body);
        const mime = sniffImageMime(body) || 'image/png';
        return 'data:' + mime + ';base64,' + BridgeShared.bytesToBase64(body);
      },
      async writeImage() {
        throw new Error('The PC folder is read-only from the phone.');
      }
    };
  }
  function pcThumbSrc(rel: string): Promise<string | null> {
    return (async () => {
      const res = await pcRequest('/internal/gallery/thumb?path=' + encodeURIComponent(rel || '') + '&side=256', 6000, 2);
      if (res.status !== 200) return null;
      const body = new Uint8Array(res.body);
      const mime = sniffImageMime(body) || 'image/jpeg';
      return 'data:' + mime + ';base64,' + BridgeShared.bytesToBase64(body);
    })().catch(() => null);
  }
  function pcFullSrc(rel: string): Promise<string | null> {
    return (async () => {
      return await pcGalleryBackend().readImage(rel);
    })().catch(() => null);
  }
  BridgeShared.mountGallerySidebar(mobileBackend, saveLocationLabelText, {
    // Folder navigation with the path listing at the top (v2.0.0: the
    // user's call — the breadcrumb row like the desktop's, so the phone is
    // no longer stuck inside e.g. the explicit folder).
    navigable: true,
    // Two sources: the phone's save location, and the PC's picked folder
    // over the network (thumb grid, full image on open).
    sources: [
      { label: 'Phone', backend: () => mobileBackend() },
      { label: 'PC', backend: () => pcGalleryBackend(), thumbSrc: pcThumbSrc, fullSrc: pcFullSrc }
    ],
    // Generation parameters of opened images (the panel is shared with the
    // desktop); behind an "Info" button on the phone's narrow screen.
    imageInfo: (src: string, close: () => void, relPath: string) => BridgeShared.buildGenInfoPanel(src, (prompt: Record<string, any>, promptsOnly: boolean) => {
      close();
      void useGeneration(prompt, promptsOnly, 'a gallery image');
    }, relPath, undefined, { loraTools }),
    lazyInfo: true
  });

  // ---------------- File Namer (shared/file-naming.ts) ----------------
  // Where each generation lands inside the save location, mirroring the
  // desktop Bridge's scheme: [rating/][character/][Upscaled/]<parts>_<N>_.png.
  // The rating folder is automatic (the prompt's rating text); the character
  // folder and the filename parts are the user's. The server-side copy is
  // the host's own SaveImage (its dummy detector names it the same automatic
  // way); the phone's gallery copy is named HERE. The host's returned saveRel
  // is no longer used to place the mirror — the phone's own naming is.
  function joinRel(...parts: string[]): string { return parts.filter(Boolean).join('/'); }
  type CharMode = 'tag' | 'oc' | 'custom';
  function charMode(): CharMode { return charModeOC.checked ? 'oc' : charModeCustom.checked ? 'custom' : 'tag'; }
  // The text the rating folder is read from: the Rating field, or the unified
  // prompt in unified mode (it has no separate Rating field).
  function ratingText(): string { return unifiedPromptMode.checked ? unifiedPrompt.value : rating.value; }
  // fieldValue() is defined near the presets.

  interface SaveNaming { relDir: string; base: string; rating: string; character: string; recognized: string; }

  async function currentNaming(): Promise<SaveNaming> {
    // Only pull the ~25MB Danbooru tag list when there is actually a
    // Character field to match against (the same startup-shaped guard as the
    // desktop's — see the Startup-Eager-Data-Parse-Blocks-Input pitfall).
    const characterField = fieldValue(character);
    let recognized = '';
    if (characterField) {
      try { recognized = BridgeShared.safeSegment(BridgeShared.recognizeCharacter(characterField, await BridgeShared.characterIndex())); } catch (e) { /* tag list unavailable */ }
    }
    const mode = charMode();
    const characterName = mode === 'oc' ? 'OC'
      : mode === 'custom' ? BridgeShared.safeSegment(charCustomName.value)
      : BridgeShared.safeSegment(charTagName.value) || recognized;
    const ratingName = BridgeShared.ratingFolder(ratingText());
    const lora = mainLora.value && mainLora.value !== 'None' && mainLora.value !== 'Anima-n' ? BridgeShared.fileBaseName(mainLora.value) : '';
    const cfgNum = parseFloat(cfg1.value);
    const base = BridgeShared.joinNameParts([
      fnCharacter.checked ? characterName : '',
      fnLora.checked ? lora : '',
      fnGen.checked && fnModel.checked ? BridgeShared.fileBaseName(diffModel.value) : '',
      fnGen.checked && fnSampler.checked ? sampler.value : '',
      fnGen.checked && fnScheduler.checked ? scheduler.value : '',
      fnGen.checked && fnSteps.checked && steps1.value ? 'steps' + steps1.value : '',
      fnGen.checked && fnCfg.checked && !isNaN(cfgNum) ? 'cfg' + parseFloat(cfgNum.toFixed(2)) : '',
      fnGen.checked && fnSeed.checked && seed1.value ? 'seed' + seed1.value : ''
    ]);
    return { relDir: joinRel(ratingName, characterName), base, rating: ratingName, character: characterName, recognized };
  }

  function applyNamingUI(): void {
    const mode = charMode();
    charTagWrap.style.display = mode === 'tag' ? '' : 'none';
    charCustomName.style.display = mode === 'custom' ? '' : 'none';
    fnGenParts.style.display = fnGen.checked ? '' : 'none';
  }

  let namingToken = 0;
  async function refreshSavePreview(): Promise<void> {
    const tok = ++namingToken;
    const n = await currentNaming();
    if (tok !== namingToken) return;

    namingAutoRating.textContent = n.rating
      ? 'Rating: ' + n.rating + ' (the ' + (unifiedPromptMode.checked ? 'prompt' : 'Rating field') + ' says ' + n.rating + ')'
      : 'Rating: none, so images go straight into the save location (the ' + (unifiedPromptMode.checked ? 'prompt' : 'Rating field') + ' says neither explicit nor safe)';

    const mode = charMode();
    charTagName.placeholder = n.recognized ? n.recognized + ' (recognized)' : 'Type to search Danbooru characters';
    charModeNote.textContent = mode === 'oc' ? 'Original characters all go in one OC folder.'
      : mode === 'custom' ? (n.character ? '' : 'Empty: no character folder.')
      : charTagName.value.trim() ? ''
      : n.recognized ? 'Empty: uses the character recognized in the Character field.'
      : 'No character recognized in the Character field, so no character folder.';

    savePathPreview.innerHTML = '';
    const head = document.createElement('div');
    head.className = 'naming-preview-head';
    head.textContent = 'Saves to';
    savePathPreview.appendChild(head);
    const line = (text: string, cls: string, depth: number): void => {
      const el = document.createElement('div');
      el.className = 'naming-preview-line ' + cls;
      el.style.paddingLeft = (depth * 14) + 'px';
      el.textContent = (depth ? '└ ' : '') + text;
      savePathPreview.appendChild(el);
    };
    let depth = 0;
    line(saveLocationLabelText(), 'root', depth++);
    if (n.rating) line(n.rating, 'auto', depth++);
    if (n.character) line(n.character, 'user', depth++);
    line(BridgeShared.previewFileName(n.base), 'file', depth);
    if ((upscaleEnabled.checked && upscaleModel.value.trim()) || usdu.activeForGeneration()) {
      const up = document.createElement('div');
      up.className = 'muted small';
      up.textContent = 'Upscaled copies: the same name in an Upscaled folder next to it.';
      savePathPreview.appendChild(up);
    }
  }
  let namingTimer: ReturnType<typeof setTimeout> | null = null;
  function scheduleNamingUI(): void {
    if (namingTimer) clearTimeout(namingTimer);
    namingTimer = setTimeout(() => { applyNamingUI(); void refreshSavePreview(); }, 120);
  }
  // Any field can change the preview (character, rating text, sampler, seed…).
  document.addEventListener('input', scheduleNamingUI, true);
  document.addEventListener('change', scheduleNamingUI, true);

  // Danbooru character suggestions under the tag-list field.
  function hideCharSuggest(): void { charFolderSuggest.hidden = true; charFolderSuggest.innerHTML = ''; }
  charTagName.addEventListener('input', async () => {
    const q = charTagName.value.trim().toLowerCase();
    if (q.length < 2) { hideCharSuggest(); return; }
    let names: string[];
    try { names = (await BridgeShared.characterIndex()).names; } catch (e) { return; }
    if (charTagName.value.trim().toLowerCase() !== q) return;
    const starts: string[] = [];
    const contains: string[] = [];
    for (const nm of names) {
      const l = nm.toLowerCase();
      if (l.startsWith(q)) starts.push(nm);
      else if (l.includes(q)) contains.push(nm);
      if (starts.length >= 10) break;
    }
    const picks = [...starts, ...contains].slice(0, 10);
    charFolderSuggest.innerHTML = '';
    if (!picks.length || (picks.length === 1 && picks[0] === charTagName.value)) { hideCharSuggest(); return; }
    for (const nm of picks) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'naming-suggest-item';
      b.textContent = nm;
      // mousedown (not click) so the input keeps its keyboard focus on touch;
      // Android's tap fires the synthesized mouse sequence like desktop.
      b.addEventListener('mousedown', (ev) => {
        ev.preventDefault();
        charTagName.value = nm;
        hideCharSuggest();
        charTagName.dispatchEvent(new Event('change', { bubbles: true }));
      });
      charFolderSuggest.appendChild(b);
    }
    charFolderSuggest.hidden = false;
  });
  charTagName.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') hideCharSuggest();
    else if (ev.key === 'Enter' && !charFolderSuggest.hidden) {
      const first = charFolderSuggest.querySelector<HTMLButtonElement>('.naming-suggest-item');
      if (first) { ev.preventDefault(); first.dispatchEvent(new MouseEvent('mousedown')); }
    }
  });
  charTagName.addEventListener('blur', hideCharSuggest);

  // restoreUiState() already ran (or will, in Init) without firing 'change'.
  applyNamingUI();
  setTimeout(() => { void refreshSavePreview(); }, 0);

  // ---------------- ComfyUI bridge (fetch/WebSocket, no IPC) ----------------

  function isLikelyCorsFailure(err: unknown) { return err instanceof TypeError; }
  // A CORS block and a genuine network failure both surface as the same
  // generic TypeError from fetch(), and loading the address in the phone's
  // browser proves nothing about the app — a top-level navigation needs no
  // CORS headers and no mixed-content allowance, while a fetch() from this
  // app's https://localhost WebView needs both. So the hint has to name all
  // three server-side requirements, not just --listen.
  function corsHint(): string { return ' — could not reach it from inside the app (this can happen even when the same address loads in the phone browser). Make sure: (1) ComfyUI was started with --listen 0.0.0.0 --enable-cors-header (it already listens on 8188 by default), (2) Windows Firewall allows inbound TCP 8188 on this network (Private/Domain for LAN, and re-allow if a hotspot flips it to Public), (3) Tailscale is connected on BOTH devices if using a 100.x address.'; }

  // A combo widget's option list sits in one of two shapes depending on
  // which ComfyUI schema version the node reporting it was last touched
  // under: classic `[[...options], {meta}]` (element 0 IS the array — most
  // nodes, including UNETLoader/CLIPLoader/VAELoader/KSampler as of current
  // ComfyUI) or the newer typed-widget `["COMBO", {options:[...], ...}]`
  // (element 0 is the literal string "COMBO", the real list is nested at
  // element 1's `options`). UpscaleModelLoader reports the newer shape even
  // on a ComfyUI build where every other node here still uses the classic
  // one, confirmed by querying both from the same running instance — so a
  // parser that only understood the classic shape silently found nothing
  // for upscale models specifically while every other dropdown kept
  // working, on any host, dev machine included.
  // A wrong port or an address that silently drops packets used to leave this
  // fetch (and Test connection) hanging with no answer at all. 45s leaves room
  // for a cold start of a PC's Local ComfyUI behind the Bridge (~25s).
  const OBJECT_INFO_TIMEOUT_MS = 45000;
  // The same 45s budget, as three tries (8s, 12s, 25s): a reply lost on a
  // flaky link gets a fresh request instead of a long wait and an error. A
  // refused connection (TypeError) also retries once the try's time is up.
  const OBJECT_INFO_TRIES_MS = [8000, 12000, 25000];
  async function comfyGetObjectInfo(classType: string, inputName: string): Promise<ObjectInfoResult> {
    let lastErr: unknown = null;
    for (const tryMs of OBJECT_INFO_TRIES_MS) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), tryMs);
      const t0 = Date.now();
      try {
        const res = await fetch(new URL('/object_info/' + encodeURIComponent(classType), getHost()), { signal: ctrl.signal });
        if (!res.ok) return { ok: false, error: 'ComfyUI returned HTTP ' + res.status + ' looking up ' + classType + '.' };
        const parsed = await res.json();
        const values = BridgeShared.parseComboValues(parsed[classType], inputName);
        if (!Array.isArray(values)) return { ok: false, error: 'Could not find "' + inputName + '" on ' + classType + '.' };
        return { ok: true, values };
      } catch (err) {
        lastErr = ctrl.signal.aborted ? null : err;
        // A fast failure (refused, unreachable): pause up to 2s so the three
        // tries don't burn through in a second.
        if (!ctrl.signal.aborted) await new Promise((r) => setTimeout(r, Math.max(0, Math.min(2000, tryMs - (Date.now() - t0)))));
      } finally {
        clearTimeout(timer);
      }
    }
    if (lastErr === null) {
      return { ok: false, error: 'No answer from ' + getHost() + ' after ' + (OBJECT_INFO_TIMEOUT_MS / 1000) + 's. Check the address and port: '
        + 'a ComfyUI server uses 8188, and a PC sharing Comfy Bridge\'s Osmium Comfy uses 8189 (not 8190, which only works on that PC).' };
    }
    return { ok: false, error: 'Could not reach ComfyUI at ' + getHost() + (isLikelyCorsFailure(lastErr) ? corsHint() : ' (' + errMsg(lastErr) + ')') };
  }

  // Set for the WHOLE run — including the reference upload, before any prompt
  // exists — so Stop can cancel it at any stage. `abort` kills in-flight
  // requests (a stuck upload otherwise left Stop with nothing to interrupt:
  // ComfyUI only logged "Global interrupt (no prompt_id specified)").
  let activeGen: { cancelled: boolean; abort: AbortController } | null = null;

  async function comfyStopGeneration(): Promise<void> {
    if (activeGen) { activeGen.cancelled = true; activeGen.abort.abort(); }
    try { await fetch(new URL('/interrupt', getHost()), { method: 'POST' }); } catch (e) { /* best effort */ }
  }

  async function fetchViewImage(image: { filename: string; subfolder?: string; type?: string }) {    const qs = new URLSearchParams({ filename: image.filename, subfolder: image.subfolder || '', type: image.type || 'output' });
    const res = await fetch(new URL('/view?' + qs.toString(), getHost()));
    if (!res.ok) throw new Error('ComfyUI returned HTTP ' + res.status + ' fetching the generated image.');
    return new Uint8Array(await res.arrayBuffer());
  }

  // /history image entry -> relative save path (the File Namer's scheme:
  // rating folder / character folder / lora tail) kept inside the chosen
  // save location — mirrors the desktop fix so the naming scheme survives
  // the mirror copy instead of being flattened to "N.png" at the root.
  // Same defensive sanitization as the desktop main process: this string
  // comes from a remote server, so no `..`, no drive anchors.
  function sanitizeRel(image: { subfolder?: string; filename?: string }): string | null {
    const raw = ((image.subfolder || '').replace(/\\/g, '/').replace(/\/+/g, '/') + '/' +
      (image.filename || '').replace(/\\/g, '/'));
    const parts = raw.split('/').filter((p) => p && p !== '.' && p !== '..' && !/^[A-Za-z]:$/.test(p));
    return parts.length ? parts.join('/') : null;
  }

  // Browser transport for the shared ComfyUI client (BridgeShared.*, bundled
  // from comfy-core.ts) — the mobile counterpart of the desktop Node transport.
  // XHR (not fetch) so an upload can report progress. `init.timeoutMs` is
  // honored as a STALL timeout — reset on every upload progress event — so a
  // slow-but-moving upload survives while a dead one fails instead of hanging
  // forever (fetch ignored timeoutMs entirely). `signal` aborts (Stop).
  function comfyTransport(signal?: AbortSignal, onUploadProgress?: (loaded: number, total: number) => void) {
    return {
      request: (host: string, path: string, init: any = {}) => new Promise<{ status: number; body: Uint8Array }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(init.method || 'GET', new URL(path, host).toString());
        xhr.responseType = 'arraybuffer';
        // Content-Length is a forbidden header for XHR; the browser sets it.
        for (const [k, v] of Object.entries(init.headers || {})) {
          if (k.toLowerCase() !== 'content-length') xhr.setRequestHeader(k, String(v));
        }
        try { const tok = (token.value || '').trim(); if (tok) xhr.setRequestHeader('X-Osmium-Token', tok); } catch (e) { /* best effort */ }
        let stallTimer: ReturnType<typeof setTimeout> | undefined;
        let lastLoaded = 0, lastTotal = 0;
        const armStall = (ms: number, after: string) => {
          if (!init.timeoutMs) return;
          clearTimeout(stallTimer);
          stallTimer = setTimeout(() => {
            xhr.abort();
            const kb = (n: number) => Math.round(n / 1024).toLocaleString() + ' KB';
            const sent = lastTotal > 0 ? ` (${kb(lastLoaded)} / ${kb(lastTotal)} sent)` : '';
            reject(new Error('no response for ' + Math.round(ms / 1000) + 's ' + (after || '') + sent));
          }, ms);
        };
        const onAbort = () => { xhr.abort(); reject(new DOMException('Stopped', 'AbortError')); };
        const done = () => { clearTimeout(stallTimer); signal?.removeEventListener('abort', onAbort); };
        if (signal?.aborted) { reject(new DOMException('Stopped', 'AbortError')); return; }
        signal?.addEventListener('abort', onAbort, { once: true });
        if (onUploadProgress && init.body) {
          xhr.upload.onprogress = (ev) => {
            lastLoaded = ev.loaded;
            lastTotal = ev.total;
            if (ev.lengthComputable) onUploadProgress(ev.loaded, ev.total);
            // Once the full request has been handed to the network the failure
            // mode changes: bytes aren't still moving, the response is just
            // late or lost (a receiver that stops reading, a relayed link).
            // Concluding at the normal 20s made every attempt abort and the
            // whole ~1MB upload restart, which failed the same way each time.
            // Waiting 3x costs nothing and lets a slow answer through.
            const full = ev.lengthComputable && ev.total > 0 && ev.loaded === ev.total;
            armStall(full ? init.timeoutMs * 3 : init.timeoutMs, full ? 'after the full request' : '');
          };
        }
        // Downloads: the stall timer measures silence, not the total time, so
        // a big image arriving slowly isn't cut off while bytes still flow.
        xhr.onprogress = () => armStall(init.timeoutMs, 'while downloading');
        xhr.onload = () => { done(); resolve({ status: xhr.status, body: new Uint8Array(xhr.response || new ArrayBuffer(0)) }); };
        xhr.onerror = () => { done(); reject(new Error('network error')); };
        armStall(init.timeoutMs, '');
        xhr.send(init.body ?? null);
      })
    };
  }

  async function comfyQueueAndFetch(imageFilename: string | null, imageBytes: Uint8Array | null, prompt: Record<string, any>): Promise<GenResult> {
    let ws: WebSocket | null = null;
    const gen = { cancelled: false, abort: new AbortController() };
    activeGen = gen;
    const stopped: GenResult = { ok: false, error: 'Generation stopped.', interrupted: true };
    const t = comfyTransport(gen.abort.signal);
    try {
      if (imageBytes && prompt['239']) {
        // Progress line + an always-available "Retry upload": it abandons the
        // current attempt and force-starts a fresh upload (the run itself
        // continues; Stop still cancels everything).
        const kb = (n: number) => Math.round(n / 1024).toLocaleString() + ' KB';
        const upText = document.createElement('span');
        const retryBtn = document.createElement('button');
        retryBtn.type = 'button';
        retryBtn.className = 'gen-retry-btn';
        retryBtn.textContent = '↻ Retry upload';
        genStatus.textContent = '';
        genStatus.append(upText, retryBtn);
        let upload: { ok: boolean; ref?: string; error?: string } | null = null;
        for (let attemptNo = 1; !upload; attemptNo++) {
          const attempt = new AbortController();
          const onGenAbort = () => attempt.abort();
          gen.abort.signal.addEventListener('abort', onGenAbort, { once: true });
          let retried = false;
          retryBtn.onclick = () => { retried = true; attempt.abort(); };
          upText.textContent = 'Uploading reference image… 0%' + (attemptNo > 1 ? ` (attempt ${attemptNo})` : '');
          const upT = comfyTransport(attempt.signal, (loaded, total) => {
            upText.textContent = `Uploading reference image… ${Math.round(loaded / total * 100)}% (${kb(loaded)} / ${kb(total)})` + (attemptNo > 1 ? ` (attempt ${attemptNo})` : '');
          });
          try { upload = await BridgeShared.uploadImage(upT, getHost(), imageFilename ?? 'reference', imageBytes, 'Reference image'); }
          catch (err) {
            if (gen.cancelled) return stopped;
            if (retried) continue;
            return { ok: false, uploadFailed: true, error: 'Reference image upload failed (' + errMsg(err) + ').' };
          } finally {
            gen.abort.signal.removeEventListener('abort', onGenAbort);
          }
        }
        if (gen.cancelled) return stopped;
        if (!upload.ok) return { ok: false, uploadFailed: true, error: upload.error };
        prompt['239'].inputs.image = upload.ref;
        genStatus.textContent = 'Generating… this can take a while.';
      }

      const clientId = 'comfy-bridge-mobile-' + Date.now().toString(16) + '-' + Math.random().toString(16).slice(2);

      try {
        let wsUrl = getHost().replace(/^http/i, 'ws') + '/ws?clientId=' + encodeURIComponent(clientId);
        { const tok = (token.value || '').trim(); if (tok) wsUrl += '&token=' + encodeURIComponent(tok); }
        const sock = new WebSocket(wsUrl);
        ws = sock;
        sock.binaryType = 'arraybuffer';
        sock.addEventListener('open', () => {
          try { sock.send(JSON.stringify({ type: 'feature_flags', data: { supports_preview_metadata: true } })); } catch (e) { /* best effort */ }
          // Same internal API ComfyUI's own frontend "Logs" panel uses —
          // undocumented/unversioned per its own server code comment, but
          // it's what real terminal output runs through, not a proxy.
          fetch(new URL('/internal/logs/subscribe', getHost()), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId, enabled: true })
          }).catch(() => { /* best effort — log streaming just won't start */ });
        });
        sock.addEventListener('message', (ev) => {
          if (ev.data instanceof ArrayBuffer) {
            const data = new DataView(ev.data);
            if (ev.data.byteLength < 8) return;
            const eventType = data.getUint32(0, false);
            if (eventType === 1) {
              const imageType = data.getUint32(4, false);
              const blob = new Blob([ev.data.slice(8)], { type: imageType === 1 ? 'image/jpeg' : 'image/png' });
              livePreview.src = URL.createObjectURL(blob);
              livePreviewWrap.style.display = 'flex';
            } else if (eventType === 4) {
              try {
                const metaLen = data.getUint32(4, false);
                const meta = JSON.parse(new TextDecoder().decode(new Uint8Array(ev.data.slice(8, 8 + metaLen))));
                const blob = new Blob([ev.data.slice(8 + metaLen)], { type: meta.image_type || 'image/jpeg' });
                livePreview.src = URL.createObjectURL(blob);
                livePreviewWrap.style.display = 'flex';
              } catch (e) { /* malformed metadata frame — skip */ }
            }
          } else {
            try {
              const msg = JSON.parse(ev.data);
              if (msg.type === 'logs' && msg.data && Array.isArray(msg.data.entries)) {
                appendComfyLogEntries(msg.data.entries);
              } else if (msg.type === 'progress' && msg.data && msg.data.max) {
                onGenStep(msg.data.value, msg.data.max);
              } else if (msg.type === 'progress_state' && msg.data && msg.data.nodes) {
                const running = Object.values(msg.data.nodes as Record<string, { state: string; value: number; max: number }>).filter((n) => n.state === 'running');
                if (running.length) {
                  const n = running[running.length - 1];
                  onGenStep(n.value, n.max);
                }
              }
            } catch (e) { /* ignore malformed frames */ }
          }
        });
        await new Promise<void>((resolve) => {
          const timer = setTimeout(resolve, 3000);
          sock.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
          sock.addEventListener('error', () => { clearTimeout(timer); resolve(); }, { once: true });
        });
      } catch (err) { console.error('[comfy-bridge] preview websocket setup failed:', err); }

      const queue = await BridgeShared.queuePrompt(t, getHost(), prompt, clientId, { extraData: { preview_method: 'taesd' }, noun: 'generation' });
      if (!queue.ok) return { ok: false, error: queue.error };
      const promptId = queue.promptId!;

      const poll = await BridgeShared.pollHistory(t, getHost(), promptId, {
        deadlineMs: 300000,
        isCancelled: () => !!(activeGen && activeGen.cancelled),
        onCancelled: () => ({ ok: false, error: 'Generation stopped.', interrupted: true }),
        errorStatusMessage: 'ComfyUI reported an error while generating this image — check its console for details.',
        timeoutMessage: 'Timed out waiting for ComfyUI to finish generating this image.',
        extract: async (record: any) => {
          const saveOutput = record.outputs && record.outputs['192'];
          const image = saveOutput && Array.isArray(saveOutput.images) && saveOutput.images[0];
          // '192_pass1' and '192_upscaled' are sibling branches off the same
          // upstream node as '192', not downstream of it — ComfyUI doesn't
          // guarantee they finish before '192' does. Only treat the job as
          // done once every branch the submitted prompt actually asked for
          // has an output, or a still-running sibling branch gets missed.
          const pass1Ready = !prompt['192_pass1'] || (record.outputs && record.outputs['192_pass1']);
          const upscaledReady = !prompt['192_upscaled'] || (record.outputs && record.outputs['192_upscaled']);
          if (!(image && pass1Ready && upscaledReady)) return null;
          const result: GenResult = { ok: true, imageBytes: await fetchViewImage(image), saveRel: sanitizeRel(image) };
          const pass1Output = record.outputs['192_pass1'];
          const pass1Image = pass1Output && Array.isArray(pass1Output.images) && pass1Output.images[0];
          if (pass1Image) { try { result.pass1ImageBytes = await fetchViewImage(pass1Image); result.pass1SaveRel = sanitizeRel(pass1Image); } catch (e) { /* optional */ } }
          const upscaledOutput = record.outputs['192_upscaled'];
          const upscaledImage = upscaledOutput && Array.isArray(upscaledOutput.images) && upscaledOutput.images[0];
          if (upscaledImage) { try { result.upscaledImageBytes = await fetchViewImage(upscaledImage); result.upscaledSaveRel = sanitizeRel(upscaledImage); } catch (e) { /* optional */ } }
          return result;
        }
      });
      return poll.ok ? (poll.value as GenResult) : { ok: false, error: poll.error, interrupted: poll.interrupted };
    } catch (err) {
      if (gen.cancelled) return stopped; // Stop aborted an in-flight request
      return { ok: false, error: 'Could not reach ComfyUI at ' + getHost() + ' (' + errMsg(err) + ')' };
    } finally {
      try { if (ws) ws.close(); } catch (e) { /* already closed */ }
      activeGen = null;
    }
  }

  // ---------------- Reference image ----------------

  let refFile: File | null = null;
  let refFilename = '';
  // Bytes are read once, at pick time: Android can revoke a picked file's read
  // grant (or stall on a cloud-backed photo) by the time Generate runs, which
  // used to hang/throw inside generate() and wedge it in "Generating…".
  let refBytes: Uint8Array | null = null;

  function applySkipRefImageUI() {
    refImageSection.classList.toggle('section-disabled', skipRefImage.checked);
    lliteSection.classList.toggle('section-disabled', skipRefImage.checked);
  }
  skipRefImage.addEventListener('change', applySkipRefImageUI);
  applySkipRefImageUI();

  btnPickImage.addEventListener('click', () => refFileInput.click());
  refFileInput.addEventListener('change', async () => {
    const file = refFileInput.files && refFileInput.files[0];
    // Reset before anything else: without it the WebView won't fire 'change'
    // again for the same file, and re-picking an image would silently do
    // nothing (looking like "the picker is inconsistent").
    refFileInput.value = '';
    if (!file) return;
    let bytes: Uint8Array;
    try { bytes = new Uint8Array(await file.arrayBuffer()); }
    catch (err) { log('Couldn\'t read that image (' + errMsg(err) + ') — try picking it again.'); return; }
    if (!bytes.length) { log('That image came back empty (the picker offered ' + String(file.size) + ' bytes) — try picking it again.'); return; }
    refFile = file;
    refBytes = bytes;
    refFilename = file.name;
    refFileName.textContent = file.name;
    // Preview from the bytes themselves, not a blob: URL of the picked file.
    // A blob: URL is a lazy reference to the picked content:// source — the
    // WebView sometimes fails to materialize it for rendering (JS reads the
    // bytes fine, the <img> shows the "generic file" broken-image icon), and
    // any failure reproduces inconsistently per pick. A data: URL is dead
    // simple and renders exactly the bytes the upload would send.
    const mime = sniffImageMime(bytes) || (file.type || '').split(';')[0] || 'image/png';
    refPreview.src = 'data:' + mime + ';base64,' + BridgeShared.bytesToBase64(bytes);
    refPreview.style.display = 'block';
  });

  // The magic numbers of the formats the editor actually feeds through here.
  // Audio/video/DICOM etc. render nothing, so only a recognized family or an
  // explicitly image/* type gets a preview; anything else falls back to the
  // browser's default decoding attempt as image/png.
  function sniffImageMime(bytes: Uint8Array): string {
    const m = (arr: number[], off = 0): boolean => arr.every((b, i) => bytes[off + i] === b);
    if (bytes.length >= 8 && m([0x89, 0x50, 0x4e, 0x47])) return 'image/png';
    if (bytes.length >= 3 && m([0xff, 0xd8, 0xff])) return 'image/jpeg';
    if (bytes.length >= 12 && m([0x52, 0x49, 0x46, 0x46]) && m([0x57, 0x45, 0x42, 0x50], 8)) return 'image/webp';
    if (bytes.length >= 6 && m([0x47, 0x49, 0x46])) return 'image/gif';
    return '';
  }

  // ---------------- Toggles ----------------

  function applyUnifiedPromptModeUI() {
    const unified = unifiedPromptMode.checked;
    unifiedPromptRow.style.display = unified ? '' : 'none';
    splitFieldsGroup.style.display = unified ? 'none' : '';
    // A textarea measures scrollHeight 0 while display:none, so whichever
    // side just became visible needs a fresh autoGrow.
    autoGrowAll();
  }
  unifiedPromptMode.addEventListener('change', () => { void convertPromptMode(); });
  applyUnifiedPromptModeUI();

  // Switching modes carries the prompt over (mirrors desktop's
  // convertPromptMode): to the single box the boxes merge (Global cleared —
  // the builder still sends it); back, the prompt is split by Tag Sorting,
  // unless it's unchanged since the switch (then the boxes come back as they
  // were). An empty side never overwrites the other.
  let boxesBeforeMerge: { merged: string; values: Record<string, string> } | null = null;
  async function convertPromptMode() {
    const boxes: Record<string, HTMLTextAreaElement> = {
      global: global_, rating, character, hair, face, chest, body: body_, clothes, limbs, sexual, pose, extra, effects, scene
    };
    if (unifiedPromptMode.checked) {
      const values: Record<string, string> = {};
      for (const id of Object.keys(boxes)) values[id] = boxes[id].value;
      const merged = BridgeShared.mergePromptFields(values);
      if (merged) {
        unifiedPrompt.value = merged;
        global_.value = '';
        boxesBeforeMerge = { merged, values };
      }
    } else {
      const text = unifiedPrompt.value.trim();
      if (text && boxesBeforeMerge && text === boxesBeforeMerge.merged) {
        for (const id of Object.keys(boxes)) boxes[id].value = boxesBeforeMerge.values[id];
      } else if (text) {
        const split = await BridgeShared.splitPromptToFields(text);
        if (unifiedPromptMode.checked) return; // toggled back while splitting
        for (const id of Object.keys(boxes)) boxes[id].value = split[id] || '';
      }
      boxesBeforeMerge = null;
    }
    applyUnifiedPromptModeUI();
    void refreshSavePreview();
    scheduleUiSave();
  }

  use2Pass.addEventListener('change', () => { pass2Fields.style.display = use2Pass.checked ? '' : 'none'; });
  pass2Fields.style.display = use2Pass.checked ? '' : 'none';

  // ---------------- Off-canvas drawers (settings, log) ----------------
  // Both slide from the left and share one backdrop — only one open at a
  // time (opening either closes the other) so they never visually stack.
  const genSettingsToggle = $('genSettingsToggle');
  const genSettingsDrawer = $('genSettingsDrawer');
  const genSettingsBackdrop = $('genSettingsBackdrop');
  const genSettingsClose = $('genSettingsClose');
  const logDrawerToggle = $('logDrawerToggle');
  const logDrawer = $('logDrawer');
  const logDrawerClose = $('logDrawerClose');
  const drawers = [genSettingsDrawer, logDrawer];
  function closeAllDrawers() {
    for (const d of drawers) d.classList.remove('open');
    genSettingsBackdrop.classList.remove('open');
  }
  function openDrawer(drawer: HTMLElement) {
    closeAllDrawers();
    drawer.classList.add('open');
    genSettingsBackdrop.classList.add('open');
  }
  function toggleDrawer(drawer: HTMLElement) {
    if (drawer.classList.contains('open')) closeAllDrawers(); else openDrawer(drawer);
  }
  genSettingsToggle.addEventListener('click', () => toggleDrawer(genSettingsDrawer));
  genSettingsClose.addEventListener('click', closeAllDrawers);
  logDrawerToggle.addEventListener('click', () => toggleDrawer(logDrawer));
  logDrawerClose.addEventListener('click', closeAllDrawers);
  genSettingsBackdrop.addEventListener('click', closeAllDrawers);

  // ---------------- Connection help modal ----------------
  // Centered, dim-screen modal — not an anchored popover. A popover here
  // could grow taller than the viewport on a small phone and force the
  // whole PAGE to scroll to read the rest of it.
  const connInfoBtn = $('connInfoBtn');
  const connInfoBackdrop = $('connInfoBackdrop');
  const connInfoClose = $('connInfoClose');
  function openConnInfo() { connInfoBackdrop.hidden = false; }
  function closeConnInfo() { connInfoBackdrop.hidden = true; }
  connInfoBtn.addEventListener('click', openConnInfo);
  connInfoClose.addEventListener('click', closeConnInfo);
  connInfoBackdrop.addEventListener('click', (ev) => { if (ev.target === connInfoBackdrop) closeConnInfo(); });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeConnInfo(); });

  // ---------------- Android Back (@capacitor/app) ----------------
  // Registering a backButton listener replaces Android's default, which
  // quit the app from anywhere. Back now steps out of the top layer: the
  // gallery first (open image, then up a folder, then close — shared
  // galleryBack()), then the connection help, the theme menu or an open
  // drawer; only with nothing open does it leave the app.
  const AppPlugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (AppPlugin) {
    AppPlugin.addListener('backButton', () => {
      if (BridgeShared.galleryBack()) return;
      if (BridgeShared.compareBack()) return;
      if (!connInfoBackdrop.hidden) { closeConnInfo(); return; }
      const themeMenu = document.getElementById('themeMenu');
      if (themeMenu && !themeMenu.hidden) { themeMenu.hidden = true; return; }
      if (drawers.some((d) => d.classList.contains('open'))) { closeAllDrawers(); return; }
      AppPlugin.exitApp();
    });
  }

  upscaleEnabled.addEventListener('change', () => { upscaleModelRow.style.display = upscaleEnabled.checked ? '' : 'none'; });
  upscaleModelRow.style.display = upscaleEnabled.checked ? '' : 'none';

  // ---------------- USDU (Ultimate SD Upscale) ----------------
  // Shared panel/graph (shared/usdu.ts). Mounted before restoreUiState() (Init)
  // so its usdu* fields persist with the rest.
  let usduCkptOptions: string[] = [];
  let usduWd14Options: string[] = [];
  async function refreshUsduLists(): Promise<void> {
    const [ckpts, wd14, ups] = await Promise.all([
      comfyGetObjectInfo('CheckpointLoaderSimple', 'ckpt_name'),
      comfyGetObjectInfo('WD14Tagger|pysssss', 'model'),
      comfyGetObjectInfo('UpscaleModelLoader', 'model_name')
    ]);
    if (ckpts.ok) usduCkptOptions = ckpts.values;
    if (wd14.ok) usduWd14Options = wd14.values;
    if (ups.ok) fillDatalist(upscaleModelList, ups.values);
    await refreshSamplerLists();
    log('USDU lists refreshed.');
  }
  const usdu = BridgeShared.mountUsduPanel($('usduPanel'), {
    standardToggle: upscaleEnabled,
    getList: (kind: string) => kind === 'ckpt' ? usduCkptOptions
      : kind === 'wd14' ? usduWd14Options
      : kind === 'upscale' ? BridgeShared.optionsFromDatalist(upscaleModelList)
      : kind === 'sampler' ? bridgeSamplerOptions : bridgeSchedulerOptions,
    refreshLists: refreshUsduLists,
    onRunImported: () => { void queueUsduImported(); },
    log
  });
  // The Upscale tab: the same panel for an image you already have (ids
  // usduImp*, settings kept apart from the drawer's).
  const usduImp = BridgeShared.mountUsduPanel($('usduTab'), {
    mode: 'imported',
    getList: (kind: string) => kind === 'ckpt' ? usduCkptOptions
      : kind === 'wd14' ? usduWd14Options
      : kind === 'upscale' ? BridgeShared.optionsFromDatalist(upscaleModelList)
      : kind === 'sampler' ? bridgeSamplerOptions : bridgeSchedulerOptions,
    refreshLists: refreshUsduLists,
    onRunImported: () => { void queueUsduImported(); },
    log
  });

  btnSwapReso.addEventListener('click', () => {
    const w = width.value;
    width.value = height.value;
    height.value = w;
  });

  // ---------------- Connection test ----------------

  btnConnect.addEventListener('click', async () => {
    try { localStorage.setItem(HOST_KEY, (host.value || '').trim()); } catch (e) { /* best effort */ }
    connStatus.style.display = 'block';
    connStatus.style.color = '';
    connStatus.textContent = 'Connecting…';
    const res = await comfyGetObjectInfo('UNETLoader', 'unet_name');
    if (res.ok) {
      connStatus.style.color = 'var(--accent-ok)';
      connStatus.textContent = '✓ Connected to ' + getHost();
      rememberHost(getHost(), (token.value || '').trim());
    } else {
      connStatus.style.color = '';
      connStatus.textContent = 'error' in res ? res.error : '';
    }
  });

  // ---------------- Model lists ----------------

  btnRefreshModels.addEventListener('click', async () => {
    const [unetValues, clipValues, vaeValues, mainLoraValues, loraValues, upscaleValues] = await Promise.all([
      comfyGetObjectInfo('UNETLoader', 'unet_name'),
      comfyGetObjectInfo('CLIPLoader', 'clip_name'),
      comfyGetObjectInfo('VAELoader', 'vae_name'),
      comfyGetObjectInfo('DSM Lora Name', 'lora_name'),
      comfyGetObjectInfo('DSM Lora Loader Stack', 'lora_01'),
      comfyGetObjectInfo('UpscaleModelLoader', 'model_name')
    ]);
    if (unetValues.ok) fillDatalist(diffModelList, unetValues.values);
    if (clipValues.ok) fillDatalist(clipList, clipValues.values);
    if (vaeValues.ok) fillDatalist(vaeList, vaeValues.values);
    if (mainLoraValues.ok) fillDatalist(mainLoraList, mainLoraValues.values);
    if (loraValues.ok) fillDatalist(loraList, loraValues.values);
    if (upscaleValues.ok) fillDatalist(upscaleModelList, upscaleValues.values);
    const [usduCkpts, usduWd14] = await Promise.all([
      comfyGetObjectInfo('CheckpointLoaderSimple', 'ckpt_name'),
      comfyGetObjectInfo('WD14Tagger|pysssss', 'model')
    ]);
    if (usduCkpts.ok) usduCkptOptions = usduCkpts.values;
    if (usduWd14.ok) usduWd14Options = usduWd14.values;
    log('Model lists refreshed from ComfyUI.');
    await refreshSamplerLists();
    log('Sampler/scheduler options refreshed.');
  });



  // Dedicated upscale refresh (parity with desktop's per-disk refresh
  // button): the phone has no disk, so this queries the HOST's ComfyUI via
  // /object_info — an independent, re-runnable refill for just the upscale
  // list, without re-fetching every other model family.
  btnRefreshUpscaleModels.addEventListener('click', async () => {
    const res = await comfyGetObjectInfo('UpscaleModelLoader', 'model_name');
    if (res.ok) {
      fillDatalist(upscaleModelList, res.values);
      log('Found ' + res.values.length + ' upscale model(s) on the host.');
    } else {
      log('error' in res ? res.error : '');
    }
  });

  // ---------------- LoRA stack rows ----------------

  let loraRows: { row: HTMLElement; input: HTMLInputElement; strength: HTMLInputElement }[] = [];
  function addLoraRow(defaultLora: string, defaultStrength: number) {
    const row = document.createElement('div');
    row.className = 'synthdat-lora-row';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Tap to choose…';
    input.readOnly = true;
    input.value = defaultLora || '';
    BridgeShared.attachPickerModal(input, 'LoRA', () => BridgeShared.optionsFromDatalist(loraList));
    const strength = document.createElement('input');
    strength.type = 'number';
    strength.step = '0.05';
    strength.value = String(defaultStrength != null ? defaultStrength : 1);
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => { loraRows = loraRows.filter((r) => r.row !== row); row.remove(); });
    row.appendChild(input);
    row.appendChild(strength);
    row.appendChild(removeBtn);
    loraStackRows.appendChild(row);
    loraRows.push({ row, input, strength });
  }
  btnAddLora.addEventListener('click', () => addLoraRow('', 1));
  addLoraRow('', 1);
  addLoraRow('', 0.8);

  // ---------------- Presets (localStorage) ----------------

  const PRESETS_KEY = 'comfy-bridge-presets';
  function readPresets(): { promptPresets: Record<string, any>; negativePresets: Record<string, any> } {
    try {
      const parsed = JSON.parse(localStorage.getItem(PRESETS_KEY) || 'null');
      return { promptPresets: (parsed && parsed.promptPresets) || {}, negativePresets: (parsed && parsed.negativePresets) || {} };
    } catch (e) { return { promptPresets: {}, negativePresets: {} }; }
  }
  function writePresets(data: { promptPresets: Record<string, any>; negativePresets: Record<string, any> }) {
    try { localStorage.setItem(PRESETS_KEY, JSON.stringify(data)); } catch (e) { /* best effort */ }
  }

  function snapshotPromptFields() {
    return {
      unifiedPromptMode: unifiedPromptMode.checked, unifiedPrompt: unifiedPrompt.value,
      global: global_.value, character: character.value, characterTrigger: characterTrigger.value,
      rating: rating.value, hair: hair.value, face: face.value, chest: chest.value, body: body_.value,
      clothes: clothes.value, limbs: limbs.value, sexual: sexual.value, pose: pose.value,
      scene: scene.value, effects: effects.value, extra: extra.value
    };
  }
  function applyPromptFields(fields: Record<string, any>) {
    unifiedPromptMode.checked = !!fields.unifiedPromptMode;
    unifiedPrompt.value = fields.unifiedPrompt || '';
    global_.value = fields.global || ''; character.value = fields.character || '';
    characterTrigger.value = fields.characterTrigger || ''; rating.value = fields.rating || '';
    hair.value = fields.hair || ''; face.value = fields.face || ''; chest.value = fields.chest || '';
    body_.value = fields.body || ''; clothes.value = fields.clothes || ''; limbs.value = fields.limbs || '';
    sexual.value = fields.sexual || ''; pose.value = fields.pose || ''; scene.value = fields.scene || '';
    effects.value = fields.effects || ''; extra.value = fields.extra || '';
    applyUnifiedPromptModeUI();
  }

  function refreshPresetLists() {
    const data = readPresets();
    const fillSelect = (el: HTMLSelectElement, names: string[]) => {
      const current = el.value;
      el.innerHTML = '<option value="">(choose a preset)</option>';
      for (const name of names) {
        const opt = document.createElement('option');
        opt.value = name; opt.textContent = name;
        el.appendChild(opt);
      }
      if (names.includes(current)) el.value = current;
    };
    fillSelect(promptPresetSelect, Object.keys(data.promptPresets).sort());
    fillSelect(negativePresetSelect, Object.keys(data.negativePresets).sort());
  }

  btnSavePromptPreset.addEventListener('click', () => {
    const name = promptPresetName.value.trim();
    if (!name) { log('Type a name for this prompt preset first.'); return; }
    const data = readPresets();
    data.promptPresets[name] = snapshotPromptFields();
    writePresets(data);
    promptPresetName.value = '';
    refreshPresetLists();
    promptPresetSelect.value = name;
    log('Saved prompt preset "' + name + '".');
  });
  btnLoadPromptPreset.addEventListener('click', () => {
    const name = promptPresetSelect.value;
    if (!name) { log('Pick a prompt preset to load first.'); return; }
    const data = readPresets();
    if (!data.promptPresets[name]) { log('Preset not found.'); return; }
    applyPromptFields(data.promptPresets[name]);
    log('Loaded prompt preset "' + name + '".');
  });
  btnDeletePromptPreset.addEventListener('click', () => {
    const name = promptPresetSelect.value;
    if (!name) return;
    const data = readPresets();
    delete data.promptPresets[name];
    writePresets(data);
    refreshPresetLists();
    log('Deleted prompt preset "' + name + '".');
  });

  btnSaveNegativePreset.addEventListener('click', () => {
    const name = negativePresetName.value.trim();
    if (!name) { log('Type a name for this negative preset first.'); return; }
    const data = readPresets();
    data.negativePresets[name] = negative.value;
    writePresets(data);
    negativePresetName.value = '';
    refreshPresetLists();
    negativePresetSelect.value = name;
    log('Saved negative preset "' + name + '".');
  });
  btnLoadNegativePreset.addEventListener('click', () => {
    const name = negativePresetSelect.value;
    if (!name) { log('Pick a negative preset to load first.'); return; }
    const data = readPresets();
    if (data.negativePresets[name] === undefined) { log('Preset not found.'); return; }
    negative.value = data.negativePresets[name];
    autoGrow(negative);
    log('Loaded negative preset "' + name + '".');
  });
  btnDeleteNegativePreset.addEventListener('click', () => {
    const name = negativePresetSelect.value;
    if (!name) return;
    const data = readPresets();
    delete data.negativePresets[name];
    writePresets(data);
    refreshPresetLists();
    log('Deleted negative preset "' + name + '".');
  });

  // ---------------- Prompt building (same node ids as desktop) ----------------

  let template: any = null;
  async function loadTemplate() {
    if (template) return template;
    const res = await fetch('./data/synthdat-workflow.json');
    template = await res.json();
    return template;
  }

  function buildPrompt() {
    // Thin adapter over the shared builder (BridgeShared.buildSynthDatPrompt,
    // bundled from comfy-bridge/src/comfy-core.ts — the same source the desktop
    // apps use). All graph logic lives there so it can't drift.
    const prompt = BridgeShared.buildSynthDatPrompt(template, {
      unified: unifiedPromptMode.checked,
      global: fieldValue(global_),
      rating: fieldValue(rating),
      character: fieldValue(character),
      characterTrigger: fieldValue(characterTrigger),
      unifiedPrompt: fieldValue(unifiedPrompt),
      hair: fieldValue(hair),
      face: fieldValue(face),
      chest: fieldValue(chest),
      body: fieldValue(body_),
      clothes: fieldValue(clothes),
      limbs: fieldValue(limbs),
      sexual: fieldValue(sexual),
      pose: fieldValue(pose),
      extra: fieldValue(extra),
      effects: fieldValue(effects),
      scene: fieldValue(scene),
      negative: fieldValue(negative),
      diffModel: diffModel.value,
      mainLora: mainLora.value,
      mainLoraStrength: mainLoraStrength.value,
      clip: clip.value,
      vae: vae.value,
      loraRows: loraRows.map(function (r) { return { input: r.input.value, strength: r.strength.value }; }),
      skipRefImage: skipRefImage.checked,
      lliteStrength: lliteStrength.value,
      lliteStartPercent: lliteStartPercent.value,
      lliteEndPercent: lliteEndPercent.value,
      llitePreserveWrapper: llitePreserveWrapper.checked,
      resizeFit: resizeFit.value,
      resizeMethod: resizeMethod.value,
      sampler: sampler.value,
      scheduler: scheduler.value,
      steps1: steps1.value,
      cfg1: cfg1.value,
      width: width.value,
      height: height.value,
      seed1: seed1.value,
      use2Pass: use2Pass.checked,
      seed2: seed2.value,
      denoise2: denoise2.value,
      steps2: steps2.value,
      upscale: { enabled: upscaleEnabled.checked && !usdu.enabled(), model: upscaleModel.value, scaleBy: upscaleScaleBy.value }
    });
    if (usdu.activeForGeneration()) usdu.appendToGeneration(prompt);
    return prompt;
  }

  // ---------------- Save to device (active backend) ----------------

  async function saveBytes(bytes: Uint8Array, filename: string): Promise<{ file: string } | null> {
    try {
      await mobileBackend().writeImage(filename, BridgeShared.bytesToBase64(bytes), 'image/png');
      log('Saved ' + saveLocationLabelText() + '/' + filename);
      return { file: filename };
    } catch (err) {
      log('Failed to save ' + filename + ': ' + errMsg(err));
      return null;
    }
  }

  // ---------------- Generate ----------------

  // ---------------- Result preview carousel ----------------
  // Ported from desktop's src/renderer/app.ts — scroll-snap gives swipe +
  // momentum for free on a touch WebView, no hand-rolled gesture math.
  let previewSlideUrls: string[] = [];

  function clearPreviewSlides() {
    for (const u of previewSlideUrls) URL.revokeObjectURL(u);
    previewSlideUrls = [];
    previewCarousel.innerHTML = '';
    previewThumbs.innerHTML = '';
    previewThumbs.style.display = 'none';
  }

  function setPreviewSlides(slides: { label: string; bytes: Uint8Array }[]) {
    clearPreviewSlides();
    if (!slides.length) { previewEmpty.style.display = ''; return; }
    previewEmpty.style.display = 'none';
    previewSlideUrls = slides.map((s) => URL.createObjectURL(new Blob([s.bytes as BlobPart], { type: 'image/png' })));
    slides.forEach((s, i) => {
      const slide = document.createElement('div');
      slide.className = 'preview-slide';
      const label = document.createElement('span');
      label.className = 'preview-slide-label';
      label.textContent = s.label;
      const img = document.createElement('img');
      img.src = previewSlideUrls[i];
      img.addEventListener('click', () => BridgeShared.showImageLightbox(img.src));
      slide.appendChild(label);
      slide.appendChild(img);
      previewCarousel.appendChild(slide);
    });
    if (slides.length > 1) {
      previewThumbs.style.display = '';
      slides.forEach((s, i) => {
        const thumb = document.createElement('button');
        thumb.type = 'button';
        thumb.className = 'preview-thumb' + (i === 0 ? ' active' : '');
        thumb.title = s.label;
        const timg = document.createElement('img');
        timg.src = previewSlideUrls[i];
        thumb.appendChild(timg);
        thumb.addEventListener('click', () => {
          previewCarousel.scrollTo({ left: i * previewCarousel.clientWidth, behavior: 'smooth' });
        });
        previewThumbs.appendChild(thumb);
      });
    }
    previewCarousel.scrollLeft = 0;
  }

  let previewScrollTimer: ReturnType<typeof setTimeout> | null = null;
  previewCarousel.addEventListener('scroll', () => {
    if (previewScrollTimer) clearTimeout(previewScrollTimer);
    previewScrollTimer = setTimeout(() => {
      const w = previewCarousel.clientWidth || 1;
      const idx = Math.round(previewCarousel.scrollLeft / w);
      previewThumbs.querySelectorAll('.preview-thumb').forEach((el, i) => el.classList.toggle('active', i === idx));
    }, 80);
  });

  // ---------------- Generation queue ----------------
  // Same as the desktop Bridge: Generate never blocks. Each press snapshots
  // the prompt, reference and stage counts as they are at that moment and
  // queues the job; jobs run one at a time, in order. Stop (or the
  // notification's Cancel) ends the running job and drops the queue.
  interface GenJob {
    prompt: Record<string, any>;
    imageFilename: string | null;
    imageBytes: Uint8Array | null;
    passCount: number;
    totalStages: number;
    // Where this job's copies go, snapshotted with the prompt like the
    // desktop Bridge — a queued job saves under the folders/name its own
    // settings produced, even if the UI changed since it was queued.
    naming: SaveNaming;
    // An imported image through USDU: its one output ('192') is the upscale.
    usduOnly?: boolean;
  }
  const genQueue: GenJob[] = [];
  let genRunning = false;
  let genStopped = false;

  function queueNote(): string { return genQueue.length ? ' · ' + genQueue.length + ' queued' : ''; }

  async function generate() {
    if (!skipRefImage.checked && !refBytes) { log('Pick a reference image first (or check "No reference image").'); return; }
    await loadTemplate();
    const passCount = use2Pass.checked ? 2 : 1;
    genQueue.push({
      prompt: buildPrompt(),
      imageFilename: skipRefImage.checked ? null : refFilename,
      imageBytes: skipRefImage.checked ? null : refBytes,
      passCount,
      totalStages: passCount + (((upscaleEnabled.checked && upscaleModel.value.trim()) || usdu.activeForGeneration()) ? 1 : 0),
      naming: await currentNaming()
    });
    startQueue();
  }

  async function queueUsduImported() {
    const j = await usduImp.buildImportedJob();
    if (!j) return;
    genQueue.push({
      prompt: j.prompt,
      imageFilename: j.imageFilename,
      imageBytes: j.imageBytes,
      passCount: 1,
      totalStages: 1,
      naming: { relDir: '', base: BridgeShared.safeSegment(j.base) || 'usdu', rating: '', character: '', recognized: '' },
      usduOnly: true
    });
    startQueue();
  }

  function startQueue() {
    if (genRunning) {
      log('Queued a generation (' + genQueue.length + ' waiting).');
      genStatus.textContent = (genStatus.textContent || 'Generating…').split(' · ')[0] + queueNote();
      return;
    }
    runQueue();
  }

  async function runQueue() {
    genRunning = true;
    genStopped = false;
    btnStop.disabled = false;
    btnGenerate.title = 'Queue another generation with the current settings';
    try {
      while (genQueue.length && !genStopped) {
        const job = genQueue.shift()!;
        try { await runGeneration(job); }
        catch (err) {
          genStatus.style.display = 'block';
          genStatus.textContent = 'Generation failed: ' + errMsg(err) + queueNote();
          log('Generation failed: ' + errMsg(err));
          finalizeGenNotification('Generation failed', errMsg(err));
        }
      }
    } finally {
      // Whatever happened, never leave the UI wedged in "Generating…".
      genRunning = false;
      genQueue.length = 0;
      btnStop.disabled = true;
      btnGenerate.title = '';
      livePreviewWrap.style.display = 'none';
    }
  }

  function stopGeneration() {
    genStopped = true;
    const dropped = genQueue.length;
    genQueue.length = 0;
    if (dropped) log('Dropped ' + dropped + ' queued generation' + (dropped === 1 ? '' : 's') + '.');
    comfyStopGeneration();
  }

  async function runGeneration(job: GenJob) {
    livePreview.src = '';
    livePreviewWrap.style.display = 'none';
    genStatus.style.display = 'block';
    genStatus.textContent = 'Generating… this can take a while.' + queueNote();

    resetGenNotificationState(job.passCount, job.totalStages);
    if (await ensureGenNotifReady()) {
      postGenNotification({ title: genStageLabel(1) + ' (1/' + genTotalStages + ')', body: 'Starting…', progress: 0, max: 0, indeterminate: true, showCancel: true });
    }

    const res = await comfyQueueAndFetch(job.imageFilename, job.imageBytes, job.prompt);
    livePreviewWrap.style.display = 'none';

    if (!res.ok) {
      if (res.interrupted) { genStatus.style.display = 'none'; log('Generation stopped.'); finalizeGenNotification('Generation stopped', ''); }
      else {
        genStatus.textContent = res.error || '';
        log(res.error);
        finalizeGenNotification('Generation failed', res.error || '');
        if (res.uploadFailed) {
          const retry = document.createElement('button');
          retry.type = 'button';
          retry.className = 'gen-retry-btn';
          retry.textContent = '↻ Retry upload';
          // Bytes are already in memory, so this just re-runs the same job —
          // the upload is its first step. It goes to the front of the queue.
          retry.addEventListener('click', () => {
            retry.remove();
            genQueue.unshift(job);
            if (!genRunning) runQueue();
          });
          genStatus.appendChild(retry);
        }
      }
      return;
    }
    genStatus.style.display = 'none';

    // Save under the phone's own File Namer (shared/file-naming.ts) — the
    // same scheme the desktop Bridge uses for its copies: pass 1 and pass 2
    // take consecutive counters in the same folders, the upscaled file goes
    // in an Upscaled folder next to them, and nothing is overwritten.
    // The server copy (the host's own SaveImage, chain-named the automatic
    // way) is the host's business; the /export rel paths it returns no longer
    // place the phone's mirror.
    const taken = new Set<string>();
    const savePath = (upscaled: boolean): Promise<string> =>
      BridgeShared.nextSavePath(mobileBackend(), upscaled ? joinRel(job.naming.relDir, 'Upscaled') : job.naming.relDir, job.naming.base, taken);
    let saveFailed = false;
    const slides: { label: string; bytes: Uint8Array }[] = [];
    // What WD14's "Tag last generation" tags (saved copies only).
    const saved: { label: string; bytes: Uint8Array; relPath: string }[] = [];
    const keep = async (label: string, bytes: Uint8Array, upscaled: boolean): Promise<void> => {
      const rel = await savePath(upscaled);
      if (await saveBytes(bytes, rel)) saved.push({ label, bytes, relPath: rel });
      else saveFailed = true;
      slides.push({ label, bytes });
    };
    if (job.usduOnly) {
      if (res.imageBytes) await keep('Upscaled (USDU)', res.imageBytes, true);
      lastSavedImages = saved;
      if (saveFailed) { genStatus.style.display = 'block'; genStatus.textContent = 'Upscaled, but saving failed — see Log for details.'; }
      finalizeGenNotification(saveFailed ? 'Upscaled, but saving failed' : 'Upscale complete', 'USDU');
      setPreviewSlides(slides);
      return;
    }
    if (res.pass1ImageBytes) await keep('Pass 1', res.pass1ImageBytes, false);
    if (res.imageBytes) await keep(res.pass1ImageBytes ? 'Pass 2' : 'Pass 1', res.imageBytes, false);
    if (res.upscaledImageBytes) await keep('Upscaled', res.upscaledImageBytes, true);
    lastSavedImages = saved;
    if (saveFailed) {
      genStatus.style.display = 'block';
      genStatus.textContent = 'Generated, but saving failed — see Log for details.';
    }
    finalizeGenNotification(saveFailed ? 'Generated, but saving failed' : 'Generation complete', slides.map((s) => s.label).join(', '));
    setPreviewSlides(slides);
  }

  btnGenerate.addEventListener('click', generate);
  btnStop.addEventListener('click', stopGeneration);

  // ---------------- WD14 tagging (shared/wd14-tag.ts) ----------------
  let lastSavedImages: { label: string; bytes: Uint8Array; relPath: string }[] = [];
  let wd14TagModels: string[] = [];
  async function comfyTag(prompt: Record<string, any>, imageName: string, bytes: Uint8Array): Promise<string> {
    const t = comfyTransport();
    const up = await BridgeShared.uploadImage(t, getHost(), imageName, bytes, 'Image');
    if (!up.ok || !up.ref) throw new Error(up.error || 'Upload failed.');
    prompt['239'].inputs.image = up.ref;
    const q = await BridgeShared.queuePrompt(t, getHost(), prompt, 'comfy-bridge-tag-' + Date.now().toString(16), { noun: 'tag' });
    if (!q.ok || !q.promptId) throw new Error(q.error || 'Could not queue the tagging job.');
    const poll = await BridgeShared.pollHistory(t, getHost(), q.promptId, {
      deadlineMs: 180000,
      extract: (record: any) => BridgeShared.extractWd14Tags(record),
      errorStatusMessage: 'ComfyUI reported an error while tagging — check its console.',
      timeoutMessage: 'Timed out waiting for ComfyUI to tag the image.'
    });
    if (!poll.ok || typeof poll.value !== 'string') throw new Error(poll.error || 'Tagging failed.');
    return poll.value;
  }
  async function useTagsAsPrompt(tags: string) {
    if (unifiedPromptMode.checked) {
      unifiedPrompt.value = tags;
    } else {
      const boxes: Record<string, HTMLTextAreaElement> = {
        global: global_, rating, character, hair, face, chest, body: body_, clothes, limbs, sexual, pose, extra, effects, scene
      };
      const split = await BridgeShared.splitPromptToFields(tags);
      const keepGlobal = global_.value.trim();
      for (const id of Object.keys(boxes)) boxes[id].value = split[id] || '';
      global_.value = [keepGlobal, split.global || ''].filter(Boolean).join(', ');
    }
    autoGrowAll();
    void refreshSavePreview();
    scheduleUiSave();
    log('Used the WD14 tags as the prompt (Global, Character trigger and Negative kept).');
  }
  BridgeShared.mountWd14Panel($('wd14Panel'), {
    tag: comfyTag,
    getModels: () => wd14TagModels.length ? wd14TagModels : usduWd14Options,
    async refreshModels() {
      const r = await comfyGetObjectInfo('WD14Tagger|pysssss', 'model');
      if (r.ok) { wd14TagModels = r.values; log('Found ' + r.values.length + ' WD14 model(s).'); }
      else log('error' in r ? r.error : '');
    },
    lastSaved: () => lastSavedImages,
    writeOutput: (relPath: string, base64: string, mime: string) => mobileBackend().writeImage(relPath, base64, mime),
    usePrompt: (tags: string) => { void useTagsAsPrompt(tags); },
    log
  });

  // ---------------- Import generation ----------------
  // Same feature as the desktop Bridge: read any image's generation
  // (BridgeShared.imageMetadataTexts + normalizeGeneration, shared with the
  // desktop) and re-enter it. The compressed-iTXt inflate stays unsupported
  // in this WebView (ComfyUI and A1111 write their chunks uncompressed), so
  // none is passed. Field mapping mirrors desktop's applyImportedPrompt.

  // Every field applyImportedPrompt can touch, reset to blank/default first
  // — same reasoning as desktop's resetGenerationForm. Without this,
  // importing a generation that didn't use a 2nd pass or a LoRA stack left
  // whatever was already in those fields, silently mixing old and new
  // settings.
  const RESET_TEXT_FIELDS = [
    diffModel, clip, vae, mainLora, mainLoraStrength,
    lliteStrength, lliteStartPercent, lliteEndPercent,
    unifiedPrompt, global_, character, characterTrigger, rating, hair, face, chest, body_,
    clothes, limbs, sexual, pose, scene, effects, extra, negative,
    width, height, sampler, scheduler, steps1, cfg1, seed1, steps2, denoise2, seed2, upscaleModel, upscaleScaleBy
  ];
  const RESET_CHECKBOXES = [skipRefImage, llitePreserveWrapper, unifiedPromptMode, use2Pass, upscaleEnabled];
  function resetGenerationForm() {
    for (const el of RESET_TEXT_FIELDS) el.value = el.defaultValue;
    for (const el of RESET_CHECKBOXES) el.checked = el.defaultChecked;
    for (const sel of [resizeFit, resizeMethod]) {
      for (const opt of Array.from(sel.options)) opt.selected = opt.defaultSelected;
    }
    for (const r of loraRows.slice()) {
      loraRows = loraRows.filter((x) => x !== r);
      r.row.remove();
    }
    refFile = null;
    refBytes = null;
    refFilename = '';
    refFileName.textContent = '';
    refPreview.removeAttribute('src');
    refPreview.style.display = 'none';
    applySkipRefImageUI();
    applyUnifiedPromptModeUI();
    pass2Fields.style.display = 'none';
    upscaleModelRow.style.display = 'none';
  }

  // The prompt side of a saved prompt, written exactly (mirrors desktop's):
  // every prompt field takes the image's value and one the image left empty
  // is cleared, so nothing from the current prompt mixes in. The character
  // trigger is cleared too: '11' already holds it joined with the character.
  // Single prompt box (mirrors desktop's): in single-box mode (`singleBox`,
  // read BEFORE any form reset), or when the image has no per-category text,
  // every field merges into the one box in the workflow's join order and the
  // boxes that mode hides are cleared (the builder still sends Global).
  // Multi-box mode (mirrors desktop's): a single prompt (single-box, or an
  // image made elsewhere) is SPLIT into the boxes by Osmium's Tag Sorting
  // classifier (BridgeShared.splitPromptToFields); unrecognised tags → Extra.
  // A1111-only syntax (<lora:…>, BREAK) is dropped; returns the LoRA names.
  async function applySavedPromptText(prompt: Record<string, any>, singleBox: boolean): Promise<string[]> {
    const inp = (id: string): Record<string, any> => (prompt[id] && prompt[id].inputs) || {};
    const s = (id: string, key: string): string => { const v = inp(id)[key]; return v == null ? '' : String(v); };
    const perField: [HTMLTextAreaElement, string][] = [
      [rating, s('8', 'value')], [hair, s('12', 'value')], [face, s('15', 'value')],
      [chest, s('18', 'value')], [body_, s('9', 'value')], [clothes, s('6', 'value')],
      [limbs, s('20', 'value')], [sexual, s('14', 'value')], [pose, s('7', 'value')],
      [extra, s('10', 'value')], [effects, s('13', 'value')], [scene, s('17', 'value')]
    ];
    const box: Record<string, HTMLTextAreaElement> = {
      global: global_, rating, character, hair, face, chest, body: body_, clothes, limbs, sexual, pose, extra, effects, scene
    };
    const { text: merged, loras } = BridgeShared.stripA1111Syntax(BridgeShared.mergedPromptText(prompt));
    const hasBoxes = BridgeShared.hasCategoryPrompts(prompt);
    if (!singleBox && !hasBoxes) {
      // Split before touching the form: the classifier awaits the tag list.
      const split = await BridgeShared.splitPromptToFields(merged);
      for (const el of Object.values(box)) el.value = '';
      for (const [id, text] of Object.entries(split)) if (box[id]) box[id].value = text;
      unifiedPromptMode.checked = false;
      unifiedPrompt.value = '';
    } else if (singleBox || !hasBoxes) {
      unifiedPromptMode.checked = true;
      unifiedPrompt.value = merged;
      global_.value = '';
      character.value = '';
      for (const [el] of perField) el.value = '';
    } else {
      unifiedPromptMode.checked = false;
      unifiedPrompt.value = '';
      global_.value = s('21', 'value');
      character.value = s('11', 'value');
      for (const [el, v] of perField) el.value = v;
    }
    characterTrigger.value = '';
    applyUnifiedPromptModeUI();
    negative.value = BridgeShared.stripA1111Syntax(s('16', 'text')).text;
    return loras;
  }

  function logDroppedLoras(loras: string[]) {
    if (loras.length) log('Left out A1111 LoRA tags ComfyUI can\'t use (add them as LoRAs instead): ' + loras.join(', ') + '.');
  }

  // "Use these prompts" (gallery info panel): only the prompt fields change;
  // models, LoRAs, sampler, seeds, size, passes and upscale stay as they are.
  async function applyImportedPromptsOnly(prompt: Record<string, any>) {
    logDroppedLoras(await applySavedPromptText(prompt, unifiedPromptMode.checked));
    autoGrowAll();
    void refreshSavePreview();
    scheduleUiSave();
  }

  // A generation made elsewhere (mirrors desktop's applyForeignGeneration).
  async function applyForeignGeneration(prompt: Record<string, any>) {
    // Prompts only (the user's rule, mirrors desktop): other workflows'
    // model/LoRA setups vary too much; the details panel lists them instead.
    await applyImportedPromptsOnly(prompt);
  }

  async function applyImportedPrompt(prompt: Record<string, any>) {
    if (BridgeShared.foreignSource(prompt)) { await applyForeignGeneration(prompt); return; }
    // The user's prompt-box mode, before the reset puts it back to its default.
    const singleBox = unifiedPromptMode.checked;
    resetGenerationForm();
    const inp = (id: string) => (prompt[id] && prompt[id].inputs) || {};
    const s = (id: string, key: string) => { const v = inp(id)[key]; return v == null ? '' : String(v); };
    function setVal(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, v: string) { if (v !== '') el.value = v; }
    if (s('41', 'unet_name')) diffModel.value = s('41', 'unet_name');
    if (s('51', 'lora_name') && s('51', 'lora_name') !== 'None' && s('51', 'lora_name') !== 'Anima-n') mainLora.value = s('51', 'lora_name');
    if (s('248', 'strength_model')) mainLoraStrength.value = s('248', 'strength_model');
    if (s('249', 'clip_name')) clip.value = s('249', 'clip_name');
    if (s('47:46', 'vae_name')) vae.value = s('47:46', 'vae_name');

    const stackIds = [];
    if (prompt['237']) stackIds.push('237');
    for (const id of Object.keys(prompt)) {
      if (/^237_extra_\d+$/.test(id)) stackIds.push(id);
    }
    stackIds.sort((a, b) => (a === '237' ? -1 : b === '237' ? 1 : parseInt(a.split('_')[2], 10) - parseInt(b.split('_')[2], 10)));
    const rows = [];
    for (const id of stackIds) {
      const inputs = prompt[id].inputs;
      for (let i = 1; i <= 4; i++) {
        const slot = String(i).padStart(2, '0');
        const name = inputs['lora_' + slot];
        const str = inputs['strength_' + slot];
        if (name && name !== 'None') rows.push({ n: String(name), s: (typeof str === 'number') ? str : (parseFloat(str) || 0) });
      }
    }
    for (const r of rows) addLoraRow(r.n, r.s);

    if (prompt['240']) {
      skipRefImage.checked = false;
      lliteStrength.value = String(prompt['240'].inputs.strength != null ? prompt['240'].inputs.strength : 0);
      lliteStartPercent.value = String(prompt['240'].inputs.start_percent != null ? prompt['240'].inputs.start_percent : 0);
      lliteEndPercent.value = String(prompt['240'].inputs.end_percent != null ? prompt['240'].inputs.end_percent : 0);
      llitePreserveWrapper.checked = Boolean(prompt['240'].inputs.preserve_wrapper);
    } else {
      skipRefImage.checked = true;
    }
    applySkipRefImageUI();
    if (prompt['238']) {
      setVal(resizeFit, s('238', 'fit'));
      setVal(resizeMethod, s('238', 'method'));
    }

    logDroppedLoras(await applySavedPromptText(prompt, singleBox));

    setVal(sampler, s('168:167', 'sampler_name'));
    setVal(scheduler, s('158:53', 'scheduler') || s('195', 'scheduler'));
    if (s('158:53', 'steps')) steps1.value = s('158:53', 'steps');
    setVal(cfg1, s('158:54', 'cfg'));
    if (s('174:171', 'value')) width.value = s('174:171', 'value');
    if (s('174:172', 'value')) height.value = s('174:172', 'value');
    if (s('165', 'noise_seed')) seed1.value = s('165', 'noise_seed');

    if (prompt['195']) {
      use2Pass.checked = true;
      if (s('227', 'noise_seed')) seed2.value = s('227', 'noise_seed');
      if (s('195', 'steps')) steps2.value = s('195', 'steps');
      denoise2.value = String(prompt['195'].inputs.denoise != null ? prompt['195'].inputs.denoise : 0.6);
    } else {
      use2Pass.checked = false;
    }
    pass2Fields.style.display = use2Pass.checked ? '' : 'none';
    if (prompt['upscale_model_loader']) {
      upscaleEnabled.checked = true;
      upscaleModel.value = String(prompt['upscale_model_loader'].inputs.model_name != null ? prompt['upscale_model_loader'].inputs.model_name : '');
      if (prompt['upscale_scale_192']) {
        const sb = prompt['upscale_scale_192'].inputs.scale_by;
        upscaleScaleBy.value = String((typeof sb === 'number') ? sb : (parseFloat(sb) || 1));
      }
    }
    upscaleModelRow.style.display = upscaleEnabled.checked ? '' : 'none';
    const usduSaved = BridgeShared.usduSettingsFromPrompt(prompt);
    if (usduSaved) usdu.apply(Object.assign({}, usduSaved, { source: 'generated' }));
    usdu.setEnabled(!!usduSaved);
    // Programmatic fills fire no input events: re-fit the boxes, refresh the
    // File Namer preview and capture this state like a real edit would.
    autoGrowAll();
    void refreshSavePreview();
    scheduleUiSave();
  }

  // Applies a generation (gallery, Import lightbox, Metadata tab; mirrors
  // desktop's useGeneration): everything for this workflow's images, prompts
  // only for foreign ones or when asked.
  async function useGeneration(prompt: Record<string, any>, promptsOnly: boolean, from: string) {
    try {
      const foreign = BridgeShared.foreignSource(prompt);
      if (promptsOnly || foreign) {
        await applyImportedPromptsOnly(prompt);
        log(foreign && !promptsOnly
          ? 'Loaded the prompts from ' + from + ' (made with ' + foreign + ': prompts only).'
          : 'Loaded the prompts from ' + from + ' (other settings kept).');
      } else {
        await applyImportedPrompt(prompt);
        log('Loaded generation settings from ' + from + '.');
      }
    } catch (err) {
      log('Loading from ' + from + ' failed: ' + errMsg(err));
    }
  }

  // ---------------- LoRA tools (Metadata tab, details panels) ----------------
  // File info comes from the PC (the relay or Persist Comfy's runner reads the
  // LoRA through ComfyUI's own loras folders). Online lookups only ever
  // request BridgeShared.lookupUrl's fixed CivitAI / CivArchive API URLs, via
  // Capacitor's native HTTP (CivArchive sends no CORS headers); links open in
  // the system browser only for those two sites.
  function datalistValues(dl: HTMLDataListElement): string[] {
    return Array.from(dl.options || []).map((o) => o.value).filter(Boolean);
  }
  const loraTools = {
    localNames: () => Array.from(new Set([...datalistValues(loraList), ...datalistValues(mainLoraList)])),
    fileInfo: async (name: string) => {
      try {
        const res = await pcRequest('/internal/lora/info?name=' + encodeURIComponent(name), 30000, 2);
        const parsed = JSON.parse(new TextDecoder().decode(res.body) || '{}');
        if (res.status === 200 && parsed.ok) return { ok: true, info: parsed.info };
        return { ok: false, error: (parsed.error && parsed.error.message) || (res.status === 404 ? 'File info needs a PC running Comfy Bridge (or Persist Comfy) as the host.' : 'HTTP ' + res.status) };
      } catch (err) {
        return { ok: false, error: 'Could not reach the PC: ' + errMsg(err) };
      }
    },
    // Download to PC: the PC's runner fetches the LoRA (relay or Persist
    // Comfy's share server; both refuse set_keys — keys are set on the PC).
    // A download start isn't retried (a lost reply would start it twice).
    loraOp: async (payload: Record<string, unknown>) => {
      try {
        const body = new TextEncoder().encode(JSON.stringify(payload));
        const res = await pcRequestPost('/internal/lora/op', body, payload.op === 'download' ? 1 : 2);
        const parsed = JSON.parse(new TextDecoder().decode(res.body) || '{}');
        if (res.status === 200 && parsed.ok) return parsed;
        return { ok: false, error: (parsed.error && parsed.error.message) || (res.status === 404 ? 'Downloads need a PC running Comfy Bridge (or Persist Comfy) as the host.' : 'HTTP ' + res.status) };
      } catch (err) {
        return { ok: false, error: 'Could not reach the PC: ' + errMsg(err) };
      }
    },
    onLoraDownloaded: () => { btnRefreshModels.click(); },
    onlineLookup: async (site: string, kind: string, q: string) => {
      const url = BridgeShared.lookupUrl(site, kind, q);
      if (!url) return { ok: false, error: 'Nothing to look up.' };
      try {
        const http = window.Capacitor && window.Capacitor.Plugins && (window.Capacitor.Plugins as any).CapacitorHttp;
        if (http) {
          const r = await http.request({ url, method: 'GET', headers: { Accept: 'application/json' }, connectTimeout: 15000, readTimeout: 15000 });
          const json = typeof r.data === 'string' ? (() => { try { return JSON.parse(r.data); } catch (e) { return null; } })() : r.data;
          return { ok: true, status: r.status, json };
        }
        // No native HTTP (browser harness): CivitAI allows CORS, CivArchive doesn't.
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        return { ok: true, status: res.status, json: await res.json().catch(() => null) };
      } catch (err) {
        return { ok: false, error: errMsg(err) };
      }
    },
    // A hit's preview (already previewImageUrl-checked: https, no bare IPs or
    // local names), fetched natively, image types only, 3 MB at most.
    previewImage: async (url: string) => {
      const http = window.Capacitor && window.Capacitor.Plugins && (window.Capacitor.Plugins as any).CapacitorHttp;
      if (!http) return null;
      try {
        const r = await http.request({ url, method: 'GET', responseType: 'blob', headers: { Accept: 'image/*' }, connectTimeout: 15000, readTimeout: 15000 });
        const headers = r.headers || {};
        const typeKey = Object.keys(headers).find((k) => k.toLowerCase() === 'content-type');
        const type = String(typeKey ? headers[typeKey] : '').split(';')[0].trim().toLowerCase();
        if (r.status !== 200 || !/^image\/(jpeg|png|webp|gif|avif)$/.test(type) || typeof r.data !== 'string' || r.data.length > 4 * 1024 * 1024) return null;
        return 'data:' + type + ';base64,' + r.data.replace(/\s+/g, '');
      } catch (e) { return null; }
    },
    openLink: (url: string) => {
      const safe = BridgeShared.safeLookupLink(url);
      if (safe) window.open(safe, '_blank');
    },
    addToStack: (name: string, strength: number) => {
      // The first empty row first (the stack starts with a blank one).
      const empty = loraRows.find((r) => !r.input.value.trim());
      if (empty) { empty.input.value = name; empty.strength.value = String(strength); }
      else addLoraRow(name, strength);
      scheduleUiSave();
      log('Added ' + name + ' @ ' + strength + ' to the LoRA stack.');
    }
  };
  const IMPORT_LABELS = { full: 'Import Generation', prompts: 'Use prompts only' };

  // A picked image as a data URL + its generation (null when none).
  async function readPickedImage(file: File): Promise<{ src: string; info: { prompt: Record<string, any>; kind: null } | null }> {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const prompt = BridgeShared.normalizeGeneration(BridgeShared.imageMetadataTexts(bytes));
    return { src: 'data:' + (sniffImageMime(bytes) || 'image/png') + ';base64,' + BridgeShared.bytesToBase64(bytes), info: prompt ? { prompt, kind: null } : null };
  }

  // Import Generation (main UI shortcut): any image → the details lightbox
  // (Details behind the top-left button, like the gallery's) → "Import
  // Generation" or "Use prompts only".
  btnImportGen.addEventListener('click', () => importFileInput.click());
  importFileInput.addEventListener('change', async () => {
    const file = importFileInput.files && importFileInput.files[0];
    importFileInput.value = '';
    if (!file) return;
    try {
      const picked = await readPickedImage(file);
      if (!picked.info) { alert('No generation settings found in that image — it may have been re-saved or stripped by another tool.'); return; }
      BridgeShared.showImageLightbox(picked.src, undefined, (src, close) => BridgeShared.buildGenInfoPanel(src, (prompt, promptsOnly) => {
        close();
        void useGeneration(prompt, promptsOnly, 'the imported image');
      }, '', undefined, { loraTools, labels: IMPORT_LABELS, info: picked.info }), true);
    } catch (e) {
      log('Import failed: ' + errMsg(e));
    }
  });

  // ---------------- Generate | Metadata tabs ----------------
  const appTabs = $<HTMLElement>('appTabs');
  const colEl = $<HTMLElement>('col');
  const metadataView = $<HTMLElement>('metadataView');
  const compareView = $<HTMLElement>('compareView');
  const usduView = $<HTMLElement>('usduView');
  const metaFileInput = $<HTMLInputElement>('metaFileInput');
  function showTab(tab: string) {
    colEl.hidden = tab !== 'generate';
    usduView.hidden = tab !== 'upscale';
    metadataView.hidden = tab !== 'metadata';
    compareView.hidden = tab !== 'compare';
    if (tab === 'compare') compare.onShow();
    appTabs.querySelectorAll<HTMLButtonElement>('button[data-tab]').forEach((b) => {
      const on = b.dataset.tab === tab;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', String(on));
    });
    window.scrollTo(0, 0);
  }
  appTabs.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-tab]');
    if (b && b.dataset.tab) showTab(b.dataset.tab);
  });
  let metaPicked: { src: string; info: { prompt: Record<string, any>; kind: null } | null } | null = null;
  BridgeShared.mountMetadataTab($<HTMLElement>('metadataTab'), {
    tools: loraTools,
    pickImage: () => new Promise<string | null>((resolve) => {
      metaFileInput.onchange = async () => {
        const file = metaFileInput.files && metaFileInput.files[0];
        metaFileInput.value = '';
        if (!file) { resolve(null); return; }
        try { metaPicked = await readPickedImage(file); resolve(metaPicked.src); }
        catch (e) { log('Could not read the image: ' + errMsg(e)); resolve(null); }
      };
      metaFileInput.click();
    }),
    details: (src) => BridgeShared.buildGenInfoPanel(src, (prompt, promptsOnly) => {
      showTab('generate');
      void useGeneration(prompt, promptsOnly, 'the Metadata tab');
    }, '', undefined, { loraTools, labels: IMPORT_LABELS, info: metaPicked && metaPicked.src === src ? metaPicked.info : undefined })
  });

  // Gallery tab + Compare: the phone's save location or the PC's folder
  // (like the gallery's source switch); details are the gallery's panel.
  const compare = BridgeShared.mountCompareTab($<HTMLElement>('compareTab'), {
    sources: [
      { label: 'Phone', backend: () => mobileBackend() },
      { label: 'PC', backend: () => pcGalleryBackend(), thumbSrc: pcThumbSrc, fullSrc: pcFullSrc }
    ],
    pickFile: () => new Promise<string | null>((resolve) => {
      metaFileInput.onchange = async () => {
        const file = metaFileInput.files && metaFileInput.files[0];
        metaFileInput.value = '';
        if (!file) { resolve(null); return; }
        try { resolve((await readPickedImage(file)).src); }
        catch (e) { log('Could not read the image: ' + errMsg(e)); resolve(null); }
      };
      metaFileInput.click();
    }),
    details: (src, relPath, close) => BridgeShared.buildGenInfoPanel(src, (prompt, promptsOnly) => {
      if (close) close();
      showTab('generate');
      void useGeneration(prompt, promptsOnly, 'the Gallery tab');
    }, relPath, undefined, { loraTools }),
    lazyInfo: true
  });

  // ---------------- UI state persistence ----------------
  // Every field survives restarts (parity with the desktop Bridge): model
  // picks, LoRA stack, prompts, resolution, sampling, 2-Pass, upscale —
  // debounced snapshot on any edit, restored once here after defaults.
  var UI_STATE_KEY = 'comfybridge-ui-state';
  function captureUiState() {
    const state: Record<string, any> = {};
    document.querySelectorAll<HTMLInputElement>('input,select,textarea').forEach(function (el) {
      if (!el.id) return;
      if (el.type === 'checkbox') state[el.id] = el.checked;
      else state[el.id] = el.value;
    });
    state[':loraRows'] = loraRows.map(function (r) { return { n: r.input.value, s: r.strength.value }; });
    try { localStorage.setItem(UI_STATE_KEY, JSON.stringify(state)); } catch (e) { /* best effort */ }
  }
  function restoreUiState() {
    let state: Record<string, any>;
    try { state = JSON.parse(localStorage.getItem(UI_STATE_KEY) || '{}'); } catch (e) { return; }
    document.querySelectorAll<HTMLInputElement>('input,select,textarea').forEach(function (el) {
      if (!el.id || !(el.id in state)) return;
      const v = state[el.id];
      if (typeof v !== 'string' && typeof v !== 'boolean') return;
      if (el.type === 'checkbox') el.checked = Boolean(v);
      else if (typeof v === 'string') el.value = v;
    });
    const loras = state[':loraRows'];
    if (Array.isArray(loras) && loras.length) {
      for (const r of loraRows.slice()) {
        loraRows = loraRows.filter((x) => x !== r);
        r.row.remove();
      }
      for (const l of loras) addLoraRow(String(l.n != null ? l.n : ''), Number(l.s != null ? l.s : 1) || 1);
    }
    applySkipRefImageUI();
    applyUnifiedPromptModeUI();
    pass2Fields.style.display = use2Pass.checked ? '' : 'none';
    upscaleModelRow.style.display = upscaleEnabled.checked ? '' : 'none';
    usdu.refresh();
    usduImp.refresh();
  }
  var uiSaveTimer: ReturnType<typeof setTimeout> | null = null;
  function scheduleUiSave() {
    if (uiSaveTimer) clearTimeout(uiSaveTimer);
    uiSaveTimer = setTimeout(captureUiState, 250);
  }
  document.addEventListener('input', scheduleUiSave, true);
  document.addEventListener('change', scheduleUiSave, true);
  // Note: restoreUiState()/captureUiState() are invoked in the Init section
  // below, AFTER the preset selects are populated — the selects need their
  // options present before stored values can be re-applied.

  // ---------------- Init ----------------

  // Themes: 25 Osmium palettes ship inside shared.js (single source with
  // the desktop shell) — colors only, applied as CSS variables, picker
  // popover in the topbar. Persisted per-device via comfybridge-theme.
  BridgeShared.initTheme(BridgeShared.THEMES, BridgeShared.DEFAULT_THEME);
  BridgeShared.mountThemePicker({ wrap: 'themeWrap', btn: 'themeBtn', btnLabel: 'themeBtnLabel', menu: 'themeMenu' });
  BridgeShared.initTagWiki($<HTMLButtonElement>('btnTagWiki'));
  BridgeShared.attachPickerModal(diffModel, 'Diffusion model', () => BridgeShared.optionsFromDatalist(diffModelList));
  BridgeShared.attachPickerModal(clip, 'CLIP', () => BridgeShared.optionsFromDatalist(clipList));
  BridgeShared.attachPickerModal(vae, 'VAE', () => BridgeShared.optionsFromDatalist(vaeList));
  BridgeShared.attachPickerModal(mainLora, 'Main LoRA', () => BridgeShared.optionsFromDatalist(mainLoraList));
  BridgeShared.attachPickerModal(upscaleModel, 'Upscale model', () => BridgeShared.optionsFromDatalist(upscaleModelList));
  // Sampler/scheduler pickers: real option stores, same tap-to-pick modal
  // as the model fields — source is the host's KSampler object_info (the
  // canonical ComfyUI lists), fetched once at startup and refreshable via
  // refreshSamplerLists() from the Refresh model lists button.
  BridgeShared.attachPickerModal(sampler, 'Sampler', () => bridgeSamplerOptions);
  BridgeShared.attachPickerModal(scheduler, 'Scheduler', () => bridgeSchedulerOptions);
  let bridgeSamplerOptions: string[] = [];
  let bridgeSchedulerOptions: string[] = [];
  async function refreshSamplerLists() {
    const res = await comfyGetObjectInfo('KSampler', 'sampler_name');
    if (res.ok) bridgeSamplerOptions = res.values;
    const res2 = await comfyGetObjectInfo('KSampler', 'scheduler');
    if (res2.ok) bridgeSchedulerOptions = res2.values;
  }
  initSafRoot();
  refreshSamplerLists();
  refreshPresetLists();
  restoreUiState();
  captureUiState();
  log('Comfy Bridge (mobile) ready. Enter your PC\'s ComfyUI address and Generate.');
})();
