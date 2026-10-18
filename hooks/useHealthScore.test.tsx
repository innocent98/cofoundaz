import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useHealthScore } from './useHealthScore';
import { apiClient, ApiError } from '@/lib/api/client';

vi.mock('@/lib/api/client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/client')>('@/lib/api/client');
  return { ...actual, apiClient: vi.fn() };
});

const ok = {
  data: {
    status: 'ok',
    score: 31,
    band: 'at_risk',
    delta_7d: 0,
    summary: "You're at risk for idea stage. Team is carrying you; Legal is holding you back.",
    dimensions: [
      { key: 'team', label: 'Team', score: 50, band: 'needs_work', trend: [50] },
      { key: 'money', label: 'Financial', score: 40, band: 'needs_work', trend: [20, 30, 40] },
    ],
    top_recommendations: [
      { id: 'r1', dimension: 'money', key: 'live.money.transactions_30d', title: 'Track your money in and out', body: 'b', estimated_lift: 10, effort: 'low', status: 'pending', priority: 1, href: '/finance' },
    ],
  },
};

beforeEach(() => vi.clearAllMocks());

describe('useHealthScore', () => {
  it('maps real trend and href, translating money to financial', async () => {
    vi.mocked(apiClient).mockResolvedValue(ok);
    const { result } = renderHook(() => useHealthScore());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data.dimensions.financial.trend).toEqual([20, 30, 40]);
    expect(result.current.data.dimensions.team.trend).toEqual([50]);
    expect(result.current.data.topRecommendations[0].actionUrl).toBe('/finance');
    expect(result.current.error).toBeNull();
  });

  it('shares one request between callers that mount together', async () => {
    vi.mocked(apiClient).mockResolvedValue(ok);
    const a = renderHook(() => useHealthScore());
    const b = renderHook(() => useHealthScore());
    await waitFor(() => expect(a.result.current.loading).toBe(false));
    await waitFor(() => expect(b.result.current.loading).toBe(false));
    expect(apiClient).toHaveBeenCalledTimes(1);
  });

  it('a failed load is an error, not pending_assessment content', async () => {
    vi.mocked(apiClient).mockRejectedValue(new ApiError(500, 'Server Error', {}));
    const { result } = renderHook(() => useHealthScore());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).not.toBeNull();
  });

  it('only the API status pending_assessment means not assessed', async () => {
    vi.mocked(apiClient).mockResolvedValue({ data: { status: 'pending_assessment', message: 'Take it', dimensions: [], top_recommendations: [] } });
    const { result } = renderHook(() => useHealthScore());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data.status).toBe('pending_assessment');
    expect(result.current.error).toBeNull();
  });
});
