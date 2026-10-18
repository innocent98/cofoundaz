'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Home, MoreHorizontal, Sparkles, Target } from 'lucide-react';
import { useSidebar } from '@/components/sidebar-context';
import { useWorkspace } from '@/components/workspace-context';
import { useNotifications } from '@/hooks/useNotifications';
import { canSee } from '@/lib/nav-access';

const tabClass = (active: boolean) =>
  `relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-semibold transition-colors ${
    active ? 'text-[#266B4E]' : 'text-sage-500 hover:text-sage-700'
  }`;

/**
 * PRD 2.1 region (F): bottom tab bar on small screens only: Home, Mission, AI,
 * Notifications, More. "More" opens the full sidebar. Tabs a role cannot open
 * are hidden, like the sidebar.
 */
export function MobileTabBar() {
  const pathname = usePathname() ?? '';
  const sidebar = useSidebar();
  const { role } = useWorkspace();
  const { unreadCount } = useNotifications();
  const on = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-sage-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-raised md:hidden">
      <Link href="/dashboard" className={tabClass(on('/dashboard'))} aria-current={on('/dashboard') ? 'page' : undefined}>
        <Home className="h-5 w-5" aria-hidden="true" />
        Home
      </Link>
      {canSee('/mission', role) && (
        <Link href="/mission" className={tabClass(on('/mission'))} aria-current={on('/mission') ? 'page' : undefined}>
          <Target className="h-5 w-5" aria-hidden="true" />
          Mission
        </Link>
      )}
      {canSee('/ai', role) && (
        <Link href="/ai" className={tabClass(on('/ai'))} aria-current={on('/ai') ? 'page' : undefined}>
          <Sparkles className="h-5 w-5" aria-hidden="true" />
          AI
        </Link>
      )}
      <Link href="/notifications" className={tabClass(on('/notifications'))} aria-current={on('/notifications') ? 'page' : undefined}>
        <span className="relative">
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#12291F] px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </span>
        Notifications
      </Link>
      <button type="button" onClick={() => sidebar.openSidebar()} className={`${tabClass(false)} cursor-pointer`}>
        <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
        More
      </button>
    </nav>
  );
}
