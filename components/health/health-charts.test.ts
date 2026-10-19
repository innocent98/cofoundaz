import { describe, expect, it } from 'vitest';
import { timeAxisProps } from './health-charts';

const at = (iso: string) => new Date(iso).getTime();

describe('timeAxisProps', () => {
  it('never repeats a date label when several recomputes land on one day', () => {
    const times = [at('2026-10-19T09:00:00'), at('2026-10-19T12:30:00'), at('2026-10-19T17:45:00')];
    const { tickFormatter } = timeAxisProps(times);
    const labels = times.map((t) => tickFormatter(t));
    expect(new Set(labels).size).toBe(3);
    expect(labels.every((l) => !l.includes('Oct'))).toBe(true);
  });

  it('uses one tick per calendar day over longer spans', () => {
    const times = [at('2026-10-15T08:00:00'), at('2026-10-15T20:00:00'), at('2026-10-19T10:00:00')];
    const { ticks, tickFormatter } = timeAxisProps(times);
    const labels = (ticks ?? []).map((t) => tickFormatter(t));
    expect(labels).toEqual(['Oct 15', 'Oct 16', 'Oct 17', 'Oct 18', 'Oct 19']);
  });

  it('a span just under two days crossing midnight still has distinct labels', () => {
    const times = [at('2026-10-17T17:20:00'), at('2026-10-19T16:00:00'), at('2026-10-19T16:10:00')];
    const { ticks, tickFormatter } = timeAxisProps(times);
    const labels = (ticks ?? []).map((t) => tickFormatter(t));
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels).toEqual(['Oct 17', 'Oct 18', 'Oct 19']);
  });

  it('a single reading gets one tick', () => {
    const t = at('2026-10-19T10:00:00');
    expect(timeAxisProps([t]).ticks).toEqual([t]);
  });
});
