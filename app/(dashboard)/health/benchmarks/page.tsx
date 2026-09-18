'use client';

import React from 'react';
import { Users, BarChart3 } from 'lucide-react';
import { useHealthBenchmarks } from '@/hooks/useHealthDetails';

export default function BenchmarksPage() {
  const { benchmarks, loading } = useHealthBenchmarks();

  const hasData = !!benchmarks && benchmarks.status !== 'insufficient_data' && benchmarks.percentiles;

  return (
    <div className="flex flex-col gap-6 pt-2 pb-12">
      <div>
        <h2 className="text-3xl font-display font-medium text-[#1E2923] tracking-tight">How you compare</h2>
        <p className="text-xs text-[#617065] mt-1.5">
          {benchmarks?.cohort
            ? `Against anonymized ${benchmarks.cohort.industry} startups at the ${benchmarks.cohort.stage} stage.`
            : 'Against anonymized startups like yours.'}
        </p>
      </div>

      {loading && <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card h-64 animate-pulse" />}

      {!loading && !hasData && (
        <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card p-10 md:p-14 text-center flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-[#F0F4F1] text-[#2D5A3F] flex items-center justify-center">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#1E2923]">Not enough startups like yours yet</h3>
          <p className="text-sm text-[#768478] max-w-md">
            We only show benchmarks once there are at least {benchmarks?.min_cohort_size ?? 5} startups
            {benchmarks?.cohort ? ` in the ${benchmarks.cohort.industry} · ${benchmarks.cohort.stage} cohort` : ' in your cohort'} —
            so no one&apos;s score can be reverse-identified. Check back as your cohort grows.
          </p>
        </div>
      )}

      {!loading && hasData && benchmarks?.percentiles && (
        <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card p-6 md:p-10 flex flex-col gap-8">
          <div className="flex items-center gap-2 text-[#2D5A3F]">
            <BarChart3 className="w-5 h-5" />
            <span className="text-sm font-bold text-[#1E2923]">Your percentile by dimension</span>
          </div>
          <div className="flex flex-col gap-7">
            {Object.entries(benchmarks.percentiles).map(([label, pct]) => (
              <div key={label} className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1E2923] capitalize">{label}</span>
                  <span className="font-bold text-[#1E2923]">{pct}th percentile</span>
                </div>
                <div className="relative w-full h-3.5 bg-[#EAEFEA] rounded-full overflow-visible">
                  <div className="absolute top-[-3px] bottom-[-3px] w-[3.5px] bg-[#2D5A3F] rounded-full z-10" style={{ left: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] italic text-[#8E9B90]">
        Benchmarks are anonymized and aggregated. No startup&apos;s individual data is ever visible.
      </p>
    </div>
  );
}
