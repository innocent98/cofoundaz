'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/components/sidebar-context';
import { Bell } from 'lucide-react';

export default function AICoFounderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { openSidebar } = useSidebar();
  const pathname = usePathname();

  const tabs = [
    { label: 'Chat', href: '/ai' },
    { label: 'Suggested actions', href: '/ai/suggestions' },
    { label: 'History', href: '/ai/history' },
    { label: 'Your bench', href: '/ai/agents' },
    { label: 'Settings', href: '/ai/settings' },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#1E2923]">
      <div className="flex flex-col min-w-0">
        <header className="sticky top-0 z-40 bg-white border-b border-[#EBEBE6] px-4 md:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 shadow-card">
          <div className="flex items-center gap-3">
            {/* Mobile-Only Standalone Logo Button (triggers sidebar) */}
            <button
              onClick={openSidebar}
              className="lg:hidden w-10 h-10 rounded-modal bg-[#173B28] text-[#D89A6E] flex items-center justify-center font-bold text-base shadow-card hover:opacity-90 transition-opacity shrink-0"
              aria-label="Open sidebar"
            >
              C
            </button>

            {/* Responsive Breadcrumbs */}
            <div className="flex items-center gap-2 sm:gap-2.5 text-xs sm:text-sm md:text-lg font-semibold">
              <span className="text-[#8E9B90]">Workspace</span>
              <span className="text-[#8E9B90]">/</span>
              <h1 className="text-[#1E2923] font-bold truncate">AI Co-Founder</h1>
            </div>
          </div>

          {/* Header Right Actions */}
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

        {/* Main Page Body */}
        <main className="p-4 md:p-6 lg:p-8 flex-1 flex flex-col">
          {/* Top Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-[#EBEBE6] pb-2 mb-6 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#E9DDBE] text-[#12291F] shadow-sm'
                      : 'text-[#67716C] hover:bg-[#F5EEDC] hover:text-[#12291F]'
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
