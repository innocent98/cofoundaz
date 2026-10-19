'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { ROADMAP_STAGES, personLabel, type RoadmapMilestone } from '@/hooks/useRoadmapApi';
import { useRoadmapBoard } from '@/hooks/useRoadmapBoard';
import { BoardDrawer } from '@/components/roadmap/board-drawer';
import { OverdueChip, ReplannedChip } from '@/components/roadmap/milestone-chips';
import { buildScale, dayNumber, formatDue, todayDayNumber, type Zoom } from '@/lib/roadmap-format';

const CARD_W = 300;

export default function TimelinePage() {
  return (
    <Suspense fallback={null}>
      <TimelineView />
    </Suspense>
  );
}

function TimelineView() {
  const board = useRoadmapBoard();
  const { currentStage, phases, loading, error, refetch, canEdit } = board;
  const [zoom, setZoom] = useState<Zoom>('Month');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [addingPhase, setAddingPhase] = useState(false);
  const [phaseName, setPhaseName] = useState('');
  const [addingIn, setAddingIn] = useState<string | null>(null);
  const [msTitle, setMsTitle] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  const today = todayDayNumber();
  const scale = useMemo(() => {
    const days: number[] = [];
    for (const p of phases) {
      for (const d of [p.startsOn, p.endsOn]) {
        const n = dayNumber(d);
        if (n !== null) days.push(n);
      }
      for (const m of p.milestones) {
        const n = dayNumber(m.dueOn);
        if (n !== null) days.push(n);
      }
    }
    return buildScale(days, zoom, today);
  }, [phases, zoom, today]);

  // Bring "today" into view when the canvas first has data and when the zoom changes.
  const hasPhases = phases.length > 0;
  useEffect(() => {
    const el = scroller.current;
    if (el && hasPhases) el.scrollLeft = Math.max(0, scale.x(today) - 160);
  }, [hasPhases, scale, today]);

  const currentIdx = ROADMAP_STAGES.findIndex((s) => s.key === currentStage);
  const currentLabel = ROADMAP_STAGES[currentIdx]?.label ?? 'Idea';
  const emailById = board.members.emailById;

  const guard = async (fn: () => Promise<unknown>, fallback: string) => {
    setActionError(null);
    try {
      await fn();
      return true;
    } catch {
      setActionError(fallback);
      return false;
    }
  };

  const submitPhase = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = phaseName.trim();
    if (!name) return;
    if (await guard(() => board.createPhase(name), 'Could not add that phase. Please try again.')) {
      setPhaseName('');
      setAddingPhase(false);
    }
  };

  const submitMilestone = async (e: React.FormEvent, phaseId: string) => {
    e.preventDefault();
    const title = msTitle.trim();
    if (!title) return;
    if (await guard(() => board.createMilestone(phaseId, title), 'Could not add that milestone. Please try again.')) {
      setMsTitle('');
      setAddingIn(null);
    }
  };

  const removePhase = async (id: string, name: string) => {
    if (!window.confirm(`Delete phase "${name}" and everything under it? This cannot be undone.`)) return;
    await guard(() => board.deletePhase(id), 'Could not delete that phase. Please try again.');
  };

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const cardLeft = (ms: RoadmapMilestone, phaseStart: string): number => {
    const n = dayNumber(ms.dueOn) ?? dayNumber(phaseStart);
    return n === null ? 0 : scale.x(n);
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-display font-medium text-[#1E2923] tracking-tight">Roadmap</h2>
          <p className="text-xs text-[#617065]">
            Your path from <span className="font-bold text-[#2D5A3F]">{currentLabel}</span> to profitability, I re-plan it when reality changes.
          </p>
        </div>

        <nav aria-label="Startup stage" className="overflow-x-auto no-scrollbar pb-2">
          <ol className="flex items-center gap-2">
            {ROADMAP_STAGES.map((s, idx) => (
              <li key={s.key} className="flex items-center gap-2">
                <div
                  aria-current={s.key === currentStage ? 'step' : undefined}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition-colors ${
                    s.key === currentStage
                      ? 'bg-[#183B28] text-white border-[#183B28]'
                      : idx < currentIdx
                        ? 'bg-[#EAF2ED] text-[#2D5A3F] border-[#CDE1D3]'
                        : 'bg-white text-[#768478] border-[#EBEBE6]'
                  }`}
                >
                  {idx + 1}. {s.label}
                </div>
                {idx < ROADMAP_STAGES.length - 1 && <div className="w-4 h-px bg-[#DCE6E1]" aria-hidden="true" />}
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
          <h3 className="font-bold text-[#1E2923] text-sm">Timeline Canvas</h3>
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                type="button"
                onClick={() => setAddingPhase((v) => !v)}
                aria-expanded={addingPhase}
                className="flex items-center gap-1.5 bg-[#183B28] hover:bg-[#11291C] text-white font-bold px-3 py-1.5 rounded-card text-xs transition-colors shadow-card"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Add phase</span>
              </button>
            )}
            <div role="group" aria-label="Zoom" className="flex items-center gap-1 bg-[#F5F5F0] p-1 rounded-card border border-[#EBEBE6]">
              {(['Week', 'Month', 'Quarter'] as const).map((z) => (
                <button
                  type="button"
                  key={z}
                  onClick={() => setZoom(z)}
                  aria-pressed={zoom === z}
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-all ${
                    zoom === z ? 'bg-white text-[#1E2923] font-bold shadow-card' : 'bg-transparent text-[#768478] hover:text-[#1E2923]'
                  }`}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>
        </div>

        {addingPhase && (
          <form onSubmit={submitPhase} className="flex items-center gap-2">
            <input
              autoFocus
              value={phaseName}
              onChange={(e) => setPhaseName(e.target.value)}
              placeholder="New phase name"
              aria-label="New phase name"
              maxLength={120}
              className="flex-1 max-w-sm border border-[#D5DDD6] rounded-input px-3 py-2 text-sm focus:outline-none focus:border-[#4D6D58] focus:ring-1 focus:ring-[#4D6D58]"
            />
            <button type="submit" disabled={!phaseName.trim()} className="px-3 py-2 rounded-input bg-[#183B28] text-white text-xs font-bold disabled:opacity-40">
              Add
            </button>
            <button type="button" onClick={() => setAddingPhase(false)} className="px-3 py-2 rounded-input text-xs font-semibold text-[#617065] hover:bg-[#EBEBE6]">
              Cancel
            </button>
          </form>
        )}

        {actionError && (
          <p role="alert" className="bg-[#FBEBEB] border border-[#EBC9C4] text-[#B0483B] text-xs font-semibold rounded-card px-3 py-2">
            {actionError}
          </p>
        )}

        <div className="bg-white rounded-modal border border-[#EBEBE6] shadow-card min-h-[500px] relative overflow-hidden">
          {loading && (
            <div className="flex flex-col gap-4 animate-pulse p-6 pt-12" aria-busy="true" aria-label="Loading your roadmap">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[72px] w-[300px] bg-[#F0F0EC] rounded-card" style={{ marginLeft: `${i * 20 + 10}%` }} />
              ))}
            </div>
          )}

          {!loading && error && (
            <div role="alert" className="flex flex-col items-center justify-center py-24 text-center gap-3">
              <p className="text-base font-semibold text-[#1E2923]">Couldn&apos;t load your roadmap</p>
              <button type="button" onClick={() => void refetch()} className="px-4 py-2 rounded-card bg-[#183B28] text-white text-xs font-bold">
                Retry
              </button>
            </div>
          )}

          {!loading && !error && phases.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-2">
              <p className="text-base font-semibold text-[#1E2923]">No roadmap yet</p>
              <p className="text-sm text-[#768478] max-w-sm">
                Add your first phase, or start from a template built for your stage.
              </p>
              <Link href="/roadmap/templates" className="mt-2 px-4 py-2 rounded-card bg-[#183B28] text-white text-xs font-bold">
                Browse templates
              </Link>
            </div>
          )}

          {!loading && !error && phases.length > 0 && (
            <div ref={scroller} className="overflow-x-auto" tabIndex={0} aria-label="Roadmap timeline, scroll sideways">
              <div className="relative pb-8" style={{ width: scale.width + CARD_W + 48 }}>
                {/* Month / week axis */}
                <div className="relative h-8 border-b border-[#EBEBE6] bg-[#FAFAFA]" aria-hidden="true">
                  {scale.ticks.map((t) => (
                    <span
                      key={t.day}
                      className="absolute top-0 bottom-0 flex items-center pl-2 border-l border-[#EBEBE6] text-[10px] font-bold uppercase tracking-wider text-[#8E9B90]"
                      style={{ left: scale.x(t.day) }}
                    >
                      {t.label}
                    </span>
                  ))}
                </div>

                {/* Today line, at its real date */}
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-[#B0483B] z-10 pointer-events-none"
                  style={{ left: scale.x(today) }}
                  aria-hidden="true"
                >
                  <div className="absolute top-0 -left-6 bg-[#B0483B] text-white text-[10px] font-bold px-2 py-0.5 rounded-b-md">TODAY</div>
                </div>

                <div className="p-6 pt-8 flex flex-col gap-8">
                  {phases.map((phase) => (
                    <div key={phase.id} className="flex flex-col gap-4">
                      <div className="sticky left-6 z-20 flex flex-wrap items-center gap-3 w-fit max-w-[calc(100vw-96px)]">
                        <h4 className="text-xs font-bold text-[#617065] uppercase tracking-wider">
                          Phase {phase.order}: {phase.name}
                        </h4>
                        {canEdit && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setMsTitle('');
                                setAddingIn(addingIn === phase.id ? null : phase.id);
                              }}
                              aria-expanded={addingIn === phase.id}
                              className="flex items-center gap-1 text-[11px] font-semibold text-[#183B28] hover:text-[#11291C]"
                            >
                              <Plus className="w-3 h-3" aria-hidden="true" /> Milestone
                            </button>
                            <button
                              type="button"
                              onClick={() => removePhase(phase.id, phase.name)}
                              className="p-1 rounded-input text-[#768478] hover:text-[#A34B4B] hover:bg-[#FBEBEB] transition-colors"
                              aria-label={`Delete phase ${phase.name}`}
                            >
                              <Trash2 className="w-3 h-3" aria-hidden="true" />
                            </button>
                          </div>
                        )}
                      </div>

                      {addingIn === phase.id && (
                        <form onSubmit={(e) => submitMilestone(e, phase.id)} className="sticky left-6 z-20 flex items-center gap-2 w-fit">
                          <input
                            autoFocus
                            value={msTitle}
                            onChange={(e) => setMsTitle(e.target.value)}
                            placeholder="New milestone title"
                            aria-label="New milestone title"
                            maxLength={200}
                            className="w-64 border border-[#D5DDD6] rounded-input px-3 py-2 text-sm focus:outline-none focus:border-[#4D6D58] focus:ring-1 focus:ring-[#4D6D58]"
                          />
                          <button type="submit" disabled={!msTitle.trim()} className="px-3 py-2 rounded-input bg-[#183B28] text-white text-xs font-bold disabled:opacity-40">
                            Add
                          </button>
                          <button type="button" onClick={() => setAddingIn(null)} className="px-3 py-2 rounded-input text-xs font-semibold text-[#617065] hover:bg-[#EBEBE6]">
                            Cancel
                          </button>
                        </form>
                      )}

                      {phase.milestones.length === 0 && (
                        <p className="sticky left-6 w-fit text-xs text-[#8E9B90]">
                          No milestones in this phase yet.{canEdit ? ' Use + Milestone to add one.' : ''}
                        </p>
                      )}

                      <ul className="flex flex-col gap-3 relative">
                        {phase.milestones.map((ms) => {
                          const open = expanded.has(ms.id);
                          return (
                            <li
                              key={ms.id}
                              className="relative z-20 bg-white border border-[#EBEBE6] rounded-card p-3 shadow-card hover:shadow-raised hover:border-[#C5CFC7] transition-all flex flex-col gap-2"
                              style={{ marginLeft: cardLeft(ms, phase.startsOn), width: CARD_W }}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => board.open(ms)}
                                  className="text-left text-sm font-bold text-[#1E2923] leading-snug hover:underline"
                                >
                                  {ms.title}
                                </button>
                                <div className="flex flex-col items-end gap-1">
                                  {ms.status === 'overdue' && <OverdueChip />}
                                  {ms.replanned && <ReplannedChip replanned={ms.replanned} />}
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs text-[#768478] font-medium">
                                <span>{formatDue(ms.dueOn)}</span>
                                <span>{ms.progress}%</span>
                              </div>

                              <div className="w-full h-1.5 bg-[#EBEBE6] rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all ${ms.status === 'overdue' ? 'bg-[#B0483B]' : 'bg-[#2D5A3F]'}`}
                                  style={{ width: `${ms.progress}%` }}
                                />
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-[#768478] font-medium">
                                <button
                                  type="button"
                                  onClick={() => toggleExpanded(ms.id)}
                                  aria-expanded={open}
                                  className="flex items-center gap-1 hover:text-[#1E2923]"
                                  disabled={ms.tasks.length === 0}
                                >
                                  {open ? <ChevronDown className="w-3 h-3" aria-hidden="true" /> : <ChevronRight className="w-3 h-3" aria-hidden="true" />}
                                  {ms.tasks.length === 1 ? '1 task' : `${ms.tasks.length} tasks`}
                                </button>
                                <span className="truncate max-w-[140px]">{personLabel(ms.owner, emailById)}</span>
                              </div>

                              {open && (
                                <ul className="flex flex-col gap-1.5 border-t border-[#F0F0EC] pt-2">
                                  {ms.tasks.map((t) => (
                                    <li key={t.id} className="flex items-center justify-between gap-2 text-[11px]">
                                      <span className={`truncate ${t.status === 'done' ? 'line-through text-[#8E9B90]' : 'text-[#1E2923]'}`}>{t.title}</span>
                                      <span className={`shrink-0 font-semibold ${t.status === 'overdue' ? 'text-[#B0483B]' : 'text-[#768478]'}`}>
                                        {t.status === 'overdue' ? 'Overdue' : t.status === 'done' ? 'Done' : t.status === 'in_progress' ? 'In progress' : 'To do'}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <BoardDrawer board={board} />
    </>
  );
}
