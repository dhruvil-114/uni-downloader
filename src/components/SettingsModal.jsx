import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, RefreshCw, Folder, Cpu, ShieldCheck } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <Cpu className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-900">Application Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs">
          {/* Engine Status Card */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
                Underlying Engines
              </span>
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 transition text-[11px] font-medium"
              >
                <RefreshCw className={`w-3 h-3 ${isUpdating ? 'animate-spin' : ''}`} />
                <span>Check Status</span>
              </button>
            </div>

            {/* yt-dlp item */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">yt-dlp Core Downloader</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  {binaryStatus?.ytDlp?.available
                    ? `Installed: ${binaryStatus.ytDlp.version || 'Ready'}`
                    : 'Setting up...'}
                </p>
              </div>
              <div>
                {binaryStatus?.ytDlp?.available ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Active</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Pending</span>
                  </span>
                )}
              </div>
            </div>

            {/* ffmpeg item */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-900">FFmpeg (Stream Merger & MP3)</p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  {binaryStatus?.ffmpeg?.available
                    ? `Ready (${binaryStatus.ffmpeg.version?.split(' ')[2] || 'Installed'})`
                    : 'Setting up...'}
                </p>
              </div>
              <div>
                {binaryStatus?.ffmpeg?.available ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Active</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Setting up</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Download Location Setting */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="font-semibold text-slate-700 uppercase tracking-wider text-[11px]">
              Default Download Location
            </span>
            <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <Folder className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="text-slate-700 truncate flex-1 text-xs font-medium" title={downloadPath}>
                {downloadPath}
              </span>
              <button
                onClick={onSelectDownloadPath}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-medium text-xs shadow-sm transition shrink-0"
              >
                Browse
              </button>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start space-x-2.5 text-slate-500 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              100% Client-Side. No telemetry, no third-party cloud servers, and no ads.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
