const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function plural(n: number, unit: string): string {
  return `${n} ${unit}${n === 1 ? '' : 's'} ago`;
}

/**
 * "just now", "5 minutes ago", "2 hours ago", "yesterday", "3 days ago", then a
 * plain date ("12 Oct", with the year once it is not this year). Returns '' for
 * a missing or unparseable timestamp so callers can skip the line.
 */
export function relativeTime(iso: string | null | undefined, now: number = Date.now()): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const diff = Math.max(0, Math.floor((now - then) / 1000));
  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) return plural(Math.floor(diff / MINUTE), 'minute');
  if (diff < DAY) return plural(Math.floor(diff / HOUR), 'hour');
  if (diff < 2 * DAY) return 'yesterday';
  if (diff < 7 * DAY) return plural(Math.floor(diff / DAY), 'day');
  const d = new Date(then);
  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${sameYear ? '' : ` ${d.getFullYear()}`}`;
}

/** "Last edited by Ada, 5 minutes ago"; "Last edited by AI" when the editor is null (an AI fill). Empty if never edited. */
export function lastEditedLabel(
  updatedAt: string | null | undefined,
  by: { name: string | null } | null | undefined,
  now: number = Date.now()
): string {
  const when = relativeTime(updatedAt, now);
  if (!when) return '';
  const who = by ? by.name?.trim() || 'a teammate' : 'AI';
  return `Last edited by ${who}, ${when}`;
}
