(function(){

  // ---------------- State ----------------
  let dirHandle = null;
  let disabledDirHandle = null;
  let entries = [];            // [{base, imgHandle, txtHandle, txtExisted, objectUrl, tags:[], dirty:bool, disabled:bool}]
  let entryByBase = new Map();
  let selectedTags = new Set();
  let galleryFilter = { base: 'all', terms: [], mode: 'AND', excludes: '', disabledView: false };
  let undoStack = [];          // [{type, summary, affected:[{base,prevTags,newTags}]}]
  let redoStack = [];
  let viewMode = 'grid';       // 'grid' | 'single'
  let singleIndex = 0;
  let ctxMenuEl = null;
  let editLog = [];            // [{id, ts, type, summary, affected:[{base, prevTags, newTags}]}]
  let logIdCounter = 1;
  let folderStats = {};        // per-folder achievement stats, persisted in _dts_achievements.json
  let folderUnlocked = [];     // achievement ids unlocked in the current folder
  let wallet = 0;               // global Edibits balance
  let ownedThemes = ['studio','cyberpunk','oriental','subway']; // global, always includes free themes
  let achievementPopupsEnabled = true;
  let commonLanguages = ['English'];
  let statsChartMode = 'pie';
  let gallerySortMode = 'filename';
  let gallerySortDir = 'asc';
  let leftSortMode = 'family';
  let dayNightOn = false;
  let leftSortDir = 'desc';
  let familyOrder = [];         // manual drag order of keyword families, persists across sort-mode switches
  let isolatedFlagActive = false;
  let cardTagSortMode = 'default'; // 'default' | 'alphabetical' | 'frequency'
  let masterTagModeActive = false;
  let masterSelectedImages = new Set();
  let stickyCompareImages = [];
  let dockOrder = ['tagPruner', 'unifyVoid'];
  let dockCollapsed = {};
  let dockHeights = {};
  let tagPruners = [{ id: 1, filter: '' }];
  let tagPrunerIdCounter = 2;
  let compactModeOn = false;
  let entryMeta = {};          // base -> {reviewColor, flaggedTags:[], note:'', noteAlwaysVisible:false}
  let wikiData = null;         // lazy-loaded tag -> definition
  let allTagsMap = null;       // lazy-loaded tag -> [category, count]
  let activeLangMenuBase = null;
  let tagAutocompleteEnabled = false;
  let autocompleteEl = null;
  let quickMergeGroups = [];   // [{ key, canon, variants:[tag,...] }]
  let quickMergeSelection = new Map(); // key -> { selected, canon }
  let customPowerTools = [];   // [{ id, label, fieldIds:[...], buttonIds:[...], mode }]
  let powerToolPickerActive = false;

  const IMAGE_EXT = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif'];

  // ---------------- DOM refs ----------------
  const $ = (id) => document.getElementById(id);
  const btnOpen = $('btnOpen');
  const btnSave = $('btnSave');
  const btnUndo = $('btnUndo');
  const btnRedo = $('btnRedo');
  const dirtyCountEl = $('dirtyCount');
  const galleryToolbar = $('galleryToolbar');
  const galleryGrid = $('galleryGrid');
  const compactGrid = $('compactGrid');
  const compactCompareArea = $('compactCompareArea');
  const compareCount = $('compareCount');
  const compactCompareTable = $('compactCompareTable');
  const btnClearCompare = $('btnClearCompare');
  const singleViewEl = $('singleView');
  const imageCardModal = $('imageCardModal');
  const modalCardInner = $('modalCardInner');
  const dropHint = $('dropHint');
  const dropHintWrap = $('dropHintWrap');
  const filterInput = $('filterInput');
  const filterAllBtn = $('filterAll');
  const filterUntaggedBtn = $('filterUntagged');
  const filterDirtyBtn = $('filterDirty');
  const excludeBadge = $('excludeBadge');
  const excludeBadgeText = $('excludeBadgeText');
  const excludeBadgeClear = $('excludeBadgeClear');
  const tagFrequencyList = $('tagFrequencyList');
  const leftSortDropdown = $('leftSortDropdown');
  const leftSortDirBtn = $('leftSortDirBtn');
  const btnResetFamilyOrder = $('btnResetFamilyOrder');
  const btnClearFilter = $('btnClearFilter');
  const filterModeDropdown = $('filterModeDropdown');
  const btnFlagIsolated = $('btnFlagIsolated');
  const tagPrunerList = $('tagPrunerList');
  const btnAddTagPruner = $('btnAddTagPruner');
  const selectionSummary = $('selectionSummary');
  const unifiedTagInput = $('unifiedTagInput');
  const btnApplyUnify = $('btnApplyUnify');
  const btnClearSelection = $('btnClearSelection');
  const btnVoidSelected = $('btnVoidSelected');
  const includeDisabledToggle = $('includeDisabledToggle');
  const allTagsDatalist = $('allTagsDatalist');
  const toastEl = $('toast');
  const themeSelect = $('themeSelect');
  const btnThemeCustomize = $('btnThemeCustomize');
  const themeCustomPanel = $('themeCustomPanel');
  const themeVarRows = $('themeVarRows');
  const themeResetBtn = $('themeResetBtn');
  const themeApplyBtn = $('themeApplyBtn');
  const themeCloseBtn = $('themeCloseBtn');
  const btnQuit = $('btnQuit');
  const btnLeftDrawerToggle = $('btnLeftDrawerToggle');
  const btnRightDrawerToggle = $('btnRightDrawerToggle');
  const drawerBackdrop = $('drawerBackdrop');
  const leftAside = $('left');
  const rightAside = $('right');
  const actionsScrollLeft = $('actionsScrollLeft');
  const actionsScrollRight = $('actionsScrollRight');
  const topbarActions = $('topbarActions');
  const btnResetEdibits = $('btnResetEdibits');
  const btnResetAchievements = $('btnResetAchievements');
  const fileCatBtn = $('fileCatBtn');
  const fileCatFlyout = $('fileCatFlyout');
  const personalizationCatBtn = $('personalizationCatBtn');
  const personalizationCatFlyout = $('personalizationCatFlyout');
  const flyoutOutsideCloseToggle = $('flyoutOutsideCloseToggle');
  const panelsOutsideCloseToggle = $('panelsOutsideCloseToggle');
  const btnSettings = $('btnSettings');
  const btnFavorites = $('btnFavorites');
  const favoritesPanel = $('favoritesPanel');
  const favoritesList = $('favoritesList');
  const btnAddFavorite = $('btnAddFavorite');
  const favoritesCloseBtn = $('favoritesCloseBtn');
  const btnLog = $('btnLog');
  const logPanel = $('logPanel');
  const logPanelTitle = $('logPanelTitle');
  const logList = $('logList');
  const btnExportLog = $('btnExportLog');
  const btnClearLog = $('btnClearLog');
  const logCloseBtn = $('logCloseBtn');
  const appVersionEl = $('appVersion');
  const tabDataset = $('tabDataset');
  const tabMasterTags = $('tabMasterTags');
  const tabStats = $('tabStats');
  const datasetTab = $('datasetTab');
  const statsTab = $('statsTab');
  const btnStatsBack = $('btnStatsBack');
  const btnMasterBack = $('btnMasterBack');
  const normalRightTools = $('normalRightTools');
  const btnResetDockLayout = $('btnResetDockLayout');
  const btnApplyUpdateBundle = $('btnApplyUpdateBundle');
  const layoutDropdown = $('layoutDropdown');
  const shellEl = $('shell');
  const btnResetZoom = $('btnResetZoom');
  const customFontInput = $('customFontInput');
  const btnApplyCustomFont = $('btnApplyCustomFont');
  const btnClearCustomFont = $('btnClearCustomFont');
  const powerHighlightToggle = $('powerHighlightToggle');
  const powerFillToggle = $('powerFillToggle');
  const btnQuickMergeScan = $('btnQuickMergeScan');
  const quickMergeList = $('quickMergeList');
  const btnQuickMergeApply = $('btnQuickMergeApply');
  const tagAutocompleteToggle = $('tagAutocompleteToggle');
  const btnGithubPackage = $('btnGithubPackage');
  const btnStartPowerToolPicker = $('btnStartPowerToolPicker');
  const powerToolList = $('powerToolList');
  const btnResetCustomPowerTools = $('btnResetCustomPowerTools');

  // Native Electron/Chromium page zoom (same mechanism as Ctrl+/Ctrl-/Ctrl+0
  // in any Chromium browser) — operates at the compositor level, so vw/vh/%
  // all stay consistent automatically. This replaced an earlier CSS `zoom`
  // approach that reliably caused overflow no matter how it was compensated,
  // since CSS zoom scales an element's own box independently of its parent.
  function applyAppZoom(factor){
    if (window.electronAPI && window.electronAPI.setZoomFactor){
      window.electronAPI.setZoomFactor(factor);
    }
  }

  function resetAppZoom(){
    applyAppZoom(1);
    if (typeof fontSizeSlider !== 'undefined' && fontSizeSlider){
      fontSizeSlider.value = '14';
    }
    if (typeof fontSizeVal !== 'undefined' && fontSizeVal){
      fontSizeVal.textContent = '14px';
    }
    try { localStorage.setItem('dts-font-size', '14'); } catch(e){}
  }
  btnResetZoom.addEventListener('click', (ev) => { ev.stopPropagation(); resetAppZoom(); });
  // Safety net: works even if zoom has pushed every button off-screen or made the app unusable.
  document.addEventListener('keydown', (ev) => {
    if ((ev.ctrlKey || ev.metaKey) && (ev.key === '0' || ev.key === ')')) resetAppZoom();
  });
  const masterTagPanel = $('masterTagPanel');
  const masterSelectionSummary = $('masterSelectionSummary');
  const masterMiniGrid = $('masterMiniGrid');
  const btnMasterSelectAll = $('btnMasterSelectAll');
  const btnMasterClearSelection = $('btnMasterClearSelection');
  const masterApplyTagInput = $('masterApplyTagInput');
  const btnMasterApplyToSelected = $('btnMasterApplyToSelected');
  const masterRemoveTagInput = $('masterRemoveTagInput');
  const btnMasterRemoveFromSelected = $('btnMasterRemoveFromSelected');
  const condSourceTag = $('condSourceTag');
  const condAddTag = $('condAddTag');
  const btnCondApply = $('btnCondApply');
  const massApplyInput = $('massApplyInput');
  const btnMassApply = $('btnMassApply');
  const massRemoveInput = $('massRemoveInput');
  const btnMassRemove = $('btnMassRemove');
  const masterRenameFrom = $('masterRenameFrom');
  const masterRenameTo = $('masterRenameTo');
  const btnMasterRename = $('btnMasterRename');
  const masterFRFind = $('masterFRFind');
  const masterFRReplace = $('masterFRReplace');
  const btnMasterFR = $('btnMasterFR');
  const statsViewPie = $('statsViewPie');
  const statsViewBar = $('statsViewBar');
  const statsChartWrap = $('statsChartWrap');
  const statsLegend = $('statsLegend');
  const statsTotals = $('statsTotals');
  const btnAchievements = $('btnAchievements');
  const walletDisplay = $('walletDisplay');
  const achievementsPanel = $('achievementsPanel');
  const achWallet = $('achWallet');
  const achPopupsToggle = $('achPopupsToggle');
  const achList = $('achList');
  const achCloseBtn = $('achCloseBtn');
  const btnShop = $('btnShop');
  const shopPanel = $('shopPanel');
  const shopWallet = $('shopWallet');
  const shopList = $('shopList');
  const btnFreeEdibits = $('btnFreeEdibits');
  const shopCloseBtn = $('shopCloseBtn');
  const tagDetailsPanel = $('tagDetailsPanel');
  const tagDetailsTitle = $('tagDetailsTitle');
  const tagDetailsBody = $('tagDetailsBody');
  const tagDetailsCloseBtn = $('tagDetailsCloseBtn');
  const langMenuPanel = $('langMenuPanel');
  const achievementPopupHost = $('achievementPopupHost');
  const btnNightMode = $('btnNightMode');
  const viewGridBtn = $('viewGridBtn');
  const viewCompactBtn = $('viewCompactBtn');
  const viewSingleBtn = $('viewSingleBtn');
  const viewDisabledBtn = $('viewDisabledBtn');
  const gallerySortDropdown = $('gallerySortDropdown');
  const gallerySortDirBtn = $('gallerySortDirBtn');
  const singleNav = $('singleNav');
  const singlePrevBtn = $('singlePrevBtn');
  const singleNextBtn = $('singleNextBtn');
  const singlePos = $('singlePos');

  function toast(msg, ms=2600){
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(()=> toastEl.classList.remove('show'), ms);
  }

  // ---------------- Floating panel show/hide animation ----------------

  function showPanel(el){
    el.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('panel-visible')));
  }
  function hidePanel(el){
    if (el.style.display === 'none') return;
    el.classList.remove('panel-visible');
    setTimeout(() => { el.style.display = 'none'; }, 160);
  }

  // ---------------- Themed confirm modal (replaces window.confirm) ----------------

  function showConfirmModal(message, opts = {}){
    return new Promise((resolve) => {
      const backdrop = document.createElement('div');
      backdrop.className = 'confirm-backdrop';
      const box = document.createElement('div');
      box.className = 'confirm-box';
      const msg = document.createElement('div');
      msg.className = 'confirm-message';
      msg.textContent = message;
      box.appendChild(msg);
      const btnRow = document.createElement('div');
      btnRow.className = 'confirm-btn-row';
      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = opts.cancelLabel || 'Cancel';
      const okBtn = document.createElement('button');
      okBtn.textContent = opts.okLabel || 'Confirm';
      okBtn.className = opts.danger ? 'danger-ghost' : 'primary';
      function close(result){
        backdrop.classList.remove('modal-visible');
        setTimeout(() => backdrop.remove(), 160);
        resolve(result);
      }
      cancelBtn.addEventListener('click', () => close(false));
      okBtn.addEventListener('click', () => close(true));
      backdrop.addEventListener('click', (ev) => { if (ev.target === backdrop) close(false); });
      document.addEventListener('keydown', function escHandler(ev){
        if (ev.key === 'Escape'){ close(false); document.removeEventListener('keydown', escHandler); }
      });
      btnRow.appendChild(cancelBtn);
      btnRow.appendChild(okBtn);
      box.appendChild(btnRow);
      backdrop.appendChild(box);
      document.body.appendChild(backdrop);
      requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('modal-visible')));
    });
  }

  // ---------------- Dockable right-sidebar panels: reorder / collapse / resize ----------------

  function saveDockPrefs(){
    try {
      localStorage.setItem('dts-dock-order', JSON.stringify(dockOrder));
      localStorage.setItem('dts-dock-collapsed', JSON.stringify(dockCollapsed));
      localStorage.setItem('dts-dock-heights', JSON.stringify(dockHeights));
    } catch(e){}
  }

  function loadDockPrefs(){
    try {
      const o = JSON.parse(localStorage.getItem('dts-dock-order') || 'null');
      if (Array.isArray(o) && o.length) dockOrder = o;
      dockCollapsed = JSON.parse(localStorage.getItem('dts-dock-collapsed') || '{}') || {};
      dockHeights = JSON.parse(localStorage.getItem('dts-dock-heights') || '{}') || {};
    } catch(e){}
  }

  function applyDockOrder(){
    const sections = Array.from(normalRightTools.querySelectorAll('.tool-section[data-dock-id]'));
    for (const id of dockOrder){
      const sec = sections.find(s => s.dataset.dockId === id);
      if (sec) normalRightTools.appendChild(sec);
    }
    // append any dock ids not yet known (future-proofing)
    for (const sec of sections){
      if (!dockOrder.includes(sec.dataset.dockId)) normalRightTools.appendChild(sec);
    }
  }

  function applyDockCollapse(sec, id){
    const scrollBody = sec.querySelector('.dock-scroll-body');
    if (scrollBody){
      scrollBody.style.display = dockCollapsed[id] ? 'none' : '';
    } else {
      const bodyEls = Array.from(sec.children).filter(el =>
        !el.classList.contains('sec-head') && !el.classList.contains('dock-resize-handle')
      );
      bodyEls.forEach(el => { el.style.display = dockCollapsed[id] ? 'none' : ''; });
    }
    const resizeHandle = sec.querySelector('.dock-resize-handle');
    if (resizeHandle) resizeHandle.style.display = dockCollapsed[id] ? 'none' : '';
    const resizeTarget = scrollBody || sec;
    if (dockCollapsed[id]){
      resizeTarget.style.maxHeight = '';
      resizeTarget.style.overflowY = '';
    } else if (dockHeights[id]){
      resizeTarget.style.maxHeight = dockHeights[id];
      resizeTarget.style.overflowY = 'auto';
    }
  }

  function reorderDock(draggedId, targetId, after){
    dockOrder = dockOrder.filter(x => x !== draggedId);
    let idx = dockOrder.indexOf(targetId);
    if (idx === -1) idx = dockOrder.length;
    if (after) idx += 1;
    dockOrder.splice(idx, 0, draggedId);
    saveDockPrefs();
    applyDockOrder();
  }

  function setupDockSection(sec){
    const id = sec.dataset.dockId;
    if (!id || sec.dataset.dockified) return;
    sec.dataset.dockified = '1';
    const resizable = sec.dataset.resizable === 'true';
    const scrollBody = sec.querySelector('.dock-scroll-body');
    const resizeTarget = scrollBody || sec;

    const head = sec.querySelector('.sec-head');
    if (head){
      head.style.display = 'flex';
      head.style.alignItems = 'center';
      const controls = document.createElement('span');
      controls.className = 'dock-controls';

      const dragHandle = document.createElement('span');
      dragHandle.className = 'dock-drag-handle';
      dragHandle.textContent = '☰';
      dragHandle.title = 'Drag to reorder this panel';
      dragHandle.draggable = true;
      dragHandle.addEventListener('dragstart', (ev) => {
        ev.dataTransfer.setData('text/plain', id);
        ev.dataTransfer.effectAllowed = 'move';
        sec.classList.add('dock-dragging');
      });
      dragHandle.addEventListener('dragend', () => sec.classList.remove('dock-dragging'));

      const collapseBtn = document.createElement('button');
      collapseBtn.className = 'dock-collapse-btn';
      collapseBtn.title = 'Collapse / expand this panel';
      collapseBtn.textContent = dockCollapsed[id] ? '▶' : '▼';
      collapseBtn.addEventListener('click', () => {
        dockCollapsed[id] = !dockCollapsed[id];
        saveDockPrefs();
        applyDockCollapse(sec, id);
        collapseBtn.textContent = dockCollapsed[id] ? '▶' : '▼';
      });

      controls.appendChild(dragHandle);
      controls.appendChild(collapseBtn);
      head.appendChild(controls);
    }

    sec.addEventListener('dragover', (ev) => { ev.preventDefault(); sec.classList.add('dock-drop-target'); });
    sec.addEventListener('dragleave', () => sec.classList.remove('dock-drop-target'));
    sec.addEventListener('drop', (ev) => {
      ev.preventDefault();
      sec.classList.remove('dock-drop-target');
      const draggedId = ev.dataTransfer.getData('text/plain');
      if (!draggedId || draggedId === id) return;
      const rect = sec.getBoundingClientRect();
      const dropAfter = (ev.clientY - rect.top) > rect.height / 2;
      reorderDock(draggedId, id, dropAfter);
    });

    applyDockCollapse(sec, id);

    if (resizable){
      const resizeHandle = document.createElement('div');
      resizeHandle.className = 'dock-resize-handle';
      resizeHandle.title = 'Drag to resize this panel';
      sec.appendChild(resizeHandle);
      resizeHandle.addEventListener('mousedown', (ev) => {
        if (dockCollapsed[id]) return;
        ev.preventDefault();
        const startY = ev.clientY;
        const startHeight = resizeTarget.getBoundingClientRect().height;
        function onMove(mv){
          const newHeight = Math.max(90, startHeight + (mv.clientY - startY));
          resizeTarget.style.maxHeight = newHeight + 'px';
          resizeTarget.style.overflowY = 'auto';

          // Auto-scroll the right sidebar so the cursor never drifts off-screen mid-drag
          const rightRect = rightAside.getBoundingClientRect();
          const edgeMargin = 50;
          if (mv.clientY < rightRect.top + edgeMargin){
            rightAside.scrollTop -= Math.max(4, (rightRect.top + edgeMargin - mv.clientY));
          } else if (mv.clientY > rightRect.bottom - edgeMargin){
            rightAside.scrollTop += Math.max(4, (mv.clientY - (rightRect.bottom - edgeMargin)));
          }
        }
        function onUp(){
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          dockHeights[id] = resizeTarget.style.maxHeight;
          saveDockPrefs();
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    }
  }

  function initDockSystem(){
    loadDockPrefs();
    applyDockOrder();
    normalRightTools.querySelectorAll('.tool-section[data-dock-id]').forEach(setupDockSection);
  }

  function resetDockLayout(){
    dockOrder = ['tagPruner', 'unifyVoid'];
    dockCollapsed = {};
    dockHeights = {};
    saveDockPrefs();
    applyDockOrder();
    normalRightTools.querySelectorAll('.tool-section[data-dock-id]').forEach(sec => {
      const resizeTarget = sec.querySelector('.dock-scroll-body') || sec;
      resizeTarget.style.maxHeight = '';
      resizeTarget.style.overflowY = '';
      applyDockCollapse(sec, sec.dataset.dockId);
      const collapseBtn = sec.querySelector('.dock-collapse-btn');
      if (collapseBtn) collapseBtn.textContent = '▼';
    });
    toast('Panel layout reset to default.');
  }

  btnResetDockLayout.addEventListener('click', resetDockLayout);

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

  btnApplyUpdateBundle.addEventListener('click', async () => {
    if (!window.electronAPI || !window.electronAPI.applyUpdateBundle){
      toast('Update bundles can only be applied from the desktop app build.', 3600);
      return;
    }
    const result = await window.electronAPI.applyUpdateBundle();
    if (!result || !result.ok){
      toast((result && result.message) || 'Update failed.', 4000);
      return;
    }
    toast(result.message, 2200);
    const relaunch = await showConfirmModal('Update applied. Relaunch now to use the new version?', { okLabel: 'Relaunch now' });
    if (relaunch && window.electronAPI.relaunchApp) window.electronAPI.relaunchApp();
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

  function attachPinchZoom(el, onZoomDelta){
    let startDist = null;
    function dist(touches){
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx*dx + dy*dy);
    }
    el.addEventListener('touchstart', (ev) => {
      if (ev.touches.length === 2) startDist = dist(ev.touches);
    }, { passive: true });
    el.addEventListener('touchmove', (ev) => {
      if (ev.touches.length === 2 && startDist){
        ev.preventDefault();
        const newDist = dist(ev.touches);
        const delta = (newDist - startDist) * 0.5;
        if (Math.abs(delta) > 2){
          onZoomDelta(delta);
          startDist = newDist;
        }
      }
    }, { passive: false });
    el.addEventListener('touchend', (ev) => {
      if (ev.touches.length < 2) startDist = null;
    }, { passive: true });
  }

  function attachLongPress(el, callback, ms = 500){
    let timer = null;
    let startX = 0, startY = 0;
    const moveTolerance = 12;
    el.addEventListener('touchstart', (ev) => {
      if (ev.touches.length !== 1) return;
      startX = ev.touches[0].clientX;
      startY = ev.touches[0].clientY;
      timer = setTimeout(() => {
        timer = null;
        callback({ clientX: startX, clientY: startY, preventDefault(){}, stopPropagation(){} });
      }, ms);
    }, { passive: true });
    el.addEventListener('touchmove', (ev) => {
      if (!timer || !ev.touches[0]) return;
      const dx = ev.touches[0].clientX - startX;
      const dy = ev.touches[0].clientY - startY;
      if (Math.sqrt(dx*dx + dy*dy) > moveTolerance){ clearTimeout(timer); timer = null; }
    }, { passive: true });
    el.addEventListener('touchend', () => { if (timer){ clearTimeout(timer); timer = null; } }, { passive: true });
    el.addEventListener('touchcancel', () => { if (timer){ clearTimeout(timer); timer = null; } }, { passive: true });
  }

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

  // ---------------- Persistent dropdown (stays open until toggled again) ----------------

  function buildPersistentDropdown(container, options, getValue, onSelect){
    container.innerHTML = '';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'pdrop-btn';
    function currentLabel(){
      const found = options.find(o => o.value === getValue());
      return found ? found.label : getValue();
    }
    btn.textContent = currentLabel() + ' ▾';
    let menuEl = null;
    function closeMenu(){
      if (menuEl){ menuEl.remove(); menuEl = null; }
    }
    function openMenu(){
      menuEl = document.createElement('div');
      menuEl.className = 'pdrop-menu';
      for (const opt of options){
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'pdrop-item' + (opt.value === getValue() ? ' active' : '');
        item.textContent = opt.label;
        if (opt.title) item.title = opt.title;
        item.addEventListener('click', (ev) => {
          ev.stopPropagation();
          onSelect(opt.value);
          btn.textContent = currentLabel() + ' ▾';
          menuEl.querySelectorAll('.pdrop-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');
          // deliberately stays open — only the toggle button closes it
        });
        menuEl.appendChild(item);
      }
      container.appendChild(menuEl);
    }
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (menuEl) closeMenu(); else openMenu();
    });
    container.style.position = 'relative';
    container.appendChild(btn);
    return { refreshLabel: () => { btn.textContent = currentLabel() + ' ▾'; } };
  }

  // ---------------- Theme (built-in + native custom colors) ----------------

  const THEME_VARS = [
    ['--bg-base','Background'],
    ['--bg-panel','Panel'],
    ['--bg-elevated','Elevated surface'],
    ['--bg-elevated-2','Elevated surface 2'],
    ['--border-soft','Border (soft)'],
    ['--border-strong','Border (strong)'],
    ['--text-primary','Primary text'],
    ['--text-muted','Muted text'],
    ['--text-faint','Faint text'],
    ['--accent-auto','Accent — auto/orange'],
    ['--accent-auto-dim','Accent — auto dim'],
    ['--accent-manual','Accent — manual/blue'],
    ['--accent-manual-dim','Accent — manual dim'],
    ['--accent-danger','Danger accent'],
    ['--accent-success','Success accent']
  ];

  const STUDIO_DEFAULTS = {
    '--bg-base':'#16151c', '--bg-panel':'#1c1a24', '--bg-elevated':'#252230', '--bg-elevated-2':'#2d2a38',
    '--border-soft':'#373242', '--border-strong':'#4a4459', '--text-primary':'#ece8f0', '--text-muted':'#9791a6',
    '--text-faint':'#6b6578', '--accent-auto':'#e8a33d', '--accent-auto-dim':'#4a3c22', '--accent-manual':'#6fb8d1',
    '--accent-manual-dim':'#213842', '--accent-danger':'#e2637a', '--accent-success':'#7fbf8f'
  };

  function toHex6(colorStr){
    const ctx = toHex6._ctx || (toHex6._ctx = document.createElement('canvas').getContext('2d'));
    ctx.fillStyle = '#000000';
    ctx.fillStyle = colorStr;
    const norm = ctx.fillStyle;
    if (norm[0] === '#') return norm.length >= 7 ? norm.slice(0,7) : norm;
    const m = norm.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (m){
      const toH = n => Number(n).toString(16).padStart(2,'0');
      return '#' + toH(m[1]) + toH(m[2]) + toH(m[3]);
    }
    return '#000000';
  }

  function getCurrentVarHex(key){
    const raw = getComputedStyle(document.documentElement).getPropertyValue(key).trim();
    return toHex6(raw || '#000000');
  }

  function clearCustomOverrides(){
    for (const [key] of THEME_VARS) document.documentElement.style.removeProperty(key);
  }

  function applyTheme(theme){
    if (dayNightOn){
      dayNightOn = false;
      document.documentElement.classList.remove('night-mode');
      try { localStorage.setItem('dts-night-mode', '0'); } catch(e){}
    }
    if (theme === 'custom'){
      document.documentElement.setAttribute('data-theme', 'custom');
      let saved = null;
      try { saved = JSON.parse(localStorage.getItem('dts-custom-theme') || 'null'); } catch(e){}
      if (saved){
        for (const [key] of THEME_VARS){
          if (saved[key]) document.documentElement.style.setProperty(key, saved[key]);
        }
      } else {
        // first time picking "Custom" with nothing saved — open the editor to set it up
        setTimeout(openThemeCustomPanel, 0);
      }
    } else {
      clearCustomOverrides();
      document.documentElement.setAttribute('data-theme', theme);
    }
    try { localStorage.setItem('dts-theme', theme); } catch(e){}
  }

  themeSelect.addEventListener('change', () => {
    const chosen = themeSelect.value;
    const premium = PREMIUM_THEMES.find(t => t.id === chosen);
    if (premium && !ownedThemes.includes(chosen)){
      toast(`"${premium.name}" is locked — buy it in the Shop first.`);
      themeSelect.value = (localStorage.getItem('dts-theme')) || 'studio';
      return;
    }
    applyTheme(chosen);
  });

  (function initTheme(){
    let saved = 'studio';
    try { saved = localStorage.getItem('dts-theme') || 'studio'; } catch(e){}
    themeSelect.value = saved;
    applyTheme(saved);
  })();

  function openThemeCustomPanel(){
    hidePanel(favoritesPanel);
    hidePanel(logPanel);
    hidePanel(achievementsPanel);
    hidePanel(shopPanel);
    hidePanel(tagDetailsPanel);
    themeVarRows.innerHTML = '';
    for (const [key, label] of THEME_VARS){
      const row = document.createElement('div');
      row.className = 'theme-var-row';
      const lbl = document.createElement('span');
      lbl.className = 'lbl';
      lbl.textContent = label;
      const input = document.createElement('input');
      input.type = 'color';
      input.value = getCurrentVarHex(key);
      input.dataset.varKey = key;
      input.addEventListener('input', () => {
        document.documentElement.style.setProperty(key, input.value);
      });
      row.appendChild(lbl);
      row.appendChild(input);
      themeVarRows.appendChild(row);
    }
    showPanel(themeCustomPanel);
  }

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
    try { localStorage.setItem('dts-theme', 'custom'); } catch(e){}
    toast('Custom theme saved.');
    folderStats.theme_customized = true;
    saveFolderStats();
    checkAchievements();
    hidePanel(themeCustomPanel);
  });

  // ---------------- Quit ----------------

  btnQuit.addEventListener('click', async () => {
    const dirtyCount = entries.filter(e => e.dirty).length;
    if (dirtyCount > 0){
      const ok = await showConfirmModal(`You have ${dirtyCount} unsaved caption change(s). Quit anyway without saving?`, { okLabel: 'Quit anyway', danger: true });
      if (!ok) return;
    }
    window.close();
  });

  // ---------------- Version / tabs / night mode ----------------

  const APP_VERSION = '2.0.0';
  appVersionEl.textContent = 'v' + APP_VERSION;

  function switchTab(tab){
    tabDataset.classList.toggle('active', tab === 'dataset');
    tabMasterTags.classList.toggle('active', tab === 'master');
    tabStats.classList.toggle('active', tab === 'stats');
    datasetTab.style.display = (tab === 'stats') ? 'none' : 'contents';
    statsTab.style.display = (tab === 'stats') ? 'block' : 'none';
    masterTagModeActive = (tab === 'master');
    normalRightTools.style.display = masterTagModeActive ? 'none' : 'block';
    masterTagPanel.style.display = masterTagModeActive ? 'block' : 'none';
    if (tab === 'stats') renderStatsTab();
    renderCurrentView();
    renderMasterSelectionSummary();
  }
  tabDataset.addEventListener('click', () => switchTab('dataset'));
  tabMasterTags.addEventListener('click', () => switchTab('master'));
  tabStats.addEventListener('click', () => switchTab('stats'));
  btnStatsBack.addEventListener('click', () => switchTab('dataset'));
  btnMasterBack.addEventListener('click', () => switchTab('dataset'));

  statsViewPie.addEventListener('click', () => { statsChartMode = 'pie'; statsViewPie.classList.add('active'); statsViewBar.classList.remove('active'); renderStatsTab(); });
  statsViewBar.addEventListener('click', () => { statsChartMode = 'bar'; statsViewBar.classList.add('active'); statsViewPie.classList.remove('active'); renderStatsTab(); });

  // ---------------- Day/Night mode: algorithmic HSL lightness-inversion ----------------
  // Instead of hand-authored per-theme overrides, this inverts EVERY theme
  // variable's lightness (preserving hue/saturation) — so a dark theme gets a
  // genuine light "day" variant, and a light theme gets a genuine dark "night"
  // variant, automatically, for any current or future built-in theme. The
  // Custom theme is excluded since its palette is already fully user-controlled.

  function hexToHsl(hex){
    const r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    let h, s, l = (max+min)/2;
    if (max === min){ h = 0; s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d/(2-max-min) : d/(max+min);
      switch(max){
        case r: h = (g-b)/d + (g<b?6:0); break;
        case g: h = (b-r)/d + 2; break;
        default: h = (r-g)/d + 4;
      }
      h /= 6;
    }
    return [h*360, s*100, l*100];
  }

  function hslToHex(h, s, l){
    h/=360; s/=100; l/=100;
    let r, g, b;
    if (s === 0){ r = g = b = l; }
    else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q-p)*6*t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q-p)*(2/3-t)*6;
        return p;
      };
      const q = l < 0.5 ? l*(1+s) : l+s-l*s;
      const p = 2*l - q;
      r = hue2rgb(p, q, h+1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h-1/3);
    }
    const toHex = x => Math.round(x*255).toString(16).padStart(2,'0');
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }

  function invertLightness(hex){
    const [h, s, l] = hexToHsl(hex);
    return hslToHex(h, s, 100 - l);
  }

  function toggleDayNightMode(){
    if (themeSelect.value === 'custom'){
      toast('Day/Night inversion isn\'t available for the Custom theme — its colors are already fully in your control.');
      return;
    }
    dayNightOn = !dayNightOn;
    if (dayNightOn){
      for (const [key] of THEME_VARS){
        const dayHex = getCurrentVarHex(key);
        document.documentElement.style.setProperty(key, invertLightness(dayHex));
      }
      document.documentElement.classList.add('night-mode');
      folderStats.night_mode_used = true;
      saveFolderStats();
      checkAchievements();
    } else {
      clearCustomOverrides();
      document.documentElement.classList.remove('night-mode');
    }
    try { localStorage.setItem('dts-night-mode', dayNightOn ? '1' : '0'); } catch(e){}
  }

  btnNightMode.addEventListener('click', toggleDayNightMode);
  (function initNightMode(){
    let on = false;
    try { on = localStorage.getItem('dts-night-mode') === '1'; } catch(e){}
    if (on && themeSelect.value !== 'custom'){
      dayNightOn = false; // toggleDayNightMode flips this, so pre-set to false to land on true
      toggleDayNightMode();
    }
  })();

  // ---------------- Topbar scroll arrows ----------------

  actionsScrollLeft.addEventListener('click', () => topbarActions.scrollBy({ left: -220, behavior: 'smooth' }));
  actionsScrollRight.addEventListener('click', () => topbarActions.scrollBy({ left: 220, behavior: 'smooth' }));

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

  function setupHeaderCategory(btn, flyout){
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const isOpen = flyout.style.display === 'flex';
      document.querySelectorAll('.header-cat-flyout').forEach(f => { f.style.display = 'none'; });
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
    });
  }
  setupHeaderCategory(fileCatBtn, fileCatFlyout);
  setupHeaderCategory(personalizationCatBtn, personalizationCatFlyout);
  document.addEventListener('click', (ev) => {
    if (!flyoutClosesOnOutsideClick) return;
    document.querySelectorAll('.header-cat').forEach(wrap => {
      const flyout = wrap.querySelector('.header-cat-flyout');
      if (flyout && flyout.style.display === 'flex' && !wrap.contains(ev.target)){
        flyout.style.display = 'none';
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

  function getOutsideClosablePanels(){
    return [favoritesPanel, themeCustomPanel, logPanel, achievementsPanel, shopPanel, tagDetailsPanel, settingsPanel];
  }

  document.addEventListener('click', (ev) => {
    if (!panelsCloseOnOutsideClick) return;
    getOutsideClosablePanels().forEach(panel => {
      if (panel.style.display === 'flex' && !panel.contains(ev.target)){
        hidePanel(panel);
      }
    });
  });

  // ---------------- Reset Edibits / Achievements (debug) ----------------

  btnResetEdibits.addEventListener('click', async () => {
    const ok = await showConfirmModal('Reset your Edibits balance to 0? This does not affect owned themes or achievements.', { danger: true });
    if (!ok) return;
    wallet = 0;
    saveWallet();
    toast('Edibits reset to 0.');
  });

  btnResetAchievements.addEventListener('click', async () => {
    const ok = await showConfirmModal('Reset achievement progress for this folder? This resets BOTH unlocked achievements and their underlying progress counters, so nothing re-unlocks itself on next load. Edibits already earned stay in your wallet.', { danger: true });
    if (!ok) return;
    folderUnlocked = [];
    folderStats = {};
    saveFolderStats();
    if (achievementsPanel.style.display === 'flex') renderAchievementsPanel();
    toast('Achievement progress reset for this folder.');
  });

  // ---------------- Settings panel ----------------

  const fontSizeSlider = $('fontSizeSlider');
  const fontSizeVal = $('fontSizeVal');
  const tooltipsToggle = $('tooltipsToggle');
  const tagCountBadgeToggle = $('tagCountBadgeToggle');
  const cardTagSortDropdown = $('cardTagSortDropdown');
  const dynamicCardsToggle = $('dynamicCardsToggle');
  const btnDiscreteToggle = $('btnDiscreteToggle');
  const btnDiscreteOff = $('btnDiscreteOff');
  const btnPurgeAllTags = $('btnPurgeAllTags');
  const settingsPanel = $('settingsPanel');
  const settingsCloseBtn = $('settingsCloseBtn');
  const tooltipBubble = $('tooltipBubble');
  let tooltipsEnabled = true;
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
    tooltipTimer = setTimeout(() => {
      if (tooltipTarget !== el) return;
      el.dataset.tipStash = tipText;
      el.removeAttribute('title');
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
    }, 1000);
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

  const SETTINGS_SECTIONS_KEY = 'dts-settings-sections-expanded';
  function saveSettingsSectionState(state){
    try { localStorage.setItem(SETTINGS_SECTIONS_KEY, JSON.stringify(state)); } catch(e){}
  }
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

  function applyCustomFont(fontName){
    if (fontName){
      const currentSans = getComputedStyle(document.documentElement).getPropertyValue('--sans').trim() || 'sans-serif';
      const currentMono = getComputedStyle(document.documentElement).getPropertyValue('--mono').trim() || 'monospace';
      document.documentElement.style.setProperty('--sans', `'${fontName}', ${currentSans}`);
      document.documentElement.style.setProperty('--mono', `'${fontName}', ${currentMono}`);
    } else {
      document.documentElement.style.removeProperty('--sans');
      document.documentElement.style.removeProperty('--mono');
    }
  }
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

  // ---------------- Power-tool marking (which fields/buttons get highlighted) ----------------
  // The highlight itself is a single `.power-tool` class (styled in CSS, gated
  // by the two toggles above). What differs per-tool is WHICH elements carry
  // that class: built-ins are fixed pairs of {field(s), button}, and users can
  // mark their own on top. Tag Pruner's search inputs are dynamic (new ones
  // can be added), so those get the class directly at creation time instead
  // of going through this id-based system.
  const BUILTIN_POWER_TOOLS = [
    { id:'builtin-unify', field:['unifiedTagInput'], button:'btnApplyUnify', mode:'both', label:'Unify selected tags' },
    { id:'builtin-void', button:'btnVoidSelected', mode:'button', label:'Void selected tags' },
    { id:'builtin-qm-scan', button:'btnQuickMergeScan', mode:'button', label:'Quick Merge: scan' },
    { id:'builtin-qm-apply', button:'btnQuickMergeApply', mode:'button', label:'Quick Merge: apply' },
    { id:'builtin-master-apply', field:['masterApplyTagInput'], button:'btnMasterApplyToSelected', mode:'both', label:'Master Tags: apply to selected' },
    { id:'builtin-master-remove', field:['masterRemoveTagInput'], button:'btnMasterRemoveFromSelected', mode:'both', label:'Master Tags: remove from selected' },
    { id:'builtin-cond-apply', field:['condSourceTag','condAddTag'], button:'btnCondApply', mode:'both', label:'Master Tags: conditional apply' },
    { id:'builtin-mass-apply', field:['massApplyInput'], button:'btnMassApply', mode:'both', label:'Master Tags: mass apply' },
    { id:'builtin-mass-remove', field:['massRemoveInput'], button:'btnMassRemove', mode:'both', label:'Master Tags: mass remove' },
    { id:'builtin-purge', button:'btnPurgeAllTags', mode:'button', label:'Purge all tags' },
    { id:'builtin-tag-pruner', infoOnly:true, label:'Tag Pruner search filters (always marked, dynamic)' }
  ];

  // Known-good candidates that aren't power tools by default but are
  // reasonable to flip on — shown in the Settings list as unchecked
  // checkboxes the user can toggle directly, no picker needed.
  const OPTIONAL_POWER_TOOL_CANDIDATES = [
    { id:'candidate-master-rename', field:['masterRenameFrom','masterRenameTo'], button:'btnMasterRename', mode:'both', label:'Master Tags: rename everywhere' },
    { id:'candidate-master-fr', field:['masterFRFind','masterFRReplace'], button:'btnMasterFR', mode:'both', label:'Master Tags: find & replace substring' },
    { id:'candidate-flag-isolated', button:'btnFlagIsolated', mode:'button', label:'Flag isolated tags' }
  ];

  function powerToolIdsFor(entry){
    const fieldIds = entry.field ? (Array.isArray(entry.field) ? entry.field : [entry.field]) : [];
    const buttonIds = entry.button ? [entry.button] : [];
    return { fieldIds, buttonIds };
  }

  function applyPowerToolMarks(){
    document.querySelectorAll('.power-tool').forEach(el => {
      if (!el.classList.contains('pt-dynamic')) el.classList.remove('power-tool');
    });
    for (const entry of BUILTIN_POWER_TOOLS.concat(customPowerTools)){
      if (entry.infoOnly) continue;
      const { fieldIds, buttonIds } = powerToolIdsFor(entry);
      if (entry.mode === 'field' || entry.mode === 'both'){
        for (const fid of fieldIds){ const el = $(fid); if (el) el.classList.add('power-tool'); }
      }
      if (entry.mode === 'button' || entry.mode === 'both'){
        for (const bid of buttonIds){ const el = $(bid); if (el) el.classList.add('power-tool'); }
      }
    }
  }

  function saveCustomPowerTools(){
    try { localStorage.setItem('dts-custom-power-tools', JSON.stringify(customPowerTools)); } catch(e){}
  }
  function loadCustomPowerTools(){
    try {
      const saved = JSON.parse(localStorage.getItem('dts-custom-power-tools') || 'null');
      if (Array.isArray(saved)) customPowerTools = saved;
    } catch(e){}
  }

  // Finds whether an element id already belongs to a power tool, and where —
  // used both by the picker (to toggle off on a second click) and to decide
  // what a settings-list checkbox should do.
  function findPowerToolMatch(elId){
    for (const entry of BUILTIN_POWER_TOOLS){
      if (entry.infoOnly) continue;
      const { fieldIds, buttonIds } = powerToolIdsFor(entry);
      if (fieldIds.includes(elId) || buttonIds.includes(elId)) return { scope:'builtin', entry };
    }
    for (const entry of customPowerTools){
      const { fieldIds, buttonIds } = powerToolIdsFor(entry);
      if (fieldIds.includes(elId) || buttonIds.includes(elId)) return { scope:'custom', entry };
    }
    return null;
  }

  function setCustomPowerToolActive(entrySpec, active){
    if (active){
      if (!customPowerTools.some(c => c.id === entrySpec.id)){
        customPowerTools.push({ id: entrySpec.id, field: entrySpec.field, button: entrySpec.button, mode: entrySpec.mode, label: entrySpec.label });
      }
    } else {
      customPowerTools = customPowerTools.filter(c => c.id !== entrySpec.id);
    }
    saveCustomPowerTools();
    applyPowerToolMarks();
    renderPowerToolList();
  }

  function buildPowerToolRow(entry, opts){
    const row = document.createElement('div');
    row.className = 'pt-list-row';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = opts.checked;
    cb.disabled = opts.locked || !!entry.infoOnly;
    row.appendChild(cb);
    const label = document.createElement('span');
    label.className = 'pt-list-label';
    label.textContent = entry.label + (opts.locked ? ' (built-in, always on)' : '');
    row.appendChild(label);
    const tagEl = document.createElement('span');
    tagEl.className = 'pt-list-tag';
    tagEl.textContent = entry.infoOnly ? '' : (entry.mode === 'both' ? 'field + button' : entry.mode);
    row.appendChild(tagEl);
    if (!opts.locked && !entry.infoOnly){
      cb.addEventListener('change', () => {
        setCustomPowerToolActive(entry, cb.checked);
        toast(cb.checked ? `Marked "${entry.label}" as a power tool.` : `Unmarked "${entry.label}".`);
      });
    }
    return row;
  }

  function renderPowerToolList(){
    powerToolList.innerHTML = '';
    for (const entry of BUILTIN_POWER_TOOLS){
      powerToolList.appendChild(buildPowerToolRow(entry, { checked:true, locked:true }));
    }
    for (const candidate of OPTIONAL_POWER_TOOL_CANDIDATES){
      powerToolList.appendChild(buildPowerToolRow(candidate, { checked: customPowerTools.some(c => c.id === candidate.id), locked:false }));
    }
    const candidateIds = new Set(OPTIONAL_POWER_TOOL_CANDIDATES.map(c => c.id));
    for (const custom of customPowerTools){
      if (candidateIds.has(custom.id)) continue; // already rendered above as a curated candidate
      powerToolList.appendChild(buildPowerToolRow(custom, { checked:true, locked:false }));
    }
  }

  function addCustomPowerTool(fieldIds, buttonIds, mode, label){
    const entry = {
      id: 'custom-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      field: fieldIds, button: buttonIds[0], mode, label
    };
    customPowerTools.push(entry);
    saveCustomPowerTools();
    applyPowerToolMarks();
    renderPowerToolList();
    toast(`Marked "${label}" as a power tool.`);
  }

  function exitPowerToolPicker(){
    powerToolPickerActive = false;
    document.body.classList.remove('pt-picking');
    document.removeEventListener('click', onPowerToolPickerClick, true);
    document.removeEventListener('keydown', onPowerToolPickerEscape, true);
  }

  function onPowerToolPickerEscape(ev){
    if (ev.key === 'Escape'){ exitPowerToolPicker(); toast('Cancelled.'); }
  }

  function onPowerToolPickerClick(ev){
    const el = ev.target.closest('input, textarea, select, button');
    exitPowerToolPicker();
    if (!el || !el.id || el.classList.contains('tab-btn')){
      ev.preventDefault();
      ev.stopPropagation();
      toast('That spot isn\'t a markable field or button — try again.');
      return;
    }
    ev.preventDefault();
    ev.stopPropagation();

    // Clicking something already marked toggles it off instead of re-marking
    // it — built-ins are protected, custom marks (curated or ad-hoc) come off.
    const existing = findPowerToolMatch(el.id);
    if (existing && existing.scope === 'builtin'){
      toast('That\'s already a built-in power tool and can\'t be unmarked.');
      return;
    }
    if (existing && existing.scope === 'custom'){
      setCustomPowerToolActive(existing.entry, false);
      toast(`Unmarked "${existing.entry.label}".`);
      return;
    }

    const container = el.closest('.apply-row, .gtt-row');
    let fields = [], buttons = [];
    if (container){
      fields = Array.from(container.querySelectorAll('input, textarea, select')).filter(x => x.id);
      buttons = Array.from(container.querySelectorAll('button')).filter(x => x.id);
    }
    const isField = el.matches('input, textarea, select');
    if (fields.length === 0) fields = isField ? [el] : [];
    if (buttons.length === 0) buttons = !isField ? [el] : [];
    const fieldIds = fields.map(f => f.id);
    const buttonIds = buttons.map(b => b.id);

    // If this exact pair matches a curated candidate, toggle that candidate
    // on by its fixed id instead of creating a redundant ad-hoc duplicate.
    const matchedCandidate = OPTIONAL_POWER_TOOL_CANDIDATES.find(cand => {
      const ids = powerToolIdsFor(cand);
      return ids.fieldIds.length === fieldIds.length && ids.fieldIds.every(id => fieldIds.includes(id)) &&
             ids.buttonIds.length === buttonIds.length && ids.buttonIds.every(id => buttonIds.includes(id));
    });
    if (matchedCandidate){
      setCustomPowerToolActive(matchedCandidate, true);
      toast(`Marked "${matchedCandidate.label}" as a power tool.`);
      return;
    }

    if (fields.length && buttons.length){
      openPowerToolModeChoice(el, fields, buttons, ev.clientX, ev.clientY);
    } else {
      const mode = fieldIds.length ? 'field' : 'button';
      const label = (buttons[0] && buttons[0].textContent.trim()) || (fields[0] && (fields[0].placeholder || fields[0].id)) || el.id;
      addCustomPowerTool(fieldIds, buttonIds, mode, label.slice(0, 60));
    }
  }

  function openPowerToolModeChoice(el, fields, buttons, x, y){
    const menu = document.createElement('div');
    menu.className = 'pt-choice-menu';
    const header = document.createElement('div');
    header.className = 'ctx-header';
    header.textContent = 'Highlight which part?';
    menu.appendChild(header);
    const fieldIds = fields.map(f => f.id);
    const buttonIds = buttons.map(b => b.id);
    const label = ((buttons[0] && buttons[0].textContent.trim()) || (fields[0] && (fields[0].placeholder || fields[0].id)) || el.id).slice(0, 60);
    const choices = [
      ['field', 'Highlight the field' + (fields.length > 1 ? 's' : '')],
      ['button', 'Highlight the button'],
      ['both', 'Highlight both']
    ];
    for (const [mode, text] of choices){
      const btn = document.createElement('button');
      btn.textContent = text;
      btn.addEventListener('click', () => {
        menu.remove();
        document.removeEventListener('click', onOutsideCloseChoiceMenu, true);
        addCustomPowerTool(fieldIds, buttonIds, mode, label);
      });
      menu.appendChild(btn);
    }
    document.body.appendChild(menu);
    positionMenu(menu, x, y);
    function onOutsideCloseChoiceMenu(ev){
      if (!menu.contains(ev.target)){ menu.remove(); document.removeEventListener('click', onOutsideCloseChoiceMenu, true); }
    }
    setTimeout(() => document.addEventListener('click', onOutsideCloseChoiceMenu, true), 0);
  }

  btnStartPowerToolPicker.addEventListener('click', () => {
    powerToolPickerActive = true;
    document.body.classList.add('pt-picking');
    toast('Click any input or button to mark it as a power tool — Esc to cancel.', 5000);
    setTimeout(() => {
      document.addEventListener('click', onPowerToolPickerClick, true);
      document.addEventListener('keydown', onPowerToolPickerEscape, true);
    }, 0);
  });

  btnResetCustomPowerTools.addEventListener('click', async () => {
    if (customPowerTools.length === 0){ toast('No custom power tool marks to reset.'); return; }
    const ok = await showConfirmModal(`Remove all ${customPowerTools.length} custom power tool mark(s)? Built-in ones are unaffected.`, { okLabel: 'Reset', danger: true });
    if (!ok) return;
    customPowerTools = [];
    saveCustomPowerTools();
    applyPowerToolMarks();
    renderPowerToolList();
    toast('Custom power tool marks reset.');
  });

  (function initPowerTools(){
    loadCustomPowerTools();
    applyPowerToolMarks();
    renderPowerToolList();
  })();

  tagAutocompleteToggle.addEventListener('change', () => {
    tagAutocompleteEnabled = tagAutocompleteToggle.checked;
    try { localStorage.setItem('dts-tag-autocomplete', tagAutocompleteEnabled ? '1' : '0'); } catch(e){}
    if (!tagAutocompleteEnabled) closeAutocomplete();
  });
  (function initTagAutocompletePref(){
    let on = false;
    try { on = localStorage.getItem('dts-tag-autocomplete') === '1'; } catch(e){}
    tagAutocompleteEnabled = on;
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

  // ---------------- Favorite folders (persisted via IndexedDB) ----------------

  const FAV_DB_NAME = 'dts-favorites-db';
  const FAV_STORE = 'folders';

  function openFavDB(){
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(FAV_DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(FAV_STORE)){
          db.createObjectStore(FAV_STORE, { keyPath: 'id', autoIncrement: true });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function addFavoriteHandle(handle){
    const db = await openFavDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(FAV_STORE, 'readwrite');
      tx.objectStore(FAV_STORE).add({ name: handle.name, handle, addedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function listFavorites(){
    const db = await openFavDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(FAV_STORE, 'readonly');
      const req = tx.objectStore(FAV_STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async function removeFavorite(id){
    const db = await openFavDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(FAV_STORE, 'readwrite');
      tx.objectStore(FAV_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function renderFavorites(){
    let favs = [];
    try { favs = await listFavorites(); } catch(e){ favs = []; }
    favoritesList.innerHTML = '';
    if (favs.length === 0){
      favoritesList.innerHTML = '<div class="fav-empty">No favorites yet. Open a folder, then "Save current folder" below.</div>';
      return;
    }
    favs.sort((a,b) => b.addedAt - a.addedAt);
    for (const fav of favs){
      const row = document.createElement('div');
      row.className = 'fav-row';
      const name = document.createElement('span');
      name.className = 'fav-name';
      name.textContent = fav.name || '(folder)';
      name.title = fav.name || '';
      const openBtn = document.createElement('button');
      openBtn.textContent = 'Open';
      openBtn.className = 'primary';
      openBtn.addEventListener('click', () => openFavorite(fav));
      const rmBtn = document.createElement('button');
      rmBtn.textContent = '✕';
      rmBtn.className = 'danger-ghost';
      rmBtn.addEventListener('click', async () => {
        await removeFavorite(fav.id);
        renderFavorites();
      });
      row.appendChild(name);
      row.appendChild(openBtn);
      row.appendChild(rmBtn);
      favoritesList.appendChild(row);
    }
  }

  async function openFavorite(fav){
    try {
      const perm = await fav.handle.requestPermission({ mode: 'readwrite' });
      if (perm !== 'granted'){
        toast('Permission was not granted for that folder.');
        return;
      }
      dirHandle = fav.handle;
      hidePanel(favoritesPanel);
      await loadFolder();
    } catch(err){
      toast('Could not reopen that folder — it may have been moved or deleted.', 3600);
    }
  }

  btnFavorites.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (favoritesPanel.style.display === 'flex'){ hidePanel(favoritesPanel); return; }
    hidePanel(themeCustomPanel); hidePanel(logPanel); hidePanel(achievementsPanel); hidePanel(shopPanel); hidePanel(tagDetailsPanel);
    renderFavorites();
    showPanel(favoritesPanel);
  });
  favoritesCloseBtn.addEventListener('click', () => hidePanel(favoritesPanel));

  btnAddFavorite.addEventListener('click', async () => {
    if (!dirHandle) return;
    try {
      await addFavoriteHandle(dirHandle);
      toast(`Saved "${dirHandle.name}" to favorites.`);
      renderFavorites();
    } catch(err){
      toast('Could not save that favorite.', 3000);
    }
  });

  // ---------------- Edit log (per dataset folder) ----------------

  const LOG_FILE_NAME = '_tag_edit_log.json';

  function pushLogEntry(partial){
    const entry = {
      id: logIdCounter++,
      ts: Date.now(),
      type: partial.type,
      summary: partial.summary,
      affected: partial.affected || []
    };
    editLog.push(entry);
    updateLogButton();
    saveEditLog(); // fire-and-forget; dataset folder is the source of truth on disk
    if (logPanel.style.display === 'flex') renderLogPanel();
    return entry;
  }

  async function saveEditLog(){
    if (!dirHandle) return;
    try {
      const handle = await dirHandle.getFileHandle(LOG_FILE_NAME, { create: true });
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(editLog, null, 2));
      await writable.close();
    } catch(err){
      // best-effort autosave; don't interrupt the user's edit flow
    }
  }

  async function loadEditLogForFolder(){
    editLog = [];
    logIdCounter = 1;
    if (!dirHandle) return;
    try {
      const handle = await dirHandle.getFileHandle(LOG_FILE_NAME, { create: false });
      const file = await handle.getFile();
      const parsed = JSON.parse((await file.text()).trim() || '[]');
      if (Array.isArray(parsed)) editLog = parsed;
      logIdCounter = editLog.reduce((max, e) => Math.max(max, e.id || 0), 0) + 1;
    } catch(err){
      editLog = [];
      logIdCounter = 1;
    }
    updateLogButton();
  }

  function updateLogButton(){
    btnLog.textContent = `📜 Log (${editLog.length})`;
  }

  function formatLogTime(ts){
    try { return new Date(ts).toLocaleString(); } catch(e){ return ''; }
  }

  // ---------------- Editing Stats tab (charts) ----------------

  const STAT_CHART_COLORS = {
    'add-tag': '#6fb8d1', 'remove-tag': '#e2637a', 'merge': '#e8a33d', 'void': '#c1443c',
    'rename': '#7fbf8f', 'find-replace': '#a683e0', 'disable': '#8a6f57', 'restore': '#4fae7a',
    'undo': '#9791a6', 'redo': '#6b6578'
  };
  const STAT_TYPE_LABEL = {
    'add-tag': 'Tags added', 'remove-tag': 'Tags removed', 'merge': 'Merges', 'void': 'Voids',
    'rename': 'Renames', 'find-replace': 'Find & replace', 'disable': 'Disabled', 'restore': 'Restored',
    'undo': 'Undos', 'redo': 'Redos'
  };

  function computeStatsBreakdown(){
    const counts = {};
    for (const entry of editLog){
      if (!(entry.type in STAT_TYPE_LABEL)) continue;
      counts[entry.type] = (counts[entry.type] || 0) + 1;
    }
    return counts;
  }

  function animateCountUp(el, target, duration = 600){
    const start = 0;
    const startTime = performance.now();
    function tick(now){
      const p = Math.min(1, (now - startTime) / duration);
      el.textContent = Math.round(start + (target - start) * p);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function renderStatsTab(){
    const counts = computeStatsBreakdown();
    const entriesArr = Object.entries(counts).filter(([,v]) => v > 0);
    const total = entriesArr.reduce((s,[,v]) => s+v, 0);

    statsChartWrap.innerHTML = '';
    statsLegend.innerHTML = '';
    statsTotals.innerHTML = '';

    if (total === 0){
      statsChartWrap.innerHTML = '<div class="stats-empty">No edits logged yet in this folder — make some changes, then check back here.</div>';
      return;
    }

    entriesArr.sort((a,b) => b[1] - a[1]);

    if (statsChartMode === 'pie'){
      const size = 240, r = 100, cx = size/2, cy = size/2;
      const circumference = 2 * Math.PI * r;
      let offset = 0;
      let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
      svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--bg-elevated)" stroke-width="34"/>`;
      entriesArr.forEach(([type, count], i) => {
        const frac = count / total;
        const dash = frac * circumference;
        const color = STAT_CHART_COLORS[type] || '#888';
        svg += `<circle class="pie-slice" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="34"
          stroke-dasharray="${dash} ${circumference - dash}" stroke-dashoffset="${-offset}"
          transform="rotate(-90 ${cx} ${cy})" style="animation: pieReveal 0.8s ease ${i*0.08}s both;"/>`;
        offset += dash;
      });
      svg += `<circle cx="${cx}" cy="${cy}" r="${r-34}" fill="var(--bg-panel)"/>`;
      svg += `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" fill="var(--text-primary)" font-size="22" font-weight="600" font-family="var(--mono)">${total}</text>`;
      svg += `<text x="${cx}" y="${cy+20}" text-anchor="middle" fill="var(--text-faint)" font-size="10">edits</text>`;
      svg += `</svg>`;
      statsChartWrap.innerHTML = svg;
    } else {
      const wrap = document.createElement('div');
      wrap.style.minWidth = '360px';
      const maxCount = entriesArr[0][1];
      entriesArr.forEach(([type, count], i) => {
        const pct = ((count/total)*100).toFixed(1);
        const barWidthPct = (count / maxCount) * 100;
        const color = STAT_CHART_COLORS[type] || '#888';
        const row = document.createElement('div');
        row.className = 'stat-bar-row';
        row.innerHTML = `
          <div class="stat-bar-label">${STAT_TYPE_LABEL[type] || type}</div>
          <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${barWidthPct}%; background:${color}; animation-delay:${i*0.06}s;"></div></div>
          <div class="stat-bar-value">${count} (${pct}%)</div>
        `;
        wrap.appendChild(row);
      });
      statsChartWrap.appendChild(wrap);
    }

    for (const [type, count] of entriesArr){
      const pct = ((count/total)*100).toFixed(1);
      const row = document.createElement('div');
      row.className = 'stats-legend-row';
      const swatch = document.createElement('span');
      swatch.className = 'stats-legend-swatch';
      swatch.style.background = STAT_CHART_COLORS[type] || '#888';
      const label = document.createElement('span');
      label.className = 'stats-legend-label';
      label.textContent = STAT_TYPE_LABEL[type] || type;
      const value = document.createElement('span');
      value.className = 'stats-legend-value';
      value.textContent = `${count} · ${pct}%`;
      row.appendChild(swatch); row.appendChild(label); row.appendChild(value);
      statsLegend.appendChild(row);
    }

    const totalCards = [
      ['Total logged edits', total],
      ['Undo stack depth', undoStack.length],
      ['Redo stack depth', redoStack.length],
      ['Achievements unlocked', folderUnlocked.length]
    ];
    for (const [label, value] of totalCards){
      const card = document.createElement('div');
      card.className = 'stats-total-card';
      const num = document.createElement('div');
      num.className = 'num';
      const lbl = document.createElement('div');
      lbl.className = 'lbl';
      lbl.textContent = label;
      card.appendChild(num);
      card.appendChild(lbl);
      statsTotals.appendChild(card);
      animateCountUp(num, value);
    }
  }

  function renderLogPanel(){
    logPanelTitle.textContent = dirHandle ? `Edit log — ${dirHandle.name}` : 'Edit log';
    logList.innerHTML = '';
    if (editLog.length === 0){
      logList.innerHTML = '<div class="log-empty">No edits logged yet for this folder.</div>';
      return;
    }
    const TAG_TYPES = new Set(['add-tag','remove-tag','merge','void','rename','find-replace','reset-edits']);
    const MOVE_TYPES = new Set(['disable','restore']);
    const recent = editLog.slice(-150).reverse();
    for (const logEntry of recent){
      const row = document.createElement('div');
      row.className = 'log-row';

      const meta = document.createElement('div');
      meta.className = 'log-meta';
      const time = document.createElement('span');
      time.className = 'log-time';
      time.textContent = formatLogTime(logEntry.ts);
      const type = document.createElement('span');
      type.className = 'log-type';
      type.textContent = logEntry.type;
      meta.appendChild(time);
      meta.appendChild(type);

      const summary = document.createElement('div');
      summary.className = 'log-summary';
      summary.textContent = logEntry.summary;

      row.appendChild(meta);
      row.appendChild(summary);

      if (TAG_TYPES.has(logEntry.type) && logEntry.affected && logEntry.affected.length){
        const actions = document.createElement('div');
        actions.className = 'log-actions';
        const undoBtn = document.createElement('button');
        undoBtn.textContent = '↩ Undo this';
        undoBtn.addEventListener('click', () => applyLogEntryDirection(logEntry, 'undo'));
        const redoBtn = document.createElement('button');
        redoBtn.textContent = '↪ Redo this';
        redoBtn.className = 'primary';
        redoBtn.addEventListener('click', () => applyLogEntryDirection(logEntry, 'redo'));
        actions.appendChild(undoBtn);
        actions.appendChild(redoBtn);
        row.appendChild(actions);
      } else if (MOVE_TYPES.has(logEntry.type) && logEntry.affected && logEntry.affected.length){
        const actions = document.createElement('div');
        actions.className = 'log-actions';
        const toggleBtn = document.createElement('button');
        toggleBtn.textContent = logEntry.type === 'disable' ? 'Restore image' : 'Disable image again';
        toggleBtn.className = 'primary';
        toggleBtn.addEventListener('click', () => toggleMoveLogEntry(logEntry));
        actions.appendChild(toggleBtn);
        row.appendChild(actions);
      }

      logList.appendChild(row);
    }
    if (editLog.length > 150){
      const note = document.createElement('div');
      note.className = 'log-empty';
      note.textContent = `Showing the latest 150 of ${editLog.length} entries — the rest are still in ${LOG_FILE_NAME}.`;
      logList.appendChild(note);
    }
  }

  function applyLogEntryDirection(logEntry, direction){
    const count = applyTagDirection(logEntry.affected, direction);
    if (count === 0){ toast('None of the affected images are in the loaded dataset anymore.'); return; }
    const verb = direction === 'undo' ? 'Undid' : 'Redid';
    pushLogEntry({
      type: direction,
      summary: `${verb} (from log): ${logEntry.summary}`,
      affected: logEntry.affected
    });
    trackStat(direction === 'undo' ? 'undos' : 'redos');
    toast(`${verb} that edit.`);
    refreshAllUI();
    renderLogPanel();
    checkAchievements();
  }

  async function toggleMoveLogEntry(logEntry){
    const base = logEntry.affected[0] && logEntry.affected[0].base;
    const e = base ? entryByBase.get(base) : null;
    if (!e){ toast('That image is no longer in the loaded dataset.'); return; }
    const shouldBeDisabled = logEntry.type === 'disable' ? false : true;
    if (e.disabled === shouldBeDisabled){ toast('Already in that state.'); return; }
    await moveEntry(e, shouldBeDisabled);
    renderLogPanel();
  }

  btnLog.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (logPanel.style.display === 'flex'){ hidePanel(logPanel); return; }
    hidePanel(themeCustomPanel); hidePanel(favoritesPanel); hidePanel(achievementsPanel); hidePanel(shopPanel); hidePanel(tagDetailsPanel);
    renderLogPanel();
    showPanel(logPanel);
  });
  logCloseBtn.addEventListener('click', () => hidePanel(logPanel));

  btnExportLog.addEventListener('click', async () => {
    if (editLog.length === 0){ toast('Nothing to export yet.'); return; }
    if (!window.showSaveFilePicker){ toast('File export needs Chrome/Edge/Electron.'); return; }
    try {
      const suggestedName = `tag-edit-log-${(dirHandle && dirHandle.name) || 'dataset'}-${new Date().toISOString().slice(0,10)}.json`;
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [{ description: 'JSON log', accept: { 'application/json': ['.json'] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(editLog, null, 2));
      await writable.close();
      toast('Log exported.');
    } catch(err){
      // user cancelled the save dialog — no toast needed
    }
  });

  btnClearLog.addEventListener('click', async () => {
    if (editLog.length === 0) return;
    const ok = await showConfirmModal(`Clear all ${editLog.length} log entries for this folder? This cannot be undone.`, { okLabel: 'Clear log', danger: true });
    if (!ok) return;
    editLog = [];
    logIdCounter = 1;
    updateLogButton();
    saveEditLog();
    renderLogPanel();
    toast('Log cleared.');
  });

  // ---------------- Achievements, stats & wallet (global + per-folder) ----------------

  const RARITY_VALUE = { common: 10, uncommon: 25, rare: 60, epic: 120, legendary: 250 };
  const RARITY_ICON = { common: '⚪', uncommon: '🟢', rare: '🔷', epic: '🟣', legendary: '⭐' };

  const ACHIEVEMENTS = [
    { id:'first-edit', title:'Baby Steps', desc:'Make your first tag edit in this folder.', rarity:'common',
      check: s => (s.tags_added||0)+(s.tags_removed||0)+(s.merges||0)+(s.voids||0)+(s.renames||0)+(s.find_replaces||0) >= 1 },
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
    { id:'yeet', title:'Yeet', desc:'Drag an image onto the Disabled tab.', rarity:'uncommon', check: s => !!s.drag_disabled_used }
  ];

  const PREMIUM_THEMES = [
    { id:'terminal', name:'Terminal Green', rarity:'common', price:15, swatches:['#0a0f0a','#00ff66','#003b16'] },
    { id:'sakura', name:'Sakura Dusk', rarity:'uncommon', price:30, swatches:['#2b1a24','#ffb8d9','#8a5a72'] },
    { id:'bioluminescent', name:'Bioluminescent Deep', rarity:'rare', price:60, swatches:['#031018','#26e0c9','#7b5bff'] },
    { id:'amethyst', name:'Royal Amethyst', rarity:'epic', price:120, swatches:['#170b26','#c9a6ff','#e8c468'] },
    { id:'solarflare', name:'Solar Flare', rarity:'legendary', price:250, swatches:['#1a0800','#ff6a1f','#ffd166'] },
    { id:'midnight-ocean', name:'Midnight Ocean', rarity:'common', price:15, swatches:['#040c14','#3ddbd9','#f2a65a'] },
    { id:'autumn-ember', name:'Autumn Ember', rarity:'common', price:15, swatches:['#1a100a','#e8672e','#ffb74d'] },
    { id:'arctic-frost', name:'Arctic Frost', rarity:'common', price:15, swatches:['#eef5fb','#2f7fb8','#5aa9e6'] },
    { id:'forest-moss', name:'Forest Moss', rarity:'common', price:15, swatches:['#0e130d','#7cb454','#d7b568'] },
    { id:'vintage-paper', name:'Vintage Paper', rarity:'common', price:15, swatches:['#f2e8d5','#6b4a2f','#a3742f'] },
    { id:'obsidian', name:'Obsidian', rarity:'common', price:15, swatches:['#0a0a0c','#7c9cff','#c9c9d4'] },
    { id:'retrowave', name:'Retro Wave', rarity:'uncommon', price:30, swatches:['#170826','#ff3ec8','#00e5ff'] },
    { id:'rose-gold', name:'Rose Gold', rarity:'uncommon', price:30, swatches:['#fbeef0','#c47a6f','#e0a45c'] },
    { id:'coral-reef', name:'Coral Reef', rarity:'uncommon', price:30, swatches:['#04191c','#ff7f6b','#ffb27a'] },
    { id:'toxic-waste', name:'Toxic Waste', rarity:'uncommon', price:30, swatches:['#0a0f04','#8aff29','#f5ff3d'] },
    { id:'lavender-fields', name:'Lavender Fields', rarity:'uncommon', price:30, swatches:['#f2eefb','#7b5ea8','#c98ed6'] },
    { id:'candy-pop', name:'Candy Pop', rarity:'uncommon', price:30, swatches:['#fff5fa','#ff5fa2','#ffd23f'] },
    { id:'copper-forge', name:'Copper Forge', rarity:'rare', price:60, swatches:['#120e0b','#b0703f','#c98a4a'] },
    { id:'blood-moon', name:'Blood Moon', rarity:'rare', price:60, swatches:['#0e0505','#ff3b3b','#ff8f4d'] },
    { id:'glacier', name:'Glacier', rarity:'rare', price:60, swatches:['#eef6f8','#2f8fa8','#5ac8e0'] },
    { id:'desert-dune', name:'Desert Dune', rarity:'rare', price:60, swatches:['#f2e2c4','#8f5a2f','#c9601f'] },
    { id:'twilight-garden', name:'Twilight Garden', rarity:'epic', price:120, swatches:['#0c1210','#4fd68f','#c9a6ff'] },
    { id:'neon-tokyo', name:'Neon Tokyo', rarity:'epic', price:120, swatches:['#08060f','#ff2fb0','#00d9ff'] },
    { id:'aurora-borealis', name:'Aurora Borealis', rarity:'legendary', price:250, swatches:['#05080f','#a6ff9c','#7b5bff'] },
    { id:'celestial-gold', name:'Celestial Gold', rarity:'legendary', price:250, swatches:['#0a0810','#ffd166','#e8c468'] }
  ];

  function trackStat(key, amount = 1){
    folderStats[key] = (folderStats[key] || 0) + amount;
    saveFolderStats();
  }

  const META_FILE_NAME = '_dts_meta.json';
  const ACH_FILE_NAME = '_dts_achievements.json';

  async function saveFolderStats(){
    if (!dirHandle) return;
    try {
      const handle = await dirHandle.getFileHandle(ACH_FILE_NAME, { create: true });
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify({ stats: folderStats, unlocked: folderUnlocked }, null, 2));
      await writable.close();
    } catch(err){}
  }

  async function loadFolderStats(){
    folderStats = {};
    folderUnlocked = [];
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

  function saveWallet(){
    try {
      localStorage.setItem('dts-wallet', String(wallet));
      localStorage.setItem('dts-owned-themes', JSON.stringify(ownedThemes));
    } catch(e){}
    walletDisplay.textContent = wallet;
    achWallet.textContent = wallet;
    shopWallet.textContent = wallet;
  }

  function loadWallet(){
    try {
      wallet = parseInt(localStorage.getItem('dts-wallet') || '0', 10) || 0;
      const owned = JSON.parse(localStorage.getItem('dts-owned-themes') || 'null');
      if (Array.isArray(owned)) ownedThemes = Array.from(new Set(['studio','cyberpunk','oriental','subway', ...owned]));
    } catch(e){}
    saveWallet();
  }

  function checkAchievements(){
    folderStats.log_count = editLog.length;
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

  function checkVoidThemeAchievements(tagList, voidedTagInstances){
    const lower = tagList.map(t => t.toLowerCase());
    const eyeCount = lower.filter(t => t.includes('eye')).length;
    const hairCount = lower.filter(t => t.includes('hair')).length;
    if (eyeCount >= 5) folderStats.flag_eye_hater = true;
    if (hairCount >= 5) folderStats.flag_hair_raiser = true;
    saveFolderStats();
  }

  function showAchievementPopup(ach, reward){
    const popup = document.createElement('div');
    popup.className = 'ach-popup';
    popup.innerHTML = `
      <span class="ach-rarity-icon">${RARITY_ICON[ach.rarity] || '⚪'}</span>
      <div class="ach-info">
        <div class="ach-title">🏆 ${escapeHtml(ach.title)}</div>
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

  function renderAchievementsPanel(){
    achWallet.textContent = wallet;
    achList.innerHTML = '';
    for (const ach of ACHIEVEMENTS){
      const unlocked = folderUnlocked.includes(ach.id);
      const row = document.createElement('div');
      row.className = 'ach-row ' + (unlocked ? 'unlocked' : 'locked');
      row.innerHTML = `
        <span class="ach-rarity-icon">${RARITY_ICON[ach.rarity] || '⚪'}</span>
        <div class="ach-info">
          <div class="ach-title">${unlocked ? '🏆 ' : ''}${escapeHtml(ach.title)}</div>
          <div class="ach-desc">${escapeHtml(ach.desc)}</div>
          <div class="ach-reward">${unlocked ? 'Unlocked' : 'Locked'} · ${ach.rarity} · +${RARITY_VALUE[ach.rarity]} Edibits</div>
        </div>
      `;
      achList.appendChild(row);
    }
  }

  btnAchievements.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (achievementsPanel.style.display === 'flex'){ hidePanel(achievementsPanel); return; }
    hidePanel(shopPanel); hidePanel(favoritesPanel); hidePanel(themeCustomPanel); hidePanel(logPanel); hidePanel(tagDetailsPanel);
    renderAchievementsPanel();
    showPanel(achievementsPanel);
  });
  achCloseBtn.addEventListener('click', () => hidePanel(achievementsPanel));

  achPopupsToggle.addEventListener('change', () => {
    achievementPopupsEnabled = achPopupsToggle.checked;
    try { localStorage.setItem('dts-ach-popups', achievementPopupsEnabled ? '1' : '0'); } catch(e){}
  });
  (function initAchPopupPref(){
    let on = true;
    try { on = localStorage.getItem('dts-ach-popups') !== '0'; } catch(e){}
    achievementPopupsEnabled = on;
    achPopupsToggle.checked = on;
  })();

  // ---------------- Shop ----------------

  function renderShopPanel(){
    shopWallet.textContent = wallet;
    shopList.innerHTML = '';
    for (const t of PREMIUM_THEMES){
      const owned = ownedThemes.includes(t.id);
      const row = document.createElement('div');
      row.className = 'shop-row';
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
        btn.textContent = 'Owned ✓';
        btn.disabled = true;
      } else {
        btn.textContent = 'Buy';
        btn.className = 'primary';
        btn.disabled = wallet < t.price;
        btn.addEventListener('click', () => buyTheme(t));
      }
      row.appendChild(swatches);
      row.appendChild(info);
      row.appendChild(btn);
      shopList.appendChild(row);
    }
  }

  function buyTheme(t){
    if (ownedThemes.includes(t.id)) return;
    if (wallet < t.price){ toast('Not enough Edibits for that yet.'); return; }
    wallet -= t.price;
    ownedThemes.push(t.id);
    saveWallet();
    toast(`Purchased "${t.name}"! Find it in the theme dropdown.`);
    folderStats.themes_purchased = (folderStats.themes_purchased || 0) + 1;
    saveFolderStats();
    renderShopPanel();
    updateThemeSelectLocks();
    checkAchievements();
  }

  btnShop.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (shopPanel.style.display === 'flex'){ hidePanel(shopPanel); return; }
    hidePanel(achievementsPanel); hidePanel(favoritesPanel); hidePanel(themeCustomPanel); hidePanel(logPanel); hidePanel(tagDetailsPanel);
    folderStats.shop_opened = true;
    saveFolderStats();
    renderShopPanel();
    showPanel(shopPanel);
    checkAchievements();
  });
  shopCloseBtn.addEventListener('click', () => hidePanel(shopPanel));

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

  function updateThemeSelectLocks(){
    for (const t of PREMIUM_THEMES){
      const opt = themeSelect.querySelector(`option[value="${t.id}"]`);
      if (opt) opt.textContent = ownedThemes.includes(t.id) ? t.name : `🔒 ${t.name}`;
    }
  }

  function baseName(name){
    const i = name.lastIndexOf('.');
    return i === -1 ? name : name.slice(0, i);
  }
  function isImageFile(name){
    const lower = name.toLowerCase();
    return IMAGE_EXT.some(ext => lower.endsWith(ext));
  }
  function escapeHtml(s){
    return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // ---------------- Folder loading ----------------

  btnOpen.addEventListener('click', async () => {
    if (!window.showDirectoryPicker){
      toast('Your browser does not support folder access. Use Chrome or Edge, opened as a normal tab (not an embedded preview).', 5000);
      return;
    }
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
    }
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
    undoStack = [];
    redoStack = [];
    masterSelectedImages.clear();
    stickyCompareImages = [];
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

    singleIndex = 0;
    switchView(viewMode === 'compact' ? 'compact' : 'grid');

    await loadEditLogForFolder();
    await loadFolderStats();

    renderAll();
    checkAchievements();
    const disabledNote = disabledDirHandle ? ' (including a Disabled/ folder)' : '';
    toast(`Loaded ${entries.length} image${entries.length===1?'':'s'}${disabledNote}.`);
  }

  // ---------------- Tag index / stats ----------------

  function buildTagIndex(){
    const index = new Map(); // tag -> Set(base)
    for (const e of entries){
      if (e.disabled) continue;
      for (const t of e.tags){
        if (!index.has(t)) index.set(t, new Set());
        index.get(t).add(e.base);
      }
    }
    return index;
  }

  function renderTagFrequencyList(index){
    const dir = leftSortDir === 'asc' ? 1 : -1;
    tagFrequencyList.innerHTML = '';

    if (leftSortMode === 'family'){
      const families = new Map(); // word -> [tag,...]
      for (const [tag] of index){
        const words = Array.from(new Set(tag.split(' ').filter(Boolean)));
        for (const w of words){
          if (!families.has(w)) families.set(w, []);
          if (!families.get(w).includes(tag)) families.get(w).push(tag);
        }
      }
      let familyList = Array.from(families.entries()).filter(([,tags]) => tags.length >= 2);
      familyList.sort((a,b) => (b[1].length - a[1].length) * dir);
      familyList = applyFamilyOrder(familyList);

      if (familyList.length === 0){
        const empty = document.createElement('div');
        empty.className = 'freq-family-header';
        empty.style.cursor = 'default';
        empty.textContent = 'No tags share a common word yet.';
        tagFrequencyList.appendChild(empty);
        return;
      }

      for (const [word, tags] of familyList){
        const header = document.createElement('div');
        header.className = 'freq-family-header';
        header.draggable = true;
        header.dataset.word = word;
        const dragHandle = document.createElement('span');
        dragHandle.className = 'family-drag-handle';
        dragHandle.textContent = '☰';
        dragHandle.title = 'Drag to reorder this family';
        header.appendChild(dragHandle);
        const labelSpan = document.createElement('span');
        labelSpan.textContent = ` — ${word} (${tags.length}) —`;
        header.appendChild(labelSpan);

        header.addEventListener('dragstart', (ev) => {
          ev.dataTransfer.setData('text/plain', word);
          ev.dataTransfer.effectAllowed = 'move';
          header.classList.add('family-dragging');
        });
        header.addEventListener('dragend', () => header.classList.remove('family-dragging'));
        header.addEventListener('dragover', (ev) => { ev.preventDefault(); header.classList.add('family-drop-target'); });
        header.addEventListener('dragleave', () => header.classList.remove('family-drop-target'));
        header.addEventListener('drop', (ev) => {
          ev.preventDefault();
          header.classList.remove('family-drop-target');
          const draggedWord = ev.dataTransfer.getData('text/plain');
          if (draggedWord && draggedWord !== word) reorderFamilyBefore(draggedWord, word, familyList.map(f => f[0]));
        });

        tagFrequencyList.appendChild(header);
        tags.sort((a,b) => a.localeCompare(b));
        for (const tag of tags){
          tagFrequencyList.appendChild(buildFreqRow(tag, index.get(tag).size));
        }
      }
      return;
    }

    let list = Array.from(index.entries());
    if (leftSortMode === 'alphabetical'){
      list.sort((a,b) => a[0].localeCompare(b[0]) * dir);
    } else {
      list.sort((a,b) => (b[1].size - a[1].size) * dir);
    }
    for (const [tag, set] of list){
      tagFrequencyList.appendChild(buildFreqRow(tag, set.size));
    }
  }

  function buildFreqRow(tag, count){
    const row = document.createElement('div');
    row.className = 'freq-row';
    row.innerHTML = `<span>${escapeHtml(tag)}</span><span class="n">${count}</span>`;
    row.addEventListener('click', () => setContainsFilter(tag));
    return row;
  }

  function applyFamilyOrder(familyList){
    const words = familyList.map(([w]) => w);
    const known = familyOrder.filter(w => words.includes(w));
    const unknown = words.filter(w => !known.includes(w));
    const finalOrder = [...known, ...unknown];
    return finalOrder.map(w => familyList.find(([fw]) => fw === w));
  }

  function saveFamilyOrder(){
    try { localStorage.setItem('dts-family-order', JSON.stringify(familyOrder)); } catch(e){}
  }
  (function loadFamilyOrder(){
    try {
      const saved = JSON.parse(localStorage.getItem('dts-family-order') || 'null');
      if (Array.isArray(saved)) familyOrder = saved;
    } catch(e){}
  })();

  function reorderFamilyBefore(draggedWord, targetWord, currentOrder){
    let order = currentOrder.slice();
    order = order.filter(w => w !== draggedWord);
    const targetIdx = order.indexOf(targetWord);
    order.splice(targetIdx, 0, draggedWord);
    familyOrder = order;
    saveFamilyOrder();
    refreshStats();
  }

  leftSortDirBtn.addEventListener('click', () => {
    leftSortDir = leftSortDir === 'asc' ? 'desc' : 'asc';
    leftSortDirBtn.textContent = leftSortDir === 'asc' ? '▲' : '▼';
    refreshStats();
  });
  btnResetFamilyOrder.addEventListener('click', () => {
    familyOrder = [];
    saveFamilyOrder();
    refreshStats();
    toast('Keyword family order reset.');
  });

  function refreshStats(){
    const index = buildTagIndex();
    const activeEntries = entries.filter(e => !e.disabled);
    const untaggedCount = activeEntries.filter(e => e.tags.length === 0).length;
    const disabledCount = entries.filter(e => e.disabled).length;
    $('statImages').textContent = activeEntries.length;
    $('statTags').textContent = index.size;
    $('statUntagged').textContent = untaggedCount;
    $('statDisabled').textContent = disabledCount;
    $('cardImages').textContent = activeEntries.length;
    $('cardTags').textContent = index.size;

    renderTagFrequencyList(index);

    allTagsDatalist.innerHTML = '';
    const allTagNames = Array.from(index.keys()).sort((a,b)=> a.localeCompare(b));
    for (const tag of allTagNames){
      const opt = document.createElement('option');
      opt.value = tag;
      allTagsDatalist.appendChild(opt);
    }

    return index;
  }

  function updateDirtyUI(){
    const dirtyCount = entries.filter(e=>e.dirty).length;
    dirtyCountEl.textContent = `(${dirtyCount})`;
    btnSave.disabled = dirtyCount === 0;
  }

  // ---------------- Filtering ----------------

  function sortEntries(list){
    const dir = gallerySortDir === 'asc' ? 1 : -1;
    const arr = list.slice();
    arr.sort((a, b) => {
      let cmp = 0;
      if (gallerySortMode === 'filename'){
        cmp = a.imgName.localeCompare(b.imgName, undefined, { numeric: true });
      } else if (gallerySortMode === 'resolution'){
        const ra = (a.width || 0) * (a.height || 0);
        const rb = (b.width || 0) * (b.height || 0);
        cmp = ra - rb;
      } else if (gallerySortMode === 'tagcount'){
        cmp = a.tags.length - b.tags.length;
      } else if (gallerySortMode === 'dirty'){
        cmp = (a.dirty ? 1 : 0) - (b.dirty ? 1 : 0);
      }
      return cmp * dir;
    });
    return arr;
  }

  function filteredEntries(){
    return sortEntries(entries.filter(passesFilter));
  }

  function passesFilter(e){
    if (galleryFilter.disabledView){
      if (!e.disabled) return false;
    } else {
      if (e.disabled) return false;
      if (galleryFilter.base === 'untagged' && e.tags.length !== 0) return false;
      if (galleryFilter.base === 'dirty' && !e.dirty) return false;
    }
    if (galleryFilter.terms && galleryFilter.terms.length){
      const matchCount = galleryFilter.terms.filter(term => e.tags.some(t => t.toLowerCase().includes(term))).length;
      const mode = galleryFilter.mode || 'AND';
      if (mode === 'AND' && matchCount !== galleryFilter.terms.length) return false;
      if (mode === 'OR' && matchCount === 0) return false;
      if (mode === 'XOR' && matchCount !== 1) return false;
      if (mode === 'NOT' && matchCount > 0) return false;
    }
    if (galleryFilter.excludes && e.tags.some(t => t.toLowerCase().includes(galleryFilter.excludes))) return false;
    return true;
  }

  function setBaseFilter(kind){
    galleryFilter.base = kind;
    [filterAllBtn, filterUntaggedBtn, filterDirtyBtn].forEach(b=>b.classList.remove('active'));
    ({all: filterAllBtn, untagged: filterUntaggedBtn, dirty: filterDirtyBtn})[kind].classList.add('active');
    singleIndex = 0;
    renderCurrentView();
  }

  function parseFilterTerms(raw){
    return raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  }

  function setContainsFilter(value){
    galleryFilter.terms = [value.toLowerCase()];
    galleryFilter.mode = 'AND';
    filterInput.value = value;
    singleIndex = 0;
    renderCurrentView();
  }

  function setExcludesFilter(value){
    galleryFilter.excludes = value.toLowerCase();
    excludeBadgeText.textContent = value;
    excludeBadge.style.display = 'flex';
    singleIndex = 0;
    renderCurrentView();
  }

  filterInput.addEventListener('input', () => {
    galleryFilter.terms = parseFilterTerms(filterInput.value);
    singleIndex = 0;
    renderCurrentView();
  });
  filterAllBtn.addEventListener('click', () => setBaseFilter('all'));
  filterUntaggedBtn.addEventListener('click', () => setBaseFilter('untagged'));
  filterDirtyBtn.addEventListener('click', () => setBaseFilter('dirty'));
  excludeBadgeClear.addEventListener('click', () => {
    galleryFilter.excludes = '';
    excludeBadge.style.display = 'none';
    renderCurrentView();
  });

  btnClearFilter.addEventListener('click', () => {
    filterInput.value = '';
    galleryFilter.terms = [];
    galleryFilter.excludes = '';
    excludeBadge.style.display = 'none';
    setBaseFilter('all');
  });

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

  buildPersistentDropdown(leftSortDropdown,
    [
      { value: 'family', label: 'Keyword family' },
      { value: 'frequency', label: 'Frequency' },
      { value: 'alphabetical', label: 'Alphabetical' }
    ],
    () => leftSortMode,
    (val) => { leftSortMode = val; refreshStats(); }
  );

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

  function renderCurrentView(){
    if (viewMode === 'single') renderSingleView();
    else if (viewMode === 'compact') renderCompactGrid();
    else renderGallery();
    if (masterTagModeActive) renderMasterMiniGrid();
  }

  // ---------------- View mode (grid / compact / single) ----------------

  function switchView(mode){
    viewMode = mode;
    viewGridBtn.classList.toggle('active', mode === 'grid');
    viewCompactBtn.classList.toggle('active', mode === 'compact');
    viewSingleBtn.classList.toggle('active', mode === 'single');
    viewDisabledBtn.classList.toggle('active', mode === 'disabled');
    galleryFilter.disabledView = (mode === 'disabled');
    galleryGrid.style.display = (mode === 'grid' || mode === 'disabled') ? 'grid' : 'none';
    compactGrid.style.display = mode === 'compact' ? 'grid' : 'none';
    compactCompareArea.style.display = (mode === 'compact' && stickyCompareImages.length > 0) ? 'block' : 'none';
    singleViewEl.style.display = mode === 'single' ? 'block' : 'none';
    singleNav.style.display = mode === 'single' ? 'flex' : 'none';
    if (mode === 'single') renderSingleView();
    else if (mode === 'compact') renderCompactGrid();
    else renderGallery();
  }

  viewGridBtn.addEventListener('click', () => switchView('grid'));
  viewCompactBtn.addEventListener('click', () => {
    switchView('compact');
    folderStats.compact_used = true;
    saveFolderStats();
    checkAchievements();
  });
  viewSingleBtn.addEventListener('click', () => switchView('single'));
  viewDisabledBtn.addEventListener('click', () => switchView('disabled'));
  viewDisabledBtn.addEventListener('dragover', (ev) => { ev.preventDefault(); viewDisabledBtn.classList.add('drag-over'); });
  viewDisabledBtn.addEventListener('dragleave', () => viewDisabledBtn.classList.remove('drag-over'));
  viewDisabledBtn.addEventListener('drop', (ev) => {
    ev.preventDefault();
    viewDisabledBtn.classList.remove('drag-over');
    const base = ev.dataTransfer.getData('text/plain');
    const target = entryByBase.get(base);
    if (target && !target.disabled){
      moveEntry(target, true);
      folderStats.drag_disabled_used = true;
      saveFolderStats();
      checkAchievements();
    }
  });
  singlePrevBtn.addEventListener('click', () => { singleIndex--; renderSingleView(); });
  singleNextBtn.addEventListener('click', () => { singleIndex++; renderSingleView(); });

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

  // ---------------- Gallery (grid) rendering ----------------

  function renderGallery(){
    galleryGrid.innerHTML = '';
    const frag = document.createDocumentFragment();
    const tagIndex = buildTagIndex();
    for (const e of filteredEntries()){
      frag.appendChild(buildCard(e, tagIndex));
    }
    galleryGrid.appendChild(frag);
  }

  function renderCompactGrid(){
    compactGrid.innerHTML = '';
    const frag = document.createDocumentFragment();
    const list = filteredEntries().filter(e => !stickyCompareImages.includes(e.base));
    list.forEach((e, idx) => {
      const card = document.createElement('div');
      card.className = 'compact-card' + (e.dirty ? ' dirty' : '') + (e.disabled ? ' disabled-card' : '') + (e.meta && e.meta.blurred ? ' manually-blurred' : '');
      if (e.meta && e.meta.reviewColor) card.style.setProperty('--card-flag-color', e.meta.reviewColor);
      if (!e.disabled){
        card.draggable = true;
        card.addEventListener('dragstart', (ev) => {
          ev.dataTransfer.setData('text/plain', e.base);
          ev.dataTransfer.effectAllowed = 'move';
        });
      }
      const img = document.createElement('img');
      img.src = e.objectUrl;
      img.loading = 'lazy';
      card.appendChild(img);
      if (e.meta && e.meta.reviewColor){
        const badge = document.createElement('div');
        badge.className = 'flag-badge';
        badge.style.background = e.meta.reviewColor;
        card.appendChild(badge);
      }
      card.addEventListener('click', (ev) => {
        if (ctxMenuEl) return;
        if (ev.shiftKey){ toggleStickyCompare(e.base); return; }
        openImageCardModal(e);
      });
      card.addEventListener('contextmenu', (ev) => { ev.preventDefault(); openImageOptionsMenu(e, ev.clientX, ev.clientY); });
      attachLongPress(card, (ev) => openImageOptionsMenu(e, ev.clientX, ev.clientY));
      if (e.tags.length){
        const hoverTags = document.createElement('div');
        hoverTags.className = 'compact-hover-tags';
        hoverTags.textContent = e.tags.join(', ');
        card.appendChild(hoverTags);
      }
      frag.appendChild(card);
    });
    compactGrid.appendChild(frag);
    renderCompactCompareArea();
  }

  function toggleStickyCompare(base){
    const idx = stickyCompareImages.indexOf(base);
    if (idx === -1) stickyCompareImages.push(base);
    else stickyCompareImages.splice(idx, 1);
    renderCompactGrid();
  }

  function renderCompactCompareArea(){
    const stickyEntries = stickyCompareImages.map(b => entryByBase.get(b)).filter(Boolean);
    if (stickyEntries.length === 0){
      compactCompareArea.style.display = 'none';
      return;
    }
    compactCompareArea.style.display = 'block';
    compareCount.textContent = stickyEntries.length;

    const allTags = new Set();
    stickyEntries.forEach(e => e.tags.forEach(t => allTags.add(t)));
    const tagList = Array.from(allTags).sort((a,b) => a.localeCompare(b));

    compactCompareTable.innerHTML = '';

    const headerRow = document.createElement('div');
    headerRow.className = 'compare-row compare-header-row';
    const corner = document.createElement('div');
    corner.className = 'compare-cell compare-corner';
    headerRow.appendChild(corner);
    stickyEntries.forEach(e => {
      const cell = document.createElement('div');
      cell.className = 'compare-cell compare-img-cell';
      const img = document.createElement('img');
      img.src = e.objectUrl;
      const rm = document.createElement('button');
      rm.textContent = '✕';
      rm.title = 'Remove from comparison';
      rm.addEventListener('click', () => toggleStickyCompare(e.base));
      cell.appendChild(img);
      cell.appendChild(rm);
      headerRow.appendChild(cell);
    });
    compactCompareTable.appendChild(headerRow);

    for (const tag of tagList){
      const row = document.createElement('div');
      row.className = 'compare-row';
      const labelCell = document.createElement('div');
      labelCell.className = 'compare-cell compare-label-cell';
      labelCell.textContent = tag;
      row.appendChild(labelCell);
      stickyEntries.forEach(e => {
        const cell = document.createElement('div');
        cell.className = 'compare-cell';
        if (e.tags.includes(tag)){
          cell.appendChild(buildChip(e, tag, () => renderCompactCompareArea(), null));
        } else {
          const addBtn = document.createElement('button');
          addBtn.textContent = '+ add';
          addBtn.title = `Add "${tag}" to this image`;
          addBtn.addEventListener('click', () => {
            addTagToEntry(e, tag);
            renderCompactCompareArea();
            refreshRightPanels();
          });
          cell.appendChild(addBtn);
        }
        row.appendChild(cell);
      });
      compactCompareTable.appendChild(row);
    }
  }

  btnClearCompare.addEventListener('click', () => {
    stickyCompareImages = [];
    renderCompactGrid();
  });


  function buildCard(e, tagIndex){
    const card = document.createElement('div');
    card.className = 'card' + (e.dirty ? ' dirty' : '') + (e.tags.length===0 ? ' untagged' : '') + (e.disabled ? ' disabled-card' : '') + (e.meta && e.meta.reviewColor ? ' flagged' : '') + (e.meta && e.meta.blurred ? ' manually-blurred' : '');
    card.dataset.base = e.base;
    if (e.meta && e.meta.reviewColor) card.style.setProperty('--card-flag-color', e.meta.reviewColor);
    if (!e.disabled){
      card.draggable = true;
      card.addEventListener('dragstart', (ev) => {
        ev.dataTransfer.setData('text/plain', e.base);
        ev.dataTransfer.effectAllowed = 'move';
      });
    }

    const thumbwrap = document.createElement('div');
    thumbwrap.className = 'thumbwrap';

    if (masterTagModeActive){
      const selCb = document.createElement('input');
      selCb.type = 'checkbox';
      selCb.className = 'master-select-cb';
      selCb.checked = masterSelectedImages.has(e.base);
      selCb.addEventListener('click', (ev) => ev.stopPropagation());
      selCb.addEventListener('change', () => {
        if (selCb.checked) masterSelectedImages.add(e.base);
        else masterSelectedImages.delete(e.base);
        renderMasterSelectionSummary();
      });
      thumbwrap.appendChild(selCb);
    }
    const img = document.createElement('img');
    img.src = e.objectUrl;
    img.loading = 'lazy';
    thumbwrap.appendChild(img);

    const menuBtn = document.createElement('button');
    menuBtn.className = 'img-menu-btn';
    menuBtn.textContent = '⋯';
    menuBtn.title = 'More options';
    menuBtn.addEventListener('click', (ev) => { ev.stopPropagation(); openImageOptionsMenu(e, ev.clientX, ev.clientY); });
    thumbwrap.appendChild(menuBtn);

    if (e.meta && e.meta.reviewColor){
      const badge = document.createElement('div');
      badge.className = 'flag-badge';
      badge.style.background = e.meta.reviewColor;
      thumbwrap.appendChild(badge);
    }
    if (showTagCountBadges){
      const countBadge = document.createElement('div');
      countBadge.className = 'tagcount-badge';
      countBadge.textContent = e.tags.length;
      thumbwrap.appendChild(countBadge);
    }
    if (e.meta && e.meta.note){
      const noteBadge = document.createElement('div');
      noteBadge.className = 'note-badge';
      noteBadge.textContent = '📝';
      noteBadge.title = 'Click to edit note';
      noteBadge.addEventListener('click', (ev) => { ev.stopPropagation(); openNoteEditor(e); });
      thumbwrap.appendChild(noteBadge);
    }

    const fn = document.createElement('div');
    fn.className = 'filename';
    fn.textContent = e.imgName;
    thumbwrap.appendChild(fn);

    if (e.dirty){
      const dot = document.createElement('div');
      dot.className = 'dirtydot';
      thumbwrap.appendChild(dot);
    }

    thumbwrap.addEventListener('click', () => {
      if (ctxMenuEl) return;
      openImageCardModal(e);
    });
    thumbwrap.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      openImageOptionsMenu(e, ev.clientX, ev.clientY);
    });
    attachLongPress(thumbwrap, (ev) => openImageOptionsMenu(e, ev.clientX, ev.clientY));

    const tagbox = document.createElement('div');
    tagbox.className = 'tagbox';

    if (e.meta && e.meta.noteAlwaysVisible && e.meta.note){
      const noteVis = document.createElement('div');
      noteVis.className = 'card-note-visible';
      noteVis.textContent = e.meta.note;
      tagbox.appendChild(noteVis);
    }

    const chiprow = document.createElement('div');
    chiprow.className = 'chiprow';
    for (const tag of orderedTagsForDisplay(e, tagIndex)){
      chiprow.appendChild(buildChip(e, tag, () => { renderGallery(); refreshRightPanels(); refreshStats(); }, tagIndex));
    }
    tagbox.appendChild(chiprow);

    const addInput = document.createElement('input');
    addInput.type = 'text';
    addInput.className = 'addtag-input';
    addInput.placeholder = '+ add tag';
    addInput.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' && addInput.value.trim()){
        addTagToEntry(e, addInput.value.trim());
        addInput.value = '';
        closeAutocomplete();
        renderGallery();
        refreshRightPanels();
      }
    });
    attachTagAutocomplete(addInput, () => e, () => { renderGallery(); refreshRightPanels(); });
    tagbox.appendChild(addInput);

    card.appendChild(thumbwrap);
    card.appendChild(tagbox);
    return card;
  }

  // ---------------- Single image view rendering ----------------

  let singleZoom = 100;
  let singlePanX = 0, singlePanY = 0;
  let lastSingleBase = null;

  function renderMultiCompareView(){
    singleViewEl.innerHTML = '';
    singlePos.textContent = `${masterSelectedImages.size} selected`;
    singlePrevBtn.disabled = true;
    singleNextBtn.disabled = true;

    const selectedEntries = Array.from(masterSelectedImages).map(b => entryByBase.get(b)).filter(Boolean);
    const allTags = new Set();
    selectedEntries.forEach(e => e.tags.forEach(t => allTags.add(t)));
    const tagList = Array.from(allTags).sort((a,b) => a.localeCompare(b));

    const wrap = document.createElement('div');
    wrap.className = 'multicompare-wrap';

    const header = document.createElement('div');
    header.className = 'multicompare-header';
    header.innerHTML = `<span>Comparing ${selectedEntries.length} selected image(s) — ${tagList.length} unique tag(s)</span>`;
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear selection';
    clearBtn.addEventListener('click', () => {
      masterSelectedImages.clear();
      renderMasterSelectionSummary();
      renderCurrentView();
    });
    header.appendChild(clearBtn);
    wrap.appendChild(header);

    if (tagList.length === 0){
      const empty = document.createElement('div');
      empty.className = 'single-empty';
      empty.textContent = 'None of the selected images have any tags yet.';
      wrap.appendChild(empty);
      singleViewEl.appendChild(wrap);
      return;
    }

    const table = document.createElement('div');
    table.className = 'multicompare-table';

    const headRow = document.createElement('div');
    headRow.className = 'mc-row mc-head-row';
    const headName = document.createElement('div');
    headName.className = 'mc-cell mc-tagname';
    headName.textContent = 'Tag';
    const headOwners = document.createElement('div');
    headOwners.className = 'mc-cell mc-owners';
    headOwners.textContent = `Images with this tag (of ${selectedEntries.length})`;
    headRow.appendChild(headName);
    headRow.appendChild(headOwners);
    table.appendChild(headRow);

    for (const tag of tagList){
      const owners = selectedEntries.filter(e => e.tags.includes(tag));
      const row = document.createElement('div');
      row.className = 'mc-row';

      const nameCell = document.createElement('div');
      nameCell.className = 'mc-cell mc-tagname';
      const nameInput = document.createElement('input');
      nameInput.type = 'text';
      nameInput.value = tag;
      nameInput.title = 'Change this to rename the tag across all selected images that have it';
      nameInput.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter'){
          const newName = nameInput.value.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
          if (newName && newName !== tag) renameTagAcrossEntries(tag, newName, owners);
        }
      });
      nameCell.appendChild(nameInput);
      row.appendChild(nameCell);

      const ownersCell = document.createElement('div');
      ownersCell.className = 'mc-cell mc-owners';
      const nonOwners = selectedEntries.filter(e => !e.tags.includes(tag));
      owners.forEach(e => {
        const ownerRow = document.createElement('div');
        ownerRow.className = 'mc-owner-row';
        ownerRow.textContent = e.imgName;
        ownerRow.title = 'Click to remove or replace this tag on this image';
        ownerRow.addEventListener('click', (ev) => {
          openMultiCompareTagMenu(e, tag, ev.clientX, ev.clientY);
        });
        ownersCell.appendChild(ownerRow);
      });
      nonOwners.forEach(e => {
        const missingRow = document.createElement('div');
        missingRow.className = 'mc-owner-row mc-owner-missing';
        missingRow.textContent = `+ add to ${e.imgName}`;
        missingRow.title = `Add "${tag}" to this image too`;
        missingRow.addEventListener('click', () => {
          addTagToEntry(e, tag);
          renderMultiCompareView();
          refreshRightPanels();
        });
        ownersCell.appendChild(missingRow);
      });
      row.appendChild(ownersCell);
      table.appendChild(row);
    }

    wrap.appendChild(table);
    singleViewEl.appendChild(wrap);
  }

  function renameTagAcrossEntries(oldTag, newTag, entriesList){
    const affected = [];
    for (const e of entriesList){
      if (!e.tags.includes(oldTag)) continue;
      const prevTags = e.tags.slice();
      let newTags = e.tags.map(t => t === oldTag ? newTag : t);
      newTags = Array.from(new Set(newTags));
      e.tags = newTags;
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: newTags.slice() });
    }
    if (affected.length === 0) return;
    const summary = `Renamed "${oldTag}" → "${newTag}" across ${affected.length} selected image(s).`;
    toast(summary);
    recordChange('rename', summary, affected);
    folderStats.master_ops = (folderStats.master_ops || 0) + 1;
    saveFolderStats();
    refreshAllUI();
    checkAchievements();
  }

  function openMultiCompareTagMenu(entry, tag, x, y){
    closeTagContextMenu();
    const menu = document.createElement('div');
    menu.className = 'ctx-menu';
    const header = document.createElement('div');
    header.className = 'ctx-header';
    header.textContent = entry.imgName;
    menu.appendChild(header);
    addCtxItem(menu, `Remove "${tag}" from this image`, () => {
      removeTagFromEntry(entry, tag);
      closeTagContextMenu();
      renderMultiCompareView();
    });
    const sep = document.createElement('div');
    sep.className = 'ctx-sep';
    sep.textContent = 'Or replace it on this image:';
    menu.appendChild(sep);
    const replaceRow = document.createElement('div');
    replaceRow.style.cssText = 'display:flex; gap:6px; padding:2px 8px 8px;';
    const replaceInput = document.createElement('input');
    replaceInput.type = 'text';
    replaceInput.placeholder = 'replace with…';
    replaceInput.style.flex = '1';
    replaceInput.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' && replaceInput.value.trim()){
        removeTagFromEntry(entry, tag);
        addTagToEntry(entry, replaceInput.value.trim());
        closeTagContextMenu();
        renderMultiCompareView();
      }
    });
    replaceRow.appendChild(replaceInput);
    menu.appendChild(replaceRow);
    document.body.appendChild(menu);
    ctxMenuEl = menu;
    positionMenu(menu, x, y);
    setTimeout(() => document.addEventListener('click', onDocClickCloseMenu), 0);
  }

  function renderSingleView(){
    if (masterSelectedImages.size > 1){
      renderMultiCompareView();
      return;
    }
    const list = filteredEntries();
    if (singleIndex >= list.length) singleIndex = list.length - 1;
    if (singleIndex < 0) singleIndex = 0;

    singlePos.textContent = list.length ? `${singleIndex + 1} / ${list.length}` : '0 / 0';
    singlePrevBtn.disabled = list.length === 0 || singleIndex <= 0;
    singleNextBtn.disabled = list.length === 0 || singleIndex >= list.length - 1;

    singleViewEl.innerHTML = '';
    if (list.length === 0){
      const empty = document.createElement('div');
      empty.className = 'single-empty';
      empty.textContent = 'No images match the current filter.';
      singleViewEl.appendChild(empty);
      return;
    }

    const e = list[singleIndex];
    if (e.base !== lastSingleBase){
      singleZoom = 100; singlePanX = 0; singlePanY = 0;
      lastSingleBase = e.base;
    }

    const wrap = document.createElement('div');
    wrap.className = 'single-wrap';

    const imgSide = document.createElement('div');
    imgSide.className = 'single-img-side';
    imgSide.style.position = 'relative';
    imgSide.style.overflow = 'hidden';

    const img = document.createElement('img');
    img.src = e.objectUrl;
    img.draggable = false;
    img.style.transformOrigin = 'center center';
    img.style.transform = `translate(${singlePanX}px, ${singlePanY}px) scale(${singleZoom/100})`;
    img.style.cursor = 'grab';
    imgSide.appendChild(img);

    const menuBtn = document.createElement('button');
    menuBtn.className = 'img-menu-btn';
    menuBtn.style.left = '10px';
    menuBtn.style.top = '10px';
    menuBtn.textContent = '⋯';
    menuBtn.title = 'More options';
    menuBtn.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    menuBtn.addEventListener('click', (ev) => { ev.stopPropagation(); openImageOptionsMenu(e, ev.clientX, ev.clientY); });
    imgSide.appendChild(menuBtn);

    function applyTransform(){
      img.style.transform = `translate(${singlePanX}px, ${singlePanY}px) scale(${singleZoom/100})`;
    }

    function zoomBy(delta, clientX, clientY){
      const prevZoom = singleZoom;
      singleZoom = Math.max(100, Math.min(400, singleZoom + delta));
      if (singleZoom === prevZoom) return;
      zoomSlider.value = String(singleZoom);
      zoomVal.textContent = singleZoom + '%';
      applyTransform();
      if (singleZoom > (folderStats.zoom_max || 0)){
        folderStats.zoom_max = singleZoom;
        saveFolderStats();
        checkAchievements();
      }
    }

    let isPanning = false, panStartX = 0, panStartY = 0, panOrigX = 0, panOrigY = 0;

    imgSide.addEventListener('contextmenu', (ev) => ev.preventDefault());
    imgSide.addEventListener('pointerdown', (ev) => {
      if (ev.button === 0 || ev.button === 2){
        isPanning = true;
        panStartX = ev.clientX; panStartY = ev.clientY;
        panOrigX = singlePanX; panOrigY = singlePanY;
        imgSide.setPointerCapture(ev.pointerId);
        img.style.cursor = 'grabbing';
        ev.preventDefault();
      }
    });
    imgSide.addEventListener('pointermove', (ev) => {
      if (isPanning){
        singlePanX = panOrigX + (ev.clientX - panStartX);
        singlePanY = panOrigY + (ev.clientY - panStartY);
        applyTransform();
      }
    });
    imgSide.addEventListener('pointerup', (ev) => {
      if (isPanning){ isPanning = false; img.style.cursor = 'grab'; try { imgSide.releasePointerCapture(ev.pointerId); } catch(err){} }
    });
    imgSide.addEventListener('wheel', (ev) => {
      ev.preventDefault();
      const delta = ev.deltaY < 0 ? 20 : -20;
      zoomBy(delta, ev.clientX, ev.clientY);
    }, { passive: false });
    attachPinchZoom(imgSide, (delta) => zoomBy(delta));

    const panel = document.createElement('div');
    panel.className = 'single-panel';

    const nameEl = document.createElement('div');
    nameEl.className = 'single-name';
    nameEl.textContent = e.imgName + (e.width ? ` · ${e.width}×${e.height}` : '') + ` · ${e.tags.length} tags`;
    panel.appendChild(nameEl);

    const zoomRow = document.createElement('div');
    zoomRow.style.cssText = 'display:flex; gap:8px; align-items:center;';
    const zoomLabel = document.createElement('span');
    zoomLabel.style.cssText = 'font-size:11px; color:var(--text-faint);';
    zoomLabel.textContent = 'Zoom';
    const zoomSlider = document.createElement('input');
    zoomSlider.type = 'range'; zoomSlider.min = '100'; zoomSlider.max = '400'; zoomSlider.step = '10';
    zoomSlider.value = String(singleZoom);
    zoomSlider.style.flex = '1';
    const zoomVal = document.createElement('span');
    zoomVal.style.cssText = 'font-family:var(--mono); font-size:11px; min-width:42px; text-align:right;';
    zoomVal.textContent = singleZoom + '%';
    zoomSlider.addEventListener('input', () => {
      singleZoom = parseInt(zoomSlider.value, 10);
      zoomVal.textContent = singleZoom + '%';
      applyTransform();
      if (singleZoom > (folderStats.zoom_max || 0)){
        folderStats.zoom_max = singleZoom;
        saveFolderStats();
        checkAchievements();
      }
    });
    const zoomResetBtn = document.createElement('button');
    zoomResetBtn.textContent = 'Reset';
    zoomResetBtn.addEventListener('click', () => {
      singleZoom = 100; singlePanX = 0; singlePanY = 0;
      zoomSlider.value = '100'; zoomVal.textContent = '100%';
      applyTransform();
    });
    zoomRow.appendChild(zoomLabel);
    zoomRow.appendChild(zoomSlider);
    zoomRow.appendChild(zoomVal);
    zoomRow.appendChild(zoomResetBtn);
    panel.appendChild(zoomRow);
    const zoomHint = document.createElement('div');
    zoomHint.style.cssText = 'font-size:10.5px; color:var(--text-faint);';
    zoomHint.textContent = 'Click and drag (either button) to pan. Scroll the mouse wheel over the image to zoom.';
    panel.appendChild(zoomHint);

    if (e.disabled){
      const badge = document.createElement('div');
      badge.className = 'single-disabled-badge';
      badge.textContent = 'Disabled — hidden from active dataset';
      panel.appendChild(badge);
    }

    if (e.meta && e.meta.noteAlwaysVisible && e.meta.note){
      const noteVis = document.createElement('div');
      noteVis.className = 'card-note-visible';
      noteVis.textContent = e.meta.note;
      panel.appendChild(noteVis);
    }

    const singleTagIndex = buildTagIndex();
    const chiprow = document.createElement('div');
    chiprow.className = 'chiprow';
    for (const tag of orderedTagsForDisplay(e, singleTagIndex)){
      chiprow.appendChild(buildChip(e, tag, () => { renderSingleView(); refreshRightPanels(); refreshStats(); }, singleTagIndex));
    }
    panel.appendChild(chiprow);

    const addInput = document.createElement('input');
    addInput.type = 'text';
    addInput.className = 'addtag-input';
    addInput.placeholder = '+ add tag, press Enter';
    addInput.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' && addInput.value.trim()){
        addTagToEntry(e, addInput.value.trim());
        addInput.value = '';
        closeAutocomplete();
        renderSingleView();
        refreshRightPanels();
      }
    });
    attachTagAutocomplete(addInput, () => e, () => { renderSingleView(); refreshRightPanels(); });
    panel.appendChild(addInput);

    const btnRow = document.createElement('div');
    btnRow.className = 'single-btn-row';
    const toggleBtn = document.createElement('button');
    if (e.disabled){
      toggleBtn.textContent = 'Restore to dataset';
      toggleBtn.className = 'primary';
    } else {
      toggleBtn.textContent = 'Disable (move to /Disabled)';
      toggleBtn.className = 'danger-ghost';
    }
    toggleBtn.addEventListener('click', () => moveEntry(e, !e.disabled));
    btnRow.appendChild(toggleBtn);
    panel.appendChild(btnRow);

    wrap.appendChild(imgSide);
    wrap.appendChild(panel);
    singleViewEl.appendChild(wrap);
  }

  // ---------------- Chips + tag context menu ----------------

  function computeIsolatedTagSet(tagIndex){
    const set = new Set();
    for (const [tag, imgs] of tagIndex){
      if (imgs.size <= 2) set.add(tag);
    }
    return set;
  }

  function orderedTagsForDisplay(entry, tagIndex){
    let tags = entry.tags.slice();
    if (cardTagSortMode === 'alphabetical'){
      tags.sort((a,b) => a.localeCompare(b));
    } else if (cardTagSortMode === 'frequency' && tagIndex){
      tags.sort((a,b) => (tagIndex.get(b) ? tagIndex.get(b).size : 0) - (tagIndex.get(a) ? tagIndex.get(a).size : 0));
    }

    const searchTerms = (galleryFilter.terms || []);
    const isolatedSet = (isolatedFlagActive && tagIndex) ? computeIsolatedTagSet(tagIndex) : null;
    if (searchTerms.length || isolatedSet){
      const matched = [], isolated = [], rest = [];
      for (const t of tags){
        const lower = t.toLowerCase();
        const isSearchMatch = searchTerms.some(term => lower.includes(term));
        const isIsolated = isolatedSet && isolatedSet.has(t);
        if (isSearchMatch) matched.push(t);
        else if (isIsolated) isolated.push(t);
        else rest.push(t);
      }
      tags = matched.concat(isolated, rest);
    }
    return tags;
  }

  function tagDisplayFlags(tag, tagIndex){
    const searchTerms = (galleryFilter.terms || []);
    const lower = tag.toLowerCase();
    const isMatch = searchTerms.some(term => lower.includes(term));
    const isIsolated = isolatedFlagActive && tagIndex && (tagIndex.get(tag) ? tagIndex.get(tag).size <= 2 : false);
    return { isMatch, isIsolated };
  }

  function buildChip(entry, tag, onChange, tagIndex){
    const chip = document.createElement('span');
    chip.className = 'chip';
    if (selectedTags.has(tag)) chip.classList.add('selected');
    const isFlaggedForReview = entry.meta && entry.meta.flaggedTags && entry.meta.flaggedTags.includes(tag);
    if (isFlaggedForReview){
      chip.classList.add('chip-flagged-review');
    } else if (tagIndex){
      const flags = tagDisplayFlags(tag, tagIndex);
      if (flags.isMatch) chip.classList.add('chip-match');
      else if (flags.isIsolated) chip.classList.add('chip-isolated');
    }
    const label = document.createElement('span');
    label.textContent = tag;
    label.title = 'Click (or right-click) for tag options';
    label.style.cursor = 'pointer';
    label.addEventListener('click', (ev) => {
      ev.stopPropagation();
      openTagContextMenu(entry, tag, ev.clientX, ev.clientY);
    });
    label.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      openTagContextMenu(entry, tag, ev.clientX, ev.clientY);
    });
    attachLongPress(label, (ev) => openTagContextMenu(entry, tag, ev.clientX, ev.clientY));
    const rm = document.createElement('button');
    rm.textContent = '×';
    rm.title = 'Remove this tag from this image';
    rm.addEventListener('click', (ev) => {
      ev.stopPropagation();
      removeTagFromEntry(entry, tag);
      onChange();
    });
    chip.appendChild(label);
    chip.appendChild(rm);
    return chip;
  }

  // ---------------- Floating image card modal (grid click) ----------------

  let modalZoom = 100, modalPanX = 0, modalPanY = 0;

  let modalCloseTimer = null;
  let currentModalBase = null;

  function openImageCardModal(entry, opts){
    const isHoverPreview = !!(opts && opts.hover);
    if (modalCloseTimer){ clearTimeout(modalCloseTimer); modalCloseTimer = null; }
    closeTagContextMenu();
    if (currentModalBase !== entry.base){
      modalZoom = 100; modalPanX = 0; modalPanY = 0;
      renderImageCardModal(entry);
      currentModalBase = entry.base;
    }
    imageCardModal.style.display = 'flex';
    requestAnimationFrame(() => requestAnimationFrame(() => imageCardModal.classList.add('modal-visible')));
    if (!isHoverPreview){
      folderStats.card_modal_opens = (folderStats.card_modal_opens || 0) + 1;
      saveFolderStats();
      checkAchievements();
    }
  }

  function closeImageCardModal(){
    if (modalCloseTimer) clearTimeout(modalCloseTimer);
    imageCardModal.classList.remove('modal-visible');
    modalCloseTimer = setTimeout(() => {
      imageCardModal.style.display = 'none';
      modalCardInner.innerHTML = '';
      currentModalBase = null;
      modalCloseTimer = null;
    }, 180);
  }

  imageCardModal.addEventListener('click', (ev) => {
    if (ev.target === imageCardModal) closeImageCardModal();
  });

  function renderImageCardModal(entry){
    modalCardInner.innerHTML = '';

    const imgSide = document.createElement('div');
    imgSide.className = 'single-img-side';
    imgSide.style.position = 'relative';
    imgSide.style.overflow = 'hidden';
    imgSide.style.flex = '1';

    const img = document.createElement('img');
    img.src = entry.objectUrl;
    img.draggable = false;
    img.style.transformOrigin = 'center center';
    img.style.cursor = 'grab';
    function applyModalTransform(){
      img.style.transform = `translate(${modalPanX}px, ${modalPanY}px) scale(${modalZoom/100})`;
    }
    applyModalTransform();
    imgSide.appendChild(img);

    let panning = false, sx = 0, sy = 0, ox = 0, oy = 0;
    imgSide.addEventListener('contextmenu', ev => ev.preventDefault());
    imgSide.addEventListener('pointerdown', ev => {
      if (ev.button === 0 || ev.button === 2){
        panning = true; sx = ev.clientX; sy = ev.clientY; ox = modalPanX; oy = modalPanY;
        imgSide.setPointerCapture(ev.pointerId);
        img.style.cursor = 'grabbing';
        ev.preventDefault();
      }
    });
    imgSide.addEventListener('pointermove', ev => {
      if (panning){
        modalPanX = ox + (ev.clientX - sx);
        modalPanY = oy + (ev.clientY - sy);
        applyModalTransform();
      }
    });
    imgSide.addEventListener('pointerup', ev => {
      if (panning){ panning = false; img.style.cursor = 'grab'; try { imgSide.releasePointerCapture(ev.pointerId); } catch(err){} }
    });
    imgSide.addEventListener('wheel', ev => {
      ev.preventDefault();
      modalZoom = Math.max(100, Math.min(400, modalZoom + (ev.deltaY < 0 ? 20 : -20)));
      zoomSlider.value = String(modalZoom);
      zoomVal.textContent = modalZoom + '%';
      applyModalTransform();
    }, { passive: false });
    attachPinchZoom(imgSide, (delta) => {
      modalZoom = Math.max(100, Math.min(400, modalZoom + delta));
      zoomSlider.value = String(modalZoom);
      zoomVal.textContent = modalZoom + '%';
      applyModalTransform();
    });

    const panel = document.createElement('div');
    panel.className = 'single-panel';
    panel.style.position = 'relative';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close-btn ghost-close';
    closeBtn.textContent = '✕ Close';
    closeBtn.addEventListener('click', closeImageCardModal);
    panel.appendChild(closeBtn);

    const nameEl = document.createElement('div');
    nameEl.className = 'single-name';
    nameEl.textContent = entry.imgName + (entry.width ? ` · ${entry.width}×${entry.height}` : '') + ` · ${entry.tags.length} tags`;
    panel.appendChild(nameEl);

    const zoomRow = document.createElement('div');
    zoomRow.style.cssText = 'display:flex; gap:8px; align-items:center;';
    const zoomSlider = document.createElement('input');
    zoomSlider.type = 'range'; zoomSlider.min = '100'; zoomSlider.max = '400'; zoomSlider.step = '10';
    zoomSlider.value = String(modalZoom);
    zoomSlider.style.flex = '1';
    const zoomVal = document.createElement('span');
    zoomVal.style.cssText = 'font-family:var(--mono); font-size:11px; min-width:42px; text-align:right;';
    zoomVal.textContent = modalZoom + '%';
    zoomSlider.addEventListener('input', () => {
      modalZoom = parseInt(zoomSlider.value, 10);
      zoomVal.textContent = modalZoom + '%';
      applyModalTransform();
    });
    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset';
    resetBtn.addEventListener('click', () => {
      modalZoom = 100; modalPanX = 0; modalPanY = 0;
      zoomSlider.value = '100'; zoomVal.textContent = '100%';
      applyModalTransform();
    });
    zoomRow.appendChild(zoomSlider);
    zoomRow.appendChild(zoomVal);
    zoomRow.appendChild(resetBtn);
    panel.appendChild(zoomRow);

    const modalTagIndex = buildTagIndex();
    const chiprow = document.createElement('div');
    chiprow.className = 'chiprow';
    for (const tag of orderedTagsForDisplay(entry, modalTagIndex)){
      chiprow.appendChild(buildChip(entry, tag, () => { renderImageCardModal(entry); refreshRightPanels(); refreshStats(); }, modalTagIndex));
    }
    panel.appendChild(chiprow);

    const addInput = document.createElement('input');
    addInput.type = 'text';
    addInput.className = 'addtag-input';
    addInput.placeholder = '+ add tag, press Enter';
    addInput.addEventListener('keydown', ev => {
      if (ev.key === 'Enter' && addInput.value.trim()){
        addTagToEntry(entry, addInput.value.trim());
        addInput.value = '';
        closeAutocomplete();
        renderImageCardModal(entry);
        refreshRightPanels();
      }
    });
    attachTagAutocomplete(addInput, () => entry, () => renderImageCardModal(entry));
    panel.appendChild(addInput);

    modalCardInner.appendChild(imgSide);
    modalCardInner.appendChild(panel);
  }

  function tokenizeTag(tag){
    const parts = tag.split(/[\s_\-]+/).map(p => p.trim()).filter(Boolean);
    const uniq = Array.from(new Set(parts));
    return uniq.length > 1 ? uniq : [];
  }

  function addCtxItem(menu, label, onClick){
    const btn = document.createElement('button');
    btn.className = 'ctx-item';
    btn.textContent = label;
    btn.addEventListener('click', (ev) => {
      // Without this, the click bubbles to the document-level listener that
      // closes panels on an outside click — which would immediately close
      // whatever panel this item just opened (e.g. Tag Details), since the
      // click's target is this menu button, not the panel.
      ev.stopPropagation();
      onClick(ev);
    });
    menu.appendChild(btn);
  }

  function openTagContextMenu(entry, tag, x, y){
    closeTagContextMenu();
    const index = buildTagIndex();
    const set = index.get(tag) || new Set();

    const menu = document.createElement('div');
    menu.className = 'ctx-menu';

    const header = document.createElement('div');
    header.className = 'ctx-header';
    header.textContent = `${tag} · ${set.size} image${set.size===1?'':'s'}`;
    menu.appendChild(header);

    addCtxItem(menu, selectedTags.has(tag) ? 'Deselect tag (merge pool)' : 'Select tag for merge', () => {
      toggleTagSelection(tag);
      closeTagContextMenu();
    });
    addCtxItem(menu, 'Show all images WITH this tag', () => {
      setContainsFilter(tag);
      closeTagContextMenu();
    });
    addCtxItem(menu, 'Show all images WITHOUT this tag', () => {
      setExcludesFilter(tag);
      closeTagContextMenu();
    });
    addCtxItem(menu, '📖 Tag Details', () => {
      closeTagContextMenu();
      openTagDetails(tag);
    });

    if (entry){
      const flagged = entry.meta && entry.meta.flaggedTags && entry.meta.flaggedTags.includes(tag);
      addCtxItem(menu, flagged ? '🚩 Unflag this tag on this image' : '🚩 Flag this tag for review (this image)', () => {
        if (!entry.meta.flaggedTags) entry.meta.flaggedTags = [];
        if (flagged) entry.meta.flaggedTags = entry.meta.flaggedTags.filter(t => t !== tag);
        else entry.meta.flaggedTags.push(tag);
        entryMeta[entry.base] = entry.meta;
        saveEntryMeta();
        closeTagContextMenu();
        renderCurrentView();
      });
    }

    const words = tokenizeTag(tag);
    if (words.length > 1){
      const sep = document.createElement('div');
      sep.className = 'ctx-sep';
      sep.textContent = 'View keyword family within this tag:';
      menu.appendChild(sep);
      const wordsRow = document.createElement('div');
      wordsRow.className = 'ctx-words';
      for (const w of words){
        const b = document.createElement('button');
        b.textContent = w;
        b.addEventListener('click', () => {
          setContainsFilter(w);
          closeTagContextMenu();
        });
        wordsRow.appendChild(b);
      }
      menu.appendChild(wordsRow);
    }

    document.body.appendChild(menu);
    ctxMenuEl = menu;
    positionMenu(menu, x, y);
    setTimeout(() => document.addEventListener('click', onDocClickCloseMenu), 0);
  }

  function positionMenu(menu, x, y){
    const pad = 8;
    const rect = menu.getBoundingClientRect();
    let left = x, top = y;
    if (left + rect.width + pad > window.innerWidth) left = window.innerWidth - rect.width - pad;
    if (top + rect.height + pad > window.innerHeight) top = window.innerHeight - rect.height - pad;
    menu.style.left = Math.max(pad, left) + 'px';
    menu.style.top = Math.max(pad, top) + 'px';
  }

  function onDocClickCloseMenu(ev){
    if (!ctxMenuEl) return;
    const path = typeof ev.composedPath === 'function' ? ev.composedPath() : [];
    if (path.includes(ctxMenuEl)) return; // click landed inside the menu, even if that node was rebuilt mid-click
    closeTagContextMenu();
  }

  function closeTagContextMenu(){
    if (ctxMenuEl){ ctxMenuEl.remove(); ctxMenuEl = null; }
    document.removeEventListener('click', onDocClickCloseMenu);
  }

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape'){
      if (imageCardModal.style.display === 'flex'){ closeImageCardModal(); return; }
      if (ctxMenuEl){ closeTagContextMenu(); return; }
      if (viewMode === 'single'){ switchView('grid'); return; }
    }
    if (viewMode === 'single' && !ctxMenuEl){
      if (ev.key === 'ArrowLeft' && !singlePrevBtn.disabled){ singleIndex--; renderSingleView(); }
      if (ev.key === 'ArrowRight' && !singleNextBtn.disabled){ singleIndex++; renderSingleView(); }
    }
  });

  function markDirty(entry){
    entry.dirty = true;
    updateDirtyUI();
  }

  function resetImageEdits(entry){
    const relevant = editLog.filter(le =>
      le.affected && le.affected.some(a => a.base === entry.base && a.prevTags) &&
      le.type !== 'restore' && le.type !== 'disable' && le.type !== 'undo' && le.type !== 'redo' && le.type !== 'reset-edits'
    );
    if (relevant.length === 0){ toast('No edit history found for this image yet.'); return; }
    const first = relevant[0];
    const affectedItem = first.affected.find(a => a.base === entry.base);
    const prevTags = entry.tags.slice();
    entry.tags = affectedItem.prevTags.slice();
    markDirty(entry);
    recordChange('reset-edits', `Reset ${entry.imgName} to its earliest known tag state.`,
      [{ base: entry.base, prevTags, newTags: entry.tags.slice() }]);
    refreshAllUI();
    toast('Reverted this image to its earliest known state.');
  }

  // ---------------- Image options menu (3-dot): text/language, review flag, notes ----------------

  function hasForeignLangTag(entry){
    return entry.tags.find(t => / text$/.test(t) && t !== 'text');
  }

  function saveCommonLanguages(){
    try { localStorage.setItem('dts-common-languages', JSON.stringify(commonLanguages)); } catch(e){}
  }
  (function loadCommonLanguages(){
    try {
      const saved = JSON.parse(localStorage.getItem('dts-common-languages') || 'null');
      if (Array.isArray(saved) && saved.length) commonLanguages = saved;
    } catch(e){}
  })();

  const FLAG_COLORS = ['#e8a33d', '#e2637a', '#6fb8d1', '#7fbf8f', '#a683e0'];
  const KOMA_OPTIONS = ['1koma', '2koma', '3koma', '4koma'];

  function openNoteEditor(entry){
    closeTagContextMenu();
    const menu = document.createElement('div');
    menu.className = 'ctx-menu';
    menu.style.minWidth = '260px';
    const header = document.createElement('div');
    header.className = 'ctx-header';
    header.textContent = `Note — ${entry.imgName}`;
    menu.appendChild(header);

    const noteArea = document.createElement('textarea');
    noteArea.style.cssText = 'width:calc(100% - 16px); margin:0 8px; min-height:80px; background:var(--bg-elevated); color:var(--text-primary); border:1px solid var(--border-strong); border-radius:var(--radius); font-family:var(--sans); font-size:12px; padding:6px;';
    noteArea.value = entry.meta.note || '';
    menu.appendChild(noteArea);

    const visRow = document.createElement('label');
    visRow.className = 'ach-toggle-row';
    visRow.style.padding = '6px 8px';
    const visCb = document.createElement('input');
    visCb.type = 'checkbox';
    visCb.checked = !!entry.meta.noteAlwaysVisible;
    visRow.appendChild(visCb);
    visRow.appendChild(document.createTextNode(' Always show on card'));
    menu.appendChild(visRow);

    const saveBtn = document.createElement('button');
    saveBtn.className = 'primary ctx-item';
    saveBtn.textContent = 'Save note';
    saveBtn.addEventListener('click', () => {
      const wasEmpty = !entry.meta.note;
      entry.meta.note = noteArea.value;
      entry.meta.noteAlwaysVisible = visCb.checked;
      entryMeta[entry.base] = entry.meta;
      saveEntryMeta();
      if (wasEmpty && noteArea.value.trim()){
        folderStats.notes_written = (folderStats.notes_written || 0) + 1;
        saveFolderStats();
        checkAchievements();
      }
      toast('Note saved.');
      closeTagContextMenu();
      renderCurrentView();
    });
    menu.appendChild(saveBtn);

    document.body.appendChild(menu);
    ctxMenuEl = menu;
    positionMenu(menu, window.innerWidth/2 - 140, window.innerHeight/2 - 100);
    setTimeout(() => document.addEventListener('click', onDocClickCloseMenu), 0);
  }

  function openImageOptionsMenu(entry, x, y){
    closeTagContextMenu();
    const menu = document.createElement('div');
    menu.className = 'ctx-menu';
    menu.style.minWidth = '270px';

    const header = document.createElement('div');
    header.className = 'ctx-header';
    header.textContent = `${entry.imgName} · ${entry.tags.length} tag${entry.tags.length===1?'':'s'}`;
    menu.appendChild(header);

    const toggleDisableBtn = document.createElement('button');
    toggleDisableBtn.className = 'ctx-item';
    toggleDisableBtn.textContent = entry.disabled ? '↩ Restore to dataset' : '🗑 Disable (move to /Disabled)';
    toggleDisableBtn.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      await moveEntry(entry, !entry.disabled);
      toggleDisableBtn.textContent = entry.disabled ? '↩ Restore to dataset' : '🗑 Disable (move to /Disabled)';
    });
    menu.appendChild(toggleDisableBtn);

    const resetEditsBtn = document.createElement('button');
    resetEditsBtn.className = 'ctx-item';
    resetEditsBtn.textContent = '⏮ Reset this image to earliest known tags';
    resetEditsBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      resetImageEdits(entry);
    });
    menu.appendChild(resetEditsBtn);

    // --- Text / language / comic / koma / speech bubble (draft, applied on demand) ---
    const foreignTagNow = hasForeignLangTag(entry);
    const draft = {
      hasText: entry.tags.includes('text'),
      isForeign: !!foreignTagNow,
      foreignLang: foreignTagNow ? foreignTagNow.replace(/ text$/, '') : '',
      isComic: entry.tags.includes('comic'),
      koma: entry.tags.find(t => KOMA_OPTIONS.includes(t)) || '',
      speechBubble: entry.tags.includes('speech bubble')
    };

    const sepText = document.createElement('div');
    sepText.className = 'ctx-sep';
    sepText.textContent = 'Text & panel options (configure, then Apply)';
    menu.appendChild(sepText);

    const textLabel = document.createElement('label');
    textLabel.className = 'ach-toggle-row';
    textLabel.style.padding = '6px 8px';
    const textCb = document.createElement('input');
    textCb.type = 'checkbox';
    textCb.checked = draft.hasText;
    textCb.addEventListener('change', () => {
      draft.hasText = textCb.checked;
      renderTextSubOptions();
    });
    textLabel.appendChild(textCb);
    textLabel.appendChild(document.createTextNode(' Has text'));
    menu.appendChild(textLabel);

    const textSubBlock = document.createElement('div');
    menu.appendChild(textSubBlock);

    function renderTextSubOptions(){
      textSubBlock.innerHTML = '';
      if (!draft.hasText) return;
      const jpBtn = document.createElement('button');
      jpBtn.className = 'ctx-item';
      jpBtn.textContent = (!draft.isForeign ? '● ' : '○ ') + 'Japanese (default)';
      jpBtn.addEventListener('click', (ev) => { ev.stopPropagation(); draft.isForeign = false; renderTextSubOptions(); });
      textSubBlock.appendChild(jpBtn);

      const foreignBtn = document.createElement('button');
      foreignBtn.className = 'ctx-item';
      foreignBtn.textContent = (draft.isForeign ? '● ' : '○ ') + 'Foreign language…';
      foreignBtn.addEventListener('click', (ev) => { ev.stopPropagation(); draft.isForeign = true; renderTextSubOptions(); renderLangChips(); });
      textSubBlock.appendChild(foreignBtn);

      if (draft.isForeign) renderLangChips();
    }

    function renderLangChips(){
      let chipsRow = textSubBlock.querySelector('.lang-picker-block');
      if (chipsRow) chipsRow.remove();
      const block = document.createElement('div');
      block.className = 'lang-picker-block';
      const label = document.createElement('div');
      label.className = 'ctx-sep';
      label.textContent = 'Common languages';
      block.appendChild(label);
      const row = document.createElement('div');
      row.style.padding = '2px 8px 6px';
      for (const lang of commonLanguages){
        const chip = document.createElement('span');
        chip.className = 'lang-common-chip' + (draft.foreignLang === lang.toLowerCase() ? ' active' : '');
        const nameSpan = document.createElement('span');
        nameSpan.textContent = lang;
        nameSpan.style.cursor = 'pointer';
        nameSpan.addEventListener('click', (ev) => { ev.stopPropagation(); draft.foreignLang = lang.toLowerCase(); renderTextSubOptions(); });
        const rm = document.createElement('button');
        rm.textContent = '✕';
        rm.title = 'Remove from common languages';
        rm.addEventListener('click', (ev) => {
          ev.stopPropagation();
          commonLanguages = commonLanguages.filter(l => l !== lang);
          saveCommonLanguages();
          renderTextSubOptions();
        });
        chip.appendChild(nameSpan);
        chip.appendChild(rm);
        row.appendChild(chip);
      }
      block.appendChild(row);
      const addRow = document.createElement('div');
      addRow.style.cssText = 'display:flex; gap:6px; padding:0 8px 8px;';
      const addInput = document.createElement('input');
      addInput.type = 'text';
      addInput.placeholder = 'Add language…';
      addInput.style.cssText = 'flex:1; font-size:12px;';
      addInput.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' && addInput.value.trim()){
          const lang = addInput.value.trim();
          if (!commonLanguages.includes(lang)){ commonLanguages.push(lang); saveCommonLanguages(); }
          draft.foreignLang = lang.toLowerCase();
          renderTextSubOptions();
        }
      });
      addRow.appendChild(addInput);
      block.appendChild(addRow);
      textSubBlock.appendChild(block);
    }

    renderTextSubOptions();

    const sepPanel = document.createElement('div');
    sepPanel.className = 'ctx-sep';
    sepPanel.textContent = 'Comic / panels';
    menu.appendChild(sepPanel);

    const comicLabel = document.createElement('label');
    comicLabel.className = 'ach-toggle-row';
    comicLabel.style.padding = '6px 8px';
    const comicCb = document.createElement('input');
    comicCb.type = 'checkbox';
    comicCb.checked = draft.isComic;
    comicCb.addEventListener('change', () => { draft.isComic = comicCb.checked; });
    comicLabel.appendChild(comicCb);
    comicLabel.appendChild(document.createTextNode(' Comic'));
    menu.appendChild(comicLabel);

    const komaRow = document.createElement('div');
    komaRow.className = 'ctx-words';
    const noneBtn = document.createElement('button');
    noneBtn.textContent = 'None';
    noneBtn.style.fontWeight = draft.koma === '' ? '700' : '400';
    noneBtn.addEventListener('click', (ev) => { ev.stopPropagation(); draft.koma = ''; Array.from(komaRow.children).forEach(b=>b.style.fontWeight='400'); noneBtn.style.fontWeight='700'; });
    komaRow.appendChild(noneBtn);
    for (const k of KOMA_OPTIONS){
      const b = document.createElement('button');
      b.textContent = k;
      b.style.fontWeight = draft.koma === k ? '700' : '400';
      b.addEventListener('click', (ev) => { ev.stopPropagation(); draft.koma = k; Array.from(komaRow.children).forEach(x=>x.style.fontWeight='400'); b.style.fontWeight='700'; });
      komaRow.appendChild(b);
    }
    menu.appendChild(komaRow);

    const bubbleLabel = document.createElement('label');
    bubbleLabel.className = 'ach-toggle-row';
    bubbleLabel.style.padding = '6px 8px';
    const bubbleCb = document.createElement('input');
    bubbleCb.type = 'checkbox';
    bubbleCb.checked = draft.speechBubble;
    bubbleCb.addEventListener('change', () => { draft.speechBubble = bubbleCb.checked; });
    bubbleLabel.appendChild(bubbleCb);
    bubbleLabel.appendChild(document.createTextNode(' Speech bubble'));
    menu.appendChild(bubbleLabel);

    const applyTextBtn = document.createElement('button');
    applyTextBtn.className = 'primary ctx-item';
    applyTextBtn.textContent = 'Apply text/panel tags';
    applyTextBtn.addEventListener('click', () => {
      if (draft.hasText){
        if (!entry.tags.includes('text')) addTagToEntry(entry, 'text');
        const existingForeign = hasForeignLangTag(entry);
        if (draft.isForeign && draft.foreignLang){
          if (existingForeign && existingForeign !== `${draft.foreignLang} text`) removeTagFromEntry(entry, existingForeign);
          if (!entry.tags.includes(`${draft.foreignLang} text`)) addTagToEntry(entry, `${draft.foreignLang} text`);
          folderStats.foreign_languages = Array.from(new Set([...(folderStats.foreign_languages||[]), draft.foreignLang]));
          saveFolderStats();
        } else if (existingForeign){
          removeTagFromEntry(entry, existingForeign);
        }
      } else {
        if (entry.tags.includes('text')) removeTagFromEntry(entry, 'text');
        const existingForeign = hasForeignLangTag(entry);
        if (existingForeign) removeTagFromEntry(entry, existingForeign);
      }
      if (draft.isComic && !entry.tags.includes('comic')) addTagToEntry(entry, 'comic');
      if (!draft.isComic && entry.tags.includes('comic')) removeTagFromEntry(entry, 'comic');
      const existingKoma = entry.tags.find(t => KOMA_OPTIONS.includes(t));
      if (existingKoma && existingKoma !== draft.koma) removeTagFromEntry(entry, existingKoma);
      if (draft.koma && !entry.tags.includes(draft.koma)) addTagToEntry(entry, draft.koma);
      if (draft.speechBubble && !entry.tags.includes('speech bubble')) addTagToEntry(entry, 'speech bubble');
      if (!draft.speechBubble && entry.tags.includes('speech bubble')) removeTagFromEntry(entry, 'speech bubble');
      checkAchievements();
      toast('Applied.');
      closeTagContextMenu();
      renderCurrentView();
    });
    menu.appendChild(applyTextBtn);

    // --- Review flag (limited palette) ---
    const sep2 = document.createElement('div');
    sep2.className = 'ctx-sep';
    sep2.textContent = 'Flag for review';
    menu.appendChild(sep2);
    const flagRow = document.createElement('div');
    flagRow.style.cssText = 'display:flex; gap:6px; padding:4px 8px 8px; align-items:center; flex-wrap:wrap;';
    const swatchEls = [];
    for (const color of FLAG_COLORS){
      const sw = document.createElement('button');
      sw.style.cssText = `width:22px; height:22px; border-radius:5px; padding:0; background:${color}; border:2px solid ${entry.meta.reviewColor === color ? 'var(--text-primary)' : 'transparent'};`;
      sw.addEventListener('click', (ev) => {
        ev.stopPropagation();
        entry.meta.reviewColor = color;
        entryMeta[entry.base] = entry.meta;
        saveEntryMeta();
        folderStats.review_flags = (folderStats.review_flags || 0) + 1;
        saveFolderStats();
        checkAchievements();
        renderCurrentView();
        swatchEls.forEach(s => { s.style.borderColor = 'transparent'; });
        sw.style.borderColor = 'var(--text-primary)';
      });
      swatchEls.push(sw);
      flagRow.appendChild(sw);
    }
    const clearFlagBtn = document.createElement('button');
    clearFlagBtn.textContent = 'Clear';
    clearFlagBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      entry.meta.reviewColor = null;
      entryMeta[entry.base] = entry.meta;
      saveEntryMeta();
      renderCurrentView();
      swatchEls.forEach(s => { s.style.borderColor = 'transparent'; });
    });
    flagRow.appendChild(clearFlagBtn);
    menu.appendChild(flagRow);

    // --- Discrete mode (per-image blur) ---
    const blurLabel = document.createElement('label');
    blurLabel.className = 'ach-toggle-row';
    blurLabel.style.padding = '6px 8px';
    const blurCb = document.createElement('input');
    blurCb.type = 'checkbox';
    blurCb.checked = !!entry.meta.blurred;
    blurCb.addEventListener('change', () => {
      entry.meta.blurred = blurCb.checked;
      entryMeta[entry.base] = entry.meta;
      saveEntryMeta();
      renderCurrentView();
    });
    blurLabel.appendChild(blurCb);
    blurLabel.appendChild(document.createTextNode(' Blur this image (discrete mode)'));
    menu.appendChild(blurLabel);

    // --- Notes ---
    const sep3 = document.createElement('div');
    sep3.className = 'ctx-sep';
    sep3.textContent = 'Note';
    menu.appendChild(sep3);
    const noteArea = document.createElement('textarea');
    noteArea.style.width = 'calc(100% - 16px)';
    noteArea.style.margin = '0 8px';
    noteArea.style.minHeight = '60px';
    noteArea.style.background = 'var(--bg-elevated)';
    noteArea.style.color = 'var(--text-primary)';
    noteArea.style.border = '1px solid var(--border-strong)';
    noteArea.style.borderRadius = 'var(--radius)';
    noteArea.style.fontFamily = 'var(--sans)';
    noteArea.style.fontSize = '12px';
    noteArea.style.padding = '6px';
    noteArea.value = entry.meta.note || '';
    menu.appendChild(noteArea);

    const visRow = document.createElement('label');
    visRow.className = 'ach-toggle-row';
    visRow.style.padding = '6px 8px';
    const visCb = document.createElement('input');
    visCb.type = 'checkbox';
    visCb.checked = !!entry.meta.noteAlwaysVisible;
    visRow.appendChild(visCb);
    visRow.appendChild(document.createTextNode(' Always show on card'));
    menu.appendChild(visRow);

    const saveNoteBtn = document.createElement('button');
    saveNoteBtn.className = 'primary ctx-item';
    saveNoteBtn.textContent = 'Save note';
    saveNoteBtn.addEventListener('click', () => {
      const wasEmpty = !entry.meta.note;
      entry.meta.note = noteArea.value;
      entry.meta.noteAlwaysVisible = visCb.checked;
      entryMeta[entry.base] = entry.meta;
      saveEntryMeta();
      if (wasEmpty && noteArea.value.trim()){
        folderStats.notes_written = (folderStats.notes_written || 0) + 1;
        saveFolderStats();
        checkAchievements();
      }
      toast('Note saved.');
      closeTagContextMenu();
      renderCurrentView();
    });
    menu.appendChild(saveNoteBtn);

    document.body.appendChild(menu);
    ctxMenuEl = menu;
    positionMenu(menu, x, y);
    setTimeout(() => document.addEventListener('click', onDocClickCloseMenu), 0);
  }


  // ---------------- Wiki tag details ----------------

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

  async function ensureWikiDataLoaded(){
    if (wikiData) return wikiData;
    try {
      wikiData = await fetchGzipJson('./data/wiki.json.gz');
    } catch(err){
      wikiData = {};
    }
    return wikiData;
  }

  async function ensureAllTagsLoaded(){
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

  function getCustomTagNote(tag){
    try {
      const notes = JSON.parse(localStorage.getItem(CUSTOM_NOTES_KEY) || '{}');
      return notes[tag] || '';
    } catch(e){ return ''; }
  }
  function setCustomTagNote(tag, text){
    try {
      const notes = JSON.parse(localStorage.getItem(CUSTOM_NOTES_KEY) || '{}');
      notes[tag] = text;
      localStorage.setItem(CUSTOM_NOTES_KEY, JSON.stringify(notes));
    } catch(e){}
  }

  async function openTagDetails(tag){
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

  tagDetailsCloseBtn.addEventListener('click', () => hidePanel(tagDetailsPanel));

  function addTagToEntry(entry, tag){
    tag = tag.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
    if (!tag) return;
    if (!entry.tags.includes(tag)){
      const prevTags = entry.tags.slice();
      entry.tags.push(tag);
      markDirty(entry);
      refreshStats();
      recordChange('add-tag', `Added tag "${tag}" to ${entry.imgName}`,
        [{ base: entry.base, prevTags, newTags: entry.tags.slice() }]);
      trackStat('tags_added');
      checkAchievements();
    }
  }

  function removeTagFromEntry(entry, tag){
    const i = entry.tags.indexOf(tag);
    if (i !== -1){
      const prevTags = entry.tags.slice();
      entry.tags.splice(i, 1);
      markDirty(entry);
      refreshStats();
      recordChange('remove-tag', `Removed tag "${tag}" from ${entry.imgName}`,
        [{ base: entry.base, prevTags, newTags: entry.tags.slice() }]);
      trackStat('tags_removed');
      checkAchievements();
    }
  }

  // ---------------- Tag autocomplete (settings-gated) ----------------

  function closeAutocomplete(){
    hideInlineDefinition();
    if (autocompleteEl){ autocompleteEl.remove(); autocompleteEl = null; }
    document.removeEventListener('click', onDocClickCloseAutocomplete, true);
  }

  function onDocClickCloseAutocomplete(ev){
    if (!autocompleteEl) return;
    const path = typeof ev.composedPath === 'function' ? ev.composedPath() : [];
    if (path.includes(autocompleteEl)) return;
    closeAutocomplete();
  }

  function positionAutocomplete(rect){
    if (!autocompleteEl) return;
    autocompleteEl.style.width = Math.max(220, rect.width) + 'px';
    autocompleteEl.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - autocompleteEl.offsetWidth - 8)) + 'px';
    let top = rect.bottom + 4;
    if (top + autocompleteEl.offsetHeight + 8 > window.innerHeight) top = rect.top - autocompleteEl.offsetHeight - 4;
    autocompleteEl.style.top = Math.max(8, top) + 'px';
  }

  // Shows a small definition card nested under a hovered suggestion row —
  // falls back to a "write your own" prompt (reusing the same per-tag notes
  // store as the full Tag Details panel) when the bundled wiki has nothing.
  let acDefinitionHost = null; // the nested card currently shown, if any
  let acDefinitionTag = null;
  let acHideTimer = null;

  function hideInlineDefinition(){
    clearTimeout(acHideTimer);
    if (acDefinitionHost){ acDefinitionHost.remove(); acDefinitionHost = null; acDefinitionTag = null; }
  }

  function scheduleHideInlineDefinition(tag){
    clearTimeout(acHideTimer);
    acHideTimer = setTimeout(() => {
      if (acDefinitionTag === tag) hideInlineDefinition();
    }, 150);
  }

  function showInlineDefinition(afterRow, tag){
    clearTimeout(acHideTimer);
    if (acDefinitionTag === tag) return; // already showing this one
    hideInlineDefinition();
    const card = document.createElement('div');
    card.className = 'ac-flash-card';
    card.addEventListener('mouseenter', () => clearTimeout(acHideTimer));
    card.addEventListener('mouseleave', () => scheduleHideInlineDefinition(tag));
    afterRow.insertAdjacentElement('afterend', card);
    acDefinitionHost = card;
    acDefinitionTag = tag;

    const body = document.createElement('div');
    body.className = 'ac-flash-body';
    body.textContent = 'Loading…';
    card.appendChild(body);

    requestAnimationFrame(() => card.classList.add('show'));

    ensureWikiDataLoaded().then(wiki => {
      if (acDefinitionHost !== card) return; // hovered away (or dropdown closed) before this resolved
      const wikiKey = tag.replace(/ /g, '_');
      const def = wiki[wikiKey];
      const custom = !def ? getCustomTagNote(tag) : '';
      body.innerHTML = '';
      if (def || custom){
        const defEl = document.createElement('div');
        defEl.className = 'ac-flash-def';
        defEl.textContent = def || custom;
        body.appendChild(defEl);
      } else {
        const msg = document.createElement('div');
        msg.className = 'ac-flash-empty';
        msg.textContent = 'No definition yet — want to write one?';
        body.appendChild(msg);
        const ta = document.createElement('textarea');
        ta.placeholder = 'Describe this tag…';
        ta.rows = 2;
        ta.addEventListener('click', ev => ev.stopPropagation());
        body.appendChild(ta);
        const saveBtn = document.createElement('button');
        saveBtn.className = 'primary';
        saveBtn.textContent = 'Save definition';
        saveBtn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          setCustomTagNote(tag, ta.value);
          toast(`Saved your description for "${tag}".`);
          acDefinitionTag = null; // force showInlineDefinition to redraw with the saved note
          showInlineDefinition(afterRow, tag);
        });
        body.appendChild(saveBtn);
      }
    });
  }

  // Wires a "+ add tag" input to the autocomplete panel. Typing filters the
  // bundled 1M+ tag vocabulary (all_tags.json is pre-sorted by post count,
  // so an early-exit scan surfaces the most relevant matches first without
  // needing to index the whole file). Hovering a suggestion for a second
  // previews its definition; clicking one adds it to the entry and closes
  // the panel, same as pressing Enter on typed text.
  function attachTagAutocomplete(inputEl, getEntry, rerender){
    let debounceTimer = null;
    inputEl.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      if (!tagAutocompleteEnabled){ closeAutocomplete(); return; }
      const raw = inputEl.value.trim();
      if (!raw){ closeAutocomplete(); return; }
      debounceTimer = setTimeout(() => runAutocompleteSearch(inputEl, getEntry, rerender, raw), 150);
    });
    inputEl.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') closeAutocomplete();
    });
  }

  function runAutocompleteSearch(inputEl, getEntry, rerender, query){
    if (inputEl.value.trim() !== query) return; // stale by the time we're called
    ensureAllTagsLoaded().then(allTags => {
      if (inputEl.value.trim() !== query) return; // stale after the async load
      const qNorm = query.toLowerCase().replace(/_/g, ' ');
      const starts = [];
      const contains = [];
      let scanned = 0;
      for (const [key, meta] of allTags){
        const spaced = key.replace(/_/g, ' ');
        if (spaced.startsWith(qNorm)) starts.push([spaced, meta]);
        else if (spaced.includes(qNorm)) contains.push([spaced, meta]);
        scanned++;
        if (starts.length >= 30 || scanned >= 250000) break;
      }
      const results = starts.concat(contains).slice(0, 25);
      renderAutocompleteResults(inputEl, getEntry, rerender, results);
    });
  }

  function renderAutocompleteResults(inputEl, getEntry, rerender, results){
    if (!autocompleteEl){
      autocompleteEl = document.createElement('div');
      autocompleteEl.className = 'ac-panel';
      document.body.appendChild(autocompleteEl);
      document.addEventListener('click', onDocClickCloseAutocomplete, true);
    }
    autocompleteEl.innerHTML = '';
    if (results.length === 0){
      const empty = document.createElement('div');
      empty.className = 'ac-empty';
      empty.textContent = 'No matching tags in the vocabulary.';
      autocompleteEl.appendChild(empty);
    } else {
      const list = document.createElement('div');
      list.className = 'ac-list';
      for (const [tag, meta] of results){
        const row = document.createElement('div');
        row.className = 'ac-row';
        const name = document.createElement('span');
        name.className = 'ac-row-name';
        name.textContent = tag;
        row.appendChild(name);
        if (meta && typeof meta.count === 'number'){
          const cnt = document.createElement('span');
          cnt.className = 'ac-row-count';
          cnt.textContent = meta.count >= 1000 ? Math.round(meta.count/1000) + 'k' : String(meta.count);
          row.appendChild(cnt);
        }
        let hoverTimer = null;
        row.addEventListener('mouseenter', () => {
          clearTimeout(hoverTimer);
          hoverTimer = setTimeout(() => showInlineDefinition(row, tag), 1000);
        });
        row.addEventListener('mouseleave', () => {
          clearTimeout(hoverTimer);
          scheduleHideInlineDefinition(tag);
        });
        row.addEventListener('click', () => {
          const entry = getEntry();
          closeAutocomplete();
          if (!entry) return;
          addTagToEntry(entry, tag);
          inputEl.value = '';
          rerender();
          refreshRightPanels();
        });
        list.appendChild(row);
      }
      autocompleteEl.appendChild(list);
    }
    positionAutocomplete(inputEl.getBoundingClientRect());
  }

  // ---------------- Tag Pruner (search-or-browse, supports multiple docks) ----------------

  function renderTagPruners(){
    tagPrunerList.innerHTML = '';
    const index = buildTagIndex();
    tagPruners.forEach((pruner) => {
      const instance = document.createElement('div');
      instance.className = 'pruner-instance';

      const head = document.createElement('div');
      head.className = 'pruner-instance-head';
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'power-tool pt-dynamic';
      input.placeholder = 'Search tags, or leave empty to browse all…';
      input.value = pruner.filter;
      input.addEventListener('input', () => {
        pruner.filter = input.value;
        renderPrunerResults(pruner, resultsList, index);
      });
      head.appendChild(input);
      if (tagPruners.length > 1){
        const rmBtn = document.createElement('button');
        rmBtn.className = 'pruner-remove-btn danger-ghost';
        rmBtn.textContent = '✕';
        rmBtn.title = 'Remove this Tag Pruner';
        rmBtn.addEventListener('click', () => {
          tagPruners = tagPruners.filter(p => p.id !== pruner.id);
          renderTagPruners();
        });
        head.appendChild(rmBtn);
      }
      instance.appendChild(head);

      const resultsList = document.createElement('div');
      resultsList.className = 'pruner-instance-list';
      instance.appendChild(resultsList);

      tagPrunerList.appendChild(instance);
      renderPrunerResults(pruner, resultsList, index);
    });
  }

  function renderPrunerResults(pruner, resultsList, index){
    const q = pruner.filter.trim().toLowerCase();
    let list = Array.from(index.entries());
    if (q) list = list.filter(([tag]) => tag.toLowerCase().includes(q));
    list.sort((a,b) => q ? (b[1].size - a[1].size) : a[0].localeCompare(b[0]));

    resultsList.innerHTML = '';
    if (list.length === 0){
      resultsList.innerHTML = '<div class="match-row" style="cursor:default; color:var(--text-faint);">No tags match.</div>';
      return;
    }
    for (const [tag, set] of list){
      const row = document.createElement('label');
      row.className = 'match-row';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = selectedTags.has(tag);
      cb.addEventListener('change', () => {
        if (cb.checked) selectedTags.add(tag); else selectedTags.delete(tag);
        refreshRightPanels();
      });
      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = tag;
      const cnt = document.createElement('span');
      cnt.className = 'cnt';
      cnt.textContent = `${set.size}×`;
      row.appendChild(cb);
      row.appendChild(name);
      row.appendChild(cnt);
      resultsList.appendChild(row);
    }
  }

  function refreshTagPrunerChecksOnly(){
    tagPrunerList.querySelectorAll('.match-row').forEach(row => {
      const nameEl = row.querySelector('.name');
      const cb = row.querySelector('input[type="checkbox"]');
      if (nameEl && cb) cb.checked = selectedTags.has(nameEl.textContent);
    });
  }

  btnAddTagPruner.addEventListener('click', () => {
    tagPruners.push({ id: tagPrunerIdCounter++, filter: '' });
    renderTagPruners();
  });

  // ---------------- Selection summary + apply ----------------

  function refreshSelectionSummary(){
    if (selectedTags.size === 0){
      selectionSummary.textContent = 'No tags selected yet.';
      return;
    }
    const index = buildTagIndex();
    let totalImages = new Set();
    selectionSummary.innerHTML = '';
    for (const tag of selectedTags){
      const span = document.createElement('span');
      span.className = 'tk';
      span.textContent = tag;
      selectionSummary.appendChild(span);
      const set = index.get(tag);
      if (set) set.forEach(b => totalImages.add(b));
    }
    const footer = document.createElement('div');
    footer.style.marginTop = '6px';
    footer.style.color = 'var(--text-faint)';
    footer.textContent = `${selectedTags.size} tag${selectedTags.size===1?'':'s'} selected · affects ${totalImages.size} image${totalImages.size===1?'':'s'}`;
    selectionSummary.appendChild(footer);
  }

  function refreshRightPanels(){
    renderTagPruners();
    refreshSelectionSummary();
    document.querySelectorAll('.chip').forEach(chip => {
      const label = chip.querySelector('span');
      if (!label) return;
      chip.classList.toggle('selected', selectedTags.has(label.textContent));
    });
  }

  function toggleTagSelection(tag){
    if (selectedTags.has(tag)) selectedTags.delete(tag);
    else selectedTags.add(tag);
    refreshRightPanels();
  }

  btnClearSelection.addEventListener('click', () => {
    selectedTags.clear();
    refreshRightPanels();
  });

  // ---------------- Undo / redo (shared by toolbar buttons + log entries) ----------------

  function recordChange(type, summary, affected){
    const record = { type, summary, affected };
    undoStack.push(record);
    redoStack = [];
    updateUndoRedoButtons();
    pushLogEntry({ type, summary, affected });
    return record;
  }

  function applyTagDirection(affected, direction){
    let count = 0;
    for (const a of affected){
      const e = entryByBase.get(a.base);
      if (!e) continue;
      const target = direction === 'undo' ? a.prevTags : a.newTags;
      if (!target) continue;
      e.tags = target.slice();
      markDirty(e);
      count++;
    }
    return count;
  }

  function updateUndoRedoButtons(){
    btnUndo.disabled = undoStack.length === 0;
    btnRedo.disabled = redoStack.length === 0;
  }

  btnApplyUnify.addEventListener('click', () => {
    const unified = unifiedTagInput.value.trim();
    if (!unified){
      toast('Enter a name for the unified tag first.');
      return;
    }
    if (selectedTags.size === 0){
      toast('Select at least one tag to merge.');
      return;
    }

    const affected = [];
    for (const e of entries){
      if (e.disabled && !includeDisabledToggle.checked) continue;
      const hasAny = e.tags.some(t => selectedTags.has(t));
      if (!hasAny) continue;
      const prevTags = e.tags.slice();
      let newTags = e.tags.filter(t => !selectedTags.has(t));
      if (!newTags.includes(unified)) newTags.push(unified);
      e.tags = newTags;
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: newTags.slice() });
    }

    const mergeSummary = `Merged ${selectedTags.size} tag(s) into "${unified}" across ${affected.length} image(s).`;
    toast(mergeSummary);
    recordChange('merge', mergeSummary, affected);
    trackStat('merges');
    selectedTags.clear();
    unifiedTagInput.value = '';
    refreshAllUI();
    checkAchievements();
  });

  btnVoidSelected.addEventListener('click', async () => {
    if (selectedTags.size === 0){
      toast('Select at least one tag to void.');
      return;
    }
    const tagList = Array.from(selectedTags);
    const preview = tagList.length > 4
      ? `${tagList.slice(0,4).join(', ')}, +${tagList.length - 4} more`
      : tagList.join(', ');
    const ok = await showConfirmModal(
      `Permanently remove ${tagList.length} tag(s) from every image?\n\n${preview}\n\n` +
      `This deletes them outright — nothing is merged into a replacement tag. Use Undo right after if you change your mind.`,
      { okLabel: 'Void tags', danger: true }
    );
    if (!ok) return;

    const affected = [];
    let voidedTagInstances = 0;
    for (const e of entries){
      if (e.disabled && !includeDisabledToggle.checked) continue;
      const hasAny = e.tags.some(t => selectedTags.has(t));
      if (!hasAny) continue;
      const prevTags = e.tags.slice();
      voidedTagInstances += e.tags.filter(t => selectedTags.has(t)).length;
      const newTags = e.tags.filter(t => !selectedTags.has(t));
      e.tags = newTags;
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: newTags.slice() });
    }

    const voidSummary = `Voided ${selectedTags.size} tag(s), removed from ${affected.length} image(s).`;
    toast(voidSummary);
    recordChange('void', voidSummary, affected);
    trackStat('voids');
    trackStat('voided_tag_instances', voidedTagInstances);
    checkVoidThemeAchievements(tagList, voidedTagInstances);
    selectedTags.clear();
    refreshAllUI();
    checkAchievements();
  });

  // Global tag tools (Find / Replace all / Find & replace) previously lived here,
  // superseded by the Master Tags tab which covers the same ground plus more.

  // ---------------- Quick Merge (finds tags that are the same thing typed differently) ----------------

  // Groups tags whose spelling only differs by case or separator style
  // (spaces/underscores/hyphens) — underscores are already folded to spaces
  // on load, so in practice this mostly surfaces case variants like
  // "Red Hair" vs "red hair", but it also catches stray hyphenated forms.
  function scanTagVariants(){
    const index = buildTagIndex();
    const byKey = new Map(); // normalized key -> [tag,...]
    for (const [tag] of index){
      const key = tag.toLowerCase().replace(/[\s_-]+/g, ' ').trim();
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push(tag);
    }
    const groups = [];
    for (const [key, tags] of byKey){
      if (tags.length < 2) continue;
      let canon = tags[0];
      let canonCount = index.get(canon).size;
      for (const t of tags){
        const c = index.get(t).size;
        if (c > canonCount || (c === canonCount && t < canon)){ canon = t; canonCount = c; }
      }
      groups.push({ key, canon, variants: tags.slice().sort() });
    }
    groups.sort((a, b) => a.key.localeCompare(b.key));
    return groups;
  }

  function renderQuickMergeVariantText(el, group, sel){
    const others = group.variants.filter(v => v !== sel.canon);
    el.textContent = others.length ? `also merges: ${others.join(', ')}` : '';
  }

  function renderQuickMergeList(){
    quickMergeList.innerHTML = '';
    if (quickMergeGroups.length === 0){
      const empty = document.createElement('div');
      empty.className = 'stats-empty';
      empty.textContent = 'No duplicate-spelling tags found. Scan again after editing tags.';
      quickMergeList.appendChild(empty);
      btnQuickMergeApply.style.display = 'none';
      return;
    }
    for (const group of quickMergeGroups){
      const sel = quickMergeSelection.get(group.key);
      const row = document.createElement('label');
      row.className = 'qm-row';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = sel.selected;
      cb.addEventListener('change', () => { sel.selected = cb.checked; });
      row.appendChild(cb);

      const body = document.createElement('div');
      body.style.flex = '1';

      const canonRow = document.createElement('div');
      canonRow.appendChild(document.createTextNode('Merge into: '));
      const canonSelect = document.createElement('select');
      canonSelect.className = 'qm-canon';
      for (const variant of group.variants){
        const opt = document.createElement('option');
        opt.value = variant;
        opt.textContent = variant;
        if (variant === sel.canon) opt.selected = true;
        canonSelect.appendChild(opt);
      }
      canonSelect.addEventListener('click', ev => ev.stopPropagation());
      canonSelect.addEventListener('change', () => {
        sel.canon = canonSelect.value;
        renderQuickMergeVariantText(variantsEl, group, sel);
      });
      canonRow.appendChild(canonSelect);
      body.appendChild(canonRow);

      const variantsEl = document.createElement('div');
      variantsEl.className = 'qm-variants';
      renderQuickMergeVariantText(variantsEl, group, sel);
      body.appendChild(variantsEl);

      row.appendChild(body);
      quickMergeList.appendChild(row);
    }
    btnQuickMergeApply.style.display = '';
  }

  btnQuickMergeScan.addEventListener('click', () => {
    quickMergeGroups = scanTagVariants();
    quickMergeSelection = new Map();
    for (const group of quickMergeGroups) quickMergeSelection.set(group.key, { selected: true, canon: group.canon });
    renderQuickMergeList();
    toast(quickMergeGroups.length
      ? `Found ${quickMergeGroups.length} duplicate-spelling group(s).`
      : 'No duplicate-spelling tags found.');
  });

  btnQuickMergeApply.addEventListener('click', async () => {
    const active = quickMergeGroups.filter(g => quickMergeSelection.get(g.key).selected);
    if (active.length === 0){
      toast('Select at least one group to merge.');
      return;
    }
    const ok = await showConfirmModal(
      `Merge ${active.length} duplicate-spelling group(s)? Each group's variants combine into the spelling you picked.`,
      { okLabel: 'Merge groups' }
    );
    if (!ok) return;

    const affectedMap = new Map(); // base -> {base, prevTags, newTags}
    let mergedVariants = 0;
    for (const group of active){
      const sel = quickMergeSelection.get(group.key);
      const canon = sel.canon;
      const variantSet = new Set(group.variants.filter(v => v !== canon));
      if (variantSet.size === 0) continue;
      mergedVariants += variantSet.size;
      for (const e of entries){
        if (e.disabled && !includeDisabledToggle.checked) continue;
        const hasAny = e.tags.some(t => variantSet.has(t));
        if (!hasAny) continue;
        if (!affectedMap.has(e.base)) affectedMap.set(e.base, { base: e.base, prevTags: e.tags.slice(), newTags: null });
        let newTags = e.tags.filter(t => !variantSet.has(t));
        if (!newTags.includes(canon)) newTags.push(canon);
        e.tags = newTags;
        markDirty(e);
        affectedMap.get(e.base).newTags = newTags.slice();
      }
    }

    const affected = Array.from(affectedMap.values());
    if (affected.length === 0){
      toast('Nothing to merge — selected groups had no effect.');
      return;
    }
    const summary = `Quick Merge: combined ${mergedVariants} duplicate-spelling tag(s) across ${active.length} group(s), affecting ${affected.length} image(s).`;
    toast(summary);
    recordChange('merge', summary, affected);
    trackStat('merges');
    quickMergeGroups = [];
    quickMergeSelection = new Map();
    renderQuickMergeList();
    refreshAllUI();
    checkAchievements();
  });

  // ---------------- Master Tag Control ----------------

  function updateMasterSelectionText(){
    if (masterSelectedImages.size === 0){
      masterSelectionSummary.textContent = 'No images selected yet.';
      return;
    }
    masterSelectionSummary.textContent = `${masterSelectedImages.size} image(s) selected.`;
  }

  function renderMasterMiniGrid(){
    masterMiniGrid.innerHTML = '';
    const list = filteredEntries();
    list.forEach(e => {
      const cell = document.createElement('div');
      cell.className = 'master-mini-cell' + (masterSelectedImages.has(e.base) ? ' selected' : '');
      cell.dataset.base = e.base;
      const img = document.createElement('img');
      img.src = e.objectUrl;
      img.loading = 'lazy';
      cell.appendChild(img);
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'master-mini-cb';
      cb.checked = masterSelectedImages.has(e.base);
      cb.addEventListener('click', (ev) => ev.stopPropagation());
      cb.addEventListener('change', () => {
        if (cb.checked) masterSelectedImages.add(e.base);
        else masterSelectedImages.delete(e.base);
        cell.classList.toggle('selected', cb.checked);
        updateMasterSelectionText();
        renderCurrentView();
      });
      cell.appendChild(cb);
      cell.addEventListener('click', () => {
        cb.checked = !cb.checked;
        cb.dispatchEvent(new Event('change'));
      });
      masterMiniGrid.appendChild(cell);
    });
  }

  function syncMasterMiniGrid(){
    masterMiniGrid.querySelectorAll('.master-mini-cell').forEach(cell => {
      const base = cell.dataset.base;
      const selected = masterSelectedImages.has(base);
      cell.classList.toggle('selected', selected);
      const cb = cell.querySelector('.master-mini-cb');
      if (cb) cb.checked = selected;
    });
  }

  function renderMasterSelectionSummary(){
    updateMasterSelectionText();
    syncMasterMiniGrid();
  }

  btnMasterSelectAll.addEventListener('click', () => {
    for (const e of filteredEntries()) masterSelectedImages.add(e.base);
    renderMasterSelectionSummary();
    renderCurrentView();
  });
  btnMasterClearSelection.addEventListener('click', () => {
    masterSelectedImages.clear();
    renderMasterSelectionSummary();
    renderCurrentView();
  });

  btnMasterApplyToSelected.addEventListener('click', () => {
    const tag = masterApplyTagInput.value.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
    if (!tag){ toast('Enter a tag to apply.'); return; }
    if (masterSelectedImages.size === 0){ toast('Select at least one image first.'); return; }
    const affected = [];
    for (const base of masterSelectedImages){
      const e = entryByBase.get(base);
      if (!e || e.tags.includes(tag)) continue;
      const prevTags = e.tags.slice();
      e.tags.push(tag);
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: e.tags.slice() });
    }
    if (affected.length === 0){ toast('Nothing to apply — selected images already have that tag.'); return; }
    const summary = `Applied "${tag}" to ${affected.length} selected image(s).`;
    toast(summary);
    recordChange('add-tag', summary, affected);
    folderStats.master_ops = (folderStats.master_ops || 0) + 1;
    saveFolderStats();
    masterApplyTagInput.value = '';
    refreshAllUI();
    checkAchievements();
  });

  btnMasterRemoveFromSelected.addEventListener('click', () => {
    const tag = masterRemoveTagInput.value.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
    if (!tag){ toast('Enter a tag to remove.'); return; }
    if (masterSelectedImages.size === 0){ toast('Select at least one image first.'); return; }
    const affected = [];
    for (const base of masterSelectedImages){
      const e = entryByBase.get(base);
      if (!e || !e.tags.includes(tag)) continue;
      const prevTags = e.tags.slice();
      e.tags = e.tags.filter(t => t !== tag);
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: e.tags.slice() });
    }
    if (affected.length === 0){ toast('None of the selected images have that tag.'); return; }
    const summary = `Removed "${tag}" from ${affected.length} selected image(s).`;
    toast(summary);
    recordChange('remove-tag', summary, affected);
    folderStats.master_ops = (folderStats.master_ops || 0) + 1;
    saveFolderStats();
    masterRemoveTagInput.value = '';
    refreshAllUI();
    checkAchievements();
  });

  btnCondApply.addEventListener('click', () => {
    const sourceTag = condSourceTag.value.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
    const addTag = condAddTag.value.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
    if (!sourceTag || !addTag){ toast('Fill in both tags.'); return; }
    const affected = [];
    for (const e of entries){
      if (e.disabled) continue;
      if (!e.tags.includes(sourceTag) || e.tags.includes(addTag)) continue;
      const prevTags = e.tags.slice();
      e.tags.push(addTag);
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: e.tags.slice() });
    }
    if (affected.length === 0){ toast(`No images with "${sourceTag}" are missing "${addTag}".`); return; }
    const summary = `Added "${addTag}" to every image with "${sourceTag}" (${affected.length} image(s)).`;
    toast(summary);
    recordChange('add-tag', summary, affected);
    folderStats.master_ops = (folderStats.master_ops || 0) + 1;
    saveFolderStats();
    condSourceTag.value = ''; condAddTag.value = '';
    refreshAllUI();
    checkAchievements();
  });

  btnMassApply.addEventListener('click', async () => {
    const tag = massApplyInput.value.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
    if (!tag){ toast('Enter a tag to apply.'); return; }
    const ok = await showConfirmModal(`Add "${tag}" to EVERY active image in this folder?`, { okLabel: 'Apply to all' });
    if (!ok) return;
    const affected = [];
    for (const e of entries){
      if (e.disabled || e.tags.includes(tag)) continue;
      const prevTags = e.tags.slice();
      e.tags.push(tag);
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: e.tags.slice() });
    }
    if (affected.length === 0){ toast('Every image already has that tag.'); return; }
    const summary = `Added "${tag}" to all ${affected.length} image(s).`;
    toast(summary);
    recordChange('add-tag', summary, affected);
    folderStats.master_ops = (folderStats.master_ops || 0) + 1;
    saveFolderStats();
    massApplyInput.value = '';
    refreshAllUI();
    checkAchievements();
  });

  btnMassRemove.addEventListener('click', async () => {
    const tag = massRemoveInput.value.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
    if (!tag){ toast('Enter a tag to remove.'); return; }
    const ok = await showConfirmModal(`Remove "${tag}" from EVERY active image in this folder?`, { okLabel: 'Remove from all', danger: true });
    if (!ok) return;
    const affected = [];
    for (const e of entries){
      if (e.disabled || !e.tags.includes(tag)) continue;
      const prevTags = e.tags.slice();
      e.tags = e.tags.filter(t => t !== tag);
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: e.tags.slice() });
    }
    if (affected.length === 0){ toast('No images have that tag.'); return; }
    const summary = `Removed "${tag}" from all ${affected.length} image(s).`;
    toast(summary);
    recordChange('remove-tag', summary, affected);
    folderStats.master_ops = (folderStats.master_ops || 0) + 1;
    saveFolderStats();
    massRemoveInput.value = '';
    refreshAllUI();
    checkAchievements();
  });

  btnMasterRename.addEventListener('click', () => {
    const from = masterRenameFrom.value.trim();
    const to = masterRenameTo.value.trim();
    if (!from || !to){ toast('Enter both a tag to rename and its replacement.'); return; }
    if (from === to){ toast('New name is the same as the old one.'); return; }
    const affected = [];
    for (const e of entries){
      if (e.disabled || !e.tags.includes(from)) continue;
      const prevTags = e.tags.slice();
      let newTags = e.tags.map(t => t === from ? to : t);
      newTags = Array.from(new Set(newTags));
      e.tags = newTags;
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: newTags.slice() });
    }
    if (affected.length === 0){ toast(`No active images currently have the tag "${from}".`); return; }
    const summary = `Renamed "${from}" → "${to}" across ${affected.length} image(s).`;
    toast(summary);
    recordChange('rename', summary, affected);
    folderStats.master_ops = (folderStats.master_ops || 0) + 1;
    saveFolderStats();
    trackStat('renames');
    masterRenameFrom.value = ''; masterRenameTo.value = '';
    refreshAllUI();
    checkAchievements();
  });

  btnMasterFR.addEventListener('click', () => {
    const find = masterFRFind.value;
    const repl = masterFRReplace.value;
    if (!find){ toast('Enter a substring to find.'); return; }
    const affected = [];
    for (const e of entries){
      if (e.disabled || !e.tags.some(t => t.includes(find))) continue;
      const prevTags = e.tags.slice();
      let newTags = e.tags.map(t => t.includes(find) ? t.split(find).join(repl) : t);
      newTags = newTags.map(t => t.trim()).filter(Boolean);
      newTags = Array.from(new Set(newTags));
      e.tags = newTags;
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: newTags.slice() });
    }
    if (affected.length === 0){ toast(`No tags contain "${find}".`); return; }
    const summary = `Replaced "${find}" → "${repl}" inside tags across ${affected.length} image(s).`;
    toast(summary);
    recordChange('find-replace', summary, affected);
    folderStats.master_ops = (folderStats.master_ops || 0) + 1;
    saveFolderStats();
    trackStat('find_replaces');
    masterFRFind.value = ''; masterFRReplace.value = '';
    refreshAllUI();
    checkAchievements();
  });

  btnUndo.addEventListener('click', () => {
    const record = undoStack.pop();
    if (!record) return;
    const count = applyTagDirection(record.affected, 'undo');
    redoStack.push(record);
    updateUndoRedoButtons();
    const summary = `Undid: ${record.summary}`;
    toast(count > 0 ? summary : 'Nothing to undo on the currently loaded images.');
    pushLogEntry({ type: 'undo', summary, affected: record.affected });
    trackStat('undos');
    refreshAllUI();
    checkAchievements();
  });

  btnRedo.addEventListener('click', () => {
    const record = redoStack.pop();
    if (!record) return;
    const count = applyTagDirection(record.affected, 'redo');
    undoStack.push(record);
    updateUndoRedoButtons();
    const summary = `Redid: ${record.summary}`;
    toast(count > 0 ? summary : 'Nothing to redo on the currently loaded images.');
    pushLogEntry({ type: 'redo', summary, affected: record.affected });
    trackStat('redos');
    refreshAllUI();
    checkAchievements();
  });

  // ---------------- Disable / restore images ----------------

  async function ensureDisabledDir(){
    if (!disabledDirHandle){
      disabledDirHandle = await dirHandle.getDirectoryHandle('Disabled', { create: true });
    }
    return disabledDirHandle;
  }

  async function moveEntry(entry, toDisabled){
    if (!dirHandle) return;
    try {
      const targetDir = toDisabled ? await ensureDisabledDir() : dirHandle;
      const sourceDir = toDisabled ? dirHandle : disabledDirHandle;

      const file = await entry.imgHandle.getFile();
      const newImgHandle = await targetDir.getFileHandle(entry.imgName, { create: true });
      const iw = await newImgHandle.createWritable();
      await iw.write(file);
      await iw.close();

      if (sourceDir){
        try { await sourceDir.removeEntry(entry.imgName); } catch(e){}
        try { await sourceDir.removeEntry(entry.txtName); } catch(e){}
      }
      entry.imgHandle = newImgHandle;

      if (entry.tags.length > 0){
        const newTxtHandle = await targetDir.getFileHandle(entry.txtName, { create: true });
        const tw = await newTxtHandle.createWritable();
        await tw.write(entry.tags.join(', '));
        await tw.close();
        entry.txtHandle = newTxtHandle;
        entry.txtExisted = true;
      } else {
        entry.txtHandle = null;
        entry.txtExisted = false;
      }

      entry.dirty = false;
      entry.disabled = toDisabled;

      toast(toDisabled
        ? `Moved "${entry.imgName}" to Disabled/. Filename kept as-is, so restoring slots it right back in.`
        : `Restored "${entry.imgName}" to the dataset root.`, 3200);
      pushLogEntry({
        type: toDisabled ? 'disable' : 'restore',
        summary: toDisabled ? `Disabled ${entry.imgName}` : `Restored ${entry.imgName}`,
        affected: [{ base: entry.base }]
      });
      trackStat(toDisabled ? 'disables' : 'restores');
      folderStats.moveCounts = folderStats.moveCounts || {};
      folderStats.moveCounts[entry.base] = (folderStats.moveCounts[entry.base] || 0) + 1;
      if (folderStats.moveCounts[entry.base] >= 6) folderStats.flag_indecisive = true;
      saveFolderStats();

      singleIndex = 0;
      refreshAllUI();
      checkAchievements();
    } catch(err){
      toast('Could not move that file — check folder permissions.', 3600);
    }
  }

  // ---------------- Save to disk ----------------

  btnSave.addEventListener('click', async () => {
    const dirty = entries.filter(e => e.dirty);
    if (dirty.length === 0) return;
    let ok = 0, fail = 0;
    for (const e of dirty){
      try {
        const targetDir = e.disabled ? disabledDirHandle : dirHandle;
        if (!targetDir) { fail++; continue; }
        if (!e.txtHandle){
          e.txtHandle = await targetDir.getFileHandle(e.txtName, { create: true });
        }
        const writable = await e.txtHandle.createWritable();
        await writable.write(e.tags.join(', '));
        await writable.close();
        e.dirty = false;
        e.txtExisted = true;
        ok++;
      } catch(err){
        fail++;
      }
    }
    updateDirtyUI();
    renderCurrentView();
    toast(fail === 0 ? `Saved ${ok} caption file(s).` : `Saved ${ok}, failed ${fail}. Check folder permissions.`, 3400);
  });

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

  // warn before closing tab with unsaved changes
  window.addEventListener('beforeunload', (e) => {
    if (entries.some(en => en.dirty)){
      e.preventDefault();
      e.returnValue = '';
    }
  });

  renderTagPruners();
  updateLogButton();
  loadWallet();
  updateThemeSelectLocks();
  switchTab('dataset');
  initDockSystem();

})();
