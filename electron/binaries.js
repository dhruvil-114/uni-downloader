import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root bin directory
const binDir = path.resolve(__dirname, '..', 'bin');

export function getBinariesDir() {
  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }
  return binDir;
}

export function getYtDlpPath() {
  const localExe = path.join(binDir, 'yt-dlp.exe');
  if (fs.existsSync(localExe)) {
    return localExe;
  }
  return 'yt-dlp';
}

export function getFfmpegPath() {
  const localExe = path.join(binDir, 'ffmpeg.exe');
  if (fs.existsSync(localExe)) {
    return localExe;
  }
  return 'ffmpeg';
}

export function getAria2Path() {
  const localExe = path.join(binDir, 'aria2c.exe');
  if (fs.existsSync(localExe)) {
    return localExe;
  }
  return 'aria2c';
}

function runCommandSafe(command, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { windowsHide: true });
    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (d) => { stdout += d.toString(); });
    proc.stderr?.on('data', (d) => { stderr += d.toString(); });

    proc.on('close', (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr || `Command exited with code ${code}`));
    });

    proc.on('error', reject);
  });
}

export async function checkBinariesStatus() {
  getBinariesDir();

  let ytdlpAvailable = false;
  let ytdlpVersion = null;
  let ffmpegAvailable = false;
  let ffmpegVersion = null;

  // 1. Check yt-dlp
  const localYtdlp = path.join(binDir, 'yt-dlp.exe');
  if (fs.existsSync(localYtdlp)) {
    try {
      const stdout = await runCommandSafe(localYtdlp, ['--version']);
      ytdlpAvailable = true;
      ytdlpVersion = stdout;
    } catch (e) {
      // Local file might be corrupted
    }
  }

  if (!ytdlpAvailable) {
    try {
      const stdout = await runCommandSafe('yt-dlp', ['--version']);
      ytdlpAvailable = true;
      ytdlpVersion = stdout;
    } catch (e) {
      // Not in path
    }
  }

  // 2. Check ffmpeg
  const localFfmpeg = path.join(binDir, 'ffmpeg.exe');
  if (fs.existsSync(localFfmpeg)) {
    try {
      const stdout = await runCommandSafe(localFfmpeg, ['-version']);
      ffmpegAvailable = true;
      const firstLine = stdout.split('\n')[0];
      ffmpegVersion = firstLine;
    } catch (e) {
      // Local file might be corrupted
    }
  }

  if (!ffmpegAvailable) {
    try {
      const stdout = await runCommandSafe('ffmpeg', ['-version']);
      ffmpegAvailable = true;
      const firstLine = stdout.split('\n')[0];
      ffmpegVersion = firstLine;
    } catch (e) {
      // Not in path
    }
  }

  let aria2Available = false;
  let aria2Version = null;

  // 3. Check aria2c
  const localAria2 = path.join(binDir, 'aria2c.exe');
  if (fs.existsSync(localAria2)) {
    try {
      const stdout = await runCommandSafe(localAria2, ['--version']);
      aria2Available = true;
      aria2Version = stdout.split('\n')[0];
    } catch (e) {}
  }

  if (!aria2Available) {
    try {
      const stdout = await runCommandSafe('aria2c', ['--version']);
      aria2Available = true;
      aria2Version = stdout.split('\n')[0];
    } catch (e) {}
  }

  return {
    ytDlp: {
      available: ytdlpAvailable,
      version: ytdlpVersion,
      path: ytdlpAvailable ? (fs.existsSync(localYtdlp) ? localYtdlp : 'yt-dlp') : null
    },
    ffmpeg: {
      available: ffmpegAvailable,
      version: ffmpegVersion,
      path: ffmpegAvailable ? (fs.existsSync(localFfmpeg) ? localFfmpeg : 'ffmpeg') : null
    },
    aria2c: {
      available: aria2Available,
      version: aria2Version,
      path: aria2Available ? (fs.existsSync(localAria2) ? localAria2 : 'aria2c') : null
    }
  };
}

function downloadFileWithRedirects(url, destPath, onProgress, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    let redirectCount = 0;
    const file = fs.createWriteStream(destPath);

    file.on('error', (err) => {
      file.close();
      fs.unlink(destPath, () => {});
      reject(err);
    });

    function get(currentUrl) {
      if (redirectCount++ > maxRedirects) {
        file.close();
        fs.unlink(destPath, () => {});
        return reject(new Error('Too many HTTP redirects'));
      }

      let parsedUrl;
      try {
        parsedUrl = new URL(currentUrl);
      } catch (e) {
        file.close();
        fs.unlink(destPath, () => {});
        return reject(new Error(`Invalid URL: ${currentUrl}`));
      }

      const req = https.get(parsedUrl, (response) => {
        // Handle HTTP redirects
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          response.resume(); // drain socket
          const nextUrl = new URL(response.headers.location, currentUrl).href;
          return get(nextUrl);
        }

        if (response.statusCode !== 200) {
          response.resume(); // drain socket
          file.close();
          fs.unlink(destPath, () => {});
          return reject(new Error(`Download failed with HTTP ${response.statusCode}`));
        }

        const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
        let receivedBytes = 0;

        response.on('data', (chunk) => {
          receivedBytes += chunk.length;
          if (totalBytes > 0 && onProgress) {
            const percent = Math.round((receivedBytes / totalBytes) * 100);
            onProgress({ receivedBytes, totalBytes, percent });
          }
        });

        response.pipe(file);

        file.on('finish', () => {
          file.close(() => resolve(destPath));
        });
      });

      req.on('error', (err) => {
        file.close();
        fs.unlink(destPath, () => {});
        reject(err);
      });
    }

    get(url);
  });
}

function extractZipSafe(zipPath, destinationPath) {
  return new Promise((resolve, reject) => {
    const ps = spawn('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      'Expand-Archive',
      '-LiteralPath', zipPath,
      '-DestinationPath', destinationPath,
      '-Force'
    ], { windowsHide: true });

    let stderr = '';
    ps.stderr?.on('data', (d) => { stderr += d.toString(); });

    ps.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Expand-Archive failed with code ${code}: ${stderr}`));
    });

    ps.on('error', reject);
  });
}

export async function downloadMissingBinaries(onProgress) {
  const dir = getBinariesDir();
  const status = await checkBinariesStatus();

  // 1. Download yt-dlp if needed
  if (!status.ytDlp.available) {
    onProgress?.({ binary: 'yt-dlp', status: 'downloading', message: 'Downloading yt-dlp engine...' });
    const ytdlpDest = path.join(dir, 'yt-dlp.exe');
    const ytdlpUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
    await downloadFileWithRedirects(ytdlpUrl, ytdlpDest, (p) => {
      onProgress?.({ binary: 'yt-dlp', status: 'downloading', percent: p.percent, message: `Downloading yt-dlp... ${p.percent}%` });
    });
    onProgress?.({ binary: 'yt-dlp', status: 'completed', percent: 100, message: 'yt-dlp ready!' });
  }

  // 2. Download ffmpeg if needed
  if (!status.ffmpeg.available) {
    onProgress?.({ binary: 'ffmpeg', status: 'downloading', message: 'Downloading FFmpeg engine...' });
    const zipDest = path.join(dir, 'ffmpeg-build.zip');
    const ffmpegUrl = 'https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip';
    
    await downloadFileWithRedirects(ffmpegUrl, zipDest, (p) => {
      onProgress?.({ binary: 'ffmpeg', status: 'downloading', percent: p.percent, message: `Downloading FFmpeg... ${p.percent}%` });
    });

    onProgress?.({ binary: 'ffmpeg', status: 'extracting', percent: 100, message: 'Extracting FFmpeg binaries...' });
    
    const extractDir = path.join(dir, 'ffmpeg-temp');
    await extractZipSafe(zipDest, extractDir);

    // Find and copy ffmpeg.exe and ffprobe.exe
    const findAndMove = (currentDir) => {
      if (!fs.existsSync(currentDir)) return;
      const items = fs.readdirSync(currentDir);
      for (const item of items) {
        const full = path.join(currentDir, item);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          findAndMove(full);
        } else if (item.toLowerCase() === 'ffmpeg.exe' || item.toLowerCase() === 'ffprobe.exe') {
          fs.copyFileSync(full, path.join(dir, item));
        }
      }
    };
    findAndMove(extractDir);

    // Cleanup temp zip and directory
    try {
      if (fs.existsSync(zipDest)) fs.unlinkSync(zipDest);
      if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true, force: true });
    } catch (e) {}

    onProgress?.({ binary: 'ffmpeg', status: 'completed', percent: 100, message: 'FFmpeg ready!' });
  }

  // 3. Download aria2c if needed (for 16x direct files & torrents)
  if (!status.aria2c.available) {
    onProgress?.({ binary: 'aria2c', status: 'downloading', message: 'Downloading aria2c turbo engine...' });
    const zipDest = path.join(dir, 'aria2-build.zip');
    const aria2Url = 'https://github.com/aria2/aria2/releases/download/release-1.37.0/aria2-1.37.0-win-64bit-build1.zip';

    await downloadFileWithRedirects(aria2Url, zipDest, (p) => {
      onProgress?.({ binary: 'aria2c', status: 'downloading', percent: p.percent, message: `Downloading aria2c... ${p.percent}%` });
    });

    onProgress?.({ binary: 'aria2c', status: 'extracting', percent: 100, message: 'Extracting aria2c binary...' });
    const extractDir = path.join(dir, 'aria2-temp');
    await extractZipSafe(zipDest, extractDir);

    const findAndMoveAria2 = (currentDir) => {
      if (!fs.existsSync(currentDir)) return;
      const items = fs.readdirSync(currentDir);
      for (const item of items) {
        const full = path.join(currentDir, item);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          findAndMoveAria2(full);
        } else if (item.toLowerCase() === 'aria2c.exe') {
          fs.copyFileSync(full, path.join(dir, 'aria2c.exe'));
        }
      }
    };
    findAndMoveAria2(extractDir);

    try {
      if (fs.existsSync(zipDest)) fs.unlinkSync(zipDest);
      if (fs.existsSync(extractDir)) fs.rmSync(extractDir, { recursive: true, force: true });
    } catch (e) {}

    onProgress?.({ binary: 'aria2c', status: 'completed', percent: 100, message: 'aria2c turbo engine ready!' });
  }

  return await checkBinariesStatus();
}
