import type { RevenueProjection } from '@/lib/api/business-builder';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-11" to "Nov 26". */
export function monthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  const idx = Number(m) - 1;
  if (!y || !(idx >= 0 && idx < 12)) return ym;
  return `${MONTHS[idx]} ${y.slice(2)}`;
}

export type ChartRow = { month: string; label: string; total: number } & Record<string, string | number>;

/** One row per month with a column per stream id (values in major units), for the stacked chart. */
export function chartRows(p: RevenueProjection): ChartRow[] {
  return p.months.map((month, i) => {
    const row: ChartRow = { month, label: monthLabel(month), total: p.total[i] ?? 0 };
    for (const s of p.streams) row[s.id] = s.values[i] ?? 0;
    return row;
  });
}

/** ₦1.2M, ₦250k, ₦900. Major units in, compact text out. */
export function formatNaira(n: number): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  const trim = (v: number) => String(Math.round(v * 10) / 10);
  if (abs >= 1_000_000_000) return `${sign}₦${trim(abs / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `${sign}₦${trim(abs / 1_000_000)}M`;
  if (abs >= 1_000) return `${sign}₦${trim(abs / 1_000)}k`;
  return `${sign}₦${Math.round(abs)}`;
}

/** The growth input as the API takes it (-50 to 100), or null while it is blank or out of range. */
export function parseGrowth(input: string): number | null {
  const t = input.trim();
  if (t === '' || t === '-') return null;
  const n = Number(t);
  if (!Number.isFinite(n) || n < -50 || n > 100) return null;
  return n;
}

export const PROJECTION_MONTHS = [6, 12, 24] as const;
