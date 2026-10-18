import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/lib/api/client';
import {
  BREAKDOWN_COPY,
  BREAKDOWN_POLL_MS,
  BREAKDOWN_TIMEOUT_MS,
  breakdownDoneCopy,
  pollBreakdown,
  startBreakdown,
} from '@/lib/api/breakdown';

export type BreakdownState = { phase: 'working' } | { phase: 'done' | 'error'; message: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * "Ask AI to break this down": start the job, poll it, then let the caller
 * refetch the tree. Tracks one state per milestone and the ids of the tasks the
 * AI just appended so the UI can highlight them.
 */
export function useMilestoneBreakdown(onChanged: () => Promise<unknown>) {
  const [states, setStates] = useState<Record<string, BreakdownState>>({});
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());
  const alive = useRef(true);
  const onChangedRef = useRef(onChanged);

  useEffect(() => {
    onChangedRef.current = onChanged;
  }, [onChanged]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const set = useCallback((id: string, s: BreakdownState | null) => {
    if (!alive.current) return;
    setStates((prev) => {
      const next = { ...prev };
      if (s) next[id] = s;
      else delete next[id];
      return next;
    });
  }, []);

  const run = useCallback(
    async (milestoneId: string) => {
      set(milestoneId, { phase: 'working' });
      try {
        const start = await startBreakdown(milestoneId);
        if (start.kind === 'in_progress') {
          // Someone (or an earlier click) already started it: keep waiting, don't fail.
          set(milestoneId, { phase: 'error', message: BREAKDOWN_COPY.inProgress });
          return;
        }
        const deadline = Date.now() + BREAKDOWN_TIMEOUT_MS;
        while (alive.current && Date.now() < deadline) {
          await sleep(BREAKDOWN_POLL_MS);
          const outcome = await pollBreakdown(start.jobId);
          if (!outcome) continue;
          if (outcome.kind === 'ready') {
            await onChangedRef.current();
            if (alive.current) setHighlighted(new Set(outcome.createdTaskIds));
            set(milestoneId, { phase: 'done', message: breakdownDoneCopy(outcome.createdTaskIds.length) });
          } else if (outcome.kind === 'over_budget') {
            set(milestoneId, { phase: 'error', message: BREAKDOWN_COPY.overBudget });
          } else if (outcome.kind === 'gone') {
            await onChangedRef.current();
            set(milestoneId, { phase: 'error', message: BREAKDOWN_COPY.gone });
          } else {
            set(milestoneId, { phase: 'error', message: BREAKDOWN_COPY.failed });
          }
          return;
        }
        if (alive.current) set(milestoneId, { phase: 'error', message: BREAKDOWN_COPY.slow });
      } catch (err) {
        const forbidden = err instanceof ApiError && err.status === 403;
        set(milestoneId, {
          phase: 'error',
          message: forbidden ? "You don't have permission to do that." : BREAKDOWN_COPY.failed,
        });
      }
    },
    [set]
  );

  const dismiss = useCallback((milestoneId: string) => set(milestoneId, null), [set]);
  const clearHighlight = useCallback(() => setHighlighted(new Set()), []);

  return { states, highlighted, run, dismiss, clearHighlight };
}
