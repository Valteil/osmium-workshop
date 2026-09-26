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

export interface WritableFileStream {
  write(data: unknown): Promise<void>;
  close(): Promise<void>;
}

export interface FileHandle {
  name: string;
  kind: 'file';
  getFile(): Promise<File>;
  createWritable(): Promise<WritableFileStream>;
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
  // True for images living in the dataset's original_images/ folder (the
  // pre-bucketing originals). They are ALSO `disabled: true` — that's what
  // "treated as disabled" means for every existing mass/auto tool — but the
  // Disabled view excludes them so they only show in the Originals view.
  original?: boolean;
  meta?: EntryMeta;
  imgName?: string;
  txtName?: string;
  width?: number;
  height?: number;
}

export interface EntryMeta {
  reviewColor?: string;
  flaggedTags?: string[];
  // Past tags (ghost chips, canonical-tags.ts ghostTagsFor()) the user deleted for this image:
  // hidden from the preview and never restored when their merge/void rule is turned off.
  ghostDismissed?: string[];
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
  // Tag Sorting's per-image subject tree (see notes/Features/Tag-Sorting.md).
  // Absent/empty = the flat category view.
  tagSubjects?: TagSubject[];
  tagAssign?: Record<string, string>; // tag -> subject id
}

// A named subject header in Tag Sorting's multi-subject tree (e.g. "Girl 1"),
// holding the category subheaders the user chose to add under it. `subheaders`
// holds TagCategoryId values (kept as plain strings so this renderer-only type
// file doesn't import the generated data module).
export interface TagSubject {
  id: string;
  name: string;
  subheaders: string[];
}

export interface GalleryFilter {
  base: string;
  terms: string[];
  mode: 'AND' | 'OR' | 'XOR' | 'NOT';
  excludes: string;
  disabledView: boolean;
  originalsView: boolean;
  exactMatch: boolean;
}

export type GallerySortMode = 'filename' | 'tagcount' | 'resolution' | 'dirty' | 'dateadded' | 'newest' | 'oldest' | 'random' | 'modified';
export type GallerySortDir = 'asc' | 'desc';
export type ViewMode = 'grid' | 'compact' | 'single' | 'disabled' | 'originals';
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
  // Review-flag-only (unflag-review, see index.ts's markTagReviewed()): the entry's
  // `meta.flaggedTags` before/after. A separate pair from prevTags/newTags because this swaps
  // metadata, not the caption's tag list — applying it via applyTagDirection would corrupt tags.
  prevFlagged?: string[];
  newFlagged?: string[];
  // Ghost-delete-only (ghost-remove): `meta.ghostDismissed` before/after, same reasoning.
  prevGhostDismissed?: string[];
  newGhostDismissed?: string[];
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

export interface ChangeRecord {
  type: string;
  summary: string;
  affected: EditLogAffected[];
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
  moveCounts?: Record<string, number>;
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

// Cross-boundary types live in src/shared-types.d.ts so the main process can
// import them without pulling this renderer-only file into its build; import
// and re-export them here so existing `from './types'` imports keep working.
import type { ComfyResult, SynthDatPromptNode, SynthDatPrompt } from '../shared-types';
export type { ComfyResult, SynthDatPromptNode, SynthDatPrompt };

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

import type { Wd14LocalModel, Wd14LocalTagResult, Wd14LocalDownloadProgress } from '../shared-types';
export type { Wd14LocalModel, Wd14LocalTagResult, Wd14LocalDownloadProgress };

export interface Wd14LocalInterface {
  listModels(): Promise<Wd14LocalModel[]>;
  deleteModel(name: string): Promise<void>;
  downloadModel(opts: { name: string; modelUrl: string; tagsUrl: string }, onProgress?: (ev: Wd14LocalDownloadProgress) => void): Promise<void>;
  tagImage(payload: { name: string; imageBytes: Uint8Array; threshold: number; characterThreshold: number; preferGpu?: boolean }): Promise<Wd14LocalTagResult>;
  pickImportFiles?(): Promise<{ canceled: true } | { canceled?: false; name: string; modelPath: string; tagsPath: string }>;
  importModel?(payload: { name: string; modelPath: string; tagsPath: string }): Promise<void>;
}
