import { useCallback, useEffect, useRef, useState } from 'react';
import {
  answerQaSession,
  endQaSession,
  getQaSession,
  listQaSessions,
  readinessError,
  startQaSession,
  type QaFocus,
  type QaIntensity,
  type QaSession,
  type QaSessionSummary,
  type ReadinessError,
} from '@/lib/api/readiness';

const POLL_MS = 2000;
const POLL_LIMIT_MS = 90_000;

/** One line for each way an answer or a start can be refused. */
export function qaActionMessage(err: ReadinessError): string {
  switch (err.code) {
    case 'AI_BUDGET_LOW':
    case 'AI_BUDGET_EXHAUSTED':
      return err.message;
    case 'SESSION_ACTIVE':
      return 'You already have a session in progress. Picking it back up.';
    case 'SESSION_NOT_ACTIVE':
      return 'This session has ended.';
    default:
      return err.message;
  }
}

export function useQaSession(canPlay: boolean, preferredId: string | null) {
  const [sessions, setSessions] = useState<QaSessionSummary[] | null>(null);
  const [session, setSession] = useState<QaSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ReadinessError | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [budgetLow, setBudgetLow] = useState(false);
  const [busy, setBusy] = useState<'start' | 'answer' | 'end' | null>(null);
  const [slow, setSlow] = useState(false);
  const [version, setVersion] = useState(0);
  const [capReached, setCapReached] = useState(false);
  const alive = useRef(true);
  const pollToken = useRef(0);
  const sessionRef = useRef<QaSession | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    alive.current = true;
    const token = pollToken;
    return () => {
      alive.current = false;
      // A counter that cancels running poll loops, not a DOM ref.
      token.current++;
    };
  }, []);

  const refreshList = useCallback(async () => {
    const list = await listQaSessions();
    if (alive.current) setSessions(list);
    return list;
  }, []);

  const poll = useCallback(async (id: string) => {
    const token = ++pollToken.current;
    setSlow(false);
    const started = Date.now();
    for (;;) {
      await new Promise((r) => setTimeout(r, POLL_MS));
      if (token !== pollToken.current || !alive.current) return;
      try {
        const s = await getQaSession(id);
        if (token !== pollToken.current || !alive.current) return;
        setSession(s);
        if (s.status !== 'ending') {
          const list = await listQaSessions().catch(() => null);
          if (list && alive.current) setSessions(list);
          return;
        }
      } catch {
        // transient: keep polling until the deadline
      }
      if (Date.now() - started > POLL_LIMIT_MS) {
        if (alive.current) setSlow(true);
        return;
      }
    }
  }, []);

  const open = useCallback(
    async (id: string) => {
      setActionError(null);
      setCapReached(false);
      setBudgetLow(false);
      try {
        const s = await getQaSession(id);
        if (!alive.current) return;
        setSession(s);
        if (s.status === 'ending') void poll(id);
      } catch (err) {
        if (alive.current) setActionError(readinessError(err, 'We could not open that session.').message);
      }
    },
    [poll],
  );

  // Load the list; a founder resumes the open session (or the one being scored, or the one a link points to).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const list = await listQaSessions();
        if (!active) return;
        setSessions(list);
        setError(null);
        if (!canPlay) return;
        const target =
          list.find((s) => s.id === preferredId) ?? list.find((s) => s.status === 'active') ?? list.find((s) => s.status === 'ending');
        if (target) {
          const s = await getQaSession(target.id);
          if (!active) return;
          setSession(s);
          if (s.status === 'ending') void poll(s.id);
        }
      } catch (err) {
        if (active) setError(readinessError(err, 'We could not load your mock sessions.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [canPlay, preferredId, version, poll]);

  const reload = useCallback(() => {
    setLoading(true);
    setVersion((v) => v + 1);
  }, []);

  const start = useCallback(
    async (focus: QaFocus, intensity: QaIntensity) => {
      setActionError(null);
      setBudgetLow(false);
      setBusy('start');
      try {
        const res = await startQaSession(focus, intensity);
        if (!alive.current) return;
        setSession(res.session);
        void refreshList().catch(() => undefined);
      } catch (err) {
        const re = readinessError(err, 'We could not start the session. Try again.');
        if (re.code === 'SESSION_ACTIVE') {
          setActionError(qaActionMessage(re));
          const list = await refreshList().catch(() => null);
          const active = list?.find((s) => s.status === 'active');
          if (active) await open(active.id);
        } else if (alive.current) {
          setActionError(qaActionMessage(re));
        }
      } finally {
        if (alive.current) setBusy(null);
      }
    },
    [open, refreshList],
  );

  /** Returns false when the answer was not recorded, so the page can keep the text in the box. */
  const send = useCallback(
    async (text: string): Promise<boolean> => {
      const current = sessionRef.current;
      if (!current || current.status !== 'active') return false;
      setActionError(null);
      setBudgetLow(false);
      setBusy('answer');
      const now = new Date().toISOString();
      setSession({ ...current, transcript: [...(current.transcript ?? []), { at: now, role: 'founder', text }] });
      try {
        const res = await answerQaSession(current.id, text, current.turns);
        if (!alive.current) return true;
        const next: QaSession = {
          ...current,
          ...res.session,
          transcript: [
            ...(current.transcript ?? []),
            { at: now, role: 'founder', text },
            ...(res.reply ? [{ at: new Date().toISOString(), role: 'investor' as const, text: res.reply }] : []),
          ],
        };
        setSession(next);
        if (res.ended) {
          // The 10th answer ends the session by itself and starts scoring.
          setCapReached(true);
          void poll(current.id);
        }
        return true;
      } catch (err) {
        const re = readinessError(err, 'That answer was not sent. Try again.');
        if (re.code === 'TURN_MISMATCH' || re.code === 'SESSION_NOT_ACTIVE') {
          // The answer was already recorded: show the investor's reply from the server copy.
          await open(current.id);
          if (alive.current) setActionError(re.message);
          return re.code === 'TURN_MISMATCH';
        }
        if (alive.current) {
          setSession(current);
          setActionError(qaActionMessage(re));
          if (re.code === 'AI_BUDGET_LOW' || re.code === 'AI_BUDGET_EXHAUSTED') setBudgetLow(true);
        }
        return false;
      } finally {
        if (alive.current) setBusy(null);
      }
    },
    [open, poll],
  );

  /** End and score. Also re-queues scoring on a failed session whose transcript is still kept. */
  const end = useCallback(async () => {
    const current = sessionRef.current;
    if (!current) return;
    setActionError(null);
    setBusy('end');
    try {
      const s = await endQaSession(current.id);
      if (!alive.current) return;
      if (s.status === 'abandoned') {
        setSession(null);
        void refreshList().catch(() => undefined);
        return;
      }
      setBudgetLow(false);
      setSession({ ...current, ...s });
      void poll(current.id);
    } catch (err) {
      if (alive.current) setActionError(readinessError(err, 'We could not end the session. Try again.').message);
    } finally {
      if (alive.current) setBusy(null);
    }
  }, [poll, refreshList]);

  const backToSetup = useCallback(() => {
    pollToken.current++;
    setCapReached(false);
    setSession(null);
    setActionError(null);
    setBudgetLow(false);
    void refreshList().catch(() => undefined);
  }, [refreshList]);

  const resumePolling = useCallback(() => {
    if (sessionRef.current) void poll(sessionRef.current.id);
  }, [poll]);

  return { sessions, session, loading, error, actionError, budgetLow, busy, slow, capReached, start, send, end, open, backToSetup, resumePolling, reload };
}
