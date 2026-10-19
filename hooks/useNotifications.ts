import React, { createContext, createElement, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, ApiError } from '@/lib/api/client';
import { useRealtimeEvent } from '@/components/realtime-context';

export type NotificationCategory = 'All' | 'Unread' | 'Urgent' | 'Missions' | 'Finance' | 'Team';

export interface NotificationItem {
  id: string;
  section: 'TODAY' | 'EARLIER THIS WEEK';
  category: NotificationCategory;
  title: string;
  description: string;
  time: string;
  actionText?: string;
  /** Where the notification leads, when its type has a destination. */
  href: string | null;
  isUnread: boolean;
  iconBg: string;
  iconText: string;
}

export interface RawNotification {
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
/** Deep link for a notification, from its type and `data` (BE guides: KPIs 7b, briefing v2 section 5). */
export function notificationHref(type: string, data: Record<string, unknown> | null | undefined): string | null {
  if (type === 'dashboard.briefing.ready') return '/dashboard';
  if (type === 'workspace.member.joined') return '/team';
  if (type === 'finance.runway.low') return '/finance/runway';
  if (type === 'assessment.completed') return '/assessment/results';
  if (type === 'healthscore.dropped' || type === 'healthscore.record') return '/health';
  if (type === 'validation.smoke_test.milestone') {
    return typeof data?.experiment_id === 'string'
      ? `/validation/smoke-tests?test=${encodeURIComponent(data.experiment_id)}`
      : '/validation/smoke-tests';
  }
  if (type === 'validation.insight.detected') {
    return typeof data?.insight_id === 'string'
      ? `/validation/interviews?insight=${encodeURIComponent(data.insight_id)}`
      : '/validation/interviews';
  }
  if (type === 'roadmap.milestone.overdue') return '/roadmap/replan';
  if (type === 'roadmap.milestone.due_soon') {
    return typeof data?.milestone_id === 'string' ? `/roadmap?milestone=${encodeURIComponent(data.milestone_id)}` : '/roadmap';
  }
  if (type === 'team.comment.mentioned') {
    const id = typeof data?.entity_id === 'string' ? encodeURIComponent(data.entity_id) : null;
    if (id && data?.entity_type === 'roadmap_milestone') return `/roadmap?milestone=${id}`;
    if (id && data?.entity_type === 'roadmap_task') return `/roadmap?task=${id}`;
    return '/roadmap';
  }
  if (type === 'kpi.threshold.crossed') {
    switch (data?.metric) {
      case 'runway':
        return '/finance/runway';
      case 'revenue':
        return '/finance';
      case 'campaign_ctr':
        return '/marketing/analytics';
      default:
        return '/dashboard';
    }
  }
  return null;
}

function categoryFor(type: string): NotificationCategory {
  if (type.startsWith('mission') || type.startsWith('roadmap') || type.startsWith('business') || type.startsWith('assessment')) return 'Missions';
  if (type.startsWith('healthscore') || type.startsWith('finance') || type.startsWith('kpi')) return 'Finance';
  if (type.startsWith('workspace') || type.startsWith('document') || type.startsWith('team')) return 'Team';
  return 'Missions';
}

function iconFor(type: string): { iconText: string; iconBg: string } {
  if (type.startsWith('document')) return { iconText: '📄', iconBg: 'bg-[#EAF2ED]' };
  if (type.startsWith('business')) return { iconText: '🧩', iconBg: 'bg-[#F7EEDC]' };
  if (type.startsWith('assessment') || type.startsWith('healthscore')) return { iconText: '✓', iconBg: 'bg-[#EAF2ED]' };
  if (type.startsWith('mission')) return { iconText: '◎', iconBg: 'bg-[#EAF2ED]' };
  if (type.startsWith('dashboard')) return { iconText: '✦', iconBg: 'bg-[#EAF2ED]' };
  if (type.startsWith('kpi')) return { iconText: '↗', iconBg: 'bg-[#F7EEDC]' };
  if (type.startsWith('roadmap')) return { iconText: '🗺', iconBg: 'bg-[#F7EEDC]' };
  if (type.startsWith('workspace') || type.startsWith('team')) return { iconText: '👤', iconBg: 'bg-[#EAF2ED]' };
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

export function mapNotification(n: RawNotification): NotificationItem {
  const { iconText, iconBg } = iconFor(n.type);
  return {
    id: n.id,
    section: sectionFor(n.created_at),
    category: categoryFor(n.type),
    title: n.title,
    description: '', // body is always "" in v1, don't fabricate a subtitle
    time: relativeTime(n.created_at),
    // `body` is "" in v1 except where a type sends a CTA label (the insight notification: "See insight").
    actionText: n.type === 'validation.insight.detected' && n.body ? n.body : undefined,
    href: notificationHref(n.type, n.data),
    isUnread: !n.read,
    iconBg,
    iconText,
  };
}

function useNotificationsState() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const itemsRef = useRef<NotificationItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

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

  // Live stream (same connection as Team activity): `unread` is authoritative,
  // `notification.created` is a feed row; a reconnect or refocus refetches.
  useRealtimeEvent('unread', (data) => {
    const n = (data as { unread?: number } | null)?.unread;
    if (typeof n === 'number') setUnreadCount(n);
  });
  useRealtimeEvent('notification.created', (data) => {
    const raw = data as RawNotification | null;
    if (!raw || typeof raw.id !== 'string' || itemsRef.current.some((x) => x.id === raw.id)) return;
    setItems((prev) => [mapNotification(raw), ...prev]);
    setUnreadCount((c) => c + 1);
  });
  useRealtimeEvent('resync', () => {
    void refetch();
  });

  return { items, setItems, unreadCount, loading, error, refetch, markRead, markAllRead };
}

type NotificationsState = ReturnType<typeof useNotificationsState>;

const NotificationsContext = createContext<NotificationsState | null>(null);

/** One feed + unread count for the whole shell (sidebar badge, bell, tab bar, inbox page). */
export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const state = useNotificationsState();
  return createElement(NotificationsContext.Provider, { value: state }, children);
}

export function useNotifications(): NotificationsState {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationsProvider');
  return ctx;
}
