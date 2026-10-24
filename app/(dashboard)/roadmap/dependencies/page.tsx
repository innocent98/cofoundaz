'use client';

import React, { useState } from 'react';
import { useRoadmapApi } from '@/hooks/useRoadmapApi';
import { useWorkspace } from '@/components/workspace-context';
import { layoutGraph } from '@/lib/dependency-graph';
import { Link2, AlertCircle, CheckCircle2, ArrowRight, X } from 'lucide-react';

const NODE_W = 230;
const NODE_H = 40;
const GAP_X = 70;
const GAP_Y = 18;
const PAD = 16;

function clip(title: string, max = 33): string {
  return title.length > max ? `${title.slice(0, max - 1)}…` : title;
}

function DependencyGraph({ tasks }: { tasks: ReturnType<ReturnType<typeof useRoadmapApi>['getAllTasks']> }) {
  const g = layoutGraph(tasks);
  if (g.nodes.length === 0) return null;
  const pos = new Map(
    g.nodes.map((n) => [n.id, { x: PAD + n.layer * (NODE_W + GAP_X), y: PAD + n.row * (NODE_H + GAP_Y) }])
  );
  const width = PAD * 2 + g.layers * NODE_W + (g.layers - 1) * GAP_X;
  const height = PAD * 2 + g.rows * NODE_H + (g.rows - 1) * GAP_Y;
  return (
    <div className="overflow-x-auto border border-line-soft rounded-card bg-surface-ghost">
      <svg
        role="img"
        aria-label={`Dependency graph with ${g.nodes.length} tasks and ${g.edges.length} links. The list below has the same information.`}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        <defs>
          <marker id="dep-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0 L8 4 L0 8 z" fill="var(--color-accent-600)" />
          </marker>
        </defs>
        {g.edges.map((e) => {
          const a = pos.get(e.from);
          const b = pos.get(e.to);
          if (!a || !b) return null;
          const x1 = a.x + NODE_W;
          const y1 = a.y + NODE_H / 2;
          const x2 = b.x;
          const y2 = b.y + NODE_H / 2;
          const mid = (x1 + x2) / 2;
          return (
            <path
              key={`${e.from}-${e.to}`}
              d={`M${x1} ${y1} C${mid} ${y1}, ${mid} ${y2}, ${x2 - 2} ${y2}`}
              fill="none"
              stroke="var(--color-accent-600)"
              strokeWidth="1.5"
              markerEnd="url(#dep-arrow)"
            />
          );
        })}
        {g.nodes.map((n) => {
          const p = pos.get(n.id)!;
          const done = n.status === 'done';
          const overdue = n.status === 'overdue';
          return (
            <g key={n.id} transform={`translate(${p.x} ${p.y})`}>
              <title>{n.title}</title>
              <rect
                width={NODE_W}
                height={NODE_H}
                rx="8"
                fill={done ? 'var(--color-brand-tint)' : overdue ? 'var(--color-danger-tint)' : 'var(--color-white)'}
                stroke={done ? 'var(--color-brand-mid)' : overdue ? 'var(--color-danger-600)' : 'var(--color-neutral-xc5cfc7)'}
              />
              <text x="12" y={NODE_H / 2 + 4} fontSize="12" fontWeight="600" fill="var(--color-ink)">
                {clip(n.title)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function DependenciesPage() {
  const { getAllTasks, addDependency, removeDependency, loading, error, refetch } = useRoadmapApi();
  const { role } = useWorkspace();
  const canEdit = role === 'founder' || role === 'team_member';
  const tasks = getAllTasks();

  const [fromTask, setFromTask] = useState('');
  const [toTask, setToTask] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const handleAddDependency = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fromTask || !toTask) {
      setErrorMsg('Please select both tasks.');
      return;
    }

    setBusy(true);
    const result = await addDependency(fromTask, toTask);
    setBusy(false);

    if (!result.success) {
      setErrorMsg(result.error || 'Failed to add dependency.');
    } else {
      setSuccessMsg('Dependency added successfully.');
      setFromTask('');
      setToTask('');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleRemove = async (dependentId: string, prereqId: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    setBusy(true);
    const result = await removeDependency(dependentId, prereqId);
    setBusy(false);
    if (!result.success) setErrorMsg(result.error || 'Failed to remove dependency.');
  };

  // Build graph lines (just a simple list mapping for this implementation)
  const dependentTasks = tasks.filter(t => t.dependsOn && t.dependsOn.length > 0);

  return (
    <div className="flex flex-col gap-8 h-full">
      <div>
        <h2 className="text-3xl font-display font-medium text-ink tracking-tight">
          Dependencies
        </h2>
        <p className="text-xs text-ink-muted mt-1.5">
          Map out what blocks what. We&apos;ll automatically prevent circular loops.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Form Column */}
        {!canEdit ? (
          <div className="bg-white rounded-modal border border-line-soft shadow-card p-6 text-sm text-ink-soft">
            Founders and team members can create links. You can see the map on the right.
          </div>
        ) : (
        <div className="bg-white rounded-modal border border-line-soft shadow-card p-6 flex flex-col gap-6">
          <div className="flex items-center gap-2 text-brand-strong font-bold pb-2 border-b border-line-soft">
            <Link2 className="w-5 h-5" />
            <h3>Create Link</h3>
          </div>

          <form onSubmit={handleAddDependency} className="flex flex-col gap-4">
            
            <div className="flex flex-col gap-1.5">
              <label htmlFor="dep-from" className="text-xs font-bold text-ink-muted">This task...</label>
              <select 
                id="dep-from"
                className="bg-surface-subtle border border-line-soft rounded-input px-3 py-2 text-sm font-semibold outline-none focus:border-brand-mid transition-colors"
                value={fromTask}
                onChange={(e) => setFromTask(e.target.value)}
              >
                <option value="">Select prerequisite task</option>
                {tasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-center -my-2 z-10 relative">
              <div className="bg-white p-1 rounded-full border border-line-soft">
                <ArrowRight className="w-4 h-4 text-neutral-xc5cfc7 transform rotate-90 md:rotate-0" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="dep-to" className="text-xs font-bold text-ink-muted">...must finish before</label>
              <select 
                id="dep-to"
                className="bg-surface-subtle border border-line-soft rounded-input px-3 py-2 text-sm font-semibold outline-none focus:border-brand-mid transition-colors"
                value={toTask}
                onChange={(e) => setToTask(e.target.value)}
              >
                <option value="">Select dependent task</option>
                {tasks.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="mt-2 w-full bg-brand-strong hover:bg-brand-rail disabled:opacity-60 text-white font-bold py-2.5 rounded-card transition-colors shadow-card text-sm"
            >
              {busy ? 'Saving…' : 'Add Dependency'}
            </button>

            {errorMsg && (
              <div className="bg-danger-tint border border-danger-xfad7d7 rounded-input p-3 flex items-start gap-2 mt-2">
                <AlertCircle className="w-4 h-4 text-danger-600 shrink-0 mt-0.5" />
                <span className="text-xs font-semibold text-danger-600 leading-snug">{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-brand-tint border border-brand-xcde1d3 rounded-input p-3 flex items-start gap-2 mt-2">
                <CheckCircle2 className="w-4 h-4 text-brand-mid shrink-0 mt-0.5" />
                <span className="text-xs font-semibold text-brand-mid leading-snug">{successMsg}</span>
              </div>
            )}
          </form>
        </div>
        )}

        {/* Graph/List Column */}
        <div className="md:col-span-2 bg-white rounded-modal border border-line-soft shadow-card p-6 flex flex-col gap-6 min-h-[400px]">
          <h3 className="font-bold text-ink pb-2 border-b border-line-soft">
            Graph
          </h3>
          {loading && <p className="text-sm text-ink-subtle" aria-busy="true">Loading dependencies…</p>}
          {!loading && error && (
            <p role="alert" className="text-sm font-semibold text-danger-600">
              Couldn&apos;t load your tasks.{' '}
              <button type="button" onClick={() => void refetch()} className="underline">Retry</button>
            </p>
          )}
          <DependencyGraph tasks={tasks} />
          <h3 className="font-bold text-ink pb-2 border-b border-line-soft">
            Active Links
          </h3>

          <div className="flex flex-col gap-4">
            {!loading && !error && dependentTasks.length === 0 && (
              <p className="text-sm text-ink-soft">No dependencies mapped yet.{canEdit ? ' Create a link to see it here.' : ''}</p>
            )}

            {dependentTasks.map(t => (
              <div key={t.id} className="flex flex-col gap-2">
                <span className="text-sm font-bold text-ink">{t.title} <span className="font-medium text-ink-soft">(blocked by)</span></span>
                <div className="flex flex-col gap-2 pl-4 border-l-2 border-line-soft ml-2">
                  {t.dependsOn?.map(depId => {
                    const depTask = tasks.find(x => x.id === depId);
                    return (
                      <div key={depId} className="flex items-center gap-2 bg-surface-subtle rounded px-3 py-2 border border-line-soft w-fit group/edge">
                        <span className="w-2 h-2 rounded-full bg-accent-600"></span>
                        <span className="text-xs font-semibold text-ink-muted">{depTask?.title || depId}</span>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleRemove(t.id, depId)}
                            disabled={busy}
                            className="ml-1 p-0.5 rounded text-neutral-xa3b0a6 hover:text-danger-text hover:bg-danger-wash md:opacity-0 md:group-hover/edge:opacity-100 focus:opacity-100 transition disabled:opacity-30"
                            aria-label={`Remove dependency: ${t.title} on ${depTask?.title || 'a removed task'}`}
                          >
                            <X className="w-3 h-3" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
