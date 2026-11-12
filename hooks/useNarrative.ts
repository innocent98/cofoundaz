import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getLatestCheck,
  getNarrative,
  putNarrative,
  readinessError,
  runNarrativeCheck,
  type NarrativeCheck,
  type NarrativeDraft,
  type ReadinessError,
} from '@/lib/api/readiness';

const AUTOSAVE_MS = 1000;
const POLL_MS = 2000;
const POLL_LIMIT_MS = 60_000;

export type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export function checkStartMessage(err: ReadinessError): string {
  if (err.code === 'NOTHING_TO_CHECK') return 'Write your narrative or have your pitch deck reviewed first, then check it.';
  if (err.status === 429 && !err.code) return 'You are checking too often. Wait a minute and try again.';
  return err.message;
}

export function useNarrative(canWrite: boolean) {
  const [draft, setDraft] = useState<NarrativeDraft | null>(null);
  const [body, setBody] = useState('');
  const [check, setCheck] = useState<NarrativeCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ReadinessError | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [reusedNote, setReusedNote] = useState(false);
  const [slow, setSlow] = useState(false);
  const [version, setVersion] = useState(0);

  const alive = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestBody = useRef('');
  const savedBody = useRef('');
  const inFlight = useRef<Promise<void> | null>(null);
  const pollToken = useRef(0);

  useEffect(() => {
    alive.current = true;
    const token = pollToken;
    const pending = timer;
    return () => {
      alive.current = false;
      // Refs here are a counter and a timer handle, not DOM nodes.
      token.current++;
      if (pending.current) clearTimeout(pending.current);
    };
  }, []);

  const pollCheck = useCallback(async () => {
    const token = ++pollToken.current;
    setSlow(false);
    setChecking(true);
    const started = Date.now();
    try {
      for (;;) {
        await new Promise((r) => setTimeout(r, POLL_MS));
        if (token !== pollToken.current || !alive.current) return;
        try {
          const c = await getLatestCheck();
          if (token !== pollToken.current || !alive.current) return;
          setCheck(c);
          if (!c || c.status === 'ready' || c.status === 'failed') return;
        } catch {
          // transient: keep polling until the deadline
        }
        if (Date.now() - started > POLL_LIMIT_MS) {
          if (alive.current) setSlow(true);
          return;
        }
      }
    } finally {
      if (alive.current && token === pollToken.current) setChecking(false);
    }
  }, []);

  // Load the draft and the latest check; pick the polling back up if a check is still running.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [d, c] = await Promise.all([getNarrative(), getLatestCheck()]);
        if (!active) return;
        setDraft(d);
        setBody(d.body);
        latestBody.current = d.body;
        savedBody.current = d.body;
        setCheck(c);
        setError(null);
        if (c && (c.status === 'queued' || c.status === 'running')) void pollCheck();
      } catch (err) {
        if (active) setError(readinessError(err, 'We could not load your narrative.'));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [version, pollCheck]);

  const reload = useCallback(() => {
    setLoading(true);
    setVersion((v) => v + 1);
  }, []);

  const doSave = useCallback(async () => {
    const text = latestBody.current;
    if (text === savedBody.current) {
      setSaveState((s) => (s === 'dirty' ? 'saved' : s));
      return;
    }
    setSaveState('saving');
    setSaveError(null);
    try {
      const d = await putNarrative(text);
      if (!alive.current) return;
      savedBody.current = text;
      setDraft(d);
      setSaveState(latestBody.current === text ? 'saved' : 'dirty');
      // The draft changed, so a finished check may now be stale: refresh it quietly.
      void getLatestCheck()
        .then((c) => alive.current && c && setCheck(c))
        .catch(() => undefined);
    } catch (err) {
      if (!alive.current) return;
      const re = readinessError(err, 'We could not save your draft. Your text is still here; try again.');
      setSaveState('error');
      setSaveError(re.fieldErrors[''] ?? re.message);
    }
  }, []);

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    // Serialise: wait for a save in flight, then send what is newest.
    if (inFlight.current) await inFlight.current;
    if (latestBody.current !== savedBody.current) {
      inFlight.current = doSave().finally(() => {
        inFlight.current = null;
      });
      await inFlight.current;
    }
  }, [doSave]);

  const edit = useCallback(
    (text: string) => {
      if (!canWrite) return;
      setBody(text);
      latestBody.current = text;
      setSaveState('dirty');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), AUTOSAVE_MS);
    },
    [canWrite, flush],
  );

  const runCheck = useCallback(async () => {
    setCheckError(null);
    setReusedNote(false);
    setChecking(true);
    try {
      await flush();
      if (savedBody.current !== latestBody.current) {
        setCheckError('Your draft could not be saved, so it was not checked. Fix the save error first.');
        setChecking(false);
        return;
      }
      const res = await runNarrativeCheck();
      if (!alive.current) return;
      setCheck(res.check);
      if (res.outcome === 'reused') {
        setReusedNote(true);
        setChecking(false);
      } else {
        void pollCheck();
      }
    } catch (err) {
      if (!alive.current) return;
      setCheckError(checkStartMessage(readinessError(err, 'We could not start the check. Try again.')));
      setChecking(false);
    }
  }, [flush, pollCheck]);

  const resumePolling = useCallback(() => void pollCheck(), [pollCheck]);

  return { draft, body, check, loading, error, saveState, saveError, checking, checkError, reusedNote, slow, edit, flush, runCheck, resumePolling, reload };
}
