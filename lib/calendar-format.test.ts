import { describe, expect, it } from 'vitest';
import {
  callbackErrorMessage,
  httpUrl,
  longDate,
  dayHeading,
  feedRange,
  formatClock,
  itemTimeLabel,
  itemsByDay,
  monthGridDays,
  offsetLabel,
  parseSavedLayers,
  shiftView,
  syncSummaryLabel,
  toOffsetMinutes,
  viewLabel,
} from './calendar-format';
import type { FeedItem } from './api/calendar';

const item = (over: Partial<FeedItem>): FeedItem => ({
  id: 'x', layer: 'team', kind: 'task', title: 'T', date: '2026-11-01', end_date: null,
  start_time: null, end_time: null, all_day: false, timezone: 'Africa/Lagos', status: null,
  ref: null, private: false, ...over,
});

describe('month grid and ranges', () => {
  it('pads to whole Sunday-first weeks', () => {
    const days = monthGridDays(new Date(2026, 10, 15)); // Nov 2026 starts on a Sunday, 30 days
    expect(days).toHaveLength(35);
    expect(days[0].getDate()).toBe(1);
    expect(monthGridDays(new Date(2026, 9, 1))).toHaveLength(35); // Oct 2026 starts Thursday
  });
  it('asks the feed for exactly the visible grid, week or agenda window', () => {
    expect(feedRange('month', new Date(2026, 9, 10))).toEqual({ from: '2026-09-27', to: '2026-10-31' });
    expect(feedRange('week', new Date(2026, 9, 29))).toEqual({ from: '2026-10-25', to: '2026-10-31' });
    expect(feedRange('agenda', new Date(2026, 9, 29))).toEqual({ from: '2026-10-29', to: '2026-11-27' });
  });
  it('stays inside the 366-day cap for every view', () => {
    for (const v of ['month', 'week', 'agenda'] as const) {
      const { from, to } = feedRange(v, new Date(2026, 0, 31));
      const span = (new Date(to).getTime() - new Date(from).getTime()) / 86400000;
      expect(span).toBeLessThan(366);
    }
  });
  it('shifts by view', () => {
    expect(shiftView('month', new Date(2026, 0, 31), 1).getMonth()).toBe(1);
    expect(shiftView('week', new Date(2026, 9, 29), -1).getDate()).toBe(22);
  });
  it('labels', () => {
    expect(viewLabel('month', new Date(2026, 9, 29))).toBe('October 2026');
    expect(viewLabel('week', new Date(2026, 9, 29))).toBe('Oct 25 to Oct 31, 2026');
    expect(dayHeading('2026-10-29', new Date(2026, 9, 29))).toBe('Today · Thursday, 29 October');
    expect(dayHeading('2026-10-30', new Date(2026, 9, 29))).toMatch(/^Tomorrow/);
  });
});

describe('itemsByDay', () => {
  it('puts all-day first, then clock order', () => {
    const map = itemsByDay(
      [
        item({ id: 'b', title: 'Late', start_time: '15:00' }),
        item({ id: 'a', title: 'Early', start_time: '09:00' }),
        item({ id: 'c', title: 'Day', all_day: true }),
      ],
      '2026-11-01',
      '2026-11-07',
    );
    expect(map.get('2026-11-01')!.map((i) => i.id)).toEqual(['c', 'a', 'b']);
  });
  it('repeats a multi-day item on each day, clipped to the range', () => {
    const map = itemsByDay([item({ date: '2026-10-30', end_date: '2026-11-03' })], '2026-11-01', '2026-11-02');
    expect([...map.keys()]).toEqual(['2026-11-01', '2026-11-02']);
  });
});

describe('wording', () => {
  it('formats clocks and item times', () => {
    expect(formatClock('00:05')).toBe('12:05 AM');
    expect(formatClock('13:30')).toBe('1:30 PM');
    expect(itemTimeLabel(item({ all_day: true }))).toBe('All day');
    expect(itemTimeLabel(item({ start_time: '10:00', end_time: '11:00' }))).toBe('10:00 AM to 11:00 AM');
  });
  it('words reminder offsets and validates them', () => {
    expect(offsetLabel(15)).toBe('15 minutes before');
    expect(offsetLabel(60)).toBe('1 hour before');
    expect(offsetLabel(1440)).toBe('1 day before');
    expect(offsetLabel(10080)).toBe('1 week before');
    expect(toOffsetMinutes(2, 'days')).toBe(2880);
    expect(toOffsetMinutes(15, 'days')).toBeNull();
    expect(toOffsetMinutes(0, 'minutes')).toBeNull();
    expect(toOffsetMinutes(1.5, 'hours')).toBeNull();
  });
  it('maps Google callback errors, with a safe fallback', () => {
    expect(callbackErrorMessage('access_denied')).toBe('You cancelled the Google connection.');
    expect(callbackErrorMessage('???')).toMatch(/failed/);
  });
  it('summarises a sync', () => {
    expect(syncSummaryLabel({ pulled: 2, pushed: 3, removed: 0 })).toBe('2 pulled, 3 pushed');
    expect(syncSummaryLabel({ pulled: 0, pushed: 0, removed: 0 })).toBe('Nothing changed');
  });
  it('restores only known saved layers', () => {
    expect(parseSavedLayers('["meeting","bogus"]')).toEqual(['meeting']);
    expect(parseSavedLayers('nope')).toBeNull();
    expect(parseSavedLayers(null)).toBeNull();
  });
  it('only lets http(s) links through and writes long dates', () => {
    expect(httpUrl('https://meet.example.com/x')).toBe('https://meet.example.com/x');
    expect(httpUrl('javascript:alert(1)')).toBeNull();
    expect(httpUrl('not a url')).toBeNull();
    expect(longDate('2026-11-01')).toBe('Sunday, 1 November 2026');
  });
});
