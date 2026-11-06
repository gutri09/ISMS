import React, { useState } from 'react';
import { useIntelligence } from '../../context/IntelligenceContext';
import {
  Shield,
  Lock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Database,
  Users,
  Compass,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { UserRole } from '../../types';

export const LoginPage: React.FC = () => {
  const { login, apiOnline } = useIntelligence();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Harap isi username dan kata sandi.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await login(username, password);
      if (!res.success) {
        setError(res.error || 'Username atau kata sandi tidak valid.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem saat mencoba masuk.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background Intelligence Grid & Glow Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-5xl z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Col: Strategic Brief & System Identity */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Portal Intelijen Strategis Pertahanan
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                <Shield className="w-8 h-8" />
              </div>
              <span>ISMS</span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed">
              Intelligence Strategic Monitoring System
            </p>
          </div>

          {/* Database & Engine Status Indicator */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Status Basis Data:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                PostgreSQL Enterprise {apiOnline ? '(Terkoneksi API :3001)' : '(Mode Hybrid Siaga)'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Klasifikasi Keamanan:</span>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                RAHASIA / RESTRICTED
              </span>
            </div>
          </div>

          {/* Role Access Matrix Guide */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">Matriks Hak Akses Peran:</h3>
            <div className="grid grid-cols-1 gap-2.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition-colors">
                <div className="flex items-center gap-2 font-bold text-purple-400">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>1. Akun Admin (Superadmin)</span>
                </div>
                <p className="text-slate-400 mt-1 text-[11px] leading-relaxed">
                  Akses penuh: Mengatur akun pengguna, kelola basis data, konfigurasi kebutuhan input (tambah benua, negara, bidang, template kegiatan), serta pencadangan & pemulihan snapshot data.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 transition-colors">
                <div className="flex items-center gap-2 font-bold text-blue-400">
                  <Database className="w-4 h-4 text-blue-400" />
                  <span>2. Akun Analis</span>
                </div>
                <p className="text-slate-400 mt-1 text-[11px] leading-relaxed">
                  Akses operasional: Dashboard intelijen, input data manual & massal (Excel), lihat data terpantau, edit/hapus data individual & massal, serta pencadangan data lokal/server.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition-colors">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <Compass className="w-4 h-4 text-amber-400" />
                  <span>3. Akun Pimpinan</span>
                </div>
                <p className="text-slate-400 mt-1 text-[11px] leading-relaxed">
                  Akses peninjauan eksklusif: Dashboard pemantauan visual, grafik analitik lengkap, lihat data terpantau (hanya baca / view-only, tanpa wewenang edit, hapus, maupun backup data).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Login Card Form */}
        <div className="lg:col-span-6">
          <div className="w-full max-w-md mx-auto bg-slate-900/90 border border-slate-800/90 rounded-2xl shadow-2xl shadow-black/80 backdrop-blur-xl p-6 sm:p-8 space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white tracking-tight">Otentikasi Pengguna</h2>
                <div className="p-2 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-300">
                  <Lock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Masukkan kredensial resmi untuk mengakses sistem informasi intelijen.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Nama Pengguna / Username</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin / analis / pimpinan"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Kata Sandi / Password</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Sistem</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
              ISMS Enterprise v2.5 • Terintegrasi PostgreSQL 16 & RBAC Security Engine
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
