'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Search, Bell } from 'lucide-react';
import { useSidebar } from '@/components/sidebar-context';
import { useSearch } from '@/components/search/search-context';
import { useWorkspace } from '@/components/workspace-context';
import { useHealthScore } from '@/hooks/useHealthScore';
import { useNotifications } from '@/hooks/useNotifications';
import { SEARCH_PLACEHOLDER } from '@/components/search/search-overlay';
import { canInvite } from '@/lib/nav-access';

interface DashboardNavbarProps {
  onInvite: () => void;
  /** Current section, shown after "Workspace /" in the breadcrumb. */
  title?: string;
}

export function DashboardNavbar({ onInvite, title = 'Dashboard' }: DashboardNavbarProps) {
  const sidebar = useSidebar();
  const { openSearch } = useSearch();
  const { role } = useWorkspace();
  const { items, unreadCount, markRead, markAllRead, error: notifError, refetch: refetchNotifs } = useNotifications();
  // Real Health Score (GET /health-score). Hidden until an assessment exists,
  // so there is never a fabricated number in the shell.
  const { data: health, loading: healthLoading } = useHealthScore();
  const showHealth = !healthLoading && health.status === 'ok';

  const [bellOpen, setBellOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bellOpen) return;
    const onDown = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setBellOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [bellOpen]);

  const recent = items.slice(0, 8);

  return (
    <header className="sticky top-0 z-40 w-full shrink-0 bg-white border-b border-sage-200/80 px-4 md:px-8 py-2.5 flex items-center justify-between gap-3 md:gap-4 shadow-card">
      {/* Brand icon opens the sidebar on mobile/tablet */}
      <button
        type="button"
        onClick={() => sidebar.openSidebar()}
        aria-label="Open sidebar"
        className="lg:hidden shrink-0 bg-[#1C3B2B] text-[#D89A6E] font-bold h-9 w-9 flex items-center justify-center rounded-card text-lg hover:bg-[#25503a] transition-colors cursor-pointer"
      >
        C
      </button>

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="hidden md:block text-sm text-sage-500 font-normal shrink-0">
        Workspace <span className="text-sage-300 mx-0.5">/</span> <span className="text-sage-900 font-semibold">{title}</span>
      </nav>

      {/* Global search (⌘K) */}
      <button
        type="button"
        onClick={openSearch}
        aria-label="Search"
        aria-keyshortcuts="Meta+K Control+K"
        className="flex-1 min-w-0 max-w-lg flex items-center justify-between gap-2 bg-[#F0F5F2] border border-[#E2EBE6] rounded-card px-3.5 py-1.5 text-xs text-sage-600 cursor-pointer hover:border-sage-300 transition-colors text-left"
      >
        <span className="flex min-w-0 items-center gap-2">
          <Search className="w-3.5 h-3.5 shrink-0 text-sage-500 stroke-[1.75]" aria-hidden="true" />
          <span className="truncate text-sage-600">{SEARCH_PLACEHOLDER}</span>
        </span>
        <kbd className="hidden md:inline bg-white border border-sage-200 rounded-input px-1.5 py-0.5 text-[10px] text-sage-600 font-body shadow-card">⌘K</kbd>
      </button>

      <div className="flex items-center gap-3 md:gap-4 shrink-0">
        {showHealth && (
          <Link
            href="/health"
            aria-label={`Health score ${health.score}`}
            className="hidden md:flex bg-[#E3EFE9] text-[#12291F] px-3 py-1 rounded-full text-xs font-medium items-center gap-1.5 h-[34px] hover:bg-[#D5E7DF] transition-colors"
          >
            <span>Health</span>
            <span className="font-bold">{health.score}</span>
            {health.weeklyDelta !== 0 && (
              <span className={`font-bold ${health.weeklyDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {health.weeklyDelta > 0 ? '↑' : '↓'}
              </span>
            )}
          </Link>
        )}

        {/* Notification bell */}
        <div ref={bellRef} className="relative">
          <button
            type="button"
            aria-label="Toggle notifications"
            aria-expanded={bellOpen}
            aria-haspopup="true"
            onClick={() => setBellOpen((v) => !v)}
            className="relative w-9 h-9 rounded-full border border-[#DCE6E1] bg-white flex items-center justify-center cursor-pointer hover:bg-sage-50 transition-colors"
          >
            <Bell className="w-4 h-4 text-[#66756F]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#12291F] text-white text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="fixed inset-x-4 top-16 z-50 md:absolute md:inset-x-auto md:top-12 md:right-0 md:w-96 bg-white border border-sage-100 rounded-modal shadow-raised p-4">
              <div className="flex items-center justify-between pb-3 border-b border-sage-100 mb-2">
                <h4 className="font-bold text-sm text-sage-900">Notifications</h4>
                {unreadCount > 0 && (
                  <button type="button" onClick={markAllRead} className="text-xs font-semibold text-[#114B32] hover:underline cursor-pointer">
                    Mark all read
                  </button>
                )}
              </div>
              {(notifError || retrying) && recent.length === 0 ? (
                <div role="alert" className="p-4 text-center text-sm text-sage-700">
                  <p>Could not load notifications.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setRetrying(true);
                      void Promise.resolve(refetchNotifs()).finally(() => setRetrying(false));
                    }}
                    disabled={retrying}
                    className="mt-2 min-h-11 rounded-card bg-[#114B32] px-4 text-xs font-semibold text-white hover:bg-[#0e3e29] disabled:opacity-60"
                  >
                    {retrying ? 'Retrying...' : 'Retry'}
                  </button>
                </div>
              ) : recent.length === 0 ? (
                <div className="p-4 text-center text-sm text-sage-500">No new notifications.</div>
              ) : (
                <ul className="space-y-1 max-h-[60vh] overflow-y-auto">
                  {recent.map((n) => {
                    const body = (
                      <>
                        <div className={`w-[26px] h-[26px] shrink-0 rounded-input mt-0.5 flex items-center justify-center text-xs font-bold text-[#114B32] ${n.iconBg}`} aria-hidden="true">
                          {n.iconText}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium ${n.isUnread ? 'text-sage-900' : 'text-sage-700'}`}>{n.title}</p>
                          <span className="text-[10px] text-sage-500">{n.time}</span>
                        </div>
                        {n.isUnread && <div className="w-2 h-2 rounded-full bg-[#114B32] mt-1.5 shrink-0" aria-label="Unread" />}
                      </>
                    );
                    const cls = `flex items-start gap-3 p-2.5 rounded-card transition-colors ${n.isUnread ? 'bg-[#F5EEDC]' : 'hover:bg-sage-50'}`;
                    return (
                      <li key={n.id}>
                        {n.href ? (
                          <Link
                            href={n.href}
                            className={cls}
                            onClick={() => {
                              if (n.isUnread) void markRead(n.id);
                              setBellOpen(false);
                            }}
                          >
                            {body}
                          </Link>
                        ) : (
                          <button type="button" className={`${cls} w-full text-left cursor-pointer`} onClick={() => n.isUnread && void markRead(n.id)}>
                            {body}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              <Link
                href="/notifications"
                onClick={() => setBellOpen(false)}
                className="mt-3 block border-t border-sage-100 pt-3 text-center text-xs font-bold text-[#266B4E] hover:underline"
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>

        {canInvite(role) && (
          <button
            type="button"
            onClick={onInvite}
            className="bg-copper-600 text-white font-semibold text-xs px-3 md:px-4 h-[36px] rounded-input hover:bg-copper-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            + Invite
          </button>
        )}
      </div>
    </header>
  );
}
