'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useNotificationsPage } from '@/hooks/useNotificationsPage';
import { type EnrichedNotification } from '@/hooks/useNotifications';
import { ShellTopBar } from '@/components/shell-top-bar';
import { NotificationPreferencesGrid } from '@/components/notifications/notification-preferences-grid';
import { NotificationDigestTab } from '@/components/notifications/notification-digest-tab';
import { type NotificationFilter } from '@/lib/api/notifications';
import { Check, X, AlertCircle } from 'lucide-react';

type NotificationTab = 'Inbox' | 'Preferences' | 'Digest & quiet hours' | 'Archived';

const FILTER_CHIPS: Array<{ key: NotificationFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'urgent', label: 'Urgent' },
  { key: 'mentions', label: 'Mentions' },
  { key: 'ai', label: 'AI' },
  { key: 'deadlines', label: 'Deadlines' },
  { key: 'billing', label: 'Billing' },
];

export default function NotificationsPage(): React.JSX.Element {
  const router = useRouter();

  // Tab state - default is 'Inbox' per brief
  const [activeTab, setActiveTab] = useState<NotificationTab>('Inbox');

  // Deep links like ?tab=preferences or ?tab=digest
  useEffect(() => {
    const tabParam = new URLSearchParams(window.location.search).get('tab');
    const byParam: Record<string, NotificationTab> = {
      inbox: 'Inbox',
      preferences: 'Preferences',
      digest: 'Digest & quiet hours',
      archived: 'Archived',
    };
    if (tabParam && byParam[tabParam]) {
      queueMicrotask(() => setActiveTab(byParam[tabParam]));
    }
  }, []);

  const {
    items,
    archivedItems,
    counts,
    filter,
    setFilterCategory,
    nextCursor,
    archivedNextCursor,
    loading,
    archivedLoading,
    error,
    archivedError,
    fetchInbox,
    fetchArchived,
    loadMore,
    loadMoreArchived,
    markRead,
    markAllRead,
    archive,
    restore,
  } = useNotificationsPage();

  // Toast notification state (with optional undo)
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [undoAction, setUndoAction] = useState<(() => Promise<void>) | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string, undo?: () => Promise<void>): void => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    setUndoAction(undo ? () => undo : null);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      setUndoAction(null);
      toastTimerRef.current = null;
    }, 4500);
  }, []);

  // Clear toast timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  // When switching to Archived tab, trigger fetch
  useEffect(() => {
    if (activeTab === 'Archived') {
      queueMicrotask(() => {
        void fetchArchived();
      });
    }
  }, [activeTab, fetchArchived]);

  // Click on row - mark read regardless of href
  const handleRowClick = async (item: EnrichedNotification) => {
    if (!item.read) {
      await markRead(item.id);
    }
    if (item.href) {
      router.push(item.href);
    }
  };

  // Keyboard navigation for notification rows
  const handleRowKeyDown = (e: React.KeyboardEvent, item: EnrichedNotification) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      void handleRowClick(item);
    }
  };

  // Archive row click
  const handleArchiveClick = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const ok = await archive(id);
    if (ok) {
      showToast('Archived', async () => {
        await restore(id);
        showToast('Restored');
      });
    } else {
      showToast('Could not archive notification.');
    }
  };

  // Restore row click
  const handleRestoreClick = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const ok = await restore(id);
    if (ok) {
      showToast('Restored');
    } else {
      showToast('Could not restore notification.');
    }
  };

  // Mark all read with safe error handling
  const handleMarkAllReadClick = async () => {
    try {
      await markAllRead();
      showToast('All caught up.');
    } catch {
      showToast('Could not mark all as read. Try again.');
    }
  };

  // Group items by section (TODAY / THIS WEEK / EARLIER)
  const groupedInbox = useMemo(() => {
    const today: EnrichedNotification[] = [];
    const thisWeek: EnrichedNotification[] = [];
    const earlier: EnrichedNotification[] = [];

    items.forEach((item) => {
      if (item.section === 'TODAY') today.push(item);
      else if (item.section === 'THIS WEEK') thisWeek.push(item);
      else earlier.push(item);
    });

    return [
      { title: 'Today', list: today },
      { title: 'This week', list: thisWeek },
      { title: 'Earlier', list: earlier },
    ].filter((g) => g.list.length > 0);
  }, [items]);

  const urgentUnreadCount = counts.urgent_unread ?? 0;

  return (
    <div className="min-h-screen bg-surface-faint text-ink font-body antialiased relative selection:bg-accent-200">
      <ShellTopBar title="Notifications" />

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-brand-900 text-white px-5 py-3 rounded-[24px] shadow-accent flex items-center space-x-3 text-sm font-medium transition-all duration-300 border border-brand-x1e4231">
          <span className="w-4 h-4 rounded-full bg-brand-x1c4230 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            ✓
          </span>
          <span>{toastMessage}</span>
          {undoAction && (
            <button
              type="button"
              onClick={async () => {
                await undoAction();
                setToastMessage(null);
                setUndoAction(null);
              }}
              className="text-brand-300 hover:text-white underline font-semibold ml-2 cursor-pointer"
            >
              Undo
            </button>
          )}
        </div>
      )}

      {/* Tabs Navigation */}
      <nav className="w-full bg-surface-subtle border-b border-line px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
          {(['Inbox', 'Preferences', 'Digest & quiet hours', 'Archived'] as NotificationTab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={
                  isActive
                    ? 'px-4 py-1.5 rounded-full text-xs font-semibold bg-accent-200 text-ink shadow-card transition-colors shrink-0 cursor-pointer'
                    : 'px-4 py-1.5 rounded-full text-xs font-medium text-ink-muted hover:bg-neutral-xefefee transition-colors shrink-0 cursor-pointer'
                }
              >
                {tab}
              </button>
            );
          })}
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-8">
        {/* ================================= TAB 1: INBOX ================================= */}
        {activeTab === 'Inbox' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Heading line & mark all read */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-4">
              <div>
                <h1 className="text-3xl font-display text-ink-strong tracking-tight">Notifications</h1>
                <p className="text-xs text-ink-subtle mt-0.5">
                  {counts.unread === 0
                    ? 'Nothing unread'
                    : `${counts.unread} unread · ${urgentUnreadCount} need you today`}
                </p>
              </div>

              <div className="flex items-center space-x-2.5">
                {counts.unread > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllReadClick}
                    className="px-3 py-1.5 rounded-modal text-xs font-semibold border border-line bg-white hover:bg-neutral-50 text-ink shadow-card transition-colors cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('Preferences')}
                  className="px-3 py-1.5 rounded-modal text-xs font-semibold border border-line bg-white hover:bg-neutral-50 text-ink shadow-card transition-colors cursor-pointer"
                >
                  Preferences
                </button>
              </div>
            </div>

            {/* Filter chips with counts from /counts */}
            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
              {FILTER_CHIPS.map((chip) => {
                const isActive = filter === chip.key;
                const countVal = counts[chip.key] ?? 0;

                return (
                  <button
                    key={chip.key}
                    onClick={() => setFilterCategory(chip.key)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center space-x-1.5 shrink-0 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-ink text-white shadow-card font-semibold'
                        : 'bg-white border border-line hover:bg-neutral-50 text-ink'
                    }`}
                  >
                    <span>{chip.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-neutral-100 text-ink-subtle'}`}>
                      {countVal}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Error state */}
            {error && (
              <div className="p-4 bg-danger-50 border border-danger-200 rounded-card flex items-center justify-between text-xs text-danger-800">
                <div className="flex items-center space-x-2">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void fetchInbox(filter)}
                  className="font-semibold underline cursor-pointer ml-3"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Loading skeletons */}
            {loading && items.length === 0 && (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-white border border-line rounded-[24px] p-5 shadow-card space-y-2 animate-pulse">
                    <div className="h-4 bg-neutral-200 rounded w-1/3" />
                    <div className="h-3 bg-neutral-100 rounded w-2/3" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && items.length === 0 && !error && (
              <div className="bg-white border border-line rounded-[24px] p-12 text-center shadow-card space-y-2">
                <p className="text-xs text-ink-muted leading-relaxed">
                  {filter === 'all'
                    ? 'All clear. Anything that needs you will show up here.'
                    : 'Nothing here.'}
                </p>
              </div>
            )}

            {/* Grouped Notifications List */}
            {groupedInbox.map((group) => (
              <div key={group.title} className="space-y-3">
                <h3 className="text-[10px] font-bold tracking-wider text-ink-subtle uppercase px-1">
                  {group.title}
                </h3>

                <div className="space-y-2.5">
                  {group.list.map((item) => (
                    <div
                      key={item.id}
                      tabIndex={0}
                      role="button"
                      aria-label={`${item.title}${item.body ? `: ${item.body}` : ''}`}
                      onClick={() => void handleRowClick(item)}
                      onKeyDown={(e) => handleRowKeyDown(e, item)}
                      className={`border rounded-[20px] p-4 flex items-start justify-between gap-4 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                        item.isCritical
                          ? 'border-l-4 border-l-accent-gold bg-accent-xfdf8f2 border-accent-xebe3d3 shadow-card'
                          : 'border-line bg-white shadow-card hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-start space-x-3.5 min-w-0">
                        {/* Module Icon */}
                        <div
                          className={`w-9 h-9 rounded-card flex items-center justify-center text-sm shrink-0 shadow-card ${item.iconBg}`}
                        >
                          {item.iconText}
                        </div>

                        {/* Title & Body */}
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-xs font-semibold text-ink leading-snug break-words">
                              {item.title}
                            </h4>
                            {!item.read && (
                              <span className="w-2 h-2 rounded-full bg-brand-strong shrink-0" />
                            )}
                          </div>
                          {item.body ? (
                            <p className="text-xs text-ink-muted leading-relaxed break-words">
                              {item.body}
                            </p>
                          ) : null}
                          <div className="flex items-center space-x-3 pt-0.5 text-[11px] text-ink-subtle">
                            <span>{item.time}</span>
                            {item.actionText && (
                              <span className="text-brand-strong font-semibold">
                                {item.actionText} →
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Row actions */}
                      <div className="flex items-center space-x-1 shrink-0 pt-0.5">
                        {!item.read && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void markRead(item.id);
                            }}
                            title="Mark as read"
                            aria-label="Mark as read"
                            className="w-7 h-7 rounded-card border border-line bg-white hover:bg-neutral-50 text-ink flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => void handleArchiveClick(e, item.id)}
                          title="Archive"
                          aria-label="Archive notification"
                          className="w-7 h-7 rounded-card border border-line bg-white hover:bg-neutral-50 text-ink-muted hover:text-ink flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Load more button */}
            {nextCursor && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void loadMore()}
                  className="px-6 py-2.5 bg-white border border-line rounded-modal text-xs font-semibold text-ink hover:bg-neutral-50 transition-colors cursor-pointer shadow-card disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================================= TAB 2: PREFERENCES ================================= */}
        {activeTab === 'Preferences' && (
          <NotificationPreferencesGrid onErrorToast={showToast} />
        )}

        {/* ================================= TAB 3: DIGEST & QUIET HOURS ================================= */}
        {activeTab === 'Digest & quiet hours' && (
          <NotificationDigestTab onErrorToast={showToast} />
        )}

        {/* ================================= TAB 4: ARCHIVED ================================= */}
        {activeTab === 'Archived' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h1 className="text-3xl font-display text-ink-strong tracking-tight">Archived notifications</h1>
              <p className="text-xs text-ink-subtle mt-0.5">
                Past notifications you dismissed from your inbox.
              </p>
            </div>

            {archivedError && (
              <div className="p-4 bg-danger-50 border border-danger-200 rounded-card flex items-center justify-between text-xs text-danger-800">
                <div className="flex items-center space-x-2">
                  <AlertCircle size={16} />
                  <span>{archivedError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void fetchArchived()}
                  className="font-semibold underline cursor-pointer ml-3"
                >
                  Retry
                </button>
              </div>
            )}

            {archivedLoading && archivedItems.length === 0 && (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-white border border-line rounded-[24px] p-5 shadow-card space-y-2 animate-pulse">
                    <div className="h-4 bg-neutral-200 rounded w-1/3" />
                    <div className="h-3 bg-neutral-100 rounded w-2/3" />
                  </div>
                ))}
              </div>
            )}

            {!archivedLoading && archivedItems.length === 0 && !archivedError && (
              <div className="bg-white border border-line rounded-[24px] p-12 text-center shadow-card">
                <p className="text-xs text-ink-muted">Nothing archived.</p>
              </div>
            )}

            <div className="space-y-2.5">
              {archivedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-line rounded-[20px] p-4 flex items-center justify-between gap-4 shadow-card"
                >
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="text-xs font-semibold text-ink leading-snug break-words">
                      {item.title}
                    </h4>
                    <span className="text-[11px] text-ink-subtle">{item.time}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => void handleRestoreClick(e, item.id)}
                    className="px-3 py-1.5 bg-white border border-line hover:bg-neutral-50 rounded-modal text-xs font-semibold text-ink transition-colors cursor-pointer shrink-0 shadow-card"
                  >
                    Restore
                  </button>
                </div>
              ))}
            </div>

            {archivedNextCursor && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  disabled={archivedLoading}
                  onClick={() => void loadMoreArchived()}
                  className="px-6 py-2.5 bg-white border border-line rounded-modal text-xs font-semibold text-ink hover:bg-neutral-50 transition-colors cursor-pointer shadow-card disabled:opacity-50"
                >
                  {archivedLoading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
