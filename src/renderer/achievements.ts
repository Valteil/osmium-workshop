import type { FolderStats, EditLogEntry, DirHandle } from './types';
import { getJSON, setJSON, getBool, setBool, getInt, setInt } from './storage';
import { writeBytes } from './fs-access';
import {
  walletDisplay, achWallet, shopWallet, achievementsPanel, achList, achPopupsToggle,
  btnAchievements, achCloseBtn, shopPanel, shopList, btnShop, shopCloseBtn,
  btnFreeEdibits, favoritesPanel, logPanel, tagDetailsPanel,
  themeSelect, btnResetEdibits, btnResetAchievements, achievementPopupHost,
  btnRefineTheme, suppressThemeFlourishesToggle, noFlourishHoverToggle, noFlourishTiltToggle, noFlourishAmbientToggle
} from './dom';
import { toast, showPanel, hidePanel, showConfirmModal, escapeHtml } from './shared-ui';
import { setIconLabel, iconSvg, rarityIcon } from './icons';
import {
  PREMIUM_THEMES, applyTheme, themeAlreadyHasPremiumEffects, refineThemeCost, markThemeRefined,
  refinedThemes
} from './themes';

export let folderStats: FolderStats = {};
export let folderUnlocked: string[] = [];
export let wallet = 0;
export let ownedThemes: string[] = ['studio','cyberpunk','oriental','subway','osmium'];
export let achievementPopupsEnabled = true;

interface AchievementsDeps {
  getDirHandle: () => DirHandle | null;
  getEditLog: () => EditLogEntry[];
  refreshThemeDropdownLabel: () => void;
}

let getDirHandle: () => DirHandle | null = () => null;
let getEditLog: () => EditLogEntry[] = () => [];
let refreshThemeDropdownLabel: () => void = () => {};

export function initAchievements(deps: AchievementsDeps): void {
  getDirHandle = deps.getDirHandle;
  getEditLog = deps.getEditLog;
  refreshThemeDropdownLabel = deps.refreshThemeDropdownLabel;
}

type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
const RARITY_VALUE: Record<Rarity, number> = { common: 10, uncommon: 25, rare: 60, epic: 120, legendary: 250 };

interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  rarity: Rarity;
  check: (s: FolderStats) => boolean;
}

const ACHIEVEMENTS: AchievementDef[] = [
  { id:'first-edit', title:'Baby Steps', desc:'Make your first tag edit in this folder.', rarity:'common',
    check: s => ((s.tags_added||0)+(s.tags_removed||0)+(s.merges||0)+(s.voids||0)+(s.renames||0)+(s.find_replaces||0)) >= 1 },
  { id:'eye-hater', title:"You really hate seeing, don't you?", desc:'Void 5+ tags containing "eye" in a single void action.', rarity:'uncommon',
    check: s => !!s.flag_eye_hater },
  { id:'hair-raiser', title:'Follicly Judgmental', desc:'Void 5+ tags containing "hair" in a single void action.', rarity:'uncommon',
    check: s => !!s.flag_hair_raiser },
  { id:'merge-10', title:'Merge Enjoyer', desc:'Perform 10 merges in this folder.', rarity:'common', check: s => (s.merges||0) >= 10 },
  { id:'merge-50', title:'Serial Merger', desc:'Perform 50 merges in this folder.', rarity:'rare', check: s => (s.merges||0) >= 50 },
  { id:'tags-100', title:'Tag Hoarder', desc:'Add 100 tags total in this folder.', rarity:'uncommon', check: s => (s.tags_added||0) >= 100 },
  { id:'remove-100', title:'Minimalist', desc:'Remove 100 tags total in this folder.', rarity:'uncommon', check: s => (s.tags_removed||0) >= 100 },
  { id:'void-200', title:'The Great Purge', desc:'Void 200+ tag instances total in this folder.', rarity:'epic', check: s => (s.voided_tag_instances||0) >= 200 },
  { id:'rename-10', title:'Rename Enjoyer', desc:'Use "Replace all" 10 times.', rarity:'common', check: s => (s.renames||0) >= 10 },
  { id:'fr-10', title:'Find & Replace Wizard', desc:'Use find & replace 10 times.', rarity:'common', check: s => (s.find_replaces||0) >= 10 },
  { id:'undo-20', title:'Time Traveler', desc:'Use Undo 20 times.', rarity:'uncommon', check: s => (s.undos||0) >= 20 },
  { id:'redo-10', title:'Back to the Future', desc:'Use Redo 10 times.', rarity:'uncommon', check: s => (s.redos||0) >= 10 },
  { id:'export-log', title:'Archivist', desc:'Export the edit log at least once.', rarity:'common', check: s => (s.log_exports||0) >= 1 },
  { id:'log-500', title:'Paper Trail', desc:'Accumulate 500 log entries in this folder.', rarity:'rare', check: s => (s.log_count||0) >= 500 },
  { id:'disable-10', title:'The Exile', desc:'Banish 10 images to Disabled/.', rarity:'uncommon', check: s => (s.disables||0) >= 10 },
  { id:'restore-5', title:'Second Chances', desc:'Restore 5 disabled images.', rarity:'common', check: s => (s.restores||0) >= 5 },
  { id:'indecisive', title:'Indecisive', desc:'Disable then restore the same image 3+ times.', rarity:'rare', check: s => !!s.flag_indecisive },
  { id:'review-10', title:'The Reviewer', desc:'Flag 10 images for review.', rarity:'uncommon', check: s => (s.review_flags||0) >= 10 },
  { id:'notes-5', title:'Note Taker', desc:'Write notes on 5 images.', rarity:'common', check: s => (s.notes_written||0) >= 5 },
  { id:'polyglot', title:'Polyglot', desc:'Tag 3+ different foreign languages across the dataset.', rarity:'rare', check: s => ((s.foreign_languages||[]).length) >= 3 },
  { id:'detective', title:'The Detective', desc:'Open Tag Details 20 times.', rarity:'uncommon', check: s => (s.tag_details_opened||0) >= 20 },
  { id:'decorator', title:'Interior Decorator', desc:'Customize and save a theme.', rarity:'common', check: s => !!s.theme_customized },
  { id:'shopper', title:'Window Shopper', desc:'Open the theme shop.', rarity:'common', check: s => !!s.shop_opened },
  { id:'big-spender', title:'Big Spender', desc:'Purchase a theme with Edibits.', rarity:'rare', check: s => (s.themes_purchased||0) >= 1 },
  { id:'cheapskate', title:'Cheapskate', desc:'Use the free Edibits button 5 times.', rarity:'common', check: s => (s.free_edibits_claims||0) >= 5 },
  { id:'zoom-300', title:'Zoom Zoom', desc:'Zoom an image past 300%.', rarity:'common', check: s => (s.zoom_max||0) >= 300 },
  { id:'card-peeker', title:'Card Peeker', desc:'Open the floating image card 10 times.', rarity:'common', check: s => (s.card_modal_opens||0) >= 10 },
  { id:'compact-fan', title:'Compact Enjoyer', desc:'Switch to compact grid view.', rarity:'common', check: s => !!s.compact_used },
  { id:'sort-master', title:'Sorted Life', desc:'Try 4+ different gallery sort modes.', rarity:'uncommon', check: s => ((s.sort_modes_used||[]).length) >= 4 },
  { id:'night-owl', title:'Night Owl', desc:'Enable night mode.', rarity:'common', check: s => !!s.night_mode_used },
  { id:'isolation-ward', title:'Isolation Ward', desc:'Use "Flag isolated tags" to review rare tags.', rarity:'uncommon', check: s => !!s.isolated_flag_used },
  { id:'the-overseer', title:'The Overseer', desc:'Use Master Tag Control to apply, remove, or rename a tag.', rarity:'rare', check: s => (s.master_ops||0) >= 1 },
  { id:'yeet', title:'Yeet', desc:'Drag an image onto the Disabled tab.', rarity:'uncommon', check: s => !!s.drag_disabled_used },
  // Quick wins — for smaller datasets or a light editing pass, so there's
  // still real Edibits to earn without grinding through hundreds of edits.
  { id:'first-save', title:'Locked In', desc:'Save your changes to disk for the first time.', rarity:'common', check: s => (s.saves||0) >= 1 },
  { id:'tags-10', title:'Ten Tags In', desc:'Add 10 tags total in this folder.', rarity:'common', check: s => (s.tags_added||0) >= 10 },
  { id:'remove-10', title:'Tidied Up', desc:'Remove 10 tags total in this folder.', rarity:'common', check: s => (s.tags_removed||0) >= 10 },
  { id:'review-1', title:'Speed Reviewer', desc:'Flag your first image for review.', rarity:'common', check: s => (s.review_flags||0) >= 1 },
  { id:'favorite-1', title:'Keeper', desc:'Save this folder to Favorites.', rarity:'common', check: s => (s.favorited||0) >= 1 },
  // Steady-progress milestones — the grindier tier above the originals, for
  // datasets you spend real time in.
  { id:'tags-500', title:'Compulsive Tagger', desc:'Add 500 tags total in this folder.', rarity:'rare', check: s => (s.tags_added||0) >= 500 },
  { id:'remove-500', title:'Deep Clean', desc:'Remove 500 tags total in this folder.', rarity:'rare', check: s => (s.tags_removed||0) >= 500 },
  { id:'undo-100', title:'Undo Veteran', desc:'Use Undo 100 times.', rarity:'rare', check: s => (s.undos||0) >= 100 },
  { id:'merge-100', title:'Merge Machine', desc:'Perform 100 merges in this folder.', rarity:'epic', check: s => (s.merges||0) >= 100 },
  { id:'log-2000', title:'Chronicler', desc:'Accumulate 2000 log entries in this folder.', rarity:'epic', check: s => (s.log_count||0) >= 2000 },
  { id:'marathon-1000', title:'Marathon Session', desc:'Rack up 1000 combined tag edits (added/removed/merged/voided) in this folder.', rarity:'epic',
    check: s => ((s.tags_added||0)+(s.tags_removed||0)+(s.merges||0)+(s.voids||0)) >= 1000 },
  // Dataset tab / Refine Theme / Unload dataset / keyboard menu nav
  { id:'dataset-collector', title:'Dataset Collector', desc:'Add 3 dataset folders to the Dataset tab.', rarity:'uncommon', check: s => (s.dataset_tab_adds||0) >= 3 },
  { id:'icon-artist', title:'Icon Artist', desc:'Set an image as a Dataset tab folder\'s icon.', rarity:'common', check: s => (s.dataset_icon_images_set||0) >= 1 },
  { id:'nosy-neighbor', title:'Nosy Neighbor', desc:'View another dataset folder\'s achievements from the Dataset tab.', rarity:'uncommon', check: s => (s.other_folder_achievements_viewed||0) >= 1 },
  { id:'theme-refiner', title:'Theme Refiner', desc:'Refine a theme in the shop.', rarity:'rare', check: s => (s.themes_refined||0) >= 1 },
  { id:'clean-slate', title:'Clean Slate', desc:'Unload a dataset without quitting the app.', rarity:'common', check: s => (s.dataset_unloads||0) >= 1 },
  { id:'keyboard-navigator', title:'Keyboard Navigator', desc:'Navigate an open menu or dropdown with the arrow keys.', rarity:'common', check: s => !!s.keyboard_menu_nav_used },
  { id:'wd14-autotagger', title:'Snake Charmer', desc:'Tag an image using the WD14 Autotagger.', rarity:'uncommon', check: s => (s.wd14_images_tagged||0) >= 1 },
  // Right-panel UX pass additions
  { id:'sniper-search', title:'Sniper Search', desc:'Turn on Exact tag match in the gallery filter.', rarity:'common', check: s => !!s.exact_match_used },
  { id:'family-finder', title:'Family Finder', desc:"Pick a tag from the filter's suggestion dropdown.", rarity:'common', check: s => !!s.filter_suggestions_used },
  { id:'grid-lock', title:'Grid Lock', desc:'Force a fixed gallery column count in Settings.', rarity:'common', check: s => !!s.gallery_columns_forced },
  { id:'completionist-25', title:'Living Legend', desc:'Unlock 25 other achievements in this folder.', rarity:'legendary', check: s => (s.achievements_unlocked||0) >= 25 }
];

export function trackStat(key: string, amount = 1): void {
  folderStats[key] = ((folderStats[key] as number) || 0) + amount;
  saveFolderStats();
}

const META_FILE_NAME = '_dts_meta.json';
const ACH_FILE_NAME = '_dts_achievements.json';

export async function saveFolderStats(): Promise<void> {
  const dirHandle = getDirHandle();
  if (!dirHandle) return;
  try {
    const handle = await dirHandle.getFileHandle(ACH_FILE_NAME, { create: true });
    await writeBytes(handle, JSON.stringify({ stats: folderStats, unlocked: folderUnlocked }, null, 2));
  } catch(err){}
}

export async function loadFolderStats(): Promise<void> {
  folderStats = {};
  folderUnlocked = [];
  const dirHandle = getDirHandle();
  if (!dirHandle) return;
  try {
    const handle = await dirHandle.getFileHandle(ACH_FILE_NAME, { create: false });
    const file = await handle.getFile();
    const parsed = JSON.parse((await file.text()).trim() || '{}');
    folderStats = parsed.stats || {};
    folderUnlocked = parsed.unlocked || [];
  } catch(err){
    folderStats = {};
    folderUnlocked = [];
  }
}

export function saveWallet(): void {
  setInt('dts-wallet', wallet);
  setJSON('dts-owned-themes', ownedThemes);
  walletDisplay.textContent = String(wallet);
  achWallet.textContent = String(wallet);
  shopWallet.textContent = String(wallet);
}

// Deducts `amount` if the wallet covers it (Theme Studio's effect unlocks).
export function spendEdibits(amount: number): boolean {
  if (amount <= 0) return true;
  if (wallet < amount) return false;
  wallet -= amount;
  saveWallet();
  return true;
}

export function loadWallet(): void {
  wallet = getInt('dts-wallet', 0);
  const owned = getJSON<string[] | null>('dts-owned-themes', null);
  if (Array.isArray(owned)) ownedThemes = Array.from(new Set(['studio','cyberpunk','oriental','subway','osmium', ...owned]));
  saveWallet();
}

export function resetWallet(): void {
  wallet = 0;
  saveWallet();
}

export function resetFolderAchievements(): void {
  folderUnlocked = [];
  folderStats = {};
  saveFolderStats();
}

export function checkAchievements(): void {
  // Achievements/Edibits are per-dataset (see saveFolderStats()/
  // loadFolderStats()), but folderStats itself is a plain module-level
  // object — with no dataset loaded it should already be {} (reset on
  // unload), yet several features (Settings toggles, the gallery filter's
  // "Exact tag match"/suggestions, etc.) are still reachable with nothing
  // loaded and call trackStat()/checkAchievements() unconditionally. Without
  // this guard, using one of those with no dataset open could unlock an
  // achievement and grant real (globally-persisted) wallet currency for
  // progress that isn't tied to any actual dataset.
  if (!getDirHandle()) return;
  folderStats.log_count = getEditLog().length;
  // Read by the 'completionist-25' meta-achievement below — set from the
  // PREVIOUS call's tally, not this one's, since achievements unlocked
  // during this same pass haven't been counted yet when their own check()
  // runs. That's fine: it just resolves on the call right after the 25th.
  folderStats.achievements_unlocked = folderUnlocked.length;
  let unlockedAny = false;
  for (const ach of ACHIEVEMENTS){
    if (folderUnlocked.includes(ach.id)) continue;
    let met = false;
    try { met = !!ach.check(folderStats); } catch(e){ met = false; }
    if (!met) continue;
    folderUnlocked.push(ach.id);
    unlockedAny = true;
    const reward = RARITY_VALUE[ach.rarity] || 10;
    wallet += reward;
    saveWallet();
    if (achievementPopupsEnabled) showAchievementPopup(ach, reward);
  }
  if (unlockedAny){
    saveFolderStats();
    if (achievementsPanel.style.display === 'flex') renderAchievementsPanel();
  }
}

export function checkVoidThemeAchievements(tagList: string[], _voidedTagInstances: number): void {
  const lower = tagList.map((t: string) => t.toLowerCase());
  const eyeCount = lower.filter(t => t.includes('eye')).length;
  const hairCount = lower.filter(t => t.includes('hair')).length;
  if (eyeCount >= 5) folderStats.flag_eye_hater = true;
  if (hairCount >= 5) folderStats.flag_hair_raiser = true;
  saveFolderStats();
}

function showAchievementPopup(ach: AchievementDef, reward: number): void {
  const popup = document.createElement('div');
  popup.className = 'ach-popup';
  popup.innerHTML = `
    <span class="ach-rarity-icon">${rarityIcon(ach.rarity)}</span>
    <div class="ach-info">
      <div class="ach-title">${iconSvg('trophy', 'ic-lead')}${escapeHtml(ach.title)}</div>
      <div class="ach-desc">${escapeHtml(ach.desc)}</div>
      <div class="ach-reward">${ach.rarity} achievement · +${reward} Edibits</div>
    </div>
  `;
  achievementPopupHost.appendChild(popup);
  setTimeout(() => {
    popup.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    popup.style.opacity = '0';
    popup.style.transform = 'translateX(20px)';
    setTimeout(() => popup.remove(), 420);
  }, 5000);
}

// Optional unlockedOverride lets a caller render another folder's unlocked
// achievements read-only (dataset-manager.ts's "View achievements"
// context-menu action) WITHOUT touching the live folderUnlocked global —
// mutating that would corrupt whichever folder is actually open. Every
// existing call site calls this with no args, which keeps rendering the
// live, currently-open folder exactly as before.
export function renderAchievementsPanel(unlockedOverride?: string[]): void {
  const unlockedList = unlockedOverride || folderUnlocked;
  achWallet.textContent = String(wallet);
  achList.innerHTML = '';
  for (const ach of ACHIEVEMENTS){
    const unlocked = unlockedList.includes(ach.id);
    const row = document.createElement('div');
    row.className = 'ach-row ' + (unlocked ? 'unlocked' : 'locked');
    row.innerHTML = `
      <span class="ach-rarity-icon">${rarityIcon(ach.rarity)}</span>
      <div class="ach-info">
        <div class="ach-title">${unlocked ? iconSvg('trophy', 'ic-lead') : ''}${escapeHtml(ach.title)}</div>
        <div class="ach-desc">${escapeHtml(ach.desc)}</div>
        <div class="ach-reward">${unlocked ? 'Unlocked' : 'Locked'} · ${ach.rarity} · +${RARITY_VALUE[ach.rarity]} Edibits</div>
      </div>
    `;
    achList.appendChild(row);
  }
}

export function updateThemeSelectLocks(): void {
  for (const t of PREMIUM_THEMES){
    const opt = themeSelect.querySelector(`option[value="${t.id}"]`);
    // Plain text on purpose: the <option> is only the hidden value store
    // (an <option> can't hold an <svg>). The custom theme menu renders the
    // 🔒 as an icon via setIconLabel (themes.ts).
    if (opt) opt.textContent = ownedThemes.includes(t.id) ? t.name : `🔒 ${t.name}`;
  }
  refreshThemeDropdownLabel();
}

export function renderShopPanel(): void {
  shopWallet.textContent = String(wallet);
  shopList.innerHTML = '';
  // Cheapest first — PREMIUM_THEMES' own order is just whatever order
  // themes were added over time, not a meaningful browsing order.
  const byPrice = [...PREMIUM_THEMES].sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
  for (const t of byPrice){
    const owned = ownedThemes.includes(t.id);
    const row = document.createElement('div');
    row.className = 'shop-row' + (refinedThemes.includes(t.id) ? ' refined' : '');
    const swatches = document.createElement('div');
    swatches.className = 'shop-swatches';
    t.swatches.forEach(c => {
      const sw = document.createElement('span');
      sw.className = 'shop-swatch';
      sw.style.background = c;
      swatches.appendChild(sw);
    });
    const info = document.createElement('div');
    info.className = 'shop-info';
    info.innerHTML = `<div class="shop-name">${escapeHtml(t.name)}</div><div class="shop-rarity">${t.rarity} · ${t.price} Edibits</div>`;
    const btn = document.createElement('button');
    if (owned){
      const active = themeSelect.value === t.id;
      setIconLabel(btn, active ? 'In use ✓' : 'Use');
      btn.disabled = active;
      if (!active){
        btn.addEventListener('click', (ev) => { ev.stopPropagation(); useOwnedTheme(t); });
      }
    } else {
      btn.textContent = 'Buy';
      btn.className = 'primary';
      btn.disabled = wallet < t.price;
      btn.addEventListener('click', (ev) => { ev.stopPropagation(); buyTheme(t); });
    }
    row.appendChild(swatches);
    row.appendChild(info);
    row.appendChild(btn);
    shopList.appendChild(row);
  }
}

// Switches to an already-owned theme straight from the shop — buyTheme()
// already applies the theme it just sold, but before this there was no way
// to switch BACK to a previously-bought theme from here; you had to leave
// the shop and use the Settings theme dropdown instead.
interface PremiumThemeDef { id: string; name: string; rarity: string; price: number; swatches: string[] }
function useOwnedTheme(t: PremiumThemeDef): void {
  themeSelect.value = t.id;
  applyTheme(t.id);
  toast(`Switched to "${t.name}".`);
  renderShopPanel();
  updateRefineThemeButton();
}

function buyTheme(t: PremiumThemeDef): void {
  if (ownedThemes.includes(t.id)) return;
  if (wallet < t.price){ toast('Not enough Edibits for that yet.'); return; }
  wallet -= t.price;
  ownedThemes.push(t.id);
  saveWallet();
  themeSelect.value = t.id;
  applyTheme(t.id);
  toast(`Purchased and applied "${t.name}"!`);
  folderStats.themes_purchased = (folderStats.themes_purchased || 0) + 1;
  saveFolderStats();
  // Deliberately does NOT hide/close shopPanel — buying a theme shouldn't
  // kick you out of the shop, it should just let you keep browsing/buying.
  renderShopPanel();
  updateThemeSelectLocks();
  updateRefineThemeButton();
  checkAchievements();
}

// Refine Theme: buy the epic/legendary-tier hover-fill effect for whichever
// theme is CURRENTLY ACTIVE (themeSelect.value), individually, rather than
// only getting it by buying one of the five hardcoded epic/legendary
// themes. Cost is epicPrice - thatTheme'sOwnPrice (free built-ins and
// Custom cost 0, so they cost the full epic price) — see refineThemeCost()/
// themeAlreadyHasPremiumEffects() in themes.ts, which also owns the
// `refinedThemes` list and the `html.theme-refined` class the CSS keys off.
export function updateRefineThemeButton(): void {
  if (suppressThemeFlourishesToggle.checked){
    btnRefineTheme.style.display = 'none';
    return;
  }
  btnRefineTheme.style.display = '';
  const currentTheme = themeSelect.value;
  if (currentTheme === 'custom'){
    setIconLabel(btnRefineTheme, '🔨 Refine Theme (set in Theme Studio)');
    btnRefineTheme.disabled = true;
    btnRefineTheme.title = 'Custom picks its own button fill and card hover in Theme Studio ▸ Effects.';
    return;
  }
  if (themeAlreadyHasPremiumEffects(currentTheme)){
    setIconLabel(btnRefineTheme, '🔨 Refine Theme (already refined)');
    btnRefineTheme.disabled = true;
    btnRefineTheme.title = 'The current theme already has the epic/legendary button effects.';
    return;
  }
  const cost = refineThemeCost(currentTheme);
  setIconLabel(btnRefineTheme, `🔨 Refine Theme (${cost} Edibits)`);
  btnRefineTheme.disabled = wallet < cost;
  btnRefineTheme.title = 'Upgrade the current theme to epic/legendary-tier button effects.';
}

function refineCurrentTheme(): void {
  const currentTheme = themeSelect.value;
  if (themeAlreadyHasPremiumEffects(currentTheme)) return;
  const cost = refineThemeCost(currentTheme);
  if (wallet < cost){ toast('Not enough Edibits for that yet.'); return; }
  wallet -= cost;
  saveWallet();
  markThemeRefined(currentTheme);
  toast('Theme refined — it now has epic/legendary-tier button effects!');
  folderStats.themes_refined = (folderStats.themes_refined || 0) + 1;
  saveFolderStats();
  updateRefineThemeButton();
  checkAchievements();
}

export function initAchievementPanels(): void {
  btnAchievements.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (achievementsPanel.style.display === 'flex'){ hidePanel(achievementsPanel); return; }
    hidePanel(shopPanel); hidePanel(favoritesPanel); hidePanel(logPanel); hidePanel(tagDetailsPanel);
    renderAchievementsPanel();
    showPanel(achievementsPanel);
  });
  achCloseBtn.addEventListener('click', () => hidePanel(achievementsPanel));

  achPopupsToggle.addEventListener('change', () => {
    achievementPopupsEnabled = achPopupsToggle.checked;
    setBool('dts-ach-popups', achievementPopupsEnabled);
  });
  (function initAchPopupPref(){
    const on = getBool('dts-ach-popups', true);
    achievementPopupsEnabled = on;
    achPopupsToggle.checked = on;
  })();

  btnShop.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (shopPanel.style.display === 'flex'){ hidePanel(shopPanel); return; }
    hidePanel(achievementsPanel); hidePanel(favoritesPanel); hidePanel(logPanel); hidePanel(tagDetailsPanel);
    folderStats.shop_opened = true;
    saveFolderStats();
    renderShopPanel();
    updateRefineThemeButton();
    showPanel(shopPanel);
    checkAchievements();
  });
  shopCloseBtn.addEventListener('click', () => hidePanel(shopPanel));

  btnRefineTheme.addEventListener('click', (ev) => {
    ev.stopPropagation();
    refineCurrentTheme();
  });

  suppressThemeFlourishesToggle.addEventListener('change', () => {
    const on = suppressThemeFlourishesToggle.checked;
    setBool('dts-suppress-theme-flourishes', on);
    document.documentElement.classList.toggle('suppress-theme-flourishes', on);
    updateRefineThemeButton();
  });
  (function initSuppressThemeFlourishesPref(){
    const on = getBool('dts-suppress-theme-flourishes');
    suppressThemeFlourishesToggle.checked = on;
    document.documentElement.classList.toggle('suppress-theme-flourishes', on);
  })();

  // Three independent "visual flourish" toggles — hover-fill, card-tilt,
  // and ambient animations can each be turned off on their own, instead of
  // one blanket switch (see styles.css's "Visual flourishes" comment).
  function wireFlourishToggle(toggleEl: HTMLInputElement, storageKey: string, className: string): void {
    toggleEl.addEventListener('change', () => {
      const on = toggleEl.checked;
      setBool(storageKey, on);
      document.documentElement.classList.toggle(className, on);
    });
    const on = getBool(storageKey);
    toggleEl.checked = on;
    document.documentElement.classList.toggle(className, on);
  }
  wireFlourishToggle(noFlourishHoverToggle, 'dts-no-flourish-hover', 'no-flourish-hover');
  wireFlourishToggle(noFlourishTiltToggle, 'dts-no-flourish-tilt', 'no-flourish-tilt');
  wireFlourishToggle(noFlourishAmbientToggle, 'dts-no-flourish-ambient', 'no-flourish-ambient');

  btnFreeEdibits.addEventListener('click', () => {
    const lines = [
      'The shopkeeper begrudgingly hands you some Edibits.',
      'You find a few Edibits behind the couch cushions.',
      'A stranger gives you Edibits, no questions asked.',
      'You win a small prize at the Edibit lottery.',
      'The developer takes pity on you.'
    ];
    const amount = 10 + Math.floor(Math.random() * 16);
    wallet += amount;
    saveWallet();
    toast(`${lines[Math.floor(Math.random()*lines.length)]} +${amount} Edibits.`);
    folderStats.free_edibits_claims = (folderStats.free_edibits_claims || 0) + 1;
    saveFolderStats();
    renderShopPanel();
    checkAchievements();
  });

  btnResetEdibits.addEventListener('click', async () => {
    const ok = await showConfirmModal('Reset your Edibits balance to 0? This does not affect owned themes or achievements.', { danger: true });
    if (!ok) return;
    resetWallet();
    toast('Edibits reset to 0.');
  });

  btnResetAchievements.addEventListener('click', async () => {
    const ok = await showConfirmModal('Reset achievement progress for this folder? This resets BOTH unlocked achievements and their underlying progress counters, so nothing re-unlocks itself on next load. Edibits already earned stay in your wallet.', { danger: true });
    if (!ok) return;
    resetFolderAchievements();
    if (achievementsPanel.style.display === 'flex') renderAchievementsPanel();
    toast('Achievement progress reset for this folder.');
  });
}
