import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCalendar, useCampaigns, useMarketingOverview, useResource, monthRange } from './useMarketingApi';
import * as api from '@/lib/api/marketing';
import { ApiError } from '@/lib/api/client';

vi.mock('@/lib/api/marketing', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/marketing')>('@/lib/api/marketing');
  return {
    ...actual,
    getOverview: vi.fn(),
    listCampaigns: vi.fn(),
    createCampaign: vi.fn(),
    updateCampaign: vi.fn(),
    deleteCampaign: vi.fn(),
    listCalendarEntries: vi.fn(),
  };
});

const forbidden = () => new ApiError(403, 'Forbidden', { error: { code: 'FORBIDDEN', message: 'Forbidden' } });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useResource', () => {
  it('starts loading, then ready with data', async () => {
    const { result } = renderHook(() => useResource(() => Promise.resolve([1, 2])));
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.data).toEqual([1, 2]);
  });

  it('maps a role 403 to forbidden, never a crash', async () => {
    const { result } = renderHook(() => useResource(() => Promise.reject(forbidden())));
    await waitFor(() => expect(result.current.status).toBe('forbidden'));
  });

  it("exposes the API's message on a failed load and recovers on reload", async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new ApiError(500, 'Server Error', { error: { code: 'INTERNAL', message: 'Database is down.' } }))
      .mockResolvedValueOnce('ok');
    const { result } = renderHook(() => useResource(fetcher));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('Database is down.');
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.data).toBe('ok');
  });
});

describe('useMarketingOverview', () => {
  it('reads the real overview', async () => {
    vi.mocked(api.getOverview).mockResolvedValue({
      scheduled_this_week: 2,
      active_channels: 1,
      active_campaigns: 3,
      top_channel_by_conversions: 'email',
      ai_content_ideas: 0,
    });
    const { result } = renderHook(() => useMarketingOverview());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.overview?.active_campaigns).toBe(3);
  });
});

describe('useCampaigns', () => {
  it('starts empty (no sample rows) and refreshes after a create', async () => {
    vi.mocked(api.listCampaigns).mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 'c1', name: 'Q4' } as api.Campaign]);
    vi.mocked(api.createCampaign).mockResolvedValue({ id: 'c1', name: 'Q4' } as api.Campaign);
    const { result } = renderHook(() => useCampaigns());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.campaigns).toEqual([]);

    await act(async () => {
      await result.current.create({ name: 'Q4', objective: 'launch' });
    });
    expect(api.createCampaign).toHaveBeenCalledWith({ name: 'Q4', objective: 'launch' });
    await waitFor(() => expect(result.current.campaigns).toHaveLength(1));
  });

  it('propagates API rejections to the caller without refreshing', async () => {
    vi.mocked(api.listCampaigns).mockResolvedValue([]);
    vi.mocked(api.updateCampaign).mockRejectedValue(
      new ApiError(422, 'Unprocessable', { error: { code: 'VALIDATION_ERROR', message: 'Illegal transition', field_errors: [{ field: 'status', message: 'Illegal transition' }] } })
    );
    const { result } = renderHook(() => useCampaigns());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    await expect(result.current.update('c1', { status: 'completed' })).rejects.toBeInstanceOf(ApiError);
    expect(api.listCampaigns).toHaveBeenCalledTimes(1);
  });
});

describe('useCalendar', () => {
  it('queries the visible month and separately loads unscheduled drafts', async () => {
    vi.mocked(api.listCalendarEntries).mockResolvedValue([]);
    const month = new Date(2026, 9, 1);
    const { result } = renderHook(() => useCalendar(month));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    const calls = vi.mocked(api.listCalendarEntries).mock.calls.map((c) => c[0]);
    expect(calls).toContainEqual(monthRange(month));
    expect(calls).toContainEqual({ status: 'draft' });
  });

  it('only keeps drafts without a date in the backlog', async () => {
    vi.mocked(api.listCalendarEntries).mockImplementation(async (q) =>
      q?.status === 'draft'
        ? ([
            { id: 'a', scheduled_at: null },
            { id: 'b', scheduled_at: '2026-10-20T09:00:00Z' },
          ] as api.CalendarEntry[])
        : []
    );
    const { result } = renderHook(() => useCalendar(new Date(2026, 9, 1)));
    await waitFor(() => expect(result.current.backlog).toHaveLength(1));
    expect(result.current.backlog[0].id).toBe('a');
  });

  it('is forbidden when the role is not allowed', async () => {
    vi.mocked(api.listCalendarEntries).mockRejectedValue(forbidden());
    const { result } = renderHook(() => useCalendar(new Date(2026, 9, 1)));
    await waitFor(() => expect(result.current.status).toBe('forbidden'));
  });
});
