import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';

export type NotificationCategory = 'All' | 'Unread' | 'Urgent' | 'Missions' | 'Finance' | 'Team';

export interface NotificationItem {
  id: string;
  section: 'TODAY' | 'EARLIER THIS WEEK';
  category: NotificationCategory;
  title: string;
  description: string;
  time: string;
  actionText?: string;
  isUnread: boolean;
  iconBg: string;
  iconText: string;
}

interface RawNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

// --- type → presentation --------------------------------------------------
// `title` is generic per type and `body` is always "" in v1 (guide §1/§5); we
// derive the icon and a filter category from the dotted `type`.
function categoryFor(type: string): NotificationCategory {
  if (type.startsWith('mission') || type.startsWith('roadmap') || type.startsWith('business') || type.startsWith('assessment')) return 'Missions';
  if (type.startsWith('healthscore') || type.startsWith('finance')) return 'Finance';
  if (type.startsWith('workspace') || type.startsWith('document')) return 'Team';
  return 'Missions';
}

function iconFor(type: string): { iconText: string; iconBg: string } {
  if (type.startsWith('document')) return { iconText: '📄', iconBg: 'bg-[#EAF2ED]' };
  if (type.startsWith('business')) return { iconText: '🧩', iconBg: 'bg-[#F7EEDC]' };
  if (type.startsWith('assessment') || type.startsWith('healthscore')) return { iconText: '✓', iconBg: 'bg-[#EAF2ED]' };
  if (type.startsWith('mission')) return { iconText: '◎', iconBg: 'bg-[#EAF2ED]' };
  if (type.startsWith('roadmap')) return { iconText: '🗺', iconBg: 'bg-[#F7EEDC]' };
  if (type.startsWith('workspace')) return { iconText: '👤', iconBg: 'bg-[#EAF2ED]' };
  return { iconText: '•', iconBg: 'bg-[#F5F5F0]' };
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Math.floor((Date.now() - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function sectionFor(iso: string): NotificationItem['section'] {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  return sameDay ? 'TODAY' : 'EARLIER THIS WEEK';
}

function mapNotification(n: RawNotification): NotificationItem {
  const { iconText, iconBg } = iconFor(n.type);
  return {
    id: n.id,
    section: sectionFor(n.created_at),
    category: categoryFor(n.type),
    title: n.title,
    description: '', // body is always "" in v1 — don't fabricate a subtitle
    time: relativeTime(n.created_at),
    isUnread: !n.read,
    iconBg,
    iconText,
  };
}

export function useNotifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [feed, count] = await Promise.all([
        apiClient<{ data?: { notifications?: RawNotification[]; next_cursor?: string | null } }>('/notifications?limit=50'),
        apiClient<{ data?: { unread?: number } }>('/notifications/unread-count').catch(() => ({ data: { unread: 0 } })),
      ]);
      const rows = feed?.data?.notifications ?? [];
      setItems(rows.map(mapNotification));
      setUnreadCount(count?.data?.unread ?? rows.filter((r) => !r.read).length);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        console.warn('Notifications unauthorized:', err.message);
      }
      setError(err instanceof Error ? err : new Error(String(err)));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      refetch();
    });
  }, [refetch]);

  const markRead = useCallback(async (id: string) => {
    // optimistic
    setItems((prev) => prev.map((n) => (n.id === id && n.isUnread ? { ...n, isUnread: false } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await apiClient(`/notifications/${id}/read`, { method: 'POST' });
    } catch (err) {
      // 404 (cross-user / gone) → leave it read locally; otherwise reconcile
      if (!(err instanceof ApiError && err.status === 404)) {
        void refetch();
      }
    }
  }, [refetch]);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isUnread: false })));
    setUnreadCount(0);
    try {
      await apiClient('/notifications/read-all', { method: 'POST' });
    } catch {
      void refetch();
    }
  }, [refetch]);

  return { items, setItems, unreadCount, loading, error, refetch, markRead, markAllRead };
}
