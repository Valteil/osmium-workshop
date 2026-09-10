const { contextBridge, ipcRenderer } = require('electron');

// Minimal, explicit bridge — only these actions are exposed to the
// renderer, and all are simple pass-throughs to main-process handlers
// that themselves only touch the app's own userData/tool folder or a
// folder the user explicitly picks via a native dialog.
contextBridge.exposeInMainWorld('electronAPI', {
  restartApp: () => ipcRenderer.invoke('restart-app'),
  setZoomFactor: (factor) => ipcRenderer.invoke('set-zoom-factor', factor),
  generateGithubPackage: () => ipcRenderer.invoke('generate-github-package'),
  onRequestClose: (callback) => ipcRenderer.on('request-close', callback),
  confirmClose: () => ipcRenderer.invoke('confirm-close'),
  wd14GetModels: (host) => ipcRenderer.invoke('wd14-get-models', host),
  wd14TagImage: (payload) => ipcRenderer.invoke('wd14-tag-image', payload)
});
