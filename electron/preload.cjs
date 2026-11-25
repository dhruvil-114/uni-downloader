const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),

  // Binaries status
  checkBinaries: () => ipcRenderer.invoke('binaries-check'),
  downloadMissingBinaries: () => ipcRenderer.invoke('binaries-download-missing'),

  // Link classification & torrent picker
  detectLinkType: (url) => ipcRenderer.invoke('detect-link-type', url),
  selectTorrentFile: () => ipcRenderer.invoke('dialog-select-torrent'),

  // Media & Direct/Torrent operations
  fetchMetadata: (url) => ipcRenderer.invoke('yt-fetch-metadata', url),
  fetchPlaylist: (url) => ipcRenderer.invoke('yt-fetch-playlist', url),
  startDownload: (options) => ipcRenderer.invoke('yt-start-download', options),
  startDirectDownload: (options) => ipcRenderer.invoke('aria2-start-download', options),
  pauseDownload: (downloadId) => ipcRenderer.invoke('download-pause', downloadId),
  cancelDownload: (downloadId) => ipcRenderer.invoke('yt-cancel-download', downloadId),

  // File system & shell
  selectFolder: (defaultPath) => ipcRenderer.invoke('dialog-select-folder', defaultPath),
  getDefaultDownloadPath: () => ipcRenderer.invoke('get-default-download-path'),
  openFile: (filePath) => ipcRenderer.invoke('shell-open-file', filePath),
  openFolder: (folderPath) => ipcRenderer.invoke('shell-open-folder', folderPath),
  clipboardReadText: () => ipcRenderer.invoke('clipboard-read-text'),

  // Events listener
  onDownloadProgress: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('download-progress', subscription);
    return () => ipcRenderer.removeListener('download-progress', subscription);
  },
  onDownloadComplete: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('download-complete', subscription);
    return () => ipcRenderer.removeListener('download-complete', subscription);
  },
  onDownloadError: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('download-error', subscription);
    return () => ipcRenderer.removeListener('download-error', subscription);
  },
  onBinaryDownloadProgress: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('binary-download-progress', subscription);
    return () => ipcRenderer.removeListener('binary-download-progress', subscription);
  }
});
