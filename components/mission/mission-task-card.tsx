'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Clock, MoreHorizontal } from 'lucide-react';
import type { MissionTask } from '@/hooks/useMissionApi';
import { MilestoneChip } from './milestone-chip';

export const REJECT_REASONS = ['Already done', 'Wrong priority', "Doesn't apply"] as const;

/** One task in Today's Mission: complete checkbox, why-line, chips and the "⋯" menu (reprioritize, snooze, not relevant). */
export function MissionTaskCard({
  task,
  first,
  last,
  onToggle,
  onUp,
  onDown,
  onSnooze,
  onReject,
}: {
  task: MissionTask;
  first: boolean;
  last: boolean;
  onToggle: () => void;
  onUp: () => void;
  onDown: () => void;
  onSnooze: () => void;
  onReject: (reason: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const done = task.status === 'completed';

  // The menu closes on Escape (focus returns to "⋯") and on a click outside it.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const item = 'w-full text-left px-4 py-2 text-sm text-[#1E2923] hover:bg-[#F5F5F0] focus-visible:bg-[#F5F5F0] disabled:opacity-50 flex items-center justify-between';

  return (
    <li className="relative bg-white rounded-modal p-6 border border-[#EBEBE6] shadow-card hover:border-[#D5DDD6] transition-all flex items-start gap-4 list-none">
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={`Complete task: ${task.title}`}
        disabled={done}
        onClick={onToggle}
        className={`w-6 h-6 rounded-input border-2 transition-all duration-300 flex items-center justify-center shrink-0 mt-0.5 ${
          done ? 'bg-[#183B28] border-[#183B28] text-white' : 'border-[#C5CFC7] hover:border-[#183B28] bg-white cursor-pointer'
        }`}
      >
        {done && <span className="text-xs font-bold" aria-hidden="true">✓</span>}
      </button>

      <div className="flex-1 min-w-0">
        {rejecting ? (
          <div className="py-2">
            <p className="text-sm font-semibold text-[#1E2923] mb-3">Why is this not relevant?</p>
            <div className="flex gap-2 flex-wrap">
              {REJECT_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => {
                    setRejecting(false);
                    onReject(reason);
                  }}
                  className="px-3 py-1.5 rounded-full border border-[#D5DDD6] text-xs font-medium text-[#617065] hover:bg-[#F5F5F0] hover:text-[#1E2923] transition-colors cursor-pointer"
                >
                  {reason}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setRejecting(false)}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-[#8E9B90] hover:text-[#1E2923] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <h3 className={`font-semibold text-base leading-snug transition-all duration-300 ${done ? 'line-through text-[#8E9B90]' : 'text-[#1E2923]'}`}>
                {task.title}
              </h3>
              {!done && (
                <div className="relative" ref={menuRef}>
                  <button
                    ref={triggerRef}
                    type="button"
                    aria-label={`More actions for ${task.title}`}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((v) => !v)}
                    className="text-[#8E9B90] hover:text-[#1E2923] p-1 rounded-input transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#183B28]"
                  >
                    <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
                  </button>

                  {menuOpen && (
                    <div role="menu" className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#EBEBE6] shadow-accent rounded-modal z-10 py-1 overflow-hidden">
                      <button
                        type="button"
                        role="menuitem"
                        autoFocus
                        onClick={() => { setMenuOpen(false); onUp(); }}
                        disabled={first}
                        className={item}
                      >
                        Reprioritize Up <ArrowUp className="w-3 h-3" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => { setMenuOpen(false); onDown(); }}
                        disabled={last}
                        className={`${item} border-b border-[#EBEBE6]`}
                      >
                        Reprioritize Down <ArrowDown className="w-3 h-3" aria-hidden="true" />
                      </button>
                      <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); onSnooze(); }} className={item}>
                        Snooze to tomorrow
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => { setMenuOpen(false); setRejecting(true); }}
                        className="w-full text-left px-4 py-2 text-sm text-[#9C5B34] hover:bg-[#F7EEDC] focus-visible:bg-[#F7EEDC]"
                      >
                        Not relevant
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {task.reason && <p className="text-xs text-[#617065] leading-relaxed mt-1 mb-3">Why: {task.reason}</p>}

            <div className="flex items-center gap-2 flex-wrap">
              {task.milestone ? (
                <MilestoneChip milestone={task.milestone} />
              ) : (
                <span className="inline-flex items-center bg-[#F5F5F0] text-[#617065] text-xs font-medium px-3 py-1 rounded-full">{task.tag}</span>
              )}
              <span className="inline-flex items-center gap-1.5 bg-[#F5F5F0] text-[#617065] text-xs font-medium px-3 py-1 rounded-full">
                <Clock className="w-3 h-3" aria-hidden="true" />
                {task.effort}
              </span>
            </div>
          </>
        )}
      </div>
    </li>
  );
}
