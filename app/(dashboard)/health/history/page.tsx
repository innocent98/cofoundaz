'use client';

import React, { useState } from 'react';

export default function TrendHistoryPage() {
  const [trendRange, setTrendRange] = useState<'30d' | '90d' | '1y'>('90d');

  // SVG Path logic just for mockup visual
  const pathD = 
    trendRange === '30d' ? 'M 0 160 L 250 150 L 500 130 L 750 100 L 1000 60' :
    trendRange === '90d' ? 'M 0 190 Q 250 175 500 140 T 1000 60' :
    'M 0 220 Q 200 200 400 160 T 800 100 T 1000 60';

  return (
    <div className="flex flex-col gap-6 pt-2 pb-12">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-display font-medium text-[#1E2923] tracking-tight">
          Score over time
        </h2>

        <div className="flex items-center gap-1 bg-[#F5F5F0] p-1 rounded-card border border-[#EBEBE6]">
          {(['30d', '90d', '1y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTrendRange(range)}
              className={`px-3.5 py-1.5 rounded-[6px] text-xs font-medium transition-all cursor-pointer ${
                trendRange === range
                  ? 'bg-white text-[#1E2923] font-bold shadow-sm'
                  : 'bg-transparent text-[#768478] hover:text-[#1E2923]'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card p-6 md:p-10 flex flex-col justify-between min-h-[420px]">
        <div className="relative w-full h-64 mt-4">
          {/* Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            <div className="border-b border-[#F0F0EC] w-full h-0"></div>
            <div className="border-b border-[#F0F0EC] w-full h-0"></div>
            <div className="border-b border-[#F0F0EC] w-full h-0"></div>
          </div>

          <div className="relative w-full h-full">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 1000 240"
              preserveAspectRatio="none"
            >
              {/* Trend Line */}
              <path
                d={pathD}
                fill="none"
                stroke="#2D5A3F" // --green-700 approx
                strokeWidth="3.5"
                strokeLinecap="round"
                className="transition-all duration-500 ease-in-out"
              />
            </svg>

            {/* Event Markers (Mock) */}
            {trendRange !== '30d' && (
              <div
                className="absolute flex flex-col items-center"
                style={{ left: '33%', top: '63%', transform: 'translate(-50%, -50%)' }}
              >
                <span className="text-[11px] font-bold text-[#9C5B34] whitespace-nowrap mb-1">
                  Business plan generated
                </span>
                <div className="w-3.5 h-3.5 rounded-full bg-[#9C5B34] border-2 border-white shadow-card"></div>
              </div>
            )}

            <div
              className="absolute flex flex-col items-center"
              style={{ left: '68%', top: '42%', transform: 'translate(-50%, -50%)' }}
            >
              <span className="text-[11px] font-bold text-[#9C5B34] whitespace-nowrap mb-1">
                Smoke test passed
              </span>
              <div className="w-3.5 h-3.5 rounded-full bg-[#9C5B34] border-2 border-white shadow-card"></div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-xs font-medium text-[#768478] pt-6 border-t border-transparent">
          <span>{trendRange === '30d' ? '4 weeks ago' : trendRange === '90d' ? '12 weeks ago' : '1 year ago'}</span>
          <span>Today · 72</span>
        </div>
      </div>
    </div>
  );
}
