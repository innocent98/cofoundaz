'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/components/workspace-context';
import { apiClient } from '@/lib/api/client';

/**
 * Sends a founder who has not finished the wizard to /onboarding (gap 10): without a
 * finished workspace every dashboard card fails with "Couldn't load this".
 *
 * Only a person with no role yet (no workspace) or the founder role is checked; a member
 * of someone else's workspace never sees the wizard. While the check runs the page
 * renders as usual; an unreadable answer lets them through (the API still enforces access).
 */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { role, loading } = useWorkspace();
  const [checking, setChecking] = useState(true);

  const needsCheck = !loading && (role === null || role === 'founder');

  useEffect(() => {
    if (loading) return;
    if (!needsCheck) {
      queueMicrotask(() => setChecking(false));
      return;
    }
    let live = true;
    apiClient<{ data?: { completed?: boolean } }>('/onboarding/state')
      .then((r) => {
        if (!live) return;
        if (r?.data?.completed === false) router.replace('/onboarding');
        else setChecking(false);
      })
      .catch(() => live && setChecking(false));
    return () => {
      live = false;
    };
  }, [loading, needsCheck, router]);

  // Hold the page back only while a founder check is in flight, so nothing flashes "Couldn't load this".
  if (needsCheck && checking) {
    return <div role="status" aria-label="Loading" className="min-h-[50vh]" />;
  }
  return <>{children}</>;
}
