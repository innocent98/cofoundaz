import { describe, expect, it } from 'vitest';
import { toSmokeTest } from './useSmokeTests';

const raw = {
  id: 'e1',
  name: 'Same-day settlement',
  type: 'smoke_test' as const,
  status: 'live' as const,
  config: { slug: 'sent-slug', metric_type: 'email_signup', target_conversion: 10 },
  metrics: { visits: 4, signups: 2 },
  assumption_ids: [],
  slug: 'novapay-same-day',
  published_at: '2026-10-19T19:59:32+00:00',
};

describe('toSmokeTest', () => {
  it('reads the live slug from the top level, not from config', () => {
    expect(toSmokeTest(raw).slug).toBe('novapay-same-day');
  });

  it('has no hosted page when the top-level slug is null or absent', () => {
    expect(toSmokeTest({ ...raw, slug: null }).slug).toBe('');
    const { slug: _slug, ...noSlug } = raw;
    void _slug;
    expect(toSmokeTest(noSlug).slug).toBe('');
  });

  it('keeps hand-entered numbers apart and defaults the target', () => {
    const t = toSmokeTest({ ...raw, config: {} });
    expect([t.manualVisits, t.manualSignups, t.targetConversion, t.metricType]).toEqual([4, 2, 5, 'email_signup']);
  });
});
