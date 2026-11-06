import React, { useState, useEffect, useMemo } from 'react';
import { useIntelligence } from '../../context/IntelligenceContext';
import {
  TrendingCluster,
  TrendingResponse,
  NewsVideo,
} from '../../types/trending';
import {
  fetchTrendingIssues,
  triggerTrendingSync,
} from '../../services/trendingService';
import {
  fetchTrendingVideos,
  triggerVideoSync,
} from '../../services/videoService';
import { TrendingDetailModal } from './TrendingDetailModal';
import { TrendingVideoCard } from './TrendingVideoCard';
import { VideoPlayerModal } from './VideoPlayerModal';
import { getComponentMeta } from '../../constants/strategicComponents';
import {
  Flame,
  X,
  RefreshCw,
  Globe2,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowDown,
  Radio,
  SlidersHorizontal,
  Video,
} from 'lucide-react';

interface TrendingNewsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onScrollToBottom?: () => void;
}

export const TrendingNewsDrawer: React.FC<TrendingNewsDrawerProps> = ({
  isOpen,
  onClose,
  onScrollToBottom,
}) => {
  const { filters, setFilter, toggleFilter } = useIntelligence();

  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('24h');
  const [drawerTab, setDrawerTab] = useState<'issues' | 'videos'>('issues');
  const [trendingData, setTrendingData] = useState<TrendingResponse | null>(null);
  const [videoList, setVideoList] = useState<NewsVideo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingVideos, setLoadingVideos] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<TrendingCluster | null>(null);
  const [playingVideo, setPlayingVideo] = useState<NewsVideo | null>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load trending issues & videos
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);
    setLoadingVideos(true);

    const loadData = async () => {
      try {
        const issuesRes = await fetchTrendingIssues({
          continent: filters.benua,
          country: filters.negara,
          period,
          category: filters.bidang,
          limit: 10,
        });

        const vidsRes = await fetchTrendingVideos({
          continent: filters.benua,
          country: filters.negara,
          period,
          category: filters.bidang,
          limit: 10,
        });

        if (isMounted) {
          setTrendingData(issuesRes);
          setVideoList(vidsRes.data || []);
          setLoading(false);
          setLoadingVideos(false);
        }
      } catch (err) {
        if (isMounted) {
          setLoading(false);
          setLoadingVideos(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, filters.benua, filters.negara, filters.bidang, period]);

  // Handle Manual Sync
  const handleManualSync = async () => {
    setSyncing(true);
    setSyncFeedback(null);
    try {
      const [resNews, resVids] = await Promise.all([
        triggerTrendingSync(),
        triggerVideoSync(),
      ]);
      setSyncFeedback(`${resNews.message} • ${resVids.message}`);

      const [issuesRes, vidsRes] = await Promise.all([
        fetchTrendingIssues({
          continent: filters.benua,
          country: filters.negara,
          period,
          category: filters.bidang,
          limit: 10,
        }),
        fetchTrendingVideos({
          continent: filters.benua,
          country: filters.negara,
          period,
          category: filters.bidang,
          limit: 10,
        }),
      ]);
      setTrendingData(issuesRes);
      setVideoList(vidsRes.data || []);
    } catch {
      setSyncFeedback('Sinkronisasi selesai dengan data cache.');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncFeedback(null), 3000);
    }
  };

  // Dynamic Subtitle
  const dynamicSubtitle = useMemo(() => {
    const activeCountries = Array.isArray(filters.negara)
      ? filters.negara
      : filters.negara
      ? [filters.negara]
      : [];
    const activeContinents = (
      Array.isArray(filters.benua)
        ? filters.benua
        : filters.benua
        ? [filters.benua]
        : []
    ).filter((b) => b && b !== 'Semua');

    if (activeCountries.length > 0) return `Kawasan: ${activeCountries.join(', ')}`;
    if (activeContinents.length > 0) return `Kawasan: Benua ${activeContinents.join(', ')}`;
    return 'Kawasan: Seluruh Dunia (Global)';
  }, [filters.benua, filters.negara]);

  // Top Hotspot Countries
  const hotspotCountries = useMemo(() => {
    if (!trendingData || !trendingData.data) return [];
    const counts: Record<string, number> = {};
    trendingData.data.forEach((cluster) => {
      counts[cluster.event_country] = (counts[cluster.event_country] || 0) + cluster.article_count;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [trendingData]);

  // Trajectory badge helper
  const renderTrajectoryBadge = (traj: string) => {
    switch (traj) {
      case 'Rising':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <TrendingUp className="w-3 h-3" />
            Rising
          </span>
        );
      case 'Emerging':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Sparkles className="w-3 h-3" />
            Emerging
          </span>
        );
      case 'Declining':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-300 border border-slate-600">
            <TrendingDown className="w-3 h-3" />
            Declining
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
            <Minus className="w-3 h-3" />
            Stable
          </span>
        );
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-amber-500 text-slate-950 font-bold';
    if (rank === 2) return 'bg-slate-300 text-slate-900 font-bold';
    if (rank === 3) return 'bg-amber-700 text-amber-100 font-bold';
    return 'bg-slate-700 text-slate-300 font-semibold';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel on Right */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-slate-900 text-white shadow-2xl flex flex-col border-l border-slate-700/80 animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <Flame className="w-5 h-5 text-rose-500" />
              <h2 className="text-base font-bold tracking-wide uppercase font-sans text-white">
                Trending OSINT Panel
              </h2>
              <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30">
                Suplemen Samping
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={syncing}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Sinkronkan Berita & Video"
              >
                <RefreshCw className={`w-4 h-4 text-blue-400 ${syncing ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                title="Tutup Panel (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-blue-300 font-medium">
              <Globe2 className="w-3.5 h-3.5 text-blue-400" />
              <span>{dynamicSubtitle}</span>
            </div>
            {trendingData && (
              <span className="font-mono text-[11px] text-slate-400">
                {trendingData.total_issues} Isu • {videoList.length} Video
              </span>
            )}
          </div>

          {/* Sync notification */}
          {syncFeedback && (
            <div className="mt-2 p-1.5 bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs rounded flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{syncFeedback}</span>
            </div>
          )}

          {/* Switcher Tab: [Isu Berita] vs [Video Tren] */}
          <div className="mt-3 flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setDrawerTab('issues')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                drawerTab === 'issues'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Isu Berita ({trendingData?.total_issues || 0})</span>
            </button>
            <button
              type="button"
              onClick={() => setDrawerTab('videos')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                drawerTab === 'videos'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-rose-400" />
              <span>Video Tren ({videoList.length})</span>
            </button>
          </div>

          {/* Period Selector & Hotspot shortcuts */}
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700 flex items-center text-xs">
              <button
                type="button"
                onClick={() => setPeriod('24h')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  period === '24h' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                24 Jam
              </button>
              <button
                type="button"
                onClick={() => setPeriod('7d')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  period === '7d' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                7 Hari
              </button>
              <button
                type="button"
                onClick={() => setPeriod('30d')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  period === '30d' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                30 Hari
              </button>
            </div>

            {hotspotCountries.length > 0 && (
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400">
                <span>Hotspots:</span>
                {hotspotCountries.slice(0, 3).map((h) => {
                  const isHotspotActive = (filters.negara || []).includes(h.name);
                  return (
                    <button
                      key={h.name}
                      type="button"
                      onClick={() => toggleFilter('negara', h.name)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono border cursor-pointer ${
                        isHotspotActive
                          ? 'bg-blue-600 text-white border-blue-500 font-bold'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {h.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {drawerTab === 'issues' ? (
            /* TAB 1: ISSUES LIST */
            loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-xs">Memuat suplemen isu intelijen terbuka...</p>
              </div>
            ) : !trendingData || trendingData.data.length === 0 ? (
              <div className="py-16 text-center text-slate-400 bg-slate-800/40 rounded-xl border border-slate-800 p-6">
                <ShieldAlert className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-300">Tidak ada isu tren aktif</p>
                <p className="text-xs text-slate-500 mt-1">
                  Cobalah ubah filter negara/periode atau lakukan sinkronisasi data.
                </p>
              </div>
            ) : (
              trendingData.data.map((cluster) => {
                const compMeta = getComponentMeta(cluster.category);
                const scorePct = Math.min(100, Math.max(0, cluster.trending_score));

                return (
                  <div
                    key={cluster.id}
                    onClick={() => setSelectedCluster(cluster)}
                    className="group bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/50 rounded-xl p-3.5 transition-all cursor-pointer shadow-sm relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        {/* Rank Badge */}
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center text-xs shrink-0 ${getRankBadge(
                            cluster.rank
                          )}`}
                        >
                          #{cluster.rank}
                        </span>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span
                              className="text-[10px] font-medium px-2 py-0.2 rounded border"
                              style={{
                                backgroundColor: `${compMeta.color}20`,
                                color: compMeta.color,
                                borderColor: `${compMeta.color}40`,
                              }}
                            >
                              {cluster.category}
                            </span>
                            {renderTrajectoryBadge(cluster.trajectory)}
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-900/60 px-1.5 py-0.2 rounded border border-slate-700">
                              {cluster.event_country}
                            </span>
                          </div>

                          <h3 className="text-xs font-bold text-slate-100 group-hover:text-blue-300 transition-colors line-clamp-2 leading-relaxed">
                            {cluster.title}
                          </h3>
                        </div>
                      </div>

                      {/* Trending Score Indicator */}
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 justify-end text-amber-400 font-mono font-bold text-xs">
                          <Flame className="w-3.5 h-3.5 text-rose-500" />
                          <span>{cluster.trending_score}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono block">Skor Tren</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-700/70 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 via-amber-500 to-rose-500 rounded-full"
                          style={{ width: `${scorePct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {cluster.article_count} art
                      </span>
                    </div>

                    {/* Sample representative snippet */}
                    {cluster.articles && cluster.articles.length > 0 && (
                      <p className="mt-2 text-[11px] text-slate-400 line-clamp-1 italic bg-slate-900/40 px-2 py-1 rounded border border-slate-800">
                        "{cluster.articles[0].title}"
                      </p>
                    )}

                    {/* Card bottom footer */}
                    <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="truncate max-w-[200px]">
                        Sumber: {cluster.articles.map((a) => a.source_name).slice(0, 2).join(', ')}
                      </span>
                      <span className="text-blue-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                        Rincian & Sumber ↗
                      </span>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            /* TAB 2: VIDEOS LIST */
            loadingVideos ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <RefreshCw className="w-8 h-8 text-rose-500 animate-spin" />
                <p className="text-xs">Memuat video pemberitaan tren terkait...</p>
              </div>
            ) : videoList.length === 0 ? (
              <div className="py-16 text-center text-slate-400 bg-slate-800/40 rounded-xl border border-slate-800 p-6">
                <Video className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-300">Belum ada video relevan</p>
                <p className="text-xs text-slate-500 mt-1">
                  Belum ditemukan video pemberitaan yang cocok dengan filter aktif.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {videoList.map((video) => (
                  <TrendingVideoCard
                    key={video.id}
                    video={video}
                    onPlay={(v) => setPlayingVideo(v)}
                    onSelectCluster={(cid) => {
                      const match = trendingData?.data.find((c) => c.id === cid);
                      if (match) setSelectedCluster(match);
                    }}
                  />
                ))}
              </div>
            )
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onScrollToBottom) {
                onScrollToBottom();
              } else {
                const el = document.getElementById('trending-news-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
            <span>Tampilan Penuh di Bawah</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors cursor-pointer"
          >
            Tutup (Esc)
          </button>
        </div>
      </div>

      {/* Selected Issue Detail Modal */}
      {selectedCluster && (
        <TrendingDetailModal
          cluster={selectedCluster}
          onClose={() => setSelectedCluster(null)}
        />
      )}

      {/* Standalone Video Player Modal */}
      {playingVideo && (
        <VideoPlayerModal
          video={playingVideo}
          onClose={() => setPlayingVideo(null)}
          onSelectCluster={(cid) => {
            const match = trendingData?.data.find((c) => c.id === cid);
            if (match) setSelectedCluster(match);
          }}
        />
      )}
    </>
  );
};
