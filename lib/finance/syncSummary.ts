import type { SyncSummary } from '@/lib/api/finance';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Plain-English result of a sync, from the API's counters. Missing counters read as 0. */
export function describeSync(summary: Partial<SyncSummary>): string {
  const s = summary;
  const parts: string[] = [];
  const imported = (s.imported ?? 0) + (s.credits ?? 0) + (s.debits ?? 0);
  if (imported > 0) parts.push(`${plural(imported, 'transaction', 'transactions')} imported`);
  if ((s.fees ?? 0) > 0) parts.push(plural(s.fees!, 'fee', 'fees'));
  if ((s.refunds ?? 0) > 0) parts.push(plural(s.refunds!, 'refund', 'refunds'));
  if ((s.invoice_matched ?? 0) > 0) parts.push(`${plural(s.invoice_matched!, 'payment', 'payments')} matched to invoices`);
  if ((s.paystack_payouts ?? 0) > 0) parts.push(`${plural(s.paystack_payouts!, 'Paystack payout', 'Paystack payouts')} kept out of income`);
  const head = parts.length > 0 ? parts.join(', ') : 'Nothing new to import';
  const notes: string[] = [];
  if ((s.skipped_currency ?? 0) > 0) {
    notes.push(`${plural(s.skipped_currency!, 'non-NGN payment was', 'non-NGN payments were')} not imported (only NGN is supported)`);
  }
  if ((s.skipped_oversize ?? 0) > 0) {
    notes.push(`${plural(s.skipped_oversize!, 'payment was', 'payments were')} too large to import`);
  }
  if ((s.paystack_unmatched ?? 0) > 0) {
    notes.push(`${plural(s.paystack_unmatched!, 'bank credit mentions', 'bank credits mention')} Paystack but ${s.paystack_unmatched === 1 ? 'was' : 'were'} counted as income`);
  }
  return `${head}.${notes.length ? ` ${notes.join('. ')}.` : ''}`;
}
