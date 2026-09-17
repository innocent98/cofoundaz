'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { apiClient, ApiError } from '@/lib/api/client';

type Status = 'verifying' | 'success' | 'error';

/**
 * Target of the verification email link `/verify-email/{token}` (see
 * fe-integration-guide-auth-email-links). Auto-calls POST /auth/verify with the
 * path token on mount; on an invalid/expired link it points the user to resend.
 */
export function VerifyEmailClient({ token }: { token: string }) {
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

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-modal shadow-card border border-sage-100 text-center">
      {status === 'verifying' && (
        <>
          <h1 className="text-xl font-bold text-sage-900 mb-2">Verifying your email…</h1>
          <p className="text-sm text-sage-500">One moment while we confirm your link.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <h1 className="text-2xl font-bold font-display text-sage-900 mb-2">Email verified</h1>
          <p className="text-sm text-sage-500 mb-6">Your email is confirmed. You can log in now.</p>
          <Link
            href="/login"
            className="inline-block px-5 py-2.5 bg-green-900 text-white rounded-card font-semibold text-sm hover:bg-green-800 transition-colors"
          >
            Go to login
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <h1 className="text-xl font-bold text-sage-900 mb-2">Verification failed</h1>
          <p className="text-sm text-sage-500 mb-6">{message}</p>
          <Link
            href="/verify"
            className="inline-block px-5 py-2.5 bg-green-900 text-white rounded-card font-semibold text-sm hover:bg-green-800 transition-colors"
          >
            Resend verification email
          </Link>
        </>
      )}
    </div>
  );
}
