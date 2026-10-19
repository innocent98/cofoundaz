'use client';

import React, { Suspense, useState } from 'react';
import { personLabel } from '@/hooks/useRoadmapApi';
import { useRoadmapBoard } from '@/hooks/useRoadmapBoard';
import { BoardDrawer } from '@/components/roadmap/board-drawer';
import { OverdueChip, ReplannedChip } from '@/components/roadmap/milestone-chips';
import { formatDue } from '@/lib/roadmap-format';
import { GripVertical } from 'lucide-react';

export default function KanbanPage() {
  return (
    <Suspense fallback={null}>
      <KanbanView />
    </Suspense>
  );
}

function KanbanView() {
  const board = useRoadmapBoard();
  const { phases, updateTask, loading, error, refetch, canEdit } = board;
  const [groupBy, setGroupBy] = useState<'Phase' | 'Status'>('Status');

  // Drag-and-drop: an optimistic taskId→status override that a drop applies
  // immediately, then reconciles when updateTask re-fetches the tree. dragOverCol
  // highlights the drop target; dndError surfaces a failed move (e.g. mentor 403).
  const [pending, setPending] = useState<Record<string, string>>({});
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [dndError, setDndError] = useState<string | null>(null);

  // Grouping logic for Status
  const statusColumns = [
    { id: 'todo', label: 'To Do' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'done', label: 'Done' }
  ];

  const allTasks = phases.flatMap((p) => p.milestones.flatMap((m) => m.tasks));
  // Effective status = the in-flight optimistic override, else the server value.
  const effStatus = (t: { id: string; status: string }) => pending[t.id] ?? t.status;

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverCol(null);
    if (!canEdit) return;
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    await moveTask(taskId, colId);
  };

  const moveTask = async (taskId: string, colId: string) => {
    const task = allTasks.find((t) => t.id === taskId);
    // An 'overdue' card lives in To Do, so a drop back onto To Do is still a move.
    if (!task || effStatus(task) === colId) return;
    setDndError(null);
    setPending((p) => ({ ...p, [taskId]: colId })); // optimistic
    try {
      await updateTask(taskId, { status: colId }); // PATCH + refetch = source of truth
    } catch {
      setDndError('Could not move that task, you may not have edit access.');
    } finally {
      setPending((p) => {
        const next = { ...p };
        delete next[taskId];
        return next;
      });
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6 h-full min-h-[calc(100vh-160px)]">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-display font-medium text-[#1E2923] tracking-tight">
            Kanban Board
          </h2>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#768478]">Group by:</span>
            <div className="flex items-center gap-1 bg-[#F5F5F0] p-1 rounded-card border border-[#EBEBE6]">
              {(['Status', 'Phase'] as const).map((g) => (
                <button
                  type="button"
                  key={g}
                  aria-pressed={groupBy === g}
                  onClick={() => setGroupBy(g)}
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all ${
                    groupBy === g
                      ? 'bg-white text-[#1E2923] font-bold shadow-card'
                      : 'bg-transparent text-[#768478] hover:text-[#1E2923]'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        {groupBy === 'Status' && canEdit && (
          <p className="text-xs text-[#8E9B90] -mt-2">Drag a task card between columns, or use the Move to menu on a card.</p>
        )}
        {loading && <p className="text-xs text-[#8E9B90]" aria-busy="true">Loading your tasks…</p>}
        {!loading && error && (
          <p role="alert" className="text-xs font-semibold text-[#B0483B]">
            Couldn&apos;t load your tasks.{' '}
            <button type="button" onClick={() => void refetch()} className="underline">Retry</button>
          </p>
        )}
        {!loading && !error && allTasks.length === 0 && groupBy === 'Status' && (
          <p className="text-xs text-[#8E9B90]">No tasks yet. Open a milestone from the Timeline to add some.</p>
        )}
        {dndError && (
          <div className="bg-[#FBEBEB] border border-[#EBC9C4] text-[#B0483B] text-xs font-semibold rounded-card px-3 py-2 -mt-2">
            {dndError}
          </div>
        )}

        <div className="flex-1 flex gap-6 overflow-x-auto no-scrollbar pb-4">

          {groupBy === 'Status' ? (
            statusColumns.map(col => {
              // Tasks in this column by effective (optimistic-aware) status. An
              // overdue task is a past-due To Do, so it shows under To Do.
              const colTasks = phases.flatMap(p =>
                p.milestones.flatMap(m =>
                  m.tasks.filter(t => effStatus(t) === col.id || (col.id === 'todo' && effStatus(t) === 'overdue'))
                    .map(t => ({ task: t, parentMilestone: m }))
                )
              );

              return (
                <div key={col.id} className="flex-shrink-0 w-[320px] flex flex-col gap-3">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="font-bold text-sm text-[#1E2923]">{col.label}</h3>
                    <span className="text-xs font-bold text-[#8E9B90] bg-[#EBEBE6] px-2 py-0.5 rounded-full">
                      {colTasks.length}
                    </span>
                  </div>

                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (dragOverCol !== col.id) setDragOverCol(col.id);
                    }}
                    onDragLeave={(e) => {
                      // Only clear when the pointer actually leaves the column box.
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverCol(null);
                    }}
                    onDrop={(e) => handleDrop(e, col.id)}
                    className={`flex-1 bg-[#F0F0EC] rounded-modal p-3 flex flex-col gap-3 min-h-[200px] transition-colors ${
                      dragOverCol === col.id ? 'ring-2 ring-[#2D5A3F] ring-inset bg-[#E7EEE9]' : ''
                    }`}
                  >
                    {colTasks.length === 0 && <p className="text-xs text-[#8E9B90] px-1">Nothing here.</p>}
                    {colTasks.map(({ task, parentMilestone }) => (
                      <div
                        key={task.id}
                        draggable={canEdit}
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        className="bg-white border border-[#EBEBE6] rounded-card p-4 shadow-card hover:shadow-raised hover:border-[#C5CFC7] transition-all flex flex-col gap-3 group active:cursor-grabbing"
                      >
                        <div className="flex items-start gap-2">
                          {canEdit && <GripVertical className="w-4 h-4 text-[#C5CFC7] mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab shrink-0" aria-hidden="true" />}
                          <button
                            type="button"
                            onClick={() => board.open(parentMilestone)}
                            className="text-left text-sm font-bold text-[#1E2923] leading-snug flex-1 hover:underline"
                          >
                            {task.title}
                          </button>
                          {task.status === 'overdue' && <OverdueChip />}
                        </div>
                        <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-[#768478]">
                          <span className="truncate max-w-[150px]">MS: {parentMilestone.title}</span>
                          <span className="bg-[#F7F7F5] px-2 py-1 rounded border border-[#EBEBE6]">{task.effort}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-[#768478]">
                          <span className="truncate">{personLabel(task.assignee, board.members.emailById)}</span>
                          <span>{formatDue(task.dueOn)}</span>
                        </div>
                        {canEdit && (
                          <label className="flex items-center gap-2 text-[11px] font-semibold text-[#617065]">
                            Move to
                            <select
                              aria-label={`Move "${task.title}" to`}
                              value={col.id}
                              onChange={(e) => void moveTask(task.id, e.target.value)}
                              className="flex-1 bg-[#F7F7F5] border border-[#EBEBE6] rounded-input px-2 py-1 text-xs font-semibold outline-none focus:border-[#2D5A3F]"
                            >
                              {statusColumns.map((c) => (
                                <option key={c.id} value={c.id}>{c.label}</option>
                              ))}
                            </select>
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            phases.map(phase => (
              <div key={phase.id} className="flex-shrink-0 w-[320px] flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="font-bold text-sm text-[#1E2923]">{phase.name}</h3>
                  <span className="text-xs font-bold text-[#8E9B90] bg-[#EBEBE6] px-2 py-0.5 rounded-full">
                    {phase.milestones.length}
                  </span>
                </div>
                
                <div className="flex-1 bg-[#F0F0EC] rounded-modal p-3 flex flex-col gap-3 min-h-[200px]">
                  {phase.milestones.length === 0 && <p className="text-xs text-[#8E9B90] px-1">No milestones in this phase.</p>}
                  {phase.milestones.map((ms) => (
                    <div
                      key={ms.id}
                      className="bg-white border border-[#EBEBE6] rounded-card p-4 shadow-card hover:shadow-raised hover:border-[#C5CFC7] transition-all flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => board.open(ms)}
                          className="text-left text-sm font-bold text-[#1E2923] leading-snug flex-1 hover:underline"
                        >
                          {ms.title}
                        </button>
                        <div className="flex flex-col items-end gap-1">
                          {ms.status === 'overdue' && <OverdueChip />}
                          {ms.replanned && <ReplannedChip replanned={ms.replanned} />}
                        </div>
                      </div>

                      <div className="w-full h-1.5 bg-[#EBEBE6] rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${ms.status === 'overdue' ? 'bg-[#B0483B]' : 'bg-[#2D5A3F]'}`}
                          style={{ width: `${ms.progress}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-medium text-[#768478]">
                        <span>{formatDue(ms.dueOn)}</span>
                        <span>{ms.tasks.length === 1 ? '1 task' : `${ms.tasks.length} tasks`}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

        </div>
      </div>

      <BoardDrawer board={board} />
    </>
  );
}
