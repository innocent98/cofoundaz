// Pure date helpers for the Marketing calendar (month grid, week grid, agenda, drag to reschedule).
// Everything works in the browser's local time, which is how the founder reads the calendar.

const pad = (n: number) => String(n).padStart(2, '0');

export type CalendarView = 'month' | 'week';

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function localDayKey(iso: string): string {
  return dayKey(new Date(iso));
}

/** The Sunday that starts the week containing `d`, at local midnight. */
export function weekStart(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
}

export function weekDays(anchor: Date): Date[] {
  const start = weekStart(anchor);
  return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

/** [from, to) of the visible range, as Dates. */
export function viewRange(view: CalendarView, anchor: Date): { from: Date; to: Date } {
  if (view === 'week') {
    const start = weekStart(anchor);
    return { from: start, to: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7) };
  }
  return {
    from: new Date(anchor.getFullYear(), anchor.getMonth(), 1),
    to: new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1),
  };
}

export function shiftAnchor(view: CalendarView, anchor: Date, dir: -1 | 1): Date {
  if (view === 'week') return new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + 7 * dir);
  return new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1);
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const monthName = (m: number) => MONTHS[m];

export function rangeLabel(view: CalendarView, anchor: Date): string {
  if (view === 'month') return `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`;
  const days = weekDays(anchor);
  const a = days[0];
  const b = days[6];
  const short = (d: Date) => `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
  return `${short(a)} to ${short(b)}, ${b.getFullYear()}`;
}

/**
 * Move a post to another day, keeping its time of day. A post with no time yet lands at 09:00,
 * the same default the "new post" form uses.
 */
export function moveToDay(iso: string | null, target: Date): string {
  const t = iso ? new Date(iso) : null;
  const h = t ? t.getHours() : 9;
  const m = t ? t.getMinutes() : 0;
  return new Date(target.getFullYear(), target.getMonth(), target.getDate(), h, m, 0, 0).toISOString();
}

/** `datetime-local` value for an ISO instant. */
export function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${dayKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Group entries by local day, each day's posts in time order. */
export function groupByDay<T extends { scheduled_at: string | null }>(entries: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const e of entries) {
    if (!e.scheduled_at) continue;
    const key = localDayKey(e.scheduled_at);
    map.set(key, [...(map.get(key) ?? []), e]);
  }
  for (const [k, list] of map) {
    map.set(k, [...list].sort((a, b) => (a.scheduled_at as string).localeCompare(b.scheduled_at as string)));
  }
  return map;
}

export function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}
