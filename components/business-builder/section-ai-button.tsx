'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';
import { businessBuilderApi } from '@/lib/api/business-builder';
import { apiErrorInfo } from '@/lib/api/api-error';
import { waitForJob } from '@/lib/api/bb-jobs';
import { OVER_BUDGET_MESSAGE } from '@/hooks/useBusinessAiFill';
import { useBuilderAccess } from '@/hooks/useBuilderAccess';
import { useAiStatus } from '@/hooks/useAiStatus';
import { AiConfirmModal } from '@/components/business-builder/ai-confirm-modal';

interface SectionResult {
  status?: 'ready' | 'nothing_new' | 'over_budget' | 'gone';
  added?: string[];
  block?: string;
}

interface Props {
  type: string;
  block: string;
  label: string;
  /** Save pending edits first, so the AI write cannot 409 against them. */
  flush: () => Promise<void>;
  /** Refetch the canvas (its version moved) so the next autosave does not 409. */
  reload: () => Promise<void>;
  highlight: (added: string[]) => void;
}

/**
 * Per-section AI (D-BB-4): appends up to 3 new items to ONE block and never
 * edits what is there. Hidden for everyone but founders and team members.
 */
export function SectionAiButton({ type, block, label, flush, reload, highlight }: Props) {
  const { canEdit } = useBuilderAccess();
  const { isOverBudget, formattedResetsAt } = useAiStatus();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  if (!canEdit) return null;

  const say = (msg: string) => {
    setNote(msg);
    setTimeout(() => setNote(null), 5000);
  };

  const run = async () => {
    setConfirming(false);
    setBusy(true);
    setNote(null);
    try {
      await flush();
      const job = await businessBuilderApi.aiFillCanvas(type, { block });
      const out = await waitForJob<SectionResult>(job.job_id, { timeoutMs: 90000 });
      if (out.state === 'timeout') return say('Taking longer than usual. Reload in a moment.');
      if (out.state === 'failed') return say('AI drafting failed. Try again.');
      const status = out.result?.status;
      if (status === 'over_budget') return say(OVER_BUDGET_MESSAGE);
      if (status === 'gone') return say('This canvas is no longer available.');
      await reload();
      if (status === 'nothing_new' || !out.result?.added?.length) return say('Nothing new to add.');
      highlight(out.result.added);
      toast.success(`Added ${out.result.added.length} to ${label}`);
    } catch (err) {
      say(apiErrorInfo(err, 'Could not request an AI draft.').message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={busy || isOverBudget}
        aria-label={`Add ideas to ${label} with AI`}
        title={isOverBudget ? `AI is paused until ${formattedResetsAt}` : `Add ideas to ${label} with AI`}
        className="flex items-center gap-1 text-xs font-semibold text-[#8A5330] hover:text-[#522F1A] disabled:opacity-50 transition-colors"
      >
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 fill-[#8A5330]" />}
        <span>{busy ? 'Drafting' : 'AI'}</span>
      </button>
      {note && <span role="status" className="absolute top-full right-0 mt-1 z-10 whitespace-nowrap text-[11px] font-semibold text-[#8A5330] bg-white border border-[#EAD5C6] rounded-input px-2 py-1 shadow-card">{note}</span>}
      <AiConfirmModal
        open={confirming}
        detail={`This adds up to 3 ideas to ${label}. Nothing you wrote is changed.`}
        onConfirm={run}
        onCancel={() => setConfirming(false)}
      />
    </span>
  );
}
