'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await authApi.forgotPassword({ email });
      setSubmitted(true);
    } catch (err: unknown) {
      setError(((err as { message?: string })?.message) || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-[16px] shadow-card border border-neutral-100">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold font-display text-neutral-900">Reset your password</h1>
        <p className="text-sm text-neutral-500 mt-2">
          Enter the email address associated with your account and we&apos;ll send you a recovery link.
        </p>
      </div>

      {submitted ? (
        <div className="text-center space-y-4">
          <div className="p-4 bg-brand-50 text-brand-800 rounded-[12px] text-sm border border-brand-200">
            We&apos;ve sent a reset link to <strong>{email}</strong>. Check your inbox to proceed.
          </div>
          <Link
            href="/login"
            className="inline-block text-sm font-semibold text-brand-700 hover:text-brand-800 hover:underline pt-2"
          >
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-[8px] border border-danger-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-2">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="founder@example.com"
              className="w-full px-4 py-3 rounded-[12px] border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-brand-600 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-900 hover:bg-brand-800 disabled:opacity-50 text-white font-semibold rounded-[12px] transition cursor-pointer"
          >
            {loading ? 'Sending link...' : 'Send reset link'}
          </button>

          <div className="text-center pt-2">
            <Link href="/login" className="text-xs text-neutral-500 hover:text-neutral-800 hover:underline">
              Remember your password? Log in
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}

