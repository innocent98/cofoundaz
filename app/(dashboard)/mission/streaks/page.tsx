'use client';

import React, { useMemo } from 'react';
import { useMissionApi } from '@/hooks/useMissionApi';
import { useMissionHistory, MissionHistoryEntry } from '@/hooks/useMissionHistory';

// Completion level (0–3) for the activity grid, from a day's mission (if any).
function levelFor(m: MissionHistoryEntry | undefined): number {
  if (!m || m.total === 0) return 0;
  if (m.status === 'complete') return 3;
  if (m.completed > 0) return 2;
  return 1;
}

const LEVEL_COLORS = ['bg-[#EBF2EE]', 'bg-[#B5D4C0]', 'bg-[#4C8260]', 'bg-[#193C28]'];
const WEEKS = 13;

export default function MissionStreaksPage() {
  const { streak } = useMissionApi();
  const { missions, weeklyCompletionPct, loading } = useMissionHistory();

  const missionsByDate = useMemo(() => {
    const map = new Map<string, MissionHistoryEntry>();
    for (const m of missions) map.set(m.mission_date, m);
    return map;
  }, [missions]);

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
        const iso = d.toISOString().slice(0, 10);
        out.push({ key: iso, level: levelFor(missionsByDate.get(iso)), future: d.getTime() > today.getTime() });
      }
    }
    return out;
  }, [missionsByDate]);

  return (
    <main className="p-4 md:p-8 max-w-4xl w-full mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-8 pt-2 pb-12">
        <div>
          <h2 className="text-3xl font-display font-semibold text-[#1E2923] tracking-tight">Streak history</h2>
          <p className="text-xs md:text-sm text-[#768478] mt-1.5 font-normal">Consistency beats intensity.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col justify-between h-36">
            <span className="text-[11px] font-bold tracking-wider text-[#768478] uppercase">Current streak</span>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-display font-semibold text-[#1E2923]">{streak} {streak === 1 ? 'day' : 'days'}</span>
              {streak > 0 && <span className="text-2xl">🔥</span>}
            </div>
          </div>

          <div className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col justify-between h-36">
            <span className="text-[11px] font-bold tracking-wider text-[#768478] uppercase">This week</span>
            <span className="text-3xl font-display font-semibold text-[#1E2923]">{weeklyCompletionPct}%</span>
          </div>

          <div className="bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card flex flex-col justify-between h-36">
            <span className="text-[11px] font-bold tracking-wider text-[#768478] uppercase">Missions completed</span>
            <span className="text-3xl font-display font-semibold text-[#1E2923]">{completedCount}</span>
          </div>
        </div>

        <div className="bg-white rounded-modal p-6 md:p-8 border border-[#EBEBE6] shadow-card flex flex-col gap-6">
          <span className="text-xs font-semibold text-[#1E2923]">Last {WEEKS} weeks</span>

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

          <div className="flex items-center gap-2 text-xs text-[#768478] font-medium">
            <span>Less</span>
            <div className="flex items-center gap-1.5">
              {LEVEL_COLORS.map((colorClass, idx) => (
                <div key={idx} className={`w-3.5 h-3.5 rounded-xs ${colorClass}`} />
              ))}
            </div>
            <span>More</span>
          </div>
          {!loading && missions.length === 0 && (
            <p className="text-xs text-[#768478] italic">No mission activity recorded yet — your grid fills in as you complete daily missions.</p>
          )}
        </div>
      </div>
    </main>
  );
}
