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
  BridgeStorage?: any;
  Filesystem?: any;
  GenProgress?: any;
  LocalNotifications?: any;
}
interface Window {
  Capacitor?: { Plugins?: CapacitorPlugins };
}
declare const BridgeShared: {
  buildSynthDatPrompt: (template: any, cfg: any) => any;
  parseComboValues: (nodeInfo: any, inputName: string) => string[] | null;
  parseQueueResponse: (parsed: any, status: number, noun: string) => { ok: boolean; promptId?: string; error?: string };
  uploadImage: (t: any, host: string, filename: string, bytes: Uint8Array, label?: string) => Promise<{ ok: boolean; ref?: string; error?: string }>;
  queuePrompt: (t: any, host: string, prompt: any, clientId: string, opts?: any) => Promise<{ ok: boolean; promptId?: string; error?: string }>;
  pollHistory: (t: any, host: string, promptId: string, opts: any) => Promise<{ ok: boolean; value?: any; error?: string; interrupted?: boolean }>;
  extractPngTextChunks: (bytes: Uint8Array, inflate?: (d: Uint8Array) => Uint8Array) => Record<string, string>;
  bytesToBase64: (bytes: Uint8Array) => string;
  nextFileNumber: (backend: any) => Promise<number>;
  optionsFromDatalist: (datalist: any) => string[];
  attachPickerModal: (input: any, title: string, getOptions: () => any) => void;
  initTheme: (themes: any, def: any) => void;
  mountThemePicker: (opts: any) => void;
  mountGallerySidebar: (backend: any, label: any) => any;
  showImageLightbox: (src: string) => void;
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

  const host = $<HTMLInputElement>('host');
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
  } catch (e) { /* best effort */ }
  host.addEventListener('change', function () {
    try { localStorage.setItem(HOST_KEY, (host.value || '').trim()); } catch (e) { /* best effort */ }
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
        GenProgress.addListener('cancelRequested', () => comfyStopGeneration());
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

  function resetGenNotificationState() {
    genPassCount = use2Pass.checked ? 2 : 1;
    genTotalStages = genPassCount + ((upscaleEnabled.checked && upscaleModel.value.trim()) ? 1 : 0);
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
    genStatus.textContent = 'Generating… step ' + value + '/' + max;
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
  BridgeShared.mountGallerySidebar(mobileBackend, saveLocationLabelText);


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
  async function comfyGetObjectInfo(classType: string, inputName: string): Promise<ObjectInfoResult> {
    try {
      const res = await fetch(new URL('/object_info/' + encodeURIComponent(classType), getHost()));
      if (!res.ok) return { ok: false, error: 'ComfyUI returned HTTP ' + res.status + ' looking up ' + classType + '.' };
      const parsed = await res.json();
      const values = BridgeShared.parseComboValues(parsed[classType], inputName);
      if (!Array.isArray(values)) return { ok: false, error: 'Could not find "' + inputName + '" on ' + classType + '.' };
      return { ok: true, values };
    } catch (err) {
      return { ok: false, error: 'Could not reach ComfyUI at ' + getHost() + (isLikelyCorsFailure(err) ? corsHint() : ' (' + errMsg(err) + ')') };
    }
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
        let stallTimer: ReturnType<typeof setTimeout> | undefined;
        const armStall = () => {
          if (!init.timeoutMs) return;
          clearTimeout(stallTimer);
          stallTimer = setTimeout(() => { xhr.abort(); reject(new Error('no response for ' + Math.round(init.timeoutMs / 1000) + 's')); }, init.timeoutMs);
        };
        const onAbort = () => { xhr.abort(); reject(new DOMException('Stopped', 'AbortError')); };
        const done = () => { clearTimeout(stallTimer); signal?.removeEventListener('abort', onAbort); };
        if (signal?.aborted) { reject(new DOMException('Stopped', 'AbortError')); return; }
        signal?.addEventListener('abort', onAbort, { once: true });
        if (onUploadProgress && init.body) {
          xhr.upload.onprogress = (ev) => { armStall(); if (ev.lengthComputable) onUploadProgress(ev.loaded, ev.total); };
        }
        xhr.onload = () => { done(); resolve({ status: xhr.status, body: new Uint8Array(xhr.response || new ArrayBuffer(0)) }); };
        xhr.onerror = () => { done(); reject(new Error('network error')); };
        armStall();
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
        const wsUrl = getHost().replace(/^http/i, 'ws') + '/ws?clientId=' + encodeURIComponent(clientId);
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
    if (!file) return;
    let bytes: Uint8Array;
    try { bytes = new Uint8Array(await file.arrayBuffer()); }
    catch (err) { log('Couldn\'t read that image (' + errMsg(err) + ') — try picking it again.'); return; }
    refFile = file;
    refBytes = bytes;
    refFilename = file.name;
    refFileName.textContent = file.name;
    refPreview.src = URL.createObjectURL(file);
    refPreview.style.display = 'block';
  });

  // ---------------- Toggles ----------------

  function applyUnifiedPromptModeUI() {
    const unified = unifiedPromptMode.checked;
    unifiedPromptRow.style.display = unified ? '' : 'none';
    splitFieldsGroup.style.display = unified ? 'none' : '';
    // A textarea measures scrollHeight 0 while display:none, so whichever
    // side just became visible needs a fresh autoGrow.
    autoGrowAll();
  }
  unifiedPromptMode.addEventListener('change', applyUnifiedPromptModeUI);
  applyUnifiedPromptModeUI();

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

  upscaleEnabled.addEventListener('change', () => { upscaleModelRow.style.display = upscaleEnabled.checked ? '' : 'none'; });
  upscaleModelRow.style.display = upscaleEnabled.checked ? '' : 'none';

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
    } else {
      connStatus.style.color = '';
      connStatus.textContent = res.error;
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
      log(res.error);
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
    return BridgeShared.buildSynthDatPrompt(template, {
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
      clip: clip.value,
      vae: vae.value,
      loraRows: loraRows.map(function (r) { return { input: r.input.value, strength: r.strength.value }; }),
      noLoraStandIn: 'Anima-n',
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
      upscale: { enabled: upscaleEnabled.checked, model: upscaleModel.value, scaleBy: upscaleScaleBy.value }
    });
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

  let generating = false;

  async function generate() {
    if (generating) return;
    if (!skipRefImage.checked && !refBytes) { log('Pick a reference image first (or check "No reference image").'); return; }
    await loadTemplate();
    generating = true;
    try { await runGeneration(); }
    catch (err) {
      genStatus.style.display = 'block';
      genStatus.textContent = 'Generation failed: ' + errMsg(err);
      log('Generation failed: ' + errMsg(err));
      finalizeGenNotification('Generation failed', errMsg(err));
    } finally {
      // Whatever happened, never leave the UI wedged in "Generating…".
      generating = false;
      btnGenerate.disabled = false;
      btnStop.disabled = true;
      livePreviewWrap.style.display = 'none';
    }
  }

  async function runGeneration() {
    btnGenerate.disabled = true;
    btnStop.disabled = false;
    livePreview.src = '';
    livePreviewWrap.style.display = 'none';
    genStatus.style.display = 'block';
    genStatus.textContent = 'Generating… this can take a while.';

    resetGenNotificationState();
    if (await ensureGenNotifReady()) {
      postGenNotification({ title: genStageLabel(1) + ' (1/' + genTotalStages + ')', body: 'Starting…', progress: 0, max: 0, indeterminate: true, showCancel: true });
    }

    const prompt = buildPrompt();
    const bytes = skipRefImage.checked ? null : refBytes;

    const res = await comfyQueueAndFetch(skipRefImage.checked ? null : refFilename, bytes, prompt);
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
          // Bytes are already in memory, so this just re-runs Generate with
          // the same settings — the upload is its first step.
          retry.addEventListener('click', () => { retry.remove(); generate(); });
          genStatus.appendChild(retry);
        }
      }
      return;
    }
    genStatus.style.display = 'none';

    // Save with the SAME name/scheme ComfyUI's SaveImage used (File Namer
    // prefix chain), mirrored inside the chosen save folder — flat "N.png"
    // numbering stays only as a fallback for server shapes without paths.
    // Both copies share ComfyUI's own counter; no second counting pass.
    const fallbackN = async () => await BridgeShared.nextFileNumber(mobileBackend());
    let saveFailed = false;
    const slides: { label: string; bytes: Uint8Array }[] = [];
    if (res.pass1ImageBytes) {
      if (!(await saveBytes(res.pass1ImageBytes, res.pass1SaveRel || (await fallbackN()) + '_pass1.png'))) saveFailed = true;
      slides.push({ label: 'Pass 1', bytes: res.pass1ImageBytes });
    }
    if (res.imageBytes) {
      if (!(await saveBytes(res.imageBytes, res.saveRel || (await fallbackN()) + '.png'))) saveFailed = true;
      slides.push({ label: res.pass1ImageBytes ? 'Pass 2' : 'Pass 1', bytes: res.imageBytes });
    }
    if (res.upscaledImageBytes) {
      if (!(await saveBytes(res.upscaledImageBytes, res.upscaledSaveRel || (await fallbackN()) + '_upscaled.png'))) saveFailed = true;
      slides.push({ label: 'Upscaled', bytes: res.upscaledImageBytes });
    }
    if (saveFailed) {
      genStatus.style.display = 'block';
      genStatus.textContent = 'Generated, but saving failed — see Log for details.';
    }
    finalizeGenNotification(saveFailed ? 'Generated, but saving failed' : 'Generation complete', slides.map((s) => s.label).join(', '));
    setPreviewSlides(slides);
  }

  btnGenerate.addEventListener('click', generate);
  btnStop.addEventListener('click', comfyStopGeneration);

  // ---------------- Import generation ----------------
  // Same feature as the desktop Bridge: read a PNG saved by the integrated
  // workflow and re-enter its full generation config. WebView file input +
  // the chunk walk shared with the desktop Bridge (BridgeShared.
  // extractPngTextChunks, ComfyUI embeds the queued prompt graph as a tEXt/
  // iTXt chunk named "prompt"). The compressed-iTXt inflate stays unsupported
  // in this WebView (ComfyUI writes the prompt chunk uncompressed), so no
  // inflate is passed. Field mapping mirrors desktop's applyImportedPrompt
  // (same template node ids either side).
  function extractPngPromptChunks(buffer: ArrayBuffer): Record<string, string> {
    return BridgeShared.extractPngTextChunks(new Uint8Array(buffer));
  }

  // Every field applyImportedPrompt can touch, reset to blank/default first
  // — same reasoning as desktop's resetGenerationForm. Without this,
  // importing a generation that didn't use a 2nd pass or a LoRA stack left
  // whatever was already in those fields, silently mixing old and new
  // settings.
  const RESET_TEXT_FIELDS = [
    diffModel, clip, vae, mainLora,
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

  function applyImportedPrompt(prompt: Record<string, any>) {
    resetGenerationForm();
    const inp = (id: string) => (prompt[id] && prompt[id].inputs) || {};
    const s = (id: string, key: string) => { const v = inp(id)[key]; return v == null ? '' : String(v); };
    function setVal(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, v: string) { if (v !== '') el.value = v; }
    if (s('41', 'unet_name')) diffModel.value = s('41', 'unet_name');
    if (s('51', 'lora_name') && s('51', 'lora_name') !== 'None' && s('51', 'lora_name') !== 'Anima-n') mainLora.value = s('51', 'lora_name');
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

    setVal(global_, s('21', 'value'));
    const perField: [HTMLTextAreaElement, string][] = [
      [rating, s('8', 'value')], [hair, s('12', 'value')], [face, s('15', 'value')],
      [chest, s('18', 'value')], [body_, s('9', 'value')], [clothes, s('6', 'value')],
      [limbs, s('20', 'value')], [sexual, s('14', 'value')], [pose, s('7', 'value')],
      [extra, s('10', 'value')], [effects, s('13', 'value')], [scene, s('17', 'value')]
    ];
    const charVal = s('11', 'value');
    const hasPerField = perField.some(([, v]) => v);
    if (!hasPerField && s('21', 'value')) {
      unifiedPromptMode.checked = true;
      unifiedPrompt.value = s('21', 'value');
      character.value = charVal;
    } else {
      unifiedPromptMode.checked = false;
      unifiedPrompt.value = '';
      character.value = charVal;
      for (const [el, v] of perField) setVal(el, v);
    }
    applyUnifiedPromptModeUI();
    setVal(negative, prompt['16'] && prompt['16'].inputs ? String(prompt['16'].inputs.text != null ? prompt['16'].inputs.text : '') : '');

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
    scheduleUiSave();
  }

  btnImportGen.addEventListener('click', () => importFileInput.click());
  importFileInput.addEventListener('change', async () => {
    const file = importFileInput.files && importFileInput.files[0];
    if (!file) return;
    try {
      const chunks = extractPngPromptChunks(await file.arrayBuffer());
      const raw = chunks.prompt;
      if (!raw) { alert('No embedded prompt metadata in that PNG — it may have been re-saved or stripped by another tool.'); return; }
      const prompt = JSON.parse(raw);
      for (const id of ['41', '51', '158:53', '158:54', '165']) {
        if (!prompt[id] || !prompt[id].inputs) {
          alert('That image was not generated with the integrated workflow (missing node "' + id + '").');
          return;
        }
      }
      applyImportedPrompt(prompt);
      log('Imported generation settings from PNG.');
    } catch (e) {
      log('Import failed: ' + errMsg(e));
    }
    importFileInput.value = '';
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
