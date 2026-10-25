'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';
import { businessBuilderApi } from '@/lib/api/business-builder';
import { apiErrorInfo } from '@/lib/api/api-error';
import { waitForJob } from '@/lib/api/bb-jobs';
import { OVER_BUDGET_MESSAGE } from '@/hooks/useBusinessAiFill';
import { useBuilderAccess } from '@/hooks/useBuilderAccess';
import { useAiStatus } from '@/hooks/useAiStatus';
import { AiConfirmModal } from '@/components/business-builder/ai-confirm-modal';

interface PersonaJobResult {
  status?: 'ready' | 'nothing_new' | 'over_budget' | 'gone';
  created_record_ids?: string[];
  interviews_used?: number;
}

/**
 * "Generate personas from my validation notes". New personas are appended next to
 * the founder's own. With no interviews or assumptions the API answers 422
 * NO_VALIDATION_DATA, which we show with a link to /validation.
 */
export function PersonasFromValidation({ onDone }: { onDone: () => void | Promise<void> }) {
  const { canEdit } = useBuilderAccess();
  const { isOverBudget, formattedResetsAt } = useAiStatus();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ text: string; validationLink?: boolean } | null>(null);

  if (!canEdit) return null;

  const run = async () => {
    setConfirming(false);
    setBusy(true);
    setNote(null);
    try {
      const job = await businessBuilderApi.personasFromValidation();
      const out = await waitForJob<PersonaJobResult>(job.job_id, { timeoutMs: 120000 });
      if (out.state === 'timeout') return setNote({ text: 'Taking longer than usual. Reload in a moment.' });
      if (out.state === 'failed') return setNote({ text: 'AI drafting failed. Try again.' });
      const status = out.result?.status;
      if (status === 'over_budget') return setNote({ text: OVER_BUDGET_MESSAGE });
      if (status === 'gone') return setNote({ text: 'Your workspace is no longer available.' });
      await onDone();
      const n = out.result?.created_record_ids?.length ?? 0;
      if (status === 'nothing_new' || n === 0) {
        return setNote({ text: 'Nothing new: every draft matched a persona you already have.' });
      }
      toast.success(`${n} persona${n === 1 ? '' : 's'} added from your validation notes`);
    } catch (err) {
      const info = apiErrorInfo(err, 'Could not request personas.');
      setNote({ text: info.message, validationLink: info.code === 'NO_VALIDATION_DATA' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={busy || isOverBudget}
        title={isOverBudget ? `AI is paused until ${formattedResetsAt}` : undefined}
        className="flex items-center gap-1.5 bg-accent-xf5ecdc hover:bg-accent-200 text-accent-900 font-bold px-4 py-2.5 rounded-card text-xs transition-colors border border-accent-200 disabled:opacity-60 shadow-card"
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 fill-accent-700 text-accent-700" />}
        <span>{busy ? 'Drafting' : 'Generate personas from my validation notes'}</span>
      </button>
      {note && (
        <p role="status" className="text-[11px] font-semibold text-accent-700 max-w-xs text-right">
          {note.text}{' '}
          {note.validationLink && <Link href="/validation" className="underline text-brand-strong">Go to Validation</Link>}
        </p>
      )}
      <AiConfirmModal
        open={confirming}
        detail="Your interview notes and assumptions are used, never the interviewees' names. New personas are added next to yours."
        onConfirm={run}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
