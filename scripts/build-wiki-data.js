#!/usr/bin/env node
// Refreshes the bundled tag data from the Danbooru API:
//   renderer/data/wiki.json.gzdat      { tag: definition }     (Tag Details, Wiki window, hover cards)
//   renderer/data/all_tags.json.gzdat  [[tag, category, count]] (autocomplete vocabulary), count-desc
//
// What it does (run by hand; the app never touches the network for this):
//   1. Tags: pages the newest tags (id desc, non-empty only) and adds the ones missing from
//      all_tags, stopping after a long run of already-known tags. Existing rows are kept as-is.
//   2. Wiki: pages every wiki page. Existing definitions are KEPT (only cleaned, step 3); a page
//      is added when its tag is in the tag list and has no definition yet (gaps + pages created
//      since the snapshot). New bodies are Danbooru DText, converted to the same plain style.
//   3. Cleans every definition: drops example-post references ("!post #…", "!asset #…",
//      "See post #…", "(post #…)", "in post #…") and any "Examples" heading left empty, but
//      keeps "See also" lists and everything else.
//
// Credentials: DANBOORU_LOGIN / DANBOORU_API_KEY from the environment, falling back to the
// Windows user environment (so a `setx` done in another terminal works). Sent as an HTTP Basic
// auth header, never in URLs or output.
//
//   node scripts/build-wiki-data.js --probe     one request each, prints what it would do
//   node scripts/build-wiki-data.js             full run, rewrites both files
//   node scripts/build-wiki-data.js --clean-only  step 3 only, no network
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const WIKI = path.join(ROOT, 'renderer', 'data', 'wiki.json.gzdat');
const TAGS = path.join(ROOT, 'renderer', 'data', 'all_tags.json.gzdat');
const API = 'https://danbooru.donmai.us';
const args = new Set(process.argv.slice(2));
const PROBE = args.has('--probe');
const CLEAN_ONLY = args.has('--clean-only');
const KNOWN_RUN_STOP = 5000; // consecutive already-known tags before the new-tag scan stops
// Tag categories whose wiki pages aren't bundled: 1 = artist (mostly links/
// bios, not what a tag means; the artist tags stay in the vocabulary) and 5 =
// meta. Meta tags (lowres, highres, artist request, commentary, …) describe
// the post, not anything in the image, so they're dropped from the
// vocabulary as well and never suggested (the user's call, 2026-09-27).
const SKIP_WIKI_CATEGORIES = new Set([1, 5]);
const DROP_TAG_CATEGORIES = new Set([5]);
const DELAY_MS = 350;        // between requests; well under Danbooru's read rate limit

// ---- credentials ----------------------------------------------------------
function userEnv(name) {
  if (process.env[name]) return process.env[name];
  if (process.platform !== 'win32') return '';
  try {
    const out = execFileSync('reg', ['query', 'HKCU\\Environment', '/v', name], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const m = out.match(new RegExp(`${name}\\s+REG_\\w+\\s+(.*)`));
    return m ? m[1].trim().replace(/^"(.*)"$/, '$1') : '';
  } catch { return ''; }
}

// ---- data files -----------------------------------------------------------
const readGz = (p) => JSON.parse(zlib.gunzipSync(fs.readFileSync(p)).toString('utf8'));
const writeGz = (p, v) => fs.writeFileSync(p, zlib.gzipSync(Buffer.from(JSON.stringify(v)), { level: 9 }));

// ---- DText -> plain text (the style the existing data already uses) -------
// Section by section: each "hN. Title" heading is kept only if its section
// still has content once cleaned (a heading over nothing but example posts,
// e.g. "Appearance" or "Examples", would otherwise dangle).
function dtextToPlain(body) {
  const parts = String(body || '').replace(/\r\n/g, '\n').split(/^h\d(?:#[\w-]+)?\.\s*(.*)$/m);
  const out = [];
  const lead = cleanDefinition(dtextInline(parts[0]));
  if (lead) out.push(lead);
  for (let i = 1; i < parts.length; i += 2) {
    const content = cleanDefinition(dtextInline(parts[i + 1] || ''));
    if (content) out.push(dtextInline(parts[i]) + '\n\n' + content);
  }
  return out.join('\n\n');
}

function dtextInline(text) {
  let s = String(text || '');
  s = s.replace(/\[expand(?:=([^\]]*))?\]/gi, (_m, t) => (t ? t + '\n' : ''));
  s = s.replace(/\[\/?(?:b|i|u|s|tn|spoiler|nodtext|code|quote|expand|table|thead|tbody|tr|td|th|br)\]/gi, '');
  s = s.replace(/^\*+\s*/gm, '');                                    // list bullets
  s = s.replace(/\[\[([^\]|]+)\|([^\]]*)\]\]/g, (_m, _a, b) => b);  // [[tag|text]]
  s = s.replace(/\[\[([^\]]+)\]\]/g, (_m, a) => a.replace(/_/g, ' '));
  s = s.replace(/\{\{([^}]+)\}\}/g, (_m, a) => a.replace(/_/g, ' '));
  s = s.replace(/"([^"]+)":\[?(https?:\/\/[^\s\]]+|\/[^\s\]]*)\]?/g, '$1'); // "text":url
  s = s.replace(/<(https?:\/\/[^>]+)>/g, '$1');
  s = s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

// ---- cleanup: drop example-post references, keep See also ---------------
const EXAMPLES_HEADING = /^(examples?|example images?|gallery|sample images?|samples?)$/i;
const HEADING_LIKE = /^(examples?|see also|external links|related tags?|trivia|notes?|gallery|usage|history|tag group:.*|names?|sources?)$/i;
const POST_REF = /(?:!?(?:post|asset|pool|comment) #\d+)/i;

function cleanDefinition(text) {
  let s = String(text || '');
  // Parentheticals and "see post" sentences that only point at posts.
  s = s.replace(/\s*\((?:[^()]*?)(?:!?post|asset) #\d+(?:[^()]*?)\)/gi, '');
  const REFS = '(?:post|asset) #\\d+(?:(?:,|\\s+and|\\s+or)\\s+(?:post|asset) #\\d+)*';
  // A sentence that starts "See post #…" is only a pointer: it goes whole.
  s = s.replace(new RegExp(`(^|[.!?]\\s+)See ${REFS}[^.\\n]*\\.?`, 'gim'), '$1');
  // Elsewhere just the phrase goes ("as seen in post #1, revealed…" keeps its sentence).
  s = s.replace(new RegExp(`,?\\s*\\b(?:e\\.g\\.,?|as seen in|as shown in|seen in|shown in|see)\\s+${REFS}`, 'gi'), '');
  s = s.replace(new RegExp(`,?\\s*\\b(?:in|on|at)\\s+${REFS}`, 'gi'), '');
  const blocks = s.split(/\n\s*\n/).map((block) => block.split('\n')
    // A line that is only references (optionally with a caption) goes entirely.
    .filter((line) => !/^\s*[-*•]?\s*!?(?:post|asset) #\d+/i.test(line))
    // Leftover bare references inside a sentence.
    .map((line) => line.replace(/\s*[-–:]?\s*!?(?:post|asset) #\d+(?:(?:,|\s+and|\s+or)\s*!?(?:post|asset) #\d+)*/gi, '')
      .replace(/\s+([,.;:])/g, '$1').replace(/\(\s*\)/g, '').replace(/\s{2,}/g, ' ').trimEnd()
      // "In post #1, she appears…" leaves ", she appears…": drop the stray
      // punctuation and re-capitalize.
      .replace(/^(\s*)[,;:]\s*(\S)/, (_m, sp, c) => sp + c.toUpperCase()))
    .filter((line) => line.trim() && !/^[\s:,.;-]+$/.test(line))
    .join('\n')).filter((b) => b.trim());
  // An "Examples" heading whose content was all references now heads nothing.
  const out = [];
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i].trim();
    if (EXAMPLES_HEADING.test(b)) {
      const next = blocks[i + 1] ? blocks[i + 1].trim() : '';
      if (!next || HEADING_LIKE.test(next.split('\n')[0])) continue;
    }
    out.push(blocks[i]);
  }
  return out.join('\n\n').trim();
}

// ---- API -----------------------------------------------------------------
let auth = '';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function api(pathname, params) {
  const url = new URL(API + pathname);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { Authorization: auth, 'User-Agent': 'OsmiumWorkshop-wiki-builder/1.0', Accept: 'application/json' } });
    if (res.ok) return res.json();
    if ((res.status === 429 || res.status >= 500) && attempt < 5) { await sleep(2000 * attempt); continue; }
    throw new Error(`${pathname} -> HTTP ${res.status} ${(await res.text()).slice(0, 200).replace(/\s+/g, ' ')}`);
  }
}

// Pages id-descending with Danbooru's "b<id>" cursor.
async function* pages(pathname, params, limitPages = Infinity) {
  let before = null;
  for (let n = 0; n < limitPages; n++) {
    const rows = await api(pathname, { ...params, limit: 1000, ...(before ? { page: 'b' + before } : {}) });
    if (!rows.length) return;
    yield rows;
    before = rows[rows.length - 1].id;
    await sleep(DELAY_MS);
  }
}

async function main() {
  const wiki = readGz(WIKI);
  const tags = readGz(TAGS);
  const before = { wiki: Object.keys(wiki).length, tags: tags.length };

  if (!CLEAN_ONLY) {
    const login = userEnv('DANBOORU_LOGIN'), key = userEnv('DANBOORU_API_KEY');
    if (!login || !key) throw new Error('Set DANBOORU_LOGIN and DANBOORU_API_KEY first (setx, then this works from any new terminal).');
    auth = 'Basic ' + Buffer.from(`${login}:${key}`).toString('base64');

    // 1. New tags.
    const known = new Set(tags.map((r) => r[0]));
    let run = 0, added = 0;
    outer: for await (const rows of pages('/tags.json', { 'search[hide_empty]': 'true', only: 'id,name,category,post_count' }, PROBE ? 1 : Infinity)) {
      for (const t of rows) {
        if (known.has(t.name)) { if (++run >= KNOWN_RUN_STOP) break outer; continue; }
        run = 0;
        known.add(t.name);
        tags.push([t.name, t.category, t.post_count]);
        added++;
      }
      process.stdout.write(`\r[tags] +${added} new so far`);
    }
    console.log(`\n[tags] ${added} new tags`);

    // 2. Wiki pages.
    let filled = 0, seen = 0;
    const samples = [];
    for await (const rows of pages('/wiki_pages.json', { only: 'id,title,body,is_deleted' }, PROBE ? 1 : Infinity)) {
      for (const p of rows) {
        seen++;
        if (p.is_deleted || !p.body || wiki[p.title] || !known.has(p.title)) continue;
        const def = cleanDefinition(dtextToPlain(p.body));
        if (!def) continue;
        wiki[p.title] = def;
        filled++;
        if (samples.length < 3) samples.push([p.title, def.slice(0, 240)]);
      }
      process.stdout.write(`\r[wiki] ${seen} pages read, +${filled} definitions`);
    }
    console.log(`\n[wiki] ${filled} definitions added`);
    for (const [t, d] of samples) console.log(`  e.g. ${t}: ${JSON.stringify(d)}`);
  }

  // 3. Clean every definition (and drop skipped categories' pages / tags).
  const categoryOf = new Map(tags.map((r) => [r[0], r[1]]));
  const tagsBefore = tags.length;
  for (let i = tags.length - 1; i >= 0; i--) if (DROP_TAG_CATEGORIES.has(tags[i][1])) tags.splice(i, 1);
  console.log(`[tags] ${tagsBefore - tags.length} meta tags dropped from the vocabulary`);
  let cleaned = 0, skipped = 0;
  for (const k of Object.keys(wiki)) {
    if (SKIP_WIKI_CATEGORIES.has(categoryOf.get(k))) { delete wiki[k]; skipped++; continue; }
    const c = cleanDefinition(wiki[k]);
    if (c !== wiki[k]) cleaned++;
    if (c) wiki[k] = c; else delete wiki[k];
  }
  console.log(`[clean] ${cleaned} definitions cleaned, ${skipped} artist/meta pages dropped`);

  tags.sort((a, b) => b[2] - a[2]);
  console.log(`[done] wiki ${before.wiki} -> ${Object.keys(wiki).length}, tags ${before.tags} -> ${tags.length}`);
  if (PROBE) { console.log('[probe] nothing written'); return; }
  writeGz(WIKI, wiki);
  writeGz(TAGS, tags);
  console.log('[done] wrote renderer/data/wiki.json.gzdat and all_tags.json.gzdat');
}

module.exports = { cleanDefinition, dtextToPlain };
if (require.main === module) main().catch((err) => { console.error('[error]', err.message); process.exit(1); });
