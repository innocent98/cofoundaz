'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Download, Link2, Loader2 } from 'lucide-react';
import { apiErrorInfo } from '@/lib/api/api-error';
import { copySignerLink, executedLink, type SignatureRequest, type Signer } from '@/lib/api/signatures';
import { copyText } from '@/lib/clipboard';
import { REQUEST_STATUS_LABEL, executedUi, formatDateTime, linkAuditLine, signerState } from '@/lib/documents-sign';
import { formatSize } from '@/lib/documents-format';
import { useToast } from '@/app/(dashboard)/documents/ToastContext';
import { ConfirmDialog, btnPrimary } from './ui';

const STATUS_STYLE: Record<string, string> = {
  awaiting: 'bg-warning-100 text-warning-800',
  complete: 'bg-success-100 text-success-800',
  cancelled: 'bg-neutral-xeceeef text-neutral-x55625a',
  expired: 'bg-danger-tint text-danger-bold',
};
const SIGNER_STYLE: Record<string, string> = {
  success: 'bg-success-100 text-success-800',
  info: 'bg-info-50 text-info-700',
  warning: 'bg-warning-100 text-warning-800',
  muted: 'bg-surface-muted text-ink-muted',
};

const POLL_MS = 3000;
const POLL_LIMIT_MS = 60_000;

/** Copy-link errors from the guide, with the API's own words when it sends them. */
function copyError(err: unknown): string {
  const info = apiErrorInfo(err, 'Could not copy the link.');
  if (info.code === 'LINK_NOT_RECOVERABLE') return 'This signer’s link was made before links could be copied. Send a reminder to give them a new link, then copy that one.';
  return info.message;
}

export function RequestCard({
  req,
  onRemind,
  onCancel,
  onRefresh,
}: {
  req: SignatureRequest;
  onRemind: (r: SignatureRequest) => void;
  onCancel: (r: SignatureRequest) => void;
  onRefresh: () => Promise<void>;
}) {
  const { triggerToast } = useToast();
  const [open, setOpen] = useState(false);
  const [copyFor, setCopyFor] = useState<Signer | null>(null);
  const [slow, setSlow] = useState(false);
  const [downloading, setDownloading] = useState(false);
  // Time is read once per render of this card, on mount: a request completed long ago never shows a spinner.
  const [mountedAt] = useState(() => Date.now());
  const exec = executedUi(req.executed, req.completed_at, mountedAt);
  const refresh = useRef(onRefresh);
  useEffect(() => {
    refresh.current = onRefresh;
  });

  // After the last signature the executed PDF is built by the worker in a few seconds: poll, then give up politely.
  const preparing = exec.kind === 'preparing';
  useEffect(() => {
    if (!preparing) return;
    const started = Date.now();
    const t = setInterval(() => {
      if (Date.now() - started > POLL_LIMIT_MS) {
        clearInterval(t);
        setSlow(true);
        return;
      }
      void refresh.current();
    }, POLL_MS);
    return () => clearInterval(t);
  }, [preparing]);

  const download = async () => {
    setDownloading(true);
    try {
      const { url } = await executedLink(req.id);
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      const info = apiErrorInfo(err, 'Could not download the executed copy.');
      triggerToast(info.code === 'EXECUTED_NOT_READY' ? 'The executed copy is not ready yet. Try again in a moment.' : info.message, 'error');
      void refresh.current();
    } finally {
      setDownloading(false);
    }
  };

  const doCopy = async () => {
    if (!copyFor) return;
    const who = copyFor.name || copyFor.email;
    try {
      const link = await copySignerLink(req.id, copyFor.id);
      // The copy is recorded by the API call itself, so say so even when the browser blocks the clipboard.
      if (await copyText(link)) triggerToast(`Link for ${who} copied. The copy is recorded.`);
      else window.prompt(`Copy the link for ${who}. The copy is recorded.`, link);
    } catch (err) {
      triggerToast(copyError(err), 'error');
    }
    setCopyFor(null);
    void refresh.current();
  };

  const label = REQUEST_STATUS_LABEL[req.status] ?? req.status;
  const unsigned = req.signers.filter((s) => s.status !== 'signed').length;

  return (
    <div className="bg-white border border-line rounded-modal p-6 shadow-card space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-3.5 min-w-0">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-info-xeff6ff text-info-x1d4ed8 shrink-0">PDF</span>
          <div className="min-w-0">
            <h3 className="font-semibold text-xs text-ink break-words">{req.title}</h3>
            <p className="text-xs text-ink-subtle mt-0.5 break-words">
              {req.filename} • {req.signed_count} of {req.total} signed{req.sequential ? ' • in order' : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLE[req.status] ?? 'bg-surface-muted text-ink-muted'}`}>{label}</span>
          {req.status === 'awaiting' && (
            <>
              <button type="button" onClick={() => onRemind(req)} className="min-h-11 px-2 text-xs font-semibold text-brand-strong hover:text-accent-bronze transition-colors">
                Remind
              </button>
              <button type="button" onClick={() => onCancel(req)} className="min-h-11 px-2 text-xs font-semibold text-danger-bold hover:opacity-80 transition-opacity">
                Cancel
              </button>
            </>
          )}
          <button
            type="button"
            aria-expanded={open}
            aria-label={`${open ? 'Hide' : 'Show'} details for ${req.title}`}
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1 min-h-11 px-2 text-xs font-semibold text-ink-muted hover:text-ink"
          >
            Details {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      <p className="text-[11px] text-ink-subtle">
        Sent {formatDateTime(req.sent_at ?? req.created_at)}
        {req.expires_at ? ` • ${req.status === 'expired' ? 'Expired' : 'Expires'} ${formatDateTime(req.expires_at)}` : ' • Never expires'}
        {req.completed_at ? ` • Completed ${formatDateTime(req.completed_at)}` : ''}
      </p>

      <ul className="border-t border-line pt-3 space-y-2" aria-label={`Signers for ${req.title}`}>
        {req.signers.map((s, i) => {
          const st = signerState(s, i > 0 ? req.signers[i - 1] : null, req.status);
          const canCopy = req.status === 'awaiting' && (s.status === 'pending' || s.status === 'viewed');
          return (
            <li key={s.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
              <span className="font-semibold text-ink break-all">
                {req.sequential ? `${i + 1}. ` : ''}
                {s.name || s.email}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${SIGNER_STYLE[st.tone]}`}>{st.label}</span>
              <span className="text-ink-subtle">{st.detail}</span>
              {canCopy && (
                <button type="button" aria-label={`Copy signing link for ${s.name || s.email}`} onClick={() => setCopyFor(s)} className="inline-flex items-center gap-1 min-h-11 px-2 font-semibold text-brand-strong hover:text-accent-bronze">
                  <Link2 size={13} /> Copy link
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {open && (
        <div className="border-t border-line pt-4 space-y-4">
          {req.message && (
            <div>
              <p className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">Message to signers</p>
              <p className="text-xs text-ink whitespace-pre-wrap mt-1">{req.message}</p>
            </div>
          )}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-ink-subtle uppercase tracking-wider">Audit</p>
            {req.signers.map((s) => (
              <div key={s.id} className="text-[11px] text-ink-muted space-y-0.5">
                <p className="font-semibold text-ink break-all">
                  {s.name || s.email} <span className="font-normal text-ink-subtle">{s.name ? s.email : ''}</span>
                </p>
                {s.viewed_at && <p>Opened {formatDateTime(s.viewed_at)}</p>}
                {s.status === 'signed' && (
                  <p className="break-words">
                    Signed as “{s.signed_name}” {formatDateTime(s.signed_at)}
                    {s.signed_ip ? ` from ${s.signed_ip}` : ''}
                    {s.signed_user_agent ? `, ${s.signed_user_agent}` : ''}
                  </p>
                )}
                {s.link_copies.map((c, k) => (
                  <p key={k} className="text-ink-subtle">{linkAuditLine(c)}</p>
                ))}
                {s.link_copies.length === 0 && s.status !== 'waiting' && <p className="text-ink-subtle">No link has been copied out of Cofoundaz.</p>}
              </div>
            ))}
          </div>
          {req.document_hash && (
            <p className="text-[11px] text-ink-subtle break-all">
              SHA-256 of the PDF that was sent: <span className="font-semibold">{req.document_hash}</span>
            </p>
          )}
          <p className="text-[11px] text-ink-subtle">{req.legal_caveat}</p>
        </div>
      )}

      {req.status === 'complete' && (
        <div className="border-t border-line pt-4">
          {exec.kind === 'ready' && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-ink break-words">{exec.filename}</p>
                <p className="text-[11px] text-ink-subtle">Executed copy with the signature page and audit certificate • {formatSize(exec.sizeBytes)}. Also saved in your Library.</p>
              </div>
              <button type="button" className={btnPrimary} disabled={downloading} onClick={() => void download()}>
                <Download size={13} /> {downloading ? 'Opening…' : 'Download executed PDF'}
              </button>
            </div>
          )}
          {exec.kind === 'preparing' && !slow && (
            <p role="status" className="flex items-start gap-2 text-xs text-ink-muted">
              <Loader2 className="w-4 h-4 shrink-0 animate-spin" aria-hidden />
              Signed. Preparing the executed copy…
            </p>
          )}
          {((exec.kind === 'preparing' && slow) || exec.kind === 'delayed') && (
            <div role="status" className="flex flex-wrap items-center gap-3 text-xs text-ink-muted">
              <p className="flex items-start gap-2 min-w-0 flex-1">
                <Clock className="w-4 h-4 shrink-0" aria-hidden />
                The executed copy is taking longer than usual. Check back later.
              </p>
              <button type="button" className="min-h-11 px-3 text-xs font-semibold text-brand-strong hover:text-accent-bronze" onClick={() => void refresh.current()}>
                Check again
              </button>
            </div>
          )}
          {exec.kind === 'failed' && (
            <p role="status" className="flex items-start gap-2 text-xs text-ink-muted">
              <Clock className="w-4 h-4 shrink-0" aria-hidden />
              The executed copy could not be made. The signatures above are still on record; ask the sender to contact support if you need the signed PDF.
            </p>
          )}
          {exec.kind === 'legacy' && (
            <p className="text-xs text-ink-subtle">
              No executed copy exists for this request: it was completed before executed copies were added, so only the signatures above are on record.
            </p>
          )}
        </div>
      )}

      {req.status === 'awaiting' && unsigned > 0 && req.sequential && (
        <p className="text-[11px] text-ink-subtle">Remind replaces the link of each signer whose turn has come. The old link stops working.</p>
      )}

      {copyFor && (
        <ConfirmDialog
          title="Copy signing link?"
          body={
            <>
              Anyone with this link can sign as <span className="font-semibold">{copyFor.name || copyFor.email}</span>. The copy is recorded with your name and shown in the audit and on the certificate.
            </>
          }
          confirmLabel="Copy link"
          onConfirm={doCopy}
          onClose={() => setCopyFor(null)}
        />
      )}
    </div>
  );
}

