'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowUp, Clock, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { useMissionUpcoming, moveId, visibleOrder, type UpcomingDay } from '@/hooks/useMissionUpcoming';
import { useWorkspace } from '@/components/workspace-context';
import { MISSION_COPY } from '@/components/mission/mission-copy';
import { MilestoneChip } from '@/components/mission/milestone-chip';
import { RoadmapEmptyState } from '@/components/mission/roadmap-empty-state';

function dayHeading(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return d.getTime() === tomorrow.getTime() ? `Tomorrow · ${label}` : label;
}

// Only these roles may save an order (PUT /missions/upcoming/order is 403 for everyone else).
const CAN_REORDER = new Set(['founder', 'team_member']);

export default function MissionUpcomingPage() {
  const { data, loading, error, saving, reorder, generateRoadmap, refetch } = useMissionUpcoming();
  const { role } = useWorkspace();
  const canReorder = role !== null && CAN_REORDER.has(role);
  const [dragId, setDragId] = useState<string | null>(null);
  const [generateFailed, setGenerateFailed] = useState(false);

  const days: UpcomingDay[] = data?.days ?? [];
  const order = visibleOrder(days);

  const save = async (next: string[]) => {
    const ok = await reorder(next);
    if (ok) toast.success('Order saved.');
    else toast.error("Couldn't save the new order. Your list was refreshed.");
  };

  const move = (id: string, delta: -1 | 1) => {
    const from = order.indexOf(id);
    void save(moveId(order, from, from + delta));
  };

  const drop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    void save(moveId(order, order.indexOf(dragId), order.indexOf(targetId)));
    setDragId(null);
  };

  const handleGenerate = async () => {
    setGenerateFailed(false);
    if (!(await generateRoadmap())) setGenerateFailed(true);
  };

  return (
    <main className="p-4 md:p-8 max-w-4xl w-full mx-auto flex flex-col gap-6">
      <div className="flex flex-col gap-8 pt-2 pb-12">
        <div>
          <h2 className="text-3xl font-display font-semibold text-ink tracking-tight">Upcoming</h2>
          <p className="text-xs md:text-sm text-ink-soft mt-1.5 font-normal">
            The next 7 days, drawn from your roadmap.
            {canReorder && ' Drag tasks or use the arrows to change their order.'}
          </p>
        </div>

        {loading && (
          <div role="status" aria-label="Loading upcoming missions" className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white rounded-modal h-24 border border-line-soft shadow-card animate-pulse" />
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

        {!loading && !error && data && !data.hasRoadmap && (
          <RoadmapEmptyState onGenerate={() => void handleGenerate()} generating={saving} failed={generateFailed} />
        )}

        {!loading && !error && data?.hasRoadmap && (
          <ol aria-busy={saving} className={`flex flex-col gap-6 ${saving ? 'opacity-70' : ''}`}>
            {days.map((day) => (
              <li key={day.date} className="flex flex-col gap-2.5">
                <h3 className="text-sm font-semibold text-ink">{dayHeading(day.date)}</h3>

                {day.restDay ? (
                  <div className="bg-surface-muted rounded-modal px-5 py-4 border border-line-soft text-sm text-ink-muted">
                    {MISSION_COPY.restDay}. {MISSION_COPY.restBody}
                  </div>
                ) : day.tasks.length === 0 ? (
                  <div className="bg-white rounded-modal px-5 py-4 border border-dashed border-line-strong text-sm text-ink-muted">
                    {MISSION_COPY.nothingQueued} Add tasks to your{' '}
                    <Link href="/roadmap" className="font-semibold text-brand-strong underline">
                      roadmap
                    </Link>
                    .
                  </div>
                ) : (
                  <ul className="flex flex-col gap-2.5">
                    {day.tasks.map((task) => {
                      const idx = order.indexOf(task.roadmapTaskId);
                      return (
                        <li
                          key={task.roadmapTaskId}
                          draggable={canReorder && !saving}
                          onDragStart={() => setDragId(task.roadmapTaskId)}
                          onDragOver={(e) => canReorder && e.preventDefault()}
                          onDrop={() => drop(task.roadmapTaskId)}
                          onDragEnd={() => setDragId(null)}
                          className={`bg-white rounded-modal px-5 py-4 border shadow-card flex items-center gap-3 ${
                            dragId === task.roadmapTaskId ? 'border-brand-strong opacity-60' : 'border-line-soft'
                          }`}
                        >
                          {canReorder && <GripVertical className="w-4 h-4 text-ink-subtle shrink-0 cursor-grab" aria-hidden="true" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-ink">{task.title}</p>
                            <div className="flex items-center gap-2 flex-wrap mt-2">
                              {task.milestone && <MilestoneChip milestone={task.milestone} />}
                              <span className="inline-flex items-center gap-1.5 bg-surface-muted text-ink-muted text-xs font-medium px-3 py-1 rounded-full">
                                <Clock className="w-3 h-3" aria-hidden="true" />
                                {task.effort}
                              </span>
                              {task.carriedOver && (
                                <span className="bg-warning-100 text-warning-800 text-xs font-medium px-3 py-1 rounded-full">Carried over</span>
                              )}
                            </div>
                          </div>
                          {canReorder && (
                            <div className="flex flex-col shrink-0">
                              <button
                                type="button"
                                aria-label={`Move up: ${task.title}`}
                                disabled={idx === 0 || saving}
                                onClick={() => move(task.roadmapTaskId, -1)}
                                className="p-1 rounded-input text-ink-muted hover:text-ink hover:bg-surface-muted disabled:opacity-30 cursor-pointer disabled:cursor-default"
                              >
                                <ArrowUp className="w-4 h-4" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                aria-label={`Move down: ${task.title}`}
                                disabled={idx === order.length - 1 || saving}
                                onClick={() => move(task.roadmapTaskId, 1)}
                                className="p-1 rounded-input text-ink-muted hover:text-ink hover:bg-surface-muted disabled:opacity-30 cursor-pointer disabled:cursor-default"
                              >
                                <ArrowDown className="w-4 h-4" aria-hidden="true" />
                              </button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
    </main>
  );
}
