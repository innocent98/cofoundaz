"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAssessmentHistory, useStartAssessment } from "@/hooks/useAssessmentApi";

export default function AssessmentStartPage() {
  const router = useRouter();
  const { inProgress, completed, error: historyError } = useAssessmentHistory();
  const { start, starting, error: startError } = useStartAssessment();

  const handleBegin = async () => {
    const id = await start();
    if (id) router.push(`/assessment/run/${id}`);
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto pt-8">
      
      {inProgress && (
        <div className="bg-[#EAD5C6] rounded-card p-4 border border-[#D89A6E]/30 shadow-card flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-[#1E2923] font-semibold text-sm">You have an assessment in progress</h3>
            <p className="text-[#617065] text-xs">Resume where you left off to calibrate your Health Score.</p>
          </div>
          <button 
            onClick={() => router.push('/assessment/in-progress')}
            className="shrink-0 bg-white text-[#12291F] font-bold text-xs px-4 py-2 rounded-[8px] hover:bg-sage-50 transition-colors shadow-card"
          >
            Resume
          </button>
        </div>
      )}

      <div className="bg-white rounded-modal p-8 md:p-12 border border-sage-200/80 shadow-card flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-sage-100 flex items-center justify-center mb-2">
          <span className="text-3xl">🧭</span>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-display font-semibold text-sage-900 tracking-tight">
          Let&apos;s calibrate Cofoundaz
        </h1>
        
        <p className="text-sage-600 text-sm md:text-base max-w-lg leading-relaxed">
          Honest answers make everything smarter, your score, your roadmap, your advisors. There are no wrong answers, only accurate ones.
        </p>
        
        <div className="pt-6 w-full max-w-xs">
          <button 
            onClick={() => void handleBegin()}
            disabled={starting}
            className="w-full bg-[#1e4836] disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[#153427] text-white font-bold text-base px-6 py-3.5 rounded-[8px] transition-colors shadow-card flex items-center justify-center gap-2"
          >
            {starting ? "Starting..." : inProgress ? "Continue" : completed.length > 0 ? "Start a check-in" : "Begin"}
          </button>
          {startError && (
            <p role="alert" className="text-sm text-[#B0483B] mt-3">
              {startError}
            </p>
          )}
          {historyError && !startError && (
            <p className="text-xs text-sage-500 mt-3">We couldn&apos;t check for an assessment in progress. {historyError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
