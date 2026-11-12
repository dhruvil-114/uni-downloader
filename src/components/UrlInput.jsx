import React, { useState } from 'react';
import { Search, Clipboard, X, Loader2, Sparkles, Video } from 'lucide-react';

export default function UrlInput({ url, setUrl, onFetch, isLoading }) {
  const [isFocused, setIsFocused] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await window.electronAPI?.clipboardReadText();
      if (text && typeof text === 'string') {
        const cleaned = text.trim();
        setUrl(cleaned);
        if (cleaned.includes('youtube.com') || cleaned.includes('youtu.be')) {
          onFetch(cleaned);
        }
      }
    } catch (e) {
      // Clipboard fallback
    }
  };

  const handleClear = () => {
    setUrl('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && url.trim() && !isLoading) {
      onFetch(url.trim());
    }
  };

  return (
    <div className="w-full">
      <div
        className={`relative rounded-2xl p-1 transition-all duration-300 ${
          isFocused
            ? 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 shadow-xl shadow-red-500/10'
            : 'bg-slate-800/80 hover:bg-slate-800'
        }`}
      >
        <div className="relative flex items-center bg-slate-900/95 rounded-xl px-4 py-2 border border-slate-800/80">
          {/* YouTube Icon */}
          <div className="flex items-center justify-center mr-3 text-red-500">
            <svg className="w-6 h-6 fill-current animate-pulse-slow" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>

          {/* Input field */}
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="Paste YouTube Video, Shorts, or Playlist link..."
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none pr-2"
          />

          {/* Right Action buttons */}
          <div className="flex items-center space-x-1.5 shrink-0">
            {url && (
              <button
                onClick={handleClear}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handlePaste}
              className="flex items-center space-x-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700/50 hover:border-slate-600 transition shadow-sm"
              title="Paste from clipboard"
            >
              <Clipboard className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden xs:inline sm:inline">Paste</span>
            </button>

            <button
              onClick={() => onFetch(url.trim())}
              disabled={!url.trim() || isLoading}
              className={`flex items-center space-x-1.5 px-3.5 sm:px-5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 shadow-md ${
                !url.trim() || isLoading
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/40'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 shadow-red-600/30 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span className="hidden sm:inline">Analyzing...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Fetch</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
