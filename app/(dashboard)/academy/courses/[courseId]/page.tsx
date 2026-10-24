"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, Clock } from "lucide-react";
import { useCourse } from "@/hooks/useLearning";
import { DraftBadge, ProgressRing, ResourceView, courseCta } from "@/components/academy/parts";
import { Markdown } from "@/components/academy/markdown";
import { enroll, learningErrorMessage } from "@/lib/api/learning";
import { formatDuration, levelLabel, stageLabel } from "@/lib/learning-format";

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const res = useCourse(courseId);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <Link href="/academy/courses" className="inline-flex min-h-11 w-fit items-center gap-1.5 text-sm font-medium text-sage-600 hover:text-sage-900">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        <span>All courses</span>
      </Link>

      <ResourceView res={res} notFoundText="We could not find that course.">
        {(course) => {
          const target = course.next_lesson_id ?? course.lessons[0]?.id ?? null;
          const onStart = async () => {
            if (!target) return;
            setStarting(true);
            setError(null);
            try {
              await enroll(course.id);
              router.push(`/academy/courses/${course.id}/lessons/${target}`);
            } catch (err) {
              setError(learningErrorMessage(err));
              setStarting(false);
            }
          };
          return (
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-8">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-[2px] bg-sage-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sage-600">{levelLabel(course.level)}</span>
                    {course.stage_tags.map((t) => (
                      <span key={t} className="rounded-[2px] bg-copper-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-copper-700">{stageLabel(t)}</span>
                    ))}
                    <DraftBadge status={course.review_status} />
                  </div>
                  <h1 className="text-3xl font-display font-semibold text-sage-900">{course.title}</h1>
                  <p className="flex items-center gap-3 text-sm text-sage-600">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" /> {formatDuration(course.duration_min)}</span>
                    <span>{course.lesson_count} lessons</span>
                  </p>
                </div>

                <section className="rounded-modal border border-sage-200 bg-white p-6 shadow-card">
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-sage-900">About this course</h2>
                  <Markdown source={course.description} />
                </section>

                {course.outcomes.length > 0 && (
                  <section className="rounded-modal border border-sage-200 bg-white p-6 shadow-card">
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-sage-900">What you will be able to do</h2>
                    <ul className="space-y-2">
                      {course.outcomes.map((o) => (
                        <li key={o} className="flex items-start gap-2 text-sm text-sage-700">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-700" aria-hidden="true" />
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>

              <aside className="space-y-4 overflow-hidden rounded-modal border border-sage-200 bg-white shadow-card lg:col-span-4">
                <div className="flex items-center gap-4 border-b border-sage-200 p-6">
                  <ProgressRing pct={course.progress} completed={course.completed} size={56} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-sage-900">{course.completed ? "Completed" : `${course.progress}% complete`}</p>
                    <button
                      type="button"
                      onClick={onStart}
                      disabled={starting || !target}
                      className="mt-2 min-h-11 w-full rounded-card bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-green-800 disabled:opacity-60"
                    >
                      {starting ? "Opening..." : courseCta(course)}
                    </button>
                  </div>
                </div>
                {error && <p role="alert" className="px-6 text-sm text-red-700">{error}</p>}
                {course.completed && (
                  <p className="px-6 text-sm">
                    <Link href="/academy/certificates" className="font-semibold text-copper-700 underline">View your certificate</Link>
                  </p>
                )}
                <h2 className="px-6 text-sm font-semibold uppercase tracking-wider text-sage-900">Curriculum</h2>
                <ol className="divide-y divide-sage-100 border-t border-sage-100">
                  {course.lessons.map((l) => (
                    <li key={l.id}>
                      <Link href={`/academy/courses/${course.id}/lessons/${l.id}`} className="flex min-h-11 items-start gap-3 p-4 hover:bg-sage-50">
                        {l.completed ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-700" aria-label="Done" />
                        ) : (
                          <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-sage-300" aria-label="Not done" />
                        )}
                        <span>
                          <span className="block text-sm font-medium text-sage-900">{l.order}. {l.title}</span>
                          <span className="mt-1 flex items-center gap-1 text-xs text-sage-600"><Clock className="h-3 w-3" aria-hidden="true" /> {l.duration_min} min</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </aside>
            </div>
          );
        }}
      </ResourceView>
    </div>
  );
}
