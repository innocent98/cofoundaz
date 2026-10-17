import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { mapNotification, notificationHref, NotificationsProvider, useNotifications, type RawNotification } from './useNotifications';
import { RealtimeProvider } from '@/components/realtime-context';
import * as clientModule from '@/lib/api/client';
import * as streamModule from '@/lib/realtime/stream';

vi.mock('@/lib/api/client', async (orig) => ({ ...(await orig<typeof import('@/lib/api/client')>()), apiClient: vi.fn() }));
vi.mock('@/lib/realtime/stream', async (orig) => ({ ...(await orig<typeof import('@/lib/realtime/stream')>()), openNotificationStream: vi.fn() }));

// Live captures: dashboard.briefing.ready (briefing v2 guide) and kpi.threshold.crossed (KPI guide 7b).
const briefingReady: RawNotification = {
  id: 'e92e73ff',
  type: 'dashboard.briefing.ready',
  title: 'Your daily AI briefing is ready',
  body: '',
  data: { startup_id: '11ba2aa0', briefing_id: '15615fdd' },
  read: false,
  created_at: '2026-10-17T22:02:19.293707+00:00',
};
const threshold: RawNotification = {
  id: '5eb58a08',
  type: 'kpi.threshold.crossed',
  title: 'Runway crossed 3 months: now 1.5 months',
  body: '',
  data: { metric: 'runway', value: 1.5, threshold: 3, audience: 'finance' },
  read: false,
  created_at: '2026-10-17T22:52:37.901268+00:00',
};

describe('notification deep links', () => {
  it('briefing ready goes to the dashboard', () => {
    expect(notificationHref(briefingReady.type, briefingReady.data)).toBe('/dashboard');
  });

  it('KPI thresholds deep-link by metric', () => {
    expect(notificationHref('kpi.threshold.crossed', { metric: 'runway' })).toBe('/finance/runway');
    expect(notificationHref('kpi.threshold.crossed', { metric: 'revenue' })).toBe('/finance');
    expect(notificationHref('kpi.threshold.crossed', { metric: 'campaign_ctr' })).toBe('/marketing/analytics');
    expect(notificationHref('kpi.threshold.crossed', {})).toBe('/dashboard');
  });

  it('other live notification types lead to their module', () => {
    expect(notificationHref('workspace.member.joined', {})).toBe('/team');
    expect(notificationHref('finance.runway.low', {})).toBe('/finance/runway');
    expect(notificationHref('assessment.completed', {})).toBe('/assessment/results');
    expect(notificationHref('healthscore.dropped', {})).toBe('/health');
  });

  it('types without a destination have none', () => {
    expect(notificationHref('document.shared', {})).toBeNull();
  });

  it('mapNotification carries the title, href and unread flag', () => {
    const n = mapNotification(threshold);
    expect(n).toMatchObject({ title: 'Runway crossed 3 months: now 1.5 months', href: '/finance/runway', isUnread: true, category: 'Finance' });
  });
});

describe('useNotifications (provider + live stream)', () => {
  let emit: (event: string, data: unknown) => void;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('cf_token', 't');
    const handlers = new Map<string, Set<(d: unknown) => void>>();
    emit = (event, data) => handlers.get(event)?.forEach((h) => h(data));
    vi.mocked(streamModule.openNotificationStream).mockReturnValue({
      subscribe: (event: string, h: (d: unknown) => void) => {
        if (!handlers.has(event)) handlers.set(event, new Set());
        handlers.get(event)!.add(h);
        return () => handlers.get(event)!.delete(h);
      },
      close: vi.fn(),
    } as unknown as ReturnType<typeof streamModule.openNotificationStream>);
    vi.mocked(clientModule.apiClient).mockImplementation(async (url: string) => {
      if (url.startsWith('/notifications?')) return { data: { notifications: [briefingReady], next_cursor: null } };
      if (url === '/notifications/unread-count') return { data: { unread: 1 } };
      return {};
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <RealtimeProvider>
      <NotificationsProvider>{children}</NotificationsProvider>
    </RealtimeProvider>
  );

  it('throws outside the provider', () => {
    expect(() => renderHook(() => useNotifications())).toThrow(/NotificationsProvider/);
  });

  it('notification.created prepends once (deduped) and bumps unread; unread frame is authoritative', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(result.current.unreadCount).toBe(1));
    act(() => emit('notification.created', threshold));
    expect(result.current.items.map((i) => i.id)).toEqual(['5eb58a08', 'e92e73ff']);
    expect(result.current.unreadCount).toBe(2);
    act(() => emit('notification.created', threshold));
    expect(result.current.items).toHaveLength(2);
    expect(result.current.unreadCount).toBe(2);
    act(() => emit('unread', { unread: 7 }));
    expect(result.current.unreadCount).toBe(7);
  });

  it('resync (reconnect or refocus) refetches the feed', async () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(result.current.items).toHaveLength(1));
    const before = vi.mocked(clientModule.apiClient).mock.calls.length;
    act(() => emit('resync', null));
    await waitFor(() => expect(vi.mocked(clientModule.apiClient).mock.calls.length).toBeGreaterThan(before));
  });
});
