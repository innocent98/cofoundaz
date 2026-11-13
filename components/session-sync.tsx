'use client';

import { useEffect } from 'react';
import { onRemoteLogout } from '@/lib/auth/session';

/** Signing out in one tab signs out the others (BroadcastChannel): no stale shell left open on a dead session. */
export function SessionSync() {
  useEffect(() => onRemoteLogout(() => window.location.assign('/login')), []);
  return null;
}
