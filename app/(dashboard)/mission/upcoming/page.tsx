'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ListChecks, ArrowRight } from 'lucide-react';
import { useRoadmapApi } from '@/hooks/useRoadmapApi';

export default function MissionUpcomingPage() {
  const { phases, loading } = useRoadmapApi();

  // "Drawn from your roadmap": every not-yet-done task, grouped by its milestone.
  // The roadmap has no per-day schedule, so we group by milestone (real) rather
  // than inventing Tomorrow/Wed/Thu buckets.
  const groups = useMemo(() => {
    const out: { milestone: string; tasks: { id: string; title: string }[] }[] = [];
    for (const phase of phases) {
      for (const ms of phase.milestones) {
        const pending = ms.tasks.filter((t) => t.status !== 'done');
        if (pending.length > 0) {
          out.push({ milestone: ms.title, tasks: pending.map((t) => ({ id: t.id, title: t.title })) });
        }
      }
    }
    return out;
  }, [phases]);

  return (
    <main className="p-4 md:p-8 max-w-4xl w-full mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-8 pt-2 pb-12">
        <div>
          <h2 className="text-3xl font-display font-semibold text-[#1E2923] tracking-tight">Upcoming</h2>
          <p className="text-xs md:text-sm text-[#768478] mt-1.5 font-normal">
            What&apos;s next, drawn from your roadmap — grouped by milestone.
          </p>
        </div>

        {loading && (
          <div className="flex flex-col gap-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-modal h-16 border border-[#EBEBE6] shadow-card animate-pulse" />
            ))}
          </div>
        )}

        {!loading && groups.length === 0 && (
          <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card p-12 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#EAF2ED] text-[#2D5A3F] flex items-center justify-center">
              <ListChecks className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-[#1E2923]">Nothing upcoming</p>
            <p className="text-xs text-[#768478] max-w-xs">Every roadmap task is done, or your roadmap hasn&apos;t been generated yet.</p>
            <Link
              href="/roadmap"
              className="mt-1 inline-flex items-center gap-1.5 bg-[#183B28] hover:bg-[#11291C] text-white text-xs font-bold px-4 py-2 rounded-card transition-colors"
            >
              <span>Go to your roadmap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {!loading && groups.length > 0 && (
          <div className="flex flex-col gap-6">
            {groups.map((group) => (
              <div key={group.milestone} className="flex flex-col gap-2.5">
                <h3 className="text-[11px] font-bold tracking-wider text-[#768478] uppercase">{group.milestone}</h3>
                <div className="flex flex-col gap-2.5">
                  {group.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white rounded-modal px-5 py-4 border border-[#EBEBE6] shadow-card flex items-center justify-between gap-4"
                    >
                      <span className="text-sm font-semibold text-[#1E2923] truncate">{task.title}</span>
                      <span className="bg-[#EAF2ED] text-[#2D5A3F] text-xs font-medium px-3.5 py-1.5 rounded-full shrink-0">
                        {group.milestone}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
