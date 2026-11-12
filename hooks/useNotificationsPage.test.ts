import { describe, it, expect } from 'vitest';
import { matchesFilterChip } from './useNotificationsPage';
import { type EnrichedNotification } from './useNotifications';

describe('matchesFilterChip', () => {
  const baseNotification: EnrichedNotification = {
    id: 'notif-1',
    type: 'roadmap.milestone.due_soon',
    module: 'roadmap',
    priority: 'normal',
    title: 'Milestone due soon',
    body: 'Launch MVP due tomorrow',
    data: {},
    read: false,
    isUnread: true,
    archived: false,
    created_at: '2026-11-08T10:00:00Z',
    time: 'just now',
    section: 'TODAY',
    href: '/roadmap',
    isCritical: false,
    iconText: '🗺',
    iconBg: 'bg-accent-xf7eedc',
  };

  it('matches all unarchived for "all" filter, but rejects archived', () => {
    expect(matchesFilterChip(baseNotification, 'all')).toBe(true);
    expect(matchesFilterChip({ ...baseNotification, archived: true }, 'all')).toBe(false);
  });

  it('matches unread only for "unread" filter', () => {
    expect(matchesFilterChip(baseNotification, 'unread')).toBe(true);
    expect(matchesFilterChip({ ...baseNotification, read: true }, 'unread')).toBe(false);
  });

  it('matches critical notifications for "urgent" filter', () => {
    expect(matchesFilterChip(baseNotification, 'urgent')).toBe(false);
    expect(matchesFilterChip({ ...baseNotification, isCritical: true, priority: 'critical' }, 'urgent')).toBe(true);
  });

  it('does not guess module category chips on the client (defers to server refetch)', () => {
    expect(matchesFilterChip(baseNotification, 'mentions')).toBe(false);
    expect(matchesFilterChip(baseNotification, 'ai')).toBe(false);
    expect(matchesFilterChip(baseNotification, 'deadlines')).toBe(false);
    expect(matchesFilterChip(baseNotification, 'billing')).toBe(false);
  });
});

