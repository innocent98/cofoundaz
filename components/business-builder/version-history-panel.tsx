'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Loader2, RotateCcw, X } from 'lucide-react';
import {
  businessBuilderApi,
  type BlockDef,
  type Canvas,
  type CanvasVersionDetail,
  type CanvasVersionRow,
  type VersionSource,
} from '@/lib/api/business-builder';
import { apiErrorInfo } from '@/lib/api/api-error';
import { relativeTime } from '@/lib/relative-time';

const SOURCE_LABEL: Record<VersionSource, string> = {
  manual: 'Edited',
  ai: 'AI draft',
  suggestion: 'Approved suggestion',
  restore: 'Restored',
};

interface Props {
  open: boolean;
  type: string;
  blockDefs: BlockDef[];
  /** Founders and team members can restore; everyone else only previews. */
  canRestore: boolean;
  /** Saves any pending edit and resolves, so restore uses the true current version. */
  flush: () => Promise<void>;
  getVersion: () => number;
  onRestored: (canvas: Canvas) => void;
  /** The canvas moved elsewhere: reload it. */
  onStale: () => Promise<void>;
  onClose: () => void;
}

function Preview({ detail, defs }: { detail: CanvasVersionDetail; defs: BlockDef[] }) {
  const keys = defs.length ? defs : Object.keys(detail.blocks).map((k) => ({ key: k, label: k, kind: 'list' as const }));
  return (
    <div className="flex flex-col gap-3">
      {keys.map((d) => {
        const v = detail.blocks[d.key];
        const items = Array.isArray(v) ? v : typeof v === 'string' && v ? [v] : [];
        return (
          <div key={d.key}>
            <p className="text-[10px] font-bold tracking-wider text-[#768478] uppercase">{d.label}</p>
            {items.length === 0 ? (
              <p className="text-xs italic text-[#B7C0B8]">Empty</p>
            ) : (
              <ul className="mt-1 list-disc list-inside text-xs text-[#1E2923] space-y-0.5">
                {items.map((it, i) => <li key={i}>{it}</li>)}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function VersionHistoryPanel({ open, type, blockDefs, canRestore, flush, getVersion, onRestored, onStale, onClose }: Props) {
  const [rows, setRows] = useState<CanvasVersionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [detail, setDetail] = useState<CanvasVersionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [stale, setStale] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await flush();
      setRows(await businessBuilderApi.listVersions(type));
    } catch (err) {
      setError(apiErrorInfo(err, 'Could not load the history.').message);
    } finally {
      setLoading(false);
    }
  }, [type, flush]);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      setSelected(null);
      setDetail(null);
      setConfirming(false);
      setStale(false);
      await loadList();
    })();
  }, [open, loadList]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const choose = async (version: number) => {
    setSelected(version);
    setDetail(null);
    setConfirming(false);
    setError(null);
    setDetailLoading(true);
    try {
      setDetail(await businessBuilderApi.getVersion(type, version));
    } catch (err) {
      setError(apiErrorInfo(err, 'That version is no longer available.').message);
    } finally {
      setDetailLoading(false);
    }
  };

  const restore = async () => {
    if (selected === null) return;
    setRestoring(true);
    setError(null);
    try {
      await flush();
      const canvas = await businessBuilderApi.restoreVersion(type, selected, getVersion());
      onRestored(canvas);
      toast.success(`Restored version ${selected}`);
      onClose();
    } catch (err) {
      const info = apiErrorInfo(err, 'Could not restore that version.');
      if (info.status === 409) setStale(true);
      setError(info.message);
    } finally {
      setRestoring(false);
      setConfirming(false);
    }
  };

  const reloadAndRetry = async () => {
    await onStale();
    setStale(false);
    setSelected(null);
    setDetail(null);
    await loadList();
  };

  if (!open) return null;
  const currentVersion = rows[0]?.version;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-[#061A12]/30" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside role="dialog" aria-modal="true" aria-label="Version history" className="bg-white w-full md:max-w-md h-full shadow-raised flex flex-col">
        <div className="px-6 py-4 border-b border-[#E8E8E2] flex items-center justify-between bg-[#FBFBFA] shrink-0">
          <h3 className="font-bold text-[#1E2923]">Version history</h3>
          <button type="button" onClick={onClose} className="text-[#8E9B90] hover:text-[#1E2923] p-1 rounded-input hover:bg-[#E8E8E2]" aria-label="Close history">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {loading && <div className="flex items-center gap-2 text-xs text-[#768478]"><Loader2 className="w-4 h-4 animate-spin" /> Loading</div>}
          {!loading && rows.length === 0 && !error && (
            <p className="text-sm text-[#768478]">No saved versions yet. Each save you make will show up here.</p>
          )}

          {rows.length > 0 && (
            <ul className="flex flex-col gap-2">
              {rows.map((r) => {
                const isCurrent = r.version === currentVersion;
                return (
                  <li key={r.version}>
                    <button
                      type="button"
                      onClick={() => choose(r.version)}
                      aria-pressed={selected === r.version}
                      className={`w-full text-left rounded-card border px-3 py-2.5 transition-colors ${
                        selected === r.version ? 'border-[#183B28] bg-[#F2F7F4]' : 'border-[#EBEBE6] hover:bg-[#FAFAFA]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-[#1E2923]">Version {r.version}</span>
                        {isCurrent && <span className="text-[10px] font-bold uppercase tracking-wider text-[#183B28] bg-[#E6EFEA] rounded-full px-2 py-0.5">Current</span>}
                      </div>
                      <p className="text-xs text-[#556358]">
                        {SOURCE_LABEL[r.source] ?? 'Edited'} by {r.edited_by ? r.edited_by.name || 'a teammate' : 'AI'}, {relativeTime(r.created_at)}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {selected !== null && (
            <div className="border-t border-[#EBEBE6] pt-4 flex flex-col gap-3">
              <p className="text-xs font-bold text-[#1E2923]">Preview of version {selected}</p>
              {detailLoading && <Loader2 className="w-4 h-4 animate-spin text-[#768478]" />}
              {detail && <Preview detail={detail} defs={blockDefs} />}
            </div>
          )}

          {error && (
            <div role="alert" className="flex flex-col gap-2 text-xs font-semibold text-[#B0483B] bg-[#FBEBEB] border border-[#F0D5D5] rounded-input px-3 py-2">
              <span className="flex items-start gap-1.5"><AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}</span>
              {stale && (
                <button type="button" onClick={reloadAndRetry} className="self-start underline">Reload the latest version</button>
              )}
            </div>
          )}
        </div>

        {canRestore && detail && selected !== currentVersion && (
          <div className="px-6 py-4 border-t border-[#E8E8E2] shrink-0 flex flex-col gap-2">
            {confirming ? (
              <>
                <p className="text-xs text-[#556358]">Restoring saves version {selected} as a new version. Your history is kept.</p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setConfirming(false)} className="flex-1 px-4 py-2 bg-white border border-[#DCDCD6] hover:bg-[#F5F5F0] rounded-card text-sm font-bold">Cancel</button>
                  <button type="button" onClick={restore} disabled={restoring} className="flex-1 px-4 py-2 bg-[#183B28] hover:bg-[#12261C] disabled:opacity-60 text-white rounded-card text-sm font-bold">
                    {restoring ? 'Restoring' : 'Restore'}
                  </button>
                </div>
              </>
            ) : (
              <button type="button" onClick={() => setConfirming(true)} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#183B28] hover:bg-[#12261C] text-white rounded-card text-sm font-bold">
                <RotateCcw className="w-3.5 h-3.5" /> Restore this version
              </button>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
