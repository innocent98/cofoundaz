import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getAiStatus, aiApi, type AiStatusResponse } from './ai';
import * as clientModule from './client';

vi.mock('./client', () => ({
  apiClient: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(public status: number, public statusText: string, public data: unknown) {
      super(`API Error ${status}: ${statusText}`);
    }
  },
}));

describe('AI API Client (lib/api/ai.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls apiClient with /ai/status', async () => {
    const mockResponse: AiStatusResponse = {
      data: {
        tokens_used_today: 4500,
        daily_budget: 10000,
        over_budget: false,
        resets_at: '2026-09-27T00:00:00Z',
        recent_enrichment_failures: [],
      },
      meta: { request_id: 'req-123' },
    };

    vi.mocked(clientModule.apiClient).mockResolvedValueOnce(mockResponse);

    const result = await getAiStatus();

    expect(clientModule.apiClient).toHaveBeenCalledWith('/ai/status');
    expect(result).toEqual(mockResponse);
    expect(result.data.tokens_used_today).toBe(4500);
    expect(result.data.daily_budget).toBe(10000);
    expect(result.data.over_budget).toBe(false);
  });

  it('supports daily_budget: null for unlimited quota tiers', async () => {
    const mockUnlimited: AiStatusResponse = {
      data: {
        tokens_used_today: 120000,
        daily_budget: null,
        over_budget: false,
        resets_at: '2026-09-27T00:00:00Z',
        recent_enrichment_failures: [
          { type: 'company_enrichment', failed_at: '2026-09-26T12:00:00Z' },
        ],
      },
    };

    vi.mocked(clientModule.apiClient).mockResolvedValueOnce(mockUnlimited);

    const result = await aiApi.getStatus();

    expect(result.data.daily_budget).toBeNull();
    expect(result.data.recent_enrichment_failures).toHaveLength(1);
    expect(result.data.recent_enrichment_failures[0].type).toBe('company_enrichment');
  });

  it('handles over_budget: true responses', async () => {
    const mockOverBudget: AiStatusResponse = {
      data: {
        tokens_used_today: 10500,
        daily_budget: 10000,
        over_budget: true,
        resets_at: '2026-09-27T00:00:00Z',
        recent_enrichment_failures: [],
      },
    };

    vi.mocked(clientModule.apiClient).mockResolvedValueOnce(mockOverBudget);

    const result = await getAiStatus();

    expect(result.data.over_budget).toBe(true);
    expect(result.data.tokens_used_today).toBeGreaterThan(result.data.daily_budget!);
  });
});
