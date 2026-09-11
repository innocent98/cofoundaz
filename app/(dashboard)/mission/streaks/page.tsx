'use client';

import React from 'react';

export default function MissionStreaksPage() {
  // Matrix representing the 14-week activity grid (7 rows x 14 columns)
  const activityGrid: number[][] = [
    [0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 0, 0, 0, 0],
    [3, 3, 3, 0, 0, 1, 1, 2, 2, 2, 3, 3, 0, 0],
    [2, 2, 2, 3, 3, 3, 0, 1, 1, 1, 2, 2, 0, 0],
    [1, 1, 1, 1, 3, 3, 3, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 2, 2, 3, 3, 3, 0, 0, 0, 0],
    [3, 3, 3, 0, 0, 1, 1, 2, 2, 2, 3, 3, 0, 0],
    [2, 2, 2, 3, 3, 0, 0, 1, 1, 1, 2, 2, 0, 0],
  ];

  const levelColorMap = [
    'bg-[#EBF2EE]',
    'bg-[#B5D4C0]',
    'bg-[#4C8260]',
    'bg-[#193C28]',
  ];

  return (
    <main className="p-4 md:p-8 max-w-4xl w-full mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-8 pt-2 pb-12">
        <div>
          <h2 className="text-3xl font-display font-semibold text-[#1E2923] tracking-tight">
            Streak history
          </h2>
          <p className="text-xs md:text-sm text-[#768478] mt-1.5 font-normal">
            Consistency beats intensity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col justify-between h-36">
            <span className="text-[11px] font-bold tracking-wider text-[#768478] uppercase">
              CURRENT STREAK
            </span>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-display font-semibold text-[#1E2923]">
                6 days
              </span>
              <span className="text-2xl">🔥</span>
            </div>
          </div>

          <div className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col justify-between h-36">
            <span className="text-[11px] font-bold tracking-wider text-[#768478] uppercase">
              BEST STREAK
            </span>
            <span className="text-3xl font-display font-semibold text-[#1E2923]">
              21 days
            </span>
          </div>

          <div className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col justify-between h-36">
            <span className="text-[11px] font-bold tracking-wider text-[#768478] uppercase">
              COMPLETION (90D)
            </span>
            <span className="text-3xl font-display font-semibold text-[#1E2923]">
              82%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-modal p-6 md:p-8 border border-[#EBEBE6] shadow-card flex flex-col gap-6">
          <span className="text-xs font-semibold text-[#1E2923]">
            Last 14 weeks
          </span>

          <div className="overflow-x-auto pb-2 no-scrollbar">
            <div className="grid grid-rows-7 grid-flow-col gap-1.5 w-max">
              {activityGrid.map((row, rowIndex) =>
                row.map((level, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`w-4 h-4 rounded-xs transition-colors ${levelColorMap[level]}`}
                  />
                ))
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#768478] font-medium">
            <span>Less</span>
            <div className="flex items-center gap-1.5">
              {levelColorMap.map((colorClass, idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-xs ${colorClass}`}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </main>
  );
}
