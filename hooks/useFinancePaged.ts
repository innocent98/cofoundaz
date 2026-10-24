import { useCallback, useState } from 'react';
import { toFinanceError, type Page } from '@/lib/api/finance';
import { useFinanceResource, type ResourceStatus } from './useFinanceResource';

export interface PagedList<T> {
  status: ResourceStatus;
  error: string | null;
  items: T[];
  /** Exact count matching the current filters, from the first page. */
  total: number | null;
  hasMore: boolean;
  loadingMore: boolean;
  /** Set when "Load more" failed; the rows already shown stay. */
  moreError: string | null;
  loadMore: () => Promise<void>;
  /** Refetch from page one without flashing the loading state. */
  reload: () => Promise<void>;
}

interface Extra<T> {
  base: Page<T>;
  items: T[];
  next: string | null;
}

/**
 * A cursor-paginated Finance list. Page one is loaded like any other resource
 * (changing `fetchPage` refetches and shows `loading`). "Load more" appends the
 * next page; a reload or a filter change starts again from page one. The extra
 * pages are keyed to the page-one object they continue, so a stale tail can
 * never be shown after the list restarts.
 */
export function useFinancePaged<T>(fetchPage: (cursor: string | null) => Promise<Page<T>>): PagedList<T> {
  const first = useFinanceResource(useCallback(() => fetchPage(null), [fetchPage]));
  const [extra, setExtra] = useState<Extra<T> | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);

  const base = first.data;
  const tail = extra && extra.base === base ? extra : null;
  const next = tail ? tail.next : (base?.nextCursor ?? null);
  const items = base ? [...base.items, ...(tail?.items ?? [])] : [];

  const loadMore = useCallback(async () => {
    if (!base || next === null || loadingMore) return;
    setLoadingMore(true);
    setMoreError(null);
    try {
      const page = await fetchPage(next);
      setExtra((prev) => {
        const prior = prev && prev.base === base ? prev.items : [];
        return { base, items: [...prior, ...page.items], next: page.nextCursor };
      });
    } catch (err) {
      setMoreError(toFinanceError(err, "Couldn't load more. Try again.").message);
    } finally {
      setLoadingMore(false);
    }
  }, [base, fetchPage, loadingMore, next]);

  return {
    status: first.status,
    error: first.error,
    items,
    total: base?.total ?? null,
    hasMore: next !== null,
    loadingMore,
    moreError,
    loadMore,
    reload: first.reload,
  };
}
