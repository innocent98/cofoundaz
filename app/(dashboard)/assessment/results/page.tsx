"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAssessmentHistory, useAssessmentDetails } from "@/hooks/useAssessmentApi";
import {
  DIMENSION_LABEL,
  DIMENSION_ORDER,
  formatAssessmentDate,
  stageAtTimeLabel,
  type AssessmentAnswerGroup,
  type AssessmentDimension,
} from "@/lib/api/assessment";

function groupLabel(dimension: string): string {
  return DIMENSION_LABEL[dimension as AssessmentDimension] ?? "Other";
}

/** Answers grouped by dimension; an answer that differs from the previous check-in is highlighted with its old value. */
function AnswersByDimension({ groups, hasPrevious }: { groups: AssessmentAnswerGroup[]; hasPrevious: boolean }) {
  const changedCount = groups.reduce((n, g) => n + g.questions.filter((q) => q.changed).length, 0);
  return (
    <div>
      <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Your answers</h4>
      {hasPrevious && (
        <p className="text-xs text-neutral-500 mb-3">
          {changedCount > 0
            ? `${changedCount} ${changedCount === 1 ? "answer" : "answers"} changed since your previous check-in.`
            : "Nothing changed since your previous check-in."}
        </p>
      )}
      <div className="space-y-4">
        {groups.map((group) => (
          <section key={group.dimension} aria-label={`${groupLabel(group.dimension)} answers`}>
            <h5 className="text-sm font-semibold text-neutral-800 mb-2">{groupLabel(group.dimension)}</h5>
            <ul className="space-y-2">
              {group.questions.map((q) => (
                <li
                  key={q.question_key}
                  data-changed={q.changed ? "true" : "false"}
                  className={`rounded-card border p-3 text-sm ${
                    q.changed ? "bg-accent-xf7eedc border-accent-500/50" : "bg-white border-neutral-200/60"
                  }`}
                >
                  <p className="text-neutral-600">{q.prompt ?? "A question that is no longer asked"}</p>
                  <p className="font-semibold text-neutral-900 mt-0.5">{q.answer_label}</p>
                  {q.changed && q.changed_from && (
                    <p className="text-xs font-semibold text-accent-600 mt-1">Changed from: {q.changed_from}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

export default function AssessmentResultsPage() {
  const router = useRouter();
  const { completed, loading, error, refetch } = useAssessmentHistory();
  const { details, failed, ensure } = useAssessmentDetails();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string, previousId: string | undefined) => {
    const opening = expandedId !== id;
    setExpandedId(opening ? id : null);
    if (opening) {
      void ensure(id);
      if (previousId) void ensure(previousId);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-3xl">
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-display font-semibold text-neutral-900 tracking-tight">Past results</h1>
        <p className="text-neutral-500 text-sm md:text-base">Every calibration, and how your fundamentals moved.</p>
      </div>

      <div className="space-y-4 pt-2">
        {loading && (
          <div className="text-center py-12 bg-white rounded-modal border border-neutral-200/80 shadow-card" role="status">
            <p className="text-neutral-500">Loading your past results...</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-12 bg-white rounded-modal border border-neutral-200/80 shadow-card space-y-4" role="alert">
            <p className="text-neutral-500">{error}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="bg-brand-hover hover:bg-brand-x153427 text-white font-bold text-sm px-5 py-2.5 rounded-[8px] transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          completed.map((item, idx) => {
            const isExpanded = expandedId === item.id;
            const previousItem = completed[idx + 1];
            const score = item.overall_provisional;
            const prevScore = previousItem?.overall_provisional ?? null;

            let deltaDisplay: string | null = null;
            if (score !== null && prevScore !== null) {
              const diff = score - prevScore;
              deltaDisplay = diff > 0 ? `+${diff}` : `${diff}`;
            }

            const detail = details[item.id];
            const prevDetail = previousItem ? details[previousItem.id] : undefined;

            return (
              <div
                key={item.id}
                className="bg-white rounded-modal border border-neutral-200/80 shadow-card overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggle(item.id, previousItem?.id)}
                  aria-expanded={isExpanded}
                  className="w-full p-5 md:p-6 flex items-center justify-between cursor-pointer hover:bg-neutral-50/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-12 h-12 rounded-card bg-neutral-xf0f5f2 border border-brand-xd2e2d8 text-brand-hover flex items-center justify-center font-display font-bold text-lg shadow-card shrink-0">
                      {score ?? "-"}
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-neutral-900 text-base md:text-lg">
                        {idx === 0 ? "Latest: " : ""}
                        {item.type === "initial" ? "Kickoff assessment" : "Quarterly check-in"}
                      </h3>
                      <p className="text-xs md:text-sm text-neutral-500">{formatAssessmentDate(item.completed_at)}</p>
                      <p className="text-xs text-neutral-500">
                        Stage at time: <span className="font-medium text-neutral-700">{stageAtTimeLabel(item.stage_at_time)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm font-semibold shrink-0">
                    <span className={deltaDisplay?.startsWith("+") ? "text-brand-hover" : "text-neutral-500"}>
                      {deltaDisplay ? `Δ ${deltaDisplay}` : "First"}
                    </span>
                    <span className="text-neutral-400 font-bold text-xs" aria-hidden>
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 pt-4 border-t border-neutral-100 bg-neutral-50/30 animate-fadeIn space-y-4">
                    {failed[item.id] && (
                      <p role="alert" className="text-sm text-danger-600">
                        {failed[item.id]}
                      </p>
                    )}
                    {!detail && !failed[item.id] && <p className="text-sm text-neutral-500">Loading scores...</p>}
                    {detail?.result && (
                      <>
                        {detail.result.narrative && <p className="text-sm text-neutral-600">{detail.result.narrative}</p>}
                        <div>
                          <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                            Dimension scores
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {DIMENSION_ORDER.map((dim) => {
                              const dimScore = detail.result!.dimension_scores[dim];
                              const prev = prevDetail?.result?.dimension_scores[dim];
                              let dimDelta = "";
                              let dimColor = "text-brand-hover";
                              if (prev !== undefined) {
                                const d = dimScore - prev;
                                if (d > 0) dimDelta = `(+${d})`;
                                else if (d < 0) {
                                  dimDelta = `(${d})`;
                                  dimColor = "text-danger-600";
                                } else dimDelta = "(0)";
                              }
                              return (
                                <div
                                  key={dim}
                                  className="bg-white p-4 rounded-card border border-neutral-200/60 shadow-card text-sm flex justify-between items-center"
                                >
                                  <span className="text-neutral-600 font-medium">{DIMENSION_LABEL[dim]}</span>
                                  <span className={`font-semibold ${dimColor}`}>
                                    {dimScore}/100 <span className="text-xs ml-1 opacity-70">{dimDelta}</span>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        {detail.answers && detail.answers.length > 0 && <AnswersByDimension groups={detail.answers} hasPrevious={Boolean(previousItem)} />}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}

        {!loading && !error && completed.length === 0 && (
          <div className="text-center py-12 bg-white rounded-modal border border-neutral-200/80 shadow-card space-y-4">
            <p className="text-neutral-500">No past results yet. Complete your first assessment!</p>
            <button
              type="button"
              onClick={() => router.push("/assessment")}
              className="bg-brand-hover hover:bg-brand-x153427 text-white font-bold text-sm px-5 py-2.5 rounded-[8px] transition-colors"
            >
              Start the assessment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
