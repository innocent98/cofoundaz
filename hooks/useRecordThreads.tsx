'use client';

import React, { useState } from 'react';
import { useRecordCommentCounts } from '@/hooks/useCommentCounts';
import { CommentButton } from '@/components/business-builder/comment-button';
import { CommentDrawer } from '@/components/business-builder/comment-drawer';

/** Comment threads for a list of records: a count button per record and one shared drawer. */
export function useRecordThreads(recordIds: string[]) {
  const { counts, refresh } = useRecordCommentCounts(recordIds);
  const [thread, setThread] = useState<{ id: string; label: string } | null>(null);

  const button = (id: string, label: string) => (
    <CommentButton label={label} open={counts[id]?.open ?? 0} total={counts[id]?.total ?? 0} onClick={() => setThread({ id, label })} />
  );

  const drawer = (
    <CommentDrawer
      open={thread !== null}
      title={thread?.label ?? ''}
      entityType="business_record"
      entityId={thread?.id ?? null}
      onClose={() => setThread(null)}
      onChanged={refresh}
    />
  );

  return { button, drawer };
}
