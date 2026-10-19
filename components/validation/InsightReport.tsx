'use client';

import React from 'react';
import { ArrowRight, Check, Loader2, Trash2 } from 'lucide-react';
import type { RawInsight } from '@/lib/api/validation';
import { AI_LABEL, insightInputsLine, plainProse } from '@/lib/validation-format';

const STATUS_LABEL: Record<string, string> = {
  untested: 'Untested',
  testing: 'Testing',
  validated: 'Validated',
  invalidated: 'Invalidated',
};

/**
 * One stored Insight Synthesizer report. Everything the model wrote is rendered
 * as plain text (React text nodes, never HTML or markdown) and labelled AI-generated.
 * `quotes` may be [] (unverifiable quotes are dropped server-side): no quote block then.
 */
export function InsightReport({
  insight,
  applyingId,
  goneIds,
  onApply,
  onDelete,
}: {
  insight: RawInsight;
  applyingId: string | null;
  /** Suggestion ids whose assumption no longer exists (apply returned 404). */
  goneIds: ReadonlySet<string>;
  onApply: (suggestionId: string) => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-col gap-8" data-testid="insight-report">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-[#1E2923]">{insightInputsLine(insight.inputs)}</p>
        <p className="text-xs text-[#617065]">
          {AI_LABEL} · {new Date(insight.created_at).toLocaleString()}
        </p>
      </div>

      <section aria-label="Patterns" className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-[#1E2923] uppercase tracking-wider">Patterns</h3>
        {insight.patterns.length === 0 && <p className="text-sm text-[#617065]">No clear pattern yet. Add more evidence and run it again.</p>}
        {insight.patterns.map((p) => (
          <div key={p.id} className="bg-[#E6EFEA] border border-[#D5E3DB] p-4 rounded-card flex flex-col gap-2">
            <h4 className="font-bold text-[#183B28] break-words">{plainProse(p.theme)}</h4>
            <p className="text-sm text-[#2D5A3F] break-words">{plainProse(p.summary)}</p>
            {p.quotes.length > 0 && (
              <ul className="flex flex-col gap-1.5 pt-1">
                {p.quotes.map((q, i) => (
                  <li key={i} className="text-sm italic text-[#2D5A3F] border-l-2 border-[#9FBBAA] pl-3 break-words">
                    “{q}”
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </section>

      {insight.contradictions.length > 0 && (
        <section aria-label="Contradictions" className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-[#1E2923] uppercase tracking-wider">Contradictions</h3>
          {insight.contradictions.map((c) => (
            <div key={c.id} className="bg-[#FDF2F2] border border-[#F4C7C7] p-4 rounded-card">
              <p className="text-sm text-[#8A3A30] break-words">{plainProse(c.summary)}</p>
            </div>
          ))}
        </section>
      )}

      {insight.suggestions.length > 0 && (
        <section aria-label="Suggested changes" className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-[#1E2923] uppercase tracking-wider">Suggested assumption changes</h3>
          {insight.suggestions.map((s) => {
            const applied = Boolean(s.applied_at);
            const gone = goneIds.has(s.id);
            const busy = applyingId === s.id;
            return (
              <div key={s.id} className="bg-white border border-[#EBEBE6] rounded-card p-4 flex flex-col gap-3 shadow-card">
                <p className="text-sm font-bold text-[#1E2923] break-words">{s.assumption_statement}</p>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FDF4E3] text-[#8A5330]">
                    {STATUS_LABEL[s.from_status] ?? s.from_status}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#617065]" aria-label="to" />
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E6EFEA] text-[#183B28]">
                    {STATUS_LABEL[s.to_status] ?? s.to_status}
                  </span>
                </div>
                <p className="text-sm text-[#617065] break-words">{plainProse(s.reason)}</p>
                {gone ? (
                  <p role="status" className="text-sm font-semibold text-[#8A2E22]">
                    That assumption no longer exists.
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => onApply(s.id)}
                  disabled={applied || gone || busy}
                  aria-label={applied ? `Applied: ${s.assumption_statement}` : `Apply: ${s.assumption_statement}`}
                  className="self-start bg-[#183B28] hover:bg-[#11291C] disabled:opacity-60 disabled:cursor-default text-white px-4 py-2 rounded-card font-bold text-sm transition-colors inline-flex items-center gap-2 cursor-pointer"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : applied ? <Check className="w-4 h-4" aria-hidden="true" /> : null}
                  {applied ? 'Applied' : 'Apply'}
                </button>
              </div>
            );
          })}
        </section>
      )}

      <button
        type="button"
        onClick={onDelete}
        className="self-start text-sm font-semibold text-[#B0483B] hover:underline inline-flex items-center gap-1.5 cursor-pointer"
      >
        <Trash2 className="w-4 h-4" aria-hidden="true" /> Delete this report
      </button>
    </div>
  );
}
