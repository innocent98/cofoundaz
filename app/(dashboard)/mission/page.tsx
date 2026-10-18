'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Flame, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useMissionApi } from '@/hooks/useMissionApi';
import { MISSION_COPY } from '@/components/mission/mission-copy';
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
    generateRoadmap,
    refetch,
  } = useMissionApi();

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
        colors: ['#2D5A3F', '#D89A6E', '#9C5B34', '#B5D4C0'],
      });
    }
  }, [hasOpen, allCompleted]);

  const handleToggle = (id: string) => {
    toggleTask(id);
    toast.success('Nice. Mission progress saved.');
  };

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
    <form onSubmit={handleAddTask} className="bg-white rounded-modal p-4 border border-[#183B28] shadow-card flex items-center gap-3">
      <input
        type="text"
        autoFocus
        aria-label="New task title"
        value={newTaskTitle}
        onChange={(e) => setNewTaskTitle(e.target.value)}
        placeholder="Add your own task..."
        className="flex-1 min-w-0 bg-transparent text-sm text-[#1E2923] placeholder-[#8E9B90] outline-none"
      />
      <button
        type="submit"
        disabled={!newTaskTitle.trim()}
        className="bg-[#9C5B34] text-white px-4 py-1.5 rounded text-sm font-semibold disabled:opacity-50 cursor-pointer"
      >
        Add
      </button>
      <button type="button" onClick={() => setIsAddingTask(false)} className="text-[#617065] text-sm hover:text-[#1E2923] cursor-pointer">
        Cancel
      </button>
    </form>
  ) : (
    <button
      type="button"
      onClick={() => setIsAddingTask(true)}
      className="w-full py-4 border-2 border-dashed border-[#D5DDD6] hover:border-[#183B28] rounded-modal text-xs font-semibold text-[#556358] hover:text-[#183B28] transition-colors bg-white/40 hover:bg-white text-center mt-1 cursor-pointer"
    >
      + Add a task
    </button>
  );

  const roadmapLink = (
    <div className="flex justify-center pt-2 pb-6">
      <Link href="/roadmap" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#183B28] hover:underline">
        <span>View roadmap</span>
        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
      </Link>
    </div>
  );

  const assignedSection = assigned.length > 0 && (
    <section aria-labelledby="assigned-heading" className="flex flex-col gap-3">
      <h3 id="assigned-heading" className="text-sm font-semibold text-[#1E2923]">
        Assigned to you
      </h3>
      <ul className="flex flex-col gap-2.5">
        {assigned.map((a) => (
          <li key={a.roadmapTaskId} className="bg-white rounded-modal px-5 py-4 border border-[#EBEBE6] shadow-card flex items-center justify-between gap-3 flex-wrap">
            <span className="text-sm font-semibold text-[#1E2923]">{a.title}</span>
            <span className="flex items-center gap-2 flex-wrap">
              {a.milestone && <MilestoneChip milestone={a.milestone} />}
              <span className="text-xs font-medium text-[#617065] bg-[#F5F5F0] px-3 py-1 rounded-full">{a.effort}</span>
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
      <div role="alert" className="bg-[#FDF2F2] border border-[#FAD7D7] rounded-modal p-6 flex flex-col items-start gap-3">
        <p className="text-sm text-[#B0483B]">We couldn&apos;t load today&apos;s mission.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="px-4 py-1.5 rounded-card border border-[#D5DDD6] bg-white text-xs font-semibold text-[#1E2923] cursor-pointer"
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
        <div className="w-16 h-16 bg-[#EAF2ED] rounded-full flex items-center justify-center mb-2">
          <span className="text-3xl" aria-hidden="true">🎉</span>
        </div>
        <h3 className="text-3xl font-display font-bold text-[#1E2923]">{MISSION_COPY.complete}</h3>
        <p className="text-lg text-[#617065]">{MISSION_COPY.completeBody}</p>
      </div>
    );
  } else if (state === 'empty') {
    body = (
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-modal p-8 border border-[#EBEBE6] shadow-card text-center flex flex-col items-center gap-3">
          <p className="text-base font-semibold text-[#1E2923]">
            {emptyReason === 'weekend_off' ? MISSION_COPY.weekendOff : MISSION_COPY.allCaughtUp}
          </p>
          {emptyReason === 'weekend_off' && (
            <Link href="/mission/settings" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#183B28] hover:underline">
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
              onUp={() => void reprioritizeUp(task.id)}
              onDown={() => void reprioritizeDown(task.id)}
              onSnooze={() => {
                snoozeTask(task.id);
                toast.success(MISSION_COPY.snoozeToast);
              }}
              onReject={(reason) => {
                rejectTask(task.id, reason);
                toast.success(MISSION_COPY.rejectToast);
              }}
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
          <h2 className="text-3xl font-display font-semibold text-[#1E2923] tracking-tight">Today&apos;s Mission</h2>
          <p className="text-sm text-[#768478] mt-1 font-medium">{headerDate(missionDate)}</p>
        </div>

        {streak > 0 && (
          <div className="flex items-center gap-1.5 bg-[#F7EEDC] text-[#8A5330] px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-card shrink-0">
            <Flame className="w-4 h-4 fill-[#D89A6E] text-[#D89A6E]" aria-hidden="true" />
            <span>{streak}-day streak</span>
          </div>
        )}
      </div>

      {body}
      {isReady && state !== 'no_roadmap' && assignedSection}
    </main>
  );
}
