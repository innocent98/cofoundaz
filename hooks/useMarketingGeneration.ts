'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  marketingErrorMessage,
  type GenerationAccepted,
  type GenerationStatus,
} from '@/lib/api/marketing';

// Every Marketing AI generation (copy, plan-week, channel plan, fit notes, content gaps)
// is POST -> 202 {id, status:"generating"} then poll GET .../{id} until ready|failed.
// Polling is bounded: it backs off, stops on a terminal status, and ends in an honest
// "timeout" phase rather than spinning forever. Nothing is ever fabricated client-side.

export const POLL_START_MS = 1500;
export const POLL_MAX_MS = 5000;
export const POLL_TIMEOUT_MS = 90_000;
const MAX_CONSECUTIVE_ERRORS = 3;

export type PollOutcome<G> =
  | { kind: 'done'; generation: G }
  | { kind: 'timeout' }
  | { kind: 'cancelled' };

interface PollOptions {
  intervalMs?: number;
  maxIntervalMs?: number;
  timeoutMs?: number;
  isCancelled?: () => boolean;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

/** Poll `get` until the generation is ready/failed, the deadline passes, or it is cancelled. */
export async function pollGeneration<G extends { status: GenerationStatus }>(
  get: () => Promise<G>,
  opts: PollOptions = {}
): Promise<PollOutcome<G>> {
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const now = opts.now ?? Date.now;
  const deadline = now() + (opts.timeoutMs ?? POLL_TIMEOUT_MS);
  const maxInterval = opts.maxIntervalMs ?? POLL_MAX_MS;
  let interval = opts.intervalMs ?? POLL_START_MS;
  let consecutiveErrors = 0;

  while (now() < deadline) {
    await sleep(interval);
    if (opts.isCancelled?.()) return { kind: 'cancelled' };
    try {
      const g = await get();
      consecutiveErrors = 0;
      if (g.status === 'ready' || g.status === 'failed') return { kind: 'done', generation: g };
    } catch (err) {
      // A 4xx will not fix itself; a flaky network might.
      consecutiveErrors += 1;
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) throw err;
    }
    interval = Math.min(Math.round(interval * 1.5), maxInterval);
  }
  return { kind: 'timeout' };
}

export type GenerationPhase = 'idle' | 'generating' | 'ready' | 'failed' | 'timeout';

export interface GenerationState<G> {
  phase: GenerationPhase;
  generation: G | null;
  error: string | null;
}

export function failureMessage(error: string | null | undefined): string {
  if (error === 'over_budget') {
    return 'AI is paused for today because the daily AI budget is used up. Try again after it resets.';
  }
  return error ? `The AI could not finish this request (${error}).` : 'The AI could not finish this request.';
}

/**
 * Drive one kind of generation. `start(input)` POSTs, `get(id)` polls.
 * `run` resolves with the terminal generation (or null on failure/timeout/cancel).
 */
export function useMarketingGeneration<I, G extends { status: GenerationStatus; error: string | null }>(
  start: (input: I) => Promise<GenerationAccepted>,
  get: (id: string) => Promise<G>
) {
  const [state, setState] = useState<GenerationState<G>>({ phase: 'idle', generation: null, error: null });
  const runId = useRef(0);

  const cancel = useCallback(() => {
    runId.current++;
  }, []);

  useEffect(() => cancel, [cancel]);

  const reset = useCallback(() => {
    cancel();
    setState({ phase: 'idle', generation: null, error: null });
  }, [cancel]);

  const run = useCallback(
    async (input?: I): Promise<G | null> => {
      const id = ++runId.current;
      const live = () => runId.current === id;
      setState({ phase: 'generating', generation: null, error: null });
      try {
        const accepted = await start(input as I);
        const outcome = await pollGeneration(() => get(accepted.id), { isCancelled: () => !live() });
        if (!live()) return null;
        if (outcome.kind === 'timeout') {
          setState({
            phase: 'timeout',
            generation: null,
            error: 'This is taking longer than expected. The AI may still finish, so check back shortly or try again.',
          });
          return null;
        }
        if (outcome.kind === 'cancelled') return null;
        const g = outcome.generation;
        if (g.status === 'failed') {
          setState({ phase: 'failed', generation: g, error: failureMessage(g.error) });
          return null;
        }
        setState({ phase: 'ready', generation: g, error: null });
        return g;
      } catch (err) {
        if (!live()) return null;
        setState({ phase: 'failed', generation: null, error: marketingErrorMessage(err) });
        return null;
      }
    },
    [start, get]
  );

  return { ...state, run, reset, busy: state.phase === 'generating' };
}
