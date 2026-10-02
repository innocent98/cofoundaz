'use client';

import React, { useState } from 'react';
import { Sparkles, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { useBusinessAiFill } from '@/hooks/useBusinessAiFill';
import { useAiStatus } from '@/hooks/useAiStatus';

interface AiDraftButtonProps {
  /** Canvas type (business_model/lean/mission_vision/value_prop/swot) … */
  canvasType?: string;
  /** … or a record kind (personas/competitors/pricing/revenue-streams). */
  kind?: string;
  label?: string;
  className?: string;
  /** Called after the job finishes so the parent can re-fetch and show the filled content. */
  onFilled?: () => void | Promise<void>;
}

// Real AI-fill: enqueues the job, polls it to completion, then asks the parent to
// re-fetch so the drafted content shows. Never fabricates a result; a slow job
// resolves to an honest "taking longer". Also degrades gracefully when over budget.
export function AiDraftButton({ canvasType, kind, label = 'AI draft', className, onFilled }: AiDraftButtonProps) {
  const { requesting, requestCanvasFill, requestRecordFill } = useBusinessAiFill();
  const { isOverBudget, formattedResetsAt } = useAiStatus();
  const [filled, setFilled] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const target = canvasType ?? kind ?? '';
  const busy = requesting === target;

  const onClick = async () => {
    setError(null);
    setSkipped(false);
    setTimedOut(false);
    setFilled(false);
    const res = canvasType ? await requestCanvasFill(canvasType) : await requestRecordFill(kind || '');
    if (!res.ok && res.error) {
      setError(res.error);
      return;
    }
    if (res.status === 'skipped') {
      setSkipped(true);
      return;
    }
    if (res.status === 'failed') {
      setError('AI drafting failed. Please try again.');
      return;
    }
    if (res.status === 'timeout') {
      setTimedOut(true);
      await onFilled?.(); // it may have landed just after our wait
      return;
    }
    setFilled(true);
    await onFilled?.();
  };

  if (isOverBudget) {
    return (
      <span
        className="flex items-center gap-1.5 bg-[#F9F7F2] text-[#8A5330] px-3 py-2 rounded-card text-xs font-semibold border border-[#EADBCA]"
        title={`AI personalization is paused until ${formattedResetsAt}, your data is never affected.`}
      >
        <Sparkles className="w-3.5 h-3.5 fill-[#8A5330] text-[#8A5330]" />
        AI draft paused (until {formattedResetsAt})
      </span>
    );
  }

  if (filled) {
    return (
      <span className="flex items-center gap-1.5 bg-[#E6EFEA] text-[#1E4D3B] px-3 py-2 rounded-card text-xs font-semibold border border-[#CDE2D6]">
        <Check className="w-3.5 h-3.5" />
        AI draft added
      </span>
    );
  }

  if (skipped) {
    return (
      <span
        className="flex items-center gap-1.5 bg-[#F4F6F5] text-[#617065] px-3 py-2 rounded-card text-xs font-medium border border-[#EBEBE6]"
        title="Nothing was empty to draft. You can edit directly."
      >
        <Sparkles className="w-3.5 h-3.5 text-[#8E9B90]" />
        Nothing to draft, edit directly
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={onClick}
        disabled={busy}
        title="Ask the AI to draft this for you"
        className={
          className ??
          'flex items-center gap-1.5 bg-[#F5ECDC] hover:bg-[#EAD5C6] text-[#522F1A] font-bold px-4 py-2.5 rounded-card text-xs transition-colors border border-[#EAD5C6] disabled:opacity-60 shadow-card'
        }
      >
        {busy ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 fill-[#8A5330] text-[#8A5330]" />
        )}
        <span>{busy ? 'Drafting…' : label}</span>
      </button>
      {timedOut && (
        <span className="text-[11px] font-medium text-[#8A5330]">
          Taking longer than usual, reload or try again shortly.
        </span>
      )}
      {error && (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-[#B0483B]">
          <AlertTriangle className="w-3 h-3" /> {error}
        </span>
      )}
    </div>
  );
}
