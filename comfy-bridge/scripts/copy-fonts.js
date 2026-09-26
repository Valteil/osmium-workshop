// Copies Osmium Workshop's bundled OFL faces (../renderer/fonts: fonts.css,
// the .woff2 files, OFL.md) into this app's renderer/fonts, so Theme Studio
// themes can use the same faces offline. One source of truth: the copy is
// gitignored and rebuilt by `npm run build:renderer`.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', '..', 'renderer', 'fonts');
const dest = path.join(__dirname, '..', 'renderer', 'fonts');
fs.mkdirSync(dest, { recursive: true });
let n = 0;
for (const name of fs.readdirSync(src)) {
  const from = path.join(src, name);
  if (!fs.statSync(from).isFile()) continue;
  fs.copyFileSync(from, path.join(dest, name));
  n++;
}
console.log(`fonts: ${n} files -> ${dest}`);
