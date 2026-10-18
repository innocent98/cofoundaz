import { useCallback, useEffect, useState } from 'react';
import {
  commentErrorMessage,
  createComment,
  deleteComment,
  editComment,
  listComments,
  resolveComment,
  type Comment,
  type CommentEntityType,
} from '@/lib/api/comments';

/** The comments thread for one entity: oldest first, with optimistic-free writes (server response replaces the row). */
export function useComments(entityType: CommentEntityType, entityId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      setComments(await listComments(entityType, entityId));
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    let live = true;
    listComments(entityType, entityId)
      .then((c) => {
        if (live) setComments(c);
      })
      .catch(() => {
        if (live) setLoadError(true);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [entityType, entityId]);

  const replace = (c: Comment) => setComments((prev) => prev.map((x) => (x.id === c.id ? c : x)));

  const post = useCallback(
    async (body: string, mentionUserIds: string[]) => {
      const c = await createComment({ entityType, entityId, body, mentionUserIds });
      setComments((prev) => [...prev, c]);
    },
    [entityType, entityId]
  );
  const edit = useCallback(async (id: string, body: string) => replace(await editComment(id, body)), []);
  const remove = useCallback(async (id: string) => {
    await deleteComment(id);
    setComments((prev) => prev.filter((x) => x.id !== id));
  }, []);
  const resolve = useCallback(async (id: string, resolved: boolean) => replace(await resolveComment(id, resolved)), []);

  return { comments, loading, loadError, reload: load, post, edit, remove, resolve, errorMessage: commentErrorMessage };
}
