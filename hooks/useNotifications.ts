import React, { createContext, createElement, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ApiError, formatApiErrorMessage } from '@/lib/api/client';
import { legalNotificationHref } from '@/lib/legal-format';
import { useRealtimeEvent } from '@/components/realtime-context';
import {
  getNotificationCounts,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationCounts,
  type RawNotificationItem,
} from '@/lib/api/notifications';

export type NotificationSection = 'TODAY' | 'THIS WEEK' | 'EARLIER';

export interface RawNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
  module?: string;
  priority?: string;
  archived?: boolean;
}

export interface EnrichedNotification {
  id: string;
  type: string;
  module: string;
  priority: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  isUnread: boolean; // Backwards compatible with DashboardNavbar
  archived: boolean;
  created_at: string;
  time: string;
  section: NotificationSection;
  href: string | null;
  actionText?: string;
  isCritical: boolean;
  iconText: string;
  iconBg: string;
}

// Deep links mapping based on type and data
function marketingHref(type: string, data: Record<string, unknown> | null | undefined): string | null {
  const href = data?.href;
  if (typeof href === 'string' && /^\/marketing(\/|\?|$)/.test(href) && !href.startsWith('//')) return href;
  if (type === 'marketing.post.published' && typeof data?.entry_id === 'string') {
    return `/marketing/calendar?entry=${encodeURIComponent(data.entry_id)}`;
  }
  if (type.startsWith('marketing.campaign') && typeof data?.campaign_id === 'string') {
    return `/marketing/campaigns/${encodeURIComponent(data.campaign_id)}`;
  }
  return '/marketing';
}

function salesHref(data: Record<string, unknown> | null | undefined): string {
  const href = data?.href;
  if (typeof href === 'string' && /^\/sales(\/|\?|$)/.test(href) && !href.startsWith('//')) return href;
  if (typeof data?.deal_id === 'string') return `/sales?deal=${encodeURIComponent(data.deal_id)}`;
  return '/sales';
}

function documentsHref(type: string, data: Record<string, unknown> | null | undefined): string {
  const href = data?.href;
  if (typeof href === 'string' && /^\/documents(\/|$)/.test(href) && !href.startsWith('//')) return href;
  if (type.startsWith('document.signature')) return '/documents/signatures';
  if (type === 'document.grant.created') return '/documents/shared-with-me';
  return '/documents';
}

export function notificationHref(type: string, data: Record<string, unknown> | null | undefined): string | null {
  if (type.startsWith('document.')) return documentsHref(type, data);
  if (type.startsWith('marketing.')) return marketingHref(type, data);
  if (type.startsWith('sales.')) return salesHref(data);
  if (type.startsWith('legal.')) return legalNotificationHref(type, data);
  if (type === 'dashboard.briefing.ready') return '/dashboard';
  if (type === 'learning.course.completed') return '/academy/certificates';
  if (type === 'learning.course.recommended') {
    return typeof data?.course_id === 'string' ? `/academy/courses/${encodeURIComponent(data.course_id)}` : '/academy';
  }
  if (type === 'workspace.member.joined') return '/team';
  if (type === 'finance.runway.low') return '/finance/runway';
  if (type === 'assessment.completed') return '/assessment/results';
  if (type === 'assessment.quarterly.due') return '/assessment';
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

// Module icon mapping (15 standard modules)
export function moduleIconFor(module: string): { iconText: string; iconBg: string } {
  const mod = (module || '').toLowerCase();
  switch (mod) {
    case 'marketing':
      return { iconText: '📣', iconBg: 'bg-accent-xf7eedc' };
    case 'sales':
      return { iconText: '💼', iconBg: 'bg-accent-xf7eedc' };
    case 'learning':
    case 'academy':
      return { iconText: '🎓', iconBg: 'bg-brand-tint' };
    case 'documents':
    case 'document':
      return { iconText: '📄', iconBg: 'bg-brand-tint' };
    case 'business':
    case 'business_builder':
      return { iconText: '🧩', iconBg: 'bg-accent-xf7eedc' };
    case 'assessment':
      return { iconText: '✓', iconBg: 'bg-brand-tint' };
    case 'health':
    case 'healthscore':
      return { iconText: '♥', iconBg: 'bg-brand-tint' };
    case 'mission':
      return { iconText: '◎', iconBg: 'bg-brand-tint' };
    case 'dashboard':
      return { iconText: '✦', iconBg: 'bg-brand-tint' };
    case 'kpi':
      return { iconText: '↗', iconBg: 'bg-accent-xf7eedc' };
    case 'roadmap':
      return { iconText: '🗺', iconBg: 'bg-accent-xf7eedc' };
    case 'team':
    case 'workspace':
      return { iconText: '👤', iconBg: 'bg-brand-tint' };
    case 'finance':
      return { iconText: '₦', iconBg: 'bg-accent-xf7eedc' };
    case 'billing':
      return { iconText: '💳', iconBg: 'bg-accent-xf7eedc' };
    case 'validation':
      return { iconText: '🔬', iconBg: 'bg-brand-tint' };
    default:
      return { iconText: '•', iconBg: 'bg-surface-muted' };
  }
}

// Relative time format
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Math.floor((Date.now() - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Group into Today / This week / Earlier (last 7 days = this week, not today)
export function sectionFor(iso: string): NotificationSection {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return 'TODAY';

  const diffMs = now.getTime() - d.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays <= 7) return 'THIS WEEK';

  return 'EARLIER';
}

export function enrichNotification(n: RawNotificationItem | RawNotification): EnrichedNotification {
  const mod = n.module || '';
  const prio = n.priority ?? 'normal';
  const arch = Boolean(n.archived);
  const isUnread = !n.read;
  const { iconText, iconBg } = moduleIconFor(mod);

  return {
    id: n.id,
    type: n.type,
    module: mod,
    priority: prio,
    title: n.title,
    body: n.body || '',
    data: n.data || {},
    read: n.read,
    isUnread,
    archived: arch,
    created_at: n.created_at,
    time: relativeTime(n.created_at),
    section: sectionFor(n.created_at),
    href: notificationHref(n.type, n.data),
    actionText: (n.type === 'validation.insight.detected' || n.type.startsWith('marketing.') || n.type.startsWith('sales.')) && n.body ? n.body : undefined,
    isCritical: prio === 'critical',
    iconText,
    iconBg,
  };
}

export function mapNotification(n: RawNotification | RawNotificationItem): EnrichedNotification {
  return enrichNotification(n);
}

export function useNotificationsState() {
  const [items, setItems] = useState<EnrichedNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [counts, setCounts] = useState<NotificationCounts>({
    all: 0,
    unread: 0,
    urgent: 0,
    urgent_unread: 0,
    mentions: 0,
    ai: 0,
    deadlines: 0,
    billing: 0,
    archived: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const itemsRef = useRef<EnrichedNotification[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Fetch counts
  const fetchCounts = useCallback(async () => {
    try {
      const c = await getNotificationCounts();
      if (c && typeof c.unread === 'number') {
        setCounts(c);
        setUnreadCount(c.unread);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Fetch popover feed (default limit=50)
  const fetchFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [res, countsRes] = await Promise.all([
        listNotifications({ limit: 50 }),
        getNotificationCounts().catch(() => null),
      ]);

      const enriched = res.notifications.map(enrichNotification);
      setItems(enriched);
      if (countsRes && typeof countsRes.unread === 'number') {
        setCounts(countsRes);
        setUnreadCount(countsRes.unread);
      } else if (typeof res.unread_count === 'number') {
        setUnreadCount(res.unread_count);
        setCounts((prev) => ({ ...prev, unread: res.unread_count as number }));
      }
    } catch (err) {
      setError(formatApiErrorMessage(err, 'Could not load notifications.'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    queueMicrotask(() => {
      void fetchFeed();
      void fetchCounts();
    });
  }, [fetchFeed, fetchCounts]);

  // Mark single read
  const markRead = useCallback(async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true, isUnread: false } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    setCounts((prev) => ({
      ...prev,
      unread: Math.max(0, prev.unread - 1),
      urgent_unread: prev.urgent_unread ? Math.max(0, prev.urgent_unread - 1) : 0,
    }));
    try {
      await markNotificationRead(id);
      void fetchCounts();
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 404)) {
        void fetchFeed();
      }
    }
  }, [fetchCounts, fetchFeed]);

  // Mark all read
  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true, isUnread: false })));
    setUnreadCount(0);
    setCounts((prev) => ({ ...prev, unread: 0, urgent_unread: 0 }));
    try {
      await markAllNotificationsRead();
      void fetchCounts();
    } catch (err) {
      void fetchFeed();
      throw err;
    }
  }, [fetchCounts, fetchFeed]);

  // Realtime updates
  useRealtimeEvent('unread', (data) => {
    const n = (data as { unread?: number } | null)?.unread;
    if (typeof n === 'number') {
      setUnreadCount(n);
      setCounts((prev) => ({ ...prev, unread: n }));
    }
  });

  useRealtimeEvent('notification.created', (data) => {
    const raw = data as RawNotificationItem | null;
    if (!raw || typeof raw.id !== 'string') return;
    if (itemsRef.current.some((x) => x.id === raw.id)) return;

    const enriched = enrichNotification(raw);
    setItems((prev) => [enriched, ...prev]);
    if (!enriched.read) {
      setUnreadCount((c) => c + 1);
      setCounts((prev) => ({ ...prev, unread: prev.unread + 1 }));
    }
  });

  useRealtimeEvent('resync', () => {
    void fetchFeed();
    void fetchCounts();
  });

  return {
    items,
    setItems,
    unreadCount,
    counts,
    loading,
    error,
    refetch: fetchFeed,
    fetchCounts,
    markRead,
    markAllRead,
  };
}

export type NotificationsState = ReturnType<typeof useNotificationsState>;

const NotificationsContext = createContext<NotificationsState | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const state = useNotificationsState();
  return createElement(NotificationsContext.Provider, { value: state }, children);
}

export function useNotifications(): NotificationsState {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationsProvider');
  return ctx;
}
