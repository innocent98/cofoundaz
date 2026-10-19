'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, RefreshCw } from 'lucide-react';
import { businessBuilderApi } from '@/lib/api/business-builder';
import { apiErrorInfo } from '@/lib/api/api-error';
import { waitForJob } from '@/lib/api/bb-jobs';
import { PLAN_SECTIONS, regenerateMessage } from '@/lib/bb-plan';
import { useBuilderAccess } from '@/hooks/useBuilderAccess';
import { useAiStatus } from '@/hooks/useAiStatus';
import { AiConfirmModal } from '@/components/business-builder/ai-confirm-modal';

/**
 * "Regenerate a section": rewrites only that section's body in the plan Document,
 * matched by heading. The Document's version moves, so the caller reloads it.
 */
export function RegenerateSection({ onDone }: { onDone: () => Promise<void> }) {
  const { canEdit } = useBuilderAccess();
  const { isOverBudget, formattedResetsAt } = useAiStatus();
  const [key, setKey] = useState(PLAN_SECTIONS[0].key);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  if (!canEdit) return null;
  const heading = PLAN_SECTIONS.find((s) => s.key === key)?.heading ?? key;

  const run = async () => {
    setConfirming(false);
    setBusy(true);
    setNote(null);
    try {
      const job = await businessBuilderApi.regeneratePlanSection(key);
      const out = await waitForJob<{ status?: string }>(job.job_id, { timeoutMs: 90000 });
      if (out.state === 'timeout') return setNote('Taking longer than usual. Reload in a moment.');
      if (out.state === 'failed') return setNote("I couldn't rewrite that section. Try again.");
      const msg = regenerateMessage(out.result?.status, heading);
      if (!msg.ok) return setNote(msg.text);
      await onDone();
      toast.success(msg.text);
    } catch (err) {
      const info = apiErrorInfo(err, "I couldn't rewrite that section. Try again.");
      setNote(info.status === 404 ? 'There is no finished plan to rewrite a section of yet.' : info.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] font-bold tracking-wider text-[#768478] uppercase">Regenerate a section</p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Section to regenerate"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          disabled={busy}
          className="border border-[#D5DDD6] rounded-input px-3 py-2 text-xs bg-white focus:outline-none focus:border-[#4D6D58]"
        >
          {PLAN_SECTIONS.map((s) => (
            <option key={s.key} value={s.key}>{s.heading}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={busy || isOverBudget}
          title={isOverBudget ? `AI is paused until ${formattedResetsAt}` : undefined}
          className="flex items-center gap-1.5 bg-white hover:bg-[#F5F5F0] disabled:opacity-60 text-[#1E2923] font-semibold px-4 py-2 rounded-card text-xs border border-[#EBEBE6] shadow-card transition-colors"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-[#556358]" />}
          {busy ? 'Rewriting' : 'Regenerate'}
        </button>
      </div>
      {note && <p role="status" className="text-[11px] font-semibold text-[#B0483B] max-w-md">{note}</p>}
      <AiConfirmModal
        open={confirming}
        title={`Rewrite ${heading}`}
        confirmLabel="Draft it"
        detail={`Only ${heading} is rewritten. Your edits to every other section are kept.`}
        onConfirm={run}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
