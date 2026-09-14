const { contextBridge, ipcRenderer } = require('electron');

// Minimal, explicit bridge — only these actions are exposed to the
// renderer, and all are simple pass-throughs to main-process handlers
// that themselves only touch the app's own userData/tool folder or a
// folder the user explicitly picks via a native dialog.
contextBridge.exposeInMainWorld('electronAPI', {
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
  onSynthdatProgress: (callback) => ipcRenderer.on('synthdat-progress', callback)
});
