import { useState, useCallback, useEffect, useRef } from 'react';
import { apiErrorInfo } from '@/lib/api/api-error';
import {
  archiveConversations,
  deleteConversation,
  listConversations,
  unarchiveConversations,
  type ChatConversationSummary,
  type ChatTopic,
} from '@/lib/api/aiChat';

export const SEARCH_DEBOUNCE_MS = 300;

/**
 * The caller's conversation list with server-side search (title + message text,
 * `match_snippet`), a topic filter and the Archived view. Archived chats are not
 * searchable (D-AI-4), so searching switches the Archived view off.
 */
export function useAIConversationList() {
  const [items, setItems] = useState<ChatConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchInput, setSearchInputState] = useState('');
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<ChatTopic | null>(null);
  const [archived, setArchivedState] = useState(false);
  const seq = useRef(0);

  // The API wants 2 to 100 characters; shorter input means "no query".
  useEffect(() => {
    const t = setTimeout(() => {
      const q = searchInput.trim();
      setQuery(q.length >= 2 ? q.slice(0, 100) : '');
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  const refresh = useCallback(async () => {
    const mine = ++seq.current;
    try {
      const rows = await listConversations({ query, topic, archived });
      if (mine !== seq.current) return;
      setItems(rows);
      setError(false);
    } catch {
      if (mine !== seq.current) return;
      setError(true);
    } finally {
      if (mine === seq.current) setLoading(false);
    }
  }, [query, topic, archived]);

  useEffect(() => {
    queueMicrotask(() => {
      setLoading(true);
      void refresh();
    });
  }, [refresh]);

  const setSearchInput = useCallback((v: string) => {
    setSearchInputState(v);
    if (v.trim().length >= 2) setArchivedState(false);
  }, []);

  const setArchived = useCallback((v: boolean) => {
    setArchivedState(v);
    if (v) {
      setSearchInputState('');
      setQuery('');
    }
  }, []);

  const mutate = useCallback(
    async (fn: () => Promise<unknown>, fallback: string): Promise<boolean> => {
      setActionError(null);
      try {
        await fn();
        await refresh();
        return true;
      } catch (err) {
        setActionError(apiErrorInfo(err, fallback).message);
        return false;
      }
    },
    [refresh]
  );

  const archive = useCallback(
    (ids: string[]) => mutate(() => archiveConversations(ids), "Couldn't archive those conversations. Try again."),
    [mutate]
  );
  const unarchive = useCallback(
    (ids: string[]) => mutate(() => unarchiveConversations(ids), "Couldn't unarchive those conversations. Try again."),
    [mutate]
  );
  const remove = useCallback(
    (id: string) => mutate(() => deleteConversation(id), "Couldn't delete that conversation. Try again."),
    [mutate]
  );

  return {
    items, loading, error, actionError,
    searchInput, setSearchInput, query,
    topic, setTopic, archived, setArchived,
    refresh, archive, unarchive, remove,
  };
}
