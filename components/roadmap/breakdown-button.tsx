'use client';

import React from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import type { BreakdownState } from '@/hooks/useMilestoneBreakdown';
import { BREAKDOWN_COPY } from '@/lib/api/breakdown';

interface BreakdownButtonProps {
  state: BreakdownState | undefined;
  onRun: () => void;
  /** Hide the button entirely for roles that can't edit the roadmap. */
  disabled?: boolean;
  className?: string;
}

/** "Ask AI to break this down": runs the job; the result line below is a polite live region. */
export function BreakdownButton({ state, onRun, disabled, className }: BreakdownButtonProps) {
  const working = state?.phase === 'working';
  return (
    <div className={className}>
      <button
        type="button"
        onClick={onRun}
        disabled={disabled || working}
        title="Ask AI to break this down"
        className="flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-accent-700 hover:text-accent-700 px-3 py-1.5 rounded-card hover:bg-neutral-xfdfbf7 transition-colors border border-accent-xf2e8d5 disabled:opacity-60"
      >
        {working ? <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" /> : <Sparkles className="w-3 h-3" aria-hidden="true" />}
        {working ? BREAKDOWN_COPY.working : 'Break down'}
      </button>
      <p
        role="status"
        aria-live="polite"
        className={`text-[11px] font-medium mt-1 ${state?.phase === 'error' ? 'text-danger-600' : 'text-brand-mid'}`}
      >
        {state && state.phase !== 'working' ? state.message : ''}
      </p>
    </div>
  );
}
