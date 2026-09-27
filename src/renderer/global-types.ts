import type { ElectronAPI } from '../ipc-types';
import type { Wd14LocalInterface } from './types';

export {};

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    Wd14Local?: Wd14LocalInterface;
    Capacitor?: { platform: string };
    __dtsReviveDirHandle?: (json: unknown) => FileSystemDirectoryHandle;
    __dtsPreThemed?: boolean;
    // From index.html's inline "Theme mark" script (the opening flourish's logo).
    __dtsMarkSpec?: Record<string, { L: Record<string, unknown> }>;
    __dtsMarkSVG?: (L: Record<string, unknown>) => string;
  }
}
