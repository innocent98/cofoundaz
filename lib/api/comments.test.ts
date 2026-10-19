import { describe, expect, it } from 'vitest';
import { groupByAnchor, type BuilderComment } from './comments';

const c = (id: string, anchor: string | null, resolved = false): BuilderComment => ({
  id,
  entity_type: 'business_canvas',
  entity_id: 'canvas-1',
  anchor,
  author: { id: 'u1', name: 'Ada' },
  body: 'hi',
  mention_user_ids: [],
  created_at: '2026-10-19T11:00:00Z',
  edited_at: null,
  resolved_at: resolved ? '2026-10-19T12:00:00Z' : null,
  is_mine: true,
});

describe('groupByAnchor', () => {
  it('groups a whole-canvas thread by block key, counting open comments', () => {
    const g = groupByAnchor([c('1', 'strengths'), c('2', 'strengths', true), c('3', 'threats'), c('4', null)]);
    expect(g.strengths.all.map((x) => x.id)).toEqual(['1', '2']);
    expect(g.strengths.open).toBe(1);
    expect(g.threats.open).toBe(1);
    expect(g['']?.all).toHaveLength(1);
  });

  it('is empty for no comments', () => {
    expect(groupByAnchor([])).toEqual({});
  });
});
