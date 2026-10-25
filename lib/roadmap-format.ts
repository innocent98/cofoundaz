// Small display helpers for the Roadmap pages. No dashes in rendered copy.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-10-18" -> "Oct 18, 2026"; empty or unparsable input -> "No date". */
export function formatDue(iso: string | null | undefined): string {
  if (!iso) return 'No date';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return 'No date';
  const month = MONTHS[Number(m[2]) - 1];
  if (!month) return 'No date';
  return `${month} ${Number(m[3])}, ${m[1]}`;
}

/** "5m ago" style stamp for comments. */
export function relativeStamp(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Math.max(0, Math.floor((now - then) / 1000));
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return formatDue(iso.slice(0, 10));
}

/** Days from an ISO date to a day-count origin, used to lay milestones on the timeline. */
export function dayNumber(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  return Math.floor(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / 86_400_000);
}

export function todayDayNumber(now: number = Date.now()): number {
  const d = new Date(now);
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
}

export type Zoom = 'Week' | 'Month' | 'Quarter';
export const ZOOM_PX_PER_DAY: Record<Zoom, number> = { Week: 28, Month: 9, Quarter: 3 };

export interface TimelineScale {
  startDay: number;
  endDay: number;
  pxPerDay: number;
  x: (day: number) => number;
  width: number;
  ticks: { day: number; label: string }[];
}

/** Lay a set of day numbers on an axis at the zoom's density, padded either side. */
export function buildScale(days: number[], zoom: Zoom, today: number): TimelineScale {
  const all = [...days, today];
  const startDay = Math.min(...all) - 7;
  const endDay = Math.max(...all) + 21;
  const pxPerDay = ZOOM_PX_PER_DAY[zoom];
  const x = (day: number) => (day - startDay) * pxPerDay;

  const ticks: { day: number; label: string }[] = [];
  if (zoom === 'Week') {
    for (let d = startDay; d <= endDay; d += 7) ticks.push({ day: d, label: shortDay(d) });
  } else {
    const first = new Date(startDay * 86_400_000);
    let y = first.getUTCFullYear();
    let m = first.getUTCMonth();
    const step = zoom === 'Quarter' ? 3 : 1;
    if (zoom === 'Quarter') m = Math.floor(m / 3) * 3;
    for (;;) {
      if (m > 11) {
        y += Math.floor(m / 12);
        m %= 12;
      }
      const day = Math.floor(Date.UTC(y, m, 1) / 86_400_000);
      if (day > endDay) break;
      if (day >= startDay) ticks.push({ day, label: `${MONTHS[m]} ${y}` });
      m += step;
    }
  }
  return { startDay, endDay, pxPerDay, x, width: Math.max(800, x(endDay)), ticks };
}

function shortDay(day: number): string {
  const d = new Date(day * 86_400_000);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}
