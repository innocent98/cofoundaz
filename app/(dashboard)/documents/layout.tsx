'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShellTopBar } from '@/components/shell-top-bar';
import { useWorkspace } from '@/components/workspace-context';
import { hasFullLibrary } from '@/lib/api/documents';
import { ToastProvider } from './ToastContext';

const FULL_TABS = [
  { name: 'Library', path: '/documents' },
  { name: 'Templates', path: '/documents/templates' },
  { name: 'Signatures', path: '/documents/signatures' },
  { name: 'Shared with others', path: '/documents/shared' },
  { name: 'Shared with me', path: '/documents/shared-with-me' },
];
const GRANTEE_TABS = [{ name: 'Shared with me', path: '/documents/shared-with-me' }];

const UUID = /^\/documents\/([0-9a-f-]{36})\/?$/i;

function DocumentsNav({ full }: { full: boolean }) {
  const pathname = usePathname();
  const tabs = full ? FULL_TABS : GRANTEE_TABS;
  return (
    <nav aria-label="Documents sections" className="w-full bg-neutral-50 border-b border-neutral-200 px-4 md:px-6 py-1 flex items-center overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        {tabs.map((tab) => {
          const isActive = tab.path === '/documents/shared-with-me' ? pathname.startsWith(tab.path) : pathname === tab.path;
          return (
            <Link
              key={tab.name}
              href={tab.path}
              aria-current={isActive ? 'page' : undefined}
              className={
                isActive
                  ? 'inline-flex items-center min-h-11 px-4 rounded-full text-xs font-semibold bg-accent-200 text-ink shadow-card transition-colors'
                  : 'inline-flex items-center min-h-11 px-4 rounded-full text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors'
              }
            >
              {tab.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Founders and team members get the full library. Every other role may only open
 * Shared with me (the owner routes answer 403 for them), so anything else under
 * /documents sends them there, and a bell link to a document opens its shared view.
 */
function RoleGate({ children }: { children: React.ReactNode }) {
  const { role, loading } = useWorkspace();
  const pathname = usePathname();
  const router = useRouter();
  const known = !loading; // an account with no role here (e.g. an outside investor) is a grantee
  const full = hasFullLibrary(role);
  const inSharedWithMe = pathname.startsWith('/documents/shared-with-me');

  useEffect(() => {
    if (!known || full || inSharedWithMe) return;
    const m = UUID.exec(pathname);
    router.replace(m ? `/documents/shared-with-me/${m[1]}` : '/documents/shared-with-me');
  }, [known, full, inSharedWithMe, pathname, router]);

  return (
    <>
      <DocumentsNav full={full || !known} />
      {!known ? (
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 animate-pulse" aria-label="Loading documents">
          <div className="h-8 w-48 bg-surface-muted rounded mb-6" />
          <div className="h-40 bg-white border border-line rounded-modal" />
        </div>
      ) : !full && !inSharedWithMe ? null : (
        children
      )}
    </>
  );
}

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-neutral-50 text-ink font-body antialiased relative selection:bg-accent-200">
        <ShellTopBar title="Documents" />
        <RoleGate>{children}</RoleGate>
      </div>
    </ToastProvider>
  );
}
