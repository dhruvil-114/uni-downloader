import React, { useState } from 'react';
import { X, CheckSquare, Square, Download, Music, Film, Search, ListMusic, Check } from 'lucide-react';

export default function PlaylistModal({ playlistData, isOpen, onClose, onQueuePlaylist, downloadPath }) {
  if (!isOpen || !playlistData) return null;

  const [selectedIds, setSelectedIds] = useState(
    new Set(playlistData.entries.map((e) => e.id))
  );
  const [filterText, setFilterText] = useState('');
  const [downloadType, setDownloadType] = useState('video'); // 'video' | 'audio'
  const [videoQuality, setVideoQuality] = useState('1080'); // '2160', '1080', '720'
  const [audioQuality, setAudioQuality] = useState('320');

  const filteredEntries = playlistData.entries.filter((entry) =>
    entry.title.toLowerCase().includes(filterText.toLowerCase())
  );

  const toggleSelectAll = () => {
    if (selectedIds.size === playlistData.entries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(playlistData.entries.map((e) => e.id)));
    }
  };

  const toggleItem = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleStartBatch = () => {
    const itemsToDownload = playlistData.entries.filter((e) => selectedIds.has(e.id));
    onQueuePlaylist({
      items: itemsToDownload,
      isAudio: downloadType === 'audio',
      formatSelector:
        downloadType === 'video'
          ? `bestvideo[height<=${videoQuality}]+bestaudio/best[height<=${videoQuality}]`
          : null,
      audioFormat: 'mp3',
      audioQuality: audioQuality === '320' ? '0' : '5',
      qualityLabel:
        downloadType === 'video' ? `${videoQuality}p Video` : `MP3 (${audioQuality}kbps)`,
      downloadPath
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <ListMusic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white truncate max-w-md">
                {playlistData.title}
              </h3>
              <p className="text-xs text-slate-400">
                {playlistData.count} videos found • {selectedIds.size} selected
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options & Batch Controls */}
        <div className="p-4 bg-slate-900/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Format Selection */}
          <div className="flex items-center space-x-3">
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Download As:</span>
            <div className="flex items-center space-x-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
              <button
                onClick={() => setDownloadType('video')}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  downloadType === 'video'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Video (MP4)
              </button>
              <button
                onClick={() => setDownloadType('audio')}
                className={`px-3 py-1 rounded-md font-semibold transition ${
                  downloadType === 'audio'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Audio (MP3)
              </button>
            </div>

            {/* Quality selection dropdown */}
            {downloadType === 'video' ? (
              <select
                value={videoQuality}
                onChange={(e) => setVideoQuality(e.target.value)}
                className="bg-slate-800 text-white rounded-lg px-2.5 py-1 border border-slate-700 focus:outline-none"
              >
                <option value="2160">4K (2160p)</option>
                <option value="1080">1080p Full HD</option>
                <option value="720">720p HD</option>
                <option value="480">480p</option>
              </select>
            ) : (
              <select
                value={audioQuality}
                onChange={(e) => setAudioQuality(e.target.value)}
                className="bg-slate-800 text-white rounded-lg px-2.5 py-1 border border-slate-700 focus:outline-none"
              >
                <option value="320">320 kbps (High)</option>
                <option value="192">192 kbps (Medium)</option>
                <option value="128">128 kbps (Standard)</option>
              </select>
            )}
          </div>

          {/* Search / filter in playlist */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search in playlist..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full bg-slate-950 text-white placeholder-slate-500 rounded-lg pl-8 pr-3 py-1 text-xs border border-slate-800 focus:outline-none focus:border-red-500"
            />
          </div>
        </div>

        {/* Action bar for select all */}
        <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <button
            onClick={toggleSelectAll}
            className="flex items-center space-x-1.5 hover:text-white transition font-medium"
          >
            {selectedIds.size === playlistData.entries.length ? (
              <CheckSquare className="w-4 h-4 text-red-500" />
            ) : (
              <Square className="w-4 h-4 text-slate-500" />
            )}
            <span>Select All ({playlistData.entries.length})</span>
          </button>

          <span>Showing {filteredEntries.length} videos</span>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredEntries.map((entry, index) => {
            const isChecked = selectedIds.has(entry.id);
            return (
              <div
                key={entry.id || index}
                onClick={() => toggleItem(entry.id)}
                className={`flex items-center space-x-3 p-2.5 rounded-xl border cursor-pointer transition ${
                  isChecked
                    ? 'bg-slate-800/80 border-slate-700 text-white'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:bg-slate-800/30'
                }`}
              >
                <div className="shrink-0 text-red-500">
                  {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-600" />}
                </div>

                <span className="text-xs text-slate-500 font-mono w-6 text-right">
                  {index + 1}.
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate text-slate-200">
                    {entry.title}
                  </p>
                </div>

                {entry.durationFormatted && (
                  <span className="text-[11px] text-slate-400 shrink-0 font-mono">
                    {entry.durationFormatted}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {selectedIds.size} of {playlistData.entries.length} items will be queued
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>

            <button
              onClick={handleStartBatch}
              disabled={selectedIds.size === 0}
              className={`flex items-center space-x-2 px-6 py-2 rounded-xl text-xs font-bold transition shadow-lg ${
                selectedIds.size === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-500 hover:to-rose-500 shadow-red-600/30'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Download Selected ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
