'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useBusinessBuilderApi } from '@/hooks/useBusinessBuilderApi';

// Drives a Business Builder canvas editor from the API's served `block_defs`
// (guide §2/§3). List blocks are string arrays; text blocks (mission_vision) are
// plain strings. Every PUT must send the COMPLETE blocks object, so we hold the
// full blocks in state and send all of it on each save. Version + 409 retry are
// handled inside useBusinessBuilderApi.saveCanvas (Module 16).

export interface BlockDef {
  key: string;
  label: string;
  kind: 'list' | 'text';
}

type CanvasBlocks = Record<string, string[] | string>;

interface RawCanvas {
  version?: number;
  blocks?: CanvasBlocks;
  block_defs?: BlockDef[];
}

export type SaveStatus = 'saved' | 'saving' | 'error';

export function useCanvasEditor(type: string) {
  const { loadCanvas, saveCanvas } = useBusinessBuilderApi();
  const [blocks, setBlocks] = useState<CanvasBlocks>({});
  const [blockDefs, setBlockDefs] = useState<BlockDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const data = (await loadCanvas(type)) as RawCanvas | null;
      if (data?.blocks) setBlocks(data.blocks);
      if (Array.isArray(data?.block_defs)) setBlockDefs(data.block_defs);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const persist = useCallback(
    async (next: CanvasBlocks) => {
      setSaveStatus('saving');
      try {
        await saveCanvas(type, { blocks: next });
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    },
    [type, saveCanvas]
  );

  // Debounced autosave: apply optimistically, then persist the FULL blocks object.
  const commit = useCallback(
    (next: CanvasBlocks) => {
      setBlocks(next);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => void persist(next), 700);
    },
    [persist]
  );

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const listOf = useCallback((key: string): string[] => {
    const v = blocks[key];
    return Array.isArray(v) ? v : [];
  }, [blocks]);
  const textOf = useCallback((key: string): string => {
    const v = blocks[key];
    return typeof v === 'string' ? v : '';
  }, [blocks]);

  const addItem = useCallback((key: string, text: string) => {
    const t = text.trim();
    if (!t) return;
    commit({ ...blocks, [key]: [...listOf(key), t] });
  }, [blocks, listOf, commit]);

  const removeItem = useCallback((key: string, idx: number) => {
    commit({ ...blocks, [key]: listOf(key).filter((_, i) => i !== idx) });
  }, [blocks, listOf, commit]);

  // Edit a single list item in place. Empty text removes it (an emptied chip is a
  // delete); a no-op edit skips the save.
  const editItem = useCallback((key: string, idx: number, text: string) => {
    const t = text.trim();
    const list = listOf(key);
    if (idx < 0 || idx >= list.length) return;
    if (t === list[idx]) return;
    const next = t
      ? list.map((v, i) => (i === idx ? t : v))
      : list.filter((_, i) => i !== idx);
    commit({ ...blocks, [key]: next });
  }, [blocks, listOf, commit]);

  const setText = useCallback((key: string, value: string) => {
    commit({ ...blocks, [key]: value });
  }, [blocks, commit]);

  return { blocks, blockDefs, loading, saveStatus, listOf, textOf, addItem, removeItem, editItem, setText };
}
