import { describe, expect, it } from 'vitest';
import { chartRows, formatNaira, monthLabel, parseGrowth } from './bb-revenue';

describe('bb-revenue', () => {
  it('labels months', () => {
    expect(monthLabel('2026-11')).toBe('Nov 26');
    expect(monthLabel('bad')).toBe('bad');
  });

  it('builds one row per month with a column per stream and the total', () => {
    const rows = chartRows({
      growth_pct: 5,
      months: ['2026-11', '2026-12'],
      streams: [
        { id: 'a', name: 'Subs', values: [100, 105] },
        { id: 'b', name: 'Fees', values: [50, 52.5] },
      ],
      total: [150, 157.5],
    });
    expect(rows).toEqual([
      { month: '2026-11', label: 'Nov 26', total: 150, a: 100, b: 50 },
      { month: '2026-12', label: 'Dec 26', total: 157.5, a: 105, b: 52.5 },
    ]);
  });

  it('formats naira compactly in major units', () => {
    expect(formatNaira(900)).toBe('₦900');
    expect(formatNaira(250000)).toBe('₦250k');
    expect(formatNaira(1_250_000)).toBe('₦1.3M');
    expect(formatNaira(0)).toBe('₦0');
  });

  it('accepts growth only inside the API range', () => {
    expect(parseGrowth('5')).toBe(5);
    expect(parseGrowth('-50')).toBe(-50);
    expect(parseGrowth('100')).toBe(100);
    expect(parseGrowth('101')).toBeNull();
    expect(parseGrowth('')).toBeNull();
    expect(parseGrowth('abc')).toBeNull();
  });
});
