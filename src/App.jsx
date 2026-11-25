import React, { useState, useEffect, useRef, useMemo } from 'react';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import AddUrlBar from './components/AddUrlBar';
import DownloadTable from './components/DownloadTable';
import MediaModal from './components/MediaModal';
import PlaylistModal from './components/PlaylistModal';
import SettingsModal from './components/SettingsModal';
import { AlertTriangle, X } from 'lucide-react';

function parseSpeedToMB(speedStr) {
  if (!speedStr || typeof speedStr !== 'string') return 0;
  const match = speedStr.match(/([\d\.]+)\s*([KMGT]?i?B)/i);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  if (unit.startsWith('G')) return val * 1024;
  if (unit.startsWith('M')) return val;
  if (unit.startsWith('K')) return val / 1024;
  return val / (1024 * 1024);
}

export default function App() {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [playlistData, setPlaylistData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [downloadPath, setDownloadPath] = useState('');
  const [binaryStatus, setBinaryStatus] = useState(null);
  const [binaryProgress, setBinaryProgress] = useState(null);

  const [downloads, setDownloads] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [maxConcurrent, setMaxConcurrent] = useState(2);

  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const pendingOptionsRef = useRef(new Map());

  // Concurrency Queue Runner
  useEffect(() => {
    const activeTasks = downloads.filter((d) =>
      ['downloading', 'merging', 'converting'].includes(d.status)
    );
    const queuedTasks = downloads.filter((d) => d.status === 'queued');

    if (activeTasks.length < maxConcurrent && queuedTasks.length > 0) {
      const slots = maxConcurrent - activeTasks.length;
      const toStart = queuedTasks.slice(0, slots);

      toStart.forEach((nextTask) => {
        const taskOptions = pendingOptionsRef.current.get(nextTask.id);
        if (!taskOptions || !window.electronAPI) return;

        setDownloads((prev) =>
          prev.map((item) =>
            item.id === nextTask.id
              ? { ...item, status: 'downloading', speed: 'Starting...' }
              : item
          )
        );

        const runner =
          nextTask.engine === 'aria2'
            ? window.electronAPI.startDirectDownload(taskOptions)
            : window.electronAPI.startDownload(taskOptions);

        runner.catch((err) => {
          setDownloads((prev) =>
            prev.map((item) =>
              item.id === nextTask.id ? { ...item, status: 'error', error: err.message } : item
            )
          );
        });
      });
    }
  }, [downloads, maxConcurrent]);

  // Initialize IPC & listeners
  useEffect(() => {
    async function init() {
      try {
        if (window.electronAPI) {
          const defaultPath = await window.electronAPI.getDefaultDownloadPath();
          setDownloadPath(defaultPath);
          const status = await window.electronAPI.checkBinaries();
          setBinaryStatus(status);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    init();

    if (window.electronAPI) {
      const unsubProgress = window.electronAPI.onDownloadProgress((data) => {
        setDownloads((prev) =>
          prev.map((item) => {
            if (item.id === data.downloadId && item.status !== 'paused' && item.status !== 'cancelled') {
              return {
                ...item,
                percent: data.percent ?? item.percent,
                downloadedSize: data.downloadedSize || item.downloadedSize,
                totalSize: data.totalSize || item.totalSize,
                speed: data.speed || item.speed,
                eta: data.eta || item.eta,
                connections: data.connections ?? item.connections,
                seeders: data.seeders ?? item.seeders,
                status: data.status || 'downloading'
              };
            }
            return item;
          })
        );
      });

      const unsubComplete = window.electronAPI.onDownloadComplete((data) => {
        setDownloads((prev) =>
          prev.map((item) => {
            if (item.id === data.downloadId) {
              return {
                ...item,
                status: 'completed',
                percent: 100,
                title: data.title || item.title,
                filePath: data.filePath,
                speed: null,
                eta: null
              };
            }
            return item;
          })
        );
      });

      const unsubError = window.electronAPI.onDownloadError((data) => {
        setDownloads((prev) =>
          prev.map((item) => {
            if (item.id === data.downloadId && item.status !== 'paused' && item.status !== 'cancelled') {
              return {
                ...item,
                status: 'error',
                error: data.error
              };
            }
            return item;
          })
        );
      });

      const unsubBinary = window.electronAPI.onBinaryDownloadProgress((progress) => {
        setBinaryProgress(progress);
      });

      return () => {
        unsubProgress?.();
        unsubComplete?.();
        unsubError?.();
        unsubBinary?.();
      };
    }
  }, []);

  // Submit URL from top bar (routes to Direct 16x, Torrent/Magnet, or Social Media)
  const handleSubmitUrl = async (targetUrl, kind = 'social') => {
    const inputUrl = (targetUrl || url).trim();
    if (!inputUrl) return;
    setError(null);

    // 1. Torrent / Magnet or Direct File -> Instant 16x Queue!
    if (kind === 'torrent' || kind === 'direct') {
      const downloadId = `dl-a2-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      let displayTitle = 'Direct Download';
      if (kind === 'torrent') {
        const dnMatch = inputUrl.match(/dn=([^&]+)/i);
        displayTitle = dnMatch
          ? decodeURIComponent(dnMatch[1].replace(/\+/g, ' '))
          : inputUrl.split(/[\\/]/).pop() || 'Magnet Torrent';
      } else {
        try {
          const p = new URL(inputUrl);
          displayTitle = decodeURIComponent(p.pathname.split('/').pop() || 'Direct File');
        } catch (e) {
          displayTitle = 'Direct File';
        }
      }

      const opts = {
        id: downloadId,
        url: inputUrl,
        title: displayTitle,
        outputDir: downloadPath,
        connections: 16
      };

      pendingOptionsRef.current.set(downloadId, opts);
      setDownloads((prev) => [
        {
          id: downloadId,
          url: inputUrl,
          title: displayTitle,
          category: kind === 'torrent' ? 'torrent' : 'file',
          engine: 'aria2',
          qualityLabel: kind === 'torrent' ? 'BitTorrent' : 'Direct 16x',
          status: 'queued',
          percent: 0,
          speed: 'Queued',
          connections: kind === 'torrent' ? null : 16,
          createdAt: new Date().toISOString()
        },
        ...prev
      ]);
      setSelectedId(downloadId);
      setUrl('');
      return;
    }

    // 2. Social Media / Video URL -> Fetch metadata & open Format Picker
    setIsLoading(true);
    setVideoInfo(null);
    setPlaylistData(null);

    try {
      if (inputUrl.includes('list=') && !inputUrl.includes('watch?v=')) {
        const pData = await window.electronAPI?.fetchPlaylist(inputUrl);
        if (pData && pData.entries && pData.entries.length > 0) {
          setPlaylistData(pData);
          setIsPlaylistModalOpen(true);
          setIsLoading(false);
          return;
        }
      }

      if (inputUrl.includes('list=')) {
        try {
          const pData = await window.electronAPI?.fetchPlaylist(inputUrl);
          if (pData && pData.entries && pData.entries.length > 0) {
            setPlaylistData(pData);
          }
        } catch (e) {}
      }

      const info = await window.electronAPI?.fetchMetadata(inputUrl);
      setVideoInfo(info);
      setIsMediaModalOpen(true);
    } catch (err) {
      setError(err.message || 'Could not analyze link. If this is a direct file link, switch mode to "Direct File (16x Turbo)".');
    } finally {
      setIsLoading(false);
    }
  };

  // Open .torrent file from disk
  const handleOpenTorrentFile = async () => {
    const filePath = await window.electronAPI?.selectTorrentFile();
    if (filePath) {
      handleSubmitUrl(filePath, 'torrent');
    }
  };

  // Start Social/Media download from MediaModal
  const handleStartMediaDownload = (options) => {
    const downloadId = `dl-yt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const fullOptions = { ...options, id: downloadId };

    pendingOptionsRef.current.set(downloadId, fullOptions);
    setDownloads((prev) => [
      {
        id: downloadId,
        url: options.url,
        title: options.title,
        thumbnail: options.thumbnail,
        isAudio: options.isAudio,
        category: options.isAudio ? 'audio' : 'video',
        engine: 'ytdlp',
        qualityLabel: options.qualityLabel,
        status: 'queued',
        percent: 0,
        speed: 'Queued',
        connections: 16,
        createdAt: new Date().toISOString()
      },
      ...prev
    ]);
    setSelectedId(downloadId);
    setUrl('');
  };

  // Queue playlist batch
  const handleQueuePlaylist = (batchConfig) => {
    const newItems = [];
    batchConfig.items.forEach((item, index) => {
      const downloadId = `dl-pl-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 5)}`;
      const itemOptions = {
        id: downloadId,
        url: item.url,
        title: item.title,
        isAudio: batchConfig.isAudio,
        formatSelector: batchConfig.formatSelector,
        audioFormat: batchConfig.audioFormat,
        audioQuality: batchConfig.audioQuality,
        outputDir: batchConfig.downloadPath
      };
      pendingOptionsRef.current.set(downloadId, itemOptions);
      newItems.push({
        id: downloadId,
        url: item.url,
        title: item.title,
        isAudio: batchConfig.isAudio,
        category: batchConfig.isAudio ? 'audio' : 'video',
        engine: 'ytdlp',
        qualityLabel: batchConfig.qualityLabel,
        status: 'queued',
        percent: 0,
        speed: 'Queued',
        connections: 16,
        createdAt: new Date().toISOString()
      });
    });
    setDownloads((prev) => [...newItems, ...prev]);
  };

  // Pause / Resume / Cancel
  const handlePause = async (id) => {
    await window.electronAPI?.pauseDownload(id);
    setDownloads((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'paused', speed: 'Paused' } : item))
    );
  };

  const handleResume = (id) => {
    if (!pendingOptionsRef.current.has(id)) return;
    setDownloads((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'queued', error: null, speed: 'Resuming...' } : item
      )
    );
  };

  const handlePauseAll = async () => {
    const active = downloads.filter((d) =>
      ['downloading', 'merging', 'converting', 'queued'].includes(d.status)
    );
    for (const item of active) {
      await window.electronAPI?.pauseDownload(item.id);
    }
    setDownloads((prev) =>
      prev.map((item) =>
        ['downloading', 'merging', 'converting', 'queued'].includes(item.status)
          ? { ...item, status: 'paused', speed: 'Paused' }
          : item
      )
    );
  };

  const handleResumeAll = () => {
    setDownloads((prev) =>
      prev.map((item) =>
        item.status === 'paused' && pendingOptionsRef.current.has(item.id)
          ? { ...item, status: 'queued', speed: 'Resuming...' }
          : item
      )
    );
  };

  const handleCancel = async (id) => {
    pendingOptionsRef.current.delete(id);
    await window.electronAPI?.cancelDownload(id);
    setDownloads((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'cancelled', speed: null } : item))
    );
  };

  const handleRemove = (id) => {
    pendingOptionsRef.current.delete(id);
    setDownloads((prev) => prev.filter((item) => item.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleClearCompleted = () => {
    setDownloads((prev) =>
      prev.filter((item) => !['completed', 'cancelled'].includes(item.status))
    );
  };

  const handleSelectFolder = async () => {
    const selected = await window.electronAPI?.selectFolder(downloadPath);
    if (selected) setDownloadPath(selected);
  };

  const handleRefreshBinaries = async () => {
    const status = await window.electronAPI?.downloadMissingBinaries();
    setBinaryStatus(status);
  };

  const handlePastePrompt = async () => {
    const text = await window.electronAPI?.clipboardReadText();
    if (text && typeof text === 'string') {
      setUrl(text.trim());
    }
  };

  // Filtered list for Sidebar & Search
  const filteredDownloads = useMemo(() => {
    return downloads.filter((item) => {
      if (activeCategory === 'active' && !['downloading', 'merging', 'converting', 'queued'].includes(item.status)) {
        return false;
      }
      if (activeCategory === 'completed' && item.status !== 'completed') return false;
      if (activeCategory === 'video' && item.category !== 'video') return false;
      if (activeCategory === 'audio' && item.category !== 'audio') return false;
      if (activeCategory === 'torrent' && item.category !== 'torrent') return false;
      if (activeCategory === 'file' && item.category !== 'file') return false;

      if (searchQuery.trim()) {
        return item.title.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [downloads, activeCategory, searchQuery]);

  // Live aggregate speed in MB/s
  const totalSpeedMB = useMemo(() => {
    return downloads
      .filter((d) => d.status === 'downloading')
      .reduce((acc, d) => acc + parseSpeedToMB(d.speed), 0);
  }, [downloads]);

  const hasActive = downloads.some((d) =>
    ['downloading', 'merging', 'converting', 'queued'].includes(d.status)
  );
  const hasPaused = downloads.some((d) => d.status === 'paused');

  return (
    <div className="h-full w-full bg-slate-50 text-slate-800 flex flex-col font-sans select-none overflow-hidden">
      {/* Top Custom Window Titlebar */}
      <TitleBar
        binaryStatus={binaryStatus}
        binaryProgress={binaryProgress}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Top FDM/IDM Action Toolbar & Quick Add Bar */}
      <AddUrlBar
        url={url}
        setUrl={setUrl}
        onSubmitUrl={handleSubmitUrl}
        onOpenTorrentFile={handleOpenTorrentFile}
        isLoading={isLoading}
        onPauseAll={handlePauseAll}
        onResumeAll={handleResumeAll}
        onClearCompleted={handleClearCompleted}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenFolder={() => window.electronAPI?.openFolder(downloadPath)}
        hasActive={hasActive}
        hasPaused={hasPaused}
      />

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="p-1 hover:bg-rose-100 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Mobile/Compact Category Tabs (visible when Sidebar is hidden on narrow windows) */}
      <div className="flex md:hidden items-center gap-1.5 px-3 py-2 bg-white border-b border-slate-200 overflow-x-auto shrink-0">
        {[
          { id: 'all', label: 'All' },
          { id: 'active', label: 'Active' },
          { id: 'completed', label: 'Done' },
          { id: 'video', label: 'Video' },
          { id: 'audio', label: 'Audio' },
          { id: 'torrent', label: 'Torrents' },
          { id: 'file', label: 'Files' }
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition ${
              activeCategory === cat.id
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Split FDM/IDM Workspace */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <Sidebar
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          downloads={downloads}
          totalSpeedMB={totalSpeedMB}
        />

        <DownloadTable
          items={filteredDownloads}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onPause={handlePause}
          onResume={handleResume}
          onCancel={handleCancel}
          onOpenFile={(p) => window.electronAPI?.openFile(p)}
          onOpenFolder={(p) => window.electronAPI?.openFolder(p)}
          onRemove={handleRemove}
          onPastePrompt={handlePastePrompt}
        />
      </div>

      {/* Social/Video Format Picker Modal */}
      <MediaModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        videoInfo={videoInfo}
        playlistData={playlistData}
        onOpenPlaylist={() => {
          setIsMediaModalOpen(false);
          setIsPlaylistModalOpen(true);
        }}
        downloadPath={downloadPath}
        onSelectDownloadPath={handleSelectFolder}
        onStartDownload={handleStartMediaDownload}
      />

      {/* Playlist Batch Modal */}
      <PlaylistModal
        isOpen={isPlaylistModalOpen}
        playlistData={playlistData}
        downloadPath={downloadPath}
        onClose={() => setIsPlaylistModalOpen(false)}
        onQueuePlaylist={handleQueuePlaylist}
      />

      {/* App Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        binaryStatus={binaryStatus}
        binaryProgress={binaryProgress}
        onRefreshBinaries={handleRefreshBinaries}
        downloadPath={downloadPath}
        onSelectDownloadPath={handleSelectFolder}
        maxConcurrent={maxConcurrent}
        setMaxConcurrent={setMaxConcurrent}
      />
    </div>
  );
}
