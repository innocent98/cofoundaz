'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { personLabel } from '@/hooks/useRoadmapApi';
import { useRoadmapBoard } from '@/hooks/useRoadmapBoard';
import { BoardDrawer } from '@/components/roadmap/board-drawer';
import { BreakdownButton } from '@/components/roadmap/breakdown-button';
import { OverdueChip, ReplannedChip } from '@/components/roadmap/milestone-chips';
import { RowMenu } from '@/components/roadmap/row-menu';
import { formatDue } from '@/lib/roadmap-format';

export default function MilestonesPage() {
  return (
    <Suspense fallback={null}>
      <MilestonesView />
    </Suspense>
  );
}

function MilestonesView() {
  const board = useRoadmapBoard();
  const { phases, loading, error, refetch, canEdit } = board;
  const [rowError, setRowError] = useState<string | null>(null);

  const allMilestones = phases.flatMap((p) => p.milestones.map((m) => ({ ...m, phaseName: p.name })));

  const remove = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}" and all its tasks? This cannot be undone.`)) return;
    setRowError(null);
    try {
      await board.deleteMilestone(id);
    } catch {
      setRowError('Could not delete that milestone. Please try again.');
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div>
        <h2 className="text-3xl font-display font-medium text-ink tracking-tight">Milestones</h2>
        <p className="text-xs text-ink-muted mt-1.5">List view of all key deliverables across your roadmap.</p>
      </div>

      {rowError && (
        <p role="alert" className="bg-danger-wash border border-danger-xebc9c4 text-danger-600 text-xs font-semibold rounded-card px-3 py-2">
          {rowError}
        </p>
      )}

      <div className="bg-white rounded-modal border border-line-soft shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-surface-subtle border-b border-line-soft text-[11px] font-bold tracking-wider text-ink-soft uppercase">
                <th scope="col" className="py-3.5 px-6 font-bold">Milestone Title</th>
                <th scope="col" className="py-3.5 px-6 font-bold">Phase</th>
                <th scope="col" className="py-3.5 px-6 font-bold">Owner</th>
                <th scope="col" className="py-3.5 px-6 font-bold">Due Date</th>
                <th scope="col" className="py-3.5 px-6 font-bold">Progress</th>
                <th scope="col" className="py-3.5 px-6 font-bold">Dependencies</th>
                <th scope="col" className="py-3.5 px-6 font-bold">Status</th>
                <th scope="col" className="py-3.5 px-6 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-faint text-xs font-medium text-ink">
              {loading && (
                <tr>
                  <td colSpan={8} className="py-10 px-6 text-center text-ink-subtle" aria-busy="true">Loading milestones…</td>
                </tr>
              )}
              {!loading && error && (
                <tr>
                  <td colSpan={8} role="alert" className="py-10 px-6 text-center text-danger-600 font-semibold">
                    Couldn&apos;t load your milestones.{' '}
                    <button type="button" onClick={() => void refetch()} className="underline">Retry</button>
                  </td>
                </tr>
              )}
              {!loading && !error && allMilestones.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 px-6 text-center text-ink-soft">
                    No milestones yet. Add one from the{' '}
                    <Link href="/roadmap" className="underline font-semibold">Timeline</Link>.
                  </td>
                </tr>
              )}
              {allMilestones.map((ms) => (
                <tr key={ms.id} className="hover:bg-neutral-xfaf9f6 transition-colors align-top">
                  <td className="py-4 px-6 font-bold text-ink">
                    <button type="button" onClick={() => board.open(ms)} className="text-left hover:underline">
                      {ms.title}
                    </button>
                  </td>
                  <td className="py-4 px-6 text-ink-body">{ms.phaseName}</td>
                  <td className="py-4 px-6 text-ink-body">{personLabel(ms.owner, board.members.emailById)}</td>
                  <td className="py-4 px-6 text-ink-body">{formatDue(ms.dueOn)}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-line-soft rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${ms.status === 'overdue' ? 'bg-danger-600' : 'bg-brand-mid'}`}
                          style={{ width: `${ms.progress}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-ink-soft font-bold w-8">{ms.progress}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-ink-body">
                    {ms.dependencyCount > 0 ? (
                      <Link href="/roadmap/dependencies" className="underline">
                        {ms.dependencyCount === 1 ? '1 dependency' : `${ms.dependencyCount} dependencies`}
                      </Link>
                    ) : (
                      'None'
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {ms.status === 'overdue' ? (
                        <OverdueChip />
                      ) : ms.status === 'completed' ? (
                        <span className="flex w-fit items-center gap-1 bg-brand-tint text-brand-mid px-2 py-0.5 rounded text-[10px] font-bold border border-brand-xcde1d3">Completed</span>
                      ) : (
                        <span className="flex w-fit items-center gap-1 bg-surface-muted text-ink-muted px-2 py-0.5 rounded text-[10px] font-bold border border-line-soft">Pending</span>
                      )}
                      {ms.replanned && <ReplannedChip replanned={ms.replanned} />}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-start justify-end gap-2">
                      {canEdit && (
                        <BreakdownButton
                          className="text-right"
                          state={board.breakdown.states[ms.id]}
                          onRun={() => void board.breakdown.run(ms.id)}
                        />
                      )}
                      <RowMenu
                        label={`Actions for ${ms.title}`}
                        items={[
                          { label: canEdit ? 'Edit' : 'Open', onSelect: () => board.open(ms) },
                          ...(canEdit ? [{ label: 'Delete', danger: true, onSelect: () => void remove(ms.id, ms.title) }] : []),
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <BoardDrawer board={board} />
    </div>
  );
}
