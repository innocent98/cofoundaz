'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWorkspace } from '@/components/workspace-context';
import { NAV_ROLES, canOpenPath, routeKeyFor } from '@/lib/nav-access';

/**
 * Keeps a role out of sections its sidebar already hides when it types the URL.
 * The server still enforces every route; this only avoids rendering a page the
 * role cannot use. While the profile loads, gated sections render nothing (no
 * flash of content); once loading ends with an unknown role, everything shows,
 * matching `canSee`.
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const { role, loading } = useWorkspace();

  if (loading) {
    const key = routeKeyFor(pathname);
    // Sections open to every role need no wait.
    if (key !== null && NAV_ROLES[key].length < 7) {
      return <div role="status" aria-label="Loading" className="min-h-[50vh]" />;
    }
    return <>{children}</>;
  }
  if (role === null || canOpenPath(pathname, role)) return <>{children}</>;

  return (
    <div role="alert" className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-2xl font-display font-semibold text-ink">You don&apos;t have access to this page.</h2>
      <p className="text-sm text-ink-muted">Your role in this workspace doesn&apos;t include this section.</p>
      <Link
        href="/dashboard"
        className="rounded-card bg-accent-600 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-700"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
