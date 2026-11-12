import React from 'react';
import { Play, Clock, Eye, Calendar, User, ExternalLink, ListMusic, Sparkles } from 'lucide-react';

export default function VideoPreview({ videoInfo, onOpenPlaylist, isPlaylist }) {
  if (!videoInfo) return null;

  return (
    <div className="w-full bg-slate-900/70 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-md shadow-xl transition-all">
      <div className="flex flex-col md:flex-row gap-5 items-start">
        {/* Thumbnail Preview with Duration badge */}
        <div className="relative rounded-xl overflow-hidden shrink-0 group border border-slate-800/60 shadow-lg w-full md:w-64 aspect-video bg-slate-950">
          <img
            src={videoInfo.thumbnail}
            alt={videoInfo.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {videoInfo.durationFormatted && (
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[11px] font-medium text-white flex items-center space-x-1 shadow">
              <Clock className="w-3 h-3 text-red-400" />
              <span>{videoInfo.durationFormatted}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg">
              <Play className="w-5 h-5 ml-0.5" />
            </div>
          </div>
        </div>

        {/* Video Information */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>Ready to Download</span>
              </span>

              {isPlaylist && (
                <button
                  onClick={onOpenPlaylist}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 flex items-center space-x-1 transition"
                >
                  <ListMusic className="w-3 h-3" />
                  <span>Playlist Mode Available</span>
                </button>
              )}
            </div>

            {/* Video Title */}
            <h2 className="text-base font-bold text-white line-clamp-2 leading-snug hover:text-slate-200 transition">
              {videoInfo.title}
            </h2>

            {/* Channel and Stats */}
            <div className="mt-3 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-400">
              <div className="flex items-center space-x-1.5 text-slate-300 font-medium">
                <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-red-400 font-bold text-[10px]">
                  {videoInfo.channel ? videoInfo.channel[0] : 'Y'}
                </div>
                <span>{videoInfo.channel}</span>
              </div>

              {videoInfo.viewCount && (
                <div className="flex items-center space-x-1">
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>{videoInfo.viewCount} views</span>
                </div>
              )}

              {videoInfo.uploadDate && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{videoInfo.uploadDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description snippet if any */}
          {videoInfo.description && (
            <p className="mt-2.5 text-xs text-slate-500 line-clamp-1 italic">
              {videoInfo.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
