'use client';

import React from 'react';
import { Activity, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAiStatus, formatResetTime } from '@/hooks/useAiStatus';
import { AiStatusBanner } from './ai-status-banner';
import type { AiStatusData } from '@/lib/api/ai';

interface AiUsageDisplayProps {
  status?: AiStatusData | null;
  loading?: boolean;
  className?: string;
}

export function AiUsageDisplay({
  status: propStatus,
  loading: propLoading,
  className = '',
}: AiUsageDisplayProps) {
  const hookStatus = useAiStatus();

  const status = propStatus !== undefined ? propStatus : hookStatus.data;
  const loading = propLoading !== undefined ? propLoading : hookStatus.loading;

  if (loading && !status) {
    return (
      <div className={`bg-white rounded-modal border border-line-soft p-6 shadow-card ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-line-faint rounded-card w-1/3" />
          <div className="h-8 bg-line-faint rounded-card w-1/2" />
          <div className="h-3 bg-line-faint rounded-card w-2/3" />
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  const {
    tokens_used_today,
    daily_budget,
    over_budget,
    resets_at,
    recent_enrichment_failures,
  } = status;

  const isUnlimited = daily_budget === null;
  const formattedReset = formatResetTime(resets_at);
  const percentage = (!isUnlimited && daily_budget > 0)
    ? Math.min(100, Math.round((tokens_used_today / daily_budget) * 100))
    : 0;

  return (
    <div className={`bg-white rounded-modal border border-line-soft p-6 shadow-card flex flex-col gap-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-ink flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand-strong" />
            AI Usage & Daily Quota
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Monitor daily AI personalization consumption and limits.
          </p>
        </div>
        <span
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
            over_budget
              ? 'bg-danger-xfbebe8 text-danger-xb84233'
              : 'bg-brand-tint text-brand-strong'
          }`}
        >
          {over_budget ? 'Quota paused' : 'Operational'}
        </span>
      </div>

      {/* Subtle over-budget banner if paused */}
      {over_budget && <AiStatusBanner status={status} />}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Tokens Used Today */}
        <div className="p-3.5 bg-neutral-xfaf9f7 rounded-card border border-neutral-xf0efeb">
          <span className="text-[11px] font-semibold text-ink-subtle uppercase tracking-wider block">
            Tokens Used Today
          </span>
          <span className="text-lg font-bold text-ink mt-1 block">
            {tokens_used_today.toLocaleString()}
          </span>
        </div>

        {/* Daily Budget: Unlimited or number */}
        <div className="p-3.5 bg-neutral-xfaf9f7 rounded-card border border-neutral-xf0efeb">
          <span className="text-[11px] font-semibold text-ink-subtle uppercase tracking-wider block">
            Daily Budget
          </span>
          <span className="text-lg font-bold text-ink mt-1 block">
            {isUnlimited ? (
              <span className="text-brand-strong">Unlimited</span>
            ) : (
              `${daily_budget.toLocaleString()} tokens`
            )}
          </span>
        </div>

        {/* Resets At */}
        <div className="p-3.5 bg-neutral-xfaf9f7 rounded-card border border-neutral-xf0efeb">
          <span className="text-[11px] font-semibold text-ink-subtle uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-ink-subtle" />
            Resets At
          </span>
          <span className="text-sm font-bold text-ink mt-1.5 block truncate" title={resets_at}>
            {formattedReset}
          </span>
        </div>
      </div>

      {/* Progress Bar: Only rendered when NOT unlimited */}
      {!isUnlimited && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-ink-muted">
            <span>Usage progress</span>
            <span>{percentage}% of daily budget</span>
          </div>
          <div className="w-full h-2 bg-line-soft rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                over_budget ? 'bg-danger-xb84233' : percentage > 80 ? 'bg-accent-600' : 'bg-brand-strong'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Recent Enrichment Failures */}
      <div className="pt-2 border-t border-line-faint">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-ink flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-ink-muted" />
            Recent Enrichment Status
          </span>
          <span className="text-ink-subtle">
            {recent_enrichment_failures.length === 0
              ? 'All enrichments nominal'
              : `${recent_enrichment_failures.length} recorded`}
          </span>
        </div>

        {recent_enrichment_failures.length === 0 ? (
          <p className="text-xs text-ink-subtle italic">
            No background enrichment failures recorded.
          </p>
        ) : (
          <div className="divide-y divide-line-faint bg-surface-faint rounded-card border border-line-soft p-2.5">
            {recent_enrichment_failures.map((f, i) => (
              <div key={i} className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs text-neutral-x334139">
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3 text-danger-xb84233 shrink-0" />
                  <span className="font-body text-[11px] font-medium text-ink">{f.type}</span>
                </span>
                <span className="text-[11px] text-ink-subtle">
                  {f.failed_at ? formatResetTime(f.failed_at) : 'recent'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
