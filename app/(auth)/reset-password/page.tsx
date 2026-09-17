'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

// The canonical reset link is now `/reset-password/{token}` (path). This flat
// route stays for legacy `?token=` links and for landing here with no token
// (the form renders its "request a new link" state).
function ResetPasswordQuery() {
  const token = useSearchParams().get('token') || '';
  return <ResetPasswordForm token={token} />;
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-sage-400">Loading…</div>}>
      <ResetPasswordQuery />
    </Suspense>
  );
}
