'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications } from '@/hooks/useNotifications';
import { ShellTopBar } from '@/components/shell-top-bar';
import { NotificationPreferences } from '@/components/notifications/notification-preferences';
import { Check, X, ChevronDown } from 'lucide-react';

type NotificationTab = 'Inbox' | 'Preferences' | 'Digest & quiet hours' | 'Announcements';
type FilterCategory = 'All' | 'Unread' | 'Urgent' | 'Missions' | 'Finance' | 'Team' | 'Marketing' | 'Sales';
type DigestMode = 'Off' | 'Daily' | 'Weekly';

interface AnnouncementItem {
  id: string;
  tag: 'NEW' | 'IMPROVED' | 'MAINTENANCE';
  tagBg: string;
  tagText: string;
  date: string;
  title: string;
  description: string;
  actionText?: string;
}

export default function NotificationsPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<NotificationTab>('Announcements'); // Default to Announcements as requested
  // Deep links like /notifications?tab=preferences (avatar menu "Preferences").
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    const byParam: Record<string, NotificationTab> = {
      inbox: 'Inbox',
      preferences: 'Preferences',
      digest: 'Digest & quiet hours',
      announcements: 'Announcements',
    };
    if (tab && byParam[tab]) queueMicrotask(() => setActiveTab(byParam[tab]));
  }, []);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Digest & Quiet Hours States
  const [digestMode, setDigestMode] = useState<DigestMode>('Daily');
  const [deliveryTime, setDeliveryTime] = useState<string>('6:00 AM');
  const [isDeliveryDropdownOpen, setIsDeliveryDropdownOpen] = useState<boolean>(false);

  const [isQuietHoursActive, setIsQuietHoursActive] = useState<boolean>(true);
  const [quietFrom, setQuietFrom] = useState<string>('8:00 PM');
  const [isFromDropdownOpen, setIsFromDropdownOpen] = useState<boolean>(false);

  const [quietUntil, setQuietUntil] = useState<string>('6:00 AM');
  const [isUntilDropdownOpen, setIsUntilDropdownOpen] = useState<boolean>(false);

  // Announcements list exactly matching the provided image
  const [announcements] = useState<AnnouncementItem[]>([
    {
      id: '1',
      tag: 'NEW',
      tagBg: 'bg-neutral-xf5efe6 text-accent-x7a5b30',
      tagText: 'NEW',
      date: 'Jul 22, 2026',
      title: 'The Funding Hub now tracks grants',
      description: 'We added AI grant matching with fit scores, deadlines, and one-click application drafting. It is live on Scale plans today.',
      actionText: 'Open Funding Hub →'
    },
    {
      id: '2',
      tag: 'IMPROVED',
      tagBg: 'bg-brand-tint text-brand-x2a523c',
      tagText: 'IMPROVED',
      date: 'Jul 14, 2026',
      title: 'Health Score explanations got clearer',
      description: 'Every dimension now shows exactly which inputs moved it and by how much. No more guessing why a number changed.',
      actionText: 'View your score →'
    },
    {
      id: '3',
      tag: 'MAINTENANCE',
      tagBg: 'bg-neutral-xf2f2ec text-neutral-x55635c',
      tagText: 'MAINTENANCE',
      date: 'Jul 6, 2026',
      title: 'Scheduled maintenance, Aug 2',
      description: 'We will be upgrading our database between 02:00 and 04:00 WAT. The workspace may be read-only briefly.'
    }
  ]);

  // Real notification feed (GET /api/v1/notifications). markRead/markAllRead
  // POST to the API; the page's local NotificationItem shape is produced by the hook.
  const {
    items: notifications,
    setItems: setNotifications,
    markRead: apiMarkRead,
    markAllRead: apiMarkAllRead,
  } = useNotifications();

  const router = useRouter();

  /** A feed row with a destination (its type's deep link) opens it and is marked read. */
  const openNotification = (item: { id: string; title: string; href: string | null; isUnread: boolean }): void => {
    if (!item.href) {
      showToast(`Opened notification: ${item.title}`);
      return;
    }
    if (item.isUnread) void apiMarkRead(item.id);
    router.push(item.href);
  };

  const showToast = (msg: string): void => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleMarkAllRead = () => {
    void apiMarkAllRead();
    showToast('All caught up.');
  };

  const handleMarkSingleRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    void apiMarkRead(id);
    showToast('Marked as read.');
  };

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    showToast('Notification dismissed.');
  };


  const unreadCount = notifications.filter(n => n.isUnread).length;
  const needYouCount = notifications.filter(n => n.category === 'Urgent' && n.isUnread).length;

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'Unread') return n.isUnread;
    if (activeFilter === 'Urgent') return n.category === 'Urgent';
    if (activeFilter === 'Missions') return n.category === 'Missions';
    if (activeFilter === 'Finance') return n.category === 'Finance';
    if (activeFilter === 'Team') return n.category === 'Team';
    if (activeFilter === 'Marketing') return n.category === 'Marketing';
    if (activeFilter === 'Sales') return n.category === 'Sales';
    return true;
  });

  return (
    <div className="min-h-screen bg-surface-faint text-ink font-body antialiased relative selection:bg-accent-200">

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-brand-900 text-white px-5 py-3 rounded-[24px] shadow-accent flex items-center space-x-2.5 text-sm font-medium transition-all duration-300 border border-brand-x1e4231">
          <span className="w-4 h-4 rounded-full bg-brand-x1c4230 flex items-center justify-center text-white text-[10px] font-bold">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <ShellTopBar title="Notifications" />

      {/* Sub-Navbar */}
      <nav className="w-full bg-surface-subtle border-b border-line px-6 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar">
          {(['Inbox', 'Preferences', 'Digest & quiet hours', 'Announcements'] as NotificationTab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  showToast(`Switched to ${tab} tab.`);
                }}
                className={
                  isActive
                    ? "px-4 py-1.5 rounded-full text-xs font-semibold bg-accent-200 text-ink shadow-card transition-colors shrink-0 cursor-pointer"
                    : "px-4 py-1.5 rounded-full text-xs font-medium text-ink-muted hover:bg-neutral-xefefee transition-colors shrink-0 cursor-pointer"
                }
              >
                {tab}
              </button>
            );
          })}
        </div>
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">

        {activeTab === 'Inbox' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-display text-ink-strong tracking-tight">Notifications</h1>
                <p className="text-xs text-ink-subtle mt-0.5">
                  {unreadCount === 0 ? 'Nothing unread' : `${unreadCount} unread · ${needYouCount} need you today`}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="bg-white border border-neutral-xd5d5cf hover:bg-neutral-50 text-ink px-4 py-2 rounded-modal text-xs font-medium shadow-card transition-colors cursor-pointer"
                >
                  Mark all read
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('Preferences');
                    showToast('Switched to Preferences.');
                  }}
                  className="bg-white border border-neutral-xd5d5cf hover:bg-neutral-50 text-ink px-4 py-2 rounded-modal text-xs font-medium shadow-card transition-colors cursor-pointer"
                >
                  Preferences
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
              {[
                { name: 'All', count: notifications.length },
                { name: 'Unread', count: unreadCount },
                { name: 'Urgent', count: notifications.filter(n => n.category === 'Urgent').length },
                { name: 'Missions', count: notifications.filter(n => n.category === 'Missions').length },
                { name: 'Finance', count: notifications.filter(n => n.category === 'Finance').length },
                { name: 'Team', count: notifications.filter(n => n.category === 'Team').length },
                { name: 'Marketing', count: notifications.filter(n => n.category === 'Marketing').length },
                { name: 'Sales', count: notifications.filter(n => n.category === 'Sales').length },
              ].map((filter) => {
                const isActive = activeFilter === filter.name;
                return (
                  <button
                    key={filter.name}
                    onClick={() => {
                      setActiveFilter(filter.name as FilterCategory);
                      showToast(`Filtered by ${filter.name}`);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-brand-strong text-white shadow-card'
                        : 'bg-white border border-line text-ink-muted hover:bg-neutral-50'
                    }`}
                  >
                    <span>{filter.name}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-brand-x2a523c text-white' : 'bg-neutral-xefefee text-ink-muted'}`}>
                      {filter.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Notifications List Grouped by Section */}
            {(['TODAY', 'EARLIER THIS WEEK'] as const).map((sectionName) => {
              const sectionItems = filteredNotifications.filter(n => n.section === sectionName);
              if (sectionItems.length === 0) return null;

              return (
                <div key={sectionName} className="space-y-3">
                  <div className="text-[10px] font-bold tracking-wider text-ink-subtle uppercase pt-2">
                    {sectionName}
                  </div>

                  <div className="space-y-3">
                    {sectionItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => openNotification(item)}
                        className={`bg-white border rounded-[24px] p-4 md:p-5 shadow-card transition-all cursor-pointer relative group flex items-start justify-between gap-4 ${
                          item.category === 'Urgent' || item.category === 'Finance'
                            ? 'border-danger-xf2d6d0 hover:border-danger-xe8b5ac'
                            : 'border-line hover:border-neutral-xd1d1cb'
                        }`}
                      >
                        <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                          <div className={`w-9 h-9 rounded-modal ${item.iconBg} flex items-center justify-center text-sm shrink-0 mt-0.5 shadow-card`}>
                            {item.iconText}
                          </div>

                          <div className="space-y-1 flex-1 min-w-0 pr-6">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-xs text-ink tracking-tight truncate">{item.title}</h3>
                              {item.isUnread && (
                                <span className="w-2 h-2 rounded-full bg-accent-gold shrink-0" />
                              )}
                            </div>

                            <p className="text-xs text-ink-muted leading-relaxed">{item.description}</p>

                            <div className="flex items-center space-x-3 pt-1 text-[11px]">
                              <span className="text-ink-subtle">{item.time}</span>
                              {item.actionText && (
                                <span className="text-brand-strong font-semibold hover:underline">
                                  {item.actionText}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 shrink-0">
                          {item.isUnread && (
                            <button
                              type="button"
                              onClick={(e) => handleMarkSingleRead(item.id, e)}
                              className="w-7 h-7 rounded-card border border-line-stone bg-white hover:bg-neutral-50 text-neutral-600 flex items-center justify-center transition-colors cursor-pointer"
                              title="Mark as read"
                              aria-label="Mark as read"
                            >
                              <Check size={13} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDismiss(item.id, e)}
                            className="w-7 h-7 rounded-card border border-line-stone bg-white hover:bg-neutral-50 text-neutral-400 hover:text-neutral-700 flex items-center justify-center transition-colors cursor-pointer"
                            title="Dismiss"
                            aria-label="Dismiss notification"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'Preferences' && <NotificationPreferences />}

        {activeTab === 'Digest & quiet hours' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h1 className="text-3xl font-display text-ink-strong tracking-tight">Digest & quiet hours</h1>
              <p className="text-xs text-ink-subtle mt-0.5">Batch the noise, protect the focus.</p>
            </div>

            {/* Daily Digest Section Card */}
            <div className="bg-white border border-line rounded-[24px] p-6 shadow-card space-y-6">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-ink">Daily digest</h3>
              </div>

              {/* Three selection option cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { mode: 'Off' as DigestMode, title: 'Off', desc: 'Every notification arrives live.' },
                  { mode: 'Daily' as DigestMode, title: 'Daily', desc: 'One summary each morning.' },
                  { mode: 'Weekly' as DigestMode, title: 'Weekly', desc: 'One summary each Monday.' }
                ].map((item) => {
                  const isSelected = digestMode === item.mode;
                  return (
                    <div
                      key={item.mode}
                      onClick={() => {
                        setDigestMode(item.mode);
                        showToast(`Digest mode set to ${item.title}`);
                      }}
                      className={`border rounded-modal p-4 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-brand-strong bg-brand-tint/40 shadow-card ring-1 ring-brand-strong' 
                          : 'border-line bg-white hover:border-neutral-xd1d1cb'
                      }`}
                    >
                      <h4 className="text-xs font-bold text-ink mb-1">{item.title}</h4>
                      <p className="text-[11px] text-ink-muted leading-relaxed">{item.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Delivery time dropdown selection */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-medium text-ink">Delivery time</label>
                <p className="text-[11px] text-ink-subtle">When your digest lands.</p>
                
                <div className="relative max-w-xs mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeliveryDropdownOpen(!isDeliveryDropdownOpen);
                      setIsFromDropdownOpen(false);
                      setIsUntilDropdownOpen(false);
                    }}
                    className={`w-full bg-white border rounded-modal px-4 py-2.5 text-xs text-ink flex items-center justify-between transition-colors cursor-pointer ${
                      isDeliveryDropdownOpen ? 'border-accent-gold ring-1 ring-accent-gold' : 'border-neutral-xd5d5cf hover:border-accent-gold'
                    }`}
                  >
                    <span className="font-medium">{deliveryTime}</span>
                    <ChevronDown size={14} className="text-ink-subtle" />
                  </button>

                  {isDeliveryDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-neutral-xd5d5cf rounded-modal shadow-accent z-20 overflow-hidden py-1">
                      {['6:00 AM', '7:00 AM', '8:00 AM'].map((timeOption) => (
                        <button
                          key={timeOption}
                          type="button"
                          onClick={() => {
                            setDeliveryTime(timeOption);
                            setIsDeliveryDropdownOpen(false);
                            showToast(`Delivery time updated to ${timeOption}`);
                          }}
                          className={`w-full text-left px-4 py-2 text-xs hover:bg-neutral-xfaf8f5 transition-colors cursor-pointer ${
                            deliveryTime === timeOption ? 'bg-neutral-xf2f2ec font-semibold text-brand-strong' : 'text-ink'
                          }`}
                        >
                          {timeOption}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quiet Hours Section Card */}
            <div className="bg-white border border-line rounded-[24px] p-6 shadow-card space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-ink">Quiet hours</h3>
                  <p className="text-[11px] text-ink-subtle">Nothing but urgent reaches you in this window.</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsQuietHoursActive(!isQuietHoursActive);
                    showToast(isQuietHoursActive ? 'Quiet hours disabled.' : 'Quiet hours enabled.');
                  }}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    isQuietHoursActive ? 'bg-brand-strong' : 'bg-neutral-300'
                  }`}
                  aria-label="Toggle Quiet Hours"
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-raised transform transition-transform ${isQuietHoursActive ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Time dropdown selectors (From / Until) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                
                {/* From Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-ink">From</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFromDropdownOpen(!isFromDropdownOpen);
                        setIsDeliveryDropdownOpen(false);
                        setIsUntilDropdownOpen(false);
                      }}
                      className={`w-full bg-white border rounded-modal px-4 py-2.5 text-xs text-ink flex items-center justify-between transition-colors cursor-pointer ${
                        isFromDropdownOpen ? 'border-accent-gold ring-1 ring-accent-gold' : 'border-neutral-xd5d5cf hover:border-accent-gold'
                      }`}
                    >
                      <span className="font-medium">{quietFrom}</span>
                      <ChevronDown size={14} className="text-ink-subtle" />
                    </button>

                    {isFromDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-neutral-xd5d5cf rounded-modal shadow-accent z-20 overflow-hidden py-1">
                        {['8:00 PM', '9:00 PM', '10:00 PM'].map((timeOption) => (
                          <button
                            key={timeOption}
                            type="button"
                            onClick={() => {
                              setQuietFrom(timeOption);
                              setIsFromDropdownOpen(false);
                              showToast(`Quiet hours start time updated to ${timeOption}`);
                            }}
                            className={`w-full text-left px-4 py-2 text-xs hover:bg-neutral-xfaf8f5 transition-colors cursor-pointer ${
                              quietFrom === timeOption ? 'bg-neutral-xf2f2ec font-semibold text-brand-strong' : 'text-ink'
                            }`}
                          >
                            {timeOption}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Until Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-ink">Until</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUntilDropdownOpen(!isUntilDropdownOpen);
                        setIsDeliveryDropdownOpen(false);
                        setIsFromDropdownOpen(false);
                      }}
                      className={`w-full bg-white border rounded-modal px-4 py-2.5 text-xs text-ink flex items-center justify-between transition-colors cursor-pointer ${
                        isUntilDropdownOpen ? 'border-accent-gold ring-1 ring-accent-gold' : 'border-neutral-xd5d5cf hover:border-accent-gold'
                      }`}
                    >
                      <span className="font-medium">{quietUntil}</span>
                      <ChevronDown size={14} className="text-ink-subtle" />
                    </button>

                    {isUntilDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-neutral-xd5d5cf rounded-modal shadow-accent z-20 overflow-hidden py-1">
                        {['6:00 AM', '7:00 AM', '8:00 AM'].map((timeOption) => (
                          <button
                            key={timeOption}
                            type="button"
                            onClick={() => {
                              setQuietUntil(timeOption);
                              setIsUntilDropdownOpen(false);
                              showToast(`Quiet hours end time updated to ${timeOption}`);
                            }}
                            className={`w-full text-left px-4 py-2 text-xs hover:bg-neutral-xfaf8f5 transition-colors cursor-pointer ${
                              quietUntil === timeOption ? 'bg-neutral-xf2f2ec font-semibold text-brand-strong' : 'text-ink'
                            }`}
                          >
                            {timeOption}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* Explanatory callout box */}
            <div className="bg-neutral-xfaf5ec border border-accent-xeadccb rounded-[24px] p-4 text-xs text-accent-x61543e leading-relaxed">
              <span className="font-bold text-accent-x42392a">What still gets through: </span>
              compliance deadlines with penalties, signature requests, and payment failures. Everything else waits for your digest.
            </div>

          </div>
        )}

        {activeTab === 'Announcements' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h1 className="text-3xl font-display text-ink-strong tracking-tight">Announcements</h1>
            </div>

            <div className="space-y-4">
              {announcements.map((item) => (
                <div
                  key={item.id}
                  onClick={() => showToast(`Selected announcement: ${item.title}`)}
                  className="bg-white border border-line hover:border-neutral-xd1d1cb rounded-[24px] p-6 shadow-card space-y-3 cursor-pointer transition-all"
                >
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded-input text-[10px] font-bold tracking-wider ${item.tagBg}`}>
                      {item.tagText}
                    </span>
                    <span className="text-xs text-ink-subtle">{item.date}</span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-display font-semibold text-ink tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {item.actionText && (
                    <div className="pt-1">
                      <span className="text-xs font-semibold text-brand-strong hover:underline">
                        {item.actionText}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}