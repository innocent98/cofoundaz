'use client';

import React, {  } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShellTopBar } from '@/components/shell-top-bar';
import { ToastProvider, useToast } from './ToastContext';

function DocumentsNav() {
  const pathname = usePathname();
  const { triggerToast } = useToast();

  const tabs = [
    { name: 'Library', path: '/documents' },
    { name: 'Templates', path: '/documents/templates' },
    { name: 'Signatures', path: '/documents/signatures' },
    { name: 'Shared', path: '/documents/shared' },
  ];

  return (
    <nav className="w-full bg-neutral-50 border-b border-neutral-200 px-4 md:px-6 py-2 flex items-center overflow-x-auto no-scrollbar">
      <div className="flex items-center space-x-1.5 whitespace-nowrap">
        {tabs.map((tab) => {
          const isActive = pathname === tab.path;
          return (
            <Link
              key={tab.name}
              href={tab.path}
              onClick={() => {
                if (tab.name === 'Templates') {
                  triggerToast('Navigated to template page.');
                }
              }}
              className={
                isActive 
                  ? "px-3.5 py-1 rounded-full text-xs font-semibold bg-accent-200 text-ink shadow-card transition-colors"
                  : "px-3.5 py-1 rounded-full text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
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

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-neutral-50 text-ink font-body antialiased relative selection:bg-accent-200">
        <ShellTopBar title="Documents" />
        <DocumentsNav />
        {children}
      </div>
    </ToastProvider>
  );
}

