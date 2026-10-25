'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useExperimentDraft } from '@/hooks/useExperimentDraft';
import { nudgeCopy } from '@/lib/validation-format';
import type { RiskiestAssumption } from '@/lib/api/validation';
import { useValidationShell } from '@/app/(dashboard)/validation/layout';

/**
 * PRD 09.6 nudge. "Design experiment" runs the draft job, then opens the
 * smoke-test builder pre-filled; nothing is saved until Publish. Hidden when
 * there is no untested assumption.
 */
export function RiskiestNudge({ riskiest }: { riskiest: RiskiestAssumption | null }) {
  const router = useRouter();
  const { triggerToast, setPendingDraft } = useValidationShell();
  const { drafting, design } = useExperimentDraft();

  if (!riskiest) return null;

  const onDesign = async () => {
    const out = await design(riskiest.id);
    if (!out.ok) {
      triggerToast(out.message);
      return;
    }
    setPendingDraft(out.draft);
    router.push('/validation/smoke-tests');
  };

  return (
    <div className="bg-brand-rail-deep text-white rounded-modal p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-card">
      <div className="flex items-start md:items-center gap-3 md:gap-4">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-card bg-accent-600 text-white flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
          </svg>
        </div>
        <p data-testid="riskiest-nudge" className="text-white text-sm md:text-base font-medium break-words min-w-0">
          {nudgeCopy(riskiest.statement)}
        </p>
      </div>
      <button
        type="button"
        onClick={onDesign}
        disabled={drafting}
        className="bg-accent-600 hover:bg-accent-700 disabled:opacity-70 text-white font-semibold px-4 py-2 md:px-5 md:py-2.5 rounded-card text-xs md:text-sm transition-all shrink-0 self-start md:self-auto cursor-pointer inline-flex items-center gap-2"
      >
        {drafting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
        {drafting ? 'Designing…' : 'Design experiment'}
      </button>
    </div>
  );
}
