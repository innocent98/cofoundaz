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
          <StatCard kpi={kpi} />
        </DashboardErrorBoundary>
      ))}
    </section>
  );
}

function StatCard({ kpi }: { kpi: KPISnapshot }) {
  // Runway logic: if label is 'Runway' and value is < 6
  let isAlert = false;
  if (kpi.label.toLowerCase() === 'runway') {
    const val = parseFloat(kpi.value);
    if (!isNaN(val) && val < 6) {
      isAlert = true;
    }
  }

  if (kpi.isAlert) isAlert = true;

  return (
    <Link href={kpi.href || '#'} className={`bg-white p-5 rounded-card border ${isAlert ? 'border-[#B0483B]' : 'border-sage-100'} shadow-card flex flex-col justify-between hover:shadow-raised transition-shadow group`}>
      <div>
        <span className="text-[10px] font-bold text-sage-500 uppercase tracking-wider block mb-3">
          {kpi.label}
        </span>
        <div className="flex items-end justify-between mb-2">
          <span className={`text-2xl font-bold font-display leading-none ${isAlert ? 'text-[#B0483B]' : 'text-[#1C201D]'}`}>
            {kpi.value}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-pill ${
            kpi.trend === 'up'
              ? 'bg-[#E3EFE9] text-[#12291F]' // green
              : 'bg-sage-100 text-sage-700' // neutral/negative
          }`}
        >
          {kpi.delta}
        </span>
        {/* Lightweight monochrome SVG sparkline */}
        <div className="w-12 h-6 opacity-40 group-hover:opacity-100 transition-opacity">
          <svg viewBox="0 0 48 24" className="w-full h-full" preserveAspectRatio="none">
            <polyline
              points="0,20 10,15 20,18 30,8 40,12 48,4"
              fill="none"
              stroke={isAlert ? '#B0483B' : '#7FB09A'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}
