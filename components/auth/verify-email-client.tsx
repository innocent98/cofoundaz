'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api/client';

type Status = 'verifying' | 'success' | 'error';

/**
 * Target of the verification email link `/verify-email/{token}` (see
 * fe-integration-guide-auth-email-links). Auto-calls POST /auth/verify with the
 * path token on mount. On success the user is already signed in (signup issued a
 * session), so we send them straight into the app — consistent with the /verify
 * page — rather than bouncing them back to the login screen.
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
      .catch((err: unknown) => {
        const data = err instanceof ApiError ? (err.data as { error?: { message?: string } }) : null;
        setStatus('error');
        setMessage(data?.error?.message || 'This verification link is invalid or has expired.');
      });
  }, [token]);

  // On success, continue into the app. The post-login guard routes to onboarding
  // if it is still incomplete, so the founder never has to log in again here.
  useEffect(() => {
    if (status !== 'success') return;
    const t = setTimeout(() => router.push('/dashboard'), 1500);
    return () => clearTimeout(t);
  }, [status, router]);

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
            You&apos;re verified. Let&apos;s build.
          </h1>
          <p className="text-sm text-neutral-500 mb-6">
            Your account is active. Taking you to your workspace…
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-5 py-2.5 bg-brand-900 text-white rounded-card font-semibold text-sm hover:bg-brand-800 transition-colors"
          >
            Continue
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <h1 className="text-xl font-bold text-neutral-900 mb-2">Verification failed</h1>
          <p className="text-sm text-neutral-500 mb-6">{message}</p>
          <Link
            href="/verify"
            className="inline-block px-5 py-2.5 bg-brand-900 text-white rounded-card font-semibold text-sm hover:bg-brand-800 transition-colors"
          >
            Resend verification email
          </Link>
        </>
      )}
    </div>
  );
}
