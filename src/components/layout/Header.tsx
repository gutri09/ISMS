import React, { useState, useEffect } from 'react';
import { useIntelligence } from '../../context/IntelligenceContext';
import { Shield, Clock, Globe2, RefreshCw, LogOut, ShieldCheck, Database, Compass } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const Header: React.FC = () => {
  const { currentUser, logout, lastUpdated, masterConfig } = useIntelligence();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = format(currentTime, 'EEEE, dd MMMM yyyy - HH:mm:ss', { locale: id });
  const formattedLastUpdated = lastUpdated
    ? format(new Date(lastUpdated), 'dd/MM/yyyy HH:mm', { locale: id })
    : '-';

  const role = currentUser?.role || 'analis';

  const getRoleLabel = () => {
    switch (role) {
      case 'admin':
        return {
          title: 'SUPERADMIN PENGENDALI',
          badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          avatarBg: 'bg-gradient-to-tr from-purple-700 to-indigo-600',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />,
        };
      case 'analis':
        return {
          title: 'ANALIS INTELIJEN',
          badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          avatarBg: 'bg-gradient-to-tr from-blue-700 to-cyan-600',
          icon: <Database className="w-3.5 h-3.5 text-blue-300" />,
        };
      case 'pimpinan':
        return {
          title: 'PIMPINAN SATUAN',
          badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          avatarBg: 'bg-gradient-to-tr from-amber-600 to-orange-600',
          icon: <Compass className="w-3.5 h-3.5 text-amber-300" />,
        };
    }
  };

  const roleMeta = getRoleLabel();

  const handleLogout = () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
      logout();
    }
  };

  return (
    <header className="bg-navy-900 border-b border-navy-800 text-white px-6 py-3 sticky top-0 z-30 shadow-md">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: Branding & Subtitle */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
            <Shield className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base md:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                ISMS
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  ENTERPRISE
                </span>
              </h1>
              <span className="text-slate-400 text-xs hidden lg:inline">|</span>
              <span className="text-xs text-slate-300 font-medium hidden lg:inline">
                INTELLIGENCE STRATEGIC MONITORING SYSTEM
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
              <Globe2 className="w-3.5 h-3.5 text-blue-400" />
              <span>
                Cakupan Pantauan:{' '}
                <strong className="text-slate-200">
                  {(masterConfig?.continents || ['Amerika', 'Eropa', 'Asia']).slice(0, 3).join(', ')}
                  {(masterConfig?.continents?.length || 0) > 3 && ` +${masterConfig.continents.length - 3}`}
                </strong>
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Sistem Aktif
              </span>
            </div>
          </div>
        </div>

        {/* Right: Timestamp, User & Logout Action */}
        <div className="flex items-center flex-wrap gap-3 text-xs">
          {/* Real-time Clock */}
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-navy-800/80 border border-navy-700/60 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono">{formattedDate} WIB</span>
          </div>

          {/* Last Updated Indicator */}
          <div className="hidden xl:flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-navy-800/80 border border-navy-700/60 text-slate-300">
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Pembaruan:</span>
            <span className="font-medium text-slate-200 font-mono">{formattedLastUpdated}</span>
          </div>

          {/* User Profile & Role Indicator */}
          {currentUser && (
            <div className="flex items-center space-x-3 pl-3 border-l border-navy-700/80">
              <div className={`w-8 h-8 rounded-full ${roleMeta.avatarBg} flex items-center justify-center text-white font-bold text-xs shadow-md border border-white/20`}>
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-white leading-tight">{currentUser.name}</p>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold border ${roleMeta.badgeClass}`}>
                    {roleMeta.icon}
                    <span>{roleMeta.title}</span>
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                title="Keluar / Logout Akun"
                className="p-1.5 rounded-lg bg-navy-800 hover:bg-red-500/20 border border-navy-700 hover:border-red-500/40 text-slate-400 hover:text-red-300 transition-all cursor-pointer ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
