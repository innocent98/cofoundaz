import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useQaSession } from './useQaSession';
import * as api from '@/lib/api/readiness';

vi.mock('@/lib/api/readiness', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/readiness')>('@/lib/api/readiness');
  return { ...actual, listQaSessions: vi.fn(), startQaSession: vi.fn(), answerQaSession: vi.fn(), getQaSession: vi.fn(), endQaSession: vi.fn() };
});

const base = {
  id: 's1', focus: 'general', intensity: 'friendly_angel', status: 'active', error: null, turns: 9, max_answers: 10,
  rating: null, rating_label: null, average: null, job_id: null, started_at: '2026-11-12T10:00:00Z', ended_at: null, duration_minutes: null,
} as const;

beforeEach(() => vi.clearAllMocks());

describe('useQaSession 10th answer', () => {
  it('flags the cap when the answer ends the session, and records the founder answer', async () => {
    vi.mocked(api.listQaSessions).mockResolvedValue([]);
    vi.mocked(api.startQaSession).mockResolvedValue({ session: { ...base, transcript: [] }, reply: 'q' } as never);
    vi.mocked(api.answerQaSession).mockResolvedValue({ session: { ...base, status: 'ending', turns: 10 }, reply: null, ended: true } as never);
    vi.mocked(api.getQaSession).mockReturnValue(new Promise(() => undefined)); // scoring poll never settles in this test

    const { result, unmount } = renderHook(() => useQaSession(true, null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.start('general', 'friendly_angel');
    });
    expect(result.current.capReached).toBe(false);
    await act(async () => {
      await result.current.send('my last answer');
    });
    expect(api.answerQaSession).toHaveBeenCalledWith('s1', 'my last answer', 9);
    expect(result.current.capReached).toBe(true);
    expect(result.current.session?.status).toBe('ending');
    expect(result.current.session?.transcript?.at(-1)?.text).toBe('my last answer');
    unmount();
  });

  it('does not flag the cap on an ordinary answer', async () => {
    vi.mocked(api.listQaSessions).mockResolvedValue([]);
    vi.mocked(api.startQaSession).mockResolvedValue({ session: { ...base, turns: 2, transcript: [] }, reply: 'q' } as never);
    vi.mocked(api.answerQaSession).mockResolvedValue({ session: { ...base, turns: 3 }, reply: 'next question', ended: false } as never);
    const { result, unmount } = renderHook(() => useQaSession(true, null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.start('general', 'friendly_angel');
    });
    await act(async () => {
      await result.current.send('answer');
    });
    expect(result.current.capReached).toBe(false);
    unmount();
  });
});
