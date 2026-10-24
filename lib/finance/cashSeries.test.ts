import { describe, expect, it } from 'vitest';
import { cashSeries } from './cashSeries';

describe('cashSeries', () => {
  it('ends at cash on hand and walks back through each net', () => {
    const s = cashSeries({
      cash_on_hand: 1000,
      by_month: [
        { month: '2026-08', inflow: 0, outflow: 0, net: 0 },
        { month: '2026-09', inflow: 500, outflow: 200, net: 300 },
        { month: '2026-10', inflow: 100, outflow: 400, net: -300 },
      ],
    });
    expect(s[2].cash).toBe(1000);
    expect(s[1].cash).toBe(1300);
    expect(s[0].cash).toBe(1000);
  });
});
