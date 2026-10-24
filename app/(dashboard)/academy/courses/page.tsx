"use client";

import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useCourses } from "@/hooks/useLearning";
import { CourseCard, ResourceView } from "@/components/academy/parts";
import { levelLabel, stageLabel } from "@/lib/learning-format";

export default function CoursesCatalogPage() {
  const res = useCourses();
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("");
  const [stage, setStage] = useState("");

  const courses = useMemo(() => res.data ?? [], [res.data]);
  const levels = useMemo(() => Array.from(new Set(courses.map((c) => c.level))), [courses]);
  const stages = useMemo(() => Array.from(new Set(courses.flatMap((c) => c.stage_tags))), [courses]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return courses.filter(
      (c) =>
        (!q || c.title.toLowerCase().includes(q) || c.summary.toLowerCase().includes(q)) &&
        (!level || c.level === level) &&
        (!stage || c.stage_tags.includes(stage)),
    );
  }, [courses, query, level, stage]);

  const chip = (active: boolean) =>
    `inline-flex min-h-11 items-center rounded-full border px-4 text-xs font-semibold transition-colors ${
      active ? "border-brand-700 bg-brand-700 text-white" : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
    }`;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-semibold text-neutral-900">Course catalog</h1>
          <p className="text-sm text-neutral-600">Explore all available founder playbooks.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
          <input
            type="search"
            aria-label="Search courses"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search courses"
            className="min-h-11 w-full rounded-full border border-neutral-200 bg-white pl-9 pr-4 text-sm text-neutral-900 shadow-card focus:border-brand-700 focus:outline-none"
          />
        </div>
      </div>

      <ResourceView res={res}>
        {() => (
          <>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by stage and level">
              <button type="button" aria-pressed={!stage && !level} onClick={() => { setStage(""); setLevel(""); }} className={chip(!stage && !level)}>
                All
              </button>
              {stages.map((s) => (
                <button key={s} type="button" aria-pressed={stage === s} onClick={() => setStage(stage === s ? "" : s)} className={chip(stage === s)}>
                  {stageLabel(s)}
                </button>
              ))}
              {levels.map((l) => (
                <button key={l} type="button" aria-pressed={level === l} onClick={() => setLevel(level === l ? "" : l)} className={chip(level === l)}>
                  {levelLabel(l)}
                </button>
              ))}
            </div>
            {shown.length === 0 ? (
              <p className="py-12 text-center text-sm text-neutral-600">No courses match.</p>
            ) : (
              <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2 lg:grid-cols-3">
                {shown.map((c) => (
                  <CourseCard key={c.id} course={c} />
                ))}
              </div>
            )}
          </>
        )}
      </ResourceView>
    </div>
  );
}
