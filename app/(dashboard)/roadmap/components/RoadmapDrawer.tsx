'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { X, Calendar, User, CheckCircle2, Circle, Plus, Trash2, MessageSquare, Link2 } from 'lucide-react';
import { personLabel, type RoadmapMilestone, type RoadmapTask } from '@/hooks/useRoadmapApi';
import type { BreakdownState } from '@/hooks/useMilestoneBreakdown';
import type { TeamMember } from '@/lib/api/members';
import { PersonSelect } from '@/components/roadmap/person-select';
import { BreakdownButton } from '@/components/roadmap/breakdown-button';
import { CommentThread } from '@/components/roadmap/comment-thread';
import { OverdueChip, ReplannedChip } from '@/components/roadmap/milestone-chips';

type MilestonePatch = { title?: string; description?: string | null; status?: string; due_on?: string | null; owner_id?: string | null };
type TaskPatch = { status?: string; assignee_id?: string | null; due_on?: string | null };

interface RoadmapDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  milestone?: RoadmapMilestone | null;
  /** Every task in the roadmap, to name what a task is blocked by. */
  allTasks: RoadmapTask[];
  members: TeamMember[];
  /** Founders and team members edit; everyone else reads and comments. */
  canEdit: boolean;
  breakdown?: BreakdownState;
  onBreakdown: (milestoneId: string) => void;
  /** Task ids the AI just appended, highlighted until dismissed. */
  highlightedTaskIds: Set<string>;
  /** Open this task's comment thread on arrival (notification deep link). */
  focusTaskId?: string | null;
  onCreateTask: (milestoneId: string, title: string) => Promise<unknown>;
  onUpdateTask: (id: string, patch: TaskPatch) => Promise<unknown>;
  onDeleteTask: (id: string) => Promise<unknown>;
  onUpdateMilestone: (id: string, patch: MilestonePatch) => Promise<unknown>;
  onDeleteMilestone: (id: string) => Promise<unknown>;
}

// FE milestone status ('pending'|'completed'|'overdue', derived) → the settable
// API status. 'overdue' is backend-derived and never sent, so it isn't offered.
const STATUS_OPTIONS: { label: string; api: string; fe: string }[] = [
  { label: 'Pending', api: 'todo', fe: 'pending' },
  { label: 'Completed', api: 'done', fe: 'completed' },
];

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function RoadmapDrawer(props: RoadmapDrawerProps) {
  const { isOpen, milestone } = props;
  if (!isOpen || !milestone) return null;
  // Keyed so every milestone starts with fresh local state (inputs, open threads).
  return <DrawerBody key={milestone.id} {...props} milestone={milestone} />;
}

function DrawerBody({
  onClose,
  milestone,
  allTasks,
  members,
  canEdit,
  breakdown,
  onBreakdown,
  highlightedTaskIds,
  focusTaskId,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onUpdateMilestone,
  onDeleteMilestone,
}: RoadmapDrawerProps & { milestone: RoadmapMilestone }) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openThreads, setOpenThreads] = useState<Set<string>>(() => new Set(focusTaskId ? [focusTaskId] : []));
  const [title, setTitle] = useState(milestone.title);
  const [description, setDescription] = useState(milestone.description ?? '');
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<Element | null>(null);

  // Dialog behaviour: focus in on open, back to the opener on close, Esc closes, Tab stays inside.
  useEffect(() => {
    returnFocus.current = document.activeElement;
    closeRef.current?.focus();
    const opener = returnFocus.current;
    if (focusTaskId) document.getElementById(`task-${focusTaskId}`)?.scrollIntoView?.({ block: 'center' });
    return () => {
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on open
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab' || !panelRef.current) return;
    const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const emailById = new Map(members.map((m) => [m.user_id, m.email]));
  const taskById = new Map(allTasks.map((t) => [t.id, t]));

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
    const t = newTaskTitle.trim();
    if (!t) return;
    await run(async () => {
      await onCreateTask(milestone.id, t);
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

  const saveTitle = () => {
    const t = title.trim();
    if (!t) {
      setTitle(milestone.title);
      return;
    }
    if (t !== milestone.title) void run(() => onUpdateMilestone(milestone.id, { title: t }));
  };
  const saveDescription = () => {
    const d = description.trim();
    if (d !== (milestone.description ?? '')) void run(() => onUpdateMilestone(milestone.id, { description: d || null }));
  };

  const toggleThread = (id: string) =>
    setOpenThreads((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const blocked = milestone.tasks.filter((t) => (t.dependsOn?.length ?? 0) > 0);
  const labelCls = 'flex items-center gap-2 text-ink-muted';

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-50 transition-opacity backdrop-blur-[1px]" onClick={onClose} aria-hidden="true" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="roadmap-drawer-title"
        onKeyDown={onKeyDown}
        className="fixed inset-y-0 right-0 w-full md:w-[440px] bg-white shadow-accent z-50 flex flex-col border-l border-line-soft"
      >
        <div className="flex items-start justify-between p-6 border-b border-line-soft gap-3">
          <div className="min-w-0 flex flex-col gap-2">
            <h2 id="roadmap-drawer-title" className="text-lg font-bold text-ink tracking-tight break-words">
              {milestone.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {milestone.status === 'overdue' && <OverdueChip />}
              {milestone.replanned && <ReplannedChip replanned={milestone.replanned} />}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {canEdit && (
              <button
                type="button"
                onClick={removeMilestone}
                disabled={busy}
                className="p-2 text-ink-soft hover:text-danger-text hover:bg-danger-wash rounded-full transition-colors disabled:opacity-40"
                aria-label="Delete milestone"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="p-2 -mr-2 text-ink-soft hover:bg-surface-muted rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            {canEdit && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ms-title" className="text-xs font-bold text-ink-muted">Title</label>
                <input
                  id="ms-title"
                  value={title}
                  maxLength={200}
                  disabled={busy}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                  }}
                  className="border border-line-strong rounded-input px-3 py-2 text-sm focus:outline-none focus:border-line-focus focus:ring-1 focus:ring-line-focus disabled:opacity-60"
                />
              </div>
            )}
            {(canEdit || milestone.description) && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="ms-desc" className="text-xs font-bold text-ink-muted">Details</label>
                {canEdit ? (
                  <textarea
                    id="ms-desc"
                    value={description}
                    rows={3}
                    disabled={busy}
                    placeholder="What does done look like?"
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={saveDescription}
                    className="border border-line-strong rounded-input px-3 py-2 text-sm focus:outline-none focus:border-line-focus focus:ring-1 focus:ring-line-focus placeholder:text-ink-subtle disabled:opacity-60"
                  />
                ) : (
                  <p className="text-sm text-ink whitespace-pre-wrap">{milestone.description}</p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <div className={labelCls}>
                <Calendar className="w-4 h-4" aria-hidden="true" />
                <span>Due Date</span>
              </div>
              {canEdit ? (
                <input
                  type="date"
                  aria-label="Milestone due date"
                  value={milestone.dueOn}
                  disabled={busy}
                  onChange={(e) => run(() => onUpdateMilestone(milestone.id, { due_on: e.target.value || null }))}
                  className="bg-surface-subtle border border-line-soft rounded-input px-2 py-1 text-sm font-semibold outline-none focus:border-brand-mid disabled:opacity-60"
                />
              ) : (
                <span className="font-semibold text-ink">{milestone.dueOn || 'No date'}</span>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className={labelCls}>
                <User className="w-4 h-4" aria-hidden="true" />
                <span>Owner</span>
              </div>
              {canEdit ? (
                <PersonSelect
                  label="Milestone owner"
                  value={milestone.owner?.id ?? null}
                  members={members}
                  disabled={busy}
                  fallbackLabel={personLabel(milestone.owner, emailById)}
                  onChange={(id) => run(() => onUpdateMilestone(milestone.id, { owner_id: id }))}
                />
              ) : (
                <span className="font-semibold text-ink">{personLabel(milestone.owner, emailById)}</span>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className={labelCls}>
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>Status</span>
              </div>
              {canEdit ? (
                <select
                  aria-label="Milestone status"
                  className="bg-surface-subtle border border-line-soft rounded-input px-2 py-1 text-sm font-semibold outline-none disabled:opacity-60"
                  value={milestone.status === 'completed' ? 'completed' : 'pending'}
                  disabled={busy}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.fe} value={o.fe}>{o.label}</option>
                  ))}
                </select>
              ) : (
                <span className="font-semibold text-ink">
                  {milestone.status === 'completed' ? 'Completed' : milestone.status === 'overdue' ? 'Overdue' : 'Pending'}
                </span>
              )}
            </div>
          </div>

          <div className="h-px bg-line-soft w-full" />

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold text-ink text-sm">Tasks</h3>
              <span className="text-xs font-semibold text-ink-muted">{progressPercent}%</span>
            </div>

            <div className="w-full h-1.5 bg-line-soft rounded-full overflow-hidden" role="progressbar" aria-label="Milestone progress" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full bg-brand-mid transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>

            {canEdit && <BreakdownButton state={breakdown} onRun={() => onBreakdown(milestone.id)} />}

            <ul className="flex flex-col gap-3 mt-1">
              {milestone.tasks.map((task) => {
                const done = task.status === 'done';
                const fresh = highlightedTaskIds.has(task.id);
                const threadOpen = openThreads.has(task.id);
                return (
                  <li
                    key={task.id}
                    id={`task-${task.id}`}
                    data-testid={fresh ? 'task-new' : undefined}
                    className={`flex flex-col gap-2 p-3 rounded-card border group ${fresh ? 'border-brand-mid bg-brand-tint' : 'border-line-soft bg-surface-ghost'}`}
                  >
                    <div className="flex items-start gap-3">
                      {canEdit ? (
                        <button
                          type="button"
                          onClick={() => toggleTask(task.id, done)}
                          disabled={busy}
                          className="mt-0.5 text-accent-600 disabled:opacity-50"
                          aria-label={done ? `Mark "${task.title}" not done` : `Mark "${task.title}" done`}
                        >
                          {done ? <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> : <Circle className="w-4 h-4" aria-hidden="true" />}
                        </button>
                      ) : (
                        <span className="mt-0.5 text-accent-600" aria-hidden="true">
                          {done ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                        </span>
                      )}
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <span className={`text-sm font-semibold ${done ? 'text-ink-subtle line-through' : 'text-ink'}`}>
                          {task.title}
                          {fresh && <span className="ml-2 text-[10px] font-bold text-brand-mid no-underline">New</span>}
                        </span>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-ink-soft">
                          <span>Effort: {task.effort}</span>
                          {task.status === 'overdue' && <span className="text-danger-600 font-bold">Overdue</span>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {canEdit ? (
                            <>
                              <PersonSelect
                                label={`Assignee for ${task.title}`}
                                value={task.assignee?.id ?? null}
                                members={members}
                                disabled={busy}
                                fallbackLabel={personLabel(task.assignee, emailById)}
                                onChange={(id) => run(() => onUpdateTask(task.id, { assignee_id: id }))}
                              />
                              <input
                                type="date"
                                aria-label={`Due date for ${task.title}`}
                                value={task.dueOn}
                                disabled={busy}
                                onChange={(e) => run(() => onUpdateTask(task.id, { due_on: e.target.value || null }))}
                                className="bg-surface-subtle border border-line-soft rounded-input px-2 py-1 text-xs font-semibold outline-none focus:border-brand-mid disabled:opacity-60"
                              />
                            </>
                          ) : (
                            <span className="text-[11px] text-ink-muted">
                              {personLabel(task.assignee, emailById)}
                              {task.dueOn ? `, due ${task.dueOn}` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => removeTask(task.id)}
                          disabled={busy}
                          className="p-1 rounded-input text-ink-soft hover:text-danger-text hover:bg-danger-wash md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition disabled:opacity-30"
                          aria-label={`Delete task "${task.title}"`}
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleThread(task.id)}
                      aria-expanded={threadOpen}
                      className="flex w-fit items-center gap-1 text-[11px] font-semibold text-ink-muted hover:text-ink pl-7"
                    >
                      <MessageSquare className="w-3 h-3" aria-hidden="true" />
                      {threadOpen ? 'Hide comments' : 'Comments'}
                    </button>
                    {threadOpen && (
                      <div className="pl-7">
                        <CommentThread entityType="roadmap_task" entityId={task.id} members={members} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {totalTasks === 0 && (
              <p className="text-xs text-ink-subtle px-1">
                {canEdit ? 'No tasks yet. Add the first one below, or ask AI to break this down.' : 'No tasks yet.'}
              </p>
            )}

            {canEdit && (
              <form onSubmit={addTask} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Add a task…"
                  aria-label="New task title"
                  disabled={busy}
                  className="flex-1 border border-line-strong rounded-input px-3 py-2 text-sm focus:outline-none focus:border-line-focus focus:ring-1 focus:ring-line-focus placeholder:text-ink-subtle disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={busy || !newTaskTitle.trim()}
                  className="p-2 rounded-input bg-brand-strong hover:bg-brand-rail text-white disabled:opacity-40 transition-colors shrink-0"
                  aria-label="Add task"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                </button>
              </form>
            )}

            {error && (
              <p role="alert" className="text-xs text-danger-text">
                {error}
              </p>
            )}
          </div>

          <div className="h-px bg-line-soft w-full" />

          <section aria-label="Dependencies" className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-ink text-sm flex items-center gap-1.5">
                <Link2 className="w-4 h-4" aria-hidden="true" />
                Dependencies
              </h3>
              <Link href="/roadmap/dependencies" className="text-xs font-semibold text-accent-700 hover:underline">
                Manage
              </Link>
            </div>
            {blocked.length === 0 ? (
              <p className="text-xs text-ink-subtle">No task in this milestone is blocked by another.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {blocked.map((t) => (
                  <li key={t.id} className="text-xs text-ink">
                    <span className="font-semibold">{t.title}</span>
                    <span className="text-ink-soft"> is blocked by </span>
                    <span className="font-semibold">
                      {(t.dependsOn ?? []).map((id) => taskById.get(id)?.title ?? 'a removed task').join(', ')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="h-px bg-line-soft w-full" />

          <div className="flex flex-col gap-3">
            <h3 className="font-bold text-ink text-sm">Comments</h3>
            <CommentThread entityType="roadmap_milestone" entityId={milestone.id} members={members} />
          </div>
        </div>

        {canEdit && (
          <div className="p-6 border-t border-line-soft bg-surface-ghost">
            <button
              type="button"
              onClick={() => setStatus('completed')}
              disabled={busy || milestone.status === 'completed'}
              className="w-full bg-brand-strong hover:bg-brand-rail disabled:opacity-50 text-white font-bold py-3 rounded-card transition-colors shadow-card"
            >
              {milestone.status === 'completed' ? 'Milestone Complete' : 'Mark Milestone Complete'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
