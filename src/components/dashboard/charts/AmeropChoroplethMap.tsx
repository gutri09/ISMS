import React, { useRef, useMemo, useState, useEffect } from 'react';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import { useIntelligence } from '../../../context/IntelligenceContext';
import { Globe, ZoomIn, ZoomOut, RotateCcw, MapPin, Eye, Info } from 'lucide-react';
import worldGeoReal from '../../../constants/worldGeoReal.json';
import { COUNTRIES } from '../../../constants/countries';

// Register Global Real Geographic GeoJSON (covers 258 world territories)
try {
  if (!echarts.getMap('world')) {
    echarts.registerMap('world', worldGeoReal as any);
  }
} catch (e) {
  console.error('[AmeropChoroplethMap] Map registration failed:', e);
}

// Center and Zoom coordinates for continents and regions
const CONTINENT_VIEW_CONFIGS: Record<string, { center: [number, number]; zoom: number }> = {
  Semua: { center: [15, 20], zoom: 1.15 },
  Amerika: { center: [-80, 10], zoom: 1.85 },
  Eropa: { center: [20, 53], zoom: 3.1 },
  Asia: { center: [95, 30], zoom: 2.1 },
  Afrika: { center: [20, 5], zoom: 2.0 },
  'Timur Tengah': { center: [45, 28], zoom: 3.2 },
  'Australia & Pasifik': { center: [135, -25], zoom: 2.3 },
};

export const AmeropChoroplethMap: React.FC = () => {
  const { filteredRecords = [], records = [], filters, setFilter, toggleFilter, masterConfig } = useIntelligence();
  const echartsRef = useRef<any>(null);

  const activeBenuaList = useMemo(() => {
    if (!filters.benua) return [];
    const raw = Array.isArray(filters.benua) ? filters.benua : [filters.benua];
    return raw.filter((b) => b && b !== 'Semua');
  }, [filters.benua]);

  const activeNegaraList = useMemo(() => {
    if (!filters.negara) return [];
    return Array.isArray(filters.negara) ? filters.negara : [filters.negara];
  }, [filters.negara]);

  // Available continents derived from masterConfig and records
  const availableContinents = useMemo(() => {
    const fromConfig = masterConfig?.continents || ['Amerika', 'Eropa', 'Asia'];
    const fromRecords = records && Array.isArray(records)
      ? (records.map((r) => r?.benua).filter(Boolean) as string[])
      : [];
    return Array.from(new Set([...fromConfig, ...fromRecords]));
  }, [masterConfig?.continents, records]);

  // Center and Zoom coordinates based on active filters.benua
  const viewConfig = useMemo(() => {
    if (activeBenuaList.length === 1 && CONTINENT_VIEW_CONFIGS[activeBenuaList[0]]) {
      return CONTINENT_VIEW_CONFIGS[activeBenuaList[0]];
    }
    return CONTINENT_VIEW_CONFIGS['Semua'];
  }, [activeBenuaList]);

  // Sync zoom and center whenever viewConfig / continent filter changes
  useEffect(() => {
    try {
      const instance = echartsRef.current?.getEchartsInstance();
      if (!instance) return;
      instance.setOption({
        geo: {
          center: viewConfig.center,
          zoom: viewConfig.zoom,
        },
      });
    } catch (e) {
      console.warn('Map zoom update deferred:', e);
    }
  }, [viewConfig]);

  // Calculate country stats from filteredRecords
  const countryStats = useMemo(() => {
    const stats: Record<string, { count: number; continent: string; topBidang: string }> = {};

    // Initialize countries from masterConfig or base COUNTRIES
    const pool = masterConfig?.countries && Array.isArray(masterConfig.countries) && masterConfig.countries.length > 0
      ? masterConfig.countries
      : COUNTRIES;

    pool.forEach((c) => {
      if (!c) return;
      stats[c.name] = { count: 0, continent: c.continent || 'Global', topBidang: '-' };
    });

    const bidangTally: Record<string, Record<string, number>> = {};

    if (filteredRecords && Array.isArray(filteredRecords)) {
      filteredRecords.forEach((r) => {
        if (!r) return;
        const countryName = r.negara?.trim();
        if (!countryName) return;
        if (!stats[countryName]) {
          stats[countryName] = { count: 0, continent: r.benua || 'Global', topBidang: '-' };
        }
        stats[countryName].count += 1;

        if (!bidangTally[countryName]) bidangTally[countryName] = {};
        if (r.bidang) {
          bidangTally[countryName][r.bidang] = (bidangTally[countryName][r.bidang] || 0) + 1;
        }
      });
    }

    // Determine top bidang for each country
    Object.keys(bidangTally).forEach((cName) => {
      let maxCount = -1;
      let topB = '-';
      Object.entries(bidangTally[cName]).forEach(([b, cnt]) => {
        if (cnt > maxCount) {
          maxCount = cnt;
          topB = `${b} (${cnt} info)`;
        }
      });
      if (stats[cName]) {
        stats[cName].topBidang = topB;
      }
    });

    return stats;
  }, [filteredRecords, masterConfig?.countries]);

  // Transform data for ECharts series
  const mapData = useMemo(() => {
    return Object.entries(countryStats).map(([name, data]) => {
      const isSelected = activeNegaraList.some((n) => n.toLowerCase() === name.toLowerCase());
      return {
        name,
        value: data.count,
        continent: data.continent,
        topBidang: data.topBidang,
        itemStyle: isSelected
          ? {
              areaColor: '#F59E0B',
              borderColor: '#FDE68A',
              borderWidth: 2.5,
              shadowColor: '#F59E0B',
              shadowBlur: 10,
            }
          : undefined,
      };
    });
  }, [countryStats, activeNegaraList]);

  // ECharts Option
  const option = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: '#0B132B',
        borderColor: '#1C2541',
        borderWidth: 1,
        padding: [10, 14],
        textStyle: { color: '#F8FAFC', fontSize: 12 },
        formatter: (params: any) => {
          if (!params.name) return '';
          const count = params.value || 0;
          const continent = params.data?.continent || 'Kawasan Global';
          const topBidang = params.data?.topBidang || 'Tidak ada data';
          const isSelected = activeNegaraList.some(
            (n) => n.toLowerCase() === params.name?.toLowerCase()
          );

          return `
            <div style="font-family: inherit;">
              <div style="font-weight: bold; font-size: 13px; color: #FFFFFF; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1E293B; padding-bottom: 5px; margin-bottom: 6px;">
                <span>${params.name}</span>
                <span style="font-size: 10px; color: #94A3B8; font-weight: normal; margin-left: 10px;">${continent}</span>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 15px; margin-bottom: 4px;">
                <span style="color: #94A3B8;">Volume Rekaman:</span>
                <strong style="color: #34D399; font-family: monospace;">${count} informasi</strong>
              </div>
              <div style="display: flex; justify-content: space-between; gap: 15px; font-size: 11px;">
                <span style="color: #94A3B8;">Bidang Dominan:</span>
                <span style="color: #93C5FD;">${topBidang}</span>
              </div>
              ${
                isSelected
                  ? '<div style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed #334155; color: #FBBF24; font-size: 10px; font-weight: bold;">Filter Aktif (Klik untuk lepas)</div>'
                  : '<div style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed #334155; color: #64748B; font-size: 10px;">Klik untuk tambah/lepas filter negara</div>'
              }
            </div>
          `;
        },
      },
      visualMap: {
        type: 'piecewise',
        show: false,
        pieces: [
          { min: 31, color: '#60A5FA', label: '>30 rekaman' },
          { min: 16, max: 30, color: '#3B82F6', label: '16-30 rekaman' },
          { min: 6, max: 15, color: '#2563EB', label: '6-15 rekaman' },
          { min: 1, max: 5, color: '#1D4ED8', label: '1-5 rekaman' },
          { value: 0, color: '#1E293B', label: '0 rekaman' },
        ],
      },
      geo: {
        map: 'world',
        roam: true,
        center: viewConfig.center,
        zoom: viewConfig.zoom,
        aspectScale: 0.85,
        label: {
          show: false,
          color: '#E2E8F0',
          fontSize: 9,
        },
        emphasis: {
          label: {
            show: true,
            color: '#FFFFFF',
            fontWeight: 'bold',
            fontSize: 11,
          },
          itemStyle: {
            areaColor: '#F59E0B',
            borderColor: '#FDE68A',
            borderWidth: 1.5,
            shadowColor: 'rgba(0, 0, 0, 0.5)',
            shadowBlur: 8,
          },
        },
        select: {
          label: {
            show: true,
            color: '#FFFFFF',
            fontWeight: 'bold',
          },
          itemStyle: {
            areaColor: '#D97706',
            borderColor: '#FBBF24',
            borderWidth: 2,
          },
        },
        regions: activeNegaraList.map((n) => ({
          name: n,
          itemStyle: {
            areaColor: '#F59E0B',
            borderColor: '#FDE68A',
            borderWidth: 2,
          },
        })),
        itemStyle: {
          areaColor: '#1E293B',
          borderColor: '#334155',
          borderWidth: 0.8,
        },
      },
      series: [
        {
          name: 'Informasi Intelijen Global',
          type: 'map',
          geoIndex: 0,
          data: mapData,
        },
      ],
    };
  }, [mapData, viewConfig, activeNegaraList]);

  // Click on country triggers multi-select toggle
  const onChartClick = (params: any) => {
    if (params.name) {
      toggleFilter('negara', params.name);
    }
  };

  // Preset button click (syncs with global continent filter)
  const handlePreset = (continent: string) => {
    if (continent === 'Semua') {
      setFilter('benua', []);
    } else {
      toggleFilter('benua', continent);
    }
  };

  // Zoom handlers
  const handleZoom = (delta: number) => {
    const instance = echartsRef.current?.getEchartsInstance();
    if (!instance) return;
    const currentOpt = instance.getOption();
    const currentZoom = currentOpt.geo?.[0]?.zoom || 1;
    const newZoom = Math.max(0.6, Math.min(6, currentZoom + delta));
    instance.setOption({
      geo: {
        zoom: newZoom,
      },
    });
  };

  const handleResetZoom = () => {
    const instance = echartsRef.current?.getEchartsInstance();
    if (!instance) return;
    instance.setOption({
      geo: {
        center: viewConfig.center,
        zoom: viewConfig.zoom,
      },
    });
  };

  return (
    <div className="bg-navy-950 rounded-xl p-5 border border-navy-800 shadow-md text-white flex flex-col justify-between relative overflow-hidden">
      {/* Map Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-navy-800/80 z-10">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            Peta Geografis Intelijen Global & Antarkawasan
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Visualisasi batas wilayah geografis dunia bergradasi densitas informasi intelijen
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Preset Buttons for Continents */}
          <div className="flex items-center flex-wrap gap-1 bg-navy-900 p-1 rounded-lg border border-navy-800">
            <button
              onClick={() => handlePreset('Semua')}
              className={`px-2.5 py-1 rounded text-xs transition-all cursor-pointer ${
                activeBenuaList.length === 0
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua Kawasan
            </button>
            {availableContinents.map((b) => (
              <button
                key={b}
                onClick={() => handlePreset(b)}
                className={`px-2.5 py-1 rounded text-xs transition-all cursor-pointer ${
                  activeBenuaList.includes(b)
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-navy-900 p-1 rounded-lg border border-navy-800">
            <button
              onClick={() => handleZoom(0.4)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-navy-800 cursor-pointer"
              title="Perbesar Peta"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom(-0.4)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-navy-800 cursor-pointer"
              title="Perkecil Peta"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-navy-800 cursor-pointer"
              title="Reset Tampilan"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Real Geographic Map Canvas Container */}
      <div className="h-64 w-full relative bg-radial from-navy-900 to-navy-950 rounded-lg border border-navy-800/80 overflow-hidden">
        {/* Subtle coordinate grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none"></div>

        {/* Region Indicator Badge */}
        <div className="absolute top-2 left-4 text-[10px] font-mono font-bold tracking-wider text-emerald-400/90 uppercase pointer-events-none z-10 flex items-center gap-1.5 bg-navy-950/80 px-2 py-1 rounded border border-navy-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Cakupan:{' '}
          {activeBenuaList.length === 0
            ? 'Global (Semua Kawasan)'
            : `Fokus Kawasan: ${activeBenuaList.join(', ')}`}
        </div>

        {/* React ECharts with Global World Map */}
        <ReactECharts
          ref={echartsRef}
          option={option}
          style={{ height: '100%', width: '100%' }}
          notMerge={true}
          lazyUpdate={true}
          onEvents={{ click: onChartClick }}
        />
      </div>

      {/* Map Legend & Active State Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 pt-3 border-t border-navy-800/80 mt-2 gap-2">
        {/* Choropleth Gradient Color Legend */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Densitas:</span>
          <div className="flex items-center gap-1 font-mono text-[10px]">
            <span className="w-4 h-3 rounded bg-[#1E293B] border border-slate-700 inline-block" title="0 rekaman"></span>
            <span className="text-slate-500 mr-1">0</span>
            <span className="w-4 h-3 rounded bg-[#1D4ED8] inline-block" title="1-5 rekaman"></span>
            <span className="text-slate-400 mr-1">1-5</span>
            <span className="w-4 h-3 rounded bg-[#2563EB] inline-block" title="6-15 rekaman"></span>
            <span className="text-slate-400 mr-1">6-15</span>
            <span className="w-4 h-3 rounded bg-[#3B82F6] inline-block" title="16-30 rekaman"></span>
            <span className="text-slate-400 mr-1">16-30</span>
            <span className="w-4 h-3 rounded bg-[#60A5FA] inline-block" title=">30 rekaman"></span>
            <span className="text-blue-300 font-bold">&gt;30</span>
          </div>
        </div>

        {/* Selected Country Indicator */}
        <div className="flex items-center flex-wrap gap-1.5">
          {activeNegaraList.length > 0 ? (
            <>
              <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                Negara ({activeNegaraList.length}):
              </span>
              {activeNegaraList.map((n) => (
                <span
                  key={n}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px]"
                >
                  <span>{n}</span>
                  <button
                    onClick={() => toggleFilter('negara', n)}
                    className="ml-0.5 text-amber-300 hover:text-white cursor-pointer font-bold"
                    title={`Lepas filter ${n}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                onClick={() => setFilter('negara', [])}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline ml-1 cursor-pointer"
              >
                Reset Semua
              </button>
            </>
          ) : (
            <span className="text-[11px] text-slate-500 italic">
              Klik batas wilayah negara untuk multi-select negara pada dashboard
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
