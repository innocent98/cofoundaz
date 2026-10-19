import { useState, useEffect, useCallback } from 'react';
import {
  businessBuilderApi,
  type BusinessPlanRun,
  type PlanDocument,
  type PlanOptions,
} from '@/lib/api/business-builder';
import { ApiError } from '@/lib/api/client';

export type PlanStatus =
  | 'checking'    // resolving whether a plan already exists (on mount)
  | 'setup'       // no plan yet, or the last run failed: readiness + options + generate
  | 'generating'  // job running, polling GET /plan every few seconds
  | 'ready'       // complete, document loaded
  | 'forbidden'   // 403 on generate
  | 'error';

const POLL_MS = 2500;
// The server now ends every run as complete or failed, so this is only a safety
// net against a dead worker: past it we stop polling and say so.
const SAFETY_MS = 5 * 60 * 1000;

/**
 * Drives the plan generator: POST /plan/generate (with options) then poll GET /plan,
 * which carries `progress` {done, total, stage}, until `complete` (fetch the Document)
 * or `failed` (`error` = over_budget | generation_failed).
 */
export function useBusinessPlan() {
  const [status, setStatus] = useState<PlanStatus>('checking');
  const [run, setRun] = useState<BusinessPlanRun | null>(null);
  const [doc, setDoc] = useState<PlanDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Failure of the last run (shown on the setup screen with a retry).
  const [failure, setFailure] = useState<string | null>(null);
  const [lastOptions, setLastOptions] = useState<PlanOptions | undefined>(undefined);
  const [active, setActive] = useState<{ startedAt: number } | null>(null);

  const loadDocument = useCallback(async (r: BusinessPlanRun) => {
    if (!r.document_id) {
      setStatus('error');
      setError('The plan finished but no document was returned.');
      return;
    }
    setDoc(await businessBuilderApi.getPlanDocument(r.document_id));
    setStatus('ready');
  }, []);

  // On mount: resume from the latest run.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await businessBuilderApi.getPlan();
        if (!alive) return;
        if (!r) return setStatus('setup');
        setRun(r);
        setLastOptions(r.options);
        if (r.status === 'complete') return await loadDocument(r);
        if (r.status === 'generating') {
          setStatus('generating');
          setActive({ startedAt: r.created_at ? new Date(r.created_at).getTime() : Date.now() });
          return;
        }
        setFailure(r.error ?? 'generation_failed');
        setStatus('setup');
      } catch {
        if (alive) setStatus('setup');
      }
    })();
    return () => {
      alive = false;
    };
  }, [loadDocument]);

  // Poll while a run is active.
  useEffect(() => {
    if (!active) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const deadline = active.startedAt + SAFETY_MS;

    const tick = async () => {
      if (!alive) return;
      if (Date.now() > deadline) {
        setStatus('error');
        setError('This is taking much longer than expected. Check back in a few minutes, or try again.');
        setActive(null);
        return;
      }
      try {
        const r = await businessBuilderApi.getPlan();
        if (!alive) return;
        if (r) setRun(r);
        if (r?.status === 'complete') {
          setActive(null);
          await loadDocument(r);
          return;
        }
        if (r?.status === 'failed') {
          setActive(null);
          setFailure(r.error ?? 'generation_failed');
          setStatus('setup');
          return;
        }
      } catch {
        // transient: keep polling
      }
      if (alive) timer = setTimeout(tick, POLL_MS);
    };
    timer = setTimeout(tick, 1200);
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
    };
  }, [active, loadDocument]);

  const generate = useCallback(async (options?: PlanOptions) => {
    setError(null);
    setFailure(null);
    setDoc(null);
    setLastOptions(options);
    setStatus('generating');
    setRun(null);
    try {
      await businessBuilderApi.generatePlan(options);
      setActive({ startedAt: Date.now() });
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) return setStatus('forbidden');
      setStatus('error');
      setError('Could not start plan generation. Please try again.');
    }
  }, []);

  /** Back to the setup screen (to change options or readiness) from a finished or errored state. */
  const reset = useCallback(() => {
    setActive(null);
    setDoc(null);
    setError(null);
    setFailure(null);
    setStatus('setup');
  }, []);

  /** Re-read the plan Document (after a section was regenerated). */
  const reloadDocument = useCallback(async () => {
    if (run?.document_id) setDoc(await businessBuilderApi.getPlanDocument(run.document_id));
  }, [run]);

  return { status, run, doc, error, failure, lastOptions, generate, reset, reloadDocument };
}
