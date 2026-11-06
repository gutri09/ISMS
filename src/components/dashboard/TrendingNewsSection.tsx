import React, { useState, useEffect, useMemo } from 'react';
import { useIntelligence } from '../../context/IntelligenceContext';
import {
  TrendingCluster,
  TrendingResponse,
  NewsVideo,
  VideoProviderStatus,
} from '../../types/trending';
import {
  fetchTrendingIssues,
  fetchAggregatedTimeline,
  triggerTrendingSync,
} from '../../services/trendingService';
import {
  fetchTrendingVideos,
  triggerVideoSync,
  fetchVideoProviderStatus,
} from '../../services/videoService';
import { TrendingDetailModal } from './TrendingDetailModal';
import { TrendingTimelineChart } from './TrendingTimelineChart';
import { TrendingVideoCard } from './TrendingVideoCard';
import { VideoPlayerModal } from './VideoPlayerModal';
import { getComponentMeta } from '../../constants/strategicComponents';
import {
  Flame,
  Radio,
  RefreshCw,
  Clock,
  Globe2,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Building2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldAlert,
  SlidersHorizontal,
  Compass,
  PanelRightOpen,
  Video,
  Play,
  Layers,
} from 'lucide-react';

export interface TrendingNewsSectionProps {
  id?: string;
  defaultCollapsed?: boolean;
  onOpenSideDrawer?: () => void;
  showDrawerButton?: boolean;
}

export const TrendingNewsSection: React.FC<TrendingNewsSectionProps> = ({
  id,
  defaultCollapsed = false,
  onOpenSideDrawer,
  showDrawerButton = true,
}) => {
  const { filters, setFilter, toggleFilter } = useIntelligence();

  // Collapsed state
  const [isCollapsed, setIsCollapsed] = useState<boolean>(defaultCollapsed);

  // Active view: 'articles' or 'videos'
  const [activeView, setActiveView] = useState<'articles' | 'videos'>('articles');

  // Selected period state
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('24h');

  // Issues & timeline state
  const [trendingData, setTrendingData] = useState<TrendingResponse | null>(null);
  const [timelinePoints, setTimelinePoints] = useState<{ time: string; volume: number }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Video Intelligence state
  const [videoList, setVideoList] = useState<NewsVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState<boolean>(false);
  const [activeVideo, setActiveVideo] = useState<NewsVideo | null>(null);
  const [providerStatus, setProviderStatus] = useState<VideoProviderStatus | null>(null);

  // Selected issue for detail modal
  const [selectedCluster, setSelectedCluster] = useState<TrendingCluster | null>(null);

  // Dynamic Subtitle Computation based on geographic filters
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

    if (activeCountries.length > 0) {
      return `Trending News — ${activeCountries.join(', ')}`;
    }
    if (activeContinents.length > 0) {
      return `Trending News — ${activeContinents.join(', ')}`;
    }
    return 'Trending News — Global';
  }, [filters.benua, filters.negara]);

  // Dynamic Video Subtitle
  const dynamicVideoSubtitle = useMemo(() => {
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

    if (activeCountries.length > 0) return `Video Berita Tren — ${activeCountries.join(', ')}`;
    if (activeContinents.length > 0) return `Video Berita Tren — ${activeContinents.join(', ')}`;
    return 'Video Berita Tren — Global';
  }, [filters.benua, filters.negara]);

  // Load trending issues & videos whenever filters or period change
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setLoadingVideos(true);

    const loadData = async () => {
      try {
        const [issuesRes, timelineRes, videosRes, statusRes] = await Promise.all([
          fetchTrendingIssues({
            continent: filters.benua,
            country: filters.negara,
            period,
            category: filters.bidang,
            limit: 10,
          }),
          fetchAggregatedTimeline({
            continent: filters.benua,
            country: filters.negara,
            period,
          }),
          fetchTrendingVideos({
            continent: filters.benua,
            country: filters.negara,
            period,
            category: filters.bidang,
            limit: 9,
          }),
          fetchVideoProviderStatus(),
        ]);

        if (isMounted) {
          setTrendingData(issuesRes);
          setTimelinePoints(timelineRes);
          setVideoList(videosRes.data || []);
          setProviderStatus(statusRes);
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
  }, [filters.benua, filters.negara, filters.bidang, period]);

  // Manual Trigger Live Sync
  const handleManualSync = async () => {
    setSyncing(true);
    setSyncFeedback(null);
    try {
      const [resNews, resVids] = await Promise.all([
        triggerTrendingSync(),
        triggerVideoSync(),
      ]);
      setSyncFeedback(`${resNews.message} • ${resVids.message}`);

      // Reload trending data & videos
      const [issuesRes, timelineRes, videosRes] = await Promise.all([
        fetchTrendingIssues({
          continent: filters.benua,
          country: filters.negara,
          period,
          category: filters.bidang,
          limit: 10,
        }),
        fetchAggregatedTimeline({
          continent: filters.benua,
          country: filters.negara,
          period,
        }),
        fetchTrendingVideos({
          continent: filters.benua,
          country: filters.negara,
          period,
          category: filters.bidang,
          limit: 9,
        }),
      ]);
      setTrendingData(issuesRes);
      setTimelinePoints(timelineRes);
      setVideoList(videosRes.data || []);
    } catch (e) {
      setSyncFeedback('Sinkronisasi selesai menggunakan data cache lokal.');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  // Trajectory badge helper
  const renderTrajectoryBadge = (traj: string) => {
    switch (traj) {
      case 'Rising':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
            <TrendingUp className="w-3 h-3" />
            Rising
          </span>
        );
      case 'Emerging':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
            <Sparkles className="w-3 h-3" />
            Emerging
          </span>
        );
      case 'Declining':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <TrendingDown className="w-3 h-3" />
            Declining
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
            <Minus className="w-3 h-3" />
            Stable
          </span>
        );
    }
  };

  // Rank badge helper
  const getRankBadgeClass = (rank: number) => {
    if (rank === 1) return 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-xs';
    if (rank === 2) return 'bg-slate-300 text-slate-900 font-bold border-slate-400 shadow-xs';
    if (rank === 3) return 'bg-amber-700 text-amber-100 font-bold border-amber-600 shadow-xs';
    return 'bg-slate-100 text-slate-600 border-slate-200 font-semibold';
  };

  // Top media agencies aggregate across the active cluster
  const topMediaAgencies = useMemo(() => {
    if (!trendingData || !trendingData.data) return [];
    const sourceCounts: Record<string, number> = {};
    trendingData.data.forEach((cluster) => {
      cluster.articles.forEach((art) => {
        sourceCounts[art.source_name] = (sourceCounts[art.source_name] || 0) + 1;
      });
    });
    return Object.entries(sourceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [trendingData]);

  // Top hotspot countries in current active scope
  const hotspotCountries = useMemo(() => {
    if (!trendingData || !trendingData.data) return [];
    const counts: Record<string, { name: string; count: number; code: string }> = {};
    trendingData.data.forEach((cluster) => {
      const c = cluster.event_country;
      if (!counts[c]) {
        counts[c] = { name: c, count: 0, code: cluster.event_country_code };
      }
      counts[c].count += cluster.article_count;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [trendingData]);

  return (
    <div id={id} className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
      {/* 1. Header Section */}
      <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 text-white p-4 sm:p-5 border-b border-navy-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <div className="flex items-center gap-1.5">
                <Flame className="w-5 h-5 text-rose-500" />
                <h2 className="text-base font-bold tracking-wide text-white uppercase font-sans">
                  Trending News Intelligence
                </h2>
              </div>
              <span className="text-[11px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
                Suplemen OSINT
              </span>
            </div>

            <p className="text-sm font-semibold text-blue-200 mt-1 flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-blue-400" />
              <span>{dynamicSubtitle}</span>
              {trendingData && (
                <span className="text-xs font-normal text-slate-400">
                  ({trendingData.total_issues} Isu Tren Terverifikasi • {trendingData.total_articles} Artikel)
                </span>
              )}
            </p>
          </div>

          {/* Controls: Period Switcher, Sync Button, Drawer shortcut & Collapse */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Period Switcher (only when expanded) */}
            {!isCollapsed && (
              <div className="bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 flex items-center text-xs">
                <button
                  type="button"
                  onClick={() => setPeriod('24h')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                    period === '24h'
                      ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  24 Jam
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('7d')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                    period === '7d'
                      ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  7 Hari
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod('30d')}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                    period === '30d'
                      ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  30 Hari
                </button>
              </div>
            )}

            {/* Sync Button */}
            <button
              type="button"
              onClick={handleManualSync}
              disabled={syncing}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Sinkronkan dengan GDELT DOC 2.0 & Wire Feeds"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Menyinkronkan...' : 'Sinkron'}</span>
            </button>

            {/* Side Drawer Trigger Button */}
            {showDrawerButton && onOpenSideDrawer && (
              <button
                type="button"
                onClick={onOpenSideDrawer}
                className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Buka panel berita tren di samping tanpa menutupi dashboard"
              >
                <PanelRightOpen className="w-3.5 h-3.5" />
                <span>Panel Samping</span>
              </button>
            )}

            {/* Collapse/Expand Toggle */}
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title={isCollapsed ? 'Buka suplemen berita' : 'Ciutkan suplemen berita'}
            >
              {isCollapsed ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
                  <span>Buka Suplemen</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  <span>Ciutkan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sync feedback notification */}
        {syncFeedback && (
          <div className="mt-3 p-2 bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs rounded-lg flex items-center gap-2 animate-in fade-in duration-150">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{syncFeedback}</span>
          </div>
        )}
      </div>

      {/* When Collapsed: Minimal Info Bar */}
      {isCollapsed ? (
        <div className="p-4 bg-slate-50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 border-t border-slate-200/80">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>
              Suplemen berita & video OSINT diminimalkan agar fokus utama tetap pada data internal database.
            </span>
            {trendingData && (
              <span className="font-semibold text-slate-800">
                ({trendingData.total_issues} isu tren & {videoList.length} video siap dianalisis)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {showDrawerButton && onOpenSideDrawer && (
              <button
                type="button"
                onClick={onOpenSideDrawer}
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <PanelRightOpen className="w-3.5 h-3.5" />
                <span>Lihat di Samping</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
              <span>Buka Tampilan Lengkap</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Sub-header View Switcher: [Kluster Isu Berita] vs [Trending News Video] */}
          <div className="bg-slate-900 px-5 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveView('articles')}
                className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeView === 'articles'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-blue-400" />
                <span>Kluster Berita Tren ({trendingData?.total_issues || 0} Isu)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveView('videos')}
                className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  activeView === 'videos'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5 text-rose-400" />
                <span>Trending News Video ({videoList.length} Video)</span>
                <span className="text-[10px] font-mono bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded border border-rose-500/30">
                  YouTube
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              {activeView === 'videos' ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-slate-300 font-mono">
                    {providerStatus?.configured
                      ? 'YouTube Data API v3 Aktif'
                      : 'Feed Video Berita Resmi Terverifikasi'}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">Pencocokan Substantif Isu-ke-Video</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-slate-300 font-mono">GDELT DOC 2.0 & Wire Service</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400">Peringkat Tren Otomatis</span>
                </span>
              )}
            </div>
          </div>

          {activeView === 'videos' ? (
            /* VIDEO INTELLIGENCE VIEW */
            <div className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Video className="w-4 h-4 text-rose-600" />
                    <span>{dynamicVideoSubtitle}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Video pemberitaan resmi dari media internasional terverifikasi (Reuters, DW, BBC, France 24, Euronews, Sky News, PBS NewsHour) yang secara substantif membahas isu tren terpilih.
                  </p>
                </div>

                <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 self-start sm:self-auto">
                  Total {videoList.length} Video Relevan
                </span>
              </div>

              {loadingVideos ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <RefreshCw className="w-8 h-8 text-rose-500 animate-spin" />
                  <p className="text-xs">Memuat video pemberitaan tren...</p>
                </div>
              ) : videoList.length === 0 ? (
                <div className="py-16 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200 p-6">
                  <Video className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">
                    Belum ditemukan video pemberitaan yang relevan untuk isu dan wilayah yang dipilih.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Cobalah ubah filter benua/negara atau periode 24 Jam / 7 Hari / 30 Hari.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
                  {videoList.map((video) => (
                    <TrendingVideoCard
                      key={video.id}
                      video={video}
                      onPlay={(v) => setActiveVideo(v)}
                      onSelectCluster={(cid) => {
                        const match = trendingData?.data.find((c) => c.id === cid);
                        if (match) setSelectedCluster(match);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* 2. Main Content Grid (60% Trending Issues Cards / 40% Visual Analytics) */
            <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Top Trending Issues List (7 Cols) */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <Compass className="w-4 h-4 text-blue-600" />
              <span>Daftar Isu Paling Mendominasi Pemberitaan</span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Diurutkan berdasarkan Trending Score (0–100)
            </span>
          </div>

          {loading ? (
            // Skeleton Loading State
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 animate-pulse space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-3 bg-slate-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          ) : trendingData && trendingData.data.length > 0 ? (
            // Real Trending Cards List
            <div className="space-y-3">
              {trendingData.data.map((cluster) => {
                const meta = getComponentMeta(cluster.category);

                return (
                  <div
                    key={cluster.id}
                    onClick={() => setSelectedCluster(cluster)}
                    className="p-4 rounded-xl bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group space-y-2.5 relative"
                  >
                    {/* Top Row: Rank, Category, Country, Trajectory, Score */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Rank Badge */}
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center text-xs border ${getRankBadgeClass(
                            cluster.rank
                          )}`}
                        >
                          #{cluster.rank}
                        </span>

                        {/* Category Badge */}
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{
                            backgroundColor: meta.bgColor,
                            color: meta.color,
                            border: `1px solid ${meta.borderColor}`,
                          }}
                        >
                          {cluster.category}
                        </span>

                        {/* Country Badge */}
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200 flex items-center gap-1">
                          <Globe2 className="w-2.5 h-2.5 text-slate-500" />
                          {cluster.event_country}
                        </span>

                        {/* Trajectory */}
                        {renderTrajectoryBadge(cluster.trajectory)}
                      </div>

                      {/* Trending Score Gauge */}
                      <div className="flex items-center gap-1.5 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-200/80">
                        <Flame className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-[11px] font-mono font-bold text-blue-900">
                          {cluster.trending_score}
                        </span>
                        <span className="text-[10px] text-blue-500">Skor</span>
                      </div>
                    </div>

                    {/* Headline Title */}
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                      {cluster.title}
                    </h3>

                    {/* 2-Sentence Concise Summary */}
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {cluster.summary}
                    </p>

                    {/* Bottom Metadata & Stats */}
                    <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 border-t border-slate-100">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-700">
                          {cluster.article_count} artikel unik
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700">
                          {cluster.source_count} media independen
                        </span>
                        <span>•</span>
                        <span className={cluster.volume_growth >= 0 ? 'text-emerald-600 font-semibold' : 'text-slate-500 font-semibold'}>
                          {cluster.volume_growth >= 0 ? `+${cluster.volume_growth}%` : `${cluster.volume_growth}%`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-blue-600 font-medium group-hover:translate-x-0.5 transition-transform text-xs">
                        <span>Lihat Sumber ({cluster.articles.length})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Empty State
            <div className="p-12 text-center bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <ShieldAlert className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="font-bold text-sm text-slate-700">
                Tidak ditemukan berita yang memenuhi filter dan periode yang dipilih.
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Silakan ganti cakupan kawasan, pilih negara lain, atau perluas rentang periode waktu di bagian atas.
              </p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Visual Analytics, Timeline Chart & Media Breakdown (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Trending Timeline Chart Card */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Kurva Intensitas Pemberitaan ({period === '24h' ? '24 Jam' : period === '7d' ? '7 Hari' : '30 Hari'})</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Volume per Interval</span>
            </div>

            <p className="text-[11px] text-slate-500">
              Menunjukkan dinamika peliputan media internasional untuk cakupan <strong>{dynamicSubtitle.replace('Trending News — ', '')}</strong>.
            </p>

            <TrendingTimelineChart
              timeline={timelinePoints}
              period={period}
              scopeLabel={dynamicSubtitle}
            />
          </div>

          {/* 2. Top Media Agencies Diversity */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>Media Independen Paling Aktif</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Keberagaman Sumber</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {topMediaAgencies.map((agency) => (
                <div
                  key={agency.name}
                  className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 flex items-center justify-between"
                >
                  <span className="font-semibold text-slate-800 text-[11px] truncate max-w-[110px]">
                    {agency.name}
                  </span>
                  <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-slate-200 text-blue-700 font-bold">
                    {agency.count} art
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Geographic Hotspot Quick Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <Globe2 className="w-4 h-4 text-emerald-600" />
                <span>Pusat Perhatian Geografis (Hotspots)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Klik untuk Filter</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {hotspotCountries.map((c) => {
                const isCountryActive = (filters.negara || []).includes(c.name);
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => toggleFilter('negara', c.name)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer border ${
                      isCountryActive
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-semibold'
                        : 'bg-slate-50 hover:bg-blue-50 text-slate-700 border-slate-200'
                    }`}
                    title={`Filter (multi-select) khusus negara ${c.name}`}
                  >
                    <span>{c.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        isCountryActive
                          ? 'bg-blue-700 text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {c.count}
                    </span>
                  </button>
                );
              })}

              {Array.isArray(filters.negara) && filters.negara.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFilter('negara', [])}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                >
                  ✕ Hapus Filter Negara ({filters.negara.length})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
  </>
)}

      {/* 3. Interactive Detail Modal */}
      {selectedCluster && (
        <TrendingDetailModal
          cluster={selectedCluster}
          onClose={() => setSelectedCluster(null)}
        />
      )}

      {/* 4. Standalone Video Player Modal */}
      {activeVideo && (
        <VideoPlayerModal
          video={activeVideo}
          onClose={() => setActiveVideo(null)}
          onSelectCluster={(cid) => {
            const match = trendingData?.data.find((c) => c.id === cid);
            if (match) setSelectedCluster(match);
          }}
        />
      )}
    </div>
  );
};
