import React from 'react';
import type { BusinessRecord } from '@/lib/api/business-builder';
import { lastEditedLabel } from '@/lib/relative-time';

/** "Last edited by Ada, 2 hours ago" for one record; nothing for rows written before edits were tracked. */
export function RecordEdited({ record, className = '' }: { record: BusinessRecord; className?: string }) {
  const label = lastEditedLabel(record.updated_at, record.updated_by);
  if (!label) return null;
  return <p className={`text-[11px] text-ink-subtle ${className}`}>{label}</p>;
}
