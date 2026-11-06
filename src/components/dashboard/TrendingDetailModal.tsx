import React, { useState, useEffect } from 'react';
import { TrendingCluster, NewsVideo } from '../../types/trending';
import { fetchClusterVideos } from '../../services/videoService';
import { VideoPlayerModal } from './VideoPlayerModal';
import {
  X,
  ExternalLink,
  Flame,
  Globe,
  Radio,
  FileText,
  Calendar,
  Layers,
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Share2,
  Video,
  Play,
  ShieldCheck,
} from 'lucide-react';
import { getComponentMeta } from '../../constants/strategicComponents';

interface TrendingDetailModalProps {
  cluster: TrendingCluster | null;
  onClose: () => void;
}

export const TrendingDetailModal: React.FC<TrendingDetailModalProps> = ({ cluster, onClose }) => {
  const [clusterVideos, setClusterVideos] = useState<NewsVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState<boolean>(false);
  const [activeVideo, setActiveVideo] = useState<NewsVideo | null>(null);

  // Load videos for this cluster
  useEffect(() => {
    if (!cluster) return;

    if (cluster.videos && cluster.videos.length > 0) {
      setClusterVideos(cluster.videos);
      return;
    }

    let isMounted = true;
    setLoadingVideos(true);
    fetchClusterVideos(cluster.id)
      .then((vids) => {
        if (isMounted) {
          setClusterVideos(vids);
          setLoadingVideos(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoadingVideos(false);
      });

    return () => {
      isMounted = false;
    };
  }, [cluster]);

  if (!cluster) return null;

  const meta = getComponentMeta(cluster.category);

  const getTrajectoryBadge = (traj: string) => {
    switch (traj) {
      case 'Rising':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
            <TrendingUp className="w-3.5 h-3.5" />
            Rising (Lonjakan Tren)
          </span>
        );
      case 'Emerging':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
            <Sparkles className="w-3.5 h-3.5" />
            Emerging (Isu Baru)
          </span>
        );
      case 'Declining':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <TrendingDown className="w-3.5 h-3.5" />
            Declining (Menurun)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
            <Minus className="w-3.5 h-3.5" />
            Stable (Relatif Stabil)
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-navy-950 text-white p-5 flex items-start justify-between gap-4 border-b border-navy-800">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono font-bold text-xs border border-amber-500/40">
                Peringkat #{cluster.rank}
              </span>
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1"
                style={{
                  backgroundColor: meta.bgColor,
                  color: meta.color,
                  border: `1px solid ${meta.borderColor}`,
                }}
              >
                {cluster.category}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {cluster.event_country} ({cluster.continent})
              </span>
              {getTrajectoryBadge(cluster.trajectory)}
            </div>

            <h3 className="font-bold text-base sm:text-lg text-white leading-snug pt-1">
              {cluster.title}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 flex-1">
          {/* Executive Summary */}
          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200/80 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-blue-950 text-xs">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Ringkasan Perkembangan Isu Strategis</span>
            </div>
            <p className="text-slate-700 leading-relaxed text-xs">
              {cluster.summary}
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 font-medium block mb-1">Skor Tren</span>
              <div className="text-xl font-bold font-mono text-blue-600">
                {cluster.trending_score}
                <span className="text-xs text-slate-400 font-normal">/100</span>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 font-medium block mb-1">Dinamika Volume</span>
              <div className={`text-xl font-bold font-mono ${cluster.volume_growth >= 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                {cluster.volume_growth >= 0 ? `+${cluster.volume_growth}%` : `${cluster.volume_growth}%`}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 font-medium block mb-1">Artikel Terverifikasi</span>
              <div className="text-xl font-bold font-mono text-slate-800">
                {cluster.articles.length}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] text-slate-500 font-medium block mb-1">Media Independen</span>
              <div className="text-xl font-bold font-mono text-slate-800">
                {cluster.source_count}
              </div>
            </div>
          </div>

          {/* List of Verified Original Articles */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                <Radio className="w-4 h-4 text-emerald-600" />
                <span>Daftar Artikel Sumber Berita Nyata ({cluster.articles.length})</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Pembaruan: {new Date(cluster.last_updated_at).toLocaleTimeString('id-ID')}
              </span>
            </div>

            <div className="space-y-2.5">
              {cluster.articles.map((art, idx) => (
                <div
                  key={art.id || idx}
                  className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all space-y-2 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-blue-600" />
                        {art.source_name}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span>Publikasi: {new Date(art.published_at).toLocaleString('id-ID')}</span>
                    </div>

                    <span className="font-mono text-[10px] text-slate-400">
                      Asal Media: {art.source_country} • Lokasi: {art.event_country}
                    </span>
                  </div>

                  <h4 className="font-semibold text-xs text-slate-900 leading-snug group-hover:text-blue-700 transition-colors">
                    {art.title}
                  </h4>

                  {art.summary && (
                    <p className="text-[11px] text-slate-600 leading-relaxed italic bg-slate-50 p-2 rounded border border-slate-100">
                      "{art.summary}"
                    </p>
                  )}

                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Provider: <strong className="text-slate-600">{art.provider}</strong> • Keyakinan: {art.geo_confidence}%
                    </span>

                    <a
                      href={art.article_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-medium text-xs border border-blue-200 transition-colors shadow-2xs"
                    >
                      <span>Buka Berita Asli (Read Original Article)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Linked News Videos Section (Video Intelligence) */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                <Video className="w-4 h-4 text-rose-600" />
                <span>Video Pemberitaan Terkait Isu Ini ({clusterVideos.length})</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                YouTube OSINT News Feeds
              </span>
            </div>

            {loadingVideos ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                Memuat video pemberitaan terkait...
              </div>
            ) : clusterVideos.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
                Belum ditemukan video pemberitaan terverifikasi untuk isu ini pada platform resmi.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {clusterVideos.map((vid) => (
                  <div
                    key={vid.id}
                    className="bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all overflow-hidden flex flex-col group"
                  >
                    <div
                      className="relative aspect-video bg-slate-900 cursor-pointer overflow-hidden"
                      onClick={() => setActiveVideo(vid)}
                    >
                      <img
                        src={vid.thumbnail_url}
                        alt={vid.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-950/30 group-hover:bg-slate-950/10 transition-colors flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-rose-600/90 group-hover:bg-rose-600 text-white flex items-center justify-center shadow">
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </div>
                      </div>
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs">
                        {vid.relation_type === 'exact_event'
                          ? 'Liputan Peristiwa'
                          : vid.relation_type === 'direct_coverage'
                          ? 'Liputan Langsung'
                          : 'Analisis Terkait'}
                      </span>
                    </div>

                    <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            {vid.channel_name}
                            <ShieldCheck className="w-3 h-3 text-blue-500" />
                          </span>
                          <span>{new Date(vid.published_at).toLocaleDateString('id-ID')}</span>
                        </div>
                        <h5
                          onClick={() => setActiveVideo(vid)}
                          className="font-semibold text-xs text-slate-900 group-hover:text-blue-600 line-clamp-2 leading-snug cursor-pointer"
                        >
                          {vid.title}
                        </h5>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setActiveVideo(vid)}
                          className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Putar</span>
                        </button>

                        <a
                          href={vid.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-slate-500 hover:text-blue-600 flex items-center gap-1"
                        >
                          <span>YouTube</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">
            ID Kluster: {cluster.id} • Keyakinan Geografis: {cluster.confidence}%
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Tutup Panel
          </button>
        </div>
      </div>

      {/* Standalone Video Player Modal */}
      {activeVideo && (
        <VideoPlayerModal
          video={activeVideo}
          onClose={() => setActiveVideo(null)}
        />
      )}
    </div>
  );
};
