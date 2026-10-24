"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAssessmentHistory, useStartAssessment } from "@/hooks/useAssessmentApi";
import { useWorkspace } from "@/components/workspace-context";
import { canTakeAssessment } from "@/lib/nav-access";
import { daysSinceCompletion } from "@/lib/assessment-insights";

const PRIMARY_LINK =
  "bg-brand-hover hover:bg-brand-x153427 text-white font-bold text-sm px-5 py-2.5 rounded-[8px] transition-colors text-center";

export default function AssessmentStartPage() {
  const router = useRouter();
  const { role, workspaceName, loading: workspaceLoading } = useWorkspace();
  const { inProgress, completed, quarterlyDue, loading: historyLoading, error: historyError } = useAssessmentHistory();
  const { start, starting, error: startError } = useStartAssessment();

  // Founders take the check-in; team members only read what it produced (PRD Module 07 access).
  const founder = canTakeAssessment(role);
  const readOnly = !workspaceLoading && !founder;

  const handleBegin = async () => {
    const id = await start();
    if (id) router.push(`/assessment/run/${id}`);
  };

  const pct = inProgress?.progress?.pct;
  const daysSince = daysSinceCompletion(completed[0]?.completed_at ?? null);

  return (
    <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto pt-8">
      {founder && quarterlyDue && !inProgress && (
        <div
          role="region"
          aria-label="Quarterly re-assessment due"
          className="bg-accent-xf7eedc rounded-card p-4 border border-accent-500/40 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-3"
        >
          <div className="space-y-1">
            <h3 className="text-ink font-semibold text-sm">Time for your quarterly check-in</h3>
            <p className="text-ink-muted text-xs">{daysSince === null ? "It has been over 90 days" : `It has been ${daysSince} days`} since your last assessment. Keep your Health Score honest.</p>
          </div>
          <button
            type="button"
            onClick={() => void handleBegin()}
            disabled={starting}
            className="shrink-0 bg-accent-600 hover:bg-accent-700 disabled:opacity-60 text-white font-bold text-xs px-4 py-2 rounded-[8px] transition-colors shadow-card"
          >
            {starting ? "Starting..." : "Start re-assessment"}
          </button>
        </div>
      )}

      {founder && inProgress && (
        <div className="bg-accent-200 rounded-card p-4 border border-accent-500/30 shadow-card flex items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-ink font-semibold text-sm">You have an assessment in progress</h3>
            <p className="text-ink-muted text-xs">
              {typeof pct === "number"
                ? `You're ${pct}% through. Pick up where you left off.`
                : "Pick up where you left off."}
            </p>
          </div>
          <button
            onClick={() => router.push('/assessment/in-progress')}
            className="shrink-0 bg-white text-brand-900 font-bold text-xs px-4 py-2 rounded-[8px] hover:bg-neutral-50 transition-colors shadow-card"
          >
            Resume
          </button>
        </div>
      )}

      <div className="bg-white rounded-modal p-8 md:p-12 border border-neutral-200/80 shadow-card flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-2">
          <span className="text-3xl">🧭</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-display font-semibold text-neutral-900 tracking-tight">
          Let&apos;s calibrate {workspaceName ?? "your startup"}
        </h1>

        <p className="text-neutral-600 text-sm md:text-base max-w-lg leading-relaxed">
          Honest answers make everything smarter, your score, your roadmap, your advisors. There are no wrong answers, only accurate ones.
        </p>

        {readOnly ? (
          <div className="pt-4 w-full max-w-sm space-y-4">
            <p className="text-sm text-neutral-600">
              Only founders can take the assessment. You can read every result and compare check-ins.
            </p>
            <div className="flex flex-col md:flex-row gap-3 justify-center">
              <Link href="/assessment/results" className={PRIMARY_LINK}>
                View past results
              </Link>
              <Link
                href="/assessment/compare"
                className="bg-white border border-neutral-200 text-neutral-800 font-bold text-sm px-5 py-2.5 rounded-[8px] hover:border-neutral-300 transition-colors text-center"
              >
                Compare
              </Link>
            </div>
          </div>
        ) : (
          <div className="pt-6 w-full max-w-xs">
            <button
              onClick={() => void handleBegin()}
              disabled={starting || historyLoading || !founder}
              className="w-full bg-brand-hover disabled:opacity-60 disabled:cursor-not-allowed hover:bg-brand-x153427 text-white font-bold text-base px-6 py-3.5 rounded-[8px] transition-colors shadow-card flex items-center justify-center gap-2"
            >
              {starting ? "Starting..." : historyLoading ? "Loading..." : inProgress ? "Continue" : completed.length > 0 ? "Start a check-in" : "Begin"}
            </button>
            {startError && (
              <p role="alert" className="text-sm text-danger-600 mt-3">
                {startError}
              </p>
            )}
            {historyError && !startError && (
              <p className="text-xs text-neutral-500 mt-3">We couldn&apos;t check for an assessment in progress. {historyError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
