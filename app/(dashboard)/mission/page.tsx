'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Flame, 
  MoreHorizontal, 
  Flag, 
  Clock, 
  ArrowRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { useMissionApi } from '@/hooks/useMissionApi';

export default function MissionTodayPage() {
  const {
    isReady,
    state,
    streak,
    todayTasks,
    allCompleted,
    toggleTask,
    addTask,
    snoozeTask,
    rejectTask,
    reprioritizeUp,
    reprioritizeDown
  } = useMissionApi();

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [rejectingTaskId, setRejectingTaskId] = useState<string | null>(null);
  
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Confetti effect on all complete
  useEffect(() => {
    if (isReady && allCompleted) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#2D5A3F', '#D89A6E', '#9C5B34', '#B5D4C0']
      });
    }
  }, [allCompleted, isReady]);

  const handleToggle = (id: string) => {
    toggleTask(id);
    const task = todayTasks.find(t => t.id === id);
    if (task && task.status === 'pending') {
      toast.success('Nice. Mission progress saved.');
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      addTask(newTaskTitle.trim());
      setNewTaskTitle('');
      setIsAddingTask(false);
      toast.success('Task added to mission.');
    }
  };

  const handleSnooze = (id: string) => {
    snoozeTask(id);
    setOpenMenuId(null);
    toast.success("Moved to tomorrow's mission.");
  };

  const handleRejectAction = (id: string, reason: string) => {
    rejectTask(id, reason);
    setRejectingTaskId(null);
    toast.success("Thanks — I'll calibrate.");
  };

  if (!isReady) return null;

  return (
    <main className="p-4 md:p-8 max-w-4xl w-full mx-auto flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 pt-2">
        <div>
          <h2 className="text-3xl font-display font-semibold text-[#1E2923] tracking-tight">
            Today&apos;s Mission
          </h2>
          <p className="text-sm text-[#768478] mt-1 font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>

        {streak > 0 && (
          <div className="flex items-center gap-1.5 bg-[#F7EEDC] text-[#8A5330] px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-card shrink-0">
            <Flame className="w-4 h-4 fill-[#D89A6E] text-[#D89A6E]" />
            <span>{streak}-day streak</span>
          </div>
        )}
      </div>

      {state === 'no_roadmap' ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-[#EAF2ED] rounded-full flex items-center justify-center mb-2">
            <Flag className="w-7 h-7 text-[#2D5A3F]" />
          </div>
          <h3 className="text-2xl md:text-3xl font-display font-bold text-[#1E2923]">Your mission comes from your roadmap</h3>
          <p className="text-base text-[#617065] max-w-md">
            Finish setting up your roadmap and your daily mission will start pulling the next best tasks from it.
          </p>
          <Link
            href="/roadmap"
            className="inline-flex items-center gap-1.5 bg-[#9C5B34] hover:bg-[#8A5330] text-white text-sm font-bold px-6 py-3 rounded-card transition-colors shadow-card"
          >
            <span>Go to your roadmap</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : allCompleted ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-16 h-16 bg-[#EAF2ED] rounded-full flex items-center justify-center mb-2">
            <span className="text-3xl">🎉</span>
          </div>
          <h3 className="text-3xl font-display font-bold text-[#1E2923]">Mission complete.</h3>
          <p className="text-lg text-[#617065]">That&apos;s what compounding looks like. See you tomorrow.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {todayTasks.sort((a,b) => a.order - b.order).map((task, index) => (
            <div
              key={task.id}
              className="relative bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card hover:border-[#D5DDD6] transition-all flex items-start gap-4"
            >
              <button
                onClick={() => handleToggle(task.id)}
                className={`w-6 h-6 rounded-input border-2 transition-all duration-300 flex items-center justify-center shrink-0 mt-0.5 ${
                  task.status === 'completed'
                    ? 'bg-[#183B28] border-[#183B28] text-white'
                    : 'border-[#C5CFC7] hover:border-[#183B28] bg-white'
                }`}
              >
                {task.status === 'completed' && <span className="text-xs font-bold">✓</span>}
              </button>

              <div className="flex-1 min-w-0">
                {rejectingTaskId === task.id ? (
                  <div className="py-2">
                    <p className="text-sm font-semibold text-[#1E2923] mb-3">Why is this not relevant?</p>
                    <div className="flex gap-2 flex-wrap">
                      {['Already done', 'Wrong priority', "Doesn't apply"].map(reason => (
                        <button
                          key={reason}
                          onClick={() => handleRejectAction(task.id, reason)}
                          className="px-3 py-1.5 rounded-full border border-[#D5DDD6] text-xs font-medium text-[#617065] hover:bg-[#F5F5F0] hover:text-[#1E2923] transition-colors"
                        >
                          {reason}
                        </button>
                      ))}
                      <button
                        onClick={() => setRejectingTaskId(null)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium text-[#8E9B90] hover:text-[#1E2923]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className={`font-semibold text-base leading-snug transition-all duration-300 ${
                          task.status === 'completed' ? 'line-through text-[#8E9B90]' : 'text-[#1E2923]'
                        }`}
                      >
                        {task.title}
                      </h3>
                      <div className="relative">
                        <button 
                          onClick={() => setOpenMenuId(openMenuId === task.id ? null : task.id)}
                          className="text-[#8E9B90] hover:text-[#1E2923] p-1 transition-colors shrink-0"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        
                        {/* Action Menu Popover */}
                        {openMenuId === task.id && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#EBEBE6] shadow-accent rounded-modal z-10 py-1 overflow-hidden">
                            <button
                              onClick={() => { reprioritizeUp(task.id); setOpenMenuId(null); }}
                              disabled={index === 0}
                              className="w-full text-left px-4 py-2 text-sm text-[#1E2923] hover:bg-[#F5F5F0] disabled:opacity-50 flex items-center justify-between"
                            >
                              Reprioritize Up <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => { reprioritizeDown(task.id); setOpenMenuId(null); }}
                              disabled={index === todayTasks.length - 1}
                              className="w-full text-left px-4 py-2 text-sm text-[#1E2923] hover:bg-[#F5F5F0] disabled:opacity-50 flex items-center justify-between border-b border-[#EBEBE6]"
                            >
                              Reprioritize Down <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleSnooze(task.id)}
                              className="w-full text-left px-4 py-2 text-sm text-[#1E2923] hover:bg-[#F5F5F0]"
                            >
                              Snooze to tomorrow
                            </button>
                            <button
                              onClick={() => {
                                setRejectingTaskId(task.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-[#9C5B34] hover:bg-[#F7EEDC]"
                            >
                              Not relevant
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {task.reason && (
                      <p className="text-xs text-[#617065] leading-relaxed mt-1 mb-3">
                        {task.reason}
                      </p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 bg-[#EAF2ED] text-[#2D5A3F] text-xs font-medium px-3 py-1 rounded-full">
                        <Flag className="w-3 h-3 fill-[#2D5A3F]" />
                        {task.tag}
                      </span>
                      <span className="inline-flex items-center gap-1.5 bg-[#F5F5F0] text-[#617065] text-xs font-medium px-3 py-1 rounded-full">
                        <Clock className="w-3 h-3" />
                        {task.effort}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}

          {isAddingTask ? (
            <form onSubmit={handleAddTask} className="bg-white rounded-modal p-4 border border-[#183B28] shadow-card flex items-center gap-3">
              <input
                type="text"
                autoFocus
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                placeholder="Add your own task..."
                className="flex-1 bg-transparent text-sm text-[#1E2923] placeholder-[#8E9B90] outline-none"
              />
              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="bg-[#9C5B34] text-white px-4 py-1.5 rounded text-sm font-semibold disabled:opacity-50"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsAddingTask(false)}
                className="text-[#617065] text-sm hover:text-[#1E2923]"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button 
              onClick={() => setIsAddingTask(true)}
              className="w-full py-4 border-2 border-dashed border-[#D5DDD6] hover:border-[#183B28] rounded-modal text-xs font-semibold text-[#556358] hover:text-[#183B28] transition-colors bg-white/40 hover:bg-white text-center mt-1"
            >
              + Add a task
            </button>
          )}

          <div className="flex justify-center pt-2 pb-6">
            <Link href="/roadmap" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#183B28] hover:underline">
              <span>View roadmap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
