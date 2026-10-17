'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Flame } from 'lucide-react';
import type { DashboardMissionState } from '@/types/dashboard';
import { CardError, CardSkeleton } from './card-states';

export const MISSION_COPY = {
  weekendOff: 'Weekends off. Rest is a strategy too.',
  allCaughtUp: 'You’re all caught up. Add your own task or pick one from your roadmap.',
  noRoadmap: 'Complete your kickoff assessment to get your daily plan',
} as const;

function Shell({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="rounded-card border border-green-100 bg-white p-6 shadow-card flex flex-col justify-between min-h-[300px]">
      <div>{children}</div>
      {footer}
    </div>
  );
}

const linkClass = 'text-sm font-bold text-[#266B4E] flex items-center justify-start gap-1 hover:underline pt-6 cursor-pointer';

export function MissionCard({
  mission,
  loading,
  onRetry,
  onComplete,
  readOnly = false,
}: {
  /** null = the workspace has no roadmap yet. */
  mission: DashboardMissionState | null | undefined;
  loading: boolean;
  onRetry: () => void;
  /** Completes a task server-side; resolves once saved. */
  onComplete: (taskId: string) => Promise<void>;
  /** Roles that can read the mission but not change it (e.g. a mentor): ticks are shown, not clickable. */
  readOnly?: boolean;
}) {
  const [pending, setPending] = useState<Set<string>>(new Set());

  if (loading) return <CardSkeleton label="Loading Today's Mission" className="min-h-[300px]" rows={4} />;
  if (mission === undefined || mission?.error) return <CardError title="Today's Mission" onRetry={onRetry} className="min-h-[300px]" />;

  const title = <h3 className="font-bold text-base text-sage-900 mb-4">Today&apos;s Mission</h3>;
  const goTo = (
    <Link href="/mission" className={linkClass}>
      Go to mission &rarr;
    </Link>
  );

  if (mission === null) {
    return (
      <Shell footer={goTo}>
        {title}
        <p className="text-sm text-sage-500 py-6">{MISSION_COPY.noRoadmap}</p>
      </Shell>
    );
  }

  if (mission.tasks.length === 0) {
    if (mission.emptyReason === 'weekend_off') {
      return (
        <Shell
          footer={
            <Link href="/mission/settings" className={linkClass}>
              Mission settings &rarr;
            </Link>
          }
        >
          {title}
          <p className="text-sm text-sage-500 py-6">{MISSION_COPY.weekendOff}</p>
        </Shell>
      );
    }
    return (
      <Shell footer={goTo}>
        {title}
        <p className="text-sm text-sage-500 py-6">{MISSION_COPY.allCaughtUp}</p>
      </Shell>
    );
  }

  if (mission.tasks.every((t) => t.completed)) {
    return (
      <div className="rounded-card border border-green-100 bg-white p-6 shadow-card flex flex-col items-center justify-center text-center py-10 min-h-[300px]">
        <Flame className="w-12 h-12 fill-copper-500 text-copper-500 mb-4" />
        <h3 className="font-bold text-lg text-sage-900">
          Mission complete.{mission.streakDays > 0 ? ` ${mission.streakDays}-day streak.` : ''}
        </h3>
        <Link href="/mission" className={linkClass}>
          Go to mission &rarr;
        </Link>
      </div>
    );
  }

  const complete = async (id: string) => {
    if (pending.has(id)) return;
    setPending((p) => new Set(p).add(id));
    try {
      await onComplete(id);
    } finally {
      setPending((p) => {
        const next = new Set(p);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <Shell footer={goTo}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-base text-sage-900">Today&apos;s Mission</h3>
        {mission.streakDays > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-copper-700">
            <Flame className="w-4 h-4 fill-copper-500 text-copper-500" />
            <span>{mission.streakDays}-day streak</span>
          </div>
        )}
      </div>

      <ul className="space-y-5">
        {mission.tasks.map((task) => {
          const done = task.completed || pending.has(task.id);
          return (
            <li key={task.id} className="flex items-start gap-3.5">
              {readOnly ? (
                <span
                  role="img"
                  aria-label={done ? 'Done' : 'Not done'}
                  className={`w-6 h-6 rounded-input flex items-center justify-center shrink-0 mt-0.5 ${
                    done ? 'bg-[#266B4E] text-white shadow-card' : 'border border-sage-300 bg-white'
                  }`}
                >
                  {done && <Check className="w-4 h-4 stroke-[2.5]" />}
                </span>
              ) : (
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={done}
                  aria-label={`Complete task: ${task.title}`}
                  disabled={done}
                  onClick={() => void complete(task.id)}
                  className={`w-6 h-6 rounded-input flex items-center justify-center shrink-0 mt-0.5 transition-all duration-300 ${
                    done ? 'bg-[#266B4E] text-white shadow-card' : 'border border-sage-300 bg-white hover:border-sage-400 cursor-pointer'
                  }`}
                >
                  <Check className={`w-4 h-4 stroke-[2.5] transition-all ${done ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} />
                </button>
              )}
              <div>
                <p className={`text-sm font-semibold ${done ? 'text-sage-500 line-through' : 'text-[#1D2A24]'}`}>{task.title}</p>
                {task.reason ? (
                  <p className={`text-xs mt-1 leading-normal ${'text-sage-500'}`}>{task.reason}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </Shell>
  );
}
