import React, { useState } from 'react';
import { Search, Clipboard, X, Loader2, Link2 } from 'lucide-react';

const SUPPORTED_PLATFORMS = [
  'YouTube',
  'Instagram',
  'Snapchat',
  'TikTok',
  'Twitter / X',
  'Dailymotion',
  'Facebook',
  'Reddit',
  'Pinterest',
  'Vimeo',
  '1000+ Sites'
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
        className={`bg-white rounded-2xl p-1.5 border transition-all duration-200 shadow-sm ${
          isFocused
            ? 'border-indigo-600 ring-4 ring-indigo-500/10 shadow-md'
            : 'border-slate-200/90 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center px-3 py-1.5">
          {/* Link Icon */}
          <div className="flex items-center justify-center mr-3 text-slate-400 shrink-0">
            <Link2 className="w-5 h-5 text-indigo-500" />
          </div>

          {/* Input field */}
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="Paste link here: Instagram, Snapchat, YouTube, TikTok, Twitter, Dailymotion..."
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none pr-2 font-normal"
          />

          {/* Right Action buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            {url && (
              <button
                onClick={handleClear}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handlePaste}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/60 transition"
              title="Paste link from clipboard"
            >
              <Clipboard className="w-3.5 h-3.5 text-slate-500" />
              <span>Paste</span>
            </button>

            <button
              onClick={() => onFetch(url.trim())}
              disabled={!url.trim() || isLoading}
              className={`flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-medium transition-all shadow-sm ${
                !url.trim() || isLoading
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Analyze</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Supported Platform Badges */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 px-2">
        <span className="text-[11px] font-medium text-slate-400 mr-1">
          Supports:
        </span>
        {SUPPORTED_PLATFORMS.map((name) => (
          <span
            key={name}
            className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
