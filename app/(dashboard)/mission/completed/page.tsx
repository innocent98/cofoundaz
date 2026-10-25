'use client';

import React, { useMemo } from 'react';
import { Check, CalendarDays } from 'lucide-react';
import { useMissionHistory } from '@/hooks/useMissionHistory';
import { useMissionCompleted, groupByDay } from '@/hooks/useMissionCompleted';
import { MilestoneChip } from '@/components/mission/milestone-chip';

function dayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function MissionCompletedPage() {
  const { missions, weeklyCompletionPct, loading: historyLoading } = useMissionHistory();
  const { items, hasMore, loading, loadingMore, error, loadMore, refetch } = useMissionCompleted();

  const groups = useMemo(() => groupByDay(items), [items]);
  // Status is the completion source of truth (guide §6), not completed/total.
  const statusByDate = useMemo(() => new Map(missions.map((m) => [m.mission_date, m])), [missions]);

  return (
    <main className="p-4 md:p-8 max-w-4xl w-full mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-8 pt-2 pb-12">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-3xl font-display font-semibold text-ink tracking-tight">Completed</h2>
          {!historyLoading && (
            <div className="bg-brand-tint text-brand-mid px-4 py-2 rounded-full text-xs font-semibold shrink-0">
              This week: {weeklyCompletionPct}% complete
            </div>
          )}
        </div>

        {loading && (
          <div role="status" aria-label="Loading completed tasks" className="flex flex-col gap-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-modal h-16 border border-line-soft shadow-card animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div role="alert" className="bg-danger-tint border border-danger-xfad7d7 rounded-modal p-4 text-sm text-danger-600 flex items-center justify-between gap-3">
            <span>{error}</span>
            <button type="button" onClick={() => void refetch()} className="text-xs font-semibold underline cursor-pointer">
              Try again
            </button>
          </div>
        )}

        {!loading && !error && groups.length === 0 && (
          <div className="bg-white rounded-modal border border-line-soft shadow-card p-12 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-tint text-brand-mid flex items-center justify-center">
              <CalendarDays className="w-6 h-6" aria-hidden="true" />
            </div>
            <p className="text-sm font-bold text-ink">No completed tasks yet</p>
            <p className="text-xs text-ink-soft max-w-xs">Complete a task from today&apos;s mission and it&apos;ll show up here.</p>
          </div>
        )}

        {!loading && groups.length > 0 && (
          <div className="flex flex-col gap-6">
            {groups.map((g) => {
              const day = statusByDate.get(g.date);
              const dayDone = day?.status === 'complete';
              return (
                <section key={g.date} aria-label={dayLabel(g.date)} className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-ink">{dayLabel(g.date)}</h3>
                    {day && (
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${
                          dayDone ? 'bg-brand-tint text-brand-mid' : 'bg-surface-muted text-ink-muted border border-line-soft'
                        }`}
                      >
                        {dayDone ? 'Complete' : `${day.completed} of ${day.total} done`}
                      </span>
                    )}
                  </div>
                  <ul className="flex flex-col gap-2">
                    {g.items.map((t) => (
                      <li key={t.id} className="bg-white rounded-modal px-5 py-4 border border-line-soft shadow-card flex items-center gap-3.5">
                        <div className="w-7 h-7 rounded-input bg-brand-x2b4c38 flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4 text-white stroke-[3]" aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                          <span className="text-sm font-semibold text-ink">{t.title}</span>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] text-ink-soft">{timeLabel(t.completedAt)}</span>
                            {t.milestone && <MilestoneChip milestone={t.milestone} />}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}

            {hasMore && (
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className="self-center px-5 py-2 rounded-card border border-line-strong bg-white text-xs font-semibold text-ink hover:bg-surface-muted disabled:opacity-60 cursor-pointer"
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
