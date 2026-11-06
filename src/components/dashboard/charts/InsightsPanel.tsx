import React, { useMemo } from 'react';
import { useIntelligence } from '../../../context/IntelligenceContext';
import { Sparkles, ShieldCheck, CheckCircle2, TrendingUp, Info } from 'lucide-react';

export const InsightsPanel: React.FC = () => {
  const { filteredRecords, kpiData, filters } = useIntelligence();

  // Generate rule-based objective narrative
  const insightSynthesis = useMemo(() => {
    if (!filteredRecords || filteredRecords.length === 0) {
      return {
        narrative:
          'Tidak terdapat rekaman informasi pada parameter filter yang aktif saat ini. Silakan sesuaikan atau reset filter untuk menghasilkan telaah intelijen strategis.',
        highlights: [],
      };
    }

    const total = filteredRecords.length;
    const topField = kpiData.komponenDominan ? kpiData.komponenDominan.name : 'beragam';
    const topFieldCount = kpiData.komponenDominan ? kpiData.komponenDominan.count : 0;
    const topFieldPct = ((topFieldCount / total) * 100).toFixed(1);

    const topCountry = kpiData.negaraTerbanyak ? kpiData.negaraTerbanyak.name : 'kawasan terpantau';
    const topCountryCount = kpiData.negaraTerbanyak ? kpiData.negaraTerbanyak.count : 0;
    const topCountryPct = ((topCountryCount / total) * 100).toFixed(1);

    // Calculate most frequent kegiatan
    const activityMap: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      if (!r || !r.kegiatan) return;
      activityMap[r.kegiatan] = (activityMap[r.kegiatan] || 0) + 1;
    });
    const sortedActivities = Object.entries(activityMap).sort((a, b) => b[1] - a[1]);
    const topActivity = sortedActivities[0] ? sortedActivities[0][0] : 'kegiatan terkoordinasi';

    // Calculate most frequent bentuk kegiatan
    const bentukMap: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      if (!r || !r.bentukKegiatan) return;
      bentukMap[r.bentukKegiatan] = (bentukMap[r.bentukKegiatan] || 0) + 1;
    });
    const sortedBentuk = Object.entries(bentukMap).sort((a, b) => b[1] - a[1]);
    const topBentuk = sortedBentuk[0] ? sortedBentuk[0][0] : 'diplomasi dan manuver';

    // Most mentioned figure (from unified kpiData)
    const topFigure = kpiData.tokohDominan ? kpiData.tokohDominan.name : null;

    const narrative = `Berdasarkan agregasi analitis pada periode terpilih, dinamika informasi strategis terkonsentrasi kuat pada bidang ${topField} (${topFieldPct}% dari total informasi). Episentrum pencatatan tertinggi terpantau di ${topCountry} yang menyumbang ${topCountryPct}% akumulasi rekaman. Pola kegiatan didominasi oleh "${topActivity}" dengan wujud pelaksanaan utama berupa "${topBentuk}". ${
      topFigure ? `Aktor atau entitas yang paling kerap terasosiasi dalam pemantauan ini adalah ${topFigure}. ` : ''
    }Penyebaran mencakup ${kpiData.negaraTerpantau} negara berdaulat di kawasan Amerika dan Eropa, mencerminkan atensi komprehensif terhadap stabilitas pertahanan dan dinamika geopolitik global.`;

    const highlights = [
      {
        label: 'Dominasi Sektoral',
        desc: `Bidang ${topField} memimpin dengan total ${topFieldCount} informasi terpantau.`,
        color: 'text-blue-400',
      },
      {
        label: 'Episentrum Kawasan',
        desc: `${topCountry} mencatat konsentrasi tertinggi sebanyak ${topCountryCount} informasi.`,
        color: 'text-emerald-400',
      },
      {
        label: 'Karakter Aktivitas',
        desc: `Pola menonjol: "${topActivity}" via ${topBentuk}.`,
        color: 'text-purple-400',
      },
      {
        label: 'Integritas Metodologis',
        desc: 'Sintesis objektif berbasis perhitungan data murni tanpa rekayasa peristiwa.',
        color: 'text-amber-400',
      },
    ];

    return { narrative, highlights };
  }, [filteredRecords, kpiData]);

  return (
    <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-850 rounded-xl p-5 text-white border border-navy-800 shadow-md flex flex-col justify-between">
      <div>
        {/* Panel Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-navy-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Strategic Intelligence Insights
              </h2>
              <p className="text-[11px] text-slate-400">
                Sintesis Objektif Berbasis Algoritma Perhitungan
              </p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">
            DYNAMIC ENGINE
          </span>
        </div>

        {/* Generated Narrative */}
        <div className="bg-navy-900/90 rounded-xl p-4 border border-navy-700/60 text-xs text-slate-300 leading-relaxed font-sans shadow-inner">
          <p>{insightSynthesis.narrative}</p>
        </div>

        {/* Highlights Breakdown */}
        <div className="mt-4 space-y-2.5 text-xs">
          {insightSynthesis.highlights.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-slate-300">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></div>
              <div>
                <strong className={`font-semibold ${item.color}`}>{item.label}: </strong>
                <span className="text-slate-300">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-navy-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Kaidah Intelijen: Fakta Statistik
        </span>
        <span className="font-mono text-emerald-400">Aktif & Sinkron</span>
      </div>
    </div>
  );
};
