'use client';

import React, { useState, useEffect, useRef } from 'react';
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

interface MissionTask {
  id: string;
  title: string;
  reason: string;
  completed: boolean;
}

interface NotificationItem {
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
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Toast State for Briefing Action
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // AI Chat Drawer State (Starts empty)
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const messageIdRef = useRef(0);
  const chatScrollRef = useRef<HTMLDivElement>(null);

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
    },
    {
      id: '2',
      title: 'Draft your pricing experiment',
      reason: 'Why: pricing moves both revenue and runway.',
      completed: false,
    },
    {
      id: '3',
      title: "Review Tayo's NDA comments",
      reason: 'Why: unblocks your first contractor.',
      completed: false,
    },
  ]);

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const closeAllOverlays = () => {
    setIsSidebarOpen(false);
    setIsSearchOpen(false);
    setIsInviteOpen(false);
    setIsNotificationsOpen(false);
    setIsAiDrawerOpen(false);
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

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isAiDrawerOpen]);

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Sending invite to:', inviteEmail, 'Role:', inviteRole);
    setInviteEmail('');
    setIsInviteOpen(false);
  };

  const handleSendMessage = (textToSend?: string) => {
    const content = textToSend || chatInput;
    if (!content.trim()) return;

    const createMessageId = (prefix: string) => {
      const timeBase = Date.now();
      const nextId = `${prefix}-${timeBase}-${messageIdRef.current}`;
      messageIdRef.current += 1;
      return nextId;
    };

    const newMsg: ChatMessage = {
      id: createMessageId('user'),
      sender: 'user',
      text: content,
    };

    setChatMessages((prev) => [...prev, newMsg]);
    if (!textToSend) setChatInput('');

    // Simulate AI response after a brief moment
    setTimeout(() => {
      const aiReply: ChatMessage = {
        id: createMessageId('assistant'),
        sender: 'assistant',
        text: `Good question. I'll pull the numbers from your workspace and walk you through "${content}", then I can turn the answer into a task or a document if useful.`,
      };
      setChatMessages((prev) => [...prev, aiReply]);
    }, 600);
  };

  // Handlers for AI Briefing Card Actions (Independent of the Chat Drawer)
  const handleBriefingDoIt = () => {
    // Automatically marks the pricing task as complete
    setTasks((prev) =>
      prev.map((t) => (t.id === '2' ? { ...t, completed: true } : t))
    );
    // Show the black toast notification matching the reference screenshot
    setToastMessage('Added “Draft a pricing experiment” to your tasks.');
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleBriefingTellMeMore = () => {
    console.log("Executed briefing action: 'Tell me more' (Expanded financial health breakdown)");
  };

  return (
    <div className="relative flex min-h-screen w-full min-w-0 flex-col bg-[#F7F8F6] text-[#1C201D] font-body lg:pl-64">
      {/* SIDEBAR (slides in on mobile, pinned from lg up) */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

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

      {/* MAIN DASHBOARD CONTENT */}
      <main className="flex-1 w-full min-w-0 max-w-7xl px-6 md:px-10 pt-4 pb-12 space-y-6">
        {/* GREETING SECTION */}
        <section className="mb-6">
          <h1 className="text-3xl font-display font-bold text-sage-900 mb-1">
            Good evening, Amara.
          </h1>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-sage-400">
            <p>Here&apos;s where Kolo stands today.</p>
            <span className="text-sage-500">Monday, Aug 17</span>
          </div>
        </section>

        {/* TOP CARDS ROW */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Startup Health Card */}
          <div className="rounded-card border border-green-100 bg-white p-6 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-base text-sage-900">Startup Health</h3>
                <span className="text-xs font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  +4 this week
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
                      className="text-[#266B4E]"
                      strokeWidth="9"
                      strokeDasharray={2 * Math.PI * 40}
                      strokeDashoffset={(2 * Math.PI * 40) * (1 - 0.72)}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-5xl font-display font-extrabold text-[#1D2A24] leading-none mb-1">
                      72
                    </span>
                    <span className="text-xs text-sage-500 font-medium">of 100</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-center text-sage-600 leading-relaxed px-2 mb-6">
                Strong for validation stage. Product is carrying you; financials are holding you back.
              </p>
            </div>

            <button
              type="button"
              className="text-sm font-bold text-[#266B4E] flex items-center justify-center gap-1 hover:underline pt-2 cursor-pointer"
            >
              See what&apos;s driving it →
            </button>
          </div>

          {/* 2. Today's Mission Card */}
          <div className="rounded-card border border-green-100 bg-white p-6 shadow-card flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-base text-sage-900">Today&apos;s Mission</h3>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-copper-700">
                  <Flame className="w-4 h-4 fill-copper-500 text-copper-500" />
                  <span>6-day streak</span>
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
                      className={`w-6 h-6 rounded-input flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        task.completed
                          ? 'bg-[#266B4E] text-white shadow-card'
                          : 'border border-sage-300 bg-white group-hover:border-sage-400'
                      }`}
                    >
                      {task.completed && <Check className="w-4 h-4 stroke-[2.5]" />}
                    </button>

                    <div>
                      <p
                        className={`text-sm font-semibold transition-colors ${
                          task.completed ? 'text-sage-500 line-through' : 'text-[#1D2A24]'
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="text-xs text-sage-500 mt-1 leading-normal">
                        {task.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="text-sm font-bold text-[#266B4E] flex items-center justify-start gap-1 hover:underline pt-6 cursor-pointer"
            >
              Go to mission →
            </button>
          </div>

          {/* 3. Your AI Briefing Card */}
          <div className="bg-green-900 text-white rounded-card p-6 shadow-card flex flex-col justify-between">
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
                Good news first: pipeline grew ₦9M this week and your smoke test cleared its bar. The watch item is runway, now 8.4 months and tightening. I&apos;d spend today on pricing, it&apos;s your riskiest untested assumption and it moves both revenue and runway.
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
        </section>

        {/* METRICS ROW */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-card border border-green-100 shadow-card flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-sage-500 uppercase tracking-wider block mb-3">
                MONTHLY REVENUE
              </span>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-display font-extrabold text-[#1D2A24]">₦1.6M</span>
                <span className="text-xs font-semibold text-[#266B4E]">+12%</span>
              </div>
            </div>
            <svg className="w-full h-6 text-[#266B4E]" viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M 0,16 L 25,12 L 45,14 L 65,8 L 100,3" />
            </svg>
          </div>

          <div className="bg-white p-5 rounded-card border border-green-100 shadow-card flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-sage-500 uppercase tracking-wider block mb-3">
                RUNWAY
              </span>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-display font-extrabold text-[#1D2A24]">8.4 mo</span>
                <span className="text-xs font-semibold text-[#A8382A]">-0.6</span>
              </div>
            </div>
            <svg className="w-full h-6 text-[#A8382A]" viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M 0,4 L 35,7 L 70,12 L 100,17" />
            </svg>
          </div>

          <div className="bg-white p-5 rounded-card border border-green-100 shadow-card flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-sage-500 uppercase tracking-wider block mb-3">
                PIPELINE VALUE
              </span>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-display font-extrabold text-[#1D2A24]">₦42M</span>
                <span className="text-xs font-semibold text-[#266B4E]">+₦9M</span>
              </div>
            </div>
            <svg className="w-full h-6 text-[#266B4E]" viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M 0,17 L 35,12 L 65,10 L 100,4" />
            </svg>
          </div>

          <div className="bg-white p-5 rounded-card border border-green-100 shadow-card flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-sage-500 uppercase tracking-wider block mb-3">
                CAMPAIGN CTR
              </span>
              <div className="flex items-baseline gap-1.5 mb-4">
                <span className="text-2xl font-display font-extrabold text-[#1D2A24]">3.8%</span>
                <span className="text-xs font-semibold text-[#266B4E]">+0.4pt</span>
              </div>
            </div>
            <svg className="w-full h-6 text-[#266B4E]" viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M 0,15 L 25,13 L 45,14 L 65,9 L 100,7" />
            </svg>
          </div>

          <div className="bg-white p-5 rounded-card border border-green-100 shadow-card flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-sage-500 uppercase tracking-wider block mb-3">
                TASKS THIS WEEK
              </span>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-display font-extrabold text-[#1D2A24]">14</span>
                <span className="text-xs font-semibold text-[#266B4E]">+3</span>
              </div>
            </div>
            <svg className="w-full h-6 text-[#266B4E]" viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M 0,17 L 30,13 L 65,12 L 100,6" />
            </svg>
          </div>
        </section>

        {/* RISKS & OPPORTUNITIES ROW */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-sage-200/60 rounded-[24px] p-6 shadow-card flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-base text-[#1D2A24] pb-3 border-b border-sage-100">
                Risks
              </h3>
              <div className="divide-y divide-sage-100">
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#B84335] shrink-0" />
                    <p className="text-sm text-sage-700 leading-snug">
                      Runway is under 9 months and revenue has been flat for two months.
                    </p>
                  </div>
                  <button type="button" className="text-xs font-bold text-[#266B4E] hover:underline shrink-0">
                    Review
                  </button>
                </div>
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#9C5B34] shrink-0" />
                    <p className="text-sm text-sage-700 leading-snug">
                      A compliance filing is due in 9 days and hasn&apos;t been started.
                    </p>
                  </div>
                  <button type="button" className="text-xs font-bold text-[#266B4E] hover:underline shrink-0">
                    Review
                  </button>
                </div>
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#9C5B34] shrink-0" />
                    <p className="text-sm text-sage-700 leading-snug">
                      The GigPay HR deal has had no activity for 14 days.
                    </p>
                  </div>
                  <button type="button" className="text-xs font-bold text-[#266B4E] hover:underline shrink-0">
                    Review
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-sage-200/60 rounded-[24px] p-6 shadow-card flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-base text-[#1D2A24] pb-3 border-b border-sage-100">
                Opportunities
              </h3>
              <div className="divide-y divide-sage-100">
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#266B4E] shrink-0" />
                    <p className="text-sm text-sage-700 leading-snug">
                      A ₦5M grant match closes in 3 weeks and fits your profile.
                    </p>
                  </div>
                  <button type="button" className="text-xs font-bold text-[#266B4E] hover:underline shrink-0">
                    See fit
                  </button>
                </div>
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#266B4E] shrink-0" />
                    <p className="text-sm text-sage-700 leading-snug">
                      Your smoke test hit 9% conversion, above your 5% bar.
                    </p>
                  </div>
                  <button type="button" className="text-xs font-bold text-[#266B4E] hover:underline shrink-0">
                    Review
                  </button>
                </div>
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#266B4E] shrink-0" />
                    <p className="text-sm text-sage-700 leading-snug">
                      Two interviews flagged the same feature, worth a quick MVP task.
                    </p>
                  </div>
                  <button type="button" className="text-xs font-bold text-[#266B4E] hover:underline shrink-0">
                    Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM ROW */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-sage-200/60 rounded-[24px] p-6 shadow-card flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-base text-[#1D2A24] pb-4 border-b border-sage-100">
                Team activity
              </h3>
              <div className="divide-y divide-sage-100">
                <div className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#1F4D3A] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      AO
                    </div>
                    <p className="text-xs text-sage-700 truncate">
                      You completed the mission task “Interview 3 gig workers”.
                    </p>
                  </div>
                  <span className="text-[11px] text-sage-400 shrink-0">2h ago</span>
                </div>

                <div className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#1F4D3A] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      TN
                    </div>
                    <p className="text-xs text-sage-700 truncate">
                      Tayo (Legal Advisor) returned your NDA with 2 comments.
                    </p>
                  </div>
                  <span className="text-[11px] text-sage-400 shrink-0">5h ago</span>
                </div>

                <div className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#9C5B34] text-[#1F4D3A] flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 fill-[#1F4D3A]" viewBox="0 0 24 24">
                        <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
                      </svg>
                    </div>
                    <p className="text-xs text-sage-700 truncate">
                      Your AI Co-Founder drafted your Lean Canvas.
                    </p>
                  </div>
                  <span className="text-[11px] text-sage-400 shrink-0">Yesterday</span>
                </div>

                <div className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#1F4D3A] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      GA
                    </div>
                    <p className="text-xs text-sage-700 truncate">
                      Grace (Accountant) categorized 12 transactions.
                    </p>
                  </div>
                  <span className="text-[11px] text-sage-400 shrink-0">Yesterday</span>
                </div>

                <div className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#1F4D3A] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      DK
                    </div>
                    <p className="text-xs text-sage-700 truncate">
                      Daniel moved “BodaBoda Union” to Proposal.
                    </p>
                  </div>
                  <span className="text-[11px] text-sage-400 shrink-0">2d ago</span>
                </div>
              </div>
            </div>
          </div>

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
        onClick={() => setIsAiDrawerOpen(true)}
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
                  title: "Today's Mission",
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
            {notifications.map((notif) => {
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
            })}
          </div>
        </div>
      )}

      {/* AI CO-FOUNDER CHAT DRAWER / OVERLAY */}
      {isAiDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            onClick={closeAllOverlays}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          />

          <div className="relative w-full max-w-lg bg-white h-full shadow-raised flex flex-col z-10 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-sage-100 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#9C5B34] rounded-modal text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 fill-[#0F291E]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#1C201D]">AI Co-Founder</h3>
                  <p className="text-xs text-sage-500">Knows your workspace</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeAllOverlays}
                className="p-1.5 rounded-card text-sage-400 hover:text-sage-600 hover:bg-sage-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body & Messages */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FAFAFA]">
              {/* Suggestion Pills */}
              <div className="flex flex-wrap gap-2.5 mb-4">
                {[
                  'What should I focus on this week?',
                  'Poke holes in my business model',
                  'How long is my runway?',
                  'Draft an NDA for a contractor',
                ].map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(suggestion)}
                    className="text-xs font-medium text-[#1C201D] bg-white border border-sage-200 px-4 py-2.5 rounded-full hover:border-[#1F4D3A] hover:bg-[#F4F8F6] transition-all cursor-pointer shadow-card"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {/* Chat Stream (Only renders when user interacts or selects a pill) */}
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-[#1F4D3A] text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Sparkles className="w-3.5 h-3.5 fill-white" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] p-4 text-sm leading-relaxed rounded-modal ${
                      msg.sender === 'user'
                        ? 'bg-[#1F4D3A] text-white rounded-br-xs'
                        : 'bg-white border border-sage-100 text-[#1C201D] shadow-card rounded-bl-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input Bar */}
            <div className="p-4 bg-white border-t border-sage-100">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  autoFocus
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask anything, strategy, money, legal..."
                  className="w-full bg-[#F7F8F6] border border-sage-200 text-sm rounded-modal px-4 py-3.5 pr-12 focus:outline-hidden focus:ring-2 focus:ring-[#9C5B34] focus:border-transparent text-[#1C201D] placeholder-sage-400"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  aria-label="Send message"
                  className={`absolute right-2.5 w-8 h-8 rounded-card flex items-center justify-center transition-all cursor-pointer ${
                    chatInput.trim()
                      ? 'bg-[#9C5B34] hover:bg-[#9C5B34] text-white shadow-card'
                      : 'bg-sage-200 text-sage-400 cursor-not-allowed'
                  }`}
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                </button>
              </form>
            </div>
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
              Invite to Kolo
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