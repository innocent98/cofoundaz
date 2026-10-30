'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { useWorkspace } from '@/components/workspace-context';
import { CalendarToastProvider } from '@/components/calendar/toast';
import { CalendarSubNav } from '@/components/calendar/sub-nav';
import { useSyncStatus } from '@/hooks/useCalendarApi';
import { canManageCalendar } from '@/lib/calendar-format';

function NeedsAttentionBanner() {
  const pathname = usePathname();
  const { data, reload } = useSyncStatus();
  // The layout outlives page changes, so ask again on each one: the banner must not show a stale state.
  useEffect(() => {
    reload();
  }, [pathname, reload]);
  if (pathname.startsWith('/calendar/sync') || !data?.google.needs_attention) return null;
  return (
    <div role="alert" className="mx-6 mt-4 flex flex-wrap items-center gap-3 rounded-modal border border-danger-bold bg-danger-tint px-4 py-3 text-xs text-danger-bold">
      <AlertTriangle size={16} aria-hidden />
      <span className="font-semibold">Google no longer allows access. Reconnect to resume syncing.</span>
      <Link href="/calendar/sync" className="underline font-semibold">Reconnect</Link>
    </div>
  );
}

/**
 * Founders and team members get all five Calendar pages. Every other role can only read the meetings
 * they are invited to (the API answers 403 for the rest), so they get Meetings alone.
 */
export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  const { role, loading } = useWorkspace();
  const pathname = usePathname();
  const router = useRouter();
  const full = canManageCalendar(role);
  const onMeetings = pathname.startsWith('/calendar/meetings');

  useEffect(() => {
    if (!loading && role !== null && !full && !onMeetings) router.replace('/calendar/meetings');
  }, [loading, role, full, onMeetings, router]);

  if (loading || (role !== null && !full && !onMeetings)) {
    return <div role="status" aria-label="Loading" className="min-h-[50vh]" />;
  }

  return (
    <CalendarToastProvider>
      <CalendarSubNav full={full} />
      {full && <NeedsAttentionBanner />}
      {children}
    </CalendarToastProvider>
  );
}
