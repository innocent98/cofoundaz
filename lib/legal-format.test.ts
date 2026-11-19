import { describe, expect, it } from 'vitest';
import {
  daysBetween,
  dueLabel,
  formatDate,
  formatMoney,
  monthGrid,
  overdueBanner,
  renewalLabel,
  shiftMonth,
  stepMeta,
} from './legal-format';

describe('legal-format', () => {
  it('formats money from minor units and never shows a null cost', () => {
    expect(formatMoney(50000, 'NGN')).toBe('₦500');
    expect(formatMoney(2000000, 'NGN')).toBe('₦20,000');
    expect(stepMeta({ authority: 'CAC', est_days: 1, est_cost_minor: 50000, est_cost_currency: 'NGN' })).toBe('CAC · est. 1 day · est. ₦500');
    expect(stepMeta({ authority: 'FIRS', est_days: 5, est_cost_minor: null, est_cost_currency: null })).toBe('FIRS · est. 5 days');
  });

  it('formats ISO dates without a timezone shift', () => {
    expect(formatDate('2026-11-16')).toBe('16 Nov 2026');
    expect(daysBetween('2026-11-13', '2026-11-16')).toBe(3);
  });

  it('words due and renewal states', () => {
    expect(dueLabel('2026-11-13', '2026-11-13')).toBe('Due today');
    expect(dueLabel('2026-11-16', '2026-11-13')).toBe('Due in 3 days');
    expect(dueLabel('2026-11-12', '2026-11-13')).toBe('Overdue by 1 day');
    expect(renewalLabel('2026-11-23', 'registered')).toBe('Renews 23 Nov 2026');
    expect(renewalLabel('2026-10-14', 'expired')).toBe('Expired 14 Oct 2026');
    expect(renewalLabel(null, 'drafting')).toBe('No renewal date');
  });

  it('pluralises the overdue banner', () => {
    expect(overdueBanner(1)).toBe('1 filing overdue. These carry penalties, handle it first.');
    expect(overdueBanner(2)).toBe('2 filings overdue. These carry penalties, handle them first.');
  });

  it('builds a Monday-first month grid', () => {
    const weeks = monthGrid(2026, 11);
    expect(weeks[0][0].iso).toBe('2026-10-26');
    expect(weeks[0][6].iso).toBe('2026-11-01');
    expect(weeks.flat().filter((c) => c.inMonth)).toHaveLength(30);
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
  });
});
