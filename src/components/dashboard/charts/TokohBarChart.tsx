import React, { useMemo } from 'react';
import { useIntelligence } from '../../../context/IntelligenceContext';
import { Users, UserCheck } from 'lucide-react';
import { normalizeTokohNames } from '../../../utils/tokohUtils';

export const TokohBarChart: React.FC = () => {
  const { filteredRecords, filters, setFilter, toggleFilter } = useIntelligence();

  const activeTokohList = useMemo(() => {
    if (!filters.tokoh) return [];
    return Array.isArray(filters.tokoh) ? filters.tokoh : [filters.tokoh];
  }, [filters.tokoh]);

  // Aggregate figures
  const { topTokoh, maxCount, totalFigureMentions } = useMemo(() => {
    const counts: Record<string, { count: number; rawKeywords: Set<string> }> = {};
    let mentions = 0;

    (filteredRecords || []).forEach((r) => {
      if (!r || !r.tokoh) return;
      const names = normalizeTokohNames(r.tokoh);
      const uniqueInRec = new Set(names);

      uniqueInRec.forEach((name) => {
        if (!counts[name]) {
          counts[name] = { count: 0, rawKeywords: new Set() };
        }
        counts[name].count += 1;
        counts[name].rawKeywords.add(name);
        mentions += 1;
      });
    });

    const sorted = Object.entries(counts)
      .map(([name, data]) => ({
        name,
        count: data.count,
        percentage:
          filteredRecords.length > 0
            ? Math.round((data.count / filteredRecords.length) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const max = sorted[0]?.count || 1;

    return { topTokoh: sorted, maxCount: max, totalFigureMentions: mentions };
  }, [filteredRecords]);

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Tokoh & Entitas Kunci Terpantau</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Figur dan aktor strategis paling sering dilaporkan
            </p>
          </div>
          {activeTokohList.length > 0 && (
            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold border border-indigo-200">
              Filter Aktif ({activeTokohList.length})
            </span>
          )}
        </div>

        {/* List of Tokoh Bars */}
        <div className="space-y-2">
          {topTokoh.length > 0 ? (
            topTokoh.map((item, idx) => {
              const isSelected = activeTokohList.some(
                (t) =>
                  t.toLowerCase() === item.name.toLowerCase() ||
                  item.name.toLowerCase().includes(t.toLowerCase()) ||
                  t.toLowerCase().includes(item.name.toLowerCase())
              );

              const widthPct = Math.max(6, (item.count / maxCount) * 100);

              return (
                <div
                  key={item.name}
                  onClick={() => toggleFilter('tokoh', item.name)}
                  className={`p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                    isSelected
                      ? 'bg-indigo-50/90 border-indigo-400 font-semibold ring-1 ring-indigo-400 shadow-xs'
                      : 'hover:bg-slate-50 border-slate-100'
                  }`}
                  title={`Klik untuk menyaring (multi-select) rekaman dengan tokoh ${item.name}`}
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
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-bold text-[11px] border border-indigo-100/60">
                        {item.count} info
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
                      style={{ width: `${widthPct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              Tidak ada tokoh yang tercatat pada filter saat ini
            </div>
          )}
        </div>
      </div>

      {/* Footer Info / Filter Clear */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100 mt-3">
        <span className="flex items-center gap-1 text-[11px]">
          <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
          <span>Klik tokoh untuk toggle seleksi (bisa multi)</span>
        </span>
        {activeTokohList.length > 0 && (
          <button
            onClick={() => setFilter('tokoh', [])}
            className="text-indigo-600 hover:text-indigo-800 hover:underline font-semibold cursor-pointer text-[11px]"
          >
            Hapus Filter ({activeTokohList.length} Tokoh)
          </button>
        )}
      </div>
    </div>
  );
};
