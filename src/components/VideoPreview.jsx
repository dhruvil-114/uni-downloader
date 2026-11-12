import React from 'react';
import { Play, Clock, Eye, Calendar, ExternalLink, ListMusic, CheckCircle2 } from 'lucide-react';

export default function VideoPreview({ videoInfo, onOpenPlaylist, isPlaylist }) {
  if (!videoInfo) return null;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm transition-all">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start">
        {/* Thumbnail Preview with Duration badge */}
        <div className="relative rounded-xl overflow-hidden shrink-0 group border border-slate-200 shadow-sm w-full sm:w-56 md:w-64 aspect-video bg-slate-100">
          <img
            src={videoInfo.thumbnail}
            alt={videoInfo.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {videoInfo.durationFormatted && (
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-sm text-[11px] font-medium text-white flex items-center space-x-1 shadow-sm">
              <Clock className="w-3 h-3 text-slate-300" />
              <span>{videoInfo.durationFormatted}</span>
            </div>
          )}
        </div>

        {/* Video Information */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              {videoInfo.platform && (
                <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                  {videoInfo.platform.name}
                </span>
              )}

              <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Link Verified</span>
              </span>

              {isPlaylist && (
                <button
                  onClick={onOpenPlaylist}
                  className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 flex items-center space-x-1 transition"
                >
                  <ListMusic className="w-3.5 h-3.5" />
                  <span>Playlist Mode</span>
                </button>
              )}
            </div>

            {/* Video Title */}
            <h2 className="text-base font-semibold text-slate-900 line-clamp-2 leading-snug">
              {videoInfo.title}
            </h2>

            {/* Channel and Stats */}
            <div className="mt-3 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500">
              <div className="flex items-center space-x-1.5 text-slate-700 font-medium">
                <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-[10px]">
                  {videoInfo.channel ? videoInfo.channel[0] : 'V'}
                </span>
                <span>{videoInfo.channel}</span>
              </div>

              {videoInfo.viewCount && (
                <div className="flex items-center space-x-1">
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>{videoInfo.viewCount} views</span>
                </div>
              )}

              {videoInfo.uploadDate && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{videoInfo.uploadDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description snippet */}
          {videoInfo.description && (
            <p className="mt-2.5 text-xs text-slate-500 line-clamp-1">
              {videoInfo.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
