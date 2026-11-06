import React, { useState, useMemo } from 'react';
import { useIntelligence } from '../../context/IntelligenceContext';
import {
  Database,
  Search,
  Filter,
  RotateCcw,
  Download,
  Eye,
  ExternalLink,
  Edit,
  Trash2,
  FileText,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  Globe2,
  Paperclip,
  CheckCircle2,
  Share2,
  Printer,
  Copy,
  Calendar,
  CalendarRange,
  Compass,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { STRATEGIC_COMPONENTS, getComponentMeta } from '../../constants/strategicComponents';
import { getCountriesByContinent } from '../../constants/countries';
import { IntelligenceRecord, StrategicComponent, Continent } from '../../types';
import { parseTokohList, normalizeMultipleTokoh } from '../../utils/tokohUtils';
import * as XLSX from 'xlsx';

export const LihatDataView: React.FC = () => {
  const {
    filteredRecords,
    records,
    filters,
    setFilter,
    resetFilters,
    deleteRecord,
    deleteRecords,
    updateRecord,
    currentUser,
    masterConfig,
  } = useIntelligence();

  const isPimpinan = currentUser?.role === 'pimpinan';

  // Local state for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sorting state
  const [sortField, setSortField] = useState<keyof IntelligenceRecord>('tanggal');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Modal states
  const [detailRecord, setDetailRecord] = useState<IntelligenceRecord | null>(null);
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState<IntelligenceRecord | null>(null);
  const [editRecord, setEditRecord] = useState<IntelligenceRecord | null>(null);
  const [previewFileModal, setPreviewFileModal] = useState<{ record: IntelligenceRecord; attachment: any } | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Checkbox Selection & Bulk Actions State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Available Continents dynamically from masterConfig & records
  const availableContinents = useMemo(() => {
    const fromConfig = masterConfig?.continents || ['Amerika', 'Eropa', 'Asia'];
    const fromRecords = records && Array.isArray(records)
      ? (records.map((r) => r?.benua).filter(Boolean) as string[])
      : [];
    return Array.from(new Set([...fromConfig, ...fromRecords]));
  }, [masterConfig?.continents, records]);

  // Available countries for filter dropdown
  const availableCountries = useMemo(() => {
    return getCountriesByContinent(filters.benua, masterConfig?.countries);
  }, [filters.benua, masterConfig?.countries]);

  // Dataset bounds for dates
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

  // Sorted and Paginated Data
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      const aVal = (a[sortField] || '') as string;
      const bVal = (b[sortField] || '') as string;

      if (sortDirection === 'asc') {
        return aVal.localeCompare(bVal);
      } else {
        return bVal.localeCompare(aVal);
      }
    });
  }, [filteredRecords, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, currentPage, pageSize]);

  // Handle Sort Toggle
  const handleSort = (field: keyof IntelligenceRecord) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Export Table Data to Excel
  const handleExportExcel = () => {
    const exportData = filteredRecords.map((r, i) => ({
      No: i + 1,
      Tanggal: r.tanggal,
      Benua: r.benua,
      Negara: r.negara,
      Kode_ISO: r.negaraCode,
      Bidang: r.bidang,
      Kegiatan: r.kegiatan,
      Bentuk_Kegiatan: r.bentukKegiatan,
      Isu_Utama: r.isuUtama,
      Tokoh: r.tokoh || '-',
      Sumber_URL: r.sumberUrl || '-',
      Status_Sumber: r.statusSumber,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Data_Intelijen_ISMS');
    XLSX.writeFile(wb, `ISMS_Data_Intelijen_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Handle Confirm Delete
  const handleExecuteDelete = async () => {
    if (deleteConfirmRecord) {
      await deleteRecord(deleteConfirmRecord.id);
      setDeleteConfirmRecord(null);
      showToast('success', '1 rekaman intelijen berhasil dihapus.');
    }
  };

  // Checkbox selection helpers
  const currentPageIds = useMemo(() => paginatedRecords.map((r) => r.id), [paginatedRecords]);

  const isAllCurrentPageSelected = useMemo(() => {
    if (currentPageIds.length === 0) return false;
    return currentPageIds.every((id) => selectedIds.has(id));
  }, [currentPageIds, selectedIds]);

  const isSomeCurrentPageSelected = useMemo(() => {
    return currentPageIds.some((id) => selectedIds.has(id)) && !isAllCurrentPageSelected;
  }, [currentPageIds, selectedIds, isAllCurrentPageSelected]);

  const handleToggleSelectRecord = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAllCurrentPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isAllCurrentPageSelected) {
        currentPageIds.forEach((id) => next.delete(id));
      } else {
        currentPageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    const allFilteredIds = filteredRecords.map((r) => r.id);
    setSelectedIds(new Set(allFilteredIds));
    showToast('info', `Seluruh ${allFilteredIds.length} data hasil filter dipilih.`);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleExecuteBulkDelete = async () => {
    const count = selectedIds.size;
    if (count === 0) return;

    await deleteRecords(Array.from(selectedIds));
    setSelectedIds(new Set());
    setBulkDeleteModalOpen(false);
    showToast('success', `${count} rekaman intelijen berhasil dihapus secara massal.`);
  };

  const handleExportSelectedExcel = () => {
    const selectedRecords = filteredRecords.filter((r) => selectedIds.has(r.id));
    if (selectedRecords.length === 0) return;

    const exportData = selectedRecords.map((r, i) => ({
      No: i + 1,
      Tanggal: r.tanggal,
      Benua: r.benua,
      Negara: r.negara,
      Kode_ISO: r.negaraCode,
      Bidang: r.bidang,
      Kegiatan: r.kegiatan,
      Bentuk_Kegiatan: r.bentukKegiatan,
      Isu_Utama: r.isuUtama,
      Tokoh: r.tokoh || '-',
      Sumber_URL: r.sumberUrl || '-',
      Status_Sumber: r.statusSumber,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Terpilih_ISMS');
    XLSX.writeFile(wb, `ISMS_Terpilih_${selectedRecords.length}_data_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('info', `${selectedRecords.length} rekaman terpilih berhasil diekspor ke Excel.`);
  };

  // Handle Edit Submit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRecord) return;

    await updateRecord(editRecord.id, {
      tanggal: editRecord.tanggal,
      benua: editRecord.benua,
      negara: editRecord.negara,
      bidang: editRecord.bidang,
      kegiatan: editRecord.kegiatan,
      bentukKegiatan: editRecord.bentukKegiatan,
      isuUtama: editRecord.isuUtama,
      tokoh: normalizeMultipleTokoh(editRecord.tokoh) || undefined,
      sumberUrl: editRecord.sumberUrl,
    });

    setEditRecord(null);
  };

  // Copy Brief text
  const handleCopyBrief = (rec: IntelligenceRecord) => {
    const text = `[LAPORAN INTELIJEN STRATEGIS - ISMS]\nTanggal: ${rec.tanggal}\nNegara: ${rec.negara} (${rec.benua})\nBidang: ${rec.bidang}\nKegiatan: ${rec.kegiatan} - ${rec.bentukKegiatan}\nTokoh: ${rec.tokoh || '-'}\n\nISU UTAMA:\n${rec.isuUtama}\n\nSumber: ${rec.sumberUrl || 'Dokumen Internal'}`;
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions Bar */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-600" />
            Pusat Repositori Data Intelijen
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Menampilkan {filteredRecords.length} dari {records.length} total rekaman intelijen terdaftar
            {selectedIds.size > 0 && (
              <span className="ml-2 font-semibold text-blue-600">
                • {selectedIds.size} data terpilih
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isPimpinan && (
            <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs font-semibold flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-600" />
              <span>Mode Peninjauan Pimpinan (Baca Saja)</span>
            </div>
          )}

          {!isPimpinan && selectedIds.size > 0 && (
            <button
              onClick={() => setBulkDeleteModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              title="Hapus data yang dicentang secara massal"
            >
              <Trash2 className="w-4 h-4" />
              Hapus Terpilih ({selectedIds.size})
            </button>
          )}

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Ekspor Excel ({filteredRecords.length})
          </button>
        </div>
      </div>

      {/* 2. Global Search & Filter Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari negara, bidang, kegiatan, bentuk kegiatan, isu utama, tokoh, atau sumber..."
              value={filters.searchQuery}
              onChange={(e) => {
                setFilter('searchQuery', e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Preset Filter */}
            <select
              value={filters.datePreset}
              onChange={(e) => {
                const val = e.target.value as any;
                setFilter('datePreset', val);
                if (val === 'custom') {
                  if (!filters.startDate) setFilter('startDate', minDate);
                  if (!filters.endDate) setFilter('endDate', maxDate);
                }
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">Semua Waktu</option>
              <option value="7d">7 Hari Terakhir</option>
              <option value="30d">30 Hari Terakhir</option>
              <option value="90d">90 Hari Terakhir</option>
              <option value="custom">📅 Kustom / Manual...</option>
            </select>

            {/* Continent Filter */}
            <select
              value={
                Array.isArray(filters.benua)
                  ? filters.benua[0] || 'Semua'
                  : filters.benua || 'Semua'
              }
              onChange={(e) => {
                setFilter('benua', e.target.value === 'Semua' ? [] : [e.target.value]);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="Semua">Semua Kawasan</option>
              {availableContinents.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            {/* Country Filter */}
            <select
              value={
                Array.isArray(filters.negara)
                  ? filters.negara[0] || ''
                  : filters.negara || ''
              }
              onChange={(e) => {
                setFilter('negara', e.target.value ? [e.target.value] : []);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 max-w-[160px]"
            >
              <option value="">Semua Negara</option>
              {availableCountries.map((c) => (
                <option key={c.code} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Strategic Component Filter */}
            <select
              value={
                Array.isArray(filters.bidang)
                  ? filters.bidang[0] || ''
                  : filters.bidang || ''
              }
              onChange={(e) => {
                setFilter('bidang', e.target.value ? [e.target.value] : []);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 max-w-[160px]"
            >
              <option value="">Semua 9 Bidang</option>
              {STRATEGIC_COMPONENTS.map((comp) => (
                <option key={comp.id} value={comp.name}>
                  {comp.name}
                </option>
              ))}
            </select>

            {/* Reset Filter Button */}
            <button
              onClick={() => {
                resetFilters();
                setCurrentPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-600 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset Filter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Custom Date Range Panel in Repository */}
        {filters.datePreset === 'custom' && (
          <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-700 flex items-center gap-1">
                <CalendarRange className="w-3.5 h-3.5 text-blue-600" />
                Rentang Tanggal:
              </span>
              <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-300">
                <span className="text-slate-500 text-[11px]">Dari:</span>
                <input
                  type="date"
                  value={filters.startDate || minDate}
                  min={minDate}
                  max={filters.endDate || maxDate}
                  onChange={(e) => {
                    setFilter('startDate', e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
                />
              </div>
              <span className="text-slate-400 font-bold">s/d</span>
              <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-300">
                <span className="text-slate-500 text-[11px]">Sampai:</span>
                <input
                  type="date"
                  value={filters.endDate || maxDate}
                  min={filters.startDate || minDate}
                  max={maxDate}
                  onChange={(e) => {
                    setFilter('endDate', e.target.value);
                    setCurrentPage(1);
                  }}
                  className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
                />
              </div>
              <span className="text-blue-700 font-semibold px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-[11px]">
                {filteredRecords.length} rekaman ({formatDateIndo(filters.startDate || minDate)} – {formatDateIndo(filters.endDate || maxDate)})
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setFilter('startDate', '2026-01-01');
                  setFilter('endDate', '2026-03-31');
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] cursor-pointer"
              >
                Q1
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilter('startDate', '2026-04-01');
                  setFilter('endDate', '2026-06-30');
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] cursor-pointer"
              >
                Q2
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilter('startDate', '2026-07-01');
                  setFilter('endDate', '2026-09-30');
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] cursor-pointer"
              >
                Q3
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilter('startDate', minDate);
                  setFilter('endDate', maxDate);
                  setCurrentPage(1);
                }}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-[11px] cursor-pointer"
              >
                Semua Rentang
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2.1 Bilah Aksi Pemilihan Massal (Bulk Action Bar) */}
      {!isPimpinan && selectedIds.size > 0 && (
        <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 text-white p-3.5 rounded-xl border border-blue-800/80 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {selectedIds.size}
              </span>
              <span className="font-semibold text-xs text-white">
                Data Intelijen Dipilih
              </span>
            </div>

            <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>

            {selectedIds.size < filteredRecords.length ? (
              <button
                type="button"
                onClick={handleSelectAllFiltered}
                className="text-xs text-blue-300 hover:text-white underline font-medium cursor-pointer flex items-center gap-1"
              >
                <span>Pilih seluruh {filteredRecords.length} data hasil filter</span>
              </button>
            ) : (
              <span className="text-[11px] text-emerald-400 font-medium bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-700">
                ✓ Seluruh {filteredRecords.length} data terfilter dipilih
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportSelectedExcel}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 hover:text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Unduh data terpilih dalam format Excel"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ekspor Terpilih ({selectedIds.size})</span>
            </button>

            <button
              type="button"
              onClick={() => setBulkDeleteModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              title="Hapus permanen semua data yang sedang dicentang"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus {selectedIds.size} Data Terpilih</span>
            </button>

            <button
              type="button"
              onClick={handleClearSelection}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              title="Batalkan centang semua data"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* 3. Interactive Data Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-navy-950 text-slate-200 uppercase font-semibold text-[11px] tracking-wider select-none">
              <tr>
                {/* Kolom Kotak Centang Header (Pilih Semua di Halaman Ini) */}
                {!isPimpinan && (
                  <th className="py-3 px-3 text-center w-12 select-none">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={isAllCurrentPageSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isSomeCurrentPageSelected;
                        }}
                        onChange={handleToggleSelectAllCurrentPage}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                        title={
                          isAllCurrentPageSelected
                            ? "Batalkan pilihan semua di halaman ini"
                            : "Pilih semua data di halaman ini"
                        }
                      />
                    </div>
                  </th>
                )}
                <th
                  onClick={() => handleSort('tanggal')}
                  className="py-3 px-3.5 cursor-pointer hover:bg-navy-900 transition-colors whitespace-nowrap"
                >
                  Tanggal {sortField === 'tanggal' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('benua')}
                  className="py-3 px-3 cursor-pointer hover:bg-navy-900 transition-colors whitespace-nowrap"
                >
                  Benua {sortField === 'benua' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('negara')}
                  className="py-3 px-3.5 cursor-pointer hover:bg-navy-900 transition-colors whitespace-nowrap"
                >
                  Negara {sortField === 'negara' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('bidang')}
                  className="py-3 px-3.5 cursor-pointer hover:bg-navy-900 transition-colors whitespace-nowrap"
                >
                  Bidang {sortField === 'bidang' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-3 px-3.5 whitespace-nowrap">Kegiatan</th>
                <th className="py-3 px-3.5 whitespace-nowrap">Bentuk Kegiatan</th>
                <th className="py-3 px-4 min-w-[220px]">Isu Utama</th>
                <th className="py-3 px-3 whitespace-nowrap">Tokoh</th>
                <th className="py-3 px-3 whitespace-nowrap text-center">Sumber</th>
                <th className="py-3 px-3.5 whitespace-nowrap text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((item) => {
                  const meta = getComponentMeta(item.bidang);
                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors group ${
                        selectedIds.has(item.id)
                          ? 'bg-blue-50/90 font-medium'
                          : 'hover:bg-blue-50/40'
                      }`}
                    >
                      {/* Checkbox Row Cell */}
                      {!isPimpinan && (
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(item.id)}
                            onChange={() => handleToggleSelectRecord(item.id)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                            title={`Pilih rekaman ${item.negara} (${item.tanggal})`}
                          />
                        </td>
                      )}

                      {/* Tanggal */}
                      <td className="py-3 px-3.5 font-mono text-slate-600 whitespace-nowrap font-medium">
                        {item.tanggal}
                      </td>

                      {/* Benua */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            item.benua === 'Amerika'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.benua}
                        </span>
                      </td>

                      {/* Negara */}
                      <td className="py-3 px-3.5 font-semibold text-slate-800 whitespace-nowrap">
                        {item.negara}
                      </td>

                      {/* Bidang */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className="px-2 py-0.5 rounded-full text-[11px] font-medium inline-flex items-center gap-1"
                          style={{
                            backgroundColor: meta.bgColor,
                            color: meta.color,
                            border: `1px solid ${meta.borderColor}`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: meta.color }}
                          ></span>
                          {item.bidang}
                        </span>
                      </td>

                      {/* Kegiatan */}
                      <td className="py-3 px-3.5 font-medium text-slate-700 whitespace-nowrap">
                        {item.kegiatan}
                      </td>

                      {/* Bentuk Kegiatan */}
                      <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap">
                        {item.bentukKegiatan}
                      </td>

                      {/* Isu Utama */}
                      <td className="py-3 px-4 text-slate-700 line-clamp-2 max-w-sm" title={item.isuUtama}>
                        {item.isuUtama}
                      </td>

                      {/* Tokoh */}
                      <td className="py-3 px-3 text-slate-600">
                        {item.tokoh ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {parseTokohList(item.tokoh).map((t, idx) => (
                              <span
                                key={idx}
                                className="inline-block px-1.5 py-0.5 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-[11px] font-medium border border-slate-200 transition-colors"
                                title={t}
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* Sumber */}
                      <td className="py-3 px-3 whitespace-nowrap text-center">
                        {item.sumberUrl ? (
                          <a
                            href={item.sumberUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                            title={item.sumberUrl}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            URL
                          </a>
                        ) : item.attachments && item.attachments.length > 0 ? (
                          <button
                            onClick={() => setPreviewFileModal({ record: item, attachment: item.attachments![0] })}
                            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-medium"
                            title="Pratinjau Dokumen Lampiran"
                          >
                            <Paperclip className="w-3.5 h-3.5" />
                            File ({item.attachments.length})
                          </button>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-mono">
                            Belum Dilengkapi
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-3.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setDetailRecord(item)}
                            className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Lihat Detail Lengkap"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {!isPimpinan && (
                            <>
                              <button
                                onClick={() => setEditRecord(item)}
                                className="p-1 rounded text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Edit Rekaman Data"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmRecord(item)}
                                className="p-1 rounded text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Hapus Rekaman"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isPimpinan ? 10 : 11} className="py-12 text-center text-slate-400">
                    <Database className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-semibold text-slate-600">
                      Tidak Ada Data yang Sesuai dengan Parameter Filter
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Silakan sesuaikan kata kunci pencarian atau klik Reset Filter
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 4. Table Pagination Controls */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Tampilkan</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-700 font-semibold focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>baris per halaman (Total {sortedRecords.length} data)</span>
            {selectedIds.size > 0 && (
              <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                • {selectedIds.size} data dipilih
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono">
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded border border-slate-300 hover:bg-white text-slate-600 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded border border-slate-300 hover:bg-white text-slate-600 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. MODAL: LIHAT DETAIL LENGKAP */}
      {detailRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="bg-navy-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm tracking-wide">
                  Detail Rekaman Informasi Intelijen
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyBrief(detailRecord)}
                  className="px-2.5 py-1 rounded bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                  title="Salin Ringkasan Laporan"
                >
                  {copyFeedback ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-blue-400" />
                      Salin Brief
                    </>
                  )}
                </button>
                <button
                  onClick={() => setDetailRecord(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">
                    Tanggal
                  </span>
                  <p className="font-bold font-mono text-slate-900 mt-0.5">
                    {detailRecord.tanggal}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">
                    Kawasan (Benua)
                  </span>
                  <p className="font-bold text-slate-900 mt-0.5">{detailRecord.benua}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">
                    Negara
                  </span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {detailRecord.negara} ({detailRecord.negaraCode})
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">
                    Bidang
                  </span>
                  <p className="font-bold text-blue-700 mt-0.5">{detailRecord.bidang}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">
                    Kegiatan Pokok
                  </span>
                  <p className="font-semibold text-slate-900 mt-1">{detailRecord.kegiatan}</p>
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">
                    Bentuk Kegiatan
                  </span>
                  <p className="font-semibold text-slate-900 mt-1">
                    {detailRecord.bentukKegiatan}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                <span className="text-[11px] text-slate-400 uppercase font-semibold">
                  Isu Utama & Narasi Peristiwa
                </span>
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap text-sm">
                  {detailRecord.isuUtama}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">
                    Tokoh / Institusi
                  </span>
                  {detailRecord.tokoh ? (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {parseTokohList(detailRecord.tokoh).map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="font-semibold text-slate-400 mt-1 italic text-xs">Tidak tercantum</p>
                  )}
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold">
                    Tautan Sumber
                  </span>
                  {detailRecord.sumberUrl ? (
                    <a
                      href={detailRecord.sumberUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block font-semibold text-blue-600 hover:underline mt-1 truncate"
                    >
                      {detailRecord.sumberUrl}
                    </a>
                  ) : (
                    <p className="text-slate-400 mt-1 italic">Tautan URL tidak dicantumkan</p>
                  )}
                </div>
              </div>

              <div className="pt-2 text-[10px] text-slate-400 flex items-center justify-between font-mono">
                <span>ID: {detailRecord.id}</span>
                <span>Dibuat: {detailRecord.createdAt}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setDetailRecord(null)}
                className="px-5 py-2 rounded-lg bg-slate-800 text-white font-semibold text-xs hover:bg-slate-900"
              >
                Tutup Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: EDIT DATA */}
      {editRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in duration-200"
          >
            <div className="bg-navy-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Edit className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm tracking-wide">
                  Edit Rekaman Informasi Intelijen
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditRecord(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tanggal *</label>
                  <input
                    type="date"
                    required
                    value={editRecord.tanggal}
                    onChange={(e) => setEditRecord({ ...editRecord, tanggal: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Benua *</label>
                  <select
                    value={editRecord.benua}
                    onChange={(e) => setEditRecord({ ...editRecord, benua: e.target.value as Continent })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    <option value="Amerika">Amerika</option>
                    <option value="Eropa">Eropa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Negara *</label>
                  <input
                    type="text"
                    required
                    value={editRecord.negara}
                    onChange={(e) => setEditRecord({ ...editRecord, negara: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Bidang *</label>
                <select
                  value={editRecord.bidang}
                  onChange={(e) => setEditRecord({ ...editRecord, bidang: e.target.value as StrategicComponent })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
                >
                  {STRATEGIC_COMPONENTS.map((comp) => (
                    <option key={comp.id} value={comp.name}>
                      {comp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Kegiatan *</label>
                  <input
                    type="text"
                    required
                    value={editRecord.kegiatan}
                    onChange={(e) => setEditRecord({ ...editRecord, kegiatan: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Bentuk Kegiatan *</label>
                  <input
                    type="text"
                    required
                    value={editRecord.bentukKegiatan}
                    onChange={(e) => setEditRecord({ ...editRecord, bentukKegiatan: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Isu Utama *</label>
                <textarea
                  required
                  rows={4}
                  value={editRecord.isuUtama}
                  onChange={(e) => setEditRecord({ ...editRecord, isuUtama: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 leading-relaxed"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1 flex flex-wrap items-center justify-between gap-1">
                    <span>Tokoh / Institusi</span>
                    <span className="text-[10px] text-slate-500 font-normal">Pemisah: koma (,) atau titik koma (;)</span>
                  </label>
                  <input
                    type="text"
                    value={editRecord.tokoh || ''}
                    placeholder="Contoh: Donald Trump, Vladimir Putin; Emmanuel Macron"
                    onChange={(e) => setEditRecord({ ...editRecord, tokoh: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                  {editRecord.tokoh && parseTokohList(editRecord.tokoh).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {parseTokohList(editRecord.tokoh).map((t, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-200">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tautan Sumber URL</label>
                  <input
                    type="url"
                    value={editRecord.sumberUrl || ''}
                    onChange={(e) => setEditRecord({ ...editRecord, sumberUrl: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditRecord(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 7. MODAL: PREVIEW BERKAS DOKUMEN / PRODUK INTELIJEN */}
      {previewFileModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden animate-in fade-in duration-200">
            <div className="bg-navy-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-xs tracking-wide">
                    Pratinjau Dokumen Lampiran Produk Intelijen
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {previewFileModal.attachment.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewFileModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700 max-h-[70vh] overflow-y-auto">
              {/* Simulated Secure Document Enclosure */}
              <div className="bg-slate-100 p-8 rounded-xl border border-slate-300 text-center space-y-3">
                <FileText className="w-16 h-16 text-blue-700 mx-auto" />
                <h4 className="font-bold text-sm text-slate-900">
                  {previewFileModal.attachment.name}
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  Ukuran: {(previewFileModal.attachment.size / 1024).toFixed(1)} KB • Tipe: {previewFileModal.attachment.mimeType || 'Dokumen'}
                </p>
                <div className="bg-white p-4 rounded-lg border border-slate-200 text-left text-xs max-w-xl mx-auto shadow-inner">
                  <span className="font-semibold text-slate-800 block mb-1">
                    Ringkasan Informasi Terkait:
                  </span>
                  <p className="text-slate-600 leading-relaxed italic">
                    "{previewFileModal.record.isuUtama}"
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Penyimpanan Privat Enkripsi Organisasi
              </span>
              <button
                onClick={() => setPreviewFileModal(null)}
                className="px-5 py-2 rounded-lg bg-slate-800 text-white font-semibold text-xs hover:bg-slate-900"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: KONFIRMASI HAPUS DATA */}
      {deleteConfirmRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-base text-slate-900">Konfirmasi Hapus Rekaman</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Apakah Anda yakin ingin menghapus informasi intelijen mengenai{' '}
                <strong className="text-slate-800 font-semibold">
                  "{deleteConfirmRecord.isuUtama.slice(0, 70)}..."
                </strong>
                ? Tindakan ini akan menghapus rekaman secara permanen dari basis data.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                onClick={() => setDeleteConfirmRecord(null)}
                className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleExecuteDelete}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-sm"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL: KONFIRMASI HAPUS MASSAL (BULK DELETE) */}
      {bulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="text-center">
              <h3 className="font-bold text-base text-slate-900">
                Konfirmasi Penghapusan Massal
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Apakah Anda yakin ingin menghapus secara permanen{' '}
                <strong className="text-red-600 font-bold text-sm">
                  {selectedIds.size} rekaman intelijen
                </strong>{' '}
                yang telah dicentang?
              </p>
            </div>

            {/* Breakdown box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 max-h-52 overflow-y-auto space-y-2">
              <div className="font-semibold text-slate-800 flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span>Daftar Sampel Data Terpilih:</span>
                <span className="text-blue-600 font-mono font-bold">{selectedIds.size} Rekaman</span>
              </div>
              <ul className="divide-y divide-slate-100 text-[11px] text-slate-600">
                {records
                  .filter((r) => selectedIds.has(r.id))
                  .slice(0, 6)
                  .map((r) => (
                    <li key={r.id} className="py-1.5 flex items-center justify-between gap-2">
                      <div className="truncate">
                        <span className="font-semibold text-slate-800 mr-1.5">{r.tanggal}</span>
                        <span className="text-blue-700 font-medium mr-1.5">[{r.negara}]</span>
                        <span className="text-slate-600 truncate">{r.isuUtama.slice(0, 50)}...</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{r.bidang}</span>
                    </li>
                  ))}
              </ul>
              {selectedIds.size > 6 && (
                <div className="text-center text-[10px] text-slate-400 italic pt-1 border-t border-slate-100">
                  ...dan {selectedIds.size - 6} rekaman lainnya
                </div>
              )}
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Peringatan Keamanan:</strong> Tindakan ini bersifat permanen dan tidak dapat dipulihkan (*irreversible*). Data akan dihapus dari penyimpanan basis data operasional.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBulkDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkDelete}
                className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Ya, Hapus {selectedIds.size} Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 10. TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-4 duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
              : toastMessage.type === 'error'
              ? 'bg-red-900 text-red-100 border-red-700'
              : 'bg-navy-950 text-blue-100 border-blue-800'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : toastMessage.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          ) : (
            <Database className="w-4 h-4 text-blue-400 flex-shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
