'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  businessBuilderApi,
  type BlockDef,
  type Canvas,
  type CanvasBlocks,
  type EditorRef,
  type FitLink,
} from '@/lib/api/business-builder';
import { ApiError } from '@/lib/api/client';
import { apiErrorInfo } from '@/lib/api/api-error';
import * as ops from '@/lib/canvas-ops';
import { useBuilderAccess } from '@/hooks/useBuilderAccess';

// Drives a Business Builder canvas editor from the API's served `block_defs`.
// Every PUT sends the COMPLETE blocks object with the version we last read, and
// the server bumps it on each save, so we track it in a ref and re-read after
// anything else moves it (AI fill, restore). Direct editors autosave; a
// consultant's edits stay local until "Send suggestion" (POST /suggestions).

export type { BlockDef } from '@/lib/api/business-builder';
export type SaveStatus = 'saved' | 'saving' | 'error';

export interface SendResult {
  ok: boolean;
  error?: string;
}

export function useCanvasEditor(type: string) {
  const access = useBuilderAccess();
  const [blocks, setBlocks] = useState<CanvasBlocks>({});
  const [serverBlocks, setServerBlocks] = useState<CanvasBlocks>({});
  const [blockDefs, setBlockDefs] = useState<BlockDef[]>([]);
  const [canvasId, setCanvasId] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [updatedBy, setUpdatedBy] = useState<EditorRef | null>(null);
  const [fitLinks, setFitLinks] = useState<FitLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [highlighted, setHighlighted] = useState<string[]>([]);
  const version = useRef(0);
  const latest = useRef<CanvasBlocks>({});
  const pending = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chain = useRef<Promise<void>>(Promise.resolve());

  const applyCanvas = useCallback((c: Canvas) => {
    version.current = c.version;
    latest.current = c.blocks ?? {};
    setBlocks(c.blocks ?? {});
    setServerBlocks(c.blocks ?? {});
    if (Array.isArray(c.block_defs)) setBlockDefs(c.block_defs);
    if (c.id) setCanvasId(c.id);
    setUpdatedAt(c.updated_at ?? null);
    setUpdatedBy(c.updated_by ?? null);
    setFitLinks(c.fit_links ?? []);
  }, []);

  const reload = useCallback(async () => {
    try {
      applyCanvas(await businessBuilderApi.getCanvas(type));
      setLoadError(null);
    } catch (err) {
      setLoadError(apiErrorInfo(err, 'Could not load this canvas.').message);
    }
  }, [type, applyCanvas]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await reload();
      setLoading(false);
    })();
  }, [reload]);

  // One save at a time so overlapping autosaves never race on the version.
  const persist = useCallback(
    (next: CanvasBlocks) => {
      const run = async () => {
        setSaveStatus('saving');
        const put = (v: number) => businessBuilderApi.saveCanvas(type, { version: v, blocks: next });
        try {
          let res: Canvas;
          try {
            res = await put(version.current);
          } catch (err) {
            // Someone else moved the canvas: re-read the version and retry once.
            if (err instanceof ApiError && err.status === 409) {
              const fresh = await businessBuilderApi.getCanvas(type);
              res = await put(fresh.version);
            } else {
              throw err;
            }
          }
          version.current = res.version;
          setServerBlocks(next);
          setUpdatedAt(res.updated_at ?? null);
          setUpdatedBy(res.updated_by ?? null);
          setSaveStatus('saved');
          // The API prunes fit-lines whose items were renamed or deleted: redraw from the server's list.
          if (type === 'value_prop') {
            try {
              setFitLinks((await businessBuilderApi.getCanvas(type)).fit_links ?? []);
            } catch {
              /* keep the lines we have */
            }
          }
        } catch {
          setSaveStatus('error');
        }
      };
      chain.current = chain.current.then(run);
      return chain.current;
    },
    [type]
  );

  /** Save any debounced edit right now (before an AI job or a restore reads the canvas). */
  const flush = useCallback(async () => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (pending.current && access.canEdit) {
      pending.current = false;
      await persist(latest.current);
    } else {
      await chain.current;
    }
  }, [persist, access.canEdit]);

  // Apply optimistically. Direct editors autosave the FULL blocks; consultants and
  // read-only roles only change local state (and read-only never calls this).
  const commit = useCallback(
    (next: CanvasBlocks) => {
      if (!access.canWrite || next === latest.current) return;
      latest.current = next;
      setBlocks(next);
      if (!access.canEdit) return;
      pending.current = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveTimer.current = null;
        pending.current = false;
        void persist(latest.current);
      }, 700);
    },
    [access.canWrite, access.canEdit, persist]
  );

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const listOf = useCallback((key: string) => ops.listOf(blocks, key), [blocks]);
  const textOf = useCallback((key: string) => ops.textOf(blocks, key), [blocks]);

  const addItem = useCallback((key: string, text: string) => commit(ops.addItem(latest.current, key, text)), [commit]);
  const removeItem = useCallback((key: string, idx: number) => commit(ops.removeItem(latest.current, key, idx)), [commit]);
  const editItem = useCallback(
    (key: string, idx: number, text: string) => commit(ops.editItem(latest.current, key, idx, text)),
    [commit]
  );
  const setText = useCallback((key: string, value: string) => commit({ ...latest.current, [key]: value }), [commit]);
  const moveItem = useCallback(
    (key: string, from: number, to: number) => commit(ops.moveWithin(latest.current, key, from, to)),
    [commit]
  );
  const moveAcross = useCallback(
    (fromKey: string, fromIdx: number, toKey: string, toIdx: number) =>
      commit(ops.moveAcross(latest.current, fromKey, fromIdx, toKey, toIdx)),
    [commit]
  );

  // ---- consultant suggest mode ----
  const dirty = useMemo(() => access.suggestMode && !ops.blocksEqual(blocks, serverBlocks), [access.suggestMode, blocks, serverBlocks]);

  const discardChanges = useCallback(() => {
    latest.current = serverBlocks;
    setBlocks(serverBlocks);
  }, [serverBlocks]);

  const sendSuggestion = useCallback(
    async (note?: string): Promise<SendResult> => {
      try {
        await businessBuilderApi.createSuggestion({
          op: 'canvas_update',
          target: { canvas_type: type },
          payload: { blocks: latest.current },
          note: note?.trim() || undefined,
        });
        await reload();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: apiErrorInfo(err, 'Could not send your suggestion.').message };
      }
    },
    [type, reload]
  );

  // Briefly highlight what a section-AI job appended.
  const highlight = useCallback((items: string[]) => {
    if (!items.length) return;
    setHighlighted(items);
    setTimeout(() => setHighlighted([]), 4000);
  }, []);

  /** Replaces the whole fit-line list (value_prop only). Optimistic, reverts if the server refuses. */
  const saveFit = useCallback(
    async (links: FitLink[]): Promise<SendResult> => {
      const before = fitLinks;
      setFitLinks(links);
      try {
        const res = await businessBuilderApi.saveFitLinks(links);
        setFitLinks(res.fit_links ?? links);
        return { ok: true };
      } catch (err) {
        setFitLinks(before);
        return { ok: false, error: apiErrorInfo(err, 'Could not save that fit-line.').message };
      }
    },
    [fitLinks]
  );

  const getVersion = useCallback(() => version.current, []);

  return {
    access,
    blocks,
    blockDefs,
    canvasId,
    updatedAt,
    updatedBy,
    loading,
    loadError,
    saveStatus,
    highlighted,
    fitLinks,
    saveFit,
    dirty,
    listOf,
    textOf,
    addItem,
    removeItem,
    editItem,
    moveItem,
    moveAcross,
    setText,
    reload,
    applyCanvas,
    flush,
    getVersion,
    highlight,
    discardChanges,
    sendSuggestion,
  };
}
