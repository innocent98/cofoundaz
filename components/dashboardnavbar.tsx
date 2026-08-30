'use client';

import React from 'react';
import { Search, Bell, Plus, Sparkles } from 'lucide-react';

interface DashboardNavbarProps {
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSearchOpen: (open: boolean) => void;
  setIsInviteOpen: (open: boolean) => void;
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

export function DashboardNavbar({
  isNotificationsOpen,
  setIsNotificationsOpen,
  setIsSearchOpen,
  setIsInviteOpen,
  isSidebarOpen = false,
  setIsSidebarOpen,
}: DashboardNavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full shrink-0 bg-white border-b border-sage-200/80 px-4 md:px-8 py-2.5 flex items-center justify-between gap-4 shadow-card">
      {/* Brand icon — opens the sidebar on mobile/tablet */}
      <button
        type="button"
        onClick={() => setIsSidebarOpen && setIsSidebarOpen(true)}
        aria-label="Open sidebar"
        aria-expanded={isSidebarOpen}
        className="lg:hidden shrink-0 bg-[#1C3B2B] text-[#D89A6E] font-bold h-9 w-9 flex items-center justify-center rounded-card text-lg hover:bg-[#25503a] transition-colors cursor-pointer"
      >
        C
      </button>

      {/* Breadcrumbs */}
      <div className="hidden md:block text-sm text-sage-500 font-normal shrink-0">
        Workspace <span className="text-sage-300 mx-0.5">/</span>{' '}
        <span className="text-black font-semibold">Dashboard</span>
      </div>

      {/* Search Bar Trigger */}
      <button
        type="button"
        onClick={() => setIsSearchOpen(true)}
        className="flex-1 max-w-lg flex items-center justify-between bg-[#F0F5F2] border border-[#E2EBE6] rounded-card px-3.5 py-1.5 text-xs text-sage-600 cursor-pointer hover:border-sage-300 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-sage-500 stroke-[1.75]" />
          <span className="text-sage-600">Search anything....</span>
        </div>
        <kbd className="bg-white border border-sage-200 rounded-input px-1.5 py-0.5 text-[10px] text-sage-600 font-body shadow-card">
          ⌘K
        </kbd>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Health Badge */}
        <div className="hidden md:flex items-center gap-1.5 bg-[#E4EFE9] text-[#114B32] font-medium text-xs px-3.5 py-1.5 rounded-full">
          <span>Health</span>
          <span className="text-sm font-bold text-black">72</span>
          <span className="text-[10px]">↑</span>
        </div>

        {/* Notification Bell */}
        <button
          type="button"
          aria-label="Toggle notifications"
          onClick={() => setIsNotificationsOpen((prev) => !prev)}
          className="relative p-2 bg-white border border-sage-200 rounded-card hover:bg-sage-50 text-sage-700 transition-colors"
        >
          <Bell className="w-4 h-4 text-sage-700" />
          <span className="absolute -top-1 -right-1 bg-[#9C5B34] text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center border border-white">
            5
          </span>
        </button>

        {/* Invite Button */}
        <button
          type="button"
          onClick={() => setIsInviteOpen(true)}
          className="flex items-center gap-1 bg-[#9C5B34] hover:bg-[#9C5B34] text-black font-semibold text-xs px-3.5 py-1.5 rounded-card transition-colors shadow-card"
        >
          <Plus className="w-3.5 h-3.5 text-black stroke-[2.5]" /> Invite
        </button>
      </div>

      {/* NOTIFICATIONS DROPDOWN */}
      {isNotificationsOpen && (
        <div className="absolute top-14 right-4 md:right-8 z-50 w-80 md:w-96 bg-white border border-sage-100 rounded-modal shadow-raised p-4">
          <div className="flex items-center justify-between pb-3 border-b border-sage-100 mb-2">
            <h4 className="font-bold text-sm text-sage-900">Notifications</h4>
            <button type="button" className="text-xs font-semibold text-[#114B32] hover:underline">
              Mark all read
            </button>
          </div>
          <div className="space-y-1">
            <div className="flex items-start gap-3 p-2.5 rounded-card bg-[#F5EEDC]">
              <div className="p-1.5 bg-[#114B32] text-white rounded-input mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-medium text-sage-900">Your daily AI briefing is ready.</p>
                <span className="text-[10px] text-sage-400">10 min ago</span>
              </div>
            </div>
            <div className="flex items-start gap-3 p-2.5 rounded-card hover:bg-sage-50">
              <div className="p-1.5 bg-[#E8F3EE] text-[#114B32] rounded-input mt-0.5 font-bold text-xs">
                ₦
              </div>
              <div>
                <p className="text-xs font-medium text-sage-900">Runway dropped below 9 months, worth a look.</p>
                <span className="text-[10px] text-sage-400">1h ago</span>
              </div>
            </div>
            <div className="flex items-start gap-3 p-2.5 rounded-card hover:bg-sage-50">
              <div className="p-1.5 bg-[#E8F3EE] text-[#114B32] rounded-input mt-0.5 font-bold text-xs">
                §
              </div>
              <div>
                <p className="text-xs font-medium text-sage-900">Tayo returned your NDA with 2 comments.</p>
                <span className="text-[10px] text-sage-400">5h ago</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}