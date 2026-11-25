import React from 'react';
import {
  Layers,
  ArrowDownCircle,
  CheckCircle2,
  Film,
  Music,
  Magnet,
  FileArchive,
  Gauge,
  Zap
} from 'lucide-react';

export default function Sidebar({ activeCategory, onSelectCategory, downloads, totalSpeedMB }) {
  const counts = {
    all: downloads.length,
    active: downloads.filter((d) =>
      ['downloading', 'merging', 'converting', 'queued'].includes(d.status)
    ).length,
    completed: downloads.filter((d) => d.status === 'completed').length,
    video: downloads.filter((d) => d.category === 'video').length,
    audio: downloads.filter((d) => d.category === 'audio').length,
    torrent: downloads.filter((d) => d.category === 'torrent').length,
    file: downloads.filter((d) => d.category === 'file').length
  };

  const navItems = [
    { id: 'all', label: 'All Downloads', icon: Layers, count: counts.all },
    { id: 'active', label: 'Downloading', icon: ArrowDownCircle, count: counts.active },
    { id: 'completed', label: 'Completed', icon: CheckCircle2, count: counts.completed },
    { divider: true },
    { id: 'video', label: 'Videos & Social', icon: Film, count: counts.video },
    { id: 'audio', label: 'Audio & Music', icon: Music, count: counts.audio },
    { id: 'torrent', label: 'Torrents & Magnet', icon: Magnet, count: counts.torrent },
    { id: 'file', label: 'Direct Files', icon: FileArchive, count: counts.file }
  ];

  return (
    <aside className="w-52 shrink-0 bg-white border-r border-slate-200 flex flex-col justify-between p-3 select-none hidden md:flex">
      <div className="space-y-1">
        <p className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Categories
        </p>

        {navItems.map((item, idx) => {
          if (item.divider) {
            return <div key={`div-${idx}`} className="my-2 border-t border-slate-100" />;
          }

          const Icon = item.icon;
          const isActive = activeCategory === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectCategory(item.id)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/60'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Live Bandwidth / Speed Widget */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium flex items-center space-x-1">
            <Gauge className="w-3.5 h-3.5 text-indigo-600" />
            <span>Total Speed</span>
          </span>
          <span className="inline-flex items-center space-x-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            <Zap className="w-2.5 h-2.5" />
            <span>16x</span>
          </span>
        </div>

        <div className="text-lg font-bold text-slate-900 tracking-tight">
          {totalSpeedMB > 0 ? `${totalSpeedMB.toFixed(1)} MB/s` : '0.0 MB/s'}
        </div>

        <div className="text-[11px] text-slate-500">
          {counts.active > 0
            ? `${counts.active} active transfer${counts.active > 1 ? 's' : ''}`
            : 'Idle — Ready'}
        </div>
      </div>
    </aside>
  );
}
