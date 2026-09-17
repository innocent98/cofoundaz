'use client';

import React from 'react';
import { Search, Bell, Plus, Sparkles } from 'lucide-react';
import { useSidebar } from '@/components/sidebar-context';
import { useHealthScore } from '@/hooks/useHealthScore';

interface DashboardNavbarProps {
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSearchOpen: (open: boolean) => void;
  setIsInviteOpen: (open: boolean) => void;
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  notifications?: import('@/app/(dashboard)/dashboard/page').NotificationItem[];
  markAllNotificationsRead?: () => void;
}

export function DashboardNavbar({
  isNotificationsOpen,
  setIsNotificationsOpen,
  setIsSearchOpen,
  setIsInviteOpen,
  isSidebarOpen = false,
  setIsSidebarOpen,
  notifications = [],
  markAllNotificationsRead,
}: DashboardNavbarProps) {
  const sidebar = useSidebar();
  const unreadCount = notifications.filter(n => n.unread).length;
  // Real Health Score (GET /health-score). Hidden until an assessment exists —
  // no fabricated number in the shell while status is pending/loading.
  const { data: health, loading: healthLoading } = useHealthScore();
  const showHealth = !healthLoading && health.status === 'ok';

  return (
    <header className="sticky top-0 z-40 w-full shrink-0 bg-white border-b border-sage-200/80 px-4 md:px-8 py-2.5 flex items-center justify-between gap-4 shadow-card">
      {/* Brand icon — opens the sidebar on mobile/tablet */}
      <button
        type="button"
        onClick={() => sidebar.openSidebar()}
        aria-label="Open sidebar"
        className="lg:hidden shrink-0 bg-[#1C3B2B] text-[#D89A6E] font-bold h-9 w-9 flex items-center justify-center rounded-card text-lg hover:bg-[#25503a] transition-colors cursor-pointer"
      >
        C
      </button>

      {/* Breadcrumbs */}
      <div className="hidden md:block text-sm text-sage-500 font-normal shrink-0">
        Workspace <span className="text-sage-300 mx-0.5">/</span>{' '}
        <span className="text-sage-900 font-semibold">Dashboard</span>
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
      <div className="flex items-center gap-4 shrink-0">
        {/* Health Badge — real score, only once an assessment exists */}
        {showHealth && (
          <div className="bg-[#E3EFE9] text-[#12291F] px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 h-[34px]">
            <span>Health</span>
            <span className="font-bold">{health.score}</span>
            {health.weeklyDelta !== 0 && (
              <span className={`font-bold ${health.weeklyDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {health.weeklyDelta > 0 ? '↑' : '↓'}
              </span>
            )}
          </div>
        )}

        {/* Notification Bell */}
        <button
          type="button"
          aria-label="Toggle notifications"
          onClick={() => setIsNotificationsOpen((prev) => !prev)}
          className="relative w-9 h-9 rounded-full border border-[#DCE6E1] bg-white flex items-center justify-center cursor-pointer hover:bg-sage-50 transition-colors"
        >
          <Bell className="w-4 h-4 text-[#66756F]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#12291F] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Invite Button */}
        <button
          type="button"
          onClick={() => setIsInviteOpen(true)}
          className="bg-copper-600 text-white font-semibold text-xs px-4 h-[36px] rounded-input hover:bg-copper-700 transition-colors"
        >
          + Invite
        </button>
      </div>

      {/* NOTIFICATIONS DROPDOWN */}
      {isNotificationsOpen && (
        <div className="absolute top-14 right-4 md:right-8 z-50 w-80 md:w-96 bg-white border border-sage-100 rounded-modal shadow-raised p-4">
          <div className="flex items-center justify-between pb-3 border-b border-sage-100 mb-2">
            <h4 className="font-bold text-sm text-sage-900">Notifications</h4>
            {unreadCount > 0 && (
              <button 
                type="button" 
                onClick={markAllNotificationsRead}
                className="text-xs font-semibold text-[#114B32] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-[var(--sage-500)]">
              No new notifications.
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((n) => (
                <div key={n.id} className={`flex items-start gap-3 p-2.5 rounded-card transition-colors ${n.unread ? 'bg-[#F5EEDC]' : 'hover:bg-sage-50'}`}>
                  {n.type === 'ai' && (
                    <div className="p-1.5 bg-[#114B32] text-white rounded-input mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}
                  {n.type === 'finance' && (
                    <div className="p-1.5 bg-[#E8F3EE] text-[#114B32] rounded-input mt-0.5 font-bold text-xs flex items-center justify-center w-[26px] h-[26px]">
                      ₦
                    </div>
                  )}
                  {(n.type === 'legal' || n.type === 'funding') && (
                    <div className="p-1.5 bg-[#E8F3EE] text-[#114B32] rounded-input mt-0.5 font-bold text-xs flex items-center justify-center w-[26px] h-[26px]">
                      §
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${n.unread ? 'text-sage-900' : 'text-sage-700'}`}>{n.title}</p>
                    <span className="text-[10px] text-sage-400">{n.time}</span>
                  </div>
                  {n.unread && <div className="w-2 h-2 rounded-full bg-[#114B32] mt-1.5 shrink-0" />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
}