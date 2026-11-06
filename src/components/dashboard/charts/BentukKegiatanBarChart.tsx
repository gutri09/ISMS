import React, { useMemo } from 'react';
import { useIntelligence } from '../../../context/IntelligenceContext';
import { Layers, CheckCircle2 } from 'lucide-react';

export const BentukKegiatanBarChart: React.FC = () => {
  const { filteredRecords, filters, setFilter, toggleFilter } = useIntelligence();

  // Aggregate Bentuk Kegiatan
  const { topBentuk, maxCount } = useMemo(() => {
    const counts: Record<string, number> = {};

    (filteredRecords || []).forEach((r) => {
      if (!r) return;
      const b = (r.bentukKegiatan || '').trim();
      if (!b) return;
      counts[b] = (counts[b] || 0) + 1;
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

    return { topBentuk: sorted, maxCount: max };
  }, [filteredRecords]);

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>Distribusi Bentuk Kegiatan</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Format implementasi dan instrumen kebijakan/tindakan
            </p>
          </div>
          {filters.bentukKegiatan && (
            <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-semibold border border-amber-200">
              Filter Aktif
            </span>
          )}
        </div>

        {/* List of Bentuk Kegiatan Bars */}
        <div className="space-y-2">
          {topBentuk.length > 0 ? (
            topBentuk.map((item, idx) => {
              const isSelected = (
                Array.isArray(filters.bentukKegiatan) ? filters.bentukKegiatan : []
              ).some((b: string) => b.toLowerCase() === item.name.toLowerCase());

              const widthPct = Math.max(6, (item.count / maxCount) * 100);

              return (
                <div
                  key={item.name}
                  onClick={() => toggleFilter('bentukKegiatan', item.name)}
                  className={`p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                    isSelected
                      ? 'bg-amber-50/90 border-amber-400 font-semibold ring-1 ring-amber-400 shadow-xs'
                      : 'hover:bg-slate-50 border-slate-100'
                  }`}
                  title={`Klik untuk menyaring / toggle bentuk kegiatan ${item.name} (Multi-Select)`}
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
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-mono font-bold text-[11px] border border-amber-100/60">
                        {item.count} info
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-600 transition-all duration-500"
                      style={{ width: `${widthPct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              Tidak ada bentuk kegiatan yang tercatat pada filter saat ini
            </div>
          )}
        </div>
      </div>

      {/* Footer Info / Filter Clear */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100 mt-3">
        <span className="flex items-center gap-1 text-[11px]">
          <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
          <span>Klik bentuk kegiatan untuk menyaring (Multi-Select)</span>
        </span>
        {filters.bentukKegiatan && (Array.isArray(filters.bentukKegiatan) ? filters.bentukKegiatan.length > 0 : Boolean(filters.bentukKegiatan)) && (
          <button
            onClick={() => setFilter('bentukKegiatan', [])}
            className="text-amber-600 hover:text-amber-800 hover:underline font-semibold cursor-pointer text-[11px]"
          >
            Hapus Filter ({Array.isArray(filters.bentukKegiatan) ? filters.bentukKegiatan.length : 1} Bentuk)
          </button>
        )}
      </div>
    </div>
  );
};
