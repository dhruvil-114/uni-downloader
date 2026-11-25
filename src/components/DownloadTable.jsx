import React from 'react';
import {
  Film,
  Music,
  Magnet,
  FileArchive,
  Pause,
  Play,
  Folder,
  ExternalLink,
  Trash2,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Zap,
  ArrowDownToLine,
  Clock,
  HardDrive
} from 'lucide-react';

function parseSizeToBytes(str) {
  if (!str || typeof str !== 'string') return 0;
  const m = str.trim().match(/([\d\.]+)\s*([KMGT]?i?B)/i);
  if (!m) return 0;
  const val = parseFloat(m[1]);
  const unit = m[2].toUpperCase();
  if (unit.startsWith('G')) return val * 1024 * 1024 * 1024;
  if (unit.startsWith('M')) return val * 1024 * 1024;
  if (unit.startsWith('K')) return val * 1024;
  return val;
}

function formatBytesReadable(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${Math.round(bytes)} B`;
}

function getRemainingText(item) {
  if (item.status === 'completed') return '0 B left';
  const total = parseSizeToBytes(item.totalSize);
  if (!total) return null;

  let done = parseSizeToBytes(item.downloadedSize);
  if (!done && item.percent > 0) {
    done = (total * item.percent) / 100;
  }
  const rem = Math.max(total - done, 0);
  return `${formatBytesReadable(rem)} left`;
}

function getDownloadedText(item, isCompleted) {
  if (item.downloadedSize) return item.downloadedSize;
  if (isCompleted) return item.totalSize || 'Done';
  const total = parseSizeToBytes(item.totalSize);
  if (total && item.percent > 0) {
    return formatBytesReadable((total * item.percent) / 100);
  }
  return '0 MB';
}

export default function DownloadTable({
  items,
  selectedId,
  onSelect,
  onPause,
  onResume,
  onCancel,
  onOpenFile,
  onOpenFolder,
  onRemove,
  onPastePrompt
}) {
  const selectedItem = items.find((i) => i.id === selectedId) || null;

  const getIcon = (item) => {
    if (item.category === 'torrent') return <Magnet className="w-5 h-5 text-purple-600" />;
    if (item.category === 'audio' || item.isAudio) return <Music className="w-5 h-5 text-amber-600" />;
    if (item.category === 'file') return <FileArchive className="w-5 h-5 text-emerald-600" />;
    return <Film className="w-5 h-5 text-indigo-600" />;
  };

  if (items.length === 0) {
    return (
      <div className="flex-1 min-w-0 flex flex-col items-center justify-center p-8 text-center bg-slate-50/70">
        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-indigo-600 mb-3">
          <ArrowDownToLine className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">
          Your Download Queue is Empty
        </h3>
        <p className="text-xs text-slate-500 max-w-md mt-1 leading-relaxed">
          Paste any link above — <b>YouTube, Instagram, Snapchat, TikTok, Dailymotion</b>, <b>Magnet / .torrent</b>, or <b>Direct File (.zip, .iso, .exe, .pdf)</b> for 16x turbo speed.
        </p>
        <button
          onClick={onPastePrompt}
          className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 shadow-sm transition"
        >
          Paste Link from Clipboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-0 bg-slate-50/60 overflow-hidden">
      {/* Top Queue Summary Header */}
      <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">
        <span>Active & Queued Transfers ({items.length})</span>
        <span className="hidden sm:inline">Multi-Thread Visual Monitor</span>
      </div>

      {/* Scrollable Transfer Cards */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-2.5">
        {items.map((item) => {
          const isSelected = item.id === selectedId;
          const isActive = ['downloading', 'merging', 'converting'].includes(item.status);
          const isPaused = item.status === 'paused';
          const isQueued = item.status === 'queued';
          const isCompleted = item.status === 'completed';
          const isError = item.status === 'error';
          const isCancelled = item.status === 'cancelled';

          const percent = isCompleted ? 100 : Math.min(Math.max(item.percent || 0, 0), 100);
          const remainingText = getRemainingText(item);

          return (
            <div
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`w-full rounded-xl border p-3.5 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white border-indigo-400 ring-2 ring-indigo-500/10 shadow-sm'
                  : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
              }`}
            >
              {/* Top Row: Icon + Title + Badges + Action Buttons */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 overflow-hidden">
                    {item.thumbnail ? (
                      <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getIcon(item)
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate" title={item.title}>
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/80 font-medium text-slate-700">
                        {item.qualityLabel || 'File'}
                      </span>

                      {item.connections && isActive && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200/70 text-indigo-700 font-semibold">
                          <Zap className="w-3 h-3" />
                          <span>{item.connections}x Threads</span>
                        </span>
                      )}

                      {item.seeders !== undefined && item.seeders !== null && isActive && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-700 font-medium">
                          {item.seeders} Seeders
                        </span>
                      )}

                      {isCompleted && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Completed</span>
                        </span>
                      )}

                      {isPaused && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 font-semibold">
                          Paused
                        </span>
                      )}

                      {isQueued && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 font-medium">
                          Waiting in Queue...
                        </span>
                      )}

                      {isError && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 font-medium max-w-xs truncate" title={item.error}>
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span className="truncate">{item.error || 'Failed'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div
                  className="flex items-center space-x-1.5 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isActive && (
                    <button
                      onClick={() => onPause(item.id)}
                      className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition"
                      title="Pause download"
                    >
                      <Pause className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Pause</span>
                    </button>
                  )}

                  {(isPaused || isError) && (
                    <button
                      onClick={() => onResume(item.id)}
                      className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                      title="Resume download"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Resume</span>
                    </button>
                  )}

                  {isCompleted && item.filePath && (
                    <>
                      <button
                        onClick={() => onOpenFile(item.filePath)}
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition"
                        title="Open file"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Open</span>
                      </button>
                      <button
                        onClick={() => onOpenFolder(item.filePath)}
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
                        title="Show in folder"
                      >
                        <Folder className="w-3.5 h-3.5 text-slate-500" />
                        <span className="hidden sm:inline">Folder</span>
                      </button>
                    </>
                  )}

                  {(isActive || isQueued) ? (
                    <button
                      onClick={() => onCancel(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
                      title="Cancel"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onRemove(item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
                      title="Remove from list"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Middle Row: Unique Segmented Multi-Thread Progress Bar */}
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-3 rounded-full bg-slate-100 border border-slate-200/80 overflow-hidden relative">
                  {/* Filled Progress */}
                  <div
                    className={`h-full rounded-full transition-all duration-300 relative ${
                      isCompleted
                        ? 'bg-emerald-500'
                        : isError
                        ? 'bg-rose-500'
                        : isPaused
                        ? 'bg-amber-400'
                        : 'bg-indigo-600'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                  {/* Subtle 16-segment visual grid overlay for IDM/FDM look */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-25"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(90deg, transparent, transparent 6%, rgba(255,255,255,0.7) 6%, rgba(255,255,255,0.7) 6.5%)'
                    }}
                  />
                </div>

                <span
                  className={`text-xs font-bold w-12 text-right tabular-nums ${
                    isCompleted
                      ? 'text-emerald-600'
                      : isError
                      ? 'text-rose-600'
                      : isPaused
                      ? 'text-amber-600'
                      : 'text-indigo-700'
                  }`}
                >
                  {percent.toFixed(1).replace(/\.0$/, '')}%
                </span>
              </div>

              {/* Bottom Row: Clear Metrics (Downloaded / Total | Remaining | Speed | ETA) */}
              <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600">
                  <span className="inline-flex items-center space-x-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Downloaded:{' '}
                      <b className="text-slate-900">
                        {getDownloadedText(item, isCompleted)}
                      </b>
                      {item.totalSize && (
                        <span className="text-slate-400"> / {item.totalSize}</span>
                      )}
                    </span>
                  </span>

                  {remainingText && !isCompleted && (
                    <span className="text-slate-500">
                      Remaining: <b className="text-slate-800">{remainingText}</b>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-x-4">
                  {isActive && (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold">
                      <span>{item.speed || 'Starting...'}</span>
                    </span>
                  )}

                  {isActive && item.eta && (
                    <span className="inline-flex items-center space-x-1 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        ETA: <b className="text-slate-900">{item.eta}</b>
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom FDM/IDM Inspector Strip (strictly min-w-0 so long URLs never overflow!) */}
      {selectedItem && (
        <div className="bg-white border-t border-slate-200 px-4 py-2 text-[11px] text-slate-600 flex items-center justify-between gap-4 shrink-0 min-w-0">
          <div className="flex items-center space-x-2 min-w-0 flex-1 overflow-hidden">
            <span className="font-semibold text-slate-800 shrink-0">URL:</span>
            <span className="truncate text-slate-500 block" title={selectedItem.url}>
              {selectedItem.url}
            </span>
          </div>
          <div className="flex items-center space-x-3 shrink-0 text-slate-500">
            <span>
              Engine:{' '}
              <b className="text-slate-800">
                {selectedItem.engine === 'aria2' ? 'aria2c (16x)' : 'yt-dlp (16x)'}
              </b>
            </span>
            {selectedItem.filePath && (
              <button
                onClick={() => onOpenFolder(selectedItem.filePath)}
                className="text-indigo-600 hover:underline font-semibold"
              >
                Show in Explorer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
