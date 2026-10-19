'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShellTopBar } from '@/components/shell-top-bar';

export default function RoadmapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { name: 'Timeline', href: '/roadmap' },
    { name: 'Kanban', href: '/roadmap/kanban' },
    { name: 'Milestones', href: '/roadmap/milestones' },
    { name: 'Dependencies', href: '/roadmap/dependencies' },
    { name: 'Templates', href: '/roadmap/templates' },
    { name: 'Re-Plan', href: '/roadmap/replan' },
  ];

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F7F7F5] text-[#1E2923] min-h-screen">
      {/* Sticky Top Header & Tabs Wrapper */}
      <div className="sticky top-0 z-40 bg-[#F7F7F5]">
        <ShellTopBar title="Roadmap" />

        {/* Sticky Tab Navigation Bar */}
        <nav aria-label="Roadmap sections" className="border-b border-[#EBEBE6] px-4 md:px-8 py-3 bg-[#F7F7F5]">
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
                      ? 'bg-[#EAD5C6] text-[#1E2923] font-semibold'
                      : 'bg-transparent text-[#617065] hover:bg-[#EBEBE6]'
                  }`}
                >
                  {tab.name}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <main className="p-4 md:p-8 w-full flex-1 flex flex-col gap-8 relative overflow-hidden">
        {children}
      </main>
    </div>
  );
}
