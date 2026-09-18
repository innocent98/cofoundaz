'use client';

import React from 'react';
import { Check, CalendarDays } from 'lucide-react';
import { useMissionHistory, MissionHistoryEntry } from '@/hooks/useMissionHistory';

function dayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

// Status is the completion source of truth (guide §6) — NOT completed/total, which
// is only informational (a `complete` mission can read completed < total).
function isComplete(m: MissionHistoryEntry): boolean {
  return m.status === 'complete';
}

export default function MissionCompletedPage() {
  const { missions, weeklyCompletionPct, loading, error } = useMissionHistory();

  // Newest-first is guaranteed by the API; keep only missions that actually had work.
  const rows = missions.filter((m) => m.total > 0 || m.status === 'complete');

  return (
    <main className="p-4 md:p-8 max-w-4xl w-full mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-8 pt-2 pb-12">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-3xl font-display font-semibold text-[#1E2923] tracking-tight">Completed</h2>
          <div className="bg-[#EAF2ED] text-[#2D5A3F] px-4 py-2 rounded-full text-xs font-semibold shrink-0">
            This week: {weeklyCompletionPct}% complete
          </div>
        </div>

        {loading && (
          <div className="flex flex-col gap-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-modal h-16 border border-[#EBEBE6] shadow-card animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="bg-[#FDF2F2] border border-[#FAD7D7] rounded-modal p-4 text-sm text-[#B0483B]">{error}</div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card p-12 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#EAF2ED] text-[#2D5A3F] flex items-center justify-center">
              <CalendarDays className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-[#1E2923]">No past missions yet</p>
            <p className="text-xs text-[#768478] max-w-xs">Complete today&apos;s mission and it&apos;ll show up here.</p>
          </div>
        )}

        {!loading && rows.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {rows.map((m) => {
              const done = isComplete(m);
              return (
                <div
                  key={m.mission_date}
                  className="bg-white rounded-modal px-5 py-4 border border-[#EBEBE6] shadow-card flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-8 h-8 rounded-input flex items-center justify-center shrink-0 ${done ? 'bg-[#2B4C38]' : 'bg-[#F5F5F0] border border-[#EBEBE6]'}`}>
                      {done ? <Check className="w-4 h-4 text-white stroke-[3]" /> : <span className="text-[11px] font-bold text-[#768478]">{m.completed}/{m.total}</span>}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold text-[#1E2923]">{dayLabel(m.mission_date)}</span>
                      <span className="text-[11px] text-[#768478]">{m.completed} of {m.total} done</span>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${
                      done ? 'bg-[#EAF2ED] text-[#2D5A3F]' : 'bg-[#F5F5F0] text-[#617065] border border-[#EBEBE6]'
                    }`}
                  >
                    {done ? 'Complete' : 'In progress'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
