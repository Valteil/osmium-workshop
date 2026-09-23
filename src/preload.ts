import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI } from './ipc-types';

// Minimal, explicit bridge — only these actions are exposed to the
// renderer, and all are simple pass-throughs to main-process handlers
// that themselves only touch the app's own userData/tool folder or a
// folder the user explicitly picks via a native dialog.
//
// Annotated against the shared `ElectronAPI` contract so the exposed object
// and the renderer's ambient `window.electronAPI` type can't drift apart.
const api: ElectronAPI = {
  restartApp: () => ipcRenderer.invoke('restart-app'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  setZoomFactor: (factor) => ipcRenderer.invoke('set-zoom-factor', factor),
  exportAppState: (text) => ipcRenderer.invoke('export-app-state', text),
  onRequestClose: (callback) => ipcRenderer.on('request-close', callback),
  confirmClose: () => ipcRenderer.invoke('confirm-close'),
  wd14GetModels: (host) => ipcRenderer.invoke('wd14-get-models', host),
  wd14TagImage: (payload) => ipcRenderer.invoke('wd14-tag-image', payload),
  getHardwareAcceleration: () => ipcRenderer.invoke('get-hardware-acceleration'),
  setHardwareAcceleration: (enabled) => ipcRenderer.invoke('set-hardware-acceleration', enabled),
  synthdatGetObjectInfo: (payload) => ipcRenderer.invoke('synthdat-get-object-info', payload),
  synthdatQueueAndFetch: (payload) => ipcRenderer.invoke('synthdat-queue-and-fetch', payload),
  synthdatStopGeneration: (host) => ipcRenderer.invoke('synthdat-stop-generation', host),
  onSynthdatPreviewFrame: (callback) => ipcRenderer.on('synthdat-preview-frame', callback),
  onSynthdatProgress: (callback) => ipcRenderer.on('synthdat-progress', callback),
  wd14LocalListModels: () => ipcRenderer.invoke('wd14-local-list-models'),
  wd14LocalDeleteModel: (name) => ipcRenderer.invoke('wd14-local-delete-model', name),
  wd14LocalDownloadModel: (payload) => ipcRenderer.invoke('wd14-local-download-model', payload),
  wd14LocalTagImage: (payload) => ipcRenderer.invoke('wd14-local-tag-image', payload),
  onWd14LocalDownloadProgress: (callback) => ipcRenderer.on('wd14-local-download-progress', callback),
  wd14LocalPickImportFiles: () => ipcRenderer.invoke('wd14-local-pick-import-files'),
  wd14LocalImportModel: (payload) => ipcRenderer.invoke('wd14-local-import-model', payload),
  bucketModelStatus: () => ipcRenderer.invoke('bucket-model-status'),
  bucketDownloadModel: () => ipcRenderer.invoke('bucket-download-model'),
  bucketImage: (payload) => ipcRenderer.invoke('bucket-image', payload),
  onBucketDownloadProgress: (callback) => ipcRenderer.on('bucket-download-progress', callback)
};

contextBridge.exposeInMainWorld('electronAPI', api);
