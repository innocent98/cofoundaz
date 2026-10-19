'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Check, BookOpen, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';
import { useBusinessPlan } from '@/hooks/useBusinessPlan';
import { useBuilderAccess } from '@/hooks/useBuilderAccess';
import { AiConfirmModal } from '@/components/business-builder/ai-confirm-modal';
import { PlanReadinessCard } from '@/components/business-builder/plan-readiness';
import { RegenerateSection } from '@/components/business-builder/plan-regenerate';
import type { PlanOptions } from '@/lib/api/business-builder';
import { AUDIENCES, DEFAULT_PLAN_OPTIONS, LENGTHS, failureMessage, progressPercent, stageCaption } from '@/lib/bb-plan';

function OptionGroup<T extends string>({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-[11px] font-bold tracking-wider text-[#768478] uppercase mb-1">{legend}</legend>
      <div role="radiogroup" aria-label={legend} className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
              value === o.value ? 'bg-[#183B28] text-white border-[#183B28]' : 'bg-white text-[#556358] border-[#EBEBE6] hover:border-[#C5CFC7]'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function BusinessPlanPage() {
  const { status, run, doc, error, failure, lastOptions, generate, reset, reloadDocument } = useBusinessPlan();
  const { canEdit } = useBuilderAccess();
  const [confirming, setConfirming] = useState(false);
  const [options, setOptions] = useState<PlanOptions>(DEFAULT_PLAN_OPTIONS);
  const progress = run?.progress ?? null;
  const pct = progressPercent(progress);

  const start = () => {
    setConfirming(false);
    void generate(options);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h2 className="text-3xl font-display font-bold text-[#1E2923] tracking-tight">
          AI business plan generator
        </h2>
        <p className="text-xs text-[#768478] mt-1.5">
          I&apos;ll compile your canvases, personas, pricing, and financials into a 10-section plan. You edit it in Documents, nothing is final until you say so.
        </p>
      </div>

      {status === 'checking' && (
        <div className="bg-white rounded-modal p-12 border border-[#EBEBE6] shadow-card flex items-center justify-center gap-3 text-[#617065]">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Checking for an existing plan…</span>
        </div>
      )}

      {status === 'setup' && (
        <div className="flex flex-col gap-6">
          {failure && (
            <div role="alert" className="bg-[#FBEBEB] border border-[#F0D5D5] rounded-modal p-5 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#B0483B] shrink-0 mt-0.5" />
              <div className="flex flex-col gap-3">
                <p className="text-sm text-[#A34B4B] font-semibold">{failureMessage(failure)}</p>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setOptions(lastOptions ?? options);
                      setConfirming(true);
                    }}
                    className="self-start bg-[#183B28] hover:bg-[#11291C] text-white font-bold px-5 py-2.5 rounded-card text-xs transition-colors"
                  >
                    Try again
                  </button>
                )}
              </div>
            </div>
          )}

          <PlanReadinessCard />

          {canEdit ? (
            <div className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col gap-5">
              <OptionGroup legend="Who is it for" value={options.audience} options={AUDIENCES} onChange={(audience) => setOptions((o) => ({ ...o, audience }))} />
              <OptionGroup legend="How long" value={options.length} options={LENGTHS} onChange={(length) => setOptions((o) => ({ ...o, length }))} />
              <p className="text-xs text-[#768478] leading-relaxed">
                It usually takes about a minute. You can leave this page, it keeps working.
              </p>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="w-full bg-[#183B28] hover:bg-[#11291C] text-white font-bold py-3.5 rounded-card flex items-center justify-center gap-2 transition-all shadow-card"
              >
                <Sparkles className="w-4 h-4 fill-white" />
                <span>Generate my business plan</span>
              </button>
            </div>
          ) : (
            <p className="text-sm text-[#52685D] bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card">
              No plan has been generated yet. A founder or team member can generate it.
            </p>
          )}
        </div>
      )}

      {status === 'generating' && (
        <div className="bg-white rounded-modal p-10 border border-[#EBEBE6] shadow-card flex flex-col items-center justify-center gap-5" aria-live="polite">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-[#E6EFEA] border-t-[#183B28] animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#8A5330] fill-[#8A5330] animate-pulse" />
            </div>
          </div>
          <div className="text-center w-full max-w-sm">
            <h3 className="text-lg font-bold text-[#1E2923]">{stageCaption(progress)}</h3>
            <div
              role="progressbar"
              aria-label="Plan progress"
              aria-valuemin={0}
              aria-valuemax={progress?.total ?? 10}
              aria-valuenow={progress?.done ?? 0}
              className="mt-4 h-2 rounded-full bg-[#E6EFEA] overflow-hidden"
            >
              <div className="h-full bg-[#183B28] transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-xs text-[#617065] mt-2">
              {progress ? `${progress.done} of ${progress.total} sections` : 'Getting started'}
            </p>
            <p className="text-xs text-[#768478] mt-3">You can leave this page, it keeps working, and the plan will be here when it&apos;s done.</p>
          </div>
        </div>
      )}

      {status === 'ready' && doc && (
        <div className="bg-white rounded-modal p-8 border border-[#EBEBE6] shadow-card flex flex-col gap-6">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 bg-[#E6EFEA] rounded-full flex items-center justify-center shadow-card relative">
              <BookOpen className="w-7 h-7 text-[#183B28]" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#D89A6E] rounded-full flex items-center justify-center border-2 border-white">
                <Check className="w-3 h-3 text-white stroke-[3]" />
              </div>
            </div>
            <h3 className="text-2xl font-display font-bold text-[#1E2923]">Your business plan is ready.</h3>
            <p className="text-sm text-[#617065] max-w-md leading-relaxed">
              {doc.title}: {doc.sections.length} section{doc.sections.length === 1 ? '' : 's'}, saved to Documents as an editable draft.
            </p>
          </div>

          <div className="border border-[#EBEBE6] rounded-card divide-y divide-[#F5F5F0] max-h-80 overflow-y-auto">
            {doc.sections.map((sec) => (
              <div key={sec.id} className="p-4">
                <h4 className="text-sm font-bold text-[#1E2923] mb-1">{sec.heading}</h4>
                <p className="text-xs text-[#617065] leading-relaxed whitespace-pre-wrap line-clamp-3">{sec.body}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
            <RegenerateSection onDone={reloadDocument} />
            <div className="flex flex-col gap-2 md:items-end">
              <Link
                href={`/documents/${doc.id}`}
                className="bg-[#183B28] hover:bg-[#11291C] text-white font-bold px-6 py-3 rounded-card transition-all shadow-card flex items-center justify-center gap-2"
              >
                Open document <ArrowRight className="w-4 h-4" />
              </Link>
              {canEdit && (
                <button type="button" onClick={reset} className="text-xs font-semibold text-[#183B28] hover:underline">
                  Generate a new plan
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {status === 'forbidden' && (
        <div className="bg-white rounded-modal p-8 border border-[#EBEBE6] shadow-card flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#B0483B] shrink-0 mt-0.5" />
          <p className="text-sm text-[#52685D] leading-relaxed">
            Only a founder or an editor can generate the business plan. Ask a workspace owner if you need access.
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-white rounded-modal p-8 border border-[#EBEBE6] shadow-card flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 bg-[#FBEAE7] rounded-full flex items-center justify-center border border-[#F0C9C2]">
            <AlertTriangle className="w-6 h-6 text-[#B0483B]" />
          </div>
          <p role="alert" className="text-sm text-[#617065] max-w-md">{error || 'Something went wrong.'}</p>
          <button
            type="button"
            onClick={reset}
            className="bg-[#183B28] hover:bg-[#11291C] text-white font-bold px-6 py-3 rounded-card transition-all shadow-card"
          >
            Back
          </button>
        </div>
      )}

      <AiConfirmModal open={confirming} onConfirm={start} onCancel={() => setConfirming(false)} />
    </div>
  );
}
