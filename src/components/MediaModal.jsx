import React from 'react';
import { X } from 'lucide-react';
import VideoPreview from './VideoPreview';
import FormatSelector from './FormatSelector';

export default function MediaModal({
  isOpen,
  onClose,
  videoInfo,
  playlistData,
  onOpenPlaylist,
  downloadPath,
  onSelectDownloadPath,
  onStartDownload
}) {
  if (!isOpen || !videoInfo) return null;

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-4xl bg-slate-50 border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-slate-900">
              Select Format & Quality
            </span>
            {videoInfo.platform && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                {videoInfo.platform.name}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <VideoPreview
            videoInfo={videoInfo}
            isPlaylist={Boolean(playlistData)}
            onOpenPlaylist={onOpenPlaylist}
          />

          <FormatSelector
            videoInfo={videoInfo}
            downloadPath={downloadPath}
            onSelectDownloadPath={onSelectDownloadPath}
            onStartDownload={(opts) => {
              onStartDownload(opts);
              onClose();
            }}
            isDownloading={false}
          />
        </div>
      </div>
    </div>
  );
}
