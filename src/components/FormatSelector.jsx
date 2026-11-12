import React, { useState } from 'react';
import { Film, Music, Settings2, Folder, Download, Check, Sparkles, FileText, Image as ImageIcon } from 'lucide-react';

export default function FormatSelector({
  videoInfo,
  downloadPath,
  onSelectDownloadPath,
  onStartDownload,
  isDownloading
}) {
  if (!videoInfo) return null;

  const [activeTab, setActiveTab] = useState('video'); // 'video' | 'audio' | 'extras'
  const [selectedVideoFormat, setSelectedVideoFormat] = useState(
    videoInfo.videoFormats?.[0] || null
  );
  const [selectedAudioFormat, setSelectedAudioFormat] = useState(
    videoInfo.audioFormats?.[0] || null
  );

  const [downloadSubtitles, setDownloadSubtitles] = useState(false);
  const [downloadThumbnail, setDownloadThumbnail] = useState(false);

  const handleDownload = () => {
    if (activeTab === 'video' && selectedVideoFormat) {
      onStartDownload({
        url: videoInfo.webpageUrl,
        title: videoInfo.title,
        thumbnail: videoInfo.thumbnail,
        isAudio: false,
        formatSelector: selectedVideoFormat.formatSelector,
        qualityLabel: selectedVideoFormat.label,
        downloadSubtitles,
        downloadThumbnail,
        outputDir: downloadPath
      });
    } else if (activeTab === 'audio' && selectedAudioFormat) {
      onStartDownload({
        url: videoInfo.webpageUrl,
        title: videoInfo.title,
        thumbnail: videoInfo.thumbnail,
        isAudio: true,
        audioFormat: selectedAudioFormat.format,
        audioQuality: selectedAudioFormat.audioQuality,
        qualityLabel: `${selectedAudioFormat.format.toUpperCase()} (${selectedAudioFormat.quality})`,
        downloadSubtitles: false,
        downloadThumbnail,
        outputDir: downloadPath
      });
    } else if (activeTab === 'extras') {
      // Allow downloading just thumbnail or subtitles
      onStartDownload({
        url: videoInfo.webpageUrl,
        title: videoInfo.title,
        thumbnail: videoInfo.thumbnail,
        isAudio: false,
        formatSelector: selectedVideoFormat?.formatSelector || 'best',
        qualityLabel: 'Extras Download',
        downloadSubtitles,
        downloadThumbnail: true,
        outputDir: downloadPath
      });
    }
  };

  const getBadgeColor = (label) => {
    if (label.includes('2160') || label.includes('4K')) return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    if (label.includes('1440') || label.includes('2K')) return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    if (label.includes('1080')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (label.includes('720')) return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    return 'bg-slate-700/50 text-slate-400 border-slate-600/30';
  };

  return (
    <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md shadow-xl flex flex-col space-y-5">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'video'
                ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Video (All Qualities)</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
              {videoInfo.videoFormats?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'audio'
                ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Audio Only (MP3 / M4A)</span>
          </button>

          <button
            onClick={() => setActiveTab('extras')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'extras'
                ? 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Extras (Subs & Thumbnails)</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
          Select format & press Download
        </div>
      </div>

      {/* Tab 1: Video Formats Grid */}
      {activeTab === 'video' && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {videoInfo.videoFormats?.map((fmt) => {
              const isSelected = selectedVideoFormat?.id === fmt.id;
              return (
                <div
                  key={fmt.id}
                  onClick={() => setSelectedVideoFormat(fmt)}
                  className={`relative cursor-pointer rounded-xl p-3.5 border transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-red-500/10 border-red-500 shadow-md shadow-red-500/10 ring-1 ring-red-500/50'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getBadgeColor(fmt.label)}`}>
                      {fmt.label}
                    </span>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white tracking-wide">
                      {fmt.subLabel || fmt.label}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Container: <span className="text-slate-300 uppercase">{fmt.extension} (Audio Merged)</span>
                    </p>
                  </div>

                  {fmt.size && (
                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Est. Size</span>
                      <span className="font-semibold text-slate-200">{fmt.size}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Optional Extras in video tab */}
          <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center gap-4 text-xs">
            <label className="flex items-center space-x-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={downloadSubtitles}
                onChange={(e) => setDownloadSubtitles(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-red-600 focus:ring-0 w-4 h-4"
              />
              <span className="flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Include Subtitles (.srt)</span>
              </span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={downloadThumbnail}
                onChange={(e) => setDownloadThumbnail(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-red-600 focus:ring-0 w-4 h-4"
              />
              <span className="flex items-center space-x-1">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Save HD Thumbnail (.png)</span>
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Tab 2: Audio Formats Grid */}
      {activeTab === 'audio' && (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {videoInfo.audioFormats?.map((fmt) => {
              const isSelected = selectedAudioFormat?.id === fmt.id;
              return (
                <div
                  key={fmt.id}
                  onClick={() => setSelectedAudioFormat(fmt)}
                  className={`relative cursor-pointer rounded-xl p-3.5 border transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-red-500/10 border-red-500 shadow-md shadow-red-500/10 ring-1 ring-red-500/50'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border bg-amber-500/10 text-amber-400 border-amber-500/30">
                      {fmt.format.toUpperCase()}
                    </span>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white tracking-wide">
                      {fmt.label}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Quality: <span className="text-slate-300 font-semibold">{fmt.quality}</span>
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Codec</span>
                    <span className="font-semibold text-slate-200">{fmt.format === 'mp3' ? 'LAME MP3' : 'AAC'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-4 text-xs">
            <label className="flex items-center space-x-2 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={downloadThumbnail}
                onChange={(e) => setDownloadThumbnail(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-red-600 focus:ring-0 w-4 h-4"
              />
              <span className="flex items-center space-x-1">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Save Album Artwork / Thumbnail</span>
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Tab 3: Extras */}
      {activeTab === 'extras' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <FileText className="w-4 h-4 text-red-400" />
                <span>Subtitles / Closed Captions (.srt)</span>
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                {videoInfo.subtitles?.length > 0
                  ? `${videoInfo.subtitles.length} language tracks found for this video.`
                  : 'Auto-detect and download available subtitles.'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={downloadSubtitles}
                onChange={(e) => setDownloadSubtitles(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>High Resolution Thumbnail (.png)</span>
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Saves maximum resolution thumbnail image directly to download folder.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={downloadThumbnail}
                onChange={(e) => setDownloadThumbnail(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>
        </div>
      )}

      {/* Destination Folder & Primary Download Trigger */}
      <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Output path display and change button */}
        <div className="w-full sm:w-auto flex items-center space-x-2 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800">
          <Folder className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="min-w-0 text-left">
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Save Directory</p>
            <p className="text-xs text-slate-300 truncate max-w-xs sm:max-w-sm" title={downloadPath}>
              {downloadPath || 'Default Downloads folder'}
            </p>
          </div>
          <button
            onClick={onSelectDownloadPath}
            className="text-[11px] font-semibold text-red-400 hover:text-red-300 ml-2 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700/80 transition"
          >
            Change
          </button>
        </div>

        {/* Primary Download Button */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-3 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 shadow-xl ${
            isDownloading
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              : 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white hover:from-red-500 hover:to-rose-500 shadow-red-600/30 hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>
            {activeTab === 'video'
              ? `Download Video (${selectedVideoFormat?.label || 'Best'})`
              : activeTab === 'audio'
              ? `Download Audio (${selectedAudioFormat?.format.toUpperCase() || 'MP3'})`
              : 'Download Extras'}
          </span>
        </button>
      </div>
    </div>
  );
}
