'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShellTopBar } from '@/components/shell-top-bar';

export default function MissionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { name: 'Today', href: '/mission' },
    { name: 'Upcoming', href: '/mission/upcoming' },
    { name: 'Completed', href: '/mission/completed' },
    { name: 'Streaks', href: '/mission/streaks' },
    { name: 'Settings', href: '/mission/settings' },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-surface-subtle text-ink min-h-screen">
      {/* Sticky Top Header & Tabs Wrapper */}
      <div className="sticky top-0 z-40 bg-surface-subtle">
        <ShellTopBar title="Today's Mission" />

        {/* Sticky Tab Navigation Bar */}
        <nav aria-label="Mission sections" className="border-b border-line-soft px-4 md:px-8 py-3 bg-surface-subtle">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-accent-200 text-ink font-semibold'
                      : 'bg-transparent text-ink-muted hover:bg-line-soft'
                  }`}
                >
                  {tab.name}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}
