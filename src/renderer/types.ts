export interface DirHandle {
  name: string;
  kind: 'directory';
  getFileHandle(name: string, options?: { create?: boolean }): Promise<FileHandle>;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<DirHandle>;
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
  values(): AsyncIterable<FileHandle | DirHandle>;
  isSameEntry?(other: DirHandle): Promise<boolean>;
  toJSON?(): SerializedDirHandle;
}

export interface FileHandle {
  name: string;
  kind: 'file';
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
  isSameEntry?(other: FileHandle): Promise<boolean>;
}

export interface SerializedDirHandle {
  name: string;
  [key: string]: unknown;
}

export interface Entry {
  base: string;
  imgHandle: FileHandle;
  txtHandle: FileHandle | null;
  txtExisted: boolean;
  objectUrl: string;
  tags: string[];
  dirty: boolean;
  disabled: boolean;
  meta?: EntryMeta;
  imgName?: string;
  txtName?: string;
  width?: number;
  height?: number;
}

export interface EntryMeta {
  reviewColor?: string;
  flaggedTags?: string[];
  note?: string;
  noteAlwaysVisible?: boolean;
  mergeImmune?: boolean;
  antivoid?: boolean;
  censored?: boolean;
  hasText?: boolean;
  perspective?: string;
  locked?: boolean;
  dateAdded?: number;
  blurred?: boolean;
}

export interface GalleryFilter {
  base: string;
  terms: string[];
  mode: 'AND' | 'OR' | 'XOR' | 'NOT';
  excludes: string;
  disabledView: boolean;
  exactMatch: boolean;
}

export type GallerySortMode = 'filename' | 'tagcount' | 'resolution' | 'dirty' | 'dateadded' | 'newest' | 'oldest' | 'random' | 'modified';
export type GallerySortDir = 'asc' | 'desc';
export type ViewMode = 'grid' | 'compact' | 'single' | 'disabled';
export type CardTagSortMode = 'default' | 'alphabetical' | 'frequency';
export type LeftSortMode = 'family' | 'alpha' | 'count' | 'alphabetical' | 'frequency';
export type LeftSortDir = 'asc' | 'desc';

export interface EditLogAffected {
  base: string;
  prevTags?: string[];
  newTags?: string[];
  // Rename-only (see tags-edit.ts's renameAllEntriesSequentially()): `base`
  // above is always the CURRENT/new base, matching every other affected
  // entry's own convention of "how to look this entry up right now."
  prevBase?: string;
  prevImgName?: string;
  newImgName?: string;
  prevTxtName?: string;
  newTxtName?: string;
  // Pixel-only (crop-image/rotate-image, see tags-edit.ts's recordPixelChange()): the id of the
  // log entry that owns this affected row's before/after bytes. Bytes themselves live in a
  // session-only map keyed by this id — never serialized into _tag_edit_log.json.
  logId?: number;
}

export interface EditLogEntry {
  id: number;
  ts: number;
  type: string;
  summary: string;
  affected: EditLogAffected[];
  mergedTags?: string[];
  unifiedTag?: string;
  voidedTags?: string[];
  revivedTags?: string[];
  restoredTags?: string[];
  canonical?: string;
  [key: string]: unknown;
}

export interface CanonicalRule {
  id: string;
  canonical: string | null;
  children: string[];
  enabled: boolean;
  disabledChildren: string[];
}

export interface FolderStats {
  tags_added?: number;
  tags_removed?: number;
  merges?: number;
  voids?: number;
  renames?: number;
  find_replaces?: number;
  voided_tag_instances?: number;
  undos?: number;
  redos?: number;
  log_exports?: number;
  log_count?: number;
  disables?: number;
  restores?: number;
  review_flags?: number;
  notes_written?: number;
  foreign_languages?: string[];
  tag_details_opened?: number;
  theme_customized?: boolean;
  shop_opened?: boolean;
  themes_purchased?: number;
  free_edibits_claims?: number;
  zoom_max?: number;
  card_modal_opens?: number;
  compact_used?: boolean;
  sort_modes_used?: string[];
  night_mode_used?: boolean;
  isolated_flag_used?: boolean;
  master_ops?: number;
  drag_disabled_used?: boolean;
  saves?: number;
  dataset_tab_adds?: number;
  flag_eye_hater?: boolean;
  flag_hair_raiser?: boolean;
  flag_indecisive?: boolean;
  achievements_unlocked?: number;
  themes_refined?: number;
  dataset_icon_images_set?: number;
  other_folder_achievements_viewed?: number;
  dataset_unloads?: number;
  keyboard_menu_nav_used?: boolean;
  wd14_images_tagged?: number;
  exact_match_used?: boolean;
  filter_suggestions_used?: boolean;
  gallery_columns_forced?: boolean;
  favorited?: number;
  [key: string]: unknown;
}

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  check: (stats: FolderStats) => boolean;
}

export interface DatasetRecord {
  id: number;
  name: string;
  handle: DirHandle | SerializedDirHandle;
  addedAt: number;
  lastOpenedAt: number;
  pinned: boolean;
  iconMode: string;
  iconImageBase: string | null;
  iconImageDataUrl: string | null;
}

export interface FavoriteRecord {
  id: number;
  name: string;
  handle: DirHandle | SerializedDirHandle;
  addedAt: number;
}

export interface Wd14Settings {
  host: string;
  model: string;
  threshold: number;
  characterThreshold: number;
  trailingComma: boolean;
  excludeTags: string;
  replaceUnderscore?: boolean;
}

export interface ComfyResult<T = unknown> {
  ok: boolean;
  error?: string;
  models?: string[];
  values?: string[];
  tagsCsv?: string;
  imageBytes?: Uint8Array;
  pass1ImageBytes?: Uint8Array;
  interrupted?: boolean;
}

export interface SynthDatPromptNode {
  class_type: string;
  inputs: Record<string, unknown>;
  _meta?: Record<string, unknown>;
}

export type SynthDatPrompt = Record<string, SynthDatPromptNode>;

export interface ComfyImageRef {
  filename: string;
  subfolder?: string;
  type?: string;
}

export interface TagPruner {
  id: number;
  tag: string;
  enabled: boolean;
}

export interface PowerTool {
  id: string;
  label: string;
  icon: string;
  action: string;
}

export type ThemeName = string;

export interface Wd14LocalModel {
  name: string;
  hasOnnx: boolean;
  hasCsv: boolean;
  tagCount?: number;
  sizeBytes?: number;
}

export interface Wd14LocalTagResult {
  ok: boolean;
  tagsCsv?: string;
  error?: string;
  provider?: string;
}

export interface Wd14LocalDownloadProgress {
  name: string;
  part: string;
  percent: number;
}

export interface Wd14LocalInterface {
  listModels(): Promise<Wd14LocalModel[]>;
  deleteModel(name: string): Promise<void>;
  downloadModel(opts: { name: string; modelUrl: string; tagsUrl: string }, onProgress?: (ev: Wd14LocalDownloadProgress) => void): Promise<void>;
  tagImage(payload: { name: string; imageBytes: Uint8Array; threshold: number; characterThreshold: number; preferGpu?: boolean }): Promise<Wd14LocalTagResult>;
  pickImportFiles?(): Promise<{ canceled: true } | { canceled?: false; name: string; modelPath: string; tagsPath: string }>;
  importModel?(payload: { name: string; modelPath: string; tagsPath: string }): Promise<void>;
}
