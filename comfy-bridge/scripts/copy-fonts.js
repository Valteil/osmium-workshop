// Copies Osmium Workshop's bundled OFL faces (../renderer/fonts: fonts.css,
// the .woff2 files, OFL.md) into BOTH shells — the desktop renderer/fonts and
// the Android app's mobile/www/fonts — so the themes' own fonts (v2.0.0) and
// Theme Studio's faces work offline. One source of truth: the copies are
// gitignored and rebuilt by `npm run build:renderer`.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', '..', 'renderer', 'fonts');
const dests = [
  path.join(__dirname, '..', 'renderer', 'fonts'),
  path.join(__dirname, '..', 'mobile', 'www', 'fonts'),
];
for (const dest of dests) {
  fs.mkdirSync(dest, { recursive: true });
  let n = 0;
  for (const name of fs.readdirSync(src)) {
    const from = path.join(src, name);
    if (!fs.statSync(from).isFile()) continue;
    fs.copyFileSync(from, path.join(dest, name));
    n++;
  }
  console.log(`fonts: ${n} files -> ${dest}`);
}
