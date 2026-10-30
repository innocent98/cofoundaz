import { dayKey } from './marketing-calendar';
import type { FeedItem, FeedLayer, ReminderKind } from './api/calendar';

// Pure helpers for the Calendar pages: layer metadata, day bucketing for the
// Month/Week/Agenda layouts, time and reminder wording, and Google callback copy.

export type CalendarView = 'month' | 'week' | 'agenda';

export const LAYER_ORDER: FeedLayer[] = ['milestone', 'compliance', 'meeting', 'team', 'marketing', 'external', 'busy'];

export const LAYER_LABEL: Record<FeedLayer, string> = {
  milestone: 'Roadmap milestones',
  compliance: 'Compliance deadlines',
  meeting: 'Meetings',
  team: 'Team events',
  marketing: 'Marketing schedule',
  external: 'My Google events',
  busy: 'Teammates busy',
};

/** Layers shown by default; `busy` and `external` only matter once Google is connected, so they stay on and cost nothing when empty. */
export const DEFAULT_LAYERS: FeedLayer[] = [...LAYER_ORDER];

export const LAYER_STORAGE_KEY = 'cf_calendar_layers';

/** Restore a saved layer choice, dropping anything this build does not know. Null when nothing valid is saved. */
export function parseSavedLayers(raw: string | null): FeedLayer[] | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const known = parsed.filter((l): l is FeedLayer => LAYER_ORDER.includes(l as FeedLayer));
    return known;
  } catch {
    return null;
  }
}

const pad = (n: number) => String(n).padStart(2, '0');

export function parseDay(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

/** The 6-week grid (Sunday first) that contains the month of `anchor`. */
export function monthGridDays(anchor: Date): Date[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = addDays(first, -first.getDay());
  const lastOfMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const rows = Math.ceil((first.getDay() + lastOfMonth.getDate()) / 7);
  return Array.from({ length: rows * 7 }, (_, i) => addDays(start, i));
}

export const AGENDA_DAYS = 30;

/** Inclusive YYYY-MM-DD bounds of what a view needs from /calendar/feed. */
export function feedRange(view: CalendarView, anchor: Date): { from: string; to: string } {
  if (view === 'month') {
    const days = monthGridDays(anchor);
    return { from: dayKey(days[0]), to: dayKey(days[days.length - 1]) };
  }
  if (view === 'week') {
    const start = addDays(anchor, -anchor.getDay());
    return { from: dayKey(start), to: dayKey(addDays(start, 6)) };
  }
  return { from: dayKey(anchor), to: dayKey(addDays(anchor, AGENDA_DAYS - 1)) };
}

export function shiftView(view: CalendarView, anchor: Date, dir: -1 | 1): Date {
  if (view === 'month') return new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1);
  if (view === 'week') return addDays(anchor, 7 * dir);
  return addDays(anchor, AGENDA_DAYS * dir);
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const WEEKDAY_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function viewLabel(view: CalendarView, anchor: Date): string {
  if (view === 'month') return `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`;
  const { from, to } = feedRange(view, anchor);
  const a = parseDay(from);
  const b = parseDay(to);
  const short = (d: Date) => `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
  return `${short(a)} to ${short(b)}, ${b.getFullYear()}`;
}

/** "Sunday, 1 November" with "Today"/"Tomorrow" prefixes. */
export function dayHeading(key: string, today: Date): string {
  const d = parseDay(key);
  const base = `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  if (key === dayKey(today)) return `Today · ${base}`;
  if (key === dayKey(addDays(today, 1))) return `Tomorrow · ${base}`;
  return base;
}

/** "10:00" → "10:00 AM"; null stays null. */
export function formatClock(t: string | null): string | null {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${pad(m)} ${suffix}`;
}

export function itemTimeLabel(item: Pick<FeedItem, 'all_day' | 'start_time' | 'end_time'>): string {
  if (item.all_day || !item.start_time) return 'All day';
  const start = formatClock(item.start_time);
  const end = formatClock(item.end_time);
  return end ? `${start} to ${end}` : (start as string);
}

function sortKey(i: FeedItem): string {
  // All-day and untimed first, then clock order, then title.
  return `${i.all_day || !i.start_time ? '0' : '1'}|${i.start_time ?? ''}|${i.title}`;
}

/** Bucket items by day. A multi-day item appears on every day it spans (capped to the visible range). */
export function itemsByDay(items: FeedItem[], from: string, to: string): Map<string, FeedItem[]> {
  const map = new Map<string, FeedItem[]>();
  const lo = parseDay(from);
  const hi = parseDay(to);
  for (const item of items) {
    const start = parseDay(item.date);
    const end = item.end_date ? parseDay(item.end_date) : start;
    const first = start < lo ? lo : start;
    const last = end > hi ? hi : end;
    for (let d = first; d <= last; d = addDays(d, 1)) {
      const key = dayKey(d);
      map.set(key, [...(map.get(key) ?? []), item]);
    }
  }
  for (const [k, list] of map) map.set(k, [...list].sort((a, b) => sortKey(a).localeCompare(sortKey(b))));
  return map;
}

export function isSpanContinuation(item: FeedItem, key: string): boolean {
  return item.end_date !== null && key !== item.date;
}

export interface LayerStyle {
  /** Chip/pill classes: a tinted fill, never hue alone (the icon and label carry the meaning too). */
  chip: string;
  dot: string;
}

export const LAYER_STYLE: Record<FeedLayer, LayerStyle> = {
  milestone: { chip: 'bg-accent-xf2ece1 text-accent-x7a6025 border-l-2 border-accent-gold', dot: 'bg-accent-gold' },
  compliance: { chip: 'bg-danger-tint text-danger-bold border-l-2 border-danger-bold', dot: 'bg-danger-bold' },
  meeting: { chip: 'bg-brand-strong text-white', dot: 'bg-brand-strong' },
  team: { chip: 'bg-neutral-xe5efea text-brand-x1e3e2b border-l-2 border-brand-x1e3e2b', dot: 'bg-brand-x1e3e2b' },
  marketing: { chip: 'bg-brand-tint text-brand-strong border-l-2 border-brand-strong', dot: 'bg-brand-tint border border-brand-strong' },
  external: { chip: 'bg-white text-ink border border-line border-dashed', dot: 'bg-white border border-ink-muted' },
  busy: { chip: 'bg-surface-muted text-ink-muted', dot: 'bg-surface-muted border border-line-strong' },
};

/** Where a non-editable item opens, or null when it opens a drawer here. */
export function externalHref(item: FeedItem): string | null {
  if (item.ref?.type === 'milestone') return '/roadmap';
  if (item.ref?.type === 'marketing_post') return '/marketing/calendar';
  return null;
}

// ---- reminders -------------------------------------------------------------

export const REMINDER_KIND_LABEL: Record<ReminderKind, string> = {
  milestone: 'Milestones',
  compliance: 'Deadlines',
  meeting: 'Meetings',
};

export const REMINDER_KIND_HINT: Record<ReminderKind, string> = {
  milestone: 'Roadmap milestones and milestone events you add here.',
  compliance: 'Deadlines you add here. Compliance dates will use this rule when Legal ships.',
  meeting: 'Meetings, for you and any teammate you invite.',
};

export const MAX_OFFSET_MINUTES = 14 * 24 * 60;

/** 15 → "15 minutes before", 1440 → "1 day before", 10080 → "1 week before". */
export function offsetLabel(minutes: number): string {
  const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'} before`;
  if (minutes % 10080 === 0) return plural(minutes / 10080, 'week');
  if (minutes % 1440 === 0) return plural(minutes / 1440, 'day');
  if (minutes % 60 === 0) return plural(minutes / 60, 'hour');
  return plural(minutes, 'minute');
}

export type OffsetUnit = 'minutes' | 'hours' | 'days';
const UNIT_MINUTES: Record<OffsetUnit, number> = { minutes: 1, hours: 60, days: 1440 };

/** Value + unit → minutes, or null when it is not a whole number in 1 minute .. 14 days. */
export function toOffsetMinutes(value: number, unit: OffsetUnit): number | null {
  if (!Number.isInteger(value) || value < 1) return null;
  const minutes = value * UNIT_MINUTES[unit];
  return minutes > MAX_OFFSET_MINUTES ? null : minutes;
}

// ---- Google callback -------------------------------------------------------

const CALLBACK_ERRORS: Record<string, string> = {
  access_denied: 'You cancelled the Google connection.',
  invalid_state: 'That connection link expired or was started in another browser. Try Connect again.',
  exchange_failed: 'Google rejected the connection. Try again.',
  no_refresh_token:
    'Google did not grant offline access. Remove Cofoundaz from your Google account permissions and connect again.',
  not_a_member: 'You are no longer a member of this workspace.',
};

export function callbackErrorMessage(code: string): string {
  return CALLBACK_ERRORS[code] ?? 'Google connection failed. Try again.';
}

export const DIRECTION_LABEL = {
  two_way: 'Two-way sync (recommended)',
  pull_only: 'Pull external events only',
  push_only: 'Push Cofoundaz events only',
} as const;

/** "2 pulled, 3 pushed" style line for the last sync. */
export function syncSummaryLabel(s: { pulled?: number; pushed?: number; removed?: number } | null): string {
  if (!s) return '';
  const parts: string[] = [];
  if (s.pulled) parts.push(`${s.pulled} pulled`);
  if (s.pushed) parts.push(`${s.pushed} pushed`);
  if (s.removed) parts.push(`${s.removed} removed`);
  return parts.length ? parts.join(', ') : 'Nothing changed';
}

/** Founders and team members manage the whole Calendar; every other role only reads meetings it is invited to. */
export function canManageCalendar(role: string | null): boolean {
  // An unknown role (profile failed to load) is treated as core: the server is the gate.
  return role === null || role === 'founder' || role === 'team_member';
}

/** "Sunday, 1 November 2026". */
export function longDate(key: string): string {
  const d = parseDay(key);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** The URL if it is http(s), else null: video links come from users and are rendered as hrefs. */
export function httpUrl(u: string | null | undefined): string | null {
  if (!u) return null;
  try {
    const p = new URL(u);
    return p.protocol === 'http:' || p.protocol === 'https:' ? p.toString() : null;
  } catch {
    return null;
  }
}
