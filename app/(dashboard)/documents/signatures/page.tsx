'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Copy } from 'lucide-react';
import { useSignatureRequests } from '@/hooks/useSignatureRequests';
import { Dialog, btnPrimary, btnSecondary, btnIcon, inputCls, labelCls } from '@/components/documents/ui';
import { listFiles, type FileSummary } from '@/lib/api/documents';
import { useToast } from '../ToastContext';

export default function SignaturesPage() {
  const { requests, loading, error: loadError, refetch, createRequest, cancelRequest, remindRequest } = useSignatureRequests();
  // Only files that passed the scan can be sent for signature.
  const [files, setFiles] = useState<{ id: string; title: string }[]>([]);
  useEffect(() => {
    void (async () => {
      try {
        const all: FileSummary[] = await listFiles();
        setFiles(all.filter((f) => f.scan_status === 'clean').map((f) => ({ id: f.id, title: f.filename })));
      } catch {
        setFiles([]);
      }
    })();
  }, []);
  const { triggerToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileId, setFileId] = useState('');
  const [title, setTitle] = useState('');
  const [signers, setSigners] = useState<{ email: string; name: string }[]>([{ email: '', name: '' }]);
  const [sending, setSending] = useState(false);
  const [signerLinks, setSignerLinks] = useState<string[] | null>(null);

  const openModal = () => {
    setFileId(files[0]?.id ?? '');
    setTitle('');
    setSigners([{ email: '', name: '' }]);
    setSignerLinks(null);
    setIsModalOpen(true);
  };

  const updateSigner = (i: number, field: 'email' | 'name', value: string) =>
    setSigners((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  const addSigner = () => setSigners((prev) => [...prev, { email: '', name: '' }]);
  const removeSigner = (i: number) => setSigners((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileId) {
      triggerToast('Pick a file to send for signature.', 'error');
      return;
    }
    const cleanSigners = signers.filter((s) => s.email.trim()).map((s) => ({ email: s.email.trim(), name: s.name.trim() || undefined }));
    if (cleanSigners.length === 0) {
      triggerToast('Add at least one signer.', 'error');
      return;
    }
    setSending(true);
    const res = await createRequest(fileId, cleanSigners, title.trim() || undefined);
    setSending(false);
    if (res.ok) {
      setSignerLinks(res.signerLinks ?? []);
      triggerToast('Signature request sent.');
    } else {
      triggerToast(res.error || 'Could not send for signature.', 'error');
    }
  };

  const handleCancel = async (id: string, reqTitle: string) => {
    const res = await cancelRequest(id);
    if (res.ok) triggerToast(`Cancelled “${reqTitle}”.`);
    else triggerToast(res.error || 'Could not cancel the request.', 'error');
  };

  const handleRemind = async (id: string) => {
    const res = await remindRequest(id);
    if (res.ok) triggerToast('Reminder sent to unsigned signers.');
    else triggerToast(res.error || 'Could not send the reminder.', 'error');
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'Awaiting':
        return 'bg-accent-xf2ece1 text-accent-x7a6025';
      case 'Complete':
        return 'bg-neutral-xe5efea text-brand-x1e3e2b';
      case 'Cancelled':
        return 'bg-neutral-xeceeef text-neutral-x55625a';
      case 'Expired':
        return 'bg-danger-tint text-danger-bold';
      default:
        return 'bg-surface-muted text-ink-muted';
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-ink-strong tracking-tight mb-1">E-signature requests</h1>
          <p className="text-xs text-neutral-x738279">Track pending and completed document signatures.</p>
        </div>
        <button type="button" onClick={openModal} className={`${btnPrimary} shrink-0 self-start`}>
          <Plus size={14} />
          <span>New request</span>
        </button>
      </div>

      {/* Legal caveat — surface, don't bury (guide §11) */}
      <p className="text-[11px] text-ink-subtle -mt-4">
        These signatures record intent and a timestamped audit trail; they are not a substitute for
        legal advice on enforceability in your jurisdiction.
      </p>

      {loadError && (
        <div role="alert" className="bg-danger-tint border border-danger-xfad7d7 rounded-card p-4 text-sm text-danger-600 flex flex-wrap items-center justify-between gap-3">
          <span>Could not load signature requests.</span>
          <button type="button" className={btnSecondary} onClick={() => void refetch()}>Try again</button>
        </div>
      )}

      {!loading && !loadError && requests.length === 0 && (
        <div className="bg-white border border-line rounded-modal shadow-card p-12 text-center">
          <p className="text-sm font-semibold text-ink">No signature requests yet</p>
          <p className="text-xs text-ink-subtle mt-1">Send a file to collaborators to collect signatures.</p>
          <button type="button" onClick={openModal} className={`${btnPrimary} mt-4`}>
            New request
          </button>
        </div>
      )}

      <div className="space-y-4">
        {requests.map((req) => (
          <div key={req.id} className="bg-white border border-line rounded-modal p-6 shadow-card space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center space-x-3.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-info-xeff6ff text-info-x1d4ed8">FILE</span>
                <div>
                  <h3 className="font-semibold text-xs text-ink">{req.title}</h3>
                  <p className="text-xs text-ink-subtle mt-0.5">
                    {req.fileName} • {req.signedCount} of {req.total} signed
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeStyles(req.status)}`}>
                  {req.status}
                </span>
                {req.status === 'Awaiting' && (
                  <>
                    <button onClick={() => handleRemind(req.id)} className="min-h-11 px-2 text-xs font-semibold text-brand-strong hover:text-accent-bronze transition-colors">
                      Remind
                    </button>
                    <button onClick={() => handleCancel(req.id, req.title)} className="min-h-11 px-2 text-xs font-semibold text-danger-bold hover:opacity-80 transition-opacity">
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="border-t border-line pt-3 flex flex-wrap gap-4 text-xs text-ink-muted">
              {req.signers.map((s, sIdx) => (
                <div key={sIdx} className="flex items-center space-x-1.5">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${s.signed ? 'bg-neutral-xe5efea text-brand-x1e3e2b' : 'bg-surface-muted text-ink-subtle'}`}>
                    {s.signed ? '✓' : '•'}
                  </span>
                  <span>{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* New request modal */}
      {isModalOpen && (
        <Dialog label="Send for signature" onClose={() => setIsModalOpen(false)}>
          {signerLinks ? (
            <div className="p-6 space-y-4">
              <p className="text-sm text-ink font-semibold">Signature request sent</p>
              <p className="text-xs text-neutral-x738279">Per-signer links (shown once, signers also receive them by email):</p>
              <div className="space-y-2">
                {signerLinks.map((link, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input readOnly aria-label={`Signer link ${i + 1}`} value={link} className={`${inputCls} bg-surface-faint truncate text-xs`} />
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard?.writeText(link);
                        triggerToast('Link copied.');
                      }}
                      className={`${btnPrimary} shrink-0`}
                    >
                      <Copy size={13} /> Copy
                    </button>
                  </div>
                ))}
              </div>
              <div className="pt-2 flex justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className={btnSecondary}>
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="sig-file" className={labelCls}>File</label>
                {files.length === 0 ? (
                  <p className="text-xs text-danger-bold">Upload a file in the Library first. Signatures are collected on a file that has passed the scan.</p>
                ) : (
                  <select id="sig-file" value={fileId} onChange={(e) => setFileId(e.target.value)} className={inputCls}>
                    {files.map((f) => (
                      <option key={f.id} value={f.id}>{f.title}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="sig-title" className={labelCls}>Title (optional)</label>
                <input id="sig-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Defaults to the file name" className={inputCls} />
              </div>

              <div className="space-y-2">
                <span className={labelCls}>Signers</span>
                {signers.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="email" required aria-label={`Signer ${i + 1} email`} value={s.email} onChange={(e) => updateSigner(i, 'email', e.target.value)} placeholder="email@company.com" className={`${inputCls} flex-1 min-w-0 text-xs`} />
                    <input aria-label={`Signer ${i + 1} name`} value={s.name} onChange={(e) => updateSigner(i, 'name', e.target.value)} placeholder="Name" className={`${inputCls} w-24 md:w-28 text-xs`} />
                    <button type="button" onClick={() => removeSigner(i)} className={`${btnIcon} shrink-0`} aria-label={`Remove signer ${i + 1}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addSigner} className="min-h-11 text-xs font-semibold text-brand-strong hover:text-accent-bronze transition-colors">+ Add signer</button>
              </div>

              <p className="text-[11px] text-ink-subtle">
                This is a simple electronic signature: each signer types their name and agrees it counts as their signature. It is not certificate-based, and it is not legal advice on enforceability in your jurisdiction.
              </p>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className={`${btnSecondary} flex-1`}>Cancel</button>
                <button type="submit" disabled={sending || files.length === 0} className={`${btnPrimary} flex-1`}>
                  {sending ? 'Sending…' : 'Send request'}
                </button>
              </div>
            </form>
          )}
        </Dialog>
      )}
    </main>
  );
}
