#!/usr/bin/env node
// Copies a fresh `electron-builder --dir` build (dist/win-unpacked) into this
// app's own root, right next to its source — same "one-file quick launch"
// convention as the parent Dataset Manager Studio project's own refresh-app
// (see its scripts/refresh-portable-dev.js). No settings/userData folder to
// preserve here (this app keeps nothing between launches), so this is a
// plain overwrite, not a filtered copy.

const fs = require('fs');
const path = require('path');

const APP_ROOT = path.join(__dirname, '..');
const BUILD_DIR = path.join(APP_ROOT, 'dist', 'win-unpacked');

// Overwrites files in place rather than rmSync-ing each destination
// directory first — a stray open handle (AV scan, Explorer preview, a still-
// running instance) makes an rmSync of a whole directory fail outright, even
// though a plain file overwrite would have succeeded fine. electron-builder
// regenerates dist/win-unpacked fully each time, so there's nothing stale
// left behind in the destination that this would fail to clean up.
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function main() {
  if (!fs.existsSync(BUILD_DIR)) {
    console.error(`[refresh] ${BUILD_DIR} not found — run "npm run dist:dir" first (or just use "npm run refresh-app", which does both).`);
    process.exitCode = 1;
    return;
  }
  const exePath = path.join(APP_ROOT, 'Comfy Bridge.exe');
  const firstTime = !fs.existsSync(exePath);
  copyDirSync(BUILD_DIR, APP_ROOT);
  console.log(`[refresh] Comfy Bridge.exe refreshed at ${APP_ROOT}${firstTime ? ' (first-time setup)' : ''}.`);
  console.log('[refresh] Fully quit and relaunch it to pick up the new app code.');
}

main();
