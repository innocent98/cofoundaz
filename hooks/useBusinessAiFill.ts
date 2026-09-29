'use client';

import { useCallback, useState } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';
import { businessBuilderApi } from '@/lib/api/business-builder';

// Guide §4/§10: AI-fill is a DEFERRED seam. POST .../ai-fill enqueues a job
// (202, status "queued") but NO worker drains it yet — the job stays "queued"
// forever and the canvas/record is never actually filled. So we never poll for
// "succeeded" or fabricate results; we honestly enqueue and report "requested".

export interface AiFillResult {
  ok: boolean;
  jobId?: string;
  status?: string; // "queued" today; "succeeded"/"failed"/"skipped" are forward-looking
  skipped?: boolean;
  error?: string;
}

function apiErr(err: unknown): string {
  if (err instanceof ApiError) {
    const d = err.data as { error?: { message?: string } } | undefined;
    if (err.status === 403) return 'Only a founder or team member can request an AI draft.';
    if (err.status === 429) return 'AI personalization is temporarily paused — your daily budget resets soon.';
    return d?.error?.message || 'Could not request an AI draft.';
  }
  return 'Could not request an AI draft.';
}

export function useBusinessAiFill() {
  const [requesting, setRequesting] = useState<string | null>(null);

  const requestCanvasFill = useCallback(async (type: string): Promise<AiFillResult> => {
    setRequesting(type);
    try {
      const res = (await businessBuilderApi.aiFillCanvas(type)) as { job_id?: string; status?: string; skipped?: boolean };
      const isSkipped = res?.status === 'skipped' || Boolean(res?.skipped);
      return { ok: true, jobId: res?.job_id, status: res?.status ?? (isSkipped ? 'skipped' : 'queued'), skipped: isSkipped };
    } catch (err) {
      return { ok: false, error: apiErr(err) };
    } finally {
      setRequesting(null);
    }
  }, []);

  const requestRecordFill = useCallback(async (kind: string): Promise<AiFillResult> => {
    setRequesting(kind);
    try {
      const res = await apiClient<{ data?: { job_id?: string; status?: string; skipped?: boolean } }>(
        `/business-builder/${kind}/ai-fill`,
        { method: 'POST' }
      );
      const d = res?.data ?? (res as { job_id?: string; status?: string; skipped?: boolean });
      const isSkipped = d?.status === 'skipped' || Boolean(d?.skipped);
      return { ok: true, jobId: d?.job_id, status: d?.status ?? (isSkipped ? 'skipped' : 'queued'), skipped: isSkipped };
    } catch (err) {
      return { ok: false, error: apiErr(err) };
    } finally {
      setRequesting(null);
    }
  }, []);

  return { requesting, requestCanvasFill, requestRecordFill };
}
