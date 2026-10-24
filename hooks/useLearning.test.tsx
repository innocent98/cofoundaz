import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ getRecommendations: vi.fn() }));
vi.mock('@/lib/api/learning', async (orig) => ({ ...(await orig<typeof import('@/lib/api/learning')>()), ...api }));

import { useRecommendations } from './useLearning';

const rec = (source: 'template' | 'ai', reason: string) => ({
  stage: 'validation',
  recommendation_reason: reason,
  hero: { course_id: 'c', reason, reason_source: source, matched_gaps: [] },
  recommended: [],
  continue_watching: [],
});

describe('useRecommendations', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('re-reads while the reason is a template and picks up the AI sentence', async () => {
    api.getRecommendations.mockResolvedValueOnce(rec('template', 'template sentence')).mockResolvedValue(rec('ai', 'ai sentence'));
    const { result } = renderHook(() => useRecommendations());
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    expect(result.current.data?.hero?.reason).toBe('template sentence');
    await act(async () => { await vi.advanceTimersByTimeAsync(5100); });
    expect(result.current.data?.hero?.reason).toBe('ai sentence');
    const calls = api.getRecommendations.mock.calls.length;
    await act(async () => { await vi.advanceTimersByTimeAsync(30000); });
    expect(api.getRecommendations.mock.calls.length).toBe(calls);
  });
});
