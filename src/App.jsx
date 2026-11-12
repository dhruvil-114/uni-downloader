import React, { useState, useEffect, useRef } from 'react';
import TitleBar from './components/TitleBar';
import UrlInput from './components/UrlInput';
import VideoPreview from './components/VideoPreview';
import FormatSelector from './components/FormatSelector';
import DownloadItem from './components/DownloadItem';
import PlaylistModal from './components/PlaylistModal';
import SettingsModal from './components/SettingsModal';
import {
  DownloadCloud,
  ListOrdered,
  FolderOpen,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';

const MAX_CONCURRENT_DOWNLOADS = 2;

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
  const [viewTab, setViewTab] = useState('new'); // 'new' | 'queue'
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Queue references
  const pendingOptionsRef = useRef(new Map());

  // Concurrency Queue Runner
  useEffect(() => {
    const activeTasks = downloads.filter(
      (d) => d.status === 'downloading' || d.status === 'merging' || d.status === 'converting'
    );
    const queuedTasks = downloads.filter((d) => d.status === 'queued');

    if (activeTasks.length < MAX_CONCURRENT_DOWNLOADS && queuedTasks.length > 0) {
      const nextTask = queuedTasks[0];
      const taskOptions = pendingOptionsRef.current.get(nextTask.id);

      if (taskOptions && window.electronAPI) {
        setDownloads((prev) =>
          prev.map((item) =>
            item.id === nextTask.id
              ? { ...item, status: 'downloading', speed: 'Starting...' }
              : item
          )
        );

        window.electronAPI.startDownload(taskOptions).catch((err) => {
          setDownloads((prev) =>
            prev.map((item) =>
              item.id === nextTask.id ? { ...item, status: 'error', error: err.message } : item
            )
          );
        });
      }
    }
  }, [downloads]);

  // Initialize download directory and binary checks
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

    // Setup event listeners from Electron IPC
    if (window.electronAPI) {
      const unsubProgress = window.electronAPI.onDownloadProgress((data) => {
        setDownloads((prev) =>
          prev.map((item) => {
            if (item.id === data.downloadId) {
              return {
                ...item,
                percent: data.percent,
                totalSize: data.totalSize || item.totalSize,
                speed: data.speed || item.speed,
                eta: data.eta || item.eta,
                status: data.status || 'downloading'
              };
            }
            return item;
          })
        );
      });

      const unsubComplete = window.electronAPI.onDownloadComplete((data) => {
        pendingOptionsRef.current.delete(data.downloadId);
        setDownloads((prev) =>
          prev.map((item) => {
            if (item.id === data.downloadId) {
              return {
                ...item,
                status: 'completed',
                percent: 100,
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
        pendingOptionsRef.current.delete(data.downloadId);
        setDownloads((prev) =>
          prev.map((item) => {
            if (item.id === data.downloadId) {
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

  // Fetch video or playlist metadata
  const handleFetchMetadata = async (targetUrl) => {
    const inputUrl = targetUrl || url;
    if (!inputUrl) return;

    setIsLoading(true);
    setError(null);
    setVideoInfo(null);
    setPlaylistData(null);

    try {
      // 1. Pure playlist URL check: avoid running single-video extraction if it's purely a playlist
      if (inputUrl.includes('list=') && !inputUrl.includes('watch?v=')) {
        const pData = await window.electronAPI?.fetchPlaylist(inputUrl);
        if (pData && pData.entries && pData.entries.length > 0) {
          setPlaylistData(pData);
          setIsPlaylistModalOpen(true);
          setIsLoading(false);
          return;
        }
      }

      // 2. Video with playlist or standard single video
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
    } catch (err) {
      setError(err.message || 'Failed to analyze video URL. Please check the link and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Change download destination
  const handleSelectFolder = async () => {
    try {
      const selected = await window.electronAPI?.selectFolder(downloadPath);
      if (selected) {
        setDownloadPath(selected);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Start download for single video/audio
  const handleStartDownload = async (options) => {
    const downloadId = `dl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const fullOptions = { ...options, id: downloadId };

    const activeTasks = downloads.filter(
      (d) => d.status === 'downloading' || d.status === 'merging' || d.status === 'converting'
    );
    const shouldQueue = activeTasks.length >= MAX_CONCURRENT_DOWNLOADS;

    const newDownload = {
      id: downloadId,
      url: options.url,
      title: options.title,
      thumbnail: options.thumbnail,
      isAudio: options.isAudio,
      qualityLabel: options.qualityLabel,
      status: shouldQueue ? 'queued' : 'downloading',
      percent: 0,
      speed: shouldQueue ? 'In Queue' : 'Starting...',
      totalSize: 'Calculating...',
      eta: '...',
      createdAt: new Date().toISOString()
    };

    pendingOptionsRef.current.set(downloadId, fullOptions);
    setDownloads((prev) => [newDownload, ...prev]);
    setViewTab('queue');

    if (!shouldQueue && window.electronAPI) {
      try {
        await window.electronAPI.startDownload(fullOptions);
      } catch (err) {
        setDownloads((prev) =>
          prev.map((item) =>
            item.id === downloadId ? { ...item, status: 'error', error: err.message } : item
          )
        );
      }
    }
  };

  // Queue playlist batch with concurrency management
  const handleQueuePlaylist = (batchConfig) => {
    setViewTab('queue');
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
        thumbnail: null,
        isAudio: batchConfig.isAudio,
        qualityLabel: batchConfig.qualityLabel,
        status: 'queued',
        percent: 0,
        speed: 'In Queue',
        totalSize: '',
        eta: '',
        createdAt: new Date().toISOString()
      });
    });

    setDownloads((prev) => [...newItems, ...prev]);
  };

  // Cancel download
  const handleCancelDownload = async (id) => {
    pendingOptionsRef.current.delete(id);
    await window.electronAPI?.cancelDownload(id);
    setDownloads((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'cancelled' } : item))
    );
  };

  // Open completed file or folder
  const handleOpenFile = async (filePath) => {
    await window.electronAPI?.openFile(filePath);
  };

  const handleOpenFolder = async (filePath) => {
    await window.electronAPI?.openFolder(filePath);
  };

  // Remove download item
  const handleRemoveDownload = (id) => {
    pendingOptionsRef.current.delete(id);
    setDownloads((prev) => prev.filter((item) => item.id !== id));
  };

  // Refresh binaries
  const handleRefreshBinaries = async () => {
    const status = await window.electronAPI?.downloadMissingBinaries();
    setBinaryStatus(status);
  };

  const activeCount = downloads.filter(
    (d) => d.status === 'downloading' || d.status === 'merging' || d.status === 'converting'
  ).length;

  return (
    <div className="h-full w-full bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      {/* Frameless Titlebar */}
      <TitleBar
        binaryStatus={binaryStatus}
        binaryProgress={binaryProgress}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 sm:px-6 md:px-8 py-4 sm:py-6 max-w-5xl mx-auto w-full flex flex-col space-y-5">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewTab('new')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                viewTab === 'new'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <DownloadCloud className="w-4 h-4" />
              <span>New Download</span>
            </button>

            <button
              onClick={() => setViewTab('queue')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition relative ${
                viewTab === 'queue'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ListOrdered className="w-4 h-4" />
              <span>Downloads Queue</span>
              {downloads.length > 0 && (
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-white font-mono">
                  {downloads.length}
                </span>
              )}
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <button
              onClick={() => window.electronAPI?.openFolder(downloadPath)}
              className="flex items-center space-x-1 hover:text-white transition px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800"
              title="Open downloads directory"
            >
              <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Open Downloads</span>
            </button>
          </div>
        </div>

        {/* View: New Download */}
        {viewTab === 'new' && (
          <div className="flex flex-col space-y-6">
            <div className="space-y-2">
              <UrlInput
                url={url}
                setUrl={setUrl}
                onFetch={handleFetchMetadata}
                isLoading={isLoading}
              />
              <p className="text-[11px] text-slate-500 text-center">
                Universal Downloader: Instagram Reels, Snapchat, YouTube, TikTok, Twitter/X, Dailymotion & 1000+ sites
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-300 text-xs flex items-center space-x-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {videoInfo && (
              <VideoPreview
                videoInfo={videoInfo}
                isPlaylist={Boolean(playlistData)}
                onOpenPlaylist={() => setIsPlaylistModalOpen(true)}
              />
            )}

            {videoInfo && (
              <FormatSelector
                videoInfo={videoInfo}
                downloadPath={downloadPath}
                onSelectDownloadPath={handleSelectFolder}
                onStartDownload={handleStartDownload}
                isDownloading={isLoading}
              />
            )}

            {!videoInfo && !isLoading && (
              <div className="flex flex-col items-center justify-center p-12 rounded-2xl border border-dashed border-slate-800/80 bg-slate-900/20 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 border border-slate-700/60 flex items-center justify-center text-red-500 shadow-md">
                  <DownloadCloud className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-200">
                  Ready to download from anywhere
                </h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Simply copy any link from Instagram, Snapchat, YouTube, TikTok, Twitter/X, Dailymotion, or Facebook and click "Paste" above.
                </p>
              </div>
            )}
          </div>
        )}

        {/* View: Downloads Queue & History */}
        {viewTab === 'queue' && (
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Active & Completed Tasks</h3>
                <p className="text-xs text-slate-400">
                  {downloads.length === 0
                    ? 'No downloads in progress'
                    : `${downloads.length} tasks recorded (${activeCount} active)`}
                </p>
              </div>

              {downloads.length > 0 && (
                <button
                  onClick={() => setDownloads([])}
                  className="text-xs text-slate-400 hover:text-rose-400 transition"
                >
                  Clear All
                </button>
              )}
            </div>

            {downloads.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 space-y-2">
                <p className="text-xs text-slate-400">No active or past downloads yet.</p>
                <button
                  onClick={() => setViewTab('new')}
                  className="text-xs text-red-400 font-bold hover:underline inline-flex items-center space-x-1"
                >
                  <span>Start your first download</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {downloads.map((item) => (
                  <DownloadItem
                    key={item.id}
                    item={item}
                    onCancel={handleCancelDownload}
                    onOpenFile={handleOpenFile}
                    onOpenFolder={handleOpenFolder}
                    onRemove={handleRemoveDownload}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

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
      />
    </div>
  );
}
