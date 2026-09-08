# Dataset Tag Studio — desktop app

A local, offline-first desktop app for tagging and cleaning up AI
image-training datasets. Everything reads and writes directly to your
dataset folder on disk — no uploads, no cloud, no accounts.

This wraps the tool in Electron so it opens as its own app window instead
of needing a browser tab. See `FEATURES.md` for a full tour of what the
tool does once it's running.

## What's in this package

```
dataset-tag-studio-electron/
  main.js              — Electron main process (window, update-bundle support)
  preload.js            — safe IPC bridge used by the update-bundle feature
  package.json          — project config / build scripts
  renderer/
    index.html           — the app's UI structure
    app.js                — all application logic
    styles.css            — all styling
    data/
      wiki.json            — Danbooru tag wiki definitions (~23MB)
      all_tags.json        — Danbooru tag list with categories/counts (~25MB)
```

The two files in `renderer/data/` power the **Tag Details** feature (click
any tag → "Tag Details" to see its definition, category, and post count).
They're required — without them, Tag Details will just show "no definition
found" for everything.

## Requirements

- [Node.js](https://nodejs.org) (LTS, 18+) installed on your machine.
- Internet access the *first* time you install, since `npm install` needs
  to download Electron itself (~150–200MB, one-time).

## Install from scratch

1. Unzip this package anywhere (e.g. your Desktop or Documents).
2. Open a terminal in that folder (the one containing `package.json`).
3. Install dependencies:

   ```bash
   npm install
   ```

4. Launch the app:

   ```bash
   npm start
   ```

   This opens the app in its own window immediately — good enough for
   daily use. You don't have to "build" anything just to run it.

## Build a real installer (optional)

If you want a proper double-click app (`.dmg` on Mac, an installer `.exe`
on Windows, `.AppImage` on Linux) you can keep around without running
`npm start` every time:

```bash
npm run dist
```

The finished installer lands in the `dist/` folder. Build on the OS
you're targeting — electron-builder can sometimes cross-compile, but
building natively on each platform is the reliable path. Install it like
any normal app once it's built.

## Getting future updates

Once installed, the app copies `renderer/` into its own private per-user
data folder the first time it runs, and loads from *there* from then on —
that's what makes the two update paths below possible:

- **In-app (usual path):** Settings → **⬆ Apply update bundle…**. Unzip
  a future update bundle anywhere (e.g. your Downloads folder), click the
  button, and point the folder picker at the unzipped folder. The app
  copies the new files into place and offers to relaunch. No rebuild, no
  navigating to `%appdata%` by hand.
- **Manual (fallback):** if you ever need to do it by hand, the live copy
  lives at:
  - Mac: `~/Library/Application Support/Dataset Tag Studio/tool/`
  - Windows: `%APPDATA%\Dataset Tag Studio\tool\`
  - Linux: `~/.config/Dataset Tag Studio/tool/`

  Drop updated files there directly and relaunch.

Only changes to `main.js`, `preload.js`, or `package.json` (the Electron
shell itself, not the app inside it) require a full rebuild via
`npm run dist` and reinstall — everything else (`index.html`, `app.js`,
`styles.css`, `data/`) can be updated through either path above.

## Notes

- The app hides Electron's default menu bar for a cleaner look. On
  Windows/Linux you can tap `Alt` to bring it back temporarily (e.g. to
  open DevTools by editing `main.js` and uncommenting `openDevTools()`).
- If `npm start` fails with a permissions or download error, it's almost
  always the Electron binary download — check your network/proxy and
  retry `npm install`.
- To customize the app icon, add an `.icns` (Mac) / `.ico` (Windows) /
  `.png` (Linux) file and reference it via `build.mac.icon`,
  `build.win.icon`, `build.linux.icon` in `package.json`.
