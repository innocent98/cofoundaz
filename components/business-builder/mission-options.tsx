'use client';

import React, { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { businessBuilderApi } from '@/lib/api/business-builder';
import { apiErrorInfo } from '@/lib/api/api-error';
import { waitForJob } from '@/lib/api/bb-jobs';
import { OVER_BUDGET_MESSAGE } from '@/hooks/useBusinessAiFill';
import { useBuilderAccess } from '@/hooks/useBuilderAccess';
import { useAiStatus } from '@/hooks/useAiStatus';
import { AiConfirmModal } from '@/components/business-builder/ai-confirm-modal';

interface OptionsResult {
  status?: 'ready' | 'over_budget' | 'gone';
  options?: string[];
}

/**
 * "Give me 3 options" for the mission or the vision. The job writes nothing: the
 * variants are shown as cards and "Use this" is a normal save of that text.
 */
export function MissionOptions({
  field,
  flush,
  onUse,
}: {
  field: 'mission' | 'vision';
  /** Save any pending edit first so "Use this" does not race an autosave. */
  flush: () => Promise<void>;
  onUse: (text: string) => void;
}) {
  const { canEdit } = useBuilderAccess();
  const { isOverBudget, formattedResetsAt } = useAiStatus();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);

  if (!canEdit) return null;

  const run = async () => {
    setConfirming(false);
    setBusy(true);
    setNote(null);
    setOptions([]);
    try {
      await flush();
      const job = await businessBuilderApi.missionVisionOptions(field);
      const out = await waitForJob<OptionsResult>(job.job_id, { timeoutMs: 90000 });
      if (out.state === 'timeout') return setNote('Taking longer than usual. Try again shortly.');
      if (out.state === 'failed') return setNote('AI drafting failed. Try again.');
      const status = out.result?.status;
      if (status === 'over_budget') return setNote(OVER_BUDGET_MESSAGE);
      if (status === 'gone') return setNote('This canvas is no longer available.');
      const list = out.result?.options ?? [];
      if (list.length === 0) return setNote('No options came back. Try again.');
      setOptions(list);
    } catch (err) {
      setNote(apiErrorInfo(err, 'Could not request options.').message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={busy || isOverBudget}
          title={isOverBudget ? `AI is paused until ${formattedResetsAt}` : undefined}
          className="flex items-center gap-1.5 text-xs font-bold text-accent-700 hover:text-accent-900 disabled:opacity-50 transition-colors"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 fill-accent-700" />}
          {busy ? 'Drafting options' : 'Give me 3 options'}
        </button>
        {note && <span role="status" className="text-[11px] font-semibold text-danger-600">{note}</span>}
      </div>

      {options.length > 0 && (
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-3" aria-label={`${field} options`}>
          {options.map((o, i) => (
            <li key={i} className="bg-neutral-xfdf8ee border border-accent-200 rounded-card p-4 flex flex-col justify-between gap-3">
              <p className="text-xs text-ink leading-relaxed">{o}</p>
              <button
                type="button"
                onClick={() => {
                  onUse(o);
                  setOptions([]);
                }}
                className="self-start px-3 py-1.5 bg-brand-strong hover:bg-brand-rail-ink text-white rounded-card text-xs font-bold transition-colors"
              >
                Use this
              </button>
            </li>
          ))}
        </ul>
      )}

      <AiConfirmModal
        open={confirming}
        detail={`This offers 3 ways to word your ${field}. Nothing is saved until you pick one.`}
        onConfirm={run}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
