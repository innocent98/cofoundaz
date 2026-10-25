'use client';

import React, { useState } from 'react';
import { Sparkles, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { NOTHING_NEW_MESSAGE, useBusinessAiFill } from '@/hooks/useBusinessAiFill';
import { useAiStatus } from '@/hooks/useAiStatus';
import { useBuilderAccess } from '@/hooks/useBuilderAccess';
import { AiConfirmModal } from '@/components/business-builder/ai-confirm-modal';

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
  const [skipped, setSkipped] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const { canEdit } = useBuilderAccess();

  const target = canvasType ?? kind ?? '';
  const busy = requesting === target;

  const onConfirm = async () => {
    setConfirming(false);
    setError(null);
    setSkipped(null);
    setTimedOut(false);
    setFilled(false);
    const res = canvasType ? await requestCanvasFill(canvasType) : await requestRecordFill(kind || '');
    if (!res.ok && res.error) {
      setError(res.error);
      return;
    }
    if (res.status === 'skipped') {
      setSkipped(res.message ?? NOTHING_NEW_MESSAGE[canvasType ? 'canvas' : 'records']);
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

  // Founders and team members only: a consultant suggests instead, everyone else reads.
  if (!canEdit) return null;

  if (isOverBudget) {
    return (
      <span
        className="flex items-center gap-1.5 bg-neutral-xf9f7f2 text-accent-700 px-3 py-2 rounded-card text-xs font-semibold border border-accent-xeadbca"
        title={`AI personalization is paused until ${formattedResetsAt}, your data is never affected.`}
      >
        <Sparkles className="w-3.5 h-3.5 fill-accent-700 text-accent-700" />
        AI draft paused (until {formattedResetsAt})
      </span>
    );
  }

  if (filled) {
    return (
      <span className="flex items-center gap-1.5 bg-neutral-xe6efea text-brand-700 px-3 py-2 rounded-card text-xs font-semibold border border-brand-xcde2d6">
        <Check className="w-3.5 h-3.5" />
        AI draft added
      </span>
    );
  }

  if (skipped !== null) {
    return (
      <span
        className="flex items-center gap-1.5 bg-neutral-100 text-ink-muted px-3 py-2 rounded-card text-xs font-medium border border-line-soft"
        role="status"
      >
        <Sparkles className="w-3.5 h-3.5 shrink-0 text-ink-subtle" />
        {skipped}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={() => setConfirming(true)}
        disabled={busy}
        title="Ask the AI to draft this for you"
        className={
          className ??
          'flex items-center gap-1.5 bg-accent-xf5ecdc hover:bg-accent-200 text-accent-900 font-bold px-4 py-2.5 rounded-card text-xs transition-colors border border-accent-200 disabled:opacity-60 shadow-card'
        }
      >
        {busy ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Sparkles className="w-3.5 h-3.5 fill-accent-700 text-accent-700" />
        )}
        <span>{busy ? 'Drafting…' : label}</span>
      </button>
      {timedOut && (
        <span className="text-[11px] font-medium text-accent-700">
          Taking longer than usual, reload or try again shortly.
        </span>
      )}
      {error && (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-danger-600">
          <AlertTriangle className="w-3 h-3" /> {error}
        </span>
      )}
      <AiConfirmModal open={confirming} onConfirm={onConfirm} onCancel={() => setConfirming(false)} />
    </div>
  );
}
