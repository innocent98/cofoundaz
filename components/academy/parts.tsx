import React from 'react';
import Link from 'next/link';
import { Check, Clock, BookOpen } from 'lucide-react';
import type { CourseSummary, ReviewStatus } from '@/lib/api/learning';
import type { Resource } from '@/hooks/useLearning';
import { formatDuration, levelLabel, stageLabel } from '@/lib/learning-format';

/** Visible "Draft" marker while content has not been reviewed (guide UX 1). */
export function DraftBadge({ status }: { status: ReviewStatus }) {
  if (status !== 'draft') return null;
  return (
    <span className="rounded-[2px] bg-accent-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-700">
      Draft
    </span>
  );
}

/** Progress ring with the percent inside, a check when complete. Never colour alone: the number is always there. */
export function ProgressRing({ pct, completed, size = 40 }: { pct: number; completed: boolean; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={completed ? 'Completed' : `${pct}% complete`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={3} className="stroke-neutral-200" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - (completed ? 100 : pct) / 100)}
          className="stroke-brand-700"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-neutral-800">
        {completed ? <Check className="h-4 w-4 text-brand-700" aria-hidden="true" /> : pct}
      </span>
    </div>
  );
}

/** The CTA word for a course, from the caller's own progress. */
export function courseCta(c: Pick<CourseSummary, 'enrolled' | 'progress' | 'completed' | 'position_s'>): string {
  if (c.completed) return 'Review course';
  if (c.progress > 0 || c.position_s > 0) return 'Continue';
  return 'Start course';
}

export function CourseCard({ course }: { course: CourseSummary }) {
  return (
    <Link
      href={`/academy/courses/${course.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-modal border border-neutral-200 bg-white shadow-card transition-colors hover:border-accent-600"
    >
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-[2px] bg-neutral-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-600">
            {levelLabel(course.level)}
          </span>
          {course.stage_tags.map((t) => (
            <span
              key={t}
              className="rounded-[2px] bg-accent-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-700"
            >
              {stageLabel(t)}
            </span>
          ))}
          <DraftBadge status={course.review_status} />
        </div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-lg text-neutral-900 transition-colors group-hover:text-accent-700">
            {course.title}
          </h3>
          <ProgressRing pct={course.progress} completed={course.completed} />
        </div>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-neutral-600">{course.summary}</p>
        <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-4 text-xs font-medium text-neutral-600">
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {formatDuration(course.duration_min)}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> {course.lesson_count} lessons
            </span>
          </span>
          <span className="font-semibold text-accent-700">{courseCta(course)}</span>
        </div>
      </div>
    </Link>
  );
}

/** Loading / error / forbidden / not-found wrapper. Renders children only when data is ready. */
export function ResourceView<T>({
  res,
  notFoundText = 'We could not find that.',
  children,
}: {
  res: Resource<T>;
  notFoundText?: string;
  children: (data: T) => React.ReactNode;
}) {
  if (res.status === 'loading' && res.data === null) {
    return (
      <div role="status" aria-label="Loading" className="space-y-4">
        <div className="h-8 w-1/3 animate-pulse rounded-card bg-neutral-100" />
        <div className="h-40 animate-pulse rounded-modal bg-neutral-100" />
      </div>
    );
  }
  if (res.status === 'forbidden') {
    return (
      <div role="alert" className="rounded-modal border border-neutral-200 bg-white p-8 text-center shadow-card">
        <p className="text-sm font-semibold text-neutral-900">The Academy is not available for your role.</p>
      </div>
    );
  }
  if (res.status === 'notfound') {
    return (
      <div role="alert" className="rounded-modal border border-neutral-200 bg-white p-8 text-center shadow-card">
        <p className="text-sm font-semibold text-neutral-900">{notFoundText}</p>
        <Link href="/academy" className="mt-3 inline-block text-sm font-semibold text-accent-700 underline">
          Back to the Academy
        </Link>
      </div>
    );
  }
  if (res.status === 'error' || res.data === null) {
    return (
      <div role="alert" className="rounded-modal border border-danger-200 bg-danger-50 p-8 text-center">
        <p className="text-sm font-semibold text-danger-800">{res.error ?? 'Could not load this data.'}</p>
        <button
          type="button"
          onClick={res.reload}
          className="mt-3 min-h-11 rounded-card bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
        >
          Retry
        </button>
      </div>
    );
  }
  return <>{children(res.data)}</>;
}
