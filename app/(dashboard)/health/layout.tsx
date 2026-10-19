'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShellTopBar } from '@/components/shell-top-bar';
import { HealthScoreProvider } from '@/components/health/health-score-provider';

const TABS = [
  { name: 'Overview', href: '/health' },
  { name: 'Dimensions', href: '/health/dimensions/product' }, // lands on Product
  { name: 'Trend history', href: '/health/history' },
  { name: 'Benchmarks', href: '/health/benchmarks' },
  { name: 'Recommendations', href: '/health/recommendations' },
];

export default function HealthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <HealthScoreProvider>
      <div className="flex-1 flex flex-col min-w-0 bg-[#F7F7F5] text-[#1E2923] min-h-screen">
        <div className="sticky top-0 z-40 bg-[#F7F7F5]">
          <ShellTopBar title="Health Score" />

          <nav aria-label="Health Score sections" className="border-b border-[#EBEBE6] px-4 md:px-8 py-3 bg-[#F7F7F5]">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {TABS.map((tab) => {
                // Every /health/dimensions/* route keeps the Dimensions tab lit.
                const isActive =
                  tab.name === 'Dimensions' ? pathname.startsWith('/health/dimensions') : pathname === tab.href;
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

        <main className="p-4 md:p-8 max-w-6xl w-full mx-auto flex-1 flex flex-col gap-8">{children}</main>
      </div>
    </HealthScoreProvider>
  );
}
