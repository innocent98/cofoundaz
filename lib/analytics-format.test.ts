import { describe, expect, it } from 'vitest';
import type { MetricResult } from '@/lib/api/analytics';
import {
  asOfLabel,
  deltaView,
  exportStatusView,
  formatValue,
  lockedHubLabels,
  metricState,
  moveItem,
  newBlockId,
  periodLabel,
  reorderTo,
  resultBlockId,
} from './analytics-format';

const revenue: MetricResult = {
  key: 'finance.revenue',
  label: 'Revenue',
  unit: 'money',
  hub: 'finance',
  kind: 'flow',
  good: 'up',
  currency: 'NGN',
  status: 'ok',
  value: 500000,
  compare: { period: { from: '2026-09-14', to: '2026-10-13' }, value: 100000, delta: 400000, delta_pct: 400.0 },
};

describe('formatValue', () => {
  it('formats kobo as naira', () => {
    expect(formatValue(500000, 'money', 'NGN')).toBe('₦5,000');
  });
  it('never turns null into zero', () => {
    expect(formatValue(null, 'money', 'NGN')).toBe('—');
    expect(formatValue(undefined, 'count')).toBe('—');
  });
  it('formats percent, months and counts', () => {
    expect(formatValue(2.5, 'percent')).toBe('2.5%');
    expect(formatValue(1, 'months')).toBe('1 month');
    expect(formatValue(7.25, 'months')).toBe('7.3 months');
    expect(formatValue(1234, 'count')).toBe('1,234');
  });
});

describe('deltaView', () => {
  it('shows the percent and marks revenue growth as good', () => {
    expect(deltaView(revenue)).toEqual({ text: '+400%', tone: 'good', spoken: 'up 400% on the comparison period' });
  });
  it('marks burn going up as bad', () => {
    const burn = { ...revenue, good: 'down' as const };
    expect(deltaView(burn)?.tone).toBe('bad');
  });
  it('falls back to the absolute delta when delta_pct is null (comparison value 0)', () => {
    const m = { ...revenue, compare: { ...revenue.compare!, value: 0, delta: 500000, delta_pct: null } };
    expect(deltaView(m)?.text).toBe('+₦5,000');
  });
  it('returns null when the comparison has no value', () => {
    const m = { ...revenue, compare: { ...revenue.compare!, value: null, delta: null, delta_pct: null } };
    expect(deltaView(m)).toBeNull();
    expect(deltaView({ ...revenue, compare: null })).toBeNull();
  });
});

describe('metricState', () => {
  it('never reads value from a locked metric', () => {
    const locked: MetricResult = { key: 'sales.pipeline_value', status: 'locked', needs: 'sales', needs_label: 'Sales', value: 999 };
    expect(metricState(locked)).toEqual({ kind: 'locked', needsLabel: 'Sales' });
  });
  it('maps every status', () => {
    expect(metricState({ ...revenue, status: 'no_data', value: null }).kind).toBe('no_data');
    expect(metricState({ ...revenue, status: 'not_burning' }).kind).toBe('not_burning');
    expect(metricState({ key: 'custom.gone', status: 'unknown', message: 'Metric no longer available.' })).toEqual({
      kind: 'unknown',
      message: 'Metric no longer available.',
    });
    expect(metricState({ ...revenue, status: 'error' }).kind).toBe('error');
    expect(metricState(revenue)).toEqual({ kind: 'value', text: '₦5,000' });
  });
});

describe('labels', () => {
  it('formats a period', () => {
    expect(periodLabel({ from: '2026-10-15', to: '2026-11-13' })).toBe('15 Oct – 13 Nov 2026');
    expect(periodLabel({ from: '2025-12-15', to: '2026-01-13' })).toBe('15 Dec 2025 – 13 Jan 2026');
  });
  it('says "as of" with only the time today', () => {
    const now = new Date('2026-11-13T18:00:00Z');
    expect(asOfLabel('2026-11-13T16:29:24Z', now)).toMatch(/^as of \d\d:\d\d$/);
    expect(asOfLabel('2026-11-10T16:29:24Z', now)).toMatch(/^as of 10 Nov, /);
    expect(asOfLabel(null, now)).toBe('');
  });
});

describe('exportStatusView', () => {
  it('says expired rows must be generated again', () => {
    expect(exportStatusView({ status: 'expired', error: null, expires_at: '2026-11-13T20:27:37Z' }).detail).toBe(
      'Expired. Generate it again.',
    );
  });
  it('shows the API error on failure', () => {
    expect(exportStatusView({ status: 'failed', error: 'The report could not be run. Try again.', expires_at: '' }).detail).toBe(
      'The report could not be run. Try again.',
    );
  });
});

describe('reordering and ids', () => {
  it('moves items and ignores out-of-range moves', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(['a', 'b', 'c'], 0, -1)).toEqual(['a', 'b', 'c']);
    expect(reorderTo(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });
  it('makes ids the API accepts', () => {
    expect(newBlockId()).toMatch(/^[a-f0-9]{8}$/);
  });
  it('finds the block id of a locked run result', () => {
    expect(resultBlockId({ id: 'x1', type: 'metric', locked: true, needs: 'finance', needs_label: 'Finance' })).toBe('x1');
    expect(resultBlockId({ block_id: 'y2', type: 'text', title: null, text: 'hi' })).toBe('y2');
  });
  it('lists locked hubs once', () => {
    expect(
      lockedHubLabels([
        { id: 'a', type: 'metric', locked: true, needs: 'marketing', needs_label: 'Marketing' },
        { id: 'b', type: 'metric', locked: true, needs: 'marketing', needs_label: 'Marketing' },
        { id: 'c', type: 'text', title: null, text: 't' },
      ]),
    ).toEqual(['Marketing']);
  });
});
