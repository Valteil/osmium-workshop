# Comfy Bridge — Android port

Single vertical scrollable page (no desktop 3-column layout), same generation
feature set as the desktop app: full prompt fields, prompt/negative presets,
models/LoRA stack, ControlNet, 1-Pass/2-Pass (both saved), optional
model-based upscale.

## Shared code with desktop

Gallery sidebar, model picker modals, and the image lightbox are byte-identical
on both platforms — they live once in `comfy-bridge/src/renderer/shared/*.ts`
(+ `shared.css`) and are consumed two ways: desktop imports them directly into
its esbuild bundle; mobile loads the IIFE bundle `www/shared.js` (built by
`npm run build:shared` from the `comfy-bridge/` root — do not hand-edit it,
nor `www/shared.css`). `www/app.js` stays hand-written mobile shell code
(direct-fetch ComfyUI, SAF/Documents storage) calling into `BridgeShared`.
Only the storage backend differs per platform (SAF/Documents on mobile,
Electron IPC on desktop) — mobile-only APIs never appear in the desktop
bundle and vice versa (verified by grep on both outputs).

## Building

```bash
cd comfy-bridge            # NOT things-to-add (that staging dir is gone — mobile lives here now)
npm run build:shared       # shared.js + shared.css into mobile/www/ (and renderer/)
cd mobile
npm install
npx cap sync android
cd android
./gradlew assembleDebug  # -> android/app/build/outputs/apk/debug/app-debug.apk
```

## What's different from desktop

- **No Electron IPC** — every ComfyUI call (`/object_info`, `/upload/image`,
  `/prompt`, `/history`, `/view`, the `/ws` preview socket) goes straight
  from the WebView via `fetch()`/`WebSocket`, same approach as the parent
  Dataset Manager Studio project's `src/renderer/comfy-client.ts`. Enter your
  PC's LAN address (e.g. `http://192.168.1.50:8188`), not `127.0.0.1` —
  that means "this phone" here, not your PC.
- **ComfyUI must be reachable as a remote URL**: enter a LAN IP
  (`http://192.168.x.x:8188`), hotspot gateway IP, or Tailscale IP/hostname
  (`http://100.x.y.z:8188`) — not `127.0.0.1`, which means "this phone" here.
  Start it with `--listen 0.0.0.0 --enable-cors-header --port 8188` and make
  sure Windows Firewall allows inbound TCP 8188 from other devices on your
  network. Loading the address in the phone's browser does NOT prove the app
  can reach it (top-level navigation needs no CORS/mixed-content allowance;
  the app's `fetch()` from its `https://localhost` WebView needs both) —
  use the app's own "Test connection" button as the real check.
- **Save location is user-pickable** — "Pick folder…" opens Android's Storage
  Access Framework picker (any folder on the device) via the `BridgeStorage`
  native plugin (ported from the parent app's `DtsStorage` plugin — same
  method surface, renamed; needs the Kotlin plugin + `documentfile`
  dependency, already wired in `android/`). The grant persists across
  restarts; "Use default" falls back to `Documents/` itself via the
  Filesystem plugin. Generations save directly into the active root — the
  app never creates its own subfolder; subfolders are only ever read.
  (`Pictures/` isn't reachable through `@capacitor/filesystem`'s Directory
  enum, which is also why saves silently failed before this — every call
  used an invalid `DIRECTORY_PICTURES` constant.)
- **Gallery sidebar** — a FAB opens an off-canvas panel sliding in from the
  right (× or backdrop closes it) showing a live recursive scan of the save
  location, grouped under per-subfolder headers (root files under "This
  folder"), newest numbers first. The folder itself is the source of truth
  — no separate history list, no entry cap — so entries survive
  save-location changes and app-data clears. Tap a thumbnail (or the main
  preview) for a screen-dimming lightbox with pinch/wheel zoom (1×–6×) and
  drag pan, clamped so the image edge never passes the viewport edge
  (ported from the parent app's `showImageLightbox()`).
- **Filenames are sequential per folder** — `1.png`, `2.png`, … (no padding;
  2-Pass saves `N_pass1.png` + `N.png`), counted from the save root's own
  files. Subfolders have independent numbering.
- **Model pickers are dedicated search modals**, not inputs or dropdowns —
  each model field is a readonly tap-target opening a full modal with its
  own search box (prefix-first, then substring) plus a Clear row, so lists
  never compete with the keyboard. The `<datalist>` elements remain purely
  as option stores.
- **Launcher icon** — `mipmap-*/ic_launcher*.png` (all 5 densities, legacy +
  round + adaptive foreground) generated from `comfy-bridge/build/icon.png`
  via Pillow.
- **No live "upscale models from disk"** — that trick only works because the
  desktop app runs on the SAME machine as ComfyUI. On mobile, the upscale
  model list is fetched live from ComfyUI's own `/object_info` instead
  (same mechanism as every other model/LoRA dropdown here) — refresh with
  "Refresh model lists".
- **Presets persist to `localStorage`**, not a userData JSON file — same
  data shape as desktop's presets feature (prompt presets = every field
  except Negative; negative presets kept separate).
- Reference image comes from a plain `<input type="file">` (no
  `showOpenFilePicker` in a WebView).

Requires `ANDROID_HOME`/`ANDROID_SDK_ROOT` set (already configured on this
machine — same SDK the main project's `mobile/` folder builds against).

After `cap add android`, two native fixes are required so plain-`http://`
remote URLs work from the app's `https://localhost` WebView (both already
applied in the checked-in `android/` — only needed again if regenerating it):
`MainActivity.java` sets `MIXED_CONTENT_ALWAYS_ALLOW` (WebView layer), and
`AndroidManifest.xml` sets `usesCleartextTraffic="true"` +
`networkSecurityConfig="@xml/network_security_config"` with
`res/xml/network_security_config.xml` allowing cleartext app-wide (OS layer).
(Same two-layer requirement as the main project's own `mobile/android`.)

## Status

Self-contained Capacitor project (own `package.json`, own `android/`) sharing
the gallery/picker/lightbox UI with the desktop build via `npm run build:shared`
(see above) — mobile-only code (SAF/Documents storage, direct-fetch ComfyUI)
never enters the desktop bundle and vice versa.
