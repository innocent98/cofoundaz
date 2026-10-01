import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAiStatus, formatResetTime, clearAiStatusCache } from './useAiStatus';
import * as aiApiModule from '@/lib/api/ai';

let mockPathname = '/dashboard';
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

vi.mock('@/lib/api/ai', () => ({
  getAiStatus: vi.fn(),
}));

describe('useAiStatus hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAiStatusCache();
    mockPathname = '/dashboard';
  });

  it('fetches AI status on mount without tight-loop polling', async () => {
    const mockData: aiApiModule.AiStatusResponse = {
      data: {
        tokens_used_today: 1500,
        daily_budget: 5000,
        over_budget: false,
        resets_at: '2026-09-27T00:00:00Z',
        recent_enrichment_failures: [],
      },
    };

    vi.mocked(aiApiModule.getAiStatus).mockResolvedValue(mockData);

    const { result } = renderHook(() => useAiStatus());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data?.tokens_used_today).toBe(1500);
    expect(result.current.isOverBudget).toBe(false);
    expect(result.current.isUnlimited).toBe(false);
    expect(aiApiModule.getAiStatus).toHaveBeenCalledTimes(1);
  });

  it('correctly flags isOverBudget and formats resets_at when over budget', async () => {
    const mockData: aiApiModule.AiStatusResponse = {
      data: {
        tokens_used_today: 5200,
        daily_budget: 5000,
        over_budget: true,
        resets_at: '2026-09-27T04:00:00Z',
        recent_enrichment_failures: [],
      },
    };

    vi.mocked(aiApiModule.getAiStatus).mockResolvedValue(mockData);

    const { result } = renderHook(() => useAiStatus());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isOverBudget).toBe(true);
    expect(result.current.formattedResetsAt).toBe(formatResetTime('2026-09-27T04:00:00Z'));
  });

  it('correctly handles daily_budget: null as unlimited', async () => {
    const mockData: aiApiModule.AiStatusResponse = {
      data: {
        tokens_used_today: 80000,
        daily_budget: null,
        over_budget: false,
        resets_at: '2026-09-27T00:00:00Z',
        recent_enrichment_failures: [],
      },
    };

    vi.mocked(aiApiModule.getAiStatus).mockResolvedValue(mockData);

    const { result } = renderHook(() => useAiStatus());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isUnlimited).toBe(true);
    expect(result.current.data?.daily_budget).toBeNull();
  });

  it('handles API errors gracefully without throwing', async () => {
    vi.mocked(aiApiModule.getAiStatus).mockRejectedValue(new Error('Network offline'));

    const { result } = renderHook(() => useAiStatus());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Network offline');
    expect(result.current.data).toBeNull();
    expect(result.current.isOverBudget).toBe(false);
  });

  it('refetches on manual refetch call', async () => {
    const mockData: aiApiModule.AiStatusResponse = {
      data: {
        tokens_used_today: 100,
        daily_budget: 1000,
        over_budget: false,
        resets_at: '2026-09-27T00:00:00Z',
        recent_enrichment_failures: [],
      },
    };

    vi.mocked(aiApiModule.getAiStatus).mockResolvedValue(mockData);

    const { result } = renderHook(() => useAiStatus());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(aiApiModule.getAiStatus).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refetch();
    });

    expect(aiApiModule.getAiStatus).toHaveBeenCalledTimes(2);
  });
});
