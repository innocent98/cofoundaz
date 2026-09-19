'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Loader2, AlertTriangle, UserPlus, LogIn, Building2 } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api/client';

// Public invite-acceptance landing — GET /invitations/{token} (no auth) previews
// the invite; POST /invitations/accept (verified user) joins the workspace.
// A uniform 404 on preview = unknown / expired / already-used token (the backend
// deliberately doesn't leak which — see services/onboarding/invites.py).
interface InvitePreview {
  startup_name: string | null;
  role: string;
  inviter_name: string | null;
  email: string;
  status: string;
}

function titleCase(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/[_-]+/g, ' ') : s;
}

function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('cf_token');
}

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token as string;
  const router = useRouter();

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient<{ data?: InvitePreview }>(`/invitations/${token}`);
      setPreview(res?.data ?? (res as unknown as InvitePreview));
    } catch {
      // Uniform 404 = unknown / expired / already-accepted link.
      setInvalid(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      setLoggedIn(isLoggedIn());
      await load();
    })();
  }, [token, load]);

  const accept = async () => {
    setAccepting(true);
    setError(null);
    setMismatch(false);
    try {
      const res = await apiClient<{ data?: { startup_id: string; role: string } }>(
        '/invitations/accept',
        { method: 'POST', body: JSON.stringify({ token }) }
      );
      const startupId = (res?.data ?? (res as unknown as { startup_id?: string }))?.startup_id;
      // Land the newly-joined workspace as active so /dashboard shows it.
      if (startupId) {
        try {
          localStorage.setItem('cf_workspace_id', startupId);
        } catch {
          /* ignore storage errors */
        }
      }
      setAccepted(true);
      setTimeout(() => router.push('/dashboard'), 1400);
    } catch (err) {
      if (err instanceof ApiError) {
        const d = err.data as { error?: { code?: string; message?: string } } | undefined;
        const code = d?.error?.code;
        // The logged-in account's email must match the invited address.
        if (code === 'INVITE_EMAIL_MISMATCH' || /email/i.test(d?.error?.message || '')) {
          setMismatch(true);
        } else if (err.status === 401) {
          // Token expired between load and accept — send them to log in and back.
          redirectToLogin();
          return;
        } else if (err.status === 404 || code === 'TOKEN_INVALID') {
          setInvalid(true);
        } else {
          setError(d?.error?.message || 'Could not accept the invitation. Please try again.');
        }
      } else {
        setError('Could not accept the invitation. Please try again.');
      }
    } finally {
      setAccepting(false);
    }
  };

  const nextPath = `/invite/${token}`;
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;
  const signupHref = preview?.email
    ? `/signup?next=${encodeURIComponent(nextPath)}&email=${encodeURIComponent(preview.email)}`
    : `/signup?next=${encodeURIComponent(nextPath)}`;

  function redirectToLogin() {
    router.push(loginHref);
  }

  return (
    <div className="min-h-screen bg-[#F6F7F4] font-body text-[#1E2923]">
      <header className="bg-white border-b border-[#E8E8E2] px-6 py-4 flex items-center justify-between">
        <div className="font-display font-bold text-xl tracking-tight text-[#1E2923]">Cofoundaz</div>
        <div className="text-sm font-medium text-[#617065]">Workspace invitation</div>
      </header>

      <main className="max-w-md mx-auto py-12 px-4">
        {loading && (
          <div className="flex items-center justify-center gap-2 text-[#617065] py-24">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading invitation…
          </div>
        )}

        {!loading && invalid && (
          <div className="bg-white rounded-modal shadow-card border border-[#E8E8E2] p-10 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-[#FBEBEB] text-[#B0483B] flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-display font-bold">This invitation is no longer valid</h1>
            <p className="text-sm text-[#617065] max-w-sm">
              It may have already been accepted, been revoked, or expired. Ask whoever invited you to send a fresh link.
            </p>
          </div>
        )}

        {!loading && !invalid && accepted && (
          <div className="bg-white rounded-modal shadow-card border border-[#E8E8E2] p-10 text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-[#EAF2ED] text-[#2D5A3F] flex items-center justify-center">
              <Check className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-display font-bold">You&apos;re in</h1>
            <p className="text-sm text-[#617065]">
              Welcome to {preview?.startup_name || 'the workspace'}. Taking you to your dashboard…
            </p>
          </div>
        )}

        {!loading && !invalid && !accepted && preview && (
          <div className="bg-white rounded-modal shadow-card border border-[#E8E8E2] overflow-hidden">
            <div className="border-b border-[#E8E8E2] px-6 py-6 bg-[#FBFBFA] text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-card bg-[#EAF2ED] text-[#2D5A3F] flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-display font-bold leading-snug">
                  {preview.inviter_name ? `${preview.inviter_name} invited you` : "You've been invited"}
                </h1>
                <p className="text-sm text-[#617065] mt-1">
                  Join <span className="font-semibold text-[#1E2923]">{preview.startup_name || 'this workspace'}</span> as{' '}
                  <span className="font-semibold text-[#1E2923]">{titleCase(preview.role)}</span>
                </p>
              </div>
            </div>

            <div className="p-6 flex flex-col gap-5">
              <div className="text-center text-xs text-[#8E9B90]">
                Invitation sent to <span className="font-semibold text-[#55625A]">{preview.email}</span>
              </div>

              {mismatch && (
                <div className="bg-[#FDF4E7] border border-[#EBD9B8] rounded-card p-3 text-xs text-[#8A6E33] text-center">
                  This invitation was sent to <span className="font-semibold">{preview.email}</span>. Log in with that
                  email to accept.
                </div>
              )}
              {error && <p className="text-xs font-semibold text-[#B0483B] text-center">{error}</p>}

              {loggedIn && !mismatch ? (
                <button
                  onClick={accept}
                  disabled={accepting}
                  className="w-full bg-[#183B28] hover:bg-[#11291C] disabled:opacity-60 text-white font-bold py-2.5 rounded-card text-sm transition-colors shadow-card flex items-center justify-center gap-2"
                >
                  {accepting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Joining…
                    </>
                  ) : (
                    <>Accept invitation</>
                  )}
                </button>
              ) : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-[#617065] text-center">
                    {mismatch
                      ? 'Sign in with the invited email to continue.'
                      : 'Log in or create your account to accept.'}
                  </p>
                  <Link
                    href={loginHref}
                    className="w-full bg-[#183B28] hover:bg-[#11291C] text-white font-bold py-2.5 rounded-card text-sm transition-colors shadow-card flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" /> Log in to accept
                  </Link>
                  <Link
                    href={signupHref}
                    className="w-full bg-white border border-[#D5DDD6] hover:border-[#4D6D58] text-[#183B28] font-bold py-2.5 rounded-card text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" /> Create an account
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
