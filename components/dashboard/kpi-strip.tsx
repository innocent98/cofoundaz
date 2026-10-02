'use client';

import React from 'react';
import Link from 'next/link';
import { DashboardErrorBoundary } from './error-boundary';
import type { KPISnapshot } from '@/types/dashboard';

export function KPIStrip({ kpis, onRefetch }: { kpis: KPISnapshot[]; onRefetch: () => void }) {
  return (
    <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full col-span-1 md:col-span-12">
      {kpis.map((kpi) => (
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

  // Runway logic: if label is 'Runway' and value is < 6
  let isAlert = false;
  if (kpi.label.toLowerCase() === 'runway') {
    const val = parseFloat(kpi.value);
    if (!isNaN(val) && val < 6) {
      isAlert = true;
    }
  }

  if (kpi.isAlert) isAlert = true;
  const isComingSoon = kpi.value === 'Coming Soon';

  return (
    <Link
      href={kpi.href || '#'}
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
              isComingSoon
                ? 'text-base font-medium text-sage-400'
                : 'text-2xl'
            } ${isAlert ? 'text-[#B0483B]' : 'text-[#1C201D]'}`}
          >
            {kpi.value}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 min-h-[20px]">
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
