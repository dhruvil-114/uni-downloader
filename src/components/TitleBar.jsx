import React from 'react';
import { Minus, Square, X, DownloadCloud, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';

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
    <div className="h-10 shrink-0 w-full bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between px-3 select-none app-drag-region sticky top-0 z-50">
      {/* App branding */}
      <div className="flex items-center space-x-2.5 shrink-0">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center shadow-lg shadow-red-500/20">
          <DownloadCloud className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="font-bold text-sm tracking-wide bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            StreamVault
          </span>
          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
            PRO
          </span>
        </div>
      </div>

      {/* Engine Status indicator */}
      <div className="app-no-drag flex items-center space-x-2 shrink-0">
        <button
          onClick={onOpenSettings}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition"
          title="Click to view engine details & download settings"
        >
          {allEnginesReady ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-slate-300 text-[11px] hidden sm:inline">4K & MP3 Engines Ready</span>
              <span className="text-slate-300 text-[11px] sm:hidden">Ready</span>
            </>
          ) : binaryProgress ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
              <span className="text-amber-400 text-[11px] max-w-[150px] truncate">
                {binaryProgress.message || `Downloading ${binaryProgress.binary}...`}
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
              <span className="text-amber-400 text-[11px] hidden sm:inline">Checking / Setting up engines</span>
              <span className="text-amber-400 text-[11px] sm:hidden">Setting up</span>
            </>
          )}
        </button>
      </div>

      {/* Window Controls */}
      <div className="app-no-drag flex items-center -mr-2">
        <button
          onClick={handleMinimize}
          className="w-10 h-10 inline-flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          title="Minimize"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-10 h-10 inline-flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          title="Maximize"
        >
          <Square className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleClose}
          className="w-10 h-10 inline-flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-600 transition"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
