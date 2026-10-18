import { ApiError, apiClient } from './client';

// Generic comments thread (BE guide: fe-integration-guide-roadmap-prd.md §3).
// v1 entities: roadmap milestones and tasks. Oldest first; any member reads,
// everyone except investors posts, authors edit/delete their own.

export type CommentEntityType = 'roadmap_milestone' | 'roadmap_task';

export interface CommentAuthor {
  id: string;
  name: string | null;
}

export interface Comment {
  id: string;
  entity_type: CommentEntityType;
  entity_id: string;
  author: CommentAuthor;
  body: string;
  mention_user_ids: string[];
  created_at: string;
  edited_at: string | null;
  resolved_at: string | null;
  is_mine: boolean;
}

export const COMMENT_MAX = 4000;
export const MENTION_MAX = 20;

/** The server's own message for a rejected request, else the fallback. */
export function commentErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 403) return "You don't have permission to do that.";
    if (err.status === 429) return 'You are commenting too fast. Wait a moment and try again.';
    const d = err.data as { error?: { message?: string } } | undefined;
    if (err.status === 422 && d?.error?.message) return d.error.message;
  }
  return fallback;
}

export async function listComments(entityType: CommentEntityType, entityId: string): Promise<Comment[]> {
  const q = new URLSearchParams({ entity_type: entityType, entity_id: entityId });
  const res = await apiClient<{ data?: Comment[] }>(`/team/comments?${q.toString()}`);
  return res?.data ?? [];
}

export async function createComment(input: {
  entityType: CommentEntityType;
  entityId: string;
  body: string;
  mentionUserIds: string[];
}): Promise<Comment> {
  const res = await apiClient<{ data: Comment }>('/team/comments', {
    method: 'POST',
    body: JSON.stringify({
      entity_type: input.entityType,
      entity_id: input.entityId,
      body: input.body,
      ...(input.mentionUserIds.length > 0 ? { mention_user_ids: input.mentionUserIds } : {}),
    }),
  });
  return res.data;
}

export async function editComment(id: string, body: string): Promise<Comment> {
  const res = await apiClient<{ data: Comment }>(`/team/comments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ body }),
  });
  return res.data;
}

export async function deleteComment(id: string): Promise<void> {
  await apiClient(`/team/comments/${id}`, { method: 'DELETE' });
}

export async function resolveComment(id: string, resolved: boolean): Promise<Comment> {
  const res = await apiClient<{ data: Comment }>(`/team/comments/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ resolved }),
  });
  return res.data;
}
