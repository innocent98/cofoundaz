import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFinancialModel, FAST_POLL_MS, GIVE_UP_MS } from './useFinancialModel';
import * as api from '@/lib/api/finance';
import { ApiError } from '@/lib/api/client';

vi.mock('@/lib/api/finance', async () => {
  const actual = await vi.importActual<typeof api>('@/lib/api/finance');
  return { ...actual, getLatestFinancialModel: vi.fn(), generateFinancialModel: vi.fn() };
});

const getLatest = vi.mocked(api.getLatestFinancialModel);
const generate = vi.mocked(api.generateFinancialModel);

const model = (status: 'generating' | 'complete' | 'failed', extra: object = {}) =>
  ({ id: 'm1', status, horizon_months: 12, currency: 'NGN', assumptions: null, pnl: null, cash_flow: null, balance_sheet: null, months: null, error: null, generated_at: null, created_at: 't', ...extra }) as api.FinancialModel;

const flush = async (ms = 0) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

describe('useFinancialModel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });
  afterEach(() => vi.useRealTimers());

  it('shows "none" when the workspace has never generated a model', async () => {
    getLatest.mockResolvedValue({ status: 'none' });
    const { result } = renderHook(() => useFinancialModel());
    await flush();
    expect(result.current.phase).toBe('none');
  });

  it('generate -> polls until complete and stops', async () => {
    getLatest.mockResolvedValueOnce({ status: 'none' });
    generate.mockResolvedValue({ id: 'm1', status: 'generating' });
    const { result } = renderHook(() => useFinancialModel());
    await flush();
    getLatest.mockResolvedValueOnce(model('generating')).mockResolvedValueOnce(model('complete', { months: ['2026-10'] }));
    await act(async () => {
      await result.current.generate();
    });
    expect(result.current.phase).toBe('generating');
    await flush(FAST_POLL_MS);
    expect(result.current.phase).toBe('generating');
    await flush(FAST_POLL_MS);
    expect(result.current.phase).toBe('complete');
    const calls = getLatest.mock.calls.length;
    await flush(60_000);
    expect(getLatest.mock.calls.length).toBe(calls);
  });

  it('surfaces a failed model with the API error text and stops polling', async () => {
    getLatest.mockResolvedValue(model('failed', { error: 'AI budget exceeded' }));
    const { result } = renderHook(() => useFinancialModel());
    await flush();
    expect(result.current.phase).toBe('failed');
    expect(result.current.model?.error).toBe('AI budget exceeded');
  });

  it('gives up honestly after the window and lets the user check again', async () => {
    getLatest.mockResolvedValue(model('generating'));
    const { result } = renderHook(() => useFinancialModel());
    await flush();
    expect(result.current.phase).toBe('generating');
    await flush(GIVE_UP_MS + 10_000);
    expect(result.current.timedOut).toBe(true);
    const calls = getLatest.mock.calls.length;
    await flush(30_000);
    expect(getLatest.mock.calls.length).toBe(calls);
    getLatest.mockResolvedValue(model('complete', { months: [] }));
    await act(async () => {
      await result.current.checkAgain();
    });
    expect(result.current.phase).toBe('complete');
    expect(result.current.timedOut).toBe(false);
  });

  it('maps 403 to forbidden and a failed POST to an error result', async () => {
    getLatest.mockRejectedValueOnce(new ApiError(403, 'x', { error: { code: 'FORBIDDEN', message: 'no', field_errors: [] } }));
    const { result } = renderHook(() => useFinancialModel());
    await flush();
    expect(result.current.phase).toBe('forbidden');

    generate.mockRejectedValueOnce(new ApiError(500, 'x', { error: { code: 'X', message: 'Nope.', field_errors: [] } }));
    let res: Awaited<ReturnType<typeof result.current.generate>> | undefined;
    await act(async () => {
      res = await result.current.generate();
    });
    expect(res).toMatchObject({ ok: false, message: 'Nope.' });
  });
});
