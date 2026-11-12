import React, { useState } from 'react';
import { Search, Clipboard, X, Loader2, Globe, Sparkles } from 'lucide-react';

const SUPPORTED_PLATFORMS = [
  { name: 'YouTube', color: 'hover:border-red-500/40 hover:text-red-400' },
  { name: 'Instagram', color: 'hover:border-pink-500/40 hover:text-pink-400' },
  { name: 'Snapchat', color: 'hover:border-yellow-500/40 hover:text-yellow-300' },
  { name: 'TikTok', color: 'hover:border-cyan-500/40 hover:text-cyan-400' },
  { name: 'Twitter / X', color: 'hover:border-sky-500/40 hover:text-sky-400' },
  { name: 'Dailymotion', color: 'hover:border-blue-500/40 hover:text-blue-400' },
  { name: 'Facebook', color: 'hover:border-blue-600/40 hover:text-blue-400' },
  { name: 'Reddit', color: 'hover:border-orange-500/40 hover:text-orange-400' },
  { name: 'Pinterest', color: 'hover:border-rose-500/40 hover:text-rose-400' },
  { name: 'Vimeo', color: 'hover:border-teal-500/40 hover:text-teal-400' },
  { name: '1000+ Sites', color: 'hover:border-emerald-500/40 hover:text-emerald-400' }
];

export default function UrlInput({ url, setUrl, onFetch, isLoading }) {
  const [isFocused, setIsFocused] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await window.electronAPI?.clipboardReadText();
      if (text && typeof text === 'string') {
        const cleaned = text.trim();
        setUrl(cleaned);
        if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
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
    <div className="w-full space-y-3">
      {/* Search Input Box */}
      <div
        className={`relative rounded-2xl p-1 transition-all duration-300 ${
          isFocused
            ? 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 shadow-xl shadow-red-500/10'
            : 'bg-slate-800/80 hover:bg-slate-800'
        }`}
      >
        <div className="relative flex items-center bg-slate-900/95 rounded-xl px-4 py-2 border border-slate-800/80">
          {/* Universal Globe Icon */}
          <div className="flex items-center justify-center mr-3 text-red-500 shrink-0">
            <Globe className="w-5 h-5 animate-pulse-slow text-red-400" />
          </div>

          {/* Input field */}
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="Paste any link: Instagram, Snapchat, YouTube, TikTok, Twitter, Dailymotion..."
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
              title="Paste link from clipboard"
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

      {/* Supported Platform Badges Carousel / Row */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 px-2">
        <span className="text-[10px] uppercase font-bold text-slate-500 mr-1 flex items-center space-x-1">
          <Sparkles className="w-3 h-3 text-red-400" />
          <span>Supported:</span>
        </span>
        {SUPPORTED_PLATFORMS.map((p) => (
          <span
            key={p.name}
            className={`text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-900/90 text-slate-400 border border-slate-800 transition cursor-default ${p.color}`}
          >
            {p.name}
          </span>
        ))}
      </div>
    </div>
  );
}
