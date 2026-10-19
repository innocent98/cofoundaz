'use client';

import { useCallback, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { apiErrorInfo } from '@/lib/api/api-error';
import { waitForJob } from '@/lib/api/bb-jobs';
import { businessBuilderApi } from '@/lib/api/business-builder';

// AI-fill is a real async job: POST .../ai-fill enqueues (202 {job_id, status})
// and the worker fills the empty blocks/fields. We poll `GET /jobs/{job_id}`
// and then let the caller re-fetch to show the drafted content. We never
// fabricate a result; a stuck job resolves to an honest "timeout".

export type AiFillStatus = 'succeeded' | 'failed' | 'skipped' | 'timeout';

export interface AiFillResult {
  ok: boolean;
  status?: AiFillStatus;
  error?: string;
  /** Plain-language outcome for a fill that changed nothing. */
  message?: string;
}

/** Which kind of fill ran: it decides the wording when nothing was drafted. */
export type FillKind = 'canvas' | 'records';

export const NOTHING_NEW_MESSAGE: Record<FillKind, string> = {
  canvas: 'Every section already has content. Use the AI button on a section to add ideas.',
  records: 'Your list already has entries. Add more by hand, or use the AI buttons on a record.',
};

interface RawEnqueue {
  job_id?: string;
  status?: string;
  skipped?: boolean;
}

interface JobResult {
  status?: string;
  filled?: string[];
  added?: number;
}

export const OVER_BUDGET_MESSAGE = 'AI is at its daily limit, try again tomorrow.';

function enqueueError(err: unknown): string {
  const info = apiErrorInfo(err, 'Could not request an AI draft.');
  if (info.status === 403) return 'Only a founder or team member can request an AI draft.';
  if (info.status === 429) return OVER_BUDGET_MESSAGE;
  return info.message;
}

/**
 * Maps a finished job's own `result` to the shared fill outcome. A job with no
 * result (an older API) is treated as a normal fill.
 */
export function outcomeFromResult(result: JobResult | null | undefined, kind: FillKind = 'canvas'): AiFillResult {
  switch (result?.status) {
    case 'over_budget':
      return { ok: false, error: OVER_BUDGET_MESSAGE };
    case 'gone':
      return { ok: false, error: 'This item is no longer available.' };
    case 'nothing_new':
    case 'skipped':
      return { ok: true, status: 'skipped', message: NOTHING_NEW_MESSAGE[kind] };
    default:
      return { ok: true, status: 'succeeded' };
  }
}

export function useBusinessAiFill() {
  const [requesting, setRequesting] = useState<string | null>(null);

  const run = useCallback(
    async (target: string, kind: FillKind, enqueue: () => Promise<RawEnqueue>): Promise<AiFillResult> => {
      setRequesting(target);
      try {
        const res = await enqueue();
        if (res?.status === 'skipped' || res?.skipped) return { ok: true, status: 'skipped', message: NOTHING_NEW_MESSAGE[kind] };
        // No job to poll (and not skipped): refetch optimistically.
        if (!res?.job_id) return { ok: true, status: 'succeeded' };
        const out = await waitForJob<JobResult>(res.job_id, { timeoutMs: 60000 });
        if (out.state === 'timeout') return { ok: true, status: 'timeout' };
        if (out.state === 'failed') return { ok: false, status: 'failed' };
        return outcomeFromResult(out.result, kind);
      } catch (err) {
        return { ok: false, error: enqueueError(err) };
      } finally {
        setRequesting(null);
      }
    },
    []
  );

  const requestCanvasFill = useCallback(
    (type: string): Promise<AiFillResult> => run(type, 'canvas', () => businessBuilderApi.aiFillCanvas(type)),
    [run]
  );

  const requestRecordFill = useCallback(
    (kind: string): Promise<AiFillResult> =>
      run(kind, 'records', async () => {
        const res = await apiClient<{ data?: RawEnqueue }>(`/business-builder/${kind}/ai-fill`, {
          method: 'POST',
        });
        return res?.data ?? (res as RawEnqueue);
      }),
    [run]
  );

  return { requesting, requestCanvasFill, requestRecordFill };
}
