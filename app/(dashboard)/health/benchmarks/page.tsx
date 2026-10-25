'use client';

import React from 'react';
import { Users, BarChart3 } from 'lucide-react';
import { useHealthBenchmarks } from '@/hooks/useHealthDetails';
import type { BenchmarkRow } from '@/hooks/useHealthDetails';
import { HealthError } from '@/components/health/health-states';

// The API keys dimensions product/market/money/legal/team plus `overall`.
const ROW_ORDER = ['overall', 'product', 'market', 'money', 'legal', 'team'];
const ROW_LABEL: Record<string, string> = {
  overall: 'Overall',
  product: 'Product',
  market: 'Market',
  money: 'Financial',
  financial: 'Financial',
  legal: 'Legal',
  team: 'Team',
};

function rowOrder(key: string): number {
  const i = ROW_ORDER.indexOf(key);
  return i < 0 ? ROW_ORDER.length : i;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n));
}

function BenchmarkBar({ label, row }: { label: string; row: BenchmarkRow }) {
  const left = clamp(row.p25);
  const width = Math.max(0, clamp(row.p75) - left);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-ink">{label}</span>
        <span className="font-bold text-ink">Better than {row.your_percentile}% of similar startups</span>
      </div>
      <div
        className="relative w-full h-3.5 bg-neutral-xeaefea rounded-full"
        role="img"
        aria-label={`${label}: you ${row.you}, typical range ${row.p25} to ${row.p75}, median ${row.p50}`}
      >
        <div className="absolute inset-y-0 rounded-full bg-brand-xcfe0d6" style={{ left: `${left}%`, width: `${width}%` }} />
        <div className="absolute top-[-2px] bottom-[-2px] w-px bg-ink-subtle" style={{ left: `${clamp(row.p50)}%` }} />
        <div className="absolute top-[-3px] bottom-[-3px] w-[3.5px] bg-brand-mid rounded-full z-10" style={{ left: `calc(${clamp(row.you)}% - 1.75px)` }} />
      </div>
      <div className="flex justify-between text-[11px] text-ink-soft">
        <span>You: {row.you}</span>
        <span>Typical range {row.p25} to {row.p75} · median {row.p50}</span>
      </div>
    </div>
  );
}

export default function BenchmarksPage() {
  const { benchmarks, loading, error, refetch } = useHealthBenchmarks();

  const percentiles = benchmarks?.status === 'ok' ? benchmarks.percentiles : null;
  const rows = percentiles
    ? Object.entries(percentiles).sort(([a], [b]) => rowOrder(a) - rowOrder(b))
    : [];

  return (
    <div className="flex flex-col gap-6 pt-2 pb-12">
      <div>
        <h2 className="text-3xl font-display font-medium text-ink tracking-tight">How you compare</h2>
        <p className="text-xs text-ink-muted mt-1.5">
          {benchmarks?.cohort
            ? `Against anonymized ${benchmarks.cohort.industry} startups at the ${benchmarks.cohort.stage} stage${
                benchmarks.cohort.size_at_least ? ` (${benchmarks.cohort.size_at_least}+ startups)` : ''
              }.`
            : 'Against anonymized startups like yours.'}
        </p>
      </div>

      {loading && <div className="bg-white rounded-modal border border-line-soft shadow-card h-64 animate-pulse" />}

      {!loading && error && <HealthError title="Couldn't load benchmarks" message={error} onRetry={refetch} />}

      {!loading && !error && rows.length === 0 && (
        <div className="bg-white rounded-modal border border-line-soft shadow-card p-10 md:p-14 text-center flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-neutral-xf0f4f1 text-brand-mid flex items-center justify-center">
            <Users className="w-7 h-7" aria-hidden="true" />
          </div>
          <h3 className="text-base font-bold text-ink">Not enough startups like yours yet</h3>
          <p className="text-sm text-ink-soft max-w-md">
            We only show benchmarks once at least {benchmarks?.min_cohort_size ?? 10} other startups
            {benchmarks?.cohort ? ` are in the ${benchmarks.cohort.industry} · ${benchmarks.cohort.stage} cohort` : ' are in your cohort'},
            so no one&apos;s score can be reverse-identified. Check back as your cohort grows.
          </p>
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className="bg-white rounded-modal border border-line-soft shadow-card p-6 md:p-10 flex flex-col gap-8">
          <div className="flex items-center gap-2 text-brand-mid">
            <BarChart3 className="w-5 h-5" aria-hidden="true" />
            <span className="text-sm font-bold text-ink">Your score against similar startups</span>
          </div>
          <div className="flex flex-col gap-7">
            {rows.map(([key, row]) => (
              <BenchmarkBar key={key} label={ROW_LABEL[key] ?? key} row={row} />
            ))}
          </div>
          <p className="text-[11px] text-ink-soft">The shaded band is the middle half of similar startups (25th to 75th percentile). The thin line is the median.</p>
        </div>
      )}

      <p className="text-[11px] italic text-ink-subtle">
        Benchmarks are anonymized and aggregated. No startup&apos;s individual data is ever visible.
      </p>
    </div>
  );
}
