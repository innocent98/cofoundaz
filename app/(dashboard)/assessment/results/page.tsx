"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAssessmentHistory, useAssessmentDetails } from "@/hooks/useAssessmentApi";
import { DIMENSION_LABEL, DIMENSION_ORDER, formatAssessmentDate } from "@/lib/api/assessment";

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
        <h1 className="text-3xl md:text-4xl font-display font-semibold text-sage-900 tracking-tight">Past results</h1>
        <p className="text-sage-500 text-sm md:text-base">Every calibration, and how your fundamentals moved.</p>
      </div>

      <div className="space-y-4 pt-2">
        {loading && (
          <div className="text-center py-12 bg-white rounded-modal border border-sage-200/80 shadow-card" role="status">
            <p className="text-sage-500">Loading your past results...</p>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-12 bg-white rounded-modal border border-sage-200/80 shadow-card space-y-4" role="alert">
            <p className="text-sage-500">{error}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="bg-[#1e4836] hover:bg-[#153427] text-white font-bold text-sm px-5 py-2.5 rounded-[8px] transition-colors"
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
                className="bg-white rounded-modal border border-sage-200/80 shadow-card overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggle(item.id, previousItem?.id)}
                  aria-expanded={isExpanded}
                  className="w-full p-5 md:p-6 flex items-center justify-between cursor-pointer hover:bg-sage-50/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4 md:gap-6">
                    <div className="w-12 h-12 rounded-card bg-[#f0f5f2] border border-[#d2e2d8] text-[#1e4836] flex items-center justify-center font-display font-bold text-lg shadow-card shrink-0">
                      {score ?? "-"}
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-sage-900 text-base md:text-lg">
                        {idx === 0 ? "Latest: " : ""}
                        {item.type === "initial" ? "Kickoff assessment" : "Quarterly check-in"}
                      </h3>
                      <p className="text-xs md:text-sm text-sage-500">{formatAssessmentDate(item.completed_at)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm font-semibold shrink-0">
                    <span className={deltaDisplay?.startsWith("+") ? "text-[#1e4836]" : "text-sage-500"}>
                      {deltaDisplay ? `Δ ${deltaDisplay}` : "First"}
                    </span>
                    <span className="text-sage-400 font-bold text-xs" aria-hidden>
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 pt-4 border-t border-sage-100 bg-sage-50/30 animate-fadeIn space-y-4">
                    {failed[item.id] && (
                      <p role="alert" className="text-sm text-[#B0483B]">
                        {failed[item.id]}
                      </p>
                    )}
                    {!detail && !failed[item.id] && <p className="text-sm text-sage-500">Loading scores...</p>}
                    {detail?.result && (
                      <>
                        {detail.result.narrative && <p className="text-sm text-sage-600">{detail.result.narrative}</p>}
                        <div>
                          <h4 className="text-xs font-semibold text-sage-500 uppercase tracking-wider mb-3">
                            Dimension scores
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {DIMENSION_ORDER.map((dim) => {
                              const dimScore = detail.result!.dimension_scores[dim];
                              const prev = prevDetail?.result?.dimension_scores[dim];
                              let dimDelta = "";
                              let dimColor = "text-[#1e4836]";
                              if (prev !== undefined) {
                                const d = dimScore - prev;
                                if (d > 0) dimDelta = `(+${d})`;
                                else if (d < 0) {
                                  dimDelta = `(${d})`;
                                  dimColor = "text-[#B0483B]";
                                } else dimDelta = "(0)";
                              }
                              return (
                                <div
                                  key={dim}
                                  className="bg-white p-4 rounded-card border border-sage-200/60 shadow-card text-sm flex justify-between items-center"
                                >
                                  <span className="text-sage-600 font-medium">{DIMENSION_LABEL[dim]}</span>
                                  <span className={`font-semibold ${dimColor}`}>
                                    {dimScore}/100 <span className="text-xs ml-1 opacity-70">{dimDelta}</span>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}

        {!loading && !error && completed.length === 0 && (
          <div className="text-center py-12 bg-white rounded-modal border border-sage-200/80 shadow-card space-y-4">
            <p className="text-sage-500">No past results yet. Complete your first assessment!</p>
            <button
              type="button"
              onClick={() => router.push("/assessment")}
              className="bg-[#1e4836] hover:bg-[#153427] text-white font-bold text-sm px-5 py-2.5 rounded-[8px] transition-colors"
            >
              Start the assessment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
