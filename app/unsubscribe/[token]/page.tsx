'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  PublicUnsubscribeError,
  confirmUnsubscribe,
  getUnsubscribeStatus,
  type UnsubscribeStatus,
} from '@/lib/api/sales';
import { BTN_ACCENT } from '@/components/marketing-hub/states';

type View =
  | { kind: 'loading' }
  | { kind: 'invalid' }
  | { kind: 'error' }
  | { kind: 'ready'; status: UnsubscribeStatus; justDone: boolean };

// Public page behind the unsubscribe link in every sales email. Opening it only reads the status;
// nothing changes until the person presses the button.
export default function UnsubscribePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token as string;
  const [view, setView] = useState<View>({ kind: 'loading' });
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    getUnsubscribeStatus(token)
      .then((status) => active && setView({ kind: 'ready', status, justDone: false }))
      .catch((err) => {
        if (!active) return;
        setView({ kind: err instanceof PublicUnsubscribeError && err.status === 404 ? 'invalid' : 'error' });
      });
    return () => {
      active = false;
    };
  }, [token]);

  const confirm = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const status = await confirmUnsubscribe(token);
      setView({ kind: 'ready', status, justDone: true });
    } catch (err) {
      if (err instanceof PublicUnsubscribeError && err.status === 404) setView({ kind: 'invalid' });
      else setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f7f5] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-modal border border-sage-200/80 shadow-card p-8 space-y-4 text-center">
        {view.kind === 'loading' && (
          <p role="status" className="text-sm text-sage-500">
            Loading...
          </p>
        )}
        {view.kind === 'invalid' && (
          <>
            <h1 className="font-display font-semibold text-xl text-sage-900">This link does not work</h1>
            <p className="text-sm text-sage-600">
              It may be incomplete or out of date. Use the unsubscribe link from the most recent email you received.
            </p>
          </>
        )}
        {view.kind === 'error' && (
          <>
            <h1 className="font-display font-semibold text-xl text-sage-900">Something went wrong</h1>
            <p role="alert" className="text-sm text-sage-600">
              We could not check this link. Please try again in a moment.
            </p>
          </>
        )}
        {view.kind === 'ready' && view.status.unsubscribed && (
          <>
            <h1 className="font-display font-semibold text-xl text-sage-900">
              {view.justDone ? `You won't hear from ${view.status.sender} again` : "You're already unsubscribed"}
            </h1>
            <p className="text-sm text-sage-600">
              {view.status.email} will not get any more emails from {view.status.sender}.
            </p>
          </>
        )}
        {view.kind === 'ready' && !view.status.unsubscribed && (
          <>
            <h1 className="font-display font-semibold text-xl text-sage-900">Unsubscribe from {view.status.sender}?</h1>
            <p className="text-sm text-sage-600">
              {view.status.email} will stop getting emails from {view.status.sender}.
            </p>
            {failed && (
              <p role="alert" className="text-sm text-red-700">
                That did not go through. Please try again.
              </p>
            )}
            <button type="button" className={BTN_ACCENT} disabled={busy} onClick={() => void confirm()}>
              {busy ? 'Unsubscribing...' : 'Unsubscribe'}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
