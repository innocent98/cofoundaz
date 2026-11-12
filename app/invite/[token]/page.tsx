'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Loader2, AlertTriangle, UserPlus, LogIn, Building2 } from 'lucide-react';
import { apiClient, ApiError } from '@/lib/api/client';
import { forgetInvite, rememberInvite } from '@/lib/auth/pending';
import { getMe, hasProfileName, logout, updateProfileName, type MeResponse } from '@/lib/api/profile';
import { declineInvitation } from '@/lib/api/onboarding';
import { apiErrorInfo } from '@/lib/api/api-error';
import BrandLogo from '@/components/brand/BrandLogo';

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

/** The role as the onboarding invite step names it ("founder" is offered as Co-Founder). */
function roleLabel(role: string): string {
  return role === 'founder' ? 'Co-Founder' : titleCase(role);
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
  const [me, setMe] = useState<MeResponse | null>(null);
  const [name, setName] = useState('');
  const [declined, setDeclined] = useState(false);
  const [declining, setDeclining] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient<{ data?: InvitePreview }>(`/invitations/${encodeURIComponent(token)}`);
      setPreview(res?.data ?? (res as unknown as InvitePreview));
    } catch {
      // Uniform 404 = unknown / expired / already-accepted link.
      setInvalid(true);
      forgetInvite();
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    void (async () => {
      setLoggedIn(isLoggedIn());
      // Signed out: keep the token so it survives sign-in (incl. the Google round trip).
      if (!isLoggedIn()) rememberInvite(token);
      else {
        // Who is signed in decides what the page offers (wrong account, missing name).
        try {
          setMe(await getMe());
        } catch {
          /* a failed /auth/me leaves the plain Accept; the API still checks the email */
        }
      }
      await load();
    })();
  }, [token, load]);

  const accept = async () => {
    setAccepting(true);
    setError(null);
    setMismatch(false);
    try {
      // An invited member arrives with no name: ask once, before joining.
      if (me && !hasProfileName(me)) {
        if (!name.trim()) {
          setError('Enter your name so your team knows who you are.');
          setAccepting(false);
          return;
        }
        setMe(await updateProfileName(name.trim()));
      }
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
      forgetInvite();
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

  const decline = async () => {
    setDeclining(true);
    setError(null);
    try {
      await declineInvitation(token);
      forgetInvite();
      setDeclined(true);
    } catch (err) {
      setError(apiErrorInfo(err, 'Could not decline the invitation. Please try again.').message);
    } finally {
      setDeclining(false);
    }
  };

  const signOutAndStay = async () => {
    await logout();
    router.refresh();
    window.location.assign(`/invite/${token}`);
  };

  const signedInEmail = me?.user?.email ?? null;
  const wrongAccount =
    !!signedInEmail && !!preview?.email && signedInEmail.toLowerCase() !== preview.email.toLowerCase();

  const nextPath = `/invite/${token}`;
  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;
  const signupHref = preview?.email
    ? `/signup?next=${encodeURIComponent(nextPath)}&email=${encodeURIComponent(preview.email)}`
    : `/signup?next=${encodeURIComponent(nextPath)}`;

  function redirectToLogin() {
    router.push(loginHref);
  }

  return (
    <div className="min-h-screen bg-neutral-xf6f7f4 font-body text-ink">
      <header className="bg-white border-b border-line px-6 py-4 flex items-center justify-between">
        <BrandLogo height={26} eager />
        <div className="text-sm font-medium text-ink-muted">Workspace invitation</div>
      </header>

      <main className="max-w-md mx-auto py-12 px-4">
        {loading && (
          <div className="flex items-center justify-center gap-2 text-ink-muted py-24">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading invitation…
          </div>
        )}

        {!loading && invalid && (
          <div className="bg-white rounded-modal shadow-card border border-line p-10 text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-danger-wash text-danger-600 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-display font-bold">This invitation is no longer valid</h1>
            <p className="text-sm text-ink-muted max-w-sm">
              It may have already been accepted, been revoked, or expired. Ask whoever invited you to send a fresh link.
            </p>
            <div className="mt-2 flex flex-col gap-2 md:flex-row">
              <Link href="/login" className="rounded-card bg-brand-strong px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-rail">
                Log in
              </Link>
              <Link href="/" className="rounded-card border border-line-strong px-5 py-2.5 text-sm font-bold text-brand-strong hover:border-line-focus">
                Back home
              </Link>
            </div>
          </div>
        )}

        {!loading && !invalid && declined && (
          <div className="bg-white rounded-modal shadow-card border border-line p-10 text-center flex flex-col items-center gap-3">
            <h1 className="text-xl font-display font-bold">Invitation declined</h1>
            <p className="text-sm text-ink-muted">We&apos;ve let them know you won&apos;t be joining.</p>
            <Link href="/dashboard" className="mt-2 rounded-card bg-brand-strong px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-rail">
              Go to my dashboard
            </Link>
          </div>
        )}

        {!loading && !invalid && !declined && accepted && (
          <div className="bg-white rounded-modal shadow-card border border-line p-10 text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-brand-tint text-brand-mid flex items-center justify-center">
              <Check className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-display font-bold">You&apos;re in</h1>
            <p className="text-sm text-ink-muted">
              Welcome to {preview?.startup_name || 'the workspace'}. Taking you to your dashboard…
            </p>
          </div>
        )}

        {!loading && !invalid && !declined && !accepted && preview && (
          <div className="bg-white rounded-modal shadow-card border border-line overflow-hidden">
            <div className="border-b border-line px-6 py-6 bg-surface-faint text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-card bg-brand-tint text-brand-mid flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-display font-bold leading-snug">
                  {preview.inviter_name ? `${preview.inviter_name} invited you` : "You've been invited"}
                </h1>
                <p className="text-sm text-ink-muted mt-1">
                  Join <span className="font-semibold text-ink">{preview.startup_name || 'this workspace'}</span> as{' '}
                  <span className="font-semibold text-ink">{roleLabel(preview.role)}</span>
                </p>
              </div>
            </div>

            <div className="p-6 flex flex-col gap-5">
              <div className="text-center text-xs text-ink-subtle">
                Invitation sent to <span className="font-semibold text-neutral-x55625a">{preview.email}</span>
              </div>

              {mismatch && (
                <div className="bg-accent-xfdf4e7 border border-accent-xebd9b8 rounded-card p-3 text-xs text-accent-x8a6e33 text-center">
                  This invitation was sent to <span className="font-semibold">{preview.email}</span>. Log in with that
                  email to accept.
                </div>
              )}
              {error && <p className="text-xs font-semibold text-danger-600 text-center">{error}</p>}

              {loggedIn && wrongAccount && (
                <div className="flex flex-col gap-3 text-center">
                  <div className="bg-accent-xfdf4e7 border border-accent-xebd9b8 rounded-card p-3 text-xs text-accent-x8a6e33">
                    You&apos;re signed in as <span className="font-semibold">{signedInEmail}</span>, but this invitation was
                    sent to <span className="font-semibold">{preview.email}</span>.
                  </div>
                  <button
                    onClick={() => void signOutAndStay()}
                    className="w-full bg-brand-strong hover:bg-brand-rail text-white font-bold py-2.5 rounded-card text-sm transition-colors shadow-card"
                  >
                    Sign out and use {preview.email}
                  </button>
                </div>
              )}

              {loggedIn && !wrongAccount && !mismatch ? (
                <div className="flex flex-col gap-3">
                  {me && !hasProfileName(me) && (
                    <div>
                      <label htmlFor="invitee-name" className="mb-1 block text-xs font-semibold text-ink-muted">
                        Your name
                      </label>
                      <input
                        id="invitee-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        maxLength={120}
                        className="w-full rounded-input border border-line-strong px-3 py-2.5 text-sm focus:border-line-focus focus:outline-none focus:ring-1 focus:ring-line-focus"
                        placeholder="Jane Doe"
                      />
                    </div>
                  )}
                  <button
                    onClick={accept}
                    disabled={accepting || declining}
                    className="w-full bg-brand-strong hover:bg-brand-rail disabled:opacity-60 text-white font-bold py-2.5 rounded-card text-sm transition-colors shadow-card flex items-center justify-center gap-2"
                  >
                    {accepting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Joining…
                      </>
                    ) : (
                      <>Accept invitation</>
                    )}
                  </button>
                  <button
                    onClick={() => void decline()}
                    disabled={accepting || declining}
                    className="text-sm font-semibold text-ink-muted hover:text-ink disabled:opacity-60"
                  >
                    {declining ? 'Declining…' : 'Decline'}
                  </button>
                </div>
              ) : loggedIn && wrongAccount ? null : (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-ink-muted text-center">
                    {mismatch
                      ? 'Sign in with the invited email to continue.'
                      : 'Log in or create your account to accept.'}
                  </p>
                  <Link
                    href={loginHref}
                    className="w-full bg-brand-strong hover:bg-brand-rail text-white font-bold py-2.5 rounded-card text-sm transition-colors shadow-card flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" /> Log in to accept
                  </Link>
                  <Link
                    href={signupHref}
                    className="w-full bg-white border border-line-strong hover:border-line-focus text-brand-strong font-bold py-2.5 rounded-card text-sm transition-colors flex items-center justify-center gap-2"
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
