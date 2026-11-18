// Display rules for Analytics & Reports. The API sends raw numbers plus a unit and a status;
// everything a person reads is decided here so the Overview, the builder, saved runs and the
// exports page all say the same thing. Money is integer minor units (kobo) in JSON.

import type {
  Block,
  CompareKey,
  ExportRow,
  MetricResult,
  MetricUnit,
  RangeKey,
  RangeSpec,
  RunResult,
} from '@/lib/api/analytics';
import { formatMoney } from '@/lib/finance/format';

export const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '90d', label: '90 days' },
  { key: '12m', label: '12 months' },
  { key: 'this_month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
  { key: 'custom', label: 'Custom' },
];

export const COMPARE_OPTIONS: { key: CompareKey; label: string }[] = [
  { key: 'previous', label: 'Previous period' },
  { key: 'year', label: 'Same period last year' },
  { key: 'none', label: 'No comparison' },
];

export const DEFAULT_RANGE: RangeSpec = { range: '30d', from: null, to: null, compare: 'previous' };

export function rangeLabel(key: RangeKey): string {
  return RANGE_OPTIONS.find((o) => o.key === key)?.label ?? key;
}

/** A number in its unit. `null`/`undefined` is never shown as 0: callers render the status instead. */
export function formatValue(value: number | null | undefined, unit: MetricUnit | undefined, currency?: string | null): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  switch (unit) {
    case 'money':
      return formatMoney(Math.round(value), currency || 'NGN');
    case 'percent':
      return `${round1(value)}%`;
    case 'months':
      return `${round1(value)} ${Math.abs(value) === 1 ? 'month' : 'months'}`;
    case 'days':
      return `${round1(value)} ${Math.abs(value) === 1 ? 'day' : 'days'}`;
    case 'score':
      return `${round1(value)}`;
    default:
      return Math.round(value).toLocaleString('en-NG');
  }
}

function round1(n: number): string {
  return (Math.round(n * 10) / 10).toLocaleString('en-NG', { maximumFractionDigits: 1 });
}

export type Tone = 'good' | 'bad' | 'neutral';

export interface DeltaView {
  text: string;
  tone: Tone;
  /** Screen-reader sentence, e.g. "up 18% on the previous period". */
  spoken: string;
}

/**
 * The change against the comparison period. `delta_pct` is null when the comparison value was 0,
 * so the absolute delta is shown instead (guide §4). `good` decides the colour: burn going down is good.
 */
export function deltaView(m: MetricResult): DeltaView | null {
  const c = m.compare;
  if (!c || c.delta === null || c.delta === undefined) return null;
  const dir = c.delta > 0 ? 'up' : c.delta < 0 ? 'down' : 'flat';
  const tone: Tone = dir === 'flat' ? 'neutral' : (dir === m.good ? 'good' : 'bad');
  if (dir === "flat") return { text: 'No change', tone, spoken: 'no change on the comparison period' };
  const sign = c.delta > 0 ? '+' : c.delta < 0 ? '−' : '';
  const text =
    c.delta_pct !== null && c.delta_pct !== undefined
      ? `${sign}${round1(Math.abs(c.delta_pct))}%`
      : `${sign}${formatValue(Math.abs(c.delta), m.unit, m.currency)}`;
  const spoken = `${dir} ${text.replace(/^[+−]/, '')} on the comparison period`;
  return { text, tone, spoken };
}

export type MetricState =
  | { kind: 'value'; text: string }
  | { kind: 'no_data' }
  | { kind: 'not_burning' }
  | { kind: 'out_of_cash'; text: string }
  | { kind: 'locked'; needsLabel: string }
  | { kind: 'unknown'; message: string }
  | { kind: 'error' };

/** How to render one metric. A locked or unknown metric never reads `value`. */
export function metricState(m: MetricResult): MetricState {
  switch (m.status) {
    case 'ok':
      return { kind: 'value', text: formatValue(m.value, m.unit, m.currency) };
    case 'no_data':
      return { kind: 'no_data' };
    case 'not_burning':
      return { kind: 'not_burning' };
    case 'out_of_cash':
      return { kind: 'out_of_cash', text: formatValue(m.value ?? 0, m.unit, m.currency) };
    case 'locked':
      return { kind: 'locked', needsLabel: m.needs_label || hubLabel(m.needs || m.hub || '') };
    case 'unknown':
      return { kind: 'unknown', message: m.message || 'Metric no longer available.' };
    default:
      return { kind: 'error' };
  }
}

const HUB_LABELS: Record<string, string> = {
  finance: 'Finance',
  sales: 'Sales',
  marketing: 'Marketing',
  validation: 'Validation',
  health: 'Health',
  execution: 'Mission and Roadmap',
  funding: 'Funding',
  readiness: 'Readiness',
  custom: 'Entered by you',
};

export function hubLabel(hub: string): string {
  return HUB_LABELS[hub] ?? (hub ? hub.charAt(0).toUpperCase() + hub.slice(1) : 'This hub');
}

/** "Finance access needed": the only text a locked block may carry. */
export function lockedText(needsLabel: string): string {
  return `${needsLabel} access needed`;
}

/** "as of 14:05" today, else "as of 12 Nov, 14:05". */
export function asOfLabel(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay ? `as of ${time}` : `as of ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${time}`;
}

/** "15 Oct – 13 Nov 2026" from ISO days. */
export function periodLabel(p: { from: string; to: string } | null | undefined): string {
  if (!p) return '';
  const f = new Date(`${p.from}T00:00:00Z`);
  const t = new Date(`${p.to}T00:00:00Z`);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', timeZone: 'UTC' };
  const sameYear = f.getUTCFullYear() === t.getUTCFullYear();
  const left = f.toLocaleDateString('en-GB', sameYear ? opts : { ...opts, year: 'numeric' });
  const right = t.toLocaleDateString('en-GB', { ...opts, year: 'numeric' });
  return `${left} – ${right}`;
}

export function dateTimeLabel(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function fileSize(bytes: number | null | undefined): string {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Exports: what the row says and does, from `status` (computed server-side on read). */
export function exportStatusView(row: Pick<ExportRow, 'status' | 'error' | 'expires_at'>): { label: string; tone: Tone | 'busy'; detail: string } {
  switch (row.status) {
    case 'pending':
      return { label: 'Generating', tone: 'busy', detail: 'Generating…' };
    case 'ready':
      return { label: 'Ready', tone: 'good', detail: `Expires ${dateTimeLabel(row.expires_at)}` };
    case 'failed':
      return { label: 'Failed', tone: 'bad', detail: row.error || 'This export failed. Generate it again.' };
    default:
      return { label: 'Expired', tone: 'neutral', detail: 'Expired. Generate it again.' };
  }
}

/** Short random id in the API's allowed alphabet (letters, digits, dash, underscore). */
export function newBlockId(): string {
  const bytes = new Uint8Array(4);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Move the item at `from` by `delta` places (keyboard reordering); out-of-range moves are no-ops. */
export function moveItem<T>(list: T[], from: number, delta: number): T[] {
  const to = from + delta;
  if (from < 0 || from >= list.length || to < 0 || to >= list.length) return list;
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Drag-and-drop: put the item at `from` where `to` was. */
export function reorderTo<T>(list: T[], from: number, to: number): T[] {
  return moveItem(list, from, to - from);
}

/** The id a run/preview result belongs to. Locked results carry `id`, the others `block_id`. */
export function resultBlockId(r: RunResult): string {
  return 'locked' in r && r.locked ? r.id : (r as { block_id: string }).block_id;
}

/** Hubs a report's blocks are locked behind for the current viewer (for the accountant's export warning). */
export function lockedHubLabels(blocks: Block[]): string[] {
  const out: string[] = [];
  for (const b of blocks) {
    if (b.locked && !out.includes(b.needs_label)) out.push(b.needs_label);
  }
  return out;
}

export const MAX_BLOCKS = 30;

export const ROLE_LABEL: Record<string, string> = {
  team_member: 'Team member',
  accountant: 'Accountant',
  mentor: 'Mentor',
  business_consultant: 'Business consultant',
  founder: 'Founder',
};

/**
 * Hub pages that stay hidden from navigation until Adebayo unhides them (2026-11-12): Analytics shows
 * their numbers but never links into them.
 */
const HIDDEN_HUB_PATHS = ['/funding', '/investor-readiness', '/marketplace'];

/** Where a figure's "Open …" link may go: an in-app hub path that is not hidden, else null. */
export function linkableHubPath(path: string | null | undefined): string | null {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return null;
  if (HIDDEN_HUB_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) return null;
  // Custom metrics point back at Analytics itself; the card offers "Edit values" instead.
  if (path === '/analytics-reports') return null;
  return path;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * In-app target of an Analytics notification (guides B §4, C §5): a shared or generated report opens the
 * report, a ready export opens Export history with that row highlighted. Ids are checked to be UUIDs
 * so a notification can never build an arbitrary path.
 */
export function analyticsNotificationHref(type: string, data: Record<string, unknown> | null | undefined): string {
  const reportId = typeof data?.report_id === 'string' && UUID_RE.test(data.report_id) ? data.report_id : null;
  const exportId = typeof data?.export_id === 'string' && UUID_RE.test(data.export_id) ? data.export_id : null;
  if (type === 'analytics.export.created') return exportId ? `/analytics-reports/exports?highlight=${exportId}` : '/analytics-reports/exports';
  if ((type === 'analytics.report.shared' || type === 'analytics.report.generated') && reportId) return `/analytics-reports/saved/${reportId}`;
  return '/analytics-reports/saved';
}

/** Builder: shown when a draft holds blocks the editor's role can't open. Saving would drop them, so it is refused. */
export const LOCKED_SAVE_MESSAGE =
  "This report has blocks your role can't open, so it can't be saved from here without losing them. Ask the founder to change it.";
