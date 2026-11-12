import React from 'react';
import { Minus, Square, X, ArrowDownToLine, Settings } from 'lucide-react';

export default function TitleBar({ binaryStatus, binaryProgress, onOpenSettings }) {
  const handleMinimize = () => {
    window.electronAPI?.minimizeWindow();
  };

  const handleMaximize = () => {
    window.electronAPI?.maximizeWindow();
  };

  const handleClose = () => {
    window.electronAPI?.closeWindow();
  };

  const allEnginesReady = binaryStatus?.ytDlp?.available && binaryStatus?.ffmpeg?.available;

  return (
    <div className="h-11 shrink-0 w-full bg-white border-b border-slate-200 flex items-center justify-between px-3.5 select-none app-drag-region sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {/* App branding */}
      <div className="flex items-center space-x-2.5 shrink-0">
        <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm">
          <ArrowDownToLine className="w-3.5 h-3.5 text-white stroke-[2.5]" />
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="font-semibold text-sm tracking-tight text-slate-900">
            StreamVault
          </span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/80">
            Downloader
          </span>
        </div>
      </div>

      {/* Engine Status indicator */}
      <div className="app-no-drag flex items-center space-x-2 shrink-0">
        <button
          onClick={onOpenSettings}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-50 border border-slate-200/80 hover:bg-slate-100 text-slate-600 hover:text-slate-800 transition"
          title="Click to view engine details & download settings"
        >
          {allEnginesReady ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-slate-600 text-[11px] font-medium hidden sm:inline">Engine Ready</span>
              <span className="text-slate-600 text-[11px] sm:hidden">Ready</span>
            </>
          ) : binaryProgress ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span className="text-amber-700 text-[11px] max-w-[150px] truncate">
                {binaryProgress.message || `Downloading ${binaryProgress.binary}...`}
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span className="text-slate-600 text-[11px] hidden sm:inline">Checking Engine</span>
              <span className="text-slate-600 text-[11px] sm:hidden">Checking</span>
            </>
          )}
          <Settings className="w-3 h-3 text-slate-400 ml-0.5" />
        </button>
      </div>

      {/* Window Controls */}
      <div className="app-no-drag flex items-center -mr-2">
        <button
          onClick={handleMinimize}
          className="w-9 h-9 inline-flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-9 h-9 inline-flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
          title="Maximize"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={handleClose}
          className="w-9 h-9 inline-flex items-center justify-center text-slate-500 hover:text-white hover:bg-rose-600 rounded-md transition"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
