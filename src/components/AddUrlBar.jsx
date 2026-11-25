import React, { useState, useEffect } from 'react';
import {
  Link2,
  Clipboard,
  X,
  Loader2,
  Download,
  Magnet,
  Play,
  Pause,
  Trash2,
  FolderOpen,
  Search
} from 'lucide-react';

export default function AddUrlBar({
  url,
  setUrl,
  onSubmitUrl,
  onOpenTorrentFile,
  isLoading,
  onPauseAll,
  onResumeAll,
  onClearCompleted,
  searchQuery,
  setSearchQuery,
  onOpenFolder,
  hasActive,
  hasPaused
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [detectedKind, setDetectedKind] = useState(null);
  const [forceMode, setForceMode] = useState('auto'); // 'auto' | 'social' | 'direct'

  useEffect(() => {
    let cancelled = false;
    async function classify() {
      const trimmed = url.trim();
      if (!trimmed) {
        setDetectedKind(null);
        return;
      }
      if (window.electronAPI?.detectLinkType) {
        const res = await window.electronAPI.detectLinkType(trimmed);
        if (!cancelled) setDetectedKind(res);
      }
    }
    classify();
    return () => { cancelled = true; };
  }, [url]);

  const handlePaste = async () => {
    try {
      const text = await window.electronAPI?.clipboardReadText();
      if (text && typeof text === 'string') {
        const cleaned = text.trim();
        setUrl(cleaned);
      }
    } catch (e) {}
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && url.trim() && !isLoading) {
      onSubmitUrl(url.trim(), forceMode === 'auto' ? detectedKind?.kind : forceMode);
    }
  };

  const effectiveKind = forceMode === 'auto' ? (detectedKind?.kind || 'social') : forceMode;

  return (
    <div className="bg-white border-b border-slate-200 px-3 sm:px-5 py-3 space-y-2.5 shrink-0">
      {/* Row 1: IDM / FDM Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={onOpenTorrentFile}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
            title="Open a .torrent file from your PC"
          >
            <Magnet className="w-3.5 h-3.5 text-indigo-600" />
            <span>Open .torrent</span>
          </button>

          <button
            onClick={onResumeAll}
            disabled={!hasPaused}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
              hasPaused
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                : 'bg-slate-50 text-slate-400 border-slate-200/70 cursor-not-allowed'
            }`}
            title="Resume all paused downloads"
          >
            <Play className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Resume All</span>
          </button>

          <button
            onClick={onPauseAll}
            disabled={!hasActive}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
              hasActive
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                : 'bg-slate-50 text-slate-400 border-slate-200/70 cursor-not-allowed'
            }`}
            title="Pause all active downloads"
          >
            <Pause className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Pause All</span>
          </button>

          <button
            onClick={onClearCompleted}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition"
            title="Remove completed items from list"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Clear Done</span>
          </button>
        </div>

        {/* Right: Filter & Open Folder */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter downloads..."
              className="w-36 sm:w-44 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>

          <button
            onClick={onOpenFolder}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
            title="Open Download Folder"
          >
            <FolderOpen className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Folder</span>
          </button>
        </div>
      </div>

      {/* Row 2: Universal Quick-Add URL / Magnet Bar */}
      <div
        className={`flex flex-wrap sm:flex-nowrap items-center gap-2 bg-slate-50 rounded-xl px-3 py-1.5 border transition-all ${
          isFocused
            ? 'bg-white border-indigo-600 ring-2 ring-indigo-500/15'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <Link2 className="w-4 h-4 text-indigo-600 shrink-0" />

        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="Paste ANY link: YouTube, Instagram, Snapchat, Magnet/Torrent, or Direct File (.zip, .iso, .exe, .pdf)..."
          className="min-w-0 flex-1 bg-transparent text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none py-1"
        />

        {/* Mode selector / Auto badge */}
        {url.trim() && (
          <select
            value={forceMode}
            onChange={(e) => setForceMode(e.target.value)}
            className="text-[11px] font-semibold bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none shrink-0"
            title="Choose download engine"
          >
            <option value="auto">
              Auto ({detectedKind?.label || 'Detecting'})
            </option>
            <option value="social">Social / Video (yt-dlp)</option>
            <option value="direct">Direct File (16x Turbo)</option>
          </select>
        )}

        <div className="flex items-center space-x-1.5 shrink-0">
          {url && (
            <button
              onClick={() => setUrl('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
              title="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handlePaste}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm transition"
          >
            <Clipboard className="w-3.5 h-3.5 text-slate-400" />
            <span>Paste</span>
          </button>

          <button
            onClick={() => onSubmitUrl(url.trim(), effectiveKind)}
            disabled={!url.trim() || isLoading}
            className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm ${
              !url.trim() || isLoading
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.98]'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>
                  {effectiveKind === 'torrent'
                    ? 'Download Torrent'
                    : effectiveKind === 'direct'
                    ? 'Download 16x'
                    : 'Get Video / Audio'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
