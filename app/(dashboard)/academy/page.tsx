"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Clock, BookOpen, ArrowRight } from "lucide-react";
import { useRecommendations } from "@/hooks/useLearning";
import { CourseCard, DraftBadge, ProgressRing, ResourceView, courseCta } from "@/components/academy/parts";
import { formatDuration, stageLabel } from "@/lib/learning-format";

export default function AcademyRecommendedPage() {
  const res = useRecommendations();

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <div className="space-y-1">
        <h1 className="text-3xl font-display font-semibold text-sage-900">Learning Academy</h1>
        <p className="text-sm text-sage-600">Short courses and playbooks picked for where your startup is now.</p>
      </div>

      <ResourceView res={res}>
        {(data) => {
          const hero = data.hero ? data.recommended.find((c) => c.id === data.hero?.course_id) ?? data.recommended[0] : null;
          const shelf = data.recommended.filter((c) => c.id !== hero?.id);
          return (
            <>
              {data.hero && hero && (
                <section
                  aria-labelledby="learn-next"
                  className="relative flex flex-col gap-6 overflow-hidden rounded-modal border border-green-800 bg-green-900 p-6 shadow-card md:p-8"
                >
                  <p id="learn-next" className="text-xs font-bold uppercase tracking-widest text-copper-500">
                    Learn next
                  </p>
                  <div className="flex items-start gap-3.5">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-copper-200" aria-hidden="true" />
                    <p className="text-sm font-medium italic leading-relaxed text-green-100" data-testid="hero-reason">
                      {data.hero.reason}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-display font-bold text-white">{hero.title}</h2>
                      <DraftBadge status={hero.review_status} />
                    </div>
                    <p className="text-sm text-green-200">{hero.summary}</p>
                    <p className="flex items-center gap-3 text-sm font-medium text-green-200">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {formatDuration(hero.duration_min)}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> {hero.lesson_count} lessons
                      </span>
                    </p>
                  </div>
                  <div>
                    <Link
                      href={`/academy/courses/${hero.id}`}
                      className="inline-flex min-h-11 items-center gap-2 rounded-card bg-copper-600 px-6 py-2.5 text-sm font-semibold text-white shadow-card hover:bg-copper-700"
                    >
                      <span>{courseCta(hero)}</span>
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </section>
              )}

              {data.continue_watching.length > 0 && (
                <section className="space-y-4" aria-labelledby="continue-heading">
                  <h2 id="continue-heading" className="text-sm font-semibold uppercase tracking-wider text-sage-900">
                    Continue watching
                  </h2>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {data.continue_watching.map((c) => (
                      <Link
                        key={c.id}
                        href={
                          c.next_lesson_id
                            ? `/academy/courses/${c.id}/lessons/${c.next_lesson_id}`
                            : `/academy/courses/${c.id}`
                        }
                        className="flex items-center gap-4 rounded-modal border border-sage-200 bg-white p-4 shadow-card transition-colors hover:border-copper-600"
                      >
                        <ProgressRing pct={c.progress} completed={c.completed} size={48} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold text-sage-900">{c.title}</span>
                            <DraftBadge status={c.review_status} />
                          </span>
                          <span className="text-xs text-sage-600">{c.progress}% complete · Continue</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {shelf.length > 0 && (
                <section className="space-y-4" aria-labelledby="shelf-heading">
                  <h2 id="shelf-heading" className="text-sm font-semibold uppercase tracking-wider text-sage-900">
                    {data.stage ? `For the ${stageLabel(data.stage)} stage` : "Start here"}
                  </h2>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {shelf.map((c) => (
                      <CourseCard key={c.id} course={c} />
                    ))}
                  </div>
                </section>
              )}

              {!data.hero && shelf.length === 0 && data.continue_watching.length === 0 && (
                <p className="text-sm text-sage-600">
                  You have finished everything for this stage.{" "}
                  <Link href="/academy/courses" className="font-semibold text-copper-700 underline">
                    Browse all courses
                  </Link>
                </p>
              )}
            </>
          );
        }}
      </ResourceView>
    </div>
  );
}
