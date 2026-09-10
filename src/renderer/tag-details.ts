// Phase B module: the Tag Details panel and its Danbooru wiki/all-tags data
// loaders (also used by ./tags-autocomplete.ts's inline definition flash card,
// injected there via initTagAutocomplete rather than imported, to avoid a
// circular import).
// @ts-nocheck
import {
  tagDetailsTitle, tagDetailsBody, tagDetailsCloseBtn, tagDetailsPanel,
  themeCustomPanel, favoritesPanel, logPanel, achievementsPanel, shopPanel
} from './dom';
import { toast, showPanel, hidePanel } from './shared-ui';
import { folderStats, saveFolderStats, checkAchievements } from './achievements';

let wikiData = null;      // lazy-loaded tag -> definition
let allTagsMap = null;    // lazy-loaded tag -> {category, count}

// Both bundled data files ship gzip-compressed (wiki.json.gz/all_tags.json.gz
// are ~63% smaller than the raw JSON — a meaningful chunk of the app's
// total install size) and are decompressed here at load time using the
// browser-native DecompressionStream, so no extra dependency is needed.
async function fetchGzipJson(url){
  const res = await fetch(url);
  const decompressed = res.body.pipeThrough(new DecompressionStream('gzip'));
  const text = await new Response(decompressed).text();
  return JSON.parse(text);
}

export async function ensureWikiDataLoaded(){
  if (wikiData) return wikiData;
  try {
    wikiData = await fetchGzipJson('./data/wiki.json.gz');
  } catch(err){
    wikiData = {};
  }
  return wikiData;
}

export async function ensureAllTagsLoaded(){
  if (allTagsMap) return allTagsMap;
  try {
    const list = await fetchGzipJson('./data/all_tags.json.gz');
    allTagsMap = new Map();
    for (const row of list){
      if (Array.isArray(row)) allTagsMap.set(row[0], { category: row[1], count: row[2] });
    }
  } catch(err){
    allTagsMap = new Map();
  }
  return allTagsMap;
}

const CATEGORY_NAMES = { 0: 'General', 1: 'Artist', 3: 'Copyright', 4: 'Character', 5: 'Meta' };
const CUSTOM_NOTES_KEY = 'dts-custom-tag-notes';

export function getCustomTagNote(tag){
  try {
    const notes = JSON.parse(localStorage.getItem(CUSTOM_NOTES_KEY) || '{}');
    return notes[tag] || '';
  } catch(e){ return ''; }
}
export function setCustomTagNote(tag, text){
  try {
    const notes = JSON.parse(localStorage.getItem(CUSTOM_NOTES_KEY) || '{}');
    notes[tag] = text;
    localStorage.setItem(CUSTOM_NOTES_KEY, JSON.stringify(notes));
  } catch(e){}
}

export async function openTagDetails(tag){
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

export function initTagDetails(){
  tagDetailsCloseBtn.addEventListener('click', () => hidePanel(tagDetailsPanel));
}
