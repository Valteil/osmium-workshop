// @ts-nocheck
// Phase A (mechanical TS port): type-checking is off for this file because it's
// still the original untyped single-file renderer, just renamed .ts so esbuild
// can bundle it. Phase B splits this into the modules listed in CLAUDE.md and
// adds real types to each as it's extracted — remove this pragma module-by-module
// as that happens, never all at once (that's how you get inaccurate casts).
import {
  $, btnOpen, btnSave, btnUndo, btnRedo, btnUnloadDataset, dirtyCountEl, galleryToolbar, galleryGrid,
  compactGrid, compactCompareArea, compareCount, compactCompareTable, btnClearCompare,
  singleViewEl, imageCardModal, modalCardInner, dropHint, dropHintWrap, filterInput,
  filterAllBtn, filterUntaggedBtn, filterDirtyBtn, excludeBadge, excludeBadgeText,
  excludeBadgeClear, tagFrequencyList, leftSortDropdown, leftSortDirBtn,
  btnResetFamilyOrder, btnClearFilter, filterModeDropdown, btnFlagIsolated,
  tagPrunerList, btnAddTagPruner, selectionSummary, unifiedTagInput, btnApplyUnify,
  btnClearSelection, btnVoidSelected, includeDisabledToggle, allTagsDatalist, toastEl,
  themeSelect, themeDropdown, btnThemeCustomize, themeCustomPanel, themeVarRows, themeResetBtn,
  themeApplyBtn, themeCloseBtn, btnQuit, btnLeftDrawerToggle, btnRightDrawerToggle,
  drawerBackdrop, leftAside, rightAside, actionsScrollLeft, actionsScrollRight,
  topbarActions, fileCatBtn, fileCatFlyout,
  personalizationCatBtn, personalizationCatFlyout, flyoutOutsideCloseToggle,
  panelsOutsideCloseToggle, btnSettings, favoritesPanel,
  btnAddFavorite, logPanel, appVersionEl, tabGallery, tabMasterTags,
  tabStats, galleryTab, statsTab, btnStatsBack, btnMasterBack, normalRightTools,
  tabDatasetManager, datasetManagerTab, dmGrid, dmGridBtn, dmListBtn, dmSortDropdown,
  layoutDropdown, shellEl, btnResetZoom,
  customFontInput, btnApplyCustomFont, btnClearCustomFont, powerHighlightToggle,
  powerFillToggle, btnQuickMergeScan, quickMergeList, btnQuickMergeApply,
  tagAutocompleteToggle, btnGithubPackage, btnStartPowerToolPicker, powerToolList,
  btnResetCustomPowerTools, masterTagPanel, masterSelectionSummary, masterMiniGrid,
  btnMasterSelectAll, btnMasterClearSelection, masterApplyTagInput,
  btnMasterApplyToSelected, masterRemoveTagInput, btnMasterRemoveFromSelected,
  condSourceTag, condAddTag, btnCondApply, massApplyInput, btnMassApply,
  massRemoveInput, btnMassRemove, masterRenameFrom, masterRenameTo, btnMasterRename,
  masterFRFind, masterFRReplace, btnMasterFR,
  achievementsPanel, shopPanel, tagDetailsPanel,
  tagDetailsTitle, tagDetailsBody, tagDetailsCloseBtn, langMenuPanel,
  btnNightMode, viewGridBtn, viewCompactBtn, viewSingleBtn,
  viewDisabledBtn, gallerySortDropdown, gallerySortDirBtn, singleNav, singlePrevBtn,
  singleNextBtn, singlePos, uiAnimationsDropdown
} from './dom';
import { toast, showPanel, hidePanel, showConfirmModal, positionMenu, buildPersistentDropdown, initClickFlash, initMenuKeyboardNav } from './shared-ui';
import {
  PREMIUM_THEMES, STUDIO_DEFAULTS, applyTheme, openThemeCustomPanel, toggleDayNightMode, syncNightModeFromPrePaint,
  initThemeDropdown
} from './themes';
import { initDockSystem } from './docks';
import {
  applyAppZoom, resetAppZoom, getOutsideClosablePanels, saveSettingsSectionState,
  SETTINGS_SECTIONS_KEY, applyCustomFont
} from './settings';
import { initPowerTools } from './power-tools';
import {
  quickMergeGroups, quickMergeSelection, runQuickMergeScan, resetQuickMergeState,
  applyQuickMerge, renderQuickMergeList
} from './quick-merge';
import { initTagPruner, renderTagPruners, addTagPruner } from './tag-pruner';
import {
  tagAutocompleteEnabled, setTagAutocompleteEnabled, initTagAutocomplete
} from './tags-autocomplete';
import {
  folderStats, folderUnlocked, wallet, ownedThemes, initAchievements,
  initAchievementPanels, trackStat, saveFolderStats, loadFolderStats, saveWallet,
  loadWallet, checkAchievements, checkVoidThemeAchievements, updateThemeSelectLocks,
  renderAchievementsPanel, updateRefineThemeButton
} from './achievements';
import { initFavorites } from './favorites';
import { initDatasetManager, renderDatasetManagerTab, maybePromptAddDataset, syncPinFromFavoriteChange } from './dataset-manager';
import {
  editLog, pushLogEntry, loadEditLogForFolder, updateLogButton, renderLogPanel,
  renderStatsTab, initEditLog
} from './edit-log';
import {
  markDirty, updateDirtyUI, recordChange, applyTagDirection, updateUndoRedoButtons,
  resetUndoRedo, moveEntry, initTagsEdit, undoStack, redoStack, addTagToEntry,
  retroApplyToDisabled, retroApplyAllToDisabled
} from './tags-edit';
import {
  masterSelectedImages, renderMasterSelectionSummary, renderMasterMiniGrid, initMasterTagControl
} from './master-tag-control';
import { initWd14Tagger } from './wd14-tagger';
import {
  ensureWikiDataLoaded, ensureAllTagsLoaded, getCustomTagNote, setCustomTagNote,
  openTagDetails, initTagDetails
} from './tag-details';
import {
  buildTagIndex, refreshStats, filteredEntries, passesFilter, setBaseFilter,
  parseFilterTerms, setContainsFilter, setExcludesFilter, initTagIndex
} from './tag-index';
import {
  viewMode, resetSingleIndex, resetStickyCompare,
  renderCurrentView, switchView, refreshSelectionSummary, refreshRightPanels, initView
} from './view';
import { initRandomFacts } from './random-facts';
(function(){

  // ---------------- State ----------------
  let dirHandle = null;
  let disabledDirHandle = null;
  let entries = [];            // [{base, imgHandle, txtHandle, txtExisted, objectUrl, tags:[], dirty:bool, disabled:bool}]
  let entryByBase = new Map();
  let selectedTags = new Set();
  let galleryFilter = { base: 'all', terms: [], mode: 'AND', excludes: '', disabledView: false };
  // undoStack/redoStack moved to ./tags-edit.ts
  // viewMode/singleIndex/ctxMenuEl/commonLanguages moved to ./view.ts
  // editLog/logIdCounter moved to ./edit-log.ts
  // folderStats/folderUnlocked/wallet/ownedThemes/achievementPopupsEnabled moved to ./achievements.ts
  let gallerySortMode = 'filename';
  let gallerySortDir = 'asc';
  // leftSortMode/leftSortDir/familyOrder moved to ./tag-index.ts
  // dayNightOn moved to ./themes.ts
  let isolatedFlagActive = false;
  let cardTagSortMode = 'default'; // 'default' | 'alphabetical' | 'frequency'
  let masterTagModeActive = false;
  // masterSelectedImages moved to ./master-tag-control.ts
  // stickyCompareImages moved to ./view.ts
  // dockOrder/dockCollapsed/dockHeights moved to ./docks.ts
  // tagPruners/tagPrunerIdCounter moved to ./tag-pruner.ts
  let compactModeOn = false;
  let entryMeta = {};          // base -> {reviewColor, flaggedTags:[], note:'', noteAlwaysVisible:false}
  // wikiData/allTagsMap moved to ./tag-details.ts
  let activeLangMenuBase = null;
  // tagAutocompleteEnabled/autocompleteEl moved to ./tags-autocomplete.ts
  // quickMergeGroups/quickMergeSelection moved to ./quick-merge.ts
  // customPowerTools/powerToolPickerActive moved to ./power-tools.ts

  const IMAGE_EXT = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif'];

  // ---------------- DOM refs ----------------
  // (moved to ./dom.ts, imported at the top of this file)

  // applyAppZoom/resetAppZoom moved to ./settings.ts
  btnResetZoom.addEventListener('click', (ev) => { ev.stopPropagation(); resetAppZoom(); });
  // Safety net: works even if zoom has pushed every button off-screen or made the app unusable.
  document.addEventListener('keydown', (ev) => {
    if ((ev.ctrlKey || ev.metaKey) && (ev.key === '0' || ev.key === ')')) resetAppZoom();
  });
  // (moved to ./dom.ts, imported at the top of this file)

  // toast/showPanel/hidePanel/showConfirmModal moved to ./shared-ui.ts

  // Dockable right-sidebar panels (reorder/collapse/resize) moved to ./docks.ts

  // ---------------- Update bundle (applied via Electron main process) ----------------

  const btnRestartApp = $('btnRestartApp');
  btnRestartApp.addEventListener('click', async () => {
    if (!window.electronAPI || !window.electronAPI.restartApp){
      toast('Restart isn\'t available in this build — close and reopen the app by hand.', 3600);
      return;
    }
    const dirtyCount = entries.filter(e => e.dirty).length;
    if (dirtyCount > 0){
      const ok = await showConfirmModal(`You have ${dirtyCount} unsaved caption change(s). Restart anyway without saving?`, { okLabel: 'Restart anyway', danger: true });
      if (!ok) return;
    }
    window.electronAPI.restartApp();
  });

  // ---------------- Touch support: pinch-to-zoom + long-press (mobile groundwork) ----------------
  //
  // Single-finger drag-to-pan already works everywhere these are used, since that
  // code is built on Pointer Events (which unify mouse/touch/pen) rather than
  // legacy mouse-only events. These two helpers add the two things Pointer Events
  // don't cover: two-finger pinch gestures, and a touch-and-hold equivalent to
  // right-click that doesn't depend on a given mobile browser's own long-press
  // behavior (which varies — Android Chrome often synthesizes a contextmenu
  // event on long-press, iOS Safari generally does not).

  // attachPinchZoom/attachLongPress moved to ./shared-ui.ts

  // ---------------- Mobile drawer toggles (narrow-viewport layout) ----------------

  function closeDrawers(){
    leftAside.classList.remove('drawer-open');
    rightAside.classList.remove('drawer-open');
    drawerBackdrop.classList.remove('drawer-visible');
  }
  function openDrawer(which){
    closeDrawers();
    (which === 'left' ? leftAside : rightAside).classList.add('drawer-open');
    drawerBackdrop.classList.add('drawer-visible');
  }
  btnLeftDrawerToggle.addEventListener('click', () => {
    if (leftAside.classList.contains('drawer-open')) closeDrawers();
    else openDrawer('left');
  });
  btnRightDrawerToggle.addEventListener('click', () => {
    if (rightAside.classList.contains('drawer-open')) closeDrawers();
    else openDrawer('right');
  });
  drawerBackdrop.addEventListener('click', closeDrawers);

  // buildPersistentDropdown moved to ./shared-ui.ts

  // ---------------- Theme (built-in + native custom colors) ----------------
  // THEME_VARS/STUDIO_DEFAULTS/PREMIUM_THEMES/toHex6/getCurrentVarHex/
  // clearCustomOverrides/applyTheme/openThemeCustomPanel/hexToHsl/hslToHex/
  // invertLightness/dayNightOn/toggleDayNightMode moved to ./themes.ts

  const themeDropdownCtrl = initThemeDropdown(themeDropdown);

  themeSelect.addEventListener('change', () => {
    const chosen = themeSelect.value;
    const premium = PREMIUM_THEMES.find(t => t.id === chosen);
    if (premium && !ownedThemes.includes(chosen)){
      toast(`"${premium.name}" is locked — buy it in the Shop first.`);
      themeSelect.value = (localStorage.getItem('dts-theme')) || 'studio';
      themeDropdownCtrl.refreshLabel();
      return;
    }
    applyTheme(chosen);
    updateRefineThemeButton();
  });

  (function initTheme(){
    let saved = 'studio';
    try { saved = localStorage.getItem('dts-theme') || 'studio'; } catch(e){}
    themeSelect.value = saved;
    themeDropdownCtrl.refreshLabel();
    if (!window.__dtsPreThemed){
      // Fallback path — index.html's pre-paint inline script normally
      // already applied this theme before first paint (see its comment);
      // this only runs if that script failed/threw for some reason.
      applyTheme(saved);
    } else if (saved === 'custom'){
      // The pre-paint script applies saved custom colors if there are any,
      // but doesn't know about the "no custom colors saved yet" first-run
      // case — that still needs the editor opened, same as applyTheme('custom') would.
      let hasCustom = false;
      try { hasCustom = !!localStorage.getItem('dts-custom-theme'); } catch(e){}
      if (!hasCustom) setTimeout(openThemeCustomPanel, 0);
    }
  })();

  btnThemeCustomize.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (themeCustomPanel.style.display === 'flex'){ hidePanel(themeCustomPanel); return; }
    openThemeCustomPanel();
  });
  themeCloseBtn.addEventListener('click', () => hidePanel(themeCustomPanel));

  themeResetBtn.addEventListener('click', () => {
    themeVarRows.querySelectorAll('input[type="color"]').forEach(inp => {
      const key = inp.dataset.varKey;
      const hex = STUDIO_DEFAULTS[key] || '#000000';
      inp.value = hex;
      document.documentElement.style.setProperty(key, hex);
    });
  });

  themeApplyBtn.addEventListener('click', () => {
    const custom = {};
    themeVarRows.querySelectorAll('input[type="color"]').forEach(inp => {
      custom[inp.dataset.varKey] = inp.value;
      document.documentElement.style.setProperty(inp.dataset.varKey, inp.value);
    });
    try { localStorage.setItem('dts-custom-theme', JSON.stringify(custom)); } catch(e){}
    document.documentElement.setAttribute('data-theme', 'custom');
    themeSelect.value = 'custom';
    themeDropdownCtrl.refreshLabel();
    try { localStorage.setItem('dts-theme', 'custom'); } catch(e){}
    toast('Custom theme saved.');
    folderStats.theme_customized = true;
    saveFolderStats();
    checkAchievements();
    hidePanel(themeCustomPanel);
  });

  // ---------------- Quit ----------------

  btnQuit.addEventListener('click', () => {
    // The actual unsaved-changes check/confirm happens once, in the
    // 'request-close' handler below — window.close() triggers the exact
    // same native close flow as the OS close button/Alt+F4/Cmd+Q, so there's
    // no need (and no reason) to duplicate the check here.
    window.close();
  });

  // ---------------- Version / tabs / night mode ----------------

  const APP_VERSION = '2.0.0';
  appVersionEl.textContent = 'v' + APP_VERSION;

  // Crossfades whichever of the plain-display panes (Datasets tab, Stats
  // tab, the right-sidebar Master Tag Control swap) are actually changing
  // visibility — #galleryTab itself is excluded since `display:contents`
  // has no box of its own to fade. Sequential (fade out -> swap -> fade in),
  // not a true overlapping crossfade, so it never collides with the layout
  // shift the display swap itself causes. Respects the "Smooth transitions"
  // Settings toggle (`html.motion-off`) by skipping straight to the final
  // state with no delay when it's off.
  function switchTab(tab){
    const fadePanes = [datasetManagerTab, statsTab, normalRightTools, masterTagPanel];
    const applyState = () => {
      tabDatasetManager.classList.toggle('active', tab === 'datasets');
      tabGallery.classList.toggle('active', tab === 'gallery');
      tabMasterTags.classList.toggle('active', tab === 'master');
      tabStats.classList.toggle('active', tab === 'stats');
      datasetManagerTab.style.display = (tab === 'datasets') ? 'block' : 'none';
      galleryTab.style.display = (tab === 'stats' || tab === 'datasets') ? 'none' : 'contents';
      statsTab.style.display = (tab === 'stats') ? 'block' : 'none';
      masterTagModeActive = (tab === 'master');
      normalRightTools.style.display = masterTagModeActive ? 'none' : 'block';
      masterTagPanel.style.display = masterTagModeActive ? 'block' : 'none';
      if (tab === 'stats') renderStatsTab();
      if (tab === 'datasets') renderDatasetManagerTab();
      if (tab !== 'datasets') { renderCurrentView(); renderMasterSelectionSummary(); }
    };

    if (document.documentElement.classList.contains('motion-off')){ applyState(); return; }

    const leaving = fadePanes.filter(el => el.style.display !== 'none');
    leaving.forEach(el => el.classList.add('tab-fading'));
    setTimeout(() => {
      applyState();
      leaving.forEach(el => el.classList.remove('tab-fading'));
      const entering = fadePanes.filter(el => el.style.display !== 'none');
      entering.forEach(el => el.classList.add('tab-fading'));
      requestAnimationFrame(() => requestAnimationFrame(() => {
        entering.forEach(el => el.classList.remove('tab-fading'));
      }));
    }, 100);
  }
  tabDatasetManager.addEventListener('click', () => switchTab('datasets'));
  tabGallery.addEventListener('click', () => switchTab('gallery'));
  tabMasterTags.addEventListener('click', () => switchTab('master'));
  tabStats.addEventListener('click', () => switchTab('stats'));
  btnStatsBack.addEventListener('click', () => switchTab('gallery'));
  btnMasterBack.addEventListener('click', () => switchTab('gallery'));

  // stats pie/bar toggle wiring moved to ./edit-log.ts (initEditLog)

  // ---------------- Day/Night mode ----------------
  // hexToHsl/hslToHex/invertLightness/toggleDayNightMode moved to ./themes.ts.
  // toggleDayNightMode() returns whether it just turned night mode ON; the
  // achievement tracking stays here since achievements state is still local
  // to this file (see themes.ts's file-header comment for why).
  function toggleDayNightModeAndTrack(){
    if (toggleDayNightMode()){
      folderStats.night_mode_used = true;
      saveFolderStats();
      checkAchievements();
    }
  }

  btnNightMode.addEventListener('click', toggleDayNightModeAndTrack);
  (function initNightMode(){
    let on = false;
    try { on = localStorage.getItem('dts-night-mode') === '1'; } catch(e){}
    if (on && themeSelect.value !== 'custom'){
      if (window.__dtsPreThemed){
        // The pre-paint script already inverted the colors and added the
        // 'night-mode' class — just sync the internal flag so a later click
        // on the toggle turns it OFF instead of inverting an already
        // inverted display right back to day colors.
        syncNightModeFromPrePaint();
        folderStats.night_mode_used = true;
        saveFolderStats();
        checkAchievements();
      } else {
        toggleDayNightModeAndTrack();
      }
    }
  })();

  // ---------------- Topbar scroll arrows ----------------

  actionsScrollLeft.addEventListener('click', () => topbarActions.scrollBy({ left: -220, behavior: 'smooth' }));
  actionsScrollRight.addEventListener('click', () => topbarActions.scrollBy({ left: 220, behavior: 'smooth' }));

  // Greyed out (via the normal `disabled` attribute/styling) whenever the
  // actions row has nothing to scroll, so the two arrows don't sit there
  // clickable-but-useless — and re-enable the instant a scrollbar actually
  // appears (e.g. the font-size slider pushes the row into overflow).
  // ResizeObserver on the row itself covers every cause of that (window
  // resize, font-size zoom, content changes) with one mechanism, since
  // Electron's native page zoom changes the row's effective CSS-px size
  // the same way a real resize would.
  function updateActionsScrollArrows(){
    const hasOverflow = topbarActions.scrollWidth > topbarActions.clientWidth + 1;
    actionsScrollLeft.disabled = !hasOverflow;
    actionsScrollRight.disabled = !hasOverflow;
  }
  new ResizeObserver(updateActionsScrollArrows).observe(topbarActions);
  updateActionsScrollArrows();

  // ---------------- Header category flyouts (File / Personalization) ----------------

  let flyoutClosesOnOutsideClick = true;
  flyoutOutsideCloseToggle.addEventListener('change', () => {
    flyoutClosesOnOutsideClick = flyoutOutsideCloseToggle.checked;
    try { localStorage.setItem('dts-flyout-outside-close', flyoutClosesOnOutsideClick ? '1' : '0'); } catch(e){}
  });
  (function initFlyoutOutsideClosePref(){
    let on = true;
    try { on = localStorage.getItem('dts-flyout-outside-close') !== '0'; } catch(e){}
    flyoutClosesOnOutsideClick = on;
    flyoutOutsideCloseToggle.checked = on;
  })();

  // UI animation mode — everything that animates (menus/dropdowns/flyouts via
  // positionMenu()/buildPersistentDropdown(), floating panels via
  // showPanel()/hidePanel(), switchTab()'s pane transition, gallery view
  // switching, single-image nav, the image modal) reads its duration from CSS
  // vars (--pop-dur/--panel-dur/--tab-dur) that `html.motion-off` zeroes out,
  // and checks `html.motion-swipe` to pick slide-from-the-side styling over
  // the default fade/scale — so this dropdown only ever needs to set those
  // two classes, never touch any animation code directly. See styles.css's
  // "Motion timing" block.
  function applyUiAnimationMode(mode){
    document.documentElement.classList.toggle('motion-off', mode === 'off');
    document.documentElement.classList.toggle('motion-swipe', mode === 'swipe');
  }
  let uiAnimationMode = 'fade';
  try {
    const saved = localStorage.getItem('dts-ui-animation-mode');
    if (saved === 'off' || saved === 'swipe' || saved === 'fade') uiAnimationMode = saved;
    // Migrates the earlier boolean-only "Smooth transitions" checkbox pref.
    else if (localStorage.getItem('dts-ui-animations') === '0') uiAnimationMode = 'off';
  } catch(e){}
  buildPersistentDropdown(uiAnimationsDropdown, [
    { value: 'fade', label: 'Fade' },
    { value: 'swipe', label: 'Swipe' },
    { value: 'off', label: 'Off' }
  ], () => uiAnimationMode, (val) => {
    uiAnimationMode = val;
    try { localStorage.setItem('dts-ui-animation-mode', val); } catch(e){}
    applyUiAnimationMode(val);
  });
  applyUiAnimationMode(uiAnimationMode);

  function setupHeaderCategory(btn, flyout){
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const isOpen = flyout.style.display === 'flex';
      document.querySelectorAll('.header-cat-flyout').forEach(f => { f.style.display = 'none'; f.classList.remove('menu-in'); });
      if (isOpen) return;
      const rect = btn.getBoundingClientRect();
      flyout.style.display = 'flex';
      flyout.style.left = rect.left + 'px';
      flyout.style.top = (rect.bottom + 6) + 'px';
      const flyoutRect = flyout.getBoundingClientRect();
      if (flyoutRect.right > window.innerWidth - 8){
        flyout.style.left = Math.max(8, window.innerWidth - flyoutRect.width - 8) + 'px';
      }
      if (flyoutRect.bottom > window.innerHeight - 8){
        flyout.style.top = Math.max(8, window.innerHeight - flyoutRect.height - 8) + 'px';
      }
      // Pop-in, same treatment as every ctx-menu (see positionMenu()) — the
      // flyout stays in the DOM between opens (display-toggled, not
      // recreated), so `.menu-in` has to be explicitly removed on close too.
      requestAnimationFrame(() => requestAnimationFrame(() => flyout.classList.add('menu-in')));
    });
  }
  setupHeaderCategory(fileCatBtn, fileCatFlyout);
  setupHeaderCategory(personalizationCatBtn, personalizationCatFlyout);
  document.addEventListener('mousedown', (ev) => {
    if (!flyoutClosesOnOutsideClick) return;
    // Listen on mousedown, not click. Chromium dismisses an open native
    // <select> (e.g. #themeSelect) on wheel-scroll outside its OS-rendered
    // option list, and that dismissal fires a phantom `click` at the
    // cursor's position with no real mousedown behind it — that phantom
    // click otherwise reads as "clicked off the dropdown" and closes the
    // flyout on scroll, then closes it again immediately on the next real
    // attempt to reopen it. A genuine left- or right-click always has a
    // mousedown, so keying off mousedown ignores the phantom while still
    // closing on any deliberate outside click.
    // The same dismissal can also land its target on <html>/<body> itself,
    // outside the page's own element tree entirely — skip those two too,
    // a deliberate click always lands on some real page element.
    if (ev.target === document.documentElement || ev.target === document.body) return;
    document.querySelectorAll('.header-cat').forEach(wrap => {
      const flyout = wrap.querySelector('.header-cat-flyout');
      if (flyout && flyout.style.display === 'flex' && !wrap.contains(ev.target)){
        flyout.style.display = 'none';
        flyout.classList.remove('menu-in');
      }
    });
  });

  // ---------------- Floating panel outside-click-to-close (Favorites/Log/Colors/Achievements/Shop/Tag Details) ----------------

  let panelsCloseOnOutsideClick = true;
  panelsOutsideCloseToggle.addEventListener('change', () => {
    panelsCloseOnOutsideClick = panelsOutsideCloseToggle.checked;
    try { localStorage.setItem('dts-panels-outside-close', panelsCloseOnOutsideClick ? '1' : '0'); } catch(e){}
  });
  (function initPanelsOutsideClosePref(){
    let on = true;
    try { on = localStorage.getItem('dts-panels-outside-close') !== '0'; } catch(e){}
    panelsCloseOnOutsideClick = on;
    panelsOutsideCloseToggle.checked = on;
  })();

  // getOutsideClosablePanels moved to ./settings.ts

  document.addEventListener('click', (ev) => {
    if (!panelsCloseOnOutsideClick) return;
    getOutsideClosablePanels().forEach(panel => {
      if (panel.style.display === 'flex' && !panel.contains(ev.target)){
        hidePanel(panel);
      }
    });
  });

  // ---------------- Reset Edibits / Achievements (debug) ----------------

  // Reset Edibits / Achievements handlers moved to ./achievements.ts (initAchievementPanels)

  // ---------------- Settings panel ----------------

  // fontSizeSlider/fontSizeVal/settingsPanel moved to ./dom.ts
  const tooltipsToggle = $('tooltipsToggle');
  const tagCountBadgeToggle = $('tagCountBadgeToggle');
  const cardTagSortDropdown = $('cardTagSortDropdown');
  const dynamicCardsToggle = $('dynamicCardsToggle');
  const btnDiscreteToggle = $('btnDiscreteToggle');
  const btnDiscreteOff = $('btnDiscreteOff');
  const btnPurgeAllTags = $('btnPurgeAllTags');
  const settingsCloseBtn = $('settingsCloseBtn');
  const tooltipBubble = $('tooltipBubble');
  const tooltipDelaySlider = $('tooltipDelaySlider');
  const tooltipDelayVal = $('tooltipDelayVal');
  let tooltipsEnabled = true;
  let tooltipDelayMs = 1000;
  let discreteModeOn = false;
  let purgeConfirmCount = 0;
  let showTagCountBadges = false;

  tagCountBadgeToggle.addEventListener('change', () => {
    showTagCountBadges = tagCountBadgeToggle.checked;
    try { localStorage.setItem('dts-tagcount-badges', showTagCountBadges ? '1' : '0'); } catch(e){}
    renderCurrentView();
  });
  (function initTagCountBadgePref(){
    let on = false;
    try { on = localStorage.getItem('dts-tagcount-badges') === '1'; } catch(e){}
    showTagCountBadges = on;
    tagCountBadgeToggle.checked = on;
  })();

  dynamicCardsToggle.addEventListener('change', () => {
    document.documentElement.classList.toggle('dynamic-cards', dynamicCardsToggle.checked);
    try { localStorage.setItem('dts-dynamic-cards', dynamicCardsToggle.checked ? '1' : '0'); } catch(e){}
  });
  (function initDynamicCardsPref(){
    let on = false;
    try { on = localStorage.getItem('dts-dynamic-cards') === '1'; } catch(e){}
    dynamicCardsToggle.checked = on;
    document.documentElement.classList.toggle('dynamic-cards', on);
  })();

  // ---------------- Hover tooltips (1s delay, disableable) ----------------

  let tooltipTimer = null;
  let tooltipTarget = null;

  document.addEventListener('mouseover', (ev) => {
    if (!tooltipsEnabled) return;
    const el = ev.target.closest('[title]');
    if (!el || el === tooltipTarget) return;
    clearTimeout(tooltipTimer);
    tooltipTarget = el;
    const tipText = el.getAttribute('title');
    if (!tipText) return;
    // Strip the native title attribute immediately (not inside the setTimeout
    // below) so Chromium's own hover-tooltip never gets a chance to flash
    // briefly before our styled tooltipBubble appears a second later.
    el.dataset.tipStash = tipText;
    el.removeAttribute('title');
    tooltipTimer = setTimeout(() => {
      if (tooltipTarget !== el) return;
      const rect = el.getBoundingClientRect();
      tooltipBubble.textContent = tipText;
      tooltipBubble.style.display = 'block';
      const bubbleRect = tooltipBubble.getBoundingClientRect();
      let left = rect.left;
      if (left + bubbleRect.width + 8 > window.innerWidth) left = window.innerWidth - bubbleRect.width - 8;
      tooltipBubble.style.left = Math.max(8, left) + 'px';
      let top = rect.top - bubbleRect.height - 8;
      if (top < 8) top = rect.bottom + 8; // fall back below only if there's no room above
      tooltipBubble.style.top = top + 'px';
    }, tooltipDelayMs);
  });

  document.addEventListener('mouseout', (ev) => {
    const el = ev.target.closest('[title], [data-tip-stash]');
    if (!el) return;
    clearTimeout(tooltipTimer);
    if (el.dataset.tipStash){
      el.setAttribute('title', el.dataset.tipStash);
      delete el.dataset.tipStash;
    }
    if (tooltipTarget === el){
      tooltipTarget = null;
      tooltipBubble.style.display = 'none';
    }
  });

  btnSettings.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (settingsPanel.style.display === 'flex'){ hidePanel(settingsPanel); return; }
    [themeCustomPanel, favoritesPanel, logPanel, achievementsPanel, shopPanel, tagDetailsPanel].forEach(hidePanel);
    showPanel(settingsPanel);
  });
  settingsCloseBtn.addEventListener('click', () => hidePanel(settingsPanel));

  // ---------------- Collapsible settings sections ----------------

  // SETTINGS_SECTIONS_KEY/saveSettingsSectionState moved to ./settings.ts
  (function initSettingsSections(){
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(SETTINGS_SECTIONS_KEY) || '{}') || {}; } catch(e){}
    document.querySelectorAll('#settingsPanel .settings-section').forEach(section => {
      const id = section.dataset.section;
      const defaultExpanded = id !== 'danger'; // everything starts open except Danger Zone
      const expanded = Object.prototype.hasOwnProperty.call(saved, id) ? !!saved[id] : defaultExpanded;
      section.classList.toggle('expanded', expanded);
      const header = section.querySelector('.settings-section-header');
      header.addEventListener('click', () => {
        const nowExpanded = !section.classList.contains('expanded');
        section.classList.toggle('expanded', nowExpanded);
        let state = {};
        try { state = JSON.parse(localStorage.getItem(SETTINGS_SECTIONS_KEY) || '{}') || {}; } catch(e){}
        state[id] = nowExpanded;
        saveSettingsSectionState(state);
      });
    });
  })();

  fontSizeSlider.addEventListener('input', () => {
    const px = fontSizeSlider.value;
    fontSizeVal.textContent = px + 'px';
    applyAppZoom(parseInt(px, 10) / 14);
    try { localStorage.setItem('dts-font-size', px); } catch(e){}
  });
  (function initFontSize(){
    let px = '14';
    try { px = localStorage.getItem('dts-font-size') || '14'; } catch(e){}
    fontSizeSlider.value = px;
    fontSizeVal.textContent = px + 'px';
    applyAppZoom(parseInt(px, 10) / 14);
  })();

  // applyCustomFont moved to ./settings.ts
  btnApplyCustomFont.addEventListener('click', () => {
    const name = customFontInput.value.trim();
    if (!name){ toast('Type a font name first (must be installed on your system).'); return; }
    applyCustomFont(name);
    try { localStorage.setItem('dts-custom-font', name); } catch(e){}
    toast(`Using "${name}" where your system has it installed.`);
  });
  btnClearCustomFont.addEventListener('click', () => {
    customFontInput.value = '';
    applyCustomFont('');
    try { localStorage.removeItem('dts-custom-font'); } catch(e){}
    toast('Back to default fonts.');
  });
  (function initCustomFont(){
    let name = '';
    try { name = localStorage.getItem('dts-custom-font') || ''; } catch(e){}
    if (name){
      customFontInput.value = name;
      applyCustomFont(name);
    }
  })();

  powerHighlightToggle.addEventListener('change', () => {
    document.documentElement.classList.toggle('power-highlight', powerHighlightToggle.checked);
    try { localStorage.setItem('dts-power-highlight', powerHighlightToggle.checked ? '1' : '0'); } catch(e){}
  });
  powerFillToggle.addEventListener('change', () => {
    document.documentElement.classList.toggle('power-fill', powerFillToggle.checked);
    try { localStorage.setItem('dts-power-fill', powerFillToggle.checked ? '1' : '0'); } catch(e){}
  });
  (function initPowerHighlight(){
    let highlightOn = true, fillOn = false;
    try {
      highlightOn = localStorage.getItem('dts-power-highlight') !== '0';
      fillOn = localStorage.getItem('dts-power-fill') === '1';
    } catch(e){}
    powerHighlightToggle.checked = highlightOn;
    powerFillToggle.checked = fillOn;
    document.documentElement.classList.toggle('power-highlight', highlightOn);
    document.documentElement.classList.toggle('power-fill', fillOn);
  })();

  // Power-tool marking (builtin/custom lists, settings checkboxes, picker)
  // moved to ./power-tools.ts
  initPowerTools();

  // Tag Pruner / tag autocomplete moved to ./tag-pruner.ts / ./tags-autocomplete.ts —
  // both need a few core internals (selectedTags, buildTagIndex, refreshRightPanels,
  // the wiki/all-tags loaders, addTagToEntry) that can't be exported out of this
  // IIFE, so they're injected once here instead of imported.
  initAchievements({ getDirHandle: () => dirHandle, getEditLog: () => editLog, refreshThemeDropdownLabel: () => themeDropdownCtrl.refreshLabel() });
  initAchievementPanels();
  initTagPruner(selectedTags, buildTagIndex, refreshRightPanels);
  initTagAutocomplete({
    ensureWikiDataLoaded, getCustomTagNote, setCustomTagNote,
    ensureAllTagsLoaded, addTagToEntry, refreshRightPanels
  });

  tagAutocompleteToggle.addEventListener('change', () => {
    setTagAutocompleteEnabled(tagAutocompleteToggle.checked);
    try { localStorage.setItem('dts-tag-autocomplete', tagAutocompleteEnabled ? '1' : '0'); } catch(e){}
  });
  (function initTagAutocompletePref(){
    let on = false;
    try { on = localStorage.getItem('dts-tag-autocomplete') === '1'; } catch(e){}
    setTagAutocompleteEnabled(on);
    tagAutocompleteToggle.checked = on;
  })();

  btnGithubPackage.addEventListener('click', async () => {
    if (!window.electronAPI || !window.electronAPI.generateGithubPackage){
      toast('GitHub packaging isn\'t available in this build.');
      return;
    }
    btnGithubPackage.disabled = true;
    const prevLabel = btnGithubPackage.textContent;
    btnGithubPackage.textContent = 'Generating…';
    try {
      const result = await window.electronAPI.generateGithubPackage();
      toast(result.message, result.ok ? 6000 : 4000);
    } catch(err){
      toast('Failed to generate package: ' + err.message);
    } finally {
      btnGithubPackage.disabled = false;
      btnGithubPackage.textContent = prevLabel;
    }
  });

  tooltipsToggle.addEventListener('change', () => {
    tooltipsEnabled = tooltipsToggle.checked;
    try { localStorage.setItem('dts-tooltips-enabled', tooltipsEnabled ? '1' : '0'); } catch(e){}
  });
  (function initTooltipsPref(){
    let on = true;
    try { on = localStorage.getItem('dts-tooltips-enabled') !== '0'; } catch(e){}
    tooltipsEnabled = on;
    tooltipsToggle.checked = on;
  })();

  tooltipDelaySlider.addEventListener('input', () => {
    tooltipDelayMs = parseInt(tooltipDelaySlider.value, 10);
    tooltipDelayVal.textContent = tooltipDelayMs + 'ms';
    try { localStorage.setItem('dts-tooltip-delay', String(tooltipDelayMs)); } catch(e){}
  });
  (function initTooltipDelayPref(){
    let ms = 1000;
    try { ms = parseInt(localStorage.getItem('dts-tooltip-delay'), 10) || 1000; } catch(e){}
    ms = Math.max(100, Math.min(2000, ms));
    tooltipDelayMs = ms;
    tooltipDelaySlider.value = String(ms);
    tooltipDelayVal.textContent = ms + 'ms';
  })();

  btnDiscreteToggle.addEventListener('click', () => {
    discreteModeOn = !discreteModeOn;
    document.documentElement.classList.toggle('discrete-mode', discreteModeOn);
    btnDiscreteToggle.classList.toggle('active', discreteModeOn);
  });
  btnDiscreteOff.addEventListener('click', () => {
    discreteModeOn = false;
    document.documentElement.classList.remove('discrete-mode');
    btnDiscreteToggle.classList.remove('active');
  });

  btnPurgeAllTags.addEventListener('click', () => {
    purgeConfirmCount++;
    if (purgeConfirmCount === 1){
      btnPurgeAllTags.textContent = '⚠ Click 2 more times to confirm purge';
      setTimeout(() => { if (purgeConfirmCount < 3) { purgeConfirmCount = 0; btnPurgeAllTags.textContent = '🗑 Purge ALL tags in this folder…'; } }, 4000);
      return;
    }
    if (purgeConfirmCount === 2){
      btnPurgeAllTags.textContent = '⚠ Click once more to PERMANENTLY purge everything';
      return;
    }
    purgeConfirmCount = 0;
    btnPurgeAllTags.textContent = '🗑 Purge ALL tags in this folder…';
    const affected = [];
    for (const e of entries){
      if (e.disabled) continue;
      if (e.tags.length === 0) continue;
      const prevTags = e.tags.slice();
      e.tags = [];
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: [] });
    }
    if (affected.length === 0){ toast('No tags to purge.'); return; }
    recordChange('void', `Purged ALL tags across ${affected.length} image(s).`, affected);
    refreshAllUI();
    toast(`Purged every tag from ${affected.length} image(s). Use Undo if that was a mistake.`);
    hidePanel(settingsPanel);
  });

  // Shared unsaved-changes guard for every way the active dataset can be
  // switched away from (File > Open, Favorites reopen, Dataset tab reopen) —
  // same entries.filter(.dirty) + showConfirmModal pattern as Quit/Restart/
  // Unload, just phrased for "switching" instead of "closing".
  async function confirmDatasetSwitch(message){
    const dirtyCount = entries.filter(e => e.dirty).length;
    if (dirtyCount === 0) return true;
    return showConfirmModal(`You have ${dirtyCount} unsaved caption change(s). ${message}`, { okLabel: 'Switch anyway', danger: true });
  }

  // Shared by favorites.ts and dataset-manager.ts — both reopen a saved
  // FileSystemDirectoryHandle the same way the initial folder-open flow does.
  async function openFolderHandle(handle){
    if (!(await confirmDatasetSwitch('Switch datasets anyway without saving?'))) return;
    dirHandle = handle;
    await loadFolder();
  }

  // Favorite folders moved to ./favorites.ts
  initFavorites({
    getDirHandle: () => dirHandle,
    openFolderHandle,
    onFavoriteChanged: syncPinFromFavoriteChange
  });

  // Dataset folder manager moved to ./dataset-manager.ts
  initDatasetManager({
    getDirHandle: () => dirHandle,
    openFolderHandle,
    switchTab
  });

  // Core tag mutation / undo-redo / disable-restore / save moved to ./tags-edit.ts
  initTagsEdit({
    selectedTags,
    getEntries: () => entries,
    getEntryByBase: (base) => entryByBase.get(base),
    getDirHandle: () => dirHandle,
    getDisabledDirHandle: () => disabledDirHandle,
    setDisabledDirHandle: (h) => { disabledDirHandle = h; },
    resetSingleIndex: () => resetSingleIndex(),
    refreshStats: () => refreshStats(),
    refreshAllUI: () => refreshAllUI(),
    renderCurrentView: () => renderCurrentView()
  });

  // Tag index/frequency list + gallery filtering moved to ./tag-index.ts
  initTagIndex({
    getEntries: () => entries,
    getGalleryFilter: () => galleryFilter,
    getGallerySortMode: () => gallerySortMode,
    getGallerySortDir: () => gallerySortDir,
    resetSingleIndex: () => resetSingleIndex(),
    renderCurrentView: () => renderCurrentView()
  });

  // Master Tag Control moved to ./master-tag-control.ts
  initMasterTagControl({
    getEntries: () => entries,
    getEntryByBase: (base) => entryByBase.get(base),
    filteredEntries: () => filteredEntries(),
    renderCurrentView: () => renderCurrentView(),
    refreshAllUI: () => refreshAllUI()
  });

  // WD14 Autotagger (ComfyUI bridge) moved to ./wd14-tagger.ts — settings
  // live entirely in Tag Overseer; the per-image 3-dot menu (view.ts) calls
  // its tagSingleImageWithWd14() directly rather than through injected deps,
  // same one-directional import view.ts already uses for master-tag-control.
  initWd14Tagger({
    getEntries: () => entries,
    refreshAllUI: () => refreshAllUI()
  });

  // Edit log + Stats tab moved to ./edit-log.ts
  initEditLog({
    getDirHandle: () => dirHandle,
    getEntryByBase: (base) => entryByBase.get(base),
    applyTagDirection: (affected, direction) => applyTagDirection(affected, direction),
    moveEntry: (entry, toDisabled) => moveEntry(entry, toDisabled),
    trackStat: (key, amount) => trackStat(key, amount),
    checkAchievements: () => checkAchievements(),
    refreshAllUI: () => refreshAllUI(),
    getUndoStack: () => undoStack,
    getRedoStack: () => redoStack,
    retroApplyToDisabled: (logEntry) => retroApplyToDisabled(logEntry),
    retroApplyAllToDisabled: () => retroApplyAllToDisabled()
  });

  // Gallery/compact/single view rendering, chips, modal, image options menu moved to ./view.ts
  initView({
    selectedTags,
    getEntries: () => entries,
    getEntryByBase: (base) => entryByBase.get(base),
    getMasterTagModeActive: () => masterTagModeActive,
    getCardTagSortMode: () => cardTagSortMode,
    getGalleryFilter: () => galleryFilter,
    getIsolatedFlagActive: () => isolatedFlagActive,
    getShowTagCountBadges: () => showTagCountBadges,
    getEntryMeta: () => entryMeta,
    saveEntryMeta: () => saveEntryMeta(),
    refreshAllUI: () => refreshAllUI(),
    setContainsFilter: (tag) => setContainsFilter(tag),
    setExcludesFilter: (tag) => setExcludesFilter(tag)
  });

  // Achievements/stats/wallet/shop moved to ./achievements.ts

  function baseName(name){
    const i = name.lastIndexOf('.');
    return i === -1 ? name : name.slice(0, i);
  }
  function isImageFile(name){
    const lower = name.toLowerCase();
    return IMAGE_EXT.some(ext => lower.endsWith(ext));
  }
  // ---------------- Folder loading ----------------

  btnOpen.addEventListener('click', async () => {
    if (!window.showDirectoryPicker){
      toast('Your browser does not support folder access. Use Chrome or Edge, opened as a normal tab (not an embedded preview).', 5000);
      return;
    }
    if (!(await confirmDatasetSwitch('Open a different folder anyway without saving?'))) return;
    let picked = null;
    try {
      picked = await window.showDirectoryPicker({ mode: 'readwrite' });
    } catch(e){
      toast('No folder was chosen.', 2400);
      return;
    }
    if (!picked){
      toast('No folder was chosen.', 2400);
      return;
    }
    dirHandle = picked;
    try {
      await loadFolder();
    } catch(err){
      toast('Could not load that folder — it may be invalid, moved, or missing permission. Try again.', 4200);
      dirHandle = null;
      dropHint.style.display = 'flex';
      dropHintWrap.style.display = 'block';
      galleryToolbar.style.display = 'none';
      return;
    }
    maybePromptAddDataset(picked);
  });

  async function scanDirInto(handle, disabled){
    const imageHandles = new Map();
    const txtHandles = new Map();
    for await (const [name, h] of handle.entries()){
      if (h.kind !== 'file') continue;
      if (isImageFile(name)){
        imageHandles.set(baseName(name), { handle: h, name });
      } else if (name.toLowerCase().endsWith('.txt')){
        txtHandles.set(baseName(name), { handle: h, name });
      }
    }
    const bases = Array.from(imageHandles.keys()).sort((a,b)=> a.localeCompare(b, undefined, {numeric:true}));
    for (const base of bases){
      const img = imageHandles.get(base);
      const txtEntry = txtHandles.get(base);
      let tags = [];
      let txtHandle = null;
      let txtExisted = false;

      if (txtEntry){
        txtHandle = txtEntry.handle;
        txtExisted = true;
        try {
          const file = await txtHandle.getFile();
          const raw = (await file.text()).trim();
          tags = raw.length ? raw.split(',').map(t => t.trim().replace(/_/g, ' ').replace(/\s+/g, ' ')).filter(Boolean) : [];
        } catch(e){ tags = []; }
      }

      const file = await img.handle.getFile();
      const objectUrl = URL.createObjectURL(file);

      const entry = {
        base,
        imgName: img.name,
        imgHandle: img.handle,
        txtHandle,
        txtName: base + '.txt',
        txtExisted,
        objectUrl,
        tags,
        dirty: false,
        disabled,
        width: null,
        height: null,
        meta: { reviewColor: null, flaggedTags: [], note: '', noteAlwaysVisible: false }
      };
      entries.push(entry);
      entryByBase.set(base, entry);
      loadImageDimensions(entry);
    }
  }

  function loadImageDimensions(entry){
    const probe = new Image();
    probe.onload = () => { entry.width = probe.naturalWidth; entry.height = probe.naturalHeight; };
    probe.src = entry.objectUrl;
  }

  const META_FILE_NAME = '_dts_meta.json';

  async function loadEntryMeta(){
    entryMeta = {};
    if (!dirHandle) return;
    try {
      const handle = await dirHandle.getFileHandle(META_FILE_NAME, { create: false });
      const file = await handle.getFile();
      const parsed = JSON.parse((await file.text()).trim() || '{}');
      if (parsed && typeof parsed === 'object') entryMeta = parsed;
    } catch(err){
      entryMeta = {};
    }
  }

  async function saveEntryMeta(){
    if (!dirHandle) return;
    try {
      const handle = await dirHandle.getFileHandle(META_FILE_NAME, { create: true });
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(entryMeta, null, 2));
      await writable.close();
    } catch(err){}
  }

  async function loadFolder(){
    toast('Scanning folder…');
    entries = [];
    entryByBase.clear();
    disabledDirHandle = null;
    btnAddFavorite.disabled = !dirHandle;
    btnUnloadDataset.disabled = !dirHandle;
    resetUndoRedo();
    masterSelectedImages.clear();
    resetStickyCompare();
    updateUndoRedoButtons();
    [themeCustomPanel, favoritesPanel, logPanel, achievementsPanel, shopPanel, tagDetailsPanel].forEach(hidePanel);

    await scanDirInto(dirHandle, false);

    try {
      disabledDirHandle = await dirHandle.getDirectoryHandle('Disabled', { create: false });
      await scanDirInto(disabledDirHandle, true);
    } catch(e){
      disabledDirHandle = null;
    }

    await loadEntryMeta();
    for (const e of entries){
      e.meta = entryMeta[e.base] || { reviewColor: null, flaggedTags: [], note: '', noteAlwaysVisible: false };
    }

    dropHint.style.display = entries.length ? 'none' : 'flex';
    dropHintWrap.style.display = entries.length ? 'none' : 'block';
    galleryToolbar.style.display = entries.length ? 'flex' : 'none';

    galleryFilter = { base: 'all', terms: [], mode: 'AND', excludes: '', disabledView: false };
    filterInput.value = '';
    excludeBadge.style.display = 'none';
    [filterAllBtn, filterUntaggedBtn, filterDirtyBtn].forEach(b=>b.classList.remove('active'));
    filterAllBtn.classList.add('active');

    resetSingleIndex();
    switchView(viewMode === 'compact' ? 'compact' : 'grid');

    await loadEditLogForFolder();
    await loadFolderStats();

    renderAll();
    checkAchievements();
    const disabledNote = disabledDirHandle ? ' (including a Disabled/ folder)' : '';
    toast(`Loaded ${entries.length} image${entries.length===1?'':'s'}${disabledNote}.`);
  }

  // Closes the current dataset and returns to the "no folder loaded" empty
  // state (dropHint — home of the random-fact button) without quitting the
  // app. Same unsaved-changes guard as Quit/Restart (entries.some/filter on
  // .dirty + showConfirmModal), then reuses loadEditLogForFolder()/
  // loadFolderStats() with dirHandle already null — both already reset their
  // own module state to empty and return early with no dirHandle, so no new
  // "reset" export was needed on either module.
  async function unloadDataset(){
    if (!dirHandle) return;
    const dirtyCount = entries.filter(e => e.dirty).length;
    if (dirtyCount > 0){
      const ok = await showConfirmModal(`You have ${dirtyCount} unsaved caption change(s). Unload the dataset anyway without saving?`, { okLabel: 'Unload anyway', danger: true });
      if (!ok) return;
    }
    trackStat('dataset_unloads');
    checkAchievements();
    dirHandle = null;
    disabledDirHandle = null;
    entries = [];
    entryByBase.clear();
    btnAddFavorite.disabled = true;
    btnUnloadDataset.disabled = true;
    resetUndoRedo();
    masterSelectedImages.clear();
    resetStickyCompare();
    updateUndoRedoButtons();
    [themeCustomPanel, favoritesPanel, logPanel, achievementsPanel, shopPanel, tagDetailsPanel].forEach(hidePanel);

    dropHint.style.display = 'flex';
    dropHintWrap.style.display = 'block';
    galleryToolbar.style.display = 'none';

    galleryFilter = { base: 'all', terms: [], mode: 'AND', excludes: '', disabledView: false };
    filterInput.value = '';
    excludeBadge.style.display = 'none';
    [filterAllBtn, filterUntaggedBtn, filterDirtyBtn].forEach(b=>b.classList.remove('active'));
    filterAllBtn.classList.add('active');

    resetSingleIndex();
    switchView('grid');

    await loadEditLogForFolder();
    await loadFolderStats();

    renderAll();
    toast('Dataset unloaded.');
  }
  btnUnloadDataset.addEventListener('click', unloadDataset);

  // Tag index/frequency list + gallery filtering moved to ./tag-index.ts

  buildPersistentDropdown(filterModeDropdown,
    [
      { value: 'AND', label: 'AND', title: 'Show images containing ALL of the searched tags' },
      { value: 'OR', label: 'OR', title: 'Show images containing ANY of the searched tags' },
      { value: 'XOR', label: 'XOR', title: 'Show images containing EXACTLY ONE of the searched tags' },
      { value: 'NOT', label: 'NOT', title: 'Show images containing NONE of the searched tags' }
    ],
    () => galleryFilter.mode,
    (val) => { galleryFilter.mode = val; renderCurrentView(); }
  );

  btnFlagIsolated.addEventListener('click', () => {
    isolatedFlagActive = !isolatedFlagActive;
    btnFlagIsolated.classList.toggle('active', isolatedFlagActive);
    if (isolatedFlagActive){
      folderStats.isolated_flag_used = true;
      saveFolderStats();
      checkAchievements();
    }
    renderCurrentView();
  });

  buildPersistentDropdown(gallerySortDropdown,
    [
      { value: 'filename', label: 'Filename' },
      { value: 'resolution', label: 'Resolution' },
      { value: 'tagcount', label: 'Tag count' },
      { value: 'dirty', label: 'Unsaved first' }
    ],
    () => gallerySortMode,
    onGallerySortChange
  );

  // leftSortDropdown wiring moved to ./tag-index.ts (initTagIndex)

  buildPersistentDropdown(cardTagSortDropdown,
    [
      { value: 'default', label: 'Default order' },
      { value: 'alphabetical', label: 'Alphabetical' },
      { value: 'frequency', label: 'By frequency' }
    ],
    () => cardTagSortMode,
    (val) => { cardTagSortMode = val; renderCurrentView(); }
  );

  let panelLayout = 'standard';
  function applyPanelLayout(val){
    shellEl.classList.remove('layout-gallery-left', 'layout-gallery-right');
    if (val === 'gallery-left') shellEl.classList.add('layout-gallery-left');
    else if (val === 'gallery-right') shellEl.classList.add('layout-gallery-right');
    panelLayout = val;
    try { localStorage.setItem('dts-panel-layout', val); } catch(e){}
  }
  (function initPanelLayout(){
    let saved = 'standard';
    try { saved = localStorage.getItem('dts-panel-layout') || 'standard'; } catch(e){}
    applyPanelLayout(saved);
  })();
  const layoutDropdownCtrl = buildPersistentDropdown(layoutDropdown,
    [
      { value: 'standard', label: 'Standard (left · gallery · right)' },
      { value: 'gallery-left', label: 'Gallery left, panels right' },
      { value: 'gallery-right', label: 'Gallery right, panels left' }
    ],
    () => panelLayout,
    applyPanelLayout
  );

  // renderCurrentView/switchView + view-mode button/drag wiring moved to ./view.ts

  function onGallerySortChange(mode){
    gallerySortMode = mode;
    folderStats.sort_modes_used = Array.from(new Set([...(folderStats.sort_modes_used||[]), gallerySortMode]));
    saveFolderStats();
    renderCurrentView();
    checkAchievements();
  }
  gallerySortDirBtn.addEventListener('click', () => {
    gallerySortDir = gallerySortDir === 'asc' ? 'desc' : 'asc';
    gallerySortDirBtn.textContent = gallerySortDir === 'asc' ? '▲ Asc' : '▼ Desc';
    renderCurrentView();
  });

  // Gallery/compact/single view rendering, chips + tag context menu, floating image
  // card modal, and the image options menu (3-dot) moved to ./view.ts


  // Wiki tag details moved to ./tag-details.ts
  initTagDetails();

  // "No folder loaded" empty-state random fact button moved to ./random-facts.ts
  initRandomFacts();

  // Premium hover-fill "click flash" (epic/legendary shop themes) — see shared-ui.ts
  initClickFlash();
  // Arrow-key navigation inside dropdowns/context menus — see shared-ui.ts
  initMenuKeyboardNav(() => {
    if (folderStats.keyboard_menu_nav_used) return; // avoid a disk write on every single arrow press
    folderStats.keyboard_menu_nav_used = true;
    saveFolderStats();
    checkAchievements();
  });

  // addTagToEntry/removeTagFromEntry moved to ./tags-edit.ts

  // Tag autocomplete (settings-gated) moved to ./tags-autocomplete.ts

  // ---------------- Tag Pruner (search-or-browse, supports multiple docks) ----------------
  // moved to ./tag-pruner.ts

  btnAddTagPruner.addEventListener('click', addTagPruner);

  // refreshSelectionSummary/refreshRightPanels/toggleTagSelection + btnClearSelection
  // wiring moved to ./view.ts

  // Undo/redo, Unify/Void apply moved to ./tags-edit.ts

  // Global tag tools (Find / Replace all / Find & replace) previously lived here,
  // superseded by the Master Tags tab which covers the same ground plus more.

  // ---------------- Quick Merge (finds tags that are the same thing typed differently) ----------------
  // moved to ./quick-merge.ts

  btnQuickMergeScan.addEventListener('click', () => {
    const found = runQuickMergeScan(buildTagIndex());
    toast(found
      ? `Found ${found} duplicate-spelling group(s).`
      : 'No duplicate-spelling tags found.');
  });

  btnQuickMergeApply.addEventListener('click', async () => {
    const activeCount = quickMergeGroups.filter(g => quickMergeSelection.get(g.key).selected).length;
    if (activeCount === 0){
      toast('Select at least one group to merge.');
      return;
    }
    const ok = await showConfirmModal(
      `Merge ${activeCount} duplicate-spelling group(s)? Each group's variants combine into the spelling you picked.`,
      { okLabel: 'Merge groups' }
    );
    if (!ok) return;

    const { active, affected, mergedVariants } = applyQuickMerge(entries, includeDisabledToggle.checked, markDirty);
    if (affected.length === 0){
      toast('Nothing to merge — selected groups had no effect.');
      return;
    }
    const summary = `Quick Merge: combined ${mergedVariants} duplicate-spelling tag(s) across ${active.length} group(s), affecting ${affected.length} image(s).`;
    toast(summary);
    recordChange('merge', summary, affected);
    trackStat('merges');
    resetQuickMergeState();
    renderQuickMergeList();
    refreshAllUI();
    checkAchievements();
  });

  // Master Tag Control moved to ./master-tag-control.ts

  // Undo/redo buttons, disable/restore (moveEntry), and save-to-disk moved to ./tags-edit.ts

  // ---------------- Refresh orchestration ----------------

  function refreshAllUI(){
    refreshStats();
    renderCurrentView();
    renderTagPruners();
    refreshSelectionSummary();
    renderMasterSelectionSummary();
    updateDirtyUI();
  }

  function renderAll(){
    refreshAllUI();
  }

  // Warn before actually closing the window if there are unsaved caption
  // changes. NOT done via the web-standard 'beforeunload' + preventDefault()
  // — in Electron that silently blocks the close with no dialog at all
  // (Electron doesn't implement Chromium's native "leave site?" prompt),
  // which is exactly what made the window hang and need a Task Manager kill.
  // Instead, main.ts intercepts the native close, asks here via
  // 'request-close', and only actually closes once electronAPI.confirmClose()
  // is called — either immediately (nothing unsaved) or after the user
  // confirms losing their changes.
  if (window.electronAPI && window.electronAPI.onRequestClose){
    window.electronAPI.onRequestClose(async () => {
      const dirtyCount = entries.filter(e => e.dirty).length;
      if (dirtyCount > 0){
        const ok = await showConfirmModal(`You have ${dirtyCount} unsaved caption change(s). Quit anyway without saving?`, { okLabel: 'Quit anyway', danger: true });
        if (!ok) return;
      }
      window.electronAPI.confirmClose();
    });
  }

  renderTagPruners();
  updateLogButton();
  loadWallet();
  updateThemeSelectLocks();
  switchTab('gallery');
  initDockSystem();

})();
