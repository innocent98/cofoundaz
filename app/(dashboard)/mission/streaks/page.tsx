'use client';

import React, { useMemo } from 'react';
import { useMissionHistory, MissionHistoryEntry } from '@/hooks/useMissionHistory';

// Completion level (0–3) for the activity grid, from a day's mission (if any).
function levelFor(m: MissionHistoryEntry | undefined): number {
  if (!m || m.total === 0) return 0;
  if (m.status === 'complete') return 3;
  if (m.completed > 0) return 2;
  return 1;
}

const LEVEL_COLORS = ['bg-neutral-xebf2ee', 'bg-brand-xb5d4c0', 'bg-brand-x4c8260', 'bg-brand-x193c28'];
const WEEKS = 13;

export default function MissionStreaksPage() {
  const { missions, weeklyCompletionPct, currentStreak: streak, bestStreak, loading } = useMissionHistory();

  const missionsByDate = useMemo(() => {
    const map = new Map<string, MissionHistoryEntry>();
    for (const m of missions) map.set(m.mission_date, m);
    return map;
  }, [missions]);

  const days = (n: number) => (loading ? '\u2026' : `${n} ${n === 1 ? 'day' : 'days'}`);
  const completedCount = missions.filter((m) => m.status === 'complete').length;

  // Build a calendar-aligned grid: WEEKS columns × 7 rows (Sun→Sat), ending this
  // week. grid-flow-col + grid-rows-7 fills each column top-to-bottom, so emit
  // days in that order. Cells are keyed by real dates from the history.
  const cells = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - today.getDay() - (WEEKS - 1) * 7); // Sunday, WEEKS-1 weeks back
    const out: { key: string; level: number; future: boolean }[] = [];
    for (let col = 0; col < WEEKS; col++) {
      for (let row = 0; row < 7; row++) {
        const d = new Date(start);
        d.setDate(start.getDate() + col * 7 + row);
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; // local date: toISOString shifts it in non-UTC zones
        out.push({ key: iso, level: levelFor(missionsByDate.get(iso)), future: d.getTime() > today.getTime() });
      }
    }
    return out;
  }, [missionsByDate]);

  return (
    <main className="p-4 md:p-8 max-w-4xl w-full mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-8 pt-2 pb-12">
        <div>
          <h2 className="text-3xl font-display font-semibold text-ink tracking-tight">Streak history</h2>
          <p className="text-xs md:text-sm text-ink-soft mt-1.5 font-normal">Consistency beats intensity.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-modal p-6 border border-line-soft shadow-card flex flex-col justify-between h-36">
            <span className="text-[11px] font-bold tracking-wider text-ink-soft uppercase">Current streak</span>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-display font-semibold text-ink">{days(streak)}</span>
              {streak > 0 && <span className="text-2xl" aria-hidden="true">🔥</span>}
            </div>
          </div>

          <div className="bg-white rounded-modal p-6 border border-line-soft shadow-card flex flex-col justify-between h-36">
            <span className="text-[11px] font-bold tracking-wider text-ink-soft uppercase">Best streak</span>
            <span className="text-3xl font-display font-semibold text-ink">{days(bestStreak)}</span>
          </div>

          <div className="bg-white rounded-modal p-6 border border-line-soft shadow-card flex flex-col justify-between h-36">
            <span className="text-[11px] font-bold tracking-wider text-ink-soft uppercase">This week</span>
            <span className="text-3xl font-display font-semibold text-ink">{weeklyCompletionPct}%</span>
          </div>

          <div className="bg-white rounded-modal p-6 border border-line-soft shadow-card flex flex-col justify-between h-36">
            <span className="text-[11px] font-bold tracking-wider text-ink-soft uppercase">Missions completed</span>
            <span className="text-3xl font-display font-semibold text-ink">{completedCount}</span>
          </div>
        </div>

        <div className="bg-white rounded-modal p-6 md:p-8 border border-line-soft shadow-card flex flex-col gap-6">
          <span className="text-xs font-semibold text-ink">Last {WEEKS} weeks</span>

          <div className="overflow-x-auto pb-2 no-scrollbar">
            <div className="grid grid-rows-7 grid-flow-col gap-1.5 w-max">
              {cells.map((c) => (
                <div
                  key={c.key}
                  title={c.key}
                  className={`w-4 h-4 rounded-xs transition-colors ${c.future ? 'bg-transparent' : LEVEL_COLORS[c.level]}`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-ink-soft font-medium">
            <span>Less</span>
            <div className="flex items-center gap-1.5">
              {LEVEL_COLORS.map((colorClass, idx) => (
                <div key={idx} className={`w-3.5 h-3.5 rounded-xs ${colorClass}`} />
              ))}
            </div>
            <span>More</span>
          </div>
          {!loading && missions.length === 0 && (
            <p className="text-xs text-ink-soft italic">No mission activity recorded yet, your grid fills in as you complete daily missions.</p>
          )}
        </div>
      </div>
    </main>
  );
}
