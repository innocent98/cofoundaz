import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

const api = vi.hoisted(() => ({ requestExperimentDraft: vi.fn() }));
const jobs = vi.hoisted(() => ({ waitForJob: vi.fn() }));
vi.mock('@/lib/api/validation', () => api);
vi.mock('@/lib/api/bb-jobs', () => jobs);

import { ApiError } from '@/lib/api/client';
import { OVER_BUDGET_COPY, outcomeFromDraftResult, useExperimentDraft } from './useExperimentDraft';

const draft = {
  name: 'Same-Day Settlement Paid Pilot',
  headline: 'Settle Your Market Trades the Same Day',
  subheadline: 'x',
  cta_text: 'Reserve paid access',
  metric_type: 'preorder_click',
  target_conversion: 5,
  slug_suggestion: 'novapay-same-day',
  rationale: 'Why',
  assumption_ids: ['a1'],
};

beforeEach(() => {
  vi.clearAllMocks();
  api.requestExperimentDraft.mockResolvedValue('job-1');
});

describe('outcomeFromDraftResult', () => {
  it('ready gives the draft', () => {
    expect(outcomeFromDraftResult({ status: 'ready', draft })).toEqual({ ok: true, draft });
  });
  it('gone and over_budget give their own copy', () => {
    expect(outcomeFromDraftResult({ status: 'gone' })).toMatchObject({ ok: false, message: expect.stringContaining('deleted') });
    expect(outcomeFromDraftResult({ status: 'over_budget' })).toEqual({ ok: false, message: OVER_BUDGET_COPY });
    expect(OVER_BUDGET_COPY).toBe('AI is at its daily limit, try again tomorrow.');
  });
  it('anything else is a retry message', () => {
    expect(outcomeFromDraftResult(null).ok).toBe(false);
    expect(outcomeFromDraftResult({ status: 'ready' }).ok).toBe(false);
  });
});

describe('useExperimentDraft', () => {
  it('queues the job, polls it and returns the draft', async () => {
    jobs.waitForJob.mockResolvedValue({ state: 'succeeded', result: { status: 'ready', draft } });
    const { result } = renderHook(() => useExperimentDraft());
    let out: unknown;
    await act(async () => {
      out = await result.current.design('a1');
    });
    expect(api.requestExperimentDraft).toHaveBeenCalledWith('a1');
    expect(jobs.waitForJob).toHaveBeenCalledWith('job-1', { timeoutMs: 60000 });
    expect(out).toEqual({ ok: true, draft });
    expect(result.current.drafting).toBe(false);
  });

  it('reports a timed-out and a failed job honestly', async () => {
    const { result } = renderHook(() => useExperimentDraft());
    jobs.waitForJob.mockResolvedValueOnce({ state: 'timeout' });
    let out: { ok: boolean; message?: string } | undefined;
    await act(async () => { out = (await result.current.design('a1')) as typeof out; });
    expect(out?.ok).toBe(false);
    expect(out?.message).toContain('longer than usual');
    jobs.waitForJob.mockResolvedValueOnce({ state: 'failed', error: 'x' });
    await act(async () => { out = (await result.current.design('a1')) as typeof out; });
    expect(out?.message).toContain('Could not draft');
  });

  it('maps a 429 on enqueue to the over-budget copy and a 404 to gone', async () => {
    const { result } = renderHook(() => useExperimentDraft());
    api.requestExperimentDraft.mockRejectedValueOnce(new ApiError(429, 'Too Many', {}));
    let out: { ok: boolean; message?: string } | undefined;
    await act(async () => { out = (await result.current.design('a1')) as typeof out; });
    expect(out?.message).toBe(OVER_BUDGET_COPY);
    api.requestExperimentDraft.mockRejectedValueOnce(new ApiError(404, 'NF', {}));
    await act(async () => { out = (await result.current.design('a1')) as typeof out; });
    expect(out?.message).toContain('deleted');
  });
});
