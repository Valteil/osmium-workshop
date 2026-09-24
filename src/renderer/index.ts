import type { Entry, DirHandle, FileHandle, EntryMeta, GalleryFilter, GallerySortMode, GallerySortDir, CardTagSortMode, FolderStats, EditLogAffected } from './types';
import { hasDirectoryPicker, writeBytes } from './fs-access';
import { getString, setString, getBool, setBool, getJSON, setJSON, getInt, setInt } from './storage';
import { isImageFile } from './file-types';
import {
  $, btnOpen, btnSave, btnUndo, btnRedo, btnUnloadDataset, btnReloadDataset, dirtyCountEl, galleryToolbar, galleryGrid,
  compactGrid, compactCompareArea, compareCount, compactCompareTable, btnClearCompare,
  singleViewEl, imageCardModal, modalCardInner, dropHint, dropHintWrap, filterInput, filterExactToggle,
  filterAllBtn, filterUntaggedBtn, filterDirtyBtn, excludeBadge, excludeBadgeText,
  excludeBadgeClear,
  btnClearFilter, filterModeDropdown, filterModeLock, btnFlagIsolated,
  tagPrunerList, btnAddTagPruner, toastEl,
  btnOpenTagPrunerList, btnOpenUnifyVoidList, unifyVoidRows, btnOpenCanonicalTagsList, canonicalTagsList, btnOpenMasterMiniGrid,
  btnOpenTagFrequencyList, tagFamilyListArea,
  themeSelect, themeDropdown, btnThemeCustomize, themeCustomPanel, themeVarRows, themeResetBtn,
  themeApplyBtn, themeCloseBtn, btnQuit, btnLeftDrawerToggle, btnRightDrawerToggle, btnOverseerDrawerToggle,
  drawerBackdrop, leftAside, rightAside,
  topbarActions, fileCatBtn, fileCatFlyout,
  personalizationCatBtn, personalizationCatFlyout, flyoutOutsideCloseToggle,
  panelsOutsideCloseToggle, btnSettings, favoritesPanel,
  btnAddFavorite, logPanel, appVersionEl, tabGallery, tabMasterTags,
  tabStats, galleryTab, statsTab, btnStatsBack, btnMasterBack, btnGoToTagOverseer, normalRightTools,
  tabSynthDat, synthDatTab, btnSynthDatBack,
  tabDatasetManager, datasetManagerTab, dmGrid, dmGridBtn, dmListBtn, dmSortDropdown,
  layoutDropdown, shellEl, btnResetZoom, btnExportAppState, btnViewWd14TransferList, btnRightPanelCollapse, rightPanelResizeHandle,
  powerHighlightToggle,
  powerFillToggle,
  tagAutocompleteToggle, btnStartPowerToolPicker, powerToolList,
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
  singleNextBtn, singlePos, uiAnimationsDropdown, hwAccelToggle,
  settingsPanel, fontSizeSlider, fontSizeVal
} from './dom';
import { toast, toastError, showPanel, hidePanel, showConfirmModal, showInfoModal, positionMenu, buildPersistentDropdown, initClickFlash, initMenuKeyboardNav, shouldSwallowOutsideClick, markSwallowNextClick, isClickInsideOwnedPdrop, initInfoButtons, openDockListModal, transitionMsOf } from './shared-ui';
import {
  PREMIUM_THEMES, STUDIO_DEFAULTS, applyTheme, openThemeCustomPanel, toggleDayNightMode, syncNightModeFromPrePaint,
  initThemeDropdown, refinedThemes
} from './themes';
import { initDockSystem } from './docks';
import {
  applyAppZoom, resetAppZoom, getOutsideClosablePanels, saveSettingsSectionState,
  SETTINGS_SECTIONS_KEY
} from './settings';
import { initPowerTools } from './power-tools';
import { initHelp } from './help';
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
import { initCanonicalTags, loadCanonicalRulesForFolder } from './canonical-tags';
import { initBucketImages } from './bucket-images';
import {
  markDirty, updateDirtyUI, recordChange, applyTagDirection, applyRenameDirection, applyPixelDirection, getIsolateState, updateUndoRedoButtons,
  resetUndoRedo, moveEntry, initTagsEdit, undoStack, redoStack, addTagToEntry,
  markRulesDirty, rulesDirty, resetRulesDirty, renameAllEntriesSequentially, saveAllDirty
} from './tags-edit';
import {
  masterSelectedImages, renderMasterSelectionSummary, renderMasterMiniGrid, initMasterTagControl
} from './master-tag-control';
import { initWd14Tagger } from './wd14-tagger';
import { initSynthDatOverseer, loadSynthDatSettingsForFolder, getWd14TransferSets } from './synthdat-overseer';
import { attachAcChipHover } from './tags-autocomplete';
import {
  ensureWikiDataLoaded, ensureAllTagsLoaded, getCustomTagNote, setCustomTagNote,
  openTagDetails, initTagDetails
} from './tag-details';
import {
  buildTagIndex, refreshStats, filteredEntries, passesFilter, setBaseFilter,
  parseFilterTerms, setContainsFilter, setExcludesFilter, setMirroredSelectionFilter, initTagIndex,
  resetReviewFlagged
} from './tag-index';
import {
  viewMode, resetSingleIndex, resetStickyCompare,
  renderCurrentView, switchView, refreshRightPanels, initView,
  startSequentialDetail, exitSequentialDetail
} from './view';
import { initRandomFacts } from './random-facts';
import { pickDatasetFolder } from './folder-picker';
(function(){

  // ---------------- Touch-device detection (mobile port) ----------------
  // A capability check (not a width/breakpoint check) — gates behavior that's
  // wrong on ANY touch device regardless of window size, like the
  // mouseover/mouseout-driven tooltip system below, which has no real
  // "mouse left the element" event on touch and would otherwise get stuck
  // permanently visible after a tap (seen on-device during the mobile port —
  // see notes/Mobile-Port.md). Layout breakpoints (narrow-viewport CSS) are
  // separate and width-based, not gated on this.
  let isTouchDevice = false;
  try { isTouchDevice = matchMedia('(hover: none) and (pointer: coarse)').matches; } catch(e){}
  document.documentElement.classList.toggle('touch-device', isTouchDevice);

  // ---------------- State ----------------
  let dirHandle: DirHandle | null = null;
  let disabledDirHandle: DirHandle | null = null;
  let originalDirHandle: DirHandle | null = null;
  let entries: Entry[] = [];
  let entryByBase = new Map<string, Entry>();
  let galleryFilter: GalleryFilter = { base: 'all', terms: [], mode: 'AND', excludes: '', disabledView: false, originalsView: false, exactMatch: false };
  // Set once buildPersistentDropdown(filterModeDropdown, ...) runs, below —
  // referenced (via closure, not by value) from initTagIndex()'s deps
  // earlier in this same init sequence, so the assignment-after-reference
  // order here is fine.
  let filterModeDropdownCtrl: { refreshLabel: () => void } | null = null;
  // undoStack/redoStack moved to ./tags-edit.ts
  // viewMode/singleIndex/ctxMenuEl/commonLanguages moved to ./view.ts
  // editLog/logIdCounter moved to ./edit-log.ts
  // folderStats/folderUnlocked/wallet/ownedThemes/achievementPopupsEnabled moved to ./achievements.ts
  let gallerySortMode: GallerySortMode = 'filename';
  let gallerySortDir: GallerySortDir = 'asc';
  // leftSortMode/leftSortDir/familyOrder moved to ./tag-index.ts
  // dayNightOn moved to ./themes.ts
  let isolatedFlagActive = false;
  let cardTagSortMode: CardTagSortMode = 'default';
  let masterTagModeActive = false;
  // masterSelectedImages moved to ./master-tag-control.ts
  // stickyCompareImages moved to ./view.ts
  // dockOrder/dockCollapsed/dockHeights moved to ./docks.ts
  // tagPruners/tagPrunerIdCounter moved to ./tag-pruner.ts
  let entryMeta: Record<string, EntryMeta> = {};
  // wikiData/allTagsMap moved to ./tag-details.ts
  // tagAutocompleteEnabled/autocompleteEl moved to ./tags-autocomplete.ts
  // customPowerTools/powerToolPickerActive moved to ./power-tools.ts

  
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
    const unsaved = unsavedChangesDescription();
    if (unsaved){
      const ok = await showConfirmModal(`You have ${unsaved}. Restart anyway without saving?`, { okLabel: 'Restart anyway', danger: true });
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

  // ---------------- Mobile bottom panel: Left / Tools / Overseer ----------------
  // Below 900px, #left and #right (still the same real DOM containers other
  // code already references — see styles.css) become one-at-a-time bottom
  // sheets instead of side-by-side columns. "Overseer" isn't a third
  // container of its own — per switchTab() above, Tag Overseer is just
  // #right showing #masterTagPanel instead of #normalRightTools — so the
  // three-way switch is really "which of #left/#right is open" plus, for
  // #right, "which of its two internal panels switchTab() has selected."

  function closeDrawers(){
    leftAside.classList.remove('drawer-open');
    rightAside.classList.remove('drawer-open');
    drawerBackdrop.classList.remove('drawer-visible');
  }
  function openDrawer(which: string): void {
    closeDrawers();
    (which === 'left' ? leftAside : rightAside).classList.add('drawer-open');
    drawerBackdrop.classList.add('drawer-visible');
  }
  btnLeftDrawerToggle.addEventListener('click', () => {
    if (leftAside.classList.contains('drawer-open')) closeDrawers();
    else openDrawer('left');
  });
  btnRightDrawerToggle.addEventListener('click', () => {
    if (rightAside.classList.contains('drawer-open') && !masterTagModeActive) closeDrawers();
    else {
      if (masterTagModeActive) switchTab('gallery', { skipDrawerSync: true });
      openDrawer('right');
    }
  });
  btnOverseerDrawerToggle.addEventListener('click', () => {
    if (rightAside.classList.contains('drawer-open') && masterTagModeActive) closeDrawers();
    else {
      if (!masterTagModeActive) switchTab('master', { skipDrawerSync: true });
      openDrawer('right');
    }
  });
  drawerBackdrop.addEventListener('click', closeDrawers);

  // ---------------- Dock list-in-modal triggers (mobile) ----------------
  // Buttons themselves are mobile-only (styles.css) — harmless to wire up
  // unconditionally here either way, since openDockListModal() just moves
  // the real element (already working fine inline on desktop) into a
  // modal and back; nothing about wiring the click depends on breakpoint.
  btnOpenTagPrunerList.addEventListener('click', () => openDockListModal('Tag Pruner', tagPrunerList));
  btnOpenUnifyVoidList.addEventListener('click', () => openDockListModal('Unify or void selected tags', unifyVoidRows));
  btnOpenCanonicalTagsList.addEventListener('click', () => openDockListModal('Retroactive Merge/Void rules', canonicalTagsList));
  btnOpenMasterMiniGrid.addEventListener('click', () => openDockListModal('Select images', masterMiniGrid));
  btnOpenTagFrequencyList.addEventListener('click', () => openDockListModal('Tags', tagFamilyListArea));

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
      themeSelect.value = getString('dts-theme') || 'studio';
      themeDropdownCtrl.refreshLabel();
      return;
    }
    applyTheme(chosen);
    updateRefineThemeButton();
  });

  (function initTheme(){
    const saved = getString('dts-theme', 'studio');
    themeSelect.value = saved;
    themeDropdownCtrl.refreshLabel();
    if (!window.__dtsPreThemed){
      // Fallback path — index.html's pre-paint inline script normally
      // already applied this theme before first paint (see its comment);
      // this only runs if that script failed/threw for some reason.
      applyTheme(saved);
    } else {
      // The pre-paint script also mirrors the theme-refined check (see its
      // own comment), but do it again here too in case refinedThemes was
      // still empty when that inline copy ran for some transient reason —
      // this is the one that was actually missing before: previously
      // nothing on this path ever set '.theme-refined' at all, so a
      // refined theme's hover-fill effect silently didn't show up until
      // switching themes (which runs the real applyTheme() and sets it).
      document.documentElement.classList.toggle('theme-refined', refinedThemes.includes(saved));
      if (saved === 'custom'){
        // The pre-paint script applies saved custom colors if there are any,
        // but doesn't know about the "no custom colors saved yet" first-run
        // case — that still needs the editor opened, same as applyTheme('custom') would.
        let hasCustom = false;
        hasCustom = !!getString('dts-custom-theme');
        if (!hasCustom) setTimeout(openThemeCustomPanel, 0);
      }
    }
  })();

  btnThemeCustomize.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (themeCustomPanel.style.display === 'flex'){ hidePanel(themeCustomPanel); return; }
    openThemeCustomPanel();
  });
  themeCloseBtn.addEventListener('click', () => hidePanel(themeCustomPanel));

  themeResetBtn.addEventListener('click', () => {
    themeVarRows.querySelectorAll<HTMLInputElement>('input[type="color"]').forEach(inp => {
      const key = inp.dataset.varKey!;
      const hex = (STUDIO_DEFAULTS as Record<string, string>)[key] || '#000000';
      inp.value = hex;
      document.documentElement.style.setProperty(key, hex);
    });
  });

  themeApplyBtn.addEventListener('click', () => {
    const custom: Record<string, string> = {};
    themeVarRows.querySelectorAll<HTMLInputElement>('input[type="color"]').forEach(inp => {
      custom[inp.dataset.varKey!] = inp.value;
      document.documentElement.style.setProperty(inp.dataset.varKey!, inp.value);
    });
    setJSON('dts-custom-theme', custom);
    document.documentElement.setAttribute('data-theme', 'custom');
    themeSelect.value = 'custom';
    themeDropdownCtrl.refreshLabel();
    setString('dts-theme', 'custom');
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

  // Fetched from main (app.getVersion(), which reads package.json itself) so
  // this can never drift from the real version the way a hand-typed constant
  // did — falls back to '' (shown as no version string) if the IPC call ever
  // fails, rather than showing a made-up number.
  let APP_VERSION = '';
  (async () => {
    try {
      if (window.electronAPI && window.electronAPI.getAppVersion){
        APP_VERSION = await window.electronAPI.getAppVersion();
      }
    } catch(e){}
    appVersionEl.textContent = APP_VERSION ? ('v' + APP_VERSION) : '';
  })();

  // Crossfades whichever of the plain-display panes (Datasets tab, Stats
  // tab, the right-sidebar Master Tag Control swap) are actually changing
  // visibility — #galleryTab itself is excluded since `display:contents`
  // has no box of its own to fade. Sequential (fade out -> swap -> fade in),
  // not a true overlapping crossfade, so it never collides with the layout
  // shift the display swap itself causes. Respects the "Smooth transitions"
  // Settings toggle (`html.motion-off`) by skipping straight to the final
  // state with no delay when it's off.
  function switchTab(tab: string, opts?: { skipDrawerSync?: boolean }): void {
    const skipDrawerSync = !!(opts && opts.skipDrawerSync);
    const fadePanes = [datasetManagerTab, statsTab, synthDatTab, normalRightTools, masterTagPanel];
    const applyState = () => {
      tabDatasetManager.classList.toggle('active', tab === 'datasets');
      tabGallery.classList.toggle('active', tab === 'gallery');
      tabMasterTags.classList.toggle('active', tab === 'master');
      tabStats.classList.toggle('active', tab === 'stats');
      tabSynthDat.classList.toggle('active', tab === 'synthdat');
      datasetManagerTab.style.display = (tab === 'datasets') ? 'block' : 'none';
      galleryTab.style.display = (tab === 'stats' || tab === 'datasets' || tab === 'synthdat') ? 'none' : 'contents';
      statsTab.style.display = (tab === 'stats') ? 'block' : 'none';
      synthDatTab.style.display = (tab === 'synthdat') ? 'block' : 'none';
      masterTagModeActive = (tab === 'master');
      // Keeps the mobile bottom-panel sheet (#left/#right) in sync with
      // whatever switchTab() itself just decided — there are several ways
      // to reach 'master' besides the panel's own 🔭 toggle button
      // (the top tab bar's "Tag Overseer" tab, btnGoToTagOverseer, the
      // various *Back buttons returning to 'gallery'), and none of THOSE
      // touch the drawer-open state on their own. Without this, tapping
      // the top tab bar's Tag Overseer left #right's mobile sheet exactly
      // where it already was (closed, or stuck open showing stale content)
      // instead of opening to show Master Tag Control — confirmed
      // on-device. No-op on desktop (`.drawer-open` isn't referenced
      // outside the mobile breakpoint's CSS).
      // skipDrawerSync: callers that are about to manage drawer state
      // themselves right after calling switchTab() (btnRightDrawerToggle/
      // btnOverseerDrawerToggle below, using switchTab('gallery') purely to
      // reset masterTagModeActive before opening the OTHER drawer) opt out
      // of this. Without it, this deferred applyState() (it runs after the
      // fade's setTimeout, so AFTER the caller's own synchronous
      // openDrawer() call below) would closeDrawers() right on top of the
      // drawer the caller just opened — on-device this showed as the sheet
      // sliding up and immediately snapping shut on the first tap.
      if (!skipDrawerSync){ if (tab === 'master') openDrawer('right'); else closeDrawers(); }
      // Class-based (not an inline style) specifically so the mobile
      // breakpoint's own display rule (styles.css, `display:flex` for the
      // horizontal dock layout) can win normally through the cascade —
      // an inline style here would beat that regardless of selector
      // specificity short of !important, and forcing !important on BOTH
      // elements to cover both states ended up making the hidden one
      // "display:flex" too instead of actually hidden, leaking its content
      // in underneath the visible one. `.rt-hidden` is a plain class, so
      // ordinary cascade rules apply everywhere, mobile included.
      normalRightTools.classList.toggle('rt-hidden', masterTagModeActive);
      masterTagPanel.classList.toggle('rt-hidden', !masterTagModeActive);
      // Sits in the right panel's own header row (next to the collapse
      // arrow), swapping which of the two shows depending on which side
      // of the dock/Master-Tag-Control split is currently visible — fills
      // what used to be dead space there instead of adding a second button
      // inside the dock content itself.
      btnGoToTagOverseer.style.display = masterTagModeActive ? 'none' : '';
      btnMasterBack.style.display = masterTagModeActive ? '' : 'none';
      if (tab === 'stats') renderStatsTab();
      if (tab === 'datasets') renderDatasetManagerTab();
      if (tab !== 'datasets') { renderCurrentView(); renderMasterSelectionSummary(); }
      // #right is hidden (display:none, via #galleryTab above) on every tab
      // except gallery/master — re-measuring the resize handle's position
      // here, every switch, is a cheap no-op when it's still hidden (see
      // repositionRightResizeHandle()'s own guard) and self-corrects it the
      // moment it's visible again, covering any staleness picked up while
      // away (e.g. a zoom-triggered resize event landing on another tab).
      repositionRightResizeHandleSoon();
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
    }, transitionMsOf(fadePanes[0]));
  }
  tabDatasetManager.addEventListener('click', () => switchTab('datasets'));
  tabGallery.addEventListener('click', () => switchTab('gallery'));
  // Clicking Tag Overseer while it's already the active tab toggles back to
  // the default Gallery view/right panel instead of just re-selecting itself.
  // The Overseer lives in the right panel, so opening it while that panel is
  // collapsed would switch silently — expand it instead, and re-collapse it
  // when this tab toggles back to Gallery (only if this tab expanded it).
  let overseerExpandedRightPanel = false;
  tabMasterTags.addEventListener('click', () => {
    if (tabMasterTags.classList.contains('active')){
      if (overseerExpandedRightPanel && !rightAside.classList.contains('right-panel-collapsed')){
        applyRightPanelCollapsed(true);
      }
      overseerExpandedRightPanel = false;
      switchTab('gallery');
      return;
    }
    overseerExpandedRightPanel = rightAside.classList.contains('right-panel-collapsed');
    if (overseerExpandedRightPanel) applyRightPanelCollapsed(false);
    switchTab('master');
  });
  tabStats.addEventListener('click', () => switchTab('stats'));
  tabSynthDat.addEventListener('click', () => switchTab('synthdat'));
  btnStatsBack.addEventListener('click', () => switchTab('gallery'));
  btnMasterBack.addEventListener('click', () => switchTab('gallery'));
  btnGoToTagOverseer.addEventListener('click', () => switchTab('master'));
  btnSynthDatBack.addEventListener('click', () => switchTab('gallery'));

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
    on = getBool('dts-night-mode');
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

  // ---------------- Topbar auto-scale (replaces the old scroll arrows) ----------------

  // Instead of letting the actions row overflow into a scrollbar, shrink it
  // in place to fit. `scrollWidth`/`clientWidth` are unaffected by an
  // element's own `transform`, so this stays self-correcting on every tick:
  // reset to scale(1), measure the row's natural (unscaled) content width
  // against the space actually available, and re-apply. ResizeObserver on
  // the row covers every cause of that changing (window resize, font-size
  // zoom, content changes) with one mechanism, since Electron's native page
  // zoom changes the row's effective CSS-px size the same way a real resize
  // would.
  const TOPBAR_MIN_SCALE = 0.6;
  // Below this width, styles.css's own @media (max-width:900px) block gives
  // .actions `overflow-x:auto` instead — a horizontal scroll, not a shrink.
  // Skipping the transform here isn't just redundant with that, it actively
  // matters: a `transform` on an ancestor creates a new containing block for
  // any `position:fixed` descendant (e.g. the File/Personalization dropdown
  // flyouts, before they were re-parented to document.body — see that fix
  // earlier in the mobile port), so avoiding the transform at this width
  // removes that whole risk class rather than leaving it latent.
  const topbarNarrowQuery = matchMedia('(max-width: 900px)');
  function updateTopbarScale(){
    topbarActions.style.transform = '';
    if (topbarNarrowQuery.matches) return;
    const natural = topbarActions.scrollWidth;
    const available = topbarActions.clientWidth;
    if (natural <= 0 || available <= 0) return;
    const scale = Math.min(1, Math.max(TOPBAR_MIN_SCALE, available / natural));
    topbarActions.style.transform = scale < 1 ? `scale(${scale})` : '';
  }
  new ResizeObserver(updateTopbarScale).observe(topbarActions);
  updateTopbarScale();

  // ---------------- Header category flyouts (File / Personalization) ----------------

  let flyoutClosesOnOutsideClick = true;
  flyoutOutsideCloseToggle.addEventListener('change', () => {
    flyoutClosesOnOutsideClick = flyoutOutsideCloseToggle.checked;
    setBool('dts-flyout-outside-close', flyoutClosesOnOutsideClick);
  });
  (function initFlyoutOutsideClosePref(){
    const on = getBool('dts-flyout-outside-close', true);
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
  function applyUiAnimationMode(mode: string): void {
    document.documentElement.classList.toggle('motion-off', mode === 'off');
    document.documentElement.classList.toggle('motion-swipe', mode === 'swipe');
  }
  let uiAnimationMode = 'fade';
  try {
    const saved = getString('dts-ui-animation-mode');
    if (saved === 'off' || saved === 'swipe' || saved === 'fade') uiAnimationMode = saved;
    // Migrates the earlier boolean-only "Smooth transitions" checkbox pref.
    else if (!getBool('dts-ui-animations', true)) uiAnimationMode = 'off';
  } catch(e){}
  buildPersistentDropdown(uiAnimationsDropdown, [
    { value: 'fade', label: 'Fade' },
    { value: 'swipe', label: 'Swipe' },
    { value: 'off', label: 'Off' }
  ], () => uiAnimationMode, (val) => {
    uiAnimationMode = val;
    setString('dts-ui-animation-mode', val);
    applyUiAnimationMode(val);
  });
  applyUiAnimationMode(uiAnimationMode);

  // Hardware acceleration (Settings ▸ Performance) — this can only be
  // decided at process startup, before any window/webview exists, so
  // changing it here just persists the choice (main.ts's
  // get/setHardwareAcceleration, which write a tiny file main.ts itself
  // reads directly — see its own comment for why that can't just be
  // localStorage) and prompts a restart, same as any other startup-only
  // preference in this app.
  (async function initHardwareAccelToggle(){
    try {
      hwAccelToggle.checked = await window.electronAPI.getHardwareAcceleration();
    } catch(e){ /* preload not ready yet or unsupported — leave the default checked state */ }
  })();
  hwAccelToggle.addEventListener('change', async () => {
    const enabled = hwAccelToggle.checked;
    await window.electronAPI.setHardwareAcceleration(enabled);
    const restart = await showConfirmModal(
      'This change only takes effect after a restart. Restart now?',
      { okLabel: 'Restart now' }
    );
    if (restart) window.electronAPI.restartApp();
  });

  function setupHeaderCategory(btn: HTMLElement, flyout: HTMLElement & { _headerCatBtn?: HTMLElement }): void {
    // Re-parented to document.body (matching pdrop-menu/ctx-menu's own
    // pattern — see shared-ui.ts) instead of staying nested inside
    // #topbar .actions, its original DOM position. That container gets a
    // JS-driven `transform: scale(n)` on narrow viewports
    // (updateTopbarScale()) to keep the topbar buttons from overflowing —
    // and per the CSS spec, a `transform` on an ancestor creates a new
    // containing block for any `position: fixed` descendant, so this
    // flyout's fixed positioning was being computed relative to the
    // scaled/shrunk topbar box instead of the real viewport. Invisible on
    // desktop (the scale rarely triggers at normal window widths) but
    // silently broke the whole menu on mobile's narrow viewport, where it
    // always triggers — found during the mobile port, see notes/Mobile-Port.md.
    document.body.appendChild(flyout);
    // Outside-click-close (below) needs a way back to the trigger button
    // now that flyout lives under document.body instead of inside `wrap` —
    // stash it here rather than re-deriving it there.
    flyout._headerCatBtn = btn;
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const isOpen = flyout.style.display === 'flex';
      document.querySelectorAll<HTMLElement>('.header-cat-flyout').forEach(f => { f.style.display = 'none'; f.classList.remove('menu-in'); });
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
      // Forced reflow (not double-rAF) so the opacity:0 -> .menu-in
      // transition reliably fires even on WebViews that throttle/skip
      // rAF right after an activity resume (seen on a Samsung Capacitor
      // build during the mobile port — see notes/Mobile-Port.md).
      void flyout.offsetHeight;
      flyout.classList.add('menu-in');
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
    let closedAny = false;
    // Iterate the flyouts directly (not via `.header-cat wrap.querySelector`)
    // — setupHeaderCategory() reparents each flyout to document.body so its
    // fixed positioning isn't computed relative to a scaled/transformed
    // ancestor (see that function's comment), which means it's no longer a
    // DOM descendant of its original `.header-cat` wrapper at all. A
    // wrap-based lookup silently finds nothing and this whole close-on-
    // outside-click behavior never fires. flyout._headerCatBtn (stashed in
    // setupHeaderCategory) is the way back to its trigger button now.
    document.querySelectorAll<HTMLElement & { _headerCatBtn?: HTMLElement }>('.header-cat-flyout').forEach(flyout => {
      const btn = flyout._headerCatBtn;
      if (flyout.style.display === 'flex' && !flyout.contains(ev.target as Node) && !(btn && btn.contains(ev.target as Node))){
        flyout.style.display = 'none';
        flyout.classList.remove('menu-in');
        closedAny = true;
      }
    });
    // The close above already happened on mousedown — the eventual 'click'
    // dispatched from this same gesture is a SEPARATE event we can't stop
    // from here (see shared-ui.ts's comment). markSwallowNextClick() flags
    // it for shared-ui.ts's own capture-phase 'click' listener to consume.
    if (closedAny && shouldSwallowOutsideClick()) markSwallowNextClick();
  });

  // ---------------- Floating panel outside-click-to-close (Favorites/Log/Colors/Achievements/Shop/Tag Details) ----------------

  let panelsCloseOnOutsideClick = true;
  panelsOutsideCloseToggle.addEventListener('change', () => {
    panelsCloseOnOutsideClick = panelsOutsideCloseToggle.checked;
    setBool('dts-panels-outside-close', panelsCloseOnOutsideClick);
  });
  (function initPanelsOutsideClosePref(){
    const on = getBool('dts-panels-outside-close', true);
    panelsCloseOnOutsideClick = on;
    panelsOutsideCloseToggle.checked = on;
  })();

  // getOutsideClosablePanels moved to ./settings.ts

  // Capture phase (not bubble) so this can swallow the click — see
  // shared-ui.ts's shouldSwallowOutsideClick() comment for why that requires
  // deciding-and-stopping before the event ever reaches its target.
  document.addEventListener('click', (ev) => {
    if (!panelsCloseOnOutsideClick) return;
    let closedAny = false;
    getOutsideClosablePanels().forEach(panel => {
      if (panel.style.display === 'flex' && !panel.contains(ev.target as Node) && !isClickInsideOwnedPdrop(panel, ev.target)){
        hidePanel(panel);
        closedAny = true;
      }
    });
    if (closedAny && shouldSwallowOutsideClick()){ ev.stopPropagation(); ev.preventDefault(); }
  }, true);

  // ---------------- Reset Edibits / Achievements (debug) ----------------

  // Reset Edibits / Achievements handlers moved to ./achievements.ts (initAchievementPanels)

  // ---------------- Settings panel ----------------

  // fontSizeSlider/fontSizeVal/settingsPanel moved to ./dom.ts
  const tooltipsToggle = $<HTMLInputElement>('tooltipsToggle');
  const tagCountBadgeToggle = $<HTMLInputElement>('tagCountBadgeToggle');
  const cardTagSortDropdown = $('cardTagSortDropdown');
  const galleryColumnsDropdown = $('galleryColumnsDropdown');
  const dynamicCardsToggle = $<HTMLInputElement>('dynamicCardsToggle');
  const btnDiscreteToggle = $('btnDiscreteToggle');
  const btnDiscreteOff = $('btnDiscreteOff');
  const btnPurgeAllTags = $('btnPurgeAllTags');
  const settingsCloseBtn = $('settingsCloseBtn');
  const tooltipBubble = $('tooltipBubble');
  const tooltipDelaySlider = $<HTMLInputElement>('tooltipDelaySlider');
  const tooltipDelayVal = $('tooltipDelayVal');
  let tooltipsEnabled = true;
  let tooltipDelayMs = 1000;
  let discreteModeOn = false;
  let purgeConfirmCount = 0;
  let showTagCountBadges = false;

  tagCountBadgeToggle.addEventListener('change', () => {
    showTagCountBadges = tagCountBadgeToggle.checked;
    setBool('dts-tagcount-badges', showTagCountBadges);
    renderCurrentView();
  });
  (function initTagCountBadgePref(){
    const on = getBool('dts-tagcount-badges');
    showTagCountBadges = on;
    tagCountBadgeToggle.checked = on;
  })();

  // Masonry-style dynamic card heights is redundant on mobile (the grid is
  // a fixed-height single row there, not a multi-column layout it would
  // meaningfully affect) and was the source of a recurring CSS-specificity
  // fight against the mobile row layout — dropped outright on touch devices
  // rather than fought with !important. The Settings row itself is also
  // hidden on mobile (styles.css).
  dynamicCardsToggle.addEventListener('change', () => {
    if (document.documentElement.classList.contains('touch-device')) return;
    document.documentElement.classList.toggle('dynamic-cards', dynamicCardsToggle.checked);
    setBool('dts-dynamic-cards', dynamicCardsToggle.checked);
  });
  (function initDynamicCardsPref(){
    if (document.documentElement.classList.contains('touch-device')){
      dynamicCardsToggle.checked = false;
      document.documentElement.classList.remove('dynamic-cards');
      return;
    }
    const on = getBool('dts-dynamic-cards');
    dynamicCardsToggle.checked = on;
    document.documentElement.classList.toggle('dynamic-cards', on);
  })();

  // ---------------- Hover tooltips (1s delay, disableable) ----------------

  let tooltipTimer: ReturnType<typeof setTimeout> | null = null;
  let tooltipTarget: HTMLElement | null = null;
  let tooltipMeasureCtx: CanvasRenderingContext2D | null = null;

  // Reliable placeholder-overflow check: an EMPTY input's `scrollWidth`
  // doesn't necessarily reflect its placeholder's rendered width (Chromium
  // computes it from actual value content, which there isn't any of) — so
  // this measures the placeholder text directly via a throwaway canvas
  // context using the input's own computed font, the standard reliable way
  // to measure text width without touching the DOM.
  function placeholderOverflowWidth(el: HTMLInputElement): boolean {
    if (!tooltipMeasureCtx) tooltipMeasureCtx = document.createElement('canvas').getContext('2d');
    const cs = getComputedStyle(el);
    tooltipMeasureCtx!.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const textWidth = tooltipMeasureCtx!.measureText(el.placeholder).width;
    const availWidth = el.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
    return textWidth > availWidth;
  }

  function showTooltipBubble(el: HTMLElement, tipText: string): void {
    tooltipTimer = setTimeout(() => {
      if (tooltipTarget !== el) return;
      const rect = el.getBoundingClientRect();
      tooltipBubble.textContent = tipText;
      tooltipBubble.style.display = 'block';
      tooltipBubble.classList.remove('tooltip-bottom-pinned');
      const bubbleRect = tooltipBubble.getBoundingClientRect();
      let top = rect.top - bubbleRect.height - 8;
      if (top < 8){
        // Not enough room above (the normal case for topbar buttons, whose
        // rect.top is near 0) — landing the tooltip directly below the
        // element instead puts it right where the cursor usually still is,
        // which a small font size or a custom cursor image can hide
        // entirely (reported directly). Pin it to the bottom of the screen
        // instead, decoupled from the trigger element's position, with a
        // highlight so it's still easy to notice despite that.
        tooltipBubble.classList.add('tooltip-bottom-pinned');
        tooltipBubble.style.left = '50%';
        tooltipBubble.style.bottom = '16px';
        tooltipBubble.style.top = '';
        tooltipBubble.style.transform = 'translateX(-50%)';
      } else {
        let left = rect.left;
        if (left + bubbleRect.width + 8 > window.innerWidth) left = window.innerWidth - bubbleRect.width - 8;
        tooltipBubble.style.left = Math.max(8, left) + 'px';
        tooltipBubble.style.top = top + 'px';
        tooltipBubble.style.bottom = '';
        tooltipBubble.style.transform = '';
      }
    }, tooltipDelayMs);
  }

  document.addEventListener('mouseover', (ev) => {
    if (!tooltipsEnabled || isTouchDevice) return;
    // Ghost/placeholder text tooltip: an empty field's placeholder can run
    // past the field's own visible width with no way to read the rest
    // short of widening the sidebar — show the full placeholder the same
    // way a title-attribute tooltip works, reusing the same bubble/timer/
    // positioning below.
    const target = ev.target as HTMLElement;
    const placeholderEl = target.closest ? target.closest('input[placeholder]') as HTMLInputElement | null : null;
    if (placeholderEl && !placeholderEl.value && placeholderOverflowWidth(placeholderEl)){
      if (placeholderEl === tooltipTarget) return;
      if (tooltipTimer !== null) clearTimeout(tooltipTimer);
      tooltipTarget = placeholderEl;
      showTooltipBubble(placeholderEl, placeholderEl.placeholder);
      return;
    }
    const el = target.closest('[title]') as HTMLElement | null;
    if (!el || el === tooltipTarget) return;
    if (tooltipTimer !== null) clearTimeout(tooltipTimer);
    tooltipTarget = el;
    const tipText = el.getAttribute('title');
    if (!tipText) return;
    // Strip the native title attribute immediately (not inside the setTimeout
    // below) so Chromium's own hover-tooltip never gets a chance to flash
    // briefly before our styled tooltipBubble appears a second later.
    el.dataset.tipStash = tipText;
    el.removeAttribute('title');
    showTooltipBubble(el, tipText);
  });

  document.addEventListener('mouseout', (ev) => {
    if (isTouchDevice) return;
    const el = (ev.target as HTMLElement).closest('[title], [data-tip-stash], input[placeholder]') as HTMLElement | null;
    if (!el) return;
    if (tooltipTimer !== null) clearTimeout(tooltipTimer);
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
    // Anchored directly below the button that opened it (not centered — see
    // styles.css's #settingsPanel override of .log-panel's centering) using
    // the same viewport-clamped positioning every dropdown/context-menu in
    // the app already uses, rather than a fixed CSS position that wouldn't
    // track the button's actual location. showPanel() first so offsetWidth
    // is measurable (display:none elements report 0).
    showPanel(settingsPanel);
    const rect = btnSettings.getBoundingClientRect();
    positionMenu(settingsPanel, rect.right - settingsPanel.offsetWidth, rect.bottom + 6);
  });
  settingsCloseBtn.addEventListener('click', () => hidePanel(settingsPanel));

  // ---------------- Collapsible settings sections ----------------

  // SETTINGS_SECTIONS_KEY/saveSettingsSectionState moved to ./settings.ts
  (function initSettingsSections(){
    const saved = getJSON<Record<string, boolean>>(SETTINGS_SECTIONS_KEY, {});
    document.querySelectorAll<HTMLElement>('#settingsPanel .settings-section').forEach(section => {
      const id = section.dataset.section!;
      const defaultExpanded = id !== 'danger'; // everything starts open except Danger Zone
      const expanded = Object.prototype.hasOwnProperty.call(saved, id) ? !!saved[id] : defaultExpanded;
      section.classList.toggle('expanded', expanded);
      const header = section.querySelector('.settings-section-header') as HTMLElement | null;
      header!.addEventListener('click', () => {
        const nowExpanded = !section.classList.contains('expanded');
        section.classList.toggle('expanded', nowExpanded);
        const state = getJSON<Record<string, boolean>>(SETTINGS_SECTIONS_KEY, {});
        state[id] = nowExpanded;
        saveSettingsSectionState(state);
      });
    });
  })();

  // NOT debounced-on-input — applying real page zoom WHILE the slider itself
  // is being dragged rescales the very control the mouse is on, mid-drag: a
  // native <input type=range>'s value is computed from mouse position
  // relative to its (now-rescaled) track, so the SAME physical mouse
  // position suddenly maps to a different value the instant zoom lands,
  // firing another 'input' with that new (wrong) value — which applies
  // ANOTHER zoom, rescaling the track again. That's a genuine feedback
  // loop, not just an event-frequency problem — any debounce short enough
  // to feel responsive still re-triggers it every time it fires, and it
  // self-sustains independent of further real mouse movement (matches the
  // reported "keeps flickering regardless of where the slider is").
  // Fix: only commit the actual zoom on 'change' (fires once, on release/
  // arrow-key commit) — the live label on 'input' is cheap DOM text and
  // doesn't move the control, so it's safe to update on every tick.
  async function applyFontZoomFromSlider(){
    const px = fontSizeSlider.value;
    // applyAppZoom's setZoomFactor is a real cross-process IPC round-trip
    // (ipcRenderer.invoke to the main process, which calls
    // webContents.setZoomFactor on this same window) — NOT instant from the
    // renderer's own perspective. Reading getBoundingClientRect()/
    // offsetWidth immediately after firing it (without awaiting) reads
    // stale pre-zoom layout, which is exactly why the panel ended up
    // mispositioned/overflowing at higher zoom instead of tracking it. Await
    // the round-trip, then one rAF to be sure the resulting layout pass has
    // actually run, before measuring anything.
    await applyAppZoom(parseInt(px, 10) / 14);
    setString('dts-font-size', px);
    if (settingsPanel.style.display === 'flex'){
      requestAnimationFrame(() => {
        const rect = btnSettings.getBoundingClientRect();
        positionMenu(settingsPanel, rect.right - settingsPanel.offsetWidth, rect.bottom + 6);
      });
    }
  }
  fontSizeSlider.addEventListener('input', () => {
    fontSizeVal.textContent = fontSizeSlider.value + 'px';
  });
  fontSizeSlider.addEventListener('change', applyFontZoomFromSlider);
  (function initFontSize(){
    const px = getString('dts-font-size', '14');
    fontSizeSlider.value = px;
    fontSizeVal.textContent = px + 'px';
    applyAppZoom(parseInt(px, 10) / 14);
  })();

  powerHighlightToggle.addEventListener('change', () => {
    document.documentElement.classList.toggle('power-highlight', powerHighlightToggle.checked);
    setBool('dts-power-highlight', powerHighlightToggle.checked);
  });
  powerFillToggle.addEventListener('change', () => {
    document.documentElement.classList.toggle('power-fill', powerFillToggle.checked);
    setBool('dts-power-fill', powerFillToggle.checked);
  });
  (function initPowerHighlight(){
    const highlightOn = getBool('dts-power-highlight', true);
    const fillOn = getBool('dts-power-fill');
    powerHighlightToggle.checked = highlightOn;
    powerFillToggle.checked = fillOn;
    document.documentElement.classList.toggle('power-highlight', highlightOn);
    document.documentElement.classList.toggle('power-fill', fillOn);
  })();

  // Power-tool marking (builtin/custom lists, settings checkboxes, picker)
  // moved to ./power-tools.ts
  initPowerTools();

  // Tag Pruner / tag autocomplete moved to ./tag-pruner.ts / ./tags-autocomplete.ts —
  // both need a few core internals (buildTagIndex, refreshRightPanels, the
  // wiki/all-tags loaders, addTagToEntry) that can't be exported out of this
  // IIFE, so they're injected once here instead of imported. Tag Pruner also
  // gets setMirroredSelectionFilter (tag-index.ts) for its per-instance
  // "mirror to gallery search" checkbox.
  initAchievements({ getDirHandle: () => dirHandle, getEditLog: () => editLog, refreshThemeDropdownLabel: () => themeDropdownCtrl.refreshLabel() });
  initAchievementPanels();
  initTagPruner(buildTagIndex, refreshRightPanels, setMirroredSelectionFilter);
  initTagAutocomplete({
    ensureWikiDataLoaded, getCustomTagNote, setCustomTagNote,
    ensureAllTagsLoaded, addTagToEntry, refreshRightPanels
  });

  tagAutocompleteToggle.addEventListener('change', () => {
    setTagAutocompleteEnabled(tagAutocompleteToggle.checked);
    setBool('dts-tag-autocomplete', tagAutocompleteEnabled);
  });
  (function initTagAutocompletePref(){
    const on = getBool('dts-tag-autocomplete');
    setTagAutocompleteEnabled(on);
    tagAutocompleteToggle.checked = on;
  })();

  // Settings → "Export app state": a debugging snapshot, not a real feature
  // for most users — dumps every localStorage key this app writes (theme,
  // toggles, panel layout/width, WD14 settings, achievements/wallet
  // progress, etc. — practically everything persisted lives in localStorage
  // here, per this app's portable-data design) plus a bit of in-memory
  // runtime state localStorage doesn't cover (whether a dataset is actually
  // loaded right now, how many images, current view mode). Written next to
  // the app by main.ts's export-app-state handler, named with the current
  // date/time so a bug report can be matched to exactly this.
  // Read-only lookup of SynthDat's WD14 transfer-tag vocabulary — what the
  // reference-image tag-assignment picker will auto-suggest (and where),
  // grouped by main keyword family and shown as gallery-class chips so the
  // lists scan as clusters, not a flat alphabet soup.
  btnViewWd14TransferList.addEventListener('click', () => {
    const sets = getWd14TransferSets();
    const html = sets.map(s => `
      <div style="margin-bottom:16px;">
        <div style="font-weight:600; margin-bottom:2px;">${s.name} <span style="font-weight:400; color:var(--text-faint);">(${s.total})</span></div>
        <div style="font-size:11.5px; color:var(--text-muted); margin-bottom:4px;">${s.desc}</div>
        ${s.groups.map(g => `
          <div style="margin:8px 0 2px; font-weight:600; font-size:11.5px; color:var(--text-primary);">${g.family} <span style="font-weight:400; color:var(--text-faint);">(${g.tags.length})</span></div>
          <div class="chiprow">
            ${g.tags.map(t => `<span class="chip chip-static" data-tag="${t}"><span>${t}</span></span>`).join('')}
          </div>`).join('')}
      </div>`).join('');
    // Chips carry data-tag, so hovering one floats the SAME definition card
    // the autocomplete suggestions use (tags-autocomplete.ts) — not a bare
    // title tooltip.
    showInfoModal(html, 'WD14 SynthDat transfer list', (body) => attachAcChipHover(body));
  });
  btnExportAppState.addEventListener('click', async () => {
    if (!window.electronAPI || !window.electronAPI.exportAppState){
      toast('Export isn\'t available in this build.');
      return;
    }
    const localStorageDump: Record<string, string | null> = {};
    try {
      for (let i = 0; i < localStorage.length; i++){
        const key = localStorage.key(i);
        if (key !== null) localStorageDump[key] = localStorage.getItem(key);
      }
    } catch(e){}
    const state = {
      exportedAt: new Date().toISOString(),
      appVersion: APP_VERSION,
      runtime: {
        datasetLoaded: !!dirHandle,
        imageCount: entries.length,
        viewMode,
        currentTheme: document.documentElement.getAttribute('data-theme') || 'studio',
        panelLayout,
        rightPanelCollapsed: rightAside.classList.contains('right-panel-collapsed'),
        masterTagModeActive
      },
      localStorage: localStorageDump
    };
    try {
      const result = await window.electronAPI.exportAppState(JSON.stringify(state, null, 2));
      toast(result.ok ? `Exported app state to ${result.path}` : (result.message || 'Export failed.'), result.ok ? 5000 : 4000);
    } catch(err){
      toastError('Failed to export app state', err, 2600);
    }
  });

  tooltipsToggle.addEventListener('change', () => {
    tooltipsEnabled = tooltipsToggle.checked;
    setBool('dts-tooltips-enabled', tooltipsEnabled);
  });
  (function initTooltipsPref(){
    const on = getBool('dts-tooltips-enabled', true);
    tooltipsEnabled = on;
    tooltipsToggle.checked = on;
  })();

  tooltipDelaySlider.addEventListener('input', () => {
    tooltipDelayMs = parseInt(tooltipDelaySlider.value, 10);
    tooltipDelayVal.textContent = tooltipDelayMs + 'ms';
    setInt('dts-tooltip-delay', tooltipDelayMs);
  });
  (function initTooltipDelayPref(){
    let ms = getInt('dts-tooltip-delay', 1000);
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

  // Shared by every unsaved-changes guard below (Quit/Restart/Unload/Reload/
  // switch-dataset) — a plain-English description of what's unsaved, or null
  // if nothing is. Covers both per-image caption edits AND the Retroactive
  // Merge/Void dock's own rule changes (rulesDirty, tags-edit.ts) now that
  // rule edits are a dirty/saveable action instead of writing to disk
  // immediately on every toggle.
  function unsavedChangesDescription(): string | null {
    const dirtyCount = entries.filter(e => e.dirty).length;
    const parts: string[] = [];
    if (dirtyCount > 0) parts.push(`${dirtyCount} unsaved caption change(s)`);
    if (rulesDirty) parts.push('unsaved Retroactive Merge/Void rule change(s)');
    return parts.length ? parts.join(' and ') : null;
  }

  // Shared unsaved-changes guard for every way the active dataset can be
  // switched away from (File > Open, Favorites reopen, Dataset tab reopen) —
  // same pattern as Quit/Restart/Unload, just phrased for "switching" instead
  // of "closing".
  async function confirmDatasetSwitch(message: string): Promise<boolean> {
    const unsaved = unsavedChangesDescription();
    if (!unsaved) return true;
    return showConfirmModal(`You have ${unsaved}. ${message}`, { okLabel: 'Switch anyway', danger: true });
  }

  // Shared by favorites.ts and dataset-manager.ts — both reopen a saved
  // FileSystemDirectoryHandle the same way the initial folder-open flow does.
  async function openFolderHandle(handle: DirHandle): Promise<void> {
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
    getEntries: () => entries,
    getEntryByBase: (base) => entryByBase.get(base),
    getDirHandle: () => dirHandle,
    getDisabledDirHandle: () => disabledDirHandle,
    setDisabledDirHandle: (h) => { disabledDirHandle = h; },
    getOriginalDirHandle: () => originalDirHandle,
    reindexEntry: (oldBase, newBase) => {
      const entry = entryByBase.get(oldBase);
      if (entry){ entryByBase.delete(oldBase); entryByBase.set(newBase, entry); }
      if (entryMeta[oldBase] !== undefined){ entryMeta[newBase] = entryMeta[oldBase]; delete entryMeta[oldBase]; }
    },
    resetSingleIndex: () => resetSingleIndex(),
    refreshStats: () => refreshStats(),
    refreshAllUI: () => refreshAllUI(),
    renderCurrentView: () => renderCurrentView(),
    applyIsolateDirection: (affected, direction) => applyIsolateDirection(affected, direction),
    applyFlaggedReviewDirection: (affected, direction) => applyFlaggedReviewDirection(affected, direction)
  });

  // Tag index/frequency list + gallery filtering moved to ./tag-index.ts
  initTagIndex({
    getEntries: () => entries,
    getGalleryFilter: () => galleryFilter,
    getGallerySortMode: () => gallerySortMode,
    getGallerySortDir: () => gallerySortDir,
    resetSingleIndex: () => resetSingleIndex(),
    renderCurrentView: () => renderCurrentView(),
    refreshFilterModeUI: () => filterModeDropdownCtrl?.refreshLabel(),
    isFilterModeLocked: () => filterModeLock.checked,
    markTagReviewed: (tag) => markTagReviewed(tag)
  });

  // Master Tag Control moved to ./master-tag-control.ts
  initMasterTagControl({
    getEntries: () => entries,
    getEntryByBase: (base) => entryByBase.get(base),
    filteredEntries: () => filteredEntries(),
    renderCurrentView: () => renderCurrentView(),
    refreshAllUI: () => refreshAllUI(),
    getEntryMeta: () => entryMeta,
    saveEntryMeta: () => saveEntryMeta(),
    deleteEntriesPermanently: (entriesList) => deleteEntriesPermanently(entriesList),
    disableEntries: (entriesList) => disableEntriesForSelection(entriesList),
    onStartSequential: (from) => startSequentialDetail(from)
  });

  // WD14 Autotagger (ComfyUI bridge) moved to ./wd14-tagger.ts — settings
  // live entirely in Tag Overseer; the per-image 3-dot menu (view.ts) calls
  // its tagSingleImageWithWd14() directly rather than through injected deps,
  // same one-directional import view.ts already uses for master-tag-control.
  initWd14Tagger({
    getEntries: () => entries,
    refreshAllUI: () => refreshAllUI()
  });

  // SynthDat Overseer moved to ./synthdat-overseer.ts — reuses buildEntry()
  // (the same per-image entry constructor scanDirInto() uses on folder open)
  // so a freshly-accepted generated image is appended to `entries` the exact
  // same way a folder rescan would have built it.
  initSynthDatOverseer({
    getDirHandle: () => dirHandle,
    addEntryFromNewFile: (...args: unknown[]) =>
      buildEntry(args[0] as string, args[1] as FileHandle, args[2] as string, args[3] as FileHandle | null, args[4] as boolean, args[5] as string[], args[6] as boolean),
    refreshAllUI: () => refreshAllUI()
  });

  // Edit log + Stats tab moved to ./edit-log.ts
  initEditLog({
    getDirHandle: () => dirHandle,
    getEntryByBase: (base) => entryByBase.get(base),
    applyTagDirection: (affected, direction) => applyTagDirection(affected, direction),
    applyRenameDirection: (affected, direction) => applyRenameDirection(affected, direction),
    applyPixelDirection: (affected, direction) => applyPixelDirection(affected, direction),
    applyIsolateDirection: (affected, direction) => applyIsolateDirection(affected, direction),
    applyFlaggedReviewDirection: (affected, direction) => applyFlaggedReviewDirection(affected, direction),
    moveEntry: (entry, toDisabled) => moveEntry(entry, toDisabled),
    trackStat: (key, amount) => trackStat(key, amount),
    checkAchievements: () => checkAchievements(),
    refreshAllUI: () => refreshAllUI(),
    getUndoStack: () => undoStack,
    getRedoStack: () => redoStack
  });

  // Retroactive Merge/Void dock (right sidebar) moved to ./canonical-tags.ts
  initCanonicalTags({
    getDirHandle: () => dirHandle,
    getEntries: () => entries,
    markDirty: (e) => markDirty(e),
    markRulesDirty: () => markRulesDirty(),
    recordChange: (type, summary, affected, extra) => recordChange(type, summary, affected, extra),
    refreshAllUI: () => refreshAllUI()
  });

  // Bucket Images dock (Gallery right panel) — moved to ./bucket-images.ts
  initBucketImages({
    getDirHandle: () => dirHandle,
    getEntries: () => entries,
    reload: () => loadFolder(),
    saveAllDirty: (silent) => saveAllDirty(silent)
  });

  // Gallery/compact/single view rendering, chips, modal, image options menu moved to ./view.ts
  initView({
    getEntries: () => entries,
    getEntryByBase: (base) => entryByBase.get(base),
    getDirHandle: () => dirHandle,
    addEntryFromNewFile: (base, imgHandle, imgName, txtHandle, txtExisted, tags, disabled) =>
      buildEntry(base, imgHandle, imgName, txtHandle, txtExisted, tags, disabled),
    getMasterTagModeActive: () => masterTagModeActive,
    getCardTagSortMode: () => cardTagSortMode,
    getGalleryFilter: () => galleryFilter,
    getIsolatedFlagActive: () => isolatedFlagActive,
    getShowTagCountBadges: () => showTagCountBadges,
    getEntryMeta: () => entryMeta,
    saveEntryMeta: () => saveEntryMeta(),
    refreshAllUI: () => refreshAllUI(),
    setContainsFilter: (tag) => setContainsFilter(tag),
    setExcludesFilter: (tag) => setExcludesFilter(tag),
    deleteEntryPermanently: (entry) => deleteEntryPermanently(entry),
    setRightPanelCollapsed: (collapsed) => applyRightPanelCollapsed(collapsed),
    getRightPanelCollapsed: () => rightAside.classList.contains('right-panel-collapsed'),
    getHideTags: () => getBool('dts-hide-tags')
  });

  // Achievements/stats/wallet/shop moved to ./achievements.ts

  function baseName(name: string): string {
    const i = name.lastIndexOf('.');
    return i === -1 ? name : name.slice(0, i);
  }
  // ---------------- Folder loading ----------------

  btnOpen.addEventListener('click', async () => {
    if (!hasDirectoryPicker()){
      toast('Your browser does not support folder access. Use Chrome or Edge, opened as a normal tab (not an embedded preview).', 5000);
      return;
    }
    if (!(await confirmDatasetSwitch('Open a different folder anyway without saving?'))) return;
    // pickDatasetFolder (folder-picker.ts) owns the picker call itself:
    // reentry guard, stuck-picker recovery, and the special-folder bounce-
    // back live there since the Dataset tab's picker shares this session.
    const picked = await pickDatasetFolder();
    if (!picked) return;
    // Direct feedback: on mobile especially, the File flyout was left open
    // covering the screen for the whole scan — a folder was already chosen
    // at this point, so there's nothing left for the flyout to do. Closing
    // here (before the scan, not after) means the user isn't stuck staring
    // at the dropdown while loadFolder() runs.
    fileCatFlyout.style.display = 'none';
    fileCatFlyout.classList.remove('menu-in');
    dirHandle = picked;
    try {
      await loadFolder();
      // Picking OK with nothing selected resolves an (often empty) folder
      // rather than failing — loading it is honest, but tracking it as a
      // dataset and prompting about it is nonsense. Say what happened and
      // leave the empty state usable instead of opening the add-to-tab
      // prompt over a folder with nothing in it.
      if (entries.length === 0) {
        toast(`"${picked.name}" has no images — pick a folder with images to tag.`, 4200);
        return;
      }
    } catch(err){
      toast('Could not load that folder — it may be invalid, moved, or missing permission. Try again.', 4200);
      // Full reset to the empty state, not just dirHandle = null: a mid-scan
      // throw can leave partial entries/indexes behind, plus an enabled
      // Reload button pointing at nothing — all of which make the NEXT
      // attempt behave strangely.
      dirHandle = null;
      disabledDirHandle = null;
      originalDirHandle = null;
      entries = [];
      entryByBase.clear();
      btnAddFavorite.disabled = true;
      btnUnloadDataset.disabled = true;
      btnReloadDataset.disabled = true;
      resetUndoRedo();
      masterSelectedImages.clear();
      resetStickyCompare();
      resetReviewFlagged();
      updateUndoRedoButtons();
      dropHint.style.display = 'flex';
      dropHintWrap.style.display = 'block';
      galleryToolbar.style.display = 'none';
      return;
    }
    maybePromptAddDataset(picked);
  });

  async function scanDirInto(handle: DirHandle, disabled: boolean, original = false): Promise<void> {
    const imageHandles = new Map<string, { handle: FileHandle; name: string }>();
    const txtHandles = new Map<string, { handle: FileHandle; name: string }>();
    for await (const h of handle.values()){
      if (h.kind !== 'file') continue;
      const name = h.name;
      if (isImageFile(name)){
        imageHandles.set(baseName(name), { handle: h, name });
      } else if (name.toLowerCase().endsWith('.txt')){
        txtHandles.set(baseName(name), { handle: h, name });
      }
    }
    const bases = Array.from(imageHandles.keys()).sort((a,b)=> a.localeCompare(b, undefined, {numeric:true}));
    for (const base of bases){
      const img = imageHandles.get(base)!;
      const txtEntry = txtHandles.get(base);
      let tags: string[] = [];
      let txtHandle: FileHandle | null = null;
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

      await buildEntry(base, img.handle, img.name, txtHandle, txtExisted, tags, disabled, original);
    }
  }

  // Extracted from scanDirInto's per-image body so a single new file (e.g.
  // SynthDat Overseer's "Accept" flow, which writes one freshly-generated
  // image+.txt into dirHandle without a full folder rescan) can be appended
  // to `entries` the exact same way a folder-open scan would have built it,
  // rather than a second, divergent entry-shape constructor.
  async function buildEntry(base: string, imgHandle: FileHandle, imgName: string, txtHandle: FileHandle | null, txtExisted: boolean, tags: string[], disabled: boolean, original = false): Promise<Entry> {
    const file = await imgHandle.getFile();
    const objectUrl = URL.createObjectURL(file);

    const entry: Entry = {
      base,
      imgName,
      imgHandle,
      txtHandle,
      txtName: base + '.txt',
      txtExisted,
      objectUrl,
      tags,
      dirty: false,
      disabled,
      original,
      // Default meta for an entry created OUTSIDE the normal folder-scan path
      // (e.g. SynthDat's addEntryFromNewFile) — loadFolder()'s own post-scan
      // loop overwrites this from the persisted _dts_meta.json (or stamps a
      // fresh one) for every entry built by scanDirInto(), so this default
      // only actually sticks for entries built afterward. dateAdded here is
      // "the moment this entry was actually created," which is exactly right
      // for that path (a SynthDat image didn't exist a moment before this).
      meta: { flaggedTags: [], note: '', noteAlwaysVisible: false, locked: false, mergeImmune: false, antivoid: false, dateAdded: Date.now() }
    };
    entries.push(entry);
    // entryByBase is keyed by bare stem, but an `original_images/` shadow copy
    // (Bucket Images) shares that stem with its bucketed root image — and
    // originalImages is scanned AFTER the root, so a plain set() here let the
    // DISABLED original clobber the real entry's mapping. Every selection-based
    // action resolves through getEntryByBase(), so "Apply/remove on selected",
    // Lock, Disable, Delete etc. silently hit the hidden original instead of the
    // Gallery image (the edit log still recorded a hit — on the wrong object).
    // Keep a non-original entry's mapping authoritative; an orphan original
    // (no root counterpart) still gets mapped when nothing else claims the base.
    if (!(original && entryByBase.has(base))) entryByBase.set(base, entry);
    loadImageDimensions(entry);
    return entry;
  }

  function loadImageDimensions(entry: Entry): void {
    const probe = new Image();
    probe.onload = () => { entry.width = probe.naturalWidth; entry.height = probe.naturalHeight; };
    probe.src = entry.objectUrl;
  }

  // Permanently removes an image + its .txt from disk — unlike Disable
  // (moveEntry(), tags-edit.ts), which relocates the files into Disabled/
  // and keeps the entry around (fully restorable), this deletes the actual
  // files and drops the entry from memory entirely. No undo is offered (see
  // edit-log.ts's STAT_TYPE_LABEL — deliberately not in TAG_TYPES/MOVE_TYPES,
  // so the log row renders with no Undo/Restore action) since there's
  // nothing left on disk to restore from; a confirm modal at every call site
  // is the only safety net. Works on both active and Disabled entries —
  // resolves the correct source directory either way, same as moveEntry()
  // does. Just the file/state cleanup, no toast/log/refresh — those differ
  // between the single-image path (deleteEntryPermanently) and the mass one
  // (deleteEntriesPermanently), which collapses them into ONE toast/log
  // entry instead of one per image.
  async function deleteEntryFilesAndState(entry: Entry): Promise<boolean> {
    if (!dirHandle) return false;
    const sourceDir = entry.original ? originalDirHandle : (entry.disabled ? disabledDirHandle : dirHandle);
    if (!sourceDir) return false;
    try { await sourceDir.removeEntry(entry.imgName!); } catch(e){}
    try { await sourceDir.removeEntry(entry.txtName!); } catch(e){}

    const idx = entries.indexOf(entry);
    if (idx !== -1) entries.splice(idx, 1);
    entryByBase.delete(entry.base);
    delete entryMeta[entry.base];
    masterSelectedImages.delete(entry.base);
    try { URL.revokeObjectURL(entry.objectUrl); } catch(e){}
    return true;
  }

  // Undo/redo applier for isolate-image log items (built in the card modal's
  // crop flow, view.ts). Undo deletes the isolated file via the same
  // files+state cleanup permanent-delete uses; redo re-creates it byte-
  // identical from the session-kept payload. Anything missing (bytes from an
  // earlier session, a manually deleted file) restores nothing and counts
  // zero, so callers show the honest toast.
  // "Mark reviewed" for tag-index.ts's left-panel flagged-for-review list:
  // strips `tag` from every entry's meta.flaggedTags and records ONE undoable
  // change. Returns how many images listed it (0 = nothing to do). The caller
  // (tag-index) re-renders the list itself.
  function markTagReviewed(tag: string): number {
    const affected: EditLogAffected[] = [];
    for (const e of entries){
      const flagged = e.meta?.flaggedTags;
      if (!flagged || !flagged.includes(tag)) continue;
      const prevFlagged = flagged.slice();
      const newFlagged = flagged.filter((t) => t !== tag);
      if (!e.meta) e.meta = {};
      e.meta.flaggedTags = newFlagged;
      entryMeta[e.base] = e.meta;
      affected.push({ base: e.base, prevFlagged, newFlagged });
    }
    if (affected.length === 0) return 0;
    saveEntryMeta();
    recordChange('unflag-review', `Marked "${tag}" reviewed — unflagged from ${affected.length} image(s).`, affected);
    return affected.length;
  }

  // Undo/redo applier for review-flag clearing. Swaps meta.flaggedTags, NOT
  // entry.tags — deliberately not routed through tags-edit's applyTagDirection
  // (that would overwrite the caption tags with the flagged list).
  function applyFlaggedReviewDirection(affected: EditLogAffected[], direction: 'undo' | 'redo'): number {
    let count = 0;
    for (const a of affected){
      const e = entryByBase.get(a.base);
      const target = direction === 'undo' ? a.prevFlagged : a.newFlagged;
      if (!e || !target) continue;
      if (!e.meta) e.meta = {};
      e.meta.flaggedTags = target.slice();
      entryMeta[e.base] = e.meta;
      count++;
    }
    if (count) saveEntryMeta();
    return count;
  }

  async function applyIsolateDirection(affected: EditLogAffected[], direction: 'undo' | 'redo'): Promise<number> {
    let count = 0;
    for (const a of affected){
      const st = typeof a.logId === 'number' ? getIsolateState(a.logId) : undefined;
      if (!st || !dirHandle) continue;
      if (direction === 'undo'){
        const e = entryByBase.get(a.base);
        if (!e) continue;
        if (await deleteEntryFilesAndState(e)) count++;
      } else {
        try {
          const imgHandle = await dirHandle.getFileHandle(st.imgName, { create: true });
          await writeBytes(imgHandle, st.bytes);
          const txtHandle = await dirHandle.getFileHandle(a.base + '.txt', { create: true });
          await writeBytes(txtHandle, st.tags.map((t) => t.replace(/ /g, '_')).join(','));
          const existing = entryByBase.get(a.base);
          if (existing){
            try { URL.revokeObjectURL(existing.objectUrl); } catch(e){}
            existing.objectUrl = URL.createObjectURL(new Blob([st.bytes as BlobPart], { type: st.mime }));
            existing.tags = st.tags.slice();
            existing.width = st.width;
            existing.height = st.height;
            markDirty(existing);
          } else {
            const created = await buildEntry(a.base, imgHandle, st.imgName, txtHandle, true, st.tags.slice(), false);
            markDirty(created);
          }
          count++;
        } catch {
          continue;
        }
      }
    }
    if (count) renderCurrentView();
    return count;
  }

  // Single-image path — view.ts's 3-dot menu "Delete permanently".
  async function deleteEntryPermanently(entry: Entry): Promise<void> {
    if (!dirHandle) return;
    try {
      const ok = await deleteEntryFilesAndState(entry);
      if (!ok) return;
      saveEntryMeta();
      toast(`Permanently deleted "${entry.imgName}".`, 3200);
      pushLogEntry({
        type: 'delete',
        summary: `Permanently deleted ${entry.imgName}`,
        affected: [{ base: entry.base }]
      });
      resetSingleIndex();
      refreshAllUI();
      checkAchievements();
    } catch(err){
      toast('Could not delete that file — check folder permissions.', 3600);
    }
  }

  // Mass path — Tag Overseer's "Delete selected permanently". Locked entries
  // are skipped, same as every other mass tool (Master Tag Control's own
  // apply/remove/rename all do this too) — a lock is specifically meant to
  // protect an image from being swept up by something aimed at a broader
  // selection, and that protection matters MOST for an irreversible action
  // like this one. Returns how many were actually deleted, so the caller can
  // report skipped-vs-deleted counts accurately.
  async function deleteEntriesPermanently(entriesList: Entry[]): Promise<number> {
    if (!dirHandle) return 0;
    let deleted = 0;
    for (const entry of entriesList){
      if (entry.meta && entry.meta.locked) continue;
      try {
        const ok = await deleteEntryFilesAndState(entry);
        if (ok) deleted++;
      } catch(err){ /* keep going — report the partial count either way */ }
    }
    if (deleted === 0) return 0;
    saveEntryMeta();
    pushLogEntry({
      type: 'delete',
      summary: `Permanently deleted ${deleted} image(s)`,
      affected: entriesList.filter(e => !(e.meta && e.meta.locked)).map(e => ({ base: e.base }))
    });
    resetSingleIndex();
    refreshAllUI();
    checkAchievements();
    return deleted;
  }

  // Bulk sibling of the single-image "Disable" toggle (view.ts's moveEntry
  // call) — same underlying move, just with moveEntry's own per-call
  // toast/log/refresh silenced (silent:true) so N selected images don't
  // produce N toasts, then one summary toast/log entry/refresh here instead,
  // same shape as deleteEntriesPermanently just above. Locked images are
  // skipped, same convention as every other mass tool.
  async function disableEntriesForSelection(entriesList: Entry[]): Promise<number> {
    if (!dirHandle) return 0;
    let moved = 0;
    const affected: Entry[] = [];
    for (const entry of entriesList){
      if (entry.meta && entry.meta.locked) continue;
      if (entry.disabled) continue;
      try {
        await moveEntry(entry, true, { silent: true });
        moved++;
        affected.push(entry);
      } catch(err){ /* keep going — report the partial count either way */ }
    }
    if (moved === 0) return 0;
    saveEntryMeta();
    pushLogEntry({
      type: 'disable',
      summary: `Disabled ${moved} image(s)`,
      affected: affected.map(e => ({ base: e.base }))
    });
    resetSingleIndex();
    refreshAllUI();
    checkAchievements();
    return moved;
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
      await writeBytes(handle, JSON.stringify(entryMeta, null, 2));
    } catch(err){}
  }

  async function loadFolder(){
    if (!dirHandle) return;
    exitSequentialDetail();
    toast('Scanning folder…');
    entries = [];
    entryByBase.clear();
    disabledDirHandle = null;
    originalDirHandle = null;
    btnAddFavorite.disabled = !dirHandle;
    btnUnloadDataset.disabled = !dirHandle;
    btnReloadDataset.disabled = !dirHandle;
    resetUndoRedo();
    masterSelectedImages.clear();
    resetStickyCompare();
    resetReviewFlagged();
    updateUndoRedoButtons();
    [themeCustomPanel, favoritesPanel, logPanel, achievementsPanel, shopPanel, tagDetailsPanel].forEach(hidePanel);

    await scanDirInto(dirHandle, false);

    try {
      disabledDirHandle = await dirHandle.getDirectoryHandle('Disabled', { create: false });
      await scanDirInto(disabledDirHandle, true);
    } catch(e){
      disabledDirHandle = null;
      originalDirHandle = null;
    }

    try {
      // original_images/ holds the pre-bucketing originals the "Bucket Images"
      // dock moved out of the root. Scanned as `original: true` AND disabled,
      // so every existing mass/auto tool already skips them — the Originals
      // view shows them, and the Disabled view excludes them.
      originalDirHandle = await dirHandle.getDirectoryHandle('original_images', { create: false });
      await scanDirInto(originalDirHandle, true, true);
    } catch(e){ originalDirHandle = null; }

    try {
      // One-time migration: a dataset last touched by an older version of
      // this app may still have a leftover "Unsaved Approved" staging folder
      // (SynthDat Accept used to write there instead of straight into the
      // root). Fold anything still in it back into the active set as normal
      // entries — the .txt alongside each image already has real tags, not
      // just in-memory ones, so nothing is lost — rather than leaving those
      // images permanently unreachable now that the dedicated view is gone.
      const legacyUnsavedApprovedDir = await dirHandle.getDirectoryHandle('Unsaved Approved', { create: false });
      await scanDirInto(legacyUnsavedApprovedDir, false);
    } catch(e){}

    await loadEntryMeta();
    // dateAdded is "the first time this app ever saw this file in this
    // dataset" — real and accurate for a genuinely new file (no persisted
    // meta entry yet at all), and the best honest answer for a dataset that
    // predates this field entirely (an old _dts_meta.json with no dateAdded
    // recorded) — there's no reliable "date added to THIS dataset" signal on
    // disk to recover for that case, so it gets stamped now and stays fixed
    // from here on, rather than silently drifting to "now" on every reload.
    let metaNeedsDateAddedSave = false;
    for (const e of entries){
      e.meta = entryMeta[e.base] || { reviewColor: null, flaggedTags: [], note: '', noteAlwaysVisible: false, locked: false, mergeImmune: false, antivoid: false };
      if (!e.meta.dateAdded){
        e.meta.dateAdded = Date.now();
        entryMeta[e.base] = e.meta;
        metaNeedsDateAddedSave = true;
      }
    }
    if (metaNeedsDateAddedSave) saveEntryMeta();

    dropHint.style.display = entries.length ? 'none' : 'flex';
    dropHintWrap.style.display = entries.length ? 'none' : 'block';
    galleryToolbar.style.display = entries.length ? 'flex' : 'none';

    galleryFilter = { base: 'all', terms: [], mode: filterModeLock.checked ? galleryFilter.mode : 'AND', excludes: '', disabledView: false, originalsView: false, exactMatch: filterExactToggle.checked };
    filterInput.value = '';
    excludeBadge.style.display = 'none';
    [filterAllBtn, filterUntaggedBtn, filterDirtyBtn].forEach(b=>b.classList.remove('active'));
    filterAllBtn.classList.add('active');
    filterModeDropdownCtrl?.refreshLabel();

    resetSingleIndex();
    switchView(viewMode === 'compact' ? 'compact' : 'grid');

    await loadEditLogForFolder();
    await loadFolderStats();
    // After the edit log — its own first-run bootstrap (canonical-tags.ts)
    // reconstructs standing rules from past merge/void log entries when this
    // dataset has no _dts_canonical_tags.json of its own yet.
    await loadCanonicalRulesForFolder();
    resetRulesDirty();
    await loadSynthDatSettingsForFolder();

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
    const unsavedUnload = unsavedChangesDescription();
    if (unsavedUnload){
      const ok = await showConfirmModal(`You have ${unsavedUnload}. Unload the dataset anyway without saving?`, { okLabel: 'Unload anyway', danger: true });
      if (!ok) return;
    }
    trackStat('dataset_unloads');
    checkAchievements();
    exitSequentialDetail();
    dirHandle = null;
    disabledDirHandle = null;
    originalDirHandle = null;
    entries = [];
    entryByBase.clear();
    btnAddFavorite.disabled = true;
    btnUnloadDataset.disabled = true;
    btnReloadDataset.disabled = true;
    resetUndoRedo();
    masterSelectedImages.clear();
    resetStickyCompare();
    resetReviewFlagged();
    updateUndoRedoButtons();
    [themeCustomPanel, favoritesPanel, logPanel, achievementsPanel, shopPanel, tagDetailsPanel].forEach(hidePanel);

    dropHint.style.display = 'flex';
    dropHintWrap.style.display = 'block';
    galleryToolbar.style.display = 'none';

    galleryFilter = { base: 'all', terms: [], mode: filterModeLock.checked ? galleryFilter.mode : 'AND', excludes: '', disabledView: false, originalsView: false, exactMatch: filterExactToggle.checked };
    filterInput.value = '';
    excludeBadge.style.display = 'none';
    [filterAllBtn, filterUntaggedBtn, filterDirtyBtn].forEach(b=>b.classList.remove('active'));
    filterAllBtn.classList.add('active');
    filterModeDropdownCtrl?.refreshLabel();

    resetSingleIndex();
    switchView('grid');

    await loadEditLogForFolder();
    await loadFolderStats();
    await loadCanonicalRulesForFolder();
    resetRulesDirty();
    await loadSynthDatSettingsForFolder();

    renderAll();
    toast('Dataset unloaded.');
  }
  btnUnloadDataset.addEventListener('click', unloadDataset);

  // Re-scans the current dataset folder from disk — the exact same
  // loadFolder() a fresh File > Open would run, just without re-picking the
  // folder. Picks up files changed/added outside the app (e.g. hand-edited
  // .txt files, images dropped in via Explorer) and any leftover Unsaved
  // Approved images from a previous session. Same unsaved-changes guard as
  // Unload/Quit/Restart, since anything not yet saved would otherwise be
  // silently overwritten by the rescan's fresh-from-disk tag values.
  async function reloadDataset(){
    if (!dirHandle) return;
    const unsavedReload = unsavedChangesDescription();
    if (unsavedReload){
      const ok = await showConfirmModal(`You have ${unsavedReload}. Reload the dataset from disk anyway, discarding them?`, { okLabel: 'Reload anyway', danger: true });
      if (!ok) return;
    }
    // Same reasoning as Open's own flyout-close above: nothing left for the
    // File flyout to do once the reload is committed to, so don't leave it
    // sitting open over the screen for the whole rescan (mobile especially).
    fileCatFlyout.style.display = 'none';
    fileCatFlyout.classList.remove('menu-in');
    await loadFolder();
  }
  btnReloadDataset.addEventListener('click', reloadDataset);

  // Tag index/frequency list + gallery filtering moved to ./tag-index.ts

  filterModeDropdownCtrl = buildPersistentDropdown(filterModeDropdown,
    [
      { value: 'AND', label: 'AND', title: 'Show images containing ALL of the searched tags' },
      { value: 'OR', label: 'OR', title: 'Show images containing ANY of the searched tags' },
      { value: 'XOR', label: 'XOR', title: 'Show images containing EXACTLY ONE of the searched tags' },
      { value: 'NOT', label: 'NOT', title: 'Show images containing NONE of the searched tags' }
    ],
    () => galleryFilter.mode,
    (val) => { galleryFilter.mode = val as 'AND' | 'OR' | 'XOR' | 'NOT'; renderCurrentView(); }
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
      { value: 'dateadded', label: 'Date added' },
      { value: 'resolution', label: 'Resolution' },
      { value: 'tagcount', label: 'Tag count' },
      { value: 'dirty', label: 'Unsaved first' }
    ],
    () => gallerySortMode,
    (val) => onGallerySortChange(val as GallerySortMode)
  );

  // leftSortDropdown wiring moved to ./tag-index.ts (initTagIndex)

  buildPersistentDropdown(cardTagSortDropdown,
    [
      { value: 'default', label: 'Default order' },
      { value: 'alphabetical', label: 'Alphabetical' },
      { value: 'frequency', label: 'By frequency' }
    ],
    () => cardTagSortMode,
    (val) => { cardTagSortMode = val as CardTagSortMode; renderCurrentView(); }
  );

  // Forces the gallery's column count instead of letting it auto-fit —
  // otherwise columns naturally drop as font-size zoom or open side panels
  // shrink the space actually available, which is the opposite of what
  // someone bumping the font size for readability usually wants.
  const GALLERY_COLUMNS_KEY = 'dts-gallery-columns';
  let galleryColumns = 'auto';
  function applyGalleryColumnOverride(){
    const root = document.documentElement;
    if (galleryColumns === 'auto'){
      root.style.removeProperty('--gallery-cols');
      root.style.removeProperty('--gallery-col-count');
      root.style.removeProperty('--gallery-col-width');
    } else {
      root.style.setProperty('--gallery-cols', `repeat(${galleryColumns}, 1fr)`);
      root.style.setProperty('--gallery-col-count', String(galleryColumns));
      root.style.setProperty('--gallery-col-width', '1px');
    }
  }
  try {
    const savedGalleryColumns = getString(GALLERY_COLUMNS_KEY);
    if (savedGalleryColumns) galleryColumns = savedGalleryColumns;
  } catch(e){}
  applyGalleryColumnOverride();
  buildPersistentDropdown(galleryColumnsDropdown,
    [
      { value: 'auto', label: 'Auto (default)' },
      { value: '2', label: '2 columns' },
      { value: '3', label: '3 columns' },
      { value: '4', label: '4 columns' },
      { value: '5', label: '5 columns' },
      { value: '6', label: '6 columns' },
      { value: '7', label: '7 columns' },
      { value: '8', label: '8 columns' }
    ],
    () => galleryColumns,
    (val) => {
      galleryColumns = val;
      setString(GALLERY_COLUMNS_KEY, val);
      applyGalleryColumnOverride();
      if (val !== 'auto'){
        folderStats.gallery_columns_forced = true;
        saveFolderStats();
        checkAchievements();
      }
    }
  );

  // In gallery-right layout, #right sits directly next to #left (the
  // boundary that's actually draggable/collapsible is its RIGHT edge, next
  // to #gallery) instead of at the screen's own right edge (where that
  // boundary is #right's LEFT edge) — every place below that cares about
  // "which side is #right's outer/draggable edge" checks this once.
  function rightPanelIsFlipped(){
    return shellEl.classList.contains('layout-gallery-right');
  }

  // Declared up here (not down by repositionRightResizeHandle() below, where
  // they're actually used) because applyPanelLayout()/initPanelLayout() —
  // right below — already call that function via repositionRightResizeHandleSoon()
  // before the code further down runs; `const` isn't hoisted with its value
  // the way a `function` declaration is, so referencing these from that
  // early call before reaching their own declaration line was a genuine
  // "Cannot access before initialization" crash, not just a style nit.
  const RIGHT_RESIZE_HANDLE_WIDTH = 8; // must match #rightPanelResizeHandle's CSS width
  // Leaves a strip of dead space between the handle and whichever edge of
  // #right it's inset from — flush against that edge still left it right up
  // against #gallery's own always-on scrollbar with no breathing room.
  const RIGHT_RESIZE_HANDLE_GAP = 6;

  let panelLayout = 'standard';
  function applyPanelLayout(val: string): void {
    shellEl.classList.remove('layout-gallery-left', 'layout-gallery-right');
    if (val === 'gallery-left') shellEl.classList.add('layout-gallery-left');
    else if (val === 'gallery-right') shellEl.classList.add('layout-gallery-right');
    panelLayout = val;
    setString('dts-panel-layout', val);
    applyRightPanelCollapsedArrow();
    repositionRightResizeHandleSoon();
  }
  (function initPanelLayout(){
    let saved = 'standard';
    saved = getString('dts-panel-layout', 'standard');
    applyPanelLayout(saved);
  })();

  // Right panel collapse: tucks #right away to a thin strip (see styles.css's
  // comment on #shell.right-panel-collapsed for why the track width has to
  // vary per layout mode instead of just hiding #right).
  function applyRightPanelCollapsedArrow(){
    const collapsed = rightAside.classList.contains('right-panel-collapsed');
    // The arrow always points toward #right's own draggable/outer edge —
    // which, per rightPanelIsFlipped() above, is the LEFT edge normally but
    // the RIGHT edge in gallery-right layout, so both the resting and
    // collapsed glyphs flip together with it.
    const flipped = rightPanelIsFlipped();
    btnRightPanelCollapse.textContent = collapsed ? (flipped ? '›' : '‹') : (flipped ? '‹' : '›');
    btnRightPanelCollapse.title = collapsed ? 'Show this panel' : 'Hide this panel';
  }
  function applyRightPanelCollapsed(collapsed: boolean): void {
    shellEl.classList.toggle('right-panel-collapsed', collapsed);
    rightAside.classList.toggle('right-panel-collapsed', collapsed);
    applyRightPanelCollapsedArrow();
    repositionRightResizeHandleSoon();
    setBool('dts-right-panel-collapsed', collapsed);
  }
  (function initRightPanelCollapsed(){
    let saved = false;
    saved = getBool('dts-right-panel-collapsed');
    applyRightPanelCollapsed(saved);
  })();
  btnRightPanelCollapse.addEventListener('click', () => {
    applyRightPanelCollapsed(!rightAside.classList.contains('right-panel-collapsed'));
  });
  const layoutDropdownCtrl = buildPersistentDropdown(layoutDropdown,
    [
      { value: 'standard', label: 'Standard (left · gallery · right)' },
      { value: 'gallery-left', label: 'Gallery left, panels right' },
      { value: 'gallery-right', label: 'Gallery right, panels left' }
    ],
    () => panelLayout,
    applyPanelLayout
  );

  // ---------------- Right panel width (drag-resizable) ----------------

  const RIGHT_PANEL_MIN_WIDTH = 260;
  const RIGHT_PANEL_WIDTH_KEY = 'dts-right-panel-width';
  let rightPanelWidth = 380;
  function rightPanelMaxWidth(){
    // Leaves room for #left's fixed 270px plus a usable sliver of gallery,
    // rather than letting the drag swallow the whole window.
    return Math.max(RIGHT_PANEL_MIN_WIDTH, window.innerWidth - 270 - 200);
  }
  function applyRightPanelWidth(px: number): void {
    rightPanelWidth = Math.min(rightPanelMaxWidth(), Math.max(RIGHT_PANEL_MIN_WIDTH, px));
    shellEl.style.setProperty('--right-w', rightPanelWidth + 'px');
  }
  // Positioned `absolute` against #shell (see styles.css) — top/bottom are
  // free via CSS, only `left` needs JS since the draggable edge's offset
  // within #shell depends on the live grid track widths. Placed fully
  // INSIDE #right rather than centered on the boundary with #gallery.
  function repositionRightResizeHandle(){
    const rect = rightAside.getBoundingClientRect();
    // #right (and #shell) go `display:none`-equivalent (via #galleryTab's
    // own `display:contents`/`none` toggle in switchTab()) while a non-
    // Gallery tab like SynthDat Overseer is active — a hidden element's
    // rect is all zeros, not "wherever it last was." A resize/zoom event
    // landing while a different tab is active (native zoom is an async IPC
    // round-trip, see the font-slider pitfall notes — its own resulting
    // 'resize' event can arrive after the user's already switched tabs)
    // used to compute `left` from that zeroed rect and leave the handle
    // stuck at the window's left edge even after switching back to
    // Gallery, since nothing re-measured it there. Skip the update entirely
    // on a degenerate rect instead of applying a wrong one — leaves
    // whatever the last GOOD position was until something legitimately
    // re-triggers this while #right is actually visible again.
    if (rect.width === 0 && rect.height === 0) return;
    const shellRect = shellEl.getBoundingClientRect();
    const xViewport = rightPanelIsFlipped()
      ? (rect.right - RIGHT_RESIZE_HANDLE_WIDTH - RIGHT_RESIZE_HANDLE_GAP)
      : (rect.left + RIGHT_RESIZE_HANDLE_GAP);
    rightPanelResizeHandle.style.left = Math.round(xViewport - shellRect.left) + 'px';
  }
  // #shell animates grid-template-columns (var(--panel-dur)) on layout/
  // collapse changes, so the handle's target position keeps moving for the
  // duration of that transition — reposition once now (so it's not
  // wildly wrong for the whole animation) and once more after it settles.
  function repositionRightResizeHandleSoon(){
    repositionRightResizeHandle();
    setTimeout(repositionRightResizeHandle, 200);
  }
  (function initRightPanelWidth(){
    let saved = NaN;
    saved = getInt(RIGHT_PANEL_WIDTH_KEY, NaN);
    applyRightPanelWidth(isNaN(saved) ? rightPanelWidth : saved);
    repositionRightResizeHandle();
  })();
  window.addEventListener('resize', repositionRightResizeHandle);
  rightPanelResizeHandle.addEventListener('mousedown', (ev) => {
    if (rightAside.classList.contains('right-panel-collapsed')) return;
    ev.preventDefault();
    const startX = ev.clientX;
    const startWidth = rightPanelWidth;
    const flipped = rightPanelIsFlipped();
    shellEl.style.transition = 'none';
    rightPanelResizeHandle.classList.add('resizing');
    function onMove(mv: MouseEvent): void {
      const dx = mv.clientX - startX;
      applyRightPanelWidth(startWidth + (flipped ? dx : -dx));
      repositionRightResizeHandle();
    }
    function onUp(){
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      shellEl.style.transition = '';
      rightPanelResizeHandle.classList.remove('resizing');
      setInt(RIGHT_PANEL_WIDTH_KEY, rightPanelWidth);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });

  // renderCurrentView/switchView + view-mode button/drag wiring moved to ./view.ts

  function onGallerySortChange(mode: GallerySortMode): void {
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
  initInfoButtons();
  initHelp();
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

  // Per-instance selection/Clear/mirror-to-gallery + the Unify/Void rows
  // they each render are all self-contained in ./tag-pruner.ts now.
  // refreshRightPanels() (./view.ts) is just an alias for renderTagPruners().

  // Undo/redo moved to ./tags-edit.ts; Unify/Void apply moved there too,
  // now as parameterized applyUnifyToTags()/applyVoidToTags() functions
  // tag-pruner.ts's per-instance rows call directly.

  // Global tag tools (Find / Replace all / Find & replace) previously lived here,
  // superseded by the Master Tags tab which covers the same ground plus more.

  // Master Tag Control moved to ./master-tag-control.ts

  // Undo/redo buttons, disable/restore (moveEntry), and save-to-disk moved to ./tags-edit.ts

  // ---------------- Refresh orchestration ----------------

  function refreshAllUI(){
    refreshStats();
    renderCurrentView();
    renderTagPruners();
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
      const unsavedClose = unsavedChangesDescription();
      if (unsavedClose){
        const ok = await showConfirmModal(`You have ${unsavedClose}. Quit anyway without saving?`, { okLabel: 'Quit anyway', danger: true });
        if (!ok) return;
      }
      window.electronAPI.confirmClose();
    });
  }

  // Moves the tag frequency/keyword-family sort controls + list out of the
  // Left sheet and INTO the Tag Pruner dock (its own tool-section, already
  // inside #normalRightTools) — direct feedback: an independent 4th dock
  // for this turned out to be unreachable by swipe whenever an earlier
  // dock (e.g. Retroactive Merge/Void) was expanded, a nested-scroll-axis
  // conflict not worth actually fixing when folding into Tag Pruner (the
  // FIRST dock, always reachable without scrolling past anything) avoids
  // it outright. Runs before initDockSystem() purely for consistency with
  // other mobile-only DOM setup here, though timing doesn't matter for
  // this move specifically (unlike the old dock version, nothing here
  // needs to be dockified). No-op on desktop: these elements simply stay
  // inside #left's own TAGS field-block, unmoved, exactly as always.
  if (isTouchDevice){
    const tagPrunerDock = document.querySelector('.tool-section[data-dock-id="tagPruner"]');
    const controlsArea = tagPrunerDock && tagPrunerDock.querySelector('.dock-controls-area');
    const scrollBody = tagPrunerDock && tagPrunerDock.querySelector('.dock-scroll-body');
    // tagFamilyListArea carries the sort row (dropdown/direction/reset) AND
    // the list together — both need to be inside the SAME element passed
    // to openDockListModal() above, otherwise the sort controls are stuck
    // sitting outside the modal where the list they control isn't visible.
    if (controlsArea) controlsArea.appendChild(btnOpenTagFrequencyList);
    if (scrollBody) scrollBody.appendChild(tagFamilyListArea);
  }

  renderTagPruners();
  updateLogButton();
  loadWallet();
  updateThemeSelectLocks();
  switchTab('gallery');
  initDockSystem();


  // Mobile-only "Add images to dataset" — desktop has the OS file manager for
  // this, so it needs no in-app importer; mobile has no casual
  // file-manager-to-folder workflow. Tapping the button opens the system's
  // own image picker (gallery/camera, no extra permission needed) and writes
  // each chosen file into the open dataset folder through the same DirHandle
  // surface everything else uses (backed by the SAF native plugin on mobile —
  // see mobile-shim.js), with an empty `.txt` sidecar so imports land as
  // untagged. The final reloadDataset() reuses the guarded rescan exactly
  // (unsaved-changes confirm included). Built in JS, not markup, so neither
  // shell's index.html changes — and touch-gated, so desktop is untouched.
  async function uniqueDatasetFileName(handle: DirHandle, name: string): Promise<string> {
    const dot = name.lastIndexOf('.');
    const stem = dot < 0 ? name : name.slice(0, dot);
    const ext = dot < 0 ? '' : name.slice(dot);
    let candidate = name;
    for (let n = 2; n < 10000; n++) {
      try {
        await handle.getFileHandle(candidate);
      } catch {
        return candidate; // missing → free to use
      }
      candidate = `${stem} (${n})${ext}`;
    }
    return `${stem} ${Date.now()}${ext}`;
  }

  async function importImagesToDataset(files: FileList | null): Promise<void> {
    if (!files || !files.length || !dirHandle) return;
    const activeHandle = dirHandle;
    let added = 0, skipped = 0;
    for (const file of Array.from(files)) {
      if (!isImageFile(file.name)) { skipped++; continue; }
      try {
        const imgName = await uniqueDatasetFileName(activeHandle, file.name);
        const imgHandle = await activeHandle.getFileHandle(imgName, { create: true });
        await writeBytes(imgHandle, file);
        try {
          const txtHandle = await activeHandle.getFileHandle(imgName.replace(/\.[^.]+$/, '') + '.txt', { create: true });
          await writeBytes(txtHandle, '');
        } catch {
          /* image saved; the empty sidecar is best-effort */
        }
        added++;
      } catch {
        skipped++;
      }
    }
    if (!added) { toast(skipped ? 'No images could be added.' : 'Nothing selected.', 2600); return; }
    toast(`Added ${added} image${added === 1 ? '' : 's'}${skipped ? ` (${skipped} skipped)` : ''}.`, 2600);
    await reloadDataset();
  }

  if (isTouchDevice && !document.getElementById('btnAddImages')){
    const btnAddImages = document.createElement('button');
    btnAddImages.id = 'btnAddImages';
    btnAddImages.textContent = 'Add images…';
    btnAddImages.title = 'Import images from this device into the open dataset folder';
    btnAddImages.addEventListener('click', () => {
      if (!dirHandle) { toast('Open a dataset folder first.', 2600); return; }
      fileCatFlyout.style.display = 'none';
      fileCatFlyout.classList.remove('menu-in');
      const picker = document.createElement('input');
      picker.type = 'file';
      picker.accept = 'image/*';
      picker.multiple = true;
      picker.addEventListener('change', () => { void importImagesToDataset(picker.files); });
      picker.click();
    });
    fileCatFlyout.appendChild(btnAddImages);
  }

  // -------- Idle GPU suspend ("draw GPU only when needed") --------
  // With hardware acceleration on, the compositor only keeps ticking when
  // SOMETHING is animating — any running infinite CSS animation keeps every
  // layer being redrawn at 60fps forever, which is where the RTX idle usage
  // was going. So: once no input (pointer/key/wheel/scroll) has happened for
  // a few seconds, pause every CSS animation app-wide; ambient theme anims
  // (the only continuous things at rest) freeze mid-keyframe and resume on
  // the next input, which no human eye can distinguish from the keyframe
  // loop. Transitions aren't touched (they only run during events anyway).
  const IDLE_SUSPEND_MS = 3500;
  let idleSuspendTimer: ReturnType<typeof setTimeout> | null = null;
  function armIdleSuspend(){
    if (idleSuspendTimer) clearTimeout(idleSuspendTimer);
    document.documentElement.classList.remove('gpu-idle');
    idleSuspendTimer = setTimeout(() => {
      idleSuspendTimer = null;
      document.documentElement.classList.add('gpu-idle');
    }, IDLE_SUSPEND_MS);
  }
  for (const ev of ['pointermove', 'pointerdown', 'keydown', 'wheel', 'scroll'] as const){
    document.addEventListener(ev, armIdleSuspend, { passive: true });
  }
    // A hidden/minimized window would stay composited as long as its
    // animations run — the same "duplicate GPU work with nobody watching"
    // problem the idle suspend exists for. Suspend immediately whenever the
    // window isn't visible; the idle timer re-arms on the next interaction.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden){
      document.documentElement.classList.add('gpu-idle');
      if (idleSuspendTimer) { clearTimeout(idleSuspendTimer); idleSuspendTimer = null; }
    } else {
      armIdleSuspend();
    }
  });
  armIdleSuspend();

})();
