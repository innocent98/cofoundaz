'use client';

import { useCallback, useRef, useState } from 'react';
import type React from 'react';

/**
 * Drag a canvas sticky note within a block OR into another block (native HTML5
 * DnD). Drop on a note to insert before it; drop on a block's empty space to
 * append. `handleProps` goes on the note's grip, `noteDropProps` on the note,
 * `blockDropProps` on the block container.
 */
export function useStickyDnd(
  move: (fromKey: string, fromIdx: number, toKey: string, toIdx: number) => void,
  enabled = true
) {
  const drag = useRef<{ key: string; idx: number } | null>(null);
  const [overNote, setOverNote] = useState<string | null>(null);
  const [overBlock, setOverBlock] = useState<string | null>(null);
  const tag = (key: string, idx: number) => `${key}:${idx}`;

  const clear = useCallback(() => {
    drag.current = null;
    setOverNote(null);
    setOverBlock(null);
  }, []);

  const handleProps = useCallback(
    (key: string, idx: number) => ({
      draggable: enabled,
      onDragStart: (e: React.DragEvent) => {
        drag.current = { key, idx };
        e.dataTransfer.effectAllowed = 'move';
        try {
          e.dataTransfer.setData('text/plain', tag(key, idx)); // Firefox needs data to start a drag
        } catch {
          /* ignore */
        }
      },
      onDragEnd: clear,
    }),
    [enabled, clear]
  );

  const noteDropProps = useCallback(
    (key: string, idx: number) => ({
      onDragOver: (e: React.DragEvent) => {
        if (!drag.current) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        setOverBlock(null);
        setOverNote((o) => (o === tag(key, idx) ? o : tag(key, idx)));
      },
      onDragLeave: () => setOverNote((o) => (o === tag(key, idx) ? null : o)),
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const d = drag.current;
        clear();
        if (d && !(d.key === key && d.idx === idx)) move(d.key, d.idx, key, idx);
      },
    }),
    [move, clear]
  );

  const blockDropProps = useCallback(
    (key: string, length: number) => ({
      onDragOver: (e: React.DragEvent) => {
        if (!drag.current) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setOverBlock((o) => (o === key ? o : key));
      },
      onDragLeave: (e: React.DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOverBlock((o) => (o === key ? null : o));
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        const d = drag.current;
        clear();
        if (d) move(d.key, d.idx, key, length);
      },
    }),
    [move, clear]
  );

  const isOverNote = useCallback((key: string, idx: number) => overNote === tag(key, idx), [overNote]);
  const isOverBlock = useCallback((key: string) => overBlock === key, [overBlock]);

  return { handleProps, noteDropProps, blockDropProps, isOverNote, isOverBlock };
}
