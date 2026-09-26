(() => {
  // src/renderer/fs-access.ts
  var fsa = window;
  function hasDirectoryPicker() {
    return typeof fsa.showDirectoryPicker === "function";
  }
  function hasOpenFilePicker() {
    return typeof fsa.showOpenFilePicker === "function";
  }
  function hasSaveFilePicker() {
    return typeof fsa.showSaveFilePicker === "function";
  }
  function pickDirectory(opts = {}) {
    return fsa.showDirectoryPicker(opts);
  }
  function pickOpenFiles(opts) {
    return fsa.showOpenFilePicker(opts);
  }
  function pickSaveFile(opts) {
    return fsa.showSaveFilePicker(opts);
  }
  async function requestPermission(handle, mode) {
    const h = handle;
    return h.requestPermission ? h.requestPermission({ mode }) : "granted";
  }
  function serializeHandle(handle) {
    const h = handle;
    return h.toJSON ? h.toJSON() : handle;
  }
  function isMobileHandle(value) {
    return !!(value && value.__dtsMobileHandle);
  }
  function reviveHandle(value) {
    return window.__dtsReviveDirHandle ? window.__dtsReviveDirHandle(value) : value;
  }
  async function writeBytes(handle, data) {
    const writable = await handle.createWritable();
    await writable.write(data);
    await writable.close();
  }

  // src/renderer/storage.ts
  function getString(key, fallback = "") {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : v;
    } catch {
      return fallback;
    }
  }
  function setString(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
    }
  }
  function getJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed = JSON.parse(raw);
      return parsed === null || parsed === void 0 ? fallback : parsed;
    } catch {
      return fallback;
    }
  }
  function setJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
    }
  }
  function getBool(key, fallback = false) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? fallback : v === "1";
    } catch {
      return fallback;
    }
  }
  function setBool(key, value) {
    try {
      localStorage.setItem(key, value ? "1" : "0");
    } catch {
    }
  }
  function getInt(key, fallback) {
    try {
      const v = parseInt(localStorage.getItem(key) || "", 10);
      return Number.isNaN(v) ? fallback : v;
    } catch {
      return fallback;
    }
  }
  function setInt(key, value) {
    try {
      localStorage.setItem(key, String(value));
    } catch {
    }
  }

  // src/renderer/file-types.ts
  var IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".gif"];
  function isImageFile(name) {
    const lower = name.toLowerCase();
    return IMAGE_EXTS.some((ext) => lower.endsWith(ext));
  }

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
  var tagListTitle = $("tagListTitle");
  var leftSortDropdown = $("leftSortDropdown");
  var leftSortDirBtn = $("leftSortDirBtn");
  var btnResetFamilyOrder = $("btnResetFamilyOrder");
  var btnOpenTagFrequencyList = $("btnOpenTagFrequencyList");
  var tagFamilyListArea = $("tagFamilyListArea");
  var btnClearFilter = $("btnClearFilter");
  var filterModeDropdown = $("filterModeDropdown");
  var filterModeLock = $("filterModeLock");
  var btnFlagIsolated = $("btnFlagIsolated");
  var btnReviewFlagged = $("btnReviewFlagged");
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
  var dmTabBar = $("dmTabBar");
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
  var btnMasterMergeImmunizeToggle = $("btnMasterMergeImmunizeToggle");
  var btnMasterAntivoidToggle = $("btnMasterAntivoidToggle");
  var btnMasterAntimmunizeToggle = $("btnMasterAntimmunizeToggle");
  var btnMasterDisableSelected = $("btnMasterDisableSelected");
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
  var viewOriginalsBtn = $("viewOriginalsBtn");
  var btnBucketRun = $("btnBucketRun");
  var btnBucketRevert = $("btnBucketRevert");
  var btnBucketDownloadModel = $("btnBucketDownloadModel");
  var bucketModelStatusText = $("bucketModelStatusText");
  var bucketSideMin = $("bucketSideMin");
  var bucketSideMax = $("bucketSideMax");
  var bucketSideStep = $("bucketSideStep");
  var bucketGpu = $("bucketGpu");
  var bucketLog = $("bucketLog");
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

  // src/renderer/icons.ts
  var EMOJI_ICON = {
    "\u{1F4C1}": "folder",
    "\u{1F4C2}": "folder",
    "\u2699\uFE0F": "settings",
    "\u2699": "settings",
    "\u{1F527}": "wrench",
    "\u{1F52D}": "telescope",
    "\u{1F4DC}": "log",
    "\u{1F3A8}": "palette",
    "\u{1F512}": "lock",
    "\u{1F513}": "unlock",
    "\u{1F3C6}": "trophy",
    "\u{1F4B0}": "coins",
    "\u{1F319}": "moon",
    "\u2753": "help",
    "\u{1F5BC}\uFE0F": "image",
    "\u{1F5BC}": "image",
    "\u{1F4CA}": "chart",
    "\u{1F9EA}": "flask",
    "\u{1F6A9}": "flag",
    "\u{1F50D}": "search",
    "\u{1F3B2}": "dice",
    "\u{1F648}": "eye-off",
    "\u{1F441}\uFE0F": "eye",
    "\u{1F441}": "eye",
    "\u{1F522}": "hash",
    "\u274C": "x-circle",
    "\u2715": "x",
    "\u2716": "x",
    "\u{1F517}": "link",
    "\u2702\uFE0F": "scissors",
    "\u2702": "scissors",
    "\u{1F4CB}": "list",
    "\u2B07": "download",
    "\u{1F9FA}": "bucket",
    "\u{1FAA3}": "bucket",
    "\u21A9\uFE0F": "undo",
    "\u21A9": "undo",
    "\u21AA": "redo",
    "\u{1F3F7}\uFE0F": "tag",
    "\u{1F3F7}": "tag",
    "\u{1F5D1}\uFE0F": "trash",
    "\u{1F5D1}": "trash",
    "\u{1F6AB}": "shield-off",
    "\u{1F7E2}": "shield-plus",
    "\u270B": "hand",
    "\u{1F40D}": "wand",
    "\u{1F504}": "refresh",
    "\u21BA": "rotate",
    "\u25B6": "play",
    "\u23F9": "stop",
    "\u2705": "check-circle",
    "\u2611": "check-square",
    "\u{1F50C}": "plug",
    "\u{1F4DD}": "note",
    "\u{1F6CD}\uFE0F": "bag",
    "\u{1F6CD}": "bag",
    "\u{1F381}": "gift",
    "\u{1F528}": "hammer",
    "\u{1F3AF}": "target",
    "\u{1FA7A}": "pulse",
    "\u{1F4D6}": "book",
    "\u{1F4BE}": "save",
    "\u26A0\uFE0F": "alert",
    "\u26A0": "alert",
    "\u23EE": "skip-back",
    "\u{1F5E8}\uFE0F": "message",
    "\u{1F5E8}": "message",
    "\u{1F9ED}": "compass",
    "\u2605": "star",
    "\u2B50": "star",
    "\u2630": "menu",
    "\u25A6": "grid",
    "\u25BE": "caret-down",
    "\u25BC": "caret-down",
    "\u25B2": "caret-up",
    "\u25B8": "chevron-right",
    "\u25C0": "chevron-left",
    "\u2039": "chevron-left",
    "\u203A": "chevron-right",
    "\u27F2": "rotate",
    "\u27F3": "rotate-cw",
    "\u2713": "check",
    "\u21C4": "swap"
  };
  function rarityIcon(rarity) {
    return iconSvg(rarity === "legendary" ? "star" : "gem", "rarity-" + rarity);
  }
  function plainLabel(text) {
    return text.replace(GLYPH_RE, "").replace(/\s+/g, " ").trim();
  }
  var GLYPH_RE = new RegExp(
    "(" + Object.keys(EMOJI_ICON).sort((a, b) => b.length - a.length).map((g) => g.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")\\uFE0F?",
    "gu"
  );
  function iconSvg(id, extraClass = "") {
    return `<svg class="ic${extraClass ? " " + extraClass : ""}" aria-hidden="true"><use href="#i-${id}"></use></svg>`;
  }
  function escapeText(s) {
    return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  }
  function iconHTML(text) {
    const parts = text.split(GLYPH_RE);
    let out = "";
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i % 2 === 0) {
        out += escapeText(part);
        continue;
      }
      const before = parts[i - 1] ?? "", after = parts[i + 1] ?? "";
      const cls = [];
      if (/^\s+\S/.test(after)) {
        cls.push("ic-lead");
        parts[i + 1] = after.replace(/^\s/, "");
      }
      if (/\S\s$/.test(before) || /\S$/.test(before) && before.length) {
        cls.push("ic-trail");
        out = out.replace(/\s$/, "");
      }
      out += iconSvg(EMOJI_ICON[part], cls.join(" "));
    }
    return out;
  }
  function hasIconGlyph(text) {
    GLYPH_RE.lastIndex = 0;
    const hit = GLYPH_RE.test(text);
    GLYPH_RE.lastIndex = 0;
    return hit;
  }
  function setIconLabel(el, text) {
    if (!hasIconGlyph(text)) {
      el.textContent = text;
      return;
    }
    const parts = text.split(GLYPH_RE);
    const midSentence = parts.length > 2 && parts[0].trim() !== "" && parts[parts.length - 1].trim() !== "";
    el.innerHTML = midSentence ? `<span>${iconHTML(text)}</span>` : iconHTML(text);
  }
  function iconize(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => {
        const p = n.parentElement;
        if (!p || p.closest("option, select, textarea, script, style, svg, code, pre")) return NodeFilter.FILTER_REJECT;
        return hasIconGlyph(n.nodeValue || "") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const hits = [];
    while (walker.nextNode()) hits.push(walker.currentNode);
    for (const t of hits) {
      const span = document.createElement("span");
      span.innerHTML = iconHTML(t.nodeValue || "");
      t.replaceWith(...Array.from(span.childNodes));
    }
  }

  // src/renderer/shared-ui.ts
  var PDROP_CLOSE_ON_SELECT_KEY = "dts-pdrop-close-on-select";
  (function initPdropCloseOnSelectPref() {
    let on = true;
    try {
      on = getBool(PDROP_CLOSE_ON_SELECT_KEY, true);
    } catch {
    }
    pdropCloseOnSelectToggle.checked = on;
  })();
  pdropCloseOnSelectToggle.addEventListener("change", () => {
    try {
      setBool(PDROP_CLOSE_ON_SELECT_KEY, pdropCloseOnSelectToggle.checked);
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
      on = getBool(OUTSIDE_CLICK_SWALLOW_KEY);
    } catch {
    }
    outsideClickSwallowToggle.checked = on;
  })();
  outsideClickSwallowToggle.addEventListener("change", () => {
    try {
      setBool(OUTSIDE_CLICK_SWALLOW_KEY, outsideClickSwallowToggle.checked);
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
  function refitShrunkText() {
    document.querySelectorAll(".pdrop-btn").forEach((b) => shrinkTextToFit(b));
  }
  function initFontRefit() {
    document.fonts.addEventListener("loadingdone", refitShrunkText);
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
      setIconLabel(btn, currentLabel() + " \u25BE");
      shrinkTextToFit(btn);
    }
    setIconLabel(btn, currentLabel() + " \u25BE");
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
        setIconLabel(item, opt.label);
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
    setIconLabel(toastEl, msg);
    toastEl.classList.add("show");
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => toastEl.classList.remove("show"), ms);
  }
  function toastError(prefix, err, ms = 4200) {
    const msg = err instanceof Error ? err.message || String(err) : String(err);
    toast(`${prefix}: ${msg}`, ms);
  }
  function addContextMenuItem(menu, label, onClick, opts = {}) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ctx-item" + (opts.className ? " " + opts.className : "");
    setIconLabel(btn, label);
    if (opts.title) btn.title = opts.title;
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      onClick(ev);
    });
    menu.appendChild(btn);
    return btn;
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
  function showImageLightbox(src, onZoom) {
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
      if (onZoom && scale !== prevScale) onZoom(Math.round(scale * 100));
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
  function transitionMsOf(el) {
    const raw = getComputedStyle(el).transitionDuration.split(",")[0].trim();
    const n = parseFloat(raw);
    if (!Number.isFinite(n)) return 160;
    return raw.endsWith("ms") ? n : n * 1e3;
  }
  var mapPanSeq = 0;
  var mapNamed = [];
  var activePan = null;
  var panClickRelayInstalled = false;
  var pressHitRoot = false;
  function installPanClickRelay() {
    if (panClickRelayInstalled) return;
    panClickRelayInstalled = true;
    document.addEventListener("pointerdown", (ev) => {
      pressHitRoot = !!activePan && ev.target === document.documentElement;
    }, true);
    document.addEventListener("click", (ev) => {
      const pan = activePan;
      if (!pan || ev.target !== document.documentElement || !pressHitRoot) return;
      pressHitRoot = false;
      ev.stopPropagation();
      ev.preventDefault();
      const { clientX: x, clientY: y } = ev;
      pan.skipTransition();
      pan.finished.finally(() => {
        const hit = document.elementFromPoint(x, y);
        if (!hit || hit === document.documentElement) return;
        (hit.closest('button, a, label, [role="button"]') || hit).click();
      });
    }, true);
  }
  function mapPan(dir, kind, from, to, update, after) {
    const html = document.documentElement;
    const doc = document;
    if (!dir || !doc.startViewTransition || !html.classList.contains("motion-swipe") || html.classList.contains("motion-off")) return false;
    installPanClickRelay();
    const seq = ++mapPanSeq;
    for (const el of mapNamed) el.style.viewTransitionName = "";
    mapNamed = [];
    const name = (el) => {
      if (!(el instanceof HTMLElement)) return;
      el.style.viewTransitionName = "map-pane";
      mapNamed.push(el);
    };
    html.dataset.mapDir = dir > 0 ? "fwd" : "back";
    html.dataset.mapKind = kind;
    name(from);
    const t = doc.startViewTransition(() => {
      if (from instanceof HTMLElement) from.style.viewTransitionName = "";
      update();
      name(to());
    });
    activePan = t;
    t.finished.finally(() => {
      if (after) after();
      if (seq !== mapPanSeq) return;
      activePan = null;
      for (const el of mapNamed) el.style.viewTransitionName = "";
      mapNamed = [];
      delete html.dataset.mapDir;
      delete html.dataset.mapKind;
    });
    return true;
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
  function createModalShell(opts = {}) {
    const backdrop = document.createElement("div");
    backdrop.className = "confirm-backdrop" + (opts.className ? " " + opts.className : "") + (opts.instant ? " modal-visible" : "");
    const box = document.createElement("div");
    box.className = "confirm-box" + (opts.boxClassName ? " " + opts.boxClassName : "");
    backdrop.appendChild(box);
    let closed = false;
    function close() {
      if (closed) return;
      closed = true;
      document.removeEventListener("keydown", onKey);
      if (opts.instant) {
        backdrop.remove();
        if (opts.onClose) opts.onClose();
      } else {
        backdrop.classList.remove("modal-visible");
        setTimeout(() => {
          backdrop.remove();
          if (opts.onClose) opts.onClose();
        }, 160);
      }
    }
    function onKey(ev) {
      if (ev.key === "Escape") (opts.onDismiss || close)();
    }
    backdrop.addEventListener("click", (ev) => {
      if (ev.target === backdrop) (opts.onDismiss || close)();
    });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(backdrop);
    if (opts.instant) {
      if (opts.onShow) opts.onShow();
    } else {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        backdrop.classList.add("modal-visible");
        if (opts.onShow) opts.onShow();
      }));
    }
    return { backdrop, box, close };
  }
  function showConfirmModal(message, opts = {}) {
    return new Promise((resolve) => {
      const { box, close } = createModalShell({ onDismiss: () => {
        resolve(false);
        close();
      } });
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
      cancelBtn.addEventListener("click", () => {
        resolve(false);
        close();
      });
      okBtn.addEventListener("click", () => {
        resolve(true);
        close();
      });
      btnRow.appendChild(cancelBtn);
      btnRow.appendChild(okBtn);
      box.appendChild(btnRow);
    });
  }
  function showInfoModal(html, title, onBody) {
    const { box, close } = createModalShell({ boxClassName: "info-modal-box" });
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
    closeBtn.addEventListener("click", close);
    btnRow.appendChild(closeBtn);
    box.appendChild(btnRow);
  }
  function openDockListModal(title, contentEl) {
    const originalParent = contentEl.parentNode;
    const originalNextSibling = contentEl.nextSibling;
    const { box, close } = createModalShell({
      className: "dock-list-modal-backdrop",
      boxClassName: "dock-list-modal-box",
      onClose: () => {
        contentEl.classList.remove("dock-list-modal-content");
        if (originalNextSibling) originalParent.insertBefore(contentEl, originalNextSibling);
        else originalParent.appendChild(contentEl);
      }
    });
    if (title) {
      const head = document.createElement("div");
      head.className = "info-modal-title";
      head.textContent = title;
      box.appendChild(head);
    }
    contentEl.classList.add("dock-list-modal-content");
    box.appendChild(contentEl);
    const btnRow = document.createElement("div");
    btnRow.className = "confirm-btn-row";
    const closeBtn = document.createElement("button");
    closeBtn.className = "primary";
    closeBtn.textContent = "Close";
    closeBtn.addEventListener("click", close);
    btnRow.appendChild(closeBtn);
    box.appendChild(btnRow);
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
      setBool("dts-night-mode", false);
    }
    if (theme === "custom") {
      document.documentElement.setAttribute("data-theme", "custom");
      const saved = getJSON("dts-custom-theme", null);
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
    setString("dts-theme", theme);
    requestAnimationFrame(refitShrunkText);
  }
  var refinedThemes = getJSON("dts-refined-themes", []);
  function saveRefinedThemes() {
    setJSON("dts-refined-themes", refinedThemes);
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
  function initThemeDropdown(container) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pdrop-btn";
    function currentLabel() {
      const opt = themeSelect.options[themeSelect.selectedIndex];
      return (opt ? opt.textContent : themeSelect.value) + " \u25BE";
    }
    function setLabel() {
      setIconLabel(btn, currentLabel());
      shrinkTextToFit(btn);
    }
    setIconLabel(btn, currentLabel());
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
        setIconLabel(item, opt.textContent || "");
        item.addEventListener("click", (ev) => {
          ev.stopPropagation();
          themeSelect.value = opt.value;
          themeSelect.dispatchEvent(new Event("change"));
          setLabel();
          const bounced = themeSelect.value !== opt.value;
          menuEl.querySelectorAll(".pdrop-item").forEach((i, k) => {
            i.classList.toggle("active", themeSelect.options[k]?.value === themeSelect.value);
          });
          if (bounced) {
            item.classList.remove("pdrop-item-denied");
            void item.offsetWidth;
            item.classList.add("pdrop-item-denied");
            item.addEventListener("animationend", () => item.classList.remove("pdrop-item-denied"), { once: true });
          }
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
      const nightPalette = window.__dtsNightPalette;
      const pal = nightPalette(getCurrentVarHex);
      for (const [key, value] of Object.entries(pal)) document.documentElement.style.setProperty(key, value);
      document.documentElement.classList.add("night-mode");
    } else {
      clearCustomOverrides();
      document.documentElement.classList.remove("night-mode");
    }
    setBool("dts-night-mode", dayNightOn);
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
      setJSON(storageOrderKey, dockOrder);
      setJSON(storageCollapsedKey, dockCollapsed);
      setJSON(storageHeightsKey, dockHeights);
    }
    function loadDockPrefs() {
      const o = getJSON(storageOrderKey, null);
      if (Array.isArray(o) && o.length) dockOrder = o;
      dockCollapsed = getJSON(storageCollapsedKey, {});
      dockHeights = getJSON(storageHeightsKey, {});
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
      const savedHeight = sec.dataset.resizable === "true" ? dockHeights[id] || "" : "";
      const finalMaxDim = collapsing ? "" : savedHeight;
      const finalOverflow = collapsing ? "" : savedHeight ? "auto" : "";
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
            el.style[maxProp] = el === scrollBody && savedHeight ? savedHeight : el[scrollProp] + "px";
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
        setIconLabel(dragHandle, "\u2630");
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
        const collapseGlyph = () => dockCollapsed[id] ? "\u25B8" : isHorizontal() ? "\u25C0" : "\u25BC";
        setIconLabel(collapseBtn, collapseGlyph());
        collapseBtn.addEventListener("click", () => {
          dockCollapsed[id] = !dockCollapsed[id];
          saveDockPrefs();
          applyDockCollapse(sec, id, true);
          setIconLabel(collapseBtn, collapseGlyph());
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
        if (collapseBtn) setIconLabel(collapseBtn, horizontal ? "\u25C0" : "\u25BC");
      });
    }
    return { init, reset };
  }
  var rightToolsDockManager = createDockManager({
    container: normalRightTools,
    storageOrderKey: "dts-dock-order",
    storageCollapsedKey: "dts-dock-collapsed",
    storageHeightsKey: "dts-dock-heights",
    defaultOrder: ["tagPruner", "unifyVoid", "canonicalTags", "bucketImages"],
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
    setString("dts-font-size", "14");
  }
  function getOutsideClosablePanels() {
    return [favoritesPanel, themeCustomPanel, logPanel, achievementsPanel, shopPanel, tagDetailsPanel, settingsPanel];
  }
  var SETTINGS_SECTIONS_KEY = "dts-settings-sections-expanded";
  function saveSettingsSectionState(state) {
    try {
      setJSON(SETTINGS_SECTIONS_KEY, state);
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
    setJSON("dts-custom-power-tools", customPowerTools);
  }
  function loadCustomPowerTools() {
    const saved = getJSON("dts-custom-power-tools", null);
    if (Array.isArray(saved)) customPowerTools = saved;
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
        <li><b>Single</b> \u2014 one image at a time: a compact preview (click it for the full-size
        view \u2014 scroll to zoom, drag to pan) beside a roomy tag panel. Type a number into the
        toolbar's "N / total" box and press Enter to jump straight to that image.</li>`}
        <li><b>\u274C Disabled</b> \u2014 the images you've moved out of the active set.</li>
        ${isTouchDevice ? "" : `<li><b>\u{1F5BC} Originals</b> \u2014 the pre-bucketing originals kept by Bucket Images (see Power
        tools). Read-only here; Bucket Images' Revert is what moves them back.</li>`}
        <li><b>\u{1F522} Rename all</b> \u2014 renames every loaded image (+ its .txt) to a simple zero-padded
        1-N sequence (active dataset first, then Disabled, continuing the same count). Confirmed
        first; logged and undoable from the Log panel.</li>
      </ul>
      ${isTouchDevice ? "<p>Tap an image to open it full-size, zoomable/pannable with pinch and drag, with tag editing right there in the same modal.</p>" : ""}
      <p>To edit tags: ${isTouchDevice ? "tap" : "click"} a chip to open its menu (filter by it, look up its wiki definition,
      flag it for review, explore its keyword family), type into a card's "+ add tag" box and
      press Enter to add one, or ${isTouchDevice ? "tap" : "click"} a chip's \xD7 to remove it.</p>
      <p><b>\u{1F3F7} Tag sorting</b> \u2014 in ${isTouchDevice ? "the image modal" : "Single view and the image modal"}, this pill above
      the tags groups them into labelled categories (Character, Body, Face, Clothes, Limbs and
      Hands, Sexual, Pose, Scene, Effects, Other) instead of one flat wall. The grouping is a best
      guess from Danbooru tag groups, so the odd tag lands in a neighbouring category. With it on,
      <b>\uFF0B Add subject</b> (next to the pill) splits an image's tags into named subjects (e.g.
      "Girl 1", "Girl 2") for multi-character images: rename a subject by typing in its name,
      add category subheaders with <b>\uFF0B Subheader</b>, and move tags between subjects by
      dragging a chip onto a subject${isTouchDevice ? "" : ', or shift-clicking chips then "Move tags to:"'}.
      Subjects are saved per image; removing them all returns to the plain category list.</p>
      <p><b>Filtering</b> \u2014 the search box on the left supports multiple tags combined with AND /
      OR / XOR / NOT. Type 2 or more characters and a suggestions list appears below the box:
      direct matches first, then other tags that share a word with them (searching "dr" suggests
      "dress" right away, and groups "black dress"/"dress shoes" under a "Same keyword family"
      heading). If you only want an exact match \u2014 so searching "dress" doesn't also pull in "black
      dress" \u2014 check "Exact tag match" just under the search box. The <b>Boolean</b> dropdown
      under the box picks how your terms combine (default <b>OR</b>: any term matches); tick
      <b>Lock</b> to keep your choice when <b>Clear filter</b> or opening a dataset would
      otherwise reset it to OR.</p>
      <p><b>\u{1F6A9} Review flagged tags</b> (left panel) swaps the TAGS list for every tag you've
      flagged for review from a chip's menu, across the whole dataset. <b>Reviewed</b> clears
      that flag everywhere at once (undoable); the row stays struck through for the session.
      <b>Flag isolated tags</b> highlights tags on 2 or fewer images \u2014 a fast way to spot typos.</p>
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
      can drive the left-hand gallery filter at a time \u2014 checking one unchecks any other; it follows the <b>Boolean</b> dropdown, so OR shows every
      image carrying any selected tag) and its
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
      ${isTouchDevice ? "" : `<p><b>\u{1F9FA} Bucket Images</b> \u2014 crops and resizes every Gallery image to its nearest LoRA
      training bucket (Min side / Max side / Step, default 256 / 1024 / 64), so your trainer
      doesn't have to. The crop keeps the subject using a saliency model (a one-time ~176 MB
      download, \u2B07 button in the dock). <b>Prefer GPU</b> runs it on your graphics card with an
      automatic CPU fallback. Originals are never lost: they move to an <code>original_images/</code>
      folder (browse them via the \u{1F5BC} Originals view), and images already at a bucket size are
      skipped, so re-running only handles the new ones. <b>\u21A9 Revert bucketing</b> puts the
      originals back.</p>`}
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
      while it's already open takes you back to the Gallery.${isTouchDevice ? "" : ` If the right sidebar
      is tucked away, clicking this tab opens it, and clicking the tab again tucks it back.`}</p>
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
      effects, comic, multiple views, koma count. The image is the same compact preview as
      Single view (click it for the full-size view). A live tag preview under the image shows
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
      this list, pin it as a favorite, view its achievements read-only, change its icon, or move it
      to a different tab. Opening a folder that isn't tracked here yet prompts you once to add it.</p>
      <p><b>Tabs</b> split folders into separate groups \u2014 the built-in <b>Default</b> tab always
      shows, and any tab you add with the <b>+</b> button can be given a password (tap its \u22EF
      button). A password-protected tab re-locks every time the app starts; nothing about it
      (not even folder names) renders until you enter the password. This protects against someone
      else briefly opening the app on your machine, not a determined attacker with access to your
      files.</p>`
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
        <li><b>Layout & Panels</b> \u2014 UI animation mode (Fade/Swipe/Off; Swipe treats the app as one
        map, so tabs, views and images slide the way they actually sit), and "Reset panel layout" if
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
      <p>26 themes in total \u2014 5 free, 21 in the \u{1F4B0} Shop (common through legendary, priced in
      Edibits, a small in-app currency you earn from achievements). Each theme is a whole look,
      not just a palette: its own typefaces, button and tag shapes, panel materials, and active-tab
      marker, with the icons restroked to match. Epic/legendary themes get an extra hover-fill and
      card lift in that theme's own style; any cheaper theme can buy them individually via the
      Shop's "\u{1F528} Refine Theme" button, for the price difference.</p>
      <p>\u{1F3C6} Achievements (55+, unlocked per dataset folder \u2014 a fresh dataset starts with none
      unlocked) pay out Edibits as you use the app's features. \u{1F319} Night mode is a genuine per-theme
      color inversion that also keeps every text and accent color readable.</p>
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
    iconize(helpContent);
    helpContent.scrollTop = 0;
    initInfoButtons(helpContent);
    renderToc(sec.id);
    try {
      setString(HELP_LAST_SECTION_KEY, sec.id);
    } catch {
    }
  }
  function openHelp() {
    let last = HELP_SECTIONS[0].id;
    try {
      last = getString(HELP_LAST_SECTION_KEY) || last;
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
      addContextMenuItem(menu, sec.title, () => {
        closeTocMenu();
        showSection(sec.id);
      }, { className: sec.id === activeId ? "active" : "" });
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
        last = getString(HELP_LAST_SECTION_KEY) || last;
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
  var ownedThemes = ["studio", "cyberpunk", "oriental", "subway", "osmium"];
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
      await writeBytes(handle, JSON.stringify({ stats: folderStats, unlocked: folderUnlocked }, null, 2));
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
    setInt("dts-wallet", wallet);
    setJSON("dts-owned-themes", ownedThemes);
    walletDisplay.textContent = String(wallet);
    achWallet.textContent = String(wallet);
    shopWallet.textContent = String(wallet);
  }
  function loadWallet() {
    wallet = getInt("dts-wallet", 0);
    const owned = getJSON("dts-owned-themes", null);
    if (Array.isArray(owned)) ownedThemes = Array.from(/* @__PURE__ */ new Set(["studio", "cyberpunk", "oriental", "subway", "osmium", ...owned]));
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
    <span class="ach-rarity-icon">${rarityIcon(ach.rarity)}</span>
    <div class="ach-info">
      <div class="ach-title">${iconSvg("trophy", "ic-lead")}${escapeHtml(ach.title)}</div>
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
      <span class="ach-rarity-icon">${rarityIcon(ach.rarity)}</span>
      <div class="ach-info">
        <div class="ach-title">${unlocked ? iconSvg("trophy", "ic-lead") : ""}${escapeHtml(ach.title)}</div>
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
        setIconLabel(btn, active ? "In use \u2713" : "Use");
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
      setIconLabel(btnRefineTheme, "\u{1F528} Refine Theme (already refined)");
      btnRefineTheme.disabled = true;
      btnRefineTheme.title = "The current theme already has the epic/legendary button effects.";
      return;
    }
    const cost = refineThemeCost(currentTheme);
    setIconLabel(btnRefineTheme, `\u{1F528} Refine Theme (${cost} Edibits)`);
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
      setBool("dts-ach-popups", achievementPopupsEnabled);
    });
    (function initAchPopupPref() {
      const on = getBool("dts-ach-popups", true);
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
      setBool("dts-suppress-theme-flourishes", on);
      document.documentElement.classList.toggle("suppress-theme-flourishes", on);
      updateRefineThemeButton();
    });
    (function initSuppressThemeFlourishesPref() {
      const on = getBool("dts-suppress-theme-flourishes");
      suppressThemeFlourishesToggle.checked = on;
      document.documentElement.classList.toggle("suppress-theme-flourishes", on);
    })();
    function wireFlourishToggle(toggleEl, storageKey, className) {
      toggleEl.addEventListener("change", () => {
        const on2 = toggleEl.checked;
        setBool(storageKey, on2);
        document.documentElement.classList.toggle(className, on2);
      });
      const on = getBool(storageKey);
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
  var REVIEW_TYPES = /* @__PURE__ */ new Set(["unflag-review"]);
  var LOG_FILE_NAME = "_tag_edit_log.json";
  var getDirHandle2 = () => null;
  var getEntryByBase = () => void 0;
  var applyTagDirectionRef = () => 0;
  var applyRenameDirectionRef = async () => 0;
  var applyPixelDirectionRef = async () => 0;
  var applyIsolateDirectionRef = async () => 0;
  var applyFlaggedReviewDirectionRef = () => 0;
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
      await writeBytes(handle, JSON.stringify(editLog, null, 2));
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
    setIconLabel(btnLog, getDirHandle2() ? `\u{1F4DC} Log (${editLog.length})` : "\u{1F4DC} Log");
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
    "isolate-image": "#b57edc",
    "unflag-review": "#e8a33d"
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
    "isolate-image": "Isolates",
    "unflag-review": "Review flags cleared"
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
        setIconLabel(undoBtn, "\u21A9 Undo this");
        undoBtn.addEventListener("click", () => applyLogEntryDirection(logEntry, "undo"));
        const redoBtn = document.createElement("button");
        setIconLabel(redoBtn, "\u21AA Redo this");
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
        setIconLabel(undoBtn, "\u21A9 Undo this");
        undoBtn.addEventListener("click", () => applyRenameLogEntryDirection(logEntry, "undo"));
        const redoBtn = document.createElement("button");
        setIconLabel(redoBtn, "\u21AA Redo this");
        redoBtn.className = "primary";
        redoBtn.addEventListener("click", () => applyRenameLogEntryDirection(logEntry, "redo"));
        actions.appendChild(undoBtn);
        actions.appendChild(redoBtn);
        row.appendChild(actions);
      } else if (PIXEL_TYPES.has(logEntry.type) && logEntry.affected && logEntry.affected.length) {
        const actions = document.createElement("div");
        actions.className = "log-actions";
        const undoBtn = document.createElement("button");
        setIconLabel(undoBtn, "\u21A9 Undo this");
        undoBtn.addEventListener("click", () => applyPixelLogEntryDirection(logEntry, "undo"));
        const redoBtn = document.createElement("button");
        setIconLabel(redoBtn, "\u21AA Redo this");
        redoBtn.className = "primary";
        redoBtn.addEventListener("click", () => applyPixelLogEntryDirection(logEntry, "redo"));
        actions.appendChild(undoBtn);
        actions.appendChild(redoBtn);
        row.appendChild(actions);
      } else if (ISOLATE_TYPES.has(logEntry.type) && logEntry.affected && logEntry.affected.length) {
        const actions = document.createElement("div");
        actions.className = "log-actions";
        const undoBtn = document.createElement("button");
        setIconLabel(undoBtn, "\u21A9 Undo this");
        undoBtn.addEventListener("click", () => applyIsolateLogEntryDirection(logEntry, "undo"));
        const redoBtn = document.createElement("button");
        setIconLabel(redoBtn, "\u21AA Redo this");
        redoBtn.className = "primary";
        redoBtn.addEventListener("click", () => applyIsolateLogEntryDirection(logEntry, "redo"));
        actions.appendChild(undoBtn);
        actions.appendChild(redoBtn);
        row.appendChild(actions);
      } else if (REVIEW_TYPES.has(logEntry.type) && logEntry.affected && logEntry.affected.length) {
        const actions = document.createElement("div");
        actions.className = "log-actions";
        const undoBtn = document.createElement("button");
        setIconLabel(undoBtn, "\u21A9 Undo this");
        undoBtn.addEventListener("click", () => applyReviewLogEntryDirection(logEntry, "undo"));
        const redoBtn = document.createElement("button");
        setIconLabel(redoBtn, "\u21AA Redo this");
        redoBtn.className = "primary";
        redoBtn.addEventListener("click", () => applyReviewLogEntryDirection(logEntry, "redo"));
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
  function applyReviewLogEntryDirection(logEntry, direction) {
    const count = applyFlaggedReviewDirectionRef(logEntry.affected, direction);
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
    applyFlaggedReviewDirectionRef = deps.applyFlaggedReviewDirection;
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
      if (!hasSaveFilePicker()) {
        toast("File export needs Chrome/Edge/Electron.");
        return;
      }
      try {
        const dirHandle = getDirHandle2();
        const suggestedName = `tag-edit-log-${dirHandle?.name || "dataset"}-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
        const handle = await pickSaveFile({
          suggestedName,
          types: [{ description: "JSON log", accept: { "application/json": [".json"] } }]
        });
        await writeBytes(handle, JSON.stringify(editLog, null, 2));
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
      await writeBytes(handle, JSON.stringify(canonicalRules, null, 2));
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
      setIconLabel(label, "\u{1F5D1} Void (remove entirely)");
      label.title = "Every ACTIVE child tag below gets removed outright \u2014 nothing replaces it.";
      head.appendChild(label);
    }
    const enableToggle = document.createElement("label");
    enableToggle.className = "ach-toggle-row canonical-rule-enable-toggle";
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
    setIconLabel(deleteRuleBtn, "\u{1F5D1} Delete rule");
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
  voidSectionExpanded = getBool("dts-void-section-expanded", true);
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
      header.innerHTML = `<span class="settings-section-arrow">${iconSvg("chevron-right")}</span><span>${iconSvg("trash", "ic-lead")}Void \u2014 ${voidTagCount} tag${voidTagCount === 1 ? "" : "s"}</span>`;
      header.addEventListener("click", () => {
        voidSectionExpanded = !section.classList.contains("expanded");
        section.classList.toggle("expanded", voidSectionExpanded);
        setBool("dts-void-section-expanded", voidSectionExpanded);
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
        await writeBytes(e.imgHandle, bytes);
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
  var getOriginalDirHandle = () => null;
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
  var applyFlaggedReviewDirectionRef2 = () => 0;
  var AUTOSAVE_KEY = "dts-autosave";
  (function initAutosavePref() {
    let on = false;
    on = getBool(AUTOSAVE_KEY);
    autosaveToggle.checked = on;
  })();
  autosaveToggle.addEventListener("change", () => {
    setBool(AUTOSAVE_KEY, autosaveToggle.checked);
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
  async function moveEntry(entry, toDisabled, opts) {
    const dirHandle = getDirHandle4();
    if (!dirHandle) return;
    if (entry.original) {
      toast("Originals are managed by the Bucket Images tool.");
      return;
    }
    const silent = !!opts?.silent;
    try {
      const targetDir = toDisabled ? await ensureDisabledDir() : dirHandle;
      const sourceDir = toDisabled ? dirHandle : getDisabledDirHandle();
      const file = await entry.imgHandle.getFile();
      const newImgHandle = await targetDir.getFileHandle(entry.imgName, { create: true });
      await writeBytes(newImgHandle, file);
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
        await writeBytes(newTxtHandle, entry.tags.join(", "));
        entry.txtHandle = newTxtHandle;
        entry.txtExisted = true;
      } else {
        entry.txtHandle = null;
        entry.txtExisted = false;
      }
      entry.dirty = false;
      entry.disabled = toDisabled;
      if (!silent) {
        toast(toDisabled ? `Moved "${entry.imgName}" to Disabled/. Filename kept as-is, so restoring slots it right back in.` : `Restored "${entry.imgName}" to the dataset root.`, 3200);
        pushLogEntry({
          type: toDisabled ? "disable" : "restore",
          summary: toDisabled ? `Disabled ${entry.imgName}` : `Restored ${entry.imgName}`,
          affected: [{ base: entry.base }]
        });
      }
      trackStat(toDisabled ? "disables" : "restores");
      const mc = folderStats.moveCounts || {};
      mc[entry.base] = (mc[entry.base] || 0) + 1;
      folderStats.moveCounts = mc;
      if (mc[entry.base] >= 6) folderStats.flag_indecisive = true;
      saveFolderStats();
      if (!silent) {
        resetSingleIndex();
        refreshAllUIRef3();
        checkAchievements();
      }
    } catch (err) {
      if (silent) throw err;
      toast("Could not move that file \u2014 check folder permissions.", 3600);
    }
  }
  async function renameFileInPlace(dir, oldName, newName) {
    const oldHandle = await dir.getFileHandle(oldName, { create: false });
    const file = await oldHandle.getFile();
    const newHandle = await dir.getFileHandle(newName, { create: true });
    await writeBytes(newHandle, file);
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
    const active = getEntries2().filter((e) => !e.disabled && !e.original).sort(byFilename);
    const disabled = getEntries2().filter((e) => e.disabled && !e.original).sort(byFilename);
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
    getOriginalDirHandle = deps.getOriginalDirHandle;
    reindexEntry = deps.reindexEntry;
    resetSingleIndex = deps.resetSingleIndex;
    refreshStatsRef = deps.refreshStats;
    refreshAllUIRef3 = deps.refreshAllUI;
    renderCurrentViewRef = deps.renderCurrentView;
    applyIsolateDirectionRef2 = deps.applyIsolateDirection;
    applyFlaggedReviewDirectionRef2 = deps.applyFlaggedReviewDirection;
    btnUndo.addEventListener("click", async () => {
      const record = undoStack.pop();
      if (!record) return;
      const count = PIXEL_TYPES.has(record.type) ? await applyPixelDirection(record.affected, "undo") : ISOLATE_TYPES.has(record.type) ? await applyIsolateDirectionRef2(record.affected, "undo") : REVIEW_TYPES.has(record.type) ? applyFlaggedReviewDirectionRef2(record.affected, "undo") : applyTagDirection(record.affected, "undo");
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
      const count = PIXEL_TYPES.has(record.type) ? await applyPixelDirection(record.affected, "redo") : ISOLATE_TYPES.has(record.type) ? await applyIsolateDirectionRef2(record.affected, "redo") : REVIEW_TYPES.has(record.type) ? applyFlaggedReviewDirectionRef2(record.affected, "redo") : applyTagDirection(record.affected, "redo");
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
        const targetDir = e.original ? getOriginalDirHandle() : e.disabled ? disabledDirHandle : dirHandle;
        if (!targetDir) {
          fail++;
          continue;
        }
        if (!e.txtHandle) {
          e.txtHandle = await targetDir.getFileHandle(e.txtName, { create: true });
        }
        await writeBytes(e.txtHandle, e.tags.join(", "));
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
      mirrorLabel.insertAdjacentHTML("beforeend", iconSvg("search"));
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
        setIconLabel(rmBtn, "\u2715");
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
    setIconLabel(saveBtn, "\u{1F4BE} Save as task");
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

  // src/renderer/idb.ts
  function openDB(name, version, storeName) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(name, version);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  function idbGetAll(db, storeName) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readonly");
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }
  function idbAdd(db, storeName, value) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const req = tx.objectStore(storeName).add(value);
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
    });
  }
  function idbDelete(db, storeName, key) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      tx.objectStore(storeName).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
  function idbUpdate(db, storeName, key, patch) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const getReq = store.get(key);
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
    });
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
    return openDB(FAV_DB_NAME, 1, FAV_STORE);
  }
  async function addFavoriteHandle(handle) {
    const db = await openFavDB();
    await idbAdd(db, FAV_STORE, { name: handle.name, handle: serializeHandle(handle), addedAt: Date.now() });
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
  async function listFavorites() {
    const db = await openFavDB();
    const favs = await idbGetAll(db, FAV_STORE);
    for (const fav of favs) {
      if (fav.handle && isMobileHandle(fav.handle)) {
        fav.handle = reviveHandle(fav.handle);
      }
    }
    return favs;
  }
  async function removeFavorite(id) {
    const db = await openFavDB();
    await idbDelete(db, FAV_STORE, id);
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
      setIconLabel(rmBtn, "\u2715");
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
      const perm = await requestPermission(fav.handle, "readwrite");
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
      if (await isFavorited(dirHandle)) {
        toast(`"${dirHandle.name}" is already favorited.`);
        return;
      }
      try {
        await addFavoriteHandle(dirHandle);
        onFavoriteChanged(dirHandle, true);
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
      picked = await pickDirectory({ mode: "readwrite" });
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
  var DEFAULT_GROUP_ID = 0;
  var GROUPS_KEY = "dts-dataset-groups";
  var ACTIVE_GROUP_KEY = "dts-dataset-active-group";
  var groups = [];
  var activeGroupId = DEFAULT_GROUP_ID;
  var unlockedGroupIds = /* @__PURE__ */ new Set();
  function recordGroupId(rec) {
    return rec.groupId == null ? DEFAULT_GROUP_ID : rec.groupId;
  }
  function loadGroups() {
    groups = getJSON(GROUPS_KEY, []);
    const saved = getInt(ACTIVE_GROUP_KEY, DEFAULT_GROUP_ID);
    const savedGroup = groups.find((g) => g.id === saved);
    activeGroupId = savedGroup && savedGroup.passwordHash ? DEFAULT_GROUP_ID : saved;
  }
  function saveGroups() {
    setJSON(GROUPS_KEY, groups);
  }
  function saveActiveGroup() {
    setInt(ACTIVE_GROUP_KEY, activeGroupId);
  }
  function getGroup(id) {
    return groups.find((g) => g.id === id);
  }
  function isGroupLocked(id) {
    if (id === DEFAULT_GROUP_ID) return false;
    const g = getGroup(id);
    return !!(g && g.passwordHash && !unlockedGroupIds.has(id));
  }
  async function sha256Hex(text) {
    const bytes = new TextEncoder().encode(text);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  function randomHex(byteLen) {
    const arr = new Uint8Array(byteLen);
    crypto.getRandomValues(arr);
    return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  async function hashPassword(password, salt) {
    return sha256Hex(salt + ":" + password);
  }
  function promptText(message, opts = {}) {
    return new Promise((resolve) => {
      const { box, close } = createModalShell({
        onDismiss: () => {
          resolve(null);
          close();
        },
        onShow: () => input.focus()
      });
      const msg = document.createElement("div");
      msg.className = "confirm-message";
      msg.textContent = message;
      box.appendChild(msg);
      const input = document.createElement("input");
      input.type = opts.password ? "password" : "text";
      input.className = "dm-prompt-input";
      if (opts.placeholder) input.placeholder = opts.placeholder;
      box.appendChild(input);
      const btnRow = document.createElement("div");
      btnRow.className = "confirm-btn-row";
      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "Cancel";
      const okBtn = document.createElement("button");
      okBtn.textContent = opts.okLabel || "OK";
      okBtn.className = "primary";
      cancelBtn.addEventListener("click", () => {
        resolve(null);
        close();
      });
      okBtn.addEventListener("click", () => {
        resolve(input.value);
        close();
      });
      input.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") {
          resolve(input.value);
          close();
        }
      });
      btnRow.appendChild(cancelBtn);
      btnRow.appendChild(okBtn);
      box.appendChild(btnRow);
    });
  }
  async function createGroupFlow() {
    const name = await promptText("Name this new tab:", { okLabel: "Create", placeholder: "e.g. Private" });
    if (!name || !name.trim()) return;
    const group = { id: Date.now(), name: name.trim(), passwordSalt: null, passwordHash: null };
    groups.push(group);
    saveGroups();
    activeGroupId = group.id;
    saveActiveGroup();
    renderTabBar();
    renderDatasetManagerTab();
  }
  async function renameGroupFlow(group) {
    const name = await promptText(`Rename "${group.name}" to:`, { okLabel: "Rename", placeholder: group.name });
    if (!name || !name.trim()) return;
    group.name = name.trim();
    saveGroups();
    renderTabBar();
  }
  async function setGroupPasswordFlow(group) {
    const isFirstLock = !group.passwordHash;
    if (isFirstLock) {
      const ack = await showConfirmModal(
        `This app has no "forgot password" recovery \u2014 if you forget the password for "${group.name}", the only way back in is deleting the tab itself. Continue setting a password?`,
        { okLabel: "I understand, continue" }
      );
      if (!ack) return;
    } else {
      const oldPw = await promptText(
        `Enter the current password for "${group.name}" to change it:`,
        { okLabel: "Verify", password: true, placeholder: "Current password" }
      );
      if (oldPw === null) return;
      const attemptHash = await hashPassword(oldPw, group.passwordSalt);
      if (attemptHash !== group.passwordHash) {
        toast("Wrong password \u2014 nothing changed.", 2600);
        return;
      }
    }
    const pw = await promptText(
      group.passwordHash ? `Set a new password for "${group.name}":` : `Set a password for "${group.name}" \u2014 it'll lock every time the app starts, until you enter this again:`,
      { okLabel: "Set password", password: true, placeholder: "Password" }
    );
    if (pw === null) return;
    if (!pw) {
      toast("Password cannot be empty.", 2600);
      return;
    }
    const confirmPw = await promptText("Confirm the password:", { okLabel: "Confirm", password: true, placeholder: "Password" });
    if (confirmPw === null) return;
    if (pw !== confirmPw) {
      toast("Passwords did not match \u2014 nothing changed.", 3200);
      return;
    }
    const salt = randomHex(16);
    group.passwordSalt = salt;
    group.passwordHash = await hashPassword(pw, salt);
    unlockedGroupIds.add(group.id);
    saveGroups();
    renderTabBar();
    toast(`"${group.name}" is now password-protected.`, 2600);
  }
  async function removeGroupPasswordFlow(group) {
    const pw = await promptText(
      `Enter the password for "${group.name}" to remove it:`,
      { okLabel: "Verify", password: true, placeholder: "Password" }
    );
    if (pw === null) return;
    const attemptHash = await hashPassword(pw, group.passwordSalt);
    if (attemptHash !== group.passwordHash) {
      toast("Wrong password \u2014 nothing changed.", 2600);
      return;
    }
    const ok = await showConfirmModal(`Remove the password from "${group.name}"? Its folders will be visible to anyone who opens this app.`, { okLabel: "Remove password", danger: true });
    if (!ok) return;
    group.passwordSalt = null;
    group.passwordHash = null;
    unlockedGroupIds.add(group.id);
    saveGroups();
    renderTabBar();
  }
  async function deleteGroupFlow(group) {
    let moveToDefault = true;
    if (group.passwordHash) {
      const pw = await promptText(
        `"${group.name}" is password-protected. Enter the password to delete it \u2014 leave it blank if you've forgotten it:`,
        { okLabel: "Continue", password: true, placeholder: "Password (optional if forgotten)" }
      );
      if (pw === null) return;
      if (pw) {
        const attemptHash = await hashPassword(pw, group.passwordSalt);
        if (attemptHash === group.passwordHash) {
          moveToDefault = await showConfirmModal(
            `Password verified. Move "${group.name}"'s folders back to the Default tab, or leave them untracked so they never resurface anywhere?`,
            { okLabel: "Move to Default", cancelLabel: "Leave untracked", danger: true }
          );
        } else {
          const forgot = await showConfirmModal(
            `Wrong password. Forgot it? You can still delete "${group.name}", but its folders will stay untracked instead of moving to Default \u2014 that's what stops someone from deleting a tab they can't unlock just to get its folders back that way.`,
            { okLabel: "Delete without folders", cancelLabel: "Cancel", danger: true }
          );
          if (!forgot) return;
          moveToDefault = false;
        }
      } else {
        const forgot = await showConfirmModal(
          `Delete "${group.name}" without the password? Its folders will stay untracked instead of moving to Default \u2014 that's what stops someone from deleting a tab they can't unlock just to get its folders back that way.`,
          { okLabel: "Delete without folders", cancelLabel: "Cancel", danger: true }
        );
        if (!forgot) return;
        moveToDefault = false;
      }
    } else {
      const ok = await showConfirmModal(
        `Delete the "${group.name}" tab? Its folders move back to Default \u2014 nothing about the folders themselves or their tracking is deleted.`,
        { okLabel: "Delete tab", danger: true }
      );
      if (!ok) return;
    }
    let records = [];
    try {
      records = await listDatasetFolders();
    } catch (e) {
    }
    if (moveToDefault) {
      for (const rec of records) {
        if (recordGroupId(rec) === group.id) await updateDatasetFolder(rec.id, { groupId: DEFAULT_GROUP_ID });
      }
    }
    groups = groups.filter((g) => g.id !== group.id);
    unlockedGroupIds.delete(group.id);
    saveGroups();
    if (activeGroupId === group.id) {
      activeGroupId = DEFAULT_GROUP_ID;
      saveActiveGroup();
    }
    renderTabBar();
    renderDatasetManagerTab();
  }
  async function unlockGroupFlow(group) {
    const pw = await promptText(`"${group.name}" is password-protected. Enter the password:`, { okLabel: "Unlock", password: true, placeholder: "Password" });
    if (pw === null) return false;
    const attemptHash = await hashPassword(pw, group.passwordSalt);
    if (attemptHash !== group.passwordHash) {
      toast("Wrong password.", 2600);
      return false;
    }
    unlockedGroupIds.add(group.id);
    return true;
  }
  async function selectGroup(id) {
    if (id !== DEFAULT_GROUP_ID) {
      const group = getGroup(id);
      if (group && isGroupLocked(id)) {
        const unlocked = await unlockGroupFlow(group);
        if (!unlocked) return;
      }
    }
    activeGroupId = id;
    saveActiveGroup();
    renderTabBar();
    renderDatasetManagerTab();
  }
  function renderTabBar() {
    dmTabBar.innerHTML = "";
    function buildTab(id, name, group) {
      const tab = document.createElement("button");
      tab.type = "button";
      tab.className = "dm-tab" + (id === activeGroupId ? " active" : "");
      const label = document.createElement("span");
      label.textContent = name;
      tab.appendChild(label);
      if (group && group.passwordHash) {
        const lock = document.createElement("span");
        lock.className = "dm-tab-lock";
        setIconLabel(lock, isGroupLocked(id) ? "\u{1F512}" : "\u{1F513}");
        lock.title = isGroupLocked(id) ? "Locked" : "Unlocked for this session";
        tab.appendChild(lock);
      }
      tab.addEventListener("click", () => selectGroup(id));
      if (group) {
        const menuBtn = document.createElement("button");
        menuBtn.type = "button";
        menuBtn.className = "dm-tab-menu-btn";
        menuBtn.title = "Tab options";
        menuBtn.textContent = "\u22EF";
        menuBtn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          const rect = menuBtn.getBoundingClientRect();
          openTabContextMenu(group, rect.left, rect.bottom + 4);
        });
        tab.appendChild(menuBtn);
      }
      return tab;
    }
    dmTabBar.appendChild(buildTab(DEFAULT_GROUP_ID, "Default", null));
    for (const group of groups) dmTabBar.appendChild(buildTab(group.id, group.name, group));
    const addTab = document.createElement("button");
    addTab.type = "button";
    addTab.className = "dm-tab dm-tab-add";
    addTab.title = "Add a new tab";
    addTab.textContent = "+";
    addTab.addEventListener("click", () => createGroupFlow());
    dmTabBar.appendChild(addTab);
  }
  var dmTabCtxMenuEl = null;
  function closeDmTabCtxMenu() {
    if (dmTabCtxMenuEl) {
      dmTabCtxMenuEl.remove();
      dmTabCtxMenuEl = null;
    }
    document.removeEventListener("click", onDmTabCtxOutsideClick);
  }
  function onDmTabCtxOutsideClick(ev) {
    if (!dmTabCtxMenuEl) return;
    const path = ev.composedPath ? ev.composedPath() : [];
    if (path.includes(dmTabCtxMenuEl)) return;
    closeDmTabCtxMenu();
  }
  function openTabContextMenu(group, x, y) {
    closeDmTabCtxMenu();
    const menu = document.createElement("div");
    menu.className = "ctx-menu";
    const header = document.createElement("div");
    header.className = "ctx-header";
    header.textContent = group.name;
    menu.appendChild(header);
    addContextMenuItem(menu, "Rename tab", () => {
      closeDmTabCtxMenu();
      renameGroupFlow(group);
    });
    addContextMenuItem(menu, group.passwordHash ? "Change password" : "Set password\u2026", () => {
      closeDmTabCtxMenu();
      setGroupPasswordFlow(group);
    });
    if (group.passwordHash) addContextMenuItem(menu, "Remove password", () => {
      closeDmTabCtxMenu();
      removeGroupPasswordFlow(group);
    });
    addContextMenuItem(menu, "Delete tab", () => {
      closeDmTabCtxMenu();
      deleteGroupFlow(group);
    });
    document.body.appendChild(menu);
    dmTabCtxMenuEl = menu;
    positionMenu(menu, x, y);
    setTimeout(() => document.addEventListener("click", onDmTabCtxOutsideClick), 0);
  }
  async function openMoveToTabModal(record) {
    const { box, close } = createModalShell({ instant: true });
    const title = document.createElement("div");
    title.className = "confirm-message";
    title.textContent = `Move "${record.name}" to which tab?`;
    box.appendChild(title);
    const list = document.createElement("div");
    list.className = "dm-move-tab-list";
    box.appendChild(list);
    const btnRow = document.createElement("div");
    btnRow.className = "confirm-btn-row";
    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", close);
    btnRow.appendChild(cancelBtn);
    box.appendChild(btnRow);
    const current = recordGroupId(record);
    const options = [{ id: DEFAULT_GROUP_ID, name: "Default" }, ...groups.map((g) => ({ id: g.id, name: g.name }))];
    for (const opt of options) {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "dm-move-tab-row" + (opt.id === current ? " active" : "");
      row.textContent = opt.name + (opt.id === current ? " (current)" : "");
      row.disabled = opt.id === current;
      row.addEventListener("click", async () => {
        await updateDatasetFolder(record.id, { groupId: opt.id });
        close();
        renderDatasetManagerTab();
        toast(`Moved "${record.name}" to "${opt.name}".`, 2200);
      });
      list.appendChild(row);
    }
  }
  var DB_NAME = "dts-dataset-manager-db";
  var STORE = "folders";
  var ORDER_KEY = "dts-dataset-folder-order";
  var SORT_KEY = "dts-dataset-folder-sort";
  var VIEW_KEY = "dts-dataset-manager-view";
  var SUPPRESS_KEY = "dts-dataset-tab-prompt-suppressed";
  var getDirHandle6 = () => null;
  var openFolderHandle2 = async () => {
  };
  var switchTab = () => {
  };
  var folderOrder = [];
  var sortMode = "manual";
  var viewMode = "grid";
  function openDMDB() {
    return openDB(DB_NAME, 1, STORE);
  }
  async function addDatasetFolder(handle) {
    let alreadyFavorited = false;
    try {
      alreadyFavorited = await isFavorited(handle);
    } catch (e) {
    }
    const storedHandle = serializeHandle(handle);
    const db = await openDMDB();
    const result = await idbAdd(db, STORE, {
      name: handle.name,
      handle: storedHandle,
      addedAt: Date.now(),
      lastOpenedAt: Date.now(),
      pinned: alreadyFavorited,
      iconMode: "generic",
      iconImageBase: null,
      iconImageDataUrl: null,
      // Lands in whichever tab is currently open, not always Default — add
      // a folder while sitting in a locked tab and it should actually show
      // up there, not silently reappear in the tab anyone can see.
      groupId: activeGroupId
    });
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
  async function listDatasetFolders() {
    const db = await openDMDB();
    const records = await idbGetAll(db, STORE);
    for (const rec of records) {
      if (rec.handle && isMobileHandle(rec.handle)) {
        rec.handle = reviveHandle(rec.handle);
      }
    }
    return records;
  }
  async function removeDatasetFolder(id) {
    const db = await openDMDB();
    await idbDelete(db, STORE, id);
  }
  async function updateDatasetFolder(id, patch) {
    const db = await openDMDB();
    await idbUpdate(db, STORE, id, patch);
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
    folderOrder = getJSON(ORDER_KEY, []);
    sortMode = getString(SORT_KEY, "manual");
    viewMode = getString(VIEW_KEY, "grid");
  }
  function saveOrder() {
    setJSON(ORDER_KEY, folderOrder);
  }
  function saveSortMode() {
    setString(SORT_KEY, sortMode);
  }
  function saveViewMode() {
    setString(VIEW_KEY, viewMode);
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
  function openDmContextMenu(record, x, y) {
    closeDmCtxMenu();
    const menu = document.createElement("div");
    menu.className = "ctx-menu";
    const header = document.createElement("div");
    header.className = "ctx-header";
    header.textContent = record.name;
    menu.appendChild(header);
    addContextMenuItem(menu, "Remove from Dataset tab", async () => {
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
    addContextMenuItem(menu, record.pinned ? "Unpin favorite" : "Pin as favorite", async () => {
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
    addContextMenuItem(menu, "View achievements", async () => {
      closeDmCtxMenu();
      await openReadOnlyAchievements(record);
    });
    addContextMenuItem(menu, "Select image for icon\u2026", async () => {
      closeDmCtxMenu();
      await openIconPicker(record);
    });
    if (groups.length > 0) {
      addContextMenuItem(menu, "Move to tab\u2026", async () => {
        closeDmCtxMenu();
        await openMoveToTabModal(record);
      });
    }
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
      const perm = await requestPermission(record.handle, "read");
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
      perm = await requestPermission(record.handle, "read");
    } catch (e) {
      perm = "denied";
    }
    if (perm !== "granted") {
      toast("Permission was not granted for that folder.");
      return;
    }
    const { box, close } = createModalShell({ instant: true, boxClassName: "dm-icon-picker" });
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
    cancelBtn.addEventListener("click", close);
    btnRow.appendChild(cancelBtn);
    box.appendChild(btnRow);
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
      const perm = await requestPermission(record.handle, "readwrite");
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
    const suppressed = getBool(SUPPRESS_KEY);
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
      setBool(SUPPRESS_KEY, true);
    }
  }
  async function addFolderViaAddTile() {
    if (!hasDirectoryPicker()) {
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
      setIconLabel(pin, "\u2605");
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
    renderTabBar();
    dmGrid.innerHTML = "";
    if (isGroupLocked(activeGroupId)) {
      const group = getGroup(activeGroupId);
      const lockScreen = document.createElement("div");
      lockScreen.className = "dm-lock-screen";
      const icon = document.createElement("div");
      icon.className = "dm-lock-icon";
      setIconLabel(icon, "\u{1F512}");
      const msg = document.createElement("div");
      msg.className = "dm-lock-msg";
      msg.textContent = `"${group.name}" is locked.`;
      const unlockBtn = document.createElement("button");
      unlockBtn.className = "primary";
      unlockBtn.textContent = "Unlock";
      unlockBtn.addEventListener("click", () => selectGroup(group.id));
      lockScreen.appendChild(icon);
      lockScreen.appendChild(msg);
      lockScreen.appendChild(unlockBtn);
      dmGrid.appendChild(lockScreen);
      return;
    }
    let records = [];
    try {
      records = await listDatasetFolders();
    } catch (e) {
      records = [];
    }
    const inGroup = records.filter((r) => recordGroupId(r) === activeGroupId);
    const sorted = sortRecords(inGroup);
    if (viewMode === "list") dmGrid.appendChild(buildAddTile());
    for (const record of sorted) dmGrid.appendChild(buildFolderTile(record));
    if (viewMode !== "list") dmGrid.appendChild(buildAddTile());
  }
  function initDatasetManager(deps) {
    getDirHandle6 = deps.getDirHandle;
    openFolderHandle2 = deps.openFolderHandle;
    switchTab = deps.switchTab;
    loadPrefs();
    loadGroups();
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

  // src/bucket-core.ts
  function getValidBuckets(sideMin, sideMax, step = 64) {
    const sMin = Math.floor(sideMin), sMax = Math.floor(sideMax), st = Math.max(1, Math.floor(step));
    const seen = /* @__PURE__ */ new Map();
    const add = (w, h) => {
      seen.set(`${w}x${h}`, [w, h]);
    };
    add(sMin, sMin);
    for (let s = sMin + st; s < sMax + st; s += st) {
      add(sMin, s);
      add(s, sMin);
    }
    return Array.from(seen.values()).sort((a, b) => a[0] * a[1] - b[0] * b[1]);
  }
  function isBucketSize(w, h, buckets) {
    return buckets.some((b) => b[0] === w && b[1] === h);
  }

  // src/renderer/bucket-images.ts
  var ORIGINAL_DIR = "original_images";
  var SETTINGS_KEY = "dts-bucket-settings";
  var getDirHandle7 = () => null;
  var getEntries3 = () => [];
  var reload = async () => {
  };
  var saveAllDirty2 = async () => {
  };
  var busy = false;
  function log(line, isErr = false) {
    const el = document.createElement("div");
    el.className = "bucket-log-line" + (isErr ? " err" : "");
    el.textContent = line;
    bucketLog.appendChild(el);
    bucketLog.scrollTop = bucketLog.scrollHeight;
  }
  function clearLog() {
    bucketLog.textContent = "";
  }
  function params() {
    const sideMin = Math.max(64, parseInt(bucketSideMin.value, 10) || 256);
    const sideMax = Math.max(sideMin, parseInt(bucketSideMax.value, 10) || 1024);
    const step = Math.max(16, parseInt(bucketSideStep.value, 10) || 64);
    return { sideMin, sideMax, step };
  }
  async function imageDimensions(file) {
    const bmp = await createImageBitmap(file);
    const dims = { width: bmp.width, height: bmp.height };
    bmp.close();
    return dims;
  }
  async function originalDir(create) {
    const dirHandle = getDirHandle7();
    if (!dirHandle) return null;
    try {
      return await dirHandle.getDirectoryHandle(ORIGINAL_DIR, { create });
    } catch {
      return null;
    }
  }
  function setBusy(on) {
    busy = on;
    btnBucketRun.disabled = on;
    btnBucketRevert.disabled = on;
  }
  async function refreshModelStatus() {
    try {
      const st = await window.electronAPI.bucketModelStatus();
      if (st.present) {
        bucketModelStatusText.textContent = `u2net ready (${Math.round((st.sizeBytes || 0) / 1048576)} MB).`;
        btnBucketDownloadModel.style.display = "none";
      } else {
        bucketModelStatusText.textContent = "u2net model not downloaded yet.";
        btnBucketDownloadModel.style.display = "";
      }
    } catch {
      bucketModelStatusText.textContent = "Could not read the model status.";
    }
  }
  async function downloadModel() {
    if (busy) return;
    setBusy(true);
    btnBucketDownloadModel.disabled = true;
    try {
      bucketModelStatusText.textContent = "Downloading u2net\u2026 0%";
      await window.electronAPI.bucketDownloadModel();
      toast("u2net model downloaded.", 2600);
    } catch (err) {
      toast(`Could not download the u2net model: ${err instanceof Error ? err.message : String(err)}`, 5e3);
    } finally {
      btnBucketDownloadModel.disabled = false;
      setBusy(false);
      await refreshModelStatus();
    }
  }
  async function run() {
    if (busy) return;
    const dirHandle = getDirHandle7();
    if (!dirHandle) {
      toast("Open a dataset folder first.");
      return;
    }
    const active = getEntries3().filter((e) => !e.disabled && !e.original);
    if (!active.length) {
      toast("No Gallery images to bucket.");
      return;
    }
    const { sideMin, sideMax, step } = params();
    const buckets = getValidBuckets(sideMin, sideMax, step);
    const preferGpu = bucketGpu.checked;
    const ok = await showConfirmModal(
      `Bucket ${active.length} Gallery image(s) at ${sideMin}\u2013${sideMax} (step ${step})?

Each image is moved into original_images/ (treated as disabled \u2014 the new Originals view), and a cropped + resized PNG is written back to the dataset root under the same name. Images already at a valid bucket size are left alone.`,
      { okLabel: "Bucket images" }
    );
    if (!ok) return;
    if (!(await window.electronAPI.bucketModelStatus()).present) {
      toast("Download the u2net model first (the button above).");
      return;
    }
    await saveAllDirty2(true);
    setBusy(true);
    clearLog();
    const origDir = await originalDir(true);
    if (!origDir) {
      log(`Could not create ${ORIGINAL_DIR}/.`, true);
      setBusy(false);
      return;
    }
    let processed = 0, skipped = 0, failed = 0;
    const counts = {};
    const bump = (w, h) => {
      const k = `${w}x${h}`;
      counts[k] = (counts[k] || 0) + 1;
    };
    try {
      for (const entry of active) {
        const filename = entry.imgName || entry.base;
        let file;
        try {
          file = await entry.imgHandle.getFile();
        } catch {
          log(`${filename}: could not read the file.`, true);
          failed++;
          continue;
        }
        let dims;
        try {
          dims = await imageDimensions(file);
        } catch {
          log(`${filename}: could not read its dimensions (unsupported format?).`, true);
          failed++;
          continue;
        }
        if (isBucketSize(dims.width, dims.height, buckets)) {
          skipped++;
          bump(dims.width, dims.height);
          log(`${filename}: already ${dims.width}x${dims.height} \u2014 left as-is.`);
          continue;
        }
        const bytes = new Uint8Array(await file.arrayBuffer());
        const res = await window.electronAPI.bucketImage({ imageBytes: bytes, sideMin, sideMax, step, preferGpu });
        if (!res.ok || !res.pngBytes || !res.bucket) {
          log(`${filename}: ${res.error || "bucketing failed"}`, true);
          failed++;
          continue;
        }
        try {
          const origImg = await origDir.getFileHandle(filename, { create: true });
          await writeBytes(origImg, bytes);
          if (entry.txtHandle && entry.txtName) {
            try {
              const txtBlob = await entry.txtHandle.getFile();
              const origTxt = await origDir.getFileHandle(entry.txtName, { create: true });
              await writeBytes(origTxt, txtBlob);
            } catch {
            }
          }
          const stemPng = entry.base + ".png";
          const outHandle = await dirHandle.getFileHandle(stemPng, { create: true });
          await writeBytes(outHandle, res.pngBytes);
          if (filename !== stemPng) {
            try {
              await dirHandle.removeEntry(filename);
            } catch {
            }
          }
        } catch (err) {
          log(`${filename}: ${err instanceof Error ? err.message : String(err)}`, true);
          failed++;
          continue;
        }
        processed++;
        bump(res.bucket[0], res.bucket[1]);
        const engine = res.provider ? ` (${res.provider === "dml" ? "GPU" : "CPU"})` : "";
        log(`${filename} \u2192 ${res.bucket[0]}x${res.bucket[1]}${engine}`);
      }
      log("");
      log(`Done. Bucketed ${processed}, already-bucketed ${skipped}, failed ${failed}.`);
      for (const k of Object.keys(counts).sort()) log(`  ${k}: ${counts[k]}`);
      toast(`Bucketed ${processed} image(s) \u2014 originals are in the Originals view.`, 3600);
    } catch (err) {
      log(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`, true);
      toast("Bucketing failed \u2014 see the dock log.", 4200);
    } finally {
      setBusy(false);
      await reload();
    }
  }
  async function revert() {
    if (busy) return;
    const dirHandle = getDirHandle7();
    if (!dirHandle) {
      toast("Open a dataset folder first.");
      return;
    }
    const originals = getEntries3().filter((e) => e.original);
    if (!originals.length) {
      toast("No originals to restore \u2014 nothing has been bucketed.");
      return;
    }
    const { sideMin, sideMax, step } = params();
    const buckets = getValidBuckets(sideMin, sideMax, step);
    const originalBases = new Set(originals.map((e) => e.base));
    const orphans = [];
    for (const e of getEntries3().filter((x) => !x.disabled && !x.original)) {
      if (originalBases.has(e.base)) continue;
      try {
        const dims = await imageDimensions(await e.imgHandle.getFile());
        if (isBucketSize(dims.width, dims.height, buckets)) orphans.push(e);
      } catch {
      }
    }
    const ok = await showConfirmModal(
      `Revert bucketing for ${originals.length} image(s)?

This deletes the bucketed copy in the dataset root and moves the original back from original_images/ into the Gallery.`,
      { okLabel: "Revert bucketing", danger: true }
    );
    if (!ok) return;
    setBusy(true);
    clearLog();
    const origDir = await originalDir(false);
    let restored = 0, failed = 0;
    try {
      for (const entry of originals) {
        const imgName = entry.imgName || entry.base;
        const stemPng = entry.base + ".png";
        try {
          if (origDir) {
            try {
              await dirHandle.removeEntry(stemPng);
            } catch {
            }
            const file = await entry.imgHandle.getFile();
            const back = await dirHandle.getFileHandle(imgName, { create: true });
            await writeBytes(back, file);
            try {
              await origDir.removeEntry(imgName);
            } catch {
            }
            if (entry.txtName) {
              try {
                await origDir.removeEntry(entry.txtName);
              } catch {
              }
            }
          }
          restored++;
          log(`restored ${imgName}`);
        } catch (err) {
          log(`${imgName}: ${err instanceof Error ? err.message : String(err)}`, true);
          failed++;
        }
      }
      if (orphans.length) {
        const del = await showConfirmModal(
          `${orphans.length} image(s) in the dataset are already bucket-sized but have no saved original (they were never moved to original_images/).

Delete them too? "Keep them" leaves them in the Gallery.`,
          { okLabel: "Delete them too", cancelLabel: "Keep them", danger: true }
        );
        if (del) {
          for (const e of orphans) {
            try {
              await dirHandle.removeEntry(e.imgName || e.base);
            } catch {
            }
            if (e.txtName) {
              try {
                await dirHandle.removeEntry(e.txtName);
              } catch {
              }
            }
          }
          log(`deleted ${orphans.length} bucketed image(s) with no original`);
        }
      }
      try {
        await dirHandle.removeEntry(ORIGINAL_DIR, { recursive: true });
      } catch {
      }
      log("");
      log(`Done. Restored ${restored}, failed ${failed}.`);
      toast(`Reverted bucketing \u2014 restored ${restored} original(s).`, 3600);
    } catch (err) {
      log(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`, true);
      toast("Revert failed \u2014 see the dock log.", 4200);
    } finally {
      setBusy(false);
      await reload();
    }
  }
  function initBucketImages(deps) {
    getDirHandle7 = deps.getDirHandle;
    getEntries3 = deps.getEntries;
    reload = deps.reload;
    saveAllDirty2 = deps.saveAllDirty;
    const saved = getJSON(SETTINGS_KEY, null);
    if (saved && typeof saved.gpu === "boolean") bucketGpu.checked = saved.gpu;
    bucketGpu.addEventListener("change", () => setJSON(SETTINGS_KEY, { gpu: bucketGpu.checked }));
    btnBucketRun.addEventListener("click", () => {
      void run();
    });
    btnBucketRevert.addEventListener("click", () => {
      void revert();
    });
    btnBucketDownloadModel.addEventListener("click", () => {
      void downloadModel();
    });
    window.electronAPI.onBucketDownloadProgress((_event, ev) => {
      bucketModelStatusText.textContent = `Downloading u2net\u2026 ${ev.percent}%`;
    });
    void refreshModelStatus();
  }

  // src/renderer/master-tag-control.ts
  var masterSelectedImages = /* @__PURE__ */ new Set();
  function attachIconFallback(btn, icon) {
    const label = (btn.dataset.iconLabel || btn.textContent || "").trim();
    btn.classList.add("icon-fallback-btn");
    btn.setAttribute("aria-label", plainLabel(label));
    btn.textContent = "";
    const full = document.createElement("span");
    full.className = "label-full";
    full.setAttribute("aria-hidden", "true");
    setIconLabel(full, label);
    const iconEl = document.createElement("span");
    iconEl.className = "label-icon";
    iconEl.setAttribute("aria-hidden", "true");
    setIconLabel(iconEl, icon);
    btn.appendChild(full);
    btn.appendChild(iconEl);
  }
  var miniGridDragging = false;
  var miniGridPaintMode = false;
  document.addEventListener("pointerup", () => {
    miniGridDragging = false;
  });
  document.addEventListener("pointercancel", () => {
    miniGridDragging = false;
  });
  var MINI_GRID_SIZE_KEY = "dts-mini-grid-size";
  var miniGridSize = 1;
  try {
    const saved = getInt(MINI_GRID_SIZE_KEY, NaN);
    if (saved >= 1 && saved <= 4) miniGridSize = saved;
  } catch (e) {
  }
  function buildMiniGridSizeRow() {
    const row = document.createElement("div");
    row.className = "mini-grid-size-row";
    const label = document.createElement("span");
    label.textContent = "Size";
    row.appendChild(label);
    for (let n = 1; n <= 4; n++) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = n + "x";
      btn.className = n === miniGridSize ? "active" : "";
      btn.title = `${n}x thumbnail size`;
      btn.addEventListener("click", () => {
        miniGridSize = n;
        setInt(MINI_GRID_SIZE_KEY, n);
        masterMiniGrid.style.setProperty("--mini-grid-size", String(n));
        row.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === btn));
      });
      row.appendChild(btn);
    }
    return row;
  }
  var getEntries4 = () => [];
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
  var disableEntriesRef = async () => 0;
  var refreshImmunizeTogglesRef = () => {
  };
  function updateMasterSelectionText() {
    if (masterSelectedImages.size === 0) {
      masterSelectionSummary.textContent = "No images selected yet.";
    } else {
      masterSelectionSummary.textContent = `${masterSelectedImages.size} image(s) selected.`;
    }
    refreshImmunizeTogglesRef();
  }
  function renderMasterMiniGrid() {
    masterMiniGrid.innerHTML = "";
    masterMiniGrid.style.setProperty("--mini-grid-size", String(miniGridSize));
    masterMiniGrid.appendChild(buildMiniGridSizeRow());
    const list = filteredEntriesRef();
    list.forEach((e) => {
      const cell = document.createElement("div");
      cell.className = "master-mini-cell" + (masterSelectedImages.has(e.base) ? " selected" : "");
      cell.dataset.base = e.base;
      const img = document.createElement("img");
      img.src = e.objectUrl;
      img.loading = "lazy";
      img.draggable = false;
      cell.appendChild(img);
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "master-mini-cb";
      cb.checked = masterSelectedImages.has(e.base);
      cb.addEventListener("click", (ev) => ev.stopPropagation());
      cb.addEventListener("pointerdown", (ev) => ev.stopPropagation());
      cb.addEventListener("change", () => {
        if (cb.checked) masterSelectedImages.add(e.base);
        else masterSelectedImages.delete(e.base);
        cell.classList.toggle("selected", cb.checked);
        updateMasterSelectionText();
        renderCurrentViewRef2();
      });
      cell.appendChild(cb);
      function paint() {
        if (cb.checked === miniGridPaintMode) return;
        cb.checked = miniGridPaintMode;
        cb.dispatchEvent(new Event("change"));
      }
      cell.addEventListener("pointerdown", (ev) => {
        if (ev.button !== 0) return;
        ev.preventDefault();
        miniGridDragging = true;
        miniGridPaintMode = !cb.checked;
        paint();
      });
      cell.addEventListener("pointerenter", () => {
        if (!miniGridDragging) return;
        paint();
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
    getEntries4 = deps.getEntries;
    getEntryByBase3 = deps.getEntryByBase;
    filteredEntriesRef = deps.filteredEntries;
    renderCurrentViewRef2 = deps.renderCurrentView;
    refreshAllUIRef4 = deps.refreshAllUI;
    getEntryMeta = deps.getEntryMeta;
    saveEntryMetaRef = deps.saveEntryMeta;
    deleteEntriesPermanentlyRef = deps.deleteEntriesPermanently;
    disableEntriesRef = deps.disableEntries;
    onStartSequentialRef = deps.onStartSequential;
    attachIconFallback(btnMasterSelectAll, "\u2611");
    attachIconFallback(btnMasterClearSelection, "\u2716");
    if (!document.documentElement.classList.contains("touch-device")) {
      let makeSeqBtn = function(label, icon, title, from) {
        const btn = document.createElement("button");
        btn.title = title;
        btn.dataset.iconLabel = "\u25B6 " + label;
        attachIconFallback(btn, icon);
        btn.addEventListener("click", () => onStartSequentialRef(from));
        return btn;
      };
      const seqRow = document.createElement("div");
      seqRow.className = "mtc-btn-row";
      const seqFirstBtn = makeSeqBtn("Sequential from first", "\u23EE", "Review every gallery image in sort order, confirming detail tags one by one", "first");
      const seqSelBtn = makeSeqBtn("Sequential from selected", "\u{1F3AF}", "Review from the first selected image in sort order", "selected");
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
    btnMasterDisableSelected.addEventListener("click", async () => {
      if (masterSelectedImages.size === 0) {
        toast("Select at least one image first.");
        return;
      }
      const total = masterSelectedImages.size;
      const entriesList = selectedEntries();
      const moved = await disableEntriesRef(entriesList);
      if (moved === 0) {
        toast("Nothing to disable \u2014 every selected image is already disabled or locked.");
        return;
      }
      const skipped = total - moved;
      toast(skipped > 0 ? `Disabled ${moved} image(s) \u2014 ${skipped} skipped (locked or already disabled).` : `Disabled ${moved} image(s).`, 3600);
      renderMasterSelectionSummary();
      renderCurrentViewRef2();
    });
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
      const entriesList = selectedEntries();
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
    function computeAllHaveFlags(flags) {
      if (masterSelectedImages.size === 0) return false;
      for (const base of masterSelectedImages) {
        const e = getEntryByBase3(base);
        if (!e) return false;
        for (const f of flags) {
          if (!e.meta?.[f]) return false;
        }
      }
      return true;
    }
    const immunizeToggles = [
      {
        btn: btnMasterMergeImmunizeToggle,
        flags: ["mergeImmune"],
        offLabel: "\u{1F6AB} Merge Immunize",
        onLabel: "\u21A9 Un-immunize",
        offTitle: "Merge rules will never rewrite tags on the selected images",
        onTitle: "Remove Merge Immunize from the selected images",
        onActionLabel: "merge immunized",
        offActionLabel: "un-merge-immunized"
      },
      {
        btn: btnMasterAntivoidToggle,
        flags: ["antivoid"],
        offLabel: "\u{1F7E2} Antivoid",
        onLabel: "\u21A9 Un-antivoid",
        offTitle: "Void rules will never remove tags from the selected images",
        onTitle: "Remove Antivoid from the selected images",
        onActionLabel: "antivoided",
        offActionLabel: "un-antivoided"
      },
      {
        btn: btnMasterAntimmunizeToggle,
        flags: ["mergeImmune", "antivoid"],
        offLabel: "\u270B Antimmunize",
        onLabel: "\u21A9 Un-antimmunize",
        offTitle: "Shortcut for both Merge Immunize AND Antivoid at once, on the selected images",
        onTitle: "Clear both Merge Immunize and Antivoid from the selected images",
        onActionLabel: "antimmunized",
        offActionLabel: "un-antimmunized"
      }
    ];
    function refreshImmunizeToggles() {
      for (const t of immunizeToggles) {
        const allOn = computeAllHaveFlags(t.flags);
        setIconLabel(t.btn, allOn ? t.onLabel : t.offLabel);
        t.btn.title = allOn ? t.onTitle : t.offTitle;
        t.btn.classList.toggle("ghost-secondary", allOn);
      }
    }
    refreshImmunizeTogglesRef = refreshImmunizeToggles;
    for (const t of immunizeToggles) {
      t.btn.addEventListener("click", () => {
        const turnOn = !computeAllHaveFlags(t.flags);
        const flagsObj = {};
        for (const f of t.flags) flagsObj[f] = turnOn;
        setEntryFlagsForSelection(flagsObj, turnOn ? t.onActionLabel : t.offActionLabel);
        refreshImmunizeToggles();
      });
    }
    refreshImmunizeToggles();
    function selectedEntries() {
      return Array.from(masterSelectedImages).map((base) => getEntryByBase3(base)).filter((e) => !!e);
    }
    const readTag = (el) => el.value.trim().replace(/_/g, " ").replace(/\s+/g, " ");
    function runMassTagOp(opts) {
      const affected = [];
      for (const e of opts.entries) {
        if (opts.skip(e)) continue;
        const prevTags = e.tags.slice();
        opts.apply(e);
        markDirty(e);
        affected.push({ base: e.base, prevTags, newTags: e.tags.slice() });
      }
      if (affected.length === 0) {
        toast(opts.emptyMsg);
        return;
      }
      const summary = opts.summary(affected.length);
      toast(summary);
      recordChange(opts.logType, summary, affected);
      folderStats.master_ops = (folderStats.master_ops || 0) + 1;
      saveFolderStats();
      if (opts.statKey) trackStat(opts.statKey);
      if (opts.clearInputs) opts.clearInputs();
      refreshAllUIRef4();
      checkAchievements();
    }
    btnMasterApplyToSelected.addEventListener("click", () => {
      const tag = readTag(masterApplyTagInput);
      if (!tag) {
        toast("Enter a tag to apply.");
        return;
      }
      if (masterSelectedImages.size === 0) {
        toast("Select at least one image first.");
        return;
      }
      runMassTagOp({
        entries: selectedEntries(),
        skip: (e) => !!e.meta?.locked || e.tags.includes(tag),
        apply: (e) => {
          e.tags.push(tag);
        },
        logType: "add-tag",
        summary: (n) => `Applied "${tag}" to ${n} selected image(s).`,
        emptyMsg: "Nothing to apply \u2014 selected images already have that tag.",
        clearInputs: () => {
          masterApplyTagInput.value = "";
        }
      });
    });
    btnMasterRemoveFromSelected.addEventListener("click", () => {
      const tag = readTag(masterRemoveTagInput);
      if (!tag) {
        toast("Enter a tag to remove.");
        return;
      }
      if (masterSelectedImages.size === 0) {
        toast("Select at least one image first.");
        return;
      }
      runMassTagOp({
        entries: selectedEntries(),
        skip: (e) => !!e.meta?.locked || !e.tags.includes(tag),
        apply: (e) => {
          e.tags = e.tags.filter((t) => t !== tag);
        },
        logType: "remove-tag",
        summary: (n) => `Removed "${tag}" from ${n} selected image(s).`,
        emptyMsg: "None of the selected images have that tag.",
        clearInputs: () => {
          masterRemoveTagInput.value = "";
        }
      });
    });
    btnCondApply.addEventListener("click", () => {
      const sourceTag = readTag(condSourceTag);
      const addTag = readTag(condAddTag);
      if (!sourceTag || !addTag) {
        toast("Fill in both tags.");
        return;
      }
      runMassTagOp({
        entries: getEntries4(),
        skip: (e) => e.disabled || !!e.meta?.locked || !e.tags.includes(sourceTag) || e.tags.includes(addTag),
        apply: (e) => {
          e.tags.push(addTag);
        },
        logType: "add-tag",
        summary: (n) => `Added "${addTag}" to every image with "${sourceTag}" (${n} image(s)).`,
        emptyMsg: `No images with "${sourceTag}" are missing "${addTag}".`,
        clearInputs: () => {
          condSourceTag.value = "";
          condAddTag.value = "";
        }
      });
    });
    btnCondApplyWithout.addEventListener("click", () => {
      const sourceTag = readTag(condWithoutSourceTag);
      const addTag = readTag(condWithoutAddTag);
      if (!sourceTag || !addTag) {
        toast("Fill in both tags.");
        return;
      }
      runMassTagOp({
        entries: getEntries4(),
        skip: (e) => e.disabled || !!e.meta?.locked || e.tags.includes(sourceTag) || e.tags.includes(addTag),
        apply: (e) => {
          e.tags.push(addTag);
        },
        logType: "add-tag",
        summary: (n) => `Added "${addTag}" to every image WITHOUT "${sourceTag}" (${n} image(s)).`,
        emptyMsg: `No images without "${sourceTag}" are missing "${addTag}".`,
        clearInputs: () => {
          condWithoutSourceTag.value = "";
          condWithoutAddTag.value = "";
        }
      });
    });
    btnMassApply.addEventListener("click", async () => {
      const tag = readTag(massApplyInput);
      if (!tag) {
        toast("Enter a tag to apply.");
        return;
      }
      const ok = await showConfirmModal(`Add "${tag}" to EVERY active image in this folder?`, { okLabel: "Apply to all" });
      if (!ok) return;
      runMassTagOp({
        entries: getEntries4(),
        skip: (e) => e.disabled || !!e.meta?.locked || e.tags.includes(tag),
        apply: (e) => {
          e.tags.push(tag);
        },
        logType: "add-tag",
        summary: (n) => `Added "${tag}" to all ${n} image(s).`,
        emptyMsg: "Every image already has that tag.",
        clearInputs: () => {
          massApplyInput.value = "";
        }
      });
    });
    btnMassRemove.addEventListener("click", async () => {
      const tag = readTag(massRemoveInput);
      if (!tag) {
        toast("Enter a tag to remove.");
        return;
      }
      const ok = await showConfirmModal(`Remove "${tag}" from EVERY active image in this folder?`, { okLabel: "Remove from all", danger: true });
      if (!ok) return;
      runMassTagOp({
        entries: getEntries4(),
        skip: (e) => e.disabled || !!e.meta?.locked || !e.tags.includes(tag),
        apply: (e) => {
          e.tags = e.tags.filter((t) => t !== tag);
        },
        logType: "remove-tag",
        summary: (n) => `Removed "${tag}" from all ${n} image(s).`,
        emptyMsg: "No images have that tag.",
        clearInputs: () => {
          massRemoveInput.value = "";
        }
      });
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
      runMassTagOp({
        entries: getEntries4(),
        skip: (e) => e.disabled || !!e.meta?.locked || !e.tags.includes(from),
        apply: (e) => {
          e.tags = Array.from(new Set(e.tags.map((t) => t === from ? to : t)));
        },
        logType: "rename",
        summary: (n) => `Renamed "${from}" \u2192 "${to}" across ${n} image(s).`,
        emptyMsg: `No active images currently have the tag "${from}".`,
        statKey: "renames",
        clearInputs: () => {
          masterRenameFrom.value = "";
          masterRenameTo.value = "";
        }
      });
    });
    btnMasterFR.addEventListener("click", () => {
      const find = masterFRFind.value;
      const repl = masterFRReplace.value;
      if (!find) {
        toast("Enter a substring to find.");
        return;
      }
      runMassTagOp({
        entries: getEntries4(),
        skip: (e) => e.disabled || !!e.meta?.locked || !e.tags.some((t) => t.includes(find)),
        apply: (e) => {
          const replaced = e.tags.map((t) => t.includes(find) ? t.split(find).join(repl) : t);
          e.tags = Array.from(new Set(replaced.map((t) => t.trim()).filter(Boolean)));
        },
        logType: "find-replace",
        summary: (n) => `Replaced "${find}" \u2192 "${repl}" inside tags across ${n} image(s).`,
        emptyMsg: `No tags contain "${find}".`,
        statKey: "find_replaces",
        clearInputs: () => {
          masterFRFind.value = "";
          masterFRReplace.value = "";
        }
      });
    });
  }

  // src/comfy-core.ts
  function parseComboValues(nodeInfo, inputName) {
    const raw = nodeInfo?.input?.required?.[inputName];
    if (!Array.isArray(raw)) return null;
    if (Array.isArray(raw[0])) return raw[0];
    const second = raw[1];
    if (raw[0] === "COMBO" && second && Array.isArray(second.options)) return second.options;
    return null;
  }
  function concatBytes(parts) {
    let total = 0;
    for (const p of parts) total += p.length;
    const out = new Uint8Array(total);
    let offset = 0;
    for (const p of parts) {
      out.set(p, offset);
      offset += p.length;
    }
    return out;
  }
  function buildMultipart(fields, fileField, fileName, fileBytes) {
    const boundary = "----DTSBoundary" + Date.now().toString(16) + Math.random().toString(16).slice(2);
    const encoder = new TextEncoder();
    const parts = [];
    for (const [key, value] of Object.entries(fields)) {
      parts.push(encoder.encode(`--${boundary}\r
Content-Disposition: form-data; name="${key}"\r
\r
${value}\r
`));
    }
    const safeName = String(fileName).replace(/"/g, "");
    parts.push(encoder.encode(`--${boundary}\r
Content-Disposition: form-data; name="${fileField}"; filename="${safeName}"\r
Content-Type: application/octet-stream\r
\r
`));
    parts.push(fileBytes);
    parts.push(encoder.encode(`\r
--${boundary}--\r
`));
    return { boundary, body: concatBytes(parts) };
  }
  function buildSynthDatPrompt(template2, cfg) {
    const prompt = JSON.parse(JSON.stringify(template2));
    const character = [cfg.unified ? cfg.unifiedPrompt : cfg.character, cfg.characterTrigger].filter(Boolean).join(", ");
    prompt["21"].inputs.value = cfg.global;
    prompt["8"].inputs.value = cfg.unified ? "" : cfg.rating;
    prompt["19"].inputs.value = "";
    prompt["11"].inputs.value = character;
    prompt["12"].inputs.value = cfg.unified ? "" : cfg.hair;
    prompt["15"].inputs.value = cfg.unified ? "" : cfg.face;
    prompt["18"].inputs.value = cfg.unified ? "" : cfg.chest;
    prompt["9"].inputs.value = cfg.unified ? "" : cfg.body;
    prompt["6"].inputs.value = cfg.unified ? "" : cfg.clothes;
    prompt["20"].inputs.value = cfg.unified ? "" : cfg.limbs;
    prompt["14"].inputs.value = cfg.unified ? "" : cfg.sexual;
    prompt["7"].inputs.value = cfg.unified ? "" : cfg.pose;
    prompt["10"].inputs.value = cfg.unified ? "" : cfg.extra;
    prompt["13"].inputs.value = cfg.unified ? "" : cfg.effects;
    prompt["17"].inputs.value = cfg.unified ? "" : cfg.scene;
    prompt["16"].inputs.text = cfg.negative;
    prompt["41"].inputs.unet_name = cfg.diffModel;
    prompt["51"].inputs.lora_name = cfg.mainLora.trim() || cfg.noLoraStandIn;
    if (cfg.clip) {
      prompt["249"].inputs.clip_name = cfg.clip;
      prompt["47:45"].inputs.clip_name = cfg.clip;
    }
    if (cfg.vae) prompt["47:46"].inputs.vae_name = cfg.vae;
    const chunks = [];
    for (let i = 0; i < cfg.loraRows.length; i += 4) chunks.push(cfg.loraRows.slice(i, i + 4));
    function fillStackInputs(inputs, chunk) {
      for (let i = 0; i < 4; i++) {
        const slot = String(i + 1).padStart(2, "0");
        const r = chunk[i];
        inputs[`lora_${slot}`] = r ? r.input.trim() || "None" : "None";
        inputs[`strength_${slot}`] = r ? parseFloat(r.strength) || 0 : 0;
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
    if (cfg.skipRefImage) {
      delete prompt["239"];
      delete prompt["240"];
      delete prompt["243"];
      delete prompt["238"];
      delete prompt["246"];
      prompt["158:53"].inputs.model = [lastStackId, 0];
      prompt["158:54"].inputs.model = [lastStackId, 0];
    } else {
      prompt["240"].inputs.strength = parseFloat(cfg.lliteStrength) || 0;
      prompt["240"].inputs.start_percent = parseFloat(cfg.lliteStartPercent) || 0;
      prompt["240"].inputs.end_percent = parseFloat(cfg.lliteEndPercent) || 0;
      prompt["240"].inputs.preserve_wrapper = cfg.llitePreserveWrapper;
      prompt["243"].inputs.select = 2;
      prompt["238"].inputs.fit = cfg.resizeFit;
      prompt["238"].inputs.method = cfg.resizeMethod;
      prompt["240"].inputs.image = ["238", 0];
    }
    prompt["168:167"].inputs.sampler_name = cfg.sampler;
    prompt["158:53"].inputs.scheduler = cfg.scheduler;
    prompt["158:53"].inputs.steps = parseInt(cfg.steps1, 10) || 1;
    prompt["158:54"].inputs.cfg = parseFloat(cfg.cfg1) || 1;
    prompt["174:171"].inputs.value = parseInt(cfg.width, 10) || 920;
    prompt["174:172"].inputs.value = parseInt(cfg.height, 10) || 1244;
    prompt["165"].inputs.noise_seed = parseInt(cfg.seed1, 10) || 0;
    if (cfg.use2Pass) {
      prompt["227"].inputs.noise_seed = parseInt(cfg.seed2, 10) || 0;
      prompt["195"].inputs.denoise = parseFloat(cfg.denoise2) || 0;
      prompt["195"].inputs.scheduler = cfg.scheduler;
      prompt["195"].inputs.steps = parseInt(cfg.steps2, 10) || 1;
      prompt["192_pass1"] = { class_type: "SaveImage", inputs: { filename_prefix: prompt["192"].inputs.filename_prefix, images: ["176", 0] }, _meta: { title: "Pass 1 preview" } };
    } else {
      delete prompt["190"];
      delete prompt["191"];
      delete prompt["195"];
      delete prompt["227"];
      delete prompt["224"];
      prompt["192"].inputs.images = ["176", 0];
    }
    if (cfg.upscale && cfg.upscale.enabled && cfg.upscale.model.trim()) {
      prompt["upscale_model_loader"] = { class_type: "UpscaleModelLoader", inputs: { model_name: cfg.upscale.model.trim() }, _meta: { title: "Upscale Model Loader" } };
      const scaleBy = parseFloat(cfg.upscale.scaleBy) || 1;
      prompt["upscale_model_192"] = { class_type: "ImageUpscaleWithModel", inputs: { upscale_model: ["upscale_model_loader", 0], image: prompt["192"].inputs.images }, _meta: { title: "Upscale" } };
      prompt["upscale_scale_192"] = { class_type: "ImageScaleBy", inputs: { upscale_method: "lanczos", scale_by: scaleBy, image: ["upscale_model_192", 0] }, _meta: { title: "Upscale scale-by" } };
      prompt["222"].inputs.text_c = "Upscaled";
      prompt["192_upscaled"] = { class_type: "SaveImage", inputs: { filename_prefix: ["222", 0], images: ["upscale_scale_192", 0] }, _meta: { title: "Upscaled" } };
    }
    return prompt;
  }
  function buildWd14Prompt(imageRef, settings2) {
    return {
      "1": { class_type: "LoadImage", inputs: { image: imageRef, upload: "image" } },
      "2": {
        class_type: "WD14Tagger|pysssss",
        inputs: {
          image: ["1", 0],
          model: settings2.model,
          threshold: settings2.threshold,
          character_threshold: settings2.characterThreshold,
          // No longer user-configurable — always false so the node still gets a
          // value for this required input.
          replace_underscore: false,
          trailing_comma: !!settings2.trailingComma,
          exclude_tags: settings2.excludeTags || ""
        }
      }
    };
  }
  function parseQueueResponse(parsed, status, noun) {
    if (status !== 200) {
      const errMsg = parsed && parsed.error && parsed.error.message;
      return { ok: false, error: errMsg ? `ComfyUI rejected the request: ${errMsg}` : `ComfyUI returned HTTP ${status} queuing the ${noun} request.` };
    }
    const nodeErrorKeys = parsed && parsed.node_errors ? Object.keys(parsed.node_errors) : [];
    if (nodeErrorKeys.length) return { ok: false, error: `ComfyUI rejected the workflow: ${JSON.stringify(parsed.node_errors)}` };
    const promptId = parsed && parsed.prompt_id;
    if (!promptId) return { ok: false, error: "ComfyUI did not return a prompt id." };
    return { ok: true, promptId };
  }
  function extractWd14Tags(record) {
    const tags = record && record.outputs && record.outputs["2"] && record.outputs["2"].tags;
    if (!tags) return null;
    return Array.isArray(tags) ? tags[0] : tags;
  }
  function decodeUtf8(bytes) {
    return new TextDecoder().decode(bytes);
  }
  function safeJson(text) {
    try {
      return JSON.parse(text || "{}");
    } catch {
      return {};
    }
  }
  async function uploadImage(t, host, filename, bytes, label = "Image") {
    const { boundary, body } = buildMultipart({ type: "input", overwrite: "true" }, "image", filename, bytes);
    const res = await t.request(host, "/upload/image", {
      method: "POST",
      headers: { "Content-Type": `multipart/form-data; boundary=${boundary}`, "Content-Length": body.length },
      body,
      timeoutMs: 2e4
    });
    if (res.status !== 200) return { ok: false, error: `${label} upload to ComfyUI failed (HTTP ${res.status}).` };
    const uploaded = safeJson(decodeUtf8(res.body));
    return { ok: true, ref: uploaded.subfolder ? `${uploaded.subfolder}/${uploaded.name}` : uploaded.name };
  }
  async function queuePrompt(t, host, prompt, clientId, opts = {}) {
    const payload = { prompt, client_id: clientId };
    if (opts.extraData) payload.extra_data = opts.extraData;
    const body = new TextEncoder().encode(JSON.stringify(payload));
    const res = await t.request(host, "/prompt", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": body.length },
      body,
      timeoutMs: 1e4
    });
    return parseQueueResponse(safeJson(decodeUtf8(res.body)), res.status, opts.noun || "request");
  }
  async function pollHistory(t, host, promptId, opts) {
    const interval = opts.intervalMs ?? 700;
    const deadline = Date.now() + opts.deadlineMs;
    const cancelled = () => opts.isCancelled ? opts.isCancelled() : false;
    const stopped = () => opts.onCancelled ? opts.onCancelled() : { ok: false, error: "Cancelled." };
    while (Date.now() < deadline) {
      if (cancelled()) return stopped();
      await new Promise((r) => setTimeout(r, interval));
      if (cancelled()) return stopped();
      let histRes;
      try {
        histRes = await t.request(host, `/history/${promptId}`, { timeoutMs: 8e3 });
      } catch {
        continue;
      }
      if (histRes.status !== 200) continue;
      const hist = safeJson(decodeUtf8(histRes.body));
      const record = hist[promptId];
      if (!record) continue;
      const value = await opts.extract(record);
      if (value !== null && value !== void 0) return { ok: true, value };
      if (record.status && record.status.status_str === "error") return { ok: false, error: opts.errorStatusMessage };
    }
    return { ok: false, error: opts.timeoutMessage };
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
  var fetchComfyTransport = {
    request: async (host, path, init = {}) => {
      const res = await fetch(new URL(path, host), {
        method: init.method || "GET",
        headers: init.headers,
        body: init.body ?? void 0
      });
      return { status: res.status, body: new Uint8Array(await res.arrayBuffer()) };
    }
  };
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
    const models = parseComboValues(parsed["WD14Tagger|pysssss"], "model");
    if (!Array.isArray(models)) return { ok: false, error: "Could not find the WD14 Tagger node on that ComfyUI instance." };
    return { ok: true, models };
  }
  async function comfyTagImage({ host, filename, imageBytes, settings: settings2 }) {
    host = normalizeHost(host);
    try {
      const upload = await uploadImage(fetchComfyTransport, host, filename, imageBytes, "Image");
      if (!upload.ok) return upload;
      const clientId = `dts-mobile-${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
      const prompt = buildWd14Prompt(upload.ref, settings2);
      const queue = await queuePrompt(fetchComfyTransport, host, prompt, clientId, { noun: "tag" });
      if (!queue.ok) return queue;
      const poll = await pollHistory(fetchComfyTransport, host, queue.promptId, {
        deadlineMs: 12e4,
        extract: (record) => extractWd14Tags(record),
        errorStatusMessage: "ComfyUI reported an error while tagging this image \u2014 check its console for details.",
        timeoutMessage: "Timed out waiting for ComfyUI to finish tagging this image."
      });
      if (!poll.ok) return poll;
      return { ok: true, tagsCsv: poll.value };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: `Could not reach ComfyUI at ${host}${isLikelyCorsFailure(err) ? corsHintSuffix() : " (" + msg + ")"}` };
    }
  }
  async function comfyGetObjectInfo({ host, classType, inputName }) {
    host = normalizeHost(host);
    try {
      const res = await fetch(new URL(`/object_info/${encodeURIComponent(classType)}`, host));
      if (!res.ok) return { ok: false, error: `ComfyUI returned HTTP ${res.status} looking up ${classType}.` };
      const parsed = await res.json();
      const values = parseComboValues(parsed[classType], inputName);
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
        const upload = await uploadImage(fetchComfyTransport, host, imageFilename, imageBytes, "Reference image");
        if (!upload.ok) return upload;
        prompt["239"].inputs.image = upload.ref;
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
      const queue = await queuePrompt(fetchComfyTransport, host, prompt, clientId, { extraData: { preview_method: "taesd" }, noun: "generation" });
      if (!queue.ok) return queue;
      const promptId = queue.promptId;
      const poll = await pollHistory(fetchComfyTransport, host, promptId, {
        deadlineMs: 3e5,
        isCancelled: () => !!(activeGen && activeGen.cancelled),
        onCancelled: () => ({ ok: false, error: "Generation stopped.", interrupted: true }),
        errorStatusMessage: "ComfyUI reported an error while generating this image \u2014 check its console for details.",
        timeoutMessage: "Timed out waiting for ComfyUI to finish generating this image.",
        extract: async (record) => {
          const outputs = record.outputs;
          const saveOutput = outputs?.["192"];
          const image = saveOutput?.images?.[0];
          if (!image) return null;
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
      });
      return poll.ok ? poll.value : poll;
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
  var SETTINGS_KEY2 = "dts-wd14-settings";
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
  var getEntries5 = () => [];
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
    const saved = getJSON(SETTINGS_KEY2, null);
    if (saved && typeof saved === "object") settings = { ...base, ...saved };
  }
  function saveSettings() {
    setJSON(SETTINGS_KEY2, settings);
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
      const { box, close: teardown } = createModalShell({ boxClassName: "wd14-review-box", onDismiss: () => close(null) });
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
        teardown();
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
      btnRow.appendChild(cancelBtn);
      btnRow.appendChild(okBtn);
      box.appendChild(btnRow);
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
    setIconLabel(btnWd14TagSelected, "\u23F9 Cancel tagging");
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
    setIconLabel(btnWd14TagSelected, "\u{1F40D} Tag selected images with WD14");
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
      setIconLabel(delBtn, "\u2715");
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
      setIconLabel(dlBtn, "\u2B07");
      dlBtn.title = `Download ${entry.repo}`;
      dlBtn.addEventListener("click", () => downloadRepo(resolveHfRepo(entry.repo), dlBtn));
      row.appendChild(dlBtn);
      wd14LocalCatalog.appendChild(row);
    }
  }
  function initWd14Tagger(deps) {
    getEntries5 = deps.getEntries;
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
      const entries = getEntries5().filter((e) => masterSelectedImages.has(e.base) && !e.disabled && !e.meta?.locked);
      runBatch(entries);
    });
  }

  // src/renderer/picker-modal.ts
  function openPickerModal(title, options, current, onPick) {
    const backdrop = document.createElement("div");
    backdrop.className = "picker-backdrop";
    const box = document.createElement("div");
    box.className = "picker-box";
    const head = document.createElement("div");
    head.className = "picker-head";
    const titleEl = document.createElement("span");
    titleEl.textContent = title;
    const closeBtn = document.createElement("button");
    closeBtn.className = "picker-close";
    closeBtn.textContent = "\xD7";
    closeBtn.title = "Close";
    head.appendChild(titleEl);
    head.appendChild(closeBtn);
    const search = document.createElement("input");
    search.type = "text";
    search.placeholder = "Search\u2026";
    search.className = "picker-search";
    const list = document.createElement("div");
    list.className = "picker-list";
    box.appendChild(head);
    box.appendChild(search);
    box.appendChild(list);
    backdrop.appendChild(box);
    function close() {
      backdrop.classList.remove("modal-visible");
      setTimeout(() => backdrop.remove(), 160);
      document.removeEventListener("keydown", onKey);
    }
    function onKey(ev) {
      if (ev.key === "Escape") close();
    }
    function renderRows() {
      const raw = search.value.trim().toLowerCase();
      let matches;
      if (!raw) {
        matches = options.slice();
      } else {
        const starts = [];
        const subs = [];
        for (const o of options) {
          const lower = o.toLowerCase();
          if (lower.startsWith(raw)) starts.push(o);
          else if (lower.includes(raw)) subs.push(o);
        }
        matches = starts.concat(subs);
      }
      list.innerHTML = "";
      const clearRow = document.createElement("div");
      clearRow.className = "picker-row picker-clear";
      clearRow.textContent = "\u2014 Clear \u2014";
      clearRow.addEventListener("click", () => {
        onPick("");
        close();
      });
      list.appendChild(clearRow);
      if (!matches.length) {
        const empty = document.createElement("div");
        empty.className = "picker-empty";
        empty.textContent = raw ? "No matches." : "No options yet \u2014 try refreshing model lists.";
        list.appendChild(empty);
      } else {
        for (const val of matches) {
          const row = document.createElement("div");
          row.className = "picker-row" + (val === current ? " picked" : "");
          row.textContent = val;
          row.addEventListener("click", () => {
            onPick(val);
            close();
          });
          list.appendChild(row);
        }
      }
    }
    search.addEventListener("input", renderRows);
    backdrop.addEventListener("click", (ev) => {
      if (ev.target === backdrop) close();
    });
    closeBtn.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    renderRows();
    document.body.appendChild(backdrop);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      backdrop.classList.add("modal-visible");
      search.focus();
    }));
  }
  function attachPickerModal(inputEl, title, getOptions) {
    inputEl.readOnly = true;
    inputEl.addEventListener("click", () => {
      openPickerModal(title, getOptions() || [], inputEl.value, (v) => {
        inputEl.value = v;
        inputEl.dispatchEvent(new Event("input", { bubbles: true }));
        inputEl.dispatchEvent(new Event("change", { bubbles: true }));
      });
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
      const notes = getJSON(CUSTOM_NOTES_KEY, {});
      return notes[tag] || "";
    } catch (e) {
      return "";
    }
  }
  function setCustomTagNote(tag, text) {
    try {
      const notes = getJSON(CUSTOM_NOTES_KEY, {});
      notes[tag] = text;
      setJSON(CUSTOM_NOTES_KEY, notes);
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
    const defaults = { host: "http://127.0.0.1:8188", model: "", threshold: 0.35, characterThreshold: 0.85, trailingComma: false, excludeTags: "" };
    const saved = getJSON(WD14_SETTINGS_KEY, null);
    return saved && typeof saved === "object" ? { ...defaults, ...saved } : defaults;
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
    const dirHandle = getDirHandle8();
    if (!dirHandle) return;
    try {
      const handle = await dirHandle.getFileHandle(SETTINGS_FILE_NAME, { create: true });
      await writeBytes(handle, JSON.stringify({
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
        pose: synthDatPose.value,
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
    synthDatPose.value = "";
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
    const dirHandle = getDirHandle8();
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
    synthDatPose.value = saved.pose || "";
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
    const dirHandle = getDirHandle8();
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
    const groups2 = /* @__PURE__ */ new Map();
    for (const raw of tags) {
      const t = normalizeTag(raw);
      let family = "Other";
      for (const [re, name] of rules) {
        if (re.test(t)) {
          family = name;
          break;
        }
      }
      if (!groups2.has(family)) groups2.set(family, []);
      groups2.get(family).push(raw);
    }
    return Array.from(groups2.entries()).map(([family, list]) => ({ family, tags: list.sort((a, b) => a.localeCompare(b)) })).sort((a, b) => b.tags.length - a.tags.length);
  }
  function getWd14TransferSets() {
    return [
      { name: "Pose", desc: "Body posture/position tags \u2014 suggested destination: Pose. Suggested keyword families, not a strict taxonomy.", groups: [] },
      { name: "Limbs & Hands", desc: "Arm/hand actions and gestures \u2014 suggested destination: Limbs.", groups: [] },
      { name: "Scene (perspective/composition)", desc: "Camera-angle/composition tags \u2014 suggested destination: Scene.", groups: [] },
      { name: "Sexual", desc: "Sexual-content actions \u2014 suggested destination: Sexual.", groups: [] }
    ].map((s, i) => {
      const groups2 = [
        groupTagsByFamily([...POSE_TAGS], POSE_FAMILIES),
        groupTagsByFamily([...LIMB_ACTION_TAGS], LIMB_FAMILIES),
        groupTagsByFamily([...SCENE_TAGS], SCENE_FAMILIES),
        groupTagsByFamily([...SEXUAL_ACTION_TAGS], SEXUAL_FAMILIES)
      ][i];
      return { name: s.name, desc: s.desc, groups: groups2, total: groups2.reduce((n, g) => n + g.tags.length, 0) };
    });
  }
  var template = null;
  var getDirHandle8 = () => null;
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
    if (!hasOpenFilePicker()) {
      toast("Your browser does not support file picking here.", 4e3);
      return;
    }
    let handles;
    try {
      handles = await pickOpenFiles({
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
      setIconLabel(synthDatResoWarning, `\u26A0 Reference image is ${refPortrait ? "portrait" : "landscape"} (${refImageEl.naturalWidth}\xD7${refImageEl.naturalHeight}) but your generation resolution is ${targetPortrait ? "portrait" : "landscape"} (${targetW}\xD7${targetH}) \u2014 consider swapping Width/Height.`);
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
    input.placeholder = "Click to choose\u2026";
    input.value = defaultLora || "";
    attachPickerModal(input, "LoRA", () => loraCombo || []);
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
      setIconLabel(synthDatConnStatus, `\u2713 Connected to ${getHost()}`);
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
    addContextMenuItem(menu, "\u{1F4D6} Definition", () => {
      closePendingTagMenu();
      openTagDetails(tag);
    });
    const isVoid = markedVoidTags.has(tag);
    addContextMenuItem(menu, isVoid ? "\u21A9\uFE0F Unmark void" : "\u{1F6AB} Mark as void", () => {
      if (isVoid) markedVoidTags.delete(tag);
      else markedVoidTags.add(tag);
      closePendingTagMenu();
      renderTagCard();
    }, {
      title: isVoid ? "Stop treating this tag as a void rule candidate." : "Drop this tag from what gets saved, and add a Retroactive Void rule for it on Accept \u2014 so it's auto-stripped from future images too, not just this one."
    });
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
    return buildSynthDatPrompt(template, {
      unified: synthDatUnifiedPromptMode.checked,
      global: fieldValue(synthDatGlobal),
      rating: fieldValue(synthDatRating),
      character: fieldValue(synthDatCharacter),
      characterTrigger: fieldValue(synthDatCharacterTrigger),
      unifiedPrompt: fieldValue(synthDatUnifiedPrompt),
      hair: fieldValue(synthDatHair),
      face: fieldValue(synthDatFace),
      chest: fieldValue(synthDatChest),
      body: fieldValue(synthDatBody),
      clothes: fieldValue(synthDatClothes),
      limbs: fieldValue(synthDatLimbs),
      sexual: fieldValue(synthDatSexual),
      pose: fieldValue(synthDatPose),
      extra: fieldValue(synthDatExtra),
      effects: fieldValue(synthDatEffects),
      scene: fieldValue(synthDatScene),
      negative: fieldValue(synthDatNegative),
      diffModel: synthDatDiffModel.value,
      mainLora: synthDatMainLora.value,
      clip: synthDatClip.value,
      vae: synthDatVae.value,
      loraRows: loraRows.map((r) => ({ input: r.input.value, strength: r.strength.value })),
      noLoraStandIn: "None",
      skipRefImage: synthDatSkipRefImage.checked,
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
      width: synthDatWidth.value,
      height: synthDatHeight.value,
      seed1: synthDatSeed1.value,
      use2Pass: synthDatUse2Pass.checked,
      seed2: synthDatSeed2.value,
      denoise2: synthDatDenoise2.value,
      steps2: synthDatSteps2.value
    });
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
    const dirHandle = getDirHandle8();
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
    const dirHandle = getDirHandle8();
    if (!dirHandle) return null;
    try {
      if (disable) {
        const imgHandle2 = await dirHandle.getFileHandle(imgName, { create: true });
        await writeBytes(imgHandle2, bytes);
        const txtHandle2 = await dirHandle.getFileHandle(`${base}.txt`, { create: true });
        await writeBytes(txtHandle2, tags.map((t) => t.replace(/ /g, "_")).join(", "));
        const entry2 = await addEntryFromNewFile(base, imgHandle2, imgName, txtHandle2, true, tags, false);
        if (entry2) await moveEntry(entry2, true);
        return entry2;
      }
      const imgHandle = await dirHandle.getFileHandle(imgName, { create: true });
      await writeBytes(imgHandle, bytes);
      const txtHandle = await dirHandle.getFileHandle(`${base}.txt`, { create: true });
      await writeBytes(txtHandle, tags.map((t) => t.replace(/ /g, "_")).join(", "));
      const entry = await addEntryFromNewFile(base, imgHandle, imgName, txtHandle, true, tags, false);
      if (entry) markDirty(entry);
      return entry;
    } catch (err) {
      toastError("Could not save an image", err);
      return null;
    }
  }
  function otherPassBytes() {
    if (!pass1Bytes) return null;
    return previewBytes === pass1Bytes ? pass2Bytes : pass1Bytes;
  }
  async function acceptImage() {
    const dirHandle = getDirHandle8();
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
    const dirHandle = getDirHandle8();
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
    const dirHandle = getDirHandle8();
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
    getDirHandle8 = deps.getDirHandle;
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
    attachPickerModal(synthDatDiffModel, "Diffusion model", () => datalistOptions(synthDatUnetDatalist));
    attachPickerModal(synthDatClip, "CLIP / text encoder", () => datalistOptions(synthDatClipDatalist));
    attachPickerModal(synthDatVae, "VAE", () => datalistOptions(synthDatVaeDatalist));
    attachPickerModal(synthDatMainLora, "Main LoRA", () => datalistOptions(synthDatMainLoraDatalist));
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
  var getEntries6 = () => [];
  var getGalleryFilter = () => ({ base: "all", terms: [], mode: "OR", excludes: "", disabledView: false, originalsView: false, exactMatch: false });
  var getGallerySortMode = () => "filename";
  var getGallerySortDir = () => "asc";
  var resetSingleIndex2 = () => {
  };
  var renderCurrentViewRef3 = () => {
  };
  var refreshFilterModeUI = () => {
  };
  var isFilterModeLocked = () => false;
  var markTagReviewedRef = () => 0;
  var lastTagIndex = /* @__PURE__ */ new Map();
  var reviewFlaggedActive = false;
  var reviewedFlaggedTags = /* @__PURE__ */ new Set();
  function resetReviewFlagged() {
    reviewFlaggedActive = false;
    reviewedFlaggedTags = /* @__PURE__ */ new Set();
    btnReviewFlagged.classList.remove("active");
    tagFamilyListArea.classList.remove("review-mode");
  }
  function buildTagIndex() {
    const index = /* @__PURE__ */ new Map();
    for (const e of getEntries6()) {
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
  function renderFlaggedReviewList() {
    tagListTitle.textContent = "FLAGGED FOR REVIEW";
    const counts = /* @__PURE__ */ new Map();
    for (const e of getEntries6()) {
      const flagged = e.meta && e.meta.flaggedTags;
      if (!flagged) continue;
      for (const t of flagged) counts.set(t, (counts.get(t) || 0) + 1);
    }
    const tags = new Set(counts.keys());
    for (const t of reviewedFlaggedTags) tags.add(t);
    tagFrequencyList.innerHTML = "";
    if (tags.size === 0) {
      const empty = document.createElement("div");
      empty.className = "freq-empty";
      setIconLabel(empty, "No tags flagged for review. Use a tag chip's \u{1F6A9} menu to flag one.");
      tagFrequencyList.appendChild(empty);
      return;
    }
    const sorted = Array.from(tags).sort((a, b) => a.localeCompare(b));
    for (const tag of sorted) {
      const stillFlagged = counts.has(tag);
      const row = document.createElement("div");
      row.className = "freq-row review-flag-row" + (stillFlagged ? "" : " reviewed");
      const label = document.createElement("span");
      label.className = "review-flag-tag";
      label.textContent = tag;
      row.appendChild(label);
      const btn = document.createElement("button");
      btn.className = "review-done-btn";
      btn.textContent = "Reviewed";
      btn.title = stillFlagged ? "Unflag this tag from every image (undoable)" : "Already cleared \u2014 no image lists this tag anymore";
      btn.disabled = !stillFlagged;
      btn.addEventListener("click", () => {
        reviewedFlaggedTags.add(tag);
        const n = markTagReviewedRef(tag);
        if (n === 0) toast(`No loaded image still lists "${tag}" as flagged for review.`);
        refreshStats();
      });
      row.appendChild(btn);
      tagFrequencyList.appendChild(row);
    }
  }
  function renderTagFrequencyList(index) {
    if (reviewFlaggedActive) {
      renderFlaggedReviewList();
      return;
    }
    tagListTitle.textContent = "TAGS";
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
        empty.className = "freq-empty";
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
        setIconLabel(dragHandle, "\u2630");
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
    setJSON("dts-family-order", familyOrder);
  }
  (function loadFamilyOrder() {
    const saved = getJSON("dts-family-order", null);
    if (Array.isArray(saved)) familyOrder = saved;
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
    const entries = getEntries6();
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
    return sortEntries(getEntries6().filter(passesFilter));
  }
  function passesFilter(e) {
    const galleryFilter = getGalleryFilter();
    if (galleryFilter.originalsView) {
      if (!e.original) return false;
    } else if (galleryFilter.disabledView) {
      if (!e.disabled || e.original) return false;
    } else {
      if (e.disabled) return false;
      if (galleryFilter.base === "untagged" && e.tags.length !== 0) return false;
      if (galleryFilter.base === "dirty" && !e.dirty) return false;
    }
    if (galleryFilter.terms && galleryFilter.terms.length) {
      const tagMatches = galleryFilter.exactMatch ? (t, term) => t.toLowerCase() === term : (t, term) => t.toLowerCase().includes(term);
      const matchCount = galleryFilter.terms.filter((term) => e.tags.some((t) => tagMatches(t, term))).length;
      const mode = galleryFilter.mode || "OR";
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
    if (!isFilterModeLocked()) galleryFilter.mode = "OR";
    filterInput.value = value;
    hideFilterSuggestions();
    resetSingleIndex2();
    refreshFilterModeUI();
    renderCurrentViewRef3();
  }
  function setMirroredSelectionFilter(tags) {
    const galleryFilter = getGalleryFilter();
    const list = Array.from(tags);
    galleryFilter.terms = list.map((t) => t.toLowerCase());
    filterInput.value = list.join(", ");
    hideFilterSuggestions();
    resetSingleIndex2();
    refreshFilterModeUI();
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
    getEntries6 = deps.getEntries;
    getGalleryFilter = deps.getGalleryFilter;
    getGallerySortMode = deps.getGallerySortMode;
    getGallerySortDir = deps.getGallerySortDir;
    resetSingleIndex2 = deps.resetSingleIndex;
    renderCurrentViewRef3 = deps.renderCurrentView;
    refreshFilterModeUI = deps.refreshFilterModeUI;
    isFilterModeLocked = deps.isFilterModeLocked;
    markTagReviewedRef = deps.markTagReviewed;
    leftSortDirBtn.addEventListener("click", () => {
      leftSortDir = leftSortDir === "asc" ? "desc" : "asc";
      setIconLabel(leftSortDirBtn, leftSortDir === "asc" ? "\u25B2" : "\u25BC");
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
      setBool("dts-filter-exact-match", filterExactToggle.checked);
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
      on = getBool("dts-filter-exact-match");
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
      if (!isFilterModeLocked()) galleryFilter.mode = "OR";
      excludeBadge.style.display = "none";
      hideFilterSuggestions();
      refreshFilterModeUI();
      setBaseFilter("all");
    });
    btnReviewFlagged.addEventListener("click", () => {
      reviewFlaggedActive = !reviewFlaggedActive;
      btnReviewFlagged.classList.toggle("active", reviewFlaggedActive);
      tagFamilyListArea.classList.toggle("review-mode", reviewFlaggedActive);
      if (reviewFlaggedActive) reviewedFlaggedTags = /* @__PURE__ */ new Set();
      refreshStats();
    });
  }

  // src/renderer/tag-categories-data.ts
  var TAG_CATEGORY_ORDER = ["character", "body", "face", "clothes", "limbs", "sexual", "pose", "scene", "effects", "other"];
  var TAG_CATEGORY_SEEDS = {
    ";)": "face",
    ";<": "face",
    ";>": "face",
    ";3": "face",
    ";d": "face",
    ";o": "face",
    ";p": "face",
    ";q": "face",
    ". .": "face",
    "@ @": "face",
    "\\(^o^)/": "face",
    "\\||/": "limbs",
    "\\m/": "limbs",
    "\\n/": "limbs",
    "\\o/": "pose",
    "^ ^": "face",
    "^^^": "face",
    "^q^": "face",
    "^v^": "face",
    "+ -": "face",
    "+ +": "face",
    "<": "body",
    "<|> <|>": "face",
    "<o> <o>": "face",
    "= =": "face",
    "> @": "face",
    "> <": "face",
    ">3<": "face",
    ">o<": "face",
    "0 0": "face",
    "0w0": "face",
    "1 pound no fukuin": "pose",
    "1910s fashion": "clothes",
    "1920s (style)": "effects",
    "1920s fashion": "clothes",
    "1930s (style)": "effects",
    "1930s fashion": "clothes",
    "1940s (style)": "effects",
    "1940s fashion": "clothes",
    "1950s (style)": "effects",
    "1950s fashion": "clothes",
    "1960s (style)": "effects",
    "1960s fashion": "clothes",
    "1970s (style)": "effects",
    "1970s fashion": "clothes",
    "1980s (style)": "effects",
    "1980s fashion": "clothes",
    "1986 fifa world cup": "pose",
    "1990s (style)": "effects",
    "1990s fashion": "clothes",
    "1boy": "character",
    "1girl": "character",
    "1other": "character",
    "2000s (style)": "effects",
    "2002 fifa world cup": "pose",
    "2006 fifa world cup": "pose",
    "2006 winter olympics": "pose",
    "2009 world baseball classic": "pose",
    "2010 fifa world cup": "pose",
    "2010 winter olympics": "pose",
    "2010-2011 uefa champions' league": "pose",
    "2011 afc asian cup": "pose",
    "2011 copa america": "pose",
    "2011 fifa women's world cup": "pose",
    "2011 tohoku earthquake and tsunami": "scene",
    "2012 summer olympics": "pose",
    "2014 afc women's asian cup": "pose",
    "2014 fifa world cup": "pose",
    "2014 winter olympics": "pose",
    "2015 copa america": "pose",
    "2015 fifa women's world cup": "pose",
    "2015 rugby world cup": "pose",
    "2016 summer olympics": "pose",
    "2016 us election": "scene",
    "2017 taipei universiade": "pose",
    "2018 fifa world cup": "pose",
    "2018 winter olympics": "pose",
    "2019 rugby world cup": "pose",
    "2019-2020 hong kong protests": "scene",
    "2020 summer olympics": "pose",
    "2020 us election": "scene",
    "2021 copa america": "pose",
    "2022 fifa world cup": "pose",
    "2022 winter olympics": "pose",
    "2023 world baseball classic": "pose",
    "2024 attempted assassination of donald trump": "scene",
    "2024 copa america": "pose",
    "2024 crowdstrike incident": "scene",
    "2024 south korea martial law crisis": "scene",
    "2024 summer olympics": "pose",
    "2025 fifa club world cup": "pose",
    "2026 fifa world cup": "pose",
    "2026 iran war": "scene",
    "2026 united states strikes in venezuela": "scene",
    "2026 winter olympics": "pose",
    "2boys": "character",
    "2d dating": "pose",
    "2girls": "character",
    "2others": "character",
    "3 3": "face",
    "3boys": "character",
    "3d": "scene",
    "3d background": "scene",
    "3d glasses": "clothes",
    "3girls": "character",
    "3others": "character",
    "416 day": "scene",
    "4boys": "character",
    "4girls": "character",
    "4others": "character",
    "5boys": "character",
    "5girls": "character",
    "5koma": "scene",
    "5others": "character",
    "6 9": "face",
    "6+boys": "character",
    "6+girls": "character",
    "6+others": "character",
    "7-eleven": "scene",
    "7up": "scene",
    "9/11": "scene",
    "a flat chest is a status symbol": "body",
    "a world underneath": "scene",
    "a-pose": "pose",
    "a&w": "scene",
    "abs": "body",
    "absolutely everyone": "character",
    "abstract": "scene",
    "abstract background": "scene",
    "absurdly long hair": "body",
    "abu simbel": "scene",
    "aburaage": "scene",
    "abyaa face": "face",
    "ac milan": "pose",
    "accurate lolita coord": "clothes",
    "ace combat": "scene",
    "ace wo nerae!": "pose",
    "acf fiorentina": "pose",
    "acid graphics": "effects",
    "acubi": "clothes",
    "adapted costume": "effects",
    "adelaide football club": "pose",
    "adjusting another's hair": "limbs",
    "adjusting clothes": "sexual",
    "adjusting collar": "clothes",
    "adjusting eyewear": "limbs",
    "adjusting gloves": "clothes",
    "adjusting hair": "body",
    "adjusting headwear": "clothes",
    "adjusting legwear": "clothes",
    "adjusting mask": "clothes",
    "adjusting neck ribbon": "clothes",
    "adjusting neckerchief": "clothes",
    "adjusting necklace": "clothes",
    "adjusting necktie": "clothes",
    "adjusting scarf": "clothes",
    "adjusting swimsuit": "clothes",
    "adonis (flower)": "scene",
    "adrian helmet": "clothes",
    "adult baby": "sexual",
    "adversarial noise": "scene",
    "aegyo sal": "clothes",
    "aerial fireworks": "scene",
    "aerial root": "scene",
    "afc ajax": "pose",
    "affogato": "scene",
    "afghanistan": "scene",
    "african clothes": "clothes",
    "afro": "body",
    "afrofuturism": "effects",
    "after anal": "sexual",
    "after buttjob": "sexual",
    "after fellatio": "sexual",
    "after fingering": "sexual",
    "after footjob": "sexual",
    "after frottage": "sexual",
    "after insertion": "sexual",
    "after masturbation": "sexual",
    "after oral": "sexual",
    "after paizuri": "sexual",
    "after rape": "sexual",
    "after sex": "sexual",
    "after urethral": "sexual",
    "after vaginal": "sexual",
    "afterglow": "sexual",
    "afterimage": "scene",
    "against bed": "pose",
    "against chair": "pose",
    "against desk": "pose",
    "against door": "scene",
    "against tree": "scene",
    "agapanthus (flower)": "scene",
    "agave": "scene",
    "age comparison": "effects",
    "age progression": "effects",
    "aged down": "effects",
    "aged up": "effects",
    "agejo gyaru": "clothes",
    "ahegao": "sexual",
    "ahiru no sora": "pose",
    "ahoge": "body",
    "ai-generated": "scene",
    "ai-generated background": "scene",
    "aichi prefecture": "scene",
    "aiguillette": "clothes",
    "aiming": "pose",
    "aiming at viewer": "pose",
    "aincrad": "scene",
    "ainu clothes": "clothes",
    "air guitar": "limbs",
    "air quotes": "limbs",
    "airfield": "scene",
    "airplane arms": "pose",
    "airplane interior": "scene",
    "airport": "scene",
    "aisle": "scene",
    "ajirogasa": "clothes",
    "akakichi no eleven": "pose",
    "akanbe": "limbs",
    "akebia fruit": "scene",
    "akeome": "scene",
    "akita prefecture": "scene",
    "al-hilal sfc": "pose",
    "al-masjid al-nabawi": "scene",
    "alaska": "scene",
    "albino": "body",
    "albirex niigata": "pose",
    "album cover": "scene",
    "alcatraz": "scene",
    "alcohol": "scene",
    "alcohol burner": "scene",
    "algeria": "scene",
    "algorithm march": "pose",
    "aliasing": "scene",
    "alien mask": "clothes",
    "all fours": "pose",
    "all out!!": "pose",
    "alley": "scene",
    "allianz arena": "scene",
    "alligator mask": "clothes",
    "allium (flower)": "scene",
    "almond": "scene",
    "alsatian clothes": "clothes",
    "alstroemeria (flower)": "scene",
    "alternate ass size (larger)": "effects",
    "alternate body size": "effects",
    "alternate breast size": "body",
    "alternate breast size (larger)": "body",
    "alternate breast size (smaller)": "body",
    "alternate color": "effects",
    "alternate costume": "effects",
    "alternate element": "effects",
    "alternate eye color": "effects",
    "alternate eyewear": "clothes",
    "alternate hair color": "body",
    "alternate hair length (longer)": "effects",
    "alternate hair length (shorter)": "effects",
    "alternate hairstyle": "body",
    "alternate headwear": "effects",
    "alternate legwear": "clothes",
    "alternate mask": "clothes",
    "alternate skin color": "effects",
    "alternate species": "effects",
    "alternate universe": "effects",
    "alternate weapon": "effects",
    "alternate wing color": "body",
    "alternate wings": "body",
    "altyn helmet": "clothes",
    "amaryllis (flower)": "scene",
    "amazake (drink)": "scene",
    "amazigh clothes": "clothes",
    "amazon position": "sexual",
    "amekaji gyaru": "clothes",
    "american civil war": "scene",
    "american flag legwear": "clothes",
    "american football (object)": "pose",
    "american football (sport)": "pose",
    "american football helmet": "clothes",
    "american revolution": "scene",
    "amesuku gyaru": "clothes",
    "amigasa": "clothes",
    "amphitheater": "scene",
    "amputee": "sexual",
    "amulet": "clothes",
    "amusement park": "scene",
    "anachronism": "effects",
    "anaglyph": "scene",
    "anal": "sexual",
    "anal ball wear": "clothes",
    "anal beads": "sexual",
    "anal fingering": "sexual",
    "anal fisting": "sexual",
    "anal hair": "body",
    "anal hook": "sexual",
    "anal object insertion": "sexual",
    "anal tail": "sexual",
    "analogous colors": "effects",
    "anatomical nonsense": "scene",
    "anatomy": "sexual",
    "anchor choker": "clothes",
    "anchor hat ornament": "clothes",
    "anchor necklace": "clothes",
    "ancient egyptian clothes": "clothes",
    "ancient greek clothes": "clothes",
    "androgen": "sexual",
    "androgyne symbol": "sexual",
    "androgynous": "sexual",
    "anemone (flower)": "scene",
    "aneros": "sexual",
    "anfield (stadium)": "scene",
    "angel de la independencia": "scene",
    "angel food cake": "scene",
    "angel mort": "scene",
    "angel wings": "body",
    "angel's trumpet (flower)": "scene",
    "anger vein": "face",
    "angkor wat": "scene",
    "anglerfish dance": "pose",
    "angry": "face",
    "angry dog noises (meme)": "face",
    "anilingus": "sexual",
    "animal": "character",
    "animal around neck": "clothes",
    "animal background": "scene",
    "animal collar": "clothes",
    "animal costume": "clothes",
    "animal ear headphones": "face",
    "animal ear helmet": "clothes",
    "animal ear legwear": "clothes",
    "animal ears": "face",
    "animal focus": "character",
    "animal hat": "clothes",
    "animal insertion": "sexual",
    "animal nose": "face",
    "animal on shoulder": "clothes",
    "animal penis": "body",
    "animal pose": "pose",
    "animal print": "clothes",
    "animal pussy": "body",
    "animal slippers": "clothes",
    "animal-themed eyewear": "clothes",
    "animalization": "effects",
    "animated": "scene",
    "animated gif": "scene",
    "animated png": "scene",
    "anime coloring": "effects",
    "anime screenshot": "scene",
    "animegao": "clothes",
    "anise (spice)": "scene",
    "ankle boots": "clothes",
    "ankle garter": "clothes",
    "ankle lace-up": "clothes",
    "ankle socks": "clothes",
    "ankle strap": "clothes",
    "ankle wings": "body",
    "anklet": "clothes",
    "anman": "scene",
    "anmitsu (dessert)": "scene",
    "anna miller": "scene",
    "anniversary": "scene",
    "annoyed": "face",
    "anpan": "scene",
    "antenna hair": "body",
    "anthurium": "scene",
    "anti-eyebrow piercing": "face",
    "anus": "body",
    "anus cutout": "clothes",
    "anvil position": "sexual",
    "ao dai": "clothes",
    "aoki densetsu shoot!": "pose",
    "aomori prefecture": "scene",
    "apartment": "scene",
    "aphrodisiac": "sexual",
    "apollo chocolate": "scene",
    "apologizing": "pose",
    "apple": "scene",
    "apple core": "scene",
    "apple peel": "scene",
    "apple pie": "scene",
    "apple print": "clothes",
    "apple rabbit": "scene",
    "applying another's makeup": "clothes",
    "applying eyeliner": "clothes",
    "applying eyeshadow": "clothes",
    "applying lipgloss": "clothes",
    "applying lipstick": "clothes",
    "applying makeup": "pose",
    "applying manicure": "clothes",
    "applying mascara": "clothes",
    "applying own makeup": "clothes",
    "applying pedicure": "clothes",
    "applying rouge": "clothes",
    "apricot (fruit)": "scene",
    "april fools": "scene",
    "apron": "clothes",
    "apron grab": "sexual",
    "aqua ascot": "clothes",
    "aqua background": "scene",
    "aqua bowtie": "clothes",
    "aqua choker": "clothes",
    "aqua eyes": "face",
    "aqua eyeshadow": "clothes",
    "aqua gloves": "clothes",
    "aqua hair": "body",
    "aqua hat": "clothes",
    "aqua lips": "clothes",
    "aqua mask": "clothes",
    "aqua neckerchief": "clothes",
    "aqua necktie": "clothes",
    "aqua one-piece swimsuit": "clothes",
    "aqua pupils": "face",
    "aqua scarf": "clothes",
    "aqua skin": "body",
    "aqua sleeves": "clothes",
    "aqua theme": "effects",
    "aqua-framed eyewear": "clothes",
    "aqua-tinted eyewear": "clothes",
    "aquarium": "scene",
    "aquarius (drink)": "scene",
    "aqueduct": "scene",
    "aquiline nose": "face",
    "arabesque (pose)": "pose",
    "arabian clothes": "clothes",
    "arakawa (tokyo)": "scene",
    "aran legwear": "clothes",
    "aran sweater": "clothes",
    "arare (food)": "scene",
    "arc de triomphe": "scene",
    "arcade": "scene",
    "arched back": "pose",
    "arched bangs": "body",
    "arched soles": "body",
    "archer pose": "pose",
    "archery dojo": "scene",
    "archery shooting glove": "clothes",
    "architecture": "scene",
    "area 51": "scene",
    "area no kishi": "pose",
    "arena": "scene",
    "areola piercing": "body",
    "areola slip": "sexual",
    "areolae": "body",
    "argentina": "scene",
    "argyle": "clothes",
    "argyle background": "scene",
    "argyle bowtie": "clothes",
    "argyle choker": "clothes",
    "argyle scarf": "clothes",
    "aris dance (meme)": "pose",
    "arisaema (flower)": "scene",
    "aristocratic clothes": "clothes",
    "arizona (state)": "scene",
    "arizona cardinals": "pose",
    "arm around neck": "clothes",
    "arm around shoulder": "limbs",
    "arm at side": "pose",
    "arm behind back": "pose",
    "arm behind head": "pose",
    "arm belt": "clothes",
    "arm between breasts": "limbs",
    "arm cutout": "sexual",
    "arm garter": "clothes",
    "arm guards": "clothes",
    "arm hug": "pose",
    "arm on another's shoulder": "clothes",
    "arm out of frame": "scene",
    "arm out of sleeve": "clothes",
    "arm ribbon": "clothes",
    "arm sling": "body",
    "arm support": "pose",
    "arm up": "pose",
    "arm warmers": "clothes",
    "arm wrestling": "pose",
    "armband": "clothes",
    "armbinder": "clothes",
    "armenia": "scene",
    "armlet": "clothes",
    "armor": "clothes",
    "armored boots": "clothes",
    "armored dress": "clothes",
    "armored legwear": "clothes",
    "armory": "scene",
    "armpit cutout": "sexual",
    "armpit focus": "scene",
    "armpit sex": "sexual",
    "armpits": "sexual",
    "arms": "body",
    "arms around neck": "clothes",
    "arms at sides": "pose",
    "arms behind back": "pose",
    "arms behind head": "pose",
    "arms bound apart": "sexual",
    "arms up": "pose",
    "aroused": "face",
    "arrow through hair": "body",
    "arsenal fc": "pose",
    "arson": "scene",
    "art deco": "scene",
    "art gallery": "scene",
    "art nouveau": "scene",
    "artbook": "scene",
    "artemisia argyi": "scene",
    "artifacts": "scene",
    "artist glove": "clothes",
    "artistic error": "scene",
    "asa no ha (pattern)": "clothes",
    "ascot": "clothes",
    "ashita e attack!": "pose",
    "ashita no joe": "pose",
    "ashiyu": "scene",
    "asia league ice hockey": "pose",
    "asian indian clothes": "clothes",
    "asparagus": "scene",
    "asphyxiation": "sexual",
    "ass": "body",
    "ass ache": "body",
    "ass cutout": "sexual",
    "ass expansion": "body",
    "ass focus": "body",
    "ass on glass": "body",
    "ass onahole": "sexual",
    "ass ripple": "body",
    "ass shake": "body",
    "ass smack": "body",
    "ass visible through thighs": "body",
    "ass-to-ass": "pose",
    "ass-to-mouth": "face",
    "assassination of john f. kennedy": "scene",
    "assertive female": "sexual",
    "assisted rape": "sexual",
    "assless swimsuit": "clothes",
    "asteroid": "scene",
    "aston villa": "pose",
    "asymmetrical bangs": "body",
    "asymmetrical breasts": "body",
    "asymmetrical docking": "pose",
    "asymmetrical eyes": "face",
    "asymmetrical hair": "body",
    "asymmetrical mask": "clothes",
    "asymmetrical sidelocks": "body",
    "asymmetrical wings": "body",
    "atami (shizuoka)": "scene",
    "atlanta (city)": "scene",
    "atlanta braves": "pose",
    "atlanta falcons": "pose",
    "atlanta hawks": "pose",
    "atlas fc": "pose",
    "atmospheric perspective": "scene",
    "atomic bombings of hiroshima and nagasaki": "scene",
    "attack no 1": "pose",
    "attacker you!": "pose",
    "aurora": "effects",
    "australia": "pose",
    "australian football league": "pose",
    "australian rules football": "pose",
    "austria": "scene",
    "austria-hungary": "scene",
    "autocunnilingus": "sexual",
    "autofacial": "sexual",
    "autofellatio": "sexual",
    "automatic door": "scene",
    "autopaizuri": "sexual",
    "autumn": "scene",
    "averting eyes": "face",
    "avgn dancing dot mov (meme)": "pose",
    "aviator cap": "clothes",
    "aviator glasses": "clothes",
    "aviator goggles": "clothes",
    "aviator sunglasses": "clothes",
    "avispa fukuoka": "pose",
    "avocado": "scene",
    "awa odori tokushima": "pose",
    "awesome face": "face",
    "axolotl ears": "face",
    "ayaigasa": "clothes",
    "ayam hat": "clothes",
    "azalea (flower)": "scene",
    "azerbaijan": "scene",
    "aztec clothes": "clothes",
    "b. league": "pose",
    "ba tam": "clothes",
    "baby bottle": "scene",
    "baby carry": "pose",
    "baby steps": "pose",
    "baby's-breath": "scene",
    "babydoll": "clothes",
    "back": "body",
    "back cutout": "sexual",
    "back focus": "scene",
    "back-seamed legwear": "clothes",
    "back-to-back": "pose",
    "backboob": "sexual",
    "backjob": "sexual",
    "backless outfit": "sexual",
    "backless panties": "clothes",
    "backless pants": "clothes",
    "backlighting": "scene",
    "backstage": "scene",
    "backwards hat": "clothes",
    "bacon": "scene",
    "bacon-wrapped asparagus": "scene",
    "bad anatomy": "scene",
    "bad aspect ratio": "scene",
    "bad ass": "body",
    "bad feet": "body",
    "bad food": "scene",
    "bad hands": "scene",
    "bad proportions": "scene",
    "bad reflection": "scene",
    "badge": "clothes",
    "badminton": "pose",
    "badminton racket": "pose",
    "bag": "clothes",
    "bagel": "scene",
    "bagged fish": "scene",
    "baghdad": "scene",
    "bagna cauda": "scene",
    "bags under eyes": "face",
    "baguette": "scene",
    "bahrain": "scene",
    "bai clothes": "clothes",
    "bakery": "scene",
    "baking": "pose",
    "baking sheet": "scene",
    "baku (azerbaijan)": "scene",
    "balaclava": "clothes",
    "balancing": "pose",
    "bald": "body",
    "bald female": "body",
    "balding": "body",
    "ball": "pose",
    "ball bra": "clothes",
    "ball busting": "sexual",
    "ball gag": "sexual",
    "ballet": "pose",
    "ballet class clothes": "clothes",
    "ballet slippers": "clothes",
    "balletcore": "clothes",
    "ballroom": "scene",
    "baltimore orioles": "pose",
    "baltimore ravens": "pose",
    "bamboo": "scene",
    "bamboo forest": "scene",
    "bamboo shoot": "scene",
    "bamboo steamer": "scene",
    "banana": "scene",
    "banana boat": "scene",
    "banana cream pie": "scene",
    "banana peel": "scene",
    "banana popsicle": "scene",
    "banana slice": "scene",
    "banana split": "scene",
    "band uniform": "clothes",
    "bandage on face": "body",
    "bandage on nose": "face",
    "bandage over one eye": "face",
    "bandaged hand": "clothes",
    "bandages": "clothes",
    "bandaid": "clothes",
    "bandaid on arm": "body",
    "bandaid on cheek": "body",
    "bandaid on ear": "body",
    "bandaid on face": "body",
    "bandaid on forehead": "body",
    "bandaid on hand": "clothes",
    "bandaid on knee": "body",
    "bandaid on leg": "body",
    "bandaid on nose": "face",
    "bandaid on pussy": "body",
    "bandana": "clothes",
    "bandana around neck": "clothes",
    "bandana over mouth": "clothes",
    "bandeau": "clothes",
    "bandolier": "clothes",
    "bangladesh": "scene",
    "bangladeshi clothes": "clothes",
    "bangle": "clothes",
    "bangs pinned back": "body",
    "bank of china tower": "scene",
    "banoffee pie": "scene",
    "bantu knots": "body",
    "baobab": "scene",
    "bar (place)": "scene",
    "bara": "sexual",
    "barbecue": "scene",
    "barcelona": "scene",
    "barcelona sc": "pose",
    "bare arms": "sexual",
    "bare back": "sexual",
    "bare legs": "sexual",
    "bare shoulders": "sexual",
    "bare tree": "scene",
    "barefoot": "sexual",
    "barefoot sandals (jewelry)": "clothes",
    "barista": "scene",
    "barley tea": "scene",
    "barn": "scene",
    "bartender": "scene",
    "baseball (sport)": "pose",
    "baseball bat": "pose",
    "baseball cap": "pose",
    "baseball helmet": "clothes",
    "baseball jersey": "pose",
    "baseball mitt": "clothes",
    "baseball stadium": "scene",
    "baseball uniform": "pose",
    "bashlik": "clothes",
    "basil leaf": "scene",
    "basilisk time": "pose",
    "basket": "scene",
    "basketball (sport)": "pose",
    "basketball uniform": "pose",
    "basquash!": "pose",
    "bastille day": "scene",
    "bat ears": "face",
    "bat legwear": "clothes",
    "bat mask": "clothes",
    "bat print": "clothes",
    "bat wings": "body",
    "bath": "scene",
    "bathing": "pose",
    "bathrobe": "clothes",
    "bathroom": "scene",
    "bathtub": "scene",
    "batter": "scene",
    "battle": "pose",
    "battle athletes": "pose",
    "battle of arnhem": "scene",
    "battle of beda fomm": "scene",
    "battle of berlin": "scene",
    "battle of britain": "scene",
    "battle of caen": "scene",
    "battle of carentan": "scene",
    "battle of dien bien phu": "scene",
    "battle of france": "scene",
    "battle of hamburger hill": "scene",
    "battle of jutland": "scene",
    "battle of kursk": "scene",
    "battle of leyte gulf": "scene",
    "battle of midway": "scene",
    "battle of mogadishu": "scene",
    "battle of nijmegen": "scene",
    "battle of okinawa": "scene",
    "battle of peleliu": "scene",
    "battle of remagen": "scene",
    "battle of santa cruz": "scene",
    "battle of sekigahara": "scene",
    "battle of sicily": "scene",
    "battle of stalingrad": "scene",
    "battle of the bulge": "scene",
    "battle of the coral sea": "scene",
    "battle of the dnieper": "scene",
    "battle of the java sea": "scene",
    "battle of the kerch peninsula": "scene",
    "battle of the philippine sea": "scene",
    "battlefield": "scene",
    "battleship": "scene",
    "battoujutsu stance": "pose",
    "baumkuchen": "scene",
    "bavarois": "scene",
    "bayer 04 leverkusen": "pose",
    "bdsm": "sexual",
    "beach": "clothes",
    "beach volleyball": "pose",
    "beachball": "pose",
    "bead choker": "clothes",
    "bead necklace": "clothes",
    "beads": "clothes",
    "beanie": "clothes",
    "beans": "scene",
    "bear band legwear": "clothes",
    "bear costume": "clothes",
    "bear ear headphones": "face",
    "bear ears": "face",
    "bear hat": "clothes",
    "bear mask": "clothes",
    "bear position": "pose",
    "bear print": "clothes",
    "beard": "body",
    "bearded girl": "body",
    "bearskin cap": "clothes",
    "beatnik": "clothes",
    "beauty mask": "clothes",
    "beckoning": "limbs",
    "bedroom": "scene",
    "bedwetting": "pose",
    "beehive hairdo": "body",
    "beer": "scene",
    "beer mug": "scene",
    "before feminization": "sexual",
    "begging": "pose",
    "begonia (flower)": "scene",
    "behind bars": "sexual",
    "beijing": "scene",
    "belarus": "scene",
    "belarusian clothes": "clothes",
    "belgium": "scene",
    "bell": "clothes",
    "bell choker": "clothes",
    "bell pepper": "scene",
    "bell pepper plant": "scene",
    "bell pepper slice": "scene",
    "bell sleeves": "clothes",
    "bell tower": "scene",
    "bell-bottoms": "clothes",
    "bellflower": "scene",
    "belly": "body",
    "belly chain": "clothes",
    "belly dancing": "pose",
    "belly-to-belly": "pose",
    "belt": "clothes",
    "belt bra": "body",
    "belt charm": "clothes",
    "belt collar": "clothes",
    "ben-day dots": "scene",
    "bendy straw": "scene",
    "bent back": "pose",
    "bent over": "sexual",
    "bento": "scene",
    "beret": "clothes",
    "berlaymont building": "scene",
    "berlin": "scene",
    "berlin wall": "scene",
    "berliner fernsehturm": "scene",
    "berry": "scene",
    "bespectacled": "clothes",
    "bestiality": "sexual",
    "between breasts": "body",
    "between fingers": "limbs",
    "between toes": "limbs",
    "bib collar": "clothes",
    "biceps": "body",
    "bicorne": "clothes",
    "bicycle helmet": "clothes",
    "big belly": "sexual",
    "big eyes": "face",
    "big hair": "body",
    "bike shorts": "clothes",
    "biker clothes": "clothes",
    "bikesuit": "clothes",
    "bikini": "clothes",
    "bikini armor": "clothes",
    "bikini bottom aside": "sexual",
    "bikini bottom only": "clothes",
    "bikini bottom pull": "clothes",
    "bikini briefs": "clothes",
    "bikini day": "scene",
    "bikini pull": "sexual",
    "bikini skirt": "clothes",
    "bikini top lift": "clothes",
    "bikini top only": "clothes",
    "bikini top pull": "clothes",
    "billiard ball": "pose",
    "billiard table": "pose",
    "billiards": "pose",
    "bimbofication": "sexual",
    "bindi": "clothes",
    "biopunk": "effects",
    "birch tree": "scene",
    "bird mask": "clothes",
    "bird of paradise flower": "scene",
    "bird on shoulder": "clothes",
    "bird print": "clothes",
    "bird wings": "body",
    "birdie the early bird": "scene",
    "birthday": "scene",
    "birthday cake": "scene",
    "birthday party": "scene",
    "biscuit (bread)": "scene",
    "bisexual": "sexual",
    "bisexual female": "sexual",
    "bisexual male": "sexual",
    "bishounen": "sexual",
    "bit gag": "sexual",
    "bitchsuit": "sexual",
    "biting": "pose",
    "biting another's finger": "pose",
    "biting another's hand": "pose",
    "biting another's tail": "pose",
    "biting ass": "pose",
    "biting breast": "pose",
    "biting cheek": "pose",
    "biting ear": "pose",
    "biting foreskin": "pose",
    "biting glove": "pose",
    "biting hair": "body",
    "biting head": "pose",
    "biting neck": "clothes",
    "biting nipple": "body",
    "biting own finger": "pose",
    "biting own lip": "pose",
    "biting own tail": "pose",
    "biting own thumb": "pose",
    "biting penis": "pose",
    "bitten apple": "scene",
    "bitter melon": "scene",
    "black ascot": "clothes",
    "black background": "scene",
    "black bowtie": "clothes",
    "black choker": "clothes",
    "black eyes": "face",
    "black eyeshadow": "clothes",
    "black fire": "scene",
    "black forest cake": "scene",
    "black gloves": "clothes",
    "black hair": "body",
    "black hat": "clothes",
    "black lips": "clothes",
    "black lotus": "scene",
    "black mask": "clothes",
    "black neckerchief": "clothes",
    "black necktie": "clothes",
    "black one-piece swimsuit": "clothes",
    "black scarf": "clothes",
    "black sclera": "face",
    "black skin": "body",
    "black sleeves": "clothes",
    "black spaghetti": "scene",
    "black star burger": "scene",
    "black tea": "scene",
    "black theme": "effects",
    "black wings": "body",
    "black-eyed susan": "scene",
    "black-framed eyewear": "clothes",
    "blackberry (fruit)": "scene",
    "blake's lotaburger": "scene",
    "blank eyes": "face",
    "blazer": "clothes",
    "bleed through": "scene",
    "bleeding": "pose",
    "bleeding heart (flower)": "scene",
    "blending": "scene",
    "blind": "face",
    "blindfold": "sexual",
    "bling": "clothes",
    "blingee": "effects",
    "blinking": "pose",
    "blocking": "pose",
    "blonde hair": "body",
    "blood": "body",
    "blood in hair": "body",
    "blood on bandages": "body",
    "blood on gloves": "clothes",
    "blood on mask": "clothes",
    "blood sucking": "pose",
    "blood tofu": "scene",
    "bloodshot eyes": "face",
    "bloody wings": "body",
    "bloom": "scene",
    "bloomers": "clothes",
    "bloomers on head": "clothes",
    "blouse": "clothes",
    "blowing": "pose",
    "blowing bubble gum": "pose",
    "blowing bubbles": "pose",
    "blowtorch": "scene",
    "blue ascot": "clothes",
    "blue background": "scene",
    "blue bowtie": "clothes",
    "blue cheese": "scene",
    "blue choker": "clothes",
    "blue eyes": "face",
    "blue eyeshadow": "clothes",
    "blue fire": "scene",
    "blue gloves": "clothes",
    "blue hair": "body",
    "blue hat": "clothes",
    "blue hawaii": "scene",
    "blue lips": "clothes",
    "blue mask": "clothes",
    "blue neckerchief": "clothes",
    "blue necktie": "clothes",
    "blue nose": "face",
    "blue one-piece swimsuit": "clothes",
    "blue pupils": "face",
    "blue scarf": "clothes",
    "blue sclera": "face",
    "blue skin": "body",
    "blue sleeves": "clothes",
    "blue theme": "effects",
    "blue wings": "body",
    "blue-framed eyewear": "clothes",
    "blue-tinted eyewear": "clothes",
    "bluebell (flower)": "scene",
    "blueberry": "scene",
    "blueberry blossoms": "scene",
    "blueberry print": "clothes",
    "blueberry tart": "scene",
    "blunt bangs": "body",
    "blunt ends": "body",
    "blurry": "scene",
    "blurry background": "scene",
    "blush": "face",
    "blush stickers": "face",
    "boar costume": "clothes",
    "boar mask": "clothes",
    "boat": "scene",
    "boater hat": "clothes",
    "bob cut": "body",
    "bobby socks": "clothes",
    "body blush": "body",
    "body bridge": "pose",
    "body fur": "body",
    "body horror": "clothes",
    "body jewelry": "clothes",
    "body roll": "pose",
    "body soaping": "pose",
    "body writing": "sexual",
    "bodycon": "clothes",
    "bodystocking": "clothes",
    "bodysuit": "clothes",
    "boho-chic": "clothes",
    "bok choy": "scene",
    "bokeh": "scene",
    "bolivia": "scene",
    "bolo tie": "clothes",
    "bologna fc 1909": "pose",
    "bondage": "sexual",
    "bondage mask": "clothes",
    "bondage mittens": "clothes",
    "bondage outfit": "sexual",
    "bone mask": "clothes",
    "bone print": "clothes",
    "bone-shaped pupils": "face",
    "boned meat": "scene",
    "bonnet": "clothes",
    "bonsai": "scene",
    "book focus": "scene",
    "book on head": "clothes",
    "bookstore": "scene",
    "boonie hat": "clothes",
    "boots": "clothes",
    "border": "scene",
    "borderless panels": "scene",
    "bored": "face",
    "borobudur temple": "scene",
    "borussia dortmund": "pose",
    "boshin war": "scene",
    "bosnia and herzegovina": "scene",
    "boston": "scene",
    "boston bruins": "pose",
    "boston celtics": "pose",
    "boston red sox": "pose",
    "bottle": "scene",
    "bottomless": "sexual",
    "bougainvillea (flower)": "scene",
    "boukun habanero": "scene",
    "bouncing": "pose",
    "bouncing ass": "body",
    "bouncing breasts": "pose",
    "bound arms": "sexual",
    "bound breasts": "sexual",
    "bound calves": "sexual",
    "bound elbows": "sexual",
    "bound feet": "sexual",
    "bound fingers": "sexual",
    "bound knees": "sexual",
    "bound legs": "sexual",
    "bound penis": "sexual",
    "bound tail": "sexual",
    "bound thighs": "sexual",
    "bound toes": "sexual",
    "bound together": "sexual",
    "bound torso": "sexual",
    "bound wrists": "sexual",
    "bouquet": "scene",
    "boutonniere": "clothes",
    "bow": "clothes",
    "bow background": "scene",
    "bow choker": "clothes",
    "bow legwear": "clothes",
    "bow necklace": "clothes",
    "bow on wing": "body",
    "bow shimada": "body",
    "bow swimsuit": "clothes",
    "bow-shaped hair": "body",
    "bowed wings": "body",
    "bowing": "limbs",
    "bowl": "scene",
    "bowl cut": "body",
    "bowl hat": "clothes",
    "bowlegged pose": "pose",
    "bowler hat": "clothes",
    "bowling": "pose",
    "bowling alley": "scene",
    "bowling ball": "pose",
    "bowling glove": "pose",
    "bowling pin": "pose",
    "bowtie": "clothes",
    "box braids": "body",
    "box of chocolates": "scene",
    "box tie": "sexual",
    "boxer briefs": "clothes",
    "boxers": "clothes",
    "boxing": "pose",
    "boxing gloves": "clothes",
    "boxing ring": "scene",
    "boy on top": "sexual",
    "boykisser": "sexual",
    "boymoder": "sexual",
    "boyshort panties": "clothes",
    "bra": "clothes",
    "bra lift": "sexual",
    "bra on head": "clothes",
    "bra pull": "sexual",
    "bracelet": "clothes",
    "bracer": "clothes",
    "bradley center": "scene",
    "braided bangs": "body",
    "braided bun": "body",
    "braided dreadlocks": "body",
    "braided hair rings": "body",
    "braided ponytail": "body",
    "braiding hair": "body",
    "bramall lane": "scene",
    "branch": "scene",
    "branded": "sexual",
    "brandenburg gate": "scene",
    "branding iron": "sexual",
    "bras d'honneur": "pose",
    "brazen bull": "sexual",
    "brazier": "scene",
    "brazil": "pose",
    "brazil dog dance (meme)": "pose",
    "bread": "scene",
    "bread bun": "scene",
    "bread crust": "scene",
    "bread eating race": "scene",
    "bread slice": "scene",
    "breadfruit": "scene",
    "break shot": "pose",
    "breakdance": "pose",
    "breakfast": "scene",
    "breaking": "pose",
    "breaking pasta": "scene",
    "breast awe": "face",
    "breast bondage": "sexual",
    "breast clinging": "pose",
    "breast conscious": "body",
    "breast contest": "body",
    "breast crush": "body",
    "breast cutouts": "clothes",
    "breast envy": "body",
    "breast expansion": "sexual",
    "breast focus": "scene",
    "breast implants": "body",
    "breast lift": "limbs",
    "breast milk in container": "body",
    "breast mousepad": "body",
    "breast padding": "pose",
    "breast pillow": "body",
    "breast press": "body",
    "breast pull": "body",
    "breast pump": "sexual",
    "breast punch": "body",
    "breast reduction": "body",
    "breast rest": "body",
    "breast size switch": "body",
    "breast slip": "sexual",
    "breast smother": "sexual",
    "breast sucking": "sexual",
    "breast suppress": "limbs",
    "breast torture": "sexual",
    "breast-to-pectoral docking": "body",
    "breastfeeding": "sexual",
    "breastless clothes": "sexual",
    "breasts": "body",
    "breasts apart": "body",
    "breasts day": "scene",
    "breasts on glass": "body",
    "breasts on head": "body",
    "breasts on table": "body",
    "breasts out": "sexual",
    "breasts squeezed together": "limbs",
    "breathing (animated)": "pose",
    "breathing fire": "scene",
    "brentford fc": "pose",
    "brick oven": "scene",
    "bridal gauntlets": "clothes",
    "bridal legwear": "clothes",
    "bridge": "scene",
    "briefs": "clothes",
    "bright background": "scene",
    "brighton & hove albion fc": "pose",
    "broad shoulders": "clothes",
    "broccoli": "scene",
    "brodie helmet": "clothes",
    "broken egg": "scene",
    "broken eyewear": "clothes",
    "broken mask": "clothes",
    "bromide": "scene",
    "bronze parrot": "scene",
    "bronzer": "clothes",
    "brooch": "clothes",
    "brooklyn bridge": "scene",
    "brooklyn nets": "pose",
    "broom riding": "pose",
    "broom surfing": "pose",
    "brown ascot": "clothes",
    "brown background": "scene",
    "brown bowtie": "clothes",
    "brown choker": "clothes",
    "brown eyes": "face",
    "brown gloves": "clothes",
    "brown hair": "body",
    "brown hat": "clothes",
    "brown mask": "clothes",
    "brown neckerchief": "clothes",
    "brown necktie": "clothes",
    "brown one-piece swimsuit": "clothes",
    "brown pupils": "face",
    "brown scarf": "clothes",
    "brown sleeves": "clothes",
    "brown theme": "effects",
    "brown wings": "body",
    "brown-framed eyewear": "clothes",
    "brown-tinted eyewear": "clothes",
    "brownie (food)": "scene",
    "bruise": "sexual",
    "bruised eye": "face",
    "brushing another's hair": "body",
    "brushing hair": "pose",
    "brushing own hair": "body",
    "bubble": "scene",
    "bubble background": "scene",
    "bubble skirt": "clothes",
    "bubble tea": "scene",
    "bubble tea challenge": "body",
    "bucket hat": "clothes",
    "bucket on head": "clothes",
    "buckingham palace": "scene",
    "buckle": "clothes",
    "budenovka": "clothes",
    "budget sarashi": "clothes",
    "budweiser": "scene",
    "buffalo bills": "pose",
    "buffalo sabres": "pose",
    "bugles (food)": "scene",
    "building": "pose",
    "building sex": "sexual",
    "bukkake": "sexual",
    "bulgaria": "scene",
    "bulgarian clothes": "clothes",
    "bulge": "body",
    "bulges touching": "sexual",
    "bulging eyes": "face",
    "bullfighting": "pose",
    "bullying": "pose",
    "bumping": "pose",
    "bun cover": "body",
    "bun with braided base": "body",
    "bunching hair": "body",
    "bundesliga": "pose",
    "bundt cake": "scene",
    "bunker": "scene",
    "bunkyo (tokyo)": "scene",
    "bunny day": "scene",
    "bunsen burner": "scene",
    "burdock root": "scene",
    "burger": "scene",
    "burger king": "scene",
    "buri hamachi": "pose",
    "burj al arab": "scene",
    "burj khalifa": "scene",
    "burkina faso": "scene",
    "burlesque": "clothes",
    "burn scar": "sexual",
    "burning": "pose",
    "burning building": "scene",
    "burning photo": "scene",
    "burnt": "sexual",
    "burnt hair": "body",
    "bursting breasts": "body",
    "buruma": "clothes",
    "buruma aside": "sexual",
    "buruma pull": "sexual",
    "bus interior": "scene",
    "bus stop": "scene",
    "bush": "scene",
    "business suit": "clothes",
    "bust chart": "body",
    "bust cup": "sexual",
    "bust measuring": "pose",
    "bustier": "clothes",
    "bustle": "clothes",
    "butler": "scene",
    "butt crack": "body",
    "butt plug": "sexual",
    "butter": "scene",
    "butter knife": "scene",
    "buttercup (flower)": "scene",
    "butterfly": "scene",
    "butterfly background": "scene",
    "butterfly hat ornament": "clothes",
    "butterfly mask": "clothes",
    "butterfly print": "clothes",
    "butterfly ring": "clothes",
    "butterfly sitting": "pose",
    "butterfly vibrator": "sexual",
    "butterfly wings": "body",
    "butterfly-shaped pupils": "face",
    "buttjob": "sexual",
    "button badge": "clothes",
    "button eyes": "face",
    "buttoned cuffs": "clothes",
    "buttons": "clothes",
    "buzz cut": "body",
    "byakugan": "face",
    "byzantine clothes": "clothes",
    "byzantine empire": "scene",
    "c.c. lemon": "scene",
    "cabbage": "scene",
    "cacao fruit": "scene",
    "cactus": "scene",
    "cadbury": "scene",
    "caesar (drink)": "scene",
    "cafe": "scene",
    "cafe au lait": "scene",
    "cafeteria": "scene",
    "cage": "sexual",
    "cage interior": "sexual",
    "caipirinha (meme)": "pose",
    "caipirinha dears dance (meme)": "pose",
    "cake": "scene",
    "cake batter": "scene",
    "cake pan": "scene",
    "cake pop": "scene",
    "cake stand": "scene",
    "calendar (medium)": "scene",
    "calflet": "clothes",
    "calgary flames": "pose",
    "california": "scene",
    "calla lily": "scene",
    "calpis": "scene",
    "cambodia": "scene",
    "camellia": "scene",
    "camellia print": "clothes",
    "cameltoe": "body",
    "cameo (jewelry)": "clothes",
    "cameroon": "scene",
    "camisole": "clothes",
    "camouflage": "clothes",
    "camouflage headwear": "clothes",
    "camouflage legwear": "clothes",
    "camouflage scarf": "clothes",
    "camp nou": "scene",
    "campaign hat": "clothes",
    "campfire": "scene",
    "camping": "pose",
    "can": "scene",
    "can't choose your own family": "scene",
    "canada": "scene",
    "canada day": "scene",
    "canadian football league": "pose",
    "canal": "scene",
    "cancan dance": "pose",
    "candle": "scene",
    "candlelight": "effects",
    "candy": "scene",
    "candy apple": "scene",
    "candy cane": "scene",
    "candy cigarette": "scene",
    "candy store": "scene",
    "cane": "clothes",
    "canele": "scene",
    "canna lily": "scene",
    "canned coffee": "scene",
    "canned fish": "scene",
    "canned food": "scene",
    "canned tea": "scene",
    "cannibalism": "scene",
    "cannoli": "scene",
    "cantaloupe": "scene",
    "canton tower": "scene",
    "canyon": "scene",
    "cape": "clothes",
    "cape lift": "sexual",
    "capelet": "clothes",
    "cappuccino": "scene",
    "capri pants": "clothes",
    "captain tsubasa": "pose",
    "car interior": "scene",
    "caramel": "scene",
    "caramelldansen (meme)": "pose",
    "card (medium)": "scene",
    "card background": "scene",
    "card between breasts": "body",
    "cardigan": "clothes",
    "cardigan vest": "clothes",
    "caressing testicles": "sexual",
    "cargo skirt": "clothes",
    "carl's jr.": "scene",
    "carnation": "scene",
    "carnival mask": "clothes",
    "carnivorous plant": "scene",
    "carolina hurricanes": "pose",
    "carolina panthers": "pose",
    "carousel": "scene",
    "carried breast rest": "pose",
    "carrot": "scene",
    "carrot cake": "scene",
    "carrot necklace": "clothes",
    "carrot slice": "scene",
    "carrot sticks": "scene",
    "carry me": "limbs",
    "carrying": "pose",
    "carrying over shoulder": "pose",
    "carrying under arm": "pose",
    "carson shearer's dance (meme)": "pose",
    "carving": "pose",
    "cashew": "scene",
    "casino": "scene",
    "cassock": "clothes",
    "castella (food)": "scene",
    "castle": "scene",
    "casual": "clothes",
    "casual one-piece swimsuit": "clothes",
    "cat breakdancing (meme)": "pose",
    "cat cafe": "scene",
    "cat costume": "clothes",
    "cat day": "scene",
    "cat ear headphones": "face",
    "cat ear legwear": "clothes",
    "cat ears": "face",
    "cat eye-framed eyewear": "clothes",
    "cat hat": "clothes",
    "cat mask": "clothes",
    "cat on shoulder": "clothes",
    "cat paws": "clothes",
    "cat-shaped pupils": "face",
    "catcher's mask": "clothes",
    "catching": "pose",
    "catharanthus (flower)": "scene",
    "cathedral": "scene",
    "cathedral of santa eulalia": "scene",
    "catheter": "sexual",
    "cattail": "scene",
    "caught": "sexual",
    "cauldron": "scene",
    "cauliflower": "scene",
    "caustics": "scene",
    "cavalier hat": "clothes",
    "cave": "scene",
    "cave paintings": "effects",
    "caviar": "scene",
    "cbt": "sexual",
    "ccc threesome": "sexual",
    "ceara sc": "pose",
    "cectarine": "scene",
    "ceiling light": "effects",
    "cellphone strap": "clothes",
    "celtic fc": "pose",
    "censored": "scene",
    "center opening": "sexual",
    "center-flap bangs": "body",
    "century egg (food)": "scene",
    "cephalopod eyes": "face",
    "cerastium": "scene",
    "cereal": "scene",
    "cerezo osaka": "pose",
    "cervical penetration": "sexual",
    "cervix": "body",
    "cf monterrey": "pose",
    "chads dancing to california gurls (meme)": "pose",
    "chain": "sexual",
    "chain necklace": "clothes",
    "chain of perversion": "scene",
    "chained": "sexual",
    "chamomile": "scene",
    "chamomile tea": "scene",
    "champagne": "scene",
    "champagne coupe": "scene",
    "champagne flute": "scene",
    "chanchanko (clothes)": "clothes",
    "chandelier": "effects",
    "chang'e": "scene",
    "changing room": "scene",
    "changmingsuo": "clothes",
    "changpao": "clothes",
    "chaps": "clothes",
    "character chart": "scene",
    "character counter request": "character",
    "character doll": "effects",
    "character hat ornament": "clothes",
    "character mask": "clothes",
    "character single": "scene",
    "character-themed food": "scene",
    "charcoal": "scene",
    "charizard pose": "pose",
    "charlotte bobcats": "pose",
    "charlotte cake": "scene",
    "charlotte hornets": "pose",
    "charm (object)": "clothes",
    "chart": "scene",
    "chasenmage": "body",
    "chasing": "pose",
    "chastity belt": "sexual",
    "chastity bra": "sexual",
    "chastity cage": "sexual",
    "chatelaine": "clothes",
    "che vuoi? (italian gesture)": "limbs",
    "cheating (relationship)": "sexual",
    "checkerboard cookie": "scene",
    "checkered": "clothes",
    "checkered ascot": "clothes",
    "checkered background": "scene",
    "checkered bikini": "clothes",
    "checkered bowtie": "clothes",
    "checkered headwear": "clothes",
    "checkered legwear": "clothes",
    "checkered mask": "clothes",
    "checkered neckerchief": "clothes",
    "checkered sleeves": "clothes",
    "checkers and rally's": "scene",
    "cheek pinching": "limbs",
    "cheek poking": "limbs",
    "cheek squash": "limbs",
    "cheek-to-breast": "pose",
    "cheek-to-cheek": "pose",
    "cheering": "pose",
    "cheerleader": "clothes",
    "cheese": "scene",
    "cheese curls": "scene",
    "cheese fries": "scene",
    "cheese puffs": "scene",
    "cheese wheel": "scene",
    "cheese-kun": "scene",
    "cheesecake": "scene",
    "cheesestick": "scene",
    "cheetos": "scene",
    "chef": "scene",
    "chef hat": "clothes",
    "chelsea fc": "pose",
    "chemise": "clothes",
    "chernobyl": "scene",
    "cherry": "scene",
    "cherry background": "scene",
    "cherry blossom chiffon cake": "scene",
    "cherry blossom print": "clothes",
    "cherry blossoms": "scene",
    "cherry pie": "scene",
    "cherry print": "clothes",
    "cherry tomato": "scene",
    "chest binder": "sexual",
    "chest harness": "clothes",
    "chest sarashi": "clothes",
    "chest stand": "pose",
    "chest stand handstand": "pose",
    "chestnut": "scene",
    "chestnut mouth": "face",
    "chewing": "pose",
    "chewing gum": "scene",
    "chiaroscuro": "scene",
    "chiba (city)": "scene",
    "chiba lotte marines": "pose",
    "chiba prefecture": "scene",
    "chibi inset": "scene",
    "chicago": "scene",
    "chicago bears": "pose",
    "chicago blackhawks": "pose",
    "chicago bulls": "pose",
    "chicago cubs": "pose",
    "chicago fire": "pose",
    "chicago white sox": "pose",
    "chicken (food)": "scene",
    "chicken feet (food)": "scene",
    "chicken leg": "scene",
    "chicken mask": "clothes",
    "chicken nuggets": "scene",
    "chicken wing": "scene",
    "chicory (flower)": "scene",
    "chiffon cake": "scene",
    "chikan": "sexual",
    "chikuwa": "scene",
    "child carry": "pose",
    "child's drawing": "pose",
    "chile": "pose",
    "chilean clothes": "clothes",
    "chili dog": "scene",
    "chili pepper": "scene",
    "china": "scene",
    "chinese civil war": "scene",
    "chinese clothes": "clothes",
    "chinese empire": "scene",
    "chinese food": "scene",
    "chinese knot": "clothes",
    "chinese lantern (plant)": "scene",
    "chinese new year": "scene",
    "chinese spoon": "scene",
    "chinstrap": "clothes",
    "chipi chipi chapa chapa (meme)": "pose",
    "chips (food)": "scene",
    "chireiden": "scene",
    "chitose ame": "scene",
    "chiyoda (tokyo)": "scene",
    "choco fashion": "scene",
    "choco girl": "clothes",
    "choco monaka jumbo": "scene",
    "choco pie": "scene",
    "chocolate": "scene",
    "chocolate almond": "scene",
    "chocolate banana": "scene",
    "chocolate bar": "scene",
    "chocolate bread": "scene",
    "chocolate cake": "scene",
    "chocolate chip": "scene",
    "chocolate chip cookie": "scene",
    "chocolate clothes": "scene",
    "chocolate coin": "scene",
    "chocolate cornet": "scene",
    "chocolate curls": "scene",
    "chocolate donut": "scene",
    "chocolate egg": "scene",
    "chocolate fondue": "scene",
    "chocolate fountain": "scene",
    "chocolate framboise": "scene",
    "chocolate hair": "body",
    "chocolate icing": "scene",
    "chocolate making": "pose",
    "chocolate marquise": "scene",
    "chocolate milk": "scene",
    "chocolate on body": "scene",
    "chocolate on breasts": "body",
    "chocolate pie": "scene",
    "chocolate rabbit": "scene",
    "chocolate strawberry": "scene",
    "chocolate syrup": "scene",
    "chocolate tart": "scene",
    "chocolate truffle": "scene",
    "chokecherry": "scene",
    "choker": "clothes",
    "choking on object": "pose",
    "chonmage": "body",
    "choo choo train": "pose",
    "chopped spring onion": "scene",
    "choppy bangs": "body",
    "chopstick rest": "scene",
    "chopsticks": "scene",
    "christ the redeemer": "scene",
    "christmas": "scene",
    "christmas cake": "scene",
    "christmas tree": "scene",
    "chromatic aberration": "scene",
    "chrysanthemum": "scene",
    "chrysanthemum print": "clothes",
    "chrysler building": "scene",
    "chubu centrair international airport": "scene",
    "chunichi dragons": "pose",
    "chuo (tokyo)": "scene",
    "chupa chups": "scene",
    "church": "scene",
    "church of the savior on blood": "scene",
    "churro": "scene",
    "chuseok": "scene",
    "cigarette holder": "clothes",
    "cincinnati bengals": "pose",
    "cincinnati reds": "pose",
    "cinco de mayo": "scene",
    "cinderella bust": "body",
    "cingulum militare": "clothes",
    "cinnamon roll": "scene",
    "cinnamon stick": "scene",
    "circle dance": "pose",
    "circle formation": "pose",
    "circle hands": "limbs",
    "circlet": "clothes",
    "cirno day": "scene",
    "city": "scene",
    "cityscape": "scene",
    "clamp": "sexual",
    "clamps": "sexual",
    "clapping": "pose",
    "classic lolita": "clothes",
    "classroom": "scene",
    "claw hair clip": "clothes",
    "claw pose": "limbs",
    "claw ring": "clothes",
    "cleaning": "pose",
    "cleaning eyewear": "clothes",
    "cleavage": "sexual",
    "cleavage cutout": "sexual",
    "cleave gag": "sexual",
    "cleaver": "scene",
    "cleft of venus": "body",
    "clematis (flower)": "scene",
    "clenched hand": "limbs",
    "clenched hands": "limbs",
    "clenched teeth": "face",
    "cleveland cavaliers": "pose",
    "cliff": "scene",
    "climbing": "pose",
    "cling": "pose",
    "clipping toenails": "clothes",
    "clitoral penetration": "sexual",
    "clitoral piercing": "body",
    "clitoral suction vibrator": "sexual",
    "clitoris": "body",
    "clitoris clamp": "sexual",
    "clitoris leash": "sexual",
    "clitoris pull": "body",
    "clitoris pump": "sexual",
    "clitoris ring": "body",
    "clitoris slip": "sexual",
    "clitoris torture": "sexual",
    "clitoris tweak": "body",
    "clitoroplasty": "sexual",
    "clivia": "scene",
    "cloaca": "body",
    "cloak": "clothes",
    "cloche hat": "clothes",
    "clock eyes": "face",
    "clock tower": "scene",
    "clone": "character",
    "close-up": "scene",
    "closed eyes": "face",
    "closet": "scene",
    "closing door": "scene",
    "cloth glansjob": "sexual",
    "clothed after sex": "sexual",
    "clothed female nude female": "sexual",
    "clothed female nude male": "sexual",
    "clothed male nude female": "sexual",
    "clothed male nude male": "sexual",
    "clothed sex": "sexual",
    "clothes down": "sexual",
    "clothes focus": "effects",
    "clothes gag": "clothes",
    "clothes grab": "sexual",
    "clothes in front": "limbs",
    "clothes on and off": "sexual",
    "clothes shop": "scene",
    "clothing aside": "sexual",
    "clothing cutout": "clothes",
    "cloud": "scene",
    "cloud background": "scene",
    "cloud focus": "scene",
    "cloud hair": "body",
    "clove": "scene",
    "clover": "scene",
    "clover (flower)": "scene",
    "clover print": "clothes",
    "clover-shaped pupils": "face",
    "clown mask": "clothes",
    "clown nose": "face",
    "club america": "pose",
    "club atletico boca juniors": "pose",
    "club atletico de madrid": "pose",
    "club atletico penarol": "pose",
    "club atletico river plate": "pose",
    "club atletico tucuman": "pose",
    "club deportivo guadalajara": "pose",
    "club leon": "pose",
    "club olimpia": "pose",
    "club penguin dance (meme)": "pose",
    "club universidad de chile": "pose",
    "clubroom": "scene",
    "cn tower": "scene",
    "coal": "scene",
    "coat": "clothes",
    "coca-cola": "scene",
    "cock ring": "sexual",
    "cocked eyebrow": "face",
    "cockpit": "scene",
    "cockscomb (flower)": "scene",
    "cocktail": "scene",
    "cocktail flower": "scene",
    "cocktail glass": "scene",
    "cocktail umbrella": "scene",
    "coconut": "scene",
    "coconut tree": "scene",
    "code geass": "body",
    "coffee": "scene",
    "coffee beans": "scene",
    "coffee blossom": "scene",
    "coffee grinder": "scene",
    "coffee mug": "scene",
    "coffee pot": "scene",
    "coffee press": "scene",
    "coif": "clothes",
    "coin bangs": "body",
    "coke-bottle glasses": "clothes",
    "cola shake (meme)": "pose",
    "cold war": "scene",
    "collage": "scene",
    "collage background": "scene",
    "collar": "sexual",
    "collar chain (jewelry)": "clothes",
    "collar grab": "sexual",
    "collar tips (jewelry)": "clothes",
    "collar tug": "sexual",
    "collarbone": "clothes",
    "collared cape": "clothes",
    "collared capelet": "clothes",
    "collared coat": "clothes",
    "collared crop top": "clothes",
    "collared dress": "clothes",
    "collared leotard": "clothes",
    "collared shirt": "clothes",
    "collared shrug": "clothes",
    "collared vest": "clothes",
    "colo colo": "pose",
    "cologne cathedral": "scene",
    "colombia": "scene",
    "colombian clothes": "clothes",
    "colonel sanders": "scene",
    "color connection": "effects",
    "color coordination": "effects",
    "color drain": "face",
    "color guide": "effects",
    "color switch": "effects",
    "color trace": "effects",
    "color-coded": "effects",
    "colorado": "scene",
    "colorado avalanche": "pose",
    "colorado rockies": "pose",
    "colored bangs": "body",
    "colored extremities": "limbs",
    "colored eyelashes": "clothes",
    "colored inner hair": "body",
    "colored lineart": "effects",
    "colored nipples": "body",
    "colored pussy": "body",
    "colored shadow": "effects",
    "colored skin": "body",
    "colored stripes": "clothes",
    "colored tips": "body",
    "colorful": "effects",
    "colorful background": "scene",
    "colosseum": "scene",
    "columbine (flower)": "scene",
    "columbus crew": "pose",
    "column lineup": "scene",
    "comb": "body",
    "comb over": "body",
    "comforting": "pose",
    "compact (cosmetics)": "clothes",
    "compensated molestation": "sexual",
    "competition swimsuit": "clothes",
    "complementary colors": "effects",
    "completely nude": "sexual",
    "compound eyes": "face",
    "compressed breasts": "body",
    "compression shirt": "clothes",
    "compression sleeve": "clothes",
    "concentrating": "pose",
    "condensed milk": "scene",
    "condiment packet": "scene",
    "condom": "sexual",
    "condom in mouth": "face",
    "condom left inside": "sexual",
    "cone hair bun": "body",
    "confederate states of america": "scene",
    "confident": "face",
    "confused": "face",
    "congratulations": "scene",
    "conjoined": "sexual",
    "consadole sapporo": "pose",
    "consensual tentacles": "sexual",
    "conservatory": "scene",
    "constellation print": "clothes",
    "constricted pupils": "face",
    "construction site": "scene",
    "contact lens": "clothes",
    "contemporary": "effects",
    "contemporary traditional clothes": "clothes",
    "contrapposto": "pose",
    "contrast collar": "clothes",
    "control tower": "scene",
    "convenience store": "scene",
    "convenient breasts": "body",
    "convenient hair": "body",
    "convention": "scene",
    "converse": "clothes",
    "conveyor belt sushi": "scene",
    "cookie": "scene",
    "cookie cutter": "scene",
    "cooking": "pose",
    "cooking oil": "scene",
    "cool colors": "effects",
    "cooling tower": "scene",
    "coolish": "scene",
    "cooperative breast smother": "sexual",
    "cooperative fellatio": "sexual",
    "cooperative footjob": "sexual",
    "cooperative handjob": "sexual",
    "cooperative naizuri": "body",
    "cooperative paizuri": "sexual",
    "cooperative pussyjob": "sexual",
    "coors field": "scene",
    "copa america": "pose",
    "copa america centenario": "pose",
    "corn": "scene",
    "corn dog": "scene",
    "cornflower": "scene",
    "cornrows": "body",
    "coronavirus pandemic": "scene",
    "corrupted file": "scene",
    "corrupted twitter file": "scene",
    "corsage": "clothes",
    "corset": "clothes",
    "corsica": "scene",
    "cosmetics": "clothes",
    "cosmic brownies": "scene",
    "cosmos (flower)": "scene",
    "cosplay": "clothes",
    "cossack dance": "pose",
    "costa rica": "scene",
    "costume combination": "effects",
    "costume switch": "effects",
    "cote d'ivoire": "scene",
    "cotton candy": "scene",
    "coughing": "pose",
    "coughing flowers": "scene",
    "country lolita": "clothes",
    "country ma'am": "scene",
    "courtroom": "scene",
    "cover": "scene",
    "cover page": "scene",
    "covered face": "clothes",
    "covered navel": "body",
    "covered nipples": "body",
    "covered penetration": "sexual",
    "covered penis": "body",
    "covered testicles": "body",
    "covering anus": "sexual",
    "covering ass": "sexual",
    "covering breasts": "sexual",
    "covering crotch": "sexual",
    "covering face": "sexual",
    "covering head": "sexual",
    "covering nipples": "limbs",
    "covering one eye": "sexual",
    "covering own ears": "sexual",
    "covering own eyes": "sexual",
    "covering own mouth": "sexual",
    "covering privates": "sexual",
    "cow costume": "clothes",
    "cow ears": "face",
    "cow mask": "clothes",
    "cow print": "clothes",
    "cow print gloves": "clothes",
    "cowboy boots": "clothes",
    "cowboy hat": "clothes",
    "cowboy shot": "scene",
    "cowboy western": "clothes",
    "cowering": "pose",
    "cowgirl position": "sexual",
    "cpr": "body",
    "cr flamengo": "pose",
    "cr vasco da gama": "pose",
    "crab": "scene",
    "crack of light": "effects",
    "cracked mask": "clothes",
    "cracker": "scene",
    "craspedia (flower)": "scene",
    "crawling": "pose",
    "crazy": "face",
    "crazy eyes": "face",
    "crazy smile": "face",
    "crazy straw": "scene",
    "cream": "scene",
    "cream cheese": "scene",
    "cream cornet": "scene",
    "cream on body": "scene",
    "cream puff": "scene",
    "crease": "scene",
    "creature": "character",
    "creature as food": "scene",
    "creature focus": "effects",
    "creature on shoulder": "clothes",
    "cremation": "scene",
    "creme egg": "scene",
    "crepe": "scene",
    "crepe cake": "scene",
    "crescent choker": "clothes",
    "crescent hat ornament": "clothes",
    "crescent necklace": "clothes",
    "crescent print": "clothes",
    "crescent-shaped pupils": "face",
    "crested hair": "body",
    "crew cut": "body",
    "crew neck": "clothes",
    "crimean war": "scene",
    "crinoline": "clothes",
    "criss-cross back-straps": "clothes",
    "criss-cross halter": "clothes",
    "criss-cross straps": "clothes",
    "croatia": "scene",
    "croatian clothes": "clothes",
    "crocs": "clothes",
    "crocus (flower)": "scene",
    "croissant": "scene",
    "crooked eyewear": "clothes",
    "crop top": "clothes",
    "cropped arms": "scene",
    "cropped head": "scene",
    "cropped jacket": "clothes",
    "cropped legs": "scene",
    "cropped shoulders": "scene",
    "cropped torso": "scene",
    "croquembouche": "scene",
    "croquet": "pose",
    "croquette": "scene",
    "cross background": "scene",
    "cross choker": "clothes",
    "cross game": "pose",
    "cross manage": "pose",
    "cross necklace": "clothes",
    "cross print": "clothes",
    "cross tie": "clothes",
    "cross-eyed": "face",
    "cross-laced footwear": "clothes",
    "cross-laced gloves": "clothes",
    "cross-laced legwear": "clothes",
    "cross-laced sandals": "clothes",
    "cross-laced shoes": "clothes",
    "cross-laced sleeves": "clothes",
    "cross-laced slit": "clothes",
    "cross-section": "sexual",
    "cross-shaped pupils": "face",
    "crossdressing": "sexual",
    "crossdressing (ftm)": "sexual",
    "crossdressing (mtf)": "sexual",
    "crossdressing under clothes (mtf)": "sexual",
    "crossed ankles": "pose",
    "crossed arms": "pose",
    "crossed bangs": "body",
    "crossed fingers": "limbs",
    "crossed legs": "pose",
    "crosshair pupils": "face",
    "crosshatching": "scene",
    "crossover": "character",
    "crosswalk": "scene",
    "crotch cutout": "sexual",
    "crotch focus": "effects",
    "crotch grab": "sexual",
    "crotch rope": "sexual",
    "crotch rub": "sexual",
    "crotchless": "clothes",
    "crotchless bloomers": "clothes",
    "crotchless buruma": "clothes",
    "crotchless leotard": "clothes",
    "crotchless panties": "clothes",
    "crotchless pants": "clothes",
    "crotchless pantyhose": "clothes",
    "crotchless swimsuit": "clothes",
    "crow mask": "clothes",
    "crowd": "character",
    "crown": "clothes",
    "crown braid": "body",
    "crown-shaped pupils": "face",
    "crucifixion": "pose",
    "crumbs": "scene",
    "crushing": "pose",
    "cruz azul": "pose",
    "crying": "pose",
    "crypto.com arena": "scene",
    "crystal hair": "body",
    "crystal wings": "body",
    "cuba": "scene",
    "cubicle": "scene",
    "cubism": "effects",
    "cucumber": "scene",
    "cuddling": "pose",
    "cuddling handjob": "sexual",
    "cue stick": "pose",
    "cuff links": "clothes",
    "cuffs": "sexual",
    "cuffs-to-collar": "sexual",
    "cultural revolution": "scene",
    "culver's": "scene",
    "cum": "sexual",
    "cum bath": "sexual",
    "cum in ass": "sexual",
    "cum in clothes": "sexual",
    "cum in cup": "sexual",
    "cum in mouth": "sexual",
    "cum in navel": "sexual",
    "cum in pussy": "sexual",
    "cum in throat": "sexual",
    "cum in urethra": "sexual",
    "cum inflation": "sexual",
    "cum on armpits": "sexual",
    "cum on ass": "sexual",
    "cum on back": "sexual",
    "cum on body": "sexual",
    "cum on breasts": "sexual",
    "cum on chest": "sexual",
    "cum on clothes": "sexual",
    "cum on eyewear": "sexual",
    "cum on feet": "sexual",
    "cum on fingers": "sexual",
    "cum on food": "sexual",
    "cum on hair": "sexual",
    "cum on mask": "clothes",
    "cum on pectorals": "sexual",
    "cum on pussy": "sexual",
    "cum on stomach": "sexual",
    "cum on tongue": "sexual",
    "cum pool": "sexual",
    "cum swap": "sexual",
    "cumdrip": "sexual",
    "cumdump": "sexual",
    "cummerbund": "clothes",
    "cunnilingus": "sexual",
    "cunnilingus gesture": "limbs",
    "cunt busting": "body",
    "cuntboy": "sexual",
    "cuntboy with cuntboy": "sexual",
    "cuntboy with female": "sexual",
    "cuntboy with male": "sexual",
    "cup": "scene",
    "cupcake": "scene",
    "cupless bikini": "clothes",
    "cupless bra": "clothes",
    "cupping": "pose",
    "cupping glass": "scene",
    "cupping hands": "limbs",
    "curled fingers": "limbs",
    "curling": "pose",
    "curling iron": "body",
    "curly eyebrows": "face",
    "curly hair": "body",
    "currant": "scene",
    "curry": "scene",
    "curry rice": "scene",
    "currywurst": "scene",
    "curtained hair": "body",
    "curtsey": "limbs",
    "curvy": "sexual",
    "custard": "scene",
    "custard apple": "scene",
    "cut-in": "scene",
    "cutoff jeans": "clothes",
    "cuts": "body",
    "cutting": "pose",
    "cutting another's hair": "body",
    "cutting board": "scene",
    "cutting hair": "body",
    "cutting own hair": "body",
    "cyber fashion": "clothes",
    "cyber sigilism": "effects",
    "cybergoth": "clothes",
    "cyberlox": "body",
    "cyberpunk": "effects",
    "cyclamen": "scene",
    "cymbidium": "scene",
    "cyprus": "scene",
    "czech clothes": "clothes",
    "czech republic": "scene",
    "czechoslovakia": "scene",
    "d-day": "scene",
    "dab (dance)": "pose",
    "daffodil": "scene",
    "dahlia": "scene",
    "dai clothes": "clothes",
    "daifuku": "scene",
    "daikon": "scene",
    "dairy queen": "scene",
    "daisy (flower)": "scene",
    "daisy chain (sex)": "sexual",
    "daiya no ace": "pose",
    "dakimakura (medium)": "character",
    "dalachi (headdress)": "clothes",
    "dallas cowboys": "pose",
    "dallas mavericks": "pose",
    "dam": "scene",
    "dance robot dance (vocaloid)": "pose",
    "dance studio": "scene",
    "dancing": "pose",
    "dancing arona (meme)": "pose",
    "dancing kasukabe tsumugi (meme)": "pose",
    "dancing pallbearers (meme)": "pose",
    "dancing toothless (meme)": "pose",
    "dandelion": "scene",
    "dandelion coffee": "scene",
    "dango": "scene",
    "danish clothes": "clothes",
    "danyaji": "body",
    "dao fu": "scene",
    "dappled moonlight": "effects",
    "dappled sunlight": "effects",
    "darjeeling tea": "scene",
    "dark": "effects",
    "dark areolae": "body",
    "dark background": "scene",
    "dark chocolate": "scene",
    "dark labia": "body",
    "dark nipples": "body",
    "dark persona": "effects",
    "dark skin": "body",
    "dark-skinned female": "body",
    "dark-skinned male": "body",
    "darkness": "effects",
    "dash kappei": "pose",
    "dashed eyes": "face",
    "date (fruit)": "scene",
    "date pun": "scene",
    "daten route": "pose",
    "dating": "pose",
    "dawn": "effects",
    "day": "effects",
    "dayflower": "scene",
    "dazzle paint": "clothes",
    "ddd threesome": "sexual",
    "de'ang clothes": "clothes",
    "decantering": "pose",
    "decensored": "scene",
    "decoden": "clothes",
    "decora": "clothes",
    "decorating baked goods": "pose",
    "deel": "clothes",
    "deep penetration": "sexual",
    "deep wound": "body",
    "deepthroat": "sexual",
    "deer ears": "face",
    "deerstalker": "clothes",
    "default fortnite dance (meme)": "pose",
    "defloration": "sexual",
    "dekopon (fruit)": "scene",
    "demon wings": "body",
    "denim shorts": "clothes",
    "denmark": "pose",
    "denver": "scene",
    "denver broncos": "pose",
    "denver nuggets": "pose",
    "depressed": "face",
    "depth of field": "scene",
    "derivative work": "scene",
    "desert": "scene",
    "desk lamp": "effects",
    "despair": "face",
    "dessert": "scene",
    "detached collar": "clothes",
    "detached leggings": "clothes",
    "detached pants": "clothes",
    "detached sleeves": "clothes",
    "detached wings": "body",
    "determined": "face",
    "detexted": "scene",
    "detroit": "scene",
    "detroit lions": "pose",
    "detroit pistons": "pose",
    "detroit red wings": "pose",
    "deviruchi hat": "clothes",
    "dia de muertos": "scene",
    "diadem": "clothes",
    "diagonal bangs": "body",
    "diagonal stripes": "clothes",
    "diagonal-striped background": "scene",
    "diagonal-striped legwear": "clothes",
    "diagonal-striped neckerchief": "clothes",
    "diagram": "scene",
    "diamond mouth": "face",
    "diamond-shaped pupils": "face",
    "dianthus": "scene",
    "dianzi": "clothes",
    "diaper": "sexual",
    "diaper changing": "pose",
    "dice necklace": "clothes",
    "dieselpunk": "effects",
    "diffraction spikes": "scene",
    "digging": "pose",
    "digimon focus": "effects",
    "digitigrade": "body",
    "dilated pupils": "face",
    "dildo": "sexual",
    "dildo gag": "sexual",
    "dildo harness": "sexual",
    "dildo riding": "sexual",
    "dildo under mask": "sexual",
    "dildo under panties": "sexual",
    "dim lighting": "effects",
    "dim sum": "scene",
    "dimples of venus": "body",
    "diner": "scene",
    "dining room": "scene",
    "dinner": "scene",
    "dio brando's pose": "pose",
    "diorama": "scene",
    "dip (dance move)": "pose",
    "dirndl": "clothes",
    "dirt road": "scene",
    "dirty feet": "body",
    "dirty legwear": "clothes",
    "dirty mask": "clothes",
    "dirty talk": "sexual",
    "disappointed": "face",
    "disdain": "face",
    "disembodied hand": "character",
    "disembodied penis": "body",
    "disgust": "face",
    "dishes": "scene",
    "dishwashing": "pose",
    "dismemberment": "sexual",
    "dispersion (optics)": "effects",
    "disposable coffee cup": "scene",
    "disproportionate retribution": "scene",
    "dissolving": "pose",
    "distortion": "scene",
    "distraction dance": "pose",
    "distress": "face",
    "distress hand signal": "limbs",
    "dithered background": "scene",
    "dithering": "scene",
    "dive": "pose",
    "divine spirit mausoleum": "scene",
    "diving": "pose",
    "diving helmet": "clothes",
    "diving mask": "clothes",
    "diving mask on head": "clothes",
    "diving mask removed": "clothes",
    "diving suit": "clothes",
    "dixie cup hat": "clothes",
    "dock": "scene",
    "doctor": "body",
    "dodgeball (sport)": "pose",
    "dodger stadium": "scene",
    "dodging": "pose",
    "doe-foot applicator": "clothes",
    "dog costume": "clothes",
    "dog ears": "face",
    "dog hat": "clothes",
    "dog mask": "clothes",
    "dog on shoulder": "clothes",
    "dog penis": "body",
    "dog pussy": "body",
    "dog tags": "clothes",
    "doggystyle": "sexual",
    "dogtooth violet (flower)": "scene",
    "dogwood (flower)": "scene",
    "dojikko pose": "limbs",
    "doll": "character",
    "doll joints": "clothes",
    "dolphin hat ornament": "clothes",
    "dolphin penis": "body",
    "dolphin shorts": "clothes",
    "dome of the rock": "scene",
    "dominator (bdsm)": "sexual",
    "dominatrix": "sexual",
    "dominican republic": "scene",
    "domino mask": "clothes",
    "domino's pizza": "scene",
    "donald duck sailor hat": "clothes",
    "donbei dance": "pose",
    "dondurma (ice cream)": "scene",
    "doner kebab": "scene",
    "dongpo jin (headwear)": "clothes",
    "donut": "scene",
    "donut day": "scene",
    "donut hair bun": "body",
    "doolittle raid": "scene",
    "door": "scene",
    "door knocker": "scene",
    "doorbell": "scene",
    "doorway": "scene",
    "doosan bears": "pose",
    "dorayaki": "scene",
    "dorfic": "effects",
    "doritos": "scene",
    "dorsiflexion": "pose",
    "dot mouth": "face",
    "dot nose": "face",
    "dotera (clothes)": "clothes",
    "dotted background": "scene",
    "double \\m/": "limbs",
    "double \\n/": "limbs",
    "double amputee": "sexual",
    "double anal": "sexual",
    "double bun": "body",
    "double dildo": "sexual",
    "double exposure": "scene",
    "double finger gun": "limbs",
    "double fisting": "sexual",
    "double footjob": "sexual",
    "double handjob": "sexual",
    "double happiness": "clothes",
    "double l": "limbs",
    "double luo ji": "body",
    "double luo ji corners toward head": "body",
    "double number four (asl)": "limbs",
    "double penetration": "sexual",
    "double thumbs down": "limbs",
    "double thumbs up": "limbs",
    "double v": "limbs",
    "double vaginal": "sexual",
    "double vertical stripe": "clothes",
    "double-breasted": "clothes",
    "double-parted bangs": "body",
    "double-stroke eyebrows": "face",
    "dough": "scene",
    "dough scraper": "scene",
    "doujin cover": "scene",
    "dovefucking": "body",
    "downblouse": "sexual",
    "downpants": "sexual",
    "downscaled": "scene",
    "doyagao": "face",
    "dr pepper": "scene",
    "dragging": "pose",
    "dragon ball": "scene",
    "dragon boat": "scene",
    "dragon boat festival": "scene",
    "dragon dance": "scene",
    "dragon dildo": "sexual",
    "dragon fruit": "scene",
    "dragon mask": "clothes",
    "dragon wings": "body",
    "dragonfly wings": "body",
    "dragoon helmet": "clothes",
    "drama layer": "scene",
    "drawing (action)": "pose",
    "drawing (object)": "pose",
    "drawing on another's face": "pose",
    "drawn eyes": "face",
    "drawn wings": "body",
    "dreadlocks": "body",
    "dreaming": "pose",
    "dress": "clothes",
    "dress aside": "sexual",
    "dress flower": "clothes",
    "dress lift": "sexual",
    "dress pull": "sexual",
    "dress shirt": "clothes",
    "dress shoes": "clothes",
    "dress swimsuit": "clothes",
    "dress tug": "sexual",
    "dressing": "pose",
    "dressing room": "clothes",
    "dried jujube": "scene",
    "drill hair": "body",
    "drill sidelocks": "body",
    "drink": "scene",
    "drinking": "pose",
    "drinking glass": "scene",
    "drinking pee": "sexual",
    "drinking straw": "scene",
    "dripping": "pose",
    "driving": "pose",
    "drooling": "pose",
    "drop shadow": "scene",
    "dropping": "pose",
    "drowning": "pose",
    "drugs": "body",
    "drunk": "face",
    "dry humping": "pose",
    "drydock": "scene",
    "drying": "pose",
    "dual persona": "character",
    "dual wielding": "pose",
    "dubai": "scene",
    "dublin": "scene",
    "duck (food)": "scene",
    "duck mask": "clothes",
    "duffel coat": "clothes",
    "dumpling": "scene",
    "dunce cap": "clothes",
    "dungeon": "sexual",
    "dunhuang dance": "pose",
    "dunhuang style": "clothes",
    "dunkirk evacuation": "scene",
    "duplicate": "scene",
    "dusk": "effects",
    "dust plug": "clothes",
    "dusty miller": "scene",
    "dutch angle": "scene",
    "dutch clothes": "clothes",
    "dvd cover": "scene",
    "dx": "face",
    "dying": "pose",
    "e-kid fashion": "clothes",
    "ear chain": "clothes",
    "ear cleaning": "pose",
    "ear covers": "clothes",
    "ear cuffs": "clothes",
    "ear focus": "body",
    "ear ornament": "clothes",
    "ear piercing": "face",
    "ear protection": "face",
    "ear sex": "sexual",
    "ear wiggle": "face",
    "earclip": "clothes",
    "earflap beanie": "clothes",
    "earl grey tea": "scene",
    "earmuffs": "clothes",
    "earphones": "clothes",
    "earpiece": "clothes",
    "earrings": "clothes",
    "ears down": "face",
    "ears through headwear": "face",
    "ears under headwear": "face",
    "east asian architecture": "scene",
    "east germany": "scene",
    "easter": "scene",
    "easter egg": "scene",
    "easter island": "scene",
    "easy breezy": "pose",
    "easytoon (medium)": "scene",
    "eating": "pose",
    "eating and drinking from body": "sexual",
    "eating during class": "scene",
    "eating hair": "body",
    "eating non-food": "scene",
    "eavesdropping": "pose",
    "ec bahia": "pose",
    "ec vitoria": "pose",
    "eclair (food)": "scene",
    "ecstasy": "face",
    "ecuador": "pose",
    "edelweiss (flower)": "scene",
    "edinburgh (city)": "scene",
    "edmonton oilers": "pose",
    "edo jidai": "scene",
    "edwardian": "clothes",
    "eel": "scene",
    "egasumi": "clothes",
    "egg (food)": "scene",
    "egg carton": "scene",
    "egg laying": "pose",
    "egg tart": "scene",
    "egg vibrator": "sexual",
    "egg yolk": "scene",
    "eggnog": "scene",
    "eggplant": "scene",
    "eggshell": "scene",
    "eggshell hat": "clothes",
    "egypt": "scene",
    "ehime prefecture": "scene",
    "eientei": "scene",
    "eiffel tower": "scene",
    "eintracht frankfurt": "pose",
    "ejaculating while penetrated": "sexual",
    "ejaculation": "sexual",
    "el castillo": "scene",
    "el salvador": "scene",
    "elbow gloves": "clothes",
    "elbow sleeve": "clothes",
    "elbowing": "sexual",
    "electric eyes": "face",
    "electrocution": "sexual",
    "elizabeth tower": "scene",
    "elizabethan": "clothes",
    "embarrassed": "face",
    "embers": "effects",
    "emo art": "effects",
    "emo fashion": "clothes",
    "empanada": "scene",
    "emphasis lines": "scene",
    "empire state building": "scene",
    "empty eyes": "sexual",
    "en pointe": "body",
    "enema": "sexual",
    "energy hair": "body",
    "energy wings": "body",
    "england": "scene",
    "english breakfast": "scene",
    "enmaided": "effects",
    "enoki mushroom": "scene",
    "envy": "face",
    "epaulettes": "clothes",
    "epiphyllum": "scene",
    "erect clitoris": "sexual",
    "erection": "body",
    "erection under clothes": "body",
    "essex face": "face",
    "estadio santiago bernabeu": "scene",
    "estonia": "scene",
    "estonian clothes": "clothes",
    "estrogen": "sexual",
    "ethiopia": "scene",
    "euro 2008": "pose",
    "euro 2012": "pose",
    "euro 2016": "pose",
    "euro 2020": "pose",
    "euro 2024": "pose",
    "eustoma": "scene",
    "evening": "effects",
    "everton fc": "pose",
    "everyone": "character",
    "evian": "scene",
    "evil grin": "face",
    "evil smile": "face",
    "excalibur face": "face",
    "excited": "face",
    "exhausted": "face",
    "exhibitionism": "sexual",
    "exif thumbnail surprise": "scene",
    "exploded cosmetics": "clothes",
    "explosion": "scene",
    "exposed teeth": "body",
    "expression 35": "face",
    "expression chart": "face",
    "expressionless": "face",
    "expressive hair": "body",
    "expressive wings": "body",
    "extra arms": "sexual",
    "extra breasts": "sexual",
    "extra digits": "scene",
    "extra ears": "face",
    "extra eyes": "face",
    "extra hands": "limbs",
    "extra penises": "sexual",
    "extra pupils": "face",
    "eye beam": "face",
    "eye color switch": "effects",
    "eye contact": "pose",
    "eye focus": "face",
    "eye mask": "clothes",
    "eye poke": "face",
    "eye pop": "face",
    "eye reflection": "face",
    "eye sex": "sexual",
    "eye trail": "face",
    "eyeball": "face",
    "eyebrow cut": "face",
    "eyebrow piercing": "face",
    "eyebrow razor": "face",
    "eyebrow stubble": "face",
    "eyebrows": "face",
    "eyebrows hidden by hair": "face",
    "eyebrows visible through mask": "clothes",
    "eyelash curler": "clothes",
    "eyelashes": "clothes",
    "eyelid": "body",
    "eyelid speculum": "sexual",
    "eyeliner": "clothes",
    "eyepatch": "face",
    "eyes on wings": "body",
    "eyes out of frame": "scene",
    "eyes visible through hair": "body",
    "eyeshadow": "clothes",
    "eyeshadow under eye": "clothes",
    "eyeshield 21": "pose",
    "eyewear around neck": "clothes",
    "eyewear hang": "clothes",
    "eyewear in mouth": "clothes",
    "eyewear on head": "clothes",
    "eyewear on headwear": "clothes",
    "eyewear strap": "clothes",
    "eyewear switch": "clothes",
    "eyewear view": "clothes",
    "face between breasts": "body",
    "face chain": "clothes",
    "face jewel": "clothes",
    "face of the people who sank all their money into the fx (meme)": "face",
    "face punch": "sexual",
    "face stretching": "pose",
    "face to breasts": "body",
    "face to pecs": "body",
    "face-to-face": "pose",
    "faceless": "face",
    "facepaint": "pose",
    "facepalm": "limbs",
    "faceplant": "pose",
    "facial": "sexual",
    "facial expression training": "face",
    "facial hair": "body",
    "facial hair through mask": "clothes",
    "factory": "scene",
    "fading": "pose",
    "fading border": "scene",
    "fainting": "pose",
    "fairy kei": "clothes",
    "fairy wings": "body",
    "fake animal ears": "clothes",
    "fake cover": "scene",
    "fake eyelashes": "face",
    "fake mustache": "body",
    "fake nose": "face",
    "fake phone screenshot": "scene",
    "fake photograph": "scene",
    "fake screenshot": "scene",
    "fake scrollbar": "scene",
    "fake tail": "clothes",
    "fake wings": "body",
    "falconry glove": "clothes",
    "falkland islands": "scene",
    "falklands war": "scene",
    "fallen tree": "scene",
    "falling": "pose",
    "family": "scene",
    "family bonding": "scene",
    "fan speaking": "pose",
    "fanged bangs": "body",
    "fanning": "pose",
    "fanning crotch": "pose",
    "fanning face": "pose",
    "fanny pack": "clothes",
    "fanta": "scene",
    "fare gate": "scene",
    "farm": "scene",
    "farming": "scene",
    "fascinator": "clothes",
    "fashion": "clothes",
    "fast food": "scene",
    "fat": "sexual",
    "fat mons": "body",
    "father's day": "scene",
    "fatter than canon": "effects",
    "faux figurine": "scene",
    "faux retro artstyle": "effects",
    "faux traditional media": "scene",
    "fc anzhi makhachkala": "pose",
    "fc barcelona": "pose",
    "fc bayern munchen": "pose",
    "fc cophenhagen": "pose",
    "fc internazionale milano": "pose",
    "fc porto": "pose",
    "fc schalke 04": "pose",
    "fc shakhtar donetsk": "pose",
    "fc tokyo": "pose",
    "fc zenit": "pose",
    "fdd threesome": "sexual",
    "fear": "body",
    "feast": "scene",
    "feather boa": "clothes",
    "feather hair": "body",
    "feather necklace": "clothes",
    "feather-trimmed sleeves": "clothes",
    "feathered wings": "body",
    "fed by viewer": "pose",
    "fedora": "clothes",
    "feeding": "pose",
    "feeding viewer": "scene",
    "feet": "sexual",
    "feet only": "body",
    "feet out of frame": "scene",
    "feixianji (hairstyle)": "body",
    "felching": "sexual",
    "fellatio": "sexual",
    "fellatio gesture": "limbs",
    "fellatio under mask": "clothes",
    "female butler": "sexual",
    "female ejaculation": "sexual",
    "female focus": "character",
    "female footjob": "sexual",
    "female masturbation": "sexual",
    "female on futa": "sexual",
    "female pov": "clothes",
    "female service cap": "clothes",
    "femboy hooters (meme)": "sexual",
    "femdom": "sexual",
    "femdom rape": "sexual",
    "feminization": "sexual",
    "fencing": "pose",
    "fengguan": "clothes",
    "fenway park": "scene",
    "fern": "scene",
    "ferret ears": "face",
    "ferris wheel": "scene",
    "festoon (necklace)": "clothes",
    "fetal position": "pose",
    "fez hat": "clothes",
    "ffc threesome": "sexual",
    "ffd threesome": "sexual",
    "fff threesome": "sexual",
    "ffm threesome": "sexual",
    "ffo threesome": "sexual",
    "fidgeting": "limbs",
    "field": "scene",
    "field cap": "clothes",
    "field hockey": "pose",
    "fiery background": "scene",
    "fiery hair": "body",
    "fiery tail": "scene",
    "fiery wings": "body",
    "fig": "scene",
    "fig sign": "limbs",
    "fighting": "pose",
    "fighting stance": "pose",
    "figure four sitting": "pose",
    "figure skating": "pose",
    "filet-o-fish": "scene",
    "filipino clothes": "clothes",
    "film grain": "scene",
    "fine art parody": "scene",
    "finger bow": "clothes",
    "finger cots": "clothes",
    "finger counting": "limbs",
    "finger frame": "limbs",
    "finger gun": "limbs",
    "finger heart": "limbs",
    "finger on eyewear": "clothes",
    "finger puppet": "clothes",
    "finger sucking": "pose",
    "finger tattoo": "clothes",
    "fingering": "sexual",
    "fingering through clothes": "sexual",
    "fingering through panties": "sexual",
    "fingerless gloves": "clothes",
    "fingernails": "clothes",
    "fingersmile": "face",
    "finland": "scene",
    "finnish clothes": "clothes",
    "fir tree": "scene",
    "fire": "scene",
    "fire body": "scene",
    "fire extinguisher": "scene",
    "fire flower": "scene",
    "fire hydrant": "scene",
    "fire on chest": "scene",
    "fire play": "sexual",
    "fireball": "scene",
    "firecrackers": "scene",
    "fireflies": "scene",
    "firemaking": "scene",
    "fireman's carry": "pose",
    "fireplace": "scene",
    "fireworks": "scene",
    "fireworks print": "clothes",
    "firing": "pose",
    "first aid": "body",
    "first battle of el alamein": "scene",
    "first indochina war": "scene",
    "first sino-japanese war": "scene",
    "fish (food)": "scene",
    "fish and chips": "scene",
    "fish mask": "clothes",
    "fish mint (plant)": "scene",
    "fish skeleton": "scene",
    "fish-shaped pupils": "face",
    "fishbowl helmet": "clothes",
    "fisheye": "scene",
    "fishing": "pose",
    "fishnet gloves": "clothes",
    "fishnet leggings": "clothes",
    "fishnet legwear": "clothes",
    "fishnet pantyhose": "clothes",
    "fishnet sleeves": "clothes",
    "fishnet socks": "clothes",
    "fishnet thighhighs": "clothes",
    "fishnets": "clothes",
    "fist bump": "limbs",
    "fist in hand": "limbs",
    "fist pump": "limbs",
    "fisting": "sexual",
    "fitness gym": "scene",
    "fitting room": "scene",
    "fivesome": "sexual",
    "fk crvena zvezda": "pose",
    "flaccid": "body",
    "flag": "scene",
    "flag background": "scene",
    "flag print": "clothes",
    "flailing": "pose",
    "flame painter (medium)": "scene",
    "flame print": "scene",
    "flame-tipped tail": "scene",
    "flamenco": "pose",
    "flamethrower": "scene",
    "flaming eyes": "face",
    "flammable symbol": "scene",
    "flapper girl": "clothes",
    "flapping": "pose",
    "flare": "scene",
    "flaring": "scene",
    "flash": "scene",
    "flashing": "pose",
    "flashing eyes": "face",
    "flashlight": "effects",
    "flat ass": "body",
    "flat cap": "clothes",
    "flat chastity cage": "sexual",
    "flat chest": "body",
    "flat chest grab": "limbs",
    "flat color": "effects",
    "flat envy": "body",
    "flat top chef hat": "clothes",
    "flats": "clothes",
    "flattop": "body",
    "flax (flower)": "scene",
    "fleur-de-lis": "clothes",
    "flexing": "pose",
    "flight attendant hat": "clothes",
    "flip-flops": "clothes",
    "flipaclip (medium)": "scene",
    "flipped hair": "body",
    "flipping food": "scene",
    "flirting": "pose",
    "floating": "pose",
    "floating breasts": "body",
    "floating castle": "scene",
    "floating city": "scene",
    "floating hair": "body",
    "floating island": "scene",
    "floating scarf": "clothes",
    "flogger": "sexual",
    "floodlights": "effects",
    "floor lamp": "effects",
    "floppy ears": "face",
    "floral arch": "scene",
    "floral background": "scene",
    "floral print": "clothes",
    "florence (city)": "scene",
    "florence cathedral": "scene",
    "florida (location)": "scene",
    "flossing (dance)": "pose",
    "flour": "scene",
    "flourish (design)": "effects",
    "flower": "scene",
    "flower bed": "scene",
    "flower bracelet": "scene",
    "flower choker": "clothes",
    "flower field": "scene",
    "flower focus": "effects",
    "flower in mouth": "scene",
    "flower necklace": "clothes",
    "flower of life (pattern)": "clothes",
    "flower on head": "scene",
    "flower on liquid": "scene",
    "flower pot": "scene",
    "flower shop": "scene",
    "flower symbol": "scene",
    "flower trim": "clothes",
    "flower-shaped hair": "body",
    "flower-shaped pupils": "face",
    "fluffy hair": "body",
    "fluffy legwear": "clothes",
    "fluminense fc": "pose",
    "flustered": "face",
    "flying": "pose",
    "flying button": "body",
    "fogged glasses": "clothes",
    "fold-over gloves": "clothes",
    "folded": "sexual",
    "folded ponytail": "body",
    "foliage": "scene",
    "folk dance": "pose",
    "fondant au chocolat": "scene",
    "fondue": "scene",
    "food": "scene",
    "food as clothes": "scene",
    "food awe": "face",
    "food between breasts": "scene",
    "food fight": "scene",
    "food focus": "scene",
    "food girls": "scene",
    "food insertion": "sexual",
    "food on body": "scene",
    "food on breasts": "body",
    "food on head": "clothes",
    "food packaging": "scene",
    "food print": "clothes",
    "food stand": "scene",
    "food truck": "scene",
    "food wrapper": "scene",
    "food-themed background": "scene",
    "food-themed clothes": "scene",
    "food-themed eyewear": "clothes",
    "food-themed hair": "body",
    "food-themed hair ornament": "scene",
    "food-themed hat ornament": "clothes",
    "foodgasm": "face",
    "foodification": "effects",
    "foot dangle": "body",
    "foot focus": "clothes",
    "foot on another's breast": "body",
    "foot out of frame": "scene",
    "foot pussy": "body",
    "foot worship": "sexual",
    "footjob": "sexual",
    "footjob from behind": "sexual",
    "footjob under table": "sexual",
    "footjob with boots": "sexual",
    "footjob with footwear": "sexual",
    "footjob with legwear": "sexual",
    "footjob with sandals": "sexual",
    "footjob with shoes": "sexual",
    "footwear": "body",
    "footwear focus": "effects",
    "footwear ribbon": "clothes",
    "forbidden city": "scene",
    "force-feeding": "sexual",
    "forced dressing": "pose",
    "forced feminization": "sexual",
    "forced lactation": "body",
    "forced smile": "face",
    "forced to watch": "sexual",
    "forehead": "body",
    "forehead mark": "body",
    "forehead protector": "clothes",
    "forehead-to-forehead": "pose",
    "foreshortening": "pose",
    "foreskin": "body",
    "forest": "scene",
    "forest of magic": "scene",
    "forget-me-not (flower)": "scene",
    "fork": "scene",
    "forked eyebrows": "face",
    "formal clothes": "clothes",
    "former capital": "scene",
    "forniphilia": "sexual",
    "forsythia": "scene",
    "fortaleza ec": "pose",
    "fountain": "scene",
    "four leaf clover hairstyle": "body",
    "four o'clock (flower)": "scene",
    "four-leaf clover necklace": "clothes",
    "foursome": "sexual",
    "fourth of july": "scene",
    "fox ears": "face",
    "fox hat": "clothes",
    "fox mask": "clothes",
    "fox shadow puppet": "limbs",
    "foxglove": "scene",
    "framed breasts": "body",
    "france": "scene",
    "franco-prussian war": "scene",
    "freediving": "pose",
    "freesia (flower)": "scene",
    "french clothes": "clothes",
    "french cruller": "scene",
    "french fries": "scene",
    "french girly": "clothes",
    "french guiana": "scene",
    "french revolution": "scene",
    "french toast": "scene",
    "fried chicken": "scene",
    "fried egg": "scene",
    "fried fish": "scene",
    "fried oyster": "scene",
    "fried rice": "scene",
    "friendship charm": "clothes",
    "frilled bikini": "clothes",
    "frilled choker": "clothes",
    "frilled collar": "clothes",
    "frilled gloves": "clothes",
    "frilled hair tubes": "body",
    "frilled hat": "clothes",
    "frilled one-piece swimsuit": "clothes",
    "frilled shirt": "clothes",
    "frilled sleeves": "clothes",
    "frilled thigh strap": "clothes",
    "frills": "clothes",
    "fringe trim": "clothes",
    "frog mask": "clothes",
    "frogtie": "sexual",
    "from above": "scene",
    "from behind": "scene",
    "from below": "scene",
    "from outside": "scene",
    "from side": "scene",
    "front braid": "body",
    "front ponytail": "body",
    "front-seamed legwear": "clothes",
    "frontless outfit": "sexual",
    "frottage": "sexual",
    "frown": "face",
    "frozen": "sexual",
    "fruit": "scene",
    "fruit as cup": "scene",
    "fruit background": "scene",
    "fruit bowl": "scene",
    "fruit hat ornament": "clothes",
    "fruit pattern": "clothes",
    "fruit punch (drink)": "scene",
    "fruit sandwich": "scene",
    "fruit tart": "scene",
    "fruit tree": "scene",
    "fruitcake": "scene",
    "frustrated": "face",
    "frutiger aero": "effects",
    "frutiger metro": "effects",
    "frying pan": "scene",
    "fuchsia (flower)": "scene",
    "fuchu (tokyo)": "scene",
    "fucked silly": "sexual",
    "fudge": "scene",
    "fujisawa (city)": "scene",
    "fukkireta": "pose",
    "fukui prefecture": "scene",
    "fukumage": "body",
    "fukuoka (city)": "scene",
    "fukuoka prefecture": "scene",
    "fukuoka softbank hawks": "pose",
    "fukushima prefecture": "scene",
    "full body": "scene",
    "full mouth": "scene",
    "full nelson": "sexual",
    "full scorpion": "pose",
    "full-face blush": "face",
    "full-package futanari": "sexual",
    "fundoshi": "clothes",
    "funfetti cake": "scene",
    "fur choker": "clothes",
    "fur coat": "clothes",
    "fur collar": "clothes",
    "fur hat": "clothes",
    "fur scarf": "clothes",
    "fur trim": "clothes",
    "fur-trimmed choker": "clothes",
    "fur-trimmed coat": "clothes",
    "fur-trimmed collar": "clothes",
    "fur-trimmed gloves": "clothes",
    "fur-trimmed legwear": "clothes",
    "fur-trimmed scarf": "clothes",
    "fur-trimmed sleeves": "clothes",
    "furikake (food)": "scene",
    "furisode": "clothes",
    "furisode sleeves": "clothes",
    "furnace": "scene",
    "furrification": "effects",
    "furrowed brow": "face",
    "fushimi inari taisha": "scene",
    "fusion": "effects",
    "fusuma": "scene",
    "futa on male": "sexual",
    "futa with cuntboy": "sexual",
    "futa with female": "sexual",
    "futa with futa": "sexual",
    "futa with male": "sexual",
    "futa with newhalf": "sexual",
    "futa without pussy": "sexual",
    "futanari": "sexual",
    "futanari masturbation": "sexual",
    "futasub": "sexual",
    "futou": "clothes",
    "g-string": "clothes",
    "g-suit": "clothes",
    "gag": "sexual",
    "gag harness": "sexual",
    "gag under mask": "clothes",
    "gaiwan": "scene",
    "gakuran": "clothes",
    "galia melon": "scene",
    "gamba osaka": "pose",
    "game asset": "scene",
    "game controller print": "clothes",
    "game screenshot": "scene",
    "game screenshot background": "scene",
    "gangbang": "sexual",
    "gangnam style": "pose",
    "ganguro": "clothes",
    "gaping nipples": "body",
    "garage": "scene",
    "garden": "scene",
    "garden of the sun": "scene",
    "gardenia (flower)": "scene",
    "gardening": "pose",
    "garlic": "scene",
    "garrison cap": "clothes",
    "garrote (torture instrument)": "sexual",
    "garter belt": "clothes",
    "garter straps": "clothes",
    "gas mask": "clothes",
    "gas station": "scene",
    "gat (hat)": "clothes",
    "gate": "scene",
    "gateball": "pose",
    "gathers": "clothes",
    "gato dance": "pose",
    "gatorade": "scene",
    "gauntlets": "clothes",
    "gaza": "scene",
    "gazebo": "scene",
    "gear eyes": "face",
    "gear hat ornament": "clothes",
    "gear-shaped pupils": "face",
    "geass": "face",
    "gel banana": "scene",
    "gelatin": "scene",
    "gelato": "scene",
    "gem": "clothes",
    "gender dysphoria": "sexual",
    "gender request": "character",
    "gender transition timeline": "sexual",
    "gender transitioning": "sexual",
    "gender transitioning (ftm)": "sexual",
    "gender transitioning (mtf)": "sexual",
    "genderswap": "sexual",
    "genderswap (ftm)": "effects",
    "genderswap (mtf)": "effects",
    "gendou pose": "pose",
    "genista (flower)": "scene",
    "genjiguruma": "clothes",
    "genkan": "scene",
    "gentiana (flower)": "scene",
    "georgia (country)": "scene",
    "georgia (state)": "scene",
    "georgia max coffee": "scene",
    "georgian clothes": "clothes",
    "georgian era": "clothes",
    "geranium": "scene",
    "gerbera": "scene",
    "german clothes": "clothes",
    "germany": "scene",
    "get down (meme)": "pose",
    "geta": "clothes",
    "geyser": "scene",
    "ghana": "scene",
    "ghost costume": "clothes",
    "ghost hands": "body",
    "ghost mask": "clothes",
    "ghost pose": "pose",
    "giant": "sexual",
    "giant killing": "pose",
    "giant tree": "scene",
    "giantess": "sexual",
    "gif artifacts": "scene",
    "gifu prefecture": "scene",
    "gigantic ass": "body",
    "gigantic breasts": "body",
    "gigantic penis": "body",
    "gigantic testicles": "body",
    "giggling": "pose",
    "gimp mask": "sexual",
    "gimp suit": "sexual",
    "ginga e kickoff!!": "pose",
    "ginger root": "scene",
    "gingerbread cookie": "scene",
    "gingerbread house": "scene",
    "gingerbread man": "scene",
    "gingham": "clothes",
    "gingham ascot": "clothes",
    "gingham background": "scene",
    "gingham legwear": "clothes",
    "ginkgo nut": "scene",
    "ginkgo tree": "scene",
    "ginza wako": "scene",
    "giorno giovanna's pose": "pose",
    "giraffe mask": "clothes",
    "girl on top": "sexual",
    "girlmoder": "sexual",
    "girly boy": "sexual",
    "giving": "pose",
    "giving birth": "sexual",
    "glacier": "scene",
    "gladiator sandals": "clothes",
    "gladiolus": "scene",
    "glands of montgomery": "body",
    "glansjob": "sexual",
    "glansplasty": "sexual",
    "glaring": "pose",
    "glasgow smile": "face",
    "glass": "scene",
    "glass door": "scene",
    "glass eye": "face",
    "glasses": "clothes",
    "glasses case": "clothes",
    "glasses day": "scene",
    "glaze lily": "scene",
    "glazed donut": "scene",
    "glitch": "scene",
    "glitch art": "effects",
    "glitter": "clothes",
    "glitter makeup": "clothes",
    "gloom (expression)": "face",
    "gloriosa (flower)": "scene",
    "glory hole": "sexual",
    "glory wall": "sexual",
    "glove bow": "clothes",
    "glove cuffs": "clothes",
    "glove cutout": "clothes",
    "glove in mouth": "clothes",
    "glove pull": "clothes",
    "gloves": "clothes",
    "glowing": "pose",
    "glowing eye": "face",
    "glowing eyes": "face",
    "glowing hair": "body",
    "glowing headgear": "effects",
    "glowing mask": "clothes",
    "glowing mouth": "face",
    "glowing wings": "body",
    "glowstick": "effects",
    "gluhwein": "scene",
    "goat ears": "face",
    "goat's tongue": "sexual",
    "goatee": "body",
    "goblin mask": "clothes",
    "goggles": "clothes",
    "goggles around neck": "clothes",
    "gokkun": "sexual",
    "gold choker": "clothes",
    "gold mask": "clothes",
    "gold necklace": "clothes",
    "gold one-piece swimsuit": "clothes",
    "gold trim": "clothes",
    "golden apple": "scene",
    "golden gate bridge": "scene",
    "golden shower": "sexual",
    "golden state warriors": "pose",
    "golden trumpet": "scene",
    "goldfish scooping": "pose",
    "golf": "pose",
    "golf ball": "pose",
    "golf club": "pose",
    "good couple day": "scene",
    "good meat day": "scene",
    "good thighhighs day": "scene",
    "good times burgers & frozen custard": "scene",
    "googly eyes": "face",
    "goose (food)": "scene",
    "gooseberry": "scene",
    "gorget": "clothes",
    "gorilla mask": "clothes",
    "goshoguruma": "clothes",
    "goth fashion": "clothes",
    "gothic lolita": "clothes",
    "gothic punk": "clothes",
    "gourd": "scene",
    "gourd blossom": "scene",
    "grabbing": "limbs",
    "grabbing another's ass": "sexual",
    "grabbing another's breast": "sexual",
    "grabbing another's ear": "face",
    "grabbing another's hair": "body",
    "grabbing another's skirt": "sexual",
    "grabbing another's sleeve": "clothes",
    "grabbing another's tongue": "limbs",
    "grabbing another's wing": "body",
    "grabbing own ass": "body",
    "grabbing own breast": "sexual",
    "grabbing own wing": "body",
    "gracidea": "scene",
    "gradient": "scene",
    "gradient ascot": "clothes",
    "gradient background": "scene",
    "gradient bowtie": "clothes",
    "gradient eyes": "face",
    "gradient eyeshadow": "clothes",
    "gradient filter": "effects",
    "gradient hair": "body",
    "gradient legwear": "clothes",
    "gradient neckerchief": "clothes",
    "gradient scarf": "clothes",
    "gradient sleeves": "clothes",
    "gradient theme": "effects",
    "gradient wings": "body",
    "gradient-tinted eyewear": "clothes",
    "grand canyon": "scene",
    "grand scale": "scene",
    "granulated sugar": "scene",
    "grape hat ornament": "clothes",
    "grape hyacinth": "scene",
    "grape stomping": "scene",
    "grapefruit": "scene",
    "grapes": "scene",
    "grass": "scene",
    "grass lily": "scene",
    "grasslands": "scene",
    "grater": "scene",
    "graveyard": "scene",
    "gravy boat": "scene",
    "greaser fashion": "clothes",
    "great burnet": "scene",
    "great pyramid of giza": "scene",
    "great sphinx of giza": "scene",
    "great wall of china": "scene",
    "greater western sydney giants": "pose",
    "greco-roman clothes": "clothes",
    "greece": "scene",
    "greek toe": "body",
    "green apple": "scene",
    "green ascot": "clothes",
    "green background": "scene",
    "green bean": "scene",
    "green bell pepper": "scene",
    "green bowtie": "clothes",
    "green choker": "clothes",
    "green eyes": "face",
    "green eyeshadow": "clothes",
    "green fire": "scene",
    "green gloves": "clothes",
    "green hair": "body",
    "green hat": "clothes",
    "green lips": "clothes",
    "green mask": "clothes",
    "green neckerchief": "clothes",
    "green necktie": "clothes",
    "green one-piece swimsuit": "clothes",
    "green pupils": "face",
    "green scarf": "clothes",
    "green sclera": "face",
    "green skin": "body",
    "green sleeves": "clothes",
    "green tea": "scene",
    "green theme": "effects",
    "green wall": "scene",
    "green wings": "body",
    "green-framed eyewear": "clothes",
    "green-tinted eyewear": "clothes",
    "greenhouse": "scene",
    "greenland": "scene",
    "gremio fbpa": "pose",
    "grey ascot": "clothes",
    "grey background": "scene",
    "grey bowtie": "clothes",
    "grey choker": "clothes",
    "grey eyes": "face",
    "grey eyeshadow": "clothes",
    "grey gloves": "clothes",
    "grey hair": "body",
    "grey hat": "clothes",
    "grey lips": "clothes",
    "grey mask": "clothes",
    "grey neckerchief": "clothes",
    "grey necktie": "clothes",
    "grey one-piece swimsuit": "clothes",
    "grey pupils": "face",
    "grey scarf": "clothes",
    "grey skin": "body",
    "grey sleeves": "clothes",
    "grey theme": "effects",
    "grey wings": "body",
    "grey-framed eyewear": "clothes",
    "grey-tinted eyewear": "clothes",
    "greyscale": "effects",
    "greyscale with colored background": "scene",
    "grid background": "scene",
    "grid print": "clothes",
    "griddle": "scene",
    "griddy (dance)": "pose",
    "grill": "scene",
    "grilled fish": "scene",
    "grilling": "pose",
    "grills": "clothes",
    "grimace": "face",
    "grimace (mcdonald's)": "scene",
    "grin": "face",
    "grind fiction": "effects",
    "gris swimsuit": "clothes",
    "groceries": "scene",
    "grocery store": "scene",
    "groin": "body",
    "groin tendon": "body",
    "groping": "sexual",
    "groping motion": "limbs",
    "groucho glasses": "clothes",
    "group hug": "pose",
    "group picture": "scene",
    "group profile": "scene",
    "group sex": "sexual",
    "grunge (fashion)": "clothes",
    "guapi mao": "clothes",
    "guatemala": "scene",
    "guava (fruit)": "scene",
    "guided breast grab": "sexual",
    "guided crotch grab": "sexual",
    "guided pectoral grab": "sexual",
    "guided penetration": "sexual",
    "guilt": "face",
    "guimpe": "clothes",
    "guinness (beer)": "scene",
    "gulf war": "scene",
    "gumball": "scene",
    "gun": "body",
    "gun in pussy": "body",
    "gunkanmaki": "scene",
    "gunma prefecture": "scene",
    "gunpowder": "scene",
    "guro": "sexual",
    "gurokawa": "clothes",
    "guy fawkes mask": "clothes",
    "guyana": "scene",
    "gyaru": "clothes",
    "gyaru makeup": "clothes",
    "gyaru v": "limbs",
    "gyaruo": "clothes",
    "gyate gyate": "face",
    "gym": "scene",
    "gym shorts": "clothes",
    "gym storeroom": "scene",
    "gym uniform": "clothes",
    "gymnastics": "pose",
    "gynecomastia": "sexual",
    "gyotaku (medium)": "scene",
    "gyouza no manshuu": "scene",
    "gyu-kaku": "scene",
    "gyuudon": "scene",
    "habanero pepper": "scene",
    "habanero-tan": "scene",
    "hachimaki": "clothes",
    "hadeko": "clothes",
    "hagia sophia": "scene",
    "haikyuu!!": "pose",
    "hair": "body",
    "hair around arms": "body",
    "hair around ear": "body",
    "hair around horn": "body",
    "hair around neck": "body",
    "hair around own leg": "body",
    "hair beads": "clothes",
    "hair bell": "body",
    "hair between eyes": "body",
    "hair bikini": "body",
    "hair bobbles": "clothes",
    "hair bow": "clothes",
    "hair brush": "body",
    "hair color switch": "effects",
    "hair down": "body",
    "hair dryer": "body",
    "hair ears": "face",
    "hair extensions": "body",
    "hair flaps": "body",
    "hair flip": "body",
    "hair flower": "clothes",
    "hair focus": "effects",
    "hair hanging down": "body",
    "hair horns": "body",
    "hair in own mouth": "body",
    "hair intakes": "body",
    "hair ornament": "clothes",
    "hair over breasts": "body",
    "hair over crotch": "body",
    "hair over eyes": "body",
    "hair over one breast": "body",
    "hair over one eye": "body",
    "hair over shoulder": "clothes",
    "hair pulled back": "body",
    "hair ribbon": "clothes",
    "hair rings": "body",
    "hair rollers": "clothes",
    "hair scarf": "body",
    "hair scrunchie": "clothes",
    "hair slicked back": "body",
    "hair spread out": "body",
    "hair stick": "clothes",
    "hair straightener": "body",
    "hair tie": "clothes",
    "hair tubes": "clothes",
    "hair up": "body",
    "hair weapon": "body",
    "hair wings": "body",
    "hairband": "clothes",
    "hairclip": "clothes",
    "hairdressing": "pose",
    "hairjob": "sexual",
    "hairpods": "body",
    "haiti": "scene",
    "hajime no ippo": "pose",
    "hakama": "clothes",
    "hakama pants": "clothes",
    "hakama pull": "sexual",
    "hakama short skirt": "clothes",
    "hakama skirt": "clothes",
    "hakodate (city)": "scene",
    "hakugyokurou": "scene",
    "hakurei shrine": "scene",
    "halation pupils": "face",
    "half crown braid": "body",
    "half eye mask": "clothes",
    "half gloves": "clothes",
    "half mask": "clothes",
    "half up braid": "body",
    "half up half down braid": "body",
    "half updo": "body",
    "half-closed eyes": "face",
    "halftone": "scene",
    "halftone background": "scene",
    "halifax mooseheads": "pose",
    "halloween": "scene",
    "hallway": "scene",
    "halter dress": "clothes",
    "halter leotard": "clothes",
    "halter shirt": "clothes",
    "halterneck": "clothes",
    "ham": "scene",
    "hamburger steak": "scene",
    "hamburglar": "scene",
    "hamster dance": "pose",
    "hanafuda": "scene",
    "hanamaru sensation": "pose",
    "hanami": "scene",
    "hanbok": "clothes",
    "hand between own legs": "limbs",
    "hand chains": "clothes",
    "hand eye": "limbs",
    "hand fan": "clothes",
    "hand focus": "scene",
    "hand gesture duo": "limbs",
    "hand glasses": "limbs",
    "hand hair": "clothes",
    "hand in bra": "limbs",
    "hand in own hair": "body",
    "hand in pocket": "limbs",
    "hand jewel": "clothes",
    "hand milking": "pose",
    "hand mirror": "clothes",
    "hand mouth": "limbs",
    "hand of benediction": "limbs",
    "hand on another's arm": "limbs",
    "hand on another's ass": "limbs",
    "hand on another's back": "limbs",
    "hand on another's cheek": "limbs",
    "hand on another's chest": "limbs",
    "hand on another's chin": "limbs",
    "hand on another's crotch": "limbs",
    "hand on another's ear": "limbs",
    "hand on another's face": "limbs",
    "hand on another's foot": "limbs",
    "hand on another's hand": "limbs",
    "hand on another's head": "limbs",
    "hand on another's hip": "limbs",
    "hand on another's knee": "limbs",
    "hand on another's leg": "limbs",
    "hand on another's neck": "limbs",
    "hand on another's shoulder": "limbs",
    "hand on another's stomach": "limbs",
    "hand on another's thigh": "limbs",
    "hand on another's waist": "limbs",
    "hand on another's wing": "body",
    "hand on eyewear": "clothes",
    "hand on headwear": "limbs",
    "hand on mask": "clothes",
    "hand on own arm": "limbs",
    "hand on own ass": "limbs",
    "hand on own cheek": "limbs",
    "hand on own chest": "limbs",
    "hand on own chin": "limbs",
    "hand on own crotch": "limbs",
    "hand on own ear": "limbs",
    "hand on own elbow": "limbs",
    "hand on own face": "limbs",
    "hand on own foot": "limbs",
    "hand on own forehead": "limbs",
    "hand on own head": "limbs",
    "hand on own hip": "limbs",
    "hand on own knee": "limbs",
    "hand on own leg": "limbs",
    "hand on own neck": "limbs",
    "hand on own shoulder": "limbs",
    "hand on own stomach": "limbs",
    "hand on own thigh": "limbs",
    "hand puppets": "clothes",
    "hand tattoo": "clothes",
    "hand under swimsuit": "clothes",
    "handcuffs": "sexual",
    "handjob": "sexual",
    "handjob gesture": "limbs",
    "handkerchief": "clothes",
    "handprint": "clothes",
    "hands": "body",
    "hands in opposite sleeves": "clothes",
    "hands in pockets": "limbs",
    "hands on another's ass": "body",
    "hands on another's cheeks": "limbs",
    "hands on another's chest": "limbs",
    "hands on another's crotch": "limbs",
    "hands on another's face": "limbs",
    "hands on another's head": "limbs",
    "hands on another's hips": "limbs",
    "hands on another's knees": "limbs",
    "hands on another's leg": "limbs",
    "hands on another's neck": "limbs",
    "hands on another's shoulder": "limbs",
    "hands on another's shoulders": "limbs",
    "hands on another's stomach": "limbs",
    "hands on another's thighs": "limbs",
    "hands on another's waist": "limbs",
    "hands on feet": "limbs",
    "hands on headwear": "clothes",
    "hands on own arms": "limbs",
    "hands on own ass": "body",
    "hands on own cheeks": "limbs",
    "hands on own chest": "limbs",
    "hands on own chin": "limbs",
    "hands on own crotch": "limbs",
    "hands on own face": "limbs",
    "hands on own feet": "limbs",
    "hands on own head": "limbs",
    "hands on own hips": "limbs",
    "hands on own knees": "limbs",
    "hands on own legs": "limbs",
    "hands on own neck": "limbs",
    "hands on own shoulders": "limbs",
    "hands on own stomach": "limbs",
    "hands on own thighs": "limbs",
    "handsfree paizuri": "sexual",
    "handstand": "pose",
    "hanfu": "clothes",
    "hangar": "scene",
    "hanged": "pose",
    "hanging": "pose",
    "hanging breasts": "body",
    "hanging food": "scene",
    "hanging plant": "scene",
    "hanshin tigers": "pose",
    "hanten (clothes)": "clothes",
    "hanukkah": "scene",
    "hanwha eagles": "pose",
    "haori": "clothes",
    "haori himo": "clothes",
    "happi": "clothes",
    "happy": "face",
    "happy birthday": "scene",
    "happy easter": "scene",
    "happy halloween": "scene",
    "happy new year": "scene",
    "happy sex": "sexual",
    "happy valentine": "scene",
    "har gow": "scene",
    "harbor": "scene",
    "hard hat": "clothes",
    "hard rock stadium": "scene",
    "hard-translated": "scene",
    "hardboiled egg": "scene",
    "hare hare yukai": "pose",
    "harem outfit": "clothes",
    "harmful spikes": "sexual",
    "harness": "clothes",
    "harpy": "body",
    "harukana receive": "pose",
    "has adversarial noise revision": "scene",
    "has artifacted revision": "scene",
    "has bad revision": "scene",
    "has censored revision": "scene",
    "has cropped revision": "scene",
    "has downscaled revision": "scene",
    "has lossy revision": "scene",
    "has watermarked revision": "scene",
    "hat": "clothes",
    "hat basket": "clothes",
    "hat bow": "clothes",
    "hat feather": "clothes",
    "hat flower": "clothes",
    "hat loss": "clothes",
    "hat on chest": "clothes",
    "hat ornament": "clothes",
    "hat over eyes": "clothes",
    "hat over one eye": "clothes",
    "hat ribbon": "clothes",
    "hat tassel": "clothes",
    "hat tip": "limbs",
    "hat with ears": "clothes",
    "hatching": "pose",
    "hatching (texture)": "scene",
    "hatsune miku": "character",
    "have to pee": "sexual",
    "hawaii": "scene",
    "hawaiian clothes": "clothes",
    "hawthorn (plant)": "scene",
    "hazelnut": "scene",
    "hazmat suit": "clothes",
    "head and hip pose": "pose",
    "head back": "pose",
    "head between breasts": "body",
    "head bump": "body",
    "head chain": "clothes",
    "head down": "pose",
    "head on ass": "body",
    "head on chest": "pose",
    "head on hand": "limbs",
    "head out of frame": "scene",
    "head rest": "limbs",
    "head tilt": "pose",
    "head wings": "body",
    "head wreath": "clothes",
    "headband": "clothes",
    "headdress": "clothes",
    "headlamp": "clothes",
    "headlight": "effects",
    "headpat": "limbs",
    "headphones": "clothes",
    "headphones around neck": "clothes",
    "headphones on breasts": "body",
    "headpiece": "clothes",
    "heads together": "pose",
    "headscarf": "clothes",
    "headset": "clothes",
    "headstand": "pose",
    "headwear switch": "effects",
    "healing": "pose",
    "heart": "scene",
    "heart (organ)": "body",
    "heart ahoge": "body",
    "heart antenna hair": "body",
    "heart arms": "limbs",
    "heart background": "scene",
    "heart choker": "clothes",
    "heart collar": "clothes",
    "heart hair bun": "body",
    "heart hands": "limbs",
    "heart hands duo": "limbs",
    "heart hands quartet": "limbs",
    "heart hands trio": "limbs",
    "heart hat ornament": "clothes",
    "heart in mouth": "face",
    "heart necklace": "clothes",
    "heart ring choker": "clothes",
    "heart straw": "scene",
    "heart tail": "limbs",
    "heart tail duo": "limbs",
    "heart wings": "body",
    "heart-shaped box": "scene",
    "heart-shaped cake": "scene",
    "heart-shaped chocolate": "scene",
    "heart-shaped eyes": "face",
    "heart-shaped eyewear": "clothes",
    "heart-shaped hair": "body",
    "heart-shaped mouth": "face",
    "heart-shaped pupils": "face",
    "heartbreak haircut": "body",
    "heated rivalry": "pose",
    "heather (flower)": "scene",
    "heaven condition": "scene",
    "heavy breathing": "pose",
    "heavy chromatic aberration": "scene",
    "heavy lens flare": "scene",
    "heinz": "scene",
    "heisei retro": "clothes",
    "heliconia": "scene",
    "helicopter hair": "body",
    "hellebore": "scene",
    "helltaker dance": "pose",
    "helm": "clothes",
    "hemerocallis": "scene",
    "henna": "clothes",
    "hennin": "clothes",
    "henohenomoheji": "face",
    "henshin pose": "pose",
    "hepatica (flower)": "scene",
    "herb": "scene",
    "herbal tea": "scene",
    "heropin": "sexual",
    "heterochromia": "face",
    "hev suit": "clothes",
    "hibiscus": "scene",
    "hidden file": "scene",
    "hiding": "pose",
    "hifu": "scene",
    "high collar": "clothes",
    "high contrast": "scene",
    "high dynamic range": "scene",
    "high five": "limbs",
    "high heel boots": "clothes",
    "high heels": "clothes",
    "high ponytail": "body",
    "high side ponytail": "body",
    "high tops": "clothes",
    "high up": "scene",
    "high-low skirt": "clothes",
    "high-waist skirt": "clothes",
    "highleg bikini": "clothes",
    "highleg one-piece swimsuit": "clothes",
    "highlighter (makeup)": "clothes",
    "highway": "scene",
    "hijab": "clothes",
    "hijiki (seaweed)": "scene",
    "hikimayu": "clothes",
    "hiking": "pose",
    "hill": "scene",
    "hime cut": "body",
    "hime gyaru": "clothes",
    "hime lolita": "clothes",
    "himeji castle": "scene",
    "himekaji": "clothes",
    "hina ningyou": "scene",
    "hinamatsuri": "scene",
    "hip dips": "body",
    "hip focus": "scene",
    "hip hop": "clothes",
    "hip vent": "sexual",
    "hiphighs": "clothes",
    "hippie": "clothes",
    "hips": "body",
    "hipster": "clothes",
    "hiroshima (city)": "scene",
    "hiroshima peace memorial": "scene",
    "hiroshima prefecture": "scene",
    "hiroshima touyou carp": "pose",
    "hishimochi": "scene",
    "historical connection": "scene",
    "historical event": "scene",
    "historical name connection": "scene",
    "hitachi magic wand": "sexual",
    "hitchhiking": "pose",
    "hitting": "pose",
    "hiyashi chuuka": "scene",
    "hiyayakko (food)": "scene",
    "hobble": "sexual",
    "hockey helmet": "pose",
    "hockey mask": "pose",
    "hockey puck": "pose",
    "hockey stick": "pose",
    "hockey sweater": "pose",
    "hogtie": "sexual",
    "hogtie carry": "sexual",
    "hokkai": "scene",
    "hokkaido nippon-ham fighters": "pose",
    "hokkaido prefecture": "scene",
    "hokuto no ken": "scene",
    "holding": "limbs",
    "holding anchor": "limbs",
    "holding animal": "limbs",
    "holding another's ankle": "limbs",
    "holding another's arm": "limbs",
    "holding another's finger": "limbs",
    "holding another's foot": "limbs",
    "holding another's hair": "limbs",
    "holding another's leg": "limbs",
    "holding another's tail": "limbs",
    "holding another's wrist": "limbs",
    "holding arrow": "limbs",
    "holding axe": "limbs",
    "holding badminton racket": "limbs",
    "holding bag": "limbs",
    "holding ball": "limbs",
    "holding bamboo steamer": "limbs",
    "holding bandages": "limbs",
    "holding bandaid": "limbs",
    "holding barcode scanner": "limbs",
    "holding basket": "limbs",
    "holding bass guitar": "limbs",
    "holding baton (weapon)": "limbs",
    "holding behind back": "limbs",
    "holding belt": "limbs",
    "holding bento": "limbs",
    "holding bird": "limbs",
    "holding blanket": "limbs",
    "holding bomb": "limbs",
    "holding bone": "limbs",
    "holding book": "limbs",
    "holding bottle": "limbs",
    "holding bouquet": "limbs",
    "holding bow (music)": "limbs",
    "holding bow (weapon)": "limbs",
    "holding bowl": "limbs",
    "holding box": "limbs",
    "holding branch": "limbs",
    "holding briefcase": "limbs",
    "holding broom": "limbs",
    "holding bucket": "limbs",
    "holding bullet": "limbs",
    "holding burger": "limbs",
    "holding butterfly net": "limbs",
    "holding cable": "limbs",
    "holding cage": "limbs",
    "holding cake": "limbs",
    "holding camera": "limbs",
    "holding can": "limbs",
    "holding candle": "limbs",
    "holding candlestand": "limbs",
    "holding candy": "limbs",
    "holding candy apple": "limbs",
    "holding cane": "limbs",
    "holding cannon": "limbs",
    "holding card": "limbs",
    "holding carrot": "limbs",
    "holding cat": "limbs",
    "holding chainsaw": "limbs",
    "holding chakram": "limbs",
    "holding chalk": "limbs",
    "holding chess piece": "limbs",
    "holding chocolate": "limbs",
    "holding chopsticks": "limbs",
    "holding cigar": "limbs",
    "holding cigarette": "limbs",
    "holding cigarette pack": "limbs",
    "holding cleaver": "limbs",
    "holding clothes hanger": "limbs",
    "holding clover": "limbs",
    "holding club": "limbs",
    "holding coat": "limbs",
    "holding cocktail shaker": "limbs",
    "holding coffee pot": "limbs",
    "holding coin": "limbs",
    "holding collar": "limbs",
    "holding comb": "limbs",
    "holding compact": "limbs",
    "holding computer keyboard": "limbs",
    "holding computer mouse": "limbs",
    "holding condom": "limbs",
    "holding controller": "limbs",
    "holding cookie": "limbs",
    "holding cooking pot": "limbs",
    "holding cotton candy": "limbs",
    "holding crayon": "limbs",
    "holding creature": "limbs",
    "holding crepe": "limbs",
    "holding cross": "limbs",
    "holding crossbow": "limbs",
    "holding crowbar": "limbs",
    "holding crown": "limbs",
    "holding crystal": "limbs",
    "holding cup": "limbs",
    "holding dagger": "limbs",
    "holding detached head": "limbs",
    "holding dice": "limbs",
    "holding diploma": "limbs",
    "holding dog": "limbs",
    "holding doll": "limbs",
    "holding donut": "limbs",
    "holding drawing": "limbs",
    "holding drawing tablet": "limbs",
    "holding drink": "limbs",
    "holding drink carton": "limbs",
    "holding drinking straw": "limbs",
    "holding drumsticks": "limbs",
    "holding dumbbell": "limbs",
    "holding duster": "limbs",
    "holding dustpan": "limbs",
    "holding earphones": "limbs",
    "holding earrings": "limbs",
    "holding ears": "face",
    "holding egg": "limbs",
    "holding ema": "limbs",
    "holding energy gun": "limbs",
    "holding envelope": "limbs",
    "holding eyeball": "limbs",
    "holding feather": "limbs",
    "holding fish": "limbs",
    "holding fishing rod": "limbs",
    "holding flail": "limbs",
    "holding flamethrower": "limbs",
    "holding flashlight": "limbs",
    "holding flower": "limbs",
    "holding flower pot": "limbs",
    "holding flute": "limbs",
    "holding folder": "limbs",
    "holding food": "limbs",
    "holding fork": "limbs",
    "holding frog": "limbs",
    "holding fruit": "limbs",
    "holding frying pan": "limbs",
    "holding gem": "limbs",
    "holding glass door": "scene",
    "holding gloves": "clothes",
    "holding glowstick": "limbs",
    "holding gohei": "limbs",
    "holding golf club": "limbs",
    "holding gourd": "limbs",
    "holding grenade": "limbs",
    "holding guitar": "limbs",
    "holding gun": "limbs",
    "holding hair brush": "limbs",
    "holding hair dryer": "limbs",
    "holding hair ornament": "limbs",
    "holding hair tie": "limbs",
    "holding halloween bucket": "limbs",
    "holding hammer": "limbs",
    "holding handheld game console": "limbs",
    "holding handkerchief": "limbs",
    "holding hands": "limbs",
    "holding headphones": "limbs",
    "holding heart (organ)": "limbs",
    "holding hose": "limbs",
    "holding ice cream": "limbs",
    "holding ice cream cone": "limbs",
    "holding id card": "limbs",
    "holding instrument": "limbs",
    "holding jewelry": "limbs",
    "holding juice box": "limbs",
    "holding jump rope": "limbs",
    "holding kettle": "limbs",
    "holding key": "limbs",
    "holding knife": "limbs",
    "holding knife behind back": "limbs",
    "holding kunai": "limbs",
    "holding ladle": "limbs",
    "holding lantern": "limbs",
    "holding laptop": "limbs",
    "holding lead pipe": "limbs",
    "holding leaf": "limbs",
    "holding legwear": "limbs",
    "holding letter": "limbs",
    "holding lighter": "limbs",
    "holding lipstick tube": "limbs",
    "holding lyre": "limbs",
    "holding mace": "limbs",
    "holding machete": "limbs",
    "holding magazine": "limbs",
    "holding magazine (weapon)": "limbs",
    "holding magnifying glass": "limbs",
    "holding mahjong tile": "limbs",
    "holding makeup brush": "clothes",
    "holding makeup palette": "clothes",
    "holding mallet": "limbs",
    "holding manga": "limbs",
    "holding maracas": "limbs",
    "holding marker": "limbs",
    "holding mask": "limbs",
    "holding megaphone": "limbs",
    "holding microphone": "limbs",
    "holding microphone stand": "limbs",
    "holding milk carton": "limbs",
    "holding mini person": "limbs",
    "holding mirror": "limbs",
    "holding missile": "limbs",
    "holding mistletoe": "limbs",
    "holding money": "limbs",
    "holding mop": "limbs",
    "holding mp3 player": "limbs",
    "holding mushroom": "limbs",
    "holding nail": "limbs",
    "holding necklace": "limbs",
    "holding newspaper": "limbs",
    "holding notebook": "limbs",
    "holding notepad": "limbs",
    "holding nunchaku": "limbs",
    "holding oar": "limbs",
    "holding ofuda": "limbs",
    "holding omikuji": "limbs",
    "holding own ankle": "limbs",
    "holding own foot": "limbs",
    "holding own hair": "limbs",
    "holding own leg": "limbs",
    "holding own tail": "limbs",
    "holding own wrist": "limbs",
    "holding paddle": "limbs",
    "holding paint palette": "limbs",
    "holding paintbrush": "limbs",
    "holding paper": "limbs",
    "holding pastry bag": "limbs",
    "holding pen": "limbs",
    "holding pencil": "limbs",
    "holding petal": "limbs",
    "holding phone": "limbs",
    "holding photo": "limbs",
    "holding pickaxe": "limbs",
    "holding pill": "limbs",
    "holding pillow": "limbs",
    "holding pinwheel": "limbs",
    "holding pitchfork": "limbs",
    "holding pizza": "limbs",
    "holding plant": "limbs",
    "holding plate": "limbs",
    "holding plectrum": "limbs",
    "holding pocket watch": "limbs",
    "holding pocky": "limbs",
    "holding pointer": "limbs",
    "holding polearm": "limbs",
    "holding pom poms": "limbs",
    "holding popsicle": "limbs",
    "holding power drill": "limbs",
    "holding pregnancy test": "limbs",
    "holding pumpkin": "limbs",
    "holding quill": "limbs",
    "holding rabbit": "limbs",
    "holding racket": "limbs",
    "holding rattle": "limbs",
    "holding razor": "limbs",
    "holding removed eyewear": "clothes",
    "holding ribbon": "limbs",
    "holding riding crop": "limbs",
    "holding ring": "limbs",
    "holding rock": "limbs",
    "holding rocket launcher": "limbs",
    "holding ruler": "limbs",
    "holding sack": "limbs",
    "holding sandwich": "limbs",
    "holding saucer": "limbs",
    "holding saw": "limbs",
    "holding saxophone": "limbs",
    "holding scalpel": "limbs",
    "holding scepter": "limbs",
    "holding scissors": "limbs",
    "holding screwdriver": "limbs",
    "holding scroll": "limbs",
    "holding seashell": "limbs",
    "holding sex toy": "limbs",
    "holding sheath": "limbs",
    "holding sheet": "limbs",
    "holding shield": "limbs",
    "holding shirt": "limbs",
    "holding shorts": "limbs",
    "holding shovel": "limbs",
    "holding shower head": "limbs",
    "holding sickle": "limbs",
    "holding skateboard": "limbs",
    "holding sketchbook": "limbs",
    "holding skewer": "limbs",
    "holding skull": "limbs",
    "holding slingshot": "limbs",
    "holding smoking pipe": "limbs",
    "holding snake": "limbs",
    "holding snow globe": "limbs",
    "holding sock": "limbs",
    "holding spatula": "limbs",
    "holding sponge": "limbs",
    "holding spoon": "limbs",
    "holding spork": "limbs",
    "holding stethoscope": "limbs",
    "holding stick": "limbs",
    "holding stopwatch": "limbs",
    "holding string": "limbs",
    "holding stuffed toy": "limbs",
    "holding stylus": "limbs",
    "holding suitcase": "limbs",
    "holding surfboard": "limbs",
    "holding swim ring": "limbs",
    "holding swimsuit": "limbs",
    "holding sword": "limbs",
    "holding syringe": "limbs",
    "holding tablet pc": "limbs",
    "holding tank shell": "limbs",
    "holding tanzaku": "limbs",
    "holding teapot": "limbs",
    "holding telescope": "limbs",
    "holding tennis racket": "limbs",
    "holding test tube": "limbs",
    "holding thermometer": "limbs",
    "holding ticket": "limbs",
    "holding tissue": "limbs",
    "holding tongs": "limbs",
    "holding toothbrush": "limbs",
    "holding torch": "limbs",
    "holding torpedo": "limbs",
    "holding towel": "limbs",
    "holding toy": "limbs",
    "holding toy gun": "limbs",
    "holding tray": "limbs",
    "holding tripod": "limbs",
    "holding trombone": "limbs",
    "holding trophy": "limbs",
    "holding trowel": "limbs",
    "holding trumpet": "limbs",
    "holding turret": "limbs",
    "holding turtle": "limbs",
    "holding turtle shell": "limbs",
    "holding ukulele": "limbs",
    "holding umbrella": "limbs",
    "holding underwear": "limbs",
    "holding unworn boots": "limbs",
    "holding unworn cape": "limbs",
    "holding unworn clothes": "limbs",
    "holding unworn dress": "limbs",
    "holding unworn hat": "limbs",
    "holding unworn helmet": "limbs",
    "holding unworn jacket": "limbs",
    "holding unworn necktie": "limbs",
    "holding unworn sandals": "limbs",
    "holding unworn scarf": "limbs",
    "holding unworn shoes": "limbs",
    "holding unworn skirt": "limbs",
    "holding vegetable": "limbs",
    "holding vial": "limbs",
    "holding violin": "limbs",
    "holding walkie-talkie": "limbs",
    "holding wallet": "limbs",
    "holding water gun": "limbs",
    "holding watering can": "limbs",
    "holding weapon": "limbs",
    "holding whisk": "limbs",
    "holding whistle": "limbs",
    "holding wig": "limbs",
    "holding with feet": "limbs",
    "holding with gesture": "limbs",
    "holding with tail": "limbs",
    "holding wreath": "limbs",
    "holding wrench": "limbs",
    "hole in face": "face",
    "hollow mask": "clothes",
    "hollow mouth": "face",
    "holly": "scene",
    "holly hat ornament": "clothes",
    "hollyhock": "scene",
    "hollywood sign": "scene",
    "holy roman empire": "scene",
    "honduras": "scene",
    "honey": "scene",
    "honey cake donut": "scene",
    "honey day": "scene",
    "honey dipper": "scene",
    "honeycomb (pattern)": "clothes",
    "honeycomb background": "scene",
    "honeydew (fruit)": "scene",
    "honeypot": "scene",
    "hong kong": "scene",
    "hongbao": "scene",
    "honggaitou": "clothes",
    "hood": "clothes",
    "hood down": "sexual",
    "hoodie": "clothes",
    "hoop": "pose",
    "hoop earrings": "clothes",
    "hooters": "scene",
    "hopping": "pose",
    "horizon": "scene",
    "horizontal pupils": "face",
    "hormone replacement therapy": "sexual",
    "horn band legwear": "clothes",
    "horn ornament": "clothes",
    "horned helmet": "clothes",
    "horned mask": "clothes",
    "horned melon": "scene",
    "horns pose": "limbs",
    "horrified": "face",
    "horse dildo": "sexual",
    "horse ears": "face",
    "horse mask": "clothes",
    "horse penis": "body",
    "horse pussy": "body",
    "horse racing track": "scene",
    "horseback riding": "pose",
    "hoshiai no sora": "pose",
    "hoshino ruby dance": "pose",
    "hospital": "body",
    "hot cross bun": "scene",
    "hot dog": "scene",
    "hot plate": "scene",
    "hot sauce": "scene",
    "hotel": "scene",
    "hotel room": "scene",
    "houndstooth": "clothes",
    "house": "scene",
    "houston": "scene",
    "houston astros": "pose",
    "houston dynamo": "pose",
    "houston rockets": "pose",
    "houston texans": "pose",
    "hue shifting": "scene",
    "hug": "pose",
    "hug and suck": "sexual",
    "hug from behind": "pose",
    "huge afro": "body",
    "huge ahoge": "body",
    "huge ass": "body",
    "huge bowtie": "clothes",
    "huge breasts": "body",
    "huge clitoris": "sexual",
    "huge dildo": "sexual",
    "huge eyebrows": "face",
    "huge nipples": "body",
    "huge penis": "body",
    "huge testicles": "body",
    "hugging object": "pose",
    "hugging own legs": "pose",
    "hugging tail": "pose",
    "hula": "pose",
    "human ashtray": "sexual",
    "human chair": "sexual",
    "human dog": "sexual",
    "human furniture": "sexual",
    "human table": "sexual",
    "human toilet": "sexual",
    "humanization": "effects",
    "humbler": "sexual",
    "humiliation": "sexual",
    "humping": "pose",
    "hungarian clothes": "clothes",
    "hungary": "scene",
    "hunger hallucination": "scene",
    "hungry": "scene",
    "hurricane glass": "scene",
    "hurt expressions of your wife practice": "face",
    "hut": "scene",
    "hyacinth": "scene",
    "hydrangea": "scene",
    "hydrokinesis": "scene",
    "hyogo prefecture": "scene",
    "hyottoko mask": "clothes",
    "hysterectomy": "sexual",
    "hysterectomy scar": "sexual",
    "ibaraki prefecture": "scene",
    "icchae popotan": "pose",
    "ice": "scene",
    "ice cream": "scene",
    "ice cream cake": "scene",
    "ice cream cone": "scene",
    "ice cream float": "scene",
    "ice cream sandwich": "scene",
    "ice cream scoop (utensil)": "scene",
    "ice cream stand": "scene",
    "ice flower": "scene",
    "ice hockey": "pose",
    "ice play": "sexual",
    "ice sculpture": "scene",
    "ice skating": "pose",
    "ice wings": "body",
    "iced tea": "scene",
    "iceland": "scene",
    "ichigo daifuku": "scene",
    "ichimegasa": "clothes",
    "icing": "scene",
    "icon (computing)": "scene",
    "idle animation": "pose",
    "idol clothes": "clothes",
    "iei": "scene",
    "if they mated": "effects",
    "igeta (pattern)": "clothes",
    "ike! ina-chuu takkyuubu": "pose",
    "ikea shark": "sexual",
    "ikura (food)": "scene",
    "imagawayaki": "scene",
    "image macro (meme)": "scene",
    "image sample": "scene",
    "imageboard colors": "scene",
    "imagining": "pose",
    "imitating": "pose",
    "imminent anal": "sexual",
    "imminent penetration": "sexual",
    "imminent rape": "sexual",
    "imminent torture": "sexual",
    "imminent vaginal": "sexual",
    "impaled": "sexual",
    "implied cunnilingus": "sexual",
    "implied fellatio": "sexual",
    "implied fingering": "sexual",
    "implied footjob": "sexual",
    "implied futanari": "sexual",
    "implied masturbation": "sexual",
    "implied sex": "sexual",
    "implied yaoi": "sexual",
    "implied yuri": "sexual",
    "impossible shirt": "body",
    "impossible swimsuit": "clothes",
    "impregnation": "sexual",
    "impressionism": "scene",
    "in cage": "sexual",
    "in cell": "sexual",
    "in container": "sexual",
    "in food": "scene",
    "in legwear": "clothes",
    "in orbit": "scene",
    "in tree": "scene",
    "in umbrella": "pose",
    "in-n-out burger": "scene",
    "in-universe location": "scene",
    "inarizushi": "scene",
    "inazuma eleven (series)": "pose",
    "incan clothes": "clothes",
    "incest": "sexual",
    "inconvenient breasts": "body",
    "incredibly absurdres": "scene",
    "index finger raised": "limbs",
    "index fingers together": "limbs",
    "india": "scene",
    "indian style": "pose",
    "indiana": "scene",
    "indiana pacers": "pose",
    "indianapolis colts": "pose",
    "indonesia": "pose",
    "indonesian clothes": "clothes",
    "indoors": "scene",
    "industrial": "scene",
    "infirmary": "scene",
    "inflation": "sexual",
    "inrou": "clothes",
    "insect wings": "body",
    "inseki": "sexual",
    "inset border": "scene",
    "instant ramen": "scene",
    "instant soba": "scene",
    "instant udon": "scene",
    "intentional jpeg artifacts": "scene",
    "inter miami cf": "pose",
    "interlocked fingers": "pose",
    "internal cumshot": "sexual",
    "internet overdose": "pose",
    "internet yamero": "pose",
    "intestine hair": "body",
    "intestines": "body",
    "inteyvat flower (genshin impact)": "scene",
    "intravenous drip": "body",
    "inugami-ke no ichizoku pose": "pose",
    "invasion of normandy": "scene",
    "invasion stripes": "clothes",
    "inverted bob": "body",
    "inverted colors": "effects",
    "inverted nipples": "body",
    "inward v": "limbs",
    "iowa": "scene",
    "iran": "scene",
    "iran-iraq war": "scene",
    "iranian clothes": "clothes",
    "iraq": "scene",
    "iraq war": "scene",
    "ireland": "scene",
    "iridescent": "effects",
    "iris (flower)": "scene",
    "iron maiden": "sexual",
    "irrumatio": "sexual",
    "ishidaki": "sexual",
    "ishikawa prefecture": "scene",
    "island": "scene",
    "isometric": "scene",
    "israel": "scene",
    "israel-hamas war": "scene",
    "istanbul": "scene",
    "itabashi (tokyo)": "scene",
    "italian (niigata)": "scene",
    "italian clothes": "clothes",
    "italy": "scene",
    "ivy": "scene",
    "iwate prefecture": "scene",
    "iwo jima": "scene",
    "ixia (flower)": "scene",
    "izakaya": "scene",
    "j. league": "pose",
    "jack box": "scene",
    "jack in the box (restaurant)": "scene",
    "jack-o'-lantern": "scene",
    "jack-o'-lantern hat ornament": "clothes",
    "jacket": "clothes",
    "jacket on shoulders": "clothes",
    "jackfruit": "scene",
    "jade vine": "scene",
    "jalapeno pepper": "scene",
    "jam": "scene",
    "jamaica": "scene",
    "jammers": "clothes",
    "japan": "scene",
    "japanese clothes": "clothes",
    "japanese food": "scene",
    "japari bun": "scene",
    "jar": "scene",
    "jar cake": "scene",
    "jasmine (flower)": "scene",
    "java apple": "scene",
    "jeans": "clothes",
    "jef united": "pose",
    "jelly bean": "scene",
    "jelly donut (food)": "scene",
    "jellyfish cut": "body",
    "jersey": "pose",
    "jersey maid": "clothes",
    "jerusalem": "scene",
    "jester cap": "clothes",
    "jetty": "scene",
    "jewel butt plug": "sexual",
    "jiao bei jiu": "scene",
    "jiaozi": "scene",
    "jin (headwear)": "clothes",
    "jingasa": "clothes",
    "jinggu ji (hairstyle)": "body",
    "jingle bell": "clothes",
    "jirai kei": "clothes",
    "jirou (ramen)": "scene",
    "jitome": "face",
    "jo lolita": "clothes",
    "jockstrap": "clothes",
    "joints": "body",
    "jojo pose": "pose",
    "jollibee": "scene",
    "jollibee (mascot)": "scene",
    "jonathan joestar's pose": "pose",
    "jordan": "scene",
    "josou seme": "sexual",
    "jpeg artifacts": "scene",
    "jr central towers": "scene",
    "jubilo iwata": "pose",
    "judas cradle": "sexual",
    "judo": "pose",
    "jue (vessel)": "scene",
    "jug (bottle)": "scene",
    "juggling": "pose",
    "juggling club": "pose",
    "juice": "scene",
    "juice box": "scene",
    "jujube (fruit)": "scene",
    "juliet sleeves": "clothes",
    "jumeok-bap": "scene",
    "jumping": "pose",
    "jumpsuit": "clothes",
    "jungle": "scene",
    "junkyard": "scene",
    "juventus fc": "pose",
    "kabaddi": "pose",
    "kabayaki": "scene",
    "kabuto (helmet)": "clothes",
    "kadomatsu": "scene",
    "kagami mochi": "scene",
    "kagawa prefecture": "scene",
    "kagome (pattern)": "clothes",
    "kagoshima prefecture": "scene",
    "kamaboko": "scene",
    "kamakura (city)": "scene",
    "kamchatka lily": "scene",
    "kame house": "scene",
    "kamina pose": "limbs",
    "kamina shades": "clothes",
    "kaminarimon": "scene",
    "kamogawa (chiba)": "scene",
    "kanagawa prefecture": "scene",
    "kanazawa (city)": "scene",
    "kanda shrine": "scene",
    "kani-san wiener": "scene",
    "kanji focus": "effects",
    "kankaku shadan": "sexual",
    "kanoko (pattern)": "clothes",
    "kansas city chiefs": "pose",
    "kanzashi": "clothes",
    "kaohsiung": "scene",
    "kappa mask": "clothes",
    "karakalpak clothes": "clothes",
    "karakusa (pattern)": "clothes",
    "karashi mentaiko": "scene",
    "karawamage": "body",
    "kashima antlers": "pose",
    "kashiwa mochi": "scene",
    "kashiwa mochi (food)": "scene",
    "kashiwa reysol": "pose",
    "katsu (food)": "scene",
    "katsudon (food)": "scene",
    "katsuo no tataki": "scene",
    "katsuyamamage": "body",
    "kawagoe (saitama)": "scene",
    "kawasaki (kanagawa)": "scene",
    "kawasaki frontale": "pose",
    "kazakh clothes": "clothes",
    "kazakhstan": "scene",
    "kaze no daichi": "pose",
    "kbo league": "pose",
    "keffiyeh": "clothes",
    "kefir": "scene",
    "kemari": "pose",
    "kemonomimi mode": "face",
    "kendo mask": "clothes",
    "kenya": "scene",
    "kepi": "clothes",
    "kerria japonica": "scene",
    "kesa": "clothes",
    "ketchup": "scene",
    "ketchup bottle": "scene",
    "kettle": "scene",
    "kettle helm": "clothes",
    "key choker": "clothes",
    "key necklace": "clothes",
    "kfc": "scene",
    "kia tigers": "pose",
    "kicking": "sexual",
    "kidnapping": "pose",
    "kigurumi": "clothes",
    "kikkoumon": "clothes",
    "kikumon": "clothes",
    "kill me dance": "pose",
    "kilt": "clothes",
    "kiltie loafers": "clothes",
    "kimchi": "scene",
    "kimono": "clothes",
    "kimono down": "sexual",
    "kimono lift": "sexual",
    "kimono pull": "sexual",
    "kimono skirt": "clothes",
    "kinky hair": "body",
    "kinoko no yama": "scene",
    "kinpira gobo": "scene",
    "kippah": "clothes",
    "kirigami": "scene",
    "kiritanpo (food)": "scene",
    "kishimen hair": "body",
    "kiss": "pose",
    "kiss day": "scene",
    "kissing foot": "body",
    "kissing hair": "body",
    "kissing neck": "clothes",
    "kissing through mask": "clothes",
    "kita (tokyo)": "scene",
    "kitchen": "scene",
    "kitchen scale": "scene",
    "kitkat": "scene",
    "kitsune dance": "pose",
    "kitsune no mado": "limbs",
    "kitsune udon": "scene",
    "kiwi (fruit)": "scene",
    "kiwi print": "clothes",
    "kiwi slice": "scene",
    "knee boots": "clothes",
    "knee pads": "clothes",
    "knee strap": "clothes",
    "knee up": "pose",
    "kneehighs": "clothes",
    "kneeing": "sexual",
    "kneeling": "pose",
    "kneepit sex": "sexual",
    "kneepits": "body",
    "knees": "body",
    "knees apart feet together": "pose",
    "knees out of frame": "scene",
    "knees to chest": "sexual",
    "knees together feet apart": "pose",
    "knees up": "pose",
    "knife": "scene",
    "knife in hair": "body",
    "knit leg warmers": "clothes",
    "knit legwear": "clothes",
    "knit pantyhose": "clothes",
    "knit socks": "clothes",
    "knit thighhighs": "clothes",
    "knitting": "pose",
    "knocking": "pose",
    "knotted penis": "body",
    "knotting": "sexual",
    "knuckle hair": "clothes",
    "kobe": "scene",
    "kobeya uniform": "scene",
    "kochi prefecture": "scene",
    "kodomo no hi": "scene",
    "kogal": "clothes",
    "koi dance": "pose",
    "koinobori": "scene",
    "kojitsunagi (pattern)": "clothes",
    "kokoshnik": "clothes",
    "kongou pose": "pose",
    "konnyaku (food)": "scene",
    "konpeitou": "scene",
    "korea": "scene",
    "korean clothes": "clothes",
    "korean food": "scene",
    "korean war": "scene",
    "kosovo": "scene",
    "kote": "clothes",
    "koto (tokyo)": "scene",
    "kotoyoro": "scene",
    "kourindou": "scene",
    "krispy kreme": "scene",
    "kuala lumpur": "scene",
    "kubrick stare": "face",
    "kudoyama (town)": "scene",
    "kuji-in": "limbs",
    "kujo jotaro's pose": "pose",
    "kujou karen pose": "pose",
    "kumamoto castle": "scene",
    "kumamoto prefecture": "scene",
    "kuomintang": "scene",
    "kure (city)": "scene",
    "kuroko no basuke": "pose",
    "kurokote": "clothes",
    "kusatsu (city)": "scene",
    "kyojin no hoshi": "pose",
    "kyoto (city)": "scene",
    "kyoto prefecture": "scene",
    "kyoto sanga f.c.": "pose",
    "kyrgyz clothes": "clothes",
    "kyrgyzstan": "scene",
    "l hand": "limbs",
    "la liga": "pose",
    "labia": "body",
    "labia clamps": "sexual",
    "labiaplasty": "sexual",
    "laboratory": "scene",
    "lace": "clothes",
    "lace background": "scene",
    "lace choker": "clothes",
    "lace gloves": "clothes",
    "lace legwear": "clothes",
    "lace pantyhose": "clothes",
    "lace socks": "clothes",
    "lace thighhighs": "clothes",
    "lace trim": "clothes",
    "lace-trimmed ascot": "clothes",
    "lace-trimmed choker": "clothes",
    "lace-trimmed collar": "clothes",
    "lace-trimmed gloves": "clothes",
    "lace-trimmed leg warmers": "clothes",
    "lace-trimmed leggings": "clothes",
    "lace-trimmed legwear": "clothes",
    "lace-trimmed pantyhose": "clothes",
    "lace-trimmed sleeves": "clothes",
    "lace-trimmed socks": "clothes",
    "lace-trimmed thighhighs": "clothes",
    "lace-up boots": "clothes",
    "lace-up legwear": "clothes",
    "lacrosse": "pose",
    "lactating into container": "body",
    "lactation": "sexual",
    "lactation through clothes": "sexual",
    "ladle": "scene",
    "ladybug wings": "body",
    "lake": "scene",
    "lamp": "clothes",
    "lamppost": "effects",
    "landing": "pose",
    "landscape": "scene",
    "lantana (flower)": "scene",
    "lantern": "scene",
    "lantern on liquid": "scene",
    "lanyard": "clothes",
    "lao gan ma": "scene",
    "laos": "scene",
    "lap dance": "pose",
    "lapel pin": "clothes",
    "lapels": "clothes",
    "lappet": "clothes",
    "large areolae": "body",
    "large breasts": "body",
    "large buttons": "clothes",
    "large clitoris": "sexual",
    "large head wings": "body",
    "large insertion": "sexual",
    "large nose": "face",
    "large penis": "body",
    "large testicles": "body",
    "lariat (necklace)": "clothes",
    "larkspur (flower)": "scene",
    "las vegas": "scene",
    "las vegas raiders": "pose",
    "lasagne": "scene",
    "latex": "sexual",
    "latex gloves": "clothes",
    "latex legwear": "clothes",
    "latte art": "scene",
    "latvia": "scene",
    "laughing": "pose",
    "launching": "pose",
    "laurel crown": "clothes",
    "lava": "scene",
    "lava cake": "scene",
    "lavender (flower)": "scene",
    "lay's (potato chips)": "scene",
    "layer cake": "scene",
    "layered gloves": "clothes",
    "layered kimono": "clothes",
    "layered legwear": "clothes",
    "layered sleeves": "clothes",
    "lazy eye": "face",
    "leaf": "scene",
    "leaf background": "scene",
    "leaf bikini": "clothes",
    "leaf hat ornament": "clothes",
    "leaf necklace": "clothes",
    "leaf print": "clothes",
    "leaning": "pose",
    "leaning back": "pose",
    "leaning forward": "pose",
    "leaning tower of pisa": "scene",
    "leash": "sexual",
    "leash on penis": "sexual",
    "leash pull": "sexual",
    "leather gloves": "clothes",
    "leather mask": "clothes",
    "lecturing": "pose",
    "left-to-right manga": "scene",
    "leg belt": "clothes",
    "leg cutout": "sexual",
    "leg focus": "effects",
    "leg lift": "pose",
    "leg lock": "pose",
    "leg ribbon": "clothes",
    "leg up": "pose",
    "leg warmers": "clothes",
    "leg wings": "body",
    "leggings": "clothes",
    "legjob": "sexual",
    "legs": "body",
    "legs apart": "pose",
    "legs bound apart": "sexual",
    "legs over head": "sexual",
    "legs up": "sexual",
    "legskin": "clothes",
    "legwear": "body",
    "legwear bell": "clothes",
    "legwear garter": "clothes",
    "lei": "clothes",
    "leicester city fc": "pose",
    "lemon": "scene",
    "lemon blossoms": "scene",
    "lemon cake": "scene",
    "lemon meringue pie": "scene",
    "lemon print": "clothes",
    "lemon slice": "scene",
    "lemon torture": "sexual",
    "lemonade": "scene",
    "lens eye": "face",
    "lens flare": "scene",
    "leopard print": "clothes",
    "leotard": "clothes",
    "leotard aside": "sexual",
    "leotard pull": "sexual",
    "lesbians doing makeup (meme)": "clothes",
    "letter pose": "pose",
    "letterboxed": "scene",
    "letterman jacket": "clothes",
    "lettuce": "scene",
    "lgbt (4chan)": "sexual",
    "lgbt pride": "sexual",
    "liangbatou": "body",
    "liberia": "scene",
    "library": "scene",
    "libya": "scene",
    "licking": "pose",
    "licking another's cheek": "pose",
    "licking another's face": "pose",
    "licking another's hair": "body",
    "licking armpit": "sexual",
    "licking blade": "pose",
    "licking breast": "pose",
    "licking cum": "pose",
    "licking ear": "pose",
    "licking eye": "pose",
    "licking finger": "pose",
    "licking floor": "pose",
    "licking foot": "sexual",
    "licking leg": "pose",
    "licking navel": "pose",
    "licking nipple": "pose",
    "licking panties": "pose",
    "licking testicle": "sexual",
    "licking thigh": "pose",
    "lifting": "pose",
    "lifting covers": "sexual",
    "liga mx": "pose",
    "light areolae": "body",
    "light hawk wings": "body",
    "light persona": "effects",
    "light rays": "effects",
    "light smile": "face",
    "light-skinned soles": "body",
    "lighter": "scene",
    "lighthouse": "scene",
    "lighting match": "scene",
    "lightning": "scene",
    "lightning background": "scene",
    "lightning bolt necklace": "clothes",
    "lightning bolt-shaped pupils": "face",
    "ligne claire": "scene",
    "ligue 1": "pose",
    "lilac": "scene",
    "lily (flower)": "scene",
    "lily of the valley": "scene",
    "lily pad": "scene",
    "lily print": "clothes",
    "lime (fruit)": "scene",
    "lime slice": "scene",
    "limited palette": "effects",
    "linea alba": "body",
    "linear hatching": "scene",
    "lineart": "scene",
    "lineup": "scene",
    "lingerie": "clothes",
    "lion dance": "scene",
    "lion ears": "face",
    "lion mask": "clothes",
    "lip balm": "clothes",
    "lipgloss": "clothes",
    "lips": "clothes",
    "lipstick": "clothes",
    "lipstick mark": "clothes",
    "lipstick mark on another's lips": "clothes",
    "lipstick mark on anus": "clothes",
    "lipstick mark on arm": "clothes",
    "lipstick mark on armpit": "clothes",
    "lipstick mark on ass": "clothes",
    "lipstick mark on back": "clothes",
    "lipstick mark on background": "clothes",
    "lipstick mark on breast": "clothes",
    "lipstick mark on cat": "clothes",
    "lipstick mark on chest": "clothes",
    "lipstick mark on cigarette": "clothes",
    "lipstick mark on clothes": "clothes",
    "lipstick mark on collarbone": "clothes",
    "lipstick mark on condom": "clothes",
    "lipstick mark on cup": "clothes",
    "lipstick mark on dildo": "clothes",
    "lipstick mark on ear": "clothes",
    "lipstick mark on face": "clothes",
    "lipstick mark on foot": "clothes",
    "lipstick mark on forehead": "clothes",
    "lipstick mark on hair": "clothes",
    "lipstick mark on hand": "clothes",
    "lipstick mark on leg": "clothes",
    "lipstick mark on lips": "clothes",
    "lipstick mark on mouth": "clothes",
    "lipstick mark on neck": "clothes",
    "lipstick mark on penis": "clothes",
    "lipstick mark on phone": "clothes",
    "lipstick mark on photo": "clothes",
    "lipstick mark on pussy": "clothes",
    "lipstick mark on shoulder": "clothes",
    "lipstick mark on stomach": "clothes",
    "lipstick mark on testicles": "clothes",
    "lipstick ring": "clothes",
    "lipstick tube": "clothes",
    "lipstick writing": "clothes",
    "lipton": "scene",
    "liquid hair": "body",
    "liquid wings": "body",
    "liquor": "scene",
    "lithuania": "scene",
    "lithuanian clothes": "clothes",
    "little caesar": "scene",
    "little caesars": "scene",
    "live2d": "scene",
    "liver": "body",
    "liverpool fc": "pose",
    "living hair": "body",
    "living room": "scene",
    "loaf of bread": "scene",
    "loafers": "clothes",
    "lobster": "scene",
    "location request": "scene",
    "locked arms": "pose",
    "locker room": "scene",
    "locket": "clothes",
    "loco moco": "scene",
    "log": "scene",
    "logo": "scene",
    "loincloth": "clothes",
    "loli": "sexual",
    "lolita fashion": "clothes",
    "lollipop": "scene",
    "lombard street": "scene",
    "london": "scene",
    "lone nape hair": "body",
    "lonely": "face",
    "long bangs": "body",
    "long coat": "clothes",
    "long eyebrows": "face",
    "long fingernails": "clothes",
    "long hair": "body",
    "long labia": "body",
    "long legs": "body",
    "long neck": "clothes",
    "long nipples": "body",
    "long nose": "face",
    "long pointy ears": "face",
    "long skirt": "clothes",
    "long sleeves": "clothes",
    "long spout teapot": "scene",
    "long toenails": "body",
    "long tongue": "body",
    "longan": "scene",
    "longevity peach bun": "scene",
    "longpao": "clothes",
    "look-alike": "character",
    "looking": "pose",
    "looking afar": "pose",
    "looking around": "face",
    "looking at another": "face",
    "looking at breasts": "face",
    "looking at creature": "face",
    "looking at crotch": "face",
    "looking at hand": "face",
    "looking at hands": "face",
    "looking at mirror": "face",
    "looking at object": "face",
    "looking at penis": "face",
    "looking at phone": "face",
    "looking at pussy": "face",
    "looking at self": "face",
    "looking at viewer": "pose",
    "looking back": "pose",
    "looking down": "pose",
    "looking for glasses": "clothes",
    "looking outside": "face",
    "looking over eyewear": "clothes",
    "looking through own legs": "face",
    "looking to the side": "pose",
    "looking up": "pose",
    "looping animation": "scene",
    "loose bowtie": "clothes",
    "loose hair strand": "body",
    "loose necktie": "clothes",
    "loose socks": "clothes",
    "loquat": "scene",
    "lorgnette": "clothes",
    "los angeles": "scene",
    "los angeles angels": "pose",
    "los angeles clippers": "pose",
    "los angeles dodgers": "pose",
    "los angeles kings": "pose",
    "los angeles lakers": "pose",
    "los angeles rams": "pose",
    "lossless-lossy": "scene",
    "lossy-lossless": "scene",
    "lotion": "sexual",
    "lotion bottle": "sexual",
    "lotus": "scene",
    "lotus position": "pose",
    "lotus root": "scene",
    "louisiana": "scene",
    "louvre pyramid": "scene",
    "love hotel": "scene",
    "love train": "sexual",
    "love&joy": "pose",
    "low neckline": "clothes",
    "low poly": "effects",
    "low ponytail": "body",
    "low side ponytail": "body",
    "low twin braids": "body",
    "low twintails": "body",
    "low wings": "body",
    "low-braided long hair": "body",
    "low-cut armhole": "sexual",
    "low-tied long hair": "body",
    "low-tied sidelocks": "body",
    "lower body": "scene",
    "lowleg bikini": "clothes",
    "lowleg pants": "clothes",
    "lowleg shorts": "clothes",
    "lowleg skirt": "clothes",
    "lube": "sexual",
    "luchador mask": "clothes",
    "lumen field": "scene",
    "lunar tear": "scene",
    "lunch": "scene",
    "lunchbox": "scene",
    "lungs": "body",
    "luo ji (hairstyle)": "body",
    "lupinus (flower)": "scene",
    "luqaimat": "scene",
    "luxembourg": "scene",
    "luxor obelisk": "scene",
    "lychee": "scene",
    "lying": "pose",
    "m eyebrows": "face",
    "m&m's": "scene",
    "m1 helmet": "clothes",
    "m43 field cap": "clothes",
    "macarena (dance)": "pose",
    "macaron": "scene",
    "macaron tower": "scene",
    "macau": "scene",
    "machu picchu": "scene",
    "madagascar": "scene",
    "madeleine": "scene",
    "madrid": "scene",
    "maebari": "clothes",
    "magatama": "clothes",
    "magatama necklace": "clothes",
    "magazine cover": "scene",
    "magnolia": "scene",
    "maid": "clothes",
    "maid bikini": "clothes",
    "maid cafe": "scene",
    "maid day": "scene",
    "maid headdress": "clothes",
    "maitake dance": "pose",
    "maizuru (city)": "scene",
    "major": "pose",
    "major 2nd": "pose",
    "major injury underreaction": "body",
    "major league baseball": "pose",
    "major league soccer": "pose",
    "makai (touhou)": "scene",
    "makeup": "clothes",
    "makeup brush": "clothes",
    "makeup palette": "clothes",
    "makeup sponge": "clothes",
    "makisu": "scene",
    "makizushi": "scene",
    "malawi": "scene",
    "malaysia": "scene",
    "malaysian clothes": "clothes",
    "male focus": "character",
    "male futanari": "sexual",
    "male maid": "sexual",
    "male masturbation": "sexual",
    "male on futa": "sexual",
    "male penetrated": "sexual",
    "male swimwear": "clothes",
    "male underwear": "clothes",
    "male underwear pull": "sexual",
    "male with breasts": "sexual",
    "male-female symbol": "sexual",
    "mall": "scene",
    "mamemaki": "scene",
    "mamezara": "scene",
    "manba gyaru": "clothes",
    "manboobs": "sexual",
    "manchester city fc": "pose",
    "manchester united": "pose",
    "manchu clothes": "clothes",
    "mandarin collar": "clothes",
    "mandarin orange": "scene",
    "mandoline (utensil)": "scene",
    "manga cover": "scene",
    "manga day": "scene",
    "mangekyou sharingan": "face",
    "mango": "scene",
    "mangosteen": "scene",
    "mao cap": "clothes",
    "maple leaf": "scene",
    "maple leaf print": "clothes",
    "maple syrup": "scene",
    "mapo tofu": "scene",
    "marble (toy)": "pose",
    "marble background": "scene",
    "marble cake (food)": "scene",
    "marble chocolate": "scene",
    "marching": "pose",
    "marcille breakdance (meme)": "pose",
    "margarita": "scene",
    "margherita pizza": "scene",
    "marigold": "scene",
    "marijuana": "scene",
    "marina": "scene",
    "marine day": "scene",
    "mario golf": "pose",
    "mario hoops 3-on-3": "pose",
    "mario strikers (series)": "pose",
    "mario tennis": "pose",
    "maritime port": "scene",
    "maritozzo": "scene",
    "market": "scene",
    "market stall": "scene",
    "marmalade": "scene",
    "marquee lights": "clothes",
    "marseille": "scene",
    "marsh marigold": "scene",
    "marshmallow": "scene",
    "martini": "scene",
    "marumage": "body",
    "mary janes": "clothes",
    "maryland": "scene",
    "mascara": "clothes",
    "mascara wand": "clothes",
    "mashed potatoes": "scene",
    "mask": "clothes",
    "mask around neck": "clothes",
    "mask around one ear": "clothes",
    "mask bikini": "clothes",
    "mask lift": "clothes",
    "mask on belt": "clothes",
    "mask on breasts": "clothes",
    "mask on crotch": "clothes",
    "mask on hat": "clothes",
    "mask on head": "clothes",
    "mask on shoulder": "clothes",
    "mask over one eye": "clothes",
    "mask pull": "clothes",
    "masked": "clothes",
    "masochism": "sexual",
    "masquerade mask": "clothes",
    "massachusetts": "scene",
    "mastectomy": "sexual",
    "mastectomy scar": "sexual",
    "masturbation": "sexual",
    "masturbation through clothes": "sexual",
    "masturbation under clothes": "sexual",
    "masu": "scene",
    "matchbook": "scene",
    "matchbox": "scene",
    "matchstick": "scene",
    "material growth": "clothes",
    "mating (animal)": "sexual",
    "mating press": "sexual",
    "matsu symbol": "clothes",
    "matsudo (chiba)": "scene",
    "matsue castle": "scene",
    "matsuyama (ehime)": "scene",
    "mature female": "sexual",
    "mature male": "sexual",
    "mayan clothes": "clothes",
    "mayonnaise": "scene",
    "mayonnaise bottle": "scene",
    "mcbling": "clothes",
    "mcc threesome": "sexual",
    "mcdonald's": "scene",
    "mcnugget buddy": "scene",
    "md5 mismatch": "scene",
    "mdd threesome": "sexual",
    "me!me!me! dance (meme)": "pose",
    "meadow": "scene",
    "meal": "scene",
    "meandros": "clothes",
    "measuring": "pose",
    "measuring cup": "scene",
    "meat": "scene",
    "meat day": "scene",
    "meat floss": "scene",
    "meat grinder": "scene",
    "meatball": "scene",
    "mecha focus": "effects",
    "mecha on girl": "sexual",
    "mecha pilot suit": "clothes",
    "mechanical eyes": "face",
    "mechanical hair": "body",
    "mechanical hands": "clothes",
    "mechanical tentacles": "sexual",
    "mechanical wings": "body",
    "mechanization": "effects",
    "medallion": "clothes",
    "median furrow": "body",
    "medici collar": "clothes",
    "medium breasts": "body",
    "medium hair": "body",
    "megalobox": "pose",
    "megamac": "scene",
    "megastructure": "scene",
    "meiji (brand)": "scene",
    "meiji schoolgirl uniform": "clothes",
    "melbourne": "scene",
    "melbourne victory fc": "pose",
    "melon": "scene",
    "melon bread": "scene",
    "melon soda": "scene",
    "melting": "pose",
    "memphis grizzlies": "pose",
    "menma": "scene",
    "menorah": "scene",
    "menpu": "clothes",
    "menu": "scene",
    "meringue": "scene",
    "merry christmas": "scene",
    "mesa": "scene",
    "mesmerizer (vocaloid)": "pose",
    "mess kit": "scene",
    "messy hair": "body",
    "messy room": "scene",
    "metal collar": "clothes",
    "metal mask": "clothes",
    "metal skin": "body",
    "metoidioplasty": "sexual",
    "mexican clothes": "clothes",
    "mexican revolution": "scene",
    "mexican-american war": "scene",
    "mexico": "scene",
    "mexico city": "scene",
    "mfd threesome": "sexual",
    "mfo threesome": "sexual",
    "miami": "scene",
    "miami heat": "pose",
    "miami marlins": "pose",
    "mian guan": "clothes",
    "miao clothes": "clothes",
    "michigan": "scene",
    "micro bikini": "clothes",
    "micro shorts": "clothes",
    "microskirt": "clothes",
    "microwave": "scene",
    "mid-autumn festival": "scene",
    "midair": "pose",
    "middle finger": "limbs",
    "middle part": "body",
    "middle w": "limbs",
    "midriff": "sexual",
    "midriff sarashi": "clothes",
    "mie prefecture": "scene",
    "miko": "clothes",
    "miku day": "scene",
    "milan": "scene",
    "milan cathedral": "scene",
    "milestone celebration": "scene",
    "military base": "scene",
    "military goth": "clothes",
    "military hat": "clothes",
    "military lolita": "clothes",
    "military uniform": "clothes",
    "milk": "scene",
    "milk bag": "scene",
    "milk bottle": "scene",
    "milk carton": "scene",
    "milk churn": "scene",
    "milk mustache": "scene",
    "milk tea": "scene",
    "milking machine": "sexual",
    "milkshake": "scene",
    "mille-feuille": "scene",
    "milwaukee brewers": "pose",
    "milwaukee bucks": "pose",
    "mimosa (flower)": "scene",
    "minaret": "scene",
    "minato (tokyo)": "scene",
    "mind break": "sexual",
    "mind control": "pose",
    "mind reading": "pose",
    "mini crown": "clothes",
    "mini flag": "scene",
    "mini hat": "clothes",
    "mini santa hat": "clothes",
    "mini shako cap": "clothes",
    "mini top hat": "clothes",
    "mini wings": "body",
    "mini witch hat": "clothes",
    "miniboy": "sexual",
    "minigirl": "sexual",
    "minimalism": "scene",
    "miniskirt": "clothes",
    "minna no golf": "pose",
    "minnesota": "scene",
    "minnesota timberwolves": "pose",
    "minnesota twins": "pose",
    "minnesota vikings": "pose",
    "minnesota wild": "pose",
    "mino boushi": "clothes",
    "minoan clothes": "clothes",
    "mint": "scene",
    "mirror": "clothes",
    "mirror glaze": "scene",
    "mismatched eyebrows": "face",
    "mismatched eyelashes": "clothes",
    "mismatched eyeshadow": "clothes",
    "mismatched gloves": "clothes",
    "mismatched irises": "face",
    "mismatched legwear": "clothes",
    "mismatched pupils": "face",
    "mismatched sclera": "face",
    "mismatched sleeves": "clothes",
    "miso soup": "scene",
    "missing eye": "face",
    "missing headwear": "clothes",
    "missing legwear": "clothes",
    "missing tail": "effects",
    "missing thumbnail": "scene",
    "missing wings": "body",
    "missionary": "sexual",
    "mister donut": "scene",
    "mistletoe": "scene",
    "misty lake": "scene",
    "misunderstanding": "pose",
    "mito hollyhock": "pose",
    "mitre": "clothes",
    "mitsumame": "scene",
    "mittens": "clothes",
    "mixed signals": "scene",
    "mixed-sex bathing": "pose",
    "mixer (cooking)": "scene",
    "mixue": "scene",
    "miyagi prefecture": "scene",
    "miyazaki prefecture": "scene",
    "mizu happi": "clothes",
    "mizura": "body",
    "mmc threesome": "sexual",
    "mmd threesome": "sexual",
    "mmf threesome": "sexual",
    "mmm threesome": "sexual",
    "mmo threesome": "sexual",
    "moai": "scene",
    "moaning": "pose",
    "mob cap": "clothes",
    "mob face": "face",
    "mochi": "scene",
    "mochi mochi dance": "pose",
    "mochitsuki": "scene",
    "mod fashion": "clothes",
    "mode gakuen cocoon tower": "scene",
    "model building": "pose",
    "moero! top striker": "pose",
    "mohawk": "body",
    "moire": "scene",
    "mojito": "scene",
    "moldova": "scene",
    "mole on breast": "body",
    "molestation": "sexual",
    "molotov cocktail": "scene",
    "momiji manjuu": "scene",
    "monaco (city)": "scene",
    "money gesture": "limbs",
    "money-shaped pupils": "face",
    "mongkhon": "clothes",
    "mongolia": "scene",
    "mongolian clothes": "clothes",
    "monk shoes": "clothes",
    "monkey costume": "clothes",
    "monkey ears": "face",
    "monkey mask": "clothes",
    "monochrome": "effects",
    "monochrome background": "scene",
    "monocle": "clothes",
    "monokini": "clothes",
    "mons pubis": "body",
    "monster": "character",
    "monster energy": "scene",
    "monster focus": "scene",
    "monsterification": "effects",
    "mont blanc (food)": "scene",
    "mont st-michel": "scene",
    "montedio yamagata": "pose",
    "montenegro": "scene",
    "montreal canadiens": "pose",
    "montreal expos": "pose",
    "moon": "scene",
    "moon gate": "scene",
    "moon print": "clothes",
    "moon rabbit": "scene",
    "moon-shaped pupils": "face",
    "moonbeam": "effects",
    "mooncake": "scene",
    "moonflower (flower)": "scene",
    "mooning": "pose",
    "moonlight": "effects",
    "moonwalk": "pose",
    "more muscular than canon": "effects",
    "morgue": "scene",
    "mori kei": "clothes",
    "morinaga (brand)": "scene",
    "morinaga chocoball": "scene",
    "morioka": "scene",
    "moriya shrine": "scene",
    "morning": "scene",
    "morning after": "scene",
    "morning glory": "scene",
    "morning glory print": "clothes",
    "morocco": "scene",
    "mortarboard": "clothes",
    "mos burger": "scene",
    "mosaic art": "scene",
    "mosaic background": "scene",
    "moscow": "scene",
    "moscow kremlin": "scene",
    "mosque": "scene",
    "moss": "scene",
    "motel": "scene",
    "moth wings": "body",
    "mother's day": "scene",
    "motion blur": "scene",
    "motion lines": "scene",
    "motorcycle helmet": "clothes",
    "motteke! serafuku": "pose",
    "mount fuji": "scene",
    "mount rushmore": "scene",
    "mountain": "scene",
    "mountain dew": "scene",
    "mountain focus": "effects",
    "mounting": "sexual",
    "mouse costume": "clothes",
    "mouse ears": "face",
    "mouse mask": "clothes",
    "mouth": "face",
    "mouth drool": "face",
    "mouth focus": "effects",
    "mouth mask": "clothes",
    "mouth veil": "clothes",
    "mouth-related": "face",
    "move chart": "scene",
    "movie theater": "scene",
    "mozambique": "scene",
    "mp3 player": "clothes",
    "mr. fullswing": "pose",
    "muay thai": "pose",
    "muff": "clothes",
    "muffin": "scene",
    "mug": "scene",
    "mulberry": "scene",
    "mullet": "body",
    "multi-tied hair": "body",
    "multicolor-tinted eyewear": "clothes",
    "multicolored": "clothes",
    "multicolored ascot": "clothes",
    "multicolored background": "scene",
    "multicolored bowtie": "clothes",
    "multicolored eyes": "face",
    "multicolored eyeshadow": "clothes",
    "multicolored gloves": "clothes",
    "multicolored hair": "body",
    "multicolored headwear": "clothes",
    "multicolored leg warmers": "clothes",
    "multicolored leggings": "clothes",
    "multicolored legwear": "clothes",
    "multicolored lips": "clothes",
    "multicolored pantyhose": "clothes",
    "multicolored scarf": "clothes",
    "multicolored skin": "body",
    "multicolored sleeves": "clothes",
    "multicolored socks": "clothes",
    "multicolored stripes": "clothes",
    "multicolored thighhighs": "clothes",
    "multicolored wings": "body",
    "multiple 4koma": "scene",
    "multiple anal": "sexual",
    "multiple boys": "character",
    "multiple braids": "body",
    "multiple dogs": "character",
    "multiple expressions": "face",
    "multiple girls": "character",
    "multiple insertions": "sexual",
    "multiple monochrome": "scene",
    "multiple others": "character",
    "multiple penis fellatio": "sexual",
    "multiple persona": "character",
    "multiple reverse traps": "sexual",
    "multiple scoops": "scene",
    "multiple theme colors": "effects",
    "multiple traps": "sexual",
    "multiple views": "character",
    "multiple wings": "body",
    "multitasking": "pose",
    "mundane made awesome": "scene",
    "muneate": "clothes",
    "muscle awe": "face",
    "muscular": "sexual",
    "muscular female": "sexual",
    "muscular male": "sexual",
    "muscular other": "sexual",
    "museum": "scene",
    "mushroom": "scene",
    "music video": "scene",
    "musical note print": "clothes",
    "musical note-shaped pupils": "face",
    "mustache": "body",
    "mustard": "scene",
    "mustard bottle": "scene",
    "muted colors": "effects",
    "mutilation": "sexual",
    "mutual breast sucking": "body",
    "mutual masturbation": "sexual",
    "mutual tail biting": "pose",
    "muzzle flash": "effects",
    "myanmar": "scene",
    "myouren temple": "scene",
    "mystical high collar": "clothes",
    "nabe": "scene",
    "nae nae (dance)": "pose",
    "nagaimo (food)": "scene",
    "nagano prefecture": "scene",
    "nagasaki (city)": "scene",
    "nagasaki prefecture": "scene",
    "nagoya (city)": "scene",
    "nagoya castle": "scene",
    "nagoya grampus": "pose",
    "naha city": "scene",
    "nail (hardware) torture": "sexual",
    "nail art": "clothes",
    "nail biting": "pose",
    "nail ornament": "clothes",
    "nail polish": "clothes",
    "nail polish bottle": "clothes",
    "nail polish brush": "clothes",
    "naizuri": "sexual",
    "nakano (tokyo)": "scene",
    "naked apron": "sexual",
    "naked bandage": "sexual",
    "naked cape": "sexual",
    "naked capelet": "sexual",
    "naked chocolate": "sexual",
    "naked cloak": "sexual",
    "naked coat": "sexual",
    "naked hoodie": "sexual",
    "naked jacket": "sexual",
    "naked overalls": "sexual",
    "naked ribbon": "sexual",
    "naked robe": "sexual",
    "naked scarf": "sexual",
    "naked sheet": "sexual",
    "naked shirt": "sexual",
    "naked suspenders": "sexual",
    "naked tabard": "sexual",
    "naked towel": "sexual",
    "namagashi": "scene",
    "namek": "scene",
    "nameless hill": "scene",
    "namibia": "scene",
    "nanakusa-no-sekku": "scene",
    "nantaimori": "sexual",
    "nanzen-ji aqueduct": "scene",
    "nape": "clothes",
    "napkin": "scene",
    "naples": "scene",
    "napoleonic wars": "scene",
    "nara (city)": "scene",
    "nara prefecture": "scene",
    "narrow waist": "body",
    "narrowed eyes": "face",
    "naruto (series)": "body",
    "narutomaki": "scene",
    "nashi pear": "scene",
    "national basketball association": "pose",
    "national diet building": "scene",
    "national football league": "pose",
    "national hockey league": "pose",
    "native american clothes": "clothes",
    "native american headdress": "clothes",
    "nattou": "scene",
    "naturally detached hair": "body",
    "nature": "scene",
    "naughty face": "sexual",
    "navel": "body",
    "navel cutout": "sexual",
    "navel focus": "scene",
    "navel sex": "sexual",
    "nazca lines": "scene",
    "nba jam": "pose",
    "neapolitan palette": "effects",
    "nearly naked apron": "sexual",
    "neck": "clothes",
    "neck bell": "clothes",
    "neck focus": "effects",
    "neck ribbon": "clothes",
    "neck ribbon grab": "clothes",
    "neck ring": "clothes",
    "neck ruff": "clothes",
    "neck tassel": "clothes",
    "neck violin": "sexual",
    "neck warmer": "clothes",
    "neckerchief": "clothes",
    "neckerchief grab": "clothes",
    "necklace": "clothes",
    "necktie": "clothes",
    "necktie between breasts": "clothes",
    "necktie grab": "sexual",
    "necktie on head": "clothes",
    "neckwear grab": "clothes",
    "necrophilia": "sexual",
    "needle torture": "sexual",
    "negative": "effects",
    "negative space": "scene",
    "neglect play": "sexual",
    "nejiri hachimaki": "clothes",
    "nekonyan dance": "pose",
    "nelson's column": "scene",
    "nemophila (flower)": "scene",
    "nengajou": "scene",
    "neo-classical clothes": "clothes",
    "neon palette": "effects",
    "nepal": "scene",
    "nerine (flower)": "scene",
    "nerunerunerune": "scene",
    "nervous": "face",
    "nestle": "scene",
    "netherlands": "pose",
    "netorare": "sexual",
    "neuschwanstein castle": "scene",
    "nevada": "scene",
    "new england patriots": "pose",
    "new jersey": "scene",
    "new national stadium": "scene",
    "new orleans pelicans": "pose",
    "new orleans saints": "pose",
    "new year": "scene",
    "new york (state)": "scene",
    "new york city": "scene",
    "new york giants": "pose",
    "new york islanders": "pose",
    "new york jets": "pose",
    "new york knicks": "pose",
    "new york mets": "pose",
    "new york rangers": "pose",
    "new york yankees": "pose",
    "new zealand": "scene",
    "newcastle united fc": "pose",
    "newhalf with female": "sexual",
    "newhalf with male": "sexual",
    "newhalf with newhalf": "sexual",
    "newsboy cap": "clothes",
    "newspaper": "scene",
    "newsprint background": "scene",
    "niagara falls": "scene",
    "nian (mythology)": "scene",
    "nicaragua": "scene",
    "nigella": "scene",
    "nigeria": "scene",
    "nigerian clothes": "clothes",
    "night": "effects",
    "nightcap": "clothes",
    "nightclub": "scene",
    "nightgown": "clothes",
    "nightshade (flower)": "scene",
    "nigirizushi": "scene",
    "nihonga": "scene",
    "nihongami": "body",
    "niigata prefecture": "scene",
    "nimono": "scene",
    "ninja mask": "clothes",
    "ninja toes": "body",
    "nipple bar": "body",
    "nipple bells": "body",
    "nipple chain": "sexual",
    "nipple clamps": "sexual",
    "nipple cutout": "sexual",
    "nipple flick": "body",
    "nipple hair": "body",
    "nipple indents": "body",
    "nipple injection": "body",
    "nipple leash": "sexual",
    "nipple lock": "body",
    "nipple penetration": "sexual",
    "nipple piercing": "body",
    "nipple plug": "body",
    "nipple press": "body",
    "nipple pull": "sexual",
    "nipple push": "body",
    "nipple ribbon": "body",
    "nipple ring dress": "clothes",
    "nipple rings": "body",
    "nipple rub": "body",
    "nipple sleeves": "clothes",
    "nipple slip": "sexual",
    "nipple stretcher": "body",
    "nipple tag": "body",
    "nipple torture": "sexual",
    "nipple tweak": "sexual",
    "nipple-to-nipple": "pose",
    "nipples": "sexual",
    "nippon professional baseball": "pose",
    "no (gesture)": "limbs",
    "no animal ears": "effects",
    "no anus": "body",
    "no bra": "sexual",
    "no choker": "clothes",
    "no detached sleeves": "clothes",
    "no earrings": "effects",
    "no eyebrows": "face",
    "no eyes": "face",
    "no eyewear": "clothes",
    "no facial mark": "effects",
    "no fire": "scene",
    "no gloves": "clothes",
    "no horns": "effects",
    "no humans": "character",
    "no lineart": "scene",
    "no mask": "clothes",
    "no mouth": "face",
    "no necklace": "clothes",
    "no necktie": "clothes",
    "no neckwear": "clothes",
    "no nipples": "body",
    "no nose": "face",
    "no one's around to help (meme)": "pose",
    "no panties": "sexual",
    "no pants": "sexual",
    "no pupils": "face",
    "no pussy": "body",
    "no scarf": "clothes",
    "no sclera": "face",
    "no shirt": "sexual",
    "no shoes": "body",
    "no tattoo": "effects",
    "no testicles": "sexual",
    "noh mask": "clothes",
    "non-alcoholic beer": "scene",
    "non-binary flag": "sexual",
    "non-repeating animation": "scene",
    "nonowa": "face",
    "nontraditional miko": "clothes",
    "noodles": "scene",
    "noogie": "limbs",
    "noppo bread": "scene",
    "nori (seaweed)": "scene",
    "norigae": "clothes",
    "north carolina": "scene",
    "north korea": "scene",
    "north macedonia": "scene",
    "northern ireland": "scene",
    "norway": "scene",
    "norwegian clothes": "clothes",
    "nose": "face",
    "nose blush": "face",
    "nose bubble": "face",
    "nose hook": "sexual",
    "nose mask": "clothes",
    "nose pads": "clothes",
    "nose picking": "pose",
    "nose piercing": "face",
    "nose ring": "face",
    "nose shade": "face",
    "nose stud": "face",
    "nosebleed": "face",
    "nosejob": "sexual",
    "noses touching": "pose",
    "notched ear": "face",
    "notre dame de paris": "scene",
    "nova scotia": "scene",
    "novelty glasses": "clothes",
    "ntt docomo yoyogi building": "scene",
    "nuclear powerplant": "scene",
    "nude": "sexual",
    "nude cover": "sexual",
    "nude filter": "scene",
    "nude modeling": "sexual",
    "nue day": "scene",
    "numa numa (meme)": "pose",
    "numazu": "scene",
    "number four (asl)": "limbs",
    "nun": "clothes",
    "nurse": "body",
    "nurse cap": "clothes",
    "nursing bra": "body",
    "nursing handjob": "sexual",
    "nut (food)": "scene",
    "nyan-nyan dance": "pose",
    "nyotaimori": "sexual",
    "o o": "face",
    "o-ring": "clothes",
    "o-ring bikini": "clothes",
    "o-ring bottom": "clothes",
    "o-ring choker": "clothes",
    "o-ring collar": "clothes",
    "o-ring legwear": "clothes",
    "o-ring top": "clothes",
    "o3o": "face",
    "oasis": "scene",
    "obese": "sexual",
    "obi": "clothes",
    "obiage": "clothes",
    "obidome": "clothes",
    "obijime": "clothes",
    "object behind ear": "face",
    "object focus": "scene",
    "object insertion": "sexual",
    "object on breast": "body",
    "object on head": "clothes",
    "object on pectorals": "body",
    "objectification": "effects",
    "obliques": "body",
    "obon": "scene",
    "observatory": "scene",
    "occhahoi": "scene",
    "ocean": "scene",
    "ochazuke (food)": "scene",
    "oddloop": "pose",
    "oden": "scene",
    "oekaki": "scene",
    "off shoulder": "sexual",
    "off-shoulder bikini": "clothes",
    "off-shoulder coat": "clothes",
    "off-shoulder dress": "clothes",
    "off-shoulder jacket": "clothes",
    "off-shoulder leotard": "clothes",
    "off-shoulder one-piece swimsuit": "clothes",
    "off-shoulder shirt": "clothes",
    "off-shoulder sweater": "clothes",
    "off-topic": "scene",
    "office": "scene",
    "office siren": "clothes",
    "official art": "scene",
    "official wallpaper": "scene",
    "ohhoai": "face",
    "ohikaenasutte": "limbs",
    "ohio": "scene",
    "ohogao": "face",
    "oil lamp": "effects",
    "oil rig": "scene",
    "oita prefecture": "scene",
    "ojou-sama pose": "pose",
    "ok sign": "limbs",
    "okaya city": "scene",
    "okayama prefecture": "scene",
    "okinawa prefecture": "scene",
    "oklahoma city thunder": "pose",
    "okobo": "clothes",
    "okonomiyaki": "scene",
    "okosama lunch": "scene",
    "okosozukin": "clothes",
    "okra": "scene",
    "oktoberfest": "scene",
    "old town square (prague)": "scene",
    "old-fashioned donut": "scene",
    "old-fashioned swimsuit": "clothes",
    "oleander": "scene",
    "olive": "scene",
    "olympics": "pose",
    "olympique lyonnais": "pose",
    "omake": "scene",
    "omelet": "scene",
    "omiya ardija": "pose",
    "omurice": "scene",
    "on animal": "pose",
    "on back": "pose",
    "on banana": "scene",
    "on bed": "pose",
    "on boat": "pose",
    "on bus": "pose",
    "on car": "pose",
    "on chair": "pose",
    "on couch": "pose",
    "on desk": "pose",
    "on floor": "pose",
    "on flower": "pose",
    "on ground": "pose",
    "on head": "pose",
    "on lap": "pose",
    "on motorcycle": "pose",
    "on one knee": "pose",
    "on person": "pose",
    "on roof": "pose",
    "on side": "sexual",
    "on stomach": "pose",
    "on stool": "pose",
    "on table": "pose",
    "on train": "pose",
    "on truck": "pose",
    "on umbrella": "pose",
    "on van": "pose",
    "on weapon": "pose",
    "onahole": "sexual",
    "one breast out": "sexual",
    "one ear down": "face",
    "one eye closed": "face",
    "one man army": "scene",
    "one outs": "pose",
    "one side up": "body",
    "one world trade center": "scene",
    "one-eyed": "face",
    "one-piece swimsuit": "clothes",
    "one-piece swimsuit pull": "sexual",
    "onee gyaru": "clothes",
    "oni mask": "clothes",
    "onigiri": "scene",
    "onion": "scene",
    "onion rings": "scene",
    "onomichi (city)": "scene",
    "onsen": "scene",
    "ooarai (ibaraki)": "scene",
    "ooarai marine tower": "scene",
    "oof threesome": "sexual",
    "ookiku furikabutte": "pose",
    "oom threesome": "sexual",
    "opaque glasses": "clothes",
    "open bra": "sexual",
    "open clothes": "sexual",
    "open coat": "sexual",
    "open collar": "sexual",
    "open door": "scene",
    "open hand": "limbs",
    "open hands": "limbs",
    "open hoodie": "sexual",
    "open in internet explorer": "scene",
    "open in winamp": "scene",
    "open jacket": "sexual",
    "open kimono": "sexual",
    "open mouth": "face",
    "open pants": "sexual",
    "open robe": "sexual",
    "open shirt": "sexual",
    "open shorts": "sexual",
    "open skirt": "sexual",
    "open towel": "sexual",
    "open vest": "sexual",
    "open-toe boots": "clothes",
    "open-toe shoes": "clothes",
    "opening": "pose",
    "opening door": "scene",
    "opera cake": "scene",
    "opera glasses": "clothes",
    "operation crossroads": "scene",
    "operation market garden": "scene",
    "operation ten-gou": "scene",
    "oppai challenge": "body",
    "optical illusion": "scene",
    "oracle park": "scene",
    "oral": "sexual",
    "oral invitation": "limbs",
    "oral sandwich": "sexual",
    "orange (fruit)": "scene",
    "orange ascot": "clothes",
    "orange background": "scene",
    "orange blossoms": "scene",
    "orange bowtie": "clothes",
    "orange choker": "clothes",
    "orange eyes": "face",
    "orange eyeshadow": "clothes",
    "orange gloves": "clothes",
    "orange hair": "body",
    "orange hat": "clothes",
    "orange juice": "scene",
    "orange justice (dance)": "pose",
    "orange lips": "clothes",
    "orange mask": "clothes",
    "orange neckerchief": "clothes",
    "orange necktie": "clothes",
    "orange one-piece swimsuit": "clothes",
    "orange pepper": "scene",
    "orange print": "clothes",
    "orange pupils": "face",
    "orange scarf": "clothes",
    "orange sclera": "face",
    "orange skin": "body",
    "orange sleeves": "clothes",
    "orange slice": "scene",
    "orange theme": "effects",
    "orange-framed eyewear": "clothes",
    "orange-tinted eyewear": "clothes",
    "orangette": "scene",
    "orangina": "scene",
    "orchid": "scene",
    "orchid fingers": "limbs",
    "oregon": "scene",
    "oreo": "scene",
    "organs": "body",
    "orgasm denial": "sexual",
    "orgy": "sexual",
    "oriental pearl tower": "scene",
    "orientation play": "sexual",
    "orix buffaloes": "pose",
    "orlando magic": "pose",
    "ornate border": "scene",
    "ornate ring": "clothes",
    "osaka (city)": "scene",
    "osaka castle": "scene",
    "osaka prefecture": "scene",
    "osechi": "scene",
    "oseledets": "body",
    "osmanthus": "scene",
    "osmanthus cake": "scene",
    "otaku room": "scene",
    "otaru (hokkaido)": "scene",
    "other focus": "character",
    "otoshidama": "scene",
    "otsu (city)": "scene",
    "ottawa senators": "pose",
    "ottoman empire": "scene",
    "ouji fashion": "clothes",
    "our lady of the assumption": "scene",
    "out of character": "effects",
    "out of frame": "character",
    "out-of-frame censoring": "scene",
    "outdoors": "scene",
    "outline": "scene",
    "outside border": "scene",
    "outstretched arm": "pose",
    "outstretched arms": "pose",
    "outstretched hand": "pose",
    "outstretched leg": "pose",
    "oven": "scene",
    "oven mitts": "clothes",
    "over shoulder": "clothes",
    "over the knee": "pose",
    "over-kneehighs": "clothes",
    "over-rim eyewear": "clothes",
    "overall skirt": "clothes",
    "overalls": "clothes",
    "overcoat": "clothes",
    "overexposure": "scene",
    "overlighting": "scene",
    "oversized breast cup": "body",
    "oversized food": "scene",
    "oversized wings": "body",
    "overskirt": "clothes",
    "owl mask": "clothes",
    "own hands clasped": "limbs",
    "own hands together": "pose",
    "oxfords": "clothes",
    "oxygen mask": "clothes",
    "oyakodon (food)": "scene",
    "oyster": "scene",
    "oyster pail": "scene",
    "pac-man eyes": "face",
    "padlocked collar": "clothes",
    "paduka": "clothes",
    "paeraengi": "clothes",
    "paffendorf": "pose",
    "pagoda": "scene",
    "paifang": "scene",
    "pain": "sexual",
    "painterly": "scene",
    "painting (action)": "pose",
    "painting toenails": "clothes",
    "paisley": "clothes",
    "paizuri": "sexual",
    "paizuri on lap": "sexual",
    "paizuri over clothes": "sexual",
    "paizuri under clothes": "sexual",
    "pajamas": "clothes",
    "pajamas pull": "sexual",
    "pakistan": "scene",
    "pakistani clothes": "clothes",
    "palace of the parliament": "scene",
    "palace of versailles": "scene",
    "palacio de carlos v": "scene",
    "palanquin ship": "scene",
    "pale colors": "effects",
    "pale skin": "body",
    "palestine": "scene",
    "palestinian clothes": "clothes",
    "palette hat ornament": "clothes",
    "palette swap": "effects",
    "palm tree": "scene",
    "palm-fist greeting": "limbs",
    "palm-fist tap": "limbs",
    "palms": "limbs",
    "panama": "scene",
    "panamanian clothes": "clothes",
    "pancake": "scene",
    "pancake stack": "scene",
    "panda costume": "clothes",
    "panda ears": "face",
    "panda mask": "clothes",
    "panda print": "clothes",
    "paneled background": "scene",
    "pangya": "pose",
    "panicking": "pose",
    "panorama": "scene",
    "pansy": "scene",
    "pant suit": "clothes",
    "panties": "clothes",
    "panties aside": "sexual",
    "panties day": "scene",
    "panties on breasts": "body",
    "panties on head": "clothes",
    "pants": "clothes",
    "pants pull": "sexual",
    "pants rolled up": "sexual",
    "pantsing": "pose",
    "panty gag": "sexual",
    "panty lift": "sexual",
    "panty mask": "clothes",
    "panty pull": "sexual",
    "pantyhose": "clothes",
    "pantyhose pull": "sexual",
    "pantyhose under shorts": "clothes",
    "pantyshot": "sexual",
    "papa john's": "scene",
    "papakha": "clothes",
    "papaya": "scene",
    "paper": "clothes",
    "paper background": "scene",
    "paper child": "scene",
    "paper cutout": "scene",
    "paper lantern": "scene",
    "paper on head": "clothes",
    "papercraft": "scene",
    "para para": "pose",
    "paraguay": "pose",
    "paralysis": "body",
    "parfait": "scene",
    "paris": "scene",
    "paris saint-germain": "pose",
    "park": "scene",
    "parking garage": "scene",
    "parking lot": "scene",
    "parma fc": "pose",
    "parmesan cheese": "scene",
    "parsley": "scene",
    "parted bangs": "body",
    "parted hair": "body",
    "parted lips": "face",
    "parthenon": "scene",
    "partially blind": "face",
    "partially colored": "effects",
    "partially fingerless gloves": "clothes",
    "partially underwater shot": "scene",
    "partially visible vulva": "body",
    "party": "scene",
    "party hat": "clothes",
    "pasqueflower": "scene",
    "passion flower": "scene",
    "passion fruit": "scene",
    "pasta": "scene",
    "pastel colors": "effects",
    "pastel goth": "clothes",
    "pasties": "clothes",
    "pastry": "scene",
    "pastry bag": "scene",
    "pastry box": "scene",
    "patchwork skin": "body",
    "path": "scene",
    "patterned": "clothes",
    "patterned background": "clothes",
    "patterned clothing": "clothes",
    "patterned hair": "clothes",
    "patting": "pose",
    "patting back": "limbs",
    "pauldrons": "clothes",
    "paw gloves": "clothes",
    "paw pose": "limbs",
    "paw print": "clothes",
    "paw print background": "scene",
    "paw print palms": "clothes",
    "paw sleeves": "clothes",
    "paw-shaped pupils": "face",
    "pea pod": "scene",
    "peach": "scene",
    "peach blossom": "scene",
    "peach hat ornament": "clothes",
    "peach slice": "scene",
    "peacoat": "clothes",
    "peaked cap": "clothes",
    "peanut": "scene",
    "peanut butter": "scene",
    "peanut mouth": "face",
    "pear": "scene",
    "pear blossom": "scene",
    "pearl harbor": "scene",
    "pearl necklace": "clothes",
    "pearl thong": "clothes",
    "peas": "scene",
    "pecan": "scene",
    "pecjob": "sexual",
    "pectoral focus": "scene",
    "pectoral grab": "sexual",
    "pectorals": "sexual",
    "peeing": "sexual",
    "peeing on viewer": "sexual",
    "peeing self": "sexual",
    "peeking": "sexual",
    "peel (tool)": "scene",
    "peeler": "scene",
    "peeling": "pose",
    "peephole": "scene",
    "pegging": "sexual",
    "peking duck (food)": "scene",
    "pelt": "clothes",
    "pelvic curtain": "clothes",
    "pen spinning": "pose",
    "pen-pineapple-apple-pen": "pose",
    "pencil case": "clothes",
    "pendant": "clothes",
    "pendant choker": "clothes",
    "penetration gesture": "limbs",
    "penghu tianho temple": "scene",
    "penguin costume": "clothes",
    "penguin hat": "clothes",
    "penis": "body",
    "penis awe": "face",
    "penis focus": "scene",
    "penis measuring": "pose",
    "penis peek": "sexual",
    "penis pump": "sexual",
    "penis reduction": "sexual",
    "penis sheath": "clothes",
    "penis tentacle": "sexual",
    "penis to breast": "body",
    "penis under breasts": "body",
    "penis under mask": "clothes",
    "penises touching": "sexual",
    "pensive": "face",
    "pentacle": "clothes",
    "pentas (flower)": "scene",
    "peony (flower)": "scene",
    "peony print": "clothes",
    "people": "character",
    "pepper (spice)": "scene",
    "pepper mill": "scene",
    "pepper shaker": "scene",
    "pepperoni": "scene",
    "pepsi": "scene",
    "pepsi ice cucumber": "scene",
    "perennial (flower)": "scene",
    "perineum": "body",
    "periwinkle (flower)": "scene",
    "perky breasts": "body",
    "perky goth": "clothes",
    "perpendicular paizuri": "sexual",
    "persian speedwell": "scene",
    "persib bandung": "pose",
    "persija jakarta": "pose",
    "persimmon": "scene",
    "person between breasts": "body",
    "persona eyes": "face",
    "personality switch": "effects",
    "personification": "effects",
    "perspective": "body",
    "peru": "scene",
    "peruvian clothes": "clothes",
    "perverted excuse": "scene",
    "perverted utility": "scene",
    "pet cone": "clothes",
    "pet play": "sexual",
    "pet walking": "pose",
    "petal print": "clothes",
    "petals": "scene",
    "petals on liquid": "scene",
    "peter pan collar": "clothes",
    "petra (jordan)": "scene",
    "petronas twin towers": "scene",
    "petticoat": "clothes",
    "petting": "pose",
    "petunia (flower)": "scene",
    "pfc cska moscow": "pose",
    "phallic symbol": "sexual",
    "phalloplasty": "sexual",
    "pharmacy": "scene",
    "philadelphia 76ers": "pose",
    "philadelphia eagles": "pose",
    "philadelphia flyers": "pose",
    "philippines": "scene",
    "phimosis": "body",
    "phoenix (arizona)": "scene",
    "phoenix suns": "pose",
    "phone booth": "scene",
    "phone in pussy": "body",
    "phonecard (medium)": "scene",
    "photo (medium)": "scene",
    "photo (object)": "character",
    "photo background": "scene",
    "photo-referenced": "scene",
    "photomosaic": "scene",
    "photorealistic": "scene",
    "piano print": "clothes",
    "pickelhaube": "clothes",
    "pickle": "scene",
    "picnic": "scene",
    "picnic basket": "scene",
    "picture hat": "clothes",
    "pie": "scene",
    "pier": "scene",
    "pierced wings": "body",
    "piercing": "sexual",
    "pieris japonica": "scene",
    "pierogi": "scene",
    "pig costume": "clothes",
    "pig ears": "face",
    "pig mask": "clothes",
    "pig penis": "body",
    "pigeon pose": "pose",
    "pigeon-toed": "pose",
    "piggyback": "pose",
    "pikachu ears": "face",
    "piledriver (sex)": "sexual",
    "pill": "body",
    "pillarboxed": "scene",
    "pillbox hat": "clothes",
    "pillory": "sexual",
    "pillow humping": "sexual",
    "pillow straddling": "pose",
    "pilot helmet": "clothes",
    "pin legs": "pose",
    "pina colada": "scene",
    "pinata": "scene",
    "pince-nez": "clothes",
    "pinching": "pose",
    "pinching gesture": "limbs",
    "pinching sleeves": "clothes",
    "pine tree": "scene",
    "pineapple": "scene",
    "pineapple print": "clothes",
    "pineapple slice": "scene",
    "pineberry (fruit)": "scene",
    "ping pong (manga)": "pose",
    "pink ascot": "clothes",
    "pink background": "scene",
    "pink bowtie": "clothes",
    "pink choker": "clothes",
    "pink eyes": "face",
    "pink eyeshadow": "clothes",
    "pink fire": "scene",
    "pink gloves": "clothes",
    "pink hair": "body",
    "pink hat": "clothes",
    "pink lips": "clothes",
    "pink mask": "clothes",
    "pink neckerchief": "clothes",
    "pink necktie": "clothes",
    "pink nose": "face",
    "pink one-piece swimsuit": "clothes",
    "pink pupils": "face",
    "pink scarf": "clothes",
    "pink sclera": "face",
    "pink skin": "body",
    "pink sleeves": "clothes",
    "pink theme": "effects",
    "pink wings": "body",
    "pink-framed eyewear": "clothes",
    "pink-tinted eyewear": "clothes",
    "pinky out": "limbs",
    "pinky swear": "limbs",
    "pinstripe pattern": "clothes",
    "pipelining": "pose",
    "piranha plant": "scene",
    "pirate hat": "clothes",
    "pistachio": "scene",
    "pitcher plant": "scene",
    "pitching": "pose",
    "pith helmet": "clothes",
    "pittsburgh penguins": "pose",
    "pittsburgh pirates": "pose",
    "pittsburgh steelers": "pose",
    "pixel art": "scene",
    "pixel eyes": "face",
    "pixel sunglasses": "clothes",
    "pixel-perfect duplicate": "scene",
    "pixie cut": "body",
    "pizza": "scene",
    "pizza box": "scene",
    "pizza delivery": "scene",
    "pizza hut": "scene",
    "pizza slice": "scene",
    "pizza toast": "scene",
    "plague doctor mask": "clothes",
    "plaid": "clothes",
    "plaid ascot": "clothes",
    "plaid background": "scene",
    "plaid bowtie": "clothes",
    "plaid choker": "clothes",
    "plaid skirt": "clothes",
    "plaid sleeves": "clothes",
    "plain": "scene",
    "planet": "scene",
    "planetarium": "scene",
    "plant": "scene",
    "plant boy": "scene",
    "plant cell": "scene",
    "plant focus": "scene",
    "plant girl": "scene",
    "plant hair": "body",
    "plant monster": "scene",
    "plant roots": "scene",
    "plant wings": "body",
    "plantar flexion": "pose",
    "planter": "scene",
    "plastic skin": "body",
    "plastron (necklace)": "clothes",
    "plate": "scene",
    "plate stack": "scene",
    "platform boots": "clothes",
    "platform footwear": "clothes",
    "platform heels": "clothes",
    "platform sandals": "clothes",
    "platform shoes": "clothes",
    "playboy bunny": "clothes",
    "player 2": "effects",
    "playground": "scene",
    "playing": "pose",
    "playing card": "scene",
    "playing games": "pose",
    "playing instrument": "pose",
    "playing sports": "pose",
    "playing video games": "pose",
    "playing with another's hair": "body",
    "playing with own hair": "body",
    "pleading eyes": "face",
    "pleated shorts": "clothes",
    "pleated skirt": "clothes",
    "plug gag": "sexual",
    "plugging ears": "face",
    "plugsuit (evangelion)": "clothes",
    "plum": "scene",
    "plum blossom print": "clothes",
    "plum blossoms": "scene",
    "plumeria": "scene",
    "plump": "sexual",
    "plunging neckline": "clothes",
    "pocari sweat": "scene",
    "pocket": "clothes",
    "pocket square": "clothes",
    "pocket watch": "clothes",
    "pocky": "scene",
    "pocky day": "scene",
    "poinsettia": "scene",
    "pointed mask": "clothes",
    "pointillism": "scene",
    "pointing": "limbs",
    "pointing at another": "limbs",
    "pointing at self": "limbs",
    "pointing at viewer": "limbs",
    "pointing down": "limbs",
    "pointing forward": "limbs",
    "pointing spider-man (meme)": "limbs",
    "pointing up": "limbs",
    "pointy boots": "clothes",
    "pointy breasts": "body",
    "pointy ears": "face",
    "pointy hair": "body",
    "pointy nose": "face",
    "pointy shoes": "clothes",
    "poke ball": "scene",
    "poke ball background": "scene",
    "pokedance (meme)": "pose",
    "pokefication": "effects",
    "pokemon focus": "effects",
    "pokemon on shoulder": "clothes",
    "poking": "pose",
    "poking another's breast": "limbs",
    "poking own breast": "limbs",
    "poland": "scene",
    "polar opposites": "scene",
    "pole dancing": "pose",
    "police hat": "clothes",
    "polish clothes": "clothes",
    "polishing": "pose",
    "polka dot": "clothes",
    "polka dot background": "scene",
    "polka dot bikini": "clothes",
    "polka dot bowtie": "clothes",
    "polka dot leggings": "clothes",
    "polka dot legwear": "clothes",
    "polka dot pantyhose": "clothes",
    "polka dot scarf": "clothes",
    "polka dot sleeves": "clothes",
    "polka dot socks": "clothes",
    "polka dot swimsuit": "clothes",
    "polka dot thighhighs": "clothes",
    "pom pom (clothes)": "clothes",
    "pomegranate": "scene",
    "pomegranate flower": "scene",
    "pompadour": "body",
    "pon de chocolat": "scene",
    "pon de lion": "scene",
    "pon de ring": "scene",
    "pon de strawberry": "scene",
    "poncho": "clothes",
    "pond": "scene",
    "ponification": "effects",
    "pony play": "sexual",
    "pool": "scene",
    "poolside": "scene",
    "poorly drawn": "scene",
    "pop socket": "clothes",
    "popcorn": "scene",
    "popped collar": "clothes",
    "poppy (flower)": "scene",
    "popsicle": "scene",
    "popsicle stick": "scene",
    "pork": "scene",
    "porkpie hat": "clothes",
    "portal (object)": "scene",
    "portcullis": "scene",
    "portland (oregon)": "scene",
    "portland trail blazers": "pose",
    "portrait": "face",
    "portugal": "pose",
    "portuguese clothes": "clothes",
    "portulaca": "scene",
    "pose": "pose",
    "post orgasm torture": "sexual",
    "postcard": "scene",
    "poster (medium)": "scene",
    "pot": "scene",
    "potato": "scene",
    "potato chips": "scene",
    "potato flower": "scene",
    "potentilla": "scene",
    "pothos (plant)": "scene",
    "potted plant": "scene",
    "pouncing": "pose",
    "pound cake": "scene",
    "pouring": "pose",
    "pout": "pose",
    "pov": "character",
    "pov doorway": "scene",
    "pov peephole": "scene",
    "powder puff": "clothes",
    "power bottom": "sexual",
    "power fist": "limbs",
    "power plant": "scene",
    "power symbol-shaped pupils": "face",
    "powerful breasts": "body",
    "prague": "scene",
    "praise the sun": "pose",
    "praying": "pose",
    "predicament bondage": "sexual",
    "pregnant": "sexual",
    "prehensile hair": "body",
    "premier league": "pose",
    "preppy fashion": "clothes",
    "presenting own body": "sexual",
    "presidential office building": "scene",
    "pretzel": "scene",
    "priest": "clothes",
    "primary colors": "effects",
    "primera division (argentina)": "pose",
    "primrose (flower)": "scene",
    "princess carry": "pose",
    "pringles": "scene",
    "print ascot": "clothes",
    "print bikini": "clothes",
    "print boots": "clothes",
    "print bow": "clothes",
    "print bowtie": "clothes",
    "print choker": "clothes",
    "print eyepatch": "clothes",
    "print gloves": "clothes",
    "print hakama": "clothes",
    "print headwear": "clothes",
    "print kimono": "clothes",
    "print leggings": "clothes",
    "print mask": "clothes",
    "print neckerchief": "clothes",
    "print necktie": "clothes",
    "print panties": "clothes",
    "print pantyhose": "clothes",
    "print ribbon": "clothes",
    "print sandals": "clothes",
    "print shirt": "clothes",
    "print shoes": "clothes",
    "print shorts": "clothes",
    "print sleeves": "clothes",
    "print slippers": "clothes",
    "print socks": "clothes",
    "print swimsuit": "clothes",
    "print thighhighs": "clothes",
    "print umbrella": "clothes",
    "pripyat": "scene",
    "prism": "effects",
    "prison": "sexual",
    "prison cell": "scene",
    "pro golfer saru": "pose",
    "profile": "face",
    "programming": "pose",
    "projected inset": "scene",
    "projectile lactation": "body",
    "prone bone": "sexual",
    "prostate": "body",
    "prostate massager": "sexual",
    "prostate milking": "sexual",
    "prostitution": "sexual",
    "prostration": "pose",
    "protea (flower)": "scene",
    "protecting": "pose",
    "prussia": "scene",
    "pseudopenis": "body",
    "pubic hair": "body",
    "public bondage": "sexual",
    "public indecency": "sexual",
    "public nudity": "sexual",
    "public restroom": "scene",
    "public use": "sexual",
    "public vibrator": "sexual",
    "puckered anus": "body",
    "pudding": "scene",
    "pudding a la mode": "scene",
    "puerto rico": "scene",
    "puff and slash sleeves": "clothes",
    "puffy cheeks": "face",
    "puffy chest": "sexual",
    "puffy detached sleeves": "clothes",
    "puffy long sleeves": "clothes",
    "puffy nipples": "body",
    "puffy short sleeves": "clothes",
    "puffy sleeves": "clothes",
    "pull out": "sexual",
    "pulling": "pose",
    "pulling off legwear": "clothes",
    "pump": "sexual",
    "pumpkin": "scene",
    "pumpkin dance (meme)": "pose",
    "pumpkin hat": "clothes",
    "pumpkin hat ornament": "clothes",
    "pumpkin mask": "clothes",
    "pumpkin pie": "scene",
    "pumps": "clothes",
    "punch-out!!": "pose",
    "punching": "sexual",
    "punjabi clothes": "clothes",
    "punk": "clothes",
    "punk lolita": "clothes",
    "puraore! pride of orange": "pose",
    "puritan collar": "clothes",
    "purple background": "scene",
    "purple eyes": "face",
    "purple eyeshadow": "clothes",
    "purple fire": "scene",
    "purple gloves": "clothes",
    "purple hair": "body",
    "purple hat": "clothes",
    "purple lips": "clothes",
    "purple mask": "clothes",
    "purple one-piece swimsuit": "clothes",
    "purple pupils": "face",
    "purple sclera": "face",
    "purple skin": "body",
    "purple sleeves": "clothes",
    "purple theme": "effects",
    "purple-framed eyewear": "clothes",
    "purple-tinted eyewear": "clothes",
    "pushing": "pose",
    "pussy": "body",
    "pussy focus": "effects",
    "pussy juice": "sexual",
    "pussy juice in mouth": "face",
    "pussy juice puddle": "body",
    "pussy juice trail": "body",
    "pussy peek": "sexual",
    "pussy tentacle": "sexual",
    "pussyjob": "sexual",
    "putting on gloves": "clothes",
    "putting on headwear": "clothes",
    "putting on legwear": "clothes",
    "putting on mask": "clothes",
    "pyrokinesis": "scene",
    "qatar": "scene",
    "qi lolita": "clothes",
    "qingdai guanmao": "clothes",
    "qingxin flower": "scene",
    "qipao": "clothes",
    "qixi festival": "scene",
    "quad braids": "body",
    "quad drills": "body",
    "quad hair rings": "body",
    "quad tails": "body",
    "quadfold": "pose",
    "quadruple amputee": "sexual",
    "quadruple wielding": "pose",
    "quality": "scene",
    "quebec": "scene",
    "quebec maritimes junior hockey league": "pose",
    "quebec nordiques": "pose",
    "quiff": "body",
    "quin tails": "body",
    "quince blossoms": "scene",
    "rabbit": "scene",
    "rabbit background": "scene",
    "rabbit choker": "clothes",
    "rabbit costume": "clothes",
    "rabbit ear headphones": "face",
    "rabbit ear legwear": "clothes",
    "rabbit ears": "face",
    "rabbit hairstyle": "body",
    "rabbit hat": "clothes",
    "rabbit mask": "clothes",
    "rabbit on shoulder": "clothes",
    "rabbit pose": "limbs",
    "rabbit vibrator": "sexual",
    "rabbit-shaped pupils": "face",
    "raccoon dancing in a circle (meme)": "pose",
    "raccoon ears": "face",
    "raccoon mask": "clothes",
    "raccoon tails (hairstyle)": "body",
    "racetrack": "scene",
    "racing": "pose",
    "racing suit": "clothes",
    "racket": "pose",
    "radiation symbol-shaped pupils": "face",
    "radish": "scene",
    "rafflesia (flower)": "scene",
    "raglan sleeves": "clothes",
    "railroad crossing": "scene",
    "railroad tracks": "scene",
    "rain": "scene",
    "rainbow": "effects",
    "rainbow background": "scene",
    "rainbow cake": "scene",
    "rainbow eyes": "face",
    "rainbow hair": "body",
    "rainbow legwear": "clothes",
    "rainbow order": "effects",
    "rainbow wings": "body",
    "rainbow-tinted eyewear": "clothes",
    "raincoat": "clothes",
    "raindrop cake": "scene",
    "rainforest": "scene",
    "raised eyebrow": "face",
    "raised eyebrows": "face",
    "raised fist": "limbs",
    "raised inner eyebrows": "face",
    "raisin (fruit)": "scene",
    "rambutan": "scene",
    "ramen": "scene",
    "ramune": "scene",
    "ran ran ru": "pose",
    "ranguage": "scene",
    "ranunculus": "scene",
    "rape": "sexual",
    "rape face": "face",
    "rapeseed blossoms": "scene",
    "rappelling": "pose",
    "rare cheesecake": "scene",
    "rash guard": "clothes",
    "raspberry": "scene",
    "raver": "clothes",
    "raw egg": "scene",
    "raw meat": "scene",
    "reach-around": "sexual",
    "reaching": "limbs",
    "reading": "pose",
    "real betis": "pose",
    "real madrid": "pose",
    "real world location": "scene",
    "realistic": "scene",
    "recipe (object)": "scene",
    "reclining": "pose",
    "record store": "scene",
    "recording": "pose",
    "rectangular eyewear": "clothes",
    "rectangular mouth": "face",
    "rectangular pupils": "face",
    "red ascot": "clothes",
    "red background": "scene",
    "red bean paste": "scene",
    "red bean pie": "scene",
    "red bowtie": "clothes",
    "red bull": "scene",
    "red choker": "clothes",
    "red eagles hokkaido": "pose",
    "red eyes": "face",
    "red eyeshadow": "clothes",
    "red ginger (flower)": "scene",
    "red gloves": "clothes",
    "red hair": "body",
    "red hat": "clothes",
    "red lips": "clothes",
    "red mask": "clothes",
    "red neckerchief": "clothes",
    "red necktie": "clothes",
    "red nose": "face",
    "red one-piece swimsuit": "clothes",
    "red pepper": "scene",
    "red pupils": "face",
    "red scarf": "clothes",
    "red sclera": "face",
    "red skin": "body",
    "red sleeves": "clothes",
    "red theme": "effects",
    "red velvet cake": "scene",
    "red wings": "body",
    "red-framed eyewear": "clothes",
    "red-tinted eyewear": "clothes",
    "reference photo": "scene",
    "reference sheet": "scene",
    "reference work": "scene",
    "refinery": "scene",
    "reflected worlds": "scene",
    "reflection": "scene",
    "reflection focus": "effects",
    "refraction": "effects",
    "refrigerator": "scene",
    "regency era": "clothes",
    "regression (psychology)": "sexual",
    "rei no himo": "body",
    "rei no pool": "scene",
    "reichstag": "scene",
    "reimu (flower)": "scene",
    "reindeer costume": "clothes",
    "relationship graph": "scene",
    "reloading": "pose",
    "remembrance day": "scene",
    "remote control vibrator": "sexual",
    "removing eyewear": "clothes",
    "removing glove": "clothes",
    "removing helmet": "clothes",
    "removing legwear": "clothes",
    "removing mask": "clothes",
    "removing pantyhose": "clothes",
    "removing sock": "clothes",
    "removing thighhigh": "clothes",
    "renaissance": "scene",
    "renaissance clothes": "clothes",
    "repairing": "pose",
    "resisting": "pose",
    "resized": "scene",
    "respirator": "clothes",
    "restaurant": "scene",
    "resting": "pose",
    "retrofuturism": "effects",
    "revealing clothes": "sexual",
    "reverse bikini armor": "clothes",
    "reverse bunnysuit": "clothes",
    "reverse cowgirl position": "sexual",
    "reverse footjob": "sexual",
    "reverse netorare": "sexual",
    "reverse nursing handjob": "sexual",
    "reverse outfit": "clothes",
    "reverse paizuri": "body",
    "reverse palettes": "effects",
    "reverse prayer": "sexual",
    "reverse ryona": "sexual",
    "reverse spitroast": "sexual",
    "reverse squatting cowgirl position": "sexual",
    "reverse suspended congress": "sexual",
    "reverse trap": "sexual",
    "reverse upright straddle": "sexual",
    "reverse-jointed legs": "body",
    "reversed": "scene",
    "revision": "scene",
    "revolved head-to-knee pose": "pose",
    "rhinestone": "clothes",
    "rhodesia": "scene",
    "rhododendron": "scene",
    "rhythmic gymnastics": "pose",
    "ribbed leg warmers": "clothes",
    "ribbed legwear": "clothes",
    "ribbed pantyhose": "clothes",
    "ribbed sleeves": "clothes",
    "ribbed socks": "clothes",
    "ribbed sweater": "clothes",
    "ribbed thighhighs": "clothes",
    "ribbon": "pose",
    "ribbon baton": "pose",
    "ribbon choker": "clothes",
    "ribbon hair": "body",
    "ribbon of saint george": "scene",
    "ribbon trim": "clothes",
    "ribbon-trimmed gloves": "clothes",
    "ribbon-trimmed legwear": "clothes",
    "ribbon-trimmed sleeves": "clothes",
    "ribs": "body",
    "ribs (food)": "scene",
    "rice": "scene",
    "rice cooker": "scene",
    "rice hat": "clothes",
    "rice on face": "scene",
    "rice paddy": "scene",
    "rice porridge": "scene",
    "riding": "pose",
    "riding crop": "sexual",
    "riding machine": "sexual",
    "right-to-left comic": "scene",
    "rimless eyewear": "clothes",
    "rin stripper dance (meme)": "pose",
    "rina-chan board": "clothes",
    "ring": "clothes",
    "ring gag": "sexual",
    "ring necklace": "clothes",
    "ringed eyes": "face",
    "ringlets": "body",
    "rinnegan": "face",
    "rio de janeiro": "scene",
    "ripping": "pose",
    "risotto": "scene",
    "rito": "body",
    "river": "scene",
    "riviere (necklace)": "clothes",
    "road": "scene",
    "roaring": "pose",
    "roast chicken": "scene",
    "roasted sweet potato": "scene",
    "roasting": "pose",
    "robe": "clothes",
    "robe slip": "sexual",
    "robot ears": "face",
    "robot joints": "body",
    "robot x laserbeam": "pose",
    "rockabilly": "clothes",
    "rockefeller center": "scene",
    "rococo movement": "clothes",
    "roe": "scene",
    "rogatywka": "clothes",
    "rokku gyaru": "clothes",
    "role reversal": "effects",
    "roller coaster": "scene",
    "rolling": "pose",
    "rolling eyes": "face",
    "rolling pin": "scene",
    "rolling sleeves up": "clothes",
    "roman clothes": "clothes",
    "roman empire": "scene",
    "romance of the three kingdoms": "scene",
    "romania": "scene",
    "romanian clothes": "clothes",
    "romantic period": "clothes",
    "rome (city)": "scene",
    "romper": "clothes",
    "ronald mcdonald": "scene",
    "roningasa": "clothes",
    "rooftop": "scene",
    "root beer": "scene",
    "roots (hair)": "body",
    "rope": "sexual",
    "rope braid": "body",
    "rope bridge": "scene",
    "rope walking": "sexual",
    "rose": "scene",
    "rose background": "scene",
    "rose bush": "scene",
    "rose hip tea": "scene",
    "rose petals": "scene",
    "rose print": "clothes",
    "rosemary (herb)": "scene",
    "rotated": "scene",
    "rotational symmetry": "scene",
    "rotting": "pose",
    "rou-kyuu-bu!": "pose",
    "rouge (makeup)": "clothes",
    "rough sex": "sexual",
    "roulette animation": "scene",
    "roulette roulette": "pose",
    "round collar": "clothes",
    "round eyewear": "clothes",
    "rounded collar": "clothes",
    "rounded corners": "scene",
    "rowboat": "scene",
    "rowing": "pose",
    "rubber boots": "clothes",
    "rubber day": "scene",
    "rubber gloves": "clothes",
    "rubber hose (style)": "effects",
    "rubbing": "pose",
    "rudbeckia": "scene",
    "ruffling hair": "body",
    "rugby": "pose",
    "rugby ball": "pose",
    "ruining the glorious moment": "scene",
    "ruins": "scene",
    "running": "pose",
    "running track": "scene",
    "runny makeup": "clothes",
    "runny nose": "face",
    "runway": "scene",
    "runway fashion": "clothes",
    "ruppelbend": "pose",
    "rural": "scene",
    "russia": "pose",
    "russian civil war": "scene",
    "russian clothes": "clothes",
    "russian empire": "scene",
    "russo-japanese war": "scene",
    "russo-turkish war (1877-1878)": "scene",
    "russo-ukrainian war": "scene",
    "rusty trombone": "sexual",
    "ryona": "sexual",
    "ryusuimon": "clothes",
    "ryuusou": "clothes",
    "saboten pose": "pose",
    "sacramento kings": "pose",
    "sad": "face",
    "sad cat dance (meme)": "pose",
    "sad smile": "face",
    "saddle shoes": "clothes",
    "sadism": "sexual",
    "safari jacket": "clothes",
    "safety glasses": "clothes",
    "safflower": "scene",
    "saga prefecture": "scene",
    "sagan tosu": "pose",
    "sagging breasts": "body",
    "sagrada familia": "scene",
    "sailboat": "scene",
    "sailor": "clothes",
    "sailor bikini": "clothes",
    "sailor collar": "clothes",
    "sailor dress": "clothes",
    "sailor hat": "clothes",
    "sailor shirt": "clothes",
    "saint patrick's day": "scene",
    "saint petersburg": "scene",
    "saishi": "clothes",
    "saitama (city)": "scene",
    "saitama prefecture": "scene",
    "saitama seibu lions": "pose",
    "sajkaca": "clothes",
    "sakazuki": "scene",
    "sake": "scene",
    "sakura french": "scene",
    "sakura miku": "character",
    "sakura mochi": "scene",
    "sakuramon": "clothes",
    "salad": "scene",
    "salar de uyuni": "scene",
    "sallet": "clothes",
    "salon": "scene",
    "salsa": "scene",
    "salt": "scene",
    "salt flats": "scene",
    "salt shaker": "scene",
    "salute": "limbs",
    "sam browne belt": "clothes",
    "samba": "pose",
    "sami clothes": "clothes",
    "san antonio spurs": "pose",
    "san diego": "scene",
    "san diego padres": "pose",
    "san francisco": "scene",
    "san francisco 49ers": "pose",
    "san francisco giants": "pose",
    "san jose sharks": "pose",
    "sandals": "clothes",
    "sandersonia (flower)": "scene",
    "sandogasa": "clothes",
    "sandwich": "scene",
    "sandwich cookie": "scene",
    "sanfrecce hiroshima": "pose",
    "sangtu": "body",
    "sanjeok": "scene",
    "sanpaku": "face",
    "sanssouci palace": "scene",
    "sant'elmo": "scene",
    "santa claus": "scene",
    "santa costume": "clothes",
    "santa hat": "clothes",
    "santa mask": "clothes",
    "santos fc": "pose",
    "santos laguna": "pose",
    "sao paulo fc": "pose",
    "sapling": "scene",
    "sapporo (city)": "scene",
    "sarashi": "clothes",
    "sarong": "clothes",
    "sasebo": "scene",
    "sash": "clothes",
    "sashimi": "scene",
    "saturated": "effects",
    "saturated background": "effects",
    "saturday night fever": "limbs",
    "sauce": "scene",
    "saucer": "scene",
    "saudi arabia": "pose",
    "sauna": "scene",
    "sausage": "scene",
    "savannah": "scene",
    "saw sawing": "scene",
    "sayagata": "clothes",
    "sc corinthians paulista": "pose",
    "scales": "body",
    "scan": "scene",
    "scan artifacts": "scene",
    "scanlines": "scene",
    "scapular": "clothes",
    "scar": "sexual",
    "scar across eyebrow": "face",
    "scar on nose": "face",
    "scared": "face",
    "scarf": "clothes",
    "scarf choker": "clothes",
    "scarf grab": "clothes",
    "scarf over mouth": "clothes",
    "scarf tying": "pose",
    "scarlet devil mansion": "scene",
    "scat": "sexual",
    "scene fashion": "clothes",
    "scenery": "scene",
    "schoenbrunn palace": "scene",
    "school": "scene",
    "school gateway": "scene",
    "school gym": "scene",
    "school hat": "clothes",
    "school swimsuit": "clothes",
    "school uniform": "clothes",
    "scolding": "pose",
    "scone": "scene",
    "scoop neck": "clothes",
    "scorpion pose": "pose",
    "scotland": "pose",
    "scottish clothes": "clothes",
    "scouter": "clothes",
    "scowl": "face",
    "scrambled egg": "scene",
    "scrape": "body",
    "scratches": "body",
    "scratching": "pose",
    "screaming": "pose",
    "screenshot background": "scene",
    "screenshot redraw": "scene",
    "screentones": "scene",
    "scrotoplasty": "sexual",
    "scrunchie": "body",
    "se palmeiras": "pose",
    "seafloor": "scene",
    "seal costume": "clothes",
    "seamed legwear": "clothes",
    "searching": "pose",
    "seating chart": "scene",
    "seattle": "scene",
    "seattle kraken": "pose",
    "seattle mariners": "pose",
    "seattle seahawks": "pose",
    "seattle supersonics": "pose",
    "seaweed": "scene",
    "second battle of el alamein": "scene",
    "second sino-japanese war": "scene",
    "security shutter": "scene",
    "seductive smile": "face",
    "see-through clothes": "sexual",
    "see-through gloves": "clothes",
    "see-through hair": "body",
    "see-through legwear": "clothes",
    "see-through leotard": "clothes",
    "see-through mask": "clothes",
    "see-through raincoat": "clothes",
    "see-through scarf": "clothes",
    "see-through silhouette": "effects",
    "see-through sleeves": "clothes",
    "seed": "scene",
    "seigaiha": "clothes",
    "seitei jujiryou": "scene",
    "seiza": "pose",
    "self bondage": "sexual",
    "self fisting": "sexual",
    "selfcest": "sexual",
    "semi-circular eyewear": "clothes",
    "semi-rimless eyewear": "clothes",
    "senbei": "scene",
    "sendai (city)": "scene",
    "senegal": "scene",
    "sengoku jidai": "scene",
    "sensory deprivation": "sexual",
    "sentient scarf": "clothes",
    "seoul": "scene",
    "sepak takraw": "pose",
    "sepia": "effects",
    "serafuku": "clothes",
    "serbia": "pose",
    "serbian clothes": "clothes",
    "serie a": "pose",
    "serious": "face",
    "serving dome": "scene",
    "serving spatula": "scene",
    "sesame seeds": "scene",
    "setsubun": "scene",
    "severed hair": "body",
    "severed limb": "body",
    "sewer": "scene",
    "sewing": "pose",
    "sex": "sexual",
    "sex doll": "sexual",
    "sex from behind": "sexual",
    "sex machine": "sexual",
    "sex reassignment surgery": "sexual",
    "sex shop": "scene",
    "sex slave": "sexual",
    "sex toy": "sexual",
    "sexual": "body",
    "sexually suggestive": "sexual",
    "shack": "scene",
    "shackles": "sexual",
    "shade": "effects",
    "shaded face": "face",
    "shading eyes": "pose",
    "shadow": "effects",
    "shadow hands": "body",
    "shadow puppet": "limbs",
    "shaka sign": "limbs",
    "shaking": "pose",
    "shako cap": "clothes",
    "shakshuka": "scene",
    "shakunetsu no takkyuu musume": "pose",
    "shamoji": "scene",
    "shampoo": "body",
    "shampoo hat": "clothes",
    "shanghai": "scene",
    "shanzha (fruit)": "scene",
    "shaped lollipop": "scene",
    "shared scarf": "clothes",
    "sharing": "pose",
    "sharingan": "face",
    "shark print": "scene",
    "sharp toenails": "clothes",
    "shaved ice": "scene",
    "shaving": "pose",
    "shawl": "clothes",
    "shed": "scene",
    "sheep costume": "clothes",
    "sheep ears": "face",
    "sheffield united fc": "pose",
    "shelf bra": "body",
    "shell bikini": "clothes",
    "shell necklace": "clothes",
    "shendyt": "clothes",
    "shenzhen": "scene",
    "shibari": "sexual",
    "shibari marks": "sexual",
    "shibari over clothes": "sexual",
    "shibari under clothes": "sexual",
    "shibarikini": "sexual",
    "shibuya (tokyo)": "scene",
    "shibuya 109": "scene",
    "shichi-go-san": "scene",
    "shichirin": "scene",
    "shiga prefecture": "scene",
    "shiitake": "scene",
    "shikairo days dance (meme)": "pose",
    "shima (pattern)": "clothes",
    "shimane prefecture": "scene",
    "shimekazari": "scene",
    "shimenawa": "clothes",
    "shimizu s-pulse": "pose",
    "shin guards": "clothes",
    "shin strap": "clothes",
    "shinagawa (tokyo)": "scene",
    "shining needle castle": "scene",
    "shinjuku (tokyo)": "scene",
    "shinjuku park tower": "scene",
    "shinkon santaku": "scene",
    "shinora": "clothes",
    "shiny legwear": "clothes",
    "shiny skin": "body",
    "ship": "scene",
    "shipping (fandom)": "pose",
    "shippou (pattern)": "clothes",
    "shipyard": "scene",
    "shiroko oddloop dance": "pose",
    "shirt": "clothes",
    "shirt aside": "sexual",
    "shirt lift": "sexual",
    "shirt on shoulders": "clothes",
    "shirt pull": "sexual",
    "shirt slip": "sexual",
    "shirt stay": "clothes",
    "shirt tug": "sexual",
    "shirtwaist": "clothes",
    "shish kebab": "scene",
    "shitajiki (medium)": "scene",
    "shizuoka prefecture": "scene",
    "shocker (gesture)": "limbs",
    "shoe diva": "effects",
    "shoe pull": "sexual",
    "shoes": "clothes",
    "shoot dance (meme)": "pose",
    "shooting gallery": "scene",
    "shooting range": "scene",
    "shop": "scene",
    "shoplifting": "pose",
    "shopping": "pose",
    "shopping basket": "scene",
    "shopping cart": "scene",
    "shore": "scene",
    "short bangs": "body",
    "short eyebrows": "face",
    "short hair": "body",
    "short hair with long locks": "body",
    "short jumpsuit": "clothes",
    "short kimono": "clothes",
    "short over long sleeves": "clothes",
    "short ponytail": "body",
    "short shorts": "clothes",
    "short side ponytail": "body",
    "short sleeves": "clothes",
    "short twintails": "body",
    "short-sleeved coat": "clothes",
    "short-sleeved jacket": "clothes",
    "short-sleeved sweater": "clothes",
    "shortcake": "scene",
    "shorter than canon": "effects",
    "shorts": "clothes",
    "shorts aside": "sexual",
    "shorts pull": "sexual",
    "shorts under skirt": "clothes",
    "shosei": "clothes",
    "shot glass": "scene",
    "shota": "sexual",
    "shou (symbol)": "clothes",
    "shouji": "scene",
    "shoulder bag": "clothes",
    "shoulder belt": "clothes",
    "shoulder blades": "clothes",
    "shoulder carry": "pose",
    "shoulder cutout": "sexual",
    "shoulder massage": "clothes",
    "shoulder necklace": "clothes",
    "shoulder pads": "clothes",
    "shoulder phone": "clothes",
    "shoulder sash": "clothes",
    "shoulder-to-shoulder": "pose",
    "shoulders": "body",
    "shouryouuma": "scene",
    "shouten pegasus mix mori": "body",
    "shouting": "pose",
    "shower (place)": "scene",
    "shower cap": "clothes",
    "showering": "scene",
    "showgirl skirt": "clothes",
    "shrimp": "scene",
    "shrimp tempura": "scene",
    "shrimp tie": "sexual",
    "shrine": "scene",
    "shrug (clothing)": "clothes",
    "shrugging": "limbs",
    "shuangyaji": "body",
    "shufa guan": "clothes",
    "shukusei!! loli-kami requiem": "pose",
    "shumai (food)": "scene",
    "shushing": "limbs",
    "shutter shades": "clothes",
    "shy": "face",
    "side braid": "body",
    "side cape": "clothes",
    "side cutout": "sexual",
    "side handle teapot": "scene",
    "side ponytail": "body",
    "side slit": "sexual",
    "side-seamed legwear": "clothes",
    "side-tie bikini bottom": "clothes",
    "side-tie legwear": "clothes",
    "sideboob": "sexual",
    "sidecut": "body",
    "sideless outfit": "sexual",
    "sidelighting": "scene",
    "sidelocks": "body",
    "sidelocks tied back": "body",
    "sidewalk": "scene",
    "sideways": "scene",
    "sideways glance": "face",
    "sideways hat": "clothes",
    "sideways mouth": "face",
    "sideways perpendicular paizuri": "sexual",
    "siege of bastogne": "scene",
    "siege of odessa": "scene",
    "siege of sevastopol": "scene",
    "sigh": "face",
    "silent comic": "scene",
    "silent princess": "scene",
    "silhouette": "scene",
    "silk flower (genshin impact)": "scene",
    "silkpunk": "effects",
    "silver choker": "clothes",
    "silver necklace": "clothes",
    "silver one-piece swimsuit": "clothes",
    "silver skin": "body",
    "silver trim": "clothes",
    "simon shades": "clothes",
    "simple background": "scene",
    "simulated armpit sex": "sexual",
    "simulated bukkake": "sexual",
    "simulated cunnilingus": "sexual",
    "simulated facial": "sexual",
    "simulated fellatio": "sexual",
    "simulated fingering": "sexual",
    "simulated footjob": "sexual",
    "simulated handjob": "sexual",
    "simulated masturbation": "sexual",
    "simulated paizuri": "sexual",
    "simulated testicle stimulation": "sexual",
    "simulated thigh sex": "sexual",
    "singapore": "scene",
    "singing": "pose",
    "single braid": "body",
    "single breast curtain": "body",
    "single detached sleeve": "clothes",
    "single drill": "body",
    "single earring": "face",
    "single elbow glove": "clothes",
    "single eyebrow": "face",
    "single fingerless glove": "clothes",
    "single glove": "clothes",
    "single hair bun": "body",
    "single hair intake": "body",
    "single hair ring": "body",
    "single hair tube": "body",
    "single head wing": "body",
    "single knee pad": "clothes",
    "single mechanical eye": "face",
    "single sidelock": "body",
    "single sleeve": "clothes",
    "single wing": "body",
    "single-shoulder dress": "clothes",
    "single-shoulder shirt": "clothes",
    "single-shoulder sweater": "clothes",
    "sink": "scene",
    "sinking": "pose",
    "sitting": "pose",
    "sitting in tree": "scene",
    "sitting on face": "sexual",
    "sitting on head": "pose",
    "sitting on lap": "pose",
    "sitting on person": "pose",
    "sitting on shoulder": "pose",
    "sizzler plate": "scene",
    "skating": "pose",
    "skating rink": "scene",
    "skeletal wings": "body",
    "skeleton flower (plant)": "scene",
    "skeptical": "face",
    "sketch": "scene",
    "sketch background": "scene",
    "sketching": "pose",
    "ski goggles": "clothes",
    "skiing": "pose",
    "skinny": "sexual",
    "skinny dipping": "pose",
    "skipping": "pose",
    "skirt": "clothes",
    "skirt around ankles": "sexual",
    "skirt around one leg": "sexual",
    "skirt lift": "sexual",
    "skirt pull": "sexual",
    "skirt rolled up": "sexual",
    "skirt suit": "clothes",
    "skirt tug": "sexual",
    "skull choker": "clothes",
    "skull fucking": "sexual",
    "skull hat ornament": "clothes",
    "skull mask": "clothes",
    "skull necklace": "clothes",
    "skull-shaped pupils": "face",
    "sky focus": "effects",
    "sky surfing": "pose",
    "skyscraper": "scene",
    "slam dunk (series)": "pose",
    "slapping": "pose",
    "slapping breasts": "body",
    "slapping with breasts": "body",
    "slashing": "pose",
    "slave": "sexual",
    "slave market": "sexual",
    "slavic clothes": "clothes",
    "sleep mask": "clothes",
    "sleep molestation": "sexual",
    "sleep talking": "pose",
    "sleeping": "pose",
    "sleepy": "face",
    "sleeve cuffs": "clothes",
    "sleeved leotard": "clothes",
    "sleeveless": "sexual",
    "sleeveless coat": "clothes",
    "sleeveless dress": "clothes",
    "sleeveless duster": "clothes",
    "sleeveless hoodie": "clothes",
    "sleeveless jacket": "clothes",
    "sleeveless kimono": "clothes",
    "sleeveless shirt": "clothes",
    "sleeveless sweater": "clothes",
    "sleeveless turtleneck": "clothes",
    "sleeves past fingers": "clothes",
    "sleeves past wrists": "clothes",
    "sleeves pushed up": "sexual",
    "sleeves rolled up": "sexual",
    "sliced cheese": "scene",
    "sliced egg": "scene",
    "sliced meat": "scene",
    "sliding": "pose",
    "sliding doors": "scene",
    "slightly naughty expressions practice": "face",
    "slim legs": "body",
    "slime (creature)": "character",
    "slime hair": "body",
    "slimification": "effects",
    "slingshot swimsuit": "clothes",
    "slippers": "clothes",
    "slipping": "pose",
    "slit pupils": "face",
    "slit throat (gesture)": "limbs",
    "slouching": "pose",
    "slovak clothes": "clothes",
    "slovakia": "scene",
    "slovenia": "scene",
    "slums": "scene",
    "slushie": "scene",
    "small breasts": "body",
    "small chastity cage": "sexual",
    "small nipples": "body",
    "small penis": "sexual",
    "small testicles": "body",
    "smeared lipstick": "clothes",
    "smelling": "sexual",
    "smelling ass": "body",
    "smelling clothes": "sexual",
    "smelling feet": "sexual",
    "smelling flower": "scene",
    "smelling hair": "body",
    "smelling pantyhose": "sexual",
    "smelling underwear": "sexual",
    "smile": "face",
    "smiley face": "face",
    "smirk": "face",
    "smirnoff (vodka)": "scene",
    "smoke from nose": "face",
    "smoked cheese": "scene",
    "smokey eyeshadow": "clothes",
    "smoking": "pose",
    "smother": "sexual",
    "smug": "face",
    "snack": "scene",
    "snake hair": "body",
    "snake mask": "clothes",
    "snake mouth": "face",
    "snake necklace": "clothes",
    "snake penis": "body",
    "snake print": "clothes",
    "snakefruit": "scene",
    "snapdragon": "scene",
    "sneakers": "clothes",
    "sneezing": "pose",
    "snickers (brand)": "scene",
    "snifter": "scene",
    "snorkel mask": "clothes",
    "snow": "scene",
    "snowbell (flower)": "scene",
    "snowdrop (flower)": "scene",
    "snowflake background": "scene",
    "snowflake pupils": "face",
    "snowflakes": "scene",
    "snowing": "pose",
    "soaking feet": "body",
    "soapland": "scene",
    "soba": "scene",
    "sobbing": "pose",
    "soccer": "pose",
    "soccer ball": "pose",
    "soccer field": "scene",
    "soccer spirits": "pose",
    "soccer uniform": "pose",
    "social media composition": "scene",
    "sock pull": "sexual",
    "socks": "clothes",
    "soda": "scene",
    "soda bottle": "scene",
    "soda can": "scene",
    "soda fountain": "scene",
    "sofmap": "scene",
    "sofmap background": "scene",
    "soft focus": "effects",
    "soft serve": "scene",
    "softboiled egg": "scene",
    "softenni": "pose",
    "soju": "scene",
    "solarpunk": "effects",
    "soles": "body",
    "solid circle eyes": "face",
    "solid circle pupils": "face",
    "solid color thumbnail": "scene",
    "solid eyes": "face",
    "solid oval eyes": "face",
    "solo": "character",
    "solo focus": "character",
    "sombrero": "clothes",
    "songkok": "clothes",
    "songkran": "scene",
    "songpyeon": "scene",
    "sonic's drive-in": "scene",
    "soran bushi": "pose",
    "souffle (food)": "scene",
    "souffle pancake": "scene",
    "soumen": "scene",
    "sounding": "sexual",
    "soup": "scene",
    "south africa": "scene",
    "south korea": "scene",
    "soviet": "scene",
    "soy sauce": "scene",
    "soy sauce bottle": "scene",
    "space": "scene",
    "space elevator": "scene",
    "space helmet": "clothes",
    "space needle": "scene",
    "space print": "clothes",
    "space station": "scene",
    "spacecraft interior": "scene",
    "spaghetti": "scene",
    "spaghetti and meatballs": "scene",
    "spain": "scene",
    "spanish civil war": "scene",
    "spanish clothes": "clothes",
    "spanish-american war": "scene",
    "spanked": "sexual",
    "spanking": "sexual",
    "sparkle": "scene",
    "sparkle background": "scene",
    "sparkle print": "clothes",
    "sparkling eyes": "face",
    "sparks": "scene",
    "spasskaya tower": "scene",
    "spathiphyllum": "scene",
    "spats (footwear)": "clothes",
    "spatula": "scene",
    "spear mint tea": "scene",
    "speckled areolae": "body",
    "speed lines": "scene",
    "spider lily": "scene",
    "spider lily print": "clothes",
    "spider web": "scene",
    "spider web background": "scene",
    "spiderwort (flower)": "scene",
    "spiked bracelet": "clothes",
    "spiked choker": "clothes",
    "spiked collar": "clothes",
    "spiked dildo": "sexual",
    "spiked gloves": "clothes",
    "spiked hair": "body",
    "spiked legwear": "clothes",
    "spiked mask": "clothes",
    "spiked penis": "body",
    "spikes": "clothes",
    "spill": "scene",
    "spilling": "pose",
    "spine (medium)": "scene",
    "spinning": "pose",
    "spiral background": "scene",
    "spiral-only eyes": "face",
    "spitroast": "sexual",
    "spitting": "pose",
    "splashing": "pose",
    "splatoonification": "effects",
    "splatter background": "scene",
    "split": "pose",
    "split crop": "scene",
    "split mouth": "face",
    "split ponytail": "body",
    "split theme": "effects",
    "split-color hair": "body",
    "sponge cake": "scene",
    "spooky dance": "pose",
    "spoon": "scene",
    "spooning": "sexual",
    "spork": "scene",
    "sport club do recife": "pose",
    "sports bikini": "clothes",
    "sports drink": "scene",
    "sports sandals": "clothes",
    "sportswear": "pose",
    "spot color": "effects",
    "spotlight": "effects",
    "spotted hair": "body",
    "sprain": "body",
    "spraying": "pose",
    "spread anus": "body",
    "spread arms": "pose",
    "spread ass": "body",
    "spread eagle position": "pose",
    "spread fingers": "limbs",
    "spread legs": "pose",
    "spread pussy": "body",
    "spread pussy under clothes": "body",
    "spread toes": "body",
    "spreader bar": "sexual",
    "spreading another's pussy": "body",
    "spreading own pussy": "body",
    "spring onion": "scene",
    "springsuit": "clothes",
    "sprinkles": "scene",
    "sprout": "scene",
    "sprout-shaped pupils": "face",
    "spurs": "clothes",
    "square neckline": "clothes",
    "squash": "scene",
    "squatting": "pose",
    "squatting cowgirl position": "sexual",
    "squeeze bottle": "scene",
    "squeezing": "pose",
    "squiggle eyes": "face",
    "squinting": "pose",
    "squirrel ears": "face",
    "squirting liquid": "pose",
    "ss lazio": "pose",
    "ssc napoli": "pose",
    "st. basil's cathedral": "scene",
    "st. louis blues": "pose",
    "st. louis cardinals": "pose",
    "st. peter's basilica": "scene",
    "st. peter's square": "scene",
    "stab": "body",
    "stable": "scene",
    "stacking": "pose",
    "stadium": "scene",
    "staff room": "scene",
    "stage": "scene",
    "stage lights": "effects",
    "stahlhelm": "clothes",
    "stalking": "pose",
    "standing": "pose",
    "standing missionary": "sexual",
    "standing on bed": "pose",
    "standing on chair": "pose",
    "standing on desk": "pose",
    "standing on one leg": "pose",
    "standing on roof": "pose",
    "standing on shoulder": "pose",
    "standing sex": "sexual",
    "standing split": "pose",
    "star (sky)": "scene",
    "star (symbol)": "scene",
    "star choker": "clothes",
    "star hands": "limbs",
    "star hat ornament": "clothes",
    "star necklace": "clothes",
    "star print": "clothes",
    "star symbol background": "scene",
    "star-shaped eyewear": "clothes",
    "star-shaped hair": "body",
    "star-shaped pupils": "face",
    "starbucks": "scene",
    "starbucks siren": "scene",
    "starfruit": "scene",
    "staring": "pose",
    "starry hair": "body",
    "starry sky": "effects",
    "starry sky background": "scene",
    "starry sky print": "clothes",
    "station necklace": "clothes",
    "stationary restraints": "sexual",
    "stats": "scene",
    "statue of liberty": "scene",
    "steak": "scene",
    "stealth bondage": "sexual",
    "stealth masturbation": "sexual",
    "stealth paizuri": "sexual",
    "stealth sex": "sexual",
    "steam": "scene",
    "steam from nose": "face",
    "steamed bun": "scene",
    "steampunk": "clothes",
    "steepled fingers": "limbs",
    "step and repeat": "scene",
    "stepped on": "sexual",
    "steppee focus": "effects",
    "stepping": "pose",
    "stereogram": "scene",
    "stick": "scene",
    "sticker": "clothes",
    "sticker on face": "clothes",
    "sticky rice": "scene",
    "stifled laugh": "face",
    "stiletto heels": "clothes",
    "still life": "scene",
    "stilt house": "scene",
    "stinky tofu": "scene",
    "stippling (texture)": "scene",
    "stirring": "pose",
    "stirrup legwear": "clothes",
    "stitched mouth": "face",
    "stitches": "body",
    "stockholm": "scene",
    "stocks": "sexual",
    "stole": "clothes",
    "stollen": "scene",
    "stomach": "body",
    "stomach (organ)": "body",
    "stomach bulge": "sexual",
    "stomach cutout": "sexual",
    "stomach day": "scene",
    "stomach focus": "effects",
    "stomach punch": "sexual",
    "stomping": "pose",
    "stone mask": "clothes",
    "stone walkway": "scene",
    "stonehenge": "scene",
    "stonehenge turret network": "scene",
    "stop (gesture)": "limbs",
    "storage room": "scene",
    "stove": "scene",
    "straddling": "pose",
    "straddling paizuri": "sexual",
    "straight hair": "body",
    "straight-arm salute": "limbs",
    "straight-on": "scene",
    "strangling": "sexual",
    "strangling with hair": "body",
    "strap lift": "sexual",
    "strap pull": "sexual",
    "strap slip": "sexual",
    "strap-on": "sexual",
    "strapless": "clothes",
    "strapless bikini": "clothes",
    "strapless bottom": "clothes",
    "strapless bra": "clothes",
    "strapless dress": "clothes",
    "strapless leotard": "clothes",
    "strapless one-piece swimsuit": "clothes",
    "strapless shirt": "clothes",
    "strappado": "sexual",
    "strappy heels": "body",
    "straw cape": "clothes",
    "straw hat": "clothes",
    "strawberry": "scene",
    "strawberry background": "scene",
    "strawberry blossoms": "scene",
    "strawberry cake": "scene",
    "strawberry chocolate": "scene",
    "strawberry juice": "scene",
    "strawberry milk": "scene",
    "strawberry necklace": "clothes",
    "strawberry parfait": "scene",
    "strawberry pie": "scene",
    "strawberry print": "clothes",
    "strawberry shortcake": "scene",
    "strawberry slice": "scene",
    "strawberry swiss roll": "scene",
    "strawberry syrup": "scene",
    "strawberry tart": "scene",
    "streaked hair": "body",
    "streaking": "pose",
    "stream": "scene",
    "street": "scene",
    "streetwear": "clothes",
    "stretching": "pose",
    "string around finger": "clothes",
    "string bikini": "clothes",
    "string of fate": "clothes",
    "stringer": "clothes",
    "strip club": "scene",
    "striped": "clothes",
    "striped ascot": "clothes",
    "striped background": "scene",
    "striped bikini": "clothes",
    "striped bowtie": "clothes",
    "striped choker": "clothes",
    "striped gloves": "clothes",
    "striped hair": "body",
    "striped neckerchief": "clothes",
    "striped one-piece swimsuit": "clothes",
    "striped scarf": "clothes",
    "striped shirt": "clothes",
    "striped sleeves": "clothes",
    "stroking own chin": "limbs",
    "struggling": "pose",
    "stubble": "body",
    "stuck in the past": "scene",
    "stud earrings": "clothes",
    "studded choker": "clothes",
    "studded collar": "clothes",
    "studded legwear": "clothes",
    "studded mask": "clothes",
    "studio": "scene",
    "studs": "clothes",
    "studying": "pose",
    "style parody": "scene",
    "suama (food)": "scene",
    "subcul jirai": "clothes",
    "submarine": "scene",
    "subsurface scattering": "scene",
    "suburb": "scene",
    "subway": "scene",
    "subway (company)": "scene",
    "subway entrance": "scene",
    "subway station": "scene",
    "succulent plant": "scene",
    "sucking": "pose",
    "sucking own breasts": "pose",
    "suction cup dildo": "sexual",
    "sudachi (fruit)": "scene",
    "sugar bowl": "scene",
    "sugar cube": "scene",
    "sugar song and bitter step": "pose",
    "suginami (tokyo)": "scene",
    "suit": "clothes",
    "suit jacket": "clothes",
    "sukajan": "clothes",
    "sukiyaki": "scene",
    "sulking": "pose",
    "sumerian clothes": "clothes",
    "sumi-e": "scene",
    "sumida (tokyo)": "scene",
    "summer festival": "scene",
    "summoning": "pose",
    "sumo": "pose",
    "sun": "effects",
    "sun hat": "clothes",
    "sun necklace": "clothes",
    "sun rockers shibuya": "pose",
    "sunbathing": "pose",
    "sunbeam": "effects",
    "sunburst background": "scene",
    "sundae": "scene",
    "sunflower": "scene",
    "sunflower print": "clothes",
    "sunglasses": "clothes",
    "sunlight": "effects",
    "sunrise": "effects",
    "sunset": "effects",
    "suntory": "scene",
    "super bowl": "pose",
    "super bowl lx": "pose",
    "super bowl xlvi": "pose",
    "superflat": "effects",
    "superhero costume": "clothes",
    "superhero landing": "pose",
    "superman exposure": "pose",
    "supermarket": "scene",
    "surcoat": "clothes",
    "surfing": "pose",
    "surgery": "body",
    "surgical mask": "clothes",
    "surprised": "face",
    "surreal": "scene",
    "surrounded by feet": "body",
    "sushi": "scene",
    "sushi geta": "scene",
    "suspended congress": "sexual",
    "suspender skirt": "clothes",
    "suspenders": "clothes",
    "suspension": "sexual",
    "susuki grass": "scene",
    "suwa city": "scene",
    "suzu castella (food)": "scene",
    "swallowing": "pose",
    "swan mask": "clothes",
    "sway back": "pose",
    "swaying": "pose",
    "sweatband": "clothes",
    "sweater": "clothes",
    "sweater dress": "clothes",
    "sweater guard": "clothes",
    "sweater lift": "sexual",
    "sweater vest": "clothes",
    "sweatpants": "clothes",
    "sweden": "scene",
    "swedish clothes": "clothes",
    "sweeping": "pose",
    "sweet flower": "scene",
    "sweet lolita": "clothes",
    "sweet pea": "scene",
    "sweet potato": "scene",
    "sweet potato cake": "scene",
    "sweets": "scene",
    "swept bangs": "body",
    "swim briefs": "clothes",
    "swim cap": "clothes",
    "swim trunks": "clothes",
    "swimming": "pose",
    "swimsuit": "clothes",
    "swimsuit aside": "sexual",
    "swimsuit costume": "clothes",
    "swimsuit cover-up": "clothes",
    "swimsuit under clothes": "clothes",
    "swing": "pose",
    "swing!!": "pose",
    "swinging (relationship)": "pose",
    "swinging another": "pose",
    "swinging arm": "pose",
    "swinging arms": "pose",
    "swinging baseball bat": "pose",
    "swinging golf club": "pose",
    "swinging legs": "pose",
    "swinging object": "pose",
    "swinging on rope": "pose",
    "swinging on swing": "pose",
    "swinging tennis racket": "pose",
    "swinging weapon": "pose",
    "swirl lollipop": "scene",
    "swiss cheese": "scene",
    "swiss clothes": "clothes",
    "swiss roll": "scene",
    "switzerland": "scene",
    "sword art online": "scene",
    "sword over shoulder": "clothes",
    "sybian": "sexual",
    "sydney": "scene",
    "sydney harbour bridge": "scene",
    "sydney opera house": "scene",
    "symbol-shaped hair": "body",
    "symbol-shaped pupils": "face",
    "symmetrical docking": "pose",
    "symmetrical hand pose": "pose",
    "symmetry": "scene",
    "synagogue": "scene",
    "synthwave": "effects",
    "syria": "scene",
    "syrian civil war": "scene",
    "syringe": "body",
    "syrup": "scene",
    "t t": "face",
    "t-pose": "pose",
    "t-shirt": "clothes",
    "tabard": "clothes",
    "tabasco": "scene",
    "tabi": "clothes",
    "table": "clothes",
    "table humping": "sexual",
    "table tennis": "pose",
    "table tennis paddle": "pose",
    "tachi-e": "scene",
    "tachikawa (tokyo)": "scene",
    "taco": "scene",
    "taco bell": "scene",
    "tail": "sexual",
    "tail focus": "effects",
    "tail fondling": "pose",
    "tail insertion": "sexual",
    "tail lock": "pose",
    "tail masturbation": "sexual",
    "tail ornament": "clothes",
    "tail wagging": "pose",
    "tailcoat": "clothes",
    "tailjob": "sexual",
    "taipei": "scene",
    "taipei 101": "scene",
    "taiping rebellion": "scene",
    "taito (tokyo)": "scene",
    "taiwan": "scene",
    "taiwanese clothes": "clothes",
    "taiyaki": "scene",
    "taiyou whales": "pose",
    "taj mahal": "scene",
    "tajik clothes": "clothes",
    "tajikistan": "scene",
    "take your pick": "sexual",
    "takehara (hiroshima)": "scene",
    "takenoko no sato": "scene",
    "takeout container": "scene",
    "tako-san wiener": "scene",
    "takoyaki": "scene",
    "takuan": "scene",
    "tales of (series)": "scene",
    "talking": "pose",
    "tall image": "scene",
    "taller than canon": "effects",
    "tally": "sexual",
    "tam o' shanter": "clothes",
    "tamagokake gohan": "scene",
    "tamagoyaki": "scene",
    "tamagoyaki pan": "scene",
    "tamarind": "scene",
    "tampa bay buccaneers": "pose",
    "tampa bay lightning": "pose",
    "tampa bay rays": "pose",
    "tan": "sexual",
    "tanabata": "scene",
    "tang jin (headwear)": "clothes",
    "tanghulu": "scene",
    "tango": "pose",
    "tangyuan": "scene",
    "tangzhuang": "clothes",
    "tank helmet": "clothes",
    "tank interior": "scene",
    "tank top": "clothes",
    "tankini": "clothes",
    "tanlines": "sexual",
    "tanzaku": "scene",
    "tap dance": "pose",
    "tape gag": "sexual",
    "tareme": "face",
    "taro (food)": "scene",
    "tart (food)": "scene",
    "tartare (food)": "scene",
    "tassel": "clothes",
    "tassel necklace": "clothes",
    "tasting": "pose",
    "tasuki": "clothes",
    "tatar clothes": "clothes",
    "tate eboshi": "clothes",
    "tatewaku": "clothes",
    "tattoo": "effects",
    "taue odori": "pose",
    "taunting": "pose",
    "taut shirt": "clothes",
    "tavern": "scene",
    "tawawa challenge": "body",
    "tea": "scene",
    "tea ceremony": "scene",
    "tea party": "scene",
    "tea set": "scene",
    "tea strainer": "scene",
    "teaching": "pose",
    "teacup": "scene",
    "teamwork (sexual)": "sexual",
    "teapot": "scene",
    "teapot warmer": "scene",
    "teardrop-framed glasses": "clothes",
    "tears": "face",
    "teasing": "pose",
    "tecate": "scene",
    "techwear": "clothes",
    "tecmo super bowl": "pose",
    "teddy (lingerie)": "clothes",
    "teddy bear sex": "sexual",
    "teekyuu": "pose",
    "tegaki": "scene",
    "temperature play": "sexual",
    "temple": "scene",
    "tempura": "scene",
    "tenga": "sexual",
    "tengai (hat)": "clothes",
    "tengu mask": "clothes",
    "tennis": "pose",
    "tennis ball": "pose",
    "tennis no ouji-sama": "pose",
    "tennis racket": "pose",
    "tennis uniform": "pose",
    "tenshi kaiwai": "clothes",
    "tentacle clothes": "sexual",
    "tentacle gagged": "sexual",
    "tentacle hair": "body",
    "tentacle on penis": "sexual",
    "tentacle pit": "sexual",
    "tentacle sex": "sexual",
    "tentacles": "sexual",
    "tentacles in thighhighs": "sexual",
    "tentacles on male": "sexual",
    "tentacles under clothes": "sexual",
    "tenugui": "clothes",
    "tequila": "scene",
    "terrine (food)": "scene",
    "testicle clamps": "sexual",
    "testicle crusher": "sexual",
    "testicle sucking": "sexual",
    "testicle weights": "sexual",
    "testicles": "body",
    "testicles touching": "sexual",
    "testosterone": "sexual",
    "tet offensive": "scene",
    "texas": "scene",
    "texas league": "pose",
    "texas rangers": "pose",
    "text background": "scene",
    "text focus": "scene",
    "text in eyes": "face",
    "text in mouth": "face",
    "text messaging": "pose",
    "thai clothes": "clothes",
    "thailand": "scene",
    "thank you": "scene",
    "thanksgiving": "scene",
    "the king (burger king)": "scene",
    "the last supper": "scene",
    "the monkey (dance)": "pose",
    "the pose": "body",
    "the viewer": "character",
    "theater": "scene",
    "theft": "pose",
    "thermite grenade": "scene",
    "thermos": "scene",
    "thick arms": "body",
    "thick eyebrows": "face",
    "thick thighs": "body",
    "thigh boots": "clothes",
    "thigh cutout": "sexual",
    "thigh focus": "scene",
    "thigh ribbon": "clothes",
    "thigh sex": "sexual",
    "thigh straddling": "pose",
    "thigh strap": "clothes",
    "thighband pantyhose": "clothes",
    "thighhighs": "clothes",
    "thighlet": "clothes",
    "thighs": "body",
    "thimble": "clothes",
    "thinking": "pose",
    "thinner than canon": "effects",
    "third eye": "face",
    "third indochina war": "scene",
    "third-party extraction": "scene",
    "third-party watermark": "scene",
    "thistle": "scene",
    "thobe": "clothes",
    "thong": "clothes",
    "thong bikini": "clothes",
    "three-quarter sleeves": "clothes",
    "three-toned background": "scene",
    "threesome": "sexual",
    "through bars": "sexual",
    "through door": "scene",
    "through portal": "scene",
    "throwing": "pose",
    "thumb hole sleeves": "clothes",
    "thumb sucking": "pose",
    "thumbnail collage": "scene",
    "thumbnail surprise": "scene",
    "thumbprint cookie": "scene",
    "thumbs down": "limbs",
    "thumbs up": "limbs",
    "tiananmen square": "scene",
    "tiara": "clothes",
    "tibetan clothes": "clothes",
    "tickle torture": "sexual",
    "tickling": "pose",
    "tickling feet": "pose",
    "tie clip": "clothes",
    "tied breast": "body",
    "tied nipples": "body",
    "tiered tray": "scene",
    "tiger costume": "clothes",
    "tiger ears": "face",
    "tiger lily": "scene",
    "tiger print": "clothes",
    "tiger stripes": "clothes",
    "tights day": "scene",
    "tigres uanl": "pose",
    "tigridia": "scene",
    "tileable": "scene",
    "tilted headwear": "clothes",
    "tim hortons": "scene",
    "time paradox": "character",
    "times square": "scene",
    "tiny anus": "body",
    "tiptoe kiss": "pose",
    "tiptoes": "pose",
    "tiramisu": "scene",
    "toast": "scene",
    "toast in mouth": "scene",
    "toaster": "scene",
    "toblerone": "scene",
    "toca toca toca dance (meme)": "pose",
    "tochigi prefecture": "scene",
    "toddlercon": "sexual",
    "toe cleavage": "body",
    "toe grab": "body",
    "toe ring": "body",
    "toe scrunch": "pose",
    "toe seam": "body",
    "toe socks": "clothes",
    "toe sucking": "pose",
    "toeless legwear": "clothes",
    "toenail polish": "clothes",
    "toenails": "body",
    "toes": "body",
    "tofu": "scene",
    "togetsukyou bridge": "scene",
    "tohato caramel corn": "scene",
    "toilet stall": "scene",
    "tokin hat": "clothes",
    "tokoname city": "scene",
    "tokoroten-tsuki": "scene",
    "tokushima prefecture": "scene",
    "tokyo": "scene",
    "tokyo big sight": "scene",
    "tokyo city hall": "scene",
    "tokyo skytree": "scene",
    "tokyo tower": "scene",
    "tokyo verdy": "pose",
    "tokyo yakult swallows": "pose",
    "tomato": "scene",
    "tomato plant": "scene",
    "tomato sauce": "scene",
    "tomb": "scene",
    "tomboy": "sexual",
    "tongs": "scene",
    "tongue": "body",
    "tongue clamp": "sexual",
    "too many cats": "character",
    "too many lipstick marks": "clothes",
    "too many scoops": "scene",
    "too many sex toys": "sexual",
    "too many tentacles": "sexual",
    "tooth necklace": "clothes",
    "tooth pulling": "sexual",
    "tootsweets": "scene",
    "top hat": "clothes",
    "top pull": "sexual",
    "top-down bottom-up": "sexual",
    "topiary": "scene",
    "topknot": "body",
    "topless female": "sexual",
    "topless male": "sexual",
    "toppo": "scene",
    "toque blanche": "clothes",
    "torch": "scene",
    "torii": "scene",
    "torioigasa": "clothes",
    "torn ascot": "clothes",
    "torn clothes": "clothes",
    "torn gloves": "clothes",
    "torn hat": "clothes",
    "torn leg warmers": "clothes",
    "torn leggings": "clothes",
    "torn legwear": "clothes",
    "torn mask": "clothes",
    "torn pantyhose": "clothes",
    "torn scarf": "clothes",
    "torn sleeves": "clothes",
    "torn socks": "clothes",
    "torn swimsuit": "clothes",
    "torn thighhighs": "clothes",
    "torn wings": "body",
    "torogao": "sexual",
    "toronto": "scene",
    "toronto blue jays": "pose",
    "toronto maple leafs": "pose",
    "toronto raptors": "pose",
    "torso grab": "sexual",
    "tortilla chips": "scene",
    "tortoiseshell-framed eyewear": "clothes",
    "torture": "sexual",
    "torture dance": "pose",
    "torture instruments": "sexual",
    "toshima (tokyo)": "scene",
    "tottenham hotspur fc": "pose",
    "tottori prefecture": "scene",
    "touch (manga)": "pose",
    "touching": "pose",
    "touhoku rakuten golden eagles": "pose",
    "touhou": "scene",
    "towel around neck": "clothes",
    "towel slip": "sexual",
    "tower": "scene",
    "tower of salvation (tales)": "scene",
    "tower of the sun": "scene",
    "town": "scene",
    "town square": "scene",
    "toyama city": "scene",
    "toyama prefecture": "scene",
    "track and field": "pose",
    "track marks": "body",
    "track suit": "clothes",
    "trad goth": "clothes",
    "traditional bowtie": "clothes",
    "traditional greek clothes": "clothes",
    "traditional japanese patterns": "scene",
    "traditional media": "scene",
    "traditional nun": "clothes",
    "trafalgar square": "scene",
    "traffic cone on head": "clothes",
    "train interior": "scene",
    "train station": "scene",
    "train station platform": "scene",
    "training": "pose",
    "trampling": "body",
    "trampling table": "sexual",
    "trans rights": "sexual",
    "transamerica pyramid": "scene",
    "transgender day of visibility": "sexual",
    "transgender flag": "sexual",
    "transgender flag print": "sexual",
    "transgender symbol": "sexual",
    "transparent background": "scene",
    "transparent wings": "body",
    "transphobia": "sexual",
    "trap": "sexual",
    "trap door": "scene",
    "traumatized": "face",
    "tray": "scene",
    "tree": "scene",
    "tree focus": "effects",
    "tree hollow": "scene",
    "tree shade": "scene",
    "tree stump": "scene",
    "treehouse": "scene",
    "trembling": "pose",
    "trench": "scene",
    "trench coat": "clothes",
    "tress ribbon": "clothes",
    "tri braids": "body",
    "tri drills": "body",
    "tri hair rings": "body",
    "tri tails": "body",
    "triadic colors": "effects",
    "triangle background": "scene",
    "triangle hair bun with corners toward head": "body",
    "triangle hands": "limbs",
    "triangle mouth": "face",
    "triangle print": "clothes",
    "triangle-shaped pupils": "face",
    "triangular eyewear": "clothes",
    "triangular headpiece": "clothes",
    "tribadism": "sexual",
    "tribadism gesture": "limbs",
    "trick or treat": "scene",
    "tricorne": "clothes",
    "trilby": "clothes",
    "trim marks": "scene",
    "trinidad and tobago": "scene",
    "triple amputee": "sexual",
    "triple anal": "sexual",
    "triple bun": "body",
    "triple penetration": "sexual",
    "triple vaginal": "sexual",
    "triple wielding": "pose",
    "triplefold": "pose",
    "tripping": "body",
    "triptych (art)": "scene",
    "troll face": "face",
    "trolling": "pose",
    "troonjak": "sexual",
    "tropical drink": "scene",
    "tropicana field": "scene",
    "truffle (mushroom)": "scene",
    "trump tower": "scene",
    "trumpet creeper": "scene",
    "tsuki ni kawatte oshioki yo": "limbs",
    "tsukimi": "scene",
    "tsukimi burger": "scene",
    "tsukimi dango": "scene",
    "tsunokakushi": "clothes",
    "tsurime": "face",
    "tsutenkaku": "scene",
    "tube socks": "clothes",
    "tube top": "clothes",
    "tuberose": "scene",
    "tucking hair": "pose",
    "tudor": "clothes",
    "tulip": "scene",
    "tulip hat": "clothes",
    "tulsa drillers": "pose",
    "tundra": "scene",
    "tunic": "clothes",
    "tunisia": "scene",
    "tunnel": "scene",
    "tupet": "scene",
    "turban": "clothes",
    "turing love": "pose",
    "turkey (country)": "scene",
    "turkey (food)": "scene",
    "turkey leg": "scene",
    "turkish clothes": "clothes",
    "turkmenistan": "scene",
    "turn pale": "face",
    "turnip": "scene",
    "turtleneck": "clothes",
    "turtleneck bodysuit": "clothes",
    "turtleneck dress": "clothes",
    "turtleneck jacket": "clothes",
    "turtleneck one-piece swimsuit": "clothes",
    "turtleneck shirt": "clothes",
    "turtleneck sweater": "clothes",
    "tutu": "clothes",
    "tuxedo": "clothes",
    "twee fashion": "clothes",
    "twerking": "pose",
    "twice cooked pork": "scene",
    "twilight": "effects",
    "twin braids": "body",
    "twin drills": "body",
    "twincest": "sexual",
    "twintails": "body",
    "twintails day": "scene",
    "twirling hair": "limbs",
    "twisted torso": "pose",
    "twitching": "pose",
    "two side up": "body",
    "two-finger salute": "limbs",
    "two-footed footjob": "sexual",
    "two-handed handjob": "sexual",
    "two-tone ascot": "clothes",
    "two-tone background": "scene",
    "two-tone bowtie": "clothes",
    "two-tone eyes": "face",
    "two-tone eyeshadow": "clothes",
    "two-tone eyewear": "clothes",
    "two-tone hair": "body",
    "two-tone legwear": "clothes",
    "two-tone lips": "clothes",
    "two-tone neckerchief": "clothes",
    "two-tone scarf": "clothes",
    "two-tone skin": "body",
    "two-tone sleeves": "clothes",
    "tying": "pose",
    "tying footwear": "pose",
    "tying hair": "body",
    "typing": "pose",
    "typo": "scene",
    "uc sampdoria": "pose",
    "ucc coffee": "scene",
    "uchikake": "clothes",
    "uchiwa (medium)": "clothes",
    "uchuu kei": "clothes",
    "udon": "scene",
    "uefa champions league": "pose",
    "uefa euros": "pose",
    "ufo day": "scene",
    "ugoku ugoku": "pose",
    "uirou (food)": "scene",
    "ukiyo-e": "scene",
    "ukraine": "pose",
    "ukrainian clothes": "clothes",
    "ultraviolet light": "effects",
    "uluru": "scene",
    "umafication": "effects",
    "umaibou": "scene",
    "umbrella": "clothes",
    "umbrella riding": "pose",
    "umeboshi": "scene",
    "umeda sky building": "scene",
    "unadon (food)": "scene",
    "unaligned breasts": "body",
    "unamused": "face",
    "unbirthing": "sexual",
    "unbuttoned": "sexual",
    "uncensored": "scene",
    "uncongealed tofu": "scene",
    "under tree": "scene",
    "under-rim eyewear": "clothes",
    "underboob": "sexual",
    "underboob cutout": "sexual",
    "underbust": "clothes",
    "underbutt": "body",
    "undercut": "body",
    "underlighting": "scene",
    "undersized breast cup": "body",
    "underwater": "scene",
    "underwater city": "scene",
    "underwater sex": "sexual",
    "underwear only": "sexual",
    "undone ascot": "clothes",
    "undone neckerchief": "clothes",
    "undone sarashi": "clothes",
    "undressing": "sexual",
    "uneven eyes": "face",
    "uneven footing": "pose",
    "uneven gloves": "clothes",
    "uneven legwear": "clothes",
    "uneven sleeves": "clothes",
    "uneven twintails": "body",
    "unfinished": "scene",
    "unibrow": "face",
    "unicorn mask": "clothes",
    "unitard": "clothes",
    "united arab emirates": "scene",
    "united kingdom": "scene",
    "united states": "scene",
    "united states capitol": "scene",
    "unmasking": "clothes",
    "unmoving pattern": "scene",
    "unsheathing": "pose",
    "untied bikini bottom": "sexual",
    "untied bikini top": "sexual",
    "untying": "sexual",
    "unusually open eyes": "face",
    "unworn choker": "clothes",
    "unworn eyewear": "clothes",
    "unworn gloves": "clothes",
    "unworn hat": "clothes",
    "unworn headwear": "clothes",
    "unworn helmet": "clothes",
    "unworn mask": "clothes",
    "unworn neckerchief": "clothes",
    "unworn necklace": "clothes",
    "unworn necktie": "clothes",
    "unworn scarf": "clothes",
    "unzipped": "sexual",
    "unzipping": "sexual",
    "unzipping with mouth": "pose",
    "up sleeve": "clothes",
    "upper body": "scene",
    "upright 69": "sexual",
    "upright straddle": "sexual",
    "upscaled": "scene",
    "upside-down": "pose",
    "upside-down cake": "scene",
    "upskirt": "sexual",
    "upturned eyes": "face",
    "urawa red diamonds": "pose",
    "urethral beads": "sexual",
    "urethral insertion": "sexual",
    "uroko (pattern)": "clothes",
    "uruguay": "pose",
    "us citta di palermo": "pose",
    "usagi manjuu": "scene",
    "used condom": "sexual",
    "used condom on penis": "sexual",
    "usekh collar": "clothes",
    "ushanka": "clothes",
    "uso da": "face",
    "utah": "scene",
    "utah jazz": "pose",
    "utensil rack": "scene",
    "uterus": "body",
    "uwabaki": "clothes",
    "uwu": "face",
    "uygur clothes": "clothes",
    "uzbek clothes": "clothes",
    "uzbekistan": "scene",
    "v": "limbs",
    "v arms": "pose",
    "v over eye": "limbs",
    "v over mouth": "limbs",
    "v-neck": "clothes",
    "v-shaped eyebrows": "face",
    "vaginal": "sexual",
    "vaginal object insertion": "sexual",
    "vaginoplasty": "sexual",
    "valencia cf": "pose",
    "valentine": "scene",
    "vancouver canucks": "pose",
    "vancouver grizzlies": "pose",
    "vanishing point": "scene",
    "vanity table": "clothes",
    "vaporwave": "effects",
    "variations": "scene",
    "vatican": "scene",
    "vector circles": "effects",
    "vector trace": "scene",
    "vegalta sendai": "pose",
    "vegas golden knights": "pose",
    "vegetable": "scene",
    "vehicalization": "effects",
    "vehicle focus": "scene",
    "vehicle interior": "scene",
    "veil": "clothes",
    "veiny breasts": "body",
    "veiny penis": "body",
    "venezuela": "scene",
    "venice": "scene",
    "venus bikini": "clothes",
    "venus flytrap": "scene",
    "versatile slime penetration": "sexual",
    "vertical stripes": "clothes",
    "vertical-striped background": "scene",
    "vertical-striped scarf": "clothes",
    "very dark skin": "body",
    "very long hair": "body",
    "very low bun": "body",
    "very short hair": "body",
    "very wide shot": "scene",
    "vest": "clothes",
    "vhs artifacts": "scene",
    "vibrator": "sexual",
    "vibrator in anus": "sexual",
    "vibrator in thigh strap": "sexual",
    "vibrator in thighhighs": "sexual",
    "vibrator on nipple": "sexual",
    "vibrator on penis": "sexual",
    "vibrator under clothes": "sexual",
    "vibrator under panties": "sexual",
    "vibrator under pantyhose": "sexual",
    "victorian": "clothes",
    "victory day": "scene",
    "victory over japan day": "scene",
    "victory pose": "limbs",
    "video": "scene",
    "video game cover": "scene",
    "vienna": "scene",
    "viennetta": "scene",
    "viet lolita": "clothes",
    "vietnam": "scene",
    "vietnam war": "scene",
    "vietnamese clothes": "clothes",
    "viewfinder": "scene",
    "vignetting": "scene",
    "village": "scene",
    "villain pose": "pose",
    "vines": "scene",
    "vinok": "clothes",
    "violet (flower)": "scene",
    "virtual pet (toy)": "clothes",
    "visby": "scene",
    "visor cap": "clothes",
    "vissel kobe": "pose",
    "visual kei": "clothes",
    "vita (vitasoy)": "scene",
    "vitiligo": "body",
    "vladivostok": "scene",
    "vodka": "scene",
    "void face": "face",
    "voile": "scene",
    "volcano": "scene",
    "volleyball (sport)": "pose",
    "vomiting": "pose",
    "vore": "sexual",
    "voyeurism": "sexual",
    "vulcan salute": "limbs",
    "w": "limbs",
    "w arms": "pose",
    "wa lolita": "clothes",
    "wading": "pose",
    "wafer": "scene",
    "wafer stick": "scene",
    "waffle": "scene",
    "waffle cone": "scene",
    "wagashi": "scene",
    "waifu2x": "scene",
    "waist cape": "clothes",
    "waist hug": "pose",
    "waist measuring": "pose",
    "waist sash": "clothes",
    "waistcoat": "clothes",
    "waiter": "scene",
    "waiting": "pose",
    "waitress": "clothes",
    "wakamezake": "sexual",
    "wakayama prefecture": "scene",
    "wakkanai": "scene",
    "wales": "scene",
    "walk cycle": "pose",
    "walk-in": "sexual",
    "walking": "pose",
    "walking on wall": "pose",
    "wall lamp": "effects",
    "wall-eyed": "face",
    "wallet": "clothes",
    "wallet chain": "clothes",
    "wallpaper": "scene",
    "wallpaper forced": "scene",
    "walnut": "scene",
    "waltz (dance)": "pose",
    "wand lighter": "scene",
    "want want": "scene",
    "war in afghanistan": "scene",
    "warabi": "scene",
    "warabimochi": "scene",
    "waraji": "clothes",
    "warbonnet": "clothes",
    "warehouse": "scene",
    "wariza": "pose",
    "warm colors": "effects",
    "warming": "pose",
    "wartenberg wheel": "sexual",
    "wasabi": "scene",
    "washing": "pose",
    "washington commanders": "pose",
    "washington d.c.": "scene",
    "washington monument": "scene",
    "washington nationals": "pose",
    "washington wizards": "pose",
    "washinomiya shrine": "scene",
    "wasteland": "scene",
    "watch": "clothes",
    "watch fob": "clothes",
    "watching": "pose",
    "watching television": "pose",
    "watchtower": "scene",
    "water": "scene",
    "water caltrop": "scene",
    "water gun": "scene",
    "water lily flower": "scene",
    "water polo": "pose",
    "water torture": "sexual",
    "water volleyball": "pose",
    "watercolor background": "scene",
    "watercolor effect": "effects",
    "waterfall": "scene",
    "watering": "pose",
    "watermelon": "scene",
    "watermelon bar": "scene",
    "watermelon print": "clothes",
    "waterpark": "scene",
    "watson cross": "pose",
    "wave print": "clothes",
    "waving": "limbs",
    "wavy hair": "body",
    "wavy mouth": "face",
    "wax play": "sexual",
    "weapon": "body",
    "weapon background": "scene",
    "weapon focus": "scene",
    "weapon over shoulder": "clothes",
    "weapon shop": "scene",
    "weasel mask": "clothes",
    "web address": "scene",
    "wedding": "pose",
    "wedding cake": "scene",
    "wedding ring": "clothes",
    "wedge heels": "clothes",
    "wedgie": "body",
    "weighing breasts": "body",
    "weirdcore": "effects",
    "welding": "pose",
    "welding mask": "clothes",
    "well": "scene",
    "wendy (wendy's)": "scene",
    "wendy's": "scene",
    "westminster palace": "scene",
    "wet": "scene",
    "wet clothes": "scene",
    "wet dress": "scene",
    "wet hair": "body",
    "wet panties": "scene",
    "wet shirt": "scene",
    "wet skirt": "scene",
    "wet swimsuit": "scene",
    "wet towel": "scene",
    "wetland": "scene",
    "wetsuit": "clothes",
    "wharf": "scene",
    "whataburger": "scene",
    "wheat field": "scene",
    "whimsy twee": "clothes",
    "whip": "sexual",
    "whip (dance)": "pose",
    "whip marks": "sexual",
    "whipped cream": "scene",
    "whipping": "sexual",
    "whipping hair": "body",
    "whisk": "scene",
    "whiskey": "scene",
    "whisking": "pose",
    "whispering": "pose",
    "whistle around neck": "clothes",
    "whistle!": "pose",
    "whistling": "pose",
    "white ascot": "clothes",
    "white background": "scene",
    "white bowtie": "clothes",
    "white chocolate": "scene",
    "white choker": "clothes",
    "white day": "scene",
    "white eyes": "face",
    "white eyeshadow": "clothes",
    "white fire": "scene",
    "white gloves": "clothes",
    "white hair": "body",
    "white hat": "clothes",
    "white house": "scene",
    "white lips": "clothes",
    "white mask": "clothes",
    "white neckerchief": "clothes",
    "white necktie": "clothes",
    "white one-piece swimsuit": "clothes",
    "white phosphorus": "scene",
    "white pupils": "face",
    "white rabbit candy": "scene",
    "white russian (drink)": "scene",
    "white scarf": "clothes",
    "white skin": "body",
    "white sleeves": "clothes",
    "white strawberry": "scene",
    "white theme": "effects",
    "white trim": "clothes",
    "white wings": "body",
    "white-framed eyewear": "clothes",
    "whole face": "face",
    "wide hips": "body",
    "wide image": "scene",
    "wide shot": "scene",
    "wide sleeves": "clothes",
    "wide-eyed": "face",
    "widescreen": "scene",
    "widow's peak": "body",
    "wig": "clothes",
    "wildfire": "scene",
    "willis tower": "scene",
    "willow": "scene",
    "wilted flower": "scene",
    "wimple": "clothes",
    "wince": "face",
    "wind chime focus": "scene",
    "wind glider": "body",
    "windmill": "scene",
    "window": "scene",
    "window shadow": "effects",
    "wine": "scene",
    "wine glass": "scene",
    "wing biting": "body",
    "wing censor": "body",
    "wing collar": "clothes",
    "wing ears": "body",
    "wing hold": "body",
    "wing hug": "pose",
    "wing ornament": "clothes",
    "wing piercing": "body",
    "wing print": "clothes",
    "wing ribbon": "body",
    "wing tattoo": "body",
    "wing umbrella": "body",
    "wing-shaped bow": "body",
    "winged": "clothes",
    "winged arms": "body",
    "winged bag": "body",
    "winged boots": "clothes",
    "winged footwear": "body",
    "winged hairband": "body",
    "winged hat": "body",
    "winged helmet": "clothes",
    "winged sandals": "clothes",
    "winged shoes": "clothes",
    "winged slippers": "clothes",
    "winged umbrella": "body",
    "wingjob": "body",
    "wings": "body",
    "wings through clothes": "body",
    "wingtip collar": "clothes",
    "winnipeg blue bombers": "pose",
    "winnipeg jets": "pose",
    "winter clothes": "clothes",
    "winter coat": "clothes",
    "wishcore": "clothes",
    "wispy bangs": "body",
    "wisteria": "scene",
    "witch hat": "clothes",
    "wither rose": "scene",
    "wizard hat": "clothes",
    "wok": "scene",
    "wolf cut": "body",
    "wolf ears": "face",
    "wolf hat": "clothes",
    "wolf mask": "clothes",
    "wolfsbane (flower)": "scene",
    "women's day": "scene",
    "wonton": "scene",
    "wooden bridge": "scene",
    "wooden door": "scene",
    "wooden horse": "sexual",
    "wooden lantern": "effects",
    "work boots": "clothes",
    "working": "pose",
    "workshop": "scene",
    "world baseball classic": "pose",
    "world cup": "pose",
    "world trade center": "scene",
    "world war i": "scene",
    "world war ii": "scene",
    "worm (dance)": "pose",
    "worried": "face",
    "wotagei": "pose",
    "woven hatching": "scene",
    "wreath": "scene",
    "wrestling": "pose",
    "wrestling mask": "clothes",
    "wrestling ring": "scene",
    "wringing": "pose",
    "wringing clothes": "sexual",
    "wrist cuffs": "clothes",
    "wrist cutting": "pose",
    "wrist flower": "clothes",
    "wrist ruff": "clothes",
    "wrist scrunchie": "clothes",
    "wrist wings": "body",
    "wristband": "clothes",
    "wrists bound apart": "sexual",
    "wristwatch": "clothes",
    "writing": "pose",
    "wrong foot": "body",
    "wyoming": "scene",
    "x anus": "body",
    "x arms": "limbs",
    "x fingers": "limbs",
    "x hair ornament": "clothes",
    "x mouth": "face",
    "x x": "face",
    "x-cross (bdsm)": "sexual",
    "x-ray": "sexual",
    "x-ray glasses": "clothes",
    "x-shaped pupils": "face",
    "x<": "face",
    "x3": "face",
    "xd": "face",
    "xi zhi lang": "scene",
    "xiangyun": "clothes",
    "xiangyun print": "clothes",
    "xiezhi guan": "clothes",
    "xinzhongshi": "clothes",
    "y2k fashion": "clothes",
    "yabi fashion": "clothes",
    "yagasuri": "clothes",
    "yakiniku": "scene",
    "yakisoba": "scene",
    "yakisobapan": "scene",
    "yakitori": "scene",
    "yakult": "scene",
    "yamagata prefecture": "scene",
    "yamaguchi prefecture": "scene",
    "yamanashi prefecture": "scene",
    "yami kawaii": "clothes",
    "yaoi": "sexual",
    "yaopei": "clothes",
    "yasukuni shrine": "scene",
    "yatai": "scene",
    "yawning": "pose",
    "yebisu": "scene",
    "yellow apple": "scene",
    "yellow ascot": "clothes",
    "yellow background": "scene",
    "yellow bowtie": "clothes",
    "yellow choker": "clothes",
    "yellow eyes": "face",
    "yellow eyeshadow": "clothes",
    "yellow gloves": "clothes",
    "yellow hat": "clothes",
    "yellow lips": "clothes",
    "yellow mask": "clothes",
    "yellow neckerchief": "clothes",
    "yellow necktie": "clothes",
    "yellow one-piece swimsuit": "clothes",
    "yellow pepper": "scene",
    "yellow pupils": "face",
    "yellow raincoat": "clothes",
    "yellow scarf": "clothes",
    "yellow sclera": "face",
    "yellow skin": "body",
    "yellow sleeves": "clothes",
    "yellow theme": "effects",
    "yellow wings": "body",
    "yellow-framed eyewear": "clothes",
    "yellow-tinted eyewear": "clothes",
    "yi clothes": "clothes",
    "yoga": "pose",
    "yoga pants": "clothes",
    "yogurt": "scene",
    "yoke (bdsm)": "sexual",
    "yokhoe (food)": "scene",
    "yokohama": "scene",
    "yokohama b-corsairs": "pose",
    "yokohama dena baystars": "pose",
    "yokohama f. marinos": "pose",
    "yokohama landmark tower": "scene",
    "yokosuka": "scene",
    "yokozuwari": "pose",
    "yomiuri giants": "pose",
    "yonic symbol": "sexual",
    "yosakoi": "pose",
    "yoshinoya (restaurant)": "scene",
    "youkai mountain": "scene",
    "youkan (food)": "scene",
    "yuanbao": "body",
    "yuanbao ji (hairstyle)": "body",
    "yugake": "clothes",
    "yugoslavia": "scene",
    "yuiwata": "body",
    "yukata": "clothes",
    "yukata lift": "sexual",
    "yukiwa (pattern)": "clothes",
    "yule log (cake)": "scene",
    "yume kawaii": "clothes",
    "yunomi": "scene",
    "yuri": "sexual",
    "yurie mouth": "face",
    "yuubari king melon": "scene",
    "yuzu (fruit)": "scene",
    "z-move trainer pose": "pose",
    "zebra mask": "clothes",
    "zebra print": "clothes",
    "zenra": "sexual",
    "zettai ryouiki": "sexual",
    "zha cai (food)": "scene",
    "zhouzi jin (headwear)": "clothes",
    "zhuang clothes": "clothes",
    "zhuang hat": "clothes",
    "zimbabwe": "scene",
    "zinnia": "scene",
    "zipper": "clothes",
    "zipper legwear": "clothes",
    "zipper pull tab": "clothes",
    "zipping": "pose",
    "zippo lighter": "scene",
    "zombie pose": "pose",
    "zombification": "effects",
    "zongzi": "scene",
    "zoo": "scene",
    "zoom layer": "character",
    "zouni soup": "scene",
    "zouri": "clothes",
    "zui zui dance": "pose",
    "zweigen kanazawa": "pose"
  };
  var TAG_CATEGORY_RULES = [
    { id: "sexual", keywords: ["ahegao", "anal", "anus", "aroused", "ass", "asshole", "bdsm", "bestiality", "blowjob", "blowjobs", "bondage", "boobs", "bottomless", "breast", "breasts", "bukkake", "buttplug", "cleavage", "clit", "clitoris", "cock", "cowgirl", "creampie", "cum", "cumming", "cumshot", "cunnilingus", "deepthroat", "dick", "dildo", "dildos", "doggystyle", "dominatrix", "downblouse", "ejaculating", "ejaculation", "enema", "erection", "exhibitionism", "exposed", "facial", "fellatio", "femdom", "fetish", "fingering", "fisting", "footjob", "foursome", "frottage", "futa", "futanari", "gangbang", "genitalia", "grope", "groping", "handjob", "hentai", "incest", "inserted", "insertion", "kink", "kinky", "lewd", "lingerie", "masochism", "masturbating", "masturbation", "missionary", "molestation", "naked", "necrophilia", "nipple", "nipples", "nude", "nudity", "onahole", "orgasm", "orgy", "paizuri", "pantyshot", "peeing", "pegging", "penetrate", "penetrated", "penetration", "penis", "phallic", "porn", "pornographic", "pussy", "rape", "raped", "sadism", "scat", "scissoring", "scrotum", "semen", "sex", "sexual", "sexy", "sideboob", "spanking", "spitroast", "tentacle", "tentacles", "testicle", "testicles", "threesome", "tits", "topless", "tribadism", "underboob", "undressed", "undressing", "upskirt", "urination", "vagina", "vaginal", "vibrator", "vibrators", "vore", "voyeurism", "vulva", "whipping", "yaoi", "yuri", "zoophilia"] },
    { id: "limbs", keywords: ["arm", "armband", "armpit", "armpits", "arms", "arms behind back", "beckoning", "bracelet", "clapping", "clasp", "clasped", "clench", "clenched", "elbow", "elbows", "facepalm", "finger", "finger heart", "fingering", "fingerless", "fingernail", "fingernails", "fingers", "fingertip", "fingertips", "fist", "fist bump", "fist pump", "fists", "forearm", "forearms", "gesture", "gestures", "grab", "grabbing", "groping", "hand", "handcuffed", "handcuffs", "handheld", "handjob", "hands", "hands on hips", "hands up", "heart hands", "held", "high five", "hold", "holding", "holding hands", "knuckle", "knuckles", "manicure", "nail polish", "outstretched", "palm", "palms", "peace sign", "pinch", "pinching", "pinky", "point", "pointing", "raised fist", "reach", "reaching", "salute", "shoulder", "shoulders", "shrugging", "shushing", "thumb", "thumbs", "wave", "waving", "wrist", "wristband", "wrists"] },
    { id: "pose", keywords: ["standing", "stand", "sitting", "sit", "seated", "kneeling", "kneel", "crouching", "crouch", "squatting", "squat", "lying", "lying down", "reclining", "reclined", "prone", "supine", "straddling", "straddle", "leaning", "bent over", "bending", "bowing", "arching", "arched", "slouching", "hunched", "stretching", "flexing", "tiptoes", "tiptoe", "yoga", "handstand", "headstand", "cartwheel", "somersault", "backflip", "backbend", "splits", "split", "prostration", "prostrating", "seiza", "wariza", "yokozuwari", "pose", "posing", "posture", "running", "run", "jogging", "walking", "walk", "marching", "striding", "jumping", "jump", "hopping", "hop", "leaping", "bouncing", "crawling", "crawl", "climbing", "climb", "swinging", "sliding", "rolling", "spinning", "twirling", "dancing", "dance", "skipping", "skip", "swimming", "swim", "floating", "flying", "falling", "diving", "tumbling", "flipping", "balancing", "balance", "hanging", "hang", "carrying", "carry", "piggyback", "kicking", "punching", "pushing", "pulling", "curtsy", "genuflect", "lunging", "sprawling", "sprawl", "pirouette"] },
    { id: "clothes", keywords: ["dress", "gown", "shirt", "blouse", "sweater", "sweatshirt", "hoodie", "jacket", "coat", "overcoat", "raincoat", "trench", "vest", "waistcoat", "cardigan", "tunic", "poncho", "cape", "cloak", "robe", "bathrobe", "apron", "overalls", "jumpsuit", "bodysuit", "leotard", "catsuit", "corset", "bustier", "camisole", "chemise", "babydoll", "lingerie", "bra", "panties", "underwear", "boxers", "briefs", "jockstrap", "thong", "garters", "stockings", "socks", "leggings", "tights", "pantyhose", "thighhighs", "kneehighs", "skirt", "miniskirt", "shorts", "pants", "trousers", "jeans", "kilt", "sarong", "tutu", "petticoat", "bloomers", "footwear", "shoes", "boots", "sandals", "slippers", "sneakers", "heels", "loafers", "moccasins", "hat", "hats", "cap", "beanie", "beret", "fedora", "helmet", "crown", "tiara", "headband", "headdress", "headscarf", "turban", "hijab", "veil", "scarf", "necktie", "bowtie", "ascot", "choker", "collar", "necklace", "pendant", "locket", "earrings", "bracelet", "bangle", "brooch", "cufflinks", "ring", "gloves", "mittens", "gauntlets", "wristband", "belt", "suspenders", "harness", "buckle", "buttons", "zipper", "ribbon", "bow", "lace", "frills", "sequins", "jewelry", "eyewear", "glasses", "goggles", "sunglasses", "monocle", "mask", "makeup", "lipstick", "eyeliner", "eyeshadow", "mascara", "blush", "cosmetics", "swimsuit", "swimwear", "bikini", "monokini", "tankini", "wetsuit", "uniform", "costume", "tuxedo", "suit", "kimono", "yukata", "hakama", "hanbok", "qipao", "sari", "clothes"] },
    { id: "face", keywords: ["beard", "blush", "cheek", "cheeks", "chin", "complexion", "crying", "dimple", "dimples", "drool", "ear", "earlobe", "ears", "expression", "eye", "eyebrow", "eyebrows", "eyelash", "eyelashes", "eyelid", "eyelids", "eyes", "face", "faces", "facial", "fang", "fangs", "forehead", "freckle", "freckles", "frown", "glare", "glaring", "goatee", "grin", "gums", "iris", "irises", "jaw", "jaws", "lick", "licking", "lip", "lips", "moustache", "mouth", "mouths", "mustache", "muzzle", "nose", "noses", "nostril", "nostrils", "pout", "pupil", "pupils", "saliva", "scowl", "scream", "screaming", "sideburns", "smile", "smiles", "smirk", "snout", "squint", "tears", "teeth", "tongue", "tooth", "tusk", "tusks", "whisker", "whiskers", "wince", "wink", "winking"] },
    { id: "body", keywords: ["abdomen", "abs", "ahoge", "albino", "anal", "ankle", "anus", "areola", "arm", "armpit", "arms", "ass", "back", "bald", "balding", "bangs", "belly", "braid", "braids", "breast", "breasts", "buttocks", "cheek", "chest", "chin", "cleavage", "clitoris", "collarbone", "crotch", "ear", "ears", "elbow", "eye", "eyebrow", "eyebrows", "eyelash", "eyelashes", "eyelid", "eyes", "face", "facial", "fang", "feather", "feet", "finger", "fingernail", "fingers", "forehead", "freckles", "fur", "groin", "hair", "hairstyle", "hand", "hands", "heel", "hip", "hips", "horn", "horns", "iris", "jaw", "knee", "labia", "leg", "legs", "lip", "lips", "mole", "mouth", "muscle", "nape", "navel", "neck", "nipple", "nose", "nostril", "palm", "pectoral", "penis", "perineum", "ponytail", "pubic", "pupil", "pussy", "scar", "sclera", "scrotum", "shin", "shoulder", "shoulders", "sideboob", "skin", "spine", "stomach", "tail", "tails", "tan", "tattoo", "teeth", "tentacle", "testicle", "thigh", "thighs", "throat", "thumb", "toe", "toenail", "toes", "tongue", "tooth", "torso", "underboob", "vagina", "waist", "wing", "wings", "wrist"] },
    { id: "character", keywords: ["1girl", "1boy", "1other", "2girls", "2boys", "2others", "3girls", "3boys", "3others", "4girls", "4boys", "4others", "5girls", "5boys", "5others", "6girls", "6boys", "6others", "multiple girls", "multiple boys", "multiple others", "solo focus", "solo", "male focus", "female focus", "other focus", "character counter", "gender request", "no humans", "dual persona", "multiple persona", "multiple views", "out of frame", "disembodied hand", "crossover", "look-alike", "too many cats", "multiple dogs", "dakimakura", "zoom layer", "character focus"] },
    { id: "scene", keywords: ["background", "backgrounds", "backdrop", "scenery", "landscape", "cityscape", "horizon", "skyline", "perspective", "composition", "silhouette", "reflection", "shadow", "bokeh", "panorama", "foreground", "city", "town", "village", "countryside", "rural", "urban", "suburb", "street", "road", "highway", "alley", "sidewalk", "path", "trail", "bridge", "tunnel", "railway", "railroad", "harbor", "dock", "pier", "port", "seaside", "beach", "shore", "coast", "bay", "ocean", "sea", "underwater", "river", "lake", "pond", "stream", "waterfall", "swamp", "forest", "jungle", "rainforest", "grassland", "meadow", "field", "farmland", "farm", "garden", "greenhouse", "park", "mountain", "peak", "hill", "cliff", "canyon", "valley", "desert", "glacier", "volcano", "cave", "island", "sky", "sunrise", "sunset", "sunlight", "daylight", "moonlight", "twilight", "dusk", "dawn", "night", "midnight", "morning", "evening", "starry", "galaxy", "nebula", "aurora", "rainbow", "cloud", "cloudy", "weather", "storm", "thunderstorm", "lightning", "rain", "snowy", "snowfall", "blizzard", "fog", "mist", "haze", "wind", "breeze", "eclipse", "meteor", "planet", "moon", "space", "interior", "indoors", "outdoor", "outdoors", "room", "bedroom", "kitchen", "bathroom", "classroom", "hallway", "rooftop", "balcony", "courtyard", "building", "architecture", "house", "cabin", "castle", "palace", "temple", "shrine", "church", "cathedral", "mosque", "pagoda", "tower", "skyscraper", "ruins", "factory", "dam", "cemetery", "window", "gate", "festival", "holiday", "celebration", "fireworks"] },
    { id: "effects", keywords: ["light", "lighting", "backlight", "backlighting", "sidelighting", "underlighting", "overlighting", "spotlight", "lamplight", "candlelight", "moonlight", "sunlight", "starlight", "firelight", "headlight", "floodlight", "glow", "glowing", "glowstick", "luminous", "illumination", "illuminated", "radiance", "radiant", "shimmer", "sparkle", "glint", "gleam", "flare", "bloom", "chiaroscuro", "caustics", "refraction", "reflection", "rays", "sunbeam", "moonbeam", "aurora", "twilight", "dusk", "dawn", "sunset", "sunrise", "night", "dark", "darkness", "shadow", "shadows", "shade", "silhouette", "overexposure", "underexposure", "exposure", "neon", "lantern", "color", "colored", "colorful", "monochrome", "greyscale", "sepia", "pastel", "palette", "hue", "saturation", "saturated", "desaturated", "gradient", "iridescent", "chromatic", "anaglyph", "tint", "vignette", "vignetting", "duotone", "muted", "vibrant", "vivid", "filter", "filters", "filtered", "blur", "bokeh", "focus", "defocus", "lens", "distortion", "aberration", "halftone", "dither", "glitch", "pixelated", "posterize", "grain", "scanline", "vhs", "crt", "watercolor", "lineart", "surreal", "stylized", "aesthetic", "retro", "vaporwave", "synthwave", "cyberpunk", "steampunk", "low poly", "cel shading", "pixel art"] }
  ];

  // src/renderer/tag-categories.ts
  var TAG_CATEGORY_LABELS = {
    character: "Character",
    body: "Body",
    face: "Face",
    clothes: "Clothes",
    limbs: "Limbs and Hands",
    sexual: "Sexual",
    pose: "Pose",
    scene: "Scene",
    effects: "Effects",
    other: "Other"
  };
  function normalize(tag) {
    return String(tag).toLowerCase().replace(/_/g, " ").replace(/\s+/g, " ").trim();
  }
  function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  var RULE_MATCHERS = TAG_CATEGORY_RULES.map((rule) => ({
    id: rule.id,
    res: rule.keywords.map((k) => new RegExp(`(?:^|[^a-z0-9])${escapeRegex(k)}(?:$|[^a-z0-9])`))
  }));
  function categorizeTag(tag) {
    const t = normalize(tag);
    if (!t) return "other";
    const seeded = TAG_CATEGORY_SEEDS[t];
    if (seeded) return seeded;
    for (const rule of RULE_MATCHERS) {
      if (rule.res.some((re) => re.test(t))) return rule.id;
    }
    return "other";
  }
  function groupTagsByCategory(tags) {
    const buckets = /* @__PURE__ */ new Map();
    for (const tag of tags) {
      const id = categorizeTag(tag);
      const list = buckets.get(id);
      if (list) list.push(tag);
      else buckets.set(id, [tag]);
    }
    const groups2 = [];
    for (const id of TAG_CATEGORY_ORDER) {
      const list = buckets.get(id);
      if (list && list.length) groups2.push({ id, label: TAG_CATEGORY_LABELS[id], tags: list });
    }
    return groups2;
  }

  // src/renderer/view.ts
  var viewMode2 = "grid";
  var stickyCompareImages = [];
  var TAG_SORTING_KEY = "dts-tag-sorting";
  var tagSortingActive = getBool(TAG_SORTING_KEY);
  var subjectSelectedTags = /* @__PURE__ */ new Set();
  var subjectSelectionBase = null;
  var singleIndex = 0;
  var ctxMenuEl = null;
  var commonLanguages = ["English"];
  var autoSelectNewLanguage = true;
  var getEntries7 = () => [];
  var getEntryByBase4 = () => void 0;
  var getDirHandleRef = () => null;
  var addEntryFromNewFileRef = async () => null;
  var getMasterTagModeActive = () => false;
  var getCardTagSortMode = () => "default";
  var getGalleryFilter2 = () => ({ base: "all", terms: [], mode: "OR", excludes: "", disabledView: false, originalsView: false, exactMatch: false });
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
  var VIEW_TRANSITION_ORDER = ["grid", "compact", "single", "disabled", "originals"];
  function viewContainerFor(mode) {
    if (mode === "compact") return compactGrid;
    if (mode === "single") return singleViewEl;
    return galleryGrid;
  }
  function switchView(mode, opts) {
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
      viewOriginalsBtn.classList.toggle("active", mode === "originals");
      getGalleryFilter2().disabledView = mode === "disabled";
      getGalleryFilter2().originalsView = mode === "originals";
      galleryGrid.style.display = mode === "grid" || mode === "disabled" || mode === "originals" ? "" : "none";
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
    if (html.classList.contains("motion-off") || prevMode === mode || oldEl === newEl || opts && opts.instant) {
      applyState();
      return;
    }
    const swipe = html.classList.contains("motion-swipe");
    const movingForward = VIEW_TRANSITION_ORDER.indexOf(mode) > VIEW_TRANSITION_ORDER.indexOf(prevMode);
    if (mapPan(movingForward ? 1 : -1, "view", oldEl, () => viewContainerFor(mode), applyState)) return;
    const outClass = swipe ? movingForward ? "view-swipe-out-left" : "view-swipe-out-right" : "view-fade-out";
    const inClass = swipe ? movingForward ? "view-swipe-in-right" : "view-swipe-in-left" : "view-fade-out";
    oldEl.classList.add(outClass);
    setTimeout(() => {
      oldEl.classList.remove(outClass);
      applyState();
      const shownEl = viewContainerFor(mode);
      shownEl.classList.add(inClass);
      requestAnimationFrame(() => requestAnimationFrame(() => shownEl.classList.remove(inClass)));
    }, transitionMsOf(oldEl));
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
      setIconLabel(rm, "\u2715");
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
      setIconLabel(lockBadge, "\u{1F512}");
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
      setIconLabel(noteBadge, "\u{1F4DD}");
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
    addContextMenuItem(menu, `Remove "${tag}" from this image`, () => {
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
    const sections = document.createElement("div");
    sections.className = "seq-sections";
    panel.appendChild(sections);
    function newSection(title) {
      const el = document.createElement("div");
      el.className = "seq-section";
      el.appendChild(sectionLabel(title));
      sections.appendChild(el);
      return el;
    }
    let sec;
    sec = newSection("Text");
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
    sec.appendChild(togglePair(hasTextRow, soundRow));
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
    sec.appendChild(textSub);
    sec = newSection("Censorship");
    const censorWrap = document.createElement("div");
    sec.appendChild(censorWrap);
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
    sec.appendChild(typeBox);
    sec = newSection("Perspective");
    const perspBox = checkGrid();
    for (const p of perspectiveOptionTags()) {
      const label = p === "close-up" ? "Close-up" : cap(p.replace(/^from /, ""));
      perspBox.appendChild(toggleRow(label, d.perspectives.has(p), (v) => {
        if (v) d.perspectives.add(p);
        else d.perspectives.delete(p);
      }));
    }
    sec.appendChild(perspBox);
    sec = newSection("Indicator");
    const monoRowOuter = toggleRow("Monochrome", d.monochrome, (v) => {
      d.monochrome = v;
    });
    const comicRow = toggleRow("Comic", d.isComic, (v) => {
      d.isComic = v;
    });
    sec.appendChild(togglePair(monoRowOuter, comicRow));
    sec.appendChild(toggleRow("Multiple views", d.multipleViews, (v) => {
      d.multipleViews = v;
    }));
    sec.appendChild(radioRow("seq-koma", [
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
  function recordZoom(pct) {
    if (pct > (folderStats.zoom_max || 0)) {
      folderStats.zoom_max = pct;
      saveFolderStats();
      checkAchievements();
    }
  }
  function buildSinglePreview(e) {
    const box = document.createElement("div");
    box.className = "single-preview";
    box.title = "Click to view full size";
    const img = document.createElement("img");
    img.src = e.objectUrl;
    img.draggable = false;
    box.appendChild(img);
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
    box.appendChild(menuBtn);
    const statusIconsEl = buildStatusIconsEl(e);
    statusIconsEl.style.left = "10px";
    statusIconsEl.style.top = "38px";
    box.appendChild(statusIconsEl);
    const mvBadges = buildMergeVoidBadgesEl(e);
    if (mvBadges) {
      mvBadges.style.position = "absolute";
      mvBadges.style.left = "10px";
      mvBadges.style.bottom = "10px";
      box.appendChild(mvBadges);
    }
    const hint = document.createElement("div");
    hint.className = "single-preview-hint";
    hint.textContent = "Click to view full size";
    box.appendChild(hint);
    box.addEventListener("click", () => showImageLightbox(e.objectUrl, recordZoom));
    return box;
  }
  function renderSinglePos(total) {
    singlePos.innerHTML = "";
    if (!total) {
      singlePos.textContent = "0 / 0";
      return;
    }
    const inp = document.createElement("input");
    inp.type = "text";
    inp.className = "single-pos-input";
    inp.value = String(singleIndex + 1);
    inp.title = "Type an image number and press Enter to jump";
    inp.setAttribute("inputmode", "numeric");
    inp.setAttribute("aria-label", "Image number");
    const commit = () => {
      const n = parseInt(inp.value, 10);
      if (!isFinite(n)) {
        inp.value = String(singleIndex + 1);
        return;
      }
      const target = Math.min(total, Math.max(1, n)) - 1;
      if (target !== singleIndex) {
        singleIndex = target;
        renderSingleView();
      } else inp.value = String(singleIndex + 1);
    };
    inp.addEventListener("keydown", (ev) => {
      ev.stopPropagation();
      if (ev.key === "Enter") {
        ev.preventDefault();
        commit();
        inp.blur();
      } else if (ev.key === "Escape") {
        inp.value = String(singleIndex + 1);
        inp.blur();
      }
    });
    inp.addEventListener("blur", commit);
    const tot = document.createElement("span");
    tot.className = "single-pos-total";
    tot.textContent = "/ " + total;
    singlePos.appendChild(inp);
    singlePos.appendChild(tot);
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
        const seqPreview = buildSinglePreview(entry);
        seqPreview.style.flex = "none";
        seqPreview.style.maxWidth = "100%";
        const imgCol = document.createElement("div");
        imgCol.style.cssText = "flex:0 0 38%; max-width:38%; min-width:0; display:flex; flex-direction:column; gap:8px;";
        imgCol.appendChild(seqPreview);
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
    renderSinglePos(list.length);
    singlePrevBtn.disabled = list.length === 0 || singleIndex <= 0;
    singleNextBtn.disabled = list.length === 0 || singleIndex >= list.length - 1;
    const restoreScroll = list[singleIndex]?.base === lastSingleBase ? capturePanelScroll(singleViewEl) : null;
    singleViewEl.innerHTML = "";
    if (list.length === 0) {
      const empty = document.createElement("div");
      empty.className = "single-empty";
      empty.textContent = "No images match the current filter.";
      singleViewEl.appendChild(empty);
      return;
    }
    const e = list[singleIndex];
    lastSingleBase = e.base;
    const wrap = document.createElement("div");
    wrap.className = "single-wrap";
    wrap.appendChild(buildSinglePreview(e));
    const panel = document.createElement("div");
    panel.className = "single-panel single-panel-main";
    const nameEl = document.createElement("div");
    nameEl.className = "single-name";
    nameEl.textContent = e.imgName + (e.width ? ` \xB7 ${e.width}\xD7${e.height}` : "") + ` \xB7 ${e.tags.length} tags`;
    panel.appendChild(nameEl);
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
    const singleChipOnChange = () => {
      renderSingleView();
      refreshRightPanels();
      refreshStats();
    };
    panel.appendChild(buildTagSortBar(e, singleChipOnChange));
    panel.appendChild(buildChipsBlock(e, singleTagIndex, singleChipOnChange));
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
    if (!e.original) {
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
    }
    panel.appendChild(btnRow);
    wrap.appendChild(panel);
    singleViewEl.appendChild(wrap);
    if (restoreScroll) restoreScroll();
  }
  function capturePanelScroll(host) {
    const panelTop = host.querySelector(".single-panel")?.scrollTop ?? 0;
    const ancestors = [];
    for (let el = host.parentElement; el; el = el.parentElement) {
      if (el.scrollTop) ancestors.push([el, el.scrollTop]);
    }
    return () => {
      const panel = host.querySelector(".single-panel");
      if (panel) panel.scrollTop = panelTop;
      for (const [el, top] of ancestors) el.scrollTop = top;
    };
  }
  function computeIsolatedTagSet(tagIndex) {
    const set = /* @__PURE__ */ new Set();
    for (const [tag, imgs] of tagIndex) {
      if (imgs.size <= 2) set.add(tag);
    }
    return set;
  }
  function buildTagSortBar(entry, onChange) {
    const bar = document.createElement("div");
    bar.className = "tagcat-bar";
    bar.appendChild(buildTagSortToggle(onChange));
    if (tagSortingActive) bar.appendChild(buildAddSubjectButton(entry, onChange));
    return bar;
  }
  function buildTagSortToggle(onToggle) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tagcat-toggle" + (tagSortingActive ? " active" : "");
    setIconLabel(btn, tagSortingActive ? "\u{1F3F7} Tag sorting: on" : "\u{1F3F7} Tag sorting");
    btn.title = tagSortingActive ? "Stop grouping tags by category" : "Group tags by prompt-field category (Character, Body, Face, Clothes, Limbs and Hands, Sexual, Pose, Scene, Effects, Other)";
    btn.addEventListener("click", () => {
      tagSortingActive = !tagSortingActive;
      setBool(TAG_SORTING_KEY, tagSortingActive);
      onToggle();
    });
    return btn;
  }
  function buildChipsBlock(entry, tagIndex, onChange) {
    const ordered = orderedTagsForDisplay(entry, tagIndex);
    if (!tagSortingActive) {
      const chiprow = document.createElement("div");
      chiprow.className = "chiprow";
      for (const tag of ordered) chiprow.appendChild(buildChip2(entry, tag, onChange, tagIndex));
      return chiprow;
    }
    const subjects = entry.meta?.tagSubjects || [];
    if (subjects.length) return buildSubjectTree(entry, ordered, tagIndex, onChange);
    const wrap = document.createElement("div");
    wrap.className = "tagcat-groups";
    for (const group of groupTagsByCategory(ordered)) {
      const seg = document.createElement("div");
      seg.className = "tagcat-seg";
      const head = document.createElement("div");
      head.className = "tagcat-head";
      const name = document.createElement("span");
      name.className = "tagcat-name";
      name.textContent = group.label;
      const count = document.createElement("span");
      count.className = "tagcat-count";
      count.textContent = String(group.tags.length);
      head.appendChild(name);
      head.appendChild(count);
      seg.appendChild(head);
      const chiprow = document.createElement("div");
      chiprow.className = "chiprow";
      for (const tag of group.tags) chiprow.appendChild(buildChip2(entry, tag, onChange, tagIndex));
      seg.appendChild(chiprow);
      wrap.appendChild(seg);
    }
    return wrap;
  }
  function ensureEntryMeta(entry) {
    if (!entry.meta) entry.meta = {};
    return entry.meta;
  }
  function persistEntryMeta(entry) {
    getEntryMeta2()[entry.base] = ensureEntryMeta(entry);
    saveEntryMetaRef2();
  }
  var subjectIdCounter = 1;
  function nextSubjectId() {
    return "subj-" + Date.now().toString(36) + "-" + (subjectIdCounter++).toString(36);
  }
  function buildAddSubjectButton(entry, onChange) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tagsub-addsubject";
    btn.textContent = "\uFF0B Add subject";
    btn.title = "Split this image's tags into named subjects (e.g. Girl 1, Girl 2)";
    btn.addEventListener("click", () => {
      const meta = ensureEntryMeta(entry);
      const subjects = meta.tagSubjects || (meta.tagSubjects = []);
      subjects.push({ id: nextSubjectId(), name: `Subject ${subjects.length + 1}`, subheaders: [] });
      persistEntryMeta(entry);
      onChange();
    });
    return btn;
  }
  function assignTagsToSubject(entry, tags, subjectId) {
    const meta = ensureEntryMeta(entry);
    const assign = meta.tagAssign || (meta.tagAssign = {});
    for (const t of tags) assign[t] = subjectId;
    persistEntryMeta(entry);
  }
  function buildSubjectTree(entry, ordered, tagIndex, onChange) {
    const meta = ensureEntryMeta(entry);
    const subjects = meta.tagSubjects;
    const assign = meta.tagAssign || (meta.tagAssign = {});
    if (subjectSelectionBase !== entry.base) {
      subjectSelectionBase = entry.base;
      subjectSelectedTags = /* @__PURE__ */ new Set();
    }
    const validIds = new Set(subjects.map((s) => s.id));
    const defaultId = subjects[0].id;
    const bySubject = /* @__PURE__ */ new Map();
    for (const tag of ordered) {
      const sid = assign[tag] && validIds.has(assign[tag]) ? assign[tag] : defaultId;
      let cats = bySubject.get(sid);
      if (!cats) {
        cats = /* @__PURE__ */ new Map();
        bySubject.set(sid, cats);
      }
      const cat = categorizeTag(tag);
      const list = cats.get(cat);
      if (list) list.push(tag);
      else cats.set(cat, [tag]);
    }
    const root = document.createElement("div");
    root.className = "tagsub-tree";
    if (subjectSelectedTags.size) root.appendChild(buildMoveToolbar(entry, subjects, onChange));
    for (const subject of subjects) {
      root.appendChild(buildSubjectBlock(entry, subject, bySubject.get(subject.id), tagIndex, onChange));
    }
    return root;
  }
  function buildMoveToolbar(entry, subjects, onChange) {
    const bar = document.createElement("div");
    bar.className = "tagsub-movetoolbar";
    const count = document.createElement("span");
    count.className = "tagsub-movecount";
    count.textContent = `${subjectSelectedTags.size} selected`;
    bar.appendChild(count);
    const flyout = document.createElement("div");
    flyout.className = "tagsub-moveflyout";
    flyout.style.display = "none";
    for (const s of subjects) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = s.name || "(unnamed)";
      b.addEventListener("click", () => {
        const tags = Array.from(subjectSelectedTags);
        subjectSelectedTags = /* @__PURE__ */ new Set();
        assignTagsToSubject(entry, tags, s.id);
        onChange();
      });
      flyout.appendChild(b);
    }
    const moveBtn = document.createElement("button");
    moveBtn.type = "button";
    moveBtn.className = "tagsub-movebtn";
    setIconLabel(moveBtn, "Move tags to: \u25BE");
    moveBtn.addEventListener("click", () => {
      flyout.style.display = flyout.style.display === "none" ? "flex" : "none";
    });
    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "tagsub-moveclear";
    clearBtn.textContent = "Clear";
    clearBtn.addEventListener("click", () => {
      subjectSelectedTags = /* @__PURE__ */ new Set();
      onChange();
    });
    bar.appendChild(moveBtn);
    bar.appendChild(flyout);
    bar.appendChild(clearBtn);
    return bar;
  }
  function buildSubjectBlock(entry, subject, cats, tagIndex, onChange) {
    const block = document.createElement("div");
    block.className = "tagsub-subject";
    const dropHere = (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      block.classList.remove("drop-hover");
      const payload = ev.dataTransfer?.getData("text/plain") || "";
      const tags = payload.split("\n").filter(Boolean);
      if (!tags.length) return;
      subjectSelectedTags = /* @__PURE__ */ new Set();
      assignTagsToSubject(entry, tags, subject.id);
      onChange();
    };
    block.addEventListener("dragover", (ev) => {
      ev.preventDefault();
      block.classList.add("drop-hover");
    });
    block.addEventListener("dragleave", () => block.classList.remove("drop-hover"));
    block.addEventListener("drop", dropHere);
    const head = document.createElement("div");
    head.className = "tagsub-subject-head";
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "tagsub-name";
    nameInput.value = subject.name;
    nameInput.title = "Name this subject (e.g. Girl 1)";
    nameInput.setAttribute("aria-label", "Subject name");
    nameInput.addEventListener("keydown", (ev) => ev.stopPropagation());
    nameInput.addEventListener("input", () => {
      subject.name = nameInput.value;
    });
    nameInput.addEventListener("change", () => persistEntryMeta(entry));
    nameInput.addEventListener("blur", () => persistEntryMeta(entry));
    head.appendChild(nameInput);
    const actions = document.createElement("div");
    actions.className = "tagsub-head-actions";
    const addSub = document.createElement("button");
    addSub.type = "button";
    addSub.textContent = "\uFF0B Subheader";
    addSub.title = "Add a category subheader under this subject";
    addSub.addEventListener("click", (ev) => {
      ev.stopPropagation();
      openSubheaderPicker(entry, subject, ev.clientX, ev.clientY, onChange);
    });
    actions.appendChild(addSub);
    const del = document.createElement("button");
    del.type = "button";
    del.className = "tagsub-del";
    setIconLabel(del, "\u2715");
    del.title = "Remove this subject (its tags fall back to the first subject)";
    del.addEventListener("click", () => removeSubject(entry, subject.id, onChange));
    actions.appendChild(del);
    head.appendChild(actions);
    block.appendChild(head);
    const present = cats || /* @__PURE__ */ new Map();
    const catIds = /* @__PURE__ */ new Set([...present.keys(), ...subject.subheaders]);
    const orderedCats = TAG_CATEGORY_ORDER.filter((c) => catIds.has(c));
    if (!orderedCats.length) {
      const empty = document.createElement("div");
      empty.className = "tagsub-empty";
      empty.textContent = "No tags here yet \u2014 drag chips onto this subject, or add a subheader.";
      block.appendChild(empty);
      return block;
    }
    for (const cat of orderedCats) {
      const sub = document.createElement("div");
      sub.className = "tagsub-sub";
      sub.addEventListener("dragover", (ev) => {
        ev.preventDefault();
      });
      sub.addEventListener("drop", dropHere);
      const subHead = document.createElement("div");
      subHead.className = "tagsub-sub-head";
      const catName = document.createElement("span");
      catName.className = "tagsub-cat";
      catName.textContent = TAG_CATEGORY_LABELS[cat] || cat;
      const countEl = document.createElement("span");
      countEl.className = "tagsub-count";
      const tags = present.get(cat) || [];
      countEl.textContent = String(tags.length);
      subHead.appendChild(catName);
      subHead.appendChild(countEl);
      sub.appendChild(subHead);
      const chiprow = document.createElement("div");
      chiprow.className = "chiprow";
      if (!tags.length) {
        const none = document.createElement("span");
        none.className = "tagsub-empty";
        none.textContent = "\u2014";
        chiprow.appendChild(none);
      }
      for (const tag of tags) {
        const chip = buildChip2(entry, tag, onChange, tagIndex);
        chip.classList.add("tagsub-chip");
        if (subjectSelectedTags.has(tag)) chip.classList.add("tagsub-selected");
        chip.draggable = true;
        chip.addEventListener("dragstart", (ev) => {
          const payload = subjectSelectedTags.has(tag) ? Array.from(subjectSelectedTags).join("\n") : tag;
          ev.dataTransfer?.setData("text/plain", payload);
          if (ev.dataTransfer) ev.dataTransfer.effectAllowed = "move";
        });
        chip.addEventListener("click", (ev) => {
          if (!ev.shiftKey) return;
          ev.preventDefault();
          ev.stopPropagation();
          if (subjectSelectedTags.has(tag)) subjectSelectedTags.delete(tag);
          else subjectSelectedTags.add(tag);
          onChange();
        }, true);
        chiprow.appendChild(chip);
      }
      sub.appendChild(chiprow);
      block.appendChild(sub);
    }
    return block;
  }
  function openSubheaderPicker(entry, subject, x, y, onChange) {
    document.querySelectorAll(".tagsub-picker").forEach((el) => el.remove());
    const menu = document.createElement("div");
    menu.className = "ctx-menu tagsub-picker";
    const header = document.createElement("div");
    header.className = "ctx-header";
    header.textContent = "Add subheader";
    menu.appendChild(header);
    let any = false;
    for (const cat of TAG_CATEGORY_ORDER) {
      if (subject.subheaders.includes(cat)) continue;
      any = true;
      addContextMenuItem(menu, TAG_CATEGORY_LABELS[cat] || cat, () => {
        subject.subheaders.push(cat);
        persistEntryMeta(entry);
        menu.remove();
        onChange();
      });
    }
    if (!any) {
      const none = document.createElement("div");
      none.className = "ctx-item";
      none.textContent = "All categories added";
      menu.appendChild(none);
    }
    document.body.appendChild(menu);
    positionMenu(menu, x, y);
    const onOutside = (ev) => {
      if (!menu.contains(ev.target)) {
        menu.remove();
        document.removeEventListener("click", onOutside, true);
      }
    };
    setTimeout(() => document.addEventListener("click", onOutside, true), 0);
  }
  function removeSubject(entry, subjectId, onChange) {
    const meta = ensureEntryMeta(entry);
    const subjects = meta.tagSubjects || [];
    const idx = subjects.findIndex((s) => s.id === subjectId);
    if (idx === -1) return;
    subjects.splice(idx, 1);
    if (meta.tagAssign) {
      for (const [tag, sid] of Object.entries(meta.tagAssign)) if (sid === subjectId) delete meta.tagAssign[tag];
    }
    if (!subjects.length) {
      meta.tagAssign = {};
      subjectSelectedTags = /* @__PURE__ */ new Set();
    }
    persistEntryMeta(entry);
    onChange();
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
  function modalSourceEl(base) {
    if (!base) return null;
    const sel = `.card[data-base="${CSS.escape(base)}"] .thumbwrap, .compact-card[data-base="${CSS.escape(base)}"]`;
    const el = document.querySelector(sel);
    if (el && el.offsetParent) {
      const r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight && r.width > 0) return el;
    }
    return null;
  }
  function aimModalAt(base) {
    const card = modalCardInner;
    const src = modalSourceEl(base);
    if (!src || !document.documentElement.classList.contains("motion-swipe")) {
      card.style.removeProperty("--from-x");
      card.style.removeProperty("--from-y");
      card.style.removeProperty("--from-s");
      return;
    }
    const prevTransition = card.style.transition;
    card.style.transition = "none";
    card.style.transform = "none";
    const rest = card.getBoundingClientRect();
    card.style.transform = "";
    const s = src.getBoundingClientRect();
    card.style.setProperty("--from-x", `${s.left + s.width / 2 - (rest.left + rest.width / 2)}px`);
    card.style.setProperty("--from-y", `${s.top + s.height / 2 - (rest.top + rest.height / 2)}px`);
    card.style.setProperty("--from-s", String(Math.max(0.08, Math.min(1, s.width / rest.width))));
    void card.offsetWidth;
    card.style.transition = prevTransition;
  }
  function pageModalTo(entry, dir) {
    if (!mapPan(dir, "page", modalCardInner, () => modalCardInner, () => openImageCardModal(entry))) openImageCardModal(entry);
  }
  function openImageCardModal(entry, opts) {
    const isHoverPreview = !!(opts && opts.hover);
    const wasShowing = imageCardModal.classList.contains("modal-visible");
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
    if (!wasShowing) aimModalAt(entry.base);
    imageCardModal.classList.add("modal-anim-layers");
    if (modalLayerTimer) clearTimeout(modalLayerTimer);
    modalLayerTimer = setTimeout(() => {
      modalLayerTimer = null;
      imageCardModal.classList.remove("modal-anim-layers");
    }, transitionMsOf(modalCardInner) + 60);
    requestAnimationFrame(() => requestAnimationFrame(() => imageCardModal.classList.add("modal-visible")));
    if (!isHoverPreview) {
      folderStats.card_modal_opens = (folderStats.card_modal_opens || 0) + 1;
      saveFolderStats();
      checkAchievements();
    }
  }
  function closeImageCardModal() {
    if (modalCloseTimer) clearTimeout(modalCloseTimer);
    aimModalAt(currentModalBase);
    imageCardModal.classList.remove("modal-visible");
    modalCloseTimer = setTimeout(() => {
      imageCardModal.style.display = "none";
      modalCardInner.innerHTML = "";
      currentModalBase = null;
      modalCloseTimer = null;
    }, Math.max(180, transitionMsOf(modalCardInner)));
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
      toastError("Could not read the image", err);
      return false;
    }
    const prevW = entry.width || 0, prevH = entry.height || 0;
    const bytes = new Uint8Array(await blob.arrayBuffer());
    try {
      await writeBytes(entry.imgHandle, bytes);
    } catch (err) {
      toastError("Could not save the edited image", err);
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
      toastError("Could not read the image", err);
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
        toastError("Could not read the image", err);
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
        await writeBytes(imgHandle, bytes);
        const txtHandle = await dir.getFileHandle(`${base}.txt`, { create: true });
        await writeBytes(txtHandle, tags.map((t) => t.replace(/ /g, "_")).join(","));
        const created = await addEntryFromNewFileRef(base, imgHandle, imgName, txtHandle, true, tags, false);
        if (created) markDirty(created);
      } catch (err) {
        toastError("Could not save the isolated image", err);
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
  var lastModalBase = null;
  function renderImageCardModal(entry) {
    const restoreScroll = entry.base === lastModalBase && modalCardInner.childElementCount ? capturePanelScroll(modalCardInner) : null;
    lastModalBase = entry.base;
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
    setIconLabel(closeBtn, "\u2715 Close");
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
      setIconLabel(prevBtn, "\u2039 Prev");
      prevBtn.disabled = modalNavIdx <= 0;
      prevBtn.addEventListener("click", () => pageModalTo(modalNavList[modalNavIdx - 1], -1));
      const posEl = document.createElement("span");
      posEl.className = "single-pos";
      posEl.textContent = `${modalNavIdx + 1} / ${modalNavList.length}`;
      const nextBtn = document.createElement("button");
      setIconLabel(nextBtn, "Next \u203A");
      nextBtn.disabled = modalNavIdx >= modalNavList.length - 1;
      nextBtn.addEventListener("click", () => pageModalTo(modalNavList[modalNavIdx + 1], 1));
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
      setIconLabel(rotLeftBtn, "\u27F2 Rotate");
      rotLeftBtn.title = "Rotate 90\xB0 counter-clockwise (rewrites the file)";
      rotLeftBtn.addEventListener("click", () => {
        void rotateEntryImage(entry, -1);
      });
      const rotRightBtn = document.createElement("button");
      setIconLabel(rotRightBtn, "\u27F3 Rotate");
      rotRightBtn.title = "Rotate 90\xB0 clockwise (rewrites the file)";
      rotRightBtn.addEventListener("click", () => {
        void rotateEntryImage(entry, 1);
      });
      const cropBtn = document.createElement("button");
      setIconLabel(cropBtn, "\u2702 Crop");
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
    const modalChipOnChange = () => {
      renderImageCardModal(entry);
      renderCurrentView();
      refreshRightPanels();
      refreshStats();
    };
    panel.appendChild(buildTagSortBar(entry, modalChipOnChange));
    panel.appendChild(buildChipsBlock(entry, modalTagIndex, modalChipOnChange));
    modalCardInner.appendChild(imgSide);
    modalCardInner.appendChild(panel);
    if (restoreScroll) restoreScroll();
  }
  function tokenizeTag(tag) {
    const parts = tag.split(/[\s_\-]+/).map((p) => p.trim()).filter(Boolean);
    const uniq = Array.from(new Set(parts));
    return uniq.length > 1 ? uniq : [];
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
    addContextMenuItem(menu, "Show all images WITH this tag", () => {
      setContainsFilter2(tag);
      closeTagContextMenu();
    });
    addContextMenuItem(menu, "Show all images WITHOUT this tag", () => {
      setExcludesFilter2(tag);
      closeTagContextMenu();
    });
    addContextMenuItem(menu, "\u{1F4D6} Tag Details", () => {
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
      addContextMenuItem(menu, flagged ? "\u{1F6A9} Unflag this tag on this image" : "\u{1F6A9} Flag this tag for review (this image)", () => {
        if (!entry.meta) entry.meta = {};
        if (!entry.meta.flaggedTags) entry.meta.flaggedTags = [];
        if (flagged) entry.meta.flaggedTags = entry.meta.flaggedTags.filter((t) => t !== tag);
        else entry.meta.flaggedTags.push(tag);
        getEntryMeta2()[entry.base] = entry.meta;
        saveEntryMetaRef2();
        closeTagContextMenu();
        renderCurrentView();
        refreshStats();
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
      setIconLabel(b, "\u270B");
      b.title = "Antimmunized \u2014 exempt from BOTH merge and void rules";
      wrap.appendChild(b);
    } else if (meta.mergeImmune) {
      const b = document.createElement("div");
      b.className = "mv-badge";
      setIconLabel(b, "\u{1F6AB}");
      b.title = "Merge Immunized \u2014 merge rules never rewrite this image's tags";
      wrap.appendChild(b);
    } else {
      const b = document.createElement("div");
      b.className = "mv-badge";
      setIconLabel(b, "\u{1F7E2}");
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
      setIconLabel(badge, `${emoji}${glyph}`);
      badge.title = `${label}: ${statusText}` + (matchedTags.length ? `: ${matchedTags.join(", ")}` : "");
      wrap.appendChild(badge);
    }
    return wrap;
  }
  function saveCommonLanguages() {
    setJSON("dts-common-languages", commonLanguages);
  }
  (function loadCommonLanguages() {
    const saved = getJSON("dts-common-languages", null);
    if (Array.isArray(saved) && saved.length) commonLanguages = saved;
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
    addContextMenuItem(menu, "Save note", () => {
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
    }, { className: "primary" });
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
    addContextMenuItem(menu, "\u{1F40D} WD14 Tag", () => {
      closeTagContextMenu();
      tagSingleImageWithWd14(entry);
    }, { title: "Tag this image with WD14 (via ComfyUI)" });
    addContextMenuItem(menu, "\u25B6 Sequential from here", () => {
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
    }, { title: "Enter sequential mode starting at this image (walks the current filter image by image)" });
    if (!entry.original) {
      addContextMenuItem(menu, entry.disabled ? "\u21A9 Restore" : "\u{1F5D1} Disable", async () => {
        await moveEntry(entry, !entry.disabled);
        closeTagContextMenu();
      }, { title: entry.disabled ? "Restore this image to the dataset root" : "Move this image to /Disabled" });
    }
    addContextMenuItem(menu, "\u274C Delete permanently", async () => {
      closeTagContextMenu();
      const ok = await showConfirmModal(
        `Permanently delete "${entry.imgName}" and its tags? This cannot be undone \u2014 the files are removed from disk, not moved to Disabled/.`,
        { okLabel: "Delete permanently", danger: true }
      );
      if (!ok) return;
      await deleteEntryPermanentlyRef(entry);
    }, { title: "Permanently delete this image and its tags from disk \u2014 cannot be undone", className: "ctx-item-danger" });
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
        setIconLabel(rm, "\u2715");
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
    function mergeImmuneLabel() {
      return entry.meta.mergeImmune ? "\u{1F6AB} Un-Merge-Immunize" : "\u{1F6AB} Merge Immunize";
    }
    function antivoidLabel() {
      return entry.meta.antivoid ? "\u{1F7E2} Un-Antivoid" : "\u{1F7E2} Antivoid";
    }
    function antimmunizeLabel() {
      return entry.meta.mergeImmune && entry.meta.antivoid ? "\u270B Un-Antimmunize" : "\u270B Antimmunize";
    }
    const toggleMergeImmuneBtn = addContextMenuItem(menu, mergeImmuneLabel(), () => {
      entry.meta.mergeImmune = !entry.meta.mergeImmune;
      getEntryMeta2()[entry.base] = entry.meta;
      saveEntryMetaRef2();
      setIconLabel(toggleMergeImmuneBtn, mergeImmuneLabel());
      setIconLabel(toggleAntimmunizeBtn, antimmunizeLabel());
      renderCurrentView();
    }, { title: "Merge rules will never rewrite this image's tags" });
    const toggleAntivoidBtn = addContextMenuItem(menu, antivoidLabel(), () => {
      entry.meta.antivoid = !entry.meta.antivoid;
      getEntryMeta2()[entry.base] = entry.meta;
      saveEntryMetaRef2();
      setIconLabel(toggleAntivoidBtn, antivoidLabel());
      setIconLabel(toggleAntimmunizeBtn, antimmunizeLabel());
      renderCurrentView();
    }, { title: "Void rules will never remove tags from this image" });
    const toggleAntimmunizeBtn = addContextMenuItem(menu, antimmunizeLabel(), () => {
      const bothOn = entry.meta.mergeImmune && entry.meta.antivoid;
      entry.meta.mergeImmune = !bothOn;
      entry.meta.antivoid = !bothOn;
      getEntryMeta2()[entry.base] = entry.meta;
      saveEntryMetaRef2();
      setIconLabel(toggleMergeImmuneBtn, mergeImmuneLabel());
      setIconLabel(toggleAntivoidBtn, antivoidLabel());
      setIconLabel(toggleAntimmunizeBtn, antimmunizeLabel());
      renderCurrentView();
    }, { title: "Shortcut for toggling Merge Immunize and Antivoid together" });
    addContextMenuItem(menu, "\u{1F5D1}\uFE0F Remove all tags", async () => {
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
    }, { title: "Remove every tag from this image at once", className: "ctx-item-danger" });
    addContextMenuItem(menu, "\u23EE Reset edits", () => resetImageEdits(entry), { title: "Reset this image to its earliest known tag state" });
    addContextMenuItem(menu, "\u24D8 Status details", () => {
      closeTagContextMenu();
      const rows = getEntryStatusIndicators(entry).map(({ emoji, state, label, matchedTags }) => {
        const stateText = state === null ? "Not indicated" : state ? "Yes" : "No";
        const matched = matchedTags.length ? ` \u2014 ${matchedTags.map(escapeHtml).join(", ")}` : "";
        return `<p>${emoji} <b>${label}:</b> ${stateText}${matched}</p>`;
      }).join("");
      showInfoModal(rows, "Image status");
    });
    function lockLabel() {
      return entry.meta.locked ? "\u{1F513} Unlock" : "\u{1F512} Lock";
    }
    const toggleLockBtn = addContextMenuItem(menu, lockLabel(), () => {
      entry.meta.locked = !entry.meta.locked;
      getEntryMeta2()[entry.base] = entry.meta;
      saveEntryMetaRef2();
      setIconLabel(toggleLockBtn, lockLabel());
      renderCurrentView();
    }, { title: "Skip mass tools (Quick Merge, Master Tags, bulk WD14, etc.) for this image" });
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
    addContextMenuItem(menu, "Save note", () => {
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
    }, { className: "primary" });
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
    getEntries7 = deps.getEntries;
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
      setBool("dts-lang-autoselect", autoSelectNewLanguage);
    });
    (function initLangAutoSelectPref() {
      let on = true;
      on = getBool("dts-lang-autoselect", true);
      autoSelectNewLanguage = on;
      langAutoSelectToggle.checked = on;
    })();
    let hideTags = false;
    hideTags = getBool("dts-hide-tags");
    setIconLabel(btnHideTags, hideTags ? "\u{1F441} Show tags" : "\u{1F648} Hide tags");
    btnHideTags.addEventListener("click", () => {
      hideTags = !hideTags;
      setBool("dts-hide-tags", hideTags);
      setIconLabel(btnHideTags, hideTags ? "\u{1F441} Show tags" : "\u{1F648} Hide tags");
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
      for (const e of getEntries7()) {
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
      const count = getEntries7().length;
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
    viewOriginalsBtn.addEventListener("click", () => switchView("originals"));
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
    function pageSingle(delta, fromKeyboard = false) {
      const html = document.documentElement;
      const step = () => {
        singleIndex += delta;
        renderSingleView();
      };
      if (!fromKeyboard && mapPan(delta, "page", singleViewEl, () => singleViewEl, step)) return;
      if (fromKeyboard || !html.classList.contains("motion-swipe") || html.classList.contains("motion-off")) {
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
      }, transitionMsOf(singleViewEl));
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
          switchView("grid", { instant: true });
          return;
        }
      }
      if (viewMode2 === "single" && !ctxMenuEl) {
        if (ev.key === "ArrowLeft" && !singlePrevBtn.disabled) {
          pageSingle(-1, true);
        }
        if (ev.key === "ArrowRight" && !singleNextBtn.disabled) {
          pageSingle(1, true);
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
    let originalDirHandle = null;
    let entries = [];
    let entryByBase = /* @__PURE__ */ new Map();
    let galleryFilter = { base: "all", terms: [], mode: "OR", excludes: "", disabledView: false, originalsView: false, exactMatch: false };
    let filterModeDropdownCtrl = null;
    let gallerySortMode = "filename";
    let gallerySortDir = "asc";
    let isolatedFlagActive = false;
    let cardTagSortMode = "default";
    let masterTagModeActive = false;
    let entryMeta = {};
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
        toast(`\u{1F512} "${premium.name}" is locked. Unlock it in the Shop (Personalization \u25B8 Shop) for ${premium.price} Edibits.`, 3600);
        themeSelect.value = getString("dts-theme") || "studio";
        themeDropdownCtrl.refreshLabel();
        return;
      }
      applyTheme(chosen);
      updateRefineThemeButton();
    });
    (function initTheme() {
      const saved = getString("dts-theme", "studio");
      themeSelect.value = saved;
      themeDropdownCtrl.refreshLabel();
      if (!window.__dtsPreThemed) {
        applyTheme(saved);
      } else {
        document.documentElement.classList.toggle("theme-refined", refinedThemes.includes(saved));
        if (saved === "custom") {
          let hasCustom = false;
          hasCustom = !!getString("dts-custom-theme");
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
      setJSON("dts-custom-theme", custom);
      document.documentElement.setAttribute("data-theme", "custom");
      themeSelect.value = "custom";
      themeDropdownCtrl.refreshLabel();
      setString("dts-theme", "custom");
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
    const TAB_MAP_ORDER = ["datasets", "gallery", "master", "stats", "synthdat"];
    const onShell = (t) => t === "gallery" || t === "master";
    const tabIsActive = (t) => ({
      datasets: tabDatasetManager,
      gallery: tabGallery,
      master: tabMasterTags,
      stats: tabStats,
      synthdat: tabSynthDat
    })[t]?.classList.contains("active") ?? false;
    const PRELOAD_BAND_PX = 90;
    const tabBarEl = document.getElementById("tabBar");
    const preloadedTabs = /* @__PURE__ */ new Set();
    let preloadQueued = false;
    const whenIdle = (cb) => "requestIdleCallback" in window ? window.requestIdleCallback(cb, { timeout: 120 }) : setTimeout(cb, 0);
    function preloadHeavyTabs() {
      if (preloadQueued) return;
      preloadQueued = true;
      whenIdle(() => {
        if (!tabIsActive("stats") && !preloadedTabs.has("stats")) {
          renderStatsTab();
          preloadedTabs.add("stats");
        }
        whenIdle(() => {
          preloadQueued = false;
          if (!tabIsActive("datasets") && !preloadedTabs.has("datasets")) {
            void renderDatasetManagerTab();
            preloadedTabs.add("datasets");
          }
        });
      });
    }
    document.addEventListener("pointermove", (ev) => {
      if (preloadedTabs.size >= 2) return;
      if (ev.clientY <= tabBarEl.getBoundingClientRect().bottom + PRELOAD_BAND_PX) preloadHeavyTabs();
    }, { passive: true });
    const stalePreload = (ev) => {
      if (ev.target instanceof Element && ev.target.closest("#tabBar")) return;
      preloadedTabs.clear();
    };
    document.addEventListener("pointerdown", stalePreload, true);
    document.addEventListener("keydown", stalePreload, true);
    let swallowTabClickUntil = 0;
    tabBarEl.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0 || ev.pointerType === "touch") return;
      const btn = ev.target.closest(".tab-btn");
      if (!btn) return;
      swallowTabClickUntil = performance.now() + 800;
      btn.click();
    });
    tabBarEl.addEventListener("click", (ev) => {
      if (!ev.isTrusted || performance.now() > swallowTabClickUntil) return;
      if (!ev.target.closest(".tab-btn")) return;
      swallowTabClickUntil = 0;
      ev.stopImmediatePropagation();
      ev.preventDefault();
    }, true);
    function switchTab2(tab, opts) {
      const skipDrawerSync = !!(opts && opts.skipDrawerSync);
      const fadePanes = [datasetManagerTab, statsTab, synthDatTab, normalRightTools, masterTagPanel];
      const renderShell = () => {
        if (onShell(tab)) {
          renderCurrentView();
          renderMasterSelectionSummary();
        }
      };
      let deferShellRender = false;
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
        if (tab === "stats" && !preloadedTabs.has("stats")) renderStatsTab();
        if (tab === "datasets" && !preloadedTabs.has("datasets")) renderDatasetManagerTab();
        preloadedTabs.delete(tab);
        if (!deferShellRender) renderShell();
        repositionRightResizeHandleSoon();
      };
      if (document.documentElement.classList.contains("motion-off")) {
        applyState();
        return;
      }
      const fromTab = tabDatasetManager.classList.contains("active") ? "datasets" : tabMasterTags.classList.contains("active") ? "master" : tabStats.classList.contains("active") ? "stats" : tabSynthDat.classList.contains("active") ? "synthdat" : "gallery";
      const regionOf = (t) => {
        if (onShell(fromTab) && onShell(tab)) return document.getElementById("rightPanelContent");
        if (onShell(t)) return document.getElementById("shell");
        return t === "datasets" ? datasetManagerTab : t === "stats" ? statsTab : synthDatTab;
      };
      const dir = Math.sign(TAB_MAP_ORDER.indexOf(tab) - TAB_MAP_ORDER.indexOf(fromTab));
      deferShellRender = true;
      if (dir && document.documentElement.classList.contains("motion-swipe")) {
        tabDatasetManager.classList.toggle("active", tab === "datasets");
        tabGallery.classList.toggle("active", tab === "gallery");
        tabMasterTags.classList.toggle("active", tab === "master");
        tabStats.classList.toggle("active", tab === "stats");
        tabSynthDat.classList.toggle("active", tab === "synthdat");
      }
      if (mapPan(dir, "tab", regionOf(fromTab), () => regionOf(tab), applyState, () => {
        if (tabIsActive(tab)) renderShell();
      })) return;
      deferShellRender = false;
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
      }, transitionMsOf(fadePanes[0]));
    }
    tabDatasetManager.addEventListener("click", () => switchTab2("datasets"));
    tabGallery.addEventListener("click", () => switchTab2("gallery"));
    let overseerExpandedRightPanel = false;
    tabMasterTags.addEventListener("click", () => {
      if (tabMasterTags.classList.contains("active")) {
        if (overseerExpandedRightPanel && !rightAside.classList.contains("right-panel-collapsed")) {
          applyRightPanelCollapsed(true);
        }
        overseerExpandedRightPanel = false;
        switchTab2("gallery");
        return;
      }
      overseerExpandedRightPanel = rightAside.classList.contains("right-panel-collapsed");
      if (overseerExpandedRightPanel) applyRightPanelCollapsed(false);
      switchTab2("master");
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
      on = getBool("dts-night-mode");
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
    new MutationObserver(updateTopbarScale).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    document.fonts.addEventListener("loadingdone", updateTopbarScale);
    updateTopbarScale();
    let flyoutClosesOnOutsideClick = true;
    flyoutOutsideCloseToggle.addEventListener("change", () => {
      flyoutClosesOnOutsideClick = flyoutOutsideCloseToggle.checked;
      setBool("dts-flyout-outside-close", flyoutClosesOnOutsideClick);
    });
    (function initFlyoutOutsideClosePref() {
      const on = getBool("dts-flyout-outside-close", true);
      flyoutClosesOnOutsideClick = on;
      flyoutOutsideCloseToggle.checked = on;
    })();
    function applyUiAnimationMode(mode) {
      document.documentElement.classList.toggle("motion-off", mode === "off");
      document.documentElement.classList.toggle("motion-swipe", mode === "swipe");
    }
    let uiAnimationMode = "fade";
    try {
      const saved = getString("dts-ui-animation-mode");
      if (saved === "off" || saved === "swipe" || saved === "fade") uiAnimationMode = saved;
      else if (!getBool("dts-ui-animations", true)) uiAnimationMode = "off";
    } catch (e) {
    }
    buildPersistentDropdown(uiAnimationsDropdown, [
      { value: "fade", label: "Fade" },
      { value: "swipe", label: "Swipe" },
      { value: "off", label: "Off" }
    ], () => uiAnimationMode, (val) => {
      uiAnimationMode = val;
      setString("dts-ui-animation-mode", val);
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
      setBool("dts-panels-outside-close", panelsCloseOnOutsideClick);
    });
    (function initPanelsOutsideClosePref() {
      const on = getBool("dts-panels-outside-close", true);
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
      setBool("dts-tagcount-badges", showTagCountBadges);
      renderCurrentView();
    });
    (function initTagCountBadgePref() {
      const on = getBool("dts-tagcount-badges");
      showTagCountBadges = on;
      tagCountBadgeToggle.checked = on;
    })();
    dynamicCardsToggle.addEventListener("change", () => {
      if (document.documentElement.classList.contains("touch-device")) return;
      document.documentElement.classList.toggle("dynamic-cards", dynamicCardsToggle.checked);
      setBool("dts-dynamic-cards", dynamicCardsToggle.checked);
    });
    (function initDynamicCardsPref() {
      if (document.documentElement.classList.contains("touch-device")) {
        dynamicCardsToggle.checked = false;
        document.documentElement.classList.remove("dynamic-cards");
        return;
      }
      const on = getBool("dts-dynamic-cards");
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
      const saved = getJSON(SETTINGS_SECTIONS_KEY, {});
      document.querySelectorAll("#settingsPanel .settings-section").forEach((section) => {
        const id = section.dataset.section;
        const defaultExpanded = id !== "danger";
        const expanded = Object.prototype.hasOwnProperty.call(saved, id) ? !!saved[id] : defaultExpanded;
        section.classList.toggle("expanded", expanded);
        const header = section.querySelector(".settings-section-header");
        header.addEventListener("click", () => {
          const nowExpanded = !section.classList.contains("expanded");
          section.classList.toggle("expanded", nowExpanded);
          const state = getJSON(SETTINGS_SECTIONS_KEY, {});
          state[id] = nowExpanded;
          saveSettingsSectionState(state);
        });
      });
    })();
    async function applyFontZoomFromSlider() {
      const px = fontSizeSlider.value;
      await applyAppZoom(parseInt(px, 10) / 14);
      setString("dts-font-size", px);
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
      const px = getString("dts-font-size", "14");
      fontSizeSlider.value = px;
      fontSizeVal.textContent = px + "px";
      applyAppZoom(parseInt(px, 10) / 14);
    })();
    powerHighlightToggle.addEventListener("change", () => {
      document.documentElement.classList.toggle("power-highlight", powerHighlightToggle.checked);
      setBool("dts-power-highlight", powerHighlightToggle.checked);
    });
    powerFillToggle.addEventListener("change", () => {
      document.documentElement.classList.toggle("power-fill", powerFillToggle.checked);
      setBool("dts-power-fill", powerFillToggle.checked);
    });
    (function initPowerHighlight() {
      const highlightOn = getBool("dts-power-highlight", true);
      const fillOn = getBool("dts-power-fill");
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
      setBool("dts-tag-autocomplete", tagAutocompleteEnabled);
    });
    (function initTagAutocompletePref() {
      const on = getBool("dts-tag-autocomplete");
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
        toastError("Failed to export app state", err, 2600);
      }
    });
    tooltipsToggle.addEventListener("change", () => {
      tooltipsEnabled = tooltipsToggle.checked;
      setBool("dts-tooltips-enabled", tooltipsEnabled);
    });
    (function initTooltipsPref() {
      const on = getBool("dts-tooltips-enabled", true);
      tooltipsEnabled = on;
      tooltipsToggle.checked = on;
    })();
    tooltipDelaySlider.addEventListener("input", () => {
      tooltipDelayMs = parseInt(tooltipDelaySlider.value, 10);
      tooltipDelayVal.textContent = tooltipDelayMs + "ms";
      setInt("dts-tooltip-delay", tooltipDelayMs);
    });
    (function initTooltipDelayPref() {
      let ms = getInt("dts-tooltip-delay", 1e3);
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
        setIconLabel(btnPurgeAllTags, "\u26A0 Click 2 more times to confirm purge");
        setTimeout(() => {
          if (purgeConfirmCount < 3) {
            purgeConfirmCount = 0;
            setIconLabel(btnPurgeAllTags, "\u{1F5D1} Purge ALL tags in this folder\u2026");
          }
        }, 4e3);
        return;
      }
      if (purgeConfirmCount === 2) {
        setIconLabel(btnPurgeAllTags, "\u26A0 Click once more to PERMANENTLY purge everything");
        return;
      }
      purgeConfirmCount = 0;
      setIconLabel(btnPurgeAllTags, "\u{1F5D1} Purge ALL tags in this folder\u2026");
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
      getOriginalDirHandle: () => originalDirHandle,
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
      applyIsolateDirection: (affected, direction) => applyIsolateDirection(affected, direction),
      applyFlaggedReviewDirection: (affected, direction) => applyFlaggedReviewDirection(affected, direction)
    });
    initTagIndex({
      getEntries: () => entries,
      getGalleryFilter: () => galleryFilter,
      getGallerySortMode: () => gallerySortMode,
      getGallerySortDir: () => gallerySortDir,
      resetSingleIndex: () => resetSingleIndex3(),
      renderCurrentView: () => renderCurrentView(),
      refreshFilterModeUI: () => filterModeDropdownCtrl?.refreshLabel(),
      isFilterModeLocked: () => filterModeLock.checked,
      markTagReviewed: (tag) => markTagReviewed(tag)
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
      disableEntries: (entriesList) => disableEntriesForSelection(entriesList),
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
      applyFlaggedReviewDirection: (affected, direction) => applyFlaggedReviewDirection(affected, direction),
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
    initBucketImages({
      getDirHandle: () => dirHandle,
      getEntries: () => entries,
      reload: () => loadFolder(),
      saveAllDirty: (silent) => saveAllDirty(silent)
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
      getHideTags: () => getBool("dts-hide-tags")
    });
    function baseName(name) {
      const i = name.lastIndexOf(".");
      return i === -1 ? name : name.slice(0, i);
    }
    btnOpen.addEventListener("click", async () => {
      if (!hasDirectoryPicker()) {
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
        dropHint.style.display = "flex";
        dropHintWrap.style.display = "block";
        galleryToolbar.style.display = "none";
        return;
      }
      maybePromptAddDataset(picked);
    });
    async function scanDirInto(handle, disabled, original = false) {
      const imageHandles = /* @__PURE__ */ new Map();
      const txtHandles = /* @__PURE__ */ new Map();
      for await (const h of handle.values()) {
        if (h.kind !== "file") continue;
        const name = h.name;
        if (isImageFile(name)) {
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
        await buildEntry(base, img.handle, img.name, txtHandle, txtExisted, tags, disabled, original);
      }
    }
    async function buildEntry(base, imgHandle, imgName, txtHandle, txtExisted, tags, disabled, original = false) {
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
        original,
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
      if (!(original && entryByBase.has(base))) entryByBase.set(base, entry);
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
      const sourceDir = entry.original ? originalDirHandle : entry.disabled ? disabledDirHandle : dirHandle;
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
    function markTagReviewed(tag) {
      const affected = [];
      for (const e of entries) {
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
      recordChange("unflag-review", `Marked "${tag}" reviewed \u2014 unflagged from ${affected.length} image(s).`, affected);
      return affected.length;
    }
    function applyFlaggedReviewDirection(affected, direction) {
      let count = 0;
      for (const a of affected) {
        const e = entryByBase.get(a.base);
        const target = direction === "undo" ? a.prevFlagged : a.newFlagged;
        if (!e || !target) continue;
        if (!e.meta) e.meta = {};
        e.meta.flaggedTags = target.slice();
        entryMeta[e.base] = e.meta;
        count++;
      }
      if (count) saveEntryMeta();
      return count;
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
            await writeBytes(imgHandle, st.bytes);
            const txtHandle = await dirHandle.getFileHandle(a.base + ".txt", { create: true });
            await writeBytes(txtHandle, st.tags.map((t) => t.replace(/ /g, "_")).join(","));
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
    async function disableEntriesForSelection(entriesList) {
      if (!dirHandle) return 0;
      let moved = 0;
      const affected = [];
      for (const entry of entriesList) {
        if (entry.meta && entry.meta.locked) continue;
        if (entry.disabled) continue;
        try {
          await moveEntry(entry, true, { silent: true });
          moved++;
          affected.push(entry);
        } catch (err) {
        }
      }
      if (moved === 0) return 0;
      saveEntryMeta();
      pushLogEntry({
        type: "disable",
        summary: `Disabled ${moved} image(s)`,
        affected: affected.map((e) => ({ base: e.base }))
      });
      resetSingleIndex3();
      refreshAllUI();
      checkAchievements();
      return moved;
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
        await writeBytes(handle, JSON.stringify(entryMeta, null, 2));
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
        disabledDirHandle = await dirHandle.getDirectoryHandle("Disabled", { create: false });
        await scanDirInto(disabledDirHandle, true);
      } catch (e) {
        disabledDirHandle = null;
        originalDirHandle = null;
      }
      try {
        originalDirHandle = await dirHandle.getDirectoryHandle("original_images", { create: false });
        await scanDirInto(originalDirHandle, true, true);
      } catch (e) {
        originalDirHandle = null;
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
      galleryFilter = { base: "all", terms: [], mode: filterModeLock.checked ? galleryFilter.mode : "OR", excludes: "", disabledView: false, originalsView: false, exactMatch: filterExactToggle.checked };
      filterInput.value = "";
      excludeBadge.style.display = "none";
      [filterAllBtn, filterUntaggedBtn, filterDirtyBtn].forEach((b) => b.classList.remove("active"));
      filterAllBtn.classList.add("active");
      filterModeDropdownCtrl?.refreshLabel();
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
      dropHint.style.display = "flex";
      dropHintWrap.style.display = "block";
      galleryToolbar.style.display = "none";
      galleryFilter = { base: "all", terms: [], mode: filterModeLock.checked ? galleryFilter.mode : "OR", excludes: "", disabledView: false, originalsView: false, exactMatch: filterExactToggle.checked };
      filterInput.value = "";
      excludeBadge.style.display = "none";
      [filterAllBtn, filterUntaggedBtn, filterDirtyBtn].forEach((b) => b.classList.remove("active"));
      filterAllBtn.classList.add("active");
      filterModeDropdownCtrl?.refreshLabel();
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
    filterModeDropdownCtrl = buildPersistentDropdown(
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
      const savedGalleryColumns = getString(GALLERY_COLUMNS_KEY);
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
        setString(GALLERY_COLUMNS_KEY, val);
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
      setString("dts-panel-layout", val);
      applyRightPanelCollapsedArrow();
      repositionRightResizeHandleSoon();
    }
    (function initPanelLayout() {
      let saved = "standard";
      saved = getString("dts-panel-layout", "standard");
      applyPanelLayout(saved);
    })();
    function applyRightPanelCollapsedArrow() {
      const collapsed = rightAside.classList.contains("right-panel-collapsed");
      const flipped = rightPanelIsFlipped();
      setIconLabel(btnRightPanelCollapse, collapsed ? flipped ? "\u203A" : "\u2039" : flipped ? "\u2039" : "\u203A");
      btnRightPanelCollapse.title = collapsed ? "Show this panel" : "Hide this panel";
    }
    function applyRightPanelCollapsed(collapsed) {
      shellEl.classList.toggle("right-panel-collapsed", collapsed);
      rightAside.classList.toggle("right-panel-collapsed", collapsed);
      applyRightPanelCollapsedArrow();
      repositionRightResizeHandleSoon();
      setBool("dts-right-panel-collapsed", collapsed);
    }
    (function initRightPanelCollapsed() {
      let saved = false;
      saved = getBool("dts-right-panel-collapsed");
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
      saved = getInt(RIGHT_PANEL_WIDTH_KEY, NaN);
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
        setInt(RIGHT_PANEL_WIDTH_KEY, rightPanelWidth);
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
      setIconLabel(gallerySortDirBtn, gallerySortDir === "asc" ? "\u25B2 Asc" : "\u25BC Desc");
      renderCurrentView();
    });
    initTagDetails();
    initRandomFacts();
    initClickFlash();
    initFontRefit();
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
        if (!isImageFile(file.name)) {
          skipped++;
          continue;
        }
        try {
          const imgName = await uniqueDatasetFileName(activeHandle, file.name);
          const imgHandle = await activeHandle.getFileHandle(imgName, { create: true });
          await writeBytes(imgHandle, file);
          try {
            const txtHandle = await activeHandle.getFileHandle(imgName.replace(/\.[^.]+$/, "") + ".txt", { create: true });
            await writeBytes(txtHandle, "");
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
