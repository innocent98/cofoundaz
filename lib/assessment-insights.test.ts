import { describe, expect, it } from 'vitest';
import { changeInsight, daysSinceCompletion, joinLabels, scoreInsight } from './assessment-insights';

const sc = (product: number, market: number, money: number, legal: number, team: number) => ({ product, market, money, legal, team });

describe('assessment insights', () => {
  it('joins labels', () => {
    expect(joinLabels(['product'])).toBe('Product');
    expect(joinLabels(['product', 'team'])).toBe('Product and Team');
    expect(joinLabels(['product', 'money', 'team'])).toBe('Product, Money and Team');
  });
  it('scoreInsight names all ties', () => {
    expect(scoreInsight(sc(25, 10, 25, 10, 25), 'max')).toEqual({ label: 'Product, Money and Team', tied: true, score: 25 });
    expect(scoreInsight(sc(25, 10, 30, 11, 25), 'min')).toEqual({ label: 'Market', tied: false, score: 10 });
  });
  it('changeInsight: improvement only when > 0, else drop, else none', () => {
    expect(changeInsight(sc(60, 50, 50, 50, 50), sc(50, 50, 50, 50, 50)).kind).toBe('improvement');
    expect(changeInsight(sc(25, 50, 50, 50, 50), sc(100, 50, 50, 50, 50))).toEqual({ kind: 'drop', label: 'Product', tied: false, delta: -75 });
    expect(changeInsight(sc(50, 40, 50, 50, 50), sc(50, 50, 50, 50, 50)).kind).toBe('drop');
    expect(changeInsight(sc(50, 50, 50, 50, 50), sc(50, 50, 50, 50, 50)).kind).toBe('none');
  });
});

describe('daysSinceCompletion', () => {
  const now = Date.parse('2026-10-20T00:00:00Z');
  it('returns the real whole-day gap from 90 days', () => {
    expect(daysSinceCompletion('2026-07-12T00:00:00Z', now)).toBe(100);
    expect(daysSinceCompletion('2026-07-22T00:00:00Z', now)).toBe(90);
  });
  it('is null when unknown or under 90', () => {
    expect(daysSinceCompletion(null, now)).toBeNull();
    expect(daysSinceCompletion('2026-10-01T00:00:00Z', now)).toBeNull();
  });
});
