import { StrategicComponent, Continent } from './index';

export type TrendTrajectory = 'Rising' | 'Stable' | 'Declining' | 'Emerging';

export interface TrendingArticle {
  id: string;
  title: string;
  source_name: string;
  source_country: string; // Country of the media publisher
  event_country: string;  // Country where the event actually occurred (Standardized Amerop)
  event_country_code: string; // ISO 3166-1 alpha-2 (e.g. 'US', 'GB', 'DE')
  mentioned_countries: string[];
  continent: Continent;
  category: StrategicComponent;
  published_at: string;   // ISO 8601
  fetched_at: string;
  article_url: string;    // Direct URL to original article
  summary: string;
  cluster_id: string;
  geo_confidence: number; // 0 - 100
  provider: 'GDELT' | 'GoogleNewsRSS' | 'OSINT_Feed';
}

export interface TrendingTimelinePoint {
  time: string; // formatted hour or date label (e.g. '04:00', '08:00' or '01 Nov')
  timestamp: string;
  volume: number; // article mentions
}

export interface TrendingCluster {
  id: string;
  rank: number;
  title: string;
  summary: string; // Concise 2-sentence summary
  event_country: string;
  event_country_code: string;
  continent: Continent;
  category: StrategicComponent;
  trending_score: number; // 0 - 100
  trajectory: TrendTrajectory;
  volume_growth: number; // percentage change vs previous equivalent period
  article_count: number;
  source_count: number; // count of distinct independent publishers
  first_published_at: string;
  last_updated_at: string;
  confidence: number;
  articles: TrendingArticle[];
  timeline: TrendingTimelinePoint[];
  videos?: NewsVideo[];
}

export interface TrendingResponse {
  success: boolean;
  scope: string; // e.g. "Americas & Europe", "Europe", "United Kingdom"
  period: '24h' | '7d' | '30d';
  total_issues: number;
  total_articles: number;
  last_synced_at: string;
  is_cached: boolean;
  data: TrendingCluster[];
}

export type VideoRelationType = 'exact_event' | 'direct_coverage' | 'related_context';

export type VideoProvider = 'youtube' | 'vimeo' | 'dailymotion' | 'news_embed';

export interface NewsVideo {
  id: string;
  provider: VideoProvider;
  provider_video_id: string;
  video_url: string;
  embed_url: string;
  title: string;
  channel_name: string;
  channel_id?: string;
  published_at: string;
  thumbnail_url: string;
  description: string;
  embeddable: boolean;
  availability_status: 'available' | 'unavailable' | 'unknown';
  cluster_id: string;
  cluster_title: string;
  relation_type: VideoRelationType;
  event_country: string;
  event_country_code: string;
  continent: Continent;
  category: StrategicComponent;
  relation_confidence: number;
  fetched_at: string;
}

export interface TrendingVideosResponse {
  success: boolean;
  scope: string;
  period: '24h' | '7d' | '30d';
  total_videos: number;
  last_synced_at: string;
  is_cached: boolean;
  data: NewsVideo[];
}

export interface VideoProviderStatus {
  configured: boolean;
  provider: string;
  quota_remaining: number;
  quota_limit: number;
  total_cached_videos: number;
  last_checked_at: string;
  message: string;
}
