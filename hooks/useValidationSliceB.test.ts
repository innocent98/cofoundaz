import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

const api = vi.hoisted(() => ({
  requestScriptGeneration: vi.fn(),
  listScripts: vi.fn(),
  updateScript: vi.fn(),
  deleteScript: vi.fn(),
  requestSynthesis: vi.fn(),
  applySuggestion: vi.fn(),
  listInsights: vi.fn(),
  getInsight: vi.fn(),
  deleteInsight: vi.fn(),
}));
const jobs = vi.hoisted(() => ({ waitForJob: vi.fn() }));
vi.mock('@/lib/api/validation', () => api);
vi.mock('@/lib/api/bb-jobs', () => jobs);

import { ApiError } from '@/lib/api/client';
import { outcomeFromScriptResult, useScripts } from './useScripts';
import { outcomeFromInsightResult, useInsights } from './useInsights';
import { notificationHref, mapNotification } from './useNotifications';
import { insightInputsLine, moveItem, plainProse, validateScriptDraft } from '@/lib/validation-format';

const apiErr = (status: number, code: string, message: string) =>
  new ApiError(status, 'x', { error: { code, message, field_errors: [] } });

beforeEach(() => {
  vi.clearAllMocks();
  api.listScripts.mockResolvedValue([]);
});

describe('script job outcomes', () => {
  it('maps ready / over_budget / gone / empty', () => {
    expect(outcomeFromScriptResult({ status: 'ready', script_id: 's1' })).toEqual({ ok: true, scriptId: 's1' });
    expect(outcomeFromScriptResult({ status: 'over_budget' })).toMatchObject({ ok: false, message: 'AI is at its daily limit, try again tomorrow.' });
    expect(outcomeFromScriptResult({ status: 'gone' })).toMatchObject({ message: 'Those assumptions were deleted.' });
    expect(outcomeFromScriptResult({ status: 'empty' })).toMatchObject({ message: "The AI couldn't write questions this time. Try again." });
  });
});

describe('useScripts.generate', () => {
  it('polls with a ~90 s cap and says still working on timeout', async () => {
    api.requestScriptGeneration.mockResolvedValue('job');
    jobs.waitForJob.mockResolvedValue({ state: 'timeout' });
    const { result } = renderHook(() => useScripts());
    let out: unknown;
    await act(async () => {
      out = await result.current.generate(['a1']);
    });
    expect(jobs.waitForJob).toHaveBeenCalledWith('job', { timeoutMs: 90000 });
    expect(out).toEqual({ ok: false, message: 'Still working, check back in a minute.', pending: true });
  });

  it('a ready job refreshes the list and returns the script id', async () => {
    api.requestScriptGeneration.mockResolvedValue('job');
    jobs.waitForJob.mockResolvedValue({ state: 'succeeded', result: { status: 'ready', script_id: 's1' } });
    const { result } = renderHook(() => useScripts());
    await act(async () => {});
    api.listScripts.mockClear();
    let out: unknown;
    await act(async () => {
      out = await result.current.generate(['a1']);
    });
    expect(out).toEqual({ ok: true, scriptId: 's1' });
    expect(api.listScripts).toHaveBeenCalled();
  });

  it('surfaces the 422 message and 429 budget copy', async () => {
    const { result } = renderHook(() => useScripts());
    api.requestScriptGeneration.mockRejectedValueOnce(apiErr(422, 'ASSUMPTIONS_REQUIRED', 'Pick at least one assumption to write a script for.'));
    let out: unknown;
    await act(async () => {
      out = await result.current.generate([]);
    });
    expect(out).toEqual({ ok: false, message: 'Pick at least one assumption to write a script for.' });
    api.requestScriptGeneration.mockRejectedValueOnce(apiErr(429, 'AI_BUDGET', 'x'));
    await act(async () => {
      out = await result.current.generate(['a1']);
    });
    expect(out).toEqual({ ok: false, message: 'AI is at its daily limit, try again tomorrow.' });
  });

  it('save sends the full list and keeps ids; blank-id questions go without one', async () => {
    api.updateScript.mockResolvedValue({ id: 's1', title: 'T', assumption_ids: [], questions: [] });
    const { result } = renderHook(() => useScripts());
    await act(async () => {
      await result.current.save('s1', {
        title: ' T ',
        questions: [
          { id: 'q1', question: ' A ', tip: ' t ' },
          { question: 'B', tip: '' },
        ],
      });
    });
    expect(api.updateScript).toHaveBeenCalledWith('s1', {
      title: 'T',
      questions: [
        { id: 'q1', question: 'A', tip: 't' },
        { question: 'B', tip: '' },
      ],
    });
  });
});

describe('insight outcomes and apply', () => {
  it('maps job results', () => {
    expect(outcomeFromInsightResult({ status: 'ready', insight_id: 'i1' })).toEqual({ ok: true, insightId: 'i1' });
    expect(outcomeFromInsightResult({ status: 'over_budget' })).toMatchObject({ kind: 'over_budget' });
    expect(outcomeFromInsightResult({ status: 'empty' })).toMatchObject({ kind: 'empty' });
  });

  it('NOTHING_TO_SYNTHESIZE is an empty state with the server message', async () => {
    api.requestSynthesis.mockRejectedValue(apiErr(422, 'NOTHING_TO_SYNTHESIZE', 'Add an interview or collect an open survey answer first.'));
    const { result } = renderHook(() => useInsights('interviews'));
    let out: unknown;
    await act(async () => {
      out = await result.current.synthesize();
    });
    expect(api.requestSynthesis).toHaveBeenCalledWith('interviews');
    expect(out).toEqual({ ok: false, kind: 'empty', message: 'Add an interview or collect an open survey answer first.' });
  });

  it('409 is already applied, 404 is gone, success returns insight + assumption', async () => {
    const { result } = renderHook(() => useInsights('surveys'));
    api.applySuggestion.mockRejectedValueOnce(apiErr(409, 'ALREADY_APPLIED', 'This suggestion was already applied.'));
    expect(await result.current.apply('i', 's')).toMatchObject({ ok: false, kind: 'already' });
    api.applySuggestion.mockRejectedValueOnce(apiErr(404, 'NOT_FOUND', 'Not found.'));
    expect(await result.current.apply('i', 's')).toMatchObject({ ok: false, kind: 'gone', message: 'That assumption no longer exists.' });
    api.applySuggestion.mockResolvedValueOnce({ insight: { id: 'i' }, assumption: { id: 'a', status: 'testing' } });
    expect(await result.current.apply('i', 's')).toMatchObject({ ok: true });
  });
});

describe('format helpers', () => {
  it('inputs line', () => {
    expect(insightInputsLine({ interviews: 1, open_answers: 0 })).toBe('Based on 1 interview');
    expect(insightInputsLine({ interviews: 0, open_answers: 2 })).toBe('Based on 2 survey answers');
    expect(insightInputsLine({ interviews: 3, open_answers: 3 })).toBe('Based on 3 interviews and 3 survey answers');
  });
  it('moveItem and plainProse and draft validation', () => {
    expect(moveItem([1, 2, 3], 0, 2)).toEqual([2, 3, 1]);
    expect(moveItem([1, 2], 0, 5)).toEqual([1, 2]);
    expect(plainProse('Fast — not slow – ok')).toBe('Fast, not slow, ok');
    expect(validateScriptDraft('T', [])).toBe('A script needs at least one question.');
    expect(validateScriptDraft('T', [{ question: 'x'.repeat(501), tip: '' }])).toBe('Questions and tips are limited to 500 characters.');
    expect(validateScriptDraft('T', [{ question: 'ok', tip: '' }])).toBeNull();
  });
});

describe('validation.insight.detected notification', () => {
  const raw = {
    id: 'n1',
    type: 'validation.insight.detected',
    title: 'New pattern detected in customer feedback: Same-day cash urgency',
    body: 'See insight',
    data: { theme: 'Same-day cash urgency', insight_id: 'ca7654d5', startup_id: 's' },
    read: false,
    created_at: '2026-10-19T20:30:54+00:00',
  };
  it('deep links to the report and uses body as the CTA', () => {
    expect(notificationHref(raw.type, raw.data)).toBe('/validation/interviews?insight=ca7654d5');
    expect(notificationHref(raw.type, {})).toBe('/validation/interviews');
    const item = mapNotification(raw);
    expect(item.href).toBe('/validation/interviews?insight=ca7654d5');
    expect(item.actionText).toBe('See insight');
  });
});
