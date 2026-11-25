import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { getAria2Path, checkBinariesStatus } from './binaries.js';

// Active aria2c / fallback processes
const activeAria2Downloads = new Map();

/**
 * Validate direct URL or magnet / torrent path
 */
export function validateDirectOrTorrentTarget(target) {
  if (typeof target !== 'string' || !target.trim()) {
    throw new Error('A valid URL, magnet link, or .torrent file is required');
  }
  const trimmed = target.trim();
  if (trimmed.startsWith('-')) {
    throw new Error('Invalid target format');
  }

  // Magnet URI
  if (trimmed.toLowerCase().startsWith('magnet:?')) {
    return { type: 'magnet', value: trimmed };
  }

  // Local .torrent file
  if (trimmed.toLowerCase().endsWith('.torrent') && fs.existsSync(trimmed)) {
    return { type: 'torrent-file', value: trimmed };
  }

  // HTTP/HTTPS/FTP URL
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch (e) {
    throw new Error('Invalid URL or torrent path');
  }
  if (!['http:', 'https:', 'ftp:'].includes(parsed.protocol)) {
    throw new Error('Unsupported protocol: Only HTTP, HTTPS, FTP, and Magnet links are supported');
  }
  return { type: 'url', value: parsed.href };
}

/**
 * Start ultra-fast 16-connection direct download or BitTorrent/Magnet download via aria2c
 */
export async function startAria2Download(options, onProgress, onComplete, onError) {
  const {
    id: downloadId,
    url,
    title,
    outputDir,
    connections = 16
  } = options;

  let target;
  try {
    target = validateDirectOrTorrentTarget(url);
  } catch (err) {
    onError({ downloadId, error: err.message });
    return downloadId;
  }

  if (!fs.existsSync(outputDir)) {
    try {
      fs.mkdirSync(outputDir, { recursive: true });
    } catch (e) {
      onError({ downloadId, error: `Cannot create destination folder: ${e.message}` });
      return downloadId;
    }
  }

  const status = await checkBinariesStatus();
  if (!status.aria2c.available) {
    if (target.type === 'magnet' || target.type === 'torrent-file') {
      onError({
        downloadId,
        error: 'aria2c engine is required for Torrents/Magnets. Open Settings -> Check Status to auto-download it.'
      });
      return downloadId;
    }
    // Fallback to Node HTTP downloader for regular direct URLs
    return startNodeFallbackDownload({ downloadId, url: target.value, title, outputDir }, onProgress, onComplete, onError);
  }

  const aria2Bin = getAria2Path();
  const connStr = String(Math.min(Math.max(Number(connections) || 16, 1), 16));

  const args = [
    '--continue=true',
    '--file-allocation=none',
    '--disable-ipv6=true',
    '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    '--max-tries=10',
    '--retry-wait=2',
    '--connect-timeout=15',
    '--summary-interval=1',
    '--console-log-level=notice',
    '--allow-overwrite=false',
    '--auto-file-renaming=true',
    '-d', outputDir
  ];

  if (target.type === 'magnet' || target.type === 'torrent-file') {
    args.push(
      '--enable-dht=true',
      '--enable-peer-exchange=true',
      '--bt-enable-lpd=true',
      '--bt-max-peers=80',
      '--bt-request-peer-speed-limit=0',
      '--seed-time=0'
    );
  } else {
    args.push(
      `-x`, connStr,
      `-s`, connStr,
      `-k`, '1M'
    );
  }

  args.push('--', target.value);

  const proc = spawn(aria2Bin, args, { windowsHide: true });
  activeAria2Downloads.set(downloadId, { proc, paused: false });

  let stdoutBuffer = '';
  let stderr = '';
  let resolvedFilePath = null;

  // Example: [#2089b0 45MiB/100MiB(45%) CN:16 DL:18MiB ETA:3s]
  // Torrent: [#2089b0 45MiB/100MiB(45%) CN:12 SEED:5 DL:8.2MiB UL:120KiB ETA:6s]
  const progressRegex = /\[#[a-f0-9]+\s+([\d\.]+[A-Za-z]+)\/([\d\.]+[A-Za-z]+)\((\d+)%\)(?:.*?CN:(\d+))?(?:.*?SEED:(\d+))?.*?DL:([\d\.]+[A-Za-z]+)(?:.*?ETA:([^\]]+))?\]/i;
  const completeFileRegex = /\|\s*(.+?)\s*$/;

  proc.stdout.on('data', (chunk) => {
    stdoutBuffer += chunk.toString();
    const lines = stdoutBuffer.split(/\r?\n/);
    stdoutBuffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const match = trimmed.match(progressRegex);
      if (match) {
        const downloadedSize = match[1];
        const totalSize = match[2];
        const percent = parseFloat(match[3]);
        const activeConns = match[4] ? Number(match[4]) : null;
        const seeders = match[5] ? Number(match[5]) : null;
        const speed = `${match[6]}/s`;
        const eta = match[7] ? match[7].trim() : '...';

        onProgress({
          downloadId,
          percent,
          downloadedSize,
          totalSize,
          speed,
          eta,
          connections: activeConns,
          seeders,
          status: 'downloading'
        });
      }

      if (trimmed.includes('Download complete:')) {
        const idx = trimmed.indexOf('Download complete:');
        const candidate = trimmed.slice(idx + 'Download complete:'.length).trim();
        if (candidate) resolvedFilePath = candidate;
      } else if (trimmed.includes('|OK') && trimmed.includes('|')) {
        const parts = trimmed.split('|');
        const lastPart = parts[parts.length - 1]?.trim();
        if (lastPart && fs.existsSync(lastPart)) {
          resolvedFilePath = lastPart;
        }
      }
    }
  });

  proc.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  proc.on('close', (code) => {
    const entry = activeAria2Downloads.get(downloadId);
    const wasPaused = entry?.paused;
    activeAria2Downloads.delete(downloadId);

    if (wasPaused) {
      return; // Paused state already handled by UI/IPC
    }

    if (code === 0) {
      onComplete({
        downloadId,
        filePath: resolvedFilePath || outputDir,
        title: resolvedFilePath ? path.basename(resolvedFilePath) : (title || 'Download')
      });
    } else {
      onError({
        downloadId,
        error: stderr.trim() || `aria2c exited with code ${code}`
      });
    }
  });

  proc.on('error', (err) => {
    activeAria2Downloads.delete(downloadId);
    onError({ downloadId, error: err.message });
  });

  return downloadId;
}

/**
 * Lightweight Node HTTP/HTTPS fallback when aria2c binary isn't installed yet
 */
function startNodeFallbackDownload({ downloadId, url, title, outputDir }, onProgress, onComplete, onError, redirects = 0) {
  if (redirects > 5) {
    onError({ downloadId, error: 'Too many redirects' });
    return downloadId;
  }

  const parsedUrl = new URL(url);
  const client = parsedUrl.protocol === 'https:' ? https : http;

  const req = client.get(parsedUrl, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      res.resume();
      const nextUrl = new URL(res.headers.location, url).href;
      return startNodeFallbackDownload({ downloadId, url: nextUrl, title, outputDir }, onProgress, onComplete, onError, redirects + 1);
    }

    if (res.statusCode !== 200) {
      res.resume();
      onError({ downloadId, error: `HTTP Error ${res.statusCode}` });
      return;
    }

    let fileName = title || path.basename(parsedUrl.pathname) || `download-${Date.now()}`;
    const disp = res.headers['content-disposition'];
    if (disp) {
      const m = disp.match(/filename="?([^"]+)"?/i);
      if (m && m[1]) fileName = path.basename(m[1]);
    }
    fileName = fileName.replace(/[<>:"/\\|?*]/g, '_');

    const destPath = path.join(outputDir, fileName);
    const file = fs.createWriteStream(destPath);
    const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
    let receivedBytes = 0;
    let lastTime = Date.now();
    let lastBytes = 0;

    activeAria2Downloads.set(downloadId, { req, res, file, paused: false });

    res.on('data', (chunk) => {
      receivedBytes += chunk.length;
      const now = Date.now();
      if (now - lastTime >= 500) {
        const dt = (now - lastTime) / 1000;
        const speedBps = (receivedBytes - lastBytes) / dt;
        const speedMB = (speedBps / (1024 * 1024)).toFixed(1) + ' MB/s';
        const percent = totalBytes > 0 ? Math.round((receivedBytes / totalBytes) * 100) : 0;
        const totalMB = totalBytes > 0 ? (totalBytes / (1024 * 1024)).toFixed(1) + ' MB' : '';
        const etaSec = speedBps > 0 && totalBytes > 0 ? Math.round((totalBytes - receivedBytes) / speedBps) : 0;
        const eta = etaSec > 0 ? `${Math.floor(etaSec / 60)}:${String(etaSec % 60).padStart(2, '0')}` : '...';

        onProgress({
          downloadId,
          percent,
          totalSize: totalMB,
          speed: speedMB,
          eta,
          connections: 1,
          status: 'downloading'
        });

        lastTime = now;
        lastBytes = receivedBytes;
      }
    });

    res.pipe(file);

    file.on('finish', () => {
      activeAria2Downloads.delete(downloadId);
      file.close(() => {
        onComplete({ downloadId, filePath: destPath, title: fileName });
      });
    });

    file.on('error', (err) => {
      activeAria2Downloads.delete(downloadId);
      file.close();
      onError({ downloadId, error: err.message });
    });
  });

  req.on('error', (err) => {
    const entry = activeAria2Downloads.get(downloadId);
    const wasPaused = entry?.paused;
    activeAria2Downloads.delete(downloadId);
    if (!wasPaused) {
      onError({ downloadId, error: err.message });
    }
  });

  return downloadId;
}

/**
 * Pause or Cancel active aria2c / fallback download
 */
export function stopAria2Download(downloadId, isPause = false) {
  const entry = activeAria2Downloads.get(downloadId);
  if (!entry) return false;

  entry.paused = isPause;

  if (entry.proc && entry.proc.pid) {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(entry.proc.pid), '/T', '/F'], { windowsHide: true });
    } else {
      try {
        process.kill(-entry.proc.pid, 'SIGKILL');
      } catch (e) {
        entry.proc.kill('SIGKILL');
      }
    }
  } else if (entry.req) {
    try {
      entry.req.destroy();
      entry.file?.close();
    } catch (e) {}
  }

  if (!isPause) {
    activeAria2Downloads.delete(downloadId);
  }
  return true;
}
