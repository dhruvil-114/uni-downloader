import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, RefreshCw, Folder, Cpu, HardDrive, ShieldCheck } from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  binaryStatus,
  binaryProgress,
  onRefreshBinaries,
  downloadPath,
  onSelectDownloadPath
}) {
  if (!isOpen) return null;

  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await onRefreshBinaries();
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <Cpu className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-bold text-white">App Settings & Engine Status</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs">
          {/* Engine Status Card */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                Underlying Engines
              </span>
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex items-center space-x-1 text-red-400 hover:text-red-300 transition text-[11px]"
              >
                <RefreshCw className={`w-3 h-3 ${isUpdating ? 'animate-spin' : ''}`} />
                <span>Check / Download</span>
              </button>
            </div>

            {/* yt-dlp item */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-white">yt-dlp Core Downloader</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  {binaryStatus?.ytDlp?.available
                    ? `Installed: ${binaryStatus.ytDlp.version || 'Ready'}`
                    : 'Missing or downloading...'}
                </p>
              </div>
              <div>
                {binaryStatus?.ytDlp?.available ? (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                    <CheckCircle className="w-3 h-3" />
                    <span>Active</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
                    <AlertCircle className="w-3 h-3" />
                    <span>Pending</span>
                  </span>
                )}
              </div>
            </div>

            {/* ffmpeg item */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-bold text-white">FFmpeg (Audio & 4K Stream Merger)</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  {binaryStatus?.ffmpeg?.available
                    ? `Ready (${binaryStatus.ffmpeg.version?.split(' ')[2] || 'Installed'})`
                    : 'Missing or installing via system/winget...'}
                </p>
              </div>
              <div>
                {binaryStatus?.ffmpeg?.available ? (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                    <CheckCircle className="w-3 h-3" />
                    <span>Active</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-semibold">
                    <AlertCircle className="w-3 h-3" />
                    <span>Installing</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Download Location Setting */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
              Default Download Location
            </span>
            <div className="flex items-center space-x-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <Folder className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-slate-200 truncate flex-1 text-xs" title={downloadPath}>
                {downloadPath}
              </span>
              <button
                onClick={onSelectDownloadPath}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition shrink-0"
              >
                Browse
              </button>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-start space-x-2.5 text-slate-400 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              StreamVault runs 100% locally on your machine. No telemetry, no external conversion servers, and no ads.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
