'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Flame, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useMissionApi } from '@/hooks/useMissionApi';
import { useWorkspace } from '@/components/workspace-context';
import { MISSION_COPY, SAVE_FAILED_COPY } from '@/components/mission/mission-copy';
import { MissionLoading } from '@/components/mission/mission-loading';
import { RoadmapEmptyState } from '@/components/mission/roadmap-empty-state';
import { MissionTaskCard } from '@/components/mission/mission-task-card';
import { MilestoneChip } from '@/components/mission/milestone-chip';

function headerDate(missionDate: string | null): string {
  const d = missionDate ? new Date(`${missionDate}T00:00:00`) : new Date();
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function MissionTodayPage() {
  const {
    isReady,
    state,
    streak,
    missionDate,
    emptyReason,
    assigned,
    generating,
    todayTasks,
    allCompleted,
    toggleTask,
    addTask,
    snoozeTask,
    rejectTask,
    reprioritizeUp,
    reprioritizeDown,
    completeAssigned,
    generateRoadmap,
    refetch,
  } = useMissionApi();

  const { role } = useWorkspace();
  const canCompleteAssigned = role === 'founder' || role === 'team_member';
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [generateFailed, setGenerateFailed] = useState(false);

  // Confetti when the founder finishes the mission in this visit, not on every reload of a finished day.
  const wasOpen = useRef(false);
  const hasOpen = todayTasks.some((t) => t.status === 'pending');
  useEffect(() => {
    if (hasOpen) wasOpen.current = true;
    if (allCompleted && wasOpen.current) {
      wasOpen.current = false;
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2D5A3F', '#D89A6E', '#9C5B34', '#B5D4C0'], // colour-ok: canvas-confetti paints on a <canvas>; it cannot resolve CSS variables
      });
    }
  }, [hasOpen, allCompleted]);

  // Toast success only once the server confirmed the change; the hook has already
  // reverted the optimistic update when it did not.
  const confirmSaved = async (action: Promise<boolean>, successMessage?: string) => {
    if (await action) {
      if (successMessage) toast.success(successMessage);
    } else {
      toast.error(SAVE_FAILED_COPY);
    }
  };

  const handleToggle = (id: string) => confirmSaved(toggleTask(id), 'Nice. Mission progress saved.');

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;
    if (await addTask(title)) {
      setNewTaskTitle('');
      setIsAddingTask(false);
      toast.success('Task added to mission.');
    } else {
      toast.error("Couldn't add that task. Try again.");
    }
  };

  const handleGenerate = async () => {
    setGenerateFailed(false);
    if (!(await generateRoadmap())) setGenerateFailed(true);
  };

  const addTaskControl = isAddingTask ? (
    <form onSubmit={handleAddTask} className="bg-white rounded-modal p-4 border border-brand-strong shadow-card flex items-center gap-3">
      <input
        type="text"
        autoFocus
        aria-label="New task title"
        value={newTaskTitle}
        onChange={(e) => setNewTaskTitle(e.target.value)}
        placeholder="Add your own task..."
        className="flex-1 min-w-0 bg-transparent text-sm text-ink placeholder-ink-subtle outline-none"
      />
      <button
        type="submit"
        disabled={!newTaskTitle.trim()}
        className="bg-accent-600 text-white px-4 py-1.5 rounded text-sm font-semibold disabled:opacity-50 cursor-pointer"
      >
        Add
      </button>
      <button type="button" onClick={() => setIsAddingTask(false)} className="text-ink-muted text-sm hover:text-ink cursor-pointer">
        Cancel
      </button>
    </form>
  ) : (
    <button
      type="button"
      onClick={() => setIsAddingTask(true)}
      className="w-full py-4 border-2 border-dashed border-line-strong hover:border-brand-strong rounded-modal text-xs font-semibold text-ink-body hover:text-brand-strong transition-colors bg-white/40 hover:bg-white text-center mt-1 cursor-pointer"
    >
      + Add a task
    </button>
  );

  const roadmapLink = (
    <div className="flex justify-center pt-2 pb-6">
      <Link href="/roadmap" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-strong hover:underline">
        <span>View roadmap</span>
        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
      </Link>
    </div>
  );

  const assignedSection = assigned.length > 0 && (
    <section aria-labelledby="assigned-heading" className="flex flex-col gap-3">
      <h3 id="assigned-heading" className="text-sm font-semibold text-ink">
        Assigned to you
      </h3>
      <ul className="flex flex-col gap-2.5">
        {assigned.map((a) => (
          <li key={a.roadmapTaskId} className="bg-white rounded-modal px-5 py-4 border border-line-soft shadow-card flex items-center justify-between gap-3 flex-wrap">
            <span className="flex items-center gap-3 min-w-0">
              {canCompleteAssigned && (
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={false}
                  aria-label={`Complete task: ${a.title}`}
                  onClick={() => void confirmSaved(completeAssigned(a.roadmapTaskId), 'Nice. Mission progress saved.')}
                  className="w-6 h-6 rounded-input border-2 border-neutral-xc5cfc7 hover:border-brand-strong bg-white cursor-pointer shrink-0"
                />
              )}
              <span className="text-sm font-semibold text-ink">{a.title}</span>
            </span>
            <span className="flex items-center gap-2 flex-wrap">
              {a.milestone && <MilestoneChip milestone={a.milestone} />}
              <span className="text-xs font-medium text-ink-muted bg-surface-muted px-3 py-1 rounded-full">{a.effort}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );

  let body: React.ReactNode;
  if (!isReady || state === 'loading') {
    body = <MissionLoading />;
  } else if (state === 'error') {
    body = (
      <div role="alert" className="bg-danger-tint border border-danger-xfad7d7 rounded-modal p-6 flex flex-col items-start gap-3">
        <p className="text-sm text-danger-600">We couldn&apos;t load today&apos;s mission.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="px-4 py-1.5 rounded-card border border-line-strong bg-white text-xs font-semibold text-ink cursor-pointer"
        >
          Try again
        </button>
      </div>
    );
  } else if (state === 'no_roadmap') {
    body = <RoadmapEmptyState onGenerate={() => void handleGenerate()} generating={generating} failed={generateFailed} />;
  } else if (allCompleted) {
    body = (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-brand-tint rounded-full flex items-center justify-center mb-2">
          <span className="text-3xl" aria-hidden="true">🎉</span>
        </div>
        <h3 className="text-3xl font-display font-bold text-ink">{MISSION_COPY.complete}</h3>
        <p className="text-lg text-ink-muted">{MISSION_COPY.completeBody}</p>
      </div>
    );
  } else if (state === 'empty') {
    body = (
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-modal p-8 border border-line-soft shadow-card text-center flex flex-col items-center gap-3">
          <p className="text-base font-semibold text-ink">
            {emptyReason === 'weekend_off' ? MISSION_COPY.weekendOff : MISSION_COPY.allCaughtUp}
          </p>
          {emptyReason === 'weekend_off' && (
            <Link href="/mission/settings" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-strong hover:underline">
              Mission settings <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>
        {addTaskControl}
        {roadmapLink}
      </div>
    );
  } else {
    body = (
      <div className="flex flex-col gap-4">
        <ul className="flex flex-col gap-4">
          {todayTasks.map((task, index) => (
            <MissionTaskCard
              key={task.id}
              task={task}
              first={index === 0}
              last={index === todayTasks.length - 1}
              onToggle={() => handleToggle(task.id)}
              onUp={() => void confirmSaved(reprioritizeUp(task.id))}
              onDown={() => void confirmSaved(reprioritizeDown(task.id))}
              onSnooze={() => void confirmSaved(snoozeTask(task.id), MISSION_COPY.snoozeToast)}
              onReject={(reason) => void confirmSaved(rejectTask(task.id, reason), MISSION_COPY.rejectToast)}
            />
          ))}
        </ul>
        {addTaskControl}
        {roadmapLink}
      </div>
    );
  }

  return (
    <main className="p-4 md:p-8 max-w-4xl w-full mx-auto flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 pt-2">
        <div>
          <h2 className="text-3xl font-display font-semibold text-ink tracking-tight">Today&apos;s Mission</h2>
          <p className="text-sm text-ink-soft mt-1 font-medium">{headerDate(missionDate)}</p>
        </div>

        {streak > 0 && (
          <div className="flex items-center gap-1.5 bg-accent-xf7eedc text-accent-700 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-card shrink-0">
            <Flame className="w-4 h-4 fill-accent-500 text-accent-500" aria-hidden="true" />
            <span>{streak}-day streak</span>
          </div>
        )}
      </div>

      {body}
      {isReady && state !== 'no_roadmap' && assignedSection}
    </main>
  );
}
