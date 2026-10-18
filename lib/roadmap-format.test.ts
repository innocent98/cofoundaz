import { describe, expect, it } from 'vitest';
import { buildScale, dayNumber, formatDue, relativeStamp, todayDayNumber } from './roadmap-format';

describe('roadmap format helpers', () => {
  it('formats due dates and tolerates empty input', () => {
    expect(formatDue('2026-10-18')).toBe('Oct 18, 2026');
    expect(formatDue('')).toBe('No date');
    expect(formatDue(null)).toBe('No date');
    expect(formatDue('garbage')).toBe('No date');
  });

  it('writes relative stamps', () => {
    const now = Date.parse('2026-10-18T12:00:00Z');
    expect(relativeStamp('2026-10-18T11:59:30Z', now)).toBe('just now');
    expect(relativeStamp('2026-10-18T11:30:00Z', now)).toBe('30m ago');
    expect(relativeStamp('2026-10-18T09:00:00Z', now)).toBe('3h ago');
    expect(relativeStamp('2026-10-15T12:00:00Z', now)).toBe('3d ago');
    expect(relativeStamp('2026-09-01T12:00:00Z', now)).toBe('Sep 1, 2026');
  });

  it('day numbers are consecutive across a month boundary', () => {
    expect(dayNumber('2026-11-01')! - dayNumber('2026-10-31')!).toBe(1);
    expect(dayNumber('nope')).toBeNull();
    expect(todayDayNumber(Date.parse('2026-10-18T12:00:00'))).toBe(dayNumber('2026-10-18'));
  });

  it('scales denser at Week than Quarter and always includes today', () => {
    const today = dayNumber('2026-10-18')!;
    const days = [dayNumber('2026-09-01')!, dayNumber('2027-01-15')!];
    const week = buildScale(days, 'Week', today);
    const quarter = buildScale(days, 'Quarter', today);
    expect(week.width).toBeGreaterThan(quarter.width);
    expect(week.x(today)).toBeGreaterThan(0);
    expect(quarter.ticks.every((t) => /^(Jan|Apr|Jul|Oct) \d{4}$/.test(t.label))).toBe(true);
    const month = buildScale(days, 'Month', today);
    expect(month.ticks.map((t) => t.label)).toEqual(expect.arrayContaining(['Sep 2026', 'Oct 2026', 'Nov 2026']));
  });
});
