import { describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { normalizeQuery, useGlobalSearch } from './useGlobalSearch';
import type { SearchResult } from '@/lib/api/search';

const hit: SearchResult = { type: 'page', group: 'Pages', id: '/finance', title: 'Finance Hub', subtitle: null, href: '/finance' };

describe('useGlobalSearch', () => {
  it('normalizes like the API: trim and collapse inner whitespace', () => {
    expect(normalizeQuery('  fin   hub ')).toBe('fin hub');
  });

  it('fewer than 2 characters is idle and sends no request', async () => {
    const search = vi.fn();
    const { result } = renderHook(() => useGlobalSearch('a', { search, delay: 0 }));
    await new Promise((r) => setTimeout(r, 20));
    expect(result.current.status).toBe('idle');
    expect(search).not.toHaveBeenCalled();
  });

  it('debounces: only the last keystroke is searched', async () => {
    const search = vi.fn().mockResolvedValue([hit]);
    const { result, rerender } = renderHook(({ q }) => useGlobalSearch(q, { search, delay: 40 }), { initialProps: { q: 'fi' } });
    rerender({ q: 'fin' });
    rerender({ q: 'fina' });
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('done'));
    expect(search).toHaveBeenCalledTimes(1);
    expect(search.mock.calls[0][0]).toBe('fina');
    expect(result.current.results).toEqual([hit]);
  });

  it('aborts the stale request when the query changes', async () => {
    const signals: AbortSignal[] = [];
    const search = vi.fn((_q: string, signal?: AbortSignal) => {
      signals.push(signal!);
      return new Promise<SearchResult[]>(() => {});
    });
    const { rerender } = renderHook(({ q }) => useGlobalSearch(q, { search, delay: 0 }), { initialProps: { q: 'fin' } });
    await waitFor(() => expect(search).toHaveBeenCalledTimes(1));
    rerender({ q: 'fina' });
    expect(signals[0].aborted).toBe(true);
  });

  it('an error surfaces as `error` and retry searches again', async () => {
    const search = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce([hit]);
    const { result } = renderHook(() => useGlobalSearch('fin', { search, delay: 0 }));
    await waitFor(() => expect(result.current.status).toBe('error'));
    act(() => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe('done'));
    expect(result.current.results).toEqual([hit]);
  });

  it('going back below 2 characters clears results', async () => {
    const search = vi.fn().mockResolvedValue([hit]);
    const { result, rerender } = renderHook(({ q }) => useGlobalSearch(q, { search, delay: 0 }), { initialProps: { q: 'fin' } });
    await waitFor(() => expect(result.current.status).toBe('done'));
    rerender({ q: 'f' });
    expect(result.current.status).toBe('idle');
    expect(result.current.results).toEqual([]);
  });
});
