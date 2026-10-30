'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, Check, Circle, Clock } from 'lucide-react';
import { useMilestones } from '@/hooks/useCalendarApi';
import type { CalendarMilestone } from '@/lib/api/calendar';
import { longDate } from '@/lib/calendar-format';
import { secondaryBtn } from '@/components/calendar/drawer';

const STATUS: Record<CalendarMilestone['calendar_status'], { label: string; badge: string; bar: string; icon: React.ReactNode; iconBox: string; border: string }> = {
  on_track: { label: 'On track', badge: 'bg-accent-xf2ece1 text-accent-x7a6025', bar: 'bg-accent-gold', icon: <Clock size={16} aria-hidden />, iconBox: 'bg-accent-xf2ece1 text-accent-x7a6025', border: 'border-line' },
  at_risk: { label: 'At risk', badge: 'bg-danger-tint text-danger-bold', bar: 'bg-danger-bold', icon: <AlertCircle size={16} aria-hidden />, iconBox: 'bg-danger-tint text-danger-bold', border: 'border-danger-bold' },
  complete: { label: 'Complete', badge: 'bg-brand-strong text-white', bar: 'bg-brand-strong', icon: <Check size={16} aria-hidden />, iconBox: 'bg-brand-strong text-white', border: 'border-line' },
  not_started: { label: 'Not started', badge: 'bg-surface-muted text-ink-muted', bar: 'bg-neutral-400', icon: <Circle size={16} aria-hidden />, iconBox: 'bg-surface-muted text-ink-muted', border: 'border-line' },
};

function daysLeftLabel(n: number | null, complete: boolean): string | null {
  if (n === null || complete) return null;
  if (n < 0) return `${-n} ${-n === 1 ? 'day' : 'days'} overdue`;
  if (n === 0) return 'Due today';
  return `${n} ${n === 1 ? 'day' : 'days'} left`;
}

export default function MilestonesPage() {
  const { data, loading, error, reload } = useMilestones();
  const list = data?.milestones ?? [];

  return (
    <main className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-display text-ink-strong tracking-tight">Milestones</h1>
        <div className="flex items-center gap-3">
          {data && <span className="text-xs font-medium text-ink-muted">{data.summary.complete} of {data.summary.total} complete</span>}
          <Link href="/roadmap/milestones" className={secondaryBtn}>Manage in Roadmap</Link>
        </div>
      </div>
      <p className="text-xs text-ink-muted">Milestones come from your roadmap. Change one there and it updates here.</p>

      {loading && !data && <p role="status" className="text-xs text-ink-muted">Loading milestones…</p>}
      {error && !data && (
        <div role="alert" className="bg-danger-tint border border-danger-bold rounded-modal p-4 text-xs text-danger-bold flex items-center justify-between gap-3">
          <span>{error}</span>
          <button type="button" onClick={reload} className="font-semibold underline">Try again</button>
        </div>
      )}
      {data && list.length === 0 && (
        <div className="bg-white border border-line rounded-[24px] shadow-card p-10 text-center space-y-2">
          <p className="text-sm font-semibold text-ink">No milestones yet</p>
          <p className="text-xs text-ink-muted">Build your roadmap and its milestones will appear here with their dates.</p>
          <Link href="/roadmap" className={`${secondaryBtn} inline-block`}>Open Roadmap</Link>
        </div>
      )}

      <ul className="space-y-4">
        {list.map((m) => {
          const s = STATUS[m.calendar_status];
          const chip = daysLeftLabel(m.days_left, m.calendar_status === 'complete');
          return (
            <li key={m.id}>
              <Link href="/roadmap/milestones" className={`block bg-white border ${s.border} rounded-[24px] p-5 md:p-6 shadow-card space-y-4 hover:border-line-strong transition-colors`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className={`w-8 h-8 rounded-card flex items-center justify-center shrink-0 ${s.iconBox}`}>{s.icon}</div>
                    <div className="min-w-0">
                      <h2 className="font-semibold text-sm text-ink break-words">{m.title}</h2>
                      <p className="text-xs text-ink-muted mt-0.5">{m.due_on ? `Due ${longDate(m.due_on)}` : 'No date set'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${s.badge}`}>{s.label}</span>
                    {chip && <span className={`text-[11px] font-medium ${m.days_left !== null && m.days_left < 0 ? 'text-danger-bold' : 'text-ink-muted'}`}>{chip}</span>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-muted">{m.tasks_total === 0 ? 'No tasks yet' : `${m.tasks_done} of ${m.tasks_total} tasks complete`}</span>
                    <span className="font-semibold text-ink">{m.progress}%</span>
                  </div>
                  <div className="w-full bg-surface-muted h-2 rounded-full overflow-hidden" role="progressbar" aria-valuenow={m.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${m.title} progress`}>
                    <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${Math.min(100, Math.max(0, m.progress))}%` }} />
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
