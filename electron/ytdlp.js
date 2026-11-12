import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getYtDlpPath, getBinariesDir } from './binaries.js';

// Map of active download processes
const activeDownloads = new Map();

/**
 * Validate and sanitize media URL to prevent CLI option injection
 */
export function sanitizeMediaUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    throw new Error('A valid media URL is required');
  }
  const trimmed = rawUrl.trim();
  // Reject leading dashes to prevent CLI flag injection
  if (trimmed.startsWith('-')) {
    throw new Error('Invalid URL format');
  }
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch (e) {
    throw new Error('Invalid URL structure');
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Invalid URL protocol: Only HTTP/HTTPS URLs are supported');
  }
  return parsed.href;
}

/**
 * Detect social platform or source from metadata & URL
 */
export function detectPlatform(info, url) {
  const ext = (info?.extractor_key || info?.extractor || '').toLowerCase();
  let host = '';
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch (e) {}

  if (ext.includes('youtube') || host.includes('youtube') || host.includes('youtu.be')) {
    return { name: 'YouTube', type: 'youtube', badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20' };
  }
  if (ext.includes('instagram') || host.includes('instagram')) {
    return { name: 'Instagram', type: 'instagram', badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/20' };
  }
  if (ext.includes('snapchat') || host.includes('snapchat')) {
    return { name: 'Snapchat', type: 'snapchat', badgeColor: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20' };
  }
  if (ext.includes('tiktok') || host.includes('tiktok')) {
    return { name: 'TikTok', type: 'tiktok', badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
  }
  if (ext.includes('twitter') || host.includes('twitter') || host.includes('x.com')) {
    return { name: 'Twitter / X', type: 'twitter', badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20' };
  }
  if (ext.includes('dailymotion') || host.includes('dailymotion')) {
    return { name: 'Dailymotion', type: 'dailymotion', badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
  }
  if (ext.includes('facebook') || host.includes('facebook') || host.includes('fb.watch')) {
    return { name: 'Facebook', type: 'facebook', badgeColor: 'bg-blue-600/10 text-blue-400 border-blue-600/20' };
  }
  if (ext.includes('reddit') || host.includes('reddit')) {
    return { name: 'Reddit', type: 'reddit', badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
  }
  if (ext.includes('pinterest') || host.includes('pinterest')) {
    return { name: 'Pinterest', type: 'pinterest', badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
  }
  if (ext.includes('vimeo') || host.includes('vimeo')) {
    return { name: 'Vimeo', type: 'vimeo', badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20' };
  }
  if (ext.includes('twitch') || host.includes('twitch')) {
    return { name: 'Twitch', type: 'twitch', badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
  }
  return { name: info?.extractor_key || 'Universal Web Video', type: 'universal', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
}

/**
 * Format raw seconds to HH:MM:SS
 */
export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return null;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Human readable file size
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return null;
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Fetch detailed video metadata from ANY supported platform
 */
export async function getVideoMetadata(url) {
  const cleanUrl = sanitizeMediaUrl(url);
  const ytDlp = getYtDlpPath();
  const binDir = getBinariesDir();

  return new Promise((resolve, reject) => {
    const args = [
      '--dump-json',
      '--no-playlist',
      '--ffmpeg-location', binDir,
      '--',
      cleanUrl
    ];

    const proc = spawn(ytDlp, args, { windowsHide: true });
    let stdoutData = '';
    let stderrData = '';

    proc.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(stderrData || `Extraction failed with code ${code}`));
      }

      try {
        const info = JSON.parse(stdoutData);
        const platform = detectPlatform(info, cleanUrl);

        // Pick best thumbnail
        let thumbnail = info.thumbnail;
        if (Array.isArray(info.thumbnails) && info.thumbnails.length > 0) {
          const sortedThumbs = [...info.thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
          thumbnail = sortedThumbs[0].url || thumbnail;
        }

        const formats = info.formats || [];
        const availableVideoFormats = [];

        // 1. Always offer "Best Quality (Original Master)"
        let bestSize = null;
        if (info.filesize || info.filesize_approx) {
          bestSize = formatBytes(info.filesize || info.filesize_approx);
        }

        availableVideoFormats.push({
          id: 'video-best',
          type: 'video',
          label: 'Best Available',
          subLabel: 'Original Quality',
          size: bestSize,
          formatSelector: 'bestvideo+bestaudio/best',
          extension: 'mp4'
        });

        // 2. Standard resolution tiers (supports both horizontal & vertical videos via Math.min(width, height))
        const standardTiers = [
          { label: '4K Ultra HD', minDim: 2160, quality: '2160p' },
          { label: '2K Quad HD', minDim: 1440, quality: '1440p' },
          { label: 'Full HD', minDim: 1080, quality: '1080p' },
          { label: 'HD', minDim: 720, quality: '720p' },
          { label: 'Standard', minDim: 480, quality: '480p' },
          { label: 'Medium', minDim: 360, quality: '360p' }
        ];

        for (const tier of standardTiers) {
          // Check if any format matches dimension (horizontal height or vertical width)
          const matching = formats.filter(f => {
            if (f.vcodec === 'none') return false;
            const dim = (f.width && f.height) ? Math.min(f.width, f.height) : (f.height || f.width || 0);
            return dim >= tier.minDim - 25 && dim <= tier.minDim + 25;
          });

          if (matching.length > 0) {
            const has60fps = matching.some(f => (f.fps || 0) >= 50);
            const label = has60fps ? `${tier.quality} 60fps` : tier.quality;

            const sample = matching[0];
            const size = sample.filesize || sample.filesize_approx;

            availableVideoFormats.push({
              id: `video-${tier.minDim}`,
              type: 'video',
              height: tier.minDim,
              label: label,
              subLabel: tier.label,
              size: size ? formatBytes(size) : null,
              formatSelector: `bestvideo[height<=${tier.minDim}]+bestaudio/best[height<=${tier.minDim}]/best`,
              extension: 'mp4'
            });
          }
        }

        // 3. Audio formats (universal conversion to MP3/M4A via FFmpeg)
        const audioFormats = [
          { id: 'audio-mp3-320', type: 'audio', label: 'MP3 High Quality', quality: '320 kbps', format: 'mp3', audioQuality: '0' },
          { id: 'audio-mp3-256', type: 'audio', label: 'MP3 Very Good', quality: '256 kbps', format: 'mp3', audioQuality: '2' },
          { id: 'audio-mp3-192', type: 'audio', label: 'MP3 Good Quality', quality: '192 kbps', format: 'mp3', audioQuality: '4' },
          { id: 'audio-mp3-128', type: 'audio', label: 'MP3 Standard', quality: '128 kbps', format: 'mp3', audioQuality: '5' },
          { id: 'audio-m4a', type: 'audio', label: 'M4A / AAC', quality: 'Original Audio Stream', format: 'm4a', audioQuality: '0' }
        ];

        // 4. Subtitles
        const subs = [];
        if (info.subtitles) {
          for (const [lang, list] of Object.entries(info.subtitles)) {
            subs.push({ code: lang, name: list[0]?.name || lang, auto: false });
          }
        }
        if (info.automatic_captions) {
          for (const [lang, list] of Object.entries(info.automatic_captions)) {
            if (!subs.some(s => s.code === lang)) {
              subs.push({ code: lang, name: (list[0]?.name || lang) + ' (Auto)', auto: true });
            }
          }
        }

        resolve({
          id: info.id || String(Date.now()),
          title: info.title || info.fulltitle || 'Video Download',
          description: info.description ? info.description.slice(0, 300) : '',
          channel: info.uploader || info.creator || info.channel || platform.name,
          channelUrl: info.uploader_url || info.channel_url || '',
          duration: info.duration,
          durationFormatted: formatDuration(info.duration),
          thumbnail: thumbnail,
          viewCount: info.view_count ? info.view_count.toLocaleString() : null,
          uploadDate: info.upload_date,
          webpageUrl: info.webpage_url || cleanUrl,
          platform: platform,
          videoFormats: availableVideoFormats,
          audioFormats: audioFormats,
          subtitles: subs
        });
      } catch (err) {
        reject(new Error(`Failed to parse media details: ${err.message}`));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Fetch playlist entries
 */
export async function getPlaylistMetadata(url) {
  const cleanUrl = sanitizeMediaUrl(url);
  const ytDlp = getYtDlpPath();

  return new Promise((resolve, reject) => {
    const args = [
      '--flat-playlist',
      '--dump-json',
      '--',
      cleanUrl
    ];

    const proc = spawn(ytDlp, args, { windowsHide: true });
    let stdoutData = '';
    let stderrData = '';

    proc.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderrData += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(stderrData || `Failed to fetch playlist (code ${code})`));
      }

      try {
        const lines = stdoutData.trim().split('\n').filter(Boolean);
        const entries = [];
        let playlistTitle = 'Playlist';

        for (const line of lines) {
          try {
            const item = JSON.parse(line);
            if (item._type === 'playlist') {
              playlistTitle = item.title || playlistTitle;
            } else {
              entries.push({
                id: item.id,
                title: item.title,
                url: item.url || (item.id ? `https://www.youtube.com/watch?v=${item.id}` : cleanUrl),
                duration: item.duration,
                durationFormatted: formatDuration(item.duration),
                uploader: item.uploader || item.channel || ''
              });
            }
          } catch (e) {}
        }

        resolve({
          title: playlistTitle,
          count: entries.length,
          entries: entries
        });
      } catch (err) {
        reject(err);
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Execute download
 */
export function startDownload(options, onProgress, onComplete, onError) {
  const {
    id: downloadId,
    url,
    title,
    isAudio = false,
    formatSelector,
    audioFormat = 'mp3',
    audioQuality = '0',
    outputDir,
    downloadSubtitles = false,
    downloadThumbnail = false
  } = options;

  let cleanUrl;
  try {
    cleanUrl = sanitizeMediaUrl(url);
  } catch (err) {
    onError({ downloadId, error: err.message });
    return downloadId;
  }

  // Pre-create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    try {
      fs.mkdirSync(outputDir, { recursive: true });
    } catch (e) {
      onError({ downloadId, error: `Cannot create destination folder: ${e.message}` });
      return downloadId;
    }
  }

  const ytDlp = getYtDlpPath();
  const binDir = getBinariesDir();

  // Clean filename template with windows filenames
  const outTemplate = path.join(outputDir, '%(title)s.%(ext)s');

  const args = [
    '--newline',
    '--no-playlist',
    '--windows-filenames',
    '--ffmpeg-location', binDir,
    '-o', outTemplate
  ];

  if (isAudio) {
    args.push('-x');
    args.push('--audio-format', audioFormat);
    args.push('--audio-quality', audioQuality);
  } else if (formatSelector) {
    args.push('-f', formatSelector);
    args.push('--merge-output-format', 'mp4');
  }

  if (downloadSubtitles) {
    args.push('--write-subs');
    args.push('--sub-langs', 'all');
  }

  if (downloadThumbnail) {
    args.push('--write-thumbnail');
    args.push('--convert-thumbnails', 'png');
  }

  // End of options flag before URL
  args.push('--', cleanUrl);

  const proc = spawn(ytDlp, args, { windowsHide: true });
  activeDownloads.set(downloadId, proc);

  let finalFilePath = null;
  let stdoutBuffer = '';

  const progressRegex = /\[download\]\s+(\d+\.?\d*)%\s+of\s+~?\s*([\d\.]+[A-Za-z]+)\s+at\s+([\d\.]+[A-Za-z\/]+)\s+ETA\s+(\d+:\d+)/;
  const destinationRegex = /\[(?:download|Merger|ExtractAudio)\] Destination:\s+(.+)$/;
  const alreadyDownloadedRegex = /\[download\]\s+(.+)\s+has already been downloaded/;

  proc.stdout.on('data', (chunk) => {
    stdoutBuffer += chunk.toString();
    const lines = stdoutBuffer.split('\n');
    stdoutBuffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const progressMatch = trimmed.match(progressRegex);
      if (progressMatch) {
        const percent = parseFloat(progressMatch[1]);
        const totalSize = progressMatch[2];
        const speed = progressMatch[3];
        const eta = progressMatch[4];

        onProgress({
          downloadId,
          percent,
          totalSize,
          speed,
          eta,
          status: 'downloading'
        });
      }

      const destMatch = trimmed.match(destinationRegex);
      if (destMatch && destMatch[1]) {
        finalFilePath = destMatch[1].trim();
      }

      const alreadyMatch = trimmed.match(alreadyDownloadedRegex);
      if (alreadyMatch && alreadyMatch[1]) {
        finalFilePath = alreadyMatch[1].trim();
      }

      if (trimmed.includes('[Merger] Merging formats')) {
        onProgress({
          downloadId,
          percent: 98,
          status: 'merging',
          speed: 'Processing',
          eta: '00:01'
        });
      }

      if (trimmed.includes('[ExtractAudio] Destination')) {
        onProgress({
          downloadId,
          percent: 95,
          status: 'converting',
          speed: 'Converting Audio',
          eta: '00:02'
        });
      }
    }
  });

  let stderr = '';
  proc.stderr.on('data', (chunk) => {
    stderr += chunk.toString();
  });

  proc.on('close', (code) => {
    activeDownloads.delete(downloadId);

    if (code === 0) {
      onComplete({
        downloadId,
        filePath: finalFilePath || outputDir,
        title: title || 'Download'
      });
    } else {
      onError({
        downloadId,
        error: stderr || `Process exited with code ${code}`
      });
    }
  });

  proc.on('error', (err) => {
    activeDownloads.delete(downloadId);
    onError({
      downloadId,
      error: err.message
    });
  });

  return downloadId;
}

/**
 * Cancel active download safely
 */
export function cancelDownload(downloadId) {
  const proc = activeDownloads.get(downloadId);
  if (proc && proc.pid) {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { windowsHide: true });
    } else {
      try {
        process.kill(-proc.pid, 'SIGKILL');
      } catch (e) {
        proc.kill('SIGKILL');
      }
    }
    activeDownloads.delete(downloadId);
    return true;
  }
  return false;
}
