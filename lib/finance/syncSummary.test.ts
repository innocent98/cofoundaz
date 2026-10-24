import { describe, expect, it } from 'vitest';
import { describeSync } from './syncSummary';

describe('describeSync', () => {
  it('says nothing new when every counter is zero', () => {
    expect(describeSync({ imported: 0, duplicates: 2, fetched: 2 })).toBe('Nothing new to import.');
  });

  it('counts payments, fees and bank lines together', () => {
    expect(describeSync({ imported: 1, fees: 1, credits: 2, debits: 1 })).toBe('4 transactions imported, 1 fee.');
  });

  it('surfaces skipped currency and oversize rows', () => {
    const text = describeSync({ imported: 1, skipped_currency: 2, skipped_oversize: 1 });
    expect(text).toContain('2 non-NGN payments were not imported (only NGN is supported)');
    expect(text).toContain('1 payment was too large to import');
  });

  it('reports payouts kept out of income and unmatched Paystack credits', () => {
    const text = describeSync({ credits: 2, paystack_payouts: 1, paystack_unmatched: 1 });
    expect(text).toContain('1 Paystack payout kept out of income');
    expect(text).toContain('1 bank credit mentions Paystack but was counted as income');
  });
});
