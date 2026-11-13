'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';

export const MFA_BANNER_COPY = 'Protect your startup: turn on two-factor sign-in. It takes a minute.';
const DISMISS_KEY = 'cf_mfa_banner_dismissed';

/**
 * D-AUTH-4: onboard first, then nag until 2FA is on. Shows only when the API
 * says `enabled: false` (unknown or errored never nags). "Not now" hides it for
 * this browser session only, so it comes back next time.
 */
export function MfaBanner() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let live = true;
    try {
      if (sessionStorage.getItem(DISMISS_KEY)) queueMicrotask(() => live && setDismissed(true));
    } catch {
      /* ignore storage errors */
    }
    apiClient<{ data?: { enabled?: boolean } }>('/auth/mfa')
      .then((r) => live && setEnabled(r?.data?.enabled ?? null))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  if (enabled !== false || dismissed) return null;
  return (
    <div
      role="region"
      aria-label="Protect your account"
      className="mb-6 flex flex-col gap-3 rounded-card border border-brand-200 bg-brand-50 px-5 py-4 md:flex-row md:items-center md:justify-between"
    >
      <p className="text-sm font-medium text-brand-900 leading-relaxed">{MFA_BANNER_COPY}</p>
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => {
            try {
              sessionStorage.setItem(DISMISS_KEY, '1');
            } catch {
              /* ignore storage errors */
            }
            setDismissed(true);
          }}
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          Not now
        </button>
        <Link
          href="/setup/mfa"
          className="rounded-input bg-brand-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
        >
          Turn on 2FA
        </Link>
      </div>
    </div>
  );
}
