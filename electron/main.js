import { app, BrowserWindow, ipcMain, dialog, shell, clipboard } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { checkBinariesStatus, downloadMissingBinaries, getBinariesDir } from './binaries.js';
import { getVideoMetadata, getPlaylistMetadata, startDownload, cancelDownload } from './ytdlp.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Whitelist of allowed extensions for shell-open-file
const ALLOWED_MEDIA_EXTS = new Set([
  '.mp4', '.m4a', '.mp3', '.webm', '.mkv',
  '.srt', '.vtt', '.png', '.jpg', '.jpeg', '.webp'
]);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 760,
    minWidth: 880,
    minHeight: 620,
    frame: false, // Custom sleek titlebar
    backgroundColor: '#020617', // slate-950
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

ipcMain.handle('yt-cancel-download', async (event, downloadId) => {
  return cancelDownload(downloadId);
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
  const targetDir = path.join(userDownloads, 'YouTube Downloads');
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
