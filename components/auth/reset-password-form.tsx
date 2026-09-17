'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/client';

/**
 * The new-password form behind a reset link. The token comes from the URL —
 * either the path segment `/reset-password/{token}` (what the backend email
 * links to, see fe-integration-guide-auth-email-links) or, for legacy links,
 * the `?token=` query. An empty token renders the "request a new link" state.
 */
export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto p-8 bg-white rounded-modal shadow-card border border-sage-100 text-center">
        <h1 className="text-xl font-bold text-sage-900 mb-2">Invalid reset link</h1>
        <p className="text-sm text-sage-500 mb-6">This password reset link is missing a valid token.</p>
        <Link
          href="/forgot-password"
          className="inline-block px-5 py-2.5 bg-green-900 text-white rounded-card font-semibold text-sm hover:bg-green-800 transition-colors"
        >
          Request new reset link
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      // POST /auth/password/reset {token, password} → 200 {data:{reset:true}}.
      // Success revokes all existing sessions, so send them to login.
      await authApi.resetPassword({ token, password });
      setSuccess(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch (err: unknown) {
      // 400 TOKEN_INVALID (invalid/used/expired) · 422 WEAK_PASSWORD.
      const data = err instanceof ApiError ? (err.data as { error?: { code?: string; message?: string } }) : null;
      const code = data?.error?.code;
      if (code === 'TOKEN_INVALID') {
        setError('This reset link is invalid or has expired. Request a new one.');
      } else if (code === 'WEAK_PASSWORD') {
        setError(data?.error?.message || 'Please choose a stronger password.');
      } else {
        setError(data?.error?.message || 'Could not reset your password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-modal shadow-card border border-sage-100">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold font-display text-sage-900">Set new password</h1>
        <p className="text-sm text-sage-500 mt-2">Enter your new account password below.</p>
      </div>

      {success ? (
        <div className="p-4 bg-green-50 text-green-800 rounded-card text-sm border border-green-200 text-center">
          Password updated. Redirecting you to login&hellip;
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-input border border-red-200">{error}</div>
          )}

          <div>
            <label htmlFor="new-password" className="block text-xs font-semibold uppercase tracking-wider text-sage-600 mb-2">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full px-4 py-3 rounded-card border border-sage-200 focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-600 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-xs font-semibold uppercase tracking-wider text-sage-600 mb-2">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
              className="w-full px-4 py-3 rounded-card border border-sage-200 focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-600 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-900 hover:bg-green-800 disabled:opacity-50 text-white font-semibold rounded-card transition-colors cursor-pointer"
          >
            {loading ? 'Updating password…' : 'Update password'}
          </button>
        </form>
      )}
    </div>
  );
}
