import type { ComplianceDerivedStatus, ComplianceItem, IpDerivedStatus, IpType, Recurrence } from '@/lib/api/legal';

// Display helpers for Legal. "Today" is the UTC date, the same clock the API and its
// reminders use, so a filing the API calls due_soon never reads as overdue here.

export function todayIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function parseIso(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return { y, m, d };
}

/** Whole days from `fromIso` to `toIso` (negative when `toIso` is earlier). */
export function daysBetween(fromIso: string, toIso: string): number {
  const a = parseIso(fromIso);
  const b = parseIso(toIso);
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86_400_000);
}

/** "16 Nov 2026" from an ISO date, with no timezone shift. */
export function formatDate(iso: string): string {
  const { y, m, d } = parseIso(iso);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** "13 Nov 2026" from an ISO timestamp, in the viewer's timezone. */
export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function plural(n: number, one: string): string {
  return `${n} ${one}${n === 1 ? '' : 's'}`;
}

/** "Due today", "Due in 3 days", "Overdue by 5 days". */
export function dueLabel(dueOn: string, today: string = todayIso()): string {
  const n = daysBetween(today, dueOn);
  if (n === 0) return 'Due today';
  if (n > 0) return `Due in ${plural(n, 'day')}`;
  return `Overdue by ${plural(-n, 'day')}`;
}

/** "Renews 23 Nov 2026", or "Expired 14 Oct 2026" once it has passed. */
export function renewalLabel(renewalOn: string | null, derived: IpDerivedStatus): string {
  if (!renewalOn) return 'No renewal date';
  return derived === 'expired' ? `Expired ${formatDate(renewalOn)}` : `Renews ${formatDate(renewalOn)}`;
}

/** Whole-unit amounts show no decimals ("₦500"); fractional ones show two. */
export function formatMoney(minor: number, currency: string): string {
  const major = minor / 100;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: Number.isInteger(major) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(major);
}

/** "CAC · est. 1 day · ₦500". Null cost means unknown: nothing is shown, never "free". */
export function stepMeta(step: {
  authority: string | null;
  est_days: number | null;
  est_cost_minor: number | null;
  est_cost_currency: string | null;
}): string {
  const parts: string[] = [];
  if (step.authority) parts.push(step.authority);
  if (step.est_days !== null) parts.push(`est. ${plural(step.est_days, 'day')}`);
  if (step.est_cost_minor !== null && step.est_cost_currency) {
    parts.push(`est. ${formatMoney(step.est_cost_minor, step.est_cost_currency)}`);
  }
  return parts.join(' · ');
}

export const COMPLIANCE_STATUS_LABEL: Record<ComplianceDerivedStatus, string> = {
  overdue: 'Overdue',
  due_soon: 'Due soon',
  upcoming: 'Upcoming',
  done: 'Done',
};

export const COMPLIANCE_STATUS_CLASS: Record<ComplianceDerivedStatus, string> = {
  overdue: 'bg-danger-50 text-danger-700 border-danger-200',
  due_soon: 'bg-warning-50 text-warning-800 border-warning-100',
  upcoming: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  done: 'bg-brand-50 text-brand-700 border-brand-200',
};

export const IP_STATUS_LABEL: Record<IpDerivedStatus, string> = {
  drafting: 'Drafting',
  filed: 'Filed',
  registered: 'Registered',
  expired: 'Expired',
};

export const IP_STATUS_CLASS: Record<IpDerivedStatus, string> = {
  drafting: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  filed: 'bg-warning-50 text-warning-800 border-warning-100',
  registered: 'bg-brand-50 text-brand-700 border-brand-200',
  expired: 'bg-danger-50 text-danger-700 border-danger-200',
};

export const IP_TYPE_LABEL: Record<IpType, string> = {
  trademark: 'Trademark',
  patent: 'Patent',
  copyright: 'Copyright',
  domain: 'Domain',
};

export const RECURRENCE_LABEL: Record<Recurrence, string> = {
  none: 'Does not repeat',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annually: 'Annually',
};

/** "1 filing overdue. These carry penalties, handle it first." (PRD copy, plural aware). */
export function overdueBanner(n: number): string {
  return n === 1
    ? '1 filing overdue. These carry penalties, handle it first.'
    : `${n} filings overdue. These carry penalties, handle them first.`;
}

export function countOverdue(items: ComplianceItem[]): number {
  return items.filter((i) => i.derived_status === 'overdue').length;
}

// ---------------------------------------------------------------- calendar grid

export interface CalendarCell {
  iso: string;
  inMonth: boolean;
}

/** Weeks (Monday first) covering `month` (1-12) of `year`. */
export function monthGrid(year: number, month: number): CalendarCell[][] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const start = Date.UTC(year, month - 1, 1 - offset);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const weeks = Math.ceil((offset + daysInMonth) / 7);
  const out: CalendarCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    const row: CalendarCell[] = [];
    for (let d = 0; d < 7; d++) {
      const dt = new Date(start + (w * 7 + d) * 86_400_000);
      row.push({ iso: dt.toISOString().slice(0, 10), inMonth: dt.getUTCMonth() === month - 1 });
    }
    out.push(row);
  }
  return out;
}

export function monthTitle(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const idx = year * 12 + (month - 1) + delta;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

/** Notification deep links (the API payloads carry no href): the row is highlighted on arrival. */
export function legalNotificationHref(type: string, data: Record<string, unknown> | null | undefined): string | null {
  if (type.startsWith('legal.compliance.')) {
    return typeof data?.item_id === 'string' ? `/legal/compliance?item=${encodeURIComponent(data.item_id)}` : '/legal/compliance';
  }
  if (type === 'legal.ip.renewal_due_soon') {
    return typeof data?.asset_id === 'string' ? `/legal/ip?asset=${encodeURIComponent(data.asset_id)}` : '/legal/ip';
  }
  return null;
}
