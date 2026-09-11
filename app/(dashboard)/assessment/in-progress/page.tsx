"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAssessmentApi } from "@/hooks/useAssessmentApi";

export default function AssessmentInProgressPage() {
  const router = useRouter();
  const { activeSession, questions } = useAssessmentApi();

  if (!activeSession || activeSession.status !== 'in_progress') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-xl font-display font-semibold text-sage-900 mb-2">No active assessment</h2>
        <p className="text-sage-500 mb-6">You don't have any assessments currently in progress.</p>
        <button 
          onClick={() => router.push('/assessment')}
          className="bg-[#1e4836] hover:bg-[#153427] text-white font-bold text-sm px-5 py-2.5 rounded-[8px] transition-colors"
        >
          Start a new one
        </button>
      </div>
    );
  }

  const currentQuestion = questions[activeSession.currentQuestionIndex];
  const sectionName = currentQuestion?.sectionName || "Assessment";

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-display font-semibold text-sage-900 tracking-tight">
          Pick up where you left off
        </h1>
        <p className="text-sage-500 text-sm md:text-base">
          You're {activeSession.progressPct}% through your calibration.
        </p>
      </div>

      <div className="bg-white rounded-modal p-6 md:p-8 border border-sage-200/80 shadow-card flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-4 flex-1 w-full">
          <div className="w-full bg-sage-100 h-2.5 rounded-full overflow-hidden">
            <div 
              className="bg-[#9C5B34] h-full rounded-full transition-all duration-500"
              style={{ width: `${activeSession.progressPct}%` }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-sage-500 uppercase tracking-wider">Currently on:</span>
            <span className="bg-[#e2ede6] text-[#1e4836] px-3 py-1 rounded-full text-xs font-medium border border-[#d2e2d8]">
              {sectionName}
            </span>
          </div>
        </div>

        <button 
          onClick={() => router.push(`/assessment/run/${activeSession.id}`)}
          className="w-full md:w-auto shrink-0 bg-[#1e4836] hover:bg-[#153427] text-white font-bold text-base px-8 py-3.5 rounded-[8px] transition-colors shadow-card flex items-center justify-center gap-2"
        >
          Resume
        </button>
      </div>
    </div>
  );
}
