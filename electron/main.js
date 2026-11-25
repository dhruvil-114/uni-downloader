import { app, BrowserWindow, ipcMain, dialog, shell, clipboard } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { checkBinariesStatus, downloadMissingBinaries, getBinariesDir } from './binaries.js';
import { getVideoMetadata, getPlaylistMetadata, startDownload, cancelDownload } from './ytdlp.js';
import { startAria2Download, stopAria2Download } from './aria2.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Whitelist of safe non-executable extensions for shell-open-file
const ALLOWED_MEDIA_EXTS = new Set([
  '.mp4', '.m4a', '.mp3', '.webm', '.mkv', '.avi', '.mov', '.flac', '.wav',
  '.srt', '.vtt', '.png', '.jpg', '.jpeg', '.webp',
  '.pdf', '.txt', '.csv', '.json', '.zip', '.rar', '.7z'
]);

const DIRECT_FILE_EXTS = new Set([
  '.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz',
  '.exe', '.msi', '.dmg', '.pkg', '.deb', '.rpm', '.apk', '.appimage',
  '.iso', '.img', '.bin',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv',
  '.mp3', '.flac', '.wav', '.mp4', '.mkv', '.avi'
]);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 780,
    minWidth: 760,
    minHeight: 540,
    frame: false, // Custom sleek titlebar
    backgroundColor: '#F8FAFC', // slate-50 light background
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true // Chromium sandbox enabled
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Security guard: Prevent top-level unauthorized navigation (e.g. dragging a link into app)
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    event.preventDefault();
    if (navigationUrl.startsWith('http:') || navigationUrl.startsWith('https:')) {
      shell.openExternal(navigationUrl);
    }
  });

  // Open links in external default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Load URL
  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      mainWindow.loadURL('http://localhost:5173');
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Ensure single instance
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    getBinariesDir();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC: Window controls
ipcMain.on('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window-close', () => {
  mainWindow?.close();
});

// IPC: Binaries
ipcMain.handle('binaries-check', async () => {
  return await checkBinariesStatus();
});

ipcMain.handle('binaries-download-missing', async (event) => {
  return await downloadMissingBinaries((progress) => {
    mainWindow?.webContents.send('binary-download-progress', progress);
  });
});

// IPC: Metadata & Downloads
ipcMain.handle('yt-fetch-metadata', async (event, url) => {
  return await getVideoMetadata(url);
});

ipcMain.handle('yt-fetch-playlist', async (event, url) => {
  return await getPlaylistMetadata(url);
});

ipcMain.handle('yt-start-download', async (event, options) => {
  return startDownload(
    options,
    (progress) => {
      mainWindow?.webContents.send('download-progress', progress);
    },
    (complete) => {
      mainWindow?.webContents.send('download-complete', complete);
    },
    (error) => {
      mainWindow?.webContents.send('download-error', error);
    }
  );
});

// IPC: Link classification
ipcMain.handle('detect-link-type', (event, rawInput) => {
  if (typeof rawInput !== 'string') return { kind: 'social' };
  const trimmed = rawInput.trim();
  const lower = trimmed.toLowerCase();

  if (lower.startsWith('magnet:?') || lower.endsWith('.torrent')) {
    return { kind: 'torrent', label: 'Torrent / Magnet' };
  }

  try {
    const parsed = new URL(trimmed);
    const ext = path.extname(parsed.pathname).toLowerCase();
    const host = parsed.hostname.toLowerCase();

    // Known social platforms always go to yt-dlp unless explicitly overridden
    const socialHosts = [
      'youtube.com', 'youtu.be', 'instagram.com', 'tiktok.com',
      'snapchat.com', 'twitter.com', 'x.com', 'dailymotion.com',
      'facebook.com', 'fb.watch', 'reddit.com', 'pinterest.com',
      'vimeo.com', 'twitch.tv', 'soundcloud.com'
    ];
    if (socialHosts.some((h) => host.includes(h))) {
      return { kind: 'social', label: 'Social / Video' };
    }

    if (DIRECT_FILE_EXTS.has(ext) || parsed.protocol === 'ftp:') {
      return { kind: 'direct', label: `Direct File (${ext || 'FTP'})`, filename: path.basename(parsed.pathname) };
    }
  } catch (e) {}

  return { kind: 'social', label: 'Auto / Web Video' };
});

ipcMain.handle('dialog-select-torrent', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select .torrent File',
    properties: ['openFile'],
    filters: [{ name: 'Torrent Files', extensions: ['torrent'] }]
  });
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('aria2-start-download', async (event, options) => {
  return startAria2Download(
    options,
    (progress) => mainWindow?.webContents.send('download-progress', progress),
    (complete) => mainWindow?.webContents.send('download-complete', complete),
    (error) => mainWindow?.webContents.send('download-error', error)
  );
});

ipcMain.handle('download-pause', async (event, downloadId) => {
  const pausedYt = cancelDownload(downloadId, true);
  const pausedAria = stopAria2Download(downloadId, true);
  return pausedYt || pausedAria;
});

ipcMain.handle('yt-cancel-download', async (event, downloadId) => {
  const cancelledYt = cancelDownload(downloadId, false);
  const cancelledAria = stopAria2Download(downloadId, false);
  return cancelledYt || cancelledAria;
});

// IPC: Files & Folders
ipcMain.handle('dialog-select-folder', async (event, defaultPath) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Download Folder',
    defaultPath: defaultPath || app.getPath('downloads'),
    properties: ['openDirectory', 'createDirectory']
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('get-default-download-path', () => {
  const userDownloads = app.getPath('downloads');
  const targetDir = path.join(userDownloads, 'Uni Downloads');
  if (!fs.existsSync(targetDir)) {
    try {
      fs.mkdirSync(targetDir, { recursive: true });
    } catch (e) {
      return userDownloads;
    }
  }
  return targetDir;
});

// Safe file opening with extension whitelist
ipcMain.handle('shell-open-file', async (event, filePath) => {
  if (typeof filePath !== 'string' || !fs.existsSync(filePath)) {
    return false;
  }

  const ext = path.extname(filePath).toLowerCase();
  if (!ALLOWED_MEDIA_EXTS.has(ext)) {
    console.warn(`Blocked attempt to open non-media file: ${filePath}`);
    return false;
  }

  await shell.openPath(filePath);
  return true;
});

// Safe folder opening / showing
ipcMain.handle('shell-open-folder', async (event, targetPath) => {
  if (typeof targetPath !== 'string' || !fs.existsSync(targetPath)) {
    return false;
  }

  try {
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      await shell.openPath(targetPath);
    } else {
      shell.showItemInFolder(targetPath);
    }
    return true;
  } catch (e) {
    return false;
  }
});

ipcMain.handle('clipboard-read-text', () => {
  return clipboard.readText();
});
