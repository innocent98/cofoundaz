"use client";

import React, { useState } from "react";
import { useAssessmentApi } from "@/hooks/useAssessmentApi";

export default function AssessmentResultsPage() {
  const { getAssessmentHistory } = useAssessmentApi();
  const history = getAssessmentHistory();
  const [expandedPastResultId, setExpandedPastResultId] = useState<string | null>(null);

  return (
    <div className="space-y-6 animate-fadeIn max-w-3xl">
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-display font-semibold text-sage-900 tracking-tight">
          Past results
        </h1>
        <p className="text-sage-500 text-sm md:text-base">
          Every calibration, and how your fundamentals moved.
        </p>
      </div>

      <div className="space-y-4 pt-2">
        {history.map((item, idx) => {
          const isExpanded = expandedPastResultId === item.id;
          const previousItem = history[idx + 1]; // To calculate diff if available
          
          let deltaDisplay = "first";
          if (previousItem) {
            const diff = item.resultingScore - previousItem.resultingScore;
            deltaDisplay = diff > 0 ? `+${diff}` : `${diff}`;
          }

          return (
            <div
              key={item.id}
              className="bg-white rounded-modal border border-sage-200/80 shadow-card overflow-hidden transition-all"
            >
              {/* CARD ROW HEADER */}
              <div
                onClick={() => setExpandedPastResultId(isExpanded ? null : item.id)}
                className="p-5 md:p-6 flex items-center justify-between cursor-pointer hover:bg-sage-50/50 transition-colors"
              >
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="w-12 h-12 rounded-card bg-[#f0f5f2] border border-[#d2e2d8] text-[#1e4836] flex items-center justify-center font-display font-bold text-lg shadow-card shrink-0">
                    {item.resultingScore}
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-sage-900 text-base md:text-lg">
                      {idx === 0 ? "Latest check-in" : "Quarterly check-in"}
                    </h3>
                    <p className="text-xs md:text-sm text-sage-500">
                      {item.completedAt} · {item.stage}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm font-semibold shrink-0">
                  <span className={deltaDisplay.startsWith('+') ? "text-[#1e4836]" : "text-sage-500"}>
                    {deltaDisplay !== "first" && "Δ "}{deltaDisplay}
                  </span>
                  <span className="text-sage-400 font-bold text-xs">
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {/* EXPANDED ACCORDION VIEW */}
              {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-sage-100 bg-sage-50/30 animate-fadeIn">
                  <h4 className="text-xs font-semibold text-sage-500 uppercase tracking-wider mb-3">Dimension Scores</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(item.dimensionScores).map(([dim, score]) => {
                      let prevScore = null;
                      if (previousItem) {
                         prevScore = previousItem.dimensionScores[dim as keyof typeof previousItem.dimensionScores];
                      }
                      
                      let dimDelta = "";
                      let dimColor = "text-[#1e4836]";
                      if (prevScore !== null) {
                        const d = score - prevScore;
                        if (d > 0) dimDelta = `(+${d})`;
                        else if (d < 0) { dimDelta = `(${d})`; dimColor = "text-[#B0483B]"; }
                        else dimDelta = "(0)";
                      }

                      return (
                        <div key={dim} className="bg-white p-4 rounded-card border border-sage-200/60 shadow-card text-sm flex justify-between items-center">
                          <span className="text-sage-600 font-medium">{dim}</span>
                          <span className={`font-semibold ${dimColor}`}>
                            {score}/100 <span className="text-xs ml-1 opacity-70">{dimDelta}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {history.length === 0 && (
          <div className="text-center py-12 bg-white rounded-modal border border-sage-200/80 shadow-card">
            <p className="text-sage-500">No past results found. Complete your first assessment!</p>
          </div>
        )}
      </div>
    </div>
  );
}
