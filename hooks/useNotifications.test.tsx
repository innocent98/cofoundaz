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
  it('a smoke-test milestone opens that test', () => {
    expect(notificationHref('validation.smoke_test.milestone', { experiment_id: 'e1' })).toBe('/validation/smoke-tests?test=e1');
    expect(notificationHref('validation.smoke_test.milestone', {})).toBe('/validation/smoke-tests');
  });

  it('briefing ready goes to the dashboard', () => {
    expect(notificationHref(briefingReady.type, briefingReady.data)).toBe('/dashboard');
  });

  it('Roadmap notifications land on the milestone, the task, or the re-plan', () => {
    expect(notificationHref('roadmap.milestone.due_soon', { milestone_id: 'm1', title: 'Launch', relative: 'tomorrow' })).toBe('/roadmap?milestone=m1');
    expect(notificationHref('roadmap.milestone.due_soon', {})).toBe('/roadmap');
    expect(notificationHref('roadmap.milestone.overdue', { milestone_id: 'm1' })).toBe('/roadmap/replan');
    expect(notificationHref('team.comment.mentioned', { entity_type: 'roadmap_milestone', entity_id: 'm1' })).toBe('/roadmap?milestone=m1');
    expect(notificationHref('team.comment.mentioned', { entity_type: 'roadmap_task', entity_id: 't1' })).toBe('/roadmap?task=t1');
    expect(notificationHref('team.comment.mentioned', {})).toBe('/roadmap');
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
    expect(notificationHref('assessment.quarterly.due', { href: '/assessment' })).toBe('/assessment');
    expect(notificationHref('healthscore.dropped', {})).toBe('/health');
    expect(notificationHref('healthscore.record', {})).toBe('/health');
  });

  it('document notifications follow data.href, else the nearest list', () => {
    expect(notificationHref('document.version.created', { href: '/documents/abc' })).toBe('/documents/abc');
    expect(notificationHref('document.grant.created', { href: '/documents/shared-with-me' })).toBe('/documents/shared-with-me');
    expect(notificationHref('document.shared', {})).toBe('/documents');
    expect(notificationHref('document.signature.signed', {})).toBe('/documents/signatures');
    expect(notificationHref('document.grant.created', null)).toBe('/documents/shared-with-me');
    // an external or protocol-relative href is never followed
    expect(notificationHref('document.shared', { href: '//evil.example/documents' })).toBe('/documents');
    expect(notificationHref('document.shared', { href: 'https://evil.example' })).toBe('/documents');
  });

  it('types without a destination have none', () => {
    expect(notificationHref('unknown.thing', {})).toBeNull();
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

// Live captures: guide fe-integration-guide-sales-crm.md §8.2.
describe('sales notifications', () => {
  const won = {
    id: 'fd3cc02d',
    type: 'sales.deal.won',
    title: 'Deal moved to Closed Won: Acme fleet rollout 🎉',
    body: '',
    data: { href: '/sales?deal=f9c69088', name: 'Acme fleet rollout', deal_id: 'f9c69088' },
    read: false,
    created_at: '2026-10-21T11:58:05.499756+00:00',
  };
  const stalled = {
    ...won,
    id: 'c3ecf76c',
    type: 'sales.deal.stalled',
    title: 'Deal stalled: Quiet renewal has had no activity for 20 days',
    body: 'Suggest a follow-up',
    data: { href: '/sales?deal=6c62e89d&followup=1', deal_id: '6c62e89d', days: 20 },
  };

  it('opens the deal drawer from data.href and files under Sales', () => {
    expect(mapNotification(won)).toMatchObject({ href: '/sales?deal=f9c69088', category: 'Sales' });
    expect(mapNotification(stalled)).toMatchObject({ href: '/sales?deal=6c62e89d&followup=1', actionText: 'Suggest a follow-up' });
  });

  it('falls back to the deal id, ignores a foreign href', () => {
    expect(notificationHref('sales.deal.won', { deal_id: 'd9' })).toBe('/sales?deal=d9');
    expect(notificationHref('sales.deal.won', { href: 'https://evil.example/x', deal_id: 'd9' })).toBe('/sales?deal=d9');
    expect(notificationHref('sales.deal.won', { href: '//evil.example/x' })).toBe('/sales');
  });
});

// Live captures: guide fe-integration-guide-marketing-prd.md §1 and §11.
describe('marketing notifications', () => {
  const published: RawNotification = {
    id: 'c2c6c4a9',
    type: 'marketing.post.published',
    title: 'Scheduled post published: Waitlist teaser',
    body: 'See results',
    data: { href: '/marketing/calendar?entry=3eb508f6', title: 'Waitlist teaser', channel: 'organic_social', entry_id: '3eb508f6', was_scheduled: true },
    read: false,
    created_at: '2026-10-20T18:14:38.719632+00:00',
  };
  const readout: RawNotification = {
    id: '484189f8',
    type: 'marketing.campaign.readout.ready',
    title: 'Campaign performance summary ready: Waitlist push',
    body: 'See results',
    data: { href: '/marketing/campaigns/56e3de5a', name: 'Waitlist push', readout_id: '50d8a1e9', campaign_id: '56e3de5a' },
    read: false,
    created_at: '2026-10-20T18:32:44.580169+00:00',
  };

  it('deep-links a published post to its calendar drawer and a readout to its campaign', () => {
    expect(mapNotification(published).href).toBe('/marketing/calendar?entry=3eb508f6');
    expect(mapNotification(readout).href).toBe('/marketing/campaigns/56e3de5a');
  });

  it('files them under Marketing with a See results action, not under Missions', () => {
    const item = mapNotification(published);
    expect(item.category).toBe('Marketing');
    expect(item.actionText).toBe('See results');
    expect(item.iconText).not.toBe('•');
  });

  it('falls back to ids when an older row has no href, and ignores a foreign href', () => {
    expect(notificationHref('marketing.post.published', { entry_id: 'e9' })).toBe('/marketing/calendar?entry=e9');
    expect(notificationHref('marketing.campaign.launched', { campaign_id: 'c9' })).toBe('/marketing/campaigns/c9');
    expect(notificationHref('marketing.post.published', { href: 'https://evil.example/x', entry_id: 'e9' })).toBe('/marketing/calendar?entry=e9');
    expect(notificationHref('marketing.post.published', { href: '//evil.example/x' })).toBe('/marketing');
  });
});
