'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

/**
 * The header notification bell used across the dashboard shells. Links to
 * /notifications and shows the real unread count (GET /notifications/unread-count)
 * — the badge hides at 0 rather than showing a hardcoded number.
 */
export function NotificationBell({
  className = 'relative w-9 h-9 rounded-full border border-neutral-xdce6e1 bg-white flex items-center justify-center cursor-pointer hover:bg-neutral-50 transition-colors',
  iconClassName = 'w-4 h-4 text-neutral-x66756f',
}: {
  className?: string;
  iconClassName?: string;
}) {
  const { unreadCount } = useNotifications();
  return (
    <Link href="/notifications" aria-label="Notifications" className={className}>
      <Bell className={iconClassName} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-brand-900 text-white text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-bold">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
