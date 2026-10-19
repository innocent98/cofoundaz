import { describe, expect, it } from 'vitest';
import { chipId, curvePath, isFromBlock, liveLinks, makeLink, sameLink, targetBlockFor, toggleLink } from './fit-links';

const link = { from_block: 'pain_relievers', from_item: 'Instant receipts', to_block: 'pains', to_item: 'Lost sales' };

describe('fit-links', () => {
  it('only pairs relievers with pains and creators with gains', () => {
    expect(targetBlockFor('pain_relievers')).toBe('pains');
    expect(targetBlockFor('gain_creators')).toBe('gains');
    expect(targetBlockFor('jobs')).toBeNull();
    expect(isFromBlock('pain_relievers')).toBe(true);
    expect(isFromBlock('pains')).toBe(false);
  });

  it('builds a valid link and rejects a wrong pair', () => {
    expect(makeLink({ block: 'pain_relievers', item: 'Instant receipts' }, { block: 'pains', item: 'Lost sales' })).toEqual(link);
    expect(makeLink({ block: 'pain_relievers', item: 'x' }, { block: 'gains', item: 'y' })).toBeNull();
    expect(makeLink({ block: 'jobs', item: 'x' }, { block: 'pains', item: 'y' })).toBeNull();
  });

  it('toggles: adds a new line, removes an existing one, never mutates', () => {
    const base = [link];
    const other = { ...link, to_item: 'Slow settlement' };
    expect(toggleLink(base, other)).toEqual([link, other]);
    expect(toggleLink(base, { ...link })).toEqual([]);
    expect(base).toEqual([link]);
    expect(sameLink(link, { ...link })).toBe(true);
  });

  it('drops lines whose items are gone', () => {
    const lists: Record<string, string[]> = { pain_relievers: ['Instant receipts'], pains: [] };
    expect(liveLinks([link], (b) => lists[b] ?? [])).toEqual([]);
    lists.pains = ['Lost sales'];
    expect(liveLinks([link], (b) => lists[b] ?? [])).toEqual([link]);
  });

  it('ids chips by block and text', () => {
    expect(chipId('pains', 'Lost sales')).toBe('pains::Lost sales');
  });

  it('draws a curve from the right-hand chip back to the left-hand one', () => {
    expect(curvePath(300, 10, 100, 50)).toBe('M 300 10 C 200 10, 200 50, 100 50');
    expect(curvePath(100, 10, 120, 50)).toBe('M 100 10 C 124 10, 96 50, 120 50');
  });
});
