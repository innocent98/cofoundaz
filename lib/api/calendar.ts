import { apiClient } from './client';
import { apiErrorInfo } from './api-error';

// Typed client for /calendar (feed, events, meetings, reminder rules, Google sync).
// Shapes come from docs/fe-integration-guide-calendar-v2.md in cofoundaz-api, which
// is pasted from live responses. `req` unwraps the `{data, meta}` envelope.

export type FeedLayer = 'milestone' | 'compliance' | 'meeting' | 'team' | 'marketing' | 'external' | 'busy';
export type EventType = 'milestone' | 'meeting' | 'deadline' | 'task';
export type Visibility = 'team' | 'private';

export interface FeedRef {
  type: 'event' | 'milestone' | 'marketing_post' | 'external';
  id: string;
}

export interface FeedItem {
  id: string;
  layer: FeedLayer;
  kind: string;
  title: string;
  /** Start day, YYYY-MM-DD. */
  date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  timezone: string;
  status: string | null;
  /** Null on `busy` items. */
  ref: FeedRef | null;
  private: boolean;
}

export interface Feed {
  items: FeedItem[];
  counts: Record<FeedLayer, number>;
  layers: FeedLayer[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  event_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  description: string | null;
  timezone: string;
  location: string | null;
  video_url: string | null;
  visibility: Visibility;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventInput {
  title: string;
  type: EventType;
  event_date: string;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  all_day?: boolean;
  description?: string | null;
  timezone?: string;
  location?: string | null;
  video_url?: string | null;
  visibility?: Visibility;
}

export interface CalendarMilestone {
  id: string;
  title: string;
  due_on: string | null;
  status: string;
  calendar_status: 'on_track' | 'at_risk' | 'complete' | 'not_started';
  progress: number;
  days_left: number | null;
  tasks_done: number;
  tasks_total: number;
}

export interface MilestonesResponse {
  milestones: CalendarMilestone[];
  summary: { total: number; complete: number };
}

export interface Attendee {
  email: string;
  name: string | null;
  user_id: string | null;
  internal: boolean;
  invite_state: 'pending' | 'sent' | 'failed' | string;
}

export interface ActionItem {
  id: string;
  title: string;
  task_id: string | null;
  assignee_id: string | null;
}

export type AssistantState = 'idle' | 'queued' | 'ready' | 'failed';

export interface Meeting {
  id: string;
  title: string;
  event_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  timezone: string;
  location: string | null;
  video_url: string | null;
  description: string | null;
  visibility: Visibility;
  created_by: string | null;
  agenda: string | null;
  assistant_enabled: boolean;
  assistant_state: AssistantState;
  assistant_error: string | null;
  summary: string | null;
  decisions: string[];
  action_items: ActionItem[];
  has_transcript: boolean;
  summarised_at: string | null;
  attendees: Attendee[];
  can_manage: boolean;
  /** Absent for read-only (invited) viewers. */
  transcript?: string | null;
}

export interface MeetingInput {
  title: string;
  event_date: string;
  end_date?: string | null;
  start_time: string;
  end_time?: string | null;
  timezone?: string;
  location?: string | null;
  video_url?: string | null;
  description?: string | null;
  agenda?: string | null;
  attendees?: Array<{ email: string; name?: string | null }>;
  assistant_enabled?: boolean;
  visibility?: Visibility;
}

export type ReminderKind = 'milestone' | 'compliance' | 'meeting';

export interface ReminderRule {
  kind: ReminderKind;
  offsets_minutes: number[];
  is_default: boolean;
  default_offsets_minutes: number[];
}

export interface ReminderRules {
  rules: ReminderRule[];
  can_edit: boolean;
}

export type SyncDirection = 'two_way' | 'pull_only' | 'push_only';

export interface GoogleConnection {
  provider: 'google';
  connected: boolean;
  status: 'disconnected' | 'active' | 'needs_attention';
  account_email: string | null;
  direction: SyncDirection;
  calendar_id: string;
  last_sync_at: string | null;
  last_sync_summary: { pulled?: number; pushed?: number; removed?: number; skipped?: boolean } | null;
  last_error: string | null;
  needs_attention: boolean;
}

export interface SyncStatus {
  configured: boolean;
  google: GoogleConnection;
  outlook: { provider: 'outlook'; available: boolean };
}

export interface GoogleCalendarOption {
  id: string;
  name: string;
  primary: boolean;
  writable: boolean;
}

/** One call, `{data}` envelope removed. */
async function req<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return (await apiClient<{ data: T }>(endpoint, options)).data;
}

/** Ids can come from the URL (`?event=`, `?meeting=`): never let one add path segments. */
const enc = encodeURIComponent;

const JSON_BODY = (body: unknown): RequestInit => ({ body: JSON.stringify(body) });

export const calendarApi = {
  feed: (dateFrom: string, dateTo: string, layers?: FeedLayer[]) => {
    const q = new URLSearchParams({ date_from: dateFrom, date_to: dateTo });
    if (layers) q.set('layers', layers.join(','));
    return req<Feed>(`/calendar/feed?${q.toString()}`);
  },

  getEvent: (id: string) => req<CalendarEvent>(`/calendar/events/${enc(id)}`),
  createEvent: (input: EventInput) =>
    req<CalendarEvent>('/calendar/events', { method: 'POST', ...JSON_BODY(input) }),
  updateEvent: (id: string, patch: Partial<EventInput>) =>
    req<CalendarEvent>(`/calendar/events/${enc(id)}`, { method: 'PATCH', ...JSON_BODY(patch) }),
  deleteEvent: (id: string) => req<unknown>(`/calendar/events/${enc(id)}`, { method: 'DELETE' }),

  milestones: () => req<MilestonesResponse>('/calendar/milestones'),

  meetings: (when: 'upcoming' | 'past' | 'all' = 'upcoming') =>
    req<{ meetings: Meeting[] }>(`/calendar/meetings?when=${when}`),
  getMeeting: (id: string) => req<Meeting>(`/calendar/meetings/${enc(id)}`),
  createMeeting: (input: MeetingInput) =>
    req<Meeting>('/calendar/meetings', { method: 'POST', ...JSON_BODY(input) }),
  updateMeeting: (id: string, patch: Partial<MeetingInput>) =>
    req<Meeting>(`/calendar/meetings/${enc(id)}`, { method: 'PATCH', ...JSON_BODY(patch) }),
  deleteMeeting: (id: string) => req<unknown>(`/calendar/meetings/${enc(id)}`, { method: 'DELETE' }),
  runAssistant: (id: string, transcript: string) =>
    req<{ assistant_state: AssistantState }>(`/calendar/meetings/${enc(id)}/assistant`, {
      method: 'POST',
      ...JSON_BODY({ transcript }),
    }),
  patchActionItem: (id: string, itemId: string, patch: { title?: string; assignee_id?: string | null }) =>
    req<ActionItem>(`/calendar/meetings/${enc(id)}/action-items/${enc(itemId)}`, { method: 'PATCH', ...JSON_BODY(patch) }),
  addToTasks: (id: string, itemIds?: string[]) =>
    req<{ created: Array<{ item_id: string; task_id: string }>; milestone_id: string; action_items: ActionItem[] }>(
      `/calendar/meetings/${enc(id)}/action-items/add-to-tasks`,
      { method: 'POST', ...JSON_BODY(itemIds ? { item_ids: itemIds } : {}) },
    ),

  reminderRules: () => req<ReminderRules>('/calendar/reminder-rules'),
  saveReminderRule: (kind: ReminderKind, offsets: number[]) =>
    req<ReminderRules>(`/calendar/reminder-rules/${enc(kind)}`, { method: 'PUT', ...JSON_BODY({ offsets_minutes: offsets }) }),
  resetReminderRule: (kind: ReminderKind) =>
    req<ReminderRules>(`/calendar/reminder-rules/${enc(kind)}`, { method: 'DELETE' }),

  syncStatus: () => req<SyncStatus>('/calendar/sync'),
  // The connect call sets an HttpOnly cookie on the API origin that the callback checks, so it must send credentials.
  connectGoogle: () =>
    req<{ auth_url: string; expires_in: number }>('/calendar/sync/google/connect', {
      method: 'POST',
      credentials: 'include',
    }),
  googleCalendars: () =>
    req<{ calendars: GoogleCalendarOption[]; selected: string }>('/calendar/sync/google/calendars'),
  updateGoogle: (patch: { direction?: SyncDirection; calendar_id?: string }) =>
    req<GoogleConnection>('/calendar/sync/google', { method: 'PATCH', ...JSON_BODY(patch) }),
  syncGoogleNow: () =>
    req<{ summary: GoogleConnection['last_sync_summary']; connection: GoogleConnection }>(
      '/calendar/sync/google/sync',
      { method: 'POST' },
    ),
  disconnectGoogle: () =>
    req<{ disconnected: boolean; imported_events_removed: number }>('/calendar/sync/google', { method: 'DELETE' }),
};

/** The server's own sentence for a failed call, else `fallback`. Cross-field rules come back with a "Value error, " prefix. */
export function calendarErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const info = apiErrorInfo(err, fallback);
  const first = info.fieldErrors.find((f) => f.field === '');
  return (first?.message ?? info.message).replace(/^Value error, /, '');
}

/** Field errors by field name, prefix stripped; errors with no field are under ''. */
export function calendarFieldErrors(err: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of apiErrorInfo(err, '').fieldErrors) {
    if (!(f.field in out)) out[f.field] = f.message.replace(/^Value error, /, '');
  }
  return out;
}

export function calendarErrorCode(err: unknown): string | null {
  return apiErrorInfo(err, '').code;
}
