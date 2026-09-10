const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

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
// is the project root itself when run from the portable dev build (see
// CLAUDE.md "The root build is the project root itself"), so src/,
// tsconfig*.json, and scripts/ all sit right next to main.js and are safe
// to copy directly.
function copyGithubPackageSource(destDir) {
  const projectRoot = __dirname;
  // main.js/preload.js are deliberately NOT in this list — like
  // renderer/app.js below, they're tsc's compiled output of src/main.ts and
  // src/preload.ts, regenerated by `npm run build`. Copying whatever
  // happens to sit on disk at export time risked shipping a STALE compiled
  // copy alongside fresh src/ if the exporter had edited src/ without
  // rebuilding first — harmless for anyone who runs `npm start`/`npm run
  // dist*` from the export (build is a `pre*` step there, so it gets
  // overwritten immediately), but it contradicted this function's own
  // "ships source, not a compiled copy" intent, and — since neither
  // GITHUB_GITIGNORE nor the project's own .gitignore excludes them — could
  // get committed into the recipient's "clean source" GitHub repo as
  // tracked build output.
  for (const f of ['package.json', 'tsconfig.main.json', 'tsconfig.renderer.json', 'PORTABLE_README.txt']) {
    const src = path.join(projectRoot, f);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(destDir, f));
  }
  // renderer/app.js is excluded — it's esbuild's compiled bundle of
  // src/renderer/index.ts, regenerated by `npm run build`, not source.
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
