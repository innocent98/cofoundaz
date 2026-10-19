'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { businessBuilderApi, type PlanReadiness } from '@/lib/api/business-builder';
import { apiErrorInfo } from '@/lib/api/api-error';
import { waitForJob } from '@/lib/api/bb-jobs';
import { READINESS_PATH, isReady, readinessNote } from '@/lib/bb-plan';
import { useBuilderAccess } from '@/hooks/useBuilderAccess';
import { useAiStatus } from '@/hooks/useAiStatus';
import { AiConfirmModal } from '@/components/business-builder/ai-confirm-modal';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * The plan readiness checklist: a tick or a warning per artifact, and "Draft
 * missing sections with AI", which queues one fill per non-ready artifact and
 * refreshes the list every few seconds until the jobs settle.
 */
export function PlanReadinessCard() {
  const { canEdit } = useBuilderAccess();
  const { isOverBudget, formattedResetsAt } = useAiStatus();
  const [data, setData] = useState<PlanReadiness | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setData(await businessBuilderApi.getPlanReadiness());
      setError(null);
    } catch (err) {
      setError(apiErrorInfo(err, 'Could not check what is ready.').message);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await refresh();
    })();
  }, [refresh]);

  const draft = async () => {
    setConfirming(false);
    setDrafting(true);
    setNote(null);
    try {
      const jobs = await businessBuilderApi.draftMissing();
      let settled = false;
      const all = Promise.all(jobs.map((j) => waitForJob<{ status?: string }>(j.job_id, { timeoutMs: 180000 }))).then((outs) => {
        settled = true;
        return outs;
      });
      while (!settled) {
        await Promise.race([all, sleep(3000)]);
        await refresh();
      }
      const outs = await all;
      await refresh();
      if (outs.some((o) => o.state === 'succeeded' && o.result?.status === 'over_budget')) {
        setNote('AI hit its daily limit before every section was drafted. Try again tomorrow.');
      } else if (outs.some((o) => o.state !== 'succeeded')) {
        setNote('Some sections could not be drafted. Try again.');
      }
    } catch (err) {
      setNote(apiErrorInfo(err, 'Could not start drafting.').message);
    } finally {
      setDrafting(false);
    }
  };

  if (error && !data) {
    return <p role="alert" className="text-sm text-[#A34B4B] bg-[#FBEBEB] border border-[#F0D5D5] rounded-modal p-4">{error}</p>;
  }
  if (!data) return <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card h-56 animate-pulse" />;

  const missing = data.total - data.ready_count;

  return (
    <section aria-labelledby="readiness-title" className="bg-white rounded-modal border border-[#EBEBE6] shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-[#EBEBE6] bg-[#FBFBFA] flex items-center justify-between gap-3">
        <h3 id="readiness-title" className="font-bold text-[#1E2923] text-sm">What your plan is built from</h3>
        <span className="text-xs font-bold text-[#556358]" aria-live="polite">{data.ready_count} of {data.total} ready</span>
      </div>
      <ul className="divide-y divide-[#F0F0EC]">
        {data.items.map((item) => (
          <li key={item.type} className="px-6 py-3 flex items-center gap-3">
            {isReady(item) ? (
              <CheckCircle2 className="w-4 h-4 text-[#183B28] shrink-0" aria-label="Ready" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#9C5B34] shrink-0" aria-label="Needs attention" />
            )}
            <Link href={READINESS_PATH[item.type] ?? '/business-builder'} className="text-sm font-semibold text-[#1E2923] hover:underline">
              {item.label}
            </Link>
            <span className="ml-auto text-xs text-[#768478]">{readinessNote(item)}</span>
          </li>
        ))}
      </ul>
      {missing > 0 && (
        <div className="px-6 py-4 border-t border-[#EBEBE6] flex flex-wrap items-center gap-3">
          {canEdit ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={drafting || isOverBudget}
              title={isOverBudget ? `AI is paused until ${formattedResetsAt}` : undefined}
              className="flex items-center gap-1.5 bg-[#F5ECDC] hover:bg-[#EAD5C6] text-[#522F1A] font-bold px-4 py-2.5 rounded-card text-xs transition-colors border border-[#EAD5C6] disabled:opacity-60 shadow-card"
            >
              {drafting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 fill-[#8A5330] text-[#8A5330]" />}
              {drafting ? 'Drafting missing sections' : 'Draft missing sections with AI'}
            </button>
          ) : (
            <p className="text-xs text-[#768478]">A founder or team member can draft the missing sections.</p>
          )}
          {note && <span role="status" className="text-[11px] font-semibold text-[#B0483B]">{note}</span>}
        </div>
      )}
      <AiConfirmModal
        open={confirming}
        detail="Empty canvases and empty lists get a first draft. Anything you already wrote is left alone."
        onConfirm={draft}
        onCancel={() => setConfirming(false)}
      />
    </section>
  );
}
