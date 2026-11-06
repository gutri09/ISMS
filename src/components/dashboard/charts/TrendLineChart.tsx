import React, { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useIntelligence } from '../../../context/IntelligenceContext';
import { STRATEGIC_COMPONENTS } from '../../../constants/strategicComponents';
import { BarChart3, Layers, Calendar } from 'lucide-react';
import { format, parseISO, startOfWeek, getWeek, getYear } from 'date-fns';
import { id } from 'date-fns/locale';

export const TrendLineChart: React.FC = () => {
  const { filteredRecords } = useIntelligence();

  // Granularity state: 'monthly' | 'weekly' | 'daily'
  const [granularity, setGranularity] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  // View mode: 'total' (single area line) | 'breakdown' (multi-series for 9 components)
  const [viewMode, setViewMode] = useState<'total' | 'breakdown'>('total');

  // Process data into timeline buckets
  const chartData = useMemo(() => {
    if (!filteredRecords || filteredRecords.length === 0) {
      return { categories: [], series: [] };
    }

    // Sort records chronologically
    const sorted = [...filteredRecords]
      .filter((r) => r && r.tanggal)
      .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

    const bucketCounts: Record<string, { total: number; [key: string]: number }> = {};

    sorted.forEach((record) => {
      if (!record) return;
      let key = '';
      try {
        const d = parseISO(record.tanggal);
        if (granularity === 'monthly') {
          key = format(d, 'MMM yyyy', { locale: id });
        } else if (granularity === 'weekly') {
          key = `Mg ${getWeek(d, { weekStartsOn: 1 })}/${getYear(d)}`;
        } else {
          key = format(d, 'dd/MM/yyyy');
        }
      } catch (e) {
        key = record.tanggal;
      }

      if (!bucketCounts[key]) {
        bucketCounts[key] = { total: 0 };
        STRATEGIC_COMPONENTS.forEach((c) => {
          bucketCounts[key][c.name] = 0;
        });
      }

      bucketCounts[key].total += 1;
      bucketCounts[key][record.bidang] = (bucketCounts[key][record.bidang] || 0) + 1;
    });

    const categories = Object.keys(bucketCounts);

    if (viewMode === 'total') {
      const dataPoints = categories.map((cat) => bucketCounts[cat].total);
      return {
        categories,
        series: [
          {
            name: 'Total Informasi',
            type: 'line',
            smooth: 0.35,
            symbol: 'circle',
            symbolSize: 6,
            showSymbol: true,
            data: dataPoints,
            itemStyle: { color: '#2563EB' },
            lineStyle: { width: 3, color: '#2563EB' },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(37, 99, 235, 0.45)' },
                  { offset: 1, color: 'rgba(37, 99, 235, 0.02)' },
                ],
              },
            },
          },
        ],
      };
    } else {
      // Multi-series breakdown by the 9 strategic components
      const series = STRATEGIC_COMPONENTS.map((comp) => {
        const dataPoints = categories.map((cat) => bucketCounts[cat][comp.name] || 0);
        return {
          name: comp.name,
          type: 'line',
          smooth: 0.3,
          symbol: 'circle',
          symbolSize: 4,
          data: dataPoints,
          itemStyle: { color: comp.color },
          lineStyle: { width: 2, color: comp.color },
        };
      });

      return { categories, series };
    }
  }, [filteredRecords, granularity, viewMode]);

  // ECharts Configuration
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0B132B',
      borderColor: '#1C2541',
      borderWidth: 1,
      padding: [10, 14],
      textStyle: { color: '#F8FAFC', fontSize: 12 },
      axisPointer: {
        type: 'cross',
        lineStyle: { color: '#60A5FA', width: 1, type: 'dashed' },
        crossStyle: { color: '#60A5FA' },
      },
    },
    legend: {
      show: viewMode === 'breakdown',
      type: 'scroll',
      top: 0,
      textStyle: { color: '#64748B', fontSize: 11 },
      pageTextStyle: { color: '#64748B' },
      icon: 'circle',
    },
    grid: {
      left: '2%',
      right: '3%',
      bottom: '12%',
      top: viewMode === 'breakdown' ? '18%' : '8%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: chartData.categories,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#CBD5E1' } },
      axisLabel: { color: '#64748B', fontSize: 11 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
      axisLabel: { color: '#64748B', fontSize: 11 },
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100,
      },
      {
        type: 'slider',
        show: chartData.categories.length > 8,
        height: 14,
        bottom: 4,
        borderColor: 'transparent',
        backgroundColor: '#F1F5F9',
        fillerColor: 'rgba(37, 99, 235, 0.2)',
        handleStyle: { color: '#2563EB' },
        textStyle: { color: 'transparent' },
      },
    ],
    series: chartData.series,
  };

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            Grafik Tren Informasi Menurut Waktu
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dinamika pencatatan intelijen berdasarkan tanggal kejadian ({filteredRecords.length} rekaman)
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Mode View: Total vs Breakdown */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg font-medium">
            <button
              onClick={() => setViewMode('total')}
              className={`px-2.5 py-1 rounded text-xs transition-all ${
                viewMode === 'total'
                  ? 'bg-white text-blue-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Total Agregat
            </button>
            <button
              onClick={() => setViewMode('breakdown')}
              className={`px-2.5 py-1 rounded text-xs transition-all ${
                viewMode === 'breakdown'
                  ? 'bg-white text-blue-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              9 Komponen
            </button>
          </div>

          {/* Granularity: Monthly, Weekly, Daily */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg font-medium">
            <button
              onClick={() => setGranularity('monthly')}
              className={`px-2.5 py-1 rounded text-xs transition-all ${
                granularity === 'monthly'
                  ? 'bg-white text-blue-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setGranularity('weekly')}
              className={`px-2.5 py-1 rounded text-xs transition-all ${
                granularity === 'weekly'
                  ? 'bg-white text-blue-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mingguan
            </button>
            <button
              onClick={() => setGranularity('daily')}
              className={`px-2.5 py-1 rounded text-xs transition-all ${
                granularity === 'daily'
                  ? 'bg-white text-blue-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Harian
            </button>
          </div>
        </div>
      </div>

      {/* Interactive ECharts Container */}
      <div className="h-64 w-full">
        {chartData.categories.length > 0 ? (
          <ReactECharts
            option={option}
            style={{ height: '100%', width: '100%' }}
            notMerge={true}
            lazyUpdate={true}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400 text-xs">
            Tidak ada data untuk ditampilkan pada rentang filter saat ini
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 mt-2">
        <span>Gunakan slider bawah atau scroll mouse untuk memperbesar rentang waktu</span>
        <span className="font-mono text-blue-600 font-medium">Apache ECharts v5.6</span>
      </div>
    </div>
  );
};
