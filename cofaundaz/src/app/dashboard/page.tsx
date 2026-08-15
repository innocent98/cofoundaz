'use client';

import React from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#F2F6F3] text-[#12291F] flex font-sans">
      
      {/* 1. LEFT SIDEBAR */}
      <aside className="w-64 bg-[#0D221A] text-white flex flex-col justify-between shrink-0 hidden md:flex sticky top-0 h-screen overflow-y-auto">
        <div>
          {/* Brand Logo */}
          <div className="p-6 flex items-center gap-3 border-b border-[#18382B]">
            <div className="w-8 h-8 rounded-lg bg-[#1B4B38] flex items-center justify-center font-serif text-[#C4A35A] font-bold text-sm">
              C
            </div>
            <span className="font-serif text-xl font-semibold text-white tracking-tight">
              Cofoundaz
            </span>
          </div>

          {/* Workspace Selector */}
          <div className="p-4">
            <button className="w-full bg-[#18382B] hover:bg-[#204737] p-3 rounded-xl flex items-center justify-between text-left transition-colors border border-[#234A39]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1B4B38] text-[#C4A35A] font-bold text-xs flex items-center justify-center border border-[#2B5E48]">
                  K
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-none">Kolo</p>
                  <p className="text-[11px] text-[#8BA89B] mt-1">Validation stage</p>
                </div>
              </div>
              <span className="text-xs text-[#8BA89B]">▾</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 py-2 space-y-6 text-xs font-medium">
            
            {/* OVERVIEW SECTION */}
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-bold tracking-wider text-[#527365] uppercase">
                Overview
              </span>
              <Link href="/dashboard" className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#1B382C] text-white font-semibold">
                <div className="flex items-center gap-3">
                  <span className="text-sm">◇</span>
                  <span>Dashboard</span>
                </div>
              </Link>
              <Link href="#" className="flex items-center justify-between px-3 py-2 rounded-lg text-[#8BA89B] hover:text-white hover:bg-[#18382B] transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-sm">◎</span>
                  <span>Today's Mission</span>
                </div>
                <span className="bg-[#A88746] text-[#12291F] font-bold px-1.5 py-0.5 rounded-full text-[10px]">3</span>
              </Link>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#8BA89B] hover:text-white hover:bg-[#18382B] transition-colors">
                <span className="text-sm">◐</span>
                <span>Health Score</span>
              </Link>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#8BA89B] hover:text-white hover:bg-[#18382B] transition-colors">
                <span className="text-sm">→</span>
                <span>Roadmap</span>
              </Link>
            </div>

            {/* BUILD SECTION */}
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-bold tracking-wider text-[#527365] uppercase">
                Build
              </span>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#8BA89B] hover:text-white hover:bg-[#18382B] transition-colors">
                <span className="text-sm">▤</span>
                <span>Business Builder</span>
              </Link>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#8BA89B] hover:text-white hover:bg-[#18382B] transition-colors">
                <span className="text-sm">✓</span>
                <span>Validation Hub</span>
              </Link>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#8BA89B] hover:text-white hover:bg-[#18382B] transition-colors">
                <span className="text-sm">≡</span>
                <span>Assessment</span>
              </Link>
            </div>

            {/* GROW SECTION */}
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-bold tracking-wider text-[#527365] uppercase">
                Grow
              </span>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#8BA89B] hover:text-white hover:bg-[#18382B] transition-colors">
                <span className="text-sm">◔</span>
                <span>Marketing Hub</span>
              </Link>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#8BA89B] hover:text-white hover:bg-[#18382B] transition-colors">
                <span className="text-sm">↗</span>
                <span>Sales Hub</span>
              </Link>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#8BA89B] hover:text-white hover:bg-[#18382B] transition-colors">
                <span className="text-sm">₦</span>
                <span>Finance Hub</span>
              </Link>
            </div>

            {/* FUND & PROTECT SECTION */}
            <div className="space-y-1">
              <span className="px-3 text-[10px] font-bold tracking-wider text-[#527365] uppercase">
                Fund & Protect
              </span>
              <Link href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#8BA89B] hover:text-white hover:bg-[#18382B] transition-colors">
                <span className="text-sm">◆</span>
                <span>Funding Hub</span>
              </Link>
            </div>

          </nav>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-16 border-b border-[#E3EBE7] bg-white px-6 flex items-center justify-between sticky top-0 z-10">
          
          {/* Breadcrumb & Search */}
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="text-xs text-[#526E63] hidden sm:block">
              Workspace / <span className="font-semibold text-[#12291F]">Dashboard</span>
            </div>

            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search anything, docs, tasks, contacts..."
                className="w-full h-9 pl-9 pr-12 bg-[#F5F8F6] rounded-xl border border-[#E3EBE7] text-xs text-[#12291F] placeholder-[#7A9C90] focus:outline-none focus:ring-1 focus:ring-[#A88746]"
              />
              <span className="absolute left-3 top-2.5 text-xs text-[#7A9C90]">🔍</span>
              <kbd className="absolute right-3 top-2 bg-white border border-[#D5E0DA] text-[10px] text-[#7A9C90] px-1.5 py-0.5 rounded shadow-2xs">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            <div className="bg-[#EAF2ED] px-3 py-1.5 rounded-xl border border-[#D5E0DA] text-xs font-semibold text-[#12291F] flex items-center gap-1.5">
              Health <span className="font-serif text-sm">72</span> <span className="text-[10px] text-[#2E6B52]">↑</span>
            </div>

            <button className="w-9 h-9 rounded-xl border border-[#D5E0DA] bg-white flex items-center justify-center text-xs text-[#2C4A3E] relative hover:bg-gray-50">
              🔔
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#A88746] text-[#12291F] text-[9px] font-bold rounded-full flex items-center justify-center">
                5
              </span>
            </button>

            <button className="bg-[#A88746] hover:bg-[#96773B] text-[#12291F] font-semibold text-xs px-4 py-2 rounded-xl transition-all shadow-2xs">
              + Invite
            </button>
          </div>
        </header>

        {/* Dashboard Body Content */}
        <main className="p-6 lg:p-8 space-y-6 max-w-[1400px]">
          
          {/* Greeting Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="font-serif text-3xl font-semibold text-[#12291F]">
                Good evening, Amara.
              </h1>
              <p className="text-xs text-[#526E63] mt-1">
                Here's where Kolo stands today.
              </p>
            </div>
            <div className="text-xs text-[#688277] font-medium">
              Wednesday, Aug 12
            </div>
          </div>

          {/* TOP THREE CARDS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Startup Health Card */}
            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-[#E3EBE7] shadow-2xs flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#12291F]">Startup Health</span>
                <span className="text-[11px] font-semibold text-[#2E6B52] bg-[#EAF2ED] px-2 py-0.5 rounded-full">
                  +4 this week
                </span>
              </div>

              <div className="flex flex-col items-center justify-center py-2">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-[#E3EBE7]"
                      strokeWidth="3"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#1B4B38]"
                      strokeDasharray="72, 100"
                      strokeWidth="3"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="font-serif text-4xl font-bold text-[#12291F]">72</span>
                    <span className="text-[10px] text-[#688277]">of 100</span>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-xs text-[#526E63] leading-relaxed">
                  Strong for validation stage. Product is carrying you; financials are holding you back.
                </p>
                <a href="#" className="inline-block text-xs font-semibold text-[#12291F] hover:underline">
                  See what's driving it →
                </a>
              </div>
            </div>

            {/* Today's Mission Card */}
            <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-[#E3EBE7] shadow-2xs flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[#12291F]">Today's Mission</span>
                <span className="text-[11px] font-semibold text-[#A88746] flex items-center gap-1">
                  🔥 6-day streak
                </span>
              </div>

              <div className="space-y-3 py-1">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded bg-[#1B4B38] text-white flex items-center justify-center text-xs shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#688277] line-through">
                      Interview 3 gig workers
                    </p>
                    <p className="text-[11px] text-[#7A9C90]">
                      Why: closes out your riskiest validation task.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded border border-[#C8D9D1] bg-white shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-[#12291F]">
                      Draft your pricing experiment
                    </p>
                    <p className="text-[11px] text-[#526E63]">
                      Why: pricing moves both revenue and runway.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded border border-[#C8D9D1] bg-white shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-[#12291F]">
                      Review Tayo's NDA comments
                    </p>
                    <p className="text-[11px] text-[#526E63]">
                      Why: unblocks your first contractor.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <a href="#" className="inline-block text-xs font-semibold text-[#12291F] hover:underline">
                  Go to mission →
                </a>
              </div>
            </div>

            {/* AI Briefing Card */}
            <div className="lg:col-span-4 bg-[#0D221A] text-white p-6 rounded-2xl border border-[#18382B] shadow-2xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded bg-[#A88746] text-[#12291F] flex items-center justify-center text-xs font-bold">
                    ✦
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Your AI Briefing</h3>
                    <p className="text-[10px] text-[#8BA89B]">Co-Founder</p>
                  </div>
                </div>

                <p className="text-xs text-[#D8E5DF] leading-relaxed font-normal">
                  Good news first: pipeline grew ₦9M this week and your smoke test cleared its bar. The watch item is runway, now 8.4 months and tightening. I'd spend today on pricing, it's your riskiest untested assumption and it moves both revenue and runway.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button className="flex-1 bg-[#A88746] hover:bg-[#96773B] text-[#12291F] font-semibold text-xs py-2.5 rounded-xl transition-all text-center">
                  Do it
                </button>
                <button className="flex-1 bg-[#18382B] hover:bg-[#204737] text-white font-semibold text-xs py-2.5 rounded-xl border border-[#2B5E48] transition-all text-center">
                  Tell me more
                </button>
              </div>
            </div>

          </div>

          {/* METRICS METRICS GRID (5 Columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Monthly Revenue */}
            <div className="bg-white p-4 rounded-2xl border border-[#E3EBE7] shadow-2xs space-y-2">
              <span className="text-[10px] font-bold text-[#688277] uppercase tracking-wider block">
                MONTHLY REVENUE
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-2xl font-bold text-[#12291F]">₦1.6M</span>
                <span className="text-xs font-medium text-[#2E6B52]">+12%</span>
              </div>
              <div className="h-6 w-full pt-1">
                <svg className="w-full h-full text-[#1B4B38]" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path d="M0,15 Q25,18 50,10 T100,5" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
            </div>

            {/* Runway */}
            <div className="bg-white p-4 rounded-2xl border border-[#E3EBE7] shadow-2xs space-y-2">
              <span className="text-[10px] font-bold text-[#688277] uppercase tracking-wider block">
                RUNWAY
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-2xl font-bold text-[#12291F]">8.4 mo</span>
                <span className="text-xs font-medium text-[#B84A4A]">-0.6</span>
              </div>
              <div className="h-6 w-full pt-1">
                <svg className="w-full h-full text-[#B84A4A]" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path d="M0,5 Q25,8 50,12 T100,18" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
            </div>

            {/* Pipeline Value */}
            <div className="bg-white p-4 rounded-2xl border border-[#E3EBE7] shadow-2xs space-y-2">
              <span className="text-[10px] font-bold text-[#688277] uppercase tracking-wider block">
                PIPELINE VALUE
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-2xl font-bold text-[#12291F]">₦42M</span>
                <span className="text-xs font-medium text-[#2E6B52]">+₦9M</span>
              </div>
              <div className="h-6 w-full pt-1">
                <svg className="w-full h-full text-[#1B4B38]" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path d="M0,18 Q30,15 60,8 T100,2" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
            </div>

            {/* Campaign CTR */}
            <div className="bg-white p-4 rounded-2xl border border-[#E3EBE7] shadow-2xs space-y-2">
              <span className="text-[10px] font-bold text-[#688277] uppercase tracking-wider block">
                CAMPAIGN CTR
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-2xl font-bold text-[#12291F]">3.8%</span>
                <span className="text-xs font-medium text-[#2E6B52]">+0.4pt</span>
              </div>
              <div className="h-6 w-full pt-1">
                <svg className="w-full h-full text-[#1B4B38]" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path d="M0,15 Q30,12 70,8 T100,5" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
            </div>

            {/* Tasks This Week */}
            <div className="bg-white p-4 rounded-2xl border border-[#E3EBE7] shadow-2xs space-y-2">
              <span className="text-[10px] font-bold text-[#688277] uppercase tracking-wider block">
                TASKS THIS WEEK
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-2xl font-bold text-[#12291F]">14</span>
                <span className="text-xs font-medium text-[#2E6B52]">+3</span>
              </div>
              <div className="h-6 w-full pt-1">
                <svg className="w-full h-full text-[#1B4B38]" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path d="M0,12 Q30,10 60,6 T100,2" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
            </div>

          </div>

        </main>
      </div>

      {/* 3. FIXED FLOATING AI BUTTON (Bottom-Right Corner) */}
      {/* Notice the `fixed bottom-6 right-6 z-50` styling that keeps it pinned while scrolling */}
      <button 
        aria-label="Ask AI Assistant"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#A88746] hover:bg-[#96773B] text-[#12291F] rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border-2 border-[#F2F6F3]"
      >
        <span className="text-2xl font-bold">✦</span>
      </button>

    </div>
  );
}