import { useEffect, useRef, useState } from 'react';
import { SEARCH_MIN_CHARS, searchAll, type SearchResult } from '@/lib/api/search';

export const SEARCH_DEBOUNCE_MS = 250;

export type SearchStatus = 'idle' | 'loading' | 'done' | 'error';

/** The API trims and collapses inner whitespace; do the same so equal queries are equal. */
export function normalizeQuery(q: string): string {
  return q.trim().replace(/\s+/g, ' ');
}

interface Settled {
  q: string;
  status: 'done' | 'error';
  results: SearchResult[];
}

/**
 * Debounced GET /search. Fewer than 2 characters is `idle` (no request, show a
 * hint). A new keystroke aborts the stale request. `retry()` re-runs the
 * current query after an error.
 */
export function useGlobalSearch(
  query: string,
  { search = searchAll, delay = SEARCH_DEBOUNCE_MS }: { search?: typeof searchAll; delay?: number } = {},
) {
  const q = normalizeQuery(query);
  const active = q.length >= SEARCH_MIN_CHARS;
  const [settled, setSettled] = useState<Settled | null>(null);
  const [attempt, setAttempt] = useState(0);
  const searchRef = useRef(search);
  useEffect(() => {
    searchRef.current = search;
  });

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchRef
        .current(q, controller.signal)
        .then((results) => {
          if (!controller.signal.aborted) setSettled({ q, status: 'done', results });
        })
        .catch(() => {
          if (!controller.signal.aborted) setSettled({ q, status: 'error', results: [] });
        });
    }, delay);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, active, delay, attempt]);

  const current = active && settled?.q === q ? settled : null;
  const status: SearchStatus = !active ? 'idle' : current ? current.status : 'loading';
  return {
    query: q,
    status,
    results: current?.status === 'done' ? current.results : [],
    retry: () => {
      setSettled(null);
      setAttempt((n) => n + 1);
    },
  };
}
