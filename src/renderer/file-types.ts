// Image-file detection shared by index.ts's folder scan and dataset-manager.ts's
// thumbnail scan — both had their own copy of the same extension list + check.

export const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif'];

export function isImageFile(name: string): boolean {
  const lower = name.toLowerCase();
  return IMAGE_EXTS.some(ext => lower.endsWith(ext));
}
