import { apiClient } from './client';

export type CommentEntity = 'business_canvas' | 'business_record';

export interface BuilderComment {
  id: string;
  entity_type: CommentEntity;
  entity_id: string;
  anchor: string | null;
  author: { id: string; name: string | null };
  body: string;
  mention_user_ids: string[];
  created_at: string;
  edited_at: string | null;
  resolved_at: string | null;
  is_mine: boolean;
}

export interface TeamMember {
  user_id: string;
  name: string | null;
  email: string;
  role: string;
}

type Envelope<T> = { data?: T };

export async function listComments(entityType: CommentEntity, entityId: string, anchor?: string): Promise<BuilderComment[]> {
  const q = new URLSearchParams({ entity_type: entityType, entity_id: entityId });
  if (anchor) q.set('anchor', anchor);
  const res = await apiClient<Envelope<BuilderComment[]>>(`/team/comments?${q.toString()}`);
  return Array.isArray(res?.data) ? res.data : [];
}

export async function createComment(input: {
  entity_type: CommentEntity;
  entity_id: string;
  anchor?: string;
  body: string;
  mention_user_ids?: string[];
}): Promise<BuilderComment> {
  const res = await apiClient<Envelope<BuilderComment>>('/team/comments', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data as BuilderComment;
}

export async function editComment(id: string, body: string): Promise<BuilderComment> {
  const res = await apiClient<Envelope<BuilderComment>>(`/team/comments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ body }),
  });
  return res.data as BuilderComment;
}

export async function deleteComment(id: string): Promise<void> {
  await apiClient(`/team/comments/${id}`, { method: 'DELETE' });
}

export async function resolveComment(id: string, resolved: boolean): Promise<BuilderComment> {
  const res = await apiClient<Envelope<BuilderComment>>(`/team/comments/${id}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ resolved }),
  });
  return res.data as BuilderComment;
}

export async function listMembers(): Promise<TeamMember[]> {
  const res = await apiClient<Envelope<TeamMember[]>>('/team/members');
  return Array.isArray(res?.data) ? res.data : [];
}

/** Open comments grouped by `anchor` ('' = whole item). Resolved threads are kept in `all`. */
export function groupByAnchor(comments: BuilderComment[]): Record<string, { all: BuilderComment[]; open: number }> {
  const out: Record<string, { all: BuilderComment[]; open: number }> = {};
  for (const c of comments) {
    const key = c.anchor ?? '';
    (out[key] ??= { all: [], open: 0 }).all.push(c);
    if (!c.resolved_at) out[key].open += 1;
  }
  return out;
}
