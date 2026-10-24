import type { Transaction } from '@/lib/api/finance';

/** Floor for the Funding nudge: NGN 100,000 in kobo. */
export const FUNDING_NUDGE_MIN_MINOR = 10_000_000;

/**
 * The first uncategorised inflow that looks like a raise rather than sales: it must clear the
 * fixed floor and be at least twice a normal month. The trailing-3-month revenue already holds
 * a third of this row, so that share is taken out before comparing; otherwise a big raise
 * would raise its own bar and hide itself. Callers pass only rows whose category is editable.
 */
export function fundingCandidate(items: Transaction[], monthlyRevenue: number, dismissed: string[] = []): Transaction | null {
  return (
    items.find(
      (tx) =>
        tx.direction === 'in' &&
        !tx.category &&
        !dismissed.includes(tx.id) &&
        tx.amount_minor >= Math.max(FUNDING_NUDGE_MIN_MINOR, 2 * Math.max(0, monthlyRevenue - tx.amount_minor / 3)),
    ) ?? null
  );
}
