import React, { useState } from 'react';
import { useIntelligence } from '../../context/IntelligenceContext';
import {
  LayoutDashboard,
  FilePlus2,
  Database,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Layers,
  Save,
  ShieldCheck,
  Download,
  AlertTriangle,
  Check,
  X,
  History,
  Settings,
  Users,
  Compass,
} from 'lucide-react';
import { ActiveMenu, UserRole } from '../../types';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const {
    activeMenu,
    setActiveMenu,
    records,
    filteredRecords,
    backupInfo,
    saveBackup,
    restoreBackup,
    downloadBackupFile,
    currentUser,
  } = useIntelligence();

  // Modal confirmation state: 'save' | 'restore' | null
  const [confirmModal, setConfirmModal] = useState<'save' | 'restore' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const handleConfirmSave = async () => {
    setIsProcessing(true);
    try {
      const res = await saveBackup();
      setConfirmModal(null);
      showToast(`Cadangan baru berhasil disimpan (${res.count} rekaman). Cadangan lama telah digantikan.`, 'success');
    } catch (e: any) {
      showToast(`Gagal menyimpan cadangan: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmRestore = async () => {
    setIsProcessing(true);
    try {
      const res = await restoreBackup();
      setConfirmModal(null);
      showToast(`Data berhasil dipulihkan ke titik cadangan (${res.count} rekaman).`, 'success');
    } catch (e: any) {
      showToast(`Gagal memulihkan cadangan: ${e.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatBackupDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    try {
      const d = parseISO(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return format(d, 'dd/MM/yyyy HH:mm', { locale: id });
    } catch {
      return dateStr;
    }
  };

  const role = currentUser?.role || 'analis';

  // Dynamic menu items filtered by role
  const menuItems: { id: ActiveMenu; label: string; icon: React.ReactNode; badge?: number | string }[] = [];

  // 1. Dashboard: Available for all roles
  menuItems.push({
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    badge: filteredRecords.length > 0 ? filteredRecords.length : undefined,
  });

  // 2. Input Data: Admin & Analis only
  if (role === 'admin' || role === 'analis') {
    menuItems.push({
      id: 'input',
      label: 'Input Data',
      icon: <FilePlus2 className="w-5 h-5" />,
    });
  }

  // 3. Lihat Data: Available for all roles
  menuItems.push({
    id: 'data',
    label: role === 'pimpinan' ? 'Lihat Data (Pantau)' : 'Lihat Data',
    icon: <Database className="w-5 h-5" />,
    badge: records.length,
  });

  // 4. Konfigurasi Master Data: Admin only
  if (role === 'admin') {
    menuItems.push({
      id: 'master',
      label: 'Master Data',
      icon: <Settings className="w-5 h-5" />,
    });
  }

  // 5. Kelola Akun: Admin only
  if (role === 'admin') {
    menuItems.push({
      id: 'users',
      label: 'Kelola Pengguna',
      icon: <Users className="w-5 h-5" />,
    });
  }

  return (
    <>
      <aside
        className={`bg-navy-950 text-slate-300 border-r border-navy-800 transition-all duration-300 flex flex-col justify-between shrink-0 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Top Section */}
        <div>
          {/* Sidebar Header & Toggle */}
          <div className="h-14 flex items-center justify-between px-4 border-b border-navy-800/80">
            {!collapsed && (
              <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                Navigasi Strategis
              </span>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-md hover:bg-navy-800 text-slate-400 hover:text-white transition-colors mx-auto cursor-pointer"
              title={collapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Menus based on Role */}
          <nav className="p-3 space-y-1.5">
            {menuItems.map((item) => {
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 font-semibold'
                      : 'text-slate-300 hover:bg-navy-800/70 hover:text-white'
                  } ${collapsed ? 'justify-center' : 'justify-between'}`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                      } transition-colors`}
                    >
                      {item.icon}
                    </div>
                    {!collapsed && <span>{item.label}</span>}
                  </div>

                  {!collapsed && item.badge !== undefined && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-medium ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-navy-800 text-slate-400 group-hover:bg-navy-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {/* Tooltip if collapsed */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2.5 py-1 bg-navy-800 text-white text-xs rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                      {item.label}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Role Indicator & CADANGAN DATA (Only for Admin & Analis; Pimpinan has no backup) */}
        <div className="p-3 border-t border-navy-800/80 space-y-2.5">
          {/* User Role Badge in Sidebar */}
          {!collapsed ? (
            <div className="p-2.5 rounded-xl bg-navy-900/80 border border-navy-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    role === 'admin'
                      ? 'bg-purple-400 animate-pulse'
                      : role === 'pimpinan'
                      ? 'bg-amber-400'
                      : 'bg-blue-400'
                  }`}
                />
                <div>
                  <div className="text-[11px] font-bold text-white capitalize">
                    {role === 'admin' ? 'Superadmin' : role === 'pimpinan' ? 'Pimpinan Satuan' : 'Analis Intelijen'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                    @{currentUser?.username || 'user'}
                  </div>
                </div>
              </div>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                  role === 'admin'
                    ? 'bg-purple-500/20 text-purple-300'
                    : role === 'pimpinan'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-blue-500/20 text-blue-300'
                }`}
              >
                {role}
              </span>
            </div>
          ) : (
            <div className="flex justify-center" title={`Peran: ${role}`}>
              <div
                className={`w-3 h-3 rounded-full ${
                  role === 'admin' ? 'bg-purple-400' : role === 'pimpinan' ? 'bg-amber-400' : 'bg-blue-400'
                }`}
              />
            </div>
          )}

          {/* Backup & Restore: Hidden for Pimpinan */}
          {role !== 'pimpinan' && (
            <>
              {!collapsed ? (
                <div className="bg-navy-900/90 rounded-xl p-3 border border-navy-700/80 text-xs space-y-2.5 shadow-sm">
                  {/* Header Title & Status */}
                  <div className="flex items-center justify-between pb-1 border-b border-navy-800/80">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5 text-[11px] tracking-wide">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                      <span>CADANGAN DATA</span>
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                        backupInfo.exists
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-700 text-slate-400 border border-slate-600'
                      }`}
                    >
                      {backupInfo.exists ? 'Tersimpan' : 'Kosong'}
                    </span>
                  </div>

                  {/* Snapshot Info Box */}
                  <div className="space-y-1 bg-navy-950/70 p-2 rounded-lg border border-navy-800/80 text-[11px] font-mono">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Titik Cadangan:</span>
                      <strong className="text-emerald-400 font-bold">{backupInfo.count} data</strong>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Waktu Simpan:</span>
                      <span className="truncate max-w-[110px]" title={formatBackupDate(backupInfo.savedAt)}>
                        {formatBackupDate(backupInfo.savedAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400 pt-1 border-t border-navy-800/80">
                      <span>Data Aktif:</span>
                      <strong className="text-white font-bold">{records.length} data</strong>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setConfirmModal('save')}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-blue-200 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                      title="Simpan data aktif saat ini sebagai cadangan baru (menggantikan backup sebelumnya)"
                    >
                      <Save className="w-3.5 h-3.5 text-blue-400" />
                      <span>Simpan Backup Data</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmModal('restore')}
                      disabled={!backupInfo.exists}
                      className={`w-full py-1.5 px-2.5 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                        backupInfo.exists
                          ? 'bg-amber-600/25 hover:bg-amber-600/40 border-amber-500/40 text-amber-200 hover:text-amber-100'
                          : 'bg-navy-800/50 border-navy-800 text-slate-500 cursor-not-allowed'
                      }`}
                      title={
                        backupInfo.exists
                          ? `Pulihkan data ke titik cadangan (${backupInfo.count} data). Sangat berguna jika salah memasukkan data bulk.`
                          : 'Belum ada cadangan yang tersimpan'
                      }
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pulihkan dari Backup</span>
                    </button>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={downloadBackupFile}
                        className="w-full py-1.5 px-2 rounded-md bg-navy-800 hover:bg-navy-700 text-slate-300 text-[10px] font-medium flex items-center justify-center gap-1.5 transition-colors border border-navy-700 cursor-pointer"
                        title="Unduh berkas JSON cadangan ke komputer"
                      >
                        <Download className="w-3 h-3 text-slate-400" />
                        <span>Ekspor Berkas Cadangan (.JSON)</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-1">
                  <button
                    type="button"
                    onClick={() => setConfirmModal('save')}
                    className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 transition-colors cursor-pointer"
                    title={`Simpan Backup Data (${records.length} data)`}
                  >
                    <Save className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmModal('restore')}
                    disabled={!backupInfo.exists}
                    className={`p-2 rounded-lg transition-colors cursor-pointer ${
                      backupInfo.exists
                        ? 'bg-amber-600/20 hover:bg-amber-600/40 text-amber-300'
                        : 'bg-navy-800 text-slate-600 cursor-not-allowed'
                    }`}
                    title={
                      backupInfo.exists
                        ? `Pulihkan ke Backup (${backupInfo.count} data)`
                        : 'Belum ada backup'
                    }
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* Read-Only Notice for Pimpinan */}
          {role === 'pimpinan' && !collapsed && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-tight flex items-start gap-2">
              <Compass className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Mode Peninjauan Pimpinan: Akses pemantauan visual & data tanpa wewenang mutasi data.</span>
            </div>
          )}
        </div>
      </aside>

      {/* MODAL KONFIRMASI: SIMPAN BACKUP (REPLACE) ATAU PULIHKAN DATA */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div
              className={`p-5 flex items-center justify-between text-white ${
                confirmModal === 'save'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-700'
                  : 'bg-gradient-to-r from-amber-600 to-orange-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {confirmModal === 'save' ? (
                  <div className="p-2 bg-white/10 rounded-lg">
                    <Save className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <div className="p-2 bg-white/10 rounded-lg">
                    <History className="w-5 h-5 text-white" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-sm">
                    {confirmModal === 'save' ? 'Simpan Backup Data' : 'Pulihkan Data dari Backup'}
                  </h3>
                  <p className="text-xs text-white/80">
                    {confirmModal === 'save'
                      ? 'Membuat / Memperbarui titik pemulihan'
                      : 'Mengembalikan database ke titik cadangan'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-600 leading-relaxed">
              {confirmModal === 'save' ? (
                <>
                  <p>
                    Anda akan menyimpan <strong>{records.length} data aktif saat ini</strong> ke dalam
                    penyimpanan cadangan (*backup snapshot*).
                  </p>

                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-900 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-[11px] font-bold text-amber-950">
                        Peringatan Pergantian (*Replace*):
                      </strong>
                      <span className="text-[11px]">
                        Penyimpanan ini akan <strong>menimpa / menggantikan</strong> cadangan yang sudah
                        tersimpan sebelumnya ({backupInfo.count} data dari {formatBackupDate(backupInfo.savedAt)}).
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Jumlah data yang dicadangkan:</span>
                      <strong className="text-blue-700 font-bold">{records.length} rekaman</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Waktu snapshot:</span>
                      <strong className="text-slate-700">{format(new Date(), 'dd MMM yyyy, HH:mm:ss')}</strong>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    Apakah Anda yakin ingin memulihkan database ke titik cadangan yang telah tersimpan?
                  </p>

                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-blue-900 flex items-start gap-2.5">
                    <History className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-[11px] font-bold text-blue-950">
                        Solusi Kesalahan Input Bulk:
                      </strong>
                      <span className="text-[11px]">
                        Semua data bulk yang baru saja dimasukkan (atau perubahan yang salah) akan
                        dibatalkan dan dikembalikan tepat seperti data cadangan terakhir.
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px] space-y-1.5">
                    <div className="flex justify-between items-center text-emerald-700 font-semibold">
                      <span>📦 Data Cadangan (Akan dipulihkan):</span>
                      <span className="bg-emerald-100 px-2 py-0.5 rounded text-emerald-800 font-bold">
                        {backupInfo.count} data
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[10px]">
                      <span>Waktu Cadangan Disimpan:</span>
                      <span>{formatBackupDate(backupInfo.savedAt)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 pt-1 border-t border-slate-200">
                      <span>📊 Data Aktif Saat Ini:</span>
                      <span className="font-bold text-slate-800">{records.length} data</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                disabled={isProcessing}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
              >
                Batal
              </button>

              {confirmModal === 'save' ? (
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  disabled={isProcessing}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isProcessing ? 'Menyimpan...' : 'Ya, Simpan Backup (Replace)'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmRestore}
                  disabled={isProcessing}
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isProcessing ? 'Memulihkan...' : 'Ya, Pulihkan Sekarang'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 animate-in slide-in-from-bottom duration-300">
          <div
            className={`px-4 py-3 rounded-xl shadow-xl border flex items-center gap-2.5 text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-slate-900 text-white border-emerald-500/40 shadow-emerald-950/20'
                : 'bg-rose-900 text-white border-rose-500/40'
            }`}
          >
            {toast.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </>
  );
};
