'use client';

import React from 'react';
import Link from 'next/link';
import { DashboardErrorBoundary } from './error-boundary';
import type { KPISnapshot } from '@/types/dashboard';

// Full class strings so Tailwind can see them; the grid reflows when restricted tiles are hidden.
const LG_COLS: Record<number, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
};

export function KPIStrip({ kpis, onRefetch }: { kpis: KPISnapshot[]; onRefetch: () => void }) {
  const visible = kpis.filter((k) => !k.hidden);
  if (visible.length === 0) return null;
  const lgCols = LG_COLS[Math.min(visible.length, 5)];
  return (
    <section className={`grid grid-cols-2 md:grid-cols-3 ${lgCols} gap-4 w-full col-span-1 md:col-span-12`}>
      {visible.map((kpi) => (
        <DashboardErrorBoundary key={kpi.id} onRetry={onRefetch}>
          <StatCard kpi={kpi} onRetry={onRefetch} />
        </DashboardErrorBoundary>
      ))}
    </section>
  );
}

function StatCard({ kpi, onRetry }: { kpi: KPISnapshot; onRetry?: () => void }) {
  if (kpi.error) {
    return (
      <div className="bg-white p-5 rounded-card border border-red-200 shadow-card flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-bold text-sage-500 uppercase tracking-wider block mb-3">
            {kpi.label}
          </span>
          <p className="text-sm font-semibold text-[#B0483B] mb-2">Unavailable</p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-[10px] font-bold text-sage-600 hover:text-sage-900 underline text-left mt-2 cursor-pointer"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  // The backend owns the alert (runway is_low / out_of_cash); no client-side heuristics.
  const isAlert = kpi.isAlert === true;
  const isComingSoon = kpi.status === 'not_built' || kpi.value === 'Coming Soon';
  const isEmpty = kpi.status === 'no_data';

  return (
    <Link
      href={kpi.cta?.href ?? kpi.href ?? '#'}
      title={kpi.hint}
      className={`bg-white p-5 rounded-card border ${
        isAlert ? 'border-[#B0483B]' : 'border-sage-100'
      } shadow-card flex flex-col justify-between hover:shadow-raised transition-shadow group`}
    >
      <div>
        <span className="text-[10px] font-bold text-sage-500 uppercase tracking-wider block mb-3">
          {kpi.label}
        </span>
        <div className="flex items-end justify-between mb-2">
          <span
            className={`font-bold font-display leading-tight ${
              isComingSoon || isEmpty
                ? 'text-base font-medium text-sage-400'
                : 'text-2xl'
            } ${isAlert ? 'text-[#B0483B]' : 'text-[#1C201D]'}`}
          >
            {kpi.value}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 min-h-[20px] gap-2">
        {isEmpty && kpi.cta ? (
          <span className="text-[10px] font-bold text-sage-600 group-hover:text-sage-900 underline">
            {kpi.cta.label}
          </span>
        ) : null}
        {!isEmpty && kpi.hint ? (
          <span className="text-[10px] text-sage-500">{kpi.hint}</span>
        ) : null}
        {kpi.delta ? (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-pill ${
              kpi.trend === 'up'
                ? 'bg-[#E3EFE9] text-[#12291F]' // green
                : 'bg-sage-100 text-sage-700' // neutral/negative
            }`}
          >
            {kpi.delta}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
