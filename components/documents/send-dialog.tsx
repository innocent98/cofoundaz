'use client';

import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Copy, Trash2 } from 'lucide-react';
import type { FileSummary } from '@/lib/api/documents';
import type { SignatureRequest } from '@/lib/api/signatures';
import { copyText } from '@/lib/clipboard';
import { DEFAULT_SEND_EXPIRY, SEND_EXPIRY_CHOICES, signability } from '@/lib/documents-sign';
import { useSignatureRequests } from '@/hooks/useSignatureRequests';
import { useToast } from '@/app/(dashboard)/documents/ToastContext';
import { Dialog, btnIcon, btnPrimary, btnSecondary, inputCls, labelCls } from './ui';

const MAX_SIGNERS = 20;
const MAX_MESSAGE = 2000;

/** Send a PDF for signature: signers, signing order, a message and an expiry (BE-D). */
export function SendDialog({
  files,
  initialFileId,
  createRequest,
  onClose,
}: {
  files: FileSummary[];
  initialFileId?: string;
  createRequest: ReturnType<typeof useSignatureRequests>['createRequest'];
  onClose: () => void;
}) {
  const { triggerToast } = useToast();
  const clean = useMemo(() => files.filter((f) => f.scan_status === 'clean' && !f.trashed_at), [files]);
  const firstSignable = clean.find((f) => signability(f) === 'ok');
  // The list can arrive after the dialog opens (deep link from the Library), so derive the default instead of copying it once.
  const [picked, setPicked] = useState<string | null>(null);
  const wanted = clean.find((f) => f.id === initialFileId);
  const fileId = picked ?? (wanted && signability(wanted) === 'ok' ? wanted.id : (firstSignable?.id ?? ''));
  const setFileId = setPicked;
  const [title, setTitle] = useState('');
  const [signers, setSigners] = useState<{ email: string; name: string }[]>([{ email: '', name: '' }]);
  const [sequential, setSequential] = useState(false);
  const [message, setMessage] = useState('');
  const [expiry, setExpiry] = useState(DEFAULT_SEND_EXPIRY);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState<SignatureRequest | null>(null);

  const chosen = clean.find((f) => f.id === fileId);
  const update = (i: number, key: 'email' | 'name', value: string) =>
    setSigners((prev) => prev.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)));
  const move = (i: number, dir: -1 | 1) =>
    setSigners((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    if (!chosen) {
      setError('Pick a PDF to send for signature.');
      return;
    }
    const list = signers.filter((s) => s.email.trim()).map((s) => ({ email: s.email.trim(), name: s.name.trim() || undefined }));
    if (list.length === 0) {
      setError('Add at least one signer.');
      return;
    }
    const choice = SEND_EXPIRY_CHOICES.find((c) => c.id === expiry);
    const days = choice ? choice.days : 14; // null means never expires
    setSending(true);
    const res = await createRequest(chosen.id, {
      signers: list,
      title: title.trim() || undefined,
      expires_in_days: days,
      sequential,
      message: message.trim() || undefined,
    });
    setSending(false);
    if (res.ok) {
      setSent(res.request);
      triggerToast('Signature request sent.');
    } else {
      // Field errors come back as signers.N.email or expires_in_days: show them on the row they belong to.
      const map: Record<string, string> = {};
      for (const f of res.fieldErrors) map[f.field] = f.message.replace(/^Value error, /, '');
      setFieldErrors(map);
      setError(res.fieldErrors.length > 0 ? 'Please check the highlighted fields.' : res.error);
    }
  };

  if (sent) {
    const links = sent.signer_links ?? [];
    return (
      <Dialog label="Signature request sent" onClose={onClose} wide>
        <div className="p-6 space-y-4">
          <p className="text-sm text-ink font-semibold">{sent.title}</p>
          <p className="text-xs text-ink-subtle">
            {sent.sequential
              ? 'Signers sign in the order below. Each one is emailed when it is their turn.'
              : 'Every signer was emailed their link.'}{' '}
            Anyone who has a signer&apos;s link can sign as them, so copy a link only when you must. Copies are recorded.
          </p>
          <ul className="space-y-2">
            {sent.signers.map((s, i) => {
              const link = links[i];
              return (
                <li key={s.id} className="space-y-1">
                  <p className="text-xs font-semibold text-ink">
                    {sent.sequential ? `${i + 1}. ` : ''}
                    {s.name || s.email} <span className="font-normal text-ink-subtle">{s.name ? s.email : ''}</span>
                  </p>
                  {link ? (
                    <div className="flex items-center gap-2">
                      <input readOnly aria-label={`Signer link ${i + 1}`} value={link} className={`${inputCls} bg-surface-faint truncate text-xs`} />
                      <button
                        type="button"
                        className={`${btnPrimary} shrink-0`}
                        onClick={() => {
                          void copyText(link).then((ok) => triggerToast(ok ? 'Link copied.' : 'Your browser blocked copying. Select the link and copy it by hand.', ok ? undefined : 'error'));
                        }}
                      >
                        <Copy size={13} /> Copy
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-ink-subtle">Waits for {sent.signers[i - 1]?.name || sent.signers[i - 1]?.email || 'the signer before'} to sign. Their link is emailed then.</p>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className={btnSecondary}>
              Done
            </button>
          </div>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog label="Send for signature" onClose={onClose} wide>
      <form onSubmit={submit} className="p-6 space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="sig-file" className={labelCls}>
            File
          </label>
          {!firstSignable ? (
            <p className="text-xs text-danger-bold">
              There is no PDF to sign yet. Upload a PDF in the Library, or open a document and choose Export as PDF. Word files must be exported to PDF first.
            </p>
          ) : (
            <select id="sig-file" value={fileId} onChange={(e) => setFileId(e.target.value)} className={inputCls}>
              {clean.map((f) => {
                const ok = signability(f) === 'ok';
                return (
                  <option key={f.id} value={f.id} disabled={!ok}>
                    {f.filename}
                    {ok ? '' : ' (export to PDF first)'}
                  </option>
                );
              })}
            </select>
          )}
          <p className="text-[11px] text-ink-subtle">Only PDFs can be signed. Files still being scanned are not listed.</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="sig-title" className={labelCls}>
            Title (optional)
          </label>
          <input id="sig-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Defaults to the file name" className={inputCls} />
        </div>

        <div className="space-y-2">
          <span className={labelCls}>Signers</span>
          {signers.map((s, i) => (
            <div key={i} className="flex flex-wrap md:flex-nowrap items-center gap-1.5">
              {sequential && <span className="w-5 text-center text-xs font-bold text-ink-subtle shrink-0">{i + 1}</span>}
              <input type="email" required={i === 0} aria-label={`Signer ${i + 1} email`} value={s.email} onChange={(e) => update(i, 'email', e.target.value)} placeholder="email@company.com" className={`${inputCls} flex-1 basis-40 min-w-0 text-xs`} />
              <input aria-label={`Signer ${i + 1} name`} value={s.name} onChange={(e) => update(i, 'name', e.target.value)} placeholder="Name" className={`${inputCls} basis-full md:basis-auto order-last md:order-none w-full md:w-28 text-xs`} />
              {sequential && signers.length > 1 && (
                <>
                  <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className={`${btnIcon} shrink-0`} aria-label={`Move signer ${i + 1} up`}>
                    <ArrowUp size={14} />
                  </button>
                  <button type="button" disabled={i === signers.length - 1} onClick={() => move(i, 1)} className={`${btnIcon} shrink-0`} aria-label={`Move signer ${i + 1} down`}>
                    <ArrowDown size={14} />
                  </button>
                </>
              )}
              <button type="button" onClick={() => setSigners((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))} className={`${btnIcon} shrink-0`} aria-label={`Remove signer ${i + 1}`}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {signers.map((_, i) =>
            fieldErrors[`signers.${i}.email`] ? (
              <p key={`e${i}`} role="alert" className="text-xs font-semibold text-danger-600">
                Signer {i + 1}: {fieldErrors[`signers.${i}.email`]}
              </p>
            ) : null,
          )}
          <button type="button" disabled={signers.length >= MAX_SIGNERS} onClick={() => setSigners((prev) => [...prev, { email: '', name: '' }])} className="min-h-11 text-xs font-semibold text-brand-strong hover:text-accent-bronze transition-colors disabled:opacity-50">
            + Add signer
          </button>
        </div>

        <label className="flex items-start gap-2 min-h-11 text-xs text-ink font-medium cursor-pointer">
          <input type="checkbox" checked={sequential} onChange={(e) => setSequential(e.target.checked)} className="w-4 h-4 mt-0.5" />
          <span>
            Signers sign one after another
            <span className="block text-[11px] font-normal text-ink-subtle">
              {sequential ? 'Only the first signer gets a link now. The next one is emailed when the one before signs.' : 'Everyone gets their link now and can sign in any order.'}
            </span>
          </span>
        </label>

        <div className="space-y-1.5">
          <label htmlFor="sig-message" className={labelCls}>
            Message to the signers (optional)
          </label>
          <textarea
            id="sig-message"
            rows={3}
            maxLength={MAX_MESSAGE}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`If you leave this empty we send: “${'Your name'} has sent you ${chosen?.filename ?? 'the file'} to sign via Cofoundaz.”`}
            className={`${inputCls} resize-y`}
          />
          <p className="text-[11px] text-ink-subtle">{message.length} of {MAX_MESSAGE}. Shown to signers on the sign page and in the email, as plain text.</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="sig-expiry" className={labelCls}>
            Link expires after
          </label>
          <select id="sig-expiry" value={expiry} onChange={(e) => setExpiry(e.target.value)} className={inputCls}>
            {SEND_EXPIRY_CHOICES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <p className="text-[11px] text-ink-subtle">
          These are simple electronic signatures: each signer types their name and agrees it counts as their signature. They are not certificate-based and are not legal advice on enforceability. Signatures are added on a page at the end of the PDF; you cannot place them on a particular page.
        </p>

        {error && (
          <p role="alert" className="text-xs font-semibold text-danger-600">
            {error}
          </p>
        )}
        <div className="pt-1 flex gap-3">
          <button type="button" onClick={onClose} className={`${btnSecondary} flex-1`}>
            Cancel
          </button>
          <button type="submit" disabled={sending || !firstSignable} className={`${btnPrimary} flex-1`}>
            {sending ? 'Sending…' : 'Send request'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
