'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { useAiStatus, formatResetTime } from '@/hooks/useAiStatus';
import type { AiStatusData } from '@/lib/api/ai';

interface AiStatusBannerProps {
  status?: AiStatusData | null;
  className?: string;
}

/**
 * A subtle, non-alarming banner that renders when AI token budget is exceeded.
 * Copy: "AI personalization is paused until [local time of resets_at] — your data is never affected."
 */
export function AiStatusBanner({ status: propStatus, className = '' }: AiStatusBannerProps) {
  const hookStatus = useAiStatus();
  
  const status = propStatus !== undefined ? propStatus : hookStatus.data;
  const isOverBudget = status ? Boolean(status.over_budget) : hookStatus.isOverBudget;
  const resetsAt = status?.resets_at ?? hookStatus.data?.resets_at;

  if (!isOverBudget) {
    return null;
  }

  const formattedTime = formatResetTime(resetsAt);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`bg-[#F9F7F2] border border-[#EADBCA] text-[#4F3C28] px-4 py-2.5 rounded-card flex items-center gap-2.5 text-xs font-medium transition-all shadow-card ${className}`}
    >
      <div className="w-5 h-5 rounded-full bg-[#EFE3D3] flex items-center justify-center shrink-0 text-[#8A5330]">
        <Sparkles className="w-3 h-3 fill-current" />
      </div>
      <p className="leading-relaxed">
        AI personalization is paused until {formattedTime} — your data is never affected.
      </p>
    </div>
  );
}
