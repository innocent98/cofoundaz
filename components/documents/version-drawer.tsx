'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ModalDialog } from '@/components/modal-dialog';
import { apiErrorInfo } from '@/lib/api/api-error';
import {
  getVersion,
  listVersions,
  restoreVersion,
  type DocSection,
  type VersionDetail,
  type VersionRow,
} from '@/lib/api/documents';
import { diffLines, formatDate, personName, sectionsForDiff } from '@/lib/documents-format';
import { useToast } from '@/app/(dashboard)/documents/ToastContext';
import { ConfirmDialog, btnIcon, btnPrimary, btnSecondary } from './ui';

type Mode = 'preview' | 'changes';

/** Version history drawer: list, preview, diff against the current text, restore. */
export function VersionDrawer({
  documentId,
  currentSections,
  canRestore,
  onClose,
  onRestored,
  onExport,
}: {
  documentId: string;
  currentSections: DocSection[];
  canRestore: boolean;
  onClose: () => void;
  onRestored: () => void;
  /** Opens the export dialog (export always uses the current version). */
  onExport?: () => void;
}) {
  const { triggerToast } = useToast();
  const [versions, setVersions] = useState<VersionRow[] | null>(null);
  const [current, setCurrent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<VersionDetail | null>(null);
  const [loadingVersion, setLoadingVersion] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>('preview');
  const [confirm, setConfirm] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await listVersions(documentId);
      setVersions(res.versions);
      setCurrent(res.current);
      setError(null);
    } catch (err) {
      setError(apiErrorInfo(err, 'Could not load the version history.').message);
    }
  }, [documentId]);

  useEffect(() => {
    void (async () => {
      await load();
    })();
  }, [load]);

  const open = async (v: VersionRow) => {
    setLoadingVersion(v.version);
    try {
      setSelected(await getVersion(documentId, v.version));
      setMode('preview');
    } catch (err) {
      triggerToast(apiErrorInfo(err, 'Could not open that version.').message, 'error');
    } finally {
      setLoadingVersion(null);
    }
  };

  const doRestore = async () => {
    if (!selected) return;
    try {
      await restoreVersion(documentId, selected.version);
      triggerToast(`Restored version ${selected.version} as a new version.`);
      setConfirm(false);
      onRestored();
      onClose();
    } catch (err) {
      setConfirm(false);
      triggerToast(apiErrorInfo(err, 'Could not restore that version.').message, 'error');
    }
  };

  return (
    <>
    <ModalDialog
      label="Version history"
      onClose={onClose}
      overlayClassName="fixed inset-0 bg-brand-x061a12/40 z-50 flex justify-end"
      className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-raised focus:outline-none"
    >
      <div className="pl-6 pr-2 py-2 border-b border-line flex items-center justify-between bg-surface-faint sticky top-0 z-10">
        <h3 className="font-bold text-ink">Version history</h3>
        <button type="button" onClick={onClose} aria-label="Close version history" className={btnIcon}>
          <X size={16} />
        </button>
      </div>

      <div className="p-6 space-y-5">
        {onExport && (
          <div className="flex flex-wrap items-center justify-between gap-2 border border-line rounded-card p-3">
            <p className="text-xs text-ink-muted">Export saves the current version as a PDF or Word file. To export an older one, restore it first.</p>
            <button type="button" className={btnSecondary} onClick={onExport}>
              Export current version
            </button>
          </div>
        )}
        {error && (
          <p role="alert" className="text-xs font-semibold text-danger-600">
            {error}{' '}
            <button type="button" className="underline min-h-11 px-2" onClick={() => void load()}>
              Retry
            </button>
          </p>
        )}
        {!versions && !error && <div className="h-24 bg-surface-muted rounded-card animate-pulse" />}

        {versions && (
          <ul className="divide-y divide-line border border-line rounded-card">
            {versions.map((v) => (
              <li key={v.version}>
                <button
                  type="button"
                  onClick={() => void open(v)}
                  aria-current={selected?.version === v.version}
                  className={`w-full text-left min-h-11 px-3 py-2 hover:bg-surface-muted transition-colors ${
                    selected?.version === v.version ? 'bg-brand-tint' : ''
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-semibold text-ink">
                    Version {v.version}
                    {v.is_current && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-brand-tint text-brand-strong">Current</span>
                    )}
                    {loadingVersion === v.version && <span className="text-ink-subtle font-normal">Loading…</span>}
                  </span>
                  <span className="block text-[11px] text-ink-subtle">
                    {v.author ? personName(v.author) : 'Cofoundaz AI'} · {formatDate(v.created_at)}
                    {v.note ? ` · ${v.note}` : ''}
                  </span>
                  <span className="block text-[11px] text-ink-muted truncate">{v.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {selected && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex border border-line rounded-card overflow-hidden" role="group" aria-label="View mode">
                {(['preview', 'changes'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={mode === m}
                    onClick={() => setMode(m)}
                    className={`min-h-11 px-4 text-xs font-semibold ${
                      mode === m ? 'bg-brand-strong text-white' : 'bg-white text-ink-muted hover:bg-surface-muted'
                    }`}
                  >
                    {m === 'preview' ? 'Preview' : 'Changes vs current'}
                  </button>
                ))}
              </div>
              {canRestore && selected.version !== current && (
                <button type="button" className={btnPrimary} onClick={() => setConfirm(true)}>
                  Restore this version
                </button>
              )}
            </div>

            {mode === 'preview' ? (
              <div className="space-y-4 border border-line rounded-card p-4">
                <h4 className="font-display text-lg text-ink">{selected.title}</h4>
                {selected.sections.length === 0 && <p className="text-xs text-ink-subtle">This version has no sections.</p>}
                {selected.sections.map((s, i) => (
                  <div key={s.id ?? i}>
                    <p className="text-xs font-bold text-ink uppercase tracking-wide">{s.heading}</p>
                    <p className="text-sm text-ink-muted whitespace-pre-wrap">{s.body}</p>
                  </div>
                ))}
              </div>
            ) : selected.version === current ? (
              <p className="text-xs text-ink-subtle">This is the current version, so there is nothing to compare.</p>
            ) : (
              <div className="border border-line rounded-card p-3 text-[12px] leading-relaxed overflow-x-auto" aria-label="Changes from this version to the current text">
                {diffLines(sectionsForDiff(selected.sections), sectionsForDiff(currentSections)).map((l, i) => (
                  <div
                    key={i}
                    className={
                      l.kind === 'add'
                        ? 'bg-brand-tint text-brand-strong'
                        : l.kind === 'remove'
                          ? 'bg-danger-tint text-danger-bold line-through'
                          : 'text-ink-muted'
                    }
                  >
                    {l.kind === 'add' ? '+ ' : l.kind === 'remove' ? '- ' : '  '}
                    {l.text || ' '}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

    </ModalDialog>
    {confirm && selected && (
      <ConfirmDialog
        title={`Restore version ${selected.version}?`}
        body="This makes that version the current one by saving it as a new version. Your later versions stay in the history, so nothing is lost."
        confirmLabel="Restore"
        onConfirm={doRestore}
        onClose={() => setConfirm(false)}
      />
    )}
    </>
  );
}
