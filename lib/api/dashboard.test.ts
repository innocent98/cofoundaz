import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getDashboardSummary,
  getDashboardActivity,
  isSectionError,
  type DashboardSummaryResponse,
} from './dashboard';
import * as clientModule from './client';

vi.mock('./client', () => ({
  apiClient: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(public status: number, public statusText: string, public data: unknown) {
      super(`API Error ${status}: ${statusText}`);
    }
  },
}));

describe('Dashboard API Client (lib/api/dashboard.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDashboardSummary', () => {
    it('calls apiClient with /dashboard/summary and returns envelope', async () => {
      const mockResponse: DashboardSummaryResponse = {
        data: {
          greeting: { first_name: 'Ade', startup_name: 'Kolo' },
          health: { score: 85, delta_7d: 5 },
          mission: { streak: 3, tasks: [] },
          briefing: { status: 'ready', message: 'Briefing content' },
          kpis: { revenue: null, runway: 12 },
          calibration: { assessment_complete: true },
          risks: [],
          opportunities: [],
        },
      };

      vi.mocked(clientModule.apiClient).mockResolvedValueOnce(mockResponse);

      const result = await getDashboardSummary();

      expect(clientModule.apiClient).toHaveBeenCalledWith('/dashboard/summary');
      expect(result).toEqual(mockResponse);
      expect(result.data.health).toEqual({ score: 85, delta_7d: 5 });
    });

    it('unwraps raw object into standard envelope if backend omits data wrapper', async () => {
      const rawData = {
        greeting: { first_name: 'Amara' },
        health: { score: 90 },
      };

      vi.mocked(clientModule.apiClient).mockResolvedValueOnce(rawData);

      const result = await getDashboardSummary();

      expect(result).toEqual({ data: rawData });
    });
  });

  describe('getDashboardActivity', () => {
    it('calls /dashboard/activity without query params when none provided', async () => {
      const mockResponse = {
        data: {
          items: [
            {
              id: '1',
              actor: { name: 'Tayo', email: 'tayo@example.com' },
              verb: 'completed',
              entity: 'MVP milestone',
              timestamp: '2026-09-26T12:00:00Z',
            },
          ],
          next_cursor: 'cursor-abc',
        },
      };

      vi.mocked(clientModule.apiClient).mockResolvedValueOnce(mockResponse);

      const result = await getDashboardActivity();

      expect(clientModule.apiClient).toHaveBeenCalledWith('/dashboard/activity');
      expect(result.data.items).toHaveLength(1);
      expect(result.data.next_cursor).toBe('cursor-abc');
      expect(result.data.items[0].actor?.name).toBe('Tayo');
    });

    it('appends cursor and limit query parameters when supplied', async () => {
      const mockResponse = {
        data: {
          items: [],
          next_cursor: null,
        },
      };

      vi.mocked(clientModule.apiClient).mockResolvedValueOnce(mockResponse);

      const result = await getDashboardActivity('cursor-xyz', 10);

      expect(clientModule.apiClient).toHaveBeenCalledWith('/dashboard/activity?cursor=cursor-xyz&limit=10');
      expect(result.data.items).toEqual([]);
      expect(result.data.next_cursor).toBeNull();
    });

    it('handles nullable actor responses safely', async () => {
      const mockResponse = {
        items: [
          {
            id: '2',
            actor: null,
            verb: 'auto-scaled',
            entity: 'database replica',
            timestamp: '2026-09-26T12:05:00Z',
          },
        ],
        next_cursor: null,
      };

      vi.mocked(clientModule.apiClient).mockResolvedValueOnce(mockResponse);

      const result = await getDashboardActivity();

      expect(result.data.items[0].actor).toBeNull();
    });
  });

  describe('isSectionError', () => {
    it('returns true for section error objects', () => {
      expect(isSectionError({ error: true, message: 'Server error' })).toBe(true);
      expect(isSectionError({ error: true })).toBe(true);
    });

    it('returns false for normal data objects or null/undefined', () => {
      expect(isSectionError(null)).toBe(false);
      expect(isSectionError(undefined)).toBe(false);
      expect(isSectionError({ score: 85 })).toBe(false);
      expect(isSectionError({ error: false, score: 85 })).toBe(false);
      expect(isSectionError([])).toBe(false);
    });
  });
});
