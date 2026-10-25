'use client';

import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { waitForDraft, type DraftOutcome } from '@/hooks/useSalesSequences';
import {
  followUpSendMessage,
  getFollowUp,
  isDraftInProgress,
  requestFollowUp,
  salesErrorMessage,
  sendFollowUp,
  type Draft,
} from '@/lib/api/sales';
import { useToast } from '@/app/(dashboard)/sales/ToastContext';
import { BTN_ACCENT, BTN_SECONDARY, ConfirmDialog, Field, INPUT } from './shared';

type Phase = 'loading' | 'idle' | 'writing' | 'ready' | 'sent';

/**
 * "Follow up" on a deal: the AI writes one email to the deal's contact, the member edits it and sends it
 * once. Sending goes out from the company outreach mailbox, so the send always asks first.
 */
export function FollowUpSection({ dealId, hasContact }: { dealId: string; hasContact: boolean }) {
  const { triggerToast } = useToast();
  const [phase, setPhase] = useState<Phase>('loading');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const alive = useRef(true);
  const subjectId = useId();
  const bodyId = useId();

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const apply = useCallback((outcome: DraftOutcome | null) => {
    if (!outcome || !alive.current) return;
    if (outcome.kind === 'ready') {
      setDraft(outcome.draft);
      setSubject(outcome.draft.subject ?? '');
      setBody(outcome.draft.body ?? '');
      setNote(null);
      setPhase('ready');
    } else {
      setNote(outcome.kind === 'slow' ? 'This is taking longer than usual. Check again in a moment.' : outcome.message);
      setPhase('idle');
    }
  }, []);

  const track = useCallback(
    async (d: Draft) => {
      if (d.status === 'ready' && d.sent_at) {
        setDraft(d);
        setPhase('sent');
        return;
      }
      setPhase('writing');
      apply(await waitForDraft(d, () => !alive.current));
    },
    [apply]
  );

  useEffect(() => {
    let cancelled = false;
    getFollowUp(dealId)
      .then((d) => {
        if (cancelled) return;
        if (!d) setPhase('idle');
        else void track(d);
      })
      .catch((err) => {
        if (cancelled) return;
        setNote(salesErrorMessage(err, 'Could not load the follow-up.'));
        setPhase('idle');
      });
    return () => {
      cancelled = true;
    };
  }, [dealId, track]);

  const write = async () => {
    setNote(null);
    setSendError(null);
    setPhase('writing');
    try {
      await track(await requestFollowUp(dealId));
    } catch (err) {
      if (isDraftInProgress(err)) {
        // Another tab or member started one; pick up that draft instead of failing.
        const d = await getFollowUp(dealId).catch(() => null);
        if (d) return void (await track(d));
      }
      setNote(salesErrorMessage(err, 'Could not start the follow-up.'));
      setPhase('idle');
    }
  };

  const send = async () => {
    if (!draft) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await sendFollowUp(dealId, { draft_id: draft.id, subject: subject.trim(), body: body.trim() });
      triggerToast(`Follow-up sent to ${res.to}`);
      setConfirming(false);
      setDraft({ ...draft, sent_at: new Date().toISOString() });
      setPhase('sent');
    } catch (err) {
      setConfirming(false);
      setSendError(followUpSendMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <section aria-label="Follow-up email" className="space-y-3">
      <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Follow-up email</h3>
      {phase === 'loading' && <p className="text-sm text-neutral-600">Checking for a draft...</p>}
      {(phase === 'idle' || phase === 'sent') && (
        <>
          <p className="text-sm text-neutral-600">
            {phase === 'sent' && draft?.sent_at
              ? `A follow-up was sent on ${new Date(draft.sent_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}. You can write another.`
              : 'The AI drafts one email to this deal’s contact. You edit it, then send it.'}
          </p>
          {!hasContact && <p className="text-sm text-neutral-600">Add a contact with an email to this deal before sending.</p>}
          <button type="button" className={BTN_SECONDARY} onClick={() => void write()}>
            {phase === 'sent' ? 'Write another follow-up' : 'Write a follow-up'}
          </button>
        </>
      )}
      {phase === 'writing' && (
        <p role="status" className="text-sm text-neutral-600">
          Writing your follow-up...
        </p>
      )}
      {phase === 'ready' && draft && (
        <div className="space-y-3">
          <Field label="Subject" htmlFor={subjectId}>
            <input id={subjectId} className={INPUT} maxLength={300} value={subject} onChange={(e) => setSubject(e.target.value)} />
          </Field>
          <Field label="Message" htmlFor={bodyId}>
            <textarea id={bodyId} className={INPUT} rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
          </Field>
          <div className="flex flex-wrap gap-3">
            <button type="button" className={BTN_ACCENT} disabled={!subject.trim() || !body.trim()} onClick={() => setConfirming(true)}>
              Send follow-up
            </button>
            <button type="button" className={BTN_SECONDARY} onClick={() => void write()}>
              Write a new one
            </button>
          </div>
        </div>
      )}
      {note && (
        <p role="alert" className="text-sm text-danger-700">
          {note}
        </p>
      )}
      {sendError && (
        <p role="alert" className="text-sm text-danger-700">
          {sendError}
        </p>
      )}
      {confirming && (
        <ConfirmDialog
          title="Send this email now?"
          body="It goes out from your company outreach mailbox to this deal's contact, right away. It cannot be recalled."
          confirmLabel="Send email"
          cancelLabel="Not yet"
          busy={sending}
          onConfirm={() => void send()}
          onCancel={() => setConfirming(false)}
        />
      )}
    </section>
  );
}
