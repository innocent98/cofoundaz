'use client';

import { useCallback, useEffect, useState } from 'react';
import { groupByAnchor, listComments } from '@/lib/api/comments';

export type CommentCounts = Record<string, { total: number; open: number }>;

/** Open / total comment counts per block key for one canvas (one request, grouped by `anchor`). */
export function useCanvasCommentCounts(canvasId: string | null) {
  const [counts, setCounts] = useState<CommentCounts>({});

  const refresh = useCallback(async () => {
    if (!canvasId) return;
    try {
      const groups = groupByAnchor(await listComments('business_canvas', canvasId));
      const next: CommentCounts = {};
      for (const [k, g] of Object.entries(groups)) next[k] = { total: g.all.length, open: g.open };
      setCounts(next);
    } catch {
      // counts are decoration: keep what we have
    }
  }, [canvasId]);

  useEffect(() => {
    void (async () => {
      await refresh();
    })();
  }, [refresh]);

  return { counts, refresh };
}

/** Counts per record id (one request each, in parallel; a page holds a handful of records). */
export function useRecordCommentCounts(recordIds: string[]) {
  const [counts, setCounts] = useState<CommentCounts>({});
  const key = recordIds.join(',');

  const refresh = useCallback(async () => {
    const ids = key ? key.split(',') : [];
    if (ids.length === 0) return;
    const entries = await Promise.all(
      ids.map(async (id) => {
        try {
          const list = await listComments('business_record', id);
          return [id, { total: list.length, open: list.filter((c) => !c.resolved_at).length }] as const;
        } catch {
          return null;
        }
      })
    );
    const next: CommentCounts = {};
    for (const e of entries) if (e) next[e[0]] = e[1];
    setCounts(next);
  }, [key]);

  useEffect(() => {
    void (async () => {
      await refresh();
    })();
  }, [refresh]);

  return { counts, refresh };
}
