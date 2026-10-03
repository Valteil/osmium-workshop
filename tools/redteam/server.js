// Red Team harness server — dependency-free, loopback only, started by
// "Red Team.cmd". Serves the UI and streams run results over SSE. Enforces the
// single-run lock: while one app's attack runs, another start is rejected.
//
// Safety rules live in lib/arena.js (throwaway instance, temp arena, canaries,
// loopback-only debug port). This file only routes.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { APPS, loadVectors } = require('./lib/registry');
const { runApp, lockHeldBy, requestStop } = require('./lib/runner');

const PORT = Number(process.env.PORT) || 8763;
const UI = path.join(__dirname, 'ui');
const RESULTS = path.join(__dirname, 'results');
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.md': 'text/markdown; charset=utf-8',
};

// Live SSE clients get every run event. Only one run happens at a time, so a
// single broadcast set is enough.
const clients = new Set();
function broadcast(ev) {
  const line = 'data: ' + JSON.stringify(ev) + '\n\n';
  for (const res of clients) { try { res.write(line); } catch (e) { /* dropped */ } }
}

function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}
function sendJson(res, code, obj) { send(res, code, JSON.stringify(obj), 'application/json; charset=utf-8'); }
function readBody(req) {
  return new Promise((resolve) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => resolve(b)); });
}

// Vector metadata for the UI: everything except the run function.
function vectorMeta(appId) {
  return loadVectors(appId).map((v) => ({ id: v.id, name: v.name, description: v.description, does: v.does, resists: v.resists, static: !!v.static }));
}

function writeResults(appId, results, fmt) {
  fs.mkdirSync(RESULTS, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  if (fmt === 'json') {
    const file = path.join(RESULTS, `${appId}-${stamp}.json`);
    fs.writeFileSync(file, JSON.stringify({ app: appId, ranAt: new Date().toISOString(), results }, null, 2));
    return file;
  }
  const file = path.join(RESULTS, `${appId}-${stamp}.md`);
  fs.writeFileSync(file, toMarkdown(appId, results));
  return file;
}
function toMarkdown(appId, results) {
  const app = APPS[appId] ? APPS[appId].label : appId;
  const lines = [`# Red Team results — ${app}`, '', `Ran: ${new Date().toISOString()}`, '', '> "Resisted" means this specific attack failed. It is not a claim that the app is secure overall.', ''];
  for (const r of results) {
    const badge = { resisted: '✅ resisted', vulnerable: '❌ VULNERABLE', error: '⚠️ harness error', untestable: '⏭️ not testable here' }[r.status] || r.status;
    const kind = r.static ? ' _(static source check, not a live attack)_' : '';
    lines.push(`## ${r.name} — ${badge}${kind}`, '', r.description || '', '');
    lines.push(`- Attack: ${r.does || ''}`);
    lines.push(`- Resisting looks like: ${r.resists || ''}`);
    if (r.status === 'vulnerable') {
      lines.push(`- Payload: \`${r.payload || ''}\``);
      lines.push(`- Expected: ${r.expected || ''}`);
      lines.push(`- Actual: ${r.actual || ''}`);
      lines.push(`- Evidence: ${r.evidence || ''}`);
      lines.push(`- Fix: ${r.fix || ''}`);
    } else if (r.evidence) {
      lines.push(`- Evidence: ${r.evidence}`);
    } else if (r.reason) {
      lines.push(`- Reason: ${r.reason}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1:' + PORT);
  const p = url.pathname;

  if (req.method === 'GET' && p === '/api/apps') {
    return sendJson(res, 200, Object.values(APPS).map((a) => ({ id: a.id, label: a.label, kind: a.kind })));
  }
  if (req.method === 'GET' && p === '/api/vectors') {
    const app = url.searchParams.get('app');
    if (!APPS[app]) return sendJson(res, 404, { error: 'unknown app' });
    return sendJson(res, 200, vectorMeta(app));
  }
  if (req.method === 'GET' && p === '/api/lock') {
    return sendJson(res, 200, { held: !!lockHeldBy(), app: lockHeldBy() });
  }
  if (req.method === 'GET' && p === '/api/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', 'Connection': 'keep-alive' });
    res.write(': connected\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }
  if (req.method === 'POST' && p === '/api/run') {
    const body = await readBody(req);
    let parsed; try { parsed = JSON.parse(body); } catch { return sendJson(res, 400, { error: 'bad body' }); }
    const appId = parsed.app;
    const only = Array.isArray(parsed.only) && parsed.only.length ? parsed.only : null;
    if (!APPS[appId]) return sendJson(res, 404, { error: 'unknown app' });
    if (lockHeldBy()) return sendJson(res, 409, { error: 'Another app\u2019s attack is running.', heldBy: lockHeldBy() });
    // Respond immediately; the run streams over SSE. The lock is taken inside
    // runApp synchronously, so a second POST that races arrives after this one
    // already holds it (JS is single-threaded).
    const accepted = { accepted: true, app: appId, only };
    sendJson(res, 202, accepted);
    runApp(appId, broadcast, { only }).catch((err) => broadcast({ type: 'error', text: String(err && err.message || err) }));
    return;
  }
  if (req.method === 'POST' && p === '/api/stop') {
    requestStop();
    return sendJson(res, 200, { stopping: true });
  }
  if (req.method === 'POST' && p === '/api/export') {
    const body = await readBody(req);
    let payload; try { payload = JSON.parse(body); } catch { return sendJson(res, 400, { error: 'bad body' }); }
    try {
      const file = writeResults(payload.app, payload.results || [], payload.format === 'json' ? 'json' : 'md');
      return sendJson(res, 200, { ok: true, file: path.relative(path.join(__dirname, '..', '..'), file).replace(/\\/g, '/') });
    } catch (err) { return sendJson(res, 500, { error: String(err && err.message || err) }); }
  }

  // Static UI.
  let rel = p === '/' ? 'index.html' : p.slice(1);
  const file = path.normalize(path.join(UI, rel));
  if (!file.startsWith(UI)) return send(res, 403, 'Forbidden');
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, '404: ' + p);
    send(res, 200, data, TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream');
  });
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') { console.log('Red Team harness already running on port ' + PORT + '.'); openBrowser(); setTimeout(() => process.exit(0), 500); }
  else { console.error(e); process.exit(1); }
});
server.listen(PORT, '127.0.0.1', () => {
  console.log('Red Team harness: http://localhost:' + PORT);
  console.log('Loopback only. Results folder: ' + RESULTS);
  console.log('Close this window to stop.');
  openBrowser();
});

function openBrowser() {
  if (process.env.NO_OPEN) return;
  exec('start "" "http://localhost:' + PORT + '/"');
}

module.exports = { writeResults, toMarkdown };
