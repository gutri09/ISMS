import React, { useState, useMemo } from 'react';
import { useIntelligence } from '../../context/IntelligenceContext';
import {
  FileText,
  Globe,
  Award,
  TrendingUp,
  Filter,
  RotateCcw,
  Search,
  MapPin,
  ArrowUpRight,
  Calendar,
  CalendarRange,
  Check,
  X,
  PanelRightOpen,
  ArrowDown,
  Flame,
  Activity,
  Users,
  Layers,
} from 'lucide-react';
import { STRATEGIC_COMPONENTS } from '../../constants/strategicComponents';
import { getCountriesByContinent } from '../../constants/countries';
import { TrendLineChart } from './charts/TrendLineChart';
import { AmeropChoroplethMap } from './charts/AmeropChoroplethMap';
import { ComponentsBarChart } from './charts/ComponentsBarChart';
import { TopCountriesBarChart } from './charts/TopCountriesBarChart';
import { ContinentDonutChart } from './charts/ContinentDonutChart';
import { InsightsPanel } from './charts/InsightsPanel';
import { TokohBarChart } from './charts/TokohBarChart';
import { KegiatanBarChart } from './charts/KegiatanBarChart';
import { BentukKegiatanBarChart } from './charts/BentukKegiatanBarChart';
import { TrendingNewsSection } from './TrendingNewsSection';
import { TrendingNewsDrawer } from './TrendingNewsDrawer';
import { MultiSelectDropdown } from '../common/MultiSelectDropdown';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

export const DashboardView: React.FC = () => {
  const { filteredRecords, records, filters, setFilter, toggleFilter, resetFilters, kpiData, masterConfig } = useIntelligence();

  // Slide-over Side Drawer state for OSINT Trending News
  const [isNewsDrawerOpen, setIsNewsDrawerOpen] = useState(false);

  // Available Continents dynamically from masterConfig & records
  const availableContinents = useMemo(() => {
    const list = masterConfig?.continents || ['Amerika', 'Eropa', 'Asia'];
    const fromRecords = records && Array.isArray(records)
      ? (records.map((r) => r?.benua).filter(Boolean) as string[])
      : [];
    return Array.from(new Set([...list, ...fromRecords]));
  }, [masterConfig?.continents, records]);

  const availableCountries = useMemo(() => {
    return getCountriesByContinent(filters.benua, masterConfig?.countries);
  }, [filters.benua, masterConfig?.countries]);

  // Available Kegiatan dynamically from masterConfig & records
  const availableKegiatan = useMemo(() => {
    const set = new Set<string>();
    (masterConfig?.kegiatanTemplates || []).forEach((k) => set.add(k));
    (records || []).forEach((r) => {
      if (r?.kegiatan) set.add(r.kegiatan);
    });
    return Array.from(set).sort();
  }, [masterConfig?.kegiatanTemplates, records]);

  // Available Bentuk Kegiatan dynamically from masterConfig & records
  const availableBentukKegiatan = useMemo(() => {
    const set = new Set<string>();
    (masterConfig?.bentukKegiatanTemplates || []).forEach((b) => set.add(b));
    (records || []).forEach((r) => {
      if (r?.bentukKegiatan) set.add(r.bentukKegiatan);
    });
    return Array.from(set).sort();
  }, [masterConfig?.bentukKegiatanTemplates, records]);

  // Compute dataset bounds for the date pickers
  const { minDate, maxDate } = useMemo(() => {
    if (!records || records.length === 0) {
      return { minDate: '2026-01-01', maxDate: '2026-12-31' };
    }
    let min = '9999-12-31';
    let max = '0000-01-01';
    for (const r of records) {
      if (r && r.tanggal) {
        if (r.tanggal < min) min = r.tanggal;
        if (r.tanggal > max) max = r.tanggal;
      }
    }
    if (min === '9999-12-31') min = '2026-01-01';
    if (max === '0000-01-01') max = '2026-12-31';
    return { minDate: min, maxDate: max };
  }, [records]);

  // Format date helper (Indonesian)
  const formatDateIndo = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = parseISO(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return format(d, 'dd MMM yyyy', { locale: id });
    } catch {
      return dateStr;
    }
  };

  // Check if any filter is active
  const hasActiveFilters =
    filters.datePreset !== 'all' ||
    (Array.isArray(filters.benua) ? filters.benua.length > 0 : Boolean(filters.benua && filters.benua !== 'Semua')) ||
    (Array.isArray(filters.negara) ? filters.negara.length > 0 : Boolean(filters.negara)) ||
    (Array.isArray(filters.bidang) ? filters.bidang.length > 0 : Boolean(filters.bidang)) ||
    (Array.isArray(filters.kegiatan) ? filters.kegiatan.length > 0 : Boolean(filters.kegiatan)) ||
    (Array.isArray(filters.bentukKegiatan) ? filters.bentukKegiatan.length > 0 : Boolean(filters.bentukKegiatan)) ||
    (Array.isArray(filters.tokoh) ? filters.tokoh.length > 0 : Boolean(filters.tokoh)) ||
    Boolean(filters.searchQuery);

  return (
    <div className="space-y-6">
      {/* 1. Global Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Filter Global Dashboard</span>
            <span className="text-xs font-normal text-slate-500">
              (Menampilkan {filteredRecords.length} dari {records.length} data)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetFilters}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-600 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filter
            </button>
          </div>
        </div>

        {/* Filter Controls Grid (6 Multi-Select Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 text-xs">
          {/* 1. Quick Date Presets & Manual Switcher */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-600 font-medium text-[11px]">Rentang Waktu</label>
              {filters.datePreset !== 'custom' ? (
                <button
                  type="button"
                  onClick={() => {
                    setFilter('datePreset', 'custom');
                    if (!filters.startDate) setFilter('startDate', minDate);
                    if (!filters.endDate) setFilter('endDate', maxDate);
                  }}
                  className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-0.5 font-medium transition-colors cursor-pointer"
                  title="Atur rentang tanggal mulai dan selesai secara manual"
                >
                  <Calendar className="w-3 h-3" />
                  <span>Set Manual</span>
                </button>
              ) : (
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                  <Check className="w-3 h-3" />
                  <span>Manual Aktif</span>
                </span>
              )}
            </div>
            <select
              value={filters.datePreset}
              onChange={(e) => {
                const val = e.target.value as any;
                setFilter('datePreset', val);
                if (val === 'custom') {
                  if (!filters.startDate) setFilter('startDate', minDate);
                  if (!filters.endDate) setFilter('endDate', maxDate);
                }
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 cursor-pointer text-xs"
            >
              <option value="all">Semua Waktu (Data Lengkap)</option>
              <option value="7d">7 Hari Terakhir</option>
              <option value="30d">30 Hari Terakhir</option>
              <option value="90d">90 Hari Terakhir</option>
              <option value="custom">📅 Kustom / Tentukan Manual...</option>
            </select>
          </div>

          {/* 2. Continent (Multiple Select) */}
          <MultiSelectDropdown
            label="Benua / Kawasan"
            allLabel="Semua Benua"
            placeholder="Pilih Benua..."
            options={availableContinents.map((b) => ({ value: b, label: b }))}
            selectedValues={Array.isArray(filters.benua) ? filters.benua : (filters.benua && filters.benua !== 'Semua' ? [filters.benua] : [])}
            onChange={(vals) => setFilter('benua', vals)}
          />

          {/* 3. Country (Multiple Select) */}
          <MultiSelectDropdown
            label="Negara"
            allLabel="Semua Negara"
            placeholder="Pilih Negara..."
            searchable={true}
            searchPlaceholder="Cari nama negara..."
            options={availableCountries.map((c) => ({
              value: c.name,
              label: `${c.name} (${c.continent})`,
            }))}
            selectedValues={Array.isArray(filters.negara) ? filters.negara : (filters.negara ? [filters.negara] : [])}
            onChange={(vals) => setFilter('negara', vals)}
          />

          {/* 4. Strategic Component / Bidang (Multiple Select) */}
          <MultiSelectDropdown
            label="Bidang Strategis"
            allLabel="Semua 9 Bidang"
            placeholder="Pilih Bidang..."
            options={STRATEGIC_COMPONENTS.map((comp) => ({
              value: comp.name,
              label: comp.name,
              color: comp.color,
            }))}
            selectedValues={Array.isArray(filters.bidang) ? filters.bidang : (filters.bidang ? [filters.bidang] : [])}
            onChange={(vals) => setFilter('bidang', vals)}
          />

          {/* 5. Kegiatan (Multiple Select - NEW) */}
          <MultiSelectDropdown
            label="Kegiatan"
            allLabel="Semua Kegiatan"
            placeholder="Pilih Kegiatan..."
            searchable={true}
            searchPlaceholder="Cari kegiatan..."
            options={availableKegiatan.map((k) => ({ value: k, label: k }))}
            selectedValues={Array.isArray(filters.kegiatan) ? filters.kegiatan : (filters.kegiatan ? [filters.kegiatan] : [])}
            onChange={(vals) => setFilter('kegiatan', vals)}
          />

          {/* 6. Bentuk Kegiatan (Multiple Select - NEW) */}
          <MultiSelectDropdown
            label="Bentuk Kegiatan"
            allLabel="Semua Bentuk"
            placeholder="Pilih Bentuk..."
            searchable={true}
            searchPlaceholder="Cari bentuk kegiatan..."
            options={availableBentukKegiatan.map((b) => ({ value: b, label: b }))}
            selectedValues={Array.isArray(filters.bentukKegiatan) ? filters.bentukKegiatan : (filters.bentukKegiatan ? [filters.bentukKegiatan] : [])}
            onChange={(vals) => setFilter('bentukKegiatan', vals)}
          />
        </div>

        {/* Global Search Bar (Supports Multi-Keyword separated by comma) */}
        <div className="mt-3.5 pt-3 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kata kunci intelijen (Dapat memasukkan 2 atau lebih kata kunci dipisahkan tanda koma: 'Rusia, alutsista, sanksi')..."
              value={filters.searchQuery}
              onChange={(e) => setFilter('searchQuery', e.target.value)}
              className="w-full bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 focus:border-blue-500 rounded-lg pl-9 pr-9 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium shadow-2xs"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => setFilter('searchQuery', '')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition-colors"
                title="Hapus kata kunci pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Live Multi-Keyword Badges Preview if comma is used */}
          {filters.searchQuery && filters.searchQuery.includes(',') && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2 bg-blue-50/70 p-2 rounded-lg border border-blue-200/80 text-[11px]">
              <span className="text-blue-800 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3 text-blue-600" />
                Multi-Keyword Terdeteksi ({filters.searchQuery.split(/[,;]/).map((s) => s.trim()).filter(Boolean).length} kata kunci):
              </span>
              {filters.searchQuery
                .split(/[,;]/)
                .map((s) => s.trim())
                .filter(Boolean)
                .map((kw, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white text-blue-800 border border-blue-200 shadow-2xs font-medium"
                  >
                    "{kw}"
                  </span>
                ))}
              <span className="text-slate-500 text-[10px] ml-auto italic">
                (Data cocok jika memuat salah satu kata kunci di atas)
              </span>
            </div>
          )}
        </div>

        {/* Panel Penentuan Rentang Waktu Manual */}
        {filters.datePreset === 'custom' && (
          <div className="mt-3.5 p-3.5 bg-gradient-to-r from-blue-50/80 via-slate-50 to-indigo-50/60 border border-blue-200/90 rounded-xl flex flex-col xl:flex-row xl:items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <CalendarRange className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>Tentukan Tanggal Manual:</span>
              </div>

              {/* Date Inputs */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 shadow-2xs">
                  <label className="text-slate-500 font-medium text-[11px]">Dari Tanggal:</label>
                  <input
                    type="date"
                    value={filters.startDate || minDate}
                    min={minDate}
                    max={filters.endDate || maxDate}
                    onChange={(e) => setFilter('startDate', e.target.value)}
                    className="text-slate-900 font-semibold bg-transparent focus:outline-none cursor-pointer text-xs"
                  />
                </div>

                <span className="text-slate-400 font-bold px-0.5">s/d</span>

                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-lg border border-slate-300 shadow-2xs">
                  <label className="text-slate-500 font-medium text-[11px]">Sampai Tanggal:</label>
                  <input
                    type="date"
                    value={filters.endDate || maxDate}
                    min={filters.startDate || minDate}
                    max={maxDate}
                    onChange={(e) => setFilter('endDate', e.target.value)}
                    className="text-slate-900 font-semibold bg-transparent focus:outline-none cursor-pointer text-xs"
                  />
                </div>

                {/* Validation warning if start > end */}
                {filters.startDate && filters.endDate && filters.startDate > filters.endDate && (
                  <span className="text-rose-600 font-semibold text-[11px] bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                    ⚠️ Tanggal mulai tidak boleh melebihi tanggal akhir
                  </span>
                )}
              </div>

              {/* Result Indicator Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 text-white font-semibold text-[11px] shadow-2xs">
                <span>{filteredRecords.length} Rekaman</span>
                <span className="text-blue-100 font-normal">
                  ({formatDateIndo(filters.startDate || minDate)} – {formatDateIndo(filters.endDate || maxDate)})
                </span>
              </div>
            </div>

            {/* Quick Presets / Shortcuts */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-500 text-[11px] font-semibold mr-0.5">Pintasan:</span>
              <button
                type="button"
                onClick={() => {
                  setFilter('startDate', '2026-01-01');
                  setFilter('endDate', '2026-03-31');
                }}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
                  filters.startDate === '2026-01-01' && filters.endDate === '2026-03-31'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                Q1 (Jan–Mar)
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilter('startDate', '2026-04-01');
                  setFilter('endDate', '2026-06-30');
                }}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
                  filters.startDate === '2026-04-01' && filters.endDate === '2026-06-30'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                Q2 (Apr–Jun)
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilter('startDate', '2026-07-01');
                  setFilter('endDate', '2026-09-30');
                }}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all cursor-pointer ${
                  filters.startDate === '2026-07-01' && filters.endDate === '2026-09-30'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                Q3 (Jul–Sep)
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilter('startDate', minDate);
                  setFilter('endDate', maxDate);
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-medium text-[11px] transition-colors cursor-pointer"
              >
                Semua Rentang
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilter('datePreset', 'all');
                  setFilter('startDate', undefined);
                  setFilter('endDate', undefined);
                }}
                className="px-2.5 py-1 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                title="Kembalikan ke semua waktu"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Rentang
              </button>
            </div>
          </div>
        )}

        {/* Active Filter Chips Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-3.5 pt-3 border-t border-slate-200/70 text-xs">
            <span className="text-slate-500 font-semibold text-[11px]">Filter Aktif:</span>

            {/* Date Range Chip */}
            {filters.datePreset === 'custom' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-medium shadow-2xs">
                <Calendar className="w-3 h-3 text-blue-600" />
                Rentang: {formatDateIndo(filters.startDate || minDate)} s/d {formatDateIndo(filters.endDate || maxDate)}
                <button
                  type="button"
                  onClick={() => {
                    setFilter('datePreset', 'all');
                    setFilter('startDate', undefined);
                    setFilter('endDate', undefined);
                  }}
                  className="hover:text-rose-600 ml-0.5 cursor-pointer"
                  title="Hapus filter rentang waktu"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {filters.datePreset !== 'all' && filters.datePreset !== 'custom' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-medium shadow-2xs">
                Periode: {filters.datePreset === '7d' ? '7 Hari' : filters.datePreset === '30d' ? '30 Hari' : '90 Hari'} Terakhir
                <button
                  type="button"
                  onClick={() => setFilter('datePreset', 'all')}
                  className="hover:text-rose-600 ml-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Benua Chips */}
            {(Array.isArray(filters.benua) ? filters.benua : (filters.benua && filters.benua !== 'Semua' ? [filters.benua] : [])).map((b) => (
              <span key={b} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium shadow-2xs">
                Benua: {b}
                <button
                  type="button"
                  onClick={() => toggleFilter('benua', b)}
                  className="hover:text-rose-600 ml-0.5 cursor-pointer"
                  title={`Hapus filter benua ${b}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Negara Chips */}
            {(Array.isArray(filters.negara) ? filters.negara : (filters.negara ? [filters.negara] : [])).map((n) => (
              <span key={n} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-medium shadow-2xs">
                Negara: {n}
                <button
                  type="button"
                  onClick={() => toggleFilter('negara', n)}
                  className="hover:text-rose-600 ml-0.5 cursor-pointer"
                  title={`Hapus filter negara ${n}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Bidang Chips */}
            {(Array.isArray(filters.bidang) ? filters.bidang : (filters.bidang ? [filters.bidang] : [])).map((b) => (
              <span key={b} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-medium shadow-2xs">
                Bidang: {b}
                <button
                  type="button"
                  onClick={() => toggleFilter('bidang', b)}
                  className="hover:text-rose-600 ml-0.5 cursor-pointer"
                  title={`Hapus filter bidang ${b}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Kegiatan Chips */}
            {(Array.isArray(filters.kegiatan) ? filters.kegiatan : (filters.kegiatan ? [filters.kegiatan] : [])).map((k) => (
              <span key={k} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium shadow-2xs">
                Kegiatan: {k}
                <button
                  type="button"
                  onClick={() => toggleFilter('kegiatan', k)}
                  className="hover:text-rose-600 ml-0.5 cursor-pointer"
                  title={`Hapus filter kegiatan ${k}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Bentuk Kegiatan Chips */}
            {(Array.isArray(filters.bentukKegiatan) ? filters.bentukKegiatan : (filters.bentukKegiatan ? [filters.bentukKegiatan] : [])).map((b) => (
              <span key={b} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium shadow-2xs">
                Bentuk: {b}
                <button
                  type="button"
                  onClick={() => toggleFilter('bentukKegiatan', b)}
                  className="hover:text-rose-600 ml-0.5 cursor-pointer"
                  title={`Hapus filter bentuk kegiatan ${b}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Tokoh Chips */}
            {(Array.isArray(filters.tokoh) ? filters.tokoh : (filters.tokoh ? [filters.tokoh] : [])).map((t) => (
              <span key={t} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px] font-medium shadow-2xs">
                Tokoh: {t}
                <button
                  type="button"
                  onClick={() => toggleFilter('tokoh', t)}
                  className="hover:text-rose-600 ml-0.5 cursor-pointer"
                  title={`Hapus filter tokoh ${t}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {/* Search Query Chips (Split by comma if multiple) */}
            {filters.searchQuery && (
              filters.searchQuery.includes(',') ? (
                filters.searchQuery.split(/[,;]/).map((s) => s.trim()).filter(Boolean).map((kw, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300 text-[11px] font-medium">
                    Kata Kunci: "{kw}"
                    <button
                      type="button"
                      onClick={() => {
                        const remaining = filters.searchQuery
                          .split(/[,;]/)
                          .map((s) => s.trim())
                          .filter((s) => s && s.toLowerCase() !== kw.toLowerCase())
                          .join(', ');
                        setFilter('searchQuery', remaining);
                      }}
                      className="hover:text-rose-600 ml-0.5 cursor-pointer"
                      title={`Hapus kata kunci "${kw}"`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium">
                  Kata Kunci: "{filters.searchQuery}"
                  <button
                    type="button"
                    onClick={() => setFilter('searchQuery', '')}
                    className="hover:text-rose-600 ml-0.5 cursor-pointer"
                    title="Hapus kata kunci"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )
            )}

            <button
              type="button"
              onClick={resetFilters}
              className="text-[11px] text-blue-600 hover:text-blue-800 underline font-semibold ml-1 cursor-pointer"
            >
              Hapus Semua Filter
            </button>
          </div>
        )}
      </div>

      {/* 2. Six Dynamic KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* KPI 1: Total Informasi */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Info</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {kpiData.totalInformasi}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Rekaman pada filter</p>
          </div>
        </div>

        {/* KPI 2: Negara Terpantau */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Negara Terpantau</span>
            <Globe className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 font-mono">
              {kpiData.negaraTerpantau}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Entitas negara aktif</p>
          </div>
        </div>

        {/* KPI 3: Komponen Dominan */}
        <div
          onClick={() => {
            if (kpiData.komponenDominan?.name) {
              toggleFilter('bidang', kpiData.komponenDominan.name);
            }
          }}
          className={`bg-white rounded-xl p-4 border shadow-sm flex flex-col justify-between transition-all cursor-pointer ${
            filters.bidang &&
            kpiData.komponenDominan?.name &&
            (Array.isArray(filters.bidang) ? filters.bidang : [filters.bidang]).some(
              (b) => b.toLowerCase() === kpiData.komponenDominan!.name.toLowerCase()
            )
              ? 'bg-purple-50/90 border-purple-400 ring-1 ring-purple-400 shadow-xs'
              : 'border-slate-200/90 hover:border-purple-300'
          }`}
          title="Klik untuk menyaring / toggle bidang dominan ini (Multi-Select)"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Bidang Dominan</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 truncate" title={kpiData.komponenDominan?.name || '-'}>
              {kpiData.komponenDominan?.name || '-'}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
              {kpiData.komponenDominan?.count || 0} informasi
            </p>
          </div>
        </div>

        {/* KPI 4: Negara Terbanyak */}
        <div
          onClick={() => {
            if (kpiData.negaraTerbanyak?.name) {
              toggleFilter('negara', kpiData.negaraTerbanyak.name);
            }
          }}
          className={`bg-white rounded-xl p-4 border shadow-sm flex flex-col justify-between transition-all cursor-pointer ${
            filters.negara &&
            kpiData.negaraTerbanyak?.name &&
            (Array.isArray(filters.negara) ? filters.negara : [filters.negara]).some(
              (n) => n.toLowerCase() === kpiData.negaraTerbanyak!.name.toLowerCase()
            )
              ? 'bg-red-50/90 border-red-400 ring-1 ring-red-400 shadow-xs'
              : 'border-slate-200/90 hover:border-red-300'
          }`}
          title="Klik untuk menyaring / toggle negara teratas ini (Multi-Select)"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Negara Teratas</span>
            <MapPin className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 truncate" title={kpiData.negaraTerbanyak?.name || '-'}>
              {kpiData.negaraTerbanyak?.name || '-'}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
              {kpiData.negaraTerbanyak?.count || 0} informasi
            </p>
          </div>
        </div>

        {/* KPI 5: Kegiatan Dominan */}
        <div
          onClick={() => {
            if (kpiData.kegiatanDominan?.name) {
              toggleFilter('kegiatan', kpiData.kegiatanDominan.name);
            }
          }}
          className={`bg-white rounded-xl p-4 border shadow-sm flex flex-col justify-between transition-all cursor-pointer ${
            filters.kegiatan &&
            kpiData.kegiatanDominan?.name &&
            (Array.isArray(filters.kegiatan) ? filters.kegiatan : [filters.kegiatan]).some(
              (k) => k.toLowerCase() === kpiData.kegiatanDominan!.name.toLowerCase()
            )
              ? 'bg-emerald-50/90 border-emerald-400 ring-1 ring-emerald-400 shadow-xs'
              : 'border-slate-200/90 hover:border-emerald-300'
          }`}
          title="Klik untuk menyaring / toggle kegiatan dominan ini (Multi-Select)"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Kegiatan Dominan</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div
              className="text-sm font-bold text-slate-900 truncate"
              title={kpiData.kegiatanDominan?.name || '-'}
            >
              {kpiData.kegiatanDominan?.name || '-'}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
              {kpiData.kegiatanDominan ? `${kpiData.kegiatanDominan.count} informasi` : 'Belum ada data'}
            </p>
          </div>
        </div>

        {/* KPI 6: Tokoh Dominan */}
        <div
          onClick={() => {
            if (kpiData.tokohDominan?.name) {
              toggleFilter('tokoh', kpiData.tokohDominan.name);
            }
          }}
          className={`bg-white rounded-xl p-4 border shadow-sm flex flex-col justify-between transition-all cursor-pointer ${
            filters.tokoh &&
            kpiData.tokohDominan?.name &&
            (Array.isArray(filters.tokoh) ? filters.tokoh : [filters.tokoh]).some(
              (t) => t.toLowerCase() === kpiData.tokohDominan!.name.toLowerCase()
            )
              ? 'bg-indigo-50/90 border-indigo-400 ring-1 ring-indigo-400 shadow-xs'
              : 'border-slate-200/90 hover:border-indigo-300'
          }`}
          title="Klik untuk menyaring / toggle tokoh dominan ini (Multi-Select)"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tokoh Dominan</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <div
              className="text-sm font-bold text-slate-900 truncate"
              title={kpiData.tokohDominan?.name || '-'}
            >
              {kpiData.tokohDominan?.name || '-'}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
              {kpiData.tokohDominan ? `${kpiData.tokohDominan.count} informasi` : 'Belum ada data'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Compact OSINT Quick Bar (Non-intrusive Complementary Indicator) */}
      <div className="bg-gradient-to-r from-slate-900 via-navy-950 to-slate-900 text-white px-4 py-2.5 rounded-xl border border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-200">
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>Suplemen OSINT:</span>
          </div>
          <span className="text-blue-300 font-medium">
            {Array.isArray(filters.negara) && filters.negara.length > 0
              ? `Trending News — ${filters.negara.join(', ')}`
              : Array.isArray(filters.benua) &&
                filters.benua.length > 0 &&
                !filters.benua.includes('Semua')
              ? `Trending News — Kawasan ${filters.benua.join(', ')}`
              : 'Trending News — Global'}
          </span>
          <span className="hidden md:inline text-slate-500">•</span>
          <span className="hidden md:inline text-slate-400 text-[11px]">
            Fokus utama analitis: data internal database pada grafik dan peta di bawah.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsNewsDrawerOpen(true)}
            className="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 hover:text-white border border-blue-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            title="Buka panel berita tren di samping tanpa menutupi grafik database"
          >
            <PanelRightOpen className="w-3.5 h-3.5" />
            <span>Buka di Samping</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('trending-news-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Gulir ke bagian suplemen berita di bawah"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>Lihat di Bawah</span>
          </button>
        </div>
      </div>

      {/* 4. Middle Section: Interactive Trend Line Chart & Amerop Choropleth Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <TrendLineChart />
        </div>
        <div className="lg:col-span-5">
          <AmeropChoroplethMap />
        </div>
      </div>

      {/* 5. Analisis Aktor & Operasional Intelijen: Tokoh, Kegiatan, Bentuk Kegiatan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <TokohBarChart />
        <KegiatanBarChart />
        <BentukKegiatanBarChart />
      </div>

      {/* 6. Bottom Section: 9 Components Bar Chart, Top 10 Countries, Donut Chart, and Strategic Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 9 Components Bar Chart */}
        <div className="lg:col-span-4">
          <ComponentsBarChart />
        </div>

        {/* Top 10 Countries & Donut Benua */}
        <div className="lg:col-span-4 space-y-6">
          <TopCountriesBarChart />
          <ContinentDonutChart />
        </div>

        {/* Strategic Intelligence Insights */}
        <div className="lg:col-span-4">
          <InsightsPanel />
        </div>
      </div>

      {/* 6. Supplementary OSINT Section: Trending News Intelligence (Complementary & Collapsible) */}
      <TrendingNewsSection
        id="trending-news-section"
        defaultCollapsed={false}
        onOpenSideDrawer={() => setIsNewsDrawerOpen(true)}
      />

      {/* Slide-over Side Drawer for OSINT Trending News */}
      <TrendingNewsDrawer
        isOpen={isNewsDrawerOpen}
        onClose={() => setIsNewsDrawerOpen(false)}
        onScrollToBottom={() => {
          const el = document.getElementById('trending-news-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Floating OSINT Drawer Quick-Trigger */}
      {!isNewsDrawerOpen && (
        <button
          type="button"
          onClick={() => setIsNewsDrawerOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-slate-900/90 hover:bg-slate-900 text-white px-3.5 py-2.5 rounded-full shadow-lg border border-slate-700/80 flex items-center gap-2 text-xs font-semibold backdrop-blur-sm transition-all hover:scale-105 cursor-pointer group"
          title="Buka panel berita tren di samping"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <Flame className="w-4 h-4 text-rose-500" />
          <span className="hidden sm:inline">OSINT News</span>
          <PanelRightOpen className="w-3.5 h-3.5 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      )}
    </div>
  );
};
