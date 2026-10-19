import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ApiError } from './client';
import * as client from './client';
import { breakdownDoneCopy, interpretJob, pollBreakdown, startBreakdown } from './breakdown';

vi.mock('./client', async (orig) => ({ ...(await orig<typeof import('./client')>()), apiClient: vi.fn() }));

describe('breakdown api (shapes from the live captures)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('POSTs without a body and returns the job id from the 202', async () => {
    vi.mocked(client.apiClient).mockResolvedValueOnce({ data: { job_id: 'bcf0d900', status: 'queued' }, meta: null });
    expect(await startBreakdown('m1')).toEqual({ kind: 'started', jobId: 'bcf0d900' });
    expect(client.apiClient).toHaveBeenCalledWith('/roadmap/milestones/m1/breakdown', { method: 'POST' });
  });

  it('maps the 409 BREAKDOWN_IN_PROGRESS to in_progress and rethrows anything else', async () => {
    vi.mocked(client.apiClient).mockRejectedValueOnce(new ApiError(409, 'Conflict', { error: { code: 'BREAKDOWN_IN_PROGRESS' } }));
    expect(await startBreakdown('m1')).toEqual({ kind: 'in_progress' });
    vi.mocked(client.apiClient).mockRejectedValueOnce(new ApiError(403, 'Forbidden', {}));
    await expect(startBreakdown('m1')).rejects.toBeInstanceOf(ApiError);
  });

  it('keeps polling while queued or running, and reads every terminal state', () => {
    expect(interpretJob({ status: 'queued' })).toBeNull();
    expect(interpretJob({ status: 'running' })).toBeNull();
    expect(interpretJob({ status: 'failed' })).toEqual({ kind: 'failed' });
    expect(interpretJob({ status: 'succeeded', result: { status: 'ready', created_task_ids: ['t1'] } })).toEqual({
      kind: 'ready',
      createdTaskIds: ['t1'],
    });
    expect(interpretJob({ status: 'succeeded', result: { status: 'over_budget' } })).toEqual({ kind: 'over_budget' });
    expect(interpretJob({ status: 'succeeded', result: { status: 'gone' } })).toEqual({ kind: 'gone' });
    expect(interpretJob({ status: 'succeeded', result: null })).toEqual({ kind: 'failed' });
  });

  it('polls /jobs/{id}', async () => {
    vi.mocked(client.apiClient).mockResolvedValueOnce({ data: { status: 'queued' } });
    expect(await pollBreakdown('j1')).toBeNull();
    expect(client.apiClient).toHaveBeenCalledWith('/jobs/j1');
  });

  it('words the result honestly, including when nothing new was added', () => {
    expect(breakdownDoneCopy(0)).toBe('Nothing new to add, this milestone already covers it.');
    expect(breakdownDoneCopy(1)).toBe('Added 1 task.');
    expect(breakdownDoneCopy(4)).toBe('Added 4 tasks.');
  });
});
