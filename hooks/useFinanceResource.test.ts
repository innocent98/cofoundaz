import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useFinanceResource } from './useFinanceResource';
import { ApiError } from '@/lib/api/client';

describe('useFinanceResource', () => {
  it('goes loading -> ready with data', async () => {
    const load = vi.fn().mockResolvedValue([1, 2]);
    const { result } = renderHook(() => useFinanceResource(load));
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.data).toEqual([1, 2]);
  });

  it('maps a 403 FORBIDDEN to the forbidden state, not a crash', async () => {
    const load = vi.fn().mockRejectedValue(new ApiError(403, 'Forbidden', { error: { code: 'FORBIDDEN', message: 'no', field_errors: [] } }));
    const { result } = renderHook(() => useFinanceResource(load));
    await waitFor(() => expect(result.current.status).toBe('forbidden'));
    expect(result.current.data).toBeNull();
  });

  it('surfaces the API message on other failures and recovers on retry', async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new ApiError(500, 'x', { error: { code: 'INTERNAL', message: 'Server broke.', field_errors: [] } }))
      .mockResolvedValueOnce('ok');
    const { result } = renderHook(() => useFinanceResource(load));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('Server broke.');
    await act(async () => {
      await result.current.reload();
    });
    expect(result.current.status).toBe('ready');
    expect(result.current.data).toBe('ok');
  });

  it('reload keeps the last good data if a background refresh fails', async () => {
    const load = vi.fn().mockResolvedValueOnce('first').mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(() => useFinanceResource(load));
    await waitFor(() => expect(result.current.data).toBe('first'));
    await act(async () => {
      await result.current.reload();
    });
    expect(result.current.status).toBe('ready');
    expect(result.current.data).toBe('first');
  });

  it('ignores a stale response when the loader changes (month switch)', async () => {
    let resolveSlow: (v: string) => void = () => {};
    const slow = vi.fn().mockReturnValue(new Promise<string>((r) => (resolveSlow = r)));
    const fast = vi.fn().mockResolvedValue('new');
    const { result, rerender } = renderHook(({ load }) => useFinanceResource(load), { initialProps: { load: slow as () => Promise<string> } });
    rerender({ load: fast });
    await waitFor(() => expect(result.current.data).toBe('new'));
    await act(async () => resolveSlow('old'));
    expect(result.current.data).toBe('new');
  });

  it('setData replaces the cache with a server response', async () => {
    const load = vi.fn().mockResolvedValue('a');
    const { result } = renderHook(() => useFinanceResource(load));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    act(() => result.current.setData('b'));
    expect(result.current.data).toBe('b');
  });
});
