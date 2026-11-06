import React from 'react';
import { useIntelligence } from '../../../context/IntelligenceContext';
import { Flag, Trophy } from 'lucide-react';
import { Continent } from '../../../types';

export const TopCountriesBarChart: React.FC = () => {
  const { filteredRecords, filters, setFilter, toggleFilter } = useIntelligence();

  // Country counts calculation
  const countryCounts: Record<string, { count: number; continent: Continent; code: string }> = {};

  (filteredRecords || []).forEach((r) => {
    if (!r || !r.negara) return;
    const name = r.negara.trim();
    if (name.toUpperCase().includes('TOTAL')) return;

    if (!countryCounts[name]) {
      countryCounts[name] = { count: 0, continent: r.benua || 'Global', code: r.negaraCode || 'INT' };
    }
    countryCounts[name].count += 1;
  });

  const topCountries = Object.entries(countryCounts)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const maxVal = topCountries[0]?.count || 1;

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            Top 10 Negara Teraktif
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Negara dengan konsentrasi rekaman tertinggi
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {topCountries.length > 0 ? (
          topCountries.map((c, i) => {
            const isSelected = (Array.isArray(filters.negara) ? filters.negara : []).some(
              (n: string) => n.toLowerCase() === c.name.toLowerCase()
            );
            const widthPct = Math.max(5, (c.count / maxVal) * 100);

            return (
              <div
                key={c.name}
                onClick={() => toggleFilter('negara', c.name)}
                className={`p-2 rounded-lg text-xs cursor-pointer border transition-all ${
                  isSelected
                    ? 'bg-blue-50/90 border-blue-400 font-semibold ring-1 ring-blue-400 shadow-xs'
                    : 'hover:bg-slate-50 border-slate-100'
                }`}
                title={`Klik untuk menyaring / toggle negara ${c.name} (Multi-Select)`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-4 text-slate-400 font-mono font-bold text-[11px]">
                      {i + 1}.
                    </span>
                    <span className="text-slate-800 font-medium">{c.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                      {c.continent}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold text-[11px]">
                    {c.count} info
                  </span>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${widthPct}%` }}
                  ></div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">
            Tidak ada negara yang tercatat pada filter saat ini
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100 mt-2">
        <span>Klik untuk menambah/mengurangi negara (Multi-Select)</span>
        {filters.negara && (Array.isArray(filters.negara) ? filters.negara.length > 0 : Boolean(filters.negara)) && (
          <button
            onClick={() => setFilter('negara', [])}
            className="text-blue-600 hover:underline font-semibold cursor-pointer"
          >
            Hapus Filter Negara ({Array.isArray(filters.negara) ? filters.negara.length : 1})
          </button>
        )}
      </div>
    </div>
  );
};
