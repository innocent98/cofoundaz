import type { CashFlow } from '@/lib/api/finance';

export interface CashPoint {
  month: string;
  inflow: number;
  outflow: number;
  net: number;
  /** Cash balance at the end of the month (kobo). */
  cash: number;
}

/**
 * The API's `by_month` has no running balance, but `cash_on_hand` is the balance
 * after the newest month (both count only rows dated today or earlier), so walking
 * backwards subtracts each month's net. The last point therefore equals cash on hand.
 */
export function cashSeries(cf: Pick<CashFlow, 'cash_on_hand' | 'by_month'>): CashPoint[] {
  const out: CashPoint[] = new Array(cf.by_month.length);
  let cash = cf.cash_on_hand;
  for (let i = cf.by_month.length - 1; i >= 0; i--) {
    const m = cf.by_month[i];
    out[i] = { month: m.month, inflow: m.inflow, outflow: m.outflow, net: m.net, cash };
    cash -= m.net;
  }
  return out;
}
