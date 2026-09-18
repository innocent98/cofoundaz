'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/components/sidebar-context';
import { Bell } from 'lucide-react';
import { useHealthScore } from '@/hooks/useHealthScore';

export default function MissionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { openSidebar } = useSidebar();
  const pathname = usePathname();
  const { data: health, loading: healthLoading } = useHealthScore();
  const showHealth = !healthLoading && health.status === 'ok';

  const tabs = [
    { name: 'Today', href: '/mission' },
    { name: 'Upcoming', href: '/mission/upcoming' },
    { name: 'Completed', href: '/mission/completed' },
    { name: 'Streaks', href: '/mission/streaks' },
    { name: 'Settings', href: '/mission/settings' },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F7F7F5] text-[#1E2923] min-h-screen">
      {/* Sticky Top Header & Tabs Wrapper */}
      <div className="sticky top-0 z-40 bg-[#F7F7F5]">
        {/* Main Header Bar */}
        <header className="bg-white border-b border-[#EBEBE6] px-4 md:px-8 py-3.5 flex items-center justify-between gap-4 shadow-card">
          <div className="flex items-center gap-3">
            <button
              onClick={openSidebar}
              className="lg:hidden w-10 h-10 rounded-modal bg-[#173B28] text-[#D89A6E] flex items-center justify-center font-bold text-base shadow-card hover:opacity-90 transition-opacity shrink-0"
              aria-label="Open sidebar"
            >
              C
            </button>
            <nav className="text-sm font-medium text-[var(--sage-500)] flex items-center gap-1.5">
              <span>Workspace</span>
              <span className="text-[var(--sage-300)]">/</span>
              <span className="text-[var(--evergreen-900)] font-semibold">Today&apos;s Mission</span>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Health Pill — real score, only once an assessment exists */}
            {showHealth && (
              <div className="px-3 py-1 rounded-full bg-[#e8f1ec] text-[#203a31] text-xs font-medium flex items-center gap-1">
                <span>Health</span>
                <span className="font-semibold">{health.score}</span>
                {health.weeklyDelta !== 0 && <span>{health.weeklyDelta > 0 ? '↑' : '↓'}</span>}
              </div>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button className="w-9 h-9 rounded-full border border-[var(--sage-200)] flex items-center justify-center bg-white text-[var(--sage-700)]">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 bg-[#1e3b30] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  5
                </span>
              </button>
            </div>

            {/* + Invite Button (maintain text label, avoid collapsing into a square button) */}
            <button className="px-3.5 py-1.5 rounded-card bg-[#a27e46] text-white text-xs font-medium hover:bg-[#8f6e3c] transition-colors flex items-center gap-1">
              <span>+ Invite</span>
            </button>
          </div>
        </header>

        {/* Sticky Tab Navigation Bar */}
        <div className="border-b border-[#EBEBE6] px-4 md:px-8 py-3 bg-[#F7F7F5]">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#EAD5C6] text-[#1E2923] font-semibold'
                      : 'bg-transparent text-[#617065] hover:bg-[#EBEBE6]'
                  }`}
                >
                  {tab.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Page Content */}
      {children}
    </div>
  );
}
