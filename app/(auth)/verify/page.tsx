'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient, ApiError } from '@/lib/api/client';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  const emailParam = searchParams.get('email') || '';

  const [tokenInput, setTokenInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>(
    tokenFromUrl ? 'verifying' : 'idle'
  );
  const [errorMessage, setErrorMessage] = useState('');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [resendMessage, setResendMessage] = useState('');

  async function executeVerification(token: string) {
    if (!token.trim()) return;
    setStatus('verifying');
    setErrorMessage('');

    try {
      await apiClient('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ token: token.trim() }),
      });

      setStatus('success');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: unknown) {
      setStatus('error');
      if (err instanceof ApiError) {
        const d = err.data as any;
        const msg =
          d?.error?.message ||
          (typeof d?.detail === 'string' ? d.detail : null) ||
          'Verification token is invalid or has expired.';
        setErrorMessage(msg);
      } else {
        setErrorMessage('Verification failed. Please check your token or link.');
      }
    }
  }

  useEffect(() => {
    if (tokenFromUrl) {
      executeVerification(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  async function handleResend() {
    if (!emailParam) {
      setResendStatus('error');
      setResendMessage('No email address found to resend to. Please log in again.');
      return;
    }

    setResendStatus('sending');
    setResendMessage('');

    try {
      await apiClient('/auth/verify/resend', {
        method: 'POST',
        body: JSON.stringify({ email: emailParam }),
      });
      setResendStatus('sent');
      setResendMessage('A fresh verification link has been sent to your inbox.');
    } catch (err: unknown) {
      setResendStatus('error');
      if (err instanceof ApiError) {
        const d = err.data as any;
        setResendMessage(
          d?.error?.message ||
          (typeof d?.detail === 'string' ? d.detail : null) ||
          'Failed to resend verification email.'
        );
      } else {
        setResendMessage('Failed to resend verification email. Please try again later.');
      }
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-[16px] shadow-card border border-sage-100 text-center">
      {status === 'verifying' && (
        <div className="space-y-4">
          <div className="w-10 h-10 border-4 border-green-800 border-t-transparent rounded-full animate-spin mx-auto" />
          <h1 className="text-xl font-bold font-display text-sage-900">Verifying your email</h1>
          <p className="text-sm text-sage-500">Confirming your account with Cofaundaz...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="space-y-4">
          <div className="w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ?
          </div>
          <h1 className="text-xl font-bold font-display text-sage-900">Email verified!</h1>
          <p className="text-sm text-sage-500">Your account is active. Redirecting to your dashboard...</p>
        </div>
      )}

      {(status === 'idle' || status === 'error') && (
        <div className="space-y-5 text-left">
          <div className="text-center">
            <div className="w-12 h-12 bg-sage-100 text-sage-700 rounded-full flex items-center justify-center mx-auto text-xl font-bold mb-3">
              ?
            </div>
            <h1 className="text-xl font-bold font-display text-sage-900">Verify your email</h1>
            <p className="text-sm text-sage-600 mt-1">
              {emailParam ? (
                <>We sent a verification link to <span className="font-semibold text-sage-900">{emailParam}</span>.</>
              ) : (
                'Please check your email and click the verification link.'
              )}
            </p>
          </div>

          {status === 'error' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-[12px] text-xs text-red-700">
              {errorMessage}
            </div>
          )}

          {resendMessage && (
            <div className={`p-3 rounded-[12px] text-xs ${resendStatus === 'sent' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {resendMessage}
            </div>
          )}

          <div className="pt-2 space-y-3">
            <label className="block text-xs font-medium text-sage-700">
              Or paste your verification code / token:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Verification token"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-sage-200 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-green-800"
              />
              <button
                type="button"
                onClick={() => executeVerification(tokenInput)}
                disabled={!tokenInput.trim() || status === 'verifying'}
                className="px-4 py-2 bg-green-900 hover:bg-green-800 disabled:opacity-50 text-white text-sm font-semibold rounded-[12px] transition"
              >
                Verify
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-sage-100 flex flex-col gap-2">
            {emailParam && (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendStatus === 'sending'}
                className="w-full py-2.5 px-4 bg-sage-50 hover:bg-sage-100 text-sage-800 text-sm font-medium rounded-[12px] transition"
              >
                {resendStatus === 'sending' ? 'Sending...' : 'Resend verification email'}
              </button>
            )}

            <Link
              href="/login"
              className="text-center py-2 text-sm text-sage-600 hover:text-sage-900 transition"
            >
              Back to Login
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-sage-400">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
