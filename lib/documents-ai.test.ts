import { describe, expect, it } from 'vitest';
import { describeDraftResult, findBracketGaps, headingKey, pollDelay, sectionKeyLabel } from './documents-ai';

const base = { reason: null, drafted: [], skipped: [], failed: [], document_version: null };

describe('documents-ai', () => {
  it('maps headings to API section keys', () => {
    expect(headingKey('Market & Customer')).toBe('market_customer');
    expect(headingKey('Go-to-Market')).toBe('go_to_market');
    expect(sectionKeyLabel('go_to_market')).toBe('Go to market');
  });
  it('describes each result status', () => {
    const ready = describeDraftResult({ ...base, status: 'ready', drafted: ['executive_summary'], skipped: ['financials'], document_version: 2 });
    expect(ready?.tone).toBe('success');
    expect(ready?.detail).toContain('Financials');
    expect(describeDraftResult({ ...base, status: 'partial', drafted: ['a'], failed: ['b'] })?.retry).toBe(true);
    expect(describeDraftResult({ ...base, status: 'failed', reason: 'generation_failed' })?.tone).toBe('danger');
    const over = describeDraftResult({ ...base, status: 'over_budget', reason: 'over_budget' });
    expect(over?.retry).toBe(false);
    expect(describeDraftResult({ ...base, status: 'gone' })).toBeNull();
  });
  it('polls at 2 s then 5 s', () => {
    expect(pollDelay(0)).toBe(2000);
    expect(pollDelay(12_000)).toBe(5000);
  });
  it('finds bracketed gaps', () => {
    expect(findBracketGaps('between NovaPay and [Receiving party] for [Purpose]. [Receiving party]')).toEqual(['Receiving party', 'Purpose']);
    expect(findBracketGaps('plain text')).toEqual([]);
  });
});
