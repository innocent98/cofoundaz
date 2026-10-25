'use client';

import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useValidationOverview } from '@/hooks/useValidationOverview';
import { RiskiestNudge } from '@/components/validation/RiskiestNudge';

export default function ValidationOverview() {
  const { overview, loading, error, refetch } = useValidationOverview();

  const stats = overview
    ? [
        { label: 'Validated', value: overview.assumptions.validated, color: 'text-brand-hover' },
        { label: 'Invalidated', value: overview.assumptions.invalidated, color: 'text-danger-x9d362b' },
        { label: 'Untested', value: overview.assumptions.untested, color: 'text-accent-600' },
        { label: 'Live experiments', value: overview.live_experiments, color: 'text-neutral-x2d3732' },
        { label: 'Responses collected', value: overview.responses_collected, color: 'text-neutral-x2d3732' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-4xl font-display font-semibold text-neutral-900 tracking-tight">
          Validation Hub
        </h1>
        <p className="text-neutral-500 mt-1 text-sm md:text-base">Prove it before you build it.</p>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 bg-danger-xfbeae7 border border-danger-xf0c9c2 rounded-card px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-danger-deep">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </span>
          <button onClick={() => { void refetch(); }} className="text-xs font-semibold text-danger-deep underline cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {loading && !overview ? (
        <div className="flex items-center justify-center gap-2 text-neutral-500 py-12">
          <Loader2 className="w-5 h-5 animate-spin" /> <span className="text-sm">Loading your validation numbers…</span>
        </div>
      ) : overview ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`bg-white rounded-modal p-4 md:p-5 border border-neutral-100 flex flex-col justify-between shadow-card ${i === stats.length - 1 ? 'col-span-2 md:col-span-1' : ''}`}
              >
                <span className={`text-3xl md:text-4xl font-display font-bold ${s.color}`}>{s.value}</span>
                <span className="text-xs md:text-sm text-neutral-500 mt-3 md:mt-4">{s.label}</span>
              </div>
            ))}
          </div>

          <RiskiestNudge riskiest={overview.riskiest_untested} />
        </>
      ) : null}
    </div>
  );
}
