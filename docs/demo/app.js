(() => {
  // src/renderer/dom.ts
  function $(id) {
    return document.getElementById(id);
  }
  var btnHelp = $("btnHelp");
  var helpModal = $("helpModal");
  var helpToc = $("helpToc");
  var helpTocToggle = $("helpTocToggle");
  var helpContent = $("helpContent");
  var helpCloseBtn = $("helpCloseBtn");
  var btnOpen = $("btnOpen");
  var btnSave = $("btnSave");
  var autosaveToggle = $("autosaveToggle");
  var btnUndo = $("btnUndo");
  var btnRedo = $("btnRedo");
  var btnUnloadDataset = $("btnUnloadDataset");
  var btnReloadDataset = $("btnReloadDataset");
  var dirtyCountEl = $("dirtyCount");
  var galleryToolbar = $("galleryToolbar");
  var galleryGrid = $("galleryGrid");
  var compactGrid = $("compactGrid");
  var compactCompareArea = $("compactCompareArea");
  var compareCount = $("compareCount");
  var compactCompareTable = $("compactCompareTable");
  var btnClearCompare = $("btnClearCompare");
  var singleViewEl = $("singleView");
  var imageCardModal = $("imageCardModal");
  var modalCardInner = $("modalCardInner");
  var dropHint = $("dropHint");
  var dropHintWrap = $("dropHintWrap");
  var btnRandomFact = $("btnRandomFact");
  var randomFactDisplay = $("randomFactDisplay");
  var filterInput = $("filterInput");
  var filterSuggestions = $("filterSuggestions");
  var filterExactToggle = $("filterExactToggle");
  var filterMatchCount = $("filterMatchCount");
  var filterAllBtn = $("filterAll");
  var filterUntaggedBtn = $("filterUntagged");
  var filterDirtyBtn = $("filterDirty");
  var excludeBadge = $("excludeBadge");
  var excludeBadgeText = $("excludeBadgeText");
  var excludeBadgeClear = $("excludeBadgeClear");
  var tagFrequencyList = $("tagFrequencyList");
  var leftSortDropdown = $("leftSortDropdown");
  var leftSortDirBtn = $("leftSortDirBtn");
  var btnResetFamilyOrder = $("btnResetFamilyOrder");
  var btnOpenTagFrequencyList = $("btnOpenTagFrequencyList");
  var tagFamilyListArea = $("tagFamilyListArea");
  var btnClearFilter = $("btnClearFilter");
  var filterModeDropdown = $("filterModeDropdown");
  var btnFlagIsolated = $("btnFlagIsolated");
  var tagPrunerList = $("tagPrunerList");
  var btnAddTagPruner = $("btnAddTagPruner");
  var btnOpenTagPrunerList = $("btnOpenTagPrunerList");
  var unifyVoidRows = $("unifyVoidRows");
  var btnOpenUnifyVoidList = $("btnOpenUnifyVoidList");
  var includeDisabledToggle = $("includeDisabledToggle");
  var toastEl = $("toast");
  var themeSelect = $("themeSelect");
  var themeDropdown = $("themeDropdown");
  var btnThemeCustomize = $("btnThemeCustomize");
  var themeCustomPanel = $("themeCustomPanel");
  var themeVarRows = $("themeVarRows");
  var themeResetBtn = $("themeResetBtn");
  var themeApplyBtn = $("themeApplyBtn");
  var themeCloseBtn = $("themeCloseBtn");
  var btnQuit = $("btnQuit");
  var btnLeftDrawerToggle = $("btnLeftDrawerToggle");
  var btnRightDrawerToggle = $("btnRightDrawerToggle");
  var btnOverseerDrawerToggle = $("btnOverseerDrawerToggle");
  var drawerBackdrop = $("drawerBackdrop");
  var leftAside = $("left");
  var rightAside = $("right");
  var btnRightPanelCollapse = $("btnRightPanelCollapse");
  var rightPanelResizeHandle = $("rightPanelResizeHandle");
  var topbarActions = $("topbarActions");
  var btnResetEdibits = $("btnResetEdibits");
  var btnResetAchievements = $("btnResetAchievements");
  var fileCatBtn = $("fileCatBtn");
  var fileCatFlyout = $("fileCatFlyout");
  var personalizationCatBtn = $("personalizationCatBtn");
  var personalizationCatFlyout = $("personalizationCatFlyout");
  var flyoutOutsideCloseToggle = $("flyoutOutsideCloseToggle");
  var panelsOutsideCloseToggle = $("panelsOutsideCloseToggle");
  var pdropCloseOnSelectToggle = $("pdropCloseOnSelectToggle");
  var outsideClickSwallowToggle = $("outsideClickSwallowToggle");
  var uiAnimationsDropdown = $("uiAnimationsDropdown");
  var hwAccelToggle = $("hwAccelToggle");
  var btnSettings = $("btnSettings");
  var btnFavorites = $("btnFavorites");
  var favoritesPanel = $("favoritesPanel");
  var favoritesList = $("favoritesList");
  var btnAddFavorite = $("btnAddFavorite");
  var favoritesCloseBtn = $("favoritesCloseBtn");
  var btnLog = $("btnLog");
  var logPanel = $("logPanel");
  var logPanelTitle = $("logPanelTitle");
  var logList = $("logList");
  var btnExportLog = $("btnExportLog");
  var btnClearLog = $("btnClearLog");
  var canonicalTagsList = $("canonicalTagsList");
  var btnOpenCanonicalTagsList = $("btnOpenCanonicalTagsList");
  var btnAddCanonicalRule = $("btnAddCanonicalRule");
  var logCloseBtn = $("logCloseBtn");
  var appVersionEl = $("appVersion");
  var tabGallery = $("tabGallery");
  var tabMasterTags = $("tabMasterTags");
  var tabStats = $("tabStats");
  var galleryTab = $("galleryTab");
  var statsTab = $("statsTab");
  var tabDatasetManager = $("tabDatasetManager");
  var datasetManagerTab = $("datasetManagerTab");
  var dmGrid = $("dmGrid");
  var dmGridBtn = $("dmGridBtn");
  var dmListBtn = $("dmListBtn");
  var dmSortDropdown = $("dmSortDropdown");
  var btnStatsBack = $("btnStatsBack");
  var btnMasterBack = $("btnMasterBack");
  var btnGoToTagOverseer = $("btnGoToTagOverseer");
  var normalRightTools = $("normalRightTools");
  var btnResetDockLayout = $("btnResetDockLayout");
  var layoutDropdown = $("layoutDropdown");
  var shellEl = $("shell");
  var btnResetZoom = $("btnResetZoom");
  var btnExportAppState = $("btnExportAppState");
  var btnViewWd14TransferList = $("btnViewWd14TransferList");
  var powerHighlightToggle = $("powerHighlightToggle");
  var powerFillToggle = $("powerFillToggle");
  var tagAutocompleteToggle = $("tagAutocompleteToggle");
  var langAutoSelectToggle = $("langAutoSelectToggle");
  var btnStartPowerToolPicker = $("btnStartPowerToolPicker");
  var powerToolList = $("powerToolList");
  var btnResetCustomPowerTools = $("btnResetCustomPowerTools");
  var masterTagPanel = $("masterTagPanel");
  var masterSelectionSummary = $("masterSelectionSummary");
  var masterMiniGrid = $("masterMiniGrid");
  var btnOpenMasterMiniGrid = $("btnOpenMasterMiniGrid");
  var btnMasterSelectAll = $("btnMasterSelectAll");
  var btnMasterClearSelection = $("btnMasterClearSelection");
  var btnMasterLockSelected = $("btnMasterLockSelected");
  var btnMasterUnlockSelected = $("btnMasterUnlockSelected");
  var btnMasterMergeImmunizeSelected = $("btnMasterMergeImmunizeSelected");
  var btnMasterUnMergeImmunizeSelected = $("btnMasterUnMergeImmunizeSelected");
  var btnMasterAntivoidSelected = $("btnMasterAntivoidSelected");
  var btnMasterUnAntivoidSelected = $("btnMasterUnAntivoidSelected");
  var btnMasterAntimmunizeSelected = $("btnMasterAntimmunizeSelected");
  var btnMasterUnAntimmunizeSelected = $("btnMasterUnAntimmunizeSelected");
  var btnMasterDeleteSelected = $("btnMasterDeleteSelected");
  var masterApplyTagInput = $("masterApplyTagInput");
  var btnMasterApplyToSelected = $("btnMasterApplyToSelected");
  var masterRemoveTagInput = $("masterRemoveTagInput");
  var btnMasterRemoveFromSelected = $("btnMasterRemoveFromSelected");
  var condSourceTag = $("condSourceTag");
  var condAddTag = $("condAddTag");
  var btnCondApply = $("btnCondApply");
  var condWithoutSourceTag = $("condWithoutSourceTag");
  var condWithoutAddTag = $("condWithoutAddTag");
  var btnCondApplyWithout = $("btnCondApplyWithout");
  var massApplyInput = $("massApplyInput");
  var btnMassApply = $("btnMassApply");
  var massRemoveInput = $("massRemoveInput");
  var btnMassRemove = $("btnMassRemove");
  var masterRenameFrom = $("masterRenameFrom");
  var masterRenameTo = $("masterRenameTo");
  var btnMasterRename = $("btnMasterRename");
  var masterFRFind = $("masterFRFind");
  var masterFRReplace = $("masterFRReplace");
  var btnMasterFR = $("btnMasterFR");
  var btnWd14TagSelected = $("btnWd14TagSelected");
  var wd14Status = $("wd14Status");
  var wd14AutoApply = $("wd14AutoApply");
  var wd14Host = $("wd14Host");
  var wd14ModelSelect = $("wd14ModelSelect");
  var btnWd14RefreshModels = $("btnWd14RefreshModels");
  var wd14Threshold = $("wd14Threshold");
  var wd14CharThreshold = $("wd14CharThreshold");
  var wd14TrailingComma = $("wd14TrailingComma");
  var wd14ExcludeTags = $("wd14ExcludeTags");
  var wd14ModeRow = $("wd14ModeRow");
  var wd14ModeSelect = $("wd14ModeSelect");
  var wd14ComfyuiFields = $("wd14ComfyuiFields");
  var wd14LocalFields = $("wd14LocalFields");
  var wd14LocalModelSelect = $("wd14LocalModelSelect");
  var wd14LocalModelList = $("wd14LocalModelList");
  var wd14LocalCatalog = $("wd14LocalCatalog");
  var wd14LocalAddRepo = $("wd14LocalAddRepo");
  var btnWd14LocalDownload = $("btnWd14LocalDownload");
  var btnWd14LocalImport = $("btnWd14LocalImport");
  var wd14LocalDownloadStatus = $("wd14LocalDownloadStatus");
  var statsViewPie = $("statsViewPie");
  var statsViewBar = $("statsViewBar");
  var statsChartWrap = $("statsChartWrap");
  var statsLegend = $("statsLegend");
  var statsTotals = $("statsTotals");
  var btnAchievements = $("btnAchievements");
  var walletDisplay = $("walletDisplay");
  var achievementsPanel = $("achievementsPanel");
  var achWallet = $("achWallet");
  var achPopupsToggle = $("achPopupsToggle");
  var achList = $("achList");
  var achCloseBtn = $("achCloseBtn");
  var btnShop = $("btnShop");
  var shopPanel = $("shopPanel");
  var shopWallet = $("shopWallet");
  var shopList = $("shopList");
  var btnFreeEdibits = $("btnFreeEdibits");
  var shopCloseBtn = $("shopCloseBtn");
  var btnRefineTheme = $("btnRefineTheme");
  var suppressThemeFlourishesToggle = $("suppressThemeFlourishesToggle");
  var noFlourishHoverToggle = $("noFlourishHoverToggle");
  var noFlourishTiltToggle = $("noFlourishTiltToggle");
  var noFlourishAmbientToggle = $("noFlourishAmbientToggle");
  var tagDetailsPanel = $("tagDetailsPanel");
  var tagDetailsTitle = $("tagDetailsTitle");
  var tagDetailsBody = $("tagDetailsBody");
  var tagDetailsCloseBtn = $("tagDetailsCloseBtn");
  var langMenuPanel = $("langMenuPanel");
  var achievementPopupHost = $("achievementPopupHost");
  var btnNightMode = $("btnNightMode");
  var viewGridBtn = $("viewGridBtn");
  var viewCompactBtn = $("viewCompactBtn");
  var viewSingleBtn = $("viewSingleBtn");
  var viewDisabledBtn = $("viewDisabledBtn");
  var btnUnlockAll = $("btnUnlockAll");
  var btnHideTags = $("btnHideTags");
  var btnRenameAllImages = $("btnRenameAllImages");
  var gallerySortDropdown = $("gallerySortDropdown");
  var gallerySortDirBtn = $("gallerySortDirBtn");
  var singleNav = $("singleNav");
  var singlePrevBtn = $("singlePrevBtn");
  var singleNextBtn = $("singleNextBtn");
  var singlePos = $("singlePos");
  var fontSizeSlider = $("fontSizeSlider");
  var fontSizeVal = $("fontSizeVal");
  var settingsPanel = $("settingsPanel");
  var tabSynthDat = $("tabSynthDat");
  var synthDatTab = $("synthDatTab");
  var synthDatPromptFieldsDock = $("synthDatPromptFieldsDock");
  var synthDatCol1 = $("synthDatCol1");
  var btnSynthDatBack = $("btnSynthDatBack");
  var synthDatSkipRefImage = $("synthDatSkipRefImage");
  var synthDatRefImageSection = $("synthDatRefImageSection");
  var synthDatRefPreviewWrap = $("synthDatRefPreviewWrap");
  var synthDatRefPreview = $("synthDatRefPreview");
  var synthDatRefEmpty = $("synthDatRefEmpty");
  var synthDatResizedPreviewWrap = $("synthDatResizedPreviewWrap");
  var synthDatResizedPreview = $("synthDatResizedPreview");
  var synthDatResizedPreviewLabel = $("synthDatResizedPreviewLabel");
  var btnSynthDatPickImage = $("btnSynthDatPickImage");
  var btnSynthDatInterrogate = $("btnSynthDatInterrogate");
  var synthDatWd14Result = $("synthDatWd14Result");
  var synthDatTagAssign = $("synthDatTagAssign");
  var synthDatMigrateClearFirst = $("synthDatMigrateClearFirst");
  var btnSynthDatMigratePose = $("btnSynthDatMigratePose");
  var synthDatDiffModel = $("synthDatDiffModel");
  var synthDatUnetDatalist = $("synthDatUnetDatalist");
  var synthDatClip = $("synthDatClip");
  var synthDatClipDatalist = $("synthDatClipDatalist");
  var synthDatVae = $("synthDatVae");
  var synthDatVaeDatalist = $("synthDatVaeDatalist");
  var synthDatMainLora = $("synthDatMainLora");
  var synthDatMainLoraDatalist = $("synthDatMainLoraDatalist");
  var synthDatLoraDatalist = $("synthDatLoraDatalist");
  var synthDatLoraStackRows = $("synthDatLoraStackRows");
  var btnSynthDatAddLora = $("btnSynthDatAddLora");
  var btnSynthDatRefreshModels = $("btnSynthDatRefreshModels");
  var synthDatLLLiteStrength = $("synthDatLLLiteStrength");
  var synthDatLLLiteStartPercent = $("synthDatLLLiteStartPercent");
  var synthDatLLLiteEndPercent = $("synthDatLLLiteEndPercent");
  var synthDatLLLitePreserveWrapper = $("synthDatLLLitePreserveWrapper");
  var synthDatResizeFit = $("synthDatResizeFit");
  var synthDatResizeMethod = $("synthDatResizeMethod");
  var synthDatSampler = $("synthDatSampler");
  var synthDatScheduler = $("synthDatScheduler");
  var synthDatSteps1 = $("synthDatSteps1");
  var synthDatCfg1 = $("synthDatCfg1");
  var synthDatSteps2 = $("synthDatSteps2");
  var btnSynthDatPromptPanelToggle = $("btnSynthDatPromptPanelToggle");
  var btnSynthDatPromptPanelClose = $("btnSynthDatPromptPanelClose");
  var synthDatUnifiedPromptMode = $("synthDatUnifiedPromptMode");
  var synthDatUnifiedPromptRow = $("synthDatUnifiedPromptRow");
  var synthDatUnifiedPrompt = $("synthDatUnifiedPrompt");
  var synthDatSplitFieldsGroup = $("synthDatSplitFieldsGroup");
  var synthDatStripHairFaceRow = $("synthDatStripHairFaceRow");
  var synthDatGlobal = $("synthDatGlobal");
  var synthDatCharacter = $("synthDatCharacter");
  var synthDatCharacterTrigger = $("synthDatCharacterTrigger");
  var synthDatRating = $("synthDatRating");
  var synthDatHair = $("synthDatHair");
  var synthDatFace = $("synthDatFace");
  var synthDatChest = $("synthDatChest");
  var synthDatBody = $("synthDatBody");
  var synthDatClothes = $("synthDatClothes");
  var synthDatLimbs = $("synthDatLimbs");
  var synthDatSexual = $("synthDatSexual");
  var synthDatPose = $("synthDatPose");
  var synthDatScene = $("synthDatScene");
  var synthDatEffects = $("synthDatEffects");
  var synthDatExtra = $("synthDatExtra");
  var synthDatNegative = $("synthDatNegative");
  var synthDatHost = $("synthDatHost");
  var btnSynthDatConnect = $("btnSynthDatConnect");
  var synthDatConnStatus = $("synthDatConnStatus");
  var synthDatWidth = $("synthDatWidth");
  var btnSynthDatSwapReso = $("btnSynthDatSwapReso");
  var synthDatHeight = $("synthDatHeight");
  var synthDatResoWarning = $("synthDatResoWarning");
  var synthDatUse2Pass = $("synthDatUse2Pass");
  var synthDatSeed1 = $("synthDatSeed1");
  var synthDatSeed2 = $("synthDatSeed2");
  var synthDatDenoise2 = $("synthDatDenoise2");
  var btnSynthDatGenerate = $("btnSynthDatGenerate");
  var btnSynthDatStop = $("btnSynthDatStop");
  var synthDatGenStatus = $("synthDatGenStatus");
  var synthDatLivePreviewWrap = $("synthDatLivePreviewWrap");
  var synthDatLivePreview = $("synthDatLivePreview");
  var synthDatPreviewWrap = $("synthDatPreviewWrap");
  var synthDatPreview = $("synthDatPreview");
  var synthDatPreviewEmpty = $("synthDatPreviewEmpty");
  var btnSynthDatReinterrogateOutput = $("btnSynthDatReinterrogateOutput");
  var synthDatReinterrogateOverwrite = $("synthDatReinterrogateOverwrite");
  var synthDatReinterrogateResult = $("synthDatReinterrogateResult");
  var synthDatPassPickerRow = $("synthDatPassPickerRow");
  var synthDatPickPass1 = $("synthDatPickPass1");
  var synthDatPickPass2 = $("synthDatPickPass2");
  var synthDatPass1Thumb = $("synthDatPass1Thumb");
  var synthDatPass2Thumb = $("synthDatPass2Thumb");
  var synthDatStripHairFace = $("synthDatStripHairFace");
  var synthDatTagPreview = $("synthDatTagPreview");
  var synthDatRenameOnAccept = $("synthDatRenameOnAccept");
  var btnSynthDatAccept = $("btnSynthDatAccept");
  var btnSynthDatReject = $("btnSynthDatReject");

  // src/renderer/shared-ui.ts
  var PDROP_CLOSE_ON_SELECT_KEY = "dts-pdrop-close-on-select";
  (function initPdropCloseOnSelectPref() {
    let on = true;
    try {
      on = localStorage.getItem(PDROP_CLOSE_ON_SELECT_KEY) !== "0";
    } catch {
    }
    pdropCloseOnSelectToggle.checked = on;
  })();
  pdropCloseOnSelectToggle.addEventListener("change", () => {
    try {
      localStorage.setItem(PDROP_CLOSE_ON_SELECT_KEY, pdropCloseOnSelectToggle.checked ? "1" : "0");
    } catch {
    }
  });
  function pdropClosesOnSelect() {
    return pdropCloseOnSelectToggle.checked;
  }
  var OUTSIDE_CLICK_SWALLOW_KEY = "dts-outside-click-swallow";
  (function initOutsideClickSwallowPref() {
    let on = false;
    try {
      on = localStorage.getItem(OUTSIDE_CLICK_SWALLOW_KEY) === "1";
    } catch {
    }
    outsideClickSwallowToggle.checked = on;
  })();
  outsideClickSwallowToggle.addEventListener("change", () => {
    try {
      localStorage.setItem(OUTSIDE_CLICK_SWALLOW_KEY, outsideClickSwallowToggle.checked ? "1" : "0");
    } catch {
    }
  });
  function shouldSwallowOutsideClick() {
    return outsideClickSwallowToggle.checked;
  }
  var swallowNextClick = false;
  function markSwallowNextClick() {
    swallowNextClick = true;
  }
  document.addEventListener("click", (ev) => {
    if (!swallowNextClick) return;
    swallowNextClick = false;
    ev.stopPropagation();
    ev.preventDefault();
  }, true);
  var HTML_ESCAPE_MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => HTML_ESCAPE_MAP[c]);
  }
  function shrinkTextToFit(el, minFontPx = 9) {
    el.style.fontSize = "";
    const baseFontPx = parseFloat(getComputedStyle(el).fontSize);
    if (!baseFontPx || el.scrollWidth <= el.clientWidth) return;
    let fontPx = baseFontPx;
    while (fontPx > minFontPx && el.scrollWidth > el.clientWidth) {
      fontPx -= 0.5;
      el.style.fontSize = fontPx + "px";
    }
  }
  var openPdropClose = null;
  var openPdropOwnerPanel = null;
  var openPdropMenuEl = null;
  function closeAnyOpenPdrop() {
    if (openPdropClose) {
      const fn = openPdropClose;
      openPdropClose = null;
      openPdropOwnerPanel = null;
      openPdropMenuEl = null;
      fn();
    }
  }
  function closeOwnedPdropIfPanel(panelEl) {
    if (openPdropOwnerPanel === panelEl) closeAnyOpenPdrop();
  }
  function isClickInsideOwnedPdrop(panelEl, target) {
    return !!(openPdropMenuEl && openPdropOwnerPanel === panelEl && target instanceof Node && openPdropMenuEl.contains(target));
  }
  function closeAllFloatingPanels(exceptEl) {
    closeAnyOpenPdrop();
    document.querySelectorAll(".theme-panel.panel-visible").forEach((el) => {
      if (el !== exceptEl) hidePanel(el);
    });
  }
  function buildPersistentDropdown(container, options, getValue, onSelect) {
    container.innerHTML = "";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pdrop-btn";
    function currentLabel() {
      const found = options.find((o) => o.value === getValue());
      return found ? found.label : getValue();
    }
    function setLabel() {
      btn.textContent = currentLabel() + " \u25BE";
      shrinkTextToFit(btn);
    }
    btn.textContent = currentLabel() + " \u25BE";
    let menuEl = null;
    function closeMenu() {
      if (menuEl) {
        menuEl.remove();
        menuEl = null;
      }
      if (openPdropClose === closeMenu) {
        openPdropClose = null;
        openPdropOwnerPanel = null;
        openPdropMenuEl = null;
      }
    }
    function openMenu() {
      const ownPanel = container.closest(".theme-panel");
      closeAllFloatingPanels(ownPanel ?? void 0);
      menuEl = document.createElement("div");
      menuEl.className = "pdrop-menu";
      for (const opt of options) {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "pdrop-item" + (opt.value === getValue() ? " active" : "");
        item.textContent = opt.label;
        if (opt.title) item.title = opt.title;
        item.addEventListener("click", (ev) => {
          ev.stopPropagation();
          onSelect(opt.value);
          setLabel();
          menuEl.querySelectorAll(".pdrop-item").forEach((i) => i.classList.remove("active"));
          item.classList.add("active");
          if (pdropClosesOnSelect()) closeMenu();
        });
        menuEl.appendChild(item);
      }
      document.body.appendChild(menuEl);
      const rect = btn.getBoundingClientRect();
      positionMenu(menuEl, rect.left, rect.bottom + 4);
      openPdropClose = closeMenu;
      openPdropOwnerPanel = ownPanel;
      openPdropMenuEl = menuEl;
    }
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (menuEl) closeMenu();
      else openMenu();
    });
    document.addEventListener("click", (ev) => {
      if (!menuEl || !flyoutOutsideCloseToggle.checked) return;
      const target = ev.target;
      if (menuEl.contains(target) || container.contains(target)) return;
      closeMenu();
      if (shouldSwallowOutsideClick()) {
        ev.stopPropagation();
        ev.preventDefault();
      }
    }, true);
    container.appendChild(btn);
    shrinkTextToFit(btn);
    return { refreshLabel: setLabel };
  }
  function attachPinchZoom(el, onZoomDelta) {
    let startDist = null;
    function dist(touches) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }
    el.addEventListener("touchstart", (ev) => {
      if (ev.touches.length === 2) startDist = dist(ev.touches);
    }, { passive: true });
    el.addEventListener("touchmove", (ev) => {
      if (ev.touches.length === 2 && startDist) {
        ev.preventDefault();
        const newDist = dist(ev.touches);
        const delta = (newDist - startDist) * 0.5;
        if (Math.abs(delta) > 2) {
          onZoomDelta(delta);
          startDist = newDist;
        }
      }
    }, { passive: false });
    el.addEventListener("touchend", (ev) => {
      if (ev.touches.length < 2) startDist = null;
    }, { passive: true });
  }
  function attachLongPress(el, callback, ms = 500) {
    let timer = null;
    let startX = 0, startY = 0;
    const moveTolerance = 12;
    el.addEventListener("touchstart", (ev) => {
      if (ev.touches.length !== 1) return;
      startX = ev.touches[0].clientX;
      startY = ev.touches[0].clientY;
      timer = setTimeout(() => {
        timer = null;
        callback({ clientX: startX, clientY: startY, preventDefault() {
        }, stopPropagation() {
        } });
      }, ms);
    }, { passive: true });
    el.addEventListener("touchmove", (ev) => {
      if (!timer || !ev.touches[0]) return;
      const dx = ev.touches[0].clientX - startX;
      const dy = ev.touches[0].clientY - startY;
      if (Math.sqrt(dx * dx + dy * dy) > moveTolerance) {
        clearTimeout(timer);
        timer = null;
      }
    }, { passive: true });
    el.addEventListener("touchend", () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }, { passive: true });
    el.addEventListener("touchcancel", () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }, { passive: true });
  }
  var _toastTimer;
  function toast(msg, ms = 2600) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => toastEl.classList.remove("show"), ms);
  }
  function showPanel(el) {
    el.style.display = "flex";
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("panel-visible")));
  }
  function hidePanel(el) {
    closeOwnedPdropIfPanel(el);
    if (el.style.display === "none") return;
    el.classList.remove("panel-visible");
    setTimeout(() => {
      el.style.display = "none";
    }, 160);
  }
  function showImageLightbox(src) {
    if (!src) return;
    const backdrop = document.createElement("div");
    backdrop.className = "lightbox-backdrop";
    const img = document.createElement("img");
    img.src = src;
    img.draggable = false;
    img.style.transformOrigin = "center center";
    backdrop.appendChild(img);
    let scale = 1, panX = 0, panY = 0;
    let dragging = false, didDrag = false, dragStartX = 0, dragStartY = 0, panStartX = 0, panStartY = 0;
    const MIN_SCALE = 1, MAX_SCALE = 6;
    function clampPan() {
      const maxX = Math.max(0, img.offsetWidth * (scale - 1) / 2);
      const maxY = Math.max(0, img.offsetHeight * (scale - 1) / 2);
      panX = Math.max(-maxX, Math.min(maxX, panX));
      panY = Math.max(-maxY, Math.min(maxY, panY));
    }
    function applyTransform() {
      img.style.transform = scale === 1 && panX === 0 && panY === 0 ? "" : `translate(${panX}px, ${panY}px) scale(${scale})`;
      img.style.cursor = scale > 1 ? dragging ? "grabbing" : "grab" : "zoom-out";
    }
    function zoomBy(delta) {
      const prevScale = scale;
      scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + scale * delta));
      if (scale === MIN_SCALE) {
        panX = 0;
        panY = 0;
      } else {
        const ratio = scale / prevScale;
        panX *= ratio;
        panY *= ratio;
      }
      clampPan();
      applyTransform();
    }
    function onWheel(ev) {
      ev.preventDefault();
      ev.stopPropagation();
      zoomBy(-ev.deltaY * 15e-4);
    }
    function onPointerDown(ev) {
      if (scale <= 1) return;
      ev.preventDefault();
      ev.stopPropagation();
      dragging = true;
      didDrag = false;
      dragStartX = ev.clientX;
      dragStartY = ev.clientY;
      panStartX = panX;
      panStartY = panY;
      img.setPointerCapture(ev.pointerId);
      applyTransform();
    }
    function onPointerMove(ev) {
      if (!dragging) return;
      const dx = ev.clientX - dragStartX, dy = ev.clientY - dragStartY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag = true;
      panX = panStartX + dx;
      panY = panStartY + dy;
      clampPan();
      applyTransform();
    }
    function onPointerUp(ev) {
      if (!dragging) return;
      dragging = false;
      try {
        img.releasePointerCapture(ev.pointerId);
      } catch {
      }
      applyTransform();
    }
    img.addEventListener("wheel", onWheel, { passive: false });
    img.addEventListener("pointerdown", onPointerDown);
    img.addEventListener("pointermove", onPointerMove);
    img.addEventListener("pointerup", onPointerUp);
    attachPinchZoom(img, (delta) => zoomBy(delta * 0.02));
    function close() {
      backdrop.classList.remove("modal-visible");
      setTimeout(() => backdrop.remove(), 160);
      document.removeEventListener("keydown", onKey);
    }
    function onKey(ev) {
      if (ev.key === "Escape") close();
    }
    backdrop.addEventListener("click", (ev) => {
      if (didDrag) {
        didDrag = false;
        return;
      }
      if (ev.target !== backdrop) return;
      close();
    });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(backdrop);
    requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add("modal-visible")));
  }
  function positionMenu(menu, x, y) {
    const pad = 8;
    const width = menu.offsetWidth, height = menu.offsetHeight;
    let left = x, top = y;
    if (left + width + pad > window.innerWidth) left = window.innerWidth - width - pad;
    if (top + height + pad > window.innerHeight) top = window.innerHeight - height - pad;
    menu.style.left = Math.max(pad, left) + "px";
    menu.style.top = Math.max(pad, top) + "px";
    requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add("menu-in")));
  }
  function showConfirmModal(message, opts = {}) {
    return new Promise((resolve) => {
      const backdrop = document.createElement("div");
      backdrop.className = "confirm-backdrop";
      const box = document.createElement("div");
      box.className = "confirm-box";
      const msg = document.createElement("div");
      msg.className = "confirm-message";
      msg.textContent = message;
      box.appendChild(msg);
      const btnRow = document.createElement("div");
      btnRow.className = "confirm-btn-row";
      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = opts.cancelLabel || "Cancel";
      const okBtn = document.createElement("button");
      okBtn.textContent = opts.okLabel || "Confirm";
      okBtn.className = opts.danger ? "danger-ghost" : "primary";
      function close(result) {
        backdrop.classList.remove("modal-visible");
        setTimeout(() => backdrop.remove(), 160);
        resolve(result);
      }
      cancelBtn.addEventListener("click", () => close(false));
      okBtn.addEventListener("click", () => close(true));
      backdrop.addEventListener("click", (ev) => {
        if (ev.target === backdrop) close(false);
      });
      document.addEventListener("keydown", function escHandler(ev) {
        if (ev.key === "Escape") {
          close(false);
          document.removeEventListener("keydown", escHandler);
        }
      });
      btnRow.appendChild(cancelBtn);
      btnRow.appendChild(okBtn);
      box.appendChild(btnRow);
      backdrop.appendChild(box);
      document.body.appendChild(backdrop);
      requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add("modal-visible")));
    });
  }
  function showInfoModal(html, title, onBody) {
    const backdrop = document.createElement("div");
    backdrop.className = "confirm-backdrop";
    const box = document.createElement("div");
    box.className = "confirm-box info-modal-box";
    if (title) {
      const head = document.createElement("div");
      head.className = "info-modal-title";
      head.textContent = title;
      box.appendChild(head);
    }
    const body = document.createElement("div");
    body.className = "info-modal-body";
    body.innerHTML = html;
    box.appendChild(body);
    if (onBody) onBody(body);
    const btnRow = document.createElement("div");
    btnRow.className = "confirm-btn-row";
    const closeBtn = document.createElement("button");
    closeBtn.className = "primary";
    closeBtn.textContent = "Close";
    function close() {
      backdrop.classList.remove("modal-visible");
      setTimeout(() => backdrop.remove(), 160);
    }
    closeBtn.addEventListener("click", close);
    backdrop.addEventListener("click", (ev) => {
      if (ev.target === backdrop) close();
    });
    document.addEventListener("keydown", function escHandler(ev) {
      if (ev.key === "Escape") {
        close();
        document.removeEventListener("keydown", escHandler);
      }
    });
    btnRow.appendChild(closeBtn);
    box.appendChild(btnRow);
    backdrop.appendChild(box);
    document.body.appendChild(backdrop);
    requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add("modal-visible")));
  }
  function openDockListModal(title, contentEl) {
    const backdrop = document.createElement("div");
    backdrop.className = "confirm-backdrop dock-list-modal-backdrop";
    const box = document.createElement("div");
    box.className = "confirm-box dock-list-modal-box";
    if (title) {
      const head = document.createElement("div");
      head.className = "info-modal-title";
      head.textContent = title;
      box.appendChild(head);
    }
    const originalParent = contentEl.parentNode;
    const originalNextSibling = contentEl.nextSibling;
    contentEl.classList.add("dock-list-modal-content");
    box.appendChild(contentEl);
    const btnRow = document.createElement("div");
    btnRow.className = "confirm-btn-row";
    const closeBtn = document.createElement("button");
    closeBtn.className = "primary";
    closeBtn.textContent = "Close";
    function close() {
      backdrop.classList.remove("modal-visible");
      setTimeout(() => {
        contentEl.classList.remove("dock-list-modal-content");
        if (originalNextSibling) originalParent.insertBefore(contentEl, originalNextSibling);
        else originalParent.appendChild(contentEl);
        backdrop.remove();
      }, 160);
    }
    closeBtn.addEventListener("click", close);
    backdrop.addEventListener("click", (ev) => {
      if (ev.target === backdrop) close();
    });
    document.addEventListener("keydown", function escHandler(ev) {
      if (ev.key === "Escape") {
        close();
        document.removeEventListener("keydown", escHandler);
      }
    });
    btnRow.appendChild(closeBtn);
    box.appendChild(btnRow);
    backdrop.appendChild(box);
    document.body.appendChild(backdrop);
    requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add("modal-visible")));
  }
  function initInfoButtons(scope) {
    (scope || document).querySelectorAll(".info-btn").forEach((btn) => {
      const el = btn;
      if (el.dataset.infoWired) return;
      const tpl = document.getElementById(el.id + "Content");
      if (!tpl) return;
      el.dataset.infoWired = "1";
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        showInfoModal(tpl.innerHTML, el.title || "");
      });
    });
  }
  var FLASH_CYCLE_MS = 600;
  var flashState = /* @__PURE__ */ new WeakMap();
  function initClickFlash() {
    document.addEventListener("click", (ev) => {
      const target = ev.target;
      const btn = target.closest("button");
      if (!btn) return;
      const now = Date.now();
      const prev = flashState.get(btn);
      if (prev && now - prev.lastTrigger < FLASH_CYCLE_MS) return;
      const token = (prev ? prev.token : 0) + 1;
      flashState.set(btn, { lastTrigger: now, token });
      btn.classList.remove("fx-flash");
      void btn.offsetWidth;
      btn.classList.add("fx-flash");
      setTimeout(() => {
        const cur = flashState.get(btn);
        if (!(cur && cur.token === token)) return;
        btn.classList.remove("fx-flash");
        btn.classList.add("fx-flash-reset");
        void btn.offsetWidth;
        btn.classList.remove("fx-flash-reset");
      }, FLASH_CYCLE_MS + 50);
    }, true);
  }
  var MENU_CONTAINER_SELECTOR = ".ctx-menu, .pdrop-menu, .pt-choice-menu, .header-cat-flyout, .confirm-btn-row";
  function initMenuKeyboardNav(onNavigate) {
    document.addEventListener("keydown", (ev) => {
      if (ev.key !== "ArrowDown" && ev.key !== "ArrowUp" && ev.key !== "Home" && ev.key !== "End") return;
      const menus = Array.from(document.querySelectorAll(MENU_CONTAINER_SELECTOR)).filter((m) => getComputedStyle(m).display !== "none");
      if (!menus.length) return;
      const menu = menus[menus.length - 1];
      const items = Array.from(menu.querySelectorAll("button:not(:disabled)"));
      if (!items.length) return;
      ev.preventDefault();
      const current = menu.contains(document.activeElement) ? items.indexOf(document.activeElement) : -1;
      let idx;
      if (current === -1) idx = ev.key === "ArrowUp" || ev.key === "End" ? items.length - 1 : 0;
      else if (ev.key === "Home") idx = 0;
      else if (ev.key === "End") idx = items.length - 1;
      else if (ev.key === "ArrowDown") idx = (current + 1) % items.length;
      else idx = (current - 1 + items.length) % items.length;
      items[idx].focus();
      if (onNavigate) onNavigate();
    });
  }

  // src/renderer/themes.ts
  var THEME_VARS = [
    ["--bg-base", "Background"],
    ["--bg-panel", "Panel"],
    ["--bg-elevated", "Elevated surface"],
    ["--bg-elevated-2", "Elevated surface 2"],
    ["--border-soft", "Border (soft)"],
    ["--border-strong", "Border (strong)"],
    ["--text-primary", "Primary text"],
    ["--text-muted", "Muted text"],
    ["--text-faint", "Faint text"],
    ["--accent-auto", "Accent \u2014 auto/orange"],
    ["--accent-auto-dim", "Accent \u2014 auto dim"],
    ["--accent-manual", "Accent \u2014 manual/blue"],
    ["--accent-manual-dim", "Accent \u2014 manual dim"],
    ["--accent-danger", "Danger accent"],
    ["--accent-success", "Success accent"],
    ["--accent-flair", "Accent \u2014 flair (theme signature)"]
  ];
  var STUDIO_DEFAULTS = {
    "--bg-base": "#16151c",
    "--bg-panel": "#1c1a24",
    "--bg-elevated": "#252230",
    "--bg-elevated-2": "#2d2a38",
    "--border-soft": "#373242",
    "--border-strong": "#4a4459",
    "--text-primary": "#ece8f0",
    "--text-muted": "#9791a6",
    "--text-faint": "#6b6578",
    "--accent-auto": "#e8a33d",
    "--accent-auto-dim": "#4a3c22",
    "--accent-manual": "#6fb8d1",
    "--accent-manual-dim": "#213842",
    "--accent-danger": "#e2637a",
    "--accent-success": "#7fbf8f",
    "--accent-flair": "#c98ed6"
  };
  var PREMIUM_THEMES = [
    { id: "terminal", name: "Terminal Green", rarity: "common", price: 40, swatches: ["#050805", "#00ff66", "#ffcc00"] },
    { id: "sakura", name: "Sakura Dusk", rarity: "uncommon", price: 90, swatches: ["#241a20", "#c9a6ff", "#ffe3ef"] },
    { id: "bioluminescent", name: "Bioluminescent Deep", rarity: "rare", price: 180, swatches: ["#03080d", "#26e0c9", "#4fd6ff"] },
    { id: "amethyst", name: "Royal Amethyst", rarity: "epic", price: 360, swatches: ["#170b26", "#c9a6ff", "#e8c468"] },
    { id: "solarflare", name: "Solar Flare", rarity: "legendary", price: 750, swatches: ["#1a0800", "#ff6a1f", "#ffd166"] },
    { id: "midnight-ocean", name: "Midnight Ocean", rarity: "common", price: 40, swatches: ["#040c14", "#3ddbd9", "#f2a65a"] },
    { id: "arctic-frost", name: "Arctic Frost", rarity: "common", price: 40, swatches: ["#eef5fb", "#2f7fb8", "#8fd6ff"] },
    { id: "forest-moss", name: "Forest Moss", rarity: "common", price: 40, swatches: ["#0e130d", "#7cb454", "#d7b568"] },
    { id: "vintage-paper", name: "Vintage Paper", rarity: "common", price: 40, swatches: ["#f2e8d5", "#6b4a2f", "#a5432f"] },
    { id: "obsidian", name: "Obsidian", rarity: "common", price: 40, swatches: ["#0a0a0c", "#7c9cff", "#e0b060"] },
    { id: "retrowave", name: "Retro Wave", rarity: "uncommon", price: 90, swatches: ["#170826", "#ff3ec8", "#00e5ff"] },
    { id: "rose-gold", name: "Rose Gold", rarity: "uncommon", price: 90, swatches: ["#fbeef0", "#c47a6f", "#e0a45c"] },
    { id: "coral-reef", name: "Coral Reef", rarity: "uncommon", price: 90, swatches: ["#04191c", "#ff7f6b", "#4fd6a8"] },
    { id: "toxic-waste", name: "Toxic Waste", rarity: "uncommon", price: 90, swatches: ["#0a0f04", "#8aff29", "#f5ff3d"] },
    { id: "lavender-fields", name: "Lavender Fields", rarity: "uncommon", price: 90, swatches: ["#f2eefb", "#7b5ea8", "#c98ed6"] },
    { id: "candy-pop", name: "Candy Pop", rarity: "uncommon", price: 90, swatches: ["#fff5fa", "#ff5fa2", "#ffd23f"] },
    { id: "copper-forge", name: "Copper Forge", rarity: "rare", price: 180, swatches: ["#120e0b", "#b0703f", "#c98a4a"] },
    { id: "blood-moon", name: "Blood Moon", rarity: "rare", price: 180, swatches: ["#0e0505", "#ff3b3b", "#ffb300"] },
    { id: "twilight-garden", name: "Twilight Garden", rarity: "epic", price: 360, swatches: ["#0c1210", "#4fd68f", "#c9a6ff"] },
    { id: "aurora-borealis", name: "Aurora Borealis", rarity: "legendary", price: 750, swatches: ["#05080f", "#7b5bff", "#5cffb0"] },
    { id: "celestial-gold", name: "Celestial Gold", rarity: "legendary", price: 750, swatches: ["#0a0810", "#e8c468", "#ffd166"] }
  ];
  var _toHex6Ctx = null;
  function toHex6(colorStr) {
    const ctx = _toHex6Ctx || (_toHex6Ctx = document.createElement("canvas").getContext("2d"));
    ctx.fillStyle = "#000000";
    ctx.fillStyle = colorStr;
    const norm = ctx.fillStyle;
    if (norm[0] === "#") return norm.length >= 7 ? norm.slice(0, 7) : norm;
    const m = norm.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (m) {
      const toH = (n) => Number(n).toString(16).padStart(2, "0");
      return "#" + toH(m[1]) + toH(m[2]) + toH(m[3]);
    }
    return "#000000";
  }
  function getCurrentVarHex(key) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(key).trim();
    return toHex6(raw || "#000000");
  }
  function clearCustomOverrides() {
    for (const [key] of THEME_VARS) document.documentElement.style.removeProperty(key);
  }
  var dayNightOn = false;
  function syncNightModeFromPrePaint() {
    dayNightOn = true;
  }
  function applyTheme(theme) {
    if (dayNightOn) {
      dayNightOn = false;
      document.documentElement.classList.remove("night-mode");
      try {
        localStorage.setItem("dts-night-mode", "0");
      } catch (e) {
      }
    }
    if (theme === "custom") {
      document.documentElement.setAttribute("data-theme", "custom");
      let saved = null;
      try {
        saved = JSON.parse(localStorage.getItem("dts-custom-theme") || "null");
      } catch (e) {
      }
      if (saved) {
        for (const [key] of THEME_VARS) {
          if (saved[key]) document.documentElement.style.setProperty(key, saved[key]);
        }
      } else {
        setTimeout(openThemeCustomPanel, 0);
      }
    } else {
      clearCustomOverrides();
      document.documentElement.setAttribute("data-theme", theme);
    }
    document.documentElement.classList.toggle("theme-refined", refinedThemes.includes(theme));
    try {
      localStorage.setItem("dts-theme", theme);
    } catch (e) {
    }
  }
  var refinedThemes = [];
  try {
    refinedThemes = JSON.parse(localStorage.getItem("dts-refined-themes") || "[]") || [];
  } catch {
    refinedThemes = [];
  }
  function saveRefinedThemes() {
    try {
      localStorage.setItem("dts-refined-themes", JSON.stringify(refinedThemes));
    } catch (e) {
    }
  }
  function themeAlreadyHasPremiumEffects(themeId) {
    const premium = PREMIUM_THEMES.find((t) => t.id === themeId);
    const rarity = premium ? premium.rarity : "free";
    return rarity === "epic" || rarity === "legendary" || refinedThemes.includes(themeId);
  }
  function themeOriginalPrice(themeId) {
    const premium = PREMIUM_THEMES.find((t) => t.id === themeId);
    return premium ? premium.price : 0;
  }
  function epicThemePrice() {
    const epic = PREMIUM_THEMES.find((t) => t.rarity === "epic");
    return epic ? epic.price : 360;
  }
  function refineThemeCost(themeId) {
    return epicThemePrice() - themeOriginalPrice(themeId);
  }
  function markThemeRefined(themeId) {
    if (!refinedThemes.includes(themeId)) refinedThemes.push(themeId);
    saveRefinedThemes();
    document.documentElement.classList.add("theme-refined");
  }
  function openThemeCustomPanel() {
    hidePanel(favoritesPanel);
    hidePanel(logPanel);
    hidePanel(achievementsPanel);
    hidePanel(shopPanel);
    hidePanel(tagDetailsPanel);
    themeVarRows.innerHTML = "";
    for (const [key, label] of THEME_VARS) {
      const row = document.createElement("div");
      row.className = "theme-var-row";
      const lbl = document.createElement("span");
      lbl.className = "lbl";
      lbl.textContent = label;
      const input = document.createElement("input");
      input.type = "color";
      input.value = getCurrentVarHex(key);
      input.dataset.varKey = key;
      input.addEventListener("input", () => {
        document.documentElement.style.setProperty(key, input.value);
      });
      row.appendChild(lbl);
      row.appendChild(input);
      themeVarRows.appendChild(row);
    }
    showPanel(themeCustomPanel);
  }
  function hexToHsl(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255, g = parseInt(hex.slice(3, 5), 16) / 255, b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = 0;
      s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        default:
          h = (r - g) / d + 4;
      }
      h /= 6;
    }
    return [h * 360, s * 100, l * 100];
  }
  function hslToHex(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p2, q2, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p2 + (q2 - p2) * 6 * t;
        if (t < 1 / 2) return q2;
        if (t < 2 / 3) return p2 + (q2 - p2) * (2 / 3 - t) * 6;
        return p2;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, "0");
    return "#" + toHex(r) + toHex(g) + toHex(b);
  }
  function invertLightness(hex) {
    const [h, s, l] = hexToHsl(hex);
    return hslToHex(h, s, 100 - l);
  }
  function initThemeDropdown(container) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pdrop-btn";
    function currentLabel() {
      const opt = themeSelect.options[themeSelect.selectedIndex];
      return (opt ? opt.textContent : themeSelect.value) + " \u25BE";
    }
    function setLabel() {
      btn.textContent = currentLabel();
      shrinkTextToFit(btn);
    }
    btn.textContent = currentLabel();
    let menuEl = null;
    function onOutsideMouseDown(ev) {
      if (ev.target === document.documentElement || ev.target === document.body) return;
      if (container.contains(ev.target)) return;
      closeMenu();
    }
    function closeMenu() {
      if (!menuEl) return;
      menuEl.remove();
      menuEl = null;
      document.removeEventListener("mousedown", onOutsideMouseDown);
    }
    function openMenu() {
      menuEl = document.createElement("div");
      menuEl.className = "pdrop-menu theme-pdrop-menu";
      for (const opt of Array.from(themeSelect.options)) {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "pdrop-item" + (opt.value === themeSelect.value ? " active" : "");
        item.textContent = opt.textContent;
        item.addEventListener("click", (ev) => {
          ev.stopPropagation();
          themeSelect.value = opt.value;
          themeSelect.dispatchEvent(new Event("change"));
          setLabel();
          menuEl.querySelectorAll(".pdrop-item").forEach((i) => i.classList.remove("active"));
          item.classList.add("active");
        });
        menuEl.appendChild(item);
      }
      container.appendChild(menuEl);
      document.addEventListener("mousedown", onOutsideMouseDown);
      requestAnimationFrame(() => requestAnimationFrame(() => menuEl.classList.add("menu-in")));
    }
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (menuEl) closeMenu();
      else openMenu();
    });
    container.style.position = "relative";
    container.appendChild(btn);
    shrinkTextToFit(btn);
    return { refreshLabel: setLabel };
  }
  function toggleDayNightMode() {
    if (themeSelect.value === "custom") {
      toast("Day/Night inversion isn't available for the Custom theme \u2014 its colors are already fully in your control.");
      return false;
    }
    dayNightOn = !dayNightOn;
    if (dayNightOn) {
      for (const [key] of THEME_VARS) {
        const dayHex = getCurrentVarHex(key);
        document.documentElement.style.setProperty(key, invertLightness(dayHex));
      }
      document.documentElement.classList.add("night-mode");
    } else {
      clearCustomOverrides();
      document.documentElement.classList.remove("night-mode");
    }
    try {
      localStorage.setItem("dts-night-mode", dayNightOn ? "1" : "0");
    } catch (e) {
    }
    return dayNightOn;
  }

  // src/renderer/docks.ts
  var DOCK_ANIM_MS = 160;
  function dockMotionEnabled() {
    return !document.documentElement.classList.contains("motion-off");
  }
  var mobileDockLayoutQuery = matchMedia("(max-width: 900px)");
  function createDockManager({ container, storageOrderKey, storageCollapsedKey, storageHeightsKey, defaultOrder, scrollContainer, horizontalOnMobile }) {
    function isHorizontal() {
      return !!horizontalOnMobile && mobileDockLayoutQuery.matches;
    }
    let dockOrder = defaultOrder.slice();
    let dockCollapsed = {};
    let dockHeights = {};
    function saveDockPrefs() {
      try {
        localStorage.setItem(storageOrderKey, JSON.stringify(dockOrder));
        localStorage.setItem(storageCollapsedKey, JSON.stringify(dockCollapsed));
        localStorage.setItem(storageHeightsKey, JSON.stringify(dockHeights));
      } catch (e) {
      }
    }
    function loadDockPrefs() {
      try {
        const o = JSON.parse(localStorage.getItem(storageOrderKey) || "null");
        if (Array.isArray(o) && o.length) dockOrder = o;
        dockCollapsed = JSON.parse(localStorage.getItem(storageCollapsedKey) || "{}") || {};
        dockHeights = JSON.parse(localStorage.getItem(storageHeightsKey) || "{}") || {};
      } catch (e) {
      }
    }
    function applyDockOrder() {
      const sections = Array.from(container.querySelectorAll(".tool-section[data-dock-id]"));
      for (const id of dockOrder) {
        const sec = sections.find((s) => s.dataset.dockId === id);
        if (sec) container.appendChild(sec);
      }
      for (const sec of sections) {
        if (!dockOrder.includes(sec.dataset.dockId)) container.appendChild(sec);
      }
    }
    function applyDockCollapse(sec, id, animate = false) {
      const horizontal = isHorizontal();
      const maxProp = horizontal ? "maxWidth" : "maxHeight";
      const scrollProp = horizontal ? "scrollWidth" : "scrollHeight";
      const overflowProp = horizontal ? "overflowX" : "overflowY";
      const cssProp = horizontal ? "max-width" : "max-height";
      const scrollBody = sec.querySelector(".dock-scroll-body");
      const bodyEls = scrollBody ? [scrollBody] : Array.from(sec.children).filter(
        (el) => !el.classList.contains("sec-head") && !el.classList.contains("dock-resize-handle")
      );
      const resizeHandle = sec.querySelector(".dock-resize-handle");
      const resizeTarget = scrollBody || sec;
      const collapsing = !!dockCollapsed[id];
      const finalMaxDim = collapsing ? "" : dockHeights[id] || "";
      const finalOverflow = collapsing ? "" : dockHeights[id] ? "auto" : "";
      const headEl = horizontal ? sec.querySelector(".sec-head") : null;
      const outerCollapsedWidth = headEl ? headEl.getBoundingClientRect().width + 24 + "px" : "100px";
      if (!animate || !dockMotionEnabled()) {
        bodyEls.forEach((el) => {
          el.style.display = collapsing ? "none" : "";
        });
        if (resizeHandle) resizeHandle.style.display = collapsing ? "none" : "";
        resizeTarget.style[maxProp] = finalMaxDim;
        resizeTarget.style[overflowProp] = finalOverflow;
        if (horizontal) sec.style.maxWidth = collapsing ? outerCollapsedWidth : "";
        return;
      }
      if (horizontal) {
        sec.style.transition = `max-width ${DOCK_ANIM_MS}ms ease`;
        requestAnimationFrame(() => {
          sec.style.maxWidth = collapsing ? outerCollapsedWidth : "";
        });
        setTimeout(() => {
          sec.style.transition = "";
        }, DOCK_ANIM_MS);
      }
      const trans = `${cssProp} ${DOCK_ANIM_MS}ms ease, opacity ${DOCK_ANIM_MS}ms ease`;
      if (collapsing) {
        bodyEls.forEach((el) => {
          el.style.overflow = "hidden";
          el.style[maxProp] = el[scrollProp] + "px";
          el.style.opacity = "1";
          el.style.transition = trans;
          void el.offsetHeight;
          requestAnimationFrame(() => {
            el.style[maxProp] = "0px";
            el.style.opacity = "0";
          });
        });
        if (resizeHandle) resizeHandle.style.display = "none";
        setTimeout(() => {
          bodyEls.forEach((el) => {
            el.style.display = "none";
            el.style.transition = "";
            el.style.overflow = "";
            el.style[maxProp] = "";
            el.style.opacity = "";
          });
          resizeTarget.style[maxProp] = "";
          resizeTarget.style[overflowProp] = "";
        }, DOCK_ANIM_MS);
      } else {
        bodyEls.forEach((el) => {
          el.style.display = "";
          el.style.overflow = "hidden";
          el.style[maxProp] = "0px";
          el.style.opacity = "0";
          el.style.transition = trans;
        });
        if (resizeHandle) resizeHandle.style.display = "";
        void sec.offsetHeight;
        requestAnimationFrame(() => {
          bodyEls.forEach((el) => {
            el.style[maxProp] = el === scrollBody && dockHeights[id] ? dockHeights[id] : el[scrollProp] + "px";
            el.style.opacity = "1";
          });
        });
        setTimeout(() => {
          bodyEls.forEach((el) => {
            el.style.transition = "";
            el.style.overflow = el === scrollBody ? finalOverflow || "" : "";
            el.style[maxProp] = el === scrollBody ? finalMaxDim : "";
            el.style.opacity = "";
          });
          resizeTarget.style[maxProp] = finalMaxDim;
          resizeTarget.style[overflowProp] = finalOverflow;
        }, DOCK_ANIM_MS);
      }
    }
    function reorderDock(draggedId, targetId, after) {
      dockOrder = dockOrder.filter((x) => x !== draggedId);
      let idx = dockOrder.indexOf(targetId);
      if (idx === -1) idx = dockOrder.length;
      if (after) idx += 1;
      dockOrder.splice(idx, 0, draggedId);
      saveDockPrefs();
      applyDockOrder();
    }
    function setupDockSection(sec) {
      const id = sec.dataset.dockId;
      if (!id || sec.dataset.dockified) return;
      sec.dataset.dockified = "1";
      const resizable = sec.dataset.resizable === "true";
      const scrollBody = sec.querySelector(".dock-scroll-body");
      const resizeTarget = scrollBody || sec;
      const head = sec.querySelector(".sec-head");
      if (head) {
        head.style.display = "flex";
        head.style.alignItems = "center";
        const controls = document.createElement("span");
        controls.className = "dock-controls";
        const dragHandle = document.createElement("span");
        dragHandle.className = "dock-drag-handle";
        dragHandle.textContent = "\u2630";
        dragHandle.title = "Drag to reorder this panel";
        dragHandle.draggable = true;
        dragHandle.addEventListener("dragstart", (ev) => {
          ev.dataTransfer.setData("text/plain", id);
          ev.dataTransfer.effectAllowed = "move";
          sec.classList.add("dock-dragging");
        });
        dragHandle.addEventListener("dragend", () => sec.classList.remove("dock-dragging"));
        const collapseBtn = document.createElement("button");
        collapseBtn.className = "dock-collapse-btn";
        collapseBtn.title = "Collapse / expand this panel";
        const collapseGlyph = () => dockCollapsed[id] ? "\u25B6" : isHorizontal() ? "\u25C0" : "\u25BC";
        collapseBtn.textContent = collapseGlyph();
        collapseBtn.addEventListener("click", () => {
          dockCollapsed[id] = !dockCollapsed[id];
          saveDockPrefs();
          applyDockCollapse(sec, id, true);
          collapseBtn.textContent = collapseGlyph();
        });
        controls.appendChild(dragHandle);
        controls.appendChild(collapseBtn);
        head.appendChild(controls);
      }
      sec.addEventListener("dragover", (ev) => {
        ev.preventDefault();
        sec.classList.add("dock-drop-target");
      });
      sec.addEventListener("dragleave", () => sec.classList.remove("dock-drop-target"));
      sec.addEventListener("drop", (ev) => {
        ev.preventDefault();
        sec.classList.remove("dock-drop-target");
        const draggedId = ev.dataTransfer.getData("text/plain");
        if (!draggedId || draggedId === id || !container.querySelector(`.tool-section[data-dock-id="${draggedId}"]`)) return;
        const draggedIdx = dockOrder.indexOf(draggedId);
        const targetIdx = dockOrder.indexOf(id);
        const dropAfter = draggedIdx !== -1 && targetIdx !== -1 && draggedIdx < targetIdx;
        reorderDock(draggedId, id, dropAfter);
      });
      applyDockCollapse(sec, id);
      if (resizable) {
        const resizeHandle = document.createElement("div");
        resizeHandle.className = "dock-resize-handle";
        resizeHandle.title = "Drag to resize this panel";
        sec.appendChild(resizeHandle);
        resizeHandle.addEventListener("pointerdown", (ev) => {
          if (dockCollapsed[id]) return;
          ev.preventDefault();
          const horizontal = isHorizontal();
          const maxProp = horizontal ? "maxWidth" : "maxHeight";
          const overflowProp = horizontal ? "overflowX" : "overflowY";
          resizeHandle.setPointerCapture(ev.pointerId);
          const startPos = horizontal ? ev.clientX : ev.clientY;
          const startDim = horizontal ? resizeTarget.getBoundingClientRect().width : resizeTarget.getBoundingClientRect().height;
          function onMove(mv) {
            const pos = horizontal ? mv.clientX : mv.clientY;
            const newDim = Math.max(90, startDim + (pos - startPos));
            resizeTarget.style[maxProp] = newDim + "px";
            resizeTarget.style[overflowProp] = "auto";
            if (scrollContainer) {
              const rect = scrollContainer.getBoundingClientRect();
              const edgeMargin = 50;
              if (horizontal) {
                if (mv.clientX < rect.left + edgeMargin) {
                  scrollContainer.scrollLeft -= Math.max(4, rect.left + edgeMargin - mv.clientX);
                } else if (mv.clientX > rect.right - edgeMargin) {
                  scrollContainer.scrollLeft += Math.max(4, mv.clientX - (rect.right - edgeMargin));
                }
              } else {
                if (mv.clientY < rect.top + edgeMargin) {
                  scrollContainer.scrollTop -= Math.max(4, rect.top + edgeMargin - mv.clientY);
                } else if (mv.clientY > rect.bottom - edgeMargin) {
                  scrollContainer.scrollTop += Math.max(4, mv.clientY - (rect.bottom - edgeMargin));
                }
              }
            }
          }
          function onUp() {
            resizeHandle.removeEventListener("pointermove", onMove);
            resizeHandle.removeEventListener("pointerup", onUp);
            resizeHandle.removeEventListener("pointercancel", onUp);
            dockHeights[id] = resizeTarget.style[maxProp];
            saveDockPrefs();
          }
          resizeHandle.addEventListener("pointermove", onMove);
          resizeHandle.addEventListener("pointerup", onUp);
          resizeHandle.addEventListener("pointercancel", onUp);
        });
      }
    }
    function init() {
      loadDockPrefs();
      applyDockOrder();
      container.querySelectorAll(".tool-section[data-dock-id]").forEach(setupDockSection);
    }
    function reset() {
      dockOrder = defaultOrder.slice();
      dockCollapsed = {};
      dockHeights = {};
      saveDockPrefs();
      applyDockOrder();
      const horizontal = isHorizontal();
      container.querySelectorAll(".tool-section[data-dock-id]").forEach((sec) => {
        const resizeTarget = sec.querySelector(".dock-scroll-body") || sec;
        resizeTarget.style[horizontal ? "maxWidth" : "maxHeight"] = "";
        resizeTarget.style[horizontal ? "overflowX" : "overflowY"] = "";
        if (horizontal) sec.style.maxWidth = "";
        applyDockCollapse(sec, sec.dataset.dockId);
        const collapseBtn = sec.querySelector(".dock-collapse-btn");
        if (collapseBtn) collapseBtn.textContent = horizontal ? "\u25C0" : "\u25BC";
      });
    }
    return { init, reset };
  }
  var rightToolsDockManager = createDockManager({
    container: normalRightTools,
    storageOrderKey: "dts-dock-order",
    storageCollapsedKey: "dts-dock-collapsed",
    storageHeightsKey: "dts-dock-heights",
    defaultOrder: ["tagPruner", "unifyVoid", "canonicalTags"],
    scrollContainer: rightAside,
    horizontalOnMobile: true
  });
  function initDockSystem() {
    rightToolsDockManager.init();
  }
  function resetDockLayout() {
    rightToolsDockManager.reset();
    toast("Panel layout reset to default.");
  }
  btnResetDockLayout.addEventListener("click", resetDockLayout);
  var synthDatDockManager = null;
  function initSynthDatSectionDocks(container) {
    synthDatDockManager = createDockManager({
      container,
      storageOrderKey: "dts-synthdat-dock-order",
      storageCollapsedKey: "dts-synthdat-dock-collapsed",
      storageHeightsKey: "dts-synthdat-dock-heights",
      defaultOrder: Array.from(container.querySelectorAll(".tool-section[data-dock-id]")).map((sec) => sec.dataset.dockId),
      scrollContainer: null
    });
    synthDatDockManager.init();
  }

  // src/renderer/settings.ts
  function applyAppZoom(factor) {
    if (window.electronAPI && window.electronAPI.setZoomFactor) {
      return window.electronAPI.setZoomFactor(factor);
    }
    return Promise.resolve();
  }
  function resetAppZoom() {
    applyAppZoom(1);
    if (fontSizeSlider) {
      fontSizeSlider.value = "14";
    }
    if (fontSizeVal) {
      fontSizeVal.textContent = "14px";
    }
    try {
      localStorage.setItem("dts-font-size", "14");
    } catch {
    }
  }
  function getOutsideClosablePanels() {
    return [favoritesPanel, themeCustomPanel, logPanel, achievementsPanel, shopPanel, tagDetailsPanel, settingsPanel];
  }
  var SETTINGS_SECTIONS_KEY = "dts-settings-sections-expanded";
  function saveSettingsSectionState(state) {
    try {
      localStorage.setItem(SETTINGS_SECTIONS_KEY, JSON.stringify(state));
    } catch {
    }
  }

  // src/renderer/power-tools.ts
  var customPowerTools = [];
  var powerToolPickerActive = false;
  var BUILTIN_POWER_TOOLS = [
    { id: "builtin-unify-void", infoOnly: true, label: "Unify/Void selected tags (always marked, dynamic \u2014 one row per Tag Pruner)" },
    { id: "builtin-master-apply", field: ["masterApplyTagInput"], button: "btnMasterApplyToSelected", mode: "both", label: "Master Tags: apply to selected" },
    { id: "builtin-master-remove", field: ["masterRemoveTagInput"], button: "btnMasterRemoveFromSelected", mode: "both", label: "Master Tags: remove from selected" },
    { id: "builtin-cond-apply", field: ["condSourceTag", "condAddTag"], button: "btnCondApply", mode: "both", label: "Master Tags: conditional apply" },
    { id: "builtin-cond-apply-without", field: ["condWithoutSourceTag", "condWithoutAddTag"], button: "btnCondApplyWithout", mode: "both", label: "Master Tags: conditional apply (without)" },
    { id: "builtin-mass-apply", field: ["massApplyInput"], button: "btnMassApply", mode: "both", label: "Master Tags: mass apply" },
    { id: "builtin-mass-remove", field: ["massRemoveInput"], button: "btnMassRemove", mode: "both", label: "Master Tags: mass remove" },
    { id: "builtin-purge", button: "btnPurgeAllTags", mode: "button", label: "Purge all tags" },
    { id: "builtin-tag-pruner", infoOnly: true, label: "Tag Pruner search filters (always marked, dynamic)" }
  ];
  var OPTIONAL_POWER_TOOL_CANDIDATES = [
    { id: "candidate-master-rename", field: ["masterRenameFrom", "masterRenameTo"], button: "btnMasterRename", mode: "both", label: "Master Tags: rename everywhere" },
    { id: "candidate-master-fr", field: ["masterFRFind", "masterFRReplace"], button: "btnMasterFR", mode: "both", label: "Master Tags: find & replace substring" },
    { id: "candidate-flag-isolated", button: "btnFlagIsolated", mode: "button", label: "Flag isolated tags" }
  ];
  function powerToolIdsFor(entry) {
    const fieldIds = entry.field ? Array.isArray(entry.field) ? entry.field : [entry.field] : [];
    const buttonIds = entry.button ? [entry.button] : [];
    return { fieldIds, buttonIds };
  }
  function applyPowerToolMarks() {
    document.querySelectorAll(".power-tool").forEach((el) => {
      if (!el.classList.contains("pt-dynamic")) el.classList.remove("power-tool");
    });
    for (const entry of BUILTIN_POWER_TOOLS.concat(customPowerTools)) {
      if (entry.infoOnly) continue;
      const { fieldIds, buttonIds } = powerToolIdsFor(entry);
      if (entry.mode === "field" || entry.mode === "both") {
        for (const fid of fieldIds) {
          const el = $(fid);
          if (el) el.classList.add("power-tool");
        }
      }
      if (entry.mode === "button" || entry.mode === "both") {
        for (const bid of buttonIds) {
          const el = $(bid);
          if (el) el.classList.add("power-tool");
        }
      }
    }
  }
  function saveCustomPowerTools() {
    try {
      localStorage.setItem("dts-custom-power-tools", JSON.stringify(customPowerTools));
    } catch (e) {
    }
  }
  function loadCustomPowerTools() {
    try {
      const saved = JSON.parse(localStorage.getItem("dts-custom-power-tools") || "null");
      if (Array.isArray(saved)) customPowerTools = saved;
    } catch (e) {
    }
  }
  function findPowerToolMatch(elId) {
    for (const entry of BUILTIN_POWER_TOOLS) {
      if (entry.infoOnly) continue;
      const { fieldIds, buttonIds } = powerToolIdsFor(entry);
      if (fieldIds.includes(elId) || buttonIds.includes(elId)) return { scope: "builtin", entry };
    }
    for (const entry of customPowerTools) {
      const { fieldIds, buttonIds } = powerToolIdsFor(entry);
      if (fieldIds.includes(elId) || buttonIds.includes(elId)) return { scope: "custom", entry };
    }
    return null;
  }
  function setCustomPowerToolActive(entrySpec, active) {
    if (active) {
      if (!customPowerTools.some((c) => c.id === entrySpec.id)) {
        customPowerTools.push({ id: entrySpec.id, field: entrySpec.field, button: entrySpec.button, mode: entrySpec.mode, label: entrySpec.label });
      }
    } else {
      customPowerTools = customPowerTools.filter((c) => c.id !== entrySpec.id);
    }
    saveCustomPowerTools();
    applyPowerToolMarks();
    renderPowerToolList();
  }
  function buildPowerToolRow(entry, opts) {
    const row = document.createElement("div");
    row.className = "pt-list-row";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = opts.checked;
    cb.disabled = opts.locked || !!entry.infoOnly;
    row.appendChild(cb);
    const label = document.createElement("span");
    label.className = "pt-list-label";
    label.textContent = entry.label + (opts.locked ? " (built-in, always on)" : "");
    row.appendChild(label);
    const tagEl = document.createElement("span");
    tagEl.className = "pt-list-tag";
    tagEl.textContent = entry.infoOnly ? "" : entry.mode === "both" ? "field + button" : entry.mode || "";
    row.appendChild(tagEl);
    if (!opts.locked && !entry.infoOnly) {
      cb.addEventListener("change", () => {
        setCustomPowerToolActive(entry, cb.checked);
        toast(cb.checked ? `Marked "${entry.label}" as a power tool.` : `Unmarked "${entry.label}".`);
      });
    }
    return row;
  }
  function renderPowerToolList() {
    powerToolList.innerHTML = "";
    for (const entry of BUILTIN_POWER_TOOLS) {
      powerToolList.appendChild(buildPowerToolRow(entry, { checked: true, locked: true }));
    }
    for (const candidate of OPTIONAL_POWER_TOOL_CANDIDATES) {
      powerToolList.appendChild(buildPowerToolRow(candidate, { checked: customPowerTools.some((c) => c.id === candidate.id), locked: false }));
    }
    const candidateIds = new Set(OPTIONAL_POWER_TOOL_CANDIDATES.map((c) => c.id));
    for (const custom of customPowerTools) {
      if (candidateIds.has(custom.id)) continue;
      powerToolList.appendChild(buildPowerToolRow(custom, { checked: true, locked: false }));
    }
  }
  function addCustomPowerTool(fieldIds, buttonIds, mode, label) {
    const entry = {
      id: "custom-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      field: fieldIds,
      button: buttonIds[0],
      mode,
      label
    };
    customPowerTools.push(entry);
    saveCustomPowerTools();
    applyPowerToolMarks();
    renderPowerToolList();
    toast(`Marked "${label}" as a power tool.`);
  }
  var pickerBrowsingSuspended = false;
  function finishPowerToolPicking() {
    showPanel(settingsPanel);
  }
  function exitPowerToolPicker() {
    powerToolPickerActive = false;
    pickerBrowsingSuspended = false;
    document.body.classList.remove("pt-picking");
    document.removeEventListener("click", onPowerToolPickerClick, true);
    document.removeEventListener("keydown", onPowerToolPickerKeydown, true);
    document.removeEventListener("keyup", onPowerToolPickerKeyup, true);
  }
  function onPowerToolPickerKeydown(ev) {
    if (ev.key === "Escape") {
      exitPowerToolPicker();
      toast("Cancelled.");
      finishPowerToolPicking();
      return;
    }
    if (ev.key === "Shift" && !pickerBrowsingSuspended) {
      pickerBrowsingSuspended = true;
      document.body.classList.remove("pt-picking");
      document.removeEventListener("click", onPowerToolPickerClick, true);
      toast("Browsing freely \u2014 release Shift to resume marking.", 3e3);
    }
  }
  function onPowerToolPickerKeyup(ev) {
    if (ev.key === "Shift" && pickerBrowsingSuspended) {
      pickerBrowsingSuspended = false;
      document.body.classList.add("pt-picking");
      document.addEventListener("click", onPowerToolPickerClick, true);
    }
  }
  function onPowerToolPickerClick(ev) {
    const el = ev.target.closest("input, textarea, select, button");
    exitPowerToolPicker();
    if (!el || !el.id || el.classList.contains("tab-btn")) {
      ev.preventDefault();
      ev.stopPropagation();
      toast("That spot isn't a markable field or button \u2014 try again.");
      finishPowerToolPicking();
      return;
    }
    ev.preventDefault();
    ev.stopPropagation();
    const existing = findPowerToolMatch(el.id);
    if (existing && existing.scope === "builtin") {
      toast("That's already a built-in power tool and can't be unmarked.");
      finishPowerToolPicking();
      return;
    }
    if (existing && existing.scope === "custom") {
      setCustomPowerToolActive(existing.entry, false);
      toast(`Unmarked "${existing.entry.label}".`);
      finishPowerToolPicking();
      return;
    }
    const container = el.closest(".apply-row, .gtt-row");
    let fields = [], buttons = [];
    if (container) {
      fields = Array.from(container.querySelectorAll("input, textarea, select")).filter((x) => x.id);
      buttons = Array.from(container.querySelectorAll("button")).filter((x) => x.id);
    }
    const isField = el.matches("input, textarea, select");
    if (fields.length === 0) fields = isField ? [el] : [];
    if (buttons.length === 0) buttons = !isField ? [el] : [];
    const fieldIds = fields.map((f) => f.id);
    const buttonIds = buttons.map((b) => b.id);
    const matchedCandidate = OPTIONAL_POWER_TOOL_CANDIDATES.find((cand) => {
      const ids = powerToolIdsFor(cand);
      return ids.fieldIds.length === fieldIds.length && ids.fieldIds.every((id) => fieldIds.includes(id)) && ids.buttonIds.length === buttonIds.length && ids.buttonIds.every((id) => buttonIds.includes(id));
    });
    if (matchedCandidate) {
      setCustomPowerToolActive(matchedCandidate, true);
      toast(`Marked "${matchedCandidate.label}" as a power tool.`);
      finishPowerToolPicking();
      return;
    }
    if (fields.length && buttons.length) {
      openPowerToolModeChoice(el, fields, buttons, ev.clientX, ev.clientY);
    } else {
      const mode = fieldIds.length ? "field" : "button";
      const label = buttons[0] && buttons[0].textContent.trim() || fields[0] && (fields[0].placeholder || fields[0].id) || el.id;
      addCustomPowerTool(fieldIds, buttonIds, mode, label.slice(0, 60));
      finishPowerToolPicking();
    }
  }
  function openPowerToolModeChoice(el, fields, buttons, x, y) {
    const menu = document.createElement("div");
    menu.className = "pt-choice-menu";
    const header = document.createElement("div");
    header.className = "ctx-header";
    header.textContent = "Highlight which part?";
    menu.appendChild(header);
    const fieldIds = fields.map((f) => f.id);
    const buttonIds = buttons.map((b) => b.id);
    const label = (buttons[0] && buttons[0].textContent.trim() || fields[0] && (fields[0].placeholder || fields[0].id) || el.id).slice(0, 60);
    const choices = [
      ["field", "Highlight the field" + (fields.length > 1 ? "s" : "")],
      ["button", "Highlight the button"],
      ["both", "Highlight both"]
    ];
    for (const [mode, text] of choices) {
      const btn = document.createElement("button");
      btn.textContent = text;
      btn.addEventListener("click", () => {
        menu.remove();
        document.removeEventListener("click", onOutsideCloseChoiceMenu, true);
        addCustomPowerTool(fieldIds, buttonIds, mode, label);
        finishPowerToolPicking();
      });
      menu.appendChild(btn);
    }
    document.body.appendChild(menu);
    positionMenu(menu, x, y);
    function onOutsideCloseChoiceMenu(ev) {
      if (!menu.contains(ev.target)) {
        menu.remove();
        document.removeEventListener("click", onOutsideCloseChoiceMenu, true);
        finishPowerToolPicking();
      }
    }
    setTimeout(() => document.addEventListener("click", onOutsideCloseChoiceMenu, true), 0);
  }
  btnStartPowerToolPicker.addEventListener("click", () => {
    powerToolPickerActive = true;
    document.body.classList.add("pt-picking");
    hidePanel(settingsPanel);
    toast("Click any input or button to mark it as a power tool \u2014 Esc to cancel, hold Shift to browse freely.", 5e3);
    setTimeout(() => {
      document.addEventListener("click", onPowerToolPickerClick, true);
      document.addEventListener("keydown", onPowerToolPickerKeydown, true);
      document.addEventListener("keyup", onPowerToolPickerKeyup, true);
    }, 0);
  });
  btnResetCustomPowerTools.addEventListener("click", async () => {
    if (customPowerTools.length === 0) {
      toast("No custom power tool marks to reset.");
      return;
    }
    const ok = await showConfirmModal(`Remove all ${customPowerTools.length} custom power tool mark(s)? Built-in ones are unaffected.`, { okLabel: "Reset", danger: true });
    if (!ok) return;
    customPowerTools = [];
    saveCustomPowerTools();
    applyPowerToolMarks();
    renderPowerToolList();
    toast("Custom power tool marks reset.");
  });
  function initPowerTools() {
    loadCustomPowerTools();
    applyPowerToolMarks();
    renderPowerToolList();
  }

  // src/renderer/help-docs.ts
  var isTouchDevice = (() => {
    try {
      return matchMedia("(hover: none) and (pointer: coarse)").matches;
    } catch {
      return false;
    }
  })();
  var HELP_SECTIONS = [
    {
      id: "opening",
      title: "Opening a dataset",
      html: `
      <p><b>File \u25B8 Open dataset folder</b> and pick the folder with your images and their matching
      <code>.txt</code> caption files (same name, e.g. <code>image.png</code> + <code>image.txt</code>).
      Tags are shown with spaces in the app and saved back to disk with underscores \u2014 you never
      need to think about which one you're looking at.</p>
      <p>The app writes a few of its own files into your dataset folder as you use it. None of
      them touch your images or captions unless you tell them to:</p>
      <ul>
        <li><b>Disabled/</b> \u2014 images you've moved out of the active set. Still fully editable,
        just hidden from the normal views.</li>
        <li><b>_tag_edit_log.json</b> \u2014 the full undo-able history of every edit you've made.</li>
        <li><b>_dts_canonical_tags.json</b> \u2014 your Retroactive Merge/Void rules.</li>
        <li><b>_dts_meta.json</b> \u2014 per-image notes, review flags, locks, and similar metadata.</li>
        <li><b>_dts_synthdat_settings.json</b> \u2014 SynthDat Overseer's prompt/generation settings for
        this dataset (only appears once you've used that tab).</li>
      </ul>`
    },
    {
      id: "gallery",
      title: "The Gallery tab",
      html: `
      <p>This is the tag editor itself \u2014 everything else in the app exists to support what happens
      here. The toolbar at the top of the gallery switches between ${isTouchDevice ? "two views" : "four views"}:</p>
      <ul>
        <li><b>Grid</b> (the default) \u2014 each card shows the image, its tags as editable chips, and
        a 3-dot menu for per-image actions.</li>
        ${isTouchDevice ? "" : `<li><b>Compact</b> \u2014 smaller thumbnails, tags appear on hover. Shift-click two images to
        pin them side by side in a comparison table.</li>
        <li><b>Single</b> \u2014 one image at a time, zoomable up to 400%, drag to pan.</li>`}
        <li><b>\u274C Disabled</b> \u2014 the images you've moved out of the active set.</li>
        <li><b>\u{1F522} Rename all</b> \u2014 renames every loaded image (+ its .txt) to a simple zero-padded
        1-N sequence (active dataset first, then Disabled, continuing the same count). Confirmed
        first; logged and undoable from the Log panel.</li>
      </ul>
      ${isTouchDevice ? "<p>Tap an image to open it full-size, zoomable/pannable with pinch and drag, with tag editing right there in the same modal.</p>" : ""}
      <p>To edit tags: ${isTouchDevice ? "tap" : "click"} a chip to open its menu (filter by it, look up its wiki definition,
      flag it for review, explore its keyword family), type into a card's "+ add tag" box and
      press Enter to add one, or ${isTouchDevice ? "tap" : "click"} a chip's \xD7 to remove it.</p>
      <p><b>Filtering</b> \u2014 the search box on the left supports multiple tags combined with AND /
      OR / XOR / NOT. Type 2 or more characters and a suggestions list appears below the box:
      direct matches first, then other tags that share a word with them (searching "dr" suggests
      "dress" right away, and groups "black dress"/"dress shoes" under a "Same keyword family"
      heading). If you only want an exact match \u2014 so searching "dress" doesn't also pull in "black
      dress" \u2014 check "Exact tag match" just under the search box.</p>
      <p>If your gallery's columns keep changing count as you zoom or open a side panel, that's
      expected \u2014 Settings \u25B8 Appearance has a "Gallery columns" option to lock it to a fixed
      number instead.</p>
      <p><b>Locking</b> an image (\u{1F512}, in its 3-dot menu) keeps it out of every mass or automatic
      tool \u2014 Unify/Void, Master Tags, bulk WD14 \u2014 while leaving it fully editable by hand. Use it
      to protect one image from an unattended batch operation without disabling it.</p>
      ${isTouchDevice ? "" : "<p>Opening a card image also offers <b>\u27F2/\u27F3 Rotate</b> and <b>\u2702 Crop</b> \u2014 pixel edits that rewrite the image file in place (confirmed first, logged and undoable in the Log), with Crop\u2019s Isolate button saving the selected region as a NEW dataset image instead of touching the source.</p>"}`
    },
    {
      id: "image-menu",
      title: "The 3-dot image menu",
      html: `
      <p>Every card has a "\u22EF" button (${isTouchDevice ? "or long-press the card" : "or right-click the card"}) with actions for
      that one image.${isTouchDevice ? "" : ` Labels are kept short on purpose \u2014 hover any of them for the full
      explanation.`}</p>
      <ul>
        <li><b>\u274C Disable / \u21A9 Restore</b> \u2014 move the image to/from Disabled.</li>
        <li><b>\u274C Delete permanently</b> \u2014 removes the image and its tags from
        disk outright, with no way back. Confirmed first; no undo. Also available as a mass
        action in Master Tag Control. Only removes the copy inside your DATASET folder \u2014 if the
        image came from SynthDat Overseer, ComfyUI's own <code>output/</code> folder keeps its own
        separate copy from when it was generated, untouched by this.</li>
        <li><b>\u{1F512} Lock / \u{1F513} Unlock</b> \u2014 see the Gallery section above.</li>
        <li><b>\u{1F6AB} Merge Immunize / \u{1F7E2} Antivoid / \u270B Antimmunize</b> \u2014 permanently exempt this one
        image from the Retroactive Merge/Void dock's rules. This is stronger than Lock: Lock only
        skips mass tools, these specifically block the standing-rule system even when you
        deliberately re-trigger it (e.g. by editing a rule).</li>
        <li><b>\u23EE Reset edits</b> \u2014 revert this image back to its earliest known tag state.</li>
        <li><b>\u{1F5D1}\uFE0F Remove all tags</b> \u2014 clears every tag on this image at once (confirmed first)
        instead of ${isTouchDevice ? "tapping" : "clicking"} each chip's own \xD7. Undoable from the main Undo button.</li>
        <li><b>\u{1F40D} WD14 Tag</b> \u2014 run the autotagger on just this one image.</li>
        <li>Text/language, comic/koma, review flags, blur, and notes \u2014 all write immediately as
        you change them, no separate "Apply" step needed.</li>
      </ul>`
    },
    {
      id: "power-tools",
      title: isTouchDevice ? "Power tools (bottom panel)" : "Power tools (right sidebar)",
      html: (isTouchDevice ? `
      <p>Docked panels in the bottom panel \u2014 swipe left/right to switch between them, tap a dock's
      header to collapse/expand it. Drag-to-reorder and drag-to-resize are both mouse-only, so
      those aren't available here.</p>
      <p><b>\u2702\uFE0F Prune tags</b> opens a full-screen browse/select list. Check any tags you want,
      then either Apply/Void them right there, or <b>\u{1F4BE} Save as task</b> to stash that selection
      and start browsing the next unrelated group without losing it \u2014 each saved task keeps its
      own selection and its own Apply/Void, so several unrelated groups stay separate.</p>` : `
      <p>These are the docked panels in the Gallery's right sidebar. Drag a dock's header to
      reorder it relative to the others, click the header to collapse/expand it, or drag its
      bottom edge to resize (Retroactive Merge/Void sizes itself to its content and skips this).
      The whole sidebar can also be dragged wider or narrower from its own left edge, or tucked
      away entirely via the arrow at its top.</p>
      <p><b>Tag Pruner</b> \u2014 search or browse every tag in the dataset and hand-pick any
      combination to feed into Unify/Void below it. "+ Add another Tag Pruner" opens as many
      independent boxes as you want \u2014 each has its OWN selection (a tag picked in one is hidden
      from the others, so several unrelated keyword families can be browsed side by side without
      colliding). Each box's own header also has <b>\u{1F50D} Mirror to gallery search</b> (only one box
      can drive the left-hand gallery filter at a time \u2014 checking one unchecks any other) and its
      own <b>Clear</b>, affecting just that box.</p>
      <p><b>Unify/Void</b> \u2014 one row per Tag Pruner box that currently has a selection, each with
      its own tag summary and its own Apply/Void. Apply merges that box's selected tags into the
      name you type in; Void permanently deletes them (confirmed first, fully undoable). Both
      actions automatically create or extend a standing rule in Retroactive Merge/Void below, so
      the same correction keeps applying to future tags without you repeating it by hand.</p>`) + `
      <p><b>Retroactive Merge/Void</b> \u2014 standing rules: "these tags \u2192 this one canonical tag" (a
      merge) or "these tags \u2192 nothing" (a void). Whenever a rule's tags show up on a Gallery image
      afterward \u2014 by WD14, Master Tags, an accepted SynthDat image, or typing it in \u2014 they're
      corrected automatically (typing a blocked tag by hand is refused with a toast, not silently
      rewritten). This only affects Gallery images; Disabled ones are frozen until restored. A rule
      can be paused, or one of its tags turned off individually, without losing anything \u2014 both
      actively restore whatever each affected image originally had. Void rules
      show in their own collapsible group (they all share one rule, since there's no separate
      canonical tag to key them by); merge rules list one row per canonical tag.</p>
      <p>Merge and Void tend to matter a lot more for a
      <span style="white-space:nowrap;"><b>character LoRA</b> <button type="button" class="info-btn" id="infoGlossaryCharacterLora" title="Character LoRA vs. style LoRA">\u24D8</button></span>
      than a style one. A character LoRA needs its identity-defining tags kept tight and
      consistent, so a stray misspelling or an inconsistent variant of the same trait doesn't
      teach the model that trait is optional \u2014 that's exactly what these tools clean up. Style
      LoRA training usually wants the opposite (more tag variety, not less), so you'll likely use
      these tools far less there.</p>
      <template id="infoGlossaryCharacterLoraContent">
        <p>A <b>LoRA</b> (Low-Rank Adaptation) is a small add-on file trained on top of a base
        image-generation model to teach it something new, without retraining the whole model from
        scratch.</p>

        <p>A <b>character LoRA</b> teaches the model one specific, recognizable character. Every
        training image shows that same character, so their defining traits are visible in every
        image whether or not a caption mentions them. A common technique splits tags into two
        groups:</p>

        <ul>
          <li><b>Void these</b> \u2014 traits that should ALWAYS be true of the character: eye color,
          hair color/style, a mole, whatever makes them recognizable. With no tag ever describing
          the trait, the model can't learn "this is something the prompt controls" \u2014 it only ever
          sees the trait already there, so it bakes it in as simply part of the character,
          permanently.</li>
          <li><b>Keep these</b> \u2014 traits that genuinely SHOULD change from image to image: pose,
          expression, background. These stay tagged, so they remain normal, promptable choices
          once the LoRA is done.</li>
        </ul>

        <p><b>Watch out for a signature outfit.</b> If the character wears the same distinctive
        outfit in most or all of your training images \u2014 say, a unique white frilly bikini \u2014 that
        outfit's own concept tends to fuse with the character's, even if you keep tagging it
        consistently. The model has rarely (or never) seen that outfit on anyone else, so the two
        ideas start becoming the same thing to it: prompting the character alone may start pulling
        that outfit in unasked, and prompting "white frilly bikini" on its own may start looking
        like this character even on an unrelated subject. If you want the outfit and the character
        to stay independently promptable, that outfit needs to show up on OTHER subjects somewhere
        in training too \u2014 otherwise, treat the fusion as expected for a genuine signature look, not
        a bug.</p>

        <p>This is the concrete reason Merge/Void see so much more use on a character LoRA's
        dataset than elsewhere: cleaning up misspelled variants of a tag AND deliberately
        stripping identity tags out entirely are both about controlling exactly what's locked in
        versus what's still a choice.</p>

        <p>A <b>style LoRA</b>, by contrast, teaches a visual STYLE rather than one character \u2014
        training images are deliberately varied (many different subjects, poses, outfits), so the
        only thing consistent across the whole set is the art style itself. There, you usually
        WANT a wide, varied tag vocabulary kept in, not pruned out, so the model doesn't
        accidentally bake some incidental subject/pose choice into "this is just how the style
        looks" the way it correctly should for a character's actual identity traits.</p>
      </template>`
    },
    {
      id: "tag-overseer",
      title: "Tag Overseer tab",
      html: `
      <p>Two tools live here: Master Tag Control and the WD14 Autotagger. Clicking this tab again
      while it's already open takes you back to the Gallery.</p>
      <p><b>Master Tag Control</b> \u2014 select images by ${isTouchDevice ? "tapping" : "clicking"} thumbnails in the mini-grid here, or
      by selecting them in the main Gallery first (selection stays in sync either way). From there
      you can apply or remove a tag across the whole selection, conditionally apply one tag based
      on another already being present (or its own separate row for the inverse \u2014 based on it
      being ABSENT), or run a dataset-wide rename or find-and-replace. The
      Lock/Unlock and Merge Immunize/Antivoid/Antimmunize buttons here apply the same per-image
      flags described in the 3-dot menu section, but to your entire selection at once. <b>\u274C Delete
      selected permanently</b> removes every selected image and its tags from disk outright
      (confirmed, locked images skipped) \u2014 no undo.</p>
      ${isTouchDevice ? "" : `
      <p><b>\u25B6 Sequential from first / from selected</b> \u2014 walk your current filter image by
      image in Single view with a quick-modify panel: text/language (custom languages welcome),
      censorship state + type checkboxes, multi-select perspective checkboxes, monochrome, sound
      effects, comic, multiple views, koma count. A live tag preview under the image shows
      exactly which tags Confirm will apply before you commit; Confirm advances automatically
      and progress is saved per image. Use it to align indicator tags across a filtered batch.</p>`}
      <p><b>\u{1F40D} WD14 Autotagger</b> \u2014 sends selected images (or a single one, via its 3-dot menu) to
      a WD14 Tagger node on your own ComfyUI instance and merges the tags it returns onto each
      card. Expand "\u2699 WD14 settings" to set the ComfyUI host, model, confidence thresholds, and
      whether results apply automatically or go through a review step first.
      ${isTouchDevice ? `"Tagging source" picks between that (ComfyUI) and <b>on-device tagging</b> \u2014 a model
        runs directly on your phone (hardware-accelerated where the phone supports it, falling
        back to CPU otherwise), no ComfyUI instance needed at all. Models aren't bundled with the
        app; pick one from the built-in catalog for a one-tap download, or paste a HuggingFace repo
        manually. Either mode uses the exact same review step and settings below.` : "This app holds no model itself \u2014 your ComfyUI instance does the actual tagging."}</p>`
    },
    {
      id: "datasets-tab",
      title: "Datasets tab",
      html: `
      <p>A folder manager separate from the Gallery \u2014 every dataset folder you've opened shows up
      here as a themed folder icon. Sort by name/time,${isTouchDevice ? "" : " or manually by dragging,"} and
      ${isTouchDevice ? "tap a folder's \u22EF button" : "right-click a folder (or tap its \u22EF button)"} for more options: remove it from
      this list, pin it as a favorite, view its achievements read-only, or change its icon. Opening
      a folder that isn't tracked here yet prompts you once to add it.</p>`
    },
    {
      id: "stats-tab",
      title: "Editing Stats tab",
      html: `<p>Animated charts (pick pie or bar) of every logged action by type, plus summary cards
      for total edits, undo/redo stack depth, and achievements unlocked so far.</p>`
    },
    {
      id: "synthdat",
      title: "SynthDat Overseer tab",
      html: `
      <p>Drives your own local ComfyUI instance to generate <b>more</b> training images of a
      character you've already started a
      <span style="white-space:nowrap;"><b>character LoRA</b> <button type="button" class="info-btn" id="infoGlossaryCharacterLora2" title="Character LoRA vs. style LoRA">\u24D8</button></span>
      on. The idea: your dataset is thin, so instead of hand-posing or hand-drawing more source
      material, you strong-arm that LoRA into new reference poses via
      <span style="white-space:nowrap;"><b>ControlNet</b> <button type="button" class="info-btn" id="infoGlossaryControlnet" title="What ControlNet is doing here">\u24D8</button></span>.
      Requires ComfyUI with a few extra custom nodes installed \u2014
      ${isTouchDevice ? `this ComfyUI instance is the one running on your PC (SynthDat still runs generation
        there; only the tagging half can run on-device), so grab the node bundle from this
        project's own GitHub repository \u2014 the <code>ComfyUI-dependencies</code> folder there has a
        README covering exactly what's needed and why.` : `see <code>ComfyUI-dependencies/README.md</code> in the app's own folder for exactly what
        and why.`}</p>
      <template id="infoGlossaryCharacterLora2Content">
        <p>A <b>LoRA</b> (Low-Rank Adaptation) is a small add-on file trained on top of a base
        image-generation model to teach it something new without retraining the whole model.</p>

        <p>A <b>character LoRA</b> teaches it one specific, recognizable character. A common
        technique: Void the tags for traits that should ALWAYS be true of that character (eye
        color, hair color, etc.) out of every caption entirely, instead of tagging them \u2014 with no
        tag ever describing the trait, the model can only learn it as permanently part of the
        character, not something the prompt controls. Tags for what SHOULD vary per image \u2014 pose,
        outfit, expression \u2014 stay in, so those remain normal promptable choices.</p>

        <p>One catch: a distinctive outfit the character wears in most/all training images (a
        signature look) tends to fuse with the character concept regardless \u2014 the model rarely
        sees it on anyone else, so the two become hard to separate later.</p>

        <p>See the Power tools section for the fuller version of this, including how to avoid that
        fusion, and how it compares to style LoRA training.</p>
      </template>
      <template id="infoGlossaryControlnetContent">
        <p><b>ControlNet</b> is a way to make an image generation follow a specific structure \u2014
        here, a pose \u2014 instead of leaving pose entirely up to the prompt and chance.</p>

        <p>It looks at your chosen reference image, extracts pose/structure information from it,
        and steers the generation to match that structure while the LoRA still supplies the
        character's actual appearance. In effect: the reference image controls the POSE, the LoRA
        controls WHO's in it.</p>

        <p>"Strength" controls how rigidly the pose is enforced. Start %/End % control which
        portion of the generation process ControlNet stays active for, since enforcing it for the
        whole process can make results look too rigid or copied.</p>
      </template>
      <p><b>The flow:</b></p>
      <ol>
        <li>Pick a reference pose image, or skip this entirely (check "I don't want to use a
        reference image") for an ordinary prompted generation with no ControlNet.</li>
        <li>WD14-interrogate it to pull tags from the reference, then hand-assign the ones that
        matter (pose, limbs, etc.) into their prompt fields \u2014 open them via the "\u2039 \u{1F4DD} Prompt fields"
        edge tab (docked to the right, reachable regardless of scroll); close it with its own \u203A
        arrow or by clicking outside it.</li>
        <li>Fill in the rest of the prompt fields \u2014 Global (Main LoRA trigger word), Character
        Trigger, and Negative always stay visible; check "Use a single unified prompt box" to paste
        one ready-made prompt instead of splitting it across the rest. A \u21C4 button next to
        Width/Height swaps the two instantly. Set your generation parameters in the Generation
        section (sampler, seeds, steps, CFG \u2014 "Enable 2nd pass" runs an optional refinement pass
        and lets you pick between both results before deciding), then ${isTouchDevice ? "tap" : "click"} \u25B6 Generate. \u23F9 Stop
        interrupts a run in progress.</li>
        <li>Review the result \u2014 "\u{1F40D} Re-interrogate output with WD14" checks what the model actually
        drew, since it sometimes adds details nobody prompted for. ${isTouchDevice ? `Tap a tag's \xD7 on the "pending" tag card to drop it from just this image, and tap a merge suggestion to fold it into your dataset's existing canonical spelling.` : `Prune anything you don't want from the "pending" tag card; it also suggests merges based
        on your existing Retroactive Merge/Void rules. Right-click a tag for <b>\u{1F4D6} Definition</b> or
        <b>\u{1F6AB} Mark as void</b> \u2014 voiding drops it from this image AND adds a Retroactive Void rule
        for it on Accept, so import tags (artist, rating, trigger words) get stripped without
        re-running WD14.`}
        A tag already covered by an existing void rule shows struck through automatically,
        previewing what Accept will drop.</li>
        <li>\u2705 Accept writes the image and its tags straight into the dataset as a normal unsaved
        edit (tags are written to disk immediately too, so a crash before your next Save can't lose
        them) \u2014 check "Rename this image to match dataset conventions?" first if this dataset
        already uses simple numbered filenames, to pick up the next number instead of the default
        synth_&lt;timestamp&gt; name. \u274C Reject sends it straight to Disabled instead. Either way,
        nothing generated is ever silently thrown away \u2014 even the pass you didn't pick, if you ran
        2-Pass, is saved to Disabled rather than discarded.</li>
      </ol>
      <p>Every preview image in this tab opens in a zoomable, pannable lightbox on ${isTouchDevice ? "tap" : "click"}.</p>`
    },
    {
      id: "settings",
      title: "Settings",
      html: `
      <p>${isTouchDevice ? "Tap" : "Click"} the \u2699 Settings button (next to File in the top bar) to open it. Each section below
      expands on ${isTouchDevice ? "tap" : "click"}:</p>
      <ul>
        <li><b>Appearance</b> \u2014 theme picker, night/day mode, the font-size slider (the whole
        gallery and panels reflow live as you drag it), and "Gallery columns" to lock the gallery's
        column count independent of zoom or panel width.</li>
        <li><b>Power Tools</b> \u2014 options for marking specific fields/buttons as "power tools" (a
        visual highlight) for your own workflow.</li>
        <li><b>Tagging</b> \u2014 tag-input behavior, e.g. whether typing a new language auto-selects
        it.</li>
        <li><b>Saving</b> \u2014 Autosave (off by default): when on, edits save to disk automatically
        about 1.2 seconds after you stop typing. Every edit stays undoable either way \u2014 each one
        is already in the Edit Log with its own undo.</li>
        <li><b>Performance</b> \u2014 Hardware acceleration (on by default) steers this app's own UI
        rendering onto your integrated GPU instead of competing with ComfyUI's real workload on
        your discrete one. Turning it off forces pure CPU rendering. Takes effect on your next
        launch.</li>
        <li><b>Layout & Panels</b> \u2014 UI animation mode (Fade/Swipe/Off), and "Reset panel layout" if
        a dock's ${isTouchDevice ? "collapse state ever gets stuck" : "drag-reorder or collapse state ever gets into a bad state"}.</li>
        <li><b>Updates & Sharing</b> \u2014 "Restart app" reloads the latest files instantly, no manual
        quit/reopen needed. "\u{1FA7A} Export app state" isn't something you'd normally need \u2014 it's a
        troubleshooting aid that writes a text file next to the app with your current settings,
        theme, panel layout, and whether a dataset's loaded, useful when reporting a bug.</li>
      </ul>`
    },
    {
      id: "themes",
      title: "Themes, Shop & Achievements",
      html: `
      <p>25 themes in total \u2014 4 free, 21 in the \u{1F4B0} Shop (common through legendary, priced in
      Edibits, a small in-app currency you earn from achievements). Every theme has its own accent
      color and at least one real visual flourish beyond its palette. Epic/legendary themes
      get an extra hover-fill effect on buttons; any cheaper theme can buy that same effect
      individually via the Shop's "\u{1F528} Refine Theme" button, for the price difference.</p>
      <p>\u{1F3C6} Achievements (55+, unlocked per dataset folder \u2014 a fresh dataset starts with none
      unlocked) pay out Edibits as you use the app's features. \u{1F319} Night mode is a genuine per-theme
      color inversion.</p>
      <p>Settings \u25B8 Appearance has motion-sensitivity controls: <b>Suppress Theme Flourishes</b>
      hides the Refine Theme button and turns off epic/legendary-tier hover-fill/card-tilt
      everywhere \u2014 whether a theme has it natively or you bought it via Refine Theme. Three
      independent toggles (<b>Disable hover-fill</b>, <b>Disable card hover-tilt</b>, <b>Disable
      ambient animations</b>) let you turn off just one specific motion effect instead of all of
      them. None of these touch a theme's static colors, textures, or glows.</p>`
    },
    {
      id: "favorites",
      title: "Favorites",
      html: `<p>\u2605 Favorites saves frequently-used dataset folders for ${isTouchDevice ? "one-tap" : "one-click"} reopening \u2014 separate
      from the Datasets tab's own folder list, though pinning a folder there syncs it into
      Favorites too.</p>`
    },
    {
      id: "edit-log",
      title: "The Edit Log",
      html: `
      <p>${isTouchDevice ? "Tap" : "Click"} \u{1F4DC} Log to see every logged action for the current dataset, most recent first.
      Actions with real tag data (add/remove, merge/void, rename, find-replace, and the Retroactive
      Merge/Void dock's own unmerge/unvoid corrections) get their own \u21A9 Undo this / \u21AA Redo this
      buttons, independent of the toolbar's main linear Undo/Redo. Disable/Restore actions get a
      toggle button instead. Rule-configuration changes (pausing a rule, toggling a child tag off)
      show up too, just without an Undo button \u2014 there's no tag-level change to reverse for a pure
      setting flip.</p>
      <p>"Export log\u2026" saves the full log as JSON. "Clear log" permanently deletes it for this
      dataset (asks first).</p>`
    },
    {
      id: "saving",
      title: "Saving your work",
      html: `<p>The toolbar's dirty counter shows how many images (and, separately, whether
      Retroactive Merge/Void has unsaved rule changes) are waiting to be written to disk \u2014
      ${isTouchDevice ? "tap" : "click"} Save to write them all. Closing the app, switching datasets, or reloading with unsaved
      changes always asks first; nothing is silently discarded.</p>
      ${isTouchDevice ? `<p><b>\u26A0 Except force-closing the app</b> \u2014 swiping it away in Android's
      recent-apps view kills the app outright, with no chance for that warning (or anything else)
      to run first. Unsaved changes from that session are lost with no way to recover them.
      Save (or turn on Autosave, Settings \u25B8
      Saving) before switching away if you're not sure you'll come back to this same session.</p>` : ""}`
    },
    {
      id: "tips",
      title: "Tips & troubleshooting",
      html: `
      <ul>
        ${isTouchDevice ? "" : `<li>Drag a card straight onto the Disabled tab to disable it quickly (hover a card to see
        this hint appear).</li>`}
        <li>Underscore-to-space conversion only goes one way \u2014 a tag that ends up with an
        underscore while you're editing in-app is treated as containing a literal space, by
        design.</li>
        <li>Night mode doesn't apply to the Custom theme, since that one's already fully under your
        own control.</li>
        <li>If a dock's layout looks broken (stuck collapsed, wrong order), use Settings \u25B8 Layout &
        Panels \u25B8 "Reset panel layout."</li>
        <li>If Tag Details says "no definition found" for everything, the bundled Danbooru wiki
        data files are missing from your install \u2014 redownload the release zip.</li>
        ${isTouchDevice ? "" : `<li>The window hides Electron's default menu bar \u2014 tap Alt to reveal it temporarily.</li>`}
      </ul>`
    }
  ];

  // src/renderer/help.ts
  var HELP_LAST_SECTION_KEY = "dts-help-last-section";
  function renderToc(activeId) {
    helpToc.innerHTML = "";
    const heading = document.createElement("div");
    heading.className = "help-toc-title";
    heading.textContent = "Contents";
    helpToc.appendChild(heading);
    for (const sec of HELP_SECTIONS) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "help-toc-item" + (sec.id === activeId ? " active" : "");
      item.textContent = sec.title;
      item.addEventListener("click", () => showSection(sec.id));
      helpToc.appendChild(item);
    }
  }
  function showSection(id) {
    const sec = HELP_SECTIONS.find((s) => s.id === id) || HELP_SECTIONS[0];
    helpContent.innerHTML = `<h2>${sec.title}</h2>${sec.html}`;
    helpContent.scrollTop = 0;
    initInfoButtons(helpContent);
    renderToc(sec.id);
    try {
      localStorage.setItem(HELP_LAST_SECTION_KEY, sec.id);
    } catch {
    }
  }
  function openHelp() {
    let last = HELP_SECTIONS[0].id;
    try {
      last = localStorage.getItem(HELP_LAST_SECTION_KEY) || last;
    } catch {
    }
    if (!HELP_SECTIONS.some((s) => s.id === last)) last = HELP_SECTIONS[0].id;
    showSection(last);
    helpModal.style.display = "flex";
    requestAnimationFrame(() => requestAnimationFrame(() => helpModal.classList.add("modal-visible")));
  }
  function closeHelp() {
    helpModal.classList.remove("modal-visible");
    setTimeout(() => {
      helpModal.style.display = "none";
    }, 160);
  }
  var tocMenuEl = null;
  function closeTocMenu() {
    if (tocMenuEl) {
      tocMenuEl.remove();
      tocMenuEl = null;
    }
    document.removeEventListener("click", onTocMenuOutsideClick, true);
  }
  function onTocMenuOutsideClick(ev) {
    if (tocMenuEl && !tocMenuEl.contains(ev.target) && ev.target !== helpTocToggle) closeTocMenu();
  }
  function openTocMenu(activeId) {
    closeTocMenu();
    const menu = document.createElement("div");
    menu.className = "ctx-menu";
    for (const sec of HELP_SECTIONS) {
      const item = document.createElement("button");
      item.className = "ctx-item" + (sec.id === activeId ? " active" : "");
      item.textContent = sec.title;
      item.addEventListener("click", (ev) => {
        ev.stopPropagation();
        closeTocMenu();
        showSection(sec.id);
      });
      menu.appendChild(item);
    }
    document.body.appendChild(menu);
    tocMenuEl = menu;
    const rect = helpTocToggle.getBoundingClientRect();
    positionMenu(menu, rect.left, rect.bottom + 4);
    setTimeout(() => document.addEventListener("click", onTocMenuOutsideClick, true), 0);
  }
  function initHelp() {
    btnHelp.addEventListener("click", openHelp);
    helpCloseBtn.addEventListener("click", closeHelp);
    helpTocToggle.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (tocMenuEl) {
        closeTocMenu();
        return;
      }
      let last = HELP_SECTIONS[0].id;
      try {
        last = localStorage.getItem(HELP_LAST_SECTION_KEY) || last;
      } catch {
      }
      openTocMenu(last);
    });
    helpModal.addEventListener("click", (ev) => {
      if (ev.target === helpModal) closeHelp();
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape" && helpModal.style.display !== "none") closeHelp();
    });
  }

  // src/renderer/achievements.ts
  var folderStats = {};
  var folderUnlocked = [];
  var wallet = 0;
  var ownedThemes = ["studio", "cyberpunk", "oriental", "subway"];
  var achievementPopupsEnabled = true;
  var getDirHandle = () => null;
  var getEditLog = () => [];
  var refreshThemeDropdownLabel = () => {
  };
  function initAchievements(deps) {
    getDirHandle = deps.getDirHandle;
    getEditLog = deps.getEditLog;
    refreshThemeDropdownLabel = deps.refreshThemeDropdownLabel;
  }
  var RARITY_VALUE = { common: 10, uncommon: 25, rare: 60, epic: 120, legendary: 250 };
  var RARITY_ICON = { common: "\u26AA", uncommon: "\u{1F7E2}", rare: "\u{1F537}", epic: "\u{1F7E3}", legendary: "\u2B50" };
  var ACHIEVEMENTS = [
    {
      id: "first-edit",
      title: "Baby Steps",
      desc: "Make your first tag edit in this folder.",
      rarity: "common",
      check: (s) => (s.tags_added || 0) + (s.tags_removed || 0) + (s.merges || 0) + (s.voids || 0) + (s.renames || 0) + (s.find_replaces || 0) >= 1
    },
    {
      id: "eye-hater",
      title: "You really hate seeing, don't you?",
      desc: 'Void 5+ tags containing "eye" in a single void action.',
      rarity: "uncommon",
      check: (s) => !!s.flag_eye_hater
    },
    {
      id: "hair-raiser",
      title: "Follicly Judgmental",
      desc: 'Void 5+ tags containing "hair" in a single void action.',
      rarity: "uncommon",
      check: (s) => !!s.flag_hair_raiser
    },
    { id: "merge-10", title: "Merge Enjoyer", desc: "Perform 10 merges in this folder.", rarity: "common", check: (s) => (s.merges || 0) >= 10 },
    { id: "merge-50", title: "Serial Merger", desc: "Perform 50 merges in this folder.", rarity: "rare", check: (s) => (s.merges || 0) >= 50 },
    { id: "tags-100", title: "Tag Hoarder", desc: "Add 100 tags total in this folder.", rarity: "uncommon", check: (s) => (s.tags_added || 0) >= 100 },
    { id: "remove-100", title: "Minimalist", desc: "Remove 100 tags total in this folder.", rarity: "uncommon", check: (s) => (s.tags_removed || 0) >= 100 },
    { id: "void-200", title: "The Great Purge", desc: "Void 200+ tag instances total in this folder.", rarity: "epic", check: (s) => (s.voided_tag_instances || 0) >= 200 },
    { id: "rename-10", title: "Rename Enjoyer", desc: 'Use "Replace all" 10 times.', rarity: "common", check: (s) => (s.renames || 0) >= 10 },
    { id: "fr-10", title: "Find & Replace Wizard", desc: "Use find & replace 10 times.", rarity: "common", check: (s) => (s.find_replaces || 0) >= 10 },
    { id: "undo-20", title: "Time Traveler", desc: "Use Undo 20 times.", rarity: "uncommon", check: (s) => (s.undos || 0) >= 20 },
    { id: "redo-10", title: "Back to the Future", desc: "Use Redo 10 times.", rarity: "uncommon", check: (s) => (s.redos || 0) >= 10 },
    { id: "export-log", title: "Archivist", desc: "Export the edit log at least once.", rarity: "common", check: (s) => (s.log_exports || 0) >= 1 },
    { id: "log-500", title: "Paper Trail", desc: "Accumulate 500 log entries in this folder.", rarity: "rare", check: (s) => (s.log_count || 0) >= 500 },
    { id: "disable-10", title: "The Exile", desc: "Banish 10 images to Disabled/.", rarity: "uncommon", check: (s) => (s.disables || 0) >= 10 },
    { id: "restore-5", title: "Second Chances", desc: "Restore 5 disabled images.", rarity: "common", check: (s) => (s.restores || 0) >= 5 },
    { id: "indecisive", title: "Indecisive", desc: "Disable then restore the same image 3+ times.", rarity: "rare", check: (s) => !!s.flag_indecisive },
    { id: "review-10", title: "The Reviewer", desc: "Flag 10 images for review.", rarity: "uncommon", check: (s) => (s.review_flags || 0) >= 10 },
    { id: "notes-5", title: "Note Taker", desc: "Write notes on 5 images.", rarity: "common", check: (s) => (s.notes_written || 0) >= 5 },
    { id: "polyglot", title: "Polyglot", desc: "Tag 3+ different foreign languages across the dataset.", rarity: "rare", check: (s) => (s.foreign_languages || []).length >= 3 },
    { id: "detective", title: "The Detective", desc: "Open Tag Details 20 times.", rarity: "uncommon", check: (s) => (s.tag_details_opened || 0) >= 20 },
    { id: "decorator", title: "Interior Decorator", desc: "Customize and save a theme.", rarity: "common", check: (s) => !!s.theme_customized },
    { id: "shopper", title: "Window Shopper", desc: "Open the theme shop.", rarity: "common", check: (s) => !!s.shop_opened },
    { id: "big-spender", title: "Big Spender", desc: "Purchase a theme with Edibits.", rarity: "rare", check: (s) => (s.themes_purchased || 0) >= 1 },
    { id: "cheapskate", title: "Cheapskate", desc: "Use the free Edibits button 5 times.", rarity: "common", check: (s) => (s.free_edibits_claims || 0) >= 5 },
    { id: "zoom-300", title: "Zoom Zoom", desc: "Zoom an image past 300%.", rarity: "common", check: (s) => (s.zoom_max || 0) >= 300 },
    { id: "card-peeker", title: "Card Peeker", desc: "Open the floating image card 10 times.", rarity: "common", check: (s) => (s.card_modal_opens || 0) >= 10 },
    { id: "compact-fan", title: "Compact Enjoyer", desc: "Switch to compact grid view.", rarity: "common", check: (s) => !!s.compact_used },
    { id: "sort-master", title: "Sorted Life", desc: "Try 4+ different gallery sort modes.", rarity: "uncommon", check: (s) => (s.sort_modes_used || []).length >= 4 },
    { id: "night-owl", title: "Night Owl", desc: "Enable night mode.", rarity: "common", check: (s) => !!s.night_mode_used },
    { id: "isolation-ward", title: "Isolation Ward", desc: 'Use "Flag isolated tags" to review rare tags.', rarity: "uncommon", check: (s) => !!s.isolated_flag_used },
    { id: "the-overseer", title: "The Overseer", desc: "Use Master Tag Control to apply, remove, or rename a tag.", rarity: "rare", check: (s) => (s.master_ops || 0) >= 1 },
    { id: "yeet", title: "Yeet", desc: "Drag an image onto the Disabled tab.", rarity: "uncommon", check: (s) => !!s.drag_disabled_used },
    // Quick wins — for smaller datasets or a light editing pass, so there's
    // still real Edibits to earn without grinding through hundreds of edits.
    { id: "first-save", title: "Locked In", desc: "Save your changes to disk for the first time.", rarity: "common", check: (s) => (s.saves || 0) >= 1 },
    { id: "tags-10", title: "Ten Tags In", desc: "Add 10 tags total in this folder.", rarity: "common", check: (s) => (s.tags_added || 0) >= 10 },
    { id: "remove-10", title: "Tidied Up", desc: "Remove 10 tags total in this folder.", rarity: "common", check: (s) => (s.tags_removed || 0) >= 10 },
    { id: "review-1", title: "Speed Reviewer", desc: "Flag your first image for review.", rarity: "common", check: (s) => (s.review_flags || 0) >= 1 },
    { id: "favorite-1", title: "Keeper", desc: "Save this folder to Favorites.", rarity: "common", check: (s) => (s.favorited || 0) >= 1 },
    // Steady-progress milestones — the grindier tier above the originals, for
    // datasets you spend real time in.
    { id: "tags-500", title: "Compulsive Tagger", desc: "Add 500 tags total in this folder.", rarity: "rare", check: (s) => (s.tags_added || 0) >= 500 },
    { id: "remove-500", title: "Deep Clean", desc: "Remove 500 tags total in this folder.", rarity: "rare", check: (s) => (s.tags_removed || 0) >= 500 },
    { id: "undo-100", title: "Undo Veteran", desc: "Use Undo 100 times.", rarity: "rare", check: (s) => (s.undos || 0) >= 100 },
    { id: "merge-100", title: "Merge Machine", desc: "Perform 100 merges in this folder.", rarity: "epic", check: (s) => (s.merges || 0) >= 100 },
    { id: "log-2000", title: "Chronicler", desc: "Accumulate 2000 log entries in this folder.", rarity: "epic", check: (s) => (s.log_count || 0) >= 2e3 },
    {
      id: "marathon-1000",
      title: "Marathon Session",
      desc: "Rack up 1000 combined tag edits (added/removed/merged/voided) in this folder.",
      rarity: "epic",
      check: (s) => (s.tags_added || 0) + (s.tags_removed || 0) + (s.merges || 0) + (s.voids || 0) >= 1e3
    },
    // Dataset tab / Refine Theme / Unload dataset / keyboard menu nav
    { id: "dataset-collector", title: "Dataset Collector", desc: "Add 3 dataset folders to the Dataset tab.", rarity: "uncommon", check: (s) => (s.dataset_tab_adds || 0) >= 3 },
    { id: "icon-artist", title: "Icon Artist", desc: "Set an image as a Dataset tab folder's icon.", rarity: "common", check: (s) => (s.dataset_icon_images_set || 0) >= 1 },
    { id: "nosy-neighbor", title: "Nosy Neighbor", desc: "View another dataset folder's achievements from the Dataset tab.", rarity: "uncommon", check: (s) => (s.other_folder_achievements_viewed || 0) >= 1 },
    { id: "theme-refiner", title: "Theme Refiner", desc: "Refine a theme in the shop.", rarity: "rare", check: (s) => (s.themes_refined || 0) >= 1 },
    { id: "clean-slate", title: "Clean Slate", desc: "Unload a dataset without quitting the app.", rarity: "common", check: (s) => (s.dataset_unloads || 0) >= 1 },
    { id: "keyboard-navigator", title: "Keyboard Navigator", desc: "Navigate an open menu or dropdown with the arrow keys.", rarity: "common", check: (s) => !!s.keyboard_menu_nav_used },
    { id: "wd14-autotagger", title: "Snake Charmer", desc: "Tag an image using the WD14 Autotagger.", rarity: "uncommon", check: (s) => (s.wd14_images_tagged || 0) >= 1 },
    // Right-panel UX pass additions
    { id: "sniper-search", title: "Sniper Search", desc: "Turn on Exact tag match in the gallery filter.", rarity: "common", check: (s) => !!s.exact_match_used },
    { id: "family-finder", title: "Family Finder", desc: "Pick a tag from the filter's suggestion dropdown.", rarity: "common", check: (s) => !!s.filter_suggestions_used },
    { id: "grid-lock", title: "Grid Lock", desc: "Force a fixed gallery column count in Settings.", rarity: "common", check: (s) => !!s.gallery_columns_forced },
    { id: "completionist-25", title: "Living Legend", desc: "Unlock 25 other achievements in this folder.", rarity: "legendary", check: (s) => (s.achievements_unlocked || 0) >= 25 }
  ];
  function trackStat(key, amount = 1) {
    folderStats[key] = (folderStats[key] || 0) + amount;
    saveFolderStats();
  }
  var ACH_FILE_NAME = "_dts_achievements.json";
  async function saveFolderStats() {
    const dirHandle = getDirHandle();
    if (!dirHandle) return;
    try {
      const handle = await dirHandle.getFileHandle(ACH_FILE_NAME, { create: true });
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify({ stats: folderStats, unlocked: folderUnlocked }, null, 2));
      await writable.close();
    } catch (err) {
    }
  }
  async function loadFolderStats() {
    folderStats = {};
    folderUnlocked = [];
    const dirHandle = getDirHandle();
    if (!dirHandle) return;
    try {
      const handle = await dirHandle.getFileHandle(ACH_FILE_NAME, { create: false });
      const file = await handle.getFile();
      const parsed = JSON.parse((await file.text()).trim() || "{}");
      folderStats = parsed.stats || {};
      folderUnlocked = parsed.unlocked || [];
    } catch (err) {
      folderStats = {};
      folderUnlocked = [];
    }
  }
  function saveWallet() {
    try {
      localStorage.setItem("dts-wallet", String(wallet));
      localStorage.setItem("dts-owned-themes", JSON.stringify(ownedThemes));
    } catch (e) {
    }
    walletDisplay.textContent = String(wallet);
    achWallet.textContent = String(wallet);
    shopWallet.textContent = String(wallet);
  }
  function loadWallet() {
    try {
      wallet = parseInt(localStorage.getItem("dts-wallet") || "0", 10) || 0;
      const owned = JSON.parse(localStorage.getItem("dts-owned-themes") || "null");
      if (Array.isArray(owned)) ownedThemes = Array.from(/* @__PURE__ */ new Set(["studio", "cyberpunk", "oriental", "subway", ...owned]));
    } catch (e) {
    }
    saveWallet();
  }
  function resetWallet() {
    wallet = 0;
    saveWallet();
  }
  function resetFolderAchievements() {
    folderUnlocked = [];
    folderStats = {};
    saveFolderStats();
  }
  function checkAchievements() {
    if (!getDirHandle()) return;
    folderStats.log_count = getEditLog().length;
    folderStats.achievements_unlocked = folderUnlocked.length;
    let unlockedAny = false;
    for (const ach of ACHIEVEMENTS) {
      if (folderUnlocked.includes(ach.id)) continue;
      let met = false;
      try {
        met = !!ach.check(folderStats);
      } catch (e) {
        met = false;
      }
      if (!met) continue;
      folderUnlocked.push(ach.id);
      unlockedAny = true;
      const reward = RARITY_VALUE[ach.rarity] || 10;
      wallet += reward;
      saveWallet();
      if (achievementPopupsEnabled) showAchievementPopup(ach, reward);
    }
    if (unlockedAny) {
      saveFolderStats();
      if (achievementsPanel.style.display === "flex") renderAchievementsPanel();
    }
  }
  function checkVoidThemeAchievements(tagList, _voidedTagInstances) {
    const lower = tagList.map((t) => t.toLowerCase());
    const eyeCount = lower.filter((t) => t.includes("eye")).length;
    const hairCount = lower.filter((t) => t.includes("hair")).length;
    if (eyeCount >= 5) folderStats.flag_eye_hater = true;
    if (hairCount >= 5) folderStats.flag_hair_raiser = true;
    saveFolderStats();
  }
  function showAchievementPopup(ach, reward) {
    const popup = document.createElement("div");
    popup.className = "ach-popup";
    popup.innerHTML = `
    <span class="ach-rarity-icon">${RARITY_ICON[ach.rarity] || "\u26AA"}</span>
    <div class="ach-info">
      <div class="ach-title">\u{1F3C6} ${escapeHtml(ach.title)}</div>
      <div class="ach-desc">${escapeHtml(ach.desc)}</div>
      <div class="ach-reward">${ach.rarity} achievement \xB7 +${reward} Edibits</div>
    </div>
  `;
    achievementPopupHost.appendChild(popup);
    setTimeout(() => {
      popup.style.transition = "opacity 0.4s ease, transform 0.4s ease";
      popup.style.opacity = "0";
      popup.style.transform = "translateX(20px)";
      setTimeout(() => popup.remove(), 420);
    }, 5e3);
  }
  function renderAchievementsPanel(unlockedOverride) {
    const unlockedList = unlockedOverride || folderUnlocked;
    achWallet.textContent = String(wallet);
    achList.innerHTML = "";
    for (const ach of ACHIEVEMENTS) {
      const unlocked = unlockedList.includes(ach.id);
      const row = document.createElement("div");
      row.className = "ach-row " + (unlocked ? "unlocked" : "locked");
      row.innerHTML = `
      <span class="ach-rarity-icon">${RARITY_ICON[ach.rarity] || "\u26AA"}</span>
      <div class="ach-info">
        <div class="ach-title">${unlocked ? "\u{1F3C6} " : ""}${escapeHtml(ach.title)}</div>
        <div class="ach-desc">${escapeHtml(ach.desc)}</div>
        <div class="ach-reward">${unlocked ? "Unlocked" : "Locked"} \xB7 ${ach.rarity} \xB7 +${RARITY_VALUE[ach.rarity]} Edibits</div>
      </div>
    `;
      achList.appendChild(row);
    }
  }
  function updateThemeSelectLocks() {
    for (const t of PREMIUM_THEMES) {
      const opt = themeSelect.querySelector(`option[value="${t.id}"]`);
      if (opt) opt.textContent = ownedThemes.includes(t.id) ? t.name : `\u{1F512} ${t.name}`;
    }
    refreshThemeDropdownLabel();
  }
  function renderShopPanel() {
    shopWallet.textContent = String(wallet);
    shopList.innerHTML = "";
    const byPrice = [...PREMIUM_THEMES].sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
    for (const t of byPrice) {
      const owned = ownedThemes.includes(t.id);
      const row = document.createElement("div");
      row.className = "shop-row" + (refinedThemes.includes(t.id) ? " refined" : "");
      const swatches = document.createElement("div");
      swatches.className = "shop-swatches";
      t.swatches.forEach((c) => {
        const sw = document.createElement("span");
        sw.className = "shop-swatch";
        sw.style.background = c;
        swatches.appendChild(sw);
      });
      const info = document.createElement("div");
      info.className = "shop-info";
      info.innerHTML = `<div class="shop-name">${escapeHtml(t.name)}</div><div class="shop-rarity">${t.rarity} \xB7 ${t.price} Edibits</div>`;
      const btn = document.createElement("button");
      if (owned) {
        const active = themeSelect.value === t.id;
        btn.textContent = active ? "In use \u2713" : "Use";
        btn.disabled = active;
        if (!active) {
          btn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            useOwnedTheme(t);
          });
        }
      } else {
        btn.textContent = "Buy";
        btn.className = "primary";
        btn.disabled = wallet < t.price;
        btn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          buyTheme(t);
        });
      }
      row.appendChild(swatches);
      row.appendChild(info);
      row.appendChild(btn);
      shopList.appendChild(row);
    }
  }
  function useOwnedTheme(t) {
    themeSelect.value = t.id;
    applyTheme(t.id);
    toast(`Switched to "${t.name}".`);
    renderShopPanel();
    updateRefineThemeButton();
  }
  function buyTheme(t) {
    if (ownedThemes.includes(t.id)) return;
    if (wallet < t.price) {
      toast("Not enough Edibits for that yet.");
      return;
    }
    wallet -= t.price;
    ownedThemes.push(t.id);
    saveWallet();
    themeSelect.value = t.id;
    applyTheme(t.id);
    toast(`Purchased and applied "${t.name}"!`);
    folderStats.themes_purchased = (folderStats.themes_purchased || 0) + 1;
    saveFolderStats();
    renderShopPanel();
    updateThemeSelectLocks();
    updateRefineThemeButton();
    checkAchievements();
  }
  function updateRefineThemeButton() {
    if (suppressThemeFlourishesToggle.checked) {
      btnRefineTheme.style.display = "none";
      return;
    }
    btnRefineTheme.style.display = "";
    const currentTheme = themeSelect.value;
    if (themeAlreadyHasPremiumEffects(currentTheme)) {
      btnRefineTheme.textContent = "\u{1F528} Refine Theme (already refined)";
      btnRefineTheme.disabled = true;
      btnRefineTheme.title = "The current theme already has the epic/legendary button effects.";
      return;
    }
    const cost = refineThemeCost(currentTheme);
    btnRefineTheme.textContent = `\u{1F528} Refine Theme (${cost} Edibits)`;
    btnRefineTheme.disabled = wallet < cost;
    btnRefineTheme.title = "Upgrade the current theme to epic/legendary-tier button effects.";
  }
  function refineCurrentTheme() {
    const currentTheme = themeSelect.value;
    if (themeAlreadyHasPremiumEffects(currentTheme)) return;
    const cost = refineThemeCost(currentTheme);
    if (wallet < cost) {
      toast("Not enough Edibits for that yet.");
      return;
    }
    wallet -= cost;
    saveWallet();
    markThemeRefined(currentTheme);
    toast("Theme refined \u2014 it now has epic/legendary-tier button effects!");
    folderStats.themes_refined = (folderStats.themes_refined || 0) + 1;
    saveFolderStats();
    updateRefineThemeButton();
    checkAchievements();
  }
  function initAchievementPanels() {
    btnAchievements.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (achievementsPanel.style.display === "flex") {
        hidePanel(achievementsPanel);
        return;
      }
      hidePanel(shopPanel);
      hidePanel(favoritesPanel);
      hidePanel(themeCustomPanel);
      hidePanel(logPanel);
      hidePanel(tagDetailsPanel);
      renderAchievementsPanel();
      showPanel(achievementsPanel);
    });
    achCloseBtn.addEventListener("click", () => hidePanel(achievementsPanel));
    achPopupsToggle.addEventListener("change", () => {
      achievementPopupsEnabled = achPopupsToggle.checked;
      try {
        localStorage.setItem("dts-ach-popups", achievementPopupsEnabled ? "1" : "0");
      } catch (e) {
      }
    });
    (function initAchPopupPref() {
      let on = true;
      try {
        on = localStorage.getItem("dts-ach-popups") !== "0";
      } catch (e) {
      }
      achievementPopupsEnabled = on;
      achPopupsToggle.checked = on;
    })();
    btnShop.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (shopPanel.style.display === "flex") {
        hidePanel(shopPanel);
        return;
      }
      hidePanel(achievementsPanel);
      hidePanel(favoritesPanel);
      hidePanel(themeCustomPanel);
      hidePanel(logPanel);
      hidePanel(tagDetailsPanel);
      folderStats.shop_opened = true;
      saveFolderStats();
      renderShopPanel();
      updateRefineThemeButton();
      showPanel(shopPanel);
      checkAchievements();
    });
    shopCloseBtn.addEventListener("click", () => hidePanel(shopPanel));
    btnRefineTheme.addEventListener("click", (ev) => {
      ev.stopPropagation();
      refineCurrentTheme();
    });
    suppressThemeFlourishesToggle.addEventListener("change", () => {
      const on = suppressThemeFlourishesToggle.checked;
      try {
        localStorage.setItem("dts-suppress-theme-flourishes", on ? "1" : "0");
      } catch (e) {
      }
      document.documentElement.classList.toggle("suppress-theme-flourishes", on);
      updateRefineThemeButton();
    });
    (function initSuppressThemeFlourishesPref() {
      let on = false;
      try {
        on = localStorage.getItem("dts-suppress-theme-flourishes") === "1";
      } catch (e) {
      }
      suppressThemeFlourishesToggle.checked = on;
      document.documentElement.classList.toggle("suppress-theme-flourishes", on);
    })();
    function wireFlourishToggle(toggleEl, storageKey, className) {
      toggleEl.addEventListener("change", () => {
        const on2 = toggleEl.checked;
        try {
          localStorage.setItem(storageKey, on2 ? "1" : "0");
        } catch (e) {
        }
        document.documentElement.classList.toggle(className, on2);
      });
      let on = false;
      try {
        on = localStorage.getItem(storageKey) === "1";
      } catch (e) {
      }
      toggleEl.checked = on;
      document.documentElement.classList.toggle(className, on);
    }
    wireFlourishToggle(noFlourishHoverToggle, "dts-no-flourish-hover", "no-flourish-hover");
    wireFlourishToggle(noFlourishTiltToggle, "dts-no-flourish-tilt", "no-flourish-tilt");
    wireFlourishToggle(noFlourishAmbientToggle, "dts-no-flourish-ambient", "no-flourish-ambient");
    btnFreeEdibits.addEventListener("click", () => {
      const lines = [
        "The shopkeeper begrudgingly hands you some Edibits.",
        "You find a few Edibits behind the couch cushions.",
        "A stranger gives you Edibits, no questions asked.",
        "You win a small prize at the Edibit lottery.",
        "The developer takes pity on you."
      ];
      const amount = 10 + Math.floor(Math.random() * 16);
      wallet += amount;
      saveWallet();
      toast(`${lines[Math.floor(Math.random() * lines.length)]} +${amount} Edibits.`);
      folderStats.free_edibits_claims = (folderStats.free_edibits_claims || 0) + 1;
      saveFolderStats();
      renderShopPanel();
      checkAchievements();
    });
    btnResetEdibits.addEventListener("click", async () => {
      const ok = await showConfirmModal("Reset your Edibits balance to 0? This does not affect owned themes or achievements.", { danger: true });
      if (!ok) return;
      resetWallet();
      toast("Edibits reset to 0.");
    });
    btnResetAchievements.addEventListener("click", async () => {
      const ok = await showConfirmModal("Reset achievement progress for this folder? This resets BOTH unlocked achievements and their underlying progress counters, so nothing re-unlocks itself on next load. Edibits already earned stay in your wallet.", { danger: true });
      if (!ok) return;
      resetFolderAchievements();
      if (achievementsPanel.style.display === "flex") renderAchievementsPanel();
      toast("Achievement progress reset for this folder.");
    });
  }

  // src/renderer/edit-log.ts
  var editLog = [];
  var logIdCounter = 1;
  var statsChartMode = "pie";
  var PIXEL_TYPES = /* @__PURE__ */ new Set(["crop-image", "rotate-image"]);
  var ISOLATE_TYPES = /* @__PURE__ */ new Set(["isolate-image"]);
  var LOG_FILE_NAME = "_tag_edit_log.json";
  var getDirHandle2 = () => null;
  var getEntryByBase = () => void 0;
  var applyTagDirectionRef = () => 0;
  var applyRenameDirectionRef = async () => 0;
  var applyPixelDirectionRef = async () => 0;
  var applyIsolateDirectionRef = async () => 0;
  var moveEntryRef = async () => {
  };
  var trackStatRef = () => {
  };
  var checkAchievementsRef = () => {
  };
  var refreshAllUIRef = () => {
  };
  var getUndoStack = () => [];
  var getRedoStack = () => [];
  function pushLogEntry(partial) {
    const entry = {
      ...partial,
      id: logIdCounter++,
      ts: Date.now(),
      type: partial.type,
      summary: partial.summary,
      affected: partial.affected || []
    };
    editLog.push(entry);
    updateLogButton();
    saveEditLog();
    if (logPanel.style.display === "flex") renderLogPanel();
    return entry;
  }
  async function saveEditLog() {
    const dirHandle = getDirHandle2();
    if (!dirHandle) return;
    try {
      const handle = await dirHandle.getFileHandle(LOG_FILE_NAME, { create: true });
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(editLog, null, 2));
      await writable.close();
    } catch {
    }
  }
  async function loadEditLogForFolder() {
    editLog = [];
    logIdCounter = 1;
    const dirHandle = getDirHandle2();
    if (!dirHandle) {
      updateLogButton();
      return;
    }
    try {
      const handle = await dirHandle.getFileHandle(LOG_FILE_NAME, { create: false });
      const file = await handle.getFile();
      const parsed = JSON.parse((await file.text()).trim() || "[]");
      if (Array.isArray(parsed)) editLog = parsed;
      logIdCounter = editLog.reduce((max, e) => Math.max(max, e.id || 0), 0) + 1;
    } catch {
      editLog = [];
      logIdCounter = 1;
    }
    updateLogButton();
  }
  function updateLogButton() {
    btnLog.textContent = getDirHandle2() ? `\u{1F4DC} Log (${editLog.length})` : "\u{1F4DC} Log";
  }
  function formatLogTime(ts) {
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return "";
    }
  }
  var STAT_CHART_COLORS = {
    "add-tag": "#6fb8d1",
    "remove-tag": "#e2637a",
    "merge": "#e8a33d",
    "void": "#c1443c",
    "rename": "#7fbf8f",
    "find-replace": "#a683e0",
    "disable": "#8a6f57",
    "restore": "#4fae7a",
    "undo": "#9791a6",
    "redo": "#6b6578",
    "unmerge": "#d9b35c",
    "unvoid": "#5cb9a8",
    "rule-update": "#8a8fd9",
    "delete": "#c1443c",
    "rename-files": "#4a9fd1",
    "crop-image": "#3aa655",
    "rotate-image": "#7a9fd1",
    "isolate-image": "#b57edc"
  };
  var STAT_TYPE_LABEL = {
    "add-tag": "Tags added",
    "remove-tag": "Tags removed",
    "merge": "Merges",
    "void": "Voids",
    "rename": "Renames",
    "find-replace": "Find & replace",
    "disable": "Disabled",
    "restore": "Restored",
    "undo": "Undos",
    "redo": "Redos",
    "unmerge": "Unmerges",
    "unvoid": "Unvoids",
    "rule-update": "Rule changes",
    "delete": "Deleted permanently",
    "rename-files": "Files renamed",
    "crop-image": "Crops",
    "rotate-image": "Rotates",
    "isolate-image": "Isolates"
  };
  function computeStatsBreakdown() {
    const counts = {};
    for (const entry of editLog) {
      if (!(entry.type in STAT_TYPE_LABEL)) continue;
      counts[entry.type] = (counts[entry.type] || 0) + 1;
    }
    return counts;
  }
  function animateCountUp(el, target, duration = 600) {
    const start = 0;
    const startTime = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - startTime) / duration);
      el.textContent = String(Math.round(start + (target - start) * p));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  function renderStatsTab() {
    const counts = computeStatsBreakdown();
    const entriesArr = Object.entries(counts).filter(([, v]) => v > 0);
    const total = entriesArr.reduce((s, [, v]) => s + v, 0);
    statsChartWrap.innerHTML = "";
    statsLegend.innerHTML = "";
    statsTotals.innerHTML = "";
    if (total === 0) {
      statsChartWrap.innerHTML = '<div class="stats-empty">No edits logged yet in this folder \u2014 make some changes, then check back here.</div>';
      return;
    }
    entriesArr.sort((a, b) => b[1] - a[1]);
    if (statsChartMode === "pie") {
      const size = 240, r = 100, cx = size / 2, cy = size / 2;
      const circumference = 2 * Math.PI * r;
      let offset = 0;
      let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
      svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--bg-elevated)" stroke-width="34"/>`;
      entriesArr.forEach(([type, count], i) => {
        const frac = count / total;
        const dash = frac * circumference;
        const color = STAT_CHART_COLORS[type] || "#888";
        svg += `<circle class="pie-slice" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="34"
        stroke-dasharray="${dash} ${circumference - dash}" stroke-dashoffset="${-offset}"
        transform="rotate(-90 ${cx} ${cy})" style="animation: pieReveal 0.8s ease ${i * 0.08}s both;"/>`;
        offset += dash;
      });
      svg += `<circle cx="${cx}" cy="${cy}" r="${r - 34}" fill="var(--bg-panel)"/>`;
      svg += `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" fill="var(--text-primary)" font-size="22" font-weight="600" font-family="var(--mono)">${total}</text>`;
      svg += `<text x="${cx}" y="${cy + 20}" text-anchor="middle" fill="var(--text-faint)" font-size="10">edits</text>`;
      svg += `</svg>`;
      statsChartWrap.innerHTML = svg;
    } else {
      const wrap = document.createElement("div");
      wrap.style.minWidth = "360px";
      const maxCount = entriesArr[0][1];
      entriesArr.forEach(([type, count], i) => {
        const pct = (count / total * 100).toFixed(1);
        const barWidthPct = count / maxCount * 100;
        const color = STAT_CHART_COLORS[type] || "#888";
        const row = document.createElement("div");
        row.className = "stat-bar-row";
        row.innerHTML = `
        <div class="stat-bar-label">${STAT_TYPE_LABEL[type] || type}</div>
        <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${barWidthPct}%; background:${color}; animation-delay:${i * 0.06}s;"></div></div>
        <div class="stat-bar-value">${count} (${pct}%)</div>
      `;
        wrap.appendChild(row);
      });
      statsChartWrap.appendChild(wrap);
    }
    for (const [type, count] of entriesArr) {
      const pct = (count / total * 100).toFixed(1);
      const row = document.createElement("div");
      row.className = "stats-legend-row";
      const swatch = document.createElement("span");
      swatch.className = "stats-legend-swatch";
      swatch.style.background = STAT_CHART_COLORS[type] || "#888";
      const label = document.createElement("span");
      label.className = "stats-legend-label";
      label.textContent = STAT_TYPE_LABEL[type] || type;
      const value = document.createElement("span");
      value.className = "stats-legend-value";
      value.textContent = `${count} \xB7 ${pct}%`;
      row.appendChild(swatch);
      row.appendChild(label);
      row.appendChild(value);
      statsLegend.appendChild(row);
    }
    const totalCards = [
      ["Total logged edits", total],
      ["Undo stack depth", getUndoStack().length],
      ["Redo stack depth", getRedoStack().length],
      ["Achievements unlocked", folderUnlocked.length]
    ];
    for (const [label, value] of totalCards) {
      const card = document.createElement("div");
      card.className = "stats-total-card";
      const num = document.createElement("div");
      num.className = "num";
      const lbl = document.createElement("div");
      lbl.className = "lbl";
      lbl.textContent = label;
      card.appendChild(num);
      card.appendChild(lbl);
      statsTotals.appendChild(card);
      animateCountUp(num, value);
    }
  }
  function renderLogPanel() {
    const dirHandle = getDirHandle2();
    logPanelTitle.textContent = dirHandle ? `Edit log \u2014 ${dirHandle.name}` : "Edit log";
    logList.innerHTML = "";
    if (editLog.length === 0) {
      logList.innerHTML = '<div class="log-empty">No edits logged yet for this folder.</div>';
      return;
    }
    const TAG_TYPES = /* @__PURE__ */ new Set(["add-tag", "remove-tag", "merge", "void", "rename", "find-replace", "reset-edits", "unmerge", "unvoid"]);
    const MOVE_TYPES = /* @__PURE__ */ new Set(["disable", "restore"]);
    const RENAME_TYPES = /* @__PURE__ */ new Set(["rename-files"]);
    const recent = editLog.slice(-150).reverse();
    for (const logEntry of recent) {
      const row = document.createElement("div");
      row.className = "log-row";
      const meta = document.createElement("div");
      meta.className = "log-meta";
      const time = document.createElement("span");
      time.className = "log-time";
      time.textContent = formatLogTime(logEntry.ts);
      const type = document.createElement("span");
      type.className = "log-type";
      type.textContent = logEntry.type;
      meta.appendChild(time);
      meta.appendChild(type);
      const summary = document.createElement("div");
      summary.className = "log-summary";
      summary.textContent = logEntry.summary;
      row.appendChild(meta);
      row.appendChild(summary);
      if (TAG_TYPES.has(logEntry.type) && logEntry.affected && logEntry.affected.length) {
        const actions = document.createElement("div");
        actions.className = "log-actions";
        const undoBtn = document.createElement("button");
        undoBtn.textContent = "\u21A9 Undo this";
        undoBtn.addEventListener("click", () => applyLogEntryDirection(logEntry, "undo"));
        const redoBtn = document.createElement("button");
        redoBtn.textContent = "\u21AA Redo this";
        redoBtn.className = "primary";
        redoBtn.addEventListener("click", () => applyLogEntryDirection(logEntry, "redo"));
        actions.appendChild(undoBtn);
        actions.appendChild(redoBtn);
        row.appendChild(actions);
      } else if (MOVE_TYPES.has(logEntry.type) && logEntry.affected && logEntry.affected.length) {
        const actions = document.createElement("div");
        actions.className = "log-actions";
        const toggleBtn = document.createElement("button");
        toggleBtn.textContent = logEntry.type === "disable" ? "Restore image" : "Disable image again";
        toggleBtn.className = "primary";
        toggleBtn.addEventListener("click", () => toggleMoveLogEntry(logEntry));
        actions.appendChild(toggleBtn);
        row.appendChild(actions);
      } else if (RENAME_TYPES.has(logEntry.type) && logEntry.affected && logEntry.affected.length) {
        const actions = document.createElement("div");
        actions.className = "log-actions";
        const undoBtn = document.createElement("button");
        undoBtn.textContent = "\u21A9 Undo this";
        undoBtn.addEventListener("click", () => applyRenameLogEntryDirection(logEntry, "undo"));
        const redoBtn = document.createElement("button");
        redoBtn.textContent = "\u21AA Redo this";
        redoBtn.className = "primary";
        redoBtn.addEventListener("click", () => applyRenameLogEntryDirection(logEntry, "redo"));
        actions.appendChild(undoBtn);
        actions.appendChild(redoBtn);
        row.appendChild(actions);
      } else if (PIXEL_TYPES.has(logEntry.type) && logEntry.affected && logEntry.affected.length) {
        const actions = document.createElement("div");
        actions.className = "log-actions";
        const undoBtn = document.createElement("button");
        undoBtn.textContent = "\u21A9 Undo this";
        undoBtn.addEventListener("click", () => applyPixelLogEntryDirection(logEntry, "undo"));
        const redoBtn = document.createElement("button");
        redoBtn.textContent = "\u21AA Redo this";
        redoBtn.className = "primary";
        redoBtn.addEventListener("click", () => applyPixelLogEntryDirection(logEntry, "redo"));
        actions.appendChild(undoBtn);
        actions.appendChild(redoBtn);
        row.appendChild(actions);
      } else if (ISOLATE_TYPES.has(logEntry.type) && logEntry.affected && logEntry.affected.length) {
        const actions = document.createElement("div");
        actions.className = "log-actions";
        const undoBtn = document.createElement("button");
        undoBtn.textContent = "\u21A9 Undo this";
        undoBtn.addEventListener("click", () => applyIsolateLogEntryDirection(logEntry, "undo"));
        const redoBtn = document.createElement("button");
        redoBtn.textContent = "\u21AA Redo this";
        redoBtn.className = "primary";
        redoBtn.addEventListener("click", () => applyIsolateLogEntryDirection(logEntry, "redo"));
        actions.appendChild(undoBtn);
        actions.appendChild(redoBtn);
        row.appendChild(actions);
      }
      logList.appendChild(row);
    }
    if (editLog.length > 150) {
      const note = document.createElement("div");
      note.className = "log-empty";
      note.textContent = `Showing the latest 150 of ${editLog.length} entries \u2014 the rest are still in ${LOG_FILE_NAME}.`;
      logList.appendChild(note);
    }
  }
  function applyLogEntryDirection(logEntry, direction) {
    const count = applyTagDirectionRef(logEntry.affected, direction);
    if (count === 0) {
      toast("None of the affected images are in the loaded dataset anymore.");
      return;
    }
    const verb = direction === "undo" ? "Undid" : "Redid";
    pushLogEntry({
      type: direction,
      summary: `${verb} (from log): ${logEntry.summary}`,
      affected: logEntry.affected
    });
    trackStatRef(direction === "undo" ? "undos" : "redos");
    toast(`${verb} that edit.`);
    refreshAllUIRef();
    renderLogPanel();
    checkAchievementsRef();
  }
  async function applyRenameLogEntryDirection(logEntry, direction) {
    const count = await applyRenameDirectionRef(logEntry.affected, direction);
    if (count === 0) {
      toast("None of the affected images are in the loaded dataset anymore.");
      return;
    }
    const verb = direction === "undo" ? "Undid" : "Redid";
    pushLogEntry({
      type: direction,
      summary: `${verb} (from log): ${logEntry.summary}`,
      affected: logEntry.affected
    });
    trackStatRef(direction === "undo" ? "undos" : "redos");
    toast(`${verb} ${count} of ${logEntry.affected.length} rename(s).`);
    refreshAllUIRef();
    renderLogPanel();
    checkAchievementsRef();
  }
  async function applyPixelLogEntryDirection(logEntry, direction) {
    const count = await applyPixelDirectionRef(logEntry.affected, direction);
    if (count === 0) {
      toast("That image edit can no longer be restored (it was from an earlier session, or the image is gone).");
      return;
    }
    const verb = direction === "undo" ? "Undid" : "Redid";
    pushLogEntry({
      type: direction,
      summary: `${verb} (from log): ${logEntry.summary}`,
      affected: logEntry.affected
    });
    trackStatRef(direction === "undo" ? "undos" : "redos");
    toast(`${verb} that edit.`);
    refreshAllUIRef();
    renderLogPanel();
    checkAchievementsRef();
  }
  async function applyIsolateLogEntryDirection(logEntry, direction) {
    const count = await applyIsolateDirectionRef(logEntry.affected, direction);
    if (count === 0) {
      toast("That isolated image can no longer be restored (it was from an earlier session, or the file is gone).");
      return;
    }
    const verb = direction === "undo" ? "Undid" : "Redid";
    pushLogEntry({
      type: direction,
      summary: `${verb} (from log): ${logEntry.summary}`,
      affected: logEntry.affected
    });
    trackStatRef(direction === "undo" ? "undos" : "redos");
    toast(`${verb} that edit.`);
    refreshAllUIRef();
    renderLogPanel();
    checkAchievementsRef();
  }
  async function toggleMoveLogEntry(logEntry) {
    const base = logEntry.affected[0]?.base;
    const e = base ? getEntryByBase(base) : null;
    if (!e) {
      toast("That image is no longer in the loaded dataset.");
      return;
    }
    const shouldBeDisabled = logEntry.type !== "disable";
    if (e.disabled === shouldBeDisabled) {
      toast("Already in that state.");
      return;
    }
    await moveEntryRef(e, shouldBeDisabled);
    renderLogPanel();
  }
  function initEditLog(deps) {
    getDirHandle2 = deps.getDirHandle;
    getEntryByBase = deps.getEntryByBase;
    applyTagDirectionRef = deps.applyTagDirection;
    applyRenameDirectionRef = deps.applyRenameDirection;
    applyPixelDirectionRef = deps.applyPixelDirection;
    applyIsolateDirectionRef = deps.applyIsolateDirection;
    moveEntryRef = deps.moveEntry;
    trackStatRef = deps.trackStat;
    checkAchievementsRef = deps.checkAchievements;
    refreshAllUIRef = deps.refreshAllUI;
    getUndoStack = deps.getUndoStack;
    getRedoStack = deps.getRedoStack;
    statsViewPie.addEventListener("click", () => {
      statsChartMode = "pie";
      statsViewPie.classList.add("active");
      statsViewBar.classList.remove("active");
      renderStatsTab();
    });
    statsViewBar.addEventListener("click", () => {
      statsChartMode = "bar";
      statsViewBar.classList.add("active");
      statsViewPie.classList.remove("active");
      renderStatsTab();
    });
    btnLog.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (logPanel.style.display === "flex") {
        hidePanel(logPanel);
        return;
      }
      hidePanel(themeCustomPanel);
      hidePanel(favoritesPanel);
      hidePanel(achievementsPanel);
      hidePanel(shopPanel);
      hidePanel(tagDetailsPanel);
      renderLogPanel();
      showPanel(logPanel);
    });
    logCloseBtn.addEventListener("click", () => hidePanel(logPanel));
    btnExportLog.addEventListener("click", async () => {
      if (editLog.length === 0) {
        toast("Nothing to export yet.");
        return;
      }
      if (!window.showSaveFilePicker) {
        toast("File export needs Chrome/Edge/Electron.");
        return;
      }
      try {
        const dirHandle = getDirHandle2();
        const suggestedName = `tag-edit-log-${dirHandle?.name || "dataset"}-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
        const handle = await window.showSaveFilePicker({
          suggestedName,
          types: [{ description: "JSON log", accept: { "application/json": [".json"] } }]
        });
        const writable = await handle.createWritable();
        await writable.write(JSON.stringify(editLog, null, 2));
        await writable.close();
        toast("Log exported.");
      } catch {
      }
    });
    btnClearLog.addEventListener("click", async () => {
      if (editLog.length === 0) return;
      const ok = await showConfirmModal(`Clear all ${editLog.length} log entries for this folder? This cannot be undone.`, { okLabel: "Clear log", danger: true });
      if (!ok) return;
      editLog = [];
      logIdCounter = 1;
      updateLogButton();
      saveEditLog();
      renderLogPanel();
      toast("Log cleared.");
    });
  }

  // src/renderer/canonical-tags.ts
  var canonicalRules = [];
  var ruleIdCounter = 1;
  var getDirHandle3 = () => null;
  var getEntries = () => [];
  var markDirtyRef = () => {
  };
  var refreshAllUIRef2 = () => {
  };
  var markRulesDirtyRef = () => {
  };
  var recordChangeRef = () => {
  };
  var RULES_FILE_NAME = "_dts_canonical_tags.json";
  function nextRuleId() {
    return `r${ruleIdCounter++}`;
  }
  function activeChildren(rule) {
    const off = rule.disabledChildren || [];
    return rule.children.filter((t) => !off.includes(t));
  }
  function newRuleDefaults() {
    return { enabled: true, disabledChildren: [] };
  }
  async function saveCanonicalRules() {
    const dirHandle = getDirHandle3();
    if (!dirHandle) return;
    try {
      const handle = await dirHandle.getFileHandle(RULES_FILE_NAME, { create: true });
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(canonicalRules, null, 2));
      await writable.close();
    } catch (err) {
    }
  }
  function reconstructFromEditLog() {
    const rules = [];
    const byCanonical = /* @__PURE__ */ new Map();
    let voidRule = null;
    for (const le of editLog) {
      if (le.type === "merge" && le.mergedTags && le.unifiedTag) {
        let rule = byCanonical.get(le.unifiedTag);
        if (!rule) {
          rule = { id: nextRuleId(), canonical: le.unifiedTag, children: [], ...newRuleDefaults() };
          byCanonical.set(le.unifiedTag, rule);
          rules.push(rule);
        }
        for (const t of le.mergedTags) {
          if (t !== rule.canonical && !rule.children.includes(t)) rule.children.push(t);
        }
      } else if (le.type === "void" && le.voidedTags) {
        if (!voidRule) {
          voidRule = { id: nextRuleId(), canonical: null, children: [], ...newRuleDefaults() };
          rules.push(voidRule);
        }
        for (const t of le.voidedTags) {
          if (!voidRule.children.includes(t)) voidRule.children.push(t);
        }
      }
    }
    return rules;
  }
  async function loadCanonicalRulesForFolder() {
    canonicalRules = [];
    ruleIdCounter = 1;
    const dirHandle = getDirHandle3();
    if (!dirHandle) {
      renderCanonicalTagsList();
      return;
    }
    try {
      const handle = await dirHandle.getFileHandle(RULES_FILE_NAME, { create: false });
      const file = await handle.getFile();
      const parsed = JSON.parse((await file.text()).trim() || "[]");
      if (Array.isArray(parsed)) canonicalRules = parsed.map((r) => ({
        id: r.id,
        canonical: r.canonical,
        children: r.children || [],
        enabled: r.enabled !== false,
        disabledChildren: r.disabledChildren || []
      }));
      ruleIdCounter = canonicalRules.reduce((max, r) => Math.max(max, parseInt(String(r.id || "r0").slice(1), 10) || 0), 0) + 1;
    } catch (err) {
      canonicalRules = reconstructFromEditLog();
      if (canonicalRules.length) await saveCanonicalRules();
    }
    renderCanonicalTagsList();
  }
  function ruleAppliesToEntry(rule, entry) {
    if (!rule.enabled) return false;
    const meta = entry.meta || {};
    if (rule.canonical && meta.mergeImmune) return false;
    if (!rule.canonical && meta.antivoid) return false;
    return true;
  }
  function applyCanonicalRules(entry) {
    if (entry.disabled) return false;
    let changed = false;
    for (const rule of canonicalRules) {
      if (!ruleAppliesToEntry(rule, entry)) continue;
      const active = activeChildren(rule);
      if (active.length === 0) continue;
      if (!entry.tags.some((t) => active.includes(t))) continue;
      const newTags = entry.tags.filter((t) => !active.includes(t));
      if (rule.canonical && !newTags.includes(rule.canonical)) newTags.push(rule.canonical);
      entry.tags = newTags;
      changed = true;
    }
    return changed;
  }
  function findBlockingRule(tag, entry) {
    for (const rule of canonicalRules) {
      if (rule.canonical && tag === rule.canonical) continue;
      if (!ruleAppliesToEntry(rule, entry)) continue;
      if (activeChildren(rule).includes(tag)) return rule;
    }
    return null;
  }
  function activeVoidTagSet() {
    const set = /* @__PURE__ */ new Set();
    for (const rule of canonicalRules) {
      if (!rule.enabled || rule.canonical) continue;
      for (const t of activeChildren(rule)) set.add(t);
    }
    return set;
  }
  function resweepAllEntries() {
    let touched = 0;
    for (const e of getEntries()) {
      if (e.meta && e.meta.locked) continue;
      if (e.disabled) continue;
      if (applyCanonicalRules(e)) {
        markDirtyRef(e);
        touched++;
      }
    }
    if (touched > 0) refreshAllUIRef2();
    return touched;
  }
  function buildMergeEvidenceIndex(canonical, tags) {
    const index = new Map(tags.map((t) => [t, /* @__PURE__ */ new Set()]));
    for (const le of editLog) {
      if (le.type !== "merge" || le.unifiedTag !== canonical) continue;
      const merged = le.mergedTags || [];
      for (const a of le.affected || []) {
        const prev = a.prevTags || [];
        for (const t of tags) {
          if (merged.includes(t) && prev.includes(t)) index.get(t).add(a.base);
        }
      }
    }
    return index;
  }
  function buildVoidEvidenceIndex(tags) {
    const index = new Map(tags.map((t) => [t, /* @__PURE__ */ new Set()]));
    for (const le of editLog) {
      if (le.type !== "void") continue;
      const voided = le.voidedTags || [];
      for (const a of le.affected || []) {
        const prev = a.prevTags || [];
        for (const t of tags) {
          if (voided.includes(t) && prev.includes(t)) index.get(t).add(a.base);
        }
      }
    }
    return index;
  }
  function unmergeChildren(rule, childrenBeingTurnedOff) {
    let touched = 0;
    const affected = [];
    if (!rule.canonical) {
      const index = buildVoidEvidenceIndex(childrenBeingTurnedOff);
      for (const e of getEntries()) {
        if (e.meta && e.meta.locked) continue;
        if (e.disabled) continue;
        const prevTags = e.tags.slice();
        let changed = false;
        for (const child of childrenBeingTurnedOff) {
          if (e.tags.includes(child)) continue;
          if (!index.get(child).has(e.base)) continue;
          e.tags = [...e.tags, child];
          changed = true;
        }
        if (changed) {
          markDirtyRef(e);
          touched++;
          affected.push({ base: e.base, prevTags, newTags: e.tags.slice() });
        }
      }
      if (touched > 0) {
        const tagPhrase = childrenBeingTurnedOff.length === 1 ? `tag "${childrenBeingTurnedOff[0]}"` : `${childrenBeingTurnedOff.length} tags`;
        recordChangeRef("unvoid", `Unvoided ${tagPhrase} back onto ${touched} image(s).`, affected, { revivedTags: childrenBeingTurnedOff.slice() });
      }
    } else {
      const index = buildMergeEvidenceIndex(rule.canonical, rule.children);
      const disabledChildren = rule.disabledChildren || [];
      for (const e of getEntries()) {
        if (e.meta && e.meta.locked) continue;
        if (e.disabled) continue;
        if (!e.tags.includes(rule.canonical)) continue;
        const prevTags = e.tags.slice();
        let changed = false;
        let stillJustified = false;
        for (const child of rule.children) {
          const hadIt = index.get(child).has(e.base);
          if (childrenBeingTurnedOff.includes(child)) {
            if (hadIt && !e.tags.includes(child)) {
              e.tags = [...e.tags, child];
              changed = true;
            }
          } else if (rule.enabled && !disabledChildren.includes(child) && hadIt) {
            stillJustified = true;
          }
        }
        if (!stillJustified && e.tags.includes(rule.canonical)) {
          e.tags = e.tags.filter((t) => t !== rule.canonical);
          changed = true;
        }
        if (changed) {
          markDirtyRef(e);
          touched++;
          affected.push({ base: e.base, prevTags, newTags: e.tags.slice() });
        }
      }
      if (touched > 0) {
        const tagPhrase = childrenBeingTurnedOff.length === 1 ? `tag "${childrenBeingTurnedOff[0]}"` : `${childrenBeingTurnedOff.length} tags`;
        recordChangeRef("unmerge", `Unmerged ${tagPhrase} back out of "${rule.canonical}" for ${touched} image(s).`, affected, { restoredTags: childrenBeingTurnedOff.slice(), canonical: rule.canonical });
      }
    }
    if (touched > 0) refreshAllUIRef2();
    return touched;
  }
  function ruleLabel(rule) {
    return rule.canonical ? `merge rule \u2192 "${rule.canonical}"` : "void rule";
  }
  function logRuleChange(summary) {
    pushLogEntry({ type: "rule-update", summary, affected: [] });
  }
  function registerMergeRule(children, canonical) {
    let rule = canonicalRules.find((r) => r.canonical === canonical);
    if (!rule) {
      rule = { id: nextRuleId(), canonical, children: [], ...newRuleDefaults() };
      canonicalRules.push(rule);
    }
    for (const t of children) {
      if (!rule.children.includes(t)) rule.children.push(t);
    }
    markRulesDirtyRef();
    renderCanonicalTagsList();
    resweepAllEntries();
  }
  function registerVoidRule(children) {
    let rule = canonicalRules.find((r) => r.canonical === null);
    if (!rule) {
      rule = { id: nextRuleId(), canonical: null, children: [], ...newRuleDefaults() };
      canonicalRules.push(rule);
    }
    for (const t of children) {
      if (!rule.children.includes(t)) rule.children.push(t);
    }
    markRulesDirtyRef();
    renderCanonicalTagsList();
    resweepAllEntries();
  }
  function commitRuleChange() {
    markRulesDirtyRef();
    resweepAllEntries();
    renderCanonicalTagsList();
  }
  function buildChip(text, active, onToggleActive, onRemove) {
    const chip = document.createElement("span");
    chip.className = "chip" + (active ? "" : " canonical-chip-disabled");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = active;
    cb.title = active ? "Uncheck to pause this tag in the rule without deleting it" : "This tag is toggled off \u2014 check to resume including it in the merge/void";
    cb.addEventListener("change", () => onToggleActive(cb.checked));
    chip.appendChild(cb);
    const label = document.createElement("span");
    label.textContent = text;
    chip.appendChild(label);
    const btn = document.createElement("button");
    btn.textContent = "\xD7";
    btn.title = "Remove this tag from the rule entirely";
    btn.addEventListener("click", onRemove);
    chip.appendChild(btn);
    return chip;
  }
  function buildRuleRow(rule) {
    const row = document.createElement("div");
    row.className = "canonical-rule-row";
    row.dataset.ruleId = String(rule.id);
    row.classList.toggle("canonical-rule-disabled", !rule.enabled);
    const head = document.createElement("div");
    head.className = "canonical-rule-head";
    if (rule.canonical) {
      const label = document.createElement("span");
      label.className = "canonical-rule-label";
      label.textContent = `\u2192 ${rule.canonical}`;
      label.title = "Every ACTIVE child tag below gets rewritten to this canonical tag.";
      head.appendChild(label);
    } else {
      const label = document.createElement("span");
      label.className = "canonical-rule-label canonical-rule-void";
      label.textContent = "\u{1F5D1} Void (remove entirely)";
      label.title = "Every ACTIVE child tag below gets removed outright \u2014 nothing replaces it.";
      head.appendChild(label);
    }
    const enableToggle = document.createElement("label");
    enableToggle.className = "canonical-rule-enable-toggle";
    enableToggle.title = rule.enabled ? "Uncheck to pause this whole rule" : "This rule is paused \u2014 check to resume applying it";
    const enableCb = document.createElement("input");
    enableCb.type = "checkbox";
    enableCb.checked = rule.enabled;
    enableCb.addEventListener("change", () => {
      const wasEnabled = rule.enabled;
      rule.enabled = enableCb.checked;
      if (wasEnabled && !rule.enabled) unmergeChildren(rule, rule.children.slice());
      logRuleChange(`${rule.enabled ? "Resumed" : "Paused"} ${ruleLabel(rule)}.`);
      commitRuleChange();
    });
    enableToggle.appendChild(enableCb);
    enableToggle.appendChild(document.createTextNode(rule.enabled ? " Enabled" : " Paused"));
    head.appendChild(enableToggle);
    const deleteRuleBtn = document.createElement("button");
    deleteRuleBtn.textContent = "\u{1F5D1} Delete rule";
    deleteRuleBtn.title = "Remove this whole rule and unmerge/unvoid whatever it affected, using the edit log to restore exactly the tags each image actually had";
    deleteRuleBtn.addEventListener("click", () => {
      unmergeChildren(rule, rule.children.slice());
      logRuleChange(`Deleted ${ruleLabel(rule)}.`);
      canonicalRules = canonicalRules.filter((r) => r.id !== rule.id);
      markRulesDirtyRef();
      renderCanonicalTagsList();
    });
    head.appendChild(deleteRuleBtn);
    row.appendChild(head);
    const chipRow = document.createElement("div");
    chipRow.className = "chiprow";
    const disabledChildren = rule.disabledChildren || (rule.disabledChildren = []);
    for (const child of rule.children) {
      chipRow.appendChild(buildChip(
        child,
        !disabledChildren.includes(child),
        (nowActive) => {
          rule.disabledChildren = nowActive ? disabledChildren.filter((t) => t !== child) : [...disabledChildren, child];
          if (!nowActive) unmergeChildren(rule, [child]);
          logRuleChange(`${nowActive ? "Turned tag back on" : "Turned tag off"}: "${child}" in ${ruleLabel(rule)}.`);
          commitRuleChange();
        },
        () => {
          unmergeChildren(rule, [child]);
          rule.children = rule.children.filter((t) => t !== child);
          rule.disabledChildren = disabledChildren.filter((t) => t !== child);
          logRuleChange(`Removed tag "${child}" from ${ruleLabel(rule)}.`);
          commitRuleChange();
        }
      ));
    }
    row.appendChild(chipRow);
    const addRow = document.createElement("div");
    addRow.className = "canonical-rule-add-row";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = rule.canonical ? "Add another tag to merge in\u2026" : "Add another tag to void\u2026";
    const addBtn = document.createElement("button");
    addBtn.textContent = "+ Add";
    function commitAdd() {
      const tag = input.value.trim().replace(/_/g, " ").replace(/\s+/g, " ");
      if (!tag) return;
      if (!rule.children.includes(tag)) rule.children.push(tag);
      input.value = "";
      logRuleChange(`Added tag "${tag}" to ${ruleLabel(rule)}.`);
      commitRuleChange();
    }
    addBtn.addEventListener("click", commitAdd);
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") commitAdd();
    });
    addRow.appendChild(input);
    addRow.appendChild(addBtn);
    row.appendChild(addRow);
    return row;
  }
  var voidSectionExpanded = true;
  try {
    voidSectionExpanded = localStorage.getItem("dts-void-section-expanded") !== "0";
  } catch (e) {
  }
  function renderCanonicalTagsList() {
    canonicalTagsList.innerHTML = "";
    if (canonicalRules.length === 0) {
      const empty = document.createElement("div");
      empty.className = "stats-empty";
      empty.textContent = `No standing merge/void rules yet \u2014 use Tag Pruner's Unify/Void above, or "+ New rule" below.`;
      canonicalTagsList.appendChild(empty);
      return;
    }
    const voidRules = canonicalRules.filter((r) => !r.canonical);
    const mergeRules = canonicalRules.filter((r) => r.canonical);
    if (voidRules.length) {
      const voidTagCount = voidRules.reduce((sum, r) => sum + r.children.length, 0);
      const section = document.createElement("div");
      section.className = "settings-section canonical-rule-group";
      section.classList.toggle("expanded", voidSectionExpanded);
      const header = document.createElement("button");
      header.type = "button";
      header.className = "settings-section-header";
      header.innerHTML = `<span class="settings-section-arrow">\u25B8</span><span>\u{1F5D1} Void \u2014 ${voidTagCount} tag${voidTagCount === 1 ? "" : "s"}</span>`;
      header.addEventListener("click", () => {
        voidSectionExpanded = !section.classList.contains("expanded");
        section.classList.toggle("expanded", voidSectionExpanded);
        try {
          localStorage.setItem("dts-void-section-expanded", voidSectionExpanded ? "1" : "0");
        } catch (e) {
        }
      });
      section.appendChild(header);
      const body = document.createElement("div");
      body.className = "settings-section-body";
      for (const rule of voidRules) body.appendChild(buildRuleRow(rule));
      section.appendChild(body);
      canonicalTagsList.appendChild(section);
    }
    if (mergeRules.length) {
      const header = document.createElement("div");
      header.className = "canonical-rule-group-header";
      header.textContent = `\u2192 Merge rules (${mergeRules.length})`;
      canonicalTagsList.appendChild(header);
      for (const rule of mergeRules) canonicalTagsList.appendChild(buildRuleRow(rule));
    }
  }
  function initCanonicalTags(deps) {
    getDirHandle3 = deps.getDirHandle;
    getEntries = deps.getEntries;
    markDirtyRef = deps.markDirty;
    refreshAllUIRef2 = deps.refreshAllUI;
    markRulesDirtyRef = deps.markRulesDirty;
    recordChangeRef = deps.recordChange;
    btnAddCanonicalRule.addEventListener("click", () => {
      const newRule = { id: nextRuleId(), canonical: "", children: [], ...newRuleDefaults() };
      canonicalRules.push(newRule);
      voidSectionExpanded = true;
      renderCanonicalTagsList();
      const newRow = canonicalTagsList.querySelector(`.canonical-rule-row[data-rule-id="${newRule.id}"]`);
      const head = newRow && newRow.querySelector(".canonical-rule-head");
      if (!head) return;
      const label = head.querySelector(".canonical-rule-label");
      if (!label) return;
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.placeholder = "Canonical tag name (leave blank for a void rule)";
      nameInput.className = "canonical-rule-name-input";
      function commitName() {
        const rule = canonicalRules[canonicalRules.length - 1];
        const isFirstCommit = rule.canonical === "";
        const name = nameInput.value.trim().replace(/_/g, " ").replace(/\s+/g, " ");
        rule.canonical = name || null;
        if (isFirstCommit) logRuleChange(`Created ${ruleLabel(rule)}.`);
        markRulesDirtyRef();
        renderCanonicalTagsList();
      }
      nameInput.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") commitName();
      });
      nameInput.addEventListener("blur", commitName);
      head.replaceChild(nameInput, label);
      nameInput.focus();
    });
  }

  // src/renderer/tags-edit.ts
  var undoStack = [];
  var redoStack = [];
  var pixelStates = /* @__PURE__ */ new Map();
  var isolateStates = /* @__PURE__ */ new Map();
  function getIsolateState(id) {
    return isolateStates.get(id);
  }
  function recordIsolateChange(summary, base, state) {
    const affected = [{ base }];
    const logEntry = pushLogEntry({ type: "isolate-image", summary, affected });
    affected[0].logId = logEntry.id;
    isolateStates.set(logEntry.id, state);
    undoStack.push({ type: "isolate-image", summary, affected });
    redoStack = [];
    updateUndoRedoButtons();
  }
  function recordPixelChange(type, summary, base, state) {
    const affected = [{ base }];
    const logEntry = pushLogEntry({ type, summary, affected });
    affected[0].logId = logEntry.id;
    pixelStates.set(logEntry.id, state);
    undoStack.push({ type, summary, affected });
    redoStack = [];
    updateUndoRedoButtons();
  }
  async function applyPixelDirection(affected, direction) {
    let count = 0;
    for (const a of affected) {
      const e = getEntryByBase2(a.base);
      const st = typeof a.logId === "number" ? pixelStates.get(a.logId) : void 0;
      if (!e || !st) continue;
      const bytes = direction === "undo" ? st.prev : st.next;
      try {
        const writable = await e.imgHandle.createWritable();
        await writable.write(bytes);
        await writable.close();
      } catch {
        continue;
      }
      try {
        URL.revokeObjectURL(e.objectUrl);
      } catch {
      }
      e.objectUrl = URL.createObjectURL(new Blob([bytes], { type: st.mime }));
      if (direction === "undo") {
        e.width = st.prevW;
        e.height = st.prevH;
      } else {
        e.width = st.nextW;
        e.height = st.nextH;
      }
      count++;
    }
    if (count) renderCurrentViewRef();
    return count;
  }
  var getEntries2 = () => [];
  var getEntryByBase2 = () => void 0;
  var getDirHandle4 = () => null;
  var getDisabledDirHandle = () => null;
  var setDisabledDirHandle = () => {
  };
  var reindexEntry = () => {
  };
  var resetSingleIndex = () => {
  };
  var refreshStatsRef = () => {
  };
  var refreshAllUIRef3 = () => {
  };
  var renderCurrentViewRef = () => {
  };
  var applyIsolateDirectionRef2 = async () => 0;
  var AUTOSAVE_KEY = "dts-autosave";
  (function initAutosavePref() {
    let on = false;
    try {
      on = localStorage.getItem(AUTOSAVE_KEY) === "1";
    } catch (e) {
    }
    autosaveToggle.checked = on;
  })();
  autosaveToggle.addEventListener("change", () => {
    try {
      localStorage.setItem(AUTOSAVE_KEY, autosaveToggle.checked ? "1" : "0");
    } catch (e) {
    }
  });
  var autosaveTimer = null;
  var AUTOSAVE_DEBOUNCE_MS = 1200;
  function scheduleAutosave() {
    if (!autosaveToggle.checked) return;
    if (autosaveTimer !== null) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      saveAllDirty(true);
    }, AUTOSAVE_DEBOUNCE_MS);
  }
  function markDirty(entry) {
    applyCanonicalRules(entry);
    entry.dirty = true;
    updateDirtyUI();
    scheduleAutosave();
  }
  var rulesDirty = false;
  function markRulesDirty() {
    rulesDirty = true;
    updateDirtyUI();
    scheduleAutosave();
  }
  function resetRulesDirty() {
    rulesDirty = false;
    updateDirtyUI();
  }
  function updateDirtyUI() {
    const dirtyCount = getEntries2().filter((e) => e.dirty).length;
    let label;
    if (rulesDirty && dirtyCount > 0) label = `(${dirtyCount} + rules)`;
    else if (rulesDirty) label = "(rules)";
    else label = `(${dirtyCount})`;
    dirtyCountEl.textContent = label;
    btnSave.disabled = dirtyCount === 0 && !rulesDirty;
  }
  function resetImageEdits(entry) {
    const relevant = editLog.filter(
      (le) => le.affected && le.affected.some((a) => a.base === entry.base && a.prevTags) && le.type !== "restore" && le.type !== "disable" && le.type !== "undo" && le.type !== "redo" && le.type !== "reset-edits"
    );
    if (relevant.length === 0) {
      toast("No edit history found for this image yet.");
      return;
    }
    const first = relevant[0];
    const affectedItem = first.affected.find((a) => a.base === entry.base);
    const prevTags = entry.tags.slice();
    entry.tags = affectedItem.prevTags.slice();
    markDirty(entry);
    recordChange(
      "reset-edits",
      `Reset ${entry.imgName} to its earliest known tag state.`,
      [{ base: entry.base, prevTags, newTags: entry.tags.slice() }]
    );
    refreshAllUIRef3();
    toast("Reverted this image to its earliest known state.");
  }
  function addTagToEntry(entry, tag) {
    tag = tag.trim().replace(/_/g, " ").replace(/\s+/g, " ");
    if (!tag) return;
    if (findBlockingRule(tag, entry)) {
      toast("This tag is affected by a merge/void rule; please check the dock area for details.", 3600);
      return;
    }
    if (!entry.tags.includes(tag)) {
      const prevTags = entry.tags.slice();
      entry.tags.push(tag);
      markDirty(entry);
      refreshStatsRef();
      recordChange(
        "add-tag",
        `Added tag "${tag}" to ${entry.imgName}`,
        [{ base: entry.base, prevTags, newTags: entry.tags.slice() }]
      );
      trackStat("tags_added");
      checkAchievements();
    }
  }
  function removeTagFromEntry(entry, tag) {
    const i = entry.tags.indexOf(tag);
    if (i !== -1) {
      const prevTags = entry.tags.slice();
      entry.tags.splice(i, 1);
      markDirty(entry);
      refreshStatsRef();
      recordChange(
        "remove-tag",
        `Removed tag "${tag}" from ${entry.imgName}`,
        [{ base: entry.base, prevTags, newTags: entry.tags.slice() }]
      );
      trackStat("tags_removed");
      checkAchievements();
    }
  }
  function removeAllTagsFromEntry(entry) {
    if (entry.tags.length === 0) {
      toast("This image has no tags to remove.");
      return;
    }
    const prevTags = entry.tags.slice();
    const count = prevTags.length;
    entry.tags = [];
    markDirty(entry);
    refreshStatsRef();
    recordChange(
      "remove-tag",
      `Removed all ${count} tag(s) from ${entry.imgName}`,
      [{ base: entry.base, prevTags, newTags: [] }]
    );
    trackStat("tags_removed", count);
    checkAchievements();
  }
  function recordChange(type, summary, affected, extra = {}) {
    const record = { type, summary, affected, ...extra };
    undoStack.push(record);
    redoStack = [];
    updateUndoRedoButtons();
    pushLogEntry({ type, summary, affected, ...extra });
    return record;
  }
  function applyTagDirection(affected, direction) {
    let count = 0;
    for (const a of affected) {
      const e = getEntryByBase2(a.base);
      if (!e) continue;
      const target = direction === "undo" ? a.prevTags : a.newTags;
      if (!target) continue;
      e.tags = target.slice();
      markDirty(e);
      count++;
    }
    return count;
  }
  function updateUndoRedoButtons() {
    btnUndo.disabled = undoStack.length === 0;
    btnRedo.disabled = redoStack.length === 0;
  }
  function resetUndoRedo() {
    undoStack = [];
    redoStack = [];
    pixelStates.clear();
    isolateStates.clear();
  }
  async function ensureDisabledDir() {
    let disabledDirHandle = getDisabledDirHandle();
    if (!disabledDirHandle) {
      disabledDirHandle = await getDirHandle4().getDirectoryHandle("Disabled", { create: true });
      setDisabledDirHandle(disabledDirHandle);
    }
    return disabledDirHandle;
  }
  async function moveEntry(entry, toDisabled) {
    const dirHandle = getDirHandle4();
    if (!dirHandle) return;
    try {
      const targetDir = toDisabled ? await ensureDisabledDir() : dirHandle;
      const sourceDir = toDisabled ? dirHandle : getDisabledDirHandle();
      const file = await entry.imgHandle.getFile();
      const newImgHandle = await targetDir.getFileHandle(entry.imgName, { create: true });
      const iw = await newImgHandle.createWritable();
      await iw.write(file);
      await iw.close();
      if (sourceDir) {
        try {
          await sourceDir.removeEntry(entry.imgName);
        } catch (e) {
        }
        try {
          await sourceDir.removeEntry(entry.txtName);
        } catch (e) {
        }
      }
      entry.imgHandle = newImgHandle;
      if (entry.tags.length > 0) {
        const newTxtHandle = await targetDir.getFileHandle(entry.txtName, { create: true });
        const tw = await newTxtHandle.createWritable();
        await tw.write(entry.tags.join(", "));
        await tw.close();
        entry.txtHandle = newTxtHandle;
        entry.txtExisted = true;
      } else {
        entry.txtHandle = null;
        entry.txtExisted = false;
      }
      entry.dirty = false;
      entry.disabled = toDisabled;
      toast(toDisabled ? `Moved "${entry.imgName}" to Disabled/. Filename kept as-is, so restoring slots it right back in.` : `Restored "${entry.imgName}" to the dataset root.`, 3200);
      pushLogEntry({
        type: toDisabled ? "disable" : "restore",
        summary: toDisabled ? `Disabled ${entry.imgName}` : `Restored ${entry.imgName}`,
        affected: [{ base: entry.base }]
      });
      trackStat(toDisabled ? "disables" : "restores");
      const mc = folderStats.moveCounts || {};
      mc[entry.base] = (mc[entry.base] || 0) + 1;
      folderStats.moveCounts = mc;
      if (mc[entry.base] >= 6) folderStats.flag_indecisive = true;
      saveFolderStats();
      resetSingleIndex();
      refreshAllUIRef3();
      checkAchievements();
    } catch (err) {
      toast("Could not move that file \u2014 check folder permissions.", 3600);
    }
  }
  async function renameFileInPlace(dir, oldName, newName) {
    const oldHandle = await dir.getFileHandle(oldName, { create: false });
    const file = await oldHandle.getFile();
    const newHandle = await dir.getFileHandle(newName, { create: true });
    const writable = await newHandle.createWritable();
    await writable.write(file);
    await writable.close();
    await dir.removeEntry(oldName);
    return newHandle;
  }
  async function renameAllEntriesSequentially() {
    const dirHandle = getDirHandle4();
    if (!dirHandle) {
      toast("Open a dataset folder first.");
      return;
    }
    const disabledDirHandle = getDisabledDirHandle();
    const byFilename = (a, b) => a.base.localeCompare(b.base, void 0, { numeric: true });
    const active = getEntries2().filter((e) => !e.disabled).sort(byFilename);
    const disabled = getEntries2().filter((e) => e.disabled).sort(byFilename);
    const ordered = [...active, ...disabled];
    if (ordered.length === 0) {
      toast("No images to rename.");
      return;
    }
    const width = String(ordered.length).length;
    const extOf = (name) => {
      const i = name.lastIndexOf(".");
      return i === -1 ? "" : name.slice(i);
    };
    const plan = ordered.map((entry, i) => {
      const newBase = String(i + 1).padStart(width, "0");
      return {
        entry,
        dir: entry.disabled ? disabledDirHandle : dirHandle,
        oldBase: entry.base,
        oldImgName: entry.imgName || entry.base,
        oldTxtName: entry.txtHandle ? entry.txtName || `${entry.base}.txt` : null,
        newBase,
        newImgName: newBase + extOf(entry.imgName || entry.base),
        newTxtName: entry.txtHandle ? `${newBase}.txt` : null
      };
    });
    try {
      for (let i = 0; i < plan.length; i++) {
        const p = plan[i];
        p.entry.imgHandle = await renameFileInPlace(p.dir, p.oldImgName, `__dts_rename_tmp_${i}__${extOf(p.oldImgName)}`);
        if (p.entry.txtHandle && p.oldTxtName) {
          p.entry.txtHandle = await renameFileInPlace(p.dir, p.oldTxtName, `__dts_rename_tmp_${i}__.txt`);
        }
      }
      const affected = [];
      for (const p of plan) {
        p.entry.imgHandle = await renameFileInPlace(p.dir, p.entry.imgHandle.name, p.newImgName);
        if (p.entry.txtHandle) {
          p.entry.txtHandle = await renameFileInPlace(p.dir, p.entry.txtHandle.name, p.newTxtName);
        }
        reindexEntry(p.oldBase, p.newBase);
        p.entry.base = p.newBase;
        p.entry.imgName = p.newImgName;
        p.entry.txtName = `${p.newBase}.txt`;
        affected.push({
          base: p.newBase,
          prevBase: p.oldBase,
          prevImgName: p.oldImgName,
          newImgName: p.newImgName,
          prevTxtName: p.oldTxtName || void 0,
          newTxtName: p.newTxtName || void 0
        });
      }
      pushLogEntry({
        type: "rename-files",
        summary: `Renamed ${affected.length} image(s) to a simple 1-${ordered.length} sequence.`,
        affected
      });
      toast(`Renamed ${affected.length} image(s).`, 3200);
      resetSingleIndex();
      refreshAllUIRef3();
    } catch (err) {
      toast("Something went wrong partway through \u2014 check folder permissions. Some files may already be renamed; check the Log panel for what completed.", 4600);
      refreshAllUIRef3();
    }
  }
  async function applyRenameDirection(affected, direction) {
    const dirHandle = getDirHandle4();
    if (!dirHandle) return 0;
    const disabledDirHandle = getDisabledDirHandle();
    let count = 0;
    for (const a of affected) {
      if (!a.prevBase || !a.prevImgName || !a.newImgName) continue;
      const fromBase = direction === "undo" ? a.base : a.prevBase;
      const toBase = direction === "undo" ? a.prevBase : a.base;
      const entry = getEntryByBase2(fromBase);
      if (!entry) continue;
      const dir = entry.disabled ? disabledDirHandle : dirHandle;
      if (!dir) continue;
      const fromImgName = direction === "undo" ? a.newImgName : a.prevImgName;
      const toImgName = direction === "undo" ? a.prevImgName : a.newImgName;
      try {
        entry.imgHandle = await renameFileInPlace(dir, fromImgName, toImgName);
        if (entry.txtHandle && a.prevTxtName && a.newTxtName) {
          const fromTxtName = direction === "undo" ? a.newTxtName : a.prevTxtName;
          const toTxtName = direction === "undo" ? a.prevTxtName : a.newTxtName;
          entry.txtHandle = await renameFileInPlace(dir, fromTxtName, toTxtName);
          entry.txtName = toTxtName;
        }
        reindexEntry(fromBase, toBase);
        entry.base = toBase;
        entry.imgName = toImgName;
        count++;
      } catch (err) {
      }
    }
    return count;
  }
  function initTagsEdit(deps) {
    getEntries2 = deps.getEntries;
    getEntryByBase2 = deps.getEntryByBase;
    getDirHandle4 = deps.getDirHandle;
    getDisabledDirHandle = deps.getDisabledDirHandle;
    setDisabledDirHandle = deps.setDisabledDirHandle;
    reindexEntry = deps.reindexEntry;
    resetSingleIndex = deps.resetSingleIndex;
    refreshStatsRef = deps.refreshStats;
    refreshAllUIRef3 = deps.refreshAllUI;
    renderCurrentViewRef = deps.renderCurrentView;
    applyIsolateDirectionRef2 = deps.applyIsolateDirection;
    btnUndo.addEventListener("click", async () => {
      const record = undoStack.pop();
      if (!record) return;
      const count = PIXEL_TYPES.has(record.type) ? await applyPixelDirection(record.affected, "undo") : ISOLATE_TYPES.has(record.type) ? await applyIsolateDirectionRef2(record.affected, "undo") : applyTagDirection(record.affected, "undo");
      redoStack.push(record);
      updateUndoRedoButtons();
      const summary = `Undid: ${record.summary}`;
      toast(count > 0 ? summary : "Nothing to undo on the currently loaded images.");
      pushLogEntry({ type: "undo", summary, affected: record.affected });
      trackStat("undos");
      refreshAllUIRef3();
      checkAchievements();
    });
    btnRedo.addEventListener("click", async () => {
      const record = redoStack.pop();
      if (!record) return;
      const count = PIXEL_TYPES.has(record.type) ? await applyPixelDirection(record.affected, "redo") : ISOLATE_TYPES.has(record.type) ? await applyIsolateDirectionRef2(record.affected, "redo") : applyTagDirection(record.affected, "redo");
      undoStack.push(record);
      updateUndoRedoButtons();
      const summary = `Redid: ${record.summary}`;
      toast(count > 0 ? summary : "Nothing to redo on the currently loaded images.");
      pushLogEntry({ type: "redo", summary, affected: record.affected });
      trackStat("redos");
      refreshAllUIRef3();
      checkAchievements();
    });
    btnSave.addEventListener("click", () => saveAllDirty());
  }
  function applyUnifyToTags(tagsSet, unified) {
    unified = (unified || "").trim();
    if (!unified) {
      toast("Enter a name for the unified tag first.");
      return false;
    }
    if (tagsSet.size === 0) {
      toast("Select at least one tag to merge.");
      return false;
    }
    const affected = [];
    for (const e of getEntries2()) {
      if (e.meta?.locked || e.disabled && !includeDisabledToggle.checked) continue;
      const hasAny = e.tags.some((t) => tagsSet.has(t));
      if (!hasAny) continue;
      const prevTags = e.tags.slice();
      let newTags = e.tags.filter((t) => !tagsSet.has(t));
      if (!newTags.includes(unified)) newTags.push(unified);
      e.tags = newTags;
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: newTags.slice() });
    }
    const mergedTagsList = Array.from(tagsSet);
    const mergeSummary = `Merged ${tagsSet.size} tag(s) into "${unified}" across ${affected.length} image(s).`;
    toast(mergeSummary);
    recordChange("merge", mergeSummary, affected, { mergedTags: mergedTagsList, unifiedTag: unified });
    trackStat("merges");
    registerMergeRule(mergedTagsList, unified);
    tagsSet.clear();
    refreshAllUIRef3();
    checkAchievements();
    return true;
  }
  async function applyVoidToTags(tagsSet) {
    if (tagsSet.size === 0) {
      toast("Select at least one tag to void.");
      return false;
    }
    const tagList = Array.from(tagsSet);
    const preview = tagList.length > 4 ? `${tagList.slice(0, 4).join(", ")}, +${tagList.length - 4} more` : tagList.join(", ");
    const ok = await showConfirmModal(
      `Permanently remove ${tagList.length} tag(s) from every image?

${preview}

This deletes them outright \u2014 nothing is merged into a replacement tag. Use Undo right after if you change your mind.`,
      { okLabel: "Void tags", danger: true }
    );
    if (!ok) return false;
    const affected = [];
    let voidedTagInstances = 0;
    for (const e of getEntries2()) {
      if (e.meta?.locked || e.disabled && !includeDisabledToggle.checked) continue;
      const hasAny = e.tags.some((t) => tagsSet.has(t));
      if (!hasAny) continue;
      const prevTags = e.tags.slice();
      voidedTagInstances += e.tags.filter((t) => tagsSet.has(t)).length;
      const newTags = e.tags.filter((t) => !tagsSet.has(t));
      e.tags = newTags;
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: newTags.slice() });
    }
    const voidSummary = `Voided ${tagsSet.size} tag(s), removed from ${affected.length} image(s).`;
    toast(voidSummary);
    recordChange("void", voidSummary, affected, { voidedTags: tagList });
    trackStat("voids");
    trackStat("voided_tag_instances", voidedTagInstances);
    checkVoidThemeAchievements(tagList, voidedTagInstances);
    registerVoidRule(tagList);
    tagsSet.clear();
    refreshAllUIRef3();
    checkAchievements();
    return true;
  }
  async function saveAllDirty(silent = false) {
    const dirHandle = getDirHandle4();
    const disabledDirHandle = getDisabledDirHandle();
    const dirty = getEntries2().filter((e) => e.dirty);
    if (dirty.length === 0 && !rulesDirty) return;
    let ok = 0, fail = 0;
    if (rulesDirty) {
      await saveCanonicalRules();
      rulesDirty = false;
    }
    for (const e of dirty) {
      try {
        const targetDir = e.disabled ? disabledDirHandle : dirHandle;
        if (!targetDir) {
          fail++;
          continue;
        }
        if (!e.txtHandle) {
          e.txtHandle = await targetDir.getFileHandle(e.txtName, { create: true });
        }
        const writable = await e.txtHandle.createWritable();
        await writable.write(e.tags.join(", "));
        await writable.close();
        e.dirty = false;
        e.txtExisted = true;
        ok++;
      } catch (err) {
        fail++;
      }
    }
    updateDirtyUI();
    renderCurrentViewRef();
    if (ok > 0) {
      trackStat("saves");
      checkAchievements();
    }
    if (!silent) {
      const savedParts = [];
      if (ok > 0 || fail > 0) savedParts.push(fail === 0 ? `${ok} caption file(s)` : `${ok} caption file(s), failed ${fail}`);
      toast(savedParts.length ? `Saved ${savedParts.join(" and ")}.` : "Saved Retroactive Merge/Void rule changes.", 3400);
    }
  }

  // src/renderer/tag-pruner.ts
  var tagPruners = [{ id: 1, filter: "", selected: /* @__PURE__ */ new Set(), unifiedName: "" }];
  var tagPrunerIdCounter = 2;
  var pruneTasks = [];
  var pruneTaskIdCounter = 1;
  var getIndexRef = () => /* @__PURE__ */ new Map();
  var onSelectionChangeRef = () => {
  };
  var mirrorToGalleryRef = () => {
  };
  var mirrorSourcePrunerId = null;
  function initTagPruner(getIndex, onSelectionChange, mirrorToGallery) {
    getIndexRef = getIndex;
    onSelectionChangeRef = onSelectionChange;
    mirrorToGalleryRef = mirrorToGallery;
  }
  function tagsClaimedByOthers(pruner) {
    const claimed = /* @__PURE__ */ new Set();
    for (const p of tagPruners) {
      if (p.id === pruner.id) continue;
      for (const t of p.selected) claimed.add(t);
    }
    return claimed;
  }
  function renderTagPruners() {
    tagPrunerList.innerHTML = "";
    const index = getIndexRef();
    tagPruners.forEach((pruner) => {
      const instance = document.createElement("div");
      instance.className = "pruner-instance";
      const head = document.createElement("div");
      head.className = "pruner-instance-head";
      const input = document.createElement("input");
      input.type = "text";
      input.className = "power-tool pt-dynamic";
      input.placeholder = "Search tags, or leave empty to browse all\u2026";
      input.value = pruner.filter;
      input.addEventListener("input", () => {
        pruner.filter = input.value;
        renderPrunerResults(pruner, resultsList, index);
      });
      head.appendChild(input);
      const mirrorLabel = document.createElement("label");
      mirrorLabel.className = "pruner-mirror-toggle";
      mirrorLabel.title = "Mirror this Tag Pruner's selection to the gallery search on the left, so you can see the images you're about to modify. Only one Tag Pruner can drive the gallery search at a time.";
      const mirrorCb = document.createElement("input");
      mirrorCb.type = "checkbox";
      mirrorCb.checked = mirrorSourcePrunerId === pruner.id;
      mirrorCb.addEventListener("change", () => {
        mirrorSourcePrunerId = mirrorCb.checked ? pruner.id : null;
        renderTagPruners();
        if (mirrorSourcePrunerId !== null) mirrorToGalleryRef(pruner.selected);
      });
      mirrorLabel.appendChild(mirrorCb);
      mirrorLabel.appendChild(document.createTextNode("\u{1F50D}"));
      head.appendChild(mirrorLabel);
      const clearBtn = document.createElement("button");
      clearBtn.className = "pruner-clear-btn";
      clearBtn.textContent = "Clear";
      clearBtn.title = "Deselect every tag in THIS Tag Pruner (other Tag Pruners are unaffected)";
      clearBtn.disabled = pruner.selected.size === 0;
      clearBtn.addEventListener("click", () => {
        pruner.selected.clear();
        onSelectionChangeRef();
        renderTagPruners();
        if (mirrorSourcePrunerId === pruner.id) mirrorToGalleryRef(pruner.selected);
      });
      head.appendChild(clearBtn);
      if (tagPruners.length > 1) {
        const rmBtn = document.createElement("button");
        rmBtn.className = "pruner-remove-btn danger-ghost";
        rmBtn.textContent = "\u2715";
        rmBtn.title = "Remove this Tag Pruner";
        rmBtn.addEventListener("click", () => {
          if (mirrorSourcePrunerId === pruner.id) mirrorSourcePrunerId = null;
          tagPruners = tagPruners.filter((p) => p.id !== pruner.id);
          renderTagPruners();
        });
        head.appendChild(rmBtn);
      }
      instance.appendChild(head);
      const resultsList = document.createElement("div");
      resultsList.className = "pruner-instance-list";
      instance.appendChild(resultsList);
      tagPrunerList.appendChild(instance);
      renderPrunerResults(pruner, resultsList, index);
    });
    renderUnifyVoidRows();
    renderMobileTaskSection();
  }
  function renderMobileTaskSection() {
    if (!document.documentElement.classList.contains("touch-device")) return;
    const pruner = tagPruners[0];
    if (!pruner) return;
    const wrap = document.createElement("div");
    wrap.className = "pruner-mobile-tasks";
    const saveBtn = document.createElement("button");
    saveBtn.className = "primary";
    saveBtn.textContent = "\u{1F4BE} Save as task";
    saveBtn.title = "Stash the tags currently checked above as a separate merge/void job, and clear the checkboxes to browse for the next one";
    saveBtn.disabled = pruner.selected.size === 0;
    saveBtn.addEventListener("click", () => {
      pruneTasks.push({ id: pruneTaskIdCounter++, selected: new Set(pruner.selected), unifiedName: "" });
      pruner.selected.clear();
      onSelectionChangeRef();
      renderTagPruners();
      if (mirrorSourcePrunerId === pruner.id) mirrorToGalleryRef(pruner.selected);
    });
    wrap.appendChild(saveBtn);
    tagPrunerList.appendChild(wrap);
    const index = getIndexRef();
    const entries = [];
    if (pruner.selected.size > 0) {
      entries.push({
        selected: pruner.selected,
        unifiedName: pruner.unifiedName,
        label: "Current selection",
        setName: (v) => {
          pruner.unifiedName = v;
        },
        afterApply: () => {
          pruner.unifiedName = "";
        },
        afterVoid: () => {
        }
      });
    }
    for (const task of pruneTasks) {
      entries.push({
        selected: task.selected,
        unifiedName: task.unifiedName,
        label: "Saved task",
        setName: (v) => {
          task.unifiedName = v;
        },
        afterApply: () => {
          pruneTasks = pruneTasks.filter((t) => t !== task);
        },
        afterVoid: () => {
          pruneTasks = pruneTasks.filter((t) => t !== task);
        },
        discard: () => {
          pruneTasks = pruneTasks.filter((t) => t !== task);
          renderTagPruners();
        }
      });
    }
    if (entries.length === 0) {
      const empty = document.createElement("div");
      empty.className = "selection-summary";
      empty.textContent = 'No tags selected yet \u2014 check some tags above, or "Save as task" to queue up more than one merge/void job.';
      wrap.appendChild(empty);
      return;
    }
    entries.forEach((entry) => {
      const row = document.createElement("div");
      row.className = "unify-void-row";
      const summary = document.createElement("div");
      summary.className = "selection-summary";
      for (const tag of entry.selected) {
        const span = document.createElement("span");
        span.className = "tk";
        span.textContent = tag;
        summary.appendChild(span);
      }
      const totalImages = /* @__PURE__ */ new Set();
      for (const tag of entry.selected) {
        const set = index.get(tag);
        if (set) set.forEach((b) => totalImages.add(b));
      }
      const footer = document.createElement("div");
      footer.style.marginTop = "6px";
      footer.style.color = "var(--text-faint)";
      footer.textContent = `${entry.label} \xB7 ${entry.selected.size} tag${entry.selected.size === 1 ? "" : "s"} \xB7 affects ${totalImages.size} image${totalImages.size === 1 ? "" : "s"}`;
      summary.appendChild(footer);
      row.appendChild(summary);
      const applyRow = document.createElement("div");
      applyRow.className = "apply-row";
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.className = "power-tool pt-dynamic";
      nameInput.placeholder = "Unified_tag_name";
      nameInput.value = entry.unifiedName;
      nameInput.addEventListener("input", () => {
        entry.setName(nameInput.value);
      });
      const applyBtn = document.createElement("button");
      applyBtn.className = "primary power-tool pt-dynamic";
      applyBtn.textContent = "Apply";
      applyBtn.title = "Merge all these tags into this one name";
      applyBtn.addEventListener("click", () => {
        const ok = applyUnifyToTags(entry.selected, nameInput.value);
        if (!ok) return;
        entry.afterApply();
        renderTagPruners();
      });
      applyRow.appendChild(nameInput);
      applyRow.appendChild(applyBtn);
      row.appendChild(applyRow);
      const actionsRow = document.createElement("div");
      actionsRow.className = "selection-actions-row";
      const voidBtn = document.createElement("button");
      voidBtn.className = "danger-ghost power-tool pt-dynamic";
      voidBtn.textContent = "Void";
      voidBtn.title = "Permanently delete these tags from every image \u2014 nothing is merged into a replacement";
      voidBtn.addEventListener("click", async () => {
        const ok = await applyVoidToTags(entry.selected);
        if (!ok) return;
        entry.afterVoid();
        renderTagPruners();
      });
      actionsRow.appendChild(voidBtn);
      if (entry.discard) {
        const discardBtn = document.createElement("button");
        discardBtn.className = "ghost-secondary";
        discardBtn.textContent = "Discard task";
        discardBtn.addEventListener("click", entry.discard);
        actionsRow.appendChild(discardBtn);
      }
      row.appendChild(actionsRow);
      wrap.appendChild(row);
    });
  }
  function renderPrunerResults(pruner, resultsList, index) {
    const q = pruner.filter.trim().toLowerCase();
    const claimed = tagsClaimedByOthers(pruner);
    let list = Array.from(index.entries()).filter(([tag]) => !claimed.has(tag));
    if (q) list = list.filter(([tag]) => tag.toLowerCase().includes(q));
    list.sort((a, b) => q ? b[1].size - a[1].size : a[0].localeCompare(b[0]));
    resultsList.innerHTML = "";
    if (list.length === 0) {
      resultsList.innerHTML = '<div class="match-row" style="cursor:default; color:var(--text-faint);">No tags match.</div>';
      return;
    }
    for (const [tag, set] of list) {
      const row = document.createElement("label");
      row.className = "match-row" + (pruner.selected.has(tag) ? " selected" : "");
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = pruner.selected.has(tag);
      cb.addEventListener("change", () => {
        if (cb.checked) pruner.selected.add(tag);
        else pruner.selected.delete(tag);
        onSelectionChangeRef();
        renderTagPruners();
        if (mirrorSourcePrunerId === pruner.id) mirrorToGalleryRef(pruner.selected);
      });
      const name = document.createElement("span");
      name.className = "name";
      name.textContent = tag;
      const cnt = document.createElement("span");
      cnt.className = "cnt";
      cnt.textContent = `${set.size}\xD7`;
      row.appendChild(cb);
      row.appendChild(name);
      row.appendChild(cnt);
      resultsList.appendChild(row);
    }
  }
  function renderUnifyVoidRows() {
    if (!unifyVoidRows) return;
    unifyVoidRows.innerHTML = "";
    const active = tagPruners.filter((p) => p.selected.size > 0);
    if (active.length === 0) {
      const empty = document.createElement("div");
      empty.className = "selection-summary";
      empty.textContent = "No tags selected yet \u2014 pick some in a Tag Pruner box above.";
      unifyVoidRows.appendChild(empty);
      return;
    }
    const index = getIndexRef();
    active.forEach((pruner) => {
      const row = document.createElement("div");
      row.className = "unify-void-row";
      const summary = document.createElement("div");
      summary.className = "selection-summary";
      for (const tag of pruner.selected) {
        const span = document.createElement("span");
        span.className = "tk";
        span.textContent = tag;
        summary.appendChild(span);
      }
      const totalImages = /* @__PURE__ */ new Set();
      for (const tag of pruner.selected) {
        const set = index.get(tag);
        if (set) set.forEach((b) => totalImages.add(b));
      }
      const footer = document.createElement("div");
      footer.style.marginTop = "6px";
      footer.style.color = "var(--text-faint)";
      footer.textContent = `${pruner.selected.size} tag${pruner.selected.size === 1 ? "" : "s"} selected \xB7 affects ${totalImages.size} image${totalImages.size === 1 ? "" : "s"}`;
      summary.appendChild(footer);
      row.appendChild(summary);
      const applyRow = document.createElement("div");
      applyRow.className = "apply-row";
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.className = "power-tool pt-dynamic";
      nameInput.placeholder = "Unified_tag_name";
      nameInput.value = pruner.unifiedName;
      nameInput.addEventListener("input", () => {
        pruner.unifiedName = nameInput.value;
      });
      const applyBtn = document.createElement("button");
      applyBtn.className = "primary power-tool pt-dynamic";
      applyBtn.textContent = "Apply";
      applyBtn.title = "Merge all selected tags into this one name";
      applyBtn.addEventListener("click", () => {
        const ok = applyUnifyToTags(pruner.selected, pruner.unifiedName);
        if (!ok) return;
        pruner.unifiedName = "";
        renderTagPruners();
      });
      applyRow.appendChild(nameInput);
      applyRow.appendChild(applyBtn);
      row.appendChild(applyRow);
      const actionsRow = document.createElement("div");
      actionsRow.className = "selection-actions-row";
      const voidBtn = document.createElement("button");
      voidBtn.className = "danger-ghost power-tool pt-dynamic";
      voidBtn.textContent = "Void";
      voidBtn.title = "Permanently delete the selected tags from every image \u2014 nothing is merged into a replacement";
      voidBtn.addEventListener("click", async () => {
        const ok = await applyVoidToTags(pruner.selected);
        if (ok) renderTagPruners();
      });
      actionsRow.appendChild(voidBtn);
      row.appendChild(actionsRow);
      unifyVoidRows.appendChild(row);
    });
  }
  function addTagPruner() {
    tagPruners.push({ id: tagPrunerIdCounter++, filter: "", selected: /* @__PURE__ */ new Set(), unifiedName: "" });
    renderTagPruners();
  }

  // src/renderer/tags-autocomplete.ts
  var tagAutocompleteEnabled = false;
  function setTagAutocompleteEnabled(on) {
    tagAutocompleteEnabled = on;
    if (!tagAutocompleteEnabled) closeAutocomplete();
  }
  var autocompleteEl = null;
  var ensureWikiDataLoadedRef = null;
  var getCustomTagNoteRef = null;
  var setCustomTagNoteRef = null;
  var ensureAllTagsLoadedRef = null;
  var addTagToEntryRef = null;
  var refreshRightPanelsRef = null;
  function initTagAutocomplete(deps) {
    ensureWikiDataLoadedRef = deps.ensureWikiDataLoaded;
    getCustomTagNoteRef = deps.getCustomTagNote;
    setCustomTagNoteRef = deps.setCustomTagNote;
    ensureAllTagsLoadedRef = deps.ensureAllTagsLoaded;
    addTagToEntryRef = deps.addTagToEntry;
    refreshRightPanelsRef = deps.refreshRightPanels;
  }
  function closeAutocomplete() {
    hideInlineDefinition();
    if (autocompleteEl) {
      autocompleteEl.remove();
      autocompleteEl = null;
    }
    document.removeEventListener("click", onDocClickCloseAutocomplete, true);
  }
  function onDocClickCloseAutocomplete(ev) {
    if (!autocompleteEl) return;
    const path = typeof ev.composedPath === "function" ? ev.composedPath() : [];
    if (path.includes(autocompleteEl)) return;
    closeAutocomplete();
  }
  function positionAutocomplete(rect) {
    if (!autocompleteEl) return;
    autocompleteEl.style.width = Math.max(220, rect.width) + "px";
    autocompleteEl.style.left = Math.max(8, Math.min(rect.left, window.innerWidth - autocompleteEl.offsetWidth - 8)) + "px";
    const top = rect.top - autocompleteEl.offsetHeight - 4;
    autocompleteEl.style.top = Math.max(8, top) + "px";
  }
  var acDefinitionHost = null;
  var acDefinitionTag = null;
  var acHideTimer = null;
  function hideInlineDefinition() {
    if (acHideTimer) clearTimeout(acHideTimer);
    if (acDefinitionHost) {
      acDefinitionHost.remove();
      acDefinitionHost = null;
      acDefinitionTag = null;
    }
  }
  function scheduleHideInlineDefinition(tag) {
    if (acHideTimer) clearTimeout(acHideTimer);
    acHideTimer = setTimeout(() => {
      if (acDefinitionTag === tag) hideInlineDefinition();
    }, 150);
  }
  function populateAcFlashBody(body, tag, onDone) {
    body.textContent = "Loading\u2026";
    ensureWikiDataLoadedRef().then((wiki) => {
      if (acDefinitionHost !== body.parentElement) return;
      const wikiKey = tag.replace(/ /g, "_");
      const def = wiki[wikiKey];
      const custom = !def ? getCustomTagNoteRef(tag) : "";
      body.innerHTML = "";
      if (def || custom) {
        const defEl = document.createElement("div");
        defEl.className = "ac-flash-def";
        defEl.textContent = def || custom;
        body.appendChild(defEl);
      } else {
        const msg = document.createElement("div");
        msg.className = "ac-flash-empty";
        msg.textContent = "No definition yet \u2014 want to write one?";
        body.appendChild(msg);
        const ta = document.createElement("textarea");
        ta.placeholder = "Describe this tag\u2026";
        ta.rows = 2;
        ta.addEventListener("click", (ev) => ev.stopPropagation());
        body.appendChild(ta);
        const saveBtn = document.createElement("button");
        saveBtn.className = "primary";
        saveBtn.textContent = "Save definition";
        saveBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          setCustomTagNoteRef(tag, ta.value);
          toast(`Saved your description for "${tag}".`);
          populateAcFlashBody(body, tag);
        });
        body.appendChild(saveBtn);
      }
      if (onDone) onDone();
    });
  }
  var chipHoverTimer = null;
  var chipHoverTag = null;
  function hideChipDefinition() {
    if (chipHoverTimer) clearTimeout(chipHoverTimer);
    chipHoverTimer = null;
    document.querySelectorAll(".ac-flash-card.ac-flash-floating").forEach((el) => el.remove());
    acDefinitionHost = null;
    chipHoverTag = null;
  }
  function scheduleHideChipDefinition(tag) {
    if (chipHoverTimer) clearTimeout(chipHoverTimer);
    chipHoverTimer = setTimeout(() => {
      if (chipHoverTag === tag) hideChipDefinition();
    }, 150);
  }
  function attachAcChipHover(container) {
    container.addEventListener("mouseover", (ev) => {
      const chip = ev.target.closest(".chip[data-tag]");
      if (!chip) {
        if (chipHoverTag) hideChipDefinition();
        return;
      }
      const tag = chip.dataset.tag;
      if (chipHoverTag === tag) return;
      hideChipDefinition();
      chipHoverTag = tag;
      chipHoverTimer = setTimeout(() => {
        const card = document.createElement("div");
        card.className = "ac-flash-card ac-flash-floating show";
        const body = document.createElement("div");
        body.className = "ac-flash-body";
        card.appendChild(body);
        document.body.appendChild(card);
        acDefinitionHost = card;
        populateAcFlashBody(body, tag, () => {
          const r = chip.getBoundingClientRect();
          const w = card.offsetWidth, h = card.offsetHeight;
          let left = r.left;
          if (left + w + 8 > window.innerWidth) left = window.innerWidth - w - 8;
          card.style.left = Math.max(8, left) + "px";
          let top = r.top - h - 8;
          if (top < 8) top = r.bottom + 8;
          card.style.top = top + "px";
        });
        const r0 = chip.getBoundingClientRect();
        card.style.position = "fixed";
        card.style.left = r0.left + "px";
        card.style.top = r0.bottom + 8 + "px";
        card.addEventListener("mouseenter", () => {
          if (chipHoverTimer) clearTimeout(chipHoverTimer);
        });
        card.addEventListener("mouseleave", hideChipDefinition);
      }, 350);
    });
    container.addEventListener("mouseout", (ev) => {
      const chip = ev.target.closest?.(".chip[data-tag]");
      if (!chip) return;
      const to = ev.relatedTarget;
      if (to && chip.contains(to)) return;
      scheduleHideChipDefinition(chip.dataset.tag);
    });
    container.addEventListener("click", hideChipDefinition);
  }
  function showInlineDefinition(afterRow, tag) {
    if (acHideTimer) clearTimeout(acHideTimer);
    if (acDefinitionTag === tag) return;
    hideInlineDefinition();
    const card = document.createElement("div");
    card.className = "ac-flash-card";
    card.addEventListener("mouseenter", () => {
      if (acHideTimer) clearTimeout(acHideTimer);
    });
    card.addEventListener("mouseleave", () => scheduleHideInlineDefinition(tag));
    afterRow.insertAdjacentElement("afterend", card);
    acDefinitionHost = card;
    acDefinitionTag = tag;
    const body = document.createElement("div");
    body.className = "ac-flash-body";
    card.appendChild(body);
    requestAnimationFrame(() => card.classList.add("show"));
    populateAcFlashBody(body, tag);
  }
  function attachTagAutocomplete(inputEl, getEntry, rerender) {
    attachAutocompleteCore(inputEl, (tag) => {
      const entry = getEntry();
      closeAutocomplete();
      if (!entry) return;
      addTagToEntryRef(entry, tag);
      inputEl.value = "";
      rerender();
      refreshRightPanelsRef();
    });
  }
  function attachFillAutocomplete(inputEl) {
    attachAutocompleteCore(inputEl, (tag) => {
      closeAutocomplete();
      inputEl.value = tag;
      inputEl.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }
  function attachListAutocomplete(inputEl, getOptions) {
    let debounceTimer = null;
    inputEl.addEventListener("input", () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      const raw = inputEl.value.trim().toLowerCase();
      if (!raw) {
        closeAutocomplete();
        return;
      }
      debounceTimer = setTimeout(() => {
        if (inputEl.value.trim().toLowerCase() !== raw) return;
        const options = getOptions() || [];
        const results = options.filter((o) => o.toLowerCase().includes(raw)).slice(0, 30);
        renderListAutocompleteResults(inputEl, results, (val) => {
          closeAutocomplete();
          inputEl.value = val;
          inputEl.dispatchEvent(new Event("input", { bubbles: true }));
          inputEl.dispatchEvent(new Event("change", { bubbles: true }));
        });
      }, 100);
    });
    inputEl.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") closeAutocomplete();
    });
  }
  function renderListAutocompleteResults(inputEl, results, onPick) {
    if (!autocompleteEl) {
      autocompleteEl = document.createElement("div");
      autocompleteEl.className = "ac-panel";
      document.body.appendChild(autocompleteEl);
      document.addEventListener("click", onDocClickCloseAutocomplete, true);
    }
    autocompleteEl.innerHTML = "";
    if (results.length === 0) {
      const empty = document.createElement("div");
      empty.className = "ac-empty";
      empty.textContent = "No matches.";
      autocompleteEl.appendChild(empty);
    } else {
      const list = document.createElement("div");
      list.className = "ac-list";
      for (const val of results) {
        const row = document.createElement("div");
        row.className = "ac-row";
        const name = document.createElement("span");
        name.className = "ac-row-name";
        name.textContent = val;
        row.appendChild(name);
        row.addEventListener("click", () => onPick(val));
        list.appendChild(row);
      }
      autocompleteEl.appendChild(list);
    }
    positionAutocomplete(inputEl.getBoundingClientRect());
  }
  function attachAutocompleteCore(inputEl, onPick) {
    let debounceTimer = null;
    inputEl.addEventListener("input", () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (!tagAutocompleteEnabled) {
        closeAutocomplete();
        return;
      }
      const raw = inputEl.value.trim();
      if (!raw) {
        closeAutocomplete();
        return;
      }
      debounceTimer = setTimeout(() => runAutocompleteSearch(inputEl, onPick, raw), 150);
    });
    inputEl.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") closeAutocomplete();
    });
  }
  function runAutocompleteSearch(inputEl, onPick, query) {
    if (inputEl.value.trim() !== query) return;
    ensureAllTagsLoadedRef().then((allTags) => {
      if (inputEl.value.trim() !== query) return;
      const qNorm = query.toLowerCase().replace(/_/g, " ");
      const starts = [];
      const contains = [];
      let scanned = 0;
      for (const [key, meta] of allTags) {
        const spaced = key.replace(/_/g, " ");
        if (spaced.startsWith(qNorm)) starts.push([spaced, meta]);
        else if (spaced.includes(qNorm)) contains.push([spaced, meta]);
        scanned++;
        if (starts.length >= 30 || scanned >= 25e4) break;
      }
      const results = starts.concat(contains).slice(0, 25);
      renderAutocompleteResults(inputEl, onPick, results);
    });
  }
  function renderAutocompleteResults(inputEl, onPick, results) {
    if (!autocompleteEl) {
      autocompleteEl = document.createElement("div");
      autocompleteEl.className = "ac-panel";
      document.body.appendChild(autocompleteEl);
      document.addEventListener("click", onDocClickCloseAutocomplete, true);
    }
    autocompleteEl.innerHTML = "";
    if (results.length === 0) {
      const empty = document.createElement("div");
      empty.className = "ac-empty";
      empty.textContent = "No matching tags in the vocabulary.";
      autocompleteEl.appendChild(empty);
    } else {
      const list = document.createElement("div");
      list.className = "ac-list";
      for (const [tag, meta] of results) {
        const row = document.createElement("div");
        row.className = "ac-row";
        const name = document.createElement("span");
        name.className = "ac-row-name";
        name.textContent = tag;
        row.appendChild(name);
        if (meta && typeof meta.count === "number") {
          const cnt = document.createElement("span");
          cnt.className = "ac-row-count";
          cnt.textContent = meta.count >= 1e3 ? Math.round(meta.count / 1e3) + "k" : String(meta.count);
          row.appendChild(cnt);
        }
        let hoverTimer = null;
        row.addEventListener("mouseenter", () => {
          if (hoverTimer) clearTimeout(hoverTimer);
          hoverTimer = setTimeout(() => showInlineDefinition(row, tag), 1e3);
        });
        row.addEventListener("mouseleave", () => {
          if (hoverTimer) clearTimeout(hoverTimer);
          scheduleHideInlineDefinition(tag);
        });
        let suppressNextClick = false;
        attachLongPress(row, () => {
          suppressNextClick = true;
          showInlineDefinition(row, tag);
        });
        row.addEventListener("click", () => {
          if (suppressNextClick) {
            suppressNextClick = false;
            return;
          }
          onPick(tag);
        });
        list.appendChild(row);
      }
      autocompleteEl.appendChild(list);
    }
    positionAutocomplete(inputEl.getBoundingClientRect());
  }

  // src/renderer/favorites.ts
  var FAV_DB_NAME = "dts-favorites-db";
  var FAV_STORE = "folders";
  var getDirHandle5 = () => null;
  var openFolderHandle = async () => {
  };
  var onFavoriteChanged = () => {
  };
  function openFavDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(FAV_DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(FAV_STORE)) {
          db.createObjectStore(FAV_STORE, { keyPath: "id", autoIncrement: true });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  function addFavoriteHandle(handle) {
    const storedHandle = handle.toJSON ? handle.toJSON() : handle;
    return openFavDB().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(FAV_STORE, "readwrite");
      tx.objectStore(FAV_STORE).add({ name: handle.name, handle: storedHandle, addedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    }));
  }
  async function findFavoriteMatch(handle) {
    let favs = [];
    try {
      favs = await listFavorites();
    } catch {
      return null;
    }
    for (const fav of favs) {
      let same = false;
      try {
        same = fav.handle.isSameEntry ? await fav.handle.isSameEntry(handle) : fav.handle.name === handle.name;
      } catch {
        same = fav.handle.name === handle.name;
      }
      if (same) return fav;
    }
    return null;
  }
  async function removeFavoriteByHandle(handle) {
    const match = await findFavoriteMatch(handle);
    if (match) {
      try {
        await removeFavorite(match.id);
      } catch {
      }
    }
  }
  async function isFavorited(handle) {
    return !!await findFavoriteMatch(handle);
  }
  function listFavorites() {
    return openFavDB().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(FAV_STORE, "readonly");
      const req = tx.objectStore(FAV_STORE).getAll();
      req.onsuccess = () => {
        const favs = req.result || [];
        if (window.__dtsReviveDirHandle) {
          for (const fav of favs) {
            if (fav.handle && fav.handle.__dtsMobileHandle) {
              fav.handle = window.__dtsReviveDirHandle(fav.handle);
            }
          }
        }
        resolve(favs);
      };
      req.onerror = () => reject(req.error);
    }));
  }
  function removeFavorite(id) {
    return openFavDB().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(FAV_STORE, "readwrite");
      tx.objectStore(FAV_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    }));
  }
  async function renderFavorites() {
    let favs = [];
    try {
      favs = await listFavorites();
    } catch {
      favs = [];
    }
    favoritesList.innerHTML = "";
    if (favs.length === 0) {
      favoritesList.innerHTML = '<div class="fav-empty">No favorites yet. Open a folder, then "Save current folder" below.</div>';
      return;
    }
    favs.sort((a, b) => b.addedAt - a.addedAt);
    for (const fav of favs) {
      const row = document.createElement("div");
      row.className = "fav-row";
      const name = document.createElement("span");
      name.className = "fav-name";
      name.textContent = fav.name || "(folder)";
      name.title = fav.name || "";
      const openBtn = document.createElement("button");
      openBtn.textContent = "Open";
      openBtn.className = "primary";
      openBtn.addEventListener("click", () => openFavorite(fav));
      const rmBtn = document.createElement("button");
      rmBtn.textContent = "\u2715";
      rmBtn.className = "danger-ghost";
      rmBtn.addEventListener("click", async () => {
        await removeFavorite(fav.id);
        onFavoriteChanged(fav.handle, false);
        renderFavorites();
      });
      row.appendChild(name);
      row.appendChild(openBtn);
      row.appendChild(rmBtn);
      favoritesList.appendChild(row);
    }
  }
  async function openFavorite(fav) {
    try {
      const perm = await fav.handle.requestPermission({ mode: "readwrite" });
      if (perm !== "granted") {
        toast("Permission was not granted for that folder.");
        return;
      }
      hidePanel(favoritesPanel);
      await openFolderHandle(fav.handle);
    } catch {
      toast("Could not reopen that folder \u2014 it may have been moved or deleted.", 3600);
    }
  }
  function initFavorites(deps) {
    getDirHandle5 = deps.getDirHandle;
    openFolderHandle = deps.openFolderHandle;
    onFavoriteChanged = deps.onFavoriteChanged || (() => {
    });
    btnFavorites.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (favoritesPanel.style.display === "flex") {
        hidePanel(favoritesPanel);
        return;
      }
      hidePanel(themeCustomPanel);
      hidePanel(logPanel);
      hidePanel(achievementsPanel);
      hidePanel(shopPanel);
      hidePanel(tagDetailsPanel);
      renderFavorites();
      showPanel(favoritesPanel);
    });
    favoritesCloseBtn.addEventListener("click", () => hidePanel(favoritesPanel));
    btnAddFavorite.addEventListener("click", async () => {
      const dirHandle = getDirHandle5();
      if (!dirHandle) return;
      const fsHandle = dirHandle;
      if (await isFavorited(fsHandle)) {
        toast(`"${dirHandle.name}" is already favorited.`);
        return;
      }
      try {
        await addFavoriteHandle(fsHandle);
        onFavoriteChanged(fsHandle, true);
        toast(`Saved "${dirHandle.name}" to favorites.`);
        trackStat("favorited");
        checkAchievements();
        renderFavorites();
      } catch {
        toast("Could not save that favorite.", 3e3);
      }
    });
  }

  // src/renderer/folder-picker.ts
  var pickerBusy = false;
  var SHELL_FOLDER_NAMES = /* @__PURE__ */ new Set([
    "Documents",
    "Desktop",
    "Downloads",
    "Pictures",
    "Music",
    "Videos",
    "3D Objects",
    "Saved Games",
    "Links",
    "Searches",
    "Contacts"
  ]);
  async function pickDatasetFolder() {
    if (pickerBusy) {
      toast("A folder picker is already open \u2014 finish or cancel it first.", 3600);
      return null;
    }
    pickerBusy = true;
    let picked = null;
    try {
      picked = await window.showDirectoryPicker({ mode: "readwrite" });
    } catch (e) {
      const msg = e?.message || "";
      const cancelled = e?.name === "AbortError" || /cancel/i.test(msg);
      if (cancelled) {
        toast("No folder was chosen.", 2400);
        return null;
      }
      if (/already active/i.test(msg)) {
        console.error("[pick] picker session stuck:", e);
        toast("The folder picker is stuck in a busy state and cannot open. Use Settings \u25B8 Updates & Sharing \u25B8 Restart app to clear it, then try again.", 7200);
        return null;
      }
      console.error("[pick] folder picker failed:", e);
      toast(`Could not open the folder picker: ${msg || "unknown error"}. Try again.`, 5e3);
      return null;
    } finally {
      pickerBusy = false;
    }
    if (!picked) return null;
    if (SHELL_FOLDER_NAMES.has(picked.name)) {
      await showConfirmModal(
        `"${picked.name}" is a special system location (like This PC \u25B8 Documents), not a real dataset folder.

Picking it as a dataset triggers a known bug: the file picker stops working until the app restarts \u2014 nothing gets loaded.

Pick your actual dataset folder (the one containing your images and .txt files) instead.`,
        { okLabel: "OK, pick another folder", cancelLabel: "", danger: true }
      );
      return null;
    }
    return picked;
  }

  // src/renderer/dataset-manager.ts
  var DB_NAME = "dts-dataset-manager-db";
  var STORE = "folders";
  var ORDER_KEY = "dts-dataset-folder-order";
  var SORT_KEY = "dts-dataset-folder-sort";
  var VIEW_KEY = "dts-dataset-manager-view";
  var SUPPRESS_KEY = "dts-dataset-tab-prompt-suppressed";
  var DM_IMAGE_EXT = [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"];
  function isImageFile(name) {
    const lower = name.toLowerCase();
    return DM_IMAGE_EXT.some((ext) => lower.endsWith(ext));
  }
  var getDirHandle6 = () => null;
  var openFolderHandle2 = async () => {
  };
  var switchTab = () => {
  };
  var folderOrder = [];
  var sortMode = "manual";
  var viewMode = "grid";
  function openDMDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function addDatasetFolder(handle) {
    let alreadyFavorited = false;
    try {
      alreadyFavorited = await isFavorited(handle);
    } catch (e) {
    }
    const storedHandle = handle.toJSON ? handle.toJSON() : handle;
    const result = await openDMDB().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const record = {
        name: handle.name,
        handle: storedHandle,
        addedAt: Date.now(),
        lastOpenedAt: Date.now(),
        pinned: alreadyFavorited,
        iconMode: "generic",
        iconImageBase: null,
        iconImageDataUrl: null
      };
      const req = tx.objectStore(STORE).add(record);
      req.onsuccess = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
    }));
    trackStat("dataset_tab_adds");
    checkAchievements();
    return result;
  }
  async function syncPinFromFavoriteChange(handle, isNowFavorited) {
    const record = await findTrackedRecord(handle);
    if (!record) return;
    await updateDatasetFolder(record.id, { pinned: isNowFavorited });
    if (datasetManagerTab.style.display !== "none") renderDatasetManagerTab();
  }
  function listDatasetFolders() {
    return openDMDB().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => {
        const records = req.result || [];
        if (window.__dtsReviveDirHandle) {
          for (const rec of records) {
            if (rec.handle && rec.handle.__dtsMobileHandle) {
              rec.handle = window.__dtsReviveDirHandle(rec.handle);
            }
          }
        }
        resolve(records);
      };
      req.onerror = () => reject(req.error);
    }));
  }
  function removeDatasetFolder(id) {
    return openDMDB().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    }));
  }
  function updateDatasetFolder(id, patch) {
    return openDMDB().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const rec = getReq.result;
        if (!rec) {
          resolve();
          return;
        }
        Object.assign(rec, patch);
        store.put(rec);
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    }));
  }
  async function findTrackedRecord(handle) {
    let records = [];
    try {
      records = await listDatasetFolders();
    } catch (e) {
      return null;
    }
    for (const rec of records) {
      let same = false;
      try {
        same = rec.handle.isSameEntry ? await rec.handle.isSameEntry(handle) : rec.handle.name === handle.name;
      } catch (e) {
        same = rec.handle.name === handle.name;
      }
      if (same) return rec;
    }
    return null;
  }
  function loadPrefs() {
    try {
      folderOrder = JSON.parse(localStorage.getItem(ORDER_KEY) || "[]") || [];
    } catch (e) {
      folderOrder = [];
    }
    try {
      sortMode = localStorage.getItem(SORT_KEY) || "manual";
    } catch (e) {
      sortMode = "manual";
    }
    try {
      viewMode = localStorage.getItem(VIEW_KEY) || "grid";
    } catch (e) {
      viewMode = "grid";
    }
  }
  function saveOrder() {
    try {
      localStorage.setItem(ORDER_KEY, JSON.stringify(folderOrder));
    } catch (e) {
    }
  }
  function saveSortMode() {
    try {
      localStorage.setItem(SORT_KEY, sortMode);
    } catch (e) {
    }
  }
  function saveViewMode() {
    try {
      localStorage.setItem(VIEW_KEY, viewMode);
    } catch (e) {
    }
  }
  function reorderFolders(draggedId, targetId, after) {
    folderOrder = folderOrder.filter((x) => x !== draggedId);
    let idx = folderOrder.indexOf(targetId);
    if (idx === -1) idx = folderOrder.length;
    if (after) idx += 1;
    folderOrder.splice(idx, 0, draggedId);
    saveOrder();
    renderDatasetManagerTab();
  }
  function sortRecords(records) {
    const pinned = records.filter((r) => r.pinned);
    const rest = records.filter((r) => !r.pinned);
    function applySort(list) {
      if (sortMode === "filename") return [...list].sort((a, b) => a.name.localeCompare(b.name));
      if (sortMode === "opened") return [...list].sort((a, b) => (b.lastOpenedAt || 0) - (a.lastOpenedAt || 0));
      if (sortMode === "added") return [...list].sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
      const byOrder = [...list].sort((a, b) => {
        const ia = folderOrder.indexOf(a.id), ib = folderOrder.indexOf(b.id);
        if (ia === -1 && ib === -1) return 0;
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
      return byOrder;
    }
    return [...applySort(pinned), ...applySort(rest)];
  }
  var FOLDER_BACK_PATH = "M6,10 L24,10 L28,16 L60,16 L60,42 L4,42 L4,14 Z";
  var FOLDER_FRONT_PATH = "M4,44 L4,30 L14,26 L60,26 L60,44 Z";
  function svgEl(pathD) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 64 48");
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", pathD);
    svg.appendChild(path);
    return svg;
  }
  function buildFolderIcon(record) {
    const wrap = document.createElement("div");
    wrap.className = "dm-folder-icon";
    const back = svgEl(FOLDER_BACK_PATH);
    back.classList.add("dm-folder-back");
    wrap.appendChild(back);
    if (record.iconMode === "image" && record.iconImageDataUrl) {
      const img = document.createElement("img");
      img.className = "dm-folder-img";
      img.src = record.iconImageDataUrl;
      img.alt = "";
      wrap.appendChild(img);
    }
    const front = svgEl(FOLDER_FRONT_PATH);
    front.classList.add("dm-folder-front");
    wrap.appendChild(front);
    return wrap;
  }
  var dmCtxMenuEl = null;
  function closeDmCtxMenu() {
    if (dmCtxMenuEl) {
      dmCtxMenuEl.remove();
      dmCtxMenuEl = null;
    }
    document.removeEventListener("click", onDmCtxOutsideClick);
    document.removeEventListener("keydown", onDmCtxEscape);
  }
  function onDmCtxOutsideClick(ev) {
    if (!dmCtxMenuEl) return;
    const path = ev.composedPath ? ev.composedPath() : [];
    if (path.includes(dmCtxMenuEl)) return;
    closeDmCtxMenu();
  }
  function onDmCtxEscape(ev) {
    if (ev.key === "Escape") closeDmCtxMenu();
  }
  function addDmCtxItem(menu, label, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ctx-item";
    btn.textContent = label;
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      onClick();
    });
    menu.appendChild(btn);
  }
  function openDmContextMenu(record, x, y) {
    closeDmCtxMenu();
    const menu = document.createElement("div");
    menu.className = "ctx-menu";
    const header = document.createElement("div");
    header.className = "ctx-header";
    header.textContent = record.name;
    menu.appendChild(header);
    addDmCtxItem(menu, "Remove from Dataset tab", async () => {
      closeDmCtxMenu();
      const ok = await showConfirmModal(
        `Remove "${record.name}" from the Dataset tab?
This only stops tracking it here \u2014 the folder and its files are untouched.`,
        { okLabel: "Remove", danger: true }
      );
      if (!ok) return;
      await removeDatasetFolder(record.id);
      renderDatasetManagerTab();
    });
    addDmCtxItem(menu, record.pinned ? "Unpin favorite" : "Pin as favorite", async () => {
      closeDmCtxMenu();
      const nowPinned = !record.pinned;
      await updateDatasetFolder(record.id, { pinned: nowPinned });
      try {
        if (nowPinned) await addFavoriteHandle(record.handle);
        else await removeFavoriteByHandle(record.handle);
      } catch (e) {
      }
      if (nowPinned) {
        trackStat("favorited");
        checkAchievements();
      }
      renderDatasetManagerTab();
    });
    addDmCtxItem(menu, "View achievements", async () => {
      closeDmCtxMenu();
      await openReadOnlyAchievements(record);
    });
    addDmCtxItem(menu, "Select image for icon\u2026", async () => {
      closeDmCtxMenu();
      await openIconPicker(record);
    });
    document.body.appendChild(menu);
    dmCtxMenuEl = menu;
    positionMenu(menu, x, y);
    setTimeout(() => {
      document.addEventListener("click", onDmCtxOutsideClick);
      document.addEventListener("keydown", onDmCtxEscape);
    }, 0);
  }
  async function openReadOnlyAchievements(record) {
    try {
      const perm = await record.handle.requestPermission({ mode: "read" });
      if (perm !== "granted") {
        toast("Permission was not granted for that folder.");
        return;
      }
      let unlocked = [];
      try {
        const fh = await record.handle.getFileHandle("_dts_achievements.json", { create: false });
        const file = await fh.getFile();
        const parsed = JSON.parse(await file.text());
        unlocked = Array.isArray(parsed.unlocked) ? parsed.unlocked : [];
      } catch (e) {
        unlocked = [];
      }
      hidePanel(favoritesPanel);
      hidePanel(themeCustomPanel);
      hidePanel(logPanel);
      hidePanel(tagDetailsPanel);
      hidePanel(shopPanel);
      renderAchievementsPanel(unlocked);
      showPanel(achievementsPanel);
      trackStat("other_folder_achievements_viewed");
      checkAchievements();
    } catch (err) {
      toast("Could not read that folder's achievements \u2014 it may have been moved or deleted.", 3600);
    }
  }
  async function openIconPicker(record) {
    let perm;
    try {
      perm = await record.handle.requestPermission({ mode: "read" });
    } catch (e) {
      perm = "denied";
    }
    if (perm !== "granted") {
      toast("Permission was not granted for that folder.");
      return;
    }
    const backdrop = document.createElement("div");
    backdrop.className = "confirm-backdrop modal-visible";
    const box = document.createElement("div");
    box.className = "confirm-box dm-icon-picker";
    const title = document.createElement("div");
    title.className = "confirm-message";
    title.textContent = `Choose an image from "${record.name}" for its icon:`;
    box.appendChild(title);
    const grid = document.createElement("div");
    grid.className = "dm-icon-picker-grid";
    box.appendChild(grid);
    const btnRow = document.createElement("div");
    btnRow.className = "confirm-btn-row";
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    btnRow.appendChild(cancelBtn);
    box.appendChild(btnRow);
    backdrop.appendChild(box);
    document.body.appendChild(backdrop);
    function close() {
      backdrop.remove();
    }
    cancelBtn.addEventListener("click", close);
    backdrop.addEventListener("click", (ev) => {
      if (ev.target === backdrop) close();
    });
    const noImageCell = document.createElement("button");
    noImageCell.type = "button";
    noImageCell.className = "dm-icon-picker-cell dm-icon-picker-noimage";
    noImageCell.textContent = "(No image)";
    noImageCell.addEventListener("click", async () => {
      await updateDatasetFolder(record.id, { iconMode: "generic" });
      close();
      renderDatasetManagerTab();
    });
    grid.appendChild(noImageCell);
    const scanning = document.createElement("div");
    scanning.className = "dm-icon-picker-scanning";
    scanning.textContent = "Scanning\u2026";
    grid.appendChild(scanning);
    const thumbs = [];
    try {
      let count = 0;
      for await (const [name, h] of record.handle.entries()) {
        if (h.kind !== "file" || !isImageFile(name)) continue;
        thumbs.push({ base: name, handle: h });
        count++;
        if (count >= 60) break;
      }
    } catch (e) {
    }
    scanning.remove();
    for (const t of thumbs) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "dm-icon-picker-cell";
      grid.appendChild(cell);
      t.handle.getFile().then((file) => {
        const url = URL.createObjectURL(file);
        const img = document.createElement("img");
        img.src = url;
        cell.appendChild(img);
        cell.addEventListener("click", async () => {
          try {
            const dataUrl = await downscaleToDataUrl(img);
            await updateDatasetFolder(record.id, { iconMode: "image", iconImageBase: t.base, iconImageDataUrl: dataUrl });
            close();
            renderDatasetManagerTab();
            trackStat("dataset_icon_images_set");
            checkAchievements();
          } catch (e) {
            toast("Could not use that image.", 2600);
          }
        });
      }).catch(() => {
      });
    }
  }
  function downscaleToDataUrl(imgEl) {
    return new Promise((resolve, reject) => {
      function draw() {
        try {
          const canvas = document.createElement("canvas");
          const size = 120;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          const iw = imgEl.naturalWidth || size, ih = imgEl.naturalHeight || size;
          const scale = Math.max(size / iw, size / ih);
          const dw = iw * scale, dh = ih * scale;
          ctx.drawImage(imgEl, (size - dw) / 2, (size - dh) / 2, dw, dh);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        } catch (err) {
          reject(err);
        }
      }
      if (imgEl.complete && imgEl.naturalWidth) draw();
      else imgEl.addEventListener("load", draw, { once: true });
    });
  }
  function wireTileDrag(tile, record) {
    if (sortMode !== "manual") return;
    tile.draggable = true;
    tile.addEventListener("dragstart", (ev) => {
      ev.dataTransfer.setData("text/plain", String(record.id));
      ev.dataTransfer.effectAllowed = "move";
      tile.classList.add("dm-dragging");
    });
    tile.addEventListener("dragend", () => tile.classList.remove("dm-dragging"));
    tile.addEventListener("dragover", (ev) => {
      ev.preventDefault();
      tile.classList.add("dm-drop-target");
    });
    tile.addEventListener("dragleave", () => tile.classList.remove("dm-drop-target"));
    tile.addEventListener("drop", (ev) => {
      ev.preventDefault();
      tile.classList.remove("dm-drop-target");
      const draggedId = Number(ev.dataTransfer.getData("text/plain"));
      if (!draggedId || draggedId === record.id) return;
      const rect = tile.getBoundingClientRect();
      const dropAfter = ev.clientX - rect.left > rect.width / 2;
      reorderFolders(draggedId, record.id, dropAfter);
    });
  }
  async function openTrackedFolder(record) {
    try {
      const perm = await record.handle.requestPermission({ mode: "readwrite" });
      if (perm !== "granted") {
        toast("Permission was not granted for that folder.");
        return;
      }
      await updateDatasetFolder(record.id, { lastOpenedAt: Date.now() });
      await openFolderHandle2(record.handle);
      switchTab("gallery");
    } catch (err) {
      toast("Could not reopen that folder \u2014 it may have been moved or deleted.", 3600);
    }
  }
  async function maybePromptAddDataset(handle) {
    const existing = await findTrackedRecord(handle);
    if (existing) return;
    let suppressed = false;
    try {
      suppressed = localStorage.getItem(SUPPRESS_KEY) === "1";
    } catch (e) {
    }
    if (suppressed) return;
    const add = await showConfirmModal(
      `Add "${handle.name}" to your Dataset tab?
Choosing No means you won't be asked again \u2014 you can still add folders anytime from the Dataset tab's + tile.`,
      { okLabel: "Yes", cancelLabel: "No" }
    );
    if (add) {
      await addDatasetFolder(handle);
      if (datasetManagerTab.style.display !== "none") renderDatasetManagerTab();
    } else {
      try {
        localStorage.setItem(SUPPRESS_KEY, "1");
      } catch (e) {
      }
    }
  }
  async function addFolderViaAddTile() {
    if (!window.showDirectoryPicker) {
      toast("Your browser does not support folder access. Use Chrome or Edge, opened as a normal tab (not an embedded preview).", 5e3);
      return;
    }
    const picked = await pickDatasetFolder();
    if (!picked) return;
    try {
      const existing = await findTrackedRecord(picked);
      if (!existing) await addDatasetFolder(picked);
      renderDatasetManagerTab();
      toast(`Added "${picked.name}" to the Dataset tab.`);
    } catch (e) {
      console.error("[datasets] add folder failed:", e);
      toast(`Could not add that folder: ${e?.message || "unknown error"}`, 4200);
    }
  }
  function buildAddTile() {
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = "dm-tile dm-add-tile";
    tile.title = "Add a dataset folder";
    tile.textContent = "+";
    tile.addEventListener("click", addFolderViaAddTile);
    return tile;
  }
  function buildFolderTile(record) {
    const tile = document.createElement("div");
    tile.className = "dm-tile" + (record.pinned ? " dm-pinned" : "");
    tile.tabIndex = 0;
    if (record.pinned) {
      const pin = document.createElement("span");
      pin.className = "dm-pin-badge";
      pin.textContent = "\u2605";
      tile.appendChild(pin);
    }
    tile.appendChild(buildFolderIcon(record));
    const label = document.createElement("div");
    label.className = "dm-tile-label";
    label.textContent = record.name;
    label.title = record.name;
    tile.appendChild(label);
    const menuBtn = document.createElement("button");
    menuBtn.type = "button";
    menuBtn.className = "dm-menu-btn";
    menuBtn.title = "Folder options";
    menuBtn.textContent = "\u22EF";
    menuBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const rect = menuBtn.getBoundingClientRect();
      openDmContextMenu(record, rect.left, rect.bottom + 4);
    });
    tile.appendChild(menuBtn);
    tile.addEventListener("contextmenu", (ev) => {
      ev.preventDefault();
      openDmContextMenu(record, ev.clientX, ev.clientY);
    });
    tile.addEventListener("click", (ev) => {
      if (ev.target === menuBtn) return;
      openTrackedFolder(record);
    });
    wireTileDrag(tile, record);
    return tile;
  }
  async function renderDatasetManagerTab() {
    dmGrid.classList.toggle("dm-list-view", viewMode === "list");
    dmGridBtn.classList.toggle("active", viewMode === "grid");
    dmListBtn.classList.toggle("active", viewMode === "list");
    let records = [];
    try {
      records = await listDatasetFolders();
    } catch (e) {
      records = [];
    }
    const sorted = sortRecords(records);
    dmGrid.innerHTML = "";
    if (viewMode === "list") dmGrid.appendChild(buildAddTile());
    for (const record of sorted) dmGrid.appendChild(buildFolderTile(record));
    if (viewMode !== "list") dmGrid.appendChild(buildAddTile());
  }
  function initDatasetManager(deps) {
    getDirHandle6 = deps.getDirHandle;
    openFolderHandle2 = deps.openFolderHandle;
    switchTab = deps.switchTab;
    loadPrefs();
    dmGridBtn.addEventListener("click", () => {
      viewMode = "grid";
      saveViewMode();
      renderDatasetManagerTab();
    });
    dmListBtn.addEventListener("click", () => {
      viewMode = "list";
      saveViewMode();
      renderDatasetManagerTab();
    });
    buildPersistentDropdown(dmSortDropdown, [
      { value: "manual", label: "Manual order" },
      { value: "filename", label: "Filename" },
      { value: "opened", label: "Time opened" },
      { value: "added", label: "Time added" }
    ], () => sortMode, (val) => {
      sortMode = val;
      saveSortMode();
      renderDatasetManagerTab();
    });
  }

  // src/renderer/master-tag-control.ts
  var masterSelectedImages = /* @__PURE__ */ new Set();
  var getEntries3 = () => [];
  var getEntryByBase3 = () => void 0;
  var filteredEntriesRef = () => [];
  var renderCurrentViewRef2 = () => {
  };
  var refreshAllUIRef4 = () => {
  };
  var getEntryMeta = () => ({});
  var saveEntryMetaRef = () => {
  };
  var deleteEntriesPermanentlyRef = async () => 0;
  function updateMasterSelectionText() {
    if (masterSelectedImages.size === 0) {
      masterSelectionSummary.textContent = "No images selected yet.";
      return;
    }
    masterSelectionSummary.textContent = `${masterSelectedImages.size} image(s) selected.`;
  }
  function renderMasterMiniGrid() {
    masterMiniGrid.innerHTML = "";
    const list = filteredEntriesRef();
    list.forEach((e) => {
      const cell = document.createElement("div");
      cell.className = "master-mini-cell" + (masterSelectedImages.has(e.base) ? " selected" : "");
      cell.dataset.base = e.base;
      const img = document.createElement("img");
      img.src = e.objectUrl;
      img.loading = "lazy";
      cell.appendChild(img);
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "master-mini-cb";
      cb.checked = masterSelectedImages.has(e.base);
      cb.addEventListener("click", (ev) => ev.stopPropagation());
      cb.addEventListener("change", () => {
        if (cb.checked) masterSelectedImages.add(e.base);
        else masterSelectedImages.delete(e.base);
        cell.classList.toggle("selected", cb.checked);
        updateMasterSelectionText();
        renderCurrentViewRef2();
      });
      cell.appendChild(cb);
      cell.addEventListener("click", () => {
        cb.checked = !cb.checked;
        cb.dispatchEvent(new Event("change"));
      });
      masterMiniGrid.appendChild(cell);
    });
  }
  function syncMasterMiniGrid() {
    masterMiniGrid.querySelectorAll(".master-mini-cell").forEach((cell) => {
      const base = cell.dataset.base;
      const selected = masterSelectedImages.has(base);
      cell.classList.toggle("selected", selected);
      const cb = cell.querySelector(".master-mini-cb");
      if (cb) cb.checked = selected;
    });
  }
  function renderMasterSelectionSummary() {
    updateMasterSelectionText();
    syncMasterMiniGrid();
  }
  var onStartSequentialRef = () => {
  };
  function initMasterTagControl(deps) {
    getEntries3 = deps.getEntries;
    getEntryByBase3 = deps.getEntryByBase;
    filteredEntriesRef = deps.filteredEntries;
    renderCurrentViewRef2 = deps.renderCurrentView;
    refreshAllUIRef4 = deps.refreshAllUI;
    getEntryMeta = deps.getEntryMeta;
    saveEntryMetaRef = deps.saveEntryMeta;
    deleteEntriesPermanentlyRef = deps.deleteEntriesPermanently;
    onStartSequentialRef = deps.onStartSequential;
    if (!document.documentElement.classList.contains("touch-device")) {
      const seqRow = document.createElement("div");
      seqRow.className = "mtc-btn-row";
      const seqFirstBtn = document.createElement("button");
      seqFirstBtn.textContent = "\u25B6 Sequential from first";
      seqFirstBtn.title = "Review every gallery image in sort order, confirming detail tags one by one";
      seqFirstBtn.addEventListener("click", () => onStartSequentialRef("first"));
      const seqSelBtn = document.createElement("button");
      seqSelBtn.textContent = "\u25B6 Sequential from selected";
      seqSelBtn.title = "Review from the first selected image in sort order";
      seqSelBtn.addEventListener("click", () => onStartSequentialRef("selected"));
      seqRow.appendChild(seqFirstBtn);
      seqRow.appendChild(seqSelBtn);
      masterSelectionSummary.after(seqRow);
    }
    for (const inp of [
      masterApplyTagInput,
      masterRemoveTagInput,
      condSourceTag,
      condAddTag,
      condWithoutSourceTag,
      condWithoutAddTag,
      massApplyInput,
      massRemoveInput,
      masterRenameFrom
    ]) attachFillAutocomplete(inp);
    btnMasterSelectAll.addEventListener("click", () => {
      for (const e of filteredEntriesRef()) masterSelectedImages.add(e.base);
      renderMasterSelectionSummary();
      renderCurrentViewRef2();
    });
    btnMasterClearSelection.addEventListener("click", () => {
      masterSelectedImages.clear();
      renderMasterSelectionSummary();
      renderCurrentViewRef2();
    });
    function setLockedForSelection(locked) {
      if (masterSelectedImages.size === 0) {
        toast("Select at least one image first.");
        return;
      }
      const meta = getEntryMeta();
      let changed = 0;
      for (const base of masterSelectedImages) {
        const e = getEntryByBase3(base);
        if (!e) continue;
        if (!e.meta) e.meta = {};
        if (!!e.meta?.locked === locked) continue;
        e.meta.locked = locked;
        meta[e.base] = e.meta;
        changed++;
      }
      if (changed === 0) {
        toast(`Nothing to ${locked ? "lock" : "unlock"} \u2014 already ${locked ? "locked" : "unlocked"}.`);
        return;
      }
      saveEntryMetaRef();
      toast(`${locked ? "Locked" : "Unlocked"} ${changed} image(s).`);
      renderCurrentViewRef2();
    }
    btnMasterLockSelected.addEventListener("click", () => setLockedForSelection(true));
    btnMasterUnlockSelected.addEventListener("click", () => setLockedForSelection(false));
    btnMasterDeleteSelected.addEventListener("click", async () => {
      if (masterSelectedImages.size === 0) {
        toast("Select at least one image first.");
        return;
      }
      const total = masterSelectedImages.size;
      const ok = await showConfirmModal(
        `Permanently delete ${total} selected image(s) and their tags? This cannot be undone \u2014 the files are removed from disk, not moved to Disabled/. Locked images will be skipped.`,
        { okLabel: `Delete ${total} permanently`, danger: true }
      );
      if (!ok) return;
      const entriesList = Array.from(masterSelectedImages).map((base) => getEntryByBase3(base)).filter((e) => !!e);
      const deleted = await deleteEntriesPermanentlyRef(entriesList);
      if (deleted === 0) {
        toast("Nothing deleted \u2014 every selected image is locked.");
        return;
      }
      const skipped = total - deleted;
      toast(skipped > 0 ? `Permanently deleted ${deleted} image(s) \u2014 ${skipped} skipped (locked).` : `Permanently deleted ${deleted} image(s).`, 3600);
      renderMasterSelectionSummary();
      renderCurrentViewRef2();
    });
    function setEntryFlagsForSelection(flags, actionLabel) {
      if (masterSelectedImages.size === 0) {
        toast("Select at least one image first.");
        return;
      }
      const meta = getEntryMeta();
      let changed = 0;
      for (const base of masterSelectedImages) {
        const e = getEntryByBase3(base);
        if (!e) continue;
        if (!e.meta) e.meta = {};
        const keys = Object.keys(flags);
        if (keys.every((k) => !!e.meta[k] === flags[k])) continue;
        for (const k of keys) e.meta[k] = flags[k];
        meta[e.base] = e.meta;
        changed++;
      }
      if (changed === 0) {
        toast(`Nothing to change \u2014 already ${actionLabel}.`);
        return;
      }
      saveEntryMetaRef();
      toast(`${actionLabel[0].toUpperCase()}${actionLabel.slice(1)} ${changed} image(s).`);
      renderCurrentViewRef2();
    }
    btnMasterMergeImmunizeSelected.addEventListener("click", () => setEntryFlagsForSelection({ mergeImmune: true }, "merge immunized"));
    btnMasterUnMergeImmunizeSelected.addEventListener("click", () => setEntryFlagsForSelection({ mergeImmune: false }, "un-merge-immunized"));
    btnMasterAntivoidSelected.addEventListener("click", () => setEntryFlagsForSelection({ antivoid: true }, "antivoided"));
    btnMasterUnAntivoidSelected.addEventListener("click", () => setEntryFlagsForSelection({ antivoid: false }, "un-antivoided"));
    btnMasterAntimmunizeSelected.addEventListener("click", () => setEntryFlagsForSelection({ mergeImmune: true, antivoid: true }, "antimmunized"));
    btnMasterUnAntimmunizeSelected.addEventListener("click", () => setEntryFlagsForSelection({ mergeImmune: false, antivoid: false }, "un-antimmunized"));
    btnMasterApplyToSelected.addEventListener("click", () => {
      const tag = masterApplyTagInput.value.trim().replace(/_/g, " ").replace(/\s+/g, " ");
      if (!tag) {
        toast("Enter a tag to apply.");
        return;
      }
      if (masterSelectedImages.size === 0) {
        toast("Select at least one image first.");
        return;
      }
      const affected = [];
      for (const base of masterSelectedImages) {
        const e = getEntryByBase3(base);
        if (!e || e.meta?.locked || e.tags.includes(tag)) continue;
        const prevTags = e.tags.slice();
        e.tags.push(tag);
        markDirty(e);
        affected.push({ base: e.base, prevTags, newTags: e.tags.slice() });
      }
      if (affected.length === 0) {
        toast("Nothing to apply \u2014 selected images already have that tag.");
        return;
      }
      const summary = `Applied "${tag}" to ${affected.length} selected image(s).`;
      toast(summary);
      recordChange("add-tag", summary, affected);
      folderStats.master_ops = (folderStats.master_ops || 0) + 1;
      saveFolderStats();
      masterApplyTagInput.value = "";
      refreshAllUIRef4();
      checkAchievements();
    });
    btnMasterRemoveFromSelected.addEventListener("click", () => {
      const tag = masterRemoveTagInput.value.trim().replace(/_/g, " ").replace(/\s+/g, " ");
      if (!tag) {
        toast("Enter a tag to remove.");
        return;
      }
      if (masterSelectedImages.size === 0) {
        toast("Select at least one image first.");
        return;
      }
      const affected = [];
      for (const base of masterSelectedImages) {
        const e = getEntryByBase3(base);
        if (!e || e.meta?.locked || !e.tags.includes(tag)) continue;
        const prevTags = e.tags.slice();
        e.tags = e.tags.filter((t) => t !== tag);
        markDirty(e);
        affected.push({ base: e.base, prevTags, newTags: e.tags.slice() });
      }
      if (affected.length === 0) {
        toast("None of the selected images have that tag.");
        return;
      }
      const summary = `Removed "${tag}" from ${affected.length} selected image(s).`;
      toast(summary);
      recordChange("remove-tag", summary, affected);
      folderStats.master_ops = (folderStats.master_ops || 0) + 1;
      saveFolderStats();
      masterRemoveTagInput.value = "";
      refreshAllUIRef4();
      checkAchievements();
    });
    btnCondApply.addEventListener("click", () => {
      const sourceTag = condSourceTag.value.trim().replace(/_/g, " ").replace(/\s+/g, " ");
      const addTag = condAddTag.value.trim().replace(/_/g, " ").replace(/\s+/g, " ");
      if (!sourceTag || !addTag) {
        toast("Fill in both tags.");
        return;
      }
      const affected = [];
      for (const e of getEntries3()) {
        if (e.disabled || e.meta?.locked) continue;
        if (!e.tags.includes(sourceTag) || e.tags.includes(addTag)) continue;
        const prevTags = e.tags.slice();
        e.tags.push(addTag);
        markDirty(e);
        affected.push({ base: e.base, prevTags, newTags: e.tags.slice() });
      }
      if (affected.length === 0) {
        toast(`No images with "${sourceTag}" are missing "${addTag}".`);
        return;
      }
      const summary = `Added "${addTag}" to every image with "${sourceTag}" (${affected.length} image(s)).`;
      toast(summary);
      recordChange("add-tag", summary, affected);
      folderStats.master_ops = (folderStats.master_ops || 0) + 1;
      saveFolderStats();
      condSourceTag.value = "";
      condAddTag.value = "";
      refreshAllUIRef4();
      checkAchievements();
    });
    btnCondApplyWithout.addEventListener("click", () => {
      const sourceTag = condWithoutSourceTag.value.trim().replace(/_/g, " ").replace(/\s+/g, " ");
      const addTag = condWithoutAddTag.value.trim().replace(/_/g, " ").replace(/\s+/g, " ");
      if (!sourceTag || !addTag) {
        toast("Fill in both tags.");
        return;
      }
      const affected = [];
      for (const e of getEntries3()) {
        if (e.disabled || e.meta?.locked) continue;
        if (e.tags.includes(sourceTag) || e.tags.includes(addTag)) continue;
        const prevTags = e.tags.slice();
        e.tags.push(addTag);
        markDirty(e);
        affected.push({ base: e.base, prevTags, newTags: e.tags.slice() });
      }
      if (affected.length === 0) {
        toast(`No images without "${sourceTag}" are missing "${addTag}".`);
        return;
      }
      const summary = `Added "${addTag}" to every image WITHOUT "${sourceTag}" (${affected.length} image(s)).`;
      toast(summary);
      recordChange("add-tag", summary, affected);
      folderStats.master_ops = (folderStats.master_ops || 0) + 1;
      saveFolderStats();
      condWithoutSourceTag.value = "";
      condWithoutAddTag.value = "";
      refreshAllUIRef4();
      checkAchievements();
    });
    btnMassApply.addEventListener("click", async () => {
      const tag = massApplyInput.value.trim().replace(/_/g, " ").replace(/\s+/g, " ");
      if (!tag) {
        toast("Enter a tag to apply.");
        return;
      }
      const ok = await showConfirmModal(`Add "${tag}" to EVERY active image in this folder?`, { okLabel: "Apply to all" });
      if (!ok) return;
      const affected = [];
      for (const e of getEntries3()) {
        if (e.disabled || e.meta?.locked || e.tags.includes(tag)) continue;
        const prevTags = e.tags.slice();
        e.tags.push(tag);
        markDirty(e);
        affected.push({ base: e.base, prevTags, newTags: e.tags.slice() });
      }
      if (affected.length === 0) {
        toast("Every image already has that tag.");
        return;
      }
      const summary = `Added "${tag}" to all ${affected.length} image(s).`;
      toast(summary);
      recordChange("add-tag", summary, affected);
      folderStats.master_ops = (folderStats.master_ops || 0) + 1;
      saveFolderStats();
      massApplyInput.value = "";
      refreshAllUIRef4();
      checkAchievements();
    });
    btnMassRemove.addEventListener("click", async () => {
      const tag = massRemoveInput.value.trim().replace(/_/g, " ").replace(/\s+/g, " ");
      if (!tag) {
        toast("Enter a tag to remove.");
        return;
      }
      const ok = await showConfirmModal(`Remove "${tag}" from EVERY active image in this folder?`, { okLabel: "Remove from all", danger: true });
      if (!ok) return;
      const affected = [];
      for (const e of getEntries3()) {
        if (e.disabled || e.meta?.locked || !e.tags.includes(tag)) continue;
        const prevTags = e.tags.slice();
        e.tags = e.tags.filter((t) => t !== tag);
        markDirty(e);
        affected.push({ base: e.base, prevTags, newTags: e.tags.slice() });
      }
      if (affected.length === 0) {
        toast("No images have that tag.");
        return;
      }
      const summary = `Removed "${tag}" from all ${affected.length} image(s).`;
      toast(summary);
      recordChange("remove-tag", summary, affected);
      folderStats.master_ops = (folderStats.master_ops || 0) + 1;
      saveFolderStats();
      massRemoveInput.value = "";
      refreshAllUIRef4();
      checkAchievements();
    });
    btnMasterRename.addEventListener("click", () => {
      const from = masterRenameFrom.value.trim();
      const to = masterRenameTo.value.trim();
      if (!from || !to) {
        toast("Enter both a tag to rename and its replacement.");
        return;
      }
      if (from === to) {
        toast("New name is the same as the old one.");
        return;
      }
      const affected = [];
      for (const e of getEntries3()) {
        if (e.disabled || e.meta?.locked || !e.tags.includes(from)) continue;
        const prevTags = e.tags.slice();
        let newTags = e.tags.map((t) => t === from ? to : t);
        newTags = Array.from(new Set(newTags));
        e.tags = newTags;
        markDirty(e);
        affected.push({ base: e.base, prevTags, newTags: newTags.slice() });
      }
      if (affected.length === 0) {
        toast(`No active images currently have the tag "${from}".`);
        return;
      }
      const summary = `Renamed "${from}" \u2192 "${to}" across ${affected.length} image(s).`;
      toast(summary);
      recordChange("rename", summary, affected);
      folderStats.master_ops = (folderStats.master_ops || 0) + 1;
      saveFolderStats();
      trackStat("renames");
      masterRenameFrom.value = "";
      masterRenameTo.value = "";
      refreshAllUIRef4();
      checkAchievements();
    });
    btnMasterFR.addEventListener("click", () => {
      const find = masterFRFind.value;
      const repl = masterFRReplace.value;
      if (!find) {
        toast("Enter a substring to find.");
        return;
      }
      const affected = [];
      for (const e of getEntries3()) {
        if (e.disabled || e.meta?.locked || !e.tags.some((t) => t.includes(find))) continue;
        const prevTags = e.tags.slice();
        let newTags = e.tags.map((t) => t.includes(find) ? t.split(find).join(repl) : t);
        newTags = newTags.map((t) => t.trim()).filter(Boolean);
        newTags = Array.from(new Set(newTags));
        e.tags = newTags;
        markDirty(e);
        affected.push({ base: e.base, prevTags, newTags: newTags.slice() });
      }
      if (affected.length === 0) {
        toast(`No tags contain "${find}".`);
        return;
      }
      const summary = `Replaced "${find}" \u2192 "${repl}" inside tags across ${affected.length} image(s).`;
      toast(summary);
      recordChange("find-replace", summary, affected);
      folderStats.master_ops = (folderStats.master_ops || 0) + 1;
      saveFolderStats();
      trackStat("find_replaces");
      masterFRFind.value = "";
      masterFRReplace.value = "";
      refreshAllUIRef4();
      checkAchievements();
    });
  }

  // src/renderer/comfy-client.ts
  function isLikelyCorsFailure(err) {
    return err instanceof TypeError;
  }
  function corsHintSuffix() {
    return " \u2014 either ComfyUI isn't reachable at that address, or it needs to be started with --enable-cors-header for a phone/browser to reach it directly.";
  }
  function normalizeHost(host) {
    const trimmed = String(host || "").trim();
    return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  }
  async function comfyGetModels(host) {
    host = normalizeHost(host);
    let res;
    try {
      res = await fetch(new URL("/object_info/WD14Tagger%7Cpysssss", host), { method: "GET" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: `Could not reach ComfyUI at ${host}${isLikelyCorsFailure(err) ? corsHintSuffix() : " (" + msg + ")"}` };
    }
    if (!res.ok) return { ok: false, error: `ComfyUI returned HTTP ${res.status} \u2014 is the WD14 Tagger (pysssss) custom node installed?` };
    let parsed;
    try {
      parsed = await res.json();
    } catch {
      return { ok: false, error: "ComfyUI returned an unexpected response." };
    }
    const nodeInfo = parsed["WD14Tagger|pysssss"];
    const models = nodeInfo?.input?.required?.model?.[0];
    if (!Array.isArray(models)) return { ok: false, error: "Could not find the WD14 Tagger node on that ComfyUI instance." };
    return { ok: true, models };
  }
  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
  async function comfyTagImage({ host, filename, imageBytes, settings: settings2 }) {
    host = normalizeHost(host);
    try {
      const form = new FormData();
      form.append("type", "input");
      form.append("overwrite", "true");
      form.append("image", new Blob([imageBytes]), filename);
      let uploadRes;
      try {
        uploadRes = await fetch(new URL("/upload/image", host), { method: "POST", body: form });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { ok: false, error: `Could not reach ComfyUI at ${host}${isLikelyCorsFailure(err) ? corsHintSuffix() : " (" + msg + ")"}` };
      }
      if (!uploadRes.ok) return { ok: false, error: `Image upload to ComfyUI failed (HTTP ${uploadRes.status}).` };
      const uploaded = await uploadRes.json();
      const imageRef = uploaded.subfolder ? `${uploaded.subfolder}/${uploaded.name}` : uploaded.name;
      const clientId = `dts-mobile-${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
      const prompt = {
        "1": { class_type: "LoadImage", inputs: { image: imageRef, upload: "image" } },
        "2": {
          class_type: "WD14Tagger|pysssss",
          inputs: {
            image: ["1", 0],
            model: settings2.model,
            threshold: settings2.threshold,
            character_threshold: settings2.characterThreshold,
            replace_underscore: false,
            trailing_comma: !!settings2.trailingComma,
            exclude_tags: settings2.excludeTags || ""
          }
        }
      };
      const queueRes = await fetch(new URL("/prompt", host), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, client_id: clientId })
      });
      let queueParsed = {};
      try {
        queueParsed = await queueRes.json();
      } catch {
      }
      if (!queueRes.ok) {
        const errObj = queueParsed.error;
        const errMsg = errObj?.message;
        return { ok: false, error: errMsg ? `ComfyUI rejected the request: ${errMsg}` : `ComfyUI returned HTTP ${queueRes.status} queuing the tag request.` };
      }
      const nodeErrors = queueParsed.node_errors;
      const nodeErrorKeys = nodeErrors ? Object.keys(nodeErrors) : [];
      if (nodeErrorKeys.length) return { ok: false, error: `ComfyUI rejected the workflow: ${JSON.stringify(nodeErrors)}` };
      const promptId = queueParsed.prompt_id;
      if (!promptId) return { ok: false, error: "ComfyUI did not return a prompt id." };
      const deadline = Date.now() + 12e4;
      while (Date.now() < deadline) {
        await sleep(700);
        let histRes;
        try {
          histRes = await fetch(new URL(`/history/${promptId}`, host));
        } catch {
          continue;
        }
        if (!histRes.ok) continue;
        let hist = {};
        try {
          hist = await histRes.json();
        } catch {
          continue;
        }
        const record = hist[promptId];
        if (!record) continue;
        const outputs = record.outputs;
        if (outputs?.["2"]?.tags) {
          const tags = outputs["2"].tags;
          return { ok: true, tagsCsv: Array.isArray(tags) ? tags[0] : tags };
        }
        const status = record.status;
        if (status?.status_str === "error") {
          return { ok: false, error: "ComfyUI reported an error while tagging this image \u2014 check its console for details." };
        }
      }
      return { ok: false, error: "Timed out waiting for ComfyUI to finish tagging this image." };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: `Could not reach ComfyUI at ${host} (${msg})` };
    }
  }
  async function comfyGetObjectInfo({ host, classType, inputName }) {
    host = normalizeHost(host);
    try {
      const res = await fetch(new URL(`/object_info/${encodeURIComponent(classType)}`, host));
      if (!res.ok) return { ok: false, error: `ComfyUI returned HTTP ${res.status} looking up ${classType}.` };
      const parsed = await res.json();
      const nodeInfo = parsed[classType];
      const values = nodeInfo?.input?.required?.[inputName]?.[0];
      if (!Array.isArray(values)) return { ok: false, error: `Could not find "${inputName}" on ${classType} \u2014 is the right custom node installed?` };
      return { ok: true, values };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: `Could not reach ComfyUI at ${host}${isLikelyCorsFailure(err) ? corsHintSuffix() : " (" + msg + ")"}` };
    }
  }
  var previewFrameCallback = () => {
  };
  var progressCallback = () => {
  };
  var activeGen = null;
  function comfyOnPreviewFrame(cb) {
    previewFrameCallback = cb;
  }
  function comfyOnProgress(cb) {
    progressCallback = cb;
  }
  async function comfyStopGeneration(host) {
    host = normalizeHost(host);
    if (activeGen) activeGen.cancelled = true;
    try {
      await fetch(new URL("/interrupt", host), { method: "POST" });
    } catch {
    }
    return { ok: true };
  }
  async function fetchViewImage(host, image) {
    const qs = new URLSearchParams({ filename: image.filename, subfolder: image.subfolder || "", type: image.type || "output" });
    const res = await fetch(new URL(`/view?${qs.toString()}`, host));
    if (!res.ok) throw new Error(`ComfyUI returned HTTP ${res.status} fetching the generated image.`);
    return new Uint8Array(await res.arrayBuffer());
  }
  async function comfyQueueAndFetch({ host, imageFilename, imageBytes, prompt }) {
    host = normalizeHost(host);
    let ws = null;
    try {
      if (imageBytes && prompt["239"]) {
        const form = new FormData();
        form.append("type", "input");
        form.append("overwrite", "true");
        form.append("image", new Blob([imageBytes]), imageFilename);
        let uploadRes;
        try {
          uploadRes = await fetch(new URL("/upload/image", host), { method: "POST", body: form });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return { ok: false, error: `Could not reach ComfyUI at ${host}${isLikelyCorsFailure(err) ? corsHintSuffix() : " (" + msg + ")"}` };
        }
        if (!uploadRes.ok) return { ok: false, error: `Reference image upload to ComfyUI failed (HTTP ${uploadRes.status}).` };
        const uploaded = await uploadRes.json();
        const imageRef = uploaded.subfolder ? `${uploaded.subfolder}/${uploaded.name}` : uploaded.name;
        prompt["239"].inputs.image = imageRef;
      }
      const clientId = `dts-mobile-synthdat-${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
      activeGen = { cancelled: false };
      try {
        const wsUrl = `${host.replace(/^http/i, "ws")}/ws?clientId=${encodeURIComponent(clientId)}`;
        ws = new WebSocket(wsUrl);
        ws.binaryType = "arraybuffer";
        ws.addEventListener("open", () => {
          try {
            ws.send(JSON.stringify({ type: "feature_flags", data: { supports_preview_metadata: true } }));
          } catch {
          }
        });
        ws.addEventListener("message", (ev) => {
          if (ev.data instanceof ArrayBuffer) {
            const data = new DataView(ev.data);
            if (ev.data.byteLength < 8) return;
            const eventType = data.getUint32(0, false);
            if (eventType === 1) {
              const imageType = data.getUint32(4, false);
              previewFrameCallback(null, { mime: imageType === 1 ? "image/jpeg" : "image/png", bytes: new Uint8Array(ev.data.slice(8)) });
            } else if (eventType === 4) {
              try {
                const metaLen = data.getUint32(4, false);
                const metaBytes = new Uint8Array(ev.data.slice(8, 8 + metaLen));
                const meta = JSON.parse(new TextDecoder().decode(metaBytes));
                previewFrameCallback(null, { mime: meta.image_type || "image/jpeg", bytes: new Uint8Array(ev.data.slice(8 + metaLen)) });
              } catch {
              }
            }
          } else {
            try {
              const msg = JSON.parse(ev.data);
              if (msg.type === "progress" && msg.data) {
                progressCallback(null, msg.data);
              } else if (msg.type === "progress_state" && msg.data) {
                const nodes = msg.data.nodes;
                if (nodes) {
                  const running2 = Object.values(nodes).filter((n) => n.state === "running");
                  if (running2.length) {
                    const n = running2[running2.length - 1];
                    progressCallback(null, { value: n.value, max: n.max });
                  }
                }
              }
            } catch {
            }
          }
        });
        ws.addEventListener("error", (err) => console.error("[synthdat] preview websocket error:", err));
        ws.addEventListener("close", (ev) => {
          if (ev.code !== 1e3) console.error("[synthdat] preview websocket closed:", ev.code, ev.reason);
        });
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, 3e3);
          ws.addEventListener("open", () => {
            clearTimeout(timer);
            resolve();
          }, { once: true });
          ws.addEventListener("error", () => {
            clearTimeout(timer);
            resolve();
          }, { once: true });
        });
      } catch (err) {
        console.error("[synthdat] preview websocket setup failed:", err);
      }
      const queueRes = await fetch(new URL("/prompt", host), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, client_id: clientId, extra_data: { preview_method: "taesd" } })
      });
      let queueParsed = {};
      try {
        queueParsed = await queueRes.json();
      } catch {
      }
      if (!queueRes.ok) {
        const errObj = queueParsed.error;
        const errMsg = errObj?.message;
        return { ok: false, error: errMsg ? `ComfyUI rejected the request: ${errMsg}` : `ComfyUI returned HTTP ${queueRes.status} queuing the generation request.` };
      }
      const nodeErrors = queueParsed.node_errors;
      const nodeErrorKeys = nodeErrors ? Object.keys(nodeErrors) : [];
      if (nodeErrorKeys.length) return { ok: false, error: `ComfyUI rejected the workflow: ${JSON.stringify(nodeErrors)}` };
      const promptId = queueParsed.prompt_id;
      if (!promptId) return { ok: false, error: "ComfyUI did not return a prompt id." };
      const deadline = Date.now() + 3e5;
      while (Date.now() < deadline) {
        if (activeGen.cancelled) return { ok: false, error: "Generation stopped.", interrupted: true };
        await sleep(700);
        if (activeGen.cancelled) return { ok: false, error: "Generation stopped.", interrupted: true };
        let histRes;
        try {
          histRes = await fetch(new URL(`/history/${promptId}`, host));
        } catch {
          continue;
        }
        if (!histRes.ok) continue;
        let hist = {};
        try {
          hist = await histRes.json();
        } catch {
          continue;
        }
        const record = hist[promptId];
        if (!record) continue;
        const outputs = record.outputs;
        const saveOutput = outputs?.["192"];
        const image = saveOutput?.images?.[0];
        if (image) {
          const result = { ok: true, imageBytes: await fetchViewImage(host, image) };
          const pass1Output = outputs?.["192_pass1"];
          const pass1Image = pass1Output?.images?.[0];
          if (pass1Image) {
            try {
              result.pass1ImageBytes = await fetchViewImage(host, pass1Image);
            } catch {
            }
          }
          return result;
        }
        const status = record.status;
        if (status?.status_str === "error") {
          return { ok: false, error: "ComfyUI reported an error while generating this image \u2014 check its console for details." };
        }
      }
      return { ok: false, error: "Timed out waiting for ComfyUI to finish generating this image." };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: `Could not reach ComfyUI at ${host} (${msg})` };
    } finally {
      try {
        if (ws) ws.close();
      } catch {
      }
      activeGen = null;
    }
  }
  if (window.Capacitor) {
    const api = window.electronAPI || {};
    api.synthdatGetObjectInfo = comfyGetObjectInfo;
    api.synthdatQueueAndFetch = comfyQueueAndFetch;
    api.synthdatStopGeneration = comfyStopGeneration;
    api.onSynthdatPreviewFrame = comfyOnPreviewFrame;
    api.onSynthdatProgress = comfyOnProgress;
    window.electronAPI = api;
  }

  // src/renderer/wd14-local-bridge.ts
  if (window.electronAPI && window.electronAPI.wd14LocalListModels) {
    let progressListenerAdded = false;
    const progressCallbacks = /* @__PURE__ */ new Map();
    const bridge = {
      async listModels() {
        return await window.electronAPI.wd14LocalListModels();
      },
      async deleteModel(name) {
        await window.electronAPI.wd14LocalDeleteModel(name);
      },
      async downloadModel(opts, onProgress) {
        if (!progressListenerAdded) {
          progressListenerAdded = true;
          window.electronAPI.onWd14LocalDownloadProgress((_event, ev) => {
            const cb = progressCallbacks.get(ev.name);
            if (cb) cb(ev);
          });
        }
        if (onProgress) progressCallbacks.set(opts.name, onProgress);
        try {
          await window.electronAPI.wd14LocalDownloadModel(opts);
        } finally {
          progressCallbacks.delete(opts.name);
        }
      },
      async tagImage(payload) {
        return await window.electronAPI.wd14LocalTagImage(payload);
      },
      async pickImportFiles() {
        return await window.electronAPI.wd14LocalPickImportFiles();
      },
      async importModel(payload) {
        await window.electronAPI.wd14LocalImportModel(payload);
      }
    };
    window.Wd14Local = bridge;
  }

  // src/renderer/wd14-tagger.ts
  var hasElectronComfy = !!(window.electronAPI && window.electronAPI.wd14GetModels);
  var SETTINGS_KEY = "dts-wd14-settings";
  var DEFAULT_SETTINGS = {
    host: "http://127.0.0.1:8188",
    model: "",
    threshold: 0.35,
    characterThreshold: 0.85,
    trailingComma: false,
    excludeTags: "",
    autoApply: false,
    mode: "comfyui",
    localModel: "",
    gpu: true
  };
  var settings = { ...DEFAULT_SETTINGS };
  var getEntries4 = () => [];
  var refreshAllUIRef5 = () => {
  };
  var cancelRequested = false;
  var running = false;
  var lastProvider = null;
  function gpuCheckbox() {
    return document.getElementById("wd14Gpu");
  }
  function loadSettings() {
    const base = { ...DEFAULT_SETTINGS, mode: hasLocalWd14 ? "local" : "comfyui" };
    settings = { ...base };
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
      if (saved && typeof saved === "object") settings = { ...base, ...saved };
    } catch (e) {
    }
  }
  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
    }
  }
  var hasLocalWd14 = !!window.Wd14Local;
  function applySettingsToUI() {
    wd14Host.value = settings.host;
    wd14Threshold.value = String(settings.threshold);
    wd14CharThreshold.value = String(settings.characterThreshold);
    wd14TrailingComma.checked = !!settings.trailingComma;
    wd14ExcludeTags.value = settings.excludeTags;
    wd14AutoApply.checked = !!settings.autoApply;
    const gpuEl = gpuCheckbox();
    if (gpuEl) gpuEl.checked = settings.gpu !== false;
    if (settings.model) {
      if (![...wd14ModelSelect.options].some((o) => o.value === settings.model)) {
        const opt = document.createElement("option");
        opt.value = settings.model;
        opt.textContent = settings.model;
        wd14ModelSelect.appendChild(opt);
      }
      wd14ModelSelect.value = settings.model;
    }
    wd14ModeRow.style.display = hasLocalWd14 ? "" : "none";
    if (hasLocalWd14) {
      wd14ModeSelect.value = settings.mode;
      wd14ComfyuiFields.style.display = settings.mode === "local" ? "none" : "";
      wd14LocalFields.style.display = settings.mode === "local" ? "" : "none";
    }
  }
  async function refreshModels(silent) {
    const host = wd14Host.value.trim() || DEFAULT_SETTINGS.host;
    const res = hasElectronComfy ? await window.electronAPI.wd14GetModels(host) : await comfyGetModels(host);
    if (!res.ok) {
      if (!silent) toast(res.error || "Could not fetch the model list from ComfyUI.", 4200);
      return;
    }
    const current = wd14ModelSelect.value || settings.model;
    wd14ModelSelect.innerHTML = "";
    const models = res.models || [];
    for (const m of models) {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      wd14ModelSelect.appendChild(opt);
    }
    if (current && models.includes(current)) wd14ModelSelect.value = current;
    if (!silent) toast(`Loaded ${models.length} model(s) from ComfyUI.`, 2400);
  }
  function readSettingsFromUI() {
    settings = {
      host: wd14Host.value.trim() || DEFAULT_SETTINGS.host,
      model: wd14ModelSelect.value,
      threshold: parseFloat(wd14Threshold.value) || 0,
      characterThreshold: parseFloat(wd14CharThreshold.value) || 0,
      trailingComma: wd14TrailingComma.checked,
      excludeTags: wd14ExcludeTags.value,
      autoApply: wd14AutoApply.checked,
      mode: hasLocalWd14 ? wd14ModeSelect.value : "comfyui",
      localModel: hasLocalWd14 ? wd14LocalModelSelect.value : "",
      gpu: gpuCheckbox() ? gpuCheckbox().checked : settings.gpu !== false
    };
    saveSettings();
    if (hasLocalWd14) {
      wd14ComfyuiFields.style.display = settings.mode === "local" ? "none" : "";
      wd14LocalFields.style.display = settings.mode === "local" ? "" : "none";
    }
  }
  function parseWd14Tags(tagsCsv) {
    if (!tagsCsv) return [];
    return tagsCsv.split(",").map((t) => t.replace(/\\\(/g, "(").replace(/\\\)/g, ")").replace(/_/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
  }
  function setStatus(text, progressFraction) {
    if (!text) {
      wd14Status.style.display = "none";
      return;
    }
    wd14Status.style.display = "block";
    wd14Status.querySelector("span").textContent = text;
    const fill = wd14Status.querySelector(".wd14-progress-fill");
    if (fill) fill.style.width = (progressFraction == null ? 0 : Math.round(progressFraction * 100)) + "%";
  }
  async function tagOneWithRetry(entry) {
    while (true) {
      if (cancelRequested) return null;
      let bytes;
      try {
        const file = await entry.imgHandle.getFile();
        bytes = new Uint8Array(await file.arrayBuffer());
      } catch (err) {
        toast(`Could not read ${entry.imgName} off disk \u2014 skipping.`, 3600);
        return null;
      }
      const res = hasLocalWd14 && settings.mode === "local" ? await window.Wd14Local.tagImage({
        name: settings.localModel,
        imageBytes: bytes,
        threshold: settings.threshold,
        characterThreshold: settings.characterThreshold,
        preferGpu: settings.gpu !== false
      }) : hasElectronComfy ? await window.electronAPI.wd14TagImage({
        host: settings.host,
        filename: entry.imgName || entry.base,
        imageBytes: bytes,
        settings
      }) : await comfyTagImage({ host: settings.host, filename: entry.imgName || entry.base, imageBytes: bytes, settings });
      if (res.ok) {
        const provider = res.provider;
        if (provider) lastProvider = provider;
        return res.tagsCsv || null;
      }
      const retry = await showConfirmModal(
        `${res.error || "WD14 tagging failed."}

Image: ${entry.imgName}`,
        { okLabel: "Retry", cancelLabel: "Skip this image", danger: true }
      );
      if (!retry) return null;
    }
  }
  function showWd14ReviewModal(rows) {
    return new Promise((resolve) => {
      const backdrop = document.createElement("div");
      backdrop.className = "confirm-backdrop";
      const box = document.createElement("div");
      box.className = "confirm-box wd14-review-box";
      const msg = document.createElement("div");
      msg.className = "confirm-message";
      msg.textContent = `Review WD14 tags for ${rows.length} image(s) before applying. Edit any row, or uncheck to skip it.`;
      box.appendChild(msg);
      const list = document.createElement("div");
      list.className = "wd14-review-list";
      const rowState = rows.map((r) => ({ ...r, include: true, textEl: null, tagChips: [] }));
      const isTouchDevice2 = document.documentElement.classList.contains("touch-device");
      for (const rs of rowState) {
        const rowEl = document.createElement("div");
        rowEl.className = "wd14-review-row";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = true;
        cb.addEventListener("change", () => {
          rs.include = cb.checked;
          rowEl.classList.toggle("excluded", !cb.checked);
        });
        rowEl.appendChild(cb);
        const img = document.createElement("img");
        img.src = rs.entry.objectUrl;
        img.loading = "lazy";
        rowEl.appendChild(img);
        const colWrap = document.createElement("div");
        colWrap.className = "wd14-review-col";
        const label = document.createElement("div");
        label.className = "wd14-review-name";
        label.textContent = rs.entry.imgName || rs.entry.base;
        colWrap.appendChild(label);
        if (isTouchDevice2) {
          let renderChips = function() {
            chipList.innerHTML = "";
            for (const chip of rs.tagChips) {
              const chipEl = document.createElement("label");
              chipEl.className = "wd14-review-chip" + (chip.checked ? "" : " unchecked");
              const chipCb = document.createElement("input");
              chipCb.type = "checkbox";
              chipCb.checked = chip.checked;
              chipCb.addEventListener("change", () => {
                chip.checked = chipCb.checked;
                chipEl.classList.toggle("unchecked", !chip.checked);
              });
              chipEl.appendChild(chipCb);
              const chipText = document.createElement("span");
              chipText.textContent = chip.tag;
              chipEl.appendChild(chipText);
              const dropBtn = document.createElement("button");
              dropBtn.type = "button";
              dropBtn.className = "wd14-review-chip-drop";
              dropBtn.textContent = "\xD7";
              dropBtn.title = `Drop "${chip.tag}" from this image's tags`;
              dropBtn.addEventListener("click", (ev) => {
                ev.preventDefault();
                rs.tagChips = rs.tagChips.filter((c) => c !== chip);
                renderChips();
              });
              chipEl.appendChild(dropBtn);
              chipList.appendChild(chipEl);
            }
          };
          rs.tagChips = rs.mergedTags.map((tag) => ({ tag, checked: true }));
          const chipList = document.createElement("div");
          chipList.className = "wd14-review-chips";
          renderChips();
          colWrap.appendChild(chipList);
        } else {
          const textarea = document.createElement("textarea");
          textarea.value = rs.mergedTags.join(", ");
          colWrap.appendChild(textarea);
          rs.textEl = textarea;
        }
        rowEl.appendChild(colWrap);
        list.appendChild(rowEl);
      }
      box.appendChild(list);
      const btnRow = document.createElement("div");
      btnRow.className = "confirm-btn-row";
      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "Cancel";
      const okBtn = document.createElement("button");
      okBtn.className = "primary";
      okBtn.textContent = "Apply checked rows";
      function close(result) {
        backdrop.classList.remove("modal-visible");
        setTimeout(() => backdrop.remove(), 160);
        resolve(result);
      }
      cancelBtn.addEventListener("click", () => close(null));
      okBtn.addEventListener("click", () => {
        const accepted = rowState.filter((rs) => rs.include).map((rs) => ({
          entry: rs.entry,
          tags: isTouchDevice2 ? rs.tagChips.filter((c) => c.checked).map((c) => c.tag) : rs.textEl.value.split(",").map((t) => t.replace(/_/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean)
        }));
        close(accepted);
      });
      backdrop.addEventListener("click", (ev) => {
        if (ev.target === backdrop) close(null);
      });
      btnRow.appendChild(cancelBtn);
      btnRow.appendChild(okBtn);
      box.appendChild(btnRow);
      backdrop.appendChild(box);
      document.body.appendChild(backdrop);
      requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add("modal-visible")));
    });
  }
  function commitTags(accepted) {
    const affected = [];
    for (const { entry, tags } of accepted) {
      const prevTags = entry.tags.slice();
      const newTags = Array.from(new Set(tags));
      if (newTags.length === prevTags.length && newTags.every((t, i) => t === prevTags[i])) continue;
      entry.tags = newTags;
      markDirty(entry);
      affected.push({ base: entry.base, prevTags, newTags: newTags.slice() });
    }
    if (affected.length === 0) {
      toast("No tag changes to apply.");
      return;
    }
    const summary = `WD14-tagged ${affected.length} image(s).`;
    toast(summary);
    recordChange("add-tag", summary, affected);
    folderStats.master_ops = (folderStats.master_ops || 0) + 1;
    trackStat("wd14_images_tagged", affected.length);
    saveFolderStats();
    refreshAllUIRef5();
    checkAchievements();
  }
  async function runBatch(entries) {
    if (running) {
      cancelRequested = true;
      return;
    }
    if (entries.length === 0) {
      toast('Select at least one image first (or right-click a single image and choose "Tag with WD14").');
      return;
    }
    const usingLocal = hasLocalWd14 && settings.mode === "local";
    if (usingLocal && !settings.localModel) {
      toast("Pick (or download) a local WD14 model first in WD14 settings.");
      return;
    }
    if (!usingLocal && !settings.model) {
      toast("Pick a WD14 model first \u2014 use the \u{1F504} button in WD14 settings to load the list from ComfyUI.");
      return;
    }
    running = true;
    cancelRequested = false;
    lastProvider = null;
    btnWd14TagSelected.textContent = "\u23F9 Cancel tagging";
    const results = [];
    let failCount = 0;
    for (let i = 0; i < entries.length; i++) {
      if (cancelRequested) break;
      const entry = entries[i];
      setStatus(`Tagging ${i + 1}/${entries.length} \u2014 ${entry.imgName}\u2026`, i / entries.length);
      const tagsCsv = await tagOneWithRetry(entry);
      if (tagsCsv == null) {
        failCount++;
        continue;
      }
      const fresh = parseWd14Tags(tagsCsv);
      const mergedTags = entry.tags.concat(fresh.filter((t) => !entry.tags.includes(t)));
      results.push({ entry, mergedTags });
    }
    const failNote = failCount > 0 ? ` (${failCount} skipped)` : "";
    const engineNote = lastProvider ? ` \u2014 on ${lastProvider === "dml" ? "GPU" : "CPU"}` : "";
    setStatus("");
    running = false;
    btnWd14TagSelected.textContent = "\u{1F40D} Tag selected images with WD14";
    if (cancelRequested && results.length === 0) {
      toast("WD14 tagging cancelled.");
      return;
    }
    if (results.length === 0) {
      toast(`Could not tag any of the ${entries.length} image(s).`);
      return;
    }
    if (settings.autoApply) {
      commitTags(results.map((r) => ({ entry: r.entry, tags: r.mergedTags })));
      toast(`Applied WD14 tags to ${results.length} image(s)${failNote}${engineNote}.`);
    } else {
      const accepted = await showWd14ReviewModal(results);
      if (!accepted || accepted.length === 0) {
        toast("WD14 tagging discarded \u2014 nothing was applied.");
        return;
      }
      commitTags(accepted);
      if (engineNote) toast(`Applied WD14 tags to ${accepted.length} image(s)${engineNote}.`);
    }
  }
  function tagSingleImageWithWd14(entry) {
    if (running) {
      toast("A WD14 batch is already running.");
      return;
    }
    runBatch([entry]);
  }
  var KNOWN_MODELS = [
    { repo: "SmilingWolf/wd-vit-tagger-v3", label: "ViT v3", desc: "Smallest/fastest of this set." },
    { repo: "SmilingWolf/wd-convnext-tagger-v3", label: "ConvNext v3", desc: "Good size/accuracy balance." },
    { repo: "SmilingWolf/wd-swinv2-tagger-v3", label: "SwinV2 v3", desc: "Strong accuracy, moderate size." },
    { repo: "SmilingWolf/wd-vit-large-tagger-v3", label: "ViT Large v3", desc: "Higher accuracy, larger download." },
    { repo: "SmilingWolf/wd-eva02-large-tagger-v3", label: "EVA02 Large v3", desc: "Highest accuracy of this set, largest/slowest." }
  ];
  function resolveHfRepo(input) {
    let path = input.trim().replace(/^https?:\/\/(huggingface\.co|hf\.co)\//i, "");
    path = path.replace(/^\/+|\/+$/g, "");
    const segments = path.split("/").filter(Boolean);
    if (segments.length < 2) return null;
    const repo = `${segments[0]}/${segments[1]}`;
    return {
      name: segments[1],
      modelUrl: `https://huggingface.co/${repo}/resolve/main/model.onnx`,
      tagsUrl: `https://huggingface.co/${repo}/resolve/main/selected_tags.csv`
    };
  }
  async function refreshLocalModels() {
    if (!hasLocalWd14) return;
    const models = await window.Wd14Local.listModels();
    const current = wd14LocalModelSelect.value || settings.localModel;
    wd14LocalModelSelect.innerHTML = "";
    if (models.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "(no models downloaded yet)";
      wd14LocalModelSelect.appendChild(opt);
    } else {
      for (const m of models) {
        const opt = document.createElement("option");
        opt.value = m.name;
        opt.textContent = `${m.name} (${m.tagCount || 0} tags, ${Math.round((m.sizeBytes || 0) / 1e6)}MB)`;
        wd14LocalModelSelect.appendChild(opt);
      }
      if (current && models.some((m) => m.name === current)) wd14LocalModelSelect.value = current;
    }
    wd14LocalModelList.innerHTML = "";
    for (const m of models) {
      const row = document.createElement("div");
      row.className = "wd14-local-model-row";
      const label = document.createElement("span");
      label.textContent = `${m.name} \u2014 ${m.tagCount || 0} tags, ${Math.round((m.sizeBytes || 0) / 1e6)}MB`;
      row.appendChild(label);
      const delBtn = document.createElement("button");
      delBtn.className = "danger-ghost";
      delBtn.textContent = "\u2715";
      delBtn.title = "Delete this downloaded model";
      delBtn.addEventListener("click", async () => {
        await window.Wd14Local.deleteModel(m.name);
        if (settings.localModel === m.name) {
          settings.localModel = "";
          saveSettings();
        }
        refreshLocalModels();
      });
      row.appendChild(delBtn);
      wd14LocalModelList.appendChild(row);
    }
  }
  async function downloadRepo(resolved, triggerBtn) {
    const { name, modelUrl, tagsUrl } = resolved;
    const existing = await window.Wd14Local.listModels();
    if (existing.some((m) => m.name === name)) {
      const ok = await showConfirmModal(
        `"${name}" is already downloaded. Download it again? This overwrites the existing copy.`,
        { okLabel: "Redownload" }
      );
      if (!ok) return;
    }
    triggerBtn.disabled = true;
    wd14LocalDownloadStatus.style.display = "block";
    wd14LocalDownloadStatus.textContent = `Starting download of "${name}"\u2026`;
    try {
      await window.Wd14Local.downloadModel({ name, modelUrl, tagsUrl }, (ev) => {
        wd14LocalDownloadStatus.textContent = `Downloading "${name}" \u2014 ${ev.part}\u2026 ${ev.percent}%`;
      });
      toast(`Downloaded "${name}".`);
      settings.localModel = name;
      saveSettings();
      await refreshLocalModels();
      wd14LocalModelSelect.value = name;
    } catch (e) {
      toast(`Download failed: ${e?.message || e}`, 4200);
    } finally {
      triggerBtn.disabled = false;
      wd14LocalDownloadStatus.style.display = "none";
    }
  }
  async function importFromDisk(triggerBtn) {
    let picked;
    try {
      picked = await window.Wd14Local.pickImportFiles();
    } catch (e) {
      toast(`Could not import: ${e?.message || e}`, 4200);
      return;
    }
    if ("canceled" in picked && picked.canceled) return;
    const { name, modelPath, tagsPath } = picked;
    const existing = await window.Wd14Local.listModels();
    if (existing.some((m) => m.name === name)) {
      const ok = await showConfirmModal(
        `"${name}" is already downloaded. Import this copy over it? This overwrites the existing copy.`,
        { okLabel: "Overwrite" }
      );
      if (!ok) return;
    }
    triggerBtn.disabled = true;
    try {
      await window.Wd14Local.importModel({ name, modelPath, tagsPath });
      toast(`Imported "${name}".`);
      settings.localModel = name;
      saveSettings();
      await refreshLocalModels();
      wd14LocalModelSelect.value = name;
    } catch (e) {
      toast(`Import failed: ${e?.message || e}`, 4200);
    } finally {
      triggerBtn.disabled = false;
    }
  }
  function renderLocalCatalog() {
    wd14LocalCatalog.innerHTML = "";
    for (const entry of KNOWN_MODELS) {
      const row = document.createElement("div");
      row.className = "wd14-local-model-row";
      const label = document.createElement("span");
      label.textContent = `${entry.label} \u2014 ${entry.desc}`;
      row.appendChild(label);
      const dlBtn = document.createElement("button");
      dlBtn.className = "primary";
      dlBtn.textContent = "\u2B07";
      dlBtn.title = `Download ${entry.repo}`;
      dlBtn.addEventListener("click", () => downloadRepo(resolveHfRepo(entry.repo), dlBtn));
      row.appendChild(dlBtn);
      wd14LocalCatalog.appendChild(row);
    }
  }
  function initWd14Tagger(deps) {
    getEntries4 = deps.getEntries;
    refreshAllUIRef5 = deps.refreshAllUI;
    loadSettings();
    applySettingsToUI();
    refreshModels(true);
    [wd14Host, wd14Threshold, wd14CharThreshold, wd14TrailingComma, wd14ExcludeTags, wd14AutoApply, wd14ModelSelect].forEach((el) => el.addEventListener("change", readSettingsFromUI));
    btnWd14RefreshModels.addEventListener("click", () => refreshModels(false));
    if (hasLocalWd14) {
      wd14ModeSelect.addEventListener("change", readSettingsFromUI);
      wd14LocalModelSelect.addEventListener("change", readSettingsFromUI);
      refreshLocalModels();
      renderLocalCatalog();
      btnWd14LocalDownload.addEventListener("click", async () => {
        const resolved = resolveHfRepo(wd14LocalAddRepo.value);
        if (!resolved) {
          toast("Enter a HuggingFace repo, e.g. SmilingWolf/wd-swinv2-tagger-v3.");
          return;
        }
        await downloadRepo(resolved, btnWd14LocalDownload);
        wd14LocalAddRepo.value = "";
      });
      if (window.Wd14Local.pickImportFiles) {
        btnWd14LocalImport.style.display = "";
        btnWd14LocalImport.addEventListener("click", () => importFromDisk(btnWd14LocalImport));
      }
    }
    btnWd14TagSelected.addEventListener("click", () => {
      if (running) {
        cancelRequested = true;
        return;
      }
      const entries = getEntries4().filter((e) => masterSelectedImages.has(e.base) && !e.disabled && !e.meta?.locked);
      runBatch(entries);
    });
  }

  // src/renderer/tag-details.ts
  var wikiData = null;
  var allTagsMap = null;
  async function fetchGzipJson(url) {
    const res = await fetch(url);
    const decompressed = res.body.pipeThrough(new DecompressionStream("gzip"));
    const text = await new Response(decompressed).text();
    return JSON.parse(text);
  }
  async function ensureWikiDataLoaded() {
    if (wikiData) return wikiData;
    try {
      wikiData = await fetchGzipJson("./data/wiki.json.gzdat");
    } catch (err) {
      console.error("wiki.json.gzdat load failed:", err);
      wikiData = {};
    }
    return wikiData;
  }
  async function ensureAllTagsLoaded() {
    if (allTagsMap) return allTagsMap;
    try {
      const list = await fetchGzipJson("./data/all_tags.json.gzdat");
      allTagsMap = /* @__PURE__ */ new Map();
      for (const row of list) {
        if (Array.isArray(row)) allTagsMap.set(row[0], { category: row[1], count: row[2] });
      }
    } catch (err) {
      console.error("all_tags.json.gzdat load failed:", err);
      allTagsMap = /* @__PURE__ */ new Map();
    }
    return allTagsMap;
  }
  var CATEGORY_NAMES = { 0: "General", 1: "Artist", 3: "Copyright", 4: "Character", 5: "Meta" };
  var CUSTOM_NOTES_KEY = "dts-custom-tag-notes";
  function getCustomTagNote(tag) {
    try {
      const notes = JSON.parse(localStorage.getItem(CUSTOM_NOTES_KEY) || "{}");
      return notes[tag] || "";
    } catch (e) {
      return "";
    }
  }
  function setCustomTagNote(tag, text) {
    try {
      const notes = JSON.parse(localStorage.getItem(CUSTOM_NOTES_KEY) || "{}");
      notes[tag] = text;
      localStorage.setItem(CUSTOM_NOTES_KEY, JSON.stringify(notes));
    } catch (e) {
    }
  }
  async function openTagDetails(tag) {
    tagDetailsTitle.textContent = tag;
    tagDetailsBody.innerHTML = '<div class="stats-empty">Loading\u2026</div>';
    hidePanel(themeCustomPanel);
    hidePanel(favoritesPanel);
    hidePanel(logPanel);
    hidePanel(achievementsPanel);
    hidePanel(shopPanel);
    showPanel(tagDetailsPanel);
    folderStats.tag_details_opened = (folderStats.tag_details_opened || 0) + 1;
    saveFolderStats();
    checkAchievements();
    const wikiKey = tag.replace(/ /g, "_");
    const [wiki, allTags] = await Promise.all([ensureWikiDataLoaded(), ensureAllTagsLoaded()]);
    const def = wiki[wikiKey];
    const meta = allTags.get(wikiKey);
    tagDetailsBody.innerHTML = "";
    if (meta) {
      const metaRow = document.createElement("div");
      metaRow.className = "tag-details-meta";
      metaRow.innerHTML = `<span>${CATEGORY_NAMES[meta.category] || "Unknown"}</span><span>${meta.count.toLocaleString()} posts</span>`;
      tagDetailsBody.appendChild(metaRow);
    }
    if (def) {
      const defEl = document.createElement("div");
      defEl.className = "tag-details-def";
      defEl.textContent = def;
      tagDetailsBody.appendChild(defEl);
    } else {
      const greyed = document.createElement("div");
      greyed.className = "tag-details-def greyed";
      greyed.textContent = "No official wiki entry for this tag.";
      tagDetailsBody.appendChild(greyed);
      const label = document.createElement("div");
      label.className = "ctx-sep";
      label.textContent = "Write your own description (saved on this computer):";
      tagDetailsBody.appendChild(label);
      const textarea = document.createElement("textarea");
      textarea.value = getCustomTagNote(tag);
      tagDetailsBody.appendChild(textarea);
      const saveBtn = document.createElement("button");
      saveBtn.className = "primary";
      saveBtn.textContent = "Save description";
      saveBtn.addEventListener("click", () => {
        setCustomTagNote(tag, textarea.value);
        toast("Saved your description for this tag.");
      });
      tagDetailsBody.appendChild(saveBtn);
    }
  }
  function initTagDetails() {
    tagDetailsCloseBtn.addEventListener("click", () => hidePanel(tagDetailsPanel));
  }

  // src/renderer/synthdat-overseer.ts
  var WD14_SETTINGS_KEY = "dts-wd14-settings";
  function getWd14Settings() {
    try {
      const saved = JSON.parse(localStorage.getItem(WD14_SETTINGS_KEY) || "null");
      if (saved && typeof saved === "object") return saved;
    } catch (e) {
    }
    return { host: "http://127.0.0.1:8188", model: "", threshold: 0.35, characterThreshold: 0.85, trailingComma: false, excludeTags: "" };
  }
  function getHost() {
    return (synthDatHost.value || "").trim() || "http://127.0.0.1:8188";
  }
  var SETTINGS_FILE_NAME = "_dts_synthdat_settings.json";
  var saveTimer = null;
  function scheduleSave() {
    if (saveTimer !== null) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveSettings2, 400);
  }
  async function saveSettings2() {
    const dirHandle = getDirHandle7();
    if (!dirHandle) return;
    try {
      const handle = await dirHandle.getFileHandle(SETTINGS_FILE_NAME, { create: true });
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify({
        host: synthDatHost.value,
        unifiedPromptMode: synthDatUnifiedPromptMode.checked,
        unifiedPrompt: synthDatUnifiedPrompt.value,
        global: synthDatGlobal.value,
        character: synthDatCharacter.value,
        characterTrigger: synthDatCharacterTrigger.value,
        rating: synthDatRating.value,
        hair: synthDatHair.value,
        face: synthDatFace.value,
        chest: synthDatChest.value,
        body: synthDatBody.value,
        clothes: synthDatClothes.value,
        limbs: synthDatLimbs.value,
        sexual: synthDatSexual.value,
        scene: synthDatScene.value,
        effects: synthDatEffects.value,
        extra: synthDatExtra.value,
        negative: synthDatNegative.value,
        diffModel: synthDatDiffModel.value,
        clip: synthDatClip.value,
        vae: synthDatVae.value,
        mainLora: synthDatMainLora.value,
        loraRows: loraRows.map((r) => ({ lora: r.input.value, strength: r.strength.value })),
        lliteStrength: synthDatLLLiteStrength.value,
        lliteStartPercent: synthDatLLLiteStartPercent.value,
        lliteEndPercent: synthDatLLLiteEndPercent.value,
        llitePreserveWrapper: synthDatLLLitePreserveWrapper.checked,
        resizeFit: synthDatResizeFit.value,
        resizeMethod: synthDatResizeMethod.value,
        sampler: synthDatSampler.value,
        scheduler: synthDatScheduler.value,
        steps1: synthDatSteps1.value,
        cfg1: synthDatCfg1.value,
        steps2: synthDatSteps2.value,
        width: synthDatWidth.value,
        height: synthDatHeight.value,
        use2Pass: synthDatUse2Pass.checked,
        seed1: synthDatSeed1.value,
        seed2: synthDatSeed2.value,
        denoise2: synthDatDenoise2.value,
        stripHairFace: synthDatStripHairFace.checked,
        skipRefImage: synthDatSkipRefImage.checked
      }, null, 2));
      await writable.close();
    } catch (e) {
    }
  }
  function resetSettingsToDefault() {
    synthDatHost.value = "";
    synthDatUnifiedPromptMode.checked = false;
    synthDatUnifiedPrompt.value = "";
    synthDatGlobal.value = "";
    synthDatCharacter.value = "";
    synthDatCharacterTrigger.value = "";
    synthDatRating.value = "";
    synthDatHair.value = "";
    synthDatFace.value = "";
    synthDatChest.value = "";
    synthDatBody.value = "";
    synthDatClothes.value = "";
    synthDatLimbs.value = "";
    synthDatSexual.value = "";
    synthDatScene.value = "";
    synthDatEffects.value = "";
    synthDatExtra.value = "";
    synthDatNegative.value = "";
    synthDatDiffModel.value = "";
    synthDatClip.value = "";
    synthDatVae.value = "";
    synthDatMainLora.value = "";
    synthDatLoraStackRows.innerHTML = "";
    loraRows = [];
    synthDatLLLiteStrength.value = "1";
    synthDatLLLiteStartPercent.value = "0";
    synthDatLLLiteEndPercent.value = "0.3";
    synthDatLLLitePreserveWrapper.checked = true;
    synthDatResizeFit.value = "pad";
    synthDatResizeMethod.value = "lanczos";
    synthDatSampler.value = "res_multistep";
    synthDatScheduler.value = "beta";
    synthDatSteps1.value = "25";
    synthDatCfg1.value = "4.04";
    synthDatSteps2.value = "15";
    synthDatWidth.value = "920";
    synthDatHeight.value = "1244";
    synthDatUse2Pass.checked = false;
    synthDatSeed1.value = "15";
    synthDatSeed2.value = "15";
    synthDatDenoise2.value = "0.6";
    synthDatStripHairFace.checked = true;
    synthDatSkipRefImage.checked = false;
    applySkipRefImageUI();
    applyUnifiedPromptModeUI();
  }
  async function loadSettingsFromFile() {
    const dirHandle = getDirHandle7();
    if (!dirHandle) return null;
    let saved = null;
    try {
      const handle = await dirHandle.getFileHandle(SETTINGS_FILE_NAME, { create: false });
      const file = await handle.getFile();
      saved = JSON.parse((await file.text()).trim() || "null");
    } catch (e) {
      return null;
    }
    if (!saved) return null;
    synthDatHost.value = saved.host || "";
    synthDatUnifiedPromptMode.checked = !!saved.unifiedPromptMode;
    synthDatUnifiedPrompt.value = saved.unifiedPrompt || "";
    synthDatGlobal.value = saved.global || "";
    synthDatCharacter.value = saved.character || "";
    synthDatCharacterTrigger.value = saved.characterTrigger || "";
    synthDatRating.value = saved.rating || "";
    synthDatHair.value = saved.hair || "";
    synthDatFace.value = saved.face || "";
    synthDatChest.value = saved.chest || "";
    synthDatBody.value = saved.body || "";
    synthDatClothes.value = saved.clothes || "";
    synthDatLimbs.value = saved.limbs || "";
    synthDatSexual.value = saved.sexual || "";
    synthDatScene.value = saved.scene || "";
    synthDatEffects.value = saved.effects || "";
    synthDatExtra.value = saved.extra || "";
    synthDatNegative.value = saved.negative || "";
    synthDatDiffModel.value = saved.diffModel || "";
    synthDatClip.value = saved.clip || "";
    synthDatVae.value = saved.vae || "";
    synthDatMainLora.value = saved.mainLora || "";
    synthDatLLLiteStrength.value = saved.lliteStrength != null ? saved.lliteStrength : 1;
    synthDatLLLiteStartPercent.value = saved.lliteStartPercent != null ? saved.lliteStartPercent : 0;
    synthDatLLLiteEndPercent.value = saved.lliteEndPercent != null ? saved.lliteEndPercent : 0.3;
    synthDatLLLitePreserveWrapper.checked = saved.llitePreserveWrapper !== false;
    synthDatResizeFit.value = saved.resizeFit || "pad";
    synthDatResizeMethod.value = saved.resizeMethod || "lanczos";
    if (saved.sampler) synthDatSampler.value = saved.sampler;
    if (saved.scheduler) synthDatScheduler.value = saved.scheduler;
    synthDatSteps1.value = saved.steps1 || 25;
    synthDatCfg1.value = saved.cfg1 != null ? saved.cfg1 : 4.04;
    synthDatSteps2.value = saved.steps2 || 15;
    synthDatWidth.value = saved.width || 920;
    synthDatHeight.value = saved.height || 1244;
    synthDatUse2Pass.checked = !!saved.use2Pass;
    synthDatSeed1.value = saved.seed1 != null ? saved.seed1 : 15;
    synthDatSeed2.value = saved.seed2 != null ? saved.seed2 : 15;
    synthDatDenoise2.value = saved.denoise2 != null ? saved.denoise2 : 0.6;
    synthDatStripHairFace.checked = saved.stripHairFace !== false;
    synthDatSkipRefImage.checked = !!saved.skipRefImage;
    applySkipRefImageUI();
    applyUnifiedPromptModeUI();
    return saved;
  }
  async function loadSynthDatSettingsForFolder() {
    resetSettingsToDefault();
    const dirHandle = getDirHandle7();
    if (!dirHandle) {
      document.querySelectorAll("#synthDatTab textarea").forEach((el) => growTextarea(el));
      return;
    }
    const saved = await loadSettingsFromFile();
    if (saved) {
      const rows = Array.isArray(saved.loraRows) && saved.loraRows.length ? saved.loraRows : [{ lora: "", strength: 1 }, { lora: "", strength: 0.8 }];
      for (const r of rows) addLoraRow(r.lora, r.strength);
    } else {
      synthDatHost.value = getWd14Settings().host || "http://127.0.0.1:8188";
      addLoraRow("", 1);
      addLoraRow("", 0.8);
    }
    document.querySelectorAll("#synthDatTab textarea").forEach((el) => growTextarea(el));
  }
  var POSE_TAGS = /* @__PURE__ */ new Set([
    "standing",
    "sitting",
    "lying",
    "kneeling",
    "squatting",
    "crouching",
    "jumping",
    "running",
    "walking",
    "bent over",
    "on back",
    "on stomach",
    "on side",
    "wariza",
    "seiza",
    "all fours",
    "straddling",
    "stretching",
    "falling",
    "flying",
    "floating",
    "dancing",
    "fighting stance",
    "looking back",
    "looking up",
    "looking down",
    "looking at viewer",
    "looking away",
    "head tilt",
    "reclining",
    "curled up",
    "yoga",
    "split",
    "plank",
    "on one knee",
    "fetal position",
    "butterfly sitting",
    "figure four sitting",
    "indian style",
    "lotus position",
    "hugging own legs",
    "hug own legs",
    "sitting on lap",
    "human chair",
    "thigh straddling",
    "upright straddle",
    "yokozuwari",
    "balancing",
    "legs apart",
    "standing on one leg",
    "crawling",
    "midair",
    "hopping",
    "pouncing",
    "walking on wall",
    "top-down bottom-up",
    "prostration",
    "bear position",
    "bowlegged pose",
    "chest stand",
    "cowering",
    "crucifixion",
    "faceplant",
    "full scorpion",
    "battoujutsu stance",
    "spread eagle position",
    "superhero landing",
    "upside-down",
    "handstand",
    "headstand",
    "scorpion pose",
    "head down",
    "head back",
    "arched back",
    "bent back",
    "slouching",
    "sway back",
    "twisted torso",
    "crossed ankles",
    "leg up",
    "legs up",
    "knees to chest",
    "legs over head",
    "leg lift",
    "outstretched leg",
    "pigeon pose",
    "standing split",
    "uneven footing",
    "knees apart feet together",
    "knees together feet apart",
    "knee up",
    "knees up",
    "en pointe",
    "foot dangle",
    "bowing",
    "curtsey",
    "leaning forward",
    "leaning back",
    "hunched over",
    "hanging",
    "hanging upside down",
    "climbing",
    "swimming",
    "diving",
    "swinging",
    "riding",
    "galloping",
    "leaning on object"
  ]);
  var LIMB_ACTION_TAGS = /* @__PURE__ */ new Set([
    "arms up",
    "arms behind back",
    "arms behind head",
    "arms crossed",
    "crossed arms",
    "hand up",
    "hands up",
    "hand on hip",
    "hands on hips",
    "hand on own chest",
    "hand on own cheek",
    "hand on own chin",
    "hand on own head",
    "hands on own face",
    "reaching",
    "reaching out",
    "pointing",
    "pointing at viewer",
    "peace sign",
    "thumbs up",
    "clenched hand",
    "clenched hands",
    "open hand",
    "open hands",
    "own hands together",
    "hands together",
    "hands clasped",
    "waving",
    "arm support",
    "arm up",
    "spread legs",
    "crossed legs",
    "akimbo",
    "fingers together",
    "finger to mouth",
    "hand on own knee",
    "hands on own knees",
    "v",
    "arm behind back",
    "victory pose",
    "outstretched arm",
    "outstretched arms",
    "spread arms",
    "arm at side",
    "arms at sides",
    "airplane arms",
    "flexing",
    "t-pose",
    "a-pose",
    "w arms",
    "stroking own chin",
    "outstretched hand",
    "interlocked fingers",
    "star hands",
    "folded",
    "pin legs",
    "watson cross",
    "dorsiflexion",
    "plantar flexion",
    "toe scrunch",
    "tiptoes",
    "pigeon-toed",
    "hug",
    "hugging object",
    "hugging tail",
    "arm hug",
    "hug from behind",
    "waist hug",
    "piggyback",
    "carrying",
    "princess carry",
    "shoulder carry",
    "air quotes",
    "circle hands",
    "cupping hands",
    "double thumbs up",
    "double thumbs down",
    "double v",
    "fist bump",
    "hand glasses",
    "heart hands",
    "high five",
    "horns pose",
    "index finger raised",
    "index fingers together",
    "palm-fist tap",
    "pinky swear",
    "shadow puppet",
    "steepled fingers",
    "triangle hands",
    "x arms",
    "beckoning",
    "twirling hair",
    "middle finger",
    "pinky out",
    "shushing",
    "thumbs down",
    "pointing at another",
    "pointing at self",
    "pointing down",
    "pointing forward",
    "pointing up",
    "crossed fingers",
    "finger gun",
    "finger heart",
    "shaka sign",
    "v over eye",
    "v over mouth",
    "hand of benediction",
    "ok sign",
    "w",
    "facepalm",
    "salute",
    "spread fingers",
    "stop (gesture)",
    "fist pump",
    "power fist",
    "raised fist",
    "arm around neck",
    "arm on another's shoulder",
    "hand on another's shoulder",
    "hand on own shoulder",
    "hands on own shoulders",
    "hand on own ear",
    "hand on own face",
    "hands on own face",
    "hand on own forehead",
    "hands on own cheeks",
    "hands on own chin",
    "hand on own neck",
    "hands on own neck",
    "hands on own chest",
    "hand on own stomach",
    "hands on own stomach",
    "hand on own arm",
    "hand on own elbow",
    "hand on another's hip",
    "hands on another's hips",
    "hand in pocket",
    "hands in pockets",
    "headpat",
    "hand on another's head",
    "hands on another's head",
    "arm around shoulder",
    "hand on another's arm",
    "hand on another's back",
    "hand on another's chest",
    "hand on another's shoulder",
    "hands on another's shoulder",
    // Gestures — hand/mouth/body-language expressions common in the reference
    // poses SynthDat reads, over and above the hand-PLACEMENT tags above.
    "covering mouth",
    "covering face",
    "covering eyes",
    "covering one eye",
    "covering nose",
    "covering ears",
    "adjusting glasses",
    "adjusting eyewear",
    "adjusting headwear",
    "adjusting clothes",
    "hair flip",
    "blowing a kiss",
    "blowing bubble",
    "biting lip",
    "clapping",
    "snapping fingers",
    "yawning",
    "praying",
    "holding hands",
    "holding phone",
    "texting",
    "smoking",
    "drinking",
    "eating",
    "rolling up sleeves",
    "hand in own hair",
    "hand in another's hair",
    "grabbing another's arm",
    "grabbing another's hand"
  ]);
  var SEXUAL_ACTION_TAGS = /* @__PURE__ */ new Set([
    "groping motion",
    "groping",
    "hand in bra",
    "nipple tweak",
    "arm between breasts",
    "grabbing own breast",
    "grabbing another's breast",
    "flat chest grab",
    "guided breast grab",
    "breast lift",
    "breasts squeezed together",
    "breast suppress",
    "hand between own legs",
    "hand on own crotch",
    "hand on another's crotch",
    "hands on own crotch",
    "hand on own ass",
    "hand on another's ass",
    "cunnilingus gesture",
    "fellatio gesture",
    "handjob gesture",
    "penetration gesture",
    "tribadism gesture",
    "strangling",
    "foot worship",
    "kissing foot",
    "licking foot",
    "toe sucking",
    "footjob",
    "double footjob",
    "cooperative footjob",
    "implied footjob",
    "foot pussy",
    // Hand/mouth-on-body actions and the physical-interaction tags WD14 returns
    // most often on explicit reference material — same "what is the body
    // actively doing" test as the other three sets (states/appearance like
    // body fluids, arousal markers, or exposure belong in the pending-card
    // prune instead, since they're content DESCRIPTIONS, not transferable
    // reference-pose actions).
    "breast grab",
    "breast squeezing",
    "breast sucking",
    "nipple sucking",
    "licking nipples",
    "ass grab",
    "grabbing own ass",
    "grabbing another's ass",
    "hand on another's breast",
    "spanking",
    "fingering",
    "handjob",
    "paizuri",
    "thighjob",
    "armpit job",
    "deep throat",
    "irrumatio",
    "face fuck",
    "mutual masturbation",
    "girl on top",
    "boy on top",
    "doggystyle",
    "sex from behind",
    "standing sex"
  ]);
  var SCENE_TAGS = /* @__PURE__ */ new Set([
    "from front",
    "from side",
    "from above",
    "from below",
    "from behind",
    "pov",
    "close-up",
    "cowboy shot",
    "dutch angle",
    "wide shot",
    "upper body",
    "lower body",
    "full body",
    "head shot",
    "selfie",
    "mirror selfie"
  ]);
  function normalizeTag(t) {
    return String(t).toLowerCase().replace(/_/g, " ").replace(/\s+/g, " ").trim();
  }
  var POSE_FAMILIES = [
    [/standing on one leg|balancing|handstand|headstand|scorpion|chest stand|plank|superhero landing|full scorpion/, "Acrobatic"],
    [/stand/, "Standing"],
    [/wari|seiza|sitt|lap|thigh straddl|straddl|fetal|butterfly|figure four|indian style|lotus|hug own|hugging own|knees to chest|knees up|knees apart|yokozuwari|curled up/, "Sitting"],
    [/kneel|on one knee|prostration|bowing|curtsey|cower/, "Kneeling & Bowing"],
    [/lyi|on back|on stomach|on side|reclin|faceplant/, "Lying"],
    [/squat|crouch|crawl|all fours|bear position/, "Crouching & Crawling"],
    [/jump|hop|pounc|midair|falling|flying|floating|leap/, "Airborne"],
    [/run|walk|pacing|en pointe|tiptoe|step|strut/, "Walking & Stepping"],
    [/dance|yoga|stretch|split|balancing|pilates|flex/, "Stretch & Dance"],
    [/leg|foot|feet|ankle|knee|toe/, "Legs & Feet"],
    [/arched|bent|slouch|sway|twist|torso|chest stand/, "Back & Torso"],
    [/head tilt|head down|head back|looking face-?plant/, "Head & Neck"],
    [/climb|swim|dive|swing|ride|gallop|hanging|cat/, "Climbing & Sport"]
  ];
  var LIMB_FAMILIES = [
    [/arm|akimbo|elbow|airplane|w arms|x arms|t-pose|a-pose|flex|salute/, "Arms"],
    [/hand|finger|thumb|palm|fist|pinky|index|v sign|peace|ok sign|shaka|heart hands|high five|headpat|beckon|shush|clap|snap/, "Hands & Gestures"],
    [/leg|feet|foot|toe|ankle|dorsiflexion|plantar|tiptoes/, "Legs & Feet"],
    [/hold|carry|hug|piggyback|in pocket|cupping|roll/, "Holding & Carrying"],
    [/adjust/, "Adjusting"],
    [/coveri|touch|point|reach|twirl|hair flip/, "Touch & Point"]
  ];
  var SCENE_FAMILIES = [
    [/from |pov|dutch angle|selfie/, "Camera angle"],
    [/close-up|cowboy|wide shot|body|head shot/, "Framing"]
  ];
  var SEXUAL_FAMILIES = [
    [/breast|nipple|tit|paizuri|chest/, "Breasts & Chest"],
    [/penis|ball|cock|handjob|mutual masturbation|boy on top|paizuri/, "Penis"],
    [/ass|butt|anus|doggystyle|from behind|spanking|anal/, "Butt & Anal"],
    [/pussy|vagina|crot|cunni|tribadism|fingeri|girl on top/, "Vagina & Oral"],
    [/blow|oral|deep throat|irrumatio|face fuck|suck|lick|toe suck|foot job|footjob|foot worship|kissing foot|foot pussy/, "Mouth & Oral"],
    [/foot|feet|toe/, "Feet"],
    [/hand|finger/, "Hands"],
    [/sex|standing sex|straddling|thighjob|armpit/, "Positions & Grinding"]
  ];
  function groupTagsByFamily(tags, rules) {
    const groups = /* @__PURE__ */ new Map();
    for (const raw of tags) {
      const t = normalizeTag(raw);
      let family = "Other";
      for (const [re, name] of rules) {
        if (re.test(t)) {
          family = name;
          break;
        }
      }
      if (!groups.has(family)) groups.set(family, []);
      groups.get(family).push(raw);
    }
    return Array.from(groups.entries()).map(([family, list]) => ({ family, tags: list.sort((a, b) => a.localeCompare(b)) })).sort((a, b) => b.tags.length - a.tags.length);
  }
  function getWd14TransferSets() {
    return [
      { name: "Pose", desc: "Body posture/position tags \u2014 suggested destination: Pose. Suggested keyword families, not a strict taxonomy.", groups: [] },
      { name: "Limbs & Hands", desc: "Arm/hand actions and gestures \u2014 suggested destination: Limbs.", groups: [] },
      { name: "Scene (perspective/composition)", desc: "Camera-angle/composition tags \u2014 suggested destination: Scene.", groups: [] },
      { name: "Sexual", desc: "Sexual-content actions \u2014 suggested destination: Sexual.", groups: [] }
    ].map((s, i) => {
      const groups = [
        groupTagsByFamily([...POSE_TAGS], POSE_FAMILIES),
        groupTagsByFamily([...LIMB_ACTION_TAGS], LIMB_FAMILIES),
        groupTagsByFamily([...SCENE_TAGS], SCENE_FAMILIES),
        groupTagsByFamily([...SEXUAL_ACTION_TAGS], SEXUAL_FAMILIES)
      ][i];
      return { name: s.name, desc: s.desc, groups, total: groups.reduce((n, g) => n + g.tags.length, 0) };
    });
  }
  var template = null;
  var getDirHandle7 = () => null;
  var addEntryFromNewFile = async () => null;
  var refreshAllUIRef6 = () => {
  };
  var refFile = null;
  var refFilename = "";
  var refImageEl = null;
  var lastWd14TagsCsv = "";
  var previewBytes = null;
  var loraCombo = null;
  function growTextarea(el) {
    const he = el;
    he.style.height = "auto";
    he.style.height = `${he.scrollHeight}px`;
  }
  async function loadTemplate() {
    if (template) return template;
    const res = await fetch("./data/synthdat-workflow.json");
    template = await res.json();
    return template;
  }
  function setWd14ResultText(text) {
    if (!text) {
      synthDatWd14Result.style.display = "none";
      synthDatWd14Result.textContent = "";
      return;
    }
    synthDatWd14Result.style.display = "block";
    synthDatWd14Result.textContent = text;
  }
  function setGenStatus(text) {
    if (!text) {
      synthDatGenStatus.style.display = "none";
      synthDatGenStatus.textContent = "";
      return;
    }
    synthDatGenStatus.style.display = "block";
    synthDatGenStatus.textContent = text;
  }
  async function pickReferenceImage() {
    if (!window.showOpenFilePicker) {
      toast("Your browser does not support file picking here.", 4e3);
      return;
    }
    let handles;
    try {
      handles = await window.showOpenFilePicker({
        types: [{ description: "Images", accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] } }],
        multiple: false
      });
    } catch (e) {
      return;
    }
    if (!handles || !handles[0]) return;
    const file = await handles[0].getFile();
    refFile = file;
    refFilename = file.name;
    const objectUrl = URL.createObjectURL(file);
    setObjectUrlOn(synthDatRefPreview, file);
    synthDatRefPreview.style.display = "block";
    synthDatRefEmpty.style.display = "none";
    btnSynthDatInterrogate.disabled = false;
    refImageEl = new Image();
    refImageEl.onload = () => {
      updateResizedPreview();
      updateResoWarning();
    };
    refImageEl.src = synthDatRefPreview.dataset.objectUrl;
    setWd14ResultText("");
    lastWd14TagsCsv = "";
    tagAssignments = /* @__PURE__ */ new Map();
    synthDatTagAssign.innerHTML = "";
    btnSynthDatMigratePose.disabled = true;
  }
  function updateResizedPreview() {
    if (!refImageEl || !refImageEl.naturalWidth) {
      synthDatResizedPreviewWrap.style.display = "none";
      synthDatResizedPreviewLabel.style.display = "none";
      return;
    }
    const targetW = parseInt(synthDatWidth.value, 10) || 920;
    const targetH = parseInt(synthDatHeight.value, 10) || 1244;
    const fit = synthDatResizeFit.value || "pad";
    const w = refImageEl.naturalWidth, h = refImageEl.naturalHeight;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    let label;
    if (fit === "crop") {
      canvas.width = targetW;
      canvas.height = targetH;
      const scale = Math.max(targetW / w, targetH / h);
      const drawW = w * scale, drawH = h * scale;
      ctx.drawImage(refImageEl, (targetW - drawW) / 2, (targetH - drawH) / 2, drawW, drawH);
      label = `Parent image is ${w}\xD7${h}, cropped here to fill ${targetW}\xD7${targetH} \u2014 this is what ControlNet actually sees. Updates live as you change Width/Height/Fit.`;
    } else if (fit === "contain") {
      const scale = Math.min(targetW / w, targetH / h);
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      ctx.drawImage(refImageEl, 0, 0, canvas.width, canvas.height);
      label = `Parent image is ${w}\xD7${h}, contained here to ${canvas.width}\xD7${canvas.height} (fit inside ${targetW}\xD7${targetH} with no padding) \u2014 this is what ControlNet actually sees. Updates live as you change Width/Height/Fit.`;
    } else {
      canvas.width = targetW;
      canvas.height = targetH;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, targetW, targetH);
      const scale = Math.min(targetW / w, targetH / h);
      const drawW = w * scale, drawH = h * scale;
      ctx.drawImage(refImageEl, (targetW - drawW) / 2, (targetH - drawH) / 2, drawW, drawH);
      label = `Parent image is ${w}\xD7${h}, padded here to ${targetW}\xD7${targetH} \u2014 this is what ControlNet actually sees. Updates live as you change Width/Height/Fit.`;
    }
    synthDatResizedPreview.src = canvas.toDataURL("image/png");
    synthDatResizedPreviewWrap.style.display = "block";
    synthDatResizedPreviewLabel.textContent = label;
    synthDatResizedPreviewLabel.style.display = "block";
  }
  function updateResoWarning() {
    if (!refImageEl || !refImageEl.naturalWidth) {
      synthDatResoWarning.style.display = "none";
      return;
    }
    const targetW = parseInt(synthDatWidth.value, 10) || 0;
    const targetH = parseInt(synthDatHeight.value, 10) || 0;
    const refPortrait = refImageEl.naturalHeight > refImageEl.naturalWidth;
    const targetPortrait = targetH > targetW;
    if (refPortrait !== targetPortrait) {
      synthDatResoWarning.textContent = `\u26A0 Reference image is ${refPortrait ? "portrait" : "landscape"} (${refImageEl.naturalWidth}\xD7${refImageEl.naturalHeight}) but your generation resolution is ${targetPortrait ? "portrait" : "landscape"} (${targetW}\xD7${targetH}) \u2014 consider swapping Width/Height.`;
      synthDatResoWarning.style.display = "block";
    } else {
      synthDatResoWarning.style.display = "none";
    }
  }
  function applySkipRefImageUI() {
    synthDatRefImageSection.classList.toggle("synthdat-section-disabled", synthDatSkipRefImage.checked);
  }
  function applyUnifiedPromptModeUI() {
    const unified = synthDatUnifiedPromptMode.checked;
    synthDatUnifiedPromptRow.style.display = unified ? "" : "none";
    synthDatSplitFieldsGroup.style.display = unified ? "none" : "";
    synthDatStripHairFaceRow.style.display = unified ? "none" : "";
  }
  function onDocClickOutsidePromptPanel(ev) {
    const target = ev.target;
    if (synthDatPromptFieldsDock.contains(target) || btnSynthDatPromptPanelToggle.contains(target)) return;
    closeSynthDatPromptPanel();
  }
  function openSynthDatPromptPanel() {
    synthDatPromptFieldsDock.style.display = "block";
    btnSynthDatPromptPanelToggle.style.display = "none";
    synthDatPromptFieldsDock.querySelectorAll("textarea").forEach((el) => growTextarea(el));
    setTimeout(() => document.addEventListener("mousedown", onDocClickOutsidePromptPanel), 0);
  }
  function closeSynthDatPromptPanel() {
    synthDatPromptFieldsDock.style.display = "none";
    btnSynthDatPromptPanelToggle.style.display = "";
    document.removeEventListener("mousedown", onDocClickOutsidePromptPanel);
  }
  async function interrogateReference() {
    if (!refFile) return;
    setWd14ResultText("Interrogating\u2026");
    const settings2 = getWd14Settings();
    if (!settings2.model) {
      setWd14ResultText("No WD14 model configured \u2014 set one up in Tag Overseer's WD14 Autotagger section first.");
      return;
    }
    const bytes = new Uint8Array(await refFile.arrayBuffer());
    const res = await window.electronAPI.wd14TagImage({ host: getHost(), filename: refFilename, imageBytes: bytes, settings: settings2 });
    if (!res.ok) {
      setWd14ResultText(res.error || "WD14 interrogation failed.");
      return;
    }
    const tagsCsv = res.tagsCsv || "";
    lastWd14TagsCsv = tagsCsv;
    setWd14ResultText(parseWd14Tags(tagsCsv).join(", ") || "(no tags returned)");
    renderTagAssignPicker(parseWd14Tags(tagsCsv));
  }
  async function reinterrogateOutput() {
    if (!previewBytes || !pendingTagSnapshot) return;
    synthDatReinterrogateResult.style.display = "block";
    synthDatReinterrogateResult.textContent = "Interrogating output\u2026";
    const settings2 = getWd14Settings();
    if (!settings2.model) {
      synthDatReinterrogateResult.textContent = "No WD14 model configured \u2014 set one up in Tag Overseer's WD14 Autotagger section first.";
      return;
    }
    const res = await window.electronAPI.wd14TagImage({ host: getHost(), filename: pendingImgName || "output.png", imageBytes: previewBytes, settings: settings2 });
    if (!res.ok) {
      synthDatReinterrogateResult.textContent = res.error || "WD14 interrogation failed.";
      return;
    }
    const outputTags = parseWd14Tags(res.tagsCsv || "");
    if (synthDatReinterrogateOverwrite.checked) {
      pendingTagSnapshot = outputTags;
      excludedTags = /* @__PURE__ */ new Set();
      mergedTagOverrides = /* @__PURE__ */ new Map();
      markedVoidTags = /* @__PURE__ */ new Set();
      renderTagCard();
      synthDatReinterrogateResult.textContent = `Replaced the list with ${outputTags.length} tag(s) from WD14: ${outputTags.join(", ")}`;
      return;
    }
    const existingNormalized = new Set(pendingTagSnapshot.map(normalizeTag));
    const newTags = [];
    for (const tag of outputTags) {
      const norm = normalizeTag(tag);
      if (existingNormalized.has(norm)) continue;
      existingNormalized.add(norm);
      newTags.push(tag);
    }
    if (newTags.length === 0) {
      synthDatReinterrogateResult.textContent = "No new tags \u2014 WD14 didn't catch anything the list below is missing.";
      return;
    }
    pendingTagSnapshot = pendingTagSnapshot.concat(newTags);
    renderTagCard();
    synthDatReinterrogateResult.textContent = `Added ${newTags.length} tag(s) WD14 caught in the output: ${newTags.join(", ")}`;
  }
  var tagAssignments = /* @__PURE__ */ new Map();
  function suggestDestination(tag) {
    const norm = normalizeTag(tag);
    if (POSE_TAGS.has(norm)) return "pose";
    if (LIMB_ACTION_TAGS.has(norm)) return "limbs";
    if (SEXUAL_ACTION_TAGS.has(norm)) return "sexual";
    if (SCENE_TAGS.has(norm)) return "scene";
    return null;
  }
  function renderTagAssignPicker(tags) {
    tagAssignments = /* @__PURE__ */ new Map();
    synthDatTagAssign.innerHTML = "";
    const relevant = tags.filter((t) => suggestDestination(t) !== null);
    if (relevant.length === 0) {
      const empty = document.createElement("div");
      empty.className = "stats-empty";
      empty.textContent = "No pose/gesture/perspective tags found in this result.";
      synthDatTagAssign.appendChild(empty);
      btnSynthDatMigratePose.disabled = true;
      return;
    }
    const DESTS = [["pose", "Pose"], ["limbs", "Limbs"], ["scene", "Scene"], ["sexual", "Sexual"], [null, "Skip"]];
    for (const tag of relevant) {
      tagAssignments.set(tag, suggestDestination(tag));
      const row = document.createElement("div");
      row.className = "synthdat-tag-assign-row";
      const label = document.createElement("span");
      label.className = "synthdat-tag-assign-label";
      label.textContent = tag;
      row.appendChild(label);
      const btnGroup = document.createElement("div");
      btnGroup.className = "synthdat-tag-assign-btns";
      for (const [dest, label2] of DESTS) {
        const btn = document.createElement("button");
        btn.textContent = label2;
        btn.className = "synthdat-tag-assign-btn" + (tagAssignments.get(tag) === dest ? " active" : "");
        btn.addEventListener("click", () => {
          tagAssignments.set(tag, dest);
          btnGroup.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
        });
        btnGroup.appendChild(btn);
      }
      row.appendChild(btnGroup);
      synthDatTagAssign.appendChild(row);
    }
    btnSynthDatMigratePose.disabled = false;
  }
  function applyTagAssignment() {
    if (tagAssignments.size === 0) {
      toast("Interrogate a reference image first.");
      return;
    }
    const byDest = { pose: [], limbs: [], scene: [], sexual: [] };
    for (const [tag, dest] of tagAssignments) {
      if (dest && byDest[dest]) byDest[dest].push(tag);
    }
    const fieldByDest = { pose: synthDatPose, limbs: synthDatLimbs, scene: synthDatScene, sexual: synthDatSexual };
    const clearFirst = synthDatMigrateClearFirst.checked;
    if (clearFirst) {
      for (const field of Object.values(fieldByDest)) {
        field.value = "";
        growTextarea(field);
      }
    }
    let total = 0;
    for (const dest of Object.keys(byDest)) {
      if (byDest[dest].length === 0) continue;
      const field = fieldByDest[dest];
      const existing = clearFirst ? [] : field.value.split(",").map((t) => t.trim()).filter(Boolean);
      field.value = Array.from(/* @__PURE__ */ new Set([...existing, ...byDest[dest]])).join(", ");
      growTextarea(field);
      total += byDest[dest].length;
    }
    if (total === 0) {
      toast("Nothing assigned \u2014 every tag is set to Skip.");
      return;
    }
    toast(`Applied ${total} tag(s): ${byDest.pose.length} to Pose, ${byDest.limbs.length} to Limbs, ${byDest.scene.length} to Scene, ${byDest.sexual.length} to Sexual.`);
    scheduleSave();
  }
  async function fetchComboValues(classType, inputName) {
    const res = await window.electronAPI.synthdatGetObjectInfo({ host: getHost(), classType, inputName });
    if (!res.ok) {
      toast(res.error || `Could not load ${classType}'s ${inputName} list from ComfyUI.`, 3600);
      return null;
    }
    return res.values || [];
  }
  function fillDatalist(datalistEl, values) {
    datalistEl.innerHTML = "";
    for (const v of values) {
      const opt = document.createElement("option");
      opt.value = v;
      datalistEl.appendChild(opt);
    }
  }
  var loraRows = [];
  function addLoraRow(defaultLora, defaultStrength) {
    const row = document.createElement("div");
    row.className = "synthdat-lora-row";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Start typing to search\u2026";
    input.value = defaultLora || "";
    attachListAutocomplete(input, () => loraCombo || []);
    const strength = document.createElement("input");
    strength.type = "number";
    strength.step = "0.05";
    strength.value = String(defaultStrength != null ? defaultStrength : 1);
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "\xD7";
    removeBtn.title = "Remove this LoRA slot";
    removeBtn.addEventListener("click", () => {
      loraRows = loraRows.filter((r) => r.row !== row);
      row.remove();
      scheduleSave();
    });
    input.addEventListener("change", scheduleSave);
    strength.addEventListener("change", scheduleSave);
    row.appendChild(input);
    row.appendChild(strength);
    row.appendChild(removeBtn);
    synthDatLoraStackRows.appendChild(row);
    loraRows.push({ row, input, strength });
  }
  async function testSynthdatConnection() {
    synthDatConnStatus.style.display = "block";
    synthDatConnStatus.style.color = "";
    synthDatConnStatus.textContent = "Connecting\u2026";
    const res = await window.electronAPI.synthdatGetObjectInfo({ host: getHost(), classType: "UNETLoader", inputName: "unet_name" });
    if (res.ok) {
      synthDatConnStatus.style.color = "var(--accent-ok, #3a9)";
      synthDatConnStatus.textContent = `\u2713 Connected to ${getHost()}`;
    } else {
      synthDatConnStatus.style.color = "";
      synthDatConnStatus.textContent = res.error || "Could not connect.";
    }
  }
  async function refreshModelLists() {
    const [unetValues, clipValues, vaeValues, mainLoraValues, loraValues] = await Promise.all([
      fetchComboValues("UNETLoader", "unet_name"),
      fetchComboValues("CLIPLoader", "clip_name"),
      fetchComboValues("VAELoader", "vae_name"),
      fetchComboValues("DSM Lora Name", "lora_name"),
      fetchComboValues("DSM Lora Loader Stack", "lora_01")
    ]);
    if (unetValues) fillDatalist(synthDatUnetDatalist, unetValues);
    if (clipValues) fillDatalist(synthDatClipDatalist, clipValues);
    if (vaeValues) fillDatalist(synthDatVaeDatalist, vaeValues);
    if (mainLoraValues) fillDatalist(synthDatMainLoraDatalist, mainLoraValues);
    if (loraValues) {
      loraCombo = loraValues;
      fillDatalist(synthDatLoraDatalist, loraValues);
    }
  }
  function fieldValue(el) {
    return (el.value || "").trim();
  }
  function buildPositiveTagList() {
    const unified = synthDatUnifiedPromptMode.checked;
    const character = [unified ? fieldValue(synthDatUnifiedPrompt) : fieldValue(synthDatCharacter), fieldValue(synthDatCharacterTrigger)].filter(Boolean).join(", ");
    const stripHairFace = !unified && synthDatStripHairFace.checked;
    const parts = unified ? [fieldValue(synthDatGlobal), character] : [
      fieldValue(synthDatGlobal),
      fieldValue(synthDatRating),
      character,
      stripHairFace ? "" : fieldValue(synthDatHair),
      stripHairFace ? "" : fieldValue(synthDatFace),
      fieldValue(synthDatChest),
      fieldValue(synthDatBody),
      fieldValue(synthDatClothes),
      fieldValue(synthDatLimbs),
      fieldValue(synthDatSexual),
      fieldValue(synthDatPose),
      fieldValue(synthDatExtra),
      fieldValue(synthDatEffects),
      fieldValue(synthDatScene)
    ];
    return parts.filter(Boolean);
  }
  function baseTagList() {
    const tags = buildPositiveTagList().flatMap((part) => part.split(",").map((t) => t.trim())).filter(Boolean);
    return Array.from(new Set(tags.map((t) => t.replace(/_/g, " ").replace(/\s+/g, " ").trim())));
  }
  function buildMergeHistoryMap() {
    const map = /* @__PURE__ */ new Map();
    for (const rule of canonicalRules) {
      if (!rule.canonical) continue;
      for (const child of rule.children || []) {
        if (normalizeTag(child) !== normalizeTag(rule.canonical)) map.set(normalizeTag(child), rule.canonical);
      }
    }
    return map;
  }
  var excludedTags = /* @__PURE__ */ new Set();
  var mergedTagOverrides = /* @__PURE__ */ new Map();
  var markedVoidTags = /* @__PURE__ */ new Set();
  var pendingTagSnapshot = null;
  var pendingTagMenuEl = null;
  function closePendingTagMenu() {
    if (pendingTagMenuEl) {
      pendingTagMenuEl.remove();
      pendingTagMenuEl = null;
    }
    document.removeEventListener("click", onDocClickClosePendingTagMenu);
  }
  function onDocClickClosePendingTagMenu(ev) {
    if (!pendingTagMenuEl) return;
    const path = typeof ev.composedPath === "function" ? ev.composedPath() : [];
    if (path.includes(pendingTagMenuEl)) return;
    closePendingTagMenu();
  }
  function openPendingTagMenu(tag, x, y) {
    closePendingTagMenu();
    const menu = document.createElement("div");
    menu.className = "ctx-menu";
    const header = document.createElement("div");
    header.className = "ctx-header";
    header.textContent = tag;
    menu.appendChild(header);
    const defBtn = document.createElement("button");
    defBtn.className = "ctx-item";
    defBtn.textContent = "\u{1F4D6} Definition";
    defBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      closePendingTagMenu();
      openTagDetails(tag);
    });
    menu.appendChild(defBtn);
    const isVoid = markedVoidTags.has(tag);
    const voidBtn = document.createElement("button");
    voidBtn.className = "ctx-item";
    voidBtn.textContent = isVoid ? "\u21A9\uFE0F Unmark void" : "\u{1F6AB} Mark as void";
    voidBtn.title = isVoid ? "Stop treating this tag as a void rule candidate." : "Drop this tag from what gets saved, and add a Retroactive Void rule for it on Accept \u2014 so it's auto-stripped from future images too, not just this one.";
    voidBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (isVoid) markedVoidTags.delete(tag);
      else markedVoidTags.add(tag);
      closePendingTagMenu();
      renderTagCard();
    });
    menu.appendChild(voidBtn);
    document.body.appendChild(menu);
    pendingTagMenuEl = menu;
    positionMenu(menu, x, y);
    setTimeout(() => document.addEventListener("click", onDocClickClosePendingTagMenu), 0);
  }
  function renderTagCard() {
    closePendingTagMenu();
    synthDatTagPreview.innerHTML = "";
    const tags = pendingTagSnapshot || [];
    if (tags.length === 0) {
      const empty = document.createElement("div");
      empty.className = "stats-empty";
      empty.textContent = "(nothing to save yet)";
      synthDatTagPreview.appendChild(empty);
      return;
    }
    const mergeHistory = buildMergeHistoryMap();
    const voidSet = activeVoidTagSet();
    const row = document.createElement("div");
    row.className = "chiprow";
    for (const tag of tags) {
      const displayTag = mergedTagOverrides.get(tag) || tag;
      const excluded = excludedTags.has(tag);
      const willVoid = markedVoidTags.has(tag) || voidSet.has(displayTag);
      const chip = document.createElement("span");
      chip.className = "chip" + (excluded ? " synthdat-chip-excluded" : "") + (willVoid ? " synthdat-chip-void" : "");
      const label = document.createElement("span");
      label.textContent = displayTag;
      label.title = willVoid ? markedVoidTags.has(tag) ? "Marked as void \u2014 will be dropped and added as a Void rule on Accept." : "Already covered by an existing Void rule \u2014 will be dropped automatically once added to the Gallery." : "Right-click for definition / mark as void";
      label.style.cursor = "pointer";
      label.addEventListener("contextmenu", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        openPendingTagMenu(tag, ev.clientX, ev.clientY);
      });
      chip.appendChild(label);
      if (!excluded && displayTag === tag) {
        const suggestion = mergeHistory.get(normalizeTag(tag));
        if (suggestion && normalizeTag(suggestion) !== normalizeTag(tag)) {
          const mergeBtn = document.createElement("button");
          mergeBtn.className = "synthdat-merge-suggest";
          mergeBtn.textContent = `\u2192 ${suggestion}`;
          mergeBtn.title = `This dataset previously merged "${tag}" into "${suggestion}" elsewhere \u2014 click to do the same here.`;
          mergeBtn.addEventListener("click", () => {
            mergedTagOverrides.set(tag, suggestion);
            renderTagCard();
          });
          chip.appendChild(mergeBtn);
        }
      }
      const toggleBtn = document.createElement("button");
      toggleBtn.textContent = excluded ? "+" : "\xD7";
      toggleBtn.title = excluded ? "Restore this tag" : "Drop this tag from what gets saved";
      toggleBtn.addEventListener("click", () => {
        if (excluded) excludedTags.delete(tag);
        else excludedTags.add(tag);
        renderTagCard();
      });
      chip.appendChild(toggleBtn);
      row.appendChild(chip);
    }
    synthDatTagPreview.appendChild(row);
  }
  function finalTagList() {
    const voidSet = activeVoidTagSet();
    const tags = (pendingTagSnapshot || []).filter((t) => !excludedTags.has(t) && !markedVoidTags.has(t)).map((t) => mergedTagOverrides.get(t) || t).filter((t) => !voidSet.has(t));
    return Array.from(new Set(tags));
  }
  function buildPromptFromFields() {
    const prompt = JSON.parse(JSON.stringify(template));
    const unified = synthDatUnifiedPromptMode.checked;
    const character = [unified ? fieldValue(synthDatUnifiedPrompt) : fieldValue(synthDatCharacter), fieldValue(synthDatCharacterTrigger)].filter(Boolean).join(", ");
    prompt["21"].inputs.value = fieldValue(synthDatGlobal);
    prompt["8"].inputs.value = unified ? "" : fieldValue(synthDatRating);
    prompt["19"].inputs.value = "";
    prompt["11"].inputs.value = character;
    prompt["12"].inputs.value = unified ? "" : fieldValue(synthDatHair);
    prompt["15"].inputs.value = unified ? "" : fieldValue(synthDatFace);
    prompt["18"].inputs.value = unified ? "" : fieldValue(synthDatChest);
    prompt["9"].inputs.value = unified ? "" : fieldValue(synthDatBody);
    prompt["6"].inputs.value = unified ? "" : fieldValue(synthDatClothes);
    prompt["20"].inputs.value = unified ? "" : fieldValue(synthDatLimbs);
    prompt["14"].inputs.value = unified ? "" : fieldValue(synthDatSexual);
    prompt["7"].inputs.value = unified ? "" : fieldValue(synthDatPose);
    prompt["10"].inputs.value = unified ? "" : fieldValue(synthDatExtra);
    prompt["13"].inputs.value = unified ? "" : fieldValue(synthDatEffects);
    prompt["17"].inputs.value = unified ? "" : fieldValue(synthDatScene);
    prompt["16"].inputs.text = fieldValue(synthDatNegative);
    prompt["41"].inputs.unet_name = synthDatDiffModel.value;
    prompt["51"].inputs.lora_name = synthDatMainLora.value.trim() || "None";
    if (synthDatClip.value) {
      prompt["249"].inputs.clip_name = synthDatClip.value;
      prompt["47:45"].inputs.clip_name = synthDatClip.value;
    }
    if (synthDatVae.value) prompt["47:46"].inputs.vae_name = synthDatVae.value;
    const chunks = [];
    for (let i = 0; i < loraRows.length; i += 4) chunks.push(loraRows.slice(i, i + 4));
    function fillStackInputs(inputs, chunk) {
      for (let i = 0; i < 4; i++) {
        const slot = String(i + 1).padStart(2, "0");
        const r = chunk[i];
        inputs[`lora_${slot}`] = r ? r.input.value.trim() || "None" : "None";
        inputs[`strength_${slot}`] = r ? parseFloat(r.strength.value) || 0 : 0;
      }
    }
    let lastStackId = "237";
    fillStackInputs(prompt["237"].inputs, chunks[0] || []);
    for (let c = 1; c < chunks.length; c++) {
      const newId = `237_extra_${c}`;
      const newInputs = { model: [lastStackId, 0], clip: ["47:45", 0] };
      fillStackInputs(newInputs, chunks[c]);
      prompt[newId] = { class_type: "DSM Lora Loader Stack", inputs: newInputs, _meta: { title: "DSM Lora Loader Stack" } };
      lastStackId = newId;
    }
    if (lastStackId !== "237") {
      prompt["243"].inputs.input1 = [lastStackId, 0];
      prompt["240"].inputs.model = [lastStackId, 0];
      prompt["195"].inputs.model = [lastStackId, 0];
    }
    if (synthDatSkipRefImage.checked) {
      delete prompt["239"];
      delete prompt["240"];
      delete prompt["243"];
      delete prompt["238"];
      delete prompt["246"];
      prompt["158:53"].inputs.model = [lastStackId, 0];
      prompt["158:54"].inputs.model = [lastStackId, 0];
    } else {
      prompt["240"].inputs.strength = parseFloat(synthDatLLLiteStrength.value) || 0;
      prompt["240"].inputs.start_percent = parseFloat(synthDatLLLiteStartPercent.value) || 0;
      prompt["240"].inputs.end_percent = parseFloat(synthDatLLLiteEndPercent.value) || 0;
      prompt["240"].inputs.preserve_wrapper = synthDatLLLitePreserveWrapper.checked;
      prompt["243"].inputs.select = 2;
      prompt["238"].inputs.fit = synthDatResizeFit.value;
      prompt["238"].inputs.method = synthDatResizeMethod.value;
      prompt["240"].inputs.image = ["238", 0];
    }
    prompt["168:167"].inputs.sampler_name = synthDatSampler.value;
    prompt["158:53"].inputs.scheduler = synthDatScheduler.value;
    prompt["158:53"].inputs.steps = parseInt(synthDatSteps1.value, 10) || 1;
    prompt["158:54"].inputs.cfg = parseFloat(synthDatCfg1.value) || 1;
    prompt["174:171"].inputs.value = parseInt(synthDatWidth.value, 10) || 920;
    prompt["174:172"].inputs.value = parseInt(synthDatHeight.value, 10) || 1244;
    prompt["165"].inputs.noise_seed = parseInt(synthDatSeed1.value, 10) || 0;
    if (synthDatUse2Pass.checked) {
      prompt["227"].inputs.noise_seed = parseInt(synthDatSeed2.value, 10) || 0;
      prompt["195"].inputs.denoise = parseFloat(synthDatDenoise2.value) || 0;
      prompt["195"].inputs.scheduler = synthDatScheduler.value;
      prompt["195"].inputs.steps = parseInt(synthDatSteps2.value, 10) || 1;
      prompt["192_pass1"] = { class_type: "SaveImage", inputs: { filename_prefix: prompt["192"].inputs.filename_prefix, images: ["176", 0] }, _meta: { title: "Pass 1 preview" } };
    } else {
      delete prompt["190"];
      delete prompt["191"];
      delete prompt["195"];
      delete prompt["227"];
      delete prompt["224"];
      prompt["192"].inputs.images = ["176", 0];
    }
    return prompt;
  }
  var pendingBase = "";
  var pendingImgName = "";
  var pass1Bytes = null;
  var pass2Bytes = null;
  function selectPass(which) {
    const bytes = which === 1 ? pass1Bytes : pass2Bytes;
    if (!bytes) return;
    previewBytes = bytes;
    setObjectUrlOn(synthDatPreview, new Blob([bytes], { type: "image/png" }));
    synthDatPickPass1.classList.toggle("active", which === 1);
    synthDatPickPass2.classList.toggle("active", which === 2);
  }
  function setObjectUrlOn(el, blob) {
    const prev = el.dataset.objectUrl;
    if (prev) URL.revokeObjectURL(prev);
    const url = URL.createObjectURL(blob);
    el.dataset.objectUrl = url;
    el.src = url;
  }
  function clearObjectUrlOn(el) {
    const prev = el.dataset.objectUrl;
    if (prev) {
      URL.revokeObjectURL(prev);
      el.removeAttribute("data-object-url");
      el.removeAttribute("src");
    }
  }
  async function generate() {
    const skipRefImage = synthDatSkipRefImage.checked;
    if (!skipRefImage && !refFile) {
      toast(`Pick a reference image first (or check "I don't want to use a reference image").`);
      return;
    }
    const dirHandle = getDirHandle7();
    if (!dirHandle) {
      toast("Open a dataset folder first.");
      return;
    }
    await autoRejectPendingIfAny();
    await loadTemplate();
    const host = getHost();
    const prompt = buildPromptFromFields();
    const bytes = skipRefImage ? null : new Uint8Array(await refFile.arrayBuffer());
    const tagSnapshot = baseTagList();
    btnSynthDatGenerate.disabled = true;
    btnSynthDatStop.disabled = false;
    btnSynthDatAccept.disabled = true;
    btnSynthDatReject.disabled = true;
    btnSynthDatReinterrogateOutput.disabled = true;
    synthDatReinterrogateResult.style.display = "none";
    clearObjectUrlOn(synthDatLivePreview);
    synthDatLivePreviewWrap.style.display = "none";
    pendingTagSnapshot = null;
    excludedTags = /* @__PURE__ */ new Set();
    mergedTagOverrides = /* @__PURE__ */ new Map();
    markedVoidTags = /* @__PURE__ */ new Set();
    renderTagCard();
    setGenStatus("Generating\u2026 this can take a while.");
    const res = await window.electronAPI.synthdatQueueAndFetch({
      host,
      imageFilename: skipRefImage ? null : refFilename,
      imageBytes: bytes,
      prompt
    });
    btnSynthDatGenerate.disabled = false;
    btnSynthDatStop.disabled = true;
    synthDatLivePreviewWrap.style.display = "none";
    if (!res.ok) {
      if (res.interrupted) toast("Generation stopped.");
      setGenStatus(res.interrupted ? "" : res.error || "Generation failed.");
      return;
    }
    setGenStatus("");
    previewBytes = res.imageBytes || null;
    pendingBase = `synth_${Date.now().toString(36)}`;
    pendingImgName = `${pendingBase}.png`;
    pendingTagSnapshot = tagSnapshot;
    renderTagCard();
    pass2Bytes = res.imageBytes || null;
    pass1Bytes = res.pass1ImageBytes || null;
    if (pass1Bytes) {
      setObjectUrlOn(synthDatPass1Thumb, new Blob([pass1Bytes], { type: "image/png" }));
      setObjectUrlOn(synthDatPass2Thumb, new Blob([pass2Bytes], { type: "image/png" }));
      synthDatPassPickerRow.style.display = "flex";
      synthDatPickPass1.classList.remove("active");
      synthDatPickPass2.classList.add("active");
    } else {
      synthDatPassPickerRow.style.display = "none";
    }
    setObjectUrlOn(synthDatPreview, new Blob([previewBytes], { type: "image/png" }));
    synthDatPreview.style.display = "block";
    synthDatPreviewEmpty.style.display = "none";
    btnSynthDatAccept.disabled = false;
    btnSynthDatReject.disabled = false;
    btnSynthDatReinterrogateOutput.disabled = false;
  }
  async function computeNextSequentialBase(dirHandle) {
    let maxNum = 0;
    let width = 1;
    for await (const h of dirHandle.values()) {
      if (h.kind !== "file") continue;
      const dot = h.name.lastIndexOf(".");
      const base = dot === -1 ? h.name : h.name.slice(0, dot);
      if (!/^\d+$/.test(base)) continue;
      const n = parseInt(base, 10);
      if (n >= maxNum) {
        maxNum = n;
        width = Math.max(width, base.length);
      }
    }
    return { next: maxNum + 1, width: Math.max(width, String(maxNum + 1).length) };
  }
  async function writeImageEntry(bytes, base, imgName, tags, disable) {
    const dirHandle = getDirHandle7();
    if (!dirHandle) return null;
    try {
      if (disable) {
        const imgHandle2 = await dirHandle.getFileHandle(imgName, { create: true });
        const imgWritable2 = await imgHandle2.createWritable();
        await imgWritable2.write(bytes);
        await imgWritable2.close();
        const txtHandle2 = await dirHandle.getFileHandle(`${base}.txt`, { create: true });
        const txtWritable2 = await txtHandle2.createWritable();
        await txtWritable2.write(tags.map((t) => t.replace(/ /g, "_")).join(", "));
        await txtWritable2.close();
        const entry2 = await addEntryFromNewFile(base, imgHandle2, imgName, txtHandle2, true, tags, false);
        if (entry2) await moveEntry(entry2, true);
        return entry2;
      }
      const imgHandle = await dirHandle.getFileHandle(imgName, { create: true });
      const imgWritable = await imgHandle.createWritable();
      await imgWritable.write(bytes);
      await imgWritable.close();
      const txtHandle = await dirHandle.getFileHandle(`${base}.txt`, { create: true });
      const txtWritable = await txtHandle.createWritable();
      await txtWritable.write(tags.map((t) => t.replace(/ /g, "_")).join(", "));
      await txtWritable.close();
      const entry = await addEntryFromNewFile(base, imgHandle, imgName, txtHandle, true, tags, false);
      if (entry) markDirty(entry);
      return entry;
    } catch (err) {
      toast(`Could not save an image: ${err?.message || err}`, 4200);
      return null;
    }
  }
  function otherPassBytes() {
    if (!pass1Bytes) return null;
    return previewBytes === pass1Bytes ? pass2Bytes : pass1Bytes;
  }
  async function acceptImage() {
    const dirHandle = getDirHandle7();
    if (!dirHandle) {
      toast("Open a dataset folder first.");
      return;
    }
    if (!previewBytes) {
      toast("Nothing to accept or reject yet.");
      return;
    }
    const tags = finalTagList();
    if (markedVoidTags.size > 0) registerVoidRule(Array.from(markedVoidTags));
    let base = pendingBase, imgName = pendingImgName;
    if (synthDatRenameOnAccept.checked) {
      const { next, width } = await computeNextSequentialBase(dirHandle);
      base = String(next).padStart(width, "0");
      imgName = `${base}.png`;
    }
    const entry = await writeImageEntry(previewBytes, base, imgName, tags, false);
    if (!entry) return;
    const alt = otherPassBytes();
    if (alt) await writeImageEntry(alt, `${pendingBase}_altpass`, `${pendingBase}_altpass.png`, tags, true);
    toast(alt ? "Added to the dataset \u2014 the other pass was rejected into Disabled/." : "Added to the dataset.");
    refreshAllUIRef6();
    clearPreview();
  }
  async function rejectImage() {
    const dirHandle = getDirHandle7();
    if (!dirHandle) {
      toast("Open a dataset folder first.");
      return;
    }
    if (!previewBytes) {
      toast("Nothing to accept or reject yet.");
      return;
    }
    const tags = finalTagList();
    const entry = await writeImageEntry(previewBytes, pendingBase, pendingImgName, tags, true);
    if (!entry) return;
    const alt = otherPassBytes();
    if (alt) await writeImageEntry(alt, `${pendingBase}_altpass`, `${pendingBase}_altpass.png`, tags, true);
    toast("Rejected into Disabled/.");
    refreshAllUIRef6();
    clearPreview();
  }
  async function autoRejectPendingIfAny() {
    if (!previewBytes) return;
    const dirHandle = getDirHandle7();
    if (!dirHandle) return;
    const tags = pendingTagSnapshot || [];
    await writeImageEntry(previewBytes, pendingBase, pendingImgName, tags, true);
    const alt = otherPassBytes();
    if (alt) await writeImageEntry(alt, `${pendingBase}_altpass`, `${pendingBase}_altpass.png`, tags, true);
    toast("Previous generation wasn't Accepted/Rejected \u2014 auto-rejected into Disabled/.");
    refreshAllUIRef6();
    clearPreview();
  }
  function clearPreview() {
    previewBytes = null;
    pendingBase = "";
    pendingImgName = "";
    clearObjectUrlOn(synthDatPreview);
    clearObjectUrlOn(synthDatPass1Thumb);
    clearObjectUrlOn(synthDatPass2Thumb);
    synthDatPreview.style.display = "none";
    synthDatPreviewEmpty.style.display = "block";
    synthDatPassPickerRow.style.display = "none";
    pass1Bytes = null;
    pass2Bytes = null;
    btnSynthDatAccept.disabled = true;
    btnSynthDatReject.disabled = true;
    btnSynthDatReinterrogateOutput.disabled = true;
    synthDatReinterrogateResult.style.display = "none";
    pendingTagSnapshot = null;
    excludedTags = /* @__PURE__ */ new Set();
    mergedTagOverrides = /* @__PURE__ */ new Map();
    markedVoidTags = /* @__PURE__ */ new Set();
    renderTagCard();
  }
  var SAMPLERS = [
    "res_multistep",
    "sa_solver_pece",
    "euler",
    "euler_ancestral",
    "dpmpp_2m",
    "dpmpp_2m_sde",
    "dpmpp_3m_sde",
    "dpmpp_sde",
    "dpmpp_2s_ancestral",
    "ddim",
    "uni_pc",
    "lcm",
    "deis"
  ];
  var SCHEDULERS = ["beta", "normal", "karras", "exponential", "sgm_uniform", "simple", "ddim_uniform", "linear_quadratic"];
  function fillStaticOptions(selectEl, values, def) {
    selectEl.innerHTML = "";
    for (const v of values) {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      selectEl.appendChild(opt);
    }
    if (def) selectEl.value = def;
  }
  function clickToZoom(wrap, img) {
    wrap.addEventListener("click", () => {
      if (img.naturalWidth > 0) showImageLightbox(img.src);
    });
  }
  function initSynthDatOverseer(deps) {
    getDirHandle7 = deps.getDirHandle;
    addEntryFromNewFile = deps.addEntryFromNewFile;
    refreshAllUIRef6 = deps.refreshAllUI;
    loadTemplate();
    fillStaticOptions(synthDatSampler, SAMPLERS, "res_multistep");
    fillStaticOptions(synthDatScheduler, SCHEDULERS, "beta");
    const promptFields = [
      synthDatUnifiedPrompt,
      synthDatGlobal,
      synthDatCharacter,
      synthDatCharacterTrigger,
      synthDatRating,
      synthDatHair,
      synthDatFace,
      synthDatChest,
      synthDatBody,
      synthDatClothes,
      synthDatLimbs,
      synthDatSexual,
      synthDatPose,
      synthDatScene,
      synthDatEffects,
      synthDatExtra
    ];
    promptFields.forEach((el) => el.addEventListener("input", () => {
      growTextarea(el);
      scheduleSave();
    }));
    synthDatNegative.addEventListener("input", () => {
      growTextarea(synthDatNegative);
      scheduleSave();
    });
    synthDatStripHairFace.addEventListener("change", () => {
      scheduleSave();
    });
    synthDatUnifiedPromptMode.addEventListener("change", () => {
      applyUnifiedPromptModeUI();
      scheduleSave();
    });
    applyUnifiedPromptModeUI();
    btnSynthDatPromptPanelToggle.addEventListener("click", openSynthDatPromptPanel);
    btnSynthDatPromptPanelClose.addEventListener("click", closeSynthDatPromptPanel);
    [
      synthDatHost,
      synthDatDiffModel,
      synthDatClip,
      synthDatVae,
      synthDatMainLora,
      synthDatLLLiteStrength,
      synthDatLLLiteStartPercent,
      synthDatLLLiteEndPercent,
      synthDatLLLitePreserveWrapper,
      synthDatResizeMethod,
      synthDatSampler,
      synthDatScheduler,
      synthDatSteps1,
      synthDatCfg1,
      synthDatSteps2,
      synthDatUse2Pass,
      synthDatSeed1,
      synthDatSeed2,
      synthDatDenoise2
    ].forEach((el) => el.addEventListener("change", scheduleSave));
    synthDatResizeFit.addEventListener("change", () => {
      updateResizedPreview();
      scheduleSave();
    });
    synthDatSkipRefImage.addEventListener("change", () => {
      applySkipRefImageUI();
      scheduleSave();
    });
    applySkipRefImageUI();
    synthDatWidth.addEventListener("input", () => {
      updateResizedPreview();
      updateResoWarning();
      scheduleSave();
    });
    synthDatHeight.addEventListener("input", () => {
      updateResizedPreview();
      updateResoWarning();
      scheduleSave();
    });
    btnSynthDatSwapReso.addEventListener("click", () => {
      const w = synthDatWidth.value;
      synthDatWidth.value = synthDatHeight.value;
      synthDatHeight.value = w;
      updateResizedPreview();
      updateResoWarning();
      scheduleSave();
    });
    clickToZoom(synthDatRefPreviewWrap, synthDatRefPreview);
    clickToZoom(synthDatResizedPreviewWrap, synthDatResizedPreview);
    clickToZoom(synthDatLivePreviewWrap, synthDatLivePreview);
    clickToZoom(synthDatPreviewWrap, synthDatPreview);
    window.electronAPI.onSynthdatPreviewFrame((_event, { mime, bytes }) => {
      setObjectUrlOn(synthDatLivePreview, new Blob([bytes], { type: mime }));
      synthDatLivePreviewWrap.style.display = "flex";
    });
    window.electronAPI.onSynthdatProgress((_event, { value, max }) => {
      setGenStatus(`Generating\u2026 step ${value}/${max}`);
    });
    btnSynthDatPickImage.addEventListener("click", pickReferenceImage);
    btnSynthDatInterrogate.addEventListener("click", interrogateReference);
    btnSynthDatMigratePose.addEventListener("click", applyTagAssignment);
    btnSynthDatAddLora.addEventListener("click", () => {
      addLoraRow("", 1);
      scheduleSave();
    });
    btnSynthDatRefreshModels.addEventListener("click", refreshModelLists);
    btnSynthDatConnect.addEventListener("click", testSynthdatConnection);
    const datalistOptions = (el) => Array.from(el.options).map((o) => o.value);
    attachListAutocomplete(synthDatDiffModel, () => datalistOptions(synthDatUnetDatalist));
    attachListAutocomplete(synthDatClip, () => datalistOptions(synthDatClipDatalist));
    attachListAutocomplete(synthDatVae, () => datalistOptions(synthDatVaeDatalist));
    attachListAutocomplete(synthDatMainLora, () => datalistOptions(synthDatMainLoraDatalist));
    btnSynthDatGenerate.addEventListener("click", generate);
    btnSynthDatStop.addEventListener("click", () => window.electronAPI.synthdatStopGeneration(getHost()));
    btnSynthDatAccept.addEventListener("click", acceptImage);
    btnSynthDatReject.addEventListener("click", rejectImage);
    synthDatPickPass1.addEventListener("click", () => selectPass(1));
    synthDatPickPass2.addEventListener("click", () => selectPass(2));
    btnSynthDatReinterrogateOutput.addEventListener("click", reinterrogateOutput);
    renderTagCard();
    refreshModelLists();
    initSynthDatSectionDocks(synthDatCol1);
  }

  // src/renderer/tag-index.ts
  var leftSortMode = "family";
  var leftSortDir = "desc";
  var familyOrder = [];
  var getEntries5 = () => [];
  var getGalleryFilter = () => ({ base: "all", terms: [], mode: "AND", excludes: "", disabledView: false, exactMatch: false });
  var getGallerySortMode = () => "filename";
  var getGallerySortDir = () => "asc";
  var resetSingleIndex2 = () => {
  };
  var renderCurrentViewRef3 = () => {
  };
  var lastTagIndex = /* @__PURE__ */ new Map();
  function buildTagIndex() {
    const index = /* @__PURE__ */ new Map();
    for (const e of getEntries5()) {
      if (e.disabled) continue;
      for (const t of e.tags) {
        if (!index.has(t)) index.set(t, /* @__PURE__ */ new Set());
        index.get(t).add(e.base);
      }
    }
    return index;
  }
  function wordsOf(tag) {
    return Array.from(new Set(tag.split(" ").filter(Boolean)));
  }
  function buildFilterSuggestions(query) {
    const q = query.trim().toLowerCase();
    if (!q) return { direct: [], family: [] };
    const allTags = Array.from(lastTagIndex.keys());
    const starts = allTags.filter((t) => t.toLowerCase().startsWith(q));
    const contains = allTags.filter((t) => !starts.includes(t) && t.toLowerCase().includes(q));
    const direct = starts.concat(contains).slice(0, 12);
    const familyWords = /* @__PURE__ */ new Set();
    for (const t of (starts.length ? starts : direct).slice(0, 5)) {
      for (const w of wordsOf(t)) familyWords.add(w);
    }
    const directSet = new Set(direct);
    const family = allTags.filter((t) => !directSet.has(t) && wordsOf(t).some((w) => familyWords.has(w))).slice(0, 8);
    return { direct, family };
  }
  function currentFilterTermSpan(value) {
    const lastComma = value.lastIndexOf(",");
    const prefix = lastComma === -1 ? "" : value.slice(0, lastComma + 1) + " ";
    const partial = lastComma === -1 ? value : value.slice(lastComma + 1);
    return { prefix, partial: partial.trim() };
  }
  function pickFilterSuggestion(tag) {
    const { prefix } = currentFilterTermSpan(filterInput.value);
    filterInput.value = prefix + tag;
    getGalleryFilter().terms = parseFilterTerms(filterInput.value);
    hideFilterSuggestions();
    folderStats.filter_suggestions_used = true;
    saveFolderStats();
    checkAchievements();
    resetSingleIndex2();
    renderCurrentViewRef3();
    filterInput.focus();
  }
  function hideFilterSuggestions() {
    filterSuggestions.style.display = "none";
    filterSuggestions.innerHTML = "";
  }
  function buildSuggestionRow(tag) {
    const row = document.createElement("div");
    row.className = "ac-row";
    row.innerHTML = `<span class="ac-row-name">${escapeHtml(tag)}</span>`;
    row.addEventListener("mousedown", (ev) => {
      ev.preventDefault();
      pickFilterSuggestion(tag);
    });
    return row;
  }
  function updateFilterSuggestions() {
    const { partial } = currentFilterTermSpan(filterInput.value);
    if (partial.length < 2) {
      hideFilterSuggestions();
      return;
    }
    const { direct, family } = buildFilterSuggestions(partial);
    if (direct.length === 0 && family.length === 0) {
      hideFilterSuggestions();
      return;
    }
    filterSuggestions.innerHTML = "";
    const list = document.createElement("div");
    list.className = "ac-list";
    for (const tag of direct) list.appendChild(buildSuggestionRow(tag));
    if (family.length) {
      const header = document.createElement("div");
      header.className = "filter-suggestion-family";
      header.textContent = "Same keyword family";
      list.appendChild(header);
      for (const tag of family) list.appendChild(buildSuggestionRow(tag));
    }
    filterSuggestions.appendChild(list);
    filterSuggestions.style.display = "";
  }
  function renderTagFrequencyList(index) {
    const dir = leftSortDir === "asc" ? 1 : -1;
    tagFrequencyList.innerHTML = "";
    if (leftSortMode === "family") {
      const families = /* @__PURE__ */ new Map();
      for (const [tag] of index) {
        const words = Array.from(new Set(tag.split(" ").filter(Boolean)));
        for (const w of words) {
          if (!families.has(w)) families.set(w, []);
          if (!families.get(w).includes(tag)) families.get(w).push(tag);
        }
      }
      let familyList = Array.from(families.entries()).filter(([, tags]) => tags.length >= 2);
      familyList.sort((a, b) => (b[1].length - a[1].length) * dir);
      familyList = applyFamilyOrder(familyList);
      if (familyList.length === 0) {
        const empty = document.createElement("div");
        empty.className = "freq-family-header";
        empty.style.cursor = "default";
        empty.textContent = "No tags share a common word yet.";
        tagFrequencyList.appendChild(empty);
        return;
      }
      for (const [word, tags] of familyList) {
        const header = document.createElement("div");
        header.className = "freq-family-header";
        header.draggable = true;
        header.dataset.word = word;
        const dragHandle = document.createElement("span");
        dragHandle.className = "family-drag-handle";
        dragHandle.textContent = "\u2630";
        dragHandle.title = "Drag to reorder this family";
        header.appendChild(dragHandle);
        const labelSpan = document.createElement("span");
        labelSpan.textContent = ` \u2014 ${word} (${tags.length}) \u2014`;
        header.appendChild(labelSpan);
        header.addEventListener("dragstart", (ev) => {
          ev.dataTransfer.setData("text/plain", word);
          ev.dataTransfer.effectAllowed = "move";
          header.classList.add("family-dragging");
        });
        header.addEventListener("dragend", () => header.classList.remove("family-dragging"));
        header.addEventListener("dragover", (ev) => {
          ev.preventDefault();
          header.classList.add("family-drop-target");
        });
        header.addEventListener("dragleave", () => header.classList.remove("family-drop-target"));
        header.addEventListener("drop", (ev) => {
          ev.preventDefault();
          header.classList.remove("family-drop-target");
          const draggedWord = ev.dataTransfer.getData("text/plain");
          if (draggedWord && draggedWord !== word) reorderFamilyBefore(draggedWord, word, familyList.map((f) => f[0]));
        });
        tagFrequencyList.appendChild(header);
        tags.sort((a, b) => a.localeCompare(b));
        for (const tag of tags) {
          tagFrequencyList.appendChild(buildFreqRow(tag, index.get(tag).size));
        }
      }
      return;
    }
    let list = Array.from(index.entries());
    if (leftSortMode === "alphabetical") {
      list.sort((a, b) => a[0].localeCompare(b[0]) * dir);
    } else {
      list.sort((a, b) => (b[1].size - a[1].size) * dir);
    }
    for (const [tag, set] of list) {
      tagFrequencyList.appendChild(buildFreqRow(tag, set.size));
    }
  }
  function buildFreqRow(tag, count) {
    const row = document.createElement("div");
    row.className = "freq-row";
    row.innerHTML = `<span>${escapeHtml(tag)}</span><span class="n">${count}</span>`;
    row.addEventListener("click", () => setContainsFilter(tag));
    return row;
  }
  function applyFamilyOrder(familyList) {
    const words = familyList.map(([w]) => w);
    const known = familyOrder.filter((w) => words.includes(w));
    const unknown = words.filter((w) => !known.includes(w));
    const finalOrder = [...known, ...unknown];
    return finalOrder.map((w) => familyList.find(([fw]) => fw === w));
  }
  function saveFamilyOrder() {
    try {
      localStorage.setItem("dts-family-order", JSON.stringify(familyOrder));
    } catch (e) {
    }
  }
  (function loadFamilyOrder() {
    try {
      const saved = JSON.parse(localStorage.getItem("dts-family-order") || "null");
      if (Array.isArray(saved)) familyOrder = saved;
    } catch (e) {
    }
  })();
  function reorderFamilyBefore(draggedWord, targetWord, currentOrder) {
    const draggedIdx = currentOrder.indexOf(draggedWord);
    const targetIdxOriginal = currentOrder.indexOf(targetWord);
    const movingDown = draggedIdx !== -1 && targetIdxOriginal !== -1 && draggedIdx < targetIdxOriginal;
    let order = currentOrder.slice();
    order = order.filter((w) => w !== draggedWord);
    let insertIdx = order.indexOf(targetWord);
    if (movingDown) insertIdx += 1;
    order.splice(insertIdx, 0, draggedWord);
    familyOrder = order;
    saveFamilyOrder();
    refreshStats();
  }
  function refreshStats() {
    const index = buildTagIndex();
    lastTagIndex = index;
    const entries = getEntries5();
    const activeEntries = entries.filter((e) => !e.disabled);
    $("cardImages").textContent = String(activeEntries.length);
    $("cardTags").textContent = String(index.size);
    renderTagFrequencyList(index);
    return index;
  }
  function sortEntries(list) {
    const gallerySortMode = getGallerySortMode();
    const dir = getGallerySortDir() === "asc" ? 1 : -1;
    const arr = list.slice();
    arr.sort((a, b) => {
      let cmp = 0;
      if (gallerySortMode === "filename") {
        cmp = (a.imgName || "").localeCompare(b.imgName || "", void 0, { numeric: true });
      } else if (gallerySortMode === "resolution") {
        const ra = (a.width || 0) * (a.height || 0);
        const rb = (b.width || 0) * (b.height || 0);
        cmp = ra - rb;
      } else if (gallerySortMode === "tagcount") {
        cmp = a.tags.length - b.tags.length;
      } else if (gallerySortMode === "dirty") {
        cmp = (a.dirty ? 1 : 0) - (b.dirty ? 1 : 0);
      } else if (gallerySortMode === "dateadded") {
        cmp = (a.meta && a.meta.dateAdded || 0) - (b.meta && b.meta.dateAdded || 0);
      }
      return cmp * dir;
    });
    return arr;
  }
  function filteredEntries() {
    return sortEntries(getEntries5().filter(passesFilter));
  }
  function passesFilter(e) {
    const galleryFilter = getGalleryFilter();
    if (galleryFilter.disabledView) {
      if (!e.disabled) return false;
    } else {
      if (e.disabled) return false;
      if (galleryFilter.base === "untagged" && e.tags.length !== 0) return false;
      if (galleryFilter.base === "dirty" && !e.dirty) return false;
    }
    if (galleryFilter.terms && galleryFilter.terms.length) {
      const tagMatches = galleryFilter.exactMatch ? (t, term) => t.toLowerCase() === term : (t, term) => t.toLowerCase().includes(term);
      const matchCount = galleryFilter.terms.filter((term) => e.tags.some((t) => tagMatches(t, term))).length;
      const mode = galleryFilter.mode || "AND";
      if (mode === "AND" && matchCount !== galleryFilter.terms.length) return false;
      if (mode === "OR" && matchCount === 0) return false;
      if (mode === "XOR" && matchCount !== 1) return false;
      if (mode === "NOT" && matchCount > 0) return false;
    }
    if (galleryFilter.excludes && e.tags.some((t) => t.toLowerCase().includes(galleryFilter.excludes))) return false;
    return true;
  }
  function setBaseFilter(kind) {
    getGalleryFilter().base = kind;
    [filterAllBtn, filterUntaggedBtn, filterDirtyBtn].forEach((b) => b.classList.remove("active"));
    ({ all: filterAllBtn, untagged: filterUntaggedBtn, dirty: filterDirtyBtn })[kind].classList.add("active");
    resetSingleIndex2();
    renderCurrentViewRef3();
  }
  function parseFilterTerms(raw) {
    return raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  }
  function setContainsFilter(value) {
    const galleryFilter = getGalleryFilter();
    galleryFilter.terms = [value.toLowerCase()];
    galleryFilter.mode = "AND";
    filterInput.value = value;
    hideFilterSuggestions();
    resetSingleIndex2();
    renderCurrentViewRef3();
  }
  function setMirroredSelectionFilter(tags) {
    const galleryFilter = getGalleryFilter();
    const list = Array.from(tags);
    galleryFilter.terms = list.map((t) => t.toLowerCase());
    galleryFilter.mode = "AND";
    filterInput.value = list.join(", ");
    hideFilterSuggestions();
    resetSingleIndex2();
    renderCurrentViewRef3();
  }
  function setExcludesFilter(value) {
    getGalleryFilter().excludes = value.toLowerCase();
    excludeBadgeText.textContent = value;
    excludeBadge.style.display = "flex";
    resetSingleIndex2();
    renderCurrentViewRef3();
  }
  function initTagIndex(deps) {
    getEntries5 = deps.getEntries;
    getGalleryFilter = deps.getGalleryFilter;
    getGallerySortMode = deps.getGallerySortMode;
    getGallerySortDir = deps.getGallerySortDir;
    resetSingleIndex2 = deps.resetSingleIndex;
    renderCurrentViewRef3 = deps.renderCurrentView;
    leftSortDirBtn.addEventListener("click", () => {
      leftSortDir = leftSortDir === "asc" ? "desc" : "asc";
      leftSortDirBtn.textContent = leftSortDir === "asc" ? "\u25B2" : "\u25BC";
      refreshStats();
    });
    btnResetFamilyOrder.addEventListener("click", () => {
      familyOrder = [];
      saveFamilyOrder();
      refreshStats();
      toast("Keyword family order reset.");
    });
    buildPersistentDropdown(
      leftSortDropdown,
      [
        { value: "family", label: "Keyword family" },
        { value: "frequency", label: "Frequency" },
        { value: "alphabetical", label: "Alphabetical" }
      ],
      () => leftSortMode,
      (val) => {
        leftSortMode = val;
        refreshStats();
      }
    );
    let filterRenderTimer = null;
    filterInput.addEventListener("input", () => {
      getGalleryFilter().terms = parseFilterTerms(filterInput.value);
      resetSingleIndex2();
      if (filterRenderTimer) clearTimeout(filterRenderTimer);
      filterRenderTimer = setTimeout(() => {
        filterRenderTimer = null;
        renderCurrentViewRef3();
      }, 120);
      updateFilterSuggestions();
    });
    filterInput.addEventListener("focus", updateFilterSuggestions);
    filterInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") hideFilterSuggestions();
    });
    document.addEventListener("click", (ev) => {
      if (ev.target !== filterInput && !filterSuggestions.contains(ev.target)) hideFilterSuggestions();
    }, true);
    filterExactToggle.addEventListener("change", () => {
      getGalleryFilter().exactMatch = filterExactToggle.checked;
      try {
        localStorage.setItem("dts-filter-exact-match", filterExactToggle.checked ? "1" : "0");
      } catch (e) {
      }
      if (filterExactToggle.checked) {
        folderStats.exact_match_used = true;
        saveFolderStats();
        checkAchievements();
      }
      resetSingleIndex2();
      renderCurrentViewRef3();
    });
    (function initExactMatchPref() {
      let on = false;
      try {
        on = localStorage.getItem("dts-filter-exact-match") === "1";
      } catch (e) {
      }
      filterExactToggle.checked = on;
      getGalleryFilter().exactMatch = on;
    })();
    filterAllBtn.addEventListener("click", () => setBaseFilter("all"));
    filterUntaggedBtn.addEventListener("click", () => setBaseFilter("untagged"));
    filterDirtyBtn.addEventListener("click", () => setBaseFilter("dirty"));
    excludeBadgeClear.addEventListener("click", () => {
      getGalleryFilter().excludes = "";
      excludeBadge.style.display = "none";
      renderCurrentViewRef3();
    });
    btnClearFilter.addEventListener("click", () => {
      filterInput.value = "";
      const galleryFilter = getGalleryFilter();
      galleryFilter.terms = [];
      galleryFilter.excludes = "";
      excludeBadge.style.display = "none";
      hideFilterSuggestions();
      setBaseFilter("all");
    });
  }

  // src/renderer/view.ts
  var viewMode2 = "grid";
  var stickyCompareImages = [];
  var singleIndex = 0;
  var ctxMenuEl = null;
  var commonLanguages = ["English"];
  var autoSelectNewLanguage = true;
  var getEntries6 = () => [];
  var getEntryByBase4 = () => void 0;
  var getDirHandleRef = () => null;
  var addEntryFromNewFileRef = async () => null;
  var getMasterTagModeActive = () => false;
  var getCardTagSortMode = () => "default";
  var getGalleryFilter2 = () => ({ base: "all", terms: [], mode: "AND", excludes: "", disabledView: false, exactMatch: false });
  var getIsolatedFlagActive = () => false;
  var getShowTagCountBadges = () => false;
  var getEntryMeta2 = () => ({});
  var saveEntryMetaRef2 = () => {
  };
  var refreshAllUIRef7 = () => {
  };
  function resetSingleIndex3() {
    singleIndex = 0;
  }
  function resetStickyCompare() {
    stickyCompareImages = [];
  }
  function renderCurrentView() {
    if (viewMode2 === "single") renderSingleView();
    else if (viewMode2 === "compact") renderCompactGrid();
    else renderGallery();
    if (getMasterTagModeActive()) renderMasterMiniGrid();
    updateFilterMatchCount();
  }
  function updateFilterMatchCount() {
    const gf = getGalleryFilter2();
    if (gf.terms && gf.terms.length && !gf.disabledView) {
      const n = filteredEntries().length;
      filterMatchCount.textContent = `${n} match${n === 1 ? "" : "es"}`;
      filterMatchCount.style.display = "";
    } else {
      filterMatchCount.style.display = "none";
    }
  }
  var VIEW_TRANSITION_ORDER = ["grid", "compact", "single", "disabled"];
  function viewContainerFor(mode) {
    if (mode === "compact") return compactGrid;
    if (mode === "single") return singleViewEl;
    return galleryGrid;
  }
  function switchView(mode) {
    if (mode !== "single" && seqActive) {
      seqActive = false;
      seqQueue = [];
      seqIdx = 0;
    }
    const prevMode = viewMode2;
    const applyState = () => {
      viewMode2 = mode;
      viewGridBtn.classList.toggle("active", mode === "grid");
      viewCompactBtn.classList.toggle("active", mode === "compact");
      viewSingleBtn.classList.toggle("active", mode === "single");
      viewDisabledBtn.classList.toggle("active", mode === "disabled");
      getGalleryFilter2().disabledView = mode === "disabled";
      galleryGrid.style.display = mode === "grid" || mode === "disabled" ? "" : "none";
      compactGrid.style.display = mode === "compact" ? "grid" : "none";
      compactCompareArea.style.display = mode === "compact" && stickyCompareImages.length > 0 ? "block" : "none";
      singleViewEl.style.display = mode === "single" ? "block" : "none";
      singleNav.style.display = mode === "single" ? "flex" : "none";
      if (mode === "single") renderSingleView();
      else if (mode === "compact") renderCompactGrid();
      else renderGallery();
    };
    const html = document.documentElement;
    const oldEl = viewContainerFor(prevMode);
    const newEl = viewContainerFor(mode);
    if (html.classList.contains("motion-off") || prevMode === mode || oldEl === newEl) {
      applyState();
      return;
    }
    const swipe = html.classList.contains("motion-swipe");
    const movingForward = VIEW_TRANSITION_ORDER.indexOf(mode) > VIEW_TRANSITION_ORDER.indexOf(prevMode);
    const outClass = swipe ? movingForward ? "view-swipe-out-left" : "view-swipe-out-right" : "view-fade-out";
    const inClass = swipe ? movingForward ? "view-swipe-in-right" : "view-swipe-in-left" : "view-fade-out";
    oldEl.classList.add(outClass);
    setTimeout(() => {
      oldEl.classList.remove(outClass);
      applyState();
      const shownEl = viewContainerFor(mode);
      shownEl.classList.add(inClass);
      requestAnimationFrame(() => requestAnimationFrame(() => shownEl.classList.remove(inClass)));
    }, 100);
  }
  var galleryChunkObserver = null;
  var compactChunkObserver = null;
  var GALLERY_CHUNK = 250;
  var COMPACT_CHUNK = 500;
  function makeChunkedList(host, list, chunkSize, buildItem, setObserver) {
    let shown = 0;
    const sentinel = document.createElement("div");
    sentinel.style.height = "1px";
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((en) => en.isIntersecting)) appendChunkSet();
    }, { rootMargin: "600px" });
    setObserver(observer);
    function appendChunkSet() {
      if (shown >= list.length) return;
      const frag = document.createDocumentFragment();
      for (const e of list.slice(shown, shown + chunkSize)) frag.appendChild(buildItem(e));
      shown += chunkSize;
      host.appendChild(frag);
      if (shown < list.length) {
        host.appendChild(sentinel);
      } else {
        sentinel.remove();
        observer.disconnect();
        setObserver(null);
      }
    }
    return {
      appendChunk: () => appendChunkSet(),
      ensureBuilt: (base) => {
        while (shown < list.length && !host.querySelector(`.card[data-base="${CSS.escape(base)}"], .compact-card[data-base="${CSS.escape(base)}"]`)) {
          appendChunkSet();
        }
        return !!host.querySelector(`.card[data-base="${CSS.escape(base)}"], .compact-card[data-base="${CSS.escape(base)}"]`);
      }
    };
  }
  function findVerticalScroller(el) {
    let n = el.parentElement;
    while (n) {
      const oy = getComputedStyle(n).overflowY;
      if (oy === "scroll" || oy === "auto") return n;
      n = n.parentElement;
    }
    return null;
  }
  function captureAnchor(hoster, scroller) {
    if (!scroller) return null;
    const scTop = scroller.getBoundingClientRect().top;
    const cards = hoster.children;
    for (const n of Array.from(cards)) {
      const el = n;
      if (!(el.classList.contains("card") || el.classList.contains("compact-card"))) continue;
      const r = el.getBoundingClientRect();
      if (r.bottom > scTop) {
        return el.dataset.base ? { base: el.dataset.base, offsetInViewport: r.top - scTop } : null;
      }
    }
    return null;
  }
  function restoreAnchor(hoster, scroller, anchor) {
    if (!anchor) return;
    const el = hoster.querySelector(`.card[data-base="${CSS.escape(anchor.base)}"], .compact-card[data-base="${CSS.escape(anchor.base)}"]`);
    if (!el || !scroller) return;
    const applyAnchor = () => {
      const err = el.getBoundingClientRect().top - anchor.offsetInViewport - scroller.getBoundingClientRect().top;
      if (Math.abs(err) > 1) scroller.scrollTop += err;
    };
    applyAnchor();
    requestAnimationFrame(() => {
      applyAnchor();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        applyAnchor();
        hoster.classList.remove("anchor-resolving");
      }));
    });
  }
  function patchGridCard(e) {
    if (viewMode2 === "compact") {
      const old2 = compactGrid.querySelector(`.compact-card[data-base="${CSS.escape(e.base)}"]`);
      if (old2) {
        old2.replaceWith(buildCompactCard(e));
        return;
      }
    }
    const old = galleryGrid.querySelector(`.card[data-base="${CSS.escape(e.base)}"]`);
    if (!old) {
      renderCurrentView();
      return;
    }
    old.replaceWith(buildCard(e, buildTagIndex()));
    updateFilterMatchCount();
  }
  function renderGallery() {
    const scroller = findVerticalScroller(galleryGrid);
    const anchor = scroller ? captureAnchor(galleryGrid, scroller) : null;
    galleryGrid.innerHTML = "";
    if (galleryChunkObserver) {
      galleryChunkObserver.disconnect();
      galleryChunkObserver = null;
    }
    const list = filteredEntries();
    const tagIndex = buildTagIndex();
    const lister = makeChunkedList(
      galleryGrid,
      list,
      GALLERY_CHUNK,
      (e) => buildCard(e, tagIndex),
      (o) => {
        galleryChunkObserver = o;
      }
    );
    lister.appendChunk();
    if (scroller && anchor) lister.ensureBuilt(anchor.base);
    restoreAnchor(galleryGrid, scroller, anchor);
  }
  function renderCompactGrid() {
    const scroller = findVerticalScroller(compactGrid);
    const anchor = scroller ? captureAnchor(compactGrid, scroller) : null;
    compactGrid.innerHTML = "";
    if (compactChunkObserver) {
      compactChunkObserver.disconnect();
      compactChunkObserver = null;
    }
    const list = filteredEntries().filter((e) => !stickyCompareImages.includes(e.base));
    const lister = makeChunkedList(
      compactGrid,
      list,
      COMPACT_CHUNK,
      (e) => buildCompactCard(e),
      (o) => {
        compactChunkObserver = o;
      }
    );
    lister.appendChunk();
    if (scroller && anchor) lister.ensureBuilt(anchor.base);
    restoreAnchor(compactGrid, scroller, anchor);
    renderCompactCompareArea();
  }
  function buildCompactCard(e) {
    const card = document.createElement("div");
    card.className = "compact-card" + (e.dirty ? " dirty" : "") + (e.disabled ? " disabled-card" : "") + (e.meta && e.meta.blurred ? " manually-blurred" : "");
    card.dataset.base = e.base;
    if (e.meta && e.meta.reviewColor) card.style.setProperty("--card-flag-color", e.meta.reviewColor);
    if (!e.disabled) {
      card.draggable = true;
      card.addEventListener("dragstart", (ev) => {
        ev.dataTransfer.setData("text/plain", e.base);
        ev.dataTransfer.effectAllowed = "move";
      });
    }
    const img = document.createElement("img");
    img.src = e.objectUrl;
    img.loading = "lazy";
    img.decoding = "async";
    card.appendChild(img);
    if (e.meta && e.meta.reviewColor) {
      const badge = document.createElement("div");
      badge.className = "flag-badge";
      badge.style.background = e.meta.reviewColor;
      card.appendChild(badge);
    }
    card.addEventListener("click", (ev) => {
      if (ctxMenuEl) return;
      if (ev.shiftKey) {
        toggleStickyCompare(e.base);
        return;
      }
      openImageCardModal(e);
    });
    card.addEventListener("contextmenu", (ev) => {
      ev.preventDefault();
      openImageOptionsMenu(e, ev.clientX, ev.clientY);
    });
    attachLongPress(card, (ev) => openImageOptionsMenu(e, ev.clientX, ev.clientY));
    if (e.tags.length && !getHideTagsRef()) {
      const hoverTags = document.createElement("div");
      hoverTags.className = "compact-hover-tags";
      hoverTags.textContent = e.tags.join(", ");
      card.appendChild(hoverTags);
    }
    return card;
  }
  function toggleStickyCompare(base) {
    const idx = stickyCompareImages.indexOf(base);
    if (idx === -1) stickyCompareImages.push(base);
    else stickyCompareImages.splice(idx, 1);
    renderCompactGrid();
  }
  function renderCompactCompareArea() {
    const stickyEntries = stickyCompareImages.map((b) => getEntryByBase4(b)).filter((e) => !!e);
    if (stickyEntries.length === 0) {
      compactCompareArea.style.display = "none";
      return;
    }
    compactCompareArea.style.display = "block";
    compareCount.textContent = String(stickyEntries.length);
    const allTags = /* @__PURE__ */ new Set();
    stickyEntries.forEach((e) => e.tags.forEach((t) => allTags.add(t)));
    const tagList = Array.from(allTags).sort((a, b) => a.localeCompare(b));
    compactCompareTable.innerHTML = "";
    const headerRow = document.createElement("div");
    headerRow.className = "compare-row compare-header-row";
    const corner = document.createElement("div");
    corner.className = "compare-cell compare-corner";
    headerRow.appendChild(corner);
    stickyEntries.forEach((e) => {
      const cell = document.createElement("div");
      cell.className = "compare-cell compare-img-cell";
      const img = document.createElement("img");
      img.src = e.objectUrl;
      const rm = document.createElement("button");
      rm.textContent = "\u2715";
      rm.title = "Remove from comparison";
      rm.addEventListener("click", () => toggleStickyCompare(e.base));
      cell.appendChild(img);
      cell.appendChild(rm);
      headerRow.appendChild(cell);
    });
    compactCompareTable.appendChild(headerRow);
    for (const tag of tagList) {
      const row = document.createElement("div");
      row.className = "compare-row";
      const labelCell = document.createElement("div");
      labelCell.className = "compare-cell compare-label-cell";
      labelCell.textContent = tag;
      row.appendChild(labelCell);
      stickyEntries.forEach((e) => {
        const cell = document.createElement("div");
        cell.className = "compare-cell";
        if (e.tags.includes(tag)) {
          cell.appendChild(buildChip2(e, tag, () => renderCompactCompareArea(), null));
        } else {
          const addBtn = document.createElement("button");
          addBtn.textContent = "+ add";
          addBtn.title = `Add "${tag}" to this image`;
          addBtn.addEventListener("click", () => {
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
  function buildCard(e, tagIndex) {
    const isTouchDevice2 = document.documentElement.classList.contains("touch-device");
    const card = document.createElement("div");
    card.className = "card" + (e.dirty ? " dirty" : "") + (e.tags.length === 0 ? " untagged" : "") + (e.disabled ? " disabled-card" : "") + (e.meta && e.meta.reviewColor ? " flagged" : "") + (e.meta && e.meta.blurred ? " manually-blurred" : "");
    card.dataset.base = e.base;
    if (e.meta && e.meta.reviewColor) card.style.setProperty("--card-flag-color", e.meta.reviewColor);
    if (!e.disabled) {
      card.draggable = true;
      card.addEventListener("dragstart", (ev) => {
        ev.dataTransfer.setData("text/plain", e.base);
        ev.dataTransfer.effectAllowed = "move";
      });
    }
    const thumbwrap = document.createElement("div");
    thumbwrap.className = "thumbwrap";
    if (getMasterTagModeActive()) {
      const selCb = document.createElement("input");
      selCb.type = "checkbox";
      selCb.className = "master-select-cb";
      selCb.checked = masterSelectedImages.has(e.base);
      selCb.addEventListener("click", (ev) => ev.stopPropagation());
      selCb.addEventListener("change", () => {
        if (selCb.checked) masterSelectedImages.add(e.base);
        else masterSelectedImages.delete(e.base);
        renderMasterSelectionSummary();
      });
      thumbwrap.appendChild(selCb);
    }
    const img = document.createElement("img");
    img.src = e.objectUrl;
    img.loading = "lazy";
    img.decoding = "async";
    thumbwrap.appendChild(img);
    const menuBtn = document.createElement("button");
    menuBtn.className = "img-menu-btn";
    menuBtn.textContent = "\u22EF";
    menuBtn.title = "More options";
    menuBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      openImageOptionsMenu(e, ev.clientX, ev.clientY);
    });
    thumbwrap.appendChild(menuBtn);
    const statusIconsEl = buildStatusIconsEl(e);
    if (!isTouchDevice2) thumbwrap.appendChild(statusIconsEl);
    if (e.meta && e.meta.reviewColor) {
      const badge = document.createElement("div");
      badge.className = "flag-badge";
      badge.style.background = e.meta.reviewColor;
      thumbwrap.appendChild(badge);
    }
    if (e.meta && e.meta.locked) {
      const lockBadge = document.createElement("div");
      lockBadge.className = "lock-badge";
      lockBadge.textContent = "\u{1F512}";
      lockBadge.title = "Locked \u2014 mass tools (Quick Merge, Master Tags, bulk WD14, etc.) skip this image";
      thumbwrap.appendChild(lockBadge);
    }
    const mvBadges = buildMergeVoidBadgesEl(e);
    if (mvBadges) thumbwrap.appendChild(mvBadges);
    if (getShowTagCountBadges()) {
      const countBadge = document.createElement("div");
      countBadge.className = "tagcount-badge";
      countBadge.textContent = String(e.tags.length);
      thumbwrap.appendChild(countBadge);
    }
    if (e.meta && e.meta.note) {
      const noteBadge = document.createElement("div");
      noteBadge.className = "note-badge";
      noteBadge.textContent = "\u{1F4DD}";
      noteBadge.title = "Click to edit note";
      noteBadge.addEventListener("click", (ev) => {
        ev.stopPropagation();
        openNoteEditor(e);
      });
      thumbwrap.appendChild(noteBadge);
    }
    const fn = document.createElement("div");
    fn.className = "filename";
    fn.textContent = e.imgName || e.base;
    thumbwrap.appendChild(fn);
    if (e.dirty) {
      const dot = document.createElement("div");
      dot.className = "dirtydot";
      thumbwrap.appendChild(dot);
    }
    thumbwrap.addEventListener("click", () => {
      if (ctxMenuEl) return;
      openImageCardModal(e);
    });
    thumbwrap.addEventListener("contextmenu", (ev) => {
      ev.preventDefault();
      openImageOptionsMenu(e, ev.clientX, ev.clientY);
    });
    attachLongPress(thumbwrap, (ev) => openImageOptionsMenu(e, ev.clientX, ev.clientY));
    const tagbox = document.createElement("div");
    tagbox.className = "tagbox";
    if (e.meta && e.meta.noteAlwaysVisible && e.meta.note) {
      const noteVis = document.createElement("div");
      noteVis.className = "card-note-visible";
      noteVis.textContent = e.meta.note;
      tagbox.appendChild(noteVis);
    }
    let addInput = null;
    if (!isTouchDevice2 && !getHideTagsRef()) {
      addInput = document.createElement("input");
      addInput.type = "text";
      addInput.className = "addtag-input";
      addInput.placeholder = "+ Add tag";
      addInput.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" && addInput && addInput.value.trim()) {
          addTagToEntry(e, addInput.value.trim());
          addInput.value = "";
          closeAutocomplete();
          patchGridCard(e);
          const freshInput = galleryGrid.querySelector(
            `.card[data-base="${CSS.escape(e.base)}"] .addtag-input`
          );
          if (freshInput) {
            freshInput.focus();
          }
          refreshRightPanels();
        }
      });
      addInput.addEventListener("focus", () => {
        card.draggable = false;
      });
      addInput.addEventListener("blur", () => {
        card.draggable = !e.disabled;
      });
      attachTagAutocomplete(addInput, () => e, () => {
        renderGallery();
        refreshRightPanels();
      });
      tagbox.appendChild(addInput);
    }
    const chiprow = document.createElement("div");
    chiprow.className = "chiprow";
    if (!getHideTagsRef()) {
      for (const tag of orderedTagsForDisplay(e, tagIndex)) {
        chiprow.appendChild(buildChip2(e, tag, () => {
          patchGridCard(e);
          refreshRightPanels();
          refreshStats();
        }, tagIndex));
      }
    }
    tagbox.appendChild(chiprow);
    if (isTouchDevice2) {
      const ghost = document.createElement("div");
      ghost.className = "addtag-ghost";
      ghost.textContent = "Tap to edit";
      tagbox.appendChild(ghost);
    }
    tagbox.addEventListener("click", () => {
      if (ctxMenuEl) return;
      if (isTouchDevice2) openImageCardModal(e);
    });
    if (isTouchDevice2) card.appendChild(statusIconsEl);
    card.appendChild(thumbwrap);
    card.appendChild(tagbox);
    return card;
  }
  var singleZoom = 100;
  var singlePanX = 0;
  var singlePanY = 0;
  var lastSingleBase = null;
  function renderMultiCompareView() {
    singleViewEl.innerHTML = "";
    singlePos.textContent = `${masterSelectedImages.size} selected`;
    singlePrevBtn.disabled = true;
    singleNextBtn.disabled = true;
    const selectedEntries = Array.from(masterSelectedImages).map((b) => getEntryByBase4(b)).filter((e) => !!e);
    const allTags = /* @__PURE__ */ new Set();
    selectedEntries.forEach((e) => e.tags.forEach((t) => allTags.add(t)));
    const tagList = Array.from(allTags).sort((a, b) => a.localeCompare(b));
    const wrap = document.createElement("div");
    wrap.className = "multicompare-wrap";
    const header = document.createElement("div");
    header.className = "multicompare-header";
    header.innerHTML = `<span>Comparing ${selectedEntries.length} selected image(s) \u2014 ${tagList.length} unique tag(s)</span>`;
    const clearBtn = document.createElement("button");
    clearBtn.textContent = "Clear selection";
    clearBtn.addEventListener("click", () => {
      masterSelectedImages.clear();
      renderMasterSelectionSummary();
      renderCurrentView();
    });
    header.appendChild(clearBtn);
    wrap.appendChild(header);
    if (tagList.length === 0) {
      const empty = document.createElement("div");
      empty.className = "single-empty";
      empty.textContent = "None of the selected images have any tags yet.";
      wrap.appendChild(empty);
      singleViewEl.appendChild(wrap);
      return;
    }
    const table = document.createElement("div");
    table.className = "multicompare-table";
    const headRow = document.createElement("div");
    headRow.className = "mc-row mc-head-row";
    const headName = document.createElement("div");
    headName.className = "mc-cell mc-tagname";
    headName.textContent = "Tag";
    const headOwners = document.createElement("div");
    headOwners.className = "mc-cell mc-owners";
    headOwners.textContent = `Images with this tag (of ${selectedEntries.length})`;
    headRow.appendChild(headName);
    headRow.appendChild(headOwners);
    table.appendChild(headRow);
    for (const tag of tagList) {
      const owners = selectedEntries.filter((e) => e.tags.includes(tag));
      const row = document.createElement("div");
      row.className = "mc-row";
      const nameCell = document.createElement("div");
      nameCell.className = "mc-cell mc-tagname";
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.value = tag;
      nameInput.title = "Change this to rename the tag across all selected images that have it";
      nameInput.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
          const newName = nameInput.value.trim().replace(/_/g, " ").replace(/\s+/g, " ");
          if (newName && newName !== tag) renameTagAcrossEntries(tag, newName, owners);
        }
      });
      nameCell.appendChild(nameInput);
      row.appendChild(nameCell);
      const ownersCell = document.createElement("div");
      ownersCell.className = "mc-cell mc-owners";
      const nonOwners = selectedEntries.filter((e) => !e.tags.includes(tag));
      owners.forEach((e) => {
        const ownerRow = document.createElement("div");
        ownerRow.className = "mc-owner-row";
        ownerRow.textContent = e.imgName || e.base;
        ownerRow.title = "Click to remove or replace this tag on this image";
        ownerRow.addEventListener("click", (ev) => {
          openMultiCompareTagMenu(e, tag, ev.clientX, ev.clientY);
        });
        ownersCell.appendChild(ownerRow);
      });
      nonOwners.forEach((e) => {
        const missingRow = document.createElement("div");
        missingRow.className = "mc-owner-row mc-owner-missing";
        missingRow.textContent = `+ add to ${e.imgName}`;
        missingRow.title = `Add "${tag}" to this image too`;
        missingRow.addEventListener("click", () => {
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
  function renameTagAcrossEntries(oldTag, newTag, entriesList) {
    const affected = [];
    for (const e of entriesList) {
      if (!e.tags.includes(oldTag)) continue;
      const prevTags = e.tags.slice();
      let newTags = e.tags.map((t) => t === oldTag ? newTag : t);
      newTags = Array.from(new Set(newTags));
      e.tags = newTags;
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: newTags.slice() });
    }
    if (affected.length === 0) return;
    const summary = `Renamed "${oldTag}" \u2192 "${newTag}" across ${affected.length} selected image(s).`;
    toast(summary);
    recordChange("rename", summary, affected);
    folderStats.master_ops = (folderStats.master_ops || 0) + 1;
    saveFolderStats();
    refreshAllUIRef7();
    checkAchievements();
  }
  function openMultiCompareTagMenu(entry, tag, x, y) {
    closeTagContextMenu();
    const menu = document.createElement("div");
    menu.className = "ctx-menu";
    const header = document.createElement("div");
    header.className = "ctx-header";
    header.textContent = entry.imgName || entry.base;
    menu.appendChild(header);
    addCtxItem(menu, `Remove "${tag}" from this image`, () => {
      removeTagFromEntry(entry, tag);
      closeTagContextMenu();
      renderMultiCompareView();
    });
    const sep = document.createElement("div");
    sep.className = "ctx-sep";
    sep.textContent = "Or replace it on this image:";
    menu.appendChild(sep);
    const replaceRow = document.createElement("div");
    replaceRow.style.cssText = "display:flex; gap:6px; padding:2px 8px 8px;";
    const replaceInput = document.createElement("input");
    replaceInput.type = "text";
    replaceInput.placeholder = "Replace with\u2026";
    replaceInput.style.flex = "1";
    replaceInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && replaceInput.value.trim()) {
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
    setTimeout(() => document.addEventListener("click", onDocClickCloseMenu), 0);
  }
  var seqActive = false;
  var seqQueue = [];
  var seqIdx = 0;
  var PERSPECTIVE_OPTIONS = ["from front", "from side", "from below", "from above", "from behind"];
  var PERSPECTIVE_EXTRA_OPTIONS = ["pov", "close-up"];
  function perspectiveOptionTags() {
    return [...PERSPECTIVE_OPTIONS, ...PERSPECTIVE_EXTRA_OPTIONS];
  }
  var CENSOR_TYPE_OPTIONS = [
    { tag: "censored", label: "Generic" },
    { tag: "mosaic censoring", label: "Mosaic" },
    { tag: "bar censor", label: "Bar" },
    { tag: "blur censor", label: "Blur" },
    { tag: "heart censor", label: "Heart" },
    { tag: "light censor", label: "Light" }
  ];
  function startSequentialDetail(from) {
    const list = filteredEntries();
    if (!list.length) {
      toast("No images match the current filter.");
      return;
    }
    let startIdx = 0;
    if (from === "selected") {
      if (masterSelectedImages.size === 0) {
        toast("Select at least one image first.");
        return;
      }
      startIdx = list.findIndex((e) => masterSelectedImages.has(e.base));
      if (startIdx < 0) {
        toast("No selected images match the current filter.");
        return;
      }
    }
    seqQueue = list;
    seqIdx = startIdx;
    seqActive = true;
    seqPanelForcedCollapse = !getRightPanelCollapsedRef();
    setRightPanelCollapsedRef(true);
    switchView("single");
  }
  function exitSequentialDetail() {
    if (!seqActive) return;
    seqActive = false;
    seqQueue = [];
    seqIdx = 0;
    if (seqPanelForcedCollapse) setRightPanelCollapsedRef(false);
    seqPanelForcedCollapse = false;
    if (viewMode2 !== "single") return;
    singleNav.style.display = "flex";
    renderSingleView();
  }
  function seqDraftFromEntry(entry) {
    const censoredTags = entry.tags.filter((t) => /censor/i.test(t) && !/uncensor/i.test(t));
    const uncensored = entry.tags.some((t) => /uncensor/i.test(t));
    const presentTypes = CENSOR_TYPE_OPTIONS.filter((o) => entry.tags.includes(o.tag)).map((o) => o.tag);
    return {
      hasText: entry.tags.includes("text") || getForeignLangTags(entry).length > 0,
      isJapanese: entry.tags.includes("text"),
      foreignLangs: new Set(getForeignLangTags(entry).map((t) => t.replace(/ text$/, ""))),
      censor: censoredTags.length > 0 ? "censored" : uncensored ? "uncensored" : "unspecified",
      censorTypes: new Set(presentTypes.length ? presentTypes : censoredTags.length > 0 ? ["censored"] : []),
      perspectives: new Set(perspectiveOptionTags().filter((p) => entry.tags.includes(p))),
      monochrome: entry.tags.includes("monochrome"),
      soundEffects: entry.tags.includes("sound effects"),
      isComic: entry.tags.includes("comic"),
      // Independent of comic — a single illustration can show its subject
      // from several angles at once (the multiple views tag, ~30k posts).
      multipleViews: entry.tags.includes("multiple views"),
      koma: entry.tags.find((t) => KOMA_OPTIONS.includes(t)) || ""
    };
  }
  function applySequentialDraft(entry, d) {
    if (!d.hasText) {
      if (entry.tags.includes("text")) removeTagFromEntry(entry, "text");
      for (const tag of getForeignLangTags(entry)) removeTagFromEntry(entry, tag);
    } else {
      if (d.isJapanese) {
        if (!entry.tags.includes("text")) addTagToEntry(entry, "text");
      } else if (entry.tags.includes("text")) removeTagFromEntry(entry, "text");
      for (const tag of getForeignLangTags(entry)) {
        if (!d.foreignLangs.has(tag.replace(/ text$/, ""))) removeTagFromEntry(entry, tag);
      }
      for (const lang of d.foreignLangs) {
        if (!entry.tags.includes(`${lang} text`)) addTagToEntry(entry, `${lang} text`);
      }
    }
    for (const tag of entry.tags.filter((t) => /censor/i.test(t))) removeTagFromEntry(entry, tag);
    if (d.censor === "censored") {
      const types = d.censorTypes.size ? [...d.censorTypes] : ["censored"];
      for (const t of types) addTagToEntry(entry, t);
    } else if (d.censor === "uncensored") addTagToEntry(entry, "uncensored");
    for (const p of perspectiveOptionTags()) {
      if (d.perspectives.has(p)) {
        if (!entry.tags.includes(p)) addTagToEntry(entry, p);
      } else if (entry.tags.includes(p)) removeTagFromEntry(entry, p);
    }
    if (d.monochrome && !entry.tags.includes("monochrome")) addTagToEntry(entry, "monochrome");
    if (!d.monochrome && entry.tags.includes("monochrome")) removeTagFromEntry(entry, "monochrome");
    if (d.soundEffects && !entry.tags.includes("sound effects")) addTagToEntry(entry, "sound effects");
    if (!d.soundEffects && entry.tags.includes("sound effects")) removeTagFromEntry(entry, "sound effects");
    if (d.isComic && !entry.tags.includes("comic")) addTagToEntry(entry, "comic");
    if (!d.isComic && entry.tags.includes("comic")) removeTagFromEntry(entry, "comic");
    if (d.multipleViews && !entry.tags.includes("multiple views")) addTagToEntry(entry, "multiple views");
    if (!d.multipleViews && entry.tags.includes("multiple views")) removeTagFromEntry(entry, "multiple views");
    const existingKoma = entry.tags.find((t) => KOMA_OPTIONS.includes(t));
    if (existingKoma && existingKoma !== d.koma) removeTagFromEntry(entry, existingKoma);
    if (d.koma && !entry.tags.includes(d.koma)) addTagToEntry(entry, d.koma);
  }
  function seqPreviewTags(d) {
    const tags = [];
    if (d.hasText) {
      if (d.isJapanese) tags.push("text");
      for (const lang of d.foreignLangs) tags.push(`${lang} text`);
    }
    if (d.censor === "censored") {
      for (const t of d.censorTypes.size ? [...d.censorTypes] : ["censored"]) tags.push(t);
    } else if (d.censor === "uncensored") tags.push("uncensored");
    for (const p of perspectiveOptionTags()) if (d.perspectives.has(p)) tags.push(p);
    if (d.monochrome) tags.push("monochrome");
    if (d.soundEffects) tags.push("sound effects");
    if (d.isComic) tags.push("comic");
    if (d.multipleViews) tags.push("multiple views");
    if (d.koma) tags.push(d.koma);
    return tags;
  }
  function buildSequentialPanel(panel, entry, onPreview) {
    const d = seqDraftFromEntry(entry);
    const emitPreview = () => {
      if (onPreview) onPreview(seqPreviewTags(d));
    };
    panel.addEventListener("change", emitPreview);
    function sectionLabel(text) {
      const el = document.createElement("div");
      el.className = "single-name";
      el.style.marginTop = "10px";
      el.textContent = text;
      return el;
    }
    function toggleRow(labelText, checked, onChange) {
      const label = document.createElement("label");
      label.className = "ach-toggle-row";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = checked;
      cb.addEventListener("change", () => onChange(cb.checked));
      label.appendChild(cb);
      label.appendChild(document.createTextNode(" " + labelText));
      return label;
    }
    function checkGrid(columns) {
      const grid = document.createElement("div");
      grid.style.cssText = columns ? `display:grid; grid-template-columns:repeat(${columns}, minmax(0, 1fr)); gap:4px 6px; margin:2px 0;` : "display:grid; grid-template-columns:repeat(auto-fill, minmax(110px, 1fr)); gap:4px 6px; margin:2px 0;";
      return grid;
    }
    function cap(s) {
      return s.charAt(0).toUpperCase() + s.slice(1);
    }
    function radioRow(group, options, current, onPick) {
      const wrap = document.createElement("div");
      wrap.style.cssText = "display:flex; flex-wrap:wrap; gap:4px 12px; margin:4px 0;";
      for (const o of options) {
        const label = document.createElement("label");
        label.style.cssText = "display:flex; align-items:center; gap:4px; font-size:12px;";
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = group + "-" + entry.base;
        radio.value = o.value;
        radio.checked = o.value === current;
        radio.addEventListener("change", () => {
          if (radio.checked) onPick(o.value);
        });
        label.appendChild(radio);
        label.appendChild(document.createTextNode(o.label));
        wrap.appendChild(label);
      }
      return wrap;
    }
    panel.appendChild(sectionLabel("Text"));
    function togglePair(a, b) {
      const row = document.createElement("div");
      row.style.cssText = "display:flex; gap:6px; margin:4px 0;";
      a.style.flex = "1";
      row.appendChild(a);
      if (b) {
        b.style.flex = "1";
        row.appendChild(b);
      }
      return row;
    }
    const hasTextRow = toggleRow("Has text", d.hasText, (v) => {
      d.hasText = v;
      panel.querySelectorAll(".seq-text-sub").forEach((el) => {
        el.style.display = v ? "" : "none";
      });
    });
    const soundRow = toggleRow("Sound effects", d.soundEffects, (v) => {
      d.soundEffects = v;
    });
    panel.appendChild(togglePair(hasTextRow, soundRow));
    const textSub = document.createElement("div");
    textSub.className = "seq-text-sub";
    textSub.style.display = d.hasText ? "" : "none";
    const jpRow = toggleRow("Japanese", d.isJapanese, (v) => {
      d.isJapanese = v;
    });
    textSub.appendChild(togglePair(jpRow));
    const langList = checkGrid();
    textSub.appendChild(langList);
    function refreshLangRows() {
      langList.innerHTML = "";
      const byKey = /* @__PURE__ */ new Map();
      for (const name of [...commonLanguages, ...d.foreignLangs]) {
        const key = name.toLowerCase();
        if (!byKey.has(key)) byKey.set(key, name);
      }
      for (const [key, display] of byKey) {
        langList.appendChild(toggleRow(display, d.foreignLangs.has(key), (v) => {
          if (v) d.foreignLangs.add(key);
          else d.foreignLangs.delete(key);
        }));
      }
    }
    refreshLangRows();
    const addLangRow = document.createElement("div");
    addLangRow.style.cssText = "display:flex; gap:6px; margin-top:4px;";
    const addLangInput = document.createElement("input");
    addLangInput.type = "text";
    addLangInput.placeholder = "Add language\u2026";
    addLangInput.style.flex = "1";
    const addLangBtn = document.createElement("button");
    addLangBtn.textContent = "Add";
    function commitNewLanguage() {
      const lang = addLangInput.value.trim();
      if (!lang) return;
      if (!commonLanguages.includes(lang)) {
        commonLanguages.push(lang);
        saveCommonLanguages();
      }
      d.foreignLangs.add(lang.toLowerCase());
      addLangInput.value = "";
      refreshLangRows();
      emitPreview();
    }
    addLangInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") commitNewLanguage();
    });
    addLangBtn.addEventListener("click", commitNewLanguage);
    addLangRow.appendChild(addLangInput);
    addLangRow.appendChild(addLangBtn);
    textSub.appendChild(addLangRow);
    panel.appendChild(textSub);
    panel.appendChild(sectionLabel("Censorship"));
    const censorWrap = document.createElement("div");
    panel.appendChild(censorWrap);
    const typeBox = checkGrid(2);
    for (const o of CENSOR_TYPE_OPTIONS) {
      typeBox.appendChild(toggleRow(o.label, d.censorTypes.has(o.tag), (v) => {
        if (v) {
          d.censorTypes.add(o.tag);
          if (d.censor !== "censored") {
            d.censor = "censored";
            renderCensor();
          }
        } else d.censorTypes.delete(o.tag);
      }));
    }
    function renderCensor() {
      censorWrap.innerHTML = "";
      censorWrap.appendChild(radioRow("seq-censor", [
        { value: "unspecified", label: "Unspecified" },
        { value: "censored", label: "Censored" },
        { value: "uncensored", label: "Uncensored" }
      ], d.censor, (v) => {
        d.censor = v;
      }));
    }
    renderCensor();
    panel.appendChild(typeBox);
    panel.appendChild(sectionLabel("Perspective"));
    const perspBox = checkGrid();
    for (const p of perspectiveOptionTags()) {
      const label = p === "close-up" ? "Close-up" : cap(p.replace(/^from /, ""));
      perspBox.appendChild(toggleRow(label, d.perspectives.has(p), (v) => {
        if (v) d.perspectives.add(p);
        else d.perspectives.delete(p);
      }));
    }
    panel.appendChild(perspBox);
    panel.appendChild(sectionLabel("Indicator"));
    const monoRowOuter = toggleRow("Monochrome", d.monochrome, (v) => {
      d.monochrome = v;
    });
    const comicRow = toggleRow("Comic", d.isComic, (v) => {
      d.isComic = v;
    });
    panel.appendChild(togglePair(monoRowOuter, comicRow));
    panel.appendChild(toggleRow("Multiple views", d.multipleViews, (v) => {
      d.multipleViews = v;
    }));
    panel.appendChild(radioRow("seq-koma", [
      { value: "", label: "Not koma" },
      ...KOMA_OPTIONS.map((k) => ({ value: k, label: k }))
    ], d.koma, (v) => {
      d.koma = v;
    }));
    const confirmBtn = document.createElement("button");
    confirmBtn.className = "primary";
    confirmBtn.style.cssText = "width:100%; margin-top:12px; padding:12px; font-size:15px; font-weight:600;";
    confirmBtn.classList.add("seq-confirm");
    confirmBtn.textContent = seqIdx >= seqQueue.length - 1 ? "Confirm (finish)" : "Confirm (next \u2192)";
    confirmBtn.addEventListener("click", () => {
      applySequentialDraft(entry, d);
      renderCurrentView();
      seqIdx++;
      if (seqIdx >= seqQueue.length) {
        exitSequentialDetail();
        toast("Sequential review done.");
      } else {
        renderSingleView();
      }
    });
    panel.appendChild(confirmBtn);
    emitPreview();
  }
  var singleImgEl = null;
  function applySingleTransform() {
    if (singleImgEl) singleImgEl.style.transform = `translate(${singlePanX}px, ${singlePanY}px) scale(${singleZoom / 100})`;
  }
  function buildSingleImgSide(e, hooks, opts) {
    const imgSide = document.createElement("div");
    imgSide.className = "single-img-side";
    imgSide.style.position = "relative";
    imgSide.style.overflow = "hidden";
    const img = document.createElement("img");
    img.src = e.objectUrl;
    img.draggable = false;
    img.style.transformOrigin = "center center";
    img.style.transform = `translate(${singlePanX}px, ${singlePanY}px) scale(${singleZoom / 100})`;
    img.style.cursor = "grab";
    imgSide.appendChild(img);
    const menuBtn = document.createElement("button");
    menuBtn.className = "img-menu-btn";
    menuBtn.style.left = "10px";
    menuBtn.style.top = "10px";
    menuBtn.textContent = "\u22EF";
    menuBtn.title = "More options";
    menuBtn.addEventListener("pointerdown", (ev) => ev.stopPropagation());
    menuBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      openImageOptionsMenu(e, ev.clientX, ev.clientY);
    });
    imgSide.appendChild(menuBtn);
    const statusIconsEl = buildStatusIconsEl(e);
    statusIconsEl.style.left = "10px";
    statusIconsEl.style.top = "38px";
    imgSide.appendChild(statusIconsEl);
    const mvBadgesSingle = buildMergeVoidBadgesEl(e);
    if (mvBadgesSingle) {
      mvBadgesSingle.style.position = "absolute";
      mvBadgesSingle.style.left = "10px";
      mvBadgesSingle.style.bottom = "10px";
      imgSide.appendChild(mvBadgesSingle);
    }
    function applyTransform() {
      img.style.transform = `translate(${singlePanX}px, ${singlePanY}px) scale(${singleZoom / 100})`;
      if (opts && opts.clampPan) {
        const r = img.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          const c = imgSide.getBoundingClientRect();
          let dx = 0, dy = 0;
          if (r.width <= c.width) dx = c.left + c.width / 2 - (r.left + r.width / 2);
          else if (r.left > c.left) dx = c.left - r.left;
          else if (r.right < c.right) dx = c.right - r.right;
          if (r.height <= c.height) dy = c.top + c.height / 2 - (r.top + r.height / 2);
          else if (r.top > c.top) dy = c.top - r.top;
          else if (r.bottom < c.bottom) dy = c.bottom - r.bottom;
          if (dx || dy) {
            singlePanX += dx;
            singlePanY += dy;
            img.style.transform = `translate(${singlePanX}px, ${singlePanY}px) scale(${singleZoom / 100})`;
          }
        }
      }
    }
    if (opts && opts.clampPan) img.addEventListener("load", () => applyTransform());
    function zoomBy(delta, clientX, clientY) {
      const prevZoom = singleZoom;
      singleZoom = Math.min(400, Math.max(100, singleZoom + delta));
      if (singleZoom === prevZoom) return;
      if (hooks) hooks.setZoomUI(singleZoom);
      applyTransform();
      if (singleZoom > (folderStats.zoom_max || 0)) {
        folderStats.zoom_max = singleZoom;
        saveFolderStats();
        checkAchievements();
      }
    }
    let isPanning = false, panStartX = 0, panStartY = 0, panOrigX = 0, panOrigY = 0;
    imgSide.addEventListener("contextmenu", (ev) => ev.preventDefault());
    imgSide.addEventListener("pointerdown", (ev) => {
      if (ev.button === 0 || ev.button === 2) {
        isPanning = true;
        panStartX = ev.clientX;
        panStartY = ev.clientY;
        panOrigX = singlePanX;
        panOrigY = singlePanY;
        imgSide.setPointerCapture(ev.pointerId);
        img.style.cursor = "grabbing";
        ev.preventDefault();
      }
    });
    imgSide.addEventListener("pointermove", (ev) => {
      if (isPanning) {
        singlePanX = panOrigX + (ev.clientX - panStartX);
        singlePanY = panOrigY + (ev.clientY - panStartY);
        applyTransform();
      }
    });
    imgSide.addEventListener("pointerup", (ev) => {
      if (isPanning) {
        isPanning = false;
        img.style.cursor = "grab";
        try {
          imgSide.releasePointerCapture(ev.pointerId);
        } catch (err) {
        }
      }
    });
    imgSide.addEventListener("wheel", (ev) => {
      ev.preventDefault();
      const delta = ev.deltaY < 0 ? 20 : -20;
      zoomBy(delta, ev.clientX, ev.clientY);
    }, { passive: false });
    attachPinchZoom(imgSide, (delta) => zoomBy(delta));
    singleImgEl = img;
    return imgSide;
  }
  function renderSingleView() {
    if (masterSelectedImages.size > 1 && !seqActive) {
      renderMultiCompareView();
      return;
    }
    if (seqActive) {
      const seqEntry = seqQueue[seqIdx];
      if (!seqEntry) {
        exitSequentialDetail();
      } else {
        singleNav.style.display = "none";
        singleViewEl.innerHTML = "";
        const entry = seqEntry;
        const wrap2 = document.createElement("div");
        wrap2.className = "single-wrap";
        const seqSide = buildSingleImgSide(entry, void 0, { clampPan: true });
        seqSide.style.minHeight = "0";
        const imgCol = document.createElement("div");
        imgCol.style.cssText = "flex:1; min-width:0; display:flex; flex-direction:column; gap:8px;";
        imgCol.appendChild(seqSide);
        const nameEl2 = document.createElement("div");
        nameEl2.className = "single-name";
        nameEl2.style.cssText = "padding:0 2px;";
        nameEl2.textContent = entry.imgName + (entry.width ? ` \xB7 ${entry.width}\xD7${entry.height}` : "");
        imgCol.appendChild(nameEl2);
        const previewBox = document.createElement("div");
        previewBox.style.cssText = "border:1px solid var(--border-soft); border-radius:8px; padding:8px 10px; background:var(--bg-panel);";
        const previewHead = document.createElement("div");
        previewHead.style.cssText = "font-size:12px; color:var(--text-faint); margin-bottom:6px;";
        const previewChips = document.createElement("div");
        previewChips.className = "chiprow";
        previewChips.style.cssText = "max-height:110px; overflow-y:auto;";
        previewBox.appendChild(previewHead);
        previewBox.appendChild(previewChips);
        imgCol.appendChild(previewBox);
        wrap2.appendChild(imgCol);
        let seqDownX = 0, seqDownY = 0;
        const seqImg = seqSide.querySelector("img");
        if (seqImg) {
          seqImg.addEventListener("pointerdown", (ev) => {
            seqDownX = ev.clientX;
            seqDownY = ev.clientY;
          });
          seqImg.addEventListener("click", (ev) => {
            if (Math.hypot(ev.clientX - seqDownX, ev.clientY - seqDownY) > 6) return;
            showImageLightbox(entry.objectUrl);
          });
        }
        const panel2 = document.createElement("div");
        panel2.className = "single-panel seq-panel";
        panel2.style.position = "relative";
        const headRow = document.createElement("div");
        headRow.style.cssText = "display:flex; align-items:center; gap:8px;";
        const posEl = document.createElement("span");
        posEl.className = "single-pos";
        posEl.style.flex = "1";
        posEl.textContent = `${seqIdx + 1} / ${seqQueue.length}`;
        const exitBtn = document.createElement("button");
        exitBtn.textContent = "Exit sequential";
        exitBtn.title = "Leave sequential review (progress is already saved per Confirm)";
        exitBtn.addEventListener("click", () => exitSequentialDetail());
        let backBtn = null;
        if (seqIdx > 0) {
          backBtn = document.createElement("button");
          backBtn.textContent = "\u2190 Back";
          backBtn.title = "Go back to the previous image (selections already applied by Confirm are saved)";
          backBtn.addEventListener("click", () => {
            seqIdx--;
            renderSingleView();
          });
        }
        headRow.appendChild(posEl);
        if (backBtn) headRow.appendChild(backBtn);
        headRow.appendChild(exitBtn);
        panel2.appendChild(headRow);
        buildSequentialPanel(panel2, entry, (tags) => {
          const fresh = new Set(tags.filter((t) => !entry.tags.includes(t)));
          previewHead.textContent = `Will apply on Confirm \u2014 ${tags.length} tags${fresh.size ? ` (${fresh.size} new)` : ""}`;
          previewChips.innerHTML = "";
          if (!tags.length) {
            const none = document.createElement("span");
            none.style.cssText = "font-size:12px; color:var(--text-faint);";
            none.textContent = "No indicator tags selected \u2014 Confirm will assert none.";
            previewChips.appendChild(none);
            return;
          }
          for (const t of tags) {
            const chip = document.createElement("span");
            chip.className = "chip chip-static" + (fresh.has(t) ? " chip-match" : "");
            const label = document.createElement("span");
            label.textContent = t;
            label.title = fresh.has(t) ? "New \u2014 will be added on Confirm" : "Already on this image";
            chip.appendChild(label);
            previewChips.appendChild(chip);
          }
        });
        wrap2.appendChild(panel2);
        singleViewEl.appendChild(wrap2);
        return;
      }
    }
    const list = filteredEntries();
    if (singleIndex >= list.length) singleIndex = list.length - 1;
    if (singleIndex < 0) singleIndex = 0;
    singlePos.textContent = list.length ? `${singleIndex + 1} / ${list.length}` : "0 / 0";
    singlePrevBtn.disabled = list.length === 0 || singleIndex <= 0;
    singleNextBtn.disabled = list.length === 0 || singleIndex >= list.length - 1;
    singleViewEl.innerHTML = "";
    if (list.length === 0) {
      const empty = document.createElement("div");
      empty.className = "single-empty";
      empty.textContent = "No images match the current filter.";
      singleViewEl.appendChild(empty);
      return;
    }
    const e = list[singleIndex];
    if (e.base !== lastSingleBase) {
      singleZoom = 100;
      singlePanX = 0;
      singlePanY = 0;
      lastSingleBase = e.base;
    }
    const wrap = document.createElement("div");
    wrap.className = "single-wrap";
    wrap.appendChild(buildSingleImgSide(e, { setZoomUI: (z) => {
      zoomSlider.value = String(z);
      zoomVal.textContent = z + "%";
    } }));
    const panel = document.createElement("div");
    panel.className = "single-panel";
    const nameEl = document.createElement("div");
    nameEl.className = "single-name";
    nameEl.textContent = e.imgName + (e.width ? ` \xB7 ${e.width}\xD7${e.height}` : "") + ` \xB7 ${e.tags.length} tags`;
    panel.appendChild(nameEl);
    const zoomRow = document.createElement("div");
    zoomRow.className = "modal-zoom-row";
    zoomRow.style.cssText = "display:flex; gap:8px; align-items:center;";
    const zoomLabel = document.createElement("span");
    zoomLabel.style.cssText = "font-size:11px; color:var(--text-faint);";
    zoomLabel.textContent = "Zoom";
    const zoomSlider = document.createElement("input");
    zoomSlider.type = "range";
    zoomSlider.min = "100";
    zoomSlider.max = "400";
    zoomSlider.step = "10";
    zoomSlider.value = String(singleZoom);
    zoomSlider.style.flex = "1";
    const zoomVal = document.createElement("span");
    zoomVal.style.cssText = "font-family:var(--mono); font-size:11px; min-width:42px; text-align:right;";
    zoomVal.textContent = singleZoom + "%";
    zoomSlider.addEventListener("input", () => {
      singleZoom = parseInt(zoomSlider.value, 10);
      zoomVal.textContent = singleZoom + "%";
      applySingleTransform();
      if (singleZoom > (folderStats.zoom_max || 0)) {
        folderStats.zoom_max = singleZoom;
        saveFolderStats();
        checkAchievements();
      }
    });
    const zoomResetBtn = document.createElement("button");
    zoomResetBtn.textContent = "Reset";
    zoomResetBtn.addEventListener("click", () => {
      singleZoom = 100;
      singlePanX = 0;
      singlePanY = 0;
      zoomSlider.value = "100";
      zoomVal.textContent = "100%";
      applySingleTransform();
    });
    zoomRow.appendChild(zoomLabel);
    zoomRow.appendChild(zoomSlider);
    zoomRow.appendChild(zoomVal);
    zoomRow.appendChild(zoomResetBtn);
    panel.appendChild(zoomRow);
    const zoomHint = document.createElement("div");
    zoomHint.style.cssText = "font-size:10.5px; color:var(--text-faint);";
    zoomHint.textContent = "Click and drag (either button) to pan. Scroll the mouse wheel over the image to zoom.";
    panel.appendChild(zoomHint);
    if (e.disabled) {
      const badge = document.createElement("div");
      badge.className = "single-disabled-badge";
      badge.textContent = "Disabled \u2014 hidden from active dataset";
      panel.appendChild(badge);
    }
    if (e.meta && e.meta.noteAlwaysVisible && e.meta.note) {
      const noteVis = document.createElement("div");
      noteVis.className = "card-note-visible";
      noteVis.textContent = e.meta.note;
      panel.appendChild(noteVis);
    }
    const singleTagIndex = buildTagIndex();
    const chiprow = document.createElement("div");
    chiprow.className = "chiprow";
    for (const tag of orderedTagsForDisplay(e, singleTagIndex)) {
      chiprow.appendChild(buildChip2(e, tag, () => {
        renderSingleView();
        refreshRightPanels();
        refreshStats();
      }, singleTagIndex));
    }
    panel.appendChild(chiprow);
    const addInput = document.createElement("input");
    addInput.type = "text";
    addInput.className = "addtag-input";
    addInput.placeholder = "+ Add tag, press Enter";
    addInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && addInput.value.trim()) {
        addTagToEntry(e, addInput.value.trim());
        addInput.value = "";
        closeAutocomplete();
        renderSingleView();
        refreshRightPanels();
      }
    });
    attachTagAutocomplete(addInput, () => e, () => {
      renderSingleView();
      refreshRightPanels();
    });
    panel.appendChild(addInput);
    const btnRow = document.createElement("div");
    btnRow.className = "single-btn-row";
    const toggleBtn = document.createElement("button");
    if (e.disabled) {
      toggleBtn.textContent = "Restore to dataset";
      toggleBtn.className = "primary";
    } else {
      toggleBtn.textContent = "Disable (move to /Disabled)";
      toggleBtn.className = "danger-ghost";
    }
    toggleBtn.addEventListener("click", () => moveEntry(e, !e.disabled));
    btnRow.appendChild(toggleBtn);
    panel.appendChild(btnRow);
    wrap.appendChild(panel);
    singleViewEl.appendChild(wrap);
  }
  function computeIsolatedTagSet(tagIndex) {
    const set = /* @__PURE__ */ new Set();
    for (const [tag, imgs] of tagIndex) {
      if (imgs.size <= 2) set.add(tag);
    }
    return set;
  }
  function orderedTagsForDisplay(entry, tagIndex) {
    let tags = entry.tags.slice();
    const cardTagSortMode = getCardTagSortMode();
    if (cardTagSortMode === "alphabetical") {
      tags.sort((a, b) => a.localeCompare(b));
    } else if (cardTagSortMode === "frequency" && tagIndex) {
      tags.sort((a, b) => (tagIndex.get(b) ? tagIndex.get(b).size : 0) - (tagIndex.get(a) ? tagIndex.get(a).size : 0));
    }
    const searchTerms = getGalleryFilter2().terms || [];
    const isolatedSet = getIsolatedFlagActive() && tagIndex ? computeIsolatedTagSet(tagIndex) : null;
    if (searchTerms.length || isolatedSet) {
      const matched = [], isolated = [], rest = [];
      for (const t of tags) {
        const lower = t.toLowerCase();
        const isSearchMatch = searchTerms.some((term) => lower === term);
        const isIsolated = isolatedSet && isolatedSet.has(t);
        if (isSearchMatch) matched.push(t);
        else if (isIsolated) isolated.push(t);
        else rest.push(t);
      }
      tags = matched.concat(isolated, rest);
    }
    return tags;
  }
  function tagDisplayFlags(tag, tagIndex) {
    const searchTerms = getGalleryFilter2().terms || [];
    const lower = tag.toLowerCase();
    const isMatch = searchTerms.some((term) => lower === term);
    const isIsolated = !!(getIsolatedFlagActive() && tagIndex && (tagIndex.get(tag) ? tagIndex.get(tag).size <= 2 : false));
    return { isMatch, isIsolated };
  }
  function buildChip2(entry, tag, onChange, tagIndex) {
    const chip = document.createElement("span");
    chip.className = "chip";
    const isFlaggedForReview = entry.meta && entry.meta.flaggedTags && entry.meta.flaggedTags.includes(tag);
    if (isFlaggedForReview) {
      chip.classList.add("chip-flagged-review");
    } else if (tagIndex) {
      const flags = tagDisplayFlags(tag, tagIndex);
      if (flags.isMatch) chip.classList.add("chip-match");
      else if (flags.isIsolated) chip.classList.add("chip-isolated");
    }
    const label = document.createElement("span");
    label.textContent = tag;
    label.title = "Click (or right-click) for tag options, double-click to edit";
    label.style.cursor = "pointer";
    let clickTimer = null;
    label.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const x = ev.clientX, y = ev.clientY;
      if (clickTimer) clearTimeout(clickTimer);
      clickTimer = setTimeout(() => {
        clickTimer = null;
        openTagContextMenu(entry, tag, x, y);
      }, 220);
    });
    label.addEventListener("dblclick", (ev) => {
      ev.stopPropagation();
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
      }
      closeTagContextMenu();
      startInlineTagRename(chip, label, entry, tag, onChange);
    });
    label.addEventListener("contextmenu", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
      }
      openTagContextMenu(entry, tag, ev.clientX, ev.clientY);
    });
    attachLongPress(label, (ev) => openTagContextMenu(entry, tag, ev.clientX, ev.clientY));
    const rm = document.createElement("button");
    rm.textContent = "\xD7";
    rm.title = "Remove this tag from this image";
    rm.addEventListener("click", (ev) => {
      ev.stopPropagation();
      removeTagFromEntry(entry, tag);
      onChange();
    });
    chip.appendChild(label);
    chip.appendChild(rm);
    return chip;
  }
  function renameTagOnEntry(entry, oldTag, newTag) {
    if (!entry.tags.includes(oldTag) || oldTag === newTag) return false;
    const prevTags = entry.tags.slice();
    let newTags = entry.tags.map((t) => t === oldTag ? newTag : t);
    newTags = Array.from(new Set(newTags));
    entry.tags = newTags;
    markDirty(entry);
    const summary = `Renamed "${oldTag}" \u2192 "${newTag}" on ${entry.imgName}.`;
    recordChange("rename", summary, [{ base: entry.base, prevTags, newTags: newTags.slice() }]);
    trackStat("renames");
    checkAchievements();
    return true;
  }
  function startInlineTagRename(chip, label, entry, tag, onChange) {
    const input = document.createElement("input");
    input.type = "text";
    input.className = "chip-rename-input";
    input.value = tag;
    chip.replaceChild(input, label);
    input.focus();
    input.select();
    let done = false;
    function commit() {
      if (done) return;
      done = true;
      const cleaned = input.value.trim().replace(/_/g, " ").replace(/\s+/g, " ");
      if (cleaned && cleaned !== tag) renameTagOnEntry(entry, tag, cleaned);
      onChange();
    }
    input.addEventListener("click", (ev) => ev.stopPropagation());
    input.addEventListener("keydown", (ev) => {
      ev.stopPropagation();
      if (ev.key === "Enter") {
        ev.preventDefault();
        commit();
      } else if (ev.key === "Escape") {
        ev.preventDefault();
        done = true;
        onChange();
      }
    });
    input.addEventListener("blur", commit);
  }
  var modalZoom = 100;
  var modalPanX = 0;
  var modalPanY = 0;
  var modalCloseTimer = null;
  var modalLayerTimer = null;
  var currentModalBase = null;
  function openImageCardModal(entry, opts) {
    const isHoverPreview = !!(opts && opts.hover);
    if (modalCloseTimer) {
      clearTimeout(modalCloseTimer);
      modalCloseTimer = null;
    }
    closeTagContextMenu();
    if (currentModalBase !== entry.base) {
      modalZoom = 100;
      modalPanX = 0;
      modalPanY = 0;
      renderImageCardModal(entry);
      currentModalBase = entry.base;
    }
    imageCardModal.style.display = "flex";
    imageCardModal.classList.add("modal-anim-layers");
    if (modalLayerTimer) clearTimeout(modalLayerTimer);
    modalLayerTimer = setTimeout(() => {
      modalLayerTimer = null;
      imageCardModal.classList.remove("modal-anim-layers");
    }, 240);
    requestAnimationFrame(() => requestAnimationFrame(() => imageCardModal.classList.add("modal-visible")));
    if (!isHoverPreview) {
      folderStats.card_modal_opens = (folderStats.card_modal_opens || 0) + 1;
      saveFolderStats();
      checkAchievements();
    }
  }
  function closeImageCardModal() {
    if (modalCloseTimer) clearTimeout(modalCloseTimer);
    imageCardModal.classList.remove("modal-visible");
    modalCloseTimer = setTimeout(() => {
      imageCardModal.style.display = "none";
      modalCardInner.innerHTML = "";
      currentModalBase = null;
      modalCloseTimer = null;
    }, 180);
  }
  function pixelEditMime(name) {
    const lower = (name || "").toLowerCase();
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
    if (lower.endsWith(".webp")) return "image/webp";
    return null;
  }
  function canvasToBlob(canvas, mime) {
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), mime, 0.95));
  }
  async function commitPixelEdit(entry, canvas, mime, op, summary) {
    const blob = await canvasToBlob(canvas, mime);
    if (!blob) {
      toast("Could not encode the edited image.", 3600);
      return false;
    }
    let prevBytes;
    try {
      prevBytes = new Uint8Array(await (await entry.imgHandle.getFile()).arrayBuffer());
    } catch (err) {
      toast(`Could not read the image: ${err?.message || err}`, 4200);
      return false;
    }
    const prevW = entry.width || 0, prevH = entry.height || 0;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    try {
      const writable = await entry.imgHandle.createWritable();
      await writable.write(bytes);
      await writable.close();
    } catch (err) {
      toast(`Could not save the edited image: ${err?.message || err}`, 4200);
      return false;
    }
    try {
      URL.revokeObjectURL(entry.objectUrl);
    } catch {
    }
    entry.objectUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
    entry.width = canvas.width;
    entry.height = canvas.height;
    recordPixelChange(op, summary, entry.base, {
      prev: prevBytes,
      next: bytes,
      prevW,
      prevH,
      nextW: canvas.width,
      nextH: canvas.height,
      mime
    });
    renderImageCardModal(entry);
    renderCurrentView();
    return true;
  }
  async function rotateEntryImage(entry, dir) {
    const mime = pixelEditMime(entry.imgName || "");
    if (!mime) {
      toast("Rotation is supported for PNG, JPG, and WebP images.", 3600);
      return;
    }
    const ok = await showConfirmModal(
      `Rotate ${entry.imgName} 90\xB0 ${dir === 1 ? "clockwise" : "counter-clockwise"}? This rewrites the image file.`,
      { okLabel: "Rotate", danger: true }
    );
    if (!ok) return;
    let bmp;
    try {
      bmp = await createImageBitmap(await entry.imgHandle.getFile());
    } catch (err) {
      toast(`Could not read the image: ${err?.message || err}`, 4200);
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = bmp.height;
    canvas.height = bmp.width;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bmp.close();
      toast("Could not edit the image on this machine.", 3600);
      return;
    }
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(dir * Math.PI / 2);
    ctx.drawImage(bmp, -bmp.width / 2, -bmp.height / 2);
    bmp.close();
    if (await commitPixelEdit(entry, canvas, mime, "rotate-image", `Rotated ${entry.imgName} 90\xB0 ${dir === 1 ? "clockwise" : "counter-clockwise"}`)) toast("Rotated. Undo is in the toolbar or Log.", 2600);
  }
  function startCropMode(entry, imgSide, img, editRow, zoomRow) {
    const mime = pixelEditMime(entry.imgName || "");
    if (!mime) {
      toast("Cropping is supported for PNG, JPG, and WebP images.", 3600);
      return;
    }
    modalZoom = 100;
    modalPanX = 0;
    modalPanY = 0;
    img.style.transform = "";
    editRow.style.display = "none";
    zoomRow.style.display = "none";
    const overlay = document.createElement("div");
    overlay.style.cssText = "position:absolute; inset:0; cursor:crosshair; touch-action:none; z-index:5;";
    const sel = document.createElement("div");
    sel.style.cssText = "position:absolute; display:none; border:2px solid #7c6bff; box-shadow:0 0 0 9999px rgba(0,0,0,0.55); cursor:move;";
    const grip = document.createElement("div");
    grip.style.cssText = "position:absolute; right:-7px; bottom:-7px; width:14px; height:14px; background:#7c6bff; border-radius:50%; cursor:nwse-resize;";
    sel.appendChild(grip);
    overlay.appendChild(sel);
    const bar = document.createElement("div");
    bar.style.cssText = "position:absolute; left:8px; bottom:8px; display:flex; gap:8px;";
    const applyBtn = document.createElement("button");
    applyBtn.textContent = "Apply crop";
    const isolateBtn = document.createElement("button");
    isolateBtn.textContent = "Isolate";
    isolateBtn.title = "Save the selected region as a new image in this dataset (source untouched)";
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    bar.appendChild(applyBtn);
    bar.appendChild(isolateBtn);
    bar.appendChild(cancelBtn);
    overlay.appendChild(bar);
    imgSide.appendChild(overlay);
    let mode = "idle";
    let startX = 0, startY = 0;
    let selStart = { x: 0, y: 0, w: 0, h: 0 };
    let sx = 0, sy = 0, sw = 0, sh = 0;
    function paintSel() {
      const r = img.getBoundingClientRect(), s = imgSide.getBoundingClientRect();
      if (sw < 2 || sh < 2) {
        sel.style.display = "none";
        return;
      }
      sel.style.display = "block";
      sel.style.left = r.left - s.left + sx + "px";
      sel.style.top = r.top - s.top + sy + "px";
      sel.style.width = sw + "px";
      sel.style.height = sh + "px";
    }
    function toLocal(ev) {
      const r = img.getBoundingClientRect();
      return {
        x: Math.max(0, Math.min(r.width, ev.clientX - r.left)),
        y: Math.max(0, Math.min(r.height, ev.clientY - r.top))
      };
    }
    function cleanup() {
      overlay.remove();
      editRow.style.display = "";
      zoomRow.style.display = "";
    }
    async function renderCropCanvas() {
      const r = img.getBoundingClientRect();
      if (sw < 8 || sh < 8 || !r.width || !r.height) {
        toast("Draw a region first.", 2600);
        return null;
      }
      const kx = img.naturalWidth / r.width, ky = img.naturalHeight / r.height;
      const nx = Math.round(sx * kx), ny = Math.round(sy * ky);
      const nw = Math.round(sw * kx), nh = Math.round(sh * ky);
      let bmp;
      try {
        bmp = await createImageBitmap(await entry.imgHandle.getFile());
      } catch (err) {
        toast(`Could not read the image: ${err?.message || err}`, 4200);
        return null;
      }
      const canvas = document.createElement("canvas");
      canvas.width = nw;
      canvas.height = nh;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        bmp.close();
        toast("Could not edit the image on this machine.", 3600);
        return null;
      }
      ctx.drawImage(bmp, nx, ny, nw, nh, 0, 0, nw, nh);
      bmp.close();
      const mt = pixelEditMime(entry.imgName || "");
      if (!mt) {
        toast("Cropping is supported for PNG, JPG, and WebP images.", 3600);
        return null;
      }
      return { canvas, nw, nh, mime: mt };
    }
    async function applyCrop() {
      const rendered = await renderCropCanvas();
      if (!rendered) return;
      cleanup();
      if (await commitPixelEdit(entry, rendered.canvas, rendered.mime, "crop-image", `Cropped ${entry.imgName} to ${rendered.nw}\xD7${rendered.nh}`)) toast("Cropped. Undo is in the toolbar or Log.", 2600);
    }
    async function isolateSelection() {
      const dir = getDirHandleRef();
      if (!dir) {
        toast("Open a dataset folder first.", 2600);
        return;
      }
      const rendered = await renderCropCanvas();
      if (!rendered) return;
      const blob = await canvasToBlob(rendered.canvas, rendered.mime);
      if (!blob) {
        toast("Could not encode the edited image.", 3600);
        return;
      }
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const dot = (entry.imgName || "").lastIndexOf(".");
      const ext = dot >= 0 ? (entry.imgName || "").slice(dot) : ".png";
      let base = "", imgName = "";
      for (let n = 1; ; n++) {
        base = `${entry.base}_isolate${n}`;
        imgName = `${base}${ext}`;
        try {
          await dir.getFileHandle(imgName);
        } catch {
          break;
        }
      }
      const tags = (entry.tags || []).slice();
      try {
        const imgHandle = await dir.getFileHandle(imgName, { create: true });
        const iw = await imgHandle.createWritable();
        await iw.write(bytes);
        await iw.close();
        const txtHandle = await dir.getFileHandle(`${base}.txt`, { create: true });
        const tw = await txtHandle.createWritable();
        await tw.write(tags.map((t) => t.replace(/ /g, "_")).join(","));
        await tw.close();
        const created = await addEntryFromNewFileRef(base, imgHandle, imgName, txtHandle, true, tags, false);
        if (created) markDirty(created);
      } catch (err) {
        toast(`Could not save the isolated image: ${err?.message || err}`, 4200);
        return;
      }
      recordIsolateChange(`Isolated region of ${entry.imgName} as ${imgName}`, base, {
        bytes,
        mime: rendered.mime,
        tags,
        imgName,
        width: rendered.nw,
        height: rendered.nh
      });
      cleanup();
      renderCurrentView();
      toast(`Isolated as ${imgName}. Undo is in the toolbar or Log.`, 2600);
    }
    overlay.addEventListener("pointerdown", (ev) => {
      ev.stopPropagation();
      if (ev.target.closest("button")) return;
      ev.preventDefault();
      try {
        overlay.setPointerCapture(ev.pointerId);
      } catch {
      }
      const p = toLocal(ev);
      const onGrip = ev.target === grip;
      const inside = sw > 2 && sh > 2 && p.x >= sx && p.x <= sx + sw && p.y >= sy && p.y <= sy + sh;
      mode = onGrip ? "resize" : inside ? "move" : "draw";
      startX = p.x;
      startY = p.y;
      selStart = { x: sx, y: sy, w: sw, h: sh };
      if (mode === "draw") {
        sx = p.x;
        sy = p.y;
        sw = 0;
        sh = 0;
      }
    });
    overlay.addEventListener("pointermove", (ev) => {
      if (mode === "idle") return;
      ev.stopPropagation();
      const p = toLocal(ev);
      const r = img.getBoundingClientRect();
      if (mode === "draw") {
        sx = Math.min(startX, p.x);
        sy = Math.min(startY, p.y);
        sw = Math.abs(p.x - startX);
        sh = Math.abs(p.y - startY);
      } else if (mode === "move") {
        sx = Math.max(0, Math.min(r.width - selStart.w, selStart.x + (p.x - startX)));
        sy = Math.max(0, Math.min(r.height - selStart.h, selStart.y + (p.y - startY)));
        sw = selStart.w;
        sh = selStart.h;
      } else {
        sw = Math.max(0, Math.min(r.width - selStart.x, p.x - selStart.x));
        sh = Math.max(0, Math.min(r.height - selStart.y, p.y - selStart.y));
      }
      paintSel();
    });
    function endGesture(ev) {
      if (mode === "idle") return;
      mode = "idle";
      try {
        overlay.releasePointerCapture(ev.pointerId);
      } catch {
      }
    }
    overlay.addEventListener("pointerup", endGesture);
    overlay.addEventListener("pointercancel", endGesture);
    overlay.addEventListener("wheel", (ev) => ev.stopPropagation(), { passive: true });
    cancelBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      cleanup();
    });
    applyBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      void applyCrop();
    });
    isolateBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      void isolateSelection();
    });
  }
  function renderImageCardModal(entry) {
    modalCardInner.innerHTML = "";
    const imgSide = document.createElement("div");
    imgSide.className = "single-img-side";
    imgSide.style.position = "relative";
    imgSide.style.overflow = "hidden";
    imgSide.style.flex = "1";
    const img = document.createElement("img");
    img.src = entry.objectUrl;
    img.draggable = false;
    img.style.transformOrigin = "center center";
    img.style.cursor = "grab";
    function applyModalTransform() {
      img.style.transform = `translate(${modalPanX}px, ${modalPanY}px) scale(${modalZoom / 100})`;
    }
    applyModalTransform();
    imgSide.appendChild(img);
    const isTouchDevice2 = document.documentElement.classList.contains("touch-device");
    if (isTouchDevice2) {
      imgSide.style.cursor = "zoom-in";
      imgSide.addEventListener("click", () => showImageLightbox(entry.objectUrl));
    } else {
      let panning = false, sx = 0, sy = 0, ox = 0, oy = 0;
      imgSide.addEventListener("contextmenu", (ev) => ev.preventDefault());
      imgSide.addEventListener("pointerdown", (ev) => {
        if (ev.button === 0 || ev.button === 2) {
          panning = true;
          sx = ev.clientX;
          sy = ev.clientY;
          ox = modalPanX;
          oy = modalPanY;
          imgSide.setPointerCapture(ev.pointerId);
          img.style.cursor = "grabbing";
          ev.preventDefault();
        }
      });
      imgSide.addEventListener("pointermove", (ev) => {
        if (panning) {
          modalPanX = ox + (ev.clientX - sx);
          modalPanY = oy + (ev.clientY - sy);
          applyModalTransform();
        }
      });
      imgSide.addEventListener("pointerup", (ev) => {
        if (panning) {
          panning = false;
          img.style.cursor = "grab";
          try {
            imgSide.releasePointerCapture(ev.pointerId);
          } catch (err) {
          }
        }
      });
      imgSide.addEventListener("wheel", (ev) => {
        ev.preventDefault();
        modalZoom = Math.max(100, Math.min(400, modalZoom + (ev.deltaY < 0 ? 20 : -20)));
        zoomSlider.value = String(modalZoom);
        zoomVal.textContent = modalZoom + "%";
        applyModalTransform();
      }, { passive: false });
      attachPinchZoom(imgSide, (delta) => {
        modalZoom = Math.max(100, Math.min(400, modalZoom + delta));
        zoomSlider.value = String(modalZoom);
        zoomVal.textContent = modalZoom + "%";
        applyModalTransform();
      });
    }
    const panel = document.createElement("div");
    panel.className = "single-panel";
    panel.style.position = "relative";
    const closeBtn = document.createElement("button");
    closeBtn.className = "modal-close-btn ghost-close";
    closeBtn.textContent = "\u2715 Close";
    closeBtn.addEventListener("click", closeImageCardModal);
    panel.appendChild(closeBtn);
    const nameText = entry.imgName + (entry.width ? ` \xB7 ${entry.width}\xD7${entry.height}` : "") + ` \xB7 ${entry.tags.length} tags`;
    const infoBtn = document.createElement("button");
    infoBtn.className = "modal-info-btn ghost-close";
    infoBtn.textContent = "\u24D8";
    infoBtn.title = "Image info";
    infoBtn.addEventListener("click", () => showInfoModal(`<p>${escapeHtml(nameText)}</p>`, "Image info"));
    panel.appendChild(infoBtn);
    const nameEl = document.createElement("div");
    nameEl.className = "single-name";
    nameEl.textContent = nameText;
    panel.appendChild(nameEl);
    const statusRow = document.createElement("div");
    statusRow.className = "modal-status-row";
    for (const { emoji, state, label, matchedTags } of getEntryStatusIndicators(entry)) {
      const stateText = state === null ? "Not indicated" : state ? "Yes" : "No";
      const badge = document.createElement("span");
      badge.className = "modal-status-badge";
      badge.textContent = `${emoji} ${label}: ${stateText}`;
      badge.title = matchedTags.length ? matchedTags.join(", ") : "";
      statusRow.appendChild(badge);
    }
    panel.appendChild(statusRow);
    const modalNavList = filteredEntries();
    const modalNavIdx = modalNavList.findIndex((x) => x.base === entry.base);
    if (modalNavList.length > 1 && modalNavIdx !== -1) {
      const navRow = document.createElement("div");
      navRow.className = "modal-card-nav";
      const prevBtn = document.createElement("button");
      prevBtn.textContent = "\u2039 Prev";
      prevBtn.disabled = modalNavIdx <= 0;
      prevBtn.addEventListener("click", () => openImageCardModal(modalNavList[modalNavIdx - 1]));
      const posEl = document.createElement("span");
      posEl.className = "single-pos";
      posEl.textContent = `${modalNavIdx + 1} / ${modalNavList.length}`;
      const nextBtn = document.createElement("button");
      nextBtn.textContent = "Next \u203A";
      nextBtn.disabled = modalNavIdx >= modalNavList.length - 1;
      nextBtn.addEventListener("click", () => openImageCardModal(modalNavList[modalNavIdx + 1]));
      navRow.appendChild(prevBtn);
      navRow.appendChild(posEl);
      navRow.appendChild(nextBtn);
      panel.appendChild(navRow);
    }
    const zoomRow = document.createElement("div");
    zoomRow.className = "modal-zoom-row";
    zoomRow.style.cssText = "display:flex; gap:8px; align-items:center;";
    const zoomSlider = document.createElement("input");
    zoomSlider.type = "range";
    zoomSlider.min = "100";
    zoomSlider.max = "400";
    zoomSlider.step = "10";
    zoomSlider.value = String(modalZoom);
    zoomSlider.style.flex = "1";
    const zoomVal = document.createElement("span");
    zoomVal.style.cssText = "font-family:var(--mono); font-size:11px; min-width:42px; text-align:right;";
    zoomVal.textContent = modalZoom + "%";
    zoomSlider.addEventListener("input", () => {
      modalZoom = parseInt(zoomSlider.value, 10);
      zoomVal.textContent = modalZoom + "%";
      applyModalTransform();
    });
    const resetBtn = document.createElement("button");
    resetBtn.textContent = "Reset";
    resetBtn.addEventListener("click", () => {
      modalZoom = 100;
      modalPanX = 0;
      modalPanY = 0;
      zoomSlider.value = "100";
      zoomVal.textContent = "100%";
      applyModalTransform();
    });
    zoomRow.appendChild(zoomSlider);
    zoomRow.appendChild(zoomVal);
    zoomRow.appendChild(resetBtn);
    panel.appendChild(zoomRow);
    if (!isTouchDevice2) {
      const editRow = document.createElement("div");
      editRow.className = "modal-edit-row";
      editRow.style.cssText = "display:flex; gap:8px; align-items:center;";
      const rotLeftBtn = document.createElement("button");
      rotLeftBtn.textContent = "\u27F2 Rotate";
      rotLeftBtn.title = "Rotate 90\xB0 counter-clockwise (rewrites the file)";
      rotLeftBtn.addEventListener("click", () => {
        void rotateEntryImage(entry, -1);
      });
      const rotRightBtn = document.createElement("button");
      rotRightBtn.textContent = "\u27F3 Rotate";
      rotRightBtn.title = "Rotate 90\xB0 clockwise (rewrites the file)";
      rotRightBtn.addEventListener("click", () => {
        void rotateEntryImage(entry, 1);
      });
      const cropBtn = document.createElement("button");
      cropBtn.textContent = "\u2702 Crop";
      cropBtn.title = "Select a region to keep (rewrites the file)";
      cropBtn.addEventListener("click", () => startCropMode(entry, imgSide, img, editRow, zoomRow));
      editRow.appendChild(rotLeftBtn);
      editRow.appendChild(rotRightBtn);
      editRow.appendChild(cropBtn);
      panel.appendChild(editRow);
    }
    const modalTagIndex = buildTagIndex();
    const addInput = document.createElement("input");
    addInput.type = "text";
    addInput.className = "addtag-input";
    addInput.placeholder = "+ Add tag, press Enter";
    addInput.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && addInput.value.trim()) {
        addTagToEntry(entry, addInput.value.trim());
        addInput.value = "";
        closeAutocomplete();
        renderImageCardModal(entry);
        renderCurrentView();
        refreshRightPanels();
      }
    });
    attachTagAutocomplete(addInput, () => entry, () => {
      renderImageCardModal(entry);
      renderCurrentView();
    });
    panel.appendChild(addInput);
    const chiprow = document.createElement("div");
    chiprow.className = "chiprow";
    for (const tag of orderedTagsForDisplay(entry, modalTagIndex)) {
      chiprow.appendChild(buildChip2(entry, tag, () => {
        renderImageCardModal(entry);
        renderCurrentView();
        refreshRightPanels();
        refreshStats();
      }, modalTagIndex));
    }
    panel.appendChild(chiprow);
    modalCardInner.appendChild(imgSide);
    modalCardInner.appendChild(panel);
  }
  function tokenizeTag(tag) {
    const parts = tag.split(/[\s_\-]+/).map((p) => p.trim()).filter(Boolean);
    const uniq = Array.from(new Set(parts));
    return uniq.length > 1 ? uniq : [];
  }
  function addCtxItem(menu, label, onClick) {
    const btn = document.createElement("button");
    btn.className = "ctx-item";
    btn.textContent = label;
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      onClick(ev);
    });
    menu.appendChild(btn);
  }
  function openTagContextMenu(entry, tag, x, y) {
    closeTagContextMenu();
    const index = buildTagIndex();
    const set = index.get(tag) || /* @__PURE__ */ new Set();
    const menu = document.createElement("div");
    menu.className = "ctx-menu";
    const header = document.createElement("div");
    header.className = "ctx-header";
    header.textContent = `${tag} \xB7 ${set.size} image${set.size === 1 ? "" : "s"}`;
    menu.appendChild(header);
    addCtxItem(menu, "Show all images WITH this tag", () => {
      setContainsFilter2(tag);
      closeTagContextMenu();
    });
    addCtxItem(menu, "Show all images WITHOUT this tag", () => {
      setExcludesFilter2(tag);
      closeTagContextMenu();
    });
    addCtxItem(menu, "\u{1F4D6} Tag Details", () => {
      closeTagContextMenu();
      openTagDetails(tag);
    });
    if (entry) {
      const renameSep = document.createElement("div");
      renameSep.className = "ctx-sep";
      renameSep.textContent = "Rename on this image:";
      menu.appendChild(renameSep);
      const renameRow = document.createElement("div");
      renameRow.className = "ctx-rename-row";
      const renameInput = document.createElement("input");
      renameInput.type = "text";
      renameInput.value = tag;
      renameInput.addEventListener("click", (ev) => ev.stopPropagation());
      renameInput.addEventListener("keydown", (ev) => {
        ev.stopPropagation();
        if (ev.key === "Enter") {
          const cleaned = renameInput.value.trim().replace(/_/g, " ").replace(/\s+/g, " ");
          if (cleaned && cleaned !== tag) renameTagOnEntry(entry, tag, cleaned);
          closeTagContextMenu();
          refreshAllUIRef7();
        }
      });
      renameRow.appendChild(renameInput);
      menu.appendChild(renameRow);
      const flagged = entry.meta && entry.meta.flaggedTags && entry.meta.flaggedTags.includes(tag);
      addCtxItem(menu, flagged ? "\u{1F6A9} Unflag this tag on this image" : "\u{1F6A9} Flag this tag for review (this image)", () => {
        if (!entry.meta) entry.meta = {};
        if (!entry.meta.flaggedTags) entry.meta.flaggedTags = [];
        if (flagged) entry.meta.flaggedTags = entry.meta.flaggedTags.filter((t) => t !== tag);
        else entry.meta.flaggedTags.push(tag);
        getEntryMeta2()[entry.base] = entry.meta;
        saveEntryMetaRef2();
        closeTagContextMenu();
        renderCurrentView();
      });
    }
    const words = tokenizeTag(tag);
    if (words.length > 1) {
      const sep = document.createElement("div");
      sep.className = "ctx-sep";
      sep.textContent = "View keyword family within this tag:";
      menu.appendChild(sep);
      const wordsRow = document.createElement("div");
      wordsRow.className = "ctx-words";
      for (const w of words) {
        const b = document.createElement("button");
        b.textContent = w;
        b.addEventListener("click", () => {
          setContainsFilter2(w);
          closeTagContextMenu();
        });
        wordsRow.appendChild(b);
      }
      menu.appendChild(wordsRow);
    }
    document.body.appendChild(menu);
    ctxMenuEl = menu;
    positionMenu(menu, x, y);
    setTimeout(() => document.addEventListener("click", onDocClickCloseMenu), 0);
  }
  function onDocClickCloseMenu(ev) {
    if (!ctxMenuEl) return;
    const path = typeof ev.composedPath === "function" ? ev.composedPath() : [];
    if (path.includes(ctxMenuEl)) return;
    closeTagContextMenu();
  }
  function closeTagContextMenu() {
    if (ctxMenuEl) {
      ctxMenuEl.remove();
      ctxMenuEl = null;
    }
    document.removeEventListener("click", onDocClickCloseMenu);
  }
  function getForeignLangTags(entry) {
    return entry.tags.filter((t) => / text$/.test(t) && t !== "text");
  }
  function getEntryStatusIndicators(e) {
    const uncensoredTags = e.tags.filter((t) => /uncensor/i.test(t));
    const censoredTags = e.tags.filter((t) => /censor/i.test(t) && !/uncensor/i.test(t));
    const censored = censoredTags.length ? true : uncensoredTags.length ? false : null;
    const textTags = e.tags.includes("text") ? ["text", ...getForeignLangTags(e)] : getForeignLangTags(e);
    const hasText = textTags.length > 0;
    const perspectiveTags = e.tags.filter((t) => t === "from front" || t === "from side" || t === "from below" || t === "from above" || t === "from behind");
    const perspective = perspectiveTags.length > 0 ? true : null;
    return [
      { emoji: "\u{1F441}\uFE0F", state: censored, label: "Censored", matchedTags: censored ? censoredTags : censored === false ? uncensoredTags : [] },
      { emoji: "\u{1F5E8}\uFE0F", state: hasText, label: "Has text", matchedTags: textTags },
      { emoji: "\u{1F9ED}", state: perspective, label: "Perspective", matchedTags: perspectiveTags }
    ];
  }
  function buildMergeVoidBadgesEl(e) {
    const meta = e.meta || {};
    if (!meta.mergeImmune && !meta.antivoid) return null;
    const wrap = document.createElement("div");
    wrap.className = "mv-badges";
    if (meta.mergeImmune && meta.antivoid) {
      const b = document.createElement("div");
      b.className = "mv-badge";
      b.textContent = "\u270B";
      b.title = "Antimmunized \u2014 exempt from BOTH merge and void rules";
      wrap.appendChild(b);
    } else if (meta.mergeImmune) {
      const b = document.createElement("div");
      b.className = "mv-badge";
      b.textContent = "\u{1F6AB}";
      b.title = "Merge Immunized \u2014 merge rules never rewrite this image's tags";
      wrap.appendChild(b);
    } else {
      const b = document.createElement("div");
      b.className = "mv-badge";
      b.textContent = "\u{1F7E2}";
      b.title = "Antivoid \u2014 void rules never remove tags from this image";
      wrap.appendChild(b);
    }
    return wrap;
  }
  function buildStatusIconsEl(e) {
    const wrap = document.createElement("div");
    wrap.className = "card-status-icons";
    for (const { emoji, state, label, matchedTags } of getEntryStatusIndicators(e)) {
      const glyph = state === null ? "\u2753" : state ? "\u2705" : "\u274C";
      const statusText = state === null ? "Not indicated" : state ? "Yes" : "No";
      const badge = document.createElement("div");
      badge.className = "status-icon-badge";
      badge.textContent = `${emoji}${glyph}`;
      badge.title = `${label}: ${statusText}` + (matchedTags.length ? `: ${matchedTags.join(", ")}` : "");
      wrap.appendChild(badge);
    }
    return wrap;
  }
  function saveCommonLanguages() {
    try {
      localStorage.setItem("dts-common-languages", JSON.stringify(commonLanguages));
    } catch (e) {
    }
  }
  (function loadCommonLanguages() {
    try {
      const saved = JSON.parse(localStorage.getItem("dts-common-languages") || "null");
      if (Array.isArray(saved) && saved.length) commonLanguages = saved;
    } catch (e) {
    }
  })();
  var FLAG_COLORS = ["#e8a33d", "#e2637a", "#6fb8d1", "#7fbf8f", "#a683e0"];
  var KOMA_OPTIONS = ["1koma", "2koma", "3koma", "4koma"];
  function openNoteEditor(entry) {
    if (!entry.meta) entry.meta = {};
    closeTagContextMenu();
    const menu = document.createElement("div");
    menu.className = "ctx-menu";
    menu.style.minWidth = "260px";
    const header = document.createElement("div");
    header.className = "ctx-header";
    header.textContent = `Note \u2014 ${entry.imgName}`;
    menu.appendChild(header);
    const noteArea = document.createElement("textarea");
    noteArea.style.cssText = "width:calc(100% - 16px); margin:0 8px; min-height:80px; background:var(--bg-elevated); color:var(--text-primary); border:1px solid var(--border-strong); border-radius:var(--radius); font-family:var(--sans); font-size:12px; padding:6px;";
    noteArea.value = entry.meta.note || "";
    menu.appendChild(noteArea);
    const visRow = document.createElement("label");
    visRow.className = "ach-toggle-row";
    visRow.style.padding = "6px 8px";
    const visCb = document.createElement("input");
    visCb.type = "checkbox";
    visCb.checked = !!entry.meta.noteAlwaysVisible;
    visRow.appendChild(visCb);
    visRow.appendChild(document.createTextNode(" Always show on card"));
    menu.appendChild(visRow);
    const saveBtn = document.createElement("button");
    saveBtn.className = "primary ctx-item";
    saveBtn.textContent = "Save note";
    saveBtn.addEventListener("click", () => {
      const wasEmpty = !entry.meta.note;
      entry.meta.note = noteArea.value;
      entry.meta.noteAlwaysVisible = visCb.checked;
      getEntryMeta2()[entry.base] = entry.meta;
      saveEntryMetaRef2();
      if (wasEmpty && noteArea.value.trim()) {
        folderStats.notes_written = (folderStats.notes_written || 0) + 1;
        saveFolderStats();
        checkAchievements();
      }
      toast("Note saved.");
      closeTagContextMenu();
      renderCurrentView();
    });
    menu.appendChild(saveBtn);
    document.body.appendChild(menu);
    ctxMenuEl = menu;
    positionMenu(menu, window.innerWidth / 2 - 140, window.innerHeight / 2 - 100);
    setTimeout(() => document.addEventListener("click", onDocClickCloseMenu), 0);
  }
  function openImageOptionsMenu(entry, x, y) {
    if (!entry.meta) entry.meta = {};
    closeTagContextMenu();
    const menu = document.createElement("div");
    menu.className = "ctx-menu";
    menu.style.minWidth = "270px";
    const header = document.createElement("div");
    header.className = "ctx-header";
    header.textContent = `${entry.imgName} \xB7 ${entry.tags.length} tag${entry.tags.length === 1 ? "" : "s"}`;
    menu.appendChild(header);
    const wd14Btn = document.createElement("button");
    wd14Btn.className = "ctx-item";
    wd14Btn.textContent = "\u{1F40D} WD14 Tag";
    wd14Btn.title = "Tag this image with WD14 (via ComfyUI)";
    wd14Btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      closeTagContextMenu();
      tagSingleImageWithWd14(entry);
    });
    menu.appendChild(wd14Btn);
    const seqBtn = document.createElement("button");
    seqBtn.className = "ctx-item";
    seqBtn.textContent = "\u25B6 Sequential from here";
    seqBtn.title = "Enter sequential mode starting at this image (walks the current filter image by image)";
    seqBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      closeTagContextMenu();
      const list = filteredEntries();
      let startIdx = list.findIndex((e) => e.base === entry.base);
      if (startIdx < 0) {
        toast("Sequential walks the current filter \u2014 this image is outside it (e.g. Disabled).");
        return;
      }
      seqQueue = list;
      seqIdx = startIdx;
      seqActive = true;
      seqPanelForcedCollapse = !getRightPanelCollapsedRef();
      setRightPanelCollapsedRef(true);
      switchView("single");
    });
    menu.appendChild(seqBtn);
    const toggleDisableBtn = document.createElement("button");
    toggleDisableBtn.className = "ctx-item";
    toggleDisableBtn.textContent = entry.disabled ? "\u21A9 Restore" : "\u{1F5D1} Disable";
    toggleDisableBtn.title = entry.disabled ? "Restore this image to the dataset root" : "Move this image to /Disabled";
    toggleDisableBtn.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      await moveEntry(entry, !entry.disabled);
      closeTagContextMenu();
    });
    menu.appendChild(toggleDisableBtn);
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "ctx-item ctx-item-danger";
    deleteBtn.textContent = "\u274C Delete permanently";
    deleteBtn.title = "Permanently delete this image and its tags from disk \u2014 cannot be undone";
    deleteBtn.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      closeTagContextMenu();
      const ok = await showConfirmModal(
        `Permanently delete "${entry.imgName}" and its tags? This cannot be undone \u2014 the files are removed from disk, not moved to Disabled/.`,
        { okLabel: "Delete permanently", danger: true }
      );
      if (!ok) return;
      await deleteEntryPermanentlyRef(entry);
    });
    menu.appendChild(deleteBtn);
    const draft = {
      hasText: entry.tags.includes("text") || getForeignLangTags(entry).length > 0,
      isJapanese: entry.tags.includes("text"),
      foreignLangs: new Set(getForeignLangTags(entry).map((t) => t.replace(/ text$/, ""))),
      isComic: entry.tags.includes("comic"),
      koma: entry.tags.find((t) => KOMA_OPTIONS.includes(t)) || "",
      speechBubble: entry.tags.includes("speech bubble")
    };
    function syncTextPanelTags() {
      if (draft.hasText) {
        if (draft.isJapanese) {
          if (!entry.tags.includes("text")) addTagToEntry(entry, "text");
        } else {
          if (entry.tags.includes("text")) removeTagFromEntry(entry, "text");
        }
        for (const tag of getForeignLangTags(entry)) {
          const lang = tag.replace(/ text$/, "");
          if (!draft.foreignLangs.has(lang)) removeTagFromEntry(entry, tag);
        }
        for (const lang of draft.foreignLangs) {
          if (!entry.tags.includes(`${lang} text`)) addTagToEntry(entry, `${lang} text`);
        }
        if (draft.foreignLangs.size) {
          folderStats.foreign_languages = Array.from(/* @__PURE__ */ new Set([...folderStats.foreign_languages || [], ...draft.foreignLangs]));
          saveFolderStats();
        }
      } else {
        if (entry.tags.includes("text")) removeTagFromEntry(entry, "text");
        for (const tag of getForeignLangTags(entry)) removeTagFromEntry(entry, tag);
      }
      if (draft.isComic && !entry.tags.includes("comic")) addTagToEntry(entry, "comic");
      if (!draft.isComic && entry.tags.includes("comic")) removeTagFromEntry(entry, "comic");
      const existingKoma = entry.tags.find((t) => KOMA_OPTIONS.includes(t));
      if (existingKoma && existingKoma !== draft.koma) removeTagFromEntry(entry, existingKoma);
      if (draft.koma && !entry.tags.includes(draft.koma)) addTagToEntry(entry, draft.koma);
      if (draft.speechBubble && !entry.tags.includes("speech bubble")) addTagToEntry(entry, "speech bubble");
      if (!draft.speechBubble && entry.tags.includes("speech bubble")) removeTagFromEntry(entry, "speech bubble");
      checkAchievements();
      header.textContent = `${entry.imgName} \xB7 ${entry.tags.length} tag${entry.tags.length === 1 ? "" : "s"}`;
      renderCurrentView();
    }
    const sepText = document.createElement("div");
    sepText.className = "ctx-sep";
    sepText.textContent = "Text & panel options (applies instantly)";
    menu.appendChild(sepText);
    const textLabel = document.createElement("label");
    textLabel.className = "ach-toggle-row";
    textLabel.style.padding = "6px 8px";
    const textCb = document.createElement("input");
    textCb.type = "checkbox";
    textCb.checked = draft.hasText;
    textCb.addEventListener("change", () => {
      draft.hasText = textCb.checked;
      renderTextSubOptions();
      syncTextPanelTags();
    });
    textLabel.appendChild(textCb);
    textLabel.appendChild(document.createTextNode(" Has text"));
    menu.appendChild(textLabel);
    const textSubBlock = document.createElement("div");
    menu.appendChild(textSubBlock);
    function renderTextSubOptions() {
      textSubBlock.innerHTML = "";
      if (!draft.hasText) return;
      const jpLabel = document.createElement("label");
      jpLabel.className = "ach-toggle-row";
      jpLabel.style.padding = "6px 8px";
      const jpCb = document.createElement("input");
      jpCb.type = "checkbox";
      jpCb.checked = draft.isJapanese;
      jpCb.addEventListener("change", () => {
        draft.isJapanese = jpCb.checked;
        syncTextPanelTags();
      });
      jpLabel.appendChild(jpCb);
      jpLabel.appendChild(document.createTextNode(' Japanese (default \u2014 plain "text" tag)'));
      textSubBlock.appendChild(jpLabel);
      const foreignSep = document.createElement("div");
      foreignSep.className = "ctx-sep";
      foreignSep.textContent = draft.foreignLangs.size ? `Foreign language(s): ${Array.from(draft.foreignLangs).join(", ")}` : "Foreign language(s) \u2014 click to select, multiple allowed";
      textSubBlock.appendChild(foreignSep);
      renderLangChips();
    }
    function renderLangChips() {
      let chipsRow = textSubBlock.querySelector(".lang-picker-block");
      if (chipsRow) chipsRow.remove();
      const block = document.createElement("div");
      block.className = "lang-picker-block";
      const row = document.createElement("div");
      row.style.padding = "2px 8px 6px";
      for (const lang of commonLanguages) {
        const langKey = lang.toLowerCase();
        const chip = document.createElement("span");
        chip.className = "lang-common-chip" + (draft.foreignLangs.has(langKey) ? " active" : "");
        const nameSpan = document.createElement("span");
        nameSpan.textContent = lang;
        nameSpan.style.cursor = "pointer";
        nameSpan.addEventListener("click", (ev) => {
          ev.stopPropagation();
          if (draft.foreignLangs.has(langKey)) draft.foreignLangs.delete(langKey);
          else draft.foreignLangs.add(langKey);
          renderTextSubOptions();
          syncTextPanelTags();
        });
        const rm = document.createElement("button");
        rm.textContent = "\u2715";
        rm.title = "Remove from common languages";
        rm.addEventListener("click", (ev) => {
          ev.stopPropagation();
          commonLanguages = commonLanguages.filter((l) => l !== lang);
          saveCommonLanguages();
          renderTextSubOptions();
        });
        chip.appendChild(nameSpan);
        chip.appendChild(rm);
        row.appendChild(chip);
      }
      block.appendChild(row);
      const addRow = document.createElement("div");
      addRow.style.cssText = "display:flex; gap:6px; padding:0 8px 8px;";
      const addInput = document.createElement("input");
      addInput.type = "text";
      addInput.placeholder = "Add language\u2026";
      addInput.style.cssText = "flex:1; font-size:12px;";
      addInput.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" && addInput.value.trim()) {
          const lang = addInput.value.trim();
          if (!commonLanguages.includes(lang)) {
            commonLanguages.push(lang);
            saveCommonLanguages();
          }
          if (autoSelectNewLanguage) draft.foreignLangs.add(lang.toLowerCase());
          renderTextSubOptions();
          syncTextPanelTags();
        }
      });
      addRow.appendChild(addInput);
      block.appendChild(addRow);
      textSubBlock.appendChild(block);
    }
    renderTextSubOptions();
    const sepPanel = document.createElement("div");
    sepPanel.className = "ctx-sep";
    sepPanel.textContent = "Comic / panels";
    menu.appendChild(sepPanel);
    const comicLabel = document.createElement("label");
    comicLabel.className = "ach-toggle-row";
    comicLabel.style.padding = "6px 8px";
    const comicCb = document.createElement("input");
    comicCb.type = "checkbox";
    comicCb.checked = draft.isComic;
    comicCb.addEventListener("change", () => {
      draft.isComic = comicCb.checked;
      syncTextPanelTags();
    });
    comicLabel.appendChild(comicCb);
    comicLabel.appendChild(document.createTextNode(" Comic"));
    menu.appendChild(comicLabel);
    const komaRow = document.createElement("div");
    komaRow.className = "ctx-words";
    const noneBtn = document.createElement("button");
    noneBtn.textContent = "None";
    noneBtn.style.fontWeight = draft.koma === "" ? "700" : "400";
    noneBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      draft.koma = "";
      Array.from(komaRow.children).forEach((b) => b.style.fontWeight = "400");
      noneBtn.style.fontWeight = "700";
      syncTextPanelTags();
    });
    komaRow.appendChild(noneBtn);
    for (const k of KOMA_OPTIONS) {
      const b = document.createElement("button");
      b.textContent = k;
      b.style.fontWeight = draft.koma === k ? "700" : "400";
      b.addEventListener("click", (ev) => {
        ev.stopPropagation();
        draft.koma = k;
        Array.from(komaRow.children).forEach((x2) => x2.style.fontWeight = "400");
        b.style.fontWeight = "700";
        syncTextPanelTags();
      });
      komaRow.appendChild(b);
    }
    menu.appendChild(komaRow);
    const bubbleLabel = document.createElement("label");
    bubbleLabel.className = "ach-toggle-row";
    bubbleLabel.style.padding = "6px 8px";
    const bubbleCb = document.createElement("input");
    bubbleCb.type = "checkbox";
    bubbleCb.checked = draft.speechBubble;
    bubbleCb.addEventListener("change", () => {
      draft.speechBubble = bubbleCb.checked;
      syncTextPanelTags();
    });
    bubbleLabel.appendChild(bubbleCb);
    bubbleLabel.appendChild(document.createTextNode(" Speech bubble"));
    menu.appendChild(bubbleLabel);
    const sepAntimmunize = document.createElement("div");
    sepAntimmunize.className = "ctx-sep";
    sepAntimmunize.textContent = "Antimmunize options";
    menu.appendChild(sepAntimmunize);
    const toggleMergeImmuneBtn = document.createElement("button");
    toggleMergeImmuneBtn.className = "ctx-item";
    function mergeImmuneLabel() {
      return entry.meta.mergeImmune ? "\u{1F6AB} Un-Merge-Immunize" : "\u{1F6AB} Merge Immunize";
    }
    toggleMergeImmuneBtn.textContent = mergeImmuneLabel();
    toggleMergeImmuneBtn.title = "Merge rules will never rewrite this image's tags";
    toggleMergeImmuneBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      entry.meta.mergeImmune = !entry.meta.mergeImmune;
      getEntryMeta2()[entry.base] = entry.meta;
      saveEntryMetaRef2();
      toggleMergeImmuneBtn.textContent = mergeImmuneLabel();
      toggleAntimmunizeBtn.textContent = antimmunizeLabel();
      renderCurrentView();
    });
    menu.appendChild(toggleMergeImmuneBtn);
    const toggleAntivoidBtn = document.createElement("button");
    toggleAntivoidBtn.className = "ctx-item";
    function antivoidLabel() {
      return entry.meta.antivoid ? "\u{1F7E2} Un-Antivoid" : "\u{1F7E2} Antivoid";
    }
    toggleAntivoidBtn.textContent = antivoidLabel();
    toggleAntivoidBtn.title = "Void rules will never remove tags from this image";
    toggleAntivoidBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      entry.meta.antivoid = !entry.meta.antivoid;
      getEntryMeta2()[entry.base] = entry.meta;
      saveEntryMetaRef2();
      toggleAntivoidBtn.textContent = antivoidLabel();
      toggleAntimmunizeBtn.textContent = antimmunizeLabel();
      renderCurrentView();
    });
    menu.appendChild(toggleAntivoidBtn);
    const toggleAntimmunizeBtn = document.createElement("button");
    toggleAntimmunizeBtn.className = "ctx-item";
    function antimmunizeLabel() {
      return entry.meta.mergeImmune && entry.meta.antivoid ? "\u270B Un-Antimmunize" : "\u270B Antimmunize";
    }
    toggleAntimmunizeBtn.title = "Shortcut for toggling Merge Immunize and Antivoid together";
    toggleAntimmunizeBtn.textContent = antimmunizeLabel();
    toggleAntimmunizeBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const bothOn = entry.meta.mergeImmune && entry.meta.antivoid;
      entry.meta.mergeImmune = !bothOn;
      entry.meta.antivoid = !bothOn;
      getEntryMeta2()[entry.base] = entry.meta;
      saveEntryMetaRef2();
      toggleMergeImmuneBtn.textContent = mergeImmuneLabel();
      toggleAntivoidBtn.textContent = antivoidLabel();
      toggleAntimmunizeBtn.textContent = antimmunizeLabel();
      renderCurrentView();
    });
    menu.appendChild(toggleAntimmunizeBtn);
    const removeAllTagsBtn = document.createElement("button");
    removeAllTagsBtn.className = "ctx-item ctx-item-danger";
    removeAllTagsBtn.textContent = "\u{1F5D1}\uFE0F Remove all tags";
    removeAllTagsBtn.title = "Remove every tag from this image at once";
    removeAllTagsBtn.addEventListener("click", async (ev) => {
      ev.stopPropagation();
      if (entry.tags.length === 0) {
        toast("This image has no tags to remove.");
        return;
      }
      const ok = await showConfirmModal(
        `Remove all ${entry.tags.length} tag(s) from "${entry.imgName}"?`,
        { okLabel: "Remove all tags", danger: true }
      );
      if (!ok) return;
      removeAllTagsFromEntry(entry);
      header.textContent = `${entry.imgName} \xB7 ${entry.tags.length} tag${entry.tags.length === 1 ? "" : "s"}`;
      renderCurrentView();
    });
    menu.appendChild(removeAllTagsBtn);
    const resetEditsBtn = document.createElement("button");
    resetEditsBtn.className = "ctx-item";
    resetEditsBtn.textContent = "\u23EE Reset edits";
    resetEditsBtn.title = "Reset this image to its earliest known tag state";
    resetEditsBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      resetImageEdits(entry);
    });
    menu.appendChild(resetEditsBtn);
    const statusBtn = document.createElement("button");
    statusBtn.className = "ctx-item";
    statusBtn.textContent = "\u24D8 Status details";
    statusBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      closeTagContextMenu();
      const rows = getEntryStatusIndicators(entry).map(({ emoji, state, label, matchedTags }) => {
        const stateText = state === null ? "Not indicated" : state ? "Yes" : "No";
        const matched = matchedTags.length ? ` \u2014 ${matchedTags.map(escapeHtml).join(", ")}` : "";
        return `<p>${emoji} <b>${label}:</b> ${stateText}${matched}</p>`;
      }).join("");
      showInfoModal(rows, "Image status");
    });
    menu.appendChild(statusBtn);
    const toggleLockBtn = document.createElement("button");
    toggleLockBtn.className = "ctx-item";
    function lockLabel() {
      return entry.meta.locked ? "\u{1F513} Unlock" : "\u{1F512} Lock";
    }
    toggleLockBtn.textContent = lockLabel();
    toggleLockBtn.title = "Skip mass tools (Quick Merge, Master Tags, bulk WD14, etc.) for this image";
    toggleLockBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      entry.meta.locked = !entry.meta.locked;
      getEntryMeta2()[entry.base] = entry.meta;
      saveEntryMetaRef2();
      toggleLockBtn.textContent = lockLabel();
      renderCurrentView();
    });
    menu.appendChild(toggleLockBtn);
    const sep2 = document.createElement("div");
    sep2.className = "ctx-sep";
    sep2.textContent = "Flag for review";
    menu.appendChild(sep2);
    const flagRow = document.createElement("div");
    flagRow.style.cssText = "display:flex; gap:6px; padding:4px 8px 8px; align-items:center; flex-wrap:wrap;";
    const swatchEls = [];
    for (const color of FLAG_COLORS) {
      const sw = document.createElement("button");
      sw.style.cssText = `width:22px; height:22px; border-radius:5px; padding:0; background:${color}; border:2px solid ${entry.meta.reviewColor === color ? "var(--text-primary)" : "transparent"};`;
      sw.addEventListener("click", (ev) => {
        ev.stopPropagation();
        entry.meta.reviewColor = color;
        getEntryMeta2()[entry.base] = entry.meta;
        saveEntryMetaRef2();
        folderStats.review_flags = (folderStats.review_flags || 0) + 1;
        saveFolderStats();
        checkAchievements();
        renderCurrentView();
        swatchEls.forEach((s) => {
          s.style.borderColor = "transparent";
        });
        sw.style.borderColor = "var(--text-primary)";
      });
      swatchEls.push(sw);
      flagRow.appendChild(sw);
    }
    const clearFlagBtn = document.createElement("button");
    clearFlagBtn.textContent = "Clear";
    clearFlagBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      entry.meta.reviewColor = void 0;
      getEntryMeta2()[entry.base] = entry.meta;
      saveEntryMetaRef2();
      renderCurrentView();
      swatchEls.forEach((s) => {
        s.style.borderColor = "transparent";
      });
    });
    flagRow.appendChild(clearFlagBtn);
    menu.appendChild(flagRow);
    const blurLabel = document.createElement("label");
    blurLabel.className = "ach-toggle-row";
    blurLabel.style.padding = "6px 8px";
    const blurCb = document.createElement("input");
    blurCb.type = "checkbox";
    blurCb.checked = !!entry.meta.blurred;
    blurCb.addEventListener("change", () => {
      entry.meta.blurred = blurCb.checked;
      getEntryMeta2()[entry.base] = entry.meta;
      saveEntryMetaRef2();
      renderCurrentView();
    });
    blurLabel.appendChild(blurCb);
    blurLabel.appendChild(document.createTextNode(" Blur this image (discrete mode)"));
    menu.appendChild(blurLabel);
    const sep3 = document.createElement("div");
    sep3.className = "ctx-sep";
    sep3.textContent = "Note";
    menu.appendChild(sep3);
    const noteArea = document.createElement("textarea");
    noteArea.style.width = "calc(100% - 16px)";
    noteArea.style.margin = "0 8px";
    noteArea.style.minHeight = "60px";
    noteArea.style.background = "var(--bg-elevated)";
    noteArea.style.color = "var(--text-primary)";
    noteArea.style.border = "1px solid var(--border-strong)";
    noteArea.style.borderRadius = "var(--radius)";
    noteArea.style.fontFamily = "var(--sans)";
    noteArea.style.fontSize = "12px";
    noteArea.style.padding = "6px";
    noteArea.value = entry.meta.note || "";
    menu.appendChild(noteArea);
    const visRow = document.createElement("label");
    visRow.className = "ach-toggle-row";
    visRow.style.padding = "6px 8px";
    const visCb = document.createElement("input");
    visCb.type = "checkbox";
    visCb.checked = !!entry.meta.noteAlwaysVisible;
    visRow.appendChild(visCb);
    visRow.appendChild(document.createTextNode(" Always show on card"));
    menu.appendChild(visRow);
    const saveNoteBtn = document.createElement("button");
    saveNoteBtn.className = "primary ctx-item";
    saveNoteBtn.textContent = "Save note";
    saveNoteBtn.addEventListener("click", () => {
      const wasEmpty = !entry.meta.note;
      entry.meta.note = noteArea.value;
      entry.meta.noteAlwaysVisible = visCb.checked;
      getEntryMeta2()[entry.base] = entry.meta;
      saveEntryMetaRef2();
      if (wasEmpty && noteArea.value.trim()) {
        folderStats.notes_written = (folderStats.notes_written || 0) + 1;
        saveFolderStats();
        checkAchievements();
      }
      toast("Note saved.");
      closeTagContextMenu();
      renderCurrentView();
    });
    menu.appendChild(saveNoteBtn);
    document.body.appendChild(menu);
    ctxMenuEl = menu;
    positionMenu(menu, x, y);
    setTimeout(() => document.addEventListener("click", onDocClickCloseMenu), 0);
  }
  function refreshRightPanels() {
    renderTagPruners();
  }
  var setContainsFilterRef = () => {
  };
  var setExcludesFilterRef = () => {
  };
  function setContainsFilter2(tag) {
    setContainsFilterRef(tag);
  }
  function setExcludesFilter2(tag) {
    setExcludesFilterRef(tag);
  }
  var deleteEntryPermanentlyRef = async () => {
  };
  var setRightPanelCollapsedRef = () => {
  };
  var getRightPanelCollapsedRef = () => false;
  var getHideTagsRef = () => false;
  var seqPanelForcedCollapse = false;
  function initView(deps) {
    getEntries6 = deps.getEntries;
    getEntryByBase4 = deps.getEntryByBase;
    getDirHandleRef = deps.getDirHandle;
    addEntryFromNewFileRef = deps.addEntryFromNewFile;
    getMasterTagModeActive = deps.getMasterTagModeActive;
    getCardTagSortMode = deps.getCardTagSortMode;
    getGalleryFilter2 = deps.getGalleryFilter;
    getIsolatedFlagActive = deps.getIsolatedFlagActive;
    getShowTagCountBadges = deps.getShowTagCountBadges;
    getEntryMeta2 = deps.getEntryMeta;
    saveEntryMetaRef2 = deps.saveEntryMeta;
    refreshAllUIRef7 = deps.refreshAllUI;
    setContainsFilterRef = deps.setContainsFilter;
    setExcludesFilterRef = deps.setExcludesFilter;
    deleteEntryPermanentlyRef = deps.deleteEntryPermanently;
    setRightPanelCollapsedRef = deps.setRightPanelCollapsed;
    getRightPanelCollapsedRef = deps.getRightPanelCollapsed;
    getHideTagsRef = deps.getHideTags;
    langAutoSelectToggle.addEventListener("change", () => {
      autoSelectNewLanguage = langAutoSelectToggle.checked;
      try {
        localStorage.setItem("dts-lang-autoselect", autoSelectNewLanguage ? "1" : "0");
      } catch (e) {
      }
    });
    (function initLangAutoSelectPref() {
      let on = true;
      try {
        on = localStorage.getItem("dts-lang-autoselect") !== "0";
      } catch (e) {
      }
      autoSelectNewLanguage = on;
      langAutoSelectToggle.checked = on;
    })();
    let hideTags = false;
    try {
      hideTags = localStorage.getItem("dts-hide-tags") === "1";
    } catch (e) {
    }
    btnHideTags.textContent = hideTags ? "\u{1F441} Show tags" : "\u{1F648} Hide tags";
    btnHideTags.addEventListener("click", () => {
      hideTags = !hideTags;
      try {
        localStorage.setItem("dts-hide-tags", hideTags ? "1" : "0");
      } catch (e) {
      }
      btnHideTags.textContent = hideTags ? "\u{1F441} Show tags" : "\u{1F648} Hide tags";
      renderCurrentView();
    });
    viewGridBtn.addEventListener("click", () => switchView("grid"));
    viewCompactBtn.addEventListener("click", () => {
      switchView("compact");
      folderStats.compact_used = true;
      saveFolderStats();
      checkAchievements();
    });
    viewSingleBtn.addEventListener("click", () => switchView("single"));
    btnUnlockAll.addEventListener("click", () => {
      const meta = getEntryMeta2();
      let count = 0;
      for (const e of getEntries6()) {
        if (!e.meta || !e.meta.locked) continue;
        e.meta.locked = false;
        meta[e.base] = e.meta;
        count++;
      }
      if (count === 0) {
        toast("No locked images in this dataset.");
        return;
      }
      saveEntryMetaRef2();
      toast(`Unlocked ${count} image(s).`);
      renderCurrentView();
    });
    btnRenameAllImages.addEventListener("click", async () => {
      const count = getEntries6().length;
      if (count === 0) {
        toast("No images loaded.");
        return;
      }
      const ok = await showConfirmModal(
        `Rename all ${count} loaded image(s) (+ their .txt files) to a simple zero-padded 1-${count} sequence? Active dataset images are numbered first, then Disabled/ continues the same count. This can be undone from the Log panel.`,
        { okLabel: "Rename all", danger: true }
      );
      if (!ok) return;
      await renameAllEntriesSequentially();
    });
    viewDisabledBtn.addEventListener("click", () => switchView("disabled"));
    viewDisabledBtn.addEventListener("dragover", (ev) => {
      ev.preventDefault();
      viewDisabledBtn.classList.add("drag-over");
    });
    viewDisabledBtn.addEventListener("dragleave", () => viewDisabledBtn.classList.remove("drag-over"));
    viewDisabledBtn.addEventListener("drop", (ev) => {
      ev.preventDefault();
      viewDisabledBtn.classList.remove("drag-over");
      const base = ev.dataTransfer.getData("text/plain");
      const target = getEntryByBase4(base);
      if (target && !target.disabled) {
        moveEntry(target, true);
        folderStats.drag_disabled_used = true;
        saveFolderStats();
        checkAchievements();
      }
    });
    function pageSingle(delta) {
      const html = document.documentElement;
      if (!html.classList.contains("motion-swipe") || html.classList.contains("motion-off")) {
        singleIndex += delta;
        renderSingleView();
        return;
      }
      const outClass = delta > 0 ? "view-swipe-out-left" : "view-swipe-out-right";
      const inClass = delta > 0 ? "view-swipe-in-right" : "view-swipe-in-left";
      singleViewEl.classList.add(outClass);
      setTimeout(() => {
        singleViewEl.classList.remove(outClass);
        singleIndex += delta;
        renderSingleView();
        singleViewEl.classList.add(inClass);
        requestAnimationFrame(() => requestAnimationFrame(() => singleViewEl.classList.remove(inClass)));
      }, 100);
    }
    singlePrevBtn.addEventListener("click", () => pageSingle(-1));
    singleNextBtn.addEventListener("click", () => pageSingle(1));
    btnClearCompare.addEventListener("click", () => {
      stickyCompareImages = [];
      renderCompactGrid();
    });
    imageCardModal.addEventListener("click", (ev) => {
      if (ev.target === imageCardModal) closeImageCardModal();
    });
    document.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") {
        if (imageCardModal.style.display === "flex") {
          closeImageCardModal();
          return;
        }
        if (ctxMenuEl) {
          closeTagContextMenu();
          return;
        }
        if (viewMode2 === "single") {
          switchView("grid");
          return;
        }
      }
      if (viewMode2 === "single" && !ctxMenuEl) {
        if (ev.key === "ArrowLeft" && !singlePrevBtn.disabled) {
          pageSingle(-1);
        }
        if (ev.key === "ArrowRight" && !singleNextBtn.disabled) {
          pageSingle(1);
        }
      }
    });
  }

  // src/renderer/random-facts.ts
  var USELESS_FACTS = [
    'A group of flamingos is called a "flamboyance."',
    "Bananas are berries, but strawberries aren't.",
    "Honey never spoils \u2014 archaeologists have eaten 3,000-year-old honey found in Egyptian tombs.",
    "Octopuses have three hearts, and two of them stop beating when they swim.",
    "The Eiffel Tower can grow taller in summer \u2014 the iron expands by about 15cm in the heat.",
    "A single cloud can weigh more than a million pounds.",
    "Wombat poop is cube-shaped.",
    "The inventor of the frisbee was turned into a frisbee after he died \u2014 his ashes were molded into a disc.",
    "There are more possible chess games than atoms in the observable universe.",
    "Scotland's national animal is the unicorn.",
    "Sharks existed before trees.",
    "A day on Venus is longer than a year on Venus.",
    `The dot over a lowercase "i" or "j" has a name: it's called a "tittle."`,
    "Cows have best friends and get stressed when separated from them.",
    "It is impossible for most people to lick their own elbow (but you probably just tried).",
    "The unicorn Grand Master emote in most gacha games costs more real money than a used car, and someone out there has bought it.",
    "In Genshin Impact, Paimon canonically eats an absurd, physically implausible amount of food for her size, and the game just never explains where it goes.",
    'The "Ohayo" bell sound in Animal Crossing has been remixed into more unofficial lo-fi tracks than most real songs.',
    'A "gacha" pull rate of 0.6% for the rarest item means you are statistically more likely to be struck by lightning this year than to pull it on your first try.',
    "The Kool-Aid Man cannot legally be stopped by any wall, according to decades of consistent in-universe evidence.",
    "Waluigi has never appeared in a single mainline Super Mario platformer, only spin-offs \u2014 and yet everyone insists he's a main character.",
    'The "This is fine" dog meme comes from a webcomic where, canonically, the dog does eventually stop being fine.',
    "Shrek (2001) grossed enough at the box office to buy a small country's worth of onions, hypothetically.",
    'A "skibidi" toilet has no vocal cords, yet it sings \u2014 this has never been explained and never will be.',
    "The Baby Shark song has been played enough times on YouTube to circle the Earth in seconds if each play were a meter.",
    'There is an official Guinness World Record for "most spoons balanced on a human face" and someone trains for it.',
    "The moon has moonquakes.",
    "Slugs have four noses.",
    "You share your birthday with at least 9 million other people on Earth, roughly.",
    'A "jiffy" is an actual unit of time \u2014 1/100th of a second.',
    "The longest hiccuping spree recorded lasted 68 years.",
    "Peanuts are not nuts \u2014 they're legumes.",
    "A crocodile cannot stick its tongue out.",
    "Some cats are allergic to humans.",
    "The dot pattern on a strawberry's surface are its actual seeds, and each one is a separate fruit.",
    "Polar bears have black skin under their fur.",
    'A "smiley face" emoticon predates the internet by over a century \u2014 it appeared in an 1862 satirical magazine.',
    "The world's quietest room is so silent people start hearing their own heartbeat and blood flow within minutes.",
    "Rubber bands last longer when refrigerated.",
    "The average person walks past 36 murderers in their lifetime, according to one (extremely dubious) statistic that keeps getting reposted anyway.",
    'A "murder of crows" is a real term, and crows really do hold what looks like funerals for their dead.',
    "Hot water can freeze faster than cold water under the right conditions \u2014 nobody fully agrees on why.",
    "There's a species of jellyfish that is biologically immortal.",
    `The "@ " symbol has no official name in English \u2014 it's often just called "the at sign."`,
    'A cluster of bananas is called a "hand," and each individual banana is a "finger."',
    "Tomato ketchup was sold as medicine in the 1830s.",
    "The QWERTY keyboard layout was designed to slow typists down, not speed them up.",
    "Space smells like seared steak, according to astronauts who describe the smell that lingers on their suits.",
    "An ostrich's eye is bigger than its brain.",
    'The first VHS tape ever rented was "Behind the Green Door" \u2014 nobody asked, but now you know.'
  ];
  function initRandomFacts() {
    btnRandomFact.addEventListener("click", () => {
      const fact = USELESS_FACTS[Math.floor(Math.random() * USELESS_FACTS.length)];
      randomFactDisplay.textContent = fact;
      randomFactDisplay.style.display = "block";
    });
  }

  // src/renderer/index.ts
  (function() {
    let isTouchDevice2 = false;
    try {
      isTouchDevice2 = matchMedia("(hover: none) and (pointer: coarse)").matches;
    } catch (e) {
    }
    document.documentElement.classList.toggle("touch-device", isTouchDevice2);
    let dirHandle = null;
    let disabledDirHandle = null;
    let entries = [];
    let entryByBase = /* @__PURE__ */ new Map();
    let galleryFilter = { base: "all", terms: [], mode: "AND", excludes: "", disabledView: false, exactMatch: false };
    let gallerySortMode = "filename";
    let gallerySortDir = "asc";
    let isolatedFlagActive = false;
    let cardTagSortMode = "default";
    let masterTagModeActive = false;
    let entryMeta = {};
    const IMAGE_EXT = [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"];
    btnResetZoom.addEventListener("click", (ev) => {
      ev.stopPropagation();
      resetAppZoom();
    });
    document.addEventListener("keydown", (ev) => {
      if ((ev.ctrlKey || ev.metaKey) && (ev.key === "0" || ev.key === ")")) resetAppZoom();
    });
    const btnRestartApp = $("btnRestartApp");
    btnRestartApp.addEventListener("click", async () => {
      if (!window.electronAPI || !window.electronAPI.restartApp) {
        toast("Restart isn't available in this build \u2014 close and reopen the app by hand.", 3600);
        return;
      }
      const unsaved = unsavedChangesDescription();
      if (unsaved) {
        const ok = await showConfirmModal(`You have ${unsaved}. Restart anyway without saving?`, { okLabel: "Restart anyway", danger: true });
        if (!ok) return;
      }
      window.electronAPI.restartApp();
    });
    function closeDrawers() {
      leftAside.classList.remove("drawer-open");
      rightAside.classList.remove("drawer-open");
      drawerBackdrop.classList.remove("drawer-visible");
    }
    function openDrawer(which) {
      closeDrawers();
      (which === "left" ? leftAside : rightAside).classList.add("drawer-open");
      drawerBackdrop.classList.add("drawer-visible");
    }
    btnLeftDrawerToggle.addEventListener("click", () => {
      if (leftAside.classList.contains("drawer-open")) closeDrawers();
      else openDrawer("left");
    });
    btnRightDrawerToggle.addEventListener("click", () => {
      if (rightAside.classList.contains("drawer-open") && !masterTagModeActive) closeDrawers();
      else {
        if (masterTagModeActive) switchTab2("gallery", { skipDrawerSync: true });
        openDrawer("right");
      }
    });
    btnOverseerDrawerToggle.addEventListener("click", () => {
      if (rightAside.classList.contains("drawer-open") && masterTagModeActive) closeDrawers();
      else {
        if (!masterTagModeActive) switchTab2("master", { skipDrawerSync: true });
        openDrawer("right");
      }
    });
    drawerBackdrop.addEventListener("click", closeDrawers);
    btnOpenTagPrunerList.addEventListener("click", () => openDockListModal("Tag Pruner", tagPrunerList));
    btnOpenUnifyVoidList.addEventListener("click", () => openDockListModal("Unify or void selected tags", unifyVoidRows));
    btnOpenCanonicalTagsList.addEventListener("click", () => openDockListModal("Retroactive Merge/Void rules", canonicalTagsList));
    btnOpenMasterMiniGrid.addEventListener("click", () => openDockListModal("Select images", masterMiniGrid));
    btnOpenTagFrequencyList.addEventListener("click", () => openDockListModal("Tags", tagFamilyListArea));
    const themeDropdownCtrl = initThemeDropdown(themeDropdown);
    themeSelect.addEventListener("change", () => {
      const chosen = themeSelect.value;
      const premium = PREMIUM_THEMES.find((t) => t.id === chosen);
      if (premium && !ownedThemes.includes(chosen)) {
        toast(`"${premium.name}" is locked \u2014 buy it in the Shop first.`);
        themeSelect.value = localStorage.getItem("dts-theme") || "studio";
        themeDropdownCtrl.refreshLabel();
        return;
      }
      applyTheme(chosen);
      updateRefineThemeButton();
    });
    (function initTheme() {
      let saved = "studio";
      try {
        saved = localStorage.getItem("dts-theme") || "studio";
      } catch (e) {
      }
      themeSelect.value = saved;
      themeDropdownCtrl.refreshLabel();
      if (!window.__dtsPreThemed) {
        applyTheme(saved);
      } else {
        document.documentElement.classList.toggle("theme-refined", refinedThemes.includes(saved));
        if (saved === "custom") {
          let hasCustom = false;
          try {
            hasCustom = !!localStorage.getItem("dts-custom-theme");
          } catch (e) {
          }
          if (!hasCustom) setTimeout(openThemeCustomPanel, 0);
        }
      }
    })();
    btnThemeCustomize.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (themeCustomPanel.style.display === "flex") {
        hidePanel(themeCustomPanel);
        return;
      }
      openThemeCustomPanel();
    });
    themeCloseBtn.addEventListener("click", () => hidePanel(themeCustomPanel));
    themeResetBtn.addEventListener("click", () => {
      themeVarRows.querySelectorAll('input[type="color"]').forEach((inp) => {
        const key = inp.dataset.varKey;
        const hex = STUDIO_DEFAULTS[key] || "#000000";
        inp.value = hex;
        document.documentElement.style.setProperty(key, hex);
      });
    });
    themeApplyBtn.addEventListener("click", () => {
      const custom = {};
      themeVarRows.querySelectorAll('input[type="color"]').forEach((inp) => {
        custom[inp.dataset.varKey] = inp.value;
        document.documentElement.style.setProperty(inp.dataset.varKey, inp.value);
      });
      try {
        localStorage.setItem("dts-custom-theme", JSON.stringify(custom));
      } catch (e) {
      }
      document.documentElement.setAttribute("data-theme", "custom");
      themeSelect.value = "custom";
      themeDropdownCtrl.refreshLabel();
      try {
        localStorage.setItem("dts-theme", "custom");
      } catch (e) {
      }
      toast("Custom theme saved.");
      folderStats.theme_customized = true;
      saveFolderStats();
      checkAchievements();
      hidePanel(themeCustomPanel);
    });
    btnQuit.addEventListener("click", () => {
      window.close();
    });
    let APP_VERSION = "";
    (async () => {
      try {
        if (window.electronAPI && window.electronAPI.getAppVersion) {
          APP_VERSION = await window.electronAPI.getAppVersion();
        }
      } catch (e) {
      }
      appVersionEl.textContent = APP_VERSION ? "v" + APP_VERSION : "";
    })();
    function switchTab2(tab, opts) {
      const skipDrawerSync = !!(opts && opts.skipDrawerSync);
      const fadePanes = [datasetManagerTab, statsTab, synthDatTab, normalRightTools, masterTagPanel];
      const applyState = () => {
        tabDatasetManager.classList.toggle("active", tab === "datasets");
        tabGallery.classList.toggle("active", tab === "gallery");
        tabMasterTags.classList.toggle("active", tab === "master");
        tabStats.classList.toggle("active", tab === "stats");
        tabSynthDat.classList.toggle("active", tab === "synthdat");
        datasetManagerTab.style.display = tab === "datasets" ? "block" : "none";
        galleryTab.style.display = tab === "stats" || tab === "datasets" || tab === "synthdat" ? "none" : "contents";
        statsTab.style.display = tab === "stats" ? "block" : "none";
        synthDatTab.style.display = tab === "synthdat" ? "block" : "none";
        masterTagModeActive = tab === "master";
        if (!skipDrawerSync) {
          if (tab === "master") openDrawer("right");
          else closeDrawers();
        }
        normalRightTools.classList.toggle("rt-hidden", masterTagModeActive);
        masterTagPanel.classList.toggle("rt-hidden", !masterTagModeActive);
        btnGoToTagOverseer.style.display = masterTagModeActive ? "none" : "";
        btnMasterBack.style.display = masterTagModeActive ? "" : "none";
        if (tab === "stats") renderStatsTab();
        if (tab === "datasets") renderDatasetManagerTab();
        if (tab !== "datasets") {
          renderCurrentView();
          renderMasterSelectionSummary();
        }
        repositionRightResizeHandleSoon();
      };
      if (document.documentElement.classList.contains("motion-off")) {
        applyState();
        return;
      }
      const leaving = fadePanes.filter((el) => el.style.display !== "none");
      leaving.forEach((el) => el.classList.add("tab-fading"));
      setTimeout(() => {
        applyState();
        leaving.forEach((el) => el.classList.remove("tab-fading"));
        const entering = fadePanes.filter((el) => el.style.display !== "none");
        entering.forEach((el) => el.classList.add("tab-fading"));
        requestAnimationFrame(() => requestAnimationFrame(() => {
          entering.forEach((el) => el.classList.remove("tab-fading"));
        }));
      }, 100);
    }
    tabDatasetManager.addEventListener("click", () => switchTab2("datasets"));
    tabGallery.addEventListener("click", () => switchTab2("gallery"));
    tabMasterTags.addEventListener("click", () => {
      switchTab2(tabMasterTags.classList.contains("active") ? "gallery" : "master");
    });
    tabStats.addEventListener("click", () => switchTab2("stats"));
    tabSynthDat.addEventListener("click", () => switchTab2("synthdat"));
    btnStatsBack.addEventListener("click", () => switchTab2("gallery"));
    btnMasterBack.addEventListener("click", () => switchTab2("gallery"));
    btnGoToTagOverseer.addEventListener("click", () => switchTab2("master"));
    btnSynthDatBack.addEventListener("click", () => switchTab2("gallery"));
    function toggleDayNightModeAndTrack() {
      if (toggleDayNightMode()) {
        folderStats.night_mode_used = true;
        saveFolderStats();
        checkAchievements();
      }
    }
    btnNightMode.addEventListener("click", toggleDayNightModeAndTrack);
    (function initNightMode() {
      let on = false;
      try {
        on = localStorage.getItem("dts-night-mode") === "1";
      } catch (e) {
      }
      if (on && themeSelect.value !== "custom") {
        if (window.__dtsPreThemed) {
          syncNightModeFromPrePaint();
          folderStats.night_mode_used = true;
          saveFolderStats();
          checkAchievements();
        } else {
          toggleDayNightModeAndTrack();
        }
      }
    })();
    const TOPBAR_MIN_SCALE = 0.6;
    const topbarNarrowQuery = matchMedia("(max-width: 900px)");
    function updateTopbarScale() {
      topbarActions.style.transform = "";
      if (topbarNarrowQuery.matches) return;
      const natural = topbarActions.scrollWidth;
      const available = topbarActions.clientWidth;
      if (natural <= 0 || available <= 0) return;
      const scale = Math.min(1, Math.max(TOPBAR_MIN_SCALE, available / natural));
      topbarActions.style.transform = scale < 1 ? `scale(${scale})` : "";
    }
    new ResizeObserver(updateTopbarScale).observe(topbarActions);
    updateTopbarScale();
    let flyoutClosesOnOutsideClick = true;
    flyoutOutsideCloseToggle.addEventListener("change", () => {
      flyoutClosesOnOutsideClick = flyoutOutsideCloseToggle.checked;
      try {
        localStorage.setItem("dts-flyout-outside-close", flyoutClosesOnOutsideClick ? "1" : "0");
      } catch (e) {
      }
    });
    (function initFlyoutOutsideClosePref() {
      let on = true;
      try {
        on = localStorage.getItem("dts-flyout-outside-close") !== "0";
      } catch (e) {
      }
      flyoutClosesOnOutsideClick = on;
      flyoutOutsideCloseToggle.checked = on;
    })();
    function applyUiAnimationMode(mode) {
      document.documentElement.classList.toggle("motion-off", mode === "off");
      document.documentElement.classList.toggle("motion-swipe", mode === "swipe");
    }
    let uiAnimationMode = "fade";
    try {
      const saved = localStorage.getItem("dts-ui-animation-mode");
      if (saved === "off" || saved === "swipe" || saved === "fade") uiAnimationMode = saved;
      else if (localStorage.getItem("dts-ui-animations") === "0") uiAnimationMode = "off";
    } catch (e) {
    }
    buildPersistentDropdown(uiAnimationsDropdown, [
      { value: "fade", label: "Fade" },
      { value: "swipe", label: "Swipe" },
      { value: "off", label: "Off" }
    ], () => uiAnimationMode, (val) => {
      uiAnimationMode = val;
      try {
        localStorage.setItem("dts-ui-animation-mode", val);
      } catch (e) {
      }
      applyUiAnimationMode(val);
    });
    applyUiAnimationMode(uiAnimationMode);
    (async function initHardwareAccelToggle() {
      try {
        hwAccelToggle.checked = await window.electronAPI.getHardwareAcceleration();
      } catch (e) {
      }
    })();
    hwAccelToggle.addEventListener("change", async () => {
      const enabled = hwAccelToggle.checked;
      await window.electronAPI.setHardwareAcceleration(enabled);
      const restart = await showConfirmModal(
        "This change only takes effect after a restart. Restart now?",
        { okLabel: "Restart now" }
      );
      if (restart) window.electronAPI.restartApp();
    });
    function setupHeaderCategory(btn, flyout) {
      document.body.appendChild(flyout);
      flyout._headerCatBtn = btn;
      btn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        const isOpen = flyout.style.display === "flex";
        document.querySelectorAll(".header-cat-flyout").forEach((f) => {
          f.style.display = "none";
          f.classList.remove("menu-in");
        });
        if (isOpen) return;
        const rect = btn.getBoundingClientRect();
        flyout.style.display = "flex";
        flyout.style.left = rect.left + "px";
        flyout.style.top = rect.bottom + 6 + "px";
        const flyoutRect = flyout.getBoundingClientRect();
        if (flyoutRect.right > window.innerWidth - 8) {
          flyout.style.left = Math.max(8, window.innerWidth - flyoutRect.width - 8) + "px";
        }
        if (flyoutRect.bottom > window.innerHeight - 8) {
          flyout.style.top = Math.max(8, window.innerHeight - flyoutRect.height - 8) + "px";
        }
        void flyout.offsetHeight;
        flyout.classList.add("menu-in");
      });
    }
    setupHeaderCategory(fileCatBtn, fileCatFlyout);
    setupHeaderCategory(personalizationCatBtn, personalizationCatFlyout);
    document.addEventListener("mousedown", (ev) => {
      if (!flyoutClosesOnOutsideClick) return;
      if (ev.target === document.documentElement || ev.target === document.body) return;
      let closedAny = false;
      document.querySelectorAll(".header-cat-flyout").forEach((flyout) => {
        const btn = flyout._headerCatBtn;
        if (flyout.style.display === "flex" && !flyout.contains(ev.target) && !(btn && btn.contains(ev.target))) {
          flyout.style.display = "none";
          flyout.classList.remove("menu-in");
          closedAny = true;
        }
      });
      if (closedAny && shouldSwallowOutsideClick()) markSwallowNextClick();
    });
    let panelsCloseOnOutsideClick = true;
    panelsOutsideCloseToggle.addEventListener("change", () => {
      panelsCloseOnOutsideClick = panelsOutsideCloseToggle.checked;
      try {
        localStorage.setItem("dts-panels-outside-close", panelsCloseOnOutsideClick ? "1" : "0");
      } catch (e) {
      }
    });
    (function initPanelsOutsideClosePref() {
      let on = true;
      try {
        on = localStorage.getItem("dts-panels-outside-close") !== "0";
      } catch (e) {
      }
      panelsCloseOnOutsideClick = on;
      panelsOutsideCloseToggle.checked = on;
    })();
    document.addEventListener("click", (ev) => {
      if (!panelsCloseOnOutsideClick) return;
      let closedAny = false;
      getOutsideClosablePanels().forEach((panel) => {
        if (panel.style.display === "flex" && !panel.contains(ev.target) && !isClickInsideOwnedPdrop(panel, ev.target)) {
          hidePanel(panel);
          closedAny = true;
        }
      });
      if (closedAny && shouldSwallowOutsideClick()) {
        ev.stopPropagation();
        ev.preventDefault();
      }
    }, true);
    const tooltipsToggle = $("tooltipsToggle");
    const tagCountBadgeToggle = $("tagCountBadgeToggle");
    const cardTagSortDropdown = $("cardTagSortDropdown");
    const galleryColumnsDropdown = $("galleryColumnsDropdown");
    const dynamicCardsToggle = $("dynamicCardsToggle");
    const btnDiscreteToggle = $("btnDiscreteToggle");
    const btnDiscreteOff = $("btnDiscreteOff");
    const btnPurgeAllTags = $("btnPurgeAllTags");
    const settingsCloseBtn = $("settingsCloseBtn");
    const tooltipBubble = $("tooltipBubble");
    const tooltipDelaySlider = $("tooltipDelaySlider");
    const tooltipDelayVal = $("tooltipDelayVal");
    let tooltipsEnabled = true;
    let tooltipDelayMs = 1e3;
    let discreteModeOn = false;
    let purgeConfirmCount = 0;
    let showTagCountBadges = false;
    tagCountBadgeToggle.addEventListener("change", () => {
      showTagCountBadges = tagCountBadgeToggle.checked;
      try {
        localStorage.setItem("dts-tagcount-badges", showTagCountBadges ? "1" : "0");
      } catch (e) {
      }
      renderCurrentView();
    });
    (function initTagCountBadgePref() {
      let on = false;
      try {
        on = localStorage.getItem("dts-tagcount-badges") === "1";
      } catch (e) {
      }
      showTagCountBadges = on;
      tagCountBadgeToggle.checked = on;
    })();
    dynamicCardsToggle.addEventListener("change", () => {
      if (document.documentElement.classList.contains("touch-device")) return;
      document.documentElement.classList.toggle("dynamic-cards", dynamicCardsToggle.checked);
      try {
        localStorage.setItem("dts-dynamic-cards", dynamicCardsToggle.checked ? "1" : "0");
      } catch (e) {
      }
    });
    (function initDynamicCardsPref() {
      if (document.documentElement.classList.contains("touch-device")) {
        dynamicCardsToggle.checked = false;
        document.documentElement.classList.remove("dynamic-cards");
        return;
      }
      let on = false;
      try {
        on = localStorage.getItem("dts-dynamic-cards") === "1";
      } catch (e) {
      }
      dynamicCardsToggle.checked = on;
      document.documentElement.classList.toggle("dynamic-cards", on);
    })();
    let tooltipTimer = null;
    let tooltipTarget = null;
    let tooltipMeasureCtx = null;
    function placeholderOverflowWidth(el) {
      if (!tooltipMeasureCtx) tooltipMeasureCtx = document.createElement("canvas").getContext("2d");
      const cs = getComputedStyle(el);
      tooltipMeasureCtx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const textWidth = tooltipMeasureCtx.measureText(el.placeholder).width;
      const availWidth = el.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
      return textWidth > availWidth;
    }
    function showTooltipBubble(el, tipText) {
      tooltipTimer = setTimeout(() => {
        if (tooltipTarget !== el) return;
        const rect = el.getBoundingClientRect();
        tooltipBubble.textContent = tipText;
        tooltipBubble.style.display = "block";
        tooltipBubble.classList.remove("tooltip-bottom-pinned");
        const bubbleRect = tooltipBubble.getBoundingClientRect();
        let top = rect.top - bubbleRect.height - 8;
        if (top < 8) {
          tooltipBubble.classList.add("tooltip-bottom-pinned");
          tooltipBubble.style.left = "50%";
          tooltipBubble.style.bottom = "16px";
          tooltipBubble.style.top = "";
          tooltipBubble.style.transform = "translateX(-50%)";
        } else {
          let left = rect.left;
          if (left + bubbleRect.width + 8 > window.innerWidth) left = window.innerWidth - bubbleRect.width - 8;
          tooltipBubble.style.left = Math.max(8, left) + "px";
          tooltipBubble.style.top = top + "px";
          tooltipBubble.style.bottom = "";
          tooltipBubble.style.transform = "";
        }
      }, tooltipDelayMs);
    }
    document.addEventListener("mouseover", (ev) => {
      if (!tooltipsEnabled || isTouchDevice2) return;
      const target = ev.target;
      const placeholderEl = target.closest ? target.closest("input[placeholder]") : null;
      if (placeholderEl && !placeholderEl.value && placeholderOverflowWidth(placeholderEl)) {
        if (placeholderEl === tooltipTarget) return;
        if (tooltipTimer !== null) clearTimeout(tooltipTimer);
        tooltipTarget = placeholderEl;
        showTooltipBubble(placeholderEl, placeholderEl.placeholder);
        return;
      }
      const el = target.closest("[title]");
      if (!el || el === tooltipTarget) return;
      if (tooltipTimer !== null) clearTimeout(tooltipTimer);
      tooltipTarget = el;
      const tipText = el.getAttribute("title");
      if (!tipText) return;
      el.dataset.tipStash = tipText;
      el.removeAttribute("title");
      showTooltipBubble(el, tipText);
    });
    document.addEventListener("mouseout", (ev) => {
      if (isTouchDevice2) return;
      const el = ev.target.closest("[title], [data-tip-stash], input[placeholder]");
      if (!el) return;
      if (tooltipTimer !== null) clearTimeout(tooltipTimer);
      if (el.dataset.tipStash) {
        el.setAttribute("title", el.dataset.tipStash);
        delete el.dataset.tipStash;
      }
      if (tooltipTarget === el) {
        tooltipTarget = null;
        tooltipBubble.style.display = "none";
      }
    });
    btnSettings.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (settingsPanel.style.display === "flex") {
        hidePanel(settingsPanel);
        return;
      }
      [themeCustomPanel, favoritesPanel, logPanel, achievementsPanel, shopPanel, tagDetailsPanel].forEach(hidePanel);
      showPanel(settingsPanel);
      const rect = btnSettings.getBoundingClientRect();
      positionMenu(settingsPanel, rect.right - settingsPanel.offsetWidth, rect.bottom + 6);
    });
    settingsCloseBtn.addEventListener("click", () => hidePanel(settingsPanel));
    (function initSettingsSections() {
      let saved = {};
      try {
        saved = JSON.parse(localStorage.getItem(SETTINGS_SECTIONS_KEY) || "{}") || {};
      } catch (e) {
      }
      document.querySelectorAll("#settingsPanel .settings-section").forEach((section) => {
        const id = section.dataset.section;
        const defaultExpanded = id !== "danger";
        const expanded = Object.prototype.hasOwnProperty.call(saved, id) ? !!saved[id] : defaultExpanded;
        section.classList.toggle("expanded", expanded);
        const header = section.querySelector(".settings-section-header");
        header.addEventListener("click", () => {
          const nowExpanded = !section.classList.contains("expanded");
          section.classList.toggle("expanded", nowExpanded);
          let state = {};
          try {
            state = JSON.parse(localStorage.getItem(SETTINGS_SECTIONS_KEY) || "{}") || {};
          } catch (e) {
          }
          state[id] = nowExpanded;
          saveSettingsSectionState(state);
        });
      });
    })();
    async function applyFontZoomFromSlider() {
      const px = fontSizeSlider.value;
      await applyAppZoom(parseInt(px, 10) / 14);
      try {
        localStorage.setItem("dts-font-size", px);
      } catch (e) {
      }
      if (settingsPanel.style.display === "flex") {
        requestAnimationFrame(() => {
          const rect = btnSettings.getBoundingClientRect();
          positionMenu(settingsPanel, rect.right - settingsPanel.offsetWidth, rect.bottom + 6);
        });
      }
    }
    fontSizeSlider.addEventListener("input", () => {
      fontSizeVal.textContent = fontSizeSlider.value + "px";
    });
    fontSizeSlider.addEventListener("change", applyFontZoomFromSlider);
    (function initFontSize() {
      let px = "14";
      try {
        px = localStorage.getItem("dts-font-size") || "14";
      } catch (e) {
      }
      fontSizeSlider.value = px;
      fontSizeVal.textContent = px + "px";
      applyAppZoom(parseInt(px, 10) / 14);
    })();
    powerHighlightToggle.addEventListener("change", () => {
      document.documentElement.classList.toggle("power-highlight", powerHighlightToggle.checked);
      try {
        localStorage.setItem("dts-power-highlight", powerHighlightToggle.checked ? "1" : "0");
      } catch (e) {
      }
    });
    powerFillToggle.addEventListener("change", () => {
      document.documentElement.classList.toggle("power-fill", powerFillToggle.checked);
      try {
        localStorage.setItem("dts-power-fill", powerFillToggle.checked ? "1" : "0");
      } catch (e) {
      }
    });
    (function initPowerHighlight() {
      let highlightOn = true, fillOn = false;
      try {
        highlightOn = localStorage.getItem("dts-power-highlight") !== "0";
        fillOn = localStorage.getItem("dts-power-fill") === "1";
      } catch (e) {
      }
      powerHighlightToggle.checked = highlightOn;
      powerFillToggle.checked = fillOn;
      document.documentElement.classList.toggle("power-highlight", highlightOn);
      document.documentElement.classList.toggle("power-fill", fillOn);
    })();
    initPowerTools();
    initAchievements({ getDirHandle: () => dirHandle, getEditLog: () => editLog, refreshThemeDropdownLabel: () => themeDropdownCtrl.refreshLabel() });
    initAchievementPanels();
    initTagPruner(buildTagIndex, refreshRightPanels, setMirroredSelectionFilter);
    initTagAutocomplete({
      ensureWikiDataLoaded,
      getCustomTagNote,
      setCustomTagNote,
      ensureAllTagsLoaded,
      addTagToEntry,
      refreshRightPanels
    });
    tagAutocompleteToggle.addEventListener("change", () => {
      setTagAutocompleteEnabled(tagAutocompleteToggle.checked);
      try {
        localStorage.setItem("dts-tag-autocomplete", tagAutocompleteEnabled ? "1" : "0");
      } catch (e) {
      }
    });
    (function initTagAutocompletePref() {
      let on = false;
      try {
        on = localStorage.getItem("dts-tag-autocomplete") === "1";
      } catch (e) {
      }
      setTagAutocompleteEnabled(on);
      tagAutocompleteToggle.checked = on;
    })();
    btnViewWd14TransferList.addEventListener("click", () => {
      const sets = getWd14TransferSets();
      const html = sets.map((s) => `
      <div style="margin-bottom:16px;">
        <div style="font-weight:600; margin-bottom:2px;">${s.name} <span style="font-weight:400; color:var(--text-faint);">(${s.total})</span></div>
        <div style="font-size:11.5px; color:var(--text-muted); margin-bottom:4px;">${s.desc}</div>
        ${s.groups.map((g) => `
          <div style="margin:8px 0 2px; font-weight:600; font-size:11.5px; color:var(--text-primary);">${g.family} <span style="font-weight:400; color:var(--text-faint);">(${g.tags.length})</span></div>
          <div class="chiprow">
            ${g.tags.map((t) => `<span class="chip chip-static" data-tag="${t}"><span>${t}</span></span>`).join("")}
          </div>`).join("")}
      </div>`).join("");
      showInfoModal(html, "WD14 SynthDat transfer list", (body) => attachAcChipHover(body));
    });
    btnExportAppState.addEventListener("click", async () => {
      if (!window.electronAPI || !window.electronAPI.exportAppState) {
        toast("Export isn't available in this build.");
        return;
      }
      const localStorageDump = {};
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key !== null) localStorageDump[key] = localStorage.getItem(key);
        }
      } catch (e) {
      }
      const state = {
        exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
        appVersion: APP_VERSION,
        runtime: {
          datasetLoaded: !!dirHandle,
          imageCount: entries.length,
          viewMode: viewMode2,
          currentTheme: document.documentElement.getAttribute("data-theme") || "studio",
          panelLayout,
          rightPanelCollapsed: rightAside.classList.contains("right-panel-collapsed"),
          masterTagModeActive
        },
        localStorage: localStorageDump
      };
      try {
        const result = await window.electronAPI.exportAppState(JSON.stringify(state, null, 2));
        toast(result.ok ? `Exported app state to ${result.path}` : result.message || "Export failed.", result.ok ? 5e3 : 4e3);
      } catch (err) {
        toast("Failed to export app state: " + err.message);
      }
    });
    tooltipsToggle.addEventListener("change", () => {
      tooltipsEnabled = tooltipsToggle.checked;
      try {
        localStorage.setItem("dts-tooltips-enabled", tooltipsEnabled ? "1" : "0");
      } catch (e) {
      }
    });
    (function initTooltipsPref() {
      let on = true;
      try {
        on = localStorage.getItem("dts-tooltips-enabled") !== "0";
      } catch (e) {
      }
      tooltipsEnabled = on;
      tooltipsToggle.checked = on;
    })();
    tooltipDelaySlider.addEventListener("input", () => {
      tooltipDelayMs = parseInt(tooltipDelaySlider.value, 10);
      tooltipDelayVal.textContent = tooltipDelayMs + "ms";
      try {
        localStorage.setItem("dts-tooltip-delay", String(tooltipDelayMs));
      } catch (e) {
      }
    });
    (function initTooltipDelayPref() {
      let ms = 1e3;
      try {
        ms = parseInt(localStorage.getItem("dts-tooltip-delay") || "1000", 10) || 1e3;
      } catch (e) {
      }
      ms = Math.max(100, Math.min(2e3, ms));
      tooltipDelayMs = ms;
      tooltipDelaySlider.value = String(ms);
      tooltipDelayVal.textContent = ms + "ms";
    })();
    btnDiscreteToggle.addEventListener("click", () => {
      discreteModeOn = !discreteModeOn;
      document.documentElement.classList.toggle("discrete-mode", discreteModeOn);
      btnDiscreteToggle.classList.toggle("active", discreteModeOn);
    });
    btnDiscreteOff.addEventListener("click", () => {
      discreteModeOn = false;
      document.documentElement.classList.remove("discrete-mode");
      btnDiscreteToggle.classList.remove("active");
    });
    btnPurgeAllTags.addEventListener("click", () => {
      purgeConfirmCount++;
      if (purgeConfirmCount === 1) {
        btnPurgeAllTags.textContent = "\u26A0 Click 2 more times to confirm purge";
        setTimeout(() => {
          if (purgeConfirmCount < 3) {
            purgeConfirmCount = 0;
            btnPurgeAllTags.textContent = "\u{1F5D1} Purge ALL tags in this folder\u2026";
          }
        }, 4e3);
        return;
      }
      if (purgeConfirmCount === 2) {
        btnPurgeAllTags.textContent = "\u26A0 Click once more to PERMANENTLY purge everything";
        return;
      }
      purgeConfirmCount = 0;
      btnPurgeAllTags.textContent = "\u{1F5D1} Purge ALL tags in this folder\u2026";
      const affected = [];
      for (const e of entries) {
        if (e.disabled) continue;
        if (e.tags.length === 0) continue;
        const prevTags = e.tags.slice();
        e.tags = [];
        markDirty(e);
        affected.push({ base: e.base, prevTags, newTags: [] });
      }
      if (affected.length === 0) {
        toast("No tags to purge.");
        return;
      }
      recordChange("void", `Purged ALL tags across ${affected.length} image(s).`, affected);
      refreshAllUI();
      toast(`Purged every tag from ${affected.length} image(s). Use Undo if that was a mistake.`);
      hidePanel(settingsPanel);
    });
    function unsavedChangesDescription() {
      const dirtyCount = entries.filter((e) => e.dirty).length;
      const parts = [];
      if (dirtyCount > 0) parts.push(`${dirtyCount} unsaved caption change(s)`);
      if (rulesDirty) parts.push("unsaved Retroactive Merge/Void rule change(s)");
      return parts.length ? parts.join(" and ") : null;
    }
    async function confirmDatasetSwitch(message) {
      const unsaved = unsavedChangesDescription();
      if (!unsaved) return true;
      return showConfirmModal(`You have ${unsaved}. ${message}`, { okLabel: "Switch anyway", danger: true });
    }
    async function openFolderHandle3(handle) {
      if (!await confirmDatasetSwitch("Switch datasets anyway without saving?")) return;
      dirHandle = handle;
      await loadFolder();
    }
    initFavorites({
      getDirHandle: () => dirHandle,
      openFolderHandle: openFolderHandle3,
      onFavoriteChanged: syncPinFromFavoriteChange
    });
    initDatasetManager({
      getDirHandle: () => dirHandle,
      openFolderHandle: openFolderHandle3,
      switchTab: switchTab2
    });
    initTagsEdit({
      getEntries: () => entries,
      getEntryByBase: (base) => entryByBase.get(base),
      getDirHandle: () => dirHandle,
      getDisabledDirHandle: () => disabledDirHandle,
      setDisabledDirHandle: (h) => {
        disabledDirHandle = h;
      },
      reindexEntry: (oldBase, newBase) => {
        const entry = entryByBase.get(oldBase);
        if (entry) {
          entryByBase.delete(oldBase);
          entryByBase.set(newBase, entry);
        }
        if (entryMeta[oldBase] !== void 0) {
          entryMeta[newBase] = entryMeta[oldBase];
          delete entryMeta[oldBase];
        }
      },
      resetSingleIndex: () => resetSingleIndex3(),
      refreshStats: () => refreshStats(),
      refreshAllUI: () => refreshAllUI(),
      renderCurrentView: () => renderCurrentView(),
      applyIsolateDirection: (affected, direction) => applyIsolateDirection(affected, direction)
    });
    initTagIndex({
      getEntries: () => entries,
      getGalleryFilter: () => galleryFilter,
      getGallerySortMode: () => gallerySortMode,
      getGallerySortDir: () => gallerySortDir,
      resetSingleIndex: () => resetSingleIndex3(),
      renderCurrentView: () => renderCurrentView()
    });
    initMasterTagControl({
      getEntries: () => entries,
      getEntryByBase: (base) => entryByBase.get(base),
      filteredEntries: () => filteredEntries(),
      renderCurrentView: () => renderCurrentView(),
      refreshAllUI: () => refreshAllUI(),
      getEntryMeta: () => entryMeta,
      saveEntryMeta: () => saveEntryMeta(),
      deleteEntriesPermanently: (entriesList) => deleteEntriesPermanently(entriesList),
      onStartSequential: (from) => startSequentialDetail(from)
    });
    initWd14Tagger({
      getEntries: () => entries,
      refreshAllUI: () => refreshAllUI()
    });
    initSynthDatOverseer({
      getDirHandle: () => dirHandle,
      addEntryFromNewFile: (...args) => buildEntry(args[0], args[1], args[2], args[3], args[4], args[5], args[6]),
      refreshAllUI: () => refreshAllUI()
    });
    initEditLog({
      getDirHandle: () => dirHandle,
      getEntryByBase: (base) => entryByBase.get(base),
      applyTagDirection: (affected, direction) => applyTagDirection(affected, direction),
      applyRenameDirection: (affected, direction) => applyRenameDirection(affected, direction),
      applyPixelDirection: (affected, direction) => applyPixelDirection(affected, direction),
      applyIsolateDirection: (affected, direction) => applyIsolateDirection(affected, direction),
      moveEntry: (entry, toDisabled) => moveEntry(entry, toDisabled),
      trackStat: (key, amount) => trackStat(key, amount),
      checkAchievements: () => checkAchievements(),
      refreshAllUI: () => refreshAllUI(),
      getUndoStack: () => undoStack,
      getRedoStack: () => redoStack
    });
    initCanonicalTags({
      getDirHandle: () => dirHandle,
      getEntries: () => entries,
      markDirty: (e) => markDirty(e),
      markRulesDirty: () => markRulesDirty(),
      recordChange: (type, summary, affected, extra) => recordChange(type, summary, affected, extra),
      refreshAllUI: () => refreshAllUI()
    });
    initView({
      getEntries: () => entries,
      getEntryByBase: (base) => entryByBase.get(base),
      getDirHandle: () => dirHandle,
      addEntryFromNewFile: (base, imgHandle, imgName, txtHandle, txtExisted, tags, disabled) => buildEntry(base, imgHandle, imgName, txtHandle, txtExisted, tags, disabled),
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
      getRightPanelCollapsed: () => rightAside.classList.contains("right-panel-collapsed"),
      getHideTags: () => localStorage.getItem("dts-hide-tags") === "1"
    });
    function baseName(name) {
      const i = name.lastIndexOf(".");
      return i === -1 ? name : name.slice(0, i);
    }
    function isImageFile2(name) {
      const lower = name.toLowerCase();
      return IMAGE_EXT.some((ext) => lower.endsWith(ext));
    }
    btnOpen.addEventListener("click", async () => {
      if (!window.showDirectoryPicker) {
        toast("Your browser does not support folder access. Use Chrome or Edge, opened as a normal tab (not an embedded preview).", 5e3);
        return;
      }
      if (!await confirmDatasetSwitch("Open a different folder anyway without saving?")) return;
      const picked = await pickDatasetFolder();
      if (!picked) return;
      fileCatFlyout.style.display = "none";
      fileCatFlyout.classList.remove("menu-in");
      dirHandle = picked;
      try {
        await loadFolder();
        if (entries.length === 0) {
          toast(`"${picked.name}" has no images \u2014 pick a folder with images to tag.`, 4200);
          return;
        }
      } catch (err) {
        toast("Could not load that folder \u2014 it may be invalid, moved, or missing permission. Try again.", 4200);
        dirHandle = null;
        disabledDirHandle = null;
        entries = [];
        entryByBase.clear();
        btnAddFavorite.disabled = true;
        btnUnloadDataset.disabled = true;
        btnReloadDataset.disabled = true;
        resetUndoRedo();
        masterSelectedImages.clear();
        resetStickyCompare();
        updateUndoRedoButtons();
        dropHint.style.display = "flex";
        dropHintWrap.style.display = "block";
        galleryToolbar.style.display = "none";
        return;
      }
      maybePromptAddDataset(picked);
    });
    async function scanDirInto(handle, disabled) {
      const imageHandles = /* @__PURE__ */ new Map();
      const txtHandles = /* @__PURE__ */ new Map();
      for await (const h of handle.values()) {
        if (h.kind !== "file") continue;
        const name = h.name;
        if (isImageFile2(name)) {
          imageHandles.set(baseName(name), { handle: h, name });
        } else if (name.toLowerCase().endsWith(".txt")) {
          txtHandles.set(baseName(name), { handle: h, name });
        }
      }
      const bases = Array.from(imageHandles.keys()).sort((a, b) => a.localeCompare(b, void 0, { numeric: true }));
      for (const base of bases) {
        const img = imageHandles.get(base);
        const txtEntry = txtHandles.get(base);
        let tags = [];
        let txtHandle = null;
        let txtExisted = false;
        if (txtEntry) {
          txtHandle = txtEntry.handle;
          txtExisted = true;
          try {
            const file = await txtHandle.getFile();
            const raw = (await file.text()).trim();
            tags = raw.length ? raw.split(",").map((t) => t.trim().replace(/_/g, " ").replace(/\s+/g, " ")).filter(Boolean) : [];
          } catch (e) {
            tags = [];
          }
        }
        await buildEntry(base, img.handle, img.name, txtHandle, txtExisted, tags, disabled);
      }
    }
    async function buildEntry(base, imgHandle, imgName, txtHandle, txtExisted, tags, disabled) {
      const file = await imgHandle.getFile();
      const objectUrl = URL.createObjectURL(file);
      const entry = {
        base,
        imgName,
        imgHandle,
        txtHandle,
        txtName: base + ".txt",
        txtExisted,
        objectUrl,
        tags,
        dirty: false,
        disabled,
        // Default meta for an entry created OUTSIDE the normal folder-scan path
        // (e.g. SynthDat's addEntryFromNewFile) — loadFolder()'s own post-scan
        // loop overwrites this from the persisted _dts_meta.json (or stamps a
        // fresh one) for every entry built by scanDirInto(), so this default
        // only actually sticks for entries built afterward. dateAdded here is
        // "the moment this entry was actually created," which is exactly right
        // for that path (a SynthDat image didn't exist a moment before this).
        meta: { flaggedTags: [], note: "", noteAlwaysVisible: false, locked: false, mergeImmune: false, antivoid: false, dateAdded: Date.now() }
      };
      entries.push(entry);
      entryByBase.set(base, entry);
      loadImageDimensions(entry);
      return entry;
    }
    function loadImageDimensions(entry) {
      const probe = new Image();
      probe.onload = () => {
        entry.width = probe.naturalWidth;
        entry.height = probe.naturalHeight;
      };
      probe.src = entry.objectUrl;
    }
    async function deleteEntryFilesAndState(entry) {
      if (!dirHandle) return false;
      const sourceDir = entry.disabled ? disabledDirHandle : dirHandle;
      if (!sourceDir) return false;
      try {
        await sourceDir.removeEntry(entry.imgName);
      } catch (e) {
      }
      try {
        await sourceDir.removeEntry(entry.txtName);
      } catch (e) {
      }
      const idx = entries.indexOf(entry);
      if (idx !== -1) entries.splice(idx, 1);
      entryByBase.delete(entry.base);
      delete entryMeta[entry.base];
      masterSelectedImages.delete(entry.base);
      try {
        URL.revokeObjectURL(entry.objectUrl);
      } catch (e) {
      }
      return true;
    }
    async function applyIsolateDirection(affected, direction) {
      let count = 0;
      for (const a of affected) {
        const st = typeof a.logId === "number" ? getIsolateState(a.logId) : void 0;
        if (!st || !dirHandle) continue;
        if (direction === "undo") {
          const e = entryByBase.get(a.base);
          if (!e) continue;
          if (await deleteEntryFilesAndState(e)) count++;
        } else {
          try {
            const imgHandle = await dirHandle.getFileHandle(st.imgName, { create: true });
            const iw = await imgHandle.createWritable();
            await iw.write(st.bytes);
            await iw.close();
            const txtHandle = await dirHandle.getFileHandle(a.base + ".txt", { create: true });
            const tw = await txtHandle.createWritable();
            await tw.write(st.tags.map((t) => t.replace(/ /g, "_")).join(","));
            await tw.close();
            const existing = entryByBase.get(a.base);
            if (existing) {
              try {
                URL.revokeObjectURL(existing.objectUrl);
              } catch (e) {
              }
              existing.objectUrl = URL.createObjectURL(new Blob([st.bytes], { type: st.mime }));
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
    async function deleteEntryPermanently(entry) {
      if (!dirHandle) return;
      try {
        const ok = await deleteEntryFilesAndState(entry);
        if (!ok) return;
        saveEntryMeta();
        toast(`Permanently deleted "${entry.imgName}".`, 3200);
        pushLogEntry({
          type: "delete",
          summary: `Permanently deleted ${entry.imgName}`,
          affected: [{ base: entry.base }]
        });
        resetSingleIndex3();
        refreshAllUI();
        checkAchievements();
      } catch (err) {
        toast("Could not delete that file \u2014 check folder permissions.", 3600);
      }
    }
    async function deleteEntriesPermanently(entriesList) {
      if (!dirHandle) return 0;
      let deleted = 0;
      for (const entry of entriesList) {
        if (entry.meta && entry.meta.locked) continue;
        try {
          const ok = await deleteEntryFilesAndState(entry);
          if (ok) deleted++;
        } catch (err) {
        }
      }
      if (deleted === 0) return 0;
      saveEntryMeta();
      pushLogEntry({
        type: "delete",
        summary: `Permanently deleted ${deleted} image(s)`,
        affected: entriesList.filter((e) => !(e.meta && e.meta.locked)).map((e) => ({ base: e.base }))
      });
      resetSingleIndex3();
      refreshAllUI();
      checkAchievements();
      return deleted;
    }
    const META_FILE_NAME = "_dts_meta.json";
    async function loadEntryMeta() {
      entryMeta = {};
      if (!dirHandle) return;
      try {
        const handle = await dirHandle.getFileHandle(META_FILE_NAME, { create: false });
        const file = await handle.getFile();
        const parsed = JSON.parse((await file.text()).trim() || "{}");
        if (parsed && typeof parsed === "object") entryMeta = parsed;
      } catch (err) {
        entryMeta = {};
      }
    }
    async function saveEntryMeta() {
      if (!dirHandle) return;
      try {
        const handle = await dirHandle.getFileHandle(META_FILE_NAME, { create: true });
        const writable = await handle.createWritable();
        await writable.write(JSON.stringify(entryMeta, null, 2));
        await writable.close();
      } catch (err) {
      }
    }
    async function loadFolder() {
      if (!dirHandle) return;
      exitSequentialDetail();
      toast("Scanning folder\u2026");
      entries = [];
      entryByBase.clear();
      disabledDirHandle = null;
      btnAddFavorite.disabled = !dirHandle;
      btnUnloadDataset.disabled = !dirHandle;
      btnReloadDataset.disabled = !dirHandle;
      resetUndoRedo();
      masterSelectedImages.clear();
      resetStickyCompare();
      updateUndoRedoButtons();
      [themeCustomPanel, favoritesPanel, logPanel, achievementsPanel, shopPanel, tagDetailsPanel].forEach(hidePanel);
      await scanDirInto(dirHandle, false);
      try {
        disabledDirHandle = await dirHandle.getDirectoryHandle("Disabled", { create: false });
        await scanDirInto(disabledDirHandle, true);
      } catch (e) {
        disabledDirHandle = null;
      }
      try {
        const legacyUnsavedApprovedDir = await dirHandle.getDirectoryHandle("Unsaved Approved", { create: false });
        await scanDirInto(legacyUnsavedApprovedDir, false);
      } catch (e) {
      }
      await loadEntryMeta();
      let metaNeedsDateAddedSave = false;
      for (const e of entries) {
        e.meta = entryMeta[e.base] || { reviewColor: null, flaggedTags: [], note: "", noteAlwaysVisible: false, locked: false, mergeImmune: false, antivoid: false };
        if (!e.meta.dateAdded) {
          e.meta.dateAdded = Date.now();
          entryMeta[e.base] = e.meta;
          metaNeedsDateAddedSave = true;
        }
      }
      if (metaNeedsDateAddedSave) saveEntryMeta();
      dropHint.style.display = entries.length ? "none" : "flex";
      dropHintWrap.style.display = entries.length ? "none" : "block";
      galleryToolbar.style.display = entries.length ? "flex" : "none";
      galleryFilter = { base: "all", terms: [], mode: "AND", excludes: "", disabledView: false, exactMatch: filterExactToggle.checked };
      filterInput.value = "";
      excludeBadge.style.display = "none";
      [filterAllBtn, filterUntaggedBtn, filterDirtyBtn].forEach((b) => b.classList.remove("active"));
      filterAllBtn.classList.add("active");
      resetSingleIndex3();
      switchView(viewMode2 === "compact" ? "compact" : "grid");
      await loadEditLogForFolder();
      await loadFolderStats();
      await loadCanonicalRulesForFolder();
      resetRulesDirty();
      await loadSynthDatSettingsForFolder();
      renderAll();
      checkAchievements();
      const disabledNote = disabledDirHandle ? " (including a Disabled/ folder)" : "";
      toast(`Loaded ${entries.length} image${entries.length === 1 ? "" : "s"}${disabledNote}.`);
    }
    async function unloadDataset() {
      if (!dirHandle) return;
      const unsavedUnload = unsavedChangesDescription();
      if (unsavedUnload) {
        const ok = await showConfirmModal(`You have ${unsavedUnload}. Unload the dataset anyway without saving?`, { okLabel: "Unload anyway", danger: true });
        if (!ok) return;
      }
      trackStat("dataset_unloads");
      checkAchievements();
      exitSequentialDetail();
      dirHandle = null;
      disabledDirHandle = null;
      entries = [];
      entryByBase.clear();
      btnAddFavorite.disabled = true;
      btnUnloadDataset.disabled = true;
      btnReloadDataset.disabled = true;
      resetUndoRedo();
      masterSelectedImages.clear();
      resetStickyCompare();
      updateUndoRedoButtons();
      [themeCustomPanel, favoritesPanel, logPanel, achievementsPanel, shopPanel, tagDetailsPanel].forEach(hidePanel);
      dropHint.style.display = "flex";
      dropHintWrap.style.display = "block";
      galleryToolbar.style.display = "none";
      galleryFilter = { base: "all", terms: [], mode: "AND", excludes: "", disabledView: false, exactMatch: filterExactToggle.checked };
      filterInput.value = "";
      excludeBadge.style.display = "none";
      [filterAllBtn, filterUntaggedBtn, filterDirtyBtn].forEach((b) => b.classList.remove("active"));
      filterAllBtn.classList.add("active");
      resetSingleIndex3();
      switchView("grid");
      await loadEditLogForFolder();
      await loadFolderStats();
      await loadCanonicalRulesForFolder();
      resetRulesDirty();
      await loadSynthDatSettingsForFolder();
      renderAll();
      toast("Dataset unloaded.");
    }
    btnUnloadDataset.addEventListener("click", unloadDataset);
    async function reloadDataset() {
      if (!dirHandle) return;
      const unsavedReload = unsavedChangesDescription();
      if (unsavedReload) {
        const ok = await showConfirmModal(`You have ${unsavedReload}. Reload the dataset from disk anyway, discarding them?`, { okLabel: "Reload anyway", danger: true });
        if (!ok) return;
      }
      fileCatFlyout.style.display = "none";
      fileCatFlyout.classList.remove("menu-in");
      await loadFolder();
    }
    btnReloadDataset.addEventListener("click", reloadDataset);
    buildPersistentDropdown(
      filterModeDropdown,
      [
        { value: "AND", label: "AND", title: "Show images containing ALL of the searched tags" },
        { value: "OR", label: "OR", title: "Show images containing ANY of the searched tags" },
        { value: "XOR", label: "XOR", title: "Show images containing EXACTLY ONE of the searched tags" },
        { value: "NOT", label: "NOT", title: "Show images containing NONE of the searched tags" }
      ],
      () => galleryFilter.mode,
      (val) => {
        galleryFilter.mode = val;
        renderCurrentView();
      }
    );
    btnFlagIsolated.addEventListener("click", () => {
      isolatedFlagActive = !isolatedFlagActive;
      btnFlagIsolated.classList.toggle("active", isolatedFlagActive);
      if (isolatedFlagActive) {
        folderStats.isolated_flag_used = true;
        saveFolderStats();
        checkAchievements();
      }
      renderCurrentView();
    });
    buildPersistentDropdown(
      gallerySortDropdown,
      [
        { value: "filename", label: "Filename" },
        { value: "dateadded", label: "Date added" },
        { value: "resolution", label: "Resolution" },
        { value: "tagcount", label: "Tag count" },
        { value: "dirty", label: "Unsaved first" }
      ],
      () => gallerySortMode,
      (val) => onGallerySortChange(val)
    );
    buildPersistentDropdown(
      cardTagSortDropdown,
      [
        { value: "default", label: "Default order" },
        { value: "alphabetical", label: "Alphabetical" },
        { value: "frequency", label: "By frequency" }
      ],
      () => cardTagSortMode,
      (val) => {
        cardTagSortMode = val;
        renderCurrentView();
      }
    );
    const GALLERY_COLUMNS_KEY = "dts-gallery-columns";
    let galleryColumns = "auto";
    function applyGalleryColumnOverride() {
      const root = document.documentElement;
      if (galleryColumns === "auto") {
        root.style.removeProperty("--gallery-cols");
        root.style.removeProperty("--gallery-col-count");
        root.style.removeProperty("--gallery-col-width");
      } else {
        root.style.setProperty("--gallery-cols", `repeat(${galleryColumns}, 1fr)`);
        root.style.setProperty("--gallery-col-count", String(galleryColumns));
        root.style.setProperty("--gallery-col-width", "1px");
      }
    }
    try {
      const savedGalleryColumns = localStorage.getItem(GALLERY_COLUMNS_KEY);
      if (savedGalleryColumns) galleryColumns = savedGalleryColumns;
    } catch (e) {
    }
    applyGalleryColumnOverride();
    buildPersistentDropdown(
      galleryColumnsDropdown,
      [
        { value: "auto", label: "Auto (default)" },
        { value: "2", label: "2 columns" },
        { value: "3", label: "3 columns" },
        { value: "4", label: "4 columns" },
        { value: "5", label: "5 columns" },
        { value: "6", label: "6 columns" },
        { value: "7", label: "7 columns" },
        { value: "8", label: "8 columns" }
      ],
      () => galleryColumns,
      (val) => {
        galleryColumns = val;
        try {
          localStorage.setItem(GALLERY_COLUMNS_KEY, val);
        } catch (e) {
        }
        applyGalleryColumnOverride();
        if (val !== "auto") {
          folderStats.gallery_columns_forced = true;
          saveFolderStats();
          checkAchievements();
        }
      }
    );
    function rightPanelIsFlipped() {
      return shellEl.classList.contains("layout-gallery-right");
    }
    const RIGHT_RESIZE_HANDLE_WIDTH = 8;
    const RIGHT_RESIZE_HANDLE_GAP = 6;
    let panelLayout = "standard";
    function applyPanelLayout(val) {
      shellEl.classList.remove("layout-gallery-left", "layout-gallery-right");
      if (val === "gallery-left") shellEl.classList.add("layout-gallery-left");
      else if (val === "gallery-right") shellEl.classList.add("layout-gallery-right");
      panelLayout = val;
      try {
        localStorage.setItem("dts-panel-layout", val);
      } catch (e) {
      }
      applyRightPanelCollapsedArrow();
      repositionRightResizeHandleSoon();
    }
    (function initPanelLayout() {
      let saved = "standard";
      try {
        saved = localStorage.getItem("dts-panel-layout") || "standard";
      } catch (e) {
      }
      applyPanelLayout(saved);
    })();
    function applyRightPanelCollapsedArrow() {
      const collapsed = rightAside.classList.contains("right-panel-collapsed");
      const flipped = rightPanelIsFlipped();
      btnRightPanelCollapse.textContent = collapsed ? flipped ? "\u203A" : "\u2039" : flipped ? "\u2039" : "\u203A";
      btnRightPanelCollapse.title = collapsed ? "Show this panel" : "Hide this panel";
    }
    function applyRightPanelCollapsed(collapsed) {
      shellEl.classList.toggle("right-panel-collapsed", collapsed);
      rightAside.classList.toggle("right-panel-collapsed", collapsed);
      applyRightPanelCollapsedArrow();
      repositionRightResizeHandleSoon();
      try {
        localStorage.setItem("dts-right-panel-collapsed", collapsed ? "1" : "0");
      } catch (e) {
      }
    }
    (function initRightPanelCollapsed() {
      let saved = false;
      try {
        saved = localStorage.getItem("dts-right-panel-collapsed") === "1";
      } catch (e) {
      }
      applyRightPanelCollapsed(saved);
    })();
    btnRightPanelCollapse.addEventListener("click", () => {
      applyRightPanelCollapsed(!rightAside.classList.contains("right-panel-collapsed"));
    });
    const layoutDropdownCtrl = buildPersistentDropdown(
      layoutDropdown,
      [
        { value: "standard", label: "Standard (left \xB7 gallery \xB7 right)" },
        { value: "gallery-left", label: "Gallery left, panels right" },
        { value: "gallery-right", label: "Gallery right, panels left" }
      ],
      () => panelLayout,
      applyPanelLayout
    );
    const RIGHT_PANEL_MIN_WIDTH = 260;
    const RIGHT_PANEL_WIDTH_KEY = "dts-right-panel-width";
    let rightPanelWidth = 380;
    function rightPanelMaxWidth() {
      return Math.max(RIGHT_PANEL_MIN_WIDTH, window.innerWidth - 270 - 200);
    }
    function applyRightPanelWidth(px) {
      rightPanelWidth = Math.min(rightPanelMaxWidth(), Math.max(RIGHT_PANEL_MIN_WIDTH, px));
      shellEl.style.setProperty("--right-w", rightPanelWidth + "px");
    }
    function repositionRightResizeHandle() {
      const rect = rightAside.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      const shellRect = shellEl.getBoundingClientRect();
      const xViewport = rightPanelIsFlipped() ? rect.right - RIGHT_RESIZE_HANDLE_WIDTH - RIGHT_RESIZE_HANDLE_GAP : rect.left + RIGHT_RESIZE_HANDLE_GAP;
      rightPanelResizeHandle.style.left = Math.round(xViewport - shellRect.left) + "px";
    }
    function repositionRightResizeHandleSoon() {
      repositionRightResizeHandle();
      setTimeout(repositionRightResizeHandle, 200);
    }
    (function initRightPanelWidth() {
      let saved = NaN;
      try {
        saved = parseInt(localStorage.getItem(RIGHT_PANEL_WIDTH_KEY) || "", 10);
      } catch (e) {
      }
      applyRightPanelWidth(isNaN(saved) ? rightPanelWidth : saved);
      repositionRightResizeHandle();
    })();
    window.addEventListener("resize", repositionRightResizeHandle);
    rightPanelResizeHandle.addEventListener("mousedown", (ev) => {
      if (rightAside.classList.contains("right-panel-collapsed")) return;
      ev.preventDefault();
      const startX = ev.clientX;
      const startWidth = rightPanelWidth;
      const flipped = rightPanelIsFlipped();
      shellEl.style.transition = "none";
      rightPanelResizeHandle.classList.add("resizing");
      function onMove(mv) {
        const dx = mv.clientX - startX;
        applyRightPanelWidth(startWidth + (flipped ? dx : -dx));
        repositionRightResizeHandle();
      }
      function onUp() {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        shellEl.style.transition = "";
        rightPanelResizeHandle.classList.remove("resizing");
        try {
          localStorage.setItem(RIGHT_PANEL_WIDTH_KEY, String(rightPanelWidth));
        } catch (e) {
        }
      }
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });
    function onGallerySortChange(mode) {
      gallerySortMode = mode;
      folderStats.sort_modes_used = Array.from(/* @__PURE__ */ new Set([...folderStats.sort_modes_used || [], gallerySortMode]));
      saveFolderStats();
      renderCurrentView();
      checkAchievements();
    }
    gallerySortDirBtn.addEventListener("click", () => {
      gallerySortDir = gallerySortDir === "asc" ? "desc" : "asc";
      gallerySortDirBtn.textContent = gallerySortDir === "asc" ? "\u25B2 Asc" : "\u25BC Desc";
      renderCurrentView();
    });
    initTagDetails();
    initRandomFacts();
    initClickFlash();
    initInfoButtons();
    initHelp();
    initMenuKeyboardNav(() => {
      if (folderStats.keyboard_menu_nav_used) return;
      folderStats.keyboard_menu_nav_used = true;
      saveFolderStats();
      checkAchievements();
    });
    btnAddTagPruner.addEventListener("click", addTagPruner);
    function refreshAllUI() {
      refreshStats();
      renderCurrentView();
      renderTagPruners();
      renderMasterSelectionSummary();
      updateDirtyUI();
    }
    function renderAll() {
      refreshAllUI();
    }
    if (window.electronAPI && window.electronAPI.onRequestClose) {
      window.electronAPI.onRequestClose(async () => {
        const unsavedClose = unsavedChangesDescription();
        if (unsavedClose) {
          const ok = await showConfirmModal(`You have ${unsavedClose}. Quit anyway without saving?`, { okLabel: "Quit anyway", danger: true });
          if (!ok) return;
        }
        window.electronAPI.confirmClose();
      });
    }
    if (isTouchDevice2) {
      const tagPrunerDock = document.querySelector('.tool-section[data-dock-id="tagPruner"]');
      const controlsArea = tagPrunerDock && tagPrunerDock.querySelector(".dock-controls-area");
      const scrollBody = tagPrunerDock && tagPrunerDock.querySelector(".dock-scroll-body");
      if (controlsArea) controlsArea.appendChild(btnOpenTagFrequencyList);
      if (scrollBody) scrollBody.appendChild(tagFamilyListArea);
    }
    renderTagPruners();
    updateLogButton();
    loadWallet();
    updateThemeSelectLocks();
    switchTab2("gallery");
    initDockSystem();
    async function uniqueDatasetFileName(handle, name) {
      const dot = name.lastIndexOf(".");
      const stem = dot < 0 ? name : name.slice(0, dot);
      const ext = dot < 0 ? "" : name.slice(dot);
      let candidate = name;
      for (let n = 2; n < 1e4; n++) {
        try {
          await handle.getFileHandle(candidate);
        } catch {
          return candidate;
        }
        candidate = `${stem} (${n})${ext}`;
      }
      return `${stem} ${Date.now()}${ext}`;
    }
    async function importImagesToDataset(files) {
      if (!files || !files.length || !dirHandle) return;
      const activeHandle = dirHandle;
      let added = 0, skipped = 0;
      for (const file of Array.from(files)) {
        if (!isImageFile2(file.name)) {
          skipped++;
          continue;
        }
        try {
          const imgName = await uniqueDatasetFileName(activeHandle, file.name);
          const imgHandle = await activeHandle.getFileHandle(imgName, { create: true });
          const writable = await imgHandle.createWritable();
          await writable.write(file);
          await writable.close();
          try {
            const txtHandle = await activeHandle.getFileHandle(imgName.replace(/\.[^.]+$/, "") + ".txt", { create: true });
            const txtWritable = await txtHandle.createWritable();
            await txtWritable.write("");
            await txtWritable.close();
          } catch {
          }
          added++;
        } catch {
          skipped++;
        }
      }
      if (!added) {
        toast(skipped ? "No images could be added." : "Nothing selected.", 2600);
        return;
      }
      toast(`Added ${added} image${added === 1 ? "" : "s"}${skipped ? ` (${skipped} skipped)` : ""}.`, 2600);
      await reloadDataset();
    }
    if (isTouchDevice2 && !document.getElementById("btnAddImages")) {
      const btnAddImages = document.createElement("button");
      btnAddImages.id = "btnAddImages";
      btnAddImages.textContent = "Add images\u2026";
      btnAddImages.title = "Import images from this device into the open dataset folder";
      btnAddImages.addEventListener("click", () => {
        if (!dirHandle) {
          toast("Open a dataset folder first.", 2600);
          return;
        }
        fileCatFlyout.style.display = "none";
        fileCatFlyout.classList.remove("menu-in");
        const picker = document.createElement("input");
        picker.type = "file";
        picker.accept = "image/*";
        picker.multiple = true;
        picker.addEventListener("change", () => {
          void importImagesToDataset(picker.files);
        });
        picker.click();
      });
      fileCatFlyout.appendChild(btnAddImages);
    }
    const IDLE_SUSPEND_MS = 3500;
    let idleSuspendTimer = null;
    function armIdleSuspend() {
      if (idleSuspendTimer) clearTimeout(idleSuspendTimer);
      document.documentElement.classList.remove("gpu-idle");
      idleSuspendTimer = setTimeout(() => {
        idleSuspendTimer = null;
        document.documentElement.classList.add("gpu-idle");
      }, IDLE_SUSPEND_MS);
    }
    for (const ev of ["pointermove", "pointerdown", "keydown", "wheel", "scroll"]) {
      document.addEventListener(ev, armIdleSuspend, { passive: true });
    }
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        document.documentElement.classList.add("gpu-idle");
        if (idleSuspendTimer) {
          clearTimeout(idleSuspendTimer);
          idleSuspendTimer = null;
        }
      } else {
        armIdleSuspend();
      }
    });
    armIdleSuspend();
  })();
})();
