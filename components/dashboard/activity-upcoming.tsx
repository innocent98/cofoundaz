'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarDays, Sparkles } from 'lucide-react';
import type { ActivityLogEntry, UpcomingItem } from '@/types/dashboard';
import { CardError, CardSkeleton } from './card-states';

export const ACTIVITY_EMPTY_COPY = 'Activity from you and your team will appear here.';

export const ACTIVITY_MORE_ERROR_COPY = "Couldn't load more activity.";

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ActivityCard({
  items,
  loading,
  error,
  onRetry,
  hasMore = false,
  loadingMore = false,
  moreError = false,
  onLoadMore,
}: {
  items: ActivityLogEntry[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  /** More (older) rows exist: the API returned a `next_cursor`. */
  hasMore?: boolean;
  loadingMore?: boolean;
  /** The last "Load more" failed; the rows already shown stay. */
  moreError?: boolean;
  onLoadMore?: () => void;
}) {
  if (loading && items.length === 0) return <CardSkeleton label="Loading Team activity" rows={3} />;
  if (error && items.length === 0) return <CardError title="Team activity" onRetry={onRetry} />;
  return (
    <div className="bg-white border border-sage-200/60 rounded-[24px] p-6 shadow-card flex flex-col justify-between">
      <div>
        <h3 className="font-bold text-base text-[#1D2A24] pb-4 border-b border-sage-100">Team activity</h3>
        {items.length === 0 ? (
          <p className="text-sm text-sage-500 py-6">{ACTIVITY_EMPTY_COPY}</p>
        ) : (
          <ul className="divide-y divide-sage-100">
            {items.map((a) => {
              const system = a.actor === 'System';
              return (
                <li key={a.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    {system ? (
                      <div className="w-7 h-7 rounded-full bg-[#9C5B34] flex items-center justify-center shrink-0" aria-hidden="true">
                        <Sparkles className="w-3.5 h-3.5 text-[#1F4D3A]" />
                      </div>
                    ) : (
                      <div
                        className="w-7 h-7 rounded-full bg-[#1F4D3A] text-white font-bold text-[10px] flex items-center justify-center shrink-0"
                        aria-hidden="true"
                      >
                        {initialsOf(a.actor)}
                      </div>
                    )}
                    <p className="text-xs text-sage-700 truncate">
                      {a.summary || (
                        <>
                          <span className="font-medium text-[#1D2A24]">{a.actor}</span>{' '}
                          {[a.verb, a.entity].filter(Boolean).join(' ')}
                        </>
                      )}
                    </p>
                  </div>
                  <span className="text-[11px] text-sage-500 shrink-0">{a.relativeTime}</span>
                </li>
              );
            })}
          </ul>
        )}
        {items.length > 0 && onLoadMore && (moreError || hasMore) && (
          <div className="pt-3 border-t border-sage-100 flex flex-col items-center gap-1" aria-live="polite">
            {moreError && <p role="alert" className="text-xs text-sage-600">{ACTIVITY_MORE_ERROR_COPY}</p>}
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loadingMore}
              aria-busy={loadingMore}
              className="min-h-[44px] px-3 text-sm font-bold text-[#266B4E] hover:text-[#12291F] underline cursor-pointer disabled:no-underline disabled:cursor-default disabled:text-sage-500"
            >
              {loadingMore ? 'Loading...' : moreError ? 'Retry' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/** "MMM D, YYYY" for a YYYY-MM-DD due date (PRD 1.3); null when there is none. */
export function formatDueDate(dueOn: string | null): string | null {
  if (!dueOn) return null;
  const [y, m, d] = dueOn.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

export function UpcomingCard({
  items,
  loading,
  error,
  onRetry,
}: {
  items: UpcomingItem[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  if (loading) return <CardSkeleton label="Loading Next 7 days" rows={3} />;
  if (error) return <CardError title="Next 7 days" onRetry={onRetry} />;
  return (
    <div className="bg-white border border-sage-200/60 rounded-[24px] p-6 shadow-card flex flex-col justify-between">
      <div>
        <h3 className="font-bold text-base text-[#1D2A24] pb-4 border-b border-sage-100">Next 7 days</h3>
        {items.length === 0 ? (
          <p className="text-xs text-sage-500 py-4">Nothing scheduled in the next 7 days.</p>
        ) : (
          <ul className="space-y-3.5 mt-3">
            {items.slice(0, 6).map((item) => {
              const due = formatDueDate(item.dueOn);
              return (
                <li key={item.id}>
                  <Link href="/roadmap/milestones" className="flex items-center gap-3 rounded-card hover:bg-sage-50 transition-colors -mx-1.5 px-1.5 py-1">
                    <div className="w-9 h-9 rounded-card bg-[#EAF2ED] text-[#1F4D3A] flex items-center justify-center shrink-0">
                      <CalendarDays className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1D2A24] truncate">{item.title || 'Untitled'}</p>
                      {due && <p className="text-[11px] text-sage-500">Due {due}</p>}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
