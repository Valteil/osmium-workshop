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
  }
}
