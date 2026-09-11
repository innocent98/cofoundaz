'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Plus } from 'lucide-react';
import { useSidebar } from '@/components/sidebar-context';

export default function HealthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { openSidebar } = useSidebar();
  const pathname = usePathname();

  const tabs = [
    { name: 'Overview', href: '/health' },
    { name: 'Dimensions', href: '/health/dimensions/product' }, // Defaults to product
    { name: 'Trend history', href: '/health/history' },
    { name: 'Benchmarks', href: '/health/benchmarks' },
    { name: 'Recommendations', href: '/health/recommendations' },
  ];

  // Keep dimensions tab active if we are on any dimension route
  const isDimensionsActive = pathname.startsWith('/health/dimensions');

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F7F7F5] text-[#1E2923] min-h-screen">
      {/* Sticky Top Header & Tabs Wrapper */}
      <div className="sticky top-0 z-40 bg-[#F7F7F5]">
        {/* Main Header Bar */}
        <header className="bg-white border-b border-[#EBEBE6] px-4 md:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 shadow-card">
          <div className="flex items-center gap-3">
            <button
              onClick={openSidebar}
              className="lg:hidden w-10 h-10 rounded-modal bg-[#173B28] text-[#D89A6E] flex items-center justify-center font-bold text-base shadow-card hover:opacity-90 transition-opacity shrink-0"
              aria-label="Open sidebar"
            >
              C
            </button>

            <div className="flex items-center gap-2 sm:gap-2.5 text-xs sm:text-sm md:text-lg font-semibold">
              <span className="text-[#8E9B90]">Workspace</span>
              <span className="text-[#8E9B90]">/</span>
              <h1 className="text-[#1E2923] font-bold truncate">Health Score</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-[#E3EFE9] text-[#12291F] px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 h-[34px]">
              <span>Health</span>
              <span className="font-bold">72</span>
              <span className="text-emerald-600 font-bold">↑</span>
            </div>

            <button className="relative w-9 h-9 rounded-full border border-[#DCE6E1] bg-white flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
              <Bell className="w-4 h-4 text-[#66756F]" />
              <span className="absolute -top-1 -right-1 bg-[#12291F] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                5
              </span>
            </button>

            <button className="bg-[#A8894B] text-[#12291F] font-semibold text-xs px-4 h-[36px] rounded-[8px] hover:bg-[#967941] transition-colors">
              + Invite
            </button>
          </div>
        </header>

        {/* Sticky Tab Navigation Bar */}
        <div className="border-b border-[#EBEBE6] px-4 md:px-8 py-3 bg-[#F7F7F5]">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const isActive = tab.name === 'Dimensions' ? isDimensionsActive : pathname === tab.href;
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

      {/* Main Content */}
      <main className="p-4 md:p-8 max-w-6xl w-full mx-auto flex-1 flex flex-col gap-8">
        {children}
      </main>
    </div>
  );
}
