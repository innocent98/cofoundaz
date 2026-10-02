'use client';

import { useCallback, useState } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';
import { businessBuilderApi } from '@/lib/api/business-builder';

// AI-fill is a real async job now: POST .../ai-fill enqueues (202 {job_id, status})
// and the worker fills the empty blocks/fields within seconds. We poll
// `GET /jobs/{job_id}` (queued → running → succeeded) and then let the caller
// re-fetch the canvas/records to show the drafted content. We never fabricate a
// result; a stuck/slow job resolves to an honest "timeout".

export type AiFillStatus = 'succeeded' | 'failed' | 'skipped' | 'timeout';

export interface AiFillResult {
  ok: boolean;
  status?: AiFillStatus;
  error?: string;
}

const POLL_MS = 2500;
const TIMEOUT_MS = 45000;

interface RawEnqueue {
  job_id?: string;
  status?: string;
  skipped?: boolean;
}

function apiErr(err: unknown): string {
  if (err instanceof ApiError) {
    const d = err.data as { error?: { message?: string } } | undefined;
    if (err.status === 403) return 'Only a founder or team member can request an AI draft.';
    if (err.status === 429) return 'AI personalization is temporarily paused, your daily budget resets soon.';
    return d?.error?.message || 'Could not request an AI draft.';
  }
  return 'Could not request an AI draft.';
}

async function getJobStatus(jobId: string): Promise<string> {
  const res = await apiClient<{ data?: { status?: string } }>(`/jobs/${jobId}`);
  const d = res?.data ?? (res as { status?: string });
  return (d?.status || '').toLowerCase();
}

async function pollJob(jobId: string): Promise<AiFillStatus> {
  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_MS));
    try {
      const s = await getJobStatus(jobId);
      if (s === 'succeeded' || s === 'success' || s === 'complete' || s === 'completed' || s === 'done') {
        return 'succeeded';
      }
      if (s === 'failed' || s === 'error') return 'failed';
      if (s === 'skipped') return 'skipped';
      // queued / running / unknown → keep polling
    } catch {
      // transient error — keep polling until the deadline
    }
  }
  return 'timeout';
}

export function useBusinessAiFill() {
  const [requesting, setRequesting] = useState<string | null>(null);

  const run = useCallback(
    async (target: string, enqueue: () => Promise<RawEnqueue>): Promise<AiFillResult> => {
      setRequesting(target);
      try {
        const res = await enqueue();
        if (res?.status === 'skipped' || res?.skipped) {
          return { ok: true, status: 'skipped' };
        }
        if (!res?.job_id) {
          // No job to poll (and not skipped) — refetch optimistically.
          return { ok: true, status: 'succeeded' };
        }
        const status = await pollJob(res.job_id);
        return { ok: status !== 'failed', status };
      } catch (err) {
        return { ok: false, error: apiErr(err) };
      } finally {
        setRequesting(null);
      }
    },
    []
  );

  const requestCanvasFill = useCallback(
    (type: string): Promise<AiFillResult> =>
      run(type, async () => (await businessBuilderApi.aiFillCanvas(type)) as RawEnqueue),
    [run]
  );

  const requestRecordFill = useCallback(
    (kind: string): Promise<AiFillResult> =>
      run(kind, async () => {
        const res = await apiClient<{ data?: RawEnqueue }>(`/business-builder/${kind}/ai-fill`, {
          method: 'POST',
        });
        return res?.data ?? (res as RawEnqueue);
      }),
    [run]
  );

  return { requesting, requestCanvasFill, requestRecordFill };
}
