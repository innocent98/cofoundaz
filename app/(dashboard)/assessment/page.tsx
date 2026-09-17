"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAssessmentApi } from "@/hooks/useAssessmentApi";

export default function AssessmentStartPage() {
  const router = useRouter();
  const { startAssessment, activeSession } = useAssessmentApi();

  const handleBegin = () => {
    const id = startAssessment();
    router.push(`/assessment/run/${id}`);
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto pt-8">
      
      {activeSession && activeSession.status === 'in_progress' && (
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
          Honest answers make everything smarter — your score, your roadmap, your advisors. There are no wrong answers, only accurate ones.
        </p>
        
        <div className="pt-6 w-full max-w-xs">
          <button 
            onClick={handleBegin}
            className="w-full bg-[#1e4836] hover:bg-[#153427] text-white font-bold text-base px-6 py-3.5 rounded-[8px] transition-colors shadow-card flex items-center justify-center gap-2"
          >
            Begin
          </button>
        </div>
      </div>
    </div>
  );
}
