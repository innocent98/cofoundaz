'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as api from '@/lib/api/sales';
import { isForbiddenError, salesErrorMessage } from '@/lib/api/sales';
import { useLoader } from '@/hooks/useSalesCrm';

// Sales AI Coach (role-play, call prep) and Analytics hooks. The coach follows the co-founder chat
// protocol: a POST answers at once with a `generating` / `scoring` row and we poll the GET. Polls are
// bounded; when one gives up the page says so and offers "Check again" instead of spinning forever.

export const POLL_MS = 1500;
/** A buyer reply (a short LLM call) that has not landed after this long is reported as slow. */
export const REPLY_TIMEOUT_MS = 90_000;
/** Scoring reads the whole call, so it gets longer. */
export const SCORING_TIMEOUT_MS = 150_000;
export const CALL_PREP_TIMEOUT_MS = 120_000;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- role-play

export type RolePlayBusy = 'starting' | 'sending' | 'ending' | null;

export function useRolePlay() {
  const [session, setSession] = useState<api.CoachSession | null>(null);
  const [busy, setBusy] = useState<RolePlayBusy>(null);
  const [error, setError] = useState<string | null>(null);
  /** The poll gave up before the buyer replied / the scorecard landed. */
  const [slow, setSlow] = useState(false);
  const runRef = useRef(0);

  // A new run id cancels any poll still in flight (new session, reset, unmount).
  useEffect(() => {
    const run = runRef;
    return () => {
      run.current += 1;
    };
  }, []);

  const watch = useCallback(async (s: api.CoachSession, run: number) => {
    const scoring = s.status === 'scoring';
    if (!scoring && !api.pendingBuyerTurn(s.messages)) return;
    const until = Date.now() + (scoring ? SCORING_TIMEOUT_MS : REPLY_TIMEOUT_MS);
    while (Date.now() < until) {
      await sleep(POLL_MS);
      if (run !== runRef.current) return;
      try {
        const next = await api.getCoachSession(s.id);
        if (run !== runRef.current) return;
        setSession(next);
        const waiting = scoring ? next.status === 'scoring' : !!api.pendingBuyerTurn(next.messages);
        if (!waiting) {
          setSlow(false);
          return;
        }
      } catch (err) {
        if (run !== runRef.current) return;
        if (isForbiddenError(err) || api.isNotFoundError(err)) {
          setError(salesErrorMessage(err, 'This practice call is no longer available.'));
          return;
        }
        // a transient error: keep polling until the deadline
      }
    }
    if (run === runRef.current) setSlow(true);
  }, []);

  const adopt = useCallback(
    (s: api.CoachSession, run: number) => {
      setSession(s);
      setSlow(false);
      void watch(s, run);
    },
    [watch]
  );

  /** Start a call. Resolves true when the session exists; the error text is in `error` otherwise. */
  const start = useCallback(
    async (setup: api.CoachSetup): Promise<boolean> => {
      const run = ++runRef.current;
      setBusy('starting');
      setError(null);
      try {
        const s = await api.createCoachSession(setup);
        if (run !== runRef.current) return false;
        adopt(s, run);
        return true;
      } catch (err) {
        if (run === runRef.current) setError(salesErrorMessage(err));
        return false;
      } finally {
        if (run === runRef.current) setBusy(null);
      }
    },
    [adopt]
  );

  /** Reopen a past session (its scorecard, or a call still in progress). */
  const open = useCallback(
    async (sessionId: string): Promise<boolean> => {
      const run = ++runRef.current;
      setBusy('starting');
      setError(null);
      try {
        const s = await api.getCoachSession(sessionId);
        if (run !== runRef.current) return false;
        adopt(s, run);
        return true;
      } catch (err) {
        if (run === runRef.current) setError(salesErrorMessage(err, 'Could not open that practice call.'));
        return false;
      } finally {
        if (run === runRef.current) setBusy(null);
      }
    },
    [adopt]
  );

  /** Send a seller turn. Resolves true when accepted (the caller clears its input). */
  const send = useCallback(
    async (content: string): Promise<boolean> => {
      if (!session) return false;
      const run = ++runRef.current;
      setBusy('sending');
      setError(null);
      try {
        const pending = await api.postCoachMessage(session.id, content);
        if (run !== runRef.current) return false;
        const mine: api.CoachMessage = {
          id: `local-${pending.id}`,
          role: 'user',
          status: 'ready',
          content,
          created_at: new Date().toISOString(),
        };
        // Drop a failed buyer turn the seller is now retrying past; the poll replaces the thread anyway.
        const kept = (session.messages ?? []).filter((m) => !(m.role === 'assistant' && m.status === 'failed'));
        adopt({ ...session, messages: [...kept, mine, pending] }, run);
        return true;
      } catch (err) {
        if (run !== runRef.current) return false;
        if (api.isReplyInProgress(err)) {
          setError('The buyer is still replying. Please wait.');
          // someone else's reply is in flight (another tab): follow it
          void api.getCoachSession(session.id).then((s) => run === runRef.current && adopt(s, run)).catch(() => {});
        } else if (api.errorCodeOf(err) === 'SESSION_ENDED') {
          setError(salesErrorMessage(err));
          void api.getCoachSession(session.id).then((s) => run === runRef.current && adopt(s, run)).catch(() => {});
        } else {
          setError(salesErrorMessage(err));
        }
        return false;
      } finally {
        if (run === runRef.current) setBusy(null);
      }
    },
    [session, adopt]
  );

  /** End the call and score it. Also the retry after a failed scorecard. */
  const end = useCallback(async (): Promise<boolean> => {
    if (!session) return false;
    const run = ++runRef.current;
    setBusy('ending');
    setError(null);
    try {
      const s = await api.endCoachSession(session.id);
      if (run !== runRef.current) return false;
      adopt(s, run);
      return true;
    } catch (err) {
      if (run !== runRef.current) return false;
      if (api.errorCodeOf(err) === 'SCORING_IN_PROGRESS') {
        // already being scored (another tab, or a double click): just follow it
        adopt({ ...session, status: 'scoring' }, run);
        return true;
      }
      setError(salesErrorMessage(err));
      return false;
    } finally {
      if (run === runRef.current) setBusy(null);
    }
  }, [session, adopt]);

  /** Resume polling after a "this is taking longer than expected" stop. */
  const checkAgain = useCallback(async () => {
    if (!session) return;
    const run = ++runRef.current;
    setSlow(false);
    try {
      const s = await api.getCoachSession(session.id);
      if (run === runRef.current) adopt(s, run);
    } catch (err) {
      if (run === runRef.current) {
        setError(salesErrorMessage(err));
        setSlow(true);
      }
    }
  }, [session, adopt]);

  const reset = useCallback(() => {
    runRef.current += 1;
    setSession(null);
    setBusy(null);
    setError(null);
    setSlow(false);
  }, []);

  const pending = api.pendingBuyerTurn(session?.messages);
  return {
    session,
    busy,
    error,
    slow,
    /** The buyer is writing a reply right now (input and End session stay disabled). */
    replying: !!pending && !slow,
    start,
    open,
    send,
    end,
    checkAgain,
    reset,
  };
}

/** The caller's own past sessions, newest first (no messages), for the setup screen. */
export function useRecentSessions() {
  const fetcher = useCallback(() => api.listCoachSessions({ limit: 5 }), []);
  return useLoader<api.CoachSession[]>(fetcher);
}

/** Every deal, for the deal pickers. */
export function useDealOptions() {
  return useLoader<api.Deal[]>(api.listAllDeals);
}

// ---------------------------------------------------------------- call prep

export function useCallPrep(dealId: string | null) {
  const fetcher = useMemo(() => (dealId ? () => api.getCallPrep(dealId) : null), [dealId]);
  const loader = useLoader<api.CallPrep | null>(fetcher);
  const { setData, data, status } = loader;
  const [requesting, setRequesting] = useState(false);
  const [slow, setSlow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const runRef = useRef(0);

  useEffect(() => {
    const run = runRef;
    return () => {
      run.current += 1;
    };
  }, []);

  // A new deal is a new conversation: cancel the old poll.
  const lastDeal = useRef(dealId);
  useEffect(() => {
    if (lastDeal.current !== dealId) {
      lastDeal.current = dealId;
      runRef.current += 1;
      queueMicrotask(() => {
        setSlow(false);
        setError(null);
        setRequesting(false);
      });
    }
  }, [dealId]);

  const watch = useCallback(
    async (forDeal: string, run: number) => {
      const until = Date.now() + CALL_PREP_TIMEOUT_MS;
      while (Date.now() < until) {
        await sleep(POLL_MS);
        if (run !== runRef.current) return;
        try {
          const next = await api.getCallPrep(forDeal);
          if (run !== runRef.current) return;
          setData(() => next);
          if (!next || next.status !== 'generating') {
            setSlow(false);
            return;
          }
        } catch (err) {
          if (run !== runRef.current) return;
          if (isForbiddenError(err) || api.isNotFoundError(err)) {
            setError(salesErrorMessage(err));
            return;
          }
        }
      }
      if (run === runRef.current) setSlow(true);
    },
    [setData]
  );

  // A prep that was still generating when the page loaded: follow it.
  const generatingId = data?.status === 'generating' && status === 'ready' ? data.id : null;
  useEffect(() => {
    if (!generatingId || !dealId) return;
    const run = ++runRef.current;
    queueMicrotask(() => void watch(dealId, run));
  }, [generatingId, dealId, watch]);

  /** Generate or regenerate. A 409 means one is already being written: follow it. */
  const generate = useCallback(async () => {
    if (!dealId) return;
    const run = ++runRef.current;
    setRequesting(true);
    setError(null);
    setSlow(false);
    try {
      const prep = await api.requestCallPrep(dealId);
      if (run !== runRef.current) return;
      setData(() => prep);
      void watch(dealId, run);
    } catch (err) {
      if (run !== runRef.current) return;
      if (api.isCallPrepInProgress(err)) {
        void watch(dealId, run);
      } else {
        setError(salesErrorMessage(err));
      }
    } finally {
      if (run === runRef.current) setRequesting(false);
    }
  }, [dealId, setData, watch]);

  const checkAgain = useCallback(() => {
    if (!dealId) return;
    const run = ++runRef.current;
    setSlow(false);
    void watch(dealId, run);
  }, [dealId, watch]);

  return {
    prep: data,
    loadStatus: status,
    loadError: loader.error,
    reload: loader.reload,
    requesting,
    /** True while the latest prep is `generating`, whether we asked or found it that way. */
    generating: requesting || (data?.status === 'generating' && !slow),
    slow,
    error,
    generate,
    checkAgain,
  };
}

// ---------------------------------------------------------------- analytics

export function useSalesAnalytics(range: { from: string; to: string } | null) {
  const from = range?.from;
  const to = range?.to;
  const fetcher = useMemo(() => (from && to ? () => api.getAnalytics({ from, to }) : null), [from, to]);
  return useLoader<api.SalesAnalytics>(fetcher);
}
