import { ApiError, apiClient } from './client';

// POST /roadmap/milestones/{id}/breakdown then poll GET /jobs/{id} (BE guide:
// fe-integration-guide-roadmap-prd.md §1). The AI only appends tasks.

export type BreakdownOutcome =
  | { kind: 'ready'; createdTaskIds: string[] }
  | { kind: 'over_budget' }
  | { kind: 'gone' }
  | { kind: 'failed' };

export type BreakdownStart = { kind: 'started'; jobId: string } | { kind: 'in_progress' };

export const BREAKDOWN_POLL_MS = 2000;
export const BREAKDOWN_TIMEOUT_MS = 60_000;

export async function startBreakdown(milestoneId: string): Promise<BreakdownStart> {
  try {
    const res = await apiClient<{ data: { job_id: string } }>(`/roadmap/milestones/${milestoneId}/breakdown`, {
      method: 'POST',
    });
    return { kind: 'started', jobId: res.data.job_id };
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) return { kind: 'in_progress' };
    throw err;
  }
}

interface RawJob {
  status: string;
  result?: { status?: string; created_task_ids?: string[] } | null;
}

/** null while the job is still queued or running. */
export function interpretJob(job: RawJob): BreakdownOutcome | null {
  if (job.status === 'failed') return { kind: 'failed' };
  if (job.status !== 'succeeded') return null;
  const status = job.result?.status;
  if (status === 'over_budget') return { kind: 'over_budget' };
  if (status === 'gone') return { kind: 'gone' };
  if (status === 'ready') return { kind: 'ready', createdTaskIds: job.result?.created_task_ids ?? [] };
  return { kind: 'failed' };
}

export async function pollBreakdown(jobId: string): Promise<BreakdownOutcome | null> {
  const res = await apiClient<{ data: RawJob }>(`/jobs/${jobId}`);
  return interpretJob(res.data);
}

export const BREAKDOWN_COPY = {
  working: 'Breaking this down…',
  inProgress: "I'm already breaking this milestone down.",
  overBudget: 'AI is at its daily limit, try again tomorrow.',
  failed: "Couldn't break this down. Try again.",
  slow: 'Taking longer than usual, check back shortly.',
  gone: 'That milestone no longer exists.',
} as const;

export function breakdownDoneCopy(count: number): string {
  if (count === 0) return 'Nothing new to add, this milestone already covers it.';
  return count === 1 ? 'Added 1 task.' : `Added ${count} tasks.`;
}
