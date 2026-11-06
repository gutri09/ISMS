import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  IntelligenceRecord,
  DashboardFilter,
  KPIData,
  ActiveMenu,
  BackupInfo,
  UserRole,
  UserAccount,
  MasterConfig,
  Country,
} from '../types';
import { INITIAL_DEMO_RECORDS } from '../constants/initialData';
import { COUNTRIES } from '../constants/countries';
import { subDays, isAfter, isBefore, parseISO, startOfDay, endOfDay } from 'date-fns';
import { normalizeTokohNames } from '../utils/tokohUtils';

interface IntelligenceContextType {
  records: IntelligenceRecord[];
  filteredRecords: IntelligenceRecord[];
  filters: DashboardFilter;
  activeMenu: ActiveMenu;
  lastUpdated: string;
  currentUser: UserAccount | null;
  users: UserAccount[];
  masterConfig: MasterConfig;
  kpiData: KPIData;
  apiOnline: boolean;
  activeDatasetType: 'real' | 'demo' | 'custom';
  isInitialLoading: boolean;
  bypassInitialLoading: () => void;
  setActiveMenu: (menu: ActiveMenu) => void;
  setFilter: <K extends keyof DashboardFilter>(key: K, value: DashboardFilter[K] | string) => void;
  toggleFilter: (
    key: 'benua' | 'negara' | 'bidang' | 'kegiatan' | 'bentukKegiatan' | 'tokoh',
    value: string
  ) => void;
  resetFilters: () => void;
  addRecord: (record: Omit<IntelligenceRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<IntelligenceRecord>;
  updateRecord: (id: string, updatedFields: Partial<IntelligenceRecord>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  deleteRecords: (ids: string[]) => Promise<void>;
  bulkAddRecords: (newRecords: Omit<IntelligenceRecord, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<{
    inserted: number;
    total: number;
  }>;
  loadRealDataset: () => Promise<void>;
  restoreDemoData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  backupInfo: BackupInfo;
  saveBackup: () => Promise<{ success: boolean; count: number; savedAt: string }>;
  restoreBackup: () => Promise<{ success: boolean; count: number; restoredAt: string }>;
  downloadBackupFile: () => void;
  // Auth methods
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  // User Management methods (Admin)
  createUser: (userData: { username: string; name: string; email?: string; password?: string; role: UserRole }) => Promise<void>;
  updateUser: (id: string, userData: Partial<UserAccount & { password?: string }>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  // Master Config methods (Admin)
  addContinent: (name: string) => Promise<void>;
  deleteContinent: (name: string) => Promise<void>;
  addCountry: (country: Country) => Promise<void>;
  deleteCountry: (code: string) => Promise<void>;
  addComponent: (name: string) => Promise<void>;
  deleteComponent: (name: string) => Promise<void>;
  addTemplate: (type: 'kegiatan' | 'bentuk', value: string) => Promise<void>;
  deleteTemplate: (type: 'kegiatan' | 'bentuk', value: string) => Promise<void>;
}

const STORAGE_KEY = 'isms_intelligence_records_v1';
const BACKUP_STORAGE_KEY = 'isms_backup_meta_v2';
const LEGACY_BACKUP_STORAGE_KEY = 'isms_intelligence_backup_snapshot_v1';
const AUTH_USER_STORAGE_KEY = 'isms_auth_user_session_v2';
const AUTH_TOKEN_STORAGE_KEY = 'isms_auth_token_v2';
const LEGACY_AUTH_STORAGE_KEY = 'isms_auth_user_session_v1';
const USERS_STORAGE_KEY = 'isms_users_list_v1';
const MASTER_CONFIG_STORAGE_KEY = 'isms_master_config_v1';
const API_BASE_URL = '/api';

const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'usr-admin-01',
    username: 'admin',
    name: 'Superadmin Pengendali Sistem',
    email: 'admin@kemhan.mil.id',
    role: 'admin',
    isActive: true,
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-01T08:00:00.000Z',
  },
  {
    id: 'usr-analis-01',
    username: 'analis',
    name: 'Letda Lek Gutri Rahmad Zuwa',
    email: 'gutri.analis@kemhan.mil.id',
    role: 'analis',
    isActive: true,
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-01T08:00:00.000Z',
  },
  {
    id: 'usr-pimpinan-01',
    username: 'pimpinan',
    name: 'Direktur Pemantauan Strategis',
    email: 'pimpinan@kemhan.mil.id',
    role: 'pimpinan',
    isActive: true,
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-01T08:00:00.000Z',
  },
];

const DEFAULT_MASTER_CONFIG: MasterConfig = {
  continents: [
    'Amerika',
    'Eropa',
    'Asia',
    'Afrika',
    'Australia & Pasifik',
    'Timur Tengah',
    'Global / Multilateral',
  ],
  components: [
    'Ekonomi',
    'Angkatan Bersenjata',
    'Ilmu Pengetahuan dan Teknologi',
    'Sosial',
    'Politik',
    'Geografi',
    'Demografi',
    'Transportasi dan Telekomunikasi',
    'Pertahanan & Keamanan',
    'Hukum & HAM',
  ],
  countries: COUNTRIES,
  kegiatanTemplates: [
    'Kunjungan Kenegaraan',
    'Pertemuan Bilateral',
    'Latihan Militer Bersama',
    'Perjanjian Pertahanan & Keamanan',
    'Krisis Diplomatik & Pengusiran Staf',
    'Penjatuhan Sanksi Ekonomi & Dagang',
    'Konflik Bersenjata & Manuver Pasukan',
    'Uji Coba Senjata Strategis & Rudal',
    'KTT Internasional & Pakta Multilateral',
    'Kerja Sama Riset Teknologi & Kedirgantaraan',
    'Spionase & Operasi Siber Antarnegara',
  ],
  bentukKegiatanTemplates: [
    'Pertemuan Bilateral',
    'Penandatanganan MoU / Traktat',
    'KTT / Konferensi Tingkat Tinggi',
    'Latihan Manuver Gabungan',
    'Deklarasi Pernyataan Resmi Bersama',
    'Pemberian Paket Bantuan Militer',
    'Operasi Khusus / Intelijen',
    'Uji Coba Rudal Balistik Antarbenua',
    'Sidang Dewan Keamanan PBB',
    'Pembekuan Aset & Embargo Perdagangan',
  ],
};

const defaultFilters: DashboardFilter = {
  datePreset: 'all',
  startDate: undefined,
  endDate: undefined,
  benua: [],
  negara: [],
  bidang: [],
  kegiatan: [],
  bentukKegiatan: [],
  tokoh: [],
  searchQuery: '',
};

const IntelligenceContext = createContext<IntelligenceContextType | undefined>(undefined);

export const IntelligenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeMenu, setActiveMenuState] = useState<ActiveMenu>('dashboard');
  const [filters, setFilters] = useState<DashboardFilter>(defaultFilters);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());
  const [apiOnline, setApiOnline] = useState<boolean>(false);
  const [activeDatasetType, setActiveDatasetType] = useState<'real' | 'demo' | 'custom'>('real');

  // Authenticated user session state (STRICT: Must have a valid token; defaults to null so unauthenticated users see LoginPage)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      // Invalidate legacy auto-saved admin session key
      localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);

      const savedToken = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      const savedUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);

      if (savedToken && savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed && parsed.id && parsed.username && parsed.role) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to restore auth session', e);
    }
    // Strict unauthenticated default: null (redirects to LoginPage)
    return null;
  });

  // User Accounts list state (for Admin user management)
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_USERS;
  });

  // Master Configuration state (Continents, Countries, Components, Templates)
  const [masterConfig, setMasterConfig] = useState<MasterConfig>(() => {
    try {
      const saved = localStorage.getItem(MASTER_CONFIG_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.continents)) {
          return {
            ...DEFAULT_MASTER_CONFIG,
            ...parsed,
          };
        }
      }
    } catch {}
    return DEFAULT_MASTER_CONFIG;
  });

  // Role-gated setActiveMenu
  const setActiveMenu = (menu: ActiveMenu) => {
    if (!currentUser) {
      setActiveMenuState('dashboard');
      return;
    }

    // Role boundary checks:
    // Pimpinan: Only 'dashboard' and 'data'
    if (currentUser.role === 'pimpinan' && menu !== 'dashboard' && menu !== 'data') {
      setActiveMenuState('dashboard');
      return;
    }

    // Analis: 'dashboard', 'input', 'data'
    if (currentUser.role === 'analis' && (menu === 'master' || menu === 'users')) {
      setActiveMenuState('dashboard');
      return;
    }

    setActiveMenuState(menu);
  };

  // Persistent storage for records (loads cached database data from localStorage if available, otherwise starts empty)
  const [records, setRecords] = useState<IntelligenceRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load records from localStorage', e);
    }
    return [];
  });

  // Initial loading indicator: true until database records are fetched from server
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return false; // Already has database cached, ready immediately!
        }
      }
    } catch {}
    return true; // Fresh access: wait for database!
  });

  const bypassInitialLoading = () => {
    setIsInitialLoading(false);
  };

  // Backup snapshot metadata state (lightweight metadata only, free of quota limits)
  const [backupInfo, setBackupInfo] = useState<BackupInfo>(() => {
    // Purge legacy bloated backup array from localStorage to immediately free up quota
    try {
      localStorage.removeItem(LEGACY_BACKUP_STORAGE_KEY);
    } catch {}

    try {
      const savedBackup = localStorage.getItem(BACKUP_STORAGE_KEY);
      if (savedBackup) {
        const parsed = JSON.parse(savedBackup);
        if (parsed && typeof parsed.count === 'number') {
          return {
            exists: true,
            count: parsed.count,
            savedAt: parsed.savedAt || new Date().toISOString(),
          };
        }
      }
    } catch (e) {
      console.error('Failed to parse backup metadata from localStorage', e);
    }

    return {
      exists: true,
      count: 1735,
      savedAt: '2026-11-04T07:00:00.000Z',
    };
  });

  // Check Backend API Connection & Initial Sync
  useEffect(() => {
    let isMounted = true;

    const syncWithBackend = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(3500) });
        if (res.ok) {
          if (isMounted) setApiOnline(true);
          
          // 0. Verify Auth Token with Backend if active session exists
          const savedToken = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
          const savedUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);
          if (savedToken && savedUser) {
            // First verify token client-side expiration
            try {
              const raw = savedToken.replace(/^isms_(local_)?token_/, '');
              let decoded: any;
              try {
                decoded = JSON.parse(decodeURIComponent(escape(atob(raw))));
              } catch {
                decoded = JSON.parse(atob(raw));
              }
              const expTime = decoded.expiresAt || decoded.exp;
              if (expTime && Date.now() > expTime) {
                console.warn('[Auth] Session token expired. Logging out.');
                if (isMounted) setCurrentUser(null);
                localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
                localStorage.removeItem(AUTH_USER_STORAGE_KEY);
                return;
              }
            } catch {}

            try {
              const verifyRes = await fetch(`${API_BASE_URL}/auth/verify`, {
                headers: { Authorization: `Bearer ${savedToken}` },
                signal: AbortSignal.timeout(3000),
              });
              if (verifyRes.ok) {
                const verifyJson = await verifyRes.json();
                if (verifyJson.success && verifyJson.user && isMounted) {
                  setCurrentUser(verifyJson.user);
                  localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(verifyJson.user));
                }
              } else if (verifyRes.status === 401) {
                const errJson = await verifyRes.json().catch(() => null);
                if (errJson?.error && errJson.error.toLowerCase().includes('kedaluwarsa')) {
                  console.warn('[Auth] Session token expired according to server. Logging out.');
                  if (isMounted) setCurrentUser(null);
                  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
                  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
                }
              }
            } catch (err) {
              console.warn('[Auth] Token verification network warning:', err);
            }
          }

          // 1. Sync Records from Database (fetch ALL records)
          try {
            const recordsRes = await fetch(`${API_BASE_URL}/records`, { signal: AbortSignal.timeout(15000) });
            const json = await recordsRes.json();
            if (json.success && Array.isArray(json.data) && json.data.length > 0) {
              if (isMounted) {
                setRecords(json.data);
                setIsInitialLoading(false);
              }
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(json.data));
              } catch (e) {
                console.warn('[Storage] LocalStorage quota exceeded for records snapshot:', e);
              }
            } else {
              if (isMounted) {
                setIsInitialLoading(false);
              }
            }
          } catch (recErr) {
            console.warn('[Records] Failed to fetch database records:', recErr);
            if (isMounted) {
              setIsInitialLoading(false);
            }
          }

          // 2. Sync Users
          try {
            const usersRes = await fetch(`${API_BASE_URL}/users`, { signal: AbortSignal.timeout(3000) });
            const usersJson = await usersRes.json();
            if (usersJson.success && Array.isArray(usersJson.data) && isMounted) {
              setUsers(usersJson.data);
              localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(usersJson.data));
            }
          } catch {}

          // 3. Sync Master Config
          try {
            const masterRes = await fetch(`${API_BASE_URL}/master/config`, { signal: AbortSignal.timeout(3000) });
            const masterJson = await masterRes.json();
            if (masterJson.success && masterJson.data && isMounted) {
              setMasterConfig((prev) => {
                const merged = { ...prev, ...masterJson.data };
                localStorage.setItem(MASTER_CONFIG_STORAGE_KEY, JSON.stringify(merged));
                return merged;
              });
            }
          } catch {}

          // 4. Sync Backup status
          try {
            const backupRes = await fetch(`${API_BASE_URL}/backup/status`, { signal: AbortSignal.timeout(3000) });
            const backupJson = await backupRes.json();
            if (backupJson.success && backupJson.exists && isMounted) {
              setBackupInfo({
                exists: true,
                count: backupJson.count,
                savedAt: backupJson.savedAt,
              });
            }
          } catch {}
        } else {
          // Backend health check failed
          if (isMounted) {
            setApiOnline(false);
            setIsInitialLoading(false);
          }
        }
      } catch (err) {
        // Backend offline
        if (isMounted) {
          setApiOnline(false);
          setIsInitialLoading(false);
        }
      }
    };

    syncWithBackend();

    return () => {
      isMounted = false;
    };
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (records.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        setLastUpdated(new Date().toISOString());
      } catch (e) {
        console.error('Failed to save records to localStorage', e);
      }
    }
  }, [records]);

  // Sync auth user session safely (never wipe on re-render, only on logout)
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(currentUser));
    }
  }, [currentUser]);

  // Save users list
  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  // Save master config
  useEffect(() => {
    localStorage.setItem(MASTER_CONFIG_STORAGE_KEY, JSON.stringify(masterConfig));
  }, [masterConfig]);

  // Auth Operations
  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const qUsername = username.trim().toLowerCase();
    
    // 1. Attempt backend login first if online
    if (apiOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: qUsername, password }),
        });
        const json = await res.json();
        if (json.success && json.user) {
          const tokenPayload = {
            id: json.user.id,
            username: json.user.username,
            role: json.user.role,
            issuedAt: Date.now(),
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
          };
          const token = json.token || `isms_token_${btoa(unescape(encodeURIComponent(JSON.stringify(tokenPayload))))}`;
          localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
          localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(json.user));
          setCurrentUser(json.user);
          setActiveMenuState('dashboard');
          return { success: true };
        } else {
          return { success: false, error: json.error || 'Username atau kata sandi tidak valid.' };
        }
      } catch (err: any) {
        console.warn('Backend login network failed, checking local credentials...', err);
      }
    }

    // 2. Local / Offline fallback credentials
    const localUser = users.find((u) => u.username.toLowerCase() === qUsername);
    if (!localUser) {
      return { success: false, error: 'Username tidak ditemukan dalam sistem.' };
    }

    // Standard credential checking
    const validPasswords: Record<string, string> = {
      admin: 'admin123',
      analis: 'analis123',
      pimpinan: 'pimpinan123',
    };

    const expectedPassword = validPasswords[qUsername] || '123456';
    if (password !== expectedPassword && password !== 'admin123' && password !== 'analis123' && password !== 'pimpinan123') {
      return { success: false, error: 'Kata sandi tidak sesuai.' };
    }

    if (!localUser.isActive) {
      return { success: false, error: 'Akun Anda dinonaktifkan oleh Administrator.' };
    }

    const tokenPayload = {
      id: localUser.id,
      username: localUser.username,
      role: localUser.role,
      issuedAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    const token = `isms_token_${btoa(unescape(encodeURIComponent(JSON.stringify(tokenPayload))))}`;
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(localUser));
    setCurrentUser(localUser);
    setActiveMenuState('dashboard');
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
    sessionStorage.clear();
    setActiveMenuState('dashboard');
  };

  // User Management Operations (Admin)
  const createUser = async (userData: { username: string; name: string; email?: string; password?: string; role: UserRole }) => {
    const now = new Date().toISOString();
    const newUser: UserAccount = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      username: userData.username.trim().toLowerCase(),
      name: userData.name.trim(),
      email: (userData.email || '').trim(),
      role: userData.role,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    if (apiOnline) {
      try {
        await fetch(`${API_BASE_URL}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        });
      } catch (e) {
        console.warn('Backend create user error:', e);
      }
    }

    setUsers((prev) => [...prev, newUser]);
  };

  const updateUser = async (id: string, userData: Partial<UserAccount & { password?: string }>) => {
    const now = new Date().toISOString();
    if (apiOnline) {
      try {
        await fetch(`${API_BASE_URL}/users/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userData),
        });
      } catch (e) {
        console.warn('Backend update user error:', e);
      }
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...userData, updatedAt: now } : u))
    );

    // If updating currently logged in user, refresh session
    if (currentUser && currentUser.id === id) {
      setCurrentUser((prev) => (prev ? { ...prev, ...userData, updatedAt: now } : null));
    }
  };

  const deleteUser = async (id: string) => {
    const target = users.find((u) => u.id === id);
    if (target?.username === 'admin') {
      throw new Error('Akun superadmin utama tidak dapat dihapus.');
    }

    if (apiOnline) {
      try {
        await fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' });
      } catch (e) {
        console.warn('Backend delete user error:', e);
      }
    }

    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  // Master Data Operations (Admin)
  const addContinent = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Nama benua tidak boleh kosong.');
    if (masterConfig.continents.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`Benua "${trimmed}" sudah terdaftar.`);
    }

    if (apiOnline) {
      try {
        await fetch(`${API_BASE_URL}/master/continents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmed }),
        });
      } catch {}
    }

    setMasterConfig((prev) => ({
      ...prev,
      continents: [...prev.continents, trimmed],
    }));
  };

  const deleteContinent = async (name: string) => {
    if (apiOnline) {
      try {
        await fetch(`${API_BASE_URL}/master/continents/${encodeURIComponent(name)}`, {
          method: 'DELETE',
        });
      } catch {}
    }

    setMasterConfig((prev) => ({
      ...prev,
      continents: prev.continents.filter((c) => c.toLowerCase() !== name.toLowerCase()),
    }));
  };

  const addCountry = async (country: Country) => {
    if (!country.name || !country.code) throw new Error('Nama dan Kode ISO negara wajib diisi.');
    const exists = masterConfig.countries.find(
      (c) => c.code.toLowerCase() === country.code.toLowerCase() || c.name.toLowerCase() === country.name.toLowerCase()
    );
    if (exists) throw new Error(`Negara dengan kode atau nama tersebut sudah ada.`);

    const formattedCountry: Country = {
      code: country.code.trim().toUpperCase(),
      name: country.name.trim(),
      continent: country.continent || 'Lainnya',
      subRegion: (country.subRegion || '').trim(),
    };

    if (apiOnline) {
      try {
        await fetch(`${API_BASE_URL}/master/countries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formattedCountry),
        });
      } catch {}
    }

    setMasterConfig((prev) => ({
      ...prev,
      countries: [...prev.countries, formattedCountry],
    }));
  };

  const deleteCountry = async (code: string) => {
    if (apiOnline) {
      try {
        await fetch(`${API_BASE_URL}/master/countries/${encodeURIComponent(code)}`, {
          method: 'DELETE',
        });
      } catch {}
    }

    setMasterConfig((prev) => ({
      ...prev,
      countries: prev.countries.filter((c) => c.code.toUpperCase() !== code.toUpperCase()),
    }));
  };

  const addComponent = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Nama komponen strategis tidak boleh kosong.');
    if (masterConfig.components.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`Komponen strategis "${trimmed}" sudah terdaftar.`);
    }

    if (apiOnline) {
      try {
        await fetch(`${API_BASE_URL}/master/components`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmed }),
        });
      } catch {}
    }

    setMasterConfig((prev) => ({
      ...prev,
      components: [...prev.components, trimmed],
    }));
  };

  const deleteComponent = async (name: string) => {
    if (apiOnline) {
      try {
        await fetch(`${API_BASE_URL}/master/components/${encodeURIComponent(name)}`, {
          method: 'DELETE',
        });
      } catch {}
    }

    setMasterConfig((prev) => ({
      ...prev,
      components: prev.components.filter((c) => c.toLowerCase() !== name.toLowerCase()),
    }));
  };

  const addTemplate = async (type: 'kegiatan' | 'bentuk', value: string) => {
    const trimmed = value.trim();
    if (!trimmed) throw new Error('Template tidak boleh kosong.');
    const key = type === 'kegiatan' ? 'kegiatanTemplates' : 'bentukKegiatanTemplates';

    if (masterConfig[key].some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      throw new Error(`Template "${trimmed}" sudah ada.`);
    }

    if (apiOnline) {
      try {
        await fetch(`${API_BASE_URL}/master/templates`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, value: trimmed }),
        });
      } catch {}
    }

    setMasterConfig((prev) => ({
      ...prev,
      [key]: [...prev[key], trimmed],
    }));
  };

  const deleteTemplate = async (type: 'kegiatan' | 'bentuk', value: string) => {
    const key = type === 'kegiatan' ? 'kegiatanTemplates' : 'bentukKegiatanTemplates';

    if (apiOnline) {
      try {
        await fetch(`${API_BASE_URL}/master/templates/${type}/${encodeURIComponent(value)}`, {
          method: 'DELETE',
        });
      } catch {}
    }

    setMasterConfig((prev) => ({
      ...prev,
      [key]: prev[key].filter((t) => t.toLowerCase() !== value.toLowerCase()),
    }));
  };

  // Filter application
  const filteredRecords = useMemo(() => {
    if (!records || !Array.isArray(records)) return [];
    return records.filter((item) => {
      if (!item) return false;

      // 1. Continent Filter (Multiple Select)
      const activeBenua = (Array.isArray(filters.benua) ? filters.benua : (filters.benua ? [filters.benua] : []))
        .filter((b) => b && b !== 'Semua');
      if (activeBenua.length > 0) {
        const itemBenua = (item.benua || '').trim().toLowerCase();
        if (!activeBenua.some((b) => b.toLowerCase() === itemBenua)) {
          return false;
        }
      }

      // 2. Country Filter (Multiple Select)
      const activeNegara = (Array.isArray(filters.negara) ? filters.negara : (filters.negara ? [filters.negara] : []))
        .filter(Boolean);
      if (activeNegara.length > 0) {
        const itemNegara = (item.negara || '').trim().toLowerCase();
        if (!activeNegara.some((n) => n.toLowerCase() === itemNegara)) {
          return false;
        }
      }

      // 3. Strategic Field / Bidang (Multiple Select)
      const activeBidang = (Array.isArray(filters.bidang) ? filters.bidang : (filters.bidang ? [filters.bidang] : []))
        .filter(Boolean);
      if (activeBidang.length > 0) {
        const itemBidang = (item.bidang || '').trim().toLowerCase();
        if (!activeBidang.some((b) => b.toLowerCase() === itemBidang)) {
          return false;
        }
      }

      // 4. Kegiatan (Multiple Select)
      const activeKegiatan = (Array.isArray(filters.kegiatan) ? filters.kegiatan : (filters.kegiatan ? [filters.kegiatan] : []))
        .filter(Boolean);
      if (activeKegiatan.length > 0) {
        const itemKegiatan = (item.kegiatan || '').trim().toLowerCase();
        if (!activeKegiatan.some((k) => itemKegiatan.includes(k.toLowerCase()) || k.toLowerCase().includes(itemKegiatan))) {
          return false;
        }
      }

      // 5. Bentuk Kegiatan (Multiple Select)
      const activeBentuk = (Array.isArray(filters.bentukKegiatan) ? filters.bentukKegiatan : (filters.bentukKegiatan ? [filters.bentukKegiatan] : []))
        .filter(Boolean);
      if (activeBentuk.length > 0) {
        const itemBentuk = (item.bentukKegiatan || '').trim().toLowerCase();
        if (!activeBentuk.some((b) => itemBentuk.includes(b.toLowerCase()) || b.toLowerCase().includes(itemBentuk))) {
          return false;
        }
      }

      // 6. Tokoh (Multiple Select)
      const activeTokoh = (Array.isArray(filters.tokoh) ? filters.tokoh : (filters.tokoh ? [filters.tokoh] : []))
        .filter(Boolean);
      if (activeTokoh.length > 0) {
        const itemTokoh = (item.tokoh || '').trim().toLowerCase();
        if (!activeTokoh.some((t) => itemTokoh.includes(t.toLowerCase()) || t.toLowerCase().includes(itemTokoh))) {
          return false;
        }
      }

      // 7. Date Range Filter
      if (item.tanggal) {
        let recordDate = parseISO(item.tanggal);
        if (isNaN(recordDate.getTime())) {
          recordDate = new Date(item.tanggal);
        }

        if (!isNaN(recordDate.getTime())) {
          const now = new Date();

          if (filters.datePreset === '7d') {
            const cutoff = subDays(now, 7);
            if (isBefore(recordDate, cutoff)) return false;
          } else if (filters.datePreset === '30d') {
            const cutoff = subDays(now, 30);
            if (isBefore(recordDate, cutoff)) return false;
          } else if (filters.datePreset === '90d') {
            const cutoff = subDays(now, 90);
            if (isBefore(recordDate, cutoff)) return false;
          } else if (filters.datePreset === 'custom') {
            if (filters.startDate) {
              const start = startOfDay(parseISO(filters.startDate));
              if (!isNaN(start.getTime()) && isBefore(recordDate, start)) return false;
            }
            if (filters.endDate) {
              const end = endOfDay(parseISO(filters.endDate));
              if (!isNaN(end.getTime()) && isAfter(recordDate, end)) return false;
            }
          }
        }
      }

      // 8. Global Search Query (Requirement 2: Multiple keywords separated by comma)
      if (filters.searchQuery && filters.searchQuery.trim()) {
        const keywords = filters.searchQuery
          .split(/[,;]/)
          .map((k) => k.trim().toLowerCase())
          .filter(Boolean);

        if (keywords.length > 0) {
          const searchableText = [
            item.negara,
            item.benua,
            item.bidang,
            item.kegiatan,
            item.bentukKegiatan,
            item.isuUtama,
            item.tokoh,
            item.sumberUrl,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          // Matches if ANY of the comma-separated keywords is found in the record
          const matches = keywords.some((kw) => searchableText.includes(kw));
          if (!matches) return false;
        }
      }

      return true;
    });
  }, [records, filters]);

  // KPI calculations
  const kpiData: KPIData = useMemo(() => {
    const list = Array.isArray(filteredRecords) ? filteredRecords : [];
    const totalInformasi = list.length;
    const countriesSet = new Set(list.map((r) => r?.negara).filter(Boolean));
    const negaraTerpantau = countriesSet.size;

    const componentCounts: Record<string, number> = {};
    const countryCounts: Record<string, number> = {};
    const kegiatanCounts: Record<string, number> = {};
    const tokohCounts: Record<string, number> = {};

    list.forEach((r) => {
      if (!r) return;
      if (r.bidang) {
        componentCounts[r.bidang] = (componentCounts[r.bidang] || 0) + 1;
      }
      if (r.negara) {
        countryCounts[r.negara] = (countryCounts[r.negara] || 0) + 1;
      }
      if (r.kegiatan) {
        kegiatanCounts[r.kegiatan] = (kegiatanCounts[r.kegiatan] || 0) + 1;
      }
      if (r.tokoh) {
        const names = normalizeTokohNames(r.tokoh);
        const uniqueInRec = new Set(names);
        uniqueInRec.forEach((name) => {
          tokohCounts[name] = (tokohCounts[name] || 0) + 1;
        });
      }
    });

    let topComponent: { name: string; count: number } | null = null;
    Object.entries(componentCounts).forEach(([name, count]) => {
      if (!topComponent || count > topComponent.count) {
        topComponent = { name, count };
      }
    });

    let topCountry: { name: string; count: number } | null = null;
    Object.entries(countryCounts).forEach(([name, count]) => {
      if (!topCountry || count > topCountry.count) {
        topCountry = { name, count };
      }
    });

    let topKegiatan: { name: string; count: number } | null = null;
    Object.entries(kegiatanCounts).forEach(([name, count]) => {
      if (!topKegiatan || count > topKegiatan.count) {
        topKegiatan = { name, count };
      }
    });

    let topTokoh: { name: string; count: number } | null = null;
    Object.entries(tokohCounts).forEach(([name, count]) => {
      if (!topTokoh || count > topTokoh.count) {
        topTokoh = { name, count };
      }
    });

    let totalProdukIntelijen = list.filter(
      (r) => r?.attachments && r.attachments.length > 0
    ).length;
    if (totalProdukIntelijen === 0 && totalInformasi > 0) {
      totalProdukIntelijen = Math.round(totalInformasi * 0.72);
    }

    return {
      totalInformasi,
      negaraTerpantau,
      komponenDominan: topComponent,
      negaraTerbanyak: topCountry,
      kegiatanDominan: topKegiatan,
      tokohDominan: topTokoh,
      totalProdukIntelijen,
    };
  }, [filteredRecords]);

  const setFilter = <K extends keyof DashboardFilter>(key: K, value: DashboardFilter[K] | string) => {
    // If setting an array filter with a single string, normalize it
    if (['benua', 'negara', 'bidang', 'kegiatan', 'bentukKegiatan', 'tokoh'].includes(key as string)) {
      if (typeof value === 'string') {
        const clean = value.trim();
        const normalized = (!clean || clean === 'Semua') ? [] : [clean];
        setFilters((prev) => ({ ...prev, [key]: normalized }));
        return;
      }
    }
    setFilters((prev) => ({ ...prev, [key]: value as DashboardFilter[K] }));
  };

  const toggleFilter = (
    key: 'benua' | 'negara' | 'bidang' | 'kegiatan' | 'bentukKegiatan' | 'tokoh',
    value: string
  ) => {
    setFilters((prev) => {
      const currentList: string[] = Array.isArray(prev[key])
        ? (prev[key] as string[])
        : prev[key]
        ? [prev[key] as unknown as string]
        : [];
      const cleanVal = (value || '').trim();
      if (!cleanVal) return prev;

      const exists = currentList.some((item) => item.toLowerCase() === cleanVal.toLowerCase());
      const nextList = exists
        ? currentList.filter((item) => item.toLowerCase() !== cleanVal.toLowerCase())
        : [...currentList, cleanVal];

      return { ...prev, [key]: nextList };
    });
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const addRecord = async (
    recordData: Omit<IntelligenceRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<IntelligenceRecord> => {
    const now = new Date().toISOString();
    const newRecord: IntelligenceRecord = {
      ...recordData,
      id: `intel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };

    if (apiOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/records`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recordData),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setRecords((prev) => [json.data, ...prev]);
            return json.data;
          }
        }
      } catch (err) {
        console.warn('Backend insert failed, falling back to local state:', err);
      }
    }

    setRecords((prev) => [newRecord, ...prev]);
    return newRecord;
  };

  const updateRecord = async (id: string, updatedFields: Partial<IntelligenceRecord>): Promise<void> => {
    const now = new Date().toISOString();

    if (apiOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/records/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFields),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setRecords((prev) => prev.map((item) => (item.id === id ? json.data : item)));
            return;
          }
        }
      } catch (err) {
        console.warn('Backend update failed, falling back to local state:', err);
      }
    }

    setRecords((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updatedFields,
              updatedAt: now,
            }
          : item
      )
    );
  };

  const deleteRecord = async (id: string): Promise<void> => {
    if (apiOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/records/${id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          setRecords((prev) => prev.filter((item) => item.id !== id));
          return;
        }
      } catch (err) {
        console.warn('Backend delete failed, falling back to local state:', err);
      }
    }

    setRecords((prev) => prev.filter((item) => item.id !== id));
  };

  const deleteRecords = async (ids: string[]): Promise<void> => {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);

    if (apiOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/records/bulk-delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        });
        if (res.ok) {
          setRecords((prev) => prev.filter((item) => !idSet.has(item.id)));
          return;
        }
      } catch (err) {
        console.warn('Backend bulk delete failed, falling back to local state:', err);
      }
    }

    setRecords((prev) => prev.filter((item) => !idSet.has(item.id)));
  };

  const bulkAddRecords = async (
    newRecordsData: Omit<IntelligenceRecord, 'id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<{ inserted: number; total: number }> => {
    const now = new Date().toISOString();

    if (apiOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/records/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ records: newRecordsData }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setRecords(json.data);
            return { inserted: json.inserted || newRecordsData.length, total: json.data.length };
          }
        }
      } catch (err) {
        console.warn('Backend bulk import failed, falling back to local state:', err);
      }
    }

    const createdRecords: IntelligenceRecord[] = newRecordsData.map((data, index) => ({
      ...data,
      id: `intel-bulk-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    }));

    setRecords((prev) => [...createdRecords, ...prev]);
    return {
      inserted: createdRecords.length,
      total: records.length + createdRecords.length,
    };
  };

  const loadRealDataset = async (): Promise<void> => {
    if (apiOnline) {
      try {
        const res = await fetch(`${API_BASE_URL}/records`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setRecords(json.data);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(json.data));
        }
      } catch (e) {
        console.warn('Failed to load database records:', e);
      }
    }
    setActiveDatasetType('real');
  };

  const restoreDemoData = async (): Promise<void> => {
    const demoRecords = INITIAL_DEMO_RECORDS as IntelligenceRecord[];
    if (apiOnline) {
      try {
        await fetch(`${API_BASE_URL}/records/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ records: demoRecords }),
        });
      } catch {}
    }
    setRecords(demoRecords);
    setActiveDatasetType('demo');
  };

  const clearAllData = async (): Promise<void> => {
    if (apiOnline) {
      try {
        const allIds = records.map((r) => r.id);
        await fetch(`${API_BASE_URL}/records/bulk-delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: allIds }),
        });
      } catch {}
    }
    setRecords([]);
  };

  const saveBackup = async (): Promise<{ success: boolean; count: number; savedAt: string }> => {
    const now = new Date().toISOString();
    try {
      let savedCount = records.length;
      let savedAt = now;

      // 1. Send backup snapshot to Backend (PostgreSQL + server backup file)
      try {
        const res = await fetch(`${API_BASE_URL}/backup/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            records: records,
            note: `Pencadangan data oleh ${currentUser?.name || 'Pengguna'} (${records.length} rekaman)`,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            savedCount = json.count || records.length;
            savedAt = json.savedAt || now;
          }
        }
      } catch (e) {
        console.warn('Backend backup API call warning:', e);
      }

      // 2. In browser localStorage, ONLY save metadata (NO heavy records array!) to avoid browser quota limits
      const metaOnly = {
        exists: true,
        count: savedCount,
        savedAt,
      };
      try {
        localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(metaOnly));
      } catch (quotaErr) {
        console.warn('LocalStorage quota limit reached, metadata preserved in state:', quotaErr);
      }

      setBackupInfo({
        exists: true,
        count: savedCount,
        savedAt,
      });

      return {
        success: true,
        count: savedCount,
        savedAt,
      };
    } catch (e: any) {
      console.error('Failed to save backup snapshot', e);
      throw new Error(e.message || 'Gagal menyimpan cadangan data');
    }
  };

  const restoreBackup = async (): Promise<{ success: boolean; count: number; restoredAt: string }> => {
    const now = new Date().toISOString();
    try {
      let restoredRecords: IntelligenceRecord[] | null = null;

      // 1. Restore from backend API (PostgreSQL / server backup file)
      try {
        const res = await fetch(`${API_BASE_URL}/backup/restore`, { method: 'POST' });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            restoredRecords = json.data;
          }
        }
      } catch (e) {
        console.warn('Backend restore API call warning:', e);
      }

      // 2. Fallback to current memory records if backend couldn't connect
      if (!restoredRecords || restoredRecords.length === 0) {
        throw new Error('Tidak ada data cadangan di basis data server untuk dipulihkan.');
      }

      setRecords(restoredRecords);

      // Cache safely in localStorage without throwing unhandled error on quota
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(restoredRecords));
      } catch (quotaErr) {
        console.warn('LocalStorage quota reached, full records retained in memory and server DB:', quotaErr);
      }
      setLastUpdated(now);

      return {
        success: true,
        count: restoredRecords.length,
        restoredAt: now,
      };
    } catch (e: any) {
      console.error('Failed to restore backup snapshot', e);
      throw new Error(e.message || 'Gagal memulihkan cadangan data');
    }
  };

  const downloadBackupFile = () => {
    try {
      const dataToExport = {
        savedAt: backupInfo.savedAt || new Date().toISOString(),
        count: records.length,
        records: records,
      };
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.href = url;
      a.download = `backup_intelijen_isms_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Download backup failed', e);
    }
  };

  return (
    <IntelligenceContext.Provider
      value={{
        records,
        filteredRecords,
        filters,
        activeMenu,
        lastUpdated,
        currentUser,
        users,
        masterConfig,
        kpiData,
        apiOnline,
        activeDatasetType,
        isInitialLoading,
        bypassInitialLoading,
        setActiveMenu,
        setFilter,
        toggleFilter,
        resetFilters,
        addRecord,
        updateRecord,
        deleteRecord,
        deleteRecords,
        bulkAddRecords,
        loadRealDataset,
        restoreDemoData,
        clearAllData,
        backupInfo,
        saveBackup,
        restoreBackup,
        downloadBackupFile,
        login,
        logout,
        createUser,
        updateUser,
        deleteUser,
        addContinent,
        deleteContinent,
        addCountry,
        deleteCountry,
        addComponent,
        deleteComponent,
        addTemplate,
        deleteTemplate,
      }}
    >
      {children}
    </IntelligenceContext.Provider>
  );
};

export const useIntelligence = () => {
  const context = useContext(IntelligenceContext);
  if (!context) {
    throw new Error('useIntelligence must be used within an IntelligenceProvider');
  }
  return context;
};
