const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const WS = require('ws');

// ---- Portable mode ----
// A packaged build stores everything (the renderer's live "tool" copy, plus
// Chromium's own profile data — which is where localStorage physically
// lives, so this covers themes/achievements/settings too) in a `data/`
// folder next to the actual executable, instead of %APPDATA%. That's what
// makes the built app a true carry-around folder: unzip it anywhere, run
// it from a USB stick, delete it when done, and nothing is left behind
// on the machine.
//
// In dev (`npm start`, unpackaged) this intentionally does nothing — the
// existing %APPDATA%\dataset-tag-studio\tool workflow (sync-tool-folder.js,
// the Restart app button) keeps working exactly as before.
function getPortableRoot() {
  // Dev (`npm start`, unpackaged): app.getPath('exe') points at the electron
  // binary buried in node_modules/electron/dist, not this project — anything
  // "portable-root-relative" should resolve to the project root instead.
  if (!app.isPackaged) return __dirname;
  // electron-builder's NSIS "portable" target self-extracts to a temp
  // folder on every launch and can't be written back to — it sets this env
  // var specifically so apps know where the actual portable .exe lives.
  if (process.env.PORTABLE_EXECUTABLE_DIR) return process.env.PORTABLE_EXECUTABLE_DIR;
  // AppImage's equivalent: $APPIMAGE is the path to the .AppImage file itself.
  if (process.env.APPIMAGE) return path.dirname(process.env.APPIMAGE);
  // Any other packaged target (e.g. an unpacked "dir" build): the exe's own folder.
  return path.dirname(app.getPath('exe'));
}

function configurePortableUserData() {
  if (!app.isPackaged) return;
  // macOS apps aren't expected to carry their own data next to the binary
  // (writing inside a signed .app bundle is asking for trouble) — portable
  // mode here targets Windows/Linux, where end users actually want a
  // carry-around folder. Mac keeps Electron's normal per-user data dir.
  if (process.platform === 'darwin') return;
  const portableDataDir = path.join(getPortableRoot(), 'data');
  fs.mkdirSync(portableDataDir, { recursive: true });
  app.setPath('userData', portableDataDir);
}
configurePortableUserData();

// ---- Hardware acceleration preference (Settings toggle) ----
// Measured: this app's own UI compositing was costing ~30% GPU load on a
// laptop's DISCRETE GPU — the same GPU ComfyUI needs for actual inference —
// even though nothing here does anything GPU-heavy. Default behavior steers
// rendering onto the INTEGRATED GPU instead (still hardware-accelerated,
// just on the weaker/power-saving adapter); a Settings toggle lets anyone
// with a GPU they don't mind this app using turn that off, or disable GPU
// acceleration entirely.
//
// This can only be decided at Electron startup, before `app.whenReady()`/
// any window creation — there is no way to change it live without a
// relaunch, which is why the preference lives in its own tiny file the MAIN
// process reads directly, not in the renderer's localStorage (which the
// main process can't reach before a window/webview even exists yet). The
// renderer's Settings toggle just writes this file and prompts a restart —
// see `restartApp()`'s existing flow.
const HW_ACCEL_PREF_FILE = () => path.join(app.getPath('userData'), 'hw-accel-pref.json');

function readHardwareAccelPref() {
  try {
    const raw = fs.readFileSync(HW_ACCEL_PREF_FILE(), 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.enabled === 'boolean' ? parsed.enabled : true;
  } catch (err) {
    return true; // default: on (integrated-GPU-steered, see below)
  }
}

function writeHardwareAccelPref(enabled) {
  try {
    fs.mkdirSync(path.dirname(HW_ACCEL_PREF_FILE()), { recursive: true });
    fs.writeFileSync(HW_ACCEL_PREF_FILE(), JSON.stringify({ enabled: !!enabled }));
  } catch (err) {
    // Non-fatal — worst case the toggle doesn't persist across a restart.
  }
}

const hardwareAccelEnabled = readHardwareAccelPref();

if (!hardwareAccelEnabled) {
  // The literal "off" case some users want when they'd rather have zero GPU
  // usage than a reduced amount — pure software (CPU) rendering.
  app.disableHardwareAcceleration();
} else {
  // Prefer the integrated GPU on hybrid-graphics (Optimus/PowerXpress)
  // laptops — the default, and what actually fixes the reported GPU-
  // contention-with-ComfyUI problem while keeping acceleration on. Two
  // independent mechanisms, applied together for defense in depth:
  // 1. The Chromium switch tells its OWN GPU process to pick the low-power
  //    adapter, but only takes effect for Chromium's internal adapter choice.
  // 2. The per-exe registry key is the actual OS-level mechanism Windows'
  //    own Settings > Display > Graphics panel writes when a user manually
  //    sets an app to "Power saving" — it steers DXGI's adapter enumeration
  //    before Chromium (or any D3D app) even starts, so it's the more
  //    reliable of the two and works regardless of Chromium-version quirks.
  // Windows-only (hybrid graphics + this registry key are a Windows
  // concept); the registry write is gated to packaged builds only, same
  // reasoning as configurePortableUserData — app.getPath('exe') in dev
  // points at the shared node_modules/electron binary, and writing a GPU
  // preference for THAT would leak into every other Electron app's dev
  // environment on the same machine, not just this one.
  app.commandLine.appendSwitch('force_low_power_gpu');

  if (process.platform === 'win32' && app.isPackaged) {
    try {
      const exePath = app.getPath('exe');
      const { execFileSync } = require('child_process');
      const keyPath = 'HKCU\\Software\\Microsoft\\DirectX\\UserGpuPreferences';
      let current = '';
      try {
        current = execFileSync('reg', ['query', keyPath, '/v', exePath], { encoding: 'utf8' });
      } catch (err) {
        // Non-zero exit just means the value doesn't exist yet — fall through to set it.
      }
      if (!current.includes('GpuPreference=1;')) {
        execFileSync('reg', ['add', keyPath, '/v', exePath, '/t', 'REG_SZ', '/d', 'GpuPreference=1;', '/f']);
      }
    } catch (err) {
      // Non-fatal — worst case the app keeps using whatever GPU Windows already picked.
    }
  }
}

function getToolDir() {
  return path.join(app.getPath('userData'), 'tool');
}

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirSync(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

async function copyRecursiveAsync(src, dest) {
  const stat = await fs.promises.stat(src);
  if (stat.isDirectory()) {
    await fs.promises.mkdir(dest, { recursive: true });
    const entries = await fs.promises.readdir(src);
    for (const entry of entries) {
      await copyRecursiveAsync(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    await fs.promises.mkdir(path.dirname(dest), { recursive: true });
    await fs.promises.copyFile(src, dest);
  }
}

// The renderer (index.html/app.js/styles.css/data/) lives in userData/tool so
// future updates can be applied by replacing files there — no rebuild needed.
// If it's not there yet (first run), seed it from the bundled copy.
function ensureRendererFiles() {
  const toolDir = getToolDir();
  const toolIndex = path.join(toolDir, 'index.html');
  if (!fs.existsSync(toolIndex)) {
    copyDirSync(path.join(__dirname, 'renderer'), toolDir);
  }
  return toolIndex;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1040,
    minHeight: 640,
    backgroundColor: '#16151c',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Start maximized instead of at the fixed 1440x900 default — show only
  // once maximized so there's no visible resize flash on launch.
  win.once('ready-to-show', () => {
    win.maximize();
    win.show();
  });

  win.loadFile(ensureRendererFiles());

  // Ask the renderer before actually closing, so it can warn about unsaved
  // caption changes. A renderer-side `beforeunload` handler alone does NOT
  // work for this in Electron — calling preventDefault() on it silently
  // blocks the close with no dialog at all (Electron doesn't implement
  // Chromium's native "leave site?" prompt), which is exactly what made the
  // window hang and need a Task Manager kill whenever there were unsaved
  // changes. `close-confirmed` on this window is the one-time signal that
  // lets a later `.close()` through without looping back into this handler.
  win.on('close', (event) => {
    if (win.__closeConfirmed) return;
    event.preventDefault();
    win.webContents.send('request-close');
  });

  // Uncomment while debugging:
  // win.webContents.openDevTools();
}

// The renderer calls this once it's decided the window is actually OK to
// close (no unsaved changes, or the user confirmed anyway) in response to
// the 'request-close' message above. Marking __closeConfirmed lets the
// re-triggered .close() below fall through the 'close' handler instead of
// looping back into another 'request-close' round-trip.
ipcMain.handle('confirm-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.__closeConfirmed = true;
    win.close();
  }
});

// ---- GitHub-ready package generator ----
// Copies the app's own source (main.js/preload.js/package.json/renderer/)
// into a folder the user picks, alongside a .gitignore, a README, and a
// plain-English HOW_TO_UPLOAD.txt — everything needed to `git init` and
// push it, without assuming the user knows git already.

const GITHUB_PACKAGE_SKIP = new Set(['node_modules', 'dist', '.git', '.DS_Store']);

function copyDirSyncFiltered(src, dest, extraSkip = null) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (GITHUB_PACKAGE_SKIP.has(entry.name)) continue;
    if (extraSkip && extraSkip.has(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirSyncFiltered(srcPath, destPath, extraSkip);
    else fs.copyFileSync(srcPath, destPath);
  }
}

// main.js/preload.js/renderer/app.js are listed even though
// copyGithubPackageSource() no longer ships them — if the recipient runs
// `npm run build` inside this export, those regenerate on disk, and they
// should never get committed as tracked build output in what's meant to be
// a clean-source GitHub repo.
const GITHUB_GITIGNORE = `node_modules/\ndist/\nShippable/\ndata/\n*.log\n.DS_Store\nThumbs.db\n/main.js\n/preload.js\n/renderer/app.js\n`;

const GITHUB_README = `# Dataset Tag Studio

A local Electron desktop app for managing AI training dataset tags (image/caption pairs for LoRA or Stable Diffusion training). No network calls, no uploads — everything stays on disk.

This is the full TypeScript source (\`src/\`), not just a compiled copy —
\`npm start\`/\`npm run dist\` build it automatically first (see
package.json's \`pre*\` scripts), so building from this export reproduces
the exact same app as the release zip it was generated from.

## Running it

\`\`\`
npm install
npm start
\`\`\`

## Building a portable release zip

\`\`\`
npm run dist:zip
\`\`\`

This uses electron-builder and outputs a portable .zip to \`Shippable/\`
(same output the maintainer's own releases are built from). Plain
\`npm run dist\` builds installers for your OS into \`dist/\` instead.

See HOW_TO_UPLOAD.txt for step-by-step instructions on pushing this folder to GitHub.
`;

const GITHUB_HOWTO = `HOW TO PUSH THIS FOLDER TO GITHUB
==================================

You don't need to know git already — just follow these in order, from a
terminal (Command Prompt, PowerShell, or Terminal.app) opened IN THIS FOLDER.

0) Install git if you don't have it: https://git-scm.com/downloads
   (Run "git --version" in a terminal — if it prints a version, you're set.)

1) Turn this folder into a git repository:
     git init

2) Stage every file:
     git add .

3) Make your first commit:
     git commit -m "Initial commit"

4) Create an empty repository on GitHub.com (click the "+" top-right ->
   "New repository"). Do NOT check "Add a README" — this folder already
   has one. Copy the repository URL it gives you (looks like
   https://github.com/your-username/your-repo-name.git).

5) Point your local folder at that GitHub repository:
     git remote add origin https://github.com/your-username/your-repo-name.git

6) Rename your branch to "main" (GitHub's default) and push:
     git branch -M main
     git push -u origin main

You'll be asked to sign in to GitHub the first time — follow the prompts.
After that, any time you make changes here, push them with:
     git add .
     git commit -m "describe what changed"
     git push
`;

// Ships the actual buildable TypeScript source (src/, tsconfig*.json,
// scripts/, package.json with its real scripts/devDependencies — not just
// the compiled main.js/preload.js/renderer/app.js), so `npm install` +
// `npm run dist`/`npm run dist:zip` from this export reproduces the exact
// same release build, not a stale or incomplete copy of it. __dirname here
// points inside the RUNNING app's own resources (an app.asar path in any
// packaged build, the project root only when unpackaged via `npm start`) —
// so this only works at all because package.json's `build.files` explicitly
// ships src/**/*, scripts/**/*, and both tsconfig*.json inside every
// packaged build alongside main.js/preload.js/renderer/**/*. Previously it
// didn't: those four entries were missing from `files`, so a real packaged
// build's asar held only main.js/preload.js/package.json/renderer/ — this
// function's own `fs.existsSync()` guards silently swallowed the missing
// src/scripts/tsconfigs, producing an export with no TypeScript source at
// all (package.json + renderer assets only) that could never actually
// build. Verified via `asar list` on a real packaged build's app.asar
// before this fix. If a future file gets added here, it needs a matching
// `build.files` entry too, or the same silent-omission bug comes back.
// electron-builder REWRITES package.json for the packaged app — it strips
// "scripts", "devDependencies", and "build" (a real, deliberate,
// non-configurable part of how it packages an app; verified by diffing this
// project's own real package.json against the copy sitting in a built
// app.asar) and keeps everything else as-is. That means the package.json
// sitting on disk at runtime, in ANY packaged build, can never be copied
// verbatim — doing so was the actual reason this export was unbuildable
// even after the src/scripts/tsconfig fix above: the copied package.json
// had no "build"/"start"/"dist:zip" scripts and no devDependencies at all,
// so `npm install` had nothing to install and `npm run build` didn't exist.
// Fix: keep the live, always-accurate fields (name/version/description/
// author/license/etc. — whatever electron-builder actually preserved) but
// splice the three stripped fields back in from constants kept here. Those
// three constants are the actual maintenance burden this function carries —
// keep them in sync with the real package.json by hand whenever scripts,
// devDependencies, or the electron-builder `build` config change.
const GITHUB_PACKAGE_SCRIPTS = {
  'build:main': 'tsc -p tsconfig.main.json',
  'build:renderer': 'tsc -p tsconfig.renderer.json --noEmit && esbuild src/renderer/index.ts --bundle --outfile=renderer/app.js',
  'build': 'npm run build:main && npm run build:renderer',
  'prestart': 'npm run build',
  'start': 'electron .',
  'predist': 'npm run build',
  'dist': 'electron-builder',
  'predist:zip': 'npm run build',
  'dist:zip': 'electron-builder --win zip --config.directories.output=Shippable',
  'predist:dir': 'npm run build',
  'dist:dir': 'electron-builder --dir',
  'prerefresh-app': 'npm run build',
  'refresh-app': 'electron-builder --dir && node scripts/refresh-portable-dev.js'
};
const GITHUB_PACKAGE_DEV_DEPENDENCIES = {
  electron: '^31.0.0',
  'electron-builder': '^24.13.3',
  typescript: '^5.5.0',
  esbuild: '^0.23.0',
  '@types/node': '^20.14.0'
};
const GITHUB_PACKAGE_BUILD_CONFIG = {
  appId: 'com.local.datasettagstudio',
  productName: 'Dataset Tag Studio',
  files: ['main.js', 'preload.js', 'renderer/**/*', 'src/**/*', 'scripts/**/*', 'tsconfig.main.json', 'tsconfig.renderer.json'],
  directories: { output: 'dist' },
  afterPack: 'scripts/after-pack.js',
  compression: 'normal',
  mac: { target: 'dmg', category: 'public.app-category.graphics-design' },
  win: { target: ['zip'] },
  linux: { target: 'AppImage', category: 'Graphics' }
};

function copyGithubPackageSource(destDir) {
  const projectRoot = __dirname;
  const runtimePkgPath = path.join(projectRoot, 'package.json');
  const runtimePkg = fs.existsSync(runtimePkgPath) ? JSON.parse(fs.readFileSync(runtimePkgPath, 'utf8')) : {};
  const fullPkg = {
    ...runtimePkg,
    scripts: GITHUB_PACKAGE_SCRIPTS,
    devDependencies: GITHUB_PACKAGE_DEV_DEPENDENCIES,
    build: GITHUB_PACKAGE_BUILD_CONFIG
  };
  fs.writeFileSync(path.join(destDir, 'package.json'), JSON.stringify(fullPkg, null, 2) + '\n');
  // tsconfig*.json aren't touched by electron-builder's packaging (only
  // package.json gets rewritten), so a plain copy is safe here.
  for (const f of ['tsconfig.main.json', 'tsconfig.renderer.json']) {
    const src = path.join(projectRoot, f);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(destDir, f));
  }
  // renderer/app.js is excluded — it's esbuild's compiled bundle of
  // src/renderer/index.ts, regenerated by `npm run build`, not source.
  // main.js/preload.js (tsc's compiled output of src/main.ts and
  // src/preload.ts) are excluded the same way, for the same reason.
  copyDirSyncFiltered(path.join(projectRoot, 'renderer'), path.join(destDir, 'renderer'), new Set(['app.js']));
  if (fs.existsSync(path.join(projectRoot, 'src'))) {
    copyDirSyncFiltered(path.join(projectRoot, 'src'), path.join(destDir, 'src'));
  }
  if (fs.existsSync(path.join(projectRoot, 'scripts'))) {
    copyDirSyncFiltered(path.join(projectRoot, 'scripts'), path.join(destDir, 'scripts'));
  }
}

ipcMain.handle('generate-github-package', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(win, {
    title: 'Choose where to create the GitHub-ready package',
    properties: ['openDirectory', 'createDirectory']
  });
  if (result.canceled || !result.filePaths[0]) {
    return { ok: false, message: 'No folder selected.' };
  }
  const destDir = path.join(result.filePaths[0], 'dataset-tag-studio-github-ready');
  try {
    if (fs.existsSync(destDir) && fs.readdirSync(destDir).length > 0) {
      return { ok: false, message: `"${destDir}" already exists and isn't empty — remove it or pick a different folder, then try again.` };
    }
    fs.mkdirSync(destDir, { recursive: true });
    copyGithubPackageSource(destDir);
    fs.writeFileSync(path.join(destDir, '.gitignore'), GITHUB_GITIGNORE);
    fs.writeFileSync(path.join(destDir, 'README.md'), GITHUB_README);
    fs.writeFileSync(path.join(destDir, 'HOW_TO_UPLOAD.txt'), GITHUB_HOWTO);
    shell.showItemInFolder(path.join(destDir, 'HOW_TO_UPLOAD.txt'));
    return { ok: true, message: `Package created at ${destDir} — opened it for you. Read HOW_TO_UPLOAD.txt for the exact commands to push it to GitHub.`, path: destDir };
  } catch (err) {
    return { ok: false, message: 'Failed to generate package: ' + err.message };
  }
});

// Restarts the app from inside itself, re-copying the bundled renderer/
// over userData/tool first. In a dev checkout, __dirname/renderer IS the
// source you're editing, so this is an instant "reload my latest changes"
// button with no separate sync step.
ipcMain.handle('restart-app', async () => {
  // Only re-sync from the bundled renderer/ in dev — packaged builds just
  // relaunch with whatever is already in userData/tool (refresh-app is what
  // reseeds that for a packaged/portable build, not this handler).
  if (!app.isPackaged) {
    try {
      await copyRecursiveAsync(path.join(__dirname, 'renderer'), getToolDir());
    } catch (err) {
      // Non-fatal — relaunch anyway with whatever is already in tool/.
    }
  }
  app.relaunch();
  app.exit(0);
});

// Native page zoom — the same mechanism Chromium uses for Ctrl+/Ctrl-/Ctrl+0.
// Operates at the compositor level, so it correctly rescales the whole
// viewport atomically (vw/vh/% all stay consistent) instead of the
// CSS `zoom` property, which scales an element's own box independently
// of its container and reliably causes overflow.
ipcMain.handle('set-zoom-factor', (event, factor) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && typeof factor === 'number' && factor > 0 && factor <= 3) {
    win.webContents.setZoomFactor(factor);
  }
});

// Hardware acceleration is decided once, at process startup, before any
// window exists (see the "Hardware acceleration preference" block above) —
// these just let Settings read/persist the choice; the renderer is
// responsible for prompting a restart afterward, same as any other
// startup-only preference here.
ipcMain.handle('get-hardware-acceleration', () => hardwareAccelEnabled);
ipcMain.handle('set-hardware-acceleration', (event, enabled) => {
  writeHardwareAccelPref(!!enabled);
});

// ---------------- WD14 Autotagger (ComfyUI bridge) ----------------
// The renderer can't do this itself: ComfyUI's server.py rejects
// cross-origin POSTs whose Origin doesn't match Host (origin_only_middleware)
// and, separately, Chromium's own CORS would block reading a response that
// lacks an Access-Control-Allow-Origin header from this app's non-http
// origin. Neither restriction applies to a plain Node HTTP client, so these
// calls are made from the main process — which has no browser-style
// CORS/Origin enforcement — and relayed to the renderer over IPC, the same
// "small explicit bridge" shape as every other main-process capability here.
// This is a deliberate, user-configured exception to "no network calls":
// it only ever talks to the host the user typed into Tag Overseer's WD14
// section, expected to be a loopback ComfyUI instance (127.0.0.1/localhost).
function comfyRequest(host, urlPath, { method = 'GET', headers = {}, body = null, timeoutMs = 8000 }: any = {}): Promise<{ status: number; body: Buffer }> {
  return new Promise((resolve, reject) => {
    let target;
    try { target = new URL(urlPath, host); } catch (err) { reject(new Error('Invalid ComfyUI host URL.')); return; }
    const lib = target.protocol === 'https:' ? https : http;
    const req = lib.request(target, { method, headers }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
    });
    req.on('error', (err) => reject(err));
    req.setTimeout(timeoutMs, () => req.destroy(new Error('Request to ComfyUI timed out.')));
    if (body) req.write(body);
    req.end();
  });
}

function buildMultipart(fields, fileField, fileName, fileBuffer) {
  const boundary = '----DTSBoundary' + Date.now().toString(16) + Math.random().toString(16).slice(2);
  const parts = [];
  for (const [key, value] of Object.entries(fields)) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`));
  }
  const safeName = String(fileName).replace(/"/g, '');
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${fileField}"; filename="${safeName}"\r\nContent-Type: application/octet-stream\r\n\r\n`));
  parts.push(fileBuffer);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));
  return { boundary, body: Buffer.concat(parts) };
}

// Lists the models WD14Tagger|pysssss's own INPUT_TYPES currently reports —
// scraped live from ComfyUI's /object_info, never hardcoded here, so the
// dropdown always matches whatever that node (and its config) actually
// offers on the user's machine.
ipcMain.handle('wd14-get-models', async (event, host) => {
  try {
    const res = await comfyRequest(host, '/object_info/WD14Tagger%7Cpysssss', { timeoutMs: 6000 });
    if (res.status !== 200) return { ok: false, error: `ComfyUI returned HTTP ${res.status} — is the WD14 Tagger (pysssss) custom node installed?` };
    const parsed = JSON.parse(res.body.toString('utf8'));
    const nodeInfo = parsed['WD14Tagger|pysssss'];
    const models = nodeInfo && nodeInfo.input && nodeInfo.input.required && nodeInfo.input.required.model && nodeInfo.input.required.model[0];
    if (!Array.isArray(models)) return { ok: false, error: 'Could not find the WD14 Tagger node on that ComfyUI instance.' };
    return { ok: true, models };
  } catch (err) {
    return { ok: false, error: `Could not reach ComfyUI at ${host} — is it running? (${err.message})` };
  }
});

// Full round trip for one image: upload it into ComfyUI's own input/ folder
// (overwriting by name — this app doesn't need ComfyUI to remember it after),
// queue a minimal LoadImage -> WD14Tagger|pysssss graph, then poll /history
// until that node's output appears. imageBytes is a Uint8Array handed over
// from the renderer (read via the image's own FileSystemFileHandle) — the
// app never stores or forwards this anywhere except to the host the user
// configured.
ipcMain.handle('wd14-tag-image', async (event, { host, filename, imageBytes, settings }) => {
  try {
    const fileBuffer = Buffer.from(imageBytes);
    const { boundary, body } = buildMultipart({ type: 'input', overwrite: 'true' }, 'image', filename, fileBuffer);
    const uploadRes = await comfyRequest(host, '/upload/image', {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': body.length },
      body,
      timeoutMs: 20000
    });
    if (uploadRes.status !== 200) return { ok: false, error: `Image upload to ComfyUI failed (HTTP ${uploadRes.status}).` };
    const uploaded = JSON.parse(uploadRes.body.toString('utf8'));
    const imageRef = uploaded.subfolder ? `${uploaded.subfolder}/${uploaded.name}` : uploaded.name;

    const clientId = `dts-${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
    const prompt = {
      '1': { class_type: 'LoadImage', inputs: { image: imageRef, upload: 'image' } },
      '2': {
        class_type: 'WD14Tagger|pysssss',
        inputs: {
          image: ['1', 0],
          model: settings.model,
          threshold: settings.threshold,
          character_threshold: settings.characterThreshold,
          replace_underscore: !!settings.replaceUnderscore,
          trailing_comma: !!settings.trailingComma,
          exclude_tags: settings.excludeTags || ''
        }
      }
    };
    const promptBody = Buffer.from(JSON.stringify({ prompt, client_id: clientId }), 'utf8');
    const queueRes = await comfyRequest(host, '/prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': promptBody.length },
      body: promptBody,
      timeoutMs: 10000
    });
    let queueParsed: any = {};
    try { queueParsed = JSON.parse(queueRes.body.toString('utf8') || '{}'); } catch (err) { /* fall through with {} */ }
    if (queueRes.status !== 200) {
      const errMsg = queueParsed && queueParsed.error && queueParsed.error.message;
      return { ok: false, error: errMsg ? `ComfyUI rejected the request: ${errMsg}` : `ComfyUI returned HTTP ${queueRes.status} queuing the tag request.` };
    }
    const nodeErrorKeys = queueParsed.node_errors ? Object.keys(queueParsed.node_errors) : [];
    if (nodeErrorKeys.length) {
      return { ok: false, error: `ComfyUI rejected the workflow: ${JSON.stringify(queueParsed.node_errors)}` };
    }
    const promptId = queueParsed.prompt_id;
    if (!promptId) return { ok: false, error: 'ComfyUI did not return a prompt id.' };

    const deadline = Date.now() + 120000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 700));
      let histRes;
      try { histRes = await comfyRequest(host, `/history/${promptId}`, { timeoutMs: 8000 }); }
      catch (err) { continue; }
      if (histRes.status !== 200) continue;
      let hist: any = {};
      try { hist = JSON.parse(histRes.body.toString('utf8') || '{}'); } catch (err) { continue; }
      const record = hist[promptId];
      if (!record) continue;
      if (record.outputs && record.outputs['2'] && record.outputs['2'].tags) {
        const tags = record.outputs['2'].tags;
        return { ok: true, tagsCsv: Array.isArray(tags) ? tags[0] : tags };
      }
      if (record.status && record.status.status_str === 'error') {
        return { ok: false, error: 'ComfyUI reported an error while tagging this image — check its console for details.' };
      }
    }
    return { ok: false, error: 'Timed out waiting for ComfyUI to finish tagging this image.' };
  } catch (err) {
    return { ok: false, error: `Could not reach ComfyUI at ${host} — is it running? (${err.message})` };
  }
});

// ---- SynthDat Overseer (ComfyUI-driven synthetic dataset generation) ----
// Same shape as the WD14 handlers above: the renderer never talks to ComfyUI
// directly (CORS/origin — see CLAUDE.md), it hands this process a fully-built
// API-format prompt dict (cloned from the bundled workflow template) plus the
// reference image's raw bytes, and this process does the upload -> queue ->
// poll -> fetch round trip and hands back the finished PNG's bytes.

// Scrapes a node class's own INPUT_TYPES combo list from ComfyUI's live
// /object_info — same "never hardcode a model/LoRA list" principle as
// wd14-get-models, reused here for the diffusion model, Main LoRA, and LoRA
// stack dropdowns (all different node classes, hence this being generic
// rather than three near-duplicate handlers).
ipcMain.handle('synthdat-get-object-info', async (event, { host, classType, inputName }) => {
  try {
    const res = await comfyRequest(host, `/object_info/${encodeURIComponent(classType)}`, { timeoutMs: 6000 });
    if (res.status !== 200) return { ok: false, error: `ComfyUI returned HTTP ${res.status} looking up ${classType}.` };
    const parsed = JSON.parse(res.body.toString('utf8'));
    const nodeInfo = parsed[classType];
    const values = nodeInfo && nodeInfo.input && nodeInfo.input.required && nodeInfo.input.required[inputName] && nodeInfo.input.required[inputName][0];
    if (!Array.isArray(values)) return { ok: false, error: `Could not find "${inputName}" on ${classType} — is the right custom node installed?` };
    return { ok: true, values };
  } catch (err) {
    return { ok: false, error: `Could not reach ComfyUI at ${host} — is it running? (${err.message})` };
  }
});

// Tracks the one SynthDat generation in flight (this app only ever runs one
// at a time) so synthdat-stop-generation can both hit ComfyUI's own
// /interrupt endpoint AND short-circuit the polling loop below immediately,
// rather than waiting for /history to eventually reflect the interruption.
let activeSynthdatGen: { cancelled: boolean; ws: any } | null = null;

ipcMain.handle('synthdat-stop-generation', async (event, host) => {
  if (activeSynthdatGen) activeSynthdatGen.cancelled = true;
  try { await comfyRequest(host, '/interrupt', { method: 'POST', timeoutMs: 5000 }); } catch (err) { /* best effort */ }
  return { ok: true };
});

// Uploads the reference image, injects its ComfyUI-assigned name into the
// prompt's LoadImage node (id 239 in the bundled template), queues it, polls
// /history exactly like wd14-tag-image, then reads the SaveImage node's
// (id 192, "No Upscale" — always present regardless of 1-Pass/2-Pass, see
// CLAUDE.md) output image entry and fetches its bytes via /view.
//
// Also opens a plain WebSocket to ComfyUI's own /ws endpoint (using the same
// client_id as the queued prompt) purely to relay TAESD preview frames and
// step-progress back to the renderer as they arrive — those only ever show
// up over the websocket, /history never carries them. Preview frames arrive
// as ComfyUI's documented binary format: a 4-byte big-endian event type
// (1 = PREVIEW_IMAGE), a 4-byte big-endian image type (1 = JPEG, 2 = PNG),
// then the raw image bytes — forwarded to the renderer as-is via a plain
// `send()` (not part of this handler's own return value) so the renderer
// can update a live preview while the invoke() call is still pending.
ipcMain.handle('synthdat-queue-and-fetch', async (event, { host, imageFilename, imageBytes, prompt }) => {
  let ws: any = null;
  try {
    // "Skip reference image" (renderer's buildPromptFromFields) deletes node
    // 239 (LoadImage) from the prompt entirely, and imageBytes/imageFilename
    // come through as null/undefined in that case — nothing to upload, and
    // no node left to point at an uploaded file even if there were.
    if (imageBytes && prompt['239']) {
      const fileBuffer = Buffer.from(imageBytes);
      const { boundary, body } = buildMultipart({ type: 'input', overwrite: 'true' }, 'image', imageFilename, fileBuffer);
      const uploadRes = await comfyRequest(host, '/upload/image', {
        method: 'POST',
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': body.length },
        body,
        timeoutMs: 20000
      });
      if (uploadRes.status !== 200) return { ok: false, error: `Reference image upload to ComfyUI failed (HTTP ${uploadRes.status}).` };
      const uploaded = JSON.parse(uploadRes.body.toString('utf8'));
      const imageRef = uploaded.subfolder ? `${uploaded.subfolder}/${uploaded.name}` : uploaded.name;
      prompt['239'].inputs.image = imageRef;
    }

    const clientId = `dts-synthdat-${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;

    activeSynthdatGen = { cancelled: false, ws: null };
    try {
      const wsUrl = `${host.replace(/^http/i, 'ws')}/ws?clientId=${encodeURIComponent(clientId)}`;
      ws = new WS(wsUrl);
      activeSynthdatGen.ws = ws;
      // ComfyUI's newer per-step preview path (comfy_execution/progress.py's
      // WebUIProgressHandler.update_handler) only ever sends the image via
      // BinaryEventTypes.PREVIEW_IMAGE_WITH_METADATA (wire event type 4), and
      // only to a client whose FIRST websocket message declared
      // {"type":"feature_flags","data":{"supports_preview_metadata":true}} —
      // confirmed by reading this ComfyUI install's own server.py (the
      // `first_message`/`sockets_metadata[sid]["feature_flags"]` gate) and
      // feature_flags.py. Without this handshake, ComfyUI silently never
      // sends us a preview frame at all, no matter what preview_method the
      // queued prompt requests. Must be sent before anything else on the
      // socket, so do it on 'open' rather than immediately after construction
      // (the underlying TCP/TLS handshake isn't done yet at construction time).
      ws.on('open', () => {
        try { ws.send(JSON.stringify({ type: 'feature_flags', data: { supports_preview_metadata: true } })); }
        catch (err) { /* best effort */ }
      });
      ws.on('message', (data, isBinary) => {
        if (isBinary) {
          if (data.length < 8) return;
          const eventType = data.readUInt32BE(0);
          if (eventType === 1) {
            // Legacy PREVIEW_IMAGE: 4-byte image-type flag (1=JPEG,2=PNG), then raw bytes.
            const imageType = data.readUInt32BE(4);
            event.sender.send('synthdat-preview-frame', {
              mime: imageType === 1 ? 'image/jpeg' : 'image/png',
              bytes: new Uint8Array(data.subarray(8))
            });
          } else if (eventType === 4) {
            // PREVIEW_IMAGE_WITH_METADATA: 4-byte metadata length, then that
            // many bytes of JSON (carries "image_type" as a full mime string),
            // then the raw image bytes.
            try {
              const metaLen = data.readUInt32BE(4);
              const meta = JSON.parse(data.subarray(8, 8 + metaLen).toString('utf8'));
              event.sender.send('synthdat-preview-frame', {
                mime: meta.image_type || 'image/jpeg',
                bytes: new Uint8Array(data.subarray(8 + metaLen))
              });
            } catch (err) { /* malformed metadata frame — skip */ }
          }
        } else {
          try {
            const msg = JSON.parse(data.toString('utf8'));
            if (msg.type === 'progress' && msg.data) {
              event.sender.send('synthdat-progress', msg.data);
            } else if (msg.type === 'progress_state' && msg.data && msg.data.nodes) {
              // Newer per-node granular progress replacing the old single
              // "progress" message — pick whichever node is currently the
              // furthest along (there's normally only one running node in
              // this app's linear 1-Pass/2-Pass workflow).
              const running = Object.values(msg.data.nodes).filter((n: any) => n.state === 'running');
              if (running.length) {
                const n: any = running[running.length - 1];
                event.sender.send('synthdat-progress', { value: n.value, max: n.max });
              }
            }
          } catch (err) { /* ignore malformed frames */ }
        }
      });
      // Preview is best-effort — the polling loop below still fetches the
      // final image without it — but a swallowed handshake failure here is
      // exactly the kind of thing that looks like "preview never appears"
      // with zero symptoms, so log every failure mode to stderr instead of
      // eating it silently (visible via `--enable-logging=stderr`, see
      // CLAUDE.md's Known Pitfalls).
      ws.on('error', (err) => console.error('[synthdat] preview websocket error:', err && err.message));
      ws.on('unexpected-response', (req, res) => console.error('[synthdat] preview websocket handshake rejected:', res.statusCode));
      ws.on('close', (code, reason) => { if (code !== 1000) console.error('[synthdat] preview websocket closed:', code, reason && reason.toString()); });
      // Wait (briefly) for the handshake so the feature_flags message above
      // is sent (and so we don't miss the earliest preview frames of a short
      // generation) before queuing — best-effort, so a slow/failed connection
      // just proceeds without live preview rather than blocking generation.
      await new Promise<void>((resolve) => {
        const done = () => { ws.removeListener('open', done); ws.removeListener('error', done); ws.removeListener('unexpected-response', done); resolve(); };
        ws.once('open', done);
        ws.once('error', done);
        ws.once('unexpected-response', done);
        setTimeout(done, 3000);
      });
    } catch (err) { console.error('[synthdat] preview websocket setup failed:', err && err.message); }

    // ComfyUI's server-wide preview method defaults to "none" unless it was
    // launched with --preview-method — a per-request override in extra_data
    // is required to get preview frames at all regardless of anything on our
    // websocket side (confirmed by reading this ComfyUI install's own
    // execution.py: `set_preview_method(extra_data.get("preview_method"))`,
    // latent_preview.py: `default_preview_method = args.preview_method`,
    // cli_args.py: `default=LatentPreviewMethod.NoPreviews`). Without this,
    // our queued prompt silently generates zero preview frames even when the
    // server's own web UI — which does send this override — shows a live
    // preview for the exact same workflow.
    const promptBody = Buffer.from(JSON.stringify({ prompt, client_id: clientId, extra_data: { preview_method: 'taesd' } }), 'utf8');
    const queueRes = await comfyRequest(host, '/prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': promptBody.length },
      body: promptBody,
      timeoutMs: 10000
    });
    let queueParsed: any = {};
    try { queueParsed = JSON.parse(queueRes.body.toString('utf8') || '{}'); } catch (err) { /* fall through with {} */ }
    if (queueRes.status !== 200) {
      const errMsg = queueParsed && queueParsed.error && queueParsed.error.message;
      return { ok: false, error: errMsg ? `ComfyUI rejected the request: ${errMsg}` : `ComfyUI returned HTTP ${queueRes.status} queuing the generation request.` };
    }
    const nodeErrorKeys = queueParsed.node_errors ? Object.keys(queueParsed.node_errors) : [];
    if (nodeErrorKeys.length) {
      return { ok: false, error: `ComfyUI rejected the workflow: ${JSON.stringify(queueParsed.node_errors)}` };
    }
    const promptId = queueParsed.prompt_id;
    if (!promptId) return { ok: false, error: 'ComfyUI did not return a prompt id.' };

    // Generation is much slower than a WD14 tag pass — allow up to 5 minutes.
    const deadline = Date.now() + 300000;
    while (Date.now() < deadline) {
      if (activeSynthdatGen && activeSynthdatGen.cancelled) return { ok: false, error: 'Generation stopped.', interrupted: true };
      await new Promise((r) => setTimeout(r, 700));
      if (activeSynthdatGen && activeSynthdatGen.cancelled) return { ok: false, error: 'Generation stopped.', interrupted: true };
      let histRes;
      try { histRes = await comfyRequest(host, `/history/${promptId}`, { timeoutMs: 8000 }); }
      catch (err) { continue; }
      if (histRes.status !== 200) continue;
      let hist: any = {};
      try { hist = JSON.parse(histRes.body.toString('utf8') || '{}'); } catch (err) { continue; }
      const record = hist[promptId];
      if (!record) continue;
      const saveOutput = record.outputs && record.outputs['192'];
      const image = saveOutput && Array.isArray(saveOutput.images) && saveOutput.images[0];
      if (image) {
        const qs = new URLSearchParams({ filename: image.filename, subfolder: image.subfolder || '', type: image.type || 'output' });
        const viewRes = await comfyRequest(host, `/view?${qs.toString()}`, { timeoutMs: 20000 });
        if (viewRes.status !== 200) return { ok: false, error: `ComfyUI returned HTTP ${viewRes.status} fetching the generated image.` };
        const result: any = { ok: true, imageBytes: new Uint8Array(viewRes.body) };
        // Only present when 2-Pass ran (buildPromptFromFields() clones a 2nd
        // SaveImage, "192_pass1", pointed at pass 1's own decode) — lets the
        // renderer offer a choice between the two instead of only ever
        // keeping the refined pass-2 result.
        const pass1Output = record.outputs['192_pass1'];
        const pass1Image = pass1Output && Array.isArray(pass1Output.images) && pass1Output.images[0];
        if (pass1Image) {
          const qs1 = new URLSearchParams({ filename: pass1Image.filename, subfolder: pass1Image.subfolder || '', type: pass1Image.type || 'output' });
          const viewRes1 = await comfyRequest(host, `/view?${qs1.toString()}`, { timeoutMs: 20000 });
          if (viewRes1.status === 200) result.pass1ImageBytes = new Uint8Array(viewRes1.body);
        }
        return result;
      }
      if (record.status && record.status.status_str === 'error') {
        return { ok: false, error: 'ComfyUI reported an error while generating this image — check its console for details.' };
      }
    }
    return { ok: false, error: 'Timed out waiting for ComfyUI to finish generating this image.' };
  } catch (err) {
    return { ok: false, error: `Could not reach ComfyUI at ${host} — is it running? (${err.message})` };
  } finally {
    try { if (ws) ws.close(); } catch (err) { /* already closed */ }
    activeSynthdatGen = null;
  }
});

app.whenReady().then(() => {
  // Hide the default File/Edit/View/Window/Help menu bar for a cleaner, app-like feel.
  // Press Alt on Windows/Linux to reveal it temporarily if you ever need DevTools etc.
  Menu.setApplicationMenu(null);

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
