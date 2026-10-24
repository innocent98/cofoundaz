'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BadgeCheck, ShieldAlert } from 'lucide-react';
import { useResource } from '@/hooks/useLearning';
import { verifyCredential } from '@/lib/api/learning';
import { formatIssuedOn } from '@/lib/learning-format';

// Public credential check, signed out: GET /verify/{code}. Shows the holder,
// course, date and issuer and nothing else. 404 and 429 get plain copy.
export default function VerifyCredentialPage() {
  const { code } = useParams<{ code: string }>();
  const fetcher = useCallback(() => verifyCredential(code), [code]);
  const res = useResource(fetcher);

  return (
    <main className="flex min-h-screen items-center justify-center bg-sage-100 px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-modal border border-sage-200 bg-white p-8 shadow-card">
        <p className="text-xs font-bold uppercase tracking-widest text-copper-700">Cofoundaz credential check</p>
        <p className="rounded bg-sage-50 px-2 py-1 text-sm font-medium text-sage-900 break-all">{code}</p>

        {res.status === 'loading' && <p role="status" className="text-sm text-sage-600">Checking this credential...</p>}

        {res.status === 'ready' && res.data?.valid === true && (
          <div role="status" className="space-y-4">
            <p className="flex items-center gap-2 text-lg font-semibold text-green-900"><BadgeCheck className="h-6 w-6 text-green-700" aria-hidden="true" /> Valid credential</p>
            <dl className="space-y-3 text-sm">
              <div><dt className="text-xs font-bold uppercase tracking-wider text-sage-600">Awarded to</dt><dd className="font-semibold text-sage-900">{res.data.holder_name}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wider text-sage-600">Course</dt><dd className="font-semibold text-sage-900">{res.data.course_title}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wider text-sage-600">Issued on</dt><dd className="font-semibold text-sage-900">{res.data.issued_on ? formatIssuedOn(res.data.issued_on) : ''}</dd></div>
              <div><dt className="text-xs font-bold uppercase tracking-wider text-sage-600">Issued by</dt><dd className="font-semibold text-sage-900">{res.data.issuer}</dd></div>
            </dl>
          </div>
        )}

        {res.status === 'ready' && res.data?.valid === false && (
          <p role="alert" className="flex items-start gap-2 text-sm font-semibold text-red-800"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /> This credential is no longer valid.</p>
        )}

        {res.status === 'notfound' && (
          <p role="alert" className="text-sm text-sage-800">We could not find a credential with this code. Check the code and try again.</p>
        )}

        {res.status === 'error' && (
          <div role="alert" className="space-y-3 text-sm text-sage-800">
            <p>{res.error ?? 'Something went wrong. Please try again.'}</p>
            <button type="button" onClick={res.reload} className="min-h-11 rounded-card bg-green-700 px-4 font-semibold text-white hover:bg-green-800">Try again</button>
          </div>
        )}

        <Link href="/" className="inline-block text-sm font-semibold text-copper-700 underline">Cofoundaz home</Link>
      </div>
    </main>
  );
}
