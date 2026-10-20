import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

const api = vi.hoisted(() => ({
  listFeedback: vi.fn(),
  createFeedback: vi.fn(),
  updateFeedback: vi.fn(),
  deleteFeedback: vi.fn(),
  restoreFeedback: vi.fn(),
  requestFeedbackClustering: vi.fn(),
  getFeedbackThemes: vi.fn(),
  sendThemeToRoadmap: vi.fn(),
  listRoadmapMilestones: vi.fn(),
}));
const jobs = vi.hoisted(() => ({ waitForJob: vi.fn() }));
vi.mock('@/lib/api/validation', () => api);
vi.mock('@/lib/api/bb-jobs', () => jobs);

import { ApiError } from '@/lib/api/client';
import { defaultMilestoneId, outcomeFromClusterResult, useFeedback } from './useFeedback';
import { formatReceivedOn, insightInputsLine, todayIso, validateFeedbackDraft } from '@/lib/validation-format';

const apiErr = (status: number, code: string, message: string) =>
  new ApiError(status, 'x', { error: { code, message, field_errors: [] } });

beforeEach(() => {
  vi.clearAllMocks();
  api.listFeedback.mockResolvedValue({ items: [], counts: { interview: 0, survey: 0, in_app: 0, email: 0 } });
  api.getFeedbackThemes.mockResolvedValue({ run: null, themes: [] });
});

describe('cluster job outcomes', () => {
  it('maps ready / over_budget / empty', () => {
    expect(outcomeFromClusterResult({ status: 'ready', run_id: 'r' })).toEqual({ ok: true });
    expect(outcomeFromClusterResult({ status: 'over_budget' })).toMatchObject({ ok: false, kind: 'over_budget', message: 'AI is at its daily limit, try again tomorrow.' });
    expect(outcomeFromClusterResult({ status: 'empty' })).toMatchObject({ ok: false, kind: 'empty' });
    expect(outcomeFromClusterResult(null)).toMatchObject({ ok: false, kind: 'error' });
  });
});

describe('defaultMilestoneId', () => {
  it('is the first milestone that is not done', () => {
    expect(
      defaultMilestoneId([
        { id: 'a', title: 'A', done: true, taskIds: [] },
        { id: 'b', title: 'B', done: false, taskIds: [] },
        { id: 'c', title: 'C', done: false, taskIds: [] },
      ])
    ).toBe('b');
    expect(defaultMilestoneId([{ id: 'a', title: 'A', done: true, taskIds: [] }])).toBeNull();
  });
});

describe('useFeedback.findThemes', () => {
  it('refetches the themes when the run is ready', async () => {
    api.requestFeedbackClustering.mockResolvedValue('job');
    jobs.waitForJob.mockResolvedValue({ state: 'succeeded', result: { status: 'ready', run_id: 'r' } });
    const { result } = renderHook(() => useFeedback());
    await waitFor(() => expect(result.current.loading).toBe(false));
    api.getFeedbackThemes.mockClear();
    let out: unknown;
    await act(async () => {
      out = await result.current.findThemes();
    });
    expect(out).toEqual({ ok: true });
    expect(jobs.waitForJob).toHaveBeenCalledWith('job', { timeoutMs: 90000 });
    expect(api.getFeedbackThemes).toHaveBeenCalledTimes(1);
  });

  it('says still working on timeout and shows the server copy for NOTHING_TO_CLUSTER', async () => {
    const { result } = renderHook(() => useFeedback());
    await waitFor(() => expect(result.current.loading).toBe(false));
    api.requestFeedbackClustering.mockResolvedValue('job');
    jobs.waitForJob.mockResolvedValue({ state: 'timeout' });
    let out: unknown;
    await act(async () => {
      out = await result.current.findThemes();
    });
    expect(out).toMatchObject({ ok: false, kind: 'pending', message: 'Still working, check back in a minute.' });

    api.requestFeedbackClustering.mockRejectedValue(apiErr(422, 'NOTHING_TO_CLUSTER', 'Add some feedback first, or record an interview quote.'));
    await act(async () => {
      out = await result.current.findThemes();
    });
    expect(out).toEqual({ ok: false, kind: 'empty', message: 'Add some feedback first, or record an interview quote.' });
  });
});

describe('useFeedback.sendToRoadmap', () => {
  it('returns the milestone title on success and passes the chosen milestone', async () => {
    api.sendThemeToRoadmap.mockResolvedValue({ theme: {}, task: { milestone_title: 'Validate demand' } });
    const { result } = renderHook(() => useFeedback());
    await waitFor(() => expect(result.current.loading).toBe(false));
    let out: unknown;
    await act(async () => {
      out = await result.current.sendToRoadmap('t1', 'm1');
    });
    expect(api.sendThemeToRoadmap).toHaveBeenCalledWith('t1', 'm1');
    expect(out).toEqual({ ok: true, milestoneTitle: 'Validate demand' });
  });

  it('handles 409 ALREADY_SENT and 422 NO_OPEN_MILESTONE', async () => {
    const { result } = renderHook(() => useFeedback());
    await waitFor(() => expect(result.current.loading).toBe(false));
    api.sendThemeToRoadmap.mockRejectedValue(apiErr(409, 'ALREADY_SENT', 'This theme is already on your roadmap.'));
    let out: unknown;
    await act(async () => {
      out = await result.current.sendToRoadmap('t1');
    });
    expect(out).toMatchObject({ ok: false, kind: 'already' });
    api.sendThemeToRoadmap.mockRejectedValue(apiErr(422, 'NO_OPEN_MILESTONE', 'Your roadmap has no open milestone to add this to. Add one on the Roadmap first.'));
    await act(async () => {
      out = await result.current.sendToRoadmap('t1');
    });
    expect(out).toEqual({
      ok: false,
      kind: 'no_milestone',
      message: 'Your roadmap has no open milestone to add this to. Add one on the Roadmap first.',
    });
  });
});

describe('useFeedback inbox', () => {
  it('reloads with include_dismissed when the toggle flips, and reports deleted vs dismissed', async () => {
    const { result } = renderHook(() => useFeedback());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(api.listFeedback).toHaveBeenLastCalledWith({ includeDismissed: false });
    act(() => result.current.setShowDismissed(true));
    await waitFor(() => expect(api.listFeedback).toHaveBeenLastCalledWith({ includeDismissed: true }));

    api.deleteFeedback.mockResolvedValueOnce('dismissed').mockResolvedValueOnce('deleted');
    let kind: unknown;
    await act(async () => {
      kind = await result.current.remove('i1');
    });
    expect(kind).toBe('dismissed');
    await act(async () => {
      kind = await result.current.remove('i2');
    });
    expect(kind).toBe('deleted');
  });
});

describe('format helpers', () => {
  it('validates drafts, formats dates and the inputs line', () => {
    expect(validateFeedbackDraft('  ', '2026-10-19')).toBe('Write what the customer said.');
    expect(validateFeedbackDraft('hi', '')).toBe('Pick the date you heard it.');
    expect(validateFeedbackDraft('hi', '2026-10-19')).toBeNull();
    expect(todayIso(new Date(2026, 9, 5))).toBe('2026-10-05');
    expect(formatReceivedOn('2026-10-19')).toMatch(/19/);
    expect(insightInputsLine({ interviews: 2, open_answers: 3, feedback: 5 })).toBe('Based on 2 interviews, 3 survey answers and 5 feedback items');
    expect(insightInputsLine({ interviews: 1, open_answers: 0, feedback: 0 })).toBe('Based on 1 interview');
    expect(insightInputsLine({ feedback: 2 })).toBe('Based on 2 feedback items');
  });
});
