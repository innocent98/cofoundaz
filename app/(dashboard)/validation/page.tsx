'use client';

import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useValidationOverview } from '@/hooks/useValidationOverview';
import { RiskiestNudge } from '@/components/validation/RiskiestNudge';

export default function ValidationOverview() {
  const { overview, loading, error, refetch } = useValidationOverview();

  const stats = overview
    ? [
        { label: 'Validated', value: overview.assumptions.validated, color: 'text-[#1e4836]' },
        { label: 'Invalidated', value: overview.assumptions.invalidated, color: 'text-[#9d362b]' },
        { label: 'Untested', value: overview.assumptions.untested, color: 'text-[#9C5B34]' },
        { label: 'Live experiments', value: overview.live_experiments, color: 'text-[#2d3732]' },
        { label: 'Responses collected', value: overview.responses_collected, color: 'text-[#2d3732]' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-4xl font-display font-semibold text-sage-900 tracking-tight">
          Validation Hub
        </h1>
        <p className="text-sage-500 mt-1 text-sm md:text-base">Prove it before you build it.</p>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 bg-[#FBEAE7] border border-[#F0C9C2] rounded-card px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-[#8A2E22]">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </span>
          <button onClick={() => { void refetch(); }} className="text-xs font-semibold text-[#8A2E22] underline cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {loading && !overview ? (
        <div className="flex items-center justify-center gap-2 text-sage-500 py-12">
          <Loader2 className="w-5 h-5 animate-spin" /> <span className="text-sm">Loading your validation numbers…</span>
        </div>
      ) : overview ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`bg-white rounded-modal p-4 md:p-5 border border-sage-100 flex flex-col justify-between shadow-card ${i === stats.length - 1 ? 'col-span-2 md:col-span-1' : ''}`}
              >
                <span className={`text-3xl md:text-4xl font-display font-bold ${s.color}`}>{s.value}</span>
                <span className="text-xs md:text-sm text-sage-500 mt-3 md:mt-4">{s.label}</span>
              </div>
            ))}
          </div>

          <RiskiestNudge riskiest={overview.riskiest_untested} />
        </>
      ) : null}
    </div>
  );
}
