#!/usr/bin/env node
// Copies renderer/'s contents into portable-dev/DROP_UPDATES_HERE — the
// exact same mechanism a real end user uses to update. This is deliberately
// NOT a shortcut that bypasses the update flow: it's how we dogfood it.
// After running this, open portable-dev's app, click "Apply update bundle"
// (it auto-detects DROP_UPDATES_HERE), then Restart app.

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const RENDERER_SRC = path.join(PROJECT_ROOT, 'renderer');
const PERSISTENT_DIR = path.join(PROJECT_ROOT, 'portable-dev');
const DROP_DIR = path.join(PERSISTENT_DIR, 'DROP_UPDATES_HERE');

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirSync(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

function main() {
  if (!fs.existsSync(RENDERER_SRC)) {
    console.error(`[push-update] renderer/ not found at ${RENDERER_SRC}`);
    process.exitCode = 1;
    return;
  }
  if (!fs.existsSync(PERSISTENT_DIR)) {
    console.error('[push-update] portable-dev/ doesn\'t exist yet — run "npm run refresh-app" once first to set it up.');
    process.exitCode = 1;
    return;
  }
  fs.rmSync(DROP_DIR, { recursive: true, force: true });
  copyDirSync(RENDERER_SRC, DROP_DIR);
  console.log(`[push-update] renderer/ staged in ${DROP_DIR}`);
  console.log('[push-update] Now open portable-dev\'s app -> Settings -> Apply update bundle -> Restart app.');
}

main();
