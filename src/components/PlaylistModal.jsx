import React, { useState } from 'react';
import { X, CheckSquare, Square, Download, Search, ListMusic } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
              <ListMusic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 truncate max-w-md">
                {playlistData.title}
              </h3>
              <p className="text-xs text-slate-500">
                {playlistData.count} items • {selectedIds.size} selected
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options & Batch Controls */}
        <div className="p-3.5 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Format Selection */}
          <div className="flex items-center space-x-3">
            <span className="text-slate-500 font-medium">Format:</span>
            <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setDownloadType('video')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  downloadType === 'video'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Video (MP4)
              </button>
              <button
                onClick={() => setDownloadType('audio')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  downloadType === 'audio'
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
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
                className="bg-white text-slate-800 rounded-lg px-2.5 py-1 border border-slate-200 focus:outline-none focus:border-indigo-500"
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
                className="bg-white text-slate-800 rounded-lg px-2.5 py-1 border border-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="320">320 kbps (High)</option>
                <option value="192">192 kbps (Medium)</option>
                <option value="128">128 kbps (Standard)</option>
              </select>
            )}
          </div>

          {/* Search / filter in playlist */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter items..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 placeholder-slate-400 rounded-lg pl-8 pr-3 py-1 text-xs border border-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Action bar for select all */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <button
            onClick={toggleSelectAll}
            className="flex items-center space-x-1.5 hover:text-slate-800 transition font-medium"
          >
            {selectedIds.size === playlistData.entries.length ? (
              <CheckSquare className="w-4 h-4 text-indigo-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>Select All ({playlistData.entries.length})</span>
          </button>

          <span>Showing {filteredEntries.length} items</span>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filteredEntries.map((entry, index) => {
            const isChecked = selectedIds.has(entry.id);
            return (
              <div
                key={entry.id || index}
                onClick={() => toggleItem(entry.id)}
                className={`flex items-center space-x-3 p-2.5 rounded-xl border cursor-pointer transition ${
                  isChecked
                    ? 'bg-indigo-50/40 border-indigo-200 text-slate-900'
                    : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="shrink-0 text-indigo-600">
                  {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-400" />}
                </div>

                <span className="text-xs text-slate-400 font-mono w-5 text-right">
                  {index + 1}.
                </span>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate text-slate-800">
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
        <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {selectedIds.size} of {playlistData.entries.length} items queued
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition"
            >
              Cancel
            </button>

            <button
              onClick={handleStartBatch}
              disabled={selectedIds.size === 0}
              className={`flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-semibold transition shadow-sm ${
                selectedIds.size === 0
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Selected ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
