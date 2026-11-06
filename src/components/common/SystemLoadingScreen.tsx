import React, { useState, useEffect } from 'react';
import { Shield, Database, Radio, RefreshCw, AlertCircle } from 'lucide-react';

interface SystemLoadingScreenProps {
  onBypass?: () => void;
  message?: string;
  subMessage?: string;
}

export const SystemLoadingScreen: React.FC<SystemLoadingScreenProps> = ({
  onBypass,
  message = 'Menghubungkan ke Basis Data Intelijen Terpusat...',
  subMessage = 'Sedang mengunduh dan menyinkronkan seluruh rekaman data dari database server...',
}) => {
  const [showBypass, setShowBypass] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    const timeout = setTimeout(() => {
      setShowBypass(true);
    }, 6000);

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950 text-white select-none px-4">
      {/* Background Tactical Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b22_1px,transparent_1px),linear-gradient(to_bottom,#1e293b22_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>

      {/* Radial glow */}
      <div className="absolute w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-md w-full flex flex-col items-center text-center p-8 rounded-2xl bg-navy-900/90 border border-blue-900/50 shadow-2xl backdrop-blur-md">
        {/* Animated Radar Shield Visual */}
        <div className="relative mb-6">
          {/* Outer Pulsing Ring */}
          <div className="absolute -inset-4 rounded-full border border-blue-500/30 animate-ping opacity-75"></div>
          <div className="absolute -inset-2 rounded-full border border-cyan-400/40 animate-pulse"></div>

          {/* Central Shield Icon Container */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center border border-blue-400/50 shadow-lg shadow-blue-500/20 relative">
            <Shield className="w-10 h-10 text-cyan-200" />
            <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
        </div>

        {/* Institution Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800 text-[10px] font-mono tracking-widest uppercase text-cyan-300 mb-3 shadow-inner">
          <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
          <span>ISMS STRATEGIC INTELLIGENCE</span>
        </div>

        {/* System Title */}
        <h1 className="text-base font-bold text-white tracking-wide uppercase mb-1">
          Analis Intelijen Strategis
        </h1>
        <p className="text-xs text-slate-400 font-medium mb-6">
          Kawasan Amerika & Eropa
        </p>

        {/* Loading Progress Bar */}
        <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden mb-4 border border-slate-700/60 p-0.5">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600 animate-[shimmer_2s_infinite] bg-[length:200%_100%] transition-all duration-300"></div>
        </div>

        {/* Status Message */}
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-cyan-300 mb-1">
          <Database className="w-3.5 h-3.5 animate-spin" />
          <span>{message}</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
          {subMessage}
        </p>

        {/* Connection Timer */}
        <div className="text-[10px] font-mono text-slate-500">
          Waktu sinkronisasi: {seconds} detik
        </div>

        {/* Fallback Bypass Button if loading takes longer */}
        {showBypass && onBypass && (
          <div className="mt-5 pt-4 border-t border-slate-800 w-full animate-in fade-in duration-300">
            <button
              onClick={onBypass}
              type="button"
              className="w-full px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Buka dengan Cache Lokal Tersedia</span>
            </button>
            <p className="text-[10px] text-slate-500 mt-1.5">
              Gunakan jika server backend sedang memproses data dalam jumlah besar
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
