'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as api from '@/lib/api/sales';
import { salesErrorMessage } from '@/lib/api/sales';
import { useLoader } from '@/hooks/useSalesCrm';

// Sales Sequences hooks: the sequence list, the sending status banner, one sequence's enrollments
// and the draft poll shared by "Write with AI" and the deal follow-up. Reads use the same
// loading / ready / error / forbidden states as the rest of Sales.

const DRAFT_POLL_MS = 1500;
export const DRAFT_TIMEOUT_MS = 90_000;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function useSequences() {
  const fetcher = useCallback(() => api.listSequences({ limit: 100 }).then((p) => p.items), []);
  return useLoader<api.Sequence[]>(fetcher);
}

export function useSendingStatus() {
  return useLoader<api.SendingStatus>(api.getSendingStatus);
}

export function useEnrollments(sequenceId: string | null, status: api.EnrollmentStatus | '', offset: number, limit: number) {
  const fetcher = useMemo(
    () =>
      sequenceId
        ? () => api.listEnrollments(sequenceId, { status: status || undefined, limit, offset })
        : null,
    [sequenceId, status, offset, limit]
  );
  return useLoader<api.Page<api.Enrollment>>(fetcher);
}

export type DraftOutcome =
  | { kind: 'ready'; draft: api.Draft }
  | { kind: 'failed'; message: string }
  | { kind: 'slow' };

export const DRAFT_FAILURE_MESSAGES: Record<NonNullable<api.Draft['error']>, string> = {
  over_budget: 'Your AI budget for this month is used up.',
  generation_failed: 'The AI could not write this one. Try again.',
  bad_output: 'The AI gave an answer that could not be used. Try again.',
  target_missing: 'The step or deal this was for is gone.',
};

/** Poll a draft until it is ready or failed. Resolves `slow` when it gives up; never throws. */
export async function waitForDraft(first: api.Draft, isCancelled: () => boolean = () => false): Promise<DraftOutcome | null> {
  let draft = first;
  const until = Date.now() + DRAFT_TIMEOUT_MS;
  while (draft.status === 'generating') {
    if (Date.now() > until) return { kind: 'slow' };
    await sleep(DRAFT_POLL_MS);
    if (isCancelled()) return null;
    try {
      draft = await api.getDraft(draft.id);
    } catch (err) {
      return { kind: 'failed', message: salesErrorMessage(err, 'Could not check the draft.') };
    }
  }
  if (isCancelled()) return null;
  if (draft.status === 'failed') {
    return { kind: 'failed', message: draft.error ? DRAFT_FAILURE_MESSAGES[draft.error] : 'The AI could not write this one.' };
  }
  return { kind: 'ready', draft };
}

/** Write-with-AI for one step: `write` starts a draft and resolves with the outcome (null if superseded). */
export function useStepDraft(sequenceId: string) {
  const [busyStep, setBusyStep] = useState<number | null>(null);
  const run = useRef(0);
  useEffect(() => {
    const r = run;
    return () => {
      r.current += 1;
    };
  }, []);

  const write = useCallback(
    async (stepIndex: number, instructions?: string): Promise<DraftOutcome | null> => {
      const id = ++run.current;
      setBusyStep(stepIndex);
      try {
        const draft = await api.requestStepDraft(sequenceId, stepIndex, instructions);
        return await waitForDraft(draft, () => id !== run.current);
      } catch (err) {
        return { kind: 'failed', message: salesErrorMessage(err, 'Could not start the draft.') };
      } finally {
        if (id === run.current) setBusyStep(null);
      }
    },
    [sequenceId]
  );
  return { busyStep, write };
}
