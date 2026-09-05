// app/(dashboard)/learning-academy/page.tsx
'use client';

import React, { useState } from 'react';
import { useSidebar } from '@/components/sidebar-context';

interface Lesson {
  id: number;
  title: string;
  description: string;
  category: 'Validation' | 'Fundraising' | 'Marketing' | 'Finance' | 'Legal';
  status: 'In progress' | 'Completed' | 'Not started';
  lessonsCount: number;
  duration: string;
  progressPercent: number;
  iconSymbol: string;
  completedDate?: string;
}

const allLessons: Lesson[] = [
  {
    id: 1,
    title: 'Pricing experiments that actually tell you something',
    description: 'Run a pricing test in a week and read the result honestly.',
    category: 'Validation',
    status: 'In progress',
    lessonsCount: 5,
    duration: '38 min',
    progressPercent: 60,
    iconSymbol: '↻',
  },
  {
    id: 2,
    title: 'Customer interviews without leading the witness',
    description: 'Ask questions that surface truth, not politeness.',
    category: 'Validation',
    status: 'Completed',
    lessonsCount: 4,
    duration: '26 min',
    progressPercent: 100,
    iconSymbol: '☺',
    completedDate: 'Jul 12',
  },
  {
    id: 3,
    title: 'Reading your runway like a CFO',
    description: 'Burn, buffer, and the decisions that actually extend it.',
    category: 'Finance',
    status: 'Not started',
    lessonsCount: 6,
    duration: '44 min',
    progressPercent: 0,
    iconSymbol: '₦',
  },
  {
    id: 4,
    title: 'The pre-seed deck, slide by slide',
    description: 'What each slide must prove, and what to leave out.',
    category: 'Fundraising',
    status: 'In progress',
    lessonsCount: 10,
    duration: '1h 10m',
    progressPercent: 30,
    iconSymbol: '★',
  },
  {
    id: 5,
    title: 'Your first 100 users in a low-trust market',
    description: 'Distribution when nobody has heard of you.',
    category: 'Marketing',
    status: 'Not started',
    lessonsCount: 5,
    duration: '34 min',
    progressPercent: 0,
    iconSymbol: '⚑',
  },
  {
    id: 6,
    title: 'Contracts a founder must understand',
    description: 'NDAs, contractor terms, and the clauses that bite.',
    category: 'Legal',
    status: 'Completed',
    lessonsCount: 4,
    duration: '28 min',
    progressPercent: 100,
    iconSymbol: '§',
    completedDate: 'Jun 28',
  },
  {
    id: 7,
    title: 'Writing a problem statement that holds up',
    description: 'Nailing the core pain point before building solutions.',
    category: 'Validation',
    status: 'Completed',
    lessonsCount: 3,
    duration: '20 min',
    progressPercent: 100,
    iconSymbol: '✓',
    completedDate: 'Jun 14',
  },
];

const courseModules = [
  { 
    id: 1, 
    title: 'Why most pricing tests fail', 
    duration: '6 min', 
    status: 'completed',
    description: 'Most pricing tests fail because they ask people what they would pay. Nobody knows. What people say in a survey and what they do with money are different things, and the gap is widest exactly where you need accuracy.',
    applyTitle: 'APPLY IT TO KOLO',
    applyText: 'Your survey asked riders to pick a tier. That is stated preference. Add a step where they commit something real, even a reservation.'
  },
  { 
    id: 2, 
    title: 'Choosing what to actually test', 
    duration: '7 min', 
    status: 'completed',
    description: 'You cannot test everything at once. Pick the single number that changes your business if you are wrong about it, and hold everything else steady while you learn.',
    applyTitle: 'APPLY IT TO KOLO',
    applyText: 'For Kolo, that number is the monthly subscription. Fix your feature set and test ₦500 against ₦800 only.'
  },
  { 
    id: 3, 
    title: 'Designing the experiment', 
    duration: '12 min', 
    status: 'current',
    description: 'A good pricing experiment has three parts: a real offer, a real decision point, and a control. If any of the three is missing, you are collecting opinions, not evidence. Give one group the ₦500 offer, another the ₦800 offer, and make both groups do something costly, even if that cost is just their time.',
    applyTitle: 'APPLY IT TO KOLO',
    applyText: 'Run your two price points through the WhatsApp waitlist for 10 days. Same copy, same audience, only the number changes.'
  },
  { 
    id: 4, 
    title: 'Reading the result honestly', 
    duration: '8 min', 
    status: 'upcoming',
    description: 'When the data comes back, founders tend to see what they hope to see. Learn the strict criteria to declare a test valid or inconclusive.',
    applyTitle: 'APPLY IT TO KOLO',
    applyText: 'Set your success threshold before launching the test so you cannot move the goalposts later.'
  },
  { 
    id: 5, 
    title: 'Turning the answer into a price', 
    duration: '5 min', 
    status: 'upcoming',
    description: 'Moving from experimental results to your official pricing page without breaking user trust or leaving money on the table.',
    applyTitle: 'APPLY IT TO KOLO',
    applyText: 'Lock in your winning tier and draft the billing FAQ for your early users.'
  },
];

export default function LearningAcademyPage() {
  const { openSidebar } = useSidebar();
  const [activeNavTab, setActiveNavTab] = useState('Lesson player');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Lesson player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentModuleId, setCurrentModuleId] = useState(3);
  const [actionNotification, setActionNotification] = useState<string | null>(null);

  const categories = ['All', 'Validation', 'Fundraising', 'Marketing', 'Finance', 'Legal'];

  const filteredLessons = allLessons.filter((lesson) => {
    const matchesCategory = selectedCategory === 'All' || lesson.category === selectedCategory;
    const matchesSearch =
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const triggerNotification = (text: string) => {
    setActionNotification(text);
    setTimeout(() => {
      setActionNotification(null);
    }, 4000);
  };

  const handleAddToMission = () => {
    triggerNotification('Added to today\'s mission.');
  };

  const handleShareCertificate = () => {
    triggerNotification('Share link copied.');
  };

  const handleDownloadCertificate = () => {
    triggerNotification('Certificate downloaded.');
  };

  const currentModule = courseModules.find((m) => m.id === currentModuleId) || courseModules[2];

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-[#1E2923] font-sans antialiased flex flex-col w-full overflow-x-hidden rounded-none relative">
      
      {/* Floating Action Notification Banner */}
      {actionNotification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#12291F] text-white px-5 py-2.5 rounded-full shadow-xl flex items-center space-x-2 text-sm font-medium border border-[#D89A6E]/30 transition-all">
          <span className="text-[#059669] font-bold">✓</span>
          <span>{actionNotification}</span>
        </div>
      )}

      {/* Top Header Navigation Bar */}
      <header className="sticky top-0 z-30 w-full rounded-none">
        
        {/* Main Navbar Row */}
        <div className="bg-[#FFFFFF] border-b border-[#EBEBE6] px-4 md:px-8 py-4 flex items-center justify-between">
          
          {/* Left Side: Logo Trigger & Breadcrumbs */}
          <div className="flex items-center space-x-3">
            <button
              onClick={openSidebar}
              className="lg:hidden flex items-center justify-center w-10 h-10 bg-[#183B28] text-[#D89A6E] rounded-modal focus:outline-none transition-opacity hover:opacity-90"
              aria-label="Open sidebar"
            >
              <span className="font-bold text-sm">C</span>
            </button>

            <div className="flex items-center space-x-2 text-base sm:text-lg md:text-xl font-medium tracking-tight">
              <span className="text-[#8E9B90]">Workspace</span>
              <span className="text-[#8E9B90]">/</span>
              <span className="text-[#1E2923] font-semibold">Learning Academy</span>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 bg-[#E3EFE9] border border-[#D5DDD6] rounded-full text-xs font-medium text-[#12291F]">
              <span className="text-[#617065]">Health</span>
              <span className="font-bold text-[#12291F]">72</span>
              <span className="text-[#059669] font-bold">↑</span>
            </div>

            <button 
              className="relative w-9 h-9 flex items-center justify-center text-[#66756F] hover:text-[#1E2923] transition-colors bg-[#FFFFFF] border border-[#DCE6E1] rounded-full"
              aria-label="Notifications"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
              </svg>
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#12291F] text-[#FFFFFF] rounded-full text-[10px] font-bold flex items-center justify-center">5</span>
            </button>

            <button 
              className="bg-[#A8894B] hover:bg-[#967941] text-[#12291F] font-medium px-3 md:px-4 py-2 rounded-[8px] text-sm flex items-center transition-colors"
              aria-label="Invite"
            >
              <span className="md:hidden font-bold text-base leading-none">+</span>
              <span className="hidden md:inline">+ Invite</span>
            </button>
          </div>
        </div>

        {/* Secondary Sub-navbar Row */}
        <div className="bg-[#F8F8F4] border-b border-[#EBEBE6] px-4 md:px-8 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {['Browse', 'Lesson player', 'My learning', 'Paths', 'Certificates'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveNavTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeNavTab === tab
                  ? 'bg-[#EAD5C6] text-[#1E2923] border border-[#D5DDD6]'
                  : 'bg-[#FFFFFF] text-[#8E9B90] hover:text-[#1E2923] border border-[#EBEBE6]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>

      {/* Conditional View Rendering */}
      {activeNavTab === 'Lesson player' ? (
        
        /* LESSON PLAYER VIEW */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-6">
          
          {/* Back link */}
          <div>
            <button
              onClick={() => setActiveNavTab('Browse')}
              className="text-xs text-[#617065] hover:text-[#1E2923] transition-colors inline-flex items-center gap-1 font-medium cursor-pointer"
            >
              ← Back to academy
            </button>
          </div>

          {/* Main Grid: Video + Playlist Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Video & Lesson Info */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Video Player Box */}
              <div className="bg-[#12291F] rounded-modal overflow-hidden shadow-card flex flex-col">
                <div 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="relative aspect-video w-full bg-[#12291F] flex flex-col items-center justify-center cursor-pointer group"
                >
                  <div className="w-16 h-16 rounded-full bg-[#C4A47C]/90 text-[#12291F] flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                    {isPlaying ? (
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 fill-current translate-x-0.5" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs text-[#E6F1EB] mt-3 font-medium">
                    {isPlaying ? 'Playing' : 'Tap to play the lesson'}
                  </span>
                </div>

                {/* Video Timeline Bar */}
                <div className="px-6 py-3 bg-[#12291F]/90 border-t border-white/10 flex items-center space-x-4">
                  <span className="text-[11px] text-[#A8B5AB] font-mono">0:00</span>
                  <div className="flex-1 bg-white/10 h-1.5 rounded-full overflow-hidden relative">
                    <div className="bg-[#C4A47C] h-full w-[0%] rounded-full"></div>
                  </div>
                  <span className="text-[11px] text-[#A8B5AB] font-mono">12:00</span>
                </div>
              </div>

              {/* Lesson Description Content */}
              <div className="space-y-4">
                <h1 className="text-2xl md:text-3xl font-serif text-[#1E2923] tracking-tight">
                  {currentModule.title}
                </h1>
                <p className="text-sm text-[#33413B] leading-relaxed">
                  {currentModule.description}
                </p>
              </div>

              {/* Apply it to Kolo Box */}
              <div className="bg-[#FDF6EC] border border-[#EAD5C6] rounded-modal p-6 space-y-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[#9C5B34] uppercase tracking-wider">
                    {currentModule.applyTitle}
                  </span>
                  <p className="text-xs text-[#1E2923] leading-relaxed">
                    {currentModule.applyText}
                  </p>
                </div>
                <button
                  onClick={handleAddToMission}
                  className="bg-[#A8894B] hover:bg-[#967941] text-[#12291F] font-semibold px-4 py-2.5 rounded-card text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Add to today's mission
                </button>
              </div>

            </div>

            {/* Right Column: Course Playlist Sidebar */}
            <div className="lg:col-span-4 bg-[#FFFFFF] border border-[#EBEBE6] rounded-modal p-5 shadow-card space-y-4">
              <div className="space-y-1 pb-3 border-b border-[#EBEBE6]">
                <h3 className="text-xs font-bold text-[#8E9B90] uppercase tracking-wider">
                  Pricing experiments
                </h3>
                <p className="text-xs font-semibold text-[#12291F]">
                  2 of 5 complete
                </p>
              </div>

              <div className="space-y-2">
                {courseModules.map((mod) => {
                  const isCurrent = mod.id === currentModuleId;
                  const isCompleted = mod.status === 'completed';
                  return (
                    <div
                      key={mod.id}
                      onClick={() => setCurrentModuleId(mod.id)}
                      className={`p-3 rounded-card flex items-center justify-between cursor-pointer transition-colors ${
                        isCurrent
                          ? 'bg-[#F2F2EC] border border-[#DCE6E1]'
                          : 'hover:bg-[#F8F8F4] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isCompleted
                              ? 'bg-[#183B28] text-white'
                              : isCurrent
                              ? 'bg-[#A8894B] text-[#12291F]'
                              : 'bg-[#EBEBE6] text-[#617065]'
                          }`}
                        >
                          {isCompleted ? (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : isCurrent ? (
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          ) : (
                            mod.id
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-semibold text-[#1E2923] leading-snug">
                            {mod.title}
                          </h4>
                          <span className="text-[11px] text-[#8E9B90]">{mod.duration}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </main>

      ) : activeNavTab === 'My learning' ? (

        /* MY LEARNING VIEW */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-8">
          
          {/* Page Heading */}
          <h1 className="text-3xl md:text-4xl font-normal text-[#1E2923] font-serif tracking-tight">
            My learning
          </h1>

          {/* Metric Summary Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Lessons Completed */}
            <div className="bg-[#FFFFFF] border border-[#EBEBE6] rounded-modal p-6 shadow-card space-y-2">
              <span className="text-[11px] font-bold text-[#8E9B90] uppercase tracking-wider">
                Lessons completed
              </span>
              <div className="text-3xl md:text-4xl font-serif text-[#1E2923] font-normal">
                17
              </div>
            </div>

            {/* Card 2: Time Invested */}
            <div className="bg-[#FFFFFF] border border-[#EBEBE6] rounded-modal p-6 shadow-card space-y-2">
              <span className="text-[11px] font-bold text-[#8E9B90] uppercase tracking-wider">
                Time invested
              </span>
              <div className="text-3xl md:text-4xl font-serif text-[#1E2923] font-normal">
                3h 24m
              </div>
            </div>

            {/* Card 3: Current Streak */}
            <div className="bg-[#FFFFFF] border border-[#EBEBE6] rounded-modal p-6 shadow-card space-y-2">
              <span className="text-[11px] font-bold text-[#8E9B90] uppercase tracking-wider">
                Current streak
              </span>
              <div className="text-3xl md:text-4xl font-serif text-[#1E2923] font-normal">
                4 days
              </div>
            </div>

          </div>

          {/* In Progress Section */}
          <div className="space-y-4 pt-2">
            <h2 className="text-xs font-bold text-[#8E9B90] uppercase tracking-wider">
              In progress
            </h2>

            <div className="space-y-4">
              {allLessons
                .filter((l) => l.status === 'In progress')
                .map((lesson) => (
                  <div
                    key={lesson.id}
                    className="bg-[#FFFFFF] border border-[#EBEBE6] rounded-modal p-5 md:p-6 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:border-[#183B28]/30"
                  >
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-10 h-10 rounded-card bg-[#E2EFE7] text-[#2D5A3F] flex items-center justify-center font-bold text-sm shrink-0">
                        {lesson.iconSymbol}
                      </div>
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-base font-semibold text-[#1E2923]">
                            {lesson.title}
                          </h3>
                          <span className="text-xs font-medium text-[#617065] md:hidden">
                            {lesson.progressPercent}%
                          </span>
                        </div>
                        <div className="w-full bg-[#EBEBE6] h-1.5 rounded-full overflow-hidden max-w-2xl">
                          <div
                            className="bg-[#183B28] h-full rounded-full"
                            style={{ width: `${lesson.progressPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end space-x-6 shrink-0">
                      <span className="text-xs font-medium text-[#617065] hidden md:inline">
                        {lesson.progressPercent}%
                      </span>
                      <button
                        onClick={() => setActiveNavTab('Lesson player')}
                        className="bg-[#FFFFFF] hover:bg-[#F8F8F4] border border-[#DCE6E1] text-[#12291F] font-medium px-4 py-2 rounded-card text-xs transition-colors cursor-pointer shadow-xs"
                      >
                        Resume
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Completed Section */}
          <div className="space-y-4 pt-4">
            <h2 className="text-xs font-bold text-[#8E9B90] uppercase tracking-wider">
              Completed
            </h2>

            <div className="bg-[#FFFFFF] border border-[#EBEBE6] rounded-modal shadow-card divide-y divide-[#EBEBE6]">
              {allLessons
                .filter((l) => l.status === 'Completed')
                .map((lesson) => (
                  <div
                    key={lesson.id}
                    className="p-4 md:p-5 flex items-center justify-between gap-4 hover:bg-[#F8F8F4] transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-full bg-[#12291F] text-white flex items-center justify-center text-xs font-bold shrink-0">
                        ✓
                      </div>
                      <span className="text-sm font-medium text-[#1E2923]">
                        {lesson.title}
                      </span>
                    </div>
                    {lesson.completedDate && (
                      <span className="text-xs text-[#8E9B90] whitespace-nowrap">
                        {lesson.completedDate}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </div>

        </main>

      ) : activeNavTab === 'Paths' ? (

        /* PATHS VIEW */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-8">
          
          {/* Header Section */}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-normal text-[#1E2923] font-serif tracking-tight">
              Learning paths
            </h1>
            <p className="text-sm text-[#617065]">
              Curricula that follow the same arc as your roadmap.
            </p>
          </div>

          {/* Path Cards List */}
          <div className="space-y-6">
            
            {/* Card 1: Your Stage */}
            <div className="bg-[#FFFFFF] border border-[#EBEBE6] rounded-modal p-6 md:p-8 shadow-card space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[#9C5B34] uppercase tracking-wider">
                    Your stage
                  </span>
                  <h2 className="text-xl md:text-2xl font-serif text-[#1E2923]">
                    Validation essentials
                  </h2>
                  <p className="text-xs md:text-sm text-[#617065]">
                    Everything you need to prove demand before you spend another naira building.
                  </p>
                </div>
                <div className="text-left md:text-right shrink-0">
                  <span className="text-xs text-[#8E9B90]">5 courses · 2h 40m</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-medium">
                  <div className="w-full bg-[#EBEBE6] h-2 rounded-full overflow-hidden mr-4">
                    <div className="bg-[#A8894B] h-full rounded-full w-[65%]"></div>
                  </div>
                  <span className="text-[#1E2923] shrink-0 font-bold">65%</span>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setActiveNavTab('Lesson player')}
                    className="bg-[#A8894B] hover:bg-[#967941] text-[#12291F] font-semibold px-5 py-2.5 rounded-card text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Next Up */}
            <div className="bg-[#FFFFFF] border border-[#EBEBE6] rounded-modal p-6 md:p-8 shadow-card space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[#8E9B90] uppercase tracking-wider">
                    Next up
                  </span>
                  <h2 className="text-xl md:text-2xl font-serif text-[#1E2923]">
                    Fundraising fundamentals
                  </h2>
                  <p className="text-xs md:text-sm text-[#617065]">
                    From your first deck to a signed SAFE, without the folklore.
                  </p>
                </div>
                <div className="text-left md:text-right shrink-0">
                  <span className="text-xs text-[#8E9B90]">6 courses · 3h 20m</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-medium">
                  <div className="w-full bg-[#EBEBE6] h-2 rounded-full overflow-hidden mr-4">
                    <div className="bg-[#183B28] h-full rounded-full w-[33%]"></div>
                  </div>
                  <span className="text-[#1E2923] shrink-0 font-bold">33%</span>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setActiveNavTab('Lesson player')}
                    className="bg-[#FFFFFF] hover:bg-[#F8F8F4] border border-[#DCE6E1] text-[#12291F] font-semibold px-5 py-2.5 rounded-card text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3: Foundations */}
            <div className="bg-[#FFFFFF] border border-[#EBEBE6] rounded-modal p-6 md:p-8 shadow-card space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[#8E9B90] uppercase tracking-wider">
                    Foundations
                  </span>
                  <h2 className="text-xl md:text-2xl font-serif text-[#1E2923]">
                    Founder finance literacy
                  </h2>
                  <p className="text-xs md:text-sm text-[#617065]">
                    Read your own numbers well enough to make decisions and answer investors.
                  </p>
                </div>
                <div className="text-left md:text-right shrink-0">
                  <span className="text-xs text-[#8E9B90]">4 courses · 2h 05m</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-medium">
                  <div className="w-full bg-[#EBEBE6] h-2 rounded-full overflow-hidden mr-4">
                    <div className="bg-[#183B28] h-full rounded-full w-[0%]"></div>
                  </div>
                  <span className="text-[#1E2923] shrink-0 font-bold">0%</span>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setActiveNavTab('Lesson player')}
                    className="bg-[#FFFFFF] hover:bg-[#F8F8F4] border border-[#DCE6E1] text-[#12291F] font-semibold px-5 py-2.5 rounded-card text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    Start
                  </button>
                </div>
              </div>
            </div>

            {/* Card 4: Later */}
            <div className="bg-[#FFFFFF] border border-[#EBEBE6] rounded-modal p-6 md:p-8 shadow-card space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[#8E9B90] uppercase tracking-wider">
                    Later
                  </span>
                  <h2 className="text-xl md:text-2xl font-serif text-[#1E2923]">
                    Building a first team
                  </h2>
                  <p className="text-xs md:text-sm text-[#617065]">
                    Hiring, equity, and culture before you have an HR department.
                  </p>
                </div>
                <div className="text-left md:text-right shrink-0">
                  <span className="text-xs text-[#8E9B90]">4 courses · 1h 50m</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-medium">
                  <div className="w-full bg-[#EBEBE6] h-2 rounded-full overflow-hidden mr-4">
                    <div className="bg-[#183B28] h-full rounded-full w-[0%]"></div>
                  </div>
                  <span className="text-[#1E2923] shrink-0 font-bold">0%</span>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setActiveNavTab('Lesson player')}
                    className="bg-[#FFFFFF] hover:bg-[#F8F8F4] border border-[#DCE6E1] text-[#12291F] font-semibold px-5 py-2.5 rounded-card text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    Start
                  </button>
                </div>
              </div>
            </div>

          </div>
        </main>

      ) : activeNavTab === 'Certificates' ? (

        /* CERTIFICATES VIEW */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-8">
          
          {/* Header Section */}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-normal text-[#1E2923] font-serif tracking-tight">
              Certificates
            </h1>
          </div>

          {/* Grid Layout for Certificates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Certificate Card 1 */}
            <div className="bg-[#FFFFFF] border border-[#EBEBE6] rounded-modal p-8 shadow-card flex flex-col items-center text-center space-y-6">
              <div className="w-12 h-12 rounded-full bg-[#F3EFEA] text-[#A8894B] flex items-center justify-center font-bold text-lg shadow-xs">
                ✦
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-serif text-[#1E2923]">
                  Validation Essentials
                </h2>
                <p className="text-xs text-[#617065]">
                  Awarded Jul 12, 2026 · Amara Okafor
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleDownloadCertificate}
                  className="bg-[#A8894B] hover:bg-[#967941] text-[#12291F] font-medium px-5 py-2 rounded-card text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Download
                </button>
                <button
                  onClick={handleShareCertificate}
                  className="bg-[#FFFFFF] hover:bg-[#F8F8F4] border border-[#DCE6E1] text-[#12291F] font-medium px-5 py-2 rounded-card text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Share
                </button>
              </div>
            </div>

            {/* Certificate Card 2 */}
            <div className="bg-[#FFFFFF] border border-[#EBEBE6] rounded-modal p-8 shadow-card flex flex-col items-center text-center space-y-6">
              <div className="w-12 h-12 rounded-full bg-[#F3EFEA] text-[#A8894B] flex items-center justify-center font-bold text-lg shadow-xs">
                ✦
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-serif text-[#1E2923]">
                  Legal Foundations for Founders
                </h2>
                <p className="text-xs text-[#617065]">
                  Awarded Jun 28, 2026 · Amara Okafor
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleDownloadCertificate}
                  className="bg-[#A8894B] hover:bg-[#967941] text-[#12291F] font-medium px-5 py-2 rounded-card text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Download
                </button>
                <button
                  onClick={handleShareCertificate}
                  className="bg-[#FFFFFF] hover:bg-[#F8F8F4] border border-[#DCE6E1] text-[#12291F] font-medium px-5 py-2 rounded-card text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Share
                </button>
              </div>
            </div>

          </div>

          {/* In Progress Certificate / Locked Card */}
          <div className="max-w-xl border border-dashed border-[#D5DDD6] rounded-modal p-8 flex flex-col items-center text-center space-y-3 bg-transparent">
            <div className="w-2 h-2 rounded-full bg-[#8E9B90]/40"></div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-[#1E2923]">
                Finish the Fundraising path
              </h3>
              <p className="text-xs text-[#8E9B90]">
                2 of 6 courses done
              </p>
            </div>
          </div>

        </main>

      ) : (

        /* BROWSE VIEW */
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8 space-y-8">
          
          {/* Title Section */}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-normal text-[#1E2923] font-serif tracking-tight">
              Learn exactly what you need, right now
            </h1>
            <p className="text-sm text-[#617065]">
              Short, practical lessons matched to your stage. No filler, no 40-hour courses.
            </p>
          </div>

          {/* Continue Where You Left Off Banner */}
          <div className="bg-[#12291F] text-white rounded-modal p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
            <div className="space-y-3 flex-1">
              <span className="text-[11px] uppercase tracking-widest text-[#D89A6E] font-bold">
                Continue where you left off
              </span>
              <h2 className="text-xl md:text-2xl font-serif text-white">
                Pricing experiments that actually tell you something
              </h2>
              <div className="flex items-center space-x-2 text-xs text-[#A8B5AB]">
                <span>Lesson 3 of 5</span>
                <span>·</span>
                <span>8 min left</span>
              </div>
              <div className="w-full max-w-xl bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#D89A6E] h-full w-3/5 rounded-full"></div>
              </div>
            </div>
            <button 
              onClick={() => setActiveNavTab('Lesson player')}
              className="bg-[#C4A47C] hover:bg-[#B3936D] text-[#12291F] font-semibold px-6 py-3 rounded-card text-sm transition-colors whitespace-nowrap text-center cursor-pointer shadow-sm"
            >
              Resume lesson
            </button>
          </div>

          {/* Search Bar & Category Filter Pills */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search lessons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FFFFFF] border border-[#EBEBE6] rounded-input px-4 py-2.5 text-sm text-[#1E2923] placeholder:text-[#8E9B90] focus:outline-none focus:border-[#9C5B34]"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#183B28] text-[#FFFFFF]'
                      : 'bg-[#FFFFFF] text-[#617065] hover:text-[#1E2923] border border-[#EBEBE6]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Recommended for your stage Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center space-x-2 text-xs uppercase tracking-wider font-bold text-[#A8894B]">
              <span>✦</span>
              <span>Recommended for your stage</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="bg-[#FFFFFF] border border-[#EBEBE6] rounded-modal p-6 shadow-card flex flex-col justify-between space-y-6 transition-all hover:border-[#183B28]/30 cursor-pointer"
                  onClick={() => {
                    if (lesson.id === 1) setActiveNavTab('Lesson player');
                  }}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-card bg-[#E2EFE7] text-[#2D5A3F] flex items-center justify-center font-bold text-sm">
                        {lesson.iconSymbol}
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          lesson.status === 'Completed'
                            ? 'bg-[#E3EFE9] text-[#12291F]'
                            : lesson.status === 'In progress'
                            ? 'bg-[#FDF6EC] text-[#9C5B34]'
                            : 'bg-[#F2F2EC] text-[#617065]'
                        }`}
                      >
                        {lesson.status}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-base font-semibold text-[#1E2923] leading-snug">
                        {lesson.title}
                      </h3>
                      <p className="text-xs text-[#617065] leading-relaxed">
                        {lesson.description}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-[#EBEBE6]">
                    <div className="flex items-center justify-between text-xs text-[#8E9B90]">
                      <span>{lesson.lessonsCount} lessons</span>
                      <span>·</span>
                      <span>{lesson.duration}</span>
                    </div>

                    <div className="w-full bg-[#EBEBE6] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#183B28] h-full rounded-full transition-all duration-300"
                        style={{ width: `${lesson.progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredLessons.length === 0 && (
              <div className="text-center py-12 bg-[#FFFFFF] border border-[#EBEBE6] rounded-modal shadow-card">
                <p className="text-[#8E9B90] text-sm">No lessons found matching your criteria.</p>
              </div>
            )}
          </div>

        </main>
      )}
    </div>
  );
}