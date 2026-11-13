import { apiClient } from './client';

export type NotificationFilter =
  | 'all'
  | 'unread'
  | 'urgent'
  | 'mentions'
  | 'ai'
  | 'deadlines'
  | 'billing';

export interface NotificationCounts {
  all: number;
  unread: number;
  urgent: number;
  urgent_unread: number;
  mentions: number;
  ai: number;
  deadlines: number;
  billing: number;
  archived: number;
}

export interface RawNotificationItem {
  id: string;
  type: string;
  module: string;
  priority: 'low' | 'normal' | 'high' | 'critical' | string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  archived: boolean;
  archived_at: string | null;
  created_at: string;
}

export interface NotificationsListResponse {
  notifications: RawNotificationItem[];
  next_cursor: string | null;
  unread_count?: number;
}

export interface PreferenceGroup {
  key: string;
  title: string;
  description: string;
  critical_types: string[];
}

export interface NotificationPreferencesData {
  master_email: boolean;
  categories: Record<string, boolean>; // Email per category
  in_app: Record<string, boolean>; // In-app per category
  groups: PreferenceGroup[];
  digest_mode: 'realtime' | 'daily' | 'weekly';
  digest_time: string; // "HH:MM" e.g. "08:00"
  digest_day: number; // 0 Monday to 6 Sunday
  timezone: string; // IANA e.g. "Africa/Lagos"
  quiet_enabled: boolean;
  quiet_from: string; // "HH:MM" e.g. "21:00"
  quiet_until: string; // "HH:MM" e.g. "06:00"
}

// 1. Get Notification Counts
export async function getNotificationCounts(): Promise<NotificationCounts> {
  const res = await apiClient<{ data: NotificationCounts }>('/notifications/counts');
  return res.data;
}

// 2. List Notifications (Inbox / Filtered / Archived)
export async function listNotifications(params: {
  filter?: NotificationFilter;
  cursor?: string | null;
  limit?: number;
  archived?: boolean;
  signal?: AbortSignal;
}): Promise<NotificationsListResponse> {
  const q = new URLSearchParams();
  if (params.filter && params.filter !== 'all') {
    q.set('filter', params.filter);
  }
  if (params.cursor) {
    q.set('cursor', params.cursor);
  }
  if (params.limit !== undefined) {
    q.set('limit', String(params.limit));
  }
  if (params.archived) {
    q.set('archived', 'true');
  }

  const qs = q.toString() ? `?${q.toString()}` : '';
  const res = params.signal
    ? await apiClient<{ data: NotificationsListResponse }>(`/notifications${qs}`, { signal: params.signal })
    : await apiClient<{ data: NotificationsListResponse }>(`/notifications${qs}`);
  return res.data;
}

// 3. Mark Read
export async function markNotificationRead(id: string): Promise<void> {
  await apiClient(`/notifications/${id}/read`, {
    method: 'POST',
  });
}

// 4. Mark All Read
export async function markAllNotificationsRead(): Promise<void> {
  await apiClient('/notifications/read-all', {
    method: 'POST',
  });
}

// 5. Archive
export async function archiveNotification(id: string): Promise<void> {
  await apiClient(`/notifications/${id}/archive`, {
    method: 'POST',
  });
}

// 6. Restore
export async function restoreNotification(id: string): Promise<void> {
  await apiClient(`/notifications/${id}/restore`, {
    method: 'POST',
  });
}

// 7. Preferences (GET & PUT)
export async function getNotificationPreferences(): Promise<NotificationPreferencesData> {
  const res = await apiClient<{ data: NotificationPreferencesData }>('/notifications/preferences');
  return res.data;
}

export async function updateNotificationPreferences(
  patch: Partial<{
    master_email: boolean;
    categories: Record<string, boolean>;
    in_app: Record<string, boolean>;
    digest_mode: 'realtime' | 'daily' | 'weekly';
    digest_time: string;
    digest_day: number;
    timezone: string;
    quiet_enabled: boolean;
    quiet_from: string;
    quiet_until: string;
  }>
): Promise<NotificationPreferencesData> {
  const res = await apiClient<{ data: NotificationPreferencesData }>('/notifications/preferences', {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
  return res.data;
}
