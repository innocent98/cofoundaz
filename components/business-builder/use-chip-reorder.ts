'use client';

import { useCallback, useRef, useState } from 'react';
import type React from 'react';

/**
 * Drag-to-reorder for canvas list items, native HTML5 DnD. Reorder is confined to
 * one block: the drop only fires when the dragged item and the target share the same
 * block `key`. `handleProps` goes on a small drag handle (so the chip's click-to-edit
 * text and remove button stay clickable); `dropProps` goes on the chip itself.
 */
export function useChipReorder(moveItem: (key: string, from: number, to: number) => void) {
  const drag = useRef<{ key: string; idx: number } | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const tag = (key: string, idx: number) => `${key}:${idx}`;

  const handleProps = useCallback((key: string, idx: number) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      drag.current = { key, idx };
      e.dataTransfer.effectAllowed = 'move';
      try {
        // Firefox needs data set for a drag to start.
        e.dataTransfer.setData('text/plain', String(idx));
      } catch {
        /* ignore */
      }
    },
    onDragEnd: () => {
      drag.current = null;
      setOver(null);
    },
  }), []);

  const dropProps = useCallback((key: string, idx: number) => ({
    onDragOver: (e: React.DragEvent) => {
      if (drag.current?.key !== key) return; // only within the same block
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setOver((o) => (o === tag(key, idx) ? o : tag(key, idx)));
    },
    onDragLeave: () => setOver((o) => (o === tag(key, idx) ? null : o)),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const d = drag.current;
      setOver(null);
      drag.current = null;
      if (d && d.key === key && d.idx !== idx) moveItem(key, d.idx, idx);
    },
  }), [moveItem]);

  const isOver = useCallback((key: string, idx: number) => over === tag(key, idx), [over]);

  return { handleProps, dropProps, isOver };
}
