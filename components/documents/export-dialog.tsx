'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Download, FileText, Loader2 } from 'lucide-react';
import { apiErrorInfo } from '@/lib/api/api-error';
import {
  exportDocument,
  fileDownloadLink,
  getDocument,
  listExports,
  type DocFull,
  type ExportFormat,
  type FileSummary,
} from '@/lib/api/documents';
import { findBracketGaps } from '@/lib/documents-ai';
import { formatDate, formatSize, mimeLabel, sectionsToText } from '@/lib/documents-format';
import { Dialog, btnPrimary, btnSecondary } from './ui';

const FORMATS: { id: ExportFormat; label: string; hint: string }[] = [
  { id: 'pdf', label: 'PDF', hint: 'Best to send, share or sign.' },
  { id: 'docx', label: 'Word (DOCX)', hint: 'Best to keep editing. Keeps every character.' },
];

function ScanChip({ status }: { status: string }) {
  if (status === 'clean') return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-success-100 text-success-800">Scan clean</span>;
  if (status === 'blocked') return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-danger-tint text-danger-bold">Blocked by scan</span>;
  return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-warning-100 text-warning-800">Scanning</span>;
}

/** Messages for the export errors in the guide (section 6); the API's own copy is used when it sends one. */
function exportError(err: unknown): string {
  const info = apiErrorInfo(err, 'Could not export this document.');
  if (info.status === 429) return 'You have exported a lot in a short time. Wait a minute and try again.';
  if (info.status === 403) return 'Only a founder or team member can export documents.';
  if (info.status === 404) return 'This document is in the Trash or no longer exists, so it can’t be exported. Restore it first.';
  return info.message;
}

/**
 * Export a document as PDF or DOCX. The export is a stored, scanned file in the library; downloading it
 * uses the normal 5-minute signed link. Export always uses the document's current saved version.
 */
export function ExportDialog({
  documentId,
  dirty,
  onClose,
  onExported,
}: {
  documentId: string;
  /** The editor has unsaved edits: the export would not include them. */
  dirty?: boolean;
  onClose: () => void;
  onExported?: () => void;
}) {
  const [doc, setDoc] = useState<DocFull | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ file: FileSummary; existing: boolean } | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [earlier, setEarlier] = useState<FileSummary[]>([]);

  const loadEarlier = useCallback(async () => {
    try {
      setEarlier(await listExports(documentId));
    } catch {
      setEarlier([]);
    }
  }, [documentId]);

  useEffect(() => {
    void (async () => {
      try {
        setDoc(await getDocument(documentId));
      } catch (err) {
        setLoadError(exportError(err));
      }
      await loadEarlier();
    })();
  }, [documentId, loadEarlier]);

  // A fresh upload-style scan can still be pending: re-read the file until it settles.
  const scanStatus = done?.file.scan_status;
  const doneId = done?.file.id;
  useEffect(() => {
    if (!doneId || scanStatus !== 'pending') return;
    const t = setInterval(() => {
      void (async () => {
        const files = await listExports(documentId).catch(() => []);
        const f = files.find((x) => x.id === doneId);
        if (f && f.scan_status !== 'pending') setDone((d) => (d && d.file.id === doneId ? { ...d, file: f } : d));
      })();
    }, 3000);
    return () => clearInterval(t);
  }, [doneId, scanStatus, documentId]);

  const gaps = doc ? findBracketGaps(sectionsToText(doc.sections, 200_000)) : [];

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await exportDocument(documentId, format);
      setDone(res);
      onExported?.();
      await loadEarlier();
    } catch (err) {
      setError(exportError(err));
    } finally {
      setBusy(false);
    }
  };

  const download = async (file: FileSummary) => {
    setDownloading(true);
    setError(null);
    try {
      const { url } = await fileDownloadLink(file.id);
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      const info = apiErrorInfo(err, 'Could not download this file.');
      setError(info.code === 'FILE_NOT_CLEAN' ? 'The security scan blocked this file, so it can’t be downloaded.' : info.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog label="Export document" onClose={onClose} wide>
      <div className="p-6 space-y-5">
        {loadError && (
          <p role="alert" className="text-xs font-semibold text-danger-600">
            {loadError}
          </p>
        )}
        {!doc && !loadError && <div className="h-16 bg-surface-muted rounded-card animate-pulse" />}

        {doc && !done && (
          <>
            <div className="text-sm text-ink-muted leading-relaxed">
              <p className="font-semibold text-ink truncate">{doc.title}</p>
              <p>
                Exports the saved version, <span className="font-semibold">version {doc.version}</span>. The file is added to your library and scanned like an upload.
              </p>
            </div>

            {dirty && (
              <p role="status" className="text-xs text-warning-800 bg-warning-50 border border-warning-100 rounded-card p-3">
                You have unsaved changes. Save first, or the export will not include them.
              </p>
            )}
            {gaps.length > 0 && (
              <div role="status" className="text-xs text-warning-800 bg-warning-50 border border-warning-100 rounded-card p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
                <p>
                  This document still has empty gaps in square brackets: {gaps.slice(0, 5).map((g) => `[${g}]`).join(', ')}
                  {gaps.length > 5 ? ` and ${gaps.length - 5} more` : ''}. Fill them in before you send or sign it.
                </p>
              </div>
            )}

            <fieldset className="space-y-2">
              <legend className="text-xs font-bold text-neutral-600 uppercase tracking-wider mb-1">Format</legend>
              {FORMATS.map((f) => (
                <label key={f.id} className={`flex items-start gap-3 min-h-11 border rounded-card p-3 cursor-pointer ${format === f.id ? 'border-brand-strong bg-brand-tint' : 'border-line'}`}>
                  <input type="radio" name="export-format" checked={format === f.id} onChange={() => setFormat(f.id)} className="mt-1" />
                  <span>
                    <span className="block text-sm font-semibold text-ink">{f.label}</span>
                    <span className="block text-xs text-ink-subtle">{f.hint}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            {format === 'pdf' && (
              <p className="text-[11px] text-ink-subtle">
                The PDF uses a standard Latin font, so letters outside it, such as dot-below vowels or non-Latin scripts, lose their marks in the PDF. The Word file keeps them.
              </p>
            )}
            {doc.disclaimer && <p className="text-[11px] text-ink-subtle">The legal notice is printed on the export.</p>}

            {error && (
              <p role="alert" className="text-xs font-semibold text-danger-600">
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <button type="button" className={`${btnSecondary} flex-1`} onClick={onClose}>
                Cancel
              </button>
              <button type="button" className={`${btnPrimary} flex-1`} disabled={busy} onClick={() => void run()}>
                {busy ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Exporting…
                  </>
                ) : (
                  `Export as ${format === 'pdf' ? 'PDF' : 'DOCX'}`
                )}
              </button>
            </div>
          </>
        )}

        {done && (
          <div className="space-y-4">
            <p role="status" className="text-sm font-semibold text-ink">
              {done.existing ? 'Already exported. Nothing has changed since, so this is the same file.' : 'Exported.'}
            </p>
            <div className="border border-line rounded-card p-4 flex flex-wrap items-center gap-3">
              <FileText className="w-5 h-5 text-brand-strong shrink-0" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink truncate">{done.file.filename}</p>
                <p className="text-[11px] text-ink-subtle">
                  {formatSize(done.file.size_bytes)} · version {done.file.source_version ?? '?'}
                </p>
              </div>
              <ScanChip status={done.file.scan_status} />
            </div>
            {done.file.scan_status === 'pending' && <p className="text-xs text-ink-subtle">The file is being scanned. Download turns on when the scan is clean.</p>}
            {done.file.scan_status === 'blocked' && <p className="text-xs text-danger-600">The security scan blocked this file, so it can’t be downloaded.</p>}
            {error && (
              <p role="alert" className="text-xs font-semibold text-danger-600">
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <button type="button" className={`${btnSecondary} flex-1`} onClick={() => setDone(null)}>
                Export another format
              </button>
              <button type="button" className={`${btnPrimary} flex-1`} disabled={downloading || done.file.scan_status !== 'clean'} onClick={() => void download(done.file)}>
                <Download className="w-3.5 h-3.5" /> {downloading ? 'Opening…' : 'Download'}
              </button>
            </div>
            {done.file.mime === 'application/pdf' ? (
              done.file.scan_status === 'clean' && (
                <Link href={`/documents/signatures?file=${encodeURIComponent(done.file.id)}`} className="inline-flex items-center min-h-11 text-xs font-semibold text-brand-strong hover:text-accent-bronze">
                  Send this PDF for signature →
                </Link>
              )
            ) : (
              <p className="text-[11px] text-ink-subtle">Word files can’t be signed. To get this document signed, export it as PDF and send that.</p>
            )}
          </div>
        )}

        {earlier.filter((f) => f.id !== done?.file.id).length > 0 && (
          <div className="space-y-2 border-t border-line pt-4">
            <p className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Earlier exports</p>
            <ul className="divide-y divide-line border border-line rounded-card">
              {earlier.filter((f) => f.id !== done?.file.id).map((f) => (
                <li key={f.id} className="flex items-center gap-2 px-3 py-1">
                  <div className="min-w-0 flex-1 py-1">
                    <p className="text-xs font-semibold text-ink break-words">{f.filename}</p>
                    <p className="text-[11px] text-ink-subtle">
                      {mimeLabel(f.mime || f.content_type)} · Version {f.source_version ?? '?'} · {formatDate(f.uploaded_at)} · {formatSize(f.size_bytes)}
                    </p>
                  </div>
                  <ScanChip status={f.scan_status} />
                  <button
                    type="button"
                    aria-label={`Download ${f.filename}, version ${f.source_version ?? ''}`}
                    disabled={f.scan_status !== 'clean'}
                    onClick={() => void download(f)}
                    className="inline-flex items-center justify-center min-h-11 min-w-11 rounded-input text-ink-muted hover:text-ink hover:bg-surface-muted disabled:opacity-40"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-ink-subtle">To export an older version, restore it from Version history first, then export.</p>
          </div>
        )}
      </div>
    </Dialog>
  );
}
