'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/ui/primitives';
import { googleSignIn } from '@/content/auth';
import { ApiError } from '@/lib/api/client';
import {
  exchangeGoogleTicket,
  googleErrorMessage,
} from '@/lib/api/google-signin';
import { completePostLogin, clearStoredInvite, INVITE_TOKEN_KEY } from '@/lib/auth/post-login';

const MFA_HANDOFF_KEY = 'cf_mfa_handoff';
const CALLBACK_PATH = '/auth/google/callback';

type View =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'invite-failed'; message: string; continueTo: string };

function isSafePath(p: string | null | undefined): p is string {
  return !!p && p.startsWith('/') && !p.startsWith('//') && !p.includes('\\');
}

function storedInvite(): string | null {
  try {
    return sessionStorage.getItem(INVITE_TOKEN_KEY);
  } catch {
    return null;
  }
}

// Return page for Google sign-in. The API redirects here with `#ticket=…` (or
// `?error=…`); the ticket is redeemed once, then the session is handled exactly
// like a password login (MFA challenge, invite, onboarding or dashboard).
export default function GoogleCallbackPage() {
  const router = useRouter();
  const [view, setView] = useState<View>({ kind: 'loading' });
  // The ticket is single use: a strict-mode double effect must not redeem it twice.
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const query = new URLSearchParams(window.location.search);
    const ticket = hash.get('ticket');
    const errorCode = query.get('error');
    const queryNext = query.get('next');
    // Nothing secret stays in the address bar.
    window.history.replaceState(null, '', CALLBACK_PATH);

    if (errorCode) {
      queueMicrotask(() => setView({ kind: 'error', message: googleErrorMessage(errorCode) }));
      return;
    }
    if (!ticket) {
      router.replace('/login');
      return;
    }

    void (async () => {
      try {
        const data = await exchangeGoogleTicket(ticket);
        const next = isSafePath(data.next) ? data.next : isSafePath(queryNext) ? queryNext : null;
        const invite = data.invite_token || storedInvite();

        if (data.mfa_required && data.mfa_ticket) {
          try {
            sessionStorage.setItem(
              MFA_HANDOFF_KEY,
              JSON.stringify({ ticket: data.mfa_ticket, next, invite })
            );
          } catch {
            /* ignore storage errors: the challenge page falls back to /login */
          }
          router.push('/login/mfa');
          return;
        }

        if (!data.access_token) throw new Error('No access token returned.');

        const result = await completePostLogin({
          accessToken: data.access_token,
          refreshToken: data.refresh_token ?? undefined,
          router,
          nextPath: next,
          inviteToken: invite,
        });
        clearStoredInvite();
        if (result && result.inviteError) {
          setView({ kind: 'invite-failed', message: result.inviteError, continueTo: result.continueTo });
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 400) {
          setView({ kind: 'error', message: googleSignIn.ticketInvalid });
        } else if (err instanceof ApiError && err.status === 429) {
          setView({ kind: 'error', message: googleSignIn.tooManyAttempts });
        } else {
          setView({ kind: 'error', message: googleSignIn.unknownError });
        }
      }
    })();
  }, [router]);

  if (view.kind === 'loading') {
    return (
      <div role="status" className="flex flex-col items-center gap-3 text-neutral-700">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" aria-hidden="true" />
        <p className="text-[15px]">{googleSignIn.loading}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px]">
      <div
        role="alert"
        className="rounded-input border border-danger-200 bg-danger-50 p-3 text-[13px] text-danger-700"
      >
        {view.message}
      </div>
      {view.kind === 'invite-failed' ? (
        <Button
          variant="accent"
          size="md"
          className="mt-4 w-full"
          onClick={() => router.push(view.continueTo)}
        >
          {googleSignIn.continueAnyway}
        </Button>
      ) : (
        <Link
          href="/login"
          className="mt-4 inline-flex w-full items-center justify-center rounded-input border border-neutral-300 px-4 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100"
        >
          {googleSignIn.backToSignIn}
        </Link>
      )}
    </div>
  );
}
