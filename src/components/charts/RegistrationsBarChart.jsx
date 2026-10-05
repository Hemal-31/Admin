import React, { useState, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';

/**
 * Clean, High-Legibility Cyber Sentinel Bar Chart
 * Features large readable numbers, well-proportioned bars, intuitive navigation,
 * and zero layout shifts or distracting hover clutter.
 */
export default function RegistrationsBarChart({ data = [], height = 420 }) {
  const [metricMode, setMetricMode] = useState('TECH_NONTECH'); // 'TECH_NONTECH' | 'STATUS' | 'TOTAL'
  const [timeRange, setTimeRange] = useState('6D'); // '6D' | 'ALL'
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const rawData = Array.isArray(data) ? data : [];

  // Filter data by time range: '6D' generates continuous 6-day window, 'ALL' shows all registered dates
  const chartData = useMemo(() => {
    if (!rawData.length) return [];
    if (timeRange === '6D') {
      // Find anchor date: latest date in registrations or current time
      const latestDataTs = Math.max(...rawData.map((d) => Number(d.date) || 0));
      const anchorTs = latestDataTs > 0 ? Math.max(Date.now(), latestDataTs) : Date.now();
      const anchor = new Date(anchorTs);

      const map = new Map();
      rawData.forEach((item) => {
        if (item.key) map.set(item.key, item);
      });

      const days = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(anchor);
        d.setHours(0, 0, 0, 0);
        d.setDate(anchor.getDate() - i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const key = `${y}-${m}-${day}`;
        const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

        if (map.has(key)) {
          days.push(map.get(key));
        } else {
          days.push({
            key,
            date: d.getTime(),
            label,
            verified: 0,
            pending: 0,
            tech: 0,
            nonTech: 0,
            total: 0,
          });
        }
      }
      return days;
    }
    return rawData;
  }, [rawData, timeRange]);

  // Mode Configuration
  const metricConfig = useMemo(() => {
    switch (metricMode) {
      case 'STATUS':
        return {
          firstLabel: 'Verified',
          secondLabel: 'Pending',
          firstColor: '#34d399',
          secondColor: '#f472b6',
          firstGrad: 'url(#emeraldBarGrad)',
          secondGrad: 'url(#pinkBarGrad)',
          getFirst: (item) => Number(item.verified) || 0,
          getSecond: (item) => Number(item.pending) || 0,
        };
      case 'TOTAL':
        return {
          firstLabel: 'Total Registrations',
          secondLabel: null,
          firstColor: '#60a5fa',
          secondColor: null,
          firstGrad: 'url(#royalBarGrad)',
          secondGrad: null,
          getFirst: (item) => Number(item.total) || 0,
          getSecond: () => 0,
        };
      case 'TECH_NONTECH':
      default:
        return {
          firstLabel: 'Technical (Day 1)',
          secondLabel: 'Non-Technical (Day 2)',
          firstColor: '#38bdf8',
          secondColor: '#ec4899',
          firstGrad: 'url(#cyanBarGrad)',
          secondGrad: 'url(#pinkBarGrad)',
          getFirst: (item) => Number(item.tech) || 0,
          getSecond: (item) => Number(item.nonTech) || 0,
        };
    }
  }, [metricMode]);

  // Peak calculation for Y-Axis
  const peakVal = Math.max(
    1,
    ...chartData.flatMap((item) =>
      metricMode === 'TOTAL'
        ? [Number(item.total) || 0]
        : [metricConfig.getFirst(item), metricConfig.getSecond(item)]
    )
  );

  const maxVal = Math.max(4, Math.ceil(peakVal / 4) * 4);
  const yTicks = [maxVal, Math.round(maxVal * 0.75), Math.round(maxVal * 0.5), Math.round(maxVal * 0.25), 0];

  if (!chartData.length) {
    return (
      <div className="w-full">
        <h3 className="text-lg sm:text-xl font-bold font-heading text-white">
          Daily Registration Flow
        </h3>
        <div className="h-56 flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-base text-slate-400 mt-4">
          No registration activity logged for this period.
        </div>
      </div>
    );
  }

  // Canvas Coordinates with generous padding
  const chartWidth = 760;
  const chartHeight = 340;
  const paddingLeft = 52;
  const paddingBottom = 56;
  const paddingTop = 18;
  const paddingRight = 24;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const numSlots = chartData.length;
  const barSlotWidth = innerWidth / numSlots;

  const isDual = metricMode !== 'TOTAL';
  // Generous, thick bars with adaptive width for both multi-day (7D) and filtered (All Days) views
  const barWidth = isDual
    ? Math.max(22, Math.min(64, (barSlotWidth - 22) / 2))
    : Math.max(36, Math.min(92, barSlotWidth * 0.58));
  const barGap = isDual ? Math.max(4, Math.min(8, Math.round(barSlotWidth * 0.08))) : 0;

  const handleBarClick = () => {
    if (typeof onBarClick === 'function') {
      onBarClick();
    }
  };

  return (
    <div className="w-full space-y-5">
      {/* 1. Header with Bold Title, Clear Subtitle & Navigation Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1d2f5c]">
        <div>
          <div className="flex items-center gap-3">
            <span
              className="p-2 rounded-xl border text-[#7dd3fc]"
              style={{
                background: 'rgba(37,99,235,0.15)',
                borderColor: 'rgba(96,165,250,0.6)',
                boxShadow: '0 0 14px rgba(59,130,246,0.35)',
              }}
            >
              <BarChart3 className="w-5 h-5" />
            </span>
            <h3 className="text-xl sm:text-2xl font-black font-heading text-white tracking-wide">
              Daily Registration Flow
            </h3>
          </div>
          <p className="text-sm sm:text-base text-slate-300 mt-1.5 font-semibold">
            Daily delegate volume & track registration distribution
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
          <div className="inline-flex p-1 bg-[#0a1022] border border-[#1d2f5c] rounded-xl text-xs sm:text-sm font-extrabold shadow-[0_0_18px_rgba(37,99,235,0.08)]">
            <button
              type="button"
              onClick={() => setTimeRange('6D')}
              className="px-3.5 py-1.5 rounded-lg transition-all"
              style={
                timeRange === '6D'
                  ? {
                      background: 'linear-gradient(135deg, rgba(37,99,235,0.42), rgba(168,85,247,0.35))',
                      color: '#ffffff',
                      border: '1px solid rgba(125,211,252,0.7)',
                      boxShadow: '0 0 12px rgba(59,130,246,0.4)',
                    }
                  : { color: '#94a3b8' }
              }
            >
              Last 6 Days (6)
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('ALL')}
              className="px-3.5 py-1.5 rounded-lg transition-all"
              style={
                timeRange === 'ALL'
                  ? {
                      background: 'linear-gradient(135deg, rgba(37,99,235,0.42), rgba(168,85,247,0.35))',
                      color: '#ffffff',
                      border: '1px solid rgba(125,211,252,0.7)',
                      boxShadow: '0 0 12px rgba(59,130,246,0.4)',
                    }
                  : { color: '#94a3b8' }
              }
            >
              All Days ({rawData.length})
            </button>
          </div>

          <div className="inline-flex p-1 bg-[#0a1022] border border-[#1d2f5c] rounded-xl text-xs sm:text-sm font-extrabold shadow-[0_0_18px_rgba(37,99,235,0.08)] gap-1">
            <button
              type="button"
              onClick={() => setMetricMode('TECH_NONTECH')}
              className="px-3.5 py-1.5 rounded-lg transition-all"
              style={
                metricMode === 'TECH_NONTECH'
                  ? {
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.42), rgba(236,72,153,0.35))',
                      color: '#ffffff',
                      border: '1px solid rgba(125,211,252,0.7)',
                      boxShadow: '0 0 12px rgba(236,72,153,0.35)',
                    }
                  : { color: '#94a3b8' }
              }
            >
              Tech / Non-Tech
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('STATUS')}
              className="px-3.5 py-1.5 rounded-lg transition-all"
              style={
                metricMode === 'STATUS'
                  ? {
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.42), rgba(236,72,153,0.35))',
                      color: '#ffffff',
                      border: '1px solid rgba(125,211,252,0.7)',
                      boxShadow: '0 0 12px rgba(59,130,246,0.4)',
                    }
                  : { color: '#94a3b8' }
              }
            >
              Verified / Pending
            </button>
            <button
              type="button"
              onClick={() => setMetricMode('TOTAL')}
              className="px-3.5 py-1.5 rounded-lg transition-all"
              style={
                metricMode === 'TOTAL'
                  ? {
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.42), rgba(236,72,153,0.35))',
                      color: '#ffffff',
                      border: '1px solid rgba(125,211,252,0.7)',
                      boxShadow: '0 0 12px rgba(59,130,246,0.4)',
                    }
                  : { color: '#94a3b8' }
              }
            >
              Total
            </button>
          </div>
        </div>
      </div>

      {/* 2. Bold, High-Contrast Legend with Larger Text */}
      <div className="flex items-center gap-6 text-sm sm:text-base font-extrabold px-1">
        <div className="flex items-center gap-2.5">
          <span
            className="w-4 h-4 rounded-md border"
            style={{
              backgroundColor: metricConfig.firstColor,
              borderColor: '#ffffff',
              boxShadow: `0 0 10px ${metricConfig.firstColor}`,
            }}
          />
          <span className="text-slate-100">{metricConfig.firstLabel}</span>
        </div>

        {metricConfig.secondLabel && (
          <div className="flex items-center gap-2.5">
            <span
              className="w-4 h-4 rounded-md border"
              style={{
                backgroundColor: metricConfig.secondColor,
                borderColor: '#ffffff',
                boxShadow: `0 0 10px ${metricConfig.secondColor}`,
              }}
            />
            <span className="text-slate-100">{metricConfig.secondLabel}</span>
          </div>
        )}
      </div>

      {/* 3. Clean SVG Chart Area without Layout Shifts */}
      <div className="relative w-full overflow-hidden pt-3 pb-2">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + paddingBottom}`}
          className="w-full h-auto"
          style={{ height: `${height}px`, minHeight: '360px', maxHeight: `${height}px` }}
        >
          <defs>
            <linearGradient id="cyanBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="1" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.72" />
            </linearGradient>

            <linearGradient id="royalBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="1" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.72" />
            </linearGradient>

            <linearGradient id="emeraldBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="1" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.65" />
            </linearGradient>

            <linearGradient id="pinkBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="1" />
              <stop offset="100%" stopColor="#db2777" stopOpacity="0.7" />
            </linearGradient>

            <filter id="barGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#60a5fa" floodOpacity="0.9" />
            </filter>
          </defs>

          {/* Horizontal Reference Gridlines & Large Y-Axis Scale Values */}
          {yTicks.map((tick) => {
            const yPos = paddingTop + (1 - tick / maxVal) * innerHeight;
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={yPos}
                  x2={chartWidth - paddingRight}
                  y2={yPos}
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeDasharray={tick === 0 ? 'none' : '4 4'}
                  strokeWidth="1.2"
                />
                <text
                  x={paddingLeft - 12}
                  y={yPos + 5}
                  fill="#94a3b8"
                  fontSize="14"
                  fontWeight="800"
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="end"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Bar Groups: Clean, Bold, and Free of Distracting Hover Boxes */}
          {chartData.map((item, index) => {
            const slotCenterX = paddingLeft + index * barSlotWidth + barSlotWidth / 2;
            const isHovered = hoveredIdx === index;

            const valFirst = metricConfig.getFirst(item);
            const valSecond = metricConfig.getSecond(item);

            const heightFirst = Math.max(valFirst > 0 ? 10 : 2, (valFirst / maxVal) * innerHeight);
            const heightSecond = Math.max(valSecond > 0 ? 10 : 2, (valSecond / maxVal) * innerHeight);

            const yFirst = paddingTop + innerHeight - heightFirst;
            const ySecond = paddingTop + innerHeight - heightSecond;

            const xFirst = isDual ? slotCenterX - barWidth - barGap / 2 : slotCenterX - barWidth / 2;
            const xSecond = slotCenterX + barGap / 2;

            return (
              <g
                key={index}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredIdx(index)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={handleBarClick}
              >
                {/* Primary Bar with Smooth Glowing Effect */}
                <rect
                  x={xFirst}
                  y={yFirst}
                  width={barWidth}
                  height={heightFirst}
                  rx="7"
                  fill={metricConfig.firstGrad}
                  opacity={isHovered || hoveredIdx === null ? 1 : 0.65}
                  style={{
                    filter: isHovered
                      ? `drop-shadow(0 0 14px ${metricConfig.firstColor})`
                      : `drop-shadow(0 0 5px ${metricConfig.firstColor}60)`,
                    transition: 'all 0.25s ease',
                  }}
                />

                {/* Large, Bold, Crystal-Clear Value Number on top of Primary Bar */}
                {valFirst > 0 && (
                  <text
                    x={xFirst + barWidth / 2}
                    y={yFirst - 8}
                    fill={metricConfig.firstColor}
                    fontSize="16"
                    fontWeight="900"
                    fontFamily="JetBrains Mono, monospace"
                    textAnchor="middle"
                    style={{
                      filter: `drop-shadow(0 0 8px ${metricConfig.firstColor}80)`,
                    }}
                  >
                    {valFirst}
                  </text>
                )}

                {/* Secondary Bar */}
                {isDual && (
                  <>
                    <rect
                      x={xSecond}
                      y={ySecond}
                      width={barWidth}
                      height={heightSecond}
                      rx="7"
                      fill={metricConfig.secondGrad}
                      opacity={isHovered || hoveredIdx === null ? 1 : 0.65}
                      style={{
                        filter: isHovered
                          ? `drop-shadow(0 0 14px ${metricConfig.secondColor})`
                          : `drop-shadow(0 0 5px ${metricConfig.secondColor}60)`,
                        transition: 'all 0.25s ease',
                      }}
                    />

                    {/* Large, Bold, Crystal-Clear Value Number on top of Secondary Bar */}
                    {valSecond > 0 && (
                      <text
                        x={xSecond + barWidth / 2}
                        y={ySecond - 8}
                        fill={metricConfig.secondColor}
                        fontSize="16"
                        fontWeight="900"
                        fontFamily="JetBrains Mono, monospace"
                        textAnchor="middle"
                        style={{
                          filter: `drop-shadow(0 0 8px ${metricConfig.secondColor}80)`,
                        }}
                      >
                        {valSecond}
                      </text>
                    )}
                  </>
                )}

                {/* X-Axis Date Label: Large, Bright, Bold and Easily Readable */}
                <text
                  x={slotCenterX}
                  y={chartHeight + 28}
                  fill={isHovered ? '#00f0ff' : '#f8fafc'}
                  fontSize="15"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                  textAnchor="middle"
                  fontWeight="800"
                  className="transition-colors duration-150"
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
