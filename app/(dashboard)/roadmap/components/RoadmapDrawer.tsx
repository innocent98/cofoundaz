'use client';

import React, { useState } from 'react';
import { X, Calendar, User, CheckCircle2, Circle, Plus, Trash2 } from 'lucide-react';
import { RoadmapMilestone } from '@/hooks/useRoadmapApi';

interface RoadmapDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  milestone?: RoadmapMilestone | null;
  onCreateTask: (milestoneId: string, title: string) => Promise<unknown>;
  onUpdateTask: (id: string, patch: { status?: string }) => Promise<unknown>;
  onDeleteTask: (id: string) => Promise<unknown>;
  onUpdateMilestone: (id: string, patch: { status?: string }) => Promise<unknown>;
  onDeleteMilestone: (id: string) => Promise<unknown>;
}

// FE milestone status ('pending'|'completed'|'overdue', derived) → the settable
// API status. 'overdue' is backend-derived and never sent, so it isn't offered.
const STATUS_OPTIONS: { label: string; api: string; fe: string }[] = [
  { label: 'Pending', api: 'todo', fe: 'pending' },
  { label: 'Completed', api: 'done', fe: 'completed' },
];

export function RoadmapDrawer({
  isOpen,
  onClose,
  milestone,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onUpdateMilestone,
  onDeleteMilestone,
}: RoadmapDrawerProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !milestone) return null;

  const completedTasks = milestone.tasks.filter((t) => t.status === 'done').length;
  const totalTasks = milestone.tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : milestone.progress;

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch {
      setError('Could not save that change. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const toggleTask = (taskId: string, done: boolean) =>
    run(() => onUpdateTask(taskId, { status: done ? 'todo' : 'done' }));

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;
    await run(async () => {
      await onCreateTask(milestone.id, title);
      setNewTaskTitle('');
    });
  };

  const removeTask = (taskId: string) => {
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    return run(() => onDeleteTask(taskId));
  };

  const setStatus = (fe: string) => {
    const opt = STATUS_OPTIONS.find((o) => o.fe === fe);
    if (opt) run(() => onUpdateMilestone(milestone.id, { status: opt.api }));
  };

  const removeMilestone = () => {
    if (!window.confirm(`Delete "${milestone.title}" and all its tasks? This cannot be undone.`)) return;
    run(async () => {
      await onDeleteMilestone(milestone.id);
      onClose();
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-50 transition-opacity backdrop-blur-[1px]" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-white shadow-accent z-50 transform transition-transform duration-300 flex flex-col border-l border-[#EBEBE6]">
        <div className="flex items-center justify-between p-6 border-b border-[#EBEBE6]">
          <h2 className="text-lg font-bold text-[#1E2923] tracking-tight truncate pr-4">{milestone.title}</h2>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={removeMilestone}
              disabled={busy}
              className="p-2 text-[#768478] hover:text-[#A34B4B] hover:bg-[#FBEBEB] rounded-full transition-colors disabled:opacity-40"
              aria-label="Delete milestone"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 -mr-2 text-[#768478] hover:bg-[#F5F5F0] rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-[#617065]">
                <Calendar className="w-4 h-4" />
                <span>Due Date</span>
              </div>
              <span className="font-semibold text-[#1E2923]">{milestone.dueOn || '—'}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-[#617065]">
                <User className="w-4 h-4" />
                <span>Owner</span>
              </div>
              <span className="font-semibold text-[#1E2923]">{milestone.ownerId}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-[#617065]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Status</span>
              </div>
              <select
                className="bg-[#F7F7F5] border border-[#EBEBE6] rounded-input px-2 py-1 text-sm font-semibold outline-none disabled:opacity-60"
                value={milestone.status === 'completed' ? 'completed' : 'pending'}
                disabled={busy}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.fe} value={o.fe}>{o.label}</option>
                ))}
                {milestone.status === 'overdue' && <option value="pending">Overdue</option>}
              </select>
            </div>
          </div>

          <div className="h-px bg-[#EBEBE6] w-full" />

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#1E2923] text-sm">Tasks</h3>
              <span className="text-xs font-semibold text-[#617065]">{progressPercent}%</span>
            </div>

            <div className="w-full h-1.5 bg-[#EBEBE6] rounded-full overflow-hidden">
              <div className="h-full bg-[#2D5A3F] transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>

            <div className="flex flex-col gap-3 mt-2">
              {milestone.tasks.map((task) => {
                const done = task.status === 'done';
                return (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-card border border-[#EBEBE6] bg-[#FAFAFA] group">
                    <button
                      onClick={() => toggleTask(task.id, done)}
                      disabled={busy}
                      className="mt-0.5 text-copper-600 disabled:opacity-50"
                      aria-label={done ? 'Mark task not done' : 'Mark task done'}
                    >
                      {done ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                    </button>
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <span className={`text-sm font-semibold ${done ? 'text-[#8E9B90] line-through' : 'text-[#1E2923]'}`}>
                        {task.title}
                      </span>
                      <div className="flex items-center gap-3 text-[11px] font-medium text-[#768478] mt-1">
                        <span>Effort: {task.effort}</span>
                        {task.dependsOn && task.dependsOn.length > 0 && (
                          <span className="text-[#9C5B34]">Depends on: {task.dependsOn.length}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeTask(task.id)}
                      disabled={busy}
                      className="p-1 rounded-input text-[#768478] hover:text-[#A34B4B] hover:bg-[#FBEBEB] opacity-0 group-hover:opacity-100 transition disabled:opacity-30"
                      aria-label="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {totalTasks === 0 && (
                <p className="text-xs text-[#8E9B90] px-1">No tasks yet — add the first one below.</p>
              )}

              <form onSubmit={addTask} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Add a task…"
                  disabled={busy}
                  className="flex-1 border border-[#D5DDD6] rounded-input px-3 py-2 text-sm focus:outline-none focus:border-[#4D6D58] focus:ring-1 focus:ring-[#4D6D58] placeholder:text-[#A3B899] disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={busy || !newTaskTitle.trim()}
                  className="p-2 rounded-input bg-[#183B28] hover:bg-[#11291C] text-white disabled:opacity-40 transition-colors shrink-0"
                  aria-label="Add task"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            </div>

            {error && <p className="text-xs text-[#A34B4B]">{error}</p>}
          </div>
        </div>

        <div className="p-6 border-t border-[#EBEBE6] bg-[#FAFAFA]">
          <button
            onClick={() => setStatus('completed')}
            disabled={busy || milestone.status === 'completed'}
            className="w-full bg-[#183B28] hover:bg-[#11291C] disabled:opacity-50 text-white font-bold py-3 rounded-card transition-colors shadow-card"
          >
            {milestone.status === 'completed' ? 'Milestone Complete' : 'Mark Milestone Complete'}
          </button>
        </div>
      </div>
    </>
  );
}
