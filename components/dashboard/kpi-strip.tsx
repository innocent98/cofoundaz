'use client';

import React from 'react';
import Link from 'next/link';
import { DashboardErrorBoundary } from './error-boundary';
import type { KPISnapshot } from '@/types/dashboard';
import { CARD_ERROR_COPY } from './card-states';
import { Sparkline } from './sparkline';
import { canSee, type MemberRole } from '@/lib/nav-access';

// Full class strings so Tailwind can see them; the grid reflows when restricted tiles are hidden.
const LG_COLS: Record<number, string> = {
  1: 'xl:grid-cols-1',
  2: 'xl:grid-cols-2',
  3: 'xl:grid-cols-3',
  4: 'xl:grid-cols-4',
  5: 'xl:grid-cols-5',
};

export function KPIStrip({
  kpis,
  onRefetch,
  role = null,
  missionRestricted = false,
}: {
  kpis: KPISnapshot[];
  onRefetch: () => void;
  /** Tiles whose page the role cannot open render without a link. */
  role?: MemberRole | null;
  /** The Tasks tile is a count of mission tasks, so it goes with the mission card. */
  missionRestricted?: boolean;
}) {
  const visible = kpis.filter((k) => !k.hidden && !(missionRestricted && k.metric === 'tasks_completed'));
  if (visible.length === 0) return null;
  const lgCols = LG_COLS[Math.min(visible.length, 5)];
  return (
    <section className={`grid grid-cols-2 md:grid-cols-3 ${lgCols} gap-4 w-full col-span-1 md:col-span-12`}>
      {visible.map((kpi) => (
        <DashboardErrorBoundary key={kpi.id} onRetry={onRefetch}>
          <StatCard kpi={kpi} onRetry={onRefetch} role={role} />
        </DashboardErrorBoundary>
      ))}
    </section>
  );
}

function StatCard({ kpi, onRetry, role }: { kpi: KPISnapshot; onRetry?: () => void; role: MemberRole | null }) {
  if (kpi.error) {
    return (
      <div className="bg-white p-5 rounded-card border border-danger-200 shadow-card flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-3">
            {kpi.label}
          </span>
          <p className="text-sm font-semibold text-danger-600 mb-2">{CARD_ERROR_COPY}</p>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-[10px] font-bold text-neutral-600 hover:text-neutral-900 underline text-left mt-2 cursor-pointer"
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

  const href = kpi.cta?.href ?? kpi.href ?? null;
  // A role that cannot open the target page gets the tile without a link (it would only bounce to access-denied).
  const linked = href !== null && canSee('/' + (href.split('/')[1] ?? ''), role);
  const className = `bg-white p-5 rounded-card border ${
        isAlert ? 'border-danger-600' : 'border-neutral-100'
      } shadow-card flex flex-col justify-between ${linked ? 'hover:shadow-raised transition-shadow' : ''} group`;
  const inner = (
    <>
      <div>
        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-3">
          {kpi.label}
        </span>
        <div className="mb-2">
          <span
            className={`font-bold font-display leading-tight ${
              isComingSoon || isEmpty
                ? 'text-base font-medium text-neutral-500'
                : 'text-2xl'
            } ${isAlert ? 'text-danger-600' : 'text-neutral-x1c201d'}`}
          >
            {kpi.value}
          </span>
        </div>
        {kpi.series && kpi.series.length >= 2 ? (
          <Sparkline
            values={kpi.series}
            className={`mb-1 ${kpi.deltaDirection === 'down' ? 'text-danger-600' : 'text-brand-x266b4e'}`}
          />
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between mt-2 min-h-[20px] gap-x-2 gap-y-1">
        {isEmpty && kpi.cta ? (
          <span className="text-[10px] font-bold text-neutral-600 group-hover:text-neutral-900 underline">
            {kpi.cta.label}
          </span>
        ) : null}
        {!isEmpty && kpi.hint ? (
          <span className="text-[10px] text-neutral-500">{kpi.hint}</span>
        ) : null}
        {kpi.deltaLabel ? (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-pill ${
              kpi.deltaDirection === 'up'
                ? 'bg-brand-100 text-brand-900'
                : kpi.deltaDirection === 'down'
                  ? 'bg-danger-xf6e3df text-danger-deep'
                  : 'bg-neutral-100 text-neutral-700'
            }`}
          >
            {kpi.deltaLabel}
          </span>
        ) : null}
      </div>
    </>
  );
  return linked ? (
    <Link href={href as string} title={kpi.hint} className={className}>
      {inner}
    </Link>
  ) : (
    <div title={kpi.hint} className={className}>
      {inner}
    </div>
  );
}
