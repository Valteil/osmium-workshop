// Packs the in-tree Anima-TrainFlow (gitignored, patched by patch-trainer) into
// Osmium's small Trainflow release zip: the trainer scripts + a bare portable
// Python (pip only). The ~5 GB of packages are installed afterwards by
// trainflow-pack/Install_Requirements.bat from requirements-osmium.txt (the
// exact versions Trainflow is tested with), which keeps the release file far
// under GitHub's 2 GB asset limit.
//
// Left out: training/output (personal LoRAs), the old sd-scripts-v0.10.5,
// models/ (Osmium downloads u2net itself), python's site-packages apart from
// pip/setuptools/wheel, Scripts/ (launchers pinned to the old path), caches.
//
// Usage: node scripts/pack-trainflow.js [version]   -> Shippable/release-<v>/
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const src = path.join(root, 'Anima-TrainFlow');
const version = process.argv[2] || require(path.join(root, 'package.json')).version;
const outDir = path.join(root, 'Shippable', `release-${version}`);
const stageName = 'Anima-TrainFlow-Osmium';
const stage = path.join(outDir, stageName);
const zipFile = path.join(outDir, `Anima-TrainFlow-Osmium-${version}.zip`);

if (!fs.existsSync(path.join(src, 'training', 'sd-scripts', 'anima_train_network.py'))) {
  console.error(`No Anima-TrainFlow at ${src}`);
  process.exit(1);
}
fs.rmSync(stage, { recursive: true, force: true });
fs.rmSync(zipFile, { force: true });
fs.mkdirSync(stage, { recursive: true });

const noCache = (p) => !/[\\/](__pycache__|\.pytest_cache)([\\/]|$)/.test(p) && !p.endsWith('.pyc');
const copy = (rel, filter = noCache) => fs.cpSync(path.join(src, rel), path.join(stage, rel), { recursive: true, filter });

for (const f of ['app.py', 'LICENSE', 'README.md', 'preview.png', 'start_trainer.bat']) copy(f);
copy(path.join('training', 'sd-scripts'));

// Portable Python without its packages; pip/setuptools/wheel stay so the installer can run.
const keepSite = /^(pip|setuptools|wheel|_distutils_hack|distutils-precedence\.pth|pkg_resources)([-.]|$)/i;
const py = path.join(src, 'python_embeded');
const site = path.join(py, 'Lib', 'site-packages');
copy('python_embeded', (p) => {
  if (!noCache(p)) return false;
  const rel = path.relative(py, p);
  if (rel.split(path.sep)[0] === 'Scripts') return false;
  if (p.startsWith(site + path.sep)) {
    const top = path.relative(site, p).split(path.sep)[0];
    return keepSite.test(top);
  }
  return true;
});

// Osmium's own files. Batch files get CRLF (cmd is happiest with them).
const pack = path.join(root, 'trainflow-pack');
const crlf = (s) => s.replace(/\r?\n/g, '\r\n');
fs.writeFileSync(path.join(stage, 'Install_Requirements.bat'), crlf(fs.readFileSync(path.join(pack, 'Install_Requirements.bat'), 'utf8')));
fs.writeFileSync(path.join(stage, 'README-OSMIUM.txt'), crlf(fs.readFileSync(path.join(pack, 'README-OSMIUM.txt'), 'utf8')));
fs.copyFileSync(path.join(pack, 'requirements-osmium.txt'), path.join(stage, 'requirements-osmium.txt'));

// Windows' own bsdtar writes zip with -a (named explicitly: Git's GNU tar can shadow it on PATH).
const tar = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe');
execFileSync(tar, ['-a', '-c', '-f', path.basename(zipFile), stageName], { cwd: outDir, stdio: 'inherit' });
const mb = (fs.statSync(zipFile).size / 1048576).toFixed(1);
console.log(`Packed ${path.relative(root, zipFile)} (${mb} MB)`);
