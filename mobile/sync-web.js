// Builds mobile/www/ from the desktop renderer's build output. Everything is
// GENERATED on every run — the Android app is the desktop renderer plus a
// thin mobile layer, not a fork:
//   - app.js, styles.css, fonts/, data/   copied verbatim from renderer/.
//   - index.html                          renderer/index.html with three asserted
//     edits: <html class="mobile-app"> (the hook every Android-only rule in
//     styles.css hangs off — see its "Android app" block), mobile-shim.js loaded
//     before app.js, and a short list of pointer→touch wording swaps.
// Android-only layout lives in renderer/styles.css under html.mobile-app (and
// the generic touch/narrow rules under html.touch-device / @media 900px), so a
// desktop change can't silently skip the phone again.
//
// History: until 2026-09-27 index.html and styles.css were hand-forked here on
// first sync and never refreshed. They drifted until 25 element ids the shared
// app.js looks up were missing (a sync would have crashed the app's init) and
// every theme/feature added since the fork had no markup or styles on Android.
// The last fork is kept in mobile/_fork-backup/ for reference; nothing reads it.
//
// Re-run after `npm run build` in the repo root, then `npx cap sync android`
// and a Gradle build.
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const rendererDir = path.join(repoRoot, 'renderer');
const wwwDir = path.join(__dirname, 'www');

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) copyRecursive(path.join(src, entry), path.join(dest, entry));
  } else {
    fs.copyFileSync(src, dest);
  }
}
function mustReplace(text, from, to, what) {
  if (!text.includes(from)) throw new Error(`sync-web: couldn't find ${what} in renderer/index.html`);
  return text.replace(from, to);
}

if (!fs.existsSync(path.join(rendererDir, 'app.js'))) {
  console.error('renderer/app.js not found — run `npm run build` in the repo root first.');
  process.exit(1);
}
fs.mkdirSync(wwwDir, { recursive: true });

// One-time: keep the old hand-fork around before it's overwritten.
const backup = path.join(__dirname, '_fork-backup'); // outside www/, so it never ships in the APK
if (!fs.existsSync(backup)) {
  const idx = path.join(wwwDir, 'index.html'), css = path.join(wwwDir, 'styles.css');
  if (fs.existsSync(idx) && !fs.readFileSync(idx, 'utf8').includes('class="mobile-app"')) {
    fs.mkdirSync(backup, { recursive: true });
    fs.copyFileSync(idx, path.join(backup, 'index.html'));
    if (fs.existsSync(css)) fs.copyFileSync(css, path.join(backup, 'styles.css'));
  }
}

fs.copyFileSync(path.join(rendererDir, 'app.js'), path.join(wwwDir, 'app.js'));
fs.copyFileSync(path.join(rendererDir, 'styles.css'), path.join(wwwDir, 'styles.css'));
for (const dir of ['data', 'fonts']) {
  fs.rmSync(path.join(wwwDir, dir), { recursive: true, force: true });
  copyRecursive(path.join(rendererDir, dir), path.join(wwwDir, dir));
}
fs.copyFileSync(path.join(__dirname, 'mobile-shim.js'), path.join(wwwDir, 'mobile-shim.js'));

let html = fs.readFileSync(path.join(rendererDir, 'index.html'), 'utf8');
html = mustReplace(html, '<html lang="en">', '<html lang="en" class="mobile-app">', 'the <html> tag');
html = mustReplace(html, '<script src="app.js"></script>',
  '<script src="mobile-shim.js"></script>\n<script src="app.js"></script>', 'the app.js <script>');

// Pointer wording in static markup that reads wrong under a finger. The
// runtime-built help (help-docs.ts) already branches on touch itself.
const WORDING = [
  ['Click images in the gallery to select them', 'Tap images in the gallery to select them'],
  ['Or click a thumbnail below to select/deselect it', 'Or tap a thumbnail below to select/deselect it'],
  ['Hover a suggestion for a second to preview its definition.', 'Long-press a suggestion to preview its definition.'],
  ['Click <b>File → Open dataset folder</b>', 'Tap <b>File → Open dataset folder</b>'],
  ['by clicking off them', 'by tapping off them'],
  ['by clicking them again', 'by tapping them again'],
];
for (const [from, to] of WORDING) html = html.split(from).join(to);

fs.writeFileSync(path.join(wwwDir, 'index.html'), html);
console.log('Synced mobile/www/ from renderer/ (index.html generated with html.mobile-app; app.js, styles.css, fonts/, data/ copied).');
