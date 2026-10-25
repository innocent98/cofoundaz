'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShellTopBar } from '@/components/shell-top-bar';
import { AiStatusBanner } from '@/components/ai/ai-status-banner';

export default function AICoFounderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { label: 'Chat', href: '/ai' },
    { label: 'Suggested actions', href: '/ai/suggestions' },
    { label: 'History', href: '/ai/history' },
    { label: 'Your bench', href: '/ai/agents' },
    { label: 'Settings', href: '/ai/settings' },
  ];

  return (
    <div className="min-h-screen bg-surface-faint text-ink">
      <div className="flex flex-col min-w-0">
        <ShellTopBar title="AI Co-Founder" />

        {/* Main Page Body */}
        <main className="p-4 md:p-6 lg:p-8 flex-1 flex flex-col">
          {/* Top Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-line-soft pb-2 mb-6 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-accent-xe9ddbe text-brand-900 shadow-card'
                      : 'text-neutral-500 hover:bg-accent-xf5eedc hover:text-brand-900'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          {/* Subtle over-budget status banner */}
          <AiStatusBanner className="mb-6" />

          {children}
        </main>
      </div>
    </div>
  );
}
