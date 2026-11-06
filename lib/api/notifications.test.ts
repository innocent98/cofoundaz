import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getNotificationCounts,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  archiveNotification,
  restoreNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
} from './notifications';
import * as clientModule from './client';

describe('lib/api/notifications', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches counts from /notifications/counts', async () => {
    const mockCounts = {
      all: 10,
      unread: 3,
      urgent: 1,
      mentions: 0,
      ai: 2,
      deadlines: 1,
      billing: 1,
    };
    vi.spyOn(clientModule, 'apiClient').mockResolvedValueOnce({
      data: mockCounts,
    } as unknown as { data: typeof mockCounts });

    const res = await getNotificationCounts();
    expect(res).toEqual(mockCounts);
  });

  it('lists notifications with filter and cursor params', async () => {
    const mockList = {
      notifications: [
        {
          id: 'n1',
          type: 'billing.payment.failed',
          module: 'billing',
          priority: 'critical',
          title: 'Payment failed',
          body: 'Check card',
          data: {},
          read: false,
          archived: false,
          archived_at: null,
          created_at: '2026-11-04T12:00:00Z',
        },
      ],
      next_cursor: 'cur123',
    };

    const spy = vi.spyOn(clientModule, 'apiClient').mockResolvedValueOnce({
      data: mockList,
    } as unknown as { data: typeof mockList });

    const res = await listNotifications({
      filter: 'urgent',
      cursor: 'cur0',
      limit: 20,
    });

    expect(res.notifications).toHaveLength(1);
    expect(spy).toHaveBeenCalledWith(
      '/notifications?filter=urgent&cursor=cur0&limit=20'
    );
  });

  it('lists archived notifications', async () => {
    const spy = vi.spyOn(clientModule, 'apiClient').mockResolvedValueOnce({
      data: { notifications: [], next_cursor: null },
    } as unknown as { data: { notifications: unknown[]; next_cursor: null } });

    await listNotifications({ archived: true, limit: 20 });
    expect(spy).toHaveBeenCalledWith('/notifications?limit=20&archived=true');
  });

  it('marks single and all notifications read', async () => {
    const spy = vi.spyOn(clientModule, 'apiClient').mockResolvedValue({
      data: {},
    } as unknown as { data: Record<string, never> });

    await markNotificationRead('notif-1');
    expect(spy).toHaveBeenCalledWith('/notifications/notif-1/read', { method: 'POST' });

    await markAllNotificationsRead();
    expect(spy).toHaveBeenCalledWith('/notifications/read-all', { method: 'POST' });
  });

  it('archives and restores notification', async () => {
    const spy = vi.spyOn(clientModule, 'apiClient').mockResolvedValue({
      data: {},
    } as unknown as { data: Record<string, never> });

    await archiveNotification('notif-1');
    expect(spy).toHaveBeenCalledWith('/notifications/notif-1/archive', { method: 'POST' });

    await restoreNotification('notif-1');
    expect(spy).toHaveBeenCalledWith('/notifications/notif-1/restore', { method: 'POST' });
  });

  it('fetches and updates preferences', async () => {
    const mockPrefs = {
      master_email: true,
      categories: { finance: false },
      in_app: { finance: true },
      groups: [],
      digest_mode: 'daily' as const,
      digest_time: '08:00',
      digest_day: 0,
      timezone: 'Africa/Lagos',
      quiet_enabled: true,
      quiet_from: '21:00',
      quiet_until: '06:00',
    };

    const spy = vi.spyOn(clientModule, 'apiClient').mockResolvedValueOnce({
      data: mockPrefs,
    } as unknown as { data: typeof mockPrefs });

    const p = await getNotificationPreferences();
    expect(p.digest_mode).toBe('daily');
    expect(spy).toHaveBeenCalledWith('/notifications/preferences');

    vi.spyOn(clientModule, 'apiClient').mockResolvedValueOnce({
      data: { ...mockPrefs, digest_mode: 'weekly' as const },
    } as unknown as { data: typeof mockPrefs });

    const updated = await updateNotificationPreferences({ digest_mode: 'weekly' });
    expect(updated.digest_mode).toBe('weekly');
  });
});

