import { useState, useEffect, useCallback } from 'react';
import { businessBuilderApi, type PlanDocument } from '@/lib/api/business-builder';
import { ApiError } from '@/lib/api/client';

export type PlanStatus =
  | 'checking'    // resolving whether a plan already exists (on mount)
  | 'idle'        // no plan yet — ready to generate
  | 'generating'  // job running, polling GET /plan
  | 'ready'       // complete — document loaded
  | 'timeout'     // still generating after the bounded wait (guide §4) — offer retry
  | 'forbidden'   // 403 — non-editor role
  | 'error';

const POLL_MS = 4000;      // guide §3 suggests 3–5s
const TIMEOUT_MS = 120000; // guide §4: give up after ~2 minutes and offer retry

/**
 * Drives the async business-plan generator (guide: ai-business-plan).
 * POST /plan/generate → poll GET /plan until `complete` → fetch the Document.
 * A stuck `generating` is indistinguishable from "still working" server-side, so
 * we bound the poll (2 min) and surface a retry rather than looping forever.
 */
export function useBusinessPlan() {
  const [status, setStatus] = useState<PlanStatus>('checking');
  const [doc, setDoc] = useState<PlanDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Presence of a run (with its start time) drives the polling effect below.
  const [run, setRun] = useState<{ startedAt: number } | null>(null);

  // On mount: resume from the latest run (safe per guide §3.5).
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await businessBuilderApi.getPlan();
        if (!active) return;
        if (!r) {
          setStatus('idle');
          return;
        }
        if (r.status === 'complete') {
          if (r.document_id) {
            const d = await businessBuilderApi.getPlanDocument(r.document_id);
            if (active) {
              setDoc(d);
              setStatus('ready');
            }
          } else if (active) {
            setStatus('error');
            setError('The plan finished but no document was returned.');
          }
          return;
        }
        if (r.status === 'generating') {
          // Count the wait from when the run actually started, so a long-stuck
          // run resolves straight to the retry state instead of waiting again.
          const startedAt = r.created_at ? new Date(r.created_at).getTime() : Date.now();
          setStatus('generating');
          setRun({ startedAt });
          return;
        }
        setStatus('idle');
      } catch {
        if (active) setStatus('idle');
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Polling effect — runs whenever a run is active. Self-contained: the recursive
  // `tick` is local, so there's no self-referential callback to lint around.
  useEffect(() => {
    if (!run) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const deadline = run.startedAt + TIMEOUT_MS;

    const tick = async () => {
      if (!active) return;
      if (Date.now() > deadline) {
        setStatus('timeout');
        setRun(null);
        return;
      }
      try {
        const r = await businessBuilderApi.getPlan();
        if (!active) return;
        if (r?.status === 'complete') {
          if (r.document_id) {
            const d = await businessBuilderApi.getPlanDocument(r.document_id);
            if (active) {
              setDoc(d);
              setStatus('ready');
            }
          } else {
            setStatus('error');
            setError('The plan finished but no document was returned.');
          }
          setRun(null);
          return;
        }
        if (r?.status === 'failed') {
          setStatus('error');
          setError('Plan generation failed. Please try again.');
          setRun(null);
          return;
        }
        timer = setTimeout(tick, POLL_MS);
      } catch {
        if (active) timer = setTimeout(tick, POLL_MS);
      }
    };

    timer = setTimeout(tick, POLL_MS);
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [run]);

  const generate = useCallback(async () => {
    setError(null);
    setDoc(null);
    setStatus('generating');
    try {
      await businessBuilderApi.generatePlan();
      setRun({ startedAt: Date.now() });
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setStatus('forbidden');
        return;
      }
      setStatus('error');
      setError('Could not start plan generation. Please try again.');
    }
  }, []);

  const reset = useCallback(() => {
    setRun(null);
    setDoc(null);
    setError(null);
    setStatus('idle');
  }, []);

  return { status, doc, error, generate, reset };
}
