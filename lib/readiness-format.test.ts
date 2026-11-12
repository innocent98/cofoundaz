import { describe, expect, it } from 'vitest';
import {
  axisLabels,
  chartPoints,
  checkErrorCopy,
  deckErrorCopy,
  deckErrorRetryable,
  formatMinor,
  formatSignalAmount,
  isMarketSizeGap,
  majorInputToMinor,
  minorToMajorInput,
  scoreTone,
  signalProgress,
  stepLabel,
  stepPath,
} from './readiness-format';
import type { HistoryPoint, Signal } from '@/lib/api/readiness';

const sig = (over: Partial<Signal>): Signal => ({
  key: 'traction.revenue',
  href: '/finance',
  note: null,
  unit: 'NGN',
  label: 'Monthly revenue',
  score: 30,
  value: 300000,
  target: 1000000,
  ...over,
});

describe('scoreTone', () => {
  it('uses the verdict cut-offs', () => {
    expect(scoreTone(39)).toBe('danger');
    expect(scoreTone(40)).toBe('warning');
    expect(scoreTone(69)).toBe('warning');
    expect(scoreTone(70)).toBe('success');
  });
});

describe('signal amounts', () => {
  it('formats naira, counts and percents; hides step values', () => {
    expect(signalProgress(sig({}))).toBe('₦300,000 of ₦1,000,000');
    expect(signalProgress(sig({ unit: 'count', value: 1, target: 3 }))).toBe('1 of 3');
    expect(signalProgress(sig({ unit: '%', value: 12.5, target: 40 }))).toBe('12.5% of 40%');
    expect(signalProgress(sig({ unit: 'step', value: 1, target: 2 }))).toBeNull();
    expect(formatSignalAmount('/5', 3.67)).toBe('3.7/5');
  });
});

describe('stepLabel', () => {
  it('names the stage of a step signal', () => {
    expect(stepLabel(0)).toBe('Not started');
    expect(stepLabel(50)).toBe('In progress');
    expect(stepLabel(100)).toBe('Done');
  });
});

describe('formatMinor', () => {
  it('shortens kobo to a naira string', () => {
    expect(formatMinor(160000000, 'NGN')).toBe('₦1.6M');
    expect(formatMinor(90000, 'NGN')).toBe('₦900');
    expect(formatMinor(250000, 'USD')).toBe('$2.5k');
    expect(formatMinor(500000000000, 'NGN')).toBe('₦5B');
  });
});

describe('market size form conversion', () => {
  it('round-trips minor and major units', () => {
    expect(minorToMajorInput(5000000000)).toBe('50000000');
    expect(minorToMajorInput(null)).toBe('');
    expect(majorInputToMinor('50,000,000')).toBe(5000000000);
    expect(majorInputToMinor('')).toBeNull();
    expect(Number.isNaN(majorInputToMinor('abc'))).toBe(true);
    expect(Number.isNaN(majorInputToMinor('-5'))).toBe(true);
  });
});

describe('history chart', () => {
  const now = Date.parse('2026-11-12T00:00:00Z');
  const pt = (at: string, score: number): HistoryPoint => ({
    at,
    score,
    band: 'not_yet',
    capped: false,
    dimensions: { team: 0, traction: 0, market: 0, product: 0, financials: 0, story: 0 },
  });

  it('places points on a real time axis', () => {
    const pts = chartPoints([pt('2026-10-28T00:00:00Z', 20), pt('2026-11-12T00:00:00Z', 40)], 30, now);
    expect(pts[0].x).toBeCloseTo(50, 5);
    expect(pts[1].x).toBeCloseTo(100, 5);
  });

  it('clamps points before the window to the left edge', () => {
    expect(chartPoints([pt('2025-01-01T00:00:00Z', 10)], 30, now)[0].x).toBe(0);
  });

  it('draws a step line that holds the last score to the right edge', () => {
    const path = stepPath([
      { x: 10, y: 20, at: '', score: 20 },
      { x: 60, y: 40, at: '', score: 40 },
    ]);
    expect(path).toBe('10,80 60,80 60,60 100,60');
    expect(stepPath([])).toBe('');
  });

  it('labels the start, middle and end of the window', () => {
    expect(axisLabels(30, now)).toHaveLength(3);
  });
});

describe('failure copy', () => {
  it('maps deck, check and retryability', () => {
    expect(deckErrorCopy('no_text')).toMatch(/text PDF/);
    expect(deckErrorRetryable('no_text')).toBe(false);
    expect(deckErrorRetryable('over_budget')).toBe(true);
    expect(checkErrorCopy('over_budget')).toMatch(/tomorrow/);
  });
  it('knows the market-size gap', () => {
    expect(isMarketSizeGap('market.size')).toBe(true);
    expect(isMarketSizeGap('traction.revenue')).toBe(false);
  });
});
