// Offline preview of the GitHub Pages site, served exactly the way Pages
// serves it: docs/ mounted at /osmium-workshop/ (the live URL's path), so
// relative links, the demo, fetch('assets/themes.json') and the theme
// picker all behave as they do online. Opening docs/index.html straight
// from disk (file://) can't do that — fetch() is blocked there.
// No dependencies; started by "Preview Site.cmd" in the repo root.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const ROOT = path.join(__dirname, '..', 'docs');
const BASE = '/osmium-workshop/';
const PORT = Number(process.env.PORT) || 8760;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8',
  '.gzdat': 'application/octet-stream',
};

function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}

http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (!url.startsWith(BASE)) {
    res.writeHead(302, { Location: BASE });
    return res.end();
  }
  let file = path.normalize(path.join(ROOT, url.slice(BASE.length)));
  if (!file.startsWith(ROOT)) return send(res, 403, 'Forbidden');
  fs.stat(file, (err, st) => {
    if (!err && st.isDirectory()) {
      // Pages redirects /dir to /dir/ and serves its index.html.
      if (!url.endsWith('/')) { res.writeHead(301, { Location: url + '/' }); return res.end(); }
      file = path.join(file, 'index.html');
    }
    fs.readFile(file, (err2, data) => {
      if (err2) return send(res, 404, '404 — not found: ' + url);
      send(res, 200, data, TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream');
    });
  });
}).on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    // Already running from an earlier double-click: just open it again.
    console.log('Preview is already running on port ' + PORT + '.');
    openBrowser();
    setTimeout(() => process.exit(0), 500);
  } else { console.error(e); process.exit(1); }
}).listen(PORT, '127.0.0.1', () => {
  console.log('Osmium Workshop site preview: http://localhost:' + PORT + BASE);
  console.log('Serving ' + ROOT + ' — edits show on refresh. Close this window to stop.');
  openBrowser();
});

function openBrowser() {
  if (process.env.NO_OPEN) return;
  exec('start "" "http://localhost:' + PORT + BASE + '"');
}
