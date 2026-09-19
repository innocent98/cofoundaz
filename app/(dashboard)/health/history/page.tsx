'use client';

import React, { useState } from 'react';
import { useHealthHistory } from '@/hooks/useHealthDetails';
import { ScoreHistoryChart } from '@/components/health/health-charts';

const RANGES = ['7d', '30d', '90d', 'all'] as const;
type Range = (typeof RANGES)[number];

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function TrendHistoryPage() {
  const [range, setRange] = useState<Range>('90d');
  const { points, loading } = useHealthHistory(range);

  const latest = points[points.length - 1];

  return (
    <div className="flex flex-col gap-6 pt-2 pb-12">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-display font-medium text-[#1E2923] tracking-tight">Score over time</h2>
        <div className="flex items-center gap-1 bg-[#F5F5F0] p-1 rounded-card border border-[#EBEBE6]">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3.5 py-1.5 rounded-[6px] text-xs font-medium transition-all cursor-pointer ${
                range === r ? 'bg-white text-[#1E2923] font-bold shadow-card' : 'bg-transparent text-[#768478] hover:text-[#1E2923]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card p-6 md:p-10 flex flex-col justify-between min-h-[420px]">
        {loading ? (
          <div className="flex-1 animate-pulse bg-[#F5F5F0] rounded-card" />
        ) : points.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
            <p className="text-sm font-bold text-[#1E2923]">No history in this range</p>
            <p className="text-xs text-[#768478] max-w-xs">Your score is recorded each time you complete an assessment — the trend fills in from there.</p>
          </div>
        ) : (
          <>
            <div className="w-full mt-4">
              <ScoreHistoryChart points={points} height={264} />
            </div>
            <div className="flex justify-between items-center text-xs font-medium text-[#768478] pt-6">
              <span>{fmtDate(points[0].computed_at)}</span>
              <span className="text-[#1E2923] font-bold">
                {fmtDate(latest.computed_at)} · {latest.score}
                {latest.delta !== 0 && (
                  <span className={latest.delta > 0 ? 'text-[#2D5A3F]' : 'text-[#B0483B]'}>
                    {' '}
                    ({latest.delta > 0 ? '+' : ''}
                    {latest.delta})
                  </span>
                )}
              </span>
            </div>
          </>
        )}
      </div>
      <p className="text-[11px] italic text-[#8E9B90]">Each point is a completed assessment; the change is measured against the closest reading at least 7 days earlier.</p>
    </div>
  );
}
