'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useSignatureRequests, type SignatureRequest } from '@/hooks/useSignatureRequests';
import { ConfirmDialog, btnPrimary, btnSecondary } from '@/components/documents/ui';
import { RequestCard } from '@/components/documents/request-card';
import { SendDialog } from '@/components/documents/send-dialog';
import { listFiles, type FileSummary } from '@/lib/api/documents';
import { useToast } from '../ToastContext';

function SignaturesView() {
  const router = useRouter();
  const params = useSearchParams();
  const wantedFile = params.get('file') ?? undefined;
  const { requests, loading, error: loadError, refetch, createRequest, cancelRequest, remindRequest } = useSignatureRequests();
  const { triggerToast } = useToast();
  const [files, setFiles] = useState<FileSummary[]>([]);
  const [sendOpen, setSendOpen] = useState(() => !!wantedFile);
  const [remind, setRemind] = useState<SignatureRequest | null>(null);
  const [cancel, setCancel] = useState<SignatureRequest | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setFiles(await listFiles());
      } catch {
        setFiles([]);
      }
    })();
  }, []);

  const closeSend = () => {
    setSendOpen(false);
    if (wantedFile) router.replace('/documents/signatures');
  };

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display text-ink-strong tracking-tight mb-1">E-signature requests</h1>
          <p className="text-xs text-neutral-x738279">Send a PDF to be signed, see who has opened and signed it, and download the executed copy.</p>
        </div>
        <button type="button" onClick={() => setSendOpen(true)} className={`${btnPrimary} shrink-0 self-start`}>
          <Plus size={14} />
          <span>New request</span>
        </button>
      </div>

      <p className="text-[11px] text-ink-subtle -mt-4">
        These are simple electronic signatures: each signer types their name. They record who signed, when, from where and the PDF&apos;s SHA-256, and are not certificate-based or legal advice on enforceability in your jurisdiction.
      </p>

      {loadError && (
        <div role="alert" className="bg-danger-tint border border-danger-xfad7d7 rounded-card p-4 text-sm text-danger-600 flex flex-wrap items-center justify-between gap-3">
          <span>Could not load signature requests.</span>
          <button type="button" className={btnSecondary} onClick={() => void refetch()}>
            Try again
          </button>
        </div>
      )}

      {loading && <div className="h-40 bg-white border border-line rounded-modal animate-pulse" aria-label="Loading signature requests" />}

      {!loading && !loadError && requests.length === 0 && (
        <div className="bg-white border border-line rounded-modal shadow-card p-12 text-center">
          <p className="text-sm font-semibold text-ink">No signature requests yet</p>
          <p className="text-xs text-ink-subtle mt-1">Send a PDF to collaborators to collect signatures. A document can be signed after you export it as PDF.</p>
          <button type="button" onClick={() => setSendOpen(true)} className={`${btnPrimary} mt-4`}>
            New request
          </button>
        </div>
      )}

      <div className="space-y-4">
        {requests.map((req) => (
          <RequestCard key={req.id} req={req} onRemind={setRemind} onCancel={setCancel} onRefresh={() => refetch(true)} />
        ))}
      </div>

      {sendOpen && <SendDialog files={files} initialFileId={wantedFile} createRequest={createRequest} onClose={closeSend} />}

      {remind && (
        <ConfirmDialog
          title="Send a reminder?"
          body="Each signer whose turn has come gets an email with a new link. Their old link stops working, including one you copied."
          confirmLabel="Send reminder"
          onClose={() => setRemind(null)}
          onConfirm={async () => {
            const res = await remindRequest(remind.id);
            setRemind(null);
            if (res.ok) {
              triggerToast(res.reminded ? `Reminder sent to ${res.reminded} ${res.reminded === 1 ? 'signer' : 'signers'}.` : 'Nobody to remind right now.');
              await refetch(true);
            } else triggerToast(res.error || 'Could not send the reminder.', 'error');
          }}
        />
      )}
      {cancel && (
        <ConfirmDialog
          title={`Cancel “${cancel.title}”?`}
          body="Signers lose their links straight away. Anyone who already signed stays on the record."
          confirmLabel="Cancel request"
          danger
          onClose={() => setCancel(null)}
          onConfirm={async () => {
            const res = await cancelRequest(cancel.id);
            setCancel(null);
            if (res.ok) triggerToast(`Cancelled “${cancel.title}”.`);
            else triggerToast(res.error || 'Could not cancel the request.', 'error');
          }}
        />
      )}
    </main>
  );
}

export default function SignaturesPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 md:px-6 py-8"><div className="h-40 bg-white border border-line rounded-modal animate-pulse" /></div>}>
      <SignaturesView />
    </Suspense>
  );
}
