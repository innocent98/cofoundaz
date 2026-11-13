import { useState, useEffect, useCallback, useRef } from 'react';
import { formatApiErrorMessage } from '@/lib/api/client';
import { useRealtimeEvent } from '@/components/realtime-context';
import { useNotifications, enrichNotification, type EnrichedNotification } from './useNotifications';
import {
  listNotifications,
  archiveNotification,
  restoreNotification,
  type NotificationFilter,
  type RawNotificationItem,
} from '@/lib/api/notifications';

/**
 * Determines whether a new realtime notification can be prepended immediately
 * without guessing module-category memberships.
 * Only 'all', 'unread', and 'urgent' are known deterministically on the client;
 * other category chips (mentions, ai, deadlines, billing) trigger an authoritative server refetch.
 */
export function matchesFilterChip(n: EnrichedNotification, filter: NotificationFilter): boolean {
  if (n.archived) return false;
  if (filter === 'all') return true;
  if (filter === 'unread') return !n.read;
  if (filter === 'urgent') return n.isCritical || n.priority === 'critical';
  return false;
}

export function useNotificationsPage() {
  const { counts, fetchCounts, markRead: globalMarkRead, markAllRead: globalMarkAllRead } = useNotifications();

  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [items, setItems] = useState<EnrichedNotification[]>([]);
  const [archivedItems, setArchivedItems] = useState<EnrichedNotification[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [archivedNextCursor, setArchivedNextCursor] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [archivedError, setArchivedError] = useState<string | null>(null);

  // Stale request guard / cancellation tracking
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeRequestIdRef = useRef(0);
  const itemsRef = useRef<EnrichedNotification[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Fetch inbox feed with cancellation guard
  const fetchInbox = useCallback(async (activeFilter: NotificationFilter, cursor?: string | null) => {
    if (!cursor) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
    }
    const signal = !cursor ? abortControllerRef.current?.signal : undefined;
    const reqId = ++activeRequestIdRef.current;

    setLoading(true);
    setError(null);
    try {
      const res = await listNotifications({
        filter: activeFilter,
        cursor: cursor ?? undefined,
        limit: 20,
        signal,
      });

      // Ignore if a newer request started
      if (reqId !== activeRequestIdRef.current) return;

      const enriched = res.notifications.map(enrichNotification);
      if (cursor) {
        setItems((prev) => [...prev, ...enriched]);
      } else {
        setItems(enriched);
      }
      setNextCursor(res.next_cursor);
      void fetchCounts();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      if (reqId !== activeRequestIdRef.current) return;

      setError(formatApiErrorMessage(err, 'Could not load notifications.'));
    } finally {
      if (reqId === activeRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, [fetchCounts]);

  // Fetch archived list
  const fetchArchived = useCallback(async (cursor?: string | null) => {
    setArchivedLoading(true);
    setArchivedError(null);
    try {
      const res = await listNotifications({
        archived: true,
        cursor: cursor ?? undefined,
        limit: 20,
      });
      const enriched = res.notifications.map(enrichNotification);
      if (cursor) {
        setArchivedItems((prev) => [...prev, ...enriched]);
      } else {
        setArchivedItems(enriched);
      }
      setArchivedNextCursor(res.next_cursor);
    } catch (err) {
      setArchivedError(formatApiErrorMessage(err, 'Could not load archived notifications.'));
    } finally {
      setArchivedLoading(false);
    }
  }, []);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Filter change
  const setFilterCategory = useCallback((f: NotificationFilter) => {
    setFilter(f);
  }, []);

  // Initial load & filter changes
  useEffect(() => {
    queueMicrotask(() => {
      void fetchInbox(filter);
    });
  }, [fetchInbox, filter]);

  // Load more inbox
  const loadMore = useCallback(async () => {
    if (!nextCursor || loading) return;
    await fetchInbox(filter, nextCursor);
  }, [nextCursor, loading, fetchInbox, filter]);

  // Load more archived
  const loadMoreArchived = useCallback(async () => {
    if (!archivedNextCursor || archivedLoading) return;
    await fetchArchived(archivedNextCursor);
  }, [archivedNextCursor, archivedLoading, fetchArchived]);

  // Mark single read
  const markRead = useCallback(
    async (id: string) => {
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true, isUnread: false } : n)));
      await globalMarkRead(id);
    },
    [globalMarkRead]
  );

  // Mark all read
  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true, isUnread: false })));
    await globalMarkAllRead();
  }, [globalMarkAllRead]);

  // Archive
  const archive = useCallback(
    async (id: string): Promise<boolean> => {
      const item = items.find((n) => n.id === id);
      if (!item) return false;

      // Optimistic removal
      setItems((prev) => prev.filter((n) => n.id !== id));
      try {
        await archiveNotification(id);
        void fetchCounts();
        return true;
      } catch {
        // Reconcile
        void fetchInbox(filter);
        return false;
      }
    },
    [items, fetchCounts, fetchInbox, filter]
  );

  // Restore
  const restore = useCallback(
    async (id: string): Promise<boolean> => {
      setArchivedItems((prev) => prev.filter((n) => n.id !== id));
      try {
        await restoreNotification(id);
        void fetchCounts();
        void fetchInbox(filter);
        return true;
      } catch {
        void fetchArchived();
        return false;
      }
    },
    [fetchCounts, fetchInbox, filter, fetchArchived]
  );

  // Realtime push handling
  useRealtimeEvent('notification.created', (data) => {
    const raw = data as RawNotificationItem | null;
    if (!raw || typeof raw.id !== 'string') return;
    if (raw.archived) return;
    if (itemsRef.current.some((x) => x.id === raw.id)) return;

    const enriched = enrichNotification(raw);
    if (matchesFilterChip(enriched, filter)) {
      setItems((prev) => [enriched, ...prev]);
    } else if (filter !== 'all' && filter !== 'unread' && filter !== 'urgent') {
      // For category chips (mentions, ai, deadlines, billing), refetch the active chip rather than guessing
      void fetchInbox(filter);
    }
    void fetchCounts();
  });

  useRealtimeEvent('resync', () => {
    void fetchInbox(filter);
  });

  return {
    items,
    archivedItems,
    counts,
    filter,
    setFilterCategory,
    nextCursor,
    archivedNextCursor,
    loading,
    archivedLoading,
    error,
    archivedError,
    fetchInbox,
    fetchArchived,
    loadMore,
    loadMoreArchived,
    markRead,
    markAllRead,
    archive,
    restore,
  };
}

