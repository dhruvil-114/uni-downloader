import React from 'react';
import {
  Download,
  CheckCircle,
  AlertCircle,
  XCircle,
  Folder,
  Play,
  Film,
  Music,
  Trash2,
  RefreshCw
} from 'lucide-react';

export default function DownloadItem({ item, onCancel, onOpenFile, onOpenFolder, onRemove }) {
  const isDownloading = item.status === 'downloading' || item.status === 'merging' || item.status === 'converting';
  const isCompleted = item.status === 'completed';
  const isError = item.status === 'error';
  const isCancelled = item.status === 'cancelled';

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 backdrop-blur-sm transition-all hover:border-slate-700/80 shadow-md">
      <div className="flex items-start gap-3.5">
        {/* Thumbnail or Media icon */}
        <div className="relative w-20 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-950 border border-slate-800 flex items-center justify-center">
          {item.thumbnail ? (
            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
          ) : item.isAudio ? (
            <Music className="w-6 h-6 text-amber-400" />
          ) : (
            <Film className="w-6 h-6 text-red-400" />
          )}

          {/* Type Badge */}
          <div className="absolute top-1 left-1">
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-black/80 text-white uppercase backdrop-blur-sm">
              {item.isAudio ? 'Audio' : 'Video'}
            </span>
          </div>
        </div>

        {/* Info & Progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-semibold text-white truncate max-w-md" title={item.title}>
              {item.title}
            </h4>

            {/* Quality pill */}
            <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
              {item.qualityLabel}
            </span>
          </div>

          {/* Progress Bar for downloading */}
          {isDownloading && (
            <div className="mt-2 space-y-1.5">
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 rounded-full transition-all duration-300 relative shadow-sm"
                  style={{ width: `${Math.min(Math.max(item.percent || 0, 0), 100)}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>

              {/* Progress metrics */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <div className="flex items-center space-x-2">
                  <span className="text-red-400 font-bold">{Math.round(item.percent || 0)}%</span>
                  {item.speed && (
                    <>
                      <span>•</span>
                      <span>{item.speed}</span>
                    </>
                  )}
                  {item.totalSize && (
                    <>
                      <span>•</span>
                      <span>{item.totalSize}</span>
                    </>
                  )}
                </div>

                {item.eta && (
                  <span className="text-slate-400">
                    ETA: <span className="text-slate-200">{item.eta}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Completed State */}
          {isCompleted && (
            <div className="mt-2 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1.5 text-emerald-400 font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Downloaded Successfully</span>
              </div>

              <div className="flex items-center space-x-2">
                {item.filePath && (
                  <>
                    <button
                      onClick={() => onOpenFile(item.filePath)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-red-600/10 text-red-400 hover:bg-red-600/20 border border-red-500/20 transition"
                      title="Play or open downloaded file"
                    >
                      <Play className="w-3 h-3" />
                      <span>Open File</span>
                    </button>

                    <button
                      onClick={() => onOpenFolder(item.filePath)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                      title="Show in Windows File Explorer"
                    >
                      <Folder className="w-3 h-3" />
                      <span>Folder</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => onRemove(item.id)}
                  className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition"
                  title="Remove from list"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Cancelled State */}
          {isCancelled && (
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center space-x-1.5">
                <XCircle className="w-3.5 h-3.5" />
                <span>Download Cancelled</span>
              </div>
              <button
                onClick={() => onRemove(item.id)}
                className="p-1 rounded text-slate-500 hover:text-slate-300 transition"
                title="Remove"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="mt-2 flex items-center justify-between text-xs text-rose-400">
              <div className="flex items-center space-x-1.5 truncate max-w-sm" title={item.error}>
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.error || 'Download failed'}</span>
              </div>
              <button
                onClick={() => onRemove(item.id)}
                className="p-1 rounded text-slate-500 hover:text-slate-300 transition"
                title="Remove"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Cancel Button during download */}
        {isDownloading && (
          <button
            onClick={() => onCancel(item.id)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition self-center"
            title="Cancel Download"
          >
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
