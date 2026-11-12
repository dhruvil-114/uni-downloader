import React from 'react';
import {
  Download,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Folder,
  Play,
  Film,
  Music,
  Trash2
} from 'lucide-react';

export default function DownloadItem({ item, onCancel, onOpenFile, onOpenFolder, onRemove }) {
  const isDownloading = item.status === 'downloading' || item.status === 'merging' || item.status === 'converting';
  const isCompleted = item.status === 'completed';
  const isError = item.status === 'error';
  const isCancelled = item.status === 'cancelled';

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-sm hover:border-slate-300 transition-all">
      <div className="flex items-start gap-3.5">
        {/* Thumbnail or Media icon */}
        <div className="relative w-20 h-14 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-slate-200 flex items-center justify-center">
          {item.thumbnail ? (
            <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
          ) : item.isAudio ? (
            <Music className="w-6 h-6 text-amber-500" />
          ) : (
            <Film className="w-6 h-6 text-indigo-500" />
          )}

          {/* Type Badge */}
          <div className="absolute top-1 left-1">
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-900/80 text-white uppercase backdrop-blur-sm">
              {item.isAudio ? 'Audio' : 'Video'}
            </span>
          </div>
        </div>

        {/* Info & Progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-semibold text-slate-900 truncate max-w-md" title={item.title}>
              {item.title}
            </h4>

            {/* Quality pill */}
            <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
              {item.qualityLabel}
            </span>
          </div>

          {/* Progress Bar for downloading */}
          {isDownloading && (
            <div className="mt-2.5 space-y-1.5">
              <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden relative border border-slate-200/60">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-200"
                  style={{ width: `${Math.min(Math.max(item.percent || 0, 0), 100)}%` }}
                />
              </div>

              {/* Progress metrics */}
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <div className="flex items-center space-x-2">
                  <span className="text-indigo-600 font-bold">{Math.round(item.percent || 0)}%</span>
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
                  <span>
                    ETA: <span className="text-slate-700 font-semibold">{item.eta}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Completed State */}
          {isCompleted && (
            <div className="mt-2 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1.5 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Download Complete</span>
              </div>

              <div className="flex items-center space-x-2">
                {item.filePath && (
                  <>
                    <button
                      onClick={() => onOpenFile(item.filePath)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition"
                      title="Play or open file"
                    >
                      <Play className="w-3 h-3" />
                      <span>Open File</span>
                    </button>

                    <button
                      onClick={() => onOpenFolder(item.filePath)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 transition"
                      title="Show in File Explorer"
                    >
                      <Folder className="w-3 h-3 text-slate-400" />
                      <span>Folder</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => onRemove(item.id)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
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
                <XCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Cancelled</span>
              </div>
              <button
                onClick={() => onRemove(item.id)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition"
                title="Remove"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="mt-2 flex items-center justify-between text-xs text-rose-600">
              <div className="flex items-center space-x-1.5 truncate max-w-sm" title={item.error}>
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{item.error || 'Download failed'}</span>
              </div>
              <button
                onClick={() => onRemove(item.id)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition"
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
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition self-center"
            title="Cancel Download"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
