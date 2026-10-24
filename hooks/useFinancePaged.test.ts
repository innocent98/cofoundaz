import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useFinancePaged } from './useFinancePaged';
import type { Page } from '@/lib/api/finance';

const page = (items: number[], nextCursor: string | null, total = 5): Page<number> => ({ items, nextCursor, total });

describe('useFinancePaged', () => {
  it('loads page one, appends the next page with the cursor, and stops at the last page', async () => {
    const fetchPage = vi.fn(async (cursor: string | null) => (cursor === null ? page([1, 2], 'c2') : page([3, 4, 5], null)));
    const { result } = renderHook(() => useFinancePaged(fetchPage));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.items).toEqual([1, 2]);
    expect(result.current.total).toBe(5);
    expect(result.current.hasMore).toBe(true);

    await act(async () => {
      await result.current.loadMore();
    });
    expect(fetchPage).toHaveBeenLastCalledWith('c2');
    expect(result.current.items).toEqual([1, 2, 3, 4, 5]);
    expect(result.current.hasMore).toBe(false);
  });

  it('keeps what is shown and reports the error when Load more fails', async () => {
    const fetchPage = vi.fn(async (cursor: string | null) => {
      if (cursor === null) return page([1, 2], 'c2');
      throw new Error('boom');
    });
    const { result } = renderHook(() => useFinancePaged(fetchPage));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.items).toEqual([1, 2]);
    expect(result.current.moreError).toBe("Couldn't load more. Try again.");
    expect(result.current.hasMore).toBe(true);
  });

  it('starts again from page one when the fetcher changes (a filter switch)', async () => {
    const all = vi.fn(async (cursor: string | null) => (cursor === null ? page([1, 2], 'c2', 4) : page([3, 4], null, 4)));
    const filtered = vi.fn(async () => page([9], null, 1));
    const { result, rerender } = renderHook(({ f }) => useFinancePaged(f), { initialProps: { f: all } });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.items).toHaveLength(4);
    rerender({ f: filtered });
    await waitFor(() => expect(result.current.items).toEqual([9]));
    expect(result.current.total).toBe(1);
  });
});
