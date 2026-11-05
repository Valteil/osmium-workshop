#!/usr/bin/env node
// Builds renderer/data/wiki_groups.json.gzdat: Danbooru's tag group pages (tag_group:hair_styles,
// …) and their index (tag_groups), for the Wiki window's group sidebar (src/renderer/tag-wiki.ts).
// build-wiki-data.js skips these pages (it only keeps pages whose title is a tag).
//
// Source: a wiki_pages CSV dump (id,created_at,updated_at,title,body,is_locked,other_names,
// is_deleted), e.g. Hugging Face lylogummy/danbooru_wikis_2026's wiki_pages.csv. Run by hand and
// commit the output; the app never touches the network for this.
//
//   node scripts/build-wiki-groups.js --csv <path/to/wiki_pages.csv>
//
// Output: { index: Line[], pages: { <group key>: { title, updated, lines: Line[] } } }
//   group key = the title without "tag_group:" (hair_styles)
//   Line = [kind, depth, parts]: kind 'h' (heading) | 'li' (bullet, depth = its *s) | 'p' (text)
//   parts = (string | [target, label])[]: a [[link]], target normalised (lowercase, underscores)
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..', 'renderer', 'data', 'wiki_groups.json.gzdat');

// ---- CSV (RFC 4180: quoted fields, "" escapes, newlines inside quotes) ----
function* csvRows(text) {
  let i = 0, field = '', row = [], quoted = false;
  if (text.charCodeAt(0) === 0xfeff) i = 1;
  for (; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      yield row; row = [];
    } else field += c;
  }
  if (field || row.length) { row.push(field); yield row; }
}

// ---- DText -> lines --------------------------------------------------------
const normTarget = (t) => t.trim().toLowerCase().replace(/\s+/g, '_');

function inlineParts(text) {
  let s = text;
  s = s.replace(/\[\/?(?:b|i|u|s|tn|spoiler|nodtext|code|quote|br)\]/gi, '');
  s = s.replace(/\{\{([^}]+)\}\}/g, (_m, a) => a.replace(/_/g, ' '));
  s = s.replace(/"([^"]+)":\[?(?:https?:\/\/[^\s\]]+|\/[^\s\]]*|#[\w-]+)\]?/g, '$1');
  s = s.replace(/<(https?:\/\/[^>]+)>/g, '$1');
  const parts = [];
  const re = /\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/g;
  let last = 0, m;
  while ((m = re.exec(s))) {
    if (m.index > last) parts.push(s.slice(last, m.index));
    const target = normTarget(m[1]);
    // "Tag group:Hair styles" reads as "Hair styles" (the sidebar marks groups itself).
    const label = (m[2] !== undefined && m[2] !== '' ? m[2] : m[1]).replace(/_/g, ' ').trim()
      .replace(/^tag group:\s*(.)/i, (_m, c) => c.toUpperCase());
    parts.push([target, label]);
    last = re.lastIndex;
  }
  if (last < s.length) parts.push(s.slice(last));
  // Merge adjacent strings, trim the ends.
  const out = [];
  for (const p of parts) {
    if (typeof p === 'string' && typeof out[out.length - 1] === 'string') out[out.length - 1] += p;
    else out.push(p);
  }
  if (typeof out[0] === 'string') out[0] = out[0].replace(/^\s+/, '');
  if (typeof out[out.length - 1] === 'string') out[out.length - 1] = out[out.length - 1].replace(/\s+$/, '');
  return out.filter((p) => p !== '');
}

function dtextLines(body) {
  const lines = [];
  let skipping = false; // inside [expand=Table of Contents]
  for (let raw of String(body || '').replace(/\r\n?/g, '\n').split('\n')) {
    raw = raw.trim();
    if (!raw) continue;
    if (/^\[expand=table of contents\]/i.test(raw)) { skipping = true; continue; }
    if (skipping) { if (/\[\/expand\]/i.test(raw)) skipping = false; continue; }
    // "[See [[tag groups]].]" and example-post lines carry nothing for the sidebar view.
    if (/^\[?see \[\[tag groups?\]\]\.?\]?$/i.test(raw)) continue;
    // Example images ("* !post #123: [[buzz cut]]"): the reference goes, the tag stays.
    raw = raw.replace(/!?(?:post|asset) #\d+(?:\s*[,&]\s*!?(?:post|asset) #\d+)*\s*:?\s*/gi, '').trim();
    if (/^\*+$/.test(raw)) continue;
    raw = raw.replace(/\[\/?(?:table|thead|tbody|tr|td|th|col|colgroup)[^\]]*\]/gi, ' ').trim();
    const exp = raw.match(/^\[expand(?:=([^\]]*))?\](.*)$/i);
    if (exp) { if (exp[1]) lines.push(['h', 0, inlineParts(exp[1])]); raw = exp[2].trim(); }
    raw = raw.replace(/\[\/expand\]/gi, '').trim();
    if (!raw) continue;
    const h = raw.match(/^h(\d)(?:#[\w-]+)?\.\s*(.*)$/i);
    if (h) { const parts = inlineParts(h[2]); if (parts.length) lines.push(['h', Number(h[1]), parts]); continue; }
    const li = raw.match(/^(\*+)\s*(.*)$/);
    if (li) { const parts = inlineParts(li[2]); if (parts.length) lines.push(['li', li[1].length, parts]); continue; }
    const parts = inlineParts(raw);
    if (parts.length) lines.push(['p', 0, parts]);
  }
  // A heading with nothing under it before the next heading of the same or higher level goes.
  return lines.filter((l, i) => {
    if (l[0] !== 'h') return true;
    const next = lines[i + 1];
    return next && !(next[0] === 'h' && (next[1] <= l[1] || l[1] === 0));
  });
}

const titleOf = (key) => key.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

function main() {
  const at = process.argv.indexOf('--csv');
  const csv = at > 0 ? process.argv[at + 1] : '';
  if (!csv || !fs.existsSync(csv)) throw new Error('Pass --csv <path to a Danbooru wiki_pages CSV dump>.');
  const rows = csvRows(fs.readFileSync(csv, 'utf8'));
  const head = rows.next().value;
  const col = (name) => { const i = head.indexOf(name); if (i < 0) throw new Error(`CSV has no "${name}" column`); return i; };
  const T = col('title'), B = col('body'), U = col('updated_at'), D = col('is_deleted');
  let index = null, seen = 0;
  const pages = {};
  for (const r of rows) {
    seen++;
    const title = r[T];
    if (!title || /^(true|t|1)$/i.test(r[D] || '')) continue;
    if (title === 'tag_groups') index = dtextLines(r[B]);
    else if (title.startsWith('tag_group:')) {
      const key = title.slice('tag_group:'.length);
      const lines = dtextLines(r[B]);
      if (lines.length) pages[key] = { title: titleOf(key), updated: String(r[U] || '').slice(0, 10), lines };
    }
  }
  if (!index) throw new Error('No tag_groups index page in the dump.');
  const out = { index, pages };
  fs.writeFileSync(OUT, zlib.gzipSync(Buffer.from(JSON.stringify(out)), { level: 9 }));
  const size = fs.statSync(OUT).size;
  console.log(`[groups] ${seen} pages read, ${Object.keys(pages).length} tag groups + the index -> ${path.relative(process.cwd(), OUT)} (${(size / 1024).toFixed(0)} KB)`);
}

module.exports = { dtextLines, csvRows };
if (require.main === module) { try { main(); } catch (err) { console.error('[error]', err.message); process.exit(1); } }
