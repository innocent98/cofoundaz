import { describe, expect, it } from 'vitest';
import type { Transaction } from '@/lib/api/finance';
import { fundingCandidate } from './funding';

const tx = (over: Partial<Transaction>): Transaction => ({
  id: 't1',
  date: '2026-10-24',
  description: 'Wire',
  category: null,
  amount_minor: 900_000_050,
  currency: 'NGN',
  direction: 'in',
  source: 'manual',
  created_at: '',
  updated_at: '',
  ...over,
});

describe('fundingCandidate', () => {
  it('flags a large uncategorised inflow even though it lifts its own trailing revenue', () => {
    // Revenue 153,583,333 + a third of the row: the row must not raise its own bar.
    const rev = 153_583_333 + 300_000_017;
    expect(fundingCandidate([tx({})], rev)?.id).toBe('t1');
  });
  it('ignores small, categorised, outflow and dismissed rows', () => {
    expect(fundingCandidate([tx({ amount_minor: 5_000_000 })], 0)).toBeNull();
    expect(fundingCandidate([tx({ category: 'Revenue' })], 0)).toBeNull();
    expect(fundingCandidate([tx({ direction: 'out' })], 0)).toBeNull();
    expect(fundingCandidate([tx({})], 0, ['t1'])).toBeNull();
  });
  it('ignores an inflow that is only a normal month of sales', () => {
    expect(fundingCandidate([tx({ amount_minor: 20_000_000 })], 20_000_000)).toBeNull();
  });
});
