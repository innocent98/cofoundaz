// Display helpers for the Finance Hub. The API speaks integer minor units (kobo);
// everything the user reads or types is major units (naira). Never send a float.

/** Format minor units as a currency string, e.g. 12050000 NGN -> "₦120,500". */
export function formatMoney(minor: number, currency = 'NGN'): string {
  const major = minor / 100;
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    // `currency` is only length-checked server side, so it may not be ISO 4217.
    return `${currency} ${major.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
  }
}

/** Plain grouped number in major units, for dense statement tables. */
export function formatMajor(minor: number): string {
  return Math.round(minor / 100).toLocaleString('en-NG');
}

/**
 * Parse a user-typed major-unit amount ("1,250.50") to integer minor units.
 * Returns null for anything that is not a non-negative number with at most two
 * decimals, so callers can block submit instead of sending a float.
 */
export function toMinor(input: string): number | null {
  const cleaned = input.trim().replace(/,/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, frac = ''] = cleaned.split('.');
  const minor = Number(whole) * 100 + Number((frac + '00').slice(0, 2));
  return Number.isSafeInteger(minor) ? minor : null;
}

/** Minor units -> editable major-unit string ("1250.5"), no grouping. */
export function minorToInput(minor: number): string {
  const whole = Math.trunc(minor / 100);
  const frac = Math.abs(minor % 100);
  return frac === 0 ? String(whole) : `${whole}.${String(frac).padStart(2, '0').replace(/0$/, '')}`;
}

/** Runway-screen assumptions use NGN thousands: 1 unit = 100,000 kobo. */
export const KOBO_PER_THOUSAND = 100_000;

export function thousandsToMinor(thousands: number): number {
  return Math.round(thousands * KOBO_PER_THOUSAND);
}

export function minorToThousands(minor: number): number {
  return minor / KOBO_PER_THOUSAND;
}

/** Current month as YYYY-MM in UTC, matching how the API buckets months. */
export function currentMonth(now: Date = new Date()): string {
  return now.toISOString().slice(0, 7);
}

/** Today as YYYY-MM-DD in UTC, matching the API's "today". */
export function todayIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Shift a YYYY-MM by `delta` months. */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const idx = y * 12 + (m - 1) + delta;
  const ny = Math.floor(idx / 12);
  const nm = (idx % 12) + 1;
  return `${ny}-${String(nm).padStart(2, '0')}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-09" -> "Sep 2026" (locale-independent so SSR and client agree). */
export function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  if (!y || !m || m < 1 || m > 12) return month;
  return `${MONTHS[m - 1]} ${y}`;
}

/** "2026-09" -> "Sep" for compact chart axes. */
export function shortMonth(month: string): string {
  const m = Number(month.split('-')[1]);
  return MONTHS[m - 1] ?? month;
}

/** "2026-09-30" -> "30 Sep 2026". */
export function formatDate(iso: string | null): string {
  if (!iso) return 'Not set';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/**
 * Server-built text (e.g. an invoice-managed transaction's description) contains
 * em dashes; in-app copy uses plain hyphens.
 */
export function plainText(s: string): string {
  return s.replace(/\s*[\u2013\u2014]\s*/g, ' - ');
}

export function clampPercent(p: number | null): number {
  if (p === null || Number.isNaN(p)) return 0;
  return Math.max(0, Math.min(100, p));
}
