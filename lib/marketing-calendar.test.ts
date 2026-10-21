import { describe, expect, it } from 'vitest';
import { dayKey, groupByDay, moveToDay, rangeLabel, shiftAnchor, toLocalInput, viewRange, weekDays, weekStart } from './marketing-calendar';

describe('marketing calendar helpers', () => {
  it('starts the week on Sunday and lists seven days', () => {
    const wed = new Date(2026, 9, 21); // Wed 21 Oct 2026
    expect(dayKey(weekStart(wed))).toBe('2026-10-18');
    expect(weekDays(wed).map(dayKey)).toEqual([
      '2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24',
    ]);
  });

  it('gives a month range and a week range', () => {
    const m = viewRange('month', new Date(2026, 9, 21));
    expect([dayKey(m.from), dayKey(m.to)]).toEqual(['2026-10-01', '2026-11-01']);
    const w = viewRange('week', new Date(2026, 9, 21));
    expect([dayKey(w.from), dayKey(w.to)]).toEqual(['2026-10-18', '2026-10-25']);
  });

  it('steps by a month or a week and labels the range', () => {
    expect(dayKey(shiftAnchor('month', new Date(2026, 11, 1), 1))).toBe('2027-01-01');
    expect(dayKey(shiftAnchor('week', new Date(2026, 9, 21), -1))).toBe('2026-10-14');
    expect(rangeLabel('month', new Date(2026, 9, 1))).toBe('October 2026');
    expect(rangeLabel('week', new Date(2026, 9, 21))).toBe('Oct 18 to Oct 24, 2026');
  });

  it('moves a post to another day and keeps its time of day', () => {
    const from = new Date(2026, 9, 21, 14, 30).toISOString();
    const moved = new Date(moveToDay(from, new Date(2026, 9, 28)));
    expect([moved.getFullYear(), moved.getMonth(), moved.getDate(), moved.getHours(), moved.getMinutes()]).toEqual([2026, 9, 28, 14, 30]);
  });

  it('puts an undated draft at 09:00 on the day it is dropped on', () => {
    const moved = new Date(moveToDay(null, new Date(2026, 9, 28)));
    expect([moved.getDate(), moved.getHours(), moved.getMinutes()]).toEqual([28, 9, 0]);
  });

  it('round-trips the datetime-local value', () => {
    const iso = new Date(2026, 9, 21, 9, 5).toISOString();
    expect(toLocalInput(iso)).toBe('2026-10-21T09:05');
    expect(toLocalInput(null)).toBe('');
  });

  it('groups by local day in time order and skips undated posts', () => {
    const a = { id: 'a', scheduled_at: new Date(2026, 9, 21, 15, 0).toISOString() };
    const b = { id: 'b', scheduled_at: new Date(2026, 9, 21, 9, 0).toISOString() };
    const c = { id: 'c', scheduled_at: null };
    const g = groupByDay([a, b, c]);
    expect(g.get('2026-10-21')?.map((e) => e.id)).toEqual(['b', 'a']);
    expect(g.size).toBe(1);
  });
});
