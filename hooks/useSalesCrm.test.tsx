import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '@/lib/api/sales';
import { useSalesBoard } from './useSalesCrm';

vi.mock('@/lib/api/sales', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api/sales')>('@/lib/api/sales');
  return { ...actual, getOverview: vi.fn(), getStages: vi.fn(), listAllDeals: vi.fn(), moveDeal: vi.fn() };
});
vi.mock('@/lib/api/members', () => ({ listMembers: vi.fn().mockResolvedValue([]), memberLabel: () => '' }));

const stages = [
  { id: 's-new', name: 'New', position: 0, kind: 'open', win_probability: 10 },
  { id: 's-won', name: 'Closed Won', position: 1, kind: 'won', win_probability: 100 },
] as api.Stage[];
const deal = { id: 'd1', name: 'Acme', stage_id: 's-new', value_minor: 100, is_stalled: false, days_inactive: 0 } as api.Deal;
const overview = { total_pipeline_minor: 100, weighted_forecast_minor: 10, win_rate: null, currency: 'NGN', stages: [] } as api.SalesOverview;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(api.getOverview).mockResolvedValue(overview);
  vi.mocked(api.getStages).mockResolvedValue(stages);
  vi.mocked(api.listAllDeals).mockResolvedValue([deal]);
});

describe('useSalesBoard', () => {
  it('loads the overview, stages and deals together', async () => {
    const { result } = renderHook(() => useSalesBoard());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.data?.stages).toHaveLength(2);
    expect(result.current.data?.deals[0].id).toBe('d1');
  });

  it('moveDeal moves the card at once and keeps the server copy', async () => {
    let release!: (d: api.DealDetail) => void;
    vi.mocked(api.moveDeal).mockReturnValue(new Promise((r) => (release = r)));
    // The refetch after the move sees the deal where the server put it.
    vi.mocked(api.listAllDeals)
      .mockResolvedValueOnce([deal])
      .mockResolvedValue([{ ...deal, stage_id: 's-won', closed_at: '2026-10-21T12:00:00Z' } as api.Deal]);
    const { result } = renderHook(() => useSalesBoard());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    let pending!: Promise<unknown>;
    act(() => {
      pending = result.current.moveDeal('d1', 's-won');
    });
    expect(result.current.data?.deals[0].stage_id).toBe('s-won'); // optimistic
    await act(async () => {
      release({ ...deal, stage_id: 's-won', closed_at: '2026-10-21T12:00:00Z', stage_history: [] } as api.DealDetail);
      await pending;
    });
    expect(result.current.data?.deals[0]).toMatchObject({ stage_id: 's-won', closed_at: '2026-10-21T12:00:00Z' });
    expect(result.current.data?.deals[0]).not.toHaveProperty('stage_history');
    expect(api.moveDeal).toHaveBeenCalledWith('d1', 's-won', undefined);
  });

  it('moveDeal rolls the card back and rethrows when the API refuses', async () => {
    vi.mocked(api.moveDeal).mockRejectedValue(new Error('Stage not found.'));
    const { result } = renderHook(() => useSalesBoard());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    await act(async () => {
      await expect(result.current.moveDeal('d1', 's-won')).rejects.toThrow('Stage not found.');
    });
    expect(result.current.data?.deals[0].stage_id).toBe('s-new');
  });

  it('a 403 on load is the forbidden state, not an error', async () => {
    const { ApiError } = await import('@/lib/api/client');
    vi.mocked(api.getOverview).mockRejectedValue(new ApiError(403, 'Forbidden', { error: { code: 'FORBIDDEN', message: 'x', field_errors: [] } }));
    const { result } = renderHook(() => useSalesBoard());
    await waitFor(() => expect(result.current.status).toBe('forbidden'));
  });
});
