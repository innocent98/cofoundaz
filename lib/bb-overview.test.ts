import { describe, expect, it } from 'vitest';
import type { OverviewRow } from '@/lib/api/business-builder';
import { ctaFor, indexByType, planCta, planProgress } from './bb-overview';

const row = (over: Partial<OverviewRow>): OverviewRow => ({
  type: 'swot',
  label: 'Swot',
  status: 'start',
  updated_at: null,
  ...over,
});

describe('overview CTA', () => {
  it('is driven by status, not by percentage', () => {
    expect(ctaFor(row({ status: 'start', completion_pct: 0 }), true).label).toBe('Start');
    expect(ctaFor(row({ status: 'continue', completion_pct: 0 }), true).label).toBe('Continue');
    expect(ctaFor(row({ status: 'complete', completion_pct: 100 }), true).label).toBe('Review');
  });

  it('defaults to Start when the API has no row yet', () => {
    expect(ctaFor(undefined, true).label).toBe('Start');
  });

  it('offers read-only roles View instead of Start', () => {
    expect(ctaFor(row({ status: 'start' }), false).label).toBe('View');
    expect(ctaFor(row({ status: 'continue' }), false).label).toBe('Continue');
  });
});

describe('plan tile', () => {
  it('maps each plan status', () => {
    expect(planCta(row({ type: 'plan', status: 'none' }), true).label).toBe('Start');
    expect(planCta(row({ type: 'plan', status: 'generating' }), true).label).toBe('Generating');
    expect(planCta(row({ type: 'plan', status: 'failed' }), true).label).toBe('Try again');
    expect(planCta(row({ type: 'plan', status: 'complete', document_id: 'doc-1' }), true)).toEqual({
      label: 'Open document',
      href: '/documents/doc-1',
    });
  });

  it('reports 100% only when complete', () => {
    expect(planProgress(row({ status: 'complete' }))).toBe(100);
    expect(planProgress(row({ status: 'generating' }))).toBe(0);
    expect(planProgress(undefined)).toBe(0);
  });
});

describe('indexByType', () => {
  it('joins by type regardless of order', () => {
    const idx = indexByType([row({ type: 'plan', status: 'none' }), row({ type: 'lean' })]);
    expect(Object.keys(idx).sort()).toEqual(['lean', 'plan']);
  });
});
