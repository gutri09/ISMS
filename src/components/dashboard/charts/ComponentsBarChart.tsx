import React from 'react';
import { useIntelligence } from '../../../context/IntelligenceContext';
import { STRATEGIC_COMPONENTS } from '../../../constants/strategicComponents';
import { Layers } from 'lucide-react';

export const ComponentsBarChart: React.FC = () => {
  const { filteredRecords, filters, setFilter, toggleFilter } = useIntelligence();

  // Calculate 9 Components breakdown for horizontal bars
  const list = filteredRecords || [];
  const componentStats = STRATEGIC_COMPONENTS.map((comp) => {
    const count = list.filter((r) => r && r.bidang === comp.name).length;
    const percentage =
      list.length > 0 ? ((count / list.length) * 100).toFixed(1) : '0';
    return {
      ...comp,
      count,
      percentage: parseFloat(percentage),
    };
  }).sort((a, b) => b.count - a.count);

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Distribusi 9 Komponen Strategis
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Frekuensi rekaman per bidang (Klik batang untuk menyaring dashboard)
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {componentStats.map((item) => {
          const isSelected = (Array.isArray(filters.bidang) ? filters.bidang : []).some(
            (b: string) => b.toLowerCase() === item.name.toLowerCase()
          );
          return (
            <div
              key={item.id}
              onClick={() => toggleFilter('bidang', item.name)}
              className={`p-2 rounded-lg cursor-pointer transition-all border ${
                isSelected
                  ? 'bg-blue-50/90 border-blue-400 shadow-xs ring-1 ring-blue-400 font-semibold'
                  : 'hover:bg-slate-50 border-transparent'
              }`}
              title={`Klik untuk menyaring / toggle bidang ${item.name} (Multi-Select)`}
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  ></span>
                  {item.name}
                </span>
                <div className="flex items-center gap-2 font-mono">
                  <span className="text-slate-500 text-[11px]">{item.percentage}%</span>
                  <span className="font-bold text-slate-900">{item.count}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(2, item.percentage)}%`,
                    backgroundColor: item.color,
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100 mt-2">
        <span>Klik kategori untuk menyaring (Multi-Select)</span>
        {filters.bidang && (Array.isArray(filters.bidang) ? filters.bidang.length > 0 : Boolean(filters.bidang)) && (
          <button
            onClick={() => setFilter('bidang', [])}
            className="text-blue-600 hover:underline font-semibold cursor-pointer"
          >
            Hapus Filter Bidang ({Array.isArray(filters.bidang) ? filters.bidang.length : 1})
          </button>
        )}
      </div>
    </div>
  );
};
