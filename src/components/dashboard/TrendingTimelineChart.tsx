import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';

interface TrendingTimelineChartProps {
  timeline: { time: string; volume: number }[];
  period: '24h' | '7d' | '30d';
  scopeLabel: string;
}

export const TrendingTimelineChart: React.FC<TrendingTimelineChartProps> = ({
  timeline,
  period,
  scopeLabel,
}) => {
  const chartOption = useMemo(() => {
    const categories = timeline.map((t) => t.time);
    const dataPoints = timeline.map((t) => t.volume);

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: '#0F172A',
        borderColor: '#334155',
        borderWidth: 1,
        textStyle: { color: '#F8FAFC', fontSize: 11 },
        formatter: (params: any) => {
          if (!params || !params[0]) return '';
          const pt = params[0];
          return `
            <div style="font-weight: 700; margin-bottom: 3px;">Waktu: ${pt.name}</div>
            <div style="color: #60A5FA;">Intensitas Pemberitaan: <strong>${pt.value} artikel/jam</strong></div>
            <div style="font-size: 10px; color: #94A3B8; margin-top: 2px;">Cakupan: ${scopeLabel}</div>
          `;
        },
      },
      grid: {
        top: 25,
        right: 15,
        bottom: 25,
        left: 35,
      },
      xAxis: {
        type: 'category',
        data: categories,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#CBD5E1' } },
        axisLabel: {
          color: '#64748B',
          fontSize: 10,
        },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#F1F5F9', type: 'dashed' } },
        axisLabel: { color: '#64748B', fontSize: 10 },
      },
      series: [
        {
          name: 'Volume Pemberitaan',
          type: 'line',
          smooth: 0.35,
          symbol: 'circle',
          symbolSize: 5,
          showSymbol: true,
          data: dataPoints,
          itemStyle: { color: '#2563EB' },
          lineStyle: { width: 2.5, color: '#2563EB' },
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
  }, [timeline, scopeLabel]);

  if (!timeline || timeline.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-slate-400">
        Memuat data kurva tren...
      </div>
    );
  }

  return (
    <div className="w-full h-44">
      <ReactECharts
        option={chartOption}
        style={{ width: '100%', height: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
};
