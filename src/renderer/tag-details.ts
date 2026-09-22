import type { FolderStats } from './types';
import { getJSON, setJSON } from './storage';
import {
  tagDetailsTitle, tagDetailsBody, tagDetailsCloseBtn, tagDetailsPanel,
  themeCustomPanel, favoritesPanel, logPanel, achievementsPanel, shopPanel
} from './dom';
import { toast, showPanel, hidePanel } from './shared-ui';
import { folderStats, saveFolderStats, checkAchievements } from './achievements';

let wikiData: Record<string, string> | null = null;
let allTagsMap: Map<string, { category: number; count: number }> | null = null;

// Both bundled data files ship gzip-compressed (~63% smaller than the raw
// JSON — a meaningful chunk of the app's total install size) and are
// decompressed here at load time using the browser-native
// DecompressionStream, so no extra dependency is needed.
//
// Filenames deliberately do NOT end in `.gz` (they're `.gzdat`, still raw
// gzip bytes) — the Android Gradle Plugin's asset merge step silently
// DECOMPRESSES and renames any `*.gz` asset it finds (`all_tags.json.gz`
// became a 25MB `all_tags.json` in the packaged APK, `.gz` stripped
// entirely), presumably an AGP optimization assuming a pre-compressed web
// asset wants normal APK compression instead of double-gzip. The renderer
// then fetched a URL that no longer existed — silently caught, so mobile's
// tag definitions/autocomplete vocabulary were just permanently empty with
// no visible error until logging was added here. A `.gzdat` extension
// isn't a pattern AGP's asset pipeline recognizes, so the file passes
// through untouched; found via `unzip -lv` on the built APK, comparing the
// packaged entry's name/size against the source file.
async function fetchGzipJson(url: string): Promise<unknown> {
  const res = await fetch(url);
  const decompressed = res.body!.pipeThrough(new DecompressionStream('gzip'));
  const text = await new Response(decompressed).text();
  return JSON.parse(text);
}

export async function ensureWikiDataLoaded(): Promise<Record<string, string>> {
  if (wikiData) return wikiData;
  try {
    wikiData = await fetchGzipJson('./data/wiki.json.gzdat') as Record<string, string>;
  } catch(err){
    console.error('wiki.json.gzdat load failed:', err);
    wikiData = {};
  }
  return wikiData;
}

export async function ensureAllTagsLoaded(): Promise<Map<string, { category: number; count: number }>> {
  if (allTagsMap) return allTagsMap;
  try {
    const list = await fetchGzipJson('./data/all_tags.json.gzdat') as unknown[];
    allTagsMap = new Map();
    for (const row of list){
      if (Array.isArray(row)) allTagsMap.set(row[0] as string, { category: row[1] as number, count: row[2] as number });
    }
  } catch(err){
    console.error('all_tags.json.gzdat load failed:', err);
    allTagsMap = new Map();
  }
  return allTagsMap;
}

const CATEGORY_NAMES: Record<number, string> = { 0: 'General', 1: 'Artist', 3: 'Copyright', 4: 'Character', 5: 'Meta' };
const CUSTOM_NOTES_KEY = 'dts-custom-tag-notes';

export function getCustomTagNote(tag: string): string {
  try {
    const notes = getJSON<Record<string, string>>(CUSTOM_NOTES_KEY, {});
    return notes[tag] || '';
  } catch(e){ return ''; }
}
export function setCustomTagNote(tag: string, text: string): void {
  try {
    const notes = getJSON<Record<string, string>>(CUSTOM_NOTES_KEY, {});
    notes[tag] = text;
    setJSON(CUSTOM_NOTES_KEY, notes);
  } catch(e){}
}

export async function openTagDetails(tag: string): Promise<void> {
  tagDetailsTitle.textContent = tag;
  tagDetailsBody.innerHTML = '<div class="stats-empty">Loading…</div>';
  hidePanel(themeCustomPanel); hidePanel(favoritesPanel); hidePanel(logPanel); hidePanel(achievementsPanel); hidePanel(shopPanel);
  showPanel(tagDetailsPanel);

  folderStats.tag_details_opened = (folderStats.tag_details_opened || 0) + 1;
  saveFolderStats();
  checkAchievements();

  const wikiKey = tag.replace(/ /g, '_');
  const [wiki, allTags] = await Promise.all([ensureWikiDataLoaded(), ensureAllTagsLoaded()]);
  const def = wiki[wikiKey];
  const meta = allTags.get(wikiKey);

  tagDetailsBody.innerHTML = '';
  if (meta){
    const metaRow = document.createElement('div');
    metaRow.className = 'tag-details-meta';
    metaRow.innerHTML = `<span>${CATEGORY_NAMES[meta.category] || 'Unknown'}</span><span>${meta.count.toLocaleString()} posts</span>`;
    tagDetailsBody.appendChild(metaRow);
  }

  if (def){
    const defEl = document.createElement('div');
    defEl.className = 'tag-details-def';
    defEl.textContent = def;
    tagDetailsBody.appendChild(defEl);
  } else {
    const greyed = document.createElement('div');
    greyed.className = 'tag-details-def greyed';
    greyed.textContent = 'No official wiki entry for this tag.';
    tagDetailsBody.appendChild(greyed);

    const label = document.createElement('div');
    label.className = 'ctx-sep';
    label.textContent = 'Write your own description (saved on this computer):';
    tagDetailsBody.appendChild(label);

    const textarea = document.createElement('textarea');
    textarea.value = getCustomTagNote(tag);
    tagDetailsBody.appendChild(textarea);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'primary';
    saveBtn.textContent = 'Save description';
    saveBtn.addEventListener('click', () => {
      setCustomTagNote(tag, textarea.value);
      toast('Saved your description for this tag.');
    });
    tagDetailsBody.appendChild(saveBtn);
  }
}

export function initTagDetails(): void {
  tagDetailsCloseBtn.addEventListener('click', () => hidePanel(tagDetailsPanel));
}
