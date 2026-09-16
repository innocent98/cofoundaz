'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api/auth';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Missing or invalid reset token. Request a new reset link.');
      return;
    }

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
      await authApi.resetPassword({ token, password });
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: unknown) {
      setError(((err as { message?: string })?.message) || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto p-8 bg-white rounded-[16px] shadow-card border border-sage-100 text-center">
        <h1 className="text-xl font-bold text-sage-900 mb-2">Invalid Reset Link</h1>
        <p className="text-sm text-sage-500 mb-6">This password reset link is missing a valid token.</p>
        <Link
          href="/forgot-password"
          className="inline-block px-5 py-2.5 bg-green-900 text-white rounded-[12px] font-semibold text-sm hover:bg-green-800 transition"
        >
          Request new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-[16px] shadow-card border border-sage-100">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold font-display text-sage-900">Set new password</h1>
        <p className="text-sm text-sage-500 mt-2">Enter your new account password below.</p>
      </div>

      {success ? (
        <div className="text-center space-y-4">
          <div className="p-4 bg-green-50 text-green-800 rounded-[12px] text-sm border border-green-200">
            Password updated successfully! Redirecting you to login...
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-[8px] border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-sage-600 mb-2">
              New password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-[12px] border border-sage-200 focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-600 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-sage-600 mb-2">
              Confirm new password
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-[12px] border border-sage-200 focus:outline-none focus:ring-2 focus:ring-green-600/30 focus:border-green-600 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-900 hover:bg-green-800 disabled:opacity-50 text-white font-semibold rounded-[12px] transition cursor-pointer"
          >
            {loading ? 'Updating password...' : 'Update password'}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-sage-400">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

