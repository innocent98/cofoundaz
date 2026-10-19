import { apiClient } from './client';

/**
 * Every Business Builder AI feature is a job: POST returns 202 `{job_id}`, then
 * `GET /jobs/{id}` until `status` is `succeeded` or `failed`. The job's `result`
 * carries its own `status` (ready / nothing_new / over_budget / gone).
 */
export interface JobRecord<T> {
  status: string;
  result: T | null;
  error: string | null;
}

export type JobOutcome<T> =
  | { state: 'succeeded'; result: T | null }
  | { state: 'failed'; error: string | null }
  | { state: 'timeout' };

export interface WaitOptions<T> {
  intervalMs?: number;
  timeoutMs?: number;
  fetchJob?: (id: string) => Promise<JobRecord<T>>;
  sleep?: (ms: number) => Promise<void>;
}

const DONE = new Set(['succeeded', 'success', 'complete', 'completed', 'done']);
const FAILED = new Set(['failed', 'error']);

async function fetchJobFromApi<T>(id: string): Promise<JobRecord<T>> {
  const res = await apiClient<{ data?: Partial<JobRecord<T>> }>(`/jobs/${id}`);
  const d = res?.data ?? (res as Partial<JobRecord<T>>);
  return { status: String(d?.status ?? '').toLowerCase(), result: (d?.result as T) ?? null, error: d?.error ?? null };
}

export async function waitForJob<T>(jobId: string, opts: WaitOptions<T> = {}): Promise<JobOutcome<T>> {
  const interval = opts.intervalMs ?? 2000;
  const timeout = opts.timeoutMs ?? 90000;
  const fetchJob = opts.fetchJob ?? fetchJobFromApi<T>;
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  let waited = 0;
  while (waited <= timeout) {
    await sleep(interval);
    waited += interval;
    try {
      const job = await fetchJob(jobId);
      if (DONE.has(job.status)) return { state: 'succeeded', result: job.result };
      if (FAILED.has(job.status)) return { state: 'failed', error: job.error };
      // queued / running / unknown: keep polling
    } catch {
      // transient error: keep polling until the deadline
    }
  }
  return { state: 'timeout' };
}
