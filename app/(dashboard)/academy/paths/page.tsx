"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Map } from "lucide-react";
import { usePaths } from "@/hooks/useLearning";
import { useRecommendations } from "@/hooks/useLearning";
import { DraftBadge, ResourceView } from "@/components/academy/parts";
import { formatDuration, stageLabel } from "@/lib/learning-format";

export default function LearningPathsPage() {
  const res = usePaths();
  const rec = useRecommendations();
  const myStage = rec.data?.stage ?? null;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="space-y-1">
        <h1 className="text-3xl font-display font-semibold text-sage-900">Learning Paths</h1>
        <p className="text-sm text-sage-600">The curriculum for where you are, not where the internet thinks you are.</p>
      </div>

      <ResourceView res={res}>
        {(paths) => {
          const ordered = [...paths].sort((a, b) => Number(b.stage === myStage) - Number(a.stage === myStage));
          if (ordered.length === 0) {
            return (
              <div className="rounded-modal border border-sage-200 bg-white p-12 text-center shadow-card">
                <p className="text-sm font-semibold text-sage-900">No learning paths yet</p>
              </div>
            );
          }
          return (
            <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2">
              {ordered.map((path) => {
                const nextCourse = path.courses.find((c) => !c.completed) ?? path.courses[0];
                const finished = path.courses.length > 0 && path.courses.every((c) => c.completed);
                return (
                  <section key={path.id} aria-label={path.title} className="flex h-full flex-col space-y-5 rounded-modal border border-sage-200 bg-white p-6 shadow-card md:p-8">
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-modal border border-sage-200 bg-sage-50 text-green-700 shadow-card">
                        <Map className="h-6 w-6" aria-hidden="true" />
                      </span>
                      <span className="flex items-center gap-2">
                        <DraftBadge status={path.review_status} />
                        <span className="rounded-full bg-copper-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-copper-700">
                          {stageLabel(path.stage)}
                          {path.stage === myStage ? " · your stage" : ""}
                        </span>
                      </span>
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold text-sage-900">{path.title}</h2>
                      <p className="text-sm leading-relaxed text-sage-600">{path.summary}</p>
                      <p className="text-xs font-medium text-sage-600">{path.course_count} courses · {formatDuration(path.duration_min)}</p>
                    </div>
                    <ol className="flex-1 space-y-2">
                      {path.courses.map((c, i) => (
                        <li key={c.id}>
                          <Link href={`/academy/courses/${c.id}`} className="flex min-h-11 items-center gap-3 rounded-card border border-sage-100 p-3 hover:bg-sage-50">
                            {c.completed ? (
                              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-700" aria-label="Completed" />
                            ) : (
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-sage-300 text-[10px] font-bold text-sage-600">{i + 1}</span>
                            )}
                            <span className="min-w-0 flex-1 truncate text-sm font-medium text-sage-900">{c.title}</span>
                            <span className="text-xs text-sage-600">{c.completed ? "Done" : `${c.progress}%`}</span>
                          </Link>
                        </li>
                      ))}
                    </ol>
                    <div className="space-y-3 border-t border-sage-100 pt-5">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium text-sage-600"><span>Progress</span><span>{path.progress}%</span></div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-sage-100" role="progressbar" aria-valuenow={path.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${path.title} progress`}>
                          <div className="h-full rounded-full bg-green-700" style={{ width: `${path.progress}%` }} />
                        </div>
                      </div>
                      {nextCourse && (
                        <Link href={`/academy/courses/${nextCourse.id}`} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-card border border-sage-300 bg-white px-4 py-2.5 text-sm font-semibold text-sage-800 shadow-card hover:bg-sage-50">
                          <span>{finished ? "Review path" : path.progress > 0 ? "Continue path" : "Start path"}</span>
                          <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          );
        }}
      </ResourceView>
    </div>
  );
}
