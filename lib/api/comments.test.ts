import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ApiError } from './client';
import * as client from './client';
import { commentErrorMessage, createComment, listComments, resolveComment } from './comments';

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
