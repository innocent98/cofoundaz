'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiClient } from '@/lib/api/client';


import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { DashboardNavbar } from '@/components/dashboardnavbar';
import Sidebar from '@/components/sidebar';
import { 
  Flame, 
  Check, 
  Search, 
  X, 
  ChevronDown,
  ArrowUp,
  Sparkles
} from 'lucide-react';
import { useDashboardSummary, useAIBriefing, useActivityFeed } from '@/hooks/useDashboardApi';
import { useAiDrawer } from '@/components/ai-drawer-context';
import type { MissionTask } from '@/types/dashboard';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export interface NotificationItem {
  id: string;
  title: string;
  time: string;
  unread?: boolean;
  type: 'ai' | 'finance' | 'legal' | 'funding';
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
}

export default function DashboardPage() {
  // STATE MANAGEMENT
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { openAiDrawer, closeAiDrawer } = useAiDrawer();
  const [searchQuery, setSearchQuery] = useState('');

  // DATA HOOKS
  const { data: summaryData, loading: summaryLoading, refetch: refetchSummary, error: summaryError } = useDashboardSummary();
  const { data: briefingData, acceptAction, fallbackText, error: briefingError, refetch: refetchBriefing } = useAIBriefing();
  const { data: activityData, error: activityError, fetchMore: refetchActivity } = useActivityFeed('workspace_123'); // Example ID

    // Dynamic greeting, time, and user info
        const [userProfile, setUserProfile] = useState<{ first_name?: string; full_name?: string; startup_name?: string } | null>(null);

    useEffect(() => {
      let isMounted = true;

      // 1. Fetch user profile from /auth/me
      apiClient<any>('/auth/me')
        .then((res) => {
          if (!isMounted) return;
          const data = res?.data || res;
          if (data?.first_name || data?.name) {
            setUserProfile(data);
            if (data.first_name) localStorage.setItem('cf_user_name', data.first_name);
            return;
          }
          throw new Error('No name in auth/me');
        })
        .catch(() => {
          // 2. Fallback to onboarding state where name and startup were saved
          return apiClient<any>('/onboarding/state')
            .then((res) => {
              if (!isMounted) return;
              const state = res?.data || res;
              if (state?.profile || state?.startup) {
                const combined = {
                  first_name: state?.profile?.first_name,
                  full_name: `${state?.profile?.first_name || ''} ${state?.profile?.last_name || ''}`.trim(),
                  startup_name: state?.startup?.name,
                };
                setUserProfile(combined);
                if (combined.first_name) localStorage.setItem('cf_user_name', combined.first_name);
                if (combined.startup_name) localStorage.setItem('cf_startup_name', combined.startup_name);
              }
            })
            .catch(() => {});
        });

      return () => {
        isMounted = false;
      };
    }, []);

    const currentHour = new Date().getHours();
    const timeGreeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
    const formattedDate = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date());

    const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const localUserName = mounted && typeof window !== 'undefined' ? localStorage.getItem('cf_user_name') : null;
  const localStartupName = mounted && typeof window !== 'undefined' ? localStorage.getItem('cf_startup_name') : null;

  const userName =
    userProfile?.first_name ||
    userProfile?.full_name ||
    (summaryData as any)?.user?.first_name ||
    (summaryData as any)?.user?.name ||
    localUserName ||
    'Founder';

  const startupName =
    userProfile?.startup_name ||
    (summaryData as any)?.startup?.name ||
    localStartupName ||
    'your workspace';

  const targetScore = summaryData?.health?.score ?? 0;

  // ScoreGauge Animation State
  const [displayScore, setDisplayScore] = useState(0);
  useEffect(() => {
    let startTime: number;
    const duration = 600;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      queueMicrotask(() => { setDisplayScore(targetScore); });
      return;
    }

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplayScore(Math.round(ease * targetScore));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [targetScore]);

  const getScoreColor = (score: number): string => {
    if (score < 40) return 'var(--red-600, #B0483B)';
    if (score < 70) return 'var(--brass-600, #A8894B)';
    return 'var(--green-500, #2E7256)';
  };

  // Toast State for Briefing Action
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mission Toast State
  const [missionToastVisible, setMissionToastVisible] = useState(false);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const triggerMissionToast = () => {
    setMissionToastVisible(true);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setMissionToastVisible(false);
    }, 3000);
  };

  // Invite Form State & Custom Role Dropdown State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Co-Founder');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const roleOptions = [
    'Co-Founder',
    'Teammate',
    'Mentor',
    'Accountant',
    'Lawyer',
    'Advisor',
  ];

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'Your daily AI briefing is ready.',
      time: '10 min ago',
      unread: true,
      type: 'ai',
    },
    {
      id: '2',
      title: 'Runway dropped below 9 months, worth a look.',
      time: '1h ago',
      unread: false,
      type: 'finance',
    },
    {
      id: '3',
      title: 'Tayo returned your NDA with 2 comments.',
      time: '5h ago',
      unread: false,
      type: 'legal',
    },
    {
      id: '4',
      title: 'Sahel Fund viewed your data room for 6 minutes.',
      time: 'Yesterday',
      unread: false,
      type: 'funding',
    },
  ]);

  const markAllNotificationsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, unread: false }))
    );
  };

  const [tasks, setTasks] = useState<MissionTask[]>([
    {
      id: '1',
      title: 'Interview 3 gig workers',
      reason: 'Why: closes out your riskiest validation task.',
      completed: true,
      order: 1,
    },
    {
      id: '2',
      title: 'Draft your pricing experiment',
      reason: 'Why: pricing moves both revenue and runway.',
      completed: false,
      order: 2,
    },
    {
      id: '3',
      title: "Review Tayo's NDA comments",
      reason: 'Why: unblocks your first contractor.',
      completed: false,
      order: 3,
    },
  ]);

  useEffect(() => {
    if (summaryData?.mission?.tasks) {
      queueMicrotask(() => { setTasks(summaryData.mission.tasks); });
    }
  }, [summaryData?.mission?.tasks]);

  const toggleTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task && !task.completed) {
      triggerMissionToast();
    }
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    );
  };

  const closeAllOverlays = () => {
    setIsSidebarOpen(false);
    setIsSearchOpen(false);
    setIsInviteOpen(false);
    setIsNotificationsOpen(false);
    closeAiDrawer();
    setIsRoleDropdownOpen(false);
    setSearchQuery('');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        closeAllOverlays();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // The sidebar is always visible from `lg` up, so drop the mobile open state there
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)');
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setIsSidebarOpen(false);
    };
    handleChange(desktop);
    desktop.addEventListener('change', handleChange);
    return () => desktop.removeEventListener('change', handleChange);
  }, []);

  // Lock body scroll while the mobile sidebar is open
  useEffect(() => {
    if (!isSidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isSidebarOpen]);

  // Handlers for AI Briefing Card Actions (Independent of the Chat Drawer)
  const [isDoItPending, setIsDoItPending] = useState(false);

  const handleBriefingDoIt = () => {
    if (isDoItPending) return;
    setIsDoItPending(true);

    // Automatically marks the pricing task as complete
    setTasks((prev) =>
      prev.map((t) => (t.id === '2' ? { ...t, completed: true } : t))
    );
    // Show the black toast notification matching the reference screenshot
    setToastMessage('Added “Draft a pricing experiment” to your tasks.');
    setTimeout(() => {
      setToastMessage(null);
      setIsDoItPending(false);
    }, 4000);
  };

  const handleBriefingTellMeMore = () => {
    openAiDrawer();
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Inviting:', inviteEmail, 'as', inviteRole);
    setIsInviteOpen(false);
    setInviteEmail('');
  };

  return (
    <div className="relative flex min-h-screen w-full min-w-0 flex-col bg-[#F7F8F6] text-[#1C201D] font-body">

      {/* MOBILE BACKDROP — tap anywhere outside to close the sidebar */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs transition-opacity lg:hidden"
        />
      )}

      {/* NAVBAR */}
      <DashboardNavbar
        isNotificationsOpen={isNotificationsOpen}
        setIsNotificationsOpen={setIsNotificationsOpen}
        setIsSearchOpen={setIsSearchOpen}
        setIsInviteOpen={setIsInviteOpen}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        notifications={notifications}
        markAllNotificationsRead={markAllNotificationsRead}
      />

      {/* TOAST NOTIFICATION POPUP (MATCHING DESIGN REFERENCE) */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#14231E] text-white px-5 py-3 rounded-modal shadow-raised flex items-center gap-3 border border-[#233A31] animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="w-5 h-5 rounded-full bg-[#266B4E] flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
          </div>
          <p className="text-sm font-medium">{toastMessage}</p>
        </div>
      )}

      {/* MISSION TOAST */}
      {missionToastVisible && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#0F1E16] text-white px-5 py-3 rounded-modal shadow-accent shadow-black/25 inline-flex items-center gap-2.5 border border-[#1E3A29] animate-in fade-in slide-in-from-top-2 duration-300">
          <Check className="w-4 h-4 text-[#D4A359] stroke-[3] shrink-0" />
          <p className="text-sm font-medium text-white">Nice. Mission progress saved.</p>
        </div>
      )}

      {/* MAIN DASHBOARD CONTENT */}
      <main className="flex-1 w-full min-w-0 max-w-none px-6 lg:px-8 pt-4 pb-12 space-y-6">
        {/* GREETING SECTION */}
        <section className="mb-6 w-full">
          <h1 className="text-3xl font-display font-bold text-sage-900 mb-1" suppressHydrationWarning>
            {timeGreeting}, {userName}.
          </h1>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-sage-400">
            <p>Here&apos;s where {startupName} stands today.</p>
            <span className="text-sage-500">{formattedDate}</span>
          </div>
        </section>

        {/* TOP CARDS ROW */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 1. Startup Health Card */}
          <ErrorBoundary onRetry={refetchSummary}>
            <div className="rounded-card border border-green-100 bg-white p-6 shadow-card flex flex-col justify-between">
              {(() => { if (summaryError) throw summaryError; return null; })()}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-base text-sage-900">Startup Health</h3>
                  <span className="text-xs font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full">
                    {(summaryData?.health?.deltaWeekly || 0) > 0 ? '+' : ''}{summaryData?.health?.deltaWeekly || '+4'} this week
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center my-4">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        className="text-[#E4EFEA]"
                        strokeWidth="9"
                        stroke="currentColor"
                        fill="none"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        strokeWidth="9"
                        strokeDasharray={2 * Math.PI * 40}
                        strokeDashoffset={(2 * Math.PI * 40) * (1 - (displayScore / 100))}
                        strokeLinecap="round"
                        stroke={getScoreColor(targetScore)}
                        fill="none"
                        style={{ 
                          transition: 'stroke 600ms ease-out, stroke-dashoffset 600ms ease-out',
                        }}
                        className="motion-reduce:transition-none"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-5xl font-display font-extrabold text-[#1D2A24] leading-none mb-1">
                        {displayScore}
                      </span>
                      <span className="text-xs text-sage-500 font-medium">of 100</span>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-center text-sage-600 leading-relaxed px-2 mb-6">
                  Strong for validation stage. Product is carrying you; financials are holding you back.
                </p>
              </div>

              <Link
                href="/app/health"
                className="text-sm font-bold text-[#266B4E] flex items-center justify-center gap-1 hover:underline pt-2 cursor-pointer"
              >
                See what&apos;s driving it →
              </Link>
            </div>
          </ErrorBoundary>

          {/* 2. Today&apos;s Mission Card */}
          <ErrorBoundary onRetry={refetchSummary}>
            <div className="rounded-card border border-green-100 bg-white p-6 shadow-card flex flex-col justify-between">
              {(() => { if (summaryError) throw summaryError; return null; })()}
              {tasks.length > 0 && tasks.every(t => t.completed) ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <Flame className="w-12 h-12 fill-copper-500 text-copper-500 mb-4 animate-bounce" />
                  <h3 className="font-bold text-lg text-sage-900">Mission complete. 🔥 {summaryData?.mission?.streakDays || 6}-day streak.</h3>
                </div>
              ) : (
              <>
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-base text-sage-900">Today&apos;s Mission</h3>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-copper-700">
                      <Flame className="w-4 h-4 fill-copper-500 text-copper-500" />
                      <span>{summaryData?.mission?.streakDays || 6}-day streak</span>
                    </div>
                  </div>

                  <div className="space-y-5">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className="flex items-start gap-3.5 cursor-pointer group"
                      >
                        <button
                          type="button"
                          aria-label={`Toggle task: ${task.title}`}
                          className={`w-6 h-6 rounded-input flex items-center justify-center shrink-0 mt-0.5 transition-all duration-300 ${
                            task.completed
                              ? 'bg-[#266B4E] text-white shadow-card'
                              : 'border border-sage-300 bg-white group-hover:border-sage-400'
                          }`}
                        >
                          <Check 
                            className="w-4 h-4 stroke-[2.5]" 
                            style={{ 
                              opacity: task.completed ? 1 : 0, 
                              transform: task.completed ? 'scale(1)' : 'scale(0.5)',
                              transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)' 
                            }} 
                          />
                        </button>

                        <div>
                          <p
                            className={`text-sm font-semibold transition-all duration-300 ${
                              task.completed ? 'text-sage-500 line-through opacity-70' : 'text-[#1D2A24]'
                            }`}
                          >
                            {task.title}
                          </p>
                          <p className={`text-xs mt-1 leading-normal transition-all duration-300 ${
                            task.completed ? 'text-sage-400 opacity-70' : 'text-sage-500'
                          }`}>
                            {task.reason}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href="/mission"
                  className="text-sm font-bold text-[#266B4E] flex items-center justify-start gap-1 hover:underline pt-6 cursor-pointer"
                >
                  Go to mission →
                </Link>
              </>
            )}
          </div>
          </ErrorBoundary>

          {/* 3. Your AI Briefing Card */}
          <ErrorBoundary onRetry={refetchBriefing}>
            <div className="bg-green-900 text-white rounded-card p-6 shadow-card flex flex-col justify-between">
              {(() => { if (briefingError) throw briefingError; return null; })()}
              <div>
                <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#D89A6E] rounded-modal text-[#0F291E] flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5 fill-[#0F291E]"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-base text-white leading-snug">Your AI Briefing</h3>
                  <p className="text-xs font-semibold text-[#5D826E]">Co-Founder</p>
                </div>
              </div>

              <p className="text-sm text-sage-200 leading-relaxed font-normal mb-8">
                {summaryData?.briefing?.content || "Good news first: pipeline grew ₦9M this week and your smoke test cleared its bar. The watch item is runway, now 8.4 months and tightening. I'd spend today on pricing, it&apos;s your riskiest untested assumption and it moves both revenue and runway."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleBriefingDoIt}
                className="flex-1 bg-[#D89A6E] hover:bg-[#9C5B34] text-white text-sm font-bold py-3 rounded-card transition-colors text-center cursor-pointer"
              >
                Do it
              </button>
              <button
                type="button"
                onClick={handleBriefingTellMeMore}
                className="flex-1 bg-[#15382A] hover:bg-[#1A4533] border border-[#1F4C39] text-white text-sm font-bold py-3 rounded-card transition-colors text-center cursor-pointer"
              >
                Tell me more
              </button>
            </div>
          </div>
          </ErrorBoundary>
        </section>

        {/* METRICS ROW */}
        <ErrorBoundary onRetry={refetchSummary}>
          {(() => { if (summaryError) throw summaryError; return null; })()}
          <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <Link href="/app/finance" className="bg-white p-5 rounded-card border border-green-100 shadow-card flex flex-col justify-between hover:border-sage-300 transition-colors">
            <div>
              <span className="text-[10px] font-bold text-sage-500 uppercase tracking-wider block mb-3">
                {summaryData?.kpis[0]?.label || 'MONTHLY REVENUE'}
              </span>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-display font-extrabold text-[#1D2A24]">{summaryData?.kpis[0]?.value || '₦1.6M'}</span>
                <span className={`text-xs font-semibold ${summaryData?.kpis[0]?.trend === 'down' ? 'text-[#A8382A]' : 'text-[#266B4E]'}`}>{summaryData?.kpis[0]?.delta || '+12%'}</span>
              </div>
            </div>
            <svg className={`w-full h-6 ${summaryData?.kpis[0]?.trend === 'down' ? 'text-[#A8382A]' : 'text-[#266B4E]'}`} viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M 0,16 L 25,12 L 45,14 L 65,8 L 100,3" />
            </svg>
          </Link>

          <Link 
            href="/app/finance/runway"
            className={`bg-white p-5 rounded-card border shadow-card flex flex-col justify-between transition-colors duration-300 ${
              summaryData?.kpis[1]?.isAlert ? 'border-[var(--red-600)] shadow-[0_4px_12px_var(--red-100)]' : 'border-green-100 hover:border-sage-300'
            }`}
          >
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-3 ${
                summaryData?.kpis[1]?.isAlert ? 'text-[var(--red-600)]' : 'text-sage-500'
              }`}>
                {summaryData?.kpis[1]?.label || 'RUNWAY'}
              </span>
              <div className="flex items-baseline gap-2 mb-4">
                <span className={`text-2xl font-display font-extrabold ${
                  summaryData?.kpis[1]?.isAlert ? 'text-[var(--red-600)]' : 'text-[#1D2A24]'
                }`}>
                  {summaryData?.kpis[1]?.value || '8.4 mo'}
                </span>
                <span className={`text-xs font-semibold ${summaryData?.kpis[1]?.isAlert || summaryData?.kpis[1]?.trend === 'down' ? 'text-[var(--red-600)]' : 'text-[#266B4E]'}`}>
                  {summaryData?.kpis[1]?.delta || '-0.6'}
                </span>
              </div>
            </div>
            <svg className={`w-full h-6 ${summaryData?.kpis[1]?.isAlert || summaryData?.kpis[1]?.trend === 'down' ? 'text-[var(--red-600)]' : 'text-[#266B4E]'}`} viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M 0,4 L 35,7 L 70,12 L 100,17" />
            </svg>
          </Link>

          <Link href="/app/sales" className="bg-white p-5 rounded-card border border-green-100 shadow-card flex flex-col justify-between hover:border-sage-300 transition-colors">
            <div>
              <span className="text-[10px] font-bold text-sage-500 uppercase tracking-wider block mb-3">
                {summaryData?.kpis[2]?.label || 'PIPELINE VALUE'}
              </span>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-display font-extrabold text-[#1D2A24]">{summaryData?.kpis[2]?.value || '₦42M'}</span>
                <span className={`text-xs font-semibold ${summaryData?.kpis[2]?.trend === 'down' ? 'text-[#A8382A]' : 'text-[#266B4E]'}`}>{summaryData?.kpis[2]?.delta || '+₦9M'}</span>
              </div>
            </div>
            <svg className={`w-full h-6 ${summaryData?.kpis[2]?.trend === 'down' ? 'text-[#A8382A]' : 'text-[#266B4E]'}`} viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M 0,17 L 35,12 L 65,10 L 100,4" />
            </svg>
          </Link>

          <Link href="/app/marketing" className="bg-white p-5 rounded-card border border-green-100 shadow-card flex flex-col justify-between hover:border-sage-300 transition-colors">
            <div>
              <span className="text-[10px] font-bold text-sage-500 uppercase tracking-wider block mb-3">
                {summaryData?.kpis[3]?.label || 'CAMPAIGN CTR'}
              </span>
              <div className="flex items-baseline gap-1.5 mb-4">
                <span className="text-2xl font-display font-extrabold text-[#1D2A24]">{summaryData?.kpis[3]?.value || '3.8%'}</span>
                <span className={`text-xs font-semibold ${summaryData?.kpis[3]?.trend === 'down' ? 'text-[#A8382A]' : 'text-[#266B4E]'}`}>{summaryData?.kpis[3]?.delta || '+0.4pt'}</span>
              </div>
            </div>
            <svg className={`w-full h-6 ${summaryData?.kpis[3]?.trend === 'down' ? 'text-[#A8382A]' : 'text-[#266B4E]'}`} viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M 0,15 L 25,13 L 45,14 L 65,9 L 100,7" />
            </svg>
          </Link>

          <Link href="/app/team" className="bg-white p-5 rounded-card border border-green-100 shadow-card flex flex-col justify-between hover:border-sage-300 transition-colors">
            <div>
              <span className="text-[10px] font-bold text-sage-500 uppercase tracking-wider block mb-3">
                {summaryData?.kpis[4]?.label || 'TASKS THIS WEEK'}
              </span>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-display font-extrabold text-[#1D2A24]">{summaryData?.kpis[4]?.value || '14'}</span>
                <span className={`text-xs font-semibold ${summaryData?.kpis[4]?.trend === 'down' ? 'text-[#A8382A]' : 'text-[#266B4E]'}`}>{summaryData?.kpis[4]?.delta || '+3'}</span>
              </div>
            </div>
            <svg className={`w-full h-6 ${summaryData?.kpis[4]?.trend === 'down' ? 'text-[#A8382A]' : 'text-[#266B4E]'}`} viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M 0,17 L 30,13 L 65,12 L 100,6" />
            </svg>
          </Link>
          </section>
        </ErrorBoundary>

        {/* RISKS & OPPORTUNITIES ROW */}
        <ErrorBoundary onRetry={refetchSummary}>
          {(() => { if (summaryError) throw summaryError; return null; })()}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-sage-200/60 rounded-[24px] p-6 shadow-card flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-base text-[#1D2A24] pb-3 border-b border-sage-100">
                Risks
              </h3>
              <div className="divide-y divide-sage-100">
                {(summaryData?.risks || [
                  { id: 'r1', description: 'Runway is under 9 months and revenue has been flat for two months.', severity: 'red' },
                  { id: 'r2', description: 'A compliance filing is due in 9 days and hasn\'t been started.', severity: 'amber' },
                  { id: 'r3', description: 'The GigPay HR deal has had no activity for 14 days.', severity: 'amber' }
                ]).map((risk: any) => (
                  <div key={risk.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full ${risk.severity === 'red' ? 'bg-[#B84335]' : 'bg-[#9C5B34]'} shrink-0`} />
                      <p className="text-sm text-sage-700 leading-snug">
                        {risk.description}
                      </p>
                    </div>
                    <Link href={risk.moduleLink || (risk.id === 'r1' ? '/app/finance' : '/app/sales')} className="text-xs font-bold text-[#266B4E] hover:underline shrink-0">
                      Review
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-sage-200/60 rounded-[24px] p-6 shadow-card flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-base text-[#1D2A24] pb-3 border-b border-sage-100">
                Opportunities
              </h3>
              <div className="divide-y divide-sage-100">
                {(summaryData?.opportunities || [
                  { id: 'o1', description: 'A ₦5M grant match closes in 3 weeks and fits your profile.' },
                  { id: 'o2', description: 'Your smoke test hit 9% conversion, above your 5% bar.' },
                  { id: 'o3', description: 'Two interviews flagged the same feature, worth a quick MVP task.' }
                ]).map((opp: any) => (
                  <div key={opp.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#266B4E] shrink-0" />
                      <p className="text-sm text-sage-700 leading-snug">
                        {opp.description}
                      </p>
                    </div>
                    <Link href={opp.moduleLink || (opp.id === 'o1' ? '/app/funding/grants' : '/app/validation')} className="text-xs font-bold text-[#266B4E] hover:underline shrink-0">
                      See fit
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        </ErrorBoundary>

        {/* BOTTOM ROW */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ErrorBoundary onRetry={refetchActivity}>
            <div className="bg-white border border-sage-200/60 rounded-[24px] p-6 shadow-card flex flex-col justify-between">
              {(() => { if (activityError) throw activityError; return null; })()}
              <div>
                <h3 className="font-bold text-base text-[#1D2A24] pb-4 border-b border-sage-100">
                Team activity
              </h3>
              <div className="divide-y divide-sage-100">
                {(activityData || [
                  { id: '1', actor: 'Amara Okafor', verb: 'completed', entity: 'the mission task “Interview 3 gig workers”', time: '2h ago' },
                  { id: '2', actor: 'Tayo', verb: 'returned', entity: 'your NDA with 2 comments', time: '5h ago' },
                  { id: '3', actor: 'Your AI Co-Founder', verb: 'drafted', entity: 'your Lean Canvas', time: 'Yesterday' },
                  { id: '4', actor: 'Grace', verb: 'categorized', entity: '12 transactions', time: 'Yesterday' },
                  { id: '5', actor: 'Daniel', verb: 'moved', entity: '“BodaBoda Union” to Proposal', time: '2d ago' },
                ]).map((activity: any) => {
                  const getInitials = (name: string) => {
                    if (!name) return '??';
                    if (name.includes('AI')) return null;
                    return name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                  };
                  const initials = getInitials(activity.actor);

                  return (
                    <div key={activity.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {initials ? (
                          <div className="w-7 h-7 rounded-full bg-[#1F4D3A] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {initials}
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-[#9C5B34] text-[#1F4D3A] flex items-center justify-center shrink-0">
                            <svg className="w-3 h-3 fill-[#1F4D3A]" viewBox="0 0 24 24">
                              <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                            </svg>
                          </div>
                        )}
                        <p className="text-xs text-sage-700 truncate">
                          <span className="font-medium text-[#1D2A24]">{activity.actor}</span> {activity.verb} {activity.entity}.
                        </p>
                      </div>
                      <span className="text-[11px] text-sage-400 shrink-0">{activity.time}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          </ErrorBoundary>

          <div className="bg-white border border-sage-200/60 rounded-[24px] p-6 shadow-card flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-base text-[#1D2A24] pb-4 border-b border-sage-100">
                Next 7 days
              </h3>

              <div className="space-y-3.5 mt-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-card bg-[#EAF2ED] text-[#1F4D3A] flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1D2A24]">Finish pricing experiment</p>
                    <p className="text-[11px] text-sage-500">Milestone · Friday</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-card bg-[#FBF0EE] text-[#C0564B] flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 stroke-current fill-none" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1D2A24]">CAC annual return</p>
                    <p className="text-[11px] text-sage-500">Compliance · in 9 days</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-card bg-[#EAF2ED] text-[#1F4D3A] flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 stroke-current fill-none" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1D2A24]">Investor call, Sahel Fund</p>
                    <p className="text-[11px] text-sage-500">Meeting · Tue 3:00 PM</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-card bg-[#FAF4E8] text-[#9C5B34] flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 stroke-current fill-none" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path d="M3 11l18-5v12L3 13v-2zM11.6 16.8a3 3 0 1 1-5.8-1.6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1D2A24]">Launch WhatsApp campaign</p>
                    <p className="text-[11px] text-sage-500">Marketing · Thursday</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FLOATING AI BUTTON */}
      <button
        type="button"
        onClick={() => openAiDrawer()}
        aria-label="AI Co-Founder action"
        className="fixed bottom-6 right-6 w-12 h-12 bg-[#9C5B34] hover:bg-[#9C5B34] text-[#1F4D3A] rounded-full flex items-center justify-center shadow-raised transition-transform hover:scale-105 z-30 cursor-pointer"
      >
        <svg className="w-5 h-5 fill-[#1F4D3A]" viewBox="0 0 24 24">
          <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
        </svg>
      </button>

      {/* SEARCH OVERLAY MODAL */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4">
          <div 
            onClick={closeAllOverlays}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          />

          <div className="relative w-full max-w-xl bg-white rounded-[24px] shadow-raised overflow-hidden border border-sage-100 z-10 flex flex-col">
            <div className="flex items-center px-5 py-3 border-b border-sage-100 bg-white">
              <Search className="w-4 h-4 text-sage-400 shrink-0 mr-3" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anything, docs, tasks, contacts, conversations..."
                className="w-full text-sm text-[#1C201D] placeholder-sage-400 focus:outline-hidden bg-transparent"
              />
              <button
                type="button"
                onClick={closeAllOverlays}
                className="p-1 rounded-input text-sage-400 hover:text-sage-600 hover:bg-sage-100 transition-colors ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-3 space-y-1">
              {[
                {
                  title: 'Dashboard',
                  subtitle: 'Overview',
                  icon: (
                    <svg className="w-4 h-4 text-[#266B4E]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2z" />
                    </svg>
                  ),
                },
                {
                  title: "Today&apos;s Mission",
                  subtitle: 'Overview',
                  icon: (
                    <svg className="w-4 h-4 text-[#266B4E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ),
                },
                {
                  title: 'Health Score',
                  subtitle: 'Overview',
                  icon: (
                    <svg className="w-4 h-4 text-[#266B4E]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18V4a8 8 0 010 16z" />
                    </svg>
                  ),
                },
                {
                  title: 'Roadmap',
                  subtitle: 'Overview',
                  icon: (
                    <svg className="w-4 h-4 text-[#266B4E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  ),
                },
                {
                  title: 'Business Builder',
                  subtitle: 'Build',
                  icon: (
                    <svg className="w-4 h-4 text-[#266B4E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M7 8h10M7 12h10M7 16h6" />
                    </svg>
                  ),
                },
                {
                  title: 'Finance Hub',
                  subtitle: 'Grow',
                  icon: <span className="text-sm font-bold text-[#266B4E]">₦</span>,
                },
                {
                  title: 'Funding Hub',
                  subtitle: 'Fund & protect',
                  icon: (
                    <svg className="w-4 h-4 text-[#266B4E]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l8 8-8 8-8-8 8-8z" />
                    </svg>
                  ),
                },
                {
                  title: 'Documents',
                  subtitle: 'Resources',
                  icon: (
                    <svg className="w-4 h-4 text-[#266B4E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18M9 21V9" />
                    </svg>
                  ),
                },
                {
                  title: 'Draft an NDA',
                  subtitle: 'AI action',
                  icon: (
                    <svg className="w-4 h-4 text-[#266B4E]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                    </svg>
                  ),
                },
                {
                  title: 'Sahel Fund',
                  subtitle: 'Contact',
                  icon: (
                    <svg className="w-4 h-4 text-[#266B4E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                    </svg>
                  ),
                },
              ]
                .filter((item) =>
                  item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={closeAllOverlays}
                    className="w-full flex items-center gap-3.5 p-2.5 rounded-modal hover:bg-[#F7F8F6] transition-colors text-left group"
                  >
                    <div className="w-10 h-10 rounded-modal bg-[#E8F1EC] flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1D2A24] leading-snug">{item.title}</p>
                      <p className="text-xs text-sage-400 font-medium">{item.subtitle}</p>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS DROPDOWN/POPOVER OVERLAY */}
      {isNotificationsOpen && (
        <div className="absolute right-6 top-16 z-50 w-80 md:w-96 bg-white rounded-[24px] shadow-raised border border-sage-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <h3 className="font-bold text-base text-[#1C201D]">Notifications</h3>
            <button
              type="button"
              onClick={markAllNotificationsRead}
              className="text-xs font-semibold text-[#266B4E] hover:underline cursor-pointer"
            >
              Mark all read
            </button>
          </div>

          <div className="divide-y divide-sage-100 max-h-[70vh] overflow-y-auto">
            {notifications.filter(n => n.unread).length === 0 ? (
              <div className="px-6 py-8 text-center text-sm font-medium text-sage-500">
                No new notifications.
              </div>
            ) : (
              notifications.filter(n => n.unread).map((notif) => {
                let iconContent;
                if (notif.type === 'ai') {
                  iconContent = (
                    <svg className="w-4 h-4 fill-[#266B4E]" viewBox="0 0 24 24">
                      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                    </svg>
                  );
                } else if (notif.type === 'finance') {
                  iconContent = <span className="text-xs font-bold text-[#266B4E]">₦</span>;
                } else if (notif.type === 'legal') {
                  iconContent = <span className="text-xs font-bold text-[#266B4E]">§</span>;
                } else {
                  iconContent = (
                    <svg className="w-4 h-4 fill-[#266B4E]" viewBox="0 0 24 24">
                      <path d="M12 2l8 8-8 8-8-8 8-8z" />
                    </svg>
                  );
                }

                return (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3.5 px-6 py-4 transition-colors cursor-pointer hover:bg-sage-50 ${
                      notif.unread ? 'bg-[#FDFBF7]' : 'bg-white'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-card bg-[#E8F1EC] flex items-center justify-center shrink-0 mt-0.5">
                      {iconContent}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#1C201D] leading-relaxed mb-1">
                        {notif.title}
                      </p>
                      <p className="text-[11px] text-sage-400 font-medium">
                        {notif.time}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* INVITE MODAL OVERLAY WITH CUSTOM DROPDOWN */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={closeAllOverlays}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          />

          <div className="relative w-full max-w-md bg-white rounded-[24px] shadow-raised overflow-visible p-8 border border-sage-100 z-10">
            <h2 className="text-2xl font-bold text-[#1C201D] font-display mb-2">
              Invite to {startupName}
            </h2>
            <p className="text-sm text-sage-500 mb-6 leading-relaxed">
              Teammates, mentors, or your accountant and lawyer (free seats).
            </p>

            <form onSubmit={handleSendInvite} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-sage-700 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="teammate@email.com"
                  className="w-full px-4 py-3 text-sm rounded-card border border-sage-200 focus:outline-hidden focus:ring-2 focus:ring-[#9C5B34] focus:border-transparent placeholder-sage-400 text-sage-800"
                />
              </div>

              {/* CUSTOM DROPDOWN COMPONENT */}
              <div className="relative">
                <label className="block text-xs font-semibold text-sage-700 mb-1.5">
                  Role
                </label>
                
                {/* Dropdown Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsRoleDropdownOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm rounded-card border border-sage-200 bg-white text-sage-800 focus:outline-none focus:ring-2 focus:ring-[#9C5B34] transition-all cursor-pointer"
                >
                  <span className="font-medium">{inviteRole}</span>
                  <ChevronDown className={`w-4 h-4 text-sage-500 transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Popup Menu */}
                {isRoleDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-20" 
                      onClick={() => setIsRoleDropdownOpen(false)} 
                    />
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-modal shadow-raised border border-sage-100 py-2 z-30 overflow-hidden">
                      {roleOptions.map((role) => {
                        const isSelected = inviteRole === role;
                        return (
                          <button
                            key={role}
                            type="button"
                            onClick={() => {
                              setInviteRole(role);
                              setIsRoleDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors cursor-pointer ${
                              isSelected 
                                ? 'bg-[#E8F1EC] text-[#266B4E] font-semibold' 
                                : 'text-sage-700 hover:bg-sage-50'
                            }`}
                          >
                            <span>{role}</span>
                            {isSelected && <Check className="w-4 h-4 text-[#266B4E]" />}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  type="button"
                  onClick={closeAllOverlays}
                  className="w-full py-3 px-4 border border-sage-300 text-sage-700 font-semibold text-sm rounded-card hover:bg-sage-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-[#9C5B34] hover:bg-[#9C5B34] text-white font-semibold text-sm rounded-card transition-colors shadow-card cursor-pointer"
                >
                  Send invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GENERAL BACKDROP FOR DRAWERS/NOTIFICATIONS */}
      {(isNotificationsOpen) && (
        <div 
          onClick={closeAllOverlays}
          className="fixed inset-0 bg-transparent z-40"
        />
      )}
    </div>
  );
}