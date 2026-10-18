'use client';

import React, { useState } from 'react';
import { HISTORY_RANGES, useHealthHistory } from '@/hooks/useHealthDetails';
import type { HistoryRange } from '@/hooks/useHealthDetails';
import { ScoreHistoryChart } from '@/components/health/health-charts';
import { HealthError } from '@/components/health/health-states';

const RANGE_LABEL: Record<HistoryRange, string> = { '30d': '30 days', '90d': '90 days', '365d': '365 days' };

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TrendHistoryPage() {
  const [range, setRange] = useState<HistoryRange>('90d');
  const { points, markers, loading, error, refetch } = useHealthHistory(range);

  const latest = points[points.length - 1];

  return (
    <div className="flex flex-col gap-6 pt-2 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h2 className="text-3xl font-display font-medium text-[#1E2923] tracking-tight">Score over time</h2>
        <div role="group" aria-label="Date range" className="flex items-center gap-1 bg-[#F5F5F0] p-1 rounded-card border border-[#EBEBE6] w-fit">
          {HISTORY_RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              aria-pressed={range === r}
              className={`px-3.5 py-1.5 rounded-[6px] text-xs font-medium transition-all cursor-pointer ${
                range === r ? 'bg-white text-[#1E2923] font-bold shadow-card' : 'bg-transparent text-[#768478] hover:text-[#1E2923]'
              }`}
            >
              {RANGE_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <HealthError title="Couldn't load your score history" message={error} onRetry={refetch} />
      ) : (
        <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card p-6 md:p-10 flex flex-col justify-between min-h-[420px]">
          {loading ? (
            <div className="flex-1 animate-pulse bg-[#F5F5F0] rounded-card" />
          ) : points.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
              <p className="text-sm font-bold text-[#1E2923]">No history in the last {RANGE_LABEL[range]}</p>
              <p className="text-xs text-[#768478] max-w-xs">
                Your score is recorded each time it is recalculated, so the trend fills in as you work. Try a longer range.
              </p>
            </div>
          ) : (
            <>
              <div className="w-full mt-4">
                <ScoreHistoryChart points={points} markers={markers} height={264} />
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
      )}

      {!loading && !error && markers.length > 0 && (
        <section aria-labelledby="health-events" className="bg-white rounded-modal border border-[#EBEBE6] shadow-card p-6">
          <h3 id="health-events" className="text-sm font-bold text-[#1E2923] uppercase tracking-wide mb-3 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#9C5B34] inline-block" aria-hidden="true" />
            What moved your score
          </h3>
          <ul className="flex flex-col divide-y divide-[#F0F0EC]">
            {markers.map((m, i) => (
              <li key={`${m.at}-${i}`} className="flex items-center justify-between gap-4 py-2.5 text-xs">
                <span className="font-semibold text-[#1E2923]">{m.label}</span>
                <span className="text-[#768478] shrink-0">{fmtDate(m.at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-[11px] italic text-[#8E9B90]">
        A point is added whenever your scores are recalculated. The change shown is measured against the closest reading at least 7 days earlier.
      </p>
    </div>
  );
}
