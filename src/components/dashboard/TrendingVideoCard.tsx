import React from 'react';
import { NewsVideo } from '../../types/trending';
import { Play, ExternalLink, ShieldCheck, Tag, Globe2 } from 'lucide-react';
import { getComponentMeta } from '../../constants/strategicComponents';

interface TrendingVideoCardProps {
  video: NewsVideo;
  onPlay: (video: NewsVideo) => void;
  onSelectCluster?: (clusterId: string) => void;
}

export const TrendingVideoCard: React.FC<TrendingVideoCardProps> = ({
  video,
  onPlay,
  onSelectCluster,
}) => {
  const compMeta = getComponentMeta(video.category);

  const renderRelationBadge = (rel: string) => {
    switch (rel) {
      case 'exact_event':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            Liputan Peristiwa
          </span>
        );
      case 'direct_coverage':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
            Liputan Langsung
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Analisis Terkait
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 rounded-xl overflow-hidden shadow-sm flex flex-col group transition-all duration-200">
      {/* 1. Thumbnail with Click-to-Play Overlay */}
      <div
        className="relative aspect-video bg-slate-950 overflow-hidden cursor-pointer"
        onClick={() => onPlay(video)}
      >
        <img
          src={video.thumbnail_url}
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            // Fallback placeholder if image load fails
            (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.provider_video_id}/0.jpg`;
          }}
        />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Play Button Badge */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-rose-600/90 group-hover:bg-rose-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>

        {/* Top Floating Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded backdrop-blur-md shadow-xs"
            style={{
              backgroundColor: `${compMeta.color}dd`,
              color: '#ffffff',
            }}
          >
            {video.category}
          </span>
          {renderRelationBadge(video.relation_type)}
        </div>

        {/* Bottom Country Badge on Image */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 text-[10px] text-slate-300 bg-slate-950/80 px-2 py-0.5 rounded backdrop-blur-xs font-mono border border-slate-800">
          <Globe2 className="w-3 h-3 text-blue-400" />
          <span>{video.event_country}</span>
        </div>
      </div>

      {/* 2. Card Content Body */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          {/* Channel and publish date */}
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1 font-semibold text-slate-300 truncate">
              <span>{video.channel_name}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            </div>
            <span className="font-mono text-[10px] text-slate-500 shrink-0">
              {new Date(video.published_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </div>

          {/* Title */}
          <h4
            onClick={() => onPlay(video)}
            className="text-xs font-bold text-slate-100 group-hover:text-blue-300 transition-colors line-clamp-2 leading-relaxed cursor-pointer"
            title={video.title}
          >
            {video.title}
          </h4>

          {/* Linked Issue Tag */}
          <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 flex items-center justify-between gap-2 text-[10px]">
            <div className="flex items-center gap-1.5 min-w-0 text-slate-400">
              <Tag className="w-3 h-3 text-blue-400 shrink-0" />
              <span className="truncate">{video.cluster_title}</span>
            </div>
            {onSelectCluster && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCluster(video.cluster_id);
                }}
                className="text-blue-400 hover:text-blue-300 font-semibold shrink-0 cursor-pointer"
                title="Lihat detail kluster isu berita"
              >
                Isu ↗
              </button>
            )}
          </div>
        </div>

        {/* 3. Actions */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onPlay(video)}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Putar Video</span>
          </button>

          <a
            href={video.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="Tonton di YouTube"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
