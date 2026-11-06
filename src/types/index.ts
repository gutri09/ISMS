export type Continent = 'Amerika' | 'Eropa' | string;

export type StrategicComponent =
  | 'Ekonomi'
  | 'Angkatan Bersenjata'
  | 'Ilmu Pengetahuan dan Teknologi'
  | 'Sosial'
  | 'Biografi'
  | 'Sejarah'
  | 'Geografi'
  | 'Politik'
  | 'Demografi'
  | 'Transportasi dan Telekomunikasi'
  | string;

export interface Country {
  code: string;       // ISO 3166-1 alpha-2 or alpha-3 (e.g. 'US', 'GB', 'RU')
  name: string;       // Standardized name in Indonesian / English
  continent: Continent;
  subRegion?: string; // e.g. 'North America', 'Western Europe', etc.
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  url?: string;
  dataUrl?: string;   // For local preview
  uploadedAt: string;
}

export interface IntelligenceRecord {
  id: string;
  tanggal: string;              // YYYY-MM-DD
  benua: Continent;
  negara: string;               // Country Name (Standardized)
  negaraCode: string;           // ISO Alpha-2/Alpha-3 code
  bidang: StrategicComponent;
  kegiatan: string;
  bentukKegiatan: string;
  isuUtama: string;
  tokoh?: string;
  sumberUrl?: string;
  attachments?: Attachment[];
  statusSumber: 'lengkap' | 'sumber_belum_dilengkapi';
  isDemo?: boolean;             // Explicit DEMO DATA indicator
  createdAt: string;
  updatedAt: string;
}

export interface DashboardFilter {
  datePreset: '7d' | '30d' | '90d' | 'all' | 'custom';
  startDate?: string;
  endDate?: string;
  benua: string[];
  negara: string[];
  bidang: string[];
  kegiatan: string[];
  bentukKegiatan: string[];
  tokoh: string[];
  searchQuery: string;
}

export interface KPIData {
  totalInformasi: number;
  negaraTerpantau: number;
  komponenDominan: { name: string; count: number } | null;
  negaraTerbanyak: { name: string; count: number } | null;
  kegiatanDominan: { name: string; count: number } | null;
  tokohDominan: { name: string; count: number } | null;
  perubahanPersen?: number | null; // percentage change vs previous equivalent period
  totalProdukIntelijen?: number;
}

export type ActiveMenu = 'dashboard' | 'input' | 'data' | 'master' | 'users';

export type UserRole = 'admin' | 'analis' | 'pimpinan';

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MasterConfig {
  continents: string[];
  components: string[];
  countries: Country[];
  kegiatanTemplates: string[];
  bentukKegiatanTemplates: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'Administrator' | 'Analis' | 'Viewer';
  avatar?: string;
}

export interface BackupInfo {
  exists: boolean;
  count: number;
  savedAt: string | null;
}

export * from './trending';
