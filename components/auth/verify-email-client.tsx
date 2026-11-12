'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { authCopy } from '@/content/auth';
import { resolveAfterVerify } from '@/lib/auth/post-login';

type Status = 'verifying' | 'success' | 'error';

/**
 * Target of the verification email link `/verify-email/{token}` (see
 * fe-integration-guide-auth-email-links). Auto-calls POST /auth/verify with the
 * path token on mount. Success shows "You're verified. Let's build." and Continue
 * routes by state (pending invite, then the wizard, then the dashboard).
 */
export function VerifyEmailClient({ token }: { token: string }) {
  const router = useRouter();
  // Derive the no-token state up front so the effect never setStates synchronously.
  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'error');
  const [message, setMessage] = useState<string>(
    token ? '' : 'This verification link is missing its token.'
  );
  const ran = useRef(false);

  useEffect(() => {
    if (!token || ran.current) return; // no token → already in error state; guard double-invoke
    ran.current = true;

    apiClient<{ data: { verified: boolean } }>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then(() => setStatus('success'))
      .catch(() => {
        setStatus('error');
        setMessage('This link has expired or was already used. If you have already verified, log in.');
      });
  }, [token]);

  const [continuing, setContinuing] = useState(false);
  async function onContinue() {
    setContinuing(true);
    router.push(await resolveAfterVerify());
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-modal shadow-card border border-neutral-100 text-center">
      {status === 'verifying' && (
        <>
          <h1 className="text-xl font-bold text-neutral-900 mb-2">Verifying your email…</h1>
          <p className="text-sm text-neutral-500">One moment while we confirm your link.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold font-display text-neutral-900 mb-2">
            {authCopy.verifiedTitle}
          </h1>
          <p className="text-sm text-neutral-500 mb-6">Your email is confirmed and your account is active.</p>
          <button
            type="button"
            onClick={onContinue}
            disabled={continuing}
            className="inline-block px-5 py-2.5 bg-brand-900 text-white rounded-card font-semibold text-sm hover:bg-brand-800 disabled:opacity-60 transition-colors"
          >
            {continuing ? 'Continuing…' : 'Continue'}
          </button>
        </>
      )}

      {status === 'error' && (
        <>
          <h1 className="text-xl font-bold text-neutral-900 mb-2">This link didn&apos;t work</h1>
          <p className="text-sm text-neutral-500 mb-6">{message}</p>
          <div className="flex flex-col items-center gap-3">
            <Link
              href="/login"
              className="inline-block px-5 py-2.5 bg-brand-900 text-white rounded-card font-semibold text-sm hover:bg-brand-800 transition-colors"
            >
              Already verified? Log in
            </Link>
            <Link href="/verify-email" className="text-sm text-neutral-600 hover:text-neutral-900">
              Send me a new link
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
