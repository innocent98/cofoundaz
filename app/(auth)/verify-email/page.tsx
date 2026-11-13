'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { apiErrorInfo } from '@/lib/api/api-error';
import { authCopy } from '@/content/auth';
import { readPendingEmail, rememberPendingEmail } from '@/lib/auth/pending';
import { useCountdown } from '@/lib/auth/useCountdown';

interface ResendEnvelope {
  data?: { sent?: boolean; retry_after?: number };
}

/** PRD §01.2 "Check your inbox". The address comes from sessionStorage, never the URL. */
export default function CheckInboxPage() {
  // Lazy init is a client-only read; during SSR it is '' and the page re-renders on hydrate.
  const [email, setEmail] = useState('');
  const [typed, setTyped] = useState('');
  const [wait, setWait] = useState<number | null>(60);
  const [note, setNote] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const [sending, setSending] = useState(false);
  const left = useCountdown(wait);

  useEffect(() => {
    const e = readPendingEmail();
    if (e) queueMicrotask(() => setEmail(e));
  }, []);

  async function resend() {
    const target = email || typed.trim();
    if (!target) {
      setNote({ kind: 'error', text: 'Enter your email address to get a new link.' });
      return;
    }
    setSending(true);
    setNote(null);
    try {
      const res = await apiClient<ResendEnvelope>('/auth/verify/resend', {
        method: 'POST',
        body: JSON.stringify({ email: target }),
      });
      rememberPendingEmail(target);
      setEmail(target);
      const sent = res.data?.sent !== false;
      setWait(res.data?.retry_after ?? 60);
      setNote(
        sent
          ? { kind: 'ok', text: 'A new link is on its way.' }
          : { kind: 'error', text: 'We just sent one. Give it a minute, then try again.' }
      );
    } catch (err) {
      const info = apiErrorInfo(err, 'Could not resend the email. Please try again.');
      if (info.retryAfterSeconds) setWait(info.retryAfterSeconds);
      setNote({ kind: 'error', text: info.message });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-modal shadow-card border border-neutral-100 text-center space-y-5">
      <div className="w-12 h-12 bg-neutral-100 text-neutral-700 rounded-full flex items-center justify-center mx-auto">
        <Mail className="h-6 w-6" />
      </div>
      <div>
        <h1 className="text-xl font-bold font-display text-neutral-900">{authCopy.checkInbox}</h1>
        <p className="text-sm text-neutral-600 mt-1">
          {email ? (
            <>
              We sent a verification link to <span className="font-semibold text-neutral-900">{email}</span>.
            </>
          ) : (
            'We sent you a verification link.'
          )}{' '}
          {authCopy.checkInboxExpiry}
        </p>
      </div>

      {note && (
        <div
          role={note.kind === 'ok' ? 'status' : 'alert'}
          className={`p-3 rounded-input text-xs ${
            note.kind === 'ok'
              ? 'bg-brand-50 text-brand-700 border border-brand-200'
              : 'bg-danger-50 text-danger-700 border border-danger-200'
          }`}
        >
          {note.text}
        </div>
      )}

      {!email && (
        <div className="text-left">
          <label htmlFor="resend-email" className="block text-xs font-medium text-neutral-700 mb-1">
            Your email address
          </label>
          <input
            id="resend-email"
            type="email"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-input focus:outline-none focus:ring-2 focus:ring-brand-800"
            placeholder="you@startup.com"
          />
        </div>
      )}

      <button
        type="button"
        onClick={resend}
        disabled={sending || left > 0}
        className="w-full py-2.5 px-4 bg-neutral-50 hover:bg-neutral-100 disabled:opacity-60 text-neutral-800 text-sm font-medium rounded-input transition"
      >
        {sending ? 'Sending…' : left > 0 ? `Resend in ${left}s` : 'Resend email'}
      </button>

      <Link href="/login" className="block text-sm text-neutral-600 hover:text-neutral-900 transition">
        Already verified? Log in
      </Link>
    </div>
  );
}
