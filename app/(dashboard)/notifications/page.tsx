'use client';

import React, { useState } from 'react';
import { useSidebar } from '@/components/sidebar-context';
import { useNotifications } from '@/hooks/useNotifications';
import { Menu, History, Check, X, ChevronDown } from 'lucide-react';

type NotificationTab = 'Inbox' | 'Preferences' | 'Digest & quiet hours' | 'Announcements';
type FilterCategory = 'All' | 'Unread' | 'Urgent' | 'Missions' | 'Finance' | 'Team';
type DigestMode = 'Off' | 'Daily' | 'Weekly';

interface PreferenceRow {
  id: string;
  category: string;
  description: string;
  inApp: boolean;
  email: boolean;
  push: boolean;
}

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
  const { openSidebar } = useSidebar();

  const [activeTab, setActiveTab] = useState<NotificationTab>('Announcements'); // Default to Announcements as requested
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
      tagBg: 'bg-[#F5EFE6] text-[#7A5B30]',
      tagText: 'NEW',
      date: 'Jul 22, 2026',
      title: 'The Funding Hub now tracks grants',
      description: 'We added AI grant matching with fit scores, deadlines, and one-click application drafting. It is live on Scale plans today.',
      actionText: 'Open Funding Hub →'
    },
    {
      id: '2',
      tag: 'IMPROVED',
      tagBg: 'bg-[#EAF2ED] text-[#2A523C]',
      tagText: 'IMPROVED',
      date: 'Jul 14, 2026',
      title: 'Health Score explanations got clearer',
      description: 'Every dimension now shows exactly which inputs moved it and by how much. No more guessing why a number changed.',
      actionText: 'View your score →'
    },
    {
      id: '3',
      tag: 'MAINTENANCE',
      tagBg: 'bg-[#F2F2EC] text-[#55635C]',
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

  // Preferences table state
  const [preferences, setPreferences] = useState<PreferenceRow[]>([
    {
      id: 'missions',
      category: 'Missions',
      description: 'Your daily mission and streaks.',
      inApp: true,
      email: false,
      push: false
    },
    {
      id: 'compliance',
      category: 'Compliance',
      description: 'Filing deadlines that carry penalties.',
      inApp: true,
      email: true,
      push: true
    },
    {
      id: 'finance',
      category: 'Finance',
      description: 'Invoices, runway warnings, payment failures.',
      inApp: true,
      email: true,
      push: false
    },
    {
      id: 'fundraising',
      category: 'Fundraising',
      description: 'Data room views, investor activity, grant matches.',
      inApp: true,
      email: false,
      push: false
    },
    {
      id: 'team',
      category: 'Team',
      description: 'Comments, mentions, and shared edits.',
      inApp: true,
      email: false,
      push: false
    },
    {
      id: 'ai',
      category: 'AI',
      description: 'Briefings, insights, and generated artifacts.',
      inApp: true,
      email: false,
      push: false
    },
    {
      id: 'documents',
      category: 'Documents',
      description: 'Signature requests and shared file activity.',
      inApp: true,
      email: false,
      push: false
    }
  ]);

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

  const togglePreference = (id: string, field: 'inApp' | 'email' | 'push') => {
    setPreferences(prev => prev.map(row => {
      if (row.id === id) {
        return { ...row, [field]: !row[field] };
      }
      return row;
    }));
    showToast('Preference updated.');
  };

  const unreadCount = notifications.filter(n => n.isUnread).length;
  const needYouCount = notifications.filter(n => n.category === 'Urgent' && n.isUnread).length;

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'Unread') return n.isUnread;
    if (activeFilter === 'Urgent') return n.category === 'Urgent';
    if (activeFilter === 'Missions') return n.category === 'Missions';
    if (activeFilter === 'Finance') return n.category === 'Finance';
    if (activeFilter === 'Team') return n.category === 'Team';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#1E2923] font-body antialiased relative selection:bg-[#EAD5C6]">

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-[#12291F] text-white px-5 py-3 rounded-[24px] shadow-accent flex items-center space-x-2.5 text-sm font-medium transition-all duration-300 border border-[#1E4231]">
          <span className="w-4 h-4 rounded-full bg-[#1C4230] flex items-center justify-center text-white text-[10px] font-bold">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 border-b border-[#E8E8E2] px-6 py-3.5 flex items-center justify-between bg-white w-full">
        <div className="flex items-center space-x-3">
          <button 
            onClick={openSidebar}
            className="md:hidden w-9 h-9 rounded-modal border border-[#E0E0DA] bg-white text-[#183B28] hover:bg-sage-50 flex items-center justify-center transition-colors shrink-0 shadow-card"
            aria-label="Toggle Sidebar"
          >
            <Menu size={18} />
          </button>

          <div className="flex items-center space-x-2 text-sm md:text-base font-semibold tracking-tight">
            <span className="text-[#1E2923]">Workspace</span>
            <span className="text-[#8E9B90] font-normal">/</span>
            <span className="text-[#1E2923]">Notifications</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-[#EAF2ED] text-[#183B28] border border-[#D5E6DC] px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-1 shadow-card">
            <span>Health</span>
            <span className="font-bold">72</span>
            <span>↑</span>
          </div>

          <div className="relative w-9 h-9 rounded-full border border-[#E0E0DA] bg-white flex items-center justify-center text-[#55635C] shadow-card">
            <History className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#B39353] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </div>

          <button 
            onClick={() => showToast('Invite modal opened.')}
            className="bg-[#B39353] hover:bg-[#A38346] text-white px-4 py-1.5 rounded-full text-xs font-semibold transition-colors shadow-card cursor-pointer flex items-center space-x-1"
          >
            <span>+ Invite</span>
          </button>
        </div>
      </header>

      {/* Sub-Navbar */}
      <nav className="w-full bg-[#F7F7F5] border-b border-[#E8E8E2] px-6 py-3 flex items-center justify-between">
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
                    ? "px-4 py-1.5 rounded-full text-xs font-semibold bg-[#EAD5C6] text-[#1E2923] shadow-card transition-colors shrink-0 cursor-pointer"
                    : "px-4 py-1.5 rounded-full text-xs font-medium text-[#617065] hover:bg-[#EFEFEE] transition-colors shrink-0 cursor-pointer"
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
                <h1 className="text-3xl font-display text-[#1C2621] tracking-tight">Notifications</h1>
                <p className="text-xs text-[#8E9B90] mt-0.5">
                  {unreadCount === 0 ? 'Nothing unread' : `${unreadCount} unread · ${needYouCount} need you today`}
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="bg-white border border-[#D5D5CF] hover:bg-sage-50 text-[#1E2923] px-4 py-2 rounded-modal text-xs font-medium shadow-card transition-colors cursor-pointer"
                >
                  Mark all read
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('Preferences');
                    showToast('Switched to Preferences.');
                  }}
                  className="bg-white border border-[#D5D5CF] hover:bg-sage-50 text-[#1E2923] px-4 py-2 rounded-modal text-xs font-medium shadow-card transition-colors cursor-pointer"
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
                        ? 'bg-[#183B28] text-white shadow-card'
                        : 'bg-white border border-[#E8E8E2] text-[#617065] hover:bg-sage-50'
                    }`}
                  >
                    <span>{filter.name}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-[#2A523C] text-white' : 'bg-[#EFEFEE] text-[#617065]'}`}>
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
                  <div className="text-[10px] font-bold tracking-wider text-[#8E9B90] uppercase pt-2">
                    {sectionName}
                  </div>

                  <div className="space-y-3">
                    {sectionItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => showToast(`Opened notification: ${item.title}`)}
                        className={`bg-white border rounded-[24px] p-4 md:p-5 shadow-card transition-all cursor-pointer relative group flex items-start justify-between gap-4 ${
                          item.category === 'Urgent' || item.category === 'Finance'
                            ? 'border-[#F2D6D0] hover:border-[#E8B5AC]'
                            : 'border-[#E8E8E2] hover:border-[#D1D1CB]'
                        }`}
                      >
                        <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                          <div className={`w-9 h-9 rounded-modal ${item.iconBg} flex items-center justify-center text-sm shrink-0 mt-0.5 shadow-card`}>
                            {item.iconText}
                          </div>

                          <div className="space-y-1 flex-1 min-w-0 pr-6">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-xs text-[#1E2923] tracking-tight truncate">{item.title}</h3>
                              {item.isUnread && (
                                <span className="w-2 h-2 rounded-full bg-[#B39353] shrink-0" />
                              )}
                            </div>

                            <p className="text-xs text-[#617065] leading-relaxed">{item.description}</p>

                            <div className="flex items-center space-x-3 pt-1 text-[11px]">
                              <span className="text-[#8E9B90]">{item.time}</span>
                              {item.actionText && (
                                <span className="text-[#183B28] font-semibold hover:underline">
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
                              className="w-7 h-7 rounded-card border border-[#E0E0DA] bg-white hover:bg-sage-50 text-sage-600 flex items-center justify-center transition-colors cursor-pointer"
                              title="Mark as read"
                              aria-label="Mark as read"
                            >
                              <Check size={13} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDismiss(item.id, e)}
                            className="w-7 h-7 rounded-card border border-[#E0E0DA] bg-white hover:bg-sage-50 text-sage-400 hover:text-sage-700 flex items-center justify-center transition-colors cursor-pointer"
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

        {activeTab === 'Preferences' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h1 className="text-3xl font-display text-[#1C2621] tracking-tight">Notification preferences</h1>
              <p className="text-xs text-[#8E9B90] mt-0.5">We default to quiet. Turn on only what genuinely needs you.</p>
            </div>

            <div className="bg-white border border-[#E8E8E2] rounded-[24px] shadow-card overflow-hidden">
              <div className="grid grid-cols-12 px-6 py-3.5 border-b border-[#E8E8E2] bg-[#FAF8F5] text-[10px] font-bold tracking-wider text-[#8E9B90] uppercase">
                <div className="col-span-6 md:col-span-7">Category</div>
                <div className="col-span-2 md:col-span-2 text-center">In App</div>
                <div className="col-span-2 md:col-span-2 text-center">Email</div>
                <div className="col-span-2 md:col-span-1 text-center">Push</div>
              </div>

              <div className="divide-y divide-[#F2F2EC]">
                {preferences.map((row) => (
                  <div key={row.id} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-sage-50/50 transition-colors">
                    <div className="col-span-6 md:col-span-7 space-y-0.5 pr-4">
                      <h3 className="text-xs font-bold text-[#1E2923]">{row.category}</h3>
                      <p className="text-[11px] text-[#8E9B90]">{row.description}</p>
                    </div>

                    <div className="col-span-2 md:col-span-2 flex justify-center">
                      <button
                        type="button"
                        onClick={() => togglePreference(row.id, 'inApp')}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                          row.inApp ? 'bg-[#183B28]' : 'bg-sage-300'
                        }`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-raised transform transition-transform ${row.inApp ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="col-span-2 md:col-span-2 flex justify-center">
                      <button
                        type="button"
                        onClick={() => togglePreference(row.id, 'email')}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                          row.email ? 'bg-[#183B28]' : 'bg-sage-300'
                        }`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-raised transform transition-transform ${row.email ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>

                    <div className="col-span-2 md:col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => togglePreference(row.id, 'push')}
                        className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                          row.push ? 'bg-[#183B28]' : 'bg-sage-300'
                        }`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-raised transform transition-transform ${row.push ? 'translate-x-5' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Digest & quiet hours' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h1 className="text-3xl font-display text-[#1C2621] tracking-tight">Digest & quiet hours</h1>
              <p className="text-xs text-[#8E9B90] mt-0.5">Batch the noise, protect the focus.</p>
            </div>

            {/* Daily Digest Section Card */}
            <div className="bg-white border border-[#E8E8E2] rounded-[24px] p-6 shadow-card space-y-6">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-[#1E2923]">Daily digest</h3>
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
                          ? 'border-[#183B28] bg-[#EAF2ED]/40 shadow-card ring-1 ring-[#183B28]' 
                          : 'border-[#E8E8E2] bg-white hover:border-[#D1D1CB]'
                      }`}
                    >
                      <h4 className="text-xs font-bold text-[#1E2923] mb-1">{item.title}</h4>
                      <p className="text-[11px] text-[#617065] leading-relaxed">{item.desc}</p>
                    </div>
                  );
                })}
              </div>

              {/* Delivery time dropdown selection */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-medium text-[#1E2923]">Delivery time</label>
                <p className="text-[11px] text-[#8E9B90]">When your digest lands.</p>
                
                <div className="relative max-w-xs mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeliveryDropdownOpen(!isDeliveryDropdownOpen);
                      setIsFromDropdownOpen(false);
                      setIsUntilDropdownOpen(false);
                    }}
                    className={`w-full bg-white border rounded-modal px-4 py-2.5 text-xs text-[#1E2923] flex items-center justify-between transition-colors cursor-pointer ${
                      isDeliveryDropdownOpen ? 'border-[#B39353] ring-1 ring-[#B39353]' : 'border-[#D5D5CF] hover:border-[#B39353]'
                    }`}
                  >
                    <span className="font-medium">{deliveryTime}</span>
                    <ChevronDown size={14} className="text-[#8E9B90]" />
                  </button>

                  {isDeliveryDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#D5D5CF] rounded-modal shadow-accent z-20 overflow-hidden py-1">
                      {['6:00 AM', '7:00 AM', '8:00 AM'].map((timeOption) => (
                        <button
                          key={timeOption}
                          type="button"
                          onClick={() => {
                            setDeliveryTime(timeOption);
                            setIsDeliveryDropdownOpen(false);
                            showToast(`Delivery time updated to ${timeOption}`);
                          }}
                          className={`w-full text-left px-4 py-2 text-xs hover:bg-[#FAF8F5] transition-colors cursor-pointer ${
                            deliveryTime === timeOption ? 'bg-[#F2F2EC] font-semibold text-[#183B28]' : 'text-[#1E2923]'
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
            <div className="bg-white border border-[#E8E8E2] rounded-[24px] p-6 shadow-card space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-[#1E2923]">Quiet hours</h3>
                  <p className="text-[11px] text-[#8E9B90]">Nothing but urgent reaches you in this window.</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsQuietHoursActive(!isQuietHoursActive);
                    showToast(isQuietHoursActive ? 'Quiet hours disabled.' : 'Quiet hours enabled.');
                  }}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    isQuietHoursActive ? 'bg-[#183B28]' : 'bg-sage-300'
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
                  <label className="text-xs font-medium text-[#1E2923]">From</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFromDropdownOpen(!isFromDropdownOpen);
                        setIsDeliveryDropdownOpen(false);
                        setIsUntilDropdownOpen(false);
                      }}
                      className={`w-full bg-white border rounded-modal px-4 py-2.5 text-xs text-[#1E2923] flex items-center justify-between transition-colors cursor-pointer ${
                        isFromDropdownOpen ? 'border-[#B39353] ring-1 ring-[#B39353]' : 'border-[#D5D5CF] hover:border-[#B39353]'
                      }`}
                    >
                      <span className="font-medium">{quietFrom}</span>
                      <ChevronDown size={14} className="text-[#8E9B90]" />
                    </button>

                    {isFromDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#D5D5CF] rounded-modal shadow-accent z-20 overflow-hidden py-1">
                        {['8:00 PM', '9:00 PM', '10:00 PM'].map((timeOption) => (
                          <button
                            key={timeOption}
                            type="button"
                            onClick={() => {
                              setQuietFrom(timeOption);
                              setIsFromDropdownOpen(false);
                              showToast(`Quiet hours start time updated to ${timeOption}`);
                            }}
                            className={`w-full text-left px-4 py-2 text-xs hover:bg-[#FAF8F5] transition-colors cursor-pointer ${
                              quietFrom === timeOption ? 'bg-[#F2F2EC] font-semibold text-[#183B28]' : 'text-[#1E2923]'
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
                  <label className="text-xs font-medium text-[#1E2923]">Until</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUntilDropdownOpen(!isUntilDropdownOpen);
                        setIsDeliveryDropdownOpen(false);
                        setIsFromDropdownOpen(false);
                      }}
                      className={`w-full bg-white border rounded-modal px-4 py-2.5 text-xs text-[#1E2923] flex items-center justify-between transition-colors cursor-pointer ${
                        isUntilDropdownOpen ? 'border-[#B39353] ring-1 ring-[#B39353]' : 'border-[#D5D5CF] hover:border-[#B39353]'
                      }`}
                    >
                      <span className="font-medium">{quietUntil}</span>
                      <ChevronDown size={14} className="text-[#8E9B90]" />
                    </button>

                    {isUntilDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#D5D5CF] rounded-modal shadow-accent z-20 overflow-hidden py-1">
                        {['6:00 AM', '7:00 AM', '8:00 AM'].map((timeOption) => (
                          <button
                            key={timeOption}
                            type="button"
                            onClick={() => {
                              setQuietUntil(timeOption);
                              setIsUntilDropdownOpen(false);
                              showToast(`Quiet hours end time updated to ${timeOption}`);
                            }}
                            className={`w-full text-left px-4 py-2 text-xs hover:bg-[#FAF8F5] transition-colors cursor-pointer ${
                              quietUntil === timeOption ? 'bg-[#F2F2EC] font-semibold text-[#183B28]' : 'text-[#1E2923]'
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
            <div className="bg-[#FAF5EC] border border-[#EADCCB] rounded-[24px] p-4 text-xs text-[#61543E] leading-relaxed">
              <span className="font-bold text-[#42392A]">What still gets through: </span>
              compliance deadlines with penalties, signature requests, and payment failures. Everything else waits for your digest.
            </div>

          </div>
        )}

        {activeTab === 'Announcements' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h1 className="text-3xl font-display text-[#1C2621] tracking-tight">Announcements</h1>
            </div>

            <div className="space-y-4">
              {announcements.map((item) => (
                <div
                  key={item.id}
                  onClick={() => showToast(`Selected announcement: ${item.title}`)}
                  className="bg-white border border-[#E8E8E2] hover:border-[#D1D1CB] rounded-[24px] p-6 shadow-card space-y-3 cursor-pointer transition-all"
                >
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded-input text-[10px] font-bold tracking-wider ${item.tagBg}`}>
                      {item.tagText}
                    </span>
                    <span className="text-xs text-[#8E9B90]">{item.date}</span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-display font-semibold text-[#1E2923] tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#617065] leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {item.actionText && (
                    <div className="pt-1">
                      <span className="text-xs font-semibold text-[#183B28] hover:underline">
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