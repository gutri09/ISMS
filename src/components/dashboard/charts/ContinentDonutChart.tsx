import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useIntelligence } from '../../../context/IntelligenceContext';
import { PieChart } from 'lucide-react';

const CONTINENT_COLORS: Record<string, string> = {
  Amerika: '#2563EB', // Blue
  Eropa: '#059669', // Emerald
  Asia: '#D97706', // Amber
  Afrika: '#7C3AED', // Purple
  'Timur Tengah': '#DC2626', // Red
  'Australia & Pasifik': '#0891B2', // Cyan
  Lainnya: '#64748B', // Slate
};

const PALETTE_FALLBACKS = ['#2563EB', '#059669', '#D97706', '#7C3AED', '#DC2626', '#0891B2', '#EC4899', '#8B5CF6'];

export const ContinentDonutChart: React.FC = () => {
  const { filteredRecords = [], filters, setFilter, toggleFilter, masterConfig } = useIntelligence();

  // Active continent tally from filteredRecords
  const total = (filteredRecords && filteredRecords.length) || 1;

  const continentDistribution = useMemo(() => {
    const tally: Record<string, number> = {};
    if (filteredRecords && Array.isArray(filteredRecords)) {
      filteredRecords.forEach((r) => {
        if (!r) return;
        const b = (r.benua || '').trim() || 'Lainnya';
        tally[b] = (tally[b] || 0) + 1;
      });
    }

    const entries = Object.entries(tally);
    if (entries.length === 0) {
      // Fallback if no records match
      const fallbackList = masterConfig?.continents || ['Amerika', 'Eropa', 'Asia'];
      return fallbackList.slice(0, 3).map((name, idx) => ({
        name,
        value: 0,
        pct: '0.0',
        color: CONTINENT_COLORS[name] || PALETTE_FALLBACKS[idx % PALETTE_FALLBACKS.length],
      }));
    }

    return entries
      .map(([name, count], idx) => ({
        name,
        value: count,
        pct: ((count / total) * 100).toFixed(1),
        color: CONTINENT_COLORS[name] || PALETTE_FALLBACKS[idx % PALETTE_FALLBACKS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredRecords, total, masterConfig?.continents]);

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: '#0B132B',
      borderColor: '#1C2541',
      borderWidth: 1,
      textStyle: { color: '#F8FAFC', fontSize: 12 },
      formatter: '{b}: <strong>{c}</strong> ({d}%)',
    },
    legend: {
      bottom: '0',
      icon: 'circle',
      textStyle: { color: '#64748B', fontSize: 11 },
    },
    series: [
      {
        name: 'Distribusi Benua',
        type: 'pie',
        radius: ['52%', '78%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#ffffff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center',
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: '#1E293B',
            formatter: '{b}\n{d}%',
          },
        },
        labelLine: {
          show: false,
        },
        data: continentDistribution.map((item) => ({
          value: item.value,
          name: item.name,
          itemStyle: { color: item.color },
        })),
      },
    ],
  };

  const onChartClick = (params: any) => {
    if (params.name) {
      toggleFilter('benua', params.name);
    }
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-blue-600" />
            Rasio Distribusi Benua / Kawasan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Perbandingan proporsi volume informasi per kawasan (Klik untuk multi-select)
          </p>
        </div>
      </div>

      <div className="h-44 w-full">
        <ReactECharts
          option={option}
          style={{ height: '100%', width: '100%' }}
          onEvents={{ click: onChartClick }}
        />
      </div>

      {/* Dynamic Interactive Cards below the chart */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-100 text-xs max-h-36 overflow-y-auto pr-1">
        {continentDistribution.map((c) => {
          const isActive = Array.isArray(filters.benua)
            ? filters.benua.some((b) => b.toLowerCase() === c.name.toLowerCase())
            : filters.benua === c.name;
          return (
            <button
              key={c.name}
              onClick={() => toggleFilter('benua', c.name)}
              className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-50 border-blue-400 font-semibold ring-1 ring-blue-400'
                  : 'hover:bg-slate-50 border-slate-200'
              }`}
              title={`Klik untuk menyaring / toggle benua ${c.name} (Multi-Select)`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: c.color }}
                ></span>
                <span className="text-[11px] text-slate-600 truncate">{c.name}</span>
              </div>
              <div
                className="text-base font-bold font-mono mt-0.5"
                style={{ color: c.color }}
              >
                {c.pct}%
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{c.value} data</span>
            </button>
          );
        })}
      </div>

      {/* Footer Reset if benua filter active */}
      {filters.benua && (Array.isArray(filters.benua) ? filters.benua.length > 0 : filters.benua !== 'Semua') && (
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 mt-2">
          <span className="truncate mr-2">
            Kawasan aktif: {Array.isArray(filters.benua) ? filters.benua.join(', ') : filters.benua}
          </span>
          <button
            onClick={() => setFilter('benua', [])}
            className="text-blue-600 hover:underline font-semibold cursor-pointer shrink-0 text-[11px]"
          >
            Hapus Filter Benua ({Array.isArray(filters.benua) ? filters.benua.length : 1})
          </button>
        </div>
      )}
    </div>
  );
};
