import React, { useState } from 'react';
import { Film, Music, Settings2, Folder, Download, Check, FileText, Image as ImageIcon } from 'lucide-react';

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

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col space-y-5">
      {/* Segmented Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 gap-2">
        <div className="bg-slate-100/80 p-1 rounded-xl flex flex-wrap items-center gap-1 border border-slate-200/50">
          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'video'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-indigo-600" />
            <span>Video Formats</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              {videoInfo.videoFormats?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'audio'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Music className="w-3.5 h-3.5 text-amber-600" />
            <span>Audio Only (MP3 / M4A)</span>
          </button>

          <button
            onClick={() => setActiveTab('extras')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'extras'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Extras</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 font-normal hidden md:block">
          Select preferred quality & download
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
                  className={`relative cursor-pointer rounded-xl p-3.5 border transition-all duration-150 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-50/50 border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                      {fmt.label}
                    </span>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      {fmt.subLabel || fmt.label}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Format: <span className="text-slate-700 font-medium uppercase">{fmt.extension} (Audio Merged)</span>
                    </p>
                  </div>

                  {fmt.size && (
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <span>Approx. Size</span>
                      <span className="font-medium text-slate-800">{fmt.size}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Optional Extras in video tab */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs">
            <label className="flex items-center space-x-2 cursor-pointer text-slate-600 hover:text-slate-900">
              <input
                type="checkbox"
                checked={downloadSubtitles}
                onChange={(e) => setDownloadSubtitles(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span className="flex items-center space-x-1 font-medium">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Include Subtitles (.srt)</span>
              </span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer text-slate-600 hover:text-slate-900">
              <input
                type="checkbox"
                checked={downloadThumbnail}
                onChange={(e) => setDownloadThumbnail(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span className="flex items-center space-x-1 font-medium">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Save HD Cover Thumbnail</span>
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
                  className={`relative cursor-pointer rounded-xl p-3.5 border transition-all duration-150 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-50/50 border-amber-600 ring-2 ring-amber-500/20 shadow-sm'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                      {fmt.format.toUpperCase()}
                    </span>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">
                      {fmt.label}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Bitrate: <span className="text-slate-800 font-medium">{fmt.quality}</span>
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Codec</span>
                    <span className="font-medium text-slate-800">{fmt.format === 'mp3' ? 'LAME MP3' : 'AAC'}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-4 text-xs">
            <label className="flex items-center space-x-2 cursor-pointer text-slate-600 hover:text-slate-900">
              <input
                type="checkbox"
                checked={downloadThumbnail}
                onChange={(e) => setDownloadThumbnail(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <span className="flex items-center space-x-1 font-medium">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Save Cover Artwork Image</span>
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Tab 3: Extras */}
      {activeTab === 'extras' && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Subtitles (.srt / .vtt)</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {videoInfo.subtitles?.length > 0
                  ? `${videoInfo.subtitles.length} language subtitle tracks available for this video.`
                  : 'Auto-detect and download available captions.'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={downloadSubtitles}
                onChange={(e) => setDownloadSubtitles(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <span>High Resolution Thumbnail (.png)</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Saves highest resolution cover image directly to your download folder.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={downloadThumbnail}
                onChange={(e) => setDownloadThumbnail(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      )}

      {/* Destination Folder & Primary Download Trigger */}
      <div className="pt-4 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Output path display and change button */}
        <div className="flex-1 min-w-0 flex items-center space-x-2.5 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
          <Folder className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Save Directory</p>
            <p className="text-xs text-slate-700 truncate font-medium" title={downloadPath}>
              {downloadPath || 'Default Downloads folder'}
            </p>
          </div>
          <button
            onClick={onSelectDownloadPath}
            className="text-xs font-semibold text-slate-700 hover:text-indigo-600 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition shrink-0"
          >
            Change
          </button>
        </div>

        {/* Primary Download Button */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className={`w-full md:w-auto shrink-0 flex items-center justify-center space-x-2 px-8 py-3 rounded-xl font-semibold text-sm tracking-normal transition-all shadow-sm ${
            isDownloading
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 hover:shadow active:scale-[0.99]'
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
