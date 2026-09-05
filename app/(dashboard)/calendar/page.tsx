'use client';

import React, { useState } from 'react';
import { useSidebar } from '@/components/sidebar-context'; 
import { 
  Bell,
  Plus,
  Menu,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  Clock,
  Circle
} from 'lucide-react';

// --- TYPESCRIPT INTERFACES & TYPES ---
type CalendarSubTab = 'Month' | 'Week' | 'Agenda' | 'Milestones' | 'Sync';
type FilterType = 'All' | 'Milestone' | 'Meeting' | 'Deadline' | 'Task';

interface CalendarEventItem {
  day: number;
  title: string;
  type: 'milestone' | 'meeting' | 'deadline' | 'task';
  time?: string;
}

interface CalendarWeekEventItem {
  dayIndex: number; // 0 for Sun, 1 for Mon, etc.
  dayNum: number;
  title: string;
  time: string;
  type: 'milestone' | 'meeting' | 'deadline' | 'task';
}

interface AgendaItemData {
  time: string;
  title: string;
  subtitle: string;
  type: 'Meeting' | 'Milestone' | 'Task' | 'Deadline';
  borderColor: string;
}

interface AgendaDayGroupData {
  dateLabel: string;
  items: AgendaItemData[];
}

interface MilestoneItemData {
  title: string;
  dueDate: string;
  status: 'On track' | 'At risk' | 'Complete' | 'Not started';
  progress: number;
  tasksInfo: string;
  cardBorderClass?: string;
  progressBarClass: string;
  badgeClass: string;
  iconType: 'progress' | 'risk' | 'complete' | 'default';
}

// --- MOCK DATA ---
const CALENDAR_EVENTS_DATA: CalendarEventItem[] = [
  { day: 2, title: 'Validation milestone review', type: 'milestone' },
  { day: 6, title: 'Partner call, Sahel Fund', type: 'meeting' },
  { day: 9, title: 'VAT filing due', type: 'deadline' },
  { day: 13, title: 'Interview 3 gig workers', type: 'task' },
  { day: 13, title: 'Pricing test kickoff', type: 'milestone' },
  { day: 16, title: 'Demo call, Lagos Riders', type: 'meeting' },
  { day: 20, title: 'CAC annual return', type: 'deadline' },
  { day: 24, title: 'Investor update send', type: 'task' },
  { day: 27, title: 'Weekly review', type: 'meeting' },
  { day: 27, title: 'Close validation milestone', type: 'milestone' },
  { day: 29, title: 'Grant deadline, GIZ', type: 'deadline' },
];

const DAYS_OF_WEEK_LIST = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const CALENDAR_DAYS_GRID_MATRIX = [
  [null, null, null, 1, 2, 3, 4],
  [5, 6, 7, 8, 9, 10, 11],
  [12, 13, 14, 15, 16, 17, 18],
  [19, 20, 21, 22, 23, 24, 25],
  [26, 27, 28, 29, 30, 31, null]
];

const WEEK_DAYS_LIST = [
  { name: 'SUN', num: 12 },
  { name: 'MON', num: 13 },
  { name: 'TUE', num: 14 },
  { name: 'WED', num: 15 },
  { name: 'THU', num: 16 },
  { name: 'FRI', num: 17 },
  { name: 'SAT', num: 18 },
];

const WEEK_EVENTS_DATA: CalendarWeekEventItem[] = [
  { dayIndex: 1, dayNum: 13, title: 'Interview 3 gig workers', time: '09:00 AM', type: 'task' },
  { dayIndex: 1, dayNum: 13, title: 'Pricing test kickoff', time: '02:00 PM', type: 'milestone' },
  { dayIndex: 4, dayNum: 16, title: 'Demo call, Lagos Riders', time: '11:00 AM', type: 'meeting' },
];

const HOURS_LIST = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', 
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', 
  '04:00 PM', '05:00 PM'
];

const AGENDA_GROUPS_DATA: AgendaDayGroupData[] = [
  {
    dateLabel: 'TODAY, MON JUL 27',
    items: [
      { time: '09:00', title: 'Weekly review', subtitle: 'With Daniel', type: 'Meeting', borderColor: 'border-l-[#183B28]' },
      { time: '17:00', title: 'Close validation milestone', subtitle: 'Roadmap milestone', type: 'Milestone', borderColor: 'border-l-[#B39353]' },
    ]
  },
  {
    dateLabel: 'TOMORROW, TUE',
    items: [
      { time: '14:00', title: 'Send pricing survey to 20 users', subtitle: 'From your mission', type: 'Task', borderColor: 'border-l-[#1E3E2B]' },
    ]
  },
  {
    dateLabel: 'WED JUL 29',
    items: [
      { time: 'All day', title: 'Grant deadline, GIZ Digital Inclusion Fund', subtitle: 'Application due', type: 'Deadline', borderColor: 'border-l-[#B93838]' },
    ]
  },
  {
    dateLabel: 'THU JUL 30',
    items: [
      { time: '11:00', title: 'Demo call, MarketPlus', subtitle: 'Sales pipeline', type: 'Meeting', borderColor: 'border-l-[#183B28]' },
      { time: '15:00', title: 'Review runway assumptions', subtitle: 'With Grace', type: 'Task', borderColor: 'border-l-[#1E3E2B]' },
    ]
  },
];

const MILESTONES_DATA_LIST: MilestoneItemData[] = [
  {
    title: 'Validate demand with 20 interviews',
    dueDate: 'Due Friday, Jul 31',
    status: 'On track',
    progress: 85,
    tasksInfo: '11 of 13 tasks complete',
    progressBarClass: 'bg-[#B39353]',
    badgeClass: 'bg-[#F2ECE1] text-[#7A6025]',
    iconType: 'progress',
  },
  {
    title: 'Pricing test concluded',
    dueDate: 'Due Aug 8',
    status: 'At risk',
    progress: 35,
    tasksInfo: '3 of 9 tasks complete · blocked on survey send',
    cardBorderClass: 'border-[#B93838]/60 bg-white',
    progressBarClass: 'bg-[#B93838]',
    badgeClass: 'bg-[#FDF2F2] text-[#B93838]',
    iconType: 'risk',
  },
  {
    title: 'Company incorporated',
    dueDate: 'Completed Jun 20',
    status: 'Complete',
    progress: 100,
    tasksInfo: '6 of 6 tasks complete',
    progressBarClass: 'bg-[#183B28]',
    badgeClass: 'bg-[#E5EFEA] text-[#183B28]',
    iconType: 'complete',
  },
  {
    title: 'First 100 paying savers',
    dueDate: 'Due Sep 30',
    status: 'Not started',
    progress: 0,
    tasksInfo: '0 of 8 tasks complete',
    progressBarClass: 'bg-[#D5DDD6]',
    badgeClass: 'bg-[#F5F5F0] text-[#617065]',
    iconType: 'default',
  },
  {
    title: 'Pre-seed round closed',
    dueDate: 'Due Dec 15',
    status: 'Not started',
    progress: 0,
    tasksInfo: '0 of 12 tasks complete',
    progressBarClass: 'bg-[#D5DDD6]',
    badgeClass: 'bg-[#F5F5F0] text-[#617065]',
    iconType: 'default',
  },
];

export default function CalendarUnifiedPage(): React.JSX.Element {
  const { openSidebar } = useSidebar();
  
  const [activeTab, setActiveTab] = useState<CalendarSubTab>('Month');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State for New Event/Milestone Drawer
  const [isEventModalOpen, setIsEventModalOpen] = useState<boolean>(false);
  const [eventTitle, setEventTitle] = useState<string>('');
  const [eventType, setEventType] = useState<'milestone' | 'meeting' | 'deadline' | 'task'>('meeting');
  const [eventDate, setEventDate] = useState<string>('2026-07-15');

  // Sync state variables
  const [isGoogleConnected, setIsGoogleConnected] = useState<boolean>(true);
  const [isOutlookConnected, setIsOutlookConnected] = useState<boolean>(false);
  const [isAppleConnected, setIsAppleConnected] = useState<boolean>(false);
  const [blockFocusTime, setBlockFocusTime] = useState<boolean>(true);
  const [remindDeadlines, setRemindDeadlines] = useState<boolean>(true);
  const [showWeekends, setShowWeekends] = useState<boolean>(false);

  const showToast = (msg: string): void => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCreateEvent = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    setIsEventModalOpen(false);
    showToast(activeTab === 'Milestones' ? 'New milestone created.' : 'New event created.');
    setEventTitle('');
  };

  const getEventBadgeStyles = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'milestone':
        return 'bg-[#F2ECE1] text-[#7A6025] border-l-2 border-[#B39353]';
      case 'meeting':
        return 'bg-[#183B28] text-white';
      case 'deadline':
        return 'bg-[#FDF2F2] text-[#B93838] border-l-2 border-[#B93838]';
      case 'task':
        return 'bg-[#E5EFEA] text-[#1E3E2B]';
      default:
        return 'bg-[#F5F5F0] text-[#617065]';
    }
  };

  const filteredEvents = CALENDAR_EVENTS_DATA.filter(ev => {
    if (selectedFilter === 'All') return true;
    return ev.type.toLowerCase() === selectedFilter.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#1E2923] font-sans antialiased relative selection:bg-[#EAD5C6]">
      
      {/* Top Banner Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-[#12291F] text-white px-5 py-2.5 rounded-xl shadow-lg flex items-center space-x-2.5 text-sm font-medium transition-all duration-300">
          <span className="bg-[#183B28] text-white rounded-full p-0.5 text-xs">✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 border-b border-[#E8E8E2] px-4 md:px-6 py-3 flex items-center justify-between bg-white w-full">
        {/* Left Side */}
        <div className="flex items-center space-x-2.5">
          <button 
            onClick={openSidebar}
            className="md:hidden w-8 h-8 rounded-lg border border-[#E0E0DA] bg-white text-[#183B28] hover:bg-gray-50 flex items-center justify-center transition-colors shrink-0 shadow-xs"
            aria-label="Toggle Sidebar"
          >
            <Menu size={16} />
          </button>

          <div className="flex items-center space-x-2 text-xs sm:text-sm font-medium tracking-tight">
            <span className="text-[#1E2923] font-semibold">Workspace</span>
            <span className="text-[#8E9B90]">/</span>
            <span className="text-[#8E9B90] font-normal">Calendar</span>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <div className="hidden md:flex bg-[#EAF2ED] text-[#1E3E2B] px-3 py-1 rounded-full text-xs font-semibold items-center space-x-1.5 border border-[#D5DDD6]">
            <span>Health</span>
            <span className="font-bold">72</span>
            <span className="text-xs">↑</span>
          </div>
          
          <button 
            onClick={() => showToast('Notifications opened.')}
            className="relative w-8 h-8 rounded-full border border-[#E0E0DA] bg-white flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors shadow-xs shrink-0"
            aria-label="Notifications"
          >
            <Bell className="w-3.5 h-3.5 text-[#66756F]" />
            <span className="absolute -top-1 -right-1 bg-[#12291F] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              5
            </span>
          </button>

          <button 
            onClick={() => showToast('Invite modal opened.')}
            className="bg-[#B39353] hover:bg-[#A38346] text-white px-2.5 sm:px-4 py-1.5 rounded-[8px] text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors h-[34px] shrink-0"
          >
            <Plus size={15} />
            <span className="hidden sm:inline font-medium">+ Invite</span>
          </button>
        </div>
      </header>

      {/* Secondary Sub-navbar */}
      <nav className="w-full bg-[#F7F7F5] border-b border-[#E8E8E2] px-4 md:px-6 py-2 flex items-center overflow-x-auto no-scrollbar">
        <div className="flex items-center space-x-1.5 whitespace-nowrap">
          {(['Month', 'Week', 'Agenda', 'Milestones', 'Sync'] as CalendarSubTab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  showToast(`Navigated to ${tab.toLowerCase()} view.`);
                }}
                className={
                  isActive 
                    ? "px-3.5 py-1 rounded-full text-xs font-semibold bg-[#EAD5C6] text-[#1E2923] shadow-xs transition-colors"
                    : "px-3.5 py-1 rounded-full text-xs font-medium text-[#617065] hover:bg-[#EFEFEE] transition-colors"
                }
              >
                {tab}
              </button>
            );
          })}
        </div>
      </nav>

      {/* RENDER VIEW ACCORDING TO activeTab */}
      
      {/* 1. MONTH VIEW */}
      {activeTab === 'Month' && (
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-serif text-[#1C2621] tracking-tight">July 2026</h1>
              <div className="flex items-center space-x-1 border border-[#E8E8E2] rounded-lg bg-white p-0.5 shadow-xs">
                <button onClick={() => showToast('Switched to previous month.')} className="p-1 hover:bg-[#F5F5F0] rounded text-[#617065] transition-colors"><ChevronLeft size={16} /></button>
                <button onClick={() => showToast('Switched to next month.')} className="p-1 hover:bg-[#F5F5F0] rounded text-[#617065] transition-colors"><ChevronRight size={16} /></button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1 bg-white border border-[#E8E8E2] p-1 rounded-xl shadow-xs overflow-x-auto">
                {(['All', 'Milestone', 'Meeting', 'Deadline', 'Task'] as FilterType[]).map((filter) => {
                  const isSelected = selectedFilter === filter;
                  return (
                    <button
                      key={filter}
                      onClick={() => setSelectedFilter(filter)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors ${isSelected ? 'bg-[#183B28] text-white font-semibold' : 'text-[#617065] hover:bg-[#F5F5F0]'}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${filter === 'All' ? 'bg-gray-400' : filter === 'Milestone' ? 'bg-[#B39353]' : filter === 'Meeting' ? 'bg-[#183B28]' : filter === 'Deadline' ? 'bg-[#B93838]' : 'bg-[#1E3E2B]'}`} />
                      <span>{filter}</span>
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => { setIsEventModalOpen(true); showToast('New event drawer opened.'); }}
                className="px-4 py-2 bg-[#A07C44] hover:bg-[#906D3A] text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors h-[36px]"
              >
                <Plus size={15} />
                <span>+ Event</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#E8E8E2] rounded-2xl shadow-xs overflow-hidden">
            <div className="grid grid-cols-7 border-b border-[#E8E8E2] bg-[#F9F9F6] text-center">
              {DAYS_OF_WEEK_LIST.map((day, idx) => (
                <div key={idx} className="py-3 text-[10px] font-bold text-[#8E9B90] tracking-wider">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 divide-x divide-y divide-[#E8E8E2]">
              {CALENDAR_DAYS_GRID_MATRIX.flat().map((dayNum, index) => {
                const dayEvents = dayNum !== null ? filteredEvents.filter(ev => ev.day === dayNum) : [];
                return (
                  <div key={index} className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors ${dayNum === null ? 'bg-[#FCFCFB] opacity-40' : 'bg-white hover:bg-[#FAF9F5]'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${dayNum === 27 ? 'bg-[#183B28] text-white w-5 h-5 rounded-full flex items-center justify-center font-bold' : 'text-[#617065]'}`}>{dayNum !== null ? dayNum : ''}</span>
                    </div>
                    <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                      {dayEvents.map((ev, eIdx) => (
                        <div key={eIdx} onClick={() => showToast(`Opened event: ${ev.title}`)} className={`px-2 py-1 rounded text-[10px] font-medium truncate cursor-pointer transition-all hover:opacity-90 shadow-xs ${getEventBadgeStyles(ev.type)}`}>
                          {ev.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      )}

      {/* 2. WEEK VIEW */}
      {activeTab === 'Week' && (
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-serif text-[#1C2621] tracking-tight">July 12 – 18, 2026</h1>
              <div className="flex items-center space-x-1 border border-[#E8E8E2] rounded-lg bg-white p-0.5 shadow-xs">
                <button onClick={() => showToast('Switched to previous week.')} className="p-1 hover:bg-[#F5F5F0] rounded text-[#617065] transition-colors"><ChevronLeft size={16} /></button>
                <button onClick={() => showToast('Switched to next week.')} className="p-1 hover:bg-[#F5F5F0] rounded text-[#617065] transition-colors"><ChevronRight size={16} /></button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1 bg-white border border-[#E8E8E2] p-1 rounded-xl shadow-xs overflow-x-auto">
                {(['All', 'Milestone', 'Meeting', 'Deadline', 'Task'] as FilterType[]).map((filter) => {
                  const isSelected = selectedFilter === filter;
                  return (
                    <button
                      key={filter}
                      onClick={() => setSelectedFilter(filter)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors ${isSelected ? 'bg-[#183B28] text-white font-semibold' : 'text-[#617065] hover:bg-[#F5F5F0]'}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${filter === 'All' ? 'bg-gray-400' : filter === 'Milestone' ? 'bg-[#B39353]' : filter === 'Meeting' ? 'bg-[#183B28]' : filter === 'Deadline' ? 'bg-[#B93838]' : 'bg-[#1E3E2B]'}`} />
                      <span>{filter}</span>
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => { setIsEventModalOpen(true); showToast('New event drawer opened.'); }}
                className="px-4 py-2 bg-[#A07C44] hover:bg-[#906D3A] text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors h-[36px]"
              >
                <Plus size={15} />
                <span>+ Event</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#E8E8E2] rounded-2xl shadow-xs overflow-hidden">
            <div className="grid grid-cols-8 border-b border-[#E8E8E2] bg-[#F9F9F6] text-center">
              <div className="py-3 text-[10px] font-bold text-[#8E9B90] tracking-wider border-r border-[#E8E8E2]">TIME</div>
              {WEEK_DAYS_LIST.map((d, idx) => (
                <div key={idx} className="py-3 text-center border-r border-[#E8E8E2] last:border-r-0">
                  <span className="text-[10px] font-bold text-[#8E9B90] tracking-wider block">{d.name}</span>
                  <span className={`text-xs font-semibold mt-0.5 inline-block ${d.num === 13 ? 'bg-[#183B28] text-white w-5 h-5 rounded-full flex items-center justify-center mx-auto' : 'text-[#1E2923]'}`}>{d.num}</span>
                </div>
              ))}
            </div>

            <div className="divide-y divide-[#E8E8E2]">
              {HOURS_LIST.map((hour, hIdx) => (
                <div key={hIdx} className="grid grid-cols-8 min-h-[70px] divide-x divide-[#E8E8E2]">
                  <div className="p-2 text-[10px] font-medium text-[#8E9B90] text-right pr-3 bg-[#FCFCFB] flex items-start justify-end pt-3">{hour}</div>
                  {WEEK_DAYS_LIST.map((dayObj, dIdx) => {
                    const matchingEvents = WEEK_EVENTS_DATA.filter(ev => ev.dayIndex === dIdx && ev.time === hour && (selectedFilter === 'All' || ev.type.toLowerCase() === selectedFilter.toLowerCase()));
                    return (
                      <div key={dIdx} className="p-1.5 bg-white hover:bg-[#FAF9F5] transition-colors relative space-y-1">
                        {matchingEvents.map((ev, eIdx) => (
                          <div key={eIdx} onClick={() => showToast(`Opened event: ${ev.title}`)} className={`p-2 rounded text-[11px] font-medium cursor-pointer transition-all hover:opacity-90 shadow-xs ${getEventBadgeStyles(ev.type)}`}>
                            <p className="font-semibold leading-tight">{ev.title}</p>
                            <p className="text-[9px] opacity-80 mt-0.5">{ev.time}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* 3. AGENDA VIEW */}
      {activeTab === 'Agenda' && (
        <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-serif text-[#1C2621] tracking-tight">Agenda</h1>
            <button 
              onClick={() => { setIsEventModalOpen(true); showToast('New event drawer opened.'); }}
              className="px-4 py-2 bg-[#A07C44] hover:bg-[#906D3A] text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors h-[36px]"
            >
              <Plus size={15} />
              <span>+ Event</span>
            </button>
          </div>

          <div className="space-y-8">
            {AGENDA_GROUPS_DATA.map((group, gIdx) => (
              <div key={gIdx} className="space-y-3">
                <h2 className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">{group.dateLabel}</h2>
                <div className="space-y-3">
                  {group.items.map((item, iIdx) => (
                    <div
                      key={iIdx}
                      onClick={() => showToast(`Opened agenda item: ${item.title}`)}
                      className={`bg-white border border-[#E8E8E2] rounded-xl p-5 shadow-xs flex items-center justify-between border-l-4 ${item.borderColor} hover:border-[#D5DDD6] transition-all cursor-pointer`}
                    >
                      <div className="flex items-center space-x-6">
                        <span className="text-xs font-semibold text-[#8E9B90] w-12 shrink-0">{item.time}</span>
                        <div>
                          <h3 className="font-semibold text-xs text-[#1E2923]">{item.title}</h3>
                          <p className="text-xs text-[#617065] mt-0.5">{item.subtitle}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${item.type === 'Milestone' ? 'bg-[#F2ECE1] text-[#7A6025]' : item.type === 'Meeting' ? 'bg-[#183B28] text-white' : item.type === 'Deadline' ? 'bg-[#FDF2F2] text-[#B93838]' : 'bg-[#E5EFEA] text-[#1E3E2B]'}`}>
                        {item.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* 4. MILESTONES VIEW */}
      {activeTab === 'Milestones' && (
        <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
          <div className="flex items-end justify-between">
            <h1 className="text-3xl font-serif text-[#1C2621] tracking-tight">Milestones</h1>
            <div className="flex items-center space-x-3">
              <span className="text-xs font-medium text-[#617065]">3 of 7 complete this quarter</span>
              <button 
                onClick={() => { setIsEventModalOpen(true); showToast('New milestone drawer opened.'); }}
                className="px-4 py-2 bg-[#A07C44] hover:bg-[#906D3A] text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors h-[36px]"
              >
                <Plus size={15} />
                <span>+ Milestone</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {MILESTONES_DATA_LIST.map((item, idx) => (
              <div 
                key={idx}
                onClick={() => showToast(`Opened milestone: ${item.title}`)}
                className={`bg-white border ${item.cardBorderClass || 'border-[#E8E8E2]'} rounded-2xl p-6 shadow-xs space-y-4 cursor-pointer hover:border-[#D5DDD6] transition-all`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.iconType === 'progress' ? 'bg-[#F2ECE1] text-[#7A6025]' : item.iconType === 'risk' ? 'bg-[#FDF2F2] text-[#B93838]' : item.iconType === 'complete' ? 'bg-[#183B28] text-white' : 'bg-[#F5F5F0] text-[#617065]'}`}>
                      {item.iconType === 'progress' && <Clock size={16} />}
                      {item.iconType === 'risk' && <AlertCircle size={16} />}
                      {item.iconType === 'complete' && <Check size={16} />}
                      {item.iconType === 'default' && <Circle size={16} />}
                    </div>
                    <div>
                      <h2 className="font-semibold text-sm text-[#1E2923]">{item.title}</h2>
                      <p className="text-xs text-[#617065] mt-0.5">{item.dueDate}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${item.badgeClass}`}>{item.status}</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#617065]">{item.tasksInfo}</span>
                    <span className="font-semibold text-[#1E2923]">{item.progress}%</span>
                  </div>
                  <div className="w-full bg-[#F5F5F0] h-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${item.progressBarClass}`} style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* 5. SYNC VIEW */}
      {activeTab === 'Sync' && (
        <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
          <div className="space-y-1">
            <h1 className="text-3xl font-serif text-[#1C2621] tracking-tight">Calendar sync</h1>
            <p className="text-xs text-[#617065]">Bring your real calendar in so your mission never collides with a meeting.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Google Calendar */}
            <div className="bg-white border border-[#E8E8E2] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#EAF2ED] text-[#183B28] flex items-center justify-center font-bold text-sm shrink-0">G</div>
                <div className="space-y-0.5">
                  <h2 className="font-semibold text-xs text-[#1E2923]">Google Calendar</h2>
                  <p className="text-xs text-[#617065]">{isGoogleConnected ? 'Connected as amara@kolo.africa' : 'Not connected'}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (isGoogleConnected) { setIsGoogleConnected(false); showToast('Google Calendar disconnected.'); }
                  else { setIsGoogleConnected(true); showToast('Google Calendar connected as amara@kolo.africa.'); }
                }}
                className={`w-full py-2 rounded-xl text-xs font-semibold transition-colors border shadow-xs ${isGoogleConnected ? 'bg-white text-[#B93838] border-[#E8E8E2] hover:bg-[#FDF2F2]' : 'bg-[#A07C44] text-white border-transparent hover:bg-[#906D3A]'}`}
              >
                {isGoogleConnected ? 'Disconnect' : 'Connect'}
              </button>
            </div>

            {/* Outlook */}
            <div className="bg-white border border-[#E8E8E2] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#F5F5F0] text-[#617065] flex items-center justify-center font-bold text-sm shrink-0">O</div>
                <div className="space-y-0.5">
                  <h2 className="font-semibold text-xs text-[#1E2923]">Outlook</h2>
                  <p className="text-xs text-[#617065]">{isOutlookConnected ? 'Connected' : 'Not connected'}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (isOutlookConnected) { setIsOutlookConnected(false); showToast('Outlook disconnected.'); }
                  else { setIsOutlookConnected(true); showToast('Connecting to Outlook...'); }
                }}
                className={`w-full py-2 rounded-xl text-xs font-semibold transition-colors border shadow-xs ${isOutlookConnected ? 'bg-white text-[#B93838] border-[#E8E8E2] hover:bg-[#FDF2F2]' : 'bg-[#A07C44] text-white border-transparent hover:bg-[#906D3A]'}`}
              >
                {isOutlookConnected ? 'Disconnect' : 'Connect'}
              </button>
            </div>

            {/* Apple Calendar */}
            <div className="bg-white border border-[#E8E8E2] rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#F5F5F0] text-[#617065] flex items-center justify-center font-bold text-sm shrink-0">A</div>
                <div className="space-y-0.5">
                  <h2 className="font-semibold text-xs text-[#1E2923]">Apple Calendar</h2>
                  <p className="text-xs text-[#617065]">{isAppleConnected ? 'Connected' : 'Not connected'}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (isAppleConnected) { setIsAppleConnected(false); showToast('Apple Calendar disconnected.'); }
                  else { setIsAppleConnected(true); showToast('Connecting to Apple Calendar...'); }
                }}
                className={`w-full py-2 rounded-xl text-xs font-semibold transition-colors border shadow-xs ${isAppleConnected ? 'bg-white text-[#B93838] border-[#E8E8E2] hover:bg-[#FDF2F2]' : 'bg-[#A07C44] text-white border-transparent hover:bg-[#906D3A]'}`}
              >
                {isAppleConnected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#E8E8E2] rounded-2xl divide-y divide-[#E8E8E2] shadow-xs overflow-hidden">
            <div className="p-5 flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="font-semibold text-xs text-[#1E2923]">Block focus time for missions</h3>
                <p className="text-xs text-[#617065]">Reserve a window each morning for your daily mission.</p>
              </div>
              <button onClick={() => { setBlockFocusTime(!blockFocusTime); showToast(`Focus time blocking ${!blockFocusTime ? 'enabled' : 'disabled'}.`); }} className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${blockFocusTime ? 'bg-[#183B28]' : 'bg-[#D5DDD6]'}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${blockFocusTime ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="p-5 flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="font-semibold text-xs text-[#1E2923]">Remind me before deadlines</h3>
                <p className="text-xs text-[#617065]">A nudge 3 days and 1 day before anything with a penalty.</p>
              </div>
              <button onClick={() => { setRemindDeadlines(!remindDeadlines); showToast(`Deadline reminders ${!remindDeadlines ? 'enabled' : 'disabled'}.`); }} className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${remindDeadlines ? 'bg-[#183B28]' : 'bg-[#D5DDD6]'}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${remindDeadlines ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="p-5 flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="font-semibold text-xs text-[#1E2923]">Show weekends</h3>
                <p className="text-xs text-[#617065]">Include Saturday and Sunday in week view.</p>
              </div>
              <button onClick={() => { setShowWeekends(!showWeekends); showToast(`Weekends view ${!showWeekends ? 'enabled' : 'disabled'}.`); }} className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${showWeekends ? 'bg-[#183B28]' : 'bg-[#D5DDD6]'}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${showWeekends ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </main>
      )}

      {/* MODAL: NEW EVENT / MILESTONE DRAWER */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white border border-[#E8E8E2] rounded-2xl p-6 sm:p-8 shadow-2xl max-w-md w-full space-y-6 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif text-[#1E2923]">
                {activeTab === 'Milestones' ? 'Create calendar milestone' : 'Create calendar event'}
              </h2>
              <button onClick={() => setIsEventModalOpen(false)} className="p-1 rounded-lg text-[#617065] hover:bg-[#F5F5F0]">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">
                  {activeTab === 'Milestones' ? 'Milestone Title' : 'Event Title'}
                </label>
                <input 
                  type="text"
                  required
                  placeholder={activeTab === 'Milestones' ? 'e.g. Series A term sheet signed' : 'e.g. Investor pitch meeting'}
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-white border border-[#E8E8E2] rounded-lg px-3 py-2 text-xs text-[#1E2923] placeholder-[#9CA8A0] focus:outline-none focus:ring-1 focus:ring-[#A07C44]"
                />
              </div>

              {activeTab !== 'Milestones' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">Event Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['milestone', 'meeting', 'deadline', 'task'] as const).map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setEventType(t)}
                        className={`py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${eventType === t ? 'bg-[#1C3B2B] text-white border-[#1C3B2B]' : 'bg-white text-[#617065] border-[#E8E8E2] hover:bg-[#F5F5F0]'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#8E9B90] uppercase tracking-wider">Date</label>
                <input 
                  type="date"
                  required
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full bg-white border border-[#E8E8E2] rounded-lg px-3 py-2 text-xs text-[#1E2923] focus:outline-none focus:ring-1 focus:ring-[#A07C44]"
                />
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-white border border-[#E8E8E2] rounded-lg text-xs font-semibold text-[#1E2923] hover:bg-[#F5F5F0] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#A07C44] hover:bg-[#906D3A] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  {activeTab === 'Milestones' ? 'Save milestone' : 'Save event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}