// Copies the single-source shared stylesheet (src/renderer/shared/shared.css)
// into both shells: the desktop renderer/ folder and the mobile www/ folder.
// Run via `npm run build:shared` — never hand-edit the copies.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src', 'renderer', 'shared', 'shared.css');
const dests = [
  path.join(__dirname, '..', 'renderer', 'shared.css'),
  path.join(__dirname, '..', 'mobile', 'www', 'shared.css'),
];
for (const dest of dests) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log(`shared.css -> ${dest}`);
}
