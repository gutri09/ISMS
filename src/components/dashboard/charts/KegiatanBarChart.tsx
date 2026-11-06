import React, { useMemo } from 'react';
import { useIntelligence } from '../../../context/IntelligenceContext';
import { Activity, CheckCircle2 } from 'lucide-react';

export const KegiatanBarChart: React.FC = () => {
  const { filteredRecords, filters, setFilter, toggleFilter } = useIntelligence();

  // Aggregate Kegiatan
  const { topKegiatan, maxCount } = useMemo(() => {
    const counts: Record<string, number> = {};

    (filteredRecords || []).forEach((r) => {
      if (!r) return;
      const k = (r.kegiatan || '').trim();
      if (!k) return;
      counts[k] = (counts[k] || 0) + 1;
    });

    const sorted = Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        percentage:
          filteredRecords.length > 0
            ? Math.round((count / filteredRecords.length) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const max = sorted[0]?.count || 1;

    return { topKegiatan: sorted, maxCount: max };
  }, [filteredRecords]);

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Distribusi Kegiatan Intelijen</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Frekuensi kategori kegiatan operasional strategis
            </p>
          </div>
          {filters.kegiatan && (
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
              Filter Aktif
            </span>
          )}
        </div>

        {/* List of Kegiatan Bars */}
        <div className="space-y-2">
          {topKegiatan.length > 0 ? (
            topKegiatan.map((item, idx) => {
              const isSelected = (Array.isArray(filters.kegiatan) ? filters.kegiatan : []).some(
                (k: string) => k.toLowerCase() === item.name.toLowerCase()
              );

              const widthPct = Math.max(6, (item.count / maxCount) * 100);

              return (
                <div
                  key={item.name}
                  onClick={() => toggleFilter('kegiatan', item.name)}
                  className={`p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                    isSelected
                      ? 'bg-emerald-50/90 border-emerald-400 font-semibold ring-1 ring-emerald-400 shadow-xs'
                      : 'hover:bg-slate-50 border-slate-100'
                  }`}
                  title={`Klik untuk menyaring / toggle kegiatan ${item.name} (Multi-Select)`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-4 text-slate-400 font-mono font-bold text-[11px] shrink-0">
                        {idx + 1}.
                      </span>
                      <span className="text-slate-800 font-medium truncate" title={item.name}>
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {item.percentage}%
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono font-bold text-[11px] border border-emerald-100/60">
                        {item.count} info
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500"
                      style={{ width: `${widthPct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              Tidak ada kegiatan yang tercatat pada filter saat ini
            </div>
          )}
        </div>
      </div>

      {/* Footer Info / Filter Clear */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100 mt-3">
        <span className="flex items-center gap-1 text-[11px]">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Klik kegiatan untuk menyaring (Multi-Select)</span>
        </span>
        {filters.kegiatan && (Array.isArray(filters.kegiatan) ? filters.kegiatan.length > 0 : Boolean(filters.kegiatan)) && (
          <button
            onClick={() => setFilter('kegiatan', [])}
            className="text-emerald-600 hover:text-emerald-800 hover:underline font-semibold cursor-pointer text-[11px]"
          >
            Hapus Filter ({Array.isArray(filters.kegiatan) ? filters.kegiatan.length : 1} Kegiatan)
          </button>
        )}
      </div>
    </div>
  );
};
