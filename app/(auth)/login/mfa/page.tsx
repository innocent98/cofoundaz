'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { ApiError } from '@/lib/api/client';
import { mfaChallenge } from '@/lib/api/mfa';
import { completePostLogin } from '@/lib/auth/post-login';

const MFA_HANDOFF_KEY = 'cf_mfa_handoff';

interface Handoff {
  ticket: string;
  email: string;
  next: string | null;
}

function readHandoff(): Handoff | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(MFA_HANDOFF_KEY);
    if (!raw) return null;
    const h = JSON.parse(raw) as Partial<Handoff>;
    if (!h?.ticket || !h?.email) return null;
    return { ticket: h.ticket, email: h.email, next: h.next ?? null };
  } catch {
    return null;
  }
}

export default function MfaChallengePage() {
  const router = useRouter();
  // Lazy init: the login page put the ticket here just before navigating.
  const [handoff] = useState<Handoff | null>(() => readHandoff());
  const [code, setCode] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // No ticket (deep-linked, refreshed, or storage cleared) → back to login.
  useEffect(() => {
    if (!handoff) router.replace('/login');
  }, [handoff, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoff) return;
    const value = code.trim();
    if (!value) {
      setError(useBackup ? 'Enter one of your backup codes.' : 'Enter the 6-digit code.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { access_token, refresh_token } = await mfaChallenge(handoff.ticket, value);
      try {
        sessionStorage.removeItem(MFA_HANDOFF_KEY);
      } catch {
        /* ignore */
      }
      await completePostLogin({
        accessToken: access_token,
        refreshToken: refresh_token,
        email: handoff.email,
        router,
        nextPath: handoff.next,
      });
    } catch (err) {
      if (err instanceof ApiError) {
        const d = err.data as { error?: { code?: string; message?: string } } | undefined;
        // A bad code and an expired/spent ticket both come back as MFA_INVALID_CODE.
        setError(
          d?.error?.message ||
            (useBackup ? 'That backup code is not valid.' : "That code didn't match. Try again.")
        );
      } else {
        setError('Could not verify the code. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!handoff) return null;

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-modal shadow-card border border-[#E8E8E2] p-8">
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-card bg-[#EAF2ED] text-[#2D5A3F] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-[#1E2923]">Two-step verification</h1>
            <p className="text-sm text-[#617065] mt-1">
              {useBackup
                ? 'Enter one of the backup codes you saved.'
                : 'Enter the 6-digit code from your authenticator app.'}
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            autoFocus
            value={code}
            onChange={(e) =>
              setCode(useBackup ? e.target.value : e.target.value.replace(/\D/g, '').slice(0, 6))
            }
            inputMode={useBackup ? 'text' : 'numeric'}
            autoComplete="one-time-code"
            placeholder={useBackup ? 'XXXX-XXXX' : '123456'}
            className="w-full border border-[#D5DDD6] rounded-input px-3 py-2.5 text-center text-lg tracking-[0.3em] focus:outline-none focus:border-[#4D6D58] focus:ring-1 focus:ring-[#4D6D58]"
          />
          {error && <p className="text-xs font-semibold text-[#B0483B]">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-1 bg-[#183B28] hover:bg-[#11291C] disabled:opacity-60 text-white font-bold py-2.5 rounded-card text-sm transition-colors shadow-card flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Verifying…
              </>
            ) : (
              'Verify'
            )}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => {
              setUseBackup((v) => !v);
              setCode('');
              setError(null);
            }}
            className="font-semibold text-[#183B28] hover:underline"
          >
            {useBackup ? 'Use your authenticator app' : 'Use a backup code'}
          </button>
          <Link href="/login" className="text-[#8E9B90] hover:text-[#617065]">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
