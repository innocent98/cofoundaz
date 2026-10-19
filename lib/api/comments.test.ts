import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ApiError } from './client';
import * as client from './client';
import { commentErrorMessage, createComment, groupByAnchor, listComments, resolveComment, type Comment } from './comments';

vi.mock('./client', async (orig) => ({ ...(await orig<typeof import('./client')>()), apiClient: vi.fn() }));

describe('comments api', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists with entity_type and entity_id in the query', async () => {
    vi.mocked(client.apiClient).mockResolvedValueOnce({ data: [], meta: null });
    await listComments('roadmap_milestone', 'm1');
    expect(client.apiClient).toHaveBeenCalledWith('/team/comments?entity_type=roadmap_milestone&entity_id=m1');
  });

  it('sends mention_user_ids only when there are some', async () => {
    vi.mocked(client.apiClient).mockResolvedValue({ data: { id: 'c1' }, meta: null });
    await createComment({ entityType: 'roadmap_task', entityId: 't1', body: 'hi', mentionUserIds: [] });
    expect(JSON.parse(vi.mocked(client.apiClient).mock.calls[0][1]!.body as string)).toEqual({
      entity_type: 'roadmap_task',
      entity_id: 't1',
      body: 'hi',
    });
    await createComment({ entityType: 'roadmap_task', entityId: 't1', body: 'hi', mentionUserIds: ['u1'] });
    expect(JSON.parse(vi.mocked(client.apiClient).mock.calls[1][1]!.body as string).mention_user_ids).toEqual(['u1']);
  });

  it('resolve posts { resolved }', async () => {
    vi.mocked(client.apiClient).mockResolvedValueOnce({ data: { id: 'c1' }, meta: null });
    await resolveComment('c1', true);
    expect(client.apiClient).toHaveBeenCalledWith('/team/comments/c1/resolve', { method: 'POST', body: JSON.stringify({ resolved: true }) });
  });

  it('turns failures into copy the user can act on', () => {
    expect(commentErrorMessage(new ApiError(403, 'Forbidden', {}), 'x')).toBe("You don't have permission to do that.");
    expect(commentErrorMessage(new ApiError(429, 'Too Many', {}), 'x')).toMatch(/too fast/);
    expect(
      commentErrorMessage(new ApiError(422, 'Unprocessable', { error: { message: 'You can only mention people in this workspace.' } }), 'x')
    ).toBe('You can only mention people in this workspace.');
    expect(commentErrorMessage(new Error('boom'), 'fallback')).toBe('fallback');
  });
});

const c = (id: string, anchor: string | null, resolved = false): Comment => ({
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

describe('business builder threads', () => {
  it('lists one section via anchor and posts the anchor', async () => {
    vi.mocked(client.apiClient).mockResolvedValueOnce({ data: [], meta: null });
    await listComments('business_canvas', 'c1', 'strengths');
    expect(client.apiClient).toHaveBeenCalledWith('/team/comments?entity_type=business_canvas&entity_id=c1&anchor=strengths');
    vi.mocked(client.apiClient).mockResolvedValueOnce({ data: { id: 'x' }, meta: null });
    await createComment({ entityType: 'business_canvas', entityId: 'c1', anchor: 'strengths', body: 'hi', mentionUserIds: [] });
    expect(JSON.parse(vi.mocked(client.apiClient).mock.calls[1][1]!.body as string)).toEqual({
      entity_type: 'business_canvas',
      entity_id: 'c1',
      anchor: 'strengths',
      body: 'hi',
    });
  });
});
