import React, { useEffect } from 'react';
import { NewsVideo } from '../../types/trending';
import { X, ExternalLink, Play, Globe2, ShieldCheck, Tag } from 'lucide-react';
import { getComponentMeta } from '../../constants/strategicComponents';

interface VideoPlayerModalProps {
  video: NewsVideo | null;
  onClose: () => void;
  onSelectCluster?: (clusterId: string) => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  video,
  onClose,
  onSelectCluster,
}) => {
  // Listen for Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && video) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [video, onClose]);

  if (!video) return null;

  const compMeta = getComponentMeta(video.category);

  const getRelationBadge = (rel: string) => {
    switch (rel) {
      case 'exact_event':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            Liputan Peristiwa
          </span>
        );
      case 'direct_coverage':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
            Liputan Langsung
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Analisis / Konteks Terkait
          </span>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-950/90 p-4 border-b border-slate-800 flex items-start justify-between gap-3 text-white">
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                <Play className="w-3 h-3 text-rose-500 fill-rose-500" />
                <span>OSINT Player</span>
              </span>
              <span
                className="text-[11px] font-medium px-2 py-0.5 rounded border"
                style={{
                  backgroundColor: `${compMeta.color}20`,
                  color: compMeta.color,
                  borderColor: `${compMeta.color}40`,
                }}
              >
                {video.category}
              </span>
              {getRelationBadge(video.relation_type)}
              <span className="text-[11px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {video.event_country} ({video.continent})
              </span>
            </div>

            <h3 className="font-bold text-sm sm:text-base text-slate-100 leading-snug line-clamp-2 pt-1">
              {video.title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer shrink-0"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 16:9 Video Embed Player Frame */}
        <div className="relative w-full bg-black aspect-video">
          <iframe
            src={`${video.embed_url}?autoplay=1&rel=0&modestbranding=1`}
            title={video.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>

        {/* Fallback Tip Banner */}
        <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>
            Jika pemutar terkendala ekstensi pemblokir iklan (ad-blocker) atau kebijakan jaringan lokal:
          </span>
          <a
            href={video.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 font-semibold inline-flex items-center gap-1"
          >
            <span>Buka Langsung di YouTube</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Video Metadata & Linked Issue Bar */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs text-slate-300 flex-1">
          {/* Channel info & publish date */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-blue-400 text-xs">
                {video.channel_name.charAt(0)}
              </span>
              <div>
                <div className="flex items-center gap-1.5 font-bold text-slate-200">
                  <span>{video.channel_name}</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Publikasi: {new Date(video.published_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            <a
              href={video.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-medium transition-colors cursor-pointer"
            >
              <span>Tonton di YouTube</span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
            </a>
          </div>

          {/* Description */}
          {video.description && (
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {video.description}
              </p>
            </div>
          )}

          {/* Linked Issue Card */}
          <div className="bg-blue-950/30 p-3.5 rounded-xl border border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-1">
                <Tag className="w-3.5 h-3.5" />
                <span>Terhubung dengan Isu Tren Berita:</span>
              </div>
              <p className="font-semibold text-slate-200 text-xs truncate">
                {video.cluster_title}
              </p>
            </div>

            {onSelectCluster && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSelectCluster(video.cluster_id);
                }}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer shrink-0"
              >
                Lihat Detail Isu ↗
              </button>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Provider: {video.provider} • ID: {video.provider_video_id}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors cursor-pointer"
          >
            Tutup Player
          </button>
        </div>
      </div>
    </div>
  );
};
