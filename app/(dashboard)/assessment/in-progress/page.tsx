"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useInProgressAssessment } from "@/hooks/useAssessmentApi";
import { useWorkspace } from "@/components/workspace-context";
import { canTakeAssessment } from "@/lib/nav-access";

export default function AssessmentInProgressPage() {
  const router = useRouter();
  const { role, loading: workspaceLoading } = useWorkspace();
  const { assessment, question, progress, loading, error, refetch } = useInProgressAssessment();

  // Team members read results only: no resume, no in-progress card (PRD Module 07 access).
  if (!workspaceLoading && !canTakeAssessment(role)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-xl font-display font-semibold text-neutral-900 mb-2">Only founders can take the assessment</h2>
        <p className="text-neutral-500 mb-6">You can read every result and compare check-ins.</p>
        <button
          type="button"
          onClick={() => router.push("/assessment/results")}
          className="bg-brand-hover hover:bg-brand-x153427 text-white font-bold text-sm px-5 py-2.5 rounded-[8px] transition-colors"
        >
          View past results
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center" role="status">
        <div className="w-10 h-10 rounded-full border-4 border-neutral-200 border-t-[var(--color-accent-600)] animate-spin mb-4" />
        <p className="text-neutral-500 text-sm">Checking for an assessment in progress...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center" role="alert">
        <h2 className="text-xl font-display font-semibold text-neutral-900 mb-2">We couldn&apos;t load your assessment</h2>
        <p className="text-neutral-500 mb-6">{error}</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="bg-brand-hover hover:bg-brand-x153427 text-white font-bold text-sm px-5 py-2.5 rounded-[8px] transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-xl font-display font-semibold text-neutral-900 mb-2">No active assessment</h2>
        <p className="text-neutral-500 mb-6">You don&apos;t have any assessments currently in progress.</p>
        <button
          type="button"
          onClick={() => router.push("/assessment")}
          className="bg-brand-hover hover:bg-brand-x153427 text-white font-bold text-sm px-5 py-2.5 rounded-[8px] transition-colors"
        >
          Start a new one
        </button>
      </div>
    );
  }

  // question === null means every applicable question is answered; the runner completes it.
  const pct = question ? (progress?.pct ?? 0) : 100;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-display font-semibold text-neutral-900 tracking-tight">
          {question ? `You're ${pct}% through.` : "You're almost done."}
        </h1>
        <p className="text-neutral-500 text-sm md:text-base">
          {question
            ? "Pick up where you left off."
            : "You've answered everything. One step left to see your results."}
        </p>
      </div>

      <div className="bg-white rounded-modal p-6 md:p-8 border border-neutral-200/80 shadow-card flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-4 flex-1 w-full">
          <div
            role="progressbar"
            aria-label="Assessment progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden"
          >
            <div
              className="bg-accent-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Currently on:</span>
            <span className="bg-neutral-xe2ede6 text-brand-hover px-3 py-1 rounded-full text-xs font-medium border border-brand-xd2e2d8">
              {question ? question.section : "Ready to finish"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push(`/assessment/run/${assessment.id}`)}
          className="w-full md:w-auto shrink-0 bg-brand-hover hover:bg-brand-x153427 text-white font-bold text-base px-8 py-3.5 rounded-[8px] transition-colors shadow-card flex items-center justify-center gap-2"
        >
          {question ? "Resume" : "Finish"}
        </button>
      </div>
    </div>
  );
}
