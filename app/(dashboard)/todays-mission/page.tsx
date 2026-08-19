'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/sidebar'; // Adjust path as needed
import {
  Bell,
  Plus,
  Flame,
  MoreHorizontal,
  Flag,
  Clock,
  ArrowRight,
  GripVertical,
  Check,
} from 'lucide-react';

interface Task {
  id: number;
  title: string;
  reason: string;
  tag: string;
  duration: string;
  completed: boolean;
}

interface UpcomingTask {
  id: number;
  title: string;
  tag: string;
  dayGroup: string;
}

interface CompletedTaskGroup {
  group: string;
  tasks: {
    id: number;
    title: string;
  }[];
}

export default function TodaysMissionPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Settings');

  // Settings State
  const [missionSize, setMissionSize] = useState<number>(3);
  const [deliveryTime, setDeliveryTime] = useState<string>('6:00 AM');
  const [weekendsOff, setWeekendsOff] = useState<boolean>(true);

  const tabs = ['Today', 'Upcoming', 'Completed', 'Streaks', 'Settings'];

  // Today's Tasks
  const [todayTasks, setTodayTasks] = useState<Task[]>([
    {
      id: 1,
      title: 'Interview 3 gig workers about how they save today',
      reason: 'Why: this unblocks your Validation milestone due Friday.',
      tag: 'Validate demand',
      duration: '45 min',
      completed: false,
    },
    {
      id: 2,
      title: 'Draft your pricing experiment',
      reason: 'Why: pricing is your riskiest untested assumption and moves both revenue and runway.',
      tag: 'Pricing test',
      duration: '30 min',
      completed: false,
    },
    {
      id: 3,
      title: "Review Tayo's comments on the contractor NDA",
      reason: 'Why: it unblocks onboarding your first contractor next week.',
      tag: 'Legal setup',
      duration: '15 min',
      completed: false,
    },
  ]);

  // Upcoming Tasks
  const upcomingTasksGrouped: { group: string; tasks: UpcomingTask[] }[] = [
    {
      group: 'TOMORROW, TUE',
      tasks: [
        {
          id: 101,
          title: 'Send the pricing survey to 20 users',
          tag: 'Pricing test',
          dayGroup: 'TOMORROW, TUE',
        },
        {
          id: 102,
          title: "Log this week's interview notes",
          tag: 'Validate demand',
          dayGroup: 'TOMORROW, TUE',
        },
      ],
    },
    {
      group: 'WED',
      tasks: [
        {
          id: 103,
          title: 'Draft the WhatsApp launch post',
          tag: 'First campaign',
          dayGroup: 'WED',
        },
      ],
    },
    {
      group: 'THU',
      tasks: [
        {
          id: 104,
          title: 'Review runway assumptions with Grace',
          tag: 'Finance',
          dayGroup: 'THU',
        },
      ],
    },
    {
      group: 'FRI',
      tasks: [
        {
          id: 105,
          title: 'Close out the validation milestone',
          tag: 'Validate demand',
          dayGroup: 'FRI',
        },
      ],
    },
  ];

  // Completed Tasks
  const completedTasksGrouped: CompletedTaskGroup[] = [
    {
      group: 'TODAY',
      tasks: [
        {
          id: 201,
          title: 'Interview 3 gig workers about how they save today',
        },
      ],
    },
    {
      group: 'YESTERDAY',
      tasks: [
        {
          id: 202,
          title: 'Set up the smoke-test landing page',
        },
        {
          id: 203,
          title: 'Categorized last month’s expenses',
        },
      ],
    },
    {
      group: 'SATURDAY',
      tasks: [
        {
          id: 204,
          title: 'Wrote the problem statement',
        },
        {
          id: 205,
          title: 'Shortlisted 3 grant options',
        },
      ],
    },
  ];

  // Matrix representing the 14-week activity grid (7 rows x 14 columns)
  const activityGrid: number[][] = [
    [0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 0, 0, 0, 0],
    [3, 3, 3, 0, 0, 1, 1, 2, 2, 2, 3, 3, 0, 0],
    [2, 2, 2, 3, 3, 3, 0, 1, 1, 1, 2, 2, 0, 0],
    [1, 1, 1, 1, 3, 3, 3, 0, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 2, 2, 3, 3, 3, 0, 0, 0, 0],
    [3, 3, 3, 0, 0, 1, 1, 2, 2, 2, 3, 3, 0, 0],
    [2, 2, 2, 3, 3, 0, 0, 1, 1, 1, 2, 2, 0, 0],
  ];

  const levelColorMap = [
    'bg-[#EBF2EE]',
    'bg-[#B5D4C0]',
    'bg-[#4C8260]',
    'bg-[#193C28]',
  ];

  const toggleTodayTask = (id: number) => {
    setTodayTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  return (
    <div className="flex min-h-screen bg-[#F7F7F5] text-[#1E2923]">
      {/* Sidebar Component */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Sticky Top Header & Tabs Wrapper */}
        <div className="sticky top-0 z-40 bg-[#F7F7F5]">
          {/* Main Header Bar */}
          <header className="bg-white border-b border-[#EBEBE6] px-4 md:px-8 py-3.5 flex items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              {/* Mobile-Only Standalone C Logo Button */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden w-10 h-10 rounded-2xl bg-[#173B28] text-[#D4B871] flex items-center justify-center font-bold text-base shadow-xs hover:opacity-90 transition-opacity shrink-0"
                aria-label="Open sidebar"
              >
                C
              </button>

              {/* Breadcrumb Navigation */}
              <div className="flex items-center gap-2 text-base md:text-lg font-semibold">
                <span className="text-[#8E9B90]">Workspace</span>
                <span className="text-[#8E9B90]">/</span>
                <h1 className="text-[#1E2923] font-bold truncate">Today's Mission</h1>
              </div>
            </div>

            {/* Top Right Action Controls */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 bg-[#E6EFEA] text-[#183B28] px-3.5 py-1.5 rounded-full text-xs font-medium">
                <span className="text-[#556358]">Health</span>
                <span className="font-bold text-sm">72</span>
                <span className="text-[10px] text-[#2D5A3F]">↑</span>
              </div>

              <button className="relative p-2.5 bg-[#F5F5F0] hover:bg-[#EBEBE6] rounded-full transition-colors text-[#1E2923]">
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 bg-[#A5823D] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  5
                </span>
              </button>

              <button className="flex items-center gap-1.5 bg-[#A5823D] hover:bg-[#8F6F30] text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-xs">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Invite</span>
              </button>
            </div>
          </header>

          {/* Sticky Tab Navigation Bar */}
          <div className="border-b border-[#EBEBE6] px-4 md:px-8 py-3 bg-[#F7F7F5]">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-[#E7DDC8] text-[#1E2923] font-semibold'
                        : 'bg-transparent text-[#617065] hover:bg-[#EBEBE6]'
                    }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scrollable Page Body Content */}
        <main className="p-4 md:p-8 max-w-4xl w-full mx-auto flex-1 flex flex-col gap-6">
          {/* TAB 1: TODAY */}
          {activeTab === 'Today' && (
            <>
              <div className="flex items-start justify-between gap-4 pt-2">
                <div>
                  <h2 className="text-3xl font-serif font-semibold text-[#1E2923] tracking-tight">
                    Today's Mission
                  </h2>
                  <p className="text-sm text-[#768478] mt-1 font-medium">
                    Tuesday, Aug 18
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-[#F7EEDC] text-[#8C6D2D] px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-2xs shrink-0">
                  <Flame className="w-4 h-4 fill-[#E09332] text-[#E09332]" />
                  <span>6-day streak</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {todayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white rounded-2xl p-6 border border-[#EBEBE6] shadow-xs hover:border-[#D5DDD6] transition-all flex items-start gap-4"
                  >
                    <button
                      onClick={() => toggleTodayTask(task.id)}
                      className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center shrink-0 mt-0.5 ${
                        task.completed
                          ? 'bg-[#183B28] border-[#183B28] text-white'
                          : 'border-[#C5CFC7] hover:border-[#183B28] bg-white'
                      }`}
                    >
                      {task.completed && <span className="text-xs font-bold">✓</span>}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className={`font-semibold text-base text-[#1E2923] leading-snug ${
                            task.completed ? 'line-through text-[#8E9B90]' : ''
                          }`}
                        >
                          {task.title}
                        </h3>
                        <button className="text-[#8E9B90] hover:text-[#1E2923] p-1 transition-colors shrink-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-xs text-[#617065] leading-relaxed mt-1 mb-3">
                        {task.reason}
                      </p>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 bg-[#EAF2ED] text-[#2D5A3F] text-xs font-medium px-3 py-1 rounded-full">
                          <Flag className="w-3 h-3 fill-[#2D5A3F]" />
                          {task.tag}
                        </span>
                        <span className="inline-flex items-center gap-1.5 bg-[#F5F5F0] text-[#617065] text-xs font-medium px-3 py-1 rounded-full">
                          <Clock className="w-3 h-3" />
                          {task.duration}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                <button className="w-full py-4 border-2 border-dashed border-[#D5DDD6] hover:border-[#183B28] rounded-2xl text-xs font-semibold text-[#556358] hover:text-[#183B28] transition-colors bg-white/40 hover:bg-white text-center mt-1">
                  + Add a task
                </button>

                <div className="flex justify-center pt-2 pb-6">
                  <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#183B28] hover:underline">
                    <span>View roadmap</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: UPCOMING */}
          {activeTab === 'Upcoming' && (
            <div className="flex flex-col gap-8 pt-2 pb-12">
              <div>
                <h2 className="text-3xl font-serif font-semibold text-[#1E2923] tracking-tight">
                  Upcoming
                </h2>
                <p className="text-xs md:text-sm text-[#768478] mt-1.5 font-normal">
                  The next 7 days, drawn from your roadmap. Reorder any time.
                </p>
              </div>

              <div className="flex flex-col gap-6">
                {upcomingTasksGrouped.map((section) => (
                  <div key={section.group} className="flex flex-col gap-2.5">
                    <h3 className="text-[11px] font-bold tracking-wider text-[#768478] uppercase">
                      {section.group}
                    </h3>

                    <div className="flex flex-col gap-2.5">
                      {section.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-white rounded-2xl px-5 py-4 border border-[#EBEBE6] shadow-2xs hover:border-[#D5DDD6] transition-all flex items-center justify-between gap-4 group cursor-grab active:cursor-grabbing"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <GripVertical className="w-4 h-4 text-[#C0C9C2] group-hover:text-[#8E9B90] transition-colors shrink-0" />
                            <span className="text-sm font-semibold text-[#1E2923] truncate">
                              {task.title}
                            </span>
                          </div>

                          <span className="bg-[#EAF2ED] text-[#2D5A3F] text-xs font-medium px-3.5 py-1.5 rounded-full shrink-0">
                            {task.tag}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: COMPLETED */}
          {activeTab === 'Completed' && (
            <div className="flex flex-col gap-8 pt-2 pb-12">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-3xl font-serif font-semibold text-[#1E2923] tracking-tight">
                  Completed
                </h2>

                <div className="bg-[#EAF2ED] text-[#2D5A3F] px-4 py-2 rounded-full text-xs font-semibold shrink-0">
                  This week: 86% complete
                </div>
              </div>

              <div className="flex flex-col gap-6">
                {completedTasksGrouped.map((section) => (
                  <div key={section.group} className="flex flex-col gap-2.5">
                    <h3 className="text-[11px] font-bold tracking-wider text-[#768478] uppercase">
                      {section.group}
                    </h3>

                    <div className="flex flex-col gap-2.5">
                      {section.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-white rounded-2xl px-5 py-4 border border-[#EBEBE6] shadow-2xs flex items-center gap-3.5"
                        >
                          <div className="w-6 h-6 rounded-lg bg-[#2B4C38] flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                          </div>

                          <span className="text-sm font-medium text-[#1E2923]">
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: STREAKS */}
          {activeTab === 'Streaks' && (
            <div className="flex flex-col gap-8 pt-2 pb-12">
              <div>
                <h2 className="text-3xl font-serif font-semibold text-[#1E2923] tracking-tight">
                  Streak history
                </h2>
                <p className="text-xs md:text-sm text-[#768478] mt-1.5 font-normal">
                  Consistency beats intensity.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-[#EBEBE6] shadow-2xs flex flex-col justify-between h-36">
                  <span className="text-[11px] font-bold tracking-wider text-[#768478] uppercase">
                    CURRENT STREAK
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-serif font-semibold text-[#1E2923]">
                      6 days
                    </span>
                    <span className="text-2xl">🔥</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-[#EBEBE6] shadow-2xs flex flex-col justify-between h-36">
                  <span className="text-[11px] font-bold tracking-wider text-[#768478] uppercase">
                    BEST STREAK
                  </span>
                  <span className="text-3xl font-serif font-semibold text-[#1E2923]">
                    21 days
                  </span>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-[#EBEBE6] shadow-2xs flex flex-col justify-between h-36">
                  <span className="text-[11px] font-bold tracking-wider text-[#768478] uppercase">
                    COMPLETION (90D)
                  </span>
                  <span className="text-3xl font-serif font-semibold text-[#1E2923]">
                    82%
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#EBEBE6] shadow-2xs flex flex-col gap-6">
                <span className="text-xs font-semibold text-[#1E2923]">
                  Last 14 weeks
                </span>

                <div className="overflow-x-auto pb-2 no-scrollbar">
                  <div className="grid grid-rows-7 grid-flow-col gap-1.5 w-max">
                    {activityGrid.map((row, rowIndex) =>
                      row.map((level, colIndex) => (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className={`w-4 h-4 rounded-xs transition-colors ${levelColorMap[level]}`}
                        />
                      ))
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#768478] font-medium">
                  <span>Less</span>
                  <div className="flex items-center gap-1.5">
                    {levelColorMap.map((colorClass, idx) => (
                      <div
                        key={idx}
                        className={`w-3.5 h-3.5 rounded-xs ${colorClass}`}
                      />
                    ))}
                  </div>
                  <span>More</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SETTINGS */}
          {activeTab === 'Settings' && (
            <div className="flex flex-col gap-8 pt-2 pb-12">
              {/* Header Info */}
              <div>
                <h2 className="text-3xl font-serif font-semibold text-[#1E2923] tracking-tight">
                  Mission settings
                </h2>
                <p className="text-xs md:text-sm text-[#768478] mt-1.5 font-normal">
                  Shape how your daily mission arrives.
                </p>
              </div>

              {/* Mission Size Card */}
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#EBEBE6] shadow-2xs flex flex-col gap-6">
                <h3 className="text-sm font-semibold text-[#1E2923]">
                  Mission size
                </h3>

                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((size) => {
                    const isSelected = missionSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => setMissionSize(size)}
                        className={`rounded-xl p-5 border transition-all flex flex-col items-center justify-center cursor-pointer ${
                          isSelected
                            ? 'bg-[#E3EFE8] border-[#183B28] text-[#183B28]'
                            : 'bg-white border-[#EBEBE6] text-[#1E2923] hover:border-[#C5CFC7]'
                        }`}
                      >
                        <span className="text-2xl font-serif font-semibold">
                          {size}
                        </span>
                        <span className="text-xs text-[#768478] mt-1 font-medium">
                          {size === 1 ? 'task' : 'tasks'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Time & Weekends Off Card */}
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#EBEBE6] shadow-2xs flex flex-col gap-6">
                {/* Delivery Time Option */}
                <div className="flex items-center justify-between gap-4 pb-6 border-b border-[#F0F0EC]">
                  <div>
                    <h3 className="text-sm font-semibold text-[#1E2923]">
                      Delivery time
                    </h3>
                    <p className="text-xs text-[#768478] mt-1 font-normal">
                      When your mission lands each morning.
                    </p>
                  </div>

                  <select
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    className="bg-white border border-[#EBEBE6] rounded-xl px-4 py-2 text-xs font-medium text-[#1E2923] focus:outline-none focus:border-[#183B28] cursor-pointer shadow-2xs"
                  >
                    <option value="5:00 AM">5:00 AM</option>
                    <option value="6:00 AM">6:00 AM</option>
                    <option value="7:00 AM">7:00 AM</option>
                    <option value="8:00 AM">8:00 AM</option>
                    <option value="9:00 AM">9:00 AM</option>
                  </select>
                </div>

                {/* Weekends Off Option */}
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[#1E2923]">
                      Weekends off
                    </h3>
                    <p className="text-xs text-[#768478] mt-1 font-normal">
                      Rest is a strategy too.
                    </p>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => setWeekendsOff(!weekendsOff)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors relative flex items-center shrink-0 cursor-pointer ${
                      weekendsOff ? 'bg-[#183B28]' : 'bg-[#E1E4E1]'
                    }`}
                    aria-label="Toggle weekends off"
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                        weekendsOff ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}