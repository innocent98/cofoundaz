'use client';

import React from 'react';
import { ArrowRightLeft } from 'lucide-react';
import type { BlockDef } from '@/lib/api/business-builder';
import { noteLabel } from '@/lib/note-label';

/**
 * A touch and keyboard alternative to dragging a note into another block: a
 * native select laid invisibly over a small icon, so it opens the platform
 * picker on a phone and works with the keyboard everywhere.
 */
export function MoveNote({
  blocks,
  fromKey,
  note,
  onMove,
  className = '',
}: {
  blocks: BlockDef[];
  fromKey: string;
  /** The note's text, so each picker is named for its note. */
  note: string;
  onMove: (toKey: string) => void;
  className?: string;
}) {
  const targets = blocks.filter((b) => b.key !== fromKey && b.kind === 'list');
  if (targets.length === 0) return null;
  return (
    <span className={`relative inline-flex items-center shrink-0 ${className}`}>
      <ArrowRightLeft className="w-3 h-3" aria-hidden="true" />
      <select
        aria-label={`Move note to another block: ${noteLabel(note)}`}
        value=""
        onChange={(e) => {
          if (e.target.value) onMove(e.target.value);
        }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      >
        <option value="">Move to</option>
        {targets.map((b) => (
          <option key={b.key} value={b.key}>{b.label}</option>
        ))}
      </select>
    </span>
  );
}
