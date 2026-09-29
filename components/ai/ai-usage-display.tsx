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
      <div className={`bg-white rounded-modal border border-[#EBEBE6] p-6 shadow-card ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-[#F0F0EC] rounded w-1/3" />
          <div className="h-8 bg-[#F0F0EC] rounded w-1/2" />
          <div className="h-3 bg-[#F0F0EC] rounded w-2/3" />
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
    <div className={`bg-white rounded-modal border border-[#EBEBE6] p-6 shadow-card flex flex-col gap-5 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-[#1E2923] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#183B28]" />
            AI Usage & Daily Quota
          </h3>
          <p className="text-xs text-[#617065] mt-0.5">
            Monitor daily AI personalization consumption and limits.
          </p>
        </div>
        <span
          className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
            over_budget
              ? 'bg-[#FBEBE8] text-[#B84233]'
              : 'bg-[#EAF2ED] text-[#183B28]'
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
        <div className="p-3.5 bg-[#FAF9F7] rounded-card border border-[#F0EFEB]">
          <span className="text-[11px] font-semibold text-[#8E9B90] uppercase tracking-wider block">
            Tokens Used Today
          </span>
          <span className="text-lg font-bold text-[#1E2923] mt-1 block">
            {tokens_used_today.toLocaleString()}
          </span>
        </div>

        {/* Daily Budget: Unlimited or number */}
        <div className="p-3.5 bg-[#FAF9F7] rounded-card border border-[#F0EFEB]">
          <span className="text-[11px] font-semibold text-[#8E9B90] uppercase tracking-wider block">
            Daily Budget
          </span>
          <span className="text-lg font-bold text-[#1E2923] mt-1 block">
            {isUnlimited ? (
              <span className="text-[#183B28]">Unlimited</span>
            ) : (
              `${daily_budget.toLocaleString()} tokens`
            )}
          </span>
        </div>

        {/* Resets At */}
        <div className="p-3.5 bg-[#FAF9F7] rounded-card border border-[#F0EFEB]">
          <span className="text-[11px] font-semibold text-[#8E9B90] uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#8E9B90]" />
            Resets At
          </span>
          <span className="text-sm font-bold text-[#1E2923] mt-1.5 block truncate" title={resets_at}>
            {formattedReset}
          </span>
        </div>
      </div>

      {/* Progress Bar: Only rendered when NOT unlimited */}
      {!isUnlimited && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-[#617065]">
            <span>Usage progress</span>
            <span>{percentage}% of daily budget</span>
          </div>
          <div className="w-full h-2 bg-[#EBEBE6] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                over_budget ? 'bg-[#B84233]' : percentage > 80 ? 'bg-copper-600' : 'bg-[#183B28]'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Recent Enrichment Failures */}
      <div className="pt-2 border-t border-[#F0F0EC]">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-semibold text-[#1E2923] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#617065]" />
            Recent Enrichment Status
          </span>
          <span className="text-[#8E9B90]">
            {recent_enrichment_failures.length === 0
              ? 'All enrichments nominal'
              : `${recent_enrichment_failures.length} recorded`}
          </span>
        </div>

        {recent_enrichment_failures.length === 0 ? (
          <p className="text-xs text-[#8E9B90] italic">
            No background enrichment failures recorded.
          </p>
        ) : (
          <div className="divide-y divide-[#F0F0EC] bg-[#FBFBFA] rounded-card border border-[#EBEBE6] p-2.5">
            {recent_enrichment_failures.map((f, i) => (
              <div key={i} className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs text-[#334139]">
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3 text-[#B84233] shrink-0" />
                  <span className="font-body text-[11px] font-medium text-[#1E2923]">{f.type}</span>
                </span>
                <span className="text-[11px] text-[#8E9B90]">
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
